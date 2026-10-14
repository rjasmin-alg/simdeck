// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the TCP congestion control model (rules and numbers: SPEC.md). Run: node --test sims/tcp-congestion/
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
const series = (algo, over) => logic.run(algo, P(over));
const cw = (s) => s.map((x) => x.cwnd);
const events = (s) => s.filter((x) => x.event).map((x) => [x.r, x.event]);
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= (eps || 1e-3), `${msg || ''} ${a} ≈ ${b}`);

// ── tie-breaks ──

test('tie: cwnd equal to ssthresh is congestion avoidance, not slow start', () => {
  const s = series('reno', { capacity: 100 });
  assert.equal(s[5].cwnd, 32); assert.equal(s[5].phase, 'ss');
  assert.equal(s[6].cwnd, 64); assert.equal(s[6].ssthresh, 64); assert.equal(s[6].phase, 'ca');
  assert.equal(s[7].cwnd, 65, 'then +1, not ×2');
});

test('tie: slow start that would jump past ssthresh stops at ssthresh', () => {
  const s = series('reno', { capacity: 100, iw: 10 });
  assert.deepEqual(cw(s).slice(0, 5), [10, 20, 40, 64, 65], '80 is capped to 64');
  const t = series('reno', { capacity: 40, timeoutAt: 30, iw: 1, rtt: 100 });
  // A window of 33 times out: ssthresh 16, and slow start lands exactly on it (1, 2, 4, 8, 16), then +1.
  assert.deepEqual(cw(t).slice(31, 37), [1, 2, 4, 8, 16, 17]);
});

test('tie: a window equal to the capacity is no loss; one segment more is', () => {
  const s = series('reno', { capacity: 40 });
  const at40 = s.find((x) => x.r > 6 && x.cwnd === 40);
  assert.equal(at40.event, null);
  assert.equal(s[at40.r + 1].cwnd, 41);
  assert.equal(s[at40.r + 1].event, 'dup');
});

test('tie: a fractional CUBIC window loses only when its whole segments exceed the capacity', () => {
  const s = series('cubic', { capacity: 40 });
  for (const x of s) assert.equal(x.event === 'dup', Math.floor(x.cwnd) > 40, `round ${x.r}, cwnd ${x.cwnd}`);
  assert.ok(s.some((x) => x.cwnd > 40 && x.cwnd < 41 && !x.event), 'a window of 40.x passes');
});

test('tie: a timeout and a loss in the same round count as the timeout', () => {
  // Round 6 carries 64 segments into a capacity of 40 (a loss), and the timeout is set there too.
  const s = series('reno', { capacity: 40, timeoutAt: 6 });
  assert.equal(s[6].cwnd, 64);
  assert.equal(s[6].event, 'timeout');
  assert.equal(s[7].cwnd, 1);
  assert.equal(s[7].ssthresh, 32);
});

test('tie: ssthresh never goes below 2 MSS', () => {
  const s = series('reno', { capacity: 2 });
  assert.deepEqual(cw(s).slice(0, 6), [1, 2, 4, 2, 3, 2]);
  assert.ok(s.every((x) => x.ssthresh >= 2));
  const c = series('cubic', { capacity: 2 });
  assert.ok(c.every((x) => x.ssthresh >= 2 && x.cwnd >= 1));
});

test('tie: halving an odd window rounds down (41 → 20)', () => {
  assert.equal(logic.afterDup('reno', 41), 20);
  assert.equal(logic.afterDup('reno', 3), 2);
  near(logic.afterDup('cubic', 41), 28.7);
});

// ── rules ──

test('rule 1: slow start doubles cwnd every RTT from the initial window of 1', () => {
  const s = series('reno', { capacity: 100 });
  assert.deepEqual(cw(s).slice(0, 7), [1, 2, 4, 8, 16, 32, 64]);
  assert.ok(s.slice(0, 6).every((x) => x.phase === 'ss'));
});

test('rule 2: congestion avoidance adds one MSS per RTT (preset slow-start)', () => {
  const s = series('reno', { capacity: 100 });
  for (let r = 7; r <= 43; r++) assert.equal(s[r].cwnd, s[r - 1].cwnd + 1, `round ${r}`);
  assert.equal(s[43].cwnd, 101);
  assert.equal(s[43].event, 'dup');
  assert.equal(s[44].cwnd, 50);
});

