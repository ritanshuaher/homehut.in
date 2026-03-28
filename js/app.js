/* ============================================
   HOMEHUT — CORE APPLICATION LOGIC
   Smart. Modern. Efficient.
   ============================================ */

(function () {
  'use strict';

  /* ---- STATE MANAGEMENT ---- */
  const state = {
    cart: JSON.parse(localStorage.getItem('homehut_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('homehut_wishlist') || '[]'),
    recentlyViewed: JSON.parse(localStorage.getItem('homehut_recently_viewed') || '[]'),
    theme: localStorage.getItem('homehut_theme') || 'light',
  };

  function saveState() {
    localStorage.setItem('homehut_cart', JSON.stringify(state.cart));
    localStorage.setItem('homehut_wishlist', JSON.stringify(state.wishlist));
    localStorage.setItem('homehut_recently_viewed', JSON.stringify(state.recentlyViewed));
    localStorage.setItem('homehut_theme', state.theme);
  }

  /* ---- THEME MANAGEMENT ---- */
  function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        saveState();
      });
    }
  }

  /* ---- DARK MODE TOOLTIP (First Visit) ---- */
  function initDarkModeTooltip() {
    if (localStorage.getItem('homehut_visited')) return;
    setTimeout(() => {
      const tooltip = document.createElement('div');
      tooltip.className = 'darkmode-tooltip';
      tooltip.innerHTML = '<span class="darkmode-tooltip__icon">🌙</span><span class="darkmode-tooltip__text">Psst! Try Dark Mode 👀 Toggle it in the top right corner ✨</span><button class="darkmode-tooltip__close" aria-label="Dismiss">✕</button>';
      document.body.appendChild(tooltip);
      requestAnimationFrame(() => { tooltip.classList.add('show'); });
      const closeBtn = tooltip.querySelector('.darkmode-tooltip__close');
      const dismiss = () => { tooltip.classList.remove('show'); setTimeout(() => tooltip.remove(), 400); localStorage.setItem('homehut_visited', 'true'); };
      closeBtn.addEventListener('click', dismiss);
      tooltip.addEventListener('click', dismiss);
      setTimeout(dismiss, 6000);
    }, 3000);
  }

  /* ---- NAVBAR SCROLL EFFECT ---- */
  function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) { navbar.classList.add('scrolled'); } else { navbar.classList.remove('scrolled'); }
    }, { passive: true });
  }

  /* ---- MOBILE MENU ---- */
  function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-overlay');
    const close = document.getElementById('mobile-menu-close');
    if (!toggle || !menu) return;
    function openMenu() { menu.classList.add('open'); overlay?.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
    function closeMenu() { menu.classList.remove('open'); overlay?.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
    toggle.addEventListener('click', openMenu);
    close?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); } });
  }

  /* ---- CART MANAGEMENT ---- */
  window.HomeHutCart = {
    add(productId, quantity = 1, variant = null) {
      const product = HOMEHUT.products.find(p => p.id === productId);
      if (!product) return;
      const existingIndex = state.cart.findIndex(item => item.productId === productId && item.variant === variant);
      if (existingIndex > -1) { state.cart[existingIndex].quantity += quantity; } else {
        state.cart.push({ productId, title: product.title, price: product.price, compareAtPrice: product.compareAtPrice, image: product.images[0], quantity, variant });
      }
      saveState(); updateCartBadge(); showToast(product.title + ' added to cart!', 'success');
    },
    remove(index) { state.cart.splice(index, 1); saveState(); updateCartBadge(); },
    updateQuantity(index, quantity) { if (quantity <= 0) { this.remove(index); return; } state.cart[index].quantity = quantity; saveState(); updateCartBadge(); },
    getTotal() { return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0); },
    getCount() { return state.cart.reduce((sum, item) => sum + item.quantity, 0); },
    getItems() { return state.cart; },
    clear() { state.cart = []; saveState(); updateCartBadge(); }
  };

  /* ---- WISHLIST MANAGEMENT ---- */
  window.HomeHutWishlist = {
    toggle(productId) {
      const index = state.wishlist.indexOf(productId);
      if (index > -1) { state.wishlist.splice(index, 1); showToast('Removed from wishlist', 'info'); } else {
        state.wishlist.push(productId);
        const product = HOMEHUT.products.find(p => p.id === productId);
        showToast((product?.title || 'Product') + ' added to wishlist!', 'success');
      }
      saveState(); updateWishlistBadge();
      document.querySelectorAll('[data-wishlist="' + productId + '"]').forEach(btn => { btn.classList.toggle('active', state.wishlist.includes(productId)); });
    },
    has(productId) { return state.wishlist.includes(productId); },
    getItems() { return state.wishlist; },
    remove(productId) { const index = state.wishlist.indexOf(productId); if (index > -1) { state.wishlist.splice(index, 1); saveState(); updateWishlistBadge(); } }
  };

  /* ---- RECENTLY VIEWED ---- */
  window.HomeHutRecent = {
    add(productId) { state.recentlyViewed = state.recentlyViewed.filter(id => id !== productId); state.recentlyViewed.unshift(productId); if (state.recentlyViewed.length > 10) state.recentlyViewed.pop(); saveState(); },
    get() { return state.recentlyViewed; }
  };

  /* ---- BADGE UPDATES ---- */
  function updateCartBadge() {
    const count = HomeHutCart.getCount();
    document.querySelectorAll('#cart-count').forEach(badge => { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; });
  }
  function updateWishlistBadge() {
    const count = state.wishlist.length;
    document.querySelectorAll('#wishlist-count').forEach(badge => { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; });
  }

  /* ---- TOAST NOTIFICATIONS ---- */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>', info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' };
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<span class="toast__icon">' + (icons[type] || icons.info) + '</span><span class="toast__message">' + message + '</span><button class="toast__close" aria-label="Dismiss"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
    container.appendChild(toast);
    toast.querySelector('.toast__close').addEventListener('click', () => { toast.style.animation = 'fadeIn 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); });
    setTimeout(() => { if (toast.parentNode) { toast.style.animation = 'fadeIn 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); } }, 4000);
  }
  window.showToast = showToast;

  /* ---- SCROLL ANIMATIONS ---- */
  function initScrollAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('animate-in'); observer.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => { observer.observe(el); });
  }

  /* ---- SCROLL TO TOP ---- */
  function initScrollTop() {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;
    window.addEventListener('scroll', () => { if (window.scrollY > 400) { btn.classList.add('visible'); } else { btn.classList.remove('visible'); } }, { passive: true });
    btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---- SOCIAL PROOF ---- */
  function initSocialProof() {
    const popup = document.getElementById('social-proof');
    const textEl = document.getElementById('social-proof-text');
    const timeEl = document.getElementById('social-proof-time');
    const imgEl = document.getElementById('social-proof-img');
    const closeBtn = document.getElementById('social-proof-close');
    if (!popup || !HOMEHUT.socialProofNames) return;
    let dismissed = false;
    let lastNameIndex = -1, lastCityIndex = -1;
    closeBtn?.addEventListener('click', () => { popup.classList.remove('show'); dismissed = true; });
    function getRandomWithExclusion(arr, excludeIndex) { let index; do { index = Math.floor(Math.random() * arr.length); } while (index === excludeIndex && arr.length > 1); return index; }
    function showNext() {
      if (dismissed) return;
      const nameIndex = getRandomWithExclusion(HOMEHUT.socialProofNames, lastNameIndex);
      const cityIndex = getRandomWithExclusion(HOMEHUT.socialProofCities, lastCityIndex);
      lastNameIndex = nameIndex; lastCityIndex = cityIndex;
      const name = HOMEHUT.socialProofNames[nameIndex];
      const city = HOMEHUT.socialProofCities[cityIndex];
      const product = HOMEHUT.products[Math.floor(Math.random() * HOMEHUT.products.length)];
      const minutesAgo = Math.floor(Math.random() * 50) + 2;
      textEl.innerHTML = '🛍️ <strong>' + name + '</strong> from ' + city + ' just bought <strong>' + product.title + '</strong>';
      timeEl.textContent = minutesAgo + ' mins ago';
      if (product && imgEl) { imgEl.src = product.images[0]; imgEl.alt = product.title; }
      popup.classList.add('show');
      setTimeout(() => { popup.classList.remove('show'); setTimeout(showNext, 25000 + Math.random() * 15000); }, 5000);
    }
    setTimeout(showNext, 8000);
  }

  /* ---- PRODUCT CARD RENDERER ---- */
  window.renderProductCard = function(product) {
    const savings = product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
    const starsHTML = renderStars(product.rating);
    const isWishlisted = HomeHutWishlist.has(product.id);
    let badgesHTML = '';
    if (!product.inStock) badgesHTML += '<span class="product-card__badge badge-oos">Out of Stock</span>';
    if (product.isSale && savings > 0) badgesHTML += '<span class="product-card__badge badge-sale">' + savings + '% Off</span>';
    if (product.isNew) badgesHTML += '<span class="product-card__badge badge-new">New</span>';
    if (product.isBestseller) badgesHTML += '<span class="product-card__badge badge-bestseller">Bestseller</span>';
    const lowStock = product.inventory <= 5 && product.inventory > 0;
    const outOfStock = !product.inStock || product.inventory === 0;
    const catName = HOMEHUT.categories.find(c => c.id === product.category)?.name || product.category;
    return '<article class="product-card reveal" data-product-id="' + product.id + '">' +
      '<div class="product-card__image-wrapper">' +
      '<a href="pages/product.html?id=' + product.id + '"><img class="product-card__image" src="' + product.images[0] + '" alt="' + product.title + '" width="400" height="400" loading="lazy"></a>' +
      (badgesHTML ? '<div class="product-card__badges">' + badgesHTML + '</div>' : '') +
      '<button class="product-card__wishlist ' + (isWishlisted ? 'active' : '') + '" data-wishlist="' + product.id + '" aria-label="' + (isWishlisted ? 'Remove from' : 'Add to') + ' wishlist" onclick="HomeHutWishlist.toggle(\'' + product.id + '\')"><svg viewBox="0 0 24 24" fill="' + (isWishlisted ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>' +
      '<div class="product-card__quick-actions"><button class="btn btn-primary btn-sm" onclick="HomeHutCart.add(\'' + product.id + '\')" ' + (outOfStock ? 'disabled' : '') + '>' + (outOfStock ? 'Out of Stock' : 'Quick Add') + '</button></div>' +
      '</div><div class="product-card__info">' +
      '<p class="product-card__category">' + catName + '</p>' +
      '<h3 class="product-card__title"><a href="pages/product.html?id=' + product.id + '">' + product.title + '</a></h3>' +
      '<div class="product-card__rating"><div class="stars">' + starsHTML + '</div><span class="product-card__rating-count">(' + product.reviewCount + ')</span></div>' +
      '<div class="product-card__price-row"><span class="product-card__price">₹' + product.price.toLocaleString('en-IN') + '</span>' +
      (product.compareAtPrice ? '<span class="product-card__price-original">₹' + product.compareAtPrice.toLocaleString('en-IN') + '</span>' : '') +
      (savings > 0 ? '<span class="product-card__savings">Save ' + savings + '%</span>' : '') +
      '</div>' + (lowStock ? '<p style="font-size:12px;color:var(--error);font-weight:600;margin-bottom:8px;">⚡ Only ' + product.inventory + ' left!</p>' : '') +
      '<button class="product-card__add-to-cart" onclick="HomeHutCart.add(\'' + product.id + '\')" ' + (outOfStock ? 'disabled' : '') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' + (outOfStock ? 'Out of Stock' : 'Add to Cart') + '</button>' +
      '</div></article>';
  };

  /* ---- STAR RATING ---- */
  function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) { html += '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'; }
      else { html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'; }
    }
    return html;
  }
  window.renderStars = renderStars;

  /* ---- GIVEAWAY MODAL ---- */
  function initGiveawayModal() {
    const notifyBtn = document.getElementById('giveaway-notify-btn');
    if (!notifyBtn) return;
    notifyBtn.addEventListener('click', () => {
      const overlay = document.createElement('div'); overlay.className = 'modal-overlay active';
      const modal = document.createElement('div'); modal.className = 'modal active';
      modal.innerHTML = '<button class="modal__close" aria-label="Close">&times;</button><div style="text-align:center"><div style="font-size:3rem;margin-bottom:var(--space-4)">🎁</div><h3 class="headline-sm" style="margin-bottom:var(--space-3)">Get Notified!</h3><p class="body-sm" style="color:var(--on-surface-variant);margin-bottom:var(--space-6)">Enter your email and we\'ll notify you as soon as the giveaway goes live.</p><form id="giveaway-form" style="display:flex;flex-direction:column;gap:var(--space-3)"><input type="email" class="form-input" placeholder="Your email address" required style="text-align:center"><button type="submit" class="btn btn-primary btn-full">Notify Me 🔔</button></form></div>';
      document.body.appendChild(overlay); document.body.appendChild(modal);
      const closeModal = () => { overlay.remove(); modal.remove(); };
      overlay.addEventListener('click', closeModal);
      modal.querySelector('.modal__close').addEventListener('click', closeModal);
      modal.querySelector('#giveaway-form').addEventListener('submit', (e) => { e.preventDefault(); closeModal(); showToast("You're on the list! 🎉 We'll notify you as soon as the giveaway goes live.", 'success'); });
    });
  }

  /* ---- WHATSAPP BUTTON ---- */
  function initWhatsAppButton() {
    if (document.querySelector('.whatsapp-float')) return;
    const btn = document.createElement('a');
    btn.href = 'https://wa.me/918983347437?text=Hi%20HomeHut!%20I%20have%20a%20question%20about%20my%20order.';
    btn.target = '_blank'; btn.rel = 'noopener noreferrer'; btn.className = 'whatsapp-float'; btn.setAttribute('aria-label', 'Chat on WhatsApp');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
    document.body.appendChild(btn);
  }

  /* ---- DELIVERY DATE ---- */
  window.getEstimatedDelivery = function() {
    const today = new Date(); const deliveryDate = new Date(today); let daysAdded = 0;
    while (daysAdded < 6) { deliveryDate.setDate(deliveryDate.getDate() + 1); if (deliveryDate.getDay() !== 0) { daysAdded++; } }
    return deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  /* ---- SEARCH ---- */
  function initSearch() {
    const input = document.getElementById('navbar-search');
    const dropdown = document.getElementById('search-dropdown');
    if (!input || !dropdown) return;
    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = input.value.trim().toLowerCase();
        if (query.length < 2) { dropdown.hidden = true; return; }
        const results = HOMEHUT.products.filter(p => p.title.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)).slice(0, 5);
        if (results.length > 0) { dropdown.innerHTML = results.map(p => '<a href="pages/product.html?id=' + p.id + '" class="search-result"><img src="' + p.images[0] + '" alt="' + p.title + '" width="40" height="40"><div><p class="search-result__title">' + p.title + '</p><p class="search-result__price">₹' + p.price.toLocaleString('en-IN') + '</p></div></a>').join('') + '<a href="pages/shop.html" class="search-result search-result--all">View all results →</a>'; dropdown.hidden = false; }
        else { dropdown.innerHTML = '<p class="search-result__empty">No products found</p>'; dropdown.hidden = false; }
      }, 300);
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.navbar__search')) { dropdown.hidden = true; } });
  }

  /* ---- ANNOUNCEMENT BAR ---- */
  function initAnnouncementBar() {
    const bar = document.querySelector('.announcement-bar');
    if (!bar) return;
    bar.addEventListener('mouseenter', () => { const track = bar.querySelector('.announcement-bar__track'); if (track) track.style.animationPlayState = 'paused'; });
    bar.addEventListener('mouseleave', () => { const track = bar.querySelector('.announcement-bar__track'); if (track) track.style.animationPlayState = 'running'; });
  }

  /* ---- SPLASH SCREEN ---- */
  function initSplashScreen() {
    if (localStorage.getItem('homehut_splash_shown')) return;
    const splash = document.createElement('div');
    splash.className = 'splash-screen';
    const depth = window.location.pathname.includes('/pages/') ? '../' : '';
    splash.innerHTML = '<div class="splash-screen__content"><img src="' + depth + 'images/logo.svg" alt="HomeHut" class="splash-screen__logo-img" width="200" height="56"><div class="splash-screen__tagline">Smart. Modern. Efficient.</div></div>';
    document.body.appendChild(splash);
    document.body.style.overflow = 'hidden';
    setTimeout(() => { splash.classList.add('fade-out'); setTimeout(() => { splash.remove(); document.body.style.overflow = ''; }, 500); localStorage.setItem('homehut_splash_shown', 'true'); }, 1200);
  }

  /* ---- INITIALIZATION ---- */
  function init() {
    initSplashScreen(); initTheme(); initNavbarScroll(); initMobileMenu();
    initScrollAnimations(); initScrollTop(); initSocialProof(); initSearch();
    initAnnouncementBar(); initGiveawayModal(); initWhatsAppButton(); initDarkModeTooltip();
    updateCartBadge(); updateWishlistBadge();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();