/**
 * شريط التنقل العام
 * المسار: shared/layout/global-navbar.js
 * ⚠️ تم التحديث: Supabase + الثيم الفاتح افتراضي
 */
import { supabase } from "../../config/supabase-init.js";
import { PATHS, resolvePath } from "../utils/paths.js";
import { showNotification } from "../utils/notifications.js";
import { getCurrentTheme, toggleTheme as toggleStoredTheme } from "../utils/user-preferences.js";

// ============================================
// التحميل الأولي
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("global-navbar-container");
    if (!container) return;

    try {
        const currentScriptUrl = new URL(import.meta.url);
        const navbarPath = new URL('./global-navbar.html', currentScriptUrl).href;
        const response = await fetch(navbarPath);
        if (!response.ok) throw new Error("Navbar HTML not found");

        container.innerHTML = await response.text();
        updateAllPaths();
        setupNavigationLogic();
        setupSettingsDropdown();
        setupThemeToggle();
        setupLanguageSelector();
        setupNotificationsToggle();
        setupPrivacyButton();
        setupHelpButton();
        setupUserState();
        setupCartBadge();
        highlightActivePage();
    } catch (error) {
        console.error("❌ خطأ في تحميل الشريط:", error);
    }
});

// ============================================
// تحديث جميع المسارات
// ============================================
function updateAllPaths() {
    const container = document.getElementById('global-navbar-container');
    if (!container) return;

    const links = container.querySelectorAll('[data-path]');
    links.forEach(link => {
        const key = link.getAttribute('data-path');
        const fullPath = resolvePath(key);
        link.setAttribute('href', fullPath);
    });
}

// ============================================
// القائمة الجانبية
// ============================================
function setupNavigationLogic() {
    const menuBtn = document.getElementById("navMenuBtn");
    const closeBtn = document.getElementById("closeMenuBtn");
    const drawer = document.getElementById("sideDrawer");
    const overlay = document.getElementById("drawerOverlay");

    if (!menuBtn || !drawer || !overlay) return;

    const open = () => {
        drawer.classList.add("open");
        overlay.classList.add("active");
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        drawer.classList.remove("open");
        overlay.classList.remove("active");
        document.body.style.overflow = '';
    };

    menuBtn.onclick = open;
    closeBtn.onclick = close;
    overlay.onclick = close;

    drawer.querySelectorAll('.drawer-link').forEach(link => {
        link.onclick = close;
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    });
}

// ============================================
// قائمة الإعدادات المنسدلة
// ============================================
function setupSettingsDropdown() {
    const settingsBtn = document.getElementById('settingsBtn');
    const dropdown = document.getElementById('settingsDropdown');

    if (!settingsBtn || !dropdown) return;

    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('show');
        document.querySelectorAll('.dropdown-menu.show').forEach(d => {
            d.classList.remove('show');
        });
        if (!isOpen) {
            dropdown.classList.add('show');
        }
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !settingsBtn.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdown.classList.remove('show');
        }
    });
}

