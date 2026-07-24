/**
 * BarberFlow Pro - صفحة إضافة المتجر (Wizard متعدد الخطوات)
 * المسار: onboarding/add-store.js
 * المميزات:
 * - تقسيم إلى 5 مراحل
 * - حفظ تلقائي للبيانات
 * - تحقق من صحة البيانات في كل مرحلة
 * - حماية الجلسة
 */

import { auth, db } from "../config/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/utils/paths.js";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "../middleware/validation/index.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentStep = 1;
const totalSteps = 5;
let currentUser = null;
let selectedDays = [];
let categories = [];
let categoryCounter = 0;

// ============================================
// عناصر DOM
// ============================================
const form = document.getElementById('addStoreForm');
const steps = document.querySelectorAll('.wizard-step');
const stepperSteps = document.querySelectorAll('.step');
const progressBar = document.getElementById('progressBar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const backBtn = document.getElementById('backBtn');
const cancelBtn = document.getElementById('cancelBtn');
const categoriesList = document.getElementById('categoriesList');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const emptyCategories = document.getElementById('emptyCategories');
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
        if (userData.role !== 'store') {
            showNotification("هذه الصفحة مخصصة لأصحاب المتاجر فقط", "warning");
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
    buildDaysSelector();
    
    if (categories.length === 0) {
        addCategoryField();
    }
    
    restoreDraft();
    
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
// إضافة حقل قسم
// ============================================
function addCategoryField() {
    categoryCounter++;
    const categoryId = `category_${categoryCounter}`;
    
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-item';
    categoryDiv.dataset.categoryId = categoryId;
    
    categoryDiv.innerHTML = `
        <div class="category-fields">
            <div class="field-group">
                <label>اسم القسم</label>
                <input 
                    type="text" 
                    class="category-name" 
                    placeholder="مثال: شامبو، مقصات، كريمات..."
                    required
                >
            </div>
        </div>
        <button type="button" class="delete-category-btn" aria-label="حذف القسم">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    const deleteBtn = categoryDiv.querySelector('.delete-category-btn');
    deleteBtn.addEventListener('click', () => {
        categoryDiv.remove();
        categories = categories.filter(c => c.id !== categoryId);
        updateEmptyState();
        showNotification("تم حذف القسم", "info");
    });
    
    categoriesList.appendChild(categoryDiv);
    updateEmptyState();
}

// ============================================
// تحديث حالة الأقسام الفارغة
// ============================================
function updateEmptyState() {
    if (categoriesList.children.length === 0) {
        emptyCategories.style.display = 'block';
    } else {
        emptyCategories.style.display = 'none';
    }
}

// ============================================
// جمع بيانات الأقسام
// ============================================
function collectCategories() {
    const categoryItems = categoriesList.querySelectorAll('.category-item');
    const collectedCategories = [];
    
    categoryItems.forEach(item => {
        const name = item.querySelector('.category-name').value.trim();
        
        if (name) {
            collectedCategories.push({
                id: item.dataset.categoryId,
                name
            });
        }
    });
    
    return collectedCategories;
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
            const storeName = document.getElementById('storeName').value.trim();
            const location = document.getElementById('storeLocation').value.trim();
            const phone = document.getElementById('storePhone').value.trim();
            
            if (!storeName || storeName.length < 3) {
                showNotification("يرجى إدخال اسم متجر صحيح (3 أحرف على الأقل)", "error");
                document.getElementById('storeName').focus();
                return false;
            }
            
            if (!location) {
                showNotification("يرجى إدخال المدينة/الحي", "error");
                document.getElementById('storeLocation').focus();
                return false;
            }
            
            if (!phone || phone.length < 10) {
                showNotification("يرجى إدخال رقم هاتف صحيح", "error");
                document.getElementById('storePhone').focus();
                return false;
            }
            return true;
            
        case 2:
            const selectedType = document.querySelector('input[name="storeType"]:checked');
            if (!selectedType) {
                showNotification("يرجى اختيار نوع المتجر", "error");
                return false;
            }
            return true;
            
        case 3:
            const currentCategories = collectCategories();
            if (currentCategories.length === 0) {
                showNotification("يرجى إضافة قسم تجاري واحد على الأقل", "error");
                return false;
            }
            return true;
            
        case 4:
            const deliveryOptions = document.querySelectorAll('input[name="deliveryOptions"]:checked');
            if (deliveryOptions.length === 0) {
                showNotification("يرجى اختيار خيار توصيل واحد على الأقل", "error");
                return false;
            }
            return true;
            
        case 5:
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
// حفظ البيانات في Firestore
// ============================================
async function saveStoreData() {
    if (!currentUser) {
        showNotification("الجلسة غير صالحة", "error");
        return false;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري الحفظ...</span>';
    
    try {
        const storeName = sanitizeText(document.getElementById('storeName').value.trim());
        const location = sanitizeText(document.getElementById('storeLocation').value.trim());
        const phone = sanitizePhone(document.getElementById('storePhone').value.trim());
        const email = sanitizeEmail(document.getElementById('storeEmail').value.trim());
        const storeType = document.querySelector('input[name="storeType"]:checked').value;
        const openTime = document.getElementById('openTime').value;
        const closeTime = document.getElementById('closeTime').value;
        const categories = collectCategories();
        
        const deliveryOptions = Array.from(document.querySelectorAll('input[name="deliveryOptions"]:checked'))
            .map(cb => cb.value);
        const paymentMethods = Array.from(document.querySelectorAll('input[name="paymentMethods"]:checked'))
            .map(cb => cb.value);
        
        await setDoc(doc(db, "stores", currentUser.uid), {
            storeName,
            location,
            phone,
            email,
            storeType,
            categories,
            deliveryOptions,
            paymentMethods,
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
        
        await updateDoc(doc(db, "users", currentUser.uid), {
            onboardingStatus: "basic_done",
            updatedAt: new Date()
        });
        
        showNotification("تم حفظ بيانات المتجر بنجاح! 🎉", "success");
        
        sessionStorage.setItem('storeSetupCompleted', 'true');
        sessionStorage.setItem('lastActivePage', 'add-store');
        
        setTimeout(() => {
            window.location.href = resolvePath('SETUP_STORE');
        }, 1500);
        
        return true;
    } catch (error) {
        console.error("خطأ في حفظ بيانات المتجر:", error);
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
        storeName: document.getElementById('storeName').value,
        location: document.getElementById('storeLocation').value,
        phone: document.getElementById('storePhone').value,
        email: document.getElementById('storeEmail').value,
        storeType: document.querySelector('input[name="storeType"]:checked')?.value,
        deliveryOptions: Array.from(document.querySelectorAll('input[name="deliveryOptions"]:checked')).map(cb => cb.value),
        paymentMethods: Array.from(document.querySelectorAll('input[name="paymentMethods"]:checked')).map(cb => cb.value),
        openTime: document.getElementById('openTime').value,
        closeTime: document.getElementById('closeTime').value,
        selectedDays,
        categories: collectCategories(),
        currentStep
    };
    
    sessionStorage.setItem('storeDraft', JSON.stringify(formData));
}

// ============================================
// استعادة البيانات المحفوظة
// ============================================
function restoreDraft() {
    const draft = sessionStorage.getItem('storeDraft');
    if (!draft) return;
    
    try {
        const formData = JSON.parse(draft);
        
        document.getElementById('storeName').value = formData.storeName || '';
        document.getElementById('storeLocation').value = formData.location || '';
        document.getElementById('storePhone').value = formData.phone || '';
        document.getElementById('storeEmail').value = formData.email || '';
        
        if (formData.storeType) {
            const typeRadio = document.querySelector(`input[name="storeType"][value="${formData.storeType}"]`);
            if (typeRadio) typeRadio.checked = true;
        }
        
        if (formData.deliveryOptions) {
            formData.deliveryOptions.forEach(opt => {
                const checkbox = document.querySelector(`input[name="deliveryOptions"][value="${opt}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        if (formData.paymentMethods) {
            formData.paymentMethods.forEach(method => {
                const checkbox = document.querySelector(`input[name="paymentMethods"][value="${method}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        document.getElementById('openTime').value = formData.openTime || '09:00';
        document.getElementById('closeTime').value = formData.closeTime || '21:00';
        
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
        
        if (formData.categories && formData.categories.length > 0) {
            categoriesList.innerHTML = '';
            formData.categories.forEach(category => {
                addCategoryField();
                const lastCategory = categoriesList.lastElementChild;
                if (lastCategory) {
                    lastCategory.querySelector('.category-name').value = category.name;
                }
            });
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
        await setDoc(doc(db, "stores", currentUser.uid), {
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

addCategoryBtn.addEventListener('click', () => {
    addCategoryField();
});

backBtn.addEventListener('click', () => {
    window.history.back();
});

cancelBtn.addEventListener('click', cancelAndDeleteAccount);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validateCurrentStep()) {
        await saveStoreData();
    }
});

// ============================================
// حماية من فقدان الجلسة
// ============================================
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        sessionStorage.setItem('lastActivePage', 'add-store');
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());
        saveDraft();
    }
});

