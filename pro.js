/**
 * BarberFlow Pro - صفحة الباقات المميزة (ذكية)
 * المسار: pro.js
 * ✅ تم التحديث: Supabase + Cache + Error Handler + Analytics
 * ✅ تم الإصلاح: مشكلة اختفاء الباقات عند التبديل بين الشهري والسنوي
 */
import { supabase } from "./config/supabase-init.js";
import { showNotification } from "./shared/utils/notifications.js";
import { PATHS, resolvePath } from "./shared/utils/paths.js";
import { Analytics } from "./shared/utils/analytics.js";
import { cacheFetch } from "./shared/utils/cache.js";
import { safeExecute } from "./shared/utils/error-handler.js";

// ============================================
// المتغيرات العامة
// ============================================
let currentUser = null;
let userRole = null; // 'salon', 'store', أو null
let currentRole = 'salon'; // الدور الحالي للعرض (افتراضي: صالون)
let isYearly = false;

// ============================================
// بيانات المميزات حسب الدور
// ============================================
const FEATURES_DATA = {
    salon: [
        { icon: 'fa-chart-line', title: 'تحليلات متقدمة', desc: 'تقارير مفصلة عن أداء صالونك مع insights ذكية تساعدك في اتخاذ قرارات أفضل' },
        { icon: 'fa-bullhorn', title: 'ترويج مميز', desc: 'ظهور صالونك في النتائج الأولى مع شارة "موصى به" تجذب المزيد من العملاء' },
        { icon: 'fa-calendar-check', title: 'حجوزات غير محدودة', desc: 'لا قيود على عدد الحجوزات الشهرية، نمّي أعمالك بحرية كاملة' },
        { icon: 'fa-headset', title: 'دعم فني 24/7', desc: 'فريق دعم متخصص جاهز لمساعدتك في أي وقت عبر الهاتف أو الدردشة المباشرة' },
        { icon: 'fa-palette', title: 'تخصيص كامل', desc: 'صمم صفحة صالونك بألوانك وشعارك الخاص لتعكس هوية علامتك التجارية' },
        { icon: 'fa-mobile-alt', title: 'تطبيق خاص', desc: 'تطبيق مخصص لصالونك على iOS و Android لعملائك مع إشعارات فورية' }
    ],
    store: [
        { icon: 'fa-chart-line', title: 'تحليلات المبيعات', desc: 'تقارير مفصلة عن مبيعات متجرك مع insights ذكية لتحسين الأداء' },
        { icon: 'fa-bullhorn', title: 'ترويج مميز', desc: 'ظهور متجرك في النتائج الأولى مع شارة "موثوق" تجذب المزيد من المشترين' },
        { icon: 'fa-box-open', title: 'منتجات غير محدودة', desc: 'لا قيود على عدد المنتجات، أضف كل ما تريد بدون حدود' },
        { icon: 'fa-headset', title: 'دعم فني 24/7', desc: 'فريق دعم متخصص جاهز لمساعدتك في أي وقت' },
        { icon: 'fa-palette', title: 'تخصيص المتجر', desc: 'صمم صفحة متجرك بألوانك وشعارك الخاص' },
        { icon: 'fa-truck', title: 'إدارة الشحن', desc: 'نظام متكامل لإدارة الشحن والتوصيل مع تتبع الطلبات' }
    ]
};

