// Paper / charcoal texture: tileable value noise, ordered (Bayer) dithered into ink dots,
// with a faint ASCII field where the paper is darkest. Drawn once per theme into a 512px tile,
// cached in sessionStorage, and set as the body background. Never redrawn per frame.

const SIZE = 512;
const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((v) => (v + 0.5) / 64));


function hash(x: number, y: number, seed: number) {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

// Periodic value noise so the tile wraps seamlessly.
function noise(x: number, y: number, period: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const w = (v: number) => ((v % period) + period) % period;
  const a = hash(w(xi), w(yi), seed), b = hash(w(xi + 1), w(yi), seed);
  const c = hash(w(xi), w(yi + 1), seed), d = hash(w(xi + 1), w(yi + 1), seed);
  return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
}

function fbm(x: number, y: number) {
  // Octaves with periods that divide the tile, so it tiles.
  return noise(x / 128, y / 128, SIZE / 128, 1) * 0.55 + noise(x / 32, y / 32, SIZE / 32, 2) * 0.3 + noise(x / 8, y / 8, SIZE / 8, 3) * 0.15;
}

export function drawTexture(theme: "light" | "dark") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const ink = getComputedStyle(document.documentElement).getPropertyValue("--grain-ink").trim() || "42,38,32";
  const img = ctx.createImageData(SIZE, SIZE);
  const [r, g, b] = ink.split(",").map((v) => parseInt(v, 10));
  // Light: sparse dots of ink on paper (foxing + grain). Dark: sparse light flecks on charcoal.
  const strength = theme === "light" ? 0.16 : 0.1;
  const alpha = theme === "light" ? 20 : 10;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n = fbm(x, y);
      const level = Math.max(0, (n - 0.42) * 1.6) * strength + hash(x, y, 9) * 0.035;
      if (level > BAYER[y & 7][x & 7]) {
        const i = (y * SIZE + x) * 4;
        img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = alpha;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

export function applyTexture() {
  const theme = (document.documentElement.dataset.theme as "light" | "dark") || "light";
  const key = `texture-v3-${theme}`;
  let url: string | null = null;
  try { url = sessionStorage.getItem(key); } catch {}
  if (!url) {
    url = drawTexture(theme);
    try { if (url) sessionStorage.setItem(key, url); } catch {}
  }
  if (url) document.body.style.setProperty("--texture", `url(${url})`);
}
