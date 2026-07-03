/**
 * BarberFlow Pro - صفحة إضافة الصالون (Wizard)
 * المسار: onboarding/add-salon.js
 * المميزات:
 * - تقسيم إلى 5 مراحل
 * - حفظ تلقائي للبيانات
 * - تحقق من صحة البيانات في كل مرحلة
 * - حماية الجلسة
 */

import { auth, db } from "../core/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";
import { sanitizeText, sanitizePhone } from "../middleware/validation/index.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentStep = 1;
const totalSteps = 5;
let currentUser = null;
let selectedDays = [];
let services = [];
let serviceCounter = 0;

// ============================================
// عناصر DOM
// ============================================
const form = document.getElementById('addSalonForm');
const steps = document.querySelectorAll('.wizard-step');
const stepperSteps = document.querySelectorAll('.step');
const progressBar = document.getElementById('progressBar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const backBtn = document.getElementById('backBtn');
const cancelBtn = document.getElementById('cancelBtn');
const servicesList = document.getElementById('servicesList');
const addServiceBtn = document.getElementById('addServiceBtn');
const emptyServices = document.getElementById('emptyServices');
const daysSelector = document.getElementById('daysSelector');

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
    // بناء أيام الأسبوع
    buildDaysSelector();
    
    // إضافة خدمة أولية
    if (services.length === 0) {
        addServiceField();
    }
    
    // استعادة البيانات المحفوظة
    restoreDraft();
    
    // تحديث الواجهة
    updateStepper();
    updateProgressBar();
    updateButtons();
}

// ============================================
// بناء أيام الأسبوع
// ============================================
function buildDaysSelector() {
    const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
    
    days.forEach(day => {
        const chip = document.createElement('div');
        chip.className = 'day-chip';
        chip.textContent = day;
        chip.dataset.day = day;
        
        chip.addEventListener('click', () => {
            chip.classList.toggle('selected');
            
            if (chip.classList.contains('selected')) {
                if (!selectedDays.includes(day)) {
                    selectedDays.push(day);
                }
            } else {
                selectedDays = selectedDays.filter(d => d !== day);
            }
        });
        
        daysSelector.appendChild(chip);
    });
}

