/**
 * Loading Manager - إدارة موحدة لأنواع التحميل
 * المسار: shared/utils/loading-manager.js
 */

// ============================================
// Skeleton Loading - لهيكل الصفحة
// ============================================

/**
 * إنشاء Skeleton لبطاقة صالون
 */
function createSalonSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.innerHTML = `
        <div class="skeleton-cover"></div>
        <div class="skeleton-logo"></div>
        <div class="skeleton-body">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line subtitle"></div>
            <div class="skeleton-line meta"></div>
            <div class="skeleton-footer">
                <div class="skeleton-rating">
                    <div class="skeleton-star"></div>
                    <div class="skeleton-star"></div>
                    <div class="skeleton-star"></div>
                    <div class="skeleton-star"></div>
                    <div class="skeleton-star"></div>
                </div>
                <div class="skeleton-price"></div>
            </div>
        </div>
    `;
    return skeleton;
}

/**
 * إنشاء Skeleton لبطاقة منتج
 */
function createProductSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-product';
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.innerHTML = `
        <div class="skeleton-product-image"></div>
        <div class="skeleton-product-body">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line subtitle"></div>
            <div class="skeleton-footer">
                <div class="skeleton-price"></div>
                <div class="skeleton-line meta" style="width: 60px; margin: 0;"></div>
            </div>
        </div>
    `;
    return skeleton;
}

/**
 * إنشاء Skeleton لبطاقة عرض
 */
function createOfferSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-offer';
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.innerHTML = `
        <div class="skeleton-offer-icon"></div>
        <div class="skeleton-offer-content">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line subtitle"></div>
            <div class="skeleton-line meta"></div>
        </div>
    `;
    return skeleton;
}

/**
 * عرض Skeleton في حاوية معينة
 * @param {string} targetId - معرف الحاوية
 * @param {string} type - نوع الـ skeleton: 'salon' | 'product' | 'offer'
 * @param {number} count - عدد الـ skeletons
 */
export function showSkeleton(targetId, type = 'salon', count = 4) {
    const container = document.getElementById(targetId);
    if (!container) return;

    // مسح المحتوى الحالي
    container.innerHTML = '';
    container.setAttribute('aria-busy', 'true');

    // إنشاء الـ skeletons
    const creators = {
        salon: createSalonSkeleton,
        product: createProductSkeleton,
        offer: createOfferSkeleton
    };

    const creator = creators[type] || createSalonSkeleton;

    for (let i = 0; i < count; i++) {
        container.appendChild(creator());
    }
}

/**
 * إخفاء Skeleton (يُستدعى بعد جلب البيانات)
 * @param {string} targetId - معرف الحاوية
 */
export function hideSkeleton(targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    container.setAttribute('aria-busy', 'false');
}

// ============================================
// Spinner Loading - للتفاعلات اللحظية
// ============================================

/**
 * تحويل زر إلى حالة التحميل (Spinner)
 * @param {HTMLElement} button - الزر
 * @param {string} loadingText - نص اختياري أثناء التحميل
 */
export function showSpinner(button, loadingText = null) {
    if (!button) return;

    // حفظ النص الأصلي
    if (!button.dataset.originalText) {
        button.dataset.originalText = button.innerHTML;
    }

    // إضافة class التحميل
    button.classList.add('btn-loading');
    button.disabled = true;

    // إضافة نص اختياري
    if (loadingText) {
        button.innerHTML = `<span class="spinner sm white"></span> ${loadingText}`;
        button.classList.remove('btn-loading'); // لأننا نعرض spinner مع نص
    }
}

/**
 * إعادة الزر لحالته الأصلية
 * @param {HTMLElement} button - الزر
 */
export function hideSpinner(button) {
    if (!button) return;

    button.classList.remove('btn-loading');
    button.disabled = false;

    // استعادة النص الأصلي
    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
    }
}

/**
 * عرض Spinner في مركز الصفحة (Full Page)
 * @param {string} message - رسالة التحميل
 */
export function showPageSpinner(message = 'جاري التحميل...') {
    // إنشاء الـ overlay إذا لم يكن موجوداً
    let overlay = document.getElementById('pageSpinnerOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pageSpinnerOverlay';
        overlay.className = 'page-spinner-overlay';
        overlay.innerHTML = `
            <div class="page-spinner-box">
                <div class="spinner lg"></div>
                <p id="pageSpinnerMessage">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        document.getElementById('pageSpinnerMessage').textContent = message;
    }

    overlay.classList.add('active');
}

/**
 * إخفاء Spinner الصفحة
 */
export function hidePageSpinner() {
    const overlay = document.getElementById('pageSpinnerOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * إنشاء عنصر Spinner بسيط (لإضافته يدوياً في HTML)
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} color - 'default' | 'white' | 'dark'
 */
export function createSpinner(size = 'md', color = 'default') {
    const spinner = document.createElement('div');
    spinner.className = `spinner ${size}`;
    if (color !== 'default') {
        spinner.classList.add(color);
    }
    return spinner;
}

// ============================================
// تصدير كل الدوال
// ============================================
export const LoadingManager = {
    showSkeleton,
    hideSkeleton,
    showSpinner,
    hideSpinner,
    showPageSpinner,
    hidePageSpinner,
    createSpinner
};

