/**
 * BarberFlow Pro - صفحة بروفايل المتجر
 * المسار: profile/store.js
 * الدور: إدارة وعرض تفاصيل المتجر لأصحاب المتاجر
 */

import { auth, db } from "../core/firebase-init.js";
import {
    doc, getDoc, collection, query, orderBy, limit, addDoc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";
import { processImage } from "../shared/js/images-utils.js";
import { validateImageType, validateImageSize } from "../middleware/validation/index.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentUser = null;
let storeData = null;
let products = [];
let galleryImages = [];
let reviews = [];

// ============================================
// عناصر DOM
// ============================================
const profileCover = document.getElementById('profileCover');
const coverPlaceholder = document.getElementById('coverPlaceholder');
const profileAvatar = document.getElementById('profileAvatar');
const avatarPlaceholder = document.getElementById('avatarPlaceholder');
const profileName = document.getElementById('profileName');
const profileType = document.getElementById('profileType');
const profileLocation = document.getElementById('profileLocation');
const profileRating = document.getElementById('profileRating');
const reviewsCount = document.getElementById('reviewsCount');
const profileStatus = document.getElementById('profileStatus');
const overviewDescription = document.getElementById('overviewDescription');
const productsList = document.getElementById('productsList');
const galleryGrid = document.getElementById('galleryGrid');
const reviewsList = document.getElementById('reviewsList');

// ============================================
// التحقق من الجلسة
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showNotification("الجلسة غير صالحة، يرجى تسجيل الدخول", "error");
        setTimeout(() => {
            window.location.replace(resolvePath('LOGIN'));
        }, 2000);
        return;
    }

    try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
            showNotification("بيانات المستخدم غير موجودة", "error");
            setTimeout(() => {
                window.location.replace(resolvePath('INDEX'));
            }, 2000);
            return;
        }

        const userData = userDoc.data();
        if (userData.role !== 'store') {
            showNotification("هذه الصفحة مخصصة لأصحاب المتاجر فقط", "warning");
            setTimeout(() => {
                window.location.replace(resolvePath('INDEX'));
            }, 2000);
            return;
        }

        currentUser = user;
        loadStoreProfile();
    } catch (error) {
        console.error("خطأ في التحقق من الجلسة:", error);
        showNotification("حدث خطأ في التحقق من الجلسة", "error");
    }
});

// ============================================
// تحميل بيانات البروفايل
// ============================================
async function loadStoreProfile() {
    if (!currentUser) return;

    try {
        const docRef = doc(db, "stores", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            showNotification("لم يتم العثور على بيانات المتجر", "warning");
            setTimeout(() => {
                window.location.href = resolvePath('ADD_STORE');
            }, 2000);
            return;
        }

        storeData = { id: docSnap.id, ...docSnap.data() };
        renderProfile();
        await loadProducts();
        await loadGallery();
        await loadReviews();
        updateStats();
    } catch (error) {
        console.error("خطأ في تحميل البروفايل:", error);
        showNotification("حدث خطأ أثناء تحميل البيانات", "error");
    }
}

// ============================================
// عرض البروفايل
// ============================================
function renderProfile() {
    if (!storeData) return;

    // الغلاف
    if (storeData.coverImage) {
        profileCover.src = storeData.coverImage;
        profileCover.style.display = 'block';
        coverPlaceholder.style.display = 'none';
    }

    // الشعار
    if (storeData.logo) {
        profileAvatar.src = storeData.logo;
        profileAvatar.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    }

    // المعلومات الأساسية
    profileName.textContent = storeData.storeName || 'متجر غير مسمى';
    
    const typeElement = profileType.querySelector('span');
    if (typeElement) typeElement.textContent = storeData.storeType || 'نوع المتجر';
    
    const locationElement = profileLocation.querySelector('span');
    if (locationElement) locationElement.textContent = storeData.location || 'الموقع';
    
    profileRating.querySelector('span').textContent = storeData.rating?.toFixed(1) || '0.0';
    reviewsCount.textContent = storeData.reviewsCount || '0';

    // الوصف
    overviewDescription.textContent = storeData.description || storeData.about || "مرحباً بكم في متجرنا المميز.";

    // حالة الحساب
    if (storeData.status === 'active') {
        profileStatus.className = 'status-badge active';
        profileStatus.innerHTML = '<i class="fas fa-check-circle"></i> <span>نشط</span>';
    } else if (storeData.status === 'paused') {
        profileStatus.className = 'status-badge paused';
        profileStatus.innerHTML = '<i class="fas fa-pause-circle"></i> <span>متوقف مؤقتاً</span>';
    } else {
        profileStatus.className = 'status-badge pending';
        profileStatus.innerHTML = '<i class="fas fa-clock"></i> <span>قيد المراجعة</span>';
    }

    // معلومات الحساب
    const emailElement = document.getElementById('accountEmail');
    if (emailElement) emailElement.textContent = currentUser.email || 'غير محدد';
    
    const phoneElement = document.getElementById('accountPhone');
    if (phoneElement) phoneElement.textContent = storeData.phone || 'غير محدد';
    
    const createdElement = document.getElementById('accountCreated');
    if (createdElement && storeData.createdAt) {
        createdElement.textContent = storeData.createdAt.toDate().toLocaleDateString('ar-EG');
    }

    // تحديث عنوان الصفحة
    document.title = `${storeData.storeName || 'متجر'} | BarberFlow Pro`;
}

