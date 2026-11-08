// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ipv6-address-types. Run: node --test sims/ipv6-address-types/
// Rules and numbers: SPEC.md. Tie-breaks first, then one test per rule, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => kit.stateAt(logic, P(over), 0);
const of = (a) => logic.classify(logic.parse(a).groups);

// ── tie-breaks ──

test('rule 1 tie-break: the longest matching prefix wins (2001:db8::/32 beats 2000::/3)', () => {
  const s = of('2001:db8:85a3::8a2e:370:7334');
  assert.equal(s.type, 'doc');
  assert.equal(s.matchedPrefix, '2001:db8::/32');
  assert.deepEqual(s.matches, ['doc', 'gua']);
  assert.equal(s.reach, 'none');
  assert.equal(s.note, 'doc-in-gua');
  // one bit outside the /32 is a GUA again
  assert.equal(of('2001:db9::1').type, 'gua');
  assert.equal(of('2001:db7:ffff::1').type, 'gua');
});

test('rule 1 tie-break: 3fff::/20 (documentation) beats 2000::/3, but only for its first 20 bits', () => {
  assert.equal(of('3fff::1').type, 'doc2');
  assert.deepEqual(of('3fff:fff::1').matches, ['doc2', 'gua']);
  assert.equal(of('3fff:1000::1').type, 'gua');
  assert.equal(of('3fff::1').note, 'doc-in-gua');
});

test('rule 1 tie-break: ::1/128 and ::/128 are exact; one bit off either is not assigned', () => {
  assert.deepEqual(of('::1').matches, ['loopback']);
  assert.deepEqual(of('::').matches, ['unspecified']);
  assert.equal(of('::2').type, 'other');
  assert.equal(of('::1:0').type, 'other');
  assert.equal(of('1::').type, 'other');
});

test('nearest row of an unassigned address: the largest share of the prefix matched, ties in table order', () => {
  // 4000 = 0100: one of 2000::/3's three bits (1/3) beats one of ::/128's 128
  assert.deepEqual(of('4000::1').nearest, { row: 'gua', same: 1, diff: 1 });
  // fec0 is nine of fe80::/10's ten bits
  assert.deepEqual(of('fec0::1').nearest, { row: 'link-local', same: 9, diff: 9 });
  // ::2 differs from ::/128 and ::1/128 at the same bit 126: the table's first row
  assert.deepEqual(of('::2').nearest, { row: 'unspecified', same: 126, diff: 126 });
  // e000 = 1110: three of fc00::/7's seven (3/7) beats three of ff00::/8's eight
  assert.equal(of('e000::').nearest.row, 'ula');
  assert.equal(of('fe80::1').nearest, null, 'a matched address has no nearest');
});

test('fec0::/10 (the deprecated site-local range) gets its own note; its neighbours do not', () => {
  assert.equal(of('fec0::1').note, 'site-local-deprecated');
  assert.equal(of('feff:ffff::1').note, 'site-local-deprecated');
  assert.equal(of('fe00::1').note, 'nearest');
  assert.equal(of('4000::1').note, 'nearest');
  assert.equal(of('fbff::1').note, 'nearest');
});

// ── rule 1: the table ──

test('rule 1: each prefix and its type', () => {
  const cases = {
    '::': 'unspecified', '::1': 'loopback', 'fe80::1': 'link-local', 'febf:ffff::1': 'link-local', 'fc00::1': 'ula',
    'fdff::1': 'ula', 'ff02::1': 'multicast', 'ffff::1': 'multicast', '2001:db8::': 'doc', '3fff:abc::': 'doc2',
    '2000::': 'gua', '3fff:ffff:ffff:ffff:ffff:ffff:ffff:ffff': 'gua', '2a02:c7f:5a3e:1:204:61ff:fe9d:f156': 'gua',
    '4000::1': 'other', 'fe00::1': 'other', 'fec0::1': 'other', 'fbff::1': 'other', '1fff::1': 'other'
  };
  for (const [a, type] of Object.entries(cases)) assert.equal(of(a).type, type, a);
  assert.deepEqual(logic.ROWS.map((r) => r.prefix + '/' + r.len),
    ['::/128', '::1/128', 'fe80::/10', 'fc00::/7', 'ff00::/8', '2001:db8::/32', '3fff::/20', '2000::/3']);
  assert.equal(of('4000::1').matchedPrefix, null);
  assert.equal(of('4000::1').reach, 'none');
});

