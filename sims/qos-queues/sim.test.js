// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the QoS queues model (rules and numbers: SPEC.md). Run: node --test sims/qos-queues/
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
const run = (over) => logic.run(P(over));
const near = (a, b, msg, eps) => assert.ok(Math.abs(a - b) <= (eps || 1e-9), `${msg || ''} ${a} ≈ ${b}`);
const rates = (s, k) => s.totals.map((o) => o[k]);
const pk = (c) => ({ c, t: 0 });
const full = (n, c) => Array.from({ length: n }, () => pk(c));
const classes = (sent) => sent.map((x) => x.c).join('');
const sum = (a) => a.reduce((x, y) => x + y, 0);

// ── tie-breaks ──

test('tie: equal priority never happens; PQ takes voice, then video, then bulk within one tick', () => {
  const qs = [full(3, 0), full(3, 1), full(3, 2)];
  assert.equal(classes(logic.schedule('pq', qs, 7, [1, 1, 1])), '0001112');
  assert.deepEqual(qs.map((q) => q.length), [0, 0, 2]);
});

test('tie: a partial WRR round goes in the fixed order voice, video, bulk', () => {
  // C = 12 with 2 : 3 : 5: one full round (10), then voice's 2 of the next one.
  const qs = [full(9, 0), full(9, 1), full(9, 2)];
  assert.equal(classes(logic.schedule('wrr', qs, 12, [2, 3, 5])), '001112222200');
  // C = 4: the round stops inside video's turn; bulk gets nothing this tick.
  const q2 = [full(9, 0), full(9, 1), full(9, 2)];
  assert.equal(classes(logic.schedule('wrr', q2, 4, [2, 3, 5])), '0011');
});

test('tie: a WRR round cut short by C resumes in the next tick where it stopped', () => {
  const qs = [full(20, 0), full(20, 1), full(20, 2)];
  const rr = { i: 0, used: 0 };
  assert.equal(classes(logic.schedule('wrr', qs, 4, [2, 3, 5], rr)), '0011');
  assert.deepEqual(rr, { i: 1, used: 2 });
  assert.equal(classes(logic.schedule('wrr', qs, 4, [2, 3, 5], rr)), '1222', 'video\'s last one, then bulk');
  assert.equal(classes(logic.schedule('wrr', qs, 4, [2, 3, 5], rr)), '2200');
});

test('tie: a WRR queue that runs empty just as C runs out still loses the rest of its turn', () => {
  const rr = { i: 0, used: 0 };
  assert.equal(classes(logic.schedule('wrr', [full(1, 0), full(9, 1), full(9, 2)], 1, [2, 3, 5], rr)), '0');
  assert.deepEqual(rr, { i: 1, used: 0 }, 'next tick starts with video');
});

test('tie: the limit is per queue for PQ and WRR, and for the one shared queue in FIFO', () => {
  const fifo = run({ sched: 'fifo', limit: 10, rVoice: 12, rVideo: 12, rBulk: 12 });
  assert.equal(fifo.snapshot.queues.length, 1);
  assert.equal(fifo.snapshot.queues[0].length, 10, 'one queue of 10 for all three classes');
  for (const sched of ['pq', 'wrr']) {
    const s = run({ sched, limit: 10, rVoice: 12, rVideo: 12, rBulk: 12 });
    assert.deepEqual(s.snapshot.queues.map((q) => q.length), [10, 10, 10], sched);
  }
});

test('tie: the arrivals of a tick come in a seeded random order, so no class is always first', () => {
  // Uncongested FIFO: nothing waits, so the link carries each tick's arrivals in their arrival order.
  const firsts = new Set();
  for (let seed = 1; seed <= 9; seed++) {
    const a = run({ rVideo: 3, rBulk: 4, seed }), b = run({ rVideo: 3, rBulk: 4, seed });
    assert.deepEqual(a, b, 'same seed, same run');
    firsts.add(a.snapshot.sent[0]);
  }
  assert.deepEqual([...firsts].sort(), [0, 1, 2]);
  assert.notDeepEqual(run({ seed: 1 }).snapshot.sent, run({ seed: 2 }).snapshot.sent);
});

// ── rules ──

