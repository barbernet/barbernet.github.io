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
// 4. بيانات التحليلات (محاكاة - سيتم استبدالها بـ Firebase)
// ============================================
const analyticsData = {
    week: {
        totalAppointments: 45,
        totalRevenue: 12500,
        newCustomers: 8,
        avgRating: 4.7,
        revenue: [1500, 1800, 2200, 1900, 2500, 2600, 0],
        services: {
            'قص شعر': 25,
            'حلاقة ذقن': 12,
            'تنظيف بشرة': 5,
            'باقة كاملة': 3
        },
        topCustomers: [
            { name: 'أحمد محمد', email: 'ahmed@example.com', visits: 12, spending: 3500, lastVisit: '2026-07-22', rating: 5 },
            { name: 'خالد عبدالله', email: 'khalid@example.com', visits: 8, spending: 2400, lastVisit: '2026-07-21', rating: 5 },
            { name: 'محمد علي', email: 'mohammed@example.com', visits: 6, spending: 1800, lastVisit: '2026-07-20', rating: 4 },
            { name: 'سعد إبراهيم', email: 'saad@example.com', visits: 5, spending: 1500, lastVisit: '2026-07-19', rating: 5 },
            { name: 'فهد سالم', email: 'fahad@example.com', visits: 4, spending: 1200, lastVisit: '2026-07-18', rating: 4 }
        ],
        performance: {
            occupancyRate: 78,
            avgBookingValue: 278,
            cancellationRate: 5,
            returnRate: 65
        }
    },
    month: {
        totalAppointments: 180,
        totalRevenue: 52000,
        newCustomers: 32,
        avgRating: 4.6,
        revenue: [12000, 13500, 14000, 12500],
        services: {
            'قص شعر': 95,
            'حلاقة ذقن': 48,
            'تنظيف بشرة': 22,
            'باقة كاملة': 15
        },
        topCustomers: [
            { name: 'أحمد محمد', email: 'ahmed@example.com', visits: 18, spending: 5200, lastVisit: '2026-07-22', rating: 5 },
            { name: 'خالد عبدالله', email: 'khalid@example.com', visits: 15, spending: 4500, lastVisit: '2026-07-21', rating: 5 },
            { name: 'محمد علي', email: 'mohammed@example.com', visits: 12, spending: 3600, lastVisit: '2026-07-20', rating: 4 },
            { name: 'سعد إبراهيم', email: 'saad@example.com', visits: 10, spending: 3000, lastVisit: '2026-07-19', rating: 5 },
            { name: 'فهد سالم', email: 'fahad@example.com', visits: 8, spending: 2400, lastVisit: '2026-07-18', rating: 4 }
        ],
        performance: {
            occupancyRate: 82,
            avgBookingValue: 289,
            cancellationRate: 4,
            returnRate: 68
        }
    },
    quarter: {
        totalAppointments: 520,
        totalRevenue: 156000,
        newCustomers: 95,
        avgRating: 4.5,
        revenue: [48000, 52000, 56000],
        services: {
            'قص شعر': 280,
            'حلاقة ذقن': 140,
            'تنظيف بشرة': 65,
            'باقة كاملة': 35
        },
        topCustomers: [
            { name: 'أحمد محمد', email: 'ahmed@example.com', visits: 45, spending: 13500, lastVisit: '2026-07-22', rating: 5 },
            { name: 'خالد عبدالله', email: 'khalid@example.com', visits: 38, spending: 11400, lastVisit: '2026-07-21', rating: 5 },
            { name: 'محمد علي', email: 'mohammed@example.com', visits: 32, spending: 9600, lastVisit: '2026-07-20', rating: 4 },
            { name: 'سعد إبراهيم', email: 'saad@example.com', visits: 28, spending: 8400, lastVisit: '2026-07-19', rating: 5 },
            { name: 'فهد سالم', email: 'fahad@example.com', visits: 25, spending: 7500, lastVisit: '2026-07-18', rating: 4 }
        ],
        performance: {
            occupancyRate: 80,
            avgBookingValue: 300,
            cancellationRate: 4.5,
            returnRate: 70
        }
    },
    year: {
        totalAppointments: 2100,
        totalRevenue: 630000,
        newCustomers: 380,
        avgRating: 4.6,
        revenue: [48000, 52000, 55000, 58000, 62000, 65000, 68000, 72000, 75000, 78000, 82000, 85000],
        services: {
            'قص شعر': 1120,
            'حلاقة ذقن': 560,
            'تنظيف بشرة': 260,
            'باقة كاملة': 160
        },
        topCustomers: [
            { name: 'أحمد محمد', email: 'ahmed@example.com', visits: 180, spending: 54000, lastVisit: '2026-07-22', rating: 5 },
            { name: 'خالد عبدالله', email: 'khalid@example.com', visits: 150, spending: 45000, lastVisit: '2026-07-21', rating: 5 },
            { name: 'محمد علي', email: 'mohammed@example.com', visits: 120, spending: 36000, lastVisit: '2026-07-20', rating: 4 },
            { name: 'سعد إبراهيم', email: 'saad@example.com', visits: 100, spending: 30000, lastVisit: '2026-07-19', rating: 5 },
            { name: 'فهد سالم', email: 'fahad@example.com', visits: 90, spending: 27000, lastVisit: '2026-07-18', rating: 4 }
        ],
        performance: {
            occupancyRate: 79,
            avgBookingValue: 300,
            cancellationRate: 4.2,
            returnRate: 72
        }
    }
};

