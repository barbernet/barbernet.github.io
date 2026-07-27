/**
 * middleware/routing/profile-route.js
 * التوجيه الذكي لملفات المستخدمين حسب أدوارهم
 */
import { supabase } from '../../config/supabase-init.js';
import { getCurrentUser } from '../auth/auth-state.js';
import { PATHS } from '../../shared/utils/paths.js';

/**
 * توجيه المستخدم لصفحة ملفه الشخصي حسب دوره
 * @param {string} userId - معرف المستخدم (اختياري)
 */
export const navigateToUserDashboard = async (userId = null) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = userId ? { id: userId } : session?.user;

        if (!user) {
            window.location.href = PATHS.LOGIN;
            return;
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            console.warn("User profile not found, redirecting to login");
            window.location.href = PATHS.LOGIN;
            return;
        }

        const role = profile.role || 'customer';
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
 * الحصول على رابط الملف الشخصي للمستخدم
 * @param {string} role
 * @returns {string}
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
 * التحقق من أن المستخدم في صفحته الصحيحة حسب الدور
 * @returns {Promise<boolean>}
 */
export const verifyProfileAccess = async () => {
    const user = await getCurrentUser();
    if (!user) return false;

    const currentPath = window.location.pathname;
    const expectedPath = getProfileRoute(user.role);
    return currentPath.includes(expectedPath);
};

