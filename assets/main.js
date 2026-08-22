/* ═══════════════════════════════════════════
   ✏️ EDIT HERE — your business details
   ═══════════════════════════════════════════ */
const CONFIG = {
  phone: "918600632420",          // Green Mart WhatsApp
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdTt3Jh-NJbAdx29wBO7WXliCCEJadz8IJOJff0Wg9ahJVpXIKS5zGg8otlxcmH9sHJnfU20HTWsMJ/pub?output=csv", // Green Mart live sheet
  businessName: "Green Mart"
};

/* Build wa.me link with pre-filled message */
function waLink(msg){
  return `https://wa.me/${CONFIG.phone}?text=${encodeURIComponent(msg)}`;
}

/* Product card quick-enquire */
function orderProduct(name){
  const msg = `Hi ${CONFIG.businessName}! 🐟\nI'm interested in: *${name}*\nPlease share today's rate & details.`;
  window.open(waLink(msg), "_blank", "noopener,noreferrer");
}

/* Main enquiry form → WhatsApp */
document.getElementById("orderForm").addEventListener("submit", function(e){
  e.preventDefault();
  const product = document.getElementById("f-product").value;
  const qty     = document.getElementById("f-qty").value.trim();
  const type    = document.getElementById("f-type").value;
  const name    = document.getElementById("f-name").value.trim();
  const loc     = document.getElementById("f-loc").value.trim();
  const notes   = document.getElementById("f-notes").value.trim();

  if(!validate(["f-qty","f-name","f-loc"])){
    toast("Please fill quantity, name and location.", "err");
    return;
  }

  let msg = `Hi ${CONFIG.businessName}! I want to place an enquiry 🐟\n\n` +
            `*Product:* ${product}\n` +
            `*Quantity:* ${qty}\n` +
            `*Buyer type:* ${type}\n` +
            `*Name:* ${name}\n` +
            `*Delivery location:* ${loc}`;
  if(notes) msg += `\n*Notes:* ${notes}`;
  msg += `\n\nPlease share today's rate. Thank you!`;

  /* Silent backup copy to Netlify Forms — so the enquiry is never lost even if
     WhatsApp fails to open (popup blocker, no WhatsApp linked, etc.). Best-effort:
     never blocks or delays the WhatsApp flow below. */
  try{
    const body = new URLSearchParams({
      "form-name": "wholesale-enquiry",
      product, qty, type, name, location: loc, notes
    }).toString();
    fetch("/", {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body
    }).catch(()=>{ /* silent — WhatsApp remains the primary path */ });
  }catch(err){ /* silent */ }

  window.open(waLink(msg), "_blank", "noopener,noreferrer");
  toast("Opening WhatsApp with your enquiry… ✅", "ok");
});

/* Footer + floating links */
const genericMsg = `Hi ${CONFIG.businessName}! I have an enquiry about your products.`;
document.getElementById("wa-float").href = waLink(genericMsg);
document.getElementById("foot-wa").href  = waLink(genericMsg);
document.getElementById("foot-call").href = `tel:+${CONFIG.phone}`;
document.getElementById("yr").textContent = new Date().getFullYear();

/* Mobile hamburger menu */
const burger = document.getElementById("hamburger");
const mMenu  = document.getElementById("mobileMenu");
burger.addEventListener("click", () => {
  const open = mMenu.classList.toggle("show");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
});

/* Desktop nav "More" dropdown */
(function(){
  const wrap = document.querySelector(".nav-more");
  const btn = document.getElementById("navMoreBtn");
  if(!wrap || !btn) return;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = wrap.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  document.addEventListener("click", (e) => {
    if(!wrap.contains(e.target)) wrap.classList.remove("open");
  });
  wrap.querySelectorAll("a").forEach(a => a.addEventListener("click", () => wrap.classList.remove("open")));
})();
/* menu links: close menu, then scroll to section (JS-driven, always works) */
mMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", (e) => {
  const id = a.getAttribute("href");
  if(id && id.startsWith("#")){
    e.preventDefault();
    mMenu.classList.remove("show");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded","false");
    const target = document.querySelector(id);
    if(target){
      setTimeout(() => target.scrollIntoView({behavior:"smooth", block:"start"}), 60);
    }
  }
}));

/* ── Rates board (edit rates here) ── */
CONFIG.ratesUpdated = "Today";           // 👈 change when you update rates e.g. "11 July 2026"
CONFIG.rates = [                          // 👈 edit your rates here
  ["Fresh Pangas — 800g–1kg", "per kg", "₹110–120"],
  ["Fresh Pangas — 1–1.2kg", "per kg", "₹120–130"],
  ["Fresh Pangas — 1.2kg+", "per kg", "₹130–140"],
  ["Fresh Rohu — size-graded", "per kg", "Ask on WhatsApp"],
  ["Fresh Katla — size-graded", "per kg", "Ask on WhatsApp"],
  ["Fresh Mrigal — size-graded", "per kg", "Ask on WhatsApp"],
  ["Tilapia / Common Carp", "per kg", "Ask on WhatsApp"],
  ["Murrel / Catfish (premium)", "per kg", "Seasonal — ask"],
  ["Fresh Bangda (Indian Mackerel)", "per kg", "Ask on WhatsApp"],
  ["Fresh Rawas (Indian Salmon)", "per kg", "Ask on WhatsApp"],
  ["Fresh Shilang", "per kg", "Ask on WhatsApp"],
  ["Frozen Basa Fillet — 500g pack", "per pack", "Launching soon"],
  ["Frozen Basa Fillet — 250g pack", "per pack", "Launching soon"],
  ["Frozen Fillet — bulk 5kg/10kg", "per kg", "Ask on WhatsApp"]
];

function renderRatesTable(rows){
  const tb = document.querySelector("#ratesTable tbody");
  if(!tb) return;
  tb.classList.remove("is-loading");
  tb.innerHTML = "";
  rows.forEach(r => {
    const tr = document.createElement("tr");
    [r[0], r[1], r[2]].forEach(val => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
}

function showRatesShimmer(rowCount){
  const tb = document.querySelector("#ratesTable tbody");
  if(!tb) return;
  tb.classList.add("is-loading");
  tb.innerHTML = "";
  for(let i = 0; i < rowCount; i++){
    const tr = document.createElement("tr");
    for(let j = 0; j < 3; j++){
      const td = document.createElement("td");
      const bar = document.createElement("span");
      bar.className = "rates-shimmer-bar";
      bar.setAttribute("aria-hidden", "true");
      td.appendChild(bar);
      tr.appendChild(td);
    }
    tb.appendChild(tr);
  }
}

if(CONFIG.sheetCsvUrl){
  let ratesSettled = false;
  const shimmerTimer = setTimeout(() => {
    if(!ratesSettled) showRatesShimmer(8);
  }, 300);
  fetch(CONFIG.sheetCsvUrl, {cache:"no-store"})
    .then(r => r.text())
    .then(csv => {
      const rows = csv.trim().split(/\r?\n/).map(line => line.split(",").map(c => c.trim()));
      const rates = [], avail = [], bulk = {};
      let updated = null;
      rows.slice(1).forEach(r => {
        const [section, name, unit, value, available] = r;
        if(!section || !name) return;
        const s = section.toLowerCase();
        if(s === "rate")  rates.push([name, unit || "", value || ""]);
        if(s === "avail") avail.push([name, (available||"").toLowerCase().startsWith("y")]);
        if(s === "bulk")  bulk[name] = parseFloat(value) || 0;
        if(s === "meta" && name.toLowerCase() === "updated") updated = value;
      });
      renderRatesTable(rates.length ? rates : CONFIG.rates);
      if(updated) document.getElementById("ratesDate").textContent = updated;
      if(avail.length){
        const box = document.getElementById("availInner");
        box.querySelectorAll(".avail-item").forEach(e => e.remove());
        avail.forEach(([name, ok]) => {
          const sp = document.createElement("span");
          sp.className = "avail-item";
          sp.textContent = (ok ? "✅ " : "❌ ") + name;
          box.appendChild(sp);
        });
      }
      if(Object.keys(bulk).length){
        CONFIG.bulkRates = bulk;
        const sel = document.getElementById("c-sp");
        if(sel){ sel.innerHTML = "";
          Object.keys(bulk).forEach(k => { const o = document.createElement("option"); o.value = k; o.textContent = k; sel.appendChild(o); });
        }
      }
    })
    .catch(() => { renderRatesTable(CONFIG.rates); })
    .finally(() => {
      ratesSettled = true;
      clearTimeout(shimmerTimer);
    });
}else{
  renderRatesTable(CONFIG.rates);
}
document.getElementById("ratesDate").textContent = CONFIG.ratesUpdated;

/* ── Scroll reveal ── */
(function(){
  const els = document.querySelectorAll(".card,.step,.cert,.quote,.faq");
  els.forEach(el => el.classList.add("reveal"));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} });
  }, {threshold:.12});
  els.forEach(el => io.observe(el));
})();

/* ── Section scroll-reveal ── */
(function(){
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sections = document.querySelectorAll("section[id]");
  if(!sections.length) return;
  if(reduceMotion){
    sections.forEach(s => s.classList.add("section-reveal", "is-visible"));
    return;
  }
  sections.forEach(s => s.classList.add("section-reveal"));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  }, {threshold: 0.15});
  sections.forEach(s => io.observe(s));
})();

/* ── About Us stat counters ── */
(function(){
  const statsBlock = document.querySelector(".about-stats");
  if(!statsBlock) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const statEls = statsBlock.querySelectorAll(".stat b");
  if(reduceMotion) return;

  function animateStat(el, duration){
    const text = el.textContent.trim();
    const match = text.match(/^(\d+)(.*)$/);
    if(!match) return;
    const target = parseInt(match[1], 10);
    const suffix = match[2] || "";
    const start = performance.now();
    function frame(now){
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if(t < 1) requestAnimationFrame(frame);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(frame);
  }

  let played = false;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting && !played){
        played = true;
        statEls.forEach(el => animateStat(el, 1200));
        io.unobserve(e.target);
      }
    });
  }, {threshold: 0.15});
  io.observe(statsBlock);
})();

/* ── Sticky nav shrink-on-scroll ── */
(function(){
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
})();

