/**
 * middleware/subscription/subscription-guard.js
 * للتحقق من صلاحية الاشتراك قبل الوصول للمميزات
 */

import { db } from "../../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showNotification } from "../../shared/js/notifications.js";
import { PATHS, resolvePath } from "../../shared/js/paths.js";

/**
 * التحقق من وجود اشتراك نشط
 * @param {string} userId - معرف المستخدم
 * @returns {Promise<Object>} { active: boolean, plan: string, features: Object }
 */
export async function checkSubscription(userId) {
    try {
        const subDoc = await getDoc(doc(db, "users", userId, "subscription", "current"));
        
        if (!subDoc.exists()) {
            return { active: false, plan: 'none', features: {} };
        }
        
        const sub = subDoc.data();
        const now = new Date();
        const endDate = sub.endDate.toDate ? sub.endDate.toDate() : new Date(sub.endDate);
        
        // التحقق من انتهاء الصلاحية
        if (now > endDate) {
            return { active: false, plan: sub.plan, expired: true, features: {} };
        }
        
        return {
            active: true,
            plan: sub.plan,
            features: sub.features || {},
            endDate: endDate
        };
    } catch (error) {
        console.error("خطأ في التحقق من الاشتراك:", error);
        return { active: false, plan: 'none', features: {} };
    }
}

/**
 * التحقق من ميزة معينة
 * @param {string} userId
 * @param {string} feature - اسم الميزة
 * @returns {Promise<boolean>}
 */
export async function hasFeature(userId, feature) {
    const sub = await checkSubscription(userId);
    return sub.active && sub.features[feature] === true;
}

/**
 * Middleware لحماية الصفحات
 * @param {string} requiredPlan - الباقة المطلوبة (starter, professional, enterprise)
 * @param {string} redirectPath - مسار التوجيه في حال عدم الصلاحية
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
 * عرض محتوى مقفل للمستخدمين بدون اشتراك
 * @param {string} containerId - معرف الحاوية
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

