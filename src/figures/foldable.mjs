// 2025: GSoC, Tablet & Chromebook UI. A foldable unfolds from a phone into a tablet and the app
// splits into two resizable panes; the divider drags (that's ResizablePaneManager). Beside it, a
// Chromebook running the same two-pane layout, with a right-click menu open.
import * as k from "../lib/iso/iso-kit.mjs";
import * as G from "../lib/iso/lathe.mjs";
import { S, L, D, bench, camera, halo, WIDTH, HEIGHT } from "./bench.mjs";

export const DEV = { x0: -96, w: 40, y: -12, d: 60, t: 3, hinge: -56 }; // hinge at x = x0 + w
const LAP = { x: 2, y: -40, w: 92, d: 58, r: 2 };
const LID_H = 58;

export function halfPaths(P, phi) {
  // The right half of the foldable, turned about the hinge (along y) by phi: 0 flat, PI closed.
  const { hinge, y, d, t, w } = DEV;
  const F = G.frameOf([hinge, y, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const rect = [[0, 0], [w, 0], [w, t], [0, t]];
  const c = Math.cos(phi), s = Math.sin(phi);
  const poly = rect.map(([u, v]) => [u * c - (v - t) * s, t + u * s + (v - t) * c]);
  return G.prismOf(F, poly, 0, d, P);
}

function foldable(P) {
  const at = (p) => k.iso(p, P);
  const { x0, y, d, t, w, hinge } = DEV;
  const out = [halo({ x: x0, y, w: w * 2, d, r: 3 }, 0, t, P)];
  // Left half lies flat; its top face is the screen.
  out.push(S(k.slabOf({ x: x0, y, w, d, r: 3 }, 0, t, P, 4, 0.5), { tone: "hi" }));
  // Hinge barrel along the fold.
  const F = G.frameOf([hinge, y + 1, t / 2], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  out.push(S(G.disc(0, d - 2, t / 2 + 0.4, F, P), { tone: "mid" }));
  // Screens drawn in the plane of each half's top face.
  const left = k.topMatrix([x0 + 2, y + 2], t, P, "x");
  out.push(`<g class="fold-screen" transform="${left}"><rect class="crt-glass" width="${w - 2}" height="${d - 4}" rx="1.5"/><g data-pane-left></g></g>`);
  out.push(`<g data-half>${S(halfPaths(P, Math.PI), { tone: "hi" })}</g>`);
  const right = k.topMatrix([hinge, y + 2], t, P, "x");
  out.push(`<g class="fold-screen" data-right-screen transform="${right}" opacity="0"><rect class="crt-glass" width="${w - 2}" height="${d - 4}" rx="1.5"/><g data-pane-right></g></g>`);
  out.push(`<g data-divider transform="${left}" opacity="0"></g>`);
  return out.join("");
}

function laptop(P) {
  const at = (p) => k.iso(p, P);
  const out = [halo(LAP, 0, 5, P)];
  out.push(S(k.slabOf(LAP, 0, 5, P, 4, 0.6), { tone: "mid" }));
  out.push(D(k.dotGrid(LAP.x + 10, LAP.y + 22, 18, 5, 4, 5, P), { size: 0.85, tone: "mid" }));
  out.push(S(k.slabOf({ x: LAP.x + 30, y: LAP.y + 44, w: 32, d: 10, r: 1 }, 5, 0.3, P, 2), { tone: "lo", crease: "none" }));
  // Lid standing at the back edge, its front face the screen.
  const lid = { x: LAP.x, y: LAP.y, w: LAP.w, d: 3, r: 1 };
  out.push(S(k.slabOf(lid, 5, LID_H, P, 3, 0.4), { tone: "mid" }));
  const face = LAP.y + 3;
  const sw = LAP.w - 8, sh = LID_H - 9;
  const m = k.sideMatrix([LAP.x + 4, face + 0.1], 5 + LID_H - 4, P, "left");
  const rules = (x, y, n, len, gap = 4) => Array.from({ length: n }, (_, i) => `<path class="crt-ink" d="M${x} ${y + i * gap}h${len - (i % 3) * 4}"/>`).join("");
  out.push(`<g transform="${m}"><rect class="crt-glass" width="${sw}" height="${sh}"/>` +
    `<rect class="crt-ui" width="${sw}" height="4"/>` +
    `<rect class="crt-ui" x="0" y="4" width="30" height="${sh - 4}"/>${rules(3, 9, 8, 22)}` +
    `<path class="fold-divider" d="M30 4V${sh}"/>${rules(34, 9, 9, 44)}` +
    // Right-click context menu with the pointer.
    `<rect class="fold-menu" x="52" y="18" width="24" height="18" rx="1"/>${rules(55, 22, 4, 18, 3.8)}<rect class="crt-lit" x="53" y="25.6" width="1.4" height="2.4"/>` +
    `<path class="fold-pointer" d="M50 15l0 6 1.6-1.6 1.2 2.6 1-0.5-1.2-2.5 2.2 0z"/></g>`);
  // Lid seam and a webcam dot.
  out.push(D([at([LAP.x + LAP.w / 2, face + 0.1, 5 + LID_H - 2])], { size: 0.5, tone: "hi" }));
  return out.join("");
}

export function build() {
  const pts = [[DEV.x0, DEV.y, 0], [DEV.x0, DEV.y + DEV.d, 0], [DEV.hinge + DEV.w, DEV.y + DEV.d, 0], ...k.boxCorners(LAP, 0, 5 + LID_H), [DEV.hinge, DEV.y, DEV.w + 4]];
  const P = camera(pts, { pad: 26 });
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: "A foldable phone unfolding into a tablet on a workbench, its screen splitting into two resizable panes whose divider slides back and forth. Beside it, a Chromebook shows the same two-pane layout with a right-click menu open. This is the Tablet and Chromebook UI built for AnkiDroid during Google Summer of Code 2025.",
    body: [bench(P, 2025), laptop(P), foldable(P)],
  });
  return { svg, hint: "Hover to unfold", readout: "phone · folded", data: { P, dev: DEV } };
}
