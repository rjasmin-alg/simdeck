// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ipsec-ike's model (SPEC.md). Tie-breaks first, then one block per rule, then the generic block.
// Run: node --test sims/ipsec-ike/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const at = (over, n) => kit.stateAt(L, P(over), n);
const end = (over) => at(over, L.steps(P(over)));
const stepOf = (over, phase) => L.phasesOf(P(over)).indexOf(phase) + 1;
const atPhase = (over, phase) => at(over, stepOf(over, phase));
const rowsAt = (s, n) => s.rows.filter((r) => r.step === n);
const ALL = [];
for (const mode of ['tunnel', 'transport'])
  for (const auth of ['psk', 'cert'])
    for (const action of ['bring-up', 'send', 'rekey'])
      for (const selectorMatch of [true, false]) ALL.push({ mode, auth, action, selectorMatch });

// ── tie-breaks (SPD, rule 6) ──

test('tie-break: overlapping entries, the most specific destination wins: 10.2.0.9 hits /24 PROTECT and /8 DISCARD → PROTECT', () => {
  const spd = L.spdFor('tunnel');
  const lk = L.spdLookup(spd, '10.1.0.5', '10.2.0.9');
  assert.deepEqual(lk.hits, [true, true]);
  assert.equal(lk.win, 0);
  assert.equal(lk.action, 'protect');
  // the order of the entries does not matter
  const swapped = [spd[1], spd[0]];
  const lk2 = L.spdLookup(swapped, '10.1.0.5', '10.2.0.9');
  assert.equal(lk2.action, 'protect');
  assert.equal(lk2.win, 1);
  // transport: /32 beats /8 as well
  assert.equal(L.spdLookup(L.spdFor('transport'), '10.1.0.5', '10.2.0.9').action, 'protect');
});

test('tie-break: equal destination prefixes → the more specific source, then the earlier entry', () => {
  const spd = [
    { src: '10.0.0.0/8', dst: '10.2.0.0/24', action: 'discard' },
    { src: '10.1.0.0/24', dst: '10.2.0.0/24', action: 'protect' },
    { src: '10.1.0.0/24', dst: '10.2.0.0/24', action: 'bypass' }
  ];
  const lk = L.spdLookup(spd, '10.1.0.5', '10.2.0.9');
  assert.equal(lk.win, 1);
  assert.equal(lk.action, 'protect');
});

test('tie-break: a packet matching no entry takes the implicit last entry, BYPASS', () => {
  const spd = L.spdFor('tunnel');
  const lk = L.spdLookup(spd, '10.1.0.5', '192.0.2.80');
  assert.deepEqual(lk.hits, [false, false]);
  assert.equal(lk.win, spd.length);
  assert.equal(lk.action, 'bypass');
  // a source outside the entries misses them too
  assert.equal(L.spdLookup(spd, '10.9.0.1', '10.2.0.9').action, 'bypass');
});

test('tie-break: 10.2.1.9 is outside the selectors but inside 10.0.0.0/8 → DISCARD (the sim shows DISCARD)', () => {
  for (const mode of ['tunnel', 'transport']) {
    const lk = L.spdLookup(L.spdFor(mode), '10.1.0.5', L.OFF_DST);
    assert.deepEqual(lk.hits, [false, true], mode);
    assert.equal(lk.action, 'discard', mode);
  }
});

// ── prefixes ──

test('inPrefix: boundaries of /32, /24, /8, /0', () => {
  assert.ok(L.inPrefix('10.2.0.9', '10.2.0.9/32'));
  assert.ok(!L.inPrefix('10.2.0.10', '10.2.0.9/32'));
  assert.ok(L.inPrefix('10.2.0.0', '10.2.0.0/24'));
  assert.ok(L.inPrefix('10.2.0.255', '10.2.0.0/24'));
  assert.ok(!L.inPrefix('10.2.1.0', '10.2.0.0/24'));
  assert.ok(L.inPrefix('10.255.255.255', '10.0.0.0/8'));
  assert.ok(!L.inPrefix('11.0.0.0', '10.0.0.0/8'));
  assert.ok(L.inPrefix('255.255.255.255', '0.0.0.0/0'));
});

