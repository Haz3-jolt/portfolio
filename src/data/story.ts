// The story, oldest first. Every claim here is checked against GitHub or Hari's own account.
export type Link = { label: string; href: string };
export type Chapter = {
  id: string;
  year: string;
  title: string;
  body: string[];
  facts?: string[];
  links?: Link[];
  figure: string;
  logo?: { src: string; width: number; height: number };
  weight?: "large" | "normal";
};

const gh = (path: string) => `https://github.com/${path}`;

export const chapters: Chapter[] = [
  {
    id: "games",
    year: "2017",
    title: "Games in Unity",
    body: ["I was twelve. Unity, C#, and a lot of small games that mostly broke. It taught me that code is something you can play with, and that you learn fastest by building the thing you want to exist.", "Click the computer to play."],
    figure: "crt",
  },
  {
    id: "robots",
    year: "2019",
    title: "Robots",
    body: ["Then the code left the screen. Arduino and Raspberry Pi, motors, sensors and a lot of solder. My CS50 final project was a little bot that wanders a U-shaped track, steering away from the boundary lines and around obstacles, then parks itself in the box at the end."],
    links: [{ label: "Obstacle-avoiding parking bot", href: gh("Haz3-jolt/Path-travelling-and-parking-arduino-bot") }],
    figure: "robot",
  },
  {
    id: "ml",
    year: "2021",
    title: "Python and a bit of ML",
    body: ["Python, neural nets built from scratch to see how they actually learn, and OpenCV. One project watches your hand through a webcam, tracks each finger and runs commands when it recognises a gesture."],
    links: [{ label: "Finger-tracking gestures", href: gh("Haz3-jolt/Finger-tracking-gestures") }],
    figure: "kinect",
  },
  {
    id: "dasa",
    year: "2023",
    title: "DASA-Bot",
    body: [
      "**The first thing I built that real people used.** A Discord bot for students applying to Indian colleges through DASA: ask /cutoff or /analyze with your rank and it answers from years of cutoff data, even if you call NIT Trichy \"nitt\".",
      "We were scrappy about it. The database was a Google Sheet. The college nicknames were a hand-typed dictionary. It held up anyway: **more than 1,000 people** used it during admissions season.",
    ],
    facts: ["1,000+ users", "Top contributor"],
    links: [{ label: "DASA-Bot on GitHub", href: gh("DASA-boys/DASA-Bot") }],
    figure: "rolodex",
  },
  {
    id: "ankidroid",
    year: "2023–26",
    title: "AnkiDroid",
    body: [
      "Late 2023 I started reading the AnkiDroid codebase, the open source Anki flashcard app for Android with **10M+ downloads on Google Play**. Small fixes and tests first, then export support, then bigger things. 44 merged PRs so far.",
      "In 2025 I got into **Google Summer of Code** with AnkiDroid to rebuild its UI for tablets and Chromebooks: resizable multi-pane layouts, an editor with the previewer beside it, right-click menus and mouse support.",
    ],
    facts: ["10M+ downloads", "GSoC 2025", "44 merged PRs"],
    links: [
      { label: "AnkiDroid on Google Play", href: "https://play.google.com/store/apps/details?id=com.ichi2.anki" },
      { label: "GSoC 2025 project", href: "https://summerofcode.withgoogle.com/archive/2025/projects/pctRgn1E" },
      { label: "My PRs", href: gh("ankidroid/Anki-Android/pulls?q=is%3Apr+author%3AHaz3-jolt+is%3Amerged") },
    ],
    figure: "foldable",
    logo: { src: "/gsoc-sun.png", width: 40, height: 40 },
  },
  {
    id: "notetype",
    year: "2025–26",
    title: "Change Note Type",
    body: [
      "On 19 January 2025 I asked if issue #14134 was free to pick up and wrote \"I might take at least a week on this.\" It let you move notes to a different note type, mapping every old field and card onto the new one.",
      "It merged on 19 January 2026, **exactly one year later**: 2,488 lines across 32 files, through 38 reviews.",
    ],
    facts: ["+2,488 lines", "38 reviews", "1 year to the day"],
    links: [
      { label: "The issue", href: gh("ankidroid/Anki-Android/issues/14134") },
      { label: "The PR", href: gh("ankidroid/Anki-Android/pull/18602") },
    ],
    figure: "notetype-demo",
  },
  {
    id: "arr",
    year: "2026",
    title: "Agentic Resource Registry",
    body: [
      "Now I **maintain Agentic Resource Registry**: a self-hosted, Apache 2.0 registry where teams share the skills, MCP servers, hooks, prompts and agent files their coding agents use, and see which ones actually help.",
      "I'm its top contributor and I cut the releases. Since April 2026 that's 421 merged PRs and 1,262 commits.",
    ],
    facts: ["Maintainer", "421 merged PRs", "4,300+ stars"],
    links: [
      { label: "Repository", href: gh("AgenticResourceRegistry/AgenticResourceRegistry") },
      { label: "agenticresourceregistry.io", href: "https://agenticresourceregistry.io/" },
    ],
    figure: "arr",
    logo: { src: "/arr-logo-160.png", width: 40, height: 40 },
    weight: "large",
  },
  {
    id: "axl",
    year: "2026",
    title: "Axl",
    body: ["A local-first agent harness I **co-wrote**. One daemon owns your coding session, and every client, terminal or browser, is a window into the same session. Close one and the work keeps going."],
    facts: ["Top contributor", "1,000+ stars"],
    links: [{ label: "Axl on GitHub", href: gh("Observal/Axl") }],
    figure: "engine",
  },
];
