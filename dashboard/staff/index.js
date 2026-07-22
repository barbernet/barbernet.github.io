import { PATHS, resolvePath } from '../../shared/js/paths.js';
import { showNotification } from '../../shared/js/notifications.js';

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
// 4. بيانات الموظفين (محاكاة)
// ============================================
let staffMembers = [
  { id: 1, name: 'أحمد الحلاق', role: 'senior_barber', phone: '+966501111111', email: 'ahmed@barber.com', commission: 40, status: 'active', bio: 'خبرة 10 سنوات في القصات الكلاسيكية والحديثة', appointments: 120, revenue: 15000 },
  { id: 2, name: 'خالد الفني', role: 'barber', phone: '+966502222222', email: 'khalid@barber.com', commission: 30, status: 'active', bio: 'متخصص في الحلاقة الذقن والتنسيق', appointments: 85, revenue: 9500 },
  { id: 3, name: 'سعد المدير', role: 'manager', phone: '+966503333333', email: 'saad@barber.com', commission: 0, status: 'active', bio: 'إدارة العمليات اليومية والموارد البشرية', appointments: 0, revenue: 0 },
  { id: 4, name: 'فهد الاستقبال', role: 'receptionist', phone: '+966504444444', email: 'fahad@barber.com', commission: 10, status: 'on_leave', bio: 'تنظيم المواعيد وخدمة العملاء', appointments: 0, revenue: 0 },
  { id: 5, name: 'محمد الشاب', role: 'barber', phone: '+966505555555', email: 'mohammed@barber.com', commission: 25, status: 'inactive', bio: 'قصات عصرية وتلوين', appointments: 40, revenue: 4000 }
];

let editingId = null;

// ============================================
// 5. تحديث الإحصائيات
// ============================================
function updateStats() {
  document.getElementById('totalStaff').textContent = staffMembers.length;
  document.getElementById('activeStaff').textContent = staffMembers.filter(s => s.status === 'active').length;
  document.getElementById('onLeaveStaff').textContent = staffMembers.filter(s => s.status === 'on_leave').length;
  
  const totalCommissions = staffMembers.reduce((sum, s) => {
    return sum + (s.revenue * (s.commission / 100));
  }, 0);
  document.getElementById('totalCommissions').textContent = `${Math.round(totalCommissions).toLocaleString()} ر.س`;
}

