// The banner for my GitHub profile README: the workbench figures in a row with my name, in the
// site's dark or light theme. Served as /readme-dark.svg and /readme-light.svg and rebuilt on every
// deploy. GitHub shows it through an <img>, so everything (styles, the axolotl) is inlined.
import type { APIRoute, GetStaticPaths } from "astro";
import { readFileSync } from "node:fs";
import { ISO_CSS } from "../lib/iso/iso-kit.mjs";
import { FIGURES } from "../figures/index.mjs";

export const getStaticPaths: GetStaticPaths = () => [{ params: { theme: "dark" } }, { params: { theme: "light" } }];

const W = 1280, H = 360;
const ROW = ["foldable", "arr", "engine"] as const;

export const GET: APIRoute = ({ params }) => {
  const theme = params.theme as "dark" | "light";
  const css = readFileSync("src/styles/global.css", "utf8");
  const base = css.match(/:root \{([\s\S]*?)\n\}/)![1];
  const dark = css.match(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/)![1];
  // Only the colour tokens matter here; dark overrides the light ones.
  const vars = (base + (theme === "dark" ? dark : "")).replace(/\n/g, " ").replace(/var\(--font-mono\)/g, "monospace").replace(/"/g, "'").replace(/\/\*[\s\S]*?\*\//g, "");
  const axolotl = `data:image/gif;base64,${readFileSync("public/axolotl.gif").toString("base64")}`;
  const t = theme === "dark"
    ? { bg: "#1c1b19", ink: "#ece5d3", ink2: "#b5ad9a", ink3: "#807968", accent: "#ff6a3d", onAccent: "#1c1b19" }
    : { bg: "#eee4c8", ink: "#2a2620", ink2: "#5a5345", ink3: "#857c69", accent: "#c23b12", onAccent: "#eee4c8" };

  // Each figure is 640x420 on its own stretch of bench. Crop to the object, overlap the neighbours,
  // and fade every figure's sides so the separate benches melt into one.
  const fw = 400, fh = 262.5, step = 262, x0 = W - (ROW.length - 1) * step - fw + 6;
  const figs = ROW.map((key, i) => {
    let svg = (FIGURES as any)[key]().svg as string;
    svg = svg.replace(/ (data-[a-z-]+)(?=[ >\/])(?!=)/g, ' $1=""')
      .replace(/href="\/axolotl\.gif"/, `href="${axolotl}"`)
      .replace(/ id="([^"]+)"/g, ` id="${key}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${key}-$1)`)
      .replace(/<svg[^>]*viewBox="([^"]+)"[^>]*>/, `<svg x="0" y="0" width="${fw}" height="${fh}" viewBox="40 40 560 367">`);
    const x = x0 + i * step, y = H - fh - 8;
    return `<g transform="translate(${x} ${y})" mask="url(#fade)">${svg}</g>`;
  }).join("");
  const defs = `<defs><linearGradient id="fadeg" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.2" stop-color="#fff"/><stop offset="0.8" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${fw}" height="${fh}"><rect width="${fw}" height="${fh}" fill="url(#fadeg)"/></mask></defs>`;

  const chip = (x: number, y: number, text: string) => {
    const w = Math.round(text.length * 8.6 + 20);
    return `<rect x="${x}" y="${y - 18}" width="${w}" height="26" rx="3" fill="${t.accent}"/><text x="${x + 10}" y="${y}" font-size="15" font-weight="600" fill="${t.onAccent}">${text}</text>`;
  };

  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>Hari Srinivasan: multidisciplinary dev who just loves building</title>
<style>svg{${vars}} ${ISO_CSS.replace(/\.iso\[data-theme="light"\]\{[^}]*\}/, "")} text{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}</style>
${defs}
<rect width="${W}" height="${H}" rx="10" fill="${t.bg}"/>
<g class="iso"${theme === "light" ? ' data-theme="light"' : ""} style="${vars.trim()}">${figs}</g>
<text x="44" y="74" font-size="44" font-weight="700" fill="${t.ink}" letter-spacing="-0.5">Hari Srinivasan</text>
<text x="44" y="110" font-size="20" fill="${t.ink2}">Multidisciplinary dev who just loves building.</text>
${chip(44, 152, "Maintainer, Agentic Resource Registry")}
${chip(44, 186, "Google Summer of Code 2025")}
<text x="44" y="${H - 30}" font-size="16" fill="${t.ink3}">harisrinivasan.dev</text>
</svg>`;
  return new Response(body, { headers: { "Content-Type": "image/svg+xml" } });
};
