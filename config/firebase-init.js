/**
حزمة التأسيس: BarberFlow-Pro Firebase Initializer
الدور: تهيئة خدمات Firebase وتثبيت حالة تسجيل الدخول.
المسار: config/firebase-init.js
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// استيراد مفاتيح الربط من ملف الإعدادات
import { firebaseConfig } from "./config.js";

// 1. تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// 2. تهيئة خدمة المصادقة (Auth) وتفعيل ثبات الجلسة
const auth = getAuth(app);

/**
وظيفة تأمين الجلسة:
تضمن بقاء المستخدم (سواء برقم الهاتف أو البريد) مسجلاً للدخول
عبر تخزين البيانات في LocalStorage الخاص بالمتصفح.
*/
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ BarberFlow-Pro: تم تفعيل ثبات الجلسة بنجاح.");
  })
  .catch((error) => {
    console.error("❌ فشل تفعيل ثبات الجلسة:", error.message);
  });

// 3. تهيئة خدمات قواعد البيانات والتخزين
const db = getFirestore(app);
const storage = getStorage(app);

// تصدير الخدمات للاستخدام في كافة ملفات المشروع
export { auth, db, storage };
export default app;

