/**
 * BarberFlow Pro - صفحة إعداد الصالون (Wizard)
 * المسار: onboarding/setup-salon.js
 * المميزات:
 * - تقسيم إلى 4 مراحل
 * - رفع ومعالجة الصور
 * - حفظ تلقائي للبيانات
 * - يمكن تخطيها والعودة لاحقاً
 */

import { auth, db } from "../config/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/utils/paths.js";
import { processImage } from "../shared/js/images-utils.js";
import { validateImageType, validateImageSize } from "../middleware/validation/index.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentStep = 1;
const totalSteps = 4;
let currentUser = null;
let coverImage = null;
let galleryImages = [];
let certificateImages = [];

// ============================================
// عناصر DOM
// ============================================
const form = document.getElementById('setupSalonForm');
const steps = document.querySelectorAll('.wizard-step');
const stepperSteps = document.querySelectorAll('.step');
const progressBar = document.getElementById('progressBar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const backBtn = document.getElementById('backBtn');
const skipBtn = document.getElementById('skipBtn');

// عناصر صورة الواجهة
const coverUploader = document.getElementById('coverUploader');
const coverInput = document.getElementById('coverInput');
const coverPreview = document.getElementById('coverPreview');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const deleteCoverBtn = document.getElementById('deleteCoverBtn');

// عناصر الوصف
const salonDescription = document.getElementById('salonDescription');
const charCount = document.getElementById('charCount');

// عناصر معرض الصور
const galleryGrid = document.getElementById('galleryGrid');
const galleryInput = document.getElementById('galleryInput');

// عناصر الشهادات
const certificatesGrid = document.getElementById('certificatesGrid');
const certificateInput = document.getElementById('certificateInput');
const certificateTitle = document.getElementById('certificateTitle');

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
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
            showNotification("بيانات المستخدم غير موجودة", "error");
            setTimeout(() => {
                window.location.replace(resolvePath('INDEX'));
            }, 2000);
            return;
        }

        const userData = userDoc.data();
        if (userData.role !== 'salon') {
            showNotification("هذه الصفحة مخصصة لأصحاب الصالونات فقط", "warning");
            setTimeout(() => {
                window.location.replace(resolvePath('INDEX'));
            }, 2000);
            return;
        }

        currentUser = user;
        initializePage();
    } catch (error) {
        console.error("خطأ في التحقق من الجلسة:", error);
        showNotification("حدث خطأ في التحقق من الجلسة", "error");
    }
});

// ============================================
// تهيئة الصفحة
// ============================================
function initializePage() {
    updateStepper();
    updateProgressBar();
    updateButtons();
    restoreDraft();
}

// ============================================
// التنقل بين المراحل
// ============================================
function goToStep(step) {
    if (step < 1 || step > totalSteps) return;
    
    if (step > currentStep && !validateCurrentStep()) {
        return;
    }
    
    steps[currentStep - 1].classList.remove('active');
    stepperSteps[currentStep - 1].classList.remove('active');
    stepperSteps[currentStep - 1].classList.add('completed');
    
    currentStep = step;
    steps[currentStep - 1].classList.add('active');
    stepperSteps[currentStep - 1].classList.add('active');
    
    updateStepper();
    updateProgressBar();
    updateButtons();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// التحقق من صحة المرحلة الحالية
// ============================================
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            if (!coverImage) {
                showNotification("يرجى اختيار صورة الواجهة الرئيسية", "error");
                return false;
            }
            return true;
            
        case 2:
            const description = salonDescription.value.trim();
            if (description.length < 10) {
                showNotification("يرجى كتابة نبذة لا تقل عن 10 أحرف", "error");
                salonDescription.focus();
                return false;
            }
            return true;
            
        default:
            return true;
    }
}

