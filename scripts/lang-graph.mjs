// Generate dist/languages.svg: the languages I actually write, ranked by how
// much of them exists, measured in bytes of code across my repositories.
//
// The bytes come from lang-history.mjs walking every repository's tree, which
// is the same measurement the history chart and the website draw. That is the
// point: three surfaces showing the same quantity have to agree, and they did
// not while this one asked GitHub's Linguist API instead. Linguist is the
// fallback for a run where the walk published nothing, and the footer says
// which one was used.
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

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fetchRepos } from "./repos.mjs";
import { dayKey, stamp as stampOf, TZ } from "./when.mjs";
import { assertCoverage } from "./coverage-guard.mjs";

const login = process.env.GH_LOGIN;
const token = process.env.GITHUB_TOKEN;
if (!login || !token) {
  console.error("GH_LOGIN and GITHUB_TOKEN are required");
  process.exit(1);
}

const { repos, colors, privateCount, contributedCount } = await fetchRepos(login, token);
const repoCount = repos.length;

// Linguist's totals, which are the fallback rather than the default. The bar
// is redrawn from the tree walk below when its data is available; see the note
// at "one measurement everywhere".
const bytes = new Map(); // language -> bytes
for (const repo of repos) {
  for (const { size, node } of repo.languages.edges) {
    bytes.set(node.name, (bytes.get(node.name) || 0) + size);
  }
}

// ── Day-over-day movement ───────────────────────────────────────────────────
// Each row is marked with which way that language moved since the previous day:
// a green triangle up, a red one down, a blue bar for no change.
//
// The bars are Linguist's byte counts, and the API behind them only ever
// reports what exists *now*. Deriving a change from it alone means recording a
// total, waiting a day, and comparing, which is what this did at first — and it
// meant the arrows showed nothing at all until the job had run across a
// midnight. Shipping a feature that renders nothing for a day is not shipping
// it.
//
// lang-history.mjs already has the answer. It reconstructs the history by
// walking every repository's tree at every day boundary, so the gap between its
// last two samples is a measured day rather than a wait. It now writes that out
// as dist/lang-daily.json and runs first, so the arrows are right on run one.
//
// The two measurements are still NOT mixed. Tree-walk bytes and Linguist bytes are
// close but not equal — 26.0 MB against 26.2 MB on the run this was written —
// so subtracting one from the other would publish the gap between two counting
// methods as if it were a day of work. Both ends of the comparison come from
// the same source or there is no arrow. That source is named in the footer,
// because a reader subtracting the printed byte totals would otherwise get a
// different number from the one the arrow is based on.
const HISTORY_DAYS = 14;
const today = dayKey();
const repo = process.env.GITHUB_REPOSITORY || `${login}/${login}`;

const readJson = async (url, init) => {
  const res = await fetch(url, init);
  if (res.ok) return await res.json();
  if (res.status !== 404) console.warn(`  ${url}: HTTP ${res.status}, treating as absent`);
  return null;
};

let history = {};
let basis = null; // which measurement the arrows are computed from
// How many repositories the tree walk actually measured. Not the same as how
// many the API returns: a repository with no commits has no default branch and
// no tree to walk, so the walk skips it. Reporting the API's count next to the
// walk's bytes put "56 repos" under a chart built from 55.
let measuredRepoCount = null;

// First choice: this run's reconstruction, written moments ago by lang-history.
try {
  const local = JSON.parse(await readFile("dist/lang-daily.json", "utf8"));
  if (local && typeof local.days === "object" && Object.keys(local.days).length > 1) {
    history = local.days;
    basis = "tree";
    if (Number.isFinite(local.repos)) measuredRepoCount = local.repos;
  }
} catch {
  // Absent whenever lang-history did not run or could not finish — it is
  // continue-on-error in CI because it needs a PAT. Fall through.
}

