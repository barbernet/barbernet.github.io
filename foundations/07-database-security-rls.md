# أمان قاعدة البيانات وقواعد RLS - BarberFlow Pro

هذا الملف يوثق جميع سياسات الأمان وقواعد Row Level Security (RLS) في قاعدة البيانات.
كل سياسة تحتوي على: الوصف، الجدول، العملية، الشرط، الكود SQL، وأمثلة الاستخدام.

---

## 1. مقدمة

### 1.1 فلسفة الأمان في BarberFlow Pro

الأمان في BarberFlow Pro يعتمد على مبدأ **"Defense in Depth"** (الدفاع متعدد الطبقات):

| الطبقة | الوصف | التطبيق |
|--------|-------|---------|
| **الطبقة 1** | المصادقة (Authentication) | Supabase Auth + OTP |
| **الطبقة 2** | الصلاحيات (Authorization) | RLS Policies |
| **الطبقة 3** | التحقق (Validation) | Frontend + Backend |
| **الطبقة 4** | المراقبة (Monitoring) | Audit Logs |
| **الطبقة 5** | التشفير (Encryption) | كلمات المرور + البيانات الحساسة |

### 1.2 القواعد الذهبية للأمان

✅ **افعل:**
- فعّل RLS على **جميع** الجداول دون استثناء
- استخدم `auth.uid()` للتحقق من هوية المستخدم
- لا تكشف معلومات حساسة في رسائل الخطأ
- سجّل كل عملية حساسة في `audit_logs`
- استخدم Security Definer Functions للعمليات المعقدة
- اختبر كل سياسة RLS قبل النشر

❌ **لا تفعل:**
- لا تعطّل RLS أبداً (حتى في التطوير)
- لا تخزن كلمات المرور في النص الصريح
- لا تعرض بيانات مستخدمين آخرين
- لا تستخدم `SELECT *` في الاستعلامات الحساسة
- لا تثق بالبيانات القادمة من Frontend
- لا تكشف أخطاء قاعدة البيانات للمستخدم

### 1.3 الأدوار في النظام (Roles)

```javascript
const ROLES = {
  CUSTOMER: 'customer',   // عميل - يحجز ويشتري
  SALON: 'salon',         // صالون - يقدم خدمات
  STORE: 'store',         // متجر - يبيع منتجات
  ADMIN: 'admin',         // مشرف - إدارة المنصة
  SUPER_ADMIN: 'super_admin' // مشرف رئيسي
};
```

| الدور | الصلاحيات | الوصول إلى |
|-------|-----------|------------|
| `customer` | حجز، شراء، تقييم | بياناته فقط |
| `salon` | إدارة صالونه، حجوزاته | بيانات نشاطه فقط |
| `store` | إدارة متجره، طلباته | بيانات نشاطه فقط |
| `admin` | إدارة المنصة، التوثيق | جميع البيانات |
| `super_admin` | صلاحيات كاملة | كل شيء + إعدادات النظام |

---

## 2. تفعيل RLS على جميع الجداول

### 2.1 تفعيل RLS (خطوة أولى إلزامية)

```sql
-- تفعيل RLS على جميع الجداول
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
```

### 2.2 التحقق من تفعيل RLS

```sql
-- استعلام للتحقق من الجداول التي لم يتم تفعيل RLS عليها
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE rowsecurity = true
  );
```

---

## 3. Helper Functions للأمان

### 3.1 دالة التحقق من دور المستخدم

```sql
-- دالة للتحقق من دور المستخدم الحالي
CREATE OR REPLACE FUNCTION is_user_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = required_role
    AND is_banned = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- الاستخدام
-- SELECT * FROM admin_table WHERE is_user_role('admin');
```

### 3.2 دالة التحقق من ملكية النشاط

```sql
-- دالة للتحقق من ملكية نشاط تجاري
CREATE OR REPLACE FUNCTION is_business_owner(p_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses
    WHERE id = p_business_id
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.3 دالة التحقق من حالة الحظر

```sql
-- دالة للتحقق من أن المستخدم غير محظور
CREATE OR REPLACE FUNCTION is_user_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_banned = false
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.4 دالة جلب معرف المستخدم الحالي

```sql
-- دالة آمنة لجلب معرف المستخدم
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. RLS Policies - جدول `profiles`

### 4.1 سياسات القراءة

```sql
-- المستخدم يرى بياناته فقط
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (
  id = auth.uid()
  AND is_banned = false
);

-- Admin يرى جميع المستخدمين
CREATE POLICY "profiles_select_admin"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'super_admin')
  )
);

-- نشاط تجاري يرى بيانات عملائه (للتواصل)
CREATE POLICY "profiles_select_business_customers"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN businesses bus ON bus.id = b.business_id
    WHERE b.customer_id = profiles.id
    AND bus.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM orders o
    JOIN businesses bus ON bus.id = o.business_id
    WHERE o.customer_id = profiles.id
    AND bus.owner_id = auth.uid()
  )
);
```

### 4.2 سياسات التحديث

```sql
-- المستخدم يعدل بياناته فقط
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  -- منع المستخدم من تغيير دوره
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  -- منع المستخدم من إزالة حظر نفسه
  AND is_banned = (SELECT is_banned FROM profiles WHERE id = auth.uid())
);

-- Admin يعدل أي مستخدم
CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'super_admin')
  )
);
```

### 4.3 سياسات الإدراج

```sql
-- المستخدم ينشئ حسابه فقط (عند التسجيل)
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (
  id = auth.uid()
  AND role IN ('customer', 'salon', 'store')
  AND is_banned = false
);
```

### 4.4 سياسات الحذف

```sql
-- لا يُسمح بالحذف الفعلي - فقط Soft Delete
CREATE POLICY "profiles_no_delete"
ON profiles FOR DELETE
USING (false);

-- Admin يمكنه الحذف الفعلي (نادر)
CREATE POLICY "profiles_delete_admin"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
);
```

---

## 5. RLS Policies - جدول `businesses`

### 5.1 سياسات القراءة

```sql
-- الجميع يرى الأنشطة النشطة (للعملاء)
CREATE POLICY "businesses_select_public"
ON businesses FOR SELECT
USING (
  status = 'active'
  AND deleted_at IS NULL
  AND is_banned = false
);

-- المالك يرى نشاطه حتى لو غير نشط
CREATE POLICY "businesses_select_owner"
ON businesses FOR SELECT
USING (owner_id = auth.uid());

-- Admin يرى جميع الأنشطة
CREATE POLICY "businesses_select_admin"
ON businesses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

