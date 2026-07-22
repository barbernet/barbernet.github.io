import { showNotification } from 'shared/js/notifications.js';

// ============================================
// 1. بيانات الأسئلة الشائعة
// ============================================
const faqData = [
    {
        id: 1,
        category: 'general',
        question: 'ما هي BarberFlow Pro؟',
        answer: `
            <p>BarberFlow Pro هي منصة متكاملة لإدارة الصالونات والمتاجر المتخصصة في منتجات العناية بالشعر والبشرة.</p>
            <p>تتيح المنصة للعملاء حجز المواعيد إلكترونياً وشراء المنتجات، بينما توفر لأصحاب الصالونات أدوات متقدمة لإدارة أعمالهم بكفاءة.</p>
        `,
        tag: 'عام'
    },
    {
        id: 2,
        category: 'booking',
        question: 'كيف أحجز موعداً في صالون؟',
        answer: `
            <p>لحجز موعد، اتبع الخطوات التالية:</p>
            <ul>
                <li>ابحث عن الصالون الذي تريده من صفحة "الصالونات"</li>
                <li>اختر الخدمة المطلوبة والتاريخ والوقت المناسب</li>
                <li>أكد الحجز وانتظر رسالة التأكيد</li>
            </ul>
            <p>ستصلك رسالة تأكيد على بريدك الإلكتروني ورقم هاتفك.</p>
        `,
        tag: 'حجز'
    },
    {
        id: 3,
        category: 'payment',
        question: 'ما هي طرق الدفع المتاحة؟',
        answer: `
            <p>نوفر عدة طرق دفع آمنة:</p>
            <ul>
                <li>بطاقات الائتمان (Visa, MasterCard)</li>
                <li>Apple Pay و Google Pay</li>
                <li>التحويل البنكي</li>
                <li>الدفع عند الاستلام (للمنتجات)</li>
            </ul>
            <p>جميع المعاملات مشفرة وآمنة 100%.</p>
        `,
        tag: 'دفع'
    },
    {
        id: 4,
        category: 'general',
        question: 'كيف أنشئ حساباً كصاحب صالون؟',
        answer: `
            <p>لإنشاء حساب كصاحب صالون:</p>
            <ul>
                <li>انقر على "سجل الآن" في الصفحة الرئيسية</li>
                <li>اختر "حساب صالون"</li>
                <li>املأ البيانات المطلوبة (الاسم، البريد، الهاتف)</li>
                <li>أكمل عملية التحقق من بريدك الإلكتروني</li>
                <li>أضف معلومات صالونك وخدماتك</li>
            </ul>
            <p>بعد الموافقة على حسابك، يمكنك البدء فوراً!</p>
        `,
        tag: 'عام'
    },
    {
        id: 5,
        category: 'technical',
        question: 'هل يمكنني تغيير موعد الحجز بعد تأكيده؟',
        answer: `
            <p>نعم، يمكنك تعديل أو إلغاء الموعد حتى 24 ساعة قبل الموعد المحدد.</p>
            <p>للقيام بذلك:</p>
            <ul>
                <li>ادخل إلى حسابك</li>
                <li>اذهب إلى "مواعيدي"</li>
                <li>اختر الموعد الذي تريد تعديله</li>
                <li>انقر على "تعديل الموعد" أو "إلغاء"</li>
            </ul>
        `,
        tag: 'تقني'
    },
    {
        id: 6,
        category: 'payment',
        question: 'كيف يمكنني استرداد أموالي؟',
        answer: `
            <p>سياسة الاسترداد تعتمد على نوع الخدمة:</p>
            <ul>
                <li><strong>للمواعيد:</strong> يمكن الإلغاء مجاناً قبل 24 ساعة</li>
                <li><strong>للمنتجات:</strong> يمكن الإرجاع خلال 14 يوماً إذا كان المنتج غير مستخدم</li>
                <li><strong>للإلغاء المتأخر:</strong> قد يتم خصم نسبة من المبلغ</li>
            </ul>
            <p>لطلب استرداد، تواصل مع خدمة العملاء.</p>
        `,
        tag: 'دفع'
    },
    {
        id: 7,
        category: 'booking',
        question: 'هل يمكنني حجز موعد لشخص آخر؟',
        answer: `
            <p>نعم، يمكنك حجز موعد لشخص آخر بسهولة:</p>
            <ul>
                <li>في صفحة الحجز، اختر "حجز لشخص آخر"</li>
                <li>أدخل اسم الشخص ورقم هاتفه</li>
                <li>أكمل الحجز كالمعتاد</li>
            </ul>
            <p>ستصل رسالة التأكيد إلى الشخص المحجوز له.</p>
        `,
        tag: 'حجز'
    },
    {
        id: 8,
        category: 'technical',
        question: 'هل التطبيق متاح على الهواتف؟',
        answer: `
            <p>نعم! BarberFlow Pro متوفر كـ:</p>
            <ul>
                <li>تطبيق ويب تقدمي (PWA) يعمل على جميع الأجهزة</li>
                <li>تطبيق iOS (قريباً)</li>
                <li>تطبيق Android (قريباً)</li>
            </ul>
            <p>يمكنك إضافة الموقع إلى الشاشة الرئيسية لهاتفك للوصول السريع.</p>
        `,
        tag: 'تقني'
    },
    {
        id: 9,
        category: 'general',
        question: 'كم تكلفة الاشتراك في المنصة؟',
        answer: `
            <p>نقدم باقات اشتراك مرنة تناسب جميع الأحجام:</p>
            <ul>
                <li><strong>الباقة الأساسية:</strong> مجانية (ميزات محدودة)</li>
                <li><strong>الباقة الاحترافية:</strong> 99 ر.س/شهر</li>
                <li><strong>الباقة المميزة:</strong> 199 ر.س/شهر (جميع الميزات)</li>
            </ul>
            <p>جميع البقات تشمل تجربة مجانية لمدة 14 يوماً.</p>
        `,
        tag: 'عام'
    },
    {
        id: 10,
        category: 'technical',
        question: 'كيف أحصل على الدعم الفني؟',
        answer: `
            <p>فريق الدعم متاح لمساعدتك عبر:</p>
            <ul>
                <li>البريد الإلكتروني: support@barberflow.pro</li>
                <li>الدردشة المباشرة (متاحة من 9 ص - 9 م)</li>
                <li>الهاتف: 9200XXXX</li>
                <li>صفحة "اتصل بنا"</li>
            </ul>
            <p>نلتزم بالرد خلال 24 ساعة في أيام العمل.</p>
        `,
        tag: 'تقني'
    }
];