// ── rule 1: IKE sets up, ESP carries ──

test('rule 1: no Child SA before IKE_AUTH; the IKE SA is up before any data moves', () => {
  for (const mode of ['tunnel', 'transport']) {
    const s1 = atPhase({ mode }, 'init');
    assert.equal(s1.childSAs.length, 0);
    assert.equal(s1.ikeSA.state, 'keyed');
    const s2 = atPhase({ mode }, 'auth');
    assert.equal(s2.childSAs.length, 2);
    assert.equal(s2.ikeSA.state, 'up');
  }
});

test('rule 1: IKE messages carry no user packet; every data row is ESP with a Child SA SPI, never an IKE message', () => {
  for (const p of ALL) {
    const s = end(p);
    const spis = new Set(s.childSAs.map((x) => x.spi));
    for (const r of s.rows) {
      if (r.ike) {
        assert.ok(!r.spi && !r.esp, 'IKE row holds no ESP');
        assert.ok(['IKE_SA_INIT', 'IKE_AUTH', 'CREATE_CHILD_SA', 'INFORMATIONAL'].includes(r.msg));
      }
      if (r.esp) assert.ok(spis.has(r.spi), 'ESP row uses a Child SA SPI: ' + r.spi);
    }
    for (const m of s.ike) {
      assert.equal(m.port, 500);
      assert.ok(!('innerSrc' in m) && !('spi' in m));
    }
  }
});

// ── rule 2: two exchanges ──

test('rule 2: IKE_SA_INIT is DH in the clear: KEi = 8, KEr = 19, both compute 2; nobody authenticated yet', () => {
  const s = atPhase({}, 'init');
  assert.deepEqual(s.ikeSA.dh, { p: 23, g: 5, KEi: 8, KEr: 19, sA: 2, sB: 2 });
  assert.equal(s.ikeSA.authMethod, null);
  const rows = rowsAt(s, 1);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => [r.from, r.to, r.msg, r.lock]), [['GA', 'GB', 'IKE_SA_INIT', false], ['GB', 'GA', 'IKE_SA_INIT', false]]);
  assert.deepEqual(rows.map((r) => r.ke), [8, 19]);
  assert.deepEqual(s.ike[0].clear, ['SAi1', 'KEi', 'Ni']);
  assert.deepEqual(s.ike[1].clear, ['SAr1', 'KEr', 'Nr']);
  assert.equal(L.powMod(19, 6, 23), L.powMod(8, 15, 23));
});

test('rule 2: IKE_AUTH travels inside SK, authenticates, and creates the first Child SA with selectors', () => {
  for (const auth of ['psk', 'cert']) {
    const s = atPhase({ auth }, 'auth');
    const rows = rowsAt(s, 2);
    assert.deepEqual(rows.map((r) => [r.msg, r.lock]), [['IKE_AUTH', true], ['IKE_AUTH', true]]);
    assert.equal(s.ikeSA.authMethod, auth);
    assert.deepEqual(s.selectors, { local: '10.1.0.0/24', remote: '10.2.0.0/24' });
    assert.ok(s.ike[0].sk.includes('AUTH') && s.ike[0].sk.includes('TSi') && s.ike[0].sk.includes('TSr') && s.ike[0].sk.includes('SAi2'));
    assert.equal(s.ike[0].clear.length, 0);
    assert.equal(s.ike[0].sk.includes('CERT'), auth === 'cert');
    assert.equal(s.ike[1].sk.includes('CERT'), auth === 'cert');
  }
  // certificates: the INIT response asks for one
  assert.ok(atPhase({ auth: 'cert' }, 'init').ike[1].clear.includes('CERTREQ'));
  assert.ok(!atPhase({ auth: 'psk' }, 'init').ike[1].clear.includes('CERTREQ'));
});

// ── rule 3: one-way SAs, SPI + protocol + destination ──

