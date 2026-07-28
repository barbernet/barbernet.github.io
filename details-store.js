/**
 * BarberFlow Pro - صفحة تفاصيل المتجر
 * المسار: details-store.js
 * ✅ بناء جديد كلياً - Supabase + البطاقات المشتركة
 * ✅ لا تعرض معلومات التواصل المباشرة (قرار معماري)
 */

import { supabase } from './config/supabase-init.js';
import { showNotification } from './shared/utils/notifications.js';
import { PATHS, resolvePath } from './shared/utils/paths.js';
import { createProductCards } from './shared/components/card-product.js';
import { createReviewCards } from './shared/components/card-review.js';

// ============================================
// المتغيرات العامة
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const storeId = urlParams.get('id');
let currentUser = null;
let storeData = null;
let allProducts = [];
let allReviews = [];
let currentProductFilter = 'all';
let selectedRating = 0;
let isFavorite = false;

// ============================================
// التحقق من معرف المتجر
// ============================================
if (!storeId) {
    showNotification("الرابط غير صالح، لم يتم تحديد المتجر", "error");
    setTimeout(() => {
        window.location.replace(resolvePath('SHOP'));
    }, 2000);
}

// ============================================
// زر العودة
// ============================================
const backBtn = document.getElementById('backBtn');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        if (document.referrer && document.referrer.includes(window.location.hostname)) {
            window.history.back();
        } else {
            window.location.href = resolvePath('SHOP');
        }
    });
}

// ============================================
// مراقبة حالة المصادقة
// ============================================
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    if (storeId) {
        await loadStoreDetails();
    }
});

