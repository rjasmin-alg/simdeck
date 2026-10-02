// Nested boxes: the fault-domain tree drawn as containment, with components
// sitting in the domain they are *assigned* to. Membership is read from
// `component.domain`, never from where a box happens to overlap — see
// CLAUDE.md.
//
// Every painter is a pure function returning an SVG string, exported so the
// checks can exercise the markup in node. Headless Firefox is broken on this
// machine; string painters are what keeps the renderer testable anyway.

import { domainIndex } from './engine/domain.js';

const PAD = 14, HEADER = 26, GAP = 12;
const COMP_W = 138, COMP_H = 40, COMP_GAP = 8, MAX_COLS = 3;

export const ROLE_COLOUR = {
  service:   '#0ea5e9',
  member:    '#7c3aed',
  replica:   '#059669',
  authority: '#dc2626',
  plane:     '#d97706',
  witness:   '#64748b',
  client:    '#0f766e',
};

// Embedded into exported SVG. Anything that affects how the drawing looks lives
// here and nowhere else.
export const CANVAS_CSS = `
  .fl-canvas { font: 13px system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .dom { fill: var(--dom-fill); stroke: currentColor; stroke-width: 1.2;
         stroke-dasharray: 6 4; rx: 10; fill-opacity: .05; }
  .dom-title { font-size: 11.5px; font-weight: 600; letter-spacing: .02em;
               fill: currentColor; text-transform: uppercase; }
  .dom-kind { font-size: 10px; fill: var(--ink-soft); }
  .comp { rx: 7; stroke-width: 1.4; stroke: currentColor; fill: var(--paper); }
  .comp-name { font-size: 12px; font-weight: 550; fill: var(--ink); }
  .comp-role { font-size: 9.5px; fill: var(--ink-soft); text-transform: uppercase;
               letter-spacing: .04em; }
  .down .comp { fill: var(--down-fill); stroke: var(--down); }
  .down .comp-name, .down .comp-role { fill: var(--down); }
  .down .dom { color: var(--down); fill-opacity: .1; }
  .implicit .comp { stroke-dasharray: 5 3; }
  .swatch { rx: 2.5; }
`;

// Editor-only. Deliberately NOT exported, so selection state cannot reach an
// exported file even by accident.
const UI_CSS = `
  .fl-canvas .comp, .fl-canvas .dom-title { cursor: pointer; }
  .fl-canvas .hit { fill: transparent; stroke: none; cursor: pointer; }
  .sel-ring { fill: none; stroke: var(--sel); stroke-width: 2.5; rx: 9; }
  .cut-lit .comp { stroke-width: 2.6; }
  .cut-lit-ring { fill: none; stroke: var(--sel); stroke-width: 2; stroke-dasharray: 4 3; rx: 9; }
`;

export const THEMES = {
  light: {
    '--paper': '#ffffff', '--ink': '#0f172a', '--ink-soft': '#64748b',
    '--dom-fill': '#475569', '--down': '#dc2626', '--down-fill': '#fef2f2',
    '--sel': '#0ea5e9', '--edge': '#cbd5e1',
  },
  dark: {
    '--paper': '#0f172a', '--ink': '#e2e8f0', '--ink-soft': '#94a3b8',
    '--dom-fill': '#94a3b8', '--down': '#f87171', '--down-fill': '#450a0a',
    '--sel': '#38bdf8', '--edge': '#334155',
  },
};

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;

// --- layout ---------------------------------------------------------------

export function layoutDoc(doc) {
  const idx = domainIndex(doc);
  const byDomain = new Map();
  for (const c of doc.components || []) {
    if (!byDomain.has(c.domain)) byDomain.set(c.domain, []);
    byDomain.get(c.domain).push(c);
  }

  const size = new Map();
  const measure = (id) => {
    const kids = idx.children.get(id) || [];
    const comps = byDomain.get(id) || [];
    let kidsW = 0, kidsH = 0;
    for (const k of kids) {
      const s = measure(k);
      kidsW += s.w + GAP;
      kidsH = Math.max(kidsH, s.h);
    }
    if (kids.length) kidsW -= GAP;

    const cols = Math.min(MAX_COLS, Math.max(1, comps.length));
    const rows = Math.ceil(comps.length / cols) || 0;
    const compsW = comps.length ? cols * COMP_W + (cols - 1) * COMP_GAP : 0;
    const compsH = comps.length ? rows * COMP_H + (rows - 1) * COMP_GAP : 0;

    const w = Math.max(kidsW, compsW, 150) + PAD * 2;
    let h = HEADER;
    if (kidsH) h += kidsH + GAP;
    if (compsH) h += compsH + GAP;
    h += PAD;

    const s = { w, h, kids, comps, cols, kidsH, compsH };
    size.set(id, s);
    return s;
  };

  const boxes = new Map();
  const place = (id, x, y) => {
    const s = size.get(id);
    boxes.set(id, { id, x, y, w: s.w, h: s.h, type: 'domain' });
    let cy = y + HEADER;
    let cx = x + PAD;
    for (const k of s.kids) {
      place(k, cx, cy);
      cx += size.get(k).w + GAP;
    }
    if (s.kids.length) cy += s.kidsH + GAP;
    s.comps.forEach((c, i) => {
      const col = i % s.cols, row = Math.floor(i / s.cols);
      boxes.set(c.id, {
        id: c.id, type: 'component',
        x: x + PAD + col * (COMP_W + COMP_GAP),
        y: cy + row * (COMP_H + COMP_GAP),
        w: COMP_W, h: COMP_H,
      });
    });
  };

  let x = PAD, maxH = 0;
  for (const root of idx.roots) {
    measure(root);
    place(root, x, PAD);
    x += size.get(root).w + GAP * 2;
    maxH = Math.max(maxH, size.get(root).h);
  }

  return { boxes, width: x + PAD, height: maxH + PAD * 2, idx };
}

