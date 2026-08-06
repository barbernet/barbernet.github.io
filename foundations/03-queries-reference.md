# مرجع الاستعلامات (Queries Reference) - BarberFlow Pro

هذا الملف يوثق جميع الاستعلامات الشائعة، RLS Policies، و Indexes المطلوبة.
جميع الاستعلامات يجب أن تلتزم بهذه المراجع لضمان الأداء والأمان.

---

## 1. الاستعلامات الشائعة (Common Queries)

### 1.1 جلب صالون مع كل بياناته

```javascript
// جلب صالون مع الفروع، الخدمات، والموظفين
async function getSalonDetails(salonId) {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      branches(*),
      services(
        *,
        category:categories(*)
      ),
      staff(
        *,
        services:staff_services(
          service:services(*)
        )
      )
    `)
    .eq('id', salonId)
    .eq('type', 'salon')
    .eq('status', 'active')
    .is('deleted_at', null)
    .single();
  
  if (error) throw error;
  return data;
}
```

### 1.2 جلب متجر مع منتجاته

```javascript
// جلب متجر مع المنتجات والفئات
async function getStoreDetails(storeId) {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      products(
        *,
        category:categories(*),
        variants:product_variants(*)
      )
    `)
    .eq('id', storeId)
    .eq('type', 'store')
    .eq('status', 'active')
    .is('deleted_at', null)
    .single();
  
  if (error) throw error;
  return data;
}
```

### 1.3 جلب المنتجات مع التقييمات

```javascript
// ملاحظة: لا يوجد rating في products!
// يجب حسابه من reviews
async function getProductsWithRatings(storeId) {
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      reviews(rating)
    `)
    .eq('seller_id', storeId)
    .eq('is_available', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // حساب التقييم لكل منتج
  return products.map(product => {
    const ratings = product.reviews.map(r => r.rating);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;
    
    return {
      ...product,
      avg_rating: avgRating,
      reviews_count: ratings.length,
      reviews: undefined // إزالة المصفوفة لتقليل الحجم
    };
  });
}
```

### 1.4 جلب الأوقات المتاحة للحجز

```javascript
// جلب الأوقات المتاحة لخدمة معينة
async function getAvailableSlots(branchId, date, serviceId, staffId) {
  // 1. جلب الخدمة
  const { data: service } = await supabase
    .from('services')
    .select('duration_min')
    .eq('id', serviceId)
    .single();
  
  // 2. جلب أوقات العمل للفرع في هذا اليوم
  const dayOfWeek = getDayOfWeek(date); // 'sun', 'mon', etc.
  const { data: branch } = await supabase
    .from('branches')
    .select('working_hours')
    .eq('id', branchId)
    .single();
  
  const workingHours = branch.working_hours;
  
  // التحقق من أن الفرع مفتوح في هذا اليوم
  if (!workingHours.days.includes(dayOfWeek)) {
    return { available: false, reason: 'الصالون مغلق في هذا اليوم' };
  }
  
  // 3. التحقق من العطلات
  const { data: holidays } = await supabase
    .from('holidays')
    .select('*')
    .eq('branch_id', branchId)
    .eq('date', date);
  
  if (holidays.length > 0) {
    return { available: false, reason: 'عطلة' };
  }
  
  // 4. جلب الحجوزات الموجودة
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('branch_id', branchId)
    .eq('staff_id', staffId)
    .eq('booking_date', date)
    .in('status', ['pending', 'confirmed']);
  
  // 5. حساب الأوقات المتاحة
  const slots = [];
  const openTime = timeToMinutes(workingHours.open);
  const closeTime = timeToMinutes(workingHours.close);
  const duration = service.duration_min;
  
  for (let time = openTime; time + duration <= closeTime; time += 30) {
    const startTime = minutesToTime(time);
    const endTime = minutesToTime(time + duration);
    
    // التحقق من عدم التعارض مع الحجوزات الموجودة
    const isAvailable = !existingBookings.some(booking => {
      const bookingStart = timeToMinutes(booking.start_time);
      const bookingEnd = timeToMinutes(booking.end_time);
      return (time < bookingEnd && (time + duration) > bookingStart);
    });
    
    if (isAvailable) {
      slots.push({
        start_time: startTime,
        end_time: endTime,
        available: true
      });
    }
  }
  
  return { available: true, slots };
}

