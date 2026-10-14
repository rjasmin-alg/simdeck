// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cert-chain's model: tie-breaks first, then one test per rule (SPEC.md), then the presets' numbers,
// then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const C = logic.CERTS;
const D = logic.dayOf;
const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (p) => kit.stepsOf(logic, p);
const at = (p, n) => kit.stateAt(logic, p, n);
const end = (p) => at(p, steps(p));
/** One validation on plain data: the client's date defaults to the book's. */
const v = (over) => logic.validate(Object.assign({ open443: true, sends: ['www1'], store: ['pubroot'], certs: C, now: logic.BOOK_DAY }, over));
const kinds = (r) => r.checks.map((c) => c.kind + (c.ok ? '' : '!'));
/** Every step of a preset or params. */
const all = (p) => Array.from({ length: steps(p) + 1 }, (_, n) => at(p, n));
/** The result of scene i (its last step). */
const resultOf = (p, i) => all(p).filter((s) => s.scene === i && s.connections[0].result).pop().connections[0].result;

// The page's presets, read from index.html so a renamed param fails here.
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
function presetParams(id) {
  const m = html.match(new RegExp(`id: '${id}'[^}]*params: \\{([^}]*)\\}`));
  assert.ok(m, `preset ${id} in index.html`);
  // eslint-disable-next-line no-new-func
  return P(Function(`return {${m[1].replace(/OFFSET_WRONG_CLOCK/, String(D('2028-01-01') - logic.BOOK_DAY))}}`)());
}

// ── tie-breaks (rule 8) ──

test('tie-break: leaf first, stop at the first failure (expired leaf AND unknown issuer → unknown issuer)', () => {
  const r = v({ sends: ['www1old'] }); // www1-istekao.crt is expired, and the lab CA is not in the store
  assert.deepEqual(kinds(r), ['connect', 'issuer!']);
  assert.equal(r.result.reason, 'unknown-issuer');
  assert.equal(r.result.certId, 'www1old');
});

test('tie-break: within one certificate, issuer and signature before the date', () => {
  const certs = Object.assign({}, C, { www1old: Object.assign({}, C.www1old, { sigOk: false }) });
  const r = v({ sends: ['www1old'], store: ['labca'], certs });
  assert.equal(r.result.reason, 'bad-signature'); // expired too, but the signature is checked first
});

test('tie-break: the lowest failing link is reported, not a higher one', () => {
  // leaf expired AND intermediate expired: the leaf's date is checked first.
  const now = D('2029-06-01'); // after both web (2027-06-01) and pubint (2029-03-01)
  const r = v({ sends: ['web', 'pubint'], now });
  assert.equal(r.result.certId, 'web');
  assert.equal(r.result.reason, 'expired');
});

test('tie-break: issuer search looks at the certificates sent before the store', () => {
  const r = v({ sends: ['www1', 'labca'], store: ['pubroot', 'labca'] });
  assert.equal(r.checks[1].from, 'sent');
  assert.deepEqual(kinds(r), ['connect', 'issuer', 'validity', 'anchor']); // labca (sent) is then found in the store
  assert.equal(r.result.exit, 0);
});

test('tie-break: no connection is reported before any certificate fault', () => {
  const r = v({ open443: false, sends: ['pkg'], now: D('2030-01-01') });
  assert.deepEqual(kinds(r), ['connect!']);
  assert.equal(r.result.exit, 7);
});

// ── rules ──

test('rule 1–2: the path follows issuer → subject up to a certificate in the store', () => {
  const r = v({ sends: ['web', 'pubint'] });
  assert.deepEqual(r.checks.filter((c) => c.kind === 'issuer').map((c) => [c.certId, c.issuerId, c.from]),
    [['web', 'pubint', 'sent'], ['pubint', 'pubroot', 'store']]);
  assert.deepEqual(kinds(r), ['connect', 'issuer', 'validity', 'issuer', 'validity', 'anchor']);
  assert.equal(r.result.exit, 0);
  assert.equal(r.result.certId, 'pubroot');
});

