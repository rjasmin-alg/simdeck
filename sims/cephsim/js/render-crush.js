// SPDX-License-Identifier: AGPL-3.0-or-later
// The CRUSH view: the tree the way `ceph osd tree` shows it, but editable.
//
// This is the second projection of the same cluster. The physical canvas says
// what is cabled to what; this says what CRUSH believes, which is a different
// question and frequently a different answer. Drag a host onto a rack here and
// its failure domain changes without a cable moving.
//
// Row building and painting are pure functions so they can be checked without a
// browser.

import { state, on, commit, changed, select, hostById, bucketById } from './model.js';
import { classOrDefault, DAEMONS } from './catalog.js';
import { RATIOS, fmtBytes } from './engine/capacity.js';
import { fillColour } from './render.js';

export const ROW_H = 22;
export const INDENT = 20;
export const NAME_X = 14;
export const WEIGHT_X = 330;
export const BAR_X = 400;
export const BAR_W = 150;
export const TREE_W = BAR_X + BAR_W + 90;

export const TREE_CSS = `
.cs-tree { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.cs-tree .paper { fill: var(--paper); }
.cs-tree .row-hit { fill: transparent; }
.cs-tree .row-alt { fill: var(--surface); fill-opacity: .5; }
.cs-tree .row-sel { fill: var(--accent); fill-opacity: .18; }
.cs-tree .row-drop { fill: var(--accent); fill-opacity: .3; stroke: var(--accent); stroke-width: 1.5; }
.cs-tree .tw { stroke: var(--edge); stroke-width: 1; }
.cs-tree .name { font-size: 12px; fill: var(--ink); dominant-baseline: middle; }
.cs-tree .name.dim { fill: var(--ink-soft); }
.cs-tree .kind { font-size: 9.5px; font-weight: 800; letter-spacing: .06em;
  fill: var(--ink-soft); dominant-baseline: middle; text-transform: uppercase; }
.cs-tree .num { font-size: 11px; fill: var(--ink-soft); dominant-baseline: middle;
  text-anchor: end; font-family: ui-monospace, Menlo, Consolas, monospace; }
.cs-tree .bar-bg { fill: var(--surface); rx: 3; }
.cs-tree .bar { rx: 3; }
.cs-tree .twisty { fill: var(--ink-soft); cursor: pointer; }
.cs-tree .badge { rx: 3; }
.cs-tree .badge-text { font-size: 7.5px; font-weight: 800; fill: #10151f;
  text-anchor: middle; dominant-baseline: middle; }
`;

/**
 * Flatten the document's CRUSH tree into display rows.
 *
 * Pure: document in, rows out. `collapsed` is a Set of ids whose children are
 * hidden — hosts collapse their OSDs by default on a large cluster, because a
 * 600-OSD tree scrolls forever otherwise.
 */
