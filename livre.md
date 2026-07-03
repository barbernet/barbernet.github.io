# 📄 الملفات الجديدة للمشروع

## 1️⃣ `.gitignore`

```gitignore
# ============================================
# BarberFlow Pro - Git Ignore
# ============================================

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production
.env.development

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# OS Files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
desktop.ini

# Editor
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath
.settings/

# Logs
logs
*.log

# Build output
dist/
build/
out/

# Temporary files
*.tmp
*.temp
.cache/

# Misc
*.map
coverage/
.nyc_output/
```

---

## 2️⃣ `README.md`

```markdown
# 💈 BarberFlow Pro

> منصة حجز الصالونات الأولى في المغرب - ربط الزبائن بأفضل صالونات الحلاقة والتجميل.

![BarberFlow](https://img.shields.io/badge/BarberFlow-Pro-d4af37?style=for-the-badge&logo=barber&logoColor=white)
![Status](https://img.shields.io/badge/Status-In_Development-yellow?style=for-the-badge)
![License](https://img.shields.io/badge/License-All_Rights_Reserved-red?style=for-the-badge)

## 📖 نظرة عامة

BarberFlow Pro هي منصة متكاملة تربط بين:
- 💇 **الزبائن** الذين يبحثون عن صالونات حلاقة متميزة
- 💈 **أصحاب الصالونات** الذين يريدون إدارة مواعيدهم باحترافية
-  **المتاجر** التي تبيع منتجات العناية بالشعر واللحية

## 🚀 المميزات الرئيسية

### للزبائن
- ✅ البحث عن الصالونات القريبة
- ✅ حجز المواعيد أونلاين
- ✅ تقييم الصالونات والحلاقين
- ✅ متجر منتجات العناية

### لأصحاب الصالونات
- ✅ لوحة تحكم متكاملة
- ✅ إدارة المواعيد والحجوزات
- ✅ إحصائيات وتقارير
- ✅ إدارة الخدمات والأسعار

### للمتاجر
- ✅ عرض المنتجات
- ✅ سلة تسوق متكاملة
- ✅ إدارة الطلبات

## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| **HTML5** | هيكل الصفحات |
| **CSS3** | التنسيقات والثيمات |
| **JavaScript (ES6+)** | المنطق التفاعلي |
| **Firebase Auth** | المصادقة والأمان |
| **Firebase Firestore** | قاعدة البيانات |
| **Firebase Storage** | تخزين الصور |
| **GitHub Pages** | الاستضافة |

## 📁 هيكلية المشروع

```
barberflow-pro/
├──  assets/          # الأيقونات والصور والأصوات
├── 📁 core/            # إعدادات Firebase
├──  shared/          # الملفات المشتركة (CSS, JS)
├── 📁 middleware/      # الحماية والفلترة
├── 📁 auth/            # صفحات المصادقة
├── 📁 profile/         # البروفايلات
├──  dashboard/       # لوحة التحكم
├── 📁 onboarding/      # الترحيب والإعداد
├── 📄 index.html       # الصفحة الرئيسية
├── 📄 salons.html      # دليل الصالونات
├──  booking.html     # صفحة الحجز
├── 📄 shop.html        # المتجر
├── 📄 pro.html         # الباقات المميزة
├── 📄 about.html       # من نحن
├──  contact.html     # اتصل بنا
└── 📄 survey.html      # استطلاع الرأي
```

## 🎯 خارطة الطريق

### المرحلة 1: الأساسيات ✅
- [x] إعداد Firebase
- [x] نظام المصادقة
- [x] الهيكلية الأساسية

### المرحلة 2: الصفحات الرئيسية 🔄
- [ ] الصفحة الرئيسية
- [ ] دليل الصالونات
- [ ] صفحة الحجز

### المرحلة 3: المتجر 
- [ ] عرض المنتجات
- [ ] سلة التسوق
- [ ] نظام الطلبات

### المرحلة 4: لوحة التحكم 
- [ ] إدارة الحجوزات
- [ ] الإحصائيات
- [ ] الإعدادات

## 🚦 البدء السريع

### المتطلبات
- متصفح حديث (Chrome, Firefox, Safari, Edge)
- اتصال بالإنترنت
- حساب Firebase (للمطورين)

### التشغيل محلياً

```bash
# 1. استنساخ المشروع
git clone https://github.com/username/barberflow-pro.git

# 2. الانتقال إلى مجلد المشروع
cd barberflow-pro

# 3. فتح index.html في المتصفح
# أو استخدام Live Server في VS Code
```

## 📝 التوثيق

لمزيد من التفاصيل، راجع ملف `livre.md`

## 👨‍💻 المطور

**BarberFlow Pro Team**

## 📄 الرخصة

جميع الحقوق محفوظة © 2026 BarberFlow Pro

---

<p align="center">
  صُنع بـ ❤️ في المغرب 🇲🇦
</p>
```

---

## 3️⃣ `.htaccess`

```apache
# ============================================
# BarberFlow Pro - Apache Configuration
# ============================================

# ============================================
# إعدادات الأمان
# ============================================

# منع عرض هيكل المجلدات
Options -Indexes

# حماية ملفات الحساسة
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

# ============================================
# إعدادات الأداء والضغط
# ============================================

# تفعيل ضغط Gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# ============================================
# إعدادات التخزين المؤقت (Cache)
# ============================================

<IfModule mod_expires.c>
    ExpiresActive On
    
    # الصور
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    
    # CSS و JavaScript
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    
    # الخطوط
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
    
    # HTML
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# ============================================
# إعدادات CORS
# ============================================

<IfModule mod_headers.c>
    # السماح بـ CORS للموارد
    Header set Access-Control-Allow-Origin "*"
    
    # أمان إضافي
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# ============================================
# إعادة كتابة الروابط (URL Rewriting)
# ============================================

<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # إعادة توجيه HTTP إلى HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # إزالة www من الرابط
    RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
    RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
</IfModule>

# ============================================
# صفحات الخطأ المخصصة
# ============================================

ErrorDocument 404 /404.html
ErrorDocument 403 /404.html
ErrorDocument 500 /404.html

# ============================================
# إعدادات MIME
# ============================================

<IfModule mod_mime.c>
    AddType application/javascript js
    AddType text/css css
    AddType image/svg+xml svg svgz
    AddEncoding gzip svgz
    AddType application/manifest+json webmanifest
</IfModule>
```

