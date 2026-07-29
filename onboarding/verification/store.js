/**
 * BarberFlow Pro - صفحة توثيق المتجر
 * المسار: onboarding/verification/store.js
 * 
 * ⚠️ ملاحظة: هذا الكود يفترض وجود جدول `verifications` في Supabase
 */

import { supabase } from '../../config/supabase-init.js';
import { getCurrentUser } from '../../middleware/auth/auth-state.js';
import { showNotification } from '../../shared/utils/notifications.js';
import { resolvePath, PATHS } from '../../shared/utils/paths.js';
import { safeExecute } from '../../shared/utils/error-handler.js';
import { uploadImage } from '../../shared/utils/images-utils.js';
import { showPageSpinner, hidePageSpinner } from '../../shared/utils/loading-manager.js';

// ============================================
// المتغيرات العامة
// ============================================
let currentStep = 1;
const totalSteps = 4;
let currentUser = null;
let businessData = null;

// بيانات الرفع
let idFrontFile = null;
let idBackFile = null;
let businessDocFile = null;
let locationDocFile = null;
let idFrontPath = null;
let idBackPath = null;
let businessDocPath = null;
let locationDocPath = null;

// ============================================
// عناصر DOM
// ============================================
const form = document.getElementById('verificationForm');
const steps = document.querySelectorAll('.form-step');
const stepperSteps = document.querySelectorAll('.step');
const progressFill = document.getElementById('progressFill');
const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const skipBtn = document.getElementById('skipBtn');

// Step 1 Elements
const ownerNameInput = document.getElementById('ownerName');
const ownerPhoneInput = document.getElementById('ownerPhone');
const ownerEmailInput = document.getElementById('ownerEmail');
const storeNameInput = document.getElementById('storeName');

// Step 2 Elements
const idFrontInput = document.getElementById('idFrontInput');
const idFrontUpload = document.getElementById('idFrontUpload');
const idFrontPlaceholder = document.getElementById('idFrontPlaceholder');
const idFrontPreview = document.getElementById('idFrontPreview');
const idFrontImage = document.getElementById('idFrontImage');
const removeIdFront = document.getElementById('removeIdFront');
const idFrontStatus = document.getElementById('idFrontStatus');

const idBackInput = document.getElementById('idBackInput');
const idBackUpload = document.getElementById('idBackUpload');
const idBackPlaceholder = document.getElementById('idBackPlaceholder');
const idBackPreview = document.getElementById('idBackPreview');
const idBackImage = document.getElementById('idBackImage');
const removeIdBack = document.getElementById('removeIdBack');
const idBackStatus = document.getElementById('idBackStatus');

// Step 3 Elements
const bankNameSelect = document.getElementById('bankName');
const accountHolderInput = document.getElementById('accountHolder');
const ribCodeInput = document.getElementById('ribCode');

// Step 4 Elements
const businessDocInput = document.getElementById('businessDocInput');
const businessDocUpload = document.getElementById('businessDocUpload');
const businessDocPlaceholder = document.getElementById('businessDocPlaceholder');
const businessDocPreview = document.getElementById('businessDocPreview');
const businessDocFileName = document.getElementById('businessDocFileName');
const businessDocFileSize = document.getElementById('businessDocFileSize');
const removeBusinessDoc = document.getElementById('removeBusinessDoc');

const locationDocInput = document.getElementById('locationDocInput');
const locationDocUpload = document.getElementById('locationDocUpload');
const locationDocPlaceholder = document.getElementById('locationDocPlaceholder');
const locationDocPreview = document.getElementById('locationDocPreview');
const locationDocFileName = document.getElementById('locationDocFileName');
const locationDocFileSize = document.getElementById('locationDocFileSize');
const removeLocationDoc = document.getElementById('removeLocationDoc');

const termsAccept = document.getElementById('termsAccept');
const refundAccept = document.getElementById('refundAccept');
const privacyAccept = document.getElementById('privacyAccept');

