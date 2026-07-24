import { PATHS, resolvePath } from '../shared/utils/paths.js';
import { showNotification } from '../shared/js/notifications.js';

// ============================================
// 1. إدارة الشريط الجانبي
// ============================================
const menuToggleBtn = document.getElementById('menuToggle');
const closeSidebarBtn = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');

if (menuToggleBtn && sidebar) menuToggleBtn.addEventListener('click', () => sidebar.classList.add('open'));
if (closeSidebarBtn && sidebar) closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

// ============================================
// 2. توجيه الروابط
// ============================================
const navLinks = document.querySelectorAll('.sidebar-nav a[data-path]');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = resolvePath(link.getAttribute('data-path'));
    });
});

// ============================================
// 3. تمييز الصفحة النشطة
// ============================================
const currentPath = window.location.pathname.split('/').pop();
navLinks.forEach(link => {
    const linkPath = link.getAttribute('data-path');
    if (PATHS[linkPath] && PATHS[linkPath].includes(currentPath)) {
        link.classList.add('active');
    }
});

// ============================================
// 4. بيانات الإشعارات (محاكاة)
// ============================================
let notifications = [
    {
        id: 1,
        type: 'appointment',
        title: 'موعد جديد',
        message: 'تم حجز موعد جديد من قبل أحمد محمد غداً الساعة 10:00 صباحاً',
        time: 'منذ 5 دقائق',
        unread: true,
        action: { text: 'عرض الموعد', path: 'APPOINTMENTS' }
    },
    {
        id: 2,
        type: 'order',
        title: 'طلب جديد',
        message: 'تم استلام طلب جديد #ORD-1001 بقيمة 350 ر.س',
        time: 'منذ 15 دقيقة',
        unread: true,
        action: { text: 'عرض الطلب', path: 'DASHBOARD_ORDERS' }
    },
    {
        id: 3,
        type: 'system',
        title: 'تحديث النظام',
        message: 'تم تحديث نظام الحجز بنجاح. يمكنك الآن استخدام الميزات الجديدة',
        time: 'منذ ساعة',
        unread: false,
        action: null
    },
    {
        id: 4,
        type: 'appointment',
        title: 'تذكير بالموعد',
        message: 'تذكير: لديك 3 مواعيد اليوم',
        time: 'منذ 2 ساعة',
        unread: false,
        action: { text: 'عرض المواعيد', path: 'APPOINTMENTS' }
    },
    {
        id: 5,
        type: 'order',
        title: 'تم شحن الطلب',
        message: 'تم شحن الطلب #ORD-0998 بنجاح',
        time: 'منذ 3 ساعات',
        unread: false,
        action: { text: 'تتبع الطلب', path: 'DASHBOARD_ORDERS' }
    }
];

let currentFilter = 'all';

// ============================================
// 5. عرض الإشعارات
// ============================================
function renderNotifications() {
    const list = document.getElementById('notificationsList');
    const emptyState = document.getElementById('emptyState');
    
    if (!list) return;
    
    let filtered = notifications;
    
    if (currentFilter === 'unread') {
        filtered = notifications.filter(n => n.unread);
    } else if (currentFilter !== 'all') {
        filtered = notifications.filter(n => n.type === currentFilter);
    }
    
    if (filtered.length === 0) {
        list.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    list.innerHTML = filtered.map(notification => {
        const iconClass = notification.type === 'appointment' ? 'fa-calendar' :
                         notification.type === 'order' ? 'fa-shopping-cart' : 'fa-bell';
        
        return `
            <div class="notification-item ${notification.unread ? 'unread' : ''}" data-id="${notification.id}">
                ${notification.unread ? '<div class="notification-unread-dot"></div>' : ''}
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <div>
                            <h3 class="notification-title">${notification.title}</h3>
                            <span class="notification-time">${notification.time}</span>
                        </div>
                    </div>
                    <p class="notification-message">${notification.message}</p>
                    ${notification.action ? `
                        <div class="notification-actions">
                            <button class="btn btn-accent" onclick="handleNotificationAction(${notification.id})">
                                ${notification.action.text}
                            </button>
                            <button class="btn btn-outline" onclick="markAsRead(${notification.id})">
                                <i class="fas fa-check"></i>
                                تحديد كمقروء
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// 6. معالجة إجراءات الإشعارات
// ============================================
window.handleNotificationAction = function(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification && notification.action) {
        window.location.href = resolvePath(notification.action.path);
    }
};

window.markAsRead = function(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.unread = false;
        renderNotifications();
        showNotification('تم تحديد الإشعار كمقروء', 'success');
    }
};

// ============================================
// 7. فلاتر الإشعارات
// ============================================
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        renderNotifications();
    });
});

// ============================================
// 8. تحديد الكل كمقروء
// ============================================
const markAllReadBtn = document.getElementById('markAllReadBtn');
if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
        notifications.forEach(n => n.unread = false);
        renderNotifications();
        showNotification('تم تحديد جميع الإشعارات كمقروءة', 'success');
    });
}

// ============================================
// 9. زر تسجيل الخروج
// ============================================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            window.location.href = resolvePath('INDEX');
        }
    });
}

// ============================================
// 10. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) userNameElement.textContent = 'مدير النظام';
    
    renderNotifications();
});