test('rule 3: capacity losses are deterministic; random losses follow the seed', () => {
  assert.deepEqual(series('reno', {}), series('reno', {}));
  const a = series('reno', { lossMode: 'random', p: 1, seed: 4 });
  assert.deepEqual(a, series('reno', { lossMode: 'random', p: 1, seed: 4 }), 'same seed, same losses');
  assert.notDeepEqual(events(a), events(series('reno', { lossMode: 'random', p: 1, seed: 5 })), 'another seed, other losses');
  assert.deepEqual(series('reno', { lossMode: 'random', p: 0 }), series('reno', { lossMode: 'capacity' }), 'p = 0 adds nothing');
  assert.deepEqual(series('reno', { lossMode: 'capacity', seed: 9 }), series('reno', { lossMode: 'capacity', seed: 4 }), 'seed unused');
  // Random mode keeps the capacity: the first overflow (64 > 40) is still there.
  assert.equal(a[6].event, 'dup');
});

test('rule 3: Reno and CUBIC take the same random draw in the same round', () => {
  // Both run the same slow start (1, 2, 4, …), so while their windows agree, a random loss hits both in the same round.
  let compared = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const p = { lossMode: 'random', p: 5, seed, capacity: 100 };
    const r = series('reno', p), c = series('cubic', p);
    const first = r.findIndex((x) => x.event);
    if (first < 0 || first > 5) continue;
    compared++;
    assert.deepEqual(events(c.slice(0, first + 1)), events(r.slice(0, first + 1)), `seed ${seed}`);
  }
  assert.ok(compared >= 5, `compared ${compared} seeds`);
});

test('rule 3: a round of w segments, each lost with p, loses at least one with 1 − (1 − p)^w', () => {
  near(logic.roundLoss(1, 1), 0.01);
  near(logic.roundLoss(20, 1), 1 - Math.pow(0.99, 20));
  assert.ok(logic.roundLoss(40, 1) > logic.roundLoss(10, 1), 'a bigger window is likelier to lose one');
  assert.equal(logic.roundLoss(30, 0), 0);
});

test('rule 4: Reno halves on three duplicate ACKs: the AIMD sawtooth (preset sawtooth)', () => {
  const s = series('reno', { capacity: 40 });
  assert.deepEqual(events(s), [[6, 'dup'], [16, 'dup'], [38, 'dup'], [60, 'dup']]);
  assert.deepEqual(cw(s).slice(6, 18), [64, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 20]);
  assert.equal(s[7].ssthresh, 32);
  assert.equal(s[17].ssthresh, 20);
  assert.deepEqual(cw(s).slice(38, 40), [41, 20], 'every tooth 20 … 41');
  assert.ok(s.slice(7).every((x) => x.phase === 'ca'), 'no slow start after a loss by duplicate ACKs');
  const sum = logic.summarize('reno', s, P({ capacity: 40 }));
  assert.deepEqual(sum.last, { r: 60, kind: 'dup', cause: 'capacity', from: 41, to: 20 });
  assert.deepEqual(sum.recover, { s: 2.1, rounds: 21, by: 'reno' });
});

test('rule 5: a timeout sets ssthresh to half and cwnd to 1, then slow start again (preset timeout)', () => {
  const s = series('reno', { capacity: 40, timeoutAt: 30 });
  assert.equal(s[30].cwnd, 33);
  assert.equal(s[30].event, 'timeout');
  assert.equal(s[31].cwnd, 1);
  assert.equal(s[31].ssthresh, 16);
  assert.ok(s.slice(31, 35).every((x) => x.phase === 'ss'));
  assert.equal(s[35].phase, 'ca');
  const sum = logic.summarize('reno', s, P({ capacity: 40, timeoutAt: 30 }));
  assert.equal(sum.timeouts, 1);
  assert.equal(sum.dups, 3);
});

test('rule 5 for CUBIC: ssthresh by β after a timeout, then a new epoch with K = 0 (RFC 9438 §4.8)', () => {
  const p = P({ algo: 'cubic', capacity: 40, timeoutAt: 30 });
  const s = logic.run('cubic', p);
  const w = s[30].cwnd;
  assert.equal(s[30].event, 'timeout');
  assert.equal(s[31].cwnd, 1);
  near(s[31].ssthresh, w * 0.7, 1e-3);
  const ca = s.findIndex((x, i) => i > 30 && x.phase === 'ca');
  near(s[ca].cwnd, w * 0.7, 1e-3, 'slow start stops at ssthresh');
  // K = 0: W(t) = C·t³ + Wmax from the start of congestion avoidance.
  near(s[ca + 5].cwnd, logic.cubicW(0.5, s[ca].cwnd, 0), 1e-3);
});