test('arrivals: rate_i per tick, fractional rates accumulate', () => {
  const s = run({ rVoice: 0.5, rVideo: 2.5, rBulk: 0, sched: 'pq' });
  const perTick = s.series.delivered.map((d) => d[0]);
  assert.deepEqual(perTick.slice(0, 4), [0, 1, 0, 1], 'one voice packet every other tick');
  assert.deepEqual(s.series.delivered.slice(0, 4).map((d) => d[1]), [2, 3, 2, 3]);
  assert.deepEqual(rates(s, 'offeredRate'), [0.5, 2.5, 0]);
  assert.equal(s.totals[0].offered, 100, '200 ticks × 0.5');
});

test('rule 1: FIFO serves in arrival order; every class has the same delay and about the same drop share', () => {
  const s = run({ sched: 'fifo' });
  const snap = s.snapshot;
  assert.deepEqual(snap.sent, snap.queues[0].slice(0, 10), 'the first ten in the queue leave');
  assert.deepEqual(snap.sentFrom, [10]);
  rates(s, 'delay').forEach((d) => near(d, 1, 'delay'));
  rates(s, 'dropPct').forEach((x) => assert.ok(x > 32 && x < 35, `drop share ${x}`));
});

test('rule 2: tail drop: drops only at a full queue, and nothing queued ever disappears', () => {
  for (const sched of ['fifo', 'pq', 'wrr']) {
    const p = P({ sched, limit: 20 });
    const s = logic.run(p);
    let arrived = 0;
    const acc = [0, 0, 0], r = [p.rVoice, p.rVideo, p.rBulk];
    for (let t = 0; t < logic.T; t++) for (let i = 0; i < 3; i++) { acc[i] += r[i]; const k = Math.floor(acc[i]); acc[i] -= k; arrived += k; }
    const sent = sum(s.series.delivered.map(sum)), dropped = sum(s.series.dropped.map(sum)), left = sum(s.series.fill[logic.T - 1]);
    assert.equal(sent + dropped + left, arrived, `${sched}: every arrival is sent, dropped or still queued`);
    s.series.dropped.forEach((d, t) => {
      if (sched === 'fifo' && sum(d) > 0) assert.equal(s.series.fill[t][0] + sum(s.series.delivered[t]), 20, `${sched} tick ${t}: queue was full`);
      if (sched !== 'fifo') d.forEach((n, c) => { if (n > 0) assert.equal(s.series.fill[t][c] + s.series.delivered[t][c], 20, `${sched} tick ${t}: queue ${c} was full`); });
    });
  }
  // The queued packets stay; the newcomers are the ones dropped. FIFO, limit 20, C 10: after the last tick's 15
  // arrivals the queue holds the 10 left from tick 298 and the first 10 newcomers; the other 5 are dropped.
  const snap = run({ sched: 'fifo' }).snapshot;
  assert.deepEqual(snap.arrived[0], [...Array(10).fill(298), ...Array(10).fill(299)]);
  assert.equal(snap.dropped.length, 5);
  // PQ: bulk's full queue keeps its oldest packets (17 waiting from earlier ticks) and drops the newcomers.
  const pq = run({ sched: 'pq' }).snapshot;
  assert.equal(pq.arrived[2].filter((t) => t === 299).length, 3);
  assert.deepEqual(pq.dropped.filter((c) => c === 2).length, 5);
});

test('rule 3: strict priority serves a lower queue only when every higher one is empty (preset priority)', () => {
  const s = run({ sched: 'pq' });
  assert.deepEqual(rates(s, 'deliveredRate'), [2, 5, 3]);
  assert.deepEqual(rates(s, 'droppedRate'), [0, 0, 5]);
  near(s.totals[0].delay, 0); near(s.totals[1].delay, 0); near(s.totals[2].delay, 17 / 3, 'bulk');
  const snap = s.snapshot;
  assert.deepEqual(snap.sentFrom, [2, 5, 3]);
  assert.equal(snap.sent.join(''), '0011111222');
});

test('rule 3: strict priority starves the lower queues (preset starvation)', () => {
  const s = run({ sched: 'pq', rVoice: 11 });
  assert.deepEqual(rates(s, 'deliveredRate'), [10, 0, 0]);
  assert.deepEqual(rates(s, 'droppedRate'), [1, 5, 8]);
  assert.equal(s.totals[1].delay, null, 'nothing delivered: no delay');
  assert.equal(s.totals[2].delay, null);
});

