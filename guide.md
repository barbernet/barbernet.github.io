دليل المطور الشامل: BarberFlow Pro
هذا الملف هو المرجع الأساسي والقواعد الصارمة لتحديث أو إنشاء أي ملف في مشروع BarberFlow Pro.
1. تعريف المنصة
BarberFlow Pro منصة رقمية متكاملة لقطاع الحلاقة والتجميل، تربط بين:
الصالونات: إدارة المواعيد، الموظفين، الفروع، الخدمات، والمخزون.
أنواع الصالونات المدعومة:
صالون حلاقة رجالي (Barbershop): قص، حلاقة ذقن، تصفيف رجالي.
صالون تجميل نسائي (Beauty Salon): قص، صبغات، مكياج، علاجات.
صالون مختلط (Unisex): خدمات للرجال والنساء.
صالون سبا وعناية (Spa & Wellness): مساج، ساونا، علاجات استرخاء.
صالون مساج (Massage Salon): مساج علاجي ورياضي.
صالون أظافر (Nail Salon): مانيكير، باديكير، أظافر صناعية.
صالون صبغات وتلوين (Color Studio): صبغات، هايلايت، بالياج.
صالون علاج الشعر (Hair Treatment): كيراتين، بوتكس، علاجات.
صالون مكياج (Makeup Studio): مكياج يومي، مناسبات، سينمائي.
صالون عرائس (Bridal Salon): باقات عرائس كاملة.
صالون حلاقة أطفال (Kids Salon): خدمات مخصصة للأطفال.
صالون متنقل/منزلي (Mobile Service): خدمات في المنزل أو الفندق.
المتاجر: بيع منتجات العناية والحلاقة وإدارة الطلبات.
أنواع المتاجر المدعومة:
متجر منتجات العناية بالشعر: شامبو، بلسم، زيوت، علاجات.
متجر منتجات العناية بالبشرة: كريمات، سيروم، واقي شمس.
متجر أدوات الحلاقة: ماكينات، شفرات، فرش، مرايا.
متجر أدوات التجميل: فراشي، إسفنج، أدوات مكياج.
متجر العطور: عطور رجالية، نسائية، مشتركة.
متجر منتجات الأظافر: طلاء، أدوات، أظافر صناعية.
متجر منتجات الصالونات الاحترافية: منتجات للاستخدام المهني.
متجر منتجات العناية بالجسم: غسول، لوشن، مقشرات.
متجر المكياج: أحمر شفاه، ظلال، أساس، كونسيلر.
متجر المنتجات الطبيعية/العضوية: منتجات خالية من الكيمياويات.
المتاجر يمكنها أيضاً: إدارة فروعها، موظفيها، المخزون، والطلبات.
الزبائن: حجز المواعيد، شراء المنتجات، وتقييم الخدمات.
2. القواعد الإلزامية
أ. توحيد التنسيقات (CSS)
جميع ملفات CSS تعتمد على متغيرات `shared/styles/global.css`.
الثيم الفاتح (Light) هو الافتراضي.
الثيم الداكن يُفعّل عبر `data-theme="dark"` على `<html>`.
ب. الملفات المشتركة
يُمنع إعادة كتابة الأكواد المشتركة داخل الصفحات الفردية.
استدعاء الملفات من `shared/` و `middleware/` عند الحاجة فقط.
ج. قاعدة البيانات: Supabase حصراً
الاتصال عبر `config/supabase-init.js`.
لا يُسمح بأي مكتبات تابعة لـ Firebase.
أسماء المتغيرات في الكود يجب أن تطابق أسماء الحقول في Supabase تماماً.
د. تخزين الصور
استخدام Supabase Storage مباشرة (بدون base64).
جميع عمليات الرفع والحذف عبر `shared/utils/images-utils.js`.
هـ. شريط التنقل العام
جميع الصفحات تستدعي `<div id="global-navbar-container"></div>`.
استدعاء `shared/layout/global-navbar.js` لتحميل الشريط.
لا تكرر `padding-top` في CSS الفرعي - `global-navbar.css` يتكفل به.
و. حماية الصفحات (مهم جداً)
الصفحات المحمية (تستخدم `page-guard.js` + `page-protection.css`):
جميع صفحات `dashboard/`
جميع صفحات `admin/`
جميع صفحات `profile/`
جميع صفحات `onboarding/`
جميع صفحات `billing/` (checkout, subscription)
جميع صفحات `messages/`
جميع صفحات `orders/`
الصفحات العامة (تستخدم Skeleton Loading):
جميع صفحات الجذر (index, about, contact, privacy, terms, faq, survey, 404)
صفحات التفاصيل (details-salon, details-store, product)
صفحات التصفح (salons, shop, pro, booking)
صفحات المدونة (blog, article)
نمط Skeleton Loading للصفحات العامة:
<div id="loadingState" class="loading-state">
    <div class="loading-spinner">
        <i class="fas fa-cut"></i>
    </div>
    <p>جاري تحميل البيانات...</p>
</div>
<main id="mainContent" style="display: none;">
    <!-- محتوى الصفحة -->
