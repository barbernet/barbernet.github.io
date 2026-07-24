/**
 * BarberFlow Pro - صفحة الحجز
 * المسار: booking.js
 * المميزات:
 * - حجز متعدد الخطوات
 * - عرض الخدمات والتواريخ والأوقات
 * - التحقق من توفر الأوقات
 * - تأكيد الحجز
 */

import { auth, db } from "./config/firebase-init.js";
import {
    doc, getDoc, collection, query, where, addDoc, serverTimestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "./shared/js/notifications.js";
import { PATHS, resolvePath } from "./shared/utils/paths.js";
import { sanitizeText, sanitizePhone } from "./middleware/validation/index.js";

// ============================================
// المتغيرات العامة
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const salonId = urlParams.get('salon');
let currentUser = null;
let salonData = null;
let services = [];
let currentStep = 1;
const totalSteps = 4;

let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date();

// ============================================
// عناصر DOM
// ============================================
const form = document.getElementById('bookingForm');
const steps = document.querySelectorAll('.booking-step');
const progressSteps = document.querySelectorAll('.progress-step');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const confirmBtn = document.getElementById('confirmBtn');
const backBtn = document.getElementById('backBtn');

// ============================================
// التحقق من الجلسة
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showNotification("يرجى تسجيل الدخول للحجز", "warning");
        setTimeout(() => {
            window.location.replace(resolvePath('LOGIN'));
        }, 2000);
        return;
    }

    currentUser = user;
    
    if (!salonId) {
        showNotification("لم يتم تحديد الصالون", "error");
        setTimeout(() => {
            window.location.replace(resolvePath('EXPLORE_SALON'));
        }, 2000);
        return;
    }

    await loadSalonData();
    await loadServices();
    setupEventListeners();
});

// ============================================
// تحميل بيانات الصالون
// ============================================
async function loadSalonData() {
    try {
        const snap = await getDoc(doc(db, "salons", salonId));
        if (!snap.exists()) {
            showNotification("هذا الصالون غير موجود", "error");
            setTimeout(() => {
                window.location.replace(resolvePath('EXPLORE_SALON'));
            }, 2000);
            return;
        }

        salonData = { id: salonId, ...snap.data() };
        renderSalonInfo();
    } catch (error) {
        console.error("خطأ في تحميل بيانات الصالون:", error);
        showNotification("حدث خطأ في تحميل البيانات", "error");
    }
}

// ============================================
// عرض معلومات الصالون
// ============================================
function renderSalonInfo() {
    if (!salonData) return;

    const avatar = document.getElementById('salonAvatar');
    if (salonData.coverImage && avatar) {
        avatar.innerHTML = `<img src="${salonData.coverImage}" alt="${salonData.salonName}">`;
    }

    setText('salonName', salonData.salonName || "صالون");
    setText('salonLocation', salonData.location || "غير محدد");
    setText('salonRating', salonData.rating?.toFixed(1) || "5.0");
}

// ============================================
// تحميل الخدمات
// ============================================
async function loadServices() {
    if (!salonData?.services || salonData.services.length === 0) {
        renderEmptyServices();
        return;
    }

    services = salonData.services;
    renderServices();
}

// ============================================
// عرض الخدمات
// ============================================
function renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    grid.innerHTML = services.map((service, index) => `
        <div class="service-card" data-index="${index}">
            <div class="service-icon">
                <i class="fas fa-cut"></i>
            </div>
            <div class="service-details">
                <h3>${service.name}</h3>
                <div class="service-meta">
                    <span class="duration">
                        <i class="fas fa-clock"></i>
                        ${service.duration || 30} دقيقة
                    </span>
                </div>
            </div>
            <div class="service-price">${service.price} DH</div>
        </div>
    `).join('');

    // أحداث اختيار الخدمة
    grid.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedService = services[parseInt(card.dataset.index)];
            nextBtn.disabled = false;
        });
    });
}

