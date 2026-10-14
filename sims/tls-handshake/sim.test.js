// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for tls-handshake's model (SPEC.md). Tie-breaks first, then one test per rule, then the generic block.
// Run: node --test sims/tls-handshake/sim.test.js
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
const OFFERS = ['modern', 'old-allowed', 'old-forbidden'];
/** Messages of a column drawn at step n. */
const drawn = (col, n) => col.msgs.filter((x) => x.step === n);
/** Names per step of a column, TLS steps only (step 2 on). */
const flights = (col) => {
  const out = [];
  for (let n = 2; n <= col.i; n++) out.push(drawn(col, n).map((x) => x.name));
  return out;
};

// ── tie-breaks ──

test('rule 7: lockstep, one flight per step, the same moment in both columns', () => {
  for (let n = 1; n <= 4; n++) {
    const s = at({}, n);
    const a = drawn(s.v12, n).map((x) => x.half), b = drawn(s.v13, n).map((x) => x.half);
    assert.ok(a.length && b.length, 'both columns draw at step ' + n);
    assert.deepEqual([...new Set(a)], [...new Set(b)], 'same send time at step ' + n);
    for (const x of drawn(s.v12, n).concat(drawn(s.v13, n))) {
      assert.equal(x.half, n === 1 ? (x.name === 'SYN' ? 0 : 1) : n, x.name + ' leaves after ' + n + ' halves');
    }
    // one flight per step after TCP: one sender
    if (n > 1) for (const col of [s.v12, s.v13]) assert.equal(new Set(drawn(col, n).map((x) => x.from)).size, 1);
  }
});

test('rule 7: TLS 1.3 finishes at step 4 and waits, unchanged, while TLS 1.2 runs to its end at step 6', () => {
  assert.equal(L.steps(P({})), 6);
  const s4 = at({}, 4);
  assert.equal(s4.v13.done, true);
  assert.equal(s4.v13.waiting, false);
  assert.equal(s4.v12.done, false);
  for (const n of [5, 6]) {
    const s = at({}, n);
    assert.equal(s.v13.waiting, true, 'waits at ' + n);
    assert.deepEqual(drawn(s.v13, n), [], 'draws nothing at ' + n);
    const { waiting, ...rest } = s.v13;
    const { waiting: w4, ...rest4 } = s4.v13;
    assert.deepEqual(rest, rest4, 'the waiting column does not change at ' + n);
    assert.equal(s.v12.done, n === 6);
    assert.ok(drawn(s.v12, n).length > 0, '1.2 still draws at ' + n);
  }
});

test('rule 7: first application byte, TCP included: 1.2 = 3 RTT, 1.3 = 2 RTT (150 / 100 ms at 50 ms)', () => {
  const s = end({});
  assert.equal(s.v12.appDataAt, 3);
  assert.equal(s.v13.appDataAt, 2);
  for (const [rtt, a, b] of [[50, 150, 100], [10, 30, 20], [300, 900, 600]]) {
    const e = end({ rttMs: rtt });
    assert.equal(e.v12.appDataAt * rtt, a, '1.2 at RTT ' + rtt);
    assert.equal(e.v13.appDataAt * rtt, b, '1.3 at RTT ' + rtt);
    const data12 = e.v12.msgs.find((x) => x.app), data13 = e.v13.msgs.find((x) => x.app);
    assert.equal(L.msOf(data12.half, rtt), a, 'the data row is sent at ' + a + ' ms');
    assert.equal(L.msOf(data13.half, rtt), b, 'the data row is sent at ' + b + ' ms');
  }
  // no data before then
  assert.equal(at({}, 5).v12.appDataAt, null);
  assert.equal(at({}, 3).v13.appDataAt, null);
});

