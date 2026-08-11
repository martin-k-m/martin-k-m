// Generate dist/constellation.svg and its light twin: every repository this
// account touches, as one picture.
//
// The charts already here answer "what languages, and how much" and "how much
// work, and when". Neither answers "what is all of this, and how is it
// arranged", which is the question a stranger actually opens a profile with.
// Dozens of repositories across several owners is a shape, and a shape is worth
// drawing rather than summarising into a number. The counts are read off the
// data and printed in the footer rather than written into this comment, which
// is how a comment stays true.
//
// NOTHING PRIVATE IS NAMED. Most of these repositories are private, and their
// names are not public information; a chart that leaked fifty of them onto a
// public README would be a disclosure, not a visualisation. Private repos are
// drawn as unlabelled nodes and counted in the footer, so the shape is honest
// and complete while the names stay where they belong. Sizes are already
// public in aggregate through the language charts, so a radius discloses
// nothing those do not.
//
// THE LAYOUT IS DETERMINISTIC, which matters more here than it looks. This runs
// twice an hour and republishes the assets branch every time. A layout seeded
// with a random number would rewrite every coordinate in the file on every run,
// so the branch would fill with diffs recording nothing but noise, and the
// picture would visibly reshuffle for anyone who looked twice. Same input, same
// drawing: the constellation only moves when the repositories do.
//
// The placement is a phyllotaxis spiral per owner, relaxed until nothing
// overlaps, with the owners themselves packed on a ring sized from their own
// radii. No simulation, no randomness, no iteration count that depends on the
// clock.

import { mkdir, writeFile } from "node:fs/promises";
import { fetchRepos } from "./repos.mjs";

const login = process.env.GH_LOGIN ?? "martin-k-m";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("constellation: no GITHUB_TOKEN, skipping");
  process.exit(0);
}

// The website's warm editorial palette, shared with every other asset. The
// per-language node and legend colours are kept as they are, since colour is
// what identifies the language; everything else (ground, grid, halo, frame,
// accent) is unified. See banner.mjs for the full note.
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
    halo: 0.05,
    haloStroke: 0.6,
    nodeStroke: "#15140e",
    dim: 0.9,
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
    halo: 0.05,
    haloStroke: 0.7,
    nodeStroke: "#ece7d6",
    dim: 1,
  },
};

const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const W = 820;
const H = 560;
const CX = W / 2;
const CY = 292;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const advance = (size) => size * 0.6;
const textW = (s, size) => s.length * advance(size);

/** Golden angle. The reason a sunflower packs evenly without a grid. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const R_MIN = 4.5;
const R_MAX = 26;

// ── Shaping the data ────────────────────────────────────────────────────────

// fetchRepos returns the set plus the colour table it built on the way through,
// which is the same table the language chart paints with. Taking it from here
// rather than rediscovering colours per repository is what stops a language
// being one shade in this drawing and another in the one above it.
const { repos, colors } = await fetchRepos(login, token);

const nodes = repos
  .map((r) => {
    const edges = r.languages?.edges ?? [];
    const bytes = edges.reduce((sum, e) => sum + e.size, 0);
    const top = edges[0]?.node;
    return {
      name: r.nameWithOwner.split("/")[1] ?? r.nameWithOwner,
      owner: r.owner?.login ?? login,
      private: Boolean(r.isPrivate),
      bytes,
      lang: top?.name ?? null,
      color: top?.color ?? (top?.name ? colors.get(top.name) ?? null : null),
    };
  })
  // A repository with no attributed bytes is an empty shell, a template or a
  // docs-only stub. Drawing it as a node the same shape as a real one, only
  // smaller, says it is a small project rather than not a project.
  .filter((n) => n.bytes > 0);

if (nodes.length === 0) {
  console.error("constellation: no repositories with attributed bytes, skipping");
  process.exit(0);
}

const maxBytes = Math.max(...nodes.map((n) => n.bytes));
// Area proportional to bytes, so a repository twice the size looks twice as
// big. Radius proportional would make it four times, which is the single most
// common way a bubble chart lies.
for (const n of nodes) {
  n.r = R_MIN + (R_MAX - R_MIN) * Math.sqrt(n.bytes / maxBytes);
}

// Owners, biggest group first, so the eye lands on the densest cluster.
const byOwner = new Map();
for (const n of nodes) {
  if (!byOwner.has(n.owner)) byOwner.set(n.owner, []);
  byOwner.get(n.owner).push(n);
}
const clusters = [...byOwner.entries()]
  .map(([owner, members]) => ({
    owner,
    // Within a cluster, largest first: the spiral puts early items at the
    // centre, which is where the anchor repository of a group belongs.
    members: members.sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name)),
  }))
  .sort((a, b) => b.members.length - a.members.length || a.owner.localeCompare(b.owner));

// ── Layout ──────────────────────────────────────────────────────────────────

/**
 * Phyllotaxis placement, then relaxation.
 *
 * The spiral alone packs evenly for equal-sized dots and overlaps badly once
 * the radii vary by a factor of six, which they do here. The relaxation is what
 * makes it a packing rather than a pattern: repeatedly push any overlapping
 * pair apart along the line between them, and pull everything gently back
 * toward the centre so the cluster does not creep outward forever.
 *
 * Fixed iteration count and no randomness, so it is a pure function of the
 * repository sizes.
 */
