/**
 * middleware/guards/index.js
 * التصدير المركزي لدوال الحماية
 */
export {
  checkRole,
  checkUserStatus,
  handleUnauthorizedAccess,
  hasCompletedOnboarding
}
from './role-guard.js';

export {
  isSlotAvailable,
  validateBookingData,
  isWithinWorkingHours,
  getAvailableSlots
}
from './booking-guard.js';