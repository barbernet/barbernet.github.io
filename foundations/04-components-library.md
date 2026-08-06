# مكتبة المكونات (Components Library) - BarberFlow Pro

هذا الملف يوثق جميع المكونات الجاهزة للاستخدام في المنصة.
كل مكون يحتوي على: الاستخدام، الجدول المرتبط، الميزات، مثال HTML/JS، والخيارات المتاحة.

---

## 1. مقدمة

### 1.1 الفرق بين Design System و Components Library

| الملف | التركيز | المحتوى |
|-------|---------|---------|
| `01-design-system.md` | الأسس البصرية | الألوان، الطباعة، المسافات، CSS variables |
| `04-components-library.md` | المكونات الجاهزة | HTML/JS components، الاستخدام، الأمثلة |

### 1.2 قواعد الاستخدام

✅ **افعل:**
- استخدم المكونات من `shared/components/` دائماً
- لا تعيد كتابة مكون موجود
- اتبع نمط الـ Props/Options المحدد
- اختبر على جميع الأحجام (mobile, tablet, desktop)

❌ **لا تفعل:**
- لا تنشئ مكوناً مخصصاً في صفحة فردية
- لا تعدل على CSS المكون مباشرة (استخدم الـ options)
- لا تستخدم `innerHTML` مع بيانات المستخدم (XSS risk)

---

## 2. مكونات البطاقات (Cards)

### 2.1 `card-salon.js` - بطاقة صالون

**الاستخدام:** عرض الصالونات في `salons.html` و `index.html`
**الجدول:** `businesses` (type='salon')

#### مثال HTML:

```html
<div id="salons-container" class="cards-grid">
  <!-- يتم ملؤها ديناميكياً -->
</div>
```

#### مثال JavaScript:

```javascript
import { createSalonCard } from './shared/components/card-salon.js';

async function renderSalons() {
  const { data: salons } = await supabase
    .from('businesses')
    .select(`
      *,
      services(count),
      branches(count)
    `)
    .eq('type', 'salon')
    .eq('status', 'active')
    .is('deleted_at', null);
  
  const container = document.getElementById('salons-container');
  container.innerHTML = salons.map(salon => createSalonCard(salon)).join('');
}
```

#### الميزات:
- صورة الغلاف + الشعار
- الاسم + المدينة
- التقييم بالنجوم + عدد التقييمات
- عدد الخدمات + أقل سعر
- Badge "مفتوح الآن" / "مغلق"
- Badge "موثق" (إن وجد)
- زر المفضلة (toggle)
- Hover effect

#### Options:

```javascript
createSalonCard(salon, {
  showCover: true,           // إظهار صورة الغلاف
  showLogo: true,            // إظهار الشعار
  showRating: true,          // إظهار التقييم
  showServicesCount: true,   // إظهار عدد الخدمات
  showMinPrice: true,        // إظهار أقل سعر
  showStatus: true,          // إظهار حالة الفتح/الإغلاق
  showVerified: true,        // إظهار Badge التوثيق
  showFavorite: true,        // إظهار زر المفضلة
  size: 'medium',            // 'small' | 'medium' | 'large'
  onClick: (salon) => {}     // دالة عند النقر
});
```

---

### 2.2 `card-store.js` - بطاقة متجر

**الاستخدام:** عرض المتاجر في `shop.html`
**الجدول:** `businesses` (type='store')

#### مثال JavaScript:

```javascript
import { createStoreCard } from './shared/components/card-store.js';

const { data: stores } = await supabase
  .from('businesses')
  .select(`*, products(count)`)
  .eq('type', 'store')
  .eq('status', 'active');

container.innerHTML = stores.map(store => createStoreCard(store)).join('');
```

#### الميزات:
- الشعار + الاسم
- المدينة + الوصف المختصر
- التقييم + عدد المنتجات
- Badge "موثق"
- ⚠️ **لا تعرض معلومات تواصل مباشرة** (قرار معماري)

---

### 2.3 `card-product.js` - بطاقة منتج

**الاستخدام:** عرض المنتجات في `shop.html` وصفحات أخرى
**الجدول:** `products` + `reviews` (للتقييم)

#### مثال JavaScript:

```javascript
import { createProductCard } from './shared/components/card-product.js';

const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    category:categories(name),
    reviews(rating)
  `)
  .eq('seller_id', storeId)
  .eq('is_available', true);

// حساب التقييم يدوياً
const productsWithRating = products.map(p => ({
  ...p,
  avg_rating: p.reviews.length > 0
    ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
    : 0,
  reviews_count: p.reviews.length
}));

container.innerHTML = productsWithRating
  .map(p => createProductCard(p))
  .join('');
