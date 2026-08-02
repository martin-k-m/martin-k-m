// Generate dist/lang-history.svg: the same measurement as languages.svg, but
// across a rolling six-month window instead of as a single snapshot.
//
// GitHub's API only reports what a repository looks like *now*. There is no
// historical language endpoint, so the history has to be reconstructed from the
// repositories themselves: clone each one, walk back to the last commit before
// each month boundary, and measure the tree that existed at that point.
//
// The measurement matches languages.svg on purpose. Bytes of source, attributed
// by file extension, with the same things left out that Linguist leaves out:
// vendored directories, build output, lockfiles, and the file types Linguist
// classes as data or prose rather than code. Two charts that disagree about
// what counts would be worse than one.
//
// It is an approximation of Linguist, not a reimplementation. Linguist also
// reads .gitattributes overrides, shebangs, and heuristics for ambiguous
// extensions. The far right of this chart should land near languages.svg; it
// will not land exactly on it.
//
// Env:
//   GH_LOGIN      (required) user to measure
//   GITHUB_TOKEN  (required) PAT with `repo` scope, also used to clone privates
//   CLONE_DIR     (optional) where to keep the bare clones between runs

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchRepos } from "./repos.mjs";

const exec = promisify(execFile);

const login = process.env.GH_LOGIN;
const token = process.env.GITHUB_TOKEN;
if (!login || !token) {
  console.error("GH_LOGIN and GITHUB_TOKEN are required");
  process.exit(1);
}

const CACHE = process.env.CLONE_DIR || join(process.env.RUNNER_TEMP || tmpdir(), "lang-history-cache");

// ── What counts as code ─────────────────────────────────────────────────────
// Only extensions listed here are counted, which means images, binaries, fonts
// and anything else unrecognised fall out without needing a deny list.
//
// Absent on purpose: .json, .yml, .yaml, .toml, .xml, .svg, .md. Linguist calls
// those data or prose and keeps them out of a repository's language bar, so
// counting them here would put this chart at odds with the other one.
const EXT = {
  ts: "TypeScript", tsx: "TypeScript", mts: "TypeScript", cts: "TypeScript",
  js: "JavaScript", jsx: "JavaScript", mjs: "JavaScript", cjs: "JavaScript",
  rs: "Rust",
  py: "Python", pyi: "Python", pyw: "Python",
  go: "Go",
  java: "Java",
  kt: "Kotlin", kts: "Kotlin",
  html: "HTML", htm: "HTML",
  css: "CSS", scss: "SCSS", sass: "SCSS", less: "Less",
  c: "C", h: "C",
  cpp: "C++", cc: "C++", cxx: "C++", hpp: "C++", hh: "C++", hxx: "C++",
  cs: "C#",
  rb: "Ruby", php: "PHP", swift: "Swift", dart: "Dart", lua: "Lua",
  scala: "Scala", ex: "Elixir", exs: "Elixir", erl: "Erlang", hs: "Haskell",
  sh: "Shell", bash: "Shell", zsh: "Shell",
  ps1: "PowerShell", psm1: "PowerShell",
  sql: "SQL", vue: "Vue", svelte: "Svelte", astro: "Astro",
  r: "R", m: "Objective-C", mm: "Objective-C", pl: "Perl", zig: "Zig",
};

// Directories nobody wrote by hand. Linguist skips these too, and without them
// a single committed node_modules would swamp every real measurement.
const SKIP_DIR = new Set([
  "node_modules", "vendor", "third_party", "dist", "build", "target", "out",
  "coverage", "__pycache__", ".venv", "venv", "site-packages", "Pods",
  ".next", ".nuxt", ".svelte-kit", "bower_components", "Godeps",
]);

const SKIP_FILE = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|composer\.lock|go\.sum|poetry\.lock|Gemfile\.lock)$|\.min\.(js|css)$|\.map$/;