test('rule 1: the boundaries of each prefix, first and last address inside and the next one out', () => {
  assert.equal(of('fe80::').type, 'link-local');
  assert.equal(of('febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff').type, 'link-local');
  assert.equal(of('fec0::').type, 'other');
  assert.equal(of('fc00::').type, 'ula');
  assert.equal(of('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff').type, 'ula');
  assert.equal(of('fe00::').type, 'other');
  assert.equal(of('fbff:ffff:ffff:ffff:ffff:ffff:ffff:ffff').type, 'other');
  assert.equal(of('ff00::').type, 'multicast');
  assert.equal(of('feff:ffff:ffff:ffff:ffff:ffff:ffff:ffff').type, 'other');
});

// ── rule 2: bits, not digits ──

test('rule 2: /3 counts bits: 3ffe::1 is in 2000::/3, 4000::1 is not, 1fff::1 is not', () => {
  const a = of('3ffe::1');
  assert.equal(a.type, 'gua');
  assert.equal(a.bits.slice(0, 4), '0011');
  assert.equal(a.note, 'gua-bits');
  assert.equal(of('4000::1').bits.slice(0, 4), '0100');
  assert.equal(of('4000::1').type, 'other');
  assert.equal(of('1fff::1').type, 'other');
  assert.equal(of('2000::').bits.slice(0, 3), '001');
});

test('rule 2: the matched prefix length is in bits (fe80::/10 compares two bits of the third hex digit)', () => {
  // fe80 and febf share their first 10 bits; fec0 differs in bit 9
  assert.equal(of('fe80::').bits.slice(0, 10), of('febf::').bits.slice(0, 10));
  assert.notEqual(of('fec0::').bits[9], of('fe80::').bits[9]);
  assert.equal(of('fe80::1').matchLen, 10);
  assert.equal(of('fc00::1').matchLen, 7);
});

// ── rule 3: reach of unicast ──

test('rule 3: reach and the node where a packet stops', () => {
  const r = (a) => { const s = of(a); return [s.reach, s.stopAt, s.reachNodes.join(',')]; };
  assert.deepEqual(r('::1'), ['host', 'H', 'H']);
  assert.deepEqual(r('fe80::1'), ['link', 'R1', 'H,N,R1']);
  assert.deepEqual(r('fd12:3456:789a::1'), ['site', 'R2', 'H,N,R1,H2,R2']);
  assert.deepEqual(r('2a02:c7f:5a3e:1:204:61ff:fe9d:f156'), ['global', null, 'H,N,R1,H2,R2,S']);
  assert.deepEqual(r('2001:db8::1'), ['none', 'R1', '']);
  assert.deepEqual(r('4000::1'), ['none', 'R1', '']);
});

test('rule 3/5: why a packet stops: never sent (:: and multicast scope 0) or dropped at R1 (no route)', () => {
  const w = (a) => { const s = of(a); return [s.stopAt, s.stopWhy]; };
  assert.deepEqual(w('::'), ['H', 'none']);
  assert.deepEqual(w('ff00::1'), ['H', 'none']);
  assert.deepEqual(w('2001:db8::1'), ['R1', 'unrouted']);
  assert.deepEqual(w('3fff::1'), ['R1', 'unrouted']);
  assert.deepEqual(w('4000::1'), ['R1', 'unrouted']);
  assert.deepEqual(w('::1'), ['H', 'host']);
  assert.deepEqual(w('fe80::1'), ['R1', 'link']);
  assert.deepEqual(w('ff05::1'), ['R2', 'site']);
  assert.deepEqual(w('2a02:c7f:5a3e:1::1'), [null, null]);
  assert.deepEqual(w('ff04::1'), [null, null]);
});