```

#### الميزات:
- الصورة + الاسم + الفئة
- التقييم (محسوب من reviews)
- السعر الحالي + السعر القديم (إن وجد)
- Badge "خصم X%" / "جديد" / "مميز"
- زر المفضلة
- زر "أضف للسلة"
- زر "عرض سريع" (Modal)

#### Options:

```javascript
createProductCard(product, {
  showRating: true,
  showOldPrice: true,
  showBadges: true,
  showFavorite: true,
  showAddToCart: true,
  showQuickView: true,
  onAddToCart: (product) => {},
  onFavorite: (product) => {}
});
```

---

### 2.4 `card-service.js` - بطاقة خدمة

**الاستخدام:** عرض الخدمات في `details-salon.html`
**الجدول:** `services`

#### مثال JavaScript:

```javascript
import { createServiceCard } from './shared/components/card-service.js';

const { data: services } = await supabase
  .from('services')
  .select(`*, category:categories(name)`)
  .eq('business_id', salonId)
  .eq('is_available', true);

container.innerHTML = services.map(s => createServiceCard(s)).join('');
```

#### الميزات:
- الأيقونة + الاسم + الوصف
- المدة بالدقائق
- الفئة
- السعر
- زر "احجز الآن"

---

### 2.5 `card-staff.js` - بطاقة موظف

**الاستخدام:** عرض فريق العمل في `details-salon.html`
**الجدول:** `staff`

#### الميزات:
- الصورة + الاسم
- المسمى الوظيفي
- التقييم (إن وجد)
- التخصصات (badges)
- حالة: متاح / مشغول / غير متصل

---

### 2.6 `card-review.js` - بطاقة تقييم

**الاستخدام:** عرض التقييمات في `details-salon.html` و `details-store.html`
**الجدول:** `reviews`

#### مثال JavaScript:

```javascript
import { createReviewCard } from './shared/components/card-review.js';

const { data: reviews } = await supabase
  .from('reviews')
  .select(`
    *,
    reviewer:profiles(full_name, avatar_url),
    staff:staff(full_name)
  `)
  .eq('business_id', businessId)
  .order('created_at', { ascending: false });

container.innerHTML = reviews.map(r => createReviewCard(r)).join('');
```

#### الميزات:
- صورة المقيّم + الاسم
- التقييم بالنجوم
- التاريخ (نسبي: "منذ 3 أيام")
- النص
- الصور (gallery)
- اسم الموظف (إن وجد staff_id)
- رد المالك (إن وجد)
- زر "مفيد" (helpful_count)

---

### 2.7 `card-booking.js` - بطاقة حجز

**الاستخدام:** عرض الحجوزات في `profile/customer.html`
**الجدول:** `bookings`

#### الميزات:
- Badge الحالة (pending/confirmed/completed/cancelled)
- اسم الخدمة + اسم الصالون
- التاريخ + الوقت
- اسم الموظف
- السعر + حالة الدفع
- الإضافات (إن وجدت)
- أزرار: إلغاء / تفاصيل / تقييم

---

### 2.8 `card-order.js` - بطاقة طلب

**الاستخدام:** عرض الطلبات في `orders/index.html` و `dashboard/orders/index.html`
**الجدول:** `orders` + `order_items`

#### الميزات:
- رقم الطلب + Badge الحالة
- المنتجات (صور مصغرة)
- المجموع + الخصم
- التاريخ
- رقم التتبع (إن وجد)
- أزرار: تتبع / إلغاء / عرض / تقييم

---

### 2.9 `card-message.js` - بطاقة محادثة

**الاستخدام:** عرض المحادثات في `messages/inbox.html`
**الجدول:** `conversations` + `messages`

#### الميزات:
- صورة النشاط + الاسم
- آخر رسالة (مقتطعة)
- الوقت (نسبي)
- عداد الرسائل غير المقروءة
- Badge "موثق"

---

### 2.10 `card-notification.js` - بطاقة إشعار

**الاستخدام:** عرض الإشعارات في `dashboard/notifications.html`
**الجدول:** `notifications`

#### الميزات:
- الأيقونة (حسب النوع)
- العنوان + الرسالة
- الوقت (نسبي)
- حالة: مقروء / غير مقروء
- زر حذف

---

### 2.11 `card-offer.js` - بطاقة عرض

**الاستخدام:** عرض العروض في `index.html`
**الجدول:** `offers`

#### الميزات:
- نسبة الخصم + الأيقونة
- العنوان + الوصف
- مؤقت العد التنازلي (countdown)
- زر CTA

---

### 2.12 `card-coupon.js` - بطاقة كوبون

**الاستخدام:** عرض الكوبونات في `profile/customer.html`
**الجدول:** `coupons`

#### الميزات:
- الكود (قابل للنسخ)
- نوع الخصم + القيمة
- تاريخ الانتهاء
- زر نسخ / استخدام

---

### 2.13 `card-banner.js` - بطاقة بانر

**الاستخدام:** عرض البانرات في `index.html` وصفحات أخرى
**الجدول:** `banners`

#### الميزات:
- الصورة + العنوان
- الرابط
- مؤقت العد التنازلي (إن وجد)

---

### 2.14 `card-concierge.js` - بطاقة خدمة VIP

**الاستخدام:** عرض خدمات الكونسيرج (الخدمات المنزلية)

#### الميزات:
- Badge VIP
- الأيقونة + العنوان + الوصف
- المميزات (قائمة)
- السعر
- زر "طلب الخدمة"

---

## 3. مكونات النماذج (Forms)

### 3.1 حقل إدخال (Input)

```html
<!-- حقل نصي -->
<div class="form-group">
  <label class="form-label" for="name">الاسم</label>
  <input type="text" id="name" class="form-control" placeholder="أدخل اسمك">
