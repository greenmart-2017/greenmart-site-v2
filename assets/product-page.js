document.getElementById("hamburger").addEventListener("click", function(){
  document.getElementById("mobileMenu").classList.toggle("show");
  this.classList.toggle("open");
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

/* ── Language translator (EN/HI/MR) — see /assets/product-i18n.js ── */
