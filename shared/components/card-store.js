/**
 * BarberFlow Pro - مكون بطاقة المتجر
 * المسار: shared/components/card-store.js
 * الدور: إنشاء وعرض بطاقات المتاجر بشكل مختصر (بدون معلومات تواصل مباشرة)
 * ⚠️ ملاحظة: لا نعرض الهاتف/الإيميل لمنع تجاوز المنصة
 */
import { supabase } from "../../config/supabase-init.js";
import { PATHS, resolvePath } from "../utils/paths.js";

/**
 * HTML Template لبطاقة المتجر
 */
const STORE_CARD_TEMPLATE = `
<article class="store-card-v2">
  <div class="store-card-v2__header">
    <div class="store-card-v2__logo-wrapper">
      <div class="store-card-v2__logo-placeholder">
        <i class="fas fa-store"></i>
      </div>
      <img class="store-card-v2__logo" alt="شعار المتجر" style="display:none;" />
    </div>
    <div class="store-card-v2__badges">
      <span class="store-card-v2__verified" style="display:none;">
        <i class="fas fa-check-circle"></i>
        <span>موثق</span>
      </span>
    </div>
  </div>
  <div class="store-card-v2__content">
    <h3 class="store-card-v2__name">اسم المتجر</h3>
    <div class="store-card-v2__location">
      <i class="fas fa-map-marker-alt"></i>
      <span>المدينة</span>
    </div>
    <div class="store-card-v2__rating">
      <div class="store-card-v2__stars">
        <i class="fas fa-star"></i>
        <i class="fas fa-star"></i>
        <i class="fas fa-star"></i>
        <i class="fas fa-star"></i>
        <i class="far fa-star"></i>
      </div>
      <span class="store-card-v2__rating-value">4.0</span>
      <span class="store-card-v2__rating-count">(0)</span>
    </div>
    <div class="store-card-v2__stats">
      <div class="store-card-v2__stat">
        <i class="fas fa-box"></i>
        <span class="store-card-v2__stat-value">0</span>
        <span class="store-card-v2__stat-label">منتج</span>
      </div>
    </div>
    <a class="store-card-v2__cta" href="#">
      <span>عرض المتجر</span>
      <i class="fas fa-arrow-left"></i>
    </a>
  </div>
</article>
`;

/**
 * التحقق من حالة المفضلة للمتجر
 */
async function checkStoreFavorite(storeId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('item_id', storeId)
      .eq('item_type', 'store')
      .single();

    return !error && data;
  } catch (error) {
    console.error("Error checking store favorite:", error);
    return false;
  }
}

/**
 * تبديل حالة المفضلة للمتجر
 */
async function toggleStoreFavorite(storeId, isLiked) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    if (isLiked) {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: session.user.id,
          item_id: storeId,
          item_type: 'store'
        });
      return !error;
    } else {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('item_id', storeId)
        .eq('item_type', 'store');
      return !error;
    }
  } catch (error) {
    console.error("Error toggling store favorite:", error);
    return false;
  }
}

/**
 * إنشاء بطاقة متجر
 * @param {Object} store - بيانات المتجر من جدول businesses (حيث type='store')
 * @param {string} id - معرف المتجر
 * @returns {HTMLElement|null}
 */
export async function createStoreCard(store, id) {
  const storeId = id || store?.id;
  if (!storeId) {
    console.error('[StoreCard] ❌ المعرف (id) غير مُعرّف!');
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(STORE_CARD_TEMPLATE, 'text/html');
  const card = doc.querySelector('.store-card-v2');

  try {
    // ===== شعار المتجر =====
    const logo = card.querySelector('.store-card-v2__logo');
    const placeholder = card.querySelector('.store-card-v2__logo-placeholder');
    if (logo && placeholder) {
      if (store.logo_url) {
        logo.src = store.logo_url;
        logo.style.display = 'block';
        placeholder.style.display = 'none';
        logo.onerror = () => {
          logo.style.display = 'none';
          placeholder.style.display = 'flex';
          logo.onerror = null;
        };
      } else {
        logo.style.display = 'none';
        placeholder.style.display = 'flex';
      }
    }

    // ===== اسم المتجر =====
    const nameElement = card.querySelector('.store-card-v2__name');
    if (nameElement) {
      nameElement.textContent = store.name || "متجر غير مسمى";
    }

    // ===== المدينة =====
    const locationElement = card.querySelector('.store-card-v2__location span');
    if (locationElement) {
      locationElement.textContent = store.city || "الموقع غير محدد";
    }

    // ===== التقييم =====
    const ratingElement = card.querySelector('.store-card-v2__rating-value');
    const ratingCount = card.querySelector('.store-card-v2__rating-count');
    const starsContainer = card.querySelector('.store-card-v2__stars');
    if (ratingElement) {
      const rating = parseFloat(store.rating) || 4.0;
      ratingElement.textContent = rating.toFixed(1);
      if (starsContainer) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        const stars = starsContainer.querySelectorAll('i');
        stars.forEach((star, index) => {
          star.className = 'fas fa-star';
          if (index >= fullStars) {
            if (index === fullStars && hasHalf) {
              star.className = 'fas fa-star-half-alt';
            } else {
              star.className = 'far fa-star';
            }
          }
        });
      }
    }
    if (ratingCount) {
      const count = store.reviews_count || 0;
      ratingCount.textContent = `(${count})`;
    }

    // ===== عدد المنتجات (جلب من جدول products) =====
    const statValue = card.querySelector('.store-card-v2__stat-value');
    if (statValue) {
      const { data: products, error } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', storeId)
        .eq('is_available', true);
      const count = products?.length || 0;
      statValue.textContent = count;
    }

    // ===== Badge موثق =====
    const verifiedBadge = card.querySelector('.store-card-v2__verified');
    if (verifiedBadge && store.is_verified) {
      verifiedBadge.style.display = 'flex';
    }

    // ===== رابط عرض المتجر =====
    const ctaBtn = card.querySelector('.store-card-v2__cta');
    if (ctaBtn) {
      ctaBtn.href = `${resolvePath('DETAILS_STORE')}?id=${storeId}`;
      ctaBtn.onclick = (e) => {
        e.stopPropagation();
      };
    }

    // ===== تأثيرات التفاعل =====
    addInteractionEffects(card);
    return card;
  } catch (error) {
    console.error("[StoreCard] Critical Processing Error:", error);
    return null;
  }
}

/**
 * إضافة تأثيرات التفاعل
 */
function addInteractionEffects(card) {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  requestAnimationFrame(() => {
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  });

  if (window.matchMedia('(hover: hover)').matches) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  }
}

/**
 * إنشاء عدة بطاقات متاجر
 */
export async function createStoreCards(stores) {
  const cards = [];
  for (const store of stores) {
    const card = await createStoreCard(store, store.id);
    if (card) cards.push(card);
  }
  return cards;
}

