/**
 * BarberFlow Pro - نظام التخزين المؤقت
 * المسار: shared/utils/cache.js
 * الدور: تحسين الأداء عبر تخزين البيانات المتكررة مؤقتاً
 */

const CACHE_PREFIX = 'bf_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 دقائق

/**
 * حفظ بيانات في الكاش
 * @param {string} key - مفتاح الكاش
 * @param {any} data - البيانات المراد تخزينها
 * @param {number} ttl - مدة الصلاحية بالمللي ثانية (افتراضي: 5 دقائق)
 */
export const cacheSet = (key, data, ttl = DEFAULT_TTL) => {
    try {
        const cacheData = {
            data,
            timestamp: Date.now(),
            ttl,
            expiresAt: Date.now() + ttl
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
        return true;
    } catch (error) {
        console.error('❌ خطأ في حفظ الكاش:', error);
        return false;
    }
};

/**
 * استرجاع بيانات من الكاش
 * @param {string} key - مفتاح الكاش
 * @returns {any|null} البيانات المخزنة أو null
 */
export const cacheGet = (key) => {
    try {
        const item = localStorage.getItem(CACHE_PREFIX + key);
        if (!item) return null;

        const cacheData = JSON.parse(item);
        const now = Date.now();

        // التحقق من صلاحية الكاش
        if (now > cacheData.expiresAt) {
            cacheRemove(key);
            return null;
        }

        return cacheData.data;
    } catch (error) {
        console.error('❌ خطأ في استرجاع الكاش:', error);
        return null;
    }
};

/**
 * حذف بيانات من الكاش
 * @param {string} key
 */
export const cacheRemove = (key) => {
    try {
        localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
        console.error('❌ خطأ في حذف الكاش:', error);
    }
};

/**
 * مسح جميع الكاش
 */
export const cacheClear = () => {
    try {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error('❌ خطأ في مسح الكاش:', error);
    }
};

/**
 * مسح الكاش المنتهي الصلاحية فقط
 */
export const cacheCleanExpired = () => {
    try {
        const now = Date.now();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const item = localStorage.getItem(key);
                    const cacheData = JSON.parse(item);
                    if (now > cacheData.expiresAt) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تنظيف الكاش:', error);
    }
};

/**
 * جلب بيانات مع دعم الكاش (Cache-First Strategy)
 * @param {string} key - مفتاح الكاش
 * @param {Function} fetcher - دالة جلب البيانات
 * @param {number} ttl - مدة الصلاحية
 * @returns {Promise<any>}
 */
export const cacheFetch = async (key, fetcher, ttl = DEFAULT_TTL) => {
    // 1. محاولة الحصول من الكاش أولاً
    const cached = cacheGet(key);
    if (cached !== null) {
        return cached;
    }

    // 2. جلب البيانات من المصدر
    try {
        const data = await fetcher();
        cacheSet(key, data, ttl);
        return data;
    } catch (error) {
        console.error(`❌ خطأ في جلب البيانات لـ ${key}:`, error);
        throw error;
    }
};

/**
 * جلب بيانات مع تحديث الكاش في الخلفية (Stale-While-Revalidate)
 * @param {string} key
 * @param {Function} fetcher
 * @param {number} ttl
 * @returns {Promise<any>}
 */
export const cacheFetchWithRevalidation = async (key, fetcher, ttl = DEFAULT_TTL) => {
    const cached = cacheGet(key);

    // جلب البيانات الجديدة في الخلفية
    fetcher()
        .then(data => {
            cacheSet(key, data, ttl);
        })
        .catch(error => {
            console.error(`❌ خطأ في تحديث الكاش لـ ${key}:`, error);
        });

    // إرجاع البيانات القديمة فوراً (إن وجدت)
    return cached;
};

/**
 * الحصول على إحصائيات الكاش
 * @returns {Object}
 */
export const cacheStats = () => {
    try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
        const now = Date.now();
        let validCount = 0;
        let expiredCount = 0;
        let totalSize = 0;

        keys.forEach(key => {
            try {
                const item = localStorage.getItem(key);
                totalSize += item.length;
                const cacheData = JSON.parse(item);
                if (now > cacheData.expiresAt) {
                    expiredCount++;
                } else {
                    validCount++;
                }
            } catch (e) {
                expiredCount++;
            }
        });

        return {
            totalKeys: keys.length,
            validCount,
            expiredCount,
            sizeBytes: totalSize,
            sizeKB: (totalSize / 1024).toFixed(2)
        };
    } catch (error) {
        return { totalKeys: 0, validCount: 0, expiredCount: 0, sizeBytes: 0, sizeKB: '0' };
    }
};

export default {
    cacheSet,
    cacheGet,
    cacheRemove,
    cacheClear,
    cacheCleanExpired,
    cacheFetch,
    cacheFetchWithRevalidation,
    cacheStats
};

