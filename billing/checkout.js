/**
BarberFlow Pro - صفحة الدفع (ذكية)
المسار: billing/checkout.js
المميزات:
تتكيف مع دور المستخدم (salon/store)
تعرض مميزات مختلفة حسب الدور
تحفظ الاشتراك في المكان الصحيح
*/

import { auth, db } from "../core/firebase-init.js";
import {
doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentUser = null;
let userRole = null; // 'salon' أو 'store'
let selectedPlan = null;
let isProcessing = false;

// ============================================
// بيانات الباقات - للصالونات
// ============================================
const SALON_PLANS = {
starter: {
name: 'Starter',
monthlyPrice: 0,
yearlyPrice: 0,
badge: 'مجاني',
icon: 'fa-seedling',
features: [
'حتى 50 حجز شهرياً',
'صفحة صالون أساسية',
'دعم عبر البريد الإلكتروني',
'تقارير أساسية'
]
},
professional: {
name: 'Professional',
monthlyPrice: 199,
yearlyPrice: 1910,
badge: 'الأكثر شعبية',
icon: 'fa-crown',
features: [
'حجوزات غير محدودة',
'صفحة صالون مخصصة بالكامل',
'دعم فني 24/7',
'تحليلات وتقارير متقدمة',
'ترويج مميز وشارة "موصى به"',
'تطبيق مخصص للعملاء'
]
},
enterprise: {
name: 'Enterprise',
monthlyPrice: 499,
yearlyPrice: 4790,
badge: 'للشركات',
icon: 'fa-building',
features: [
'كل مميزات Professional',
'فروع غير محدودة',
'مدير حساب مخصص',
'API كامل للتكامل',
'تدريب فريق العمل',
'SLA مضمون 99.9%',
'تقارير مخصصة حسب الطلب'
]
}
};

// ============================================
// بيانات الباقات - للمتاجر
// ============================================
const STORE_PLANS = {
starter: {
name: 'Starter',
monthlyPrice: 0,
yearlyPrice: 0,
badge: 'مجاني',
icon: 'fa-seedling',
features: [
'حتى 50 منتج',
'صفحة متجر أساسية',
'دعم عبر البريد الإلكتروني',
'تقارير أساسية'
]
},
professional: {
name: 'Professional',
monthlyPrice: 199,
yearlyPrice: 1910,
badge: 'الأكثر شعبية',
icon: 'fa-crown',
features: [
'منتجات غير محدودة',
'صفحة متجر مخصصة بالكامل',
'دعم فني 24/7',
'تحليلات مبيعات متقدمة',
'ترويج مميز وشارة "موثوق"',
'إدارة شحن متكاملة'
]
},
enterprise: {
name: 'Enterprise',
monthlyPrice: 499,
yearlyPrice: 4790,
badge: 'للشركات',
icon: 'fa-building',
features: [
'كل مميزات Professional',
'فروع غير محدودة',
'مدير حساب مخصص',
'API كامل للتكامل',
'تدريب فريق العمل',
'SLA مضمون 99.9%',
'تقارير مخصصة حسب الطلب'
]
}
};

// ============================================
// مميزات كل باقة (لحفظها في Firestore)
// ============================================
function getPlanFeatures(planId, role) {
const features = {
starter: {
featuredListing: false,
advancedAnalytics: false,
customApp: false,
prioritySupport: false,
unlimitedItems: false,
maxItems: 50,
maxBranches: 1
},
professional: {
featuredListing: true,
advancedAnalytics: true,
customApp: true,
prioritySupport: true,
unlimitedItems: true,
maxBranches: 5
},
enterprise: {
featuredListing: true,
advancedAnalytics: true,
customApp: true,
prioritySupport: true,
unlimitedItems: true,
maxBranches: -1,
dedicatedManager: true,
apiAccess: true
}
};
return features[planId] || features.starter;
}

// ============================================
// التحقق من الجلسة والدور
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
 // ✅ جديد: جلب دور المستخدم
 try {
     const userDoc = await getDoc(doc(db, "users", user.uid));
     if (userDoc.exists()) {
         userRole = userDoc.data().role || 'salon';
     }
 } catch (error) {
     console.error("خطأ في جلب دور المستخدم:", error);
     userRole = 'salon';
 }
 // ✅ جديد: التحقق من أن المستخدم ليس زبوناً
 if (userRole === 'customer') {
     showNotification("هذه الصفحة مخصصة لأصحاب الصالونات والمتاجر فقط", "warning");
     setTimeout(() => {
         window.location.replace(resolvePath('INDEX'));
     }, 2000);
     return;
 }
 // جلب الباقة المختارة من URL
 const urlParams = new URLSearchParams(window.location.search);
 const planId = urlParams.get('plan') || 'professional';
 const billingCycle = urlParams.get('billing') || 'monthly';
 // ✅ جديد: اختيار بيانات الباقة حسب الدور
 const plansData = userRole === 'store' ? STORE_PLANS : SALON_PLANS;
 if (!plansData[planId]) {
     showNotification("الباقة المحددة غير صالحة", "error");
     setTimeout(() => {
         window.location.replace(resolvePath('PRO'));
     }, 2000);
     return;
 }
 selectedPlan = {
     id: planId,
     ...plansData[planId],
     billingCycle
 };
 // التحقق من الاشتراك الحالي
 await checkCurrentSubscription();
 // عرض تفاصيل الباقة
 renderPlanDetails();
 // ملء البريد الإلكتروني تلقائياً
 document.getElementById('paymentEmail').value = user.email || '';
});

