import { PATHS, resolvePath } from '../../shared/js/paths.js';
import { showNotification } from '../../shared/js/notifications.js';

// ============================================
// 1. إدارة الشريط الجانبي
// ============================================
const menuToggleBtn = document.getElementById('menuToggle');
const closeSidebarBtn = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');

if (menuToggleBtn && sidebar) {
    menuToggleBtn.addEventListener('click', () => sidebar.classList.add('open'));
}
if (closeSidebarBtn && sidebar) {
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));
}

// ============================================
// 2. توجيه الروابط
// ============================================
const navLinks = document.querySelectorAll('.sidebar-nav a[data-path]');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pathKey = link.getAttribute('data-path');
        window.location.href = resolvePath(pathKey);
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
// 4. بيانات الطلبات (محاكاة)
// ============================================
let orders = [
    { id: 'ORD-1001', customer: 'أحمد محمد', date: '2026-07-22', total: 350, status: 'pending', payment: 'بطاقة ائتمان', items: 3, address: 'الرياض، حي العليا' },
    { id: 'ORD-1002', customer: 'خالد السعيد', date: '2026-07-21', total: 120, status: 'processing', payment: 'Apple Pay', items: 1, address: 'جدة، حي الروضة' },
    { id: 'ORD-1003', customer: 'فاطمة حسن', date: '2026-07-20', total: 450, status: 'shipped', payment: 'تحويل بنكي', items: 5, address: 'الدمام، حي الفيحاء' },
    { id: 'ORD-1004', customer: 'سعد إبراهيم', date: '2026-07-19', total: 85, status: 'delivered', payment: 'الدفع عند الاستلام', items: 2, address: 'مكة، حي الشوقية' },
    { id: 'ORD-1005', customer: 'نورة محمد', date: '2026-07-18', total: 220, status: 'cancelled', payment: 'بطاقة ائتمان', items: 2, address: 'المدينة، حي العزيزية' },
    { id: 'ORD-1006', customer: 'محمد علي', date: '2026-07-18', total: 180, status: 'delivered', payment: 'Apple Pay', items: 1, address: 'الرياض، حي الملقا' }
];

let currentOrderId = null;
let currentPage = 1;
const itemsPerPage = 10;

// ============================================
// 5. تحديث الإحصائيات
// ============================================
function updateStats() {
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('pendingOrders').textContent = orders.filter(o => o.status === 'pending').length;
    document.getElementById('completedOrders').textContent = orders.filter(o => o.status === 'delivered').length;
    
    const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0);
    document.getElementById('totalRevenue').textContent = `${totalRevenue.toLocaleString()} ر.س`;
}