</main>
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
ز. قرار معماري: منع تجاوز المنصة
لا تعرض معلومات التواصل المباشرة (هاتف، واتساب، إيميل) للمتاجر/الصالونات في الصفحات العامة.
استخدم زر "تواصل عبر المنصة" يفتح نموذج رسالة داخلي.
المتجر/الصالون يرد عبر لوحة التحكم الخاصة به.
3. مرجع قاعدة البيانات (Supabase Schema)
3.1 جدول `profiles`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|= user.uid من المصادقة|
| full_name|TEXT|الاسم الكامل|
| role|ENUM|'customer', 'salon', 'store', 'admin'|
| phone|TEXT|رقم الهاتف (فريد)|
| email|TEXT|البريد الإلكتروني (فريد)|
| email_verified_at|TIMESTAMPTZ|تاريخ تأكيد البريد|
| avatar_url|TEXT|رابط الصورة|
| onboarding_status|ENUM|'empty', 'incomplete', 'completed'|
| language|TEXT|اللغة الافتراضية ('ar', 'en', 'fr')|
| timezone|TEXT|المنطقة الزمنية ('Africa/Casablanca')|
| last_login_at|TIMESTAMPTZ|آخر تسجيل دخول|
| is_banned|BOOLEAN|محظور؟|
| ban_reason|TEXT|سبب الحظر|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.2 جدول `business_categories`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الفئة|
| name|TEXT|اسم الفئة|
| type|ENUM|'salon', 'store'|
| slug|TEXT|الاسم المختصر ('barbershop', 'beauty-salon', 'hair-care')|
| icon|TEXT|أيقونة الفئة|
| description|TEXT|الوصف|
| is_active|BOOLEAN|مفعّلة؟|
| sort_order|INT|ترتيب العرض|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.3 جدول `businesses`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف النشاط|
| owner_id|UUID|يرتبط بـ profiles.id|
| category_id|UUID|يرتبط بـ business_categories.id|
| name|TEXT|الاسم|
| type|ENUM|'salon' أو 'store'|
| description|TEXT|الوصف|
| city|TEXT|المدينة|
| address|TEXT|العنوان|
| phone|TEXT|الهاتف|
| email|TEXT|البريد|
| website|TEXT|الموقع الإلكتروني|
| social_media|JSONB|{"instagram":"...", "tiktok":"...", "facebook":"..."}|
| logo_url|TEXT|الشعار|
| cover_url|TEXT|صورة الغلاف|
| working_hours|JSONB|{"open":"09:00", "close":"21:00", "days":["sun","mon"]}|
| status|ENUM|'inactive', 'active', 'suspended'|
| is_verified|BOOLEAN|موثق؟|
| verified_at|TIMESTAMPTZ|تاريخ التوثيق|
| verified_by|UUID|المشرف الذي وثّق|
| tax_number|TEXT|الرقم الضريبي|
| commission_rate|DECIMAL|نسبة عمولة المنصة (0-100)|
| rating|DECIMAL|متوسط التقييم (0-5)|
| reviews_count|INT|عدد التقييمات|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
| deleted_at|TIMESTAMPTZ|تاريخ الحذف (Soft Delete)|
3.4 جدول `branches`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الفرع|
| business_id|UUID|يرتبط بـ businesses.id|
| name|TEXT|اسم الفرع|
| address|TEXT|العنوان|
| phone|TEXT|الهاتف|
| working_hours|JSONB|{"open":"09:00", "close":"21:00", "days":["sun","mon"]}|
| is_main|BOOLEAN|الفرع الرئيسي؟|
| latitude|DECIMAL|خط العرض|
| longitude|DECIMAL|خط الطول|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
| deleted_at|TIMESTAMPTZ|تاريخ الحذف (Soft Delete)|
3.5 جدول `staff`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الموظف|
| business_id|UUID|يرتبط بـ businesses.id|
| profile_id|UUID|يرتبط بـ profiles.id (اختياري)|
| full_name|TEXT|الاسم الكامل|
| role|TEXT|'owner', 'manager', 'barber', 'stylist', 'cashier'|
| specialties|TEXT[]|التخصصات (قص، صبغة، حلاقة...)|
| commission_rate|DECIMAL|نسبة العمولة (0-100)|
| avatar_url|TEXT|الصورة الشخصية|
| phone|TEXT|رقم الهاتف|
| is_available|BOOLEAN|متاح للحجز؟|
| rating|DECIMAL|متوسط التقييم (0-5)|
| reviews_count|INT|عدد التقييمات|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
| deleted_at|TIMESTAMPTZ|تاريخ الحذف (Soft Delete)|
3.6 جدول `staff_services`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الربط|
| staff_id|UUID|يرتبط بـ staff.id|
| service_id|UUID|يرتبط بـ services.id|
| is_primary|BOOLEAN|خدمة أساسية؟|
| custom_price|DECIMAL|سعر مخصص (NULL = سعر الخدمة الأصلي)|
| sort_order|INT|ترتيب العرض|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
قيد فريد: `UNIQUE(staff_id, service_id)`
3.7 جدول `categories`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الفئة|
| name|TEXT|اسم الفئة|
| type|ENUM|'product', 'service'|
| parent_id|UUID|الفئة الأب (NULL = فئة رئيسية)|
| icon|TEXT|أيقونة الفئة|
| description|TEXT|الوصف|
| is_active|BOOLEAN|مفعلة؟|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.8 جدول `products`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف المنتج|
| seller_id|UUID|المتجر (يرتبط بـ businesses)|
| salon_store_id|UUID|متجر الصالون (اختياري)|
| category_id|UUID|يرتبط بـ categories.id|
| name|TEXT|الاسم|
| description|TEXT|الوصف|
| sku|TEXT|رمز المنتج (فريد)|
| barcode|TEXT|الباركود|
| price|DECIMAL|السعر الحالي|
| old_price|DECIMAL|السعر قبل الخصم (NULL إذا لا خصم)|
| cost_price|DECIMAL|سعر التكلفة|
| stock_quantity|INT|المخزون|
| min_stock_alert|INT|تنبيه عند وصول المخزون لهذا الحد|
| weight|DECIMAL|الوزن بالكيلوغرام (للشحن)|
| image_url|TEXT|الصورة|
| images_urls|TEXT[]|صور إضافية|
| is_available|BOOLEAN|متاح؟|
| is_new|BOOLEAN|جديد؟|
| is_featured|BOOLEAN|منتج مميز؟|
| views_count|INT|عدد المشاهدات|
| sales_count|INT|عدد المبيعات|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
| deleted_at|TIMESTAMPTZ|تاريخ الحذف (Soft Delete)|
ملاحظة مهمة: لا يوجد حقل `rating` في جدول products. يجب جلب التقييم من جدول `reviews` عبر `product_id`.
3.9 جدول `product_variants`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف المتغير|
| product_id|UUID|يرتبط بـ products.id|
| name|TEXT|اسم المتغير ("حجم كبير", "لون أسود")|
| sku|TEXT|رمز المتغير (فريد)|
| price|DECIMAL|السعر (NULL = سعر المنتج الأصلي)|
| stock_quantity|INT|المخزون الخاص بالمتغير|
| attributes|JSONB|{"size": "XL", "color": "black"}|
| image_url|TEXT|صورة المتغير|
| is_available|BOOLEAN|متاح؟|
| sort_order|INT|ترتيب العرض|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.10 جدول `services`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الخدمة|
| business_id|UUID|الصالون (type='salon')|
| branch_id|UUID|الفرع (NULL = جميع الفروع)|
| category_id|UUID|يرتبط بـ categories.id|
| name|TEXT|الاسم|
| description|TEXT|الوصف|
| price|DECIMAL|السعر|
| duration_min|INT|المدة بالدقائق|
| is_available|BOOLEAN|متاحة؟|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
| deleted_at|TIMESTAMPTZ|تاريخ الحذف (Soft Delete)|
3.11 جدول `service_addons`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الإضافة|
| service_id|UUID|يرتبط بـ services.id|
| name|TEXT|اسم الإضافة|
| description|TEXT|الوصف|
| price|DECIMAL|السعر الإضافي|
| duration_min|INT|المدة الإضافية بالدقائق|
| is_required|BOOLEAN|إجبارية؟|
| is_active|BOOLEAN|مفعّلة؟|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.12 جدول `reviews`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف التقييم|
| reviewer_id|UUID|صاحب التقييم|
| business_id|UUID|الصالون/المتجر المُقيَّم|
| product_id|UUID|المنتج المُقيَّم (اختياري)|
| booking_id|UUID|الحجز المُقيَّم (اختياري)|
| order_id|UUID|الطلب المُقيَّم (اختياري)|
| staff_id|UUID|الموظف المُقيَّم (اختياري)|
| rating|INT|التقييم (1-5)|
| comment|TEXT|نص التقييم|
| images_urls|TEXT[]|صور مع التقييم|
| is_verified_purchase|BOOLEAN|عملية شراء/حجز موثقة؟|
| rating_breakdown|JSONB|{"cleanliness":5, "service":4, "value":5}|
| helpful_count|INT|عدد الإعجابات|
| reply|TEXT|رد المالك|
| replied_at|TIMESTAMPTZ|تاريخ الرد|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
جلب تقييم المنتج:
const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);
const rating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
const count = data.length;
3.13 جدول `favorites`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف المفضلة|
| user_id|UUID|المستخدم|
| item_id|UUID|العنصر (صالون/منتج/متجر)|
| item_type|TEXT|'salon', 'product', 'store', 'service'|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
قيد فريد: `UNIQUE(user_id, item_id, item_type)`
3.14 جدول `bookings`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الحجز|
| customer_id|UUID|العميل|
| service_id|UUID|الخدمة|
| branch_id|UUID|الفرع|
| staff_id|UUID|الموظف|
| booking_date|DATE|التاريخ|
| start_time|TIME|وقت البدء|
| end_time|TIME|وقت الانتهاء|
| status|TEXT|'pending', 'confirmed', 'completed', 'cancelled'|
| payment_status|TEXT|'pending', 'paid', 'refunded'|
| payment_id|UUID|يرتبط بـ transactions.id|
| total_price|DECIMAL|السعر الإجمالي|
| notes|TEXT|ملاحظات|
| cancellation_reason|TEXT|سبب الإلغاء|
| cancelled_by|UUID|من ألغى (UUID)|
| cancelled_at|TIMESTAMPTZ|تاريخ الإلغاء|
| reminder_sent|BOOLEAN|تم إرسال تذكير؟|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.15 جدول `booking_addons`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الربط|
| booking_id|UUID|يرتبط بـ bookings.id|
| addon_id|UUID|يرتبط بـ service_addons.id|
| price|DECIMAL|السعر عند الحجز|
| quantity|INT|الكمية (افتراضي 1)|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
3.16 جدول `orders`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الطلب|
| customer_id|UUID|العميل|
| business_id|UUID|المتجر|
| status|TEXT|'pending', 'processing', 'shipped', 'delivered', 'cancelled'|
| subtotal|DECIMAL|المجموع الفرعي|
| shipping_cost|DECIMAL|تكلفة الشحن|
| discount_amount|DECIMAL|قيمة الخصم|
| coupon_id|UUID|يرتبط بـ coupons.id|
| total|DECIMAL|المجموع الكلي|
| shipping_address|JSONB|{"street":"", "city":"", "postal_code":"", "phone":""}|
| shipping_method_id|UUID|يرتبط بـ shipping_methods.id|
| tracking_number|TEXT|رقم التتبع|
| shipped_at|TIMESTAMPTZ|تاريخ الشحن|
| delivered_at|TIMESTAMPTZ|تاريخ التسليم|
| payment_status|TEXT|'pending', 'paid', 'failed', 'refunded'|
| payment_method|TEXT|'card', 'cash', 'wallet'|
| payment_id|UUID|يرتبط بـ transactions.id|
| notes|TEXT|ملاحظات|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.17 جدول `order_items`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف العنصر|
| order_id|UUID|يرتبط بـ orders.id|
| product_id|UUID|المنتج|
| variant_id|UUID|المتغير (اختياري)|
| quantity|INT|الكمية|
| price|DECIMAL|السعر عند الشراء|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
3.18 جدول `order_status_history`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف السجل|
| order_id|UUID|يرتبط بـ orders.id|
| old_status|TEXT|الحالة السابقة|
| new_status|TEXT|الحالة الجديدة|
| changed_by|UUID|يرتبط بـ profiles.id|
| notes|TEXT|ملاحظات|
| created_at|TIMESTAMPTZ|تاريخ التغيير|
3.19 جدول `transactions`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف المعاملة|
| user_id|UUID|المستخدم|
| type|TEXT|'payment', 'refund', 'withdrawal', 'commission', 'topup'|
| amount|DECIMAL|المبلغ|
| currency|TEXT|العملة (MAD, USD...)|
| status|TEXT|'pending', 'completed', 'failed'|
| payment_method|TEXT|'card', 'bank_transfer', 'wallet'|
| reference_id|TEXT|رقم المرجع (من بوابة الدفع)|
| description|TEXT|الوصف|
| metadata|JSONB|بيانات إضافية|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
3.20 جدول `wallets`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف المحفظة|
| user_id|UUID|يرتبط بـ profiles.id|
| balance|DECIMAL|الرصيد الحالي|
| frozen_balance|DECIMAL|الرصيد المجمد (قيد المعالجة)|
| currency|TEXT|العملة (MAD)|
| last_transaction_at|TIMESTAMPTZ|آخر معاملة|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
قيد فريد: `UNIQUE(user_id)`
3.21 جدول `refunds`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الاسترجاع|
| order_id|UUID|يرتبط بـ orders.id|
| transaction_id|UUID|يرتبط بـ transactions.id|
| user_id|UUID|المستخدم طالب الاسترجاع|
| amount|DECIMAL|المبلغ المسترجع|
| reason|TEXT|سبب الاسترجاع|
| status|TEXT|'pending', 'approved', 'rejected', 'processed'|
| processed_by|UUID|المشرف المعالج|
| processed_at|TIMESTAMPTZ|تاريخ المعالجة|
| admin_notes|TEXT|ملاحظات الإدارة|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.22 جدول `conversations`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف المحادثة|
| customer_id|UUID|العميل|
| business_id|UUID|النشاط التجاري|
| status|TEXT|'active', 'closed'|
| last_message_at|TIMESTAMPTZ|آخر رسالة|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.23 جدول `messages`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الرسالة|
| conversation_id|UUID|يرتبط بـ conversations.id|
| sender_id|UUID|المرسل|
| content|TEXT|محتوى الرسالة|
| is_read|BOOLEAN|مقروءة؟|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
3.24 جدول `notifications`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الإشعار|
| user_id|UUID|المستخدم|
| type|TEXT|'booking', 'order', 'message', 'review', 'system', 'wallet', 'promotion'|
| title|TEXT|العنوان|
| message|TEXT|الرسالة|
| data|JSONB|بيانات إضافية (روابط، معرفات...)|
| is_read|BOOLEAN|مقروء؟|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
3.25 جدول `offers`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف العرض|
| business_id|UUID|النشاط التجاري|
| type|TEXT|'percentage', 'fixed', 'buy_get'|
| title|TEXT|عنوان العرض|
| description|TEXT|الوصف|
| discount_value|DECIMAL|قيمة الخصم|
| code|TEXT|كود الخصم (اختياري)|
| start_date|TIMESTAMPTZ|تاريخ البداية|
| end_date|TIMESTAMPTZ|تاريخ النهاية|
| is_active|BOOLEAN|مفعّل؟|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.26 جدول `coupons`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الكوبون|
| business_id|UUID|النشاط التجاري (NULL = كوبون منصة)|
| code|TEXT|كود الكوبون (فريد)|
| discount_type|TEXT|'percentage', 'fixed', 'shipping'|
| discount_value|DECIMAL|قيمة الخصم|
| usage_limit|INT|الحد الأقصى للاستخدام العام|
| used_count|INT|عدد مرات الاستخدام|
| per_user_limit|INT|الحد لكل مستخدم|
| min_order_amount|DECIMAL|الحد الأدنى للطلب|
| max_discount|DECIMAL|الحد الأقصى للخصم (للنسبة المئوية)|
| applicable_items|JSONB|{"type":"products", "ids":["uuid1","uuid2"]}|
| start_date|TIMESTAMPTZ|تاريخ البداية|
| end_date|TIMESTAMPTZ|تاريخ النهاية|
| is_active|BOOLEAN|مفعّل؟|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
قيد فريد: `UNIQUE(code)`
3.27 جدول `subscriptions`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الاشتراك|
| user_id|UUID|المستخدم|
| plan_id|UUID|يرتبط بـ subscription_plans.id|
| status|TEXT|'active', 'expired', 'cancelled', 'past_due'|
| start_date|DATE|البداية|
| end_date|DATE|النهاية|
| billing_cycle|TEXT|'monthly', 'yearly'|
| auto_renew|BOOLEAN|تجديد تلقائي؟|
| features|JSONB|{"analytics":true, "max_branches":5}|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.28 جدول `subscription_plans`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الخطة|
| name|TEXT|اسم الخطة|
| slug|TEXT|الاسم المختصر ('starter', 'professional', 'enterprise')|
| description|TEXT|الوصف|
| price_monthly|DECIMAL|السعر الشهري|
| price_yearly|DECIMAL|السعر السنوي|
| features|JSONB|{"max_branches":5, "max_staff":10, "analytics":true}|
| max_branches|INT|الحد الأقصى للفروع|
| max_staff|INT|الحد الأقصى للموظفين|
| max_products|INT|الحد الأقصى للمنتجات|
| commission_rate|DECIMAL|نسبة العمولة|
| is_active|BOOLEAN|مفعّلة؟|
| is_popular|BOOLEAN|خطة شائعة؟|
| sort_order|INT|ترتيب العرض|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.29 جدول `shipping_methods`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف طريقة الشحن|
| business_id|UUID|النشاط التجاري (NULL = طريقة عامة)|
| name|TEXT|الاسم (توصيل سريع، عادي...)|
| description|TEXT|الوصف|
| base_cost|DECIMAL|التكلفة الأساسية|
| cost_per_kg|DECIMAL|التكلفة لكل كيلوغرام|
| estimated_days_min|INT|الحد الأدنى لأيام التوصيل|
| estimated_days_max|INT|الحد الأقصى لأيام التوصيل|
| is_active|BOOLEAN|مفعّلة؟|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.30 جدول `inventory_movements`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الحركة|
| product_id|UUID|يرتبط بـ products.id|
| type|TEXT|'in', 'out', 'adjustment', 'return', 'damage'|
| quantity|INT|الكمية (موجبة للإدخال، سالبة للإخراج)|
| reference_id|UUID|معرف المرجع (order_id, booking_id)|
| reference_type|TEXT|'order', 'adjustment', 'return'|
| notes|TEXT|ملاحظات|
| created_by|UUID|المستخدم المنفذ|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
3.31 جدول `holidays`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف العطلة|
| business_id|UUID|النشاط التجاري|
| branch_id|UUID|الفرع (NULL = جميع الفروع)|
| title|TEXT|العنوان|
| date|DATE|التاريخ|
| is_recurring|BOOLEAN|سنوية؟|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
3.32 جدول `loyalty_points`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف النقطة|
| user_id|UUID|يرتبط بـ profiles.id|
| points|INT|عدد النقاط (موجب للإضافة، سالب للاستخدام)|
| type|TEXT|'earned', 'redeemed', 'expired', 'bonus'|
| reference_id|UUID|معرف المرجع (order_id)|
| description|TEXT|الوصف|
| balance_after|INT|الرصيد بعد العملية|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
3.33 جدول `referrals`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف الإحالة|
| referrer_id|UUID|المُحيل|
| referred_id|UUID|المُحال|
| code|TEXT|كود الإحالة|
| status|TEXT|'pending', 'completed', 'rewarded'|
| reward_points|INT|نقاط المكافأة|
| reward_amount|DECIMAL|مبلغ المكافأة|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| completed_at|TIMESTAMPTZ|تاريخ الإكمال|
3.34 جدول `banners`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف البانر|
| title|TEXT|العنوان|
| description|TEXT|الوصف|
| image_url|TEXT|الصورة|
| link_url|TEXT|الرابط|
| position|TEXT|'home_top', 'home_middle', 'salons', 'shop'|
| target_type|TEXT|'salon', 'product', 'store', 'external'|
| target_id|UUID|معرف الهدف (اختياري)|
| start_date|TIMESTAMPTZ|تاريخ البداية|
| end_date|TIMESTAMPTZ|تاريخ النهاية|
| is_active|BOOLEAN|مفعّل؟|
| sort_order|INT|ترتيب العرض|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.35 جدول `verifications`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف التوثيق|
| business_id|UUID|يرتبط بـ businesses.id|
| user_id|UUID|يرتبط بـ profiles.id|
| status|TEXT|'pending', 'under_review', 'approved', 'rejected'|
| id_card_front_url|TEXT|وجه بطاقة التعريف|
| id_card_back_url|TEXT|ظهر بطاقة التعريف|
| bank_name|TEXT|اسم البنك|
| account_holder|TEXT|اسم صاحب الحساب|
| rib|TEXT|رمز RIB (24 رقم)|
| ownership_doc_url|TEXT|وثيقة الملكية/الإيجار (للصالون)|
| ownership_type|TEXT|'ownership', 'rental', 'agency'|
| business_doc_url|TEXT|الوثيقة التجارية (للمتجر)|
| business_doc_type|TEXT|'commercial_register', 'trade_license', 'tax_id'|
| location_doc_url|TEXT|وثيقة مكان المتجر|
| location_doc_type|TEXT|'ownership', 'rental', 'agency'|
| terms_accepted|BOOLEAN|الموافقة على الشروط|
| refund_policy_accepted|BOOLEAN|الموافقة على سياسة الإرجاع|
| privacy_accepted|BOOLEAN|الموافقة على سياسة الخصوصية|
| submitted_at|TIMESTAMPTZ|تاريخ الإرسال|
| reviewed_at|TIMESTAMPTZ|تاريخ المراجعة|
| rejection_reason|TEXT|سبب الرفض|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
قيد فريد: `UNIQUE(business_id)`
3.36 جدول `reports`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف البلاغ|
| reporter_id|UUID|المُبلِغ (يرتبط بـ profiles.id)|
| reported_user_id|UUID|المستخدم المُبلَغ عنه|
| reported_business_id|UUID|النشاط المُبلَغ عنه|
| report_type|TEXT|'fraud', 'spam', 'inappropriate', 'other'|
| description|TEXT|وصف البلاغ|
| evidence_urls|TEXT[]|روابط الأدلة (صور)|
| status|TEXT|'pending', 'investigating', 'resolved', 'dismissed'|
| admin_notes|TEXT|ملاحظات الإدارة|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
| updated_at|TIMESTAMPTZ|تاريخ التحديث|
3.37 جدول `audit_logs`
| الحقل|النوع|الوصف|
| ---|---|---|
| id|UUID|معرف السجل|
| user_id|UUID|المستخدم (NULL = نظام)|
| action|TEXT|'create', 'update', 'delete', 'login', 'logout', 'refund', 'ban'|
| entity_type|TEXT|نوع الكيان (user, business, product...)|
| entity_id|UUID|معرف الكيان|
| changes|JSONB|التغييرات {"before":{}, "after":{}}|
| ip_address|TEXT|عنوان IP|
| user_agent|TEXT|متصفح المستخدم|
| created_at|TIMESTAMPTZ|تاريخ الإنشاء|
4. هيكلية الملفات
barberflow/
  ├── config/
  │   └── supabase-init.js
  ├── auth/
  │   ├── login.html/.css/.js
  │   ├── register.html/.css/.js
  │   ├── forgot-password.html/.css/.js
  │   ├── reset-password.html/.css/.js
  │   ├── verify-email.html/.css/.js
  │   └── welcome.html/.css/.js
  ├── admin/
  │   ├── index.html/.css/.js
  │   ├── businesses/
  │   │   ├── index.html/.css/.js
  │   │   └── details.html/.css/.js
  │   ├── users/
  │   │   ├── index.html/.css/.js
  │   │   └── details.html/.css/.js
  │   ├── verifications/
  │   │   ├── index.html/.css/.js
  │   │   └── review.html/.css/.js
  │   ├── reports/
  │   │   ├── index.html/.css/.js
  │   │   └── details.html/.css/.js
  │   ├── transactions/
  │   │   └── index.html/.css/.js
  │   ├── refunds/
  │   │   ├── index.html/.css/.js
  │   │   └── details.html/.css/.js
  │   ├── coupons/
  │   │   ├── index.html/.css/.js
  │   │   └── add.html/.css/.js
  │   ├── banners/
  │   │   ├── index.html/.css/.js
  │   │   └── add.html/.css/.js
  │   ├── subscription-plans/
  │   │   ├── index.html/.css/.js
  │   │   └── edit.html/.css/.js
  │   ├── business-categories/
  │   │   ├── index.html/.css/.js
  │   │   └── add.html/.css/.js
  │   ├── analytics/
  │   │   └── index.html/.css/.js
  │   └── settings/
  │       └── index.html/.css/.js
  ├── billing/
  │   ├── checkout.html/.css/.js
  │   ├── payment-success.html/.css/.js
  │   ├── payment-cancel.html/.css/.js
  │   ├── subscription.html/.css/.js
  │   └── wallet.html/.css/.js
  ├── dashboard/
  │   ├── index.html/.css/.js
  │   ├── analytics.html/.css/.js
  │   ├── appointments.html/.css/.js
  │   ├── notifications.html/.css/.js
  │   ├── reviews.html/.css/.js
  │   ├── customers/
  │   │   ├── index.html/.css/.js
  │   │   └── details.html/.css/.js
  │   ├── orders/
  │   │   ├── index.html/.css/.js
  │   │   └── details.html/.css/.js
  │   ├── products/
  │   │   ├── index.html/.css/.js
  │   │   ├── add.html/.css/.js
  │   │   └── edit.html/.css/.js
  │   ├── inventory/
  │   │   └── index.html/.css/.js
  │   ├── services/
  │   │   ├── index.html/.css/.js
  │   │   ├── add.html/.css/.js
  │   │   └── edit.html/.css/.js
  │   ├── staff/
  │   │   ├── index.html/.css/.js
  │   │   ├── add.html/.css/.js
  │   │   └── edit.html/.css/.js
  │   ├── branches/
  │   │   ├── index.html/.css/.js
  │   │   ├── add.html/.css/.js
  │   │   └── edit.html/.css/.js
  │   ├── coupons/
  │   │   ├── index.html/.css/.js
  │   │   └── add.html/.css/.js
  │   ├── wallet/
  │   │   └── index.html/.css/.js
  │   └── settings/
  │       └── index.html/.css/.js
  ├── messages/
  │   ├── inbox.html/.css/.js
  │   └── conversation.html/.css/.js
  ├── orders/
  │   ├── index.html/.css/.js
  │   ├── details.html/.css/.js
  │   └── track.html/.css/.js
  ├── middleware/
  │   ├── auth/
  │   │   └── auth-state.js
  │   ├── guards/
  │   │   ├── role-guard.js
  │   │   ├── booking-guard.js
  │   │   └── subscription-route-guard.js
  │   ├── routing/
  │   │   ├── page-guard.js
  │   │   ├── page-router.js
  │   │   └── profile-route.js
  │   ├── subscription/
  │   │   └── subscription-guard.js
  │   └── validation/
  │       ├── input-sanitizer.js
  │       └── images-sanitizer.js
  ├── onboarding/
  │   ├── add/
  │   │   ├── customer.html/.css/.js
  │   │   ├── salon.html/.css/.js
  │   │   └── store.html/.css/.js
  │   ├── setup/
  │   │   ├── customer.html/.css/.js
  │   │   ├── salon.html/.css/.js
  │   │   └── store.html/.css/.js
  │   └── verification/
  │       ├── salon.html/.css/.js
  │       └── store.html/.css/.js
  ├── profile/
  │   ├── customer.html/.css/.js
  │   ├── salon.html/.css/.js
  │   └── store.html/.css/.js
  ├── blog/
  │   ├── index.html/.css/.js
  │   └── article.html/.css/.js
  ├── public/
  │   ├── assets/
  │   │   ├── fonts/
  │   │   ├── icons/
  │   │   ├── images/
  │   │   └── videos/
  │   ├── manifest.json
  │   ├── robots.txt
  │   └── sitemap.xml
  ├── shared/
  │   ├── components/
  │   │   ├── card-salon.js
  │   │   ├── card-store.js
  │   │   ├── card-product.js
  │   │   ├── card-service.js
  │   │   ├── card-staff.js
  │   │   ├── card-review.js
  │   │   ├── card-booking.js
  │   │   ├── card-offer.js
  │   │   ├── card-coupon.js
  │   │   ├── card-concierge.js
  │   │   ├── card-order.js
  │   │   ├── card-message.js
  │   │   ├── card-notification.js
  │   │   └── card-banner.js
  │   ├── layout/
  │   │   ├── global-navbar.html
  │   │   ├── global-navbar.js
  │   │   └── global-footer.js
  │   ├── styles/
  │   │   ├── global.css
  │   │   ├── global-navbar.css
  │   │   ├── cards.css
  │   │   ├── notifications.css
  │   │   ├── page-protection.css
  │   │   └── loading.css
  │   └── utils/
  │       ├── analytics.js
  │       ├── cache.js
  │       ├── date-utils.js
  │       ├── debounce.js
  │       ├── error-handler.js
  │       ├── images-utils.js
  │       ├── loading-manager.js
  │       ├── notifications.js
  │       ├── paths.js
  │       ├── wallet-utils.js
  │       ├── coupon-utils.js
  │       └── user-preferences.js
  ├── tests/
  │   ├── unit/
  │   │   ├── auth.test.js
  │   │   ├── booking.test.js
  │   │   ├── payment.test.js
  │   │   └── wallet.test.js
  │   └── integration/
  │       ├── onboarding.test.js
  │       └── checkout.test.js
  ├── docs/
  │   ├── api.md
  │   ├── database.md
  │   └── deployment.md
  ├── scripts/
  │   ├── migrations/
  │   │   ├── 001_create_profiles.sql
  │   │   ├── 002_create_businesses.sql
  │   │   ├── 003_create_products.sql
  │   │   ├── 004_create_wallets.sql
  │   │   ├── 005_create_subscription_plans.sql
  │   │   ├── 006_create_coupons.sql
  │   │   ├── 007_create_inventory.sql
  │   │   ├── 008_create_business_categories.sql
  │   │   ├── 009_create_booking_addons.sql
  │   │   ├── 010_create_order_status_history.sql
  │   │   └── 011_create_product_variants.sql
  │   └── seeds/
  │       └── initial-data.sql
  ├── 404.html/.css/.js
  ├── about.html/.css/.js
  ├── booking.html/.css/.js
  ├── contact.html/.css/.js
  ├── details-salon.html/.css/.js
  ├── details-store.html/.css/.js
  ├── faq.html/.css/.js
  ├── index.html/.css/.js
  ├── privacy.html/.css/.js
  ├── pro.html/.css/.js
  ├── product.html/.css/.js
  ├── salons.html/.css/.js
  ├── shop.html/.css/.js
  ├── survey.html/.css/.js
  └── terms.html/.css/.js
