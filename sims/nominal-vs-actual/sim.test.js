// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for nominal-vs-actual's model (rules in SPEC.md). Run: node --test sims/nominal-vs-actual/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const S = (over) => logic.compute(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} ≈ ${b} (±${tol})`);
const Mb = (bps) => bps / 1e6;
const seg = (st, kind) => st.segments.find((x) => x.kind === kind).bits;

// ── tie-breaks first ──

test('tie-break: a packet under 46 B is padded, and the padding is Ethernet overhead, not data', () => {
  const st = S({ packet: 20 });
  assert.equal(st.wireBytes, 46 + 18 + 20);
  assert.equal(st.padBytes, 26);
  assert.equal(st.dataBytes, 0, 'data never below zero: the 20 B are all IP header');
  const off = S({ packet: 20, l34: false });
  assert.equal(off.dataBytes, 20, 'padding is not data');
  assert.equal(off.wireBytes, 84);
  near(seg(off, 'l2'), 100e6 * (18 + 26) / 84, 1e-6, 'padding in the l2 segment');
  assert.equal(S({ packet: 46 }).padBytes, 0, '46 B needs no padding');
  assert.equal(S({ packet: 45 }).padBytes, 1);
});

test('tie-break: with the Ethernet header off there is no frame to pad', () => {
  const st = S({ packet: 20, l2: false });
  assert.equal(st.padBytes, 0);
  assert.equal(st.wireBytes, 20 + 20);
  assert.equal(S({ l2: false }).wireBytes, 1520);
});

test('tie-break: the share is max(2, n) on half duplex both ways and 1 on full duplex', () => {
  assert.equal(logic.shareOf(P({ duplex: 'half-both', stations: 1 })), 2);
  assert.equal(logic.shareOf(P({ duplex: 'half-both', stations: 2 })), 2);
  assert.equal(logic.shareOf(P({ duplex: 'half-both', stations: 3 })), 3);
  assert.equal(logic.shareOf(P({ duplex: 'full', stations: 1 })), 1);
  assert.equal(logic.shareOf(P({ duplex: 'full', stations: 8 })), 1, 'full duplex: nobody shares');
});

test('tie-break: changed ignores float noise and marks nothing without a "before"', () => {
  const a = S({});
  assert.deepEqual(logic.changed(null, a), []);
  assert.deepEqual(logic.changed(a, S({})), []);
  // the share segment is 0 bit/s here, so tiny differences are representable
  const b = JSON.parse(JSON.stringify(a));
  b.segments[4].bits = 5e-7;
  assert.deepEqual(logic.changed(b, a), [], 'under 1e-6 bit/s is noise');
  b.segments[4].bits = 2e-6;
  assert.deepEqual(logic.changed(b, a), ['share'], 'over 1e-6 bit/s is a change');
  b.segments[4].bits = 0.3;
  assert.deepEqual(logic.changed(b, a), ['share']);
});

test('changed: each toggle marks its own segment and data; loss adds retries; sharing adds share', () => {
  const a = S({});
  assert.deepEqual(logic.changed(a, S({ l1: false })), ['data', 'l34', 'l2', 'l1']);
  assert.deepEqual(logic.changed(a, S({ loss: 5 })), ['data', 'l34', 'l2', 'l1', 'retry']);
  assert.deepEqual(logic.changed(a, S({ duplex: 'half-both' })), ['data', 'l34', 'l2', 'l1', 'share']);
  assert.deepEqual(logic.changed(a, S({ unit: 'MB/s' })), [], 'the unit changes no segment');
  assert.deepEqual(logic.changed(a, S({ stations: 5 })), [], 'stations on full duplex change nothing');
});

// ── rules ──

test('rule 1: bytes on the wire = max(P, 46) + 18 + 20', () => {
  assert.equal(S({}).wireBytes, 1538);
  assert.equal(S({ packet: 46 }).wireBytes, 84);
  assert.equal(S({ packet: 1000 }).wireBytes, 1038);
  assert.equal(S({ l1: false }).wireBytes, 1518, 'the 1518-octet frame without preamble and gap');
  assert.equal(S({ packet: 46, l1: false }).wireBytes, 64, 'the 64-octet minimum frame');
  assert.equal(S({ l1: false, l2: false }).wireBytes, 1500);
});

