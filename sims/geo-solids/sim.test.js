// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for geo-solids's model: SPEC.md, rules 1–14, tie-breaks first. Run: node --test sims/geo-solids/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const G = logic.solids;
const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const C = (over) => logic.countState(P(over));
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
/** Seen / total of vertices, edges and surfaces from (yaw, tilt). */
const vef = (solid, yaw, tilt) => ['v', 'e', 'f'].map((show) => {
  const c = C({ solid, yaw, tilt, show });
  return [c.nSeen, c.total];
});
/** Press "next" k times; returns the params and the last result. */
function press(p, k) {
  let r = null;
  for (let i = 0; i < k; i++) { r = logic.lightNext(p); p = Object.assign({}, p, r.patch); }
  return { p, r };
}

// ── tie-breaks first ──

test('rule 3 tie-break: a face seen exactly edge-on is hidden', () => {
  // straight on, the top and the sides of a cube are edge-on: only the front is seen
  assert.deepEqual(vef('cube', 0, 0), [[4, 8], [4, 12], [1, 6]]);
  // turned a quarter: the right face alone
  const sn = G.seen(G.geom('cube'), 90, 0);
  assert.deepEqual(logic.FACE_IDS.filter((_, i) => sn.f[i]), ['right']);
  // a cylinder seen from the side: both circles edge-on, only the curved surface
  assert.deepEqual(vef('cylinder', 0, 0)[2], [1, 3]);
});

test('rule 4 tie-break: the next lit is the first seen one not lit, and only then the first hidden one', () => {
  const p = P({ solid: 'cube', show: 'v' });
  const order = [];
  let q = p;
  for (let i = 0; i < 8; i++) {
    const r = logic.lightNext(q);
    order.push([r.idx, r.hidden]);
    q = Object.assign({}, q, r.patch);
  }
  // vertex 4 (bottom, back left) is the one behind from (30°, 20°); the others in their fixed order
  assert.deepEqual(order.map((x) => x[0]), [0, 1, 2, 3, 5, 6, 7, 4]);
  assert.deepEqual(order.map((x) => x[1]), [false, false, false, false, false, false, false, true]);
  // with nothing seen, the fixed order alone; a lit one is skipped
  assert.equal(G.next([false, false, false], []), 0);
  assert.equal(G.next([false, false, false], [0]), 1);
  assert.equal(G.next([false, true, true], [1]), 2);
  assert.equal(G.next([true, true], [0, 1]), -1);
});

test('rule 4: a click lights an item or puts it out, keeping the order of the others', () => {
  const p = P({ solid: 'cube', show: 'e', lit: G.encode([3, 7, 1]) });
  assert.deepEqual(C(Object.assign({}, p, logic.toggle(p, 7))).lit, [3, 1]);
  assert.deepEqual(C(Object.assign({}, p, logic.toggle(p, 0))).lit, [3, 7, 1, 0]);
  // an index out of range changes nothing
  assert.deepEqual(C(Object.assign({}, p, logic.toggle(p, 12))).lit, [3, 7, 1]);
  assert.deepEqual(C(Object.assign({}, p, logic.toggle(p, -1))).lit, [3, 7, 1]);
});

test('rule 4: refused when everything is lit (all) or there is nothing of that kind (none)', () => {
  const { p } = press(P({ solid: 'pyramid', show: 'v' }), 5);
  assert.equal(C(p).done, true);
  assert.deepEqual(logic.lightNext(p), { patch: {}, refused: 'all', idx: -1 });
  for (const [solid, show] of [['cylinder', 'v'], ['cylinder', 'e'], ['cone', 'e'], ['sphere', 'v'], ['sphere', 'e']]) {
    assert.equal(logic.lightNext(P({ solid, show })).refused, 'none', solid + show);
  }
  assert.equal(logic.lightNext(P({ solid: 'cone', show: 'v' })).refused, null);
});