test('rule 3: a Child SA pair is two one-way SAs; each SPI is chosen by its receiver', () => {
  const s = atPhase({}, 'auth');
  const [ab, ba] = s.childSAs;
  assert.deepEqual([ab.from, ab.to, ab.spi], ['A', 'B', 'b2000001']);
  assert.deepEqual([ba.from, ba.to, ba.spi], ['B', 'A', 'a1000001']);
  assert.notEqual(ab.key, ba.key);
  assert.deepEqual(ab.ts, { src: '10.1.0.0/24', dst: '10.2.0.0/24' });
  assert.deepEqual(ba.ts, { src: '10.2.0.0/24', dst: '10.1.0.0/24' });
});

test('rule 3: an SA is found by SPI, protocol and destination together', () => {
  const sas = L.childPair(1, L.selectorsFor('tunnel'));
  assert.equal(L.findSA(sas, 'b2000001', 'esp', 'B').spi, 'b2000001');
  assert.equal(L.findSA(sas, 'b2000001', 'esp', 'A'), null, 'right SPI, wrong destination');
  assert.equal(L.findSA(sas, 'b2000001', 'ah', 'B'), null, 'right SPI, wrong protocol');
  assert.equal(L.findSA(sas, 'b2000009', 'esp', 'B'), null, 'unknown SPI');
  sas[0].state = 'deleted';
  assert.equal(L.findSA(sas, 'b2000001', 'esp', 'B'), null, 'deleted');
});

test('rule 3: an unknown SPI at the receiver is dropped (noSA)', () => {
  const s = atPhase({}, 'wrap');
  const pkt = Object.assign({}, s.packet, { spi: 'b2000077' });
  const r = L.receiveEsp(s.childSAs, pkt, 'B');
  assert.equal(r.drop, 'noSA');
  assert.equal(r.delivered, false);
});

test('rule 3: the reply after a rekey travels on the other SA of the new pair', () => {
  const s = end({ action: 'rekey' });
  assert.equal(s.packet.spi, 'a1000002');
  assert.equal(s.packet.outerSrc, '203.0.113.1');
  assert.equal(s.packet.outerDst, '198.51.100.1');
  assert.equal(s.check.sa, 'a1000002');
  assert.equal(s.outcome, 'rekeyed');
});

// ── rule 4: tunnel vs transport ──

test('rule 4: tunnel mode: a new outer header gateway → gateway, the whole inner packet encrypted, next header 4', () => {
  const p = atPhase({}, 'wrap').packet;
  assert.equal(p.outerSrc, '198.51.100.1');
  assert.equal(p.outerDst, '203.0.113.1');
  assert.equal(p.innerSrc, '10.1.0.5');
  assert.equal(p.innerDst, '10.2.0.9');
  assert.equal(p.proto, 50);
  assert.equal(p.next, 4);
  assert.ok(p.encrypted.includes('innerIP'));
  assert.ok(!p.encrypted.includes('outerIP'));
});

test('rule 4: transport mode: the original header stays, only the payload is encrypted, next header 6; hosts are the peers', () => {
  const s = atPhase({ mode: 'transport' }, 'wrap');
  const p = s.packet;
  assert.equal(p.outerSrc, '10.1.0.5');
  assert.equal(p.outerDst, '10.2.0.9');
  assert.equal(p.next, 6);
  assert.ok(!p.encrypted.includes('innerIP'));
  assert.ok(p.encrypted.includes('tcp'));
  assert.deepEqual(s.peers, { A: 'HA', B: 'HB' });
  assert.deepEqual(s.selectors, { local: '10.1.0.5/32', remote: '10.2.0.9/32' });
  const espRow = s.rows.find((r) => r.esp);
  assert.deepEqual([espRow.from, espRow.to], ['HA', 'HB']);
  // IKE runs host to host as well
  assert.deepEqual(rowsAt(s, 1).map((r) => [r.from, r.to]), [['HA', 'HB'], ['HB', 'HA']]);
});

test('rule 4: tunnel mode: the LAN legs are plain, the gateways the peers; transport mode has no plain legs', () => {
  const s = end({});
  assert.deepEqual(s.peers, { A: 'GA', B: 'GB' });
  const plain = s.rows.filter((r) => r.plain).map((r) => r.from + '>' + r.to);
  assert.deepEqual(plain, ['HA>GA', 'GB>HB']);
  assert.deepEqual(end({ mode: 'transport' }).rows.filter((r) => r.plain), []);
});