test('rule 6: CUBIC keeps β·Wmax and climbs back to Wmax after K seconds (preset reno-vs-cubic)', () => {
  near(logic.cubicK(41, 41 * 0.7), Math.cbrt(41 * 0.3 / 0.4), 1e-9);
  near(logic.cubicK(41, 41 * 0.7), 3.1329, 1e-4);
  near(logic.cubicW(0, 41, logic.cubicK(41, 28.7)), 28.7, 1e-9, 'W(0) = β·Wmax');
  near(logic.cubicW(3.1329, 41, 3.1329), 41, 1e-9, 'W(K) = Wmax');
  const p = P({ algo: 'both', capacity: 40, rtt: 100 });
  const st = logic.initial(p);
  const c = st.summary.cubic;
  near(c.last.from, 41, 0.05, 'loss near 41');
  near(c.last.to, 28.7, 0.05, '41 → 28.7');
  near(c.recover.s, 3.13, 0.01, 'K ≈ 3.13 s');
  assert.deepEqual(st.summary.reno.recover, { s: 2.1, rounds: 21, by: 'reno' });
  // Concave: the steps get smaller as the window nears Wmax.
  const cub = st.series.cubic, i = c.last.r - 20;
  assert.ok(cub[i + 1].cwnd - cub[i].cwnd > cub[i + 15].cwnd - cub[i + 14].cwnd);
});

test('rule 6: CUBIC grows with time, not with round trips (preset long-rtt)', () => {
  const s100 = logic.initial(P({ algo: 'both', rtt: 100 })), s200 = logic.initial(P({ algo: 'both', rtt: 200 }));
  assert.deepEqual(s200.summary.reno.recover, { s: 4.2, rounds: 21, by: 'reno' }, 'Reno: the same 21 RTTs, twice the seconds');
  near(s200.summary.cubic.recover.s, s100.summary.cubic.recover.s, 0.01, 'CUBIC: the same seconds');
  near(s200.summary.cubic.recover.s, 3.13, 0.01);
  // Inside one epoch, round 2k at 100 ms and round k at 200 ms are the same instant and the same window.
  const a = logic.run('cubic', P({ rtt: 100, capacity: 100 })), b = logic.run('cubic', P({ rtt: 200, capacity: 100 }));
  for (let k = 0; k <= 10; k++) near(a[6 + 2 * k].cwnd, b[6 + k].cwnd, 1e-3, `k ${k}`);
  // Reno in rounds does not depend on the RTT at all.
  assert.deepEqual(cw(logic.run('reno', P({ rtt: 30 }))), cw(logic.run('reno', P({ rtt: 300 }))));
});

test('rule 7: the Reno-friendly region lifts CUBIC to the Reno estimate when that is higher', () => {
  const off = logic.run('cubic', P({ rtt: 10 })), on = logic.run('cubic', P({ rtt: 10, friendly: true }));
  near(logic.ALPHA, 3 * 0.3 / 1.7, 1e-12);
  near(logic.ALPHA, 0.53, 0.005);
  // After the second loss (44.8 → 31.36), the friendly window grows by α per round at least.
  const r0 = 8, w0 = on[r0].cwnd;
  for (let k = 1; k <= 10 && !on[r0 + k - 1].event; k++) assert.ok(on[r0 + k].cwnd >= w0 + logic.ALPHA * k - 1e-3, `round ${r0 + k}`);
  assert.ok(off.some((x, i) => x.cwnd < on[i].cwnd), 'at 10 ms the cubic alone is below the estimate');
  // At 200 ms the cubic is above the estimate all the time: the toggle changes nothing.
  assert.deepEqual(logic.run('cubic', P({ rtt: 200 })), logic.run('cubic', P({ rtt: 200, friendly: true })));
  // Reno ignores it.
  assert.deepEqual(series('reno', { friendly: true }), series('reno', {}));
});

