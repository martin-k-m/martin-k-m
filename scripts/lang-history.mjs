// Generate dist/lang-history.svg: the same measurement as languages.svg, but as
// a stacked area over time instead of a single snapshot.
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
async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const QUERY = `
query($login:String!,$cursor:String){
  user(login:$login){
    repositories(first:100, after:$cursor, isFork:false,
                 ownerAffiliations:[OWNER,COLLABORATOR,ORGANIZATION_MEMBER]){
      pageInfo{ hasNextPage endCursor }
      nodes{
        nameWithOwner
        isPrivate
        owner{ login }
        createdAt
        defaultBranchRef{ name }
        languages(first:30){ edges{ node{ name color } } }
      }
    }
  }
}`;

const repos = [];
const colors = new Map();
let cursor = null;
do {
  const page = (await gql(QUERY, { login, cursor })).user.repositories;
  for (const r of page.nodes) {
    for (const e of r.languages.edges) if (e.node.color) colors.set(e.node.name, e.node.color);
    if (r.defaultBranchRef) repos.push(r); // an empty repo has no default branch
  }
  cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
} while (cursor);

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

// Month boundaries, oldest first, each the instant that month ended.
function monthEnds(from, to) {
  const out = [];
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
  while (d <= to) {
    out.push(new Date(d));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  out.push(to); // the present, so the chart runs to today rather than last month
  return out;
}

const now = new Date();
const earliest = repos.reduce((min, r) => (r.createdAt < min ? r.createdAt : min), repos[0].createdAt);
const marks = monthEnds(new Date(earliest), now);

// month index -> language -> bytes
const series = marks.map(() => new Map());
let measured = 0;

for (const repo of repos) {
  let dir;
  try {
    dir = await ensureClone(repo);
  } catch (e) {
    console.warn(`  skipped ${repo.nameWithOwner}: ${String(e.message).split("\n")[0]}`);
    continue;
  }
  const branch = repo.defaultBranchRef.name;
  const born = new Date(repo.createdAt);
  let lastSha = null;
  let lastCounts = new Map();

  for (let i = 0; i < marks.length; i++) {
    if (marks[i] < born) continue; // the repo did not exist yet
    let sha;
    try {
      sha = (await git(dir, ["rev-list", "-1", `--before=${marks[i].toISOString()}`, branch])).trim();
    } catch {
      break; // no such branch locally
    }
    if (!sha) continue;

    // Nothing landed this month, so the tree is the one already measured and
    // there is no reason to walk it again.
    if (sha === lastSha) {
      for (const [k, v] of lastCounts) series[i].set(k, (series[i].get(k) || 0) + v);
      continue;
    }
    lastSha = sha;

    const tree = await git(dir, ["ls-tree", "-r", "-l", sha]);
    lastCounts = new Map();
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
      lastCounts.set(lang, (lastCounts.get(lang) || 0) + size);
    }
    for (const [k, v] of lastCounts) series[i].set(k, (series[i].get(k) || 0) + v);
    measured++;
  }
}

// Trim the leading stretch where nothing existed yet, so the chart starts where
// the history does rather than at an arbitrary account creation date.
let start = series.findIndex((m) => [...m.values()].reduce((a, b) => a + b, 0) > 0);
if (start < 0) {
  console.error("no history measured");
  process.exit(1);
}
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
const peak = Math.max(...totals);
const finalTotal = totals[totals.length - 1];

// ── Rendering ───────────────────────────────────────────────────────────────
const THEMES = {
  dark: { suffix: "", bg: "#0A0A0C", text: "#ECEDF1", muted: "#6D6E79", accent: "#7C6CFF", other: "#3A3B44", grid: 0.07, border: 0.06 },
  light: { suffix: "-light", bg: "#FFFFFF", text: "#1F2328", muted: "#59636E", accent: "#7C6CFF", other: "#AFB8C1", grid: 0.1, border: 0.14 },
};

const MONO = "'JetBrains Mono',ui-monospace,monospace";
const W = 820;
const padL = 58, padR = 16, padT = 78, padB = 46;
const H = 400;
const plotW = W - padL - padR;
const plotH = H - padT - padB;

const x = (i) => padL + (i / Math.max(1, pts.length - 1)) * plotW;
const y = (v) => padT + plotH - (v / (peak || 1)) * plotH;

