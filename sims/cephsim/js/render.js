// SPDX-License-Identifier: AGPL-3.0-or-later
// The physical canvas: hosts with their disks, switches, and the cables between.
//
// One rAF-batched full redraw of each layer. The layer DOM is replaced wholesale
// every frame, so **no pointer handler may hold on to an element** — see
// interact.js, which works from ids captured at pointerdown.
//
// CANVAS_CSS is what the drawing looks like and is embedded into exported SVG.
// UI_CSS below it is editor chrome (selection rings, marquee) and is deliberately
// left out of exports.

import { state, on } from './model.js';
import { DEVICE_CLASSES, DAEMONS, NETS, classOrDefault } from './catalog.js';
import { hostBox, switchBox, routeLink, contentBounds } from './geom.js';
import { iconFor } from './icons.js';
import { RATIOS } from './engine/capacity.js';
import { t } from './i18n.js';

export const CANVAS_CSS = `
.cs-canvas { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.cs-canvas .paper { fill: var(--paper); }
.cs-canvas .grid-tile { stroke: var(--grid); stroke-width: 1; fill: none; }

.cs-canvas .cable { fill: none; stroke-linecap: round; stroke-linejoin: round;
  stroke-width: 2.2; }
.cs-canvas .cable.down { stroke-dasharray: 3 6; opacity: .45; }
.cs-canvas .cable-hit { fill: none; stroke: transparent; stroke-width: 16; cursor: pointer; }
.cs-canvas .cable-label { font-size: 9.5px; font-weight: 600; fill: var(--ink-soft);
  text-anchor: middle; dominant-baseline: middle; }
.cs-canvas .cable-label-bg { fill: var(--paper); rx: 3; }

.cs-canvas .box { fill: var(--surface); stroke: var(--edge); stroke-width: 1.6; rx: 10; }
.cs-canvas .box-hit { fill: transparent; }
.cs-canvas .host-name { font-size: 12.5px; font-weight: 650; fill: var(--ink); }
.cs-canvas .host-sub { font-size: 9.5px; fill: var(--ink-soft); }
.cs-canvas .host.down .box { stroke-dasharray: 5 4; }
.cs-canvas .host.down .host-name { fill: var(--ink-soft); }

.cs-canvas .slot { rx: 3.5; stroke-width: 1.2; }
.cs-canvas .slot-fill { rx: 2; }
.cs-canvas .slot-label { font-size: 7.5px; font-weight: 700; text-anchor: middle;
  dominant-baseline: middle; fill: var(--ink); pointer-events: none; }
.cs-canvas .slot.out { stroke-dasharray: 2.5 2; }
.cs-canvas .slot.osd-down { opacity: .4; }

.cs-canvas .badge { rx: 3; }
.cs-canvas .badge-text { font-size: 7.5px; font-weight: 800; fill: #10151f;
  text-anchor: middle; dominant-baseline: middle; }

.cs-canvas .sw-name { font-size: 12px; font-weight: 650; fill: var(--ink); }
.cs-canvas .sw-sub { font-size: 9.5px; fill: var(--ink-soft); }
.cs-canvas .ico { fill: none; stroke: currentColor; stroke-width: 1.6;
  stroke-linecap: round; stroke-linejoin: round; }
.cs-canvas .ico .f { fill: currentColor; stroke: none; }
`;

const UI_CSS = `
.cs-canvas .sel-ring { fill: none; stroke: var(--accent); stroke-width: 2.4; rx: 12;
  pointer-events: none; }
.cs-canvas .sel-slot { fill: none; stroke: var(--accent); stroke-width: 2; rx: 4.5;
  pointer-events: none; }
.cs-canvas .marquee { fill: var(--accent); fill-opacity: .1; stroke: var(--accent);
  stroke-width: 1.2; stroke-dasharray: 4 3; }
.cs-canvas .link-preview { fill: none; stroke: var(--accent); stroke-width: 2.2;
  stroke-dasharray: 5 4; pointer-events: none; }
.cs-canvas .drop-target .box { stroke: var(--accent); stroke-width: 2.6; }
`;

export const THEMES = {
  dark: {
    '--paper': '#131924', '--grid': '#1d2634', '--surface': '#1a2231',
    '--edge': '#31405a', '--ink': '#e6edf7', '--ink-soft': '#8b9ab2',
    '--accent': '#4a9ee0',
  },
  light: {
    '--paper': '#ffffff', '--grid': '#e8edf4', '--surface': '#f7f9fc',
    '--edge': '#c3cede', '--ink': '#1a2231', '--ink-soft': '#5b6b83',
    '--accent': '#1f6fb2',
  },
};