// ============================================
// تحميل تفاصيل المتجر
// ============================================
async function loadStoreDetails() {
    try {
        const { data: store, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', storeId)
            .eq('type', 'store')
            .single();

        if (error || !store) {
            showNotification("هذا المتجر غير موجود أو تم حذفه", "error");
            setTimeout(() => {
                window.location.replace(resolvePath('SHOP'));
            }, 2000);
            return;
        }

        storeData = { id: storeId, ...store };
        renderStoreInfo(storeData);
        updateStoreStatus(storeData.working_hours);
        renderWorkingHours(storeData.working_hours);
        await checkFavoriteStatus();
        await loadProducts();
        await loadReviews();
        setupEventListeners();
        updateDynamicLinks();
    } catch (error) {
        console.error("خطأ في تحميل تفاصيل المتجر:", error);
        showNotification("حدث خطأ في تحميل البيانات", "error");
    }
}

// ============================================
// عرض معلومات المتجر
// ============================================
function renderStoreInfo(data) {
    // صورة الغلاف
    const heroImage = document.getElementById('heroImage');
    const heroPlaceholder = document.getElementById('heroPlaceholder');
    if (data.cover_url) {
        heroImage.src = data.cover_url;
        heroImage.style.display = 'block';
        heroPlaceholder.style.display = 'none';
        heroImage.onerror = () => {
            heroImage.style.display = 'none';
            heroPlaceholder.style.display = 'flex';
            heroImage.onerror = null;
        };
    }

    // الشعار
    const storeLogo = document.getElementById('storeLogo');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    if (data.logo_url) {
        storeLogo.src = data.logo_url;
        storeLogo.style.display = 'block';
        logoPlaceholder.style.display = 'none';
        storeLogo.onerror = () => {
            storeLogo.style.display = 'none';
            logoPlaceholder.style.display = 'flex';
            storeLogo.onerror = null;
        };
    }

    // المعلومات الأساسية
    setText('storeName', data.name || "متجر غير مسمى");
    setText('storeCity', data.city || "الموقع غير محدد");
    setText('storeRating', (parseFloat(data.rating) || 0).toFixed(1));
    setText('storeReviewsCount', `(${data.reviews_count || 0} تقييم)`);

    // الشارات
    if (data.is_verified) {
        showElement('verifiedBadge');
    }

    // عن المتجر
    setText('storeDescription', data.description || "مرحباً بكم في متجرنا المميز.");

    // عنوان الصفحة
    document.title = `${data.name || 'متجر'} | BarberFlow Pro`;
}

// ============================================
// تحديث حالة المتجر (مفتوح/مغلق)
// ============================================
function updateStoreStatus(hours) {
    const badge = document.getElementById('statusBadge');
    if (!hours?.open || !hours?.close) {
        badge.innerHTML = '<i class="fas fa-clock"></i> <span>غير محدد</span>';
        return;
    }

    const now = new Date();
    const curr = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = hours.open.split(':').map(Number);
    const [ch, cm] = hours.close.split(':').map(Number);
    const ot = oh * 60 + om;
    const ct = ch * 60 + cm;
    const isOpen = ct > ot ? (curr >= ot && curr < ct) : (curr >= ot || curr < ct);

    badge.className = `badge status ${isOpen ? 'open' : 'closed'}`;
    badge.innerHTML = `<i class="fas fa-${isOpen ? 'check-circle' : 'times-circle'}"></i> <span>${isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}</span>`;
}

// ============================================
// عرض أوقات العمل
// ============================================
function renderWorkingHours(hours) {
    const container = document.getElementById('workingHoursList');
    if (!container) return;

    const days = [
        { key: 'sun', name: 'الأحد' },
        { key: 'mon', name: 'الإثنين' },
        { key: 'tue', name: 'الثلاثاء' },
        { key: 'wed', name: 'الأربعاء' },
        { key: 'thu', name: 'الخميس' },
        { key: 'fri', name: 'الجمعة' },
        { key: 'sat', name: 'السبت' }
    ];

    if (!hours?.days || hours.days.length === 0) {
        container.innerHTML = `
            <div class="hours-row">
                <i class="fas fa-clock"></i>
                <span>أوقات العمل غير محددة</span>
            </div>
        `;
        return;
    }

    container.innerHTML = days.map(day => {
        const isWorking = hours.days.includes(day.key);
        return `
            <div class="hours-row ${isWorking ? '' : 'closed'}">
                <i class="fas fa-calendar-day"></i>
                <span class="day-name">${day.name}</span>
                <span class="day-hours">${isWorking ? `${hours.open} - ${hours.close}` : 'مغلق'}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// التحقق من حالة المفضلة
// ============================================
async function checkFavoriteStatus() {
    if (!currentUser) {
        updateFavoriteUI(false);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('item_id', storeId)
            .eq('item_type', 'store')
            .single();

        isFavorite = !error && data;
        updateFavoriteUI(isFavorite);
    } catch (error) {
        console.error("خطأ في التحقق من المفضلة:", error);
    }
}

// ============================================
// تحديث واجهة المفضلة
// ============================================
function updateFavoriteUI(liked) {
    const btn = document.getElementById('favoriteBtn');
    const icon = btn?.querySelector('i');
    if (!btn || !icon) return;

    isFavorite = liked;
    icon.className = liked ? 'fas fa-heart' : 'far fa-heart';
    btn.classList.toggle('active', liked);
}

// ============================================
// تبديل المفضلة
// ============================================
async function toggleFavorite() {
    if (!currentUser) {
        showNotification("يرجى تسجيل الدخول لإضافة المتجر للمفضلة", "warning");
        setTimeout(() => {
            window.location.href = resolvePath('LOGIN');
        }, 1500);
        return;
    }

    const newLikedState = !isFavorite;
    updateFavoriteUI(newLikedState);

    try {
        if (newLikedState) {
            const { error } = await supabase
                .from('favorites')
                .insert({
                    user_id: currentUser.id,
                    item_id: storeId,
                    item_type: 'store'
                });
            if (error) throw error;
            showNotification("تمت إضافة المتجر للمفضلة", "success");
        } else {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('item_id', storeId)
                .eq('item_type', 'store');
            if (error) throw error;
            showNotification("تمت إزالة المتجر من المفضلة", "info");
        }
    } catch (error) {
        console.error("خطأ في تحديث المفضلة:", error);
        updateFavoriteUI(!newLikedState);
        showNotification("حدث خطأ في تحديث المفضلة", "error");
    }
}

// ============================================
// تحميل المنتجات
// ============================================
async function loadProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('seller_id', storeId)
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProducts = products || [];
        setText('productsCount', `${allProducts.length} منتج`);
        renderProducts();
    } catch (error) {
        console.error("خطأ في تحميل المنتجات:", error);
    }
}

// ============================================
// عرض المنتجات
// ============================================
async function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let filtered = [...allProducts];
    if (currentProductFilter !== 'all') {
        filtered = filtered.filter(p => p.category === currentProductFilter);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-reviews" style="grid-column: 1/-1;">
                <i class="fas fa-box-open"></i>
                <p>لا توجد منتجات متاحة حالياً</p>
            </div>
        `;
        return;
    }

    const cards = await createProductCards(filtered);
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
}

// ============================================
// تحميل التقييمات
// ============================================
async function loadReviews() {
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('business_id', storeId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allReviews = reviews || [];
        renderReviewsSummary(allReviews);
        renderReviewsList(allReviews);
    } catch (error) {
        console.error("خطأ في تحميل التقييمات:", error);
    }
}

// ============================================
// ملخص التقييمات
// ============================================
function renderReviewsSummary(reviews) {
    if (reviews.length === 0) {
        document.getElementById('bigRating').textContent = '0.0';
        document.getElementById('totalReviews').textContent = '0 تقييم';
        document.getElementById('starsDisplay').innerHTML = '';
        document.getElementById('ratingBars').innerHTML = '';
        return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avgRating = totalRating / reviews.length;

    setText('bigRating', avgRating.toFixed(1));
    setText('totalReviews', `${reviews.length} تقييم`);
    document.getElementById('starsDisplay').innerHTML = generateStarsHTML(avgRating);

    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
        const rating = Math.round(r.rating || 0);
        if (rating >= 1 && rating <= 5) {
            ratingCounts[rating - 1]++;
        }
    });

    const barsContainer = document.getElementById('ratingBars');
    barsContainer.innerHTML = ratingCounts.map((count, index) => {
        const star = index + 1;
        const percentage = (count / reviews.length) * 100;
        return `
            <div class="rating-bar-row">
                <span class="star-label">${star} <i class="fas fa-star"></i></span>
                <div class="rating-bar">
                    <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="bar-count">${count}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// عرض قائمة التقييمات
// ============================================
async function renderReviewsList(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-reviews">
                <i class="fas fa-comment-slash"></i>
                <p>لا توجد تقييمات بعد. كن أول من يقيّم!</p>
            </div>
        `;
        return;
    }

    // جلب بيانات المقيّمين
    const reviewsWithNames = await Promise.all(reviews.map(async (review) => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', review.reviewer_id)
                .single();
            
            return {
                ...review,
                reviewer_name: profile?.full_name || 'زبون',
                reviewer_avatar: profile?.avatar_url || null
            };
        } catch (error) {
            return { ...review, reviewer_name: 'زبون', reviewer_avatar: null };
        }
    }));

    const cards = await createReviewCards(reviewsWithNames);
    container.innerHTML = '';
    cards.forEach(card => container.appendChild(card));
}