test('rule 3: the two addresses on one interface reach the neighbour and the server differently', () => {
  const [ll, gua] = logic.SETS['two-on-one'].map(of);
  assert.equal(ll.type, 'link-local');
  assert.equal(gua.type, 'gua');
  assert.ok(ll.reachNodes.includes('N') && !ll.reachNodes.includes('S'));
  assert.ok(gua.reachNodes.includes('S'));
  // the same interface ID behind both prefixes
  assert.deepEqual(ll.groups.slice(4), gua.groups.slice(4));
});

// ── rule 4: multicast scope ──

test('rule 4: multicast reach follows the scope nibble', () => {
  const m = (a) => { const s = of(a); return [s.scopeNibble, s.scope, s.reach]; };
  assert.deepEqual(m('ff01::1'), [1, 'interface-local', 'host']);
  assert.deepEqual(m('ff02::1'), [2, 'link-local', 'link']);
  assert.deepEqual(m('ff02::2'), [2, 'link-local', 'link']);
  assert.deepEqual(m('ff05::1:3'), [5, 'site-local', 'site']);
  assert.deepEqual(m('ff08::1'), [8, 'organization-local', 'site']);
  assert.deepEqual(m('ff0e::101'), [14, 'global', 'global']);
  // the flags nibble does not change the scope
  assert.deepEqual(m('ff12::1'), [2, 'link-local', 'link']);
  assert.deepEqual(m('ff3e::1'), [14, 'global', 'global']);
});

test('rule 4: reserved and administrator-defined scopes', () => {
  assert.deepEqual([of('ff00::1').reach, of('ff00::1').note], ['none', 'scope-0']);
  assert.deepEqual([of('ff0f::1').reach, of('ff0f::1').note], ['global', 'scope-f']);
  for (const n of ['3', '4', '6', '7', '9', 'a', 'b', 'c', 'd']) {
    const s = of('ff0' + n + '::1');
    assert.equal(s.reach, 'admin', n);
    assert.equal(s.note, 'scope-admin', n);
    assert.deepEqual(s.reachNodes, []);
    assert.equal(s.stopAt, null);
  }
  assert.equal(of('ff08::1').note, 'org-scope');
});

test('rule 4: well-known groups are named', () => {
  assert.equal(of('ff02::1').mcGroup, 'all-nodes');
  assert.equal(of('ff02::2').mcGroup, 'all-routers');
  assert.equal(of('ff05::1:3').mcGroup, 'dhcp-servers');
  assert.equal(of('ff0e::101').mcGroup, 'ntp');
  assert.equal(of('ff02::1:ff9d:f156').mcGroup, 'solicited-node');
  assert.equal(of('ff02::1:fe9d:f156').mcGroup, null);
  assert.equal(of('ff05::1').mcGroup, null);
  assert.equal(of('ff05::1:ff00:1').mcGroup, null, 'solicited-node is link scope only');
  assert.equal(of('ff02:0:0:0:1:1:ff00:1').mcGroup, null, 'the groups before 1:ffXX must be zero');
});

// ── rule 5: unspecified ──

test('rule 5: :: is never a destination', () => {
  const s = of('::');
  assert.equal(s.type, 'unspecified');
  assert.equal(s.reach, 'none');
  assert.equal(s.note, 'never-destination');
  assert.deepEqual(s.reachNodes, []);
});

// ── rule 6: ULA's L bit ──

test('rule 6: fc00::/8 has L = 0, fd00::/8 has L = 1; both are ULA', () => {
  assert.deepEqual([of('fc00::1').type, of('fc00::1').lBit, of('fc00::1').note], ['ula', 0, 'ula-l0']);
  assert.deepEqual([of('fd00::1').type, of('fd00::1').lBit, of('fd00::1').note], ['ula', 1, 'ula-l1']);
  assert.equal(of('fcff::1').lBit, 0);
  assert.equal(of('fd00::1').bits[7], '1');
});

// ── rule 7: RFC 5952 form and invalid input ──

