/**
 * BarberFlow Pro - مكون بطاقة الحجز
 * المسار: shared/components/card-booking.js
 * الدور: إنشاء وعرض بطاقات الحجوزات في البروفايل
 */

/**
 * HTML Template لبطاقة الحجز
 */
const BOOKING_CARD_TEMPLATE = `
<article class="booking-card">
    <div class="booking-card__status" data-status="pending">
        <span>قيد الانتظار</span>
    </div>
    <div class="booking-card__content">
        <div class="booking-card__header">
            <div class="booking-card__service-icon">
                <i class="fas fa-cut"></i>
            </div>
            <div class="booking-card__info">
                <h3 class="booking-card__service-name">اسم الخدمة</h3>
                <p class="booking-card__salon-name">اسم الصالون</p>
            </div>
        </div>
        <div class="booking-card__details">
            <div class="booking-card__detail">
                <i class="fas fa-calendar"></i>
                <span>التاريخ</span>
            </div>
            <div class="booking-card__detail">
                <i class="fas fa-clock"></i>
                <span>الوقت</span>
            </div>
            <div class="booking-card__detail">
                <i class="fas fa-user"></i>
                <span>الموظف</span>
            </div>
        </div>
        <div class="booking-card__footer">
            <div class="booking-card__price">
                <span class="booking-card__price-value">0 DH</span>
            </div>
            <div class="booking-card__actions">
                <button class="booking-card__cancel-btn">
                    <i class="fas fa-times"></i>
                    <span>إلغاء</span>
                </button>
                <button class="booking-card__details-btn">
                    <i class="fas fa-eye"></i>
                    <span>التفاصيل</span>
                </button>
            </div>
        </div>
    </div>
</article>
`;

/**
 * إنشاء بطاقة حجز
 * @param {Object} booking - بيانات الحجز من جدول bookings
 * @returns {HTMLElement|null}
 */
export async function createBookingCard(booking) {
    if (!booking?.id) {
        console.error('[BookingCard] ❌ معرف الحجز غير مُعرّف!');
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(BOOKING_CARD_TEMPLATE, 'text/html');
    const card = doc.querySelector('.booking-card');

    try {
        // ===== حالة الحجز =====
        const statusElement = card.querySelector('.booking-card__status');
        if (statusElement) {
            const statusMap = {
                'pending': { text: 'قيد الانتظار', class: 'pending' },
                'confirmed': { text: 'مؤكد', class: 'confirmed' },
                'completed': { text: 'مكتمل', class: 'completed' },
                'cancelled': { text: 'ملغي', class: 'cancelled' }
            };
            const status = statusMap[booking.status] || statusMap['pending'];
            statusElement.textContent = status.text;
            statusElement.dataset.status = status.class;
        }

        // ===== اسم الخدمة =====
        const serviceNameElement = card.querySelector('.booking-card__service-name');
        if (serviceNameElement) {
            serviceNameElement.textContent = booking.service_name || "خدمة";
        }

        // ===== اسم الصالون =====
        const salonNameElement = card.querySelector('.booking-card__salon-name');
        if (salonNameElement) {
            salonNameElement.textContent = booking.business_name || "الصالون";
        }

        // ===== التاريخ =====
        const dateElement = card.querySelector('.booking-card__detail:nth-child(1) span');
        if (dateElement && booking.booking_date) {
            dateElement.textContent = formatDate(booking.booking_date);
        }

        // ===== الوقت =====
        const timeElement = card.querySelector('.booking-card__detail:nth-child(2) span');
        if (timeElement && booking.start_time) {
            timeElement.textContent = booking.start_time;
        }

        // ===== الموظف =====
        const staffElement = card.querySelector('.booking-card__detail:nth-child(3) span');
        if (staffElement) {
            staffElement.textContent = booking.staff_name || "أي موظف";
        }

        // ===== السعر =====
        const priceElement = card.querySelector('.booking-card__price-value');
        if (priceElement) {
            const price = parseFloat(booking.service_price) || 0;
            priceElement.textContent = `${price} DH`;
        }

        // ===== أزرار الإجراءات =====
        const cancelBtn = card.querySelector('.booking-card__cancel-btn');
        const detailsBtn = card.querySelector('.booking-card__details-btn');

        if (cancelBtn) {
            if (booking.status === 'completed' || booking.status === 'cancelled') {
                cancelBtn.style.display = 'none';
            } else {
                cancelBtn.onclick = () => {
                    console.log('Cancel booking:', booking.id);
                };
            }
        }

        if (detailsBtn) {
            detailsBtn.onclick = () => {
                console.log('View details:', booking.id);
            };
        }

        // ===== تأثيرات التفاعل =====
        addInteractionEffects(card);
        return card;
    } catch (error) {
        console.error("[BookingCard] Critical Processing Error:", error);
        return null;
    }
}

/**
 * تنسيق التاريخ
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('ar-MA', options);
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
 * إنشاء عدة بطاقات حجوزات
 */
export async function createBookingCards(bookings) {
    const cards = [];
    for (const booking of bookings) {
        const card = await createBookingCard(booking);
        if (card) cards.push(card);
    }
    return cards;
}

