# نظام التصميم (Design System) - BarberFlow Pro

هذا الملف يحدد جميع معايير التصميم الموحدة للمنصة.
جميع الصفحات والمكونات يجب أن تلتزم بهذه المعايير بدقة.

---

## 1. الألوان (Colors)

### 1.1 الألوان الأساسية (Primary Colors)

```css
:root {
  /* اللون الرئيسي - يُستخدم في الأزرار الأساسية، الروابط، العناصر المميزة */
  --color-primary: #D4AF37;           /* ذهبي */
  --color-primary-hover: #B8941F;     /* ذهبي داكن عند التمرير */
  --color-primary-active: #9C7D17;    /* ذهبي أغمق عند الضغط */
  --color-primary-light: #F5E6B8;     /* ذهبي فاتح للخلفيات */
  
  /* اللون الثانوي - يُستخدم في الأزرار الثانوية */
  --color-secondary: #2C3E50;         /* أزرق داكن */
  --color-secondary-hover: #1A252F;   /* أزرق أغمق عند التمرير */
  --color-secondary-active: #0F1619;  /* أزرق أغمق عند الضغط */
  
  /* لون التمييز - يُستخدم للعناصر المميزة */
  --color-accent: #E74C3C;            /* أحمر */
  --color-accent-hover: #C0392B;      /* أحمر داكن */
}
```

### 1.2 ألوان الحالات (Status Colors)

```css
:root {
  /* النجاح */
  --color-success: #27AE60;           /* أخضر */
  --color-success-hover: #229954;
  --color-success-light: #D5F4E6;     /* أخضر فاتح للخلفيات */
  
  /* الخطأ */
  --color-error: #E74C3C;             /* أحمر */
  --color-error-hover: #C0392B;
  --color-error-light: #FADBD8;       /* أحمر فاتح للخلفيات */
  
  /* التحذير */
  --color-warning: #F39C12;           /* برتقالي */
  --color-warning-hover: #D68910;
  --color-warning-light: #FDEBD0;     /* برتقالي فاتح للخلفيات */
  
  /* المعلومة */
  --color-info: #3498DB;              /* أزرق */
  --color-info-hover: #2980B9;
  --color-info-light: #D6EAF8;        /* أزرق فاتح للخلفيات */
}
```

### 1.3 الألوان المحايدة (Neutral Colors)

```css
:root {
  /* النصوص */
  --color-text-primary: #2C3E50;      /* نص أساسي */
  --color-text-secondary: #7F8C8D;    /* نص ثانوي */
  --color-text-tertiary: #95A5A6;     /* نص ثالثي */
  --color-text-disabled: #BDC3C7;     /* نص معطل */
  --color-text-inverse: #FFFFFF;      /* نص على خلفيات داكنة */
  
  /* الخلفيات */
  --color-bg-primary: #FFFFFF;        /* خلفية أساسية */
  --color-bg-secondary: #F8F9FA;      /* خلفية ثانوية */
  --color-bg-tertiary: #ECF0F1;       /* خلفية ثالثية */
  --color-bg-dark: #2C3E50;           /* خلفية داكنة */
  
  /* الحدود */
  --color-border: #E0E0E0;            /* حدود عادية */
  --color-border-light: #F0F0F0;      /* حدود فاتحة */
  --color-border-dark: #BDC3C7;       /* حدود داكنة */
  
  /* الظلال */
  --color-shadow: rgba(0, 0, 0, 0.1);
  --color-shadow-dark: rgba(0, 0, 0, 0.2);
}
```

### 1.4 الثيم الداكن (Dark Theme)

```css
[data-theme="dark"] {
  /* النصوص */
  --color-text-primary: #ECF0F1;
  --color-text-secondary: #BDC3C7;
  --color-text-tertiary: #95A5A6;
  
  /* الخلفيات */
  --color-bg-primary: #1A1A1A;
  --color-bg-secondary: #2C2C2C;
  --color-bg-tertiary: #3D3D3D;
  
  /* الحدود */
  --color-border: #3D3D3D;
  --color-border-light: #2C2C2C;
}
```

