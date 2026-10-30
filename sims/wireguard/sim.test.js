// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for wireguard's model (SPEC.md). Tie-breaks first, then one block per rule, then the generic block.
// Run: node --test sims/wireguard/sim.test.js
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
const stepOf = (phase) => L.PHASES.indexOf(phase) + 1;
const rowsAt = (s, n) => s.rows.filter((r) => r.step === n);
const ALL = [];
for (const action of ['handshake', 'send', 'roam'])
  for (const innerDst of L.INNER_DSTS)
    for (const allowedOk of [true, false])
      for (const endpointKnown of [true, false]) ALL.push({ action, innerDst, allowedOk, endpointKnown });

// ── tie-breaks (rule 3) ──

test('tie-break: the most specific prefix wins: 10.0.0.2 matches B /32 and C /24 → B', () => {
  const table = at({}, 1).routing;
  const lk = L.lookup(table, '10.0.0.2');
  assert.deepEqual(lk.hits, [true, false, true]);
  assert.equal(lk.win, 0);
  assert.equal(lk.peer, 'B');
  // order in the table does not matter: put C's /24 first
  const swapped = [table[2], table[1], table[0]];
  assert.equal(L.lookup(swapped, '10.0.0.2').peer, 'B');
  assert.equal(L.lookup(swapped, '10.0.0.2').win, 2);
});

test('tie-break: a prefix given to a second peer moves to it (the later assignment wins)', () => {
  const t = L.buildTable([
    { peer: 'B', allowedIPs: ['10.0.0.0/24', '10.0.0.2/32'] },
    { peer: 'C', allowedIPs: ['10.0.0.0/24'] }
  ]);
  assert.deepEqual(t.map((r) => r.prefix + ' ' + r.peer), ['10.0.0.2/32 B', '10.0.0.0/24 C']);
  assert.equal(L.lookup(t, '10.0.0.7').peer, 'C');
  assert.equal(L.lookup(t, '10.0.0.2').peer, 'B');
});

test('tie-break: equal lengths, equal prefixes in a hand-made table: the earlier row wins', () => {
  const t = [{ prefix: '10.0.0.0/24', peer: 'B', len: 24 }, { prefix: '10.0.0.0/24', peer: 'C', len: 24 }];
  assert.equal(L.lookup(t, '10.0.0.9').peer, 'B');
});

// ── prefixes ──

test('inPrefix: boundaries of /32, /24, /0', () => {
  assert.ok(L.inPrefix('10.0.0.2', '10.0.0.2/32'));
  assert.ok(!L.inPrefix('10.0.0.3', '10.0.0.2/32'));
  assert.ok(L.inPrefix('10.0.0.0', '10.0.0.0/24'));
  assert.ok(L.inPrefix('10.0.0.255', '10.0.0.0/24'));
  assert.ok(!L.inPrefix('10.0.1.0', '10.0.0.0/24'));
  assert.ok(L.inPrefix('255.255.255.255', '0.0.0.0/0'));
  assert.ok(L.inPrefix('200.1.2.3', '128.0.0.0/1'), 'no sign trouble above 2^31');
  assert.ok(!L.inPrefix('127.255.255.255', '128.0.0.0/1'));
});

// ── rule 1: a peer is its static public key ──

test('rule 1: B identifies A by the static public key alone; an unknown key is nobody', () => {
  const s = at({}, 1);
  assert.equal(L.identify(s.b.peers, L.KEYS.A), 'A');
  assert.equal(L.identify(s.b.peers, L.KEYS.C), null);
  assert.equal(L.identify(s.b.peers, 'x' + L.KEYS.A.slice(1)), null);
  const r2 = rowsAt(at({}, 2), 2)[0];
  assert.equal(r2.recognised, 'A');
});

