// 2019: the CS50 robot. A U-shaped vinyl track with black boundary lines (from the repo's track
// drawing: 250 × 300 cm, 50 cm lane, a parking box between the 1st and 2nd end lines). The bot
// wanders down the lane, turning away from the boundary and around obstacles, and parks in the box.
import * as k from "../lib/iso/iso-kit.mjs";
import * as G from "../lib/iso/lathe.mjs";
import { S, L, D, bench, camera, halo, WIDTH, HEIGHT } from "./bench.mjs";

const SC = 0.46; // world units per cm
const R = 125 * SC, r = 75 * SC, LANE = (R + r) / 2; // outer, inner and centre-line radii
const C = [-34, 0]; // centre of the arch; the legs run toward +x
const LEG = 175 * SC;
const END = C[0] + LEG; // closed end of both legs
const LINE1 = END - 30 * SC; // 1st end line on the parking leg
const BAND = 2.6; // boundary line width
const MAT = { x: C[0] - R - 8, y: -R - 6, w: R + LEG + 14, d: 2 * R + 12, r: 2 };

// Centre line: start leg (y < 0) toward the arch, round the arch, back down the parking leg.
const STRAIGHT = END - 6 - C[0];
const ARC = Math.PI * LANE;
export const TOTAL = STRAIGHT + ARC + (LINE1 + (END - LINE1) / 2 - C[0]);
export function centre(s) {
  if (s <= STRAIGHT) return { x: END - 6 - s, y: -LANE, hx: -1, hy: 0 };
  s -= STRAIGHT;
  if (s <= ARC) {
    const a = -Math.PI / 2 - s / LANE; // from -90° through 180° to 90°
    return { x: C[0] + LANE * Math.cos(a), y: LANE * Math.sin(a), hx: Math.sin(a), hy: -Math.cos(a) };
  }
  s -= ARC;
  return { x: C[0] + s, y: LANE, hx: 1, hy: 0 };
}
// Obstacles live in the world (they can be dragged and knocked over). Each one is projected onto the
// lane's centre line, and the bot's lateral offset bends away from it as it passes.
const HALF = (R - r) / 2; // lane half-width
export const BOT_HALF = 3.8; // the bot's half-width
export const OB_R = 2.6;
const REACH = HALF - BOT_HALF - 0.4; // how far off-centre the bot can steer
const SAMPLES = Array.from({ length: Math.ceil(TOTAL) + 1 }, (_, i) => ({ s: i, ...centre(Math.min(i, TOTAL)) }));
export function project(x, y) {
  let best = SAMPLES[0], d = Infinity;
  for (const p of SAMPLES) { const e = (p.x - x) ** 2 + (p.y - y) ** 2; if (e < d) { d = e; best = p; } }
  // Signed lateral offset (positive to the left of travel).
  return { s: best.s, l: (x - best.x) * -best.hy + (y - best.y) * best.hx };
}
export const START_OBSTACLES = [[26, 4], [TOTAL * 0.48, -5], [STRAIGHT + ARC + 22, 3]].map(([s0, l]) => { const c = centre(s0); return { x: c.x - c.hy * l, y: c.y + c.hx * l, up: true }; });
export function offset(s, obstacles = START_OBSTACLES) {
  let o = 4.5 * Math.sin(s * 0.09);
  for (const ob of obstacles) {
    if (!ob.up) continue;
    const { s: so, l } = project(ob.x, ob.y);
    if (Math.abs(l) > HALF + OB_R) continue; // off the track
    const need = OB_R + BOT_HALF + 0.8;
    const target = Math.max(-REACH, Math.min(REACH, l >= 0 ? l - need : l + need));
    const w = Math.exp(-(((s - so) / 11) ** 2));
    o = o * (1 - w) + target * w;
  }
  const park = TOTAL - s;
  return o * Math.min(1, Math.max(0, park / 14));
}
export function pose(s, obstacles) {
  const c = centre(s), c2 = centre(Math.min(TOTAL, s + 1.5));
  const o = offset(s, obstacles), o2 = offset(Math.min(TOTAL, s + 1.5), obstacles);
  const px = c.x - c.hy * o, py = c.y + c.hx * o;
  const qx = c2.x - c2.hy * o2, qy = c2.y + c2.hx * o2;
  const th = Math.atan2(qy - py, qx - px);
  return { x: px, y: py, th: Number.isFinite(th) && Math.hypot(qx - px, qy - py) > 1e-3 ? th : Math.atan2(c.hy, c.hx) };
}

const arcPts = (rad, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / n); return [C[0] + rad * Math.cos(a), rad * Math.sin(a)]; });
// One U-shaped boundary band between radii r0 < r1.
function uBand(r0, r1) {
  const outer = [[END, -r1], ...arcPts(r1, -Math.PI / 2, -Math.PI * 1.5).slice(0), [END, r1]];
  const inner = [[END, r0], ...arcPts(r0, -Math.PI * 1.5, -Math.PI / 2), [END, -r0]];
  return [...outer, ...inner];
}

