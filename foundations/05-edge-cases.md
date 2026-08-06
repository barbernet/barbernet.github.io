# الحالات الخاصة (Edge Cases) - BarberFlow Pro

هذا الملف يوثق جميع الحالات الخاصة والسيناريوهات غير المتوقعة في المنصة.
كل حالة تحتوي على: الوصف، متى تحدث، كيفية المعالجة، رسالة المستخدم، ومثال الكود.

---

## 1. مقدمة

### 1.1 ما هي Edge Cases؟

الحالات الخاصة هي سيناريوهات غير اعتيادية قد تحدث أثناء استخدام المنصة، وتتطلب معالجة خاصة لضمان:
- ✅ تجربة مستخدم سلسة
- ✅ سلامة البيانات
- ✅ الأمان
- ✅ استقرار المنصة

### 1.2 قواعد التوثيق

✅ **افعل:**
- وثّق كل حالة خاصة تكتشفها
- اختبر كل حالة قبل النشر
- أضف رسائل خطأ واضحة للمستخدم
- سجّل الحالات الحرجة في `audit_logs`

❌ **لا تفعل:**
- لا تتجاهل الحالات الخاصة
- لا تعرض رسائل خطأ تقنية للمستخدم
- لا تترك البيانات في حالة غير متسقة
- لا تعتمد على سلوك المتصفح الافتراضي

---

## 2. حالات المستخدم (User Cases)

### 2.1 مستخدم محظور يحاول التسجيل

**متى تحدث:**
- مستخدم محظور (`is_banned = true`) يحاول إنشاء حساب جديد بنفس الرقم/البريد

**المعالجة:**
```javascript
async function register(userData) {
  // التحقق من الحظر
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id, is_banned, ban_reason')
    .or(`phone.eq.${userData.phone},email.eq.${userData.email}`)
    .single();
  
  if (existingUser?.is_banned) {
    return {
      success: false,
      error: 'banned',
      message: `حسابك محظور. السبب: ${existingUser.ban_reason || 'غير محدد'}`,
      action: 'contact_support'
    };
  }
  
  // متابعة التسجيل...
}
```

**رسالة المستخدم:**
> "حسابك محظور. السبب: {ban_reason}. للتواصل مع الدعم: support@barberflow.ma"

---

### 2.2 مستخدم محظور يحاول تسجيل الدخول

**متى تحدث:**
- مستخدم محظور يحاول تسجيل الدخول

**المعالجة:**
```javascript
async function login(credentials) {
  const { data: user, error } = await supabase.auth.signInWithPassword(credentials);
  
  if (error) throw error;
  
  // التحقق من الحظر بعد تسجيل الدخول
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, ban_reason')
    .eq('id', user.user.id)
    .single();
  
  if (profile.is_banned) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: 'banned',
      message: `حسابك محظور. السبب: ${profile.ban_reason || 'غير محدد'}`
    };
  }
  
  return { success: true, user };
}
```

---

### 2.3 مستخدم لم يكمل Onboarding

**متى تحدث:**
- مستخدم يحاول الوصول لصفحات محمية قبل إكمال التهيئة الأولى

**المعالجة:**
```javascript
// في page-guard.js
async function checkOnboardingStatus(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_status, role')
    .eq('id', userId)
    .single();
  
  if (profile.onboarding_status !== 'completed') {
    const redirectPath = getOnboardingPath(profile.role);
    window.location.replace(resolvePath(redirectPath));
    return false;
  }
  
  return true;
}

function getOnboardingPath(role) {
  const paths = {
    'customer': 'ONBOARDING_CUSTOMER',
    'salon': 'ONBOARDING_SALON',
    'store': 'ONBOARDING_STORE'
  };
  return paths[role] || 'INDEX';
}
```

**رسالة المستخدم:**
> "يرجى إكمال إعداد حسابك أولاً"

---

### 2.4 مستخدم بدون اشتراك نشط

**متى تحدث:**
- نشاط تجاري يحاول استخدام ميزة مدفوعة بدون اشتراك

**المعالجة:**
```javascript
// في subscription-route-guard.js
async function requireActiveSubscription(requiredPlan, redirectPath) {
  const userId = getCurrentUserId();
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:subscription_plans(slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString().split('T')[0])
    .single();
  
  if (!subscription) {
    showNotification('يرجى الاشتراك في خطة مناسبة لاستخدام هذه الميزة', 'warning');
    setTimeout(() => {
      window.location.replace(resolvePath(redirectPath));
    }, 2000);
    return false;
  }
  
  // التحقق من الخطة المطلوبة
  const planHierarchy = ['starter', 'professional', 'enterprise'];
  const currentPlanIndex = planHierarchy.indexOf(subscription.plan.slug);
  const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);
  
  if (currentPlanIndex < requiredPlanIndex) {
    showNotification(`هذه الميزة متاحة في خطة ${requiredPlan} أو أعلى`, 'warning');
    return false;
  }
  
  return true;
}
```

---

### 2.5 مستخدم برصيد محفظة سالب

**متى تحدث:**
- محاولة إجراء عملية دفع برصيد محفظة أقل من الصفر

**المعالجة:**
```javascript
// SQL Function للتحقق من الرصيد
/*
CREATE OR REPLACE FUNCTION check_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT balance INTO v_balance
  FROM wallets
  WHERE user_id = p_user_id;
  
  RETURN (v_balance >= p_amount);
END;
$$ LANGUAGE plpgsql;
*/

async function validateWalletBalance(userId, amount) {
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();
  
  if (!wallet || wallet.balance < amount) {
    return {
      valid: false,
      error: 'insufficient_balance',
      current_balance: wallet?.balance || 0,
      required: amount,
      message: `رصيد المحفظة غير كافٍ. المتاح: ${wallet?.balance || 0} MAD`
    };
  }
  
  return { valid: true, balance: wallet.balance };
}
```

---

### 2.6 Rate Limiting للتسجيل

**متى تحدث:**
- نفس الجهاز/الـ IP يحاول التسجيل 5 مرات خلال ساعة

**المعالجة:**
```javascript
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW = 60 * 60 * 1000; // ساعة

async function checkRegisterRateLimit(ip) {
  const attempts = await cacheGet(`register_attempts:${ip}`) || [];
  const now = Date.now();
  
  // حذف المحاولات القديمة
  const recentAttempts = attempts.filter(
    time => now - time < REGISTER_WINDOW
  );
  
  if (recentAttempts.length >= REGISTER_LIMIT) {
    return {
      allowed: false,
      retryAfter: REGISTER_WINDOW - (now - recentAttempts[0])
    };
  }
  
  recentAttempts.push(now);
  await cacheSet(`register_attempts:${ip}`, recentAttempts, REGISTER_WINDOW);
  
  return { allowed: true };
}
```

**رسالة المستخدم:**
> "محاولات كثيرة. يرجى المحاولة بعد {minutes} دقيقة"

