/**
 * BarberFlow Pro - صفحة بروفايل الصالون (للمالك)
 * المسار: profile/salon.js
 * المميزات:
 * - عرض جميع معلومات الصالون
 * - أزرار إدارة كاملة
 * - صلاحيات المالك فقط
 */

import { db, auth } from "../core/firebase-init.js";
import {
    doc, getDoc, updateDoc, collection, getDocs,
    query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentUser = null;
let salonData = null;
let salonId = null;

// ============================================
// مراقبة حالة المصادقة
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showNotification("يرجى تسجيل الدخول للوصول إلى بروفايلك", "warning");
        setTimeout(() => {
            window.location.replace(resolvePath('LOGIN'));
        }, 2000);
        return;
    }
    
    currentUser = user;
    salonId = user.uid;
    
    await loadSalonProfile();
});

// ============================================
// تحميل بروفايل الصالون
// ============================================
async function loadSalonProfile() {
    try {
        const snap = await getDoc(doc(db, "salons", salonId));
        
        if (!snap.exists()) {
            showNotification("لم يتم العثور على بيانات الصالون. يرجى إكمال الإعداد أولاً", "warning");
            setTimeout(() => {
                window.location.replace(resolvePath('ADD_SALON'));
            }, 2000);
            return;
        }
        
        salonData = { id: salonId, ...snap.data() };
        renderSalonInfo(salonData);
        await fetchReviews();
        
    } catch (error) {
        console.error("خطأ في تحميل بروفايل الصالون:", error);
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
    updateSalonStatus(data.workingHours, data.status);
    
    // عن الصالون
    setText('aboutText', data.description || data.about || "مرحباً بكم في صالوننا المميز.");
    
    // أوقات العمل
    const days = Array.isArray(data.workDays) ? data.workDays.join(' - ') : 'غير محدد';
    const openTime = data.workingHours?.open || '00:00';
    const closeTime = data.workingHours?.close || '00:00';
    setText('workingDays', `أيامنا: ${days}`);
    setText('workingHours', `ساعاتنا: من ${openTime} إلى ${closeTime}`);
    
    // الخدمات
    renderServices(data.services);
    
    // المعرض
    renderGallery(data.portfolio || data.gallery);
    
    // الشهادات
    renderCertificates(data.certificate);
    
    // تحديث عنوان الصفحة
    document.title = `${data.salonName || 'صالوني'} | BarberFlow Pro`;
}

// ============================================
// تحديث حالة الصالون
// ============================================
function updateSalonStatus(hours, status) {
    const badge = document.getElementById('statusBadge');
    const statusIndicator = document.getElementById('salonStatus');
    
    if (status === 'active') {
        if (statusIndicator) {
            statusIndicator.innerHTML = `
                <span class="status-dot active"></span>
                <span class="status-text">نشط</span>
            `;
        }
    } else {
        if (statusIndicator) {
            statusIndicator.innerHTML = `
                <span class="status-dot inactive"></span>
                <span class="status-text">غير نشط</span>
            `;
        }
    }
    
    if (!hours?.open || !hours?.close) {
        if (badge) badge.innerHTML = '<i class="fas fa-clock"></i> غير محدد';
        return;
    }
    
    const now = new Date();
    const curr = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = hours.open.split(':').map(Number);
    const [ch, cm] = hours.close.split(':').map(Number);
    const ot = oh * 60 + om;
    const ct = ch * 60 + cm;
    const isOpen = ct > ot ? (curr >= ot && curr < ct) : (curr >= ot || curr < ct);
    
    if (badge) {
        badge.innerHTML = `<i class="fas fa-${isOpen ? 'check-circle' : 'times-circle'}"></i> ${isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}`;
        badge.className = `badge status ${isOpen ? 'open' : 'closed'}`;
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
    
    container.innerHTML = services.map((s, index) => `
        <div class="service-item" data-service-index="${index}">
            <div class="service-info">
                <i class="fas fa-check-circle"></i>
                <span class="service-name">${s.name}</span>
            </div>
            <div class="service-actions">
                <span class="service-price">${s.price} DH</span>
                <button class="service-edit-btn" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="service-delete-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // إضافة أحداث التعديل والحذف
    container.querySelectorAll('.service-edit-btn').forEach(btn => {
        btn.onclick = () => editService(parseInt(btn.dataset.index));
    });
    
    container.querySelectorAll('.service-delete-btn').forEach(btn => {
        btn.onclick = () => deleteService(parseInt(btn.dataset.index));
    });
}

// ============================================
// تعديل خدمة
// ============================================
function editService(index) {
    showNotification("ميزة تعديل الخدمة قيد التطوير", "info");
}

// ============================================
// حذف خدمة
// ============================================
async function deleteService(index) {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;
    
    try {
        const services = [...salonData.services];
        services.splice(index, 1);
        
        await updateDoc(doc(db, "salons", salonId), { services });
        salonData.services = services;
        
        renderServices(services);
        showNotification("تم حذف الخدمة بنجاح", "success");
    } catch (e) {
        console.error("خطأ في حذف الخدمة:", e);
        showNotification("فشل حذف الخدمة", "error");
    }
}

// ============================================
// عرض المعرض
// ============================================
function renderGallery(images) {
    const container = document.getElementById('gallerySlider');
    if (!container) return;
    
    if (images && images.length > 0) {
        container.innerHTML = images.map((url, index) => `
            <div class="gallery-item">
                <img src="${url}" alt="معرض الأعمال" loading="lazy">
                <button class="gallery-delete-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        container.querySelectorAll('.gallery-delete-btn').forEach(btn => {
            btn.onclick = () => deleteGalleryImage(parseInt(btn.dataset.index));
        });
    } else {
        container.innerHTML = `
            <div class="gallery-placeholder">
                <i class="fas fa-images"></i>
                <span>لم يتم إضافة صور بعد</span>
            </div>
        `;
    }
}