// ============================================
// إضافة تقييم جديد
// ============================================
async function submitReview() {
    if (!currentUser) {
        showNotification("يرجى تسجيل الدخول لإضافة تقييم", "warning");
        setTimeout(() => {
            window.location.href = resolvePath('LOGIN');
        }, 1500);
        return;
    }

    if (selectedRating === 0) {
        showNotification("يرجى اختيار التقييم بالنجوم", "error");
        return;
    }

    const text = document.getElementById('reviewText').value.trim();
    if (!text) {
        showNotification("يرجى كتابة تقييمك", "error");
        return;
    }

    try {
        const { error } = await supabase
            .from('reviews')
            .insert({
                reviewer_id: currentUser.id,
                business_id: storeId,
                rating: selectedRating,
                comment: text
            });

        if (error) throw error;

        showNotification("تم إضافة تقييمك بنجاح، شكراً لمشاركتك", "success");
        document.getElementById('reviewModal').classList.remove('active');
        document.getElementById('reviewText').value = '';
        selectedRating = 0;
        updateStarsInput(0);
        
        await loadReviews();
    } catch (error) {
        console.error("خطأ في إضافة التقييم:", error);
        showNotification("حدث خطأ في إضافة التقييم", "error");
    }
}

// ============================================
// إرسال بلاغ
// ============================================
async function submitReport() {
    if (!currentUser) {
        showNotification("يرجى تسجيل الدخول للإبلاغ", "warning");
        return;
    }

    const reason = document.getElementById('reportReason').value;
    const details = document.getElementById('reportDetails').value.trim();

    try {
        // حفظ البلاغ في localStorage كـ prototype (يمكن ربطه بجدول reports لاحقاً)
        const reports = JSON.parse(localStorage.getItem('bf-reports') || '[]');
        reports.push({
            id: 'RPT-' + Date.now(),
            storeId: storeId,
            userId: currentUser.id,
            reason: reason,
            details: details,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('bf-reports', JSON.stringify(reports));

        showNotification("تم إرسال البلاغ بنجاح، شكراً لمساعدتنا", "success");
        document.getElementById('reportModal').classList.remove('active');
        document.getElementById('reportDetails').value = '';
    } catch (error) {
        console.error("خطأ في إرسال البلاغ:", error);
        showNotification("فشل إرسال البلاغ", "error");
    }
}

// ============================================
// إرسال رسالة تواصل
// ============================================
async function submitContact() {
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
        showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
        return;
    }

    try {
        // حفظ الرسالة في localStorage كـ prototype
        const messages = JSON.parse(localStorage.getItem('bf-messages') || '[]');
        messages.push({
            id: 'MSG-' + Date.now(),
            storeId: storeId,
            name: name,
            email: email,
            message: message,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });
        localStorage.setItem('bf-messages', JSON.stringify(messages));

        showNotification("تم إرسال رسالتك بنجاح! سيتم الرد عليك خلال 24 ساعة", "success");
        document.getElementById('contactModal').classList.remove('active');
        document.getElementById('contactForm').reset();
    } catch (error) {
        console.error("خطأ في إرسال الرسالة:", error);
        showNotification("حدث خطأ في إرسال الرسالة", "error");
    }
}

// ============================================
// مشاركة المتجر
// ============================================
function shareStore() {
    if (navigator.share) {
        navigator.share({
            title: storeData?.name || 'متجر',
            text: storeData?.description || '',
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showNotification("تم نسخ رابط المتجر", "success");
    }
}

// ============================================
// إعداد مستمعي الأحداث
// ============================================
function setupEventListeners() {
    // زر المفضلة
    document.getElementById('favoriteBtn')?.addEventListener('click', toggleFavorite);

    // زر المشاركة
    document.getElementById('shareBtn')?.addEventListener('click', shareStore);

    // زر التواصل
    document.getElementById('contactBtn')?.addEventListener('click', () => {
        document.getElementById('contactModal').classList.add('active');
    });

    // زر الإبلاغ
    document.getElementById('reportBtn')?.addEventListener('click', () => {
        document.getElementById('reportModal').classList.add('active');
    });

    // زر المتابعة
    document.getElementById('followBtn')?.addEventListener('click', () => {
        if (!currentUser) {
            showNotification("يرجى تسجيل الدخول لمتابعة المتجر", "warning");
            return;
        }
        showNotification("تمت متابعة المتجر بنجاح", "success");
    });

    // إغلاق Modals
    document.getElementById('closeContactModal')?.addEventListener('click', () => {
        document.getElementById('contactModal').classList.remove('active');
    });

    document.getElementById('closeReviewModal')?.addEventListener('click', () => {
        document.getElementById('reviewModal').classList.remove('active');
        document.getElementById('reviewText').value = '';
        selectedRating = 0;
        updateStarsInput(0);
    });

    document.getElementById('closeReportModal')?.addEventListener('click', () => {
        document.getElementById('reportModal').classList.remove('active');
    });

    // إرسال النماذج
    document.getElementById('contactForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitContact();
    });

    document.getElementById('submitReview')?.addEventListener('click', submitReview);
    document.getElementById('submitReport')?.addEventListener('click', submitReport);

    // إضافة تقييم
    document.getElementById('addReviewBtn')?.addEventListener('click', () => {
        if (!currentUser) {
            showNotification("يرجى تسجيل الدخول لإضافة تقييم", "warning");
            return;
        }
        document.getElementById('reviewModal').classList.add('active');
    });

    // اختيار النجوم
    document.querySelectorAll('#starsInput i').forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            updateStarsInput(selectedRating);
        });

        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            highlightStars(rating);
        });
    });

    document.getElementById('starsInput')?.addEventListener('mouseleave', () => {
        updateStarsInput(selectedRating);
    });

    // فلاتر المنتجات
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentProductFilter = btn.dataset.category;
            renderProducts();
        });
    });

    // إغلاق Modals عند النقر خارجها
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // مفتاح Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

// ============================================
// تحديث واجهة النجوم
// ============================================
function updateStarsInput(rating) {
    document.querySelectorAll('#starsInput i').forEach((star, index) => {
        star.className = index < rating ? 'fas fa-star active' : 'far fa-star';
    });
}

function highlightStars(rating) {
    document.querySelectorAll('#starsInput i').forEach((star, index) => {
        star.className = index < rating ? 'fas fa-star' : 'far fa-star';
    });
}

// ============================================
// توليد HTML للنجوم
// ============================================
function generateStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalf) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

// ============================================
// تحديث الروابط الديناميكية
// ============================================
function updateDynamicLinks() {
    const links = document.querySelectorAll('[data-path]');
    links.forEach(link => {
        const key = link.getAttribute('data-path');
        const fullPath = resolvePath(key);
        link.setAttribute('href', fullPath);
    });
}

// ============================================
// دوال مساعدة
// ============================================
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

