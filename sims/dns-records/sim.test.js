// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dns-records. Run: node --test sims/dns-records/
// One test per rule of SPEC.md §2, tie-breaks first, then the presets' expected numbers, then the generic block.
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
const at = (over) => kit.stateAt(logic, P(over), 0);
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);
const ask = (zone, name, type) => logic.resolve(zone, name, type);
const line = (r) => `${r.owner} ${r.ttl} ${r.type} ${logic.dataText(r)}`;
/** A zone of our own: rows [owner, type, data, ttl?]; ids r0, r1, … The apex SOA and NS come first unless bare. */
function zone(rows, bare) {
  const head = bare ? [] : [['@', 'SOA', logic.zoneOf(P({})).find((r) => r.id === 'soa').data], ['@', 'NS', 'ns1.lab.example.'], ['ns1', 'A', '192.168.180.1']];
  return head.concat(rows).map(([owner, type, data, ttl], i) => ({ id: 'r' + i, owner, ttl: ttl || 3600, type, data }));
}
const codes = (z) => logic.zoneCheck(z).map((c) => c.code);

// ── tie-breaks first ──

test('tie-break: equal MX preferences are tried in zone order (rule 4)', () => {
  const z = zone([['@', 'MX', { pref: 10, host: 'b' }], ['@', 'MX', { pref: 5, host: 'c' }], ['@', 'MX', { pref: 10, host: 'a' }],
    ['a', 'A', '10.0.0.1'], ['b', 'A', '10.0.0.2'], ['c', 'A', '10.0.0.3']]);
  const a = ask(z, 'lab.example', 'MX');
  assert.deepEqual(a.chain.map((c) => c.host), ['c.lab.example.', 'b.lab.example.', 'a.lab.example.']);
  // the answer section itself keeps zone order
  assert.deepEqual(a.answer.map((r) => r.data.pref), [10, 5, 10]);
});

test('tie-break: the longest delegation wins; the apex NS is never a cut (rule 6)', () => {
  const z = zone([['sub', 'NS', 'ns.sub'], ['ns.sub', 'A', '10.0.0.53'], ['deep.sub', 'NS', 'ns.deep.sub'], ['ns.deep.sub', 'A', '10.0.0.54']]);
  assert.equal(ask(z, 'x.deep.sub.lab.example', 'A').chain[0].cut, 'deep.sub.lab.example.');
  assert.equal(ask(z, 'x.sub.lab.example', 'A').chain[0].cut, 'sub.lab.example.');
  assert.equal(ask(z, 'lab.example', 'NS').kind, 'answer');
});

test('tie-break: exactly 8 CNAMEs are followed; a 9th is an error (rule 2)', () => {
  const chain = (n) => {
    const rows = [];
    for (let i = 0; i < n; i++) rows.push(['c' + i, 'CNAME', 'c' + (i + 1)]);
    rows.push(['c' + n, 'A', '10.0.0.9']);
    return zone(rows);
  };
  const ok = ask(chain(8), 'c0.lab.example', 'A');
  assert.equal(ok.rcode, 'NOERROR');
  assert.equal(ok.answer.length, 9);
  const bad = ask(chain(9), 'c0.lab.example', 'A');
  assert.equal(bad.rcode, 'SERVFAIL');
  assert.equal(bad.kind, 'too-long');
  assert.equal(bad.answer.length, 8);
  assert.equal(logic.MAX_CNAMES, 8);
});

test('tie-break: an RRset with different TTLs is a warning and is answered with the lowest TTL (rule 1)', () => {
  const z = zone([['h', 'A', '10.0.0.1', 600], ['h', 'A', '10.0.0.2', 60]]);
  const check = logic.zoneCheck(z);
  assert.deepEqual(check.map((c) => [c.level, c.code, c.owner]), [['warn', 'ttl-differs', 'h.lab.example.']]);
  assert.equal(logic.hasError(check), false);
  assert.deepEqual(ask(z, 'h.lab.example', 'A').answer.map((r) => r.ttl), [60, 60]);
});