test('rule 7: RFC 5952 form: lower case, no leading zeros, the longest zero run as ::, the first on a tie, not one group', () => {
  assert.equal(of('FE80:0000:0000:0000:0204:61FF:FE9D:F156').address, 'fe80::204:61ff:fe9d:f156');
  assert.equal(of('2001:db8:0:0:1:0:0:1').address, '2001:db8::1:0:0:1');
  assert.equal(of('2001:db8:0:1:1:1:1:1').address, '2001:db8:0:1:1:1:1:1');
  assert.equal(of('2001:0:0:1:0:0:0:1').address, '2001:0:0:1::1');
  assert.equal(of('0:0:0:0:0:0:0:0').address, '::');
  assert.equal(of('0:0:0:0:0:0:0:1').address, '::1');
  assert.equal(of('2001:db8::').full, '2001:0db8:0000:0000:0000:0000:0000:0000');
});

test('rule 7: the short form agrees with an independent implementation (Python ipaddress, 14 random addresses)', () => {
  const pairs = [
    ['a5cd:0002:000b:0000:2c01:0000:0001:0007', 'a5cd:2:b:0:2c01:0:1:7'],
    ['0000:0001:442f:0003:0000:0000:0001:000f', '0:1:442f:3::1:f'],
    ['daed:0000:0000:0009:fd7f:0000:0000:4dd0', 'daed::9:fd7f:0:0:4dd0'],
    ['0002:0000:0000:2feb:0000:e42b:b1aa:0005', '2::2feb:0:e42b:b1aa:5'],
    ['0000:0000:7ec7:0000:000c:8e40:0000:0000', '::7ec7:0:c:8e40:0:0'],
    ['0000:0000:0000:0000:000b:0004:000e:c8e5', '::b:4:e:c8e5'],
    ['c9ca:0000:227b:0000:0000:0000:0000:0000', 'c9ca:0:227b::'],
    ['b1dd:3ee5:ee96:0000:0000:0005:0006:0004', 'b1dd:3ee5:ee96::5:6:4'],
    ['0000:0000:0007:0007:63ea:0006:0000:0e4d', '::7:7:63ea:6:0:e4d'],
    ['0006:0000:0000:344d:0000:f71e:0000:c6ee', '6::344d:0:f71e:0:c6ee'],
    ['0000:2c6a:0000:0000:0000:0000:0000:349e', '0:2c6a::349e'],
    ['0000:0000:0000:0000:000e:0004:4dbd:0000', '::e:4:4dbd:0'],
    ['583d:0000:0003:0000:0000:0000:000a:6618', '583d:0:3::a:6618'],
    ['0007:84e9:0000:0000:2524:0000:0000:0000', '7:84e9:0:0:2524::']
  ];
  for (const [long, short] of pairs) {
    assert.equal(of(long).address, short);
    assert.equal(of(short).full, long);
  }
});

test('rule 7: invalid text is refused with a reason and keeps the address in use', () => {
  const bad = {
    '': 'empty', '  ': 'empty', '1::2::3': 'double', '12345::': 'long', '1:2:3': 'count', '1:2:3:4:5:6:7:8:9': 'count',
    '1:2:3:4:5:6:7:8::': 'count', 'g::1': 'chars', '::ffff:192.0.2.1': 'dotted', 'fe80::1%2': 'zone',
    'fe80::/10': 'prefix', ':1::': 'colon', '1:2:3:4:5:6:7:': 'colon', ':::': 'colon'
  };
  for (const [text, code] of Object.entries(bad)) {
    assert.deepEqual(logic.typed('fe80::1', text), { addr: 'fe80::1', error: code }, JSON.stringify(text));
  }
  assert.deepEqual(logic.typed('fe80::1', ' fc00::1 '), { addr: 'fc00::1', error: null });
  assert.deepEqual(logic.parse('1:2:3:4:5:6:7::').groups, [1, 2, 3, 4, 5, 6, 7, 0], ':: may stand for one group on input');
});

test('rule 7: an invalid address in the params (a hand-made URL) shows the default address and the error', () => {
  const s = at({ addr: 'zzz' });
  assert.equal(s.error, 'chars');
  assert.equal(s.address, logic.DEFAULT_ADDR);
  assert.equal(s.input, 'zzz');
  assert.equal(at({ addr: 'fe80::1' }).error, null);
});

// ── presets and the scene ──

