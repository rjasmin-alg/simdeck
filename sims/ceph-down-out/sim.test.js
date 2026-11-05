// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ceph-down-out's model (SPEC.md). Run: node --test sims/ceph-down-out/
// Tie-breaks first, then one test per rule, then every preset's numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const steps = (over) => logic.steps(P(over));
const last = (over) => at(over, steps(over));
const kinds = (over) => logic.norm(P(over)).events.map((e) => e.kind);
const GiB = 1024 ** 3;
const X = (over) => Object.assign({ action: 'stop', grace: 20, downOut: 600, noout: false, returnAt: Infinity, full: 14843 }, over);

// ── tie-breaks ──

test('tie-break: a return at the moment the timer fires wins (never marked out)', () => {
  const ev = logic.timeline(X({ returnAt: 620 })).map((e) => e.kind);
  assert.deepEqual(ev, ['stop', 'down', 'return', 'clean']);
  assert.deepEqual(logic.timeline(X({ returnAt: 621 })).map((e) => e.kind).slice(0, 5), ['stop', 'down', 'wait', 'out', 'moving']);
});

test('tie-break: a progress mark at or after the return is dropped; none left gives a "moving" step at the midpoint', () => {
  const ev = logic.timeline(X({ returnAt: 620 + 0.25 * 14843 }));      // the 25 % mark falls on the return
  assert.deepEqual(ev.map((e) => e.kind), ['stop', 'down', 'wait', 'out', 'moving', 'return', 'clean']);
  assert.equal(ev[4].t, (620 + 620 + 0.25 * 14843) / 2);
  const ev2 = logic.timeline(X({ returnAt: 620 + 0.25 * 14843 + 1 }));
  assert.deepEqual(ev2.map((e) => e.kind), ['stop', 'down', 'wait', 'out', 'progress', 'return', 'clean']);
});

test('tie-break: recovery before backfill, then PG order (rule 4)', () => {
  const items = logic.sortItems([
    { pg: 5, kind: 'backfill' }, { pg: 9, kind: 'recovery' }, { pg: 1, kind: 'backfill' }, { pg: 3, kind: 'recovery' }
  ]);
  assert.deepEqual(items.map((i) => [i.kind, i.pg]), [['recovery', 3], ['recovery', 9], ['backfill', 1], ['backfill', 5]]);
  // a return after part of the recovery: the PGs not yet rebuilt catch up first, the rebuilt ones are copied back after
  const p = { downOut: 60, rateMBs: 500, dataTiB: 0.5, returnAt: 900 };
  const s = at(p, kinds(p).indexOf('return') + 1);
  const ks = s.plan.items.map((i) => i.kind);
  const firstBack = ks.indexOf('backfill');
  assert.ok(firstBack > 0 && ks.slice(firstBack).every((k) => k === 'backfill'), ks.join());
  assert.deepEqual(s.plan.items.slice(0, firstBack).map((i) => i.pg), s.plan.items.slice(0, firstBack).map((i) => i.pg).sort((a, b) => a - b));
});

test('tie-break: one item at a time; an item is done only when the bytes cover it and every one before it', () => {
  const plan = { moved: 2.5, items: [{ bytes: 1 }, { bytes: 1 }, { bytes: 1 }, { bytes: 1 }] };
  assert.deepEqual(logic.progressOf(plan).map((p) => p.st), ['done', 'done', 'moving', 'queued']);
  assert.equal(logic.progressOf(plan)[2].f, 0.5);
  assert.deepEqual(logic.progressOf({ moved: 2, items: [{ bytes: 1 }, { bytes: 1 }, { bytes: 1 }] }).map((p) => p.st), ['done', 'done', 'queued']);
  // 25 % of 30 equal items: 7 done (7.5 covered), not 8
  assert.equal(at({}, 5).counts.degraded, 23);
});

test('tie-break: the zoom shows 6 of osd.0\'s PGs spread over the queue, in PG order, fixed for the run', () => {
  const on = logic.subjectPgs();
  assert.equal(on.length, 30);
  const z = at({}, 0).zoom;
  assert.equal(z.length, logic.ZOOM);
  assert.deepEqual(z, [0, 5, 10, 15, 20, 25].map((k) => on[k]));
  assert.deepEqual(at({}, 7).zoom, z);
});

// ── rules ──

