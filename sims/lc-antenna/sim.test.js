// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the "from resonant circuit to antenna" model. Run: node --test sims/lc-antenna/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const range = () => Array.from({ length: logic.steps + 1 }, (_, n) => n);

// ── tie-breaks first ──

test('tie-break: step 0 has nothing before it, so nothing got smaller and f0 has not risen', () => {
  const s = at({}, 0);
  assert.equal(s.lDown, false);
  assert.equal(s.cDown, false);
  assert.equal(s.f0Up, false);
});

test('tie-break: the last step keeps the same wire, so only C gets smaller, and f0 still rises', () => {
  const s = at({}, logic.steps);
  assert.equal(s.lDown, false);
  assert.equal(s.cDown, true);
  assert.equal(s.f0Up, true);
  assert.equal(s.last, true);
  assert.equal(at({}, logic.steps - 1).last, false);
});

test('tie-break: only flip === true flips; strings, 1 and missing params do not', () => {
  assert.equal(logic.at({ flip: true }, 0).sign, -1);
  for (const bad of [false, 'true', 1, null, undefined]) assert.equal(logic.at({ flip: bad }, 0).sign, 1, String(bad));
  assert.equal(logic.at(undefined, 0).sign, 1);
});

test('tie-break: a step outside 0 … steps goes to the nearest end, a fraction to the nearest step', () => {
  assert.equal(logic.at({}, -3).n, 0);
  assert.equal(logic.at({}, 99).n, logic.steps);
  assert.equal(logic.at({}, 2.4).n, 2);
  assert.equal(logic.at({}, 2.6).n, 3);
  assert.equal(logic.at({}, 'x').n, 0);
  assert.equal(logic.geometry(99).kind, 'dipole');
  assert.equal(logic.geometry(-1).kind, 'parallel');
});

// ── the model's rules ──

test('the six shapes follow figures 925–930, one per step', () => {
  assert.equal(logic.steps, 5);
  assert.deepEqual(range().map((n) => at({}, n).fig), [925, 926, 927, 928, 929, 930]);
  assert.deepEqual(range().map((n) => at({}, n).kind), ['parallel', 'parallel', 'fan', 'fan', 'wire', 'dipole']);
});

test('the coil loses turns and the loop narrows until only a straight wire is left', () => {
  assert.deepEqual(range().map((n) => at({}, n).turns), [5, 4, 3, 2, 0, 0]);
  assert.deepEqual(range().map((n) => at({}, n).loopWidth), [2, 2, 1.5, 1, 1, 1]);
  assert.deepEqual(range().map((n) => at({}, n).coil), [true, true, true, true, false, false]);
  for (let n = 1; n <= logic.steps; n++) assert.ok(at({}, n).turns <= at({}, n - 1).turns, `n = ${n}`);
});

test('the field moves out: between the plates, out of the capacitor, round the whole wire', () => {
  assert.deepEqual(range().map((n) => at({}, n).field), ['inside', 'inside', 'bulge', 'bulge', 'space', 'space']);
});

test('every step makes L or C smaller, so f0 = 1 / (2π √(LC)) rises at every step', () => {
  for (let n = 1; n <= logic.steps; n++) {
    const s = at({}, n);
    assert.ok(s.lDown || s.cDown, `n = ${n}`);
    assert.equal(s.f0Up, true, `n = ${n}`);
  }
  // fewer turns always means a smaller L
  for (let n = 1; n <= logic.steps; n++) {
    if (at({}, n).turns < at({}, n - 1).turns) assert.equal(at({}, n).lDown, true, `n = ${n}`);
  }
});

test('flip shows the same shape half a period later: only the sign changes', () => {
  for (const n of range()) {
    const a = at({}, n), b = at({ flip: true }, n);
    assert.equal(a.sign, 1);
    assert.equal(b.sign, -1);
    assert.deepEqual(Object.assign({}, b, { sign: 1 }), a, `n = ${n}`);
  }
});

test('geometry: plates 0.3 and 1.4 apart (925, 926), the field lines run from plate to plate', () => {
  for (const [n, gap] of [[0, 0.3], [1, 1.4]]) {
    const g = logic.geometry(n);
    assert.ok(close(g.plates[0][0][1] - g.plates[1][0][1], gap), `n = ${n}: gap`);
    assert.equal(g.field.length, 7);
    for (const line of g.field) {
      assert.ok(close(line[0][1], g.plates[0][0][1]), `n = ${n}: starts on the upper plate`);
      assert.ok(close(line[line.length - 1][1], g.plates[1][0][1]), `n = ${n}: ends on the lower plate`);
    }
  }
});

