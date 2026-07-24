import { PATHS, resolvePath } from 'shared/utils/paths.js';

// ============================================
// 1. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة الخطأ 404 تم تحميلها بنجاح');
    
    // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
});

// ============================================
// 2. تتبع النقرات (اختياري)
// ============================================
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        // يمكن إضافة تتبع التحليلات هنا
        console.log('تم النقر على:', link.href);
    });
});

