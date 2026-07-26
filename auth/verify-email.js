/**
BarberFlow Pro - صفحة تأكيد البريد الإلكتروني
المسار: auth/verify-email.js
*/
import { supabase } from "../config/supabase-init.js";
import { showNotification } from "../shared/utils/notifications.js";
import { resolvePath } from "../shared/utils/paths.js";

// ============================================
// 1. نظام الحماية المدمج
// ============================================
const safetyTimer = setTimeout(() => {
    console.warn("⚠️ Safety Timer Triggered: Revealing verify page.");
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
}, 5000);

// التحقق من حالة المستخدم
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    clearTimeout(safetyTimer);
    
    // إذا تم تفعيل البريد وتسجيل الدخول، وجهه للترحيب
    if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.innerHTML = `<div class="loader-logo"><i class="fas fa-cut"></i><span>BarberFlow Pro</span></div><div class="loader-spinner"></div><div class="loader-text">تم التفعيل! جاري الترحيب...</div>`;
            loader.classList.remove('hidden');
        }
        setTimeout(() => window.location.replace(resolvePath('WELCOME')), 1500);
        return;
    }

    // إظهار الصفحة للمستخدمين الذين لم يفعلوا بريدهم بعد
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
    
    initializeVerifyPage();
});

// ============================================
// 2. تهيئة صفحة الانتظار
// ============================================
function initializeVerifyPage() {
    const resendBtn = document.getElementById('resendBtn');
    const emailDisplay = document.getElementById('emailDisplay');
    
    // عرض البريد الإلكتروني من الجلسة الحالية أو التخزين المحلي
    const currentUser = supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.email) {
            emailDisplay.textContent = data.session.user.email;
        } else {
            // إذا لم يكن هناك جلسة نشطة، قد يكون المستخدم قد أغلق المتصفح
            // يمكن استرجاعه من localStorage إذا تم حفظه أثناء التسجيل
            const pendingData = localStorage.getItem('bf-pending-profile');
            if (pendingData) {
                // نحتاج لجلب البريد من مكان ما، هنا نفترض أنه محفوظ
                // في التطبيق الحقيقي يفضل حفظ البريد في localStorage عند التسجيل
            } else {
                emailDisplay.textContent = "بريدك الإلكتروني";
            }
        }
    });

    // منطق إعادة إرسال البريد
    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            resendBtn.disabled = true;
            resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
            
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                
                if (error || !user) {
                    throw new Error("No active session found");
                }
                
                await supabase.auth.resend({
                    type: 'signup',
                    email: user.email
                });
                
                showNotification("تم إرسال رابط التفعيل مجدداً!", "success");
                
                // عداد زمني لإعادة التفعيل
                let seconds = 60;
                const originalText = resendBtn.innerHTML;
                const timer = setInterval(() => {
                    seconds--;
                    resendBtn.innerHTML = `<i class="fas fa-clock"></i> <span>انتظر ${seconds} ثانية</span>`;
                    if (seconds <= 0) {
                        clearInterval(timer);
                        resendBtn.disabled = false;
                        resendBtn.innerHTML = originalText;
                    }
                }, 1000);
                
            } catch (error) {
                console.error("Resend error:", error);
                showNotification("فشل إعادة الإرسال. تأكد من تسجيل دخولك أولاً.", "error");
                resendBtn.disabled = false;
                resendBtn.innerHTML = '<i class="fas fa-redo"></i> <span>إعادة إرسال البريد</span>';
            }
        });
    }
}