</div>

<!-- حقل مع خطأ -->
<div class="form-group has-error">
  <label class="form-label" for="email">البريد</label>
  <input type="email" id="email" class="form-control" value="invalid">
  <span class="error-message">البريد غير صالح</span>
</div>

<!-- حقل مع أيقونة -->
<div class="form-group">
  <label class="form-label">الهاتف</label>
  <div class="input-with-icon">
    <input type="tel" class="form-control" placeholder="0600000000">
    <i class="fas fa-phone input-icon"></i>
  </div>
</div>

<!-- حقل معطل -->
<div class="form-group">
  <label class="form-label">رقم الهوية</label>
  <input type="text" class="form-control" value="AB123456" disabled>
</div>
```

### 3.2 مربع اختيار (Checkbox)

```html
<label class="checkbox-label">
  <input type="checkbox" class="checkbox-input">
  <span class="checkbox-custom"></span>
  <span class="checkbox-text">أوافق على الشروط</span>
</label>

<!-- Checked state -->
<label class="checkbox-label">
  <input type="checkbox" class="checkbox-input" checked>
  <span class="checkbox-custom"></span>
  <span class="checkbox-text">مفعّل</span>
</label>
```

### 3.3 زر راديو (Radio)

```html
<div class="radio-group">
  <label class="radio-label">
    <input type="radio" name="payment" value="wallet" class="radio-input" checked>
    <span class="radio-custom"></span>
    <span class="radio-text">محفظة</span>
  </label>
  <label class="radio-label">
    <input type="radio" name="payment" value="card" class="radio-input">
    <span class="radio-custom"></span>
    <span class="radio-text">بطاقة</span>
  </label>
  <label class="radio-label">
    <input type="radio" name="payment" value="cash" class="radio-input">
    <span class="radio-custom"></span>
    <span class="radio-text">نقداً</span>
  </label>
</div>
```

### 3.4 قائمة منسدلة (Select)

```html
<div class="form-group">
  <label class="form-label">المدينة</label>
  <select class="form-control">
    <option value="">اختر المدينة</option>
    <option value="casablanca">الدار البيضاء</option>
    <option value="rabat">الرباط</option>
    <option value="marrakech">مراكش</option>
  </select>
</div>
```

### 3.5 منطقة نص (Textarea)

```html
<div class="form-group">
  <label class="form-label">الوصف</label>
  <textarea class="form-control" rows="4" placeholder="اكتب وصفاً..."></textarea>
</div>
```

### 3.6 رفع ملف (File Upload)

```html
<div class="file-upload">
  <input type="file" id="logo" accept="image/*" hidden>
  <label for="logo" class="file-upload-label">
    <i class="fas fa-cloud-upload-alt"></i>
    <span>اسحب الصورة هنا أو انقر للاختيار</span>
    <small>PNG, JPG حتى 5MB</small>
  </label>
</div>

<!-- مع معاينة -->
<div class="file-upload with-preview">
  <img src="preview.jpg" class="file-preview" alt="Preview">
  <button class="file-remove" type="button">
    <i class="fas fa-times"></i>
  </button>
</div>
```

### 3.7 نموذج كامل (Complete Form)

```html
<form id="salonForm" class="form">
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">اسم الصالون</label>
      <input type="text" class="form-control" required>
    </div>
    <div class="form-group">
      <label class="form-label">المدينة</label>
      <select class="form-control" required>
        <option value="">اختر</option>
      </select>
    </div>
  </div>
  
  <div class="form-group">
    <label class="form-label">الوصف</label>
    <textarea class="form-control" rows="4"></textarea>
  </div>
  
  <div class="form-actions">
    <button type="button" class="btn btn-secondary">إلغاء</button>
    <button type="submit" class="btn btn-primary">
      <i class="fas fa-save"></i>
      <span>حفظ</span>
    </button>
  </div>
</form>
```

---

## 4. مكونات التفاعل (Interactive)

### 4.1 النوافذ المنبثقة (Modals)

#### Modal تأكيد:

```html
<div class="modal-overlay" id="deleteModal">
  <div class="modal modal-confirm">
    <div class="modal-icon danger">
      <i class="fas fa-exclamation-triangle"></i>
    </div>
    <h3 class="modal-title">تأكيد الحذف</h3>
    <p class="modal-message">
      هل أنت متأكد من حذف هذا العنصر؟<br>
      لا يمكن التراجع عن هذا الإجراء.
    </p>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('deleteModal')">
        إلغاء
      </button>
      <button class="btn btn-danger" onclick="confirmDelete()">
        <i class="fas fa-trash"></i>
        <span>حذف</span>
      </button>
    </div>
  </div>