// ============================================
// التحقق من الجلسة والبيانات
// ============================================
async function initializePage() {
    showPageSpinner('جاري تحميل بياناتك...');

    const result = await safeExecute(async () => {
        const user = await getCurrentUser();
        if (!user) throw new Error('الجلسة غير صالحة');

        // جلب بيانات المستخدم
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, phone, email')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        // جلب بيانات المتجر
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('id, name, is_verified')
            .eq('owner_id', user.id)
            .eq('type', 'store')
            .single();

        if (businessError) throw businessError;

        return { user, profile, business };
    }, 'تحميل بيانات التوثيق');

    hidePageSpinner();

    if (!result.success) {
        showNotification(result.error?.message || 'حدث خطأ في تحميل البيانات', 'error');
        setTimeout(() => {
            window.location.replace(resolvePath('INDEX'));
        }, 2000);
        return;
    }

    currentUser = result.data.user;
    const { profile, business } = result.data;
    businessData = business;

    // التحقق من التوثيق السابق
    if (business.is_verified) {
        showStatusAlert('متجرك موثق بالفعل! لا حاجة لتقديم طلب جديد.', 'success');
        setTimeout(() => {
            window.location.replace(resolvePath('PROFILE_STORE'));
        }, 3000);
        return;
    }

    // التحقق من وجود طلب سابق
    const { data: existingVerification } = await supabase
        .from('verifications')
        .select('status')
        .eq('business_id', business.id)
        .single();

    if (existingVerification) {
        const statusMessages = {
            'pending': 'طلب التوثيق الخاص بك قيد المراجعة. سنبلغك عند الانتهاء.',
            'under_review': 'طلبك قيد المراجعة من فريقنا. الرجاء الانتظار.',
            'rejected': 'تم رفض طلب التوثيق السابق. يمكنك تقديم طلب جديد.',
        };
        
        if (existingVerification.status !== 'rejected') {
            showStatusAlert(statusMessages[existingVerification.status], 'info');
            setTimeout(() => {
                window.location.replace(resolvePath('PROFILE_STORE'));
            }, 3000);
            return;
        }
    }

    // ملء البيانات
    ownerNameInput.value = profile.full_name || '';
    ownerPhoneInput.value = profile.phone || '';
    ownerEmailInput.value = profile.email || '';
    storeNameInput.value = business.name || '';

    updateStepper();
    updateProgressBar();
    updateButtons();
}

// ============================================
// عرض تنبيه الحالة
// ============================================
function showStatusAlert(message, type = 'info') {
    const alert = document.getElementById('statusAlert');
    const messageEl = document.getElementById('statusMessage');
    
    messageEl.textContent = message;
    alert.style.display = 'block';
    
    if (type === 'success') {
        alert.style.background = 'rgba(43, 138, 62, 0.1)';
        alert.style.borderColor = 'rgba(43, 138, 62, 0.3)';
        alert.querySelector('i').style.color = 'var(--brand-success)';
    }
}

// ============================================
// التنقل بين الخطوات
// ============================================
function goToStep(step) {
    if (step < 1 || step > totalSteps) return;
    
    if (step > currentStep && !validateCurrentStep()) {
        return;
    }

    steps[currentStep - 1].classList.remove('active');
    stepperSteps[currentStep - 1].classList.remove('active');
    
    if (step > currentStep) {
        stepperSteps[currentStep - 1].classList.add('completed');
    }

    currentStep = step;
    steps[currentStep - 1].classList.add('active');
    stepperSteps[currentStep - 1].classList.add('active');

    updateStepper();
    updateProgressBar();
    updateButtons();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// التحقق من صحة الخطوة الحالية
// ============================================
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return true; // البيانات تُجلب تلقائياً
        
        case 2:
            if (!idFrontFile) {
                showNotification('يرجى رفع صورة وجه بطاقة التعريف', 'error');
                return false;
            }
            if (!idBackFile) {
                showNotification('يرجى رفع صورة ظهر بطاقة التعريف', 'error');
                return false;
            }
            return true;
        
        case 3:
            if (!bankNameSelect.value) {
                showNotification('يرجى اختيار البنك', 'error');
                return false;
            }
            if (!accountHolderInput.value.trim()) {
                showNotification('يرجى إدخال اسم صاحب الحساب', 'error');
                return false;
            }
            if (!ribCodeInput.value.trim() || ribCodeInput.value.replace(/\s/g, '').length !== 24) {
                showNotification('يرجى إدخال رمز RIB صحيح (24 رقم)', 'error');
                return false;
            }
            return true;
        
        case 4:
            const businessDocType = document.querySelector('input[name="businessDocType"]:checked');
            if (!businessDocType) {
                showNotification('يرجى اختيار نوع الوثيقة التجارية', 'error');
                return false;
            }
            if (!businessDocFile) {
                showNotification('يرجى رفع الوثيقة التجارية', 'error');
                return false;
            }
            
            const locationDocType = document.querySelector('input[name="locationDocType"]:checked');
            if (!locationDocType) {
                showNotification('يرجى اختيار نوع وثيقة المكان', 'error');
                return false;
            }
            if (!locationDocFile) {
                showNotification('يرجى رفع وثيقة المكان', 'error');
                return false;
            }
            
            if (!termsAccept.checked || !refundAccept.checked || !privacyAccept.checked) {
                showNotification('يرجى الموافقة على جميع الشروط والسياسات', 'error');
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
    progressFill.style.width = `${progress}%`;
}

// ============================================
// تحديث الأزرار
// ============================================
function updateButtons() {
    backBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

// ============================================
// رفع صورة بطاقة التعريف - وجه
// ============================================
idFrontUpload.addEventListener('click', () => {
    if (!idFrontFile) idFrontInput.click();
});

idFrontInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('يرجى اختيار صورة صالحة', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الصورة كبير جداً (الحد الأقصى 5MB)', 'error');
        return;
    }

    idFrontFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        idFrontImage.src = e.target.result;
        idFrontPreview.style.display = 'block';
        idFrontPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);

    idFrontStatus.textContent = '✓ تم اختيار الصورة';
    idFrontStatus.className = 'upload-status success';
});

