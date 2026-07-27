/**
 * BarberFlow Pro - Contact Page Logic
 * المسار: contact.js
 * الدور: إدارة منطق صفحة اتصل بنا
 */

import { showNotification } from './shared/utils/notifications.js';
import { resolvePath } from './shared/utils/paths.js';

// ============================================
// 1. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة اتصل بنا تم تحميلها بنجاح');
    
    initFAQ();
    initTicketForm();
    updateDynamicLinks();
});

// ============================================
// 2. FAQ Accordion
// ============================================
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;
        
        question.addEventListener('click', () => {
            // إغلاق العناصر الأخرى
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // تبديل العنصر الحالي
            item.classList.toggle('active');
        });
    });
}

// ============================================
// 3. Ticket Form Submission
// ============================================
function initTicketForm() {
    const form = document.getElementById('ticketForm');
    const submitBtn = document.getElementById('submitTicketBtn');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // جمع البيانات
        const ticketData = {
            name: document.getElementById('ticketName').value.trim(),
            email: document.getElementById('ticketEmail').value.trim(),
            phone: document.getElementById('ticketPhone').value.trim(),
            category: document.getElementById('ticketCategory').value,
            subject: document.getElementById('ticketSubject').value.trim(),
            message: document.getElementById('ticketMessage').value.trim(),
            createdAt: new Date(),
            status: 'pending'
        };
        
        // التحقق من البيانات
        if (!ticketData.name || !ticketData.email || !ticketData.category || !ticketData.subject || !ticketData.message) {
            showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        // تعطيل الزر
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري الإرسال...</span>';
        
        try {
            // محاكاة إرسال التذكرة (يمكن ربطها بـ Supabase لاحقاً)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // حفظ التذكرة في localStorage كـ backup
            const tickets = JSON.parse(localStorage.getItem('bf-support-tickets') || '[]');
            tickets.push({
                ...ticketData,
                id: 'TKT-' + Date.now(),
                createdAt: ticketData.createdAt.toISOString()
            });
            localStorage.setItem('bf-support-tickets', JSON.stringify(tickets));
            
            showNotification('تم إرسال تذكرتك بنجاح! سنرد عليك خلال 24 ساعة', 'success');
            
            // إعادة تعيين النموذج
            form.reset();
        } catch (error) {
            console.error('Error submitting ticket:', error);
            showNotification('حدث خطأ أثناء إرسال التذكرة، يرجى المحاولة مرة أخرى', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>إرسال التذكرة السحابية</span>';
        }
    });
}

// ============================================
// 4. تحديث الروابط الديناميكية
// ============================================
function updateDynamicLinks() {
    const links = document.querySelectorAll('[data-path]');
    links.forEach(link => {
        const key = link.getAttribute('data-path');
        const fullPath = resolvePath(key);
        link.setAttribute('href', fullPath);
    });
}

