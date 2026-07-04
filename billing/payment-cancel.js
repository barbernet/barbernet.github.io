/**
 * BarberFlow Pro - صفحة إلغاء الدفع
 * المسار: billing/payment-cancel.js
 */

import { auth } from "../core/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";

// ============================================
// التحقق من الجلسة
// ============================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        showNotification("يرجى تسجيل الدخول أولاً", "warning");
        setTimeout(() => {
            window.location.replace(resolvePath('LOGIN'));
        }, 2000);
        return;
    }

    setupEventListeners();
});

// ============================================
// إعداد مستمعي الأحداث
// ============================================
function setupEventListeners() {
    const retryBtn = document.getElementById('retryPaymentBtn');
    const homeBtn = document.getElementById('goToHomeBtn');
    const contactBtn = document.getElementById('contactSupport');

    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            // العودة لصفحة الدفع مع الاحتفاظ بالباقة المختارة
            const urlParams = new URLSearchParams(window.location.search);
            const plan = urlParams.get('plan') || 'professional';
            const billing = urlParams.get('billing') || 'monthly';
            
            window.location.href = `checkout.html?plan=${plan}&billing=${billing}`;
        });
    }

    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            window.location.href = resolvePath('INDEX');
        });
    }

    if (contactBtn) {
        contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = resolvePath('CONTACT');
        });
    }
}

