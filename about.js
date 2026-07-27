/**
 * BarberFlow Pro - About Page Logic
 * المسار: about.js
 * الدور: إدارة منطق صفحة من نحن
 */

import { resolvePath } from './shared/utils/paths.js';

// ============================================
// عداد الإحصائيات المتحرك
// ============================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const stepDuration = duration / steps;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            // تنسيق الأرقام الكبيرة
            if (target >= 1000) {
                counter.textContent = Math.floor(current).toLocaleString('ar-MA') + '+';
            } else {
                counter.textContent = Math.floor(current) + '+';
            }
        }, stepDuration);
    });
}

// ============================================
// تشغيل العداد عند ظهور القسم
// ============================================
function initCounters() {
    const statsSection = document.querySelector('.stats-section');
    if (!statsSection) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });
    
    observer.observe(statsSection);
}

// ============================================
// تحديث الروابط الديناميكية
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
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة من نحن تم تحميلها بنجاح');
    
    initCounters();
    updateDynamicLinks();
});

