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

---

##  الملف الثاني: `details-salon.html` (محدّث - إزالة page-guard + Skeleton Loading)

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="تفاصيل الصالون - BarberFlow Pro">
    <title>تفاصيل الصالون | BarberFlow Pro</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="public/assets/favicon.png">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Global Styles -->
    <link rel="stylesheet" href="shared/styles/global.css">
    <link rel="stylesheet" href="shared/styles/global-navbar.css">
    <link rel="stylesheet" href="shared/styles/notifications.css">
    <link rel="stylesheet" href="shared/styles/cards.css">
    
    <!-- Page Specific Styles -->
    <link rel="stylesheet" href="details-salon.css">
</head>
<body>
    <!-- Global Navbar Container -->
    <div id="global-navbar-container"></div>
    
    <!-- Notification Container -->
    <div id="notification-container"></div>
    
    <!-- Loading State (Skeleton Loading) -->
    <div id="loadingState" class="loading-state">
        <div class="loading-spinner">
            <i class="fas fa-cut"></i>
        </div>
        <p>جاري تحميل تفاصيل الصالون...</p>
    </div>
    
    <!-- Main Content -->
    <main id="mainContent" class="salon-details-page" style="display: none;">
        <!-- زر العودة العائم -->
        <button id="backBtn" class="floating-back-btn" aria-label="العودة">
            <i class="fas fa-arrow-right"></i>
        </button>

        <!-- Hero Section -->
        <section class="salon-hero">
            <div class="hero-image-container">
                <div id="heroPlaceholder" class="hero-placeholder">
                    <i class="fas fa-cut"></i>
                </div>
                <img id="heroImage" class="hero-image" src="" alt="صورة الغلاف" style="display: none;">
                <div class="hero-overlay"></div>
                
                <!-- Badges -->
                <div class="hero-badges">
                    <span id="verifiedBadge" class="badge verified" style="display: none;">
                        <i class="fas fa-check-circle"></i>
                        <span>موثق</span>
                    </span>
                    <span id="statusBadge" class="badge status">
                        <i class="fas fa-clock"></i>
                        <span>جاري التحميل...</span>
                    </span>
                </div>
                
                <!-- زر المفضلة -->
                <button id="favoriteBtn" class="hero-favorite-btn" aria-label="إضافة للمفضلة">
                    <i class="far fa-heart"></i>
                </button>
                
                <!-- محتوى Hero -->
                <div class="hero-content">
                    <div class="salon-logo-wrapper">
                        <div id="logoPlaceholder" class="logo-placeholder">
                            <i class="fas fa-cut"></i>
                        </div>
                        <img id="salonLogo" class="salon-logo" src="" alt="شعار الصالون" style="display: none;">
                    </div>
                    <h1 id="salonName" class="salon-name">اسم الصالون</h1>
                    <div class="salon-meta">
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span id="salonCity">المدينة</span>
                        </div>
                        <div class="meta-divider"></div>
                        <div class="meta-item">
                            <i class="fas fa-star"></i>
                            <span id="salonRating">0.0</span>
                            <span id="salonReviewsCount" class="meta-label">(0 تقييم)</span>
                        </div>
                        <div class="meta-divider"></div>
                        <div class="meta-item">
                            <i class="fas fa-concierge-bell"></i>
                            <span id="servicesCount">0 خدمة</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Quick Actions (بدون معلومات تواصل مباشرة) -->
        <section class="quick-actions">
            <div class="container">
                <div class="actions-grid">
                    <button id="bookingBtn" class="action-btn primary">
                        <i class="fas fa-calendar-check"></i>
                        <span>حجز موعد</span>
                    </button>
                    <button id="contactBtn" class="action-btn">
                        <i class="fas fa-envelope"></i>
                        <span>تواصل عبر المنصة</span>
                    </button>
                    <button id="shareBtn" class="action-btn">
                        <i class="fas fa-share-alt"></i>
                        <span>مشاركة</span>
                    </button>
                    <button id="reportBtn" class="action-btn">
                        <i class="fas fa-flag"></i>
                        <span>إبلاغ</span>
                    </button>
                </div>
            </div>
        </section>

        <!-- Main Content -->
        <section class="salon-content">
            <div class="container">
                <!-- About Section -->
                <div class="info-section">
                    <h2 class="section-title">
                        <i class="fas fa-info-circle"></i>
                        عن الصالون
                    </h2>
                    <p id="salonDescription" class="about-text">
                        مرحباً بكم في صالوننا المميز.
                    </p>
                </div>

                <!-- Working Hours -->
                <div class="info-section">
                    <h2 class="section-title">
                        <i class="fas fa-clock"></i>
                        أوقات العمل
                    </h2>
                    <div class="working-hours-card">
                        <div id="workingHoursList" class="hours-list">
                            <div class="hours-row">
                                <i class="fas fa-clock"></i>
                                <span>جاري التحميل...</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Services Section -->
                <div class="info-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class="fas fa-cut"></i>
                            الخدمات والأسعار
                        </h2>
                        <div class="services-filter">
                            <button class="filter-btn active" data-category="all">الكل</button>
                            <button class="filter-btn" data-category="hair">شعر</button>
                            <button class="filter-btn" data-category="beard">لحية</button>
                            <button class="filter-btn" data-category="skin">بشرة</button>
                            <button class="filter-btn" data-category="kids">أطفال</button>
                        </div>
                    </div>
                    <div id="servicesGrid" class="services-grid">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>جاري تحميل الخدمات...</p>
                        </div>
                    </div>
                </div>

                <!-- Staff Section -->
                <div class="info-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class="fas fa-users"></i>
                            فريق العمل
                        </h2>
                    </div>
                    <div id="staffGrid" class="staff-grid">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>جاري تحميل الفريق...</p>
                        </div>
                    </div>
                </div>

                <!-- Reviews Section -->
                <div class="info-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class="fas fa-star"></i>
                            تقييمات الزبائن
                        </h2>
                        <button id="addReviewBtn" class="add-review-btn">
                            <i class="fas fa-pen"></i>
                            <span>إضافة تقييم</span>
                        </button>
                    </div>
                    
                    <!-- Reviews Summary -->
                    <div id="reviewsSummary" class="reviews-summary">
                        <div class="summary-rating">
                            <div id="bigRating" class="big-rating">0.0</div>
                            <div id="starsDisplay" class="stars-display"></div>
                            <div id="totalReviews" class="total-reviews">0 تقييم</div>
                        </div>
                        <div id="ratingBars" class="rating-bars"></div>
                    </div>
                    
                    <!-- Reviews List -->
                    <div id="reviewsList" class="reviews-list">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>جاري تحميل التقييمات...</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Modal: Contact Store -->
        <div id="contactModal" class="modal-overlay">
            <div class="modal-content">
                <h3><i class="fas fa-envelope"></i> تواصل مع الصالون</h3>
                <p class="modal-subtitle">سيتم إرسال رسالتك عبر المنصة وسيتم الرد عليك خلال 24 ساعة</p>
                <form id="contactForm">
                    <div class="form-group">
                        <label>الاسم الكامل</label>
                        <input type="text" id="contactName" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label>البريد الإلكتروني</label>
                        <input type="email" id="contactEmail" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label>رسالتك</label>
                        <textarea id="contactMessage" class="form-input form-textarea" rows="5" required></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" id="closeContactModal">إلغاء</button>
                        <button type="submit" class="btn-submit">إرسال الرسالة</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal: Add Review -->
        <div id="reviewModal" class="modal-overlay">
            <div class="modal-content">
                <h3><i class="fas fa-star"></i> أضف تقييمك</h3>
                <div class="rating-input">
                    <div id="starsInput" class="stars-input">
                        <i class="far fa-star" data-rating="1"></i>
                        <i class="far fa-star" data-rating="2"></i>
                        <i class="far fa-star" data-rating="3"></i>
                        <i class="far fa-star" data-rating="4"></i>
                        <i class="far fa-star" data-rating="5"></i>
                    </div>
                </div>
                <textarea id="reviewText" class="form-input form-textarea" placeholder="شاركنا تجربتك مع هذا الصالون..." rows="4"></textarea>
                <div class="modal-actions">
                    <button type="button" class="btn-cancel" id="closeReviewModal">إلغاء</button>
                    <button type="button" class="btn-submit" id="submitReview">إرسال التقييم</button>
                </div>
            </div>
        </div>

        <!-- Modal: Report -->
        <div id="reportModal" class="modal-overlay">
            <div class="modal-content small-modal">
                <h3><i class="fas fa-flag"></i> إبلاغ عن الصالون</h3>
                <p class="modal-subtitle">سيتم مراجعة بلاغك خلال 24 ساعة</p>
                <div class="form-group">
                    <label>سبب الإبلاغ</label>
                    <select id="reportReason" class="form-input form-select">
                        <option value="inappropriate">محتوى غير لائق</option>
                        <option value="fake">معلومات مضللة</option>
                        <option value="spam">إعلانات مزعجة</option>
                        <option value="other">أخرى</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>تفاصيل إضافية (اختياري)</label>
                    <textarea id="reportDetails" class="form-input form-textarea" rows="3"></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-cancel" id="closeReportModal">إلغاء</button>
                    <button type="button" class="btn-submit" id="submitReport">إرسال البلاغ</button>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="salon-footer">
        <div class="container">
            <p>&copy; 2026 BarberFlow Pro. جميع الحقوق محفوظة.</p>
            <div class="footer-legal">
                <a href="#" data-path="PRIVACY">سياسة الخصوصية</a>
                <a href="#" data-path="TERMS">شروط الاستخدام</a>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script type="module" src="shared/layout/global-navbar.js"></script>
    <script type="module" src="details-salon.js"></script>
