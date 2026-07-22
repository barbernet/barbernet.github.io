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
// 4. بيانات العملاء (محاكاة)
// ============================================
let customers = [
    {
        id: 1,
        name: 'أحمد محمد العلي',
        phone: '+966501234567',
        email: 'ahmed@example.com',
        gender: 'male',
        visits: 12,
        spending: 3500,
        status: 'vip',
        joinDate: '2025-03-15',
        birthdate: '1990-05-20',
        notes: 'عميل مميز، يفضل الحلاق أحمد'
    },
    {
        id: 2,
        name: 'خالد عبدالله السعيد',
        phone: '+966509876543',
        email: 'khalid@example.com',
        gender: 'male',
        visits: 8,
        spending: 2400,
        status: 'active',
        joinDate: '2025-06-10',
        birthdate: '1988-11-15',
        notes: ''
    },
    {
        id: 3,
        name: 'فاطمة حسن',
        phone: '+966551112222',
        email: 'fatima@example.com',
        gender: 'female',
        visits: 6,
        spending: 1800,
        status: 'active',
        joinDate: '2025-08-22',
        birthdate: '1992-02-10',
        notes: 'تفضل المواعيد الصباحية'
    },
    {
        id: 4,
        name: 'سعد إبراهيم',
        phone: '+966503334444',
        email: 'saad@example.com',
        gender: 'male',
        visits: 2,
        spending: 600,
        status: 'inactive',
        joinDate: '2024-12-05',
        birthdate: '1995-07-30',
        notes: 'لم يزرنا منذ 3 أشهر'
    },
    {
        id: 5,
        name: 'نورة محمد',
        phone: '+966507778888',
        email: 'noura@example.com',
        gender: 'female',
        visits: 15,
        spending: 4500,
        status: 'vip',
        joinDate: '2024-09-18',
        birthdate: '1987-04-25',
        notes: 'عميلة VIP، تفضل المنتجات العضوية'
    }
];

let editingId = null;
let currentPage = 1;
const itemsPerPage = 10;

// ============================================
// 5. تحديث الإحصائيات
// ============================================
function updateStats() {
    document.getElementById('totalCustomers').textContent = customers.length;
    
    const thisMonth = new Date().getMonth();
    const newThisMonth = customers.filter(c => {
        const joinDate = new Date(c.joinDate);
        return joinDate.getMonth() === thisMonth;
    }).length;
    document.getElementById('newCustomers').textContent = newThisMonth;
    
    const vipCount = customers.filter(c => c.status === 'vip').length;
    document.getElementById('vipCustomers').textContent = vipCount;
    
    const inactiveCount = customers.filter(c => c.status === 'inactive').length;
    document.getElementById('inactiveCustomers').textContent = inactiveCount;
}

