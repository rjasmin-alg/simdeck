// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for endianness: the rules of SPEC.md (tie-breaks first), the presets' numbers, then the generic block.
// Run: node --test sims/endianness/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.derive(P(over));
const preset = (id) => logic.presets.find((p) => p.id === id).params;
const hex = (bytes) => bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

function everyParams() {
  const out = [];
  for (const width of logic.WIDTHS) for (const value of logic.VALUE_IDS) for (const host of logic.HOSTS)
    for (const convert of [true, false]) for (const h of ['', '12345678', 'ABAB', '0x1', 'zz']) out.push({ width, value, host, convert, hex: h });
  return out;
}

// ── tie-breaks and edge cases first ──

test('tie-break: a palindrome value has equal strips, equal reads and no "changed" mark', () => {
  for (const host of logic.HOSTS) {
    const s = at({ width: 16, value: 'typed', hex: 'ABAB', host, convert: false });
    assert.deepEqual(s.bytesBE, s.bytesLE);
    assert.equal(s.readAs.withConversion, s.readAs.withoutConversion);
    assert.equal(s.differs, false);
    assert.equal(logic.readerChanged(P({ width: 16, value: 'typed', hex: 'ABAB', host, convert: true }),
      P({ width: 16, value: 'typed', hex: 'ABAB', host, convert: false })), false);
  }
  const z = at({ value: 'typed', hex: '' });
  assert.equal(z.value, 0);
  assert.deepEqual(z.bytesLE, [0, 0, 0, 0]);
});

test('width cut keeps the low bytes; a narrow value is padded with zero bytes on top', () => {
  const cut = at({ width: 16, value: 'ipv4' });
  assert.equal(cut.value, 0x051E);
  assert.equal(cut.cut, true);
  assert.deepEqual(cut.wire, [0x05, 0x1E]);
  const pad = at({ width: 32, value: 'port443', convert: false });
  assert.equal(pad.cut, false);
  assert.equal(hex(pad.wire), '00 00 01 BB');
  assert.equal(hex(pad.bytesLE), 'BB 01 00 00');
  assert.equal(pad.read, 0xBB010000);
});

test('typed digits: hex only, 0x dropped, at most 8, upper case, empty = 0', () => {
  assert.equal(logic.cleanHex('0xdead beef!'), 'DEADBEEF');
  assert.equal(logic.cleanHex('123456789A'), '12345678');
  assert.equal(logic.cleanHex('xyz'), '');
  assert.equal(logic.cleanHex(null), '');
  assert.equal(at({ value: 'typed', hex: 'c0a80001' }).value, 0xC0A80001);
  assert.equal(at({ value: 'typed', hex: '' }).value, 0);
});

test('"changed" marks the reader only when the convert toggle alone changed the value read', () => {
  const off = P(preset('ipv4-address'));
  const on = Object.assign({}, off, { convert: true });
  assert.equal(logic.readerChanged(off, on), true);
  assert.equal(logic.readerChanged(on, off), true);
  assert.equal(logic.readerChanged(null, on), false, 'no params before');
  assert.equal(logic.readerChanged(on, on), false, 'nothing changed');
  assert.equal(logic.readerChanged(off, Object.assign({}, on, { width: 16 })), false, 'another param changed too');
  const big = P(preset('big-host'));
  assert.equal(logic.readerChanged(big, Object.assign({}, big, { convert: false })), false, 'no-op on a big-endian host');
  const text = P(preset('text'));
  assert.equal(logic.readerChanged(text, Object.assign({}, text, { convert: false })), false, 'text');
});

test('width cut: a value that fits is never cut', () => {
  for (const value of ['ipv4', 'textbook', 'one', 'port443']) assert.equal(at({ width: 32, value }).cut, false, value);
  assert.equal(at({ width: 16, value: 'port443' }).cut, false);
  assert.equal(at({ width: 16, value: 'one' }).cut, false);
  assert.equal(at({ width: 16, value: 'textbook' }).cut, true);
});

test('"changed": any other param changing with the toggle is not the toggle\'s doing', () => {
  const off = P(preset('ipv4-address'));
  for (const patch of [{ host: 'big' }, { value: 'textbook' }, { value: 'typed', hex: 'AC10051E' }, { width: 16 }]) {
    const now = Object.assign({}, off, { convert: true }, patch);
    assert.notEqual(logic.derive(off).read, logic.derive(now).read, JSON.stringify(patch) + ' changes the read');
    assert.equal(logic.readerChanged(off, now), false, JSON.stringify(patch));
  }
  const typed = P({ value: 'typed', hex: '12345678', convert: false });
  assert.equal(logic.readerChanged(typed, Object.assign({}, typed, { convert: true, hex: '87654321' })), false, 'hex');
});