test('rule 3: a root the server sends is not an anchor unless the client holds it', () => {
  const r = v({ sends: ['www1', 'labca'] });
  assert.equal(r.result.reason, 'self-signed');
  assert.equal(r.result.certId, 'labca');
  assert.equal(r.result.fix, 'client');
  assert.equal(v({ sends: ['www1', 'labca'], store: ['labca'] }).result.exit, 0);
});

test('rule 4: self-signed certificate not in the store → 60 self-signed, unknown_ca; in the store → trusted', () => {
  const leaf = v({ sends: ['p4'] }); // a lone self-signed leaf
  assert.deepEqual([leaf.result.exit, leaf.result.reason, leaf.result.alert, leaf.result.fix], [60, 'self-signed', 'unknown_ca', 'server']);
  assert.equal(v({ sends: ['p4'], store: ['p4'] }).result.exit, 0);
  // a self-signed leaf is the server's to fix even when the server sends more certificates with it
  assert.deepEqual([v({ sends: ['p4', 'labca'] }).result.certId, v({ sends: ['p4', 'labca'] }).result.fix], ['p4', 'server']);
  // the package's file: a leaf and its own self-signed CA, which no client is meant to trust → fix on the server
  const pkg = v({ sends: ['pkg', 'pkgca'] });
  assert.deepEqual(kinds(pkg), ['connect', 'issuer', 'validity', 'issuer!']);
  assert.deepEqual([pkg.result.reason, pkg.result.certId, pkg.result.fix], ['self-signed', 'pkgca', 'server']);
  assert.equal(v({ sends: ['pkg', 'pkgca'], store: ['labca'] }).result.reason, 'self-signed'); // the lab CA does not help it
});

test('rule 4: issuer the client cannot find → 60 unknown issuer, unknown_ca, fix on the client for a root', () => {
  const r = v({ sends: ['www1'] });
  assert.deepEqual([r.result.exit, r.result.reason, r.result.alert, r.result.fix], [60, 'unknown-issuer', 'unknown_ca', 'client']);
});

test('rule 5: a missing intermediate is an unknown issuer too, with the fix on the server', () => {
  const r = v({ sends: ['web'] });
  assert.deepEqual([r.result.exit, r.result.reason, r.result.fix], [60, 'unknown-issuer', 'server']);
  assert.equal(v({ sends: ['web', 'pubint'] }).result.exit, 0);
});

test('rule 6: every certificate in the path is checked at the client clock, inclusive window, anchor included', () => {
  const na = C.www1.notAfter, nb = C.www1.notBefore;
  const store = ['labca'];
  assert.equal(v({ store, now: na }).result.exit, 0, 'valid on its notAfter day');
  assert.equal(v({ store, now: na + 1 }).result.reason, 'expired');
  assert.equal(v({ store, now: nb }).result.exit, 0, 'valid on its notBefore day');
  assert.equal(v({ store, now: nb - 1 }).result.reason, 'not-yet-valid');
  assert.equal(v({ store, now: na + 1 }).result.alert, 'certificate_expired');
  assert.equal(v({ store, now: nb - 1 }).result.alert, 'certificate_expired');
  // the intermediate's date matters too
  const r = v({ sends: ['web', 'pubint'], now: D('2026-12-01'), certs: Object.assign({}, C, { pubint: Object.assign({}, C.pubint, { notAfter: D('2026-11-30') }) }) });
  assert.equal(r.result.certId, 'pubint');
  // and the anchor's
  const p4 = v({ sends: ['p4'], store: ['p4'], now: C.p4.notAfter + 1 });
  assert.deepEqual([p4.checks[1].kind, p4.result.reason], ['anchor', 'expired']);
});

test('rule 6: a wrong client clock alone causes the failure, and the fix is then on the client', () => {
  const now = D('2028-01-01');
  const r = v({ store: ['labca'], now, trueDay: logic.BOOK_DAY });
  assert.deepEqual([r.result.reason, r.result.fix], ['expired', 'client']);
  const real = v({ sends: ['www1old'], store: ['labca'], now: logic.BOOK_DAY, trueDay: logic.BOOK_DAY });
  assert.deepEqual([real.result.reason, real.result.fix], ['expired', 'server']);
  // a clock set back can hide an expiry: www.example.com expired on 2027-06-01, the client's clock says 2027-01-01
  const hidden = v({ sends: ['web', 'pubint'], now: D('2027-01-01'), trueDay: D('2027-08-01') });
  assert.equal(hidden.result.exit, 0);
  assert.equal(v({ sends: ['web', 'pubint'], now: D('2027-08-01') }).result.reason, 'expired');
});

