/**
middleware/routing/index.js
التصدير المركزي لدوال التوجيه
*/
export {
    navigateToUserDashboard,
    getProfileRoute,
    verifyProfileAccess
} from './profile-route.js';

export {
    initPageRouter,
    triggerRecoveryModal,
    showPageContent
} from './page-router.js';

export {
    initPageGuard
} from './page-guard.js';

