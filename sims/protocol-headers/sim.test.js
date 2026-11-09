// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the header poster. Run: node --test sims/protocol-headers/
// Order: tie-breaks (SPEC.md "Tie-breaks"), then rules 1–6, then the expected numbers of the examples and presets,
// then the generic block.
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
const S = (over) => logic.initial(P(over));
const hdr = (s, id) => s.headers.find((h) => h.id === id);
const fld = (s, key) => { const [h, f] = key.split('.'); return hdr(s, h).fields.find((x) => x.id === f); };
const ids = (h) => h.fields.map((f) => f.id);

// ── tie-breaks ──

test('tie-break: unknown compare, example or sel is none, none and no selection', () => {
  const base = S({});
  for (const k of ['constructor', '__proto__', 'toString', 'hasOwnProperty', '', 'x', null, undefined, 1, {}]) {
    const s = S({ compare: k, example: k, sel: k });
    assert.equal(s.compareId, null, String(k));
    assert.equal(s.compare, null, String(k));
    assert.equal(s.example, null, String(k));
    assert.equal(s.selected, null, String(k));
    assert.deepEqual(s, base, String(k));
  }
  for (const sel of ['ipv4', 'ipv4.', '.ttl', 'ipv4.ttl.x', 'ipv4.hopLimit', 'ipv6.ttl', 'IPV4.ttl', ' ipv4.ttl',
    'ipv4.constructor', '__proto__.ttl', 'constructor.constructor']) {
    assert.equal(S({ sel }).selected, null, sel);
  }
  assert.equal(S({ compare: 'none' }).compareId, null);
  assert.equal(S({ example: 'none' }).example, null);
});

test('tie-break: a selection outside the compared pair stays selected, has no partner, and is not drawn', () => {
  const s = S({ compare: 'tcp-udp', sel: 'ipv4.ttl' });
  assert.deepEqual(s.selected, { header: 'ipv4', field: 'ttl' });
  assert.equal(s.partner, null);
  assert.deepEqual(s.changed, ['ipv4.ttl']);
  assert.equal(hdr(s, 'ipv4').shown, false);
  assert.equal(fld(s, 'ipv4.ttl').mark, null);
});

test('tie-break: in compare mode only the selection and its partner are changed; one-side fields alone', () => {
  assert.deepEqual(S({ compare: 'ipv4-ipv6', sel: 'ipv6.hopLimit' }).changed, ['ipv6.hopLimit', 'ipv4.ttl']);
  assert.deepEqual(S({ compare: 'ipv4-ipv6', sel: 'ipv4.checksum' }).changed, ['ipv4.checksum']);
  assert.deepEqual(S({ compare: 'ipv4-ipv6', sel: 'ipv6.flowLabel' }).changed, ['ipv6.flowLabel']);
  // without compare, linked fields are not linked
  assert.deepEqual(S({ sel: 'ipv4.ttl' }).changed, ['ipv4.ttl']);
  assert.equal(S({ sel: 'ipv4.ttl' }).partner, null);
  // every field's own flags agree with the state's list
  for (const sel of ['ipv4.ttl', 'tcp.checksum', 'udp.length', 'eth.data']) {
    for (const compare of logic.COMPARE_IDS) {
      const s = S({ compare, sel });
      const flagged = s.headers.flatMap((h) => h.fields.filter((f) => f.changed).map((f) => f.key));
      assert.deepEqual(flagged.sort(), s.changed.slice().sort(), compare + ' ' + sel);
      assert.deepEqual(s.headers.flatMap((h) => h.fields.filter((f) => f.selected).map((f) => f.key)), [sel]);
    }
  }
});

test('tie-break: the ipv4-vs-ipv6 example without compare shows values in both IP headers, nesting in IPv4', () => {
  const s = S({ example: 'ipv4-vs-ipv6' });
  assert.equal(s.compare, null);
  assert.equal(hdr(s, 'ipv4').inUse, true);
  assert.equal(hdr(s, 'ipv6').inUse, true);
  assert.equal(fld(s, 'ipv4.ttl').value.text, '64');
  assert.equal(fld(s, 'ipv6.hopLimit').value.text, '64');
  assert.equal(s.nesting.ip, 'ipv4');
  assert.equal(hdr(s, 'udp').inUse, false);
});