// ============================================
// تحديث الـ Stepper
// ============================================
function updateStepper() {
    stepperSteps.forEach((step, index) => {
        const stepNum = index + 1;
        
        if (stepNum < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// ============================================
// تحديث شريط التقدم
// ============================================
function updateProgressBar() {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = `${progress}%`;
}

// ============================================
// تحديث الأزرار
// ============================================
function updateButtons() {
    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
    }
    
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'flex';
    } else {
        nextBtn.style.display = 'flex';
        submitBtn.style.display = 'none';
    }
}

// ============================================
// رفع صورة الواجهة
// ============================================
coverUploader.addEventListener('click', (e) => {
    if (e.target.closest('#deleteCoverBtn')) return;
    coverInput.click();
});

coverInput.addEventListener('change', async (e) => {
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
        const base64 = await processImage(file, 1200, 0.8);
        
        coverImage = base64;
        coverPreview.src = base64;
        coverPreview.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
        deleteCoverBtn.style.display = 'flex';
        
        showNotification("تم تحديث صورة الواجهة بنجاح", "success");
        saveDraft();
    } catch (error) {
        console.error("خطأ في معالجة الصورة:", error);
        showNotification("فشل معالجة الصورة، يرجى المحاولة مرة أخرى", "error");
    }
});

deleteCoverBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    coverImage = null;
    coverPreview.src = '';
    coverPreview.style.display = 'none';
    uploadPlaceholder.style.display = 'block';
    deleteCoverBtn.style.display = 'none';
    coverInput.value = '';
    showNotification("تم إزالة صورة الواجهة", "info");
    saveDraft();
});

// ============================================
// عداد الأحرف للوصف
// ============================================
salonDescription.addEventListener('input', () => {
    const count = salonDescription.value.length;
    charCount.textContent = count;
    saveDraft();
});

// ============================================
// رفع صور المعرض
// ============================================
galleryInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (galleryImages.length + files.length > 6) {
        showNotification("يمكنك إضافة حتى 6 صور فقط", "error");
        return;
    }
    
    try {
        showNotification("جاري معالجة الصور...", "info");
        
        for (const file of files) {
            if (!validateImageType(file)) continue;
            if (!validateImageSize(file, 5)) continue;
            
            const base64 = await processImage(file, 800, 0.7);
            const imageId = `gallery_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            galleryImages.push({ id: imageId, base64 });
        }
        
        renderGallery();
        showNotification("تم إضافة الصور بنجاح", "success");
        saveDraft();
    } catch (error) {
        console.error("خطأ في معالجة الصور:", error);
        showNotification("فشل معالجة بعض الصور", "error");
    }
});

function renderGallery() {
    // إزالة الصور القديمة (ما عدا زر الإضافة)
    const existingPhotos = galleryGrid.querySelectorAll('.gallery-item');
    existingPhotos.forEach(photo => photo.remove());
    
    // إضافة الصور الجديدة
    galleryImages.forEach((img, index) => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'gallery-item';
        photoDiv.innerHTML = `
            <img src="${img.base64}" alt="صورة ${index + 1}">
            <button type="button" class="delete-photo-btn" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        galleryGrid.insertBefore(photoDiv, galleryGrid.firstChild);
    });
    
    // أحداث حذف الصور
    galleryGrid.querySelectorAll('.delete-photo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const index = parseInt(btn.dataset.index);
            galleryImages.splice(index, 1);
            renderGallery();
            saveDraft();
            showNotification("تم حذف الصورة", "info");
        });
    });
}

// ============================================
// رفع الشهادات
// ============================================
certificateInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (certificateImages.length + files.length > 3) {
        showNotification("يمكنك إضافة حتى 3 شهادات فقط", "error");
        return;
    }
    
    try {
        showNotification("جاري معالجة الشهادات...", "info");
        
        for (const file of files) {
            if (!validateImageType(file)) continue;
            if (!validateImageSize(file, 5)) continue;
            
            const base64 = await processImage(file, 800, 0.7);
            const imageId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            certificateImages.push({ id: imageId, base64 });
        }
        
        renderCertificates();
        showNotification("تم إضافة الشهادات بنجاح", "success");
        saveDraft();
    } catch (error) {
        console.error("خطأ في معالجة الشهادات:", error);
        showNotification("فشل معالجة بعض الشهادات", "error");
    }
});

