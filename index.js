/**
BarberFlow Pro - المنطق الرئيسي للصفحة الرئيسية
المسار: index.js
⚠️ تم التحديث: Supabase + المكونات المشتركة + تحسينات الأداء
✅ تحديث 2026: فصل بطاقات المتاجر عن بطاقات المنتجات
*/
import { supabase } from './config/supabase-init.js';
import { PATHS, resolvePath } from './shared/utils/paths.js';
import { showNotification } from './shared/utils/notifications.js';
import { Analytics } from './shared/utils/analytics.js';
import { cacheFetch } from './shared/utils/cache.js';
import { safeExecute } from './shared/utils/error-handler.js';
import { createSalonCards } from './shared/components/card-salon.js';
import { createStoreCards } from './shared/components/card-store.js';
import { createProductCards } from './shared/components/card-product.js'; // ✅ إضافة استيراد بطاقة المنتج
import { createOfferCards } from './shared/components/card-offer.js';

// ============================================
// المتغيرات العامة
// ============================================
let allSalons = [];
let allProducts = [];
let currentSalonFilter = 'all';
let currentStoreFilter = 'all';

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

    // تحميل البيانات بالتوازي مع الكاش
    await Promise.all([
        loadSalons(),
        loadProducts(),
        renderOffers(),
        loadStatistics()
    ]);

    // تتبع الزيارة
    Analytics.trackPageView('home');
});

// ============================================
// ✅ تحديث جميع المسارات (data-path)
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
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// ============================================
// ✅ Scroll Reveal Animation
// ============================================
function initializeScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

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
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // اقتراحات البحث الديناميكية
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            suggestions.classList.remove('active');
            return;
        }

        // البحث في الصالونات المحملة
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

    // إخفاء الاقتراحات عند النقر خارجاً
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.remove('active');
        }
    });
}

// ============================================
// الفلاتر
// ============================================
function initializeFilters() {
    // فلاتر الصالونات
    const salonFilters = document.getElementById('salonFilters');
    if (salonFilters) {
        salonFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                salonFilters.querySelectorAll('.filter-chip').forEach(chip => {
                    chip.classList.remove('active');
                });
                e.target.classList.add('active');
                currentSalonFilter = e.target.dataset.filter;
                renderSalons();
                Analytics.trackClick('salon_filter', { filter: currentSalonFilter });
            }
        });
    }

    // فلاتر المتاجر/المنتجات
    const storeFilters = document.getElementById('storeFilters');
    if (storeFilters) {
        storeFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                storeFilters.querySelectorAll('.filter-chip').forEach(chip => {
                    chip.classList.remove('active');
                });
                e.target.classList.add('active');
                currentStoreFilter = e.target.dataset.filter;
                renderStores(); // ✅ يعرض المنتجات الآن
                Analytics.trackClick('store_filter', { filter: currentStoreFilter });
            }
        });
    }
}

// ============================================
// ✅ تحميل الصالونات (Supabase + Cache)
// ============================================
async function loadSalons() {
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
        }, 10 * 60 * 1000); // كاش 10 دقائق
    }, 'تحميل الصالونات');

    if (result.success) {
        allSalons = result.data;
        await renderSalons();
        updateSalonCounts();
    } else {
        const grid = document.getElementById('salonsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>حدث خطأ في تحميل الصالونات</h3>
                    <p>يرجى المحاولة لاحقاً</p>
                </div>
            `;
        }
    }
}

// ============================================
// ✅ تحميل المنتجات (Supabase + Cache) - محدث
// ============================================
async function loadProducts() {
    const result = await safeExecute(async () => {
        return await cacheFetch('home_products', async () => {
            const { data, error } = await supabase
                .from('products')
                .select(`id, name, price, old_price, image_url, category, is_available, is_new, stock_quantity`) // ✅ إزالة rating، إضافة الحقول الجديدة
                .eq('is_available', true)
                .order('created_at', { ascending: false }) // ✅ ترتيب حسب الأحدث بدلاً من rating
                .limit(8);

            if (error) throw error;
            return data || [];
        }, 10 * 60 * 1000); // كاش 10 دقائق
    }, 'تحميل المنتجات');

    if (result.success) {
        allProducts = result.data;
        await renderStores(); // ✅ يعرض المنتجات باستخدام createProductCards
    } else {
        const grid = document.getElementById('storesGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>حدث خطأ في تحميل المنتجات</h3>
                    <p>يرجى المحاولة لاحقاً</p>
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
            <div class="empty-state">
                <i class="fas fa-cut"></i>
                <h3>لا توجد صالونات متاحة حالياً</h3>
                <p>يرجى التحقق لاحقاً أو تغيير الفلتر</p>
            </div>
        `;
        return;
    }

    // ✅ استخدام المكون المشترك
    const cards = await createSalonCards(filteredSalons);
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
}

// ============================================
// ✅ عرض المنتجات (باستخدام card-product.js) - محدث
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
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد منتجات متاحة حالياً</h3>
                <p>يرجى التحقق لاحقاً أو تغيير الفلتر</p>
            </div>
        `;
        return;
    }

    // ✅ استخدام مكون بطاقة المنتج (وليس بطاقة المتجر)
    const cards = await createProductCards(filteredProducts);
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
}

// ============================================
// ✅ عرض العروض (باستخدام card-offer.js)
// ============================================
async function renderOffers() {
    const grid = document.getElementById('offersGrid');
    if (!grid) return;

    const cards = await createOfferCards(OFFERS_DATA);
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
}

// ============================================
// ✅ تحميل الإحصائيات (Supabase + Cache)
// ============================================
async function loadStatistics() {
    const result = await safeExecute(async () => {
        return await cacheFetch('home_stats', async () => {
            // جلب عدد الصالونات
            const { count: salonsCount } = await supabase
                .from('businesses')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'salon')
                .eq('status', 'active');

            // جلب عدد المتاجر
            const { count: storesCount } = await supabase
                .from('businesses')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'store')
                .eq('status', 'active');

            // جلب عدد الخدمات
            const { count: servicesCount } = await supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .eq('is_available', true);

            // جلب عدد الزبائن
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
        }, 30 * 60 * 1000); // كاش 30 دقيقة
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
// تحديث عدادات الفئات
// ============================================
function updateSalonCounts() {
    const menCount = allSalons.filter(s => s.type === 'men').length;
    const womenCount = allSalons.filter(s => s.type === 'women').length;
    const kidsCount = allSalons.filter(s => s.type === 'kids').length;

    const countMen = document.getElementById('countMen');
    const countWomen = document.getElementById('countWomen');
    const countKids = document.getElementById('countKids');

    if (countMen) countMen.textContent = `${menCount} صالون`;
    if (countWomen) countWomen.textContent = `${womenCount} صالون`;
    if (countKids) countKids.textContent = `${kidsCount} صالون`;
}

// ============================================
// ✅ أنيميشن العداد المحسّن
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

