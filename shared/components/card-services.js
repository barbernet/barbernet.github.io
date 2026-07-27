/**
 * BarberFlow Pro - مكون بطاقة الخدمة
 * المسار: shared/components/card-service.js
 * الدور: إنشاء وعرض بطاقات الخدمات في الصالون
 */

/**
 * HTML Template لبطاقة الخدمة
 */
const SERVICE_CARD_TEMPLATE = `
<article class="service-card">
    <div class="service-card__icon">
        <i class="fas fa-cut"></i>
    </div>
    <div class="service-card__content">
        <h3 class="service-card__name">اسم الخدمة</h3>
        <p class="service-card__description">وصف الخدمة</p>
        <div class="service-card__details">
            <div class="service-card__duration">
                <i class="fas fa-clock"></i>
                <span>30 دقيقة</span>
            </div>
            <div class="service-card__category">
                <i class="fas fa-tag"></i>
                <span>تصنيف</span>
            </div>
        </div>
        <div class="service-card__footer">
            <div class="service-card__price">
                <span class="service-card__price-value">0 DH</span>
            </div>
            <button class="service-card__book-btn">
                <span>احجز الآن</span>
                <i class="fas fa-calendar-check"></i>
            </button>
        </div>
    </div>
</article>
`;

/**
 * إنشاء بطاقة خدمة
 * @param {Object} service - بيانات الخدمة من جدول services
 * @returns {HTMLElement|null}
 */
export async function createServiceCard(service) {
    if (!service?.id) {
        console.error('[ServiceCard] ❌ معرف الخدمة غير مُعرّف!');
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(SERVICE_CARD_TEMPLATE, 'text/html');
    const card = doc.querySelector('.service-card');

    try {
        // ===== الأيقونة =====
        const iconElement = card.querySelector('.service-card__icon i');
        if (iconElement && service.icon) {
            iconElement.className = `fas ${service.icon}`;
        }

        // ===== اسم الخدمة =====
        const nameElement = card.querySelector('.service-card__name');
        if (nameElement) {
            nameElement.textContent = service.name || "خدمة";
        }

        // ===== الوصف =====
        const descriptionElement = card.querySelector('.service-card__description');
        if (descriptionElement) {
            descriptionElement.textContent = service.description || "";
        }

        // ===== المدة =====
        const durationElement = card.querySelector('.service-card__duration span');
        if (durationElement) {
            const duration = service.duration_min || 30;
            durationElement.textContent = `${duration} دقيقة`;
        }

        // ===== التصنيف =====
        const categoryElement = card.querySelector('.service-card__category span');
        if (categoryElement) {
            categoryElement.textContent = service.category || "عام";
        }

        // ===== السعر =====
        const priceElement = card.querySelector('.service-card__price-value');
        if (priceElement) {
            const price = parseFloat(service.price) || 0;
            priceElement.textContent = `${price} DH`;
        }

        // ===== زر الحجز =====
        const bookBtn = card.querySelector('.service-card__book-btn');
        if (bookBtn) {
            bookBtn.onclick = () => {
                window.location.href = `../booking.html?service_id=${service.id}`;
            };
        }

        // ===== تأثيرات التفاعل =====
        addInteractionEffects(card);
        return card;
    } catch (error) {
        console.error("[ServiceCard] Critical Processing Error:", error);
        return null;
    }
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
 * إنشاء عدة بطاقات خدمات
 */
export async function createServiceCards(services) {
    const cards = [];
    for (const service of services) {
        const card = await createServiceCard(service);
        if (card) cards.push(card);
    }
    return cards;
}

