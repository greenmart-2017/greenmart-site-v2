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
