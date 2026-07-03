/**
 * middleware/validation/input-sanitizer.js
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
        .replace(/'/g, '&#039;')
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

export const sanitizeURL = (url) => {
    if (typeof url !== 'string') return null;
    try {
        const urlObj = new URL(url);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return null;
        if (url.length > 2048) return null;
        return urlObj.toString();
    } catch (e) { return null; }
};

export const validateLength = (text, minLength = 0, maxLength = Infinity) => {
    if (typeof text !== 'string') return false;
    return text.length >= minLength && text.length <= maxLength;
};

export const sanitizeUserData = (userData) => ({
    displayName: validateLength(sanitizeText(userData.displayName), 2, 50) ? sanitizeText(userData.displayName) : null,
    email: sanitizeEmail(userData.email),
    phoneNumber: sanitizePhone(userData.phoneNumber),
    bio: validateLength(sanitizeText(userData.bio), 0, 500) ? sanitizeText(userData.bio) : '',
    role: ['customer', 'salon', 'store', 'admin'].includes(userData.role) ? userData.role : 'customer',
    photoURL: sanitizeURL(userData.photoURL)
});

export const sanitizeSalonData = (salonData) => ({
    name: validateLength(sanitizeText(salonData.name), 2, 100) ? sanitizeText(salonData.name) : null,
    address: validateLength(sanitizeText(salonData.address), 5, 200) ? sanitizeText(salonData.address) : '',
    phone: sanitizePhone(salonData.phone),
    email: sanitizeEmail(salonData.email),
    description: validateLength(sanitizeText(salonData.description), 0, 1000) ? sanitizeText(salonData.description) : '',
    website: sanitizeURL(salonData.website)
});

export const sanitizeBookingData = (bookingData) => ({
    salonId: sanitizeText(bookingData.salonId),
    customerId: sanitizeText(bookingData.customerId),
    customerName: validateLength(sanitizeText(bookingData.customerName), 2, 50) ? sanitizeText(bookingData.customerName) : null,
    customerPhone: sanitizePhone(bookingData.customerPhone),
    date: sanitizeText(bookingData.date),
    time: sanitizeText(bookingData.time),
    service: sanitizeText(bookingData.service),
    notes: validateLength(sanitizeText(bookingData.notes), 0, 500) ? sanitizeText(bookingData.notes) : ''
});