---

### 2.7 OTP لم يصل

**متى تحدث:**
- المستخدم لم يستلم رمز OTP بعد 60 ثانية

**المعالجة:**
```javascript
let otpResendCount = 0;
const MAX_RESEND = 3;
const RESEND_COOLDOWN = 60; // ثانية

function handleResendOTP() {
  if (otpResendCount >= MAX_RESEND) {
    showNotification(
      'تجاوزت الحد الأقصى لإعادة الإرسال. تواصل مع الدعم',
      'error'
    );
    return;
  }
  
  const lastResend = localStorage.getItem('last_otp_resend');
  const now = Date.now();
  
  if (lastResend && now - lastResend < RESEND_COOLDOWN * 1000) {
    const waitTime = RESEND_COOLDOWN - Math.floor((now - lastResend) / 1000);
    showNotification(`يمكنك إعادة الإرسال بعد ${waitTime} ثانية`, 'warning');
    return;
  }
  
  // إرسال OTP جديد
  sendOTP();
  otpResendCount++;
  localStorage.setItem('last_otp_resend', now);
}
```

---

### 2.8 جلسات متعددة (Multiple Sessions)

**متى تحدث:**
- نفس المستخدم مسجل الدخول من أجهزة متعددة

**المعالجة:**
```javascript
// في auth-state.js
async function handleSessionConflict(userId) {
  const { data: sessions } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  // السماح بـ 3 جلسات كحد أقصى
  if (sessions.length > 3) {
    const oldSessions = sessions.slice(3);
    await supabase
      .from('user_sessions')
      .delete()
      .in('id', oldSessions.map(s => s.id));
    
    showNotification(
      'تم تسجيل خروجك من جهاز آخر لأسباب أمنية',
      'warning'
    );
  }
}
```

---

### 2.9 تغيير البريد/الهاتف

**متى تحدث:**
- المستخدم يريد تغيير بريده أو رقم هاتفه

**المعالجة:**
```javascript
async function changeEmail(userId, newEmail) {
  // التحقق من عدم استخدام البريد
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', newEmail)
    .single();
  
  if (existing) {
    return { success: false, error: 'email_in_use' };
  }
  
  // إرسال OTP للبريد الجديد
  await sendEmailOTP(newEmail);
  
  // حفظ البريد الجديد مؤقتاً
  await supabase
    .from('email_change_requests')
    .insert({
      user_id: userId,
      new_email: newEmail,
      otp_code: otpCode,
      expires_at: new Date(Date.now() + 3600000) // ساعة
    });
  
  return { success: true, message: 'تم إرسال رمز التحقق للبريد الجديد' };
}
```

---

### 2.10 حذف الحساب

**متى تحدث:**
- المستخدم يريد حذف حسابه نهائياً

**المعالجة:**
```javascript
async function deleteAccount(userId) {
  // التحقق من عدم وجود طلبات/حجوزات نشطة
  const { data: activeBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('customer_id', userId)
    .in('status', ['pending', 'confirmed'])
    .limit(1);
  
  if (activeBookings.length > 0) {
    return {
      success: false,
      error: 'has_active_bookings',
      message: 'لا يمكن حذف الحساب بوجود حجوزات نشطة'
    };
  }
  
  // Soft delete
  await supabase
    .from('profiles')
    .update({
      deleted_at: new Date().toISOString(),
      is_banned: true,
      ban_reason: 'حذف الحساب بطلب المستخدم'
    })
    .eq('id', userId);
  
  // تسجيل في audit_logs
  await logAudit({
    user_id: userId,
    action: 'delete_account',
    entity_type: 'user',
    entity_id: userId
  });
  
  // تسجيل الخروج
  await supabase.auth.signOut();
  
  return { success: true };
}
```

---

## 3. حالات الحجز (Booking Cases)

### 3.1 حجز في عطلة

**متى تحدث:**
- المستخدم يحاول الحجز في يوم عطلة

**المعالجة:**
```javascript
async function validateBookingDate(branchId, date) {
  // التحقق من العطلات
  const { data: holidays } = await supabase
    .from('holidays')
    .select('*')
    .eq('branch_id', branchId)
    .eq('date', date);
  
  if (holidays.length > 0) {
    return {
      valid: false,
      error: 'holiday',
      message: `الصالون مغلق في هذا اليوم (${holidays[0].title})`,
      action: 'select_another_date'
    };
  }
  
  // التحقق من يوم العمل
  const dayOfWeek = getDayOfWeek(date);
  const { data: branch } = await supabase
    .from('branches')
    .select('working_hours')
    .eq('id', branchId)
    .single();
  
  if (!branch.working_hours.days.includes(dayOfWeek)) {
    return {
      valid: false,
      error: 'closed_day',
      message: 'الصالون مغلق في هذا اليوم من الأسبوع'
    };
  }
  
  return { valid: true };
}
```

---

### 3.2 حجز مع موظف مشغول

**متى تحدث:**
- المستخدم يختار موظف غير متاح في الوقت المحدد

**المعالجة:**
```javascript
async function checkStaffAvailability(staffId, date, startTime, endTime) {
  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('staff_id', staffId)
    .eq('booking_date', date)
    .in('status', ['pending', 'confirmed']);
  
  const isAvailable = !bookings.some(booking => {
    const bookingStart = timeToMinutes(booking.start_time);
    const bookingEnd = timeToMinutes(booking.end_time);
    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);
    
    return (
      requestedStart < bookingEnd && 
      requestedEnd > bookingStart
    );
  });
  
  if (!isAvailable) {
    // اقتراح موظفين آخرين
    const { data: alternatives } = await getAlternativeStaff(
      staffId, 
      date, 
      startTime
    );
    
    return {
      available: false,
      alternatives,
      message: 'الموظف غير متاح في هذا الوقت',
      suggestion: 'يمكنك اختيار موظف آخر أو وقت مختلف'
    };
  }
  
  return { available: true };
}
```

---

### 3.3 إلغاء الحجز (سياسة الإلغاء)

**متى تحدث:**
- المستخدم يريد إلغاء حجزه

**المعالجة:**
```javascript
async function cancelBooking(bookingId, userId) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();
  
  if (booking.customer_id !== userId) {
    return { success: false, error: 'unauthorized' };
  }
  
  const now = new Date();
  const bookingDate = new Date(booking.booking_date);
  const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
  
  let refundPercentage = 0;
  let message = '';
  
  if (hoursUntilBooking > 24) {
    // قبل 24 ساعة: استرجاع كامل
    refundPercentage = 100;
    message = 'سيتم استرجاع المبلغ كاملاً';
  } else if (hoursUntilBooking > 2) {
    // قبل 2-24 ساعة: استرجاع 50%
    refundPercentage = 50;
    message = 'سيتم استرجاع 50% من المبلغ';
  } else {
    // أقل من 2 ساعة: لا استرجاع
    refundPercentage = 0;
    message = 'لا يمكن استرجاع المبلغ (أقل من 2 ساعة)';
  }
  
  // تحديث الحجز
  await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: 'إلغاء من المستخدم',
      cancelled_by: userId,
      cancelled_at: now.toISOString()
    })
    .eq('id', bookingId);
  
  // استرجاع المبلغ
  if (refundPercentage > 0 && booking.payment_status === 'paid') {
    const refundAmount = booking.total_price * (refundPercentage / 100);
    await processRefund(bookingId, refundAmount);
  }
  
  return {
    success: true,
    refund_percentage: refundPercentage,
    message
  };
}
```

