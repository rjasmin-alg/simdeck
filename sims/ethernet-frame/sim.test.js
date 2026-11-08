// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ethernet-frame's model (SPEC.md). Run: node --test sims/ethernet-frame/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.derive(P(over));
const field = (s, id) => s.fields.find((f) => f.id === id);
const preset = (id) => at(logic.presets.find((p) => p.id === id).params);

// ── tie-breaks first ──

test('tie-break rule 4: 46 octets of data need no pad, 45 need one', () => {
  assert.equal(at({ payload: 46 }).padLen, 0);
  assert.equal(at({ payload: 45 }).padLen, 1);
  assert.equal(at({ payload: 45 }).frameLen, 64);
  assert.equal(at({ payload: 47 }).frameLen, 65);
});

test('tie-break rule 5: 1500 octets of data is a valid frame, 1501 is refused', () => {
  const ok = at({ payload: 1500 });
  assert.equal(ok.verdict, 'ok');
  assert.equal(ok.frameLen, 1518);
  const no = at({ payload: 1501 });
  assert.equal(no.verdict, 'too-long');
  assert.equal(no.fcsSent, null);
  assert.equal(no.fcsRecv, null);
  assert.equal(no.padLen, 0);
});

test('tie-break rule 6: 1500 is a length, 1536 a type, 1501–1535 neither', () => {
  assert.equal(logic.lengthType(1500), 'length');
  assert.equal(logic.lengthType(0), 'length');
  assert.equal(logic.lengthType(1501), 'undefined');
  assert.equal(logic.lengthType(1535), 'undefined');
  assert.equal(logic.lengthType(0x0600), 'type');
  assert.equal(logic.TYPE_MIN, 1536);
});

test('tie-break rule 9: all ones is broadcast, not multicast, although its I/G bit is 1', () => {
  assert.equal(logic.addrKind([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]), 'broadcast');
  assert.equal(logic.addrKind([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE]), 'multicast');
});

test('tie-break rule 10: a flipped bit past the end of a shorter frame takes the last covered bit', () => {
  const s = at({ payload: 46, flip: 99999 });
  assert.equal(s.coveredBits, 60 * 8);
  assert.equal(s.flipBit, 60 * 8 - 1);
  assert.equal(s.flipField, 'data');
  const padded = at({ payload: 10, flip: 99999 });
  assert.equal(padded.flipField, 'pad');
});

// ── rules ──

test('rule 1: field order and sizes', () => {
  const s = at({ payload: 100 });
  assert.deepEqual(s.fields.map((f) => [f.id, f.bytes]), [['dst', 6], ['src', 6], ['type', 2], ['data', 100], ['pad', 0], ['fcs', 4]]);
  assert.equal(logic.SIZE.pre, 7);
  assert.equal(logic.SIZE.sfd, 1);
  assert.deepEqual(s.fields.map((f) => f.from), [0, 6, 12, 14, 114, 114]);
});

test('rule 2: frame length counts destination to FCS; the preamble and SFD add 8 on the wire only', () => {
  const s = at({ payload: 100 });
  assert.equal(s.frameLen, 6 + 6 + 2 + 100 + 4);
  assert.equal(s.wireLen, s.frameLen + 8);
  assert.equal(logic.PREAMBLE, 8);
  assert.equal(s.fields.reduce((a, f) => a + f.bytes, 0), s.frameLen);
});

test('rule 3: minimum 64 and maximum 1518 octets', () => {
  assert.equal(logic.MIN_FRAME, 64);
  assert.equal(logic.MAX_FRAME, 1518);
  for (let n = 0; n <= 1500; n += 1) {
    const s = at({ payload: n });
    assert.ok(s.frameLen >= 64 && s.frameLen <= 1518, `data ${n}`);
  }
  assert.equal(at({ payload: 0 }).frameLen, 64);
});

