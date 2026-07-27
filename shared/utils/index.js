/**
 * BarberFlow Pro - وحدة الأدوات المشتركة
 * المسار: shared/utils/index.js
 */

// أدوات الحماية من النقر المتكرر
export { 
    debounce, 
    throttle, 
    protectButton, 
    protectLink, 
    protectForm 
} from './debounce.js';

// تفضيلات المستخدم
export { 
    UserPreferences,
    getCurrentTheme,
    toggleTheme,
    applyTheme
} from './user-preferences.js';

// تحليلات سلوك المستخدم
export { Analytics } from './analytics.js';

// مسارات الصفحات
export { PATHS, resolvePath } from './paths.js';

// نظام التنبيهات
export { 
    showNotification, 
    showOtpModal, 
    showConfirmDialog, 
    showLoading 
} from './notifications.js';

// أدوات الصور (Supabase Storage)
export {
    uploadImage,
    uploadMultipleImages,
    getImageUrl,
    getTransformedImageUrl,
    deleteImage,
    deleteMultipleImages,
    replaceImage,
    imageExists,
    generateUniqueFileName
} from './images-utils.js';

// ✅ جديد: إدارة الأخطاء
export {
    handleError,
    handleSupabaseError,
    handleAuthError,
    handleValidationError,
    handleNetworkError,
    safeExecute
} from './error-handler.js';

// ✅ جديد: التخزين المؤقت
export {
    cacheSet,
    cacheGet,
    cacheRemove,
    cacheClear,
    cacheCleanExpired,
    cacheFetch,
    cacheFetchWithRevalidation,
    cacheStats
} from './cache.js';

// ✅ جديد: أدوات التواريخ
export {
    formatDate,
    formatTime,
    formatRelativeTime,
    isToday,
    isTomorrow,
    isYesterday,
    isPast,
    isFuture,
    getDayName,
    getMonthName,
    dateDiff,
    addDays,
    toISODate,
    toISOTime
} from './date-utils.js';