// ============================================
// تبديل الثيم (الثيم الفاتح افتراضي)
// ============================================
function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const drawerThemeBtn = document.getElementById('drawerThemeToggle');
    const drawerThemeText = document.getElementById('drawerThemeText');

    // ✅ الثيم الفاتح هو الافتراضي
    const currentTheme = getCurrentTheme();
    applyThemeUI(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = toggleStoredTheme();
            applyThemeUI(newTheme);
            document.getElementById('settingsDropdown').classList.remove('show');
        });
    }

    if (drawerThemeBtn) {
        drawerThemeBtn.addEventListener('click', () => {
            const newTheme = toggleStoredTheme();
            applyThemeUI(newTheme);
        });
    }

    function applyThemeUI(theme) {
        // ✅ الثيم الفاتح = إزالة data-theme، الداكن = إضافته
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.body.removeAttribute('data-theme');
        }

        // تحديث الأيقونات والنصوص
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        if (themeText) {
            themeText.textContent = theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن';
        }
        if (drawerThemeText) {
            drawerThemeText.textContent = theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن';
        }
        const drawerIcon = drawerThemeBtn?.querySelector('i');
        if (drawerIcon) {
            drawerIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// ============================================
// اختيار اللغة
// ============================================
function setupLanguageSelector() {
    const langItems = document.querySelectorAll('.submenu-item[data-lang]');
    const savedLang = localStorage.getItem('barberflow_lang') || 'ar';
    updateLanguageUI(savedLang);

    langItems.forEach(item => {
        item.onclick = () => {
            const lang = item.getAttribute('data-lang');
            localStorage.setItem('barberflow_lang', lang);
            updateLanguageUI(lang);
            const langNames = { 'ar': 'العربية', 'fr': 'Français', 'en': 'English' };
            showNotification(`تم تغيير اللغة إلى ${langNames[lang]}`, "info");
            document.getElementById('settingsDropdown').classList.remove('show');
        };
    });

    function updateLanguageUI(lang) {
        langItems.forEach(item => {
            item.classList.remove('active');
            const checkIcon = item.querySelector('.fa-check');
            if (checkIcon) checkIcon.remove();
            if (item.getAttribute('data-lang') === lang) {
                item.classList.add('active');
                const icon = document.createElement('i');
                icon.className = 'fas fa-check';
                item.appendChild(icon);
            }
        });
    }
}

// ============================================
// تبديل الإشعارات
// ============================================
function setupNotificationsToggle() {
    const notifToggleBtn = document.getElementById('notificationsToggleBtn');
    const notifIcon = document.getElementById('notifIcon');
    const notifText = document.getElementById('notifText');

    const notificationsEnabled = localStorage.getItem('barberflow_notifications') !== 'false';
    updateNotificationsUI(notificationsEnabled);

    if (notifToggleBtn) {
        notifToggleBtn.onclick = () => {
            const currentState = localStorage.getItem('barberflow_notifications') !== 'false';
            const newState = !currentState;
            localStorage.setItem('barberflow_notifications', newState);
            updateNotificationsUI(newState);
            document.getElementById('settingsDropdown').classList.remove('show');
        };
    }

    function updateNotificationsUI(enabled) {
        if (notifIcon) notifIcon.className = enabled ? 'fas fa-bell' : 'fas fa-bell-slash';
        if (notifText) notifText.textContent = enabled ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات';
    }
}

// ============================================
// زر الخصوصية
// ============================================
function setupPrivacyButton() {
    const privacyBtn = document.getElementById('privacyBtn');
    if (privacyBtn) {
        privacyBtn.onclick = () => {
            showNotification('صفحة إعدادات الخصوصية قيد التطوير', "info");
            document.getElementById('settingsDropdown').classList.remove('show');
        };
    }
}

// ============================================
// زر المساعدة
// ============================================
function setupHelpButton() {
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.onclick = () => {
            showNotification('صفحة المساعدة والدعم قيد التطوير', "info");
            document.getElementById('settingsDropdown').classList.remove('show');
        };
    }
}

