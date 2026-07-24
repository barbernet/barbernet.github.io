/**
BarberFlow Pro - صفحة تسجيل الدخول
المسار: auth/login.js
*/
import { auth, db } from "../config/firebase-init.js";
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showNotification, showOtpModal } from "../shared/utils/notifications.js";
import { resolvePath } from "../shared/utils/paths.js";
import { sanitizeEmail, sanitizePhone } from "../middleware/validation/index.js";

// ============================================
// 1. مهلة أمان: تضمن إزالة loader بعد 5 ثوانٍ كحد أقصى
// ============================================
const safetyTimer = setTimeout(() => {
    console.warn("⚠️ Safety Timer Triggered: Revealing page to prevent permanent white screen.");
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
    document.body.classList.remove('page-protected');
    document.body.classList.add('page-loaded');
}, 5000); // 5 ثوانٍ

// ============================================
// 2. التحقق من حالة المستخدم
// ============================================
const unsubscribe = auth.onAuthStateChanged(async (user) => {
    // إلغاء المهلة إذا تم التحقق بنجاح
    clearTimeout(safetyTimer);

    if (user) {
        // المستخدم مسجل دخوله، تحقق من الدور وتوجهه
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const role = userDoc.data().role;
                const routes = {
                    'salon': resolvePath('PROFILE_SALON'),
                    'store': resolvePath('PROFILE_STORE'),
                    'customer': resolvePath('PROFILE_CUSTOMER')
                };
                const targetRoute = routes[role] || resolvePath('INDEX');
                
                // أظهر loader مع رسالة التوجيه
                const loader = document.getElementById('pageLoader');
                if (loader) {
                    loader.innerHTML = `
                        <div class="loader-logo">
                            <i class="fas fa-cut"></i>
                            <span>BarberFlow Pro</span>
                        </div>
                        <div class="loader-spinner"></div>
                        <div class="loader-text">جاري توجيهك...</div>
                    `;
                    loader.classList.remove('hidden');
                }

                showNotification("أنت مسجل دخولك بالفعل، جاري توجيهك...", "info");
                
                setTimeout(() => {
                    window.location.replace(targetRoute);
                }, 1500);
                return; // لا تظهر محتوى الصفحة
            }
        } catch (error) {
            console.error("Error checking user role:", error);
            showNotification("حدث خطأ أثناء التحقق من صلاحياتك.", "error");
        }
    }

    // المستخدم غير مسجل، أظهر loader مع رسالة التحقق
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.innerHTML = `
            <div class="loader-logo">
                <i class="fas fa-cut"></i>
                <span>BarberFlow Pro</span>
            </div>
            <div class="loader-spinner"></div>
            <div class="loader-text">جاري التحقق من الحساب...</div>
        `;
        loader.classList.remove('hidden');
    }

    // بعد التحقق، أزل loader وأظهر المحتوى
    setTimeout(() => {
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 400);
        }
        document.body.classList.remove('page-protected');
        document.body.classList.add('page-loaded');
    }, 1000); // انتظر ثانية واحدة قبل إظهار المحتوى

    // تهيئة واجهة تسجيل الدخول بعد التحقق (وإذا لم يتم التوجيه)
    // نقل الكود هنا
    initializeLoginPage();
});

// ============================================
// 3. تهيئة واجهة تسجيل الدخول (داخل دالة منفصلة)
// ============================================

