// Generate two matching contribution charts as SVGs, from one renderer.
// Both cover a ROLLING 6-month window (last 183 days), so they shift forward
// automatically and pick up new commits every time the workflow runs:
//   - dist/contrib-cumulative.svg : running total over the last 6 months (integral)
//   - dist/contrib-daily.svg      : contributions per day over the last 6 months (derivative)
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

// Pull the contribution calendar year-by-year (the API caps each window at 1 year).
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

const allDates = [...byDate.keys()].sort();
if (allDates.length === 0) { console.error("no contribution data"); process.exit(1); }

// Rolling window: the last 6 months (~183 days).
const sixMonthsAgo = now.getTime() - 183 * 24 * 60 * 60 * 1000;
const dates = allDates.filter((d) => new Date(d).getTime() >= sixMonthsAgo);
const days = (dates.length ? dates : [allDates[allDates.length - 1]])
  .map((d) => ({ t: new Date(d).getTime(), v: byDate.get(d) || 0 }));

const fmt = (n) => n.toLocaleString("en-US");
const monthYr = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });

const C = { bg: "#0A0A0C", text: "#ECEDF1", muted: "#6D6E79", a1: "#4F8CFF", a2: "#7C6CFF" };

// ── Shared renderer ─────────────────────────────────────────────────────────
// opts: { title, valueLabel, points:[{t,v}], overlay?:[{t,v}], markPeak?, fillFloor? }
function renderChart({ title, valueLabel, points, overlay, markPeak }) {
  const W = 820, H = 240, padL = 16, padR = 16, padT = 46, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const t0 = points[0].t, t1 = points[points.length - 1].t;
  const maxV = Math.max(1, ...points.map((p) => p.v), ...(overlay || []).map((p) => p.v));
  const X = (t) => padL + (t1 === t0 ? 0 : (t - t0) / (t1 - t0)) * plotW;
  const Y = (v) => padT + plotH - (v / maxV) * plotH;
  const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ");

  const line = path(points);
  const area = `M${X(t0).toFixed(1)} ${(padT + plotH).toFixed(1)} ${points.map((p) => `L${X(p.t).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ")} L${X(t1).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  // Faint horizontal gridlines.
  const grid = [0.25, 0.5, 0.75, 1].map((f) => {
    const y = (padT + plotH * (1 - f)).toFixed(1);
    return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="${C.text}" stroke-opacity="0.05"/>`;
  }).join("");

  const endX = X(t1), endY = Y(points[points.length - 1].v);

  // Optional smoothed overlay (e.g. moving average).
  const overlayLine = overlay && overlay.length
    ? `<path d="${path(overlay)}" fill="none" stroke="${C.text}" stroke-opacity="0.4" stroke-width="1.6" stroke-dasharray="4 4" stroke-linecap="round" pathLength="1000" stroke-dashoffset="0"/>`
    : "";

  // Optional peak marker (skip if the peak is the final point).
  let peakMark = "";
  if (markPeak) {
    let pi = 0;
    for (let i = 1; i < points.length; i++) if (points[i].v > points[pi].v) pi = i;
    if (pi !== points.length - 1 && points[pi].v > 0) {
      const px = X(points[pi].t), py = Y(points[pi].v);
      peakMark = `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="${C.a1}"/>
      <text x="${px.toFixed(1)}" y="${(py - 8).toFixed(1)}" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="10" fill="${C.muted}">${fmt(points[pi].v)}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${title}: ${valueLabel}">
  <defs>
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.a2}" stop-opacity="0.42"/>
      <stop offset="1" stop-color="${C.a2}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.a1}"/>
      <stop offset="1" stop-color="${C.a2}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.text}" stroke-opacity="0.06"/>
  ${grid}
  <text x="${padL}" y="27" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="15" font-weight="600" fill="${C.text}">${title}</text>
  <text x="${W - padR}" y="27" text-anchor="end" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="15" font-weight="600" fill="${C.a2}">${valueLabel}</text>
  <path d="${area}" fill="url(#area)" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="1.4s" begin="0.3s" fill="freeze"/></path>
  ${overlayLine}
  <path d="${line}" fill="none" stroke="url(#stroke)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000">
    <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.9s" fill="freeze"/>
  </path>
  ${peakMark}
  <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="0" fill="none" stroke="${C.a2}" stroke-width="2" opacity="0.7">
    <animate attributeName="r" from="4" to="15" dur="1.8s" begin="1.9s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="0.6" to="0" dur="1.8s" begin="1.9s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="0" fill="#fff" stroke="${C.a2}" stroke-width="2">
    <animate attributeName="r" from="0" to="4.5" dur="0.4s" begin="1.9s" fill="freeze"/>
  </circle>
  <text x="${padL}" y="${H - 10}" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="11" fill="${C.muted}">${monthYr(t0)}</text>
  <text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="11" fill="${C.muted}">updated ${stamp}</text>
  <text x="${W - padR}" y="${H - 10}" text-anchor="end" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="11" fill="${C.muted}">${monthYr(t1)}</text>
</svg>`;
}

// ── Cumulative (integral) over the last 6 months ─────────────────────────────────
let running = 0;
const cumulative = days.map((d) => ({ t: d.t, v: (running += d.v) }));
const total = running;
const N = 200;
const step = Math.max(1, Math.ceil(cumulative.length / N));
let cumPts = cumulative.filter((_, i) => i % step === 0);
if (cumPts[cumPts.length - 1] !== cumulative[cumulative.length - 1]) cumPts.push(cumulative[cumulative.length - 1]);

const cumulativeSvg = renderChart({
  title: "Contributions · 6 months",
  valueLabel: fmt(total),
  points: cumPts,
});

// ── Daily (derivative) over the last 6 months, with a 7-day moving average ───────
const vals = days.map((d) => d.v);
const win = 7;
const ma = vals.map((_, i) => {
  const s = Math.max(0, i - win + 1);
  const slice = vals.slice(s, i + 1);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
});
const overlay = days.map((d, i) => ({ t: d.t, v: ma[i] }));

const dailySvg = renderChart({
  title: "Contributions per day · 6 months",
  valueLabel: fmt(total),
  points: days,
  overlay,
  markPeak: true,
});

await mkdir("dist", { recursive: true });
await writeFile("dist/contrib-cumulative.svg", cumulativeSvg, "utf8");
await writeFile("dist/contrib-daily.svg", dailySvg, "utf8");
console.log(`Wrote contrib-cumulative.svg + contrib-daily.svg — ${fmt(total)} in the last ${days.length} days, stamped ${stamp}`);