// ============================================
// حذف صورة من المعرض
// ============================================
async function deleteGalleryImage(index) {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;
    
    try {
        const portfolio = [...salonData.portfolio];
        portfolio.splice(index, 1);
        
        await updateDoc(doc(db, "salons", salonId), { portfolio });
        salonData.portfolio = portfolio;
        
        renderGallery(portfolio);
        showNotification("تم حذف الصورة بنجاح", "success");
    } catch (e) {
        console.error("خطأ في حذف الصورة:", e);
        showNotification("فشل حذف الصورة", "error");
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
                <button class="cert-delete-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        container.querySelectorAll('.cert-delete-btn').forEach(btn => {
            btn.onclick = () => deleteCertificate(parseInt(btn.dataset.index));
        });
    } else {
        container.innerHTML = '<p class="empty-state">لا توجد شهادات معروضة</p>';
    }
}

// ============================================
// حذف شهادة
// ============================================
async function deleteCertificate(index) {
    if (!confirm("هل أنت متأكد من حذف هذه الشهادة؟")) return;
    
    try {
        const cert = { ...salonData.certificate };
        cert.photos = [...(cert.photos || [])];
        cert.photos.splice(index, 1);
        
        await updateDoc(doc(db, "salons", salonId), { certificate: cert });
        salonData.certificate = cert;
        
        renderCertificates(cert);
        showNotification("تم حذف الشهادة بنجاح", "success");
    } catch (e) {
        console.error("خطأ في حذف الشهادة:", e);
        showNotification("فشل حذف الشهادة", "error");
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
    }
}

// ============================================
// ملخص التقييمات
// ============================================
function renderReviewsSummary(reviews) {
    if (reviews.length === 0) return;
    
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avgRating = totalRating / reviews.length;
    
    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
        const rating = Math.round(r.rating || 0);
        if (rating >= 1 && rating <= 5) {
            ratingCounts[rating - 1]++;
        }
    });
    
    const starsDisplay = document.getElementById('starsDisplay');
    if (starsDisplay) {
        starsDisplay.innerHTML = generateStarsHTML(avgRating);
    }
    
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
                <p>لا توجد تقييمات بعد</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reviews.map(review => {
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
                </div>
                <p class="review-text">${review.comment || ''}</p>
                ${review.reply ? `
                    <div class="review-reply">
                        <div class="reply-header">
                            <i class="fas fa-reply"></i>
                            <span>ردك على التقييم</span>
                        </div>
                        <p>${review.reply}</p>
                    </div>
                ` : `
                    <button class="reply-to-review-btn" data-review-id="${review.id}">
                        <i class="fas fa-reply"></i>
                        <span>الرد على التقييم</span>
                    </button>
                `}
            </div>
        `;
    }).join('');
    
    // إضافة أحداث الرد
    container.querySelectorAll('.reply-to-review-btn').forEach(btn => {
        btn.onclick = () => replyToReview(btn.dataset.reviewId);
    });
}

// ============================================
// الرد على تقييم
// ============================================
function replyToReview(reviewId) {
    const reply = prompt("اكتب ردك على هذا التقييم:");
    if (!reply) return;
    
    updateDoc(doc(db, "salons", salonId, "reviews", reviewId), {
        reply: reply,
        replyAt: serverTimestamp()
    }).then(() => {
        showNotification("تم إرسال الرد بنجاح", "success");
        fetchReviews();
    }).catch(e => {
        console.error("خطأ في إرسال الرد:", e);
        showNotification("فشل إرسال الرد", "error");
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
// أحداث أزرار الإدارة
// ============================================
document.getElementById('dashboardBtn')?.addEventListener('click', () => {
    window.location.href = resolvePath('DASHBOARD');
});

document.getElementById('editSalonBtn')?.addEventListener('click', () => {
    showNotification("ميزة تعديل البيانات قيد التطوير", "info");
});

document.getElementById('addServiceBtn')?.addEventListener('click', () => {
    showNotification("ميزة إضافة خدمة قيد التطوير", "info");
});

document.getElementById('viewBookingsBtn')?.addEventListener('click', () => {
    window.location.href = resolvePath('DASHBOARD_APPOINTMENTS');
});

document.getElementById('analyticsBtn')?.addEventListener('click', () => {
    window.location.href = resolvePath('DASHBOARD_ANALYTICS');
});

document.getElementById('settingsBtn')?.addEventListener('click', () => {
    window.location.href = resolvePath('DASHBOARD_SETTINGS');
});

document.getElementById('editCoverBtn')?.addEventListener('click', () => {
    showNotification("ميزة تغيير صورة الغلاف قيد التطوير", "info");
});

document.getElementById('shareProfileBtn')?.addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: salonData.salonName,
            text: salonData.description,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showNotification("تم نسخ رابط البروفايل", "success");
    }
});

document.getElementById('editAboutBtn')?.addEventListener('click', () => {
    showNotification("ميزة تعديل الوصف قيد التطوير", "info");
});

document.getElementById('editHoursBtn')?.addEventListener('click', () => {
    showNotification("ميزة تعديل أوقات العمل قيد التطوير", "info");
});

document.getElementById('editServicesBtn')?.addEventListener('click', () => {
    showNotification("ميزة إضافة خدمة قيد التطوير", "info");
});

document.getElementById('editGalleryBtn')?.addEventListener('click', () => {
    showNotification("ميزة إضافة صور قيد التطوير", "info");
});

document.getElementById('editCertsBtn')?.addEventListener('click', () => {
    showNotification("ميزة إضافة شهادات قيد التطوير", "info");
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