---

## 2. الطباعة (Typography)

### 2.1 الخطوط (Font Families)

```css
:root {
  /* الخط الرئيسي - عربي */
  --font-family-arabic: 'Cairo', 'Tajawal', sans-serif;
  
  /* الخط الثانوي - إنجليزي */
  --font-family-english: 'Inter', 'Roboto', sans-serif;
  
  /* خط الأكواد */
  --font-family-mono: 'Fira Code', 'Courier New', monospace;
}
```

### 2.2 أحجام الخطوط (Font Sizes)

```css
:root {
  /* الأحجام الأساسية */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-md: 1.125rem;   /* 18px */
  --font-size-lg: 1.25rem;    /* 20px */
  --font-size-xl: 1.5rem;     /* 24px */
  --font-size-2xl: 1.875rem;  /* 30px */
  --font-size-3xl: 2.25rem;   /* 36px */
  --font-size-4xl: 3rem;      /* 48px */
  
  /* عناوين الصفحات */
  --font-size-page-title: 2.5rem;    /* 40px */
  --font-size-section-title: 1.875rem; /* 30px */
  --font-size-card-title: 1.25rem;    /* 20px */
}
```

### 2.3 أوزان الخطوط (Font Weights)

```css
:root {
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### 2.4 ارتفاع السطر (Line Heights)

```css
:root {
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### 2.5 أنماط العناوين (Heading Styles)

```css
/* العنوان الرئيسي للصفحة */
h1, .page-title {
  font-size: var(--font-size-page-title);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
  margin-bottom: 1.5rem;
}

/* عنوان القسم */
h2, .section-title {
  font-size: var(--font-size-section-title);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

/* عنوان البطاقة */
h3, .card-title {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

/* النص الأساسي */
p, .body-text {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
}

/* النص الثانوي */
.text-secondary {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* النص الصغير */
.text-small {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}
```

---

## 3. المسافات (Spacing)

### 3.1 مقياس المسافات (Spacing Scale)

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-3xl: 4rem;     /* 64px */
}
```

### 3.2 استخدامات المسافات

```css
/* المسافات الداخلية (Padding) */
.padding-xs { padding: var(--spacing-xs); }
.padding-sm { padding: var(--spacing-sm); }
.padding-md { padding: var(--spacing-md); }
.padding-lg { padding: var(--spacing-lg); }
.padding-xl { padding: var(--spacing-xl); }

/* المسافات الخارجية (Margin) */
.margin-xs { margin: var(--spacing-xs); }
.margin-sm { margin: var(--spacing-sm); }
.margin-md { margin: var(--spacing-md); }
.margin-lg { margin: var(--spacing-lg); }
.margin-xl { margin: var(--spacing-xl); }

/* المسافات بين العناصر (Gap) */
.gap-xs { gap: var(--spacing-xs); }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }
.gap-xl { gap: var(--spacing-xl); }
```

### 3.3 المسافات الافتراضية للمكونات

```css
/* البطاقات */
.card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

/* الأزرار */
.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  gap: var(--spacing-sm);
}

/* الحقول */
.form-group {
  margin-bottom: var(--spacing-md);
}

/* العناوين */
.section-title {
  margin-bottom: var(--spacing-lg);
}
```

---

## 4. الأزرار (Buttons)

### 4.1 الأحجام (Sizes)

```css
:root {
  /* زر صغير */
  --btn-sm-padding: 0.5rem 1rem;      /* 8px 16px */
  --btn-sm-font-size: 0.875rem;       /* 14px */
  --btn-sm-icon-size: 14px;
  
  /* زر متوسط (افتراضي) */
  --btn-md-padding: 0.75rem 1.5rem;   /* 12px 24px */
  --btn-md-font-size: 1rem;           /* 16px */
  --btn-md-icon-size: 16px;
  
  /* زر كبير */
  --btn-lg-padding: 1rem 2rem;        /* 16px 32px */
  --btn-lg-font-size: 1.125rem;       /* 18px */
  --btn-lg-icon-size: 20px;
}
```

### 4.2 الأنواع (Types)

```css
/* الزر الأساسي */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-primary:active {
  background-color: var(--color-primary-active);
}

