/**
 * BarberFlow Pro - تنظيف والتحقق من المدخلات
 * المسار: middleware/validation/input-sanitizer.js
 * ⚠️ تم التحديث: توحيد الأسماء مع مخطط Supabase
 */

export const sanitizeText = (input) => {
    if (typeof input !== 'string') return '';
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
};

export const sanitizeEmail = (email) => {
    if (typeof email !== 'string') return null;
    const sanitized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) return null;
    if (sanitized.length > 254) return null;
    return sanitized;
};

export const sanitizePhone = (phone) => {
    if (typeof phone !== 'string') return null;
    const sanitized = phone.replace(/[^\d+]/g, '');
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(sanitized)) return null;
    if (sanitized.length > 16) return null;
    return sanitized;
};

/**
 * ✅ جديد: التحقق من صحة رقم هاتف مغربي
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidMoroccanPhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/[^\d]/g, '');
    // الأرقام المغربية: 06/07 (10 أرقام) أو +2126/+2127 (12 رقم)
    return /^(0[67]\d{8}|212[67]\d{8})$/.test(cleaned);
};

export const sanitizeURL = (url) => {
    if (typeof url !== 'string') return null;
    try {
        const urlObj = new URL(url);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return null;
        if (url.length > 2048) return null;
        return urlObj.toString();
    } catch (e) { 
        return null; 
    }
};

export const validateLength = (text, minLength = 0, maxLength = Infinity) => {
    if (typeof text !== 'string') return false;
    return text.length >= minLength && text.length <= maxLength;
};

/**
 * ✅ محدّث: توحيد الأسماء مع جدول profiles
 */
export const sanitizeUserData = (userData) => ({
    full_name: validateLength(sanitizeText(userData.full_name), 2, 100) 
        ? sanitizeText(userData.full_name) 
        : null,
    phone: sanitizePhone(userData.phone),
    role: ['customer', 'salon', 'store'].includes(userData.role) 
        ? userData.role 
        : 'customer',
    avatar_url: sanitizeURL(userData.avatar_url)
});

/**
 * ✅ محدّث: توحيد الأسماء مع جدول businesses
 */
export const sanitizeBusinessData = (businessData) => ({
    name: validateLength(sanitizeText(businessData.name), 2, 100) 
        ? sanitizeText(businessData.name) 
        : null,
    type: ['salon', 'store'].includes(businessData.type) 
        ? businessData.type 
        : null,
    description: validateLength(sanitizeText(businessData.description), 0, 1000) 
        ? sanitizeText(businessData.description) 
        : '',
    city: sanitizeText(businessData.city),
    address: validateLength(sanitizeText(businessData.address), 5, 200) 
        ? sanitizeText(businessData.address) 
        : '',
    phone: sanitizePhone(businessData.phone),
    email: sanitizeEmail(businessData.email),
    website: sanitizeURL(businessData.website)
});

/**
 * ✅ محدّث: توحيد الأسماء مع جدول bookings
 */
export const sanitizeBookingData = (bookingData) => ({
    customer_id: sanitizeText(bookingData.customer_id),
    service_id: sanitizeText(bookingData.service_id),
    branch_id: sanitizeText(bookingData.branch_id),
    staff_id: sanitizeText(bookingData.staff_id),
    booking_date: sanitizeText(bookingData.booking_date),
    start_time: sanitizeText(bookingData.start_time),
    end_time: sanitizeText(bookingData.end_time),
    notes: validateLength(sanitizeText(bookingData.notes), 0, 500) 
        ? sanitizeText(bookingData.notes) 
        : ''
});

/**
 * ✅ جديد: تنظيف بيانات الخدمة
 */
export const sanitizeServiceData = (serviceData) => ({
    business_id: sanitizeText(serviceData.business_id),
    branch_id: sanitizeText(serviceData.branch_id),
    name: validateLength(sanitizeText(serviceData.name), 2, 100) 
        ? sanitizeText(serviceData.name) 
        : null,
    description: validateLength(sanitizeText(serviceData.description), 0, 500) 
        ? sanitizeText(serviceData.description) 
        : '',
    price: parseFloat(serviceData.price) >= 0 ? parseFloat(serviceData.price) : 0,
    duration_min: parseInt(serviceData.duration_min) > 0 ? parseInt(serviceData.duration_min) : 30,
    category: sanitizeText(serviceData.category)
});

/**
 * ✅ جديد: تنظيف بيانات المنتج
 */
export const sanitizeProductData = (productData) => ({
    seller_id: sanitizeText(productData.seller_id),
    salon_store_id: sanitizeText(productData.salon_store_id),
    name: validateLength(sanitizeText(productData.name), 2, 100) 
        ? sanitizeText(productData.name) 
        : null,
    description: validateLength(sanitizeText(productData.description), 0, 1000) 
        ? sanitizeText(productData.description) 
        : '',
    price: parseFloat(productData.price) >= 0 ? parseFloat(productData.price) : 0,
    stock_quantity: parseInt(productData.stock_quantity) >= 0 ? parseInt(productData.stock_quantity) : 0,
    category: sanitizeText(productData.category)
});

