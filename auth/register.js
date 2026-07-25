/**
BarberFlow Pro - صفحة إنشاء حساب جديد
المسار: auth/register.js
*/
import { supabase } from "../config/supabase-init.js";
import { showNotification } from "../shared/utils/notifications.js";
import { resolvePath } from "../shared/utils/paths.js";
import { sanitizeText, sanitizeEmail } from "../middleware/validation/index.js";

// ============================================
// 1. نظام الحماية المدمج (بدون CSS visibility:hidden)
// ============================================
const safetyTimer = setTimeout(() => {
    console.warn("⚠️ Safety Timer Triggered: Revealing register page.");
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
}, 5000);

// التحقق من حالة المستخدم
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    clearTimeout(safetyTimer);
    
    if (event === 'SIGNED_IN' && session?.user) {
        try {
            const { data: userDoc, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (!error && userDoc) {
                const routes = {
                    'salon': resolvePath('PROFILE_SALON'),
                    'store': resolvePath('PROFILE_STORE'),
                    'customer': resolvePath('PROFILE_CUSTOMER')
                };
                const targetRoute = routes[userDoc.role] || resolvePath('INDEX');
                
                showNotification("أنت مسجل دخولك بالفعل، جاري توجيهك...", "info");
                
                const loader = document.getElementById('pageLoader');
                if (loader) {
                    loader.innerHTML = `<div class="loader-logo"><i class="fas fa-cut"></i><span>BarberFlow Pro</span></div><div class="loader-spinner"></div><div class="loader-text">جاري توجيهك...</div>`;
                    loader.classList.remove('hidden');
                }
                
                setTimeout(() => window.location.replace(targetRoute), 1500);
                return;
            }
        } catch (error) {
            console.error("Error checking user role:", error);
        }
    }

    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
    
    initializeRegisterPage();
});

// ============================================
// 2. تهيئة واجهة التسجيل
// ============================================
function initializeRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    const fullNameInput = document.getElementById('fullName');
    const identifierInput = document.getElementById('identifier');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const matchIndicator = document.getElementById('matchIndicator');
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    const googleBtn = document.getElementById('googleBtn');

    // التحقق من تطابق كلمات المرور
    function checkPasswordMatch() {
        const pass = passwordInput.value;
        const confirmPass = confirmPasswordInput.value;
        
        if (confirmPass === '') {
            matchIndicator.textContent = '';
            matchIndicator.className = 'match-indicator';
            return false;
        }
        
        if (pass === confirmPass) {
            matchIndicator.innerHTML = '<i class="fas fa-check-circle"></i> كلمتا المرور متطابقتان';
            matchIndicator.className = 'match-indicator match';
            return true;
        } else {
            matchIndicator.innerHTML = '<i class="fas fa-times-circle"></i> كلمتا المرور غير متطابقتين';
            matchIndicator.className = 'match-indicator no-match';
            return false;
        }
    }

    passwordInput.addEventListener('input', checkPasswordMatch);
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);

    // إظهار/إخفاء كلمة المرور
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

    // معالجة نموذج التسجيل
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = sanitizeText(fullNameInput.value.trim());
            const identifier = identifierInput.value.trim();
            const password = passwordInput.value;
            const selectedRole = document.querySelector('input[name="role"]:checked').value;
            
            if (!fullName || fullName.length < 3) {
                return showNotification("يرجى إدخال اسم صحيح (3 أحرف على الأقل)", "error");
            }
            
            if (!checkPasswordMatch()) {
                return showNotification("كلمتا المرور غير متطابقتين", "error");
            }
            
            if (password.length < 6) {
                return showNotification("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
            }
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
            
            try {
                const isEmail = identifier.includes('@');
                
                if (isEmail) {
                    const sanitizedEmail = sanitizeEmail(identifier);
                    if (!sanitizedEmail) throw new Error("invalid_email");
                    
                    const { data, error } = await supabase.auth.signUp({
                        email: sanitizedEmail,
                        password: password,
                        options: {
                            data: {
                                full_name: fullName,
                                role: selectedRole
                            }
                        }
                    });
                    
                    if (error) throw error;
                    
                    showNotification("تم إنشاء الحساب بنجاح! يرجى تفعيل بريدك الإلكتروني.", "success");
                    
                    localStorage.setItem('bf-pending-profile', JSON.stringify({
                        uid: data.user.id,
                        role: selectedRole,
                        fullName: fullName
                    }));
                    
                    setTimeout(() => {
                        window.location.href = resolvePath('LOGIN');
                    }, 3000);
                    
                } else {
                    throw new Error("phone_disabled");
                }
                
            } catch (error) {
                console.error("Registration error:", error);
                let msg = "فشل إنشاء الحساب، يرجى المحاولة مرة أخرى.";
                
                if (error.message === "invalid_email") msg = "صيغة البريد الإلكتروني غير صحيحة";
                if (error.code === "User already registered") msg = "هذا البريد الإلكتروني مستخدم مسبقاً";
                if (error.message === "phone_disabled") msg = "التسجيل برقم الهاتف قيد التطوير حالياً، يرجى استخدام البريد الإلكتروني.";
                
                showNotification(msg, "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>إنشاء الحساب</span><i class="fas fa-arrow-left"></i>';
            }
        });
    }

    // تعطيل زر Google وإظهار تنبيه
    if (googleBtn) {
        googleBtn.onclick = () => {
            showNotification("التسجيل عبر Google قيد التطوير حالياً، يرجى استخدام البريد الإلكتروني.", "warning");
        };
    }

    // زر العودة للرئيسية
    if (backToHomeBtn) {
        backToHomeBtn.onclick = () => window.location.href = resolvePath('INDEX');
    }
}

