// Generate dist/languages.svg: the languages I actually write, ranked by how
// much of them exists, measured in bytes of code that GitHub's own Linguist
// attributes to each language across my repositories.
//
// Bytes, not repository counts: ten one-file experiments in a language should
// not outrank the one where the real work lives.
//
// Counts every repository the token can see: public and private, owned and
// contributed to, not just the public ones. How much of that it can actually
// see is a property of the token: the Actions GITHUB_TOKEN sees only public
// repos, while a PAT with `repo` scope sees private ones too. The footer states
// what was really counted rather than claiming a scope it did not have.
//
// Env:
//   GH_LOGIN      (required) user to measure
//   GITHUB_TOKEN  (required) PAT with `repo` scope to include private repos
//   HISTORY_URL   (optional) where to read the previous day's totals from.
//                 Defaults to the published copy on the assets branch; point it
//                 at a local file server to exercise the arrows without waiting
//                 a day for real history to accumulate.

import { mkdir, writeFile } from "node:fs/promises";
import { fetchRepos } from "./repos.mjs";

const login = process.env.GH_LOGIN;
const token = process.env.GITHUB_TOKEN;
if (!login || !token) {
  console.error("GH_LOGIN and GITHUB_TOKEN are required");
  process.exit(1);
}

const { repos, colors, privateCount, contributedCount } = await fetchRepos(login, token);
const repoCount = repos.length;

const bytes = new Map(); // language -> bytes
for (const repo of repos) {
  for (const { size, node } of repo.languages.edges) {
    bytes.set(node.name, (bytes.get(node.name) || 0) + size);
  }
}

// ── Day-over-day movement ───────────────────────────────────────────────────
// The API answers "how much is there now" and nothing else, so the only way to
// say whether a language grew since yesterday is to have written down what it
// was. dist/languages.json rides along to the assets branch with the SVGs, and
// each run reads the published copy back as the previous state.
//
// Keyed by UTC date rather than by run, because the job fires hourly and the
// arrow is a day-over-day claim: comparing 14:00 against 13:00 would leave
// every row flat almost every time and call that "constant", which is a
// different and much less interesting statement than the one being made.
const HISTORY_DAYS = 14;
const today = new Date().toISOString().slice(0, 10);
const repo = process.env.GITHUB_REPOSITORY || `${login}/${login}`;

let history = {};
try {
  const res = await fetch(
    process.env.HISTORY_URL || `https://raw.githubusercontent.com/${repo}/assets/languages.json`,
    { headers: { "Cache-Control": "no-cache" } }
  );
  if (res.ok) {
    const prior = await res.json();
    if (prior && typeof prior.days === "object") history = prior.days;
  } else if (res.status !== 404) {
    console.warn(`  previous totals: HTTP ${res.status}, treating as absent`);
  }
} catch (err) {
  // A chart with no arrows is fine; a failed build over a missing history file
  // is not. This is the first run's normal path too.
  console.warn(`  previous totals unavailable (${err.message}), rendering without arrows`);
}

// The most recent record from a day that is not today. Yesterday usually, but
// the job can be down for a weekend and comparing against the last day there
// is data for beats showing nothing.
const priorDates = Object.keys(history).filter((d) => d < today).sort();
const priorDate = priorDates[priorDates.length - 1];
const previous = priorDate ? history[priorDate] : null;

/** Bytes moved since `priorDate`, or null when there is nothing to compare to. */
function delta(name) {
  if (!previous) return null;
  return (bytes.get(name) || 0) - (previous[name] || 0);
}

const ranked = [...bytes.entries()].sort((a, b) => b[1] - a[1]);
if (ranked.length === 0) {
  console.error("no language data");
  process.exit(1);
}

// The Actions GITHUB_TOKEN is scoped to the repository it runs in, so
// `user(login:).repositories` returns that one repo and nothing else. Rendering
// that would publish a confident-looking chart reading "1 language · 1 repo".
// Refuse instead: a missing chart is honest, a wrong one is not.
if (repoCount < 2) {
  console.error(
    `only ${repoCount} repository visible to this token, refusing to publish a misleading chart.\n` +
      "Set GITHUB_TOKEN to a personal access token with `repo` scope (in Actions, add it\n" +
      "as the PROFILE_TOKEN secret). The Actions GITHUB_TOKEN cannot enumerate a user's\n" +
      "repositories, only the one it is running in."
  );
  process.exit(1);
}

const total = ranked.reduce((sum, [, n]) => sum + n, 0);