test('rows: same protection shares a row, at most two per row, application data alone', () => {
  const m = (enc, app) => ({ enc: !!enc, app: !!app });
  assert.deepEqual(L.rowsOf([m(), m(), m(), m()]), [0, 0, 1, 1], 'two per row');
  assert.deepEqual(L.rowsOf([m(), m(1), m(1), m(1), m(1)]), [0, 1, 1, 2, 2], 'protection changes the row');
  assert.deepEqual(L.rowsOf([m(1), m(1, 1)]), [0, 1], 'data alone');
  assert.deepEqual(L.rowsOf([m(), m(), m(1)]), [0, 0, 1], 'CKE + CCS, then Finished');
  assert.deepEqual(L.rowsOf([m(1, 1), m(1)]), [0, 1], 'nothing joins the data row after it either');
  // so a row is never half plain, half locked
  for (const v of ['v12', 'v13']) {
    const col = end({})[v];
    const rows = {};
    for (const x of col.msgs) (rows[x.flight + '.' + x.row] = rows[x.flight + '.' + x.row] || []).push(x);
    for (const k in rows) {
      assert.equal(new Set(rows[k].map((x) => x.enc)).size, 1, v + ' row ' + k + ' mixed');
      assert.ok(rows[k].length <= 2, v + ' row ' + k + ' too long');
      if (rows[k].some((x) => x.app)) assert.equal(rows[k].length, 1, 'data alone');
    }
  }
});

test('rule 2: a side holds the keys from the step the other side\'s key share reaches it (1.2: C 3, S 4; 1.3: S 2, C 3)', () => {
  const s = end({});
  assert.deepEqual(s.v12.keysAt, { C: 3, S: 4 });
  assert.deepEqual(s.v13.keysAt, { C: 3, S: 2 });
  for (const v of ['v12', 'v13']) {
    for (const x of s[v].msgs.filter((y) => y.share)) {
      assert.equal(s[v].keysAt[x.to], x.step, v + ': ' + x.name + ' gives ' + x.to + ' the keys');
    }
  }
  assert.deepEqual(at({}, 2).v12.keysAt, { C: null, S: null }, 'nobody has keys before the key exchange');
});

test('counter: the last flight drawn arrives at (1.2) 0, 1, 1½, 2, 2½, 3, 3½ RTT; 1.3 stops at 2½; alert 2; local 1', () => {
  const v12 = [], v13 = [];
  for (let n = 0; n <= 6; n++) { const s = at({}, n); v12.push(s.v12.rtt); v13.push(s.v13.rtt); }
  assert.deepEqual(v12, [0, 1, 1.5, 2, 2.5, 3, 3.5]);
  assert.deepEqual(v13, [0, 1, 1.5, 2, 2.5, 2.5, 2.5]);
  assert.equal(end({ clientOffers: 'old-allowed' }).att.rtt, 2);
  assert.equal(end({ clientOffers: 'old-forbidden' }).att.rtt, 1);
});

// ── rules ──

test('rule 1: TCP first, one round trip: SYN and SYN, ACK at step 1 in both columns, no TLS before step 2', () => {
  for (const over of [{}, { clientOffers: 'old-allowed' }, { clientOffers: 'old-forbidden' }]) {
    const s = at(over, 1);
    for (const col of s.mode === 'compare' ? [s.v12, s.v13] : [s.att]) {
      assert.deepEqual(col.msgs.map((x) => [x.name, x.from, x.to, x.half, x.tcp]),
        [['SYN', 'C', 'S', 0, true], ['SYN, ACK', 'S', 'C', 1, true]]);
      assert.equal(col.rtt, 1, 'one round trip');
    }
    const e = end(over);
    for (const col of e.mode === 'compare' ? [e.v12, e.v13] : [e.att]) {
      assert.ok(col.msgs.filter((x) => x.tcp).every((x) => x.step === 1), 'only step 1 is TCP');
      assert.ok(col.msgs.filter((x) => !x.tcp).every((x) => x.step >= 2), 'TLS from step 2');
    }
  }
});

test('rule 2: only a side that holds the keys sends encrypted; data only after the handshake; the server always sends its certificate', () => {
  const s = end({});
  for (const v of ['v12', 'v13']) {
    const col = s[v];
    for (const x of col.msgs.filter((y) => y.enc)) {
      assert.ok(col.keysAt[x.from] != null && col.keysAt[x.from] <= x.step, v + ': ' + x.name + ' at ' + x.step + ' before ' + x.from + ' has keys');
    }
    // the client's data never leaves before the server's Finished has reached it
    const fin = col.msgs.find((x) => x.name === 'Finished' && x.from === 'S');
    const data = col.msgs.find((x) => x.app);
    assert.ok(data.half > fin.half, v + ': data after the server Finished');
    assert.ok(col.msgs.some((x) => x.cert && x.from === 'S'), v + ': the server authenticates');
    assert.ok(!col.msgs.some((x) => x.cert && x.from === 'C'), v + ': no client certificate');
  }
});