function size(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const mon = (d) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });

// Four gridlines is enough to read a value off without the lines competing with
// the bands they sit behind.
const ticks = 4;
const gridVals = Array.from({ length: ticks + 1 }, (_, i) => (peak / ticks) * i);

// Roughly six labels along the axis, whatever the span turns out to be.
const labelEvery = Math.max(1, Math.round(pts.length / 6));

function areas(C) {
  // Bands accumulate from the bottom, so each polygon runs along its own top
  // edge and back along the one below it.
  let lower = new Array(pts.length).fill(0);
  const out = [];
  for (let b = bands.length - 1; b >= 0; b--) {
    const name = bands[b];
    const upper = lower.map((base, i) => base + (stacks[i].get(name) || 0));
    const top = upper.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const bottom = lower.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).reverse().join(" ");
    const fill = name === "Other" ? C.other : colorOf(name);
    out.push(
      `<polygon points="${top} ${bottom}" fill="${fill}" fill-opacity="0.85"/>` +
        `<polyline points="${top}" fill="none" stroke="${fill}" stroke-width="1.25" stroke-linejoin="round"/>`
    );
    lower = upper;
  }
  return out.reverse().join("\n  ");
}

function legend(C) {
  let cx = padL;
  return bands
    .map((name) => {
      const fill = name === "Other" ? C.other : colorOf(name);
      const label = name === "Other" ? `Other · ${ranked.length - keep.length}` : name;
      const g = `<g><rect x="${cx}" y="44" width="9" height="9" rx="2.5" fill="${fill}"/>
    <text x="${cx + 14}" y="52" font-family="${MONO}" font-size="11" fill="${C.muted}">${esc(label)}</text></g>`;
      cx += 14 + label.length * 6.7 + 16;
      return g;
    })
    .join("\n  ");
}

function render(C) {
  const grid = gridVals
    .map(
      (v) =>
        `<line x1="${padL}" y1="${y(v).toFixed(1)}" x2="${W - padR}" y2="${y(v).toFixed(1)}" stroke="${C.text}" stroke-opacity="${C.grid}"/>
  <text x="${padL - 8}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end" font-family="${MONO}" font-size="10" fill="${C.muted}">${v > 0 ? size(v) : "0"}</text>`
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Bytes of code by language over time across ${repos.length} repositories">
  <rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.text}" stroke-opacity="${C.border}"/>
  <text x="${padL}" y="27" font-family="${MONO}" font-size="15" font-weight="600" fill="${C.text}">Languages over time · bytes of code</text>
  <text x="${W - padR}" y="27" text-anchor="end" font-family="${MONO}" font-size="15" font-weight="600" fill="${C.accent}">${size(finalTotal)}</text>
  ${legend(C)}
  ${grid}
  <clipPath id="reveal${C.suffix}"><rect x="${padL}" y="${padT - 4}" width="0" height="${plotH + 8}">
    <animate attributeName="width" from="0" to="${plotW}" dur="1.1s" begin="0.2s" fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1"/>
  </rect></clipPath>
  <g clip-path="url(#reveal${C.suffix})">
  ${areas(C)}
  </g>
  <line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="${C.text}" stroke-opacity="${C.border + 0.1}"/>
  ${xLabels}
  <text x="${padL}" y="${H - 10}" font-family="${MONO}" font-size="10" fill="${C.muted}">${pts.length} months · ${repos.length} repos · extensions Linguist counts as code</text>
  <text x="${W - padR}" y="${H - 10}" text-anchor="end" font-family="${MONO}" font-size="10" fill="${C.muted}">updated ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</text>
</svg>`;
}

await mkdir("dist", { recursive: true });
for (const theme of Object.values(THEMES)) {
  await writeFile(`dist/lang-history${theme.suffix}.svg`, render(theme), "utf8");
}

console.log(`lang-history.svg · ${pts.length} months · ${repos.length} repos · ${measured} trees measured`);
console.log(`  ${mon(pts[0])} -> ${mon(pts[pts.length - 1])}  peak ${size(peak)}  now ${size(finalTotal)}`);
for (const name of bands) {
  const v = stacks[stacks.length - 1].get(name) || 0;
  console.log(`  ${name.padEnd(14)} ${size(v).padStart(9)}  ${((v / finalTotal) * 100).toFixed(1)}%`);
}
