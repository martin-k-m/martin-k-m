// Generate dist/profile.svg: the whole README, as one drawing.
//
// The README used to be a page of Markdown with six generated images set into
// it — a banner, four project cards, a footer — each a light/dark pair behind a
// <picture>, with prose between them. This replaces all of it with a single
// terminal panel, in Credda's idiom rather than this repository's old one:
// monospace throughout, hairlines, a near-black ground, one accent, and the
// content arranged as commands and their output.
//
// ── Two things the format decides for you ──────────────────────────────────
//
// Two files, one drawing. The colours are CSS custom properties now, so the
// pair is emitted from one set of shapes and cannot drift the way two
// hand-maintained files would.
//
// It is a pair rather than a single file with a `prefers-color-scheme` block,
// and that is a fact about GitHub rather than a preference. A README image is
// an <img>, and an SVG loaded that way resolves its own media queries against
// the *browser's* setting, not against the theme GitHub is painting the page
// in. Somebody reading a dark GitHub on a light desktop would get a cream card
// in a dark page. `<picture>` with two `prefers-color-scheme` sources is what
// GitHub's markdown honours, and it follows the site's own theme.
//
// And each file is unconditionally its own theme, with no media query inside
// it. Keeping one looked harmless and was not: `<picture>` hands the browser
// the file GitHub's theme chose, and a `prefers-color-scheme` rule inside that
// file then overrides it from the browser's setting. A dark GitHub on a light
// desktop got the dark file, which promptly repainted itself cream. Caught by
// looking at the two of them side by side with the browser forced to light.
//
// Nothing that carries information animates. GitHub serves README images
// through its proxy and renders them in an <img>: CSS animation runs there,
// SMIL is unreliable, and a rasterizer that ignores both shows the first frame.
// So every word and rule below is drawn in its finished state as a plain static
// attribute, and the only animated things are decorations that may as well be
// still: the caret blink, a packet crossing the header rule, and a glow that
// breathes. Read with animation off, this is the same picture.
//
// No network, no fonts to fetch, no build step but node.

import { mkdir, writeFile } from "node:fs/promises";

const W = 880;
const PAD = 28;

/** Monospace everywhere. The aesthetic is a terminal; a sans line would break it. */
const MONO = "ui-monospace,SFMono-Regular,'JetBrains Mono',Menlo,Consolas,monospace";

/**
 * Advance width per character, as a fraction of the font size.
 *
 * Every monospace face is close to 0.6em and none is exactly it, so each line
 * carries an explicit `textLength`: without it a renderer that picks a
 * different fallback lays the text out at its own width and the columns below
 * stop lining up. `lengthAdjust="spacing"` stretches the gaps rather than the
 * glyphs, so the letterforms stay the face's own.
 */
const ADV = 0.6;
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** One line of monospace text, pinned to a width so columns survive a font swap. */
function line(x, y, s, { size = 13, cls = "fg", weight = 400 } = {}) {
  const len = (s.length * size * ADV).toFixed(1);
  return `<text x="${x}" y="${y}" class="${cls}" font-family="${MONO}" font-size="${size}" font-weight="${weight}" textLength="${len}" lengthAdjust="spacing" xml:space="preserve">${esc(s)}</text>`;
}

/** A prompt line: the sigil in the accent, the command in the foreground. */
function prompt(x, y, cmd) {
  const size = 14;
  const sigil = line(x, y, "$", { size, cls: "accent", weight: 700 });
  const text = line(x + size * ADV * 2, y, cmd, { size, cls: "fg", weight: 500 });
  return sigil + text;
}

/** `✓ ` in the accent, then the claim. The tick is a glyph, not an image. */
function check(x, y, s) {
  const size = 13;
  return (
    line(x, y, "✓", { size, cls: "accent" }) +
    line(x + size * ADV * 2, y, s, { size, cls: "mid" })
  );
}

// The palette is this repository's own -- the cream-and-olive the website and
// the old banner already used -- arranged the way Credda's terminal panel is:
// one ground, three weights of ink, and a single accent that only ever marks
// the prompt, the ticks and the caret.
const DARK = [
  "  --bg: #0f0f0e;",
  "  --edge: #2a2a26;",
  "  --hair: #1e1e1b;",
  "  --fg: #ece7d6;",
  "  --mid: #a8a290;",
  "  --dim: #7c7767;",
  "  --accent: #c9bb70;",
].join("\n");

