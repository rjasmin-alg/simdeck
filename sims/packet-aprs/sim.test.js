// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for packet-aprs. Run: node --test sims/packet-aprs/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in SPEC order, then the presets, then the
// template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const end = (over) => logic.run(P(over))[logic.MAX_SLOTS];
const at = (over, n) => kit.stateAt(logic, P(over), n);
const ev = (s, event) => s.log.filter((e) => e.event === event);
const brief = (s, event) => ev(s, event).map((e) => e.slot + ' ' + e.station);
const frame = (s, id) => logic.frameText(s.packets[id - 1]);

// A scene only the tests use, removed again afterwards.
function withScene(name, scene, fn) {
  logic.SCENES[name] = scene;
  try { return fn(); } finally { delete logic.SCENES[name]; }
}
const st = (id, kind, x, y, range) => ({ id, kind, x, y, range });

// ── tie-breaks ──

test('tie: two stations that find the channel idle in the same slot both start, even with CSMA on', () => {
  const scene = { min: 3, stations: [st('T1', 'tracker', 28, 34, 32), st('T2', 'tracker', 58, 34, 32), st('R', 'igate', 43, 10, 32)], beacons: [['T1', 1], ['T2', 1]] };
  withScene('t-tie', scene, () => {
    const s = end({ topology: 't-tie', csma: true });
    assert.deepEqual(brief(s, 'tx'), ['1 T1', '1 T2'], 'they hear each other, but neither heard the other start');
    assert.deepEqual(brief(s, 'defer'), []);
    assert.deepEqual(brief(s, 'collision'), ['2 R', '2 R']);
    assert.equal(s.delivered.length, 0);
  });
});

test('tie: carrier sense uses the previous slot only (a start in this slot is not heard yet)', () => {
  // csma preset: T2 ready at 2 hears T1 (started at 1) and waits; in slot 3 T1 is gone, so T2 starts
  const s = end({ topology: 'csma' });
  assert.deepEqual(brief(s, 'defer'), ['2 T2']);
  assert.deepEqual(brief(s, 'tx'), ['1 T1', '3 T2']);
});

test('tie: station order in the scene changes nothing but drawing order', () => {
  for (const name of Object.keys(logic.SCENES)) {
    const sc = logic.SCENES[name];
    const rev = Object.assign({}, sc, { stations: sc.stations.slice().reverse() });
    withScene('t-rev', rev, () => {
      for (const path of Object.keys(logic.PATHS)) {
        for (const csma of [true, false]) {
          const norm = (s) => s.log.map((e) => [e.slot, e.event, e.station, frame(s, e.pktId)].join(' ')).sort();
          assert.deepEqual(norm(end({ topology: 't-rev', path, csma })), norm(end({ topology: name, path, csma })), `${name} ${path} ${csma}`);
        }
      }
    });
  }
});

test('tie: a station that is still sending its packet does not start the next one', () => {
  for (const csma of [true, false]) {
    // two-hops, a second beacon ready at slot 2 while T1 still sends beacon 1 (slots 1-2): it starts at 3
    const s = end({ topology: 'two-hops', extra: '2', csma });
    assert.deepEqual(brief(s, 'tx').slice(0, 3), ['1 T1', '3 T1', '3 D1'], `csma ${csma}`);
  }
});

// ── rule 1: frame, first unused element, at most 8 path elements ──

test('rule 1: the text form is SRC>DEST,PATH:info and a station acts only on the first unused element', () => {
  const s0 = logic.initial(P({}));
  assert.equal(frame(s0, 1), 'T1>APRS,WIDE1-1,WIDE2-1:>1');
  assert.equal(logic.firstUnused(logic.pathOf('w1w2')), 0);
  const after = logic.digipeat(logic.pathOf('w1w2'), 0, 'D1').path;
  assert.equal(logic.firstUnused(after), 2, 'D1 and WIDE1* are used, WIDE2-1 is next');
  assert.equal(logic.firstUnused(logic.digipeat(after, 2, 'D2').path), -1);
  assert.equal(logic.firstUnused([]), -1);
  assert.equal(logic.firstUnused([{ call: 'X1', used: false }, { call: 'WIDE2', n: 2, N: 1, used: false }]), 0, 'any unused element counts, not only aliases');
  // a wide digi answers WIDE2-1 but not while WIDE1-1 is still first: in two-wides D2 and D3 never hear T1 anyway, so
  // check directly: the element a station looks at is path[firstUnused], not any matching one
  const p = logic.pathOf('w1w2');
  assert.equal(logic.answers('fill-in', p[logic.firstUnused(p)]), true);
  assert.equal(logic.answers('fill-in', p[1]), false);
});

