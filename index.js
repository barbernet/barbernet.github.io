/**
 * BarberFlow Pro - المنطق الرئيسي للصفحة الرئيسية
 * المسار: index.js
 * ✅ تحديث 2026: Skeleton + Spinner Loading System
 * ✅ فصل بطاقات المتاجر عن بطاقات المنتجات
 */

import { supabase } from './config/supabase-init.js';
import { PATHS, resolvePath } from './shared/utils/paths.js';
import { showNotification } from './shared/utils/notifications.js';
import { Analytics } from './shared/utils/analytics.js';
import { cacheFetch } from './shared/utils/cache.js';
import { safeExecute } from './shared/utils/error-handler.js';
import { createSalonCards } from './shared/components/card-salon.js';
import { createStoreCards } from './shared/components/card-store.js';
import { createProductCards } from './shared/components/card-product.js';
import { createOfferCards } from './shared/components/card-offer.js';

// ============================================
// المتغيرات العامة
// ============================================
let allSalons = [];
let allProducts = [];
let currentSalonFilter = 'all';
let currentStoreFilter = 'all';

// ============================================
// 🆕 LOADING MANAGER - نظام التحميل المتكامل
// ============================================

/**
 * 🆕 إنشاء Skeleton لبطاقة صالون (HTML string)
 */
function createSalonSkeletonHTML() {
    return `
        <div class="skeleton-card" aria-hidden="true">
            <div class="skeleton-cover"></div>
            <div class="skeleton-logo"></div>
            <div class="skeleton-body">
                <div class="skeleton-line title"></div>
                <div class="skeleton-line subtitle"></div>
                <div class="skeleton-line meta"></div>
                <div class="skeleton-footer">
                    <div class="skeleton-rating">
                        <div class="skeleton-star"></div>
                        <div class="skeleton-star"></div>
                        <div class="skeleton-star"></div>
                        <div class="skeleton-star"></div>
                        <div class="skeleton-star"></div>
                    </div>
                    <div class="skeleton-price"></div>
                </div>
            </div>
        </div>`;
}

/**
 * 🆕 إنشاء Skeleton لبطاقة منتج (HTML string)
 */
function createProductSkeletonHTML() {
    return `
        <div class="skeleton-product" aria-hidden="true">
            <div class="skeleton-product-image"></div>
            <div class="skeleton-product-body">
                <div class="skeleton-line title"></div>
                <div class="skeleton-line subtitle"></div>
                <div class="skeleton-footer">
                    <div class="skeleton-price"></div>
                    <div class="skeleton-line meta" style="width:60px;margin:0"></div>
                </div>
            </div>
        </div>`;
}

/**
 * 🆕 إنشاء Skeleton لبطاقة عرض (HTML string)
 */
function createOfferSkeletonHTML() {
    return `
        <div class="skeleton-offer" aria-hidden="true">
            <div class="skeleton-offer-icon"></div>
            <div class="skeleton-offer-content">
                <div class="skeleton-line title"></div>
                <div class="skeleton-line subtitle"></div>
                <div class="skeleton-line meta"></div>
            </div>
        </div>`;
}

/**
 * 🆕 عرض Skeleton في حاوية
 * @param {string} targetId - معرف الحاوية
 * @param {'salon'|'product'|'offer'} type - نوع الـ skeleton
 * @param {number} count - عدد العناصر
 */
function showSkeleton(targetId, type = 'salon', count = 4) {
    const container = document.getElementById(targetId);
    if (!container) return;

    const creators = {
        salon: createSalonSkeletonHTML,
        product: createProductSkeletonHTML,
        offer: createOfferSkeletonHTML
    };

    const creator = creators[type] || createSalonSkeletonHTML;
    container.innerHTML = Array.from({ length: count }, () => creator()).join('');
    container.setAttribute('aria-busy', 'true');
}

/**
 * 🆕 إخفاء Skeleton (تنظيف الحاوية قبل عرض البيانات)
 */
function hideSkeleton(targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    container.setAttribute('aria-busy', 'false');
}

/**
 * 🆕 تحويل زر إلى حالة Spinner
 * @param {HTMLElement} button - الزر المستهدف
 */
function showButtonSpinner(button) {
    if (!button || button.classList.contains('btn-loading')) return;
    button.dataset.originalText = button.innerHTML;
    button.classList.add('btn-loading');
    button.disabled = true;
}

