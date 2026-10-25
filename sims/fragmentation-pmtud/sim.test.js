// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fragmentation-pmtud's model (rules in SPEC.md). Run: node --test sims/fragmentation-pmtud/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const triples = (bs) => bs.map((b) => [b.len, b.offset, b.mf ? 1 : 0]);
const kinds = (s) => s.timeline.map((r) => r.k);

// ── tie-breaks first ──

test('tie-break: size exactly = effective MTU passes unfragmented', () => {
  const s = D({ size: 1476, mtuB: 1500, overhead: 24 });
  assert.equal(s.outcome, 'pass');
  assert.deepEqual(triples(s.onB), [[1476, 0, 0]]);
  assert.deepEqual(s.fragments, []);
  const t = D({ size: 1477, mtuB: 1500, overhead: 24 });
  assert.equal(t.outcome, 'fragment');
  assert.deepEqual(triples(t.fragments), [[1476, 0, 1], [21, 182, 0]]);
  // with DF too: equal passes, one more byte is dropped
  assert.equal(D({ size: 1400, mtuB: 1400, df: true }).outcome, 'pass');
  assert.equal(D({ size: 1401, mtuB: 1400, df: true }).outcome, 'pmtud');
});

test('tie-break: data per fragment rounds down to 8 bytes, so full fragments can be shorter than the MTU', () => {
  const s = D({ size: 1500, mtuB: 1496 });
  assert.equal(s.per, 1472);
  assert.deepEqual(triples(s.fragments), [[1492, 0, 1], [28, 184, 0]]);
  assert.deepEqual(triples(D({ size: 1500, mtuB: 1500, overhead: 4 }).fragments), [[1492, 0, 1], [28, 184, 0]], '802.1Q');
  for (const f of s.fragments.slice(0, -1)) assert.equal(f.data % 8, 0);
});

test('tie-break: data that divides exactly ends in a full last fragment, never an empty one', () => {
  const s = D({ size: 2980, mtuB: 1500 });
  assert.deepEqual(triples(s.fragments), [[1500, 0, 1], [1500, 185, 0]]);
  for (const f of s.fragments) assert.ok(f.data > 0);
});

test('tie-break: blocking ICMP changes nothing when no ICMP is sent (DF 0, or the packet fits)', () => {
  const a = D({ size: 1400, mtuB: 500 }), b = D({ size: 1400, mtuB: 500, icmpBlocked: true });
  assert.equal(b.outcome, 'fragment');
  assert.deepEqual(b.fragments, a.fragments);
  assert.deepEqual(kinds(b), kinds(a).concat('noIcmp'));
  assert.equal(b.icmp, null);
  const c = D({ df: true, icmpBlocked: true });
  assert.equal(c.outcome, 'pass');
  assert.deepEqual(kinds(c), ['handshake', 'send', 'forward', 'receive', 'noIcmp']);
});

// ── rules ──

test('rule 1: effective MTU = link MTU − overhead; a packet that fits passes unchanged', () => {
  for (const [ovh, eff] of [[0, 1500], [4, 1496], [8, 1492], [24, 1476], [50, 1450]]) {
    assert.equal(D({ overhead: ovh }).effMtu, eff);
  }
  const s = D({ size: 1200, mtuB: 1400, overhead: 50 });
  assert.equal(s.outcome, 'pass');
  assert.deepEqual(s.onB, [s.sent]);
  assert.deepEqual(kinds(s), ['send', 'forward', 'receive']);
});

test('rule 2: primjer-3, 1400 B into 500 → 500 (0, MF 1), 500 (60, MF 1), 440 (120, MF 0)', () => {
  const s = D({ size: 1400, mtuB: 500 });
  assert.equal(s.per, 480);
  assert.deepEqual(triples(s.fragments), [[500, 0, 1], [500, 60, 1], [440, 120, 0]]);
  assert.deepEqual(s.fragments.map((f) => f.start), [0, 480, 960], 'offset × 8 = first data byte');
  assert.equal(s.fragments.reduce((a, f) => a + f.data, 0), 1380, 'data is conserved');
  assert.equal(s.fragments.reduce((a, f) => a + f.len, 0), 1400 + 2 * 20, 'one 20 B header per extra fragment');
});

test('rule 2: just-over and gre-tunnel', () => {
  assert.deepEqual(triples(D({ size: 1600, mtuB: 1500 }).fragments), [[1500, 0, 1], [120, 185, 0]]);
  assert.deepEqual(triples(D({ size: 1500, mtuB: 1500, overhead: 24 }).fragments), [[1476, 0, 1], [44, 182, 0]]);
  assert.deepEqual(triples(D({ size: 1500, mtuB: 1500, overhead: 50 }).fragments), [[1444, 0, 1], [76, 178, 0]]);
});

