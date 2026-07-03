/**
نظام التنبيهات الموحد لـ BarberFlow-Pro
المسار: shared/js/notifications.js
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
    });
}