</div>
```

#### Modal نموذج:

```html
<div class="modal-overlay" id="addServiceModal">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">إضافة خدمة</h3>
      <button class="modal-close" onclick="closeModal('addServiceModal')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      <form id="serviceForm">
        <div class="form-group">
          <label class="form-label">اسم الخدمة</label>
          <input type="text" class="form-control" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">السعر</label>
            <input type="number" class="form-control" required>
          </div>
          <div class="form-group">
            <label class="form-label">المدة (دقيقة)</label>
            <input type="number" class="form-control" required>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('addServiceModal')">
        إلغاء
      </button>
      <button class="btn btn-primary" onclick="submitService()">
        <i class="fas fa-save"></i>
        <span>حفظ</span>
      </button>
    </div>
  </div>
</div>
```

#### JavaScript للـ Modal:

```javascript
// فتح Modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// إغلاق Modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// إغلاق عند النقر خارج Modal
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// إغلاق بمفتاح Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});
```

---

### 4.2 التبويبات (Tabs)

```html
<div class="tabs">
  <div class="tabs-header">
    <button class="tab-btn active" data-tab="services">الخدمات</button>
    <button class="tab-btn" data-tab="staff">الفريق</button>
    <button class="tab-btn" data-tab="reviews">التقييمات</button>
  </div>
  <div class="tabs-content">
    <div class="tab-pane active" id="services">
      <!-- محتوى الخدمات -->
    </div>
    <div class="tab-pane" id="staff">
      <!-- محتوى الفريق -->
    </div>
    <div class="tab-pane" id="reviews">
      <!-- محتوى التقييمات -->
    </div>
  </div>
</div>
```

```javascript
// تفعيل التبويبات
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    
    // تحديث الأزرار
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // تحديث المحتوى
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
  });
});
```

---

### 4.3 الأكورديون (Accordion)

```html
<div class="accordion">
  <div class="accordion-item">
    <button class="accordion-header">
      <span>كيف أحجز موعداً؟</span>
      <i class="fas fa-chevron-down accordion-icon"></i>
    </button>
    <div class="accordion-content">
      <p>يمكنك الحجز من خلال...</p>
    </div>
  </div>
  <div class="accordion-item">
    <button class="accordion-header">
      <span>ما هي طرق الدفع؟</span>
      <i class="fas fa-chevron-down accordion-icon"></i>
    </button>
    <div class="accordion-content">
      <p>نقبل الدفع بـ...</p>
    </div>
  </div>
</div>
```

```javascript
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const item = header.parentElement;
    const content = item.querySelector('.accordion-content');
    const icon = header.querySelector('.accordion-icon');
    
    item.classList.toggle('active');
    content.classList.toggle('active');
    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');
  });
});
```

---

### 4.4 Dropdown

```html
<div class="dropdown">
  <button class="dropdown-toggle" onclick="toggleDropdown(this)">
    <span>خيارات</span>
    <i class="fas fa-chevron-down"></i>
  </button>
  <div class="dropdown-menu">
    <a href="#" class="dropdown-item">
      <i class="fas fa-edit"></i>
      <span>تعديل</span>
    </a>
    <a href="#" class="dropdown-item">
      <i class="fas fa-copy"></i>
      <span>نسخ</span>
    </a>
    <div class="dropdown-divider"></div>
    <a href="#" class="dropdown-item danger">
      <i class="fas fa-trash"></i>
      <span>حذف</span>
    </a>
  </div>
</div>
```

---

### 4.5 Tooltip

```html
<button class="btn btn-primary" data-tooltip="حفظ التغييرات">
  <i class="fas fa-save"></i>
</button>

<button class="btn btn-secondary" data-tooltip="إلغاء" data-position="top">
  <i class="fas fa-times"></i>
</button>
```

---

### 4.6 Progress Bar

```html
<div class="progress">
  <div class="progress-bar" style="width: 75%">
    <span class="progress-text">75%</span>
  </div>
</div>

<!-- مع مراحل -->
<div class="progress-steps">
  <div class="progress-step completed">
    <div class="step-circle">1</div>
    <span class="step-label">البيانات</span>
  </div>
  <div class="progress-step active">
    <div class="step-circle">2</div>
    <span class="step-label">الصور</span>
  </div>
  <div class="progress-step">
    <div class="step-circle">3</div>
    <span class="step-label">التوثيق</span>
  </div>
</div>
```

---

## 5. مكونات عرض البيانات (Data Display)

### 5.1 الجداول (Tables)

```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th>الاسم</th>
        <th>البريد</th>
        <th>الدور</th>
        <th>الحالة</th>
        <th>الإجراءات</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>أحمد محمد</td>
        <td>ahmed@example.com</td>
        <td>مدير</td>
        <td>
          <span class="badge badge-success">نشط</span>
        </td>
        <td>
          <div class="table-actions">
            <button class="table-action-btn" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button class="table-action-btn danger" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### 5.2 قائمة (List)

