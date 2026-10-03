// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for kit view K1 (kit/sequence.js): its pure lane geometry, label sides, timer parts and spec checks, and its
// stylesheet section. Run: node --test 'kit/**/*.test.js'
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const seq = require('./sequence.js');

const css = fs.readFileSync(path.join(__dirname, 'kit.css'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, 'sequence.js'), 'utf8');
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
/** A position { share, gaps } in pixels, for a lane area W wide with gap g between k columns. */
const px = (p, W, g, k) => p.share * (W - (k - 1) * g) + p.gaps * g;

const DORA = {
  lanes: [{ id: 'C' }, { id: 'A' }, { id: 'B' }],
  rows: [
    { from: 'C', to: ['A', 'B'], line: 'dashed' },
    { from: 'A', to: 'C' },
    { kind: 'note', lane: 'A', text: 'down', k: 'fill' },
    { from: 'C', to: ['A', 'B'], lost: ['A'], down: ['A'] }
  ],
  timers: [{ lane: 'C', from: 1, to: 3, end: 'expired' }]
};

// ── tie-breaks first ──

test('tie-break: the label goes towards the farthest receiver; receivers equally far on both sides put it on the right', () => {
  assert.equal(seq.labelSide(0, [1, 2]), 'r');
  assert.equal(seq.labelSide(2, [0, 1]), 'l');
  assert.equal(seq.labelSide(1, [0, 2]), 'r', 'equally far: right');
  assert.equal(seq.labelSide(2, [0, 3]), 'l', 'two lanes left beat one lane right');
  assert.equal(seq.labelSide(1, [2, 0, 3]), 'r');
});

test('tie-break: a receiver word sits inside the arrow, except on a one-lane arrow to a lane that is not the outermost', () => {
  assert.equal(seq.reSide(0, 2, 3), 'in', 'two lanes: room inside');
  assert.equal(seq.reSide(0, 1, 3), 'out', 'one lane, receiver in the middle: outside');
  assert.equal(seq.reSide(1, 2, 3), 'in', 'one lane to the right edge: stays inside the chart');
  assert.equal(seq.reSide(1, 0, 3), 'in', 'one lane to the left edge');
  assert.equal(seq.reSide(2, 1, 4), 'out', 'leftwards, receiver not the edge');
  assert.equal(seq.reSide(0, 1, 2), 'in', 'two lanes only');
});

test('tie-break: a timer that starts and ends in one row is "only"; with no end it runs to the last row', () => {
  assert.equal(seq.timerPart({ from: 2, to: 2 }, 2, 5), 'only');
  assert.equal(seq.timerPart({ from: 2 }, 4, 5), 'end');
  assert.equal(seq.timerPart({ from: 4 }, 4, 5), 'only', 'started in the last row');
  assert.equal(seq.timerPart({ from: 2 }, 3, 5), 'mid');
  assert.equal(seq.timerPart({ from: 2, to: 3 }, 1, 5), null);
  assert.equal(seq.timerPart({ from: 2, to: 3 }, 4, 5), null);
  assert.equal(seq.timerPart({ from: 1, to: 3 }, 1, 5), 'start');
});

test('tie-break: a message lost on the wire stops half way between sender and receiver, either direction', () => {
  for (const [a, b] of [[0, 1], [1, 0], [0, 3], [4, 1]]) {
    const k = 5, W = 1000, g = 13;
    const m = seq.midway(seq.laneAt(a, k), seq.laneAt(b, k));
    close(px(m, W, g, k), (px(seq.laneAt(a, k), W, g, k) + px(seq.laneAt(b, k), W, g, k)) / 2);
  }
});

// ── geometry ──

test('laneAt: the lifeline runs through the centre of the lane card, for 2 to 6 lanes and any gap', () => {
  for (let k = 2; k <= 6; k++) {
    for (const [W, g] of [[1000, 0], [1000, 12.8], [355, 8]]) {
      const w = (W - (k - 1) * g) / k;   // the grid's column width
      for (let i = 0; i < k; i++) close(px(seq.laneAt(i, k), W, g, k), i * (w + g) + w / 2);
    }
  }
});

test('between: the width from one lane to another, used for the arrow', () => {
  const k = 3, W = 900, g = 10;
  const d = seq.between(seq.laneAt(0, k), seq.laneAt(2, k));
  close(px(d, W, g, k), px(seq.laneAt(2, k), W, g, k) - px(seq.laneAt(0, k), W, g, k));
});

test('css: a position becomes one calc() of the lane area and the gap', () => {
  assert.equal(seq.css(seq.laneAt(1, 3), 'var(--g)', 3), 'calc((100% - 2 * var(--g)) * 0.5 + 1 * var(--g))');
  assert.equal(seq.css({ share: 1 / 3, gaps: 0.5 }, '1rem', 2), 'calc((100% - 1 * 1rem) * 0.333333 + 0.5 * 1rem)');
});

