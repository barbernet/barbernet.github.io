/**
 * BarberFlow Pro - صفحة إعداد الهوية البصرية للمتجر (Wizard)
 * المسار: onboarding/setup-store.js
 * المميزات:
 * - تقسيم إلى 4 مراحل
 * - رفع ومعالجة الصور
 * - حفظ تلقائي للبيانات
 * - يمكن تخطيها والعودة لاحقاً
 */

import { auth, db } from "../config/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { processImage } from "../shared/js/images-utils.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/utils/paths.js";
import { validateImageType, validateImageSize } from "../middleware/validation/index.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentStep = 1;
const totalSteps = 4;
let selectedCoverBase64 = null;
let galleryImages = [];
let certificateImages = [];
let currentUid = null;
let isProcessing = false;

// ============================================
// عناصر DOM
// ============================================
const setupForm = document.getElementById('setupStoreForm');
const steps = document.querySelectorAll('.setup-step');
const stepperSteps = document.querySelectorAll('.step');
const progressBar = document.getElementById('progressBar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const skipBtn = document.getElementById('skipBtn');
const backBtn = document.getElementById('backBtn');

const coverUploader = document.getElementById('coverUploader');
const coverFileInput = document.getElementById('coverFileInput');
const coverImg = document.getElementById('coverImg');
const coverPlaceholder = document.getElementById('coverPlaceholder');
const deleteCoverBtn = document.getElementById('deleteCoverBtn');

const storeDescription = document.getElementById('storeDescription');
const descCharCount = document.getElementById('descCharCount');
const certificateText = document.getElementById('certificateText');

const galleryPreviewsContainer = document.getElementById('galleryPreviewsContainer');
const galleryFileInput = document.getElementById('galleryFileInput');
const certPreviewsContainer = document.getElementById('certPreviewsContainer');
const certFileInput = document.getElementById('certFileInput');

// ============================================
// التحقق من الجلسة
// ============================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        showNotification("الجلسة غير صالحة، يرجى تسجيل الدخول", "error");
        setTimeout(() => {
            window.location.replace(resolvePath('LOGIN'));
        }, 2000);
        return;
    }

    currentUid = user.uid;
    initializePage();
});

