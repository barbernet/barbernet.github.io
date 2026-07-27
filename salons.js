/**
 * BarberFlow Pro - صفحة استكشاف الصالونات
 * المسار: salons.js
 * ⚠️ تم التحديث: Supabase + المكونات المشتركة + Cache + Error Handler
 */
import { supabase } from './config/supabase-init.js';
import { PATHS, resolvePath } from './shared/utils/paths.js';
import { createSalonCards } from './shared/components/card-salon.js';
import { showNotification } from './shared/utils/notifications.js';
import { Analytics } from './shared/utils/analytics.js';
import { cacheFetch, cacheRemove } from './shared/utils/cache.js';
import { safeExecute } from './shared/utils/error-handler.js';
import { debounce } from './shared/utils/debounce.js';

// ============================================
// المتغيرات العامة
// ============================================
let allSalons = [];
let displayedSalons = [];
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'rating_desc';
const ITEMS_PER_PAGE = 8;
let currentPage = 1;

// ============================================
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    updateAllPaths();
    initializeFilters();
    initializeSearch();
    initializeSort();
    initializeRetryButtons();
    initializeLoadMore();

    // تحميل الصالونات
    await loadSalons();

    // تتبع الزيارة
    Analytics.trackPageView('salons');
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
// ✅ تحميل الصالونات (Supabase + Cache)
// ============================================
async function loadSalons() {
    showLoading();

    const result = await safeExecute(async () => {
        return await cacheFetch('salons_all', async () => {
            const { data, error } = await supabase
                .from('businesses')
                .select(`
                    id,
                    name,
                    type,
                    city,
                    address,
                    cover_url,
                    logo_url,
                    rating,
                    reviews_count,
                    working_hours,
                    is_verified,
                    status,
                    created_at
                `)
                .eq('type', 'salon')
                .eq('status', 'active')
                .order('rating', { ascending: false });

            if (error) throw error;
            return data || [];
        }, 10 * 60 * 1000); // كاش 10 دقائق
    }, 'تحميل الصالونات');

    if (result.success) {
        allSalons = result.data;
        applyFiltersAndRender();
    } else {
        showError();
    }
}

// ============================================
// تطبيق الفلاتر والبحث والترتيب
// ============================================
function applyFiltersAndRender() {
    let filtered = [...allSalons];

    // 1. تطبيق الفلتر
    if (currentFilter !== 'all') {
        filtered = filtered.filter(salon => {
            // الفلتر يعتمد على حقل category أو type الفرعي
            return salon.category === currentFilter || salon.type === currentFilter;
        });
    }

    // 2. تطبيق البحث
    if (currentSearch.trim()) {
        const query = currentSearch.trim().toLowerCase();
        filtered = filtered.filter(salon =>
            salon.name?.toLowerCase().includes(query) ||
            salon.city?.toLowerCase().includes(query) ||
            salon.address?.toLowerCase().includes(query)
        );
    }

    // 3. تطبيق الترتيب
    filtered = sortSalons(filtered, currentSort);

    // 4. عرض النتائج
    displayedSalons = filtered;
    currentPage = 1;
    renderSalons();
    updateStats(filtered.length);
}

// ============================================
// ترتيب الصالونات
// ============================================
function sortSalons(salons, sortBy) {
    const sorted = [...salons];

    switch (sortBy) {
        case 'rating_desc':
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'rating_asc':
            sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
            break;
        case 'name_asc':
            sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
            break;
        case 'name_desc':
            sorted.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'ar'));
            break;
        case 'newest':
            sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        default:
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return sorted;
}

// ============================================
// ✅ عرض الصالونات (باستخدام card-salon.js)
// ============================================
async function renderSalons() {
    const grid = document.getElementById('salonsGrid');
    const emptyState = document.getElementById('emptyState');
    const loadMoreWrapper = document.getElementById('loadMoreWrapper');

    if (!grid) return;

    // إخفاء حالات الخطأ والتحميل
    hideLoading();
    hideError();

    // حساب العناصر المعروضة
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const salonsToShow = displayedSalons.slice(0, endIndex);

    // حالة فارغة
    if (salonsToShow.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (loadMoreWrapper) loadMoreWrapper.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // ✅ استخدام المكون المشترك
    const cards = await createSalonCards(salonsToShow);
    grid.innerHTML = '';
    cards.forEach((card, index) => {
        grid.appendChild(card);
        // Scroll Reveal مع تأخير تدريجي
        setTimeout(() => {
            card.classList.add('revealed');
        }, index * 80);
    });

    // زر تحميل المزيد
    if (loadMoreWrapper) {
        if (endIndex < displayedSalons.length) {
            loadMoreWrapper.style.display = 'block';
        } else {
            loadMoreWrapper.style.display = 'none';
        }
    }
}

// ============================================
// تحديث الإحصائيات
// ============================================
function updateStats(count) {
    const countEl = document.getElementById('salonsCount');
    const filterLabel = document.getElementById('activeFilterLabel');
    const filterName = document.getElementById('activeFilterName');

    if (countEl) {
        countEl.textContent = count;
    }

    if (filterLabel && filterName) {
        if (currentFilter !== 'all' || currentSearch.trim()) {
            filterLabel.style.display = 'flex';
            const filterNames = {
                'all': 'الكل',
                'men': 'رجالي',
                'women': 'نسائي',
                'kids': 'أطفال',
                'mixed': 'مختلط'
            };
            let label = filterNames[currentFilter] || 'الكل';
            if (currentSearch.trim()) {
                label += ` | بحث: "${currentSearch.trim()}"`;
            }
            filterName.textContent = label;
        } else {
            filterLabel.style.display = 'none';
        }
    }
}

// ============================================
// تهيئة الفلاتر
// ============================================
function initializeFilters() {
    const filtersContainer = document.getElementById('salonFilters');
    const clearFilterBtn = document.getElementById('clearFilterBtn');

    if (filtersContainer) {
        filtersContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;

            filtersContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            currentFilter = chip.dataset.filter;
            applyFiltersAndRender();

            Analytics.trackClick('salon_filter', { filter: currentFilter });
        });
    }

    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            resetFilters();
        });
    }
}

