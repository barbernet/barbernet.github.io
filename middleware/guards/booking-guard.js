/**
 * middleware/guards/booking-guard.js
 * حارس الحجوزات - التحقق من توفر الأوقات ومنع التكرار
 */
import { db } from "../../core/firebase-init.js";
import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * التحقق من توفر وقت الحجز (منع Double Booking)
 * @param {string} salonId - معرف الصالون
 * @param {string} date - التاريخ (YYYY-MM-DD)
 * @param {string} time - الوقت (HH:MM)
 * @returns {Promise<boolean>}
 */
export const isSlotAvailable = async (salonId, date, time) => {
    try {
        const bookingsRef = collection(db, "bookings");
        
        const q = query(
            bookingsRef,
            where("salonId", "==", salonId),
            where("date", "==", date),
            where("time", "==", time),
            where("status", "in", ["confirmed", "pending"])
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.empty;
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
    const requiredFields = ['salonId', 'date', 'time', 'customerId', 'customerName'];
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            return {
                isValid: false,
                message: `الحقل "${field}" مطلوب.`
            };
        }
    }

    // التحقق من أن التاريخ ليس في الماضي (مع معالجة timezone)
    const bookingDate = new Date(data.date + 'T00:00:00');
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
    if (!timeRegex.test(data.time)) {
        return {
            isValid: false,
            message: "صيغة الوقت غير صحيحة. استخدم HH:MM (مثال: 14:30)"
        };
    }

    return { isValid: true, message: "البيانات صحيحة" };
};

/**
 * التحقق من أن الصالون مفتوح في وقت الحجز
 * @param {Object} workingHours - أوقات العمل {open: "09:00", close: "21:00"}
 * @param {string} time - وقت الحجز
 * @param {string} day - اليوم (اختياري)
 * @returns {boolean}
 */
export const isWithinWorkingHours = (workingHours, time, day = null) => {
    if (!workingHours?.open || !workingHours?.close) return true;

    if (day && workingHours.workDays && !workingHours.workDays.includes(day)) {
        return false;
    }

    const [hour, minute] = time.split(':').map(Number);
    const [openHour, openMinute] = workingHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = workingHours.close.split(':').map(Number);

    const bookingMinutes = hour * 60 + minute;
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    if (closeMinutes < openMinutes) {
        return bookingMinutes >= openMinutes || bookingMinutes < closeMinutes;
    }

    return bookingMinutes >= openMinutes && bookingMinutes < closeMinutes;
};

/**
 * الحصول على الأوقات المتاحة ليوم معين
 * @param {string} salonId
 * @param {string} date
 * @param {Object} workingHours
 * @returns {Promise<string[]>} قائمة الأوقات المتاحة
 */
export const getAvailableSlots = async (salonId, date, workingHours) => {
    try {
        const availableSlots = [];
        
        const [openHour, openMinute] = workingHours.open.split(':').map(Number);
        const [closeHour, closeMinute] = workingHours.close.split(':').map(Number);

        let currentHour = openHour;
        let currentMinute = openMinute;

        while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
            const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

            const isAvailable = await isSlotAvailable(salonId, date, timeString);
            if (isAvailable) {
                availableSlots.push(timeString);
            }

            currentMinute += 30;
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

