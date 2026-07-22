import { PATHS, resolvePath } from '../shared/js/paths.js';
import { showNotification } from '../shared/js/notifications.js';

// ============================================
// 1. إدارة النموذج
// ============================================
const form = document.getElementById('forgotPasswordForm');
const emailInput = document.getElementById('email');
const submitBtn = form.querySelector('.auth-submit-btn');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // التحقق من صحة البريد
        if (!email || !isValidEmail(email)) {
            showNotification('يرجى إدخال بريد إلكتروني صحيح', 'error');
            return;
        }
        
        // تعطيل الزر أثناء الإرسال
        setLoadingState(true);
        
        try {
            // 🔥 هنا سيتم ربط Firebase Auth لاحقاً
            // await sendPasswordResetEmail(auth, email);
            
            // محاكاة نجاح العملية
            await simulateApiCall();
            
            showNotification(
                'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. تحقق من صندوق الوارد (وبريد السبام أيضاً).',
                'success',
                6000
            );
            
            // إعادة توجيه إلى تسجيل الدخول بعد 3 ثوانٍ
            setTimeout(() => {
                window.location.href = resolvePath('LOGIN');
            }, 3000);
            
        } catch (error) {
            console.error('خطأ في إرسال رابط إعادة التعيين:', error);
            showNotification('حدث خطأ. يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            setLoadingState(false);
        }
    });
}

// ============================================
// 2. دوال مساعدة
// ============================================
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function setLoadingState(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال رابط إعادة التعيين';
    }
}

function simulateApiCall() {
    return new Promise(resolve => setTimeout(resolve, 1500));
}

// ============================================
// 3. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة نسيت كلمة المرور جاهزة');
    emailInput.focus();
});

