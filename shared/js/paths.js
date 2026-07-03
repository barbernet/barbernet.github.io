/**
 * shared/js/paths.js
 * مركزية جميع مسارات مشروع BarberFlow-Pro
 * ⚠️ جميع المسارات مطلقة (تبدأ بـ /)
 * يتم تحويلها إلى نسبية ديناميكياً بواسطة resolvePath()
 */

export const PATHS = {
    // ============================================
    // الصفحة الرئيسية
    // ============================================
    INDEX: '/index.html',

    // ============================================
    // المصادقة (Authentication)
    // ============================================
    LOGIN: '/auth/login.html',
    REGISTER: '/auth/register.html',

    // ============================================
    // دليل الصالونات والحجز
    // ============================================
    SALONS: '/salons.html',
    BOOKING: '/booking.html',

    // ============================================
    // المتجر
    // ============================================
    SHOP: '/shop.html',
    PRODUCT: '/product.html',

    // ============================================
    // الباقات المميزة
    // ============================================
    PRO: '/pro.html',

    // ============================================
    // الترحيب والإعداد (Onboarding)
    // ============================================
    WELCOME: '/onboarding/welcome.html',
    ADD_SALON: '/onboarding/add-salon.html',
    ADD_STORE: '/onboarding/add-store.html',
    ADD_CUSTOMER: '/onboarding/add-customer.html',
    SETUP_SALON: '/onboarding/setup-salon.html',
    SETUP_STORE: '/onboarding/setup-store.html',
    SETUP_CUSTOMER: '/onboarding/setup-customer.html',

    // ============================================
    // البروفايلات (Profiles)
    // ============================================
    PROFILE_CUSTOMER: '/profile/customer.html',
    PROFILE_SALON: '/profile/salon.html',
    PROFILE_STORE: '/profile/store.html',

    // ============================================
    // لوحة التحكم (Dashboard)
    // ============================================
    DASHBOARD: '/dashboard/index.html',
    DASHBOARD_APPOINTMENTS: '/dashboard/appointments.html',
    DASHBOARD_ANALYTICS: '/dashboard/analytics.html',
    DASHBOARD_SETTINGS: '/dashboard/settings.html',

    // ============================================
    // الدعم والمعلومات (Support)
    // ============================================
    ABOUT: '/about.html',
    CONTACT: '/contact.html',
    SURVEY: '/survey.html'
};

/**
 * تحويل مفتاح المسار إلى مسار نسبي صحيح حسب عمق الصفحة الحالية
 * @param {string} key - مفتاح المسار من PATHS (مثل 'INDEX', 'LOGIN')
 * @returns {string} المسار النسبي الصحيح
 */
export function resolvePath(key) {
    const absolutePath = PATHS[key];
    if (!absolutePath) return '#';

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

export default PATHS;