// ============================================
// تحميل المنتجات
// ============================================
async function loadProducts() {
    if (!productsList) return;

    try {
        const productsRef = collection(db, `stores/${currentUser.uid}/products`);
        const q = query(productsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts();
    } catch (error) {
        console.error("خطأ في تحميل المنتجات:", error);
    }
}

function renderProducts() {
    if (!productsList) return;

    if (products.length === 0) {
        productsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>لم تضف أي منتجات بعد</p>
                <button class="add-first-btn" onclick="document.getElementById('addProductBtn').click()">
                    <i class="fas fa-plus"></i>
                    <span>إضافة أول منتج</span>
                </button>
            </div>
        `;
        return;
    }

    productsList.innerHTML = products.map(product => `
        <div class="product-item" data-product-id="${product.id}">
            <div class="product-info">
                <h4>${product.name}</h4>
                <div class="product-meta">
                    <span><i class="fas fa-money-bill"></i> ${product.price} DH</span>
                    <span><i class="fas fa-box"></i> ${product.stock || 0} في المخزون</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="edit-btn" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// تحميل المعرض
// ============================================
async function loadGallery() {
    if (!galleryGrid) return;

    try {
        const galleryRef = collection(db, `stores/${currentUser.uid}/gallery`);
        const q = query(galleryRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        galleryImages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderGallery();
    } catch (error) {
        console.error("خطأ في تحميل المعرض:", error);
    }
}

function renderGallery() {
    if (!galleryGrid) return;

    if (galleryImages.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <p>لم تضف أي صور بعد</p>
                <button class="add-first-btn" onclick="document.getElementById('addGalleryPhotoBtn').click()">
                    <i class="fas fa-camera"></i>
                    <span>إضافة أول صورة</span>
                </button>
            </div>
        `;
        return;
    }

    galleryGrid.innerHTML = galleryImages.map(img => `
        <div class="gallery-item" data-image-id="${img.id}">
            <img src="${img.url}" alt="صورة من المعرض" loading="lazy">
            <div class="gallery-actions">
                <button class="delete-btn" onclick="deleteImage('${img.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// تحميل التقييمات
// ============================================
async function loadReviews() {
    if (!reviewsList) return;

    try {
        const reviewsRef = collection(db, `stores/${currentUser.uid}/reviews`);
        const q = query(reviewsRef, orderBy("createdAt", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        
        reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderReviews();
        updateRatingSummary();
    } catch (error) {
        console.error("خطأ في تحميل التقييمات:", error);
    }
}

function renderReviews() {
    if (!reviewsList) return;

    if (reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-slash"></i>
                <p>لا توجد تقييمات بعد</p>
            </div>
        `;
        return;
    }

    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-card" data-review-id="${review.id}">
            <div class="review-header">
                <div class="reviewer-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="reviewer-info">
                    <h4 class="reviewer-name">${review.userName || 'مستخدم'}</h4>
                    <div class="review-meta">
                        <div class="review-stars">${'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}</div>
                        <span class="review-date">${review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('ar-EG') : 'تاريخ غير محدد'}</span>
                    </div>
                </div>
            </div>
            <p class="review-text">${review.text || ''}</p>
            ${review.reply ? `
                <div class="owner-reply">
                    <div class="reply-header">
                        <i class="fas fa-reply"></i>
                        <span>ردك</span>
                    </div>
                    <p>${review.reply}</p>
                </div>
            ` : `
                <div class="add-reply-section">
                    <button class="add-reply-btn" onclick="openReplyModal('${review.id}')">
                        <i class="fas fa-reply"></i>
                        <span>الرد على التقييم</span>
                    </button>
                </div>
            `}
            <div class="review-actions">
                <button class="action-btn" onclick="deleteReview('${review.id}')">
                    <i class="fas fa-trash"></i>
                    <span>حذف</span>
                </button>
            </div>
        </div>
    `).join('');
}

function updateRatingSummary() {
    const overallRating = document.getElementById('overallRating');
    const overallStars = document.getElementById('overallStars');
    const overallCount = document.getElementById('overallCount');
    
    if (reviews.length === 0) {
        if (overallRating) overallRating.textContent = '0.0';
        if (overallStars) overallStars.innerHTML = '';
        if (overallCount) overallCount.textContent = '0 تقييم';
        return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const ratingDist = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
        const rating = Math.round(r.rating);
        if (rating >= 1 && rating <= 5) {
            ratingDist[rating - 1]++;
        }
    });

    if (overallRating) overallRating.textContent = avgRating.toFixed(1);
    if (overallStars) overallStars.innerHTML = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));
    if (overallCount) overallCount.textContent = `${reviews.length} تقييم`;
}

// ============================================
// تحديث الإحصائيات
// ============================================
function updateStats() {
    const totalProducts = document.getElementById('totalProducts');
    const totalOrders = document.getElementById('totalOrders');
    const totalRevenue = document.getElementById('totalRevenue');
    const avgRating = document.getElementById('avgRating');
    const pendingOrders = document.getElementById('pendingOrders');

    if (totalProducts) totalProducts.textContent = products.length;
    if (totalOrders) totalOrders.textContent = storeData.totalOrders || '0';
    if (totalRevenue) totalRevenue.textContent = `${storeData.totalRevenue || 0} DH`;
    if (avgRating) avgRating.textContent = storeData.rating?.toFixed(1) || '0.0';
    if (pendingOrders) pendingOrders.textContent = storeData.pendingOrders || '0';
}

// ============================================
// أزرار التبويب
// ============================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById(`${tabId}Tab`)?.classList.add('active');
    });
});

// ============================================
// أزرار الإدارة
// ============================================
document.getElementById('editCoverBtn')?.addEventListener('click', () => {
    openImageUploadModal('cover');
});

document.getElementById('editAvatarBtn')?.addEventListener('click', () => {
    openImageUploadModal('logo');
});

document.getElementById('pauseAccountBtn')?.addEventListener('click', async () => {
    if (!currentUser) return;
    
    const confirmed = confirm("هل أنت متأكد من إيقاف حسابك مؤقتاً؟ لن يتمكن العملاء من الطلب.");
    if (!confirmed) return;
    
    try {
        await updateDoc(doc(db, "stores", currentUser.uid), {
            status: 'paused',
            updatedAt: new Date()
        });
        
        showNotification("تم إيقاف الحساب مؤقتاً", "info");
        loadStoreProfile();
    } catch (error) {
        console.error("خطأ في إيقاف الحساب:", error);
        showNotification("حدث خطأ أثناء إيقاف الحساب", "error");
    }
});

document.getElementById('deleteAccountBtn')?.addEventListener('click', async () => {
    if (!currentUser) return;
    
    const confirmed = confirm("تحذير: سيتم حذف حسابك وجميع بياناته نهائياً. هل أنت متأكد؟");
    if (!confirmed) return;
    
    try {
        await updateDoc(doc(db, "stores", currentUser.uid), {
            status: 'deleted',
            deletedAt: new Date()
        });
        
        showNotification("تم حذف الحساب بنجاح", "success");
        setTimeout(() => {
            window.location.replace(resolvePath('INDEX'));
        }, 2000);
    } catch (error) {
        console.error("خطأ في حذف الحساب:", error);
        showNotification("حدث خطأ أثناء حذف الحساب", "error");
    }
});

// ============================================
// نافذة رفع الصور
// ============================================
function openImageUploadModal(type) {
    const modal = document.getElementById('imageUploadModal');
    const title = document.getElementById('imageUploadTitle');
    
    if (type === 'cover') {
        title.textContent = 'رفع صورة الغلاف';
    } else {
        title.textContent = 'رفع شعار المتجر';
    }
    
    modal.classList.add('show');
}

document.getElementById('closeImageModal')?.addEventListener('click', closeImageModal);
document.getElementById('cancelUploadBtn')?.addEventListener('click', closeImageModal);

function closeImageModal() {
    document.getElementById('imageUploadModal').classList.remove('show');
    resetImageUpload();
}

function resetImageUpload() {
    document.getElementById('imageInput').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('submitImageBtn').disabled = true;
}

// ============================================
// أحداث رفع الصور
// ============================================
document.getElementById('uploadArea')?.addEventListener('click', () => {
    document.getElementById('imageInput').click();
});

document.getElementById('imageInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!validateImageType(file)) {
        showNotification("يرجى اختيار صورة بصيغة PNG أو JPG", "error");
        return;
    }
    
    if (!validateImageSize(file, 5)) {
        showNotification("حجم الصورة كبير جداً (الحد الأقصى 5MB)", "error");
        return;
    }
    
    try {
        showNotification("جاري معالجة الصورة...", "info");
        const base64 = await processImage(file, 1200, 0.8);
        
        document.getElementById('previewImage').src = base64;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('submitImageBtn').disabled = false;
        
        showNotification("تم معالجة الصورة بنجاح", "success");
    } catch (error) {
        console.error("خطأ في معالجة الصورة:", error);
        showNotification("فشل معالجة الصورة", "error");
    }
});

