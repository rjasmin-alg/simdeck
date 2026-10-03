// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for kit view K2 (kit/topology.js): its pure geometry and spec checks, and its stylesheet section.
// Run: node --test 'kit/**/*.test.js'
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const topo = require('./topology.js');

const css = fs.readFileSync(path.join(__dirname, 'kit.css'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, 'topology.js'), 'utf8');
const near = (p, q) => assert.ok(Math.abs(p.x - q.x) < 1e-9 && Math.abs(p.y - q.y) < 1e-9, `${JSON.stringify(p)} ≠ ${JSON.stringify(q)}`);

const LAN = {
  cols: 5,
  nodes: [
    { id: 'A', col: 0, row: 0 }, { id: 'B', col: 1, row: 0 }, { id: 'C', col: 2, row: 0 },
    { id: 'R', kind: 'router', col: 3, row: 0 }, { id: 'cloud', kind: 'cloud', col: 4, row: 0 }
  ],
  links: [{ id: 'lan', bus: ['A', 'B', 'C', 'R'], row: 1 }, { id: 'wan', a: 'R', b: 'cloud' }, { id: 'ab', a: 'A', b: 'B' }]
};

// ── tie-breaks first ──

test('tie-break: sender and receivers on one bus go over the bus, even where a direct link is drawn too', () => {
  assert.equal(topo.routeOf(LAN, { from: 'A', to: 'B' }).link.id, 'lan');
  assert.equal(topo.routeOf(LAN, { from: 'R', to: 'cloud' }).link.id, 'wan');
  assert.equal(topo.routeOf(LAN, { from: 'cloud', to: 'R' }).link.id, 'wan', 'a link works both ways');
});

test('tie-break: of two receivers equally far from the sender, the first in the list is the farthest', () => {
  assert.equal(topo.farthest(50, [10, 90]), 0);
  assert.equal(topo.farthest(50, [90, 10]), 0);
  assert.equal(topo.farthest(0, [10, 30, 20]), 1);
  assert.equal(topo.farthest(100, [10, 30, 20]), 0, 'farthest to the left');
});

test('tie-break: a ray through a corner leaves on both edges at once; a point at the centre stays there', () => {
  const r = { left: 0, top: 0, width: 20, height: 20 };
  near(topo.edgePoint(r, { x: 30, y: 30 }, 0), { x: 20, y: 20 });
  near(topo.edgePoint(r, { x: 10, y: 10 }, 0), { x: 10, y: 10 });
});

test('tie-break: a packet travels on the left of its direction, so a reply passes on the other side of the link', () => {
  const there = topo.beside({ x: 0, y: 0 }, { x: 10, y: 0 }, 2);
  near(there.a, { x: 0, y: -2 });
  const back = topo.beside({ x: 10, y: 0 }, { x: 0, y: 0 }, 2);
  near(back.a, { x: 10, y: 2 });
  near(topo.beside({ x: 1, y: 1 }, { x: 1, y: 1 }, 2).a, { x: 1, y: 1 }, 'a zero-length segment stays put');
});

// ── geometry ──

test('edgePoint: where the ray to a point leaves the card, grown by a gap', () => {
  const r = { left: 0, top: 0, width: 100, height: 40 };
  near(topo.centre(r), { x: 50, y: 20 });
  near(topo.edgePoint(r, { x: 300, y: 20 }, 0), { x: 100, y: 20 });
  near(topo.edgePoint(r, { x: 50, y: -100 }, 0), { x: 50, y: 0 });
  near(topo.edgePoint(r, { x: 300, y: 20 }, 5), { x: 105, y: 20 });
  near(topo.edgePoint(r, { x: 150, y: 70 }, 0), { x: 90, y: 40 }, 'a slope leaves through the bottom first');
  near(topo.edgePoint(r, { x: 60, y: 20 }, 0), { x: 60, y: 20 }, 'a point inside the card is not pushed out');
});