let currentPeriod = 'week';
let revenueChart = null;
let servicesChart = null;

// ============================================
// 5. تحديث الإحصائيات
// ============================================
function updateStats(period) {
    const data = analyticsData[period];
    
    document.getElementById('totalAppointments').textContent = data.totalAppointments;
    document.getElementById('totalRevenue').textContent = `${data.totalRevenue.toLocaleString()} ر.س`;
    document.getElementById('newCustomers').textContent = data.newCustomers;
    document.getElementById('avgRating').textContent = data.avgRating.toFixed(1);
    
    document.getElementById('occupancyRate').textContent = `${data.performance.occupancyRate}%`;
    document.getElementById('avgBookingValue').textContent = `${data.performance.avgBookingValue} ر.س`;
    document.getElementById('cancellationRate').textContent = `${data.performance.cancellationRate}%`;
    document.getElementById('returnRate').textContent = `${data.performance.returnRate}%`;
}

// ============================================
// 6. رسم بياني للإيرادات
// ============================================
function createRevenueChart(period) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const data = analyticsData[period];
    const labels = period === 'week' ? 
        ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] :
        period === 'month' ? 
        ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'] :
        period === 'quarter' ?
        ['الشهر 1', 'الشهر 2', 'الشهر 3'] :
        ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'الإيرادات (ر.س)',
                data: data.revenue,
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#d4af37',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#2c3e50',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#d4af37',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y.toLocaleString()} ر.س`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' ر.س';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================
// 7. رسم بياني للخدمات
// ============================================
function createServicesChart(period) {
    const ctx = document.getElementById('servicesChart');
    if (!ctx) return;
    
    const data = analyticsData[period];
    const serviceLabels = Object.keys(data.services);
    const serviceValues = Object.values(data.services);
    
    if (servicesChart) {
        servicesChart.destroy();
    }
    
    servicesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: serviceLabels,
            datasets: [{
                data: serviceValues,
                backgroundColor: [
                    '#d4af37',
                    '#2c3e50',
                    '#27ae60',
                    '#3498db'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#2c3e50',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#d4af37',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// 8. عرض أفضل العملاء
// ============================================
function renderTopCustomers(period) {
    const tbody = document.getElementById('topCustomersTable');
    if (!tbody) return;
    
    const data = analyticsData[period];
    
    tbody.innerHTML = data.topCustomers.map(customer => `
        <tr>
            <td>
                <div class="customer-info">
                    <div class="customer-avatar">
                        ${customer.name.charAt(0)}
                    </div>
                    <div class="customer-details">
                        <span class="customer-name">${customer.name}</span>
                        <span class="customer-email">${customer.email}</span>
                    </div>
                </div>
            </td>
            <td>${customer.visits} زيارة</td>
            <td>${customer.spending.toLocaleString()} ر.س</td>
            <td>${formatDate(customer.lastVisit)}</td>
            <td>
                <div class="rating">
                    <span class="rating-stars">${'⭐'.repeat(customer.rating)}</span>
                    <span>${customer.rating}/5</span>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// 9. دالة مساعدة لتنسيق التاريخ
// ============================================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============================================
// 10. إدارة فلاتر الوقت
// ============================================
const timeTabs = document.querySelectorAll('.time-tab');

timeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        timeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        currentPeriod = tab.getAttribute('data-period');
        updateDashboard(currentPeriod);
    });
});

// ============================================
// 11. تحديث لوحة التحكم بالكامل
// ============================================
function updateDashboard(period) {
    updateStats(period);
    createRevenueChart(period);
    createServicesChart(period);
    renderTopCustomers(period);
}

// ============================================
// 12. فلترة الرسوم البيانية
// ============================================
const revenueChartFilter = document.getElementById('revenueChartFilter');
if (revenueChartFilter) {
    revenueChartFilter.addEventListener('change', (e) => {
        // هنا يمكن إضافة منطق لتغيير طريقة عرض البيانات
        console.log('تغيير فلتر الرسم البياني:', e.target.value);
    });
}

// ============================================
// 13. تصدير البيانات
// ============================================
const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        // هنا يمكن إضافة منطق لتصدير البيانات إلى CSV أو PDF
        alert('سيتم إضافة ميزة تصدير البيانات قريباً');
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
    if (userNameElement) {
        userNameElement.textContent = 'مدير النظام';
    }
    
    // تعيين التواريخ الافتراضية
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate && endDate) {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        startDate.value = weekAgo.toISOString().split('T')[0];
        endDate.value = today.toISOString().split('T')[0];
    }
    
    // تحديث لوحة التحكم
    updateDashboard(currentPeriod);
});

// ============================================
// 16. تطبيق نطاق التاريخ
// ============================================
const applyDateRangeBtn = document.getElementById('applyDateRange');
if (applyDateRangeBtn) {
    applyDateRangeBtn.addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            alert('يرجى اختيار نطاق تاريخ صحيح');
            return;
        }
        
        // هنا يمكن إضافة منطق لجلب البيانات حسب النطاق المحدد
        console.log('نطاق التاريخ:', startDate, 'إلى', endDate);
        alert('سيتم تحديث البيانات حسب النطاق المحدد');
    });
}

