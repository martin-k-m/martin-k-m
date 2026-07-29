// Generate two matching contribution charts as SVGs, from one renderer:
//   - dist/contrib-cumulative.svg : running total over the past 365 days (integral)
//   - dist/contrib-recent.svg     : contributions per day over the last 30 days (the derivative)
//
// Both share one theme so the profile reads as a set. Data comes from the GitHub
// GraphQL contributions calendar, queried one year at a time (the API caps each
// window at 1 year).
//
// Env: GH_LOGIN (user), GITHUB_TOKEN (any token — contribution counts are public).

import { mkdir, writeFile } from "node:fs/promises";

const login = process.env.GH_LOGIN;
const token = process.env.GITHUB_TOKEN;
if (!login || !token) {
  console.error("GH_LOGIN and GITHUB_TOKEN are required");
  process.exit(1);
}

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

const meta = await gql(`query($login:String!){ user(login:$login){ createdAt } }`, { login });
const created = new Date(meta.user.createdAt);
const now = new Date();
const stamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const byDate = new Map();
for (let y = created.getUTCFullYear(); y <= now.getUTCFullYear(); y++) {
  const from = new Date(Date.UTC(y, 0, 1));
  if (from < created) from.setTime(created.getTime());
  const to = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
  if (to > now) to.setTime(now.getTime());

  const data = await gql(
    `query($login:String!,$from:DateTime!,$to:DateTime!){
       user(login:$login){ contributionsCollection(from:$from,to:$to){
         contributionCalendar{ weeks{ contributionDays{ date contributionCount } } } } } }`,
    { login, from: from.toISOString(), to: to.toISOString() }
  );
  for (const w of data.user.contributionsCollection.contributionCalendar.weeks)
    for (const d of w.contributionDays) byDate.set(d.date, d.contributionCount);
}

const dates = [...byDate.keys()].sort();
if (dates.length === 0) { console.error("no contribution data"); process.exit(1); }

const fmt = (n) => n.toLocaleString("en-US");

// ── Shared renderer ─────────────────────────────────────────────────────────
// points: [{ t: epochMs, v: number }] (already ordered). Emits one themed SVG.
function renderChart({ title, valueLabel, points, startLabel, endLabel }) {
  const W = 820, H = 240, padL = 18, padR = 18, padT = 44, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const t0 = points[0].t, t1 = points[points.length - 1].t;
  const maxV = Math.max(1, ...points.map((p) => p.v));
  const X = (t) => padL + (t1 === t0 ? 0 : (t - t0) / (t1 - t0)) * plotW;
  const Y = (v) => padT + plotH - (v / maxV) * plotH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ");
  const area =
    `M${X(t0).toFixed(1)} ${(padT + plotH).toFixed(1)} ` +
    points.map((p) => `L${X(p.t).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ") +
    ` L${X(t1).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  const endX = X(t1), endY = Y(points[points.length - 1].v);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${title}: ${valueLabel}">
  <defs>
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7C6CFF" stop-opacity="0.38"/>
      <stop offset="1" stop-color="#7C6CFF" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4F8CFF"/>
      <stop offset="1" stop-color="#7C6CFF"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="10" fill="#0A0A0C"/>
  <text x="${padL}" y="26" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="15" font-weight="600" fill="#ECEDF1">${title}</text>
  <text x="${W - padR}" y="26" text-anchor="end" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="15" font-weight="600" fill="#7C6CFF">${valueLabel}</text>
  <path d="${area}" fill="url(#area)" opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="1.4s" begin="0.3s" fill="freeze"/>
  </path>
  <path d="${line}" fill="none" stroke="url(#stroke)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000">
    <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.9s" fill="freeze"/>
  </path>
  <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="0" fill="#fff" stroke="#7C6CFF" stroke-width="2">
    <animate attributeName="r" from="0" to="4.5" dur="0.4s" begin="1.9s" fill="freeze"/>
  </circle>
  <text x="${padL}" y="${H - 10}" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="11" fill="#6D6E79">${startLabel}</text>
  <text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="11" fill="#6D6E79">updated ${stamp}</text>
  <text x="${W - padR}" y="${H - 10}" text-anchor="end" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="11" fill="#6D6E79">${endLabel}</text>
</svg>`;
}

const monthDay = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// ── Cumulative over the past year ────────────────────────────────────────────
const yearAgo = now.getTime() - 365 * 24 * 60 * 60 * 1000;
const yearDates = dates.filter((d) => new Date(d).getTime() >= yearAgo);
let running = 0;
const cumulative = yearDates.map((d) => ({ t: new Date(d).getTime(), v: (running += byDate.get(d)) }));
const total = running;
// Downsample to keep the path compact.
const N = 180;
const step = Math.max(1, Math.ceil(cumulative.length / N));
let cumPts = cumulative.filter((_, i) => i % step === 0);
if (cumulative.length && cumPts[cumPts.length - 1] !== cumulative[cumulative.length - 1]) cumPts.push(cumulative[cumulative.length - 1]);
if (!cumPts.length) cumPts = [{ t: yearAgo, v: 0 }, { t: now.getTime(), v: 0 }];

const cumulativeSvg = renderChart({
  title: "Contributions · past year",
  valueLabel: fmt(total),
  points: cumPts,
  startLabel: monthDay(cumPts[0].t),
  endLabel: monthDay(cumPts[cumPts.length - 1].t),
});

// ── Recent (last 30 days, per-day) ──────────────────────────────────────────
const recentDays = dates.slice(-30);
const recentPts = recentDays.map((d) => ({ t: new Date(d).getTime(), v: byDate.get(d) }));
const recentTotal = recentPts.reduce((s, p) => s + p.v, 0);

const recentSvg = renderChart({
  title: "Recent contributions",
  valueLabel: `${fmt(recentTotal)} · 30d`,
  points: recentPts,
  startLabel: monthDay(recentPts[0].t),
  endLabel: monthDay(recentPts[recentPts.length - 1].t),
});

await mkdir("dist", { recursive: true });
await writeFile("dist/contrib-cumulative.svg", cumulativeSvg, "utf8");
await writeFile("dist/contrib-recent.svg", recentSvg, "utf8");
console.log(`Wrote contrib-cumulative.svg (${fmt(total)} past year) and contrib-recent.svg (${fmt(recentTotal)} in last 30d), stamped ${stamp}`);