function track(P) {
  const at = (p) => k.iso(p, P);
  const out = [halo(MAT, 0, 1, P)];
  out.push(S(k.slabOf(MAT, 0, 1.2, P, 3), { tone: "hi", crease: "none" }));
  const ink = (pts) => `<path class="track-ink" d="${k.onTop(pts, 1.2, P, true)}"/>`;
  out.push(ink(uBand(R, R + BAND)));
  out.push(ink(uBand(r - BAND, r)));
  // Start line closing the start leg, 1st end line and 2nd end line on the parking leg.
  out.push(ink([[END, -R], [END + BAND, -R], [END + BAND, -r], [END, -r]]));
  out.push(ink([[END, r], [END + BAND, r], [END + BAND, R], [END, R]]));
  out.push(ink([[LINE1, r], [LINE1 + BAND, r], [LINE1 + BAND, R], [LINE1, R]]));
  // Corner screws on the mat and a small engraved scale bar: 50 cm.
  out.push(D(k.corners(MAT, 4).map(([x, y]) => at([x, y, 1.2])), { size: 0.5 }));
  out.push(L(k.lineOnTop([MAT.x + 6, MAT.y + 6], [MAT.x + 6 + 50 * SC, MAT.y + 6], 1.2, P), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([MAT.x + 6, MAT.y + 11], 1.2, P, "x"), "50 cm", { size: 3, tone: "mid" }));
  return out.join("");
}

/** One obstacle: a peg standing up, or knocked over and lying on its side. */
export function obstacleSvg(P, ob, i) {
  const depth = k.depthOf([ob.x, ob.y, 0], P).toFixed(2);
  let body;
  if (ob.up) body = S(k.cylinder(ob.x, ob.y, OB_R, 1.2, 9, P, 24, 0.4), { tone: "mid" }) + L(k.ring(ob.x, ob.y, 1.5, 10.2, P, 18), { tone: "lo" });
  else {
    const a = ob.fall ?? 0.6;
    const F = G.frameOf([ob.x, ob.y, 1.2 + OB_R], [Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1]);
    body = S(G.disc(-1, 8, OB_R, F, P), { tone: "mid" });
  }
  return `<g data-ob="${i}" data-depth="${depth}" style="cursor:grab">${body}</g>`;
}

// The bot, built at a pose (x, y, heading th). Rebuilt every frame by the live code.
export function botSvg(P, x, y, th, hop = 0) {
  const cos = Math.cos(th), sin = Math.sin(th);
  const K = 0.76; // the bot is drawn at 76% so it fits the 50 cm lane with room to steer
  const W = (u, v) => [x + K * (u * cos - v * sin), y + K * (u * sin + v * cos)];
  const box = (u0, v0, w, d, rr = 1) => k.ringOf({ x: u0, y: v0, w, d, r: rr }, 3).map(([u, v]) => W(u, v));
  const solid = (ring, z, h, tone, extra = {}) => S(k.extrude(ring, z * K + hop, h * K, P, { bevel: 0.3 }), { tone, ...extra });
  const wheel = (side) => {
    const [cx, cy] = W(-1, side * 6.2);
    const F = G.frameOf([cx, cy, 3.2 * K + hop], [-sin * side, cos * side, 0], [cos, sin, 0], [0, 0, 1]);
    return S(G.disc(0, 2 * K, 3.2 * K, F, P), { tone: "lo" });
  };
  const parts = [];
  const nearSide = Math.sin(th - Math.atan2(1, 1)) > 0 ? -1 : 1;
  parts.push(`<path class="iso-halo" d="${k.extrude(box(-7, -5, 14, 10, 3), 0.2, 0.1, P).fill}" style="filter:blur(3px)"/>`);
  parts.push(wheel(-nearSide));
  parts.push(S(G.sphereOf([...W(5, 0), 1.6 * K + hop], 1.4 * K, P), { tone: "mid" }));
  parts.push(solid(box(-7, -5, 14, 10, 3), 2.4, 1.4, "hi"));
  parts.push(solid(box(-6, -3.5, 4, 7, 0.6), 3.8, 3.6, "lo"));
  parts.push(solid(box(-1, -3, 6, 6, 0.5), 5.4, 0.8, "hi", { lit: true }));
  parts.push(solid(box(5, -3.6, 1.8, 7.2, 0.4), 3.8, 3.2, "mid"));
  parts.push(wheel(nearSide));
  return parts.join("");
}

export function build() {
  const pts = [...k.boxCorners(MAT, 0, 12)];
  const P = camera(pts, { pad: 22 });
  const p0 = pose(0, START_OBSTACLES);
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: "A U-shaped robot track on a workbench, drawn from the original CS50 project: a 50 centimetre lane bounded by black lines, with obstacles in the lane and a parking box between two end lines. A small Arduino bot wanders down the lane, turning away from the boundary lines and around the obstacles, and parks in the box.",
    body: [bench(P, 2019), track(P), `<g data-scene>${START_OBSTACLES.map((ob, i) => obstacleSvg(P, ob, i)).join("")}<g data-bot style="cursor:pointer">${botSvg(P, p0.x, p0.y, p0.th)}</g></g>`],
  });
  return { svg, hint: "", readout: "wandering · avoiding the boundary", data: { P, total: TOTAL, obstacles: START_OBSTACLES } };
}