// Name every language that is actually part of the picture rather than hiding
// most of them behind one "Other" row. A language is worth its own row at a
// tenth of a percent; below that the row would read 0.0% and say nothing, and
// the cap keeps one stray file per language from turning this into a list.
// Anything folded is still counted in the total.
const MIN_SHARE = 0.001;
const MAX_ROWS = 16;
const shown = ranked.filter(([, n]) => n / total >= MIN_SHARE).slice(0, MAX_ROWS);
const tail = ranked.slice(shown.length); // ranked is sorted, so what is shown is a prefix
const rows = shown.map(([name, n]) => ({
  name,
  n,
  color: colors.get(name) || "#7C6CFF",
  d: delta(name),
}));
if (tail.length) {
  rows.push({
    name: `Other · ${tail.length}`,
    n: tail.reduce((sum, [, n]) => sum + n, 0),
    // The folded row moves if anything inside it moved, so its arrow is the sum
    // of the parts rather than any one language's direction.
    d: previous ? tail.reduce((sum, [name]) => sum + delta(name), 0) : null,
    // Colour is chosen per theme: a near-black "other" band vanishes on a white
    // background, and a pale one vanishes on a dark background.
    other: true,
  });
}

const stamp = new Date().toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function size(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}
const pct = (n) => (n / total) * 100;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Two palettes, so the README can serve whichever matches the reader's theme.
// The per-language bar colours are GitHub's own and stay identical in both:
// they are the thing being identified, so recolouring them would break the
// association. Only the surface, text and "other" band change.
const THEMES = {
  dark: {
    suffix: "",
    bg: "#0A0A0C",
    text: "#ECEDF1",
    muted: "#6D6E79",
    accent: "#7C6CFF",
    other: "#3A3B44",
    trackOpacity: 0.05,
    borderOpacity: 0.06,
    up: "#3FB950",
    down: "#F85149",
    flat: "#4F8CFF",
  },
  light: {
    suffix: "-light",
    bg: "#FFFFFF",
    text: "#1F2328",
    muted: "#59636E",
    accent: "#7C6CFF",
    other: "#AFB8C1",
    trackOpacity: 0.09,
    borderOpacity: 0.14,
    // Darker on white. The dark theme's greens and reds wash out badly enough
    // on a light background to stop reading as up and down.
    up: "#1A7F37",
    down: "#CF222E",
    flat: "#0969DA",
  },
};

const MONO = "'JetBrains Mono',ui-monospace,monospace";

// ── Layout ──────────────────────────────────────────────────────────────────
const W = 820;
const padL = 16, padR = 16;
const padT = 46;   // title row
const specY = 60;  // stacked proportion bar
const specH = 10;
const rowsY = specY + specH + 22;
const rowH = 26;
const padB = 30;
const H = rowsY + rows.length * rowH + padB;

const nameW = 132;               // language name column
const valW = 116;                // size + percentage column
const markW = 20;                // day-over-day arrow, between the bar and the value
const barX = padL + nameW + 12;
const barW = W - padR - valW - markW - barX;
const markX = W - padR - valW - markW / 2; // centre of the marker column

// Bars are share of total: a language at 50% fills half the track, so the bar
// length and the printed percentage always agree.
const scale = total;

const barColor = (row, C) => (row.other ? C.other : row.color);

// Which way a language moved since the last recorded day: a green triangle up,
// a red triangle down, a blue bar for no change at all. Shape carries the
// meaning as well as colour, so the three stay distinguishable to a reader who
// cannot separate the red from the green.
//
// Nothing is drawn when there is no previous day to compare against, which is
// the first run and any run after the history file goes missing. A grey dash
// would be a fourth state to explain, and an arrow would be a claim about a
// change nobody measured.
function markerFor(row, C) {
  if (row.d === null || row.d === undefined) return "";
  const cy = 7.5; // centre of the 11px-tall bar, relative to the row group
  if (row.d === 0) {
    return `<g><title>no change since ${priorDate}</title>
      <rect x="${(markX - 5).toFixed(1)}" y="${(cy - 1.25).toFixed(1)}" width="10" height="2.5" rx="1.25" fill="${C.flat}"/>
    </g>`;
  }
  const up = row.d > 0;
  const c = up ? C.up : C.down;
  const tri = up
    ? `${markX},${cy - 4.5} ${markX - 5},${cy + 3.5} ${markX + 5},${cy + 3.5}`
    : `${markX},${cy + 4.5} ${markX - 5},${cy - 3.5} ${markX + 5},${cy - 3.5}`;
  const moved = `${up ? "+" : "-"}${size(Math.abs(row.d))}`;
  return `<g><title>${moved} since ${priorDate}</title>
      <polygon points="${tri}" fill="${c}"/>
    </g>`;
}

