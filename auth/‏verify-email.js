/**
BarberFlow Pro - صفحة تأكيد البريد الإلكتروني
المسار: auth/verify-email.js
*/
import { auth } from "../config/firebase-init.js"; // ✅ تم تصحيح المسار
import { applyActionCode, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { PATHS, resolvePath } from "../shared/utils/paths.js"; // ✅ تم تصحيح المسار
import { showNotification } from "../shared/utils/notifications.js"; // ✅ تم تصحيح المسار
import { initPageGuard } from "../middleware/routing/page-guard.js"; // ✅ إضافة الحماية

// ============================================
// 1. تهيئة حماية الصفحة
// ============================================
initPageGuard(); // ✅ إخفاء الصفحة فوراً

// ============================================
// 2. استخراج معلمات URL (oobCode, mode)
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
// 3. عناصر DOM
// ============================================
const verificationStatus = document.getElementById('verificationStatus');
const statusIcon = verificationStatus ? verificationStatus.querySelector('.status-icon') : null;
const statusText = verificationStatus ? verificationStatus.querySelector('.status-text') : null;
const resendBtn = document.getElementById('resendEmailBtn');
const changeEmailBtn = document.getElementById('changeEmailBtn');

// ============================================
// 4. التحقق من صحة الرابط (ربط فعلي بـ Firebase)
// ============================================
async function verifyEmail() {
    if (!oobCode) {
        showErrorState('رابط التأكيد غير صالح أو منتهي الصلاحية');
        return;
    }
    
    try {
        // ✅ ربط فعلي بـ Firebase
        await applyActionCode(auth, oobCode);
        showSuccessState();
    } catch (error) {
        console.error('خطأ في التحقق من البريد:', error);
        if (error.code === 'auth/expired-action-code') {
            showErrorState('رابط التأكيد منتهي الصلاحية');
        } else if (error.code === 'auth/invalid-action-code') {
            showErrorState('رابط التأكيد غير صالح');
        } else {
            showErrorState('حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.');
        }
    }
}

// ============================================
// 5. عرض حالة النجاح
// ============================================
function showSuccessState() {
    if (verificationStatus) verificationStatus.className = 'verification-status success';
    if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    if (statusText) statusText.textContent = 'تم تأكيد بريدك الإلكتروني بنجاح!';
    showNotification('تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.', 'success', 5000);
    
    // إعادة توجيه تلقائي بعد 3 ثوانٍ
    setTimeout(() => {
        window.location.href = resolvePath('LOGIN');
    }, 3000);
    
    // إخفاء أزرار إعادة الإرسال
    if (resendBtn) resendBtn.style.display = 'none';
    if (changeEmailBtn) changeEmailBtn.style.display = 'none';
}

// ============================================
// 6. عرض حالة الخطأ
// ============================================
function showErrorState(message) {
    if (verificationStatus) verificationStatus.className = 'verification-status error';
    if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
    if (statusText) statusText.textContent = message;
    showNotification(message, 'error');
}

// ============================================
// 7. إعادة إرسال بريد التأكيد
// ============================================
if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
        setLoadingState(resendBtn, true);
        try {
            // ✅ ربط فعلي بـ Firebase (يتطلب أن يكون المستخدم مسجل دخوله)
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                showNotification('تم إرسال بريد التأكيد مرة أخرى. تحقق من بريدك الإلكتروني.', 'success');
            } else {
                showNotification('يجب تسجيل الدخول أولاً لإعادة إرسال البريد', 'warning');
                setTimeout(() => {
                    window.location.href = resolvePath('LOGIN');
                }, 2000);
            }
        } catch (error) {
            console.error('خطأ في إعادة الإرسال:', error);
            if (error.code === 'auth/too-many-requests') {
                showNotification('تم إرسال الكثير من الطلبات. يرجى الانتظار قليلاً.', 'error');
            } else {
                showNotification('حدث خطأ. يرجى المحاولة لاحقاً.', 'error');
            }
        } finally {
            setLoadingState(resendBtn, false);
        }
    });
}

// ============================================
// 8. تغيير البريد الإلكتروني
// ============================================
if (changeEmailBtn) {
    changeEmailBtn.addEventListener('click', () => {
        showNotification('يرجى التواصل مع الدعم الفني لتغيير البريد الإلكتروني', 'info');
    });
}

// ============================================
// 9. دوال مساعدة
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

// ============================================
// 10. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة تأكيد البريد الإلكتروني جاهزة');
    // إذا كان هناك oobCode، نبدأ التحقق تلقائياً
    if (oobCode) {
        console.log('✓ تم العثور على oobCode:', oobCode);
        verifyEmail();
    } else {
        console.warn('️ لم يتم العثور على oobCode في الرابط');
        if (verificationStatus) {
            verificationStatus.className = 'verification-status error';
            if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            if (statusText) statusText.textContent = 'رابط التأكيد غير موجود في الرابط';
        }
    }
});

