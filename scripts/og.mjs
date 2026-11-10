// Builds the 1200x630 share image: name, line, highlights, and the ARR cabinet figure.
// Rendered to public/og.png by npm run og (macOS QuickLook renders the SVG, sips crops it).
import { readFileSync, writeFileSync } from "node:fs";
import { ISO_CSS } from "../src/lib/iso/iso-kit.mjs";
import { build } from "../src/figures/arr.mjs";

const css = readFileSync("src/styles/global.css", "utf8");
const dark = css.match(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/)[1];
const fig = build().svg.replace(/ (data-[a-z-]+)(?=[ >\/])(?!=)/g, ' $1=""').replace(/<svg[^>]*viewBox="([^"]+)"[^>]*>/, (_, vb) => `<svg x="560" y="60" width="680" height="520" viewBox="${vb}">`);
const chip = (x, y, text, w = Math.round(text.length * 15.2 + 28)) => `<rect x="${x}" y="${y - 30}" width="${w}" height="42" rx="4" fill="#ff6a3d"/><text x="${x + 12}" y="${y}" font-size="26" fill="#1c1b19" font-weight="600">${text}</text>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 -285 1200 1200">
<style>svg{${dark}} ${ISO_CSS.replace(/\.iso\[data-theme="light"\]\{[^}]*\}/, "")} text{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}</style>
<rect width="1200" height="630" fill="#1c1b19"/>
<g class="iso" style="${dark.replace(/\n/g, " ").trim()}">${fig}</g>
<text x="64" y="150" font-size="68" font-weight="700" fill="#ece5d3" letter-spacing="-1">Hari Srinivasan</text>
<text x="64" y="212" font-size="32" fill="#b5ad9a">Multidisciplinary dev who just</text>
<text x="64" y="252" font-size="32" fill="#b5ad9a">loves building.</text>
${chip(64, 340, "Maintainer, Agentic Resource Registry")}
${chip(64, 400, "Google Summer of Code 2025")}
${chip(64, 460, "AnkiDroid, 10M+ downloads")}
<text x="64" y="560" font-size="26" fill="#807968">harisrinivasan.dev</text>
</svg>`;
writeFileSync("/tmp/og.svg", svg);
console.log("wrote /tmp/og.svg", svg.length);