test('tie-break: without an example the nesting stack follows the selected field', () => {
  assert.deepEqual([S({}).nesting.ip, S({}).nesting.transport], ['ipv4', 'tcp']);
  assert.deepEqual([S({ sel: 'ipv6.src' }).nesting.ip, S({ sel: 'ipv6.src' }).nesting.transport], ['ipv6', 'tcp']);
  assert.deepEqual([S({ sel: 'udp.length' }).nesting.ip, S({ sel: 'udp.length' }).nesting.transport], ['ipv4', 'udp']);
  assert.deepEqual([S({ sel: 'eth.fcs' }).nesting.ip, S({ sel: 'eth.fcs' }).nesting.transport], ['ipv4', 'tcp']);
  // an example's stack beats the selection
  assert.equal(S({ example: 'max-frame', sel: 'ipv6.src' }).nesting.ip, 'ipv4');
  assert.equal(S({ example: 'book-ipv4', sel: 'udp.length' }).nesting.transport, 'tcp');
});

test('tie-break: fields and headers are in wire order; compare links in the left header\'s order', () => {
  assert.deepEqual(logic.HEADER_IDS, ['eth', 'ipv4', 'ipv6', 'tcp', 'udp']);
  for (const h of logic.HEADERS) {
    const l = logic.LAYOUT[h.id];
    for (let i = 1; i < l.length; i++) assert.ok(l[i].offset > l[i - 1].offset, h.id + ' ' + l[i].id);
  }
  for (const c of Object.values(logic.COMPARES)) {
    const order = (hid, f) => logic.LAYOUT[hid].findIndex((x) => x.id === f);
    for (let i = 1; i < c.links.length; i++) {
      assert.ok(order(c.left, c.links[i][0]) > order(c.left, c.links[i - 1][0]));
    }
  }
});

test('tie-break: with no example nothing is dimmed and no box has a value', () => {
  const s = S({});
  for (const h of s.headers) {
    assert.equal(h.inUse, true, h.id);
    for (const f of h.fields) { assert.equal(f.value, null, f.key); assert.equal(f.wire, null, f.key); }
  }
});

// ── rule 1: Ethernet ──

test('rule 1: Ethernet fields, preamble and SFD not counted, frame 64…1518 with padding to 46', () => {
  const eth = logic.HEADERS[0];
  assert.deepEqual(ids(eth), ['preamble', 'sfd', 'dst', 'src', 'type', 'data', 'fcs']);
  assert.deepEqual(eth.fields.map((f) => f.octets), [7, 1, 6, 6, 2, 46, 4]);
  assert.deepEqual(eth.fields.filter((f) => f.counted === false).map((f) => f.id), ['preamble', 'sfd']);
  assert.deepEqual(eth.fields.find((f) => f.id === 'data').variable, { min: 46, max: 1500 });
  // offsets from the destination address; the preamble and SFD come before it
  assert.deepEqual(logic.LAYOUT.eth.map((f) => f.offset), [-8, -1, 0, 6, 12, 14, 60]);
  assert.deepEqual(logic.sizeOf(eth), { minOctets: 18, maxOctets: 18 });
  assert.equal(logic.MIN_FRAME, 64);
  assert.equal(logic.MAX_FRAME, 1518);
  assert.deepEqual(logic.frameOf(46), { data: 46, padding: 0, frame: 64 });
  assert.deepEqual(logic.frameOf(1500), { data: 1500, padding: 0, frame: 1518 });
  assert.deepEqual(logic.frameOf(40), { data: 40, padding: 6, frame: 64 });
  assert.deepEqual(logic.frameOf(0), { data: 0, padding: 46, frame: 64 });
  assert.deepEqual(logic.frameOf(45), { data: 45, padding: 1, frame: 64 });
  assert.deepEqual(logic.frameOf(47), { data: 47, padding: 0, frame: 65 });
  assert.equal(logic.frameOf(1501), null);
  // no frame is under 64 or over 1518
  for (let n = 0; n <= 1500; n++) {
    const f = logic.frameOf(n).frame;
    assert.ok(f >= 64 && f <= 1518, String(n));
  }
});

// ── rule 2: IPv4 ──