test('rule 4: same ESP in both modes (same SA, same key): the difference is the header, not the strength', () => {
  const a = atPhase({}, 'wrap').packet, b = atPhase({ mode: 'transport' }, 'wrap').packet;
  assert.equal(a.spi, b.spi);
  assert.equal(a.key, b.key);
  assert.equal(a.espProtected, b.espProtected);
});

// ── rule 5: ESP ──

test('rule 5: ESP authenticates the ESP header and the encrypted part; the outer header is neither', () => {
  for (const mode of ['tunnel', 'transport']) {
    const p = atPhase({ mode }, 'wrap').packet;
    assert.ok(p.authenticated.includes('esp'));
    for (const part of p.encrypted) assert.ok(p.authenticated.includes(part), part);
    assert.ok(!p.encrypted.includes('esp'), 'the ESP header (SPI, seq) is not encrypted');
    assert.ok(p.encrypted.includes('trailer'));
  }
});

test('rule 5: B checks the ICV before decrypting: a tampered packet is dropped (authFail) and never reaches the selector check', () => {
  const s = atPhase({}, 'wrap');
  const bad = Object.assign({}, s.packet, { key: 'k-forged' });
  const r = L.receiveEsp(s.childSAs, bad, 'B');
  assert.deepEqual([r.spiOk, r.authOk, r.tsOk, r.delivered, r.drop], [true, false, null, false, 'authFail']);
  const ok = atPhase({}, 'receive');
  assert.deepEqual([ok.check.spiOk, ok.check.authOk], [true, true]);
  assert.equal(rowsAt(ok, stepOf({}, 'receive'))[0].what, 'decrypted');
});

// ── rule 6: traffic selectors ──

test('rule 6: a packet outside the selectors is not tunnelled: DISCARD at A, no ESP row, nothing sent', () => {
  for (const mode of ['tunnel', 'transport']) {
    for (const action of ['bring-up', 'send']) {
      const s = end({ mode, action, selectorMatch: false });
      assert.equal(s.outcome, 'discarded');
      assert.equal(s.packet.innerDst, '10.2.1.9');
      assert.equal(s.packet.espProtected, false);
      assert.equal(s.rows.filter((r) => r.esp).length, 0);
      assert.equal(s.childSAs.every((x) => x.seq === 0), true, 'no SA used');
    }
  }
});

test('rule 6: at B, inner addresses outside the SA\'s selectors are dropped after decryption (tsFail)', () => {
  const s = atPhase({}, 'wrap');
  const sa = s.childSAs[0];
  const pkt = L.wrap({ src: '10.1.0.5', dst: '10.2.1.9' }, sa, 'tunnel', { A: '198.51.100.1', B: '203.0.113.1' });
  const r = L.receiveEsp(s.childSAs, pkt, 'B');
  assert.deepEqual([r.authOk, r.tsOk, r.delivered, r.drop], [true, false, false, 'tsFail']);
  const fine = atPhase({}, 'deliver');
  assert.equal(fine.check.tsOk, true);
  assert.equal(fine.outcome, 'delivered');
});

test('rule 6: PROTECT names the outbound Child SA whose selectors cover the packet', () => {
  const s = atPhase({}, 'match');
  assert.equal(s.lookup.action, 'protect');
  assert.equal(s.lookup.sa, 'b2000001');
  assert.equal(L.outboundSA(s.childSAs, 'A', '10.1.0.5', '10.2.1.9'), null);
  assert.equal(L.outboundSA(s.childSAs, 'B', '10.2.0.9', '10.1.0.5').spi, 'a1000001');
});

// ── rekey ──