// ============================================
// 6. عرض الموظفين في الشبكة
// ============================================
function renderStaff(filteredStaff = staffMembers) {
  const grid = document.getElementById('staffGrid');
  const emptyState = document.getElementById('emptyState');
  
  if (!grid) return;
  
  if (filteredStaff.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  
  grid.innerHTML = filteredStaff.map(member => {
    const roleText = getRoleText(member.role);
    const statusText = getStatusText(member.status);
    const commissionAmount = Math.round(member.revenue * (member.commission / 100));
    
    return `
            <div class="staff-card">
                <div class="staff-header">
                    <div class="staff-status-dot ${member.status}" title="${statusText}"></div>
                    <div class="staff-avatar">${member.name.charAt(0)}</div>
                </div>
                <div class="staff-body">
                    <h3 class="staff-name">${member.name}</h3>
                    <div class="staff-role">${roleText}</div>
                    <p class="staff-bio">${member.bio || 'لا توجد نبذة متاحة'}</p>
                    
                    <div class="staff-stats">
                        <div class="staff-stat-item">
                            <span class="staff-stat-value">${member.appointments}</span>
                            <span class="staff-stat-label">موعد</span>
                        </div>
                        <div class="staff-stat-item">
                            <span class="staff-stat-value">${commissionAmount}</span>
                            <span class="staff-stat-label">عمولة (ر.س)</span>
                        </div>
                    </div>
                    
                    <div class="staff-actions">
                        <button class="btn btn-outline" onclick="editStaff(${member.id})">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn btn-accent" onclick="deleteStaff(${member.id})">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
  }).join('');
}

// ============================================
// 7. دوال مساعدة
// ============================================
function getRoleText(role) {
  const map = { 'barber': 'حلاق', 'senior_barber': 'حلاق أول', 'manager': 'مدير', 'receptionist': 'موظف استقبال' };
  return map[role] || role;
}

function getStatusText(status) {
  const map = { 'active': 'نشط', 'on_leave': 'في إجازة', 'inactive': 'غير نشط' };
  return map[status] || status;
}

// ============================================
// 8. Modal Management
// ============================================
const modal = document.getElementById('staffModal');
const addBtn = document.getElementById('addStaffBtn');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const form = document.getElementById('staffForm');
const modalTitle = document.getElementById('modalTitle');

function openModal(isEdit = false) {
  if (!modal) return;
  modal.classList.add('active');
  modalTitle.textContent = isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد';
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('active');
  if (form) form.reset();
  editingId = null;
}

if (addBtn) addBtn.addEventListener('click', () => { editingId = null;
  openModal(false); });
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// ============================================
// 9. معالجة النموذج
// ============================================
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const staffData = {
      name: document.getElementById('staffName').value,
      role: document.getElementById('staffRole').value,
      phone: document.getElementById('staffPhone').value,
      email: document.getElementById('staffEmail').value,
      commission: parseFloat(document.getElementById('staffCommission').value),
      status: document.getElementById('staffStatus').value,
      bio: document.getElementById('staffBio').value
    };
    
    if (editingId) {
      const index = staffMembers.findIndex(s => s.id === editingId);
      if (index !== -1) {
        staffMembers[index] = { ...staffMembers[index], ...staffData };
      }
      showNotification('تم تحديث بيانات الموظف بنجاح!', 'success');
    } else {
      staffData.id = Date.now();
      staffData.appointments = 0;
      staffData.revenue = 0;
      staffMembers.push(staffData);
      showNotification('تم إضافة الموظف بنجاح!', 'success');
    }
    
    updateStats();
    applyFilters();
    closeModal();
  });
}

// ============================================
// 10. دوال التعديل والحذف
// ============================================
window.editStaff = function(id) {
  const member = staffMembers.find(s => s.id === id);
  if (!member) return;
  
  editingId = id;
  document.getElementById('staffName').value = member.name;
  document.getElementById('staffRole').value = member.role;
  document.getElementById('staffPhone').value = member.phone;
  document.getElementById('staffEmail').value = member.email || '';
  document.getElementById('staffCommission').value = member.commission;
  document.getElementById('staffStatus').value = member.status;
  document.getElementById('staffBio').value = member.bio || '';
  
  openModal(true);
};

window.deleteStaff = function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
  
  staffMembers = staffMembers.filter(s => s.id !== id);
  updateStats();
  applyFilters();
  showNotification('تم حذف الموظف بنجاح!', 'success');
};

// ============================================
// 11. الفلترة والبحث
// ============================================
const searchInput = document.getElementById('searchStaff');
const filterRole = document.getElementById('filterRole');
const filterStatus = document.getElementById('filterStatus');

function applyFilters() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const roleFilter = filterRole ? filterRole.value : 'all';
  const statusFilter = filterStatus ? filterStatus.value : 'all';
  
  let filtered = staffMembers.filter(member => {
    const matchesSearch = !searchTerm ||
      member.name.toLowerCase().includes(searchTerm) ||
      member.role.toLowerCase().includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  renderStaff(filtered);
}

if (searchInput) searchInput.addEventListener('input', applyFilters);
if (filterRole) filterRole.addEventListener('change', applyFilters);
if (filterStatus) filterStatus.addEventListener('change', applyFilters);

// ============================================
// 12. زر إضافة أول موظف
// ============================================
const addFirstBtn = document.getElementById('addFirstStaffBtn');
if (addFirstBtn) addFirstBtn.addEventListener('click', () => { editingId = null;
  openModal(false); });

// ============================================
// 13. زر تسجيل الخروج
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
// 14. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const userNameElement = document.getElementById('userName');
  if (userNameElement) userNameElement.textContent = 'مدير النظام';
  
  updateStats();
  renderStaff();
});