function renderCertificates() {
    const existingCerts = certificatesGrid.querySelectorAll('.gallery-item');
    existingCerts.forEach(cert => cert.remove());
    
    certificateImages.forEach((img, index) => {
        const certDiv = document.createElement('div');
        certDiv.className = 'gallery-item';
        certDiv.innerHTML = `
            <img src="${img.base64}" alt="شهادة ${index + 1}">
            <button type="button" class="delete-photo-btn" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        certificatesGrid.insertBefore(certDiv, certificatesGrid.firstChild);
    });
    
    certificatesGrid.querySelectorAll('.delete-photo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const index = parseInt(btn.dataset.index);
            certificateImages.splice(index, 1);
            renderCertificates();
            saveDraft();
            showNotification("تم حذف الشهادة", "info");
        });
    });
}

// ============================================
// حفظ البيانات في Firestore
// ============================================
async function saveSetupData() {
    if (!currentUser) {
        showNotification("الجلسة غير صالحة", "error");
        return false;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري الإنهاء...</span>';
    
    try {
        const description = salonDescription.value.trim();
        const certTitle = certificateTitle.value.trim();
        
        await setDoc(doc(db, "salons", currentUser.uid), {
            coverImage,
            description,
            portfolio: galleryImages.map(img => img.base64),
            certificate: {
                title: certTitle,
                photos: certificateImages.map(img => img.base64)
            },
            onboardingStatus: "completed",
            status: "active",
            updatedAt: new Date()
        }, { merge: true });
        
        await updateDoc(doc(db, "users", currentUser.uid), {
            onboardingStatus: "completed",
            status: "active",
            updatedAt: new Date()
        });
        
        showNotification("تهانينا! تم إنشاء ملف صالونك بنجاح ", "success");
        
        sessionStorage.removeItem('salonDraft');
        sessionStorage.setItem('lastActivePage', 'setup-salon');
        
        setTimeout(() => {
            window.location.replace(resolvePath('PROFILE_SALON'));
        }, 2000);
        
        return true;
    } catch (error) {
        console.error("خطأ في حفظ بيانات الإعداد:", error);
        showNotification("حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> <span>إنهاء الإعداد</span>';
        return false;
    }
}

// ============================================
// تخطي الإعداد
// ============================================
async function skipSetup() {
    if (!currentUser) return;
    
    try {
        await setDoc(doc(db, "salons", currentUser.uid), {
            onboardingStatus: "completed",
            updatedAt: new Date()
        }, { merge: true });
        
        await updateDoc(doc(db, "users", currentUser.uid), {
            status: "active",
            onboardingStatus: "completed",
            updatedAt: new Date()
        });
        
        showNotification("تم تخطي الإعداد، يمكنك استكماله لاحقاً من الإعدادات", "info");
        
        setTimeout(() => {
            window.location.replace(resolvePath('PROFILE_SALON'));
        }, 1500);
    } catch (error) {
        console.error("خطأ في تخطي الإعداد:", error);
        showNotification("فشل تخطي الإعداد", "error");
    }
}

// ============================================
// حفظ تلقائي (Draft)
// ============================================
function saveDraft() {
    const formData = {
        coverImage,
        description: salonDescription.value,
        galleryImages,
        certificateImages,
        certificateTitle: certificateTitle.value,
        currentStep
    };
    
    sessionStorage.setItem('salonSetupDraft', JSON.stringify(formData));
}

// ============================================
// استعادة البيانات المحفوظة
// ============================================
function restoreDraft() {
    const draft = sessionStorage.getItem('salonSetupDraft');
    if (!draft) return;
    
    try {
        const formData = JSON.parse(draft);
        
        if (formData.coverImage) {
            coverImage = formData.coverImage;
            coverPreview.src = formData.coverImage;
            coverPreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
            deleteCoverBtn.style.display = 'flex';
        }
        
        if (formData.description) {
            salonDescription.value = formData.description;
            charCount.textContent = formData.description.length;
        }
        
        if (formData.galleryImages) {
            galleryImages = formData.galleryImages;
            renderGallery();
        }
        
        if (formData.certificateImages) {
            certificateImages = formData.certificateImages;
            renderCertificates();
        }
        
        if (formData.certificateTitle) {
            certificateTitle.value = formData.certificateTitle;
        }
        
        if (formData.currentStep && formData.currentStep > 1) {
            currentStep = 1;
            for (let i = 2; i <= formData.currentStep; i++) {
                goToStep(i);
            }
        }
        
        showNotification("تم استعادة البيانات المحفوظة", "info");
    } catch (error) {
        console.error("خطأ في استعادة البيانات:", error);
    }
}

// ============================================
// أحداث التنقل
// ============================================
nextBtn.addEventListener('click', () => {
    if (validateCurrentStep()) {
        goToStep(currentStep + 1);
    }
});

prevBtn.addEventListener('click', () => {
    goToStep(currentStep - 1);
});

backBtn.addEventListener('click', () => {
    window.history.back();
});

skipBtn.addEventListener('click', skipSetup);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validateCurrentStep()) {
        await saveSetupData();
    }
});

// ============================================
// حماية من فقدان الجلسة
// ============================================
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        sessionStorage.setItem('lastActivePage', 'setup-salon');
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());
        saveDraft();
    }
});

