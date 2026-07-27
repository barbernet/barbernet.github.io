/**
 * middleware/subscription/subscription-guard.js
 * للتحقق من صلاحية الاشتراك قبل الوصول للمميزات
 * ملاحظة: جدول subscriptions يجب إنشاؤه في Supabase
 */
import { supabase } from "../../config/supabase-init.js";
import { showNotification } from "../../shared/utils/notifications.js";
import { PATHS, resolvePath } from "../../shared/utils/paths.js";

/**
 * التحقق من حالة الاشتراك الحالي للمستخدم
 * @param {string} userId - معرف المستخدم
 * @returns {Promise<Object>} حالة الاشتراك
 */
export async function checkSubscription(userId) {
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return { active: false, plan: 'none', features: {} };
        }

        const now = new Date();
        const endDate = new Date(data.end_date);

        if (now > endDate) {
            return { 
                active: false, 
                plan: data.plan, 
                expired: true, 
                features: {} 
            };
        }

        return {
            active: true,
            plan: data.plan,
            features: data.features || {},
            endDate: endDate,
            subscriptionId: data.id
        };
    } catch (error) {
        console.error("خطأ في التحقق من الاشتراك:", error);
        return { active: false, plan: 'none', features: {} };
    }
}

/**
 * التحقق من أن المستخدم يملك ميزة معينة
 * @param {string} userId
 * @param {string} feature - اسم الميزة
 * @returns {Promise<boolean>}
 */
export async function hasFeature(userId, feature) {
    const sub = await checkSubscription(userId);
    return sub.active && sub.features[feature] === true;
}

/**
 * دالة حماية تتطلب اشتراك معين
 * @param {string} requiredPlan - الباقة المطلوبة
 * @param {string} redirectPath - مسار التوجيه عند الفشل
 * @returns {Function}
 */
export function requireSubscription(requiredPlan, redirectPath) {
    return async (userId) => {
        const sub = await checkSubscription(userId);
        
        if (!sub.active) {
            showNotification(`هذه الميزة متاحة للباقة ${requiredPlan} فأعلى`, "warning");
            window.location.replace(redirectPath || resolvePath('PRO'));
            return false;
        }

        const planHierarchy = ['starter', 'professional', 'enterprise'];
        const userLevel = planHierarchy.indexOf(sub.plan);
        const requiredLevel = planHierarchy.indexOf(requiredPlan);

        if (userLevel < requiredLevel) {
            showNotification(`هذه الميزة متاحة لباقة ${requiredPlan} فأعلى`, "warning");
            window.location.replace(redirectPath || resolvePath('PRO'));
            return false;
        }

        return true;
    };
}

/**
 * عرض محتوى مقفل للمستخدمين غير المشتركين
 * @param {string} containerId - معرف العنصر
 * @param {string} featureName - اسم الميزة
 */
export function showLockedContent(containerId, featureName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="locked-feature">
            <i class="fas fa-lock"></i>
            <h3>هذه الميزة متاحة للمشتركين فقط</h3>
            <p>للوصول إلى ${featureName}، يرجى الترقية إلى باقة Professional أو Enterprise</p>
            <a href="${resolvePath('PRO')}" class="upgrade-btn">
                <i class="fas fa-crown"></i>
                <span>ترقية الباقة الآن</span>
            </a>
        </div>
    `;
}