test('rekey: a new pair with new SPIs, traffic moves to it with seq 1, then the old pair is deleted; the IKE SA stays', () => {
  const R = { action: 'rekey' };
  const s1 = atPhase(R, 'traffic');
  assert.equal(s1.packet.spi, 'b2000001');
  assert.equal(s1.packet.seq, 5120);
  const s3 = atPhase(R, 'ccs');
  assert.deepEqual(s3.childSAs.map((x) => x.spi + ' ' + x.state), ['b2000001 old', 'a1000001 old', 'b2000002 active', 'a1000002 active']);
  assert.deepEqual(rowsAt(s3, 3).map((r) => [r.msg, r.lock]), [['CREATE_CHILD_SA', true], ['CREATE_CHILD_SA', true]]);
  assert.ok(s3.ike[0].sk.includes('N(REKEY_SA)'));
  const s4 = atPhase(R, 'moved');
  assert.equal(s4.packet.spi, 'b2000002');
  assert.equal(s4.packet.seq, 1);
  const s5 = atPhase(R, 'delete');
  assert.deepEqual(rowsAt(s5, 5).map((r) => [r.msg, r.del]), [['INFORMATIONAL', 'a1000001'], ['INFORMATIONAL', 'b2000001']]);
  assert.deepEqual(s5.childSAs.filter((x) => x.state === 'deleted').map((x) => x.spi), ['b2000001', 'a1000001']);
  assert.equal(L.findSA(s5.childSAs, 'b2000001', 'esp', 'B'), null);
  for (let n = 0; n <= 6; n++) assert.deepEqual(at(R, n).ikeSA, at(R, 0).ikeSA, 'IKE SA untouched at ' + n);
});

test('rekey: with two active pairs the sender takes the newer SA; an old one is not used for new traffic', () => {
  const ts = L.selectorsFor('tunnel');
  const sas = L.childPair(1, ts).concat(L.childPair(2, ts));
  assert.equal(L.outboundSA(sas, 'A', '10.1.0.5', '10.2.0.9').spi, 'b2000002');
  const flipped = L.childPair(2, ts).concat(L.childPair(1, ts));
  assert.equal(L.outboundSA(flipped, 'A', '10.1.0.5', '10.2.0.9').spi, 'b2000002');
  sas[2].state = 'old';
  assert.equal(L.outboundSA(sas, 'A', '10.1.0.5', '10.2.0.9').spi, 'b2000001');
});

test('rule 6, stepped: when the inner addresses leave the selectors, the deliver step drops the packet (tsFail)', () => {
  const p = P({});
  const n = stepOf({}, 'deliver');
  const before = at({}, n - 1);
  before.packet.innerDst = '10.2.1.9';          // as if the inner header did not match the SA it arrived on
  const s = L.step(before, n, p);
  assert.equal(s.outcome, 'tsFail');
  assert.equal(s.packet.delivered, false);
  assert.equal(s.rows[s.rows.length - 1].what, 'tsFail');
  assert.equal(s.rows.filter((r) => r.plain && r.to === 'HB').length, 0, 'nothing goes on to Host B');
});

test('rule 6: the inbound selector check needs both addresses inside: source alone or destination alone outside → tsFail', () => {
  const s = atPhase({}, 'wrap');
  const sa = s.childSAs[0];
  const peer = { A: '198.51.100.1', B: '203.0.113.1' };
  for (const inner of [{ src: '10.9.0.5', dst: '10.2.0.9' }, { src: '10.1.0.5', dst: '10.2.7.9' }]) {
    const r = L.receiveEsp(s.childSAs, L.wrap(inner, sa, 'tunnel', peer), 'B');
    assert.equal(r.drop, 'tsFail', JSON.stringify(inner));
  }
});

test('rule 5: ESP never covers the IP header: not in transport mode (that is AH\'s difference), not the outer one in tunnel mode', () => {
  const tr = atPhase({ mode: 'transport' }, 'wrap').packet;
  assert.ok(!tr.authenticated.includes('innerIP') && !tr.authenticated.includes('outerIP'));
  const tu = atPhase({}, 'wrap').packet;
  assert.ok(!tu.authenticated.includes('outerIP'));
  assert.ok(tu.authenticated.includes('innerIP'), 'tunnel mode: the inner header is inside the protected part');
});

test('rule 4: the outer header says protocol 50 (ESP) in both modes; IKE travels on UDP 500 in every exchange', () => {
  for (const mode of ['tunnel', 'transport']) assert.equal(atPhase({ mode }, 'wrap').packet.proto, 50);
  for (const p of ALL) {
    for (let n = 1; n <= L.steps(P(p)); n++) for (const m of at(p, n).ike) assert.equal(m.port, 500);
  }
});

