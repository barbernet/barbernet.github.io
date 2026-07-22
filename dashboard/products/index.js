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
// 4. بيانات المنتجات (محاكاة)
// ============================================
let products = [
    {
        id: 1,
        name: 'زيت شعر الأرجان',
        category: 'haircare',
        price: 85,
        stock: 25,
        description: 'زيت شعر طبيعي 100% للعناية بالشعر الجاف',
        status: 'active',
        image: null
    },
    {
        id: 2,
        name: 'ماكينة حلاقة احترافية',
        category: 'tools',
        price: 350,
        stock: 8,
        description: 'ماكينة حلاقة عالية الجودة مع شفرات قابلة للاستبدال',
        status: 'active',
        image: null
    },
    {
        id: 3,
        name: 'كريم ترطيب البشرة',
        category: 'skincare',
        price: 65,
        stock: 3,
        description: 'كريم مرطب للبشرة الحساسة مع فيتامين E',
        status: 'active',
        image: null
    },
    {
        id: 4,
        name: 'مقص حلاقة ياباني',
        category: 'tools',
        price: 180,
        stock: 0,
        description: 'مقص حلاقة ياباني عالي الدقة',
        status: 'inactive',
        image: null
    },
    {
        id: 5,
        name: 'شامبو للشعر الدهني',
        category: 'haircare',
        price: 45,
        stock: 50,
        description: 'شامبو متخصص للشعر الدهني',
        status: 'active',
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
    document.getElementById('totalProducts').textContent = products.length;
    
    const inStock = products.filter(p => p.stock > 10).length;
    document.getElementById('inStockProducts').textContent = inStock;
    
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    document.getElementById('lowStockProducts').textContent = lowStock;
    
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    document.getElementById('inventoryValue').textContent = `${totalValue.toLocaleString()} ر.س`;
}

// ============================================
// 6. عرض المنتجات في الشبكة
// ============================================
function renderProducts(filteredProducts = products) {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');
    
    if (!grid) return;
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';
    
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = filteredProducts.slice(start, end);
    
    grid.innerHTML = pageProducts.map(product => {
        let stockStatus = 'out-of-stock';
        let stockText = 'نفذت الكمية';
        
        if (product.stock > 10) {
            stockStatus = 'in-stock';
            stockText = `${product.stock} متوفر`;
        } else if (product.stock > 0) {
            stockStatus = 'low-stock';
            stockText = `${product.stock} متبقي`;
        }
        
        return `
            <div class="product-card">
                <div class="product-image">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '📦'}
                    <span class="product-stock-badge ${stockStatus}">${stockText}</span>
                </div>
                <div class="product-content">
                    <div class="product-category">${getCategoryText(product.category)}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description || 'لا يوجد وصف'}</p>
                    <div class="product-meta">
                        <span class="product-price">${product.price} ر.س</span>
                        <span class="product-stock">${stockText}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-outline" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn btn-accent" onclick="deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    renderPagination(totalPages);
}

// ============================================
// 7. دوال مساعدة
// ============================================
function getCategoryText(category) {
    const categoryMap = {
        'haircare': 'العناية بالشعر',
        'skincare': 'العناية بالبشرة',
        'tools': 'أدوات الحلاقة',
        'accessories': 'إكسسوارات'
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
const modal = document.getElementById('productModal');
const addBtn = document.getElementById('addProductBtn');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const form = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');

function openModal(isEdit = false) {
    if (!modal) return;
    modal.classList.add('active');
    if (modalTitle) {
        modalTitle.textContent = isEdit ? 'تعديل المنتج' : 'إضافة منتج جديد';
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
        
        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescription').value,
            status: document.getElementById('productStatus').value
        };
        
        if (editingId) {
            const index = products.findIndex(p => p.id === editingId);
            if (index !== -1) {
                products[index] = { ...products[index], ...productData };
            }
            showNotification('تم تحديث المنتج بنجاح!', 'success');
        } else {
            productData.id = Date.now();
            productData.sales = 0;
            productData.image = null;
            products.push(productData);
            showNotification('تم إضافة المنتج بنجاح!', 'success');
        }
        
        updateStats();
        applyFilters();
        closeModal();
    });
}

// ============================================
// 11. دوال التعديل والحذف
// ============================================
window.editProduct = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    editingId = id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productStatus').value = product.status;
    
    openModal(true);
};

window.deleteProduct = function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    products = products.filter(p => p.id !== id);
    updateStats();
    applyFilters();
    showNotification('تم حذف المنتج بنجاح!', 'success');
};

// ============================================
// 12. الفلترة والبحث
// ============================================
const searchInput = document.getElementById('searchProducts');
const filterCategory = document.getElementById('filterCategory');
const filterStock = document.getElementById('filterStock');

function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const categoryFilter = filterCategory ? filterCategory.value : 'all';
    const stockFilter = filterStock ? filterStock.value : 'all';
    
    let filtered = products.filter(product => {
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm));
        
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        
        let matchesStock = true;
        if (stockFilter === 'instock') {
            matchesStock = product.stock > 10;
        } else if (stockFilter === 'lowstock') {
            matchesStock = product.stock > 0 && product.stock <= 10;
        } else if (stockFilter === 'outstock') {
            matchesStock = product.stock === 0;
        }
        
        return matchesSearch && matchesCategory && matchesStock;
    });
    
    renderProducts(filtered);
}

if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; applyFilters(); });
if (filterCategory) filterCategory.addEventListener('change', () => { currentPage = 1; applyFilters(); });
if (filterStock) filterStock.addEventListener('change', () => { currentPage = 1; applyFilters(); });

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
        const totalPages = Math.ceil(products.length / itemsPerPage);
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
    renderProducts();
});