/* ── Gallery lightbox ── */
(function(){
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const triggers = [];
  document.querySelectorAll(".gal-item").forEach(item => {
    const img = item.querySelector("img");
    if(!img) return;
    item.classList.add("gal-item--lightbox");
    if(!item.hasAttribute("tabindex")) item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", img.alt ? `View larger: ${img.alt}` : "View larger image");
    triggers.push({item, img});
  });
  if(!triggers.length) return;

  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-hidden", "true");
  lb.hidden = true;

  const lbImg = document.createElement("img");
  lbImg.alt = "";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lightbox-close";
  closeBtn.setAttribute("aria-label", "Close image");
  closeBtn.textContent = "\u00d7";

  lb.appendChild(prevBtn);
  lb.appendChild(lbImg);
  lb.appendChild(nextBtn);
  lb.appendChild(closeBtn);
  document.body.appendChild(lb);

  let lastFocus = null;
  let currentIndex = 0;

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "lightbox-nav lightbox-prev";
  prevBtn.setAttribute("aria-label", "Previous image");
  prevBtn.textContent = "\u2039";

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "lightbox-nav lightbox-next";
  nextBtn.setAttribute("aria-label", "Next image");
  nextBtn.textContent = "\u203a";

  const focusable = () => [prevBtn, nextBtn, closeBtn];

  function showAt(index){
    currentIndex = (index + triggers.length) % triggers.length;
    const trigger = triggers[currentIndex];
    lbImg.src = trigger.img.currentSrc || trigger.img.src;
    lbImg.alt = trigger.img.alt || "";
    prevBtn.style.visibility = triggers.length > 1 ? "visible" : "hidden";
    nextBtn.style.visibility = triggers.length > 1 ? "visible" : "hidden";
  }

  function trapFocus(e){
    if(e.key !== "Tab") return;
    const els = focusable();
    const first = els[0];
    const last = els[els.length - 1];
    if(e.shiftKey && document.activeElement === first){
      e.preventDefault();
      last.focus();
    }else if(!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      first.focus();
    }
  }

  function openLightbox(trigger){
    lastFocus = trigger.item;
    currentIndex = triggers.indexOf(trigger);
    showAt(currentIndex);
    lb.hidden = false;
    lb.setAttribute("aria-hidden", "false");
    if(reduceMotion) lb.classList.add("is-open");
    else requestAnimationFrame(() => lb.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
    lb.addEventListener("keydown", trapFocus);
  }

  function closeLightbox(){
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    lb.removeEventListener("keydown", trapFocus);
    const restore = lastFocus;
    lastFocus = null;
    lbImg.removeAttribute("src");
    window.setTimeout(() => {
      lb.hidden = true;
      if(restore) restore.focus();
    }, reduceMotion ? 0 : 250);
  }

  function onKeydown(e){
    if(e.key === "Escape") closeLightbox();
    if(triggers.length < 2) return;
    if(e.key === "ArrowLeft") showAt(currentIndex - 1);
    if(e.key === "ArrowRight") showAt(currentIndex + 1);
  }

  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", () => showAt(currentIndex - 1));
  nextBtn.addEventListener("click", () => showAt(currentIndex + 1));
  lb.addEventListener("click", e => {
    if(e.target === lb) closeLightbox();
  });

  triggers.forEach(({item, img}) => {
    const open = () => openLightbox({item, img});
    item.addEventListener("click", open);
    item.addEventListener("keydown", e => {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        open();
      }
    });
  });
})();

/* ── 3D card tilt (desktop pointers only) ── */
(function(){
  if(matchMedia("(hover:none)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.classList.add("tilting");
      card.style.transform = `rotateY(${(x-.5)*10}deg) rotateX(${(.5-y)*8}deg) translateY(-4px)`;
      card.style.setProperty("--mx", (x*100)+"%");
      card.style.setProperty("--my", (y*100)+"%");
    });
    card.addEventListener("mouseleave", () => {
      card.classList.remove("tilting");
      card.style.transform = "";
    });
  });
})();