/* الزر الثانوي */
.btn-secondary {
  background-color: transparent;
  color: var(--color-secondary);
  border: 2px solid var(--color-secondary);
}

.btn-secondary:hover {
  background-color: var(--color-secondary);
  color: var(--color-text-inverse);
}

/* زر الخطر */
.btn-danger {
  background-color: var(--color-error);
  color: var(--color-text-inverse);
  border: none;
}

.btn-danger:hover {
  background-color: var(--color-error-hover);
}

/* الزر الشبحي */
.btn-ghost {
  background-color: transparent;
  color: var(--color-text-primary);
  border: none;
}

.btn-ghost:hover {
  background-color: var(--color-bg-secondary);
}
```

### 4.3 الحالات (States)

```css
/* الحالة الافتراضية */
.btn {
  cursor: pointer;
  transition: all 0.2s ease;
}

/* حالة التمرير */
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--color-shadow);
}

/* حالة الضغط */
.btn:active {
  transform: translateY(0);
}

/* حالة التحميل */
.btn.loading {
  pointer-events: none;
  opacity: 0.7;
}

.btn.loading::after {
  content: '';
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 0.5rem;
}

/* حالة التعطيل */
.btn:disabled,
.btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 4.4 أمثلة الاستخدام

```html
<!-- زر أساسي -->
<button class="btn btn-primary">
  <i class="fas fa-save"></i>
  <span>حفظ</span>
</button>

<!-- زر ثانوي -->
<button class="btn btn-secondary">
  <i class="fas fa-times"></i>
  <span>إلغاء</span>
</button>

<!-- زر خطر -->
<button class="btn btn-danger">
  <i class="fas fa-trash"></i>
  <span>حذف</span>
</button>

<!-- زر بحجم صغير -->
<button class="btn btn-primary btn-sm">
  <span>إضافة</span>
</button>

<!-- زر بحجم كبير -->
<button class="btn btn-primary btn-lg">
  <span>متابعة</span>
</button>

<!-- زر محمّل -->
<button class="btn btn-primary loading">
  <span>جاري التحميل...</span>
</button>

<!-- زر معطل -->
<button class="btn btn-primary" disabled>
  <span>غير متاح</span>
</button>
```

---

## 5. الحقول (Form Inputs)

### 5.1 حقل نصي (Text Input)

```css
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-control::placeholder {
  color: var(--color-text-tertiary);
}

.form-control:disabled {
  background-color: var(--color-bg-secondary);
  cursor: not-allowed;
}
```

### 5.2 حقل مع خطأ (Error State)

```css
.form-group.has-error .form-control {
  border-color: var(--color-error);
}

.form-group.has-error .form-control:focus {
  box-shadow: 0 0 0 3px var(--color-error-light);
}

.error-message {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin-top: var(--spacing-xs);
}

.error-message::before {
  content: '⚠ ';
}
```

### 5.3 حقل مع أيقونة (Input with Icon)

```css
.input-with-icon {
  position: relative;
}

.input-with-icon .form-control {
  padding-right: 2.5rem;
}

.input-with-icon .input-icon {
  position: absolute;
  left: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
}
```

### 5.4 أمثلة الاستخدام