// Fallback: the totals this script published on previous runs. Same measurement
// as the bars, but only useful once it has spanned a midnight.
if (!basis) {
  try {
    const prior = await readJson(
      process.env.HISTORY_URL || `https://raw.githubusercontent.com/${repo}/assets/languages.json`,
      { headers: { "Cache-Control": "no-cache" } }
    );
    if (prior && typeof prior.days === "object") {
      history = prior.days;
      basis = "linguist";
    }
  } catch (err) {
    // A chart with no arrows is fine; a failed build over a missing history
    // file is not.
    console.warn(`  previous totals unavailable (${err.message}), rendering without arrows`);
  }
}

// The most recent record from a day that is not today. Yesterday usually, but
// the job can be down for a weekend and comparing against the last day there is
// data for beats showing nothing.
const priorDates = Object.keys(history).filter((d) => d < today).sort();
const priorDate = priorDates[priorDates.length - 1];
const previous = priorDate ? history[priorDate] : null;

// The "now" side of the comparison has to match the "then" side. Against the
// tree reconstruction that is its own latest sample, not the Linguist totals.
const latestDates = Object.keys(history).sort();
const current =
  basis === "tree" && latestDates.length ? history[latestDates[latestDates.length - 1]] : null;

// Every language the comparison source has ever had a number for. Linguist
// classifies things the tree walk does not — HCL, Dockerfile, Makefile, PLpgSQL
// and so on are recognised by the API but are not in that script's extension
// table — and those rows would otherwise come out as `0 - 0`, drawing a blue
// "did not move" bar over a language nothing measured. Absent from the source
// is a different statement from flat, and it gets no marker.
const measuredLangs = new Set();
if (basis === "tree") {
  for (const day of Object.values(history)) for (const k of Object.keys(day)) measuredLangs.add(k);
}

// ── One measurement everywhere ──────────────────────────────────────────────
// The bar is drawn from the tree walk, not from Linguist, whenever the walk has
// published a number for today.
//
// It used to draw from Linguist while the history chart and the website drew
// from the walk, and the two do not agree: 42.40% against 42.30% for
// TypeScript, 0.63% against 1.51% for HTML, HCL in one and SQL in the other.
// Both are defensible measurements and neither is wrong, but a reader looking
// at the profile and the site sees one set of numbers contradict the other, and
// no amount of accuracy in either fixes that.
//
// So there is one source now. The walk's extension table was widened to cover
// what Linguist was catching and it was not (HCL, Dockerfile, Makefile, Just,
// Mako, FLUX), so switching costs no languages.
if (current) {
  bytes.clear();
  for (const [name, size] of Object.entries(current)) bytes.set(name, size);
}

// ── Share, not size ─────────────────────────────────────────────────────────
// The marker reports the change in each language's *share* of the code, not the
// change in its byte count. Bytes almost only ever go up: on any day with work
// in it every language that was touched grows and every row points up, which
// says a day happened and nothing about the languages. Shares are a fixed
// hundred percent split between them, so they sum to zero — something can only
// rise if something else falls, and the arrow becomes a statement about what
// the code is made of rather than about whether the week was busy.
//
// The unit is percentage points. A row moving 41.9% -> 42.3% is +0.4 pp, which
// is not the same as being 0.4% larger, and the tooltip prints both ends so
// there is nothing to misread.
const sumOf = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);
const nowTotals = current ? sumOf(current) : [...bytes.values()].reduce((a, b) => a + b, 0);
const prevTotal = previous ? sumOf(previous) : 0;

const shareIn = (name, src, denom) => {
  if (!denom) return 0;
  const v = src instanceof Map ? src.get(name) || 0 : src[name] || 0;
  return (v / denom) * 100;
};

// Rounded to the one decimal the rows actually print. A row reading 42.3% next
// to an up arrow should be a claim the reader can check against the row above
// it tomorrow; comparing at full precision would put arrows on movement too
// small to appear in either number shown.
const PRECISION = 1;
const round = (v) => Number(v.toFixed(PRECISION));

/**
 * Percentage points of share moved since `priorDate`, at the precision the
 * chart prints. Null when the comparison source never measured this language.
 */
function delta(name) {
  if (!previous) return null;
  if (basis === "tree" && !measuredLangs.has(name)) return null;
  const nowShare = round(shareIn(name, current || bytes, nowTotals));
  const thenShare = round(shareIn(name, previous, prevTotal));
  return round(nowShare - thenShare);
}

