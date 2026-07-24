/**
 * BarberFlow Pro - صفحة الترحيب الديناميكية
 * المسار: onboarding/welcome.js
 * الدور: التعرف على المستخدم وتوجيهه تلقائياً حسب دوره
 */

import { auth, db } from "../config/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/utils/paths.js";

// ============================================
// عناصر DOM
// ============================================
const welcomeTitle = document.getElementById('welcomeTitle');
const welcomeDesc = document.getElementById('welcomeDesc');
const progressBar = document.getElementById('progressBar');
const redirectInfo = document.getElementById('redirectInfo');
const redirectText = document.getElementById('redirectText');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// ============================================
// رسائل الترحيب حسب الدور
// ============================================
const WELCOME_MESSAGES = {
    'salon': {
        title: 'مرحباً بك، صاحب الصالون! 💈',
        desc: 'نبدأ الآن بإعداد صالونك الاحترافي وجعله جاهزاً لاستقبال الحجوزات',
        redirect: 'جاري توجيهك لإعداد الصالون...',
        icon: 'fa-cut'
    },
    'store': {
        title: 'مرحباً بك، صاحب المتجر! 🛍️',
        desc: 'نبدأ الآن بإعداد متجرك لعرض منتجاتك وجذب العملاء',
        redirect: 'جاري توجيهك لإعداد المتجر...',
        icon: 'fa-store'
    },
    'customer': {
        title: 'مرحباً بك، زبوننا المميز! ',
        desc: 'نبدأ الآن بتخصيص تجربتك لاكتشاف أفضل الصالونات والخدمات',
        redirect: 'جاري توجيهك لإعداد ملفك الشخصي...',
        icon: 'fa-user'
    }
};

// ============================================
// الوجهات حسب الدور
// ============================================
const DESTINATIONS = {
    'salon': PATHS.ADD_SALON,
    'store': PATHS.ADD_STORE,
    'customer': PATHS.ADD_CUSTOMER
};

// ============================================
// المتغيرات العامة
// ============================================
let currentUserData = null;
let redirectTimeout = null;

// ============================================
// دوال مساعدة
// ============================================

/**
 * تحديث واجهة المستخدم حسب الدور
 */
function updateUI(role) {
    const messages = WELCOME_MESSAGES[role] || WELCOME_MESSAGES['customer'];
    
    if (welcomeTitle) {
        welcomeTitle.textContent = messages.title;
    }
    
    if (welcomeDesc) {
        welcomeDesc.textContent = messages.desc;
    }
    
    if (redirectText) {
        redirectText.textContent = messages.redirect;
    }
    
    // تحديث الأيقونة
    const iconElement = document.querySelector('.welcome-icon i');
    if (iconElement) {
        iconElement.className = `fas ${messages.icon}`;
    }
}

/**
 * بدء شريط التقدم
 */
function startProgressBar(duration = 3000) {
    if (!progressBar) return;
    
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    
    setTimeout(() => {
        progressBar.style.transition = `width ${duration}ms linear`;
        progressBar.style.width = '100%';
    }, 50);
}

/**
 * عرض رسالة خطأ
 */
function showError(message) {
    if (redirectInfo) redirectInfo.classList.add('hidden');
    if (errorContainer) errorContainer.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = message;
}

/**
 * إخفاء رسالة الخطأ
 */
function hideError() {
    if (errorContainer) errorContainer.classList.add('hidden');
    if (redirectInfo) redirectInfo.classList.remove('hidden');
}

/**
 * التوجيه إلى الصفحة المناسبة
 */
function redirectToDestination(role) {
    const destination = DESTINATIONS[role];
    
    if (!destination) {
        showError('دور المستخدم غير محدد');
        return;
    }
    
    // حفظ البيانات في sessionStorage
    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userUid', currentUserData.uid);
    sessionStorage.setItem('lastActivePage', 'welcome');
    
    showNotification('جاري توجيهك لصفحة الإعداد...', 'info');
    
    // التوجيه بعد تأخير بسيط
    setTimeout(() => {
        window.location.href = resolvePath(destination);
    }, 500);
}

/**
 * التحقق من حالة المستخدم وجلب بياناته
 */
async function checkUserAndRedirect() {
    try {
        // التحقق من تسجيل الدخول
        const user = auth.currentUser;
        
        if (!user) {
            showError('لم يتم العثور على جلسة نشطة. يرجى تسجيل الدخول مرة أخرى.');
            setTimeout(() => {
                window.location.replace(resolvePath(PATHS.LOGIN));
            }, 3000);
            return;
        }
        
        // جلب بيانات المستخدم من Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            showError('لم يتم العثور على بيانات الحساب. يرجى إعادة التسجيل.');
            setTimeout(() => {
                window.location.replace(resolvePath(PATHS.LOGIN));
            }, 3000);
            return;
        }
        
        // حفظ بيانات المستخدم
        currentUserData = {
            uid: user.uid,
            ...userDoc.data()
        };
        
        const role = currentUserData.role || 'customer';
        
        // التحقق من إكمال الإعداد مسبقاً
        const onboardingStatus = currentUserData.onboardingStatus;
        
        if (onboardingStatus === 'basic_done' || onboardingStatus === 'completed') {
            // المستخدم أكمل الإعداد مسبقاً، توجيهه للصفحة الرئيسية
            welcomeTitle.textContent = 'مرحباً بعودتك! ';
            welcomeDesc.textContent = 'تم التعرف على حسابك. جاري توجيهك للصفحة الرئيسية...';
            redirectText.textContent = 'جاري التوجيه للصفحة الرئيسية...';
            
            setTimeout(() => {
                window.location.href = resolvePath(PATHS.INDEX);
            }, 2000);
            return;
        }
        
        // تحديث الواجهة حسب الدور
        updateUI(role);
        
        // بدء شريط التقدم
        startProgressBar(3000);
        
        // التوجيه بعد 3 ثوانٍ
        redirectTimeout = setTimeout(() => {
            redirectToDestination(role);
        }, 3000);
        
    } catch (error) {
        console.error('خطأ في التحقق من المستخدم:', error);
        showError('حدث خطأ في التعرف على حسابك. يرجى المحاولة مرة أخرى.');
    }
}

// ============================================
// مراقبة حالة المصادقة
// ============================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        // المستخدم مسجل، التحقق من البيانات
        checkUserAndRedirect();
    } else {
        // المستخدم غير مسجل
        showError('انتهت الجلسة. جاري توجيهك لصفحة تسجيل الدخول...');
        setTimeout(() => {
            window.location.replace(resolvePath(PATHS.LOGIN));
        }, 2000);
    }
});

// ============================================
// زر إعادة المحاولة
// ============================================
if (retryBtn) {
    retryBtn.onclick = () => {
        hideError();
        checkUserAndRedirect();
    };
}

// ============================================
// حماية من فقدان الجلسة
// ============================================
window.addEventListener('beforeunload', () => {
    if (currentUserData) {
        sessionStorage.setItem('lastActivePage', 'welcome');
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());
    }
});

// ============================================
// التحقق من صلاحية الجلسة عند التحميل
// ============================================
window.addEventListener('load', () => {
    const timestamp = sessionStorage.getItem('sessionTimestamp');
    
    if (timestamp) {
        const elapsed = Date.now() - parseInt(timestamp);
        const maxSessionTime = 30 * 60 * 1000; // 30 دقيقة
        
        if (elapsed > maxSessionTime) {
            console.warn('الجلسة منتهية الصلاحية');
            sessionStorage.clear();
        }
    }
});

