/**
 * BarberFlow Pro - صفحة تسجيل الدخول
 * المسار: auth/login.js
 */

import { auth, db } from "../core/firebase-init.js";
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
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
import { showNotification, showOtpModal } from "../shared/js/notifications.js";
import { PATHS, resolvePath } from "../shared/js/paths.js";
import { sanitizeEmail, sanitizePhone } from "../middleware/validation/index.js";

// ============================================
// عناصر DOM
// ============================================
const loginForm = document.getElementById('loginForm');
const googleBtn = document.getElementById('googleBtn');
const submitBtn = document.getElementById('mainSubmitBtn');
const forgotModal = document.getElementById('forgotModal');
const registerOptionsModal = document.getElementById('registerOptionsModal');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const passwordGroup = document.getElementById('passwordGroup');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');

// ============================================
// دوال مساعدة
// ============================================

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

// ============================================
// معالجة نموذج تسجيل الدخول
// ============================================
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const identifier = loginEmailInput.value.trim();

        // الخطوة 2: إذا كان حقل كلمة المرور ظاهراً
        if (!passwordGroup.classList.contains('hidden-step')) {
            const password = loginPasswordInput.value;
            if (!password) {
                showNotification("يرجى إدخال كلمة المرور الخاصة بك", "error");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';

            try {
                const userCred = await signInWithEmailAndPassword(auth, identifier, password);
                await routeUserByRole(userCred.user.uid);
            } catch (error) {
                console.error("Login error:", error);
                showNotification("خطأ في البيانات، تأكد من صحة الحساب وكلمة المرور", "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>تسجيل الدخول</span> <i class="fas fa-sign-in-alt"></i>';
            }
            return;
        }

        // الخطوة 1: التحقق الأولي
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق من الحساب...';

        if (identifier.includes('@')) {
            // بريد إلكتروني
            const sanitizedEmail = sanitizeEmail(identifier);
            if (!sanitizedEmail) {
                showNotification("صيغة البريد الإلكتروني غير صحيحة", "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
                return;
            }

            const accountCheck = await checkUserAccountExists(sanitizedEmail);
            
            if (!accountCheck.exists) {
                showNotification("هذا البريد الإلكتروني غير مسجل لدينا! قم بإنشاء حساب جديد أولاً.", "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
                return;
            }

            // إظهار حقل كلمة المرور
            loginEmailInput.disabled = true;
            passwordGroup.classList.remove('hidden-step');
            passwordGroup.classList.add('show-step-animation');
            loginPasswordInput.required = true;
            loginPasswordInput.focus();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>تسجيل الدخول</span> <i class="fas fa-sign-in-alt"></i>';

        } else {
            // رقم هاتف
            const formattedPhone = formatMoroccanPhoneNumber(identifier);
            const sanitizedPhone = sanitizePhone(formattedPhone);
            
            if (!sanitizedPhone || !sanitizedPhone.startsWith('+212') || sanitizedPhone.length < 13) {
                showNotification("يرجى إدخال بريد إلكتروني صحيح أو رقم هاتف مغربي يبدأ بـ 06 أو 07", "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
                return;
            }

            const accountCheck = await checkUserAccountExists(sanitizedPhone);
            
            if (!accountCheck.exists) {
                showNotification("رقم الهاتف هذا غير مسجل لدينا! يرجى النقر على إنشاء حساب لتسجيله.", "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
                return;
            }

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إرسال الرمز...';

            try {
                if (!window.recaptchaVerifier) {
                    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                        'size': 'invisible'
                    });
                }

                const confirmationResult = await signInWithPhoneNumber(auth, sanitizedPhone, window.recaptchaVerifier);
                const code = await showOtpModal();
                
                if (code) {
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق من الرمز...';
                    const result = await confirmationResult.confirm(code);
                    await routeUserByRole(result.user.uid);
                } else {
                    showNotification("تم إلغاء عملية التحقق بالرمز", "info");
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
                }
            } catch (error) {
                console.error("OTP error:", error);
                showNotification("فشل إرسال الرمز، يرجى التحقق من الرقم والمحاولة مجدداً", "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
            }
        }
    };
}

// ============================================
// زر Google
// ============================================
if (googleBtn) {
    googleBtn.onclick = async (e) => {
        e.stopPropagation();
        googleBtn.disabled = true;
        googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاتصال...';

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            
            const userDoc = await getDoc(doc(db, "users", result.user.uid));
            
            if (userDoc.exists()) {
                await routeUserByRole(result.user.uid);
            } else {
                showNotification("أهلاً بك! يرجى تحديد نوع الحساب لإكمال تسجيلك.", "info");
                showRegisterOptionsModalForGoogle(result.user);
            }
        } catch (error) {
            console.error("Google login error:", error);
            
            if (error.code === 'auth/popup-closed-by-user') {
                showNotification("تم إغلاق نافذة Google قبل إتمام العملية", "info");
            } else if (error.code === 'auth/popup-blocked') {
                showNotification("تم حظر النافذة المنبثقة، يرجى السماح بها في إعدادات المتصفح", "error");
            } else {
                showNotification("فشل الارتباط الآمن مع خوادم Google", "error");
            }
            
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"> <span>Google</span>';
        }
    };
}

// ============================================
// نافذة اختيار الدور لحسابات Google الجديدة
// ============================================
function showRegisterOptionsModalForGoogle(firebaseUser) {
    const modal = document.getElementById('registerOptionsModal');
    if (!modal) return;
    
    modal.classList.remove('hidden-step');
    modal.classList.add('show-step-animation');
    
    const closeBtn = modal.querySelector('#closeRegisterModal');
    const roleBtns = modal.querySelectorAll('.select-role-action-btn');
    
    const cleanup = () => {
        modal.classList.add('hidden-step');
        modal.classList.remove('show-step-animation');
        closeBtn.onclick = null;
        roleBtns.forEach(btn => btn.onclick = null);
    };
    
    closeBtn.onclick = () => {
        cleanup();
        googleBtn.disabled = false;
        googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"> <span>Google</span>';
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            cleanup();
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"> <span>Google</span>';
        }
    };
    
    roleBtns.forEach(button => {
        button.onclick = async () => {
            const role = button.getAttribute('data-role');
            
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التجهيز...';

            try {
                await setDoc(doc(db, "users", firebaseUser.uid), {
                    fullName: firebaseUser.displayName || "مستخدم Google",
                    contactInfo: firebaseUser.email,
                    authType: "google",
                    role: role,
                    createdAt: new Date(),
                    status: "new"
                });

                cleanup();
                window.location.replace(resolvePath('WELCOME') + `?uid=${firebaseUser.uid}`);
            } catch (error) {
                console.error("Error saving Google user:", error);
                showNotification("حدث خطأ أثناء حفظ الصلاحيات، يرجى إعادة المحاولة", "error");
                
                button.disabled = false;
                const iconClass = role === 'customer' ? 'fa-user' : role === 'salon' ? 'fa-scissors' : 'fa-store';
                button.innerHTML = `<i class="fas ${iconClass}"></i> <span>${button.querySelector('span').textContent}</span>`;
            }
        };
    });
}

// ============================================
// نافذة نسيت كلمة المرور
// ============================================
const forgotPassBtn = document.getElementById('forgotPassBtn');
if (forgotPassBtn) {
    forgotPassBtn.onclick = (e) => {
        e.preventDefault();
        forgotModal.classList.remove('hidden-step');
        forgotModal.classList.add('show-step-animation');
    };
}

function hideModal() {
    forgotModal.classList.add('hidden-step');
    forgotModal.classList.remove('show-step-animation');
}

const closeModal = document.getElementById('closeModal');
if (closeModal) {
    closeModal.onclick = hideModal;
}

const sendResetBtn = document.getElementById('sendResetBtn');
if (sendResetBtn) {
    sendResetBtn.onclick = async () => {
        const identifier = document.getElementById('resetIdentifier').value.trim();
        if (!identifier) {
            showNotification("يرجى إدخال البريد الإلكتروني الخاص بك", "error");
            return;
        }

        sendResetBtn.disabled = true;
        sendResetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

        try {
            if (identifier.includes('@')) {
                await sendPasswordResetEmail(auth, identifier);
                showNotification("تم إرسال رابط التعيين الفوري لبريدك الإلكتروني", "success");
                hideModal();
            } else {
                showNotification("الحسابات المرتبطة بأرقام الهواتف تعتمد على الـ OTP فقط", "warning");
            }
        } catch (error) {
            console.error("Password reset error:", error);
            showNotification("لم نتمكن من العثور على الحساب أو معالجة الطلب", "error");
        } finally {
            sendResetBtn.disabled = false;
            sendResetBtn.innerHTML = '<span>إرسال رابط التعيين</span>';
        }
    };
}

// ============================================
// زر العودة للرئيسية
// ============================================
if (backToHomeBtn) {
    backToHomeBtn.onclick = () => {
        window.location.href = resolvePath('INDEX');
    };
}

// ============================================
// زر "إنشاء حساب جديد" - فتح النافذة المضمنة
// ============================================
const showRegisterOptions = document.getElementById('showRegisterOptions');
if (showRegisterOptions) {
    showRegisterOptions.onclick = (e) => {
        e.preventDefault();
        if (registerOptionsModal) {
            registerOptionsModal.classList.remove('hidden-step');
            registerOptionsModal.classList.add('show-step-animation');
            
            const roleBtns = registerOptionsModal.querySelectorAll('.select-role-action-btn');
            const closeBtn = registerOptionsModal.querySelector('#closeRegisterModal');
            
            const closeModalFunc = () => {
                registerOptionsModal.classList.add('hidden-step');
                registerOptionsModal.classList.remove('show-step-animation');
            };
            
            closeBtn.onclick = closeModalFunc;
            
            registerOptionsModal.onclick = (e) => {
                if (e.target === registerOptionsModal) {
                    closeModalFunc();
                }
            };
            
            roleBtns.forEach(button => {
                button.onclick = () => {
                    const role = button.getAttribute('data-role');
                    closeModalFunc();
                    window.location.href = resolvePath('REGISTER') + `?role=${role}`;
                };
            });
        }
    };
}

