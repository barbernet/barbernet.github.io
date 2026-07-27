/**
 * BarberFlow Pro - أدوات التواريخ والأوقات
 * المسار: shared/utils/date-utils.js
 * الدور: تنسيق التواريخ والأوقات باللغة العربية
 */

/**
 * تنسيق التاريخ بالعربية
 * @param {string|Date} date - التاريخ
 * @param {Object} options - خيارات التنسيق
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    };
    return d.toLocaleDateString('ar-MA', defaultOptions);
};

/**
 * تنسيق الوقت
 * @param {string|Date} time - الوقت
 * @returns {string}
 */
export const formatTime = (time) => {
    if (!time) return '';
    const d = new Date(time);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('ar-MA', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * تنسيق الوقت النسبي (منذ، بعد)
 * @param {string|Date} date - التاريخ
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diff = now - d;
    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    if (diff < 0) {
        if (years > 0) return `بعد ${years} ${years === 1 ? 'سنة' : 'سنوات'}`;
        if (months > 0) return `بعد ${months} ${months === 1 ? 'شهر' : 'أشهر'}`;
        if (weeks > 0) return `بعد ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
        if (days > 0) return `بعد ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
        if (hours > 0) return `بعد ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
        if (minutes > 0) return `بعد ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
        return 'بعد قليل';
    } else {
        if (years > 0) return `منذ ${years} ${years === 1 ? 'سنة' : 'سنوات'}`;
        if (months > 0) return `منذ ${months} ${months === 1 ? 'شهر' : 'أشهر'}`;
        if (weeks > 0) return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
        if (days > 0) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
        if (hours > 0) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
        if (minutes > 0) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
        return 'الآن';
    }
};

/**
 * التحقق إذا كان التاريخ هو اليوم
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isToday = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
};

/**
 * التحقق إذا كان التاريخ هو الغد
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isTomorrow = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d.toDateString() === tomorrow.toDateString();
};

/**
 * التحقق إذا كان التاريخ هو أمس
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isYesterday = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.toDateString() === yesterday.toDateString();
};

/**
 * التحقق إذا كان التاريخ في الماضي
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isPast = (date) => {
    if (!date) return false;
    const d = new Date(date);
    return d < new Date();
};

/**
 * التحقق إذا كان التاريخ في المستقبل
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isFuture = (date) => {
    if (!date) return false;
    const d = new Date(date);
    return d > new Date();
};

/**
 * الحصول على اسم اليوم بالعربية
 * @param {string|Date} date
 * @returns {string}
 */
export const getDayName = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[d.getDay()];
};

/**
 * الحصول على اسم الشهر بالعربية
 * @param {string|Date} date
 * @returns {string}
 */
export const getMonthName = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[d.getMonth()];
};

/**
 * حساب الفرق بين تاريخين
 * @param {string|Date} date1
 * @param {string|Date} date2
 * @param {string} unit - الوحدة (days, hours, minutes, seconds)
 * @returns {number}
 */
export const dateDiff = (date1, date2, unit = 'days') => {
    if (!date1 || !date2) return 0;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.abs(d2 - d1);
    switch (unit) {
        case 'seconds': return Math.floor(diff / 1000);
        case 'minutes': return Math.floor(diff / 60000);
        case 'hours': return Math.floor(diff / 3600000);
        case 'days': return Math.floor(diff / 86400000);
        default: return 0;
    }
};

/**
 * إضافة أيام إلى تاريخ
 * @param {string|Date} date
 * @param {number} days
 * @returns {Date}
 */
export const addDays = (date, days) => {
    if (!date) return new Date();
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

/**
 * تحويل التاريخ إلى صيغة ISO Date (YYYY-MM-DD)
 * @param {string|Date} date
 * @returns {string}
 */
export const toISODate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

/**
 * تحويل الوقت إلى صيغة ISO Time (HH:MM:SS)
 * @param {string|Date} time
 * @returns {string}
 */
export const toISOTime = (time) => {
    if (!time) return '';
    const d = new Date(time);
    if (isNaN(d.getTime())) return '';
    return d.toTimeString().split(' ')[0];
};

export default {
    formatDate,
    formatTime,
    formatRelativeTime,
    isToday,
    isTomorrow,
    isYesterday,
    isPast,
    isFuture,
    getDayName,
    getMonthName,
    dateDiff,
    addDays,
    toISODate,
    toISOTime
};

