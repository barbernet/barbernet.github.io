/**
BarberFlow Pro - مكون بطاقة الكونسيرج (الخدمات المنزلية)
المسار: shared/components/card-concierge.js
الدور: إنشاء وعرض بطاقات الخدمات المنزلية الفاخرة
*/
import { PATHS, resolvePath } from "../utils/paths.js"; // ✅ تم تصحيح المسار

/**
HTML Template لبطاقة الكونسيرج
*/
const CONCIERGE_CARD_TEMPLATE = `
<article class="concierge-card">
    <div class="concierge-card__badge">
        <i class="fas fa-crown"></i>
        <span>VIP</span>
    </div>
    <div class="concierge-card__icon-wrapper">
        <div class="concierge-card__icon">
            <i class="fas fa-spa"></i>
        </div>
        <div class="concierge-card__icon-glow"></div>
    </div>
    <div class="concierge-card__content">
        <h3 class="concierge-card__title">عنوان الخدمة</h3>
        <p class="concierge-card__description">وصف الخدمة</p>
        <div class="concierge-card__features">
            <div class="concierge-card__feature">
                <i class="fas fa-check-circle"></i>
                <span>خدمة احترافية</span>
            </div>
            <div class="concierge-card__feature">
                <i class="fas fa-check-circle"></i>
                <span>في منزلك</span>
            </div>
        </div>
        <div class="concierge-card__footer">
            <div class="concierge-card__price">
                <span class="concierge-card__price-label">يبدأ من</span>
                <span class="concierge-card__price-value">0 DH</span>
            </div>
            <a class="concierge-card__cta" href="#">
                <span>طلب الخدمة</span>
                <i class="fas fa-arrow-left"></i>
            </a>
        </div>
    </div>
</article>
`;

/**
إنشاء بطاقة كونسيرج
@param {Object} service - بيانات الخدمة
@returns {HTMLElement|null}
*/
export async function createConciergeCard(service) {
    if (!service?.id) {
        console.error('[ConciergeCard] ❌ معرف الخدمة غير مُعرّف!');
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(CONCIERGE_CARD_TEMPLATE, 'text/html');
    const card = doc.querySelector('.concierge-card');

    try {
        // ===== الأيقونة =====
        const iconElement = card.querySelector('.concierge-card__icon i');
        if (iconElement && service.icon) {
            iconElement.className = `fas ${service.icon}`;
        }

        // ===== العنوان =====
        const titleElement = card.querySelector('.concierge-card__title');
        if (titleElement) {
            titleElement.textContent = service.title || "خدمة منزلية";
        }

        // ===== الوصف =====
        const descriptionElement = card.querySelector('.concierge-card__description');
        if (descriptionElement) {
            descriptionElement.textContent = service.description || "";
        }

        // ===== المميزات =====
        const featuresContainer = card.querySelector('.concierge-card__features');
        if (featuresContainer && service.features) {
            featuresContainer.innerHTML = service.features.map(feature => `
                <div class="concierge-card__feature">
                    <i class="fas fa-check-circle"></i>
                    <span>${feature}</span>
                </div>
            `).join('');
        }

        // ===== السعر =====
        const priceElement = card.querySelector('.concierge-card__price-value');
        if (priceElement && service.price) {
            priceElement.textContent = `${service.price} DH`;
        }

        // ===== زر CTA =====
        const ctaBtn = card.querySelector('.concierge-card__cta');
        if (ctaBtn) {
            if (service.ctaLink) {
                ctaBtn.href = service.ctaLink;
            } else if (service.ctaText) {
                ctaBtn.querySelector('span').textContent = service.ctaText;
            }
        }

        // ===== تأثيرات التفاعل =====
        addInteractionEffects(card);
        return card;
    } catch (error) {
        console.error("[ConciergeCard] Critical Processing Error:", error);
        return null;
    }
}

/**
إضافة تأثيرات التفاعل
*/
function addInteractionEffects(card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    requestAnimationFrame(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

    // تأثير glow عند hover
    if (window.matchMedia('(hover: hover)').matches) {
        card.addEventListener('mouseenter', () => {
            const glow = card.querySelector('.concierge-card__icon-glow');
            if (glow) glow.style.opacity = '1';
        });
        card.addEventListener('mouseleave', () => {
            const glow = card.querySelector('.concierge-card__icon-glow');
            if (glow) glow.style.opacity = '0';
        });
    }
}

/**
إنشاء عدة بطاقات كونسيرج
*/
export async function createConciergeCards(services) {
    const cards = [];
    for (const service of services) {
        const card = await createConciergeCard(service);
        if (card) cards.push(card);
    }
    return cards;
}

