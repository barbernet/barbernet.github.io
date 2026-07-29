# دليل المطور الشامل: BarberFlow Pro

هذا الملف هو المرجع الأساسي والقواعد الصارمة لتحديث أو إنشاء أي ملف في مشروع BarberFlow Pro.

## 1. تعريف المنصة

BarberFlow Pro منصة رقمية متكاملة لقطاع الحلاقة والتجميل، تربط بين:
- **الصالونات**: إدارة المواعيد، الموظفين، الفروع، الخدمات، والمخزون.
- **المتاجر**: بيع منتجات العناية والحلاقة وإدارة الطلبات.
- **الزبائن**: حجز المواعيد، شراء المنتجات، وتقييم الخدمات.

## 2. القواعد الإلزامية

### أ. توحيد التنسيقات (CSS)
- جميع ملفات CSS تعتمد على متغيرات `shared/styles/global.css`.
- الثيم الفاتح (Light) هو الافتراضي.
- الثيم الداكن يُفعّل عبر `data-theme="dark"` على `<html>`.

### ب. الملفات المشتركة
- يُمنع إعادة كتابة الأكواد المشتركة داخل الصفحات الفردية.
- استدعاء الملفات من `shared/` و `middleware/` عند الحاجة فقط.

### ج. قاعدة البيانات: Supabase حصراً
- الاتصال عبر `config/supabase-init.js`.
- لا يُسمح بأي مكتبات تابعة لـ Firebase.
- أسماء المتغيرات في الكود يجب أن تطابق أسماء الحقول في Supabase تماماً.

### د. تخزين الصور
- استخدام Supabase Storage مباشرة (بدون base64).
- جميع عمليات الرفع والحذف عبر `shared/utils/images-utils.js`.

### هـ. شريط التنقل العام
- جميع الصفحات العامة تستدعي `<div id="global-navbar-container"></div>`.
- استدعاء `shared/layout/global-navbar.js` لتحميل الشريط.
- لا تكرر `padding-top` في CSS الفرعي - `global-navbar.css` يتكفل به.

### و. حماية الصفحات (مهم جداً)

#### الصفحات المحمية (تستخدم `page-guard.js` + `page-protection.css`):
- جميع صفحات `dashboard/`
- جميع صفحات `profile/`
- جميع صفحات `onboarding/`
- جميع صفحات `billing/` (checkout, subscription)

#### الصفحات العامة (تستخدم Skeleton Loading):
- جميع صفحات الجذر (index, about, contact, privacy, terms, faq, survey, 404)
- صفحات التفاصيل (details-salon, details-store, product)
- صفحات التصفح (salons, shop, pro, booking)

**نمط Skeleton Loading للصفحات العامة:**
```html
<div id="loadingState" class="loading-state">
    <div class="loading-spinner">
        <i class="fas fa-cut"></i>
    </div>
    <p>جاري تحميل البيانات...</p>
</div>
<main id="mainContent" style="display: none;">
    <!-- محتوى الصفحة -->
</main>
```

```javascript
// في JavaScript
async function loadData() {
    showLoading();
    try {
        // جلب البيانات
        await fetchData();
        hideLoading();
        showContent();
    } catch (error) {
        showError();
    }
}

function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

function showContent() {
    document.getElementById('mainContent').style.display = 'block';
}
```

### ز. قرار معماري: منع تجاوز المنصة
- **لا تعرض** معلومات التواصل المباشرة (هاتف، واتساب، إيميل) للمتاجر/الصالونات في الصفحات العامة.
- استخدم زر **"تواصل عبر المنصة"** يفتح نموذج رسالة داخلي.
- المتجر/الصالون يرد عبر لوحة التحكم الخاصة به.

## 3. مرجع قاعدة البيانات (Supabase Schema)

### 3.1 جدول `profiles`
| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | UUID | = user.uid من المصادقة |
| full_name | TEXT | الاسم الكامل |
| role | ENUM | 'customer', 'salon', 'store' |
| phone | TEXT | رقم الهاتف (فريد) |
| avatar_url | TEXT | رابط الصورة |
| onboarding_status | ENUM | 'empty', 'incomplete', 'completed' |

