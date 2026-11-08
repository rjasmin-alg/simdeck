// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ipv4-header's model (SPEC.md). Run: node --test sims/ipv4-header/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.derive(P(over));
const preset = (id) => at(logic.presets.find((p) => p.id === id).params);
const hex = logic.hex4;

// ── tie-breaks first ──

test('tie-break rule 10: TTL and checksum are lit in every view that changes them, each computed', () => {
  assert.deepEqual(at({ view: 'hop' }).changed, ['ttl', 'checksum']);
  assert.deepEqual(at({ view: 'nat' }).changed, ['ttl', 'checksum', 'src']);
  assert.deepEqual(at({ view: 'fragment' }).changed, ['totalLength', 'flags', 'fragOffset', 'ttl', 'checksum']);
  assert.deepEqual(at({ view: 'role' }).changed, []);
});

test('tie-break rule 10: the card lists every situation in the order hop, fragment, NAT, or none', () => {
  assert.deepEqual(logic.situationsOf('ttl'), ['hop', 'fragment', 'nat']);
  assert.deepEqual(logic.situationsOf('checksum'), ['hop', 'fragment', 'nat']);
  assert.deepEqual(logic.situationsOf('src'), ['nat']);
  assert.deepEqual(logic.situationsOf('fragOffset'), ['fragment']);
  assert.deepEqual(logic.situationsOf('flags'), ['fragment']);
  assert.deepEqual(logic.situationsOf('totalLength'), ['fragment']);
  for (const f of ['version', 'ihl', 'tos', 'id', 'protocol', 'dst', 'options']) assert.deepEqual(logic.situationsOf(f), [], f);
  // the card's list does not depend on the view or DF shown
  assert.deepEqual(at({ view: 'role', field: 'ttl' }).situations, at({ view: 'fragment', df: true, field: 'ttl' }).situations);
});

test('tie-break rule 10: DSCP + ECN count as one field, DF + MF as one field', () => {
  const pk = logic.packetFor('role', {});
  assert.deepEqual(logic.changedFields(pk, [Object.assign({}, pk, { ecn: 3 })]), ['tos']);
  assert.deepEqual(logic.changedFields(pk, [Object.assign({}, pk, { dscp: 46 })]), ['tos']);
  assert.deepEqual(logic.changedFields(pk, [Object.assign({}, pk, { mf: true })]), ['flags']);
  assert.deepEqual(logic.changedFields(pk, [Object.assign({}, pk, { df: false })]), ['flags']);
});

test('tie-break rule 7: DF = 1 drops the packet and changes nothing; a packet that fits is one plain hop', () => {
  const s = preset('df');
  assert.equal(s.dropped, true);
  assert.deepEqual(s.after, []);
  assert.deepEqual(s.changed, []);
  const small = logic.packetFor('hop', {});
  const r = logic.fragment(small, 500);
  assert.equal(r.dropped, false);
  assert.deepEqual(r.fragments, [logic.hop(small)]);
  const exact = logic.seal(Object.assign({}, logic.packetFor('fragment', {}), { totalLength: 500 }));
  assert.deepEqual(logic.fragment(exact, 500).fragments, [logic.hop(exact)], 'exactly the MTU fits');
  const exactDf = logic.seal(Object.assign({}, exact, { df: true }));
  assert.equal(logic.fragment(exactDf, 500).dropped, false, 'exactly the MTU with DF passes');
  const over = logic.seal(Object.assign({}, exact, { totalLength: 501 }));
  assert.equal(logic.fragment(over, 500).fragments.length, 2, 'one octet over is fragmented');
});

// ── rules ──

test('rule 1: twelve fixed fields, in order, 160 bits in five 32-bit rows', () => {
  assert.deepEqual(logic.FIELDS.map((f) => [f.key, f.bits]), [
    ['version', 4], ['ihl', 4], ['tos', 8], ['totalLength', 16], ['id', 16], ['flags', 3], ['fragOffset', 13],
    ['ttl', 8], ['protocol', 8], ['checksum', 16], ['src', 32], ['dst', 32]]);
  assert.equal(logic.FIELDS.reduce((a, f) => a + f.bits, 0), 160);
  const rows = logic.rows();
  assert.equal(rows.length, 5);
  for (const r of rows) assert.equal(r.reduce((a, k) => a + logic.FIELDS.find((f) => f.key === k).bits, 0), 32);
  assert.equal(logic.headerBytes(logic.packetFor('role', {})).length, 20);
  assert.equal(logic.FIELD_KEYS.length, 13);
});

