/**
 * middleware/routing/page-router.js
 * نظام التوجيه والحماية المركزي
 */
import { auth, db } from "../../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../../shared/js/notifications.js";
import { PATHS } from "../../shared/js/paths.js";

export const initPageRouter = () => {
    onAuthStateChanged(auth, async (user) => {
        const currentPath = window.location.pathname;
        const isWelcomePage = currentPath.includes("welcome.html");
        const isAddPage = currentPath.includes("add-salon.html") || 
                          currentPath.includes("add-store.html") || 
                          currentPath.includes("add-customer.html");
        const isSetupPage = currentPath.includes("setup-salon.html") || 
                            currentPath.includes("setup-store.html");
        const isOnboardingZone = isWelcomePage || isAddPage || isSetupPage;

        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const role = userData.role;
                    const userStatus = userData.status || "new";
                    const onboardingStatus = userData.onboardingStatus || "none";

                    if (userStatus === "active" || onboardingStatus === "completed") {
                        showPageContent();
                        return;
                    }

                    if (userStatus === "new" && onboardingStatus !== "completed") {
                        if (sessionStorage.getItem("skipOnboardingAsset")) {
                            showPageContent();
                            return;
                        }

                        if (!isOnboardingZone) {
                            let targetPath = PATHS.WELCOME;
                            if (onboardingStatus === "none" || !onboardingStatus) {
                                if (role === "salon") targetPath = PATHS.ADD_SALON;
                                else if (role === "store") targetPath = PATHS.ADD_STORE;
                                else if (role === "customer") targetPath = PATHS.ADD_CUSTOMER;
                            } else if (onboardingStatus === "basic_done") {
                                if (role === "salon") targetPath = PATHS.SETUP_SALON;
                                else if (role === "store") targetPath = PATHS.SETUP_STORE;
                                else if (role === "customer") {
                                    showPageContent();
                                    return;
                                }
                            }
                            triggerRecoveryModal(role, onboardingStatus, targetPath);
                        }
                    }
                }
            } catch (error) {
                console.error("❌ خطأ في نظام التوجيه:", error);
            }
        } else {
            if (isOnboardingZone) {
                window.location.replace(PATHS.LOGIN);
                return;
            }
        }
        showPageContent();
    });
};

function triggerRecoveryModal(role, currentStep, targetPath) {
    if (document.getElementById('routerRecoveryModal')) return;
    let title = "تخصيص حسابك التجاري 🪄";
    let text = "لم تقم بتهيئة ملفك العملي بالكامل بعد.";

    if (role === "salon") { title = "إعداد صالونك المحترف 💈"; text = "تبقى خطوة واحدة لتفعيل نظام الحجوزات والظهور للزبائن."; } 
    else if (role === "store") { title = "تجهيز متجرك الموثق 🛍️"; text = "ابدأ في عرض وبيع منتجاتك. أكمل إعداد المتجر لتنشيط سلة الشراء."; } 
    else if (role === "customer") { title = "إكمال ملفك الشخصي 👤"; text = "لنستمتع بتجربة حجز فريدة، يرجى إكمال معلومات ملفك الشخصي."; }

    const modal = document.createElement('div');
    modal.id = 'routerRecoveryModal';
    modal.className = 'global-otp-overlay';
    modal.innerHTML = `
        <div class="global-otp-modal" style="max-width: 450px;">
            <div class="global-otp-icon"><i class="fas fa-user-clock"></i></div>
            <h2 class="global-otp-title">${title}</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 25px;">${text}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <button id="modalConfirmBtn" class="btn btn-accent" style="padding: 12px;">إكمال الآن</button>
                <button id="modalCancelBtn" class="btn btn-outline" style="padding: 12px;">لاحقاً</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#modalConfirmBtn').onclick = () => { modal.remove(); window.location.href = targetPath; };
    modal.querySelector('#modalCancelBtn').onclick = () => {
        sessionStorage.setItem("skipOnboardingAsset", "true");
        modal.remove();
        showNotification("تم تأجيل إكمال البيانات، يمكنك تصفح الموقع الآن.", "info");
        showPageContent();
    };
}

function showPageContent() {
    if (document.body) document.body.style.visibility = "visible";
}

export { triggerRecoveryModal, showPageContent };

