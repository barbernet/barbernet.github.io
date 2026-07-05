/**
 * BarberFlow Pro - صفحة إلغاء الدفع
 * المسار: billing/payment-cancel.js
 */

import { auth } from "../core/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        showNotification("يرجى تسجيل الدخول أولاً", "warning");
        setTimeout(() => window.location.replace(resolvePath('LOGIN')), 2000);
        return;
    }

    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('retryPaymentBtn')?.addEventListener('click', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const plan = urlParams.get('plan') || 'professional';
        const billing = urlParams.get('billing') || 'monthly';
        
        window.location.href = `checkout.html?plan=${plan}&billing=${billing}`;
    });

    document.getElementById('goToHomeBtn')?.addEventListener('click', () => {
        window.location.href = resolvePath('INDEX');
    });

    document.getElementById('contactSupport')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = resolvePath('CONTACT');
    });
}

