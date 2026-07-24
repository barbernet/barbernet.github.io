/**
نظام التنبيهات الموحد لـ BarberFlow-Pro
المسار: shared/utils/notifications.js
*/

/**
عرض تنبيه جديد
@param {string} message - نص الرسالة
@param {string} type - نوع التنبيه (success, error, info, warning)
@param {number} duration - مدة الظهور بالمللي ثانية
*/
export function showNotification(message, type = "success", duration = 4000) {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error("❌ حاوية التنبيهات غير موجودة في HTML");
        return;
    }
    
    // إنشاء عنصر التنبيه
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // اختيار الأيقونة حسب النوع
    const icons = {
        success: "fa-check-circle",
        error: "fa-exclamation-circle",
        info: "fa-info-circle",
        warning: "fa-exclamation-triangle"
    };
    const icon = icons[type] || icons.success;
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="notification-close" aria-label="إغلاق">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // زر الإغلاق اليدوي
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.onclick = () => dismissNotification(notification);
    }
    
    // الإخفاء التلقائي
    if (duration > 0) {
        setTimeout(() => {
            dismissNotification(notification);
        }, duration);
    }
    
    // دعم السحب (Swipe) - جديد
    enableSwipeToDismiss(notification);
}

/**
إخفاء التنبيه
@param {HTMLElement} notification
*/
function dismissNotification(notification) {
    if (notification.classList.contains('fade-out')) return;
    notification.classList.add('fade-out');
    notification.addEventListener('animationend', () => {
        notification.remove();
    });
}

/**
تمكين السحب لإغلاق التنبيه - جديد
@param {HTMLElement} notification
*/
function enableSwipeToDismiss(notification) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    const handleStart = (e) => {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        notification.classList.add('dragging');
    };
    
    const handleMove = (e) => {
        if (!isDragging) return;
        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const diff = currentX - startX;
        notification.style.transform = `translateX(${diff}px)`;
    };
    
    const handleEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        notification.classList.remove('dragging');
        
        const diff = currentX - startX;
        const threshold = 100;
        
        if (Math.abs(diff) > threshold) {
            // سحب كافٍ للإغلاق
            if (diff > 0) {
                notification.classList.add('swipe-right');
            } else {
                notification.classList.add('swipe-left');
            }
            setTimeout(() => notification.remove(), 300);
        } else {
            // إعادة للموضع الأصلي
            notification.style.transform = '';
        }
    };
    
    // أحداث الماوس
    notification.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    
    // أحداث اللمس
    notification.addEventListener('touchstart', handleStart, { passive: true });
    notification.addEventListener('touchmove', handleMove, { passive: true });
    notification.addEventListener('touchend', handleEnd);
}

/**
نافذة OTP المنبثقة
@returns {Promise<string|null>}
*/
export function showOtpModal() {
    return new Promise((resolve) => {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'global-otp-overlay';
        
        modalOverlay.innerHTML = `
            <div class="global-otp-modal">
                <button type="button" class="global-otp-close" aria-label="إغلاق">
                    <i class="fas fa-times"></i>
                </button>
                <div class="global-otp-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h2 class="global-otp-title">رمز التحقق</h2>
                <p style="color: var(--text-muted, #aaa); font-size: 0.9rem; margin-bottom: 20px;">
                    أدخل الرمز المكون من 6 أرقام
                </p>
                <div class="global-otp-input-container">
                    <input 
                        type="text" 
                        class="global-otp-input" 
                        placeholder="123456" 
                        maxlength="6"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        autocomplete="one-time-code"
                    >
                </div>
                <button 
                    type="button" 
                    class="btn btn-accent" 
                    style="width: 100%; padding: 14px; font-size: 1rem;"
                >
                    تأكيد الرمز
                </button>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        const closeBtn = modalOverlay.querySelector('.global-otp-close');
        const confirmBtn = modalOverlay.querySelector('button.btn-accent');
        const inputField = modalOverlay.querySelector('.global-otp-input');
        
        setTimeout(() => inputField.focus(), 100);
        
        confirmBtn.onclick = () => {
            const enteredCode = inputField.value.trim();
            if (enteredCode.length === 6 && /^\d+$/.test(enteredCode)) {
                modalOverlay.remove();
                resolve(enteredCode);
            } else {
                showNotification("يرجى إدخال رمز صحيح مكون من 6 أرقام", "error");
                inputField.focus();
            }
        };
        
        const closeModal = () => {
            modalOverlay.remove();
            resolve(null);
        };
        
        closeBtn.onclick = closeModal;
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) closeModal();
        };
        
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        });
        
        // دعم مفتاح Escape - جديد
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
عرض تنبيه تأكيد (Confirm Dialog) - جديد
@param {string} message - نص الرسالة
@param {string} title - عنوان النافذة
@returns {Promise<boolean>}
*/
export function showConfirmDialog(message, title = "تأكيد") {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'global-otp-overlay';
        
        overlay.innerHTML = `
            <div class="global-otp-modal">
                <div class="global-otp-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <h2 class="global-otp-title">${title}</h2>
                <p style="color: var(--text-muted, #aaa); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.6;">
                    ${message}
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <button class="btn btn-accent" id="confirmYes">نعم</button>
                    <button class="btn btn-outline" id="confirmNo">لا</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const yesBtn = overlay.querySelector('#confirmYes');
        const noBtn = overlay.querySelector('#confirmNo');
        
        yesBtn.onclick = () => {
            overlay.remove();
            resolve(true);
        };
        
        noBtn.onclick = () => {
            overlay.remove();
            resolve(false);
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        };
    });
}

/**
عرض تنبيه تحميل (Loading) - جديد
@param {string} message - نص الرسالة
@returns {Object} { close: Function }
*/
export function showLoading(message = "جاري التحميل...") {
    const overlay = document.createElement('div');
    overlay.className = 'global-otp-overlay';
    overlay.style.pointerEvents = 'none';
    
    overlay.innerHTML = `
        <div class="global-otp-modal" style="max-width: 300px; padding: 30px;">
            <div class="global-otp-icon" style="animation: pulse 1.5s ease-in-out infinite;">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p style="color: var(--text-primary, #fff); font-size: 1rem; margin-top: 15px;">
                ${message}
            </p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    return {
        close: () => {
            overlay.remove();
        }
    };
}