</body>
</html>
```

---

## 📄 الملف الثالث: `details-salon.js` (محدّث - إزالة page-guard + Skeleton Loading)

```javascript
/**
 * BarberFlow Pro - صفحة تفاصيل الصالون
 * المسار: details-salon.js
 * ✅ محدّث: استخدام Skeleton Loading بدلاً من page-guard.js
 * ✅ لا تعرض معلومات التواصل المباشرة (قرار معماري)
 */

import { supabase } from './config/supabase-init.js';
import { showNotification } from './shared/utils/notifications.js';
import { PATHS, resolvePath } from './shared/utils/paths.js';
import { safeExecute } from './shared/utils/error-handler.js';
import { createServiceCards } from './shared/components/card-service.js';
import { createStaffCards } from './shared/components/card-staff.js';
import { createReviewCards } from './shared/components/card-review.js';

// ============================================
// المتغيرات العامة
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const salonId = urlParams.get('id');
let currentUser = null;
let salonData = null;
let allServices = [];
let allReviews = [];
let currentServiceFilter = 'all';
let selectedRating = 0;
let isFavorite = false;

// ============================================
// التحقق من معرف الصالون
// ============================================
if (!salonId) {
    showNotification("الرابط غير صالح، لم يتم تحديد الصالون", "error");
    setTimeout(() => {
        window.location.replace(resolvePath('SALONS'));
    }, 2000);
}

