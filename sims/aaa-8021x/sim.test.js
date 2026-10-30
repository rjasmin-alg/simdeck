// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for aaa-8021x's model (SPEC.md: rule numbers in the test names). Run: node --test sims/aaa-8021x/
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
const stepOf = (over, kind) => L.script(P(over)).indexOf(kind) + 1;
const msgsAt = (s, n) => s.msgs.filter((m) => m.step === n);
const dhcp = (s) => s.msgs.filter((m) => m.proto === 'DHCP');

/** Every combination of the four params. */
const ALL = [];
for (const medium of ['wired', 'wifi']) for (const credentials of ['correct', 'wrong'])
  for (const server of [true, false]) for (const method of ['peap', 'tls']) ALL.push({ medium, credentials, server, method });

// ── tie-breaks first ──

test('rule 1 tie-break: the port is still closed at Access-Accept and at EAP-Success; it opens one step later', () => {
  const accept = stepOf({}, 'accept'), success = stepOf({}, 'success'), up = stepOf({}, 'portUp');
  assert.deepEqual([accept, success, up], [10, 11, 12]);
  assert.equal(at({}, accept).port, 'unauthorized');
  assert.equal(at({}, success).port, 'unauthorized');
  assert.equal(at({}, up).port, 'authorized');
  assert.equal(at({}, up - 1).vlan, null);
});

test('rule 1 tie-break, Wi-Fi: the port opens with the 4-way handshake, not with EAP-Success', () => {
  const w = { medium: 'wifi' };
  const success = stepOf(w, 'success'), hs = stepOf(w, 'handshake');
  assert.equal(hs, success + 1);
  assert.equal(at(w, success).port, 'unauthorized');
  const s = at(w, hs);
  assert.equal(s.port, 'authorized');
  const m = msgsAt(s, hs)[0];
  assert.equal(m.proto, 'EAPOL', 'the handshake is EAPOL-Key, so the closed port lets it through');
  assert.equal(L.script(P(w)).indexOf('portUp'), -1, 'Wi-Fi has no separate port step');
});

test('rule 6 tie-break: identification, authentication and access control are three different steps, in that order', () => {
  for (const p of ALL.filter((x) => x.server && x.credentials === 'correct')) {
    const a = end(p).aaa;
    assert.ok(a.identified.step < a.authenticated.step, JSON.stringify(p));
    assert.ok(a.authenticated.step < a.authorized.step, JSON.stringify(p));
    assert.ok(a.authorized.step < a.accounted.step, JSON.stringify(p));
  }
});

// ── rules ──

test('rule 1: only EAPOL passes the unauthorized port; everything passes the authorized one', () => {
  assert.equal(L.passes('unauthorized', 'EAPOL'), true);
  assert.equal(L.passes('unauthorized', 'DHCP'), false);
  assert.equal(L.passes('unauthorized', 'IPv4'), false, 'any frame that is not EAPOL, not just DHCP');
  assert.equal(L.passes('authorized', 'DHCP'), true);
  assert.equal(L.passes('authorized', 'EAPOL'), true);
  const s = end({});
  assert.deepEqual(dhcp(s).map((m) => [m.step, m.dropped]), [[2, true], [13, false]], 'book: dropped at 2, passes at 13');
  for (const p of ALL) {
    for (const m of end(p).msgs.filter((x) => x.from === 'STA')) {
      if (m.proto === 'EAPOL') assert.equal(m.dropped, false, 'EAPOL never dropped');
    }
  }
});

test('rule 2: the authenticator relays every EAP packet unchanged, in both directions', () => {
  for (const p of ALL.filter((x) => x.server)) {
    const s = end(p);
    s.msgs.forEach((m, i) => {
      if (m.from === 'STA' && m.eap === 'Response') {
        const next = s.msgs[i + 1];
        assert.equal(next.name, 'Access-Request', 'a response goes on in an Access-Request');
        assert.deepEqual([next.from, next.to, next.eap, next.round, next.step], ['SW', 'AS', 'Response', m.round, m.step + (m.round === 'identity' ? 1 : 0)]);
      }
      if (m.name === 'Access-Challenge') {
        const next = s.msgs[i + 1];
        assert.deepEqual([next.name, next.from, next.to, next.round, next.step], ['EAP-Request', 'SW', 'STA', m.round, m.step]);
      }
    });
  }
});

