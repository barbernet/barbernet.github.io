/**
shared/utils/paths.js
مركزية جميع مسارات مشروع BarberFlow-Pro
⚠️ جميع المسارات مطلقة (تبدأ بـ /)
يتم تحويلها إلى نسبية ديناميكياً بواسطة resolvePath()
*/
export const PATHS = {
    // ============================================
    // الصفحة الرئيسية والأخطاء
    // ============================================
    INDEX: '/index.html',
    NOT_FOUND: '/404.html',

    // ============================================
    // المصادقة (Authentication)
    // ============================================
    LOGIN: '/auth/login.html',
    REGISTER: '/auth/register.html',
    FORGOT_PASSWORD: '/auth/forgot-password.html',
    RESET_PASSWORD: '/auth/reset-password.html',
    VERIFY_EMAIL: '/auth/verify-email.html',

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
    PROFILE_SALON: '/profile/salon.html',
    PROFILE_STORE: '/profile/store.html',
    PROFILE_CUSTOMER: '/profile/customer.html',

    // ============================================
    // الاستكشاف والتفاصيل (Home)
    // ============================================
    SALONS: '/salons.html',
    SHOP: '/shop.html',
    DETAILS_SALON: '/details-salon.html',
    DETAILS_STORE: '/details-store.html',
    PRODUCT: '/product.html',

    // ============================================
    // الحجز والمتجر
    // ============================================
    BOOKING: '/booking.html',

    // ============================================
    // الباقات المميزة
    // ============================================
    PRO: '/pro.html',

    // ============================================
    // لوحة التحكم (Dashboard) - الرئيسية
    // ============================================
    DASHBOARD: '/dashboard/index.html', // ملاحظة: تأكد من وجود index.html في dashboard أو عدله لـ staff/index.html حسب رغبتك

    // ============================================
    // لوحة التحكم - الإعدادات (مجلد settings/)
    // ============================================
    SETTINGS_GENERAL: '/dashboard/settings/settings-general.html',
    SETTINGS_SALON: '/dashboard/settings/settings-salon.html',
    SETTINGS_STORE: '/dashboard/settings/settings-store.html',

    // ============================================
    // لوحة التحكم - الأقسام الفرعية
    // ============================================
    DASHBOARD_CUSTOMERS: '/dashboard/customers/index.html',
    DASHBOARD_SERVICES: '/dashboard/services/index.html',
    DASHBOARD_PRODUCTS: '/dashboard/products/index.html',
    DASHBOARD_ORDERS: '/dashboard/orders/index.html',
    DASHBOARD_STAFF: '/dashboard/staff/index.html',
    
    // ============================================
    // لوحة التحكم - الطاقم (Staff) - صفحات جديدة
    // ============================================
    DASHBOARD_ANALYTICS: '/dashboard/staff/analytics.html',
    DASHBOARD_APPOINTMENTS: '/dashboard/staff/appointments.html',
    DASHBOARD_NOTIFICATIONS: '/dashboard/staff/notifications.html',
    DASHBOARD_REVIEWS: '/dashboard/staff/reviews.html',

    // ============================================
    // الدعم والمعلومات (Support)
    // ============================================
    ABOUT: '/about.html',
    CONTACT: '/contact.html',
    SURVEY: '/survey.html',
    FAQ: '/faq.html',
    PRIVACY: '/privacy.html',
    TERMS: '/terms.html',

    // ============================================
    // الدفع والاشتراكات (Billing)
    // ============================================
    CHECKOUT: '/billing/checkout.html',
    PAYMENT_SUCCESS: '/billing/payment-success.html',
    PAYMENT_CANCEL: '/billing/payment-cancel.html',
    SUBSCRIPTION: '/billing/subscription.html'
};

/**
تحويل مفتاح المسار إلى مسار نسبي صحيح حسب عمق الصفحة الحالية
@param {string} key - مفتاح المسار من PATHS (مثل 'INDEX', 'LOGIN')
@returns {string} المسار النسبي الصحيح
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