test('rule 4: the lit order is stored as Σ (i + 1) · 13^k and read back; bad digits and repeats are dropped', () => {
  assert.equal(G.encode([0, 1, 2]), 534);
  assert.deepEqual(G.decode(534, 8), [0, 1, 2]);
  const all = [11, 0, 5, 3, 9, 1, 2, 4, 6, 7, 8, 10];
  assert.deepEqual(G.decode(G.encode(all), 12), all);
  assert.ok(G.encode(all) <= logic.LIT_MAX);
  // index 9 does not exist for a pyramid's 5 vertices; a zero digit and a repeat are skipped
  assert.deepEqual(G.decode(G.encode([1, 9, 2]), 5), [1, 2]);
  assert.deepEqual(G.decode(1 + 0 * 13 + 3 * 169, 8), [0, 2]);
  assert.deepEqual(G.decode(G.encode([2, 2, 4]), 8), [2, 4]);
  for (const bad of [-5, NaN, 'x', Infinity]) assert.deepEqual(G.decode(bad, 8), []);
});

// ── rule 1: clean params ──

test('rule 1: unknown choices fall back, yaw is read mod 360, tilt and open are clamped, a net takes a box', () => {
  const q = logic.clean({ mode: 'x', solid: 'tetra', show: 'z', yaw: -30, tilt: 200, open: -4 });
  assert.deepEqual([q.mode, q.solid, q.show, q.yaw, q.tilt, q.open], ['count', 'cube', 'v', 330, 90, 0]);
  assert.equal(logic.clean({ yaw: 390 }).yaw, 30);
  assert.equal(logic.clean({ yaw: 359.6 }).yaw, 0);
  assert.equal(logic.clean({ tilt: -120 }).tilt, -90);
  assert.equal(logic.clean({ open: 150 }).open, 100);
  // missing or not a number: the default
  const d = logic.clean({ yaw: 'abc', tilt: null, open: '' });
  assert.deepEqual([d.yaw, d.tilt, d.open], [30, 20, 0]);
  assert.equal(logic.clean({ tilt: true }).tilt, 20);
  // net: only the cube, the cuboid and the sugar unfold
  assert.equal(logic.clean({ mode: 'net', solid: 'pyramid' }).solid, 'cube');
  assert.equal(logic.clean({ mode: 'net', solid: 'sugar' }).solid, 'sugar');
  assert.equal(logic.clean({ mode: 'count', solid: 'sphere' }).solid, 'sphere');
  assert.equal(logic.clean({ see: 'no' }).see, true);
  assert.equal(logic.clean({ see: false }).see, false);
  assert.equal(logic.clean({ hide: 'true' }).hide, false);
});

// ── rule 2: the view ──

test('rule 2: a bigger yaw brings the right side to the front, a bigger tilt shows the top', () => {
  const r = G.turn([1, 0, 0], 90, 0);
  near(r[0], 0); near(r[1], 0); near(r[2], 1);
  const f = G.turn([0, 0, 1], 90, 0);
  near(f[0], -1); near(f[2], 0);
  const top = G.turn([0, 1, 0], 0, 90);
  near(top[1], 0); near(top[2], 1);
  const both = G.turn([1, 2, 3], 30, 20);
  // a turn keeps lengths
  near(Math.hypot(...both), Math.hypot(1, 2, 3));
});

// ── rule 3: seen or hidden ──

test('rule 3: seen counts from SPEC, checked by an independent script', () => {
  assert.deepEqual(vef('cube', 30, 20), [[7, 8], [9, 12], [3, 6]]);
  assert.deepEqual(vef('cube', 45, 0), [[6, 8], [7, 12], [2, 6]]);
  assert.deepEqual(vef('cube', 30, -20), [[7, 8], [9, 12], [3, 6]]);
  assert.deepEqual(vef('cuboid', 30, 20), [[7, 8], [9, 12], [3, 6]]);
  assert.deepEqual(vef('sugar', 30, 20), [[7, 8], [9, 12], [3, 6]]);
  assert.deepEqual(vef('pyramid', 30, 20), [[4, 5], [5, 8], [2, 5]]);
  assert.deepEqual(vef('pyramid', 30, 70), [[5, 5], [8, 8], [4, 5]]);
  assert.deepEqual(vef('cylinder', 30, 20), [[0, 0], [0, 0], [2, 3]]);
  assert.deepEqual(vef('cone', 30, 20), [[1, 1], [0, 0], [1, 2]]);
  assert.deepEqual(vef('sphere', 30, 20), [[0, 0], [0, 0], [1, 1]]);
  // which cube faces: front, right, top from above; bottom, front, right from below
  const name = (y, t) => { const sn = G.seen(G.geom('cube'), y, t); return logic.FACE_IDS.filter((_, i) => sn.f[i]); };
  assert.deepEqual(name(30, 20), ['front', 'right', 'top']);
  assert.deepEqual(name(30, -20), ['bottom', 'front', 'right']);
  // the pyramid from above: the four triangles, not the square
  const pyr = G.seen(G.geom('pyramid'), 30, 70);
  assert.deepEqual(pyr.f, [false, true, true, true, true]);
});