test('rule 2: the switch cannot tell a right password from a wrong one; only the server decides', () => {
  for (const method of ['peap', 'tls']) {
    const ok = end({ method }), bad = end({ method, credentials: 'wrong' });
    const check = L.METHODS[method].check + 5;               // the round where the server checks
    const sw = (s) => s.msgs.filter((m) => m.from === 'SW' && m.step <= check).map((m) => [m.step, m.name, m.round]);
    assert.deepEqual(sw(bad), sw(ok), method + ': the switch sends the same until the verdict');
    for (const s of [ok, bad]) {
      for (const m of s.msgs.filter((x) => /^Access-(Accept|Reject)$/.test(x.name))) assert.equal(m.from, 'AS');
      assert.equal(s.msgs.filter((m) => m.verdict).every((m) => m.to === 'AS'), true, 'the verdict is at the server');
    }
  }
});

test('rule 3: EAPOL only between laptop and switch, RADIUS only between switch and server; ports 1812 and 1813', () => {
  for (const p of ALL) {
    for (const m of end(p).msgs) {
      const pair = [m.from, m.to].sort().join('-');
      if (m.proto === 'EAPOL' || m.proto === 'DHCP') assert.equal(pair, 'STA-SW', m.name);
      if (m.proto === 'RADIUS') {
        assert.equal(pair, 'AS-SW', m.name);
        assert.equal(m.udp, /^Accounting/.test(m.name) ? 1813 : 1812, m.name);
      } else assert.equal(m.udp, null);
    }
  }
});

test('rule 4: Access-Accept carries the VLAN attributes and the port takes VLAN 20 when it opens', () => {
  const s = end({});
  const acc = s.msgs.find((m) => m.name === 'Access-Accept');
  assert.deepEqual(acc.attrs, [
    { name: 'Tunnel-Type', value: 'VLAN (13)' },
    { name: 'Tunnel-Medium-Type', value: '802 (6)' },
    { name: 'Tunnel-Private-Group-ID', value: '20' }
  ]);
  assert.equal(acc.eap, 'Success');
  assert.equal(s.vlan, 20);
});

test('rule 5: Access-Reject → EAP-Failure; the port stays closed, DHCP still dropped, no VLAN, no accounting', () => {
  for (const method of ['peap', 'tls']) for (const medium of ['wired', 'wifi']) {
    const p = { method, medium, credentials: 'wrong' };
    const s = end(p);
    const names = s.msgs.map((m) => m.name);
    assert.ok(names.indexOf('Access-Reject') >= 0 && names.indexOf('Access-Reject') < names.indexOf('EAP-Failure'));
    assert.equal(s.msgs.find((m) => m.name === 'Access-Reject').eap, 'Failure');
    assert.equal(names.indexOf('Access-Accept'), -1);
    assert.equal(s.port, 'unauthorized');
    assert.equal(s.vlan, null);
    assert.equal(s.outcome, 'rejected');
    assert.deepEqual(dhcp(s).map((m) => m.dropped), [true, true]);
    assert.equal(s.aaa.authenticated.ok, false);
    assert.equal(s.aaa.authorized.ok, false);
    assert.equal(s.aaa.accounted, null);
    for (let n = 0; n <= L.steps(P(p)); n++) assert.equal(at(p, n).port, 'unauthorized', 'never open, step ' + n);
  }
});

test('rule 6: each of the four steps is done by the message the book names', () => {
  const s = end({});
  const by = (k) => msgsAt(s, s.aaa[k].step);
  assert.deepEqual(by('identified').map((m) => [m.name, m.round]), [['EAP-Response', 'identity']]);
  assert.ok(by('authenticated').some((m) => m.verdict === 'ok'));
  assert.deepEqual(by('authorized').map((m) => m.name), ['Access-Accept']);
  assert.deepEqual(by('accounted').map((m) => m.name), ['Accounting-Request', 'Accounting-Response']);
  assert.deepEqual(by('accounted')[0].attrs, [{ name: 'Acct-Status-Type', value: 'Start' }]);
});

test('rule 7: enterprise Wi-Fi runs the same EAP; Access-Accept also carries the PMK, only on Wi-Fi', () => {
  const wired = end({}), wifi = end({ medium: 'wifi' });
  const eap = (s) => s.msgs.filter((m) => m.step <= 11).map((m) => [m.step, m.from, m.to, m.name, m.round]);
  assert.deepEqual(eap(wifi), eap(wired));
  const pmk = (s) => s.msgs.find((m) => m.name === 'Access-Accept').attrs.some((a) => a.name === 'PMK');
  assert.equal(pmk(wifi), true);
  assert.equal(pmk(wired), false);
});