// دوال مساعدة
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function getDayOfWeek(date) {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date(date).getDay()];
}
```

### 1.5 جلب طلبات المستخدم

```javascript
// جلب طلبات العميل
async function getCustomerOrders(customerId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      business:businesses(name, logo_url),
      items:order_items(
        *,
        product:products(name, image_url)
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

### 1.6 جلب حجوزات المستخدم

```javascript
// جلب حجوزات العميل
async function getCustomerBookings(customerId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      service:services(name, price),
      business:businesses(name, logo_url),
      staff:staff(full_name, avatar_url),
      branch:branches(name)
    `)
    .eq('customer_id', customerId)
    .order('booking_date', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

### 1.7 جلب المحادثات

```javascript
// جلب محادثات المستخدم
async function getUserConversations(userId) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      business:businesses(name, logo_url),
      last_message:messages(
        content,
        created_at,
        sender_id
      ).order(created_at, { ascending: false }).limit(1)
    `)
    .eq('customer_id', userId)
    .order('last_message_at', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

### 1.8 جلب رسائل محادثة

```javascript
// جلب رسائل محادثة معينة
async function getConversationMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles(full_name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}
```

### 1.9 جلب إشعارات المستخدم

```javascript
// جلب إشعارات المستخدم
async function getUserNotifications(userId, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}
```

### 1.10 جلب إحصائيات لوحة التحكم

```javascript
// جلب إحصائيات للوحة التحكم
async function getDashboardStats(businessId) {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);
  
  // عدد الحجوزات اليوم
  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('business_id', businessId)
    .eq('booking_date', today);
  
  // عدد الطلبات اليوم
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('id, total')
    .eq('business_id', businessId)
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`);
  
  // إيرادات الشهر
  const { data: monthlyOrders } = await supabase
    .from('orders')
    .select('total')
    .eq('business_id', businessId)
    .gte('created_at', `${thisMonth}-01`)
    .eq('payment_status', 'paid');
  
  const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + o.total, 0);
  
  return {
    today_bookings: todayBookings.length,
    today_orders: todayOrders.length,
    today_revenue: todayOrders.reduce((sum, o) => sum + o.total, 0),
    monthly_revenue: monthlyRevenue
  };
}
```

---

## 2. RLS Policies (Row Level Security)

### 2.1 جدول `profiles`

```sql
-- المستخدم يرى بياناته فقط
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- المستخدم يعدل بياناته فقط
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Admin يمكنه رؤية جميع المستخدمين
CREATE POLICY "Admin can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Admin يمكنه تعديل أي مستخدم
CREATE POLICY "Admin can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### 2.2 جدول `businesses`

```sql
-- الجميع يرى الأنشطة النشطة
CREATE POLICY "Public can view active businesses"
ON businesses FOR SELECT
USING (status = 'active' AND deleted_at IS NULL);

-- المالك يرى نشاطه حتى لو غير نشط
CREATE POLICY "Owner can view own business"
ON businesses FOR SELECT
USING (owner_id = auth.uid());

-- المالك يعدل نشاطه فقط
CREATE POLICY "Owner can update own business"
ON businesses FOR UPDATE
USING (owner_id = auth.uid());

-- المالك يحذف نشاطه فقط (Soft Delete)
CREATE POLICY "Owner can delete own business"
ON businesses FOR DELETE
USING (owner_id = auth.uid());

-- Admin يمكنه رؤية جميع الأنشطة
CREATE POLICY "Admin can view all businesses"
ON businesses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Admin يمكنه تعديل أي نشاط
CREATE POLICY "Admin can update all businesses"
ON businesses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### 2.3 جدول `branches`

```sql
-- الجميع يرى فروع الأنشطة النشطة
CREATE POLICY "Public can view branches of active businesses"
ON branches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.status = 'active'
    AND businesses.deleted_at IS NULL
  )
);