const LIGHT = [
  "  --bg: #f4f0e3;",
  "  --edge: #d8d2bd;",
  "  --hair: #e2ddcb;",
  "  --fg: #23211a;",
  "  --mid: #55503f;",
  "  --dim: #7a7460;",
  "  --accent: #6d6329;",
].join("\n");

const out = [];
let y = 0;

// ── Chrome ─────────────────────────────────────────────────────────────────
// A title bar with three dots. It is the one purely decorative element that
// earns its place: it says "terminal" in less space than any label would.
out.push(`<rect x="0.5" y="0.5" width="${W - 1}" height="${"H"}" rx="10" class="card"/>`);
out.push(`<path d="M0 44 H${W}" class="rule"/>`);
// The dots take their colour from the panel's own ink rather than the usual
// red/amber/green, which would be the only saturated thing in the drawing and
// would read as a status light rather than as window furniture.
out.push(
  [0, 1, 2]
    .map((i) => `<circle cx="${24 + i * 18}" cy="22" r="5.5" class="dot" opacity="${0.5 - i * 0.12}"/>`)
    .join(""),
);
out.push(line(96, 27, "martin-k-m — profile", { size: 12, cls: "dim" }));
// A packet crossing the header rule, the same living detail the old banner had.
out.push(`<rect class="packet" x="0" y="42.5" width="46" height="3" rx="1.5"/>`);

y = 44 + 40;

// ── whoami ────────────────────────────────────────────────────────────────
out.push(prompt(PAD, y, "whoami"));
y += 26;
out.push(line(PAD, y, "Martin Muskov", { size: 22, cls: "fg", weight: 700 }));
y += 24;
out.push(line(PAD, y, "electrical engineering at UC Santa Cruz, co-founder of Credda", { size: 13, cls: "mid" }));
y += 19;
out.push(line(PAD, y, "systems software, and trying to break it before it ships", { size: 13, cls: "dim" }));

y += 46;

// ── The two that get the space ────────────────────────────────────────────
// Credda first because it is the one with other people's money in it, twill
// second because it is the one with the most of me in it. Everything else is
// one line each, further down, which is the honest weighting.
function feature({ cmd, title, blurb, checks, meta, href }) {
  const block = [];
  block.push(prompt(PAD, y, cmd));
  y += 28;
  block.push(line(PAD, y, title, { size: 17, cls: "fg", weight: 700 }));
  y += 22;
  for (const l of blurb) {
    block.push(line(PAD, y, l, { size: 13, cls: "mid" }));
    y += 18;
  }
  y += 6;
  for (const c of checks) {
    block.push(check(PAD, y, c));
    y += 19;
  }
  y += 4;
  block.push(line(PAD, y, meta, { size: 12, cls: "dim" }));
  y += 14;
  block.push(`<path d="M${PAD} ${y} H${W - PAD}" class="hair"/>`);
  y += 34;
  return block.join("");
}

out.push(
  feature({
    cmd: "credda --what",
    title: "Credda",
    blurb: [
      "Something broke in production. Credda ships the fix: it prepares an",
      "environment, reproduces the failure, captures the signature as evidence,",
      "diagnoses the cause, writes the patch, and proves it with a test that",
      "fails before and passes after. A person reviews a diff, not a bug report.",
    ],
    checks: [
      "reproduction is the gate, not a step",
      "every material claim cites a recorded artifact",
      "it proposes, and never merges",
    ],
    meta: "co-founder  ·  credda.io  ·  github.com/Credda-io",
  }),
);

out.push(
  feature({
    cmd: "twill --what",
    title: "twill",
    blurb: [
      "A language where tensors are the primitive and a shape mistake is an",
      "error you see before the program runs. Most numeric code is a general",
      "language with a framework bolted on; this is the other direction. The",
      "compiler is written in twill, and ten libraries downstream of it are too.",
    ],
    checks: [
      "shape and unit errors caught at check time",
      "differentiation is syntax, not a library",
      "one deterministic binary, no dependencies",
    ],
    meta: "v1.9.0  ·  10 repositories  ·  twill-lang.github.io",
  }),
);