/**
 * 🆕 إعادة الزر لحالته الأصلية
 * @param {HTMLElement} button - الزر المستهدف
 */
function hideButtonSpinner(button) {
    if (!button) return;
    button.classList.remove('btn-loading');
    button.disabled = false;
    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        delete button.dataset.originalText;
    }
}

/**
 * 🆕 عرض Spinner في شاشة كاملة
 * @param {string} message - رسالة التحميل
 */
function showPageSpinner(message = 'جاري التحميل...') {
    const overlay = document.getElementById('pageSpinnerOverlay');
    const msgEl = document.getElementById('pageSpinnerMessage');
    if (!overlay) return;
    if (msgEl) msgEl.textContent = message;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
}

/**
 * 🆕 إخفاء Spinner الشاشة الكاملة
 */
function hidePageSpinner() {
    const overlay = document.getElementById('pageSpinnerOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
}

// ============================================
// بيانات العروض الثابتة
// ============================================
const OFFERS_DATA = [
    {
        id: 'offer_1',
        discount: '20%',
        title: 'أول حجز لك معنا',
        description: 'احجز موعدك الأول في أي صالون VIP واحصل على خصم فوري ومباشر.',
        ctaText: 'احجز الآن',
        ctaLink: PATHS.SALONS,
        icon: 'fa-cut'
    },
    {
        id: 'offer_2',
        discount: 'شحن مجاني',
        title: 'باقة العناية المتكاملة',
        description: 'اطلب منتجات بقيمة 300 درهم أو أكثر واحصل على توصيل مجاني.',
        ctaText: 'تصفح المتجر',
        ctaLink: PATHS.SHOP,
        icon: 'fa-truck'
    },
    {
        id: 'offer_3',
        discount: '35%',
        title: 'باقة العروس',
        description: 'خصومات حصرية تصل إلى 35% على خدمات تصفيف الشعر والمكياج المتكامل.',
        ctaText: 'اكتشفي العروض',
        ctaLink: `${PATHS.SALONS}?type=women`,
        icon: 'fa-gem'
    },
    {
        id: 'offer_4',
        discount: 'هدية مجانية',
        title: 'كوبون متجدد',
        description: 'احصل على مستحضر مجاني للعناية بالبشرة عند حجز خدمات تزيد عن 200 درهم.',
        ctaText: 'استخدم الكوبون',
        ctaLink: `${PATHS.SHOP}?category=cosmetics`,
        icon: 'fa-gift'
    }
];

// ============================================
// تهيئة الصفحة عند تحميل DOM
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    initializeHeaderScroll();
    initializeSearch();
    initializeFilters();
    initializeScrollReveal();
    updateAllPaths();

    // ✅ Skeleton موجود مسبقاً في HTML، نبدأ جلب البيانات فوراً
    await Promise.all([
        loadSalons(),
        loadProducts(),
        renderOffers(),
        loadStatistics()
    ]);

    Analytics.trackPageView('home');
});

// ============================================
// تحديث جميع المسارات (data-path)
// ============================================
function updateAllPaths() {
    const links = document.querySelectorAll('[data-path]');
    links.forEach(link => {
        const key = link.getAttribute('data-path');
        const fullPath = resolvePath(key);
        link.setAttribute('href', fullPath);
    });
}

// ============================================
// تأثير التمرير على الهيدر
// ============================================
function initializeHeaderScroll() {
    const header = document.querySelector('.main-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// ============================================
// Scroll Reveal Animation
// ============================================
function initializeScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-scroll-reveal]').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// البحث المحسّن
// ============================================
function initializeSearch() {
    const searchInput = document.getElementById('heroSearchInput');
    const searchBtn = document.getElementById('heroSearchBtn');
    const suggestions = document.getElementById('searchSuggestions');
    if (!searchInput || !searchBtn) return;

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            Analytics.trackSearch(query);
            window.location.href = `${PATHS.SALONS}?search=${encodeURIComponent(query)}`;
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });

    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            suggestions.classList.remove('active');
            return;
        }

        const filteredSalons = allSalons.filter(salon =>
            salon.name?.toLowerCase().includes(query) ||
            salon.city?.toLowerCase().includes(query)
        ).slice(0, 5);

        if (filteredSalons.length > 0) {
            suggestions.innerHTML = filteredSalons.map(salon => `
                <a href="${PATHS.DETAILS_SALON}?id=${salon.id}" class="suggestion-item">
                    <i class="fas fa-cut"></i>
                    <div>
                        <div class="suggestion-title">${salon.name}</div>
                        <div class="suggestion-subtitle">${salon.city || 'المغرب'}</div>
                    </div>
                </a>
            `).join('');
            suggestions.classList.add('active');
        } else {
            suggestions.classList.remove('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.remove('active');
        }
    });
}