```html
<ul class="list">
  <li class="list-item">
    <div class="list-icon">
      <i class="fas fa-cut"></i>
    </div>
    <div class="list-content">
      <div class="list-title">قص الشعر</div>
      <div class="list-subtitle">30 دقيقة • 50 MAD</div>
    </div>
    <div class="list-actions">
      <button class="btn btn-sm btn-primary">احجز</button>
    </div>
  </li>
</ul>
```

---

### 5.3 إحصائيات (Stats)

```html
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-icon success">
      <i class="fas fa-calendar-check"></i>
    </div>
    <div class="stat-content">
      <div class="stat-value">124</div>
      <div class="stat-label">حجوزات اليوم</div>
    </div>
    <div class="stat-trend up">
      <i class="fas fa-arrow-up"></i>
      <span>12%</span>
    </div>
  </div>
  
  <div class="stat-card">
    <div class="stat-icon primary">
      <i class="fas fa-money-bill"></i>
    </div>
    <div class="stat-content">
      <div class="stat-value">15,420 MAD</div>
      <div class="stat-label">الإيرادات</div>
    </div>
    <div class="stat-trend up">
      <i class="fas fa-arrow-up"></i>
      <span>8%</span>
    </div>
  </div>
</div>
```

---

### 5.4 Rating Stars

```html
<!-- عرض فقط -->
<div class="rating-stars">
  <i class="fas fa-star"></i>
  <i class="fas fa-star"></i>
  <i class="fas fa-star"></i>
  <i class="fas fa-star"></i>
  <i class="fas fa-star-half-alt"></i>
  <span class="rating-value">4.5</span>
  <span class="rating-count">(120)</span>
</div>

<!-- قابل للتفاعل -->
<div class="rating-stars interactive" data-rating="0">
  <i class="far fa-star" data-value="1"></i>
  <i class="far fa-star" data-value="2"></i>
  <i class="far fa-star" data-value="3"></i>
  <i class="far fa-star" data-value="4"></i>
  <i class="far fa-star" data-value="5"></i>
</div>
```

```javascript
// تفعيل التقييم التفاعلي
document.querySelectorAll('.rating-stars.interactive').forEach(container => {
  const stars = container.querySelectorAll('.far.fa-star');
  
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.dataset.value);
      container.dataset.rating = value;
      
      stars.forEach(s => {
        const starValue = parseInt(s.dataset.value);
        s.classList.toggle('fas', starValue <= value);
        s.classList.toggle('far', starValue > value);
      });
    });
  });
});
```

---

### 5.5 Timeline

```html
<div class="timeline">
  <div class="timeline-item completed">
    <div class="timeline-marker">
      <i class="fas fa-check"></i>
    </div>
    <div class="timeline-content">
      <div class="timeline-title">تم إنشاء الطلب</div>
      <div class="timeline-time">10:30 صباحاً</div>
    </div>
  </div>
  
  <div class="timeline-item active">
    <div class="timeline-marker">
      <i class="fas fa-truck"></i>
    </div>
    <div class="timeline-content">
      <div class="timeline-title">قيد الشحن</div>
      <div class="timeline-time">2:15 مساءً</div>
    </div>
  </div>
  
  <div class="timeline-item">
    <div class="timeline-marker">
      <i class="fas fa-home"></i>
    </div>
    <div class="timeline-content">
      <div class="timeline-title">تم التسليم</div>
      <div class="timeline-time">--</div>
    </div>
  </div>
</div>
```

---

### 5.6 Avatar

```html
<!-- Avatar بحجم صغير -->
<div class="avatar avatar-sm">
  <img src="user.jpg" alt="User">
</div>

<!-- Avatar بحجم متوسط -->
<div class="avatar avatar-md">
  <img src="user.jpg" alt="User">
</div>

<!-- Avatar بحجم كبير -->
<div class="avatar avatar-lg">
  <img src="user.jpg" alt="User">
</div>

<!-- Avatar مع حالة -->
<div class="avatar avatar-md">
  <img src="user.jpg" alt="User">
  <span class="avatar-status online"></span>
</div>

<!-- Avatar مع الحروف الأولى -->
<div class="avatar avatar-md avatar-initials">
  <span>أ م</span>
</div>
```

---

### 5.7 Badge

```html
<!-- Badge أساسي -->
<span class="badge badge-success">نشط</span>
<span class="badge badge-warning">قيد الانتظار</span>
<span class="badge badge-error">ملغي</span>
<span class="badge badge-info">قيد المعالجة</span>
<span class="badge badge-primary">موثق</span>

<!-- Badge مع أيقونة -->
<span class="badge badge-success">
  <i class="fas fa-check"></i>
  <span>مكتمل</span>
</span>

<!-- Badge للحالات -->
<span class="badge badge-booking-pending">قيد الانتظار</span>
<span class="badge badge-booking-confirmed">مؤكد</span>
<span class="badge badge-order-shipped">تم الشحن</span>
```

---

## 6. مكونات التنقل (Navigation)

### 6.1 Breadcrumbs

