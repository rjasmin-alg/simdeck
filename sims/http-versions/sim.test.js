// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for http-versions' model (rules in SPEC.md). Run: node --test sims/http-versions/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const S = (over) => logic.initial(P(over));
const row = (st, v) => st.rows.find((r) => r.version === v);
const ends = (r) => r.objects.map((o) => o.endMs);
const conns = (r) => r.objects.map((o) => o.conn);

// ── tie-breaks first ──

test('tie-break 1: connections free at the same moment take objects lowest number first (round robin)', () => {
  const r = row(S({ objects: 12, h1conns: 6 }), 'h1');
  assert.deepEqual(conns(r), [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]);
  const r1 = row(S({ objects: 4, h1conns: 1 }), 'h1');
  assert.deepEqual(conns(r1), [1, 1, 1, 1]);
});

test('tie-break 2: a connection held up by a loss loses its turn to one that is free earlier', () => {
  const r = row(S({ rtt: 250, objects: 12, h1conns: 6, loss: true, lostObject: 1 }), 'h1');
  assert.deepEqual(conns(r), [1, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 1]);
  // a loss further down moves only the objects queued behind it on its connection
  const r2 = row(S({ rtt: 100, objects: 12, h1conns: 6, loss: true, lostObject: 3 }), 'h1');
  assert.equal(r2.objects[2].endMs, 400);
  assert.equal(r2.objects[2].conn, 3);
  assert.deepEqual(conns(r2), [1, 2, 3, 4, 5, 6, 1, 2, 4, 5, 6, 1], 'at 400 ms all six are free: the lowest takes 12');
  assert.equal(r2.objects[11].endMs, 500);
});

test('tie-break 3: never more HTTP/1.1 connections than objects', () => {
  assert.equal(row(S({ objects: 2, h1conns: 6 }), 'h1').conns, 2);
  assert.equal(row(S({ objects: 12, h1conns: 6 }), 'h1').conns, 6);
  assert.equal(row(S({ objects: 1, h1conns: 6 }), 'h1').conns, 1);
});

test('tie-break 4: the lost object is clamped to 1…objects, and none is lost with loss off', () => {
  assert.equal(logic.lostOf(P({ objects: 3, loss: true, lostObject: 9 })), 3);
  assert.equal(logic.lostOf(P({ objects: 3, loss: true, lostObject: 0 })), 1);
  assert.equal(logic.lostOf(P({ objects: 3, loss: false, lostObject: 2 })), 0);
  const st = S({ objects: 3, loss: true, lostObject: 9 });
  assert.equal(st.lost, 3);
  for (const r of st.rows) assert.deepEqual(r.objects.map((o) => o.lost), [false, false, true], r.version);
  for (const r of S({ loss: false, lostObject: 4 }).rows) assert.ok(r.objects.every((o) => !o.lost && o.blockedMs === 0), r.version);
});

test('tie-break 5: one object with loss: every version waits one round trip, nothing else to block', () => {
  const st = S({ rtt: 100, objects: 1, loss: true });
  assert.deepEqual(st.rows.map((r) => r.doneMs), [400, 400, 300]);
  assert.equal(logic.captionKey(P({ objects: 1, loss: true })), 'capLossOne');
});