// ============================================
// عرض حالة فارغة للخدمات
// ============================================
function renderEmptyServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-cut"></i>
            <p>لا توجد خدمات متاحة حالياً</p>
            <small>يرجى التواصل مع الصالون مباشرة</small>
        </div>
    `;
}

// ============================================
// إعداد التقويم
// ============================================
function setupCalendar() {
    renderCalendar();

    document.getElementById('prevMonth')?.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });
}

// ============================================
// عرض التقويم
// ============================================
function renderCalendar() {
    const daysContainer = document.getElementById('calendarDays');
    const monthLabel = document.getElementById('currentMonth');
    
    if (!daysContainer || !monthLabel) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = '';
    
    // أيام فارغة قبل بداية الشهر
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // أيام الشهر
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isPast = date < today;
        const isToday = date.getTime() === today.getTime();
        const dayName = date.toLocaleDateString('ar-EG', { weekday: 'long' });
        
        // التحقق من أن الصالون يعمل في هذا اليوم
        const isWorkingDay = isSalonWorkingDay(dayName);
        const isDisabled = isPast || !isWorkingDay;
        
        const isSelected = selectedDate && 
            selectedDate.getDate() === day && 
            selectedDate.getMonth() === month && 
            selectedDate.getFullYear() === year;

        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" 
                 data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}"
                 ${!isDisabled ? 'data-selectable="true"' : ''}>
                <span class="day-number">${day}</span>
                <span class="day-name">${dayName}</span>
            </div>
        `;
    }

    daysContainer.innerHTML = html;

    // أحداث اختيار التاريخ
    daysContainer.querySelectorAll('[data-selectable]').forEach(day => {
        day.addEventListener('click', () => {
            daysContainer.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            day.classList.add('selected');
            
            const dateStr = day.dataset.date;
            selectedDate = new Date(dateStr);
            
            const dateInfo = document.getElementById('selectedDateInfo');
            const dateText = document.getElementById('selectedDateText');
            
            if (dateInfo && dateText) {
                dateInfo.style.display = 'flex';
                dateText.textContent = selectedDate.toLocaleDateString('ar-EG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            
            nextBtn.disabled = false;
        });
    });
}

// ============================================
// التحقق من يوم العمل
// ============================================
function isSalonWorkingDay(dayName) {
    if (!salonData?.workDays) return true;
    return salonData.workDays.includes(dayName);
}

// ============================================
// تحميل الأوقات المتاحة
// ============================================
async function loadAvailableSlots() {
    if (!selectedDate || !salonData?.workingHours) return;

    const morningSlots = document.getElementById('morningSlots');
    const afternoonSlots = document.getElementById('afternoonSlots');
    const eveningSlots = document.getElementById('eveningSlots');
    const noSlots = document.getElementById('noSlotsAvailable');

    if (!morningSlots || !afternoonSlots || !eveningSlots) return;

    // مسح الأوقات السابقة
    morningSlots.innerHTML = '';
    afternoonSlots.innerHTML = '';
    eveningSlots.innerHTML = '';

    const { open, close } = salonData.workingHours;
    const [openHour, openMin] = open.split(':').map(Number);
    const [closeHour, closeMin] = close.split(':').map(Number);

    const slots = [];
    let hour = openHour;
    let minute = openMin;

    while (hour < closeHour || (hour === closeHour && minute < closeMin)) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push(timeStr);
        
        minute += 30;
        if (minute >= 60) {
            minute = 0;
            hour++;
        }
    }

    // التحقق من الأوقات المحجوزة
    const bookedSlots = await getBookedSlots();

    // تقسيم الأوقات حسب الفترة
    const morning = slots.filter(t => {
        const h = parseInt(t.split(':')[0]);
        return h >= 6 && h < 12;
    });
    
    const afternoon = slots.filter(t => {
        const h = parseInt(t.split(':')[0]);
        return h >= 12 && h < 17;
    });
    
    const evening = slots.filter(t => {
        const h = parseInt(t.split(':')[0]);
        return h >= 17 && h < 23;
    });

    // عرض الأوقات
    renderTimeSlots(morning, bookedSlots, morningSlots);
    renderTimeSlots(afternoon, bookedSlots, afternoonSlots);
    renderTimeSlots(evening, bookedSlots, eveningSlots);

    if (morning.length === 0 && afternoon.length === 0 && evening.length === 0) {
        if (noSlots) noSlots.style.display = 'block';
    } else {
        if (noSlots) noSlots.style.display = 'none';
    }
}

// ============================================
// جلب الأوقات المحجوزة
// ============================================
async function getBookedSlots() {
    if (!selectedDate || !salonId) return [];

    try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const bookingsRef = collection(db, "bookings");
        const q = query(
            bookingsRef,
            where("salonId", "==", salonId),
            where("date", "==", dateStr),
            where("status", "in", ["confirmed", "pending"])
        );
        
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data().time);
    } catch (error) {
        console.error("خطأ في جلب الأوقات المحجوزة:", error);
        return [];
    }
}

// ============================================
// عرض الأوقات
// ============================================
function renderTimeSlots(slots, bookedSlots, container) {
    if (!container) return;

    container.innerHTML = slots.map(time => {
        const isBooked = bookedSlots.includes(time);
        return `
            <button type="button" 
                    class="time-slot ${isBooked ? 'booked' : ''}" 
                    data-time="${time}"
                    ${!isBooked ? 'data-selectable="true"' : ''}>
                ${time}
            </button>
        `;
    }).join('');

    // أحداث اختيار الوقت
    container.querySelectorAll('[data-selectable]').forEach(slot => {
        slot.addEventListener('click', () => {
            container.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
            selectedTime = slot.dataset.time;
            
            const timeInfo = document.getElementById('selectedTimeInfo');
            const timeText = document.getElementById('selectedTimeText');
            
            if (timeInfo && timeText) {
                timeInfo.style.display = 'flex';
                timeText.textContent = selectedTime;
            }
            
            nextBtn.disabled = false;
        });
    });
}