5. البطاقات المشتركة (Shared Components)
5.1 `card-salon.js`
الاستخدام: عرض الصالونات في salons.html و index.html
الجدول: `businesses` (type='salon')
الميزات: صورة الغلاف، الشعار، الاسم، المدينة، التقييم، عدد الخدمات، أقل سعر، حالة (مفتوح/مغلق)، Badge موثق، زر مفضلة
5.2 `card-store.js`
الاستخدام: عرض المتاجر في shop.html
الجدول: `businesses` (type='store')
الميزات: الشعار، الاسم، المدينة، التقييم، عدد المنتجات، Badge موثق
ملاحظة: لا تعرض معلومات تواصل مباشرة
5.3 `card-product.js`
الاستخدام: عرض المنتجات في shop.html وصفحات أخرى
الجدول: `products`
الميزات: الصورة، الاسم، الفئة، التقييم (من reviews)، السعر، old_price، Badge خصم/جديد/مميز، زر مفضلة، زر سلة، زر عرض سريع
ملاحظة: التقييم يُجلب من جدول `reviews` عبر `product_id`
5.4 `card-service.js`
الاستخدام: عرض الخدمات في details-salon.html
الجدول: `services`
الميزات: الأيقونة، الاسم، الوصف، المدة، التصنيف، السعر، زر احجز الآن
5.5 `card-staff.js`
الاستخدام: عرض فريق العمل في details-salon.html
الجدول: `staff`
الميزات: الصورة، الاسم، المسمى الوظيفي، التقييم، التخصصات، حالة (متاح/مشغول/غير متصل)
5.6 `card-review.js`
الاستخدام: عرض التقييمات في details-salon.html و details-store.html
الجدول: `reviews`
الميزات: صورة المقيّم، الاسم، التقييم بالنجوم، التاريخ، النص، الصور، اسم الموظف (إن وجد)، الرد (إن وجد)
5.7 `card-booking.js`
الاستخدام: عرض الحجوزات في profile/customer.html
الجدول: `bookings`
الميزات: الحالة، اسم الخدمة، اسم الصالون، التاريخ، الوقت، الموظف، السعر، حالة الدفع، الإضافات (إن وجدت)، أزرار (إلغاء/تفاصيل)
5.8 `card-offer.js`
الاستخدام: عرض العروض في index.html
الجدول: `offers`
الميزات: نسبة الخصم، الأيقونة، العنوان، الوصف، مؤقت (countdown)، زر CTA
5.9 `card-coupon.js`
الاستخدام: عرض الكوبونات في profile/customer.html
الجدول: `coupons`
الميزات: الكود، نوع الخصم، القيمة، تاريخ الانتهاء، زر نسخ/استخدام
5.10 `card-concierge.js`
الاستخدام: عرض خدمات الكونسيرج (الخدمات المنزلية VIP)
الميزات: Badge VIP، الأيقونة، العنوان، الوصف، المميزات، السعر، زر طلب الخدمة
5.11 `card-order.js`
الاستخدام: عرض الطلبات في orders/index.html و dashboard/orders/index.html
الجدول: `orders`
الميزات: رقم الطلب، الحالة، المنتجات (صور مصغرة)، المجموع، الخصم، التاريخ، رقم التتبع، أزرار (تتبع/إلغاء/عرض)
5.12 `card-message.js`
الاستخدام: عرض المحادثات في messages/inbox.html
الجدول: `conversations` + `messages`
الميزات: صورة النشاط، الاسم، آخر رسالة، الوقت، عداد الرسائل غير المقروءة، Badge موثق
5.13 `card-notification.js`
الاستخدام: عرض الإشعارات في dashboard/notifications.html
الجدول: `notifications`
الميزات: الأيقونة، العنوان، الرسالة، الوقت، حالة (مقروء/غير مقروء)، زر حذف
5.14 `card-banner.js`
الاستخدام: عرض البانرات في index.html وصفحات أخرى
الجدول: `banners`
الميزات: الصورة، العنوان، الرابط، مؤقت العد التنازلي
6. الأدوات المشتركة (Shared Utils)
6.1 `paths.js`
مركزية جميع المسارات في كائن `PATHS`
دالة `resolvePath(key)` تحول المسار المطلق إلى نسبي حسب عمق الصفحة
6.2 `notifications.js`
`showNotification(message, type, duration)`: عرض تنبيه
`showOtpModal()`: نافذة OTP
`showConfirmDialog(message, title)`: نافذة تأكيد
`showLoading(message)`: نافذة تحميل
6.3 `cache.js`
`cacheFetch(key, fetcher, ttl)`: جلب بيانات مع كاش
`cacheSet/Get/Remove/Clear`: إدارة الكاش
TTL افتراضي: 5 دقائق
6.4 `error-handler.js`
`safeExecute(operation, context)`: تنفيذ عملية مع معالجة أخطاء
`handleSupabaseError(error, context)`: معالجة أخطاء Supabase
`handleAuthError(error, context)`: معالجة أخطاء المصادقة
6.5 `debounce.js`
`debounce(func, delay)`: تأخير تنفيذ الدالة
`throttle(func, limit)`: تحديد معدل التنفيذ
`protectButton(button, callback)`: حماية زر من النقر المتكرر
6.6 `images-utils.js`
`uploadImage(file, folder, options)`: رفع صورة
`getImageUrl(path, bucket)`: الحصول على رابط الصورة
`deleteImage(path, bucket)`: حذف صورة
`replaceImage(oldPath, newFile, folder)`: استبدال صورة
6.7 `date-utils.js`
`formatDate(date, options)`: تنسيق التاريخ بالعربية
`formatTime(time)`: تنسيق الوقت
`formatRelativeTime(date)`: "منذ 5 دقائق"
`isToday/isTomorrow/isYesterday`: التحقق من التاريخ
`getDayName/getMonthName`: اسم اليوم/الشهر بالعربية
6.8 `analytics.js`
`Analytics.trackPageView(pageName)`: تتبع زيارة صفحة
`Analytics.trackClick(elementName, metadata)`: تتبع نقرة
`Analytics.trackSearch(query, filters)`: تتبع بحث
`Analytics.trackView(itemId, type)`: تتبع مشاهدة عنصر
6.9 `loading-manager.js`
`showSkeleton(targetId, type, count)`: عرض Skeleton
`hideSkeleton(targetId)`: إخفاء Skeleton
`showButtonSpinner(button, loadingText)`: Spinner داخل زر
`hideButtonSpinner(button)`: إعادة الزر لحالته
`showPageSpinner(message)`: Spinner شاشة كاملة
`hidePageSpinner()`: إخفاء Spinner الشاشة
6.10 `wallet-utils.js`
`getWalletBalance(userId)`: جلب رصيد المحفظة
`addFunds(amount, paymentMethod)`: إضافة رصيد
`withdrawFunds(amount, bankDetails)`: سحب رصيد
`getTransactionHistory(userId, filters)`: سجل المعاملات
6.11 `coupon-utils.js`
`validateCoupon(code, cartTotal, userId)`: التحقق من صلاحية الكوبون
`applyCoupon(code, cartTotal)`: تطبيق الخصم
`calculateDiscount(coupon, subtotal)`: حساب قيمة الخصم
7. نظام المصادقة والحماية
7.1 `auth-state.js`
`getCurrentUser()`: جلب بيانات المستخدم الحالية
`isUserLoggedIn()`: التحقق من تسجيل الدخول
`getCurrentUserId()`: جلب معرف المستخدم
`isAdmin()`: التحقق من صلاحيات الإدارة
7.2 `page-guard.js`
`initPageGuard(options)`: تهيئة حماية الصفحة
يُستخدم فقط في الصفحات المحمية (dashboard, admin, profile, onboarding, billing, messages, orders)
لا يُستخدم في الصفحات العامة
7.3 `role-guard.js`
`checkRole(userData, requiredRole)`: التحقق من الدور
`checkBusinessStatus(businessData, requiredStatus)`: التحقق من حالة النشاط
`hasCompletedOnboarding(userData)`: التحقق من إكمال الإعداد
7.4 `subscription-route-guard.js`
`requireActiveSubscription(requiredPlan, redirectPath)`: التحقق من الاشتراك
`requireFeature(feature, redirectPath)`: التحقق من ميزة معينة
`protectElement(elementId, requiredPlan, featureName)`: قفل عنصر لغير المشتركين
7.5 `booking-guard.js`
`isSlotAvailable(branchId, date, time)`: التحقق من توفر الوقت
`validateBookingData(data)`: التحقق من بيانات الحجز
`isWithinWorkingHours(workingHours, time, day)`: التحقق من أوقات العمل
`getAvailableSlots(branchId, date, workingHours)`: جلب الأوقات المتاحة
`checkHolidays(branchId, date)`: التحقق من العطلات
8. الأنماط المعمارية
8.1 نمط الصفحات العامة
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
8.2 نمط الصفحات المحمية
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
8.3 نمط JavaScript للصفحات العامة
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
9. القرارات المعمارية المهمة
9.1 منع تجاوز المنصة
لا تعرض هاتف/واتساب/إيميل المتجر أو الصالون في الصفحات العامة
استخدم زر "تواصل عبر المنصة" يفتح نموذج رسالة
المتجر/الصالون يرد عبر لوحة التحكم
9.2 المفضلة
استخدم جدول `favorites` مع `item_type` لتحديد النوع
أنواع المفضلة: 'salon', 'product', 'store', 'service'
قيد فريد: `UNIQUE(user_id, item_id, item_type)`
9.3 التقييمات
جدول `reviews` يحتوي على `business_id`, `product_id`, `staff_id` (اختياري)
لتقييم المنتج: استخدم `product_id`
لتقييم الصالون/المتجر: استخدم `business_id`
لتقييم الموظف: استخدم `staff_id`
لا يوجد حقل `rating` في جدول `products` - احسبه من `reviews`
9.4 السلة
تخزين محلي في `localStorage` بمفتاح `bf-cart`
حدث `bf-cart-updated` لتحديث عداد السلة في الشريط العلوي
9.5 البلاغات
استخدم جدول `reports` في Supabase
أنواع البلاغات: 'fraud', 'spam', 'inappropriate', 'other'
حالات البلاغ: 'pending', 'investigating', 'resolved', 'dismissed'
9.6 التوثيق
استخدم جدول `verifications` لإدارة طلبات التوثيق
حالات التوثيق: 'pending', 'under_review', 'approved', 'rejected'
الصالون يحتاج: بطاقة تعريف + RIB + وثيقة ملكية/إيجار
المتجر يحتاج: بطاقة تعريف + RIB + وثيقة تجارية + وثيقة مكان
عند الموافقة: `is_verified = true` في جدول `businesses`
9.7 الفروع والموظفين
جدول `branches` لإدارة فروع الصالونات الكبيرة
جدول `staff` لإدارة فريق العمل مع التخصصات ونسب العمولة
جدول `staff_services` لربط الموظفين بالخدمات التي يقدمونها
`branch_id` في جدول `services` و `bookings` لربط الخدمات والحجوزات بالفروع
9.8 الطلبات والمدفوعات
جدول `orders` لإدارة طلبات المتاجر
جدول `order_items` لعناصر الطلب
جدول `order_status_history` لتتبع تغييرات حالة الطلب
جدول `transactions` لتتبع جميع المعاملات المالية
جدول `refunds` لإدارة طلبات الاسترجاع
دعم حالات متعددة للطلب: pending, processing, shipped, delivered, cancelled
9.9 الرسائل والإشعارات
جدول `conversations` للمحادثات بين العملاء والأنشطة
جدول `messages` للرسائل الفردية
جدول `notifications` للإشعارات النظامية
دعم Realtime للرسائل الفورية
9.10 العروض والكوبونات
جدول `offers` لإدارة العروض والخصومات التلقائية
جدول `coupons` لإدارة الكوبونات المستقلة
دعم أنواع متعددة: percentage, fixed, buy_get, shipping
كود خصم مع تاريخ انتهاء وحد استخدام
9.11 سجلات التدقيق
جدول `audit_logs` لتتبع جميع التغييرات
تسجيل: create, update, delete, login, logout, refund, ban
تخزين التغييرات قبل وبعد في JSONB
تسجيل IP و User Agent للأمان
9.12 الفئات
جدول `business_categories` لتصنيف الأنشطة التجارية (صالونات، متاجر)
جدول `categories` لتصنيف المنتجات والخدمات
دعم الفئات الفرعية عبر `parent_id`
أيقونات ووصف لكل فئة
9.13 المحفظة الرقمية
جدول `wallets` لإدارة أرصدة المستخدمين
جدول `transactions` لتتبع جميع العمليات (payment, refund, withdrawal, commission, topup)
الرصيد يُحدّث تلقائياً عند كل معاملة
استخدم `wallet-utils.js` لجميع العمليات المالية
9.14 الاشتراكات
جدول `subscription_plans` لتعريف خطط الاشتراك
جدول `subscriptions` لربط المستخدمين بالخطط
دعم فوترات شهرية/سنوية
جدول `subscriptions.features` يحدد الميزات المتاحة
9.15 المخزون
جدول `inventory_movements` لتتبع حركة المخزون
أنواع الحركة: in, out, adjustment, return, damage
كل حركة تسجل المستخدم المرجع والكمية
`stock_quantity` في `products` يُحدّث تلقائياً
9.16 الشحن
جدول `shipping_methods` لتعريف طرق الشحن
دعم تكلفة أساسية + تكلفة لكل كيلوغرام
ربط `orders.shipping_method_id` بطريقة الشحن المختارة
9.17 العطلات والإجازات
جدول `holidays` لتعريف العطلات
دعم العطلات السنوية المتكررة
`booking-guard.js` يتحقق من العطلات قبل تأكيد الحجز
9.18 إضافات الخدمات
جدول `service_addons` لتعريف الإضافات الاختيارية
جدول `booking_addons` لربط الإضافات بالحجوزات
دعم الإضافات الإجبارية والاختيارية
9.19 نقاط الولاء والإحالات
جدول `loyalty_points` لتتبع نقاط المكافآت
جدول `referrals` لإدارة نظام الإحالات
ربط النقاط بالطلبات والمكافآت
9.20 البانرات التسويقية
جدول `banners` لإدارة البانرات الإعلانية
دعم مواضع متعددة: home_top, home_middle, salons, shop
ربط بمنتجات/صالونات/متاجر محددة
9.21 متغيرات المنتجات
جدول `product_variants` لإدارة متغيرات المنتجات (أحجام، ألوان، أعطار)
كل متغير له SKU فريد ومخزون خاص
ربط `order_items.variant_id` بالمتغير المختار
10. قائمة التحقق قبل النشر
[ ] جميع المسارات تستخدم `resolvePath()` بدلاً من المسارات الثابتة
[ ] جميع الصفحات العامة تستخدم Skeleton Loading (بدون page-guard.js)
[ ] جميع الصفحات المحمية تستخدم page-guard.js + page-protection.css
[ ] لا توجد معلومات تواصل مباشرة للمتاجر/الصالونات في الصفحات العامة
[ ] جميع أسماء الحقول تطابق Supabase Schema
[ ] جميع التنسيقات تستخدم متغيرات global.css
[ ] شريط التنقل العام موجود في جميع الصفحات
[ ] حاوية التنبيهات `<div id="notification-container"></div>` موجودة
[ ] استخدام `safeExecute()` و `cacheFetch()` للعمليات الحرجة
[ ] معالجة الأخطاء بشكل صحيح مع رسائل واضحة للمستخدم
[ ] جميع الصور تُرفع عبر `uploadImage()` من `images-utils.js`
[ ] ملفات `loading.css` و `loading-manager.js` مُستخدمة بشكل صحيح
[ ] جميع الجداول تحتوي على `created_at` و `updated_at`
[ ] الجداول الرئيسية تحتوي على `deleted_at` للـ Soft Delete
[ ] RLS Policies مفعّلة في Supabase لجميع الجداول
[ ] Indexes مضافة على الحقول المستخدمة في البحث والفلترة
[ ] جميع العلاقات بين الجداول مُعرّفة بـ Foreign Keys
[ ] الاختبارات (tests/) مكتوبة للوظائف الحرجة
[ ] التوثيق (docs/) محدث وشامل
[ ] جدول `wallets` مُهيّأ لكل مستخدم جديد
[ ] جدول `subscription_plans` يحتوي على خطط افتراضية
[ ] جدول `shipping_methods` يحتوي على طرق شحن أساسية
[ ] جدول `business_categories` يحتوي على فئات افتراضية
[ ] نظام الكوبونات مُختبر مع جميع السيناريوهات
[ ] نظام الاسترجاع (refunds) مُختبر ومُفعّل
[ ] المخزون يُحدّث تلقائياً عند كل طلب
[ ] العطلات تُؤخذ بعين الاعتبار في الحجز
[ ] متغيرات المنتجات مُدارة بشكل صحيح
[ ] سجل تغييرات حالة الطلب يُحدّث تلقائياً
[ ] تقييم الموظفين مُربوط بالحجوزات