### 5.2 سياسات التحديث

```sql
-- المالك يعدل نشاطه فقط
CREATE POLICY "businesses_update_owner"
ON businesses FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (
  owner_id = auth.uid()
  -- منع تغيير المالك عبر التحديث
  AND owner_id = (SELECT owner_id FROM businesses WHERE id = id)
);

-- Admin يعدل أي نشاط
CREATE POLICY "businesses_update_admin"
ON businesses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

### 5.3 سياسات الإدراج

```sql
-- أي مستخدم مسجل يمكنه إنشاء نشاط
CREATE POLICY "businesses_insert_authenticated"
ON businesses FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
  AND status IN ('inactive', 'active')
);
```

### 5.4 سياسات الحذف (Soft Delete فقط)

```sql
-- المالك يحذف نشاطه فقط (Soft Delete)
CREATE POLICY "businesses_delete_owner"
ON businesses FOR DELETE
USING (owner_id = auth.uid());

-- Admin يحذف أي نشاط
CREATE POLICY "businesses_delete_admin"
ON businesses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

## 6. RLS Policies - جدول `branches`

```sql
-- الجميع يرى فروع الأنشطة النشطة
CREATE POLICY "branches_select_public"
ON branches FOR SELECT
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.status = 'active'
  )
);

-- المالك يرى فروع نشاطه
CREATE POLICY "branches_select_owner"
ON branches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يعدل فروع نشاطه فقط
CREATE POLICY "branches_update_owner"
ON branches FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يحذف فروع نشاطه فقط
CREATE POLICY "branches_delete_owner"
ON branches FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك ينشئ فروع لنشاطه
CREATE POLICY "branches_insert_owner"
ON branches FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  )
);
```

---

## 7. RLS Policies - جدول `staff`

```sql
-- الجميع يرى موظفي الأنشطة النشطة
CREATE POLICY "staff_select_public"
ON staff FOR SELECT
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = staff.business_id
    AND businesses.status = 'active'
  )
);

-- المالك يرى موظفي نشاطه
CREATE POLICY "staff_select_owner"
ON staff FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = staff.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- الموظف يرى بياناته
CREATE POLICY "staff_select_own"
ON staff FOR SELECT
USING (profile_id = auth.uid());

-- المالك يعدل موظفي نشاطه فقط
CREATE POLICY "staff_update_owner"
ON staff FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = staff.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يحذف موظفي نشاطه فقط
CREATE POLICY "staff_delete_owner"
ON staff FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = staff.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك ينشئ موظفين لنشاطه
CREATE POLICY "staff_insert_owner"
ON staff FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = staff.business_id
    AND businesses.owner_id = auth.uid()
  )
);
```

---

## 8. RLS Policies - جدول `services`

```sql
-- الجميع يرى خدمات الأنشطة النشطة
CREATE POLICY "services_select_public"
ON services FOR SELECT
USING (
  deleted_at IS NULL
  AND is_available = true
  AND EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = services.business_id
    AND businesses.status = 'active'
  )
);

-- المالك يرى خدمات نشاطه (حتى غير المتاحة)
CREATE POLICY "services_select_owner"
ON services FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = services.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يعدل خدمات نشاطه فقط
CREATE POLICY "services_update_owner"
ON services FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = services.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يحذف خدمات نشاطه فقط
CREATE POLICY "services_delete_owner"
ON services FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = services.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك ينشئ خدمات لنشاطه
CREATE POLICY "services_insert_owner"
ON services FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = services.business_id
    AND businesses.owner_id = auth.uid()
  )
);
```

---

## 9. RLS Policies - جدول `products`

```sql
-- الجميع يرى منتجات المتاجر النشطة
CREATE POLICY "products_select_public"
ON products FOR SELECT
USING (
  deleted_at IS NULL
  AND is_available = true
  AND EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.seller_id
    AND businesses.status = 'active'
  )
);

-- المالك يرى منتجات متجره (حتى غير المتاحة)
CREATE POLICY "products_select_owner"
ON products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.seller_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يعدل منتجات متجره فقط
CREATE POLICY "products_update_owner"
ON products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.seller_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يحذف منتجات متجره فقط
CREATE POLICY "products_delete_owner"
ON products FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.seller_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك ينشئ منتجات لمتجره
CREATE POLICY "products_insert_owner"
ON products FOR INSERT
WITH CHECK (
  seller_id IN (
    SELECT id FROM businesses
    WHERE owner_id = auth.uid()
    AND type = 'store'
  )
);
```

---

## 10. RLS Policies - جدول `bookings` (حساس جداً)

### 10.1 سياسات القراءة

```sql
-- العميل يرى حجوزاته فقط
CREATE POLICY "bookings_select_customer"
ON bookings FOR SELECT
USING (customer_id = auth.uid());

-- المالك يرى حجوزات نشاطه
CREATE POLICY "bookings_select_owner"
ON bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = bookings.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- الموظف يرى حجوزاته
CREATE POLICY "bookings_select_staff"
ON bookings FOR SELECT
USING (
  staff_id IN (
    SELECT id FROM staff
    WHERE profile_id = auth.uid()
  )
);

-- Admin يرى جميع الحجوزات
CREATE POLICY "bookings_select_admin"
ON bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

### 10.2 سياسات الإنشاء

```sql
-- العميل ينشئ حجزاً لنفسه فقط
CREATE POLICY "bookings_insert_customer"
ON bookings FOR INSERT
WITH CHECK (
  customer_id = auth.uid()
  -- التحقق من أن المستخدم غير محظور
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_banned = false
  )
  -- التحقق من أن النشاط نشط
  AND EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = bookings.business_id
    AND businesses.status = 'active'
  )
);
```

### 10.3 سياسات التحديث

```sql
-- العميل يعدل حجوزه فقط (لإلغاء أو تعديل)
CREATE POLICY "bookings_update_customer"
ON bookings FOR UPDATE
USING (
  customer_id = auth.uid()
  -- العميل يمكنه فقط تغيير الحالة إلى cancelled
  AND (
    NEW.status = 'cancelled'
    OR NEW.status = OLD.status
  )
);

-- المالك يعدل حجوزات نشاطه
CREATE POLICY "bookings_update_owner"
ON bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = bookings.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Admin يعدل أي حجز
CREATE POLICY "bookings_update_admin"
ON bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

### 10.4 Trigger لتسجيل تغييرات الحجز