test('tie-break: the check lists problems in a fixed order, by rule (SPEC §2)', () => {
  const z = zone([['@', 'MX', { pref: 1, host: 'al' }], ['al', 'CNAME', 'ns1'], ['h', 'A', '10.0.0.300'],
    ['k', 'A', '10.0.0.1', 60], ['k', 'A', '10.0.0.2'], ['x', 'CNAME', 'ns1'], ['x', 'TXT', ['t']]]);
  assert.deepEqual(codes(z), ['bad-data', 'cname-and-other', 'ttl-differs', 'mx-cname']);
});

// ── rule 1: the RRset ──

test('rule 1: an exact match returns the whole RRset and nothing of other types', () => {
  const s = preset('mx');
  assert.equal(s.answer.answer.length, 2);
  assert.ok(s.answer.answer.every((r) => r.type === 'MX' && r.owner === 'lab.example.'));
  const a = at({ qname: 'klijent.lab.example', qtype: 'A' }).answer;
  assert.deepEqual(a.answer.map(line), ['klijent.lab.example. 3600 A 192.168.180.100']);
  const six = at({ qname: 'klijent.lab.example', qtype: 'AAAA' }).answer;
  assert.deepEqual(six.answer.map(line), ['klijent.lab.example. 3600 AAAA 2001:db8:180::100']);
  const txt = at({ qname: 'lab.example', qtype: 'TXT' }).answer;
  assert.deepEqual(txt.answer.map(line), ['lab.example. 3600 TXT "v=spf1 mx -all"']);
});

// ── rule 2: CNAME ──

test('rule 2: a CNAME is carried and the lookup restarts at the canonical name', () => {
  const a = preset('cname').answer;
  assert.deepEqual(a.answer.map(line), ['www.lab.example. 3600 CNAME posluzitelj.lab.example.', 'posluzitelj.lab.example. 3600 A 192.168.180.1']);
  assert.deepEqual(a.chain, [{ kind: 'cname', from: 'www.lab.example.', to: 'posluzitelj.lab.example.' }]);
  // the restart asks for the queried type at the target: AAAA there is NODATA, with the CNAME still in the answer
  const six = at({ qname: 'www.lab.example', qtype: 'AAAA' }).answer;
  assert.equal(six.kind, 'nodata');
  assert.deepEqual(six.answer.map((r) => r.type), ['CNAME']);
});

test('rule 2: a query for type CNAME returns the alias and does not follow it', () => {
  const a = at({ qname: 'www.lab.example', qtype: 'CNAME' }).answer;
  assert.deepEqual(a.answer.map(line), ['www.lab.example. 3600 CNAME posluzitelj.lab.example.']);
  assert.deepEqual(a.chain, []);
});

test('rule 2: a loop is an error, the chain up to the repeat is shown', () => {
  const a = ask(zone([['a', 'CNAME', 'b'], ['b', 'CNAME', 'a']]), 'a.lab.example', 'A');
  assert.equal(a.rcode, 'SERVFAIL');
  assert.equal(a.kind, 'loop');
  assert.deepEqual(a.chain.map((c) => c.to), ['b.lab.example.', 'a.lab.example.']);
  assert.equal(ask(zone([['a', 'CNAME', 'a']]), 'a.lab.example', 'A').kind, 'loop');
});

test('rule 2: a canonical name outside the zone ends the answer there', () => {
  const a = ask(zone([['cdn', 'CNAME', 'edge.example.net.']]), 'cdn.lab.example', 'A');
  assert.equal(a.rcode, 'NOERROR');
  assert.equal(a.kind, 'outside');
  assert.deepEqual(a.chain.map((c) => c.kind), ['cname', 'outside']);
  assert.equal(a.aa, true);
  assert.deepEqual(a.authority, []);
  assert.deepEqual(a.additional, []);
});

