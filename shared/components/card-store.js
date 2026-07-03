/**
 * BarberFlow Pro - مكون بطاقة المنتج/المتجر
 * المسار: shared/components/js/card-store.js
 * الدور: إنشاء وعرض بطاقات المنتجات بشكل احترافي
 */

import { PATHS, resolvePath } from "../../../shared/js/paths.js";

/**
 * HTML Template لبطاقة المنتج
 */
const STORE_CARD_TEMPLATE = `
    <article class="store-card">
        <div class="store-card__image-wrapper">
            <div class="store-card__placeholder">
                <i class="fas fa-box-open"></i>
            </div>
            <img class="store-card__image" alt="صورة المنتج" style="display:none;" />
            
            <div class="store-card__badges">
                <span class="store-card__discount" style="display:none;">-0%</span>
                <span class="store-card__new" style="display:none;">جديد</span>
            </div>
            
            <button class="store-card__quick-view" aria-label="عرض سريع">
                <i class="fas fa-eye"></i>
            </button>
        </div>
        
        <div class="store-card__content">
            <div class="store-card__category">
                <i class="fas fa-tag"></i>
                <span>فئة المنتج</span>
            </div>
            
            <h3 class="store-card__name">اسم المنتج</h3>
            
            <div class="store-card__rating">
                <div class="store-card__stars">
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="far fa-star"></i>
                </div>
                <span class="store-card__rating-value">4.0</span>
            </div>
            
            <div class="store-card__price-wrapper">
                <div class="store-card__price">
                    <span class="store-card__price-current">0 DH</span>
                    <span class="store-card__price-old" style="display:none;">0 DH</span>
                </div>
                <button class="store-card__add-cart" aria-label="أضف إلى السلة">
                    <i class="fas fa-cart-plus"></i>
                </button>
            </div>
            
            <a class="store-card__cta" href="#">
                <span>عرض التفاصيل</span>
                <i class="fas fa-arrow-left"></i>
            </a>
        </div>
    </article>
`;

/**
 * إنشاء بطاقة منتج
 * @param {Object} product - بيانات المنتج
 * @param {string} id - معرف المنتج
 * @returns {HTMLElement|null}
 */
export async function createStoreCard(product, id) {
    const productId = id || product?.id;
    if (!productId) {
        console.error('[StoreCard] ❌ المعرف (id) غير مُعرّف!');
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(STORE_CARD_TEMPLATE, 'text/html');
    const card = doc.querySelector('.store-card');

    try {
        // ===== صورة المنتج =====
        const img = card.querySelector('.store-card__image');
        const placeholder = card.querySelector('.store-card__placeholder');
        
        if (img && placeholder) {
            if (product.image || product.coverImage) {
                img.src = product.image || product.coverImage;
                img.style.display = 'block';
                placeholder.style.display = 'none';
                img.onerror = () => {
                    img.style.display = 'none';
                    placeholder.style.display = 'flex';
                    img.onerror = null;
                };
            } else {
                img.style.display = 'none';
                placeholder.style.display = 'flex';
            }
        }

        // ===== اسم المنتج =====
        const nameElement = card.querySelector('.store-card__name');
        if (nameElement) {
            nameElement.textContent = product.name || product.productName || "منتج غير مسمى";
        }

        // ===== الفئة =====
        const categoryElement = card.querySelector('.store-card__category span');
        if (categoryElement) {
            categoryElement.textContent = product.category || product.categoryName || "عام";
        }

        // ===== التقييم =====
        const ratingElement = card.querySelector('.store-card__rating-value');
        const starsContainer = card.querySelector('.store-card__stars');
        if (ratingElement) {
            const rating = parseFloat(product.rating) || 4.0;
            ratingElement.textContent = rating.toFixed(1);
            
            // تحديث النجوم
            if (starsContainer) {
                const fullStars = Math.floor(rating);
                const hasHalf = rating % 1 >= 0.5;
                const stars = starsContainer.querySelectorAll('i');
                stars.forEach((star, index) => {
                    star.className = 'fas fa-star';
                    if (index >= fullStars) {
                        if (index === fullStars && hasHalf) {
                            star.className = 'fas fa-star-half-alt';
                        } else {
                            star.className = 'far fa-star';
                        }
                    }
                });
            }
        }

        // ===== السعر =====
        const priceCurrent = card.querySelector('.store-card__price-current');
        const priceOld = card.querySelector('.store-card__price-old');
        const discountBadge = card.querySelector('.store-card__discount');
        
        if (priceCurrent) {
            const price = parseFloat(product.price) || 0;
            priceCurrent.textContent = `${price} DH`;
        }
        
        if (product.oldPrice || product.originalPrice) {
            const oldPrice = parseFloat(product.oldPrice || product.originalPrice);
            if (priceOld) {
                priceOld.textContent = `${oldPrice} DH`;
                priceOld.style.display = 'block';
            }
            
            // حساب نسبة الخصم
            if (discountBadge && priceCurrent) {
                const current = parseFloat(product.price) || 0;
                const discount = Math.round(((oldPrice - current) / oldPrice) * 100);
                if (discount > 0) {
                    discountBadge.textContent = `-${discount}%`;
                    discountBadge.style.display = 'block';
                }
            }
        }

        // ===== Badge جديد =====
        const newBadge = card.querySelector('.store-card__new');
        if (newBadge && product.isNew) {
            newBadge.style.display = 'block';
        }

        // ===== زر إضافة للسلة =====
        const addToCartBtn = card.querySelector('.store-card__add-cart');
        if (addToCartBtn) {
            addToCartBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product);
            };
        }

        // ===== زر العرض السريع =====
        const quickViewBtn = card.querySelector('.store-card__quick-view');
        if (quickViewBtn) {
            quickViewBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showQuickView(product);
            };
        }

        // ===== رابط التفاصيل =====
        const ctaBtn = card.querySelector('.store-card__cta');
        if (ctaBtn) {
            ctaBtn.href = `${resolvePath('SHOP')}?id=${productId}`;
        }

        // ===== تأثيرات التفاعل =====
        addInteractionEffects(card);

        return card;
    } catch (error) {
        console.error("[StoreCard] Critical Processing Error:", error);
        return null;
    }
}

/**
 * إضافة المنتج إلى السلة
 */
function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem('bf-cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name || product.productName,
            price: product.price,
            image: product.image || product.coverImage,
            quantity: 1
        });
    }
    
    localStorage.setItem('bf-cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('bf-cart-updated'));
    
    // تنبيه بصري
    showAddToCartFeedback();
}

/**
 * عرض تنبيه إضافة للسلة
 */
function showAddToCartFeedback() {
    const notification = document.createElement('div');
    notification.className = 'add-to-cart-feedback';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>تمت إضافة المنتج إلى السلة</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/**
 * عرض نافذة العرض السريع
 */
function showQuickView(product) {
    // يمكن تنفيذها لاحقاً
    console.log('Quick view for:', product);
}

/**
 * إضافة تأثيرات التفاعل
 */
function addInteractionEffects(card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    requestAnimationFrame(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });
}

/**
 * إنشاء عدة بطاقات منتجات
 */
export async function createStoreCards(products) {
    const cards = [];
    for (const product of products) {
        const card = await createStoreCard(product, product.id);
        if (card) cards.push(card);
    }
    return cards;
}