test('rule 3: TLS 1.2 full handshake, flight by flight; data after 2 RTT of TLS', () => {
  const col = end({}).v12;
  assert.deepEqual(flights(col), [
    ['ClientHello'],
    ['ServerHello', 'Certificate', 'ServerKeyExchange', 'ServerHelloDone'],
    ['ClientKeyExchange', 'ChangeCipherSpec', 'Finished'],
    ['ChangeCipherSpec', 'Finished'],
    ['data']
  ]);
  assert.deepEqual(col.msgs.filter((x) => !x.tcp).map((x) => x.from).join(''), 'CSSSSCCCSSC');
  assert.equal(col.appDataAt - 1, 2, 'two round trips of TLS');
});

test('rule 4: TLS 1.3 full handshake, key share in the ClientHello; data with the client Finished, after 1 RTT of TLS', () => {
  const col = end({}).v13;
  assert.deepEqual(flights(col), [
    ['ClientHello'],
    ['ServerHello', 'EncryptedExtensions', 'Certificate', 'CertificateVerify', 'Finished'],
    ['Finished', 'data']
  ]);
  assert.ok(col.msgs.find((x) => x.name === 'ClientHello').share, 'ClientHello carries key_share');
  assert.ok(col.msgs.find((x) => x.name === 'ServerHello').share, 'ServerHello carries key_share');
  assert.equal(col.appDataAt - 1, 1, 'one round trip of TLS');
});

test('rule 5: 1.3 encrypts everything after ServerHello, the certificate too; 1.2 sends its certificate in clear', () => {
  const s = end({});
  const tls13 = s.v13.msgs.filter((x) => !x.tcp);
  const sh = tls13.findIndex((x) => x.name === 'ServerHello');
  tls13.forEach((x, i) => assert.equal(x.enc, i > sh, '1.3 ' + x.name));
  assert.equal(s.v13.msgs.find((x) => x.cert).enc, true, '1.3 certificate encrypted');
  assert.equal(s.v12.msgs.find((x) => x.cert).enc, false, '1.2 certificate in clear');
  assert.ok(drawn(s.v12, 3).every((x) => !x.enc), '1.2 server flight 2 all in clear');
  assert.deepEqual(s.v12.msgs.filter((x) => x.enc).map((x) => x.name), ['Finished', 'Finished', 'data'], '1.2 encrypts only Finished and data');
  for (const v of ['v12', 'v13']) {
    for (const x of s[v].msgs) {
      if (x.share || x.name === 'ChangeCipherSpec') assert.equal(x.enc, false, v + ' ' + x.name + ' is always in clear');
    }
  }
});

test('rule 5: the eavesdropper reads the certificate in 1.2 from step 3, never in 1.3; nothing of an encrypted message', () => {
  for (let n = 0; n <= 6; n++) {
    const s = at({}, n);
    assert.equal(s.v12.read.includes('cert'), n >= 3, '1.2 at ' + n);
    assert.equal(s.v13.read.includes('cert'), false, '1.3 at ' + n);
  }
  const s = end({});
  for (const v of ['v12', 'v13']) {
    for (const x of s[v].msgs.filter((y) => y.enc)) assert.deepEqual(x.reads, [], v + ' ' + x.name);
    for (const it of ['sni', 'versions', 'suites', 'version', 'suite', 'shareC', 'shareS']) assert.ok(s[v].read.includes(it), v + ' reads ' + it);
    assert.ok(!s[v].read.includes('keys') && !s[v].read.includes('data'));
  }
  // the 1.3 eavesdropper sees both key shares already at step 3, as the 1.2 one does only at step 4
  assert.ok(at({}, 3).v13.read.includes('shareC') && at({}, 3).v13.read.includes('shareS'));
  assert.ok(!at({}, 3).v12.read.includes('shareC') && at({}, 4).v12.read.includes('shareC'));
});

test('rule 5: the negotiated cipher suites are the book\'s, chosen in ServerHello', () => {
  assert.deepEqual(L.SUITES, { '1.2': 'ECDHE-RSA-AES256-GCM-SHA384', '1.3': 'TLS_AES_256_GCM_SHA384' });
  assert.equal(at({}, 2).v12.suite, null);
  assert.equal(at({}, 3).v12.suite, 'ECDHE-RSA-AES256-GCM-SHA384');
  assert.equal(at({}, 3).v13.suite, 'TLS_AES_256_GCM_SHA384');
  // the suites toggle changes the view, not the model
  assert.deepEqual(end({ suites: true }), end({ suites: false }));
});