function initializeLoginPage() {
    // --- تعريف العناصر ---
    const loginForm = document.getElementById('loginForm');
    const googleBtn = document.getElementById('googleBtn');
    const submitBtn = document.getElementById('mainSubmitBtn');
    const registerOptionsModal = document.getElementById('registerOptionsModal');
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const showRegisterOptions = document.getElementById('showRegisterOptions');
    const forgotPassLink = document.getElementById('forgotPassLink');

    // --- دوال المعالجة ---
    const savedEmail = localStorage.getItem('bf-remember-email');
    if (savedEmail) {
        loginEmailInput.value = savedEmail;
        rememberMeCheckbox.checked = true;
        loginPasswordInput.focus();
    }

    function formatMoroccanPhoneNumber(phone) {
        let cleaned = phone.replace(/\s+/g, '');
        if (cleaned.startsWith('06') || cleaned.startsWith('07')) {
            return '+212' + cleaned.substring(1);
        }
        return cleaned;
    }

    async function checkUserAccountExists(identifier) {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("contactInfo", "==", identifier));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                return { exists: true, data: querySnapshot.docs[0].data() };
            }
            return { exists: false, data: null };
        } catch (error) {
            console.error("Error checking account existence:", error);
            return { exists: false, data: null };
        }
    }

    async function routeUserByRole(uid) {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const role = userDoc.data().role;
                const routes = {
                    'salon': resolvePath('PROFILE_SALON'),
                    'customer': resolvePath('PROFILE_CUSTOMER'),
                    'store': resolvePath('PROFILE_STORE')
                };
                window.location.replace(routes[role] || resolvePath('INDEX'));
            } else {
                showNotification("تم تسجيل الدخول بنجاح، ولكن لم نجد دوراً مسجلاً لحسابك.", "warning");
            }
        } catch (error) {
            console.error("Error routing user:", error);
            showNotification("حدث خطأ في توجيه الحساب", "error");
        }
    }

    function handleRememberMe(identifier) {
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('bf-remember-email', identifier);
        } else {
            localStorage.removeItem('bf-remember-email');
        }
    }

    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = btn.querySelector('i');
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identifier = loginEmailInput.value.trim();
            const password = loginPasswordInput.value;
            
            if (!identifier) return showNotification("يرجى إدخال البريد الإلكتروني أو رقم الهاتف", "error");
            if (!password) return showNotification("يرجى إدخال كلمة المرور", "error");
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
            
            try {
                if (identifier.includes('@')) {
                    const sanitizedEmail = sanitizeEmail(identifier);
                    if (!sanitizedEmail) throw new Error("invalid_email");
                    
                    const userCred = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
                    handleRememberMe(sanitizedEmail);
                    await routeUserByRole(userCred.user.uid);
                } else {
                    const sanitizedPhone = sanitizePhone(formatMoroccanPhoneNumber(identifier));
                    if (!sanitizedPhone || !sanitizedPhone.startsWith('+212') || sanitizedPhone.length < 13) {
                        throw new Error("invalid_phone");
                    }
                    
                    const accountCheck = await checkUserAccountExists(sanitizedPhone);
                    if (!accountCheck.exists) throw new Error("user_not_found");
                    
                    if (!window.recaptchaVerifier) {
                        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
                    }
                    
                    const confirmationResult = await signInWithPhoneNumber(auth, sanitizedPhone, window.recaptchaVerifier);
                    const code = await showOtpModal();
                    
                    if (code) {
                        const result = await confirmationResult.confirm(code);
                        handleRememberMe(sanitizedPhone);
                        await routeUserByRole(result.user.uid);
                    } else {
                        showNotification("تم إلغاء عملية التحقق", "info");
                    }
                }
            } catch (error) {
                console.error("Login error:", error);
                let msg = "خطأ في البيانات، تأكد من صحة الحساب وكلمة المرور";
                if (error.message === "invalid_email") msg = "صيغة البريد الإلكتروني غير صحيحة";
                if (error.message === "invalid_phone") msg = "يرجى إدخال رقم هاتف مغربي صحيح يبدأ بـ 06 أو 07";
                if (error.message === "user_not_found") msg = "هذا الحساب غير مسجل لدينا";
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "كلمة المرور غير صحيحة";
                
                showNotification(msg, "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>تسجيل الدخول</span><i class="fas fa-sign-in-alt"></i>';
            }
        });
    }

    if (googleBtn) {
        googleBtn.onclick = async () => {
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاتصال...';
            try {
                const result = await signInWithPopup(auth, new GoogleAuthProvider());
                const userDoc = await getDoc(doc(db, "users", result.user.uid));
                if (userDoc.exists()) {
                    await routeUserByRole(result.user.uid);
                } else {
                    showNotification("أهلاً بك! يرجى تحديد نوع الحساب.", "info");
                    registerOptionsModal.classList.remove('hidden-step');
                    registerOptionsModal.classList.add('show-step-animation');
                }
            } catch (error) {
                console.error("Google login error:", error);
                showNotification("فشل الارتباط الآمن مع Google", "error");
            } finally {
                googleBtn.disabled = false;
                googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"><span>Google</span>';
            }
        };
    }

    if (showRegisterOptions) {
        showRegisterOptions.onclick = (e) => {
            e.preventDefault();
            registerOptionsModal.classList.remove('hidden-step');
            registerOptionsModal.classList.add('show-step-animation');
        };
    }

    if (document.getElementById('closeRegisterModal')) {
        document.getElementById('closeRegisterModal').onclick = () => {
            registerOptionsModal.classList.add('hidden-step');
            registerOptionsModal.classList.remove('show-step-animation');
        };
    }

    document.querySelectorAll('.select-role-action-btn').forEach(btn => {
        btn.onclick = () => {
            const role = btn.getAttribute('data-role');
            registerOptionsModal.classList.add('hidden-step');
            window.location.href = resolvePath('REGISTER') + `?role=${role}`;
        };
    });

    if (forgotPassLink) {
        forgotPassLink.onclick = (e) => {
            e.preventDefault();
            window.location.href = resolvePath('FORGOT_PASSWORD');
        };
    }

    if (backToHomeBtn) {
        backToHomeBtn.onclick = () => {
            window.location.href = resolvePath('INDEX');
        };
    }
}

