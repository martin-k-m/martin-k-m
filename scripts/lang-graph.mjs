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
const rows = shown.map(([name, n]) => ({ name, n, color: colors.get(name) || "#7C6CFF" }));
if (tail.length) {
  rows.push({
    name: `Other · ${tail.length}`,
    n: tail.reduce((sum, [, n]) => sum + n, 0),
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
const barX = padL + nameW + 12;
const barW = W - padR - valW - barX;

// Bars are share of total: a language at 50% fills half the track, so the bar
// length and the printed percentage always agree.
const scale = total;

const barColor = (row, C) => (row.other ? C.other : row.color);

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

console.log(`languages.svg · ${scope} · ${shown.length} rows`);
for (const [name, n] of ranked) {
  const folded = !shown.some(([s]) => s === name);
  console.log(`  ${folded ? "·" : " "} ${name.padEnd(16)} ${size(n).padStart(9)}  ${pct(n).toFixed(2)}%`);
}
