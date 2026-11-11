// harisrinivasan.dev Worker. Static files are served straight from assets; this script only runs
// for POST /e (see run_worker_first in wrangler.jsonc), which records one analytics event in D1.
//
// The endpoint is write-only and anonymous by design: nothing here ever returns stored data.
// Reading happens locally with `npm run stats`, through Wrangler and your Cloudflare login.

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  LIMITER: RateLimit;
}

const ORIGIN = "https://harisrinivasan.dev";
const TYPES = new Set(["view", "click", "play", "chapter", "arcade", "leave"]);
const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|preview|fetch|curl|wget|python|httpclient|monitor|scan/i;
const MAX_BODY = 2048;

const str = (v: unknown, max: number) => (typeof v === "string" && v.length ? v.slice(0, max) : null);

function deviceOf(ua: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

function refHost(ref: string | null) {
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    return host === "harisrinivasan.dev" ? null : host.slice(0, 100);
  } catch {
    return null;
  }
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function saltFor(db: D1Database, day: string) {
  const fresh = [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, "0")).join("");
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO salts (day, salt) VALUES (?, ?)").bind(day, fresh),
    db.prepare("DELETE FROM salts WHERE day < ?").bind(day),
  ]);
  const row = await db.prepare("SELECT salt FROM salts WHERE day = ?").bind(day).first<{ salt: string }>();
  return row!.salt;
}

async function record(request: Request, env: Env) {
  const nothing = new Response(null, { status: 204 });
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });

  // Only accept beacons sent by the site itself, from a real browser.
  if (request.headers.get("Origin") !== ORIGIN) return new Response(null, { status: 403 });
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin") return new Response(null, { status: 403 });
  const ua = request.headers.get("User-Agent") || "";
  if (!ua || BOTS.test(ua)) return nothing;

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const { success } = await env.LIMITER.limit({ key: ip || "unknown" });
  if (!success) return new Response(null, { status: 429 });

  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > MAX_BODY) return new Response(null, { status: 413 });
  const text = await request.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413 });

  let e: any;
  try {
    e = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!e || typeof e !== "object" || !TYPES.has(e.t)) return new Response(null, { status: 400 });
  const sid = str(e.s, 40);
  if (!sid || !/^[a-z0-9-]+$/i.test(sid)) return new Response(null, { status: 400 });

  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  const vid = await sha256(`${await saltFor(env.DB, day)}|${ip}|${ua}`);
  const isView = e.t === "view";
  const value = e.t === "leave" && Number.isFinite(e.v) ? Math.max(0, Math.min(3600, Math.round(e.v))) : null;
  const country = (request as any).cf?.country ?? null;

  await env.DB.prepare(
    `INSERT INTO events (ts, day, vid, sid, type, name, path, ref, utm_source, utm_medium, utm_campaign, country, device, value)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      now, day, vid, sid, e.t,
      str(e.n, 120), str(e.p, 200),
      isView ? refHost(str(e.r, 500)) : null,
      isView ? str(e.us, 60) : null, isView ? str(e.um, 60) : null, isView ? str(e.uc, 80) : null,
      country, deviceOf(ua), value,
    )
    .run();
  return nothing;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/e") {
      try {
        return await record(request, env);
      } catch {
        return new Response(null, { status: 204 });
      }
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
