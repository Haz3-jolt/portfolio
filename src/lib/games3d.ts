// Two original 3D games for the arcade, rendered with three.js at a low pixel ratio for a crisp
// retro look. Bench Hop: hop a cube up an endless workbench, dodging sliding rulers and riding
// sticky notes across gaps. Stacker: drop sliding slabs into a tower; overhangs get sliced off.
import * as THREE from "three";

const C = { paper: 0xeee4c8, deep: 0xd8cba6, ink: 0x2a2620, accent: 0xff6a3d, wood: 0xb08a5a, woodDark: 0x8a6a42, gap: 0x141311, note: 0xf2d16b, steel: 0x9aa3a8 };

type Ctx = { scene: THREE.Scene; camera: THREE.OrthographicCamera; say: (s: string, big?: string) => void; sfx: (f: number, d?: number, type?: OscillatorType) => void; best: (k: string, v?: number) => number };
type Game = { start(): void; step(dt: number): void; key(k: string): void; tap(dx: number, dy: number): void; dispose(): void };

function box(w: number, h: number, d: number, color: number) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ───────── Bench Hop ─────────
function benchHop(ctx: Ctx): Game {
  const { scene, camera } = ctx;
  const root = new THREE.Group(); scene.add(root);
  type Lane = { z: number; kind: "plank" | "ruler" | "gap"; speed: number; items: THREE.Mesh[]; group: THREE.Group };
  let lanes: Lane[] = [], player: THREE.Mesh, shadow: THREE.Mesh, px = 0, pz = 0, row = 0, best = 0, dead = false, hopT = 1, from = new THREE.Vector3(), to = new THREE.Vector3(), riding: THREE.Mesh | null = null, shake = 0;
  const parts: { m: THREE.Mesh; v: THREE.Vector3; life: number }[] = [];
  const W = 9; // lane half-width in cells

  const makeLane = (z: number): Lane => {
    const kind: Lane["kind"] = z < 3 ? "plank" : (["plank", "ruler", "ruler", "gap", "gap", "plank"] as const)[Math.floor(Math.random() * 6)];
    const group = new THREE.Group(); group.position.z = -z; root.add(group);
    const base = kind === "gap" ? box(W * 2 + 1, 0.2, 1, C.gap) : box(W * 2 + 1, 0.5, 1, z % 2 ? C.wood : C.woodDark);
    base.position.y = kind === "gap" ? -0.6 : -0.25; base.castShadow = false; group.add(base);
    const speed = (kind === "plank" ? 0 : (1.2 + Math.random() * 1.8 + z * 0.02)) * (Math.random() < 0.5 ? -1 : 1);
    const items: THREE.Mesh[] = [];
    if (kind === "ruler") {
      const n = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) { const len = 2 + Math.floor(Math.random() * 2); const r = box(len, 0.35, 0.7, C.steel); r.position.set(-W + i * (W * 2 / n) + Math.random() * 2, 0.18, 0); (r as any).len = len; group.add(r); items.push(r); }
    } else if (kind === "gap") {
      const n = 3;
      for (let i = 0; i < n; i++) { const len = 2 + Math.floor(Math.random() * 2); const p = box(len, 0.15, 0.85, C.note); p.position.set(-W + i * (W * 2 / n), -0.15, 0); (p as any).len = len; group.add(p); items.push(p); }
    } else if (z > 2 && Math.random() < 0.6) {
      // A few blocks to step around on safe planks.
      for (let i = 0; i < 2; i++) { const b = box(0.8, 0.8, 0.8, C.paper); b.position.set(Math.round(Math.random() * W * 2 - W), 0.4, 0); group.add(b); (b as any).solid = true; items.push(b); }
    }
    return { z, kind, speed, items, group };
  };

  const start = () => {
    root.clear(); lanes = []; parts.length = 0;
    for (let z = 0; z < 22; z++) lanes.push(makeLane(z));
    player = box(0.7, 0.7, 0.7, C.accent); player.position.set(0, 0.35, 0); root.add(player);
    shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 }));
    shadow.rotation.x = -Math.PI / 2; root.add(shadow);
    px = 0; pz = 0; row = 0; dead = false; hopT = 1; riding = null;
    best = ctx.best("hop");
    ctx.say(`0, best ${best}`, "arrows / swipe to hop");
  };
  const laneAt = (z: number) => lanes.find((l) => l.z === z);
  const blocked = (x: number, z: number) => laneAt(z)?.items.some((it) => (it as any).solid && Math.abs(it.position.x - x) < 0.5);
  const hop = (dx: number, dz: number) => {
    if (dead) { start(); return; }
    if (hopT < 1) return;
    const nx = Math.max(-W, Math.min(W, Math.round(px) + dx)), nz = Math.max(0, pz + dz);
    if (blocked(nx, nz)) return;
    riding = null;
    from.copy(player.position); to.set(nx, 0.35, -nz); px = nx; pz = nz; hopT = 0;
    ctx.sfx(520 + nz * 4, 0.05, "square");
    if (pz > row) { row = pz; ctx.say(`${row}, best ${Math.max(best, row)}`); }
    while (lanes[lanes.length - 1].z < pz + 18) lanes.push(makeLane(lanes[lanes.length - 1].z + 1));
    while (lanes[0].z < pz - 6) { root.remove(lanes[0].group); lanes.shift(); }
  };
  const die = (why: string) => {
    if (dead) return;
    dead = true; shake = 0.35;
    ctx.sfx(140, 0.35, "sawtooth");
    for (let i = 0; i < 18; i++) { const m = box(0.18, 0.18, 0.18, C.accent); m.position.copy(player.position); root.add(m); parts.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 6 + 2, (Math.random() - 0.5) * 6), life: 1.2 }); }
    player.visible = false;
    if (row > best) ctx.best("hop", row);
    ctx.say(`${row}, best ${Math.max(best, row)}`, `${why}. press any key`);
  };
  const step = (dt: number) => {
    for (const l of lanes) for (const it of l.items) {
      if (!l.speed) continue;
      it.position.x += l.speed * dt;
      const len = (it as any).len || 1;
      if (it.position.x > W + len) it.position.x = -W - len;
      if (it.position.x < -W - len) it.position.x = W + len;
    }
    if (hopT < 1) {
      hopT = Math.min(1, hopT + dt * 7);
      player.position.lerpVectors(from, to, hopT);
      player.position.y = 0.35 + Math.sin(hopT * Math.PI) * 0.6;
      const s = 1 - Math.sin(hopT * Math.PI) * 0.18; player.scale.set(s, 2 - s, s);
    } else if (!dead) {
      player.scale.set(1, 1, 1);
      const lane = laneAt(pz);
      if (lane?.kind === "ruler" && lane.items.some((it) => Math.abs(it.position.x - player.position.x) < (it as any).len / 2 + 0.3)) die("flattened by a ruler");
      if (lane?.kind === "gap") {
        const on = riding ?? lane.items.find((it) => Math.abs(it.position.x - player.position.x) < (it as any).len / 2);
        if (!on) die("fell between the planks");
        else { riding = on; player.position.x += lane.speed * dt; px = player.position.x; if (Math.abs(px) > W + 0.5) die("carried off the bench"); }
      }
    }
    shadow.position.set(player.position.x, 0.02, player.position.z); shadow.visible = player.visible;
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.v.y -= 18 * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += dt * 8; p.life -= dt; if (p.life <= 0) { root.remove(p.m); parts.splice(i, 1); } }
    // Camera follows on an isometric diagonal, with a little shake on death.
    shake = Math.max(0, shake - dt);
    const target = new THREE.Vector3(player.position.x * 0.5 + 6, 10, player.position.z + 9);
    camera.position.lerp(target, 1 - Math.exp(-dt * 4));
    camera.position.x += (Math.random() - 0.5) * shake; camera.position.y += (Math.random() - 0.5) * shake;
    camera.lookAt(camera.position.x - 6, 0, camera.position.z - 9);
  };
  return {
    start, step, dispose: () => scene.remove(root),
    key(k) { const m: Record<string, [number, number]> = { ArrowUp: [0, 1], w: [0, 1], ArrowDown: [0, -1], s: [0, -1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }; if (m[k]) hop(...m[k]); else if (dead) start(); },
    tap(dx, dy) { if (Math.abs(dx) < 20 && Math.abs(dy) < 20) hop(0, 1); else if (Math.abs(dx) > Math.abs(dy)) hop(dx > 0 ? 1 : -1, 0); else hop(0, dy < 0 ? 1 : -1); },
  };
}