test('rule 1: the header bytes in wire order (Primjer 7 packet)', () => {
  assert.deepEqual(logic.headerBytes(logic.packetFor('role', {})), [
    0x45, 0x00, 0x04, 0xd8, 0x2a, 0x10, 0x40, 0x00, 0x40, 0x06, 0x87, 0x83,
    192, 168, 1, 10, 192, 168, 2, 50]);
  const frag = logic.fragment(logic.packetFor('fragment', {}), 500).fragments[1];
  assert.deepEqual(logic.headerBytes(frag).slice(4, 8), [0x2a, 0x11, 0x20, 60], 'ID, MF set, offset 60');
  assert.equal(logic.hex4(0x0a), '0x000a');
});

test('legend groups: addressing, fragmentation, lifetime and integrity, format', () => {
  const g = Object.fromEntries(logic.FIELDS.map((f) => [f.key, f.group]));
  assert.deepEqual(g, { version: 'format', ihl: 'format', tos: 'format', totalLength: 'format', protocol: 'format',
    id: 'frag', flags: 'frag', fragOffset: 'frag', ttl: 'life', checksum: 'life', src: 'addr', dst: 'addr' });
});

test('rule 2: IHL counts 32-bit words; data = total − IHL × 4; IHL < 5 is invalid', () => {
  const s = preset('read');
  assert.equal(s.packet.ihl, 5);
  assert.equal(s.packet.totalLength, 1240);
  assert.equal(s.header.headerBytes, 20);
  assert.equal(s.header.dataBytes, 1220);
  assert.equal(s.header.optionBytes, 0);
  const seven = at({ view: 'role', ihl: 7 });
  assert.equal(seven.header.headerBytes, 28);
  assert.equal(seven.header.optionBytes, 8);
  assert.equal(seven.header.dataBytes, 1212);
  assert.equal(logic.headerBytes(seven.packet).length, 28);
  assert.equal(logic.headerInfo(4, 500).valid, false);
  assert.equal(logic.headerInfo(5, 500).valid, true);
  assert.equal(logic.headerInfo(15, 500).headerBytes, 60);
  assert.equal(logic.headerInfo(16, 500).valid, false);
  assert.equal(logic.headerInfo(7, 500).dataBytes, 472);   // URM ch08 question 4
  const fifteen = at({ view: 'role', ihl: 15 });
  assert.equal(fifteen.packet.ihl, 15);
  assert.equal(logic.headerBytes(fifteen.packet).length, 60);
  assert.equal(fifteen.header.optionBytes, 40);
  assert.ok(logic.verifies(fifteen.packet));
});

test('rule 3: total length is 16 bits, at most 65 535 octets', () => {
  assert.equal(logic.MAX_TOTAL, 65535);
  assert.equal(logic.MAX_TOTAL, 2 ** logic.FIELDS.find((f) => f.key === 'totalLength').bits - 1);
});

test('rule 4: protocol numbers 1 ICMP, 6 TCP, 17 UDP', () => {
  assert.deepEqual(logic.PROTOCOLS, { 1: 'ICMP', 6: 'TCP', 17: 'UDP' });
  assert.equal(preset('read').protocolName, 'TCP');
  assert.equal(preset('hop').protocolName, 'ICMP');
  assert.equal(preset('fragment').protocolName, 'UDP');
});

test('rule 5: the type-of-service byte is DSCP (high 6 bits) + ECN (low 2 bits)', () => {
  const pk = Object.assign({}, logic.packetFor('role', {}), { dscp: 46, ecn: 1 });
  assert.equal(logic.headerBytes(pk)[1], (46 << 2) | 1);
  assert.equal(logic.headerBytes(pk)[1], 0xb9);
});

test('rule 6: a hop changes TTL 64 → 63 and the checksum, nothing else; addresses stay', () => {
  const s = preset('hop');
  const [a] = s.after;
  assert.equal(s.packet.ttl, 64);
  assert.equal(a.ttl, 63);
  assert.equal(hex(s.packet.checksum), '0x99f4');
  assert.equal(hex(a.checksum), '0x9af4');
  assert.equal(a.src, '192.168.1.10');
  assert.equal(a.dst, '192.168.2.20');
  const rest = Object.keys(s.packet).filter((k) => k !== 'ttl' && k !== 'checksum');
  for (const k of rest) assert.equal(a[k], s.packet[k], k);
});