// ============================================
// 6. عرض العملاء في الجدول
// ============================================
function renderCustomers(filteredCustomers = customers) {
    const tbody = document.getElementById('customersTableBody');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');
    
    if (!tbody) return;
    
    if (filteredCustomers.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';
    
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageCustomers = filteredCustomers.slice(start, end);
    
    tbody.innerHTML = pageCustomers.map(customer => `
        <tr>
            <td><input type="checkbox" class="customer-checkbox" data-id="${customer.id}"></td>
            <td>
                <div class="customer-cell">
                    <div class="customer-avatar ${customer.gender}">${customer.name.charAt(0)}</div>
                    <div class="customer-info">
                        <span class="customer-name">${customer.name}</span>
                        <span class="customer-id">#${String(customer.id).padStart(4, '0')}</span>
                    </div>
                </div>
            </td>
            <td>${customer.phone}</td>
            <td>${customer.visits} زيارة</td>
            <td>${customer.spending.toLocaleString()} ر.س</td>
            <td><span class="status-badge status-${customer.status}">${getStatusText(customer.status)}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-view" onclick="viewCustomer(${customer.id})" title="عرض">👁️</button>
                    <button class="btn-icon btn-edit" onclick="editCustomer(${customer.id})" title="تعديل">✏️</button>
                    <button class="btn-icon btn-delete" onclick="deleteCustomer(${customer.id})" title="حذف">🗑️</button>
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
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusText(status) {
    const statusMap = { 'active': 'نشط', 'vip': 'VIP', 'inactive': 'غير نشط' };
    return statusMap[status] || status;
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
        pageNum.addEventListener('click', () => {
            currentPage = i;
            applyFilters();
        });
        pageNumbers.appendChild(pageNum);
    }
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// ============================================
// 9. Modal Management
// ============================================
const modal = document.getElementById('customerModal');
const addBtn = document.getElementById('addCustomerBtn');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const form = document.getElementById('customerForm');
const modalTitle = document.getElementById('modalTitle');

function openModal(isEdit = false) {
    if (!modal) return;
    modal.classList.add('active');
    if (modalTitle) {
        modalTitle.textContent = isEdit ? 'تعديل بيانات العميل' : 'إضافة عميل جديد';
    }
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    if (form) form.reset();
    editingId = null;
}

if (addBtn) addBtn.addEventListener('click', () => { editingId = null; openModal(false); });
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// ============================================
// 10. معالجة النموذج (باستخدام showNotification)
// ============================================
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerData = {
            name: document.getElementById('customerName').value,
            phone: document.getElementById('customerPhone').value,
            email: document.getElementById('customerEmail').value,
            gender: document.getElementById('customerGender').value,
            status: document.getElementById('customerStatus').value,
            birthdate: document.getElementById('customerBirthdate').value,
            notes: document.getElementById('customerNotes').value
        };
        
        if (editingId) {
            const index = customers.findIndex(c => c.id === editingId);
            if (index !== -1) {
                customers[index] = { ...customers[index], ...customerData };
            }
            showNotification('تم تحديث بيانات العميل بنجاح!', 'success');
        } else {
            customerData.id = Date.now();
            customerData.visits = 0;
            customerData.spending = 0;
            customerData.joinDate = new Date().toISOString().split('T')[0];
            customers.push(customerData);
            showNotification('تم إضافة العميل بنجاح!', 'success');
        }
        
        updateStats();
        applyFilters();
        closeModal();
    });
}

// ============================================
// 11. دوال العرض والتعديل والحذف
// ============================================
window.viewCustomer = function(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    const detailsContent = document.getElementById('customerDetailsContent');
    if (detailsContent) {
        detailsContent.innerHTML = `
            <div class="details-section">
                <h3>المعلومات الشخصية</h3>
                <div class="details-grid">
                    <div class="detail-item"><span class="detail-label">الاسم</span><span class="detail-value">${customer.name}</span></div>
                    <div class="detail-item"><span class="detail-label">رقم الهاتف</span><span class="detail-value">${customer.phone}</span></div>
                    <div class="detail-item"><span class="detail-label">البريد الإلكتروني</span><span class="detail-value">${customer.email || '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">الجنس</span><span class="detail-value">${customer.gender === 'male' ? 'ذكر' : 'أنثى'}</span></div>
                    <div class="detail-item"><span class="detail-label">تاريخ الميلاد</span><span class="detail-value">${customer.birthdate ? formatDate(customer.birthdate) : '-'}</span></div>
                    <div class="detail-item"><span class="detail-label">الحالة</span><span class="detail-value"><span class="status-badge status-${customer.status}">${getStatusText(customer.status)}</span></span></div>
                </div>
            </div>
            <div class="details-section">
                <h3>إحصائيات العميل</h3>
                <div class="details-grid">
                    <div class="detail-item"><span class="detail-label">عدد الزيارات</span><span class="detail-value">${customer.visits} زيارة</span></div>
                    <div class="detail-item"><span class="detail-label">إجمالي الإنفاق</span><span class="detail-value">${customer.spending.toLocaleString()} ر.س</span></div>
                    <div class="detail-item"><span class="detail-label">تاريخ الانضمام</span><span class="detail-value">${formatDate(customer.joinDate)}</span></div>
                    <div class="detail-item"><span class="detail-label">متوسط الإنفاق</span><span class="detail-value">${customer.visits > 0 ? Math.round(customer.spending / customer.visits).toLocaleString() : 0} ر.س</span></div>
                </div>
            </div>
            ${customer.notes ? `<div class="details-section"><h3>ملاحظات</h3><p style="color: var(--text-secondary); line-height: 1.8;">${customer.notes}</p></div>` : ''}
        `;
    }
    
    const detailsModal = document.getElementById('customerDetailsModal');
    if (detailsModal) detailsModal.classList.add('active');
};

window.editCustomer = function(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    editingId = id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerGender').value = customer.gender;
    document.getElementById('customerStatus').value = customer.status;
    document.getElementById('customerBirthdate').value = customer.birthdate || '';
    document.getElementById('customerNotes').value = customer.notes || '';
    
    openModal(true);
};

window.deleteCustomer = function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
    
    customers = customers.filter(c => c.id !== id);
    updateStats();
    applyFilters();
    showNotification('تم حذف العميل بنجاح!', 'success');
};

// إغلاق Modal التفاصيل
const closeDetailsBtn = document.getElementById('closeDetailsModal');
const detailsModal = document.getElementById('customerDetailsModal');
if (closeDetailsBtn && detailsModal) {
    closeDetailsBtn.addEventListener('click', () => detailsModal.classList.remove('active'));
    detailsModal.addEventListener('click', (e) => { if (e.target === detailsModal) detailsModal.classList.remove('active'); });
}

// ============================================
// 12. الفلترة والبحث
// ============================================
const searchInput = document.getElementById('searchCustomers');
const filterStatus = document.getElementById('filterStatus');
const filterGender = document.getElementById('filterGender');

function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = filterStatus ? filterStatus.value : 'all';
    const genderFilter = filterGender ? filterGender.value : 'all';
    
    let filtered = customers.filter(customer => {
        const matchesSearch = !searchTerm || 
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.phone.includes(searchTerm) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm));
        
        const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
        const matchesGender = genderFilter === 'all' || customer.gender === genderFilter;
        
        return matchesSearch && matchesStatus && matchesGender;
    });
    
    renderCustomers(filtered);
}

if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; applyFilters(); });
if (filterStatus) filterStatus.addEventListener('change', () => { currentPage = 1; applyFilters(); });
if (filterGender) filterGender.addEventListener('change', () => { currentPage = 1; applyFilters(); });

// ============================================
// 13. اختيار الكل
// ============================================
const selectAllCheckbox = document.getElementById('selectAll');
if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.customer-checkbox');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
    });
}

// ============================================
// 14. أزرار الترقيم
// ============================================
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');

if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; applyFilters(); }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(customers.length / itemsPerPage);
        if (currentPage < totalPages) { currentPage++; applyFilters(); }
    });
}

// ============================================
// 15. زر تسجيل الخروج
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
// 16. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) userNameElement.textContent = 'مدير النظام';
    
    updateStats();
    renderCustomers();
});