test('rule 1: a stopped OSD stays marked up for the grace period, then is marked down (20 s)', () => {
  const s1 = at({}, 1), s2 = at({}, 2);
  assert.equal(s1.ev.kind, 'stop');
  assert.deepEqual(s1.osd[0], { run: false, up: true, in: true, downSince: null });
  assert.deepEqual(s1.counts, { clean: 128, degraded: 0, misplaced: 0 });
  assert.equal(s1.timers.grace.state, 'running');
  assert.equal(s2.t, 20);
  assert.equal(s2.osd[0].up, false);
  assert.equal(s2.osd[0].downSince, 20);
  assert.equal(s2.timers.grace.state, 'expired');
});

test('rule 2: down but in: its PGs are degraded, CRUSH still maps to it, nothing moves', () => {
  for (const n of [2, 3]) {
    const s = at({}, n);
    assert.equal(s.osd[0].in, true);
    assert.equal(s.counts.degraded, 30);
    assert.equal(s.plan, null);
    assert.equal(s.totals.moved, 0);
  }
  assert.equal(at({}, 3).ev.kind, 'wait');
  assert.equal(at({}, 3).t, 320);
  assert.equal(logic.pgGroup({ run: false, up: false, in: true }, null, null), 'degraded');
  // every degraded PG is one with a copy on osd.0, and CRUSH's set for it (osd.0 in) still holds osd.0
  const s = at({}, 2);
  s.pgs.forEach((g, pg) => assert.equal(g === 'degraded', logic.inSet(pg).includes(0)));
});

test('rule 3: after the down→out interval it is marked out and its PGs are remapped; recovery starts', () => {
  const s = at({}, 4);
  assert.equal(s.ev.kind, 'out');
  assert.equal(s.t, 620);
  assert.equal(s.osd[0].in, false);
  assert.equal(s.timers.downOut.state, 'expired');
  assert.equal(s.plan.items.length, 30);
  for (const it of s.plan.items) {
    assert.ok(!logic.outSet(it.pg).includes(0), 'CRUSH no longer picks osd.0');
    assert.ok(logic.outSet(it.pg).includes(it.to));
    assert.ok(!logic.inSet(it.pg).includes(it.to), 'the target is a new OSD for the PG');
  }
  assert.equal(at({ downOut: 60 }, 4).t, 80);
  assert.equal(at({ downOut: 1800 }, 4).t, 1820);
});

test('rule 3: CRUSH with osd.0 out moves only osd.0\'s copies, one per PG; every set on three hosts', () => {
  for (let pg = 0; pg < logic.PG_NUM; pg++) {
    const a = logic.inSet(pg), b = logic.outSet(pg);
    assert.equal(new Set(a.map(logic.hostOf)).size, 3);
    assert.equal(new Set(b.map(logic.hostOf)).size, 3);
    if (!a.includes(0)) assert.deepEqual(b, a);
    else {
      assert.equal(b.filter((x) => !a.includes(x)).length, 1);
      assert.deepEqual(a.filter((x) => x !== 0).every((x) => b.includes(x)), true);
    }
  }
});

test('rule 4: work for a PG short of a live copy is recovery; with all copies live it is backfill', () => {
  assert.ok(at({}, 4).plan.items.every((i) => i.kind === 'recovery'));
  assert.ok(at({ action: 'drain' }, 1).plan.items.every((i) => i.kind === 'backfill'));
  assert.equal(logic.pgGroup({ up: false, in: false }, { kind: 'recovery' }, 'queued'), 'degraded');
  assert.equal(logic.pgGroup({ up: true, in: false }, { kind: 'backfill' }, 'moving'), 'misplaced');
  assert.equal(logic.pgGroup({ up: false, in: false }, { kind: 'recovery' }, 'done'), 'clean');
});

test('rule 5: back before the timer: marked up and in, only the missed writes are copied', () => {
  const s = at({ returnAt: 300 }, 3);
  assert.equal(s.ev.kind, 'return');
  assert.deepEqual(s.osd[0], { run: true, up: true, in: true, downSince: null });
  assert.equal(s.timers.downOut.state, 'cancelled');
  assert.ok(s.plan.items.every((i) => i.kind === 'recovery' && i.log && i.to === 0));
  assert.equal(s.plan.total, 30 * logic.missedBytes(300));
  assert.equal(s.plan.total, 10e6 * 300 * 30 / 128);
  assert.equal(s.counts.degraded, 30, 'degraded until the catch-up is done');
  const c = at({ returnAt: 300 }, 4);
  assert.equal(c.counts.clean, 128);
  assert.ok(Math.abs(c.t - (300 + s.plan.total / 200e6)) < 1e-9);
});