test('rule 4: the pad is max(0, 46 − data) zero octets after the data, inside the FCS', () => {
  assert.equal(at({ payload: 0 }).padLen, 46);
  assert.equal(at({ payload: 28 }).padLen, 18);
  assert.equal(at({ payload: 40 }).padLen, 6);
  assert.equal(at({ payload: 600 }).padLen, 0);
  const s = at({ payload: 28 });
  assert.equal(field(s, 'pad').from, 14 + 28);
  // The pad is zeros and covered: CRC over dst..data plus 18 zero octets.
  const bytes = logic.DST.unicast.concat(logic.SRC, [0x08, 0x00], logic.payloadBytes(28), new Array(18).fill(0));
  assert.equal(s.fcsSent, '0x' + logic.crc32(bytes).toString(16).toUpperCase().padStart(8, '0'));
});

test('rule 5: refused data is drawn but not sent: no FCS, no flip', () => {
  const s = at({ payload: 1600, flip: 10 });
  assert.equal(s.verdict, 'too-long');
  assert.equal(s.flipBit, null);
  assert.equal(s.frameLen, 6 + 6 + 2 + 1600 + 4);
  assert.equal(logic.PAYLOAD_UI_MAX, 1600);
});

test('rule 6: the page\'s types are EtherTypes', () => {
  assert.equal(at({ type: 'ipv4' }).typeHex, '0x0800');
  assert.equal(at({ type: 'arp' }).typeHex, '0x0806');
  assert.equal(at({ type: 'ipv6' }).typeHex, '0x86DD');
  for (const k of ['ipv4', 'arp', 'ipv6']) assert.equal(at({ type: k }).typeKind, 'type');
});

test('rule 7: CRC-32 is the standard reflected one (test vector 123456789 → 0xCBF43926)', () => {
  assert.equal(logic.crc32([...Buffer.from('123456789')]), 0xCBF43926);
  assert.equal(logic.crc32([]), 0);
});

test('rule 7: the FCS covers destination through pad, so any change there changes it', () => {
  const base = at({}).fcsSent;
  assert.notEqual(at({ dst: 'broadcast' }).fcsSent, base);
  assert.notEqual(at({ type: 'arp' }).fcsSent, base);
  assert.notEqual(at({ payload: 29 }).fcsSent, base);
  // the FCS does not cover itself or the preamble: the sent FCS of a frame is the CRC over its first frameLen − 4 octets
  const s = at({ payload: 46 });
  const bytes = logic.DST.unicast.concat(logic.SRC, [0x08, 0x00], logic.payloadBytes(46));
  assert.equal(bytes.length, s.frameLen - 4);
  assert.equal(parseInt(s.fcsSent, 16), logic.crc32(bytes));
});

test('rule 7: one flipped bit makes the receiver\'s FCS differ and the frame is dropped; the sent FCS stays', () => {
  const clean = preset('full-frame');
  const hit = preset('bit-flip');
  assert.equal(hit.fcsSent, clean.fcsSent);
  assert.notEqual(hit.fcsRecv, hit.fcsSent);
  assert.equal(hit.verdict, 'fcs-error');
  assert.equal(hit.flipBit, 8000);
  assert.equal(hit.flipField, 'data');
  // every single-bit flip in a minimum frame is caught
  for (let k = 0; k < at({ payload: 0 }).coveredBits; k++) assert.equal(at({ payload: 0, flip: k }).verdict, 'fcs-error', `bit ${k}`);
});

test('rule 8: the page cannot make a frame under 64 octets', () => {
  for (let n = 0; n <= 46; n++) assert.ok(at({ payload: n }).frameLen >= 64);
});

