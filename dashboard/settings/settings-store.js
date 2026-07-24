import { PATHS, resolvePath } from '../shared/utils/paths.js';

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
// 4. معالجة نموذج إعدادات المتجر
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // تحميل بيانات المتجر الحالية (محاكاة)
    const storeNameInput = document.getElementById('storeName');
    const shippingPolicyInput = document.getElementById('shippingPolicy');
    
    if (storeNameInput) storeNameInput.value = 'متجر BarberFlow';
    if (shippingPolicyInput) {
        shippingPolicyInput.value = 'الشحن مجاني للطلبات فوق 200 ر.س\nمدة التوصيل: 3-5 أيام عمل\nالإرجاع مجاني خلال 14 يوم';
    }
    
    // تحديد طرق الدفع الافتراضية
    const paymentCheckboxes = document.querySelectorAll('.payment-option input[type="checkbox"]');
    paymentCheckboxes.forEach(checkbox => {
        if (checkbox.value === 'credit_card' || checkbox.value === 'cod') {
            checkbox.checked = true;
        }
    });
    
    // تحديث اسم المستخدم
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = 'مدير المتجر';
    }
    
    // معالجة النموذج
    const storeForm = document.getElementById('storeSettingsForm');
    if (storeForm) {
        storeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = {
                storeName: storeNameInput.value,
                shippingPolicy: shippingPolicyInput.value,
                paymentMethods: collectPaymentMethods()
            };
            
            console.log('حفظ إعدادات المتجر:', formData);
            showNotification('تم حفظ إعدادات المتجر بنجاح!', 'success');
        });
    }
});

// ============================================
// 5. جمع طرق الدفع المختارة
// ============================================
function collectPaymentMethods() {
    const checkboxes = document.querySelectorAll('.payment-option input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// ============================================
// 6. زر تسجيل الخروج
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
// 7. دالة مساعدة للإشعارات
// ============================================
function showNotification(message, type = 'info') {
    alert(message);
}