// ============================================
// زر العودة
// ============================================
const backBtn = document.getElementById('backBtn');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        if (document.referrer && document.referrer.includes(window.location.hostname)) {
            window.history.back();
        } else {
            window.location.href = resolvePath('SALONS');
        }
    });
}

// ============================================
// مراقبة حالة المصادقة
// ============================================
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    if (salonId) {
        await loadSalonDetails();
    }
});

// ============================================
// دوال Skeleton Loading
// ============================================
function showLoading() {
    const loading = document.getElementById('loadingState');
    const content = document.getElementById('mainContent');
    if (loading) loading.style.display = 'block';
    if (content) content.style.display = 'none';
}

function hideLoading() {
    const loading = document.getElementById('loadingState');
    if (loading) loading.style.display = 'none';
}

function showContent() {
    const content = document.getElementById('mainContent');
    if (content) content.style.display = 'block';
}

function showError() {
    hideLoading();
    showNotification("حدث خطأ في تحميل البيانات", "error");
}

// ============================================
// تحميل تفاصيل الصالون
// ============================================
async function loadSalonDetails() {
    showLoading();
    
    const result = await safeExecute(async () => {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', salonId)
            .eq('type', 'salon')
            .single();
        
        if (error || !data) throw error;
        return data;
    }, 'تحميل تفاصيل الصالون');
    
    if (result.success) {
        salonData = { id: salonId, ...result.data };
        renderSalonInfo(salonData);
        updateSalonStatus(salonData.working_hours);
        renderWorkingHours(salonData.working_hours);
        await checkFavoriteStatus();
        await loadServices();
        await loadStaff();
        await loadReviews();
        setupEventListeners();
        updateDynamicLinks();
        hideLoading();
        showContent();
    } else {
        showNotification("هذا الصالون غير موجود أو تم حذفه", "error");
        setTimeout(() => {
            window.location.replace(resolvePath('SALONS'));
        }, 2000);
    }
}