// ============================================
// بيانات الباقات حسب الدور
// ============================================
const PLANS_DATA = {
    salon: [
        {
            name: 'Starter',
            desc: 'للمبتدئين وأصحاب الصالونات الصغيرة',
            monthlyPrice: 0,
            yearlyPrice: 0,
            features: [
                { text: 'حتى 50 حجز شهرياً', included: true },
                { text: 'صفحة صالون أساسية', included: true },
                { text: 'دعم عبر البريد الإلكتروني', included: true },
                { text: 'تقارير أساسية', included: true },
                { text: 'ترويج مميز', included: false },
                { text: 'تطبيق مخصص', included: false },
                { text: 'تحليلات متقدمة', included: false }
            ],
            cta: 'ابدأ مجاناً',
            featured: false
        },
        {
            name: 'Professional',
            desc: 'للصالونات النامية',
            monthlyPrice: 199,
            yearlyPrice: 1910,
            features: [
                { text: 'حجوزات غير محدودة', included: true },
                { text: 'صفحة صالون مخصصة بالكامل', included: true },
                { text: 'دعم فني 24/7', included: true },
                { text: 'تحليلات وتقارير متقدمة', included: true },
                { text: 'ترويج مميز وشارة "موصى به"', included: true },
                { text: 'تطبيق مخصص للعملاء', included: true },
                { text: 'مدير حساب مخصص', included: false }
            ],
            cta: 'اشترك الآن',
            featured: true
        },
        {
            name: 'Enterprise',
            desc: 'لسلاسل الصالونات الكبيرة',
            monthlyPrice: 499,
            yearlyPrice: 4790,
            features: [
                { text: 'كل مميزات Professional', included: true },
                { text: 'فروع غير محدودة', included: true },
                { text: 'مدير حساب مخصص', included: true },
                { text: 'API كامل للتكامل', included: true },
                { text: 'تدريب فريق العمل', included: true },
                { text: 'SLA مضمون 99.9%', included: true },
                { text: 'تقارير مخصصة حسب الطلب', included: true }
            ],
            cta: 'تواصل معنا',
            featured: false
        }
    ],
    store: [
        {
            name: 'Starter',
            desc: 'للمبتدئين وأصحاب المتاجر الصغيرة',
            monthlyPrice: 0,
            yearlyPrice: 0,
            features: [
                { text: 'حتى 50 منتج', included: true },
                { text: 'صفحة متجر أساسية', included: true },
                { text: 'دعم عبر البريد الإلكتروني', included: true },
                { text: 'تقارير أساسية', included: true },
                { text: 'ترويج مميز', included: false },
                { text: 'تطبيق مخصص', included: false },
                { text: 'تحليلات متقدمة', included: false }
            ],
            cta: 'ابدأ مجاناً',
            featured: false
        },
        {
            name: 'Professional',
            desc: 'للمتاجر النامية',
            monthlyPrice: 199,
            yearlyPrice: 1910,
            features: [
                { text: 'منتجات غير محدودة', included: true },
                { text: 'صفحة متجر مخصصة بالكامل', included: true },
                { text: 'دعم فني 24/7', included: true },
                { text: 'تحليلات مبيعات متقدمة', included: true },
                { text: 'ترويج مميز وشارة "موثوق"', included: true },
                { text: 'إدارة شحن متكاملة', included: true },
                { text: 'مدير حساب مخصص', included: false }
            ],
            cta: 'اشترك الآن',
            featured: true
        },
        {
            name: 'Enterprise',
            desc: 'لسلاسل المتاجر الكبيرة',
            monthlyPrice: 499,
            yearlyPrice: 4790,
            features: [
                { text: 'كل مميزات Professional', included: true },
                { text: 'فروع غير محدودة', included: true },
                { text: 'مدير حساب مخصص', included: true },
                { text: 'API كامل للتكامل', included: true },
                { text: 'تدريب فريق العمل', included: true },
                { text: 'SLA مضمون 99.9%', included: true },
                { text: 'تقارير مخصصة حسب الطلب', included: true }
            ],
            cta: 'تواصل معنا',
            featured: false
        }
    ]
};

// ============================================
// بيانات المقارنة حسب الدور
// ============================================
const COMPARISON_DATA = {
    salon: {
        headers: ['الميزة', 'Starter', 'Professional', 'Enterprise'],
        rows: [
            ['عدد الحجوزات الشهرية', '50', 'غير محدود', 'غير محدود'],
            ['صفحة الصالون', 'أساسية', 'مخصصة بالكامل', 'مخصصة بالكامل'],
            ['التحليلات والتقارير', 'basic', 'advanced', 'advanced'],
            ['الدعم الفني', 'بريد إلكتروني', '24/7', '24/7 + مدير حساب'],
            ['الترويج المميز', 'no', 'yes', 'yes'],
            ['التطبيق المخصص', 'no', 'yes', 'yes'],
            ['API للتكامل', 'no', 'no', 'yes'],
            ['عدد الفروع', '1', 'حتى 5', 'غير محدود']
        ]
    },
    store: {
        headers: ['الميزة', 'Starter', 'Professional', 'Enterprise'],
        rows: [
            ['عدد المنتجات', '50', 'غير محدود', 'غير محدود'],
            ['صفحة المتجر', 'أساسية', 'مخصصة بالكامل', 'مخصصة بالكامل'],
            ['تحليلات المبيعات', 'basic', 'advanced', 'advanced'],
            ['الدعم الفني', 'بريد إلكتروني', '24/7', '24/7 + مدير حساب'],
            ['الترويج المميز', 'no', 'yes', 'yes'],
            ['إدارة الشحن', 'no', 'yes', 'yes'],
            ['API للتكامل', 'no', 'no', 'yes'],
            ['عدد الفروع', '1', 'حتى 5', 'غير محدود']
        ]
    }
};

