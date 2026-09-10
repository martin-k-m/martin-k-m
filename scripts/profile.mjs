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
// One file, one theme. A terminal does not follow the desktop's light mode; it
// is a dark panel whatever the page around it is doing, and that is the point
// of the drawing. So there is no light variant and no `prefers-color-scheme`
// anywhere -- neither in the SVG nor behind a <picture> in the README. That
// also removes the whole class of bug the pair had, where the theme GitHub
// chose and the theme the file painted itself could disagree.
//
// It boots. The panel types its own commands and streams their output, the way
// a CLI does on a cold start, and settles into the finished picture in about
// eight seconds.
//
// THE CONSTRAINT THAT SHAPES HOW. GitHub serves README images through its proxy
// and renders them in an <img>: CSS animation runs there, SMIL is unreliable,
// and a rasterizer that ignores CSS shows whatever the static attributes say.
// So the animation is written the safe way round -- **every element's resting
// state is its finished state**, and the keyframes reach back to hide it. A
// renderer that ignores the animation draws the completed panel rather than an
// empty one, which is the failure mode the previous, wholly static version was
// written to avoid. `animation-fill-mode: both` holds the last frame, so the
// boot happens once and stays finished rather than looping.
//
// The only elements hidden at rest are the four typing carets, which are pure
// decoration: an animation-blind renderer drops them and loses nothing.
//
// Under `prefers-reduced-motion` the whole boot is switched off and the panel
// is simply there, which is the same picture the last frame arrives at.
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

// The palette is a terminal's: one near-black ground, three weights of a
// slightly warm off-white ink, and a single phosphor-green accent that only
// ever marks the prompt, the ticks and the caret. Nothing else is coloured, so
// the accent always means "the machine said this".
const THEME = [
  "  --bg: #0b0f0e;",
  "  --edge: #1f2724;",
  "  --hair: #161d1b;",
  "  --fg: #e3ebe5;",
  "  --mid: #a2b2a9;",
  "  --dim: #6d7c75;",
  "  --accent: #7ec98f;",
].join("\n");

const out = [];
let y = 0;

// ── The boot clock ────────────────────────────────────────────────────────
// One cursor in seconds, walked forward as the panel is emitted, so the order
// things appear in the drawing IS the order they appear in the file. Nothing
// has to be kept in sync by hand.
let t = 0;

/** Seconds per character typed. A shade faster than a person, as a machine is. */
const CPS = 0.038;
const typeTime = (s) => s.length * CPS;

let uid = 0;

/**
 * Wrap something so it arrives at `at` seconds.
 *
 * The class carries no opacity of its own -- the keyframes do -- so the resting
 * state is visible and only a renderer that actually runs the animation ever
 * sees it hidden.
 */
function reveal(at, svg) {
  return `<g class="r" style="animation-delay:${at.toFixed(2)}s">${svg}</g>`;
}

/**
 * A prompt line that types itself.
 *
 * The command is clipped by a rect whose width steps up one character at a
 * time, and a block caret rides the clip edge and vanishes when the line is
 * done. `steps(n)` rather than a linear width is what makes it read as
 * characters appearing rather than as a wipe.
 */
function typed(x, y, cmd, at) {
  const size = 14;
  const cw = size * ADV;
  const tx = x + cw * 2;
  const w = (cmd.length * cw).toFixed(1);
  const dur = typeTime(cmd).toFixed(2);
  const id = `t${uid++}`;
  return (
    `<g class="r" style="animation-delay:${at.toFixed(2)}s">` +
    line(x, y, "$", { size, cls: "accent", weight: 700 }) +
    `</g>` +
    `<clipPath id="${id}"><rect x="${tx}" y="${y - size}" height="${size * 1.5}" width="${w}" ` +
    `style="animation:type ${dur}s steps(${cmd.length}) ${at.toFixed(2)}s both"/></clipPath>` +
    `<g clip-path="url(#${id})">${line(tx, y, cmd, { size, cls: "fg", weight: 500 })}</g>` +
    // The travel distance differs per line, so it rides on a custom property
    // the keyframes read rather than on a keyframe set per command.
    `<rect class="tcaret" x="${tx}" y="${(y - size + 2).toFixed(1)}" width="${cw.toFixed(1)}" height="${size}" ` +
    `style="--w:${w}px;animation:ride ${dur}s steps(${cmd.length}) ${at.toFixed(2)}s forwards"/>`
  );
}

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
out.push(typed(PAD, y, "whoami", t));
t += typeTime("whoami") + 0.3;
y += 26;
out.push(reveal(t, line(PAD, y, "Martin Muskov", { size: 22, cls: "fg", weight: 700 })));
t += 0.1;
y += 24;
out.push(reveal(t, line(PAD, y, "SWE & AI/ML  ·  CTO @ Credda  ·  EE/CS @ UCSC", { size: 13, cls: "mid" })));
t += 0.08;
y += 19;
out.push(reveal(t, line(PAD, y, "systems software, and trying to break it before it ships", { size: 13, cls: "dim" })));
t += 0.5;

y += 46;