test('rule 1: an Initiation with a key B does not know: B stores no endpoint and does not answer', () => {
  const p = P({ action: 'roam' });
  let s = at({ action: 'roam' }, 1);
  s = structuredClone(s);
  s.a.staticPub = L.KEYS.C;                // A presents a key B has no peer for
  s = L.step(s, 2, p);
  assert.equal(rowsAt(s, 2)[0].recognised, null);
  assert.equal(L.peerOf(s.b, 'A').endpoint, null);
  assert.equal(s.lastSeenEndpoint, null);
  s = L.step(s, 3, p);
  assert.equal(s.handshake.resp, false);
  assert.equal(rowsAt(s, 3).length, 0, 'silence: no Response');
  s = L.step(s, 4, p);
  assert.equal(s.handshake.established, false);
});

test('rule 1: no certificates or user names anywhere in the state; keys are 44-character base64', () => {
  for (const p of ALL) {
    const json = JSON.stringify(end(p)).toLowerCase();
    for (const word of ['cert', 'user', 'password', 'ca"']) assert.ok(!json.includes(word), word);
  }
  for (const k of Object.values(L.KEYS)) assert.match(k, /^[A-Za-z0-9+/]{43}=$/);
  const s = at({}, 1);
  assert.deepEqual(s.b.peers.map((x) => Object.keys(x).sort()), [['allowedIPs', 'endpoint', 'peer', 'pub']]);
});

test('rule 1: peers are configured at step 1 with the other side\'s public key', () => {
  assert.deepEqual(at({}, 0).a.peers, []);
  const s = at({}, 1);
  assert.equal(L.peerOf(s.a, 'B').pub, s.b.staticPub);
  assert.equal(L.peerOf(s.b, 'A').pub, s.a.staticPub);
  assert.ok(s.a.configured && s.b.configured);
});

// ── rule 2: 1-RTT handshake ──

test('rule 2: exactly two handshake messages, Initiation then Response, then both hold the same key pair', () => {
  const s = at({}, 4);
  const msgs = s.rows.filter((r) => r.kind === 'msg');
  assert.deepEqual(msgs.map((r) => r.msg + ' ' + r.from + '→' + r.to), ['init A→B', 'resp B→A']);
  assert.deepEqual(msgs.map((r) => r.step), [2, 3]);
  assert.equal(s.handshake.established, true);
  assert.deepEqual(s.a.session, { send: 'k1', recv: 'k2' });
  assert.deepEqual(s.b.session, { send: 'k2', recv: 'k1' }, 'what A sends with, B receives with');
});

test('rule 2: no session before step 4; none at all without the handshake', () => {
  for (let n = 0; n < 4; n++) assert.equal(at({}, n).handshake.established, false, 'step ' + n);
  for (let n = 0; n < 4; n++) assert.equal(at({}, n).a.session, null);
  const off = end({ action: 'roam', endpointKnown: false });
  assert.equal(off.handshake.init, false);
  assert.equal(off.handshake.established, false);
  assert.equal(off.rows.filter((r) => r.kind === 'msg').length, 0, 'nothing ever sent');
});

test('rule 2: the Initiation carries A\'s static key (encrypted to B), the Response goes to A\'s address', () => {
  const s2 = at({}, 2);
  assert.equal(s2.packet.kind, 'init');
  assert.equal(s2.packet.staticPub, L.KEYS.A);
  assert.equal(s2.packet.outerDst, L.SCENE.B.endpoint);
  const s3 = at({}, 3);
  assert.equal(s3.packet.kind, 'resp');
  assert.equal(s3.packet.outerDst, L.SCENE.A.endpoint);
  assert.equal(s3.packet.outerSrc, L.SCENE.B.endpoint);
});

test('rule 2: without B\'s endpoint, A cannot start: a note on A, nothing on the wire', () => {
  const s = at({ endpointKnown: false }, 4);
  assert.deepEqual(s.rows.map((r) => r.kind + ' ' + r.lane + ' ' + r.what), ['note A noEndpoint']);
  assert.equal(s.packet, null);
});

// ── rule 3: cryptokey routing ──