// ============================================
// تهيئة البحث (مع Debounce)
// ============================================
function initializeSearch() {
    const searchInput = document.getElementById('salonSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (!searchInput) return;

    // ✅ استخدام debounce لتجنب البحث عند كل حرف
    const debouncedSearch = debounce((value) => {
        currentSearch = value;
        applyFiltersAndRender();

        if (value.trim()) {
            Analytics.trackSearch(value, { page: 'salons' });
        }
    }, 400);

    searchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (clearBtn) {
            clearBtn.style.display = value ? 'flex' : 'none';
        }
        debouncedSearch(value);
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            currentSearch = '';
            applyFiltersAndRender();
            searchInput.focus();
        });
    }

    // قراءة معامل البحث من URL (إن وجد)
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const typeParam = urlParams.get('type');

    if (searchParam) {
        searchInput.value = searchParam;
        currentSearch = searchParam;
        if (clearBtn) clearBtn.style.display = 'flex';
    }

    if (typeParam) {
        currentFilter = typeParam;
        const chip = document.querySelector(`.filter-chip[data-filter="${typeParam}"]`);
        if (chip) {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        }
    }
}

// ============================================
// تهيئة الترتيب
// ============================================
function initializeSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndRender();
        Analytics.trackClick('salon_sort', { sort: currentSort });
    });
}

// ============================================
// تهيئة زر تحميل المزيد
// ============================================
function initializeLoadMore() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;

    loadMoreBtn.addEventListener('click', async () => {
        loadMoreBtn.classList.add('loading');
        loadMoreBtn.querySelector('i').className = 'fas fa-spinner';
        loadMoreBtn.querySelector('span').textContent = 'جاري التحميل...';

        currentPage++;

        // تأخير بسيط لتأثير بصري
        await new Promise(resolve => setTimeout(resolve, 500));

        await renderSalons();

        loadMoreBtn.classList.remove('loading');
        loadMoreBtn.querySelector('i').className = 'fas fa-plus-circle';
        loadMoreBtn.querySelector('span').textContent = 'تحميل المزيد';
    });
}

// ============================================
// تهيئة أزرار إعادة المحاولة
// ============================================
function initializeRetryButtons() {
    const retryBtn = document.getElementById('retryBtn');
    const resetBtn = document.getElementById('resetFiltersBtn');

    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            cacheRemove('salons_all'); // مسح الكاش القديم
            loadSalons();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetFilters();
        });
    }
}

// ============================================
// إعادة تعيين الفلاتر
// ============================================
function resetFilters() {
    currentFilter = 'all';
    currentSearch = '';
    currentSort = 'rating_desc';
    currentPage = 1;

    // إعادة تعيين UI
    const searchInput = document.getElementById('salonSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const sortSelect = document.getElementById('sortSelect');

    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (sortSelect) sortSelect.value = 'rating_desc';

    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    const allChip = document.querySelector('.filter-chip[data-filter="all"]');
    if (allChip) allChip.classList.add('active');

    applyFiltersAndRender();
}

// ============================================
// حالات العرض (Loading / Error)
// ============================================
function showLoading() {
    const loading = document.getElementById('loadingState');
    const grid = document.getElementById('salonsGrid');
    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';
}

function hideLoading() {
    const loading = document.getElementById('loadingState');
    if (loading) loading.style.display = 'none';
}

function showError() {
    hideLoading();
    const errorState = document.getElementById('errorState');
    const grid = document.getElementById('salonsGrid');
    if (errorState) errorState.style.display = 'block';
    if (grid) grid.innerHTML = '';
}

function hideError() {
    const errorState = document.getElementById('errorState');
    if (errorState) errorState.style.display = 'none';
}