test('geometry: opened plates lie on rays 45° (927) and 90° (928) from the centre; the field lines are arcs between them', () => {
  for (const [n, deg] of [[2, 45], [3, 90]]) {
    const sh = logic.SHAPES[n], g = logic.geometry(n), c = sh.centre;
    for (const [i, plate] of g.plates.entries()) {
      for (const p of plate) {
        const a = Math.atan2(p[1] - c[1], p[0] - c[0]) * 180 / Math.PI;
        assert.ok(close(a, i === 0 ? deg : -deg), `n = ${n}: plate ${i} angle ${a}`);
      }
    }
    // the wires reach the plates: the loop's right corners lie on the rays
    for (const w of g.wires) {
      const end = w[w.length - 1], a = Math.abs(Math.atan2(end[1] - c[1], end[0] - c[0]) * 180 / Math.PI);
      assert.ok(close(a, deg), `n = ${n}: wire end on the ray`);
    }
    for (const arc of g.field) {
      const r = Math.hypot(arc[0][0] - c[0], arc[0][1] - c[1]);
      for (const p of arc) assert.ok(close(Math.hypot(p[0] - c[0], p[1] - c[1]), r), `n = ${n}: constant radius`);
      assert.ok(arc[0][1] > arc[arc.length - 1][1], `n = ${n}: from the upper plate down`);
      const e = arc[arc.length - 1], s0 = arc[0];
      assert.ok(close(Math.atan2(s0[1] - c[1], s0[0] - c[0]) * 180 / Math.PI, deg), `n = ${n}: starts on the upper plate's ray`);
      assert.ok(close(Math.atan2(e[1] - c[1], e[0] - c[0]) * 180 / Math.PI, -deg), `n = ${n}: ends on the lower plate's ray`);
    }
  }
});

test('geometry: the wire and the dipole carry field loops from end to end on both sides, the dipole is split and fed in the middle', () => {
  for (const n of [4, 5]) {
    const g = logic.geometry(n);
    assert.equal(g.field.length, 4);
    const sides = g.field.map((line) => Math.sign(line[Math.floor(line.length / 2)][0] - 1));
    assert.deepEqual(sides.slice().sort(), [-1, -1, 1, 1]);
    for (const line of g.field) {
      assert.deepEqual(line[0], [1, 0], `n = ${n}: starts at the upper end`);
      assert.deepEqual(line[line.length - 1], [1, -2], `n = ${n}: ends at the lower end`);
    }
  }
  const d = logic.geometry(5);
  assert.equal(d.wires.length, 2);
  assert.ok(close(d.feed[0][1] - d.feed[1][1], 0.2));
  assert.equal(logic.geometry(4).feed, null);
});

test('geometry: the field of the open circuit reaches further out than that of the closed one', () => {
  const reach = (n) => Math.max(...logic.geometry(n).field.flat().map((p) => Math.hypot(p[0] - 1, p[1] + 1)));
  // the closed circuit keeps its field inside the loop's right corner; the open circuit reaches beyond the loop
  assert.ok(reach(0) < reach(3));
  assert.ok(reach(1) < reach(3));
});

test('bounds hold every shape, field lines included', () => {
  const b = logic.bounds();
  for (const n of range()) {
    const g = logic.geometry(n);
    for (const p of [].concat(...g.wires, ...g.plates, ...g.field)) {
      assert.ok(p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3], `n = ${n}: ${p}`);
    }
  }
});

test('bezier: 17 points, both ends exact', () => {
  const pts = logic.bezier([0, 0], [0, 1], [1, 1], [1, 0]);
  assert.equal(pts.length, 17);
  assert.deepEqual(pts[0], [0, 0]);
  assert.deepEqual(pts[16], [1, 0]);
  assert.ok(close(pts[8][0], 0.5) && close(pts[8][1], 0.75));
});

// ── generic checks every sim keeps ──

test('state and geometry are JSON-safe at every step', () => {
  for (const n of range()) {
    const s = at({ flip: true }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    const g = logic.geometry(n);
    assert.deepEqual(JSON.parse(JSON.stringify(g)), g);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ flip: true });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s1 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders; a caption and a capacitor line for every step', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
  for (const lang of ['hr', 'en']) {
    for (const n of range()) {
      assert.ok(strings[lang]['caption' + n], `${lang}: caption${n}`);
      assert.ok(strings[lang]['cap' + n], `${lang}: cap${n}`);
    }
  }
});

test('every preset is valid for the model, and the page meta matches the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'stepper');
  assert.equal(meta.steps, logic.steps);
  assert.ok(logic.steps <= 20);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.ok(p.step >= 0 && p.step <= logic.steps, `preset ${p.id}: step`);
  }
});