test('tie: once in congestion avoidance, CUBIC stays there until a timeout (W(0) = ssthresh exactly)', () => {
  for (let capacity = 10; capacity <= 100; capacity += 5) {
    for (const rtt of [10, 40, 100, 170, 300]) {
      for (const iw of [1, 10]) {
        for (const friendly of [false, true]) {
          for (const timeoutAt of [0, 30]) {
            const s = logic.run('cubic', P({ capacity, rtt, iw, friendly, timeoutAt }));
            let allowed = true;
            for (const x of s) {
              if (x.phase === 'ss') assert.ok(allowed, `capacity ${capacity}, rtt ${rtt}, iw ${iw}, friendly ${friendly}, timeout ${timeoutAt}: round ${x.r}`);
              if (x.phase === 'ca' || x.event === 'dup') allowed = false;
              if (x.event === 'timeout') allowed = true;
            }
          }
        }
      }
    }
  }
});

test('rule 3: a random loss with fewer than four segments in flight is a timeout (no three duplicate ACKs)', () => {
  let small = 0;
  for (let seed = 1; seed <= 60; seed++) {
    for (const algo of ['reno', 'cubic']) {
      const s = series(algo, { lossMode: 'random', p: 5, seed });
      for (const x of s) {
        if (x.event === 'dup') assert.ok(Math.floor(x.cwnd) >= logic.DUP_MIN, `${algo} seed ${seed} round ${x.r}`);
        if (x.cause === 'random' && Math.floor(x.cwnd) < 4) { small++; assert.equal(x.event, 'timeout'); }
      }
    }
  }
  assert.ok(small > 0, 'the case occurs');
  assert.equal(logic.DUP_MIN, 4);
});

test('rule 6: CUBIC counts Wmax in whole segments and follows W(t) round by round (preset reno-vs-cubic)', () => {
  const s = series('cubic', { capacity: 40, rtt: 100 });
  assert.deepEqual(events(s).map((e) => e[0]), [6, 7, 21, 53]);
  assert.equal(s[7].cwnd, 44.8, '64 → β·64');
  near(s[21].cwnd, 41.22, 0.01);
  assert.equal(s[22].cwnd, 28.7, 'Wmax = ⌊41.2⌋ = 41 → β·41');
  assert.equal(s[22].ssthresh, 28.7);
  const K = logic.cubicK(41, 28.7);
  for (let k = 0; k <= 30; k++) near(s[22 + k].cwnd, logic.cubicW(k * 0.1, 41, K), 1e-4, `k ${k}`);
  // The tooth: 31 rounds back to 41 (t = 3.1 s, K = 3.13 s), the loss in the round that reaches it.
  assert.equal(s[53].cwnd, 41);
  const l = series('cubic', { capacity: 40, rtt: 200 });
  assert.deepEqual(events(l).map((e) => e[0]), [6, 7, 15, 32, 49], 'at 200 ms: 16 rounds = 3.2 s per climb');
});

test('rule 5: a timeout drops cwnd to 1 whatever the initial window; ssthresh ≥ 2 for CUBIC too', () => {
  const s = series('reno', { capacity: 40, timeoutAt: 30, iw: 10 });
  assert.equal(s[30].event, 'timeout');
  assert.equal(s[31].cwnd, 1);
  const c = series('cubic', { capacity: 40, timeoutAt: 1 });
  assert.equal(c[1].cwnd, 2);
  assert.equal(c[2].ssthresh, 2, 'β·2 = 1.4 → 2');
  assert.equal(logic.afterDup('cubic', 2), 2);
  const sum = logic.summarize('reno', s, P({ capacity: 40, timeoutAt: 30, iw: 10 }));
  const to = logic.summarize('reno', s.slice(0, 32), P({ capacity: 40, timeoutAt: 30 }));
  assert.deepEqual(to.last, { r: 30, kind: 'timeout', cause: 'timer', from: s[30].cwnd, to: 1 });
  assert.equal(sum.timeouts, 1);
});