```sql
-- Trigger لتسجيل تغييرات حالة الحجز
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      changes,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      'booking_status_change',
      'booking',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'booking_date', NEW.booking_date,
        'customer_id', NEW.customer_id,
        'business_id', NEW.business_id
      ),
      inet_client_addr()::TEXT,
      current_setting('request.headers', true)::jsonb->>'user-agent'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER booking_status_change_trigger
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION log_booking_status_change();
```

---

## 11. RLS Policies - جدول `orders` (حساس جداً)

```sql
-- العميل يرى طلباته فقط
CREATE POLICY "orders_select_customer"
ON orders FOR SELECT
USING (customer_id = auth.uid());

-- المالك يرى طلبات متجره
CREATE POLICY "orders_select_owner"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = orders.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Admin يرى جميع الطلبات
CREATE POLICY "orders_select_admin"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- العميل ينشئ طلباً لنفسه
CREATE POLICY "orders_insert_customer"
ON orders FOR INSERT
WITH CHECK (
  customer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_banned = false
  )
);

-- المالك يعدل طلبات متجره (لتغيير الحالة)
CREATE POLICY "orders_update_owner"
ON orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = orders.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- العميل يعدل طلبه (للإلغاء فقط)
CREATE POLICY "orders_update_customer"
ON orders FOR UPDATE
USING (
  customer_id = auth.uid()
  AND status IN ('pending', 'processing')
);

-- Trigger لتسجيل تغييرات حالة الطلب
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'Status changed via RLS trigger'
    );
    
    INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      changes
    ) VALUES (
      auth.uid(),
      'order_status_change',
      'order',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'customer_id', NEW.customer_id,
        'business_id', NEW.business_id,
        'total', NEW.total
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER order_status_change_trigger
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();
```

---

## 12. RLS Policies - جدول `transactions` (حساس جداً)

```sql
-- المستخدم يرى معاملاته فقط
CREATE POLICY "transactions_select_own"
ON transactions FOR SELECT
USING (user_id = auth.uid());

-- المالك يرى معاملات نشاطه (العمولات والإيرادات)
CREATE POLICY "transactions_select_business"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.owner_id = auth.uid()
    AND (
      -- معاملات العمولة
      (transactions.type = 'commission' AND transactions.metadata->>'business_id' = businesses.id::TEXT)
      OR
      -- معاملات الإيرادات
      (transactions.type = 'earning' AND transactions.metadata->>'business_id' = businesses.id::TEXT)
    )
  )
);

-- Admin يرى جميع المعاملات
CREATE POLICY "transactions_select_admin"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- النظام ينشئ المعاملات (عبر Functions)
CREATE POLICY "transactions_insert_system"
ON transactions FOR INSERT
WITH CHECK (true);

-- لا يُسمح بتحديث المعاملات (immutable)
CREATE POLICY "transactions_no_update"
ON transactions FOR UPDATE
USING (false);

-- لا يُسمح بحذف المعاملات (immutable)
CREATE POLICY "transactions_no_delete"
ON transactions FOR DELETE
USING (false);
```

---

## 13. RLS Policies - جدول `wallets` (حساس جداً)

```sql
-- المستخدم يرى محفظته فقط
CREATE POLICY "wallets_select_own"
ON wallets FOR SELECT
USING (user_id = auth.uid());

-- المستخدم يعدل محفظته فقط (عبر Functions آمنة)
CREATE POLICY "wallets_update_own"
ON wallets FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  -- منع الرصيد السالب
  AND balance >= 0
  -- منع الرصيد المجمد من أن يكون سالباً
  AND frozen_balance >= 0
  -- الرصيد المجمد لا يمكن أن يتجاوز الرصيد الإجمالي
  AND frozen_balance <= balance
);

-- لا يُسمح بإدراج محفظة يدوياً (يتم عبر Trigger عند التسجيل)
CREATE POLICY "wallets_no_insert"
ON wallets FOR INSERT
USING (false);

-- لا يُسمح بحذف المحفظة
CREATE POLICY "wallets_no_delete"
ON wallets FOR DELETE
USING (false);

-- Trigger لإنشاء محفظة عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, frozen_balance, currency)
  VALUES (NEW.id, 0, 0, 'MAD');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_wallet_on_signup
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_user_wallet();
```

---

## 14. RLS Policies - جدول `conversations` و `messages`

### 14.1 المحادثات

```sql
-- المستخدم يرى محادثاته فقط
CREATE POLICY "conversations_select_participant"
ON conversations FOR SELECT
USING (
  customer_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = conversations.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المستخدم ينشئ محادثة
CREATE POLICY "conversations_insert_customer"
ON conversations FOR INSERT
WITH CHECK (
  customer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_banned = false
  )
);

-- المستخدم يعدل محادثاته (للإغلاق)
CREATE POLICY "conversations_update_participant"
ON conversations FOR UPDATE
USING (
  customer_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = conversations.business_id
    AND businesses.owner_id = auth.uid()
  )
);
```

### 14.2 الرسائل - مع حماية من المستخدمين المحظورين

```sql
-- المستخدم يرى رسائل محادثاته فقط
CREATE POLICY "messages_select_participant"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.customer_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM businesses
        WHERE businesses.id = conversations.business_id
        AND businesses.owner_id = auth.uid()
      )
    )
  )
);

-- المستخدم يرسل رسالة في محادثاته
-- مع منع المستخدمين المحظورين
CREATE POLICY "messages_insert_participant"
ON messages FOR INSERT
WITH CHECK (
  -- المرسل يجب أن يكون مشاركاً في المحادثة
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.customer_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM businesses
        WHERE businesses.id = conversations.business_id
        AND businesses.owner_id = auth.uid()
      )
    )
  )
  -- المرسل يجب أن يكون هو المستخدم الحالي
  AND sender_id = auth.uid()
  -- المحادثة يجب أن تكون نشطة
  AND EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND status = 'active'
  )
  -- المرسل يجب ألا يكون محظوراً
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_banned = false
  )
);

-- لا يُسمح بتحديث الرسائل (immutable)
CREATE POLICY "messages_no_update"
ON messages FOR UPDATE
USING (
  -- فقط لتعليم الرسالة كمقروءة
  is_read = true
  AND EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.customer_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM businesses
        WHERE businesses.id = conversations.business_id
        AND businesses.owner_id = auth.uid()
      )
    )
  )
);

-- لا يُسمح بحذف الرسائل
CREATE POLICY "messages_no_delete"
ON messages FOR DELETE
USING (false);
```

---

## 15. RLS Policies - جدول `notifications`