// --- painters -------------------------------------------------------------

export function paintDomain(domain, box, { down = false } = {}) {
  const cls = ['domain', down ? 'down' : ''].filter(Boolean).join(' ');
  return `<g class="${cls}" data-kind="domain" data-id="${esc(domain.id)}">` +
    `<rect class="dom" x="${r1(box.x)}" y="${r1(box.y)}" width="${r1(box.w)}" height="${r1(box.h)}"/>` +
    `<text class="dom-title" x="${r1(box.x + PAD)}" y="${r1(box.y + 17)}">${esc(domain.name || domain.id)}</text>` +
    `<text class="dom-kind" x="${r1(box.x + box.w - PAD)}" y="${r1(box.y + 17)}" text-anchor="end">${esc(domain.kind || '')}</text>` +
    `<rect class="hit" x="${r1(box.x)}" y="${r1(box.y)}" width="${r1(box.w)}" height="20"/>` +
    `</g>`;
}

export function paintComponent(comp, box, { down = false, lit = false } = {}) {
  const colour = ROLE_COLOUR[comp.role] || ROLE_COLOUR.witness;
  const cls = ['component', down ? 'down' : '', comp.implicit ? 'implicit' : '', lit ? 'cut-lit' : '']
    .filter(Boolean).join(' ');
  return `<g class="${cls}" data-kind="component" data-id="${esc(comp.id)}" style="color:${esc(colour)}">` +
    `<rect class="comp" x="${r1(box.x)}" y="${r1(box.y)}" width="${r1(box.w)}" height="${r1(box.h)}"/>` +
    (lit ? `<rect class="cut-lit-ring" x="${r1(box.x - 3)}" y="${r1(box.y - 3)}" width="${r1(box.w + 6)}" height="${r1(box.h + 6)}"/>` : '') +
    `<rect class="swatch" x="${r1(box.x + 8)}" y="${r1(box.y + 13)}" width="4" height="14" fill="${esc(colour)}"/>` +
    `<text class="comp-name" x="${r1(box.x + 18)}" y="${r1(box.y + 18)}">${esc(comp.name || comp.id)}</text>` +
    `<text class="comp-role" x="${r1(box.x + 18)}" y="${r1(box.y + 31)}">${esc(comp.role || '')}${comp.implicit ? ' · not drawn' : ''}</text>` +
    `</g>`;
}

// The whole canvas as one string. `down` is a Set of component ids.
export function paintAll(doc, { down = new Set(), lit = new Set() } = {}) {
  const { boxes, width, height, idx } = layoutDoc(doc);
  const parts = [];

  // Domains painted outermost-first so children sit on top of their parents.
  const ordered = [...(doc.domains || [])].sort(
    (a, b) => depthOf(idx, a.id) - depthOf(idx, b.id),
  );
  for (const d of ordered) {
    const box = boxes.get(d.id);
    if (!box) continue;
    const kids = (doc.components || []).filter((c) => c.domain === d.id);
    const allDown = kids.length > 0 && kids.every((c) => down.has(c.id));
    parts.push(paintDomain(d, box, { down: allDown }));
  }
  for (const c of doc.components || []) {
    const box = boxes.get(c.id);
    if (!box) continue;
    parts.push(paintComponent(c, box, { down: down.has(c.id), lit: lit.has(c.id) }));
  }

  return { markup: parts.join(''), width, height, boxes };
}

function depthOf(idx, id) {
  let n = 0, cur = id;
  const seen = new Set();
  while (cur && idx.byId.has(cur) && !seen.has(cur)) {
    seen.add(cur);
    n++;
    cur = idx.byId.get(cur).parent;
  }
  return n;
}

// --- DOM side -------------------------------------------------------------

let svg = null;

export function initRenderer(el) {
  svg = el;
  svg.classList.add('fl-canvas');
  svg.innerHTML = `<style id="fl-style">${CANVAS_CSS}${UI_CSS}</style><g id="fl-layer"></g>`;
  applyTheme('light');
}

export function applyTheme(name) {
  const t = THEMES[name] || THEMES.light;
  for (const [k, v] of Object.entries(t)) svg.style.setProperty(k, v);
}

export function paint(doc, opts) {
  const { markup, width, height } = paintAll(doc, opts);
  svg.querySelector('#fl-layer').innerHTML = markup;
  svg.setAttribute('viewBox', `0 0 ${r1(width)} ${r1(height)}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
  return { width, height };
}
