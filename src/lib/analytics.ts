// First-party analytics: tiny beacons to /e on this domain, stored in my own Cloudflare D1.
// No cookies, nothing stored in the browser beyond a random per-tab session id. Skipped entirely
// off the production host and for anyone with Do Not Track or Global Privacy Control turned on.

export function startAnalytics() {
  if (location.hostname !== "harisrinivasan.dev") return;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;

  let sid = "";
  try { sid = sessionStorage.getItem("sid") || ""; } catch {}
  if (!sid) {
    sid = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { sessionStorage.setItem("sid", sid); } catch {}
  }

  const send = (t: string, extra: Record<string, unknown> = {}) => {
    const body = JSON.stringify({ t, s: sid, p: location.pathname, ...extra });
    try {
      if (navigator.sendBeacon?.("/e", new Blob([body], { type: "text/plain" }))) return;
    } catch {}
    fetch("/e", { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
  };

  // Page view, with where the visitor came from.
  const q = new URLSearchParams(location.search);
  send("view", { r: document.referrer, us: q.get("utm_source"), um: q.get("utm_medium"), uc: q.get("utm_campaign") });

  // Clicks on links and buttons, named so the report reads plainly.
  document.addEventListener("click", (ev) => {
    const el = (ev.target as Element)?.closest?.("a, button, [data-track]") as HTMLElement | null;
    if (!el) return;
    let name = el.dataset.track || "";
    if (!name && el.dataset.game) name = `game: ${el.dataset.game}`;
    if (!name && el instanceof HTMLAnchorElement) {
      const href = el.getAttribute("href") || "";
      if (href.startsWith("mailto:")) name = "email";
      else if (href.startsWith("#")) name = `jump: ${href}`;
      else {
        try { const u = new URL(href, location.href); name = `link: ${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`; } catch { name = `link: ${href}`; }
      }
    }
    if (!name) name = `button: ${(el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60)}`;
    send("click", { n: name });
  }, { capture: true });

  // First hands-on interaction with each chapter's object (dragging pegs, flipping cards, and so on).
  const played = new Set<string>();
  document.addEventListener("pointerdown", (ev) => {
    const art = (ev.target as Element)?.closest?.(".chapter .art");
    const id = art?.closest<HTMLElement>("[data-chapter]")?.id;
    if (!id || played.has(id)) return;
    played.add(id);
    send("play", { n: id });
  }, { capture: true });

  // How far down the story each visit gets: the first time each chapter is half on screen.
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      io.unobserve(en.target);
      send("chapter", { n: (en.target as HTMLElement).id });
    }
  }, { threshold: 0.5 });
  document.querySelectorAll("[data-chapter], #ledger").forEach((el) => io.observe(el));

  // Arcade opened.
  const games = document.querySelector("[data-games]");
  if (games) new MutationObserver(() => { if (games.hasAttribute("open")) send("arcade", { n: "open" }); }).observe(games, { attributes: true, attributeFilter: ["open"] });

  // Time on site: visible seconds, reported whenever the tab is hidden or closed.
  let shownAt = document.visibilityState === "visible" ? performance.now() : 0;
  let pending = 0;
  const flush = () => {
    if (shownAt) { pending += performance.now() - shownAt; shownAt = 0; }
    const secs = Math.round(pending / 1000);
    if (secs >= 1) { send("leave", { v: secs }); pending = 0; }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
    else shownAt = performance.now();
  });
  addEventListener("pagehide", flush);
}