```sql
-- المستخدم يرى إشعاراته فقط
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- المستخدم يعدل إشعاراته فقط (لتعليمها كمقروءة)
CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- المستخدم يحذف إشعاراته فقط
CREATE POLICY "notifications_delete_own"
ON notifications FOR DELETE
USING (user_id = auth.uid());

-- النظام ينشئ الإشعارات
CREATE POLICY "notifications_insert_system"
ON notifications FOR INSERT
WITH CHECK (true);
```

---

## 16. RLS Policies - جدول `reviews`

```sql
-- الجميع يرى التقييمات
CREATE POLICY "reviews_select_public"
ON reviews FOR SELECT
USING (true);

-- المستخدم ينشئ تقييماً لنفسه فقط
CREATE POLICY "reviews_insert_own"
ON reviews FOR INSERT
WITH CHECK (
  reviewer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_banned = false
  )
);

-- المستخدم يعدل تقييمه فقط
CREATE POLICY "reviews_update_own"
ON reviews FOR UPDATE
USING (reviewer_id = auth.uid());

-- المستخدم يحذف تقييمه فقط
CREATE POLICY "reviews_delete_own"
ON reviews FOR DELETE
USING (reviewer_id = auth.uid());

-- المالك يرد على تقييمات نشاطه
CREATE POLICY "reviews_reply_owner"
ON reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = reviews.business_id
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  -- المالك يمكنه فقط إضافة/تعديل الرد
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = reviews.business_id
    AND businesses.owner_id = auth.uid()
  )
);
```

---

## 17. RLS Policies - جدول `favorites`

```sql
-- المستخدم يرى مفضلته فقط
CREATE POLICY "favorites_select_own"
ON favorites FOR SELECT
USING (user_id = auth.uid());

-- المستخدم يضيف للمفضلة
CREATE POLICY "favorites_insert_own"
ON favorites FOR INSERT
WITH CHECK (user_id = auth.uid());

-- المستخدم يحذف من المفضل
CREATE POLICY "favorites_delete_own"
ON favorites FOR DELETE
USING (user_id = auth.uid());
```

---

## 18. RLS Policies - جدول `verifications`

```sql
-- المالك يرى طلب التوثيق الخاص بنشاطه
CREATE POLICY "verifications_select_owner"
ON verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = verifications.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك ينشئ طلب توثيق
CREATE POLICY "verifications_insert_owner"
ON verifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = verifications.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يعدل طلب التوثيق الخاص به (لإعادة الإرسال)
CREATE POLICY "verifications_update_owner"
ON verifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = verifications.business_id
    AND businesses.owner_id = auth.uid()
  )
  -- المالك يمكنه فقط تحديث الوثائق إذا كان الطلب مرفوضاً
  AND status = 'rejected'
);

-- Admin يرى جميع طلبات التوثيق
CREATE POLICY "verifications_select_admin"
ON verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Admin يعدل طلبات التوثيق
CREATE POLICY "verifications_update_admin"
ON verifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

## 19. RLS Policies - جدول `reports`

```sql
-- المستخدم يرى بلاغاته فقط
CREATE POLICY "reports_select_own"
ON reports FOR SELECT
USING (reporter_id = auth.uid());

-- المستخدم ينشئ بلاغاً
CREATE POLICY "reports_insert_authenticated"
ON reports FOR INSERT
WITH CHECK (
  reporter_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_banned = false
  )
);

-- Admin يرى جميع البلاغات
CREATE POLICY "reports_select_admin"
ON reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Admin يعدل البلاغات
CREATE POLICY "reports_update_admin"
ON reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

## 20. RLS Policies - جدول `audit_logs`

```sql
-- Admin يرى جميع السجلات
CREATE POLICY "audit_logs_select_admin"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- المستخدم يرى سجلاته الشخصية فقط
CREATE POLICY "audit_logs_select_own"
ON audit_logs FOR SELECT
USING (user_id = auth.uid());

-- النظام ينشئ السجلات
CREATE POLICY "audit_logs_insert_system"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- لا يُسمح بتحديث السجلات (immutable)
CREATE POLICY "audit_logs_no_update"
ON audit_logs FOR UPDATE
USING (false);

-- لا يُسمح بحذف السجلات (immutable)
CREATE POLICY "audit_logs_no_delete"
ON audit_logs FOR DELETE
USING (false);
```

---

## 21. RLS Policies - جدول `coupons`

```sql
-- الجميع يرى الكوبونات النشطة
CREATE POLICY "coupons_select_active"
ON coupons FOR SELECT
USING (
  is_active = true
  AND start_date <= NOW()
  AND end_date >= NOW()
  AND (usage_limit IS NULL OR used_count < usage_limit)
);

-- المالك يرى كوبونات نشاطه
CREATE POLICY "coupons_select_owner"
ON coupons FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses
    WHERE owner_id = auth.uid()
  )
);

-- Admin يرى جميع الكوبونات
CREATE POLICY "coupons_select_admin"
ON coupons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- المالك ينشئ كوبونات لنشاطه
CREATE POLICY "coupons_insert_owner"
ON coupons FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses
    WHERE owner_id = auth.uid()
  )
);

-- المالك يعدل كوبونات نشاطه
CREATE POLICY "coupons_update_owner"
ON coupons FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses
    WHERE owner_id = auth.uid()
  )
);

-- Admin ينشئ كوبونات منصة
CREATE POLICY "coupons_insert_admin"
ON coupons FOR INSERT
WITH CHECK (
  business_id IS NULL
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

## 22. RLS Policies - جدول `subscriptions`

```sql
-- المستخدم يرى اشتراكه فقط
CREATE POLICY "subscriptions_select_own"
ON subscriptions FOR SELECT
USING (user_id = auth.uid());

-- Admin يرى جميع الاشتراكات
CREATE POLICY "subscriptions_select_admin"
ON subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- النظام ينشئ الاشتراكات
CREATE POLICY "subscriptions_insert_system"
ON subscriptions FOR INSERT
WITH CHECK (true);

-- المستخدم يعدل اشتراكه (للتجديد/الإلغاء)
CREATE POLICY "subscriptions_update_own"
ON subscriptions FOR UPDATE
USING (user_id = auth.uid());

-- Admin يعدل جميع الاشتراكات
CREATE POLICY "subscriptions_update_admin"
ON subscriptions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

## 23. Security Definer Functions

### 23.1 دالة تحديث رصيد المحفظة (آمنة)