test('transport mode draws one private network: the routers have private addresses, the gateways\' public ones only in tunnel mode', () => {
  assert.equal(L.laneAddr('transport', 'GA'), '10.1.0.1');
  assert.equal(L.laneAddr('transport', 'GB'), '10.2.0.1');
  assert.equal(L.laneAddr('tunnel', 'GA'), '198.51.100.1');
  assert.equal(L.laneAddr('transport', 'HA'), '10.1.0.5');
});

test('rule 6 at A: off the selectors the packet is marked dropped at A', () => {
  assert.equal(end({ selectorMatch: false }).packet.dropped, true);
  assert.ok(!end({}).packet.dropped);
});

test('rekey: CREATE_CHILD_SA names the SA it replaces (N(REKEY_SA) with A\'s inbound SPI); the new pair keeps the selectors', () => {
  const s = atPhase({ action: 'rekey' }, 'ccs');
  assert.equal(s.ike[0].rekeys, 'a1000001');
  assert.equal(rowsAt(s, 3)[0].rekeys, 'a1000001');
  const [o1, o2, n1, n2] = s.childSAs;
  assert.deepEqual(n1.ts, o1.ts);
  assert.deepEqual(n2.ts, o2.ts);
});

test('rekey, tunnel mode: traffic steps draw the plain LAN legs too; transport mode has none', () => {
  const s = end({ action: 'rekey' });
  const legs = s.rows.filter((r) => r.plain).map((r) => r.step + ':' + r.from + '>' + r.to);
  assert.deepEqual(legs, ['1:HA>GA', '4:HA>GA', '6:HB>GB', '6:GA>HA']);
  assert.deepEqual(end({ action: 'rekey', mode: 'transport' }).rows.filter((r) => r.plain), []);
});

test('exchange details: only the rekey request carries N(REKEY_SA); Delete carries D alone; no data packet during an IKE step', () => {
  const s3 = atPhase({ action: 'rekey' }, 'ccs');
  assert.deepEqual(s3.ike[0].sk, ['N(REKEY_SA)', 'SA', 'Ni', 'TSi', 'TSr']);
  assert.deepEqual(s3.ike[1].sk, ['SA', 'Nr', 'TSi', 'TSr']);
  assert.equal(s3.packet, null);
  const s5 = atPhase({ action: 'rekey' }, 'delete');
  assert.deepEqual(s5.ike.map((m) => m.sk), [['D'], ['D']]);
  assert.equal(s5.packet, null);
  assert.equal(atPhase({}, 'init').packet, null);
});

test('where the packet is: at GW-B after receive (tunnel), at Host B after deliver; Host B itself in transport mode', () => {
  assert.equal(atPhase({}, 'receive').packet.where, 'GB');
  assert.equal(atPhase({}, 'deliver').packet.where, 'HB');
  assert.equal(atPhase({ mode: 'transport' }, 'receive').packet.where, 'HB');
  assert.equal(atPhase({}, 'send').packet.where, 'GA');
  assert.equal(atPhase({ mode: 'transport' }, 'send').packet.where, 'HA');
  assert.deepEqual(atPhase({}, 'lifetime').changed, ['childSAs']);
});

// ── steps, presets, params ──

test('steps: bring-up 8 / 5, send 5 / 3, rekey 6 / 6; the phases in order', () => {
  assert.equal(L.steps(P({})), 8);
  assert.equal(L.steps(P({ selectorMatch: false })), 5);
  assert.equal(L.steps(P({ action: 'send' })), 5);
  assert.equal(L.steps(P({ action: 'send', selectorMatch: false })), 3);
  assert.equal(L.steps(P({ action: 'rekey' })), 6);
  assert.equal(L.steps(P({ action: 'rekey', selectorMatch: false })), 6);
  assert.equal(L.steps(P({ mode: 'transport' })), 8);
  for (const p of ALL) {
    const phases = L.phasesOf(P(p));
    for (let n = 1; n <= phases.length; n++) assert.equal(at(p, n).phase, phases[n - 1]);
  }
});