// ============================================
// ✅ الفلاتر مع Spinner
// ============================================
function initializeFilters() {
    // فلاتر الصالونات
    const salonFilters = document.getElementById('salonFilters');
    if (salonFilters) {
        salonFilters.addEventListener('click', async (e) => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;

            // ✅ Spinner على زر الفلتر
            showButtonSpinner(chip);

            salonFilters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentSalonFilter = chip.dataset.filter;

            // ✅ عرض Skeleton أثناء التحميل
            showSkeleton('salonsGrid', 'salon', 4);

            await renderSalons();
            Analytics.trackClick('salon_filter', { filter: currentSalonFilter });

            // ✅ إعادة الزر
            hideButtonSpinner(chip);
        });
    }

    // فلاتر المنتجات
    const storeFilters = document.getElementById('storeFilters');
    if (storeFilters) {
        storeFilters.addEventListener('click', async (e) => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;

            // ✅ Spinner على زر الفلتر
            showButtonSpinner(chip);

            storeFilters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentStoreFilter = chip.dataset.filter;

            // ✅ عرض Skeleton أثناء التحميل
            showSkeleton('storesGrid', 'product', 4);

            await renderStores();
            Analytics.trackClick('store_filter', { filter: currentStoreFilter });

            // ✅ إعادة الزر
            hideButtonSpinner(chip);
        });
    }
}

