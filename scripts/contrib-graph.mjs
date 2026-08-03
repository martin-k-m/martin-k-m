// Generate dist/contrib.svg and dist/contrib-light.svg: contributions over a
// ROLLING 6-month window (the last 183 days), so the chart shifts forward on
// its own and picks up new commits every time the workflow runs.
//
// Both series are on it, sharing one axis: the running total as the filled
// line and the per-day count as a dashed line over it. They are the same data
// integrated and not, in the same unit, so a reader wants them side by side
// rather than in two separate pictures.
//
// Env: GH_LOGIN (user), GITHUB_TOKEN (any token, contribution counts are public).

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
// "Aug 26" reads as a day of the month rather than a year, which is how it was
// misread. The apostrophe fixes it.
const monthYr = (t) => {
  const d = new Date(t);
  return `${d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })} '${String(
    d.getUTCFullYear()
  ).slice(-2)}`;
};

// The window ends today, so the right-hand label says so.
const dayLabel = (t) =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// Two palettes so the README can serve whichever matches the reader's theme.
// The blue-to-purple accent is the brand and stays put; only the surface, the
// text and the gridline weight change. Gridlines need more contrast on white:
// 5% black is invisible where 5% white on near-black is not.
const THEMES = {
  dark: {
    suffix: "",
    bg: "#0A0A0C",
    text: "#ECEDF1",
    muted: "#6D6E79",
    a1: "#4F8CFF",
    a2: "#7C6CFF",
    // Deliberately outside the blue-violet ramp the total uses, so the dashed
    // line reads as a different quantity rather than a shade of the same one.
    rate: "#4ECDC4",
    grid: 0.05,
    border: 0.06,
  },
  light: {
    suffix: "-light",
    bg: "#FFFFFF",
    text: "#1F2328",
    muted: "#59636E",
    a1: "#4F8CFF",
    a2: "#7C6CFF",
    rate: "#0F9B90", // darker on white, where #4ECDC4 washes out
    grid: 0.09,
    border: 0.14,
  },
};

