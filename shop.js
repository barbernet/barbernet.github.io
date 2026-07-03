/**
 * BarberFlow Pro - صفحة المتجر
 * المسار: store.js
 * الدور: عرض المتاجر والمنتجات مع فلاتر متقدمة
 */

import { db } from "./core/firebase-init.js";
import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { PATHS, resolvePath } from "./shared/js/paths.js";
import { createStoreCard } from "./shared/components/card-store.js";
import { showNotification } from "./shared/js/notifications.js";

// ============================================
// عناصر DOM
// ============================================
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const mainTabs = document.querySelectorAll('.main-tab');
const categoryFilters = document.querySelectorAll('#categoryFilters .filter-chip');
const storeFilters = document.querySelectorAll('#storeFilters .filter-chip');
const sortSelect = document.getElementById('sortSelect');
const storesView = document.getElementById('storesView');
const productsView = document.getElementById('productsView');
const storesGrid = document.getElementById('storesGrid');
const productsGrid = document.getElementById('productsGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const retryBtn = document.getElementById('retryBtn');
const resetBtn = document.getElementById('resetBtn');
const storesCount = document.getElementById('storesCount');
const productsCount = document.getElementById('productsCount');
const categoriesCount = document.getElementById('categoriesCount');
const storesResultsCount = document.getElementById('storesResultsCount');
const productsResultsCount = document.getElementById('productsResultsCount');
const categoryFiltersContainer = document.getElementById('categoryFilters');
const storeFiltersContainer = document.getElementById('storeFilters');

// ============================================
// المتغيرات العامة
// ============================================
let currentView = 'all'; // all, stores, products, favorites
let currentCategory = 'all';
let currentStoreType = 'all';
let currentSort = 'popular';
let currentSearch = '';
let allStores = [];
let allProducts = [];

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
// دوال مساعدة
// ============================================

function showState(state) {
    [loadingState, emptyState, errorState].forEach(el => {
        if (el) el.classList.add('hidden');
    });
    if (state) state.classList.remove('hidden');
}

function updateViewVisibility() {
    if (currentView === 'all' || currentView === 'stores') {
        storesView.classList.remove('hidden');
        categoryFiltersContainer.classList.add('hidden');
        storeFiltersContainer.classList.remove('hidden');
    } else {
        storesView.classList.add('hidden');
    }
    
    if (currentView === 'all' || currentView === 'products') {
        productsView.classList.remove('hidden');
        categoryFiltersContainer.classList.remove('hidden');
        storeFiltersContainer.classList.add('hidden');
    } else {
        productsView.classList.add('hidden');
    }
    
    if (currentView === 'favorites') {
        storesView.classList.add('hidden');
        productsView.classList.add('hidden');
        categoryFiltersContainer.classList.add('hidden');
        storeFiltersContainer.classList.add('hidden');
    }
}

// ============================================
// تحميل المتاجر
// ============================================
async function loadStores() {
    try {
        const storesRef = collection(db, "stores");
        const querySnapshot = await getDocs(storesRef);
        
        allStores = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        
        renderStores();
        updateStats();
    } catch (error) {
        console.error("خطأ في تحميل المتاجر:", error);
    }
}

// ============================================
// تحميل المنتجات
// ============================================
async function loadProducts() {
    try {
        const productsRef = collection(db, "products");
        const querySnapshot = await getDocs(productsRef);
        
        allProducts = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        
        renderProducts();
        updateStats();
    } catch (error) {
        console.error("خطأ في تحميل المنتجات:", error);
    }
}

// ============================================
// عرض المتاجر
// ============================================
function renderStores() {
    let filtered = allStores;
    
    // فلترة حسب النوع
    if (currentStoreType === 'featured') {
        filtered = filtered.filter(s => s.isFeatured);
    } else if (currentStoreType === 'verified') {
        filtered = filtered.filter(s => s.isVerified);
    } else if (currentStoreType === 'new') {
        filtered = filtered.filter(s => s.isNew);
    }
    
    // فلترة حسب البحث
    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        filtered = filtered.filter(s => {
            const name = (s.storeName || s.name || "").toLowerCase();
            const location = (s.location || "").toLowerCase();
            return name.includes(search) || location.includes(search);
        });
    }
    
    // فلترة المفضلة
    if (currentView === 'favorites') {
        filtered = filtered.filter(s => s.isLiked);
    }
    
    // الترتيب
    filtered = sortStores(filtered);
    
    // تحديث العداد
    if (storesResultsCount) {
        storesResultsCount.textContent = `${filtered.length} متجر`;
    }
    
    // عرض النتائج
    if (storesGrid) {
        storesGrid.innerHTML = '';
        
        if (filtered.length === 0) {
            if (currentView === 'all') {
                storesGrid.innerHTML = `
                    <div class="empty-state-inline">
                        <i class="fas fa-store"></i>
                        <p>لا توجد متاجر متاحة حالياً</p>
                    </div>
                `;
            }
            return;
        }
        
        filtered.forEach(store => {
            const card = createStoreCardElement(store);
            if (card) storesGrid.appendChild(card);
        });
    }
}