-- المالك يرى فروع نشاطه
CREATE POLICY "Owner can view own branches"
ON branches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يعدل فروع نشاطه فقط
CREATE POLICY "Owner can update own branches"
ON branches FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يحذف فروع نشاطه فقط
CREATE POLICY "Owner can delete own branches"
ON branches FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  )
);
```

### 2.4 جدول `staff`

```sql
-- الجميع يرى موظفي الأنشطة النشطة
CREATE POLICY "Public can view staff of active businesses"
ON staff FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = staff.business_id
    AND businesses.status = 'active'
    AND businesses.deleted_at IS NULL
  )
);

-- المالك يرى موظفي نشاطه
CREATE POLICY "Owner can view own staff"
ON staff FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = staff.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يعدل موظفي نشاطه فقط
CREATE POLICY "Owner can update own staff"
ON staff FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = staff.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يحذف موظفي نشاطه فقط
CREATE POLICY "Owner can delete own staff"
ON staff FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = staff.business_id
    AND businesses.owner_id = auth.uid()
  )
);
```

### 2.5 جدول `services`

```sql
-- الجميع يرى خدمات الأنشطة النشطة
CREATE POLICY "Public can view services of active businesses"
ON services FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = services.business_id
    AND businesses.status = 'active'
    AND businesses.deleted_at IS NULL
  )
);

-- المالك يرى خدمات نشاطه
CREATE POLICY "Owner can view own services"
ON services FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = services.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يعدل خدمات نشاطه فقط
CREATE POLICY "Owner can update own services"
ON services FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = services.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يحذف خدمات نشاطه فقط
CREATE POLICY "Owner can delete own services"
ON services FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = services.business_id
    AND businesses.owner_id = auth.uid()
  )
);
```

### 2.6 جدول `products`

```sql
-- الجميع يرى منتجات المتاجر النشطة
CREATE POLICY "Public can view products of active stores"
ON products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.seller_id
    AND businesses.status = 'active'
    AND businesses.deleted_at IS NULL
  )
);

-- المالك يرى منتجات متجره
CREATE POLICY "Owner can view own products"
ON products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.seller_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يعدل منتجات متجره فقط
CREATE POLICY "Owner can update own products"
ON products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.seller_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يحذف منتجات متجره فقط
CREATE POLICY "Owner can delete own products"
ON products FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.seller_id
    AND businesses.owner_id = auth.uid()
  )
);
```

### 2.7 جدول `bookings`

```sql
-- العميل يرى حجوزاته فقط
CREATE POLICY "Customers can view own bookings"
ON bookings FOR SELECT
USING (customer_id = auth.uid());

-- المالك يرى حجوزات نشاطه
CREATE POLICY "Owner can view bookings of own business"
ON bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = bookings.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- العميل ينشئ حجزاً لنفسه
CREATE POLICY "Customers can create own bookings"
ON bookings FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- المالك يعدل حجوزات نشاطه فقط
CREATE POLICY "Owner can update bookings of own business"
ON bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = bookings.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- العميل يعدل حجوزه فقط
CREATE POLICY "Customers can update own bookings"
ON bookings FOR UPDATE
USING (customer_id = auth.uid());
```

### 2.8 جدول `orders`

```sql
-- العميل يرى طلباته فقط
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
USING (customer_id = auth.uid());

