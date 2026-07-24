/**
 * BarberFlow Pro - صفحة بروفايل الزبون
 * المسار: profile/customer.js
 * الدور: إدارة حساب الزبون وحجوزاته وطلباته
 */

import { auth, db } from "../config/firebase-init.js";
import {
    doc, getDoc, updateDoc, collection, query, where,
    orderBy, limit, addDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/utils/paths.js";
import { processImage } from "../shared/js/images-utils.js";
import { validateImageType, validateImageSize } from "../middleware/validation/index.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentUser = null;
let userData = null;
let currentImageType = null; // 'cover' or 'avatar'
let selectedImageBase64 = null;

// ============================================
// عناصر DOM
// ============================================
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profilePhone = document.getElementById('profilePhone');
const profileCity = document.getElementById('profileCity');
const memberSince = document.getElementById('memberSince');
const profileCover = document.getElementById('profileCover');
const coverPlaceholder = document.getElementById('coverPlaceholder');
const profileAvatar = document.getElementById('profileAvatar');
const avatarPlaceholder = document.getElementById('avatarPlaceholder');

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

    currentUser = user;
    await loadUserProfile();
});

// ============================================
// تحميل بيانات البروفايل
// ============================================
async function loadUserProfile() {
    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
            showNotification("بيانات المستخدم غير موجودة", "error");
            return;
        }

        userData = { id: userDoc.id, ...userDoc.data() };
        renderProfileInfo();
        await loadStats();
        await loadRecentBookings();
        await loadRecentOrders();
        await loadFavoriteSalons();
        setupEventListeners();
    } catch (error) {
        console.error("خطأ في تحميل البروفايل:", error);
        showNotification("حدث خطأ أثناء تحميل البيانات", "error");
    }
}

// ============================================
// عرض معلومات البروفايل
// ============================================
function renderProfileInfo() {
    if (!userData) return;

    // الاسم
    profileName.textContent = userData.fullName || "مستخدم";

    // البريد
    const emailSpan = profileEmail.querySelector('span');
    if (emailSpan) emailSpan.textContent = userData.email || currentUser.email || "غير محدد";

    // الهاتف
    const phoneSpan = profilePhone.querySelector('span');
    if (phoneSpan) phoneSpan.textContent = userData.phone || "غير محدد";

    // المدينة
    const citySpan = profileCity.querySelector('span');
    if (citySpan) citySpan.textContent = userData.city || "غير محدد";

    // تاريخ الانضمام
    if (userData.createdAt) {
        const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
        const year = date.getFullYear();
        const sinceSpan = memberSince.querySelector('span');
        if (sinceSpan) sinceSpan.textContent = `عضو منذ ${year}`;
    }

    // الصور
    if (userData.coverImage) {
        profileCover.src = userData.coverImage;
        profileCover.style.display = 'block';
        coverPlaceholder.style.display = 'none';
    }

    if (userData.photoURL || userData.avatar) {
        profileAvatar.src = userData.photoURL || userData.avatar;
        profileAvatar.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    }

    // تحديث عنوان الصفحة
    document.title = `${userData.fullName || 'ملفي الشخصي'} | BarberFlow Pro`;

    // ملء نموذج الإعدادات
    fillSettingsForm();
}

// ============================================
// ملء نموذج الإعدادات
// ============================================
function fillSettingsForm() {
    const nameInput = document.getElementById('settingsName');
    const emailInput = document.getElementById('settingsEmail');
    const phoneInput = document.getElementById('settingsPhone');
    const cityInput = document.getElementById('settingsCity');
    const birthdateInput = document.getElementById('settingsBirthdate');

    if (nameInput) nameInput.value = userData.fullName || "";
    if (emailInput) emailInput.value = userData.email || currentUser.email || "";
    if (phoneInput) phoneInput.value = userData.phone || "";
    if (cityInput) cityInput.value = userData.city || "";
    if (birthdateInput && userData.birthdate) {
        birthdateInput.value = userData.birthdate;
    }
}