test('rule 1: with 8 path elements a digipeater no longer inserts its call, it only decrements N', () => {
  const full = [];
  for (let i = 0; i < 7; i++) full.push({ call: 'X' + i, used: true });
  full.push({ call: 'WIDE7', n: 7, N: 2, used: false });
  const d = logic.digipeat(full, 7, 'D9');
  assert.equal(d.path.length, 8);
  assert.deepEqual(d.path.map(logic.elText).slice(-1), ['WIDE7-1']);
  assert.deepEqual(d.changed, [7]);
  const seven = full.slice(1);
  assert.equal(logic.digipeat(seven, 6, 'D9').path.length, 8, 'with 7 there is room for one more call');
});

// ── rule 2: which digipeater answers which alias ──

test('rule 2: a fill-in answers only WIDE1-1; a wide digi answers WIDE1-1 and WIDEn-N; used elements and calls never', () => {
  const el = (call, n, N, used) => ({ call, n, N, used: !!used });
  assert.equal(logic.answers('fill-in', el('WIDE1', 1, 1)), true);
  assert.equal(logic.answers('fill-in', el('WIDE2', 2, 1)), false);
  assert.equal(logic.answers('fill-in', el('WIDE2', 2, 2)), false);
  assert.equal(logic.answers('fill-in', el('WIDE7', 7, 7)), false);
  for (const e of [el('WIDE1', 1, 1), el('WIDE2', 2, 1), el('WIDE2', 2, 2), el('WIDE7', 7, 7), el('WIDE7', 7, 1)]) assert.equal(logic.answers('wide', e), true);
  assert.equal(logic.answers('wide', el('WIDE2', 2, 0, true)), false);
  assert.equal(logic.answers('wide', el('WIDE2', 2, 1, true)), false, 'a used element is never answered');
  assert.equal(logic.answers('wide', { call: 'D1', used: true }), false);
  assert.equal(logic.answers('tracker', el('WIDE1', 1, 1)), false);
  assert.equal(logic.answers('igate', el('WIDE1', 1, 1)), false);
  // malformed aliases: N above n, n above 7, N of 0
  assert.equal(logic.answers('fill-in', el('WIDE1', 1, 2)), false);
  assert.equal(logic.answers('wide', el('WIDE2', 2, 3)), false);
  assert.equal(logic.answers('wide', el('WIDE8', 8, 1)), false);
  assert.equal(logic.answers('wide', el('WIDE2', 2, 0)), false);
});

test('rule 2: in two-hops a WIDE2-2 beacon stops at the fill-in D1', () => {
  const s = end({ topology: 'two-hops', path: 'w22' });
  assert.deepEqual(brief(s, 'skip'), ['2 D1']);
  assert.deepEqual(brief(s, 'tx'), ['1 T1']);
  assert.equal(s.delivered.length, 0);
});

test('rule 2: without a path nobody repeats', () => {
  const s = end({ topology: 'two-hops', path: 'none' });
  assert.equal(frame(s, 1), 'T1>APRS:>1');
  assert.deepEqual(brief(s, 'skip'), ['2 D1']);
  assert.equal(ev(s, 'queue').length, 0);
});

// ── rule 3: rewriting the path ──