test('rule 3: the cone\'s vertex is seen from every view that shows its curved surface', () => {
  for (let tilt = -90; tilt <= 90; tilt += 5) {
    for (let yaw = 0; yaw < 360; yaw += 45) {
      const sn = G.seen(G.geom('cone'), yaw, tilt);
      if (sn.f[1]) assert.equal(sn.v[0], true, `${yaw} ${tilt}`);
    }
  }
});

test('rule 3: every face of every solid is wound outwards', () => {
  for (const id of logic.SOLID_IDS) {
    const g = G.geom(id);
    for (const f of g.faces) {
      const c = [0, 1, 2].map((k) => f.ids.reduce((a, i) => a + g.pts[i][k], 0) / f.ids.length);
      const d = f.n[0] * c[0] + f.n[1] * c[1] + f.n[2] * c[2];
      assert.ok(d > 0, `${id} ${f.ids.join(',')}`);
    }
  }
});

// ── rule 5: the count, and counting only what is seen ──

test('rule 5: "only what is seen" is named while exactly the seen ones are lit and a hidden one is not', () => {
  const v = P({ solid: 'cube', show: 'v' });
  assert.equal(C(press(v, 6).p).onlySeen, false);
  assert.equal(C(press(v, 7).p).onlySeen, true);
  const all = C(press(v, 8).p);
  assert.deepEqual([all.onlySeen, all.done, all.n, all.total], [false, true, 8, 8]);
  const e = P({ solid: 'cube', show: 'e' });
  assert.equal(C(press(e, 9).p).onlySeen, true);
  // a hidden one lit: no longer the mistake, though two hidden ones are left
  const ten = C(press(e, 10).p);
  assert.deepEqual([ten.onlySeen, ten.total - ten.n], [false, 2]);
  // the seen ones lit by clicking a hidden one first and then the seen ones: not the mistake
  const mixed = C(P({ solid: 'cube', show: 'v', lit: G.encode([4, 0, 1, 2, 3, 5, 6]) }));
  assert.equal(mixed.onlySeen, false);
  // nothing seen to count (all hidden): never the mistake
  assert.equal(C(P({ solid: 'cylinder', show: 'e' })).onlySeen, false);
});

// ── rules 6–8: edges are segments, surfaces flat or curved, flat surfaces are shapes ──

test('rule 6: a cylinder and a cone have no edges, only rims; vertices: cone 1, cylinder and sphere none', () => {
  const t = (solid) => { const c = C({ solid }); return [c.counts.v, c.counts.e, c.rims]; };
  assert.deepEqual(t('cylinder'), [0, 0, 2]);
  assert.deepEqual(t('cone'), [1, 0, 1]);
  assert.deepEqual(t('sphere'), [0, 0, 0]);
  assert.deepEqual(t('cube'), [8, 12, 0]);
  assert.deepEqual(t('pyramid'), [5, 8, 0]);
  assert.equal(C({ solid: 'cylinder', show: 'e' }).rimNotEdge, true);
  assert.equal(C({ solid: 'cylinder', show: 'v' }).rimNotEdge, false);
  assert.equal(C({ solid: 'sphere', show: 'e' }).rimNotEdge, false);
});

