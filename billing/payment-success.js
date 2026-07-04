/**
 * BarberFlow Pro - صفحة نجاح الدفع
 * المسار: billing/payment-success.js
 * المميزات:
 * - عرض تفاصيل الاشتراك
 * - تأثيرات احتفالية (Confetti)
 * - توجيه ذكي حسب دور المستخدم
 */

import { auth, db } from "../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentUser = null;
let subscriptionData = null;

// ============================================
// بيانات المميزات حسب الباقة
// ============================================
const PLAN_FEATURES = {
    starter: [
        '50 حجز شهرياً',
        'صفحة صالون أساسية',
        'دعم عبر البريد الإلكتروني',
        'تقارير أساسية'
    ],
    professional: [
        'حجوزات غير محدودة',
        'صفحة صالون مخصصة بالكامل',
        'دعم فني 24/7',
        'تحليلات وتقارير متقدمة',
        'ترويج مميز وشارة "موصى به"',
        'تطبيق مخصص للعملاء'
    ],
    enterprise: [
        'كل مميزات Professional',
        'فروع غير محدودة',
        'مدير حساب مخصص',
        'API كامل للتكامل',
        'تدريب فريق العمل',
        'SLA مضمون 99.9%',
        'تقارير مخصصة حسب الطلب'
    ]
};

// ============================================
// التحقق من الجلسة
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showNotification("يرجى تسجيل الدخول أولاً", "warning");
        setTimeout(() => {
            window.location.replace(resolvePath('LOGIN'));
        }, 2000);
        return;
    }

    currentUser = user;
    await loadSubscriptionDetails();
    setupEventListeners();
    createConfetti();
});

// ============================================
// تحميل تفاصيل الاشتراك
// ============================================
async function loadSubscriptionDetails() {
    try {
        const subDoc = await getDoc(doc(db, "users", currentUser.uid, "subscription", "current"));
        
        if (!subDoc.exists()) {
            showNotification("لم يتم العثور على تفاصيل الاشتراك", "error");
            return;
        }

        subscriptionData = subDoc.data();
        renderSubscriptionDetails();
    } catch (error) {
        console.error("خطأ في تحميل تفاصيل الاشتراك:", error);
    }
}

// ============================================
// عرض تفاصيل الاشتراك
// ============================================
function renderSubscriptionDetails() {
    if (!subscriptionData) return;

    // اسم الباقة
    const planName = document.getElementById('planName');
    if (planName) {
        const planNames = {
            starter: 'Starter',
            professional: 'Professional',
            enterprise: 'Enterprise'
        };
        planName.textContent = planNames[subscriptionData.plan] || subscriptionData.plan;
    }

    // تاريخ البدء
    const startDate = document.getElementById('startDate');
    if (startDate && subscriptionData.startDate) {
        const date = subscriptionData.startDate.toDate ? subscriptionData.startDate.toDate() : new Date(subscriptionData.startDate);
        startDate.textContent = date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // تاريخ الانتهاء
    const endDate = document.getElementById('endDate');
    if (endDate && subscriptionData.endDate) {
        const date = subscriptionData.endDate.toDate ? subscriptionData.endDate.toDate() : new Date(subscriptionData.endDate);
        endDate.textContent = date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // رقم المعاملة
    const transactionId = document.getElementById('transactionId');
    if (transactionId && subscriptionData.transactionId) {
        transactionId.textContent = subscriptionData.transactionId;
    }

    // المميزات
    const featuresList = document.getElementById('featuresList');
    if (featuresList) {
        const features = PLAN_FEATURES[subscriptionData.plan] || PLAN_FEATURES.starter;
        featuresList.innerHTML = features.map(f => `
            <li><i class="fas fa-check-circle"></i> ${f}</li>
        `).join('');
    }
}

// ============================================
// إعداد مستمعي الأحداث
// ============================================
function setupEventListeners() {
    const dashboardBtn = document.getElementById('goToDashboardBtn');
    const homeBtn = document.getElementById('goToHomeBtn');

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', async () => {
            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                const role = userDoc.data()?.role || 'customer';
                
                let destination;
                switch (role) {
                    case 'salon':
                        destination = 'PROFILE_SALON';
                        break;
                    case 'store':
                        destination = 'PROFILE_STORE';
                        break;
                    case 'customer':
                        destination = 'PROFILE_CUSTOMER';
                        break;
                    default:
                        destination = 'INDEX';
                }
                
                window.location.href = resolvePath(destination);
            } catch (error) {
                console.error("خطأ في التوجيه:", error);
                window.location.href = resolvePath('INDEX');
            }
        });
    }

    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            window.location.href = resolvePath('INDEX');
        });
    }
}

// ============================================
// تأثيرات الاحتفال (Confetti)
// ============================================
function createConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;

    const colors = ['#d4af37', '#f4d03f', '#aa841b', '#fff', '#2b8a3e'];
    const confettiCount = 100;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 3 + 2;
        const animationDelay = Math.random() * 2;
        const size = Math.random() * 10 + 5;

        confetti.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${left}%;
            top: -10px;
            opacity: 0;
            animation: confettiFall ${animationDuration}s ease-in ${animationDelay}s forwards;
        `;

        container.appendChild(confetti);
    }

    // إزالة التأثير بعد 5 ثوانٍ
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// إضافة أنيميشن الـ Confetti للـ CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
        }
        100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
        }
    }
`;
document.head.appendChild(style);

