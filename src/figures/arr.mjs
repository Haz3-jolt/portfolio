// Agentic Resource Registry as a filing cabinet: one column of six drawers, one per kind of
// resource. Open a drawer and dig through its hanging files; each file is a real resource and
// opens its page. The drawer's label plate opens the standard that kind of resource follows.
import * as k from "../lib/iso/iso-kit.mjs";
import { S, L, D, bench, camera, halo, WIDTH, HEIGHT } from "./bench.mjs";
import { DRAWERS as CONTENTS } from "./arr-data.mjs";

const CAB = { x: -44, y: -50, w: 84, d: 100, r: 2 };
const PLINTH = k.insetPlan(CAB, -3);
const PLINTH_H = 7;
const DH = 19; // drawer face height
const GAP = 3;
const ROWS = 6;
const BODY_Z = PLINTH_H;
const BODY_H = ROWS * (DH + GAP) + GAP + 4;
const TOP_Z = BODY_Z + BODY_H;
export const FRONT = CAB.x + CAB.w; // the drawers face +x, the wide visible face
const Y0 = CAB.y + 6, Y1 = CAB.y + CAB.d - 6; // drawer face spans y
const DEPTH = 76; // drawer box depth, longer than the pull so its back never leaves the cabinet
export const PULL = 56;
export const DRAWERS = CONTENTS.map((c, i) => ({ i, z: TOP_Z - 4 - GAP - (i + 1) * (DH + GAP) + GAP, n: c.cards.length }));

function cabinet(P) {
  const at = (p) => k.iso(p, P);
  const out = [halo(PLINTH, 0, PLINTH_H + BODY_H, P)];
  out.push(S(k.slabOf(PLINTH, 0, PLINTH_H, P, 3, 0.6), { tone: "lo" }));
  out.push(S(k.slabOf(CAB, BODY_Z, BODY_H, P, 3, 0.8), { tone: "mid" }));
  const cap = k.insetPlan(CAB, -2.5);
  out.push(S(k.slabOf(cap, TOP_Z, 4, P, 3, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(cap, 5), TOP_Z + 4, P, 3), { tone: "faint" }));
  const screws = k.corners(cap, 7);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 1.8, TOP_Z + 4, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, TOP_Z + 4])), { size: 0.45 }));
  // Side panel seams on the near side.
  for (const z of [BODY_Z + 4, TOP_Z - 3]) out.push(L(k.sideSeam(CAB, z, P, 3), { tone: "faint" }));
  // Dark openings behind each drawer face.
  for (const d of DRAWERS) {
    const r = [[FRONT, Y0 - 1, d.z - 1], [FRONT, Y1 + 1, d.z - 1], [FRONT, Y1 + 1, d.z + DH + 1], [FRONT, Y0 - 1, d.z + DH + 1]].map(at);
    out.push(`<path class="iso-shade" data-shade="0" d="${k.pathOf(r, true)}"/>`, L(k.pathOf(r, true), { tone: "lo" }));
  }
  return out.join("");
}

function folder(P, d, f, n) {
  // A hanging file: a thin board across the drawer with a tab on top, staggered left to right.
  const x = FRONT - 10 - f * Math.min(9, 54 / Math.max(1, n - 1));
  const w = Y1 - Y0 - 10;
  const tabW = 22;
  const tabY = Y0 + 5 + (f % 3) * ((w - tabW) / 2);
  const board = S(k.slabOf({ x, y: Y0 + 5, w: 0.9, d: w, r: 0.2 }, d.z + 2, DH - 6, P, 2), { tone: "hi" });
  const tab = S(k.slabOf({ x, y: tabY, w: 0.9, d: tabW, r: 0.2 }, d.z + DH - 4, 3.6, P, 2), { tone: "hi" });
  // Rails the files hang from, at both ends of the board.
  return `<g data-folder="${f}" data-tab="${x},${tabY + tabW / 2},${d.z + DH}" style="cursor:pointer">${board}${tab}<g data-glow opacity="0">${S(k.slabOf({ x, y: Y0 + 5, w: 0.9, d: w, r: 0.2 }, d.z + 2, DH - 6, P, 2), { tone: "hi", lit: true })}${S(k.slabOf({ x, y: tabY, w: 0.9, d: tabW, r: 0.2 }, d.z + DH - 4, 3.6, P, 2), { tone: "hi", lit: true })}</g></g>`;
}

