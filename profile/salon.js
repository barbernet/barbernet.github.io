/**
BarberFlow Pro - صفحة بروفايل الصالون (للمالك)
المسار: profile/salon.js
المميزات:
- عرض جميع معلومات الصالون
- أزرار إدارة كاملة
- صلاحيات المالك فقط
*/

// --- تحديث المسارات ---
import { db, auth } from "../../config/firebase-init.js"; // ✅ تم التحديث
import {
    doc, getDoc, updateDoc, collection, getDocs,
    query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// ✅ تم التحديث
import { showNotification } from "../../shared/utils/notifications.js";
import { PATHS, resolvePath } from "../../shared/utils/paths.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentUser = null;
let salonData = null;
let salonId = null;

// ============================================
// حماية الصفحة: إخفاء المحتوى فوراً (FOUC Prevention)
// ============================================
document.body.classList.add('page-protected'); // ✅ إضافة الكلاس المطلوب

// ============================================
// مراقبة حالة المصادقة مع التحقق من الدور
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showNotification("يرجى تسجيل الدخول للوصول إلى بروفايلك", "warning");
        setTimeout(() => {
            window.location.replace(resolvePath('LOGIN')); // ✅ استخدام paths.js
        }, 2000);
        return;
    }

    // التحقق من الدور (الصلاحية)
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            throw new Error("User document not found in Firestore.");
        }

        const userData = userDoc.data();
        const userRole = userData.role;

        if (userRole !== 'salon') {
            showNotification("لا يمكنك الوصول إلى هذه الصفحة. الصلاحيات مخصصة لأصحاب الصالونات فقط.", "error");
            setTimeout(() => {
                window.location.replace(resolvePath('INDEX')); // ✅ استخدام paths.js
            }, 2000);
            return;
        }

        // المستخدم مسجلاً وله دور 'salon' - استمر في التحميل
        currentUser = user;
        salonId = user.uid; // ✅ في هذا السيناريو، معرف المستخدم هو نفسه معرف الصالون
        await loadSalonProfile();

        // ✅ بعد التحقق من الصلاحية، أظهر الصفحة
        document.body.classList.remove('page-protected');
        document.body.classList.add('page-loaded');

    } catch (error) {
        console.error("Error verifying user role or loading profile:", error);
        showNotification("حدث خطأ أثناء التحقق من صلاحياتك.", "error");
        setTimeout(() => {
            window.location.replace(resolvePath('INDEX')); // ✅ استخدام paths.js
        }, 2000);
    }
});

// ============================================
// تحميل بروفايل الصالون
// ============================================
async function loadSalonProfile() {
    try {
        const snap = await getDoc(doc(db, "salons", salonId)); // ✅ استخدام salonId من المصادقة
        if (!snap.exists()) {
            showNotification("لم يتم العثور على بيانات الصالون. يرجى إكمال الإعداد أولاً", "warning");
            setTimeout(() => {
                window.location.replace(resolvePath('ADD_SALON')); // ✅ استخدام paths.js
            }, 2000);
            return;
        }

        salonData = snap.data();
        renderProfileHeader(salonData);
        renderOverviewTab(salonData);
        // استدعاء باقي الدوال لعرض البيانات في التبويبات الأخرى...
        console.log("✅ بروفايل الصالون تم تحميله بنجاح.");
    } catch (error) {
        console.error("Error loading salon profile:", error);
        showNotification("فشل تحميل بيانات الصالون.", "error");
    }
}

// ============================================
// عرض رأس الصفحة
// ============================================
function renderProfileHeader(data) {
    document.getElementById('salonName').textContent = data.name || "غير محدد";
    document.getElementById('salonLocation').textContent = data.city || "غير محدد";
    document.getElementById('salonRating').textContent = (data.rating || 0).toFixed(1);
    document.getElementById('reviewCount').textContent = data.reviewCount || 0;
    document.getElementById('staffCount').textContent = (data.staff?.length || 0);
    // تحديث الصورة إذا كانت متوفرة
    // const avatarImg = document.querySelector('.profile-avatar img');
    // if (avatarImg && data.avatar) {
    //     avatarImg.src = data.avatar;
    //     avatarImg.alt = `صورة ${data.name}`;
    // } else {
    //     // إبقاء الأيقونة الافتراضية كما هي
    // }
}

// ============================================
// عرض تبويب نظرة عامة
// ============================================
function renderOverviewTab(data) {
    document.getElementById('infoName').textContent = data.name || "غير محدد";
    document.getElementById('infoCity').textContent = data.city || "غير محدد";
    document.getElementById('infoPhone').textContent = data.phone || "غير محدد";
    document.getElementById('infoEmail').textContent = data.email || "غير محدد";
    document.getElementById('infoHours').textContent = formatWorkingHours(data.workingHours) || "غير محدد";
    document.getElementById('infoServicesCount').textContent = (data.services?.length || 0);
    document.getElementById('salonDescription').textContent = data.description || "لا يوجد وصف متوفر.";
}

// ============================================
// تنسيق أوقات العمل (مساعدة)
// ============================================
function formatWorkingHours(hours) {
    if (!hours || !hours.open || !hours.close) return null;
    return `${hours.open} - ${hours.close}`;
}

// ... (بقية الدوال الأخرى للواجهة - إضافة/حذف خدمات، معرض، موظفين، حجوزات، إعدادات...) ...
// ملاحظة: يجب تحديث جميع دوال `showNotification` و `resolvePath` داخل هذه الدوال أيضاً.