function langOf(path) {
  if (SKIP_FILE.test(path)) return null;
  for (const seg of path.split("/").slice(0, -1)) if (SKIP_DIR.has(seg)) return null;
  const base = path.slice(path.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return null; // no extension, or a dotfile
  return EXT[base.slice(dot + 1).toLowerCase()] ?? null;
}

// ── Which repositories ──────────────────────────────────────────────────────
// Same population as languages.svg: not forks, and anything owned, collaborated
// on, or reached through an org. Colours come from the same place too, so a
// language is the same colour in both charts.

const all = await fetchRepos(login, token);
const colors = all.colors;
// An empty repository has no default branch and so nothing to walk.
const repos = all.repos.filter((r) => r.defaultBranchRef);

if (repos.length < 2) {
  console.error(
    `only ${repos.length} repository visible to this token, refusing to publish a misleading chart.\n` +
      "Set GITHUB_TOKEN to a PAT with `repo` scope (as the PROFILE_TOKEN secret in Actions)."
  );
  process.exit(1);
}

// Colours for anything the API never named, so a band is never left colourless.
const FALLBACK = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Rust: "#dea584", Python: "#3572A5",
  Go: "#00ADD8", Java: "#b07219", Kotlin: "#A97BFF", HTML: "#e34c26", CSS: "#663399",
  SCSS: "#c6538c", "C++": "#f34b7d", C: "#555555", "C#": "#178600", Ruby: "#701516",
  PHP: "#4F5D95", Swift: "#F05138", Dart: "#00B4AB", Shell: "#89e051",
  PowerShell: "#012456", SQL: "#e38c00", Vue: "#41b883", Svelte: "#ff3e00",
  Lua: "#000080", Scala: "#c22d40", Elixir: "#6e4a7e", Haskell: "#5e5086",
  "Objective-C": "#438eff", Perl: "#0298c3", Zig: "#ec915c", R: "#198CE7",
  Astro: "#ff5a03", Less: "#1d365d", Erlang: "#B83998",
};
const colorOf = (name) => colors.get(name) || FALLBACK[name] || "#7C6CFF";

// ── Clone, then measure each month ──────────────────────────────────────────
await mkdir(CACHE, { recursive: true });

async function git(dir, args) {
  const { stdout } = await exec("git", ["-C", dir, ...args], { maxBuffer: 256 * 1024 * 1024 });
  return stdout;
}

// Bare clones: the file contents are needed for `ls-tree -l` to report sizes, so
// a blobless clone would only trade the download for a slower refetch later.
async function ensureClone(repo) {
  const dir = join(CACHE, repo.nameWithOwner.replace("/", "__") + ".git");
  const url = `https://x-access-token:${token}@github.com/${repo.nameWithOwner}.git`;
  if (existsSync(dir)) {
    await exec("git", ["-C", dir, "fetch", "--quiet", "--prune", url, "+refs/heads/*:refs/heads/*"], { maxBuffer: 1 << 26 });
  } else {
    await exec("git", ["clone", "--bare", "--quiet", url, dir], { maxBuffer: 1 << 26 });
  }
  return dir;
}

// One point per day, end to end. At month ends a push on the 3rd stays
// invisible until the 1st, and even at a week the line reports a change days
// after it happened. Daily is the finest resolution the underlying data has,
// since a commit is stamped to the second but the chart's unit is a tree.
//
// It costs less than it looks. Points are cheap; the expensive part is walking
// a tree, and that is bounded by how many distinct commits are sampled, not by
// how many points there are. A day with no push resolves to the same commit as
// the day before and hits the cache.
const DAY = 86400000;

function samplePoints(from, to, stepDays = 1) {
  const out = [];
  for (let t = from.getTime() + stepDays * DAY; t < to.getTime(); t += stepDays * DAY) {
    out.push(new Date(t));
  }
  out.push(to); // the present
  return { marks: out, stepDays };
}

const now = new Date();

// First pass: clone, and read each repository's commit list in one call rather
// than a rev-list per sample point. Sampling weekly means over a hundred points
// per repo, and spawning that many git processes just to be told the tip has
// not moved would be most of the runtime for no information.
const cloned = [];
for (const repo of repos) {
  let dir;
  try {
    dir = await ensureClone(repo);
  } catch (e) {
    console.warn(`  skipped ${repo.nameWithOwner}: ${String(e.message).split("\n")[0]}`);
    continue;
  }
  let history;
  try {
    history = (await git(dir, ["log", "--format=%H %ct", repo.defaultBranchRef.name]))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const sp = l.indexOf(" ");
        return { sha: l.slice(0, sp), t: Number(l.slice(sp + 1)) * 1000 };
      })
      .reverse(); // oldest first
  } catch {
    continue; // no such branch locally
  }
  if (history.length) cloned.push({ repo, dir, history });
}

if (!cloned.length) {
  console.error("no repository history could be read");
  process.exit(1);
}

