// SPDX-License-Identifier: AGPL-3.0-or-later
// The OSD map: where an abstract CRUSH rule turns into a picture of skew.
//
// Three panels, top to bottom:
//   1. fill per OSD, grouped by host — spot the host that will fill first
//   2. PG count per OSD as a histogram — spot the CRUSH imbalance underneath it
//   3. PG state per pool as a stacked bar — the `ceph -s` line, drawn
//
// Layout and painting are pure functions over (doc, derived), so the whole panel
// can be checked in node.

import { state, on } from './model.js';
import { classOrDefault } from './catalog.js';
import { fmtBytes, RATIOS, poolDf } from './engine/capacity.js';
import { poolWidth } from './engine/pgmap.js';
import { fillColour } from './render.js';
import { t } from './i18n.js';

export const CELL = 18;
export const CELL_GAP = 3;
export const LABEL_W = 130;
export const PANEL_W = 940;

export const MAP_CSS = `
.cs-osdmap { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.cs-osdmap .paper { fill: var(--paper); }
.cs-osdmap .head { font-size: 10px; font-weight: 800; letter-spacing: .09em;
  fill: var(--ink-soft); text-transform: uppercase; }
.cs-osdmap .sub { font-size: 11px; fill: var(--ink-soft); }
.cs-osdmap .lbl { font-size: 11px; fill: var(--ink); dominant-baseline: middle; }
.cs-osdmap .lbl.dim { fill: var(--ink-soft); }
.cs-osdmap .cell { rx: 3; stroke-width: 1; }
.cs-osdmap .cell.sel { stroke: var(--accent); stroke-width: 2.2; }
.cs-osdmap .cell.osd-down { opacity: .35; }
.cs-osdmap .cell.out { stroke-dasharray: 2.5 2; }
.cs-osdmap .axis { stroke: var(--edge); stroke-width: 1; }
.cs-osdmap .hbar { fill: var(--accent); fill-opacity: .75; }
.cs-osdmap .hmean { stroke: var(--warn, #e0b23c); stroke-width: 1.5; stroke-dasharray: 4 3; }
.cs-osdmap .tick { font-size: 9.5px; fill: var(--ink-soft); text-anchor: end; dominant-baseline: middle; }
.cs-osdmap .seg { }
.cs-osdmap .seglbl { font-size: 10px; fill: var(--ink); dominant-baseline: middle; }
.cs-osdmap .poolname { font-size: 11.5px; font-weight: 650; fill: var(--ink); dominant-baseline: middle; }
`;

// PG state colours, ordered worst-last so the eye lands on trouble.
const STATE_COLOURS = [
  ['clean', '#4ade80'],
  ['remapped', '#4a9ee0'],
  ['backfilling', '#8b5cf6'],
  ['degraded', '#e0b23c'],
  ['inactive', '#f87171'],
];

/** Per-host rows of OSD cells. Pure. */
export function osdMapLayout(doc, usage) {
  const rows = [];
  let y = 0;
  for (const h of doc.hosts) {
    const cells = h.osds.map((o, i) => ({
      osd: o,
      x: LABEL_W + i * (CELL + CELL_GAP),
      y,
      ratio: usage?.get(o.id)?.ratio ?? 0,
      pgs: usage?.get(o.id)?.pgs ?? 0,
      down: o.up === false || h.up === false,
      out: o.in === false,
    }));
    rows.push({ host: h, y, cells });
    y += CELL + CELL_GAP + 2;
  }
  return { rows, height: y };
}

/** PG-count histogram buckets. Pure. */
export function pgHistogram(usage, bins = 22) {
  const counts = [...usage.values()].filter((u) => u.weight > 0).map((u) => u.pgs);
  if (!counts.length) return { bins: [], min: 0, max: 0, mean: 0 };
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const span = Math.max(1, max - min);
  const out = Array.from({ length: bins }, () => 0);
  for (const c of counts) {
    const i = Math.min(bins - 1, Math.floor(((c - min) / span) * bins));
    out[i]++;
  }
  return { bins: out, min, max, mean, n: counts.length };
}

