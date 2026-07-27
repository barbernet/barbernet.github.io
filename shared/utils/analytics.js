/**
 * BarberFlow Pro - تحليلات سلوك المستخدم
 * المسار: shared/utils/analytics.js
 * الدور: تتبع سلوك المستخدم لفهم المحتوى الأكثر شعبية
 *        وتحسين تجربة الاستخدام (يُخزّن محلياً في localStorage)
 */

// ============================================
// UserPreferences - كلاس مساعد لإدارة localStorage
// ⚠️ ملاحظة: إذا تم إنشاء user-preferences.js بشكل منفصل،
//             يمكن حذف هذا التعريف واستيراده من هناك
// ============================================
class UserPreferences {
    static PREFIX = 'bf_';

    static get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(`${this.PREFIX}${key}`);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error(`❌ Error reading "${key}" from localStorage:`, error);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(`${this.PREFIX}${key}`, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`❌ Error saving "${key}" to localStorage:`, error);
            return false;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(`${this.PREFIX}${key}`);
            return true;
        } catch (error) {
            console.error(`❌ Error removing "${key}" from localStorage:`, error);
            return false;
        }
    }

    static recentSearches = {
        MAX_SIZE: 10,
        KEY: 'recent_searches',

        add(query) {
            if (!query || typeof query !== 'string') return;
            const trimmed = query.trim();
            if (!trimmed) return;

            const list = UserPreferences.get(this.KEY, []);
            const filtered = list.filter(item => item !== trimmed);
            filtered.unshift(trimmed);
            UserPreferences.set(this.KEY, filtered.slice(0, this.MAX_SIZE));
        },

        get() {
            return UserPreferences.get(this.KEY, []);
        },

        clear() {
            UserPreferences.remove(this.KEY);
        }
    };
}

