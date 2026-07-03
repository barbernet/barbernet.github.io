/**
 * BarberFlow Pro - About Page Logic
 * المسار: support/js/about.js
 */

import { showNotification } from "../../auth/js/notifications.js";

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
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initCounters();
    
    // رسالة ترحيبية خفيفة
    console.log('✅ About page loaded successfully');
});

