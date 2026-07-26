/**
BarberFlow Pro - صفحة تسجيل الدخول
المسار: auth/login.js
*/
import { supabase } from "../config/supabase-init.js";
import { showNotification } from "../shared/utils/notifications.js";
import { resolvePath } from "../shared/utils/paths.js";
import { sanitizeEmail, sanitizePhone } from "../middleware/validation/index.js";

// ============================================
// 1. نظام الحماية المدمج (بدون CSS visibility:hidden)
// ============================================
const safetyTimer = setTimeout(() => {
    console.warn("️ Safety Timer Triggered: Revealing login page.");
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
}, 5000);

// التحقق من حالة المستخدم وتوجيهه إذا كان مسجلاً
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    clearTimeout(safetyTimer);
    
    if (session?.user) {
        try {
            // ✅ استخدام جدول profiles حسب دليل Supabase
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (!error && profile) {
                // توجيه جميع المستخدمين المسجلين إلى welcome للتحقق من الحالة
                const loader = document.getElementById('pageLoader');
                if (loader) {
                    loader.innerHTML = `<div class="loader-logo"><i class="fas fa-cut"></i><span>BarberFlow Pro</span></div><div class="loader-spinner"></div><div class="loader-text">جاري توجيهك...</div>`;
                    loader.classList.remove('hidden');
                }
                setTimeout(() => window.location.replace(resolvePath('WELCOME')), 1000);
                return;
            }
        } catch (error) {
            console.error("Error checking user role:", error);
        }
    }

    // إظهار الصفحة للمستخدمين غير المسجلين
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
    
    initializeLoginPage();
});

// ============================================
// 2. تهيئة واجهة تسجيل الدخول
// ============================================
function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const googleBtn = document.getElementById('googleBtn');
    const submitBtn = document.getElementById('mainSubmitBtn');
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const forgotPassLink = document.getElementById('forgotPassLink');

    // تحميل البيانات المحفوظة
    const savedEmail = localStorage.getItem('bf-remember-email');
    if (savedEmail) {
        loginEmailInput.value = savedEmail;
        rememberMeCheckbox.checked = true;
        loginPasswordInput.focus();
    }

    function handleRememberMe(identifier) {
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('bf-remember-email', identifier);
        } else {
            localStorage.removeItem('bf-remember-email');
        }
    }

    // ✅ إصلاح زر إظهار/إخفاء كلمة المرور باستخدام closest
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.password-wrapper');
            const input = wrapper ? wrapper.querySelector('input') : null;
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
                    
                    // ✅ تسجيل الدخول عبر Supabase
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email: sanitizedEmail,
                        password: password
                    });
                    
                    if (error) throw error;
                    
                    handleRememberMe(sanitizedEmail);
                    // عند نجاح التسجيل، سيتم تفعيل onAuthStateChange تلقائياً وتوجيه المستخدم لـ welcome
                    
                } else {
                    showNotification("تسجيل الدخول برقم الهاتف قيد التطوير حالياً", "warning");
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>تسجيل الدخول</span><i class="fas fa-sign-in-alt"></i>';
                }
            } catch (error) {
                console.error("Login error:", error);
                let msg = "خطأ في البيانات، تأكد من صحة الحساب وكلمة المرور";
                if (error.message === "invalid_email") msg = "صيغة البريد الإلكتروني غير صحيحة";
                if (error.code === 'invalid_credentials' || error.code === 'invalid_login_credentials') msg = "كلمة المرور غير صحيحة";
                
                showNotification(msg, "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>تسجيل الدخول</span><i class="fas fa-sign-in-alt"></i>';
            }
        });
    }

    // زر Google معطل مؤقتاً
    if (googleBtn) {
        googleBtn.onclick = () => {
            showNotification("التسجيل عبر Google قيد التطوير حالياً، يرجى استخدام البريد الإلكتروني.", "warning");
        };
    }

    if (forgotPassLink) {
        forgotPassLink.onclick = (e) => {
            e.preventDefault();
            window.location.href = resolvePath('FORGOT_PASSWORD');
        };
    }

    if (backToHomeBtn) {
        backToHomeBtn.onclick = () => window.location.href = resolvePath('INDEX');
    }
}