test('rule 3: insert the call before the alias, decrement N, WIDEn* when N reaches 0', () => {
  const a = logic.digipeat(logic.pathOf('w1w2'), 0, 'D1');
  assert.equal(a.path.map(logic.elText).join(','), 'D1,WIDE1*,WIDE2-1');
  assert.deepEqual(a.changed, [0, 1]);
  const b = logic.digipeat(a.path, 2, 'D2');
  assert.equal(b.path.map(logic.elText).join(','), 'D1,WIDE1*,D2,WIDE2*');
  assert.deepEqual(b.changed, [2, 3]);
  const c = logic.digipeat(logic.pathOf('w22'), 0, 'D1');
  assert.equal(c.path.map(logic.elText).join(','), 'D1,WIDE2-1');
  assert.equal(c.path[1].used, false);
  assert.equal(logic.digipeat(c.path, 1, 'D2').path.map(logic.elText).join(','), 'D1,D2,WIDE2*');
  assert.equal(logic.pathOf('w1w2')[0].N, 1, 'digipeat does not change its input');
});

// ── rule 4: duplicates ──

test('rule 4: a digipeater drops a copy of a packet it has already sent', () => {
  const s = end({ topology: 'two-hops' });
  assert.deepEqual(ev(s, 'dupe').map((e) => [e.slot, e.station, e.from, e.why]), [[6, 'D1', 'D2', 'sent']]);
});

test('rule 4: in the WIDE7-7 chain every digi drops the next one\'s copy, so each repeats once', () => {
  const s = end({ topology: 'wide7', path: 'w77' });
  assert.deepEqual(brief(s, 'dupe'), ['6 D1', '8 D2', '10 D3', '12 D4']);
  assert.deepEqual(brief(s, 'tx'), ['1 T1', '3 D1', '5 D2', '7 D3', '9 D4', '11 D5']);
});

test('rule 4: duplicate memory covers sent and heard-repeated copies for 30 s, not originals', () => {
  const k = 'T1>APRS:>1';
  assert.equal(logic.isDupe([{ key: k, slot: 1, how: 'sent' }], k, 5), true);
  assert.equal(logic.isDupe([{ key: k, slot: 1, how: 'digi' }], k, 5), true);
  assert.equal(logic.isDupe([{ key: k, slot: 1, how: 'orig' }], k, 5), false);
  assert.equal(logic.isDupe([{ key: k, slot: 1, how: 'sent' }], 'T1>APRS:>2', 5), false, 'another info is another packet');
  assert.equal(logic.isDupe([{ key: k, slot: 1, how: 'sent' }], k, 1 + logic.DUPE_SLOTS), false, 'forgotten after 30 s');
  assert.equal(logic.isDupe([{ key: k, slot: 1, how: 'sent' }], k, logic.DUPE_SLOTS), true);
  assert.equal(logic.DUPE_SLOTS * 0.25, 30);
});

test('rule 4: a second beacon has its own info and is not a duplicate', () => {
  const s = end({ topology: 'two-hops', extra: '8' });
  assert.equal(s.delivered.length, 2);
  assert.deepEqual(s.delivered.map((d) => d.slot), [6, 13]);
  assert.deepEqual(brief(s, 'dupe'), ['6 D1', '13 D1']);
});

// ── rule 5: carrier sense, collisions, hidden stations, half duplex ──

test('rule 5: CSMA on, T2 waits for T1 and both arrive; off, T2 overlaps T1\'s second slot and both are lost', () => {
  const on = end({ topology: 'csma' });
  assert.deepEqual(on.delivered.map((d) => d.slot), [2, 4]);
  assert.equal(ev(on, 'collision').length, 0);
  const off = end({ topology: 'csma', csma: false });
  assert.deepEqual(brief(off, 'tx'), ['1 T1', '2 T2']);
  assert.deepEqual(ev(off, 'collision').map((e) => [e.slot, e.station, e.from]), [[2, 'R', 'T1'], [3, 'R', 'T2']]);
  assert.equal(off.delivered.length, 0);
  assert.deepEqual(off.timeline.filter((x) => x.clash).map((x) => x.slot), [2]);
});

