import { animate } from "animejs";

export default function mount(root: HTMLElement, data: { platforms: number[][]; origin: number[] }, ctx: any) {
  const player = root.querySelector<SVGGElement>("[data-player]")!;
  const [ox, oy] = data.origin;
  const state = { x: data.platforms[0][0], y: data.platforms[0][1], lift: 0 };
  const draw = () => player.setAttribute("transform", `translate(${(ox + state.x).toFixed(2)} ${(oy + state.y - state.lift).toFixed(2)})`);
  let at = 0, dir = 1, visible = false, busy = false;
  const hop = () => {
    if (busy) return;
    let next = at + dir;
    if (next < 0 || next >= data.platforms.length) { dir = -dir; next = at + dir; }
    at = next;
    ctx.say(`play mode, platform ${at + 1} of ${data.platforms.length}`);
    const [x, y] = data.platforms[at];
    if (ctx.still) { Object.assign(state, { x, y, lift: 0 }); draw(); return; }
    busy = true;
    animate(state, { x, y, duration: 520, ease: "inOut(2)", onUpdate: draw });
    animate(state, { lift: [{ to: 9, duration: 260, ease: "out(2)" }, { to: 0, duration: 260, ease: "in(2)" }], onUpdate: draw, onComplete: () => { busy = false; } });
  };
  setInterval(() => { if (visible && !ctx.still) hop(); }, 1500);
  // Clicking the computer opens the arcade.
  root.style.cursor = "pointer";
  root.setAttribute("role", "button");
  root.setAttribute("aria-label", "Play the minigames");
  root.addEventListener("click", () => document.dispatchEvent(new Event("open-games")));
  root.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.dispatchEvent(new Event("open-games")); } });
  ctx.onVisible((v: boolean) => { visible = v; });
  draw();
}
