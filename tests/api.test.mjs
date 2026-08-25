import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { handleLogin, handleShopData } from "../netlify/lib/handlers.js";
import { DEFAULT_SHOP_DATA } from "../netlify/lib/defaults.js";
import { MemoryStore } from "./memory-store.mjs";
import { secretsEqual, signSessionToken, verifySessionToken } from "../netlify/lib/crypto-utils.js";
import { LIMITS } from "../netlify/lib/validate.js";

const env = {
  adminPassword: "correct-horse-battery-staple-admin",
  sessionSecret: "another-long-random-session-secret-value"
};

function req(url, opts = {}) {
  return new Request(url, opts);
}

function ctx(ip = "203.0.113.10") {
  return { ip };
}

function stores() {
  return { shopStore: new MemoryStore(), limitsStore: new MemoryStore() };
}

async function jsonOf(res) {
  return res.json();
}

test("GET /api/shop-data returns only public fields and seeds defaults", async () => {
  const { shopStore, limitsStore } = stores();
  const res = await handleShopData(req("http://x/api/shop-data"), ctx(), { shopStore, limitsStore, env });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), null);
  const body = await jsonOf(res);
  assert.deepEqual(Object.keys(body).sort(), [
    "availability",
    "bulkRates",
    "deliveryZones",
    "rates",
    "ratesUpdated"
  ]);
  assert.equal(body.ratesUpdated, DEFAULT_SHOP_DATA.ratesUpdated);
  assert.equal(body.rates.length, DEFAULT_SHOP_DATA.rates.length);
  assert.equal(body.availability.length, DEFAULT_SHOP_DATA.availability.length);
});

test("GET does not leak extra blob fields", async () => {
  const { shopStore, limitsStore } = stores();
  await shopStore.setJSON("current", Object.assign({ secret: "nope", adminPassword: "x" }, DEFAULT_SHOP_DATA));
  const res = await handleShopData(req("http://x/api/shop-data"), ctx("198.51.100.2"), { shopStore, limitsStore, env });
  const body = await jsonOf(res);
  assert.equal("secret" in body, false);
  assert.equal("adminPassword" in body, false);
});

test("login rejects wrong password generically", async () => {
  const { shopStore, limitsStore } = stores();
  const res = await handleLogin(
    req("http://x/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong" })
    }),
    ctx(),
    { shopStore, limitsStore, env }
  );
  assert.equal(res.status, 401);
  const body = await jsonOf(res);
  assert.equal(body.error, "Unauthorized");
  assert.equal("password" in body, false);
  assert.equal("token" in body, false);
  const text = JSON.stringify(body);
  assert.equal(text.includes("wrong"), false);
  assert.equal(text.includes(env.adminPassword), false);
});

test("login returns signed token on success", async () => {
  const { limitsStore } = stores();
  const res = await handleLogin(
    req("http://x/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: env.adminPassword })
    }),
    ctx(),
    { limitsStore, env }
  );
  assert.equal(res.status, 200);
  const body = await jsonOf(res);
  assert.equal(typeof body.token, "string");
  assert.equal(body.token.includes(env.adminPassword), false);
  const verified = verifySessionToken(env.sessionSecret, body.token);
  assert.equal(verified.ok, true);
});

test("POST shop-data rejects missing/invalid/expired tokens", async () => {
  const { shopStore, limitsStore } = stores();
  const missing = await handleShopData(
    req("http://x/api/shop-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEFAULT_SHOP_DATA)
    }),
    ctx(),
    { shopStore, limitsStore, env }
  );
  assert.equal(missing.status, 401);

  const bad = await handleShopData(
    req("http://x/api/shop-data", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer not-a-real-token" },
      body: JSON.stringify(DEFAULT_SHOP_DATA)
    }),
    ctx(),
    { shopStore, limitsStore, env }
  );
  assert.equal(bad.status, 401);

  let now = 1_000_000;
  const login = await handleLogin(
    req("http://x/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: env.adminPassword })
    }),
    ctx("203.0.113.80"),
    { limitsStore, env, now: () => now, ttlMs: 1000 }
  );
  const { token } = await jsonOf(login);
  now = 1_000_000 + 1001;
  const expired = await handleShopData(
    req("http://x/api/shop-data", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(DEFAULT_SHOP_DATA)
    }),
    ctx(),
    { shopStore, limitsStore, env, now: () => now }
  );
  assert.equal(expired.status, 401);
});