```html
<nav class="breadcrumbs">
  <a href="/" class="breadcrumb-item">
    <i class="fas fa-home"></i>
    <span>الرئيسية</span>
  </a>
  <i class="fas fa-chevron-left breadcrumb-separator"></i>
  <a href="/salons" class="breadcrumb-item">الصالونات</a>
  <i class="fas fa-chevron-left breadcrumb-separator"></i>
  <span class="breadcrumb-item active">صالون الأناقة</span>
</nav>
```

---

### 6.2 Pagination

```html
<div class="pagination">
  <button class="pagination-btn" disabled>
    <i class="fas fa-chevron-right"></i>
  </button>
  <button class="pagination-btn active">1</button>
  <button class="pagination-btn">2</button>
  <button class="pagination-btn">3</button>
  <span class="pagination-ellipsis">...</span>
  <button class="pagination-btn">10</button>
  <button class="pagination-btn">
    <i class="fas fa-chevron-left"></i>
  </button>
</div>
```

---

### 6.3 Sidebar (للوحة التحكم)

```html
<aside class="sidebar">
  <div class="sidebar-header">
    <img src="logo.png" alt="Logo" class="sidebar-logo">
  </div>
  
  <nav class="sidebar-nav">
    <a href="/dashboard" class="sidebar-link active">
      <i class="fas fa-home"></i>
      <span>الرئيسية</span>
    </a>
    <a href="/dashboard/appointments" class="sidebar-link">
      <i class="fas fa-calendar"></i>
      <span>المواعيد</span>
    </a>
    <a href="/dashboard/services" class="sidebar-link">
      <i class="fas fa-cut"></i>
      <span>الخدمات</span>
    </a>
    <a href="/dashboard/staff" class="sidebar-link">
      <i class="fas fa-users"></i>
      <span>الموظفون</span>
    </a>
    <a href="/dashboard/orders" class="sidebar-link">
      <i class="fas fa-shopping-bag"></i>
      <span>الطلبات</span>
    </a>
  </nav>
  
  <div class="sidebar-footer">
    <a href="/dashboard/settings" class="sidebar-link">
      <i class="fas fa-cog"></i>
      <span>الإعدادات</span>
    </a>
  </div>
</aside>
```

---

## 7. مكونات خاصة بالمنصة (Platform-specific)

### 7.1 تقويم الحجز (Booking Calendar)

```html
<div class="booking-calendar">
  <div class="calendar-header">
    <button class="calendar-nav prev">
      <i class="fas fa-chevron-right"></i>
    </button>
    <h3 class="calendar-title">يوليو 2026</h3>
    <button class="calendar-nav next">
      <i class="fas fa-chevron-left"></i>
    </button>
  </div>
  
  <div class="calendar-grid">
    <div class="calendar-day-name">أحد</div>
    <div class="calendar-day-name">إثنين</div>
    <div class="calendar-day-name">ثلاثاء</div>
    <div class="calendar-day-name">أربعاء</div>
    <div class="calendar-day-name">خميس</div>
    <div class="calendar-day-name">جمعة</div>
    <div class="calendar-day-name">سبت</div>
    
    <!-- أيام -->
    <div class="calendar-day disabled">29</div>
    <div class="calendar-day disabled">30</div>
    <div class="calendar-day">1</div>
    <div class="calendar-day">2</div>
    <div class="calendar-day holiday" data-tooltip="عطلة">3</div>
    <div class="calendar-day selected">4</div>
    <div class="calendar-day">5</div>
    <!-- ... -->
  </div>
</div>
```

---

### 7.2 اختيار الوقت (Time Slots)

```html
<div class="time-slots">
  <div class="time-slot available">09:00</div>
  <div class="time-slot available">09:30</div>
  <div class="time-slot booked">10:00</div>
  <div class="time-slot available selected">10:30</div>
  <div class="time-slot available">11:00</div>
  <div class="time-slot past">11:30</div>
</div>
```

```javascript
// تفعيل اختيار الوقت
document.querySelectorAll('.time-slot.available').forEach(slot => {
  slot.addEventListener('click', () => {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');
    
    // تحديث الوقت المختار
    const selectedTime = slot.textContent;
    console.log('الوقت المختار:', selectedTime);
  });
});
```

---

### 7.3 السلة (Cart)

```html
<div class="cart-sidebar">
  <div class="cart-header">
    <h3>سلة التسوق</h3>
    <button class="cart-close" onclick="toggleCart()">
      <i class="fas fa-times"></i>
    </button>
  </div>
  
  <div class="cart-items">
    <div class="cart-item">
      <img src="product.jpg" alt="Product" class="cart-item-image">
      <div class="cart-item-content">
        <div class="cart-item-name">زيت الأرغان</div>
        <div class="cart-item-variant">250ml</div>
        <div class="cart-item-price">150 MAD</div>
      </div>
      <div class="cart-item-quantity">
        <button class="qty-btn minus">-</button>
        <span class="qty-value">2</span>
        <button class="qty-btn plus">+</button>
      </div>
    </div>
  </div>
  
  <div class="cart-footer">
    <div class="cart-coupon">
      <input type="text" placeholder="كود الخصم" class="form-control">
      <button class="btn btn-secondary">تطبيق</button>
    </div>
    <div class="cart-summary">
      <div class="cart-summary-row">
        <span>المجموع الفرعي</span>
        <span>300 MAD</span>
      </div>
      <div class="cart-summary-row">
        <span>الشحن</span>
        <span>30 MAD</span>
      </div>
      <div class="cart-summary-row total">
        <span>المجموع</span>
        <span>330 MAD</span>
      </div>
    </div>
    <button class="btn btn-primary btn-block">
      <i class="fas fa-credit-card"></i>
      <span>إتمام الشراء</span>
    </button>
  </div>
</div>
```

