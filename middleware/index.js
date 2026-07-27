/**
 * middleware/index.js
 * نقطة التصدير المركزية لجميع دوال الـ Middleware
 */

// Auth Middleware
export { 
    getCurrentUser, 
    isUserLoggedIn, 
    getCurrentUserId 
} from './auth/auth-state.js';

// Guards Middleware
export {
    checkRole,
    checkBusinessStatus,
    handleUnauthorizedAccess,
    hasCompletedOnboarding
} from './guards/role-guard.js';

export {
    isSlotAvailable,
    validateBookingData,
    isWithinWorkingHours,
    getAvailableSlots
} from './guards/booking-guard.js';

// Routing Middleware
export {
    navigateToUserDashboard,
    getProfileRoute,
    verifyProfileAccess
} from './routing/profile-route.js';

export {
    initPageRouter,
    triggerRecoveryModal,
    showPageContent
} from './routing/page-router.js';

export {
    initPageGuard
} from './routing/page-guard.js';

// Validation Middleware
export {
    sanitizeText,
    sanitizeEmail,
    sanitizePhone,
    sanitizeURL,
    validateLength,
    sanitizeUserData,
    sanitizeBusinessData,
    sanitizeBookingData,
    sanitizeServiceData,
    sanitizeProductData
} from './validation/input-sanitizer.js';

export {
    validateImageType,
    validateImageSize,
    validateImageDimensions,
    detectInappropriateContent,
    validateImage,
    generateStoragePath
} from './validation/images-sanitizer.js';

// Subscription Middleware
export {
    checkSubscription,
    hasFeature,
    requireSubscription,
    showLockedContent
} from './subscription/subscription-guard.js';