// ============================================
// Analytics - كائن التحليلات الرئيسي
// ============================================
export const Analytics = {
    /**
     * تتبع زيارة صفحة
     * @param {string} pageName - اسم الصفحة
     */
    trackPageView(pageName) {
        try {
            const views = UserPreferences.get('page_views', {});
            views[pageName] = (views[pageName] || 0) + 1;
            views[`${pageName}_last_visit`] = Date.now();
            UserPreferences.set('page_views', views);
            console.log(`📊 صفحة: ${pageName} (${views[pageName]} زيارة)`);
        } catch (error) {
            console.error('❌ خطأ في تتبع الزيارة:', error);
        }
    },

    /**
     * تتبع نقر على عنصر
     * @param {string} elementName - اسم العنصر
     * @param {Object} metadata - بيانات إضافية
     */
    trackClick(elementName, metadata = {}) {
        try {
            const clicks = UserPreferences.get('clicks', {});
            if (!clicks[elementName]) {
                clicks[elementName] = { count: 0, metadata: [] };
            }
            clicks[elementName].count++;
            clicks[elementName].metadata.push({
                ...metadata,
                timestamp: Date.now()
            });

            // الاحتفاظ بآخر 100 نقرة فقط
            if (clicks[elementName].metadata.length > 100) {
                clicks[elementName].metadata = clicks[elementName].metadata.slice(-100);
            }
            UserPreferences.set('clicks', clicks);
        } catch (error) {
            console.error('❌ خطأ في تتبع النقر:', error);
        }
    },

    /**
     * تتبع بحث
     * @param {string} query - نص البحث
     * @param {Object} filters - الفلاتر المستخدمة
     */
    trackSearch(query, filters = {}) {
        try {
            const searches = UserPreferences.get('searches', []);
            searches.push({
                query: query.trim(),
                filters,
                timestamp: Date.now(),
                results: 0
            });

            // الاحتفاظ بآخر 50 بحث فقط
            if (searches.length > 50) {
                searches.shift();
            }
            UserPreferences.set('searches', searches);

            // إضافة للبحث الأخير أيضاً
            UserPreferences.recentSearches.add(query);
        } catch (error) {
            console.error('❌ خطأ في تتبع البحث:', error);
        }
    },

    /**
     * تتبع مشاهدة منتج/خدمة/صالون
     * @param {string} itemId - المعرف
     * @param {string} type - النوع (product/service/salon)
     */
    trackView(itemId, type = 'product') {
        try {
            const views = UserPreferences.get('item_views', {});
            const key = `${type}_${itemId}`;

            if (!views[key]) {
                views[key] = {
                    count: 0,
                    type,
                    itemId,
                    firstView: Date.now(),
                    lastView: Date.now()
                };
            }
            views[key].count++;
            views[key].lastView = Date.now();
            UserPreferences.set('item_views', views);
        } catch (error) {
            console.error('❌ خطأ في تتبع المشاهدة:', error);
        }
    },

    /**
     * تتبع إضافة للمفضلة
     * @param {string} itemId - المعرف
     * @param {string} type - النوع
     */
    trackFavorite(itemId, type = 'product') {
        try {
            const favorites = UserPreferences.get('favorite_actions', []);
            favorites.push({
                itemId,
                type,
                action: 'add',
                timestamp: Date.now()
            });
            UserPreferences.set('favorite_actions', favorites);
        } catch (error) {
            console.error('❌ خطأ في تتبع المفضلة:', error);
        }
    },

    /**
     * تتبع حجز
     * @param {Object} bookingData - بيانات الحجز
     */
    trackBooking(bookingData) {
        try {
            const bookings = UserPreferences.get('booking_history', []);
            bookings.push({
                ...bookingData,
                timestamp: Date.now(),
                status: 'pending'
            });
            UserPreferences.set('booking_history', bookings);
        } catch (error) {
            console.error('❌ خطأ في تتبع الحجز:', error);
        }
    },

    /**
     * الحصول على التوصيات بناءً على السلوك
     * @returns {Object} التوصيات
     */
    getRecommendations() {
        try {
            const pageViews = UserPreferences.get('page_views', {});
            const itemViews = UserPreferences.get('item_views', {});
            const searches = UserPreferences.get('searches', []);
            const clicks = UserPreferences.get('clicks', {});

            // الصفحات الأكثر زيارة
            const topPages = Object.entries(pageViews)
                .filter(([key]) => !key.endsWith('_last_visit'))
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([page, count]) => ({ page, count }));

            // العناصر الأكثر مشاهدة
            const topItems = Object.values(itemViews)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // عمليات البحث الشائعة
            const searchQueries = searches
                .map(s => s.query)
                .filter((query, index, arr) => arr.indexOf(query) === index)
                .slice(0, 5);

            // الأزرار الأكثر نقراً
            const topClicks = Object.entries(clicks)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 5)
                .map(([element, data]) => ({ element, count: data.count }));

            return {
                topPages,
                topItems,
                searchQueries,
                topClicks,
                recentSearches: UserPreferences.recentSearches.get()
            };
        } catch (error) {
            console.error('❌ خطأ في الحصول على التوصيات:', error);
            return {};
        }
    },

    /**
     * الحصول على إحصائيات عامة
     * @returns {Object} الإحصائيات
     */
    getStats() {
        try {
            const pageViews = UserPreferences.get('page_views', {});
            const searches = UserPreferences.get('searches', []);
            const itemViews = UserPreferences.get('item_views', {});

            const totalPageViews = Object.entries(pageViews)
                .filter(([key]) => !key.endsWith('_last_visit'))
                .reduce((sum, [, count]) => sum + count, 0);

            return {
                totalPageViews,
                totalSearches: searches.length,
                totalItemViews: Object.values(itemViews).reduce((sum, v) => sum + v.count, 0),
                uniquePages: Object.keys(pageViews).filter(k => !k.endsWith('_last_visit')).length,
                uniqueItems: Object.keys(itemViews).length
            };
        } catch (error) {
            console.error('❌ خطأ في الحصول على الإحصائيات:', error);
            return {};
        }
    },

    /**
     * مسح جميع البيانات
     */
    clearAll() {
        try {
            UserPreferences.remove('page_views');
            UserPreferences.remove('clicks');
            UserPreferences.remove('searches');
            UserPreferences.remove('item_views');
            UserPreferences.remove('favorite_actions');
            UserPreferences.remove('booking_history');
            UserPreferences.recentSearches.clear();
            console.log('🗑️ تم مسح جميع بيانات التحليلات');
        } catch (error) {
            console.error('❌ خطأ في مسح البيانات:', error);
        }
    }
};

// ============================================
// تتبع تلقائي للزيارات عند تحميل الصفحة
// ============================================
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const pageName = window.location.pathname.split('/').pop() || 'home';
        Analytics.trackPageView(pageName);
    });
}

export default Analytics;

