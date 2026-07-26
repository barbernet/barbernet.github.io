# دليل المطور الشامل: تحديث ملفات BarberFlow Pro (Post-Supabase)

هذا الملف هو المرجع الأساسي والقواعد الصارمة التي يجب اتباعها عند تحديث أو إنشاء أي ملف في مشروع BarberFlow Pro بعد التحويل من Firebase إلى Supabase.

## 1. تعريف المنصة
BarberFlow Pro هي منصة رقمية متكاملة لقطاع الحلاقة والتجميل، تربط بين ثلاثة أطراف رئيسية:
- **الصالونات:** لإدارة المواعيد، الموظفين، الفروع، الخدمات، والمخزون.
- **المتاجر:** لبيع منتجات العناية والحلاقة وإدارة الطلبات.
- **الزبائن:** لحجز المواعيد، شراء المنتجات، وتقييم الخدمات.

## 2. القواعد الإلزامية لتحديث أي ملف

### أ. توحيد التنسيقات (CSS)
يجب أن تعتمد جميع ملفات CSS الفرعية بشكل كلي على المتغيرات المعرفة في `shared/styles/global.css`. هذا يضمن قدرة النظام على التحكم بالثيمات (فاتح/داكن) وضمان تجاوب الموقع مع جميع أحجام الشاشات دون تكرار الكود.

### ب. الالتزام بالملفات المشتركة وملفات الحماية
يُمنع منعاً باتاً إعادة كتابة الأكواد المشتركة داخل الصفحات الفردية. يجب استدعاء الملفات من مجلدات `shared` و `middleware` عند الحاجة إليها فقط. يتم تحديث هذه الملفات المركزية بدلاً من تعديل كل صفحة على حدة.

### ج. قاعدة البيانات: Supabase حصراً
تم استبدال Firebase تماماً بـ Supabase. يجب استخدام `config/supabase-init.js` للاتصال، واستخدام دوال Supabase للمصادقة وقاعدة البيانات والتخزين. لا يُسمح باستخدام أي مكتبات تابعة لـ Firebase.

### د. توحيد أسماء المتغيرات والحقول
يجب تطابق أسماء المتغيرات في كود JavaScript/TypeScript تماماً مع أسماء الحقول المخزنة في قاعدة بيانات Supabase. 
- ما يتم تخزينه في قاعدة البيانات هو نفس الاسم الذي يتم جلبه أو التعديل عليه في الواجهة الأمامية.
- يمنع هذا الاختلاف تجنب الأخطاء المنطقية والبحث عن حقول بأسماء غير موجودة.

## 3. هيكلية الملفات الكاملة (بناءً على الهيكلية الجديدة)

### مجلد config/
- **supabase-init.js**: تهيئة عميل Supabase والاتصال بقاعدة البيانات والمصادقة. المسار: `config/supabase-init.js`. الدور: نقطة الدخول الوحيدة للاتصال بالخلفية.

### مجلد auth/ (صفحات المصادقة)
- **login.html / .css / .js**: صفحة تسجيل الدخول (بريد/هاتف/Google). المسار: `auth/login.*`. الدور: بوابة دخول المستخدمين.
- **register.html / .css / .js**: صفحة إنشاء حساب جديد مع اختيار الدور. المسار: `auth/register.*`. الدور: تسجيل مستخدمين جدد.
- **forgot-password.html / .css / .js**: استعادة كلمة المرور عبر البريد. المسار: `auth/forgot-password.*`. الدور: مساعدة المستخدمين الذين نسوا كلمات مرورهم.
- **reset-password.html / .css / .js**: إعادة تعيين كلمة المرور الجديدة. المسار: `auth/reset-password.*`. الدور: إكمال عملية استعادة الحساب.
- **verify-email.html / .css / .js**: تأكيد البريد الإلكتروني. المسار: `auth/verify-email.*`. الدور: تفعيل الحسابات الجديدة.

