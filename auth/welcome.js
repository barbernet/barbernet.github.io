/**
BarberFlow Pro - صفحة الترحيب الديناميكية وحارس التوجيه
المسار: onboarding/welcome.js
*/
import { supabase } from "../config/supabase-init.js";
import { showNotification } from "../shared/utils/notifications.js";
import { resolvePath } from "../shared/utils/paths.js";

// ============================================
// 1. نظام الحماية المدمج
// ============================================
const safetyTimer = setTimeout(() => {
    console.warn("⚠️ Safety Timer Triggered: Redirecting to login.");
    window.location.replace(resolvePath('LOGIN'));
}, 5000);

// ============================================
// 2. رسائل وأيقونات الترحيب حسب الدور
// ============================================
const WELCOME_DATA = {
    'customer': {
        title: 'مرحباً بك، زبوننا المميز! ✨',
        desc: 'نبدأ الآن بتخصيص تجربتك لاكتشاف أفضل الصالونات والخدمات',
        icon: 'fa-user',
        empty: resolvePath('ADD_CUSTOMER'),
        setup: resolvePath('SETUP_CUSTOMER'),
        profile: resolvePath('PROFILE_CUSTOMER')
    },
    'salon': {
        title: 'مرحباً بك، صاحب الصالون! 💈',
        desc: 'نبدأ الآن بإعداد صالونك الاحترافي وجعله جاهزاً لاستقبال الحجوزات',
        icon: 'fa-cut',
        empty: resolvePath('ADD_SALON'),
        setup: resolvePath('SETUP_SALON'),
        profile: resolvePath('PROFILE_SALON')
    },
    'store': {
        title: 'مرحباً بك، صاحب المتجر! 🛍️',
        desc: 'نبدأ الآن بإعداد متجرك لعرض منتجاتك وجذب العملاء',
        icon: 'fa-store',
        empty: resolvePath('ADD_STORE'),
        setup: resolvePath('SETUP_STORE'),
        profile: resolvePath('PROFILE_STORE')
    }
};

// ============================================
// 3. عناصر DOM
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
// 4. دوال مساعدة
// ============================================
function updateUI(data) {
    if (welcomeTitle) welcomeTitle.textContent = data.title;
    if (welcomeDesc) welcomeDesc.textContent = data.desc;
    if (redirectText) redirectText.textContent = 'جاري التوجيه...';
    
    const iconElement = document.querySelector('.welcome-icon i');
    if (iconElement) iconElement.className = `fas ${data.icon}`;
}

function startProgressBar(duration = 2000) {
    if (!progressBar) return;
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    setTimeout(() => {
        progressBar.style.transition = `width ${duration}ms linear`;
        progressBar.style.width = '100%';
    }, 50);
}

function showError(message) {
    if (redirectInfo) redirectInfo.classList.add('hidden');
    if (errorContainer) errorContainer.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = message;
}

function hideError() {
    if (errorContainer) errorContainer.classList.add('hidden');
    if (redirectInfo) redirectInfo.classList.remove('hidden');
}

// ============================================
// 5. المنطق المركزي للتوجيه (الحارس الذكي)
// ============================================
async function checkUserAndRedirect() {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // ❌ الحالة 1: غير مسجل → توجيه إلى Login
        if (sessionError || !session?.user) {
            showNotification("يرجى تسجيل الدخول للمتابعة", "warning");
            setTimeout(() => window.location.replace(resolvePath('LOGIN')), 1500);
            return;
        }

        const user = session.user;

        // ❌ الحالة 2: مسجل لكن البريد غير مفعل → توجيه إلى Verify Email
        if (!user.email_confirmed_at) {
            showNotification("يرجى تفعيل بريدك الإلكتروني أولاً", "warning");
            setTimeout(() => window.location.replace(resolvePath('VERIFY_EMAIL')), 1500);
            return;
        }

        // ✅ جلب بيانات المستخدم من جدول users
        const { data: userData, error: dbError } = await supabase
            .from('users')
            .select('role, onboarding_status, full_name')
            .eq('id', user.id)
            .single();

        if (dbError || !userData) {
            showError('لم يتم العثور على بيانات الحساب. يرجى إعادة التسجيل.');
            setTimeout(() => window.location.replace(resolvePath('REGISTER')), 3000);
            return;
        }

        const role = userData.role || 'customer';
        const status = userData.onboarding_status || 'empty';
        const welcomeData = WELCOME_DATA[role] || WELCOME_DATA['customer'];

        // تحديث الواجهة
        updateUI(welcomeData);
        startProgressBar(2000);

        // ✅ الحالة 3: حساب فارغ (جديد) → توجيه إلى Add Page
        if (status === 'empty' || !status) {
            redirectText.textContent = 'جاري توجيهك لإكمال البيانات الأولية...';
            setTimeout(() => window.location.replace(welcomeData.empty), 2000);
            return;
        }

        // ✅ الحالة 4: حساب غير مكتمل → توجيه إلى Setup Page
        if (status === 'incomplete') {
            redirectText.textContent = 'جاري توجيهك لإكمال إعداد الحساب...';
            setTimeout(() => window.location.replace(welcomeData.setup), 2000);
            return;
        }

        // ✅ الحالة 5: حساب مكتمل → توجيه إلى Profile
        if (status === 'completed') {
            redirectText.textContent = 'جاري توجيهك لملفك الشخصي...';
            setTimeout(() => window.location.replace(welcomeData.profile), 2000);
            return;
        }

        // fallback آمن
        window.location.replace(welcomeData.profile);

    } catch (error) {
        console.error('خطأ في التحقق من المستخدم:', error);
        showError('حدث خطأ في التعرف على حسابك. يرجى المحاولة مرة أخرى.');
    } finally {
        clearTimeout(safetyTimer);
    }
}

// ============================================
// 6. التشغيل عند تحميل الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // إزالة Loader وإظهار المحتوى للحظات قبل التوجيه
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
    
    checkUserAndRedirect();
});

// زر إعادة المحاولة
if (retryBtn) {
    retryBtn.onclick = () => {
        hideError();
        checkUserAndRedirect();
    };
}

