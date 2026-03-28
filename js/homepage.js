/* ============================================
   HOMEHUT — HOMEPAGE SCRIPTS
   Smart. Modern. Efficient.
   ============================================ */

(function () {
  'use strict';

  /* ---- RENDER CATEGORIES ---- */
  function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid || !HOMEHUT.categories) return;
    grid.innerHTML = HOMEHUT.categories.map((cat, index) =>
      '<a href="pages/shop.html?category=' + cat.slug + '" class="category-card-new reveal stagger-' + (index + 1) + '" id="category-' + cat.slug + '" style="background-image: url(\'' + cat.image + '\');">' +
      '<div class="category-card-new__overlay">' +
      '<div class="category-card-new__icon">' + cat.icon + '</div>' +
      '<h3 class="category-card-new__name">' + cat.name + '</h3>' +
      '<p class="category-card-new__desc">' + cat.description + '</p>' +
      '<span class="category-card-new__arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>' +
      '</div></a>'
    ).join('');
    initRevealElements(grid);
  }

  /* ---- RENDER BESTSELLERS ---- */
  function renderBestsellers() {
    const grid = document.getElementById('bestsellers-grid');
    if (!grid || !HOMEHUT.products) return;
    const bestsellers = HOMEHUT.products.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4);
    grid.innerHTML = bestsellers.map(product => renderProductCard(product)).join('');
    initRevealElements(grid);
  }

  /* ---- RENDER TESTIMONIALS ---- */
  function renderTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    if (!grid || !HOMEHUT.testimonials) return;
    grid.innerHTML = HOMEHUT.testimonials.slice(0, 6).map((review, index) => {
      const starsHTML = renderStars(review.rating);
      return '<article class="testimonial-card reveal stagger-' + ((index % 3) + 1) + '" id="testimonial-' + review.id + '">' +
        '<div class="testimonial-card__header"><div class="testimonial-card__rating">' + starsHTML + '<span class="testimonial-card__rating-num">' + review.rating + '</span></div><span class="testimonial-card__badge">' + review.badge + '</span></div>' +
        '<p class="testimonial-card__text">"' + review.text + '"</p>' +
        '<div class="testimonial-card__footer"><div class="testimonial-card__avatar-placeholder">' + review.name.charAt(0) + '</div>' +
        '<div><p class="testimonial-card__name">' + review.name + '</p><p class="testimonial-card__location">' + review.location + ' · ' + review.product + '</p><p class="testimonial-card__date">' + review.date + '</p></div></div>' +
        '</article>';
    }).join('');
    initRevealElements(grid);
  }

  /* ---- RENDER TRUST BADGES ---- */
  function renderTrustBadges() {
    const container = document.getElementById('hero-trust-badges');
    if (!container) return;
    const badges = [{ icon: '🚚', text: '5–6 Day Delivery' },{ icon: '🔒', text: 'Secure Payments' },{ icon: '⭐', text: '4.8/5 Rating' },{ icon: '📞', text: '24hr Support' }];
    container.innerHTML = badges.map(b => '<div class="hero-trust-badge reveal"><span class="hero-trust-badge__icon">' + b.icon + '</span><span class="hero-trust-badge__text">' + b.text + '</span></div>').join('');
    initRevealElements(container);
  }

  /* ---- RENDER RECENTLY VIEWED ---- */
  function renderRecentlyViewed() {
    const container = document.getElementById('recently-viewed-grid');
    if (!container) return;
    const recentIds = HomeHutRecent.get().slice(0, 4);
    if (recentIds.length === 0) { document.getElementById('recently-viewed-section')?.remove(); return; }
    const products = recentIds.map(id => HOMEHUT.products.find(p => p.id === id)).filter(Boolean);
    if (products.length === 0) { document.getElementById('recently-viewed-section')?.remove(); return; }
    container.innerHTML = products.map(product => renderProductCard(product)).join('');
    initRevealElements(container);
  }

  /* ---- RE-OBSERVE SCROLL ANIMATIONS ---- */
  function initRevealElements(container) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('animate-in'); observer.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    container.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => { observer.observe(el); });
  }

  /* ---- HERO 3D SHOPPING BAG ---- */
  function initHeroOrb() {
    const container = document.getElementById('hero-3d-orb');
    if (!container) return;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { renderCSSBag(container); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => initThreeJSBag(container);
    script.onerror = () => renderCSSBag(container);
    document.head.appendChild(script);
  }

  function initThreeJSBag(container) {
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    const bagGroup = new THREE.Group();
    scene.add(bagGroup);
    const bodyGeo = new THREE.BoxGeometry(2.0, 2.4, 1.2, 4, 4, 4);
    const posArr = bodyGeo.attributes.position.array;
    for (let i = 0; i < posArr.length; i += 3) { const y = posArr[i + 1]; if (y > 0.8) { posArr[i] *= 0.88 + (y - 0.8) * 0.05; posArr[i + 2] *= 0.88 + (y - 0.8) * 0.05; } }
    bodyGeo.attributes.position.needsUpdate = true;
    bodyGeo.computeVertexNormals();
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x3A6B4A, metalness: 0.05, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.15, emissive: 0x1a3d28, emissiveIntensity: 0.1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat); body.position.y = -0.2; body.castShadow = true; bagGroup.add(body);
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.15, 1.25), new THREE.MeshPhysicalMaterial({ color: 0x215334, metalness: 0.1, roughness: 0.3 })); base.position.y = -1.45; bagGroup.add(base);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.12, 1.21), new THREE.MeshPhysicalMaterial({ color: 0x2d5c3e, metalness: 0.15, roughness: 0.2, clearcoat: 1.0 })); rim.position.y = 1.02; bagGroup.add(rim);
    const handleCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.5, 1.0, 0), new THREE.Vector3(-0.6, 1.8, 0), new THREE.Vector3(0, 2.2, 0), new THREE.Vector3(0.6, 1.8, 0), new THREE.Vector3(0.5, 1.0, 0)]);
    const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 20, 0.07, 12, false), new THREE.MeshPhysicalMaterial({ color: 0x8FAF85, metalness: 0.3, roughness: 0.15, clearcoat: 1.0 })); handle.castShadow = true; bagGroup.add(handle);
    const logoCanvas = document.createElement('canvas'); logoCanvas.width = 256; logoCanvas.height = 256;
    const lctx = logoCanvas.getContext('2d'); lctx.fillStyle = 'rgba(255,255,255,0.18)'; lctx.font = 'bold 80px sans-serif'; lctx.textAlign = 'center'; lctx.textBaseline = 'middle'; lctx.fillText('H', 128, 128);
    const logoTex = new THREE.CanvasTexture(logoCanvas);
    const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true })); logoPlane.position.set(0, -0.2, 0.62); bagGroup.add(logoPlane);
    const sparkleCount = 28; const sparkleGeo = new THREE.BufferGeometry(); const positions = new Float32Array(sparkleCount * 3); const speeds = [];
    for (let i = 0; i < sparkleCount; i++) { positions[i*3]=(Math.random()-0.5)*5; positions[i*3+1]=(Math.random()-0.5)*5; positions[i*3+2]=(Math.random()-0.5)*3; speeds.push({vx:(Math.random()-0.5)*0.005,vy:Math.random()*0.008+0.002}); }
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sparkleMat = new THREE.PointsMaterial({ color: 0x8FAF85, size: 0.05, transparent: true, opacity: 0.6 }); const sparkles = new THREE.Points(sparkleGeo, sparkleMat); scene.add(sparkles);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2); keyLight.position.set(3, 5, 4); scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x8FAF85, 1.5, 15); fillLight.position.set(-3, 2, 3); scene.add(fillLight);
    let targetRotX = 0, targetRotY = 0;
    container.addEventListener('mousemove', (e) => { const rect = container.getBoundingClientRect(); const mouseX = ((e.clientX - rect.left) / width - 0.5) * 2; const mouseY = ((e.clientY - rect.top) / height - 0.5) * 2; targetRotY = mouseX * 0.6; targetRotX = -mouseY * 0.3; });
    container.addEventListener('mouseleave', () => { targetRotX = 0; targetRotY = 0; });
    let time = 0;
    function animate() {
      requestAnimationFrame(animate); time += 0.012;
      bagGroup.position.y = Math.sin(time * 1.2) * 0.12;
      bagGroup.rotation.y += (targetRotY + time * 0.25 - bagGroup.rotation.y) * 0.04;
      bagGroup.rotation.x += (targetRotX - bagGroup.rotation.x) * 0.04;
      const posAttr = sparkleGeo.attributes.position;
      for (let i = 0; i < sparkleCount; i++) { posAttr.array[i*3]+=speeds[i].vx; posAttr.array[i*3+1]+=speeds[i].vy; if (posAttr.array[i*3+1]>3) posAttr.array[i*3+1]=-3; if (Math.abs(posAttr.array[i*3])>3) speeds[i].vx*=-1; }
      posAttr.needsUpdate = true; sparkleMat.opacity = 0.4 + Math.sin(time * 2) * 0.15;
      renderer.render(scene, camera);
    }
    animate();
    window.addEventListener('resize', () => { const w = container.clientWidth; const h = container.clientHeight; camera.aspect = w/h; camera.updateProjectionMatrix(); renderer.setSize(w, h); });
  }

  function renderCSSBag(container) {
    container.innerHTML = '<div class="css-bag"><div class="css-bag__scene"><div class="css-bag__body"><div class="css-bag__face css-bag__face--front"><div class="css-bag__logo-emboss">H</div></div><div class="css-bag__face css-bag__face--back"></div><div class="css-bag__face css-bag__face--left"></div><div class="css-bag__face css-bag__face--right"></div><div class="css-bag__face css-bag__face--top"></div><div class="css-bag__face css-bag__face--bottom"></div></div><div class="css-bag__handle css-bag__handle--left"></div><div class="css-bag__handle css-bag__handle--right"></div></div><div class="css-bag__glow"></div><div class="css-bag__shadow"></div><div class="css-bag__sparkle css-bag__sparkle--1"></div><div class="css-bag__sparkle css-bag__sparkle--2"></div><div class="css-bag__sparkle css-bag__sparkle--3"></div><div class="css-bag__sparkle css-bag__sparkle--4"></div><div class="css-bag__sparkle css-bag__sparkle--5"></div></div>';
  }

  /* ---- HERO ANIMATION ---- */
  function initHeroAnimation() {
    const title = document.getElementById('hero-heading');
    if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    title.querySelectorAll('.hero__word').forEach((word, i) => { word.style.animationDelay = (i * 0.15) + 's'; word.classList.add('hero__word--animate'); });
  }

  /* ---- HERO PARTICLES ---- */
  function initHeroParticles() {
    const canvas = document.getElementById('hero-particles');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; }
    resize(); window.addEventListener('resize', resize);
    class Particle { constructor() { this.reset(); } reset() { this.x = Math.random() * canvas.width; this.y = canvas.height + Math.random() * 20; this.size = Math.random() * 2.5 + 0.5; this.speedY = -(Math.random() * 0.5 + 0.1); this.speedX = (Math.random() - 0.5) * 0.3; this.opacity = Math.random() * 0.5 + 0.1; } update() { this.y += this.speedY; this.x += this.speedX; this.opacity -= 0.0005; if (this.y < -10 || this.opacity <= 0) this.reset(); } draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fillStyle = 'rgba(143, 175, 133, ' + this.opacity + ')'; ctx.fill(); } }
    const particles = []; for (let i = 0; i < 40; i++) { particles.push(new Particle()); }
    function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animate); }
    animate();
  }

  /* ---- INITIALIZATION ---- */
  function init() {
    renderCategories(); renderBestsellers(); renderTestimonials(); renderTrustBadges();
    renderRecentlyViewed(); initHeroOrb(); initHeroAnimation(); initHeroParticles();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();