### 3.2 جدول `businesses`
| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | UUID | معرف النشاط |
| owner_id | UUID | يرتبط بـ profiles.id |
| name | TEXT | الاسم |
| type | ENUM | 'salon' أو 'store' |
| description | TEXT | الوصف |
| city | TEXT | المدينة |
| address | TEXT | العنوان |
| phone | TEXT | الهاتف |
| email | TEXT | البريد |
| logo_url | TEXT | الشعار |
| cover_url | TEXT | صورة الغلاف |
| working_hours | JSONB | `{"open": "09:00", "close": "21:00", "days": ["sun","mon"]}` |
| status | ENUM | 'inactive', 'active', 'suspended' |
| is_verified | BOOLEAN | موثق؟ |
| rating | DECIMAL | متوسط التقييم (0-5) |
| reviews_count | INT | عدد التقييمات |

### 3.3 جدول `products`
| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | UUID | معرف المنتج |
| seller_id | UUID | المتجر (يرتبط بـ businesses) |
| salon_store_id | UUID | متجر الصالون (اختياري) |
| name | TEXT | الاسم |
| description | TEXT | الوصف |
| price | DECIMAL | السعر الحالي |
| old_price | DECIMAL | السعر قبل الخصم (NULL إذا لا خصم) |
| stock_quantity | INT | المخزون |
| image_url | TEXT | الصورة |
| category | TEXT | التصنيف |
| is_available | BOOLEAN | متاح؟ |
| is_new | BOOLEAN | جديد؟ |

**ملاحظة مهمة**: لا يوجد حقل `rating` في جدول products. يجب جلب التقييم من جدول `reviews` عبر `product_id`.

### 3.4 جدول `services`
| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | UUID | معرف الخدمة |
| business_id | UUID | الصالون (type='salon') |
| branch_id | UUID | الفرع (NULL = جميع الفروع) |
| name | TEXT | الاسم |
| description | TEXT | الوصف |
| price | DECIMAL | السعر |
| duration_min | INT | المدة بالدقائق |
| category | TEXT | التصنيف |
| is_available | BOOLEAN | متاحة؟ |

### 3.5 جدول `reviews`
| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | UUID | معرف التقييم |
| reviewer_id | UUID | صاحب التقييم |
| business_id | UUID | الصالون/المتجر المُقيَّم |
| product_id | UUID | المنتج المُقيَّم (اختياري) |
| rating | INT | التقييم (1-5) |
| comment | TEXT | نص التقييم |
| reply | TEXT | رد المالك |
| replied_at | TIMESTAMPTZ | تاريخ الرد |

**جلب تقييم المنتج:**
```javascript
const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);
const rating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
const count = data.length;
```

### 3.6 جدول `favorites`
| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | UUID | معرف المفضلة |
| user_id | UUID | المستخدم |
| item_id | UUID | العنصر (صالون/منتج/متجر) |
| item_type | TEXT | 'salon', 'product', 'store', 'service' |

**قيد فريد**: `UNIQUE(user_id, item_id, item_type)`

### 3.7 جدول `bookings`
| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | UUID | معرف الحجز |
| customer_id | UUID | العميل |
| service_id | UUID | الخدمة |
| branch_id | UUID | الفرع |
| staff_id | UUID | الموظف |
| booking_date | DATE | التاريخ |
| start_time | TIME | وقت البدء |
| end_time | TIME | وقت الانتهاء |
| status | TEXT | 'pending', 'confirmed', 'completed', 'cancelled' |
| notes | TEXT | ملاحظات |

### 3.8 جدول `subscriptions`
| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | UUID | معرف الاشتراك |
| user_id | UUID | المستخدم |
| plan | TEXT | 'starter', 'professional', 'enterprise' |
| status | TEXT | 'active', 'expired', 'cancelled' |
| start_date | DATE | البداية |
| end_date | DATE | النهاية |
| features | JSONB | الميزات: `{"analytics": true}` |

## 4. هيكلية الملفات

