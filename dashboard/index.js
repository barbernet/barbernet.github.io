import { PATHS, resolvePath } from '../shared/utils/paths.js';

// --- 1. إدارة الشريط الجانبي (Mobile Toggle) ---
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

// --- 2. توجيه الروابط ديناميكياً بناءً على paths.js ---
const navLinks = document.querySelectorAll('.sidebar-nav a[data-path]');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pathKey = link.getAttribute('data-path');
        const targetUrl = resolvePath(pathKey);
        
        // إضافة تأثير بصري بسيط قبل الانتقال
        link.style.opacity = '0.7';
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 150);
    });
});

// --- 3. تمييز الصفحة الحالية في القائمة (Active State) ---
const currentPath = window.location.pathname.split('/').pop(); // الحصول على اسم الملف الحالي
navLinks.forEach(link => {
    const linkPath = link.getAttribute('data-path');
    // مقارنة بسيطة للتأكد من أن الرابط يتطابق مع الصفحة الحالية
    if (PATHS[linkPath] && PATHS[linkPath].includes(currentPath)) {
        link.classList.add('active');
        // تحديث عنوان الصفحة في الشريط العلوي
        const topbarTitle = document.querySelector('.topbar h1');
        if (topbarTitle) {
            topbarTitle.textContent = link.textContent.trim();
        }
    }
});

// --- 4. محاكاة تحميل بيانات المستخدم (يمكن ربطها بـ Firebase لاحقاً) ---
document.addEventListener('DOMContentLoaded', () => {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        // هنا سيتم استبدال هذا النص بالبيانات الحقيقية من المصادقة
        userNameElement.textContent = 'مدير النظام'; 
    }
});

// --- 5. زر تسجيل الخروج ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // هنا يتم استدعاء دالة تسجيل الخروج من Firebase أو Auth Middleware
        console.log('جاري تسجيل الخروج...');
        window.location.href = resolvePath('INDEX');
    });
}