test('rule 7: no connection is exit 7, no alert, before any certificate is seen', () => {
  const r = v({ open443: false });
  assert.deepEqual(r.checks, [{ certId: null, kind: 'connect', ok: false, reason: 'connect' }]);
  assert.deepEqual([r.result.exit, r.result.alert, r.result.fix], [7, null, 'server']);
});

test('rule 10: a signature that does not verify → 60, bad_certificate', () => {
  const certs = Object.assign({}, C, { www1: Object.assign({}, C.www1, { sigOk: false }) });
  const r = v({ store: ['labca'], certs });
  assert.deepEqual([r.result.exit, r.result.reason, r.result.alert, r.result.fix], [60, 'bad-signature', 'bad_certificate', 'server']);
});

test('days: ISO dates and day numbers round-trip; the scan\'s day counts', () => {
  for (const d of ['1970-01-01', '2000-02-29', '2024-12-31', '2026-11-19', '2036-09-02']) assert.equal(logic.isoOf(D(d)), d);
  assert.equal(D('1970-01-01'), 0);
  assert.equal(C.wild.notAfter - D('2026-11-02'), 17);
  assert.equal(C.p4.notAfter - D('2026-11-02'), 29);
  assert.equal(C.wild.notAfter - C.wild.notBefore, 397);
  assert.equal(logic.BOOK_DAY - C.www1old.notAfter, 461);
});

// ── presets: the numbers in SPEC.md ──

test('book-five-states: 7 → 60 → 60 → 0 → 60 in 14 steps, the defaults', () => {
  const p = presetParams('book-five-states');
  assert.deepEqual(p, logic.defaults);
  assert.equal(steps(p), 14);
  const e = end(p);
  assert.deepEqual(e.history, [[7], [60], [60], [0], [60]]);
  const reasons = [1, 5, 7, 11, 14].map((n) => at(p, n).connections[0].result);
  assert.deepEqual(reasons.map((r) => r.reason), ['connect', 'self-signed', 'unknown-issuer', null, 'expired']);
  assert.deepEqual(reasons.map((r) => r.fix), ['server', 'server', 'client', null, 'server']);
  // a scene changes together with its first check, and says what changed
  assert.deepEqual([at(p, 2).event, at(p, 2).changed, at(p, 2).connections[0].checks.length], ['openFirewall', ['https443Open'], 1]);
  assert.deepEqual(at(p, 3).changed, []);
  assert.equal(at(p, 0).connections[0].checks.length, 0);
});

test('missing-intermediate: unknown issuer with only the leaf, 0 with the intermediate, 8 steps', () => {
  const p = presetParams('missing-intermediate');
  assert.equal(steps(p), 8);
  assert.deepEqual(end(p).history, [[60], [0]]);
  assert.deepEqual([at(p, 2).connections[0].result.reason, at(p, 2).connections[0].result.fix], ['unknown-issuer', 'server']);
  assert.deepEqual(at(p, 3).connections[0].serverSends, ['web', 'pubint']);
});

test('expiry-clocks: five steps of dates; the wildcard fails on all five endpoints from 11-20, p4-commit from 12-02', () => {
  const p = presetParams('expiry-clocks');
  assert.equal(steps(p), 5);
  const dates = [0, 1, 2, 3, 4, 5].map((n) => at(p, n).nowIso);
  assert.deepEqual(dates, ['2026-11-02', '2026-11-18', '2026-11-19', '2026-11-20', '2026-12-01', '2026-12-02']);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => at(p, n).connections.map((c) => c.result.exit)),
    [[0, 0], [0, 0], [0, 0], [60, 0], [60, 0], [60, 60]]);
  assert.equal(at(p, 3).connections[0].endpoints.length, 5);
  assert.equal(at(p, 3).connections[0].result.alert, 'certificate_expired');
});

