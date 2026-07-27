/**
 * BarberFlow Pro - أدوات رفع وإدارة الصور في Supabase Storage
 * المسار: shared/utils/images-utils.js
 * ⚠️ تم التحديث: لم نعد نحتاج لتحويل الصور إلى base64
 *                الآن نرفعها مباشرة إلى Supabase Storage
 * 
 * 📦 الـ Bucket الافتراضي: 'uploads'
 * 📁 المجلدات الشائعة:
 *    - 'avatars'     → صور البروفايل
 *    - 'businesses'  → صور الصالونات/المتاجر (غلاف، شعار)
 *    - 'products'    → صور المنتجات
 *    - 'services'    → صور الخدمات
 *    - 'reviews'     → صور التقييمات
 */
import { supabase } from '../../config/supabase-init.js';

// ============================================
// الثوابت
// ============================================
const DEFAULT_BUCKET = 'uploads';
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// ============================================
// توليد اسم ملف فريد
// ============================================
/**
 * توليد اسم ملف فريد لتجنب التعارض
 * @param {File} file - الملف الأصلي
 * @param {string} prefix - بادئة اختيارية (مثل: 'avatar', 'product')
 * @returns {string} اسم الملف الفريد
 */
export const generateUniqueFileName = (file, prefix = '') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split('.').pop().toLowerCase();
    const safePrefix = prefix ? `${prefix}_` : '';
    return `${safePrefix}${timestamp}_${random}.${extension}`;
};

// ============================================
// رفع صورة إلى Supabase Storage
// ============================================
/**
 * رفع صورة إلى Supabase Storage
 * @param {File} file - ملف الصورة
 * @param {string} folder - المجلد داخل الـ bucket (مثال: 'avatars')
 * @param {Object} options - خيارات إضافية
 * @param {string} options.bucket - اسم الـ bucket (افتراضي: 'uploads')
 * @param {string} options.prefix - بادئة لاسم الملف
 * @param {boolean} options.upsert - هل نسمح بالاستبدال؟ (افتراضي: false)
 * @returns {Promise<Object>} { success, path, publicUrl, error }
 */
