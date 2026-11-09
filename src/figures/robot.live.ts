import { animate } from "animejs";
import { depthOf, iso } from "../lib/iso/iso-kit.mjs";
import { botSvg, obstacleSvg, pose } from "./robot.mjs";

type Ob = { x: number; y: number; up: boolean; fall?: number };

// Drag obstacles anywhere (the bot re-plans around them), click one to knock it over or stand it
// back up, and click the bot to bump it: it spins out, then carries on.
export default function mount(root: HTMLElement, data: { P: any; total: number; obstacles: Ob[] }, ctx: any) {
  const svg = root.querySelector("svg")!;
  const scene = root.querySelector<SVGGElement>("[data-scene]")!;
  const bot = root.querySelector<SVGGElement>("[data-bot]")!;
  // Pegs remember where you left them (and whether they're knocked over) across reloads.
  const KEY = "robot-pegs-v1";
  const load = (): Ob[] => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (Array.isArray(saved) && saved.length === data.obstacles.length && saved.every((o) => Number.isFinite(o.x) && Number.isFinite(o.y))) return saved;
    } catch {}
    return data.obstacles.map((o) => ({ ...o }));
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(obs)); } catch {} };
  const obs: Ob[] = load();
  const s = { at: 0, spin: 0, hop: 0 };
  let visible = false, run: any = null;

  // Screen → floor (z = 0): invert the camera's two floor axes.
  const o0 = iso([0, 0, 0], data.P), ax = iso([1, 0, 0], data.P), ay = iso([0, 1, 0], data.P);
  const a = [ax[0] - o0[0], ax[1] - o0[1]], b = [ay[0] - o0[0], ay[1] - o0[1]];
  const det = a[0] * b[1] - a[1] * b[0];
  const toFloor = (cx: number, cy: number) => {
    const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const dx = p.x - o0[0], dy = p.y - o0[1];
    return [(dx * b[1] - dy * b[0]) / det, (a[0] * dy - a[1] * dx) / det];
  };

  const draw = () => {
    const p = pose(Math.min(s.at, data.total), obs);
    // Rebuild the obstacles, then insert the bot among them by depth.
    const botDepth = depthOf([p.x, p.y, 0], data.P);
    const order = obs.map((ob, i) => ({ i, d: depthOf([ob.x, ob.y, 0], data.P) })).sort((u, v) => u.d - v.d);
    const parts: string[] = [];
    let placed = false;
    for (const { i, d } of order) {
      if (!placed && d > botDepth) { parts.push("<!--bot-->"); placed = true; }
      parts.push(obstacleSvg(data.P, obs[i], i));
    }
    if (!placed) parts.push("<!--bot-->");
    const html = parts.join("");
    const [before, after] = html.split("<!--bot-->");
    bot.innerHTML = botSvg(data.P, p.x, p.y, p.th + s.spin, s.hop);
    scene.innerHTML = before;
    scene.appendChild(bot);
    scene.insertAdjacentHTML("beforeend", after);
    ctx.say(s.at >= data.total - 0.5 ? "parked between the end lines" : "wandering, avoiding the boundary and obstacles");
  };
  const go = (from = 0) => {
    run?.pause();
    s.at = from;
    if (ctx.still) { s.at = data.total; draw(); return; }
    const left = data.total - from;
    run = animate(s, { at: data.total, duration: 11000 * (left / data.total), ease: from ? "out(1.2)" : "inOut(1.2)", onUpdate: draw, onComplete: () => setTimeout(() => { if (visible && !dragging) go(); }, 2600) });
  };

  // Pointer: drag an obstacle; a press without movement knocks it over / stands it up; the bot spins.
  let dragging: number | null = null, moved = false, startXY = [0, 0];
  svg.addEventListener("pointerdown", (e) => {
    const t = e.target as Element;
    const ob = t.closest?.("[data-ob]");
    if (ob) {
      dragging = Number(ob.getAttribute("data-ob")); moved = false; startXY = [e.clientX, e.clientY];
      svg.setPointerCapture(e.pointerId); e.preventDefault();
    } else if (t.closest?.("[data-bot]")) {
      run?.pause();
      const at = s.at;
      animate(s, { spin: s.spin + Math.PI * 2, hop: [{ to: 6, duration: 260, ease: "out(2)" }, { to: 0, duration: 340, ease: "in(2)" }], duration: 900, ease: "out(3)", onUpdate: draw, onComplete: () => { s.spin %= Math.PI * 2; setTimeout(() => go(at), 500); } });
      ctx.say("bumped, spinning out");
    }
  });
  svg.addEventListener("pointermove", (e) => {
    if (dragging === null) return;
    if (Math.hypot(e.clientX - startXY[0], e.clientY - startXY[1]) > 4) moved = true;
    if (!moved) return;
    const [x, y] = toFloor(e.clientX, e.clientY);
    obs[dragging].x = Math.max(-100, Math.min(52, x));
    obs[dragging].y = Math.max(-62, Math.min(62, y));
    if (!run || run.completed || run.paused) draw();
  });
  svg.addEventListener("pointerup", () => {
    if (dragging === null) return;
    const ob = obs[dragging];
    if (!moved) { ob.up = !ob.up; ob.fall = Math.random() * Math.PI * 2; ctx.say(ob.up ? "stood the peg back up" : "knocked a peg over"); }
    dragging = null;
    save();
    draw();
  });

  root.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  let started = false;
  ctx.onVisible((v: boolean) => { visible = v; if (run) v ? run.resume?.() : run.pause(); if (v && !started) { started = true; go(); } });
  draw();
}
