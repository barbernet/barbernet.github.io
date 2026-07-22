import { PATHS, resolvePath } from '../shared/js/paths.js';
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
// 4. بيانات التقييمات (محاكاة)
// ============================================
let reviews = [
    {
        id: 1,
        author: 'أحمد محمد',
        rating: 5,
        text: 'خدمة ممتازة وحلاق محترف. أنصح الجميع بزيارة هذا الصالون.',
        date: '2026-07-20',
        context: 'قص شعر كلاسيكي',
        replied: true,
        reply: 'شكراً جزيلاً على ثقتك بنا! سعداء بخدمتك.',
        replyDate: '2026-07-21'
    },
    {
        id: 2,
        author: 'خالد السعيد',
        rating: 4,
        text: 'تجربة جيدة بشكل عام، لكن الانتظار كان طويلاً قليلاً.',
        date: '2026-07-19',
        context: 'حلاقة ذقن',
        replied: false,
        reply: null,
        replyDate: null
    },
    {
        id: 3,
        author: 'فاطمة حسن',
        rating: 5,
        text: 'أفضل صالون زرته! النظافة والاحترافية على أعلى مستوى.',
        date: '2026-07-18',
        context: 'تنظيف بشرة',
        replied: true,
        reply: 'نشكرك على كلماتك اللطيفة! نتمنى رؤيتك مرة أخرى.',
        replyDate: '2026-07-19'
    },
    {
        id: 4,
        author: 'سعد إبراهيم',
        rating: 3,
        text: 'الخدمة مقبولة، لكن السعر مرتفع قليلاً مقارنة بالجودة.',
        date: '2026-07-17',
        context: 'باقة العريس',
        replied: false,
        reply: null,
        replyDate: null
    },
    {
        id: 5,
        author: 'نورة محمد',
        rating: 5,
        text: 'تجربة رائعة! الموظفون ودودون والنتيجة مذهلة.',
        date: '2026-07-16',
        context: 'قص شعر + حلاقة',
        replied: true,
        reply: 'سعداء جداً بإعجابك! شكراً لاختيارك لنا.',
        replyDate: '2026-07-17'
    },
    {
        id: 6,
        author: 'محمد علي',
        rating: 2,
        text: 'لم أكن راضياً عن النتيجة، القص لم يكن كما طلبت.',
        date: '2026-07-15',
        context: 'قص شعر',
        replied: false,
        reply: null,
        replyDate: null
    }
];

let currentPage = 1;
const itemsPerPage = 5;
let currentFilterRating = 'all';
let currentFilterStatus = 'all';
let searchTerm = '';

// ============================================
// 5. تحديث الإحصائيات
// ============================================
function updateStats() {
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : '0.0';
    const replied = reviews.filter(r => r.replied).length;
    const pending = total - replied;
    
    document.getElementById('avgRating').textContent = avg;
    document.getElementById('totalReviews').textContent = total;
    document.getElementById('repliedReviews').textContent = replied;
    document.getElementById('pendingReviews').textContent = pending;
    
    renderDistribution();
}

// ============================================
// 6. توزيع التقييمات
// ============================================
function renderDistribution() {
    const container = document.getElementById('distributionBars');
    if (!container) return;
    
    const total = reviews.length;
    let html = '';
    
    for (let i = 5; i >= 1; i--) {
        const count = reviews.filter(r => r.rating === i).length;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        html += `
            <div class="distribution-row">
                <div class="distribution-label">
                    ${i} <i class="fas fa-star"></i>
                </div>
                <div class="distribution-bar-container">
                    <div class="distribution-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="distribution-count">${count}</div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// ============================================
// 7. عرض التقييمات
// ============================================
function renderReviews() {
    const list = document.getElementById('reviewsList');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');
    
    if (!list) return;
    
    let filtered = reviews.filter(review => {
        const matchesRating = currentFilterRating === 'all' || review.rating === parseInt(currentFilterRating);
        const matchesStatus = currentFilterStatus === 'all' || 
            (currentFilterStatus === 'replied' && review.replied) ||
            (currentFilterStatus === 'pending' && !review.replied);
        const matchesSearch = !searchTerm || 
            review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.text.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesRating && matchesStatus && matchesSearch;
    });
    
    if (filtered.length === 0) {
        list.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';
    
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageReviews = filtered.slice(start, end);
    
    list.innerHTML = pageReviews.map(review => {
        const stars = Array(5).fill(0).map((_, i) => 
            i < review.rating ? '<i class="fas fa-star"></i>' : '<i class="fas fa-star empty"></i>'
        ).join('');
        
        return `
            <div class="review-card ${!review.replied ? 'unreplied' : ''}">
                <div class="review-header">
                    <div class="review-author">
                        <div class="review-avatar">${review.author.charAt(0)}</div>
                        <div class="review-author-info">
                            <h4>${review.author}</h4>
                            <div class="review-meta">
                                <i class="fas fa-calendar"></i>
                                ${formatDate(review.date)}
                            </div>
                        </div>
                    </div>
                    <div class="review-rating">
                        <div class="stars">${stars}</div>
                        <span class="review-status ${review.replied ? 'replied' : 'pending'}">
                            ${review.replied ? 'تم الرد' : 'بانتظار الرد'}
                        </span>
                    </div>
                </div>
                
                <div class="review-content">
                    <p class="review-text">${review.text}</p>
                    <div class="review-context">
                        <i class="fas fa-tag"></i>
                        الخدمة: ${review.context}
                    </div>
                </div>
                
                ${review.replied ? `
                    <div class="review-reply">
                        <div class="reply-header">
                            <i class="fas fa-reply"></i>
                            رد الإدارة (${formatDate(review.replyDate)})
                        </div>
                        <p class="reply-text">${review.reply}</p>
                    </div>
                ` : ''}
                
                <div class="review-actions">
                    ${!review.replied ? `
                        <button class="btn btn-accent" onclick="openReplyModal(${review.id})">
                            <i class="fas fa-reply"></i> الرد على التقييم
                        </button>
                    ` : `
                        <button class="btn btn-outline" onclick="editReply(${review.id})">
                            <i class="fas fa-edit"></i> تعديل الرد
                        </button>
                    `}
                    <button class="btn btn-outline" onclick="deleteReview(${review.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    renderPagination(totalPages);
}

// ============================================
// 8. دوال مساعدة
// ============================================
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ar-SA', { 
        year: 'numeric', month: 'short', day: 'numeric' 
    });
}

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
        pageNum.addEventListener('click', () => { currentPage = i; renderReviews(); });
        pageNumbers.appendChild(pageNum);
    }
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// ============================================
// 9. Modal الرد
// ============================================
const replyModal = document.getElementById('replyModal');
const closeReplyBtn = document.getElementById('closeReplyModal');
const cancelReplyBtn = document.getElementById('cancelReplyBtn');
const replyForm = document.getElementById('replyForm');
let currentReviewId = null;

