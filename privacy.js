import { PATHS, resolvePath } from 'shared/utils/paths.js';
import { showNotification } from 'shared/js/notifications.js';

// ============================================
// 1. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة سياسة الخصوصية تم تحميلها بنجاح');
    
    // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
});

// ============================================
// 2. تتبع النقرات على الروابط (اختياري)
// ============================================
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        // يمكن إضافة تتبع التحليلات هنا
        console.log('تم النقر على:', link.href);
    });
});