test("5 failed logins lock the IP for 15 minutes even with the correct password", async () => {
  const { limitsStore } = stores();
  const ip = "192.0.2.55";
  for (let i = 0; i < 5; i++) {
    const res = await handleLogin(
      req("http://x/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "nope" })
      }),
      ctx(ip),
      { limitsStore, env }
    );
    assert.equal(res.status, 401);
  }
  const lockedWrong = await handleLogin(
    req("http://x/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "nope" })
    }),
    ctx(ip),
    { limitsStore, env }
  );
  assert.equal(lockedWrong.status, 429);
  const lockedRight = await handleLogin(
    req("http://x/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: env.adminPassword })
    }),
    ctx(ip),
    { limitsStore, env }
  );
  assert.equal(lockedRight.status, 429);
});

test("successful login resets the failure counter", async () => {
  const { limitsStore } = stores();
  const ip = "192.0.2.61";
  for (let i = 0; i < 4; i++) {
    await handleLogin(
      req("http://x/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "nope" })
      }),
      ctx(ip),
      { limitsStore, env }
    );
  }
  const ok = await handleLogin(
    req("http://x/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: env.adminPassword })
    }),
    ctx(ip),
    { limitsStore, env }
  );
  assert.equal(ok.status, 200);
  const fail = await handleLogin(
    req("http://x/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "nope" })
    }),
    ctx(ip),
    { limitsStore, env }
  );
  assert.equal(fail.status, 401);
});

test("GET is rate-limited per IP", async () => {
  const { shopStore, limitsStore } = stores();
  const ip = "198.51.100.9";
  let last;
  for (let i = 0; i < 61; i++) {
    last = await handleShopData(req("http://x/api/shop-data"), ctx(ip), { shopStore, limitsStore, env });
  }
  assert.equal(last.status, 429);
});

test("malformed and oversized save payloads are rejected with 400", async () => {
  const { shopStore, limitsStore } = stores();
  const login = await handleLogin(
    req("http://x/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: env.adminPassword })
    }),
    ctx("203.0.113.9"),
    { limitsStore, env }
  );
  const { token } = await jsonOf(login);
  const headers = { "Content-Type": "application/json", Authorization: "Bearer " + token };

  const extra = Object.assign({}, DEFAULT_SHOP_DATA, { sneaky: true });
  const extraRes = await handleShopData(
    req("http://x/api/shop-data", { method: "POST", headers, body: JSON.stringify(extra) }),
    ctx(),
    { shopStore, limitsStore, env }
  );
  assert.equal(extraRes.status, 400);

  const tooMany = Object.assign({}, DEFAULT_SHOP_DATA, {
    rates: Array.from({ length: LIMITS.MAX_RATES + 1 }, () => ["a", "b", "c"])
  });
  const bigRes = await handleShopData(
    req("http://x/api/shop-data", { method: "POST", headers, body: JSON.stringify(tooMany) }),
    ctx(),
    { shopStore, limitsStore, env }
  );
  assert.equal(bigRes.status, 400);

  const neg = structuredClone(DEFAULT_SHOP_DATA);
  neg.deliveryZones.city.flatRate = -80;
  const negRes = await handleShopData(
    req("http://x/api/shop-data", { method: "POST", headers, body: JSON.stringify(neg) }),
    ctx(),
    { shopStore, limitsStore, env }
  );
  assert.equal(negRes.status, 400);

  const huge = structuredClone(DEFAULT_SHOP_DATA);
  huge.deliveryZones.near.perKgRate = 9e12;
  const hugeRes = await handleShopData(
    req("http://x/api/shop-data", { method: "POST", headers, body: JSON.stringify(huge) }),
    ctx(),
    { shopStore, limitsStore, env }
  );
  assert.equal(hugeRes.status, 400);
});