export function drawer(P, d) {
  const at = (p) => k.iso(p, P);
  const box = { x: FRONT - DEPTH, y: Y0 + 1, w: DEPTH, d: Y1 - Y0 - 2, r: 0.8 };
  const body = [];
  body.push(S(k.slabOf(box, d.z + 0.5, 1.4, P, 2), { tone: "lo" }));
  body.push(S(k.slabOf({ ...box, d: 1.6 }, d.z + 0.5, DH - 4, P, 2), { tone: "mid" })); // far side
  body.push(S(k.slabOf({ ...box, w: 1.6 }, d.z + 0.5, DH - 4, P, 2), { tone: "mid" })); // back
  const folders = [];
  for (let f = d.n - 1; f >= 0; f--) folders.push(folder(P, d, f, d.n));
  body.push(...folders);
  body.push(S(k.slabOf({ x: box.x, y: box.y + box.d - 1.6, w: DEPTH, d: 1.6, r: 0.3 }, d.z + 0.5, DH - 4, P, 2), { tone: "mid" })); // near side
  const front = [];
  front.push(S(k.slabOf({ x: FRONT, y: Y0, w: 2.6, d: Y1 - Y0, r: 0.8 }, d.z, DH, P, 2, 0.5), { tone: "hi" }));
  const fx = FRONT + 2.6;
  front.push(L(k.pathOf([[fx, Y0 + 3, d.z + 3], [fx, Y1 - 3, d.z + 3], [fx, Y1 - 3, d.z + DH - 3], [fx, Y0 + 3, d.z + DH - 3]].map(at), true), { tone: "faint" }));
  // Label plate (links to the standard) and a pull handle.
  const cy = (Y0 + Y1) / 2;
  front.push(`<g data-label style="cursor:pointer">${S(k.slabOf({ x: fx, y: cy - 16, w: 0.8, d: 22, r: 0.3 }, d.z + 7, 8, P, 2), { tone: "mid" })}${k.faceTextSvg(k.sideMatrix([fx + 0.9, cy - 5], d.z + 9.6, P, "right"), CONTENTS[d.i].label, { size: 3.6, tone: "hi", anchor: "middle" })}</g>`);
  front.push(S(k.slabOf({ x: fx, y: cy + 12, w: 3, d: 14, r: 1.3 }, d.z + 8, 3.6, P, 3), { tone: "mid" }));
  return `<g data-drawer="${d.i}"><clipPath id="arr-clip-${d.i}"><path data-clip d="M0 0Z"/></clipPath><g clip-path="url(#arr-clip-${d.i})" data-body>${body.join("")}</g><g data-front style="cursor:pointer">${front.join("")}</g></g>`;
}

export function build() {
  const pts = [...k.boxCorners(PLINTH, 0, TOP_Z + 4), [FRONT + PULL + 4, 0, DRAWERS[0].z + DH]];
  const P = camera(pts, { pad: 26 });
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: "A filing cabinet on a workbench, standing for Agentic Resource Registry. Six drawers hold skills, MCP servers, hooks, prompts, agent files and sandboxes. Open a drawer to dig through its hanging files; each file is a real resource you can open.",
    body: [bench(P, 2026), cabinet(P), `<g data-drawers>${DRAWERS.map((d) => drawer(P, d)).join("")}</g>`],
  });
  return { svg, hint: "", readout: "", data: { P, front: FRONT, y0: Y0, y1: Y1, dh: DH, pull: PULL, drawers: DRAWERS, contents: CONTENTS } };
}