test('rule 7: the Reno estimate grows by α up to Wmax, then by 1 per RTT; with it, CUBIC at 100 ms is back sooner', () => {
  const ep = { wmax: 41, west: 28.7 };
  near(logic.renoEstimate(ep, 10), 28.7 + 10 * logic.ALPHA, 1e-9);
  const kStar = (41 - 28.7) / logic.ALPHA;
  near(logic.renoEstimate(ep, kStar), 41, 1e-9);
  near(logic.renoEstimate(ep, kStar + 3), 44, 1e-9);
  const p = P({ algo: 'cubic', capacity: 40, rtt: 100, friendly: true });
  const st = logic.initial(p);
  assert.deepEqual(events(st.series.cubic).map((e) => e[0]), [6, 7, 21, 46], 'teeth of ≈ 24 rounds instead of 31');
  assert.equal(st.summary.cubic.recover.by, 'friendly');
  near(st.summary.cubic.recover.s, kStar * 0.1, 1e-3);
  const off = logic.initial(P({ algo: 'cubic', capacity: 40, rtt: 100 })).summary.cubic.recover;
  assert.equal(off.by, 'cubic');
  near(off.s, 3.1329, 1e-4);
});

test('rule 8: initial window 1 by default, 10 as an option; initial ssthresh 64', () => {
  assert.equal(series('reno', {})[0].cwnd, 1);
  assert.equal(series('reno', { iw: 10 })[0].cwnd, 10);
  assert.equal(series('reno', {})[0].ssthresh, 64);
  assert.equal(logic.INIT_SSTHRESH, 64);
});

test('series: 61 points, rounds 0 … 60, time = round × RTT', () => {
  const s = series('reno', { rtt: 250 });
  assert.equal(s.length, 61);
  assert.equal(s[60].r, 60);
  assert.equal(s[10].t, 2.5);
});

test('summary: losses, average window, the last loss and the climb back', () => {
  const p = P({ capacity: 40 });
  const s = logic.run('reno', p), sum = logic.summarize('reno', s, p);
  assert.equal(sum.losses, 4);
  near(sum.avgCwnd, cw(s).reduce((a, b) => a + b, 0) / 61, 1e-3);
  const t = logic.summarize('reno', series('reno', { capacity: 100, timeoutAt: 30 }), P({ capacity: 100, timeoutAt: 30 }));
  assert.equal(t.last.kind, 'timeout');
  assert.equal(t.recover, null, 'no climb after a timeout');
  const none = logic.summarize('reno', series('reno', { capacity: 100, iw: 1 }).slice(0, 20), P({ capacity: 100 }));
  assert.equal(none.last, null);
});

test('preset random-loss: an irregular sawtooth with a lower average window', () => {
  const pr = logic.presets.find((x) => x.id === 'random-loss');
  const st = logic.initial(P(pr.params));
  const saw = logic.initial(P({ capacity: 40 }));
  assert.ok(st.summary.reno.losses > saw.summary.reno.losses);
  assert.ok(st.summary.reno.avgCwnd < saw.summary.reno.avgCwnd);
  const gaps = events(st.series.reno).map((e) => e[0]).map((r, i, a) => (i ? r - a[i - 1] : null)).slice(1);
  assert.ok(new Set(gaps).size > 2, 'irregular teeth');
  assert.deepEqual(events(st.series.reno).map((e) => e[0]), [6, 16, 29, 33, 38, 50, 53]);
  assert.deepEqual(st.series.reno.filter((x) => x.event).map((x) => x.cause), ['capacity', 'capacity', 'random', 'random', 'random', 'random', 'random']);
  assert.equal(st.summary.reno.random, 5);
  near(st.summary.reno.avgCwnd, 19.2787, 1e-4);
});

test('the generator is the kit\'s Simdeck.rng', () => {
  const a = logic.rng(4), b = kit.rng(4);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
});

test('both draws the two series under the same params; one algorithm draws one', () => {
  assert.deepEqual(Object.keys(logic.initial(P({ algo: 'both' })).series), ['reno', 'cubic']);
  assert.deepEqual(Object.keys(logic.initial(P({ algo: 'cubic' })).series), ['cubic']);
  assert.deepEqual(logic.initial(P({ algo: 'both' })).series.reno, logic.initial(P({ algo: 'reno' })).series.reno);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const pr of logic.presets) {
    const s = logic.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ algo: 'both', lossMode: 'random', p: 2.5, friendly: true });
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
  const ids = logic.presets.map((x) => x.id);
  assert.deepEqual(ids, ['slow-start', 'sawtooth', 'timeout', 'reno-vs-cubic', 'long-rtt', 'random-loss']);
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
    assert.ok(html.includes(`'${pr.id}'`), `${pr.id}: label in index.html`);
  }
});