// A tree is identified by its commit, and the same commit is the answer for
// every sample point between one push and the next, so measuring it twice is
// wasted work. The cache is what makes the two passes below affordable.
const treeCache = new Map(); // commit sha -> Map(language -> bytes)
let walked = 0;

async function countsFor(dir, sha) {
  const hit = treeCache.get(sha);
  if (hit) return hit;

  const counts = new Map();
  const tree = await git(dir, ["ls-tree", "-r", "-l", sha]);
  for (const line of tree.split("\n")) {
    if (!line) continue;
    // <mode> <type> <sha> <size>\t<path>
    const tab = line.indexOf("\t");
    if (tab < 0) continue;
    const meta = line.slice(0, tab).split(/\s+/);
    if (meta[1] !== "blob") continue;
    const size = Number(meta[3]);
    if (!Number.isFinite(size)) continue;
    const lang = langOf(line.slice(tab + 1));
    if (!lang) continue;
    counts.set(lang, (counts.get(lang) || 0) + size);
  }
  treeCache.set(sha, counts);
  walked++;
  return counts;
}

async function measure(at) {
  const series = at.map(() => new Map());
  for (const { dir, history } of cloned) {
    let p = -1; // index of the newest commit at or before the current point
    for (let i = 0; i < at.length; i++) {
      const t = at[i].getTime();
      while (p + 1 < history.length && history[p + 1].t <= t) p++;
      if (p < 0) continue; // the repo had no commits yet
      const counts = await countsFor(dir, history[p].sha);
      for (const [k, v] of counts) series[i].set(k, (series[i].get(k) || 0) + v);
    }
  }
  return series;
}

const nonEmpty = (m) => [...m.values()].reduce((a, b) => a + b, 0) > 0;

// A rolling six-month window, matching the contributions chart, rather than
// everything since the first commit. All-time answers a different and less
// useful question: the early years are a thin sliver that never moves, and the
// composition that is actually shifting gets compressed into the right-hand
// edge. Six months is the span where the lines have something to say, and it
// moves forward on its own every time the job runs.
const WINDOW_DAYS = 183;
const from = new Date(now.getTime() - WINDOW_DAYS * DAY);

const { marks, stepDays } = samplePoints(from, now);
const series = await measure(marks);
const measured = walked;

// Only trims if a repository predates nothing in the window, which a fixed
// window makes unlikely, but an empty leading run would still plot as a flat
// zero rather than as "no data".
let start = series.findIndex(nonEmpty);
if (start < 0) start = 0;
const pts = marks.slice(start);
const data = series.slice(start);

// Rank by where each language ends up, not by its peak: the legend should read
// like the snapshot chart does.
const last = data[data.length - 1];
const ranked = [...last.entries()].sort((a, b) => b[1] - a[1]);
const TOP = 6;
const keep = ranked.slice(0, TOP).map(([n]) => n);
const keepSet = new Set(keep);
const bands = [...keep, "Other"];

const stacks = data.map((m) => {
  const row = new Map(keep.map((k) => [k, m.get(k) || 0]));
  let other = 0;
  for (const [k, v] of m) if (!keepSet.has(k)) other += v;
  row.set("Other", other);
  return row;
});

const totals = stacks.map((r) => [...r.values()].reduce((a, b) => a + b, 0));
const finalTotal = totals[totals.length - 1];

// Plotted as share of that month rather than absolute bytes, so the chart is
// about composition instead of growth. In bytes the early months are a sliver
// against a codebase several times larger, and the one thing the chart is meant
// to show, which language was carrying the work at a given time, is exactly
// what gets squashed.
const shares = stacks.map((row, i) =>
  new Map([...row].map(([k, v]) => [k, totals[i] ? v / totals[i] : 0]))
);

const [leadName, leadBytes] = ranked[0];
const leadShare = finalTotal ? leadBytes / finalTotal : 0;

// ── Rendering ───────────────────────────────────────────────────────────────
const THEMES = {
  dark: { suffix: "", bg: "#0A0A0C", text: "#ECEDF1", muted: "#6D6E79", accent: "#7C6CFF", other: "#3A3B44", grid: 0.07, border: 0.06 },
  light: { suffix: "-light", bg: "#FFFFFF", text: "#1F2328", muted: "#59636E", accent: "#7C6CFF", other: "#AFB8C1", grid: 0.1, border: 0.14 },
};

const MONO = "'JetBrains Mono',ui-monospace,monospace";
const W = 820;
// padL fits a "100%" tick, padR is the label column at the end of each line.
const padL = 44, padR = 140, padT = 52, padB = 46;
const H = 380;
const plotW = W - padL - padR;
const plotH = H - padT - padB;

