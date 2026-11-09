// 2026: Axl. One engine (the daemon) owns the session; three windows, a terminal, a browser and an
// editor, are wired to it and show the same session, typing in sync. Unplug one and the engine runs on.
import * as k from "../lib/iso/iso-kit.mjs";
import * as G from "../lib/iso/lathe.mjs";
import { S, L, D, bench, camera, halo, WIDTH, HEIGHT } from "./bench.mjs";

const BLOCK = { x: -26, y: -30, w: 52, d: 44, r: 3 };
const BLOCK_H = 34;
const SCREENS = [
  { name: "terminal", x: -112, y: -8, w: 46, h: 34 },
  { name: "browser", x: -64, y: 34, w: 48, h: 30 },
  { name: "editor", x: 62, y: -8, w: 46, h: 34 },
];
const STAND = 8;

function engine(P) {
  const at = (p) => k.iso(p, P);
  const out = [halo(BLOCK, 0, BLOCK_H, P)];
  out.push(S(k.slabOf(k.insetPlan(BLOCK, -4), 0, 4, P, 4, 0.6), { tone: "lo" }));
  out.push(S(k.slabOf(BLOCK, 4, BLOCK_H - 4, P, 4, 0.8), { tone: "mid" }));
  // Cooling fins across the top.
  for (let i = 0; i < 7; i++) out.push(S(k.slabOf({ x: BLOCK.x + 6 + i * 6.4, y: BLOCK.y + 6, w: 2, d: BLOCK.d - 12, r: 0.5 }, BLOCK_H, 7, P, 2), { tone: "mid" }));
  // Flywheel on the right side: a turned drum with spokes engraved on its face.
  const F = G.frameOf([BLOCK.x + BLOCK.w, BLOCK.y + BLOCK.d / 2, 20], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 6, 14, F, P), { tone: "hi", lit: true }));
  out.push(`<g data-spokes>${L(G.spokesOf(F, 6, 3, 12, 6, P), { tone: "mid" })}</g>`);
  out.push(L(G.circleOf(F, 6, 3, P, 24), { tone: "mid" }));
  // Name plate on the front and status lamp.
  const front = BLOCK.y + BLOCK.d;
  out.push(S(k.slabOf({ x: -16, y: front, w: 32, d: 0.8, r: 0.3 }, 12, 10, P, 2), { tone: "hi" }));
  out.push(k.faceTextSvg(k.sideMatrix([0, front + 0.9], 15.2, P, "left"), "axld", { size: 4.4, tone: "hi", anchor: "middle" }));
  out.push(`<circle data-status class="led" data-on cx="${at([20, front, 26])[0]}" cy="${at([20, front, 26])[1]}" r="1.3"/>`);
  out.push(D(k.corners(BLOCK, 4).map(([x, y]) => at([x, y, BLOCK_H])), { size: 0.45 }));
  return out.join("");
}

function screen(P, s, i) {
  const at = (p) => k.iso(p, P);
  const out = [];
  const base = { x: s.x + s.w / 2 - 10, y: s.y - 6, w: 20, d: 12, r: 2 };
  out.push(halo(base, 0, 2, P));
  out.push(S(k.slabOf(base, 0, 2, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf({ x: s.x + s.w / 2 - 2, y: s.y - 3, w: 4, d: 3, r: 0.8 }, 2, STAND, P, 2), { tone: "mid" }));
  const panel = { x: s.x, y: s.y, w: s.w, d: 3, r: 1 };
  out.push(S(k.slabOf(panel, STAND, s.h, P, 3, 0.4), { tone: "hi" }));
  const face = s.y + 3;
  const m = k.sideMatrix([s.x + 3, face + 0.1], STAND + s.h - 3, P, "left");
  const w = s.w - 6, h = s.h - 6;
  const chrome = s.name === "browser" ? `<rect class="crt-ui" width="${w}" height="4"/><circle class="crt-ink" cx="2.4" cy="2" r=".7"/><rect class="crt-ui" x="8" y="1" width="${w - 12}" height="2" rx="1"/>`
    : s.name === "editor" ? `<rect class="crt-ui" width="9" height="${h}"/><rect class="crt-ui" x="9" width="${w - 9}" height="4"/>`
    : `<rect class="crt-ui" width="${w}" height="3"/>`;
  const x0 = s.name === "editor" ? 11 : 2;
  out.push(`<g transform="${m}"><rect class="crt-glass" width="${w}" height="${h}"/>${chrome}<text data-line="${i}" class="screen-text" x="${x0}" y="${h - 6}" font-size="3">&gt; </text><path class="crt-ink" d="M${x0} 9h${w * 0.5}M${x0} 13h${w * 0.35}M${x0} 17h${w * 0.45}"/></g>`);
  return out.join("");
}

function wires(P) {
  // Cable from each window's stand back to a port on the engine, with a pulse flowing along it.
  const front = BLOCK.y + BLOCK.d;
  const ports = [[-16, front, 6], [0, front, 6], [16, front, 6]];
  return SCREENS.map((s, i) => {
    const a = k.iso([s.x + s.w / 2, s.y - 6, 1], P);
    const b = k.iso(ports[i], P);
    const mid = k.iso([(s.x + s.w / 2 + ports[i][0]) / 2, (s.y - 6 + front) / 2 + 6, 0.5], P);
    const d = `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${mid[0].toFixed(1)} ${mid[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    return `<path class="cable" d="${d}"/><path class="pulse" data-pulse="${i}" d="${d}"/><circle class="iso-wire-end" cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="1.2"/>`;
  }).join("");
}

// Axl's mascot, the pixel-art axolotl from the repo, sitting on the bench beside the engine.
function axolotl(P) {
  const [x, y] = k.iso([30, 44, 0], P);
  const w = 120, h = w * (300 / 438);
  return `<image class="axolotl" href="/axolotl.gif" x="${(x - w / 2).toFixed(1)}" y="${(y - h + 6).toFixed(1)}" width="${w}" height="${h.toFixed(1)}" preserveAspectRatio="xMidYMax meet"/>`;
}

export function build() {
  const pts = [...k.boxCorners(k.insetPlan(BLOCK, -4), 0, BLOCK_H + 7), ...SCREENS.flatMap((s) => [[s.x, s.y, STAND + s.h], [s.x + s.w, s.y + 3, 0]])];
  const P = camera(pts, { pad: 24 });
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: "An engine block marked axld standing for Axl, a local-first agent harness. Three windows, a terminal, a browser and an editor, are cabled to it and show the same coding session, typing the same line in sync.",
    body: [bench(P, 2026), engine(P), wires(P), ...SCREENS.map((s, i) => screen(P, s, i)), axolotl(P)],
  });
  return { svg, hint: "Hover a window to unplug it", readout: "1 session · 3 windows in sync", data: { screens: SCREENS.map((s) => s.name) } };
}
