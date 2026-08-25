const MAX_RATES = 200;
const MAX_AVAIL = 100;
const MAX_BULK = 100;
const MAX_STR = 200;
const NUM_MAX = 1_000_000;

const TOP_KEYS = ["ratesUpdated", "rates", "availability", "bulkRates", "deliveryZones"];

export function validateShopPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid payload" };
  }
  const keys = Object.keys(body);
  for (const k of keys) {
    if (!TOP_KEYS.includes(k)) {
      return { ok: false, error: "Invalid payload" };
    }
  }
  for (const k of TOP_KEYS) {
    if (!(k in body)) return { ok: false, error: "Invalid payload" };
  }

  if (typeof body.ratesUpdated !== "string" || !validStr(body.ratesUpdated)) {
    return { ok: false, error: "Invalid payload" };
  }

  const rates = validateRates(body.rates);
  if (!rates.ok) return rates;

  const avail = validateAvailability(body.availability);
  if (!avail.ok) return avail;

  const bulk = validateBulk(body.bulkRates);
  if (!bulk.ok) return bulk;

  const zones = validateZones(body.deliveryZones);
  if (!zones.ok) return zones;

  return {
    ok: true,
    data: {
      ratesUpdated: body.ratesUpdated,
      rates: rates.data,
      availability: avail.data,
      bulkRates: bulk.data,
      deliveryZones: zones.data
    }
  };
}

function validStr(s) {
  return typeof s === "string" && s.length > 0 && s.length <= MAX_STR;
}

function validateRates(rates) {
  if (!Array.isArray(rates) || rates.length > MAX_RATES) {
    return { ok: false, error: "Invalid payload" };
  }
  const data = [];
  for (const row of rates) {
    if (!Array.isArray(row) || row.length !== 3) {
      return { ok: false, error: "Invalid payload" };
    }
    const [desc, unit, price] = row;
    if (!validStr(desc) || !validStr(unit) || typeof price !== "string" || price.length === 0 || price.length > MAX_STR) {
      return { ok: false, error: "Invalid payload" };
    }
    data.push([desc, unit, price]);
  }
  return { ok: true, data };
}

function validateAvailability(avail) {
  if (!Array.isArray(avail) || avail.length > MAX_AVAIL) {
    return { ok: false, error: "Invalid payload" };
  }
  const data = [];
  for (const row of avail) {
    if (!Array.isArray(row) || row.length !== 2) {
      return { ok: false, error: "Invalid payload" };
    }
    const [name, ok] = row;
    if (!validStr(name) || typeof ok !== "boolean") {
      return { ok: false, error: "Invalid payload" };
    }
    data.push([name, ok]);
  }
  return { ok: true, data };
}

function validateBulk(bulk) {
  if (!bulk || typeof bulk !== "object" || Array.isArray(bulk)) {
    return { ok: false, error: "Invalid payload" };
  }
  const keys = Object.keys(bulk);
  if (keys.length > MAX_BULK) {
    return { ok: false, error: "Invalid payload" };
  }
  const data = {};
  for (const key of keys) {
    if (!validStr(key)) return { ok: false, error: "Invalid payload" };
    const n = bulk[key];
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > NUM_MAX) {
      return { ok: false, error: "Invalid payload" };
    }
    data[key] = n;
  }
  return { ok: true, data };
}

function positiveNum(n) {
  return typeof n === "number" && Number.isFinite(n) && n > 0 && n <= NUM_MAX;
}

function validateZones(zones) {
  if (!zones || typeof zones !== "object" || Array.isArray(zones)) {
    return { ok: false, error: "Invalid payload" };
  }
  const keys = Object.keys(zones);
  if (keys.length !== 3 || !("city" in zones) || !("out" in zones) || !("near" in zones)) {
    return { ok: false, error: "Invalid payload" };
  }

  const city = validateFlatZone(zones.city);
  if (!city.ok) return city;
  const out = validateFlatZone(zones.out);
  if (!out.ok) return out;
  const near = validateNearZone(zones.near);
  if (!near.ok) return near;

  return {
    ok: true,
    data: { city: city.data, out: out.data, near: near.data }
  };
}

function validateFlatZone(z) {
  if (!z || typeof z !== "object" || Array.isArray(z)) {
    return { ok: false, error: "Invalid payload" };
  }
  const keys = Object.keys(z);
  if (keys.length !== 3 || !("label" in z) || !("freeAboveKg" in z) || !("flatRate" in z)) {
    return { ok: false, error: "Invalid payload" };
  }
  if (!validStr(z.label) || !positiveNum(z.freeAboveKg) || !positiveNum(z.flatRate)) {
    return { ok: false, error: "Invalid payload" };
  }
  return {
    ok: true,
    data: { label: z.label, freeAboveKg: z.freeAboveKg, flatRate: z.flatRate }
  };
}

function validateNearZone(z) {
  if (!z || typeof z !== "object" || Array.isArray(z)) {
    return { ok: false, error: "Invalid payload" };
  }
  const keys = Object.keys(z);
  if (keys.length !== 3 || !("label" in z) || !("perKgRate" in z) || !("minRate" in z)) {
    return { ok: false, error: "Invalid payload" };
  }
  if (!validStr(z.label) || !positiveNum(z.perKgRate) || !positiveNum(z.minRate)) {
    return { ok: false, error: "Invalid payload" };
  }
  return {
    ok: true,
    data: { label: z.label, perKgRate: z.perKgRate, minRate: z.minRate }
  };
}

export const LIMITS = { MAX_RATES, MAX_AVAIL, MAX_BULK, MAX_STR, NUM_MAX };