// ============================================
// بيانات الشهادات حسب الدور
// ============================================
const TESTIMONIALS_DATA = {
    salon: [
        { name: 'أحمد المنصوري', role: 'صاحب صالون الأناقة', img: 'https://i.pravatar.cc/100?img=1', text: 'منذ اشتراكي في الباقة المميزة، زادت حجوزاتي بنسبة 200%. التحليلات ساعدتني أفهم أوقات الذروة وأخطط بشكل أفضل' },
        { name: 'فاطمة الزهراء', role: 'صاحبة صالون الجمال', img: 'https://i.pravatar.cc/100?img=5', text: 'التطبيق المخصص لصالوني جعل عملائي يشعرون بالتميز. الدعم الفني رائع ومتاح دائماً' },
        { name: 'يوسف بنعلي', role: 'سلسلة صالونات يوسف', img: 'https://i.pravatar.cc/100?img=8', text: 'باقة Enterprise غيرت طريقة إدارتي لـ 5 فروع. التقارير المخصصة والدعم المخصص يستحقان كل درهم' }
    ],
    store: [
        { name: 'كريم التازي', role: 'صاحب متجر أدوات الحلاقة', img: 'https://i.pravatar.cc/100?img=12', text: 'مبيعاتي تضاعفت 3 مرات منذ انضمامي لـ BarberFlow Pro. نظام إدارة الشحن سهل الاستخدام جداً' },
        { name: 'سارة بناني', role: 'صاحبة متجر مستحضرات التجميل', img: 'https://i.pravatar.cc/100?img=9', text: 'التحليلات المتقدمة ساعدتني أفهم أي المنتجات الأكثر مبيعاً وأخطط للمخزون بشكل أفضل' },
        { name: 'عمر الفاسي', role: 'سلسلة متاجر Omar Beauty', img: 'https://i.pravatar.cc/100?img=15', text: 'إدارة 3 فروع أصبحت أسهل بكثير مع لوحة التحكم الموحدة. أنصح كل صاحب متجر بالاشتراك' }
    ]
};

// ============================================
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    updateAllPaths();
    await checkUserSession();
    loadSmartContent();
    setupEventListeners();
    initializeScrollReveal();
    
    // تتبع الزيارة
    Analytics.trackPageView('pro');
});

// ============================================
// تحديث جميع المسارات (data-path)
// ============================================
function updateAllPaths() {
    const links = document.querySelectorAll('[data-path]');
    links.forEach(link => {
        const key = link.getAttribute('data-path');
        const fullPath = resolvePath(key);
        link.setAttribute('href', fullPath);
    });
}

// ============================================
// التحقق من جلسة المستخدم (Supabase)
// ============================================
async function checkUserSession() {
    const result = await safeExecute(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user || null;
    }, 'التحقق من جلسة المستخدم', { showToUser: false });

    if (result.success && result.data) {
        currentUser = result.data;
        
        // جلب بيانات المستخدم من جدول profiles
        const profileResult = await safeExecute(async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentUser.id)
                .single();
            
            if (error) throw error;
            return data;
        }, 'جلب بيانات المستخدم', { showToUser: false });

        if (profileResult.success && profileResult.data) {
            userRole = profileResult.data.role;
            currentRole = userRole;
            
            // إخفاء مبدل الدور للمستخدمين المسجلين
            const roleToggle = document.getElementById('roleToggle');
            if (roleToggle) roleToggle.style.display = 'none';
        }
    } else {
        // إظهار مبدل الدور للزوار
        const roleToggle = document.getElementById('roleToggle');
        if (roleToggle) roleToggle.style.display = 'flex';
    }
}