// One line per language, each showing that language's own share, rather than
// bands stacked on each other. Stacking answers "what is the codebase made of",
// which the snapshot chart already answers; separate lines answer "when did
// each language take over", which is the only reason to plot time at all. It
// also means a band no longer moves just because the band under it moved.
const peakShare = Math.max(...shares.flatMap((m) => [...m.values()]));
const STEP = [0.05, 0.1, 0.2, 0.25].find((s) => peakShare / s <= 4.5) ?? 0.25;
const yMax = Math.min(1, Math.ceil((peakShare * 1.06) / STEP) * STEP);
const gridVals = [];
for (let v = 0; v <= yMax + 1e-9; v += STEP) gridVals.push(Number(v.toFixed(4)));

const x = (i) => padL + (i / Math.max(1, pts.length - 1)) * plotW;
const y = (share) => padT + plotH - (share / yMax) * plotH; // share is 0..1

function size(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const mon = (d) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });

// Roughly six labels along the axis, whatever the span turns out to be.
const labelEvery = Math.max(1, Math.round(pts.length / 6));

const strokeOf = (name, C) => (name === "Other" ? C.other : colorOf(name));

// Monotone cubic interpolation, not a plain Catmull-Rom spline.
//
// A plain spline overshoots around a sharp change: it would bulge a line above
// its own peak and, on a chart of percentages, below zero, drawing values that
// were never measured. The Fritsch-Carlson tangents flatten wherever the data
// turns, so the curve is smooth but never leaves the range of the points it
// passes through. Every point on this curve is a value that really happened,
// which is the only version of smoothing worth having on a chart like this.
function smoothPath(px, py) {
  const n = px.length;
  if (n < 3) return `M ${px.map((v, i) => `${v.toFixed(1)},${py[i].toFixed(1)}`).join(" L ")}`;

  // Once the points are closer together than about two pixels there is nothing
  // left for a curve to do: a cubic segment shorter than a pixel cannot bow
  // away from the straight line by an amount anyone can see. Sampling daily
  // puts the points under one pixel apart, so the control points would triple
  // the file for a difference no display can render. Straight segments at that
  // density draw the same picture.
  if ((px[n - 1] - px[0]) / (n - 1) < 2) {
    return `M ${px.map((v, i) => `${v.toFixed(1)},${py[i].toFixed(1)}`).join(" L ")}`;
  }

  const h = [], slope = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = px[i + 1] - px[i];
    slope[i] = (py[i + 1] - py[i]) / h[i];
  }

  const m = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    // A turning point, so the tangent is flat and the curve cannot overshoot.
    if (slope[i - 1] * slope[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
    }
  }

  let d = `M ${px[0].toFixed(1)},${py[0].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const t = h[i] / 3;
    d += ` C ${(px[i] + t).toFixed(1)},${(py[i] + m[i] * t).toFixed(1)}` +
         ` ${(px[i + 1] - t).toFixed(1)},${(py[i + 1] - m[i + 1] * t).toFixed(1)}` +
         ` ${px[i + 1].toFixed(1)},${py[i + 1].toFixed(1)}`;
  }
  return d;
}

function lines(C) {
  const px = shares.map((_, i) => x(i));
  return bands
    .map((name) => {
      const py = shares.map((m) => y(m.get(name) || 0));
      const s = strokeOf(name, C);
      return `<path d="${smoothPath(px, py)}" fill="none" stroke="${s}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="${px[px.length - 1].toFixed(1)}" cy="${py[py.length - 1].toFixed(1)}" r="3.2" fill="${s}" stroke="${C.bg}" stroke-width="1.5"/>`;
    })
    .join("\n  ");
}