test('rule 9: the destination tag from the I/G bit', () => {
  assert.equal(at({ dst: 'unicast' }).dstKind, 'unicast');
  assert.equal(at({ dst: 'multicast' }).dstKind, 'multicast');
  assert.equal(at({ dst: 'broadcast' }).dstKind, 'broadcast');
  assert.equal(at({}).srcKind, 'unicast');
  assert.equal(at({ dst: 'multicast' }).dst, '01-00-5E-00-00-01');
  assert.equal(logic.addrKind([0x3C, 0x52, 0x82, 0x1A, 0x0B, 0x77]), 'unicast');
  assert.equal(logic.addrKind([0x02, 0x1A, 0x2B, 0x3C, 0x4D, 0x5E]), 'unicast');
});

test('rule 10: the flip lands in the field that holds its octet', () => {
  assert.equal(at({ flip: 0 }).flipField, 'dst');
  assert.equal(at({ flip: 0 }).flipBit, 0);
  assert.equal(at({ flip: 6 * 8 }).flipField, 'src');
  assert.equal(at({ flip: 12 * 8 + 15 }).flipField, 'type');
  assert.equal(at({ flip: 14 * 8 }).flipField, 'data');
  assert.equal(at({ payload: 28, flip: 42 * 8 }).flipField, 'pad');
  assert.equal(at({ flip: -1 }).flipBit, null);
  assert.equal(at({ flip: -1 }).verdict, 'ok');
});

test('expected numbers of every preset (SPEC.md table)', () => {
  const want = {
    'arp-request': [18, 64, 72, '0x32FC7B2F', '0x32FC7B2F', 'ok'],
    'exact-minimum': [0, 64, 72, '0xC18171E0', '0xC18171E0', 'ok'],
    'tcp-ack': [6, 64, 72, '0x2DD9DBEF', '0x2DD9DBEF', 'ok'],
    'full-frame': [0, 1518, 1526, '0x3134C01E', '0x3134C01E', 'ok'],
    'bit-flip': [0, 1518, 1526, '0x3134C01E', '0xC65EAE2E', 'fcs-error'],
    'too-big': [0, 1519, 1527, null, null, 'too-long']
  };
  assert.deepEqual(logic.presets.map((p) => p.id), Object.keys(want));
  for (const [id, w] of Object.entries(want)) {
    const s = preset(id);
    assert.deepEqual([s.padLen, s.frameLen, s.wireLen, s.fcsSent, s.fcsRecv, s.verdict], w, id);
  }
  assert.equal(preset('arp-request').dstKind, 'broadcast');
  assert.equal(preset('arp-request').typeHex, '0x0806');
  assert.equal(at({ payload: 0 }).fcsSent, '0xD54BFF0D');
});

test('changed: fields whose size or value changed on the last edit', () => {
  const a = at({ payload: 28 });
  assert.deepEqual(logic.changed(null, a), []);
  assert.deepEqual(logic.changed(a, a), []);
  assert.deepEqual(logic.changed(a, at({ payload: 30 })), ['data', 'pad', 'fcs', 'recv']);
  assert.deepEqual(logic.changed(at({ payload: 100 }), at({ payload: 101 })), ['data', 'fcs', 'recv']);
  assert.deepEqual(logic.changed(a, at({ payload: 28, type: 'arp' })), ['type', 'fcs', 'recv']);
  assert.deepEqual(logic.changed(a, at({ payload: 28, dst: 'broadcast' })), ['dst', 'fcs', 'recv']);
  assert.deepEqual(logic.changed(a, at({ payload: 28, flip: 3 })), ['recv']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ payload: 1500, flip: 8000, dst: 'multicast' });
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
    assert.deepEqual(Object.keys(p.params).sort(), Object.keys(logic.defaults).sort(), `${p.id} sets every param`);
    const v = p.params.payload;
    assert.ok(Number.isInteger(v) && v >= 0 && v <= logic.PAYLOAD_UI_MAX, `${p.id} payload`);
    assert.ok(p.params.type in logic.ETHERTYPE, `${p.id} type`);
    assert.ok(p.params.dst in logic.DST, `${p.id} dst`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id.replace(/-/g, '_')], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id.replace(/-/g, '_')], `${lang} hint of ${p.id}`);
    }
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