test('rule 3: the scene\'s tables', () => {
  const s = at({}, 1);
  assert.deepEqual(s.routing.map((r) => [r.prefix, r.peer, r.len]),
    [['10.0.0.2/32', 'B', 32], ['192.168.2.0/24', 'B', 24], ['10.0.0.0/24', 'C', 24]]);
  assert.deepEqual(s.routingB.map((r) => [r.prefix, r.peer]), [['10.0.0.1/32', 'A']]);
});

test('rule 3: outbound lookup for every inner destination (SPEC.md expected numbers)', () => {
  const want = {
    '10.0.0.2': [[true, false, true], 0, 'B', null],
    '192.168.2.10': [[false, true, false], 1, 'B', null],
    '10.0.0.3': [[false, false, true], 2, 'C', 'otherPeer'],
    '198.51.100.7': [[false, false, false], -1, null, 'noPeer']
  };
  for (const [dst, [hits, win, peer, drop]] of Object.entries(want)) {
    const s5 = at({ action: 'send', innerDst: dst }, 5);
    assert.deepEqual(s5.lookup.hits, hits, dst);
    assert.equal(s5.lookup.win, win, dst);
    assert.equal(s5.lookup.peer, peer, dst);
    const s6 = at({ action: 'send', innerDst: dst }, 6);
    assert.equal(s6.packet.dropReason, drop, dst);
    assert.equal(s6.packet.outerDst, drop ? null : L.SCENE.B.endpoint, dst);
    assert.equal(rowsAt(s6, 6)[0].kind, drop ? 'note' : 'msg', dst);
  }
});

test('rule 3: inbound, the inner source must be in the sender\'s AllowedIPs, or the packet is dropped', () => {
  const ok = at({ action: 'send' }, 7);
  assert.equal(ok.check.ok, true);
  assert.deepEqual(ok.check.hits, [true]);
  assert.equal(ok.packet.delivered, true);
  assert.equal(ok.packet.where, 'atB');
  const bad = at({ action: 'send', allowedOk: false }, 7);
  assert.equal(bad.packet.innerSrc, '192.168.1.20');
  assert.deepEqual(bad.check.hits, [false]);
  assert.equal(bad.check.win, -1);
  assert.equal(bad.check.ok, false);
  assert.equal(bad.packet.delivered, false);
  assert.equal(bad.packet.dropReason, 'allowedIPs');
  const r = L.receiveData(bad.b, bad.routingB, { from: 'A', key: 'k1', innerSrc: '192.168.1.20', outerSrc: L.SCENE.A.endpoint });
  assert.equal(r.dropReason, 'allowedIPs');
  assert.equal(r.reply, null, 'a drop is silent too');
  // the outbound side does not look at the source: A still picked B and sent it
  assert.equal(at({ action: 'send', allowedOk: false }, 6).packet.dropReason, null);
});

test('rule 3: the inbound check wants the sender, not just any peer of B', () => {
  const b = { peers: [{ peer: 'A', pub: L.KEYS.A, allowedIPs: ['10.0.0.1/32'], endpoint: null },
    { peer: 'D', pub: 'D', allowedIPs: ['10.0.0.9/32'], endpoint: null }], session: { send: 'k2', recv: 'k1' } };
  const table = L.buildTable(b.peers);
  const r = L.receiveData(b, table, { from: 'A', key: 'k1', innerSrc: '10.0.0.9', outerSrc: '198.51.100.10:41414' });
  assert.equal(r.authenticated, true);
  assert.equal(r.check.peer, 'D');
  assert.equal(r.delivered, false);
  assert.equal(r.dropReason, 'allowedIPs');
});

test('rule 3: nothing reaches B when the lookup picks C or no peer', () => {
  for (const dst of ['10.0.0.3', '198.51.100.7']) {
    const s = at({ action: 'send', innerDst: dst }, 7);
    assert.equal(s.check, null, dst);
    assert.equal(rowsAt(s, 7).length, 0, dst);
    assert.equal(s.packet.delivered, false);
  }
});

// ── rule 4: roaming ──

