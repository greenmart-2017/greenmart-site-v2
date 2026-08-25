import { getStore } from "@netlify/blobs";
import {
  DEFAULT_SHOP_DATA,
  SHOP_STORE_NAME,
  SHOP_KEY_CURRENT,
  SHOP_KEY_PREV,
  LIMITS_STORE_NAME
} from "./defaults.js";

export function getShopStore() {
  return getStore({ name: SHOP_STORE_NAME, consistency: "strong" });
}

export function getLimitsStore() {
  return getStore({ name: LIMITS_STORE_NAME, consistency: "strong" });
}

/** Field-by-field public view — never spread the stored object. */
export function toPublicShopData(stored) {
  return {
    ratesUpdated: stored.ratesUpdated,
    rates: stored.rates,
    availability: stored.availability,
    bulkRates: stored.bulkRates,
    deliveryZones: stored.deliveryZones
  };
}

export async function readJson(store, key) {
  const value = await store.get(key, { type: "json", consistency: "strong" });
  return value == null ? null : value;
}

export async function ensureCurrent(store) {
  const existing = await readJson(store, SHOP_KEY_CURRENT);
  if (existing && typeof existing === "object") {
    return existing;
  }
  const seed = structuredClone(DEFAULT_SHOP_DATA);
  await store.setJSON(SHOP_KEY_CURRENT, seed);
  return seed;
}

/** Shift current → previous-1 → previous-2 → previous-3 (max 3). */
export async function rollBackup(store) {
  const current = await readJson(store, SHOP_KEY_CURRENT);
  if (!current) return;
  const prev1 = await readJson(store, SHOP_KEY_PREV[0]);
  const prev2 = await readJson(store, SHOP_KEY_PREV[1]);
  if (prev2) await store.setJSON(SHOP_KEY_PREV[2], prev2);
  if (prev1) await store.setJSON(SHOP_KEY_PREV[1], prev1);
  await store.setJSON(SHOP_KEY_PREV[0], current);
}

export async function writeCurrent(store, data) {
  await rollBackup(store);
  await store.setJSON(SHOP_KEY_CURRENT, data);
}