// ============================================
// 2. عناصر DOM
// ============================================
const faqList = document.getElementById('faqList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('faqSearch');
const categoryBtns = document.querySelectorAll('.category-btn');

let currentCategory = 'all';
let searchTerm = '';

// ============================================
// 3. عرض الأسئلة
// ============================================
function renderFAQs() {
    let filtered = faqData.filter(item => {
        const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
        const matchesSearch = !searchTerm || 
            item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesCategory && matchesSearch;
    });
    
    if (filtered.length === 0) {
        faqList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    faqList.innerHTML = filtered.map(item => `
        <div class="faq-item" data-id="${item.id}">
            <div class="faq-question">
                <h3>${item.question}</h3>
                <div class="faq-icon">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <div class="faq-answer">
                <div class="faq-answer-content">
                    ${item.answer}
                    <span class="faq-category-tag">${item.tag}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // إضافة مستمعي الأحداث للأسئلة
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const isActive = item.classList.contains('active');
            
            // إغلاق جميع الأسئلة
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            
            // فتح السؤال الحالي إذا لم يكن مفتوحاً
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// ============================================
// 4. فلترة حسب التصنيف
// ============================================
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category');
        renderFAQs();
    });
});

// ============================================
// 5. البحث
// ============================================
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.trim();
        renderFAQs();
    });
}

// ============================================
// 6. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة الأسئلة الشائعة جاهزة');
    renderFAQs();
    
    // فتح أول سؤال تلقائياً (اختياري)
    // const firstItem = document.querySelector('.faq-item');
    // if (firstItem) firstItem.classList.add('active');
});

