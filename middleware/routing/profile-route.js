/**
middleware/routing/profile-route.js
التوجيه الذكي لملفات المستخدمين حسب أدوارهم
*/
import { auth, db } from '../../config/firebase-init.js'; // ✅ تم التصحيح
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getCurrentUser } from '../auth/auth-state.js';
import { PATHS } from '../../shared/utils/paths.js'; // ✅ تم التصحيح

/**
توجيه المستخدم لصفحة ملفه الشخصي حسب دوره
@param {string} uid - معرف المستخدم (اختياري)
*/
export const navigateToUserDashboard = async (uid = null) => {
    try {
        const user = uid ? { uid } : auth.currentUser;
        if (!user) {
            window.location.href = PATHS.LOGIN;
            return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            console.warn("User document not found, redirecting to login");
            window.location.href = PATHS.LOGIN;
            return;
        }

        const userData = userDoc.data();
        const role = userData.role || 'customer';
        const routes = {
            "salon": PATHS.PROFILE_SALON,
            "store": PATHS.PROFILE_STORE,
            "customer": PATHS.PROFILE_CUSTOMER,
            "admin": PATHS.ADMIN_DASHBOARD
        };

        const targetRoute = routes[role] || routes["customer"];
        window.location.href = targetRoute;
    } catch (error) {
        console.error("Error in profile routing:", error);
        window.location.href = PATHS.INDEX;
    }
};

/**
الحصول على رابط الملف الشخصي للمستخدم
@param {string} role
@returns {string}
*/
export const getProfileRoute = (role) => {
    const routes = {
        "salon": PATHS.PROFILE_SALON,
        "store": PATHS.PROFILE_STORE,
        "customer": PATHS.PROFILE_CUSTOMER
    };
    return routes[role] || PATHS.PROFILE_CUSTOMER;
};

/**
التحقق من أن المستخدم في صفحته الصحيحة حسب الدور
@returns {Promise<boolean>}
*/
export const verifyProfileAccess = async () => {
    const user = await getCurrentUser();
    if (!user) return false;

    const currentPath = window.location.pathname;
    const expectedPath = getProfileRoute(user.role);
    return currentPath.includes(expectedPath);
};

