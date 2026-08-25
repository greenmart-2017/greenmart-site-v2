const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

export function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export function clientIp(req, context) {
  const fromContext = context && typeof context.ip === "string" ? context.ip.trim() : "";
  if (fromContext) return fromContext;
  const nf = req.headers.get("x-nf-client-connection-ip");
  if (nf && nf.trim()) return nf.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }
  return "unknown";
}

export function ipKey(prefix, ip) {
  return `${prefix}:${ip}`.slice(0, 500);
}