test('rule 4: WRR gives each busy queue w_i / Σw of C (preset weighted)', () => {
  const s = run({ sched: 'wrr' });
  assert.deepEqual(rates(s, 'deliveredRate'), [2, 3, 5]);
  assert.deepEqual(rates(s, 'droppedRate'), [0, 2, 3]);
  near(s.totals[0].delay, 0); near(s.totals[1].delay, 17 / 3, 'video'); near(s.totals[2].delay, 3, 'bulk');
  // C ≠ Σw: the carried round still gives 2 : 3 : 5.
  const c15 = run({ sched: 'wrr', C: 15, rVoice: 12, rVideo: 12, rBulk: 12 });
  assert.deepEqual(rates(c15, 'deliveredRate'), [3, 4.5, 7.5]);
});

test('rule 4: WRR is work conserving: a share a class leaves unused goes to the others', () => {
  const s = run({ sched: 'wrr', rVoice: 0, rVideo: 8, rBulk: 8 });
  assert.deepEqual(rates(s, 'deliveredRate'), [0, 3.75, 6.25], '3 : 5 of all 10');
  // Voice asks for less than its share (2 of 10): it gets all of it.
  const v = run({ sched: 'wrr', rVoice: 1.5 });
  near(v.totals[0].deliveredRate, 1.5); assert.equal(v.totals[0].dropped, 0);
  near(sum(rates(v, 'deliveredRate')), 10, 'the link stays full');
});

test('rule 5 (presets): FIFO with a bigger queue keeps the losses and adds delay; PQ keeps voice at 0', () => {
  const small = run({ sched: 'fifo' }), big = run({ sched: 'fifo', limit: 60 });
  assert.deepEqual(rates(big, 'dropped'), rates(small, 'dropped'));
  assert.deepEqual(rates(small, 'droppedRate'), [0.665, 1.715, 2.62]);
  assert.deepEqual(rates(small, 'deliveredRate'), [1.325, 3.29, 5.385]);
  assert.deepEqual(rates(big, 'deliveredRate'), [1.315, 3.265, 5.42]);
  rates(big, 'delay').forEach((d) => near(d, 5, 'bufferbloat delay'));
  const pq = run({ sched: 'pq', limit: 60 });
  near(pq.totals[0].delay, 0); near(pq.totals[1].delay, 0); near(pq.totals[2].delay, 19, 'bulk waits 57/3');
});

test('rule 6: below C every scheduler gives the same result: no drops, delay 0 (preset uncongested)', () => {
  // (as long as one tick's arrivals fit in a queue: all arrivals are queued before the scheduler runs)
  const runs = ['fifo', 'pq', 'wrr'].map((sched) => run({ sched, rVideo: 3, rBulk: 4 }));
  for (const s of runs) {
    assert.deepEqual(rates(s, 'deliveredRate'), [2, 3, 4]);
    assert.deepEqual(rates(s, 'dropped'), [0, 0, 0]);
    assert.deepEqual(rates(s, 'delay'), [0, 0, 0]);
  }
  assert.deepEqual(runs[1].totals, runs[2].totals);
  assert.deepEqual(runs[0].totals, runs[1].totals);
});

test('rule 7: each packet goes to the queue of the class its source declares', () => {
  for (const sched of ['pq', 'wrr']) {
    run({ sched }).snapshot.queues.forEach((q, i) => q.forEach((c) => assert.equal(c, i, sched)));
  }
  assert.deepEqual(new Set(run({ sched: 'fifo' }).snapshot.queues[0]), new Set([0, 1, 2]), 'FIFO mixes them');
});

test('series: 300 ticks of delivered, dropped and queue fill; never more than C sent per tick', () => {
  const s = run({ sched: 'wrr', C: 7 });
  assert.equal(s.series.delivered.length, logic.T);
  assert.equal(s.series.dropped.length, logic.T);
  assert.equal(s.series.fill.length, logic.T);
  s.series.delivered.forEach((d) => assert.ok(sum(d) <= 7));
  assert.equal(s.snapshot.t, logic.T - 1);
  assert.equal(logic.T - logic.FROM, 200);
});

test('the generator is the kit\'s Simdeck.rng', () => {
  const a = logic.rng(7), b = kit.rng(7);
  for (let i = 0; i < 20; i++) assert.equal(a.int(13), b.int(13));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const pr of logic.presets) {
    const s = logic.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ sched: 'wrr', rVoice: 3.5, seed: 4 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a label in the page', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.deepEqual(logic.presets.map((x) => x.id), ['fifo-congested', 'priority', 'starvation', 'weighted', 'bufferbloat', 'uncongested']);
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
    assert.ok(html.includes(`'${pr.id}'`), `${pr.id}: label in index.html`);
  }
});