function spectrumFor(C) {
  let x = padL;
  return rows
    .map((r, i) => {
      const w = (r.n / total) * (W - padL - padR);
      const seg = `<rect x="${x.toFixed(1)}" y="${specY}" width="${Math.max(0, w - (i < rows.length - 1 ? 1.5 : 0)).toFixed(1)}" height="${specH}" rx="3" fill="${barColor(r, C)}" opacity="0">
      <animate attributeName="opacity" from="0" to="0.95" dur="0.5s" begin="${(0.25 + i * 0.05).toFixed(2)}s" fill="freeze"/>
    </rect>`;
      x += w;
      return seg;
    })
    .join("\n  ");
}

function barsFor(C) {
  return rows
    .map((r, i) => {
      const y = rowsY + i * rowH;
      const w = Math.max(2, (r.n / scale) * barW);
      const begin = (0.3 + i * 0.07).toFixed(2);
      return `<g>
    <text x="${padL}" y="${y + 11}" font-family="${MONO}" font-size="12" fill="${C.text}">${esc(r.name)}</text>
    <rect x="${barX}" y="${y + 2}" width="${barW}" height="11" rx="5.5" fill="${C.text}" fill-opacity="${C.trackOpacity}"/>
    <rect x="${barX}" y="${y + 2}" width="0" height="11" rx="5.5" fill="${barColor(r, C)}">
      <animate attributeName="width" from="0" to="${w.toFixed(1)}" dur="0.9s" begin="${begin}s" fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1"/>
    </rect>
    <g transform="translate(0 ${y + 2})" opacity="0">
      <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="${(Number(begin) + 0.9).toFixed(2)}s" fill="freeze"/>
      ${markerFor(r, C)}
    </g>
    <text x="${W - padR}" y="${y + 11}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${C.muted}">${size(r.n)} · ${pct(r.n).toFixed(1)}%</text>
  </g>`;
    })
    .join("\n  ");
}

// State exactly what was counted. If the token could not see private repos this
// silently says so by reporting none, rather than implying full coverage.
const scopeParts = [`${ranked.length} languages`, `${repoCount} repos`];
if (privateCount) scopeParts.push(`${privateCount} private`);
if (contributedCount) scopeParts.push(`${contributedCount} contributed`);
// Name the day the arrows are measured against. "since yesterday" would be a
// guess on any run that follows a gap in the schedule.
if (priorDate) scopeParts.push(`▲▼ vs ${priorDate}`);
const scope = scopeParts.join(" · ");

function render(C) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Languages by bytes of code across ${repoCount} repositories">
  <rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.text}" stroke-opacity="${C.borderOpacity}"/>
  <text x="${padL}" y="27" font-family="${MONO}" font-size="15" font-weight="600" fill="${C.text}">Languages · by bytes of code</text>
  <text x="${W - padR}" y="27" text-anchor="end" font-family="${MONO}" font-size="15" font-weight="600" fill="${C.accent}">${size(total)}</text>
  ${spectrumFor(C)}
  ${barsFor(C)}
  <text x="${padL}" y="${H - 10}" font-family="${MONO}" font-size="11" fill="${C.muted}">${scope}</text>
  <text x="${W - padR}" y="${H - 10}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${C.muted}">updated ${stamp}</text>
</svg>`;
}

await mkdir("dist", { recursive: true });
for (const theme of Object.values(THEMES)) {
  await writeFile(`dist/languages${theme.suffix}.svg`, render(theme));
}

// Today's totals overwrite today's slot, so the hourly runs keep refining the
// same day rather than filling the file with 24 near-identical records. The
// window is trimmed here so the file cannot grow without bound.
history[today] = Object.fromEntries(ranked);
const kept = Object.keys(history)
  .sort()
  .slice(-HISTORY_DAYS);
await writeFile(
  "dist/languages.json",
  JSON.stringify(
    { updated: new Date().toISOString(), days: Object.fromEntries(kept.map((d) => [d, history[d]])) },
    null,
    2
  )
);

console.log(`languages.svg · ${scope} · ${shown.length} rows`);
console.log(
  priorDate
    ? `  comparing against ${priorDate}; ${kept.length} day(s) of history retained`
    : `  no previous day recorded yet, arrows begin on the next run`
);
for (const [name, n] of ranked) {
  const folded = !shown.some(([s]) => s === name);
  console.log(`  ${folded ? "·" : " "} ${name.padEnd(16)} ${size(n).padStart(9)}  ${pct(n).toFixed(2)}%`);
}
