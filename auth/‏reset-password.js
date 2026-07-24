/**
BarberFlow Pro - صفحة إعادة تعيين كلمة المرور
المسار: auth/reset-password.js
*/
import { auth } from "../config/firebase-init.js"; // ✅ تم تصحيح المسار
import { confirmPasswordReset, verifyPasswordResetCode } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { PATHS, resolvePath } from "../shared/utils/paths.js"; // ✅ تم تصحيح المسار
import { showNotification } from "../shared/utils/notifications.js"; // ✅ تم تصحيح المسار
import { initPageGuard } from "../middleware/routing/page-guard.js"; // ✅ إضافة الحماية

// ============================================
// 1. تهيئة حماية الصفحة
// ============================================
initPageGuard(); // ✅ إخفاء الصفحة فوراً

// ============================================
// 2. استخراج رمز oobCode من URL
// ============================================
function getOobCodeFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('oobCode');
}

const oobCode = getOobCodeFromUrl();
if (!oobCode) {
    console.warn('⚠️ لم يتم العثور على رمز oobCode في الرابط');
    showNotification('رابط إعادة التعيين غير صالح أو منتهي الصلاحية', 'error');
    setTimeout(() => {
        window.location.href = resolvePath('LOGIN');
    }, 3000);
} else {
    // التحقق من صحة الرمز
    verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
            console.log('✓ رمز صالح للبريد:', email);
        })
        .catch((error) => {
            console.error('❌ رمز غير صالح:', error);
            showNotification('رابط إعادة التعيين غير صالح أو منتهي الصلاحية', 'error');
            setTimeout(() => {
                window.location.href = resolvePath('LOGIN');
            }, 3000);
        });
}

// ============================================
// 3. إدارة النموذج
// ============================================
const form = document.getElementById('resetPasswordForm');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('submitBtn');
const passwordStrength = document.getElementById('passwordStrength');
const matchIndicator = document.getElementById('matchIndicator');

// ============================================
// 4. إظهار/إخفاء كلمة المرور
// ============================================
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = btn.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

// ============================================
// 5. التحقق من قوة كلمة المرور
// ============================================
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    
    const strengthBar = passwordStrength.querySelector('.strength-bar');
    const strengthText = passwordStrength.querySelector('.strength-text');
    strengthBar.className = 'strength-bar';
    
    if (strength <= 1) {
        strengthBar.classList.add('strength-weak');
        strengthText.textContent = 'ضعيفة';
    } else if (strength <= 3) {
        strengthBar.classList.add('strength-medium');
        strengthText.textContent = 'متوسطة';
    } else {
        strengthBar.classList.add('strength-strong');
        strengthText.textContent = 'قوية';
    }
    return strength;
}

newPasswordInput.addEventListener('input', () => {
    checkPasswordStrength(newPasswordInput.value);
    checkPasswordMatch();
});

// ============================================
// 6. التحقق من تطابق كلمتي المرور
// ============================================
function checkPasswordMatch() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword === '') {
        matchIndicator.textContent = '';
        matchIndicator.className = 'match-indicator';
        return;
    }
    
    if (newPassword === confirmPassword) {
        matchIndicator.innerHTML = '<i class="fas fa-check-circle"></i> كلمتا المرور متطابقتان';
        matchIndicator.className = 'match-indicator match';
    } else {
        matchIndicator.innerHTML = '<i class="fas fa-times-circle"></i> كلمتا المرور غير متطابقتين';
        matchIndicator.className = 'match-indicator no-match';
    }
}

confirmPasswordInput.addEventListener('input', checkPasswordMatch);

// ============================================
// 7. معالجة النموذج (ربط فعلي بـ Firebase)
// ============================================
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        
        // التحقق من صحة المدخلات
        if (newPassword.length < 6) {
            showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('كلمتا المرور غير متطابقتين', 'error');
            return;
        }
        if (!oobCode) {
            showNotification('رابط إعادة التعيين غير صالح', 'error');
            return;
        }
        
        // تعطيل الزر أثناء الإرسال
        setLoadingState(true);
        
        try {
            // ✅ ربط فعلي بـ Firebase
            await confirmPasswordReset(auth, oobCode, newPassword);
            showNotification(
                'تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.',
                'success'
            );
            // إعادة توجيه إلى تسجيل الدخول بعد 2 ثانية
            setTimeout(() => {
                window.location.href = resolvePath('LOGIN');
            }, 2000);
        } catch (error) {
            console.error('خطأ في إعادة تعيين كلمة المرور:', error);
            if (error.code === 'auth/expired-action-code') {
                showNotification('رابط إعادة التعيين منتهي الصلاحية', 'error');
            } else if (error.code === 'auth/invalid-action-code') {
                showNotification('رابط إعادة التعيين غير صالح', 'error');
            } else {
                showNotification('حدث خطأ. يرجى المحاولة مرة أخرى.', 'error');
            }
        } finally {
            setLoadingState(false);
        }
    });
}

// ============================================
// 8. دوال مساعدة
// ============================================
function setLoadingState(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> حفظ كلمة المرور الجديدة';
    }
}

// ============================================
// 9. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة إعادة تعيين كلمة المرور جاهزة');
    if (oobCode) {
        console.log('✓ تم العثور على رمز oobCode:', oobCode);
    }
    if (newPasswordInput) newPasswordInput.focus();
});

