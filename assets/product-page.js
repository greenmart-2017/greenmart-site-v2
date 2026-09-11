/* Mobile hamburger — same aria-expanded behaviour as homepage */
(function(){
  const burger = document.getElementById("hamburger");
  const mMenu = document.getElementById("mobileMenu");
  if(!burger || !mMenu) return;
  function setOpen(open){
    mMenu.classList.toggle("show", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  burger.addEventListener("click", () => {
    setOpen(!mMenu.classList.contains("show"));
  });
  mMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
})();
/* Scroll-reveal animations (shared with homepage) */
(function(){
  const els = document.querySelectorAll(".reveal, .reveal-stagger");
  if(!els.length) return;
  if(!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    els.forEach(e => e.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(en.isIntersecting){
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, {threshold:.12, rootMargin:"0px 0px -60px 0px"});
  els.forEach(e => io.observe(e));
})();
/* Image slider — auto-slide with arrows/dots, full uncropped images */
document.querySelectorAll(".img-slider").forEach(slider => {
  const track = slider.querySelector(".img-slider-track");
  const slides = Array.from(slider.querySelectorAll(".img-slider-slide"));
  const dots = Array.from(slider.querySelectorAll(".img-slider-dot"));
  const prevBtn = slider.querySelector(".img-slider-arrow.prev");
  const nextBtn = slider.querySelector(".img-slider-arrow.next");
  if(slides.length < 2){
    if(prevBtn) prevBtn.style.display = "none";
    if(nextBtn) nextBtn.style.display = "none";
    const dw = slider.querySelector(".img-slider-dots");
    if(dw) dw.style.display = "none";
    return;
  }
  let idx = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function go(i){
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle("active", di === idx));
  }
  if(prevBtn) prevBtn.addEventListener("click", () => { go(idx - 1); restart(); });
  if(nextBtn) nextBtn.addEventListener("click", () => { go(idx + 1); restart(); });
  dots.forEach((d, di) => d.addEventListener("click", () => { go(di); restart(); }));
  let timer = null;
  function restart(){
    if(reduced) return;
    clearInterval(timer);
    const delay = parseInt(slider.dataset.autoplay, 10) || 4500;
    timer = setInterval(() => go(idx + 1), delay);
  }
  slider.addEventListener("mouseenter", () => clearInterval(timer));
  slider.addEventListener("mouseleave", restart);
  slider.addEventListener("focusin", () => clearInterval(timer));
  slider.addEventListener("focusout", restart);
  go(0);
  restart();
});
document.querySelectorAll(".ftab").forEach(tab => {
  tab.addEventListener("click", () => {
    const idx = tab.dataset.idx;
    document.querySelectorAll(".ftab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".fdesc").forEach(d => d.classList.remove("show"));
    tab.classList.add("active");
    document.querySelector(`.fdesc[data-idx="${idx}"]`).classList.add("show");
  });
});

/* ── Sticky nav shrink-on-scroll ── */
(function(){
  try {
    const nav = document.querySelector("nav");
    if(!nav) return;
    let ticking = false;
    function update(){
      nav.classList.toggle("nav-compact", window.scrollY > 60);
      ticking = false;
    }
    window.addEventListener("scroll", () => {
      if(!ticking){
        ticking = true;
        requestAnimationFrame(update);
      }
    }, {passive: true});
    update();
  } catch(err) {}
})();

/* ── Mobile sticky WhatsApp CTA (after scrolling past primary button) ── */
(function(){
  try {
    const cta = document.querySelector(".cta-row .btn-wa");
    const bar = document.querySelector(".mobile-bar");
    const barLink = bar?.querySelector("a");
    if(!cta || !bar || !barLink) return;
    barLink.href = cta.href;
    if(cta.target) barLink.target = cta.target;
    if(cta.rel) barLink.rel = cta.rel;
    const mq = window.matchMedia("(max-width:760px)");
    function isMobile(){ return mq.matches || window.innerWidth <= 760; }
    function update(){
      if(!isMobile()){
        bar.classList.remove("is-visible");
        bar.style.display = "";
        document.body.classList.remove("has-mobile-cta-bar");
        bar.setAttribute("aria-hidden", "true");
        return;
      }
      bar.style.display = "block";
      const past = cta.getBoundingClientRect().bottom < 0;
      bar.classList.toggle("is-visible", past);
      document.body.classList.toggle("has-mobile-cta-bar", past);
      bar.setAttribute("aria-hidden", past ? "false" : "true");
    }
    window.addEventListener("scroll", update, {passive: true});
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);
    update();
  } catch(err) {}
})();

/* ── Language translator (EN/HI/MR) — see /assets/product-i18n.js ── */

/* ── Lab-tested nutrition quantity scaler ── */
(function(){
  document.querySelectorAll(".spec-nutrition").forEach(card => {
    try {
      if(!card.dataset.per100) return;
      const per100 = JSON.parse(card.dataset.per100);
      const btns = card.querySelectorAll(".nutri-qty-btn");
      function render(grams){
        card.querySelectorAll("[data-nutri]").forEach(el => {
          const key = el.dataset.nutri;
          if(per100[key] == null) return;
          const val = per100[key] * grams / 100;
          const isMg = key === "calcium" || key === "phosphorus";
          el.textContent = isMg
            ? Math.round(val * 1000) + "mg"
            : (Math.round(val * 10) / 10) + "g";
        });
      }
      btns.forEach(btn => {
        btn.addEventListener("click", () => {
          btns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          render(parseInt(btn.dataset.g, 10));
        });
      });
      render(100);
    } catch(e) { console.error("Nutrition card data error:", e, card); }
  });
})();