test('rule 7: surfaces are counted flat and curved alike', () => {
  const t = (solid) => { const c = C({ solid, show: 'f' }); return [c.total, c.flat, c.curved]; };
  assert.deepEqual(t('cube'), [6, 6, 0]);
  assert.deepEqual(t('pyramid'), [5, 5, 0]);
  assert.deepEqual(t('cylinder'), [3, 2, 1]);
  assert.deepEqual(t('cone'), [2, 1, 1]);
  assert.deepEqual(t('sphere'), [1, 0, 1]);
});

test('rule 8: a flat surface is a square, a rectangle, a triangle or a circle', () => {
  assert.deepEqual(C({ solid: 'cube' }).shapes, { square: 6 });
  assert.deepEqual(C({ solid: 'cuboid' }).shapes, { rectangle: 6 });
  assert.deepEqual(C({ solid: 'pyramid' }).shapes, { square: 1, triangle: 4 });
  assert.deepEqual(C({ solid: 'sugar' }).shapes, { square: 2, rectangle: 4 });
  assert.deepEqual(C({ solid: 'cylinder' }).shapes, { circle: 2 });
  assert.deepEqual(C({ solid: 'cone' }).shapes, { circle: 1 });
  assert.deepEqual(C({ solid: 'sphere' }).shapes, {});
  assert.deepEqual(C({ solid: 'cylinder' }).groupShapes, ['circle', 'circle', null]);
  // sides equal within 1e-9 make a square
  assert.equal(G.shapeOf([[0, 0, 0], [1, 0, 0], [1, 1 + 1e-12, 0], [0, 1, 0]]), 'square');
  assert.equal(G.shapeOf([[0, 0, 0], [1, 0, 0], [1, 1.001, 0], [0, 1.001, 0]]), 'rectangle');
});

// ── rule 9: turning ──

test('rule 9: turning by 30° wraps round', () => {
  assert.deepEqual(logic.turnBy(P({ yaw: 330 }), 30), { yaw: 0 });
  assert.deepEqual(logic.turnBy(P({ yaw: 0 }), -30), { yaw: 330 });
  assert.equal(logic.TURN, 30);
  // turning keeps the lit ones
  const p = P({ solid: 'cube', show: 'v', lit: G.encode([0, 1]) });
  assert.deepEqual(C(Object.assign({}, p, logic.turnBy(p, 30))).lit, [0, 1]);
});

// ── rules 10–12: unfolding, the net, a cube is a cuboid ──

test('rule 10: closed, the faces are the box; open, they all lie on the table as the net', () => {
  for (const id of logic.NET_IDS) {
    const box = logic.SOLIDS[id].box, [a, b, c] = box;
    const closed = G.unfold(box, 0);
    for (const f of logic.FACE_IDS) {
      const ctr = [0, 1, 2].map((k) => closed[f].reduce((s, p) => s + p[k], 0) / 4);
      const n = G.normal(closed[f]);
      assert.ok(n[0] * ctr[0] + n[1] * ctr[1] + n[2] * ctr[2] > 0, `${id} ${f} outwards`);
    }
    near(closed.front[0][2], b / 2); near(closed.top[0][1], c / 2); near(closed.right[0][0], a / 2);
    const flat = G.unfold(box, 100), net = G.net(box);
    for (const f of logic.FACE_IDS) {
      for (const p of flat[f]) near(p[1], -c / 2, 1e-9);
      const xs = flat[f].map((p) => p[0]), zs = flat[f].map((p) => p[2]);
      const r = net[f];
      near(Math.min(...xs), r[0], 1e-9); near(Math.min(...zs), r[1], 1e-9);
      near(Math.max(...xs), r[2], 1e-9); near(Math.max(...zs), r[3], 1e-9);
    }
  }
  // halfway, the bottom stays and the top turns twice as far as the back
  const half = G.unfold([4, 4, 4], 50);
  assert.deepEqual(half.bottom, G.unfold([4, 4, 4], 0).bottom);
});

test('rule 10: Open goes to the next quarter and is refused when flat', () => {
  assert.deepEqual(logic.openMore(P({ open: 0 })), { patch: { open: 25 }, refused: null });
  assert.deepEqual(logic.openMore(P({ open: 30 })), { patch: { open: 50 }, refused: null });
  assert.deepEqual(logic.openMore(P({ open: 75 })), { patch: { open: 100 }, refused: null });
  assert.deepEqual(logic.openMore(P({ open: 100 })), { patch: {}, refused: 'open' });
  assert.equal(logic.OPEN_STEP, 25);
});