test('rule 4: B learns A\'s endpoint from the Initiation (it has none configured)', () => {
  assert.equal(L.peerOf(at({}, 1).b, 'A').endpoint, null);
  const s = at({}, 2);
  assert.equal(L.peerOf(s.b, 'A').endpoint, L.SCENE.A.endpoint);
  assert.equal(s.lastSeenEndpoint, L.SCENE.A.endpoint);
  assert.ok(s.changed.includes('b.endpointA'));
});

test('rule 4: after A moves, B keeps the old endpoint until the next authenticated packet, then takes the new one', () => {
  const s8 = at({ action: 'roam' }, 8);
  assert.equal(s8.a.endpoint, L.SCENE.A.roamTo);
  assert.equal(s8.roamed, true);
  assert.equal(L.peerOf(s8.b, 'A').endpoint, L.SCENE.A.endpoint, 'nobody told B');
  const s9 = at({ action: 'roam' }, 9);
  assert.equal(s9.packet.outerSrc, L.SCENE.A.roamTo);
  assert.equal(s9.packet.counter, 1);
  assert.equal(L.peerOf(s9.b, 'A').endpoint, L.SCENE.A.roamTo);
  assert.equal(s9.lastSeenEndpoint, L.SCENE.A.roamTo);
  assert.equal(rowsAt(s9, 9)[0].learned, L.SCENE.A.roamTo);
  assert.deepEqual(rowsAt(s9, 9).map((r) => r.kind + ' ' + (r.lane || r.from) + ' ' + (r.what || r.msg)), ['msg A data', 'note B delivered']);
  assert.equal(s9.packet.delivered, true, 'the tunnel continues');
});

test('rule 4: a spoofed source that does not authenticate changes nothing and gets no reply', () => {
  const b = at({}, 4).b;
  const table = L.buildTable(b.peers);
  const before = L.peerOf(b, 'A').endpoint;
  const r = L.receiveData(b, table, { from: 'A', key: 'forged', innerSrc: '10.0.0.1', outerSrc: '203.0.113.66:4444' });
  assert.equal(r.authenticated, false);
  assert.equal(r.endpoint, before);
  assert.equal(r.reply, null);
  assert.equal(r.delivered, false);
  // no session at all: nothing authenticates
  const r0 = L.receiveData(at({}, 1).b, table, { from: 'A', key: 'k1', innerSrc: '10.0.0.1', outerSrc: '203.0.113.66:4444' });
  assert.equal(r0.authenticated, false);
});

test('rule 4: authentication updates the endpoint before the AllowedIPs check (dropped, still learned)', () => {
  const s = at({ action: 'roam', allowedOk: false }, 9);
  assert.equal(s.packet.dropReason, 'allowedIPs');
  assert.equal(L.peerOf(s.b, 'A').endpoint, L.SCENE.A.roamTo);
  assert.equal(rowsAt(s, 9)[1].what, 'dropped');
});

test('rule 4: when A\'s next packet is not for B, B keeps the old endpoint', () => {
  for (const dst of ['10.0.0.3', '198.51.100.7']) {
    const s = at({ action: 'roam', innerDst: dst }, 9);
    assert.equal(L.peerOf(s.b, 'A').endpoint, L.SCENE.A.endpoint, dst);
    assert.ok(!s.changed.includes('b.endpointA'), dst);
  }
});

// ── rule 5: silence ──

test('rule 5: step 1 sends nothing; B never sends anything but the Response', () => {
  for (const p of ALL) {
    const s = end(p);
    assert.equal(rowsAt(s, 1).length, 0);
    const fromB = s.rows.filter((r) => r.kind === 'msg' && r.from === 'B');
    assert.ok(fromB.every((r) => r.msg === 'resp'), JSON.stringify(p));
    assert.ok(fromB.length <= 1);
  }
});