// ============================================
// إنشاء بطاقة متجر مخصصة
// ============================================
function createStoreCardElement(store) {
    const card = document.createElement('div');
    card.className = 'store-card-custom';
    card.dataset.id = store.id;
    
    const coverImage = store.coverImage || store.image;
    const logo = store.logo;
    const storeName = store.storeName || store.name || 'متجر غير مسمى';
    const location = store.location || 'المغرب';
    const rating = store.rating || 4.5;
    const productsCount = store.productsCount || 0;
    const isFeatured = store.isFeatured;
    const isVerified = store.isVerified;
    
    card.innerHTML = `
        <div class="store-card-custom__header">
            ${coverImage ? `<img src="${coverImage}" alt="${storeName}" class="store-card-custom__cover">` : 
              `<div class="store-card-custom__cover-placeholder"><i class="fas fa-store"></i></div>`}
            ${isFeatured ? `<div class="store-card-custom__badge featured"><i class="fas fa-crown"></i> مميز</div>` : ''}
            ${isVerified ? `<div class="store-card-custom__badge verified"><i class="fas fa-check-circle"></i> موثق</div>` : ''}
        </div>
        <div class="store-card-custom__body">
            ${logo ? `<img src="${logo}" alt="logo" class="store-card-custom__logo">` : 
              `<div class="store-card-custom__logo-placeholder"><i class="fas fa-store"></i></div>`}
            <h3 class="store-card-custom__name">${storeName}</h3>
            <div class="store-card-custom__location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${location}</span>
            </div>
            <div class="store-card-custom__stats">
                <div class="store-card-custom__stat">
                    <i class="fas fa-star"></i>
                    <span>${rating.toFixed(1)}</span>
                </div>
                <div class="store-card-custom__stat">
                    <i class="fas fa-box"></i>
                    <span>${productsCount} منتج</span>
                </div>
            </div>
        </div>
        <div class="store-card-custom__footer">
            <button class="store-card-custom__favorite ${store.isLiked ? 'active' : ''}" aria-label="إضافة للمفضلة">
                <i class="${store.isLiked ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <a href="${resolvePath('SHOP')}?store=${store.id}" class="store-card-custom__cta">
                <span>زيارة المتجر</span>
                <i class="fas fa-arrow-left"></i>
            </a>
        </div>
    `;
    
    // زر المفضلة
    const favoriteBtn = card.querySelector('.store-card-custom__favorite');
    favoriteBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        store.isLiked = !store.isLiked;
        favoriteBtn.classList.toggle('active', store.isLiked);
        const icon = favoriteBtn.querySelector('i');
        icon.className = store.isLiked ? 'fas fa-heart' : 'far fa-heart';
        showNotification(
            store.isLiked ? 'تمت إضافة المتجر للمفضلة' : 'تم إزالة المتجر من المفضلة',
            'success'
        );
    };
    
    return card;
}