test('rule 8: server down: the Access-Request is sent twice, lost both times, then the port stays closed', () => {
  for (const p of ALL.filter((x) => !x.server)) {
    const s = end(p);
    assert.equal(L.steps(P(p)), 7);
    const req = s.msgs.filter((m) => m.name === 'Access-Request');
    assert.deepEqual(req.map((m) => [m.step, m.lost, m.retry, m.round]), [[5, true, false, 'identity'], [6, true, true, 'identity']]);
    assert.equal(s.msgs.filter((m) => m.from === 'AS').length, 0, 'nothing ever comes from the server');
    assert.equal(s.msgs.some((m) => m.name === 'Access-Reject' || m.name === 'EAP-Failure'), false, 'nobody decided');
    assert.equal(s.port, 'unauthorized');
    assert.equal(s.outcome, 'noReply');
    assert.deepEqual(s.notes.map((x) => x.what).slice(-1), ['noReply']);
    assert.equal(s.aaa.authenticated, null);
  }
});

test('methods: PEAP 4 folded rounds, EAP-TLS 3; wrong credentials fail at PEAP round 3, EAP-TLS round 2', () => {
  assert.equal(L.METHODS.peap.rounds.length, 4);
  assert.equal(L.METHODS.tls.rounds.length, 3);
  const rounds = (p) => L.script(P(p)).filter((k) => /^round/.test(k)).length;
  assert.equal(rounds({}), 4);
  assert.equal(rounds({ method: 'tls' }), 3);
  assert.equal(rounds({ credentials: 'wrong' }), 3);
  assert.equal(rounds({ method: 'tls', credentials: 'wrong' }), 2);
  const s = at({}, 6);
  assert.deepEqual(msgsAt(s, 6).map((m) => [m.from, m.to, m.name]),
    [['AS', 'SW', 'Access-Challenge'], ['SW', 'STA', 'EAP-Request'], ['STA', 'SW', 'EAP-Response'], ['SW', 'AS', 'Access-Request']]);
});

test('step counts: book 14, reject 11, server-down 7, wifi 14 (task file); EAP-TLS 13 and 10', () => {
  assert.equal(L.steps(P({})), 14);
  assert.equal(L.steps(P({ credentials: 'wrong' })), 11);
  assert.equal(L.steps(P({ server: false })), 7);
  assert.equal(L.steps(P({ medium: 'wifi' })), 14);
  assert.equal(L.steps(P({ method: 'tls' })), 13);
  assert.equal(L.steps(P({ method: 'tls', credentials: 'wrong' })), 10);
  for (const p of ALL) assert.ok(L.steps(P(p)) <= 20, 'at most 20 steps');
});

test('book run: the task file\'s step list, message by message', () => {
  const s = end({});
  const first = (n) => { const m = msgsAt(s, n)[0]; return m && m.name; };
  assert.deepEqual([2, 3, 4, 5, 10, 11, 13, 14].map(first),
    ['DHCPDISCOVER', 'EAP-Request', 'EAP-Response', 'Access-Request', 'Access-Accept', 'EAP-Success', 'DHCPDISCOVER', 'Accounting-Request']);
  assert.deepEqual(s.notes.map((x) => [x.step, x.what]), [[1, 'linkUp'], [12, 'portUp']]);
  assert.equal(s.outcome, 'authorized');
});

test('outcome and VLAN are set only when the port changes (or the run ends), never a step early', () => {
  for (const medium of ['wired', 'wifi']) {
    const p = { medium };
    for (const k of ['accept', 'success']) {
      const s = at(p, stepOf(p, k));
      assert.equal(s.outcome, null, medium + ' ' + k);
      assert.equal(s.vlan, null, medium + ' ' + k);
    }
    const r = { medium, credentials: 'wrong' };
    assert.equal(at(r, stepOf(r, 'reject')).outcome, null, 'rejected only once EAP-Failure is sent');
    assert.equal(at(r, stepOf(r, 'failure')).outcome, 'rejected');
  }
});

test('flags the page draws: lost only with the server down, the server verdict, identification ok', () => {
  for (const p of ALL) {
    const s = end(p);
    assert.equal(s.msgs.some((m) => m.lost), !p.server, JSON.stringify(p));
    assert.equal(s.aaa.identified.ok, true);
    const v = s.msgs.filter((m) => m.verdict);
    if (!p.server) assert.equal(v.length, 0);
    else {
      assert.equal(v.length, 1);
      assert.equal(v[0].verdict, p.credentials === 'wrong' ? 'wrong' : 'ok');
      assert.equal(v[0].round, L.METHODS[p.method].rounds[L.METHODS[p.method].check - 1][1]);
    }
    for (const m of s.msgs) {
      if (m.name === 'Access-Challenge' || m.name === 'EAP-Request') assert.equal(m.eap, 'Request');
      if (m.name === 'EAP-Response') assert.equal(m.eap, 'Response');
    }
  }
});