removeIdFront.addEventListener('click', (e) => {
    e.stopPropagation();
    idFrontFile = null;
    idFrontPath = null;
    idFrontImage.src = '';
    idFrontPreview.style.display = 'none';
    idFrontPlaceholder.style.display = 'flex';
    idFrontInput.value = '';
    idFrontStatus.textContent = '';
});

// ============================================
// رفع صورة بطاقة التعريف - ظهر
// ============================================
idBackUpload.addEventListener('click', () => {
    if (!idBackFile) idBackInput.click();
});

idBackInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('يرجى اختيار صورة صالحة', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الصورة كبير جداً (الحد الأقصى 5MB)', 'error');
        return;
    }

    idBackFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        idBackImage.src = e.target.result;
        idBackPreview.style.display = 'block';
        idBackPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);

    idBackStatus.textContent = '✓ تم اختيار الصورة';
    idBackStatus.className = 'upload-status success';
});

removeIdBack.addEventListener('click', (e) => {
    e.stopPropagation();
    idBackFile = null;
    idBackPath = null;
    idBackImage.src = '';
    idBackPreview.style.display = 'none';
    idBackPlaceholder.style.display = 'flex';
    idBackInput.value = '';
    idBackStatus.textContent = '';
});

// ============================================
// رفع الوثيقة التجارية
// ============================================
businessDocUpload.addEventListener('click', () => {
    if (!businessDocFile) businessDocInput.click();
});

businessDocInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('نوع الملف غير مدعوم. استخدم PNG, JPG, أو PDF', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الملف كبير جداً (الحد الأقصى 5MB)', 'error');
        return;
    }

    businessDocFile = file;
    
    businessDocFileName.textContent = file.name;
    businessDocFileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;
    businessDocPreview.style.display = 'block';
    businessDocPlaceholder.style.display = 'none';
});

removeBusinessDoc.addEventListener('click', (e) => {
    e.stopPropagation();
    businessDocFile = null;
    businessDocPath = null;
    businessDocPreview.style.display = 'none';
    businessDocPlaceholder.style.display = 'flex';
    businessDocInput.value = '';
});

// ============================================
// رفع وثيقة المكان
// ============================================
locationDocUpload.addEventListener('click', () => {
    if (!locationDocFile) locationDocInput.click();
});

locationDocInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('نوع الملف غير مدعوم. استخدم PNG, JPG, أو PDF', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الملف كبير جداً (الحد الأقصى 5MB)', 'error');
        return;
    }

    locationDocFile = file;
    
    locationDocFileName.textContent = file.name;
    locationDocFileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;
    locationDocPreview.style.display = 'block';
    locationDocPlaceholder.style.display = 'none';
});

removeLocationDoc.addEventListener('click', (e) => {
    e.stopPropagation();
    locationDocFile = null;
    locationDocPath = null;
    locationDocPreview.style.display = 'none';
    locationDocPlaceholder.style.display = 'flex';
    locationDocInput.value = '';
});

