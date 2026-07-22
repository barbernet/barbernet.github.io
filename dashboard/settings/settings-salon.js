import { PATHS, resolvePath } from '../shared/js/paths.js';

// ============================================
// 1. إدارة الشريط الجانبي
// ============================================
const menuToggleBtn = document.getElementById('menuToggle');
const closeSidebarBtn = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');

if (menuToggleBtn && sidebar) {
    menuToggleBtn.addEventListener('click', () => sidebar.classList.add('open'));
}

if (closeSidebarBtn && sidebar) {
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));
}

// ============================================
// 2. توجيه الروابط
// ============================================
const navLinks = document.querySelectorAll('.sidebar-nav a[data-path]');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pathKey = link.getAttribute('data-path');
        window.location.href = resolvePath(pathKey);
    });
});

// ============================================
// 3. تمييز الصفحة النشطة
// ============================================
const currentPath = window.location.pathname.split('/').pop();
navLinks.forEach(link => {
    const linkPath = link.getAttribute('data-path');
    if (PATHS[linkPath] && PATHS[linkPath].includes(currentPath)) {
        link.classList.add('active');
    }
});

// ============================================
// 4. معالجة نموذج إعدادات الصالون
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // تحميل بيانات الصالون الحالية (محاكاة)
    const salonNameInput = document.getElementById('salonName');
    const salonAddressInput = document.getElementById('salonAddress');
    const salonPhoneInput = document.getElementById('salonPhone');
    
    if (salonNameInput) salonNameInput.value = 'صالون الأناقة';
    if (salonAddressInput) salonAddressInput.value = 'الرياض، حي العليا، شارع الملك فهد';
    if (salonPhoneInput) salonPhoneInput.value = '+966112345678';
    
    // تحديث اسم المستخدم في الشريط العلوي
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = 'مدير الصالون';
    }
    
    // معالجة النموذج
    const salonForm = document.getElementById('salonSettingsForm');
    if (salonForm) {
        salonForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = {
                salonName: salonNameInput.value,
                salonAddress: salonAddressInput.value,
                salonPhone: salonPhoneInput.value,
                workingHours: collectWorkingHours()
            };
            
            console.log('حفظ إعدادات الصالون:', formData);
            showNotification('تم حفظ إعدادات الصالون بنجاح!', 'success');
        });
    }
});

// ============================================
// 5. جمع بيانات أوقات العمل
// ============================================
function collectWorkingHours() {
    const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const workingHours = {};
    
    days.forEach(day => {
        const isOpen = document.getElementById(`${day}-open`);
        const fromTime = document.getElementById(`${day}-from`);
        const toTime = document.getElementById(`${day}-to`);
        
        if (isOpen && fromTime && toTime) {
            workingHours[day] = {
                isOpen: isOpen.checked,
                from: fromTime.value,
                to: toTime.value
            };
        }
    });
    
    return workingHours;
}

// ============================================
// 6. إدارة حالة الأيام (مفتوح/مغلق)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const dayCheckboxes = document.querySelectorAll('.day-card input[type="checkbox"]');
    
    dayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const dayCard = e.target.closest('.day-card');
            const timeInputs = dayCard.querySelectorAll('input[type="time"]');
            
            if (e.target.checked) {
                dayCard.classList.remove('closed');
                timeInputs.forEach(input => input.disabled = false);
            } else {
                dayCard.classList.add('closed');
                timeInputs.forEach(input => input.disabled = true);
            }
        });
    });
});

// ============================================
// 7. زر تسجيل الخروج
// ============================================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            window.location.href = resolvePath('INDEX');
        }
    });
}

// ============================================
// 8. دالة مساعدة للإشعارات
// ============================================
function showNotification(message, type = 'info') {
    alert(message);
}