// ============================================
// ✅ تحميل الصالونات (Supabase + Cache + Skeleton)
// ============================================
async function loadSalons() {
    // ✅ Skeleton موجود مسبقاً في HTML، لا نحتاج إعادة عرضه
    // لكن إذا كان الفلتر، نعرض skeleton جديد:
    // showSkeleton('salonsGrid', 'salon', 4); // مُفعّل عند الفلتر فقط

    const result = await safeExecute(async () => {
        return await cacheFetch('home_salons', async () => {
            const { data, error } = await supabase
                .from('businesses')
                .select(`id, name, type, city, cover_url, logo_url, rating, reviews_count, working_hours, is_verified`)
                .eq('type', 'salon')
                .eq('status', 'active')
                .order('rating', { ascending: false })
                .limit(8);

            if (error) throw error;
            return data || [];
        }, 10 * 60 * 1000);
    }, 'تحميل الصالونات');

    if (result.success) {
        allSalons = result.data;
        // ✅ إخفاء Skeleton وعرض البيانات
        hideSkeleton('salonsGrid');
        await renderSalons();
        updateSalonCounts();
    } else {
        hideSkeleton('salonsGrid');
        const grid = document.getElementById('salonsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                    <i class="fas fa-exclamation-circle" style="font-size:2.5rem;color:var(--gold-primary);margin-bottom:15px;display:block;"></i>
                    <h3>حدث خطأ في تحميل الصالونات</h3>
                    <p style="color:var(--text-muted);">يرجى المحاولة لاحقاً</p>
                    <button onclick="location.reload()" class="cta-btn primary" style="margin-top:15px;">
                        <i class="fas fa-redo"></i> إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }
}

// ============================================
// ✅ تحميل المنتجات (Supabase + Cache + Skeleton)
// ============================================
async function loadProducts() {
    const result = await safeExecute(async () => {
        return await cacheFetch('home_products', async () => {
            const { data, error } = await supabase
                .from('products')
                .select(`id, name, price, old_price, image_url, category, is_available, is_new, stock_quantity`)
                .eq('is_available', true)
                .order('id', { ascending: false }) // ✅ ترتيب حسب الأحدث
                .limit(8);

            if (error) throw error;
            return data || [];
        }, 10 * 60 * 1000);
    }, 'تحميل المنتجات');

    if (result.success) {
        allProducts = result.data;
        // ✅ إخفاء Skeleton وعرض البيانات
        hideSkeleton('storesGrid');
        await renderStores();
    } else {
        hideSkeleton('storesGrid');
        const grid = document.getElementById('storesGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                    <i class="fas fa-box-open" style="font-size:2.5rem;color:var(--gold-primary);margin-bottom:15px;display:block;"></i>
                    <h3>حدث خطأ في تحميل المنتجات</h3>
                    <p style="color:var(--text-muted);">يرجى المحاولة لاحقاً</p>
                </div>
            `;
        }
    }
}

// ============================================
// ✅ عرض الصالونات (باستخدام card-salon.js)
// ============================================
async function renderSalons() {
    const grid = document.getElementById('salonsGrid');
    if (!grid) return;

    let filteredSalons = allSalons;
    if (currentSalonFilter !== 'all') {
        filteredSalons = allSalons.filter(salon => salon.type === currentSalonFilter);
    }

    if (filteredSalons.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <i class="fas fa-cut" style="font-size:2.5rem;color:var(--gold-primary);margin-bottom:15px;display:block;"></i>
                <h3>لا توجد صالونات متاحة حالياً</h3>
                <p style="color:var(--text-muted);">يرجى التحقق لاحقاً أو تغيير الفلتر</p>
            </div>
        `;
        return;
    }

    const cards = await createSalonCards(filteredSalons);
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
}

// ============================================
// ✅ عرض المنتجات (باستخدام card-product.js)
// ============================================
async function renderStores() {
    const grid = document.getElementById('storesGrid');
    if (!grid) return;

    let filteredProducts = allProducts;
    if (currentStoreFilter !== 'all') {
        filteredProducts = allProducts.filter(product => product.category === currentStoreFilter);
    }

    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <i class="fas fa-box-open" style="font-size:2.5rem;color:var(--gold-primary);margin-bottom:15px;display:block;"></i>
                <h3>لا توجد منتجات متاحة حالياً</h3>
                <p style="color:var(--text-muted);">يرجى التحقق لاحقاً أو تغيير الفلتر</p>
            </div>
        `;
        return;
    }

    const cards = await createProductCards(filteredProducts);
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
}

// ============================================
// ✅ عرض العروض (باستخدام card-offer.js + Skeleton)
// ============================================
async function renderOffers() {
    const grid = document.getElementById('offersGrid');
    if (!grid) return;

    // ✅ Skeleton موجود مسبقاً في HTML
    // محاكاة تأخير بسيط لإظهار الـ skeleton (اختياري)
    await new Promise(resolve => setTimeout(resolve, 300));

    const cards = await createOfferCards(OFFERS_DATA);
    hideSkeleton('offersGrid');
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
}

// ============================================
// ✅ تحميل الإحصائيات (Supabase + Cache)
// ============================================
async function loadStatistics() {
    const result = await safeExecute(async () => {
        return await cacheFetch('home_stats', async () => {
            const { count: salonsCount } = await supabase
                .from('businesses')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'salon')
                .eq('status', 'active');

            const { count: storesCount } = await supabase
                .from('businesses')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'store')
                .eq('status', 'active');

            const { count: servicesCount } = await supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .eq('is_available', true);

            const { count: customersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'customer');

            return {
                salons: salonsCount || 0,
                stores: storesCount || 0,
                services: servicesCount || 0,
                customers: customersCount || 0
            };
        }, 30 * 60 * 1000);
    }, 'تحميل الإحصائيات');

    if (result.success) {
        const { salons, stores, services, customers } = result.data;
        animateCounter('statSalons', salons);
        animateCounter('statStores', stores);
        animateCounter('statServices', services);
        animateCounter('statCustomers', customers);
    }
}

// ============================================
// ✅ تحديث عدادات الفئات (مُصلح)
// ============================================
function updateSalonCounts() {
    // ✅ ملاحظة: حقل type في businesses هو 'salon' أو 'store'
    // للتمييز بين رجالي/نسائي/أطفال نحتاج حقل category أو target_audience
    // حالياً نعرض العدد الإجمالي كحل مؤقت
    const totalCount = allSalons.length;
    const countMen = document.getElementById('countMen');
    const countWomen = document.getElementById('countWomen');
    const countKids = document.getElementById('countKids');

    // ✅ حل مؤقت: توزيع تقريبي حتى يتم إضافة حقل category
    if (countMen) countMen.textContent = `${totalCount} صالون`;
    if (countWomen) countWomen.textContent = `${totalCount} صالون`;
    if (countKids) countKids.textContent = `${totalCount} صالون`;
}

// ============================================
// أنيميشن العداد المحسّن
// ============================================
function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let current = 0;
    const duration = 2000;
    const steps = 50;
    const increment = target / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString('ar-MA');
    }, stepTime);
}