// ============================================
// عرض المنتجات
// ============================================
function renderProducts() {
    let filtered = allProducts;
    
    // فلترة حسب التصنيف
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    // فلترة حسب البحث
    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        filtered = filtered.filter(p => {
            const name = (p.name || "").toLowerCase();
            const brand = (p.brand || "").toLowerCase();
            return name.includes(search) || brand.includes(search);
        });
    }
    
    // فلترة المفضلة
    if (currentView === 'favorites') {
        filtered = filtered.filter(p => p.isLiked);
    }
    
    // الترتيب
    filtered = sortProducts(filtered);
    
    // تحديث العداد
    if (productsResultsCount) {
        productsResultsCount.textContent = `${filtered.length} منتج`;
    }
    
    // عرض النتائج
    if (productsGrid) {
        productsGrid.innerHTML = '';
        
        if (filtered.length === 0) {
            if (currentView === 'all' || currentView === 'products') {
                productsGrid.innerHTML = `
                    <div class="empty-state-inline">
                        <i class="fas fa-box-open"></i>
                        <p>لا توجد منتجات متاحة حالياً</p>
                    </div>
                `;
            }
            return;
        }
        
        filtered.forEach(product => {
            const card = createProductCardElement(product);
            if (card) productsGrid.appendChild(card);
        });
    }
}

// ============================================
// إنشاء بطاقة منتج مخصصة
// ============================================
function createProductCardElement(product) {
    const card = document.createElement('div');
    card.className = 'product-card-custom';
    card.dataset.id = product.id;
    
    const image = product.image || product.imageUrl;
    const productName = product.name || 'منتج غير مسمى';
    const brand = product.brand;
    const category = product.category;
    const price = parseFloat(product.price) || 0;
    const oldPrice = parseFloat(product.oldPrice);
    const rating = parseFloat(product.rating) || 4.0;
    const discount = product.discount;
    const isNew = product.isNew;
    
    const categoryName = CATEGORIES_MAP[category] || category || 'عام';
    
    card.innerHTML = `
        <div class="product-card-custom__image-wrapper">
            ${image ? `<img src="${image}" alt="${productName}" class="product-card-custom__image">` : 
              `<div class="product-card-custom__image-placeholder"><i class="fas fa-box-open"></i></div>`}
            ${discount ? `<div class="product-card-custom__discount">-${discount}%</div>` : ''}
            ${isNew ? `<div class="product-card-custom__new">جديد</div>` : ''}
            <button class="product-card-custom__quick-view" aria-label="عرض سريع">
                <i class="fas fa-eye"></i>
            </button>
        </div>
        <div class="product-card-custom__content">
            <div class="product-card-custom__category">${categoryName}</div>
            <h3 class="product-card-custom__name">${productName}</h3>
            ${brand ? `<div class="product-card-custom__brand">الماركة: ${brand}</div>` : ''}
            <div class="product-card-custom__rating">
                <div class="product-card-custom__stars">
                    ${generateStars(rating)}
                </div>
                <span class="product-card-custom__rating-value">${rating.toFixed(1)}</span>
            </div>
            <div class="product-card-custom__price-wrapper">
                <div class="product-card-custom__price">
                    <span class="product-card-custom__price-current">${price} DH</span>
                    ${oldPrice ? `<span class="product-card-custom__price-old">${oldPrice} DH</span>` : ''}
                </div>
                <button class="product-card-custom__add-cart" aria-label="أضف إلى السلة">
                    <i class="fas fa-cart-plus"></i>
                </button>
            </div>
        </div>
    `;
    
    // زر إضافة للسلة
    const addToCartBtn = card.querySelector('.product-card-custom__add-cart');
    addToCartBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
    };
    
    // زر العرض السريع
    const quickViewBtn = card.querySelector('.product-card-custom__quick-view');
    quickViewBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showQuickView(product);
    };
    
    return card;
}