test("valid save writes data and rolls backup history", async () => {
  const { shopStore, limitsStore } = stores();
  await handleShopData(req("http://x/api/shop-data"), ctx("203.0.113.1"), { shopStore, limitsStore, env });
  const login = await handleLogin(
    req("http://x/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: env.adminPassword })
    }),
    ctx("203.0.113.2"),
    { limitsStore, env }
  );
  const { token } = await jsonOf(login);
  const next = structuredClone(DEFAULT_SHOP_DATA);
  next.ratesUpdated = "22 Aug 2026";
  next.rates[0][2] = "₹999";
  const res = await handleShopData(
    req("http://x/api/shop-data", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(next)
    }),
    ctx(),
    { shopStore, limitsStore, env }
  );
  assert.equal(res.status, 200);
  const saved = await jsonOf(res);
  assert.equal(saved.ratesUpdated, "22 Aug 2026");
  assert.equal(saved.rates[0][2], "₹999");
  const prev1 = await shopStore.get("previous-1");
  assert.equal(prev1.ratesUpdated, DEFAULT_SHOP_DATA.ratesUpdated);
  assert.equal(prev1.rates[0][2], DEFAULT_SHOP_DATA.rates[0][2]);

  next.ratesUpdated = "23 Aug 2026";
  await handleShopData(
    req("http://x/api/shop-data", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(next)
    }),
    ctx(),
    { shopStore, limitsStore, env }
  );
  const prev2 = await shopStore.get("previous-2");
  assert.equal(prev2.ratesUpdated, DEFAULT_SHOP_DATA.ratesUpdated);
  const prev1b = await shopStore.get("previous-1");
  assert.equal(prev1b.ratesUpdated, "22 Aug 2026");
});

test("secretsEqual is timing-safe and token verify rejects tampering", () => {
  assert.equal(secretsEqual("abc", "abc"), true);
  assert.equal(secretsEqual("abc", "abd"), false);
  const { token } = signSessionToken(env.sessionSecret, 1_000);
  const parts = token.split(".");
  parts[2] = "0".repeat(parts[2].length);
  assert.equal(verifySessionToken(env.sessionSecret, parts.join("."), 1_000).ok, false);
});

test("no CORS headers helper and no secret comparison via === in lib", async () => {
  const files = [
    "netlify/lib/crypto-utils.js",
    "netlify/lib/handlers.js",
    "netlify/lib/http.js",
    "netlify/lib/validate.js",
    "netlify/lib/shop-store.js",
    "netlify/lib/rate-limit.js",
    "netlify/functions/auth-login.js",
    "netlify/functions/shop-data.js",
    "assets/admin.js",
    "assets/main.js"
  ];
  for (const f of files) {
    const src = await readFile(new URL("../" + f, import.meta.url), "utf8");
    assert.equal(src.includes("Access-Control-Allow-Origin"), false, f);
    assert.equal(src.includes("ADMIN_PASSWORD"), f.includes("handlers.js"));
  }
  const handlers = await readFile(new URL("../netlify/lib/handlers.js", import.meta.url), "utf8");
  assert.match(handlers, /secretsEqual\(password, adminPassword\)/);
  assert.doesNotMatch(handlers, /adminPassword\s*===/);
  assert.doesNotMatch(handlers, /sessionSecret\s*===/);
  const cryptoSrc = await readFile(new URL("../netlify/lib/crypto-utils.js", import.meta.url), "utf8");
  assert.match(cryptoSrc, /timingSafeEqual/);
  assert.match(cryptoSrc, /secretsEqual\(sig/);
});

test("admin.html is noindex and admin.js has no innerHTML interpolation", async () => {
  const html = await readFile(new URL("../admin.html", import.meta.url), "utf8");
  assert.match(html, /noindex,\s*nofollow/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /\son\w+=/);
  const js = await readFile(new URL("../assets/admin.js", import.meta.url), "utf8");
  assert.equal(js.includes("innerHTML"), false);
  assert.equal(js.includes("localStorage"), false);
  assert.equal(js.includes("sessionStorage"), false);
});