// ============================================
// عرض معلومات الصالون
// ============================================
function renderSalonInfo(data) {
    // صورة الغلاف
    const heroImage = document.getElementById('heroImage');
    const heroPlaceholder = document.getElementById('heroPlaceholder');
    if (data.cover_url) {
        heroImage.src = data.cover_url;
        heroImage.style.display = 'block';
        heroPlaceholder.style.display = 'none';
        heroImage.onerror = () => {
            heroImage.style.display = 'none';
            heroPlaceholder.style.display = 'flex';
            heroImage.onerror = null;
        };
    }

    // الشعار
    const salonLogo = document.getElementById('salonLogo');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    if (data.logo_url) {
        salonLogo.src = data.logo_url;
        salonLogo.style.display = 'block';
        logoPlaceholder.style.display = 'none';
        salonLogo.onerror = () => {
            salonLogo.style.display = 'none';
            logoPlaceholder.style.display = 'flex';
            salonLogo.onerror = null;
        };
    }

    // المعلومات الأساسية
    setText('salonName', data.name || "صالون غير مسمى");
    setText('salonCity', data.city || "الموقع غير محدد");
    setText('salonRating', (parseFloat(data.rating) || 0).toFixed(1));
    setText('salonReviewsCount', `(${data.reviews_count || 0} تقييم)`);

    // الشارات
    if (data.is_verified) {
        showElement('verifiedBadge');
    }

    // عن الصالون
    setText('salonDescription', data.description || "مرحباً بكم في صالوننا المميز.");

    // عنوان الصفحة
    document.title = `${data.name || 'صالون'} | BarberFlow Pro`;
}

// ============================================
// تحديث حالة الصالون (مفتوح/مغلق)
// ============================================
function updateSalonStatus(hours) {
    const badge = document.getElementById('statusBadge');
    if (!hours?.open || !hours?.close) {
        badge.innerHTML = '<i class="fas fa-clock"></i> <span>غير محدد</span>';
        return;
    }

    const now = new Date();
    const curr = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = hours.open.split(':').map(Number);
    const [ch, cm] = hours.close.split(':').map(Number);
    const ot = oh * 60 + om;
    const ct = ch * 60 + cm;
    const isOpen = ct > ot ? (curr >= ot && curr < ct) : (curr >= ot || curr < ct);

    badge.className = `badge status ${isOpen ? 'open' : 'closed'}`;
    badge.innerHTML = `<i class="fas fa-${isOpen ? 'check-circle' : 'times-circle'}"></i> <span>${isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}</span>`;
}