export const uploadImage = async (file, folder, options = {}) => {
    const {
        bucket = DEFAULT_BUCKET,
        prefix = '',
        upsert = false
    } = options;

    try {
        // 1. التحقق من الملف
        if (!file || !(file instanceof File)) {
            return { success: false, error: 'الملف غير صالح' };
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return { 
                success: false, 
                error: 'نوع الصورة غير مدعوم. استخدم JPEG, PNG, أو WebP' 
            };
        }

        const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return { 
                success: false, 
                error: `حجم الصورة كبير جداً (الحد الأقصى: ${MAX_FILE_SIZE_MB} ميجابايت)` 
            };
        }

        // 2. توليد اسم فريد
        const fileName = generateUniqueFileName(file, prefix);
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // 3. رفع الصورة إلى Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: upsert,
                contentType: file.type
            });

        if (error) {
            console.error('❌ خطأ في رفع الصورة:', error);
            return { success: false, error: error.message, path: filePath };
        }

        // 4. الحصول على الرابط العام
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return {
            success: true,
            path: filePath,
            publicUrl: urlData?.publicUrl || null,
            fullPath: data?.path || filePath
        };
    } catch (error) {
        console.error('❌ خطأ غير متوقع في رفع الصورة:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// رفع عدة صور دفعة واحدة
// ============================================
/**
 * رفع عدة صور دفعة واحدة
 * @param {File[]} files - مصفوفة الملفات
 * @param {string} folder - المجلد
 * @param {Object} options - خيارات إضافية
 * @returns {Promise<Object[]>} مصفوفة النتائج
 */
export const uploadMultipleImages = async (files, folder, options = {}) => {
    const results = [];
    for (const file of files) {
        const result = await uploadImage(file, folder, options);
        results.push({ file, ...result });
    }
    return results;
};

// ============================================
// الحصول على رابط الصورة العام
// ============================================
/**
 * الحصول على الرابط العام لصورة موجودة
 * @param {string} path - مسار الصورة داخل الـ bucket
 * @param {string} bucket - اسم الـ bucket (افتراضي: 'uploads')
 * @returns {string|null} الرابط العام أو null
 */
export const getImageUrl = (path, bucket = DEFAULT_BUCKET) => {
    if (!path) return null;

    try {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return data?.publicUrl || null;
    } catch (error) {
        console.error('❌ خطأ في الحصول على رابط الصورة:', error);
        return null;
    }
};

// ============================================
// الحصول على رابط مع تحويل الحجم (Transform)
// ============================================
/**
 * الحصول على رابط الصورة مع تحويلات (resize, etc.)
 * @param {string} path - مسار الصورة
 * @param {Object} transforms - خيارات التحويل
 * @param {number} transforms.width - العرض
 * @param {number} transforms.height - الارتفاع
 * @param {string} transforms.resize - نوع التغيير (cover/contain/fill)
 * @param {string} bucket - اسم الـ bucket
 * @returns {string|null}
 */
export const getTransformedImageUrl = (path, transforms = {}, bucket = DEFAULT_BUCKET) => {
    if (!path) return null;

    try {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path, {
                transform: transforms
            });

        return data?.publicUrl || null;
    } catch (error) {
        console.error('❌ خطأ في الحصول على رابط الصورة المحوّلة:', error);
        return null;
    }
};

// ============================================
// حذف صورة من Storage
// ============================================
/**
 * حذف صورة من Supabase Storage
 * @param {string} path - مسار الصورة
 * @param {string} bucket - اسم الـ bucket
 * @returns {Promise<Object>} { success, error }
 */
export const deleteImage = async (path, bucket = DEFAULT_BUCKET) => {
    if (!path) {
        return { success: false, error: 'مسار الصورة غير محدد' };
    }

    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            console.error('❌ خطأ في حذف الصورة:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ خطأ غير متوقع في حذف الصورة:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// حذف عدة صور
// ============================================
/**
 * حذف عدة صور دفعة واحدة
 * @param {string[]} paths - مصفوفة المسارات
 * @param {string} bucket - اسم الـ bucket
 * @returns {Promise<Object>}
 */
export const deleteMultipleImages = async (paths, bucket = DEFAULT_BUCKET) => {
    if (!paths || paths.length === 0) {
        return { success: false, error: 'لا توجد صور للحذف' };
    }

    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove(paths);

        if (error) {
            console.error('❌ خطأ في حذف الصور:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ خطأ غير متوقع في حذف الصور:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// استبدال صورة (حذف القديمة + رفع الجديدة)
// ============================================
/**
 * استبدال صورة بصورة جديدة
 * @param {string} oldPath - مسار الصورة القديمة
 * @param {File} newFile - الملف الجديد
 * @param {string} folder - المجلد
 * @param {Object} options - خيارات إضافية
 * @returns {Promise<Object>}
 */
export const replaceImage = async (oldPath, newFile, folder, options = {}) => {
    try {
        // 1. رفع الصورة الجديدة
        const uploadResult = await uploadImage(newFile, folder, options);
        if (!uploadResult.success) {
            return uploadResult;
        }

        // 2. حذف الصورة القديمة (إذا كانت موجودة)
        if (oldPath) {
            await deleteImage(oldPath, options.bucket || DEFAULT_BUCKET);
        }

        return uploadResult;
    } catch (error) {
        console.error('❌ خطأ في استبدال الصورة:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// التحقق من وجود صورة
// ============================================
/**
 * التحقق من وجود صورة في Storage
 * @param {string} path - مسار الصورة
 * @param {string} bucket - اسم الـ bucket
 * @returns {Promise<boolean>}
 */
export const imageExists = async (path, bucket = DEFAULT_BUCKET) => {
    if (!path) return false;

    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(path.split('/').slice(0, -1).join('/') || '', {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
            });

        if (error) return false;

        const fileName = path.split('/').pop();
        return data?.some(file => file.name === fileName) || false;
    } catch (error) {
        console.error('❌ خطأ في التحقق من وجود الصورة:', error);
        return false;
    }
};

// ============================================
// تصدير جميع الدوال
// ============================================
export default {
    generateUniqueFileName,
    uploadImage,
    uploadMultipleImages,
    getImageUrl,
    getTransformedImageUrl,
    deleteImage,
    deleteMultipleImages,
    replaceImage,
    imageExists
};