test('changed holds exactly what changed in that step', () => {
  const ch = (p, n) => at(p, n).changed;
  assert.deepEqual(ch({}, 1), ['port']);
  assert.deepEqual(ch({}, 2), []);
  assert.deepEqual(ch({}, 4), ['aaa.identified']);
  assert.deepEqual(ch({}, 5), []);
  assert.deepEqual(ch({}, 8), ['aaa.authenticated']);
  assert.deepEqual(ch({}, 9), []);
  assert.deepEqual(ch({}, 10), ['aaa.authorized']);
  assert.deepEqual(ch({}, 12), ['port', 'vlan']);
  assert.deepEqual(ch({}, 14), ['aaa.accounted']);
  assert.deepEqual(ch({ medium: 'wifi' }, 12), ['port', 'vlan']);
  for (let n = 1; n <= 14; n++) assert.deepEqual(at({}, n).last, { did: L.script(P({}))[n - 1], step: n });
  assert.equal(at({}, 7).phase, 'round2');
});

test('Wi-Fi labels: associated at step 1; the handshake runs between access point and laptop; PMK last attribute', () => {
  const s = end({ medium: 'wifi' });
  assert.deepEqual(s.notes[0], { step: 1, lane: 'SW', what: 'associated' });
  const hs = s.msgs.find((m) => m.name === '4-way handshake');
  assert.deepEqual([hs.from, hs.to, hs.step], ['SW', 'STA', 12]);
  assert.deepEqual(s.msgs.find((m) => m.name === 'Access-Accept').attrs.map((a) => a.name),
    ['Tunnel-Type', 'Tunnel-Medium-Type', 'Tunnel-Private-Group-ID', 'PMK']);
});

test('round contents: what the server asks and the laptop answers, per method', () => {
  const r = (p) => end(p).msgs.filter((m) => m.name === 'EAP-Request' && m.round !== 'identity').map((m) => m.round);
  const a = (p) => end(p).msgs.filter((m) => m.name === 'EAP-Response' && m.round !== 'identity').map((m) => m.round);
  assert.deepEqual(r({}), ['peapStart', 'serverCert', 'innerChallenge', 'innerResult']);
  assert.deepEqual(a({}), ['tlsHello', 'keyFinished', 'innerProof', 'ack']);
  assert.deepEqual(r({ method: 'tls' }), ['tlsStart', 'serverCertReq', 'serverFinished']);
  assert.deepEqual(a({ method: 'tls' }), ['tlsHello', 'clientCert', 'ack']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step of every combination', () => {
  for (const p of ALL) {
    for (let n = 0; n <= L.steps(P(p)); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of ALL) {
    const p = P(o);
    const forward = [];
    let s = L.initial(p);
    forward.push(s);
    for (let n = 1; n <= L.steps(p); n++) { s = L.step(s, n, p); forward.push(s); }
    for (let n = L.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n], JSON.stringify(o) + ' ' + n);
  }
});

test('step does not mutate its input', () => {
  for (const o of ALL) {
    const p = P(o);
    let s = L.initial(p);
    for (let n = 1; n <= L.steps(p); n++) {
      const copy = structuredClone(s);
      const next = L.step(s, n, p);
      assert.deepEqual(s, copy, JSON.stringify(o) + ' ' + n);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and sim.json steps is the default run', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, L.steps(L.defaults), 'meta.steps matches the default run');
  assert.equal(json.steps, L.steps(L.defaults), 'sim.json steps matches the default run');
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)];
  assert.equal(presets.length, 4, 'four presets');
  const want = { book: 14, reject: 11, 'server-down': 7, wifi: 14 };
  for (const m of presets) {
    const p = Function('return {' + m[1] + '}')();
    for (const k of Object.keys(p)) assert.ok(k in L.defaults, `preset param ${k} is a model param`);
  }
  for (const [id, n] of Object.entries(want)) {
    const m = html.match(new RegExp("id: '" + id + "'[^}]*params:\\s*\\{([^}]*)\\}"));
    assert.ok(m, id);
    assert.equal(L.steps(P(Function('return {' + m[1] + '}')())), n, id);
  }
});