// ============================================
// تنسيق RIB تلقائياً
// ============================================
ribCodeInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (value.length > 24) value = value.slice(0, 24);
    
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formatted;
});

// ============================================
// إرسال النموذج
// ============================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;

    showPageSpinner('جاري رفع المستندات...');

    const result = await safeExecute(async () => {
        // 1. رفع صورة وجه البطاقة
        idFrontStatus.textContent = 'جاري الرفع...';
        idFrontStatus.className = 'upload-status loading';
        
        const idFrontResult = await uploadImage(idFrontFile, `verifications/${businessData.id}`, {
            prefix: 'id_front'
        });
        
        if (!idFrontResult.success) throw new Error(idFrontResult.error);
        idFrontPath = idFrontResult.path;
        idFrontStatus.textContent = '✓ تم الرفع بنجاح';
        idFrontStatus.className = 'upload-status success';

        // 2. رفع صورة ظهر البطاقة
        idBackStatus.textContent = 'جاري الرفع...';
        idBackStatus.className = 'upload-status loading';
        
        const idBackResult = await uploadImage(idBackFile, `verifications/${businessData.id}`, {
            prefix: 'id_back'
        });
        
        if (!idBackResult.success) throw new Error(idBackResult.error);
        idBackPath = idBackResult.path;
        idBackStatus.textContent = '✓ تم الرفع بنجاح';
        idBackStatus.className = 'upload-status success';

        // 3. رفع الوثيقة التجارية
        const businessDocResult = await uploadImage(businessDocFile, `verifications/${businessData.id}`, {
            prefix: 'business_doc'
        });
        
        if (!businessDocResult.success) throw new Error(businessDocResult.error);
        businessDocPath = businessDocResult.path;

        // 4. رفع وثيقة المكان
        const locationDocResult = await uploadImage(locationDocFile, `verifications/${businessData.id}`, {
            prefix: 'location_doc'
        });
        
        if (!locationDocResult.success) throw new Error(locationDocResult.error);
        locationDocPath = locationDocResult.path;

        // 5. حفظ بيانات التوثيق في قاعدة البيانات
        const businessDocType = document.querySelector('input[name="businessDocType"]:checked').value;
        const locationDocType = document.querySelector('input[name="locationDocType"]:checked').value;
        const ribClean = ribCodeInput.value.replace(/\s/g, '');

        const { data: verification, error: verificationError } = await supabase
            .from('verifications')
            .insert({
                business_id: businessData.id,
                user_id: currentUser.id,
                status: 'pending',
                id_card_front_url: idFrontPath,
                id_card_back_url: idBackPath,
                bank_name: bankNameSelect.value,
                account_holder: accountHolderInput.value.trim(),
                rib: ribClean,
                business_doc_url: businessDocPath,
                business_doc_type: businessDocType,
                location_doc_url: locationDocPath,
                location_doc_type: locationDocType,
                terms_accepted: termsAccept.checked,
                refund_policy_accepted: refundAccept.checked,
                privacy_accepted: privacyAccept.checked,
                submitted_at: new Date().toISOString()
            })
            .select()
            .single();

        if (verificationError) throw verificationError;

        return verification;
    }, 'إرسال طلب التوثيق');

    hidePageSpinner();

    if (result.success) {
        showNotification('تم إرسال طلب التوثيق بنجاح! سنراجعه خلال 24-48 ساعة.', 'success');
        
        setTimeout(() => {
            window.location.replace(resolvePath('PROFILE_STORE'));
        }, 2000);
    } else {
        showNotification(result.error?.message || 'حدث خطأ في إرسال الطلب', 'error');
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال طلب التوثيق';
    }
});

// ============================================
// تخطي التوثيق
// ============================================
skipBtn.addEventListener('click', () => {
    showNotification('يمكنك تقديم طلب التوثيق لاحقاً من إعدادات المتجر', 'info');
    setTimeout(() => {
        window.location.replace(resolvePath('PROFILE_STORE'));
    }, 1500);
});

// ============================================
// أحداث التنقل
// ============================================
nextBtn.addEventListener('click', () => {
    goToStep(currentStep + 1);
});

backBtn.addEventListener('click', () => {
    goToStep(currentStep - 1);
});

// ============================================
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