document.getElementById('removePreviewBtn')?.addEventListener('click', resetImageUpload);

document.getElementById('submitImageBtn')?.addEventListener('click', async () => {
    const previewImage = document.getElementById('previewImage');
    const base64 = previewImage.src;
    
    try {
        document.getElementById('submitImageBtn').disabled = true;
        document.getElementById('submitImageBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري الحفظ...</span>';
        
        const title = document.getElementById('imageUploadTitle').textContent;
        const updateData = {};
        
        if (title.includes('الغلاف')) {
            updateData.coverImage = base64;
        } else {
            updateData.logo = base64;
        }
        
        await updateDoc(doc(db, "stores", currentUser.uid), {
            ...updateData,
            updatedAt: new Date()
        });
        
        showNotification("تم تحديث الصورة بنجاح", "success");
        closeImageModal();
        loadStoreProfile();
    } catch (error) {
        console.error("خطأ في حفظ الصورة:", error);
        showNotification("حدث خطأ أثناء حفظ الصورة", "error");
    } finally {
        document.getElementById('submitImageBtn').disabled = false;
        document.getElementById('submitImageBtn').innerHTML = '<i class="fas fa-save"></i> <span>حفظ الصورة</span>';
    }
});

// ============================================
// إضافة صور للمعرض
// ============================================
document.getElementById('addGalleryPhotoBtn')?.addEventListener('click', async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        try {
            showNotification("جاري رفع الصور...", "info");
            
            for (const file of files) {
                if (!validateImageType(file)) continue;
                if (!validateImageSize(file, 5)) continue;
                
                const base64 = await processImage(file, 800, 0.7);
                await addDoc(collection(db, `stores/${currentUser.uid}/gallery`), {
                    url: base64,
                    createdAt: new Date()
                });
            }
            
            showNotification("تم رفع الصور بنجاح", "success");
            loadGallery();
        } catch (error) {
            console.error("خطأ في رفع الصور:", error);
            showNotification("حدث خطأ أثناء رفع الصور", "error");
        }
    };
    
    input.click();
});

// ============================================
// أزرار الإجراءات السريعة
// ============================================
document.getElementById('addProductBtn')?.addEventListener('click', () => {
    document.querySelector('[data-tab="products"]').click();
    showNotification("ميزة إضافة المنتجات قيد التطوير", "info");
});

document.getElementById('addPhotoBtn')?.addEventListener('click', () => {
    document.querySelector('[data-tab="gallery"]').click();
    document.getElementById('addGalleryPhotoBtn').click();
});

document.getElementById('updateHoursBtn')?.addEventListener('click', () => {
    document.querySelector('[data-tab="schedule"]').click();
});

// ============================================
// التهيئة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من الجلسة يتم تلقائياً عبر onAuthStateChanged
});

