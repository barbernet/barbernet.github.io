/**
 * middleware/auth/auth-state.js
 * إدارة حالة المستخدم الحالية
 * الدور: جلب بيانات المستخدم من Supabase Auth + جدول profiles
 */
import { supabase } from "../../config/supabase-init.js";

/**
 * جلب بيانات المستخدم الحالي مع معلوماته الكاملة من جدول profiles
 * @returns {Promise<Object|null>} بيانات المستخدم أو null إذا لم يكن مسجلاً
 */
export const getCurrentUser = async () => {
    try {
        // الحصول على الجلسة الحالية
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            return null;
        }

        const user = session.user;
        
        // جلب بيانات المستخدم من جدول profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            // المستخدم موجود في Auth لكن ليس في profiles
            return {
                id: user.id,
                email: user.email,
                phone: user.user_metadata?.phone || null,
                full_name: user.user_metadata?.full_name || null,
                avatar_url: user.user_metadata?.avatar_url || null,
                role: 'customer',
                onboarding_status: 'empty'
            };
        }

        // دمج بيانات Supabase Auth مع profiles
        return {
            id: user.id,
            email: user.email,
            phone: profile.phone || user.user_metadata?.phone || null,
            full_name: profile.full_name || user.user_metadata?.full_name || null,
            avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || null,
            role: profile.role,
            onboarding_status: profile.onboarding_status,
            created_at: profile.created_at,
            updated_at: profile.updated_at
        };
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};

/**
 * التحقق مما إذا كان المستخدم مسجل الدخول حالياً
 * @returns {Promise<boolean>}
 */
export const isUserLoggedIn = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    } catch (error) {
        console.error("Error checking login status:", error);
        return false;
    }
};

/**
 * جلب معرف المستخدم الحالي
 * @returns {Promise<string|null>}
 */
export const getCurrentUserId = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id || null;
    } catch (error) {
        console.error("Error getting user ID:", error);
        return null;
    }
};