// ============================================
// عرض أوقات العمل
// ============================================
function renderWorkingHours(hours) {
    const container = document.getElementById('workingHoursList');
    if (!container) return;

    const days = [
        { key: 'sun', name: 'الأحد' },
        { key: 'mon', name: 'الإثنين' },
        { key: 'tue', name: 'الثلاثاء' },
        { key: 'wed', name: 'الأربعاء' },
        { key: 'thu', name: 'الخميس' },
        { key: 'fri', name: 'الجمعة' },
        { key: 'sat', name: 'السبت' }
    ];

    if (!hours?.days || hours.days.length === 0) {
        container.innerHTML = `
            <div class="hours-row">
                <i class="fas fa-clock"></i>
                <span>أوقات العمل غير محددة</span>
            </div>
        `;
        return;
    }

    container.innerHTML = days.map(day => {
        const isWorking = hours.days.includes(day.key);
        return `
            <div class="hours-row ${isWorking ? '' : 'closed'}">
                <i class="fas fa-calendar-day"></i>
                <span class="day-name">${day.name}</span>
                <span class="day-hours">${isWorking ? `${hours.open} - ${hours.close}` : 'مغلق'}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// التحقق من حالة المفضلة
// ============================================
async function checkFavoriteStatus() {
    if (!currentUser) {
        updateFavoriteUI(false);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('item_id', salonId)
            .eq('item_type', 'salon')
            .single();

        isFavorite = !error && data;
        updateFavoriteUI(isFavorite);
    } catch (error) {
        console.error("خطأ في التحقق من المفضلة:", error);
    }
}

// ============================================
// تحديث واجهة المفضلة
// ============================================
function updateFavoriteUI(liked) {
    const btn = document.getElementById('favoriteBtn');
    const icon = btn?.querySelector('i');
    if (!btn || !icon) return;

    isFavorite = liked;
    icon.className = liked ? 'fas fa-heart' : 'far fa-heart';
    btn.classList.toggle('active', liked);
}

// ============================================
// تبديل المفضلة
// ============================================
async function toggleFavorite() {
    if (!currentUser) {
        showNotification("يرجى تسجيل الدخول لإضافة الصالون للمفضلة", "warning");
        setTimeout(() => {
            window.location.href = resolvePath('LOGIN');
        }, 1500);
        return;
    }

    const newLikedState = !isFavorite;
    updateFavoriteUI(newLikedState);

    try {
        if (newLikedState) {
            const { error } = await supabase
                .from('favorites')
                .insert({
                    user_id: currentUser.id,
                    item_id: salonId,
                    item_type: 'salon'
                });
            if (error) throw error;
            showNotification("تمت إضافة الصالون للمفضلة", "success");
        } else {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('item_id', salonId)
                .eq('item_type', 'salon');
            if (error) throw error;
            showNotification("تمت إزالة الصالون من المفضلة", "info");
        }
    } catch (error) {
        console.error("خطأ في تحديث المفضلة:", error);
        updateFavoriteUI(!newLikedState);
        showNotification("حدث خطأ في تحديث المفضلة", "error");
    }
}

// ============================================
// تحميل الخدمات
// ============================================
async function loadServices() {
    const result = await safeExecute(async () => {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('business_id', salonId)
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }, 'تحميل الخدمات');

    if (result.success) {
        allServices = result.data;
        setText('servicesCount', `${allServices.length} خدمة`);
        renderServices();
    }
}

// ============================================
// عرض الخدمات
// ============================================
async function renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    let filtered = [...allServices];
    if (currentServiceFilter !== 'all') {
        filtered = filtered.filter(s => s.category === currentServiceFilter);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-reviews" style="grid-column: 1/-1;">
                <i class="fas fa-cut"></i>
                <p>لا توجد خدمات متاحة حالياً</p>
            </div>
        `;
        return;
    }

    const cards = await createServiceCards(filtered);
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
}

// ============================================
// تحميل فريق العمل
// ============================================
async function loadStaff() {
    const grid = document.getElementById('staffGrid');
    if (!grid) return;

    // يمكن جلب الموظفين المرتبطين بالصالون من جدول profiles
    // حالياً نعرض رسالة فارغة
    grid.innerHTML = `
        <div class="empty-reviews" style="grid-column: 1/-1;">
            <i class="fas fa-users"></i>
            <p>لم يتم إضافة فريق العمل بعد</p>
        </div>
    `;
}

// ============================================
// تحميل التقييمات
// ============================================
async function loadReviews() {
    const result = await safeExecute(async () => {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('business_id', salonId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }, 'تحميل التقييمات');

    if (result.success) {
        allReviews = result.data;
        renderReviewsSummary(allReviews);
        await renderReviewsList(allReviews);
    }
}

// ============================================
// ملخص التقييمات
// ============================================
function renderReviewsSummary(reviews) {
    if (reviews.length === 0) {
        document.getElementById('bigRating').textContent = '0.0';
        document.getElementById('totalReviews').textContent = '0 تقييم';
        document.getElementById('starsDisplay').innerHTML = '';
        document.getElementById('ratingBars').innerHTML = '';
        return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avgRating = totalRating / reviews.length;

    setText('bigRating', avgRating.toFixed(1));
    setText('totalReviews', `${reviews.length} تقييم`);
    document.getElementById('starsDisplay').innerHTML = generateStarsHTML(avgRating);

    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
        const rating = Math.round(r.rating || 0);
        if (rating >= 1 && rating <= 5) {
            ratingCounts[rating - 1]++;
        }
    });

    const barsContainer = document.getElementById('ratingBars');
    barsContainer.innerHTML = ratingCounts.map((count, index) => {
        const star = index + 1;
        const percentage = (count / reviews.length) * 100;
        return `
            <div class="rating-bar-row">
                <span class="star-label">${star} <i class="fas fa-star"></i></span>
                <div class="rating-bar">
                    <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="bar-count">${count}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// عرض قائمة التقييمات
// ============================================
async function renderReviewsList(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-reviews">
                <i class="fas fa-comment-slash"></i>
                <p>لا توجد تقييمات بعد. كن أول من يقيّم!</p>
            </div>
        `;
        return;
    }

    // جلب بيانات المقيّمين
    const reviewsWithNames = await Promise.all(reviews.map(async (review) => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', review.reviewer_id)
                .single();
            
            return {
                ...review,
                reviewer_name: profile?.full_name || 'زبون',
                reviewer_avatar: profile?.avatar_url || null
            };
        } catch (error) {
            return { ...review, reviewer_name: 'زبون', reviewer_avatar: null };
        }
    }));

    const cards = await createReviewCards(reviewsWithNames);
    container.innerHTML = '';
    cards.forEach(card => container.appendChild(card));
}

