/**
 * التصدير المركزي لدوال الحماية
 */
export {
    checkRole,
    checkBusinessStatus,
    handleUnauthorizedAccess,
    hasCompletedOnboarding
} from './role-guard.js';

export {
    isSlotAvailable,
    validateBookingData,
    isWithinWorkingHours,
    getAvailableSlots
} from './booking-guard.js';

// ✅ جديد
export {
    requireActiveSubscription,
    requireFeature,
    protectElement
} from './subscription-route-guard.js';