test('rule 7: 1400 octets into MTU 500 gives three fragments 500, 500, 440 at offsets 0, 60, 120', () => {
  const s = preset('fragment');
  assert.equal(s.dropped, false);
  assert.deepEqual(s.after.map((f) => f.totalLength), [500, 500, 440]);
  assert.deepEqual(s.after.map((f) => f.fragOffset), [0, 60, 120]);
  assert.deepEqual(s.after.map((f) => f.fragOffset * 8), [0, 480, 960]);
  assert.deepEqual(s.after.map((f) => f.mf), [true, true, false]);
  assert.deepEqual(s.after.map((f) => f.id), [0x2a11, 0x2a11, 0x2a11]);
  assert.deepEqual(s.after.map((f) => f.ttl), [63, 63, 63]);
  assert.deepEqual(s.after.map((f) => hex(f.checksum)), ['0xab5b', '0xab1f', '0xcb1f']);
  assert.equal(s.after.reduce((a, f) => a + f.totalLength - f.ihl * 4, 0), 1380, 'all data is carried');
  for (const f of s.after) assert.ok(f.totalLength <= logic.MTU.seg2);
});

test('rule 7: data per fragment is a multiple of 8; the last keeps an MF the original had; offsets add up', () => {
  const pk = logic.seal(Object.assign({}, logic.packetFor('fragment', {}), { totalLength: 1000, mf: true, fragOffset: 100 }));
  const r = logic.fragment(pk, 299);   // (299 − 20) / 8 → 34 × 8 = 272
  assert.deepEqual(r.fragments.map((f) => f.totalLength - 20), [272, 272, 272, 164]);
  assert.deepEqual(r.fragments.map((f) => f.fragOffset), [100, 134, 168, 202]);
  assert.deepEqual(r.fragments.map((f) => f.mf), [true, true, true, true]);
});

test('rule 8: NAT rewrites the source, plus TTL and checksum; the destination stays', () => {
  const s = preset('nat');
  const [a] = s.after;
  assert.equal(s.packet.src, '192.168.1.10');
  assert.equal(a.src, '203.0.113.5');
  assert.equal(a.dst, '8.8.8.8');
  assert.equal(a.ttl, 63);
  assert.equal(hex(s.packet.checksum), '0x4ca0');
  assert.equal(hex(a.checksum), '0xd34c');
});

test('rule 9: checksum is the one\'s complement of the one\'s complement sum with the field at 0', () => {
  // RFC 1071 §3 example words 0001 f203 f4f5 f6f7 sum to 0xddf2 (one's complement sum)
  assert.equal(logic.sum16([0x00, 0x01, 0xf2, 0x03, 0xf4, 0xf5, 0xf6, 0xf7]), 0xddf2);
  const pk = logic.packetFor('role', {});
  assert.equal(hex(pk.checksum), '0x8783');
  assert.equal(hex(at({ view: 'role', ihl: 7 }).packet.checksum), '0x817f');
  assert.equal(hex(preset('df').packet.checksum), '0x86d7');
  assert.equal(hex(preset('fragment').packet.checksum), '0xc6d7');
  // a computed checksum verifies, its field ignored while computing, and any change breaks it
  assert.ok(logic.verifies(pk));
  assert.equal(logic.headerChecksum(Object.assign({}, pk, { checksum: 0x1234 })), pk.checksum);
  assert.ok(!logic.verifies(Object.assign({}, pk, { ttl: 63 })));
  for (const s of logic.presets.map((p) => at(p.params))) for (const a of s.after) assert.ok(logic.verifies(a));
});

test('presets: field and view as SPEC.md lists them', () => {
  const want = { read: ['ihl', 'role', false], hop: ['ttl', 'hop', false], fragment: ['fragOffset', 'fragment', false],
    nat: ['src', 'nat', false], df: ['flags', 'fragment', true] };
  assert.deepEqual(logic.presets.map((p) => p.id), Object.keys(want));
  for (const p of logic.presets) {
    const s = at(p.params);
    assert.deepEqual([s.selected, s.view, p.params.df], want[p.id], p.id);
  }
  assert.equal(preset('df').packet.df, true);
  assert.equal(preset('fragment').packet.df, false);
});

test('only the role view takes IHL from the param; an unknown field or view falls back', () => {
  assert.equal(at({ view: 'hop', ihl: 9 }).packet.ihl, 5);
  assert.equal(at({ view: 'role', ihl: 9 }).packet.ihl, 9);
  assert.equal(at({ field: 'nope' }).selected, 'ttl');
  assert.equal(at({ view: 'nope' }).view, 'role');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ view: 'fragment', field: 'flags' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset sets every param and is named in both tables; every field and view has its words', () => {
  for (const p of logic.presets) {
    assert.deepEqual(Object.keys(p.params).sort(), Object.keys(logic.defaults).sort(), `${p.id} sets every param`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const f of logic.FIELD_KEYS) {
      for (const k of ['f_', 'short_', 'role_']) assert.ok(strings[lang][k + f], `${lang} ${k}${f}`);
    }
    for (const v of logic.VIEWS) assert.ok(strings[lang]['view_' + v], `${lang} view_${v}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