// ============================================
// التحقق من الاشتراك الحالي
// ============================================
async function checkCurrentSubscription() {
try {
const subDoc = await getDoc(doc(db, "users", currentUser.uid, "subscription", "current"));
    if (subDoc.exists()) {
        const sub = subDoc.data();
        if (sub.status === 'active' && sub.plan === selectedPlan.id) {
            showNotification("أنت مشترك بالفعل في هذه الباقة", "info");
            setTimeout(() => {
                const profilePath = userRole === 'store' ? 'PROFILE_STORE' : 'PROFILE_SALON';
                window.location.replace(resolvePath(profilePath));
            }, 2000);
        }
    }
} catch (error) {
    console.error("خطأ في التحقق من الاشتراك:", error);
}
}

// ============================================
// عرض تفاصيل الباقة (محدث حسب الدور)
// ============================================
function renderPlanDetails() {
// تحديث أيقونة الباقة
const planIcon = document.getElementById('planIcon');
if (planIcon && selectedPlan.icon) {
planIcon.innerHTML = `<i class="fas ${selectedPlan.icon}"></i>
`;
}
document.getElementById('planName').textContent = selectedPlan.name;
 const badge = document.getElementById('planBadge');
 badge.textContent = selectedPlan.badge;
 badge.style.display = selectedPlan.badge ? 'inline-block' : 'none';
 // ✅ جديد: تحديث شارة الدور
 const roleBadge = document.getElementById('roleBadge');
 if (roleBadge) {
     if (userRole === 'store') {
         roleBadge.innerHTML = '<i class="fas fa-store"></i> <span>حساب متجر</span>';
     } else {
         roleBadge.innerHTML = '<i class="fas fa-cut"></i> <span>حساب صالون</span>';
     }
 }
 const price = selectedPlan.billingCycle === 'yearly' 
     ? selectedPlan.yearlyPrice 
     : selectedPlan.monthlyPrice;
 document.getElementById('planPrice').textContent = price;
 document.getElementById('billingPeriod').textContent = 
     selectedPlan.billingCycle === 'yearly' ? '/شهر (سنوي)' : '/شهر';
 document.getElementById('billingDuration').textContent = 
     selectedPlan.billingCycle === 'yearly' ? 'سنوي' : 'شهري';
 document.getElementById('totalAmount').textContent = `${price} DH`;
 document.getElementById('confirmAmount').textContent = `${price} DH`;
 document.getElementById('payAmount').textContent = `${price} DH`;
 // عرض التوفير في الاشتراك السنوي
 if (selectedPlan.billingCycle === 'yearly' && selectedPlan.monthlyPrice > 0) {
     const savings = (selectedPlan.monthlyPrice * 12) - selectedPlan.yearlyPrice;
     if (savings > 0) {
         document.getElementById('savingsRow').style.display = 'flex';
         document.getElementById('savingsAmount').textContent = `${savings} DH`;
     }
 }
 // ✅ جديد: عرض المميزات حسب الدور
 const featuresList = document.getElementById('planFeaturesList');
 featuresList.innerHTML = selectedPlan.features.map(f => `
     <li><i class="fas fa-check"></i> ${f}</li>
 `).join('');
}

// ============================================
// تنسيق رقم البطاقة
// ============================================
document.getElementById('cardNumber')?.addEventListener('input', (e) => {
let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
value = value.match(/.{1,4}/g)?.join(' ') || value;
e.target.value = value;
});

// ============================================
// تنسيق تاريخ الانتهاء
// ============================================
document.getElementById('cardExpiry')?.addEventListener('input', (e) => {
let value = e.target.value.replace(/\D/g, '');
if (value.length >= 2) {
value = value.substring(0, 2) + '/' + value.substring(2, 4);
}
e.target.value = value;
});

// ============================================
// معالجة الدفع
// ============================================
document.getElementById('paymentForm')?.addEventListener('submit', (e) => {
e.preventDefault();
if (!document.getElementById('acceptTerms').checked) {
    showNotification("يرجى الموافقة على الشروط والأحكام", "error");
    return;
}
const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
if (!validateCardNumber(cardNumber)) {
    showNotification("رقم البطاقة غير صالح", "error");
    return;
}
document.getElementById('confirmModal').classList.add('active');
});

