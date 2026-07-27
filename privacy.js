/**
 * BarberFlow Pro - صفحة سياسة الخصوصية
 * المسار: privacy.js
 * الدور: إدارة منطق صفحة سياسة الخصوصية
 * ✅ صفحة عامة - لا تحتاج حماية
 */

import { resolvePath } from './shared/utils/paths.js';

// ============================================
// 1. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة سياسة الخصوصية تم تحميلها بنجاح');
    
    // تحديث جميع الروابط الديناميكية
    updateDynamicLinks();
    
    // إضافة تأثيرات التفاعل
    setupInteractions();
});

// ============================================
// 2. تحديث الروابط الديناميكية
// ============================================
function updateDynamicLinks() {
    const links = document.querySelectorAll('[data-path]');
    links.forEach(link => {
        const key = link.getAttribute('data-path');
        const fullPath = resolvePath(key);
        link.setAttribute('href', fullPath);
    });
}

// ============================================
// 3. إعداد التفاعلات
// ============================================
function setupInteractions() {
    // تتبع النقرات على الروابط (اختياري)
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            console.log('تم النقر على:', link.href);
        });
    });
    
    // إضافة أنيميشن عند التمرير
    setupScrollAnimations();
}

// ============================================
// 4. أنيميشن التمرير
// ============================================
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // مراقبة الأقسام القانونية
    document.querySelectorAll('.legal-section').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ============================================
// 5. تصدير الدوال (اختياري)
// ============================================
export {
    updateDynamicLinks,
    setupInteractions,
    setupScrollAnimations
};

