// Page runtime: marks the active chapter (for the depth-of-field focus) and mounts each live
// figure only when it comes near the viewport. Figures pause when they leave it.
document.documentElement.classList.add("js");

const loaders = import.meta.glob("../figures/*.live.ts");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Active chapter: the one whose figure's middle is closest to the middle of the viewport.
const chapters = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
let raf = 0;
function focus() {
  raf = 0;
  const mid = innerHeight / 2;
  let best: HTMLElement | null = null, dist = Infinity;
  for (const c of chapters) {
    const r = (c.querySelector(".art") ?? c).getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - mid);
    if (d < dist) { dist = d; best = c; }
  }
  for (const c of chapters) c.toggleAttribute("data-active", c === best);
}
addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(focus); }, { passive: true });
addEventListener("resize", () => { if (!raf) raf = requestAnimationFrame(focus); });
focus();

// Lazy live figures.
for (const fig of document.querySelectorAll<HTMLElement>("[data-figure][data-live]")) {
  const name = fig.dataset.figure!;
  const loader = loaders[`../figures/${name}.live.ts`];
  if (!loader) continue;
  const data = JSON.parse(fig.querySelector("[data-figure-data]")!.textContent!);
  const readout = fig.querySelector("[data-readout]");
  const watchers: ((v: boolean) => void)[] = [];
  let mounted = false;
  new IntersectionObserver(async (entries) => {
    const visible = entries[entries.length - 1].isIntersecting;
    if (visible && !mounted) {
      mounted = true;
      const mod: any = await loader();
      mod.default(fig.querySelector(".stage"), data, {
        still,
        say: (t: string) => { if (readout && readout.textContent !== t) readout.textContent = t; },
        onVisible: (fn: (v: boolean) => void) => { watchers.push(fn); fn(true); },
      });
    }
    watchers.forEach((fn) => fn(visible));
  }, { rootMargin: "200px 0px" }).observe(fig);
}