// ── Shared renderer ─────────────────────────────────────────────────────────
// opts: { title, valueLabel, points:[{t,v}], secondary?:{points,label,peakLabel}, markPeak? }
//
// The running total and the per-day count are the same data twice, once
// integrated and once not, so they belong on one chart rather than two stacked
// on each other in the README.
//
// One shared y-axis, both in contributions, so the two lines can be compared
// directly and the daily spikes read as a real fraction of the total rather
// than being inflated to fill the frame. A second scale would have made the
// busiest day and the final total look the same height while meaning entirely
// different things.
function renderChart({ title, valueLabel, points, secondary, markPeak }, C) {
  const W = 820, H = 260, padL = 16, padR = 16, padT = 66, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const t0 = points[0].t, t1 = points[points.length - 1].t;
  const maxV = Math.max(1, ...points.map((p) => p.v), ...(secondary ? secondary.points.map((p) => p.v) : []));
  const X = (t) => padL + (t1 === t0 ? 0 : (t - t0) / (t1 - t0)) * plotW;
  const Y = (v) => padT + plotH - (v / maxV) * plotH;
  const path = (pts, yf) => pts.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)} ${yf(p.v).toFixed(1)}`).join(" ");

  const Y2 = Y; // same axis, same unit

  const line = path(points, Y);
  const area = `M${X(t0).toFixed(1)} ${(padT + plotH).toFixed(1)} ${points.map((p) => `L${X(p.t).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ")} L${X(t1).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  // Faint horizontal gridlines.
  const grid = [0.25, 0.5, 0.75, 1].map((f) => {
    const y = (padT + plotH * (1 - f)).toFixed(1);
    return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="${C.text}" stroke-opacity="${C.grid}"/>`;
  }).join("");

  const endX = X(t1), endY = Y(points[points.length - 1].v);

  const MONO = "'JetBrains Mono',ui-monospace,monospace";

  const secondaryLine = secondary
    ? `<path d="${path(secondary.points, Y2)}" fill="none" stroke="${C.rate}" stroke-width="1.8" stroke-dasharray="5 4" stroke-linecap="round" opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0.9s" fill="freeze"/>
  </path>`
    : "";

  // Label the busiest day, which is the one point on the daily line worth
  // naming and the thing the shared axis makes it easy to place against the
  // total.
  let peakMark = "";
  if (markPeak && secondary) {
    let pi = 0;
    const sp = secondary.points;
    for (let i = 1; i < sp.length; i++) if (sp[i].v > sp[pi].v) pi = i;
    if (sp[pi].v > 0) {
      const px = X(sp[pi].t), py = Y2(sp[pi].v);
      const anchor = px > W - 90 ? "end" : px < 90 ? "start" : "middle";
      peakMark = `<g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1.5s" fill="freeze"/>
    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="${C.rate}"/>
    <text x="${px.toFixed(1)}" y="${(py - 9).toFixed(1)}" text-anchor="${anchor}" font-family="${MONO}" font-size="10" fill="${C.rate}">${secondary.peakLabel(sp[pi].v)}</text>
  </g>`;
    }
  }

  // Two lines need saying which is which.
  const legend = secondary
    ? `<g font-family="${MONO}" font-size="11">
    <rect x="${padL}" y="40" width="16" height="3" rx="1.5" fill="${C.a2}"/>
    <text x="${padL + 23}" y="45" fill="${C.muted}">running total</text>
    <line x1="${padL + 130}" y1="41.5" x2="${padL + 146}" y2="41.5" stroke="${C.rate}" stroke-width="2" stroke-dasharray="5 4"/>
    <text x="${padL + 153}" y="45" fill="${C.muted}">${secondary.label}</text>
  </g>`
    : "";

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
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.text}" stroke-opacity="${C.border}"/>
  ${grid}
  <text x="${padL}" y="27" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="15" font-weight="600" fill="${C.text}">${title}</text>
  <text x="${W - padR}" y="27" text-anchor="end" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="15" font-weight="600" fill="${C.a2}">${valueLabel}</text>
  ${legend}
  <path d="${area}" fill="url(#area)" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="1.4s" begin="0.3s" fill="freeze"/></path>
  ${secondaryLine}
  <path d="${line}" fill="none" stroke="url(#stroke)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000">
    <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.9s" fill="freeze"/>
  </path>
  ${peakMark}
  <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="0" fill="none" stroke="${C.a2}" stroke-width="2" opacity="0.7">
    <animate attributeName="r" from="4" to="15" dur="1.8s" begin="1.9s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="0.6" to="0" dur="1.8s" begin="1.9s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="0" fill="${C.bg}" stroke="${C.a2}" stroke-width="2">
    <animate attributeName="r" from="0" to="4.5" dur="0.4s" begin="1.9s" fill="freeze"/>
  </circle>
  <text x="${padL}" y="${H - 10}" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="11" fill="${C.muted}">${monthYr(t0)}</text>
  <text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="11" fill="${C.muted}">updated ${stamp}</text>
  <text x="${W - padR}" y="${H - 10}" text-anchor="end" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="11" fill="${C.muted}">${dayLabel(t1)}</text>
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

// ── The rate, one point per day ─────────────────────────────────────────────
// The actual daily counts, not a moving average. It is spiky, because the work
// genuinely is: the median day is zero and the busiest is in the hundreds. An
// average would smooth that into something tidier than what happened.
const perDay = total / days.length;
const busiest = Math.max(...days.map((d) => d.v));

const opts = {
  title: "Contributions · 6 months",
  valueLabel: `${fmt(total)} · ${perDay.toFixed(1)}/day`,
  points: cumPts,
  secondary: {
    points: days,
    label: "per day",
    peakLabel: (v) => `${fmt(v)} in a day`,
  },
  markPeak: true,
};

await mkdir("dist", { recursive: true });
for (const theme of Object.values(THEMES)) {
  await writeFile(`dist/contrib${theme.suffix}.svg`, renderChart(opts, theme), "utf8");
}
console.log(
  `Wrote contrib.svg — ${fmt(total)} over ${days.length} days, ` +
    `${perDay.toFixed(1)}/day average, busiest day ${fmt(busiest)}, stamped ${stamp}`
);