// ───────── Stacker ─────────
function stacker(ctx: Ctx): Game {
  const { scene, camera } = ctx;
  const root = new THREE.Group(); scene.add(root);
  const H = 0.5;
  type Slab = { mesh: THREE.Mesh; w: number; d: number; x: number; z: number };
  let tower: Slab[] = [], moving: Slab | null = null, axis: "x" | "z" = "x", t = 0, speed = 1.6, dead = false, combo = 0, camY = 4;
  const falling: { m: THREE.Mesh; v: THREE.Vector3; r: THREE.Vector3; life: number }[] = [];
  const color = (i: number) => new THREE.Color(C.paper).lerp(new THREE.Color(C.accent), (Math.sin(i * 0.25) + 1) / 2);
  const slab = (w: number, d: number, x: number, z: number, i: number): Slab => {
    const m = box(w, H, d, color(i).getHex()); m.position.set(x, i * H, z); root.add(m);
    return { mesh: m, w, d, x, z };
  };
  const next = () => {
    const top = tower[tower.length - 1], i = tower.length;
    axis = axis === "x" ? "z" : "x";
    moving = slab(top.w, top.d, top.x, top.z, i); t = 0;
  };
  const start = () => {
    root.clear(); tower = []; falling.length = 0; dead = false; combo = 0; speed = 1.6; axis = "z"; camY = 4;
    const base = box(3, 3, 3, C.woodDark); base.position.y = -1.75; root.add(base);
    tower.push(slab(3, 3, 0, 0, 0));
    next();
    ctx.say(`0, best ${ctx.best("stack")}`, "space / tap to drop");
  };
  const drop = () => {
    if (dead) { start(); return; }
    if (!moving) return;
    const top = tower[tower.length - 1], m = moving;
    const delta = axis === "x" ? m.mesh.position.x - top.x : m.mesh.position.z - top.z;
    const size = axis === "x" ? top.w : top.d;
    const over = size - Math.abs(delta);
    if (over <= 0) {
      dead = true; falling.push({ m: m.mesh, v: new THREE.Vector3(0, 0, 0), r: new THREE.Vector3(1, 0, 1), life: 3 });
      ctx.sfx(120, 0.4, "sawtooth");
      const score = tower.length - 1;
      if (score > ctx.best("stack")) ctx.best("stack", score);
      ctx.say(`${score}, best ${ctx.best("stack")}`, "missed. press any key");
      moving = null; return;
    }
    const perfect = Math.abs(delta) < 0.06;
    if (perfect) { combo++; ctx.sfx(660 + combo * 60, 0.12, "triangle"); }
    else { combo = 0; ctx.sfx(330, 0.08, "square"); }
    const keep = perfect ? size : over;
    const centre = perfect ? (axis === "x" ? top.x : top.z) : (axis === "x" ? top.x : top.z) + delta / 2;
    // Rebuild the kept part, and spin the sliced-off part away.
    root.remove(m.mesh);
    const w = axis === "x" ? keep : top.w, d = axis === "z" ? keep : top.d;
    const x = axis === "x" ? centre : top.x, z = axis === "z" ? centre : top.z;
    tower.push(slab(w, d, x, z, tower.length));
    if (!perfect) {
      const cut = size - keep, sign = Math.sign(delta);
      const cw = axis === "x" ? cut : top.w, cd = axis === "z" ? cut : top.d;
      const cx = axis === "x" ? centre + sign * (keep / 2 + cut / 2) : top.x, cz = axis === "z" ? centre + sign * (keep / 2 + cut / 2) : top.z;
      const piece = box(cw, H, cd, color(tower.length - 1).getHex()); piece.position.set(cx, (tower.length - 1) * H, cz); root.add(piece);
      falling.push({ m: piece, v: new THREE.Vector3(axis === "x" ? sign * 1.5 : 0, 1, axis === "z" ? sign * 1.5 : 0), r: new THREE.Vector3(axis === "z" ? sign * 3 : 0, 0, axis === "x" ? -sign * 3 : 0), life: 3 });
    } else if (combo >= 3) {
      // A run of perfect drops grows the slab back a little.
      const top2 = tower[tower.length - 1];
      top2.w = Math.min(3, top2.w + 0.15); top2.d = Math.min(3, top2.d + 0.15);
      top2.mesh.geometry.dispose(); top2.mesh.geometry = new THREE.BoxGeometry(top2.w, H, top2.d);
    }
    speed += 0.05;
    ctx.say(`${tower.length - 1}, best ${Math.max(ctx.best("stack"), tower.length - 1)}`, perfect ? (combo > 1 ? `perfect ×${combo}` : "perfect") : "");
    next();
  };
  const step = (dt: number) => {
    if (moving) {
      t += dt * speed;
      const off = Math.sin(t) * 4.2;
      const top = tower[tower.length - 1];
      if (axis === "x") moving.mesh.position.x = top.x + off; else moving.mesh.position.z = top.z + off;
    }
    for (let i = falling.length - 1; i >= 0; i--) {
      const f = falling[i]; f.v.y -= 14 * dt; f.m.position.addScaledVector(f.v, dt);
      f.m.rotation.x += f.r.x * dt; f.m.rotation.z += f.r.z * dt; f.life -= dt;
      if (f.life <= 0) { root.remove(f.m); falling.splice(i, 1); }
    }
    camY += ((tower.length * H) + 4 - camY) * (1 - Math.exp(-dt * 3));
    camera.position.set(8, camY + 6, 8);
    camera.lookAt(0, camY - 2, 0);
  };
  return { start, step, dispose: () => scene.remove(root), key: (k) => { if (k === " " || k === "Enter" || k === "ArrowDown" || dead) drop(); }, tap: () => drop() };
}