test('rule 11: the net\'s faces and size', () => {
  const sizes = (solid) => S({ mode: 'net', solid }).faces.map((f) => f.w + 'x' + f.h);
  assert.deepEqual(sizes('cube'), ['4x4', '4x4', '4x4', '4x4', '4x4', '4x4']);
  assert.deepEqual(sizes('cuboid'), ['6x3', '6x4', '4x3', '6x4', '4x3', '6x3']);
  assert.deepEqual(sizes('sugar'), ['16x16', '16x11', '16x11', '16x11', '16x11', '16x16']);
  const n = (solid) => { const s = S({ mode: 'net', solid }); return [s.squares, s.rectangles, s.netSize]; };
  assert.deepEqual(n('cube'), [6, 0, [12, 16]]);
  assert.deepEqual(n('cuboid'), [0, 6, [14, 14]]);
  assert.deepEqual(n('sugar'), [2, 4, [38, 54]]);
  assert.equal(S({ mode: 'net', solid: 'sugar' }).unit, 'mm');
  assert.equal(S({ mode: 'net', solid: 'cube' }).unit, 'cm');
  // the faces add up to the box's surface: 96 cm², 108 cm², 1216 mm²
  const area = (solid) => S({ mode: 'net', solid }).faces.reduce((a, f) => a + f.w * f.h, 0);
  assert.deepEqual(['cube', 'cuboid', 'sugar'].map(area), [96, 108, 1216]);
});

test('rule 12: a cube is a cuboid with all edges equal; the sugar "cube" is a cuboid', () => {
  assert.equal(G.kindOf([4, 4, 4]), 'cube');
  assert.equal(G.kindOf([16, 16, 11]), 'cuboid');
  assert.equal(G.kindOf([4, 4, 4.0001]), 'cuboid');
  assert.deepEqual(G.edgeGroups([4, 4, 4]), [{ len: 4, n: 12 }]);
  assert.deepEqual(G.edgeGroups([6, 3, 4]), [{ len: 6, n: 4 }, { len: 4, n: 4 }, { len: 3, n: 4 }]);
  assert.deepEqual(G.edgeGroups([16, 16, 11]), [{ len: 16, n: 8 }, { len: 11, n: 4 }]);
  assert.equal(S({ solid: 'sugar' }).sugar, true);
  assert.equal(S({ solid: 'sugar' }).kind, 'cuboid');
  assert.equal(S({ mode: 'net', solid: 'sugar' }).sugar, true);
  assert.equal(S({ solid: 'cube' }).sugar, false);
  assert.equal(S({ solid: 'pyramid' }).kind, undefined);
});

// ── rules 13–14: ask first, typical mistakes ──

test('rule 14: the pyramid\'s four triangles without its square', () => {
  const p = P({ solid: 'pyramid', show: 'f', tilt: 70 });
  const four = C(press(p, 4).p);
  assert.deepEqual([four.forgotBase, four.onlySeen, four.n], [true, true, 4]);
  assert.equal(C(press(p, 5).p).forgotBase, false);
  // three triangles lit: not yet
  assert.equal(C(press(p, 3).p).forgotBase, false);
  // from the side (30°, 20°), the square is still the last
  const side = P({ solid: 'pyramid', show: 'f', lit: G.encode([1, 2, 3, 4]) });
  assert.equal(C(side).forgotBase, true);
  assert.equal(C(Object.assign({}, side, { show: 'e' })).forgotBase, false);
});

test('rule 13: ask first is carried in the state', () => {
  assert.equal(S({ hide: true }).hide, true);
  assert.equal(S({ mode: 'net', hide: true }).hide, true);
  assert.equal(S({}).hide, false);
});

// ── presets ──