// Each line is named where it ends, the way a poll tracker does it, instead of
// in a legend that makes the reader match colours back to the chart. Lines that
// finish close together would print on top of each other, so the labels are
// pushed apart while the dot stays on the real value.
function endLabels(C) {
  const rows = bands
    .map((name) => ({ name, share: shares[shares.length - 1].get(name) || 0 }))
    .sort((a, b) => b.share - a.share);

  const MIN = 15;
  const ys = rows.map((r) => y(r.share));
  for (let i = 1; i < ys.length; i++) if (ys[i] - ys[i - 1] < MIN) ys[i] = ys[i - 1] + MIN;
  const overflow = ys[ys.length - 1] - (padT + plotH);
  if (overflow > 0) for (let i = 0; i < ys.length; i++) ys[i] -= overflow;

  const lx = padL + plotW + 12;
  return rows
    .map((r, i) => {
      const label = r.name === "Other" ? `Other · ${ranked.length - keep.length}` : r.name;
      // A leader line, but only when the label had to move off its own value.
      const drift = Math.abs(ys[i] - y(r.share));
      const leader =
        drift > 2
          ? `<line x1="${(x(pts.length - 1) + 5).toFixed(1)}" y1="${y(r.share).toFixed(1)}" x2="${lx - 4}" y2="${ys[i].toFixed(1)}" stroke="${strokeOf(r.name, C)}" stroke-opacity="0.45" stroke-width="1"/>`
          : "";
      return `${leader}<rect x="${lx}" y="${(ys[i] - 4.5).toFixed(1)}" width="9" height="9" rx="2.5" fill="${strokeOf(r.name, C)}"/>
  <text x="${lx + 14}" y="${(ys[i] + 3.5).toFixed(1)}" font-family="${MONO}" font-size="11" fill="${C.text}">${esc(label)}</text>
  <text x="${W - 14}" y="${(ys[i] + 3.5).toFixed(1)}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${C.muted}">${(r.share * 100).toFixed(0)}%</text>`;
    })
    .join("\n  ");
}

function render(C) {
  const grid = gridVals
    .map(
      (v) =>
        `<line x1="${padL}" y1="${y(v).toFixed(1)}" x2="${W - padR}" y2="${y(v).toFixed(1)}" stroke="${C.text}" stroke-opacity="${C.grid}"/>
  <text x="${padL - 8}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end" font-family="${MONO}" font-size="10" fill="${C.muted}">${Math.round(v * 100)}%</text>`
    )
    .join("\n  ");

  const xLabels = pts
    .map((d, i) =>
      i % labelEvery === 0 || i === pts.length - 1
        ? `<text x="${x(i).toFixed(1)}" y="${H - padB + 18}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${C.muted}">${mon(d)}</text>`
        : ""
    )
    .filter(Boolean)
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Share of code by language over time across ${repos.length} repositories">
  <rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.text}" stroke-opacity="${C.border}"/>
  <text x="${padL}" y="27" font-family="${MONO}" font-size="15" font-weight="600" fill="${C.text}">Languages over time · share of code</text>
  <text x="${W - 14}" y="27" text-anchor="end" font-family="${MONO}" font-size="15" font-weight="600" fill="${C.accent}">${esc(leadName)} ${(leadShare * 100).toFixed(0)}%</text>
  ${grid}
  <clipPath id="reveal${C.suffix}"><rect x="${padL - 4}" y="${padT - 8}" width="0" height="${plotH + 16}">
    <animate attributeName="width" from="0" to="${plotW + 12}" dur="1.1s" begin="0.2s" fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1"/>
  </rect></clipPath>
  <g clip-path="url(#reveal${C.suffix})">
  ${lines(C)}
  </g>
  <line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="${C.text}" stroke-opacity="${C.border + 0.1}"/>
  ${xLabels}
  <g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="1.1s" fill="freeze"/>
  ${endLabels(C)}
  </g>
  <text x="${padL}" y="${H - 10}" font-family="${MONO}" font-size="10" fill="${C.muted}">6 months · sampled every ${stepDays} day${stepDays===1?"":"s"} · ${repos.length} repos · ${size(finalTotal)} today · extensions Linguist counts as code</text>
  <text x="${W - 14}" y="${H - 10}" text-anchor="end" font-family="${MONO}" font-size="10" fill="${C.muted}">updated ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</text>
</svg>`;
}

await mkdir("dist", { recursive: true });
for (const theme of Object.values(THEMES)) {
  await writeFile(`dist/lang-history${theme.suffix}.svg`, render(theme), "utf8");
}

console.log(`lang-history.svg · ${pts.length} points every ${stepDays}d · ${repos.length} repos · ${measured} trees measured`);
console.log(`  ${mon(pts[0])} -> ${mon(pts[pts.length - 1])}  ${size(finalTotal)} today  led by ${leadName}`);
for (const name of bands) {
  const v = stacks[stacks.length - 1].get(name) || 0;
  console.log(`  ${name.padEnd(14)} ${size(v).padStart(9)}  ${((v / finalTotal) * 100).toFixed(1)}%`);
}
