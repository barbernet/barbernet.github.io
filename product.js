/**
 * BarberFlow Pro - صفحة تفاصيل المنتج
 * المسار: product.js
 * ✅ محدّث: استخدام card-product.js الجديد + جلب التقييم من reviews
 * ✅ حذف breadcrumb + إضافة زر العودة للخلف
 */

import { supabase } from './config/supabase-init.js';
import { showNotification } from './shared/utils/notifications.js';
import { PATHS, resolvePath } from './shared/utils/paths.js';
import { getCurrentUserId } from './middleware/auth/auth-state.js';

// ============================================
// المتغيرات العامة
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
let currentUser = null;
let productData = null;
let currentImageIndex = 0;
let selectedQuantity = 1;

// ============================================
// عناصر DOM
// ============================================
const mainImage = document.getElementById('mainProductImage');
const imagePlaceholder = document.getElementById('imagePlaceholder');
const thumbnailList = document.getElementById('thumbnailList');

// ============================================
// زر العودة للخلف
// ============================================
const backBtn = document.getElementById('backBtn');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        if (document.referrer && document.referrer.includes(window.location.hostname)) {
            window.history.back();
        } else {
            window.location.href = resolvePath('SHOP');
        }
    });
}

// ============================================
// التحقق من معرف المنتج
// ============================================
if (!productId) {
    showNotification("الرابط غير صالح، لم يتم تحديد المنتج", "error");
    setTimeout(() => {
        window.location.replace(resolvePath('SHOP'));
    }, 2000);
}

// ============================================
// مراقبة حالة المصادقة (Supabase)
// ============================================
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    if (productId) {
        await loadProductDetails();
    }
});

// ============================================
// جلب متوسط تقييم المنتج من جدول reviews
// ✅ محدّث حسب guide.md
// ============================================
async function fetchProductRating(productId) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', productId);

        if (error || !data || data.length === 0) {
            return { rating: 0, count: 0 };
        }

        const count = data.length;
        const rating = data.reduce((sum, r) => sum + (r.rating || 0), 0) / count;
        return { rating, count };
    } catch (error) {
        console.error("Error fetching product rating:", error);
        return { rating: 0, count: 0 };
    }
}

// ============================================
// تحميل تفاصيل المنتج
// ============================================
async function loadProductDetails() {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error || !product) {
            showNotification("هذا المنتج غير موجود أو تم حذفه", "error");
            setTimeout(() => {
                window.location.replace(resolvePath('SHOP'));
            }, 2000);
            return;
        }

        productData = { id: productId, ...product };
        renderProductInfo(productData);
        renderGallery(productData.image_url);
        await loadReviews();
        await loadRelatedProducts();
        setupEventListeners();
    } catch (error) {
        console.error("خطأ في تحميل تفاصيل المنتج:", error);
        showNotification("حدث خطأ في تحميل البيانات", "error");
    }
}

// ============================================
// عرض معلومات المنتج
// ✅ محدّث: استخدام الحقول الصحيحة من guide.md
// ============================================
function renderProductInfo(data) {
    // العنوان
    document.title = `${data.name || 'منتج'} | BarberFlow Pro`;
    setText('productName', data.name || "منتج غير مسمى");
    setText('productCategory', getCategoryName(data.category));
    setText('productDescription', data.description || "لا يوجد وصف متاح.");
    setText('detailedDescription', data.description || "لا يوجد وصف تفصيلي.");
    setText('productBrand', data.brand || "غير محدد");

    // السعر
    const price = parseFloat(data.price) || 0;
    const oldPrice = parseFloat(data.old_price) || 0;
    setText('currentPrice', `${price.toFixed(2)} DH`);
    if (oldPrice > 0 && oldPrice > price) {
        setText('oldPrice', `${oldPrice.toFixed(2)} DH`);
        document.getElementById('oldPrice').style.display = 'inline';
        const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
        setText('discountText', `-${discount}%`);
        showElement('discountBadge');
    }

    // شارة جديد
    if (data.is_new) {
        showElement('newBadge');
    }

    // التقييم - ✅ جلب من جدول reviews
    fetchProductRating(productId).then(({ rating, count }) => {
        renderStars('productStars', rating);
        setText('ratingCount', `(${count} تقييم)`);
    });

    // المخزون
    const stockElement = document.getElementById('productStock');
    if (data.stock_quantity > 0) {
        stockElement.textContent = `متوفر (${data.stock_quantity})`;
        stockElement.className = 'stock-status in-stock';
    } else {
        stockElement.textContent = 'غير متوفر';
        stockElement.className = 'stock-status out-of-stock';
    }

    // المميزات
    if (data.features && data.features.length > 0) {
        const featuresContainer = document.getElementById('productFeatures');
        if (featuresContainer) {
            featuresContainer.innerHTML = data.features.map(f => `
                <div class="feature-item">
                    <i class="fas fa-check"></i>
                    <span>${f}</span>
                </div>
            `).join('');
        }
    }

    // المواصفات
    if (data.specifications) {
        const specsTable = document.getElementById('specsTable');
        if (specsTable) {
            specsTable.innerHTML = Object.entries(data.specifications).map(([key, value]) => `
                <tr>
                    <td class="spec-label">${key}</td>
                    <td class="spec-value">${value}</td>
                </tr>
            `).join('');
        }
    }
}

