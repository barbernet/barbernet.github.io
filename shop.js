/**
BarberFlow Pro - صفحة المتجر
المسار: shop.js
️ محدّث: استخدام createProductCards و createStoreCards
*/
import { supabase } from './config/supabase-init.js';
import { PATHS, resolvePath } from './shared/utils/paths.js';
import { createStoreCards } from './shared/components/card-store.js';
import { createProductCards } from './shared/components/card-product.js';
import { showNotification } from './shared/utils/notifications.js';
import { Analytics } from './shared/utils/analytics.js';
import { cacheFetch, cacheRemove } from './shared/utils/cache.js';
import { safeExecute } from './shared/utils/error-handler.js';
import { debounce } from './shared/utils/debounce.js';

// ============================================
// المتغيرات العامة
// ============================================
let currentView = 'all';
let currentCategory = 'all';
let currentStoreType = 'all';
let currentSort = 'popular';
let currentSearch = '';
let allStores = [];
let allProducts = [];
let displayedProducts = [];
const PRODUCTS_PER_PAGE = 8;
let currentPage = 1;

// ============================================
// مفاتيح localStorage للمفضلة
// ============================================
const FAVORITES_PRODUCTS_KEY = 'bf-favorites-products';
const FAVORITES_STORES_KEY = 'bf-favorites-stores';

// ============================================
// دوال مساعدة للمفضلة
// ============================================
function getFavoriteProducts() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_PRODUCTS_KEY) || '[]');
    } catch {
        return [];
    }
}

function getFavoriteStores() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_STORES_KEY) || '[]');
    } catch {
        return [];
    }
}

function isProductFavorite(productId) {
    return getFavoriteProducts().includes(productId);
}

function isStoreFavorite(storeId) {
    return getFavoriteStores().includes(storeId);
}

// ============================================
// خريطة التصنيفات
// ============================================
const CATEGORIES_MAP = {
    'tools': 'أدوات ومعدات',
    'cosmetics': 'مستحضرات تجميل',
    'haircare': 'العناية بالشعر',
    'beardcare': 'العناية باللحية',
    'skincare': 'العناية بالبشرة',
    'accessories': 'إكسسوارات'
};

// ============================================
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    updateAllPaths();
    initializeMainTabs();
    initializeCategoryFilters();
    initializeStoreFilters();
    initializeSort();
    initializeSearch();
    initializeRetryButtons();
    initializeLoadMore();
    initializeScrollReveal();
    
    readUrlParameters();
    await loadInitialData();
    
    Analytics.trackPageView('shop');
});