// ============================================
// إضافة تقييم جديد
// ============================================
async function submitReview() {
    if (!currentUser) {
        showNotification("يرجى تسجيل الدخول لإضافة تقييم", "warning");
        setTimeout(() => {
            window.location.href = resolvePath('LOGIN');
        }, 1500);
        return;
    }

    if (selectedRating === 0) {
        showNotification("يرجى اختيار التقييم بالنجوم", "error");
        return;
    }

    const text = document.getElementById('reviewText').value.trim();
    if (!text) {
        showNotification("يرجى كتابة تقييمك", "error");
        return;
    }

    const result = await safeExecute(async () => {
        const { error } = await supabase
            .from('reviews')
            .insert({
                reviewer_id: currentUser.id,
                business_id: salonId,
                rating: selectedRating,
                comment: text
            });

        if (error) throw error;
    }, 'إضافة التقييم');

    if (result.success) {
        showNotification("تم إضافة تقييمك بنجاح، شكراً لمشاركتك", "success");
        document.getElementById('reviewModal').classList.remove('active');
        document.getElementById('reviewText').value = '';
        selectedRating = 0;
        updateStarsInput(0);
        await loadReviews();
    } else {
        showNotification("حدث خطأ في إضافة التقييم", "error");
    }
}

// ============================================
// إرسال بلاغ
// ============================================
async function submitReport() {
    if (!currentUser) {
        showNotification("يرجى تسجيل الدخول للإبلاغ", "warning");
        return;
    }

    const reason = document.getElementById('reportReason').value;
    const details = document.getElementById('reportDetails').value.trim();

    try {
        const reports = JSON.parse(localStorage.getItem('bf-reports') || '[]');
        reports.push({
            id: 'RPT-' + Date.now(),
            salonId: salonId,
            userId: currentUser.id,
            reason: reason,
            details: details,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('bf-reports', JSON.stringify(reports));

        showNotification("تم إرسال البلاغ بنجاح، شكراً لمساعدتنا", "success");
        document.getElementById('reportModal').classList.remove('active');
        document.getElementById('reportDetails').value = '';
    } catch (error) {
        console.error("خطأ في إرسال البلاغ:", error);
        showNotification("فشل إرسال البلاغ", "error");
    }
}

// ============================================
// إرسال رسالة تواصل
// ============================================
async function submitContact() {
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
        showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
        return;
    }

    try {
        const messages = JSON.parse(localStorage.getItem('bf-messages') || '[]');
        messages.push({
            id: 'MSG-' + Date.now(),
            salonId: salonId,
            name: name,
            email: email,
            message: message,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });
        localStorage.setItem('bf-messages', JSON.stringify(messages));

        showNotification("تم إرسال رسالتك بنجاح! سيتم الرد عليك خلال 24 ساعة", "success");
        document.getElementById('contactModal').classList.remove('active');
        document.getElementById('contactForm').reset();
    } catch (error) {
        console.error("خطأ في إرسال الرسالة:", error);
        showNotification("حدث خطأ في إرسال الرسالة", "error");
    }
}

// ============================================
// مشاركة الصالون
// ============================================
function shareSalon() {
    if (navigator.share) {
        navigator.share({
            title: salonData?.name || 'صالون',
            text: salonData?.description || '',
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showNotification("تم نسخ رابط الصالون", "success");
    }
}

// ============================================
// إعداد مستمعي الأحداث
// ============================================
function setupEventListeners() {
    // زر المفضلة
    document.getElementById('favoriteBtn')?.addEventListener('click', toggleFavorite);

    // زر المشاركة
    document.getElementById('shareBtn')?.addEventListener('click', shareSalon);

    // زر الحجز
    document.getElementById('bookingBtn')?.addEventListener('click', () => {
        if (!currentUser) {
            showNotification("يرجى تسجيل الدخول للحجز", "warning");
            setTimeout(() => {
                window.location.href = resolvePath('LOGIN');
            }, 1500);
            return;
        }
        window.location.href = `${resolvePath('BOOKING')}?salon=${salonId}`;
    });

    // زر التواصل
    document.getElementById('contactBtn')?.addEventListener('click', () => {
        document.getElementById('contactModal').classList.add('active');
    });

    // زر الإبلاغ
    document.getElementById('reportBtn')?.addEventListener('click', () => {
        document.getElementById('reportModal').classList.add('active');
    });

    // إغلاق Modals
    document.getElementById('closeContactModal')?.addEventListener('click', () => {
        document.getElementById('contactModal').classList.remove('active');
    });

    document.getElementById('closeReviewModal')?.addEventListener('click', () => {
        document.getElementById('reviewModal').classList.remove('active');
        document.getElementById('reviewText').value = '';
        selectedRating = 0;
        updateStarsInput(0);
    });

    document.getElementById('closeReportModal')?.addEventListener('click', () => {
        document.getElementById('reportModal').classList.remove('active');
    });

    // إرسال النماذج
    document.getElementById('contactForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitContact();
    });

    document.getElementById('submitReview')?.addEventListener('click', submitReview);
    document.getElementById('submitReport')?.addEventListener('click', submitReport);

    // إضافة تقييم
    document.getElementById('addReviewBtn')?.addEventListener('click', () => {
        if (!currentUser) {
            showNotification("يرجى تسجيل الدخول لإضافة تقييم", "warning");
            return;
        }
        document.getElementById('reviewModal').classList.add('active');
    });

    // اختيار النجوم
    document.querySelectorAll('#starsInput i').forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            updateStarsInput(selectedRating);
        });

        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            highlightStars(rating);
        });
    });

    document.getElementById('starsInput')?.addEventListener('mouseleave', () => {
        updateStarsInput(selectedRating);
    });

    // فلاتر الخدمات
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentServiceFilter = btn.dataset.category;
            renderServices();
        });
    });

    // إغلاق Modals عند النقر خارجها
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // مفتاح Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

// ============================================
// تحديث واجهة النجوم
// ============================================
function updateStarsInput(rating) {
    document.querySelectorAll('#starsInput i').forEach((star, index) => {
        star.className = index < rating ? 'fas fa-star active' : 'far fa-star';
    });
}

function highlightStars(rating) {
    document.querySelectorAll('#starsInput i').forEach((star, index) => {
        star.className = index < rating ? 'fas fa-star' : 'far fa-star';
    });
}

// ============================================
// توليد HTML للنجوم
// ============================================
function generateStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalf) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

// ============================================
// تحديث الروابط الديناميكية
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
// دوال مساعدة
// ============================================
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}
```
