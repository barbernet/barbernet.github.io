/**
 * BarberFlow Pro - صفحة تفاصيل الصالون
 * المسار: details-salon.js
 * ✅ محدّث: Supabase + البطاقات المشتركة
 */

import { supabase } from './config/supabase-init.js';
import { showNotification } from './shared/utils/notifications.js';
import { PATHS, resolvePath } from './shared/utils/paths.js';
import { createServiceCards } from './shared/components/card-services.js';
import { createStaffCards } from './shared/components/card-staff.js';
import { createReviewCards } from './shared/components/card-review.js';

// ============================================
// المتغيرات العامة
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const salonId = urlParams.get('id');
let currentUser = null;
let salonData = null;
let allServices = [];
let allReviews = [];
let currentServiceFilter = 'all';
let selectedRating = 0;
let isFavorite = false;

// ============================================
// التحقق من معرف الصالون
// ============================================
if (!salonId) {
    showNotification("الرابط غير صالح، لم يتم تحديد الصالون", "error");
    setTimeout(() => {
        window.location.replace(resolvePath('SALONS'));
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
            window.location.href = resolvePath('SALONS');
        }
    });
}

// ============================================
// مراقبة حالة المصادقة
// ============================================
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    if (salonId) {
        await loadSalonDetails();
    }
});

// ============================================
// تحميل تفاصيل الصالون
// ============================================
async function loadSalonDetails() {
    try {
        const { data: salon, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', salonId)
            .eq('type', 'salon')
            .single();

        if (error || !salon) {
            showNotification("هذا الصالون غير موجود أو تم حذفه", "error");
            setTimeout(() => {
                window.location.replace(resolvePath('SALONS'));
            }, 2000);
            return;
        }

        salonData = { id: salonId, ...salon };
        renderSalonInfo(salonData);
        updateSalonStatus(salonData.working_hours);
        renderWorkingHours(salonData.working_hours);
        await checkFavoriteStatus();
        await loadServices();
        await loadStaff();
        await loadReviews();
        setupEventListeners();
        updateDynamicLinks();
    } catch (error) {
        console.error("خطأ في تحميل تفاصيل الصالون:", error);
        showNotification("حدث خطأ في تحميل البيانات", "error");
    }
}

// ============================================
// عرض معلومات الصالون
// ============================================
function renderSalonInfo(data) {
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
    const salonLogo = document.getElementById('salonLogo');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    if (data.logo_url) {
        salonLogo.src = data.logo_url;
        salonLogo.style.display = 'block';
        logoPlaceholder.style.display = 'none';
        salonLogo.onerror = () => {
            salonLogo.style.display = 'none';
            logoPlaceholder.style.display = 'flex';
            salonLogo.onerror = null;
        };
    }

    // المعلومات الأساسية
    setText('salonName', data.name || "صالون غير مسمى");
    setText('salonCity', data.city || "الموقع غير محدد");
    setText('salonRating', (parseFloat(data.rating) || 0).toFixed(1));
    setText('salonReviewsCount', `(${data.reviews_count || 0} تقييم)`);

    // الشارات
    if (data.is_verified) {
        showElement('verifiedBadge');
    }

    // عن الصالون
    setText('salonDescription', data.description || "مرحباً بكم في صالوننا المميز.");

    // عنوان الصفحة
    document.title = `${data.name || 'صالون'} | BarberFlow Pro`;
}

// ============================================
// تحديث حالة الصالون (مفتوح/مغلق)
// ============================================
function updateSalonStatus(hours) {
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
            .eq('item_id', salonId)
            .eq('item_type', 'salon')
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
        showNotification("يرجى تسجيل الدخول لإضافة الصالون للمفضلة", "warning");
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
                    item_id: salonId,
                    item_type: 'salon'
                });
            if (error) throw error;
            showNotification("تمت إضافة الصالون للمفضلة", "success");
        } else {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('item_id', salonId)
                .eq('item_type', 'salon');
            if (error) throw error;
            showNotification("تمت إزالة الصالون من المفضلة", "info");
        }
    } catch (error) {
        console.error("خطأ في تحديث المفضلة:", error);
        updateFavoriteUI(!newLikedState);
        showNotification("حدث خطأ في تحديث المفضلة", "error");
    }
}

// ============================================
// تحميل الخدمات
// ============================================
async function loadServices() {
    try {
        const { data: services, error } = await supabase
            .from('services')
            .select('*')
            .eq('business_id', salonId)
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allServices = services || [];
        setText('servicesCount', `${allServices.length} خدمة`);
        renderServices();
    } catch (error) {
        console.error("خطأ في تحميل الخدمات:", error);
    }
}

// ============================================
// عرض الخدمات
// ============================================
async function renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    let filtered = [...allServices];
    if (currentServiceFilter !== 'all') {
        filtered = filtered.filter(s => s.category === currentServiceFilter);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cut"></i>
                <p>لا توجد خدمات متاحة حالياً</p>
            </div>
        `;
        return;
    }

    const cards = await createServiceCards(filtered);
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
}

// ============================================
// تحميل فريق العمل
// ============================================
async function loadStaff() {
    const grid = document.getElementById('staffGrid');
    if (!grid) return;

    // حالياً نعرض رسالة فارغة (يمكن جلب الموظفين من جدول profiles)
    grid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-users"></i>
            <p>لم يتم إضافة فريق العمل بعد</p>
        </div>
    `;
}

// ============================================
// تحميل التقييمات
// ============================================
async function loadReviews() {
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('business_id', salonId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allReviews = reviews || [];
        renderReviewsSummary(allReviews);
        await renderReviewsList(allReviews);
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
            <div class="empty-state">
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
                business_id: salonId,
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
        const reports = JSON.parse(localStorage.getItem('bf-reports') || '[]');
        reports.push({
            id: 'RPT-' + Date.now(),
            salonId: salonId,
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
        const messages = JSON.parse(localStorage.getItem('bf-messages') || '[]');
        messages.push({
            id: 'MSG-' + Date.now(),
            salonId: salonId,
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
// مشاركة الصالون
// ============================================
function shareSalon() {
    if (navigator.share) {
        navigator.share({
            title: salonData?.name || 'صالون',
            text: salonData?.description || '',
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showNotification("تم نسخ رابط الصالون", "success");
    }
}

// ============================================
// إعداد مستمعي الأحداث
// ============================================
function setupEventListeners() {
    // زر المفضلة
    document.getElementById('favoriteBtn')?.addEventListener('click', toggleFavorite);

    // زر المشاركة
    document.getElementById('shareBtn')?.addEventListener('click', shareSalon);

    // زر الحجز
    document.getElementById('bookingBtn')?.addEventListener('click', () => {
        if (!currentUser) {
            showNotification("يرجى تسجيل الدخول للحجز", "warning");
            setTimeout(() => {
                window.location.href = resolvePath('LOGIN');
            }, 1500);
            return;
        }
        window.location.href = `${resolvePath('BOOKING')}?salon=${salonId}`;
    });

    // زر التواصل
    document.getElementById('contactBtn')?.addEventListener('click', () => {
        document.getElementById('contactModal').classList.add('active');
    });

    // زر الإبلاغ
    document.getElementById('reportBtn')?.addEventListener('click', () => {
        document.getElementById('reportModal').classList.add('active');
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

    // فلاتر الخدمات
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentServiceFilter = btn.dataset.category;
            renderServices();
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