-- المالك يرى طلبات متجره
CREATE POLICY "Owner can view orders of own business"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = orders.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- العميل ينشئ طلباً لنفسه
CREATE POLICY "Customers can create own orders"
ON orders FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- المالك يعدل طلبات متجره فقط
CREATE POLICY "Owner can update orders of own business"
ON orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = orders.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- العميل يعدل طلبه فقط
CREATE POLICY "Customers can update own orders"
ON orders FOR UPDATE
USING (customer_id = auth.uid());
```

### 2.9 جدول `transactions`

```sql
-- المستخدم يرى معاملاته فقط
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (user_id = auth.uid());

-- Admin يرى جميع المعاملات
CREATE POLICY "Admin can view all transactions"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### 2.10 جدول `wallets`

```sql
-- المستخدم يرى محفظته فقط
CREATE POLICY "Users can view own wallet"
ON wallets FOR SELECT
USING (user_id = auth.uid());

-- المستخدم يعدل محفظته فقط
CREATE POLICY "Users can update own wallet"
ON wallets FOR UPDATE
USING (user_id = auth.uid());
```

### 2.11 جدول `conversations`

```sql
-- المستخدم يرى محادثاته فقط
CREATE POLICY "Users can view own conversations"
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
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (customer_id = auth.uid());
```

### 2.12 جدول `messages`

```sql
-- المستخدم يرى رسائل محادثاته فقط
CREATE POLICY "Users can view messages of own conversations"
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
CREATE POLICY "Users can insert messages in own conversations"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND
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
```

### 2.13 جدول `notifications`

```sql
-- المستخدم يرى إشعاراته فقط
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- المستخدم يعدل إشعاراته فقط
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- النظام ينشئ إشعارات
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);
```

### 2.14 جدول `reviews`

```sql
-- الجميع يرى التقييمات
CREATE POLICY "Public can view reviews"
ON reviews FOR SELECT
USING (true);

-- المستخدم ينشئ تقييماً لنفسه
CREATE POLICY "Users can create own reviews"
ON reviews FOR INSERT
WITH CHECK (reviewer_id = auth.uid());

-- المستخدم يعدل تقييمه فقط
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
USING (reviewer_id = auth.uid());

-- المستخدم يحذف تقييمه فقط
CREATE POLICY "Users can delete own reviews"
ON reviews FOR DELETE
USING (reviewer_id = auth.uid());

-- المالك يرد على تقييمات نشاطه
CREATE POLICY "Owner can reply to reviews of own business"
ON reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = reviews.business_id
    AND businesses.owner_id = auth.uid()
  )
);
```

### 2.15 جدول `favorites`

```sql
-- المستخدم يرى مفضلته فقط
CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
USING (user_id = auth.uid());

-- المستخدم يضيف للمفضلة
CREATE POLICY "Users can create own favorites"
ON favorites FOR INSERT
WITH CHECK (user_id = auth.uid());

-- المستخدم يحذف من المفضلة
CREATE POLICY "Users can delete own favorites"
ON favorites FOR DELETE
USING (user_id = auth.uid());
```

### 2.16 جدول `verifications`

```sql
-- المالك يرى طلب التوثيق الخاص بنشاطه
CREATE POLICY "Owner can view own verification"
ON verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = verifications.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك ينشئ طلب توثيق
CREATE POLICY "Owner can create verification"
ON verifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = verifications.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- المالك يعدل طلب التوثيق الخاص به
CREATE POLICY "Owner can update own verification"
ON verifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = verifications.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Admin يرى جميع طلبات التوثيق
CREATE POLICY "Admin can view all verifications"
ON verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Admin يعدل طلبات التوثيق
CREATE POLICY "Admin can update all verifications"
ON verifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### 2.17 جدول `reports`

```sql
-- المستخدم يرى بلاغاته فقط
CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
USING (reporter_id = auth.uid());

-- المستخدم ينشئ بلاغاً
CREATE POLICY "Users can create reports"
ON reports FOR INSERT
WITH CHECK (reporter_id = auth.uid());