test('rule 2: offsets count 8-byte units from the start of the data; only the last has MF 0', () => {
  const s = D({ size: 9000, mtuB: 576, overhead: 50 });
  assert.equal(s.fragments.length, 18);
  s.fragments.forEach((f, i) => {
    assert.equal(f.offset, i * 63);
    assert.equal(f.mf, i < 17);
    if (i < 17) assert.equal(f.len, 524);
  });
  assert.deepEqual(triples(s.fragments.slice(-1)), [[432, 1071, 0]]);
  const t = D({ size: 1500, mtuB: 68 });
  assert.equal(t.fragments.length, 31);
  assert.deepEqual(triples(t.fragments.slice(-1)), [[60, 180, 0]]);
});

test('rule 3: the destination reassembles; the timeline says so after R2 fragments', () => {
  const s = D({ size: 1400, mtuB: 500 });
  assert.deepEqual(kinds(s), ['send', 'fragment', 'reassemble']);
  assert.equal(s.timeline[1].who, 'r2');
  assert.equal(s.timeline[2].who, 'receiver');
  assert.equal(s.timeline[2].v.n, 3);
  assert.equal(s.timeline[0].v.df, false);
});

test('rule 4: DF set and too big → drop and ICMP 3/4 with the next-hop MTU (the tunnel\'s in a tunnel)', () => {
  const s = D({ mtuB: 1400, df: true });
  assert.deepEqual(s.icmp, { type: 3, code: 4, nextHopMtu: 1400, v6: false });
  assert.deepEqual(s.fragments, []);
  assert.equal(s.timeline[2].k, 'dropIcmp');
  assert.equal(s.timeline[2].mark, 'drop');
  assert.equal(D({ overhead: 24, df: true }).icmp.nextHopMtu, 1476);
});

test('rule 5: PMTUD lowers the path MTU to the reported value, MSS = PMTU − 40, and the resend passes', () => {
  const s = D({ mtuB: 1400, df: true });
  assert.equal(s.timeline[1].v.df, true, 'the segment is sent with DF = 1');
  assert.equal(s.outcome, 'pmtud');
  assert.equal(s.pmtu, 1400);
  assert.equal(s.mss, 1360);
  assert.deepEqual(triples(s.onB), [[1400, 0, 0]]);
  assert.deepEqual(kinds(s), ['handshake', 'send', 'dropIcmp', 'pmtu', 'resend']);
  assert.equal(D({ overhead: 24, df: true }).mss, 1436);
});

test('rule 6: black hole: the handshake passes, ICMP is lost, 3 retransmissions, nothing on link B', () => {
  const s = D({ mtuB: 1400, df: true, icmpBlocked: true });
  assert.equal(s.outcome, 'blackHole');
  assert.equal(s.handshake, 60);
  assert.ok(s.handshake <= s.effMtu);
  assert.deepEqual(kinds(s), ['handshake', 'send', 'dropIcmp', 'icmpLost', 'retry']);
  assert.equal(s.timeline[3].who, 'fw');
  assert.equal(s.timeline[4].v.times, 3);
  assert.equal(s.timeline[4].v.size, 1500, 'retries the same size');
  assert.deepEqual(s.onB, []);
  assert.equal(s.pmtu, null);
});

test('rule 7: an effective MTU under 68 is refused; 68 itself is allowed', () => {
  const s = D({ mtuB: 68, overhead: 24 });
  assert.equal(s.effMtu, 44);
  assert.equal(s.outcome, 'refused');
  assert.deepEqual(kinds(s), ['refused']);
  assert.deepEqual(s.onB, []);
  assert.equal(D({ mtuB: 68 }).outcome, 'fragment');
  assert.equal(D({ size: 68, mtuB: 68 }).outcome, 'pass');
});

test('rule 8: IPv6 routers never fragment: Packet Too Big, 40 B header, MSS = PMTU − 60, DF ignored', () => {
  const s = D({ mtuB: 1400, proto: 'ipv6' });
  assert.equal(s.hdr, 40);
  assert.deepEqual(s.icmp, { type: 2, code: 0, nextHopMtu: 1400, v6: true });
  assert.deepEqual(s.fragments, []);
  assert.equal(s.mss, 1340);
  assert.equal(s.handshake, 80);
  assert.deepEqual(D({ mtuB: 1400, proto: 'ipv6', df: true }), s, 'DF does not exist in IPv6');
  assert.equal(D({ mtuB: 1400, proto: 'ipv6', icmpBlocked: true }).outcome, 'blackHole');
  assert.equal(D({ size: 1400, mtuB: 1400, proto: 'ipv6' }).outcome, 'pass');
});