---

### 3.4 عدم حضور العميل (No-Show)

**متى تحدث:**
- المستخدم لم يحضر في موعد الحجز

**المعالجة:**
```javascript
// مهمة مجدولة (Cron Job) كل ساعة
async function checkNoShows() {
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  
  const { data: overdueBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .lte('end_time', oneHourAgo.toISOString().split('T')[1]);
  
  for (const booking of overdueBookings) {
    // تحديث الحالة
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: 'عدم حضور (No-Show)',
        cancelled_at: now.toISOString()
      })
      .eq('id', booking.id);
    
    // خصم من نقاط الولاء أو المحفظة
    if (booking.payment_status === 'paid') {
      // لا استرجاع
      await logAudit({
        action: 'no_show',
        entity_type: 'booking',
        entity_id: booking.id,
        metadata: { customer_id: booking.customer_id }
      });
    }
    
    // إشعار
    await sendNotification({
      user_id: booking.customer_id,
      type: 'booking',
      title: 'تم إلغاء حجزك',
      message: 'تم إلغاء حجزك بسبب عدم الحضور'
    });
  }
}
```

---

### 3.5 حجز في تاريخ سابق

**متى تحدث:**
- المستخدم يحاول اختيار تاريخ أصغر من اليوم الحالي

**المعالجة:**
```javascript
function validateBookingDate(date) {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return {
      valid: false,
      error: 'past_date',
      message: 'لا يمكن الحجز في تاريخ سابق'
    };
  }
  
  // التحقق من عدم الحجز في نفس اليوم قبل الوقت الحالي
  const now = new Date();
  if (selectedDate.toDateString() === now.toDateString()) {
    const selectedTime = new Date(date);
    if (selectedTime < now) {
      return {
        valid: false,
        error: 'past_time',
        message: 'لا يمكن الحجز في وقت سابق'
      };
    }
  }
  
  return { valid: true };
}

// تعطيل التواريخ السابقة في Calendar
function initBookingCalendar() {
  const today = new Date().toISOString().split('T')[0];
  
  document.querySelectorAll('.calendar-day').forEach(day => {
    const date = day.dataset.date;
    if (date < today) {
      day.classList.add('disabled');
      day.setAttribute('aria-disabled', 'true');
    }
  });
}
```

---

### 3.6 تعديل الحجز

**متى تحدث:**
- المستخدم يريد تعديل حجز موجود

**المعالجة:**
```javascript
async function modifyBooking(bookingId, userId, newData) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();
  
  if (booking.customer_id !== userId) {
    return { success: false, error: 'unauthorized' };
  }
  
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return { 
      success: false, 
      error: 'cannot_modify',
      message: 'لا يمكن تعديل حجز مكتمل أو ملغي'
    };
  }
  
  // التحقق من التوفر إذا تم تغيير الوقت/الموظف
  if (newData.start_time || newData.staff_id) {
    const isAvailable = await checkStaffAvailability(
      newData.staff_id || booking.staff_id,
      newData.booking_date || booking.booking_date,
      newData.start_time || booking.start_time,
      newData.end_time || booking.end_time
    );
    
    if (!isAvailable.available) {
      return {
        success: false,
        error: 'not_available',
        message: 'الوقت المختار غير متاح'
      };
    }
  }
  
  // إعادة حساب السعر إذا تم تغيير الخدمة
  if (newData.service_id && newData.service_id !== booking.service_id) {
    const { data: service } = await supabase
      .from('services')
      .select('price')
      .eq('id', newData.service_id)
      .single();
    
    newData.total_price = service.price;
  }
  
  // تحديث الحجز
  await supabase
    .from('bookings')
    .update(newData)
    .eq('id', bookingId);
  
  // إشعار
  await sendNotification({
    user_id: booking.customer_id,
    type: 'booking',
    title: 'تم تعديل حجزك',
    message: 'تم تعديل حجزك بنجاح'
  });
  
  return { success: true };
}
```

---

### 3.7 حجز متكرر في نفس الوقت

**متى تحدث:**
- المستخدم يحاول حجز نفس الوقت مرتين

**المعالجة:**
```javascript
async function checkDuplicateBooking(customerId, date, startTime) {
  const { data: existing } = await supabase
    .from('bookings')
    .select('id, start_time, end_time, business_id')
    .eq('customer_id', customerId)
    .eq('booking_date', date)
    .in('status', ['pending', 'confirmed']);
  
  const requestedStart = timeToMinutes(startTime);
  
  const conflict = existing.find(booking => {
    const bookingStart = timeToMinutes(booking.start_time);
    const bookingEnd = timeToMinutes(booking.end_time);
    
    return (
      requestedStart >= bookingStart && 
      requestedStart < bookingEnd
    );
  });
  
  if (conflict) {
    return {
      hasConflict: true,
      message: 'لديك حجز آخر في هذا الوقت',
      conflictingBooking: conflict
    };
  }
  
  return { hasConflict: false };
}
```

---

## 4. حالات الطلب (Order Cases)

### 4.1 منتج نفد مخزونه أثناء الدفع

**متى تحدث:**
- منتج نفد مخزونه بينما هو في سلة المستخدم

**المعالجة:**
```javascript
async function validateCartBeforeCheckout(cart) {
  const issues = [];
  
  for (const item of cart.items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity, is_available, price')
      .eq('id', item.product_id)
      .single();
    
    if (!product.is_available) {
      issues.push({
        type: 'unavailable',
        product_id: item.product_id,
        message: `"${product.name}" غير متوفر`,
        action: 'remove'
      });
    } else if (product.stock_quantity < item.quantity) {
      issues.push({
        type: 'low_stock',
        product_id: item.product_id,
        available: product.stock_quantity,
        requested: item.quantity,
        message: `الكمية المتاحة من "${product.name}" هي ${product.stock_quantity}`,
        action: 'update_quantity'
      });
    } else if (product.price !== item.price) {
      issues.push({
        type: 'price_changed',
        product_id: item.product_id,
        old_price: item.price,
        new_price: product.price,
        message: `سعر "${product.name}" تغير`,
        action: 'update_price'
      });
    }
  }
  
  if (issues.length > 0) {
    return {
      valid: false,
      issues,
      message: 'هناك مشاكل في سلتك. يرجى مراجعتها'
    };
  }
  
  return { valid: true };
}
```

