/**
 * middleware/routing/page-guard.js
 * نظام حماية الصفحات ومنع الومضة (FOUC)
 * الدور: إنشاء شاشة تحميل احترافية والتحقق من الصلاحيات
 */
import { supabase } from "../../config/supabase-init.js";
import { showNotification } from "../../shared/utils/notifications.js";
import { PATHS, resolvePath } from "../../shared/utils/paths.js";

/**
 * إنشاء شاشة التحميل الاحترافية
 */
function createPageLoader() {
    if (document.getElementById('pageLoader')) return;
    
    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className = 'page-loader-overlay';
    loader.innerHTML = `
        <div class="loader-logo-wrapper">
            <div class="loader-logo">
                <i class="fas fa-cut"></i>
            </div>
        </div>
        <div class="loader-brand">BarberFlow Pro</div>
        <div class="loader-text">جاري التحميل</div>
        <div class="loader-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    document.body.appendChild(loader);
}


/**
 * إخفاء شاشة التحميل وإظهار الصفحة
 */
function hidePageLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
    document.body.classList.remove('page-protected');
    document.body.classList.add('page-loaded');
}

/**
 * تهيئة حماية الصفحة
 * @param {Object} options - خيارات الحماية
 * @param {string[]} options.requiredRoles - الأدوار المسموح لها
 * @param {boolean} options.checkRole - هل يجب التحقق من الدور؟
 * @param {boolean} options.redirectIfLoggedIn - هل يجب توجيه المسجلين؟
 */
export function initPageGuard(options = {}) {
    const { requiredRoles = [], checkRole = false, redirectIfLoggedIn = true } = options;

    // 1. إنشاء شاشة التحميل
    createPageLoader();
    
    // 2. إخفاء الصفحة فوراً
    document.body.classList.add('page-protected');
    document.body.classList.remove('page-loaded');

    // 3. التحقق من المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
            if (event === 'INITIAL_SESSION' && session) {
                const user = session.user;
                
                // حالة خاصة: توجيه المستخدمين المسجلين
                if (redirectIfLoggedIn && user) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('role, onboarding_status')
                        .eq('id', user.id)
                        .single();

                    if (!error && profile) {
                        const role = profile.role;
                        const routes = {
                            'salon': resolvePath('PROFILE_SALON'),
                            'store': resolvePath('PROFILE_STORE'),
                            'customer': resolvePath('PROFILE_CUSTOMER')
                        };
                        const targetRoute = routes[role] || resolvePath('INDEX');
                        
                        showNotification("أنت مسجل دخولك بالفعل، جاري توجيهك...", "info");
                        setTimeout(() => {
                            window.location.replace(targetRoute);
                        }, 1500);
                        return;
                    }
                }

                // التحقق من الأدوار
                if (checkRole && requiredRoles.length > 0 && user) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    if (!error && profile) {
                        const userRole = profile.role;
                        if (!requiredRoles.includes(userRole)) {
                            showNotification("ليس لديك صلاحية الوصول إلى هذه الصفحة", "error");
                            setTimeout(() => {
                                window.location.replace(resolvePath('INDEX'));
                            }, 1500);
                            return;
                        }
                    }
                }

                // 4. كل شيء تمام، أظهر الصفحة
                hidePageLoader();
            } else if (!session) {
                hidePageLoader();
            }
        } catch (error) {
            console.error("Page Guard Error:", error);
            hidePageLoader();
        }
    });

    // مهلة زمنية للأمان (5 ثوانٍ)
    setTimeout(() => {
        hidePageLoader();
    }, 5000);
}

export default initPageGuard;

