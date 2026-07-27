/**
 * BarberFlow Pro - مكون بطاقة الموظف/الحلاق
 * المسار: shared/components/card-staff.js
 * الدور: إنشاء وعرض بطاقات فريق العمل في الصالون
 */

/**
 * HTML Template لبطاقة الموظف
 */
const STAFF_CARD_TEMPLATE = `
<article class="staff-card">
    <div class="staff-card__avatar-wrapper">
        <div class="staff-card__avatar-placeholder">
            <i class="fas fa-user"></i>
        </div>
        <img class="staff-card__avatar" alt="صورة الموظف" style="display:none;" />
        <div class="staff-card__status" data-status="available">
            <i class="fas fa-circle"></i>
        </div>
    </div>
    <div class="staff-card__content">
        <h3 class="staff-card__name">اسم الموظف</h3>
        <p class="staff-card__role">المسمى الوظيفي</p>
        <div class="staff-card__rating">
            <i class="fas fa-star"></i>
            <span class="staff-card__rating-value">5.0</span>
            <span class="staff-card__rating-count">(0 تقييم)</span>
        </div>
        <div class="staff-card__specialties">
            <span class="staff-card__specialty">تخصص 1</span>
        </div>
    </div>
</article>
`;

/**
 * إنشاء بطاقة موظف
 * @param {Object} staff - بيانات الموظف من جدول profiles
 * @returns {HTMLElement|null}
 */
export async function createStaffCard(staff) {
    if (!staff?.id) {
        console.error('[StaffCard] ❌ معرف الموظف غير مُعرّف!');
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(STAFF_CARD_TEMPLATE, 'text/html');
    const card = doc.querySelector('.staff-card');

    try {
        // ===== الصورة الشخصية =====
        const img = card.querySelector('.staff-card__avatar');
        const placeholder = card.querySelector('.staff-card__avatar-placeholder');
        if (img && placeholder) {
            if (staff.avatar_url) {
                img.src = staff.avatar_url;
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

        // ===== الاسم =====
        const nameElement = card.querySelector('.staff-card__name');
        if (nameElement) {
            nameElement.textContent = staff.full_name || "موظف";
        }

        // ===== المسمى الوظيفي =====
        const roleElement = card.querySelector('.staff-card__role');
        if (roleElement) {
            roleElement.textContent = staff.job_title || "حلاق";
        }

        // ===== التقييم =====
        const ratingElement = card.querySelector('.staff-card__rating-value');
        const ratingCount = card.querySelector('.staff-card__rating-count');
        if (ratingElement) {
            const rating = parseFloat(staff.rating) || 5.0;
            ratingElement.textContent = rating.toFixed(1);
        }
        if (ratingCount) {
            const count = staff.reviews_count || 0;
            ratingCount.textContent = `(${count} تقييم)`;
        }

        // ===== التخصصات =====
        const specialtiesContainer = card.querySelector('.staff-card__specialties');
        if (specialtiesContainer && staff.specialties) {
            const specialties = Array.isArray(staff.specialties) 
                ? staff.specialties 
                : staff.specialties.split(',');
            
            specialtiesContainer.innerHTML = specialties.slice(0, 3).map(spec => `
                <span class="staff-card__specialty">${spec.trim()}</span>
            `).join('');
        }

        // ===== تأثيرات التفاعل =====
        addInteractionEffects(card);
        return card;
    } catch (error) {
        console.error("[StaffCard] Critical Processing Error:", error);
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
 * إنشاء عدة بطاقات موظفين
 */
export async function createStaffCards(staffList) {
    const cards = [];
    for (const staff of staffList) {
        const card = await createStaffCard(staff);
        if (card) cards.push(card);
    }
    return cards;
}

