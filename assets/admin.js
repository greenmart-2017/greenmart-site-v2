(function(){
  "use strict";

  let sessionToken = "";
  let retrySaveAfterLogin = false;
  let dirty = false;
  let saving = false;
  let loggingIn = false;

  const loginScreen = document.getElementById("login-screen");
  const editorScreen = document.getElementById("editor-screen");
  const saveBar = document.getElementById("save-bar");
  const loginForm = document.getElementById("login-form");
  const loginBtn = document.getElementById("login-btn");
  const loginError = document.getElementById("login-error");
  const passwordInput = document.getElementById("password");
  const pwToggle = document.getElementById("pw-toggle");
  const saveBtn = document.getElementById("save-btn");
  const dirtyLabel = document.getElementById("dirty-label");
  const lastSavedEl = document.getElementById("last-saved");
  const toasts = document.getElementById("toasts");

  function toast(msg, type){
    const t = document.createElement("div");
    t.className = "toast " + (type || "");
    t.textContent = msg;
    toasts.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  function setDirty(on){
    dirty = on;
    saveBar.classList.toggle("is-dirty", on);
    dirtyLabel.textContent = on ? "Unsaved changes" : "";
    dirtyLabel.className = on ? "unsaved" : "";
    if(!saving){
      saveBtn.textContent = on ? "Save changes" : "Save changes";
    }
  }

  function showLogin(message){
    loginScreen.classList.remove("hidden");
    editorScreen.classList.add("hidden");
    saveBar.classList.add("hidden");
    loginError.textContent = message || "";
    passwordInput.value = "";
    passwordInput.focus();
  }

  function showEditor(){
    loginScreen.classList.add("hidden");
    editorScreen.classList.remove("hidden");
    saveBar.classList.remove("hidden");
  }

  pwToggle.addEventListener("click", () => {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    pwToggle.setAttribute("aria-pressed", show ? "true" : "false");
    pwToggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    document.getElementById("icon-eye").classList.toggle("hidden", show);
    document.getElementById("icon-eye-off").classList.toggle("hidden", !show);
  });

  function setLoginLoading(on){
    loggingIn = on;
    loginBtn.disabled = on;
    loginBtn.textContent = "";
    if(on){
      const spin = document.createElement("span");
      spin.className = "spin";
      spin.setAttribute("aria-hidden", "true");
      loginBtn.appendChild(spin);
      loginBtn.appendChild(document.createTextNode("Signing in…"));
    } else {
      loginBtn.textContent = "Sign in";
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if(loggingIn) return;
    loginError.textContent = "";
    setLoginLoading(true);
    try{
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ password: passwordInput.value })
      });
      if(res.status === 429){
        loginError.textContent = "Too many attempts — try again in a few minutes";
        return;
      }
      if(!res.ok){
        loginError.textContent = "Incorrect password";
        return;
      }
      const data = await res.json();
      if(!data || typeof data.token !== "string"){
        loginError.textContent = "Incorrect password";
        return;
      }
      sessionToken = data.token;
      passwordInput.value = "";
      if(retrySaveAfterLogin){
        showEditor();
        retrySaveAfterLogin = false;
        await saveChanges();
        return;
      }
      await loadAndRender();
      showEditor();
    } catch {
      loginError.textContent = "Incorrect password";
    } finally {
      setLoginLoading(false);
    }
  });

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab").forEach(t => {
        const on = t === btn;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      ["rates","avail","bulk","zones"].forEach(name => {
        document.getElementById("panel-" + name).classList.toggle("hidden", name !== id);
      });
    });
  });

  function el(tag, attrs, text){
    const node = document.createElement(tag);
    if(attrs){
      Object.keys(attrs).forEach(k => node.setAttribute(k, attrs[k]));
    }
    if(text != null) node.textContent = text;
    return node;
  }

  function inrInput(attrs){
    const wrap = el("div", { class: "inr" });
    wrap.appendChild(el("span", { class: "inr-pre" }, "₹"));
    const input = el("input", attrs);
    wrap.appendChild(input);
    return { wrap, input };
  }

  function deleteBtn(){
    return el("button", { type: "button", class: "btn btn-danger", "data-del": "1" }, "Delete");
  }

  function confirmDelete(){
    return window.confirm("Delete this row? This stays until you save.");
  }

  function bindDirty(root){
    root.addEventListener("input", () => setDirty(true));
    root.addEventListener("change", () => setDirty(true));
  }

  bindDirty(editorScreen);

  function updateCounts(){
    const rc = document.querySelectorAll("#rates-list .row").length;
    const ac = document.querySelectorAll("#avail-list .row").length;
    const bc = document.querySelectorAll("#bulk-list .row").length;
    document.getElementById("count-rates").textContent = rc + (rc === 1 ? " rate" : " rates");
    document.getElementById("count-avail").textContent = ac + (ac === 1 ? " item" : " items");
    document.getElementById("count-bulk").textContent = bc + (bc === 1 ? " species" : " species");
    document.getElementById("count-zones").textContent = "3 zones";
  }

  function addRateRow(desc, unit, price, focus){
    const list = document.getElementById("rates-list");
    const row = el("div", { class: "row" });
    const top = el("div", { class: "row-top" });
    const grow = el("div", { class: "grow" });
    const d = el("input", { type: "text", "data-f": "desc", maxlength: "200", placeholder: "Description" });
    d.value = desc || "";
    grow.appendChild(d);
    top.appendChild(grow);
    const del = deleteBtn();
    top.appendChild(del);
    row.appendChild(top);
    const grid = el("div", { class: "unit-price" });
    const u = el("input", { type: "text", "data-f": "unit", maxlength: "200", placeholder: "Unit" });
    u.value = unit || "per kg";
    grid.appendChild(u);
    const priceBox = inrInput({ type: "text", "data-f": "price", maxlength: "200", placeholder: "110–120 or Ask…" });
    let priceVal = price || "";
    if(priceVal.charAt(0) === "₹") priceVal = priceVal.slice(1);
    priceBox.input.value = priceVal;
    grid.appendChild(priceBox.wrap);
    row.appendChild(grid);
    del.addEventListener("click", () => {
      if(!confirmDelete()) return;
      row.remove();
      updateCounts();
      setDirty(true);
    });
    list.appendChild(row);
    updateCounts();
    if(focus) d.focus();
  }

  function addAvailRow(name, ok, focus){
    const list = document.getElementById("avail-list");
    const row = el("div", { class: "row avail-row" });
    const n = el("input", { type: "text", "data-f": "name", maxlength: "200", placeholder: "Species" });
    n.value = name || "";
    const sw = el("label", { class: "switch" });
    const c = el("input", { type: "checkbox", "data-f": "ok" });
    c.checked = !!ok;
    sw.appendChild(c);
    sw.appendChild(document.createTextNode("In stock"));
    const del = deleteBtn();
    row.appendChild(n);
    row.appendChild(sw);
    row.appendChild(del);
    del.addEventListener("click", () => {
      if(!confirmDelete()) return;
      row.remove();
      updateCounts();
      setDirty(true);
    });
    list.appendChild(row);
    updateCounts();
    if(focus) n.focus();
  }

  function addBulkRow(name, rate, focus){
    const list = document.getElementById("bulk-list");
    const row = el("div", { class: "row" });
    const top = el("div", { class: "row-top" });
    const grow = el("div", { class: "grow" });
    const n = el("input", { type: "text", "data-f": "name", maxlength: "200", placeholder: "Species" });
    n.value = name || "";
    grow.appendChild(n);
    top.appendChild(grow);
    const del = deleteBtn();
    top.appendChild(del);
    row.appendChild(top);
    const priceBox = inrInput({ type: "text", inputmode: "decimal", "data-f": "rate", maxlength: "12", placeholder: "125" });
    priceBox.input.value = rate == null ? "" : String(rate);
    const field = el("div", { class: "field" });
    field.appendChild(el("label", {}, "₹ per kg"));
    field.appendChild(priceBox.wrap);
    row.appendChild(field);
    del.addEventListener("click", () => {
      if(!confirmDelete()) return;
      row.remove();
      updateCounts();
      setDirty(true);
    });
    list.appendChild(row);
    updateCounts();
    if(focus) n.focus();
  }

  document.getElementById("add-rate").addEventListener("click", () => {
    addRateRow("", "per kg", "", true);
    setDirty(true);
  });
  document.getElementById("add-avail").addEventListener("click", () => {
    addAvailRow("", true, true);
    setDirty(true);
  });
  document.getElementById("add-bulk").addEventListener("click", () => {
    addBulkRow("", "", true);
    setDirty(true);
  });

  function fillZones(z){
    const city = (z && z.city) || {};
    const out = (z && z.out) || {};
    const near = (z && z.near) || {};
    document.getElementById("z-city-label").value = city.label || "";
    document.getElementById("z-city-free").value = city.freeAboveKg == null ? "" : String(city.freeAboveKg);
    document.getElementById("z-city-flat").value = city.flatRate == null ? "" : String(city.flatRate);
    document.getElementById("z-out-label").value = out.label || "";
    document.getElementById("z-out-free").value = out.freeAboveKg == null ? "" : String(out.freeAboveKg);
    document.getElementById("z-out-flat").value = out.flatRate == null ? "" : String(out.flatRate);
    document.getElementById("z-near-label").value = near.label || "";
    document.getElementById("z-near-per").value = near.perKgRate == null ? "" : String(near.perKgRate);
    document.getElementById("z-near-min").value = near.minRate == null ? "" : String(near.minRate);
  }

  function renderAll(data){
    document.getElementById("rates-list").textContent = "";
    document.getElementById("avail-list").textContent = "";
    document.getElementById("bulk-list").textContent = "";
    document.getElementById("rates-updated").value = data.ratesUpdated || "";
    (data.rates || []).forEach(r => addRateRow(r[0], r[1], r[2], false));
    (data.availability || []).forEach(r => addAvailRow(r[0], r[1], false));
    Object.keys(data.bulkRates || {}).forEach(k => addBulkRow(k, data.bulkRates[k], false));
    fillZones(data.deliveryZones);
    updateCounts();
    setDirty(false);
  }

  function numField(id){
    const raw = document.getElementById(id).value.trim();
    const n = Number(raw);
    return n;
  }

  function collectPayload(){
    const rates = [];
    document.querySelectorAll("#rates-list .row").forEach(row => {
      const desc = row.querySelector("[data-f=desc]").value.trim();
      const unit = row.querySelector("[data-f=unit]").value.trim();
      let price = row.querySelector("[data-f=price]").value.trim();
      if(price && price.charAt(0) !== "₹" && /[\d]/.test(price) && !/[A-Za-z]/.test(price)){
        price = "₹" + price;
      }
      rates.push([desc, unit, price]);
    });
    const availability = [];
    document.querySelectorAll("#avail-list .row").forEach(row => {
      availability.push([
        row.querySelector("[data-f=name]").value.trim(),
        row.querySelector("[data-f=ok]").checked
      ]);
    });
    const bulkRates = {};
    document.querySelectorAll("#bulk-list .row").forEach(row => {
      const name = row.querySelector("[data-f=name]").value.trim();
      const rate = Number(row.querySelector("[data-f=rate]").value.trim());
      bulkRates[name] = rate;
    });
    return {
      ratesUpdated: document.getElementById("rates-updated").value.trim(),
      rates,
      availability,
      bulkRates,
      deliveryZones: {
        city: {
          label: document.getElementById("z-city-label").value.trim(),
          freeAboveKg: numField("z-city-free"),
          flatRate: numField("z-city-flat")
        },
        out: {
          label: document.getElementById("z-out-label").value.trim(),
          freeAboveKg: numField("z-out-free"),
          flatRate: numField("z-out-flat")
        },
        near: {
          label: document.getElementById("z-near-label").value.trim(),
          perKgRate: numField("z-near-per"),
          minRate: numField("z-near-min")
        }
      }
    };
  }

  async function loadAndRender(){
    const res = await fetch("/api/shop-data", { cache: "no-store" });
    if(!res.ok) throw new Error("load");
    const data = await res.json();
    renderAll(data);
  }

  function setSaveLoading(on){
    saving = on;
    saveBtn.disabled = on;
    saveBtn.textContent = "";
    if(on){
      const spin = document.createElement("span");
      spin.className = "spin";
      spin.setAttribute("aria-hidden", "true");
      saveBtn.appendChild(spin);
      saveBtn.appendChild(document.createTextNode("Saving…"));
    } else {
      saveBtn.textContent = "Save changes";
    }
  }

  async function saveChanges(){
    if(saving) return;
    const payload = collectPayload();
    setSaveLoading(true);
    try{
      const res = await fetch("/api/shop-data", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + sessionToken
        },
        body: JSON.stringify(payload)
      });
      if(res.status === 401){
        sessionToken = "";
        retrySaveAfterLogin = true;
        toast("Your session expired — please log in again", "err");
        showLogin("Your session expired — please log in again");
        return;
      }
      if(res.status === 400){
        toast("Could not save — check that every field is filled and numbers look right. Your edits are still here.", "err");
        return;
      }
      if(!res.ok){
        toast("Could not save. Your edits are still here.", "err");
        return;
      }
      setDirty(false);
      const when = new Date();
      lastSavedEl.textContent = "Last saved: " + when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      toast("Saved — live on the site now", "ok");
    } catch {
      toast("Could not save. Your edits are still here.", "err");
    } finally {
      setSaveLoading(false);
    }
  }

  saveBtn.addEventListener("click", saveChanges);

  window.addEventListener("beforeunload", (e) => {
    if(!dirty) return;
    e.preventDefault();
    e.returnValue = "";
  });
})();
