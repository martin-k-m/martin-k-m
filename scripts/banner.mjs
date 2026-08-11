// Generate dist/banner.svg and dist/banner-light.svg: the README's header.
//
// This replaces two third-party embeds — capsule-render.vercel.app for the
// waving bar and readme-typing-svg.demolab.com for the rotating role line.
// Both worked, and both meant the top of the profile was rendered by somebody
// else's server: a rate limit, an outage or a shut-down project would leave a
// broken image as the first thing on the page, and neither one could be made to
// match the palette the charts below it already use. Everything here is local.
//
// The structure is borrowed from Credda's org banner (Credda-io/.github,
// profile/banner.svg): a clipped card, a drifting grid, breathing glows behind
// the content, staged reveals, chips, and packets running along a rule. The
// motifs inside it are this repository's own — the blue-to-purple ramp and the
// pulsing endpoint that contrib-graph.mjs already draws — rather than Credda's
// score ring, which is a number that means something there and would mean
// nothing here.
//
// No API, no token, no network. Content is static; it is a script rather than a
// checked-in file so the two themes cannot drift apart, the same way the charts
// emit a pair.

import { mkdir, writeFile } from "node:fs/promises";

const NAME = "Martin Muskov";

// The lines the old typing embed cycled through, reproduced natively below.
const ROLES = ["Studying EE @ UCSC", "Co-Founder @ Credda"];

const CHIPS = ["TYPESCRIPT", "PYTHON", "RUST", "GO"];

// The website's palette, shared by every asset in dist/ so the whole README
// reads as one drawing rather than a stack of unrelated graphics. A warm,
// "creamy engineery" editorial ground with a dark temper; the olive accent is
// the through-line, and the grid paper, hairlines and type are the same
// everywhere. Only the surface and the text move between light and dark.
const THEMES = {
  dark: {
    suffix: "",
    bg: "#15140e",
    surface: "#1d1b13",
    text: "#ece7d6",
    muted: "#b6af98",
    faint: "#8a836c",
    line: "#2b291f",   // hairline
    line2: "#3a3729",  // hairline-2
    a1: "#8f854a",     // accent-soft (khaki)
    a2: "#c9bb70",     // accent (olive)
    grid: 0.9,
    border: 0.5,
    chipFill: 0.05,
    chipStroke: 0.5,
  },
  light: {
    suffix: "-light",
    bg: "#ece7d6",
    surface: "#f4f0e3",
    text: "#2b2820",
    muted: "#55503f",
    faint: "#746e59",
    line: "#dbd4bf",
    line2: "#cec6ac",
    a1: "#a99e5e",
    a2: "#6d6329",
    grid: 0.9,
    border: 0.7,
    chipFill: 0.04,
    chipStroke: 0.6,
  },
};

const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
// Inter for headings, matching the website. A system fallback stack follows it
// so nothing has to be fetched; GitHub strips web-font requests anyway.
const SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// ── Layout ──────────────────────────────────────────────────────────────────
// 820 wide because every chart in dist/ is 820 wide. The README renders them at
// width="100%", so a header on a different grid would line up at one viewport
// width and nowhere else.
const W = 820;
const H = 200;
const padL = 28;
const padR = 28;

const nameY = 74;
const roleY = 108;
const chipY = 130;
const chipH = 24;
const ruleY = 172;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// JetBrains Mono is a fixed-advance face at 0.6em, and every width below is
// computed from that rather than eyeballed.
//
// The catch is that nobody rendering this has JetBrains Mono. The fallbacks do
// not agree on the advance — ui-monospace and Menlo are 0.6, Consolas is 0.55 —
// so the same string is 9% narrower on Windows than the arithmetic says, and a
// caret placed at the computed end of the text floats a visible gap past the
// last glyph. Measured on a real renderer: 148.4px actual against 162 computed.
//
// So anything the layout has to line up against is emitted with `textLength`,
// which makes the browser render the string at exactly the width claimed here
// whatever face it ended up with. The cost is a few percent of tracking on the
// narrower fallbacks; the gain is that the caret and the pill padding are
// correct everywhere instead of only where the advance happens to be 0.6.
const advance = (size) => size * 0.6;
const textW = (s, size) => s.length * advance(size);
/** `textLength` + the attribute that makes it adjust spacing, not glyph shapes. */
const fixW = (s, size) => `textLength="${textW(s, size).toFixed(1)}" lengthAdjust="spacing"`;