function layoutCluster(members) {
  const spacing = 2.15 * (members.reduce((s, m) => s + m.r, 0) / members.length);

  members.forEach((m, i) => {
    const radius = spacing * Math.sqrt(i + 0.5);
    const angle = i * GOLDEN;
    m.x = Math.cos(angle) * radius;
    m.y = Math.sin(angle) * radius;
  });

  const GAP = 3;
  for (let pass = 0; pass < 160; pass++) {
    let moved = false;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i];
        const b = members[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        const need = a.r + b.r + GAP;
        if (d >= need) continue;
        // Coincident centres have no direction to separate along. Nudging by
        // index rather than by a random angle keeps the result reproducible.
        if (d < 1e-6) {
          dx = Math.cos(i * GOLDEN);
          dy = Math.sin(i * GOLDEN);
          d = 1;
        }
        const push = (need - d) / 2 / d;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
        moved = true;
      }
    }
    // Gentle centring, applied after separation so it never undoes it.
    for (const m of members) {
      m.x *= 0.995;
      m.y *= 0.995;
    }
    if (!moved && pass > 8) break;
  }

  const radius = Math.max(...members.map((m) => Math.hypot(m.x, m.y) + m.r));
  return radius;
}

for (const c of clusters) c.radius = layoutCluster(c.members);

/**
 * Owners on a ring, the largest at the centre.
 *
 * The biggest cluster is usually most of the account, so ringing everything
 * around a hole in the middle wastes the one place the eye starts. The largest
 * group sits at the centre and the rest orbit it, spaced by their own radii
 * rather than evenly, so a two-repo owner does not claim the same arc as a
 * thirty-repo one.
 */
const [core, ...orbit] = clusters;
core.cx = 0;
core.cy = 0;

// The ring the orbiting owners are seeded on, kept so the drawing can trace it
// faintly behind them. Reading it out changes no placement; it only lets the
// picture show the structure it was already built with.
let orbitRingR = 0;

if (orbit.length > 0) {
  const totalSpan = orbit.reduce((s, c) => s + c.radius, 0);
  let ringR = core.radius + Math.max(...orbit.map((c) => c.radius)) + 26;
  // Enough circumference for every orbiting cluster to sit clear of its
  // neighbours, which is a bound on the ring radius rather than a guess at it.
  ringR = Math.max(ringR, (totalSpan * 2.5) / Math.PI);
  orbitRingR = ringR;

  let angle = -Math.PI / 2;
  for (const c of orbit) {
    const span = ((c.radius * 2.5) / totalSpan) * Math.PI * 2 * 0.5;
    angle += span / 2;
    c.cx = Math.cos(angle) * ringR;
    c.cy = Math.sin(angle) * ringR * 0.62;
    angle += span / 2;
  }
}

/**
 * Separate the owners themselves, by the same rule as the nodes inside them.
 *
 * Spacing the ring by each cluster's share of the total radius is a good
 * opening guess and not a guarantee: two clusters whose radii differ sharply
 * can still land close enough that a node on one's edge touches a node on the
 * other's, which is exactly what happened between the two single-repository
 * owners. Relaxing the clusters as circles closes that case for every future
 * shape of the account rather than for today's.
 *
 * The core stays pinned. It is the anchor the ring is measured from, and a
 * drifting centre would move every other cluster with it for no gain.
 */
