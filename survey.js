/**
 * BarberFlow Pro - Survey Page Logic
 * المسار: support/js/survey.js
 */

import { showNotification } from "shared/js/notifications.js";

// ============================================
// Rating Stars
// ============================================
function initRatingStars() {
    const ratingContainers = document.querySelectorAll('.rating-container');
    
    ratingContainers.forEach(container => {
        const stars = container.querySelectorAll('.rating-star');
        const questionName = container.getAttribute('data-question');
        const hiddenInput = document.getElementById(questionName);
        
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = star.getAttribute('data-value');
                
                // تحديث النجوم
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-value')) <= parseInt(value)) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
                
                // تحديث الحقل المخفي
                if (hiddenInput) {
                    hiddenInput.value = value;
                }
                
                // تحديث شريط التقدم
                updateProgress();
            });
            
            // تأثير hover
            star.addEventListener('mouseenter', () => {
                const value = star.getAttribute('data-value');
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-value')) <= parseInt(value)) {
                        s.style.color = 'var(--brand-accent)';
                    } else {
                        s.style.color = 'var(--border-color)';
                    }
                });
            });
            
            star.addEventListener('mouseleave', () => {
                stars.forEach(s => {
                    if (s.classList.contains('active')) {
                        s.style.color = 'var(--brand-accent)';
                    } else {
                        s.style.color = 'var(--border-color)';
                    }
                });
            });
        });
    });
}

// ============================================
// Option Selection
// ============================================
function initOptionSelection() {
    const optionItems = document.querySelectorAll('.option-item');
    
    optionItems.forEach(item => {
        const input = item.querySelector('input');
        
        item.addEventListener('click', (e) => {
            // منع التكرار عند النقر على الـ input مباشرة
            if (e.target === input) return;
            
            input.checked = !input.checked;
            
            if (input.type === 'radio') {
                // إزالة التحديد من الخيارات الأخرى في نفس المجموعة
                const name = input.getAttribute('name');
                document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
                    radio.closest('.option-item').classList.remove('selected');
                });
                item.classList.add('selected');
            } else {
                // Checkbox
                item.classList.toggle('selected', input.checked);
            }
            
            updateProgress();
        });
        
        // تحديث عند تغيير الـ input مباشرة
        input.addEventListener('change', () => {
            if (input.type === 'radio') {
                const name = input.getAttribute('name');
                document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
                    radio.closest('.option-item').classList.remove('selected');
                });
                if (input.checked) {
                    item.classList.add('selected');
                }
            } else {
                item.classList.toggle('selected', input.checked);
            }
            updateProgress();
        });
    });
}

// ============================================
// Progress Bar
// ============================================
function updateProgress() {
    const totalQuestions = 6;
    let answeredQuestions = 0;
    
    // Q1 & Q2 (Rating)
    if (document.getElementById('q1').value) answeredQuestions++;
    if (document.getElementById('q2').value) answeredQuestions++;
    
    // Q3 & Q4 (Radio)
    if (document.querySelector('input[name="q3"]:checked')) answeredQuestions++;
    if (document.querySelector('input[name="q4"]:checked')) answeredQuestions++;
    
    // Q5 (Checkbox) - اختياري
    // Q6 (Textarea) - اختياري
    
    const percent = Math.round((answeredQuestions / totalQuestions) * 100);
    
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    
    if (progressFill) progressFill.style.width = percent + '%';
    if (progressPercent) progressPercent.textContent = percent + '%';
}

// ============================================
// Form Submission
// ============================================
function initSurveyForm() {
    const form = document.getElementById('surveyForm');
    const submitBtn = document.getElementById('submitSurveyBtn');
    const successMessage = document.getElementById('surveySuccess');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // جمع البيانات
        const surveyData = {
            q1: document.getElementById('q1').value,
            q2: document.getElementById('q2').value,
            q3: document.querySelector('input[name="q3"]:checked')?.value || '',
            q4: document.querySelector('input[name="q4"]:checked')?.value || '',
            q5: Array.from(document.querySelectorAll('input[name="q5"]:checked')).map(cb => cb.value),
            q6: document.getElementById('q6').value.trim(),
            submittedAt: new Date().toISOString()
        };
        
        // التحقق من الحقول المطلوبة
        if (!surveyData.q1 || !surveyData.q2 || !surveyData.q3 || !surveyData.q4) {
            showNotification('يرجى الإجابة على جميع الأسئلة المطلوبة', 'error');
            return;
        }
        
        // تعطيل الزر
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري الإرسال...</span>';
        
        try {
            // محاكاة الإرسال
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // حفظ في localStorage
            const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
            surveys.push({
                ...surveyData,
                id: 'SRV-' + Date.now()
            });
            localStorage.setItem('surveys', JSON.stringify(surveys));
            
            // إظهار رسالة النجاح
            form.style.display = 'none';
            document.querySelector('.survey-progress').style.display = 'none';
            successMessage.classList.add('show');
            
            showNotification('تم إرسال استطلاعك بنجاح! شكراً لمساهمتك', 'success');
            
        } catch (error) {
            console.error('Error submitting survey:', error);
            showNotification('حدث خطأ أثناء إرسال الاستطلاع، يرجى المحاولة مرة أخرى', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>إرسال وتأكيد البيانات</span>';
        }
    });
}

// ============================================
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initRatingStars();
    initOptionSelection();
    initSurveyForm();
    updateProgress();
});