// ============================================
// تأكيد الدفع
// ============================================
document.getElementById('confirmPayment')?.addEventListener('click', async () => {
if (isProcessing) return;
isProcessing = true;
 document.getElementById('confirmModal').classList.remove('active');
 const payBtn = document.getElementById('payBtn');
 payBtn.disabled = true;
 payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري معالجة الدفع...</span>';
 try {
     const paymentData = {
         cardholderName: document.getElementById('cardholderName').value.trim(),
         cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
         cardExpiry: document.getElementById('cardExpiry').value,
         cardCvv: document.getElementById('cardCvv').value,
         email: document.getElementById('paymentEmail').value.trim(),
         phone: document.getElementById('paymentPhone').value.trim(),
         autoRenew: document.getElementById('autoRenew').checked
     };
     const paymentResult = await processPayment(paymentData);
     if (paymentResult.success) {
         await saveSubscription(paymentResult);
         showNotification("تم الاشتراك بنجاح! 🎉", "success");
         // ✅ التعديل: توجيه إلى صفحة النجاح
         setTimeout(() => {
             window.location.href = 'payment-success.html?plan=' + selectedPlan.id;
         }, 2000);
     } else {
         throw new Error(paymentResult.message || "فشل عملية الدفع");
     }
 } catch (error) {
     console.error("خطأ في الدفع:", error);
     showNotification(error.message || "حدث خطأ في معالجة الدفع", "error");
     // ✅ التعديل: توجيه إلى صفحة الفشل بعد 3 ثواني
     setTimeout(() => {
         window.location.href = 'payment-cancel.html?reason=payment_failed';
     }, 3000);
     payBtn.disabled = false;
     payBtn.innerHTML = `
         <i class="fas fa-lock"></i>
         <span>ادفع الآن بأمان</span>
         <span class="pay-amount" id="payAmount">${document.getElementById('totalAmount').textContent}</span>
     `;
 } finally {
     isProcessing = false;
 }
});

// ============================================
// التحقق من رقم البطاقة (خوارزمية Luhn)
// ============================================
function validateCardNumber(number) {
const cleaned = number.replace(/\s/g, '');
if (cleaned.length < 13 || cleaned.length > 19) return false;
let sum = 0;
let isEven = false;
for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
}
return sum % 10 === 0;
}

// ============================================
// معالجة الدفع (محاكاة)
// ============================================
async function processPayment(paymentData) {
return new Promise((resolve) => {
setTimeout(() => {
resolve({
success: true,
transactionId: 'TXN_' + Date.now(),
paymentMethod: 'card',
amount: selectedPlan.billingCycle === 'yearly'
? selectedPlan.yearlyPrice
: selectedPlan.monthlyPrice
});
}, 2000);
});
}

// ============================================
// ✅ جديد: حفظ الاشتراك (يتكيف مع الدور)
// ============================================
async function saveSubscription(paymentResult) {
const now = new Date();
const endDate = new Date();
if (selectedPlan.billingCycle === 'yearly') {
     endDate.setFullYear(endDate.getFullYear() + 1);
 } else {
     endDate.setMonth(endDate.getMonth() + 1);
 }
 const subscriptionData = {
     plan: selectedPlan.id,
     role: userRole, // ✅ جديد: حفظ الدور
     status: 'active',
     startDate: now,
     endDate: endDate,
     paymentMethod: paymentResult.paymentMethod,
     transactionId: paymentResult.transactionId,
     amount: paymentResult.amount,
     autoRenew: document.getElementById('autoRenew').checked,
     createdAt: serverTimestamp(),
     features: getPlanFeatures(selectedPlan.id, userRole)
 };
 // 1. حفظ في users/{uid}/subscription/current
 await setDoc(doc(db, "users", currentUser.uid, "subscription", "current"), subscriptionData);
 // 2. تحديث وثيقة المستخدم الرئيسية
 await setDoc(doc(db, "users", currentUser.uid), {
     hasActiveSubscription: true,
     subscriptionPlan: selectedPlan.id,
     subscriptionRole: userRole, // ✅ جديد
     subscriptionEndDate: endDate,
     updatedAt: serverTimestamp()
 }, { merge: true });
 // 3. ✅ جديد: تحديث وثيقة الصالون أو المتجر
 const collectionName = userRole === 'store' ? 'stores' : 'salons';
 await setDoc(doc(db, collectionName, currentUser.uid), {
     featured: selectedPlan.id !== 'starter',
     featuredUntil: endDate,
     badge: selectedPlan.id === 'enterprise' ? 'premium' : 'recommended',
     analyticsAccess: selectedPlan.id !== 'starter',
     subscriptionPlan: selectedPlan.id,
     updatedAt: serverTimestamp()
 }, { merge: true });
}

// ============================================
// إلغاء الدفع
// ============================================
document.getElementById('cancelPayment')?.addEventListener('click', () => {
document.getElementById('confirmModal').classList.remove('active');
// ✅ التعديل: توجيه إلى صفحة الإلغاء
setTimeout(() => {
window.location.href = 'payment-cancel.html?reason=user_cancelled';
}, 500);
});

// ============================================
// زر العودة
// ============================================
document.getElementById('backBtn')?.addEventListener('click', () => {
window.history.back();
});

