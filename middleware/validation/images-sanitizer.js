/**
middleware/validation/images-sanitizer.js
نظام فلترة وحماية الصور قبل التخزين
الدور: التحقق من أمان الصور ومحتواها قبل الرفع
*/
// استيراد الدوال التقنية من shared
import { processImage } from '../../shared/utils/images-utils.js'; // ✅ تم التصحيح من shared/js إلى shared/utils

/**
التحقق من نوع الصورة
@param {File} file
@returns {boolean}
*/
export const validateImageType = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
};

/**
التحقق من حجم الصورة
@param {File} file
@param {number} maxSizeMB
@returns {boolean}
*/
export const validateImageSize = (file, maxSizeMB = 5) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
};

/**
التحقق من أبعاد الصورة
@param {HTMLImageElement} img
@returns {Object} { valid: boolean, reason?: string }
*/
export const validateImageDimensions = (img) => {
    const minWidth = 100;
    const minHeight = 100;
    const maxWidth = 4000;
    const maxHeight = 4000;
    const maxAspectRatio = 10;

    if (img.width < minWidth || img.height < minHeight) {
        return { 
            valid: false, 
            reason: 'الصورة صغيرة جداً (الحد الأدنى: 100x100 بكسل)' 
        };
    }
    if (img.width > maxWidth || img.height > maxHeight) {
        return { 
            valid: false, 
            reason: 'الصورة كبيرة جداً (الحد الأقصى: 4000x4000 بكسل)' 
        };
    }
    const aspectRatio = Math.max(img.width, img.height) / Math.min(img.width, img.height);
    if (aspectRatio > maxAspectRatio) {
        return { 
            valid: false, 
            reason: 'نسبة أبعاد الصورة غير منطقية' 
        };
    }
    return { valid: true };
};

/**
كشف المحتوى غير اللائق في الصورة
@param {HTMLImageElement} img
@returns {Object} { safe: boolean, reason?: string }
*/
export const detectInappropriateContent = (img) => {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let skinTonePixels = 0;
        let totalPixels = data.length / 4;

        // فحص نسبة الألوان الجلدية
        for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 95 && g > 40 && b > 20 && 
                r > g && r > b && 
                Math.abs(r - g) > 15 && 
                r - g > 15 && r - b > 15) {
                skinTonePixels++;
            }
        }

        const skinToneRatio = skinTonePixels / (totalPixels / 4);
        // رفض إذا كانت نسبة اللون الجلدي عالية جداً (> 65%)
        if (skinToneRatio > 0.65) {
            return {
                safe: false,
                reason: 'الصورة تحتوي على محتوى غير لائق'
            };
        }
        return { safe: true };
    } catch (error) {
        console.error('Error detecting inappropriate content:', error);
        return { safe: true };
    }
};

/**
التحقق الشامل من الصورة قبل الرفع
@param {File} file
@returns {Promise<Object>} { valid: boolean, base64?: string, reason?: string }
*/
export const validateAndProcessImage = async (file) => {
    // 1. التحقق من النوع
    if (!validateImageType(file)) {
        return {
            valid: false,
            reason: 'نوع الصورة غير مدعوم. استخدم JPEG, PNG, أو WebP'
        };
    }

    // 2. التحقق من الحجم
    if (!validateImageSize(file, 5)) {
        return { 
            valid: false, 
            reason: 'حجم الصورة كبير جداً (الحد الأقصى: 5 ميجابايت)' 
        };
    }

    // 3. معالجة الصورة (استخدام الدالة من shared)
    let base64;
    try {
        base64 = await processImage(file);
    } catch (error) {
        return { 
            valid: false, 
            reason: 'فشل معالجة الصورة' 
        };
    }

    // 4. التحقق من الأبعاد والمحتوى
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const dimensionsCheck = validateImageDimensions(img);
            if (!dimensionsCheck.valid) {
                resolve({ valid: false, reason: dimensionsCheck.reason });
                return;
            }
            const contentCheck = detectInappropriateContent(img);
            if (!contentCheck.safe) {
                resolve({ valid: false, reason: contentCheck.reason });
                return;
            }
            resolve({ valid: true, base64 });
        };
        img.onerror = () => {
            resolve({ valid: false, reason: 'فشل تحميل الصورة للتحقق' });
        };
        img.src = base64;
    });
};

