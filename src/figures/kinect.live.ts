import { handSvg } from "./kinect.mjs";

// The wave runs on its own clock (a sine), drawn at ~30 fps while the figure is on screen.
export default function mount(root: HTMLElement, data: { P: any }, ctx: any) {
  const hand = root.querySelector<SVGGElement>("[data-hand]")!;
  const draw = (t: number) => { hand.innerHTML = handSvg(data.P, 0.28 * Math.sin(t * 5.1), 0.3 + 0.3 * Math.sin(t * 2.55)); };
  if (ctx.still) { draw(0); return; }
  let raf = 0, last = 0;
  const loop = (now: number) => { raf = requestAnimationFrame(loop); if (now - last < 33) return; last = now; draw(now / 1000); };
  ctx.onVisible((v: boolean) => { if (v && !raf) raf = requestAnimationFrame(loop); if (!v) { cancelAnimationFrame(raf); raf = 0; } });
  draw(0);
}