// ============================================
// تحميل المحتوى الذكي
// ============================================
function loadSmartContent() {
    renderFeatures();
    renderPricing();
    renderComparison();
    renderTestimonials();
    updateHeroContent();
}

// ============================================
// تحديث محتوى Hero حسب الدور
// ============================================
function updateHeroContent() {
    const heroTarget = document.getElementById('heroTarget');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const statLabel1 = document.getElementById('statLabel1');
    const statLabel2 = document.getElementById('statLabel2');
    
    if (currentRole === 'salon') {
        if (heroTarget) heroTarget.textContent = 'صالونك';
        if (heroSubtitle) heroSubtitle.textContent = 'انضم إلى آلاف أصحاب الصالونات الذين يحققون نجاحاً استثنائياً مع BarberFlow Pro';
        if (statLabel1) statLabel1.textContent = 'صالون نشط';
        if (statLabel2) statLabel2.textContent = '% زيادة في الحجوزات';
    } else {
        if (heroTarget) heroTarget.textContent = 'متجرك';
        if (heroSubtitle) heroSubtitle.textContent = 'انضم إلى آلاف أصحاب المتاجر الذين يبيعون منتجاتهم لآلاف العملاء عبر BarberFlow Pro';
        if (statLabel1) statLabel1.textContent = 'متجر نشط';
        if (statLabel2) statLabel2.textContent = '% زيادة في المبيعات';
    }
}

// ============================================
// عرض المميزات حسب الدور
// ============================================
function renderFeatures() {
    const grid = document.getElementById('featuresGrid');
    if (!grid) return;
    
    const features = FEATURES_DATA[currentRole] || FEATURES_DATA.salon;
    grid.innerHTML = features.map(f => `
        <div class="feature-card" data-scroll-reveal>
            <div class="feature-icon">
                <i class="fas ${f.icon}"></i>
            </div>
            <h3>${f.title}</h3>
            <p>${f.desc}</p>
        </div>
    `).join('');
}