test('wrong-client-clock: www1.crt, the anchor held, clock 2028-01-01 → expired in 3 steps, fix on the client', () => {
  const p = presetParams('wrong-client-clock');
  assert.equal(p.clockOffsetDays, 483);
  assert.equal(steps(p), 3);
  const e = end(p);
  assert.equal(e.nowIso, '2028-01-01');
  assert.deepEqual([e.connections[0].result.reason, e.connections[0].result.fix], ['expired', 'client']);
  assert.equal(e.now - C.www1.notAfter, 118);
});

test('build: the task\'s defaults give the task\'s caption state (unknown issuer, fix on the client)', () => {
  const p = presetParams('build');
  assert.deepEqual([p.https443Open, p.serverCert, p.anchorInStore], [true, 'lab', false]);
  assert.equal(steps(p), 2);
  assert.equal(end(p).connections[0].result.reason, 'unknown-issuer');
});

test('the book starts from its self-signed certificate and the intermediate story from the public chain', () => {
  assert.deepEqual(at(P({ serverCert: 'public', https443Open: true }), 1).connections[0].serverSends, ['pkg', 'pkgca']);
  assert.deepEqual(at(P({ story: 'intermediate', serverCert: 'lab', https443Open: true }), 1).connections[0].serverSends, ['web']);
  assert.deepEqual(at(P({ story: 'one', serverCert: 'expired' }), 0).connections[0].serverSends, ['www1old']);
});

test('an event that changes nothing still makes a state, with nothing marked changed', () => {
  const p = P({ https443Open: true }); // the book's first event (open the firewall) is then a no-op
  const start = all(p).find((s) => s.event === 'openFirewall');
  assert.equal(start.sceneStart, true);
  assert.deepEqual(start.changed, []);
  assert.deepEqual(end(p).history, [[60], [60], [60], [0], [60]]);
});

test('the clock offset applies to every state; the range ends give valid states', () => {
  for (const o of [logic.OFFSET_MIN, -1, 0, 1, logic.OFFSET_MAX]) {
    const p = P({ clockOffsetDays: o });
    const e = end(p);
    assert.equal(e.now, logic.BOOK_DAY + o);
    assert.ok(steps(p) >= 10 && steps(p) <= 20);
  }
  assert.deepEqual([resultOf(P({ clockOffsetDays: -400 }), 3).reason, resultOf(P({ clockOffsetDays: -400 }), 3).fix], ['not-yet-valid', 'client']);
  // a real expiry stays the server's even when the clock is also off a little
  assert.deepEqual([resultOf(P({ clockOffsetDays: 1 }), 4).reason, resultOf(P({ clockOffsetDays: 1 }), 4).fix], ['expired', 'server']);
});

test('the estate story moves with the clock offset too, and its strip keeps both rows', () => {
  const p = P({ story: 'clocks', clockOffsetDays: 3 });
  assert.equal(at(p, 0).nowIso, '2026-11-05');
  assert.equal(at(p, 0).trueIso, '2026-11-02');
  assert.equal(at(p, 0).offset, 3);
  assert.deepEqual(end(p).history[5], [60, 60]);
  const early = P({ story: 'clocks', clockOffsetDays: -400 }); // 2025-09-28: before the wildcard's notBefore
  assert.equal(at(early, 0).connections[0].result.reason, 'not-yet-valid');
  assert.deepEqual(at(P({ story: 'clocks' }), 3).changed, ['clock']);
  assert.ok(all(P({ story: 'clocks' })).every((s) => s.connections.every((c) => c.newCheck === -1)));
});

test('reveal: the result appears with the last check only; history fills when a state has run; newCheck is the last check', () => {
  for (const id of ['book-five-states', 'missing-intermediate', 'wrong-client-clock', 'build', 'expiry-clocks']) {
    const p = presetParams(id);
    all(p).forEach((s, n) => {
      for (const c of s.connections) assert.equal(!!c.result, c.checks.length === c.total, `${id} ${n}`);
      s.history.forEach((h, i) => assert.equal(!!h, i < s.scene || (i === s.scene && s.connections.every((c) => c.result)), `${id} ${n} history ${i}`));
      if (p.story !== 'clocks') assert.equal(s.connections[0].newCheck, n === 0 ? -1 : s.connections[0].checks.length - 1, `${id} ${n}`);
      assert.equal(s.sceneStart, n > 0 && at(p, n - 1).scene !== s.scene, `${id} ${n} sceneStart`);
      for (const id2 of s.store) assert.ok(s.certs[id2], `${id} store cert ${id2} in certs`);
    });
    assert.equal(at(p, 0).sceneStart, false);
  }
});