// ── Everything else ───────────────────────────────────────────────────────
// One line each, aligned on a column, which is the whole point of a monospace
// panel: a list you can read down rather than a wall of cards.
out.push(prompt(PAD, y, "ls ~/everything-else"));
y += 28;

const ROWS = [
  ["arc/", "Rust", "an execution cache that traces what a build really read"],
  ["quorum/", "Go", "a Raft key-value store, checked for linearizability"],
  ["strata/", "Java", "an LSM storage engine, recovery proved byte by byte"],
  ["scalar/", "TS", "self-hosted productivity infrastructure, 11 repositories"],
  ["quarry/", "Python", "a SQL engine over CSV, standard library only"],
  ["lincheck/", "Go", "quorum's linearizability checker, made pointable"],
  ["capsule/", "Go", "throwaway dev environments from one config file"],
  ["drift/", "Rust", "diff two tables by key rather than by line"],
  ["tandem/", "Java", "durable workflow orchestration for the JVM"],
  ["poliarchitect/", "TS", "a political economy sandbox, ticked on a schedule"],
];

const NAME_COL = PAD;
const LANG_COL = PAD + 130;
const DESC_COL = PAD + 200;
for (const [name, lang, desc] of ROWS) {
  out.push(line(NAME_COL, y, name, { size: 13, cls: "fg" }));
  out.push(line(LANG_COL, y, lang, { size: 12, cls: "accent" }));
  out.push(line(DESC_COL, y, desc, { size: 13, cls: "mid" }));
  y += 21;
}

y += 8;
out.push(line(PAD, y, "the rest, always current, is on the repositories tab", { size: 12, cls: "dim" }));
y += 40;

// ── The caret ─────────────────────────────────────────────────────────────
// The one thing that has to move. A terminal with a still caret is a
// screenshot; a terminal with a blinking one is a machine that is waiting.
out.push(prompt(PAD, y, ""));
out.push(`<rect class="caret" x="${PAD + 17}" y="${y - 11}" width="8" height="14" rx="1"/>`);
y += 26;

const H = y;

function render(theme) {
  const light = theme === "light";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc" fill="none">
<title id="title">Martin Muskov — Credda, twill, and everything else</title>
<desc id="desc">A terminal panel. whoami gives the name and what the work is; credda and twill each get a paragraph and three claims; then ten other projects, one line each.</desc>
<style>
:root {
${light ? LIGHT : DARK}
}
.card { fill: var(--bg); stroke: var(--edge); stroke-width: 1; }
.rule { stroke: var(--edge); stroke-width: 1; }
.hair { stroke: var(--hair); stroke-width: 1; }
.fg { fill: var(--fg); }
.mid { fill: var(--mid); }
.dim { fill: var(--dim); }
.accent { fill: var(--accent); }
.dot { fill: var(--dim); }
.caret { fill: var(--accent); animation: blink 1.1s steps(1) infinite; }
.packet { fill: var(--accent); opacity: 0.5; animation: run 9s linear infinite; }
@keyframes blink { 0%, 55% { opacity: 1 } 56%, 100% { opacity: 0 } }
@keyframes run {
  0%   { transform: translateX(-60px); opacity: 0 }
  6%   { opacity: 0.5 }
  94%  { opacity: 0.5 }
  100% { transform: translateX(${W + 60}px); opacity: 0 }
}
@media (prefers-reduced-motion: reduce) {
  .caret, .packet { animation: none }
}
</style>
${out.join("\n").replace('height="H"', `height="${H - 1}"`)}
</svg>
`;
  return svg;
}

await mkdir(new URL("../dist/", import.meta.url), { recursive: true });
for (const theme of ["dark", "light"]) {
  const name = theme === "light" ? "profile-light.svg" : "profile.svg";
  await writeFile(new URL(`../dist/${name}`, import.meta.url), render(theme), "utf8");
  console.log(`dist/${name}  ${W}x${H}`);
}