-- Admin يرى جميع البلاغات
CREATE POLICY "Admin can view all reports"
ON reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Admin يعدل البلاغات
CREATE POLICY "Admin can update all reports"
ON reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### 2.18 جدول `audit_logs`

```sql
-- Admin يرى جميع السجلات
CREATE POLICY "Admin can view all audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- النظام ينشئ السجلات
CREATE POLICY "System can create audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);
```

---

## 3. Indexes للأداء

### 3.1 جدول `profiles`

```sql
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_onboarding_status ON profiles(onboarding_status);
```

### 3.2 جدول `businesses`

```sql
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_type ON businesses(type);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_city ON businesses(city);
CREATE INDEX idx_businesses_verified ON businesses(is_verified);
CREATE INDEX idx_businesses_rating ON businesses(rating);
CREATE INDEX idx_businesses_deleted ON businesses(deleted_at);
```

### 3.3 جدول `branches`

```sql
CREATE INDEX idx_branches_business ON branches(business_id);
CREATE INDEX idx_branches_main ON branches(is_main);
CREATE INDEX idx_branches_deleted ON branches(deleted_at);
```

### 3.4 جدول `staff`

```sql
CREATE INDEX idx_staff_business ON staff(business_id);
CREATE INDEX idx_staff_profile ON staff(profile_id);
CREATE INDEX idx_staff_available ON staff(is_available);
CREATE INDEX idx_staff_deleted ON staff(deleted_at);
```

### 3.5 جدول `services`

```sql
CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_services_branch ON services(branch_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_available ON services(is_available);
CREATE INDEX idx_services_deleted ON services(deleted_at);
```

### 3.6 جدول `products`

```sql
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_new ON products(is_new);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_deleted ON products(deleted_at);
```

### 3.7 جدول `bookings`

```sql
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_business ON bookings(business_id);
CREATE INDEX idx_bookings_staff ON bookings(staff_id);
CREATE INDEX idx_bookings_branch ON bookings(branch_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
```

### 3.8 جدول `orders`

```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### 3.9 جدول `transactions`

```sql
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

### 3.10 جدول `wallets`

```sql
CREATE INDEX idx_wallets_user ON wallets(user_id);
```

### 3.11 جدول `conversations`

```sql
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_business ON conversations(business_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at);
```

### 3.12 جدول `messages`

```sql
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_read ON messages(is_read);
```

### 3.13 جدول `notifications`

```sql
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 3.14 جدول `reviews`

```sql
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_business ON reviews(business_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_order ON reviews(order_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### 3.15 جدول `favorites`

```sql
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_item ON favorites(item_id);
CREATE INDEX idx_favorites_type ON favorites(item_type);
```

### 3.16 جدول `verifications`

```sql
CREATE INDEX idx_verifications_business ON verifications(business_id);
CREATE INDEX idx_verifications_user ON verifications(user_id);
CREATE INDEX idx_verifications_status ON verifications(status);
```

### 3.17 جدول `reports`

```sql
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_reported_business ON reports(reported_business_id);
CREATE INDEX idx_reports_status ON reports(status);
```

### 3.18 جدول `audit_logs`

```sql
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 4. Realtime Subscriptions

### 4.1 الاشتراك في الرسائل الجديدة

```javascript
// الاشتراك في الرسائل الجديدة لمحادثة معينة
function subscribeToMessages(conversationId, callback) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', 
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return channel;
}

// الاستخدام
const channel = subscribeToMessages(conversationId, (newMessage) => {
  console.log('رسالة جديدة:', newMessage);
  addMessageToUI(newMessage);
});

// إلغاء الاشتراك
function unsubscribe(channel) {
  supabase.removeChannel(channel);
}
```

### 4.2 الاشتراك في الإشعارات الجديدة

```javascript
// الاشتراك في الإشعارات الجديدة للمستخدم
function subscribeToNotifications(userId, callback) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', 
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return channel;
}