```
barberflow/
├── config/
│   └── supabase-init.js
├── auth/              (login, register, forgot-password, reset-password, verify-email, welcome)
├── billing/           (checkout, payment-success, payment-cancel, subscription)
├── dashboard/         (index, analytics, appointments, notifications, reviews, customers/, orders/, products/, services/, settings/, staff/)
├── middleware/
│   ├── auth/          (auth-state.js)
│   ├── guards/        (role-guard.js, booking-guard.js, subscription-route-guard.js)
│   ├── routing/       (page-guard.js, page-router.js, profile-route.js)
│   ├── subscription/  (subscription-guard.js)
│   └── validation/    (input-sanitizer.js, images-sanitizer.js)
├── onboarding/        (add-*, setup-*)
├── profile/           (customer.html, salon.html, store.html)
├── public/            (assets/, manifest.json, robots.txt, sitemap.xml)
├── shared/
│   ├── components/    (card-salon.js, card-store.js, card-product.js, card-service.js, card-staff.js, card-review.js, card-booking.js, card-offer.js, card-concierge.js)
│   ├── layout/        (global-navbar.html, global-navbar.js)
│   ├── styles/        (global.css, global-navbar.css, cards.css, notifications.css, page-protection.css)
│   └── utils/         (analytics.js, cache.js, date-utils.js, debounce.js, error-handler.js, images-utils.js, notifications.js, paths.js, user-preferences.js)
├── 404.html/.css/.js
├── about.html/.css/.js
├── booking.html/.css/.js
├── contact.html/.css/.js
├── details-salon.html/.css/.js
├── details-store.html/.css/.js
├── faq.html/.css/.js
├── index.html/.css/.js
── privacy.html/.css/.js
├── pro.html/.css/.js
├── product.html/.css/.js
├── salons.html/.css/.js
├── shop.html/.css/.js
├── survey.html/.css/.js
└── terms.html/.css/.js
```

## 5. البطاقات المشتركة (Shared Components)

### 5.1 `card-salon.js`
- **الاستخدام**: عرض الصالونات في salons.html و index.html
- **الجدول**: `businesses` (type='salon')
- **الميزات**: صورة الغلاف، الشعار، الاسم، المدينة، التقييم، عدد الخدمات، أقل سعر، حالة (مفتوح/مغلق)، Badge موثق، زر مفضلة

### 5.2 `card-store.js`
- **الاستخدام**: عرض المتاجر في shop.html
- **الجدول**: `businesses` (type='store')
- **الميزات**: الشعار، الاسم، المدينة، التقييم، عدد المنتجات، Badge موثق
- **ملاحظة**: لا تعرض معلومات تواصل مباشرة

### 5.3 `card-product.js`
- **الاستخدام**: عرض المنتجات في shop.html و pages أخرى
- **الجدول**: `products`
- **الميزات**: الصورة، الاسم، الفئة، التقييم (من reviews)، السعر، old_price، Badge خصم/جديد، زر مفضلة، زر سلة، زر عرض سريع
- **ملاحظة**: التقييم يُجلب من جدول `reviews` عبر `product_id`

### 5.4 `card-service.js`
- **الاستخدام**: عرض الخدمات في details-salon.html
- **الجدول**: `services`
- **الميزات**: الأيقونة، الاسم، الوصف، المدة، التصنيف، السعر، زر احجز الآن

### 5.5 `card-staff.js`
- **الاستخدام**: عرض فريق العمل في details-salon.html
- **الجدول**: `profiles` (مع ربط بالصالون)
- **الميزات**: الصورة، الاسم، المسمى الوظيفي، التقييم، التخصصات، حالة (متاح/مشغول/غير متصل)

### 5.6 `card-review.js`
- **الاستخدام**: عرض التقييمات في details-salon.html و details-store.html
- **الجدول**: `reviews`
- **الميزات**: صورة المقيّم، الاسم، التقييم بالنجوم، التاريخ، النص، الرد (إن وجد)

### 5.7 `card-booking.js`
- **الاستخدام**: عرض الحجوزات في profile/customer.html
- **الجدول**: `bookings`
- **الميزات**: الحالة، اسم الخدمة، اسم الصالون، التاريخ، الوقت، الموظف، السعر، أزرار (إلغاء/تفاصيل)

### 5.8 `card-offer.js`
- **الاستخدام**: عرض العروض في index.html
- **الميزات**: نسبة الخصم، الأيقونة، العنوان، الوصف، مؤقت (countdown)، زر CTA

### 5.9 `card-concierge.js`
- **الاستخدام**: عرض خدمات الكونسيرج (الخدمات المنزلية VIP)
- **الميزات**: Badge VIP، الأيقونة، العنوان، الوصف، المميزات، السعر، زر طلب الخدمة

## 6. الأدوات المشتركة (Shared Utils)

### 6.1 `paths.js`
- مركزية جميع المسارات في كائن `PATHS`
- دالة `resolvePath(key)` تحول المسار المطلق إلى نسبي حسب عمق الصفحة