// ── rule 3: CNAME and other data; the apex ──

test('rule 3: a CNAME at the apex is an error beside SOA and NS; the last valid zone answers', () => {
  const s = preset('apex-cname');
  assert.deepEqual(s.check.map((c) => [c.level, c.code, c.owner, c.apex]), [['error', 'cname-and-other', 'lab.example.', true]]);
  assert.deepEqual(s.check[0].types, ['SOA', 'NS', 'TXT', 'MX']);
  assert.equal(s.loaded, 'last-valid');
  assert.ok(s.zone.some((r) => r.id === 'apexCname'), 'the shown zone keeps the bad row');
  // the answer is the one the zone without the apex CNAME gives: lab.example has no A
  assert.equal(logic.statusOf(s.answer), 'NODATA');
  assert.deepEqual(s.answer, at({ qname: 'lab.example', qtype: 'A' }).answer);
  // the last valid zone keeps every other toggle: the MX records still answer
  const mx = at({ qname: 'lab.example', qtype: 'MX', apexCname: true });
  assert.equal(mx.loaded, 'last-valid');
  assert.deepEqual(mx.answer, preset('mx').answer);
  assert.deepEqual(mx.served, logic.zoneOf(P({})).map((r) => r.id));
});

test('rule 3: CNAME beside other data below the apex, and two CNAMEs, are errors too', () => {
  assert.deepEqual(codes(zone([['www', 'CNAME', 'ns1'], ['www', 'A', '10.0.0.1']])), ['cname-and-other']);
  const two = logic.zoneCheck(zone([['www', 'CNAME', 'ns1'], ['www', 'CNAME', 'posluzitelj']]));
  assert.deepEqual(two.map((c) => c.code), ['cname-multiple']);
  // both at once: "CNAME and other data" is the one reported
  assert.deepEqual(codes(zone([['www', 'CNAME', 'ns1'], ['www', 'CNAME', 'klijent'], ['www', 'A', '10.0.0.1']])), ['cname-and-other']);
  assert.equal(logic.zoneCheck(zone([['www', 'CNAME', 'ns1'], ['www', 'A', '10.0.0.1']]))[0].apex, false);
});

test('rule 3: the apex must hold SOA and NS', () => {
  assert.deepEqual(codes(zone([['@', 'NS', 'ns1.lab.example.']], true)), ['apex-no-soa']);
  const soa = logic.zoneOf(P({})).find((r) => r.id === 'soa').data;
  assert.deepEqual(codes(zone([['@', 'SOA', soa]], true)), ['apex-no-ns']);
});

test('rule 3: every toggle but apexCname keeps the zone loadable', () => {
  for (const addWww of [false, true]) for (const mx of [false, true]) for (const delegate of [false, true]) {
    const s = at({ addWww, mx, delegate });
    assert.deepEqual(s.check.map((c) => c.code), ['ok']);
    assert.equal(s.loaded, 'zone');
    assert.equal(at({ addWww, mx, delegate, apexCname: true }).loaded, 'last-valid');
  }
});

// ── rule 4: MX ──

test('rule 4: MX returns every exchange, lower preference tried first, with its address', () => {
  const a = preset('mx').answer;
  assert.deepEqual(a.answer.map(logic.dataText), ['10 mail.lab.example.', '20 mail2.lab.example.']);
  assert.deepEqual(a.chain.map((c) => [c.pref, c.host, c.addrs]), [[10, 'mail.lab.example.', ['192.168.180.25']], [20, 'mail2.lab.example.', ['192.168.180.26']]]);
  assert.deepEqual(a.additional.map(line), ['mail.lab.example. 3600 A 192.168.180.25', 'mail2.lab.example. 3600 A 192.168.180.26']);
  // order by preference, not by zone order
  const z = zone([['@', 'MX', { pref: 20, host: 'b' }], ['@', 'MX', { pref: 10, host: 'a' }], ['a', 'A', '10.0.0.1'], ['b', 'A', '10.0.0.2']]);
  assert.deepEqual(ask(z, 'lab.example', 'MX').chain.map((c) => c.pref), [10, 20]);
});

