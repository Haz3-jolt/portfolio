# harisrinivasan.dev

My personal site: the story from game dev at twelve to maintaining Agentic Resource Registry, told
through isometric objects on one long workbench, over a live ASCII fog.

- **Stack:** [Astro](https://astro.build) (static output), [anime.js](https://animejs.com) v4,
  [three.js](https://threejs.org) for the arcade, isometric SVG figures drawn with the
  [Anatomy](https://github.com/wheresryan22/anatomy) kit (`src/lib/iso`).
- **Data:** `npm run data` pulls my merged PRs and repos from the GitHub API into `src/data/github.json`.
- **Deploy:** `npm run deploy` builds and ships to Cloudflare (static assets on Workers, free plan).
  A GitHub Action rebuilds daily so the PR list stays fresh.

```bash
npm install
npm run dev
```

## Third-party

- `public/doom/doom.wasm`: id Software's linuxdoom-1.10 (GPL-2.0) with the shareware DOOM1.WAD,
  compiled by [diekmann/wasm-fizzbuzz](https://github.com/diekmann/wasm-fizzbuzz) (source there).
- `src/lib/iso/*.mjs`: from [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) (MIT).
- `public/axolotl.gif`: Axl's mascot from [Observal/Axl](https://github.com/Observal/Axl).
- `public/arr-logo-160.png`: from [Agentic Resource Registry](https://github.com/AgenticResourceRegistry/AgenticResourceRegistry).
