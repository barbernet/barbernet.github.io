/**
 * BarberFlow Pro - صفحة الأسئلة الشائعة
 * المسار: faq.js
 * الدور: إدارة منطق صفحة الأسئلة الشائعة
 * ✅ تم الإصلاح: إزالة الحماية + إصلاح فتح الأسئلة
 */

import { showNotification } from './shared/utils/notifications.js';
import { resolvePath } from './shared/utils/paths.js';

// ============================================
// 1. بيانات الأسئلة الشائعة (محدّثة وكثيرة)
// ============================================
const faqData = [
    // ==================== قسم عام ====================
    {
        id: 1,
        category: 'general',
        question: 'ما هي BarberFlow Pro؟',
        answer: `<p>BarberFlow Pro هي منصة رقمية متكاملة لقطاع الحلاقة والتجميل في المغرب، تربط بين:</p>
                 <ul>
                     <li><strong>الصالونات:</strong> لإدارة المواعيد والموظفين والخدمات</li>
                     <li><strong>المتاجر:</strong> لبيع منتجات العناية بالشعر والبشرة</li>
                     <li><strong>الزبائن:</strong> لحجز المواعيد وشراء المنتجات وتقييم الخدمات</li>
                 </ul>`,
        tag: 'عام'
    },
    {
        id: 2,
        category: 'general',
        question: 'هل المنصة مجانية للاستخدام؟',
        answer: `<p>نعم، التسجيل والاستكشاف مجانيان بالكامل. نقدم باقات اشتراك مرنة لأصحاب الصالونات والمتاجر:</p>
                 <ul>
                     <li><strong>الباقة الأساسية:</strong> مجانية (ميزات محدودة)</li>
                     <li><strong>الباقة الاحترافية:</strong> 99 DH/شهر</li>
                     <li><strong>الباقة المميزة:</strong> 199 DH/شهر (جميع الميزات)</li>
                 </ul>
                 <p>جميع الباقات تشمل تجربة مجانية لمدة 14 يوماً.</p>`,
        tag: 'عام'
    },
    {
        id: 3,
        category: 'general',
        question: 'في أي مدن المغرب تتوفر المنصة؟',
        answer: `<p>BarberFlow Pro متوفرة في جميع المدن المغربية، بما في ذلك:</p>
                 <ul>
                     <li>الدار البيضاء، الرباط، مراكش، فاس</li>
                     <li>طنجة، أكادير، مكناس، وجدة</li>
                     <li>القنيطرة، تطوان، سلا، وغيرها</li>
                 </ul>
                 <p>نعمل على التوسع المستمر لتشمل جميع المناطق.</p>`,
        tag: 'عام'
    },
    {
        id: 4,
        category: 'general',
        question: 'كيف يمكنني إنشاء حساب كزبون؟',
        answer: `<p>إنشاء حساب زبون سهل وسريع:</p>
                 <ul>
                     <li>انقر على "سجل الآن" في الصفحة الرئيسية</li>
                     <li>اختر "حساب زبون"</li>
                     <li>أدخل بريدك الإلكتروني ورقم هاتفك</li>
                     <li>أكد بريدك الإلكتروني عبر الرابط المرسل</li>
                 </ul>
                 <p>يمكنك البدء في الحجز والشراء فوراً!</p>`,
        tag: 'عام'
    },
    {
        id: 5,
        category: 'general',
        question: 'هل بياناتي الشخصية آمنة؟',
        answer: `<p>نعم، نستخدم أحدث تقنيات الأمان:</p>
                 <ul>
                     <li>تشفير SSL/TLS لجميع البيانات</li>
                     <li>قاعدة بيانات آمنة على Supabase</li>
                     <li>نظام مصادقة متقدم</li>
                     <li>نسخ احتياطية منتظمة</li>
                 </ul>
                 <p>راجع <a href="#" data-path="PRIVACY">سياسة الخصوصية</a> لمزيد من التفاصيل.</p>`,
        tag: 'عام'
    },
    {
        id: 6,
        category: 'general',
        question: 'هل يمكنني استخدام المنصة على الهاتف؟',
        answer: `<p>نعم! المنصة متوافقة تماماً مع جميع الأجهزة:</p>
                 <ul>
                     <li>تطبيق ويب تقدمي (PWA) يعمل على جميع المتصفحات</li>
                     <li>تصميم متجاوب للهواتف والأجهزة اللوحية</li>
                     <li>يمكنك إضافة الموقع للشاشة الرئيسية للوصول السريع</li>
                 </ul>`,
        tag: 'عام'
    },

    // ==================== قسم الحجز ====================
    {
        id: 7,
        category: 'booking',
        question: 'كيف أحجز موعداً في صالون؟',
        answer: `<p>لحجز موعد، اتبع الخطوات التالية:</p>
                 <ul>
                     <li>ابحث عن الصالون من صفحة "الصالونات"</li>
                     <li>اختر الخدمة المطلوبة</li>
                     <li>حدد التاريخ والوقت المناسب</li>
                     <li>أكد الحجز وانتظر رسالة التأكيد</li>
                 </ul>
                 <p>ستصلك رسالة تأكيد على بريدك ورقم هاتفك.</p>`,
        tag: 'حجز'
    },
    {
        id: 8,
        category: 'booking',
        question: 'هل يمكنني إلغاء أو تعديل الحجز؟',
        answer: `<p>نعم، يمكنك ذلك بسهولة:</p>
                 <ul>
                     <li>ادخل إلى حسابك</li>
                     <li>اذهب إلى "مواعيدي"</li>
                     <li>اختر الموعد وانقر على "تعديل" أو "إلغاء"</li>
                 </ul>
                 <p><strong>ملاحظة:</strong> الإلغاء مجاني قبل 24 ساعة من الموعد. الإلغاء المتأخر قد يخضع لرسوم.</p>`,
        tag: 'حجز'
    },
    {
        id: 9,
        category: 'booking',
        question: 'هل يمكنني حجز موعد لشخص آخر؟',
        answer: `<p>نعم، يمكنك حجز موعد لشخص آخر:</p>
                 <ul>
                     <li>في صفحة الحجز، اختر "حجز لشخص آخر"</li>
                     <li>أدخل اسم الشخص ورقم هاتفه</li>
                     <li>أكمل الحجز كالمعتاد</li>
                 </ul>
                 <p>ستصل رسالة التأكيد إلى الشخص المحجوز له.</p>`,
        tag: 'حجز'
    },
    {
        id: 10,
        category: 'booking',
        question: 'ماذا يحدث إذا تأخرت عن الموعد؟',
        answer: `<p>ننصح بالحضور قبل الموعد بـ 5 دقائق. في حالة التأخر:</p>
                 <ul>
                     <li>التأخر حتى 15 دقيقة: سيتم انتظارك</li>
                     <li>التأخر أكثر من 15 دقيقة: قد يتم إلغاء الحجز تلقائياً</li>
                     <li>يُنصح بالاتصال بالصالون في حالة التأخر</li>
                 </ul>`,
        tag: 'حجز'
    },
    {
        id: 11,
        category: 'booking',
        question: 'هل يمكنني حجز خدمات متعددة في نفس الموعد؟',
        answer: `<p>نعم، يمكنك حجز عدة خدمات في نفس الزيارة:</p>
                 <ul>
                     <li>اختر الخدمة الأولى</li>
                     <li>انقر على "إضافة خدمة أخرى"</li>
                     <li>اختر الخدمات الإضافية</li>
                     <li>سيتم حساب المدة والسعر الإجمالي تلقائياً</li>
                 </ul>`,
        tag: 'حجز'
    },
    {
        id: 12,
        category: 'booking',
        question: 'هل يجب الدفع مسبقاً للحجز؟',
        answer: `<p>يعتمد ذلك على سياسة كل صالون:</p>
                 <ul>
                     <li>بعض الصالونات تطلب عربوناً بسيطاً لتأكيد الحجز</li>
                     <li>بعضها الآخر لا يتطلب أي دفع مسبق</li>
                     <li>سيتم توضيح ذلك عند إتمام الحجز</li>
                 </ul>
                 <p>جميع المدفوعات مؤمنة ومشفرة.</p>`,
        tag: 'حجز'
    },

    // ==================== قسم الدفع ====================
    {
        id: 13,
        category: 'payment',
        question: 'ما هي طرق الدفع المتاحة؟',
        answer: `<p>نوفر عدة طرق دفع آمنة:</p>
                 <ul>
                     <li>بطاقات الائتمان (Visa, MasterCard)</li>
                     <li>Apple Pay و Google Pay</li>
                     <li>التحويل البنكي</li>
                     <li>الدفع عند الاستلام (للمنتجات)</li>
                     <li>محافظ إلكترونية (قريباً)</li>
                 </ul>`,
        tag: 'دفع'
    },
    {
        id: 14,
        category: 'payment',
        question: 'هل يمكنني استرداد أموالي؟',
        answer: `<p>سياسة الاسترداد تعتمد على نوع الخدمة:</p>
                 <ul>
                     <li><strong>للمواعيد:</strong> إلغاء مجاني قبل 24 ساعة</li>
                     <li><strong>للمنتجات:</strong> إرجاع خلال 14 يوماً إذا كان المنتج غير مستخدم</li>
                     <li><strong>للإلغاء المتأخر:</strong> قد يتم خصم نسبة من المبلغ</li>
                 </ul>
                 <p>لطلب استرداد، تواصل مع خدمة العملاء.</p>`,
        tag: 'دفع'
    },
    {
        id: 15,
        category: 'payment',
        question: 'هل المعاملات المالية آمنة؟',
        answer: `<p>نعم، جميع المعاملات مؤمنة بأعلى معايير الأمان:</p>
                 <ul>
                     <li>تشفير SSL/TLS 256-bit</li>
                     <li>معالجة الدفع عبر بوابات معتمدة</li>
                     <li>لا نخزن بيانات بطاقتك على خوادمنا</li>
                     <li>مراقبة مستمرة للعمليات المشبوهة</li>
                 </ul>`,
        tag: 'دفع'
    },
    {
        id: 16,
        category: 'payment',
        question: 'كيف يمكنني تغيير طريقة الدفع؟',
        answer: `<p>يمكنك تغيير طريقة الدفع في أي وقت:</p>
                 <ul>
                     <li>ادخل إلى حسابك</li>
                     <li>اذهب إلى "الإعدادات" → "طرق الدفع"</li>
                     <li>أضف أو احذف طرق الدفع</li>
                     <li>اختر الطريقة الافتراضية</li>
                 </ul>`,
        tag: 'دفع'
    },
    {
        id: 17,
        category: 'payment',
        question: 'هل الأسعار تشمل ضريبة القيمة المضافة؟',
        answer: `<p>نعم، جميع الأسعار المعروضة على المنصة تشمل ضريبة القيمة المضافة (TVA) وفقاً للقوانين المغربية.</p>
                 <p>يتم عرض السعر النهائي بوضوح قبل إتمام أي عملية شراء أو حجز.</p>`,
        tag: 'دفع'
    },

    // ==================== قسم تقني ====================
    {
        id: 18,
        category: 'technical',
        question: 'ما هي المتطلبات التقنية لاستخدام المنصة؟',
        answer: `<p>المتطلبات بسيطة جداً:</p>
                 <ul>
                     <li>متصفح حديث (Chrome, Firefox, Safari, Edge)</li>
                     <li>اتصال بالإنترنت</li>
                     <li>أي جهاز (كمبيوتر، هاتف، جهاز لوحي)</li>
                 </ul>
                 <p>لا حاجة لتثبيت أي برامج إضافية.</p>`,
        tag: 'تقني'
    },
    {
        id: 19,
        category: 'technical',
        question: 'كيف أحصل على الدعم الفني؟',
        answer: `<p>فريق الدعم متاح لمساعدتك عبر:</p>
                 <ul>
                     <li>البريد الإلكتروني: support@barberflow.pro</li>
                     <li>الدردشة المباشرة (متاحة من 9 ص - 9 م)</li>
                     <li>الهاتف: 0501234567</li>
                     <li>صفحة <a href="#" data-path="CONTACT">اتصل بنا</a></li>
                 </ul>
                 <p>نلتزم بالرد خلال 24 ساعة في أيام العمل.</p>`,
        tag: 'تقني'
    },
    {
        id: 20,
        category: 'technical',
        question: 'ماذا أفعل إذا نسيت كلمة المرور؟',
        answer: `<p>لا تقلق، يمكنك استعادتها بسهولة:</p>
                 <ul>
                     <li>انقر على "نسيت كلمة المرور" في صفحة تسجيل الدخول</li>
                     <li>أدخل بريدك الإلكتروني</li>
                     <li>ستصلك رسالة تحتوي على رابط إعادة التعيين</li>
                     <li>اتبع الرابط واختر كلمة مرور جديدة</li>
                 </ul>`,
        tag: 'تقني'
    },
    {
        id: 21,
        category: 'technical',
        question: 'كيف يمكنني تغيير لغة المنصة؟',
        answer: `<p>لتغيير اللغة:</p>
                 <ul>
                     <li>انقر على أيقونة الإعدادات في الشريط العلوي</li>
                     <li>اختر "اللغة"</li>
                     <li>اختر من: العربية، الفرنسية، الإنجليزية</li>
                 </ul>
                 <p>سيتم حفظ تفضيلك تلقائياً.</p>`,
        tag: 'تقني'
    },
    {
        id: 22,
        category: 'technical',
        question: 'هل يمكنني استخدام المنصة بدون إنترنت؟',
        answer: `<p>بعض الميزات متاحة بدون إنترنت بفضل تقنية PWA:</p>
                 <ul>
                     <li>عرض الحجوزات السابقة</li>
                     <li>الوصول إلى معلومات الصالونات المحفوظة</li>
                     <li>لكن الحجز والشراء يتطلبان اتصالاً بالإنترنت</li>
                 </ul>`,
        tag: 'تقني'
    },

    // ==================== قسم الحساب ====================
    {
        id: 23,
        category: 'account',
        question: 'كيف أنشئ حساب صالون أو متجر؟',
        answer: `<p>لإنشاء حساب تجاري:</p>
                 <ul>
                     <li>انقر على "سجل الآن" واختر "حساب صالون" أو "حساب متجر"</li>
                     <li>أدخل معلومات النشاط التجاري</li>
                     <li>أكمل عملية التحقق من البريد</li>
                     <li>أضف الخدمات/المنتجات وصور الصالون</li>
                 </ul>
                 <p>سيتم مراجعة حسابك خلال 24-48 ساعة.</p>`,
        tag: 'حساب'
    },
    {
        id: 24,
        category: 'account',
        question: 'كيف أحدّث معلومات حسابي؟',
        answer: `<p>لتحديث معلومات حسابك:</p>
                 <ul>
                     <li>ادخل إلى حسابك</li>
                     <li>انقر على صورتك الشخصية</li>
                     <li>اختر "الملف الشخصي" أو "الإعدادات"</li>
                     <li>عدّل المعلومات واحفظ التغييرات</li>
                 </ul>`,
        tag: 'حساب'
    },
    {
        id: 25,
        category: 'account',
        question: 'كيف أحذف حسابي؟',
        answer: `<p>يمكنك حذف حسابك في أي وقت:</p>
                 <ul>
                     <li>ادخل إلى الإعدادات</li>
                     <li>اختر "حذف الحساب"</li>
                     <li>أكد عملية الحذف</li>
                 </ul>
                 <p><strong>ملاحظة:</strong> سيتم حذف جميع بياناتك خلال 30 يوماً. هذه العملية لا يمكن التراجع عنها.</p>`,
        tag: 'حساب'
    },
    {
        id: 26,
        category: 'account',
        question: 'لماذا لم أستلم رسالة تأكيد البريد؟',
        answer: `<p>إذا لم تستلم رسالة التأكيد:</p>
                 <ul>
                     <li>تحقق من مجلد البريد العشوائي (Spam)</li>
                     <li>تأكد من صحة بريدك الإلكتروني</li>
                     <li>انتظر بضع دقائق</li>
                     <li>انقر على "إعادة إرسال رسالة التأكيد"</li>
                 </ul>
                 <p>إذا استمرت المشكلة، تواصل مع الدعم.</p>`,
        tag: 'حساب'
    },
    {
        id: 27,
        category: 'account',
        question: 'هل يمكنني ربط حسابي بـ Google أو Facebook؟',
        answer: `<p>نعم، نوفر تسجيل الدخول عبر:</p>
                 <ul>
                     <li>Google</li>
                     <li>Facebook (قريباً)</li>
                     <li>Apple (قريباً)</li>
                 </ul>
                 <p>هذا يسرع عملية التسجيل ويسهل تسجيل الدخول.</p>`,
        tag: 'حساب'
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

    // تحديث الروابط الديناميكية داخل الإجابات
    updateDynamicLinks();
}

// ============================================
// 4. ✅ Event Delegation - إصلاح مشكلة الفتح
// ============================================
faqList.addEventListener('click', (e) => {
    // البحث عن أقرب عنصر faq-question
    const questionElement = e.target.closest('.faq-question');
    
    if (!questionElement) return;
    
    const faqItem = questionElement.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // إغلاق جميع الأسئلة
    document.querySelectorAll('.faq-item.active').forEach(item => {
        item.classList.remove('active');
    });
    
    // فتح السؤال الحالي إذا لم يكن مفتوحاً
    if (!isActive) {
        faqItem.classList.add('active');
    }
});

// ============================================
// 5. فلترة حسب التصنيف
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
// 6. البحث
// ============================================
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.trim();
        renderFAQs();
    });
}

// ============================================
// 7. تحديث الروابط الديناميكية
// ============================================
function updateDynamicLinks() {
    const links = document.querySelectorAll('[data-path]');
    links.forEach(link => {
        const key = link.getAttribute('data-path');
        const fullPath = resolvePath(key);
        link.setAttribute('href', fullPath);
    });
}

// ============================================
// 8. تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ صفحة الأسئلة الشائعة تم تحميلها بنجاح');
    
    renderFAQs();
    updateDynamicLinks();
});