// ── Entrances that degrade to visible ───────────────────────────────────────
// The obvious way to stagger a fade-in is opacity="0" plus an animation to 1
// with a `begin` delay. It reads correctly wherever SMIL runs, and it fails to
// blank wherever SMIL does not: the base value is what a renderer without
// animation shows, and that base value is invisible. For a header — the first
// thing on the page — that is the wrong way round.
//
// So the base value is the *finished* state, and the delay moves inside the
// animation. Every entrance begins at 0s and holds at opacity 0 for its share
// of its own duration before fading up. Same staggered result, and anything
// that ignores the animation shows the settled banner instead of an empty card.
//
// `begin` stays at 0 rather than carrying the delay because a delayed begin
// shows the base value until the clock reaches it — here that would flash the
// text on, off, and back on.
// Entrances are motion ON TOP of an already-complete picture, never the thing
// that makes the picture appear. GitHub renders README SVGs as <img>, where
// SMIL does not run, and some rasterizers freeze the first animation frame
// where an opacity reveal reads 0 — either way an entrance that starts hidden
// ships hidden. So every information-bearing element carries its finished value
// as a plain static attribute and gets no reveal at all. This helper is kept as
// a no-op so the call sites still read as "this settles in", and so a future
// reveal can only be added deliberately rather than by default.
function fadeIn(_delay, _dur) {
  return "";
}

// ── The drifting grid ───────────────────────────────────────────────────────
// Drawn oversized and translated by exactly one cell over the cycle, so the
// loop point is invisible: the grid at 40px offset is the same picture as the
// grid at 0.
// Grid paper: crossing hairlines on the hairline colour, drifting by one cell so
// the loop is seamless, and masked so it fades out at the edges of the card. The
// same substrate sits behind every section, which is most of what ties them
// together.
const CELL = 40;
function grid(C) {
  const lines = [];
  for (let x = -CELL; x <= W + CELL; x += CELL) lines.push(`<path d="M${x} ${-CELL} V${H + CELL}"/>`);
  for (let y = -CELL; y <= H + CELL; y += CELL) lines.push(`<path d="M${-CELL} ${y} H${W + CELL}"/>`);
  return `<g mask="url(#fade${C.suffix})"><g class="grid" stroke="${C.line}" stroke-opacity="${C.grid}" stroke-width="1">${lines.join("")}</g></g>`;
}

// ── The role line ───────────────────────────────────────────────────────────
// The typing effect the old embed provided, done with a clip rectangle per role
// whose width animates from nothing to the text width and back. One line types,
// holds and clears while the other waits, so the two never overlap.
//
// There is exactly one caret for both lines, not one each. Emitting a caret per
// role leaves the idle one parked at the start of the line, so the first role
// types with a stray bar sitting under its opening character. It is driven
// across the whole cycle on keyTimes that match both clips in turn — anchoring
// it to the clip edge directly is not something SVG animation can express
// without script, and script does not survive GitHub's image sandbox.
const CYCLE = 9;

// Fractions of the cycle. Role 0 types by 0.16, holds to 0.44 and clears by
// 0.5; role 1 does the same in the second half. The caret's stops are the union
// of both, which is what keeps it on whichever line is currently moving.
const KEYS = ["0;0.16;0.44;0.5;1", "0;0.5;0.66;0.94;1"];
const CARET_KEYS = "0;0.16;0.44;0.5;0.66;0.94;1";

// The old role line typed one line, cleared it, typed the other, using a clip
// whose width animated from 0. That clip is a reveal: its base width for the
// idle line is 0, so a renderer without SMIL shows only one role, and a
// rasterizer that freezes the first frame shows none. Both roles are real
// information, so the line is now a single static string that names both, with
// no clip and no reveal. The one piece of motion left is the caret blink, which
// is decorative — its absence hides nothing.
const ROLE_LINE = ROLES.join("   ·   ");