const CLUSTER_GAP = 22;
for (let pass = 0; pass < 120; pass++) {
  let moved = false;
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const a = clusters[i];
      const b = clusters[j];
      let dx = b.cx - a.cx;
      let dy = b.cy - a.cy;
      let d = Math.hypot(dx, dy);
      const need = a.radius + b.radius + CLUSTER_GAP;
      if (d >= need) continue;
      if (d < 1e-6) {
        dx = Math.cos(j * GOLDEN);
        dy = Math.sin(j * GOLDEN);
        d = 1;
      }
      // The core is index 0 and immovable, so when it is one of the pair the
      // other takes the whole correction instead of half of it.
      const aFixed = i === 0;
      const push = (need - d) / d;
      if (aFixed) {
        b.cx += dx * push;
        b.cy += dy * push;
      } else {
        a.cx -= dx * push * 0.5;
        a.cy -= dy * push * 0.5;
        b.cx += dx * push * 0.5;
        b.cy += dy * push * 0.5;
      }
      moved = true;
    }
  }
  if (!moved) break;
}

// Fit the whole field into the canvas rather than trusting the arithmetic to
// land there. One scale for everything, so relative sizes survive.
const bounds = clusters.reduce(
  (b, c) => ({
    minX: Math.min(b.minX, c.cx - c.radius),
    maxX: Math.max(b.maxX, c.cx + c.radius),
    minY: Math.min(b.minY, c.cy - c.radius - 16),
    maxY: Math.max(b.maxY, c.cy + c.radius),
  }),
  { minX: 0, maxX: 0, minY: 0, maxY: 0 }
);

const fieldW = bounds.maxX - bounds.minX || 1;
const fieldH = bounds.maxY - bounds.minY || 1;
const scale = Math.min((W - 96) / fieldW, (H - 190) / fieldH, 1.25);
const offX = CX - ((bounds.minX + bounds.maxX) / 2) * scale;
const offY = CY - ((bounds.minY + bounds.maxY) / 2) * scale;

const px = (v) => (v * scale + offX).toFixed(1);
const py = (v) => (v * scale + offY).toFixed(1);
const pr = (v) => (v * scale).toFixed(1);

// ── Legend ──────────────────────────────────────────────────────────────────
// Ranked by bytes across everything drawn, so the legend agrees with the
// language chart above it about which language is on top.
const langBytes = new Map();
for (const n of nodes) {
  if (!n.lang) continue;
  langBytes.set(n.lang, (langBytes.get(n.lang) ?? 0) + n.bytes);
}
const legend = [...langBytes.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 7)
  .map(([name]) => ({ name, color: colors.get(name) ?? nodes.find((n) => n.lang === name)?.color ?? null }));

const privateCount = nodes.filter((n) => n.private).length;
const CELL = 40;