test('rule 5: a dropped packet is followed by no message at all', () => {
  const s = end({ action: 'roam', allowedOk: false });
  const drops = s.rows.filter((r) => r.what === 'dropped');
  assert.equal(drops.length, 2, 'steps 7 and 9');
  assert.equal(s.rows.filter((r) => r.kind === 'msg' && r.from === 'B' && r.step >= drops[0].step).length, 0);
});

// ── rule 6: over UDP, the inner packet unchanged ──

test('rule 6: the data packet goes to B\'s UDP port; the inner packet arrives as A sent it', () => {
  const s6 = at({ action: 'send', innerDst: '192.168.2.10' }, 6);
  assert.equal(s6.packet.outerDst, '192.0.2.1:' + L.PORT);
  assert.equal(L.PORT, 51820);
  const s7 = at({ action: 'send', innerDst: '192.168.2.10' }, 7);
  assert.equal(s7.packet.innerSrc, s6.packet.innerSrc);
  assert.equal(s7.packet.innerDst, s6.packet.innerDst);
  assert.equal(s7.packet.innerDst, '192.168.2.10');
});

// ── steps, presets, params ──

test('steps per action: handshake 4, send 7, roam 9; the phases in order', () => {
  assert.equal(L.steps(P({ action: 'handshake' })), 4);
  assert.equal(L.steps(P({ action: 'send' })), 7);
  assert.equal(L.steps(P({ action: 'roam' })), 9);
  assert.equal(L.steps(P({ action: 'nonsense' })), 4);
  const s = end({ action: 'roam' });
  for (let n = 1; n <= 9; n++) assert.equal(at({ action: 'roam' }, n).phase, L.PHASES[n - 1]);
  assert.equal(s.phase, 'learn');
});

test('the four presets end as the task says', () => {
  const hs = end({ action: 'handshake' });
  assert.equal(hs.handshake.established, true);
  const rt = end({ action: 'send', innerDst: '10.0.0.2' });
  assert.equal(rt.lookup.peer, 'B');
  assert.equal(rt.packet.delivered, true);
  const dr = end({ action: 'send', allowedOk: false });
  assert.equal(dr.packet.dropReason, 'allowedIPs');
  const ro = end({ action: 'roam' });
  assert.equal(ro.lastSeenEndpoint, L.SCENE.A.roamTo);
  assert.equal(ro.packet.delivered, true);
});

test('changed marks what each step touched', () => {
  const ch = (n) => at({ action: 'roam' }, n).changed;
  assert.deepEqual(ch(1), ['a.peers', 'b.peers', 'tableA', 'tableB']);
  assert.ok(ch(2).includes('b.endpointA') && ch(2).includes('packet'));
  assert.deepEqual(ch(4), ['a.session', 'b.session']);
  assert.ok(ch(5).includes('tableA'));
  assert.ok(ch(7).includes('tableB') && ch(7).includes('packet'));
  assert.deepEqual(ch(8), ['a.endpoint']);
  assert.ok(ch(9).includes('b.endpointA'));
  assert.deepEqual(at({}, 0).changed, []);
});

test('params are normalised: an unknown destination falls back to the first', () => {
  assert.equal(L.norm({ innerDst: '1.2.3.4' }).innerDst, '10.0.0.2');
  assert.equal(L.norm({}).allowedOk, true);
  assert.equal(L.norm({}).endpointKnown, true);
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
  for (const over of [{ action: 'roam' }, { action: 'roam', allowedOk: false, innerDst: '192.168.2.10' }, { action: 'send', endpointKnown: false }]) {
    const p = P(over);
    const forward = [];
    let s = L.initial(p);
    forward.push(s);
    for (let n = 1; n <= L.steps(p); n++) { s = L.step(s, n, p); forward.push(s); }
    for (let n = L.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ action: 'roam' });
  let s = L.initial(p);
  for (let n = 1; n <= 9; n++) {
    const copy = structuredClone(s);
    const next = L.step(s, n, p);
    assert.deepEqual(s, copy, 'step ' + n);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, L.steps(L.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in L.defaults, `preset param ${k} is a model param`);
});
