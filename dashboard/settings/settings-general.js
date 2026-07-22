import { PATHS, resolvePath } from '../shared/js/paths.js';

// ============================================
// 1. إدارة الشريط الجانبي (Sidebar Toggle)
// ============================================
const menuToggleBtn = document.getElementById('menuToggle');
const closeSidebarBtn = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');

if (menuToggleBtn && sidebar) {
    menuToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });
}

if (closeSidebarBtn && sidebar) {
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
}

// ============================================
// 2. توجيه الروابط ديناميكياً
// ============================================
const navLinks = document.querySelectorAll('.sidebar-nav a[data-path]');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pathKey = link.getAttribute('data-path');
        const targetUrl = resolvePath(pathKey);
        
        link.style.opacity = '0.7';
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 150);
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
// 4. معالجة نموذج الإعدادات العامة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // تحميل بيانات المستخدم الحالية (محاكاة)
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    if (fullNameInput) fullNameInput.value = 'أحمد محمد';
    if (emailInput) emailInput.value = 'ahmed@example.com';
    if (phoneInput) phoneInput.value = '+966501234567';
    
    // تحديث اسم المستخدم في الشريط العلوي
    const userNameElement = document.getElementById('userName');
    if (userNameElement && fullNameInput) {
        userNameElement.textContent = fullNameInput.value;
    }
    
    // معالجة نموذج المعلومات الشخصية
    const generalForm = document.getElementById('generalSettingsForm');
    if (generalForm) {
        generalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = {
                fullName: fullNameInput.value,
                email: emailInput.value,
                phone: phoneInput.value
            };
            
            console.log('حفظ البيانات الشخصية:', formData);
            
            // هنا سيتم إضافة منطق Firebase لحفظ البيانات
            showNotification('تم حفظ الإعدادات العامة بنجاح!', 'success');
        });
    }
    
    // معالجة نموذج الأمان
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            
            if (!currentPassword || !newPassword) {
                showNotification('يرجى ملء جميع الحقول', 'error');
                return;
            }
            
            if (newPassword.length < 8) {
                showNotification('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
                return;
            }
            
            console.log('تحديث كلمة المرور');
            showNotification('تم تحديث كلمة المرور بنجاح!', 'success');
            
            // تفريغ الحقول
            securityForm.reset();
        });
    }
});

// ============================================
// 5. زر تسجيل الخروج
// ============================================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            console.log('جاري تسجيل الخروج...');
            // هنا سيتم استدعاء دالة تسجيل الخروج من Firebase
            window.location.href = resolvePath('INDEX');
        }
    });
}

// ============================================
// 6. دالة مساعدة لعرض الإشعارات
// ============================================
function showNotification(message, type = 'info') {
    // يمكن ربطها بنظام الإشعارات في shared/js/notifications.js
    alert(message);
}

