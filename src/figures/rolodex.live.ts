import { animate, createTimeline } from "animejs";
import { cardsSvg } from "./rolodex.mjs";

export default function mount(root: HTMLElement, data: { P: any; colleges: string[][]; n: number; top: number }, ctx: any) {
  const cards = root.querySelector<SVGGElement>("[data-cards]")!;
  const q = root.querySelector<SVGTextElement>("[data-q]")!;
  const a = root.querySelector<SVGTextElement>("[data-a]")!;
  const u = root.querySelector<SVGTextElement>("[data-u]")!;
  const step = (2 * Math.PI) / data.n;
  const s = { turn: data.top, out: 0, lift: -1 };
  let users = 1024, which = 0, visible = false, busy = false;
  const draw = () => { cards.innerHTML = cardsSvg(data.P, s.turn, s.lift, s.out); };
  const ask = () => {
    if (busy) return;
    busy = true;
    which = (which + 1 + Math.floor(Math.random() * 3)) % data.colleges.length;
    const [nick, name] = data.colleges[which];
    const card = which * 3;
    const cmd = (Math.random() < 0.5 ? "/cutoff " : "/analyze ") + nick;
    a.textContent = "";
    // Bring card `card` to the front: turn so that turn + card * step equals top (mod 2π), always spinning forward.
    let target = data.top - card * step;
    while (target < s.turn + Math.PI) target += 2 * Math.PI;
    const finish = () => { a.textContent = `→ ${name}`; users++; u.textContent = `${users.toLocaleString("en-US")} students helped`; ctx.say(`${cmd}, ${name}`); busy = false; };
    let typed = 0;
    const type = setInterval(() => { typed++; q.textContent = cmd.slice(0, typed); if (typed >= cmd.length) clearInterval(type); }, ctx.still ? 0 : 55);
    if (ctx.still) { s.turn = target; s.lift = card; s.out = 7; draw(); finish(); return; }
    createTimeline({ onUpdate: draw, onComplete: finish })
      .add(s, { out: 0, duration: 200 })
      .add(s, { turn: target, duration: 1400, ease: "out(3)", delay: cmd.length * 55, onBegin: () => { s.lift = card; } })
      .add(s, { out: 7, duration: 380, ease: "out(3)" });
  };
  setInterval(() => { if (visible && !ctx.still) ask(); }, 3400);
  root.addEventListener("click", ask);
  root.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ask(); } });
  ctx.onVisible((v: boolean) => { visible = v; });
  s.lift = 0; s.out = 7; draw(); a.textContent = "→ NIT Trichy";
}
