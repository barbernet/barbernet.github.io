/**
 * BarberFlow Pro - صفحة تفاصيل الصالون
 * المسار: details-salon.js
 * المميزات:
 * - عرض جميع معلومات الصالون
 * - نظام تقييمات متقدم مع ردود وإبلاغ
 * - أزرار تواصل متعددة
 * - حجز موعد
 */

import { db, auth } from "./config/firebase-init.js";
import {
    doc, getDoc, updateDoc, collection, addDoc, getDocs,
    query, orderBy, serverTimestamp, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "./shared/js/notifications.js";
import { PATHS, resolvePath } from "./shared/utils/paths.js";

// ============================================
// المتغيرات العامة
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const salonId = urlParams.get('id');
let currentUser = null;
let salonData = null;
let currentReviewId = null;
let selectedRating = 0;

// ============================================
// التحقق من معرف الصالون
// ============================================
if (!salonId) {
    showNotification("الرابط غير صالح، لم يتم تحديد الصالون", "error");
    setTimeout(() => {
        window.location.replace(resolvePath('INDEX'));
    }, 2000);
}

// ============================================
// مراقبة حالة المصادقة
// ============================================
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (salonId) {
        loadSalonDetails();
    }
});

// ============================================
// تحميل تفاصيل الصالون
// ============================================
async function loadSalonDetails() {
    try {
        const snap = await getDoc(doc(db, "salons", salonId));
        
        if (!snap.exists()) {
            showNotification("هذا الصالون غير موجود أو تم حذفه", "error");
            setTimeout(() => {
                window.location.replace(resolvePath('INDEX'));
            }, 2000);
            return;
        }
        
        salonData = { id: salonId, ...snap.data() };
        renderSalonInfo(salonData);
        await fetchReviews();
        
    } catch (error) {
        console.error("خطأ في تحميل تفاصيل الصالون:", error);
        showNotification("حدث خطأ في تحميل البيانات", "error");
    }
}

// ============================================
// عرض معلومات الصالون
// ============================================
function renderSalonInfo(data) {
    // الصورة الرئيسية
    const heroImage = document.getElementById('heroImage');
    const heroPlaceholder = document.getElementById('heroPlaceholder');
    if (data.coverImage) {
        heroImage.src = data.coverImage;
        heroImage.style.display = 'block';
        heroPlaceholder.style.display = 'none';
    }
    
    // الاسم والمعلومات الأساسية
    setText('salonName', data.salonName || "صالون غير مسمى");
    setText('locationValue', data.location || "غير محدد");
    setText('salonType', data.salonType || "عام");
    
    // التقييم
    const rating = data.rating || 5.0;
    const reviewsCount = data.reviewsCount || 0;
    setText('ratingValue', rating.toFixed(1));
    setText('reviewsCount', `(${reviewsCount} تقييم)`);
    setText('bigRating', rating.toFixed(1));
    setText('totalReviews', `${reviewsCount} تقييم`);
    
    // الشارات
    if (data.verified) showElement('verifiedBadge');
    if (data.featured) showElement('featuredBadge');
    
    // حالة الصالون
    updateSalonStatus(data.workingHours);
    
    // عن الصالون
    setText('aboutText', data.description || data.about || "مرحباً بكم في صالوننا المميز.");
    
    // أوقات العمل
    const days = Array.isArray(data.workDays) ? data.workDays.join(' - ') : 'غير محدد';
    const openTime = data.workingHours?.open || '00:00';
    const closeTime = data.workingHours?.close || '00:00';
    setText('workingDays', `أيامنا: ${days}`);
    setText('workingHours', `ساعاتنا: من ${openTime} إلى ${closeTime}`);
    
    // أزرار التواصل
    setupContactButtons(data);
    
    // الخدمات
    renderServices(data.services);
    
    // المعرض
    renderGallery(data.portfolio || data.gallery);
    
    // الشهادات
    renderCertificates(data.certificate);
    
    // المفضلة
    setupFavoriteButton(data.isLiked);
    
    // معلومات المالك
    if (data.ownerId) {
        loadOwnerInfo(data.ownerId);
    }
    
    // تحديث عنوان الصفحة
    document.title = `${data.salonName || 'صالون'} | BarberFlow Pro`;
}

