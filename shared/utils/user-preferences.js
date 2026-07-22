/**
 * BarberFlow Pro - تفضيلات المستخدم
 * المسار: shared/utils/user-preferences.js
 * 
 * يخزن تفضيلات المستخدم محلياً لتحسين تجربة الاستخدام
 */

/**
 * كائن إدارة تفضيلات المستخدم
 */
export const UserPreferences = {
    /**
     * المفتاح الأساسي للتخزين
     */
    STORAGE_PREFIX: 'barberflow_',

    /**
     * حفظ تفضيل
     * 
     * @param {string} key - مفتاح التفضيل
     * @param {any} value - القيمة المراد حفظها
     */
    set(key, value) {
        try {
            const fullKey = this.STORAGE_PREFIX + key;
            localStorage.setItem(fullKey, JSON.stringify(value));
            console.log(`✅ تم حفظ: ${key}`, value);
        } catch (error) {
            console.error('❌ خطأ في حفظ التفضيل:', error);
        }
    },

    /**
     * استرجاع تفضيل
     * 
     * @param {string} key - مفتاح التفضيل
     * @param {any} defaultValue - القيمة الافتراضية إذا لم يوجد
     * @returns {any} القيمة المخزنة أو القيمة الافتراضية
     */
    get(key, defaultValue = null) {
        try {
            const fullKey = this.STORAGE_PREFIX + key;
            const item = localStorage.getItem(fullKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('❌ خطأ في استرجاع التفضيل:', error);
            return defaultValue;
        }
    },

    /**
     * حذف تفضيل
     * 
     * @param {string} key - مفتاح التفضيل
     */
    remove(key) {
        try {
            const fullKey = this.STORAGE_PREFIX + key;
            localStorage.removeItem(fullKey);
            console.log(`🗑️ تم حذف: ${key}`);
        } catch (error) {
            console.error('❌ خطأ في حذف التفضيل:', error);
        }
    },

    /**
     * مسح جميع التفضيلات
     */
    clearAll() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            console.log('️ تم مسح جميع التفضيلات');
        } catch (error) {
            console.error('❌ خطأ في مسح التفضيلات:', error);
        }
    },

    /**
     * الحصول على جميع التفضيلات
     * 
     * @returns {Object} كائن يحتوي على جميع التفضيلات
     */
    getAll() {
        try {
            const preferences = {};
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.STORAGE_PREFIX)) {
                    const prefKey = key.replace(this.STORAGE_PREFIX, '');
                    preferences[prefKey] = this.get(prefKey);
                }
            });
            return preferences;
        } catch (error) {
            console.error(' خطأ في جلب جميع التفضيلات:', error);
            return {};
        }
    },

    // ============================================
    // تفضيلات محددة شائعة الاستخدام
    // ============================================

    /**
     * الثيم (فاتح/داكن)
     */
    theme: {
        get: () => UserPreferences.get('theme', 'light'),
        set: (theme) => {
            UserPreferences.set('theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
        }
    },

    /**
     * اللغة
     */
    language: {
        get: () => UserPreferences.get('language', 'ar'),
        set: (lang) => UserPreferences.set('language', lang)
    },

    /**
     * آخر صالون تمت زيارته
     */
    lastVisitedSalon: {
        get: () => UserPreferences.get('last_salon', null),
        set: (salonId) => UserPreferences.set('last_salon', salonId)
    },

    /**
     * آخر متجر تمت زيارته
     */
    lastVisitedStore: {
        get: () => UserPreferences.get('last_store', null),
        set: (storeId) => UserPreferences.set('last_store', storeId)
    },

    /**
     * الفئات المفضلة
     */
    favoriteCategories: {
        get: () => UserPreferences.get('favorite_categories', []),
        add: (categoryId) => {
            const favorites = UserPreferences.favoriteCategories.get();
            if (!favorites.includes(categoryId)) {
                favorites.push(categoryId);
                UserPreferences.set('favorite_categories', favorites);
            }
        },
        remove: (categoryId) => {
            const favorites = UserPreferences.favoriteCategories.get();
            const index = favorites.indexOf(categoryId);
            if (index > -1) {
                favorites.splice(index, 1);
                UserPreferences.set('favorite_categories', favorites);
            }
        },
        has: (categoryId) => UserPreferences.favoriteCategories.get().includes(categoryId)
    },

    /**
     * الصالونات المفضلة
     */
    favoriteSalons: {
        get: () => UserPreferences.get('favorite_salons', []),
        add: (salonId) => {
            const favorites = UserPreferences.favoriteSalons.get();
            if (!favorites.includes(salonId)) {
                favorites.push(salonId);
                UserPreferences.set('favorite_salons', favorites);
            }
        },
        remove: (salonId) => {
            const favorites = UserPreferences.favoriteSalons.get();
            const index = favorites.indexOf(salonId);
            if (index > -1) {
                favorites.splice(index, 1);
                UserPreferences.set('favorite_salons', favorites);
            }
        },
        has: (salonId) => UserPreferences.favoriteSalons.get().includes(salonId)
    },

    /**
     * البحث الأخير
     */
    recentSearches: {
        get: () => UserPreferences.get('recent_searches', []),
        add: (query) => {
            if (!query.trim()) return;
            const searches = UserPreferences.recentSearches.get();
            // إزالة التكرار
            const filtered = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
            // إضافة في البداية
            filtered.unshift({ query, timestamp: Date.now() });
            // الاحتفاظ بآخر 10 فقط
            UserPreferences.set('recent_searches', filtered.slice(0, 10));
        },
        clear: () => UserPreferences.set('recent_searches', [])
    },

    /**
     * حالة الاشتراك
     */
    subscription: {
        get: () => UserPreferences.get('subscription', null),
        set: (data) => UserPreferences.set('subscription', data),
        isActive: () => {
            const sub = UserPreferences.subscription.get();
            if (!sub) return false;
            return sub.status === 'active' && new Date(sub.expiresAt) > new Date();
        }
    },

    /**
     * الإشعارات
     */
    notifications: {
        get: () => UserPreferences.get('notifications_enabled', true),
        enable: () => UserPreferences.set('notifications_enabled', true),
        disable: () => UserPreferences.set('notifications_enabled', false),
        isEnabled: () => UserPreferences.get('notifications_enabled', true)
    }
};

/**
 * تطبيق الثيم المحفوظ عند تحميل الصفحة
 */
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const savedTheme = UserPreferences.theme.get();
        document.documentElement.setAttribute('data-theme', savedTheme);
    });
}

