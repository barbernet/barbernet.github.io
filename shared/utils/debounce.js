/**
 * BarberFlow Pro - حماية من النقرات المتكررة
 * المسار: shared/utils/debounce.js
 */

/**
 * منع تنفيذ الدالة أكثر من مرة خلال فترة زمنية محددة
 * مفيد لأزرار البحث والإدخال المتكرر
 * 
 * @param {Function} func - الدالة المراد تأخير تنفيذها
 * @param {number} delay - الوقت بالمللي ثانية (افتراضي: 300)
 * @returns {Function} دالة مؤجلة
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * منع النقر المتكرر على الأزرار (Throttle)
 * تنفيذ الدالة مرة واحدة فقط خلال فترة محددة
 * 
 * @param {Function} func - الدالة المراد تنفيذها
 * @param {number} limit - الحد الأدنى بين التنفيذات بالمللي ثانية (افتراضي: 1000)
 * @returns {Function} دالة محدودة
 */
export function throttle(func, limit = 1000) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * حماية زر من النقر المتكرر
 * يعطل الزر مؤقتاً بعد النقر الأول
 * 
 * @param {HTMLElement} button - عنصر الزر
 * @param {Function} callback - الدالة المراد تنفيذها عند النقر
 * @param {number} delay - وقت التعطيل بالمللي ثانية (افتراضي: 2000)
 */
export function protectButton(button, callback, delay = 2000) {
    if (!button) {
        console.error('❌ الزر غير موجود');
        return;
    }

    button.addEventListener('click', function(e) {
        // منع النقر المتكرر
        if (button.disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        // تعطيل الزر
        button.disabled = true;
        const originalText = button.innerHTML;
        const originalClasses = button.className;
        
        // إضافة تأثير التحميل
        button.classList.add('btn-loading');
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
        
        // تنفيذ الدالة
        try {
            callback(e);
        } catch (error) {
            console.error('خطأ في تنفيذ الدالة:', error);
            // إعادة الزر لحالته الأصلية في حالة الخطأ
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = originalText;
                button.className = originalClasses;
                button.classList.remove('btn-loading');
            }, 1000);
        }
        
        // إعادة تفعيل الزر بعد الفترة المحددة
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalText;
            button.className = originalClasses;
            button.classList.remove('btn-loading');
        }, delay);
    });
}

/**
 * منع النقر المزدوج على الروابط
 * 
 * @param {HTMLElement} link - عنصر الرابط
 * @param {number} delay - الوقت بالمللي ثانية (افتراضي: 1000)
 */
export function protectLink(link, delay = 1000) {
    if (!link) return;
    
    link.addEventListener('click', function(e) {
        if (link.classList.contains('clicked')) {
            e.preventDefault();
            return;
        }
        
        link.classList.add('clicked');
        setTimeout(() => link.classList.remove('clicked'), delay);
    });
}

/**
 * حماية نموذج من الإرسال المتكرر
 * 
 * @param {HTMLFormElement} form - عنصر النموذج
 * @param {Function} onSubmit - دالة الإرسال
 */
export function protectForm(form, onSubmit) {
    if (!form) {
        console.error('❌ النموذج غير موجود');
        return;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // منع الإرسال المتكرر
        if (form.classList.contains('submitting')) {
            return;
        }
        
        form.classList.add('submitting');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
        }
        
        try {
            await onSubmit(e);
        } catch (error) {
            console.error('خطأ في إرسال النموذج:', error);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            form.classList.remove('submitting');
        }
    });
}