function render(C) {
  const grid = [];
  for (let x = -CELL; x <= W + CELL; x += CELL) grid.push(`<path d="M${x} ${-CELL} V${H + CELL}"/>`);
  for (let y = -CELL; y <= H + CELL; y += CELL) grid.push(`<path d="M${-CELL} ${y} H${W + CELL}"/>`);

  const fallback = `url(#ramp${C.suffix})`;

  const drawn = clusters
    .map((c, ci) => {
      const halo = `<circle cx="${px(c.cx)}" cy="${py(c.cy)}" r="${pr(c.radius + 14)}" fill="${C.text}" fill-opacity="${C.halo}" stroke="${C.line2}" stroke-opacity="${C.haloStroke}" stroke-width="1"/>`;

      const label = `<text x="${px(c.cx)}" y="${(Number(py(c.cy)) - Number(pr(c.radius + 14)) - 8).toFixed(1)}" text-anchor="middle" font-family="${MONO}" font-size="10" font-weight="600" fill="${C.muted}" letter-spacing="1.2">${esc(c.owner)} · ${c.members.length}</text>`;

      const dots = c.members
        .map((m, i) => {
          const cx = px(c.cx + m.x);
          const cy = py(c.cy + m.y);
          const r = pr(m.r);
          const fill = m.color ?? fallback;
          // Public names only, and only where the node is big enough to carry
          // one without the label being wider than the thing it labels.
          const named = !m.private && m.r * scale >= 13;
          const text = named
            ? `<text x="${cx}" y="${(Number(cy) + 3.2).toFixed(1)}" text-anchor="middle" font-family="${MONO}" font-size="8" fill="${C.nodeStroke}" font-weight="700">${esc(m.name.slice(0, 9))}</text>`
            : "";
          // Staggered so the field assembles rather than appearing, and with
          // the finished state as the base value so it is never an empty box.
          const delay = 0.25 + ci * 0.08 + i * 0.012;
          return `<g opacity="1"><animate attributeName="opacity" dur="${(delay + 0.5).toFixed(2)}s" values="0;0;1" keyTimes="0;${(delay / (delay + 0.5)).toFixed(4)};1" fill="freeze"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${C.dim}" stroke="${C.nodeStroke}" stroke-width="1.2"/>${text}</g>`;
        })
        .join("");

      return halo + label + dots;
    })
    .join("\n  ");

  const legendX = 28;
  const chips = legend
    .map((l, i) => {
      const x = legendX + i * 108;
      return `<g><circle cx="${x + 4}" cy="${H - 30}" r="4.5" fill="${l.color ?? fallback}"/>
    <text x="${x + 14}" y="${H - 26}" font-family="${MONO}" font-size="9" fill="${C.muted}" textLength="${Math.min(textW(l.name, 9), 88).toFixed(1)}" lengthAdjust="spacing">${esc(l.name)}</text></g>`;
    })
    .join("");

  const total = nodes.length;
  const note = `${total} repositories · ${clusters.length} owners · ${privateCount} private, unlabelled by design · area is bytes of code`;
  const title = `Repository constellation: ${total} repositories across ${clusters.length} owners, sized by bytes of code and coloured by dominant language`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>
  <clipPath id="ccard${C.suffix}"><rect x="0" y="0" width="${W}" height="${H}" rx="12"/></clipPath>
  <radialGradient id="fadeg${C.suffix}" cx="50%" cy="50%" r="72%">
    <stop offset="0" stop-color="#fff" stop-opacity="1"/>
    <stop offset="0.62" stop-color="#fff" stop-opacity="1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="fade${C.suffix}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="url(#fadeg${C.suffix})"/>
  </mask>
  <linearGradient id="ramp${C.suffix}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.a1}"/>
    <stop offset="1" stop-color="${C.a2}"/>
  </linearGradient>
  <radialGradient id="cglow${C.suffix}" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${C.a2}" stop-opacity="0.16"/>
    <stop offset="0.65" stop-color="${C.a2}" stop-opacity="0.04"/>
    <stop offset="1" stop-color="${C.a2}" stop-opacity="0"/>
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
  @keyframes breathe { 0%,100% { opacity:.5 } 50% { opacity:1 } }
</style>
<g clip-path="url(#ccard${C.suffix})">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <g mask="url(#fade${C.suffix})"><g class="grid" stroke="${C.line}" stroke-opacity="${C.grid}" stroke-width="1">${grid.join("")}</g></g>
  <ellipse class="breathe" cx="${CX}" cy="${CY}" rx="330" ry="220" fill="url(#cglow${C.suffix})"/>
  ${
    orbitRingR > 0
      ? `<ellipse cx="${px(0)}" cy="${py(0)}" rx="${pr(orbitRingR)}" ry="${pr(
          orbitRingR * 0.62
        )}" fill="none" stroke="${C.line2}" stroke-opacity="${C.haloStroke}" stroke-width="1" stroke-dasharray="1 7"/>`
      : ""
  }

  <text x="28" y="42" font-family="${MONO}" font-size="15" font-weight="700" fill="url(#ramp${C.suffix})">CONSTELLATION</text>
  <text x="${W - 28}" y="42" text-anchor="end" font-family="${MONO}" font-size="10" fill="${C.muted}">${esc(note)}</text>
  <rect x="28" y="54" width="${W - 56}" height="1.2" fill="url(#crule${C.suffix})"/>

  ${drawn}

  <rect x="28" y="${H - 52}" width="${W - 56}" height="1.2" fill="url(#crule${C.suffix})"/>
  ${chips}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${C.line2}" stroke-opacity="${C.border}"/>
</svg>`;
}

await mkdir("dist", { recursive: true });
for (const theme of Object.values(THEMES)) {
  await writeFile(`dist/constellation${theme.suffix}.svg`, render(theme), "utf8");
}
console.log(
  `constellation · ${nodes.length} repositories · ${clusters.length} owners ` +
    `(${clusters.map((c) => `${c.owner}:${c.members.length}`).join(", ")}) · ` +
    `${privateCount} private and unlabelled`
);