```html
<!-- حقل نصي عادي -->
<div class="form-group">
  <label class="form-label">الاسم الكامل</label>
  <input type="text" class="form-control" placeholder="أدخل اسمك">
</div>

<!-- حقل مع خطأ -->
<div class="form-group has-error">
  <label class="form-label">البريد الإلكتروني</label>
  <input type="email" class="form-control" value="invalid-email">
  <span class="error-message">البريد الإلكتروني غير صالح</span>
</div>

<!-- حقل مع أيقونة -->
<div class="form-group">
  <label class="form-label">رقم الهاتف</label>
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

---

## 6. البطاقات (Cards)

### 6.1 البطاقة الأساسية (Base Card)

```css
.card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: var(--spacing-lg);
  box-shadow: 0 2px 8px var(--color-shadow);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px var(--color-shadow-dark);
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}

.card-title {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.card-body {
  margin-bottom: var(--spacing-md);
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}
```

### 6.2 بطاقة صالون (Salon Card)

```css
.card-salon {
  position: relative;
  overflow: hidden;
}

.card-salon .cover-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 12px 12px 0 0;
}

.card-salon .logo {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid var(--color-bg-primary);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.card-salon .badge-verified {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);
  background-color: var(--color-success);
  color: var(--color-text-inverse);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 20px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.card-salon .rating {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-warning);
  font-weight: var(--font-weight-semibold);
}
```

### 6.3 بطاقة منتج (Product Card)

```css
.card-product {
  position: relative;
}

.card-product .product-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 12px 12px 0 0;
}

