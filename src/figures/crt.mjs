// 2017: a beige desktop computer with a CRT monitor. On its screen, a game editor in play mode:
// a hierarchy panel, a scene view with a small level, and a cube that hops from platform to platform.
import * as k from "../lib/iso/iso-kit.mjs";
import { S, L, D, bench, camera, halo, WIDTH, HEIGHT } from "./bench.mjs";

const CASE = { x: -74, y: -44, w: 132, d: 76, r: 2 };
const CASE_H = 20;
const BACK = { x: -52, y: -40, w: 88, d: 44, r: 6 };
const BEZEL = { x: -60, y: 4, w: 104, d: 14, r: 3 };
const MON_Z = CASE_H + 6;
const MON_H = 82;
const SCREEN = { x0: -52, x1: 36, z0: MON_Z + 10, z1: MON_Z + MON_H - 9 };
const FACE = BEZEL.y + BEZEL.d; // the monitor's front plane
const KEYS = { x: -66, y: 46, w: 104, d: 24, r: 2 };

// Platforms of the little level, in screen-local units (x right, y down, origin top-left of the scene view).
export const PLATFORMS = [[8, 34], [22, 28], [36, 32], [50, 24], [62, 30]];

function computer(P) {
  const at = (p) => k.iso(p, P);
  const out = [halo(CASE, 0, CASE_H, P)];
  // Desktop case.
  out.push(S(k.slabOf(CASE, 0, CASE_H, P, 3, 0.8), { tone: "mid" }));
  out.push(L(k.sideSeam(CASE, CASE_H - 4, P, 3), { tone: "faint" }));
  const front = CASE.y + CASE.d;
  // Two drive bays with slots, a power button and an LED on the case front.
  for (const [x, w] of [[-62, 40], [-16, 40]]) {
    const bay = [[x, front, 4], [x + w, front, 4], [x + w, front, 13], [x, front, 13]].map(at);
    out.push(L(k.pathOf(bay, true), { tone: "lo" }));
    out.push(L(k.segment([x + 6, front, 8.5], [x + w - 6, front, 8.5], P), { tone: "mid" }));
  }
  out.push(S(k.slabOf({ x: 36, y: front, w: 8, d: 1.6, r: 0.8 }, 5, 8, P, 2), { tone: "hi" }));
  out.push(D([at([50, front, 9])], { size: 0.9, tone: "hi" }));
  // Vents on the case top, a row of closed slots.
  for (let i = 0; i < 8; i++) out.push(L(k.lineOnTop([20 + i * 4, CASE.y + 10], [20 + i * 4, CASE.y + 26], CASE_H, P), { tone: "faint" }));
  // Monitor foot: a round swivel base.
  out.push(S(k.cylinder(-8, -12, 22, CASE_H, 3, P, 48), { tone: "lo" }));
  out.push(S(k.cylinder(-8, -12, 12, CASE_H + 3, 3, P, 40), { tone: "mid" }));
  // Monitor: deep rear housing, then the wide front bezel.
  out.push(S(k.slabOf(BACK, MON_Z + 6, MON_H - 14, P, 6, 0.6), { tone: "mid" }));
  for (let i = 0; i < 6; i++) out.push(L(k.lineOnTop([BACK.x + 14 + i * 10, BACK.y + 8], [BACK.x + 14 + i * 10, BACK.y + 30], MON_Z + MON_H - 8, P), { tone: "faint" }));
  out.push(S(k.slabOf(BEZEL, MON_Z, MON_H, P, 4, 1), { tone: "hi" }));
  // Screen: a dark recessed glass, with its inner bevel.
  const glass = [[SCREEN.x0, FACE, SCREEN.z0], [SCREEN.x1, FACE, SCREEN.z0], [SCREEN.x1, FACE, SCREEN.z1], [SCREEN.x0, FACE, SCREEN.z1]].map(at);
  out.push(`<path class="crt-glass" d="${k.pathOf(glass, true)}"/>`);
  out.push(L(k.pathOf(glass, true), { tone: "mid" }));
  const lip = [[SCREEN.x0 - 3, FACE, SCREEN.z0 - 3], [SCREEN.x1 + 3, FACE, SCREEN.z0 - 3], [SCREEN.x1 + 3, FACE, SCREEN.z1 + 3], [SCREEN.x0 - 3, FACE, SCREEN.z1 + 3]].map(at);
  out.push(L(k.pathOf(lip, true), { tone: "faint" }));
  // Bezel controls: brightness knobs and a power switch under the screen.
  for (const x of [22, 30]) out.push(S(k.slabOf({ x: x - 2, y: FACE, w: 4, d: 1.4, r: 1.6 }, MON_Z + 3, 4, P, 3), { tone: "mid" }));
  out.push(k.faceTextSvg(k.sideMatrix([SCREEN.x0, FACE + 0.1], MON_Z + 3.4, P, "left"), "ENGINE 98", { size: 3, tone: "lo" }));
  return out.join("");
}