// ============================================
// عرض معرض الصور
// ✅ محدّث: استخدام image_url مباشرة (حقل واحد)
// ============================================
function renderGallery(imageUrl) {
    if (!imageUrl) {
        mainImage.style.display = 'none';
        imagePlaceholder.style.display = 'flex';
        return;
    }

    mainImage.style.display = 'block';
    imagePlaceholder.style.display = 'none';
    mainImage.src = imageUrl;
    currentImageIndex = 0;

    // إخفاء قائمة الصور المصغرة (لأن لدينا صورة واحدة فقط)
    if (thumbnailList) {
        thumbnailList.style.display = 'none';
    }

    // معالجة خطأ تحميل الصورة
    mainImage.onerror = () => {
        mainImage.style.display = 'none';
        imagePlaceholder.style.display = 'flex';
        mainImage.onerror = null;
    };
}

// ============================================
// تحميل التقييمات
// ============================================
async function loadReviews() {
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderReviewsSummary(reviews || []);
        renderReviewsList(reviews || []);
    } catch (error) {
        console.error("خطأ في تحميل التقييمات:", error);
    }
}

// ============================================
// ملخص التقييمات
// ============================================
function renderReviewsSummary(reviews) {
    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avgRating = totalRating / reviews.length;

    setText('bigRating', avgRating.toFixed(1));
    renderStars('bigStars', avgRating);
    setText('totalReviews', `${reviews.length} تقييم`);
    setText('reviewsTabBadge', reviews.length);

    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
        const rating = Math.round(r.rating || 0);
        if (rating >= 1 && rating <= 5) {
            ratingCounts[rating - 1]++;
        }
    });

    const barsContainer = document.getElementById('ratingBars');
    if (barsContainer) {
        barsContainer.innerHTML = ratingCounts.map((count, index) => {
            const star = index + 1;
            const percentage = (count / reviews.length) * 100;
            return `
                <div class="rating-bar-row">
                    <span class="star-label">${star} <i class="fas fa-star"></i></span>
                    <div class="rating-bar">
                        <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="bar-count">${count}</span>
                </div>
            `;
        }).join('');
    }
}

// ============================================
// عرض قائمة التقييمات
// ============================================
function renderReviewsList(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-reviews">
                <i class="fas fa-comment-slash"></i>
                <p>لا توجد تقييمات بعد. كن أول من يقيّم!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reviews.map(review => {
        const date = new Date(review.created_at);
        const formattedDate = date.toLocaleDateString('ar-MA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="reviewer-info">
                        <strong>${review.reviewer_name || 'زائر'}</strong>
                        <div class="review-meta">
                            <div class="review-stars">${generateStarsHTML(review.rating || 0)}</div>
                            <span class="review-date">${formattedDate}</span>
                        </div>
                    </div>
                </div>
                <p class="review-text">${review.comment || ''}</p>
            </div>
        `;
    }).join('');
}

// ============================================
// تحميل المنتجات المشابهة
// ============================================
async function loadRelatedProducts() {
    try {
        const category = productData.category;
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('category', category)
            .neq('id', productId)
            .eq('is_available', true)
            .order('created_at', { ascending: false })
            .limit(4);

        if (error) throw error;

        const grid = document.getElementById('relatedProductsGrid');
        if (!grid) return;

        if (!products || products.length === 0) {
            grid.innerHTML = '<p class="empty-state">لا توجد منتجات مشابهة</p>';
            return;
        }

        grid.innerHTML = products.map(p => `
            <div class="store-card" data-id="${p.id}">
                <div class="store-card__image-wrapper">
                    <div class="store-card__placeholder">
                        <i class="fas fa-box-open"></i>
                    </div>
                    ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy" class="store-card__image">` : ''}
                    ${p.old_price ? `<span class="store-card__discount">-${Math.round(((p.old_price - p.price) / p.old_price) * 100)}%</span>` : ''}
                </div>
                <div class="store-card__content">
                    <div class="store-card__category">
                        <i class="fas fa-tag"></i>
                        <span>${getCategoryName(p.category)}</span>
                    </div>
                    <h3 class="store-card__name">${p.name}</h3>
                    <div class="store-card__price-wrapper">
                        <div class="store-card__price">
                            <span class="store-card__price-current">${p.price} DH</span>
                        </div>
                        <button class="store-card__add-cart" data-product-id="${p.id}">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // أحداث إضافة للسلة
        grid.querySelectorAll('.store-card__add-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                addToCart(btn.dataset.productId);
            });
        });
    } catch (error) {
        console.error("خطأ في تحميل المنتجات المشابهة:", error);
    }
}