test('defaults and the first address are the SPEC\'s', () => {
  assert.deepEqual(logic.defaults, { width: 32, value: 'ipv4', host: 'little', convert: true, hex: '' });
  assert.equal(logic.BASE, 0x1000);
  const s = logic.derive(P());
  assert.equal(s.read, 0xAC10051E);
  assert.equal(s.dottedRead, '172.16.5.30');
  assert.equal(s.dottedOther, '30.5.16.172');
});

test('unknown value, width or host fall back to the defaults', () => {
  assert.deepEqual(at({ value: 'nope', width: 24, host: 'middle' }), at({}));
});

// ── rules ──

test('rule 1: big-endian puts the MSB at the lowest address, little-endian the LSB', () => {
  for (const p of everyParams()) {
    const s = logic.derive(P(p));
    if (s.text) continue;
    const n = s.width / 8;
    assert.equal(s.bytesBE[0], Math.floor(s.value / 2 ** (s.width - 8)), 'BE: MSB first');
    assert.equal(s.bytesLE[0], s.value % 256, 'LE: LSB first');
    assert.deepEqual(s.bytesLE, s.bytesBE.slice().reverse());
    assert.equal(s.bytesBE.length, n);
    assert.deepEqual(s.sigBE, [...Array(n).keys()]);
    assert.deepEqual(s.sigLE, [...Array(n).keys()].reverse());
    assert.deepEqual(s.hostBytes, s.hostOrder === 'big' ? s.bytesBE : s.bytesLE);
  }
});

test('rule 2: the wire carries the MSB first on every host (network byte order is big-endian)', () => {
  for (const p of everyParams()) {
    const s = logic.derive(P(p));
    assert.deepEqual(s.wire, s.bytesBE);
  }
  assert.deepEqual(at({ host: 'big' }).wire, at({ host: 'little' }).wire);
  for (const p of everyParams()) {
    const s = logic.derive(P(p));
    if (!s.text) assert.deepEqual(s.sigWire, [...Array(s.width / 8).keys()], 'wire: MSB first');
  }
});

test('rule 3: ntohl / htonl swap on a little-endian host, do nothing on a big-endian one, undo themselves', () => {
  assert.equal(logic.ntoh(0xAC10051E, 32, 'big'), 0xAC10051E);
  assert.equal(logic.ntoh(0xAC10051E, 32, 'little'), 0x1E0510AC);
  assert.equal(logic.ntoh(0x01BB, 16, 'little'), 0xBB01);
  assert.equal(logic.hton(0x01BB, 16, 'little'), 0xBB01);
  for (const v of [0, 1, 0x01BB, 0xAC10051E, 0xFFFFFFFF, 0x80000000]) for (const host of logic.HOSTS) {
    const w = v > 0xFFFF ? 32 : 16;
    assert.equal(logic.ntoh(logic.hton(v, w, host), w, host), v);
  }
  for (const p of everyParams()) {
    const s = logic.derive(P(p));
    if (s.text) continue;
    assert.equal(s.readAs.withConversion, s.value, 'with conversion the reader gets the value back');
    if (s.convert) assert.equal(s.read, s.value);
    assert.equal(s.fn, s.width === 32 ? 'ntohl' : 'ntohs');
  }
});

test('rule 4: a raw load reverses the bytes on a little-endian host, never the bits inside a byte', () => {
  for (const p of everyParams()) {
    const s = logic.derive(P(p));
    if (s.text) continue;
    const raw = logic.bytesOf(s.readAs.withoutConversion, s.width);
    if (s.hostOrder === 'big') assert.deepEqual(raw, s.bytesBE);
    else assert.deepEqual(raw, s.bytesBE.slice().reverse());
    // every byte of the raw read is one of the written bytes, unchanged (a bit reversal of 0x01 would be 0x80)
    for (const b of raw) assert.ok(s.bytesBE.includes(b));
  }
  assert.equal(logic.load([0x01, 0x00], 'little'), 0x0001);
  assert.equal(logic.load([0x01, 0x00], 'big'), 0x0100);
  assert.notEqual(at({ value: 'one', convert: false }).read, 0x80000000, 'not a bit reversal');
  assert.equal(at({ value: 'one', convert: false }).read, 0x01000000);
});

