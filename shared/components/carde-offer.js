/**
 * BarberFlow Pro - مكون بطاقة العرض
 * المسار: shared/components/js/card-offer.js
 * الدور: إنشاء وعرض بطاقات العروض والخصومات
 */

import { PATHS, resolvePath } from "../../../shared/js/paths.js";

/**
 * HTML Template لبطاقة العرض
 */
const OFFER_CARD_TEMPLATE = `
    <article class="offer-card">
        <div class="offer-card__background">
            <div class="offer-card__pattern"></div>
        </div>
        
        <div class="offer-card__content">
            <div class="offer-card__header">
                <div class="offer-card__discount-badge">
                    <span class="offer-card__discount-value">0%</span>
                    <span class="offer-card__discount-label">خصم</span>
                </div>
                <div class="offer-card__icon">
                    <i class="fas fa-gift"></i>
                </div>
            </div>
            
            <h3 class="offer-card__title">عنوان العرض</h3>
            <p class="offer-card__description">وصف العرض</p>
            
            <div class="offer-card__timer" style="display:none;">
                <div class="offer-card__timer-item">
                    <span class="offer-card__timer-value" data-days>00</span>
                    <span class="offer-card__timer-label">يوم</span>
                </div>
                <div class="offer-card__timer-item">
                    <span class="offer-card__timer-value" data-hours>00</span>
                    <span class="offer-card__timer-label">ساعة</span>
                </div>
                <div class="offer-card__timer-item">
                    <span class="offer-card__timer-value" data-minutes>00</span>
                    <span class="offer-card__timer-label">دقيقة</span>
                </div>
            </div>
            
            <a class="offer-card__cta" href="#">
                <span>استفد من العرض</span>
                <i class="fas fa-arrow-left"></i>
            </a>
        </div>
    </article>
`;

/**
 * إنشاء بطاقة عرض
 * @param {Object} offer - بيانات العرض
 * @returns {HTMLElement|null}
 */
export async function createOfferCard(offer) {
    if (!offer?.id) {
        console.error('[OfferCard] ❌ معرف العرض غير مُعرّف!');
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(OFFER_CARD_TEMPLATE, 'text/html');
    const card = doc.querySelector('.offer-card');

    try {
        // ===== أيقونة العرض =====
        const iconElement = card.querySelector('.offer-card__icon i');
        if (iconElement && offer.icon) {
            iconElement.className = `fas ${offer.icon}`;
        }

        // ===== نسبة الخصم =====
        const discountValue = card.querySelector('.offer-card__discount-value');
        const discountLabel = card.querySelector('.offer-card__discount-label');
        if (discountValue && offer.discount) {
            // استخراج الرقم من النص
            const match = offer.discount.match(/(\d+)/);
            if (match) {
                discountValue.textContent = `${match[1]}%`;
            } else {
                discountValue.textContent = offer.discount;
                if (discountLabel) discountLabel.style.display = 'none';
            }
        }

        // ===== العنوان =====
        const titleElement = card.querySelector('.offer-card__title');
        if (titleElement) {
            titleElement.textContent = offer.title || "عرض خاص";
        }

        // ===== الوصف =====
        const descriptionElement = card.querySelector('.offer-card__description');
        if (descriptionElement) {
            descriptionElement.textContent = offer.description || "";
        }

        // ===== المؤقت (Countdown) =====
        if (offer.endDate) {
            const timerContainer = card.querySelector('.offer-card__timer');
            if (timerContainer) {
                timerContainer.style.display = 'flex';
                startCountdown(timerContainer, offer.endDate);
            }
        }

        // ===== زر CTA =====
        const ctaBtn = card.querySelector('.offer-card__cta');
        if (ctaBtn) {
            if (offer.ctaLink) {
                ctaBtn.href = offer.ctaLink;
            } else if (offer.ctaText) {
                ctaBtn.querySelector('span').textContent = offer.ctaText;
            }
        }

        // ===== تأثيرات التفاعل =====
        addInteractionEffects(card);

        return card;
    } catch (error) {
        console.error("[OfferCard] Critical Processing Error:", error);
        return null;
    }
}

/**
 * بدء العد التنازلي
 */
function startCountdown(container, endDate) {
    const endTime = new Date(endDate).getTime();
    
    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = endTime - now;
        
        if (distance < 0) {
            container.style.display = 'none';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        const daysEl = container.querySelector('[data-days]');
        const hoursEl = container.querySelector('[data-hours]');
        const minutesEl = container.querySelector('[data-minutes]');
        
        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    };
    
    updateTimer();
    setInterval(updateTimer, 60000); // تحديث كل دقيقة
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
 * إنشاء عدة بطاقات عروض
 */
export async function createOfferCards(offers) {
    const cards = [];
    for (const offer of offers) {
        const card = await createOfferCard(offer);
        if (card) cards.push(card);
    }
    return cards;
}