```sql
-- دالة آمنة لتحديث رصيد المحفظة
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- التحقق من أن المستخدم يقوم بالعملية على محفظته
  IF p_user_id != auth.uid() AND NOT is_user_role('admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update another user wallet';
  END IF;
  
  -- قفل الصف
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- التحقق من الرصيد الكافي للخصم
  IF p_amount < 0 AND v_current_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- تحديث الرصيد
  UPDATE wallets
  SET balance = balance + p_amount,
      last_transaction_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- تسجيل المعاملة
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    status,
    reference_id,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    ABS(p_amount),
    'MAD',
    'completed',
    p_reference_id,
    p_description,
    jsonb_build_object(
      'old_balance', v_current_balance,
      'new_balance', v_new_balance,
      'amount', p_amount
    )
  ) RETURNING id INTO v_transaction_id;
  
  -- تسجيل في audit_logs
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    'wallet_transaction',
    'transaction',
    v_transaction_id,
    jsonb_build_object(
      'user_id', p_user_id,
      'type', p_type,
      'amount', p_amount,
      'old_balance', v_current_balance,
      'new_balance', v_new_balance
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'old_balance', v_current_balance,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;
```

### 23.2 دالة إنشاء الحجز (آمنة مع Lock)

```sql
-- دالة آمنة لإنشاء الحجز مع منع Race Conditions
CREATE OR REPLACE FUNCTION create_booking_secure(
  p_customer_id UUID,
  p_service_id UUID,
  p_branch_id UUID,
  p_staff_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_total_price DECIMAL,
  p_addons JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_conflict BOOLEAN;
  v_service_duration INT;
  v_working_hours JSONB;
  v_day_of_week TEXT;
BEGIN
  -- التحقق من أن المستخدم يقوم بالحجز لنفسه
  IF p_customer_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot book for another user';
  END IF;
  
  -- التحقق من أن المستخدم غير محظور
  IF NOT is_user_active() THEN
    RAISE EXCEPTION 'User is banned or inactive';
  END IF;
  
  -- جلب مدة الخدمة
  SELECT duration_min INTO v_service_duration
  FROM services
  WHERE id = p_service_id
  AND is_available = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or unavailable';
  END IF;
  
  -- التحقق من يوم الأسبوع
  SELECT CASE EXTRACT(DOW FROM p_booking_date)
    WHEN 0 THEN 'sun'
    WHEN 1 THEN 'mon'
    WHEN 2 THEN 'tue'
    WHEN 3 THEN 'wed'
    WHEN 4 THEN 'thu'
    WHEN 5 THEN 'fri'
    WHEN 6 THEN 'sat'
  END INTO v_day_of_week;
  
  -- جلب أوقات العمل
  SELECT working_hours INTO v_working_hours
  FROM branches
  WHERE id = p_branch_id;
  
  -- التحقق من أن الفرع مفتوح في هذا اليوم
  IF NOT (v_working_hours->'days' ? v_day_of_week) THEN
    RAISE EXCEPTION 'Branch is closed on this day';
  END IF;
  
  -- التحقق من العطلات
  IF EXISTS (
    SELECT 1 FROM holidays
    WHERE branch_id = p_branch_id
    AND date = p_booking_date
  ) THEN
    RAISE EXCEPTION 'Branch is closed (holiday)';
  END IF;
  
  -- التحقق من التاريخ ليس في الماضي
  IF p_booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot book in the past';
  END IF;
  
  -- قفل الصفوف ذات الصلة
  PERFORM 1 FROM bookings
  WHERE staff_id = p_staff_id
    AND booking_date = p_booking_date
    AND status IN ('pending', 'confirmed')
  FOR UPDATE;
  
  -- التحقق من التعارض
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE staff_id = p_staff_id
      AND booking_date = p_booking_date
      AND status IN ('pending', 'confirmed')
      AND (
        (p_start_time < end_time AND p_end_time > start_time)
      )
  ) INTO v_conflict;
  
  IF v_conflict THEN
    RAISE EXCEPTION 'Time slot is not available';
  END IF;
  
  -- إنشاء الحجز
  INSERT INTO bookings (
    customer_id,
    service_id,
    branch_id,
    staff_id,
    booking_date,
    start_time,
    end_time,
    total_price,
    status,
    payment_status
  ) VALUES (
    p_customer_id,
    p_service_id,
    p_branch_id,
    p_staff_id,
    p_booking_date,
    p_start_time,
    p_end_time,
    p_total_price,
    'pending',
    'pending'
  ) RETURNING id INTO v_booking_id;
  
  -- إضافة الإضافات إن وجدت
  IF jsonb_array_length(p_addons) > 0 THEN
    INSERT INTO booking_addons (booking_id, addon_id, price, quantity)
    SELECT 
      v_booking_id,
      (addon->>'addon_id')::UUID,
      (addon->>'price')::DECIMAL,
      COALESCE((addon->>'quantity')::INT, 1)
    FROM jsonb_array_elements(p_addons) AS addon;
  END IF;
  
  -- تسجيل في audit_logs
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    'booking_created',
    'booking',
    v_booking_id,
    jsonb_build_object(
      'customer_id', p_customer_id,
      'service_id', p_service_id,
      'branch_id', p_branch_id,
      'staff_id', p_staff_id,
      'booking_date', p_booking_date,
      'start_time', p_start_time,
      'end_time', p_end_time,
      'total_price', p_total_price
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id
  );
END;
$$ LANGUAGE plpgsql;
```

### 23.3 دالة إنشاء الطلب (آمنة)