test('rule 4: an exchange\'s AAAA goes with its A in the additional section; so does AAAA glue', () => {
  const z = zone([['@', 'MX', { pref: 10, host: 'm' }], ['m', 'A', '10.0.0.1'], ['m', 'AAAA', '2001:db8::1'],
    ['sub', 'NS', 'ns.sub'], ['ns.sub', 'AAAA', '2001:db8::53']]);
  const a = ask(z, 'lab.example', 'MX');
  assert.deepEqual(a.chain[0].addrs, ['10.0.0.1', '2001:db8::1']);
  assert.deepEqual(a.additional.map((r) => r.type), ['A', 'AAAA']);
  const r = ask(z, 'x.sub.lab.example', 'A');
  assert.deepEqual(r.additional.map(line), ['ns.sub.lab.example. 3600 AAAA 2001:db8::53']);
});

test('rule 4: an exchange that is an alias is a warning and is marked', () => {
  const z = zone([['@', 'MX', { pref: 10, host: 'post' }], ['post', 'CNAME', 'ns1']]);
  const c = logic.zoneCheck(z);
  assert.deepEqual(c.map((x) => [x.level, x.code, x.host]), [['warn', 'mx-cname', 'post.lab.example.']]);
  assert.equal(ask(z, 'lab.example', 'MX').chain[0].alias, true);
  assert.equal(preset('mx').answer.chain[0].alias, false);
});

// ── rule 5: NODATA vs NXDOMAIN ──

test('rule 5: an existing name without that type is NODATA, a missing name is NXDOMAIN', () => {
  const nodata = preset('nodata');
  assert.equal(nodata.answer.rcode, 'NOERROR');
  assert.equal(logic.statusOf(nodata.answer), 'NODATA');
  assert.equal(nodata.answer.answer.length, 0);
  assert.equal(nodata.answer.aa, true);
  assert.deepEqual(nodata.answer.authority.map((r) => r.type), ['SOA']);
  const nx = preset('nxdomain');
  assert.equal(logic.statusOf(nx.answer), 'NXDOMAIN');
  assert.equal(nx.answer.answer.length, 0);
  assert.equal(nx.answer.aa, true);
  assert.deepEqual(nx.answer.authority.map((r) => r.type), ['SOA']);
});

test('rule 5: a negative answer carries the SOA with TTL min(SOA TTL, MINIMUM) = 900 (RFC 2308 §3)', () => {
  for (const id of ['nxdomain', 'nodata']) assert.deepEqual(preset(id).answer.authority.map((r) => r.ttl), [900]);
  // a positive SOA answer keeps the record's own TTL
  assert.deepEqual(at({ qname: 'lab.example', qtype: 'SOA' }).answer.answer.map((r) => r.ttl), [3600]);
  // with a SOA TTL below MINIMUM the SOA TTL wins
  const soa = logic.zoneOf(P({})).find((r) => r.id === 'soa').data;
  const z = zone([['@', 'SOA', soa, 300], ['@', 'NS', 'ns1.lab.example.']], true);
  assert.deepEqual(ask(z, 'x.lab.example', 'A').authority.map((r) => r.ttl), [300]);
});

test('rule 5: an empty non-terminal exists (NODATA); a CNAME to a missing name is NXDOMAIN with the CNAME', () => {
  const z = zone([['a.b', 'A', '10.0.0.1'], ['alias', 'CNAME', 'nowhere']]);
  assert.equal(logic.statusOf(ask(z, 'b.lab.example', 'A')), 'NODATA');
  const a = ask(z, 'alias.lab.example', 'A');
  assert.equal(a.rcode, 'NXDOMAIN');
  assert.deepEqual(a.answer.map((r) => r.type), ['CNAME']);
  // switching a toggle off removes the name: www goes from an answer to NXDOMAIN
  assert.equal(logic.statusOf(at({ qname: 'www.lab.example', addWww: false }).answer), 'NXDOMAIN');
});

