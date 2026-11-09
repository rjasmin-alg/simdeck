// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for directed-net's model (SPEC.md). Run: node --test sims/directed-net/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const lane = (over, n, i) => at(over, n).lanes[i || 0];
const st = (L, id) => L.stations.find((x) => x.id === id);
const slots = (L, outcome) => L.channel.filter((c) => c.outcome === outcome).map((c) => c.slot);
const acts = (c) => c.acts.map((a) => a.who + ':' + a.kind + (a.target ? '>' + a.target : '') + (a.ack ? '+' + a.ack : ''));
const PRESETS = {
  'everyone-waits-2': {},
  'mixed-backoff': { backoff: 'mixed' },
  lucky: { backoff: 'spread' },
  directed: { mode: 'directed' },
  'side-by-side': { mode: 'both' }
};

// ── tie-breaks first ──

test('T1 (rule 6): simultaneous transmitters in free mode are listed in id order, whatever the station order', () => {
  const L = logic.lane('free', P({}));
  L.stations.reverse();
  const c = logic.freeStep(L, 1).channel[0];
  assert.deepEqual(c.tx, ['A', 'B', 'C', 'D', 'E']);
  assert.equal(c.outcome, 'doubled');
});

test('T2 (rules 4, 6): the NCS calls in alphabetical order of call signs, not of ids or list position', () => {
  const stations = [{ id: 'A', call: '9A1QZZ' }, { id: 'B', call: '9A1QBB' }, { id: 'C', call: '9A1QAB' }];
  assert.deepEqual(logic.order(stations), ['C', 'B', 'A']);
  assert.deepEqual(logic.order([{ id: 'B', call: 'X' }, { id: 'A', call: 'X' }]), ['A', 'B'], 'equal call signs: id');
  // in a lane: give the stations reversed call signs and the calls follow them
  const p = P({ mode: 'directed', stations: 3 });
  let L = logic.lane('directed', p);
  const calls = L.stations.map((x) => x.call).reverse();
  L.stations.forEach((x, i) => { x.call = calls[i]; });
  L.ncs.queue = logic.order(L.stations);
  for (let n = 1; n <= 8; n++) L = logic.directedStep(L, n);
  assert.deepEqual(L.channel.filter((c) => c.acts[0].kind === 'call').map((c) => c.acts[0].target), ['C', 'B', 'A']);
  // the default call signs sort in id order, so the page calls A…E
  assert.deepEqual(logic.lane('directed', P({ stations: 8 })).ncs.queue, logic.IDS);
});

test('T3: no ties in directed mode: never more than one transmitter in a slot, for every size', () => {
  for (let n = 3; n <= 8; n++) {
    const L = end({ mode: 'directed', stations: n }).lanes[0];
    assert.ok(L.channel.every((c) => c.tx.length <= 1));
    assert.equal(L.counts.doubled, 0);
  }
});

// ── rule 1: free-for-all ──

test('rule 1: everyone keys up in slot 1; after a doubling each waits slot + 1 + backoff', () => {
  const L = lane({}, 1);
  assert.deepEqual(L.channel[0].tx, ['A', 'B', 'C', 'D', 'E']);
  assert.equal(L.channel[0].outcome, 'doubled');
  assert.ok(L.stations.every((x) => x.nextTry === 4 && x.pending));
  const M = lane({ backoff: 'mixed' }, 1);
  assert.deepEqual(M.stations.map((x) => x.nextTry), [3, 3, 4, 4, 5]);
});

