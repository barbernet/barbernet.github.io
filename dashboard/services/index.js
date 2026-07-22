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
// 4. بيانات الخدمات (محاكاة)
// ============================================
let services = [
    {
        id: 1,
        name: 'قص شعر كلاسيكي',
        category: 'haircut',
        price: 50,
        duration: 30,
        description: 'قص شعر تقليدي باستخدام المقص والآلة',
        status: 'active',
        image: null
    },
    {
        id: 2,
        name: 'حلاقة ذقن كاملة',
        category: 'shave',
        price: 35,
        duration: 20,
        description: 'حلاقة ذقن احترافية مع منشفة ساخنة',
        status: 'active',
        image: null
    },
    {
        id: 3,
        name: 'تنظيف بشرة عميق',
        category: 'facial',
        price: 80,
        duration: 45,
        description: 'تنظيف بشرة متكامل مع ماسك مغذي',
        status: 'active',
        image: null
    },
    {
        id: 4,
        name: 'باقة العريس',
        category: 'package',
        price: 150,
        duration: 90,
        description: 'باقة متكاملة تشمل قص الشعر، الحلاقة، وتنظيف البشرة',
        status: 'active',
        image: null
    },
    {
        id: 5,
        name: 'قص شعر أطفال',
        category: 'haircut',
        price: 30,
        duration: 20,
        description: 'قص شعر للأطفال تحت 12 سنة',
        status: 'inactive',
        image: null
    }
];

let editingId = null;
let currentPage = 1;
const itemsPerPage = 6;

// ============================================
// 5. تحديث الإحصائيات
// ============================================
function updateStats() {
    document.getElementById('totalServices').textContent = services.length;
    
    const activeServices = services.filter(s => s.status === 'active');
    if (activeServices.length > 0) {
        const topService = activeServices.reduce((prev, current) => (prev.bookings > current.bookings) ? prev : current);
        document.getElementById('topService').textContent = topService.name;
    }
    
    const avgPrice = activeServices.length > 0 
        ? activeServices.reduce((sum, s) => sum + s.price, 0) / activeServices.length 
        : 0;
    document.getElementById('avgPrice').textContent = `${avgPrice.toFixed(0)} ر.س`;
    
    const avgDuration = activeServices.length > 0 
        ? activeServices.reduce((sum, s) => sum + s.duration, 0) / activeServices.length 
        : 0;
    document.getElementById('avgDuration').textContent = `${avgDuration.toFixed(0)} دقيقة`;
}

// ============================================
// 6. عرض الخدمات في الشبكة
// ============================================
function renderServices(filteredServices = services) {
    const grid = document.getElementById('servicesGrid');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');
    
    if (!grid) return;
    
    if (filteredServices.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';
    
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageServices = filteredServices.slice(start, end);
    
    grid.innerHTML = pageServices.map(service => `
        <div class="service-card">
            <div class="service-image">
                ${service.image ? `<img src="${service.image}" alt="${service.name}">` : '✂️'}
                <span class="service-status-badge ${service.status}">${service.status === 'active' ? 'نشط' : 'غير نشط'}</span>
            </div>
            <div class="service-content">
                <div class="service-category">${getCategoryText(service.category)}</div>
                <h3 class="service-name">${service.name}</h3>
                <p class="service-description">${service.description || 'لا يوجد وصف'}</p>
                <div class="service-meta">
                    <span class="service-price">${service.price} ر.س</span>
                    <span class="service-duration"><i class="fas fa-clock"></i> ${service.duration} دقيقة</span>
                </div>
                <div class="service-actions">
                    <button class="btn btn-outline" onclick="editService(${service.id})">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-accent" onclick="deleteService(${service.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    renderPagination(totalPages);
}

// ============================================
// 7. دوال مساعدة
// ============================================
function getCategoryText(category) {
    const categoryMap = {
        'haircut': 'قص الشعر',
        'shave': 'الحلاقة',
        'facial': 'العناية بالبشرة',
        'package': 'باقات'
    };
    return categoryMap[category] || category;
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
const modal = document.getElementById('serviceModal');
const addBtn = document.getElementById('addServiceBtn');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const form = document.getElementById('serviceForm');
const modalTitle = document.getElementById('modalTitle');

function openModal(isEdit = false) {
    if (!modal) return;
    modal.classList.add('active');
    if (modalTitle) {
        modalTitle.textContent = isEdit ? 'تعديل الخدمة' : 'إضافة خدمة جديدة';
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
// 10. معالجة النموذج
// ============================================
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const serviceData = {
            name: document.getElementById('serviceName').value,
            category: document.getElementById('serviceCategory').value,
            price: parseFloat(document.getElementById('servicePrice').value),
            duration: parseInt(document.getElementById('serviceDuration').value),
            description: document.getElementById('serviceDescription').value,
            status: document.getElementById('serviceStatus').value
        };
        
        if (editingId) {
            const index = services.findIndex(s => s.id === editingId);
            if (index !== -1) {
                services[index] = { ...services[index], ...serviceData };
            }
            showNotification('تم تحديث الخدمة بنجاح!', 'success');
        } else {
            serviceData.id = Date.now();
            serviceData.bookings = 0;
            serviceData.image = null;
            services.push(serviceData);
            showNotification('تم إضافة الخدمة بنجاح!', 'success');
        }
        
        updateStats();
        applyFilters();
        closeModal();
    });
}

// ============================================
// 11. دوال التعديل والحذف
// ============================================
window.editService = function(id) {
    const service = services.find(s => s.id === id);
    if (!service) return;
    
    editingId = id;
    document.getElementById('serviceName').value = service.name;
    document.getElementById('serviceCategory').value = service.category;
    document.getElementById('servicePrice').value = service.price;
    document.getElementById('serviceDuration').value = service.duration;
    document.getElementById('serviceDescription').value = service.description || '';
    document.getElementById('serviceStatus').value = service.status;
    
    openModal(true);
};

window.deleteService = function(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
    
    services = services.filter(s => s.id !== id);
    updateStats();
    applyFilters();
    showNotification('تم حذف الخدمة بنجاح!', 'success');
};

// ============================================
// 12. الفلترة والبحث
// ============================================
const searchInput = document.getElementById('searchServices');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');

function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const categoryFilter = filterCategory ? filterCategory.value : 'all';
    const statusFilter = filterStatus ? filterStatus.value : 'all';
    
    let filtered = services.filter(service => {
        const matchesSearch = !searchTerm || 
            service.name.toLowerCase().includes(searchTerm) ||
            (service.description && service.description.toLowerCase().includes(searchTerm));
        
        const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    renderServices(filtered);
}

if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; applyFilters(); });
if (filterCategory) filterCategory.addEventListener('change', () => { currentPage = 1; applyFilters(); });
if (filterStatus) filterStatus.addEventListener('change', () => { currentPage = 1; applyFilters(); });

// ============================================
// 13. أزرار الترقيم
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
        const totalPages = Math.ceil(services.length / itemsPerPage);
        if (currentPage < totalPages) { currentPage++; applyFilters(); }
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
    renderServices();
});