// ── rule 6: delegation ──

test('rule 6: NS at the apex is authoritative, NS below it is a referral without aa', () => {
  const apex = at({ qname: 'lab.example', qtype: 'NS' }).answer;
  assert.equal(apex.kind, 'answer');
  assert.equal(apex.aa, true);
  assert.deepEqual(apex.additional.map(line), ['ns1.lab.example. 3600 A 192.168.180.1']);
  const r = preset('delegation').answer;
  assert.equal(r.rcode, 'NOERROR');
  assert.equal(r.kind, 'referral');
  assert.equal(logic.statusOf(r), 'NOERROR');
  assert.equal(r.aa, false);
  assert.equal(r.answer.length, 0);
  assert.deepEqual(r.authority.map(line), ['sub.lab.example. 3600 NS ns.sub.lab.example.']);
  assert.deepEqual(r.additional.map(line), ['ns.sub.lab.example. 3600 A 192.168.180.53']);
});

test('rule 6: the cut itself and the glue below it are referrals too; off, the same names are NXDOMAIN', () => {
  for (const [qname, qtype] of [['sub.lab.example', 'NS'], ['sub.lab.example', 'A'], ['ns.sub.lab.example', 'A']]) {
    const on = at({ delegate: true, qname, qtype }).answer;
    assert.equal(on.kind, 'referral', `${qname} ${qtype}`);
    assert.equal(on.aa, false);
    const off = at({ delegate: false, qname, qtype }).answer;
    assert.equal(logic.statusOf(off), 'NXDOMAIN');
    assert.equal(off.aa, true);
  }
});

test('rule 6: a cut covers names below it, not names that merely end with the same letters', () => {
  const z = zone([['sub', 'NS', 'ns.sub'], ['ns.sub', 'A', '10.0.0.53'], ['mysub', 'A', '10.0.0.7'], ['mail', 'A', '10.0.0.25']]);
  assert.equal(ask(z, 'mysub.lab.example', 'A').kind, 'answer');
  assert.equal(ask(z, 'ail.lab.example', 'A').kind, 'nxdomain');
});

test('rule 6: an alias that leads under a cut keeps aa and carries the CNAME', () => {
  const z = zone([['sub', 'NS', 'ns.sub'], ['ns.sub', 'A', '10.0.0.53'], ['go', 'CNAME', 'x.sub']]);
  const a = ask(z, 'go.lab.example', 'A');
  assert.equal(a.kind, 'referral');
  assert.equal(a.aa, true);
  assert.deepEqual(a.answer.map((r) => r.type), ['CNAME']);
});

// ── rule 7: data formats ──