test('dates of every certificate in the path use the client clock, not the true date', () => {
  const certs = Object.assign({}, C, { pubint: Object.assign({}, C.pubint, { notAfter: D('2026-10-01') }) });
  const r = v({ sends: ['web', 'pubint'], certs, now: D('2026-10-02'), trueDay: D('2026-09-05') });
  assert.deepEqual([r.result.certId, r.result.reason, r.result.fix], ['pubint', 'expired', 'client']);
  const anc = v({ sends: ['p4'], store: ['p4'], now: D('2024-11-30'), trueDay: D('2026-09-05') });
  assert.deepEqual([anc.checks[1].kind, anc.result.reason], ['anchor', 'not-yet-valid']);
  assert.equal(anc.result.fix, null, 'an anchor out of date has no single fix side');
});

test('validate works on the certificates it is given (fix side from those, not the built-in set)', () => {
  const certs = {
    leaf: { file: 'a', subject: 'CN=a', issuer: 'CN=mid', notBefore: 0, notAfter: 99999, selfSigned: false, sigOk: true },
    mid: { file: 'b', subject: 'CN=mid', issuer: 'CN=root', notBefore: 0, notAfter: 99999, selfSigned: false, sigOk: true },
    root: { file: 'c', subject: 'CN=root', issuer: 'CN=root', notBefore: 0, notAfter: 99999, selfSigned: true, sigOk: true }
  };
  const r = logic.validate({ open443: true, sends: ['leaf'], store: ['root'], certs, now: 100 });
  assert.deepEqual([r.result.reason, r.result.fix], ['unknown-issuer', 'server']);
  const r2 = logic.validate({ open443: true, sends: ['leaf', 'mid'], store: [], certs, now: 100 });
  assert.deepEqual([r2.result.reason, r2.result.fix], ['unknown-issuer', 'client']);
});

test('pinned numbers: hosts, the range ends, the intermediate\'s dates', () => {
  assert.deepEqual([logic.OFFSET_MIN, logic.OFFSET_MAX], [-400, 800]);
  assert.deepEqual(at(presetParams('missing-intermediate'), 0).connections[0].endpoints, ['www.example.com:443']);
  assert.deepEqual(at(P({}), 0).connections[0].endpoints, ['www1.lab.example:443']);
  assert.equal(logic.isoOf(C.pubint.notAfter), '2029-03-01');
  assert.deepEqual(at(presetParams('expiry-clocks'), 0).connections.map((c) => c.endpoints.length), [5, 1]);
});

test('every story stays within 20 steps for every param combination', () => {
  let max = 0;
  for (const story of ['book', 'intermediate', 'clocks', 'one'])
    for (const serverCert of ['self', 'lab', 'expired', 'public'])
      for (const https443Open of [true, false])
        for (const sendIntermediate of [true, false])
          for (const anchorInStore of [true, false])
            for (const clockOffsetDays of [-400, 0, 483, 800]) {
              const s = steps(P({ story, serverCert, https443Open, sendIntermediate, anchorInStore, clockOffsetDays }));
              assert.ok(s >= 1 && s <= 20, `${story} ${serverCert}: ${s}`);
              max = Math.max(max, s);
            }
  assert.ok(max <= 20);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const id of ['book-five-states', 'missing-intermediate', 'expiry-clocks', 'wrong-client-clock', 'build']) {
    const p = presetParams(id);
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ clockOffsetDays: 17 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input, nor the certificates', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  const certs = structuredClone(C);
  logic.step(s0, 1, p);
  end(p);
  assert.deepEqual(s0, copy);
  assert.deepEqual(C, certs);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and meta.steps is the default\'s count', () => {
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