test('rule 5: back after it was out: unfinished copies are thrown away, finished ones are copied back (data moves twice)', () => {
  const p = { downOut: 60, rateMBs: 500, dataTiB: 0.5, returnAt: 900 };
  const k = kinds(p).indexOf('return') + 1;
  const before = at(p, k - 1), s = at(p, k);
  const moved = (900 - 80) * 500e6, per = 0.5 * logic.TIB / 30;
  const done = Math.floor(moved / per);
  assert.equal(s.ev.doneBefore, done);
  assert.ok(Math.abs(s.ev.wasted - (moved - done * per)) < 1);
  assert.equal(s.plan.items.filter((i) => i.kind === 'backfill').length, done);
  assert.ok(s.plan.items.filter((i) => i.kind === 'backfill').every((i) => i.bytes === per && i.to === 0));
  assert.equal(s.counts.misplaced, done);
  assert.equal(s.counts.degraded, 30 - done);
  assert.ok(before.plan.moved < moved + 1);
});

test('rule 6: noout: the timer fires and nothing happens; degraded the whole time, 0 bytes moved', () => {
  const p = { noout: true };
  assert.deepEqual(kinds(p), ['stop', 'down', 'timer', 'later']);
  for (let n = 2; n <= steps(p); n++) {
    const s = at(p, n);
    assert.equal(s.osd[0].in, true);
    assert.equal(s.counts.degraded, 30);
    assert.equal(s.totals.moved, 0);
    assert.equal(s.timers.downOut.state, 'held');
  }
  assert.equal(at(p, 3).t, 620);
  assert.equal(at(p, 4).t, 3600);
});

test('rule 7: draining (out while up) moves data with no degraded PG: backfill only', () => {
  const p = { action: 'drain' };
  for (let n = 1; n <= steps(p); n++) assert.equal(at(p, n).counts.degraded, 0);
  assert.deepEqual(at(p, 1).counts, { clean: 98, degraded: 0, misplaced: 30 });
  assert.deepEqual(at(p, 1).osd[0], { run: true, up: true, in: false, downSince: null });
  const end = last(p);
  assert.equal(end.ev.kind, 'stopEmpty');
  assert.equal(end.osd[0].up, false);
  assert.deepEqual(end.counts, { clean: 128, degraded: 0, misplaced: 0 });
  assert.equal(end.ev.changed.length, 0, 'stopping the empty OSD changes no PG');
});

test('rule 8: time = bytes / rate; the progress steps at 25, 50 and 100 %', () => {
  const s = at({}, 4), full = 2.7 * logic.TIB / 200e6;
  assert.ok(Math.abs(s.plan.total - 2.7 * logic.TIB) < 1);
  assert.deepEqual([5, 6, 7].map((n) => at({}, n).t), [620 + 0.25 * full, 620 + 0.5 * full, 620 + full]);
  assert.deepEqual([5, 6, 7].map((n) => at({}, n).plan.moved / s.plan.total), [0.25, 0.5, 1]);
  assert.ok(Math.abs(full / 3600 - 4.12) < 0.01, 'about 4.1 h');
  assert.ok(Math.abs(2.7 * logic.TIB / 500e6 / 3600 - 1.65) < 0.01);
  assert.equal(at({ rateMBs: 100 }, 7).t, 620 + 2.7 * logic.TIB / 100e6);
});

// ── the presets' numbers (SPEC.md "Presets") ──

test('dead-disk: down at 20 s, 0 bytes moving; out at 620 s; 2.7 TiB in about 4.1 h; 7 steps', () => {
  assert.deepEqual(kinds({}), ['stop', 'down', 'wait', 'out', 'progress', 'progress', 'progress']);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((n) => at({}, n).counts.degraded), [0, 30, 30, 30, 23, 15, 0]);
  assert.equal(at({}, 3).totals.moved, 0);
  assert.equal(logic.fmtTime(last({}).t), '4:17:43');
});

test('reboot: back after 5 min, never out, no rebalancing; 0.65 GiB catch-up; 4 steps', () => {
  const p = { returnAt: 300 };
  assert.deepEqual(kinds(p), ['stop', 'down', 'return', 'clean']);
  for (let n = 1; n <= 4; n++) assert.equal(at(p, n).osd[0].in, true);
  const s = last(p);
  assert.equal(s.totals.wasted, 0);
  assert.equal(s.totals.moved.toFixed(0), String(10e6 * 300 * 30 / 128));
  assert.equal((s.totals.moved / GiB).toFixed(2), '0.65');
});

test('slow-reboot: out at 620 s, back at 900 s: 52 GiB copied and thrown away; 7 steps', () => {
  const p = { returnAt: 900 };
  assert.deepEqual(kinds(p), ['stop', 'down', 'wait', 'out', 'moving', 'return', 'clean']);
  assert.equal(at(p, 5).t, 760);
  const r = at(p, 6);
  assert.equal(r.ev.movedBefore, 280 * 200e6);
  assert.equal(r.ev.doneBefore, 0);
  assert.equal((r.totals.wasted / GiB).toFixed(1), '52.2');
  assert.equal(r.osd[0].in, true);
  const s = last(p);
  assert.deepEqual(s.counts, { clean: 128, degraded: 0, misplaced: 0 });
  assert.equal((s.totals.moved / GiB).toFixed(1), '54.1');
});

