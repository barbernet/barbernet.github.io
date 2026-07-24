/**
 * BarberFlow Pro - صفحة نجاح الدفع
 * المسار: billing/payment-success.js
 */

import { auth, db } from "../config/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/utils/paths.js";

let currentUser = null;
let subscriptionData = null;

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

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showNotification("يرجى تسجيل الدخول أولاً", "warning");
        setTimeout(() => window.location.replace(resolvePath('LOGIN')), 2000);
        return;
    }

    currentUser = user;
    await loadSubscriptionDetails();
    setupEventListeners();
    createConfetti();
});

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

function renderSubscriptionDetails() {
    if (!subscriptionData) return;

    const planNames = {
        starter: 'Starter',
        professional: 'Professional',
        enterprise: 'Enterprise'
    };
    
    document.getElementById('planName').textContent = planNames[subscriptionData.plan] || subscriptionData.plan;
    
    const formatDate = (date) => {
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    document.getElementById('startDate').textContent = formatDate(subscriptionData.startDate);
    document.getElementById('endDate').textContent = formatDate(subscriptionData.endDate);
    document.getElementById('transactionId').textContent = subscriptionData.transactionId || '-';

    const featuresList = document.getElementById('featuresList');
    const features = PLAN_FEATURES[subscriptionData.plan] || PLAN_FEATURES.starter;
    featuresList.innerHTML = features.map(f => `
        <li><i class="fas fa-check-circle"></i> ${f}</li>
    `).join('');
}

function setupEventListeners() {
    document.getElementById('goToDashboardBtn')?.addEventListener('click', async () => {
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const role = userDoc.data()?.role || 'customer';
            
            const destination = {
                salon: 'PROFILE_SALON',
                store: 'PROFILE_STORE',
                customer: 'PROFILE_CUSTOMER'
            }[role] || 'INDEX';
            
            window.location.href = resolvePath(destination);
        } catch (error) {
            window.location.href = resolvePath('INDEX');
        }
    });

    document.getElementById('goToHomeBtn')?.addEventListener('click', () => {
        window.location.href = resolvePath('INDEX');
    });
}

function createConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;

    const colors = ['#d4af37', '#f4d03f', '#aa841b', '#fff', '#2b8a3e'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        const size = Math.random() * 10 + 5;

        confetti.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${left}%;
            top: -10px;
            opacity: 0;
            animation: confettiFall ${duration}s ease-in ${delay}s forwards;
        `;

        container.appendChild(confetti);
    }

    setTimeout(() => container.innerHTML = '', 5000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        0% { opacity: 1; transform: translateY(0) rotate(0deg); }
        100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
    }
`;
document.head.appendChild(style);