test('tie-break 6: changed marks moved or new ends and done times; nothing without a previous state', () => {
  const a = S({}), b = S({ loss: true });
  const none = logic.changed(null, a);
  for (const v of logic.VERSIONS) assert.deepEqual(none[v], { objects: [], done: false, was: null });
  const same = logic.changed(a, S({}));
  for (const v of logic.VERSIONS) assert.deepEqual(same[v], { objects: [], done: false, was: a.rows[logic.VERSIONS.indexOf(v)].doneMs });
  const ch = logic.changed(a, b);
  assert.deepEqual(ch.h1.objects, [1]);
  assert.deepEqual(ch.h2.objects, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(ch.h3.objects, [1]);
  assert.deepEqual([ch.h1.done, ch.h2.done, ch.h3.done], [true, true, true]);
  assert.equal(ch.h2.was, 300);
  // more objects: the new ones count as changed, the old ones do not when their end stays
  const more = logic.changed(S({ objects: 6 }), S({ objects: 8 }));
  assert.deepEqual(more.h2.objects, [7, 8]);
  assert.equal(more.h2.done, false);
  assert.deepEqual(more.h1.objects, [7, 8]);
  assert.equal(more.h1.done, true);
});

// ── rules ──

test('rule 1: HTTP/1.1 carries one request at a time per connection, back to back', () => {
  const r = row(S({ rtt: 100, objects: 6, h1conns: 1 }), 'h1');
  assert.deepEqual(r.objects.map((o) => [o.startMs, o.endMs]), [[200, 300], [300, 400], [400, 500], [500, 600], [600, 700], [700, 800]]);
  assert.equal(r.doneMs, 800);
  const r6 = row(S({ rtt: 100, objects: 6, h1conns: 6 }), 'h1');
  assert.ok(r6.objects.every((o) => o.startMs === 200 && o.endMs === 300), 'six connections in parallel');
  assert.equal(logic.h1Depth(S({ objects: 7, h1conns: 6 })), 2);
  assert.equal(logic.h1Depth(S({ objects: 6, h1conns: 6 })), 1);
});

test('rule 2: each TCP connection costs a TCP and a TLS round trip before its first request', () => {
  for (const v of ['h1', 'h2']) {
    const r = row(S({ rtt: 70 }), v);
    assert.equal(r.setupMs, 140, v);
    assert.deepEqual(r.setup, [{ kind: 'tcp', startMs: 0, endMs: 70 }, { kind: 'tls', startMs: 70, endMs: 140 }], v);
    assert.ok(r.objects.every((o) => o.startMs >= 140), v);
  }
});

test('rule 3: HTTP/2 sends every request as a stream on one connection at once', () => {
  const r = row(S({ rtt: 100, objects: 12 }), 'h2');
  assert.equal(r.conns, 1);
  assert.ok(r.objects.every((o) => o.conn === 1 && o.startMs === 200 && o.endMs === 300));
  assert.equal(r.doneMs, 300);
});

test('rule 4: HTTP/3 sets up QUIC and TLS together in one round trip', () => {
  const r = row(S({ rtt: 100, objects: 12 }), 'h3');
  assert.equal(r.setupMs, 100);
  assert.deepEqual(r.setup, [{ kind: 'quic', startMs: 0, endMs: 100 }]);
  assert.ok(r.objects.every((o) => o.startMs === 100 && o.endMs === 200));
  assert.equal(r.doneMs, 200);
});

test('rule 5: a loss stalls every HTTP/2 stream, one HTTP/1.1 connection, one HTTP/3 stream', () => {
  const st = S({ rtt: 100, objects: 6, loss: true, lostObject: 4 });
  const h2 = row(st, 'h2'), h3 = row(st, 'h3'), h1 = row(st, 'h1');
  assert.deepEqual(h2.objects.map((o) => o.blockedMs), [100, 100, 100, 100, 100, 100], 'TCP: all streams wait');
  assert.deepEqual(h3.objects.map((o) => o.blockedMs), [0, 0, 0, 100, 0, 0], 'QUIC: only its own stream');
  assert.deepEqual(h1.objects.map((o) => o.blockedMs), [0, 0, 0, 100, 0, 0], 'HTTP/1.1: only its own connection');
  assert.deepEqual(ends(h1), [300, 300, 300, 400, 300, 300]);
  // on one HTTP/1.1 connection the objects after the lost one start later, not blocked themselves
  const one = row(S({ rtt: 100, objects: 3, h1conns: 1, loss: true, lostObject: 2 }), 'h1');
  assert.deepEqual(one.objects.map((o) => [o.startMs, o.endMs, o.blockedMs]), [[200, 300, 0], [300, 500, 100], [500, 600, 0]]);
});

test('rule 6: recovery costs exactly one extra round trip, at the end of the bar', () => {
  for (const rtt of [10, 120, 300]) {
    const st = S({ rtt, objects: 5, loss: true, lostObject: 2 });
    const clean = S({ rtt, objects: 5 });
    st.rows.forEach((r, i) => {
      const o = r.objects[1], c = clean.rows[i].objects[1];
      assert.equal(o.endMs - c.endMs, rtt, r.version);
      assert.equal(o.blockedMs, rtt, r.version);
      assert.equal(o.startMs, c.startMs, r.version);
      assert.deepEqual(r.setup, clean.rows[i].setup, `${r.version}: the set-up never loses`);
    });
  }
});

test('the page is done when its last object has arrived; everything scales with the RTT', () => {
  for (const p of [{}, { h1conns: 1 }, { loss: true, objects: 11, lostObject: 5 }]) {
    const a = S({ ...p, rtt: 10 }), b = S({ ...p, rtt: 230 });
    a.rows.forEach((r, i) => {
      assert.equal(r.doneMs, Math.max(...ends(r)));
      assert.deepEqual(ends(b.rows[i]), ends(r).map((x) => x * 23));
    });
  }
});

test('presets: the numbers of SPEC.md', () => {
  const pre = (id) => logic.initial(P(logic.presets.find((x) => x.id === id).params));
  const done = (st) => st.rows.map((r) => r.doneMs);
  let st = pre('no-loss');
  assert.deepEqual(done(st), [300, 300, 200]);
  st = pre('one-connection');
  assert.deepEqual(done(st), [800, 300, 200]);
  assert.deepEqual(ends(row(st, 'h1')), [300, 400, 500, 600, 700, 800]);
  st = pre('loss');
  assert.deepEqual(ends(row(st, 'h1')), [400, 300, 300, 300, 300, 300]);
  assert.deepEqual(ends(row(st, 'h2')), [400, 400, 400, 400, 400, 400]);
  assert.deepEqual(ends(row(st, 'h3')), [300, 200, 200, 200, 200, 200]);
  assert.deepEqual(done(st), [400, 400, 300]);
  st = pre('high-rtt');
  assert.deepEqual(ends(row(st, 'h1')), [1000, 750, 750, 750, 750, 750, 1000, 1000, 1000, 1000, 1000, 1250]);
  assert.deepEqual(ends(row(st, 'h2')), Array(12).fill(1000));
  assert.deepEqual(ends(row(st, 'h3')), [750].concat(Array(11).fill(500)));
  assert.deepEqual(done(st), [1250, 1000, 750]);
});

test('captions: the key follows the params', () => {
  assert.equal(logic.captionKey(P({})), 'capNoLoss');
  assert.equal(logic.captionKey(P({ h1conns: 1 })), 'capSerial');
  assert.equal(logic.captionKey(P({ objects: 7 })), 'capSerial');
  assert.equal(logic.captionKey(P({ objects: 1, h1conns: 1 })), 'capNoLoss');
  assert.equal(logic.captionKey(P({ loss: true })), 'capLoss');
  assert.equal(logic.captionKey(P({ loss: true, h1conns: 1 })), 'capLoss');
});

test('axis ticks: one per round trip, thinned to fit, ending at the latest done time', () => {
  const st = S({ rtt: 100 });
  assert.deepEqual(logic.ticks(st, 100, 10), { endMs: 300, ticks: [0, 100, 200, 300] });
  const big = S({ rtt: 100, objects: 12, h1conns: 1, loss: true });
  const ax = logic.ticks(big, 100, 6);
  assert.equal(ax.endMs, 1500);
  assert.ok(ax.ticks.length <= 7);
  assert.equal(ax.ticks[0], 0);
  assert.equal(ax.ticks[ax.ticks.length - 1], 1500);
  assert.ok(ax.ticks.every((x) => x % 100 === 0));
  // the end tick pushes out a regular tick that would sit too close to it
  const hi = S({ rtt: 250, objects: 12, loss: true });
  assert.deepEqual(logic.ticks(hi, 250, 4).ticks, [0, 500, 1250]);
  assert.deepEqual(logic.ticks(hi, 250, 10).ticks, [0, 250, 500, 750, 1000, 1250]);
  // a tick 0.67 of a step from the end stays; exactly maxTicks steps need no thinning
  assert.deepEqual(logic.ticks(S({ h1conns: 1 }), 100, 3).ticks, [0, 300, 600, 800]);
  assert.deepEqual(logic.ticks(S({}), 100, 3).ticks, [0, 100, 200, 300]);
});

test('params: the ranges and defaults of SPEC.md', () => {
  assert.deepEqual(logic.defaults, { rtt: 100, objects: 6, h1conns: 6, loss: false, lostObject: 1 });
  assert.deepEqual([logic.RTT_MIN, logic.RTT_MAX, logic.RTT_STEP], [10, 300, 10]);
  assert.deepEqual([logic.OBJ_MIN, logic.OBJ_MAX], [1, 12]);
  assert.deepEqual(logic.H1_CONNS, [1, 6]);
});

test('every preset value is one the page\'s controls can show', () => {
  for (const p of logic.presets) {
    const q = P(p.params);
    assert.ok(q.rtt >= logic.RTT_MIN && q.rtt <= logic.RTT_MAX && q.rtt % logic.RTT_STEP === 0, `${p.id} rtt`);
    assert.ok(Number.isInteger(q.objects) && q.objects >= logic.OBJ_MIN && q.objects <= logic.OBJ_MAX, `${p.id} objects`);
    assert.ok(logic.H1_CONNS.includes(q.h1conns), `${p.id} h1conns`);
    assert.equal(typeof q.loss, 'boolean');
    assert.ok(Number.isInteger(q.lostObject) && q.lostObject >= 1 && q.lostObject <= q.objects, `${p.id} lostObject`);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ loss: true, objects: 9, lostObject: 4 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; sim.json entries name real presets', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries) assert.ok(logic.presets.some((p) => p.id === e.preset), e.preset);
});
