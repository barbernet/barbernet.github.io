/**
 * middleware/auth/auth-state.js
 * إدارة حالة المستخدم الحالية
 * الدور: جلب بيانات المستخدم من Firebase Auth + Firestore
 */
import { auth, db } from "../../core/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * جلب بيانات المستخدم الحالي مع معلوماته الكاملة من Firestore
 * @returns {Promise<Object|null>} بيانات المستخدم أو null إذا لم يكن مسجلاً
 */
export const getCurrentUser = () => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            // إلغاء المستمع بعد أول استدعاء لتجنب التكرار
            unsubscribe();
            
            if (!user) {
                resolve(null);
                return;
            }

            try {
                // جلب بيانات المستخدم من Firestore
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // دمج بيانات Firebase مع Firestore
                    resolve({
                        uid: user.uid,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        ...userDoc.data()
                    });
                } else {
                    // المستخدم موجود في Auth لكن ليس في Firestore
                    resolve({
                        uid: user.uid,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        role: 'customer',
                        status: 'new'
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                resolve(null);
            }
        });

        // مهلة زمنية في حالة عدم وجود مستخدم (5 ثوانٍ)
        setTimeout(() => {
            if (!auth.currentUser) {
                unsubscribe();
                resolve(null);
            }
        }, 5000);
    });
};

/**
 * التحقق مما إذا كان المستخدم مسجل الدخول حالياً (بدون انتظار)
 * @returns {boolean}
 */
export const isUserLoggedIn = () => {
    return !!auth.currentUser;
};

/**
 * جلب معرف المستخدم الحالي فوراً
 * @returns {string|null}
 */
export const getCurrentUserId = () => {
    return auth.currentUser?.uid || null;
};