test('rule 1: the frame\'s fields add up, in wire order', () => {
  const f = S({}).fields;
  assert.deepEqual(f.map((x) => x.field), ['preamble', 'dst', 'src', 'type', 'ip', 'tcp', 'data', 'fcs', 'gap']);
  assert.deepEqual(f.map((x) => x.bytes), [8, 6, 6, 2, 20, 20, 1460, 4, 12]);
  assert.deepEqual(S({ packet: 30, l1: false }).fields.map((x) => x.field), ['dst', 'src', 'type', 'ip', 'tcp', 'pad', 'fcs']);
  assert.deepEqual(S({ packet: 30, l34: false }).fields.map((x) => x.field), ['preamble', 'dst', 'src', 'type', 'data', 'pad', 'fcs', 'gap'], 'padding after the data');
});

test('rule 2: useful data = P − 40 with TCP/IP headers, P without', () => {
  assert.equal(S({}).dataBytes, 1460);
  assert.equal(S({ l34: false }).dataBytes, 1500);
  assert.equal(S({ packet: 46 }).dataBytes, 6);
  assert.equal(S({ packet: 46, l34: false }).dataBytes, 46);
});

test('rule 3: efficiency = data / wire; goodput = nominal × efficiency; frames/s = nominal / (8 × wire)', () => {
  const st = S({});
  near(st.efficiency, 1460 / 1538, 1e-15);
  near(Mb(st.goodputBps), 94.9285, 1e-4);
  near(st.fps, 8127.44, 0.01);
  near(st.frameTime, logic.transTime(1538, 100e6), 1e-18, 'frame time is the transmission delay');
  near(st.fps * st.frameTime, 1, 1e-12);
  near(S({ rate: 10 }).fps, 812.744, 0.001);
});

test('rule 4: n stations on a half-duplex medium each get goodput / n', () => {
  const st = S({ duplex: 'half-both', stations: 3 });
  near(Mb(st.achievedBps), 31.6428, 1e-4);
  near(Mb(st.perStationBps), 31.6428, 1e-4);
  near(Mb(S({ duplex: 'half-both', stations: 3, loss: 10 }).perStationBps), 31.6428, 1e-4, 'per station is before loss');
  near(Mb(seg(st, 'share')), 200 / 3, 1e-9);
  near(Mb(S({ duplex: 'half-both', stations: 8 }).achievedBps), 94.9285 / 8, 1e-4);
});

test('rule 5: full duplex gives the full rate; half duplex both ways halves it', () => {
  near(Mb(S({ duplex: 'full', stations: 6 }).achievedBps), 94.9285, 1e-4);
  near(Mb(S({ duplex: 'half-both' }).achievedBps), 47.4642, 1e-4);
  assert.equal(seg(S({}), 'share'), 0);
});

test('rule 6: loss p leaves goodput × (1 − p); the lost share is the retry segment', () => {
  near(Mb(S({ loss: 14 }).achievedBps), 81.6385, 1e-4);
  near(Mb(S({ loss: 7 }).achievedBps), 88.2835, 1e-4);
  near(Mb(seg(S({ loss: 7 }), 'retry')), 7, 1e-9);
  near(Mb(seg(S({ duplex: 'half-both', stations: 4, loss: 10 }), 'retry')), 2.5, 1e-9, 'retries come out of the own share');
  assert.equal(S({ loss: 0 }).achievedBps, S({}).goodputBps);
});

test('rule 7: MB/s = Mb/s ÷ 8', () => {
  near(logic.inUnit(S({ loss: 7 }).achievedBps, 'MB/s'), 11.0354, 1e-4);
  near(logic.inUnit(S({ rate: 1000, loss: 7 }).achievedBps, 'MB/s'), 110.354, 1e-3);
  near(logic.inUnit(8e6, 'MB/s'), 1, 1e-15);
  near(logic.inUnit(8e6, 'Mb/s'), 8, 1e-15);
});

test('rule 8: no line-coding segment; the nominal rate is already the data rate', () => {
  assert.deepEqual(S({}).segments.map((x) => x.kind), ['data', 'l34', 'l2', 'l1', 'share', 'retry']);
  // 10 Mb/s (Manchester, 20 Mbaud on the wire) still gives 10 Mb/s × efficiency, not half of it
  near(Mb(S({ rate: 10 }).achievedBps), 9.49285, 1e-5);
});

test('the bar: six segments always sum to the nominal rate, and data is the achieved throughput', () => {
  for (const rate of logic.RATES) for (const packet of [46, 100, 576, 1500]) for (const duplex of logic.DUPLEX)
    for (const stations of [1, 2, 5]) for (const loss of [0, 13, 30]) for (const l1 of [true, false]) for (const l34 of [true, false]) {
      const st = S({ rate, packet, duplex, stations, loss, l1, l34 });
      near(st.segments.reduce((a, x) => a + x.bits, 0), rate * 1e6, 1e-6, 'sum');
      near(seg(st, 'data'), st.achievedBps, 1e-6, 'data');
      st.segments.forEach((x) => assert.ok(x.bits >= 0));
    }
});