// ============================================
// تحميل الإحصائيات
// ============================================
async function loadStats() {
    try {
        // عدد الحجوزات
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("customerId", "==", currentUser.uid)
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const totalBookings = bookingsSnap.size;

        // عدد الطلبات
        const ordersQuery = query(
            collection(db, "orders"),
            where("customerId", "==", currentUser.uid)
        );
        const ordersSnap = await getDocs(ordersQuery);
        const totalOrders = ordersSnap.size;

        // إجمالي الإنفاق
        let totalSpent = 0;
        ordersSnap.forEach(doc => {
            const data = doc.data();
            if (data.total) {
                totalSpent += parseFloat(data.total) || 0;
            }
        });

        // تحديث الواجهة
        document.getElementById('totalBookings').textContent = totalBookings;
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalSpent').textContent = `${totalSpent} DH`;
        document.getElementById('favoritesCount').textContent = userData.favorites?.length || 0;

        // تحديث الشارات
        document.getElementById('bookingsBadge').textContent = totalBookings;
        document.getElementById('ordersBadge').textContent = totalOrders;
    } catch (error) {
        console.error("خطأ في تحميل الإحصائيات:", error);
    }
}

// ============================================
// تحميل آخر الحجوزات
// ============================================
async function loadRecentBookings() {
    try {
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("customerId", "==", currentUser.uid),
            orderBy("date", "desc"),
            limit(3)
        );
        const snap = await getDocs(bookingsQuery);
        const container = document.getElementById('recentBookings');

        if (snap.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <p>لا توجد حجوزات بعد</p>
                    <a href="../salons.html" class="cta-btn">احجز موعدك الآن</a>
                </div>
            `;
            return;
        }

        container.innerHTML = snap.docs.map(doc => {
            const data = doc.data();
            return `
                <div class="booking-card">
                    <div class="booking-info">
                        <h4>${data.salonName || "صالون"}</h4>
                        <p><i class="fas fa-calendar"></i> ${data.date || "غير محدد"}</p>
                        <p><i class="fas fa-clock"></i> ${data.time || "غير محدد"}</p>
                    </div>
                    <div class="booking-status ${data.status || 'pending'}">
                        ${getStatusText(data.status)}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("خطأ في تحميل الحجوزات:", error);
    }
}

