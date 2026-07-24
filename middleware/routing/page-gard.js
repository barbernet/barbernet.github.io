/**
middleware/routing/page-guard.js
نظام حماية الصفحات ومنع الومضة (FOUC)
الدور: إنشاء شاشة تحميل احترافية والتحقق من الصلاحيات
*/
import { auth, db } from "../../config/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../../shared/utils/notifications.js";
import { PATHS, resolvePath } from "../../shared/utils/paths.js";

/**
إنشاء شاشة التحميل الاحترافية
*/
function createPageLoader() {
    if (document.getElementById('pageLoader')) return;
    
    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className = 'page-loader-overlay';
    loader.innerHTML = `
        <div class="loader-logo">
            <i class="fas fa-cut"></i>
            <span>BarberFlow Pro</span>
        </div>
        <div class="loader-spinner"></div>
        <div class="loader-text">جاري التحميل...</div>
    `;
    document.body.appendChild(loader);
}

/**
إخفاء شاشة التحميل وإظهار الصفحة
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
تهيئة حماية الصفحة
@param {Object} options - خيارات الحماية
@param {string[]} options.requiredRoles - الأدوار المسموح لها
@param {boolean} options.checkRole - هل يجب التحقق من الدور؟
@param {boolean} options.redirectIfLoggedIn - هل يجب توجيه المسجلين؟
*/
export function initPageGuard(options = {}) {
    const { requiredRoles = [], checkRole = false, redirectIfLoggedIn = true } = options;
    
    // 1. إنشاء شاشة التحميل
    createPageLoader();
    
    // 2. إخفاء الصفحة فوراً
    document.body.classList.add('page-protected');
    document.body.classList.remove('page-loaded');
    
    // 3. التحقق من المصادقة
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
            // حالة خاصة: توجيه المستخدمين المسجلين
            if (redirectIfLoggedIn && user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const role = userDoc.data().role;
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
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userRole = userDoc.data().role;
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
        } catch (error) {
            console.error("Page Guard Error:", error);
            hidePageLoader();
        } finally {
            unsubscribe();
        }
    });
    
    // مهلة زمنية للأمان (5 ثوانٍ)
    setTimeout(() => {
        hidePageLoader();
    }, 5000);
}

export default initPageGuard;

