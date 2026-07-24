/**
 * BarberFlow Pro - صفحة تفاصيل المنتج
 * المسار: product.js
 * المميزات:
 * - معرض صور تفاعلي
 * - نظام تقييم
 * - إضافة للسلة
 * - منتجات مشابهة
 */

import { auth, db } from "./config/firebase-init.js";
import {
    doc, getDoc, collection, query, where, orderBy, limit,
    addDoc, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "./shared/js/notifications.js";
import { PATHS, resolvePath } from "./shared/utils/paths.js";

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
// التحقق من معرف المنتج
// ============================================
if (!productId) {
    showNotification("الرابط غير صالح، لم يتم تحديد المنتج", "error");
    setTimeout(() => {
        window.location.replace(resolvePath('EXPLORE_STORE'));
    }, 2000);
}

// ============================================
// مراقبة حالة المصادقة
// ============================================
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (productId) {
        loadProductDetails();
    }
});

// ============================================
// تحميل تفاصيل المنتج
// ============================================
async function loadProductDetails() {
    try {
        const snap = await getDoc(doc(db, "products", productId));
        
        if (!snap.exists()) {
            showNotification("هذا المنتج غير موجود أو تم حذفه", "error");
            setTimeout(() => {
                window.location.replace(resolvePath('EXPLORE_STORE'));
            }, 2000);
            return;
        }

        productData = { id: productId, ...snap.data() };
        renderProductInfo(productData);
        renderGallery(productData.images || [productData.imageUrl]);
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
// ============================================
function renderProductInfo(data) {
    // العنوان
    document.title = `${data.name || 'منتج'} | BarberFlow Pro`;
    setText('breadcrumbProduct', data.name || 'المنتج');
    setText('productName', data.name || "منتج غير مسمى");
    setText('productCategory', getCategoryName(data.category));
    setText('productDescription', data.description || "لا يوجد وصف متاح.");
    setText('detailedDescription', data.detailedDescription || data.description || "لا يوجد وصف تفصيلي.");
    setText('productBrand', data.brand || "غير محدد");

    // السعر
    const price = parseFloat(data.price) || 0;
    const oldPrice = parseFloat(data.oldPrice) || 0;
    setText('currentPrice', `${price} DH`);
    
    if (oldPrice > 0 && oldPrice > price) {
        setText('oldPrice', `${oldPrice} DH`);
        document.getElementById('oldPrice').style.display = 'inline';
        
        const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
        setText('discountText', `-${discount}%`);
        showElement('discountBadge');
    }

    // شارة جديد
    if (data.isNew) {
        showElement('newBadge');
    }

    // التقييم
    const rating = parseFloat(data.rating) || 0;
    const reviewsCount = data.reviewsCount || 0;
    renderStars('productStars', rating);
    setText('ratingCount', `(${reviewsCount} تقييم)`);

    // المخزون
    const stockElement = document.getElementById('productStock');
    if (data.stock > 0) {
        stockElement.textContent = `متوفر (${data.stock})`;
        stockElement.className = 'in-stock';
    } else {
        stockElement.textContent = 'غير متوفر';
        stockElement.className = 'out-of-stock';
    }

    // المميزات
    if (data.features && data.features.length > 0) {
        const featuresContainer = document.getElementById('productFeatures');
        featuresContainer.innerHTML = data.features.map(f => `
            <div class="feature-item">
                <i class="fas fa-check"></i>
                <span>${f}</span>
            </div>
        `).join('');
    }

    // المواصفات
    if (data.specifications) {
        const specsTable = document.getElementById('specsTable');
        specsTable.innerHTML = Object.entries(data.specifications).map(([key, value]) => `
            <tr>
                <td class="spec-label">${key}</td>
                <td class="spec-value">${value}</td>
            </tr>
        `).join('');
    }
}

// ============================================
// عرض معرض الصور
// ============================================
function renderGallery(images) {
    if (!images || images.length === 0) {
        mainImage.style.display = 'none';
        imagePlaceholder.style.display = 'flex';
        return;
    }

    mainImage.style.display = 'block';
    imagePlaceholder.style.display = 'none';
    mainImage.src = images[0];
    currentImageIndex = 0;

    // الصور المصغرة
    if (images.length > 1) {
        thumbnailList.innerHTML = images.map((img, index) => `
            <div class="thumbnail-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${img}" alt="صورة ${index + 1}">
            </div>
        `).join('');

        thumbnailList.querySelectorAll('.thumbnail-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                changeMainImage(index);
            });
        });
    }
}

