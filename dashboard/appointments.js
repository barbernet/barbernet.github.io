import { PATHS, resolvePath } from '../shared/utils/paths.js';

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
// 4. بيانات المواعيد (محاكاة - سيتم استبدالها بـ Firebase)
// ============================================
let appointments = [
    {
        id: 1,
        clientName: 'أحمد محمد',
        clientPhone: '+966501234567',
        service: 'قص شعر',
        date: '2026-07-22',
        time: '10:00',
        status: 'confirmed',
        notes: 'يفضل الحلاق أحمد'
    },
    {
        id: 2,
        clientName: 'خالد عبدالله',
        clientPhone: '+966509876543',
        service: 'حلاقة ذقن',
        date: '2026-07-22',
        time: '11:30',
        status: 'pending',
        notes: ''
    },
    {
        id: 3,
        clientName: 'محمد علي',
        clientPhone: '+966551112222',
        service: 'باقة كاملة',
        date: '2026-07-23',
        time: '14:00',
        status: 'confirmed',
        notes: 'عيد ميلاد'
    },
    {
        id: 4,
        clientName: 'سعد إبراهيم',
        clientPhone: '+966503334444',
        service: 'تنظيف بشرة',
        date: '2026-07-21',
        time: '16:00',
        status: 'completed',
        notes: ''
    },
    {
        id: 5,
        clientName: 'فهد سالم',
        clientPhone: '+966507778888',
        service: 'قص شعر',
        date: '2026-07-20',
        time: '09:00',
        status: 'cancelled',
        notes: 'اعتذر في اللحظة الأخيرة'
    }
];

let editingId = null;

// ============================================
// 5. عرض المواعيد في الجدول
// ============================================
function renderAppointments(filteredAppointments = appointments) {
    const tbody = document.getElementById('appointmentsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) return;
    
    if (filteredAppointments.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    tbody.innerHTML = filteredAppointments.map(apt => `
        <tr>
            <td>
                <strong>${apt.clientName}</strong><br>
                <small style="color: var(--text-muted);">${apt.clientPhone}</small>
            </td>
            <td>${apt.service}</td>
            <td>${formatDate(apt.date)}</td>
            <td>${apt.time}</td>
            <td>
                <span class="status-badge status-${apt.status}">
                    ${getStatusText(apt.status)}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-edit" onclick="editAppointment(${apt.id})" title="تعديل">✏️</button>
                    <button class="btn-icon btn-delete" onclick="deleteAppointment(${apt.id})" title="حذف">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// 6. دوال مساعدة
// ============================================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'قيد الانتظار',
        'confirmed': 'مؤكد',
        'completed': 'مكتمل',
        'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
}

// ============================================
// 7. Modal Management
// ============================================
const modal = document.getElementById('appointmentModal');
const addBtn = document.getElementById('addAppointmentBtn');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const form = document.getElementById('appointmentForm');
const modalTitle = document.getElementById('modalTitle');

function openModal(isEdit = false) {
    if (!modal) return;
    modal.classList.add('active');
    if (modalTitle) {
        modalTitle.textContent = isEdit ? 'تعديل الموعد' : 'إضافة موعد جديد';
    }
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    if (form) form.reset();
    editingId = null;
}

if (addBtn) {
    addBtn.addEventListener('click', () => {
        editingId = null;
        openModal(false);
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
}

// إغلاق Modal عند النقر خارجه
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// ============================================
// 8. معالجة النموذج (إضافة/تعديل)
// ============================================
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const appointmentData = {
            clientName: document.getElementById('clientName').value,
            clientPhone: document.getElementById('clientPhone').value,
            service: document.getElementById('serviceType').options[document.getElementById('serviceType').selectedIndex].text,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value,
            notes: document.getElementById('notes').value,
            status: 'confirmed'
        };
        
        if (editingId) {
            // تعديل موعد موجود
            const index = appointments.findIndex(a => a.id === editingId);
            if (index !== -1) {
                appointments[index] = { ...appointments[index], ...appointmentData };
            }
            showNotification('تم تحديث الموعد بنجاح!', 'success');
        } else {
            // إضافة موعد جديد
            appointmentData.id = Date.now();
            appointments.push(appointmentData);
            showNotification('تم إضافة الموعد بنجاح!', 'success');
        }
        
        renderAppointments();
        closeModal();
    });
}

// ============================================
// 9. دوال التعديل والحذف (Global)
// ============================================
window.editAppointment = function(id) {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;
    
    editingId = id;
    
    document.getElementById('clientName').value = appointment.clientName;
    document.getElementById('clientPhone').value = appointment.clientPhone;
    document.getElementById('serviceType').value = getServiceValue(appointment.service);
    document.getElementById('appointmentDate').value = appointment.date;
    document.getElementById('appointmentTime').value = appointment.time;
    document.getElementById('notes').value = appointment.notes;
    
    openModal(true);
};

window.deleteAppointment = function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;
    
    appointments = appointments.filter(a => a.id !== id);
    renderAppointments();
    showNotification('تم حذف الموعد بنجاح!', 'success');
};

function getServiceValue(serviceName) {
    const serviceMap = {
        'قص شعر': 'haircut',
        'حلاقة ذقن': 'shave',
        'تنظيف بشرة': 'facial',
        'باقة كاملة': 'package'
    };
    return serviceMap[serviceName] || '';
}

// ============================================
// 10. الفلترة والبحث
// ============================================
const searchInput = document.getElementById('searchAppointments');
const filterDate = document.getElementById('filterDate');
const filterStatus = document.getElementById('filterStatus');

function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const dateFilter = filterDate ? filterDate.value : '';
    const statusFilter = filterStatus ? filterStatus.value : 'all';
    
    let filtered = appointments.filter(apt => {
        const matchesSearch = !searchTerm || 
            apt.clientName.toLowerCase().includes(searchTerm) ||
            apt.clientPhone.includes(searchTerm) ||
            apt.service.toLowerCase().includes(searchTerm);
        
        const matchesDate = !dateFilter || apt.date === dateFilter;
        const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
        
        return matchesSearch && matchesDate && matchesStatus;
    });
    
    renderAppointments(filtered);
}

if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
}

if (filterDate) {
    filterDate.addEventListener('change', applyFilters);
}

if (filterStatus) {
    filterStatus.addEventListener('change', applyFilters);
}

// ============================================
// 11. زر تسجيل الخروج
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
// 12. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = 'مدير النظام';
    }
    
    // تعيين تاريخ اليوم كقيمة افتراضية
    if (filterDate) {
        filterDate.value = new Date().toISOString().split('T')[0];
    }
    
    renderAppointments();
});

// ============================================
// 13. دالة مساعدة للإشعارات
// ============================================
function showNotification(message, type = 'info') {
    alert(message);
}