/** Roll a pool's PG states up into the five buckets the bar shows. Pure. */
export function pgStateBreakdown(ev) {
  const out = { clean: 0, remapped: 0, backfilling: 0, degraded: 0, inactive: 0 };
  for (const pg of ev.pgs) {
    if (!pg.active) out.inactive++;
    else if (pg.state.includes('backfilling')) out.backfilling++;
    else if (pg.degraded) out.degraded++;
    else if (pg.state.includes('remapped')) out.remapped++;
    else out.clean++;
  }
  return out;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function paintOsdMap(doc, derived, { selection = new Set() } = {}) {
  if (!derived) return `<text class="sub" x="10" y="24">${t('map.noPools')}</text>`;
  const parts = [];
  let y = 0;

  // ---- 1. fill per OSD -----------------------------------------------------
  parts.push(`<text class="head" x="0" y="${y + 10}">${t('map.fill')}</text>`);
  parts.push(`<text class="sub" x="0" y="${y + 26}">${t('map.fillSub', {
    spread: (derived.df.spread * 100).toFixed(1), stddev: (derived.df.stddev * 100).toFixed(2),
    used: fmtBytes(derived.df.used), total: fmtBytes(derived.df.total) })}</text>`);
  y += 40;

  const { rows, height } = osdMapLayout(doc, derived.usage);
  for (const row of rows) {
    const ry = y + row.y;
    const dim = row.host.up === false;
    parts.push(`<text class="lbl${dim ? ' dim' : ''}" x="0" y="${ry + CELL / 2}"
      >${esc(row.host.name)}</text>`);
    for (const c of row.cells) {
      const cls = classOrDefault(c.osd.class);
      const sel = selection.has(c.osd.id);
      parts.push(`<g data-id="${c.osd.id}" data-kind="osd"><rect
        class="cell${sel ? ' sel' : ''}${c.down ? ' osd-down' : ''}${c.out ? ' out' : ''}"
        x="${c.x}" y="${ry}" width="${CELL}" height="${CELL}"
        fill="${fillColour(c.ratio)}" stroke="${sel ? 'var(--accent)' : cls.colour}"
        ><title>${t('map.cellTitle', { id: c.osd.id, cls: cls.label, size: c.osd.size,
          pct: (c.ratio * 100).toFixed(1), pgs: c.pgs })}</title>
        </rect></g>`);
    }
  }
  y += height + 26;

  // ---- 2. PG distribution --------------------------------------------------
  const h = pgHistogram(derived.usage);
  parts.push(`<text class="head" x="0" y="${y + 10}">${t('map.pgs')}</text>`);
  parts.push(`<text class="sub" x="0" y="${y + 26}">${t('map.pgsSub', {
    min: h.min, max: h.max, mean: h.mean.toFixed(1) })}</text>`);
  y += 42;
  const HH = 90;
  const peak = Math.max(1, ...h.bins);
  const bw = 26;
  h.bins.forEach((count, i) => {
    const bh = (count / peak) * HH;
    parts.push(`<rect class="hbar" x="${LABEL_W + i * bw}" y="${y + HH - bh}"
      width="${bw - 3}" height="${bh.toFixed(1)}"><title>${t('map.binTitle', { n: count })}</title></rect>`);
  });
  parts.push(`<line class="axis" x1="${LABEL_W}" y1="${y + HH}" x2="${LABEL_W + h.bins.length * bw}" y2="${y + HH}"/>`);
  parts.push(`<text class="tick" x="${LABEL_W - 8}" y="${y + HH}">${h.min}</text>`);
  parts.push(`<text class="tick" x="${LABEL_W + h.bins.length * bw + 34}" y="${y + HH}"
    text-anchor="start">${h.max} pg</text>`);
  if (h.max > h.min) {
    const mx = LABEL_W + ((h.mean - h.min) / (h.max - h.min)) * (h.bins.length * bw);
    parts.push(`<line class="hmean" x1="${mx.toFixed(1)}" y1="${y}" x2="${mx.toFixed(1)}" y2="${y + HH}"/>`);
  }
  y += HH + 34;

  // ---- 3. PG state per pool ------------------------------------------------
  parts.push(`<text class="head" x="0" y="${y + 10}">${t('map.state')}</text>`);
  y += 24;
  const BARW = 460;
  for (const ev of derived.evals) {
    const b = pgStateBreakdown(ev);
    const total = ev.pool.pg_num || 1;
    const df = poolDf(derived.map, ev.pool, derived.usage, derived.evals);
    parts.push(`<text class="poolname" x="0" y="${y + 9}">${esc(ev.pool.name)}</text>`);
    let x = LABEL_W;
    for (const [key, colour] of STATE_COLOURS) {
      const w = (b[key] / total) * BARW;
      if (w <= 0) continue;
      parts.push(`<rect class="seg" x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}"
        height="18" fill="${colour}"><title>${b[key]} ${key}</title></rect>`);
      x += w;
    }
    const geom = ev.pool.type === 'erasure'
      ? `EC ${ev.pool.k}+${ev.pool.m}` : `${ev.pool.size}x`;
    parts.push(`<text class="seglbl" x="${LABEL_W + BARW + 12}" y="${y + 9}"
      >${t('map.segLabel', { geom, total, free: fmtBytes(df.maxAvail) })}</text>`);
    y += 26;
  }
  y += 8;
  let lx = LABEL_W;
  for (const [key, colour] of STATE_COLOURS) {
    parts.push(`<rect x="${lx}" y="${y}" width="10" height="10" rx="2" fill="${colour}"/>`
      + `<text class="sub" x="${lx + 15}" y="${y + 9}">${key}</text>`);
    lx += 22 + key.length * 6.6;
  }

  return parts.join('');
}

// ------------------------------------------------------------------- view ---
let svg = null;
let scroll = 0;

export function initOsdMap(el) {
  svg = el;
  svg.classList.add('cs-osdmap');
  svg.innerHTML = `<defs><style>${MAP_CSS}</style></defs>
    <rect class="paper" x="-10000" y="-10000" width="20000" height="20000"/>
    <g id="cs-map-world"></g>`;
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    scroll = Math.max(0, scroll + e.deltaY);
    renderOsdMap();
  }, { passive: false });
  svg.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-kind="osd"]');
    if (g) import('./model.js').then((m) => m.select(Number(g.dataset.id), { additive: e.shiftKey }));
  });
  on('change', () => { if (state.tab === 'osdmap') renderOsdMap(); });
}

export function renderOsdMap() {
  if (!svg) return;
  const world = svg.querySelector('#cs-map-world');
  world.innerHTML = paintOsdMap(state.doc, state.derived, { selection: state.selection });
  world.setAttribute('transform', `translate(16 ${20 - scroll})`);
}
export function resetOsdMapScroll() { scroll = 0; }
