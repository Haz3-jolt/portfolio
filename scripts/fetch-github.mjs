// Fetches Hari's merged PRs and repos from the GitHub API and writes src/data/github.json.
// Token: GITHUB_TOKEN env var (CI), else `gh auth token` locally, else unauthenticated.
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const USER = "Haz3-jolt";
let token = process.env.GITHUB_TOKEN;
if (!token) try { token = execSync("gh auth token", { encoding: "utf8" }).trim(); } catch {}
const headers = { Accept: "application/vnd.github+json", "User-Agent": "personal-site-build", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

async function get(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${url}: ${await res.text()}`);
  return res.json();
}

async function mergedPRs() {
  const out = [];
  // Search caps at 1000 results per query; split by year so we never hit it.
  for (let year = 2021; year <= new Date().getFullYear(); year++) {
    for (let page = 1; page <= 10; page++) {
      const q = encodeURIComponent(`author:${USER} is:pr is:merged merged:${year}-01-01..${year}-12-31`);
      const data = await get(`https://api.github.com/search/issues?q=${q}&per_page=100&page=${page}&sort=created&order=desc`);
      for (const it of data.items) {
        out.push({
          repo: it.repository_url.replace("https://api.github.com/repos/", ""),
          number: it.number,
          title: it.title,
          merged: (it.pull_request?.merged_at || it.closed_at).slice(0, 10),
          url: it.html_url,
        });
      }
      if (data.items.length < 100) break;
    }
  }
  return out.sort((a, b) => b.merged.localeCompare(a.merged) || b.number - a.number);
}

async function ownRepos() {
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const data = await get(`https://api.github.com/users/${USER}/repos?per_page=100&page=${page}&sort=pushed`);
    repos.push(...data);
    if (data.length < 100) break;
  }
  return repos
    .filter((r) => !r.fork && !r.archived && r.name !== USER)
    .map((r) => ({ name: r.full_name, description: r.description, language: r.language, stars: r.stargazers_count, pushed: r.pushed_at.slice(0, 10), url: r.html_url }));
}

async function repoInfo(full) {
  try {
    const r = await get(`https://api.github.com/repos/${full}`);
    return { name: r.full_name, description: r.description, language: r.language, stars: r.stargazers_count, url: r.html_url };
  } catch {
    return { name: full, description: null, language: null, stars: 0, url: `https://github.com/${full}` };
  }
}

const prs = await mergedPRs();
const own = await ownRepos();
const counts = {};
for (const pr of prs) counts[pr.repo] = (counts[pr.repo] || 0) + 1;
const ownNames = new Set(own.map((r) => r.name.toLowerCase()));
const contributedNames = Object.keys(counts).filter((n) => !ownNames.has(n.toLowerCase()) && !n.toLowerCase().startsWith(USER.toLowerCase() + "/"));
const contributed = [];
for (const name of contributedNames) contributed.push({ ...(await repoInfo(name)), prs: counts[name] });
contributed.sort((a, b) => b.prs - a.prs || b.stars - a.stars);

const data = {
  fetched: new Date().toISOString(),
  stats: { mergedPRs: prs.length, reposContributed: contributed.length, ownRepos: own.length },
  prs,
  own,
  contributed,
};
mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/github.json", JSON.stringify(data, null, 1));
console.log(`merged PRs: ${prs.length}, repos contributed: ${contributed.length}, own repos: ${own.length}`);
