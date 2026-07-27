/**
 * BarberFlow Pro - إدارة الأخطاء المركزية
 * المسار: shared/utils/error-handler.js
 * الدور: توحيد معالجة الأخطاء وعرض رسائل واضحة للمستخدم
 */
import { showNotification } from './notifications.js';

/**
 * معالجة الأخطاء بشكل موحد
 * @param {Error|Object} error - كائن الخطأ
 * @param {string} context - سياق الخطأ (مثل: 'تسجيل الدخول')
 * @param {boolean} showToUser - هل نعرض الرسالة للمستخدم؟
 */
export const handleError = (error, context = '', showToUser = true) => {
    const errorMessage = error?.message || 'حدث خطأ غير متوقع';
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;

    // تسجيل الخطأ في الـ console
    console.error(`❌ [${context || 'Error'}]`, error);

    // عرض التنبيه للمستخدم
    if (showToUser) {
        showNotification(getUserFriendlyMessage(errorMessage, context), 'error');
    }

    // هنا يمكن إضافة إرسال الخطأ إلى خدمة مثل Sentry
    // reportToSentry(error, context);
};

/**
 * معالجة أخطاء Supabase بشكل خاص
 * @param {Object} error - كائن الخطأ من Supabase
 * @param {string} context - سياق العملية
 * @param {boolean} showToUser
 */
export const handleSupabaseError = (error, context = '', showToUser = true) => {
    if (!error) return;

    const errorCode = error.code || error.status;
    const errorMessage = error.message || '';
    let userMessage = 'حدث خطأ في الاتصال بقاعدة البيانات';

    // تحليل نوع الخطأ
    if (errorCode === '23505' || errorMessage.includes('duplicate key')) {
        userMessage = 'هذا السجل موجود بالفعل';
    } else if (errorCode === '23503' || errorMessage.includes('foreign key')) {
        userMessage = 'البيانات المرتبطة غير موجودة';
    } else if (errorCode === '42501' || errorMessage.includes('permission denied')) {
        userMessage = 'ليس لديك صلاحية للقيام بهذه العملية';
    } else if (errorCode === 'PGRST116' || errorMessage.includes('not found')) {
        userMessage = 'البيانات المطلوبة غير موجودة';
    } else if (errorCode === 'PGRST11') {
        userMessage = 'تم إرجاع أكثر من سجل واحد بينما كان المتوقع سجل واحد';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userMessage = 'مشكلة في الاتصال بالإنترنت. يرجى المحاولة لاحقاً';
    } else if (errorMessage.includes('JWT') || errorMessage.includes('token')) {
        userMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى';
    }

    console.error(`❌ [Supabase - ${context}]`, { code: errorCode, message: errorMessage, error });

    if (showToUser) {
        showNotification(userMessage, 'error');
    }

    return userMessage;
};

/**
 * معالجة أخطاء المصادقة
 * @param {Object} error
 * @param {string} context
 */
export const handleAuthError = (error, context = 'المصادقة') => {
    const errorMessage = error?.message || '';
    let userMessage = 'حدث خطأ في المصادقة';

    if (errorMessage.includes('Invalid login credentials')) {
        userMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    } else if (errorMessage.includes('Email not confirmed')) {
        userMessage = 'يرجى تأكيد بريدك الإلكتروني أولاً';
    } else if (errorMessage.includes('User not found')) {
        userMessage = 'لا يوجد حساب بهذا البريد الإلكتروني';
    } else if (errorMessage.includes('Password')) {
        userMessage = 'كلمة المرور غير صحيحة';
    } else if (errorMessage.includes('rate limit')) {
        userMessage = 'محاولات كثيرة. يرجى الانتظار قليلاً';
    } else if (errorMessage.includes('session') || errorMessage.includes('expired')) {
        userMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى';
    }

    console.error(`❌ [Auth - ${context}]`, error);
    showNotification(userMessage, 'error');
    return userMessage;
};

/**
 * معالجة أخطاء التحقق من البيانات
 * @param {Object} validationErrors - أخطاء التحقق { field: message }
 */
export const handleValidationError = (validationErrors) => {
    if (!validationErrors || typeof validationErrors !== 'object') return;

    const messages = Object.values(validationErrors);
    if (messages.length === 0) return;

    // عرض أول خطأ فقط
    showNotification(messages[0], 'warning');

    // تمييز الحقول الخاطئة
    Object.keys(validationErrors).forEach(field => {
        const input = document.querySelector(`[name="${field}"], #${field}`);
        if (input) {
            input.classList.add('input-error');
            input.style.borderColor = 'var(--brand-danger)';
            
            // إزالة التمييز عند الكتابة
            const handler = () => {
                input.classList.remove('input-error');
                input.style.borderColor = '';
                input.removeEventListener('input', handler);
            };
            input.addEventListener('input', handler);
        }
    });
};

/**
 * معالجة أخطاء الشبكة
 * @param {Error} error
 */
export const handleNetworkError = (error) => {
    console.error('❌ [Network]', error);
    
    if (!navigator.onLine) {
        showNotification('لا يوجد اتصال بالإنترنت', 'error');
    } else {
        showNotification('مشكلة في الاتصال بالخادم. يرجى المحاولة لاحقاً', 'error');
    }
};

/**
 * الحصول على رسالة واضحة للمستخدم
 */
function getUserFriendlyMessage(errorMessage, context) {
    // رسائل عامة مفهومة للمستخدم
    const friendlyMessages = {
        'network': 'مشكلة في الاتصال. يرجى التحقق من الإنترنت',
        'timeout': 'انتهت مهلة الانتظار. يرجى المحاولة مرة أخرى',
        'unauthorized': 'غير مصرح لك بهذه العملية',
        'forbidden': 'ليس لديك صلاحية الوصول',
        'not found': 'البيانات المطلوبة غير موجودة'
    };

    for (const [key, message] of Object.entries(friendlyMessages)) {
        if (errorMessage.toLowerCase().includes(key)) {
            return message;
        }
    }

    return context 
        ? `حدث خطأ في ${context}. يرجى المحاولة مرة أخرى`
        : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
}

/**
 * دالة مساعدة لتجربة عملية مع معالجة الأخطاء
 * @param {Function} operation - العملية المراد تنفيذها
 * @param {string} context - سياق العملية
 * @param {Object} options - خيارات إضافية
 * @returns {Promise<Object>} { success, data, error }
 */
export const safeExecute = async (operation, context = '', options = {}) => {
    const { showToUser = true, retryCount = 0 } = options;

    try {
        const data = await operation();
        return { success: true, data, error: null };
    } catch (error) {
        if (retryCount > 0) {
            console.warn(`⚠️ إعادة المحاولة (${retryCount}) لـ ${context}`);
            return safeExecute(operation, context, { 
                ...options, 
                retryCount: retryCount - 1 
            });
        }

        handleError(error, context, showToUser);
        return { success: false, data: null, error };
    }
};

export default {
    handleError,
    handleSupabaseError,
    handleAuthError,
    handleValidationError,
    handleNetworkError,
    safeExecute
};

