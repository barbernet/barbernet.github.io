import { PATHS, resolvePath } from '../shared/js/paths.js';
import { showNotification } from '../shared/js/notifications.js';

// ============================================
// 1. استخراج رمز oobCode من URL (لربط Firebase لاحقاً)
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
}

// ============================================
// 2. إدارة النموذج
// ============================================
const form = document.getElementById('resetPasswordForm');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('submitBtn');
const passwordStrength = document.getElementById('passwordStrength');
const matchIndicator = document.getElementById('matchIndicator');

// ============================================
// 3. إظهار/إخفاء كلمة المرور
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
// 4. التحقق من قوة كلمة المرور
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
// 5. التحقق من تطابق كلمتي المرور
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
// 6. معالجة النموذج
// ============================================
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        
        // التحقق من صحة المدخلات
        if (newPassword.length < 8) {
            showNotification('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
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
            // 🔥 هنا سيتم ربط Firebase Auth لاحقاً
            // await confirmPasswordReset(auth, oobCode, newPassword);
            
            // محاكاة نجاح العملية
            await simulateApiCall();
            
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
            showNotification('حدث خطأ. يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            setLoadingState(false);
        }
    });
}

// ============================================
// 7. دوال مساعدة
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

function simulateApiCall() {
    return new Promise(resolve => setTimeout(resolve, 1500));
}

// ============================================
// 8. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة إعادة تعيين كلمة المرور جاهزة');
    if (oobCode) {
        console.log('✓ تم العثور على رمز oobCode:', oobCode);
    }
    newPasswordInput.focus();
});