---

### 4.2 عنوان خارج نطاق التوصيل

**متى تحدث:**
- المستخدم يدخل عنوان خارج نطاق التوصيل

**المعالجة:**
```javascript
async function validateDeliveryAddress(address, businessId) {
  // جلب طرق الشحن المتاحة
  const { data: methods } = await supabase
    .from('shipping_methods')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true);
  
  // التحقق من المدينة
  const supportedCities = ['casablanca', 'rabat', 'marrakech', 'fes'];
  const city = address.city.toLowerCase();
  
  if (!supportedCities.includes(city)) {
    return {
      valid: false,
      error: 'city_not_supported',
      message: `عذراً، لا نوصل إلى ${address.city} حالياً`,
      supported_cities: supportedCities
    };
  }
  
  // التحقق من الرمز البريدي
  if (address.postal_code && !isValidPostalCode(address.postal_code)) {
    return {
      valid: false,
      error: 'invalid_postal_code',
      message: 'الرمز البريدي غير صالح'
    };
  }
  
  return { valid: true, methods };
}
```

---

### 4.3 طلب بقيمة أقل من الحد الأدنى

**متى تحدث:**
- قيمة الطلب أقل من الحد الأدنى

**المعالجة:**
```javascript
const MIN_ORDER_AMOUNT = 100; // MAD

async function validateMinOrder(subtotal) {
  if (subtotal < MIN_ORDER_AMOUNT) {
    return {
      valid: false,
      error: 'min_order',
      message: `الحد الأدنى للطلب هو ${MIN_ORDER_AMOUNT} MAD`,
      remaining: MIN_ORDER_AMOUNT - subtotal,
      action: 'add_more_items'
    };
  }
  
  return { valid: true };
}
```

---

### 4.4 استرجاع بعد 30 يوم

**متى تحدث:**
- طلب استرجاع بعد انقضاء المهلة المحددة (30 يوماً من التسليم)

**المعالجة:**
```javascript
async function requestRefund(orderId, userId, reason) {
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (order.customer_id !== userId) {
    return { success: false, error: 'unauthorized' };
  }
  
  if (order.status !== 'delivered') {
    return {
      success: false,
      error: 'not_delivered',
      message: 'يمكن طلب الاسترجاع فقط بعد استلام الطلب'
    };
  }
  
  // التحقق من المهلة الزمنية
  const deliveredAt = new Date(order.delivered_at);
  const now = new Date();
  const daysSinceDelivery = (now - deliveredAt) / (1000 * 60 * 60 * 24);
  
  if (daysSinceDelivery > 30) {
    return {
      success: false,
      error: 'refund_period_expired',
      message: 'انتهت مهلة الاسترجاع (30 يوماً من التسليم)'
    };
  }
  
  // إنشاء طلب الاسترجاع
  const { data: refund, error } = await supabase
    .from('refunds')
    .insert({
      order_id: orderId,
      user_id: userId,
      amount: order.total,
      reason,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // إشعار الإدارة
  await sendNotification({
    user_id: 'admin',
    type: 'refund_request',
    title: 'طلب استرجاع جديد',
    message: `طلب استرجاع للطلب #${orderId}`,
    data: { refund_id: refund.id }
  });
  
  return { success: true, refund_id: refund.id };
}
```

---

### 4.5 Race Condition في المخزون

**متى تحدث:**
- مستخدمان يحاولان شراء آخر قطعة من منتج في نفس الوقت

**المعالجة:**
```javascript
async function placeOrderWithLock(userId, cart) {
  // استخدام transaction مع lock
  const { data: order, error } = await supabase.rpc('create_order_with_lock', {
    p_customer_id: userId,
    p_items: cart.items,
    p_total: cart.total
  });
  
  if (error) {
    if (error.code === '23505') { // Unique violation
      return {
        success: false,
        error: 'stock_conflict',
        message: 'عذراً، تم حجز المنتج من مستخدم آخر'
      };
    }
    throw error;
  }
  
  return { success: true, order };
}

// SQL Function
/*
CREATE OR REPLACE FUNCTION create_order_with_lock(
  p_customer_id UUID,
  p_items JSONB,
  p_total DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_stock INT;
BEGIN
  -- إنشاء الطلب
  INSERT INTO orders (customer_id, total, status)
  VALUES (p_customer_id, p_total, 'pending')
  RETURNING id INTO v_order_id;
  
  -- معالجة كل منتج مع lock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- قفل الصف
    SELECT stock_quantity INTO v_stock
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;
    
    -- التحقق من المخزون
    IF v_stock < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Stock not available';
    END IF;
    
    -- تحديث المخزون
    UPDATE products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::INT
    WHERE id = (v_item->>'product_id')::UUID;
    
    -- إنشاء order_item
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INT,
      (v_item->>'price')::DECIMAL
    );
  END LOOP;
  
  RETURN jsonb_build_object('order_id', v_order_id);
END;
$$ LANGUAGE plpgsql;
*/
```

---

### 4.6 طلب من متاجر مختلفة

**متى تحدث:**
- السلة تحتوي على منتجات من متاجر مختلفة

**المعالجة:**
```javascript
function splitCartByStore(cart) {
  const ordersByStore = {};
  
  cart.items.forEach(item => {
    const storeId = item.seller_id;
    if (!ordersByStore[storeId]) {
      ordersByStore[storeId] = {
        store_id: storeId,
        items: [],
        subtotal: 0
      };
    }
    ordersByStore[storeId].items.push(item);
    ordersByStore[storeId].subtotal += item.price * item.quantity;
  });
  
  return Object.values(ordersByStore);
}

// في صفحة الدفع
async function checkout(cart) {
  const ordersByStore = splitCartByStore(cart);
  
  if (ordersByStore.length > 1) {
    showNotification(
      `سيتم إنشاء ${ordersByStore.length} طلبات منفصلة (من متاجر مختلفة)`,
      'info'
    );
  }
  
  const results = [];
  for (const orderData of ordersByStore) {
    const result = await createOrder(orderData);
    results.push(result);
  }
  
  return results;
}
```

---

## 5. حالات الدفع (Payment Cases)

### 5.1 فشل الدفع

**متى تحدث:**
- بوابة الدفع ترفض المعاملة

**المعالجة:**
```javascript
async function processPayment(orderId, paymentMethod, cardData) {
  try {
    // محاولة الدفع
    const result = await paymentGateway.charge({
      amount: order.total,
      currency: 'MAD',
      method: paymentMethod,
      card: cardData
    });
    
    if (result.success) {
      // تحديث حالة الطلب
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_id: result.transaction_id
        })
        .eq('id', orderId);
      
      // تسجيل المعاملة
      await supabase
        .from('transactions')
        .insert({
          user_id: order.customer_id,
          type: 'payment',
          amount: order.total,
          status: 'completed',
          reference_id: result.transaction_id
        });
      
      return { success: true };
    } else {
      // فشل الدفع - تسجيل المعاملة الفاشلة
      await supabase
        .from('transactions')
        .insert({
          user_id: order.customer_id,
          type: 'payment',
          amount: order.total,
          status: 'failed',
          metadata: { error: result.error }
        });
      
      return {
        success: false,
        error: result.error.code,
        message: getPaymentErrorMessage(result.error.code)
      };
    }
  } catch (error) {
    // خطأ في الاتصال
    await supabase
      .from('transactions')
      .insert({
        user_id: order.customer_id,
        type: 'payment',
        amount: order.total,
        status: 'failed',
        metadata: { error: error.message }
      });
    
    return {
      success: false,
      error: 'gateway_error',
      message: 'حدث خطأ في معالجة الدفع. يرجى المحاولة مرة أخرى'
    };
  }
}

