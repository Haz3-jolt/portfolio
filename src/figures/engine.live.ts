export default function mount(root: HTMLElement, data: { screens: string[] }, ctx: any) {
  const lines = [...root.querySelectorAll<SVGTextElement>("[data-line]")];
  const pulses = [...root.querySelectorAll<SVGPathElement>("[data-pulse]")];
  const cables = [...root.querySelectorAll<SVGPathElement>(".cable")];
  const commands = ["fix the flaky test in kernel", "add portable sessions", "run the suite again", "ship v0.4"];
  let c = 0, i = 0, visible = false, off = -1, offTimer: any = 0;
  const live = () => data.screens.length - (off >= 0 ? 1 : 0);
  const sayState = () => ctx.say(off >= 0 ? `${data.screens[off]} closed, session keeps running on ${live()}` : `1 session, ${live()} windows in sync`);
  const render = (text: string) => lines.forEach((l, n) => { l.textContent = "> " + text + (n === off ? "" : "▍"); l.parentElement!.classList.toggle("screen-off", n === off); });
  setInterval(() => {
    if (!visible) return;
    const cmd = commands[c % commands.length];
    if (ctx.still) { render(cmd); return; }
    i++;
    if (i > cmd.length + 14) { i = 0; c++; }
    render(cmd.slice(0, Math.min(i, cmd.length)));
  }, 110);
  const unplug = (n: number) => {
    clearTimeout(offTimer);
    off = n;
    pulses.forEach((p, m) => p.toggleAttribute("data-unplugged", m === n));
    cables.forEach((p, m) => p.toggleAttribute("data-unplugged", m === n));
    sayState();
    offTimer = setTimeout(() => { off = -1; pulses.forEach((p) => p.removeAttribute("data-unplugged")); cables.forEach((p) => p.removeAttribute("data-unplugged")); sayState(); }, 3200);
  };
  lines.forEach((l, n) => l.closest("g")!.addEventListener("pointerenter", () => unplug(n)));
  root.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); unplug((off + 1) % data.screens.length); } });
  ctx.onVisible((v: boolean) => { visible = v; });
  sayState();
}
