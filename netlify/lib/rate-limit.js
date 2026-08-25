import { ipKey } from "./http.js";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 5;
const GET_WINDOW_MS = 60 * 1000;
const GET_MAX = 60;

export const RATE_LIMIT = {
  LOGIN_WINDOW_MS,
  LOGIN_MAX_FAILS,
  GET_WINDOW_MS,
  GET_MAX
};

export async function checkLoginLock(store, ip, now = Date.now()) {
  const key = ipKey("login", ip);
  const rec = (await store.get(key, { type: "json", consistency: "strong" })) || null;
  if (rec && rec.lockedUntil && now < rec.lockedUntil) {
    return { blocked: true, rec, key };
  }
  return { blocked: false, rec, key };
}

export async function recordLoginFailure(store, ip, rec, key, now = Date.now()) {
  let next = rec && typeof rec === "object" ? { ...rec } : { fails: 0, windowStart: now };
  if (next.lockedUntil && now >= next.lockedUntil) {
    next = { fails: 0, windowStart: now };
  }
  if (now - (next.windowStart || 0) > LOGIN_WINDOW_MS) {
    next = { fails: 0, windowStart: now };
  }
  next.fails = (next.fails || 0) + 1;
  next.windowStart = next.windowStart || now;
  if (next.fails >= LOGIN_MAX_FAILS) {
    next.lockedUntil = now + LOGIN_WINDOW_MS;
  }
  await store.setJSON(key, next);
  return next;
}

export async function resetLoginFailures(store, key) {
  await store.setJSON(key, { fails: 0, windowStart: Date.now() });
}

export async function checkGetRate(store, ip, now = Date.now()) {
  const key = ipKey("get", ip);
  const rec = (await store.get(key, { type: "json", consistency: "strong" })) || null;
  let next;
  if (!rec || now - (rec.windowStart || 0) >= GET_WINDOW_MS) {
    next = { count: 1, windowStart: now };
  } else {
    next = { count: (rec.count || 0) + 1, windowStart: rec.windowStart };
  }
  await store.setJSON(key, next);
  if (next.count > GET_MAX) {
    return { blocked: true };
  }
  return { blocked: false };
}