test('rule 5: hidden stations cannot defer for each other: CSMA on or off, both are lost at D1', () => {
  for (const csma of [true, false]) {
    const s = end({ topology: 'hidden', csma });
    assert.deepEqual(brief(s, 'tx'), ['1 T1', '1 T2']);
    assert.deepEqual(brief(s, 'collision'), ['2 D1', '2 D1']);
    assert.equal(ev(s, 'queue').length, 0);
    assert.equal(s.delivered.length, 0);
  }
});

test('rule 5: two wide digis hidden from each other both repeat in slots 5-6 and collide at R (CSMA on)', () => {
  const s = end({ topology: 'two-wides' });
  assert.deepEqual(brief(s, 'tx'), ['1 T1', '3 D1', '5 D2', '5 D3']);
  assert.deepEqual(brief(s, 'collision'), ['6 D1', '6 R', '6 D1', '6 R']);
  assert.equal(s.delivered.length, 0);
});

test('rule 5: a collision needs a listener that hears both; far apart, two transmissions both get through', () => {
  // wide7 + WIDE7-7, a second beacon at slot 7: T1 sends while D3 sends, but nobody hears both
  const s = end({ topology: 'wide7', path: 'w77', extra: '7' });
  assert.ok(brief(s, 'tx').includes('7 T1') && brief(s, 'tx').includes('7 D3'));
  assert.equal(ev(s, 'collision').length, 0);
  assert.ok(s.timeline.every((x) => !x.clash));
  assert.ok(ev(s, 'rx').some((e) => e.slot === 8 && e.station === 'D1' && s.packets[e.pktId - 1].seq === 2));
});

test('rule 5: carrier sense is local: a station does not wait for a transmission it cannot hear', () => {
  // wide7 + WIDE7-7, a second beacon ready at slot 8 while D3 sends (7-8) far away: T1 starts at once
  const s = end({ topology: 'wide7', path: 'w77', extra: '8' });
  assert.ok(brief(s, 'tx').includes('8 T1'));
  assert.deepEqual(brief(s, 'defer'), []);
});

test('range: two stations are in range only within the smaller of their two ranges', () => {
  const a = st('A', 'tracker', 0, 0, 10), b = st('B', 'wide', 20, 0, 30);
  assert.equal(logic.inRange(a, b), false);
  assert.equal(logic.inRange(b, a), false);
  assert.equal(logic.inRange(a, st('C', 'wide', 10, 0, 30)), true, 'exactly at the range counts');
  assert.equal(logic.inRange(a, a), false);
});

test('rule 5: a station that is transmitting is no listener for the clash mark', () => {
  // T1 — T2 — T3 in a row, all ready at slot 1: only T2 is in range of two, and T2 is sending itself
  const scene = { min: 3, stations: [st('T1', 'tracker', 10, 20, 22), st('T2', 'tracker', 30, 20, 22), st('T3', 'tracker', 50, 20, 22)], beacons: [['T1', 1], ['T2', 1], ['T3', 1]] };
  withScene('t-row', scene, () => {
    const s = end({ topology: 't-row' });
    assert.deepEqual(brief(s, 'tx'), ['1 T1', '1 T2', '1 T3']);
    assert.ok(s.timeline.every((x) => !x.clash));
  });
});

test('rule 5: a station that is transmitting cannot receive (half duplex)', () => {
  // two-hops, a second beacon at slot 3: T1 and D1 both start in slot 3; D1 misses T1's beacon 2
  const s = end({ topology: 'two-hops', extra: '3' });
  assert.deepEqual(brief(s, 'tx'), ['1 T1', '3 T1', '3 D1', '5 D2']);
  assert.deepEqual(ev(s, 'busy').map((e) => [e.slot, e.station, e.from]), [[4, 'D1', 'T1']]);
  assert.equal(s.delivered.length, 1, 'only beacon 1 arrives');
});

test('rule 5: half duplex covers both slots of the packet, not only its last one', () => {
  // two-hops, CSMA off, a second beacon at 4: D1 sends 3-4, T1 sends 4-5; D1 was sending in slot 4, so it is deaf
  const s = end({ topology: 'two-hops', csma: false, extra: '4' });
  assert.deepEqual(ev(s, 'busy').map((e) => [e.slot, e.station, e.from]), [[5, 'D1', 'T1']]);
  assert.ok(!ev(s, 'collision').some((e) => e.slot === 5 && e.station === 'D1'));
});