// ============================================
// تحميل آخر الطلبات
// ============================================
async function loadRecentOrders() {
    try {
        const ordersQuery = query(
            collection(db, "orders"),
            where("customerId", "==", currentUser.uid),
            orderBy("createdAt", "desc"),
            limit(3)
        );
        const snap = await getDocs(ordersQuery);
        const container = document.getElementById('recentOrders');

        if (snap.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>لا توجد طلبات بعد</p>
                    <a href="../store.html" class="cta-btn">تصفح المتجر</a>
                </div>
            `;
            return;
        }

        container.innerHTML = snap.docs.map(doc => {
            const data = doc.data();
            return `
                <div class="order-card">
                    <div class="order-info">
                        <h4>طلب #${doc.id.substring(0, 8)}</h4>
                        <p><i class="fas fa-shopping-bag"></i> ${data.items?.length || 0} منتجات</p>
                        <p><i class="fas fa-money-bill"></i> ${data.total || 0} DH</p>
                    </div>
                    <div class="order-status ${data.status || 'pending'}">
                        ${getOrderStatusText(data.status)}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("خطأ في تحميل الطلبات:", error);
    }
}

// ============================================
// تحميل الصالونات المفضلة
// ============================================
async function loadFavoriteSalons() {
    try {
        const container = document.getElementById('favoriteSalons');
        
        if (!userData.favorites || userData.favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart-broken"></i>
                    <p>لم تضف أي صالون للمفضلة بعد</p>
                </div>
            `;
            return;
        }

        // جلب بيانات الصالونات المفضلة
        const salons = [];
        for (const salonId of userData.favorites.slice(0, 3)) {
            const salonDoc = await getDoc(doc(db, "salons", salonId));
            if (salonDoc.exists()) {
                salons.push({ id: salonId, ...salonDoc.data() });
            }
        }

        container.innerHTML = salons.map(salon => `
            <div class="favorite-card">
                <img src="${salon.coverImage || '../assets/images/placeholder-salon.jpg'}" alt="${salon.salonName}">
                <div class="favorite-info">
                    <h4>${salon.salonName || "صالون"}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${salon.location || "غير محدد"}</p>
                    <p><i class="fas fa-star"></i> ${salon.rating || 5.0}</p>
                </div>
                <a href="../details-salon.html?id=${salon.id}" class="view-btn">
                    <i class="fas fa-eye"></i>
                </a>
            </div>
        `).join('');
    } catch (error) {
        console.error("خطأ في تحميل المفضلة:", error);
    }
}

// ============================================
// دوال مساعدة للنصوص
// ============================================
function getStatusText(status) {
    const map = {
        'confirmed': 'مؤكد',
        'pending': 'قيد الانتظار',
        'completed': 'مكتمل',
        'cancelled': 'ملغي'
    };
    return map[status] || status;
}

function getOrderStatusText(status) {
    const map = {
        'pending': 'قيد التجهيز',
        'shipped': 'تم الشحن',
        'delivered': 'تم التوصيل',
        'cancelled': 'ملغي'
    };
    return map[status] || status;
}

// ============================================
// إعداد مستمعي الأحداث
// ============================================
function setupEventListeners() {
    // تبديل التبويبات
    document.querySelectorAll('.quick-nav-item, .view-all-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.dataset.tab;
            if (tab) switchTab(tab);
        });
    });

    // فلاتر الحجوزات
    document.querySelectorAll('#bookingsTab .filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#bookingsTab .filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadAllBookings(btn.dataset.filter);
        });
    });

    // فلاتر الطلبات
    document.querySelectorAll('#ordersTab .filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#ordersTab .filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadAllOrders(btn.dataset.filter);
        });
    });

    // تبديل المفضلة
    document.querySelectorAll('.fav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fav-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadFavorites(btn.dataset.fav);
        });
    });

    // تعديل الصور
    document.getElementById('editCoverBtn')?.addEventListener('click', () => openImageModal('cover'));
    document.getElementById('editAvatarBtn')?.addEventListener('click', () => openImageModal('avatar'));

    // تعديل البروفايل
    document.getElementById('editProfileBtn')?.addEventListener('click', () => switchTab('settings'));

    // نموذج المعلومات الشخصية
    document.getElementById('personalInfoForm')?.addEventListener('submit', savePersonalInfo);

    // تسجيل الخروج
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    // منطقة الخطر
    document.getElementById('changePasswordBtn')?.addEventListener('click', changePassword);
    document.getElementById('deactivateAccountBtn')?.addEventListener('click', deactivateAccount);
    document.getElementById('deleteAccountBtn')?.addEventListener('click', deleteAccount);

    // إضافة عنوان
    document.getElementById('addAddressBtn')?.addEventListener('click', () => openAddressModal());

    // إغلاق النوافذ
    document.getElementById('closeImageModal')?.addEventListener('click', closeImageModal);
    document.getElementById('cancelImageBtn')?.addEventListener('click', closeImageModal);
    document.getElementById('closeAddressModal')?.addEventListener('click', closeAddressModal);
    document.getElementById('cancelAddressBtn')?.addEventListener('click', closeAddressModal);

    // رفع الصورة
    document.getElementById('uploadArea')?.addEventListener('click', () => {
        document.getElementById('imageInput').click();
    });

    document.getElementById('imageInput')?.addEventListener('change', handleImageUpload);
    document.getElementById('removePreviewBtn')?.addEventListener('click', resetImagePreview);
    document.getElementById('submitImageBtn')?.addEventListener('click', submitImage);

    // حفظ العنوان
    document.getElementById('submitAddressBtn')?.addEventListener('click', submitAddress);

    // إغلاق النوافذ عند النقر خارجها
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// ============================================
// تبديل التبويبات
// ============================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.quick-nav-item').forEach(item => item.classList.remove('active'));

    const targetTab = document.getElementById(`${tabName}Tab`);
    if (targetTab) targetTab.classList.add('active');

    const activeNav = document.querySelector(`.quick-nav-item[data-tab="${tabName}"]`);
    if (activeNav) activeNav.classList.add('active');

    // تحميل البيانات حسب التبويب
    if (tabName === 'bookings') loadAllBookings('upcoming');
    if (tabName === 'orders') loadAllOrders('all');
    if (tabName === 'favorites') loadFavorites('salons');
    if (tabName === 'addresses') loadAddresses();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// تحميل جميع الحجوزات
// ============================================
async function loadAllBookings(filter = 'upcoming') {
    try {
        const container = document.getElementById('allBookings');
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("customerId", "==", currentUser.uid),
            orderBy("date", "desc")
        );
        const snap = await getDocs(bookingsQuery);

        let bookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // تصفية حسب الحالة
        if (filter === 'upcoming') {
            bookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
        } else if (filter === 'completed') {
            bookings = bookings.filter(b => b.status === 'completed');
        } else if (filter === 'cancelled') {
            bookings = bookings.filter(b => b.status === 'cancelled');
        }

        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <p>لا توجد حجوزات</p>
                </div>
            `;
            return;
        }

        container.innerHTML = bookings.map(booking => `
            <div class="booking-card">
                <div class="booking-info">
                    <h4>${booking.salonName || "صالون"}</h4>
                    <p><i class="fas fa-calendar"></i> ${booking.date || "غير محدد"}</p>
                    <p><i class="fas fa-clock"></i> ${booking.time || "غير محدد"}</p>
                    <p><i class="fas fa-money-bill"></i> ${booking.total || 0} DH</p>
                </div>
                <div class="booking-actions">
                    <div class="booking-status ${booking.status || 'pending'}">
                        ${getStatusText(booking.status)}
                    </div>
                    ${booking.status === 'confirmed' || booking.status === 'pending' ? `
                        <button class="cancel-booking-btn" data-id="${booking.id}">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // أحداث إلغاء الحجز
        container.querySelectorAll('.cancel-booking-btn').forEach(btn => {
            btn.addEventListener('click', () => cancelBooking(btn.dataset.id));
        });
    } catch (error) {
        console.error("خطأ في تحميل الحجوزات:", error);
    }
}

// ============================================
// تحميل جميع الطلبات
// ============================================
async function loadAllOrders(filter = 'all') {
    try {
        const container = document.getElementById('allOrders');
        const ordersQuery = query(
            collection(db, "orders"),
            where("customerId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(ordersQuery);

        let orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (filter !== 'all') {
            orders = orders.filter(o => o.status === filter);
        }

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>لا توجد طلبات</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-info">
                    <h4>طلب #${order.id.substring(0, 8)}</h4>
                    <p><i class="fas fa-shopping-bag"></i> ${order.items?.length || 0} منتجات</p>
                    <p><i class="fas fa-money-bill"></i> ${order.total || 0} DH</p>
                    <p><i class="fas fa-calendar"></i> ${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('ar-EG') : 'غير محدد'}</p>
                </div>
                <div class="order-actions">
                    <div class="order-status ${order.status || 'pending'}">
                        ${getOrderStatusText(order.status)}
                    </div>
                    <button class="view-order-btn" data-id="${order.id}">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("خطأ في تحميل الطلبات:", error);
    }
}

// ============================================
// تحميل المفضلة
// ============================================
async function loadFavorites(type = 'salons') {
    try {
        const container = document.getElementById('favoritesGrid');
        
        if (!userData.favorites || userData.favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart-broken"></i>
                    <p>لا توجد عناصر في المفضلة</p>
                </div>
            `;
            return;
        }

        // جلب البيانات حسب النوع
        const items = [];
        for (const itemId of userData.favorites) {
            const itemDoc = await getDoc(doc(db, type, itemId));
            if (itemDoc.exists()) {
                items.push({ id: itemId, ...itemDoc.data() });
            }
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart-broken"></i>
                    <p>لا توجد عناصر في المفضلة</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="favorite-card">
                <img src="${item.coverImage || item.imageUrl || '../assets/images/placeholder.jpg'}" alt="${item.salonName || item.storeName || item.name}">
                <div class="favorite-info">
                    <h4>${item.salonName || item.storeName || item.name}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${item.location || "غير محدد"}</p>
                    <p><i class="fas fa-star"></i> ${item.rating || 5.0}</p>
                </div>
                <button class="remove-fav-btn" data-id="${item.id}" data-type="${type}">
                    <i class="fas fa-heart-broken"></i>
                </button>
            </div>
        `).join('');

        // أحداث إزالة المفضلة
        container.querySelectorAll('.remove-fav-btn').forEach(btn => {
            btn.addEventListener('click', () => removeFromFavorites(btn.dataset.id, btn.dataset.type));
        });
    } catch (error) {
        console.error("خطأ في تحميل المفضلة:", error);
    }
}

// ============================================
// تحميل العناوين
// ============================================
async function loadAddresses() {
    try {
        const container = document.getElementById('addressesGrid');
        const addressesQuery = query(
            collection(db, "users", currentUser.uid, "addresses"),
            orderBy("isDefault", "desc")
        );
        const snap = await getDocs(addressesQuery);

        if (snap.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marked-alt"></i>
                    <p>لم تضف أي عنوان بعد</p>
                </div>
            `;
            return;
        }

        container.innerHTML = snap.docs.map(doc => {
            const data = doc.data();
            return `
                <div class="address-card ${data.isDefault ? 'default' : ''}">
                    <div class="address-header">
                        <h4>${data.label || "عنوان"}</h4>
                        ${data.isDefault ? '<span class="default-badge">افتراضي</span>' : ''}
                    </div>
                    <p><i class="fas fa-map-marker-alt"></i> ${data.fullAddress}</p>
                    <p><i class="fas fa-city"></i> ${data.city}</p>
                    <p><i class="fas fa-phone"></i> ${data.phone}</p>
                    <div class="address-actions">
                        <button class="edit-address-btn" data-id="${doc.id}">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="delete-address-btn" data-id="${doc.id}">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("خطأ في تحميل العناوين:", error);
    }
}

// ============================================
// حفظ المعلومات الشخصية
// ============================================
async function savePersonalInfo(e) {
    e.preventDefault();

    const name = document.getElementById('settingsName').value.trim();
    const phone = document.getElementById('settingsPhone').value.trim();
    const city = document.getElementById('settingsCity').value.trim();
    const birthdate = document.getElementById('settingsBirthdate').value;

    if (!name || name.length < 2) {
        showNotification("يرجى إدخال اسم صحيح", "error");
        return;
    }

    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            fullName: name,
            phone: phone,
            city: city,
            birthdate: birthdate,
            updatedAt: new Date()
        });

        showNotification("تم حفظ التغييرات بنجاح", "success");
        await loadUserProfile();
    } catch (error) {
        console.error("خطأ في حفظ المعلومات:", error);
        showNotification("حدث خطأ أثناء الحفظ", "error");
    }
}

// ============================================
// نافذة تعديل الصورة
// ============================================
function openImageModal(type) {
    currentImageType = type;
    selectedImageBase64 = null;
    
    const modal = document.getElementById('imageModal');
    const title = document.getElementById('imageModalTitle');
    
    title.textContent = type === 'cover' ? 'تعديل صورة الغلاف' : 'تعديل الصورة الشخصية';
    modal.classList.add('active');
    
    resetImagePreview();
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
    resetImagePreview();
}

function resetImagePreview() {
    selectedImageBase64 = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'flex';
    document.getElementById('submitImageBtn').disabled = true;
    document.getElementById('imageInput').value = '';
}

async function handleImageUpload(e) {
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
        selectedImageBase64 = await processImage(file, currentImageType === 'cover' ? 1200 : 400, 0.8);
        
        document.getElementById('previewImage').src = selectedImageBase64;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('submitImageBtn').disabled = false;
        
        showNotification("تم معالجة الصورة بنجاح", "success");
    } catch (error) {
        console.error("خطأ في معالجة الصورة:", error);
        showNotification("فشل معالجة الصورة", "error");
    }
}

async function submitImage() {
    if (!selectedImageBase64) return;

    try {
        document.getElementById('submitImageBtn').disabled = true;
        document.getElementById('submitImageBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

        const updateData = {};
        if (currentImageType === 'cover') {
            updateData.coverImage = selectedImageBase64;
        } else {
            updateData.photoURL = selectedImageBase64;
        }

        await updateDoc(doc(db, "users", currentUser.uid), {
            ...updateData,
            updatedAt: new Date()
        });

        showNotification("تم تحديث الصورة بنجاح", "success");
        closeImageModal();
        await loadUserProfile();
    } catch (error) {
        console.error("خطأ في حفظ الصورة:", error);
        showNotification("حدث خطأ أثناء الحفظ", "error");
    } finally {
        document.getElementById('submitImageBtn').disabled = false;
        document.getElementById('submitImageBtn').innerHTML = 'حفظ';
    }
}

// ============================================
// نافذة إضافة عنوان
// ============================================
function openAddressModal() {
    document.getElementById('addressModal').classList.add('active');
    document.getElementById('addressForm').reset();
}

function closeAddressModal() {
    document.getElementById('addressModal').classList.remove('active');
}

async function submitAddress() {
    const label = document.getElementById('addressLabel').value.trim();
    const fullAddress = document.getElementById('addressFull').value.trim();
    const city = document.getElementById('addressCity').value.trim();
    const zip = document.getElementById('addressZip').value.trim();
    const phone = document.getElementById('addressPhone').value.trim();
    const isDefault = document.getElementById('addressDefault').checked;

    if (!label || !fullAddress || !city || !phone) {
        showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
        return;
    }

    try {
        document.getElementById('submitAddressBtn').disabled = true;
        document.getElementById('submitAddressBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

        await addDoc(collection(db, "users", currentUser.uid, "addresses"), {
            label,
            fullAddress,
            city,
            zip,
            phone,
            isDefault,
            createdAt: new Date()
        });

        showNotification("تم حفظ العنوان بنجاح", "success");
        closeAddressModal();
        await loadAddresses();
    } catch (error) {
        console.error("خطأ في حفظ العنوان:", error);
        showNotification("حدث خطأ أثناء الحفظ", "error");
    } finally {
        document.getElementById('submitAddressBtn').disabled = false;
        document.getElementById('submitAddressBtn').innerHTML = 'حفظ العنوان';
    }
}

// ============================================
// إلغاء الحجز
// ============================================
async function cancelBooking(bookingId) {
    if (!confirm("هل أنت متأكد من إلغاء هذا الحجز؟")) return;

    try {
        await updateDoc(doc(db, "bookings", bookingId), {
            status: 'cancelled',
            cancelledAt: new Date()
        });

        showNotification("تم إلغاء الحجز بنجاح", "success");
        await loadRecentBookings();
        await loadAllBookings('upcoming');
    } catch (error) {
        console.error("خطأ في إلغاء الحجز:", error);
        showNotification("حدث خطأ أثناء الإلغاء", "error");
    }
}

// ============================================
// إزالة من المفضلة
// ============================================
async function removeFromFavorites(itemId, type) {
    try {
        const favorites = userData.favorites || [];
        const updatedFavorites = favorites.filter(id => id !== itemId);
        
        await updateDoc(doc(db, "users", currentUser.uid), {
            favorites: updatedFavorites,
            updatedAt: new Date()
        });

        showNotification("تم إزالة العنصر من المفضلة", "success");
        await loadUserProfile();
        await loadFavorites(type);
    } catch (error) {
        console.error("خطأ في إزالة المفضلة:", error);
        showNotification("حدث خطأ أثناء الإزالة", "error");
    }
}

// ============================================
// تغيير كلمة المرور
// ============================================
async function changePassword() {
    const newPassword = prompt("أدخل كلمة المرور الجديدة (6 أحرف على الأقل):");
    
    if (!newPassword || newPassword.length < 6) {
        showNotification("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
        return;
    }

    try {
        await currentUser.updatePassword(newPassword);
        showNotification("تم تغيير كلمة المرور بنجاح", "success");
    } catch (error) {
        console.error("خطأ في تغيير كلمة المرور:", error);
        showNotification("حدث خطأ أثناء تغيير كلمة المرور", "error");
    }
}

// ============================================
// تعطيل الحساب
// ============================================
async function deactivateAccount() {
    if (!confirm("هل أنت متأكد من تعطيل حسابك مؤقتاً؟")) return;

    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            status: 'deactivated',
            deactivatedAt: new Date()
        });

        showNotification("تم تعطيل الحساب مؤقتاً", "success");
        setTimeout(() => {
            window.location.replace(resolvePath('INDEX'));
        }, 2000);
    } catch (error) {
        console.error("خطأ في تعطيل الحساب:", error);
        showNotification("حدث خطأ أثناء تعطيل الحساب", "error");
    }
}

// ============================================
// حذف الحساب
// ============================================
async function deleteAccount() {
    if (!confirm("تحذير: سيتم حذف حسابك وجميع بياناتك نهائياً. هل أنت متأكد؟")) return;
    
    const confirmText = prompt("اكتب 'حذف' لتأكيد الحذف:");
    if (confirmText !== 'حذف') {
        showNotification("تم إلغاء عملية الحذف", "info");
        return;
    }

    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            status: 'deleted',
            deletedAt: new Date()
        });

        await signOut(auth);
        showNotification("تم حذف الحساب بنجاح", "success");
        setTimeout(() => {
            window.location.replace(resolvePath('INDEX'));
        }, 2000);
    } catch (error) {
        console.error("خطأ في حذف الحساب:", error);
        showNotification("حدث خطأ أثناء حذف الحساب", "error");
    }
}

// ============================================
// تسجيل الخروج
// ============================================
async function logout() {
    if (!confirm("هل أنت متأكد من تسجيل الخروج؟")) return;

    try {
        await signOut(auth);
        showNotification("تم تسجيل الخروج بنجاح", "success");
        setTimeout(() => {
            window.location.replace(resolvePath('INDEX'));
        }, 1500);
    } catch (error) {
        console.error("خطأ في تسجيل الخروج:", error);
        showNotification("حدث خطأ أثناء تسجيل الخروج", "error");
    }
}