// ============================================
// تغيير الصورة الرئيسية
// ============================================
function changeMainImage(index) {
    const images = productData.images || [productData.imageUrl];
    if (!images[index]) return;

    currentImageIndex = index;
    mainImage.src = images[index];

    thumbnailList.querySelectorAll('.thumbnail-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// ============================================
// تحميل التقييمات
// ============================================
async function loadReviews() {
    try {
        const q = query(
            collection(db, "products", productId, "reviews"),
            orderBy("timestamp", "desc")
        );
        const snap = await getDocs(q);
        const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        renderReviewsSummary(reviews);
        renderReviewsList(reviews);
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

// ============================================
// عرض قائمة التقييمات
// ============================================
function renderReviewsList(reviews) {
    const container = document.getElementById('reviewsList');
    
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
        const date = review.timestamp?.toDate ? review.timestamp.toDate() : new Date();
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
                        <strong>${review.userName || 'زائر'}</strong>
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
        const q = query(
            collection(db, "products"),
            where("category", "==", category),
            orderBy("createdAt", "desc"),
            limit(4)
        );
        const snap = await getDocs(q);
        const products = snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => p.id !== productId);

        const grid = document.getElementById('relatedProductsGrid');
        
        if (products.length === 0) {
            grid.innerHTML = '<p class="empty-state">لا توجد منتجات مشابهة</p>';
            return;
        }

        grid.innerHTML = products.map(p => `
            <div class="product-card" data-id="${p.id}">
                <div class="product-image-wrapper">
                    <img src="${p.imageUrl || 'assets/images/product-placeholder.png'}" alt="${p.name}" loading="lazy">
                    ${p.discount ? `<span class="discount-badge">-${p.discount}%</span>` : ''}
                </div>
                <div class="product-details">
                    <span class="product-category">${getCategoryName(p.category)}</span>
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-footer">
                        <div class="price-group">
                            ${p.oldPrice ? `<span class="old-price">${p.oldPrice} DH</span>` : ''}
                            <span class="current-price">${p.price} DH</span>
                        </div>
                        <button class="add-to-cart-btn" data-product-id="${p.id}">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // أحداث إضافة للسلة
        grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
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
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + quantity;
    } else {
        cart.push({ id: productId, quantity });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
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
        
        if (productData.stock <= 0) {
            showNotification("المنتج غير متوفر حالياً", "error");
            return;
        }

        addToCart(productId, selectedQuantity);
    });

    // زر المفضلة
    document.getElementById('addToWishlistBtn')?.addEventListener('click', () => {
        if (!currentUser) {
            showNotification("يرجى تسجيل الدخول لإضافة المنتج للمفضلة", "warning");
            setTimeout(() => {
                window.location.href = resolvePath('LOGIN');
            }, 1500);
            return;
        }

        const btn = document.getElementById('addToWishlistBtn');
        const icon = btn.querySelector('i');
        
        if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            btn.classList.add('active');
            showNotification("تمت إضافة المنتج للمفضلة", "success");
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            btn.classList.remove('active');
            showNotification("تمت إزالة المنتج من المفضلة", "info");
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
    document.getElementById('scrollTopBtn')?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // إغلاق النوافذ عند النقر خارجها
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
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