function openReplyModal(id) {
    const review = reviews.find(r => r.id === id);
    if (!review) return;
    
    currentReviewId = id;
    document.getElementById('replyModalTitle').textContent = 'الرد على التقييم';
    document.getElementById('reviewSummary').innerHTML = `
        <div class="summary-author">${review.author} - ${'⭐'.repeat(review.rating)}</div>
        <div class="summary-text">${review.text}</div>
    `;
    document.getElementById('replyText').value = '';
    replyModal.classList.add('active');
}

function editReply(id) {
    const review = reviews.find(r => r.id === id);
    if (!review) return;
    
    currentReviewId = id;
    document.getElementById('replyModalTitle').textContent = 'تعديل الرد';
    document.getElementById('reviewSummary').innerHTML = `
        <div class="summary-author">${review.author} - ${'⭐'.repeat(review.rating)}</div>
        <div class="summary-text">${review.text}</div>
    `;
    document.getElementById('replyText').value = review.reply || '';
    replyModal.classList.add('active');
}

function closeReplyModal() {
    replyModal.classList.remove('active');
    currentReviewId = null;
}

if (closeReplyBtn) closeReplyBtn.addEventListener('click', closeReplyModal);
if (cancelReplyBtn) cancelReplyBtn.addEventListener('click', closeReplyModal);
if (replyModal) replyModal.addEventListener('click', (e) => { if (e.target === replyModal) closeReplyModal(); });

if (replyForm) {
    replyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const replyText = document.getElementById('replyText').value.trim();
        if (!replyText) {
            showNotification('يرجى كتابة نص الرد', 'error');
            return;
        }
        
        const reviewIndex = reviews.findIndex(r => r.id === currentReviewId);
        if (reviewIndex !== -1) {
            reviews[reviewIndex].replied = true;
            reviews[reviewIndex].reply = replyText;
            reviews[reviewIndex].replyDate = new Date().toISOString().split('T')[0];
            
            updateStats();
            renderReviews();
            closeReplyModal();
            showNotification('تم إرسال الرد بنجاح!', 'success');
        }
    });
}

// ============================================
// 10. حذف التقييم
// ============================================
window.deleteReview = function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    
    reviews = reviews.filter(r => r.id !== id);
    updateStats();
    renderReviews();
    showNotification('تم حذف التقييم بنجاح!', 'success');
};

window.openReplyModal = openReplyModal;
window.editReply = editReply;

// ============================================
// 11. الفلاتر والبحث
// ============================================
const filterRating = document.getElementById('filterRating');
const filterStatus = document.getElementById('filterStatus');
const searchInput = document.getElementById('searchReviews');

if (filterRating) filterRating.addEventListener('change', (e) => {
    currentFilterRating = e.target.value;
    currentPage = 1;
    renderReviews();
});

if (filterStatus) filterStatus.addEventListener('change', (e) => {
    currentFilterStatus = e.target.value;
    currentPage = 1;
    renderReviews();
});

if (searchInput) searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    currentPage = 1;
    renderReviews();
});

// ============================================
// 12. أزرار الترقيم
// ============================================
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');

if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderReviews(); }
});

if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(reviews.length / itemsPerPage);
    if (currentPage < totalPages) { currentPage++; renderReviews(); }
});

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
    renderReviews();
});

