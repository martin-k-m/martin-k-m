// Generate dist/stack.svg and dist/stack-light.svg: the README's stack panel.
//
// This replaces the shields.io badge wall, which was the last thing on the page
// rendered by somebody else's server. banner.mjs already made that argument for
// the header and then the page scrolled down to ten `for-the-badge` images from
// img.shields.io: a rate limit or an outage there left the "Tech" section as a
// column of broken images, none of them could be made to match the palette
// every other asset here uses, and each one cost a DNS lookup and a request to
// a third party. The badges were also the only element on the profile that
// looked like every other profile.
//
// MEASURED AND DECLARED ARE DRAWN DIFFERENTLY, which is the whole point of
// building this rather than restyling a badge row. A badge saying "Rust" is a
// claim with nothing behind it. The language chips here carry their real share
// of the bytes, read from the same languages.json the charts above are drawn
// from, so that row is evidence. The tool rows genuinely are declarations, and
// they are marked as such instead of being dressed up to look like the measured
// ones. Two kinds of statement, two treatments, and the legend says which is
// which.
//
// Degrades without the data: if languages.json has not been generated yet the
// language chips render as plain declared chips like every other row, rather
// than the script failing or inventing a number.

import { mkdir, readFile, writeFile } from "node:fs/promises";

// ── The declared stack ──────────────────────────────────────────────────────
// Grouped rather than listed. Fifteen tools in one flat row is a word cloud;
// the grouping is what makes it answerable to "what do you actually build
// with", which is the question a reader has.
const GROUPS = [
  { label: "FRONTEND", items: ["React", "Next.js", "Tailwind", "Vite"] },
  { label: "BACKEND", items: ["Node", "Express", "Prisma", "Kotlin/JVM"] },
  { label: "DATA", items: ["PostgreSQL", "Redis"] },
  { label: "INFRA", items: ["AWS", "Docker", "Terraform", "Actions"] },
];

/** Languages worth a chip, as a share of the latest day's bytes. */
const MIN_SHARE = 1;
const MAX_LANGS = 6;

// The website's warm editorial palette, shared with every other asset in dist/.
// See banner.mjs for the full note; only the surface and text move between
// tempers, the olive accent and hairline grid stay constant.
const THEMES = {
  dark: {
    suffix: "",
    bg: "#15140e",
    surface: "#1d1b13",
    text: "#ece7d6",
    muted: "#b6af98",
    faint: "#8a836c",
    line: "#2b291f",
    line2: "#3a3729",
    a1: "#8f854a",
    a2: "#c9bb70",
    grid: 0.9,
    border: 0.5,
    chipFill: 0.05,
    chipStroke: 0.5,
    barTrack: 0.16,
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
    barTrack: 0.2,
  },
};

const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// 820 to match every other asset in dist/. The README renders them all at
// width="100%", so a panel on a different grid lines up at exactly one viewport
// width and nowhere else.
const W = 820;
const padL = 28;
const padR = 28;
const LABEL_W = 92;
const CHIP_X = padL + LABEL_W + 14;
const CHIP_H = 26;
const CHIP_GAP = 8;
const LINE_H = 34;
const ROW_GAP = 12;
const HEAD_Y = 42;
const BODY_Y = 74;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Same fixed-advance arithmetic banner.mjs uses, and for the same reason: the
// fallback faces do not agree on the advance, so every width the layout has to
// line up against is emitted with textLength and honoured exactly rather than
// being correct only where the advance happens to be 0.6.
const advance = (size) => size * 0.6;
const textW = (s, size) => s.length * advance(size);

// Entrances whose BASE VALUE IS THE FINISHED STATE, with the delay moved inside
// the animation. opacity="0" plus a delayed begin blanks the element anywhere
// SMIL does not run, and a panel that renders empty in a sandbox that strips
// animation is worse than one that never animated at all.
// No-op: entrances must never be what makes an element appear. Every element
// here carries its finished value as a plain static attribute, so it is fully
// visible with SMIL stripped or its first frame frozen. See banner.mjs.
function fadeIn(_delay, _dur) {
  return "";
}