function screen(P) {
  // Everything here is drawn in the plane of the glass, in screen-local units.
  const w = SCREEN.x1 - SCREEN.x0, h = SCREEN.z1 - SCREEN.z0;
  const m = k.sideMatrix([SCREEN.x0, FACE + 0.2], SCREEN.z1, P, "left");
  const r = (x, y, ww, hh, cls = "crt-ui") => `<rect class="${cls}" x="${x}" y="${y}" width="${ww}" height="${hh}"/>`;
  const ln = (x1, y1, x2, y2, cls = "crt-ink") => `<path class="${cls}" d="M${x1} ${y1}H${x2}V${y2}"/>`;
  const parts = [];
  // Toolbar with play controls.
  parts.push(r(0, 0, w, 5));
  parts.push(`<path class="crt-lit" d="M${w / 2 - 1.5} 1.2l3 1.3-3 1.3z"/>`);
  parts.push(`<path class="crt-ink" d="M${w / 2 + 4} 1.4v2.6M${w / 2 + 5.4} 1.4v2.6"/>`);
  // Hierarchy panel: a tree of rule lines.
  parts.push(r(0, 5, 16, h - 5));
  [[2, 9, 12], [4, 13, 10], [4, 17, 9], [2, 21, 11], [4, 25, 8], [2, 29, 12], [4, 33, 7]].forEach(([x, y, l]) => parts.push(`<path class="crt-ink" d="M${x} ${y}h${l}"/>`));
  // Console strip at the bottom.
  parts.push(r(16, h - 8, w - 16, 8));
  parts.push(`<path class="crt-ink" d="M19 ${h - 4}h24"/><rect class="crt-lit crt-cursor" x="45" y="${h - 5.6}" width="2" height="3.2"/>`);
  // Scene view: a horizon grid and the level's platforms (little isometric blocks).
  const sx = 16, sy = 5;
  for (let i = 1; i < 6; i++) parts.push(`<path class="crt-grid" d="M${sx} ${sy + i * 7}H${w}"/>`);
  for (const [px, py] of PLATFORMS) {
    const x = sx + px, y = sy + py;
    parts.push(`<path class="crt-block" d="M${x - 5} ${y}l5 -2.5 5 2.5 -5 2.5z"/><path class="crt-block-side" d="M${x - 5} ${y}v3l5 2.5v-3zM${x + 5} ${y}v3l-5 2.5v-3z"/>`);
  }
  // The player: a small cube, moved by the live code.
  const [p0x, p0y] = PLATFORMS[0];
  parts.push(`<g data-player transform="translate(${sx + p0x} ${sy + p0y})"><path class="crt-lit" d="M-2.4 -2.6l2.4 -1.2 2.4 1.2v2.8l-2.4 1.2 -2.4 -1.2z"/><path class="crt-ink" d="M-2.4 -2.6l2.4 1.2 2.4 -1.2M0 -1.4v2.8"/></g>`);
  return `<g class="crt-screen" transform="${m}"><clipPath id="crt-clip"><rect width="${w}" height="${h}"/></clipPath><g clip-path="url(#crt-clip)">${parts.join("")}</g></g>`;
}

function desk(P) {
  const at = (p) => k.iso(p, P);
  const out = [];
  // Keyboard: a low slab with a grid of keys and a spacebar.
  out.push(halo(KEYS, 0, 5, P));
  out.push(S(k.slabOf(KEYS, 0, 5, P, 3, 0.6), { tone: "mid" }));
  out.push(D(k.dotGrid(KEYS.x + 6, KEYS.y + 4, 22, 4, 4.2, 5, P), { size: 0.9, tone: "mid" }));
  out.push(S(k.slabOf({ x: KEYS.x + 30, y: KEYS.y + 19, w: 40, d: 3, r: 1 }, 5, 1.2, P, 2), { tone: "hi" }));
  // Mouse on a pad, with its cord running back to the case.
  const pad = { x: 50, y: 44, w: 30, d: 26, r: 2 };
  out.push(S(k.slabOf(pad, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(S(k.slabOf({ x: 60, y: 52, w: 10, d: 14, r: 4.6 }, 0.8, 4, P, 6, 0.4), { tone: "hi" }));
  out.push(L(k.lineOnTop([65, 52], [65, 57], 4.8, P), { tone: "lo" }));
  out.push(k.wireSvg(at([65, 52, 2]), at([52, CASE.y + CASE.d, 2]), { via: [at([66, 40, 0.4]), at([56, 36, 0.4])], tone: "lo", size: 0.9 }));
  // A stack of floppy disks.
  for (let i = 0; i < 3; i++) {
    const f = { x: 76 + i * 1.5, y: -22 - i * 2, w: 30, d: 30, r: 1 };
    out.push(S(k.slabOf(f, i * 2.4, 2.2, P, 2), { tone: i === 2 ? "hi" : "mid" }));
  }
  out.push(L(k.planOutline({ x: 82, y: -24, w: 18, d: 10, r: 0.5 }, 7.2, P, 2), { tone: "lo" }));
  return out.join("");
}

export function build() {
  const pts = [...k.boxCorners(CASE, 0, MON_Z + MON_H), ...k.boxCorners(KEYS, 0, 5), [110, -30, 8]];
  const P = camera(pts, { pad: 28 });
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: "A beige desktop computer with a CRT monitor, keyboard, mouse and a stack of floppy disks on a workbench. The screen shows a game editor in play mode: a cube hops across the platforms of a small level.",
    body: [bench(P, 2017), computer(P), screen(P), desk(P)],
  });
  return { svg, hint: "Hover the screen to jump", readout: "play mode, platform 1 of 5", data: { platforms: PLATFORMS, origin: [16, 5] } };
}
