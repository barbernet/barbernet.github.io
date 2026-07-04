/**
 * BarberFlow Pro - صفحة إضافة الزبون
 * المسار: onboarding/add-customer.js
 * المميزات:
 * - معلومات بسيطة للزبون
 * - حفظ تلقائي للبيانات
 * - حماية الجلسة
 */

import { auth, db } from "../core/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";
import { sanitizeText, sanitizePhone } from "../middleware/validation/index.js";
import { processImage } from "../shared/js/images-utils.js";
import { validateImageType, validateImageSize } from "../middleware/validation/index.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentUser = null;
let photoBase64 = null;

// ============================================
// عناصر DOM
// ============================================
const form = document.getElementById('addCustomerForm');
const backBtn = document.getElementById('backBtn');
const skipBtn = document.getElementById('skipBtn');
const submitBtn = document.getElementById('submitBtn');

const photoPreview = document.getElementById('photoPreview');
const photoInput = document.getElementById('photoInput');
const uploadBtn = document.getElementById('uploadBtn');
const removePhotoBtn = document.getElementById('removePhotoBtn');

const customerName = document.getElementById('customerName');
const customerPhone = document.getElementById('customerPhone');
const customerCity = document.getElementById('customerCity');
const customerBirthdate = document.getElementById('customerBirthdate');

// ============================================
// التحقق من الجلسة
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showNotification("الجلسة غير صالحة، يرجى تسجيل الدخول", "error");
        setTimeout(() => {
            window.location.replace(resolvePath('LOGIN'));
        }, 2000);
        return;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            showNotification("بيانات المستخدم غير موجودة", "error");
            setTimeout(() => {
                window.location.replace(resolvePath('INDEX'));
            }, 2000);
            return;
        }

        const userData = userDoc.data();
        if (userData.role !== 'customer') {
            showNotification("هذه الصفحة مخصصة للزبائن فقط", "warning");
            setTimeout(() => {
                window.location.replace(resolvePath('INDEX'));
            }, 2000);
            return;
        }

        currentUser = user;
        
        // استعادة البيانات المحفوظة
        restoreDraft();
    } catch (error) {
        console.error("خطأ في التحقق من الجلسة:", error);
        showNotification("حدث خطأ في التحقق من الجلسة", "error");
    }
});

// ============================================
// رفع الصورة الشخصية
// ============================================
if (uploadBtn && photoInput) {
    uploadBtn.onclick = () => {
        photoInput.click();
    };
    
    photoInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!validateImageType(file)) {
            showNotification("يرجى اختيار صورة بصيغة PNG أو JPG", "error");
            return;
        }
        
        if (!validateImageSize(file, 5)) {
            showNotification("حجم الصورة كبير جداً (الحد الأقصى 5MB)", "error");
            return;
        }
        
        try {
            showNotification("جاري معالجة الصورة...", "info");
            photoBase64 = await processImage(file, 400, 0.8);
            
            photoPreview.innerHTML = `<img src="${photoBase64}" alt="صورة شخصية">`;
            photoPreview.classList.add('has-photo');
            uploadBtn.style.display = 'none';
            removePhotoBtn.style.display = 'flex';
            
            showNotification("تم تحديث الصورة الشخصية بنجاح", "success");
            saveDraft();
        } catch (error) {
            console.error("خطأ في معالجة الصورة:", error);
            showNotification("فشل معالجة الصورة", "error");
        }
    };
}

// ============================================
// إزالة الصورة
// ============================================
if (removePhotoBtn) {
    removePhotoBtn.onclick = () => {
        photoBase64 = null;
        photoPreview.innerHTML = '<i class="fas fa-user"></i>';
        photoPreview.classList.remove('has-photo');
        uploadBtn.style.display = 'flex';
        removePhotoBtn.style.display = 'none';
        photoInput.value = '';
        
        showNotification("تم إزالة الصورة الشخصية", "info");
        saveDraft();
    };
}