const CELL = 40;
function grid(C, H) {
  const lines = [];
  for (let x = -CELL; x <= W + CELL; x += CELL) lines.push(`<path d="M${x} ${-CELL} V${H + CELL}"/>`);
  for (let y = -CELL; y <= H + CELL; y += CELL) lines.push(`<path d="M${-CELL} ${y} H${W + CELL}"/>`);
  return `<g mask="url(#fade${C.suffix})"><g class="grid" stroke="${C.line}" stroke-opacity="${C.grid}" stroke-width="1">${lines.join("")}</g></g>`;
}

// The edge-fade mask the grid rides on, so the paper thins out at the frame.
function fadeDefs(C, H) {
  return `<radialGradient id="fadeg${C.suffix}" cx="50%" cy="50%" r="72%">
    <stop offset="0" stop-color="#fff" stop-opacity="1"/>
    <stop offset="0.62" stop-color="#fff" stop-opacity="1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="fade${C.suffix}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="url(#fadeg${C.suffix})"/>
  </mask>`;
}

// ── Reading the measured languages ──────────────────────────────────────────
// languages.json is written by lang-graph.mjs into the same dist/ this writes
// to, keyed by day exactly like lang-daily.json. The latest day is the one the
// chips describe, which is the same day the ranked chart above the panel shows,
// so the two can never disagree about what the top language is.
async function measuredLanguages() {
  let file;
  try {
    file = JSON.parse(await readFile("dist/languages.json", "utf8"));
  } catch {
    return null;
  }

  const days = file?.days ?? {};
  const dates = Object.keys(days).sort();
  if (dates.length === 0) return null;

  const last = days[dates[dates.length - 1]];
  const total = Object.values(last).reduce((a, b) => a + b, 0);
  if (!total) return null;

  return Object.entries(last)
    .map(([name, bytes]) => ({ name, share: (bytes / total) * 100 }))
    .filter((l) => l.share >= MIN_SHARE)
    .sort((a, b) => b.share - a.share)
    .slice(0, MAX_LANGS);
}

// ── Chips ───────────────────────────────────────────────────────────────────
// Measured chips are wider than their text because they carry a share bar under
// the label, and the bar is drawn to the chip's own inner width so it reads as
// a property of that chip rather than as a separate row of bars that happen to
// sit beneath one.
function layoutRow(items, sizeText) {
  const padX = 12;
  const lines = [[]];
  let x = CHIP_X;

  for (const item of items) {
    const w = textW(item.text, sizeText) + padX * 2;
    if (x + w > W - padR && lines[lines.length - 1].length > 0) {
      lines.push([]);
      x = CHIP_X;
    }
    lines[lines.length - 1].push({ ...item, x, w, padX });
    x += w + CHIP_GAP;
  }

  return lines;
}