test('rule 1: a station transmits only when slot ≥ nextTry; a heard message is delivered and not sent again', () => {
  const L = end({ backoff: 'spread' }).lanes[0];
  assert.deepEqual(L.channel.map((c) => c.tx.join('')), ['ABCDE', '', 'A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(L.stations.map((x) => x.deliveredAt), [3, 4, 5, 6, 7]);
  assert.equal(L.done, 7);
});

test('preset everyone-waits-2: doubled in 1, 4, 7, … 19, nothing delivered in 20 slots', () => {
  const L = end({}).lanes[0];
  assert.deepEqual(slots(L, 'doubled'), [1, 4, 7, 10, 13, 16, 19]);
  L.channel.filter((c) => c.outcome === 'doubled').forEach((c) => assert.deepEqual(c.tx, ['A', 'B', 'C', 'D', 'E']));
  assert.deepEqual(L.counts, { delivered: 0, doubled: 7, idle: 13 });
});

test('preset mixed-backoff: pairs keep colliding, nothing delivered in 20 slots', () => {
  const L = end({ backoff: 'mixed' }).lanes[0];
  assert.deepEqual(L.channel.slice(0, 13).map((c) => c.tx.join('')),
    ['ABCDE', '', 'AB', 'CD', 'ABE', '', 'ABCD', '', 'ABE', 'CD', 'AB', '', 'ABCDE']);
  assert.deepEqual(L.counts, { delivered: 0, doubled: 13, idle: 7 });
});

// ── rule 2: no random backoff; starting together, listening does not help ──

test('rule 2: every pattern starts with all stations doubled in slot 1, and the backoffs are the fixed patterns', () => {
  assert.deepEqual(logic.PATTERNS, {
    same: [2, 2, 2, 2, 2, 2, 2, 2], mixed: [1, 1, 2, 2, 3, 3, 4, 4], spread: [1, 2, 3, 4, 5, 6, 7, 8]
  });
  for (const b of ['same', 'mixed', 'spread']) {
    for (let n = 3; n <= 8; n++) {
      const L = lane({ backoff: b, stations: n }, 1);
      assert.equal(L.channel[0].tx.length, n);
      assert.deepEqual(L.stations.map((x) => x.backoff), logic.PATTERNS[b].slice(0, n));
    }
  }
  assert.deepEqual(end({ backoff: 'mixed', stations: 3 }).lanes[0].stations.map((x) => x.deliveredAt), [null, null, 4]);
});

// ── rules 3–5: directed ──

test('rule 3: a station transmits only in the slot right after the NCS called it; otherwise only the NCS speaks', () => {
  for (let n = 3; n <= 8; n++) {
    const ch = end({ mode: 'directed', stations: n }).lanes[0].channel;
    ch.forEach((c, i) => {
      if (c.tx[0] === logic.NCS) return;
      const before = ch[i - 1].acts[0];
      assert.equal(before.kind, 'call');
      assert.equal(before.target, c.tx[0]);
    });
  }
});

test('rule 4: open, then call and send for each station, the ACK riding on the next call, a closing ACK; 1 + 2n + 1', () => {
  const L = end({ mode: 'directed' }).lanes[0];
  assert.deepEqual(L.channel.map((c) => acts(c).join()), [
    'NCS:open', 'NCS:call>A', 'A:msg', 'NCS:call>B+A', 'B:msg', 'NCS:call>C+B', 'C:msg',
    'NCS:call>D+C', 'D:msg', 'NCS:call>E+D', 'E:msg', 'NCS:close+E'
  ]);
  for (let n = 3; n <= 8; n++) assert.equal(logic.steps(P({ mode: 'directed', stations: n })), 2 * n + 2);
  assert.deepEqual(L.ncs.log.map((e) => e.from + '>' + e.to + ':' + e.kind).slice(0, 4), ['NCS>*:open', 'NCS>A:call', 'A>NCS:msg', 'NCS>B:call']);
  assert.deepEqual(L.ncs.queue, []);
});

test('rule 5: a directed message counts only when ACKed; a free message counts when heard (implicit ACK)', () => {
  const s3 = lane({ mode: 'directed' }, 3);
  assert.equal(st(s3, 'A').sentAt, 3);
  assert.equal(st(s3, 'A').deliveredAt, null);
  assert.equal(s3.counts.delivered, 0);
  assert.equal(s3.ncs.ackDue, 'A');
  const s4 = lane({ mode: 'directed' }, 4);
  assert.equal(st(s4, 'A').deliveredAt, 4);
  assert.equal(s4.counts.delivered, 1);
  assert.equal(s4.ncs.ackDue, null, 'the ACK clears the pending ACK');
  const L = end({ mode: 'directed' }).lanes[0];
  assert.deepEqual(L.stations.map((x) => x.deliveredAt), [4, 6, 8, 10, 12]);
  assert.equal(L.done, 12);
  assert.equal(L.ncs.ackDue, null);
  assert.equal(L.ncs.calling, null);
  const F = lane({ backoff: 'spread' }, 3);
  assert.equal(st(F, 'A').deliveredAt, 3);
});

// ── presets and steps ──

test('side-by-side: the two lanes run in lockstep; after 12 slots 0 vs 5 delivered', () => {
  const s = end(PRESETS['side-by-side']);
  assert.equal(s.slot, 12);
  assert.deepEqual(s.lanes.map((L) => L.mode), ['free', 'directed']);
  assert.deepEqual(s.lanes.map((L) => L.counts.delivered), [0, 5]);
  assert.deepEqual(slots(s.lanes[0], 'doubled'), [1, 4, 7, 10]);
  assert.deepEqual(s.lanes[1], end({ mode: 'directed' }).lanes[0]);
});

test('side by side: each lane equals its single-mode run for every backoff and size; a finished lane stops counting', () => {
  for (const b of ['same', 'mixed', 'spread']) {
    for (let n = 3; n <= 8; n++) {
      const N = logic.steps(P({ mode: 'both', backoff: b, stations: n }));
      const freeN = logic.steps(P({ mode: 'free', backoff: b, stations: n }));
      for (let k = 0; k <= Math.min(N, freeN); k++) {
        assert.deepEqual(at({ mode: 'both', backoff: b, stations: n }, k).lanes[0], at({ backoff: b, stations: n }, k).lanes[0], `${b} ${n} ${k}`);
      }
      assert.deepEqual(at({ mode: 'both', backoff: b, stations: n }, N).lanes[1], end({ mode: 'directed', backoff: b, stations: n }).lanes[0]);
    }
  }
  const s = end({ mode: 'both', backoff: 'spread' });
  assert.deepEqual(s.lanes[0].counts, end({ backoff: 'spread' }).lanes[0].counts, 'idle stops at the free lane\'s end');
  assert.equal(s.lanes[0].channel.length, 12, 'the strip still shows every slot');
});

test('steps: 20, 20, 7, 12, 12 for the presets; both runs each lane to its own end within 20', () => {
  assert.deepEqual(Object.values(PRESETS).map((o) => logic.steps(P(o))), [20, 20, 7, 12, 12]);
  assert.equal(logic.steps(P({ mode: 'both', backoff: 'spread', stations: 8 })), 18, 'free ends at 10, directed at 18');
  assert.equal(logic.steps(P({ mode: 'both', backoff: 'spread', stations: 3 })), 8, 'free ends at 5, directed at 8');
  for (let n = 3; n <= 8; n++) for (const b of ['same', 'mixed', 'spread']) for (const m of ['free', 'directed', 'both']) {
    const k = logic.steps(P({ mode: m, backoff: b, stations: n }));
    assert.ok(k >= 5 && k <= 20, `${m} ${b} ${n}: ${k}`);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS)) {
    for (let n = 0; n <= logic.steps(P(o)); n++) {
      const s = at(o, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of [PRESETS['side-by-side'], PRESETS['mixed-backoff']]) {
    const p = P(o);
    const N = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= N; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = N; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P(PRESETS['side-by-side']);
  const s5 = kit.stateAt(logic, p, 5);
  const copy = structuredClone(s5);
  logic.step(s5, 6, p);
  assert.deepEqual(s5, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model; meta.steps equals steps(defaults)', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const id of Object.keys(PRESETS)) {
    assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
    assert.ok(json.entries.some((e) => e.preset === id), `preset ${id} in sim.json entries`);
  }
});