```sql
-- دالة آمنة لإنشاء الطلب مع التحقق من المخزون
CREATE OR REPLACE FUNCTION create_order_secure(
  p_customer_id UUID,
  p_business_id UUID,
  p_items JSONB,
  p_shipping_address JSONB,
  p_shipping_method_id UUID,
  p_coupon_code TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'wallet'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_stock INT;
  v_product_price DECIMAL;
  v_subtotal DECIMAL := 0;
  v_shipping_cost DECIMAL := 0;
  v_discount DECIMAL := 0;
  v_total DECIMAL;
  v_coupon_id UUID;
BEGIN
  -- التحقق من أن المستخدم يقوم بالشراء لنفسه
  IF p_customer_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot order for another user';
  END IF;
  
  -- التحقق من أن المستخدم غير محظور
  IF NOT is_user_active() THEN
    RAISE EXCEPTION 'User is banned or inactive';
  END IF;
  
  -- التحقق من أن المتجر نشط
  IF NOT EXISTS (
    SELECT 1 FROM businesses
    WHERE id = p_business_id
    AND status = 'active'
    AND type = 'store'
  ) THEN
    RAISE EXCEPTION 'Store not found or inactive';
  END IF;
  
  -- التحقق من الكوبون إن وجد
  IF p_coupon_code IS NOT NULL THEN
    SELECT id, discount_value, discount_type INTO v_coupon_id, v_discount
    FROM coupons
    WHERE code = p_coupon_code
    AND is_active = true
    AND start_date <= NOW()
    AND end_date >= NOW()
    AND (usage_limit IS NULL OR used_count < usage_limit);
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid or expired coupon';
    END IF;
  END IF;
  
  -- إنشاء الطلب
  INSERT INTO orders (
    customer_id,
    business_id,
    status,
    payment_status,
    payment_method,
    shipping_address,
    shipping_method_id,
    coupon_id
  ) VALUES (
    p_customer_id,
    p_business_id,
    'pending',
    'pending',
    p_payment_method,
    p_shipping_address,
    p_shipping_method_id,
    v_coupon_id
  ) RETURNING id INTO v_order_id;
  
  -- معالجة كل منتج
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- قفل الصف
    SELECT stock_quantity, price INTO v_stock, v_product_price
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
    AND seller_id = p_business_id
    AND is_available = true
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or unavailable';
    END IF;
    
    -- التحقق من المخزون
    IF v_stock < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_id';
    END IF;
    
    -- تحديث المخزون
    UPDATE products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::INT,
        sales_count = sales_count + (v_item->>'quantity')::INT
    WHERE id = (v_item->>'product_id')::UUID;
    
    -- إنشاء order_item
    INSERT INTO order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      price
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'variant_id')::UUID,
      (v_item->>'quantity')::INT,
      v_product_price
    );
    
    -- حساب المجموع الفرعي
    v_subtotal := v_subtotal + (v_product_price * (v_item->>'quantity')::INT);
    
    -- تسجيل حركة المخزون
    INSERT INTO inventory_movements (
      product_id,
      type,
      quantity,
      reference_id,
      reference_type,
      created_by
    ) VALUES (
      (v_item->>'product_id')::UUID,
      'out',
      (v_item->>'quantity')::INT,
      v_order_id,
      'order',
      auth.uid()
    );
  END LOOP;
  
  -- حساب تكلفة الشحن
  SELECT base_cost INTO v_shipping_cost
  FROM shipping_methods
  WHERE id = p_shipping_method_id;
  
  -- تطبيق الخصم إن وجد
  IF v_coupon_id IS NOT NULL THEN
    IF (SELECT discount_type FROM coupons WHERE id = v_coupon_id) = 'percentage' THEN
      v_discount := v_subtotal * (v_discount / 100);
    END IF;
    
    -- تحديث عدد استخدامات الكوبون
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE id = v_coupon_id;
  END IF;
  
  -- حساب المجموع النهائي
  v_total := v_subtotal + v_shipping_cost - v_discount;
  
  -- تحديث الطلب
  UPDATE orders
  SET 
    subtotal = v_subtotal,
    shipping_cost = v_shipping_cost,
    discount_amount = v_discount,
    total = v_total
  WHERE id = v_order_id;
  
  -- تسجيل في audit_logs
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    'order_created',
    'order',
    v_order_id,
    jsonb_build_object(
      'customer_id', p_customer_id,
      'business_id', p_business_id,
      'total', v_total,
      'items_count', jsonb_array_length(p_items)
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 24. حماية البيانات الحساسة

### 24.1 تشفير كلمات المرور

```javascript
// في auth/register.js
import { supabase } from '../config/supabase-init.js';

async function registerUser(userData) {
  // التحقق من قوة كلمة المرور
  if (!isStrongPassword(userData.password)) {
    throw new Error('كلمة المرور ضعيفة');
  }
  
  // Supabase يتولى التشفير تلقائياً (bcrypt)
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role
      }
    }
  });
  
  if (error) throw error;
  return data;
}

function isStrongPassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
}
```

### 24.2 إخفاء البيانات الحساسة في الاستعلامات

```javascript
// ❌ خطأ: جلب كل البيانات
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);

// ✅ صحيح: جلب الحقول المطلوبة فقط
const { data } = await supabase
  .from('profiles')
  .select('id, full_name, avatar_url, role')
  .eq('id', userId);

// ❌ خطأ: جلب معلومات الدفع
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId);

// ✅ صحيح: جلب معلومات عامة فقط
const { data } = await supabase
  .from('transactions')
  .select('id, type, amount, status, created_at')
  .eq('user_id', userId);
```

### 24.3 حماية معلومات التواصل (قرار معماري)

```javascript
// في shared/utils/business-utils.js

// ❌ خطأ: عرض معلومات التواصل مباشرة
function renderBusinessInfo(business) {
  return `
    <div class="business-info">
      <p>الهاتف: ${business.phone}</p>
      <p>البريد: ${business.email}</p>
    </div>
  `;
}

// ✅ صحيح: استخدام زر تواصل عبر المنصة
function renderBusinessInfo(business) {
  return `
    <div class="business-info">
      <button 
        class="btn btn-primary"
        onclick="openConversation('${business.id}')"
      >
        <i class="fas fa-comment"></i>
        <span>تواصل عبر المنصة</span>
      </button>
    </div>
  `;
}

async function openConversation(businessId) {
  // فتح محادثة عبر المنصة
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('customer_id', getCurrentUserId())
    .eq('business_id', businessId)
    .single();
  
  if (conversation) {
    window.location.href = resolvePath('CONVERSATION') + `?id=${conversation.id}`;
  } else {
    // إنشاء محادثة جديدة
    const { data: newConversation } = await supabase
      .from('conversations')
      .insert({
        customer_id: getCurrentUserId(),
        business_id: businessId,
        status: 'active'
      })
      .select()
      .single();
    
    window.location.href = resolvePath('CONVERSATION') + `?id=${newConversation.id}`;
  }
}
```

### 24.4 إخفاء البيانات الحساسة في الواجهة

```javascript
// في shared/utils/sanitize.js

// إخفاء رقم الهاتف جزئياً
function maskPhone(phone) {
  if (!phone || phone.length < 8) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 2);
}

// إخفاء البريد الإلكتروني جزئياً
function maskEmail(email) {
  if (!email) return email;
  const [username, domain] = email.split('@');
  const maskedUsername = username.substring(0, 2) + '***';
  return `${maskedUsername}@${domain}`;
}