// ============================================
// إضافة حقل خدمة
// ============================================
function addServiceField() {
    serviceCounter++;
    const serviceId = `service_${serviceCounter}`;
    
    const serviceDiv = document.createElement('div');
    serviceDiv.className = 'service-item';
    serviceDiv.dataset.serviceId = serviceId;
    
    serviceDiv.innerHTML = `
        <div class="service-fields">
            <div class="field-group">
                <label>اسم الخدمة</label>
                <input 
                    type="text" 
                    class="service-name" 
                    placeholder="مثال: حلاقة شعر"
                    required
                >
            </div>
            <div class="field-group">
                <label>السعر (DH)</label>
                <input 
                    type="number" 
                    class="service-price" 
                    placeholder="50"
                    min="0"
                    step="0.01"
                    required
                >
            </div>
        </div>
        <button type="button" class="delete-service-btn" aria-label="حذف الخدمة">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // حدث حذف الخدمة
    const deleteBtn = serviceDiv.querySelector('.delete-service-btn');
    deleteBtn.addEventListener('click', () => {
        serviceDiv.remove();
        services = services.filter(s => s.id !== serviceId);
        updateEmptyState();
        showNotification("تم حذف الخدمة", "info");
    });
    
    servicesList.appendChild(serviceDiv);
    updateEmptyState();
}

// ============================================
// تحديث حالة الخدمات الفارغة
// ============================================
function updateEmptyState() {
    if (servicesList.children.length === 0) {
        emptyServices.style.display = 'block';
    } else {
        emptyServices.style.display = 'none';
    }
}

// ============================================
// جمع بيانات الخدمات
// ============================================
function collectServices() {
    const serviceItems = servicesList.querySelectorAll('.service-item');
    const collectedServices = [];
    
    serviceItems.forEach(item => {
        const name = item.querySelector('.service-name').value.trim();
        const price = parseFloat(item.querySelector('.service-price').value);
        
        if (name && !isNaN(price) && price >= 0) {
            collectedServices.push({
                id: item.dataset.serviceId,
                name,
                price
            });
        }
    });
    
    return collectedServices;
}

// ============================================
// التنقل بين المراحل
// ============================================
function goToStep(step) {
    if (step < 1 || step > totalSteps) return;
    
    // التحقق من صحة المرحلة الحالية قبل الانتقال
    if (step > currentStep && !validateCurrentStep()) {
        return;
    }
    
    // إخفاء المرحلة الحالية
    steps[currentStep - 1].classList.remove('active');
    stepperSteps[currentStep - 1].classList.remove('active');
    stepperSteps[currentStep - 1].classList.add('completed');
    
    // تحديث المرحلة الجديدة
    currentStep = step;
    steps[currentStep - 1].classList.add('active');
    stepperSteps[currentStep - 1].classList.add('active');
    
    // تحديث الواجهة
    updateStepper();
    updateProgressBar();
    updateButtons();
    
    // التمرير إلى الأعلى
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// التحقق من صحة المرحلة الحالية
// ============================================
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            const salonName = document.getElementById('salonName').value.trim();
            const location = document.getElementById('salonLocation').value.trim();
            const phone = document.getElementById('salonPhone').value.trim();
            
            if (!salonName || salonName.length < 3) {
                showNotification("يرجى إدخال اسم صالون صحيح (3 أحرف على الأقل)", "error");
                document.getElementById('salonName').focus();
                return false;
            }
            
            if (!location) {
                showNotification("يرجى إدخال المدينة/الحي", "error");
                document.getElementById('salonLocation').focus();
                return false;
            }
            
            if (!phone || phone.length < 10) {
                showNotification("يرجى إدخال رقم هاتف صحيح", "error");
                document.getElementById('salonPhone').focus();
                return false;
            }
            return true;
            
        case 2:
            const selectedType = document.querySelector('input[name="salonType"]:checked');
            if (!selectedType) {
                showNotification("يرجى اختيار نوع الصالون", "error");
                return false;
            }
            return true;
            
        case 3:
            const currentServices = collectServices();
            if (currentServices.length === 0) {
                showNotification("يرجى إضافة خدمة واحدة على الأقل", "error");
                return false;
            }
            return true;
            
        case 4:
            if (selectedDays.length === 0) {
                showNotification("يرجى اختيار يوم عمل واحد على الأقل", "error");
                return false;
            }
            
            const openTime = document.getElementById('openTime').value;
            const closeTime = document.getElementById('closeTime').value;
            
            if (!openTime || !closeTime) {
                showNotification("يرجى تحديد ساعات العمل", "error");
                return false;
            }
            return true;
            
        case 5:
            const bookingType = document.querySelector('input[name="bookingType"]:checked');
            if (!bookingType) {
                showNotification("يرجى اختيار طريقة تأكيد الحجوزات", "error");
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
    // زر السابق
    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
    }
    
    // زر التالي/الإرسال
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'flex';
    } else {
        nextBtn.style.display = 'flex';
        submitBtn.style.display = 'none';
    }
}

// ============================================
// حفظ البيانات في Firestore
// ============================================
async function saveSalonData() {
    if (!currentUser) {
        showNotification("الجلسة غير صالحة", "error");
        return false;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري الحفظ...</span>';
    
    try {
        // جمع البيانات
        const salonName = sanitizeText(document.getElementById('salonName').value.trim());
        const location = sanitizeText(document.getElementById('salonLocation').value.trim());
        const phone = sanitizePhone(document.getElementById('salonPhone').value.trim());
        const salonType = document.querySelector('input[name="salonType"]:checked').value;
        const bookingType = document.querySelector('input[name="bookingType"]:checked').value;
        const openTime = document.getElementById('openTime').value;
        const closeTime = document.getElementById('closeTime').value;
        const services = collectServices();
        
        // حفظ البيانات في Firestore
        await setDoc(doc(db, "salons", currentUser.uid), {
            salonName,
            location,
            phone,
            salonType,
            services,
            bookingType,
            workDays: selectedDays,
            workingHours: {
                open: openTime,
                close: closeTime
            },
            onboardingStatus: "basic_done",
            status: "new",
            createdAt: new Date(),
            updatedAt: new Date()
        }, { merge: true });
        
        // تحديث مستند المستخدم
        await updateDoc(doc(db, "users", currentUser.uid), {
            onboardingStatus: "basic_done",
            updatedAt: new Date()
        });
        
        showNotification("تم حفظ بيانات الصالون بنجاح! ", "success");
        
        // حفظ حالة الجلسة
        sessionStorage.setItem('salonSetupCompleted', 'true');
        sessionStorage.setItem('lastActivePage', 'add-salon');
        
        // الانتقال إلى صفحة setup
        setTimeout(() => {
            window.location.href = resolvePath('SETUP_SALON');
        }, 1500);
        
        return true;
    } catch (error) {
        console.error("خطأ في حفظ بيانات الصالون:", error);
        showNotification("حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> <span>حفظ ومتابعة الإعداد</span>';
        return false;
    }
}

// ============================================
// حفظ تلقائي (Draft)
// ============================================
function saveDraft() {
    const formData = {
        salonName: document.getElementById('salonName').value,
        location: document.getElementById('salonLocation').value,
        phone: document.getElementById('salonPhone').value,
        salonType: document.querySelector('input[name="salonType"]:checked')?.value,
        bookingType: document.querySelector('input[name="bookingType"]:checked')?.value,
        openTime: document.getElementById('openTime').value,
        closeTime: document.getElementById('closeTime').value,
        selectedDays,
        services: collectServices(),
        currentStep
    };
    
    sessionStorage.setItem('salonDraft', JSON.stringify(formData));
}

// ============================================
// استعادة البيانات المحفوظة
// ============================================
function restoreDraft() {
    const draft = sessionStorage.getItem('salonDraft');
    if (!draft) return;
    
    try {
        const formData = JSON.parse(draft);
        
        document.getElementById('salonName').value = formData.salonName || '';
        document.getElementById('salonLocation').value = formData.location || '';
        document.getElementById('salonPhone').value = formData.phone || '';
        
        if (formData.salonType) {
            const typeRadio = document.querySelector(`input[name="salonType"][value="${formData.salonType}"]`);
            if (typeRadio) typeRadio.checked = true;
        }
        
        if (formData.bookingType) {
            const bookingRadio = document.querySelector(`input[name="bookingType"][value="${formData.bookingType}"]`);
            if (bookingRadio) bookingRadio.checked = true;
        }
        
        document.getElementById('openTime').value = formData.openTime || '09:00';
        document.getElementById('closeTime').value = formData.closeTime || '21:00';
        
        // استعادة الأيام المحددة
        if (formData.selectedDays) {
            formData.selectedDays.forEach(day => {
                const chip = daysSelector.querySelector(`[data-day="${day}"]`);
                if (chip) {
                    chip.classList.add('selected');
                    if (!selectedDays.includes(day)) {
                        selectedDays.push(day);
                    }
                }
            });
        }
        
        // استعادة الخدمات
        if (formData.services && formData.services.length > 0) {
            servicesList.innerHTML = '';
            formData.services.forEach(service => {
                addServiceField();
                const lastService = servicesList.lastElementChild;
                if (lastService) {
                    lastService.querySelector('.service-name').value = service.name;
                    lastService.querySelector('.service-price').value = service.price;
                }
            });
        }
        
        // استعادة المرحلة
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
// إلغاء وحذف الحساب
// ============================================
async function cancelAndDeleteAccount() {
    const confirmed = confirm("هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه!");
    if (!confirmed) return;
    
    if (!currentUser) {
        showNotification("الجلسة غير صالحة", "error");
        return;
    }
    
    try {
        await setDoc(doc(db, "salons", currentUser.uid), {
            deleted: true,
            deletedAt: new Date()
        }, { merge: true });
        
        await updateDoc(doc(db, "users", currentUser.uid), {
            status: "deleted",
            deletedAt: new Date()
        });
        
        await signOut(auth);
        showNotification("تم حذف الحساب بنجاح", "success");
        
        setTimeout(() => {
            window.location.replace(resolvePath('INDEX'));
        }, 2000);
    } catch (error) {
        console.error("خطأ في حذف الحساب:", error);
        showNotification("فشل حذف الحساب، يرجى المحاولة مرة أخرى", "error");
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

addServiceBtn.addEventListener('click', () => {
    addServiceField();
});

backBtn.addEventListener('click', () => {
    window.history.back();
});

cancelBtn.addEventListener('click', cancelAndDeleteAccount);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validateCurrentStep()) {
        await saveSalonData();
    }
});

// ============================================
// حماية من فقدان الجلسة
// ============================================
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        sessionStorage.setItem('lastActivePage', 'add-salon');
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());
        saveDraft();
    }
});