test('rule 8 edge: IPv6 refuses an effective MTU under 1280', () => {
  assert.equal(D({ mtuB: 1328, overhead: 50, proto: 'ipv6' }).outcome, 'refused');
  assert.equal(D({ mtuB: 1280, proto: 'ipv6' }).outcome, 'pmtud');
  assert.equal(D({ mtuB: 1280, proto: 'ipv4' }).outcome, 'fragment');
});

test('the timeline never has more than 5 rows', () => {
  for (const size of [68, 1400, 1500, 9000]) for (const mtuB of [68, 500, 1400, 1500]) for (const df of [false, true])
    for (const icmpBlocked of [false, true]) for (const proto of ['ipv4', 'ipv6']) for (const [overhead] of logic.OVERHEADS) {
      const s = D({ size, mtuB, df, icmpBlocked, proto, overhead });
      assert.ok(s.timeline.length >= 1 && s.timeline.length <= 5, JSON.stringify(s.timeline));
    }
});

test('timeline rows: who, mark and the numbers the page prints, for every outcome', () => {
  const rows = (over) => D(over).timeline.map((r) => [r.who, r.k, r.mark, r.v]);
  assert.deepEqual(rows({ size: 1400, mtuB: 500, overhead: 0, icmpBlocked: true }), [
    ['sender', 'send', 'info', { size: 1400, df: false, v6: false }],
    ['r2', 'fragment', 'info', { n: 3, eff: 500, per: 480 }],
    ['receiver', 'reassemble', 'ok', { n: 3, size: 1400 }],
    ['fw', 'noIcmp', 'info', {}]]);
  assert.deepEqual(rows({ size: 1200, mtuB: 1500, overhead: 24, df: true }), [
    ['sender', 'handshake', 'ok', { n: 60 }],
    ['sender', 'send', 'info', { size: 1200, df: true, v6: false }],
    ['r2', 'forward', 'ok', { size: 1200, eff: 1476 }],
    ['receiver', 'receive', 'ok', { size: 1200 }]]);
  assert.deepEqual(rows({ size: 1500, mtuB: 1500, overhead: 24, df: true }), [
    ['sender', 'handshake', 'ok', { n: 60 }],
    ['sender', 'send', 'info', { size: 1500, df: true, v6: false }],
    ['r2', 'dropIcmp', 'drop', { size: 1500, eff: 1476, type: 3, code: 4, v6: false }],
    ['sender', 'pmtu', 'icmp', { pmtu: 1476, mss: 1436 }],
    ['r2', 'resend', 'ok', { size: 1476, eff: 1476 }]]);
  assert.deepEqual(rows({ mtuB: 1400, proto: 'ipv6', icmpBlocked: true }), [
    ['sender', 'handshake', 'ok', { n: 80 }],
    ['sender', 'send', 'info', { size: 1500, df: false, v6: true }],
    ['r2', 'dropIcmp', 'drop', { size: 1500, eff: 1400, type: 2, code: 0, v6: true }],
    ['fw', 'icmpLost', 'silence', { type: 2, code: 0, v6: true }],
    ['sender', 'retry', 'stall', { size: 1500, times: 3 }]]);
  assert.deepEqual(rows({ mtuB: 1300, overhead: 24, proto: 'ipv6' }), [['r2', 'refused', 'drop', { eff: 1276, min: 1280, v6: true }]]);
  assert.deepEqual(rows({ mtuB: 68, overhead: 8 }), [['r2', 'refused', 'drop', { eff: 60, min: 68, v6: false }]]);
});

test('rule 5 in a tunnel: the path MTU and the resent packet are the tunnel\'s effective MTU', () => {
  const s = D({ overhead: 24, df: true });
  assert.equal(s.pmtu, 1476);
  assert.deepEqual(triples(s.onB), [[1476, 0, 0]]);
  assert.equal(s.onB[0].len, s.mss + 40);
});

test('fragment(): a packet exactly the effective MTU is one block, one byte more is two', () => {
  assert.deepEqual(triples(logic.fragment(1476, 1476, 20)), [[1476, 0, 0]]);
  assert.deepEqual(triples(logic.fragment(1477, 1476, 20)), [[1476, 0, 1], [21, 182, 0]]);
  // (1496 − 20) is not a multiple of 8: a packet of exactly 1496 must still pass whole
  assert.deepEqual(triples(logic.fragment(1496, 1496, 20)), [[1496, 0, 0]]);
});

