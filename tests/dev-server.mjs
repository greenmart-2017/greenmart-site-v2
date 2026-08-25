import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { handleLogin, handleShopData } from "../netlify/lib/handlers.js";
import { MemoryStore } from "./memory-store.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json"
};

export function createDevApp(options = {}) {
  const shopStore = options.shopStore || new MemoryStore();
  const limitsStore = options.limitsStore || new MemoryStore();
  const env = options.env || {
    adminPassword: process.env.ADMIN_PASSWORD || "test-admin-password-not-for-prod",
    sessionSecret: process.env.SESSION_SECRET || "test-session-secret-not-for-prod-32b"
  };

  async function dispatch(req, url) {
    const context = { ip: req.headers["x-forwarded-for"] || "127.0.0.1" };
    const webReq = new Request("http://127.0.0.1" + url.pathname, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req)
    });
    const deps = { shopStore, limitsStore, env };
    if (url.pathname === "/api/auth/login") return handleLogin(webReq, context, deps);
    if (url.pathname === "/api/shop-data") return handleShopData(webReq, context, deps);
    return null;
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const apiRes = await dispatch(req, url);
      if (apiRes) {
        res.statusCode = apiRes.status;
        apiRes.headers.forEach((v, k) => res.setHeader(k, v));
        const buf = Buffer.from(await apiRes.arrayBuffer());
        res.end(buf);
        return;
      }
      let path = decodeURIComponent(url.pathname);
      if (path.endsWith("/")) path += "index.html";
      if (path === "/") path = "/index.html";
      const safe = normalize(join(root, path.replace(/^\/+/, "")));
      if (!safe.startsWith(root)) {
        res.statusCode = 403;
        res.end("forbidden");
        return;
      }
      const data = await readFile(safe);
      res.setHeader("Content-Type", TYPES[extname(safe)] || "application/octet-stream");
      res.end(data);
    } catch (err) {
      if (err && err.code === "ENOENT") {
        res.statusCode = 404;
        res.end("not found");
        return;
      }
      res.statusCode = 500;
      res.end("error");
    }
  });

  return { server, shopStore, limitsStore, env };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || 8090);
  const { server } = createDevApp();
  server.listen(port, "127.0.0.1", () => {
    console.log("dev server http://127.0.0.1:" + port);
  });
}
