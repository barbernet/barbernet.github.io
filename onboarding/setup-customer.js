/**
 * BarberFlow Pro - صفحة تخصيص تفضيلات الزبون (Wizard)
 * المسار: onboarding/setup-customer.js
 * المميزات:
 * - تقسيم إلى 4 مراحل
 * - حفظ تلقائي للبيانات
 * - ملخص ديناميكي في المرحلة الأخيرة
 */

import { auth, db } from "../core/firebase-init.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentStep = 1;
const totalSteps = 4;
let currentUser = null;

// ============================================
// عناصر DOM
// ============================================
const form = document.getElementById('setupCustomerForm');
const steps = document.querySelectorAll('.wizard-step');
const stepperSteps = document.querySelectorAll('.step');
const progressBar = document.getElementById('progressBar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const backBtn = document.getElementById('backBtn');
const skipBtn = document.getElementById('skipBtn');

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
    
    // تحديث الملخص إذا كنا في المرحلة الأخيرة
    if (currentStep === 4) {
        updateSummary();
    }
    
    // التمرير إلى الأعلى
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// التحقق من صحة المرحلة الحالية
// ============================================
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            const interests = document.querySelectorAll('input[name="interests"]:checked');
            if (interests.length === 0) {
                showNotification("يرجى اختيار اهتمام واحد على الأقل", "error");
                return false;
            }
            return true;
            
        case 2:
            const services = document.querySelectorAll('input[name="services"]:checked');
            if (services.length === 0) {
                showNotification("يرجى اختيار خدمة واحدة على الأقل", "error");
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
// تحديث الملخص في المرحلة الأخيرة
// ============================================
function updateSummary() {
    // ملخص الاهتمامات
    const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
        .map(cb => {
            const card = cb.closest('.interest-card');
            return card ? card.querySelector('span').textContent : '';
        });
    
    const interestsSummary = document.getElementById('interestsSummary');
    if (interestsSummary) {
        if (interests.length > 0) {
            interestsSummary.innerHTML = interests.map(i => 
                `<span class="summary-tag">${i}</span>`
            ).join('');
        } else {
            interestsSummary.innerHTML = '<p class="empty-summary">لم تختر أي اهتمامات بعد</p>';
        }
    }
    
    // ملخص الخدمات
    const services = Array.from(document.querySelectorAll('input[name="services"]:checked'))
        .map(cb => {
            const card = cb.closest('.service-card');
            return card ? card.querySelector('span').textContent : '';
        });
    
    const servicesSummary = document.getElementById('servicesSummary');
    if (servicesSummary) {
        if (services.length > 0) {
            servicesSummary.innerHTML = services.map(s => 
                `<span class="summary-tag">${s}</span>`
            ).join('');
        } else {
            servicesSummary.innerHTML = '<p class="empty-summary">لم تختر أي خدمات بعد</p>';
        }
    }
    
    // ملخص الإشعارات
    const notifications = Array.from(document.querySelectorAll('input[name="notifications"]:checked'))
        .map(cb => {
            const item = cb.closest('.notification-item');
            return item ? item.querySelector('.notification-title').textContent : '';
        });
    
    const notificationsSummary = document.getElementById('notificationsSummary');
    if (notificationsSummary) {
        if (notifications.length > 0) {
            notificationsSummary.innerHTML = notifications.map(n => 
                `<span class="summary-tag">${n}</span>`
            ).join('');
        } else {
            notificationsSummary.innerHTML = '<p class="empty-summary">لم تختر أي إشعارات بعد</p>';
        }
    }
}

// ============================================
// حفظ التفضيلات في Firestore
// ============================================
async function savePreferences() {
    if (!currentUser) {
        showNotification("الجلسة غير صالحة", "error");
        return false;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري الحفظ...</span>';
    
    try {
        // جمع الاهتمامات
        const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
            .map(cb => cb.value);
        
        // جمع الخدمات
        const services = Array.from(document.querySelectorAll('input[name="services"]:checked'))
            .map(cb => cb.value);
        
        // جمع الإشعارات
        const notifications = Array.from(document.querySelectorAll('input[name="notifications"]:checked'))
            .map(cb => cb.value);
        
        // حفظ التفضيلات
        await updateDoc(doc(db, "customers", currentUser.uid), {
            interests: interests,
            preferredServices: services,
            notificationPreferences: notifications,
            onboardingStatus: "completed",
            updatedAt: new Date()
        });
        
        await updateDoc(doc(db, "users", currentUser.uid), {
            onboardingStatus: "completed",
            status: "active",
            updatedAt: new Date()
        });
        
        showNotification("تم حفظ تفضيلاتك بنجاح! 🎉", "success");
        
        // مسح البيانات المؤقتة
        sessionStorage.removeItem('customerPreferencesDraft');
        
        setTimeout(() => {
            window.location.href = resolvePath('INDEX');
        }, 1500);
        
        return true;
    } catch (error) {
        console.error("خطأ في حفظ التفضيلات:", error);
        showNotification("حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>بدء الاستكشاف</span> <i class="fas fa-rocket"></i>';
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
                onboardingStatus: "completed",
                status: "active",
                updatedAt: new Date()
            });
            
            showNotification("تم تخطي التخصيص، يمكنك تعديله لاحقاً من الإعدادات", "info");
            
            setTimeout(() => {
                window.location.href = resolvePath('INDEX');
            }, 1000);
        } catch (error) {
            console.error("خطأ في التخطي:", error);
            showNotification("حدث خطأ أثناء التخطي", "error");
            skipBtn.disabled = false;
            skipBtn.innerHTML = '<span>تخطي والتصفح مباشرة</span> <i class="fas fa-forward"></i>';
        }
    };
}

// ============================================
// إرسال النموذج
// ============================================
if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        await savePreferences();
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

// ============================================
// حفظ تلقائي (Draft)
// ============================================
function saveDraft() {
    const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
        .map(cb => cb.value);
    const services = Array.from(document.querySelectorAll('input[name="services"]:checked'))
        .map(cb => cb.value);
    const notifications = Array.from(document.querySelectorAll('input[name="notifications"]:checked'))
        .map(cb => cb.value);
    
    const formData = { interests, services, notifications, currentStep };
    sessionStorage.setItem('customerPreferencesDraft', JSON.stringify(formData));
}

// ============================================
// استعادة البيانات المحفوظة
// ============================================
function restoreDraft() {
    const draft = sessionStorage.getItem('customerPreferencesDraft');
    if (!draft) return;
    
    try {
        const formData = JSON.parse(draft);
        
        if (formData.interests) {
            formData.interests.forEach(value => {
                const checkbox = document.querySelector(`input[name="interests"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        if (formData.services) {
            formData.services.forEach(value => {
                const checkbox = document.querySelector(`input[name="services"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        if (formData.notifications) {
            formData.notifications.forEach(value => {
                const checkbox = document.querySelector(`input[name="notifications"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        if (formData.currentStep && formData.currentStep > 1) {
            currentStep = 1;
            for (let i = 2; i <= formData.currentStep; i++) {
                goToStep(i);
            }
        }
        
        showNotification("تم استعادة التفضيلات المحفوظة", "info");
    } catch (error) {
        console.error("خطأ في استعادة البيانات:", error);
    }
}

// ============================================
// حفظ تلقائي عند التغيير
// ============================================
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', saveDraft);
});

// ============================================
// حماية من فقدان الجلسة
// ============================================
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        sessionStorage.setItem('lastActivePage', 'setup-customer');
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());
        saveDraft();
    }
});