// الاستخدام
const channel = subscribeToNotifications(userId, (notification) => {
  console.log('إشعار جديد:', notification);
  showNotificationToast(notification);
  updateNotificationBadge();
});
```

### 4.3 الاشتراك في تغييرات حالة الطلب

```javascript
// الاشتراك في تغييرات حالة طلب معين
function subscribeToOrderStatus(orderId, callback) {
  const channel = supabase
    .channel(`order:${orderId}`)
    .on('postgres_changes', 
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return channel;
}

// الاستخدام
const channel = subscribeToOrderStatus(orderId, (updatedOrder) => {
  console.log('تم تحديث حالة الطلب:', updatedOrder.status);
  updateOrderStatusUI(updatedOrder);
});
```

### 4.4 الاشتراك في تغييرات حالة الحجز

```javascript
// الاشتراك في تغييرات حالة حجز معين
function subscribeToBookingStatus(bookingId, callback) {
  const channel = supabase
    .channel(`booking:${bookingId}`)
    .on('postgres_changes', 
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${bookingId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return channel;
}

// الاستخدام
const channel = subscribeToBookingStatus(bookingId, (updatedBooking) => {
  console.log('تم تحديث حالة الحجز:', updatedBooking.status);
  updateBookingStatusUI(updatedBooking);
});
```

---

## 5. Triggers للتحديث التلقائي

### 5.1 Trigger لتحديث `updated_at`

```sql
-- دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق على جميع الجداول التي تحتوي على updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON branches
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON offers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at
BEFORE UPDATE ON verifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 Trigger لتحديث تقييم النشاط

```sql
-- دالة لتحديث rating و reviews_count في businesses
CREATE OR REPLACE FUNCTION update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE businesses
    SET 
      rating = (
        SELECT AVG(rating)::DECIMAL
        FROM reviews
        WHERE business_id = NEW.business_id
      ),
      reviews_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE business_id = NEW.business_id
      )
    WHERE id = NEW.business_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE businesses
    SET 
      rating = (
        SELECT AVG(rating)::DECIMAL
        FROM reviews
        WHERE business_id = OLD.business_id
      ),
      reviews_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE business_id = OLD.business_id
      )
    WHERE id = OLD.business_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Trigger
CREATE TRIGGER update_business_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_business_rating();
```

### 5.3 Trigger لتحديث المخزون

```sql
-- دالة لتحديث stock_quantity في products
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE products
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE products
    SET stock_quantity = NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Trigger
CREATE TRIGGER update_product_stock_trigger
AFTER INSERT ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION update_product_stock();
```

---

## 6. Checklist للاستعلامات

قبل كتابة أي استعلام، تأكد من:

- [ ] استخدام RLS Policy المناسبة
- [ ] إضافة Index للحقول المستخدمة في WHERE و ORDER BY
- [ ] استخدام `.select()` مع الحقول المطلوبة فقط (ليس `*`)
- [ ] معالجة الأخطاء بشكل صحيح
- [ ] استخدام `.single()` عند جلب سجل واحد
- [ ] استخدام `.limit()` عند جلب قوائم طويلة
- [ ] استخدام Realtime عند الحاجة للتحديثات الفورية
- [ ] اختبار الاستعلام على بيانات كبيرة (Performance)

---

**هذا الملف هو المرجع الوحيد المعتمد للاستعلامات. أي تعديل يجب أن يتم هنا أولاً.**
```

---

تم إنشاء الملف بنجاح! 🎉

**الملف يحتوي على:**
- ✅ 10 استعلامات شائعة مع أمثلة كود كاملة
- ✅ RLS Policies لجميع الجداول الرئيسية (18 جدول)
- ✅ Indexes لجميع الجداول (18 جدول)
- ✅ Realtime Subscriptions للرسائل والإشعارات
- ✅ Triggers للتحديث التلقائي
- ✅ Checklist للاستعلامات