test('scene constants and derived fields the page draws', () => {
  assert.ok(logic.LINK_A >= logic.RANGES.size[1], 'link A is never the bottleneck');
  assert.equal(logic.ID, 0x1c46);
  assert.deepEqual(logic.OVERHEADS.map((o) => o[1]), ['', '802.1Q', 'PPPoE', 'GRE', 'VXLAN']);
  assert.equal(D({ overhead: 24 }).tunnel, 'GRE');
  assert.deepEqual(logic.RANGES.mtuB, [68, 9000, 4]);
  assert.equal(D({ mtuB: 1400, df: true, icmpBlocked: true }).retries, 3);
  assert.equal(D({ mtuB: 1400, df: true }).retries, 0);
  const r = D({ mtuB: 68, overhead: 24 });
  assert.equal(r.fits, false);
  assert.equal(D({ size: 1000, mtuB: 1200, proto: 'ipv6' }).fits, false, 'refused even when the packet would fit');
  assert.deepEqual(D({ size: 1500, mtuB: 1500, overhead: 24 }).timeline[1].v, { n: 2, eff: 1476, per: 1456 });
  assert.equal(r.per, 0);
  assert.equal(D({ size: 9000, mtuB: 576, overhead: 50 }).per, 504);
});

// ── changed marks and drawing helpers ──

test('changed: nothing before → nothing; same → nothing; different blocks and rows by index', () => {
  const a = D({ size: 1400, mtuB: 500 });
  assert.deepEqual(logic.changed(null, a), { blocks: [], rows: [] });
  assert.deepEqual(logic.changed(a, D({ size: 1400, mtuB: 500 })), { blocks: [], rows: [] });
  const b = D({ size: 1440, mtuB: 500 });     // 3 fragments: the last grows 440 → 480
  assert.deepEqual(logic.changed(a, b).blocks, [2]);
  assert.deepEqual(logic.changed(a, b).rows, [0, 2]);
  const c = D({ size: 1600, mtuB: 500 });     // a fourth fragment appears
  assert.deepEqual(logic.changed(a, c).blocks, [2, 3]);
  // a tunnel in front changes how every block is drawn
  const d = D({ size: 1000, mtuB: 1500 }), e = D({ size: 1000, mtuB: 1500, overhead: 24 });
  assert.deepEqual(logic.changed(d, e).blocks, [0]);
  // blocking ICMP in the black hole changes rows 3 and 4 and empties link B
  const f = logic.changed(D({ mtuB: 1400, df: true }), D({ mtuB: 1400, df: true, icmpBlocked: true }));
  assert.deepEqual(f, { blocks: [], rows: [3, 4] });
  // rows added after a shorter "before" are marked
  assert.deepEqual(logic.changed(D({ size: 1400, mtuB: 500 }), D({ size: 1400, mtuB: 500, icmpBlocked: true })).rows, [3]);
  // MF alone, the data size alone (IPv4 → IPv6 header), and the resent tag alone each mark the block
  const g = { onB: [{ len: 1500, data: 1480, offset: 0, mf: false }], timeline: [], overhead: 0, outcome: 'pass' };
  const mfOnly = { ...g, onB: [{ ...g.onB[0], mf: true }] };
  assert.deepEqual(logic.changed(g, mfOnly).blocks, [0]);
  assert.deepEqual(logic.changed(D({ size: 1000 }), D({ size: 1000, proto: 'ipv6' })).blocks, [0]);
  assert.deepEqual(logic.changed(g, { ...g, outcome: 'pmtud' }).blocks, [0]);
});

test('visibleBlocks: all up to the limit, else two, a gap, two', () => {
  assert.deepEqual(logic.visibleBlocks(3, 4), [0, 1, 2]);
  assert.deepEqual(logic.visibleBlocks(4, 4), [0, 1, 2, 3]);
  assert.deepEqual(logic.visibleBlocks(5, 4), [0, 1, -1, 3, 4]);
});

test('every preset gives the task\'s numbers', () => {
  const by = (id) => logic.derive(P(logic.presets.find((x) => x.id === id).params));
  assert.deepEqual(triples(by('primjer-3').onB), [[500, 0, 1], [500, 60, 1], [440, 120, 0]]);
  assert.deepEqual(triples(by('just-over').onB), [[1500, 0, 1], [120, 185, 0]]);
  assert.deepEqual(triples(by('gre-tunnel').onB), [[1476, 0, 1], [44, 182, 0]]);
  assert.equal(by('pmtud').outcome, 'pmtud');
  assert.equal(by('pmtud').mss, 1360);
  assert.equal(by('black-hole').outcome, 'blackHole');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ size: 9000, mtuB: 576, overhead: 50 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model, on the controls\' scale, and named in both tables', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
    for (const k of ['size', 'mtuB']) {
      const [min, max, step] = logic.RANGES[k], v = p.params[k];
      assert.ok(v >= min && v <= max && (v - min) % step === 0, `${p.id} ${k}`);
    }
    assert.ok(logic.OVERHEADS.some((o) => o[0] === p.params.overhead), `${p.id} overhead`);
    for (const lang of ['hr', 'en']) assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
  }
  for (const k of ['size', 'mtuB']) {
    const [min, , step] = logic.RANGES[k];
    assert.equal((logic.defaults[k] - min) % step, 0, `default ${k} on the scale`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
