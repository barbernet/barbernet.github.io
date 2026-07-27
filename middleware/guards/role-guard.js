/**
 * middleware/guards/role-guard.js
 * نظام التحقق من الصلاحيات والأدوار
 */
import { showNotification } from '../../shared/utils/notifications.js';

/**
 * التحقق من تطابق دور المستخدم مع الدور المطلوب
 * @param {Object} userData - بيانات المستخدم الكاملة
 * @param {string|string[]} requiredRole - الدور المطلوب (أو مصفوفة أدوار)
 * @returns {boolean}
 */
export const checkRole = (userData, requiredRole) => {
    if (!userData || !userData.role) {
        console.warn("⚠️ Access Denied: User role not found.");
        return false;
    }

    const userRole = userData.role;

    // الأدوار المسموحة: 'customer', 'salon', 'store'
    // admin يمكن إضافته لاحقاً للصلاحيات الخاصة
    if (userRole === 'admin') {
        return true;
    }

    if (Array.isArray(requiredRole)) {
        return requiredRole.includes(userRole);
    }

    return userRole === requiredRole;
};

/**
 * التحقق من حالة النشاط التجاري (لأصحاب الصالونات/المتاجر)
 * @param {Object} businessData - بيانات النشاط التجاري من جدول businesses
 * @param {string} requiredStatus - الحالة المطلوبة ('active', 'inactive', 'suspended')
 * @returns {boolean}
 */
export const checkBusinessStatus = (businessData, requiredStatus) => {
    if (!businessData || !businessData.status) {
        return false;
    }
    return businessData.status === requiredStatus;
};

/**
 * معالجة الوصول غير المصرح به
 * @param {string} redirectPath - المسار للتوجيه (افتراضي: الصفحة الرئيسية)
 */
export const handleUnauthorizedAccess = (redirectPath = '../index.html') => {
    if (typeof showNotification === 'function') {
        showNotification("ليس لديك صلاحية الوصول لهذه الصفحة", "error");
    }
    setTimeout(() => {
        window.location.href = redirectPath;
    }, 1500);
};

/**
 * التحقق من أن المستخدم أكمل الـ Onboarding
 * @param {Object} userData - بيانات المستخدم من جدول profiles
 * @returns {boolean}
 */
export const hasCompletedOnboarding = (userData) => {
    if (!userData) return false;
    return userData.onboarding_status === 'completed';
};