// ============================================
// ملخص الحجز
// ============================================
function renderBookingSummary() {
    if (selectedService) {
        setText('summaryService', selectedService.name);
        setText('summaryDuration', `${selectedService.duration || 30} دقيقة`);
        setText('summaryPrice', `${selectedService.price} DH`);
    }

    if (selectedDate) {
        setText('summaryDate', selectedDate.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    }

    if (selectedTime) {
        setText('summaryTime', selectedTime);
    }

    if (salonData) {
        setText('summarySalon', salonData.salonName);
        setText('summaryLocation', salonData.location);
    }

    if (currentUser) {
        setText('summaryCustomerName', currentUser.displayName || currentUser.email || "مستخدم");
        setText('summaryCustomerPhone', currentUser.phoneNumber || "غير محدد");
    }
}

// ============================================
// تأكيد الحجز
// ============================================
async function confirmBooking() {
    if (!currentUser || !selectedService || !selectedDate || !selectedTime) {
        showNotification("يرجى إكمال جميع الخطوات", "error");
        return;
    }

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري التأكيد...</span>';

    try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        
        const bookingData = {
            salonId: salonId,
            salonName: salonData.salonName,
            customerId: currentUser.uid,
            customerName: currentUser.displayName || currentUser.email,
            customerPhone: currentUser.phoneNumber,
            customerEmail: currentUser.email,
            serviceId: selectedService.id || selectedService.name,
            serviceName: selectedService.name,
            servicePrice: selectedService.price,
            serviceDuration: selectedService.duration || 30,
            date: dateStr,
            time: selectedTime,
            notes: document.getElementById('bookingNotes')?.value || "",
            status: 'pending',
            createdAt: serverTimestamp(),
            totalAmount: selectedService.price
        };

        const docRef = await addDoc(collection(db, "bookings"), bookingData);
        
        showNotification("تم الحجز بنجاح! 🎉", "success");
        
        // عرض شاشة النجاح
        document.getElementById('bookingRef').textContent = docRef.id.substring(0, 8).toUpperCase();
        goToStep(5);
        
        // إخفاء أزرار التنقل
        document.getElementById('bookingActions').style.display = 'none';
        
    } catch (error) {
        console.error("خطأ في تأكيد الحجز:", error);
        showNotification("حدث خطأ أثناء تأكيد الحجز", "error");
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> <span>تأكيد الحجز</span>';
    }
}

// ============================================
// التنقل بين الخطوات
// ============================================
function goToStep(step) {
    if (step < 1 || step > 5) return;

    // إخفاء الخطوة الحالية
    steps[currentStep - 1]?.classList.remove('active');
    progressSteps[currentStep - 1]?.classList.remove('active');
    
    if (step > currentStep) {
        progressSteps[currentStep - 1]?.classList.add('completed');
    }

    // إظهار الخطوة الجديدة
    currentStep = step;
    steps[currentStep - 1]?.classList.add('active');
    progressSteps[currentStep - 1]?.classList.add('active');

    // تحديث الأزرار
    updateNavigationButtons();

    // إجراءات خاصة بكل خطوة
    if (step === 2) {
        setupCalendar();
    } else if (step === 3) {
        loadAvailableSlots();
    } else if (step === 4) {
        renderBookingSummary();
    }

    // التمرير للأعلى
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// تحديث أزرار التنقل
// ============================================
function updateNavigationButtons() {
    if (currentStep === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'flex';
        confirmBtn.style.display = 'none';
        nextBtn.disabled = !selectedService;
    } else if (currentStep === 2) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        confirmBtn.style.display = 'none';
        nextBtn.disabled = !selectedDate;
    } else if (currentStep === 3) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        confirmBtn.style.display = 'none';
        nextBtn.disabled = !selectedTime;
    } else if (currentStep === 4) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'none';
        confirmBtn.style.display = 'flex';
    }
}

// ============================================
// إعداد مستمعي الأحداث
// ============================================
function setupEventListeners() {
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                goToStep(currentStep + 1);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await confirmBooking();
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    if (document.getElementById('viewBookingBtn')) {
        document.getElementById('viewBookingBtn').addEventListener('click', () => {
            window.location.href = resolvePath('PROFILE_CUSTOMER');
        });
    }

    if (document.getElementById('backToHomeBtn')) {
        document.getElementById('backToHomeBtn').addEventListener('click', () => {
            window.location.href = resolvePath('INDEX');
        });
    }
}

// ============================================
// دوال مساعدة
// ============================================
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