// ============================================
// حفظ البيانات في Firestore
// ============================================
async function saveCustomerData() {
    if (!currentUser) {
        showNotification("الجلسة غير صالحة", "error");
        return false;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري الحفظ...</span>';
    
    try {
        const name = sanitizeText(customerName.value.trim());
        const phone = sanitizePhone(customerPhone.value.trim());
        const city = sanitizeText(customerCity.value.trim());
        const birthdate = customerBirthdate.value;
        
        // التحقق من البيانات
        if (!name || name.length < 2) {
            showNotification("يرجى إدخال اسم صحيح (حرفان على الأقل)", "error");
            customerName.focus();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
            return false;
        }
        
        if (!phone || phone.length < 10) {
            showNotification("يرجى إدخال رقم هاتف صحيح", "error");
            customerPhone.focus();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
            return false;
        }
        
        // تنسيق رقم الهاتف
        let formattedPhone = phone;
        if (phone.startsWith('06') || phone.startsWith('07')) {
            formattedPhone = '+212' + phone.substring(1);
        }
        
        // حفظ البيانات في Firestore
        await setDoc(doc(db, "customers", currentUser.uid), {
            fullName: name,
            phone: formattedPhone,
            city: city || null,
            birthdate: birthdate || null,
            photoURL: photoBase64 || null,
            onboardingStatus: "basic_done",
            updatedAt: new Date()
        }, { merge: true });
        
        // تحديث مستند المستخدم
        await updateDoc(doc(db, "users", currentUser.uid), {
            fullName: name,
            phone: formattedPhone,
            onboardingStatus: "basic_done",
            updatedAt: new Date()
        });
        
        showNotification("تم حفظ بياناتك بنجاح! 🎉", "success");
        
        // حفظ حالة الجلسة
        sessionStorage.setItem('customerSetupCompleted', 'true');
        sessionStorage.setItem('lastActivePage', 'add-customer');
        
        setTimeout(() => {
            window.location.href = resolvePath('SETUP_CUSTOMER');
        }, 1500);
        
        return true;
    } catch (error) {
        console.error("خطأ في حفظ بيانات الزبون:", error);
        showNotification("حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
        return false;
    }
}

// ============================================
// التخطي
// ============================================
if (skipBtn) {
    skipBtn.onclick = async () => {
        if (!currentUser) return;
        
        skipBtn.disabled = true;
        skipBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري التخطي...</span>';
        
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                onboardingStatus: "basic_done",
                updatedAt: new Date()
            });
            
            showNotification("تم تخطي هذه الخطوة", "info");
            
            setTimeout(() => {
                window.location.href = resolvePath('SETUP_CUSTOMER');
            }, 1000);
        } catch (error) {
            console.error("خطأ في التخطي:", error);
            showNotification("حدث خطأ أثناء التخطي", "error");
            skipBtn.disabled = false;
            skipBtn.innerHTML = '<span>تخطي هذه الخطوة</span> <i class="fas fa-forward"></i>';
        }
    };
}

// ============================================
// إرسال النموذج
// ============================================
if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveCustomerData();
    };
}

// ============================================
// زر العودة
// ============================================
if (backBtn) {
    backBtn.onclick = () => {
        window.history.back();
    };
}

// ============================================
// حفظ تلقائي (Draft)
// ============================================
function saveDraft() {
    const formData = {
        name: customerName.value,
        phone: customerPhone.value,
        city: customerCity.value,
        birthdate: customerBirthdate.value,
        photo: photoBase64
    };
    
    sessionStorage.setItem('customerDraft', JSON.stringify(formData));
}

// ============================================
// استعادة البيانات المحفوظة
// ============================================
function restoreDraft() {
    const draft = sessionStorage.getItem('customerDraft');
    if (!draft) return;
    
    try {
        const formData = JSON.parse(draft);
        
        if (formData.name) customerName.value = formData.name;
        if (formData.phone) customerPhone.value = formData.phone;
        if (formData.city) customerCity.value = formData.city;
        if (formData.birthdate) customerBirthdate.value = formData.birthdate;
        
        if (formData.photo) {
            photoBase64 = formData.photo;
            photoPreview.innerHTML = `<img src="${photoBase64}" alt="صورة شخصية">`;
            photoPreview.classList.add('has-photo');
            uploadBtn.style.display = 'none';
            removePhotoBtn.style.display = 'flex';
        }
        
        showNotification("تم استعادة البيانات المحفوظة", "info");
    } catch (error) {
        console.error("خطأ في استعادة البيانات:", error);
    }
}

// ============================================
// حماية من فقدان الجلسة
// ============================================
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        sessionStorage.setItem('lastActivePage', 'add-customer');
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());
        saveDraft();
    }
});