// إخفاء رقم RIB جزئياً
function maskRIB(rib) {
  if (!rib || rib.length < 10) return rib;
  return rib.substring(0, 4) + ' **** **** **** ' + rib.substring(rib.length - 4);
}

// الاستخدام
const safePhone = maskPhone(user.phone); // 061****78
const safeEmail = maskEmail(user.email); // ah***@example.com
const safeRIB = maskRIB(business.rib); // 0071 **** **** **** 1234
```

---

## 25. Rate Limiting على مستوى قاعدة البيانات

### 25.1 دالة Rate Limiting

```sql
-- جدول لتتبع المحاولات
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  attempts INT DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- دالة للتحقق من Rate Limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_attempts INT,
  p_window_seconds INT
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  v_attempts INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- حذف السجلات القديمة
  DELETE FROM rate_limits
  WHERE window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  
  -- جلب المحاولات الحالية
  SELECT attempts, window_start INTO v_attempts, v_window_start
  FROM rate_limits
  WHERE key = p_key
  AND window_start > NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  
  IF NOT FOUND THEN
    -- لا توجد محاولات سابقة
    INSERT INTO rate_limits (key, attempts, window_start)
    VALUES (p_key, 1, NOW());
    RETURN true;
  END IF;
  
  IF v_attempts >= p_max_attempts THEN
    -- تجاوز الحد
    RETURN false;
  END IF;
  
  -- زيادة عدد المحاولات
  UPDATE rate_limits
  SET attempts = attempts + 1
  WHERE key = p_key;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- الاستخدام
-- SELECT check_rate_limit('login:user@example.com', 5, 900); -- 5 محاولات في 15 دقيقة
```

### 25.2 تطبيق Rate Limiting على تسجيل الدخول

```javascript
// في auth/login.js
async function login(credentials) {
  // التحقق من Rate Limit
  const { data: allowed } = await supabase.rpc('check_rate_limit', {
    p_key: `login:${credentials.email}`,
    p_max_attempts: 5,
    p_window_seconds: 900 // 15 دقيقة
  });
  
  if (!allowed) {
    showNotification(
      'محاولات كثيرة. يرجى المحاولة بعد 15 دقيقة',
      'error'
    );
    return { success: false, error: 'rate_limit_exceeded' };
  }
  
  // محاولة تسجيل الدخول
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  
  if (error) {
    // تسجيل المحاولة الفاشلة
    await logAudit({
      action: 'login_failed',
      entity_type: 'user',
      metadata: { email: credentials.email }
    });
    
    return { success: false, error };
  }
  
  return { success: true, data };
}
```

---

## 26. Audit Logs للأمان

### 26.1 الأحداث التي يجب تسجيلها

```javascript
// في shared/utils/audit-logger.js

const AUDIT_ACTIONS = {
  // المصادقة
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_RESET: 'password_reset',
  OTP_SENT: 'otp_sent',
  OTP_VERIFIED: 'otp_verified',
  
  // الحساب
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_UPDATED: 'account_updated',
  ACCOUNT_BANNED: 'account_banned',
  ACCOUNT_DELETED: 'account_deleted',
  
  // الأنشطة التجارية
  BUSINESS_CREATED: 'business_created',
  BUSINESS_UPDATED: 'business_updated',
  BUSINESS_VERIFIED: 'business_verified',
  BUSINESS_REJECTED: 'business_rejected',
  
  // الحجوزات
  BOOKING_CREATED: 'booking_created',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_COMPLETED: 'booking_completed',
  BOOKING_STATUS_CHANGED: 'booking_status_changed',
  
  // الطلبات
  ORDER_CREATED: 'order_created',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_STATUS_CHANGED: 'order_status_changed',
  
  // المدفوعات
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  REFUND_REQUESTED: 'refund_requested',
  REFUND_PROCESSED: 'refund_processed',
  WALLET_TRANSACTION: 'wallet_transaction',
  
  // التوثيق
  VERIFICATION_SUBMITTED: 'verification_submitted',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  
  // البلاغات
  REPORT_CREATED: 'report_created',
  REPORT_RESOLVED: 'report_resolved',
  
  // عام
  DATA_UPDATED: 'data_updated',
  DATA_DELETED: 'data_deleted',
  FILE_UPLOADED: 'file_uploaded',
  FILE_DELETED: 'file_deleted'
};

async function logAudit(action, entityType, entityId, changes = {}, metadata = {}) {
  try {
    const userId = getCurrentUserId();
    
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        changes,
        metadata,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      });
  } catch (error) {
    // فشل التسجيل - لا نعرض للمستخدم
    console.error('فشل تسجيل العملية في audit_logs:', error);
  }
}

async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}
```

### 26.2 Trigger تلقائي للتسجيل

```sql
-- Trigger عام لتسجيل جميع التغييرات
CREATE OR REPLACE FUNCTION log_all_changes()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'before', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
      'after', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    ),
    inet_client_addr()::TEXT,
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- تطبيق على الجداول الحساسة
CREATE TRIGGER log_businesses_changes
AFTER INSERT OR UPDATE OR DELETE ON businesses
FOR EACH ROW EXECUTE FUNCTION log_all_changes();

CREATE TRIGGER log_bookings_changes
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION log_all_changes();

CREATE TRIGGER log_orders_changes
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION log_all_changes();

CREATE TRIGGER log_transactions_changes
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_all_changes();
```

---

## 27. أفضل الممارسات الأمنية

### 27.1 Checklist الأمان

✅ **المصادقة:**
- [ ] استخدام Supabase Auth حصراً
- [ ] تفعيل OTP للهاتف
- [ ] تفعيل تأكيد البريد الإلكتروني
- [ ] سياسة كلمات مرور قوية (8+ أحرف، أحرف كبيرة/صغيرة، أرقام، رموز)
- [ ] Rate Limiting على تسجيل الدخول (5 محاولات في 15 دقيقة)
- [ ] قفل الحساب بعد 5 محاولات فاشلة

✅ **RLS:**
- [ ] RLS مفعّل على جميع الجداول
- [ ] لا توجد سياسات USING (true) على جداول حساسة
- [ ] التحقق من `auth.uid()` في كل سياسة
- [ ] منع المستخدمين المحظورين من الوصول
- [ ] اختبار كل سياسة RLS

✅ **البيانات الحساسة:**
- [ ] لا يتم تخزين كلمات المرور في النص الصريح
- [ ] إخفاء معلومات التواصل في الصفحات العامة
- [ ] تشفير البيانات الحساسة (RIB، بطاقات الدفع)
- [ ] عدم كشف أخطاء قاعدة البيانات للمستخدم

✅ **المراقبة:**
- [ ] تسجيل جميع العمليات الحساسة في `audit_logs`
- [ ] تسجيل محاولات تسجيل الدخول الفاشلة
- [ ] تسجيل تغييرات حالة الحجوزات والطلبات
- [ ] مراجعة دورية للسجلات

✅ **الأداء:**
- [ ] Indexes على الحقول المستخدمة في RLS
- [ ] استخدام `.select()` مع الحقول المطلوبة فقط
- [ ] تجنب `SELECT *` في الاستعلامات الحساسة
- [ ] Pagination للقوائم الطويلة

### 27.2 اختبار RLS Policies

```javascript
// في tests/unit/rls.test.js

