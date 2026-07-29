/**
 * BarberFlow Pro - حارس حماية الصفحات المدفوعة
 * المسار: middleware/guards/subscription-route-guard.js
 * الدور: التحقق من صلاحية الاشتراك قبل الوصول للصفحات المحمية
 */
import { checkSubscription } from '../subscription/subscription-guard.js';
import { getCurrentUserId } from '../auth/auth-state.js';
import { showNotification } from '../../shared/utils/notifications.js';
import { resolvePath } from '../../shared/utils/paths.js';

/**
 * التحقق من أن المستخدم يملك اشتراك نشط قبل الوصول لصفحة
 * @param {string} requiredPlan - الباقة المطلوبة ('starter', 'professional', 'enterprise')
 * @param {string} redirectPath - مسار التوجيه عند الفشل (اختياري)
 * @returns {Promise<boolean>}
 */
export const requireActiveSubscription = async (
    requiredPlan = 'starter',
    redirectPath = null
) => {
    try {
        // 1. التحقق من تسجيل الدخول
        const userId = await getCurrentUserId();
        if (!userId) {
            showNotification('يجب تسجيل الدخول أولاً للوصول لهذه الميزة', 'warning');
            setTimeout(() => {
                window.location.href = resolvePath('LOGIN');
            }, 1500);
            return false;
        }

        // 2. التحقق من الاشتراك
        const sub = await checkSubscription(userId);
        
        if (!sub.active) {
            const message = sub.expired
                ? 'انتهت صلاحية اشتراكك. يرجى التجديد للاستمرار.'
                : `هذه الميزة متاحة للباقة ${getPlanDisplayName(requiredPlan)} فأعلى`;
            
            showNotification(message, 'warning');
            setTimeout(() => {
                window.location.replace(redirectPath || resolvePath('PRO'));
            }, 1500);
            return false;
        }

        // 3. التحقق من مستوى الباقة
        const planHierarchy = ['starter', 'professional', 'enterprise'];
        const userLevel = planHierarchy.indexOf(sub.plan);
        const requiredLevel = planHierarchy.indexOf(requiredPlan);

        if (userLevel < requiredLevel) {
            showNotification(
                `هذه الميزة متاحة للباقة ${getPlanDisplayName(requiredPlan)} فأعلى. باقتك الحالية: ${getPlanDisplayName(sub.plan)}`,
                'warning'
            );
            setTimeout(() => {
                window.location.replace(redirectPath || resolvePath('PRO'));
            }, 1500);
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ خطأ في التحقق من الاشتراك:', error);
        showNotification('حدث خطأ في التحقق من الاشتراك', 'error');
        return false;
    }
};

/**
 * التحقق من أن المستخدم يملك ميزة معينة
 * @param {string} feature - اسم الميزة
 * @param {string} redirectPath - مسار التوجيه عند الفشل
 * @returns {Promise<boolean>}
 */
export const requireFeature = async (feature, redirectPath = null) => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            showNotification('يجب تسجيل الدخول أولاً', 'warning');
            window.location.href = resolvePath('LOGIN');
            return false;
        }

        const sub = await checkSubscription(userId);
        
        if (!sub.active || !sub.features[feature]) {
            showNotification(`هذه الميزة (${feature}) غير متاحة في باقتك الحالية`, 'warning');
            setTimeout(() => {
                window.location.replace(redirectPath || resolvePath('PRO'));
            }, 1500);
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ خطأ في التحقق من الميزة:', error);
        return false;
    }
};

/**
 * حماية عنصر في الصفحة (عرضه مقفلاً لغير المشتركين)
 * @param {string} elementId - معرف العنصر
 * @param {string} requiredPlan - الباقة المطلوبة
 * @param {string} featureName - اسم الميزة للعرض
 */
export const protectElement = async (elementId, requiredPlan, featureName) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const userId = await getCurrentUserId();
    if (!userId) {
        lockElement(element, featureName, true);
        return;
    }

    const sub = await checkSubscription(userId);
    const planHierarchy = ['starter', 'professional', 'enterprise'];
    const userLevel = planHierarchy.indexOf(sub.plan || 'none');
    const requiredLevel = planHierarchy.indexOf(requiredPlan);

    if (!sub.active || userLevel < requiredLevel) {
        lockElement(element, featureName, false);
    }
};

/**
 * قفل عنصر وعرض رسالة ترقية
 */
function lockElement(element, featureName, needsLogin) {
    element.innerHTML = `
        <div class="locked-feature" style="
            padding: 30px;
            text-align: center;
            background: var(--bg-tertiary);
            border-radius: var(--radius-lg);
            border: 2px dashed var(--brand-accent);
        ">
            <i class="fas fa-lock" style="
                font-size: 2.5rem;
                color: var(--brand-accent);
                margin-bottom: 15px;
            "></i>
            <h3 style="color: var(--text-primary); margin-bottom: 10px;">
                ${needsLogin ? 'سجّل دخولك أولاً' : 'ميزة حصرية'}
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                ${needsLogin 
                    ? 'للوصول إلى هذه الميزة، يرجى تسجيل الدخول'
                    : `للوصول إلى ${featureName}، يرجى الترقية لباقة مدفوعة`}
            </p>
            <a href="${resolvePath(needsLogin ? 'LOGIN' : 'PRO')}" 
               class="btn btn-accent" 
               style="display: inline-flex; width: auto;">
                <i class="fas ${needsLogin ? 'fa-sign-in-alt' : 'fa-crown'}"></i>
                <span>${needsLogin ? 'تسجيل الدخول' : 'ترقية الباقة'}</span>
            </a>
        </div>
    `;
}

/**
 * الحصول على اسم الباقة بالعربية
 */
function getPlanDisplayName(plan) {
    const names = {
        'starter': 'Starter',
        'professional': 'Professional',
        'enterprise': 'Enterprise'
    };
    return names[plan] || plan;
}

export default {
    requireActiveSubscription,
    requireFeature,
    protectElement
};

