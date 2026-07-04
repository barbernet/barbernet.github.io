/**
 * BarberFlow Pro - صفحة إدارة الاشتراك
 * المسار: billing/subscription.js
 */

import { auth, db } from "../core/firebase-init.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentUser = null;
let subscriptionData = null;

// ============================================
// التحقق من الجلسة
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showNotification("يرجى تسجيل الدخول أولاً", "warning");
        setTimeout(() => window.location.replace(resolvePath('LOGIN')), 2000);
        return;
    }

    currentUser = user;
    await loadSubscriptionData();
});

// ============================================
// تحميل بيانات الاشتراك
// ============================================
async function loadSubscriptionData() {
    try {
        const subDoc = await getDoc(doc(db, "users", currentUser.uid, "subscription", "current"));
        
        document.getElementById('loadingState').classList.add('hidden');

        if (!subDoc.exists()) {
            document.getElementById('noSubscription').classList.remove('hidden');
            return;
        }

        subscriptionData = subDoc.data();
        
        // التحقق من انتهاء الصلاحية
        const endDate = subscriptionData.endDate.toDate ? subscriptionData.endDate.toDate() : new Date(subscriptionData.endDate);
        if (new Date() > endDate && subscriptionData.status === 'active') {
            subscriptionData.status = 'expired';
        }

        renderSubscriptionUI();
        document.getElementById('subscriptionContent').classList.remove('hidden');

    } catch (error) {
        console.error("خطأ في تحميل الاشتراك:", error);
        showNotification("حدث خطأ في تحميل البيانات", "error");
    }
}

// ============================================
// عرض واجهة الاشتراك
// ============================================
function renderSubscriptionUI() {
    if (!subscriptionData) return;

    // معلومات الباقة
    const planNames = { starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' };
    document.getElementById('planName').textContent = planNames[subscriptionData.plan] || subscriptionData.plan;
    
    // الحالة
    const statusEl = document.getElementById('planStatus');
    statusEl.textContent = subscriptionData.status === 'active' ? 'نشط' : 'منتهي';
    statusEl.className = `plan-status ${subscriptionData.status}`;

    // التواريخ
    const formatDate = (date) => date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('startDate').textContent = formatDate(subscriptionData.startDate.toDate ? subscriptionData.startDate.toDate() : new Date(subscriptionData.startDate));
    document.getElementById('endDate').textContent = formatDate(endDate);
    document.getElementById('amountPaid').textContent = `${subscriptionData.amount || 0} DH`;
    document.getElementById('autoRenewStatus').textContent = subscriptionData.autoRenew ? 'مفعل' : 'غير مفعل';

    // المميزات
    const featuresList = document.getElementById('activeFeaturesList');
    if (subscriptionData.features) {
        const featureNames = {
            featuredListing: 'ظهور مميز في نتائج البحث',
            advancedAnalytics: 'تحليلات وإحصائيات متقدمة',
            customApp: 'تطبيق مخصص للعملاء',
            prioritySupport: 'دعم فني ذو أولوية',
            unlimitedBookings: 'حجوزات غير محدودة'
        };
        
        featuresList.innerHTML = Object.entries(subscriptionData.features)
            .filter(([key, value]) => value)
            .map(([key]) => `<li><i class="fas fa-check"></i> ${featureNames[key] || key}</li>`)
            .join('');
    }

    // إخفاء زر التجديد إذا كان Starter
    if (subscriptionData.plan === 'starter') {
        document.getElementById('renewBtn').style.display = 'none';
        document.getElementById('cancelBtn').style.display = 'none';
    }
}

// ============================================
// أحداث الأزرار
// ============================================
document.getElementById('renewBtn')?.addEventListener('click', () => {
    const plan = subscriptionData.plan;
    window.location.href = `checkout.html?plan=${plan}&billing=monthly&renew=true`;
});

document.getElementById('upgradeBtn')?.addEventListener('click', () => {
    window.location.href = resolvePath('PRO');
});

document.getElementById('cancelBtn')?.addEventListener('click', async () => {
    if (!confirm("هل أنت متأكد من إلغاء التجديد التلقائي؟ سيستمر اشتراكك حتى نهاية الفترة المدفوعة.")) return;
    
    try {
        await updateDoc(doc(db, "users", currentUser.uid, "subscription", "current"), {
            autoRenew: false,
            updatedAt: new Date()
        });
        showNotification("تم إلغاء التجديد التلقائي بنجاح", "success");
        await loadSubscriptionData(); // إعادة تحميل
    } catch (error) {
        showNotification("حدث خطأ أثناء الإلغاء", "error");
    }
});