/* ── Hero photo parallax (mouse) ── */
(function(){
  if(matchMedia("(hover:none)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const hero = document.querySelector(".hero");
  if(!hero) return;
  hero.addEventListener("mousemove", e => {
    const r = hero.getBoundingClientRect();
    const x = 35 + ((e.clientX - r.left)/r.width - .5) * 10;
    const y = 35 + ((e.clientY - r.top)/r.height - .5) * 6;
    hero.style.backgroundPosition = `${x}% ${y}%`;
  });
  hero.addEventListener("mouseleave", ()=> hero.style.backgroundPosition = "");
})();

/* ── Bubbles ── */
(function(){
  const box = document.getElementById("bubbles");
  if(!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const n = matchMedia("(max-width:760px)").matches ? 8 : 16;
  for(let i=0;i<n;i++){
    const b = document.createElement("span");
    b.className = "bubble";
    const s = 6 + Math.random()*18;
    b.style.width = b.style.height = s+"px";
    b.style.left = Math.random()*100+"%";
    b.style.setProperty("--drift", (Math.random()*60-30)+"px");
    b.style.animationDuration = (9 + Math.random()*10)+"s";
    b.style.animationDelay = (Math.random()*10)+"s";
    box.appendChild(b);
  }
})();



/* ══════════ FULL-SITE TRANSLATOR (EN / हिंदी / मराठी) ══════════ */
(function(){
const D = {
"Lake to Plate":["झील से थाली तक","तलावापासून ताटापर्यंत"],
"From Lake to Plate":["झील से थाली तक","तलावापासून ताटापर्यंत"],
"Raised in our own lake reservoir at Navegaon Dam":["हमारे अपने झील जलाशय में पला, नवेगांव बांध","आमच्या स्वतःच्या तलाव जलाशयात वाढवलेले, नवेगाव धरण"],
"Our farm & lake — photo coming soon":["हमारा फार्म व झील — फोटो जल्द","आमचे फार्म व तलाव — फोटो लवकरच"],
"Illustrative image":["उदाहरणात्मक चित्र","उदाहरणादाखल चित्र"],
"Illustrative":["उदाहरणात्मक","उदाहरणादाखल"],
"Understand the different ways fish can be prepared and cut — by species.":["जानें प्रजाति के अनुसार मछली को कैसे तैयार व काटा जाता है।","प्रजातीनुसार मासा कसा तयार व कापला जातो ते जाणून घ्या."],
"Rohu":["रोहू","रोहू"],
"Katla":["कतला","कतला"],
"Basa / Pangasius":["बासा / पंगास","बासा / पंगास"],
"Customer education":["ग्राहक शिक्षा","ग्राहक शिक्षण"],
"Know Your Fish Cuts":["अपनी मछली के कट जानें","तुमच्या माशाचे कट जाणून घ्या"],
"Understand the different ways fish can be prepared and cut.":["जानें मछली को अलग-अलग तरीकों से कैसे तैयार व काटा जाता है।","मासा वेगवेगळ्या प्रकारे कसा तयार व कापला जातो ते जाणून घ्या."],
"Photo coming soon":["फोटो जल्द आ रहा है","फोटो लवकरच येत आहे"],
"Whole Fish":["पूरी मछली","संपूर्ण मासा"],
"Fish in its complete natural form.":["मछली अपने पूरे प्राकृतिक रूप में।","मासा त्याच्या संपूर्ण नैसर्गिक स्वरूपात."],
"Best for those who prefer cleaning and cutting themselves":["उन लोगों के लिए बेहतर जो खुद साफ करना व काटना पसंद करते हैं","जे स्वतः स्वच्छ करणे व कापणे पसंत करतात त्यांच्यासाठी उत्तम"],
"Cleaned Whole":["साफ की हुई पूरी","स्वच्छ केलेला संपूर्ण"],
"Scales, internal organs and unwanted parts removed while keeping the fish largely whole.":["स्केल, आंतरिक अंग व अनावश्यक हिस्से हटाए गए, पर मछली ज़्यादातर पूरी रहती है।","स्केल, अंतर्गत अवयव व नको असलेले भाग काढले, पण मासा बहुतांशी संपूर्ण राहतो."],
"Curry Cut":["करी कट","करी कट"],
"Traditional bone-in pieces commonly used for Indian fish curries.":["पारंपरिक हड्डी सहित टुकड़े, भारतीय फिश करी में आम इस्तेमाल होते हैं।","पारंपरिक हाडांसह तुकडे, भारतीय फिश करीमध्ये सामान्यपणे वापरले जातात."],
"Most popular for home cooking":["घर के खाने के लिए सबसे लोकप्रिय","घरगुती स्वयंपाकासाठी सर्वाधिक लोकप्रिय"],
"Steak Cut":["स्टेक कट","स्टेक कट"],
"Thicker cross-sectional pieces suitable for frying, grilling and curries.":["मोटे टुकड़े, फ्राई, ग्रिल व करी के लिए उपयुक्त।","जाड तुकडे, फ्राय, ग्रिल व करीसाठी योग्य."],
"Butterfly Cut":["बटरफ्लाई कट","बटरफ्लाय कट"],
"Fish opened from the centre while keeping both sides connected.":["मछली को बीच से खोला गया, दोनों तरफ जुड़े रहते हैं।","मासा मध्यभागातून उघडलेला, दोन्ही बाजू जोडलेल्या राहतात."],
"Fillet":["फ़िलेट","फिलेट"],
"Side portion separated from the main bone structure.":["मुख्य हड्डी संरचना से अलग किया गया साइड हिस्सा।","मुख्य हाडाच्या रचनेपासून वेगळा केलेला बाजूचा भाग."],
"Skinless Fillet":["बिना छिलके का फ़िलेट","स्किनलेस फिलेट"],
"Fillet with skin removed for easier preparation.":["आसान तैयारी के लिए छिलका हटाया गया फ़िलेट।","सोप्या तयारीसाठी त्वचा काढलेले फिलेट."],
"Used for our frozen Basa fillet":["हमारे फ्रोज़न बासा फ़िलेट में इस्तेमाल होता है","आमच्या फ्रोझन बासा फिलेटमध्ये वापरले जाते"],
"Boneless Cubes":["बिना कांटे के क्यूब्स","बोनलेस क्यूब्स"],
"Boneless fillet portion cut into convenient cubes.":["बिना कांटे का फ़िलेट हिस्सा सुविधाजनक क्यूब्स में कटा हुआ।","बोनलेस फिलेटचा भाग सोयीस्कर क्यूब्समध्ये कापलेला."],
"Head & Tail / Portions":["सिर व पूंछ / पोर्शन","डोके व शेपटी / भाग"],
"Different portions of the fish used depending on regional cooking preferences.":["क्षेत्रीय पसंद के अनुसार मछली के अलग-अलग हिस्से इस्तेमाल होते हैं।","प्रादेशिक आवडीनुसार माशाचे वेगवेगळे भाग वापरले जातात."],
"Cuts shown here are for customer education. Availability and preparation options may vary by species and order.":["यहां दिखाए गए कट ग्राहक शिक्षा के लिए हैं। प्रजाति व ऑर्डर के अनुसार उपलब्धता व तैयारी में बदलाव हो सकता है।","येथे दाखवलेले कट ग्राहक शिक्षणासाठी आहेत. प्रजाती व ऑर्डरनुसार उपलब्धता व तयारीत बदल होऊ शकतो."],
"How we track quality":["हम गुणवत्ता कैसे ट्रैक करते हैं","आम्ही गुणवत्ता कशी ट्रॅक करतो"],
"Traceability":["ट्रेसेबिलिटी","ट्रेसेबिलिटी"],
"Every batch of fish from Green Mart follows a documented path — here's how we think about tracking it, from source to your door.":["ग्रीन मार्ट की हर बैच एक दस्तावेज़ी रास्ते से गुज़रती है — स्रोत से आपके दरवाज़े तक हम इसे कैसे ट्रैक करते हैं।","ग्रीन मार्टची प्रत्येक बॅच दस्तऐवजीकरण केलेल्या मार्गाने जाते — स्रोतापासून तुमच्या दारापर्यंत आम्ही ते कसे ट्रॅक करतो."],
"Source / Farm":["स्रोत / फार्म","स्रोत / फार्म"],
"Batch":["बैच","बॅच"],
"Harvest":["कटाई","काढणी"],
"Processing":["प्रोसेसिंग","प्रक्रिया"],
"Packing":["पैकिंग","पॅकिंग"],
"Storage":["स्टोरेज","साठवण"],
"Dispatch":["डिस्पैच","डिस्पॅच"],
"This is currently an informational overview of our process. Batch-level lookup (e.g. via QR code on packaging) is a planned future feature — not yet active.":["यह फिलहाल हमारी प्रक्रिया का सूचनात्मक विवरण है। बैच-स्तर लुकअप (जैसे पैकेजिंग पर QR कोड) एक भविष्य की योजना है — अभी सक्रिय नहीं है।","ही सध्या आमच्या प्रक्रियेची माहितीपूर्ण माहिती आहे. बॅच-स्तरीय लुकअप (उदा. पॅकेजिंगवरील QR कोड) ही भविष्यातील योजना आहे — अद्याप कार्यान्वित नाही."],
"Fish Cuts":["फिश कट","फिश कट"],
"Contact person":["संपर्क व्यक्ति","संपर्क व्यक्ती"],
"Mobile number":["मोबाइल नंबर","मोबाइल नंबर"],
"Preferred size":["पसंदीदा साइज़","पसंतीचा आकार"],
"Frequency":["आवृत्ति","वारंवारता"],
"Approx. quantity":["अनुमानित मात्रा","अंदाजे प्रमाण"],
"Additional requirements (optional)":["अतिरिक्त आवश्यकताएं (वैकल्पिक)","अतिरिक्त गरजा (ऐच्छिक)"],
"This form opens WhatsApp with your details pre-filled — nothing is stored on our server. We'll reply directly on WhatsApp.":["यह फॉर्म आपकी जानकारी के साथ WhatsApp खोलता है — कुछ भी हमारे सर्वर पर सेव नहीं होता। हम सीधे WhatsApp पर जवाब देंगे।","हा फॉर्म तुमची माहिती भरून WhatsApp उघडतो — काहीही आमच्या सर्व्हरवर साठवले जात नाही. आम्ही थेट WhatsApp वर उत्तर देऊ."],
"Find Us":["हमें ढूंढें","आम्हाला शोधा"],
"Our Farm — Navegaon Dam & Reservoir":["हमारा फार्म — नवेगांव बांध व जलाशय","आमचे फार्म — नवेगाव धरण व जलाशय"],
"Our Office — Green Mart Fish & Agri":["हमारा कार्यालय — ग्रीन मार्ट फिश एंड एग्री","आमचे कार्यालय — ग्रीन मार्ट फिश अँड अ‍ॅग्री"],
"Trustworthy. Traceable. Eco-friendly.":["भरोसेमंद। ट्रेसेबल। पर्यावरण-हितैषी।","विश्वासार्ह. ट्रेसेबल. पर्यावरणपूरक."],
"Most fish in the market comes with no paperwork and no traceability. Green Mart is different — we've applied for independent certification (positive initial response received), and every batch can already be traced back to our farm.":["बाज़ार की ज़्यादातर मछली बिना कागज़ात के आती है। ग्रीन मार्ट अलग है — हमने स्वतंत्र प्रमाणन के लिए आवेदन किया है (सकारात्मक प्रारंभिक प्रतिक्रिया मिली), और हर बैच पहले से ही हमारे फार्म तक ट्रेस हो सकता है।","बाजारातील बहुतेक मासे कागदपत्रांशिवाय येतात. ग्रीन मार्ट वेगळे आहे — आम्ही स्वतंत्र प्रमाणनासाठी अर्ज केला आहे (सकारात्मक प्रारंभिक प्रतिसाद मिळाला), आणि प्रत्येक बॅच आधीच आमच्या फार्मपर्यंत ट्रेस होऊ शकते."],
"That's why we've formally applied for ISO 9001, ISO 14001 and HACCP certification — already received a positive initial response from an accredited certifying body — so every buyer, from a home kitchen to a hotel chain, will soon have full third-party assurance.":["इसीलिए हमने ISO 9001, ISO 14001 और HACCP प्रमाणन के लिए औपचारिक आवेदन किया है — एक मान्यता प्राप्त संस्था से सकारात्मक प्रारंभिक प्रतिक्रिया मिल चुकी है — जल्द ही पूरी तीसरे-पक्ष की गारंटी मिलेगी।","म्हणूनच आम्ही ISO 9001, ISO 14001 आणि HACCP प्रमाणनासाठी औपचारिक अर्ज केला आहे — मान्यताप्राप्त संस्थेकडून सकारात्मक प्रारंभिक प्रतिसाद मिळाला आहे — लवकरच पूर्ण तृतीय-पक्ष हमी मिळेल."],
"We've formally applied for ISO 9001 (quality), ISO 14001 (environment) and HACCP (food safety) certification with an accredited body, and received a positive initial response. Certificates will be shared with business buyers as soon as they're issued.":["हमने ISO 9001 (गुणवत्ता), ISO 14001 (पर्यावरण) और HACCP (खाद्य सुरक्षा) प्रमाणन के लिए एक मान्यता प्राप्त संस्था के पास औपचारिक आवेदन किया है, और सकारात्मक प्रारंभिक प्रतिक्रिया मिली है। जारी होते ही प्रमाणपत्र व्यापारी खरीदारों के साथ साझा किए जाएंगे।","आम्ही ISO 9001 (गुणवत्ता), ISO 14001 (पर्यावरण) आणि HACCP (अन्न सुरक्षा) प्रमाणनासाठी मान्यताप्राप्त संस्थेकडे औपचारिक अर्ज केला आहे, आणि सकारात्मक प्रारंभिक प्रतिसाद मिळाला आहे. जारी होताच प्रमाणपत्रे व्यावसायिक खरेदीदारांसोबत सामायिक केली जातील."],
"Farm-direct fisheries & agricultural goods from Nagpur, Maharashtra. ISO 9001, ISO 14001 & HACCP certification applied for — in progress with an accredited body.":["नागपुर से फार्म-डायरेक्ट मत्स्य व कृषि सामान। ISO 9001, ISO 14001 व HACCP प्रमाणन हेतु आवेदन — एक मान्यता प्राप्त संस्था के साथ प्रगति पर।","नागपूरहून फार्म-डायरेक्ट मत्स्य व शेतीमाल. ISO 9001, ISO 14001 व HACCP प्रमाणनासाठी अर्ज — मान्यताप्राप्त संस्थेसोबत प्रगतीपथावर."],
"Food safety, every step":["हर कदम पर खाद्य सुरक्षा","प्रत्येक टप्प्यावर अन्न सुरक्षा"],
"Unbroken cold chain, from our farm to your doorstep.":["अटूट कोल्ड चेन, हमारे फार्म से आपके दरवाज़े तक।","अखंड कोल्ड चेन, आमच्या फार्मपासून तुमच्या दारापर्यंत."],
"We maintain a strict cold chain throughout — from harvest to delivery — to lock in freshness, flavour and nutrition. Nothing sits out, nothing gets compromised.":["हम कटाई से डिलीवरी तक सख्त कोल्ड चेन बनाए रखते हैं — ताज़गी, स्वाद व पोषण सुरक्षित रहे। कुछ भी बाहर नहीं रहता, कोई समझौता नहीं।","आम्ही काढणीपासून डिलिव्हरीपर्यंत कडक कोल्ड चेन राखतो — ताजेपणा, चव व पोषण सुरक्षित राहते. काहीही तडजोड होत नाही."],
"❄️ Harvest":["❄️ कटाई","❄️ काढणी"],
"🌡️ Quick Chill":["🌡️ त्वरित ठंडा","🌡️ त्वरित थंड"],
"📦 Cold Storage":["📦 कोल्ड स्टोरेज","📦 कोल्ड स्टोरेज"],
"🚚 Controlled Transport":["🚚 नियंत्रित परिवहन","🚚 नियंत्रित वाहतूक"],
"🏠 Safe Delivery":["🏠 सुरक्षित डिलीवरी","🏠 सुरक्षित डिलिव्हरी"],
"Safe. Hygienic. Reliable.":["सुरक्षित। स्वच्छ। भरोसेमंद।","सुरक्षित. स्वच्छ. विश्वासार्ह."],
"Because quality isn't just what we promise — it's how we deliver.":["क्योंकि गुणवत्ता सिर्फ वादा नहीं — यह हमारी डिलीवरी का तरीका है।","कारण गुणवत्ता फक्त वचन नाही — ती आमची डिलिव्हरीची पद्धत आहे."],
"Cold Chain":["कोल्ड चेन","कोल्ड चेन"],
"Fresh harvest":["ताज़ी कटाई","ताजी काढणी"],
"Fresh harvest, every single day.":["ताज़ी कटाई, हर रोज़।","ताजी काढणी, दररोज."],
"Our fish are harvested fresh from our own ponds with care and expertise — netted, sorted and moved to ice within minutes, so the fish reaching you is as fresh as it gets.":["हमारी मछली अपने तालाबों से ताज़ी काटी जाती है — जाल में, छांटकर, कुछ ही मिनटों में बर्फ में रखी जाती है।","आमचे मासे स्वतःच्या तलावांतून ताजे काढले जातात — जाळ्यात, वर्गीकरण करून, काही मिनिटांत बर्फात ठेवले जातात."],
"Daily Harvest":["रोज़ाना कटाई","रोजची काढणी"],
"Handled with care":["सावधानी से संभाला","काळजीपूर्वक हाताळणी"],
"Hygienic Process":["स्वच्छ प्रक्रिया","स्वच्छ प्रक्रिया"],
"Clean & safe handling":["साफ व सुरक्षित हैंडलिंग","स्वच्छ व सुरक्षित हाताळणी"],
"Pond to You":["तालाब से आप तक","तलावापासून तुमच्यापर्यंत"],
"Freshness delivered":["ताज़गी की डिलीवरी","ताजेपणाची डिलिव्हरी"],
"Our Farm":["हमारा फार्म","आमचे फार्म"],
"Available today":["आज उपलब्ध","आज उपलब्ध"],
"Plan your order":["अपना ऑर्डर प्लान करें","तुमचा ऑर्डर प्लॅन करा"],
"Bulk price calculator":["थोक मूल्य कैलकुलेटर","बल्क किंमत कॅल्क्युलेटर"],
"Species":["मछली प्रकार","माशांचा प्रकार"],
"Quantity (kg)":["मात्रा (किलो)","प्रमाण (किलो)"],
"Calculate estimate":["अनुमान निकालें","अंदाज काढा"],
"Indicative estimate at average rates — final rate depends on size grade & daily market, confirmed on WhatsApp.":["औसत रेट पर अनुमान — अंतिम रेट साइज़ व रोज़ के बाज़ार पर, WhatsApp पर तय।","सरासरी दराने अंदाज — अंतिम दर साईझ व रोजच्या बाजारावर, WhatsApp वर नक्की."],
"Easy at home":["घर पर आसान","घरी सोपे"],
"Simple basa fillet recipes":["आसान बासा फ़िलेट रेसिपी","सोप्या बासा फिलेट रेसिपी"],
"Crispy Tawa Fry":["क्रिस्पी तवा फ्राई","क्रिस्पी तवा फ्राय"],
"Rub fillet with turmeric, chilli, salt & lemon. Shallow-fry 3–4 min each side till golden. Weeknight favourite.":["फ़िलेट पर हल्दी, मिर्च, नमक व नींबू लगाएं। दोनों तरफ 3–4 मिनट सुनहरा तलें।","फिलेटला हळद, मिरची, मीठ व लिंबू लावा. दोन्ही बाजूंनी ३–४ मिनिटे सोनेरी तळा."],
"Home-style Fish Curry":["घर जैसी फिश करी","घरगुती फिश करी"],
"Simmer fillet chunks in onion-tomato masala with garam masala 8–10 min. No bones — kids eat happily.":["प्याज़-टमाटर मसाले में फ़िलेट के टुकड़े 8–10 मिनट पकाएं। कांटे नहीं — बच्चे खुशी से खाते हैं।","कांदा-टोमॅटो मसाल्यात फिलेटचे तुकडे ८–१० मिनिटे शिजवा. काटे नाहीत — मुले आनंदाने खातात."],
"Garlic Butter Grill":["गार्लिक बटर ग्रिल","गार्लिक बटर ग्रिल"],
"Marinate in garlic, butter, pepper & lemon. Grill or air-fry 10–12 min. High-protein gym meal.":["लहसुन, मक्खन, काली मिर्च व नींबू में मैरीनेट करें। 10–12 मिनट ग्रिल/एयर-फ्राई। हाई-प्रोटीन मील।","लसूण, लोणी, मिरपूड व लिंबूत मॅरीनेट करा. १०–१२ मिनिटे ग्रिल/एअर-फ्राय. हाय-प्रोटीन जेवण."],
"Masala Fish Rice Bowl":["मसाला फिश राइस बाउल","मसाला फिश राईस बाऊल"],
"Pan-fry spiced fillet strips, serve over steamed rice with onion & lemon. One-bowl lunch in 15 min.":["मसालेदार फ़िलेट स्ट्रिप्स तलकर चावल पर परोसें। 15 मिनट में लंच।","मसालेदार फिलेट स्ट्रिप्स तळून भातावर वाढा. १५ मिनिटांत जेवण."],
"Regular buyer? Reorder in one tap 🔁":["नियमित ग्राहक? एक टैप में दोबारा ऑर्डर 🔁","नियमित ग्राहक? एका टॅपमध्ये पुन्हा ऑर्डर 🔁"],
"We'll pull up your usual order and confirm today's rate.":["हम आपका सामान्य ऑर्डर देखकर आज का रेट कन्फर्म करेंगे।","आम्ही तुमचा नेहमीचा ऑर्डर पाहून आजचा दर कन्फर्म करू."],
"Repeat my usual order":["मेरा सामान्य ऑर्डर दोहराएं","माझा नेहमीचा ऑर्डर पुन्हा करा"],
"Where we work":["हम कहां काम करते हैं","आम्ही कुठे काम करतो"],
"Our waters — Navegaon Dam & Reservoir":["हमारा जल क्षेत्र — नवेगांव बांध व जलाशय","आमचे जलक्षेत्र — नवेगाव धरण व जलाशय"],
"Fresh Mrigal — size-graded":["ताज़ा मृगल — साइज़ अनुसार","ताजे मृगल — साईझनुसार"],
"Tilapia / Common Carp":["तिलापिया / कॉमन कार्प","तिलापिया / कॉमन कार्प"],
"Murrel / Catfish (premium)":["मुरल / कैटफ़िश (प्रीमियम)","मरळ / कॅटफिश (प्रीमियम)"],
"Seasonal — ask":["मौसमी — पूछें","हंगामी — विचारा"],
"Fresh Fish — Mrigal / Tilapia / Carp":["ताज़ी मछली — मृगल / तिलापिया / कार्प","ताजे मासे — मृगल / तिलापिया / कार्प"],
"Murrel / Catfish (seasonal premium)":["मुरल / कैटफ़िश (मौसमी प्रीमियम)","मरळ / कॅटफिश (हंगामी प्रीमियम)"],
"Whole fresh fish from our ponds & dams — Pangas (Basa), Rohu, Katla, Mrigal, Tilapia, Common Carp — size-graded. Premium Murrel & catfish available seasonally. Bulk supply for wholesalers, retailers, restaurants & hotels.":["हमारे तालाबों व बांधों से साबुत ताज़ी मछली — पंगास (बासा), रोहू, कतला, मृगल, तिलापिया, कॉमन कार्प — साइज़ अनुसार। प्रीमियम मुरल व कैटफ़िश मौसमी उपलब्ध। थोक विक्रेता, रिटेलर, रेस्टोरेंट व होटल के लिए।","आमच्या तलाव व धरणांतून संपूर्ण ताजे मासे — पंगास (बासा), रोहू, कतला, मृगल, तिलापिया, कॉमन कार्प — साईझनुसार. प्रीमियम मरळ व कॅटफिश हंगामी उपलब्ध. होलसेलर, रिटेलर, रेस्टॉरंट व हॉटेलसाठी."],
"Know before you order":["ऑर्डर से पहले जानें","ऑर्डरआधी जाणून घ्या"],
"Delivery cost estimator":["डिलीवरी लागत अनुमान","डिलिव्हरी खर्च अंदाज"],
"Delivery area":["डिलीवरी क्षेत्र","डिलिव्हरी क्षेत्र"],
"Nagpur City (0–15 km)":["नागपुर शहर (0–15 किमी)","नागपूर शहर (०–१५ किमी)"],
"Nagpur outskirts (15–30 km)":["नागपुर बाहरी (15–30 किमी)","नागपूर बाहेरील (१५–३० किमी)"],
"Within 100 km (Wardha, Bhandara, Kamptee…)":["100 किमी के भीतर (वर्धा, भंडारा…)","१०० किमीच्या आत (वर्धा, भंडारा…)"],
"Other city / Maharashtra":["अन्य शहर / महाराष्ट्र","इतर शहर / महाराष्ट्र"],
"Order quantity (kg)":["ऑर्डर मात्रा (किलो)","ऑर्डर प्रमाण (किलो)"],
"Estimate delivery cost":["डिलीवरी लागत जानें","डिलिव्हरी खर्च पहा"],
"Estimate only — final delivery cost confirmed on WhatsApp with your exact location.":["केवल अनुमान — अंतिम लागत WhatsApp पर आपके स्थान के साथ तय होगी।","फक्त अंदाज — अंतिम खर्च WhatsApp वर तुमच्या ठिकाणासह ठरेल."],
"Nagpur City · orders 50 kg+":["नागपुर शहर · 50 किलो+ ऑर्डर","नागपूर शहर · ५० किलो+ ऑर्डर"],
"Nagpur City · below 50 kg":["नागपुर शहर · 50 किलो से कम","नागपूर शहर · ५० किलोपेक्षा कमी"],
"Outskirts (15–30 km) · 200 kg+ free":["बाहरी (15–30 किमी) · 200 किलो+ मुफ्त","बाहेरील (१५–३० किमी) · २०० किलो+ मोफत"],
"Within 100 km":["100 किमी के भीतर","१०० किमीच्या आत"],
"Other cities (frozen, insulated/reefer)":["अन्य शहर (फ्रोज़न, इंसुलेटेड/रीफर)","इतर शहरे (फ्रोझन, इन्सुलेटेड/रीफर)"],
"Quote on WhatsApp":["WhatsApp पर कोट","WhatsApp वर कोट"],
"FREE":["मुफ्त","मोफत"],
"₹80 flat":["₹80 फ्लैट","₹८० फ्लॅट"],
"₹150 flat":["₹150 फ्लैट","₹१५० फ्लॅट"],
"₹4/kg · min ₹300":["₹4/किलो · न्यूनतम ₹300","₹४/किलो · किमान ₹३००"],
"Wholesale / regular supply enquiry":["थोक / नियमित आपूर्ति पूछताछ","होलसेल / नियमित पुरवठा चौकशी"],
"Business name":["व्यवसाय का नाम","व्यवसायाचे नाव"],
"Business type":["व्यवसाय प्रकार","व्यवसाय प्रकार"],
"Processor / Kitchen":["प्रोसेसर / किचन","प्रोसेसर / किचन"],
"Product interest":["उत्पाद रुचि","उत्पादन आवड"],
"Multiple / all":["कई / सभी","अनेक / सर्व"],
"Approx weekly volume":["अनुमानित साप्ताहिक मात्रा","अंदाजे साप्ताहिक प्रमाण"],
"City / Area":["शहर / क्षेत्र","शहर / परिसर"],
"Send wholesale enquiry on WhatsApp":["WhatsApp पर थोक पूछताछ भेजें","WhatsApp वर होलसेल चौकशी पाठवा"],
"Delivery":["डिलीवरी","डिलिव्हरी"],
"Wholesale":["थोक","होलसेल"],
"Delivery Cost":["डिलीवरी लागत","डिलिव्हरी खर्च"],
"💬 WhatsApp now":["💬 अभी WhatsApp करें","💬 आत्ता WhatsApp करा"],
"How fast is delivery after ordering?":["ऑर्डर के बाद डिलीवरी कितनी जल्दी?","ऑर्डरनंतर डिलिव्हरी किती लवकर?"],
"Fresh fish confirmed before 8 AM is usually delivered the same day within Nagpur; later orders go next morning. Frozen fillet delivery is scheduled with you on WhatsApp.":["सुबह 8 बजे से पहले कन्फर्म ताज़ी मछली नागपुर में उसी दिन; बाद के ऑर्डर अगली सुबह। फ्रोज़न फ़िलेट WhatsApp पर शेड्यूल होती है।","सकाळी ८ पूर्वी कन्फर्म ताजे मासे नागपुरात त्याच दिवशी; नंतरचे ऑर्डर दुसऱ्या सकाळी. फ्रोझन फिलेट WhatsApp वर शेड्यूल होते."],
"Do you ship frozen fillet outside Nagpur?":["क्या नागपुर के बाहर फ्रोज़न फ़िलेट भेजते हैं?","नागपूरबाहेर फ्रोझन फिलेट पाठवता का?"],
"Yes for bulk orders — we use insulated boxes or reefer transport so the product stays at −18°C. Share your city on WhatsApp and we'll quote shipping. Retail-pack shipping to other cities is expanding gradually.":["हां, बल्क ऑर्डर के लिए — इंसुलेटेड बॉक्स या रीफर से −18°C पर। WhatsApp पर शहर बताएं, हम कोट देंगे।","होय, बल्क ऑर्डरसाठी — इन्सुलेटेड बॉक्स किंवा रीफरने −१८°C वर. WhatsApp वर शहर सांगा, आम्ही कोट देऊ."],
"Is there a delivery charge?":["क्या डिलीवरी चार्ज है?","डिलिव्हरी चार्ज आहे का?"],
"Within Nagpur city, delivery is FREE on orders of 50 kg or more (₹80 flat below that). Outskirts and outstation have simple slab rates — use the delivery estimator above or confirm on WhatsApp.":["नागपुर शहर में 50 किलो+ पर डिलीवरी मुफ्त (उससे कम पर ₹80)। बाहरी क्षेत्रों के लिए स्लैब रेट — ऊपर एस्टिमेटर देखें।","नागपूर शहरात ५० किलो+ वर डिलिव्हरी मोफत (त्याखाली ₹८०). बाहेरील भागांसाठी स्लॅब दर — वरील एस्टिमेटर पहा."],
/* nav */
"Products":["उत्पाद","उत्पादने"],
"Rates":["रेट","दर"],
"Certifications":["प्रमाणपत्र","प्रमाणपत्रे"],
"How to Order":["ऑर्डर कैसे करें","ऑर्डर कसे करावे"],
"About":["हमारे बारे में","आमच्याबद्दल"],
"Enquiry":["पूछताछ","चौकशी"],
"Order on WhatsApp":["WhatsApp पर ऑर्डर करें","WhatsApp वर ऑर्डर करा"],
"Today's Rates":["आज के रेट","आजचे दर"],
"FAQ":["सवाल-जवाब","प्रश्न-उत्तरे"],
"About Us":["हमारे बारे में","आमच्याबद्दल"],
"Send Enquiry":["पूछताछ भेजें","चौकशी पाठवा"],
/* hero */
"Nagpur · Farm-Direct · Since 2017":["नागपुर · फार्म-डायरेक्ट · 2017 से","नागपूर · फार्म-डायरेक्ट · २०१७ पासून"],
"Fresh from our farm.":["हमारे फार्म से ताज़ा।","आमच्या फार्ममधून ताजे."],
"Straight to your business.":["सीधे आपके व्यवसाय तक।","थेट तुमच्या व्यवसायापर्यंत."],
"Green Mart raises Pangasius (Basa), Rohu, Katla and other pond, dam & lake fish in our own aquaculture farms — supplying fresh fish, frozen fillets and agricultural goods across Nagpur & Maharashtra with honest weight and reliable bulk supply.":["ग्रीन मार्ट अपने प्रमाणित एक्वाकल्चर फार्म में पंगेसियस (बासा), रोहू, कतला और तालाब-झील की अन्य मछलियां पालता है — नागपुर व महाराष्ट्र में ताज़ी मछली, फ्रोज़न फ़िलेट व कृषि सामान की आपूर्ति, ईमानदार वजन और भरोसेमंद थोक सप्लाई के साथ।","ग्रीन मार्ट स्वतःच्या प्रमाणित मत्स्यपालन फार्ममध्ये पंगेशियस (बासा), रोहू, कतला आणि तलाव-धरणातील इतर मासे वाढवते — नागपूर व महाराष्ट्रात ताजे मासे, फ्रोझन फिलेट व शेतीमाल, प्रामाणिक वजन आणि भरवशाच्या पुरवठ्यासह."],
"Get today's rate":["आज का रेट पाएं","आजचा दर मिळवा"],
"See products":["उत्पाद देखें","उत्पादने पहा"],
"✓ Eco-friendly farming":["✓ पर्यावरण-हितैषी खेती","✓ पर्यावरणपूरक शेती"],
/* products */
"What we supply":["हम क्या सप्लाई करते हैं","आम्ही काय पुरवतो"],
"Products & Supply":["उत्पाद व आपूर्ति","उत्पादने व पुरवठा"],
"Fresh Fish — Pangas · Rohu · Katla":["ताज़ी मछली — पंगास · रोहू · कतला","ताजे मासे — पंगास · रोहू · कतला"],
"Farm-direct · iced same-day":["फार्म-डायरेक्ट · उसी दिन बर्फ में","फार्म-डायरेक्ट · त्याच दिवशी बर्फात"],
"Whole fresh fish from our ponds & dams — Pangas (Basa), Rohu, Katla, Mrigal, Tilapia, Common Carp — size-graded. Premium Murrel & catfish available seasonally. Bulk supply for wholesalers, retailers, restaurants & hotels.":["हमारे तालाबों से साबुत ताज़ी मछली — पंगास (बासा), रोहू, कतला व मौसमी झील किस्में, साइज़ अनुसार। थोक विक्रेता, रिटेलर, रेस्टोरेंट व होटल के लिए। ईमानदार वजन, लगातार सप्लाई।","आमच्या तलावांतून संपूर्ण ताजे मासे — पंगास (बासा), रोहू, कतला व हंगामी जातींसह, साईझनुसार. होलसेलर, रिटेलर, रेस्टॉरंट व हॉटेलसाठी. प्रामाणिक वजन, सातत्यपूर्ण पुरवठा."],
"Rate: daily market — ask on WhatsApp":["रेट: रोज़ का बाज़ार — WhatsApp पर पूछें","दर: रोजचा बाजार — WhatsApp वर विचारा"],
"Enquire":["पूछताछ करें","चौकशी करा"],
"Frozen Basa Fillet":["फ्रोज़न बासा फ़िलेट","फ्रोझन बासा फिलेट"],
"Pure Protein. Light on Calories.":["शुद्ध प्रोटीन। कम कैलोरी।","शुद्ध प्रोटीन. कमी कॅलरी."],
"250g & 500g packs · bulk boxes":["250ग्रा व 500ग्रा पैक · बल्क बॉक्स","२५०ग्रॅ व ५००ग्रॅ पॅक · बल्क बॉक्स"],
"Pre-book / Enquire":["प्री-बुक / पूछताछ","प्री-बुक / चौकशी"],
"Live Fish Supply":["जीवित मछली आपूर्ति","जिवंत मासे पुरवठा"],
"Oxygenated transport":["ऑक्सीजन युक्त परिवहन","ऑक्सिजनयुक्त वाहतूक"],
"Live Pangas for premium retail and restaurants that want the freshest possible stock. Short-distance supply within Nagpur region with proper oxygenated handling.":["प्रीमियम रिटेल व रेस्टोरेंट के लिए जीवित पंगास। नागपुर क्षेत्र में उचित ऑक्सीजन व्यवस्था के साथ आपूर्ति।","प्रीमियम रिटेल व रेस्टॉरंटसाठी जिवंत पंगास. नागपूर परिसरात योग्य ऑक्सिजन हाताळणीसह पुरवठा."],
"On order · Nagpur region":["ऑर्डर पर · नागपुर क्षेत्र","ऑर्डरवर · नागपूर परिसर"],
"Agricultural Goods":["कृषि सामान","शेतीमाल"],
"Farm & agri supply":["फार्म व कृषि आपूर्ति","फार्म व शेती पुरवठा"],
"Agricultural produce and goods from the Green Mart network — quality-checked, fairly priced, quality-focused operations (ISO certification applied for). Ask us what's in season.":["ग्रीन मार्ट नेटवर्क से कृषि उपज व सामान — गुणवत्ता-जांचा हुआ, उचित दाम। सीज़न में क्या है, हमसे पूछें।","ग्रीन मार्ट नेटवर्कमधून शेती उत्पादने — गुणवत्ता-तपासलेली, योग्य दरात. सीझनमध्ये काय आहे ते विचारा."],
"Ask for current list":["वर्तमान सूची पूछें","सध्याची यादी विचारा"],
/* rates */
"Updated regularly":["नियमित अपडेट","नियमित अपडेट"],
"Indicative Rates":["अनुमानित रेट","अंदाजे दर"],
"Product / Size":["उत्पाद / साइज़","उत्पादन / साईझ"],
"Unit":["इकाई","एकक"],
"Rate":["रेट","दर"],
"per kg":["प्रति किलो","प्रति किलो"],
"per pack":["प्रति पैक","प्रति पॅक"],
"Launching soon":["जल्द आ रहा है","लवकरच येत आहे"],
"Ask on WhatsApp":["WhatsApp पर पूछें","WhatsApp वर विचारा"],
"Get today's confirmed rate":["आज का पक्का रेट पाएं","आजचा नक्की दर मिळवा"],
/* spotlight */
"Green Mart Frozen Basa Fillet":["ग्रीन मार्ट फ्रोज़न बासा फ़िलेट","ग्रीन मार्ट फ्रोझन बासा फिलेट"],
"Boneless, skinless white fillet — blast-frozen fresh the same day, never months-old import. Pure Protein. Light on Calories.":["बिना कांटे की सफेद फ़िलेट — उसी दिन ताज़ा ब्लास्ट-फ्रोज़न, महीनों पुराना इम्पोर्ट नहीं। शुद्ध प्रोटीन, कम कैलोरी।","काटे नसलेले पांढरे फिलेट — त्याच दिवशी ताजे ब्लास्ट-फ्रोझन, जुना आयात माल नाही. शुद्ध प्रोटीन, कमी कॅलरी."],
"protein per 500g pack":["प्रोटीन प्रति 500ग्रा पैक","प्रोटीन प्रति ५००ग्रॅ पॅक"],
"Selenium + B12":["सेलेनियम + B12","सेलेनियम + B12"],
"natural source":["प्राकृतिक स्रोत","नैसर्गिक स्रोत"],
"unbroken cold chain":["अटूट कोल्ड चेन","अखंड कोल्ड चेन"],
"certified & traceable":["प्रमाणित व ट्रेसेबल","प्रमाणित व ट्रेसेबल"],
"🔔 Notify me on launch":["🔔 लॉन्च पर बताएं","🔔 लाँचला कळवा"],
"Pack photo coming soon":["पैक फोटो जल्द","पॅक फोटो लवकरच"],
"250g & 500g retail packs · 5kg/10kg bulk":["250ग्रा व 500ग्रा पैक · 5/10 किलो बल्क","२५०ग्रॅ व ५००ग्रॅ पॅक · ५/१० किलो बल्क"],
/* certs */
"Why buyers trust us":["खरीदार हम पर भरोसा क्यों करते हैं","खरेदीदार आमच्यावर विश्वास का ठेवतात"],
"Quality management — consistent processes from farm to dispatch.":["गुणवत्ता प्रबंधन — फार्म से डिस्पैच तक एक जैसी प्रक्रिया।","गुणवत्ता व्यवस्थापन — फार्मपासून डिस्पॅचपर्यंत सातत्यपूर्ण प्रक्रिया."],
"Environmental management — responsible, eco-friendly aquaculture.":["पर्यावरण प्रबंधन — ज़िम्मेदार, पर्यावरण-हितैषी मछली पालन।","पर्यावरण व्यवस्थापन — जबाबदार, पर्यावरणपूरक मत्स्यपालन."],
"Food safety — hazard-controlled handling & hygiene at every step.":["खाद्य सुरक्षा — हर कदम पर नियंत्रित हैंडलिंग व स्वच्छता।","अन्न सुरक्षा — प्रत्येक टप्प्यावर नियंत्रित हाताळणी व स्वच्छता."],
"Farm-Direct":["फार्म-डायरेक्ट","फार्म-डायरेक्ट"],
"Our own fish, our own farm. No middlemen, no mystery stock.":["हमारी मछली, हमारा फार्म। कोई बिचौलिया नहीं।","आमचे मासे, आमचे फार्म. मधले दलाल नाहीत."],
/* flow */
"Simple & personal":["सरल व व्यक्तिगत","सोपे व वैयक्तिक"],
"How ordering works":["ऑर्डर कैसे होता है","ऑर्डर कसे होते"],
"Send your requirement":["अपनी ज़रूरत भेजें","तुमची गरज पाठवा"],
"Fill the quick form below — product, quantity, location.":["नीचे फॉर्म भरें — उत्पाद, मात्रा, स्थान।","खालील फॉर्म भरा — उत्पादन, प्रमाण, ठिकाण."],
"We connect on WhatsApp":["WhatsApp पर जुड़ें","WhatsApp वर जोडले जाऊ"],
"Your enquiry opens straight in WhatsApp. We confirm today's rate, sizes & delivery with you personally.":["आपकी पूछताछ सीधे WhatsApp में खुलती है। हम रेट, साइज़ व डिलीवरी आपसे तय करते हैं।","तुमची चौकशी थेट WhatsApp मध्ये उघडते. दर, साईझ व डिलिव्हरी आम्ही तुमच्याशी ठरवतो."],
"Pay securely":["सुरक्षित भुगतान","सुरक्षित पेमेंट"],
"Once confirmed, we send a secure Razorpay payment link — UPI, card or net banking.":["कन्फर्म होने पर हम Razorpay पेमेंट लिंक भेजते हैं — UPI, कार्ड या नेट बैंकिंग।","कन्फर्म झाल्यावर आम्ही Razorpay पेमेंट लिंक पाठवतो — UPI, कार्ड किंवा नेट बँकिंग."],
"Fresh delivery":["ताज़ी डिलीवरी","ताजी डिलिव्हरी"],
"Iced fresh or frozen at −18°C — delivered on schedule with honest weight.":["बर्फ में ताज़ा या −18°C फ्रोज़न — समय पर, ईमानदार वजन के साथ।","बर्फात ताजे किंवा −१८°C फ्रोझन — वेळेवर, प्रामाणिक वजनासह."],
/* b2b */
"For businesses":["व्यवसायों के लिए","व्यवसायांसाठी"],
"Bulk & regular supply":["थोक व नियमित आपूर्ति","बल्क व नियमित पुरवठा"],
"Restaurants & Hotels":["रेस्टोरेंट व होटल","रेस्टॉरंट व हॉटेल"],
"Retailers & Stores":["रिटेलर व स्टोर","रिटेलर व स्टोअर"],
"Whole fresh fish or branded frozen fillet packs with healthy retail margins. Freezer stock support.":["साबुत ताज़ी मछली या ब्रांडेड फ्रोज़न फ़िलेट पैक — अच्छे मार्जिन के साथ।","ताजे मासे किंवा ब्रँडेड फ्रोझन फिलेट पॅक — चांगल्या मार्जिनसह."],
"Wholesalers & Traders":["थोक विक्रेता व व्यापारी","होलसेलर व व्यापारी"],
"Farm-direct rates, size-graded lots, honest weight. Consistent weekly volume — no seasonal disappearing.":["फार्म-डायरेक्ट रेट, साइज़-ग्रेडेड माल, ईमानदार वजन। हर हफ्ते पक्की सप्लाई।","फार्म-डायरेक्ट दर, साईझ-ग्रेडेड माल, प्रामाणिक वजन. दर आठवड्याला खात्रीशीर पुरवठा."],
"Discuss regular supply":["नियमित आपूर्ति पर बात करें","नियमित पुरवठ्याबद्दल बोला"],
/* gallery */
"From our farm":["हमारे फार्म से","आमच्या फार्ममधून"],
"Photo gallery":["फोटो गैलरी","फोटो गॅलरी"],
"Fresh harvest — photo coming soon":["ताज़ी पकड़ — फोटो जल्द","ताजी काढणी — फोटो लवकरच"],
"Fillet packs — photo coming soon":["फ़िलेट पैक — फोटो जल्द","फिलेट पॅक — फोटो लवकरच"],
"Cold chain — photo coming soon":["कोल्ड चेन — फोटो जल्द","कोल्ड चेन — फोटो लवकरच"],
"Our team — photo coming soon":["हमारी टीम — फोटो जल्द","आमची टीम — फोटो लवकरच"],
"Delivery — photo coming soon":["डिलीवरी — फोटो जल्द","डिलिव्हरी — फोटो लवकरच"],
/* about */
"Our story":["हमारी कहानी","आमची कहाणी"],
"A family business, built on trust":["भरोसे पर बना पारिवारिक व्यवसाय","विश्वासावर उभा कौटुंबिक व्यवसाय"],
"Green Mart is a family-run business from Nagpur, Maharashtra — working in agriculture, fisheries and goods since 2017. What started as a local venture has grown into a dedicated aquaculture operation raising Pangasius (Basa) in our own farm.":["ग्रीन मार्ट नागपुर का पारिवारिक व्यवसाय है — 2017 से कृषि, मत्स्य व सामान में। स्थानीय शुरुआत से आज हमारा अपना प्रमाणित मछली पालन फार्म है।","ग्रीन मार्ट हा नागपूरचा कौटुंबिक व्यवसाय आहे — २०१७ पासून शेती, मत्स्यव्यवसाय व वस्तूंमध्ये कार्यरत. स्थानिक सुरुवातीपासून आज आमचे स्वतःचे प्रमाणित मत्स्यपालन फार्म आहे."],
"Now we're taking the next step — bringing locally processed, blast-frozen Basa fillet to Nagpur's stores and homes, so you never have to settle for months-old imported stock again.":["अब अगला कदम — स्थानीय स्तर पर प्रोसेस की गई, ताज़ा ब्लास्ट-फ्रोज़न बासा फ़िलेट नागपुर की दुकानों व घरों तक।","आता पुढचे पाऊल — स्थानिक पातळीवर प्रक्रिया केलेले, ताजे ब्लास्ट-फ्रोझन बासा फिलेट नागपूरच्या दुकानांत व घरांत."],
"started":["शुरुआत","सुरुवात"],
"certifications":["प्रमाणपत्र","प्रमाणपत्रे"],
"farm-direct":["फार्म-डायरेक्ट","फार्म-डायरेक्ट"],
"Family / farm photo coming soon":["परिवार / फार्म फोटो जल्द","कुटुंब / फार्म फोटो लवकरच"],
/* testimonials */
"What buyers say":["खरीदार क्या कहते हैं","खरेदीदार काय म्हणतात"],
"Trusted by businesses":["व्यवसायों का भरोसा","व्यवसायांचा विश्वास"],
"Consistent size and honest weight, every single time. Supply never breaks even in season rush.":["हर बार एक जैसा साइज़ और ईमानदार वजन। सीज़न में भी सप्लाई नहीं रुकती।","प्रत्येक वेळी सारखा साईझ आणि प्रामाणिक वजन. सीझनमध्येही पुरवठा थांबत नाही."],
"Wholesale trader":["थोक व्यापारी","होलसेल व्यापारी"],
"Nagpur fish market":["नागपुर मछली बाज़ार","नागपूर मासळी बाजार"],
"Fresh maal, iced properly, delivered on our schedule. Certification papers were a plus for our kitchen audit.":["ताज़ा माल, सही बर्फ में, हमारे समय पर। किचन ऑडिट के लिए प्रमाणपत्र बड़ा फायदा।","ताजा माल, योग्य बर्फात, आमच्या वेळेवर. किचन ऑडिटसाठी प्रमाणपत्रे मोठा फायदा."],
"Restaurant kitchen head":["रेस्टोरेंट किचन हेड","रेस्टॉरंट किचन हेड"],
"Nagpur":["नागपुर","नागपूर"],
"Farm-direct rate with no middleman drama. WhatsApp order to delivery is smooth.":["बिना बिचौलिए के फार्म-डायरेक्ट रेट। WhatsApp ऑर्डर से डिलीवरी तक आसान।","मधल्या दलालाशिवाय फार्म-डायरेक्ट दर. WhatsApp ऑर्डर ते डिलिव्हरी सोपे."],
"Retail fish shop owner":["रिटेल मछली दुकान मालिक","रिटेल मासळी दुकान मालक"],
/* faq */
"Good to know":["जानने योग्य","जाणून घ्या"],
"Common questions":["आम सवाल","सामान्य प्रश्न"],
"What is the minimum order?":["न्यूनतम ऑर्डर कितना है?","किमान ऑर्डर किती?"],
"For businesses, bulk starts around 20–50 kg (negotiable). Home customers can order retail fillet packs once launched — enquire on WhatsApp for current minimums.":["व्यवसायों के लिए बल्क 20–50 किलो से (बातचीत संभव)। घरेलू ग्राहक लॉन्च के बाद पैक ऑर्डर कर सकेंगे — WhatsApp पर पूछें।","व्यवसायांसाठी बल्क २०–५० किलोपासून (चर्चा शक्य). घरगुती ग्राहक लाँचनंतर पॅक ऑर्डर करू शकतील — WhatsApp वर विचारा."],
"Which areas do you deliver to?":["आप कहां डिलीवर करते हैं?","तुम्ही कुठे डिलिव्हर करता?"],
"Nagpur city and surrounding region for fresh/live fish. Frozen fillet supply will expand wider as we grow — tell us your location on WhatsApp and we'll confirm.":["ताज़ी/जीवित मछली के लिए नागपुर व आसपास। फ्रोज़न फ़िलेट धीरे-धीरे और आगे — WhatsApp पर अपना स्थान बताएं।","ताज्या/जिवंत माशांसाठी नागपूर व परिसर. फ्रोझन फिलेट हळूहळू पुढे — WhatsApp वर तुमचे ठिकाण सांगा."],
"How do payments work?":["भुगतान कैसे होता है?","पेमेंट कसे होते?"],
"After we confirm your order and rate on WhatsApp, we send a secure Razorpay payment link — pay by UPI, card or net banking. Regular business buyers can discuss terms with us.":["WhatsApp पर ऑर्डर व रेट कन्फर्म होने के बाद हम Razorpay लिंक भेजते हैं — UPI, कार्ड या नेट बैंकिंग। नियमित व्यापारी शर्तों पर बात कर सकते हैं।","WhatsApp वर ऑर्डर व दर कन्फर्म झाल्यावर आम्ही Razorpay लिंक पाठवतो — UPI, कार्ड किंवा नेट बँकिंग. नियमित व्यापारी अटींवर बोलू शकतात."],
"How do you maintain freshness?":["ताज़गी कैसे बनाए रखते हैं?","ताजेपणा कसा राखता?"],
"Fresh fish moves iced the same day. Frozen fillet is blast-frozen fresh and held at −18°C with an unbroken cold chain till delivery — never thawed and refrozen.":["ताज़ी मछली उसी दिन बर्फ में जाती है। फ्रोज़न फ़िलेट ताज़ा ब्लास्ट-फ्रोज़न होकर −18°C पर रहती है — कभी पिघलाकर दोबारा फ्रीज़ नहीं।","ताजे मासे त्याच दिवशी बर्फात जातात. फ्रोझन फिलेट ताजे ब्लास्ट-फ्रोझन होऊन −१८°C वर राहते — कधीही वितळवून पुन्हा फ्रीझ नाही."],
"Are you really certified?":["क्या आप सच में प्रमाणित हैं?","तुम्ही खरंच प्रमाणित आहात का?"],
/* order form */
"Tell us what you need":["बताएं आपको क्या चाहिए","तुम्हाला काय हवे ते सांगा"],
"Fish rates change daily and bulk orders deserve a real conversation — so we finalise everything personally on WhatsApp before you pay a rupee.":["मछली के रेट रोज़ बदलते हैं और बल्क ऑर्डर के लिए बातचीत ज़रूरी है — इसलिए भुगतान से पहले सब कुछ WhatsApp पर तय होता है।","माशांचे दर रोज बदलतात आणि बल्क ऑर्डरसाठी संवाद गरजेचा — म्हणून पेमेंटआधी सर्व WhatsApp वर ठरते."],
"No advance needed to enquire — rate first, decide after":["पूछताछ के लिए एडवांस नहीं — पहले रेट, फिर फैसला","चौकशीसाठी ॲडव्हान्स नाही — आधी दर, मग निर्णय"],
"Bulk & regular-supply pricing for businesses":["व्यवसायों के लिए बल्क व नियमित रेट","व्यवसायांसाठी बल्क व नियमित दर"],
"Secure payment via Razorpay link after confirmation":["कन्फर्मेशन के बाद Razorpay लिंक से सुरक्षित भुगतान","कन्फर्मेशननंतर Razorpay लिंकने सुरक्षित पेमेंट"],
"Replies fastest 8 AM – 9 PM, all days":["सबसे तेज़ जवाब सुबह 8 – रात 9, सभी दिन","सर्वात जलद उत्तर सकाळी ८ – रात्री ९, सर्व दिवस"],
"Product":["उत्पाद","उत्पादन"],
"Quantity":["मात्रा","प्रमाण"],
"You are a…":["आप हैं…","तुम्ही आहात…"],
"Restaurant / Hotel":["रेस्टोरेंट / होटल","रेस्टॉरंट / हॉटेल"],
"Retailer / Store":["रिटेलर / दुकान","रिटेलर / दुकान"],
"Wholesaler / Trader":["थोक विक्रेता / व्यापारी","होलसेलर / व्यापारी"],
"Home customer":["घरेलू ग्राहक","घरगुती ग्राहक"],
"Other":["अन्य","इतर"],
"Your name":["आपका नाम","तुमचे नाव"],
"Delivery location":["डिलीवरी स्थान","डिलिव्हरी ठिकाण"],
"Anything else?":["और कुछ?","आणखी काही?"],
"(optional)":["(वैकल्पिक)","(ऐच्छिक)"],
"Send enquiry on WhatsApp":["WhatsApp पर पूछताछ भेजें","WhatsApp वर चौकशी पाठवा"],
"Opens WhatsApp with your enquiry pre-typed — nothing sends until you press send.":["आपकी पूछताछ WhatsApp में पहले से लिखी खुलती है — भेजें दबाने तक कुछ नहीं जाता।","तुमची चौकशी WhatsApp मध्ये आधीच लिहिलेली उघडते — पाठवा दाबेपर्यंत काही जात नाही."],
"Fresh Fish — Pangas / Rohu / Katla":["ताज़ी मछली — पंगास / रोहू / कतला","ताजे मासे — पंगास / रोहू / कतला"],
"Fresh Rohu — size-graded":["ताज़ा रोहू — साइज़ अनुसार","ताजे रोहू — साईझनुसार"],
"Fresh Katla — size-graded":["ताज़ा कतला — साइज़ अनुसार","ताजे कतला — साईझनुसार"],
"Frozen Basa Fillet (250g / 500g packs)":["फ्रोज़न बासा फ़िलेट (250/500ग्रा पैक)","फ्रोझन बासा फिलेट (२५०/५००ग्रॅ पॅक)"],
"Frozen Fillet — bulk boxes (5kg/10kg)":["फ्रोज़न फ़िलेट — बल्क (5/10 किलो)","फ्रोझन फिलेट — बल्क (५/१० किलो)"],
"Live Pangas fish":["जीवित पंगास मछली","जिवंत पंगास मासे"],
"Other / multiple items":["अन्य / कई आइटम","इतर / अनेक वस्तू"],
/* footer + misc */
"Quick links":["त्वरित लिंक","द्रुत दुवे"],
"Contact":["संपर्क","संपर्क"],
"WhatsApp us":["WhatsApp करें","WhatsApp करा"],
"Call us":["कॉल करें","कॉल करा"],
"Nagpur, Maharashtra":["नागपुर, महाराष्ट्र","नागपूर, महाराष्ट्र"],
"All rights reserved.":["सर्वाधिकार सुरक्षित।","सर्व हक्क राखीव."],
"Last updated:":["अंतिम अपडेट:","शेवटचे अपडेट:"],
"Today":["आज","आज"],
"LAUNCHING SOON":["जल्द आ रहा है","लवकरच"]
};

const IDX = {hi:0, mr:1};
let originals = null;   // [node, originalText]
let phOriginals = null; // [el, originalPlaceholder]

function collect(){
  originals = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n){
      const p = n.parentElement;
      if(!p || ["SCRIPT","STYLE"].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  let n; while(n = walker.nextNode()) originals.push([n, n.nodeValue]);
  phOriginals = [];
  document.querySelectorAll("[placeholder]").forEach(el => phOriginals.push([el, el.placeholder]));
}

function setLang(lang){
  if(!originals) collect();
  const i = IDX[lang];
  originals.forEach(([node, orig]) => {
    if(lang === "en"){ node.nodeValue = orig; return; }
    const t = orig.trim();
    if(D[t] && D[t][i]) node.nodeValue = orig.replace(t, D[t][i]);
    else node.nodeValue = orig;
  });
  phOriginals.forEach(([el, orig]) => {
    if(lang === "en"){ el.placeholder = orig; return; }
    const t = orig.trim();
    el.placeholder = (D[t] && D[t][IDX[lang]]) ? D[t][IDX[lang]] : orig;
  });
  document.documentElement.lang = lang === "en" ? "en" : (lang === "hi" ? "hi" : "mr");
}

const sel = document.getElementById("langSel");
if(sel) sel.addEventListener("change", () => setLang(sel.value));
})();

/* ── Delivery estimator ── */
function estimate(){
  const zone = document.getElementById("d-zone").value;
  const wt = parseFloat(document.getElementById("d-wt").value) || 0;
  const out = document.getElementById("d-out");
  if(wt <= 0){ document.getElementById("d-wt").classList.add("invalid"); toast("Enter order quantity in kg.", "err"); return; }
  let cost, note="";
  if(zone==="city"){ cost = wt>=50 ? "FREE" : "₹80"; note = wt>=50 ? "Free — order is 50 kg+" : "Free on 50 kg+ orders"; }
  else if(zone==="out"){ cost = wt>=200 ? "FREE" : "₹150"; note = wt>=200 ? "Free — order is 200 kg+" : "Flat rate · free on 200 kg+"; }
  else if(zone==="near"){ cost = "₹" + Math.max(300, Math.round(wt*4)); note = "₹4/kg, minimum ₹300"; }
  else { cost = "Quote on WhatsApp"; note = "Insulated/reefer transport — we'll quote for your city"; }
  const zoneName = document.getElementById("d-zone").selectedOptions[0].text;
  out.classList.add("show");
  out.innerHTML = "";
  const b = document.createElement("b");
  b.textContent = cost;
  out.appendChild(b);
  out.appendChild(document.createTextNode(note));
  out.appendChild(document.createElement("br"));
  const btn = document.createElement("button");
  btn.className = "btn btn-wa";
  btn.style.cssText = "margin-top:12px;padding:10px 18px;font-size:.88rem";
  btn.textContent = "Confirm on WhatsApp";
  btn.addEventListener("click", () => confirmDeliv(zoneName, wt, cost));
  out.appendChild(btn);
}
function confirmDeliv(zone, wt, cost){
  const msg = `Hi Green Mart! Delivery estimate confirm karna hai 🚚\n\n*Area:* ${zone}\n*Quantity:* ${wt} kg\n*Estimated delivery:* ${cost}\n\nPlease confirm rate + delivery for my exact location.`;
  window.open(waLink(msg), "_blank", "noopener,noreferrer");
}
/* ── Wholesale enquiry ── */
function wsEnquiry(){
  const biz = document.getElementById("w-biz").value.trim();
  const contact = document.getElementById("w-contact").value.trim();
  const mobile = document.getElementById("w-mobile").value.trim();
  const type = document.getElementById("w-type").value;
  const prod = document.getElementById("w-prod").value;
  const size = document.getElementById("w-size").value.trim();
  const vol = document.getElementById("w-vol").value.trim();
  const freq = document.getElementById("w-freq").value;
  const city = document.getElementById("w-city").value.trim();
  const notes = document.getElementById("w-notes").value.trim();
  if(!validate(["w-biz","w-contact","w-mobile","w-vol","w-city"])){ toast("Please fill business name, contact person, mobile, quantity and city.", "err"); return; }
  toast("Opening WhatsApp — wholesale enquiry ready ✅", "ok");
  let msg = `Hello Green Mart,\nI'd like a wholesale quotation.\n\n*Business:* ${biz}\n*Contact person:* ${contact}\n*Mobile:* ${mobile}\n*Business type:* ${type}\n*Product:* ${prod}`;
  if(size) msg += `\n*Preferred size:* ${size}`;
  msg += `\n*Approx. quantity:* ${vol}\n*Frequency:* ${freq}\n*Location:* ${city}`;
  if(notes) msg += `\n*Additional requirements:* ${notes}`;
  window.open(waLink(msg), "_blank", "noopener,noreferrer");
}
/* hero direct WA */
const hw = document.getElementById("heroWa");
if(hw) hw.href = waLink("Hi Green Mart! I want today's rate 🐟");

/* ── Toasts ── */
function toast(msg, type){
  const w = document.getElementById("toasts");
  const t = document.createElement("div");
  t.className = "toast " + (type||"");
  t.textContent = msg;
  w.appendChild(t);
  setTimeout(()=>{ t.style.opacity="0"; t.style.transition="opacity .4s"; setTimeout(()=>t.remove(),400); }, 3200);
}
/* ── Inline validation helper ── */
function validate(ids){
  let ok = true;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el && !el.value.trim()){ el.classList.add("invalid"); ok = false; }
    else if(el){ el.classList.remove("invalid"); }
  });
  return ok;
}
document.addEventListener("input", e => { if(e.target.classList) e.target.classList.remove("invalid"); });

/* ── Today's availability (edit here daily) ── */
CONFIG.availability = [            // 👈 true = available, false = not today
  ["Pangas", true],
  ["Rohu", true],
  ["Katla", true],
  ["Mrigal", true],
  ["Tilapia", true],
  ["Murrel", false]
];
(function(){
  const box = document.getElementById("availInner");
  CONFIG.availability.forEach(([name, ok]) => {
    const s = document.createElement("span");
    s.className = "avail-item";
    s.textContent = (ok ? "✅ " : "❌ ") + name;
    box.appendChild(s);
  });
})();

/* ── Bulk calculator (edit avg rates here) ── */
CONFIG.bulkRates = {               // 👈 indicative avg ₹/kg — update with market
  "Pangas (Basa)": 125,
  "Rohu": 160,
  "Katla": 180,
  "Mrigal": 140,
  "Tilapia": 110,
  "Common Carp": 120,
  "Bangda (Indian Mackerel)": 150,
  "Rawas (Indian Salmon)": 350,
  "Shilang": 200
};
(function(){
  const sel = document.getElementById("c-sp");
  if(!sel) return;
  Object.keys(CONFIG.bulkRates).forEach(k => {
    const o = document.createElement("option"); o.value = k; o.textContent = k; sel.appendChild(o);
  });
})();
function bulkCalc(){
  const sp = document.getElementById("c-sp").value;
  const kg = parseFloat(document.getElementById("c-kg").value) || 0;
  const out = document.getElementById("c-out");
  if(kg <= 0){ document.getElementById("c-kg").classList.add("invalid"); toast("Enter quantity in kg.","err"); return; }
  const rate = CONFIG.bulkRates[sp];
  const total = Math.round(rate * kg);
  out.classList.add("show");
  out.innerHTML = "";
  const b = document.createElement("b");
  b.textContent = `≈ ₹${total.toLocaleString("en-IN")}`;
  out.appendChild(b);
  out.appendChild(document.createTextNode(`${sp} · ${kg} kg × avg ₹${rate}/kg`));
  out.appendChild(document.createElement("br"));
  const btn = document.createElement("button");
  btn.className = "btn btn-wa";
  btn.style.cssText = "margin-top:12px;padding:10px 18px;font-size:.88rem";
  btn.textContent = "Confirm rate on WhatsApp";
  btn.addEventListener("click", () => confirmBulk(sp, kg, total));
  out.appendChild(btn);
}
function confirmBulk(sp, kg, total){
  const msg = `Hi Green Mart! Bulk order estimate confirm karna hai 🐟\n\n*Species:* ${sp}\n*Quantity:* ${kg} kg\n*Estimated:* ≈ ₹${total.toLocaleString("en-IN")}\n\nPlease confirm today's actual rate & size grades.`;
  window.open(waLink(msg), "_blank", "noopener,noreferrer");
  toast("Opening WhatsApp ✅","ok");
}
/* ── Reorder ── */
const rb = document.getElementById("reorderBtn");
if(rb) rb.href = waLink("Hi Green Mart! 🔁 Repeat my usual order please — confirm today's rate.");

/* ══ LIVE DATA FROM GOOGLE SHEET — rates load handled above when sheetCsvUrl is set ══ */

/* ── Wire up buttons (moved off inline onclick= for CSP compliance) ── */
document.querySelectorAll("[data-order]").forEach(btn => {
  btn.addEventListener("click", () => orderProduct(btn.dataset.order));
});
const bulkCalcBtn = document.getElementById("btn-bulk-calc");
if(bulkCalcBtn) bulkCalcBtn.addEventListener("click", bulkCalc);
const deliveryEstBtn = document.getElementById("btn-delivery-estimate");
if(deliveryEstBtn) deliveryEstBtn.addEventListener("click", estimate);
const wholesaleBtn = document.getElementById("btn-wholesale-enquiry");
if(wholesaleBtn) wholesaleBtn.addEventListener("click", wsEnquiry);