function getPaymentErrorMessage(code) {
  const messages = {
    'insufficient_funds': 'رصيد البطاقة غير كافٍ',
    'expired_card': 'البطاقة منتهية الصلاحية',
    'invalid_card': 'بيانات البطاقة غير صحيحة',
    'declined': 'تم رفض المعاملة من البنك',
    '3ds_failed': 'فشل التحقق الأمني'
  };
  
  return messages[code] || 'حدث خطأ في الدفع';
}
```

---

### 5.2 دفع مزدوج (Double Payment)

**متى تحدث:**
- المستخدم يضغط زر الدفع مرتين بسرعة

**المعالجة:**
```javascript
// في utils/debounce.js
function protectButton(button, callback) {
  let isProcessing = false;
  
  button.addEventListener('click', async () => {
    if (isProcessing) return;
    
    isProcessing = true;
    button.disabled = true;
    button.classList.add('loading');
    
    try {
      await callback();
    } finally {
      isProcessing = false;
      button.disabled = false;
      button.classList.remove('loading');
    }
  });
}

// الاستخدام
const payButton = document.getElementById('payButton');
protectButton(payButton, async () => {
  await processPayment();
});

// التحقق من عدم وجود معاملات مكررة
async function checkDuplicatePayment(orderId) {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id')
    .eq('reference_id', orderId)
    .eq('status', 'completed')
    .eq('type', 'payment');
  
  if (transactions.length > 0) {
    return {
      isDuplicate: true,
      message: 'تم دفع هذا الطلب مسبقاً'
    };
  }
  
  return { isDuplicate: false };
}
```

---

### 5.3 محفظة فارغة

**متى تحدث:**
- اختيار الدفع بالمحفظة والرصيد صفراً

**المعالجة:**
```javascript
async function payWithWallet(orderId, userId, amount) {
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();
  
  if (!wallet || wallet.balance < amount) {
    showNotification(
      'رصيد المحفظة غير كافٍ. يرجى شحن المحفظة أو اختيار طريقة دفع أخرى',
      'warning'
    );
    
    // توجيه لشحن المحفظة
    setTimeout(() => {
      window.location.replace(resolvePath('WALLET_TOPUP'));
    }, 2000);
    
    return { success: false, error: 'insufficient_balance' };
  }
  
  // خصم من المحفظة
  const { data, error } = await supabase.rpc('update_wallet_balance', {
    p_user_id: userId,
    p_amount: -amount,
    p_type: 'payment'
  });
  
  if (error) throw error;
  
  // تحديث حالة الطلب
  await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId);
  
  return { success: true };
}
```

---

### 5.4 عمولة المنصة غير محسوبة

**متى تحدث:**
- احتساب وخصم نسبة اقتطاع المنصة تلقائياً من العمليات

**المعالجة:**
```javascript
// SQL Function لحساب عمولة المنصة
/*
CREATE OR REPLACE FUNCTION calculate_platform_commission(
  p_business_id UUID,
  p_amount DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_commission_rate DECIMAL;
  v_commission DECIMAL;
BEGIN
  -- جلب نسبة العمولة من النشاط التجاري
  SELECT commission_rate INTO v_commission_rate
  FROM businesses
  WHERE id = p_business_id;
  
  -- إذا لم تكن محددة، استخدم النسبة الافتراضية (10%)
  IF v_commission_rate IS NULL THEN
    v_commission_rate := 10;
  END IF;
  
  -- حساب العمولة
  v_commission := p_amount * (v_commission_rate / 100);
  
  RETURN v_commission;
END;
$$ LANGUAGE plpgsql;
*/

async function processPaymentWithCommission(orderId, businessId, amount) {
  // حساب عمولة المنصة
  const commission = await supabase.rpc('calculate_platform_commission', {
    p_business_id: businessId,
    p_amount: amount
  });
  
  const netAmount = amount - commission.data;
  
  // تسجيل معاملة الدفع
  await supabase
    .from('transactions')
    .insert({
      user_id: getCurrentUserId(),
      type: 'payment',
      amount: amount,
      status: 'completed'
    });
  
  // تسجيل عمولة المنصة
  await supabase
    .from('transactions')
    .insert({
      user_id: businessId,
      type: 'commission',
      amount: commission.data,
      status: 'completed'
    });
  
  // تحديث رصيد النشاط (الصافي بعد الخصم)
  await supabase.rpc('update_wallet_balance', {
    p_user_id: businessId,
    p_amount: netAmount,
    p_type: 'earning'
  });
  
  return { success: true, commission: commission.data, net_amount: netAmount };
}
```

---

### 5.5 Race Condition في المحفظة

**متى تحدث:**
- عمليتان تحاولان خصم/إضافة رصيد في نفس الوقت

**المعالجة:**
```javascript
// SQL Function للعمليات الآمنة
/*
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- قفل الصف
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- التحقق من الرصيد الكافي للخصم
  IF p_amount < 0 AND v_current_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- تحديث الرصيد
  UPDATE wallets
  SET balance = balance + p_amount,
      last_transaction_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- تسجيل المعاملة
  INSERT INTO transactions (user_id, amount, type, status)
  VALUES (p_user_id, ABS(p_amount), p_type, 'completed');
  
  RETURN jsonb_build_object(
    'old_balance', v_current_balance,
    'new_balance', v_new_balance,
    'transaction_amount', p_amount
  );
END;
$$ LANGUAGE plpgsql;
*/