/** The two ends of that comparison, for the tooltip. */
function shares(name) {
  return {
    then: round(shareIn(name, previous || {}, prevTotal)),
    now: round(shareIn(name, current || bytes, nowTotals)),
  };
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

// Seeing fewer than two repositories is the obvious version of the failure. The
// quiet version is seeing most of them, which needs the last published run to
// notice.
try {
  await assertCoverage(repoCount, { repo, label: "languages.svg" });
} catch (err) {
  console.error(err.message);
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
  s: shares(name),
}));
if (tail.length) {
  const seenTail = tail.map(([name]) => name).filter((name) => delta(name) !== null);
  // The folded row's share is the share of the whole fold, so it is summed from
  // the parts on each side and differenced once, rather than summing a column
  // of already-rounded per-language deltas into a bigger rounding error. Only
  // the parts the source measured count; if it measured none of them the row
  // gets no marker rather than a flat one summed out of nothing.
  const tailNow = round(seenTail.reduce((a, name) => a + shareIn(name, current || bytes, nowTotals), 0));
  const tailThen = round(seenTail.reduce((a, name) => a + shareIn(name, previous || {}, prevTotal), 0));
  rows.push({
    name: `Other · ${tail.length}`,
    n: tail.reduce((sum, [, n]) => sum + n, 0),
    d: seenTail.length ? round(tailNow - tailThen) : null,
    s: { then: tailThen, now: tailNow },
    // Colour is chosen per theme: a near-black "other" band vanishes on a white
    // background, and a pale one vanishes on a dark background.
    other: true,
  });
}

const stamp = stampOf();

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
  const pct = (v) => `${v.toFixed(PRECISION)}%`;
  // Both ends, always, so the tooltip is checkable rather than a bare number:
  // "0.4" alone is ambiguous between four tenths of a point and four tenths of
  // a percent of the row, which are different quantities.
  const span = `${pct(row.s.then)} → ${pct(row.s.now)} since ${priorDate}`;
  if (row.d === 0) {
    return `<g><title>share unchanged, ${span}</title>
      <rect x="${(markX - 5).toFixed(1)}" y="${(cy - 1.25).toFixed(1)}" width="10" height="2.5" rx="1.25" fill="${C.flat}"/>
    </g>`;
  }
  const up = row.d > 0;
  const c = up ? C.up : C.down;
  const tri = up
    ? `${markX},${cy - 4.5} ${markX - 5},${cy + 3.5} ${markX + 5},${cy + 3.5}`
    : `${markX},${cy + 4.5} ${markX - 5},${cy - 3.5} ${markX + 5},${cy - 3.5}`;
  const moved = `${up ? "+" : "−"}${Math.abs(row.d).toFixed(PRECISION)} pp`;
  return `<g><title>${moved} · ${span}</title>
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
// The count that goes with the bytes being drawn. See measuredRepoCount.
const shownRepoCount = current && measuredRepoCount !== null ? measuredRepoCount : repoCount;
const scopeParts = [`${ranked.length} languages`, `${shownRepoCount} repos`];
if (privateCount) scopeParts.push(`${privateCount} private`);
if (contributedCount) scopeParts.push(`${contributedCount} contributed`);
// Name the day the arrows are measured against. "since yesterday" would be a
// guess on any run that follows a gap in the schedule.
if (priorDate) scopeParts.push(`▲▼ share vs ${priorDate}`);
// Name the measurement itself. It is the same one for the bars and the arrows
// now, and the same one the history chart and the website use, so this reads as
// a statement of method rather than as a warning that two numbers differ.
scopeParts.push(current ? "tree walk" : "Linguist");
const scope = scopeParts.join(" · ");

function render(C) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Languages by bytes of code across ${shownRepoCount} repositories">
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
    {
      updated: new Date().toISOString(),
      // Published so the next run can tell a shrinking token from a shrinking
      // account. See coverage-guard.mjs.
      repos: repoCount,
      days: Object.fromEntries(kept.map((d) => [d, history[d]])),
    },
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