export function startArcade3d(canvas: HTMLCanvasElement, which: "hop" | "stack", hud: { score: HTMLElement; hint: HTMLElement }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(0.5); // chunky pixels; the canvas is scaled up with image-rendering: pixelated
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c1b19);
  scene.fog = new THREE.Fog(0x1c1b19, 18, 34);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x2a2620, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(5, 12, 4); sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 });
  scene.add(sun, sun.target);

  let audio: AudioContext | null = null;
  const sfx = (f: number, d = 0.08, type: OscillatorType = "square") => {
    try {
      audio ??= new AudioContext();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = 0.05;
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d);
      o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + d);
    } catch {}
  };
  const best = (k: string, v?: number) => {
    try { if (v !== undefined) localStorage.setItem(`arcade-${k}`, String(v)); return Number(localStorage.getItem(`arcade-${k}`) || 0); } catch { return v ?? 0; }
  };
  const say = (s: string, big?: string) => { hud.score.textContent = s; if (big !== undefined) hud.hint.textContent = big; };
  const ctx: Ctx = { scene, camera, say, sfx, best };
  const game = which === "hop" ? benchHop(ctx) : stacker(ctx);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    const zoom = which === "hop" ? 7 : 6.5, a = w / h;
    Object.assign(camera, { left: -zoom * a, right: zoom * a, top: zoom, bottom: -zoom });
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  game.start();

  const onKey = (e: KeyboardEvent) => { if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault(); game.key(e.key); };
  let sx = 0, sy = 0;
  const down = (e: PointerEvent) => { sx = e.clientX; sy = e.clientY; };
  const up = (e: PointerEvent) => game.tap(e.clientX - sx, e.clientY - sy);
  addEventListener("keydown", onKey);
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointerup", up);

  let raf = 0, last = 0;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    game.step(dt);
    sun.position.set(camera.position.x - 1, camera.position.y + 6, camera.position.z - 4);
    sun.target.position.set(camera.position.x - 6, 0, camera.position.z - 9);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    removeEventListener("keydown", onKey);
    canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointerup", up);
    game.dispose(); renderer.dispose(); audio?.close();
  };
}