test('presets: the expected numbers of SPEC', () => {
  const pr = Object.fromEntries(logic.PRESETS.map((x) => [x.id, P(x.params)]));
  const seen = C(pr.seen);
  assert.deepEqual([seen.nSeen, seen.total, seen.see], [7, 8, false]);
  const r7 = press(pr.seen, 7);
  assert.equal(C(r7.p).onlySeen, true);
  assert.equal(logic.lightNext(r7.p).hidden, true);
  const ed = C(pr.edges);
  assert.deepEqual([ed.nSeen, ed.nHidden, ed.total], [9, 3, 12]);
  const py = C(pr.pyramid);
  assert.deepEqual([py.nSeen, py.total, py.seen[0]], [4, 5, false]);
  assert.equal(logic.lightNext(pr.cylinder).refused, 'none');
  assert.equal(C(pr.cylinder).rims, 2);
  const sp = C(pr.sphere);
  assert.deepEqual([sp.total, sp.curved], [1, 1]);
  // the sphere looks the same from every side: seen counts do not change
  for (const yaw of [0, 90, 200]) assert.equal(C(Object.assign({}, pr.sphere, { yaw })).nSeen, 1);
  let q = pr.net;
  for (let i = 0; i < 4; i++) q = Object.assign({}, q, logic.openMore(q).patch);
  const nt = S(q);
  assert.deepEqual([nt.flat, nt.squares, nt.kind], [true, 6, 'cube']);
  const cn = S(pr['cuboid-net']);
  assert.deepEqual([cn.flat, cn.rectangles, cn.kind], [true, 6, 'cuboid']);
  const sg = S(pr.sugar);
  assert.deepEqual([sg.flat, sg.squares, sg.rectangles, sg.kind, sg.hide], [false, 2, 4, 'cuboid', true]);
  for (const id of ['seen', 'pyramid', 'sugar']) assert.equal(pr[id].hide, true, id);
  for (const id of ['edges', 'cylinder', 'sphere', 'net', 'cuboid-net']) assert.equal(pr[id].hide, false, id);
  assert.ok(logic.PRESETS.length <= 9);
});

// ── gaps found by the fresh review's mutants ──

test('rule 3: an edge is seen only through a seen face, not because both its ends are seen', () => {
  // from below the pyramid's square is seen, so all 5 vertices are, but one slanted edge lies behind
  assert.deepEqual(vef('pyramid', 30, -20), [[5, 5], [7, 8], [3, 5]]);
});

test('rule 5: nothing of this kind seen is never the mistake; nothing to count is never done', () => {
  // the cone from straight below: its vertex is hidden behind the base
  const c = C({ solid: 'cone', show: 'v', tilt: -90 });
  assert.deepEqual([c.nSeen, c.total, c.onlySeen], [0, 1, false]);
  assert.equal(C({ solid: 'cylinder', show: 'v' }).done, false);
  assert.equal(C({ solid: 'sphere', show: 'e' }).done, false);
});

test('rule 1 and 4: numbers are rounded; decode keeps the last valid index', () => {
  assert.equal(logic.clean({ open: 33.4 }).open, 33);
  assert.equal(logic.clean({ tilt: 12.6 }).tilt, 13);
  assert.equal(logic.clean({ yaw: '' }).yaw, 30);
  assert.equal(logic.clean({ yaw: true }).yaw, 30);
  assert.deepEqual(G.decode(G.encode([7]), 8), [7]);
  assert.deepEqual(G.decode(G.encode([8]), 8), []);
  assert.deepEqual(logic.openMore(P({ open: 40 })), { patch: { open: 50 }, refused: null });
  assert.equal(S({ mode: 'net', open: 75 }).flat, false);
  assert.equal(S({ mode: 'net', open: 100 }).flat, true);
});

