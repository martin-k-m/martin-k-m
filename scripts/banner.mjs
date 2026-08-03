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

// Same two palettes as every other asset in dist/, so the header sits on the
// charts below it rather than next to them. The blue-to-purple accent is the
// through-line and is identical in both; only the surface and the text move.
const THEMES = {
  dark: {
    suffix: "",
    bg: "#0A0A0C",
    text: "#ECEDF1",
    muted: "#6D6E79",
    a1: "#4F8CFF",
    a2: "#7C6CFF",
    grid: 0.05,
    border: 0.06,
    chipFill: 0.04,
    chipStroke: 0.1,
  },
  light: {
    suffix: "-light",
    bg: "#FFFFFF",
    text: "#1F2328",
    muted: "#59636E",
    a1: "#4F8CFF",
    a2: "#7C6CFF",
    // A grid drawn at 5% black is invisible where 5% white on near-black is
    // not, so the light theme carries more of everything structural.
    grid: 0.09,
    border: 0.14,
    chipFill: 0.03,
    chipStroke: 0.16,
  },
};

const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";

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

// ── The drifting grid ───────────────────────────────────────────────────────
// Drawn oversized and translated by exactly one cell over the cycle, so the
// loop point is invisible: the grid at 40px offset is the same picture as the
// grid at 0.
const CELL = 40;
function grid(C) {
  const lines = [];
  for (let x = -CELL; x <= W + CELL; x += CELL) lines.push(`<path d="M${x} ${-CELL} V${H + CELL}"/>`);
  for (let y = -CELL; y <= H + CELL; y += CELL) lines.push(`<path d="M${-CELL} ${y} H${W + CELL}"/>`);
  return `<g class="grid" stroke="${C.a2}" stroke-opacity="${C.grid}" stroke-width="1">${lines.join("")}</g>`;
}

// ── The role line ───────────────────────────────────────────────────────────
// The typing effect the old embed provided, done with a clip rectangle whose
// width animates from nothing to the text width and back. The caret is a
// separate rect animating its x on the *same* keyTimes, which is what keeps the
// two in step; anchoring it to the clip edge directly is not something SVG
// animation can express without script, and script does not survive GitHub's
// image sandbox.
//
// One line types, holds, and clears while the other waits, so the two never
// overlap. The cycle is the same length for both, offset by half.
const CYCLE = 9;

function roleLine(C) {
  const size = 15;
  const x = padL;
  const parts = ROLES.map((role, i) => {
    const w = textW(role, size);
    // Fractions of the cycle: type, hold, clear, then wait out the other line.
    const keyTimes = i === 0 ? "0;0.16;0.44;0.5;1" : "0;0.5;0.66;0.94;1";
    const widths = i === 0 ? `0;${w};${w};0;0` : `0;0;${w};${w};0`;
    const carets = i === 0
      ? `${x};${x + w};${x + w};${x};${x}`
      : `${x};${x};${x + w};${x + w};${x}`;
    return `
  <clipPath id="type${i}${C.suffix}"><rect x="${x}" y="${roleY - size}" width="0" height="${size + 6}">
    <animate attributeName="width" dur="${CYCLE}s" repeatCount="indefinite" keyTimes="${keyTimes}" values="${widths}" calcMode="linear"/>
  </rect></clipPath>
  <text x="${x}" y="${roleY}" clip-path="url(#type${i}${C.suffix})" font-family="${MONO}" font-size="${size}" font-weight="500" fill="${C.muted}" ${fixW(role, size)}>${esc(role)}</text>
  <rect y="${roleY - size + 2}" width="2" height="${size}" fill="${C.a1}" x="${x}">
    <animate attributeName="x" dur="${CYCLE}s" repeatCount="indefinite" keyTimes="${keyTimes}" values="${carets}" calcMode="linear"/>
    <animate attributeName="opacity" dur="1.06s" repeatCount="indefinite" values="1;1;0;0" keyTimes="0;0.5;0.5;1" calcMode="discrete"/>
  </rect>`;
  });
  return parts.join("");
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
    const g = `<g opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="${(0.85 + i * 0.09).toFixed(2)}s" fill="freeze"/>
    <rect x="${x.toFixed(1)}" y="${chipY}" width="${w.toFixed(1)}" height="${chipH}" rx="${chipH / 2}" fill="${C.text}" fill-opacity="${C.chipFill}" stroke="${C.text}" stroke-opacity="${C.chipStroke}"/>
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

// ── The pulsing signal ──────────────────────────────────────────────────────
// The same mark contrib-graph.mjs puts on the last point of its line: a filled
// dot with rings expanding out of it and fading. Reused rather than reinvented
// so the header and the charts below it read as one set of drawings, and used
// instead of Credda's score ring, which is a number that means something there
// and would mean nothing on a personal header.
//
// It anchors the right third of the card, which the text does not reach. That
// only works at a size that reads as deliberate: drawn small it looked like a
// stray dot in a large empty area.
//
// The two still rings are Credda's track-behind-the-arc trick. They carry no
// animation, so the right side is never empty — before the pulses start, and in
// any renderer that shows the first frame and stops.
const SIG_X = W - padR - 92;
const SIG_Y = H / 2;

function signal(C) {
  const still = [30, 46]
    .map(
      (r, i) =>
        `<circle cx="${SIG_X}" cy="${SIG_Y}" r="${r}" fill="none" stroke="${C.text}" stroke-opacity="${(
          C.border * (i === 0 ? 1.5 : 1)
        ).toFixed(3)}" stroke-width="1"/>`
    )
    .join("");
  const pulses = [0, 1.5, 3]
    .map(
      (d) => `<circle cx="${SIG_X}" cy="${SIG_Y}" r="0" fill="none" stroke="${C.a2}" stroke-width="1.8">
    <animate attributeName="r" from="12" to="72" dur="4.5s" begin="${d}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="0.5" to="0" dur="4.5s" begin="${d}s" repeatCount="indefinite"/>
  </circle>`
    )
    .join("");
  return `<g>${still}${pulses}
  <circle cx="${SIG_X}" cy="${SIG_Y}" r="10" fill="${C.bg}" stroke="url(#ramp${C.suffix})" stroke-width="3"/>
  <circle cx="${SIG_X}" cy="${SIG_Y}" r="3.4" fill="url(#ramp${C.suffix})"/></g>`;
}