function roleLine(C) {
  const size = 15;
  const x = padL;
  const w = textW(ROLE_LINE, size);
  const text = `<text x="${x}" y="${roleY}" font-family="${MONO}" font-size="${size}" font-weight="500" fill="${C.muted}" ${fixW(ROLE_LINE, size)}>${esc(ROLE_LINE)}</text>`;
  // Caret parked at the end of the settled line, blinking. Base opacity is 1, so
  // it is a visible bar wherever the blink does not run.
  const caret = `<rect x="${(x + w + 4).toFixed(1)}" y="${roleY - size + 2}" width="2" height="${size}" fill="${C.a2}" opacity="1">
    <animate attributeName="opacity" dur="1.06s" repeatCount="indefinite" values="1;1;0;0" keyTimes="0;0.5;0.5;1" calcMode="discrete"/>
  </rect>`;
  return text + caret;
}

// ── Chips ───────────────────────────────────────────────────────────────────
// Measured from the text rather than hand-placed, so a longer label cannot run
// past its own pill or into the next one.
// The chips read as small-caps labels, which wants tracking. `letter-spacing`
// and `textLength` fight each other — the browser applies the spacing and then
// squeezes the result back to the requested length — so the tracking is baked
// into the requested width instead. One number, honoured exactly, and the pill
// is padded symmetrically around it.
const CHIP_TRACK = 1.18;

function chips(C) {
  const size = 10;
  const padX = 13;
  let x = padL;
  return CHIPS.map((label, i) => {
    const tw = textW(label, size) * CHIP_TRACK;
    const w = tw + padX * 2;
    const g = `<g opacity="1">
    ${fadeIn(0.85 + i * 0.09, 0.5)}
    <rect x="${x.toFixed(1)}" y="${chipY}" width="${w.toFixed(1)}" height="${chipH}" rx="${chipH / 2}" fill="${C.text}" fill-opacity="${C.chipFill}" stroke="${C.line2}" stroke-opacity="${C.chipStroke}"/>
    <text x="${(x + padX).toFixed(1)}" y="${chipY + 16}" font-family="${MONO}" font-size="${size}" fill="${C.muted}" textLength="${tw.toFixed(1)}" lengthAdjust="spacing">${esc(label)}</text>
  </g>`;
    x += w + 9;
    return g;
  }).join("");
}

// ── Packets ─────────────────────────────────────────────────────────────────
// Straight from Credda's banner: dots running the length of a hairline rule,
// staggered so the rule always has traffic on it without any one dot being
// followed too closely.
function packets(C) {
  const n = 4;
  return Array.from({ length: n }, (_, i) => {
    const begin = ((CYCLE / n) * i).toFixed(2);
    return `<circle cy="${ruleY}" r="2.6" fill="${C.a1}" opacity="0">
    <animate attributeName="cx" from="${padL}" to="${W - padR}" dur="${CYCLE}s" begin="${begin}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" dur="${CYCLE}s" begin="${begin}s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.06;0.9;1"/>
  </circle>`;
  }).join("");
}

// ── The monogram ─────────────────────────────────────────────────────────────
// The M mark that every asset shares: one open stroke on a 100 box, no fill,
// drawn in the theme's olive. It anchors the right third of the card, which the
// text does not reach, and it draws itself on with a dash sweep — the slow
// living detail is a dashed hairline ring turning behind it, the same reliable
// SMIL rotate the packets use rather than a CSS transform whose origin does not
// survive GitHub's image sandbox.
//
// The M is always fully drawn: a plain static stroke, no dash reveal, so it is
// the whole mark in every renderer. Its living detail is a gentle opacity
// breathe that never drops below 0.7, so the frozen-first-frame case and the
// no-SMIL case both show a fully visible monogram.
const SIG_X = W - padR - 92;
const SIG_Y = H / 2;
const MONO_PATH = "M20 79 V21 L50 55 L80 21 V79";