test('maintenance-noout: osd.0 down for 30 min, never out, 0 bytes moved until it is back; 5 steps', () => {
  const p = { noout: true, returnAt: 1800 };
  assert.deepEqual(kinds(p), ['stop', 'down', 'timer', 'return', 'clean']);
  assert.equal(at(p, 3).totals.moved, 0);
  assert.equal(at(p, 3).counts.degraded, 30);
  assert.equal((last(p).totals.moved / GiB).toFixed(2), '3.93');
  // the same 30 min without noout: out at 620 s, 220 GiB copied by the return; 2 PGs rebuilt (copied back), the rest
  // of it (35 GiB) thrown away
  const q = { returnAt: 1800 };
  const r = at(q, kinds(q).indexOf('return') + 1);
  assert.equal(r.ev.movedBefore, 1180 * 200e6);
  assert.equal(r.ev.doneBefore, 2);
  assert.equal((r.totals.wasted / GiB).toFixed(0), '35');
});

test('drain: 5 steps, backfill of 2.7 TiB, 30 misplaced → 23 → 15 → 0, never degraded', () => {
  const p = { action: 'drain' };
  assert.deepEqual(kinds(p), ['out', 'progress', 'progress', 'progress', 'stopEmpty']);
  assert.deepEqual([1, 2, 3, 4].map((n) => at(p, n).counts.misplaced), [30, 23, 15, 0]);
  const full = 2.7 * logic.TIB / 200e6;
  assert.deepEqual([2, 3, 4, 5].map((n) => at(p, n).t), [0.25 * full, 0.5 * full, full, full + 60 + 20]);
  assert.equal(logic.fmtTime(at(p, 4).t), '4:07:23');
  const end = last(p);
  assert.deepEqual(end.osd[0], { run: false, up: false, in: false, downSince: full + 80 });
  assert.deepEqual(end.timers.grace, { start: full + 60, len: 20, state: 'expired' });
  assert.equal(end.timers.downOut.state, 'idle', 'no down→out timer in a drain');
  assert.equal(end.plan.moved, end.plan.total);
  assert.ok(Math.abs(end.totals.moved - end.plan.total) < 1, 'moved never exceeds the plan');
});

test('step counts stay within 20 for every parameter combination', () => {
  for (const action of logic.ACTIONS) for (const downOut of logic.DOWN_OUT) for (const noout of [false, true])
    for (const returnAt of logic.RETURN_AT) for (const rateMBs of logic.RATES) for (const dataTiB of [0.5, 2.7, 4]) {
      const p = P({ action, downOut, noout, returnAt, rateMBs, dataTiB });
      const n = logic.steps(p);
      assert.ok(n >= 4 && n <= 20, JSON.stringify(p));
      const s = kit.stateAt(logic, p, n);
      if (action === 'stop' && returnAt !== 'never') assert.equal(s.counts.clean, 128, JSON.stringify(p));
      // the clock never goes back
      let t = -1;
      for (let k = 1; k <= n; k++) { const x = kit.stateAt(logic, p, k).t; assert.ok(x >= t, JSON.stringify(p) + ' step ' + k); t = x; }
    }
});

test('timers: grace from the stop, down→out from the down; fired, held and cancelled', () => {
  assert.deepEqual(at({}, 1).timers.grace, { start: 0, len: 20, state: 'running' });
  assert.deepEqual(at({}, 2).timers.downOut, { start: 20, len: 600, state: 'running' });
  assert.deepEqual(at({}, 4).timers.downOut, { start: 20, len: 600, state: 'expired' });
  assert.equal(at({ noout: true }, 2).timers.downOut.state, 'held');
  assert.equal(at({ returnAt: 300 }, 3).timers.downOut.state, 'cancelled');
  // noout and a return at the moment the timer would fire: no timer step
  assert.deepEqual(logic.timeline(X({ noout: true, returnAt: 620 })).map((e) => e.kind), ['stop', 'down', 'return', 'clean']);
});