```javascript
// إدارة السلة
const CART_KEY = 'bf-cart';

function getCart() {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : { items: [], coupon_code: null };
}

function addToCart(product, variant = null, quantity = 1) {
  const cart = getCart();
  const existingItem = cart.items.find(
    item => item.product_id === product.id && 
            item.variant_id === variant?.id
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product_id: product.id,
      variant_id: variant?.id || null,
      name: product.name,
      image: product.image_url,
      price: variant?.price || product.price,
      quantity
    });
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('bf-cart-updated'));
}

function updateCartQuantity(productId, variantId, quantity) {
  const cart = getCart();
  const item = cart.items.find(
    i => i.product_id === productId && i.variant_id === variantId
  );
  
  if (item) {
    item.quantity = quantity;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('bf-cart-updated'));
  }
}

function removeFromCart(productId, variantId) {
  const cart = getCart();
  cart.items = cart.items.filter(
    i => !(i.product_id === productId && i.variant_id === variantId)
  );
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('bf-cart-updated'));
}

// تحديث عداد السلة في Navbar
window.addEventListener('bf-cart-updated', () => {
  const cart = getCart();
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector('.cart-count').textContent = count;
});
```

---

### 7.4 المحادثة (Chat)

```html
<div class="chat-container">
  <div class="chat-header">
    <img src="salon-logo.jpg" alt="Salon" class="chat-avatar">
    <div class="chat-info">
      <div class="chat-name">صالون الأناقة</div>
      <div class="chat-status online">متصل الآن</div>
    </div>
  </div>
  
  <div class="chat-messages">
    <div class="message received">
      <div class="message-content">مرحباً، كيف يمكنني مساعدتك؟</div>
      <div class="message-time">10:30</div>
    </div>
    <div class="message sent">
      <div class="message-content">أريد حجز موعد لقص الشعر</div>
      <div class="message-time">10:31</div>
    </div>
  </div>
  
  <div class="chat-input">
    <button class="chat-attach">
      <i class="fas fa-paperclip"></i>
    </button>
    <input type="text" placeholder="اكتب رسالة..." class="chat-field">
    <button class="chat-send">
      <i class="fas fa-paper-plane"></i>
    </button>
  </div>
</div>
```

```javascript
// Realtime للمحادثات
import { supabase } from './config/supabase-init.js';

function subscribeToMessages(conversationId, callback) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', 
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

async function sendMessage(conversationId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: getCurrentUserId(),
      content
    });
  
  if (error) throw error;
  return data;
}
```

---

### 7.5 خريطة الفروع (Branches Map)

```html
<div class="branches-map">
  <div id="map" class="map-container"></div>
  <div class="branches-list">
    <div class="branch-item active">
      <div class="branch-name">الفرع الرئيسي</div>
      <div class="branch-address">شارع محمد الخامس، الدار البيضاء</div>
      <div class="branch-hours">09:00 - 21:00</div>
    </div>
  </div>
</div>
```

```javascript
// Leaflet Map
import L from 'leaflet';

function initMap(branches) {
  const map = L.map('map').setView([33.5731, -7.5898], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  
  branches.forEach(branch => {
    L.marker([branch.latitude, branch.longitude])
      .addTo(map)
      .bindPopup(`
        <strong>${branch.name}</strong><br>
        ${branch.address}
      `);
  });
}
```

---

## 8. أنماط التجميع (Composition Patterns)

### 8.1 شبكة البطاقات (Cards Grid)

```html
<div class="cards-grid">
  <!-- يتم ملؤها ديناميكياً -->
</div>
```

```css
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

/* Responsive */
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
```

---

### 8.2 تخطيط Split (Split Layout)

```html
<div class="split-layout">
  <aside class="split-sidebar">
    <!-- الفلاتر أو القائمة -->
  </aside>
  <main class="split-content">
    <!-- المحتوى الرئيسي -->
  </main>
</div>
```

---

### 8.3 Hero Section

```html
<section class="hero">
  <div class="hero-content">
    <h1 class="hero-title">احجز موعدك الآن</h1>
    <p class="hero-subtitle">أفضل الصالونات في مدينتك</p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-lg">تصفح الصالونات</button>
      <button class="btn btn-secondary btn-lg">تصفح المتاجر</button>
    </div>
  </div>
  <div class="hero-image">
    <img src="hero.jpg" alt="Hero">
  </div>
</section>
```

