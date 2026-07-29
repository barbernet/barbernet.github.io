/**
 * BarberFlow Pro - مركزية جميع مسارات المشروع
 * المسار: shared/utils/paths.js
 * 
 * ⚠️ جميع المسارات مطلقة (تبدأ بـ /)
 * يتم تحويلها إلى نسبية ديناميكياً بواسطة resolvePath()
 * 
 * 📅 آخر تحديث: 2026-07-29
 * - إضافة مسارات التوثيق (verification)
 */

export const PATHS = {
    // ============================================
    // الصفحة الرئيسية والأخطاء
    // ============================================
    INDEX: '/index.html',
    NOT_FOUND: '/404.html',

    // ============================================
    // المصادقة والترحيل (Authentication & Onboarding)
    // ============================================
    LOGIN: '/auth/login.html',
    REGISTER: '/auth/register.html',
    FORGOT_PASSWORD: '/auth/forgot-password.html',
    RESET_PASSWORD: '/auth/reset-password.html',
    VERIFY_EMAIL: '/auth/verify-email.html',
    WELCOME: '/auth/welcome.html',

    // ============================================
    // الإعداد الأولي - البيانات الإجبارية (Onboarding - Add)
    // ============================================
    ADD_SALON: '/onboarding/add/salon.html',
    ADD_STORE: '/onboarding/add/store.html',
    ADD_CUSTOMER: '/onboarding/add/customer.html',

    // ============================================
    // الإعداد الأولي - البيانات الاختيارية (Onboarding - Setup)
    // ============================================
    SETUP_SALON: '/onboarding/setup/salon.html',
    SETUP_STORE: '/onboarding/setup/store.html',
    SETUP_CUSTOMER: '/onboarding/setup/customer.html',

    // ============================================
    // التوثيق - شارة "موثق" (Onboarding - Verification)
    // ============================================
    VERIFICATION_SALON: '/onboarding/verification/salon.html',
    VERIFICATION_STORE: '/onboarding/verification/store.html',

    // ============================================
    // البروفايلات (Profiles)
    // ============================================
    PROFILE_SALON: '/profile/salon.html',
    PROFILE_STORE: '/profile/store.html',
    PROFILE_CUSTOMER: '/profile/customer.html',

    // ============================================
    // الاستكشاف والتفاصيل (Discovery & Details)
    // ============================================
    SALONS: '/salons.html',
    SHOP: '/shop.html',
    DETAILS_SALON: '/details-salon.html',
    DETAILS_STORE: '/details-store.html',
    PRODUCT: '/product.html',

    // ============================================
    // الحجز والمتجر (Booking & Shopping)
    // ============================================
    BOOKING: '/booking.html',

    // ============================================
    // الباقات المميزة (Pro Plans)
    // ============================================
    PRO: '/pro.html',

    // ============================================
    // لوحة التحكم - الرئيسية (Dashboard - Main)
    // ============================================
    DASHBOARD: '/dashboard/index.html',

    // ============================================
    // لوحة التحكم - التحليلات والمواعيد
    // ============================================
    DASHBOARD_ANALYTICS: '/dashboard/analytics.html',
    DASHBOARD_APPOINTMENTS: '/dashboard/appointments.html',
    DASHBOARD_NOTIFICATIONS: '/dashboard/notifications.html',
    DASHBOARD_REVIEWS: '/dashboard/reviews.html',

    // ============================================
    // لوحة التحكم - الأقسام الفرعية
    // ============================================
    DASHBOARD_CUSTOMERS: '/dashboard/customers/index.html',
    DASHBOARD_ORDERS: '/dashboard/orders/index.html',
    DASHBOARD_PRODUCTS: '/dashboard/products/index.html',
    DASHBOARD_SERVICES: '/dashboard/services/index.html',
    DASHBOARD_STAFF: '/dashboard/staff/index.html',

    // ============================================
    // لوحة التحكم - الإعدادات (Settings)
    // ============================================
    SETTINGS_GENERAL: '/dashboard/settings/settings-general.html',
    SETTINGS_SALON: '/dashboard/settings/settings-salon.html',
    SETTINGS_STORE: '/dashboard/settings/settings-store.html',

    // ============================================
    // الدفع والاشتراكات (Billing)
    // ============================================
    CHECKOUT: '/billing/checkout.html',
    PAYMENT_SUCCESS: '/billing/payment-success.html',
    PAYMENT_CANCEL: '/billing/payment-cancel.html',
    SUBSCRIPTION: '/billing/subscription.html',

    // ============================================
    // الدعم والمعلومات (Support & Info)
    // ============================================
    ABOUT: '/about.html',
    CONTACT: '/contact.html',
    SURVEY: '/survey.html',
    FAQ: '/faq.html',
    PRIVACY: '/privacy.html',
    TERMS: '/terms.html'
};

/**
 * تحويل مفتاح المسار إلى مسار نسبي صحيح حسب عمق الصفحة الحالية
 * 
 * @param {string} key - مفتاح المسار من PATHS (مثل 'INDEX', 'LOGIN')
 * @returns {string} المسار النسبي الصحيح
 * 
 * @example
 * // في صفحة /index.html (عمق 0)
 * resolvePath('LOGIN') // => 'auth/login.html'
 * 
 * @example
 * // في صفحة /dashboard/index.html (عمق 1)
 * resolvePath('LOGIN') // => '../auth/login.html'
 * 
 * @example
 * // في صفحة /onboarding/verification/salon.html (عمق 2)
 * resolvePath('LOGIN') // => '../../auth/login.html'
 */
export function resolvePath(key) {
    const absolutePath = PATHS[key];
    if (!absolutePath) {
        console.warn(`⚠️ المسار "${key}" غير موجود في PATHS`);
        return '#';
    }

    // حساب عمق الصفحة الحالية
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const depth = pathSegments.length - 1;

    // إزالة الـ / الأولى من المسار المطلق
    const cleanPath = absolutePath.substring(1);

    // بناء المسار النسبي
    if (depth <= 0) {
        return cleanPath;
    }

    const prefix = '../'.repeat(depth);
    return prefix + cleanPath;
}

/**
 * الحصول على جميع المسارات (لأغراض التوثيق والتصحيح)
 * @returns {Object} نسخة من كائن PATHS
 */
export function getAllPaths() {
    return { ...PATHS };
}

/**
 * التحقق من صحة مفتاح المسار
 * @param {string} key - المفتاح المراد التحقق منه
 * @returns {boolean}
 */
export function isValidPathKey(key) {
    return key in PATHS;
}

export default PATHS;

