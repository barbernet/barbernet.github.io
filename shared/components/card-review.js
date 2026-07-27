/**
 * BarberFlow Pro - مكون بطاقة التقييم
 * المسار: shared/components/card-review.js
 * الدور: إنشاء وعرض بطاقات تقييمات الزبائن
 */

/**
 * HTML Template لبطاقة التقييم
 */
const REVIEW_CARD_TEMPLATE = `
<article class="review-card">
    <div class="review-card__header">
        <div class="review-card__avatar-wrapper">
            <div class="review-card__avatar-placeholder">
                <i class="fas fa-user"></i>
            </div>
            <img class="review-card__avatar" alt="صورة المقيّم" style="display:none;" />
        </div>
        <div class="review-card__info">
            <h4 class="review-card__name">اسم المقيّم</h4>
            <div class="review-card__rating">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
            </div>
        </div>
        <div class="review-card__date">
            <span>منذ يوم</span>
        </div>
    </div>
    <div class="review-card__content">
        <p class="review-card__comment">نص التقييم</p>
    </div>
    <div class="review-card__reply" style="display:none;">
        <div class="review-card__reply-header">
            <i class="fas fa-reply"></i>
            <span>رد صاحب النشاط</span>
        </div>
        <p class="review-card__reply-text">نص الرد</p>
    </div>
</article>
`;

/**
 * إنشاء بطاقة تقييم
 * @param {Object} review - بيانات التقييم من جدول reviews
 * @returns {HTMLElement|null}
 */
export async function createReviewCard(review) {
    if (!review?.id) {
        console.error('[ReviewCard] ❌ معرف التقييم غير مُعرّف!');
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(REVIEW_CARD_TEMPLATE, 'text/html');
    const card = doc.querySelector('.review-card');

    try {
        // ===== الصورة الشخصية للمقيّم =====
        const img = card.querySelector('.review-card__avatar');
        const placeholder = card.querySelector('.review-card__avatar-placeholder');
        if (img && placeholder && review.reviewer_avatar) {
            img.src = review.reviewer_avatar;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        }

        // ===== اسم المقيّم =====
        const nameElement = card.querySelector('.review-card__name');
        if (nameElement) {
            nameElement.textContent = review.reviewer_name || "زبون";
        }

        // ===== التقييم بالنجوم =====
        const starsContainer = card.querySelector('.review-card__rating');
        if (starsContainer) {
            const rating = parseInt(review.rating) || 5;
            const stars = starsContainer.querySelectorAll('i');
            stars.forEach((star, index) => {
                if (index < rating) {
                    star.className = 'fas fa-star';
                } else {
                    star.className = 'far fa-star';
                }
            });
        }

        // ===== التاريخ =====
        const dateElement = card.querySelector('.review-card__date span');
        if (dateElement && review.created_at) {
            dateElement.textContent = formatDate(review.created_at);
        }

        // ===== نص التقييم =====
        const commentElement = card.querySelector('.review-card__comment');
        if (commentElement) {
            commentElement.textContent = review.comment || "";
        }

        // ===== الرد =====
        const replyContainer = card.querySelector('.review-card__reply');
        const replyText = card.querySelector('.review-card__reply-text');
        if (replyContainer && replyText && review.reply) {
            replyText.textContent = review.reply;
            replyContainer.style.display = 'block';
        }

        // ===== تأثيرات التفاعل =====
        addInteractionEffects(card);
        return card;
    } catch (error) {
        console.error("[ReviewCard] Critical Processing Error:", error);
        return null;
    }
}

/**
 * تنسيق التاريخ
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "اليوم";
    if (diffDays === 1) return "أمس";
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
    return `منذ ${Math.floor(diffDays / 365)} سنوات`;
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
 * إنشاء عدة بطاقات تقييمات
 */
export async function createReviewCards(reviews) {
    const cards = [];
    for (const review of reviews) {
        const card = await createReviewCard(review);
        if (card) cards.push(card);
    }
    return cards;
}