### 6.2 `notifications.js`
- `showNotification(message, type, duration)`: عرض تنبيه
- `showOtpModal()`: نافذة OTP
- `showConfirmDialog(message, title)`: نافذة تأكيد
- `showLoading(message)`: نافذة تحميل

### 6.3 `cache.js`
- `cacheFetch(key, fetcher, ttl)`: جلب بيانات مع كاش
- `cacheSet/Get/Remove/Clear`: إدارة الكاش
- TTL افتراضي: 5 دقائق

### 6.4 `error-handler.js`
- `safeExecute(operation, context)`: تنفيذ عملية مع معالجة أخطاء
- `handleSupabaseError(error, context)`: معالجة أخطاء Supabase
- `handleAuthError(error, context)`: معالجة أخطاء المصادقة

### 6.5 `debounce.js`
- `debounce(func, delay)`: تأخير تنفيذ الدالة
- `throttle(func, limit)`: تحديد معدل التنفيذ
- `protectButton(button, callback)`: حماية زر من النقر المتكرر

### 6.6 `images-utils.js`
- `uploadImage(file, folder, options)`: رفع صورة
- `getImageUrl(path, bucket)`: الحصول على رابط الصورة
- `deleteImage(path, bucket)`: حذف صورة
- `replaceImage(oldPath, newFile, folder)`: استبدال صورة

### 6.7 `date-utils.js`
- `formatDate(date, options)`: تنسيق التاريخ بالعربية
- `formatTime(time)`: تنسيق الوقت
- `formatRelativeTime(date)`: "منذ 5 دقائق"
- `isToday/isTomorrow/isYesterday`: التحقق من التاريخ
- `getDayName/getMonthName`: اسم اليوم/الشهر بالعربية

### 6.8 `analytics.js`
- `Analytics.trackPageView(pageName)`: تتبع زيارة صفحة
- `Analytics.trackClick(elementName, metadata)`: تتبع نقرة
- `Analytics.trackSearch(query, filters)`: تتبع بحث
- `Analytics.trackView(itemId, type)`: تتبع مشاهدة عنصر

## 7. نظام المصادقة والحماية

### 7.1 `auth-state.js`
- `getCurrentUser()`: جلب بيانات المستخدم الحالية
- `isUserLoggedIn()`: التحقق من تسجيل الدخول
- `getCurrentUserId()`: جلب معرف المستخدم

### 7.2 `page-guard.js`
- `initPageGuard(options)`: تهيئة حماية الصفحة
- **يُستخدم فقط في الصفحات المحمية** (dashboard, profile, onboarding, billing)
- **لا يُستخدم في الصفحات العامة**

### 7.3 `role-guard.js`
- `checkRole(userData, requiredRole)`: التحقق من الدور
- `checkBusinessStatus(businessData, requiredStatus)`: التحقق من حالة النشاط
- `hasCompletedOnboarding(userData)`: التحقق من إكمال الإعداد

### 7.4 `subscription-route-guard.js`
- `requireActiveSubscription(requiredPlan, redirectPath)`: التحقق من الاشتراك
- `requireFeature(feature, redirectPath)`: التحقق من ميزة معينة
- `protectElement(elementId, requiredPlan, featureName)`: قفل عنصر لغير المشتركين

### 7.5 `booking-guard.js`
- `isSlotAvailable(branchId, date, time)`: التحقق من توفر الوقت
- `validateBookingData(data)`: التحقق من بيانات الحجز
- `isWithinWorkingHours(workingHours, time, day)`: التحقق من أوقات العمل
- `getAvailableSlots(branchId, date, workingHours)`: جلب الأوقات المتاحة

## 8. الأنماط المعمارية

### 8.1 نمط الصفحات العامة
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <!-- Meta + Fonts + Font Awesome -->
    <link rel="stylesheet" href="shared/styles/global.css">
    <link rel="stylesheet" href="shared/styles/global-navbar.css">
    <link rel="stylesheet" href="shared/styles/notifications.css">
    <link rel="stylesheet" href="shared/styles/cards.css">
    <link rel="stylesheet" href="page-specific.css">
</head>
<body>
    <div id="global-navbar-container"></div>
    <div id="notification-container"></div>
    
    <div id="loadingState" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>جاري التحميل...</p>
    </div>
    
    <main id="mainContent" style="display: none;">
        <!-- المحتوى -->
    </main>
    
    <footer>...</footer>
    
    <script type="module" src="shared/layout/global-navbar.js"></script>
    <script type="module" src="page-specific.js"></script>
