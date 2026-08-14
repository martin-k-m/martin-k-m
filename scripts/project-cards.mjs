// Generate dist/credda.svg, dist/twill.svg and their light twins: the two
// project cards in the README.
//
// The Credda section was a five-row HTML table (five separate <tbody> elements,
// which is not what a tbody is for) and the twill section was a blockquote and
// one line of prose. Both said true things and neither looked like the charts
// above them, so the page went from a designed header and four generated
// drawings straight into default GitHub table chrome.
//
// A table is also the wrong instrument here. Its two columns imply a key and a
// value, and what these rows actually are is a claim and its supporting
// sentence, which is a different shape. Drawing them puts the emphasis where it
// belongs and lets each project carry a motif that means something about the
// project rather than a border that means nothing.
//
// THE MOTIFS ARE NOT DECORATION. banner.mjs deliberately refused Credda's score
// ring on the personal header, on the grounds that it is a number that means
// something there and would mean nothing on a profile banner. On Credda's own
// card it means what it means on Credda: the ring is the product. twill gets
// the shape check, which is the one thing its whole design argument rests on.
//
// Same generator for both, because two cards maintained separately drift, and
// this file already exists to stop the dark and light copies drifting.

import { mkdir, writeFile } from "node:fs/promises";

// The website's warm editorial palette, shared with every other asset. See
// banner.mjs for the full note.
const THEMES = {
  dark: {
    suffix: "",
    bg: "#15140e",
    surface: "#1d1b13",
    text: "#ece7d6",
    muted: "#b6af98",
    faint: "#8a836c",
    body: "#b6af98",
    line: "#2b291f",
    line2: "#3a3729",
    a1: "#8f854a",
    a2: "#c9bb70",
    grid: 0.9,
    border: 0.5,
    track: 0.6,
  },
  light: {
    suffix: "-light",
    bg: "#ece7d6",
    surface: "#f4f0e3",
    text: "#2b2820",
    muted: "#55503f",
    faint: "#746e59",
    body: "#55503f",
    line: "#dbd4bf",
    line2: "#cec6ac",
    a1: "#a99e5e",
    a2: "#6d6329",
    grid: 0.9,
    border: 0.7,
    track: 0.7,
  },
};

const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const W = 820;
const padL = 28;
const padR = 28;
// The motif owns the right end of the card. The text column stops short of it
// rather than wrapping around it: a measured column that sometimes runs the
// full width and sometimes does not is how a layout starts looking accidental.
const MOTIF_W = 188;
const TEXT_R = W - padR - MOTIF_W;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const advance = (size) => size * 0.6;
const textW = (s, size) => s.length * advance(size);

/**
 * Greedy wrap against the same fixed advance every other asset measures with.
 *
 * Wrapping by character count rather than by measuring glyphs is exact here
 * only because the text is emitted with `textLength`, which forces the string
 * to the width the arithmetic claimed whatever face the renderer found. The two
 * decisions hold each other up: drop `textLength` and these line breaks become
 * approximate on any fallback whose advance is not 0.6.
 */
function wrap(text, size, maxW) {
  const perLine = Math.max(8, Math.floor(maxW / advance(size)));
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// No-op: entrances must never be what makes an element appear. All card text
// carries its finished value as a plain static attribute, so it is fully
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

// The edge-fade mask for the grid paper, thinning it out at the frame.
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

// ── Motifs ──────────────────────────────────────────────────────────────────

/** Credda: the score ring, swept to a real band rather than a round number. */
function scoreMotif(C, cx, cy) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  // 0.78 of the circle, gap at the bottom, so it reads as a gauge with a start
  // and an end rather than a pie chart of something. Same sweep the website's
  // card uses, so the two drawings of the same object agree.
  const sweep = 0.78;
  const score = 73.92;
  const dash = circ * sweep * (score / 100);

  // Where the swept arc ends: the dash starts at 3 o'clock and runs clockwise,
  // so the tip sits at (dash / circ) of a turn from there, in the same rotated
  // frame as the arc. A small marker rides it, so the gauge names its current
  // value with a point on the ring rather than only a length of colour.
  const tipA = (dash / circ) * 2 * Math.PI;
  const tipX = (r * Math.cos(tipA)).toFixed(2);
  const tipY = (r * Math.sin(tipA)).toFixed(2);

  return `<g transform="translate(${cx} ${cy})">
    <g transform="rotate(129)">
      <circle r="${r}" fill="none" stroke="${C.line2}" stroke-opacity="${C.track}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(circ * sweep).toFixed(1)} ${circ.toFixed(1)}"/>
      <circle r="${r}" fill="none" stroke="url(#ramp${C.suffix})" stroke-width="9" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}"/>
      <circle cx="${tipX}" cy="${tipY}" r="4.5" fill="${C.bg}" stroke="url(#ramp${C.suffix})" stroke-width="2.5" opacity="1"/>
    </g>
    <text y="-6" text-anchor="middle" font-family="${MONO}" font-size="9" fill="${C.muted}" letter-spacing="1.6">SCORE</text>
    <text y="16" text-anchor="middle" font-family="${MONO}" font-size="20" font-weight="700" fill="${C.text}">0-100</text>
  </g>`;
}