test('rule 7: A holds one IPv4 address, AAAA one IPv6 address, TXT one or more strings', () => {
  for (const ok of ['192.168.180.1', '0.0.0.0', '255.255.255.255']) assert.ok(logic.isIPv4(ok), ok);
  for (const bad of ['192.168.180', '192.168.180.256', '192.168.180.01', '192.168.180.1 192.168.180.2', '2001:db8::1', '']) assert.ok(!logic.isIPv4(bad), bad);
  for (const ok of ['2001:db8:180::100', '::1', '::', '2001:db8:0:0:0:0:0:1', 'fe80::']) assert.ok(logic.isIPv6(ok), ok);
  for (const bad of ['192.168.180.1', '2001:db8::1::2', '2001:db8:0:0:0:0:0:0:1', '2001:db8:0:0:0:0:1', '2001:db8::12345', 'g::1', '1:2:3:4::5:6:7:8', '::ffff:192.0.2.256', '1:2:3:4:5:6:7:192.0.2.1']) assert.ok(!logic.isIPv6(bad), bad);
  for (const ok of ['::ffff:192.0.2.1', '64:ff9b::192.0.2.33', '1:2:3:4:5:6:192.0.2.1']) assert.ok(logic.isIPv6(ok), ok);
  assert.deepEqual(codes(zone([['h', 'A', '192.168.180.1 192.168.180.2']])), ['bad-data']);
  assert.deepEqual(codes(zone([['h', 'AAAA', '192.168.180.1']])), ['bad-data']);
  assert.deepEqual(codes(zone([['h', 'A', '2001:db8::1']])), ['bad-data']);
  assert.deepEqual(codes(zone([['h', 'TXT', []]])), ['bad-data']);
  assert.deepEqual(codes(zone([['h', 'TXT', ['x'.repeat(256)]]])), ['bad-data']);
  assert.deepEqual(codes(zone([['h', 'TXT', ['one', 'two']], ['h', 'TXT', ['x'.repeat(255)]]])), ['ok']);
  assert.deepEqual(codes(zone([['@', 'MX', { pref: 65536, host: 'm' }], ['m', 'A', '10.0.0.1']])), ['bad-data']);
  assert.deepEqual(codes(zone([['@', 'MX', { pref: -1, host: 'm' }], ['m', 'A', '10.0.0.1']])), ['bad-data']);
  assert.deepEqual(codes(zone([['@', 'MX', { pref: 10, host: 7 }]])), ['bad-data']);
  // TXT length is in octets: č is two octets in UTF-8
  assert.equal(logic.octets('č'), 2);
  assert.deepEqual(codes(zone([['h', 'TXT', ['č'.repeat(127)]]])), ['ok']);
  assert.deepEqual(codes(zone([['h', 'TXT', ['č'.repeat(128)]]])), ['bad-data']);
  assert.equal(logic.dataText({ type: 'TXT', data: ['one', 'two'] }), '"one" "two"');
});

// ── rule 8: names ──

test('rule 8: names are relative to the origin unless they end with a dot; @ is the apex', () => {
  assert.equal(logic.abs('@'), 'lab.example.');
  assert.equal(logic.abs('posluzitelj'), 'posluzitelj.lab.example.');
  assert.equal(logic.abs('posluzitelj.lab.example.'), 'posluzitelj.lab.example.');
  assert.equal(logic.abs('posluzitelj.lab.example'), 'posluzitelj.lab.example.lab.example.');
  assert.equal(logic.abs('ns.sub'), 'ns.sub.lab.example.');
  // the forgotten dot sends the alias to a name that does not exist
  const z = zone([['posluzitelj', 'A', '192.168.180.1'], ['w1', 'CNAME', 'posluzitelj'], ['w2', 'CNAME', 'posluzitelj.lab.example.'], ['w3', 'CNAME', 'posluzitelj.lab.example']]);
  assert.deepEqual(ask(z, 'w1.lab.example', 'A').answer.map(line), ask(z, 'w2.lab.example', 'A').answer.map(line).map((l) => l.replace('w2', 'w1')));
  assert.equal(ask(z, 'w3.lab.example', 'A').rcode, 'NXDOMAIN');
  // query names are absolute with or without the dot
  assert.equal(logic.fqdn('lab.example'), 'lab.example.');
  assert.deepEqual(ask(z, 'w1.lab.example.', 'A'), ask(z, 'w1.lab.example', 'A'));
  // names are compared without regard to case
  assert.deepEqual(ask(z, 'W1.Lab.Example', 'A'), ask(z, 'w1.lab.example', 'A'));
  assert.equal(ask(zone([['Velika', 'A', '10.0.0.1']]), 'velika.lab.example', 'A').kind, 'answer');
  // names inside SOA data follow the same rule
  const soa = Object.assign({}, logic.zoneOf(P({})).find((r) => r.id === 'soa').data, { mname: 'ns1', rname: 'admin' });
  const zs = zone([['@', 'SOA', soa], ['@', 'NS', 'ns1']], true);
  assert.equal(logic.dataText(ask(zs, 'lab.example', 'SOA').answer[0]).split(' ').slice(0, 2).join(' '), 'ns1.lab.example. admin.lab.example.');
});

