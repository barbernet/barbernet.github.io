import { PATHS, resolvePath } from '../shared/js/paths.js';
import { showNotification } from '../shared/js/notifications.js';

// ============================================
// 1. استخراج معلمات URL (oobCode, mode)
// ============================================
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        oobCode: urlParams.get('oobCode'),
        mode: urlParams.get('mode')
    };
}

const { oobCode, mode } = getUrlParams();

// ============================================
// 2. عناصر DOM
// ============================================
const verificationStatus = document.getElementById('verificationStatus');
const statusIcon = verificationStatus.querySelector('.status-icon');
const statusText = verificationStatus.querySelector('.status-text');
const resendBtn = document.getElementById('resendEmailBtn');
const changeEmailBtn = document.getElementById('changeEmailBtn');

// ============================================
// 3. التحقق من صحة الرابط
// ============================================
async function verifyEmail() {
    if (!oobCode) {
        showErrorState('رابط التأكيد غير صالح أو منتهي الصلاحية');
        return;
    }

    try {
        // 🔥 هنا سيتم ربط Firebase Auth لاحقاً
        // await applyActionCode(auth, oobCode);
        
        // محاكاة عملية التحقق
        await simulateVerification();
        
        showSuccessState();
        
    } catch (error) {
        console.error('خطأ في التحقق من البريد:', error);
        showErrorState('حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.');
    }
}

// ============================================
// 4. عرض حالة النجاح
// ============================================
function showSuccessState() {
    verificationStatus.className = 'verification-status success';
    statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    statusText.textContent = 'تم تأكيد بريدك الإلكتروني بنجاح!';
    
    showNotification('تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.', 'success', 5000);
    
    // إعادة توجيه تلقائي بعد 3 ثوانٍ
    setTimeout(() => {
        window.location.href = resolvePath('LOGIN');
    }, 3000);
    
    // إخفاء أزرار إعادة الإرسال
    resendBtn.style.display = 'none';
    changeEmailBtn.style.display = 'none';
}

// ============================================
// 5. عرض حالة الخطأ
// ============================================
function showErrorState(message) {
    verificationStatus.className = 'verification-status error';
    statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
    statusText.textContent = message;
    
    showNotification(message, 'error');
}

// ============================================
// 6. إعادة إرسال بريد التأكيد
// ============================================
if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
        setLoadingState(resendBtn, true);
        
        try {
            // 🔥 هنا سيتم ربط Firebase Auth لاحقاً
            // await sendEmailVerification(auth.currentUser);
            
            await simulateApiCall();
            
            showNotification('تم إرسال بريد التأكيد مرة أخرى. تحقق من بريدك الإلكتروني.', 'success');
            
        } catch (error) {
            console.error('خطأ في إعادة الإرسال:', error);
            showNotification('حدث خطأ. يرجى المحاولة لاحقاً.', 'error');
            
        } finally {
            setLoadingState(resendBtn, false);
        }
    });
}

// ============================================
// 7. تغيير البريد الإلكتروني
// ============================================
if (changeEmailBtn) {
    changeEmailBtn.addEventListener('click', () => {
        showNotification('سيتم توجيهك إلى صفحة تغيير البريد الإلكتروني', 'info');
        // window.location.href = resolvePath('PROFILE_CUSTOMER');
    });
}

// ============================================
// 8. دوال مساعدة
// ============================================
function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-redo"></i> إعادة إرسال البريد';
    }
}

function simulateVerification() {
    return new Promise(resolve => setTimeout(resolve, 2000));
}

function simulateApiCall() {
    return new Promise(resolve => setTimeout(resolve, 1500));
}

// ============================================
// 9. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة تأكيد البريد الإلكتروني جاهزة');
    
    // إذا كان هناك oobCode، نبدأ التحقق تلقائياً
    if (oobCode) {
        console.log('✓ تم العثور على oobCode:', oobCode);
        verifyEmail();
    } else {
        console.warn('⚠️ لم يتم العثور على oobCode في الرابط');
        verificationStatus.className = 'verification-status error';
        statusIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        statusText.textContent = 'رابط التأكيد غير موجود في الرابط';
    }
});