const LAYERS = ['grid', 'cables', 'nodes', 'ui'];
let svg = null;
let layers = {};
let pending = false;

export function initRenderer(el) {
  svg = el;
  svg.classList.add('cs-canvas');
  svg.innerHTML = `<defs>
    <style>${CANVAS_CSS}${UI_CSS}</style>
    <pattern id="cs-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path class="grid-tile" d="M24 0H0v24"/></pattern>
    <filter id="cs-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-opacity=".22"/></filter>
  </defs>
  <rect class="paper" x="-100000" y="-100000" width="200000" height="200000"/>
  <rect id="cs-gridrect" fill="url(#cs-grid)" x="-100000" y="-100000"
        width="200000" height="200000"/>
  <g id="cs-world">${LAYERS.map((n) => `<g id="layer-${n}"></g>`).join('')}</g>`;
  layers = Object.fromEntries(LAYERS.map((n) => [n, svg.querySelector(`#layer-${n}`)]));
  applyTheme(state.theme);
  return svg;
}

export function applyTheme(name) {
  const vars = THEMES[name] || THEMES.dark;
  // simdeck copy: the CRUSH tree and the OSD map are drawn with the same variables; set on the physical canvas
  // alone, their var(--paper) was undefined and painted black in both themes.
  const panes = svg.ownerDocument?.querySelectorAll('svg.pane') ?? [svg];
  for (const el of panes) for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
}

export function scheduleRender() {
  // Importable from node (the markup below is tested there); there is simply
  // nothing to schedule without a frame loop.
  if (pending || typeof requestAnimationFrame === 'undefined') return;
  pending = true;
  requestAnimationFrame(() => { pending = false; render(); });
}
on('change', scheduleRender);

// ------------------------------------------------------------------ paint ---
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Green through amber to red, breaking at Ceph's own nearfull/full ratios. */
export function fillColour(ratio) {
  if (ratio >= RATIOS.full) return '#e05252';
  if (ratio >= RATIOS.backfillfull) return '#e07a3c';
  if (ratio >= RATIOS.nearfull) return '#e0b23c';
  const t = Math.max(0, Math.min(1, ratio / RATIOS.nearfull));
  const hue = 152 - t * 60;                      // green -> yellow-green
  return `hsl(${hue.toFixed(0)} 45% ${(52 - t * 6).toFixed(0)}%)`;
}

export function render() {
  if (!svg) return;
  const d = state.doc;
  const { x, y, k } = state.view;
  svg.querySelector('#cs-world').setAttribute('transform', `translate(${x} ${y}) scale(${k})`);
  svg.querySelector('#cs-gridrect').style.display = state.showGrid ? '' : 'none';

  const boxes = new Map();
  for (const h of d.hosts) boxes.set(h.id, hostBox(h));
  for (const s of d.switches) boxes.set(s.id, switchBox(s));

  layers.cables.innerHTML = d.links.map((l) => paintCable(l, boxes)).join('');
  layers.nodes.innerHTML = [
    ...d.switches.map((s) => paintSwitch(s, boxes.get(s.id))),
    ...d.hosts.map((h) => paintHost(h, boxes.get(h.id))),
  ].join('');
  layers.ui.innerHTML = paintSelection(boxes);
  emitBoxes(boxes);
}

/** Every painted layer for a document, as markup. Pure — no DOM needed, which
 *  is what lets the markup be checked in node while headless browsers are out. */
export function paintAll(doc, usage) {
  const boxes = new Map();
  for (const h of doc.hosts) boxes.set(h.id, hostBox(h));
  for (const s of doc.switches) boxes.set(s.id, switchBox(s));
  const prev = state.derived;
  state.derived = usage ? { usage } : null;
  try {
    return {
      boxes,
      cables: doc.links.map((l) => paintCable(l, boxes)).join(''),
      nodes: [...doc.switches.map((s) => paintSwitch(s, boxes.get(s.id))),
              ...doc.hosts.map((h) => paintHost(h, boxes.get(h.id)))].join(''),
    };
  } finally { state.derived = prev; }
}

// interact.js needs the same boxes the painter used; recomputing them there
// would be a second source of truth waiting to disagree.
let lastBoxes = new Map();
function emitBoxes(b) { lastBoxes = b; }
export const currentBoxes = () => lastBoxes;