// ── presets: the expected numbers of SPEC §3 ──

test('preset ul-zone: the book\'s zone and its answer', () => {
  const s = preset('ul-zone');
  assert.deepEqual(s.zone.map((r) => r.id), ['soa', 'ns', 'txt', 'ns1', 'posluzitelj', 'klijent', 'klijent6']);
  assert.deepEqual(s.answer.answer.map(line), ['posluzitelj.lab.example. 3600 A 192.168.180.1']);
  assert.equal(s.answer.aa, true);
  assert.equal(logic.dataText(s.zone[0]), 'ns1.lab.example. admin.lab.example. 2026090301 3600 900 604800 900');
  assert.ok(s.zone.every((r) => r.ttl === 3600));
});

test('presets: every preset is a valid param set, ids are unique, the zone rows have unique ids', () => {
  const ids = logic.presets.map((x) => x.id);
  assert.deepEqual(ids, ['ul-zone', 'nxdomain', 'cname', 'mx', 'nodata', 'apex-cname', 'delegation']);
  for (const x of logic.presets) {
    for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `${x.id}: ${k}`);
    assert.ok(logic.QNAMES.includes(x.params.qname), x.id);
    assert.ok(logic.TYPES.includes(x.params.qtype), x.id);
  }
  const all = logic.zoneOf({ addWww: true, apexCname: true, mx: true, delegate: true }).map((r) => r.id);
  assert.equal(new Set(all).size, all.length);
  assert.ok(logic.QNAMES.includes(logic.defaults.qname));
});

test('the answer marks what changed: new answer RRs only', () => {
  const a = at({ qname: 'www.lab.example' }).answer, b = at({ qname: 'posluzitelj.lab.example' }).answer;
  assert.deepEqual(logic.newRRs(b, a), [0]);
  assert.deepEqual(logic.newRRs(a, b), []);
  assert.deepEqual(logic.newRRs(null, b), [0]);
  // same owner and type, other data: new; and per section
  const mx = preset('mx').answer;
  const moved = structuredClone(mx); moved.answer[1].data.pref = 30;
  assert.deepEqual(logic.newRRs(mx, moved), [1]);
  assert.deepEqual(logic.newRRs(preset('ul-zone').answer, mx, 'additional'), [0, 1]);
  assert.deepEqual(logic.newRRs(preset('nodata').answer, preset('nxdomain').answer, 'authority'), []);
  assert.deepEqual(logic.rowsOf(preset('mx').answer), { answer: ['mx10', 'mx20'], authority: [], additional: ['mail', 'mail2'] });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and every toggle combination', () => {
  for (const x of logic.presets) { const s = at(x.params); assert.deepEqual(JSON.parse(JSON.stringify(s)), s); }
  for (const qtype of logic.TYPES) for (const qname of logic.QNAMES) {
    const s = at({ qname, qtype, apexCname: true, delegate: true });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ qname: 'lab.example', qtype: 'MX', delegate: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  const z = logic.zoneOf(p), zc = structuredClone(z);
  logic.resolve(z, 'lab.example', 'MX');
  logic.zoneCheck(z);
  assert.deepEqual(z, zc);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page: an explorer, its meta matches sim.json, it takes the presets from the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(json.class, 'explorer');
  assert.ok(!('steps' in logic));
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const k of Object.keys(logic.defaults)) assert.match(html, new RegExp(`key: '${k}'`), `param ${k} is on the page`);
});
