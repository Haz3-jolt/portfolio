// The shared workbench every chapter's object stands on. Same height, depth, tone and camera in
// every figure, and it bleeds off both edges of each figure, so the chapters read as one long bench.
// Its front edge carries an engraved ruler; the ruler's label is the chapter's year.
import * as k from "../lib/iso/iso-kit.mjs";

export const WIDTH = 640;
export const HEIGHT = 420;
export const AZIMUTH = 38;
export const BENCH = { x: -420, y: -66, w: 840, d: 136, r: 2 };
export const TOP_H = 14;
export const APRON_H = 22;

export const S = (paths, style) => k.solidSvg(paths, style);
export const L = (d, style) => k.lineSvg(d, style);
export const D = (points, style) => k.dotsSvg(points, style);

/** Fit the camera to the object (not the whole bench), so the bench bleeds off both sides. */
export function camera(points, { pad = 26 } = {}) {
  // The front edge of the bench under the object is always in frame.
  const xs = points.map((p) => p[0]);
  const lo = Math.min(...xs) - 10, hi = Math.max(...xs) + 10;
  const front = BENCH.y + BENCH.d;
  return k.fitProjection(
    [...points, [lo, front, -TOP_H - APRON_H], [hi, front, -TOP_H - APRON_H], [lo, front, 0], [hi, front, 0]],
    WIDTH,
    HEIGHT,
    { pad, azimuth: AZIMUTH },
  );
}

export function bench(P, year) {
  const at = (p) => k.iso(p, P);
  const out = [];
  // Worktop: a thick planked slab.
  out.push(S(k.slabOf(BENCH, -TOP_H, TOP_H, P, 3, 1.2), { tone: "mid" }));
  // Plank seams run the full length of the top, edge to edge.
  for (const y of [-24, 18, 50]) out.push(L(k.lineOnTop([BENCH.x, y], [BENCH.x + BENCH.w, y], 0, P), { tone: "faint" }));
  // Apron under the worktop, set back from the front edge.
  const apron = { x: BENCH.x, y: BENCH.y + 10, w: BENCH.w, d: BENCH.d - 22, r: 1 };
  out.unshift(S(k.slabOf(apron, -TOP_H - APRON_H, APRON_H, P, 2), { tone: "lo" }));
  // Ruler strip let into the front edge of the top, with ticks every 5 and a major every 25.
  const strip = { x: BENCH.x, y: BENCH.y + BENCH.d - 12, w: BENCH.w, d: 8, r: 0 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 2), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(BENCH.x + 5, BENCH.x + BENCH.w - 5, 5, 5, strip.y + 0.6, 0.6, [1.8, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  // Engraved year on the strip, near the front-left of the object.
  if (year) out.push(k.faceTextSvg(k.topMatrix([-118, strip.y + 7.2], 0.6, P, "x"), String(year), { size: 5.2, tone: "mid" }));
  // Brass screws along the strip.
  out.push(D([-300, -200, -100, 0, 100, 200, 300].map((x) => at([x, strip.y + 4, 0.6])), { size: 0.45, tone: "lo" }));
  return out.join("");
}

export function halo(plan, z, h, P) {
  return `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
}