// ============================================
// حالة المستخدم (Supabase)
// ============================================
function setupUserState() {
    const userBtn = document.getElementById('userBtn');
    const drawerUserInfo = document.getElementById('drawerUserInfo');
    const drawerUserName = document.getElementById('drawerUserName');
    const drawerUserRole = document.getElementById('drawerUserRole');
    const drawerProfileLink = document.getElementById('drawerProfileLink');
    const drawerDashboardLink = document.getElementById('drawerDashboardLink');
    const drawerSettingsLink = document.getElementById('drawerSettingsLink');
    const drawerLoginLink = document.getElementById('drawerLoginLink');
    const drawerLogoutLink = document.getElementById('drawerLogoutLink');

    if (!userBtn) return;

    // ✅ استخدام Supabase Auth بدلاً من Firebase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            const user = session?.user;

            if (user) {
                userBtn.href = resolvePath('PROFILE_CUSTOMER');
                
                try {
                    // ✅ جلب بيانات المستخدم من جدول profiles
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('full_name, role, onboarding_status')
                        .eq('id', user.id)
                        .single();

                    if (!error && profile) {
                        const userName = profile.full_name || 'مستخدم';
                        const role = profile.role || 'customer';

                        if (drawerUserInfo) drawerUserInfo.style.display = 'flex';
                        if (drawerUserName) drawerUserName.textContent = `مرحباً، ${userName}`;

                        const roleNames = { 
                            customer: 'زبون', 
                            salon: 'صاحب صالون', 
                            store: 'صاحب متجر' 
                        };
                        if (drawerUserRole) drawerUserRole.textContent = roleNames[role] || 'زبون';

                        const profileMap = {
                            customer: 'PROFILE_CUSTOMER',
                            salon: 'PROFILE_SALON',
                            store: 'PROFILE_STORE'
                        };
                        if (drawerProfileLink) {
                            drawerProfileLink.href = resolvePath(profileMap[role] || 'PROFILE_CUSTOMER');
                        }

                        // إظهار لوحة التحكم والإعدادات لأصحاب الصالونات والمتاجر
                        if (role === 'salon' || role === 'store') {
                            if (drawerDashboardLink) {
                                drawerDashboardLink.style.display = 'flex';
                                drawerDashboardLink.href = resolvePath('DASHBOARD');
                            }
                            if (drawerSettingsLink) {
                                drawerSettingsLink.style.display = 'flex';
                                drawerSettingsLink.href = resolvePath('SETTINGS_GENERAL');
                            }
                        } else {
                            if (drawerDashboardLink) drawerDashboardLink.style.display = 'none';
                            if (drawerSettingsLink) drawerSettingsLink.style.display = 'none';
                        }
                    }
                } catch (error) {
                    console.error('خطأ في جلب بيانات المستخدم:', error);
                }

                if (drawerLoginLink) drawerLoginLink.style.display = 'none';
                if (drawerLogoutLink) {
                    drawerLogoutLink.style.display = 'flex';
                    drawerLogoutLink.onclick = async (e) => {
                        e.preventDefault();
                        const { error } = await supabase.auth.signOut();
                        if (!error) {
                            showNotification("تم تسجيل الخروج بنجاح", "success");
                            window.location.href = resolvePath('INDEX');
                        } else {
                            showNotification("حدث خطأ أثناء تسجيل الخروج", "error");
                        }
                    };
                }
            } else {
                userBtn.href = resolvePath('LOGIN');
                if (drawerUserInfo) drawerUserInfo.style.display = 'none';
                if (drawerDashboardLink) drawerDashboardLink.style.display = 'none';
                if (drawerSettingsLink) drawerSettingsLink.style.display = 'none';
                if (drawerLoginLink) drawerLoginLink.style.display = 'flex';
                if (drawerLogoutLink) drawerLogoutLink.style.display = 'none';
            }
        }
    });
}

// ============================================
// عداد السلة
// ============================================
function setupCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;

    const updateBadge = () => {
        const cart = JSON.parse(localStorage.getItem('bf-cart') || '[]');
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    };

    updateBadge();
    window.addEventListener('bf-cart-updated', updateBadge);
}

// ============================================
// تمييز الصفحة النشطة
// ============================================
function highlightActivePage() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    const pageMap = [
        { key: 'salons.html', page: 'salons' },
        { key: 'shop.html', page: 'shop' },
        { key: 'product.html', page: 'shop' },
        { key: 'pro.html', page: 'pro' },
        { key: 'about.html', page: 'about' },
        { key: 'contact.html', page: 'contact' }
    ];

    let activePage = 'home';
    for (const item of pageMap) {
        if (path.includes(item.key)) {
            activePage = item.page;
            break;
        }
    }

    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === activePage);
    });
}

