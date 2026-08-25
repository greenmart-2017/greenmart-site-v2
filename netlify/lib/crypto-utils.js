import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "v1";
export const SESSION_TTL_MS = 30 * 60 * 1000;

/** Constant-time equality for secrets. Hashes both sides so lengths always match. */
export function secretsEqual(a, b) {
  const left = createHash("sha256").update(toBuffer(a)).digest();
  const right = createHash("sha256").update(toBuffer(b)).digest();
  return timingSafeEqual(left, right);
}

function toBuffer(value) {
  if (typeof value === "string") return Buffer.from(value, "utf8");
  if (Buffer.isBuffer(value)) return value;
  return Buffer.from(String(value ?? ""), "utf8");
}

export function signSessionToken(secret, now = Date.now(), ttlMs = SESSION_TTL_MS) {
  const exp = now + ttlMs;
  const payload = `${TOKEN_VERSION}.${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return { token: `${payload}.${sig}`, expiresAt: exp };
}

export function verifySessionToken(secret, token, now = Date.now()) {
  if (typeof token !== "string" || token.length < 20 || token.length > 512) {
    return { ok: false };
  }
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false };
  const [version, expRaw, sig] = parts;
  if (version !== TOKEN_VERSION) return { ok: false };
  if (!/^\d+$/.test(expRaw)) return { ok: false };
  if (!/^[0-9a-f]+$/i.test(sig)) return { ok: false };

  const payload = `${version}.${expRaw}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (!secretsEqual(sig.toLowerCase(), expected.toLowerCase())) {
    return { ok: false };
  }
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || now >= exp) {
    return { ok: false, expired: true };
  }
  return { ok: true, expiresAt: exp };
}

export function bearerToken(req) {
  const header = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const prefix = "Bearer ";
  if (header.length < prefix.length) return "";
  const gotPrefix = header.slice(0, prefix.length);
  if (!secretsEqual(gotPrefix.toLowerCase(), prefix.toLowerCase())) return "";
  return header.slice(prefix.length).trim();
}