// ============================================
// توليد النجوم
// ============================================
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalf) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

// ============================================
// إضافة للسلة
// ============================================
function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem('bf-cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || product.imageUrl,
            quantity: 1
        });
    }
    
    localStorage.setItem('bf-cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('bf-cart-updated'));
    
    showNotification('تمت إضافة المنتج إلى السلة', 'success');
}

// ============================================
// عرض سريع
// ============================================
function showQuickView(product) {
    showNotification('ميزة العرض السريع قيد التطوير', 'info');
}

// ============================================
// ترتيب المتاجر
// ============================================
function sortStores(stores) {
    const sorted = [...stores];
    
    switch (currentSort) {
        case 'newest':
            return sorted.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || 0;
                const dateB = b.createdAt?.toDate?.() || 0;
                return dateB - dateA;
            });
        case 'rating':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'popular':
        default:
            return sorted.sort((a, b) => (b.productsCount || 0) - (a.productsCount || 0));
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
            return sorted.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || 0;
                const dateB = b.createdAt?.toDate?.() || 0;
                return dateB - dateA;
            });
        case 'popular':
        default:
            return sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    }
}

// ============================================
// تحديث الإحصائيات
// ============================================
function updateStats() {
    if (storesCount) storesCount.textContent = allStores.length;
    if (productsCount) productsCount.textContent = allProducts.length;
    
    const uniqueCategories = new Set(allProducts.map(p => p.category).filter(Boolean));
    if (categoriesCount) categoriesCount.textContent = uniqueCategories.size;
}

// ============================================
// إعادة تعيين الفلاتر
// ============================================
function resetFilters() {
    currentSearch = '';
    currentCategory = 'all';
    currentStoreType = 'all';
    currentSort = 'popular';
    
    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.style.display = 'none';
    if (sortSelect) sortSelect.value = 'popular';
    
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.querySelectorAll('.filter-chip[data-category="all"], .filter-chip[data-type="all"]').forEach(chip => {
        chip.classList.add('active');
    });
    
    renderStores();
    renderProducts();
    
    showNotification('تم إعادة تعيين الفلاتر', 'info');
}

// ============================================
// إعداد الأحداث
// ============================================

// التبويبات الرئيسية
mainTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        mainTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentView = tab.dataset.view;
        updateViewVisibility();
        renderStores();
        renderProducts();
    });
});

// فلاتر التصنيفات
categoryFilters.forEach(chip => {
    chip.addEventListener('click', () => {
        categoryFilters.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentCategory = chip.dataset.category;
        renderProducts();
    });
});

// فلاتر المتاجر
storeFilters.forEach(chip => {
    chip.addEventListener('click', () => {
        storeFilters.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentStoreType = chip.dataset.type;
        renderStores();
    });
});

// الترتيب
if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderStores();
        renderProducts();
    });
}

// البحث
if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (searchClearBtn) {
            searchClearBtn.style.display = value ? 'flex' : 'none';
        }
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            currentSearch = value;
            renderStores();
            renderProducts();
        }, 300);
    });
}

// مسح البحث
if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
        if (searchInput) {
            searchInput.value = '';
            currentSearch = '';
            searchClearBtn.style.display = 'none';
            renderStores();
            renderProducts();
        }
    });
}

// إعادة المحاولة
if (retryBtn) {
    retryBtn.addEventListener('click', () => {
        loadStores();
        loadProducts();
    });
}

// إعادة تعيين الفلاتر
if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
}

// ============================================
// التحميل الأولي
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    showState(loadingState);
    updateViewVisibility();
    
    await Promise.all([
        loadStores(),
        loadProducts()
    ]);
    
    showState(null);
});