// ── The two that get the space ────────────────────────────────────────────
// Credda first because it is the one with other people's money in it, twill
// second because it is the one with the most of me in it. Everything else is
// one line each, further down, which is the honest weighting.
function feature({ cmd, title, blurb, checks, meta, href }) {
  const block = [];
  block.push(typed(PAD, y, cmd, t));
  // The pause between the last keystroke and the first line of output. Without
  // it the answer arrives while the question is still being asked.
  t += typeTime(cmd) + 0.32;
  y += 28;
  block.push(reveal(t, line(PAD, y, title, { size: 17, cls: "fg", weight: 700 })));
  t += 0.12;
  y += 22;
  // The prose streams a line at a time, which is what a CLI writing to a pipe
  // actually looks like.
  for (const l of blurb) {
    block.push(reveal(t, line(PAD, y, l, { size: 13, cls: "mid" })));
    t += 0.07;
    y += 18;
  }
  t += 0.18;
  y += 6;
  // The ticks land slower than the prose. Each one is a separate claim being
  // settled, and they are the lines a reader is meant to stop on.
  for (const c of checks) {
    block.push(reveal(t, check(PAD, y, c)));
    t += 0.14;
    y += 19;
  }
  t += 0.1;
  y += 4;
  block.push(reveal(t, line(PAD, y, meta, { size: 12, cls: "dim" })));
  t += 0.12;
  y += 14;
  block.push(reveal(t, `<path d="M${PAD} ${y} H${W - PAD}" class="hair"/>`));
  t += 0.35;
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
    meta: "co-founder & chief technology officer  ·  credda.io  ·  github.com/Credda-io",
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
    // No version number and no repository count here. This panel is regenerated
    // when THIS repository is pushed, not when twill releases, so any number in
    // it is stale by default: it said v1.9.0 while twill was on 1.12.0, three
    // releases later. What is written instead is what does not rot.
    meta: "self-hosting  ·  twill-lang.github.io  ·  github.com/twill-lang",
  }),
);

// ── Everything else ───────────────────────────────────────────────────────
// One line each, aligned on a column, which is the whole point of a monospace
// panel: a list you can read down rather than a wall of cards.
out.push(typed(PAD, y, "ls ~/everything-else", t));
t += typeTime("ls ~/everything-else") + 0.3;
y += 28;

const ROWS = [
  ["arc/", "Rust", "an execution cache that traces what a build really read"],
  ["quorum/", "Go", "a Raft key-value store, checked for linearizability"],
  ["strata/", "Java", "an LSM storage engine, recovery proved byte by byte"],
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
  // A listing comes back fast and all at once, so these are the quickest rows
  // in the panel; anything slower would read as ten separate commands.
  out.push(
    reveal(
      t,
      line(NAME_COL, y, name, { size: 13, cls: "fg" }) +
        line(LANG_COL, y, lang, { size: 12, cls: "accent" }) +
        line(DESC_COL, y, desc, { size: 13, cls: "mid" }),
    ),
  );
  t += 0.055;
  y += 21;
}

t += 0.2;
y += 8;
out.push(reveal(t, line(PAD, y, "the rest, always current, is on the repositories tab", { size: 12, cls: "dim" })));
t += 0.3;
y += 40;

// ── The caret ─────────────────────────────────────────────────────────────
// The one thing that has to move. A terminal with a still caret is a
// screenshot; a terminal with a blinking one is a machine that is waiting.
out.push(reveal(t, prompt(PAD, y, "")));
out.push(
  `<g class="r" style="animation-delay:${t.toFixed(2)}s">` +
    `<rect class="caret" x="${PAD + 17}" y="${y - 11}" width="8" height="14" rx="1"/></g>`,
);
y += 26;

const H = y;

function render() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc" fill="none">
<title id="title">Martin Muskov — Credda, twill, and everything else</title>
<desc id="desc">A terminal panel that boots: it types each command and streams the reply. whoami gives the name and what the work is; credda and twill each get a paragraph and three claims; then ten other projects, one line each. The finished panel is the resting state, so nothing here depends on the animation running.</desc>
<style>
:root {
${THEME}
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

/* ── The boot ──────────────────────────────────────────────────────────
   Read these from the bottom up: the resting state of everything here is
   the FINISHED state, and the keyframes reach backwards to hide it. A
   renderer that ignores CSS animation draws the completed panel, which is
   the whole reason the animation is written this way round rather than
   with opacity:0 sitting in an attribute. */
.r { animation: rise 0.3s cubic-bezier(0.2, 0.7, 0.3, 1) both; }
@keyframes rise {
  from { opacity: 0; transform: translateY(3px) }
  to   { opacity: 1; transform: none }
}
/* The clip that uncovers a command one character at a time. */
@keyframes type { from { width: 0 } }
/* The caret that rides the clip edge, and is gone once the line is typed.

   forwards rather than both on purpose, and it is the difference between this
   working and not: with both, the backwards fill paints the 0% frame during
   the delay, so every caret that has not had its turn yet sits lit at the left
   margin. Three of them did. Without the backwards fill the element rests at
   its own opacity:0 until the animation actually starts. */
.tcaret { fill: var(--accent); opacity: 0; }
@keyframes ride {
  0%       { opacity: 0.85; transform: none }
  99%      { opacity: 0.85 }
  to       { opacity: 0; transform: translateX(var(--w)) }
}
@keyframes run {
  0%   { transform: translateX(-60px); opacity: 0 }
  6%   { opacity: 0.5 }
  94%  { opacity: 0.5 }
  100% { transform: translateX(${W + 60}px); opacity: 0 }
}
/* Reduced motion switches the boot off rather than slowing it down. The
   resting state is the finished panel, so removing every animation lands
   on exactly the picture the last frame would have reached. */
@media (prefers-reduced-motion: reduce) {
  .caret, .packet, .r, .tcaret { animation: none }
  clipPath rect { animation: none }
}
</style>
${out.join("\n").replace('height="H"', `height="${H - 1}"`)}
</svg>
`;
}

await mkdir(new URL("../dist/", import.meta.url), { recursive: true });
await writeFile(new URL("../dist/profile.svg", import.meta.url), render(), "utf8");
console.log(`dist/profile.svg  ${W}x${H}`);
