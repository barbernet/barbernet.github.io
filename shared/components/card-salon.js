/**
BarberFlow Pro - مكون بطاقة الصالون
المسار: shared/components/card-salon.js
الدور: إنشاء وعرض بطاقات الصالونات بشكل احترافي
*/
import { auth, db } from "../../config/firebase-init.js";
import { 
    doc, 
    setDoc, 
    deleteDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { PATHS, resolvePath } from "../utils/paths.js";

/**
HTML Template لبطاقة الصالون
*/
const SALON_CARD_TEMPLATE = `
<article class="salon-card">
    <div class="salon-card__image-wrapper">
        <div class="salon-card__placeholder">
            <i class="fas fa-cut"></i>
        </div>
        <img class="salon-card__image" alt="صورة الصالون" style="display:none;" />
        <div class="salon-card__badges">
            <span class="salon-card__status" data-status="open">مفتوح الآن</span>
            <span class="salon-card__featured" style="display:none;">
                <i class="fas fa-crown"></i> مميز
            </span>
        </div>
        <button class="salon-card__favorite" aria-label="إضافة للمفضلة">
            <i class="far fa-heart"></i>
        </button>
    </div>
    <div class="salon-card__content">
        <div class="salon-card__header">
            <h3 class="salon-card__name">اسم الصالون</h3>
            <div class="salon-card__rating">
                <i class="fas fa-star"></i>
                <span class="salon-card__rating-value">5.0</span>
                <span class="salon-card__rating-count">(0)</span>
            </div>
        </div>
        <div class="salon-card__info">
            <div class="salon-card__location">
                <i class="fas fa-map-marker-alt"></i>
                <span>الموقع</span>
            </div>
            <div class="salon-card__services">
                <i class="fas fa-list"></i>
                <span>0 خدمة</span>
            </div>
        </div>
        <div class="salon-card__footer">
            <div class="salon-card__price">
                <span class="salon-card__price-label">يبدأ من</span>
                <span class="salon-card__price-value">0 DH</span>
            </div>
            <a class="salon-card__cta" href="#">
                <span>التفاصيل</span>
                <i class="fas fa-arrow-left"></i>
            </a>
        </div>
    </div>
</article>
`;

/**
التحقق من حالة المفضلة للصالون بالنسبة للمستخدم الحالي
@param {string} salonId - معرف الصالون
@returns {Promise<boolean>}
*/
async function checkSalonFavorite(salonId) {
    const userId = auth.currentUser?.uid;
    if (!userId) return false;
    
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", `salon_${salonId}`);
        const favoriteDoc = await getDoc(favoriteRef);
        return favoriteDoc.exists();
    } catch (error) {
        console.error("Error checking salon favorite:", error);
        return false;
    }
}

/**
تبديل حالة المفضلة للصالون (إضافة/حذف)
@param {string} salonId - معرف الصالون
@param {boolean} isLiked - الحالة الجديدة
@returns {Promise<boolean>} نجاح العملية
*/
async function toggleSalonFavorite(salonId, isLiked) {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        console.warn("User must be logged in to add favorites");
        return false;
    }
    
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", `salon_${salonId}`);
        
        if (isLiked) {
            await setDoc(favoriteRef, {
                salonId: salonId,
                itemType: "salon",
                addedAt: new Date().toISOString()
            });
        } else {
            await deleteDoc(favoriteRef);
        }
        return true;
    } catch (error) {
        console.error("Error toggling salon favorite:", error);
        return false;
    }
}