test('along and before: shares and distances on a segment', () => {
  near(topo.along({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5), { x: 5, y: 10 });
  near(topo.before({ x: 0, y: 0 }, { x: 10, y: 0 }, 3), { x: 7, y: 0 });
  near(topo.before({ x: 0, y: 0 }, { x: 2, y: 0 }, 3), { x: 1, y: 0 }, 'shorter than the distance: the middle');
});

test('routeOf: a broadcast to several needs a bus; unlinked nodes have no route', () => {
  assert.equal(topo.routeOf(LAN, { from: 'A', to: ['B', 'C', 'R'] }).kind, 'bus');
  assert.equal(topo.routeOf(LAN, { from: 'A', to: ['B', 'cloud'] }), null);
  assert.equal(topo.routeOf(LAN, { from: 'A', to: 'cloud' }), null);
});

// ── spec checks ──

test('checkSpec: a good spec passes', () => {
  assert.deepEqual(topo.checkSpec(Object.assign({}, LAN, { packets: [{ from: 'A', to: ['B', 'C', 'R'] }, { from: 'R', to: 'cloud' }] })), []);
});

test('checkSpec: duplicate ids, unknown kinds, positions outside the grid, unknown ends, missing routes', () => {
  const bad = {
    cols: 3,
    nodes: [{ id: 'A', col: 0, row: 0 }, { id: 'A', col: 1, row: 0 }, { id: 'X', kind: 'printer', col: 2, row: 0 },
      { id: 'Y', col: 2, row: 0, span: 2 }, { id: 'Z', col: -1, row: 0 }],
    links: [{ a: 'A', b: 'Q' }, { id: 'bus', bus: ['A'], row: 1 }, { id: 'nobus', bus: ['A', 'X'] }],
    packets: [{ from: 'A', to: 'nobody' }]
  };
  const out = topo.checkSpec(bad).join('\n');
  for (const want of ['node "A" twice', 'unknown kind "printer"', 'node "Y": col 2 is outside 3 columns', 'node "Z": col and row',
    'unknown node "Q"', 'fewer than two nodes', 'bus "nobus": row', 'packet 0: unknown node "nobody"']) {
    assert.ok(out.includes(want), `expected "${want}" in:\n${out}`);
  }
  const noRoute = topo.checkSpec({ nodes: [{ id: 'A', col: 0, row: 0 }, { id: 'B', col: 1, row: 0 }], packets: [{ from: 'A', to: 'B' }] });
  assert.deepEqual(noRoute, ['packet 0: no link or bus from "A" to "B"']);
});

test('the node kinds are host, switch, router, server, AP and cloud, and each has its own mark shape in kit.css', () => {
  assert.deepEqual(topo.KINDS, ['host', 'switch', 'router', 'server', 'ap', 'cloud']);
  for (const k of ['router', 'switch', 'server', 'ap', 'cloud']) assert.match(css, new RegExp(`\\.sd-topo-card\\[data-kind='${k}'\\]`), k);
});

// ── stylesheet and script rules (docs/sim-ui.md §10) ──

test('1:1 drawing: the view never sets a viewBox and draws no SVG text; labels are HTML', () => {
  assert.doesNotMatch(src, /viewBox['"]?\s*[:,]/);
  assert.doesNotMatch(src, /svg\('text'|createElementNS\([^)]*'text'/);
});

test('reduced motion: the packet move is a CSS animation, which the kit turns off with every other', () => {
  assert.match(css, /\.sd-topo-move \{ animation: sd-topo-move/);
  assert.match(css, /:root\[data-motion='reduce'\] \*[^{]*\{\s*animation: none !important/);
});

test('colour is never the only carrier: dashed for broadcast, blocked and down; a cross on a down link; hatching on a down node', () => {
  assert.match(css, /\.sd-topo-dashed, \.sd-topo-off, \.sd-topo-down \{ stroke-dasharray/);
  assert.match(src, /state === 'down'\) cross\(/);
  assert.match(src, /n\.state === 'down' \? ' sd-hatch'/);
  assert.match(css, /\.sd-topo-card\[data-state='down'\] \{ border-style: dashed/);
});

test('phone: the drawing hides and the nodes stack, so nothing scrolls sideways', () => {
  const phone = css.slice(css.indexOf('/* Phone and portrait: the nodes become a list'));
  assert.match(phone, /\.sd-topo-lane, \.sd-topo-links, \.sd-topo-over \{ display: none; \}/);
  assert.match(phone, /\.sd-topo \{ grid-template-columns: minmax\(0, 1fr\) !important/);
});

test('the view holds no words: every text it shows comes from the spec', () => {
  // string literals in the view are class names, tags, attributes and console messages, never visible words
  const visible = [...src.matchAll(/h\('[a-z0-9]+', [^,]+, '([^']+)'\)/g)].map((m) => m[1]);
  assert.deepEqual(visible, []);
});
