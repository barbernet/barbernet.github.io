/**
 * BarberFlow Pro - صفحة استكشاف الصالونات
 * المسار: salons.js
 * الدور: عرض وتصفية صالونات الحلاقة
 */

import { db } from "./core/firebase-init.js";
import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { PATHS, resolvePath } from "./shared/js/paths.js";
import { createSalonCard } from "./shared/components/card-salon.js";
import { showNotification } from "./shared/js/notifications.js";

// ============================================
// عناصر DOM
// ============================================
const salonContainer = document.getElementById('salonContainer');
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const filterChips = document.querySelectorAll('.filter-chip');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const retryBtn = document.getElementById('retryBtn');
const salonsCount = document.getElementById('salonsCount');
const activeFilter = document.querySelector('#activeFilter span');

// ============================================
// المتغيرات العامة
// ============================================
let currentFilter = 'الكل';
let currentSearch = '';
let allSalons = [];

// ============================================
// خريطة أنواع الصالونات (تطابق add-salon.html)
// ============================================
const SALON_TYPES_MAP = {
    'رجال': 'صالون رجالي (حلاقة وعناية)',
    'نسائي': 'صالون نسائي (مركز تجميل)',
    'يونيسكس': 'صالون مشترك (يونيسكس)',
    'أطفال': 'صالون حلاقة للأطفال',
    'متنقل': 'صالون متنقل (خدمات منزلية وفندقية)',
    'سبا': 'مركز سبا واسترخاء (Spa & Wellness)'
};

// ============================================
// دوال مساعدة
// ============================================

/**
 * عرض حالة معينة وإخفاء الباقي
 */
function showState(state) {
    [loadingState, emptyState, errorState].forEach(el => {
        if (el) el.classList.add('hidden');
    });
    if (state) state.classList.remove('hidden');
}

/**
 * تحديث عدد الصالونات المعروضة
 */
function updateSalonsCount(count) {
    if (salonsCount) {
        salonsCount.textContent = count;
    }
}

/**
 * تحديث نص الفلتر النشط
 */
function updateActiveFilterText(filter) {
    if (activeFilter) {
        activeFilter.textContent = filter;
    }
}

// ============================================
// تحميل الصالونات من Firestore
// ============================================
async function loadSalons(filterType = 'الكل', searchText = '') {
    try {
        showState(loadingState);
        
        const salonsRef = collection(db, "salons");
        let q = salonsRef;
        
        // بناء الاستعلام حسب نوع التصفية
        if (filterType === 'المفضلة') {
            q = query(salonsRef, where("isLiked", "==", true));
        } else if (SALON_TYPES_MAP[filterType]) {
            q = query(salonsRef, where("salonType", "==", SALON_TYPES_MAP[filterType]));
        }
        
        const querySnapshot = await getDocs(q);
        
        // تحويل البيانات إلى مصفوفة
        allSalons = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        
        // تصفية حسب البحث
        const search = searchText.toLowerCase().trim();
        const filteredSalons = allSalons.filter(salon => {
            const name = (salon.salonName || "").toLowerCase();
            const location = (salon.location || "").toLowerCase();
            return !search || name.includes(search) || location.includes(search);
        });
        
        // ترتيب حسب التقييم (الأعلى أولاً)
        filteredSalons.sort((a, b) => {
            const ratingA = parseFloat(a.rating) || 0;
            const ratingB = parseFloat(b.rating) || 0;
            return ratingB - ratingA;
        });
        
        // تحديث الإحصائيات
        updateSalonsCount(filteredSalons.length);
        updateActiveFilterText(filterType);
        
        // عرض النتائج
        if (filteredSalons.length === 0) {
            showState(emptyState);
            if (salonContainer) salonContainer.innerHTML = '';
            return;
        }
        
        showState(null); // إخفاء جميع الحالات
        
        // إنشاء البطاقات بالتوازي
        if (salonContainer) {
            salonContainer.innerHTML = '';
            
            const cardPromises = filteredSalons.map(async (salonData) => {
                try {
                    return await createSalonCard(salonData, salonData.id);
                } catch (cardError) {
                    console.error("خطأ في إنشاء البطاقة:", cardError);
                    return null;
                }
            });
            
            const cards = await Promise.all(cardPromises);
            cards.forEach(card => {
                if (card) salonContainer.appendChild(card);
            });
        }
        
    } catch (error) {
        console.error("خطأ أثناء جلب البيانات:", error);
        showState(errorState);
        showNotification("حدث خطأ أثناء تحميل الصالونات", "error");
    }
}

// ============================================
// إعداد أزرار التصفية
// ============================================
filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
        // إزالة النشاط من جميع الأزرار
        filterChips.forEach(c => c.classList.remove('active'));
        
        // تفعيل الزر المضغوط
        chip.classList.add('active');
        
        const type = chip.getAttribute('data-type');
        currentFilter = type;
        
        // إعادة تحميل الصالونات
        loadSalons(currentFilter, currentSearch);
    });
});

// ============================================
// إعداد البحث مع تأخير (Debounce)
// ============================================
if (searchInput) {
    let timeout = null;
    
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        
        // إظهار/إخفاء زر المسح
        if (searchClearBtn) {
            searchClearBtn.style.display = value ? 'flex' : 'none';
        }
        
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            currentSearch = value;
            loadSalons(currentFilter, currentSearch);
        }, 300);
    });
}

// ============================================
// زر مسح البحث
// ============================================
if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
        if (searchInput) {
            searchInput.value = '';
            currentSearch = '';
            searchClearBtn.style.display = 'none';
            loadSalons(currentFilter, currentSearch);
        }
    });
}

// ============================================
// زر إعادة المحاولة
// ============================================
if (retryBtn) {
    retryBtn.addEventListener('click', () => {
        loadSalons(currentFilter, currentSearch);
    });
}

// ============================================
// تحميل أولي
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadSalons();
});