// ============================================
// تحديث جميع المسارات
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
// قراءة URL parameters
// ============================================
function readUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    const category = urlParams.get('category');
    const view = urlParams.get('view');
    
    if (search) {
        currentSearch = search;
        const searchInput = document.getElementById('shopSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        if (searchInput) searchInput.value = search;
        if (clearBtn) clearBtn.style.display = 'flex';
    }
    
    if (category) {
        currentCategory = category;
        const chip = document.querySelector(`.filter-chip[data-category="${category}"]`);
        if (chip) {
            document.querySelectorAll('#categoryFilters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        }
        currentView = 'products';
        const tab = document.querySelector(`.main-tab[data-view="products"]`);
        if (tab) {
            document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        }
    }
    
    if (view && ['all', 'stores', 'products'].includes(view)) {
        currentView = view;
        const tab = document.querySelector(`.main-tab[data-view="${view}"]`);
        if (tab) {
            document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        }
    }
}

// ============================================
// تحميل البيانات الأولية
// ============================================
async function loadInitialData() {
    showLoading();
    
    const [storesResult, productsResult] = await Promise.all([
        safeExecute(async () => {
            return await cacheFetch('shop_stores', async () => {
                const { data, error } = await supabase
                    .from('businesses')
                    .select(`
                        id,
                        name,
                        type,
                        city,
                        logo_url,
                        cover_url,
                        rating,
                        is_verified,
                        status,
                        created_at
                    `)
                    .eq('type', 'store')
                    .eq('status', 'active')
                    .order('rating', { ascending: false });
                if (error) throw error;
                return data || [];
            }, 10 * 60 * 1000);
        }, 'تحميل المتاجر'),
        
        safeExecute(async () => {
            return await cacheFetch('shop_products', async () => {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
                        id,
                        name,
                        description,
                        price,
                        old_price,
                        image_url,
                        category,
                        stock_quantity,
                        is_available,
                        is_new
                    `)
                    .eq('is_available', true)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                return data || [];
            }, 10 * 60 * 1000);
        }, 'تحميل المنتجات')
    ]);
    
    if (storesResult.success) {
        allStores = storesResult.data;
    }
    if (productsResult.success) {
        allProducts = productsResult.data;
    }
    
    if (!storesResult.success && !productsResult.success) {
        showError();
        return;
    }
    
    updateStats();
    applyFiltersAndRender();
    hideLoading();
}

// ============================================
// تطبيق الفلاتر والعرض
// ============================================
function applyFiltersAndRender() {
    renderStores();
    renderProducts();
    updateViewVisibility();
}

// ============================================
// تحديث رؤية الأقسام
// ============================================
function updateViewVisibility() {
    const storesView = document.getElementById('storesView');
    const productsView = document.getElementById('productsView');
    const categoryFiltersWrapper = document.getElementById('categoryFiltersWrapper');
    const storeFiltersWrapper = document.getElementById('storeFiltersWrapper');
    
    if (!storesView || !productsView) return;
    
    storesView.style.display = 'none';
    productsView.style.display = 'none';
    if (categoryFiltersWrapper) categoryFiltersWrapper.style.display = 'none';
    if (storeFiltersWrapper) storeFiltersWrapper.style.display = 'none';
    
    switch (currentView) {
        case 'all':
            storesView.style.display = 'block';
            productsView.style.display = 'block';
            break;
        case 'stores':
            storesView.style.display = 'block';
            if (storeFiltersWrapper) storeFiltersWrapper.style.display = 'block';
            break;
        case 'products':
            productsView.style.display = 'block';
            if (categoryFiltersWrapper) categoryFiltersWrapper.style.display = 'block';
            break;
    }
}

// ============================================
// ✅ عرض المتاجر (باستخدام createStoreCards)
// ============================================
async function renderStores() {
    const grid = document.getElementById('storesGrid');
    const resultsCount = document.getElementById('storesResultsCount');
    
    if (!grid) return;
    
    let filtered = [...allStores];
    
    // فلترة حسب النوع
    if (currentStoreType === 'favorites') {
        filtered = filtered.filter(s => isStoreFavorite(s.id));
    } else if (currentStoreType === 'verified') {
        filtered = filtered.filter(s => s.is_verified);
    } else if (currentStoreType === 'new') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(s => new Date(s.created_at) > thirtyDaysAgo);
    }
    
    // فلترة حسب البحث
    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        filtered = filtered.filter(s => {
            const name = (s.name || '').toLowerCase();
            const city = (s.city || '').toLowerCase();
            return name.includes(search) || city.includes(search);
        });
    }
    
    // الترتيب
    filtered = sortStores(filtered);
    
    if (resultsCount) {
        resultsCount.textContent = `${filtered.length} متجر`;
    }
    
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        const emptyMessage = currentStoreType === 'favorites'
            ? 'لم تقم بإضافة أي متجر إلى المفضلة بعد'
            : 'لا توجد متاجر متاحة حالياً';
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas ${currentStoreType === 'favorites' ? 'fa-heart' : 'fa-store'}"></i>
                <h3>${emptyMessage}</h3>
            </div>
        `;
        return;
    }
    
    // ✅ استخدام createStoreCards
    const cards = await createStoreCards(filtered);
    cards.forEach((card, index) => {
        grid.appendChild(card);
        setTimeout(() => {
            card.classList.add('revealed');
        }, index * 60);
    });
}

// ============================================
// ✅ عرض المنتجات (باستخدام createProductCards)
// ============================================
async function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const resultsCount = document.getElementById('productsResultsCount');
    const loadMoreWrapper = document.getElementById('loadMoreWrapper');
    
    if (!grid) return;
    
    let filtered = [...allProducts];
    
    // فلترة حسب التصنيف
    if (currentCategory === 'favorites') {
        filtered = filtered.filter(p => isProductFavorite(p.id));
    } else if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    // فلترة حسب البحث
    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        filtered = filtered.filter(p => {
            const name = (p.name || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            return name.includes(search) || desc.includes(search);
        });
    }
    
    // الترتيب
    filtered = sortProducts(filtered);
    displayedProducts = filtered;
    currentPage = 1;
    
    const endIndex = currentPage * PRODUCTS_PER_PAGE;
    const productsToShow = displayedProducts.slice(0, endIndex);
    
    if (resultsCount) {
        resultsCount.textContent = `${filtered.length} منتج`;
    }
    
    grid.innerHTML = '';
    
    if (productsToShow.length === 0) {
        const emptyMessage = currentCategory === 'favorites'
            ? 'لم تقم بإضافة أي منتج إلى المفضلة بعد'
            : 'لا توجد منتجات متاحة حالياً';
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas ${currentCategory === 'favorites' ? 'fa-heart' : 'fa-box-open'}"></i>
                <h3>${emptyMessage}</h3>
            </div>
        `;
        if (loadMoreWrapper) loadMoreWrapper.style.display = 'none';
        return;
    }
    
    // ✅ استخدام createProductCards
    const cards = await createProductCards(productsToShow);
    cards.forEach((card, index) => {
        grid.appendChild(card);
        setTimeout(() => {
            card.classList.add('revealed');
        }, index * 60);
    });
    
    // زر تحميل المزيد
    if (loadMoreWrapper) {
        if (endIndex < displayedProducts.length) {
            loadMoreWrapper.style.display = 'block';
        } else {
            loadMoreWrapper.style.display = 'none';
        }
    }
}

// ============================================
// ترتيب المتاجر
// ============================================
function sortStores(stores) {
    const sorted = [...stores];
    switch (currentSort) {
        case 'newest':
            return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'rating':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'popular':
        default:
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
}

// ============================================
// ترتيب المنتجات
// ============================================
function sortProducts(products) {
    const sorted = [...products];
    switch (currentSort) {
        case 'price-low':
            return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        case 'price-high':
            return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        case 'rating':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'newest':
            return sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        case 'popular':
        default:
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
}

// ============================================
// تحديث الإحصائيات
// ============================================
function updateStats() {
    const storesCount = document.getElementById('storesCount');
    const productsCount = document.getElementById('productsCount');
    const categoriesCount = document.getElementById('categoriesCount');
    
    if (storesCount) storesCount.textContent = allStores.length;
    if (productsCount) productsCount.textContent = allProducts.length;
    
    const uniqueCategories = new Set(allProducts.map(p => p.category).filter(Boolean));
    if (categoriesCount) categoriesCount.textContent = uniqueCategories.size;
}

// ============================================
// تهيئة التبويبات الرئيسية
// ============================================
function initializeMainTabs() {
    const tabs = document.querySelectorAll('.main-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentView = tab.dataset.view;
            
            if (currentView === 'stores') {
                if (currentStoreType !== 'favorites' && currentStoreType !== 'all') {
                    currentStoreType = 'all';
                    resetStoreFiltersUI();
                }
            } else if (currentView === 'products') {
                if (currentCategory !== 'favorites' && currentCategory !== 'all') {
                    currentCategory = 'all';
                    resetCategoryFiltersUI();
                }
            }
            
            applyFiltersAndRender();
            Analytics.trackClick('shop_tab', { view: currentView });
        });
    });
}

// ============================================
// تهيئة فلاتر التصنيفات
// ============================================
function initializeCategoryFilters() {
    const chips = document.querySelectorAll('#categoryFilters .filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategory = chip.dataset.category;
            applyFiltersAndRender();
            Analytics.trackClick('shop_category', { category: currentCategory });
        });
    });
}

// ============================================
// تهيئة فلاتر المتاجر
// ============================================
function initializeStoreFilters() {
    const chips = document.querySelectorAll('#storeFilters .filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentStoreType = chip.dataset.type;
            applyFiltersAndRender();
            Analytics.trackClick('shop_store_type', { type: currentStoreType });
        });
    });
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
        Analytics.trackClick('shop_sort', { sort: currentSort });
    });
}

// ============================================
// تهيئة البحث
// ============================================
function initializeSearch() {
    const searchInput = document.getElementById('shopSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (!searchInput) return;
    
    const debouncedSearch = debounce((value) => {
        currentSearch = value;
        applyFiltersAndRender();
        if (value.trim()) {
            Analytics.trackSearch(value, { page: 'shop' });
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
        await new Promise(resolve => setTimeout(resolve, 500));
        await renderProducts();
        
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
    const resetBtn = document.getElementById('resetBtn');
    
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            cacheRemove('shop_stores');
            cacheRemove('shop_products');
            loadInitialData();
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
    currentSearch = '';
    currentCategory = 'all';
    currentStoreType = 'all';
    currentSort = 'popular';
    currentView = 'all';
    currentPage = 1;
    
    const searchInput = document.getElementById('shopSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const sortSelect = document.getElementById('sortSelect');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (sortSelect) sortSelect.value = 'popular';
    
    document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.main-tab[data-view="all"]')?.classList.add('active');
    
    resetCategoryFiltersUI();
    resetStoreFiltersUI();
    
    applyFiltersAndRender();
    showNotification('تم إعادة تعيين الفلاتر', 'info');
}

// ============================================
// دوال مساعدة لإعادة تعيين UI
// ============================================
function resetCategoryFiltersUI() {
    document.querySelectorAll('#categoryFilters .filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('#categoryFilters .filter-chip[data-category="all"]')?.classList.add('active');
}

function resetStoreFiltersUI() {
    document.querySelectorAll('#storeFilters .filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('#storeFilters .filter-chip[data-type="all"]')?.classList.add('active');
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
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll('.store-card-v2, .store-card').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// حالات العرض
// ============================================
function showLoading() {
    const loading = document.getElementById('loadingState');
    if (loading) loading.style.display = 'block';
}

function hideLoading() {
    const loading = document.getElementById('loadingState');
    if (loading) loading.style.display = 'none';
}

function showError() {
    hideLoading();
    const errorState = document.getElementById('errorState');
    if (errorState) errorState.style.display = 'block';
}