// الاستخدام
async function deductFromWallet(userId, amount) {
  const { data, error } = await supabase.rpc('update_wallet_balance', {
    p_user_id: userId,
    p_amount: -amount, // سالب للخصم
    p_type: 'payment'
  });
  
  if (error) {
    if (error.message === 'Insufficient balance') {
      return {
        success: false,
        error: 'insufficient_balance',
        message: 'رصيد المحفظة غير كافٍ'
      };
    }
    throw error;
  }
  
  return { success: true, data };
}
```

---

## 6. حالات التوثيق (Verification Cases)

### 6.1 وثيقة غير واضحة

**متى تحدث:**
- رفع وثائق غير واضحة أو غير مقروءة

**المعالجة:**
```javascript
async function submitVerification(businessId, documents) {
  // التحقق من جودة الصور
  for (const doc of documents) {
    const quality = await checkImageQuality(doc.url);
    
    if (quality.score < 0.6) { // أقل من 60% جودة
      return {
        success: false,
        error: 'low_quality',
        document: doc.type,
        message: `صورة ${doc.type} غير واضحة. يرجى رفع صورة أوضح`,
        suggestions: [
          'تأكد من الإضاءة الجيدة',
          'تجنب الظلال',
          'اجعل الوثيقة في مركز الصورة',
          'تأكد من أن جميع الأطراف مرئية'
        ]
      };
    }
  }
  
  // إنشاء طلب التوثيق
  const { data: verification, error } = await supabase
    .from('verifications')
    .insert({
      business_id: businessId,
      user_id: getCurrentUserId(),
      status: 'pending',
      id_card_front_url: documents.idCardFront.url,
      id_card_back_url: documents.idCardBack.url,
      rib_url: documents.rib.url,
      ownership_doc_url: documents.ownershipDoc?.url,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // إشعار الإدارة
  await sendNotification({
    user_id: 'admin',
    type: 'verification_request',
    title: 'طلب توثيق جديد',
    message: `طلب توثيق جديد من ${businessId}`
  });
  
  return { success: true, verification_id: verification.id };
}

// دالة فحص جودة الصورة (باستخدام Canvas API)
async function checkImageQuality(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // تحليل بسيط للجودة (التباين، الوضوح)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const contrast = calculateContrast(imageData);
      
      resolve({
        score: contrast,
        width: img.width,
        height: img.height
      });
    };
    img.src = imageUrl;
  });
}
```

---

### 6.2 RIB غير صالح

**متى تحدث:**
- عدم مطابقة رقم الحساب البنكي للتنسيق المغربي (24 رقماً)

**المعالجة:**
```javascript
function validateRIB(rib) {
  // إزالة المسافات
  const cleanRib = rib.replace(/\s/g, '');
  
  // التحقق من الطول (24 رقم)
  if (cleanRib.length !== 24) {
    return {
      valid: false,
      error: 'invalid_length',
      message: 'رقم RIB يجب أن يكون 24 رقماً'
    };
  }
  
  // التحقق من أن جميع الأحرف أرقام
  if (!/^\d{24}$/.test(cleanRib)) {
    return {
      valid: false,
      error: 'invalid_format',
      message: 'رقم RIB يجب أن يحتوي على أرقام فقط'
    };
  }
  
  // التحقق من بنك مغربي (الرقمان الأولان)
  const bankCode = cleanRib.substring(0, 5);
  const validBanks = ['007', '010', '012', '013', '014', '015', '016'];
  
  if (!validBanks.includes(bankCode)) {
    return {
      valid: false,
      error: 'invalid_bank',
      message: 'رمز البنك غير صالح'
    };
  }
  
  // التحقق من رقم التحكم (الخانة 24)
  const checkDigit = calculateRIBCheckDigit(cleanRib.substring(0, 23));
  if (checkDigit !== parseInt(cleanRib[23])) {
    return {
      valid: false,
      error: 'invalid_check_digit',
      message: 'رقم RIB غير صالح (خطأ في رقم التحكم)'
    };
  }
  
  return { valid: true };
}

function calculateRIBCheckDigit(rib23) {
  // خوارزمية حساب رقم التحكم لـ RIB المغربي
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  let sum = 0;
  
  for (let i = 0; i < 23; i++) {
    sum += parseInt(rib23[i]) * weights[i];
  }
  
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

// في نموذج التوثيق
document.getElementById('ribInput').addEventListener('blur', async (e) => {
  const rib = e.target.value;
  const validation = validateRIB(rib);
  
  if (!validation.valid) {
    showFieldError('ribInput', validation.message);
  } else {
    clearFieldError('ribInput');
    showFieldSuccess('ribInput', 'RIB صالح');
  }
});
```

---

### 6.3 نشاط مرفوض مرتين

**متى تحدث:**
- تجاوز عدد مرات الرفض وإحالة الطلب للمراجعة اليدوية

**المعالجة:**
```javascript
async function handleVerificationRejection(verificationId, reason) {
  // جلب عدد مرات الرفض السابقة
  const { data: verification } = await supabase
    .from('verifications')
    .select('rejection_count, business_id')
    .eq('id', verificationId)
    .single();
  
  const newRejectionCount = (verification.rejection_count || 0) + 1;
  
  // تحديث حالة الرفض
  await supabase
    .from('verifications')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      rejection_count: newRejectionCount,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', verificationId);
  
  // إذا تم الرفض أكثر من مرتين، إحالة للمراجعة اليدوية
  if (newRejectionCount >= 3) {
    await supabase
      .from('verifications')
      .update({
        status: 'manual_review',
        admin_notes: 'تم الرفض أكثر من 3 مرات - يحتاج مراجعة يدوية'
      })
      .eq('id', verificationId);
    
    // إشعار الإدارة العليا
    await sendNotification({
      user_id: 'admin',
      type: 'manual_review_required',
      title: 'مراجعة يدوية مطلوبة',
      message: `طلب التوثيق ${verificationId} تم رفضه ${newRejectionCount} مرات`
    });
  }
  
  // إشعار صاحب النشاط
  await sendNotification({
    user_id: verification.business_id,
    type: 'verification_rejected',
    title: 'تم رفض طلب التوثيق',
    message: `سبب الرفض: ${reason}`,
    data: {
      rejection_count: newRejectionCount,
      can_resubmit: newRejectionCount < 3
    }
  });
  
  return { success: true, rejection_count: newRejectionCount };
}
```

---

## 7. حالات المحادثات (Chat Cases)

### 7.1 رسالة من مستخدم محظور

**متى تحدث:**
- منع إرسال الرسائل عبر قواعد RLS في الباك إند

**المعالجة:**
```sql
-- RLS Policy لمنع المستخدمين المحظورين من إرسال الرسائل
CREATE POLICY "Banned users cannot send messages"
ON messages FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_banned = true
  )
);