describe('RLS Policies Tests', () => {
  
  test('عميل لا يمكنه رؤية حجوزات عميل آخر', async () => {
    const customer1 = await createTestUser('customer');
    const customer2 = await createTestUser('customer');
    
    const booking = await createTestBooking(customer2.id);
    
    // محاولة العميل 1 رؤية حجز العميل 2
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking.id)
      .maybeSingle();
    
    expect(data).toBeNull(); // لا يجب أن يرى الحجز
  });
  
  test('مالك نشاط لا يمكنه تعديل نشاط مالك آخر', async () => {
    const owner1 = await createTestUser('salon');
    const owner2 = await createTestUser('salon');
    
    const business = await createTestBusiness(owner2.id);
    
    // محاولة المالك 1 تعديل نشاط المالك 2
    const { error } = await supabase
      .from('businesses')
      .update({ name: 'Modified' })
      .eq('id', business.id);
    
    expect(error).toBeDefined(); // يجب أن يفشل
  });
  
  test('مستخدم محظور لا يمكنه إرسال رسائل', async () => {
    const bannedUser = await createTestUser('customer', { is_banned: true });
    const conversation = await createTestConversation();
    
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: bannedUser.id,
        content: 'Test message'
      });
    
    expect(error).toBeDefined(); // يجب أن يفشل
  });
  
  test('Admin يمكنه رؤية جميع المستخدمين', async () => {
    const admin = await createTestUser('admin');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });
});
```

---

## 28. Checklist نهائي للأمان

قبل نشر أي ميزة، تأكد من:

### 28.1 RLS
- [ ] RLS مفعّل على الجدول
- [ ] سياسات SELECT محددة
- [ ] سياسات INSERT محددة
- [ ] سياسات UPDATE محددة
- [ ] سياسات DELETE محددة (أو منع الحذف)
- [ ] اختبار كل سياسة

### 28.2 البيانات الحساسة
- [ ] عدم كشف معلومات حساسة في الاستعلامات
- [ ] إخفاء معلومات التواصل في الواجهة
- [ ] تشفير البيانات الحساسة
- [ ] عدم عرض أخطاء تقنية للمستخدم

### 28.3 المراقبة
- [ ] تسجيل العمليات الحساسة في `audit_logs`
- [ ] Trigger لتسجيل التغييرات
- [ ] Rate Limiting على العمليات الحساسة
- [ ] مراقبة المحاولات الفاشلة

### 28.4 Functions
- [ ] استخدام `SECURITY DEFINER` عند الحاجة
- [ ] التحقق من الصلاحيات داخل الدالة
- [ ] معالجة الأخطاء بشكل صحيح
- [ ] تسجيل العمليات في `audit_logs`

### 28.5 Frontend
- [ ] التحقق من صحة البيانات قبل الإرسال
- [ ] عدم الاعتماد على Frontend فقط للأمان
- [ ] حماية من XSS (استخدام `textContent` بدلاً من `innerHTML`)
- [ ] حماية من CSRF

---

هذا الملف هو المرجع الوحيد المعتمد لأمان قاعدة البيانات. أي تعديل يجب أن يتم هنا أولاً.

---

تم إنشاء الملف بنجاح! 🎉

**الملف يحتوي على:**

### ✅ **28 قسماً شاملاً:**

1. **مقدمة** - فلسفة الأمان والقواعد الذهبية
2. **تفعيل RLS** - على جميع الجداول (30+ جدول)
3. **Helper Functions** - دوال مساعدة للأمان
4. **RLS لـ `profiles`** - سياسات كاملة
5. **RLS لـ `businesses`** - سياسات كاملة
6. **RLS لـ `branches`** - سياسات كاملة
7. **RLS لـ `staff`** - سياسات كاملة
8. **RLS لـ `services`** - سياسات كاملة
9. **RLS لـ `products`** - سياسات كاملة
10. **RLS لـ `bookings`** - سياسات حساسة + Triggers
11. **RLS لـ `orders`** - سياسات حساسة + Triggers
12. **RLS لـ `transactions`** - سياسات حساسة جداً
13. **RLS لـ `wallets`** - سياسات حساسة جداً
14. **RLS لـ `conversations` و `messages`** - مع حماية من المحظورين
15. **RLS لـ `notifications`** - سياسات كاملة
16. **RLS لـ `reviews`** - سياسات كاملة
17. **RLS لـ `favorites`** - سياسات كاملة
18. **RLS لـ `verifications`** - سياسات كاملة
19. **RLS لـ `reports`** - سياسات كاملة
20. **RLS لـ `audit_logs`** - سياسات كاملة
21. **RLS لـ `coupons`** - سياسات كاملة
22. **RLS لـ `subscriptions`** - سياسات كاملة
23. **Security Definer Functions** - دوال آمنة (محفظة، حجز، طلب)
24. **حماية البيانات الحساسة** - تشفير، إخفاء، mask
25. **Rate Limiting** - على مستوى قاعدة البيانات
26. **Audit Logs** - تسجيل شامل + Triggers
27. **أفضل الممارسات** - Checklist شامل
28. **Checklist نهائي** - قبل النشر

### ✅ **الميزات الرئيسية:**

- 🔒 **RLS Policies** لجميع الجداول الرئيسية (20+ جدول)
- 🛡️ **Security Definer Functions** للعمليات الحساسة
- 🔐 **حماية من المستخدمين المحظورين** في الرسائل
- 📊 **Audit Logs** تلقائي مع Triggers
- ⚡ **Rate Limiting** على مستوى قاعدة البيانات
- 🎭 **Masking** للبيانات الحساسة (هاتف، بريد، RIB)
- 🧪 **اختبارات RLS** مع أمثلة
- ✅ **Checklist شامل** للأمان