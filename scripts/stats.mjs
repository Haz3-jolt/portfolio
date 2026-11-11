// Site analytics report, read straight from the D1 database with your Wrangler login.
// Nothing is public: there is no dashboard, only this script on your machine.
//
//   npm run stats              last 30 days
//   npm run stats -- 7         last 7 days
import { execFileSync } from "node:child_process";

const days = Math.max(1, Number(process.argv[2]) || 30);
const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);

function q(sql) {
  let out;
  try {
    out = execFileSync(
      "npx",
      ["-y", "wrangler@4", "d1", "execute", "harisrinivasan-analytics", "--remote", "--json", "--config", "deploy/wrangler.jsonc", "--command", sql],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: "47fc6d1c73d6a04839cffc9e608354c4" } },
    );
  } catch (err) {
    const text = `${err.stdout || ""}${err.stderr || ""}`;
    if (/CLOUDFLARE_API_TOKEN|not logged in|Authentication error|login/i.test(text)) {
      console.error("Wrangler isn't logged in to Cloudflare in this shell. Run this once, approve it in the browser, then try again:\n\n  npx wrangler login\n");
    } else {
      console.error(text.trim() || err.message);
    }
    process.exit(1);
  }
  return JSON.parse(out.slice(out.indexOf("["))).map((r) => r.results);
}

const W = `day >= '${since}'`;
const [totals, perDay, dur, refs, utm, countries, devices, clicks, plays, chapters, arcade] = q(`
  SELECT
    (SELECT COUNT(*) FROM events WHERE ${W} AND type='view') AS views,
    (SELECT COUNT(*) FROM (SELECT DISTINCT day, vid FROM events WHERE ${W} AND type='view')) AS visitors,
    (SELECT COUNT(DISTINCT sid) FROM events WHERE ${W} AND type='view') AS sessions;
  SELECT day, SUM(type='view') AS views, COUNT(DISTINCT CASE WHEN type='view' THEN vid END) AS visitors
    FROM events WHERE ${W} GROUP BY day ORDER BY day;
  SELECT secs FROM (SELECT sid, SUM(value) AS secs FROM events WHERE ${W} AND type='leave' GROUP BY sid) ORDER BY secs;
  SELECT COALESCE(ref, '(direct or none)') AS source, COUNT(*) AS views FROM events WHERE ${W} AND type='view' GROUP BY source ORDER BY views DESC LIMIT 15;
  SELECT utm_source || COALESCE(' / ' || utm_medium, '') || COALESCE(' / ' || utm_campaign, '') AS campaign, COUNT(*) AS views
    FROM events WHERE ${W} AND type='view' AND utm_source IS NOT NULL GROUP BY campaign ORDER BY views DESC LIMIT 10;
  SELECT COALESCE(country, '??') AS country, COUNT(DISTINCT sid) AS sessions FROM events WHERE ${W} AND type='view' GROUP BY country ORDER BY sessions DESC LIMIT 12;
  SELECT device, COUNT(DISTINCT sid) AS sessions FROM events WHERE ${W} AND type='view' GROUP BY device ORDER BY sessions DESC;
  SELECT name, COUNT(*) AS clicks, COUNT(DISTINCT sid) AS sessions FROM events WHERE ${W} AND type='click' GROUP BY name ORDER BY clicks DESC LIMIT 25;
  SELECT name AS chapter, COUNT(DISTINCT sid) AS sessions FROM events WHERE ${W} AND type='play' GROUP BY name ORDER BY sessions DESC;
  SELECT name AS chapter, COUNT(DISTINCT sid) AS sessions FROM events WHERE ${W} AND type='chapter' GROUP BY name;
  SELECT COUNT(DISTINCT sid) AS sessions FROM events WHERE ${W} AND type='arcade';
`);

const ORDER = ["games", "robots", "ml", "dasa", "ankidroid", "notetype", "arr", "axl", "ledger"];
const t = totals[0];
const secs = dur.map((r) => r.secs);
const fmt = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`);
const median = secs.length ? secs[Math.floor(secs.length / 2)] : 0;
const mean = secs.length ? Math.round(secs.reduce((a, b) => a + b, 0) / secs.length) : 0;
const pct = (n) => (t.sessions ? `${Math.round((100 * n) / t.sessions)}%` : "0%");

const table = (title, rows, cols) => {
  console.log(`\n${title}`);
  if (!rows.length) return console.log("  none yet");
  const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? "").length)));
  for (const r of rows) console.log("  " + cols.map((c, i) => (i === 0 ? String(r[c] ?? "").padEnd(widths[i]) : String(r[c] ?? "").padStart(widths[i]))).join("   "));
};

console.log(`harisrinivasan.dev, last ${days} day${days === 1 ? "" : "s"} (since ${since}, UTC)`);
console.log(`\n  Views ${t.views}   Visitors ${t.visitors}   Visits ${t.sessions}`);
console.log(`  Time on site: median ${fmt(median)}, average ${fmt(mean)} (${secs.length} visits reported)`);
if (perDay.length > 1) {
  const max = Math.max(...perDay.map((d) => d.views));
  console.log("\nViews per day");
  for (const d of perDay) console.log(`  ${d.day}  ${"#".repeat(Math.max(1, Math.round((28 * d.views) / max)))} ${d.views} (${d.visitors} visitors)`);
}
table("Where they came from", refs, ["source", "views"]);
table("Campaigns (utm tags)", utm, ["campaign", "views"]);
table("Countries", countries, ["country", "sessions"]);
table("Devices", devices, ["device", "sessions"]);
const reached = Object.fromEntries(chapters.map((c) => [c.chapter, c.sessions]));
const funnel = ORDER.filter((id) => id in reached).map((id) => ({ chapter: id, visits: reached[id], share: pct(reached[id]) }));
for (const c of chapters) if (!ORDER.includes(c.chapter)) funnel.push({ chapter: c.chapter, visits: c.sessions, share: pct(c.sessions) });
table("How far they scrolled (visits that reached each chapter)", funnel, ["chapter", "visits", "share"]);
table("Played with the object", plays.map((p) => ({ ...p, share: pct(p.sessions) })), ["chapter", "sessions", "share"]);
console.log(`\nOpened the arcade: ${arcade[0]?.sessions ?? 0} visits (${pct(arcade[0]?.sessions ?? 0)})`);
table("Clicks", clicks, ["name", "clicks", "sessions"]);
console.log("");