---

### 8.4 Empty State

```html
<div class="empty-state">
  <i class="fas fa-inbox empty-state-icon"></i>
  <h3 class="empty-state-title">لا توجد حجوزات</h3>
  <p class="empty-state-message">
    لم تقم بأي حجز بعد. ابدأ بتصفح الصالونات المتاحة.
  </p>
  <button class="btn btn-primary">
    <i class="fas fa-search"></i>
    <span>تصفح الصالونات</span>
  </button>
</div>
```

---

## 9. Accessibility (إمكانية الوصول)

### 9.1 ARIA Labels

```html
<!-- زر بدون نص -->
<button aria-label="إضافة للمفضلة">
  <i class="fas fa-heart"></i>
</button>

<!-- حقل إدخال -->
<label for="email" class="sr-only">البريد الإلكتروني</label>
<input type="email" id="email" aria-describedby="email-error">
<span id="email-error" class="error-message">البريد غير صالح</span>

<!-- Modal -->
<div class="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">عنوان النافذة</h2>
</div>

<!-- Tab -->
<button role="tab" aria-selected="true" aria-controls="panel-1">تبويب 1</button>
<div role="tabpanel" id="panel-1">المحتوى</div>
```

### 9.2 Keyboard Navigation

```javascript
// التنقل بلوحة المفاتيح في Dropdown
dropdown.addEventListener('keydown', (e) => {
  const items = dropdown.querySelectorAll('.dropdown-item');
  const currentIndex = Array.from(items).findIndex(i => i === document.activeElement);
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const nextIndex = (currentIndex + 1) % items.length;
    items[nextIndex].focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prevIndex = (currentIndex - 1 + items.length) % items.length;
    items[prevIndex].focus();
  } else if (e.key === 'Escape') {
    closeDropdown();
  }
});
```

### 9.3 Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## 10. Responsive Patterns

### 10.1 Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

/* Mobile First */
.container { padding: var(--spacing-md); }

@media (min-width: 768px) {
  .container { padding: var(--spacing-xl); }
}

@media (min-width: 1024px) {
  .container { padding: var(--spacing-2xl); }
}
```

### 10.2 Responsive Typography

```css
.page-title {
  font-size: 1.5rem;
}

@media (min-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
}

@media (min-width: 1024px) {
  .page-title {
    font-size: 2.5rem;
  }
}
```

### 10.3 Responsive Tables

```css
@media (max-width: 768px) {
  .table-responsive {
    display: block;
  }
  
  .table-responsive thead {
    display: none;
  }
  
  .table-responsive tr {
    display: block;
    margin-bottom: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
  }
  
  .table-responsive td {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-xs) 0;
    border: none;
  }
  
  .table-responsive td::before {
    content: attr(data-label);
    font-weight: var(--font-weight-semibold);
  }
}
```

---

## 11. Checklist للمكون

قبل إنشاء أو استخدام أي مكون، تأكد من:

- [ ] يتبع Design System (ألوان، مسافات، خطوط)
- [ ] Responsive على جميع الأحجام
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] يعالج جميع الحالات (empty, loading, error)
- [ ] يدعم الثيم الداكن
- [ ] لا يحتوي على XSS vulnerabilities
- [ ] موثق بأمثلة واضحة
- [ ] مُختبر على المتصفحات الرئيسية

---

**هذا الملف هو المرجع الوحيد المعتمد للمكونات. أي تعديل يجب أن يتم هنا أولاً.**
```

---

تم إنشاء الملف بنجاح! 🎉

**الملف يحتوي على:**

### ✅ **14 مكون بطاقة موثق:**
- card-salon, card-store, card-product, card-service, card-staff
- card-review, card-booking, card-order, card-message, card-notification
- card-offer, card-coupon, card-banner, card-concierge

### ✅ **مكونات النماذج (Forms):**
- Input, Checkbox, Radio, Select, Textarea, File Upload
- نموذج كامل مع أمثلة

### ✅ **مكونات التفاعل (Interactive):**
- Modals (تأكيد + نموذج)
- Tabs, Accordion, Dropdown, Tooltip
- Progress Bar

### ✅ **مكونات عرض البيانات:**
- Tables, Lists, Stats Cards
- Rating Stars (تفاعلي + ثابت)
- Timeline, Avatar, Badge

### ✅ **مكونات التنقل:**
- Breadcrumbs, Pagination, Sidebar

### ✅ **مكونات خاصة بالمنصة:**
- Booking Calendar
- Time Slots
- Cart (مع localStorage + events)
- Chat (مع Realtime)
- Branches Map

### ✅ **أنماط التجميع:**
- Cards Grid, Split Layout, Hero Section, Empty State

### ✅ **Accessibility:**
- ARIA Labels
- Keyboard Navigation
- Screen Reader Only

### ✅ **Responsive Patterns:**
- Breakpoints
- Responsive Typography
- Responsive Tables

### ✅ **Checklist** لكل مكون

 