// ============================================
// تحديث حالة الصالون (مفتوح/مغلق)
// ============================================
function updateSalonStatus(hours) {
    const badge = document.getElementById('statusBadge');
    if (!hours?.open || !hours?.close) {
        badge.innerHTML = '<i class="fas fa-clock"></i> غير محدد';
        return;
    }
    
    const now = new Date();
    const curr = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = hours.open.split(':').map(Number);
    const [ch, cm] = hours.close.split(':').map(Number);
    const ot = oh * 60 + om;
    const ct = ch * 60 + cm;
    const isOpen = ct > ot ? (curr >= ot && curr < ct) : (curr >= ot || curr < ct);
    
    badge.innerHTML = `<i class="fas fa-${isOpen ? 'check-circle' : 'times-circle'}"></i> ${isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}`;
    badge.className = `badge status ${isOpen ? 'open' : 'closed'}`;
}

// ============================================
// إعداد أزرار التواصل
// ============================================
function setupContactButtons(data) {
    const phone = data.phone || "";
    
    if (phone) {
        const callBtn = document.getElementById('callBtn');
        if (callBtn) callBtn.href = `tel:${phone}`;
        
        const whatsappBtn = document.getElementById('whatsappBtn');
        if (whatsappBtn) {
            const cleanPhone = phone.replace('+', '').replace(/\s/g, '');
            whatsappBtn.href = `https://wa.me/${cleanPhone}`;
        }
    }
    
    const locationBtn = document.getElementById('locationBtn');
    if (locationBtn && data.location) {
        locationBtn.onclick = () => {
            const addr = encodeURIComponent(data.location);
            window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
        };
    }
    
    if (data.email) {
        const emailBtn = document.getElementById('emailBtn');
        if (emailBtn) {
            emailBtn.href = `mailto:${data.email}`;
            emailBtn.style.display = 'flex';
        }
    }
    
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.onclick = () => {
            if (navigator.share) {
                navigator.share({
                    title: data.salonName,
                    text: data.description,
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(window.location.href);
                showNotification("تم نسخ رابط الصالون", "success");
            }
        };
    }
}

// ============================================
// عرض الخدمات
// ============================================
function renderServices(services) {
    const container = document.getElementById('servicesList');
    if (!container) return;
    
    if (!services || services.length === 0) {
        container.innerHTML = '<p class="empty-state">لا توجد خدمات مسجلة بعد</p>';
        return;
    }
    
    container.innerHTML = services.map(s => `
        <div class="service-item">
            <div class="service-info">
                <i class="fas fa-check-circle"></i>
                <span class="service-name">${s.name}</span>
            </div>
            <span class="service-price">${s.price} DH</span>
        </div>
    `).join('');
}

// ============================================
// عرض المعرض
// ============================================
function renderGallery(images) {
    const container = document.getElementById('gallerySlider');
    const hint = document.getElementById('scrollHint');
    
    if (!container) return;
    
    if (images && images.length > 0) {
        container.innerHTML = images.map(url => `
            <div class="gallery-item">
                <img src="${url}" alt="معرض الأعمال" loading="lazy">
            </div>
        `).join('');
        if (hint && images.length > 3) hint.style.display = 'flex';
    } else {
        container.innerHTML = `
            <div class="gallery-placeholder">
                <i class="fas fa-images"></i>
                <span>سيتم إضافة صور المعرض قريباً</span>
            </div>
        `;
    }
}

// ============================================
// عرض الشهادات
// ============================================
function renderCertificates(certData) {
    const container = document.getElementById('certificatesContainer');
    if (!container) return;
    
    const certs = certData?.photos || certData;
    
    if (certs && certs.length > 0) {
        container.innerHTML = certs.map((url, index) => `
            <div class="cert-item">
                <img src="${url}" alt="شهادة ${index + 1}" loading="lazy">
                ${certData?.title && index === 0 ? `<div class="cert-title">${certData.title}</div>` : ''}
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p class="empty-state">لا توجد شهادات معروضة</p>';
    }
}

// ============================================
// زر المفضلة
// ============================================
function setupFavoriteButton(isLiked) {
    const btn = document.getElementById('favoriteBtn');
    if (!btn) return;
    
    const icon = btn.querySelector('i');
    updateHeartUI(isLiked);
    
    btn.onclick = async () => {
        if (!currentUser) {
            showNotification("يرجى تسجيل الدخول لإضافة الصالون للمفضلة", "warning");
            setTimeout(() => {
                window.location.href = resolvePath('LOGIN');
            }, 1500);
            return;
        }
        
        isLiked = !isLiked;
        updateHeartUI(isLiked);
        
        try {
            await updateDoc(doc(db, "salons", salonId), { isLiked });
            showNotification(isLiked ? "تمت إضافة الصالون للمفضلة" : "تم إزالة الصالون من المفضلة", "success");
        } catch (err) {
            console.error("خطأ في تحديث المفضلة:", err);
            isLiked = !isLiked;
            updateHeartUI(isLiked);
        }
    };
    
    function updateHeartUI(liked) {
        icon.className = liked ? 'fas fa-heart' : 'far fa-heart';
        btn.classList.toggle('active', liked);
    }
}

// ============================================
// معلومات المالك
// ============================================
async function loadOwnerInfo(ownerId) {
    try {
        const snap = await getDoc(doc(db, "users", ownerId));
        if (snap.exists()) {
            const data = snap.data();
            setText('ownerName', data.fullName || "مستخدم");
            if (data.createdAt) {
                const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                setText('ownerSince', `عضو منذ ${date.getFullYear()}`);
            }
            showElement('ownerSection');
        }
    } catch (e) {
        console.error("خطأ في جلب معلومات المالك:", e);
    }
}

// ============================================
// جلب التقييمات
// ============================================
async function fetchReviews() {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    
    try {
        const q = query(collection(db, "salons", salonId, "reviews"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        renderReviewsSummary(reviews);
        renderReviewsList(reviews);
        
    } catch (e) {
        console.error("خطأ في جلب التقييمات:", e);
        container.innerHTML = '<p class="empty-state">تعذر تحميل التقييمات</p>';
    }
}

// ============================================
// ملخص التقييمات
// ============================================
function renderReviewsSummary(reviews) {
    if (reviews.length === 0) return;
    
    // حساب متوسط التقييم
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avgRating = totalRating / reviews.length;
    
    // عدد التقييمات لكل نجمة
    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
        const rating = Math.round(r.rating || 0);
        if (rating >= 1 && rating <= 5) {
            ratingCounts[rating - 1]++;
        }
    });
    
    // عرض النجوم
    const starsDisplay = document.getElementById('starsDisplay');
    if (starsDisplay) {
        starsDisplay.innerHTML = generateStarsHTML(avgRating);
    }
    
    // أشرطة التقييم
    const barsContainer = document.getElementById('ratingBars');
    if (barsContainer) {
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
}

// ============================================
// عرض قائمة التقييمات
// ============================================
function renderReviewsList(reviews) {
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
    
    container.innerHTML = reviews.map(review => {
        const isOwner = currentUser && review.userId === currentUser.uid;
        const date = review.timestamp?.toDate ? review.timestamp.toDate() : new Date();
        const formattedDate = date.toLocaleDateString('ar-MA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `
            <div class="review-card" data-review-id="${review.id}">
                <div class="review-header">
                    <div class="reviewer-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="reviewer-info">
                        <strong>${review.userName || 'زائر'}</strong>
                        <div class="review-meta">
                            <div class="review-stars">${generateStarsHTML(review.rating || 0)}</div>
                            <span class="review-date">${formattedDate}</span>
                        </div>
                    </div>
                    <button class="review-options-btn" data-review-id="${review.id}">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
                <p class="review-text">${review.comment || ''}</p>
                ${review.reply ? `
                    <div class="review-reply">
                        <div class="reply-header">
                            <i class="fas fa-reply"></i>
                            <span>رد صاحب الصالون</span>
                        </div>
                        <p>${review.reply}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // إضافة أحداث أزرار الخيارات
    container.querySelectorAll('.review-options-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            currentReviewId = btn.dataset.reviewId;
            showReviewOptions();
        };
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
// نافذة خيارات التقييم
// ============================================
function showReviewOptions() {
    const modal = document.getElementById('reviewOptionsModal');
    if (modal) modal.classList.add('active');
}

// ============================================
// أحداث نافذة الخيارات
// ============================================
document.getElementById('replyBtn')?.addEventListener('click', () => {
    closeReviewOptions();
    showReplyModal();
});

document.getElementById('reportBtn')?.addEventListener('click', async () => {
    closeReviewOptions();
    if (!currentUser) {
        showNotification("يرجى تسجيل الدخول للإبلاغ", "warning");
        return;
    }
    
    try {
        await addDoc(collection(db, "reports"), {
            reviewId: currentReviewId,
            salonId: salonId,
            userId: currentUser.uid,
            reason: "محتوى غير لائق",
            timestamp: serverTimestamp()
        });
        showNotification("تم إرسال البلاغ بنجاح، شكراً لمساعدتنا", "success");
    } catch (e) {
        console.error("خطأ في إرسال البلاغ:", e);
        showNotification("فشل إرسال البلاغ", "error");
    }
});

document.getElementById('copyBtn')?.addEventListener('click', () => {
    const review = document.querySelector(`[data-review-id="${currentReviewId}"] .review-text`);
    if (review) {
        navigator.clipboard.writeText(review.textContent);
        showNotification("تم نسخ النص", "success");
    }
    closeReviewOptions();
});

document.getElementById('hideBtn')?.addEventListener('click', () => {
    const reviewCard = document.querySelector(`[data-review-id="${currentReviewId}"]`);
    if (reviewCard) {
        reviewCard.style.display = 'none';
        showNotification("تم إخفاء التعليق", "info");
    }
    closeReviewOptions();
});

document.getElementById('closeOptionsModal')?.addEventListener('click', closeReviewOptions);

function closeReviewOptions() {
    const modal = document.getElementById('reviewOptionsModal');
    if (modal) modal.classList.remove('active');
    currentReviewId = null;
}

// ============================================
// نافذة الرد
// ============================================
function showReplyModal() {
    const modal = document.getElementById('replyModal');
    if (modal) modal.classList.add('active');
}

document.getElementById('closeReplyModal')?.addEventListener('click', () => {
    const modal = document.getElementById('replyModal');
    if (modal) modal.classList.remove('active');
    document.getElementById('replyText').value = '';
});

document.getElementById('submitReply')?.addEventListener('click', async () => {
    const replyText = document.getElementById('replyText').value.trim();
    if (!replyText) {
        showNotification("يرجى كتابة الرد", "error");
        return;
    }
    
    if (!currentUser) {
        showNotification("يرجى تسجيل الدخول للرد", "warning");
        return;
    }
    
    try {
        await updateDoc(doc(db, "salons", salonId, "reviews", currentReviewId), {
            reply: replyText,
            replyAt: serverTimestamp()
        });
        showNotification("تم إرسال الرد بنجاح", "success");
        document.getElementById('replyModal').classList.remove('active');
        document.getElementById('replyText').value = '';
        await fetchReviews();
    } catch (e) {
        console.error("خطأ في إرسال الرد:", e);
        showNotification("فشل إرسال الرد", "error");
    }
});

// ============================================
// إضافة تقييم جديد
// ============================================
document.getElementById('addReviewBtn')?.addEventListener('click', () => {
    if (!currentUser) {
        showNotification("يرجى تسجيل الدخول لإضافة تقييم", "warning");
        setTimeout(() => {
            window.location.href = resolvePath('LOGIN');
        }, 1500);
        return;
    }
    
    const modal = document.getElementById('reviewModal');
    if (modal) modal.classList.add('active');
});

// اختيار النجوم
document.querySelectorAll('#starsInput i').forEach(star => {
    star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.rating);
        updateStarsInput(selectedRating);
    });
});

function updateStarsInput(rating) {
    document.querySelectorAll('#starsInput i').forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
        } else {
            star.className = 'far fa-star';
        }
    });
}

document.getElementById('submitReview')?.addEventListener('click', async () => {
    const text = document.getElementById('reviewText').value.trim();
    
    if (selectedRating === 0) {
        showNotification("يرجى اختيار التقييم بالنجوم", "error");
        return;
    }
    
    if (!text) {
        showNotification("يرجى كتابة تقييمك", "error");
        return;
    }
    
    let userName = "زائر";
    if (currentUser) {
        try {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) {
                userName = snap.data().fullName || "مستخدم";
            }
        } catch (e) {}
    }
    
    try {
        await addDoc(collection(db, "salons", salonId, "reviews"), {
            userId: currentUser.uid,
            userName,
            rating: selectedRating,
            comment: text,
            timestamp: serverTimestamp()
        });
        
        // تحديث متوسط التقييم
        await updateSalonRating();
        
        document.getElementById('reviewModal').classList.remove('active');
        document.getElementById('reviewText').value = '';
        selectedRating = 0;
        updateStarsInput(0);
        
        showNotification("تم إضافة تقييمك بنجاح، شكراً لمشاركتك", "success");
        await fetchReviews();
        
    } catch (e) {
        console.error("خطأ في إضافة التقييم:", e);
        showNotification("حدث خطأ في إضافة التقييم", "error");
    }
});

document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('reviewModal').classList.remove('active');
    document.getElementById('reviewText').value = '';
    selectedRating = 0;
    updateStarsInput(0);
});

// ============================================
// تحديث متوسط التقييم
// ============================================
async function updateSalonRating() {
    try {
        const q = query(collection(db, "salons", salonId, "reviews"));
        const snap = await getDocs(q);
        const reviews = snap.docs.map(doc => doc.data());
        
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
            const avgRating = totalRating / reviews.length;
            
            await updateDoc(doc(db, "salons", salonId), {
                rating: avgRating,
                reviewsCount: reviews.length
            });
        }
    } catch (e) {
        console.error("خطأ في تحديث التقييم:", e);
    }
}

// ============================================
// زر الحجز
// ============================================
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

// ============================================
// زر العودة
// ============================================
document.getElementById('backBtn')?.addEventListener('click', () => {
    window.history.back();
});

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

// إغلاق النوافذ عند النقر خارجها
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