test('rule 5: the strip marks a slot when a listener hears two transmissions at once', () => {
  assert.deepEqual(end({ topology: 'hidden' }).timeline.filter((x) => x.clash).map((x) => x.slot), [1, 2]);
  assert.deepEqual(end({ topology: 'two-wides' }).timeline.filter((x) => x.clash).map((x) => x.slot), [5, 6]);
  assert.deepEqual(end({ topology: 'two-hops', extra: '3' }).timeline.filter((x) => x.clash).map((x) => x.slot), [], 'only T1 and D1, each deaf');
});

test('reception: a packet is lost if another one overlaps either of its two slots, at that receiver only', () => {
  const s = end({ topology: 'csma', csma: false });
  // T2's packet (slots 2-3) overlaps only slot 2 of T1's (1-2): both lost at R
  assert.deepEqual(ev(s, 'collision').map((e) => e.with), [['T2'], ['T1']]);
  assert.equal(ev(s, 'rx').length, 0);
});

// ── iGate ──

test('iGate: records the first copy of a packet once', () => {
  const scene = { min: 6, stations: [st('T1', 'tracker', 8, 30, 26), st('D1', 'fill-in', 30, 22, 30), st('D2', 'wide', 56, 18, 34), st('R', 'igate', 50, 34, 34)], beacons: [['T1', 1]] };
  withScene('t-igate', scene, () => {
    const s = end({ topology: 't-igate' });
    assert.deepEqual(brief(s, 'rx').filter((x) => x.endsWith('R')), ['4 R', '6 R']);
    assert.deepEqual(brief(s, 'deliver'), ['4 R']);
    assert.equal(frame(s, s.delivered[0].pktId), 'T1>APRS,D1,WIDE1*,WIDE2-1:>1');
  });
});

// ── presets (SPEC.md table) ──

test('preset two-hops: 3 transmissions in slots 1-2, 3-4, 5-6; delivered at 6 with D1,WIDE1*,D2,WIDE2*', () => {
  const s = end({ topology: 'two-hops' });
  assert.deepEqual(brief(s, 'tx'), ['1 T1', '3 D1', '5 D2']);
  assert.deepEqual(s.delivered.map((d) => [d.slot, frame(s, d.pktId)]), [[6, 'T1>APRS,D1,WIDE1*,D2,WIDE2*:>1']]);
  assert.equal(logic.steps(P({ topology: 'two-hops' })), 6);
});

test('preset wide7: WIDE2-2 gives 2 digi transmissions in 6 slots, WIDE7-7 gives 5 in 12; R gets it at 6 either way', () => {
  const a = end({ topology: 'wide7', path: 'w22' });
  const b = end({ topology: 'wide7', path: 'w77' });
  const digiTx = (s) => ev(s, 'tx').filter((e) => e.station !== 'T1').length;
  const busy = (s) => s.timeline.filter((x) => x.air.length).length;
  assert.equal(digiTx(a), 2);
  assert.equal(busy(a), 6);
  assert.equal(digiTx(b), 5);
  assert.equal(busy(b), 12);
  assert.deepEqual(a.delivered.map((d) => d.slot), [6]);
  assert.deepEqual(b.delivered.map((d) => d.slot), [6]);
  assert.equal(frame(a, a.delivered[0].pktId), 'T1>APRS,D1,D2,WIDE2*:>1');
  assert.equal(frame(b, b.packets.length), 'T1>APRS,D1,D2,D3,D4,D5,WIDE7-2:>1');
});

