import { createTimeline } from "animejs";
import { solidSvg } from "../lib/iso/iso-kit.mjs";
import { halfPaths } from "./foldable.mjs";

type Data = { P: any; dev: { x0: number; w: number; y: number; d: number; t: number; hinge: number } };

export default function mount(root: HTMLElement, data: Data, ctx: any) {
  const { w, d } = data.dev;
  const half = root.querySelector<SVGGElement>("[data-half]")!;
  const rightScreen = root.querySelector<SVGGElement>("[data-right-screen]")!;
  const paneL = root.querySelector<SVGGElement>("[data-pane-left]")!;
  const paneR = root.querySelector<SVGGElement>("[data-pane-right]")!;
  const sh = d - 4, total = 2 * w - 4; // tablet screen width across both halves
  const s = { phi: Math.PI, show: 0, split: 0.42 };

  const rules = (x: number, y: number, n: number, len: number, gap = 4.4) =>
    Array.from({ length: n }, (_, i) => `<path class="crt-ink" d="M${x.toFixed(2)} ${y + i * gap}h${Math.max(2, len - (i % 3) * 3).toFixed(2)}"/>`).join("");
  const panes = (split: number, show: number) => {
    // Phone (folded): one pane fills the left screen. Tablet: deck list | editor + previewer.
    if (show < 0.01) return `<rect class="crt-ui" width="${w - 2}" height="4"/>${rules(3, 9, 10, w - 10)}`;
    const X = split * total;
    return `<g opacity="${show}"><rect class="crt-ui" width="${total}" height="4"/><rect class="crt-ui" y="4" width="${X.toFixed(2)}" height="${sh - 4}"/>` +
      rules(3, 9, 10, X - 7) + rules(X + 4, 9, 5, total - X - 8) +
      `<rect class="crt-ui" x="${(X + 4).toFixed(2)}" y="33" width="${(total - X - 8).toFixed(2)}" height="${sh - 37}" rx="1"/>` +
      `<path class="fold-divider" d="M${X.toFixed(2)} 4V${sh}"/><rect class="fold-grip" x="${(X - 0.9).toFixed(2)}" y="${sh / 2 - 4}" width="1.8" height="8" rx="0.9"/></g>`;
  };
  const draw = () => {
    half.innerHTML = solidSvg(halfPaths(data.P, s.phi), { tone: "hi" });
    const flat = s.phi < 0.02;
    rightScreen.setAttribute("opacity", flat ? "1" : "0");
    const html = panes(s.split, flat ? s.show : 0);
    paneL.innerHTML = html;
    paneR.innerHTML = `<g transform="translate(${-(w - 2)} 0)">${html}</g>`;
  };
  const say = (t: string) => ctx.say(t);
  let visible = false, tl: any = null;
  const cycle = () => {
    tl?.pause();
    Object.assign(s, { phi: Math.PI, show: 0, split: 0.42 });
    draw();
    if (ctx.still) { Object.assign(s, { phi: 0, show: 1 }); draw(); say("tablet, two resizable panes"); return; }
    say("phone, folded");
    tl = createTimeline({ onUpdate: draw, onComplete: () => setTimeout(() => { if (visible) cycle(); }, 1600) })
      .add(s, { phi: 0, duration: 1500, ease: "inOut(3)", delay: 700, onBegin: () => say("unfolding") })
      .add(s, { show: 1, duration: 360, onComplete: () => say("tablet, two resizable panes") })
      .add(s, { split: 0.66, duration: 900, ease: "inOut(3)", delay: 500, onUpdate: () => say(`dragging the divider, ${Math.round(s.split * 100)} | ${100 - Math.round(s.split * 100)}`) })
      .add(s, { split: 0.3, duration: 1100, ease: "inOut(3)", delay: 300, onUpdate: () => say(`dragging the divider, ${Math.round(s.split * 100)} | ${100 - Math.round(s.split * 100)}`) })
      .add(s, { split: 0.42, duration: 700, ease: "inOut(3)", delay: 300 })
      .add(s, { show: 0, duration: 260, delay: 1400 })
      .add(s, { phi: Math.PI, duration: 1200, ease: "inOut(3)", onBegin: () => say("folding") });
  };
  root.addEventListener("pointerenter", () => { if (!tl || tl.completed) cycle(); });
  root.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycle(); } });
  let started = false;
  ctx.onVisible((v: boolean) => { visible = v; if (v && !started) { started = true; cycle(); } });
  draw();
}