export function crushRows(doc, { collapsed = new Set(), usage = null } = {}) {
  const rows = [];
  const childBuckets = (parent) => doc.buckets.filter((b) => b.parent === parent);
  const hostsIn = (parent) => doc.hosts.filter((h) => h.parent === parent);

  const hostWeight = (h) => h.osds.reduce((a, o) => a + o.size, 0);
  const bucketWeight = (b) => childBuckets(b.id).reduce((a, c) => a + bucketWeight(c), 0)
    + hostsIn(b.id).reduce((a, h) => a + hostWeight(h), 0);

  const pushBucket = (b, depth) => {
    const kids = [...childBuckets(b.id), ...hostsIn(b.id)];
    rows.push({
      id: b.id, kind: 'bucket', type: b.type, name: b.name, depth,
      weight: bucketWeight(b), hasKids: kids.length > 0,
      collapsed: collapsed.has(b.id),
    });
    if (collapsed.has(b.id)) return;
    for (const c of childBuckets(b.id)) pushBucket(c, depth + 1);
    for (const h of hostsIn(b.id)) pushHost(h, depth + 1);
  };
  const pushHost = (h, depth) => {
    rows.push({
      id: h.id, kind: 'host', type: 'host', name: h.name, depth,
      weight: hostWeight(h), hasKids: h.osds.length > 0,
      collapsed: collapsed.has(h.id), up: h.up !== false, daemons: h.daemons,
    });
    if (collapsed.has(h.id)) return;
    for (const o of h.osds) {
      const u = usage?.get(o.id);
      rows.push({
        id: o.id, kind: 'osd', type: 'osd', name: `osd.${o.id}`, depth: depth + 1,
        weight: o.size, hasKids: false, collapsed: false,
        cls: o.class, up: o.up !== false && h.up !== false, in: o.in !== false,
        reweight: o.reweight ?? 1, ratio: u ? u.ratio : 0, pgs: u ? u.pgs : 0,
      });
    }
  };

  const roots = doc.buckets.filter((x) => x.parent === null);
  for (const b of roots) pushBucket(b, 0);

  // A host whose parent bucket is missing, or sits in a subtree hanging off no
  // root at all, still has to appear somewhere. This must be decided from
  // reachability, not from "did we already emit a row" — a host hidden inside a
  // collapsed rack is reachable and must stay hidden.
  const reachable = new Set();
  const walk = (b) => {
    if (reachable.has(b.id)) return;
    reachable.add(b.id);
    for (const c of doc.buckets) if (c.parent === b.id) walk(c);
  };
  for (const b of roots) walk(b);
  for (const h of doc.hosts) if (!reachable.has(h.parent)) pushHost(h, 1);
  return rows;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Rows -> SVG. Pure, so the markup is checkable in node. */
export function paintTree(rows, { selection = new Set(), dropTarget = null } = {}) {
  return rows.map((r, i) => {
    const y = i * ROW_H;
    const mid = y + ROW_H / 2;
    const x = NAME_X + r.depth * INDENT;
    const parts = [];

    if (dropTarget === r.id) {
      parts.push(`<rect class="row-drop" x="1" y="${y}" width="${TREE_W - 2}" height="${ROW_H}"/>`);
    } else if (selection.has(r.id)) {
      parts.push(`<rect class="row-sel" x="0" y="${y}" width="${TREE_W}" height="${ROW_H}"/>`);
    } else if (i % 2) {
      parts.push(`<rect class="row-alt" x="0" y="${y}" width="${TREE_W}" height="${ROW_H}"/>`);
    }
    parts.push(`<rect class="row-hit" x="0" y="${y}" width="${TREE_W}" height="${ROW_H}"/>`);

    if (r.hasKids) {
      // A right-pointing triangle when collapsed, down when open.
      const t = r.collapsed
        ? `${x - 11},${mid - 4} ${x - 4},${mid} ${x - 11},${mid + 4}`
        : `${x - 12},${mid - 3} ${x - 3},${mid - 3} ${x - 7.5},${mid + 3}`;
      parts.push(`<polygon class="twisty" data-twisty="${r.id}" points="${t}"/>`);
    }

    const dim = (r.kind === 'osd' && (!r.up || !r.in)) || (r.kind === 'host' && !r.up);
    parts.push(`<text class="kind" x="${x}" y="${mid}">${esc(r.type)}</text>`);
    parts.push(`<text class="name${dim ? ' dim' : ''}" x="${x + 64}" y="${mid}">${esc(r.name)}</text>`);

    if (r.kind === 'host' && r.daemons?.length) {
      r.daemons.forEach((id, n) => {
        const dm = DAEMONS[id];
        if (!dm) return;
        const bx = x + 64 + r.name.length * 7 + 8 + n * 22;
        parts.push(`<rect class="badge" x="${bx}" y="${mid - 6}" width="19" height="12" fill="${dm.colour}"/>`
          + `<text class="badge-text" x="${bx + 9.5}" y="${mid + 0.5}">${dm.short}</text>`);
      });
    }

    parts.push(`<text class="num" x="${WEIGHT_X}" y="${mid}">${r.weight.toFixed(r.weight < 10 ? 3 : 2)}</text>`);

    if (r.kind === 'osd') {
      const cls = classOrDefault(r.cls);
      parts.push(`<text class="num" x="${WEIGHT_X + 52}" y="${mid}"
        fill="${cls.colour}">${cls.label}</text>`);
      const w = Math.max(0, Math.min(1, r.ratio)) * BAR_W;
      parts.push(`<rect class="bar-bg" x="${BAR_X}" y="${mid - 5}" width="${BAR_W}" height="10"/>`);
      if (w > 0) parts.push(`<rect class="bar" x="${BAR_X}" y="${mid - 5}" width="${w.toFixed(1)}" height="10" fill="${fillColour(r.ratio)}"/>`);
      parts.push(`<text class="num" x="${BAR_X + BAR_W + 78}" y="${mid}"
        >${(r.ratio * 100).toFixed(1)}%  ${r.pgs} pg${r.reweight < 1 ? `  rw ${r.reweight.toFixed(2)}` : ''}${r.in ? '' : '  OUT'}${r.up ? '' : '  DOWN'}</text>`);
    }

    return `<g data-id="${r.kind === 'osd' ? r.id : esc(r.id)}" data-kind="${r.kind}"
      data-row="${i}">${parts.join('')}</g>`;
  }).join('');
}

// ---------------------------------------------------------------- the view --
let svg = null;
let collapsed = new Set();
let drag = null;
let dropTarget = null;
let rowsCache = [];

export function initCrushView(el) {
  svg = el;
  svg.classList.add('cs-tree');
  svg.innerHTML = `<defs><style>${TREE_CSS}</style></defs>
    <rect class="paper" x="-10000" y="-10000" width="20000" height="20000"/>
    <g id="cs-tree-world"></g>`;
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);
  svg.addEventListener('pointercancel', onUp);
  svg.addEventListener('wheel', onWheel, { passive: false });
  on('change', () => { if (state.tab === 'crush') renderCrush(); });
}