test('steps: 6, 6, 12, 4, 3 for the presets; the scene minimum or the last event, at most 20', () => {
  assert.deepEqual(['two-hops', 'two-wides', 'wide7', 'csma', 'hidden'].map((t) => logic.steps(P({ topology: t, path: t === 'wide7' ? 'w77' : 'w1w2' }))), [6, 6, 12, 4, 3]);
  assert.equal(logic.steps(P({ topology: 'wide7', path: 'w22' })), 6);
  assert.equal(logic.steps(P({ topology: 'csma', csma: false })), 4, 'the last event is in slot 3, the scene shows 4');
  assert.equal(logic.steps(P({ topology: 'two-hops', path: 'w22' })), 6);
  assert.equal(logic.steps(P({ topology: 'two-hops', extra: '8' })), 13);
  assert.equal(logic.steps(P({ topology: 'two-hops', extra: '18' })), 20, 'capped');
  assert.equal(logic.steps(P({})), logic.steps(logic.defaults));
});

test('extra beacons: parsed from the param, at most 4, invalid entries ignored', () => {
  assert.deepEqual(logic.extraOf({ extra: '' }), []);
  assert.deepEqual(logic.extraOf({ extra: '3.7' }), [3, 7]);
  assert.deepEqual(logic.extraOf({ extra: '3.x.0.2.5.6.9' }), [3, 2, 5, 6]);
  assert.deepEqual(logic.extraOf({}), []);
  assert.deepEqual(logic.extraOf({ extra: '25.3' }), [3], 'beyond the last slot is ignored');
  const s = logic.initial(P({ extra: '4' }));
  assert.deepEqual(s.stations[0].queue, [{ pkt: 1, readyAt: 1 }, { pkt: 2, readyAt: 4 }]);
});

test('extra beacons: numbered in time order whatever order the param lists them in', () => {
  const s = logic.initial(P({ extra: '9.4' }));
  const t1 = s.packets.filter((x) => x.src === 'T1').map((x) => [x.seq, s.stations[0].queue.find((q) => q.pkt === x.id).readyAt]);
  assert.deepEqual(t1.sort((a, b) => a[0] - b[0]), [[1, 1], [2, 4], [3, 9]]);
  const run = end({ extra: '9.4' });
  assert.deepEqual(ev(run, 'tx').filter((e) => e.station === 'T1').map((e) => run.packets[e.pktId - 1].seq), [1, 2, 3]);
});

test('cut: the 20-slot limit is reported when something is still queued or on the air', () => {
  const p = P({ topology: 'two-hops', extra: '17' });
  assert.equal(logic.steps(p), 20);
  assert.equal(logic.cut(kit.stateAt(logic, p, 20)), true);
  assert.equal(logic.cut(kit.stateAt(logic, P({}), 6)), false);
  assert.equal(logic.cut(end({ topology: 'wide7', path: 'w77' })), false);
});

test('scene geometry: links as SPEC.md lists them', () => {
  const links = (name) => {
    const s = logic.SCENES[name].stations, out = [];
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (logic.inRange(s[i], s[j])) out.push(s[i].id + '-' + s[j].id);
    return out.join(' ');
  };
  assert.equal(links('two-hops'), 'T1-D1 D1-D2 D2-R');
  assert.equal(links('two-wides'), 'T1-D1 D1-D2 D1-D3 D2-R D3-R');
  assert.equal(links('wide7'), 'T1-D1 D1-D2 D2-D3 D2-R D3-D4 D4-D5');
  assert.equal(links('csma'), 'T1-T2 T1-R T2-R');
  assert.equal(links('hidden'), 'T1-D1 D1-T2 D1-R');
});

// ── generic checks every sim keeps ──

const ALL = [];
for (const topology of Object.keys(logic.SCENES)) for (const path of Object.keys(logic.PATHS)) for (const csma of [true, false]) ALL.push({ topology, path, csma });
ALL.push({ topology: 'two-hops', extra: '2.3.9' }, { topology: 'wide7', path: 'w77', extra: '7' });

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over);
    const steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ topology: 'two-wides' });
  let s = logic.initial(p);
  for (let n = 1; n <= 6; n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const topos = [...html.matchAll(/topology: '([\w-]+)'/g)].map((m) => m[1]);
  for (const tp of topos) assert.ok(tp in logic.SCENES, `topology ${tp}`);
});