// ============================================
// ✅ عرض الباقات حسب الدور (تم الإصلاح)
// ============================================
function renderPricing() {
    const grid = document.getElementById('pricingGrid');
    if (!grid) return;
    
    const plans = PLANS_DATA[currentRole] || PLANS_DATA.salon;
    
    // ✅ إصلاح: استخدام innerHTML مباشرة بدلاً من join
    let html = '';
    plans.forEach(plan => {
        const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
        const period = isYearly ? '/شهر (سنوي)' : '/شهر';
        
        html += `
            <div class="pricing-card ${plan.featured ? 'featured' : ''}" data-scroll-reveal>
                ${plan.featured ? `
                    <div class="popular-badge">
                        <i class="fas fa-star"></i>
                        <span>الأكثر شعبية</span>
                    </div>
                ` : ''}
                <div class="card-header">
                    <h3 class="plan-name">${plan.name}</h3>
                    <p class="plan-desc">${plan.desc}</p>
                    <div class="plan-price">
                        <span class="price-amount">${price}</span>
                        <span class="price-currency">DH</span>
                        <span class="price-period">${period}</span>
                    </div>
                </div>
                <div class="card-features">
                    <ul>
                        ${plan.features.map(f => `
                            <li class="${f.included ? '' : 'disabled'}">
                                <i class="fas ${f.included ? 'fa-check' : 'fa-times'}"></i>
                                ${f.text}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <button class="plan-btn ${plan.featured ? 'primary' : 'secondary'}" 
                        data-plan="${plan.name.toLowerCase()}"
                        data-price="${price}">
                    ${plan.cta}
                </button>
            </div>
        `;
    });
    
    grid.innerHTML = html;
    
    // إضافة أحداث الأزرار
    grid.querySelectorAll('.plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const planName = btn.dataset.plan;
            const price = btn.dataset.price;
            
            if (!currentUser) {
                showNotification("يرجى تسجيل الدخول أولاً للاشتراك", "warning");
                setTimeout(() => {
                    window.location.href = resolvePath('LOGIN');
                }, 1500);
                return;
            }
            
            Analytics.trackClick('plan_selection', { plan: planName, price: price });
            showNotification(`تم اختيار باقة ${planName} - جاري التوجيه...`, 'success');
            setTimeout(() => {
                window.location.href = `${resolvePath('CHECKOUT')}?plan=${planName}&role=${currentRole}`;
            }, 1500);
        });
    });
}

// ============================================
// عرض جدول المقارنة حسب الدور
// ============================================
function renderComparison() {
    const table = document.getElementById('comparisonTable');
    if (!table) return;
    
    const data = COMPARISON_DATA[currentRole] || COMPARISON_DATA.salon;
    let html = `
        <thead>
            <tr>
                ${data.headers.map((h, i) => `
                    <th class="${i === 2 ? 'featured-col' : ''}">${h}</th>
                `).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.rows.map(row => `
                <tr>
                    ${row.map((cell, i) => {
                        let content = cell;
                        if (cell === 'yes') content = '<i class="fas fa-check"></i>';
                        else if (cell === 'no') content = '<i class="fas fa-times"></i>';
                        else if (cell === 'basic') content = '<i class="fas fa-check basic"></i>';
                        else if (cell === 'advanced') content = '<i class="fas fa-check advanced"></i>';
                        return `<td class="${i === 2 ? 'featured-col' : ''}">${content}</td>`;
                    }).join('')}
                </tr>
            `).join('')}
        </tbody>
    `;
    table.innerHTML = html;
}

// ============================================
// عرض الشهادات حسب الدور
// ============================================
function renderTestimonials() {
    const grid = document.getElementById('testimonialsGrid');
    if (!grid) return;
    
    const testimonials = TESTIMONIALS_DATA[currentRole] || TESTIMONIALS_DATA.salon;
    grid.innerHTML = testimonials.map(t => `
        <div class="testimonial-card" data-scroll-reveal>
            <div class="testimonial-header">
                <div class="testimonial-avatar">
                    <img src="${t.img}" alt="${t.name}">
                </div>
                <div class="testimonial-info">
                    <h4>${t.name}</h4>
                    <p>${t.role}</p>
                </div>
            </div>
            <div class="testimonial-rating">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
            </div>
            <p class="testimonial-text">"${t.text}"</p>
        </div>
    `).join('');
}

// ============================================
// إعداد مستمعي الأحداث
// ============================================
function setupEventListeners() {
    // مبدل الدور (للزوار فقط)
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRole = btn.dataset.role;
            loadSmartContent();
            Analytics.trackClick('role_toggle', { role: currentRole });
        });
    });
    
    // ✅ تبديل الفوترة (تم الإصلاح)
    const billingToggle = document.getElementById('billingToggle');
    if (billingToggle) {
        billingToggle.addEventListener('change', (e) => {
            isYearly = e.target.checked;
            // ✅ إعادة عرض الباقات فقط دون إعادة تحميل كل المحتوى
            renderPricing();
            Analytics.trackClick('billing_toggle', { yearly: isYearly });
        });
    }
    
    // FAQ تفاعلي
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            const isActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });
    
    // التمرير السلس
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // عدادات الأرقام
    animateCounters();
    
    // إنشاء الجسيمات
    createParticles();
}

// ============================================
// عدادات الأرقام المتحركة
// ============================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString('ar-MA');
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString('ar-MA');
            }
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(counter);
    });
}

// ============================================
// إنشاء جسيمات الخلفية
// ============================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 3 + 1;
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(212, 175, 55, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 20 + 10}s ease-in-out ${Math.random() * 5}s infinite;
        `;
        container.appendChild(particle);
    }
}

// أنيميشن الجسيمات
const style = document.createElement('style');
style.textContent = `@keyframes float { 0%, 100% { transform: translateY(0) translateX(0); } 25% { transform: translateY(-20px) translateX(10px); } 50% { transform: translateY(-40px) translateX(-10px); } 75% { transform: translateY(-20px) translateX(15px); } }`;
document.head.appendChild(style);

// ============================================
// Scroll Reveal Animation
// ============================================
function initializeScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll('[data-scroll-reveal]').forEach(el => {
        observer.observe(el);
    });
}

