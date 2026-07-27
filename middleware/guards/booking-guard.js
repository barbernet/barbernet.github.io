/**
 * middleware/guards/booking-guard.js
 * حارس الحجوزات - التحقق من توفر الأوقات ومنع التكرار
 */
import { supabase } from "../../config/supabase-init.js";

/**
 * التحقق من توفر وقت الحجز (منع Double Booking)
 * @param {string} branchId - معرف الفرع
 * @param {string} date - التاريخ (YYYY-MM-DD)
 * @param {string} time - الوقت (HH:MM)
 * @returns {Promise<boolean>}
 */
export const isSlotAvailable = async (branchId, date, time) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('id')
            .eq('branch_id', branchId)
            .eq('booking_date', date)
            .eq('start_time', time)
            .in('status', ['confirmed', 'pending'])
            .limit(1);

        if (error) {
            console.error("Error checking slot availability:", error);
            return false;
        }

        return data.length === 0;
    } catch (error) {
        console.error("Error checking slot availability:", error);
        return false;
    }
};

/**
 * التحقق من صحة بيانات الحجز قبل الإرسال
 * @param {Object} data - بيانات الحجز
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateBookingData = (data) => {
    const requiredFields = ['service_id', 'booking_date', 'start_time', 'customer_id'];
    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            return {
                isValid: false,
                message: `الحقل "${field}" مطلوب.`
            };
        }
    }

    // التحقق من أن التاريخ ليس في الماضي
    const bookingDate = new Date(data.booking_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
        return {
            isValid: false,
            message: "لا يمكن الحجز في تاريخ مضى."
        };
    }

    // التحقق من صيغة الوقت
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(data.start_time)) {
        return {
            isValid: false,
            message: "صيغة الوقت غير صحيحة. استخدم HH:MM (مثال: 14:30)"
        };
    }

    // التحقق من end_time إذا كان موجوداً
    if (data.end_time && !timeRegex.test(data.end_time)) {
        return {
            isValid: false,
            message: "صيغة وقت الانتهاء غير صحيحة."
        };
    }

    return { isValid: true, message: "البيانات صحيحة" };
};

/**
 * التحقق من أن الصالون مفتوح في وقت الحجز
 * @param {Object} workingHours - أوقات العمل {open: "09:00", close: "21:00", days: ["sun","mon"]}
 * @param {string} time - وقت الحجز
 * @param {string} day - اليوم (اختياري)
 * @returns {boolean}
 */
export const isWithinWorkingHours = (workingHours, time, day = null) => {
    if (!workingHours?.open || !workingHours?.close) return true;
    
    if (day && workingHours.days && !workingHours.days.includes(day)) {
        return false;
    }

    const [hour, minute] = time.split(':').map(Number);
    const [openHour, openMinute] = workingHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = workingHours.close.split(':').map(Number);

    const bookingMinutes = hour * 60 + minute;
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    // معالجة حالة العمل بعد منتصف الليل
    if (closeMinutes < openMinutes) {
        return bookingMinutes >= openMinutes || bookingMinutes < closeMinutes;
    }

    return bookingMinutes >= openMinutes && bookingMinutes < closeMinutes;
};

/**
 * الحصول على الأوقات المتاحة ليوم معين
 * @param {string} branchId - معرف الفرع
 * @param {string} date - التاريخ
 * @param {Object} workingHours - أوقات العمل
 * @param {number} intervalMinutes - الفاصل الزمني بالدقائق (افتراضي: 30)
 * @returns {Promise<string[]>} قائمة الأوقات المتاحة
 */
export const getAvailableSlots = async (branchId, date, workingHours, intervalMinutes = 30) => {
    try {
        if (!workingHours?.open || !workingHours?.close) {
            return [];
        }

        const availableSlots = [];
        const [openHour, openMinute] = workingHours.open.split(':').map(Number);
        const [closeHour, closeMinute] = workingHours.close.split(':').map(Number);

        let currentHour = openHour;
        let currentMinute = openMinute;

        while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
            const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            const isAvailable = await isSlotAvailable(branchId, date, timeString);
            
            if (isAvailable) {
                availableSlots.push(timeString);
            }

            currentMinute += intervalMinutes;
            if (currentMinute >= 60) {
                currentMinute = 0;
                currentHour++;
            }
        }

        return availableSlots;
    } catch (error) {
        console.error("Error getting available slots:", error);
        return [];
    }
};

