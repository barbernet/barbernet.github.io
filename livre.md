القواعد الصارمة لتحديث الملفات  
   
   
1 استدعاء الملفات المشتركة وملفات   الحمايةوالاعتماد عليها  بدل تكرار هذه الاكواد داخل كل ملف
 الملفات المشتركة(sharedمجلد)


1.1الملفات المشتركة (مجلد shared)

    * shared/components/
الدور تستخدم لإنشاء وعرض البطاقات في صفحات العرض التالية: 

index.html: لإنشاء و عرض بطاقات الصلونات والخدمات المنزلية والمنتجات والمتاجر والعروض والهدايا

salon.html  لإنشاء و عرض الصلونات و الخدمات  المنزلية

shop.html لإنشاء و عرض المتاجر والمنتجات


    - shared/components/card-concierge.js
  مكون بطاقة الكونسيرج (الخدمات المنزلية)
المسار: shared/components/card-concierge.js
  الدور: إنشاء وعرض بطاقات الخدمات المنزلية الفاخرة

    - shared/components/card-salon.js
 مكون بطاقة الصالون
المسار: shared/components/card-salon.js
الدور: إنشاء وعرض بطاقات الصالونات بشكل احترافي

    - shared/components/card-ofre.js
مكون بطاقة العرض
المسار: shared/components/card-offer.js
الدور: إنشاء وعرض بطاقات العروض والخصومات

    - shared/components/card-store.js
    
 مكون بطاقة المنتج/المتجر
المسار: shared/components/card-store.js
الدور: إنشاء وعرض بطاقات المنتجات بشكل احترافي


    * shared/layout/ 
 يحتوي على
 الشريط العلوي للصفحات نقوم باستدعاء ملفاته عندما نريد وضع شريط علوي لصفحة معينة وهو يحتوي على 

    - shared/layout/global-navbar.js
شريط التنقل العام 
المسار: shared/layout/global-navbar.js يوضع في الصفحات العامة
shared/layout/global-navbar.html
شريط التنقل العلوي (Header Navbar)
(نضع له مكان في هيكلة الصفحة ليتمكن html الخاص به بتنفيذه)

    - shared/styles/
 للتنسيقات العامة والمشتركة يحتوي على

    - shared/styles/global.css
المتغيرات العامة للألوان والثيمات (CSS Variables) 
يتحكم في تغيير الثيمات و وشكل وحجم#  العناصر والمكونات لتناسب جميع احجام الشاشات (لذلك يجب جعل كل ملفات التنسيقات الفرعية الاخرى مناسبة معه)

    - shared/style/global-navbar.css
شريط التنقل - Navbar
المسار: shared/style/global-navbar.css
يستدعى في صفحات html العامة الذي تسدعي شريط التنقل global-navbar.js

    - shared/style/card.css
 تنسيقات مكونات البطاقات يستدعى في الملفات الخاصة بعرض البطاقات

    - share/styles/page-protection.css
BarberFlow Pro - نظام حماية الصفحات وإخفاء الومضة
المسار: shared/styles/page-protection.css
الدور: منع ظهور المحتوى قبل التحقق من الصلاحيات
يستدعى في جميع الصفحات المحمية 


    * shared/utils/
 يحتوي على ملفات js المستركة


    - shared/utils/analytics.js
  تحليلات سلوك المستخدم
 المسار: shared/utils/analytics.js
  تتبع سلوك المستخدم لفهم المحتوى الأكثر شعبية
  وتحسين تجربة الاستخدام

    - shared/utils/debounce.js
  حماية من النقرات المتكررة
  المسار: shared/utils/debounce.js
 
 منع تنفيذ الدالة أكثر من مرة خلال فترة زمنية محددة
 مفيد لأزرار البحث والإدخال المتكرر
   
   
   - shared/utils/images-utils.js
    
 أداة معالجة الصور 
المسار: shared/utils/images-utils.js
ملاحظة: هذا حل مؤقت لتخزين الصور كـ Base64
حتى يتم تفعيل Firebase Storage (يحتاج خطة مدفوعة)

   - shared/utils/index.js
وحدة الأدوات المشتركة 
المسار: shared/utils/index.js
  تصدير جميع الأدوات في مكان واحد

  - shared/utils/notification.js
  نظام التنبيهات الموحد لـ 
المسار: shared/utils/notifications.js

   - shared/utils/paths.js
 
مركزية جميع مسارات مشروع
⚠️ جميع المسارات مطلقة (تبدأ بـ /)
يتم تحويلها إلى نسبية ديناميكياً بواسطة resolvePath() 
يتم استدعاءه في جميع الصفحات واعتماده (اجباريا) في الانتقال بين الصفحات 

   - shared/utils/user-preferences.js
 تفضيلات المستخدم
 المسار: shared/utils/user-preferences.js
 يخزن تفضيلات المستخدم محلياً لتحسين تجربة الاستخدام



1.2 ملفات الحماية (مجلد middleware)

   - middleware/index.js
 نقطة التصدير المركزية لجميع دوال الـ Middleware


   * middleware/auth/
   
   - middleware/auth/auth-state.js

إدارة حالة المستخدم الحالية
الدور: جلب بيانات المستخدم من Firebase Auth + Firestore