test('presets: the task\'s expected type and reach for every address', () => {
  const want = {
    four: [['doc', 'none'], ['link-local', 'link'], ['ula', 'site'], ['multicast', 'link']],
    'two-on-one': [['link-local', 'link'], ['gua', 'global']],
    'bits-not-digits': [['gua', 'global'], ['other', 'none']],
    'multicast-scopes': [['multicast', 'link'], ['multicast', 'link'], ['multicast', 'site'], ['multicast', 'global']],
    special: [['loopback', 'host'], ['unspecified', 'none']]
  };
  assert.deepEqual(Object.keys(logic.SETS), Object.keys(want));
  for (const [id, list] of Object.entries(want)) {
    assert.deepEqual(logic.SETS[id].map((a) => { const s = of(a); return [s.type, s.reach]; }), list, id);
    // the address lists are written in RFC 5952 form already
    for (const a of logic.SETS[id]) assert.equal(of(a).address, a);
  }
  assert.equal(logic.PRESETS.length, 5);
  for (const p of logic.PRESETS) assert.equal(p.params.addr, logic.SETS[p.id][0]);
});

test('the default is preset four\'s first address, and the list marks the address shown', () => {
  assert.equal(logic.defaults.addr, logic.SETS.four[0]);
  assert.equal(at({}).inList, 0);
  assert.equal(at({ addr: 'FC00:0:0::1' }).inList, 2, 'found in its RFC 5952 form');
  assert.equal(at({ addr: '4000::1' }).inList, -1);
  assert.equal(at({ set: 'nope' }).set, 'four');
});

test('the scene: six nodes, each reach a prefix of the node order', () => {
  assert.deepEqual(logic.NODES, ['H', 'N', 'R1', 'H2', 'R2', 'S']);
  for (const [k, r] of Object.entries(logic.REACH)) {
    assert.deepEqual(r.nodes, logic.NODES.slice(0, r.nodes.length), k);
    if (r.stop) assert.ok(r.stop === 'H' || r.nodes.includes(r.stop), k);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and a few typed addresses', () => {
  const ps = logic.PRESETS.map((x) => x.params).concat([{ addr: '4000::1' }, { addr: 'zzz' }, { addr: 'ff04::1' }, { showBits: false }]);
  for (const over of ps) {
    const s = at(over);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('deterministic: the same params give the same state, and classify does not keep or mutate its input', () => {
  for (const x of logic.PRESETS) assert.deepEqual(at(x.params), at(x.params));
  const g = logic.parse('fe80::1').groups;
  const copy = g.slice();
  const s = logic.classify(g);
  assert.deepEqual(g, copy);
  s.groups[0] = 0;
  assert.equal(g[0], 0xfe80);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every type, scope, group, note and error code has its strings', () => {
  const keys = Object.keys(strings.en);
  const need = [];
  logic.ROWS.concat([logic.OTHER]).forEach((r) => need.push('type_' + r.id, 'row_' + r.id));
  Object.values(logic.SCOPES).forEach((s) => need.push('scope_' + s.name));
  need.push('scope_unassigned');
  ['all-nodes', 'all-routers', 'dhcp-servers', 'ntp', 'solicited-node'].forEach((g) => need.push('grp_' + g));
  ['org-scope', 'scope-f', 'scope-0', 'scope-admin', 'ula-l1', 'ula-l0', 'doc-in-gua', 'gua-bits', 'never-destination',
    'site-local-deprecated', 'nearest'].forEach((n) => need.push('note_' + n));
  ['empty', 'prefix', 'zone', 'dotted', 'chars', 'double', 'colon', 'long', 'count'].forEach((e) => need.push('err_' + e));
  Object.keys(logic.REACH).forEach((r) => need.push('reach_' + r));
  logic.NODES.forEach((n) => need.push('role_' + n));
  logic.PRESETS.forEach((p) => need.push('preset_' + p.id, 'hint_' + p.id));
  // keys the page builds from the state: cap_<type>, mc_<reach>, stop_<stopWhy>
  logic.ROWS.concat([logic.OTHER]).forEach((r) => need.push('cap_' + r.id));
  Object.keys(logic.REACH).forEach((r) => need.push('mc_' + r));
  ['host', 'link', 'site', 'none', 'unrouted'].forEach((w) => need.push('stop_' + w));
  for (const k of need) assert.ok(keys.includes(k), k);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.PRESETS\.map/);
  for (const p of logic.PRESETS) for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
});
