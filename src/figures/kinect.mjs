// 2021: Python, a bit of ML and OpenCV. A Kinect-style depth sensor watches a hand that waves hello;
// the tracker's skeleton (finger joints) rides on the hand and depth rays run from the sensor's lens.
import * as k from "../lib/iso/iso-kit.mjs";
import * as G from "../lib/iso/lathe.mjs";
import { S, L, D, bench, camera, halo, WIDTH, HEIGHT } from "./bench.mjs";

const HAND = { x: 34, y: 6 }; // the arm stands at this floor point
const ELBOW_Z = 8;
const T = 4; // hand thickness along x
const SENSOR = { x: -78, y: -6 };
const LENS = [SENSOR.x + 7, SENSOR.y + 18, 23.5]; // the depth camera

// A stadium (rounded bar) from a to b in the hand plane (u = y, v = z), as a convex polygon.
function stadium(a, b, r, n = 8) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = ang - Math.PI / 2 - (Math.PI * i) / n; pts.push([a[0] + r * Math.cos(t), a[1] + r * Math.sin(t)]); }
  for (let i = 0; i <= n; i++) { const t = ang + Math.PI / 2 - (Math.PI * i) / n; pts.push([b[0] + r * Math.cos(t), b[1] + r * Math.sin(t)]); }
  return pts;
}
const rot = ([u, v], th) => [u * Math.cos(th) - v * Math.sin(th), u * Math.sin(th) + v * Math.cos(th)];

// The hand in its own plane, pivoting at the elbow (origin). Returns the pieces and the joints.
function handPieces(th, spread = 0) {
  const W = 46; // forearm length: elbow to wrist
  const fingers = [[-7.2, 13, -0.1], [-2.4, 16, -0.03], [2.4, 15, 0.03], [7, 12, 0.1]];
  const pieces = [{ poly: stadium([0, 0], [0, W], 5.2), tone: "mid" }];
  const palm = k.ringOf({ x: -9.5, y: W + 1, w: 19, d: 21, r: 5 }, 4).map(([u, v]) => [u, v]);
  pieces.push({ poly: palm, tone: "hi" });
  const joints = [[0, W + 3]];
  for (const [u, len, a] of fingers) {
    const base = [u, W + 19];
    const dir = [Math.sin(a * (1 + spread)), Math.cos(a * (1 + spread))];
    const tip = [base[0] + dir[0] * len, base[1] + dir[1] * len];
    pieces.push({ poly: stadium(base, tip, 2.2), tone: "hi" });
    joints.push(base, [base[0] + dir[0] * len * 0.55, base[1] + dir[1] * len * 0.55], tip);
  }
  const tb = [-8.5, W + 8], ta = -1.0 - spread * 0.2;
  const tt = [tb[0] + Math.sin(ta) * 12, tb[1] + Math.cos(ta) * 12];
  pieces.push({ poly: stadium(tb, tt, 2.6), tone: "hi" });
  joints.push(tb, tt);
  return { pieces: pieces.map((p) => ({ ...p, poly: p.poly.map((q) => rot(q, th)) })), joints: joints.map((q) => rot(q, th)) };
}

