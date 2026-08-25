import { secretsEqual, signSessionToken, verifySessionToken, bearerToken } from "./crypto-utils.js";
import { json, clientIp } from "./http.js";
import { validateShopPayload } from "./validate.js";
import { ensureCurrent, writeCurrent, toPublicShopData, getShopStore, getLimitsStore } from "./shop-store.js";
import {
  checkLoginLock,
  recordLoginFailure,
  resetLoginFailures,
  checkGetRate
} from "./rate-limit.js";

function envSecrets() {
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const sessionSecret = process.env.SESSION_SECRET || "";
  return { adminPassword, sessionSecret };
}

function secretsConfigured(adminPassword, sessionSecret) {
  return adminPassword.length > 0 && sessionSecret.length > 0;
}

export async function handleLogin(req, context, deps = {}) {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const ip = clientIp(req, context);
  const limits = deps.limitsStore || getLimitsStore();
  const now = deps.now ? deps.now() : Date.now();

  try {
    const lock = await checkLoginLock(limits, ip, now);
    if (lock.blocked) {
      console.warn("auth_locked", { ip });
      return json(429, { error: "Too many attempts — try again in a few minutes" });
    }

    const { adminPassword, sessionSecret } = deps.env || envSecrets();
    if (!secretsConfigured(adminPassword, sessionSecret)) {
      console.warn("auth_not_configured");
      return json(503, { error: "Unavailable" });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      console.warn("auth_failed", { ip });
      await recordLoginFailure(limits, ip, lock.rec, lock.key, now);
      return json(401, { error: "Unauthorized" });
    }

    const password = body && typeof body.password === "string" ? body.password : "";
    if (!secretsEqual(password, adminPassword)) {
      console.warn("auth_failed", { ip });
      await recordLoginFailure(limits, ip, lock.rec, lock.key, now);
      return json(401, { error: "Unauthorized" });
    }

    await resetLoginFailures(limits, lock.key);
    const signed = signSessionToken(sessionSecret, now, deps.ttlMs);
    return json(200, { token: signed.token, expiresAt: signed.expiresAt });
  } catch (err) {
    console.error("login_error");
    return json(500, { error: "Unavailable" });
  }
}

export async function handleShopData(req, context, deps = {}) {
  if (req.method === "GET") {
    return handleGet(req, context, deps);
  }
  if (req.method === "POST") {
    return handlePost(req, context, deps);
  }
  return json(405, { error: "Method not allowed" });
}

async function handleGet(req, context, deps) {
  const ip = clientIp(req, context);
  const limits = deps.limitsStore || getLimitsStore();
  const now = deps.now ? deps.now() : Date.now();

  try {
    const limited = await checkGetRate(limits, ip, now);
    if (limited.blocked) {
      return json(429, { error: "Too many requests" });
    }
  } catch {
    /* GET rate-limit store failure: fail open so visitors still see rates */
  }

  try {
    const store = deps.shopStore || getShopStore();
    const stored = await ensureCurrent(store);
    const publicData = toPublicShopData(stored);
    return json(200, publicData);
  } catch (err) {
    console.error("shop_get_error");
    return json(500, { error: "Unavailable" });
  }
}

async function handlePost(req, context, deps) {
  const { sessionSecret } = deps.env || envSecrets();
  if (!sessionSecret.length) {
    return json(503, { error: "Unavailable" });
  }

  const token = bearerToken(req);
  const now = deps.now ? deps.now() : Date.now();
  const verified = verifySessionToken(sessionSecret, token, now);
  if (!verified.ok) {
    return json(401, { error: "Unauthorized" });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid payload" });
  }

  const checked = validateShopPayload(body);
  if (!checked.ok) {
    return json(400, { error: "Invalid payload" });
  }

  try {
    const store = deps.shopStore || getShopStore();
    await writeCurrent(store, checked.data);
    return json(200, toPublicShopData(checked.data));
  } catch (err) {
    console.error("shop_write_error");
    return json(500, { error: "Unavailable" });
  }
}