test('presets: the task\'s expected numbers', () => {
  const pr = (id) => logic.compute(P(logic.presets.find((x) => x.id === id).params));
  const e1 = pr('book-ex1');
  near(e1.efficiency * 100, 94.93, 0.005);
  near(Mb(e1.achievedBps), 94.93, 0.005);
  assert.equal(Math.round(e1.fps), 8127);
  const e4 = pr('book-ex4');
  near(Mb(e4.achievedBps), 88.28, 0.005);
  assert.equal(logic.sigText(logic.inUnit(e4.achievedBps, 'MB/s'), 4), '11.04');
  const tf = pr('tiny-frames');
  assert.equal(tf.dataBytes, 6);
  assert.equal(tf.wireBytes, 84);
  near(Mb(tf.achievedBps), 71.43, 0.005);
  assert.equal(Math.round(tf.fps), 1488095);
  const gf = pr('gigabit-full');
  assert.equal(logic.sigText(Mb(gf.achievedBps), 4), '949.3');
  assert.equal(logic.sigText(logic.inUnit(gf.achievedBps, 'MB/s'), 4), '118.7');
  assert.equal(logic.sigText(Mb(S({ rate: 1000, l1: false }).achievedBps), 4), '961.8');
  for (const x of logic.presets) assert.equal(P(x.params).unit, x.id === 'book-ex4' ? 'MB/s' : 'Mb/s', `${x.id} unit`);
  const sh = pr('shared-hub');
  assert.equal(logic.sigText(Mb(sh.achievedBps), 4), '31.64');
});

test('caption choice: sharing, then the two ends, then loss, then a toggle off, then the plain total', () => {
  const k = (over) => logic.captionKey(P(over), S(over));
  assert.equal(k({}), 'capTotal');
  assert.equal(k({ l1: false }), 'capOff');
  assert.equal(k({ l2: false }), 'capOff');
  assert.equal(k({ l34: false }), 'capOff');
  assert.equal(k({ loss: 1 }), 'capLoss', 'the smallest loss counts');
  assert.equal(k({ loss: 3, l2: false }), 'capLoss');
  assert.equal(k({ duplex: 'half-both', loss: 3 }), 'capDuplex');
  assert.equal(k({ duplex: 'half-both', stations: 2 }), 'capDuplex');
  assert.equal(k({ duplex: 'half-both', stations: 3, loss: 3 }), 'capShared');
  assert.equal(k({ duplex: 'full', stations: 3 }), 'capTotal');
});

test('display: significant digits without float noise', () => {
  assert.equal(logic.sigText(94.92847854, 4), '94.93');
  assert.equal(logic.sigText(94.92847854, 3), '94.9');
  assert.equal(logic.sigText(9.99996, 4), '10.00');
  assert.equal(logic.sigText(1000, 4), '1000');
  assert.equal(logic.sigText(0, 4), '0');
  assert.equal(logic.sigText(7.142857, 4), '7.143');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and deterministic', () => {
  for (const over of [{}, { packet: 20, l34: false }, { duplex: 'half-both', stations: 7, loss: 30, unit: 'MB/s' }]) {
    const s = logic.initial(P(over));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(logic.initial(P(over)), s);
  }
});

test('compute does not mutate its params', () => {
  const p = P({ loss: 5 });
  const copy = structuredClone(p);
  logic.compute(p);
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has its strings', () => {
  for (const pr of logic.presets) {
    for (const [k, v] of Object.entries(pr.params)) {
      assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
      assert.equal(typeof v, typeof logic.defaults[k], `${pr.id}: ${k} type`);
    }
    if ('rate' in pr.params) assert.ok(logic.RATES.includes(pr.params.rate));
    if ('duplex' in pr.params) assert.ok(logic.DUPLEX.includes(pr.params.duplex));
    if ('unit' in pr.params) assert.ok(logic.UNITS.includes(pr.params.unit));
    if ('packet' in pr.params) assert.ok(pr.params.packet >= 46 && pr.params.packet <= 1500 && pr.params.packet % 2 === 0);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + pr.id], `${lang} label ${pr.id}`);
      assert.ok(strings[lang]['hint_' + pr.id], `${lang} hint ${pr.id}`);
    }
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