// ============================================
// 6. عرض الطلبات في الجدول
// ============================================
function renderOrders(filteredOrders = orders) {
    const tbody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');
    
    if (!tbody) return;
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';
    
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageOrders = filteredOrders.slice(start, end);
    
    tbody.innerHTML = pageOrders.map(order => `
        <tr>
            <td><span class="order-id">#${order.id}</span></td>
            <td>
                <div class="customer-cell">
                    <div class="customer-avatar">${order.customer.charAt(0)}</div>
                    <span>${order.customer}</span>
                </div>
            </td>
            <td>${formatDate(order.date)}</td>
            <td><strong>${order.total} ر.س</strong></td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>${order.payment}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="viewOrder('${order.id}')" title="عرض"><i class="fas fa-eye"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    
    renderPagination(totalPages);
}

// ============================================
// 7. دوال مساعدة
// ============================================
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusText(status) {
    const map = {
        'pending': 'قيد الانتظار',
        'processing': 'قيد التجهيز',
        'shipped': 'تم الشحن',
        'delivered': 'تم التوصيل',
        'cancelled': 'ملغي'
    };
    return map[status] || status;
}

// ============================================
// 8. الترقيم
// ============================================
function renderPagination(totalPages) {
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (!pageNumbers) return;
    pageNumbers.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const pageNum = document.createElement('div');
        pageNum.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageNum.textContent = i;
        pageNum.addEventListener('click', () => { currentPage = i; applyFilters(); });
        pageNumbers.appendChild(pageNum);
    }
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// ============================================
// 9. Modal Management
// ============================================
const modal = document.getElementById('orderModal');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const updateStatusBtn = document.getElementById('updateStatusBtn');

function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    currentOrderId = null;
}

if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// ============================================
// 10. عرض تفاصيل الطلب وتحديث حالته
// ============================================
window.viewOrder = function(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    currentOrderId = id;
    document.getElementById('modalTitle').textContent = `تفاصيل الطلب #${order.id}`;
    
    const detailsContent = document.getElementById('orderDetailsContent');
    if (detailsContent) {
        detailsContent.innerHTML = `
            <div class="details-section">
                <h3>معلومات الطلب</h3>
                <div class="details-grid">
                    <div class="detail-item"><span class="detail-label">رقم الطلب</span><span class="detail-value">#${order.id}</span></div>
                    <div class="detail-item"><span class="detail-label">التاريخ</span><span class="detail-value">${formatDate(order.date)}</span></div>
                    <div class="detail-item"><span class="detail-label">عدد المنتجات</span><span class="detail-value">${order.items} منتجات</span></div>
                    <div class="detail-item"><span class="detail-label">طريقة الدفع</span><span class="detail-value">${order.payment}</span></div>
                </div>
            </div>
            <div class="details-section">
                <h3>معلومات العميل</h3>
                <div class="details-grid">
                    <div class="detail-item"><span class="detail-label">الاسم</span><span class="detail-value">${order.customer}</span></div>
                    <div class="detail-item"><span class="detail-label">العنوان</span><span class="detail-value">${order.address}</span></div>
                </div>
            </div>
            <div class="details-section">
                <h3>تحديث حالة الطلب</h3>
                <select id="newStatusSelect" class="status-select">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>قيد التجهيز</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التوصيل</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                </select>
            </div>
        `;
    }
    
    modal.classList.add('active');
};

if (updateStatusBtn) {
    updateStatusBtn.addEventListener('click', () => {
        if (!currentOrderId) return;
        
        const newStatus = document.getElementById('newStatusSelect').value;
        const orderIndex = orders.findIndex(o => o.id === currentOrderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            updateStats();
            applyFilters();
            closeModal();
            showNotification(`تم تحديث حالة الطلب #${currentOrderId} بنجاح!`, 'success');
        }
    });
}

// ============================================
// 11. الفلترة والبحث
// ============================================
const searchInput = document.getElementById('searchOrders');
const filterStatus = document.getElementById('filterStatus');
const filterDate = document.getElementById('filterDate');

function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = filterStatus ? filterStatus.value : 'all';
    const dateFilter = filterDate ? filterDate.value : '';
    
    let filtered = orders.filter(order => {
        const matchesSearch = !searchTerm || 
            order.id.toLowerCase().includes(searchTerm) ||
            order.customer.toLowerCase().includes(searchTerm);
        
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesDate = !dateFilter || order.date === dateFilter;
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    renderOrders(filtered);
}

if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; applyFilters(); });
if (filterStatus) filterStatus.addEventListener('change', () => { currentPage = 1; applyFilters(); });
if (filterDate) filterDate.addEventListener('change', () => { currentPage = 1; applyFilters(); });

// ============================================
// 12. أزرار الترقيم
// ============================================
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');

if (prevPageBtn) prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; applyFilters(); } });
if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(orders.length / itemsPerPage);
    if (currentPage < totalPages) { currentPage++; applyFilters(); }
});

// ============================================
// 13. زر التحديث
// ============================================
const refreshBtn = document.getElementById('refreshOrdersBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        showNotification('تم تحديث البيانات بنجاح!', 'info');
        applyFilters();
    });
}

// ============================================
// 14. زر تسجيل الخروج
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
// 15. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) userNameElement.textContent = 'مدير النظام';
    
    updateStats();
    renderOrders();
});