export function paintCable(link, boxes) {
  const a = boxes.get(link.a), b = boxes.get(link.b);
  if (!a || !b) return '';
  const net = NETS[link.net] || NETS.public;
  const r = routeLink(a, b, { offset: link.offset || 0 });
  const down = link.up === false;
  const label = `${link.speed}G`;
  return `<g data-id="${link.id}" data-kind="link">
    <path class="cable-hit" d="${r.d}"/>
    <path class="cable${down ? ' down' : ''}" d="${r.d}" stroke="${net.colour}"
      ${net.dash ? `stroke-dasharray="${net.dash}"` : ''}/>
    <rect class="cable-label-bg" x="${r.mid.x - 13}" y="${r.mid.y - 6}" width="26" height="12"/>
    <text class="cable-label" x="${r.mid.x}" y="${r.mid.y}">${esc(label)}</text>
  </g>`;
}

export function paintHost(host, box) {
  const usage = state.derived?.usage;
  const cut = state.derived?.net?.unreachableHosts?.has(host.id) ?? false;
  const down = host.up === false || cut;
  const slots = box.slots.map((s) => paintSlot(s, usage, down)).join('');
  const badges = host.daemons.map((id, i) => {
    const dm = DAEMONS[id];
    if (!dm) return '';
    const bx = box.x + box.w - 10 - (host.daemons.length - i) * 22 + 22 - 20;
    return `<g><rect class="badge" x="${bx}" y="${box.y + 8}" width="19" height="12"
      fill="${dm.colour}"/><text class="badge-text" x="${bx + 9.5}" y="${box.y + 14.5}"
      >${dm.short}</text></g>`;
  }).join('');
  const raw = host.osds.reduce((a, o) => a + o.size, 0);
  return `<g class="host${down ? ' down' : ''}" data-id="${host.id}" data-kind="host">
    <rect class="box" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}"
      filter="url(#cs-shadow)"/>
    <rect class="box-hit" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}"/>
    <text class="host-name" x="${box.x + 10}" y="${box.y + 16}">${esc(host.name)}</text>
    <text class="host-sub" x="${box.x + 10}" y="${box.y + 26}"
      >${t('cv.hostSub', { n: host.osds.length, tib: raw })}${
        host.up === false ? t('cv.down') : cut ? t('cv.unreachable') : ''}</text>
    ${badges}${slots}
  </g>`;
}

export function paintSlot(slot, usage, hostDown) {
  const o = slot.osd;
  const cls = classOrDefault(o.class);
  const u = usage?.get(o.id);
  const ratio = u ? u.ratio : 0;
  const out = o.in === false;
  const isDown = hostDown || o.up === false;
  const barH = Math.max(0, Math.min(1, ratio)) * (slot.h - 6);
  return `<g data-id="${o.id}" data-kind="osd">
    <rect class="slot${out ? ' out' : ''}${isDown ? ' osd-down' : ''}"
      x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}"
      fill="var(--paper)" stroke="${cls.colour}"/>
    <rect class="slot-fill" x="${slot.x + 3}" y="${slot.y + slot.h - 3 - barH}"
      width="${slot.w - 6}" height="${barH}" fill="${fillColour(ratio)}"/>
    <text class="slot-label" x="${slot.x + slot.w / 2}" y="${slot.y + slot.h / 2}"
      >${o.id}</text>
  </g>`;
}

export function paintSwitch(sw, box) {
  const down = sw.up === false;
  return `<g class="switch${down ? ' down' : ''}" data-id="${sw.id}" data-kind="switch">
    <rect class="box" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}"
      filter="url(#cs-shadow)"/>
    <rect class="box-hit" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}"/>
    <g color="var(--ink-soft)">${iconFor('switchbox', { x: box.x + 9, y: box.y + 11, size: 22 })}</g>
    <text class="sw-name" x="${box.x + 39}" y="${box.y + 21}">${esc(sw.name)}</text>
    <text class="sw-sub" x="${box.x + 39}" y="${box.y + 34}"
      >${t('cv.swSub', { speed: sw.speed, ports: sw.ports })}${down ? t('cv.down') : ''}</text>
  </g>`;
}

function paintSelection(boxes) {
  const out = [];
  for (const id of state.selection) {
    const box = boxes.get(id);
    if (box) {
      out.push(`<rect class="sel-ring" x="${box.x - 4}" y="${box.y - 4}"
        width="${box.w + 8}" height="${box.h + 8}"/>`);
      continue;
    }
    if (typeof id === 'number') {
      for (const b of boxes.values()) {
        const s = b.slots?.find((sl) => sl.osd.id === id);
        if (s) out.push(`<rect class="sel-slot" x="${s.x - 2.5}" y="${s.y - 2.5}"
          width="${s.w + 5}" height="${s.h + 5}"/>`);
      }
    }
  }
  return out.join('') + (state.overlay || '');
}

export function allBoxes() {
  const d = state.doc;
  return [...d.hosts.map(hostBox), ...d.switches.map(switchBox)];
}
export { contentBounds };