function render(C) {
  const nameSize = 34;
  const label = `${NAME} — ${ROLES.join(", ")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<defs>
  <clipPath id="card${C.suffix}"><rect x="0" y="0" width="${W}" height="${H}" rx="12"/></clipPath>
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

  <text x="${padL}" y="${nameY}" font-family="${MONO}" font-size="${nameSize}" font-weight="700" fill="url(#ramp${C.suffix})" opacity="0">${esc(NAME)}
    <animate attributeName="opacity" from="0" to="1" dur="0.7s" begin="0.15s" fill="freeze"/>
  </text>
  ${roleLine(C)}
  ${chips(C)}

  <rect x="${padL}" y="${ruleY}" width="${W - padL - padR}" height="1.2" fill="url(#rule${C.suffix})"/>
  ${packets(C)}
  ${signal(C)}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.text}" stroke-opacity="${C.border}"/>
</svg>`;
}

// ── The footer ──────────────────────────────────────────────────────────────
// The README closed with a second capsule-render call, the same waving bar
// flipped upside down. Replacing only the header would have left half the page
// still depending on a service that can disappear, so the footer is generated
// here too rather than left as the one remaining embed.
//
// It is a wave rather than a rule because that is what was there, drawn as two
// offset sine paths so the crests do not sit exactly on top of each other, with
// the same ramp the header uses.
const FW = 820;
const FH = 70;

// Three crests across the width, so one full period is two thirds of it. That
// number matters: the scroll below translates by exactly one period, which is
// the only distance at which the loop is seamless. Half a period would slide
// the wave onto its own inverse and visibly jump every cycle.
const CRESTS = 3;
const PERIOD = (FW / CRESTS) * 2;

// Drawn a period wider on each side than the frame, because a path that starts
// at x=0 leaves a gap at the trailing edge the moment it is translated.
function wave(amp, phase, yBase) {
  const step = PERIOD / 16;
  let d = `M${-PERIOD} ${FH}`;
  for (let x = -PERIOD; x <= FW + PERIOD; x += step) {
    const y = yBase + Math.sin((x / PERIOD) * Math.PI * 2 + phase) * amp;
    d += ` L${x.toFixed(1)} ${y.toFixed(2)}`;
  }
  return `${d} L${(FW + PERIOD).toFixed(1)} ${FH} Z`;
}

function renderFooter(C) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FW} ${FH}" width="${FW}" height="${FH}" role="presentation" aria-hidden="true">
<defs>
  <linearGradient id="fr${C.suffix}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.a1}"/>
    <stop offset="1" stop-color="${C.a2}"/>
  </linearGradient>
</defs>
<path d="${wave(9, 0, 30)}" fill="url(#fr${C.suffix})" opacity="0.28">
  <animateTransform attributeName="transform" type="translate" values="0 0;-${PERIOD.toFixed(1)} 0" dur="14s" repeatCount="indefinite"/>
</path>
<path d="${wave(7, 2.1, 40)}" fill="url(#fr${C.suffix})" opacity="0.85">
  <animateTransform attributeName="transform" type="translate" values="-${PERIOD.toFixed(1)} 0;0 0" dur="18s" repeatCount="indefinite"/>
</path>
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
