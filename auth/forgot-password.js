/**
BarberFlow Pro - صفحة نسيت كلمة المرور
المسار: auth/forgot-password.js
*/
import { auth } from "../config/firebase-init.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { PATHS, resolvePath } from "../shared/utils/paths.js";
import { showNotification } from "../shared/utils/notifications.js";
import { sanitizeEmail } from "../middleware/validation/index.js";
import { initPageGuard } from "../middleware/routing/page-guard.js";

// ============================================
// تهيئة حماية الصفحة
// ============================================
initPageGuard();

// ============================================
// إدارة النموذج
// ============================================
const form = document.getElementById('forgotPasswordForm');
const emailInput = document.getElementById('email');
const submitBtn = form ? form.querySelector('.auth-submit-btn') : null;

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const sanitizedEmail = sanitizeEmail(email);

        if (!sanitizedEmail) {
            showNotification('يرجى إدخال بريد إلكتروني صحيح', 'error');
            return;
        }

        setLoadingState(true);

        try {
            await sendPasswordResetEmail(auth, sanitizedEmail);
            showNotification(
                'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. تحقق من صندوق الوارد (وبريد السبام أيضاً).',
                'success',
                6000
            );
            setTimeout(() => {
                window.location.href = resolvePath('LOGIN');
            }, 3000);
        } catch (error) {
            console.error('خطأ في إرسال رابط إعادة التعيين:', error);
            if (error.code === 'auth/user-not-found') {
                showNotification('لا يوجد حساب مرتبط بهذا البريد الإلكتروني', 'error');
            } else if (error.code === 'auth/invalid-email') {
                showNotification('صيغة البريد الإلكتروني غير صحيحة', 'error');
            } else if (error.code === 'auth/too-many-requests') {
                showNotification('تم إرسال الكثير من الطلبات. يرجى الانتظار قليلاً.', 'error');
            } else {
                showNotification('حدث خطأ. يرجى المحاولة مرة أخرى.', 'error');
            }
        } finally {
            setLoadingState(false);
        }
    });
}

// ============================================
// دوال مساعدة
// ============================================
function setLoadingState(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال رابط إعادة التعيين';
    }
}

// ============================================
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة نسيت كلمة المرور جاهزة');
    if (emailInput) emailInput.focus();
});

// ============================================
// تحديث الروابط باستخدام paths.js
// ============================================
function updateLinks() {
    const backToLoginLink = document.getElementById('backToLoginLink');
    if (backToLoginLink) {
        backToLoginLink.href = resolvePath('LOGIN');
    }
}

// استدعاء عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    updateLinks();
    console.log('✅ صفحة نسيت كلمة المرور جاهزة');
    emailInput.focus();
});