</body>
</html>
```

### 8.2 نمط الصفحات المحمية
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <!-- Meta + Fonts + Font Awesome -->
    <link rel="stylesheet" href="shared/styles/global.css">
    <link rel="stylesheet" href="shared/styles/global-navbar.css">
    <link rel="stylesheet" href="shared/styles/notifications.css">
    <link rel="stylesheet" href="shared/styles/page-protection.css">
    <link rel="stylesheet" href="page-specific.css">
</head>
<body class="page-protected">
    <div id="global-navbar-container"></div>
    <div id="notification-container"></div>
    
    <main>
        <!-- المحتوى -->
    </main>
    
    <script type="module" src="middleware/routing/page-guard.js"></script>
    <script type="module" src="shared/layout/global-navbar.js"></script>
    <script type="module" src="page-specific.js"></script>
</body>
</html>
```

### 8.3 نمط JavaScript للصفحات العامة
```javascript
import { supabase } from './config/supabase-init.js';
import { showNotification } from './shared/utils/notifications.js';
import { resolvePath } from './shared/utils/paths.js';
import { safeExecute } from './shared/utils/error-handler.js';

// المتغيرات العامة
let data = null;

// التحقق من المعرف
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
if (!id) {
    showNotification("الرابط غير صالح", "error");
    setTimeout(() => window.location.replace(resolvePath('INDEX')), 2000);
}

// تحميل البيانات
async function loadData() {
    showLoading();
    const result = await safeExecute(async () => {
        const { data, error } = await supabase
            .from('table_name')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }, 'تحميل البيانات');
    
    if (result.success) {
        data = result.data;
        renderData(data);
        hideLoading();
        showContent();
    } else {
        showError();
    }
}

// دوال مساعدة
function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

function showContent() {
    document.getElementById('mainContent').style.display = 'block';
}

function showError() {
    hideLoading();
    showNotification("حدث خطأ في تحميل البيانات", "error");
}

// التهيئة
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
```

## 9. القرارات المعمارية المهمة

### 9.1 منع تجاوز المنصة
- لا تعرض هاتف/واتساب/إيميل المتجر أو الصالون في الصفحات العامة
- استخدم زر "تواصل عبر المنصة" يفتح نموذج رسالة
- المتجر/الصالون يرد عبر لوحة التحكم

### 9.2 المفضلة
- استخدم جدول `favorites` مع `item_type` لتحديد النوع
- أنواع المفضلة: 'salon', 'product', 'store', 'service'
- قيد فريد: `UNIQUE(user_id, item_id, item_type)`

### 9.3 التقييمات
- جدول `reviews` يحتوي على `business_id` و `product_id` (اختياري)
- لتقييم المنتج: استخدم `product_id`
- لتقييم الصالون/المتجر: استخدم `business_id`
- لا يوجد حقل `rating` في جدول `products` - احسبه من `reviews`

### 9.4 السلة
- تخزين محلي في `localStorage` بمفتاح `bf-cart`
- حدث `bf-cart-updated` لتحديث عداد السلة في الشريط العلوي

### 9.5 البلاغات
- تخزين مؤقت في `localStorage` بمفتاح `bf-reports`
- يمكن ربطه بجدول `reports` في Supabase لاحقاً

## 10. قائمة التحقق قبل النشر

- [ ] جميع المسارات تستخدم `resolvePath()` بدلاً من المسارات الثابتة
- [ ] جميع الصفحات العامة تستخدم Skeleton Loading (بدون page-guard.js)
- [ ] جميع الصفحات المحمية تستخدم page-guard.js + page-protection.css
- [ ] لا توجد معلومات تواصل مباشرة للمتاجر/الصالونات في الصفحات العامة
- [ ] جميع أسماء الحقول تطابق Supabase Schema
- [ ] جميع التنسيقات تستخدم متغيرات global.css
- [ ] شريط التنقل العام موجود في جميع الصفحات
- [ ] حاوية التنبيهات `<div id="notification-container"></div>` موجودة
- [ ] استخدام `safeExecute()` و `cacheFetch()` للعمليات الحرجة
- [ ] معالجة الأخطاء بشكل صحيح مع رسائل واضحة للمستخدم
```