// ============================================
// تهيئة الصفحة
// ============================================
function initializePage() {
    restoreDraft();
    updateStepper();
    updateProgressBar();
    updateButtons();
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
            if (!selectedCoverBase64) {
                showNotification("يرجى اختيار صورة الواجهة الرئيسية أولاً", "error");
                return false;
            }
            return true;
            
        case 2:
            const description = storeDescription ? storeDescription.value.trim() : "";
            if (description.length < 10) {
                showNotification("يرجى كتابة نبذة عن المتجر لا تقل عن 10 أحرف", "error");
                if (storeDescription) storeDescription.focus();
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
// التحكم في حالة الأزرار
// ============================================
function toggleButtonsState(disabled, text = "") {
    isProcessing = disabled;
    
    if (submitBtn) {
        submitBtn.disabled = disabled;
        if (disabled) {
            if (!submitBtn.dataset.originalText) {
                submitBtn.dataset.originalText = submitBtn.innerHTML;
            }
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${text}</span>`;
        } else {
            submitBtn.innerHTML = submitBtn.dataset.originalText || 'حفظ وإنشاء الملف الشخصي';
        }
    }
    
    if (skipBtn) skipBtn.disabled = disabled;
    if (nextBtn) nextBtn.disabled = disabled;
}

// ============================================
// رفع صورة الغلاف
// ============================================
if (coverUploader && coverFileInput) {
    coverUploader.onclick = (e) => {
        if (e.target.closest('#deleteCoverBtn') || isProcessing) return;
        coverFileInput.click();
    };
    
    coverFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!validateImageType(file)) {
            showNotification("يرجى اختيار ملف صورة صحيح (PNG أو JPG)", "error");
            coverFileInput.value = "";
            return;
        }
        
        if (!validateImageSize(file, 5)) {
            showNotification("حجم الصورة كبير جداً (الحد الأقصى 5MB)", "error");
            coverFileInput.value = "";
            return;
        }
        
        toggleButtonsState(true, "جاري معالجة صورة الواجهة...");
        
        try {
            selectedCoverBase64 = await processImage(file, 1200, 0.8);
            
            if (coverImg) {
                coverImg.src = selectedCoverBase64;
                coverImg.style.display = 'block';
            }
            if (coverPlaceholder) coverPlaceholder.style.display = 'none';
            if (deleteCoverBtn) deleteCoverBtn.style.display = 'flex';
            
            showNotification("تم تحديث صورة واجهة المتجر بنجاح 📸", "success");
            saveDraft();
        } catch (err) {
            console.error("Cover photo processing failed:", err);
            showNotification("لم نتمكن من معالجة الصورة، يرجى تجربة صورة أخرى", "error");
        } finally {
            toggleButtonsState(false);
            coverFileInput.value = "";
        }
    };
}

// ============================================
// إزالة صورة الغلاف
// ============================================
if (deleteCoverBtn) {
    deleteCoverBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        selectedCoverBase64 = null;
        
        if (coverImg) {
            coverImg.src = "";
            coverImg.style.display = 'none';
        }
        if (coverPlaceholder) coverPlaceholder.style.display = 'flex';
        deleteCoverBtn.style.display = 'none';
        if (coverFileInput) coverFileInput.value = "";
        
        showNotification("تم إزالة صورة الواجهة بنجاح", "info");
        saveDraft();
    };
}

// ============================================
// عداد الأحرف للوصف
// ============================================
if (storeDescription && descCharCount) {
    storeDescription.addEventListener('input', () => {
        descCharCount.textContent = storeDescription.value.length;
        saveDraft();
    });
}

// ============================================
// رفع صور المعرض
// ============================================
if (galleryFileInput) {
    galleryFileInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        if ((galleryImages.length + files.length) > 6) {
            showNotification("يمكنك رفع 6 صور كحد أقصى لمعرض المنتجات", "error");
            galleryFileInput.value = "";
            return;
        }
        
        toggleButtonsState(true, "جاري معالجة صور المعرض...");
        
        try {
            for (const file of files) {
                if (!validateImageType(file)) continue;
                if (!validateImageSize(file, 5)) continue;
                
                const base64 = await processImage(file, 800, 0.7);
                const imageId = 'gallery_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                galleryImages.push({ id: imageId, base64: base64 });
            }
            
            renderPreviews(galleryImages, galleryPreviewsContainer);
            showNotification("تم إضافة صور معرض المنتجات بنجاح ✨", "success");
            saveDraft();
        } catch (err) {
            console.error("Error processing gallery image:", err);
            showNotification("حدثت مشكلة أثناء معالجة الصور", "error");
        } finally {
            toggleButtonsState(false);
            galleryFileInput.value = "";
        }
    };
}

// ============================================
// رفع صور الشهادات
// ============================================
if (certFileInput) {
    certFileInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        if ((certificateImages.length + files.length) > 3) {
            showNotification("يمكنك إرفاق 3 شهادات كحد أقصى", "error");
            certFileInput.value = "";
            return;
        }
        
        toggleButtonsState(true, "جاري معالجة وثائق الشهادات...");
        
        try {
            for (const file of files) {
                if (!validateImageType(file)) continue;
                if (!validateImageSize(file, 5)) continue;
                
                const base64 = await processImage(file, 800, 0.7);
                const imageId = 'cert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                certificateImages.push({ id: imageId, base64: base64 });
            }
            
            renderPreviews(certificateImages, certPreviewsContainer);
            showNotification("تم إرفاق مستندات الشهادات بنجاح 🎓", "success");
            saveDraft();
        } catch (err) {
            console.error("Error processing certification image:", err);
            showNotification("لم نتمكن من قراءة ملفات الشهادات", "error");
        } finally {
            toggleButtonsState(false);
            certFileInput.value = "";
        }
    };
}

// ============================================
// بناء كروت المعاينة
// ============================================
function renderPreviews(array, container) {
    if (!container) return;
    
    // إزالة العناصر القديمة (ما عدا زر الإضافة)
    const existingItems = container.querySelectorAll('.gallery-item');
    existingItems.forEach(item => item.remove());
    
    array.forEach(imgData => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${imgData.base64}" alt="معاينة">
            <button type="button" class="delete-btn" aria-label="حذف">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        item.querySelector('.delete-btn').onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const updatedArray = array.filter(img => img.id !== imgData.id);
            
            if (container === galleryPreviewsContainer) {
                galleryImages = updatedArray;
            } else {
                certificateImages = updatedArray;
            }
            
            renderPreviews(updatedArray, container);
            saveDraft();
            showNotification("تم حذف الصورة", "info");
        };
        
        const addBtn = container.querySelector('.add-photo-btn');
        if (addBtn) {
            container.insertBefore(item, addBtn);
        } else {
            container.appendChild(item);
        }
    });
}

// ============================================
// حفظ البيانات في Firestore
// ============================================
async function saveSetupData() {
    if (!currentUid || isProcessing) return;
    
    const descriptionValue = storeDescription ? storeDescription.value.trim() : "";
    const certificateTitleValue = certificateText ? certificateText.value.trim() : "";
    
    toggleButtonsState(true, "جاري إعداد ملف متجرك الاحترافي...");
    
    try {
        await setDoc(doc(db, "stores", currentUid), {
            coverImage: selectedCoverBase64,
            description: descriptionValue,
            portfolio: galleryImages.map(img => img.base64),
            certificate: {
                title: certificateTitleValue,
                photos: certificateImages.map(img => img.base64)
            },
            onboardingStatus: "completed",
            updatedAt: new Date()
        }, { merge: true });
        
        await updateDoc(doc(db, "users", currentUid), {
            status: "active",
            onboardingStatus: "completed",
            updatedAt: new Date()
        });
        
        showNotification("تهانينا! تم إنشاء ملف متجرك بنجاح 🪄", "success");
        
        sessionStorage.removeItem('storeSetupDraft');
        sessionStorage.setItem('lastActivePage', 'setup-store');
        
        setTimeout(() => {
            window.location.replace(resolvePath('PROFILE_STORE'));
        }, 1500);
    } catch (err) {
        console.error("Error during store setup:", err);
        showNotification("حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى", "error");
        toggleButtonsState(false);
    }
}

// ============================================
// التخطي
// ============================================
if (skipBtn) {
    skipBtn.onclick = async (e) => {
        e.preventDefault();
        
        if (!currentUid || isProcessing) return;
        
        toggleButtonsState(true, "جاري تأجيل خطوة الهوية البصرية...");
        
        try {
            await setDoc(doc(db, "stores", currentUid), {
                onboardingStatus: "completed",
                updatedAt: new Date()
            }, { merge: true });
            
            await updateDoc(doc(db, "users", currentUid), {
                status: "active",
                onboardingStatus: "completed",
                updatedAt: new Date()
            });
            
            showNotification("تم تأجيل إعداد المظهر، يمكنك استكماله لاحقاً من الإعدادات", "success");
            
            setTimeout(() => {
                window.location.replace(resolvePath('PROFILE_STORE'));
            }, 1200);
        } catch (err) {
            console.error("Error during store onboarding skipping:", err);
            showNotification("لم نتمكن من معالجة طلب التخطي حالياً", "error");
            toggleButtonsState(false);
        }
    };
}

// ============================================
// أحداث التنقل
// ============================================
if (nextBtn) {
    nextBtn.onclick = () => {
        if (validateCurrentStep()) {
            goToStep(currentStep + 1);
        }
    };
}

if (prevBtn) {
    prevBtn.onclick = () => {
        goToStep(currentStep - 1);
    };
}

if (backBtn) {
    backBtn.onclick = () => {
        window.history.back();
    };
}

if (setupForm) {
    setupForm.onsubmit = async (e) => {
        e.preventDefault();
        if (validateCurrentStep()) {
            await saveSetupData();
        }
    };
}

// ============================================
// حفظ تلقائي (Draft)
// ============================================
function saveDraft() {
    const formData = {
        coverImage: selectedCoverBase64,
        description: storeDescription ? storeDescription.value : "",
        galleryImages,
        certificateImages,
        certificateTitle: certificateText ? certificateText.value : "",
        currentStep
    };
    
    sessionStorage.setItem('storeSetupDraft', JSON.stringify(formData));
}

// ============================================
// استعادة البيانات المحفوظة
// ============================================
function restoreDraft() {
    const draft = sessionStorage.getItem('storeSetupDraft');
    if (!draft) return;
    
    try {
        const formData = JSON.parse(draft);
        
        if (formData.coverImage) {
            selectedCoverBase64 = formData.coverImage;
            if (coverImg) {
                coverImg.src = formData.coverImage;
                coverImg.style.display = 'block';
            }
            if (coverPlaceholder) coverPlaceholder.style.display = 'none';
            if (deleteCoverBtn) deleteCoverBtn.style.display = 'flex';
        }
        
        if (formData.description && storeDescription) {
            storeDescription.value = formData.description;
            if (descCharCount) descCharCount.textContent = formData.description.length;
        }
        
        if (formData.galleryImages) {
            galleryImages = formData.galleryImages;
            renderPreviews(galleryImages, galleryPreviewsContainer);
        }
        
        if (formData.certificateImages) {
            certificateImages = formData.certificateImages;
            renderPreviews(certificateImages, certPreviewsContainer);
        }
        
        if (formData.certificateTitle && certificateText) {
            certificateText.value = formData.certificateTitle;
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
// حماية من فقدان الجلسة
// ============================================
window.addEventListener('beforeunload', () => {
    if (currentUid) {
        sessionStorage.setItem('lastActivePage', 'setup-store');
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());
        saveDraft();
    }
});