-- في الواجهة الأمامية
async function sendMessage(conversationId, content) {
  // التحقق من حالة الحظر
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', getCurrentUserId())
    .single();
  
  if (profile?.is_banned) {
    showNotification(
      'حسابك محظور. لا يمكنك إرسال رسائل',
      'error'
    );
    return { success: false, error: 'banned' };
  }
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: getCurrentUserId(),
      content
    });
  
  if (error) {
    if (error.code === '42501') { // RLS violation
      showNotification('لا يمكنك إرسال رسائل', 'error');
      return { success: false, error: 'permission_denied' };
    }
    throw error;
  }
  
  return { success: true, message: data };
}
```

---

### 7.2 محادثة مغلقة

**متى تحدث:**
- محاولة إرسال رسائل داخل محادثة مغلقة

**المعالجة:**
```javascript
async function sendMessage(conversationId, content) {
  // التحقق من حالة المحادثة
  const { data: conversation } = await supabase
    .from('conversations')
    .select('status')
    .eq('id', conversationId)
    .single();
  
  if (conversation.status === 'closed') {
    return {
      success: false,
      error: 'conversation_closed',
      message: 'هذه المحادثة مغلقة. لا يمكنك إرسال رسائل'
    };
  }
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: getCurrentUserId(),
      content
    });
  
  if (error) throw error;
  
  // تحديث last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);
  
  return { success: true, message: data };
}
```

---

### 7.3 إرسال صور كبيرة

**متى تحدث:**
- رفع صورة يتجاوز حجمها 5 ميجابايت أو بأبعاد كبيرة

**المعالجة:**
```javascript
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

async function uploadChatImage(file, conversationId) {
  // التحقق من الحجم
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      success: false,
      error: 'file_too_large',
      message: `حجم الصورة يتجاوز 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`
    };
  }
  
  // التحقق من الأبعاد
  const dimensions = await getImageDimensions(file);
  if (dimensions.width > MAX_WIDTH || dimensions.height > MAX_HEIGHT) {
    // إعادة تحجيم الصورة تلقائياً
    const resizedImage = await resizeImage(file, MAX_WIDTH, MAX_HEIGHT);
    file = resizedImage;
  }
  
  // رفع الصورة
  const { data, error } = await uploadImage(file, 'chat-images', {
    conversationId
  });
  
  if (error) throw error;
  
  // إرسال الرسالة مع الصورة
  const { data: message } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: getCurrentUserId(),
      content: data.url,
      message_type: 'image'
    });
  
  return { success: true, message };
}

function getImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.src = URL.createObjectURL(file);
  });
}

async function resizeImage(file, maxWidth, maxHeight) {
  const img = await createImageBitmap(file);
  
  let { width, height } = img;
  
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], file.name, { type: file.type }));
    }, file.type, 0.9);
  });
}
```

---

## 8. حالات التقييم (Review Cases)

### 8.1 تقييم بدون حجز/شراء

**متى تحدث:**
- التمييز بين التقييمات الموثقة وغير الموثقة

**المعالجة:**
```javascript
async function validateReviewEligibility(userId, businessId, productId) {
  if (productId) {
    // تقييم منتج - يجب أن يكون قد اشتراه
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', userId)
      .eq('status', 'delivered')
      .in('id', 
        supabase
          .from('order_items')
          .select('order_id')
          .eq('product_id', productId)
      );
    
    if (orders.length === 0) {
      return {
        eligible: false,
        error: 'no_purchase',
        message: 'يمكنك تقييم المنتجات التي اشتريتها فقط',
        is_verified: false
      };
    }
    
    return { eligible: true, is_verified: true };
  } else {
    // تقييم نشاط - يجب أن يكون قد حجز
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('customer_id', userId)
      .eq('business_id', businessId)
      .eq('status', 'completed');
    
    if (bookings.length === 0) {
      return {
        eligible: false,
        error: 'no_booking',
        message: 'يمكنك تقييم الصالونات التي حجزت فيها فقط',
        is_verified: false
      };
    }
    
    return { eligible: true, is_verified: true };
  }
}

// إنشاء التقييم
async function createReview(reviewData) {
  const eligibility = await validateReviewEligibility(
    getCurrentUserId(),
    reviewData.business_id,
    reviewData.product_id
  );
  
  if (!eligibility.eligible) {
    return eligibility;
  }
  
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      ...reviewData,
      reviewer_id: getCurrentUserId(),
      is_verified_purchase: eligibility.is_verified
    });
  
  if (error) throw error;
  
  return { success: true, review: data };
}
```

---

### 8.2 تقييم مزدوج

**متى تحدث:**
- محاولة تقييم نفس النشاط أو المنتج أكثر من مرة

**المعالجة:**
```javascript
async function checkDuplicateReview(userId, businessId, productId, bookingId, orderId) {
  let query = supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', userId);
  
  if (productId) {
    query = query.eq('product_id', productId);
  } else if (businessId) {
    query = query.eq('business_id', businessId);
  }
  
  if (bookingId) {
    query = query.eq('booking_id', bookingId);
  }
  
  if (orderId) {
    query = query.eq('order_id', orderId);
  }
  
  const { data: existing } = await query;
  
  if (existing.length > 0) {
    return {
      exists: true,
      review_id: existing[0].id,
      message: 'لقد قيّمت هذا العنصر مسبقاً',
      action: 'edit_existing'
    };
  }
  
  return { exists: false };
}

// في نموذج التقييم
async function submitReview(reviewData) {
  const duplicate = await checkDuplicateReview(
    getCurrentUserId(),
    reviewData.business_id,
    reviewData.product_id,
    reviewData.booking_id,
    reviewData.order_id
  );
  
  if (duplicate.exists) {
    const shouldEdit = await showConfirmDialog(
      'لقد قيّمت هذا العنصر مسبقاً. هل تريد تعديل تقييمك؟',
      'تقييم موجود'
    );
    
    if (shouldEdit) {
      // تحديث التقييم الموجود
      await supabase
        .from('reviews')
        .update(reviewData)
        .eq('id', duplicate.review_id);
      
      showNotification('تم تحديث تقييمك بنجاح', 'success');
    }
    
    return { success: false, action: 'edit' };
  }
  
  // إنشاء تقييم جديد
  return await createReview(reviewData);
}
```

---

### 8.3 تقييم مسيء

**متى تحدث:**
- فحص المحتوى واكتشاف الكلمات غير اللائقة قبل النشر

**المعالجة:**
```javascript
const BANNED_WORDS = [
  // قائمة الكلمات المحظورة
  'كلمة1', 'كلمة2', 'كلمة3'
];

function checkInappropriateContent(text) {
  const lowerText = text.toLowerCase();
  
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return {
        inappropriate: true,
        word,
        message: 'التقييم يحتوي على كلمات غير لائقة. يرجى تعديله'
      };
    }
  }
  
  return { inappropriate: false };
}

async function submitReview(reviewData) {
  // فحص المحتوى
  const contentCheck = checkInappropriateContent(reviewData.comment);
  
  if (contentCheck.inappropriate) {
    return {
      success: false,
      error: 'inappropriate_content',
      message: contentCheck.message
    };
  }
  
  // فحص الصور (اختياري)
  if (reviewData.images_urls && reviewData.images_urls.length > 0) {
    for (const imageUrl of reviewData.images_urls) {
      const imageCheck = await checkImageContent(imageUrl);
      if (imageCheck.inappropriate) {
        return {
          success: false,
          error: 'inappropriate_image',
          message: 'إحدى الصور تحتوي على محتوى غير لائق'
        };
      }
    }
  }
  
  // إنشاء التقييم
  return await createReview(reviewData);
}