### مجلد billing/ (الفواتير والمدفوعات)
- **checkout.html / .css / .js**: صفحة إتمام الدفع. المسار: `billing/checkout.*`. الدور: معالجة عمليات الشراء والاشتراكات.
- **payment-success.html / .css / .js**: صفحة نجاح الدفع. المسار: `billing/payment-success.*`. الدور: تأكيد العملية للمستخدم.
- **payment-cancel.html / .css / .js**: صفحة إلغاء الدفع. المسار: `billing/payment-cancel.*`. الدور: إبلاغ المستخدم بفشل أو إلغاء الدفع.
- **subscription.html / .css / .js**: إدارة الاشتراكات. المسار: `billing/subscription.*`. الدور: عرض وتعديل خطط الاشتراك.

### مجلد dashboard/ (لوحة التحكم الإدارية)
- **index.html / .css / .js**: الصفحة الرئيسية للوحة التحكم. المسار: `dashboard/index.*`. الدور: نظرة عامة على الإحصائيات.
- **analytics.html / .css / .js**: صفحة التحليلات والتقارير. المسار: `dashboard/analytics.*`. الدور: عرض بيانات الأداء.
- **appointments.html / .css / .js**: إدارة الحجوزات والمواعيد. المسار: `dashboard/appointments.*`. الدور: جدولة وتعديل المواعيد.
- **notifications.html / .css / .js**: مركز الإشعارات. المسار: `dashboard/notifications.*`. الدور: عرض التنبيهات الحديثة.
- **reviews.html / .css / .js**: إدارة التقييمات. المسار: `dashboard/reviews.*`. الدور: الرد على تقييمات الزبائن.
- **customers/**: مجلد إدارة الزبائن (`index.*`). الدور: قائمة الزبائن وتفاصيلهم.
- **orders/**: مجلد إدارة الطلبات (`index.*`). الدور: متابعة طلبات المتجر.
- **products/**: مجلد إدارة المنتجات (`index.*`). الدور: إضافة وتعديل المنتجات.
- **services/**: مجلد إدارة الخدمات (`index.*`). الدور: قائمة خدمات الصالون وأسعارها.
- **settings/**: مجلد الإعدادات (`settings-general.*`, `settings-salon.*`, `settings-store.*`). الدور: تخصيص إعدادات الحساب والصالون والمتجر.
- **staff/**: مجلد إدارة الموظفين (`index.*`). الدور: إضافة وتعديل بيانات الطاقم.

### مجلد middleware/ (الطبقة الوسطى والحماية)
- **index.js**: نقطة التصدير المركزية لجميع دوال الـ Middleware. المسار: `middleware/index.js`.
- **auth/**: إدارة حالة المصادقة (`auth-state.js`, `index.js`). الدور: التحقق من تسجيل الدخول الحالي.
- **guards/**: حراس الحماية (`booking-guard.js`, `role-guard.js`, `index.js`). الدور: منع الوصول غير المصرح به حسب الدور أو صلاحية الحجز.
- **routing/**: توجيه الصفحات (`page-gard.js`, `page-router.js`, `profile-route.js`, `index.js`). الدور: حماية الصفحات من الومضة (FOUC) والتوجيه الآمن.
- **subscription/**: حماية ميزات الاشتراك (`subscription-guard.js`, `index.js`). الدور: قفل الميزات المدفوعة لغير المشتركين.
- **validation/**: التحقق وتنظيف المدخلات (`images-sanitizer.js`, `input-sanitizer.js`, `index.js`). الدور: تأمين البيانات قبل إرسالها لقاعدة البيانات.

### مجلد onboarding/ (الإرشاد الأولي)
- **add-customer/salon/store.html/.css/.js**: صفحات إضافة البيانات الأولية. الدور: إدخال المعلومات الأساسية عند التسجيل.
- **setup-customer/salon/store.html/.css/.js**: صفحات إعداد الحساب. الدور: تخصيص التجربة الأولى.
- **welcome.html/.css/.js**: صفحة الترحيب. الدور: شاشة البداية بعد إكمال الإعداد.

### مجلد profile/ (الملفات الشخصية العامة)
- **customer.html/.css/.js**: بروفايل الزبون. المسار: `profile/customer.*`. الدور: عرض سجل الحجوزات والمفضلة.
- **salon.html/.css/.js**: بروفايل الصالون العام. المسار: `profile/salon.*`. الدور: عرض معلومات الصالون للزوار.
- **store.html/.css/.js**: بروفايل المتجر العام. المسار: `profile/store.*`. الدور: عرض منتجات المتجر للزوار.

### مجلد public/ (الملفات الثابتة والأصول)
- **assets/**: مجلد الصور (`images`)، الأيقونات (`icons`)، والخطوط (`fonts`).
- **manifest.json**: ملف تعريف تطبيق الويب (PWA).
- **robots.txt**: تعليمات لمحركات البحث.
- **sitemap.xml**: خريطة الموقع للأرشفة.

### مجلد shared/ (المكونات والأدوات المشتركة)
- **components/**: بطاقات العرض (`card-concierge.js`, `card-offer.js`, `card-salon.js`, `card-store.js`). الدور: مكونات واجهة قابلة لإعادة الاستخدام.
- **layout/**: شريط التنقل (`global-navbar.html`, `global-navbar.js`). الدور: القائمة العلوية الموحدة.
- **styles/**: التنسيقات العالمية (`cards.css`, `global-navbar.css`, `global.css`, `notifications.css`, `page-protection.css`). الدور: التحكم في الشكل والثيم والحماية البصرية.
- **utils/**: الأدوات المساعدة (`analytics.js`, `debounce.js`, `images-utils.js`, `index.js`, `notifications.js`, `paths.js`, `user-preferences.js`). الدور: دوال مساعدة للتتبع، المسارات، والتنبيهات.

### ملفات الجذر (Root Files)
- **.gitignore**: تجاهل الملفات غير المرغوبة في Git.
- **404.html/.css/.js**: صفحة الخطأ 404 المخصصة.
- **about.html/.css/.js**: صفحة "من نحن".
- **booking.html/.css/.js**: صفحة الحجز العامة.
- **contact.html/.css/.js**: صفحة التواصل معنا.
- **details-salon/store.html/.css/.js**: صفحات تفاصيل الصالون/المتجر.
- **faq.html/.css/.js**: صفحة الأسئلة الشائعة.
- **index.html/.css/.js**: الصفحة الرئيسية للمنصة.
- **livre.md**: هذا الملف (دليل القواعد).
- **privacy.html/.css/.js**: سياسة الخصوصية.
- **pro.html/.css/.js**: صفحة العروض الاحترافية.
- **product.html/.css/.js**: صفحة تفاصيل المنتج.
- **README.md**: ملف readme للمشروع.
- **salons.html/.css/.js**: صفحة تصفح الصالونات.
- **shop.html/.css/.js**: صفحة المتجر العام.
- **survey.html/.css/.js**: صفحة الاستبيانات.
- **terms.html/.css/.js**: شروط الاستخدام.

### جداول تخزين المعلومات في supabsse
-- ==========================================================================
-- BarberFlow Pro - Database Schema & Security Policies (Supabase)
-- ==========================================================================

-- 1. إنشاء أنواع ENUM لتوحيد البيانات
CREATE TYPE user_role AS ENUM ('customer', 'salon', 'store');
CREATE TYPE onboarding_status AS ENUM ('empty', 'incomplete', 'completed');
CREATE TYPE business_status AS ENUM ('inactive', 'active', 'suspended');

-- 2. دالة ومُشغِّل إنشاء الملف الشخصي تلقائياً عند التسجيل
-- يجب أن تكون هذه الدالة موجودة قبل إنشاء جدول profiles وسياساته
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    (new.raw_user_meta_data->>'role')::user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. جدول الملفات الشخصية (Profiles)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    phone TEXT UNIQUE,
    avatar_url TEXT,
    onboarding_status onboarding_status DEFAULT 'empty',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. جدول الشركات الرئيسية (Businesses)
CREATE TABLE businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type user_role NOT NULL, -- 'salon' or 'store'
    description TEXT,
    city TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    cover_url TEXT,
    working_hours JSONB DEFAULT '{"open": "09:00", "close": "21:00", "days": ["sun","mon","tue","wed","thu"]}',
    status business_status DEFAULT 'inactive',
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. جدول الفروع (Branches)
CREATE TABLE branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    manager_id UUID REFERENCES profiles(id),
    working_hours JSONB,
    status business_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول متاجر الصالونات (Salon Stores) - اختياري
CREATE TABLE salon_stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT DEFAULT 'متجر الصالون',
    description TEXT,
    status business_status DEFAULT 'inactive',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id) -- صالون واحد يمكن أن يكون له متجر واحد فقط
);

-- 7. جدول المنتجات (Products)
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES businesses(id) ON DELETE CASCADE, -- المتجر المستقل
    salon_store_id UUID REFERENCES salon_stores(id) ON DELETE CASCADE, -- أو متجر الصالون
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url TEXT,
    category TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. جدول الخدمات (Services)
CREATE TABLE services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL, -- NULL تعني الخدمة في جميع الفروع
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_min INT DEFAULT 30,
    category TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. جدول الحجوزات (Bookings/Appointments)
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
    branch_id UUID REFERENCES branches(id), -- إذا كان NULL فهي للحجز في الفرع الرئيسي
    staff_id UUID REFERENCES profiles(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. جدول التقييمات (Reviews)
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    reply TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- Row Level Security (RLS) Policies
-- ==========================================================================

-- تفعيل RLS لجميع الجداول
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- سياسات جدول Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- سياسات جدول Businesses (محدثة للسماح للمالك بالرؤية حتى لو كان غير نشط)
CREATE POLICY "Businesses viewable by public if active or by owner" ON businesses 
FOR SELECT USING (status = 'active' OR auth.uid() = owner_id);
CREATE POLICY "Owners can manage their own business" ON businesses FOR ALL USING (auth.uid() = owner_id);

-- سياسات جدول Branches
CREATE POLICY "Branches of active businesses are viewable" ON branches FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = branches.business_id AND businesses.status = 'active')
);
CREATE POLICY "Business owners can manage branches" ON branches FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = branches.business_id AND businesses.owner_id = auth.uid())
);

-- سياسات جدول Salon Stores
CREATE POLICY "Salon stores are viewable if salon is active" ON salon_stores FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = salon_stores.salon_id AND businesses.status = 'active')
);
CREATE POLICY "Salon owners can manage their store" ON salon_stores FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = salon_stores.salon_id AND businesses.owner_id = auth.uid())
);

-- سياسات جدول Products
CREATE POLICY "Available products are viewable" ON products FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Sellers can manage their products" ON products FOR ALL USING (
    (seller_id IS NOT NULL AND EXISTS (SELECT 1 FROM businesses WHERE businesses.id = products.seller_id AND businesses.owner_id = auth.uid()))
    OR 
    (salon_store_id IS NOT NULL AND EXISTS (SELECT 1 FROM salon_stores JOIN businesses ON businesses.id = salon_stores.salon_id WHERE salon_stores.id = products.salon_store_id AND businesses.owner_id = auth.uid()))
);

-- سياسات جدول Services
CREATE POLICY "Available services are viewable" ON services FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Business owners can manage services" ON services FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = services.business_id AND businesses.owner_id = auth.uid())
);

-- سياسات جدول Bookings
CREATE POLICY "Customers can view own bookings" ON bookings FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Business owners can view bookings for their services" ON bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM services JOIN businesses ON businesses.id = services.business_id WHERE services.id = bookings.service_id AND businesses.owner_id = auth.uid())
);
CREATE POLICY "Customers can create bookings" ON bookings FOR INSERT WITH CHECK (customer_id = auth.uid());

-- سياسات جدول Reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Reviewers can update own review" ON reviews FOR UPDATE USING (reviewer_id = auth.uid());
CREATE POLICY "Business owners can reply to reviews" ON reviews FOR UPDATE USING (
    (business_id IS NOT NULL AND EXISTS (SELECT 1 FROM businesses WHERE businesses.id = reviews.business_id AND businesses.owner_id = auth.uid()))
    OR
    (branch_id IS NOT NULL AND EXISTS (SELECT 1 FROM branches JOIN businesses ON businesses.id = branches.business_id WHERE branches.id = reviews.branch_id AND businesses.owner_id = auth.uid()))
);

-- ==========================================================================
-- Indexes for Performance
-- ==========================================================================
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_type_status ON businesses(type, status);
CREATE INDEX idx_branches_business ON branches(business_id);
CREATE INDEX idx_salon_stores_salon ON salon_stores(salon_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_salon_store ON products(salon_store_id);
CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_service_date ON bookings(service_id, booking_date);
CREATE INDEX idx_reviews_business ON reviews(business_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);


وأخيرا رابط مستودع الملفات على منصة github اذا اردت إلقاء نظرة هناك
https://github.com/barbernet/barbernet.github.io.git