test('the plan never moves more than its total; the return counts only what moved before it', () => {
  const p = { downOut: 60, rateMBs: 500, dataTiB: 0.5, returnAt: 1800 };   // rebuilt long before the return
  const k = kinds(p).indexOf('return') + 1;
  const r = at(p, k);
  assert.ok(Math.abs(r.ev.movedBefore - 0.5 * logic.TIB) < 1);
  assert.equal(r.ev.doneBefore, 30);
  assert.equal(r.ev.wasted, 0);
  assert.ok(r.plan.items.every((i) => i.kind === 'backfill'));
  for (let n = 1; n <= steps(p); n++) { const s = at(p, n); if (s.plan) assert.ok(s.plan.moved <= s.plan.total + 1e-3); }
});

test('return items: a copy back names the OSD it comes from; a catch-up is from the log, sized from the stop', () => {
  const p = { downOut: 60, rateMBs: 500, dataTiB: 0.5, returnAt: 900 };
  const k = kinds(p).indexOf('return') + 1;
  const before = at(p, k - 1), r = at(p, k);
  for (const it of r.plan.items) {
    assert.equal(it.to, 0);
    if (it.kind === 'backfill') { assert.equal(it.log, false); assert.equal(it.from, logic.targetOf(it.pg)); }
    else { assert.equal(it.log, true); assert.equal(it.from, null); assert.equal(it.bytes, logic.missedBytes(900)); }
  }
  assert.ok(before.plan.items.length === 30);
  const slow = at({ returnAt: 900 }, 6);
  assert.equal(slow.plan.total, 30 * 10e6 * 900 / 128);
});

test('changed marks: osd.0 on every flag change, PGs whose group changed', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => at({}, n).ev.osdChanged), [false, true, false, true, false]);
  assert.equal(at({ returnAt: 300 }, 3).ev.osdChanged, true);
  assert.equal(at({ action: 'drain' }, 5).ev.osdChanged, true);
  assert.deepEqual(at({}, 2).ev.changed, logic.subjectPgs());
  assert.equal(at({}, 3).ev.changed.length, 0);
  assert.equal(at({}, 5).ev.changed.length, 7);
  assert.equal(at({ returnAt: 300 }, 4).ev.changed.length, 30);
});

test('fmtTime rounds to the second', () => {
  assert.equal(logic.fmtTime(4330.9), '1:12:11');
  assert.equal(logic.fmtTime(59.5), '0:01:00');
  assert.equal(logic.fmtTime(0), '0:00:00');
  assert.equal(logic.fmtTime(at({}, 5).t), '1:12:11');
  assert.equal(logic.fmtTime(at({}, 6).t), '2:14:02');
});

// ── generic checks every sim keeps ──

const RUNS = [{}, { returnAt: 300 }, { returnAt: 900 }, { noout: true, returnAt: 1800 }, { action: 'drain' },
  { downOut: 60, rateMBs: 500, dataTiB: 0.5, returnAt: 900 }, { noout: true }];

test('state is JSON-safe at every step', () => {
  for (const r of RUNS) {
    for (let n = 0; n <= steps(r); n++) {
      const s = at(r, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const r of RUNS) {
    const p = P(r), n = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let k = 1; k <= n; k++) { s = logic.step(s, k, p); forward.push(s); }
    for (let k = n; k >= 0; k--) assert.deepEqual(kit.stateAt(logic, p, k), forward[k]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ returnAt: 900 });
  let s = logic.initial(p);
  for (let k = 1; k <= logic.steps(p); k++) {
    const copy = structuredClone(s);
    const next = logic.step(s, k, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('unknown params fall back to the defaults', () => {
  const o = logic.norm({ action: 'x', downOut: 7, noout: 'maybe', returnAt: 5, rateMBs: 3, dataTiB: 99 });
  assert.deepEqual([o.action, o.downOut, o.noout, o.returnAt, o.rateMBs, o.dataTiB], ['stop', 600, false, 'never', 200, 2.7]);
  assert.equal(logic.norm({ returnAt: '900' }).returnAt, 900);
  assert.equal(logic.norm({ noout: 'true' }).noout, true);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model; meta steps = the first preset = the defaults', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const presets = html.slice(html.indexOf('presets: ['));
  const first = presets.match(/params:\s*\{([^}]*)\}/)[1];
  assert.equal(meta.steps, logic.steps(P(Function('return {' + first + '}')())), 'meta.steps matches the first preset');
  assert.equal(meta.steps, logic.steps(logic.defaults), 'and the defaults');
  const keys = [...presets.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(?:^|,)\s*(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, meta.steps);
});

test('placement.js is what tools/gen-placement.mjs writes from the cephsim engine (spot check)', () => {
  assert.deepEqual(logic.inSet(0), [7, 2, 10]);
  assert.deepEqual(logic.inSet(16), [5, 0, 8]);
  assert.deepEqual(logic.targetOf(16), 1);
});