test('rule 2: IPv4 fields and widths, 20 octets without options, IHL and Total Length', () => {
  const h = logic.HEADERS[1];
  assert.deepEqual(ids(h), ['version', 'ihl', 'tos', 'totalLength', 'id', 'flags', 'fragOffset', 'ttl', 'protocol',
    'checksum', 'src', 'dst', 'options']);
  assert.deepEqual(h.fields.map((f) => f.bits), [4, 4, 8, 16, 16, 3, 13, 8, 8, 16, 32, 32, 32]);
  assert.deepEqual(logic.sizeOf(h), { minOctets: 20, maxOctets: 60 });
  assert.equal(S({}).headers[1].rows, 6);   // five rows + the options row
  assert.equal(logic.wordsToOctets(5), 20);
  assert.equal(logic.wordsToOctets(15), 60);
  assert.equal(logic.wordsToOctets(4), null);
  assert.equal(logic.wordsToOctets(16), null);
  assert.equal(logic.wordsToOctets(5.5), null);
  assert.equal(logic.ipv4Data(5, 1240), 1220);
  assert.equal(logic.ipv4Data(6, 1240), 1216);
  assert.equal(logic.ipv4Data(5, 19), null);
  assert.equal(logic.ipv4Data(5, 20), 0);   // a header with no data
  // the row layout: TTL row 2 bit 0, Protocol bit 8, Checksum bit 16; Flags at bit 16 of row 1
  const l = Object.fromEntries(logic.LAYOUT.ipv4.map((f) => [f.id, f]));
  assert.deepEqual([l.ttl.row, l.ttl.bit, l.protocol.bit, l.checksum.bit], [2, 0, 8, 16]);
  assert.deepEqual([l.flags.row, l.flags.bit, l.fragOffset.bit], [1, 16, 19]);
  assert.deepEqual([l.src.row, l.dst.row, l.options.row], [3, 4, 5]);
});

// ── rule 3: IPv6 ──

test('rule 3: IPv6 is 40 octets fixed: no checksum, no IHL, no fragmentation fields; addresses span four rows', () => {
  const h = logic.HEADERS[2];
  assert.deepEqual(ids(h), ['version', 'trafficClass', 'flowLabel', 'payloadLength', 'nextHeader', 'hopLimit', 'src', 'dst']);
  assert.deepEqual(h.fields.map((f) => f.bits), [4, 8, 20, 16, 8, 8, 128, 128]);
  assert.deepEqual(logic.sizeOf(h), { minOctets: 40, maxOctets: 40 });
  assert.equal(S({}).headers[2].rows, 10);
  for (const gone of ['checksum', 'ihl', 'id', 'flags', 'fragOffset', 'options']) assert.equal(logic.fieldOf('ipv6', gone), null, gone);
  assert.ok(!h.fields.some((f) => f.variable));
  const l = Object.fromEntries(logic.LAYOUT.ipv6.map((f) => [f.id, f]));
  assert.deepEqual([l.src.row, l.src.span, l.dst.row, l.dst.span], [2, 4, 6, 4]);
  // Payload Length does not count the 40-octet header: same segment, IPv4 Total Length − 20
  const s = S({ example: 'ipv4-vs-ipv6' });
  assert.equal(fld(s, 'ipv6.payloadLength').value.text, '1220');
  assert.equal(fld(s, 'ipv4.totalLength').value.text, '1240');
});

// ── rule 4: TCP ──

test('rule 4: TCP fields, 20 octets without options, Data Offset in 32-bit words, eight control bits', () => {
  const h = logic.HEADERS[3];
  assert.deepEqual(ids(h), ['srcPort', 'dstPort', 'seq', 'ack', 'offset', 'reserved', 'flags', 'window', 'checksum', 'urgent', 'options']);
  assert.deepEqual(h.fields.map((f) => f.bits), [16, 16, 32, 32, 4, 4, 8, 16, 16, 16, 32]);
  assert.deepEqual(logic.sizeOf(h), { minOctets: 20, maxOctets: 60 });
  assert.equal(S({}).headers[3].rows, 6);
  assert.equal(logic.wordsToOctets(6), 24);
  assert.equal(logic.wordsToOctets(10), 40);
  assert.deepEqual(logic.TCP_FLAGS, ['CWR', 'ECE', 'URG', 'ACK', 'PSH', 'RST', 'SYN', 'FIN']);
  assert.deepEqual(logic.tcpFlagNames(0x02), ['SYN']);
  assert.deepEqual(logic.tcpFlagNames(0x18), ['ACK', 'PSH']);
  assert.deepEqual(logic.tcpFlagNames(0x12), ['ACK', 'SYN']);
  assert.deepEqual(logic.tcpFlagNames(0xff), logic.TCP_FLAGS);
  const l = Object.fromEntries(logic.LAYOUT.tcp.map((f) => [f.id, f]));
  assert.deepEqual([l.offset.row, l.offset.bit, l.reserved.bit, l.flags.bit, l.window.bit], [3, 0, 4, 8, 16]);
});

