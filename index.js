/**
 * BarberFlow Pro - المنطق الرئيسي للصفحة الرئيسية
 * المسار: home-controller.js
 */

import { db } from "./core/firebase-init.js";
import {
    collection,
    getDocs,
    query,
    where,
    limit,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { PATHS, resolvePath } from "./shared/js/paths.js";
import { showNotification } from "./shared/js/notifications.js";

// ============================================
// المتغيرات العامة
// ============================================
let allSalons = [];
let allStores = [];
let currentSalonFilter = 'all';
let currentStoreFilter = 'all';

// ============================================
// بيانات العروض الثابتة
// ============================================
const OFFERS_DATA = [
    {
        id: 1,
        discount: "خصم 20%",
        title: "أول حجز لك معنا",
        description: "احجز موعدك الأول في أي صالون VIP واحصل على خصم فوري ومباشر.",
        ctaText: "احجز الآن",
        ctaLink: PATHS.SALONS,
        icon: "fa-cut"
    },
    {
        id: 2,
        discount: "شحن مجاني",
        title: "باقة العناية المتكاملة",
        description: "اطلب منتجات بقيمة 300 درهم أو أكثر واحصل على توصيل مجاني.",
        ctaText: "تصفح المتجر",
        ctaLink: PATHS.SHOP,
        icon: "fa-truck"
    },
    {
        id: 3,
        discount: "خصم 35%",
        title: "باقة العروس",
        description: "خصومات حصرية تصل إلى 35% على خدمات تصفيف الشعر والمكياج المتكامل.",
        ctaText: "اكتشفي العروض",
        ctaLink: `${PATHS.SALONS}?type=women`,
        icon: "fa-gem"
    },
    {
        id: 4,
        discount: "هدية مجانية",
        title: "كوبون متجدد",
        description: "احصل على مستحضر مجاني للعناية بالبشرة عند حجز خدمات تزيد عن 200 درهم.",
        ctaText: "استخدم الكوبون",
        ctaLink: `${PATHS.SHOP}?category=cosmetics`,
        icon: "fa-gift"
    }
];

// ============================================
// تهيئة الصفحة عند تحميل DOM
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    initializeHeaderScroll();
    initializeSearch();
    initializeFilters();
    
    // تحميل البيانات بالتوازي
    await Promise.all([
        loadSalons(),
        loadStores(),
        renderOffers(),
        loadStatistics()
    ]);
});

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
// البحث
// ============================================
function initializeSearch() {
    const searchInput = document.getElementById('heroSearchInput');
    const searchBtn = document.getElementById('heroSearchBtn');
    const suggestions = document.getElementById('searchSuggestions');
    
    if (!searchInput || !searchBtn) return;
    
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            // توجيه إلى صفحة البحث
            window.location.href = `${PATHS.SALONS}?search=${encodeURIComponent(query)}`;
        }
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
    
    // اقتراحات البحث
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            suggestions.classList.remove('active');
            return;
        }
        
        // عرض الاقتراحات من الصالونات
        const filteredSalons = allSalons.filter(salon => 
            salon.name.toLowerCase().includes(query) ||
            salon.city?.toLowerCase().includes(query)
        ).slice(0, 5);
        
        if (filteredSalons.length > 0) {
            suggestions.innerHTML = filteredSalons.map(salon => `
                <a href="${PATHS.SALONS}?id=${salon.id}" class="suggestion-item">
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
            }
        });
    }
    
    // فلاتر المتاجر
    const storeFilters = document.getElementById('storeFilters');
    if (storeFilters) {
        storeFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                storeFilters.querySelectorAll('.filter-chip').forEach(chip => {
                    chip.classList.remove('active');
                });
                e.target.classList.add('active');
                currentStoreFilter = e.target.dataset.filter;
                renderStores();
            }
        });
    }
}

// ============================================
// تحميل الصالونات
// ============================================
async function loadSalons() {
    try {
        const salonsRef = collection(db, "salons");
        const q = query(salonsRef, where("status", "==", "active"), limit(8));
        const querySnapshot = await getDocs(q);
        
        allSalons = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderSalons();
        updateSalonCounts();
    } catch (error) {
        console.error("Error loading salons:", error);
    }
}

// ============================================
// تحميل المتاجر
// ============================================
async function loadStores() {
    try {
        const storesRef = collection(db, "stores");
        const q = query(storesRef, where("status", "==", "active"), limit(8));
        const querySnapshot = await getDocs(q);
        
        allStores = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderStores();
    } catch (error) {
        console.error("Error loading stores:", error);
    }
}

// ============================================
// عرض الصالونات
// ============================================
function renderSalons() {
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
    
    grid.innerHTML = filteredSalons.map(salon => `
        <a href="${PATHS.SALONS}?id=${salon.id}" class="salon-card">
            <div class="salon-card-image">
                <img src="${salon.image || 'assets/images/placeholder-salon.jpg'}" alt="${salon.name}">
                ${salon.rating ? `<div class="salon-rating"><i class="fas fa-star"></i> ${salon.rating}</div>` : ''}
            </div>
            <div class="salon-card-content">
                <h3>${salon.name}</h3>
                <p class="salon-location"><i class="fas fa-map-marker-alt"></i> ${salon.city || 'المغرب'}</p>
                <div class="salon-card-footer">
                    <span class="salon-price">يبدأ من ${salon.price || '100'} درهم</span>
                    <button class="salon-book-btn">احجز الآن</button>
                </div>
            </div>
        </a>
    `).join('');
}

// ============================================
// عرض المتاجر
// ============================================
function renderStores() {
    const grid = document.getElementById('storesGrid');
    if (!grid) return;
    
    let filteredStores = allStores;
    
    if (currentStoreFilter !== 'all') {
        filteredStores = allStores.filter(store => store.category === currentStoreFilter);
    }
    
    if (filteredStores.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-store"></i>
                <h3>لا توجد منتجات متاحة حالياً</h3>
                <p>يرجى التحقق لاحقاً أو تغيير الفلتر</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredStores.map(store => `
        <a href="${PATHS.SHOP}?id=${store.id}" class="store-card">
            <div class="store-card-image">
                <img src="${store.image || 'assets/images/placeholder-product.jpg'}" alt="${store.name}">
                ${store.discount ? `<div class="store-discount">${store.discount}</div>` : ''}
            </div>
            <div class="store-card-content">
                <h3>${store.name}</h3>
                <p class="store-category">${store.categoryName || 'منتج'}</p>
                <div class="store-card-footer">
                    <span class="store-price">${store.price || '0'} درهم</span>
                    <button class="store-add-btn"><i class="fas fa-cart-plus"></i></button>
                </div>
            </div>
        </a>
    `).join('');
}

// ============================================
// عرض العروض
// ============================================
function renderOffers() {
    const grid = document.getElementById('offersGrid');
    if (!grid) return;
    
    grid.innerHTML = OFFERS_DATA.map(offer => `
        <div class="offer-card">
            <div class="offer-discount">${offer.discount}</div>
            <h3>${offer.title}</h3>
            <p>${offer.description}</p>
            <a href="${offer.ctaLink}" class="offer-cta">
                <span>${offer.ctaText}</span>
                <i class="fas fa-arrow-left"></i>
            </a>
        </div>
    `).join('');
}

// ============================================
// تحميل الإحصائيات
// ============================================
async function loadStatistics() {
    try {
        // عدد الصالونات
        const salonsRef = collection(db, "salons");
        const salonsSnapshot = await getDocs(salonsRef);
        const salonsCount = salonsSnapshot.size;
        
        // عدد المتاجر
        const storesRef = collection(db, "stores");
        const storesSnapshot = await getDocs(storesRef);
        const storesCount = storesSnapshot.size;
        
        // عدد الخدمات (تقريبي)
        const servicesCount = salonsCount * 5; // متوسط 5 خدمات لكل صالون
        
        // تحديث العدادات
        animateCounter('statSalons', salonsCount);
        animateCounter('statStores', storesCount);
        animateCounter('statServices', servicesCount);
        
    } catch (error) {
        console.error("Error loading statistics:", error);
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
    
    if (countMen) countMen.textContent = menCount;
    if (countWomen) countWomen.textContent = womenCount;
    if (countKids) countKids.textContent = kidsCount;
}

// ============================================
// أنيميشن العداد
// ============================================
function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = target / 50;
    const duration = 2000;
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, stepTime);
}