/** The shared mark, drawn into a box of side S centred on (cx, cy). */
function monogram(C, cx, cy, S, { stroke, width = 6, breathe = true } = {}) {
  const s = (S / 100).toFixed(4);
  const x = (cx - S / 2).toFixed(2);
  const y = (cy - S / 2).toFixed(2);
  const pulse = breathe
    ? `<animate attributeName="opacity" dur="7s" repeatCount="indefinite" values="0.7;1;0.7" keyTimes="0;0.5;1"/>`
    : "";
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" opacity="1">${pulse}
    <path d="${MONO_PATH}"/>
  </g>`;
}

function signal(C) {
  const still = [30, 46]
    .map(
      (r, i) =>
        `<circle cx="${SIG_X}" cy="${SIG_Y}" r="${r}" fill="none" stroke="${C.line2}" stroke-opacity="${(
          i === 0 ? 0.9 : 0.55
        ).toFixed(3)}" stroke-width="1"/>`
    )
    .join("");
  // A dashed tick ring turning slowly between the two still rings, so the mark
  // reads as a scope rather than a bare target.
  const scope = `<circle cx="${SIG_X}" cy="${SIG_Y}" r="38" fill="none" stroke="${C.line2}" stroke-opacity="0.8" stroke-width="1" stroke-dasharray="2 8">
    <animateTransform attributeName="transform" type="rotate" from="0 ${SIG_X} ${SIG_Y}" to="360 ${SIG_X} ${SIG_Y}" dur="30s" repeatCount="indefinite"/>
  </circle>`;
  return `<g>${still}${scope}${monogram(C, SIG_X, SIG_Y, 44, {
    stroke: `url(#ramp${C.suffix})`,
    width: 7,
    breathe: true,
  })}</g>`;
}

function render(C) {
  const nameSize = 34;
  const label = `${NAME} — ${ROLES.join(", ")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<defs>
  <clipPath id="card${C.suffix}"><rect x="0" y="0" width="${W}" height="${H}" rx="12"/></clipPath>
  <radialGradient id="fadeg${C.suffix}" cx="50%" cy="50%" r="72%">
    <stop offset="0" stop-color="#fff" stop-opacity="1"/>
    <stop offset="0.62" stop-color="#fff" stop-opacity="1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="fade${C.suffix}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="url(#fadeg${C.suffix})"/>
  </mask>
  <linearGradient id="ramp${C.suffix}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.a1}"/>
    <stop offset="1" stop-color="${C.a2}"/>
  </linearGradient>
  <radialGradient id="glowA${C.suffix}" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${C.a1}" stop-opacity="0.20"/>
    <stop offset="0.65" stop-color="${C.a1}" stop-opacity="0.04"/>
    <stop offset="1" stop-color="${C.a1}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="glowB${C.suffix}" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${C.a2}" stop-opacity="0.22"/>
    <stop offset="0.65" stop-color="${C.a2}" stop-opacity="0.05"/>
    <stop offset="1" stop-color="${C.a2}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="rule${C.suffix}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.text}" stop-opacity="0"/>
    <stop offset="0.18" stop-color="${C.text}" stop-opacity="0.16"/>
    <stop offset="0.82" stop-color="${C.text}" stop-opacity="0.16"/>
    <stop offset="1" stop-color="${C.text}" stop-opacity="0"/>
  </linearGradient>
</defs>
<style>
  .grid { animation: drift 16s linear infinite; }
  @keyframes drift { from { transform: translate(0,0); } to { transform: translate(${CELL}px,${CELL}px); } }
  .breathe { animation: breathe 8s ease-in-out infinite; }
  @keyframes breathe { 0%,100% { opacity:.55 } 50% { opacity:1 } }
</style>
<g clip-path="url(#card${C.suffix})">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${grid(C)}
  <ellipse class="breathe" cx="120" cy="30" rx="360" ry="180" fill="url(#glowA${C.suffix})"/>
  <ellipse class="breathe" cx="${SIG_X}" cy="${SIG_Y}" rx="200" ry="150" fill="url(#glowB${C.suffix})" style="animation-delay:2s"/>

  <text x="${padL}" y="${nameY}" font-family="${SANS}" font-size="${nameSize}" font-weight="700" fill="url(#ramp${C.suffix})" opacity="1">${esc(NAME)}
    ${fadeIn(0.15, 0.7)}
  </text>
  ${roleLine(C)}
  ${chips(C)}

  <rect x="${padL}" y="${ruleY}" width="${W - padL - padR}" height="1.2" fill="url(#rule${C.suffix})"/>
  ${packets(C)}
  ${signal(C)}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.line2}" stroke-opacity="${C.border}"/>