// فحص الصور باستخدام AI (اختياري)
async function checkImageContent(imageUrl) {
  // يمكن استخدام خدمة مثل Google Vision AI أو AWS Rekognition
  // هذا مثال بسيط
  return { inappropriate: false };
}
```

---

## 9. حالات الاشتراكات (Subscription Cases)

### 9.1 انتهاء الاشتراك

**متى تحدث:**
- تحويل الحالة لـ `expired` عبر مهمة مجدولة وإشعار المستخدم

**المعالجة:**
```javascript
// مهمة مجدولة (Cron Job) يومياً
async function checkExpiredSubscriptions() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: expiredSubscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .lt('end_date', today);
  
  for (const subscription of expiredSubscriptions) {
    // تحديث الحالة
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('id', subscription.id);
    
    // إشعار المستخدم
    await sendNotification({
      user_id: subscription.user_id,
      type: 'subscription',
      title: 'انتهى اشتراكك',
      message: 'لقد انتهى اشتراكك. يرجى التجديد للاستمرار في استخدام الميزات المدفوعة',
      data: {
        subscription_id: subscription.id,
        action: 'renew'
      }
    });
    
    // تعطيل الميزات المدفوعة
    await disablePaidFeatures(subscription.user_id);
  }
}

async function disablePaidFeatures(userId) {
  // تعطيل الميزات حسب الخطة
  // مثال: تقليل عدد الفروع المسموح بها
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .single();
  
  if (business) {
    // تقليل عدد الفروع إلى 1
    const { data: branches } = await supabase
      .from('branches')
      .select('id')
      .eq('business_id', business.id)
      .order('created_at', { ascending: true });
    
    if (branches.length > 1) {
      // تعطيل الفروع الإضافية (ليس حذفها)
      const extraBranches = branches.slice(1);
      await supabase
        .from('branches')
        .update({ is_active: false })
        .in('id', extraBranches.map(b => b.id));
      
      showNotification(
        'تم تعطيل الفروع الإضافية بسبب انتهاء الاشتراك',
        'warning'
      );
    }
  }
}
```

---

### 9.2 فشل تجديد تلقائي

**متى تحدث:**
- فشل عملية خصم الاشتراك التلقائي وتغيير الحالة لـ `past_due`

**المعالجة:**
```javascript
async function processAutoRenewal(subscriptionId) {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, user:profiles(*), plan:subscription_plans(*)')
    .eq('id', subscriptionId)
    .single();
  
  if (!subscription.auto_renew) {
    return { success: false, reason: 'auto_renew_disabled' };
  }
  
  const amount = subscription.billing_cycle === 'monthly'
    ? subscription.plan.price_monthly
    : subscription.plan.price_yearly;
  
  // محاولة الخصم من المحفظة
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', subscription.user_id)
    .single();
  
  if (wallet.balance >= amount) {
    // خصم من المحفظة
    await supabase.rpc('update_wallet_balance', {
      p_user_id: subscription.user_id,
      p_amount: -amount,
      p_type: 'subscription_renewal'
    });
    
    // تجديد الاشتراك
    const newEndDate = subscription.billing_cycle === 'monthly'
      ? addMonths(subscription.end_date, 1)
      : addYears(subscription.end_date, 1);
    
    await supabase
      .from('subscriptions')
      .update({
        end_date: newEndDate,
        status: 'active'
      })
      .eq('id', subscriptionId);
    
    return { success: true, new_end_date: newEndDate };
  } else {
    // فشل التجديد
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('id', subscriptionId);
    
    // إشعار المستخدم
    await sendNotification({
      user_id: subscription.user_id,
      type: 'subscription',
      title: 'فشل تجديد الاشتراك',
      message: `رصيد المحفظة غير كافٍ لتجديد الاشتراك (${amount} MAD). يرجى شحن المحفظة`,
      data: {
        subscription_id: subscriptionId,
        amount,
        action: 'topup_wallet'
      }
    });
    
    // إعطاء مهلة 7 أيام
    setTimeout(async () => {
      const { data: updatedSubscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('id', subscriptionId)
        .single();
      
      if (updatedSubscription.status === 'past_due') {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscriptionId);
        
        await disablePaidFeatures(subscription.user_id);
      }
    }, 7 * 24 * 60 * 60 * 1000); // 7 أيام
    
    return { success: false, error: 'insufficient_balance' };
  }
}
```

---

## 10. حالات المخزون (Inventory Cases)

### 10.1 مخزون سالب

**متى تحدث:**
- المعالجة عبر Trigger في قاعدة البيانات لمنع أرقام المخزون السالبة

**المعالجة:**
```sql
-- Trigger لمنع المخزون السالب
CREATE OR REPLACE FUNCTION prevent_negative_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity < 0 THEN
    RAISE EXCEPTION 'لا يمكن أن يكون المخزون سالباً. المنتج: %', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_negative_stock_trigger
BEFORE UPDATE OF stock_quantity ON products
FOR EACH ROW
EXECUTE FUNCTION prevent_negative_stock();

-- في الواجهة الأمامية
async function updateProductStock(productId, newQuantity) {
  if (newQuantity < 0) {
    showNotification('لا يمكن أن يكون المخزون سالباً', 'error');
    return { success: false };
  }
  
  const { data, error } = await supabase
    .from('products')
    .update({ stock_quantity: newQuantity })
    .eq('id', productId);
  
  if (error) {
    if (error.message.includes('لا يمكن أن يكون المخزون سالباً')) {
      showNotification('لا يمكن أن يكون المخزون سالباً', 'error');
      return { success: false };
    }
    throw error;
  }
  
  return { success: true };
}
```

---

### 10.2 تنبيه مخزون منخفض

**متى تحدث:**
- إرسال إشعار تلقائي عند وصول المنتج للحد الأدنى للكمية

**المعالجة:**
```sql
-- Trigger لإرسال تنبيه عند وصول المخزون للحد الأدنى
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity <= NEW.min_stock_alert THEN
    -- إنشاء إشعار لصاحب المتجر
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      (SELECT owner_id FROM businesses WHERE id = NEW.seller_id),
      'inventory',
      'مخزون منخفض',
      format('المنتج "%s" وصل للمخزون الأدنى (%s قطعة)', NEW.name, NEW.stock_quantity),
      jsonb_build_object('product_id', NEW.id, 'stock', NEW.stock_quantity)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_low_stock_trigger
AFTER UPDATE OF stock_quantity ON products
FOR EACH ROW
WHEN (NEW.stock_quantity <= NEW.min_stock_alert)
EXECUTE FUNCTION notify_low_stock();

// في الواجهة الأمامية - عرض تنبيهات المخزون المنخفض
async function getLowStockProducts(businessId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', businessId)
    .