test('rule 4: the reader row colours each byte by where it came from', () => {
  assert.deepEqual(at({ host: 'little', convert: false }).sigRead, [3, 2, 1, 0]);
  assert.deepEqual(at({ host: 'little', convert: true }).sigRead, [0, 1, 2, 3]);
  assert.deepEqual(at({ host: 'big', convert: false }).sigRead, [0, 1, 2, 3]);
  for (const p of everyParams()) {
    const s = logic.derive(P(p));
    if (s.text) continue;
    s.readBytes.forEach((b, k) => assert.equal(b, s.bytesBE[s.sigRead[k]]));
  }
});

test('rule 5: text has no byte order: the same bytes in every row, no conversion', () => {
  for (const host of logic.HOSTS) for (const convert of [true, false]) for (const width of logic.WIDTHS) {
    const s = at({ value: 'http', host, convert, width });
    assert.equal(hex(s.bytesBE), '48 54 54 50');
    for (const row of [s.bytesLE, s.wire, s.hostBytes, s.readBytes]) assert.deepEqual(row, s.bytesBE);
    assert.equal(s.differs, false);
    assert.equal(s.fn, null);
    assert.equal(s.text, 'HTTP');
    for (const sig of [s.sigBE, s.sigLE, s.sigWire, s.sigRead]) assert.deepEqual(sig, [0, 1, 2, 3], 'by position');
    assert.equal(s.width, 32, 'four bytes');
  }
});

// ── presets: the task's numbers ──

test('preset ipv4-address: 172.16.5.30 read raw on a little-endian host is 30.5.16.172', () => {
  const s = logic.derive(P(preset('ipv4-address')));
  assert.equal(s.value, 0xAC10051E);
  assert.equal(s.value, 2886731038);
  assert.equal(s.dotted, '172.16.5.30');
  assert.equal(hex(s.wire), 'AC 10 05 1E');
  assert.equal(hex(s.bytesBE), 'AC 10 05 1E');
  assert.equal(hex(s.bytesLE), '1E 05 10 AC');
  assert.equal(s.read, 0x1E0510AC);
  assert.equal(s.read, 503648428);
  assert.equal(s.dottedRead, '30.5.16.172');
  assert.equal(s.dottedOther, '172.16.5.30');
});

test('preset port-443: 0x01BB read raw is 0xBB01 = 47 873', () => {
  const s = logic.derive(P(preset('port-443')));
  assert.equal(s.value, 443);
  assert.equal(hex(s.wire), '01 BB');
  assert.equal(hex(s.bytesLE), 'BB 01');
  assert.equal(s.read, 0xBB01);
  assert.equal(s.read, 47873);
  assert.equal(s.dotted, null);
  assert.equal(s.dottedRead, null);
  assert.equal(s.dottedOther, null);
});

test('preset textbook: 0x0A0B0C0D', () => {
  const s = logic.derive(P(preset('textbook')));
  assert.equal(hex(s.bytesBE), '0A 0B 0C 0D');
  assert.equal(hex(s.bytesLE), '0D 0C 0B 0A');
  assert.equal(s.read, 0x0A0B0C0D);
  assert.equal(s.readAs.withoutConversion, 0x0D0C0B0A);
  assert.equal(s.readAs.withoutConversion, 218893066);
});

test('preset big-host: memory equals the wire and ntohl is a no-op', () => {
  const s = logic.derive(P(preset('big-host')));
  assert.deepEqual(s.hostBytes, s.wire);
  assert.equal(s.readAs.withConversion, s.readAs.withoutConversion);
  assert.equal(s.read, 0xAC10051E);
});

test('preset params are the SPEC table\'s', () => {
  assert.deepEqual(Object.fromEntries(logic.presets.map((p) => [p.id, p.params])), {
    'ipv4-address': { width: 32, value: 'ipv4', host: 'little', convert: false },
    'port-443': { width: 16, value: 'port443', host: 'little', convert: false },
    textbook: { width: 32, value: 'textbook', host: 'little', convert: true },
    text: { width: 32, value: 'http', host: 'little', convert: true },
    'big-host': { width: 32, value: 'ipv4', host: 'big', convert: true }
  });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of everyParams()) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ width: 16, value: 'typed', hex: '12ab', host: 'big', convert: false });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k} is a model param`);
    assert.ok(logic.WIDTHS.includes(p.params.width));
    assert.ok(logic.VALUE_IDS.includes(p.params.value));
    assert.ok(logic.HOSTS.includes(p.params.host));
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  for (const v of logic.VALUE_IDS) for (const lang of ['hr', 'en']) assert.ok(strings[lang]['value_' + v], `${lang} ${v}`);
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