/**
إنشاء بطاقة صالون
@param {Object} salon - بيانات الصالون
@param {string} id - معرف الصالون
@returns {HTMLElement|null}
*/
export async function createSalonCard(salon, id) {
    const salonId = id || salon?.id;
    if (!salonId) {
        console.error('[SalonCard] ❌ المعرف (id) غير مُعرّف!');
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(SALON_CARD_TEMPLATE, 'text/html');
    const card = doc.querySelector('.salon-card');

    try {
        // ===== صورة الغلاف =====
        const img = card.querySelector('.salon-card__image');
        const placeholder = card.querySelector('.salon-card__placeholder');
        if (img && placeholder) {
            if (salon.coverImage) {
                img.src = salon.coverImage;
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

        // ===== اسم الصالون (تم التوحيد: name فقط) =====
        const nameElement = card.querySelector('.salon-card__name');
        if (nameElement) {
            nameElement.textContent = salon.name || "صالون غير مسمى";
        }

        // ===== الموقع (تم التوحيد: city فقط) =====
        const locationElement = card.querySelector('.salon-card__location span');
        if (locationElement) {
            locationElement.textContent = salon.city || "الموقع غير محدد";
        }

        // ===== التقييم =====
        const ratingElement = card.querySelector('.salon-card__rating-value');
        const ratingCount = card.querySelector('.salon-card__rating-count');
        if (ratingElement) {
            const rating = parseFloat(salon.rating) || 5.0;
            ratingElement.textContent = rating.toFixed(1);
        }
        if (ratingCount) {
            const count = salon.reviewCount || 0;
            ratingCount.textContent = `(${count})`;
        }

        // ===== عدد الخدمات =====
        const servicesElement = card.querySelector('.salon-card__services span');
        if (servicesElement) {
            const count = salon.services?.length || 0;
            servicesElement.textContent = `${count} ${count === 1 ? 'خدمة' : 'خدمات'}`;
        }

        // ===== أقل سعر =====
        const minPriceElement = card.querySelector('.salon-card__price-value');
        if (minPriceElement) {
            let minPrice = "0";
            if (salon.services && salon.services.length > 0) {
                const prices = salon.services.map(s => parseFloat(s.price) || 0);
                minPrice = Math.min(...prices).toString();
            }
            minPriceElement.textContent = `${minPrice} DH`;
        }

        // ===== حالة الصالون (مفتوح/مغلق) =====
        const statusBadge = card.querySelector('.salon-card__status');
        if (statusBadge) {
            const isOpen = isSalonOpen(salon.workingHours);
            statusBadge.textContent = isOpen ? 'مفتوح الآن' : 'مغلق حالياً';
            statusBadge.dataset.status = isOpen ? 'open' : 'closed';
        }

        // ===== Badge مميز =====
        const featuredBadge = card.querySelector('.salon-card__featured');
        if (featuredBadge && salon.isFeatured) {
            featuredBadge.style.display = 'flex';
        }

        // ===== زر الإعجاب (تم إصلاح المنطق) =====
        const favoriteBtn = card.querySelector('.salon-card__favorite');
        const favoriteIcon = favoriteBtn?.querySelector('i');
        
        // التحقق من حالة المفضلة من قاعدة البيانات (خاصة بالمستخدم)
        let isLiked = await checkSalonFavorite(salonId);
        
        const updateFavoriteUI = (liked) => {
            if (favoriteIcon) {
                favoriteIcon.classList.toggle('fas', liked);
                favoriteIcon.classList.toggle('far', !liked);
            }
            if (favoriteBtn) {
                favoriteBtn.classList.toggle('active', liked);
            }
        };
        
        updateFavoriteUI(isLiked);
        
        if (favoriteBtn) {
            favoriteBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // التحقق من تسجيل الدخول
                if (!auth.currentUser) {
                    window.location.href = resolvePath('LOGIN');
                    return;
                }
                
                const newLikedState = !isLiked;
                updateFavoriteUI(newLikedState);
                
                const success = await toggleSalonFavorite(salonId, newLikedState);
                
                if (success) {
                    isLiked = newLikedState;
                } else {
                    // التراجع عن التغيير في حالة الفشل
                    isLiked = !newLikedState;
                    updateFavoriteUI(isLiked);
                }
            };
        }

        // ===== زر عرض التفاصيل =====
        const ctaBtn = card.querySelector('.salon-card__cta');
        if (ctaBtn) {
            ctaBtn.href = `${resolvePath('DETAILS_SALON')}?id=${salonId}`;
            ctaBtn.onclick = (e) => {
                e.stopPropagation();
            };
        }

        // ===== إضافة تأثيرات التفاعل =====
        addInteractionEffects(card);
        return card;
    } catch (error) {
        console.error("[SalonCard] Critical Processing Error:", error);
        return null;
    }
}

/**
التحقق من حالة الصالون (مفتوح/مغلق)
*/
function isSalonOpen(hours) {
    if (!hours?.open || !hours?.close) return true;
    const now = new Date();
    const curr = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = hours.open.split(':').map(Number);
    const [ch, cm] = hours.close.split(':').map(Number);
    const ot = oh * 60 + om;
    const ct = ch * 60 + cm;
    return ct > ot ? (curr >= ot && curr < ct) : (curr >= ot || curr < ct);
}

/**
إضافة تأثيرات التفاعل (Animations)
*/
function addInteractionEffects(card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    requestAnimationFrame(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

    if (window.matchMedia('(hover: hover)').matches) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    }
}

/**
إنشاء عدة بطاقات صالون
*/
export async function createSalonCards(salons) {
    const cards = [];
    for (const salon of salons) {
        const card = await createSalonCard(salon, salon.id);
        if (card) cards.push(card);
    }
    return cards;
}