// ── rule 5: UDP ──

test('rule 5: UDP is four 16-bit fields, 8 octets; Length counts header and data, at least 8', () => {
  const h = logic.HEADERS[4];
  assert.deepEqual(ids(h), ['srcPort', 'dstPort', 'length', 'checksum']);
  assert.deepEqual(h.fields.map((f) => f.bits), [16, 16, 16, 16]);
  assert.deepEqual(logic.sizeOf(h), { minOctets: 8, maxOctets: 8 });
  assert.equal(S({}).headers[4].rows, 2);
  assert.equal(fld(S({ example: 'max-frame' }), 'udp.length').value.text, '1480');
  assert.equal(fld(S({ example: 'max-frame' }), 'udp.checksum').value.note, 'pseudo');
});

// ── rule 6: network byte order ──

test('rule 6: multi-octet values are sent most significant octet first; part-octet fields show none', () => {
  assert.deepEqual(logic.bigEndian(1240, 2), [0x04, 0xd8]);
  assert.deepEqual(logic.bigEndian(0x0800, 2), [0x08, 0x00]);
  assert.deepEqual(logic.bigEndian(5001, 4), [0, 0, 0x13, 0x89]);
  assert.deepEqual(logic.bigEndian(64, 1), [0x40]);
  const s = S({ example: 'book-ipv4' });
  assert.deepEqual(fld(s, 'ipv4.totalLength').wire, ['04', 'D8']);
  assert.deepEqual(fld(s, 'ipv4.src').wire, ['C0', 'A8', '01', '0A']);
  assert.deepEqual(fld(s, 'eth.type').wire, ['08', '00']);
  assert.deepEqual(fld(s, 'eth.dst').wire, ['00', '00', '5E', '00', '53', '01']);
  assert.deepEqual(fld(s, 'tcp.dstPort').wire, ['00', '50']);
  assert.deepEqual(fld(s, 'tcp.flags').wire, ['18']);
  for (const k of ['ipv4.version', 'ipv4.ihl', 'ipv4.flags', 'ipv4.fragOffset', 'tcp.offset', 'tcp.reserved']) {
    assert.equal(fld(s, k).wire, null, k);
  }
  assert.deepEqual(logic.ipv6Bytes('2001:db8:1::10'), [0x20, 0x01, 0x0d, 0xb8, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10]);
  assert.deepEqual(logic.ipv6Bytes('::1'), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
  assert.equal(fld(S({ example: 'ipv4-vs-ipv6' }), 'ipv6.src').wire.length, 16);
  // whole octets that do not start on an octet boundary share octets with a neighbour: none either
  const v6 = S({ example: 'ipv4-vs-ipv6' });
  assert.equal(fld(v6, 'ipv6.trafficClass').wire, null);   // 8 bits at bit 4
  assert.equal(fld(v6, 'ipv6.flowLabel').wire, null);      // 20 bits at bit 12
  assert.deepEqual(fld(v6, 'ipv6.payloadLength').wire, ['04', 'C4']);
});

// ── layout, narrow fields and compare ──

test('layout: every 32-bit header fills whole rows; long fields start a row; a row-crossing field throws', () => {
  for (const h of logic.HEADERS.filter((x) => x.kind === 'bits')) {
    const total = h.fields.reduce((n, f) => n + f.bits, 0);
    assert.equal(total % 32, 0, h.id);
    for (const f of logic.LAYOUT[h.id]) assert.ok(f.bit + Math.min(f.bits, 32) <= 32, h.id + '.' + f.id);
  }
  assert.throws(() => logic.layout({ id: 'x', kind: 'bits', fields: [{ id: 'a', bits: 16 }, { id: 'b', bits: 32 }] }));
  assert.throws(() => logic.layout({ id: 'x', kind: 'bits', fields: [{ id: 'a', bits: 48 }] }));
  assert.throws(() => logic.layout({ id: 'x', kind: 'bits', fields: [{ id: 'a', bits: 24 }, { id: 'b', bits: 16 }] }));
});

test('narrow fields: 4 bits or fewer (1 octet in the strip) get numbers 1, 2, 3 per header, in wire order', () => {
  const narrow = (id) => logic.LAYOUT[id].filter((f) => f.narrow).map((f) => [f.id, f.narrow]);
  assert.deepEqual(narrow('eth'), [['sfd', 1]]);
  assert.deepEqual(narrow('ipv4'), [['version', 1], ['ihl', 2], ['flags', 3]]);
  assert.deepEqual(narrow('ipv6'), [['version', 1]]);
  assert.deepEqual(narrow('tcp'), [['offset', 1], ['reserved', 2]]);
  assert.deepEqual(narrow('udp'), []);
});

test('compare: links, renamed fields and one-side fields (SPEC.md "Compare")', () => {
  const m = (c, h, f) => logic.markOf(c, h, f);
  assert.deepEqual(m('ipv4-ipv6', 'ipv4', 'ttl'), { kind: 'renamed', partner: 'ipv6.hopLimit' });
  assert.deepEqual(m('ipv4-ipv6', 'ipv6', 'hopLimit'), { kind: 'renamed', partner: 'ipv4.ttl' });
  assert.deepEqual(m('ipv4-ipv6', 'ipv4', 'protocol'), { kind: 'renamed', partner: 'ipv6.nextHeader' });
  assert.deepEqual(m('ipv4-ipv6', 'ipv4', 'totalLength'), { kind: 'renamed', partner: 'ipv6.payloadLength' });
  assert.deepEqual(m('ipv4-ipv6', 'ipv4', 'tos'), { kind: 'renamed', partner: 'ipv6.trafficClass' });
  assert.deepEqual(m('ipv4-ipv6', 'ipv4', 'src'), { kind: 'same', partner: 'ipv6.src' });
  assert.deepEqual(m('ipv4-ipv6', 'ipv6', 'version'), { kind: 'same', partner: 'ipv4.version' });
  const gone = logic.LAYOUT.ipv4.filter((f) => m('ipv4-ipv6', 'ipv4', f.id).kind === 'left').map((f) => f.id);
  assert.deepEqual(gone, ['ihl', 'id', 'flags', 'fragOffset', 'checksum', 'options']);
  const added = logic.LAYOUT.ipv6.filter((f) => m('ipv4-ipv6', 'ipv6', f.id).kind === 'right').map((f) => f.id);
  assert.deepEqual(added, ['flowLabel']);
  assert.deepEqual(m('tcp-udp', 'udp', 'checksum'), { kind: 'same', partner: 'tcp.checksum' });
  assert.deepEqual(m('tcp-udp', 'udp', 'length'), { kind: 'right', partner: null });
  const tcpOnly = logic.LAYOUT.tcp.filter((f) => m('tcp-udp', 'tcp', f.id).kind === 'left').map((f) => f.id);
  assert.deepEqual(tcpOnly, ['seq', 'ack', 'offset', 'reserved', 'flags', 'window', 'urgent', 'options']);
  // not compared, or no compare
  assert.equal(m('tcp-udp', 'ipv4', 'ttl'), null);
  assert.equal(m(null, 'ipv4', 'ttl'), null);
  assert.equal(m('constructor', 'ipv4', 'ttl'), null);
  // every link names real fields
  for (const c of Object.values(logic.COMPARES)) for (const [l, r] of c.links) {
    assert.ok(logic.fieldOf(c.left, l), l);
    assert.ok(logic.fieldOf(c.right, r), r);
  }
  // compare shows only the two headers (and the Ethernet strip)
  assert.deepEqual(S({ compare: 'ipv4-ipv6' }).headers.filter((h) => h.shown).map((h) => h.id), ['eth', 'ipv4', 'ipv6']);
  assert.deepEqual(S({ compare: 'tcp-udp' }).headers.filter((h) => h.shown).map((h) => h.id), ['eth', 'tcp', 'udp']);
  assert.deepEqual(S({ compare: 'tcp-udp' }).compare, ['tcp', 'udp']);
  assert.ok(S({}).headers.every((h) => h.shown));
});

// ── expected numbers: the examples (SPEC.md "Examples") ──

test('numbers: each example\'s IP packet, padding, frame and nesting', () => {
  const want = {
    'book-ipv4': { packet: 1240, padding: 0, frame: 1258, segment: 1220, data: 1200, ip: 'ipv4', transport: 'tcp' },
    'book-tcp-offset': { packet: 44, padding: 2, frame: 64, segment: 24, data: 0, ip: 'ipv4', transport: 'tcp' },
    'min-frame': { packet: 40, padding: 6, frame: 64, segment: 20, data: 0, ip: 'ipv4', transport: 'tcp' },
    'max-frame': { packet: 1500, padding: 0, frame: 1518, segment: 1480, data: 1472, ip: 'ipv4', transport: 'udp' },
    'ipv4-vs-ipv6': { packet: 1240, padding: 0, frame: 1258, segment: 1220, data: 1200, ip: 'ipv4', transport: 'tcp' },
    'overhead': { packet: 1500, padding: 0, frame: 1518, segment: 1480, data: 1460, ip: 'ipv4', transport: 'tcp' }
  };
  assert.deepEqual(Object.keys(want), logic.EXAMPLE_IDS.slice(1));
  for (const [id, w] of Object.entries(want)) {
    const n = S({ example: id }).nesting;
    assert.deepEqual([n.packet, n.padding, n.frame, n.segment, n.data], [[w.packet, w.packet], [w.padding, w.padding],
      [w.frame, w.frame], [w.segment, w.segment], [w.data, w.data]], id);
    assert.deepEqual([n.ip, n.transport], [w.ip, w.transport], id);
    // the frame adds up: 14 + packet + padding + 4
    assert.equal(14 + n.packet[0] + n.padding[0] + 4, n.frame[0], id);
    assert.equal(n.ipHeader + n.segment[0], n.packet[0], id);
    assert.deepEqual([n.minFrame, n.maxFrame], [64, 1518]);
  }
});

test('numbers: book-ipv4 is Primjer 7 (IHL 5, 1240, the two addresses) with the header checksum 0x8783', () => {
  const s = S({ example: 'book-ipv4' });
  const val = (k) => fld(s, k).value.text;
  assert.equal(val('ipv4.ihl'), '5');
  assert.equal(val('ipv4.totalLength'), '1240');
  assert.equal(val('ipv4.src'), '192.168.1.10');
  assert.equal(val('ipv4.dst'), '192.168.2.50');
  assert.equal(logic.ipv4Data(Number(val('ipv4.ihl')), Number(val('ipv4.totalLength'))), 1220);
  assert.equal(val('ipv4.checksum'), '0x8783');   // the same packet and value as sims/ipv4-header
  assert.equal(val('ipv4.protocol'), '6');
  assert.equal(val('eth.type'), '0x0800');
  assert.equal(val('eth.data'), '1240');
  const sums = { 'book-tcp-offset': '0x8C2E', 'min-frame': '0x8C31', 'max-frame': '0x8671', 'ipv4-vs-ipv6': '0x877F', 'overhead': '0x867A' };
  for (const [id, c] of Object.entries(sums)) assert.equal(fld(S({ example: id }), 'ipv4.checksum').value.text, c, id);
});

test('numbers: book-tcp-offset is Primjer 5 (Data Offset 6 → 24 octets, 4 of options), padded to 64', () => {
  const s = S({ example: 'book-tcp-offset' });
  assert.equal(fld(s, 'tcp.offset').value.text, '6');
  assert.equal(logic.wordsToOctets(6) - 20, 4);
  assert.equal(fld(s, 'tcp.options').value.text, '4');
  assert.equal(fld(s, 'tcp.flags').value.text, 'SYN');
  assert.equal(fld(s, 'tcp.ack').value.text, '0');
  assert.equal(s.nesting.transportHeader, 24);
  assert.equal(fld(s, 'eth.data').value.text, '44 + 2');
  assert.equal(fld(s, 'eth.data').value.note, 'padded');
  assert.equal(fld(s, 'ipv4.totalLength').value.text, '44');
});

test('numbers: the example values SPEC.md states (chosen ones included)', () => {
  const b = S({ example: 'book-ipv4' });
  const val = (s, k) => fld(s, k).value;
  assert.deepEqual([val(b, 'tcp.seq').text, val(b, 'tcp.ack').text], ['1001', '5001']);
  const syn = S({ example: 'book-tcp-offset' });
  assert.deepEqual([val(syn, 'tcp.seq').text, val(syn, 'tcp.ack').text], ['1000', '0']);
  assert.deepEqual([val(b, 'tcp.srcPort').text, val(b, 'tcp.dstPort').text, val(b, 'tcp.window').text], ['49152', '80', '64240']);
  const u = S({ example: 'max-frame' });
  assert.deepEqual([val(u, 'udp.srcPort').text, val(u, 'udp.dstPort').text], ['49152', '50000']);
  assert.deepEqual([val(b, 'ipv4.flags').text, val(b, 'ipv4.flags').note], ['010', 'df']);
  assert.deepEqual([val(b, 'ipv4.ttl').text, val(b, 'ipv4.tos').text, val(b, 'ipv4.fragOffset').text], ['64', '0x00', '0']);
  const v6 = S({ example: 'ipv4-vs-ipv6' });
  assert.deepEqual([val(v6, 'ipv6.src').text, val(v6, 'ipv6.dst').text], ['2001:db8:1::10', '2001:db8:2::50']);
  assert.deepEqual([val(v6, 'ipv6.hopLimit').text, val(v6, 'ipv6.nextHeader').text, val(v6, 'ipv6.flowLabel').text], ['64', '6', '0x00000']);
  assert.deepEqual([val(b, 'eth.src').text, val(b, 'eth.dst').text], ['00-00-5E-00-53-0A', '00-00-5E-00-53-01']);
  // checksums over data the poster does not have: no number, a note
  for (const [s, k, note] of [[b, 'tcp.checksum', 'pseudo'], [u, 'udp.checksum', 'pseudo'], [b, 'eth.fcs', 'fcs']]) {
    assert.equal(val(s, k).note, note, k);
    assert.equal(fld(s, k).wire, null, k);
    assert.ok(!/[0-9]/.test(val(s, k).text), k);
  }
});

test('numbers: min-frame pads a 40-octet packet with 6; max-frame carries 1500; overhead is 58 of 1518', () => {
  const min = S({ example: 'min-frame' });
  assert.equal(fld(min, 'eth.data').value.text, '40 + 6');
  assert.equal(fld(min, 'tcp.flags').value.text, 'ACK');
  const max = S({ example: 'max-frame' });
  assert.equal(fld(max, 'eth.data').value.text, '1500');
  assert.equal(fld(max, 'ipv4.protocol').value.text, '17');
  assert.equal(fld(max, 'ipv4.protocol').value.note, 'udp');
  assert.equal(hdr(max, 'tcp').inUse, false);
  assert.equal(fld(max, 'tcp.seq').value, null);
  const o = S({ example: 'overhead' }).nesting;
  assert.equal(o.frame[0] - o.data[0], 58);
  assert.equal(14 + 20 + 20 + 1460 + 4, 1518);
  assert.equal(Math.round(o.data[0] / o.frame[0] * 1000) / 10, 96.2);
});

test('numbers: without an example the nesting is a range per stack (SPEC.md "The nesting strip")', () => {
  // stack: [max data, min frame, min packet, padding at the min packet, transport header]
  const want = { 'ipv4/tcp': [1460, 64, 40, 6, 20], 'ipv4/udp': [1472, 64, 28, 18, 8], 'ipv6/tcp': [1440, 78, 60, 0, 20],
    'ipv6/udp': [1452, 66, 48, 0, 8] };
  for (const [k, [maxData, minFrame, minPacket, pad, tH]] of Object.entries(want)) {
    const [ip, tr] = k.split('/');
    const n = logic.nestingOf(null, ip, tr);
    assert.deepEqual(n.data, [0, maxData], k);
    assert.deepEqual(n.frame, [minFrame, 1518], k);
    assert.deepEqual(n.packet, [minPacket, 1500], k);
    assert.deepEqual(n.padding, [pad, 0], k);
    assert.deepEqual(n.segment, [tH, tH + maxData], k);
    assert.equal(n.transportHeader, tH, k);
  }
});

test('numbers: in-use headers per example', () => {
  const use = (id) => S({ example: id }).headers.filter((h) => h.inUse).map((h) => h.id);
  assert.deepEqual(use('book-ipv4'), ['eth', 'ipv4', 'tcp']);
  assert.deepEqual(use('max-frame'), ['eth', 'ipv4', 'udp']);
  assert.deepEqual(use('ipv4-vs-ipv6'), ['eth', 'ipv4', 'ipv6', 'tcp']);
  // a header in use has a value in every box; one not in use has none
  for (const id of logic.EXAMPLE_IDS.slice(1)) {
    for (const h of S({ example: id }).headers) for (const f of h.fields) assert.equal(f.value !== null, h.inUse, id + ' ' + f.key);
  }
});

// ── generic checks every sim keeps ──

test('a reference page: no steps, and step changes nothing', () => {
  assert.equal(logic.steps, 0);
  const s = S({ example: 'book-ipv4', sel: 'ipv4.ihl' });
  assert.deepEqual(logic.step(s, 1, P({})), s);
});

test('state is JSON-safe for every param combination', () => {
  for (const compare of logic.COMPARE_IDS) for (const example of logic.EXAMPLE_IDS) for (const sel of ['', 'ipv4.ttl', 'eth.data', 'udp.length']) {
    const s = S({ compare, example, sel });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('deterministic, and the model data is not mutated', () => {
  const snap = () => JSON.stringify({ h: logic.HEADERS, l: logic.LAYOUT, c: logic.COMPARES, e: logic.EXAMPLES });
  const before = snap();
  const a = S({ example: 'ipv4-vs-ipv6', compare: 'ipv4-ipv6', sel: 'ipv4.ttl' });
  a.headers[1].fields[0].bits = 99;
  a.headers[1].fields[0].variable = 'x';
  a.headers[1].fields[12].variable.max = 1;
  a.headers[1].fields[3].wire.push('x');
  a.nesting.data.push(1);
  a.changed.push('x');
  assert.deepEqual(S({ example: 'ipv4-vs-ipv6', compare: 'ipv4-ipv6', sel: 'ipv4.ttl' }),
    logic.initial(P({ example: 'ipv4-vs-ipv6', compare: 'ipv4-ipv6', sel: 'ipv4.ttl' })));
  assert.equal(snap(), before);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every header, field, value note, compare mark and example has its words in both languages', () => {
  for (const lang of ['hr', 'en']) {
    const T = strings[lang];
    for (const h of logic.HEADERS) {
      assert.ok(T['h_' + h.id], lang + ' h_' + h.id);
      for (const f of h.fields) {
        for (const pre of ['n_', 'f_', 'd_']) assert.ok(T[pre + h.id + '_' + f.id], lang + ' ' + pre + h.id + '_' + f.id);
      }
    }
    for (const id of logic.EXAMPLE_IDS.slice(1)) {
      const s = S({ example: id });
      for (const h of s.headers) for (const f of h.fields) if (f.value && f.value.note) assert.ok(T['v_' + f.value.note], lang + ' v_' + f.value.note);
      assert.ok(T['cap_' + id], lang + ' cap_' + id);
      assert.ok(T['p_' + id], lang + ' p_' + id);
      assert.ok(T['ph_' + id], lang + ' ph_' + id);
    }
    for (const c of logic.COMPARE_IDS) {
      assert.ok(T['cmp_' + c], lang + ' cmp_' + c);
      if (c !== 'none') for (const k of ['left', 'right']) assert.ok(T['mk_' + c + '_' + k], lang + ' mk_' + c + '_' + k);
    }
  }
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'reference');
  assert.equal(meta.steps, undefined);
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.equal(presets.length, 6);
  const seen = [];
  for (const body of presets) {
    const p = {};
    for (const [, k, v] of body.matchAll(/(\w+):\s*'([^']*)'/g)) {
      assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
      p[k] = v;
    }
    const s = S(p);
    assert.ok(s.example, 'preset sets an example: ' + body);
    seen.push(s.example);
    // the preset selects the example's focus field, and sets compare when the example compares
    assert.equal(p.sel || null, logic.EXAMPLES[s.example].focus, s.example);
    assert.equal(s.compareId, logic.EXAMPLES[s.example].compare || null, s.example);
  }
  assert.deepEqual(seen, logic.EXAMPLE_IDS.slice(1));
});