const F = G.frameOf([HAND.x, HAND.y, ELBOW_Z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const toWorld = ([u, v], s = 0) => [HAND.x + s, HAND.y + u, ELBOW_Z + v];

/** The hand, rays and skeleton for a wave angle th. Rebuilt every frame by the live code. */
export function handSvg(P, th, spread = 0) {
  const { pieces, joints } = handPieces(th, spread);
  const out = [];
  // Depth rays from the lens to the fingertips: the sensor reading the hand.
  const tips = [3, 6, 9, 12, 14].map((i) => joints[i]);
  out.push(tips.map((q) => L(k.segment(LENS, toWorld(q, -T / 2), P), { tone: "lit", dashed: true })).join(""));
  // Arm and hand: forearm first (it is behind the palm), fingers over the palm.
  for (const p of pieces) out.push(S(G.prismOf(F, p.poly, -T / 2, T / 2, P), { tone: p.tone }));
  // Tracking skeleton on the near face of the hand.
  const near = (q) => k.iso(toWorld(q, T / 2 + 0.2), P);
  const bones = [];
  for (let f = 0; f < 4; f++) bones.push([joints[0], joints[1 + f * 3], joints[2 + f * 3], joints[3 + f * 3]]);
  bones.push([joints[0], joints[13], joints[14]]);
  out.push(bones.map((b) => `<path class="bone" d="${k.pathOf(b.map(near))}"/>`).join(""));
  out.push(`<g class="joints">${joints.map((q) => { const [x, y] = near(q); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.3"/>`; }).join("")}</g>`);
  return out.join("");
}

function sensor(P) {
  const at = (p) => k.iso(p, P);
  const out = [];
  const base = { x: SENSOR.x - 10, y: SENSOR.y - 12, w: 20, d: 24, r: 4 };
  out.push(halo(base, 0, 3, P));
  out.push(S(k.slabOf(base, 0, 3, P, 5, 0.5), { tone: "lo" }));
  out.push(S(k.cylinder(SENSOR.x, SENSOR.y, 3, 3, 14, P, 20), { tone: "mid" }));
  const bar = { x: SENSOR.x - 6, y: SENSOR.y - 34, w: 13, d: 68, r: 5 };
  out.push(S(k.slabOf(bar, 17, 13, P, 6, 0.8), { tone: "hi" }));
  // Front face: IR projector, colour camera and depth camera, and the status LED.
  const fx = bar.x + bar.w;
  for (const [y, r] of [[SENSOR.y - 18, 3.2], [SENSOR.y, 2.6], [SENSOR.y + 18, 3.2]]) {
    out.push(`<path class="crt-glass" d="${k.sideRing([fx, y, 23.5], r, "x", P, 22)}"/>`);
    out.push(L(k.sideRing([fx, y, 23.5], r, "x", P, 22), { tone: "mid" }));
  }
  const [lx, ly] = at([fx, SENSOR.y + 8, 23.5]);
  out.push(`<circle class="led" data-on cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="0.9"/>`);
  out.push(L(k.sideSeam(bar, 19, P, 6), { tone: "faint" }));
  // Cable from the base off along the bench.
  out.push(k.wireSvg(at([base.x, SENSOR.y, 1.5]), at([base.x - 40, SENSOR.y - 30, 0.4]), { via: [at([base.x - 18, SENSOR.y - 4, 0.4])], tone: "lo", size: 0.8, ends: "from" }));
  return out.join("");
}

function elbowRest(P) {
  const pad = { x: HAND.x - 9, y: HAND.y - 9, w: 18, d: 18, r: 6 };
  return halo(pad, 0, ELBOW_Z, P) + S(k.slabOf(pad, 0, ELBOW_Z - 2, P, 6, 0.6), { tone: "lo" }) + S(k.cylinder(HAND.x, HAND.y, 5.6, ELBOW_Z - 2, 2.4, P, 24), { tone: "mid" });
}

export function build() {
  const pts = [[SENSOR.x - 12, -40, 0], [SENSOR.x - 12, 40, 32], [HAND.x + 4, -26, 0], [HAND.x + 4, 34, 0], [HAND.x, HAND.y, ELBOW_Z + 98], [HAND.x, HAND.y - 30, 90], [HAND.x, HAND.y + 30, 90]];
  const P = camera(pts, { pad: 22 });
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: "A Kinect-style depth sensor on a workbench watching a raised hand that waves hello. Dashed depth rays run from the sensor's lens to the fingertips, and the tracker's skeleton of finger joints moves with the hand.",
    body: [bench(P, 2021), sensor(P), elbowRest(P), `<g data-hand>${handSvg(P, 0)}</g>`],
  });
  return { svg, hint: "", readout: "tracking, hand found, waving", data: { P } };
}
