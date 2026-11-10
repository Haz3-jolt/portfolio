// Plain-text versions of the site for LLMs and answer engines (https://llmstxt.org).
// Built from the same story data as the page, so the two never drift apart.
import { chapters } from "../data/story";
import data from "../data/github.json";

const strip = (s: string) => s.replace(/\*\*/g, "");
const SITE = "https://harisrinivasan.dev";
// One factual line per project, for the summary list.
const SUMMARY: Record<string, string> = {
  axl: "Co-author and top contributor of Axl, a local-first agent harness: one daemon owns the coding session and every client (terminal, browser) is a window into it. TypeScript, Apache 2.0.",
  arr: "Maintainer and top contributor (421 merged PRs, 1,262 commits) of Agentic Resource Registry, a self-hosted Apache 2.0 registry where teams share skills, MCP servers, hooks, prompts and agent files for coding agents. Works with Claude Code, Cursor, Codex, Kiro and others.",
  notetype: "Built AnkiDroid's Change Note Type dialog: picked up issue #14134 on 19 January 2025, merged on 19 January 2026 (2,488 lines across 32 files, 38 reviews).",
  ankidroid: "AnkiDroid contributor since late 2023 (44 merged PRs). Google Summer of Code 2025: rebuilt AnkiDroid's UI for tablets and Chromebooks with resizable multi-pane layouts.",
  dasa: "Built DASA-Bot, a Discord bot answering Indian college admission cutoff questions for students applying through DASA. Used by 1,000+ people; the database was a Google Sheet.",
  ml: "Python and machine learning: neural nets from scratch and an OpenCV finger-tracking project that runs commands on hand gestures.",
  robots: "Arduino and Raspberry Pi robotics. CS50 final project: a robot that drives a U-shaped track, avoids boundaries and obstacles, and parks in a box.",
  games: "Started programming at twelve, making games in Unity with C#.",
};

export function llmsTxt(full: boolean) {
  const cal = (data as any).calendar;
  const lines: string[] = [];
  lines.push("# Hari Srinivasan");
  lines.push("");
  lines.push("> Multidisciplinary developer who just loves building. Maintainer of Agentic Resource Registry (a self-hosted, Apache 2.0 registry for coding-agent resources), co-author of Axl (a local-first agent harness), and Google Summer of Code 2025 contributor to AnkiDroid, the Anki flashcard app for Android with 10M+ downloads on Google Play.");
  lines.push("");
  lines.push(`Site: ${SITE}`);
  lines.push("GitHub: https://github.com/Haz3-jolt");
  lines.push("LinkedIn: https://www.linkedin.com/in/hari-srinivasan-b0633a2b8/");
  lines.push("Email: harisrini21@gmail.com");
  if (cal) lines.push(`GitHub contributions in the last year: ${cal.total.toLocaleString("en-US")}`);
  lines.push("");
  lines.push("## Projects");
  lines.push("");
  for (const c of [...chapters].reverse()) {
    const link = c.links?.[0];
    const summary = SUMMARY[c.id] ?? strip(c.body[0]);
    lines.push(`- [${c.title}](${link?.href ?? SITE}) (${c.year}): ${summary}`);
  }
  if (full) {
    lines.push("");
    lines.push("## The story in full");
    for (const c of chapters) {
      lines.push("");
      lines.push(`### ${c.year}: ${c.title}`);
      lines.push("");
      for (const p of c.body) lines.push(strip(p), "");
      if (c.facts?.length) lines.push(`Facts: ${c.facts.join("; ")}.`, "");
      for (const l of c.links ?? []) lines.push(`- ${l.label}: ${l.href}`);
    }
    lines.push("");
    lines.push("## Open source contributions");
    lines.push("");
    for (const r of (data as any).contributed) lines.push(`- ${r.name}: ${r.prs} merged pull requests (${r.url})`);
  }
  lines.push("");
  lines.push("## Optional");
  lines.push("");
  lines.push(`- [Full text of the site](${SITE}/llms-full.txt): every chapter, in plain text`);
  lines.push(`- [Source code](https://github.com/Haz3-jolt/portfolio): this site, MIT licensed`);
  lines.push("");
  return lines.join("\n");
}