.card-product .badge-discount {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background-color: var(--color-error);
  color: var(--color-text-inverse);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 20px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.card-product .badge-new {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);
  background-color: var(--color-success);
  color: var(--color-text-inverse);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 20px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.card-product .price {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-product .price-current {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.card-product .price-old {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  text-decoration: line-through;
}

.card-product .actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
```

### 6.4 أمثلة الاستخدام

```html
<!-- بطاقة صالون -->
<div class="card card-salon">
  <img src="cover.jpg" alt="Cover" class="cover-image">
  <img src="logo.png" alt="Logo" class="logo">
  <span class="badge-verified">
    <i class="fas fa-check-circle"></i> موثق
  </span>
  <div class="card-body">
    <h3 class="card-title">صالون الأناقة</h3>
    <p class="text-secondary">الدار البيضاء، المغرب</p>
    <div class="rating">
      <i class="fas fa-star"></i>
      <span>4.8</span>
      <span class="text-small">(120 تقييم)</span>
    </div>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary btn-sm">احجز الآن</button>
  </div>
</div>

<!-- بطاقة منتج -->
<div class="card card-product">
  <img src="product.jpg" alt="Product" class="product-image">
  <span class="badge-discount">-20%</span>
  <span class="badge-new">جديد</span>
  <div class="card-body">
    <h3 class="card-title">زيت الأرغان</h3>
    <p class="text-secondary">عناية بالشعر</p>
    <div class="price">
      <span class="price-current">150 MAD</span>
      <span class="price-old">190 MAD</span>
    </div>
  </div>
  <div class="actions">
    <button class="btn btn-primary btn-sm">
      <i class="fas fa-cart-plus"></i>
      <span>أضف للسلة</span>
    </button>
    <button class="btn btn-ghost btn-sm">
      <i class="fas fa-heart"></i>
    </button>
  </div>
</div>
```

---

## 7. الشارات (Badges)

### 7.1 الشارات الأساسية

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: 20px;
  white-space: nowrap;
}

.badge-success {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.badge-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

.badge-warning {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
}

.badge-info {
  background-color: var(--color-info-light);
  color: var(--color-info);
}

.badge-primary {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}
```

### 7.2 شارات الحالات (Status Badges)

```css
/* حالة الحجز */
.badge-booking-pending {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
}

.badge-booking-confirmed {
  background-color: var(--color-info-light);
  color: var(--color-info);
}

.badge-booking-completed {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.badge-booking-cancelled {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

/* حالة الطلب */
.badge-order-pending {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
}

.badge-order-processing {
  background-color: var(--color-info-light);
  color: var(--color-info);
}

.badge-order-shipped {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.badge-order-delivered {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.badge-order-cancelled {
  background-color: var(--color-error-light);
  color: var(--color-error);
}
```

### 7.3 أمثلة الاستخدام

```html
<!-- شارة نجاح -->
<span class="badge badge-success">
  <i class="fas fa-check"></i>
  <span>مكتمل</span>
</span>

<!-- شارة تحذير -->
<span class="badge badge-warning">
  <i class="fas fa-clock"></i>
  <span>قيد الانتظار</span>
</span>

<!-- شارة خطأ -->
<span class="badge badge-error">
  <i class="fas fa-times"></i>
  <span>ملغي</span>
</span>

<!-- شارة معلومات -->
<span class="badge badge-info">
  <i class="fas fa-info-circle"></i>
  <span>قيد المعالجة</span>
</span>
```

---

## 8. النوافذ المنبثقة (Modals)

### 8.1 النافذة الأساسية

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.modal {
  background-color: var(--color-bg-primary);
  border-radius: 12px;
  padding: var(--spacing-xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

.modal-overlay.active .modal {
  transform: scale(1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
}

.modal-close:hover {
  color: var(--color-text-primary);
}

.modal-body {
  margin-bottom: var(--spacing-lg);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
```

### 8.2 نافذة التأكيد (Confirm Modal)

```css
.modal-confirm .modal-icon {
  text-align: center;
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.modal-confirm .modal-icon.warning {
  color: var(--color-warning);
}

.modal-confirm .modal-icon.danger {
  color: var(--color-error);
}

.modal-confirm .modal-message {
  text-align: center;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}
```

### 8.3 أمثلة الاستخدام

```html
<!-- نافذة تأكيد الحذف -->
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

<!-- نافذة نموذج -->
<div class="modal-overlay" id="formModal">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">إضافة منتج</h3>
      <button class="modal-close" onclick="closeModal('formModal')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      <form id="productForm">
        <div class="form-group">
          <label class="form-label">اسم المنتج</label>
          <input type="text" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label">السعر</label>
          <input type="number" class="form-control" required>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('formModal')">
        إلغاء
      </button>
      <button class="btn btn-primary" onclick="submitForm()">
        <i class="fas fa-save"></i>
        <span>حفظ</span>
      </button>
    </div>
  </div>
</div>
```

---

## 9. التنبيهات (Alerts/Notifications)

### 9.1 التنبيهات الثابتة (Static Alerts)

```css
.alert {
  padding: var(--spacing-md);
  border-radius: 8px;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.alert-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xs);
}

.alert-message {
  font-size: var(--font-size-sm);
}

.alert-success {
  background-color: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.alert-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

.alert-warning {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
}

.alert-info {
  background-color: var(--color-info-light);
  color: var(--color-info);
  border: 1px solid var(--color-info);
}
```

### 9.2 التنبيهات المنبثقة (Toast Notifications)

```css
.toast-container {
  position: fixed;
  top: var(--spacing-xl);
  right: var(--spacing-xl);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.toast {
  background-color: var(--color-bg-primary);
  border-radius: 8px;
  padding: var(--spacing-md);
  box-shadow: 0 4px 12px var(--color-shadow-dark);
  min-width: 300px;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
  font-size: var(--font-size-sm);
}

.toast-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
}

.toast-success .toast-icon {
  color: var(--color-success);
}

.toast-error .toast-icon {
  color: var(--color-error);
}

.toast-warning .toast-icon {
  color: var(--color-warning);
}

.toast-info .toast-icon {
  color: var(--color-info);
}
```

### 9.3 أمثلة الاستخدام

```html
<!-- تنبيه ثابت -->
<div class="alert alert-success">
  <i class="fas fa-check-circle alert-icon"></i>
  <div class="alert-content">
    <div class="alert-title">تم بنجاح</div>
    <div class="alert-message">تم حفظ التغييرات بنجاح</div>
  </div>
</div>

<!-- تنبيه منبثق (يُضاف ديناميكياً) -->
<div class="toast-container" id="toastContainer"></div>
```

```javascript
// JavaScript لإظهار التنبيه
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  toast.innerHTML = `
    <i class="fas ${icons[type]} toast-icon"></i>
    <div class="toast-content">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// الاستخدام
showToast('تم الحفظ بنجاح', 'success');
showToast('حدث خطأ', 'error');
showToast('يرجى ملء جميع الحقول', 'warning');
```

---

## 10. الجداول (Tables)

### 10.1 الجدول الأساسي

```css
.table-container {
  overflow-x: auto;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background-color: var(--color-bg-primary);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  background-color: var(--color-bg-secondary);
}

.table th {
  padding: var(--spacing-md);
  text-align: right;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-border);
}

.table td {
  padding: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light);
}

.table tbody tr:hover {
  background-color: var(--color-bg-secondary);
}

.table tbody tr:last-child td {
  border-bottom: none;
}
```

### 10.2 جدول مع إجراءات

```css
.table-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.table-action-btn {
  background: none;
  border: none;
  padding: var(--spacing-xs);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}

.table-action-btn:hover {
  color: var(--color-primary);
}

.table-action-btn.danger:hover {
  color: var(--color-error);
}
```

### 10.3 أمثلة الاستخدام

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

## 11. الحالات الخاصة (Special States)

### 11.1 حالة الفراغ (Empty State)

```css
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
}

.empty-state-icon {
  font-size: 4rem;
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-lg);
}

.empty-state-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-state-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.empty-state-action {
  margin-top: var(--spacing-md);
}
```

### 11.2 حالة الخطأ (Error State)

```css
.error-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
}

.error-state-icon {
  font-size: 4rem;
  color: var(--color-error);
  margin-bottom: var(--spacing-lg);
}

.error-state-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.error-state-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}
```

### 11.3 حالة التحميل (Loading State)

```css
.loading-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
}

.loading-spinner {
  font-size: 3rem;
  color: var(--color-primary);
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-lg);
}

.loading-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}
```

### 11.4 أمثلة الاستخدام

```html
<!-- حالة الفراغ -->
<div class="empty-state">
  <i class="fas fa-inbox empty-state-icon"></i>
  <h3 class="empty-state-title">لا توجد بيانات</h3>
  <p class="empty-state-message">
    لم يتم العثور على أي عناصر. ابدأ بإضافة عنصر جديد.
  </p>
  <div class="empty-state-action">
    <button class="btn btn-primary">
      <i class="fas fa-plus"></i>
      <span>إضافة عنصر</span>
    </button>
  </div>
</div>

<!-- حالة الخطأ -->
<div class="error-state">
  <i class="fas fa-exclamation-triangle error-state-icon"></i>
  <h3 class="error-state-title">حدث خطأ</h3>
  <p class="error-state-message">
    لم نتمكن من تحميل البيانات. يرجى المحاولة مرة أخرى.
  </p>
  <button class="btn btn-secondary">
    <i class="fas fa-redo"></i>
    <span>إعادة المحاولة</span>
  </button>
</div>

<!-- حالة التحميل -->
<div class="loading-state">
  <div class="loading-spinner">
    <i class="fas fa-spinner fa-spin"></i>
  </div>
  <p class="loading-message">جاري التحميل...</p>
</div>
```

---

## 12. الظلال (Shadows)

```css
:root {
  /* ظلال خفيفة */
  --shadow-sm: 0 1px 2px var(--color-shadow);
  
  /* ظلال متوسطة */
  --shadow-md: 0 4px 8px var(--color-shadow);
  
  /* ظلال كبيرة */
  --shadow-lg: 0 8px 16px var(--color-shadow-dark);
  
  /* ظلال كبيرة جداً */
  --shadow-xl: 0 16px 32px var(--color-shadow-dark);
}

/* الاستخدام */
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }
```

---

## 13. الزوايا (Border Radius)

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

/* الاستخدام */
.rounded-sm { border-radius: var(--radius-sm); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-full { border-radius: var(--radius-full); }
```

---

## 14. الأيقونات (Icons)

### 14.1 المكتبة

```css
/* Font Awesome 6 */
/* يُحمّل من CDN في جميع الصفحات */
```

### 14.2 الأحجام

```css
:root {
  --icon-size-xs: 12px;
  --icon-size-sm: 16px;
  --icon-size-md: 20px;
  --icon-size-lg: 24px;
  --icon-size-xl: 32px;
  --icon-size-2xl: 48px;
}

.icon-xs { font-size: var(--icon-size-xs); }
.icon-sm { font-size: var(--icon-size-sm); }
.icon-md { font-size: var(--icon-size-md); }
.icon-lg { font-size: var(--icon-size-lg); }
.icon-xl { font-size: var(--icon-size-xl); }
.icon-2xl { font-size: var(--icon-size-2xl); }
```

### 14.3 الأيقونات الأساسية

```css
/* الأيقونات الأكثر استخداماً */
.icon-primary { color: var(--color-primary); }
.icon-success { color: var(--color-success); }
.icon-error { color: var(--color-error); }
.icon-warning { color: var(--color-warning); }
.icon-info { color: var(--color-info); }
```

---

## 15. القواعد الذهبية

### ✅ افعل (Do's)

1. **استخدم المتغيرات دائماً** - لا تستخدم قيم ثابتة
2. **اتبع مقياس المسافات** - استخدم xs, sm, md, lg, xl
3. **وحّد الألوان** - استخدم الألوان من النظام فقط
4. **احترم الأحجام** - استخدم الأحجام المحددة للأزرار والخطوط
5. **اختبر على الموبايل** - جميع المكونات يجب أن تكون responsive

### ❌ لا تفعل (Don'ts)

1. **لا تستخدم ألوان مخصصة** - التزم بنظام الألوان
2. **لا تكسر مقياس المسافات** - لا تستخدم قيم عشوائية
3. **لا تعيد اختراع المكونات** - استخدم المكونات الموجودة
4. **لا تتجاهل الحالات** - Empty, Loading, Error states مهمة
5. **لا تنسى Accessibility** - استخدم ARIA labels عند الحاجة

---

## 16. Checklist للتصميم

قبل نشر أي صفحة، تأكد من:

- [ ] جميع الألوان من نظام التصميم
- [ ] جميع المسافات من مقياس المسافات
- [ ] جميع الأزرار تتبع الأنماط المحددة
- [ ] جميع الحقول تتبع الأنماط المحددة
- [ ] الحالات الخاصة (Empty, Loading, Error) مُطبقة
- [ ] التصميم responsive على جميع الشاشات
- [ ] الثيم الداكن يعمل بشكل صحيح
- [ ] الأيقونات من Font Awesome 6
- [ ] الظلال والزوايا من النظام

---

**هذا الملف هو المرجع الوحيد المعتمد للتصميم. أي تعديل يجب أن يتم هنا أولاً.**
```

---

تم إنشاء الملف بنجاح! 🎉

**الملف يحتوي على:**
- ✅ نظام ألوان كامل (أساسي، حالات، محايد، داكن)
- ✅ طباعة شاملة (خطوط، أحجام، أوزان)
- ✅ مقياس مسافات موحد
- ✅ أزرار بجميع الأحجام والأنواع والحالات
- ✅ حقول إدخال مع حالات الخطأ
- ✅ بطاقات (صالون، منتج)
- ✅ شارات للحالات المختلفة
- ✅ نوافذ منبثقة (تأكيد، نموذج)
- ✅ تنبيهات (ثابتة، منبثقة)
- ✅ جداول مع إجراءات
- ✅ حالات خاصة (فراغ، خطأ، تحميل)
- ✅ ظلال وزوايا موحدة
- ✅ أيقونات وأحجامها
- ✅ قواعد ذهبية وقائمة تحقق