/**
 * twill: two shapes meeting at a contraction, with the inner dimensions marked.
 *
 * This is the language's entire argument in one drawing. The inner pair agree
 * and the checker passes; the point is that it is checked before anything runs,
 * so the mark is a static check rather than an animated success.
 */
function shapeMotif(C, cx, cy) {
  const box = (x, y, w, h, label) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${C.text}" fill-opacity="0.04" stroke="${C.line2}" stroke-opacity="${C.track}"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${C.muted}">${esc(label)}</text>`;

  return `<g transform="translate(${cx} ${cy})">
    ${box(-84, -26, 62, 52, "3x4")}
    <text x="-12" y="4" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${C.muted}">@</text>
    ${box(0, -26, 62, 52, "4x2")}
    <text x="-11" y="-38" text-anchor="middle" font-family="${MONO}" font-size="9" fill="url(#ramp${C.suffix})" letter-spacing="1.2">INNER 4 = 4</text>
    <path d="M-22 -32 V-22 M22 -32 V-22 M-22 -32 H22" fill="none" stroke="url(#ramp${C.suffix})" stroke-width="1.2" stroke-opacity="0.8"/>
    <text x="-11" y="48" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${C.text}">3x2 · checked</text>
  </g>`;
}

/**
 * Arc: the observed dependency set, and the change that falls outside it.
 *
 * Arc's whole argument is that a cache hit should be authorized by what a run
 * genuinely read, not by what happens to sit in the directory. So the drawing
 * is the narrowing itself: five paths in the project, three the trace actually
 * observed, and an edit to one of the other two that is still a hit. Drawn as a
 * verdict rather than a mechanism, for the same reason twill's motif shows the
 * check passing rather than the checker running.
 */
function narrowMotif(C, cx, cy) {
  const rows = [
    ["build.sh", true],
    ["input.txt", true],
    ["plugins/", true],
    ["docs/design.md", false],
    ["notes.txt", false],
  ];
  const rowH = 19;
  const size = 9;
  const top = -(rows.length * rowH) / 2 - 16;

  const observed = rows.filter(([, o]) => o).length;
  const firstY = top;
  const lastY = top + (observed - 1) * rowH;

  const out = rows.map(([label, isInput], i) => {
    const y = top + i * rowH;
    const mark = isInput
      ? `<rect x="-70" y="${y - 6}" width="6" height="6" rx="1.5" fill="url(#ramp${C.suffix})"/>`
      : `<rect x="-70" y="${y - 6}" width="6" height="6" rx="1.5" fill="none" stroke="${C.line2}" stroke-opacity="${C.track}"/>`;
    const fill = isInput ? C.text : C.faint;
    return `${mark}
    <text x="-56" y="${y}" font-family="${MONO}" font-size="${size}" fill="${fill}" textLength="${textW(label, size).toFixed(1)}" lengthAdjust="spacing">${esc(label)}</text>`;
  });

  // The brace marks off the rows that authorize a hit, so the two unmarked
  // rows read as excluded on purpose rather than as rows that ran out of room.
  const brace = `<path d="M-78 ${firstY - 6} H-84 V${lastY + 4} H-78" fill="none" stroke="url(#ramp${C.suffix})" stroke-width="1.2" stroke-opacity="0.8"/>`;

  const capY = top + rows.length * rowH + 6;

  return `<g transform="translate(${cx} ${cy})">
    ${brace}
    ${out.join("\n    ")}
    <text x="-11" y="${capY}" text-anchor="middle" font-family="${MONO}" font-size="9" fill="url(#ramp${C.suffix})" letter-spacing="1.2">3 OF 5 OBSERVED</text>
    <text x="-11" y="${capY + 18}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${C.text}">notes.txt edited · HIT</text>
  </g>`;
}

const MOTIFS = { score: scoreMotif, shape: shapeMotif, narrow: narrowMotif };

// ── The cards ───────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    file: "credda",
    eyebrow: "CO-FOUNDER",
    title: "Credda",
    tagline:
      "Portable trust infrastructure. Reputation should not reset every time you join a new platform.",
    features: [
      [
        "Deterministic",
        "The score is a pure function of an append-only event ledger. Nothing is edited or removed, so the same events always produce the same score, and there is no lever for a human or a model to pull.",
      ],
      [
        "Yours to carry",
        "A score travels as a signed W3C Verifiable Credential with a did:web issuer, which a lender or a client can check without asking Credda for permission.",
      ],
      [
        "Commitments, not reviews",
        "The primitive is an agreement two parties confirmed, so the record is about what was delivered rather than how somebody felt about it.",
      ],
      [
        "Built for organizations",
        "Members, roles and invitations, so a reputation can belong to a company as well as to a person.",
      ],
    ],
    footer: "React 19 · Vite 7 · Tailwind v4 · Express 5 · TypeScript · Prisma / PostgreSQL · Redis · AWS",
    motif: "score",
  },
  {
    file: "twill",
    eyebrow: "SIDE PROJECT",
    title: "twill",
    tagline: "A language built around differentiable tensor programs.",
    features: [
      [
        "Shape errors at check time",
        "A mismatched matmul is a compile error with the offending dimensions named, not a stack trace from an hour into training.",
      ],
      [
        "Differentiation as syntax",
        "grad is an operator over a function, so a gradient is a language construct rather than a tape you have to remember to install.",
      ],
      [
        "Deterministic and self-contained",
        "One dependency-free binary, and parallelism never changes a result. The compiler is being rewritten in twill itself.",
      ],
    ],
    footer: "source files end in .tw",
    motif: "shape",
  },
  {
    file: "arc",
    eyebrow: "SIDE PROJECT",
    title: "Arc",
    tagline: "An execution cache. Never repeat work Arc can prove is already done.",
    features: [
      [
        "Dependencies observed, not declared",
        "On Linux Arc traces every syscall of the process tree and records what a run genuinely depended on: files read, directories enumerated, paths looked for and not found, binaries executed. Only those invalidate the cache.",
      ],
      [
        "A task graph nobody wrote",
        "One command's output being another's input is the edge, so arc affected runs exactly the work a change reaches, producers before consumers, independent branches at once.",
      ],
      [
        "Unsure means run",
        "A partial trace never narrows, a shared cache is untrusted and re-hashed on the way in, and anything Arc cannot prove is a hit is executed. Being unsure is the ordinary case, and the answer to it is to run the command.",
      ],
    ],
    footer:
      "Rust · four crates · v1.0 · shared cache, remote execution, content-addressed toolchains",
    motif: "narrow",
  },
];

function render(C, p) {
  const titleSize = 26;
  const taglineSize = 12;
  const labelSize = 12;
  const bodySize = 11;

  const textWidth = TEXT_R - padL;
  const out = [];

  let y = 44;
  out.push(
    `<text x="${padL}" y="${y}" font-family="${MONO}" font-size="10" font-weight="600" fill="${C.muted}" letter-spacing="1.6" opacity="1">${esc(p.eyebrow)}${fadeIn(0.1, 0.5)}</text>`
  );

  y += 34;
  out.push(
    `<text x="${padL}" y="${y}" font-family="${SANS}" font-size="${titleSize}" font-weight="700" fill="url(#ramp${C.suffix})" opacity="1">${esc(p.title)}${fadeIn(0.18, 0.6)}</text>`
  );

  y += 24;
  for (const line of wrap(p.tagline, taglineSize, textWidth)) {
    out.push(
      `<text x="${padL}" y="${y}" font-family="${MONO}" font-size="${taglineSize}" fill="${C.text}" textLength="${textW(line, taglineSize).toFixed(1)}" lengthAdjust="spacing" opacity="1">${esc(line)}${fadeIn(0.26, 0.5)}</text>`
    );
    y += 18;
  }

  y += 14;
  let delay = 0.34;
  for (const [label, bodyText] of p.features) {
    // The bullet is a square rather than a dot, set on the cap height of the
    // label, so a row reads as an entry in a list of claims and not as prose
    // that happens to start with a mark.
    out.push(
      `<g opacity="1">${fadeIn(delay, 0.5)}
    <rect x="${padL}" y="${y - 8}" width="6" height="6" rx="1.5" fill="url(#ramp${C.suffix})"/>
    <text x="${padL + 16}" y="${y}" font-family="${MONO}" font-size="${labelSize}" font-weight="700" fill="${C.text}" textLength="${textW(label, labelSize).toFixed(1)}" lengthAdjust="spacing">${esc(label)}</text>
  </g>`
    );
    y += 18;

    for (const line of wrap(bodyText, bodySize, textWidth - 16)) {
      out.push(
        `<text x="${padL + 16}" y="${y}" font-family="${MONO}" font-size="${bodySize}" fill="${C.body}" textLength="${textW(line, bodySize).toFixed(1)}" lengthAdjust="spacing" opacity="1">${esc(line)}${fadeIn(delay + 0.06, 0.5)}</text>`
      );
      y += 15;
    }

    y += 14;
    delay += 0.08;
  }

  // The footer rule spans the full card, under the motif as well as the text,
  // because it closes the card rather than the column.
  const ruleY = y + 2;
  out.push(
    `<rect x="${padL}" y="${ruleY}" width="${W - padL - padR}" height="1.2" fill="url(#crule${C.suffix})"/>`
  );
  out.push(
    `<text x="${padL}" y="${ruleY + 22}" font-family="${MONO}" font-size="10" fill="${C.muted}" opacity="1">${esc(p.footer)}${fadeIn(delay + 0.1, 0.5)}</text>`
  );

  const H = ruleY + 42;
  const motif = MOTIFS[p.motif](C, W - padR - MOTIF_W / 2, Math.max(96, (ruleY - 20) / 2 + 20));
  const label = `${p.title}: ${p.tagline} ${p.features.map(([l]) => l).join(". ")}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<defs>
  <clipPath id="pcard${p.file}${C.suffix}"><rect x="0" y="0" width="${W}" height="${H}" rx="12"/></clipPath>
  ${fadeDefs(C, H)}
  <linearGradient id="ramp${C.suffix}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.a1}"/>
    <stop offset="1" stop-color="${C.a2}"/>
  </linearGradient>
  <radialGradient id="pglow${C.suffix}" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${C.a1}" stop-opacity="0.18"/>
    <stop offset="0.65" stop-color="${C.a1}" stop-opacity="0.04"/>
    <stop offset="1" stop-color="${C.a1}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="crule${C.suffix}" x1="0" y1="0" x2="1" y2="0">
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
<g clip-path="url(#pcard${p.file}${C.suffix})">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${grid(C, H)}
  <ellipse class="breathe" cx="${W - padR - MOTIF_W / 2}" cy="${H / 2}" rx="230" ry="${(H / 2 + 40).toFixed(0)}" fill="url(#pglow${C.suffix})"/>
  ${motif}
  ${out.join("\n  ")}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.line2}" stroke-opacity="${C.border}"/>
</svg>`;
}

await mkdir("dist", { recursive: true });
for (const p of PROJECTS) {
  for (const theme of Object.values(THEMES)) {
    await writeFile(`dist/${p.file}${theme.suffix}.svg`, render(theme, p), "utf8");
  }
}
console.log(
  `project cards · ${PROJECTS.map((p) => `${p.file} (${p.features.length} claims)`).join(", ")} · light and dark, no network`
);
