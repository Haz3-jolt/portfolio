// 2023: DASA-Bot as a rotary card index. A student types a question with a nickname ("/cutoff nitt");
// the drum spins to that college's card and lifts it out. That lookup, nickname to college to the
// cutoff data, is what the bot did for 1,000+ students.
import * as k from "../lib/iso/iso-kit.mjs";
import * as G from "../lib/iso/lathe.mjs";
import { S, L, D, bench, camera, halo, WIDTH, HEIGHT } from "./bench.mjs";

export const COLLEGES = [
  ["nitt", "NIT Trichy"], ["nitk", "NIT Surathkal"], ["nitw", "NIT Warangal"], ["iiitd", "IIIT Delhi"],
  ["svnit", "SVNIT Surat"], ["nitc", "NIT Calicut"], ["mnnit", "MNNIT Allahabad"], ["iiith", "IIIT Hyderabad"],
];
export const N = 24; // cards on the drum; the colleges sit every third card
const AX = { x: -18, z: 46 }; // drum axis: along y, through (x, z)
const Y0 = -40, W = 46; // cards span y from Y0 to Y0 + W
const R0 = 7, R1 = 27;
const F = G.frameOf([AX.x, Y0, AX.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
export const TOP = Math.PI / 2 - 0.4; // the angle (in the x-z plane) of the card that faces you
const rot = ([u, v], a) => [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)];

/** Cards for a drum turned by `turn`; the card `lift` (index or -1) slides out by `out`. */
export function cardsSvg(P, turn, lift = -1, out = 0) {
  const V = G.viewOf(P);
  const items = [];
  for (let i = 0; i < N; i++) {
    const a = turn + (i * 2 * Math.PI) / N;
    const r1 = R1 + (i === lift ? out : 0);
    const poly = [[R0, -0.45], [r1, -0.45], [r1, 0.45], [R0, 0.45]].map((q) => rot(q, a));
    const mid = G.pointOf(F, W / 2, (R0 + r1) / 2, a);
    const tabbed = i % 3 === 0;
    let svg = S(G.prismOf(F, poly, 0.6, W - 0.6, P), { tone: i === lift ? "hi" : tabbed ? "hi" : "mid", lit: i === lift && out > 0.5 });
    if (tabbed) {
      // A tab on the outer edge of each college card.
      const tab = [[r1, -0.45], [r1 + 3, -0.45], [r1 + 3, 0.45], [r1, 0.45]].map((q) => rot(q, a));
      const s0 = 4 + ((i / 3) % 3) * 15;
      svg += S(G.prismOf(F, tab, s0, s0 + 12, P), { tone: "hi", lit: i === lift && out > 0.5 });
    }
    items.push({ depth: G.dot3(mid, V), svg });
  }
  return items.sort((p, q) => p.depth - q.depth).map((it) => it.svg).join("");
}

function stand(P) {
  const at = (p) => k.iso(p, P);
  const out = [];
  const base = { x: AX.x - 26, y: Y0 - 14, w: 52, d: W + 28, r: 3 };
  out.push(halo(base, 0, 5, P));
  out.push(S(k.slabOf(base, 0, 5, P, 4, 0.8), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(base, 4), 5, P, 4), { tone: "faint" }));
  // Far upright and far wheel (behind the cards).
  out.push(S(k.slabOf({ x: AX.x - 5, y: Y0 - 10, w: 10, d: 4, r: 1 }, 5, AX.z - 5, P, 2, 0.4), { tone: "mid" }));
  out.push(S(G.disc(-4, -0.4, R0 + 2, F, P), { tone: "mid" }));
  return out.join("");
}

function nearSide(P) {
  const out = [];
  out.push(S(G.disc(W + 0.4, W + 4, R0 + 2, F, P), { tone: "mid" }));
  out.push(S(k.slabOf({ x: AX.x - 5, y: Y0 + W + 6, w: 10, d: 4, r: 1 }, 5, AX.z - 5, P, 2, 0.4), { tone: "mid" }));
  // Knurled knob on the near end of the axle.
  out.push(S(G.disc(W + 10, W + 16, 5, F, P), { tone: "hi" }));
  out.push(S(G.disc(W + 4, W + 10, 1.6, F, P), { tone: "mid" }));
  return out.join("");
}

function terminal(P) {
  const at = (p) => k.iso(p, P);
  const out = [];
  const kb = { x: 34, y: 26, w: 26, d: 38, r: 2 };
  out.push(halo(kb, 0, 4, P));
  out.push(S(k.slabOf(kb, 0, 4, P, 3, 0.5), { tone: "mid" }));
  out.push(D(k.dotGrid(kb.x + 4, kb.y + 4, 5, 8, 4.4, 4, P), { size: 0.8, tone: "mid" }));
  // A small screen standing behind the keyboard, facing +x, with the question and the answer.
  const scr = { x: 24, y: 20, w: 4, d: 46, r: 1 };
  out.push(S(k.slabOf(scr, 0, 40, P, 2, 0.4), { tone: "hi" }));
  const fx = scr.x + scr.w;
  const m = k.sideMatrix([fx + 0.1, scr.y + 3], 37, P, "right");
  out.push(`<g transform="${m}"><rect class="crt-glass" x="${-(scr.d - 6)}" width="${scr.d - 6}" height="34"/>` +
    `<text data-q class="screen-text" x="${-(scr.d - 8)}" y="8" font-size="3.6">/cutoff nitt</text>` +
    `<text data-a class="screen-text" x="${-(scr.d - 8)}" y="16" font-size="3.6"></text>` +
    `<text data-u class="screen-text dim" x="${-(scr.d - 8)}" y="30" font-size="3">1,024 students helped</text></g>`);
  return out.join("");
}

export function build() {
  const pts = [[AX.x - 30, Y0 - 16, 0], [AX.x - 30, Y0 + W + 20, 0], [AX.x + R1 + 6, 0, AX.z], [AX.x, Y0, AX.z + R1 + 8], [62, 26, 0], [62, 66, 0], [28, 20, 42]];
  const P = camera(pts, { pad: 22 });
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: "A rotary card index standing for DASA-Bot. A student types /cutoff with a college nickname on a small terminal, the drum spins to that college's card and lifts it out, and a counter shows more than a thousand students helped.",
    body: [bench(P, 2023), stand(P), `<g data-cards>${cardsSvg(P, TOP)}</g>`, nearSide(P), terminal(P)],
  });
  return { svg, hint: "", readout: "/cutoff nitt, NIT Trichy", data: { P, colleges: COLLEGES, n: N, top: TOP } };
}