function chip(C, c, y, delay, sizeText) {
  const tw = textW(c.text, sizeText);
  const label = `<text x="${(c.x + c.padX).toFixed(1)}" y="${(y + (c.measured ? 15 : 17)).toFixed(1)}" font-family="${MONO}" font-size="${sizeText}" fill="${c.measured ? C.text : C.muted}" textLength="${tw.toFixed(1)}" lengthAdjust="spacing">${esc(c.text)}</text>`;

  // The bar is the evidence. Full width of the chip's text column at 100%, so
  // a glance across the row compares shares without reading a single number.
  // Drawn statically at its finished width — no sweep — so the measured share is
  // fully visible whether or not any animation runs.
  const fillW = ((tw * Math.min(c.share, 100)) / 100).toFixed(1);
  const bar = c.measured
    ? `<rect x="${(c.x + c.padX).toFixed(1)}" y="${(y + 19).toFixed(1)}" width="${tw.toFixed(1)}" height="2" rx="1" fill="${C.text}" fill-opacity="${C.barTrack}"/>
     <rect x="${(c.x + c.padX).toFixed(1)}" y="${(y + 19).toFixed(1)}" width="${fillW}" height="2" rx="1" fill="url(#ramp${C.suffix})"/>`
    : "";

  return `<g opacity="1">${fadeIn(delay, 0.5)}
    <rect x="${c.x.toFixed(1)}" y="${y}" width="${c.w.toFixed(1)}" height="${CHIP_H}" rx="${(CHIP_H / 2).toFixed(1)}" fill="${C.text}" fill-opacity="${C.chipFill}" stroke="${c.measured ? `url(#ramp${C.suffix})` : C.line2}" stroke-opacity="${c.measured ? 0.8 : C.chipStroke}"/>
    ${label}${bar}
  </g>`;
}

function render(C, langs) {
  const sizeText = 11;
  const sizeLabel = 10;

  const rows = [];
  if (langs) {
    rows.push({
      label: "LANGUAGES",
      items: langs.map((l) => ({
        text: `${l.name} ${l.share.toFixed(1)}%`,
        measured: true,
        share: l.share,
      })),
    });
  }
  for (const g of GROUPS) {
    rows.push({ label: g.label, items: g.items.map((t) => ({ text: t, measured: false })) });
  }

  // Height falls out of the content. A fixed height either clips a row that
  // wrapped or leaves a band of empty card under one that did not.
  let y = BODY_Y;
  let delay = 0.2;
  const drawn = [];
  for (const row of rows) {
    const lines = layoutRow(row.items, sizeText);
    drawn.push(
      `<text x="${padL}" y="${(y + 17).toFixed(1)}" font-family="${MONO}" font-size="${sizeLabel}" font-weight="600" fill="${C.muted}" opacity="1" letter-spacing="1.4">${esc(row.label)}${fadeIn(delay, 0.5)}</text>`
    );
    for (const line of lines) {
      for (const c of line) {
        drawn.push(chip(C, c, y, delay, sizeText));
        delay += 0.045;
      }
      y += LINE_H;
    }
    y += ROW_GAP;
  }

  const H = y - ROW_GAP + 26;
  const measuredNote = langs
    ? "solid rule = measured share of bytes · everything else is declared"
    : "declared stack";
  const title = `Stack: ${rows.map((r) => `${r.label.toLowerCase()} ${r.items.map((i) => i.text).join(", ")}`).join("; ")}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>
  <clipPath id="scard${C.suffix}"><rect x="0" y="0" width="${W}" height="${H}" rx="12"/></clipPath>
  ${fadeDefs(C, H)}
  <linearGradient id="ramp${C.suffix}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.a1}"/>
    <stop offset="1" stop-color="${C.a2}"/>
  </linearGradient>
  <radialGradient id="sglow${C.suffix}" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${C.a2}" stop-opacity="0.18"/>
    <stop offset="0.65" stop-color="${C.a2}" stop-opacity="0.04"/>
    <stop offset="1" stop-color="${C.a2}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="srule${C.suffix}" x1="0" y1="0" x2="1" y2="0">
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
<g clip-path="url(#scard${C.suffix})">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${grid(C, H)}
  <ellipse class="breathe" cx="${W - 160}" cy="${H}" rx="320" ry="150" fill="url(#sglow${C.suffix})"/>

  <text x="${padL}" y="${HEAD_Y}" font-family="${MONO}" font-size="15" font-weight="700" fill="url(#ramp${C.suffix})" opacity="1">STACK${fadeIn(0.1, 0.6)}</text>
  <text x="${W - padR}" y="${HEAD_Y}" text-anchor="end" font-family="${MONO}" font-size="10" fill="${C.muted}" opacity="1">${esc(measuredNote)}${fadeIn(0.3, 0.6)}</text>
  <rect x="${padL}" y="${HEAD_Y + 12}" width="${W - padL - padR}" height="1.2" fill="url(#srule${C.suffix})"/>

  ${drawn.join("\n  ")}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.line2}" stroke-opacity="${C.border}"/>
</svg>`;
}

const langs = await measuredLanguages();
await mkdir("dist", { recursive: true });
for (const theme of Object.values(THEMES)) {
  await writeFile(`dist/stack${theme.suffix}.svg`, render(theme, langs), "utf8");
}
console.log(
  `stack + stack-light · ${W}px wide · ` +
    `${langs ? `${langs.length} measured languages` : "no languages.json, declared only"} · ` +
    `${GROUPS.reduce((n, g) => n + g.items.length, 0)} declared tools`
);