---

## 4️⃣ `sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

    <!-- الصفحة الرئيسية -->
    <url>
        <loc>https://barberflow.com/</loc>
        <lastmod>2026-07-03</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>

    <!-- دليل الصالونات -->
    <url>
        <loc>https://barberflow.com/salons.html</loc>
        <lastmod>2026-07-03</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- صفحة الحجز -->
    <url>
        <loc>https://barberflow.com/booking.html</loc>
        <lastmod>2026-07-03</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>

    <!-- المتجر -->
    <url>
        <loc>https://barberflow.com/shop.html</loc>
        <lastmod>2026-07-03</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>

    <!-- الباقات المميزة -->
    <url>
        <loc>https://barberflow.com/pro.html</loc>
        <lastmod>2026-07-03</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>

    <!-- من نحن -->
    <url>
        <loc>https://barberflow.com/about.html</loc>
        <lastmod>2026-07-03</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>

    <!-- اتصل بنا -->
    <url>
        <loc>https://barberflow.com/contact.html</loc>
        <lastmod>2026-07-03</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>

    <!-- استطلاع الرأي -->
    <url>
        <loc>https://barberflow.com/survey.html</loc>
        <lastmod>2026-07-03</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>

    <!-- تسجيل الدخول -->
    <url>
        <loc>https://barberflow.com/auth/login.html</loc>
        <lastmod>2026-07-03</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.4</priority>
    </url>

    <!-- إنشاء حساب -->
    <url>
        <loc>https://barberflow.com/auth/register.html</loc>
        <lastmod>2026-07-03</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.4</priority>
    </url>

</urlset>
```

---

## 5️⃣ `robots.txt`

```txt
# ============================================
# BarberFlow Pro - Robots.txt
# ============================================

# السماح لجميع محركات البحث
User-agent: *
Allow: /

# منع فهرسة صفحات المصادقة والإعدادات
Disallow: /auth/
Disallow: /onboarding/
Disallow: /dashboard/
Disallow: /profile/
Disallow: /shared/
Disallow: /middleware/
Disallow: /core/

# منع فهرسة الملفات الحساسة
Disallow: /.git/
Disallow: /.htaccess
Disallow: /firebase-config.js

# السماح بفهرسة الصفحات العامة
Allow: /index.html
Allow: /salons.html
Allow: /booking.html
Allow: /shop.html
Allow: /product.html
Allow: /pro.html
Allow: /about.html
Allow: /contact.html
Allow: /survey.html

# قواعد خاصة بـ Google
User-agent: Googlebot
Allow: /
Disallow: /auth/
Disallow: /dashboard/

# قواعد خاصة بـ Bing
User-agent: Bingbot
Allow: /
Disallow: /auth/
Disallow: /dashboard/

# موقع خريطة الموقع
Sitemap: https://barberflow.com/sitemap.xml

# معلومات الاتصال
# Email: contact@barberflow.com
```

---

## 6️ `manifest.json`

```json
{
    "name": "BarberFlow Pro - منصة حجز الصالونات",
    "short_name": "BarberFlow",
    "description": "احجز موعدك في أفضل صالونات الحلاقة والتجميل بالمغرب بسهولة وسرعة",
    "start_url": "/index.html",
    "display": "standalone",
    "background_color": "#1a1a1a",
    "theme_color": "#d4af37",
    "orientation": "portrait-primary",
    "scope": "/",
    "lang": "ar",
    "dir": "rtl",
    
    "icons": [
        {
            "src": "assets/icons/icon-72x72.png",
            "sizes": "72x72",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "assets/icons/icon-96x96.png",
            "sizes": "96x96",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "assets/icons/icon-128x128.png",
            "sizes": "128x128",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "assets/icons/icon-144x144.png",
            "sizes": "144x144",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "assets/icons/icon-152x152.png",
            "sizes": "152x152",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "assets/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "assets/icons/icon-384x384.png",
            "sizes": "384x384",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "assets/icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        }
    ],
    
    "categories": [
        "lifestyle",
        "business",
        "shopping"
    ],
    
    "screenshots": [
        {
            "src": "assets/images/screenshot-home.png",
            "sizes": "1280x720",
            "type": "image/png"
        },
        {
            "src": "assets/images/screenshot-salons.png",
            "sizes": "1280x720",
            "type": "image/png"
        }
    ],
    
    "related_applications": [],
    "prefer_related_applications": false
}
```

---

## ✅ ملخص الملفات الجديدة

| الملف | الدور | الحالة |
|-------|-------|--------|
| `.gitignore` | تجاهل الملفات غير الضرورية في Git | ✅ جاهز |
| `README.md` | توثيق المشروع | ✅ جاهز |
| `.htaccess` | إعدادات الخادم والأمان | ✅ جاهز |
| `sitemap.xml` | خريطة الموقع لـ SEO | ✅ جاهز |
| `robots.txt` | توجيه محركات البحث | ✅ جاهز |
| `manifest.json` | إعدادات PWA | ✅ جاهز |

---

**جميع الملفات جاهزة للنسخ والاستخدام! **