test('the four presets end as the task says', () => {
  const s2s = end({});
  assert.equal(L.steps(P({})), 8);
  assert.equal(s2s.outcome, 'delivered');
  assert.equal(s2s.packet.spi, 'b2000001');
  assert.equal(s2s.packet.next, 4);
  const tr = end({ mode: 'transport' });
  assert.equal(tr.outcome, 'delivered');
  assert.equal(tr.packet.next, 6);
  const ns = end({ selectorMatch: false });
  assert.equal(L.steps(P({ selectorMatch: false })), 5);
  assert.equal(ns.outcome, 'discarded');
  const rk = end({ action: 'rekey' });
  assert.equal(L.steps(P({ action: 'rekey' })), 6);
  assert.equal(rk.outcome, 'rekeyed');
});

test('send and rekey start with the tunnel up; bring-up starts with nothing', () => {
  assert.equal(at({}, 0).ikeSA.state, 'none');
  assert.equal(at({}, 0).childSAs.length, 0);
  for (const action of ['send', 'rekey']) {
    const s = at({ action }, 0);
    assert.equal(s.ikeSA.state, 'up');
    assert.equal(s.childSAs.length, 2);
    assert.deepEqual(s.rows, []);
  }
  assert.equal(at({ action: 'rekey', auth: 'cert' }, 0).ikeSA.authMethod, 'cert');
});

test('changed marks what each step touched', () => {
  const ch = (n) => at({}, n).changed;
  assert.deepEqual(ch(0), []);
  assert.deepEqual(ch(1), ['ike', 'ikeSA']);
  assert.ok(ch(2).includes('childSAs') && ch(2).includes('selectors'));
  assert.deepEqual(ch(3), ['packet']);
  assert.ok(ch(4).includes('spd'));
  assert.ok(ch(5).includes('sa.b2000001') && ch(5).includes('packet'));
  assert.ok(ch(7).includes('selectors'));
});

test('params are normalised', () => {
  assert.deepEqual(L.norm({}), { mode: 'tunnel', auth: 'psk', action: 'bring-up', selectorMatch: true });
  assert.deepEqual(L.norm({ mode: 'x', auth: 'y', action: 'z' }), L.norm({}));
  assert.equal(L.norm(undefined).mode, 'tunnel');
});

test('every lane named in a row exists, and no message goes to its sender', () => {
  for (const p of ALL) {
    for (const r of end(p).rows) {
      if (r.kind === 'note') assert.ok(L.LANES.includes(r.lane));
      else { assert.ok(L.LANES.includes(r.from) && L.LANES.includes(r.to)); assert.notEqual(r.from, r.to); }
    }
  }
});

test('strings.js: no key appears twice in a table (a later duplicate would win silently)', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, 'strings.js'), 'utf8');
  for (const lang of ['hr', 'en']) {
    const start = src.indexOf('\n    ' + lang + ': {');
    const stop = src.indexOf('\n    }', start);
    const keys = [...src.slice(start, stop).matchAll(/^\s{6}(\w+):/gm)].map((m) => m[1]);
    assert.ok(keys.length > 20, lang);
    assert.equal(new Set(keys).size, keys.length, lang + ': ' + keys.filter((k, i) => keys.indexOf(k) !== i));
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of ALL) {
    for (let n = 0; n <= L.steps(P(p)); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of ALL) {
    const q = P(p);
    const forward = [];
    let s = L.initial(q);
    forward.push(s);
    for (let n = 1; n <= L.steps(q); n++) { s = L.step(s, n, q); forward.push(s); }
    for (let n = L.steps(q); n >= 0; n--) assert.deepEqual(kit.stateAt(L, q, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of [{}, { action: 'rekey' }, { mode: 'transport' }]) {
    const p = P(over);
    let s = L.initial(p);
    for (let n = 1; n <= L.steps(p); n++) {
      const copy = structuredClone(s);
      const next = L.step(s, n, p);
      assert.deepEqual(s, copy, 'step ' + n);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, L.steps(L.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in L.defaults, `preset param ${k} is a model param`);
});
