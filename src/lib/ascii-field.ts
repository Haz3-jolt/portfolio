// ASCII fog behind the page: a small stable-fluids simulation (Stam) carries smoke that three slow
// wandering emitters keep feeding, and the pointer stirs it. Smoke density × a drifting value-noise
// texture gives each cell a brightness, which picks a tiny glyph. The fluid runs on a coarse grid
// and is sampled per glyph cell; one canvas, ~30 fps, paused when the tab is hidden, still under
// prefers-reduced-motion.
const GLYPHS = [" ", "·", "-", "+", "o", "○"]; // sparse → dense
const CELL = 7; // glyph pitch in CSS px: a fine mesh

export function startAsciiField() {
  const canvas = document.createElement("canvas");
  canvas.className = "ascii-field";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d")!;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cols = 0, rows = 0, ink = "236,229,211", alpha = 0.5;

  // ── Fluid on a coarse grid (one fluid cell per 3×3 glyphs), with a 1-cell border ──
  let W = 0, H = 0, N = 0;
  let u: Float32Array, v: Float32Array, u0: Float32Array, v0: Float32Array, d: Float32Array, d0: Float32Array, p: Float32Array, div: Float32Array;
  const IX = (x: number, y: number) => x + y * (W + 2);
  const alloc = () => {
    W = Math.max(8, Math.ceil(cols / 3)); H = Math.max(8, Math.ceil(rows / 3)); N = (W + 2) * (H + 2);
    [u, v, u0, v0, d, d0, p, div] = Array.from({ length: 8 }, () => new Float32Array(N));
  };
  const bound = (b: number, x: Float32Array) => {
    for (let i = 1; i <= W; i++) { x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)]; x[IX(i, H + 1)] = b === 2 ? -x[IX(i, H)] : x[IX(i, H)]; }
    for (let j = 1; j <= H; j++) { x[IX(0, j)] = b === 1 ? -x[IX(1, j)] : x[IX(1, j)]; x[IX(W + 1, j)] = b === 1 ? -x[IX(W, j)] : x[IX(W, j)]; }
  };
  const diffuse = (b: number, x: Float32Array, x0: Float32Array, k: number) => {
    for (let it = 0; it < 4; it++) {
      for (let j = 1; j <= H; j++) for (let i = 1; i <= W; i++) x[IX(i, j)] = (x0[IX(i, j)] + k * (x[IX(i - 1, j)] + x[IX(i + 1, j)] + x[IX(i, j - 1)] + x[IX(i, j + 1)])) / (1 + 4 * k);
      bound(b, x);
    }
  };
  const advect = (b: number, dd: Float32Array, src: Float32Array, uu: Float32Array, vv: Float32Array, dt: number) => {
    for (let j = 1; j <= H; j++) for (let i = 1; i <= W; i++) {
      let x = i - dt * uu[IX(i, j)], y = j - dt * vv[IX(i, j)];
      x = Math.max(0.5, Math.min(W + 0.5, x)); y = Math.max(0.5, Math.min(H + 0.5, y));
      const i0 = x | 0, j0 = y | 0, s1 = x - i0, t1 = y - j0;
      dd[IX(i, j)] = (1 - s1) * ((1 - t1) * src[IX(i0, j0)] + t1 * src[IX(i0, j0 + 1)]) + s1 * ((1 - t1) * src[IX(i0 + 1, j0)] + t1 * src[IX(i0 + 1, j0 + 1)]);
    }
    bound(b, dd);
  };
  const project = () => {
    for (let j = 1; j <= H; j++) for (let i = 1; i <= W; i++) { div[IX(i, j)] = -0.5 * (u[IX(i + 1, j)] - u[IX(i - 1, j)] + v[IX(i, j + 1)] - v[IX(i, j - 1)]); p[IX(i, j)] = 0; }
    bound(0, div); bound(0, p);
    for (let it = 0; it < 8; it++) { for (let j = 1; j <= H; j++) for (let i = 1; i <= W; i++) p[IX(i, j)] = (div[IX(i, j)] + p[IX(i - 1, j)] + p[IX(i + 1, j)] + p[IX(i, j - 1)] + p[IX(i, j + 1)]) / 4; bound(0, p); }
    for (let j = 1; j <= H; j++) for (let i = 1; i <= W; i++) { u[IX(i, j)] -= 0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)]); v[IX(i, j)] -= 0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)]); }
    bound(1, u); bound(2, v);
  };
  const splat = (fx: number, fy: number, dx: number, dy: number, amount: number, radius: number) => {
    const r2 = radius * radius;
    for (let j = Math.max(1, (fy - radius) | 0); j <= Math.min(H, (fy + radius) | 0); j++)
      for (let i = Math.max(1, (fx - radius) | 0); i <= Math.min(W, (fx + radius) | 0); i++) {
        const e = ((i - fx) ** 2 + (j - fy) ** 2) / r2;
        if (e > 1) continue;
        const w = (1 - e) * (1 - e);
        d[IX(i, j)] = Math.min(1.6, d[IX(i, j)] + amount * w);
        u[IX(i, j)] += dx * w; v[IX(i, j)] += dy * w;
      }
  };
  const step = (dt: number) => {
    u0.set(u); v0.set(v);
    diffuse(1, u, u0, 0.02); diffuse(2, v, v0, 0.02); project();
    u0.set(u); v0.set(v);
    advect(1, u, u0, u0, v0, dt * 10); advect(2, v, v0, u0, v0, dt * 10); project();
    d0.set(d); advect(0, d, d0, u, v, dt * 10);
    const kv = Math.exp(-0.25 * dt), kd = Math.exp(-0.32 * dt);
    for (let i = 0; i < N; i++) { u[i] *= kv; v[i] *= kv; d[i] *= kd; }
  };

  // ── Value noise for texture inside the smoke ──
  const NS = 64, noiseTab = new Float32Array(NS * NS).map(() => Math.random());
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
    const at = (a: number, b: number) => noiseTab[((a & 63) + (b & 63) * NS)];
    const a0 = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx, a1 = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
    return a0 + (a1 - a0) * sy;
  };

  const readTheme = () => {
    ink = getComputedStyle(document.documentElement).getPropertyValue("--grain-ink").trim() || ink;
    alpha = document.documentElement.dataset.theme === "light" ? 0.75 : 0.62;
  };
  const resize = () => {
    canvas.width = Math.ceil(innerWidth / CELL) * CELL;
    canvas.height = Math.ceil(innerHeight / CELL) * CELL;
    cols = canvas.width / CELL; rows = canvas.height / CELL;
    alloc();
  };

  // Three emitters wander on slow Lissajous paths so the fog never settles.
  const emitters = [0, 1, 2].map((k) => ({ ax: 0.07 + k * 0.023, ay: 0.05 + k * 0.031, ph: k * 2.1 }));
  let time = 0;
  const feed = (dt: number) => {
    time += dt;
    for (const e of emitters) {
      const x = 1 + W * (0.5 + 0.45 * Math.sin(time * e.ax * 6 + e.ph)), y = 1 + H * (0.5 + 0.42 * Math.sin(time * e.ay * 6 + e.ph * 1.7));
      const dx = Math.cos(time * 0.4 + e.ph) * 26, dy = Math.sin(time * 0.33 + e.ph) * 26;
      splat(x, y, dx * dt, dy * dt, 2.6 * dt, Math.max(4, W * 0.11));
    }
  };

  const levels = () => {
    const out = new Uint8Array(cols * rows);
    const n = GLYPHS.length - 1;
    const tt = time * 0.5;
    for (let r = 0; r < rows; r++) {
      const fy = (r + 0.5) / 3 + 0.5;
      for (let c = 0; c < cols; c++) {
        const fx = (c + 0.5) / 3 + 0.5;
        const i0 = Math.min(W, fx | 0), j0 = Math.min(H, fy | 0), s1 = fx - i0, t1 = fy - j0;
        const dens = (1 - s1) * ((1 - t1) * d[IX(i0, j0)] + t1 * d[IX(i0, j0 + 1)]) + s1 * ((1 - t1) * d[IX(i0 + 1, j0)] + t1 * d[IX(i0 + 1, j0 + 1)]);
        if (dens < 0.03) continue;
        const tex = 0.4 + 0.6 * Math.pow(noise(c * 0.09 + tt, r * 0.09 - tt * 0.7), 1.6);
        let l = Math.min(1, dens) * tex;
        l = Math.min(1, Math.max(0, (l - 0.12) * 1.5));
        out[r * cols + c] = Math.min(n, Math.floor(Math.sqrt(l) * (n + 0.6)));
      }
    }
    return out;
  };
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${CELL + 1}px "IBM Plex Mono", ui-monospace, Menlo, monospace`;
    ctx.textBaseline = "top";
    const lv = levels(), n = GLYPHS.length - 1;
    for (let g = 1; g <= n; g++) {
      ctx.fillStyle = `rgba(${ink},${(alpha * (0.45 + 0.55 * g / n)).toFixed(3)})`;
      const ch = GLYPHS[g];
      for (let k = 0; k < lv.length; k++) if (lv[k] === g) ctx.fillText(ch, (k % cols) * CELL, ((k / cols) | 0) * CELL);
    }
  };

  // Pointer stirs the fog; a click throws a puff.
  let px = -1, py = -1, pt = 0;
  addEventListener("pointermove", (e) => {
    const now = performance.now();
    const fx = e.clientX / CELL / 3 + 0.5, fy = e.clientY / CELL / 3 + 0.5;
    if (px >= 0) {
      const dt = Math.max(0.008, (now - pt) / 1000);
      const vx = Math.max(-40, Math.min(40, (fx - px) / dt)), vy = Math.max(-40, Math.min(40, (fy - py) / dt));
      splat(fx, fy, vx * 0.06, vy * 0.06, 0.12, 3.2);
    }
    px = fx; py = fy; pt = now;
  }, { passive: true });
  addEventListener("pointerdown", (e) => {
    const fx = e.clientX / CELL / 3 + 0.5, fy = e.clientY / CELL / 3 + 0.5;
    for (let a = 0; a < 8; a++) splat(fx + Math.cos(a) * 2, fy + Math.sin(a) * 2, Math.cos(a) * 3, Math.sin(a) * 3, 0.35, 3);
  }, { passive: true });

  readTheme();
  resize();
  // Warm up so the first frame already has fog in it.
  for (let i = 0; i < 90; i++) { feed(1 / 30); step(1 / 30); }
  draw();

  let raf = 0, last = 0;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 30);
    last = now;
    feed(dt); step(dt); draw();
  };
  const run = () => { if (!raf && !still) { last = 0; raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  addEventListener("resize", () => { resize(); for (let i = 0; i < 40; i++) { feed(1 / 30); step(1 / 30); } draw(); });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : run()));
  document.addEventListener("themechange", () => { readTheme(); draw(); });
  run();
}