test('defaults and the fixed order of items (SPEC rule 4)', () => {
  assert.deepEqual(logic.defaults, { mode: 'count', solid: 'cube', show: 'v', lit: 0, yaw: 30, tilt: 20, see: true, open: 0, hide: false });
  const box = G.geom('cube');
  // vertices: the top four, then the bottom four
  assert.ok(box.verts.slice(0, 4).every((i) => box.pts[i][1] > 0) && box.verts.slice(4).every((i) => box.pts[i][1] < 0));
  // edges: top, bottom, upright
  const ys = (e) => [box.pts[e[0]][1], box.pts[e[1]][1]];
  assert.ok(box.edges.slice(0, 4).every((e) => ys(e).every((y) => y > 0)));
  assert.ok(box.edges.slice(4, 8).every((e) => ys(e).every((y) => y < 0)));
  assert.ok(box.edges.slice(8).every((e) => ys(e)[0] > 0 && ys(e)[1] < 0));
  const pyr = G.geom('pyramid');
  // the apex first, then the base; the base's edges, then the slanted ones
  assert.ok(pyr.pts[pyr.verts[0]][1] > 0 && pyr.verts.slice(1).every((i) => pyr.pts[i][1] < 0));
  assert.ok(pyr.edges.slice(0, 4).every((e) => pyr.pts[e[0]][1] < 0 && pyr.pts[e[1]][1] < 0));
  assert.ok(pyr.edges.slice(4).every((e) => e.includes(4)));
  // surfaces: the flat ones first, the curved one last
  assert.deepEqual(G.geom('cylinder').groups.map((g) => g.flat), [true, true, false]);
  assert.deepEqual(G.geom('cone').groups.map((g) => g.flat), [true, false]);
});

test('the sizes of SPEC\'s Solids table', () => {
  const ext = (id) => {
    const p = G.geom(id).pts;
    return [0, 1, 2].map((k) => Math.max(...p.map((q) => q[k])) - Math.min(...p.map((q) => q[k])));
  };
  const r = (a) => a.map((x) => Math.round(x * 1000) / 1000);
  assert.deepEqual(r(ext('cube')), [4, 4, 4]);
  assert.deepEqual(r(ext('cuboid')), [6, 4, 3]);
  assert.deepEqual(r(ext('sugar')), [16, 11, 16]);
  assert.deepEqual(r(ext('pyramid')), [5, 5, 5]);
  assert.deepEqual(r(ext('cylinder')), [5, 5, 5]);
  assert.deepEqual(r(ext('cone')), [5, 5.5, 5]);
  assert.deepEqual(r(ext('sphere')), [6, 6, 6]);
  assert.equal(G.geom('cylinder').rims[0].length, 48);
  assert.equal(G.geom('cone').pts[48][1], 2.75);
  assert.equal(logic.PRESETS.find((x) => x.id === 'net').params.tilt, 35);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe in every mode and preset', () => {
  for (const pr of logic.PRESETS) {
    const s = logic.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  for (const id of logic.SOLID_IDS) for (const show of logic.SHOWS) {
    const s = S({ solid: id, show });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params), copy = structuredClone(p);
    assert.deepEqual(logic.initial(p), logic.initial(p));
    logic.lightNext(p); logic.toggle(p, 0); logic.turnBy(p, 30); logic.openMore(p);
    assert.deepEqual(p, copy);
  }
});

test('an explorer: no steps', () => {
  assert.equal(logic.steps, undefined);
  assert.equal(kit.stepsOf(logic, P()), 0);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
  for (const lang of ['hr', 'en']) {
    const T = strings[lang];
    for (const id of logic.SOLID_IDS) assert.ok(T['s_' + id], id);
    for (const k of ['square', 'rectangle', 'triangle', 'circle']) assert.ok(T['sh_' + k] && T['shN_' + k], k);
    for (const k of logic.SHOWS) assert.ok(T['show_' + k], k);
    for (const k of ['v', 'e', 'face', 'surf', 'face_acc', 'surf_acc']) assert.ok(Array.isArray(T['n_' + k]), k);
    for (const k of logic.NET_IDS) assert.ok(T['netSay_' + k] && T['cNetFlat_' + k] && T['cNetFlatC_' + k], k);
    for (const pr of logic.PRESETS) {
      const k = pr.id.replace('-', '_');
      assert.ok(T['p_' + k] && T['ph_' + k], pr.id);
    }
  }
});

test('every preset param is a model param; the page and sim.json agree with the model', () => {
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  const ids = logic.PRESETS.map((x) => x.id);
  for (const e of sim.entries) assert.ok(ids.includes(e.preset), e.preset);
});