</svg>`;
}

// ── The footer ──────────────────────────────────────────────────────────────
// The README closed with a second capsule-render call, the same waving bar
// flipped upside down. Replacing only the header would have left half the page
// still depending on a service that can disappear, so the footer is generated
// here too rather than left as the one remaining embed.
//
// A wave was the wrong register for this system: the rest of the page is calm,
// hairline-framed and editorial, so the footer closes it the same way. A single
// hairline rule with a gap in the middle for the shared monogram, one packet
// drifting along the rule as the living detail, and the same faded grid paper
// behind everything else. Nothing here depends on a service that can disappear.
const FW = 820;
const FH = 70;

function renderFooter(C) {
  const cx = FW / 2;
  const cy = FH / 2;
  const gap = 34;   // half-gap around the monogram
  const inset = 40; // rule inset from each edge
  const CELL = 40;
  const gl = [];
  for (let x = -CELL; x <= FW + CELL; x += CELL) gl.push(`<path d="M${x} ${-CELL} V${FH + CELL}"/>`);
  for (let y = -CELL; y <= FH + CELL; y += CELL) gl.push(`<path d="M${-CELL} ${y} H${FW + CELL}"/>`);

  // One packet running the left segment of the rule and fading, so the footer is
  // never dead but never busy. Base state is invisible-at-rest, which is fine
  // here: the rule and monogram carry the footer without it.
  const packet = `<circle cy="${cy}" r="2.4" fill="url(#fr${C.suffix})" opacity="0">
    <animate attributeName="cx" from="${inset}" to="${cx - gap}" dur="6s" begin="0s" repeatCount="indefinite"/>
    <animate attributeName="opacity" dur="6s" begin="0s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.1;0.85;1"/>
  </circle>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FW} ${FH}" width="${FW}" height="${FH}" role="presentation" aria-hidden="true">
<defs>
  <linearGradient id="fr${C.suffix}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.a1}"/>
    <stop offset="1" stop-color="${C.a2}"/>
  </linearGradient>
  <radialGradient id="ffadeg${C.suffix}" cx="50%" cy="50%" r="70%">
    <stop offset="0" stop-color="#fff" stop-opacity="1"/>
    <stop offset="0.55" stop-color="#fff" stop-opacity="1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="ffade${C.suffix}" maskUnits="userSpaceOnUse" x="0" y="0" width="${FW}" height="${FH}">
    <rect width="${FW}" height="${FH}" fill="url(#ffadeg${C.suffix})"/>
  </mask>
  <linearGradient id="frule${C.suffix}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.line2}" stop-opacity="0"/>
    <stop offset="0.5" stop-color="${C.line2}" stop-opacity="1"/>
    <stop offset="1" stop-color="${C.line2}" stop-opacity="0"/>
  </linearGradient>
</defs>
<g mask="url(#ffade${C.suffix})"><g stroke="${C.line}" stroke-opacity="${C.grid}" stroke-width="1">${gl.join("")}</g></g>
<rect x="${inset}" y="${cy - 0.6}" width="${cx - gap - inset}" height="1.2" fill="url(#frule${C.suffix})"/>
<rect x="${cx + gap}" y="${cy - 0.6}" width="${cx - gap - inset}" height="1.2" fill="url(#frule${C.suffix})"/>
${packet}
${monogram(C, cx, cy, 30, { stroke: `url(#fr${C.suffix})`, width: 8, breathe: true })}
</svg>`;
}

await mkdir("dist", { recursive: true });
for (const theme of Object.values(THEMES)) {
  await writeFile(`dist/banner${theme.suffix}.svg`, render(theme), "utf8");
  await writeFile(`dist/footer${theme.suffix}.svg`, renderFooter(theme), "utf8");
}
console.log(
  `banner${"/-light"} + footer · ${W}x${H} and ${FW}x${FH} · ` +
    `${ROLES.length} roles, ${CHIPS.length} chips, no network`
);
