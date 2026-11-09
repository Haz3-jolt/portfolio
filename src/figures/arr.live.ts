import { animate } from "animejs";
import { iso, translateAlong } from "../lib/iso/iso-kit.mjs";

type Card = { name: string; from: string; href: string };
type Content = { label: string; title: string; standard: { name: string; href: string }; cards: Card[] };
type Data = { P: any; front: number; y0: number; y1: number; dh: number; pull: number; drawers: { i: number; z: number; n: number }[]; contents: Content[] };

function hull(points: number[][]) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: number[][] = [], hi: number[][] = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
}

export default function mount(root: HTMLElement, data: Data, ctx: { still: boolean; say: (t: string) => void; onVisible: (fn: (v: boolean) => void) => void }) {
  const svg = root.querySelector("svg")!;
  const host = svg.querySelector<SVGGElement>("[data-drawers]")!;
  const LIFT = 9;
  const els = data.drawers.map((d) => {
    const g = svg.querySelector<SVGGElement>(`[data-drawer="${d.i}"]`)!;
    const folders = [...g.querySelectorAll<SVGGElement>("[data-folder]")].map((el) => ({ el, f: Number(el.dataset.folder), tab: el.dataset.tab!.split(",").map(Number), up: 0, anim: null as any }));
    return { d, g, clip: g.querySelector<SVGPathElement>("[data-clip]")!, folders, out: 0, anim: null as any };
  });

  // A small floating tag over the lifted file: its name and where it lives. Not a card.
  const art = root.closest(".art") as HTMLElement;
  art.style.position = "relative";
  const tag = document.createElement("a");
  tag.className = "arr-tag";
  tag.target = "_blank";
  tag.rel = "noopener";
  art.appendChild(tag);

  const drawEl = (e: (typeof els)[number]) => {
    e.g.setAttribute("transform", translateAlong(data.P, [e.out, 0, 0]));
    if (e.out < 0.3) { e.clip.setAttribute("d", "M0 0Z"); return; }
    // Show only what sticks out of the cabinet: x from the face back by the travel, in the drawer's frame.
    const pts: number[][] = [];
    for (const x of [data.front - e.out, data.front + 0.4]) for (const y of [data.y0 - 0.5, data.y1 + 0.5]) for (const z of [e.d.z, e.d.z + data.dh + LIFT + 6]) pts.push(iso([x, y, z], data.P));
    e.clip.setAttribute("d", "M" + hull(pts).map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L") + "Z");
  };
  const drawFolder = (fo: { el: SVGGElement; up: number }) => {
    fo.el.setAttribute("transform", translateAlong(data.P, [0, 0, fo.up]));
    (fo.el.querySelector("[data-glow]") as SVGGElement).setAttribute("opacity", String(Math.min(1, fo.up / LIFT)));
  };

  let current = -1, picked = -1;
  const placeTag = () => {
    if (current < 0 || picked < 0) { tag.style.opacity = "0"; return; }
    const e = els[current];
    const fo = e.folders.find((x) => x.f === picked)!;
    const card = data.contents[current].cards[picked];
    const [x, y, z] = fo.tab;
    const [sx, sy] = iso([x + e.out, y, z + LIFT + 4], data.P);
    const pt = svg.createSVGPoint();
    pt.x = sx; pt.y = sy;
    const m = svg.getScreenCTM();
    const a = art.getBoundingClientRect();
    if (!m) return;
    const c = pt.matrixTransform(m);
    tag.innerHTML = `<b>${card.name}</b><span>${card.from}</span>`;
    tag.href = card.href;
    tag.style.left = `${c.x - a.left}px`;
    tag.style.top = `${c.y - a.top}px`;
    tag.style.opacity = "1";
  };
  const pick = (f: number) => {
    if (current < 0) return;
    const e = els[current];
    picked = Math.max(0, Math.min(e.folders.length - 1, f));
    for (const fo of e.folders) {
      fo.anim?.pause();
      const target = fo.f === picked ? LIFT : 0;
      if (ctx.still) { fo.up = target; drawFolder(fo); continue; }
      fo.anim = animate(fo, { up: target, duration: target ? 320 : 220, ease: "out(3)", onUpdate: () => { drawFolder(fo); placeTag(); } });
    }
    placeTag();
    const card = data.contents[current].cards[picked];
    ctx.say(`${data.contents[current].title}: ${card.name}, from ${card.from}`);
  };
  const close = (e: (typeof els)[number], then?: () => void) => {
    e.anim?.pause();
    e.folders.forEach((fo) => { fo.anim?.pause(); fo.up = 0; drawFolder(fo); });
    if (ctx.still) { e.out = 0; drawEl(e); then?.(); return; }
    e.anim = animate(e, { out: 0, duration: 300, ease: "inOut(3)", onUpdate: () => drawEl(e), onComplete: then });
  };
  const open = (i: number) => {
    if (i === current) return;
    const prev = els[current];
    current = i;
    picked = -1;
    tag.style.opacity = "0";
    const next = els[i];
    const go = () => {
      // Order: drawers above the open one, then those below it, then the open one last (nearest).
      host.appendChild(next.g);
      next.anim?.pause();
      if (ctx.still) { next.out = data.pull; drawEl(next); pick(0); return; }
      next.anim = animate(next, { out: data.pull, duration: 620, ease: "out(4)", onUpdate: () => { drawEl(next); placeTag(); }, onComplete: () => pick(0) });
    };
    prev ? close(prev, go) : go();
  };

  // Touch: the first tap on a file lifts it, a second tap opens it (there's no hover on a phone).
  let lastPointer = "mouse";
  svg.addEventListener("pointerdown", (ev) => { lastPointer = ev.pointerType; });
  svg.addEventListener("click", (ev) => {
    const t = ev.target as Element;
    const g = t.closest?.("[data-drawer]");
    if (!g) return;
    const i = Number(g.getAttribute("data-drawer"));
    if (t.closest("[data-label]") && i === current) { window.open(data.contents[i].standard.href, "_blank", "noopener"); return; }
    const folderEl = t.closest("[data-folder]");
    if (folderEl && i === current) {
      const f = Number(folderEl.getAttribute("data-folder"));
      if (lastPointer !== "mouse" && f !== picked) { pick(f); return; }
      window.open(data.contents[i].cards[f].href, "_blank", "noopener");
      return;
    }
    open(i);
  });
  svg.addEventListener("pointerover", (ev) => {
    if (ev.pointerType !== "mouse") return;
    const folderEl = (ev.target as Element).closest?.("[data-folder]");
    const g = folderEl?.closest("[data-drawer]");
    if (folderEl && g && Number(g.getAttribute("data-drawer")) === current) {
      const f = Number(folderEl.getAttribute("data-folder"));
      if (f !== picked) pick(f);
    }
  });
  root.addEventListener("keydown", (ev) => {
    const i = Math.max(0, current);
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { ev.preventDefault(); open((i + (ev.key === "ArrowDown" ? 1 : -1) + els.length) % els.length); }
    else if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); pick(picked + (ev.key === "ArrowRight" ? 1 : -1)); }
    else if (ev.key === "Enter" && current >= 0 && picked >= 0) { window.open(data.contents[current].cards[picked].href, "_blank", "noopener"); }
  });
  addEventListener("resize", placeTag);
  ctx.onVisible(() => {});
  els.forEach(drawEl);
  open(0);
}
