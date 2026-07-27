/**
 * middleware/validation/images-sanitizer.js
 * نظام فلترة وحماية الصور قبل الرفع إلى Supabase Storage
 * الدور: التحقق من أمان الصور ومحتواها قبل الرفع (بدون تحويل إلى base64)
 */

/**
 * التحقق من نوع الصورة
 * @param {File} file
 * @returns {boolean}
 */
export const validateImageType = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
};

/**
 * التحقق من حجم الصورة
 * @param {File} file
 * @param {number} maxSizeMB
 * @returns {boolean}
 */
export const validateImageSize = (file, maxSizeMB = 5) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
};

/**
 * التحقق من أبعاد الصورة
 * @param {File} file
 * @returns {Promise<Object>} { valid: boolean, reason?: string }
 */
export const validateImageDimensions = (file) => {
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            
            const minWidth = 100;
            const minHeight = 100;
            const maxWidth = 4000;
            const maxHeight = 4000;
            const maxAspectRatio = 10;

            if (img.width < minWidth || img.height < minHeight) {
                resolve({ 
                    valid: false, 
                    reason: 'الصورة صغيرة جداً (الحد الأدنى: 100x100 بكسل)' 
                });
                return;
            }

            if (img.width > maxWidth || img.height > maxHeight) {
                resolve({ 
                    valid: false, 
                    reason: 'الصورة كبيرة جداً (الحد الأقصى: 4000x4000 بكسل)' 
                });
                return;
            }

            const aspectRatio = Math.max(img.width, img.height) / Math.min(img.width, img.height);
            if (aspectRatio > maxAspectRatio) {
                resolve({ 
                    valid: false, 
                    reason: 'نسبة أبعاد الصورة غير منطقية' 
                });
                return;
            }

            resolve({ 
                valid: true,
                width: img.width,
                height: img.height
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({ 
                valid: false, 
                reason: 'فشل تحميل الصورة للتحقق' 
            });
        };

        img.src = objectUrl;
    });
};

/**
 * كشف المحتوى غير اللائق في الصورة
 * @param {File} file
 * @returns {Promise<Object>} { safe: boolean, reason?: string }
 */
export const detectInappropriateContent = (file) => {
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
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

                URL.revokeObjectURL(objectUrl);

                // رفض إذا كانت نسبة اللون الجلدي عالية جداً (> 65%)
                if (skinToneRatio > 0.65) {
                    resolve({
                        safe: false,
                        reason: 'الصورة تحتوي على محتوى غير لائق'
                    });
                    return;
                }

                resolve({ safe: true });
            } catch (error) {
                URL.revokeObjectURL(objectUrl);
                console.error('Error detecting inappropriate content:', error);
                resolve({ safe: true });
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({ safe: true });
        };

        img.src = objectUrl;
    });
};

/**
 * التحقق الشامل من الصورة قبل الرفع
 * @param {File} file
 * @returns {Promise<Object>} { valid: boolean, file?: File, reason?: string }
 */
export const validateImage = async (file) => {
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

    // 3. التحقق من الأبعاد
    const dimensionsCheck = await validateImageDimensions(file);
    if (!dimensionsCheck.valid) {
        return { 
            valid: false, 
            reason: dimensionsCheck.reason 
        };
    }

    // 4. التحقق من المحتوى
    const contentCheck = await detectInappropriateContent(file);
    if (!contentCheck.safe) {
        return { 
            valid: false, 
            reason: contentCheck.reason 
        };
    }

    // 5. إرجاع الملف الأصلي بعد التحقق الناجح
    return { 
        valid: true, 
        file: file,
        dimensions: {
            width: dimensionsCheck.width,
            height: dimensionsCheck.height
        }
    };
};

/**
 * توليد اسم ملف فريد للرفع إلى Supabase Storage
 * @param {File} file
 * @param {string} folder - مجلد التخزين (مثال: 'avatars', 'products', 'services')
 * @returns {string} المسار الكامل للملف
 */
export const generateStoragePath = (file, folder = 'uploads') => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${extension}`;
    return `${folder}/${fileName}`;
};