// ============================================
// إضافة للسلة
// ============================================
function addToCart(productId, quantity = 1) {
    const cart = JSON.parse(localStorage.getItem('bf-cart') || '[]');
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + quantity;
    } else {
        cart.push({ id: productId, quantity });
    }

    localStorage.setItem('bf-cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('bf-cart-updated'));
    showNotification("تمت إضافة المنتج إلى السلة", "success");
}

// ============================================
// إعداد مستمعي الأحداث
// ============================================
function setupEventListeners() {
    // أزرار الكمية
    document.getElementById('decreaseQty')?.addEventListener('click', () => {
        if (selectedQuantity > 1) {
            selectedQuantity--;
            document.getElementById('quantityInput').value = selectedQuantity;
        }
    });

    document.getElementById('increaseQty')?.addEventListener('click', () => {
        if (selectedQuantity < 10) {
            selectedQuantity++;
            document.getElementById('quantityInput').value = selectedQuantity;
        }
    });

    document.getElementById('quantityInput')?.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= 10) {
            selectedQuantity = value;
        } else {
            e.target.value = selectedQuantity;
        }
    });

    // زر إضافة للسلة
    document.getElementById('addToCartBtn')?.addEventListener('click', () => {
        if (!productData) return;
        if (productData.stock_quantity <= 0) {
            showNotification("المنتج غير متوفر حالياً", "error");
            return;
        }
        addToCart(productId, selectedQuantity);
    });

    // زر المفضلة
    document.getElementById('addToWishlistBtn')?.addEventListener('click', async () => {
        if (!currentUser) {
            showNotification("يرجى تسجيل الدخول لإضافة المنتج للمفضلة", "warning");
            setTimeout(() => {
                window.location.href = resolvePath('LOGIN');
            }, 1500);
            return;
        }

        const btn = document.getElementById('addToWishlistBtn');
        const icon = btn.querySelector('i');
        const isFavorite = icon.classList.contains('fas');

        try {
            if (isFavorite) {
                // إزالة من المفضلة
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('item_id', productId)
                    .eq('item_type', 'product');

                if (error) throw error;

                icon.classList.remove('fas');
                icon.classList.add('far');
                btn.classList.remove('active');
                showNotification("تمت إزالة المنتج من المفضلة", "info");
            } else {
                // إضافة للمفضلة
                const { error } = await supabase
                    .from('favorites')
                    .insert({
                        user_id: currentUser.id,
                        item_id: productId,
                        item_type: 'product'
                    });

                if (error) throw error;

                icon.classList.remove('far');
                icon.classList.add('fas');
                btn.classList.add('active');
                showNotification("تمت إضافة المنتج للمفضلة", "success");
            }
        } catch (error) {
            console.error("خطأ في تحديث المفضلة:", error);
            showNotification("حدث خطأ في تحديث المفضلة", "error");
        }
    });

    // زر المشاركة
    document.getElementById('shareProductBtn')?.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: productData.name,
                text: productData.description,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            showNotification("تم نسخ رابط المنتج", "success");
        }
    });

    // زر التكبير
    document.getElementById('zoomBtn')?.addEventListener('click', () => {
        const zoomModal = document.getElementById('zoomModal');
        const zoomedImage = document.getElementById('zoomedImage');
        zoomedImage.src = mainImage.src;
        zoomModal.classList.add('active');
    });

    document.getElementById('closeZoomModal')?.addEventListener('click', () => {
        document.getElementById('zoomModal').classList.remove('active');
    });

    // تبويبات التفاصيل
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });

    // زر العودة للأعلى
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    scrollTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn?.classList.add('visible');
        } else {
            scrollTopBtn?.classList.remove('visible');
        }
    });

    // إغلاق النوافذ عند النقر خارجها
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // تحديث الروابط الديناميكية
    updateDynamicLinks();
}

// ============================================
// تحديث الروابط الديناميكية
// ============================================
function updateDynamicLinks() {
    const links = document.querySelectorAll('[data-path]');
    links.forEach(link => {
        const key = link.getAttribute('data-path');
        const fullPath = resolvePath(key);
        link.setAttribute('href', fullPath);
    });
}

// ============================================
// دوال مساعدة
// ============================================
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

function renderStars(containerId, rating) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = generateStarsHTML(rating);
}

function generateStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalf) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

function getCategoryName(cat) {
    const map = {
        tools: 'أدوات ومعدات',
        cosmetics: 'مستحضرات تجميل',
        haircare: 'العناية بالشعر',
        skincare: 'العناية بالبشرة',
        accessories: 'إكسسوارات'
    };
    return map[cat] || cat || 'عام';
}