let scroll = 0;
export function renderCrush() {
  if (!svg) return;
  rowsCache = crushRows(state.doc, { collapsed, usage: state.derived?.usage });
  svg.querySelector('#cs-tree-world').innerHTML = paintTree(rowsCache, {
    selection: state.selection, dropTarget,
  });
  svg.querySelector('#cs-tree-world').setAttribute('transform', `translate(10 ${8 - scroll})`);
}

function rowAt(e) {
  const r = svg.getBoundingClientRect();
  const y = e.clientY - r.top - 8 + scroll;
  const i = Math.floor(y / ROW_H);
  return i >= 0 && i < rowsCache.length ? rowsCache[i] : null;
}

function onDown(e) {
  const twisty = e.target.closest('[data-twisty]');
  if (twisty) {
    const id = twisty.dataset.twisty;
    const key = rowsCache.find((r) => String(r.id) === id)?.id ?? id;
    if (collapsed.has(key)) collapsed.delete(key); else collapsed.add(key);
    renderCrush();
    return;
  }
  const row = rowAt(e);
  if (!row) return;
  svg.setPointerCapture(e.pointerId);
  select(row.id, { additive: e.shiftKey });
  // Only things with a parent can be re-parented: hosts and non-root buckets.
  const movable = row.kind === 'host' || (row.kind === 'bucket' && row.type !== 'root');
  drag = movable ? { id: row.id, kind: row.kind, y: e.clientY, moved: false } : null;
  renderCrush();
}

function onMove(e) {
  if (!drag) return;
  if (!drag.moved && Math.abs(e.clientY - drag.y) < 4) return;
  drag.moved = true;
  const row = rowAt(e);
  const ok = row && row.kind === 'bucket' && row.id !== drag.id && !isAncestor(drag.id, row.id);
  const next = ok ? row.id : null;
  if (next !== dropTarget) { dropTarget = next; renderCrush(); }
}

function onUp() {
  const d = drag;
  const target = dropTarget;
  drag = null;
  dropTarget = null;
  if (d && d.moved && target) {
    commit('reparent');
    if (d.kind === 'host') hostById(d.id).parent = target;
    else bucketById(d.id).parent = target;
    changed();                       // structural: the failure domain just moved
  } else {
    renderCrush();
  }
}

/** Guard against dropping a bucket inside its own subtree. */
function isAncestor(ancestorId, nodeId) {
  let cur = bucketById(nodeId);
  while (cur) {
    if (cur.id === ancestorId) return true;
    cur = cur.parent ? bucketById(cur.parent) : null;
  }
  return false;
}

function onWheel(e) {
  e.preventDefault();
  const max = Math.max(0, rowsCache.length * ROW_H - svg.getBoundingClientRect().height + 20);
  scroll = Math.max(0, Math.min(max, scroll + e.deltaY));
  renderCrush();
}

export function resetCrushScroll() { scroll = 0; }
export function collapseAllHosts() {
  collapsed = new Set(state.doc.hosts.map((h) => h.id));
  renderCrush();
}
export function expandAll() { collapsed = new Set(); renderCrush(); }