// ── spec checks ──

test('checkSpec: a good spec passes', () => {
  assert.deepEqual(seq.checkSpec(DORA), []);
});

test('checkSpec: lane count, duplicate ids, unknown lanes, self-messages, drops, lost and timer rows', () => {
  assert.deepEqual(seq.checkSpec({ lanes: [{ id: 'A' }] }), ['lanes: 1 (the chart fits 2 to 6)']);
  assert.deepEqual(seq.checkSpec({ lanes: 'ABCDEFG'.split('').map((id) => ({ id })) }), ['lanes: 7 (the chart fits 2 to 6)']);
  const bad = {
    lanes: [{ id: 'A' }, { id: 'A' }, { id: 'B' }],
    rows: [
      { from: 'A', to: 'Q' }, { from: 'A', to: 'A' }, { from: 'A' }, { from: 'A', to: ['B', 'A'], drop: true },
      { from: 'A', to: 'B', lost: ['A'], line: 'wavy', place: 'top' }, { kind: 'note', lane: 'Z' }, { kind: 'box', lane: 'A' }
    ],
    timers: [{ lane: 'X', from: 0 }, { lane: 'A', from: 9 }, { lane: 'A', from: 2, to: 1 }]
  };
  const out = seq.checkSpec(bad).join('\n');
  for (const want of ['lane "A" twice', 'row 0: unknown lane "Q"', 'row 1: "A" sends to itself', 'row 2: a message needs a receiver',
    'row 3: a message lost on the wire (drop) has one receiver', 'row 4: lost at "A", which is not a receiver', 'row 4: unknown line "wavy"', 'row 4: unknown place "top"',
    'row 5: unknown lane "Z"', 'row 6: unknown kind "box"', 'timer 0: unknown lane "X"', 'timer 1: from must be a row index', 'timer 2: to must be a row index from 2']) {
    assert.ok(out.includes(want), `expected "${want}" in:\n${out}`);
  }
});

// ── stylesheet and script rules (docs/sim-ui.md §11) ──

test('1:1 drawing: the view uses no SVG and no viewBox; every label is HTML', () => {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(code, /viewBox|createElementNS|svg/i);
});

test('the lane cards and the rows share one gap, so the lifelines meet the card centres', () => {
  assert.match(css, /\.sd-seq-heads \{[^}]*column-gap: var\(--sd-seq-gap\)/);
  assert.match(css, /\.sd-seq-row \{[^}]*column-gap: var\(--sd-seq-gap\)/);
  assert.match(src, /var GAP = 'var\(--sd-seq-gap\)'/);
});

test('colour is never the only carrier: line styles, a double line when locked, ✕ when lost, dotted when down, a dashed down card', () => {
  assert.match(css, /\.sd-seq-arrow\[data-line='dashed'\] \{ border-top-style: dashed/);
  assert.match(css, /\.sd-seq-arrow\[data-line='dotted'\] \{ border-top-style: dotted/);
  assert.match(css, /\.sd-seq-arrow\[data-lock\] \{[^}]*double/);
  assert.match(css, /\.sd-seq-life\[data-down\] \{ border-left-style: dotted/);
  assert.match(css, /\.sd-seq-head\[data-state='down'\] \{ border-style: dashed/);
  assert.match(css, /\.sd-seq-eve\[data-lock\] \{ background-image: repeating-linear-gradient/);
  assert.match(src, /'sd-seq-x'/);
});

test('reduced motion: the only motion is the kit\'s pop-in on a forward step, which the kit turns off', () => {
  assert.match(src, /spec\.dir === 'forward' && !S\.reducedMotion\(\)/);
  assert.doesNotMatch(css.slice(css.indexOf('/* ── view K1'), css.indexOf('/* ── small screens')), /animation|transition/);
});

test('phone: the lane cards stack and the rows grow; nothing scrolls sideways', () => {
  const k1 = css.slice(css.indexOf('/* ── view K1'), css.indexOf('/* ── small screens'));
  const phone = k1.slice(k1.indexOf('@media'));
  assert.match(phone, /\.sd-seq-heads, \.sd-seq--eve \.sd-seq-heads \{ grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(phone, /\.sd-seq-list \{ overflow: visible; overflow-x: clip; \}/, 'rows grow; long labels never scroll the page sideways');
});

test('the view holds no words: every text it shows comes from the spec', () => {
  const visible = [...src.matchAll(/h\('[a-z0-9]+', [^,]+, '([^']+)'\)/g)].map((m) => m[1]).filter((w) => w !== '✕');
  assert.deepEqual(visible, []);
});
