/**
 * BarberFlow Pro - تحليلات سلوك المستخدم
 * المسار: shared/utils/analytics.js
 * 
 * تتبع سلوك المستخدم لفهم المحتوى الأكثر شعبية
 * وتحسين تجربة الاستخدام
 */

import { UserPreferences } from './user-preferences.js';

/**
 * كائن التحليلات
 */
export const Analytics = {
    /**
     * تتبع زيارة صفحة
     * 
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
     * 
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
     * 
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
                results: 0 // يمكن تحديثه لاحقاً
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
     * تتبع مشاهدة منتج/خدمة
     * 
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
     * 
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
     * 
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
     * 
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
     * 
     * @returns {Object} الإحصائيات
     */
    getStats() {
        try {
            const pageViews = UserPreferences.get('page_views', {});
            const searches = UserPreferences.get('searches', []);
            const itemViews = UserPreferences.get('item_views', {});
            
            const totalPageViews = Object.values(pageViews)
                .filter((_, index, arr) => index % 2 === 0) // استبعاد _last_visit
                .reduce((sum, count) => sum + count, 0);
            
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
            console.log('🗑️ تم مسح جميع بيانات التحليلات');
        } catch (error) {
            console.error('❌ خطأ في مسح البيانات:', error);
        }
    }
};

/**
 * تتبع تلقائي للزيارات
 */
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // تتبع الصفحة الحالية
        const pageName = window.location.pathname.split('/').pop() || 'home';
        Analytics.trackPageView(pageName);
    });
}