test('rule 6: policy forbids the only version wanted: a local error, nothing TLS sent, the server never asked', () => {
  const o = { clientOffers: 'old-forbidden' };
  assert.equal(L.steps(P(o)), 2);
  assert.deepEqual(at(o, 0).offered, [], 'no protocol to offer');
  assert.deepEqual(at(o, 0).wanted, ['1.1']);
  assert.equal(at(o, 1).failure, null, 'not before the handshake is prepared');
  const s = end(o);
  assert.equal(s.failure, 'no_protocols_local');
  assert.ok(s.att.msgs.every((x) => x.tcp), 'only TCP on the wire');
  assert.ok(!s.att.msgs.some((x) => x.from === 'S' && !x.tcp), 'the server says nothing');
  assert.deepEqual(s.att.keysAt, { C: null, S: null });
  assert.equal(s.att.appDataAt, null);
});

test('rule 6: policy allows TLS 1.1: the server answers ClientHello with alert protocol_version (70), in clear', () => {
  const o = { clientOffers: 'old-allowed' };
  assert.equal(L.steps(P(o)), 3);
  assert.deepEqual(at(o, 0).offered, ['1.1']);
  assert.equal(at(o, 2).failure, null);
  assert.deepEqual(drawn(at(o, 2).att, 2).map((x) => [x.name, x.from, x.enc]), [['ClientHello', 'C', false]]);
  const s = end(o);
  const alert = drawn(s.att, 3);
  assert.deepEqual(alert.map((x) => [x.name, x.from, x.to, x.alert, x.enc]), [['Alert', 'S', 'C', 'protocol_version', false]]);
  assert.equal(L.ALERT_CODE[alert[0].alert], 70);
  assert.equal(s.failure, 'protocol_version');
  assert.deepEqual(s.att.keysAt, { C: null, S: null });
  assert.equal(s.att.appDataAt, null);
  assert.ok(!L.SERVER_ACCEPTS.includes('1.1') && !L.SERVER_ACCEPTS.includes('1.0'), 'RFC 8996');
  assert.deepEqual(s.att.read, ['tcp', 'sni', 'versions', 'suites', 'alert'], 'the eavesdropper reads the offer and the alert');
});

test('steps per preset: side-by-side 6, book-versions 6, old-version-local 2, old-version-alert 3; the RTT changes only times', () => {
  assert.deepEqual([{}, { suites: true }, { clientOffers: 'old-forbidden' }, { clientOffers: 'old-allowed' }].map((o) => L.steps(P(o))), [6, 6, 2, 3]);
  const a = end({ rttMs: 10 }), b = end({ rttMs: 300 });
  assert.deepEqual(a.v12.msgs, b.v12.msgs);
  assert.deepEqual(a.v13.msgs, b.v13.msgs);
  assert.equal(L.msOf(3, 50), 75);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const clientOffers of OFFERS) {
    const p = P({ clientOffers, rttMs: 70 });
    for (let n = 0; n <= L.steps(p); n++) {
      const s = kit.stateAt(L, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const clientOffers of OFFERS) {
    const p = P({ clientOffers, rttMs: 120 });
    const forward = [];
    let s = L.initial(p);
    forward.push(s);
    for (let n = 1; n <= L.steps(p); n++) { s = L.step(s, n, p); forward.push(s); }
    for (let n = L.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n], clientOffers + ' ' + n);
  }
});

test('step does not mutate its input', () => {
  for (const clientOffers of OFFERS) {
    const p = P({ clientOffers });
    let s = L.initial(p);
    for (let n = 1; n <= L.steps(p); n++) {
      const copy = structuredClone(s);
      const next = L.step(s, n, p);
      assert.deepEqual(s, copy, clientOffers + ' ' + n);
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
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, L.steps(L.defaults), 'meta.steps matches the default run');
  assert.equal(json.steps, L.steps(L.defaults), 'sim.json steps matches the default run');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in L.defaults, `preset param ${k} is a model param`);
  for (const v of [...html.matchAll(/clientOffers: '([\w-]+)'/g)].map((m) => m[1])) assert.ok(OFFERS.includes(v), v);
});
