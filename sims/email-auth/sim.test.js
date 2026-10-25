// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for email-auth's model. Run: node --test sims/email-auth/sim.test.js
// Tie-breaks first, then rules 1–8 (SPEC.md), the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const at = (over, n) => kit.stateAt(L, P(over), n);
const end = (over) => at(over, L.steps);
/** A one-domain zone with an SPF record, plus addresses for a few hosts. */
const zone = (txt, extra) => Object.assign({ 'd.example': { TXT: [].concat(txt) } }, extra || {});
/** Replay with the zone changed before step 1. */
const replay = (over, edit) => {
  const p = P(over);
  let s = L.initial(p);
  edit(s.dns);
  for (let n = 1; n <= L.steps; n++) s = L.step(s, n, p);
  return s;
};

const PRESETS = {
  legit: {},
  'mailing-list-signed': { scenario: 'list', policy: 'reject' },
  'mailing-list-unsigned': { scenario: 'list', policy: 'reject', signed: false },
  'spoof-own-domain': { scenario: 'spoof' },
  'subdomain-alignment': { scenario: 'subdomain', signed: false }
};

// ── tie-breaks ──

test('tie-break: two terms match the IP → the first one decides', () => {
  const z = zone('v=spf1 -a mx', { 'd.example': { TXT: ['v=spf1 -a mx'], A: ['192.0.2.1'], MX: [{ pref: 10, host: 'm.d.example' }] }, 'm.d.example': { A: ['192.0.2.1'] } });
  const r = L.checkHost('192.0.2.1', 'd.example', z);
  assert.equal(r.result, 'fail');
  assert.equal(r.decided, 0);
  assert.equal(r.terms[1].state, 'unread', 'mx is never evaluated');
  const r2 = L.checkHost('192.0.2.1', 'd.example', Object.assign({}, z, { 'd.example': Object.assign({}, z['d.example'], { TXT: ['v=spf1 mx -a'] }) }));
  assert.equal(r2.result, 'pass');
});

test('tie-break: all matches everything, so terms after it are never read', () => {
  const r = L.checkHost('192.0.2.1', 'd.example', zone('v=spf1 -all a', { 'd.example': { TXT: ['v=spf1 -all a'], A: ['192.0.2.1'] } }));
  assert.equal(r.result, 'fail');
  assert.equal(r.terms[1].state, 'unread');
  assert.equal(r.dnsTerms, 0);
});

test('tie-break: a match at the 10th DNS term passes, at the 11th it is permerror', () => {
  const hosts = {};
  for (let i = 1; i <= 11; i++) hosts['h' + i + '.example'] = { A: ['198.51.100.' + i] };
  const rec = (k) => 'v=spf1 ' + Array.from({ length: k }, (_, i) => 'a:h' + (i + 1) + '.example').join(' ') + ' -all';
  const ten = L.checkHost('198.51.100.10', 'd.example', zone(rec(10), hosts));
  assert.equal(ten.result, 'pass');
  assert.equal(ten.dnsTerms, 10);
  const eleven = L.checkHost('198.51.100.11', 'd.example', zone(rec(11), hosts));
  assert.equal(eleven.result, 'permerror');
  assert.equal(eleven.why, 'limit');
  assert.equal(eleven.decided, 10);
  // terms after the deciding one do not count: a match at the 3rd of 11 is a pass
  const early = L.checkHost('198.51.100.3', 'd.example', zone(rec(11), hosts));
  assert.equal(early.result, 'pass');
  assert.equal(early.dnsTerms, 3);
});

test('tie-break: only pass counts: softfail, neutral or a DKIM permerror with the right name do not align', () => {
  for (const all of ['~all', '?all', '-all']) {
    const s = replay({ signed: false }, (z) => { z['lab.example'].TXT = ['v=spf1 ' + all]; });
    assert.notEqual(s.spf.result, 'pass');
    assert.equal(s.aligned.spf.identical, true, 'the name matches From:');
    assert.equal(s.aligned.spf.aligned, false, all + ' is not an aligned pass');
    assert.equal(s.verdict, 'fail');
  }
  const k = replay({}, (z) => { z['lab.example'].TXT = ['v=spf1 ~all']; delete z['sel1._domainkey.lab.example']; });
  assert.equal(k.dkim.result, 'permerror');
  assert.equal(k.aligned.dkim.identical, true);
  assert.equal(k.aligned.dkim.aligned, false);
  assert.equal(k.verdict, 'fail');
});

// ── rule 1: SPF checks the envelope ──

test('rule 1: SPF checks the MAIL FROM domain, not HELO and not From:', () => {
  // spoof: From: says lab.example, the envelope says zlo.example; SPF reads zlo.example
  const sp = at({ scenario: 'spoof' }, 1);
  assert.equal(sp.spf.domain, 'zlo.example');
  assert.equal(sp.lookups[0].name, 'zlo.example');
  // legit: HELO posluzitelj.lab.example has no SPF record (none); the envelope's lab.example passes
  const lg = at({}, 1);
  assert.equal(L.checkHost(lg.msg.ip, lg.msg.helo, lg.dns).result, 'none');
  assert.equal(lg.spf.domain, 'lab.example');
  assert.equal(lg.spf.result, 'pass');
});

// ── rule 2: terms, qualifiers, mechanisms ──

test('rule 2: qualifiers + - ~ ?, default +', () => {
  const r = (q) => L.checkHost('192.0.2.9', 'd.example', zone('v=spf1 ' + q + 'ip4:192.0.2.9')).result;
  assert.equal(r(''), 'pass');
  assert.equal(r('+'), 'pass');
  assert.equal(r('-'), 'fail');
  assert.equal(r('~'), 'softfail');
  assert.equal(r('?'), 'neutral');
});

test('rule 2: no term matches → neutral', () => {
  const r = L.checkHost('192.0.2.9', 'd.example', zone('v=spf1 ip4:192.0.2.1'));
  assert.equal(r.result, 'neutral');
  assert.equal(r.decided, -1);
});

test('rule 2: a matches AAAA too', () => {
  const z = { 'd.example': { TXT: ['v=spf1 a -all'], AAAA: ['2001:db8::25'] } };
  assert.equal(L.checkHost('2001:db8::25', 'd.example', z).result, 'pass');
});

test('rule 2: mx takes two lookups (MX, then the host addresses) and matches by the host', () => {
  const s = at({}, 1);
  assert.equal(s.spf.result, 'pass');
  assert.equal(s.spf.terms[s.spf.decided].text, 'mx');
  assert.equal(s.spf.terms[0].state, 'nomatch', 'a: lab.example has no address');
  const mxq = s.spf.terms[1].queries.map((q) => q.name + ' ' + q.type);
  assert.deepEqual(mxq, ['lab.example MX', 'posluzitelj.lab.example A/AAAA']);
});

test('rule 2: mx with no MX record matches nothing, never falls back to A', () => {
  const z = { 'd.example': { TXT: ['v=spf1 mx -all'], A: ['192.0.2.7'] } };
  const r = L.checkHost('192.0.2.7', 'd.example', z);
  assert.equal(r.result, 'fail');
  assert.equal(r.terms[0].state, 'nomatch');
  assert.ok(!r.queries.some((q) => q.name === 'd.example' && q.type === 'A/AAAA'));
});

test('rule 2: ip4 with a prefix length, and no DNS for it', () => {
  const r = L.checkHost('203.0.113.70', 'd.example', zone('v=spf1 ip4:203.0.113.64/26 -all'));
  assert.equal(r.result, 'pass');
  assert.equal(r.dnsTerms, 0);
  assert.equal(L.checkHost('203.0.113.130', 'd.example', zone('v=spf1 ip4:203.0.113.64/26 -all')).result, 'fail');
});

// ── rule 3: limits and records ──

test('rule 3: redirect counts toward the limit and is not followed here (permerror)', () => {
  const r = L.checkHost('192.0.2.1', 'd.example', zone('v=spf1 ip4:192.0.2.9 redirect=_spf.d.example'));
  assert.equal(r.result, 'permerror');
  assert.equal(r.dnsTerms, 1);
  assert.equal(L.checkHost('192.0.2.1', 'd.example', zone('v=spf1 exp=explain.d.example ip4:192.0.2.1')).result, 'pass');
});

test('rule 3: no SPF record → none; two records → permerror; other TXT is ignored', () => {
  assert.equal(L.checkHost('192.0.2.1', 'none.example', {}).result, 'none');
  assert.equal(L.checkHost('192.0.2.1', 'd.example', zone(['google-site-verification=x'])).result, 'none');
  assert.equal(L.checkHost('192.0.2.1', 'd.example', zone(['v=spf1 -all', 'v=spf1 +all'])).result, 'permerror');
  assert.equal(L.checkHost('192.0.2.1', 'd.example', zone(['v=spf10 +all'])).result, 'none');
});

// ── rule 4: DKIM ──

test('rule 4: the key is read at s._domainkey.d; a valid signature passes for d=', () => {
  const s = at({}, 2);
  assert.equal(s.dkim.keyName, 'sel1._domainkey.lab.example');
  assert.equal(s.dkim.result, 'pass');
  assert.equal(s.dkim.domain, 'lab.example');
  assert.equal(s.lookups[s.lookups.length - 1].name, 'sel1._domainkey.lab.example');
});

test('rule 4: a DKIM pass says nothing about the author: zlo.example signs a From: lab.example', () => {
  const s = at({ scenario: 'spoof' }, 2);
  assert.equal(s.dkim.result, 'pass');
  assert.equal(s.dkim.domain, 'zlo.example');
  assert.equal(L.domainOf(s.msg.from), 'lab.example');
});

test('rule 4: changed in transit → fail; no signature → none, no lookup; no key → permerror', () => {
  const tagged = at({ scenario: 'list', listModifiesSubject: true }, 2);
  assert.equal(tagged.msg.subject.indexOf('[radionica] '), 0);
  assert.equal(tagged.dkim.result, 'fail');
  const unsigned = at({ signed: false }, 2);
  assert.equal(unsigned.dkim.result, 'none');
  assert.equal(unsigned.lookups.filter((l) => l.check === 'dkim').length, 0);
  assert.equal(L.verifyDkim({ d: 'lab.example', s: 'old', intact: true }, L.zoneFor(P({}))).result, 'permerror');
});

test('rule 4: listModifiesSubject only changes the list message', () => {
  assert.equal(at({ listModifiesSubject: true }, 2).dkim.result, 'pass');
  assert.equal(at({ scenario: 'list', listModifiesSubject: false }, 2).dkim.result, 'pass');
});

// ── rule 5: the DMARC result ──

test('rule 5: either aligned pass is enough', () => {
  const mk = (spf, dkim) => L.dmarcResult({ p: 'none' }, { spf: { aligned: spf }, dkim: dkim === null ? null : { aligned: dkim } });
  assert.equal(mk(true, false), 'pass');
  assert.equal(mk(false, true), 'pass');
  assert.equal(mk(true, null), 'pass');
  assert.equal(mk(false, false), 'fail');
  assert.equal(mk(false, null), 'fail');
  assert.equal(L.dmarcResult(null, { spf: { aligned: true }, dkim: null }), 'none', 'no record, no DMARC');
});

test('rule 5: the author domain comes from From: and the record from _dmarc.<author>', () => {
  const s = at({ scenario: 'spoof' }, 3);
  assert.equal(s.author, 'lab.example');
  assert.equal(s.lookups[s.lookups.length - 1].name, '_dmarc.lab.example');
});

test('rule 5: both checks pass, neither aligned → fail (spoof)', () => {
  const s = end({ scenario: 'spoof' });
  assert.equal(s.spf.result, 'pass');
  assert.equal(s.dkim.result, 'pass');
  assert.equal(s.aligned.spf.aligned, false);
  assert.equal(s.aligned.dkim.aligned, false);
  assert.equal(s.verdict, 'fail');
});

// ── rule 6: alignment ──

test('rule 6: relaxed = same organisational domain, strict = identical', () => {
  assert.equal(L.orgDomain('bounce.news.LAB.example'), 'lab.example');
  assert.equal(L.alignment('news.lab.example', true, 'lab.example', 'relaxed').aligned, true);
  assert.equal(L.alignment('news.lab.example', true, 'lab.example', 'strict').aligned, false);
  assert.equal(L.alignment('LAB.example', true, 'lab.example', 'strict').aligned, true);
  assert.equal(L.alignment('zlo.example', true, 'lab.example', 'relaxed').aligned, false);
  assert.equal(L.alignment('lab.example', false, 'lab.example', 'relaxed').aligned, false);
});

test('rule 6: relaxed is the default; aspf=s makes SPF strict, DKIM stays relaxed', () => {
  assert.equal(L.parseDmarc('v=DMARC1; p=none').aspf, 'relaxed');
  assert.equal(L.parseDmarc('v=DMARC1; p=none').adkim, 'relaxed');
  const r = L.parseDmarc('v=DMARC1; p=none; aspf=s');
  assert.equal(r.aspf, 'strict');
  assert.equal(r.adkim, 'relaxed');
  assert.equal(end({ scenario: 'subdomain', signed: false }).verdict, 'pass');
  assert.equal(end({ scenario: 'subdomain', signed: false, aspf: 'strict' }).verdict, 'fail');
  // strict SPF does not touch DKIM: signed by lab.example, still a pass
  assert.equal(end({ scenario: 'subdomain', aspf: 'strict' }).verdict, 'pass');
  // and DKIM alignment reads adkim, not aspf: a signature by news.lab.example stays relaxed-aligned under aspf=s
  const p = P({ scenario: 'subdomain', aspf: 'strict' });
  const s3 = structuredClone(at({ scenario: 'subdomain', aspf: 'strict' }, 3));
  s3.dkim.domain = 'news.lab.example';
  const s4 = L.step(s3, 4, p);
  assert.equal(s4.aligned.spf.aligned, false);
  assert.equal(s4.aligned.dkim.mode, 'relaxed');
  assert.equal(s4.aligned.dkim.aligned, true);
});

// ── rule 7: policy ──

test('rule 7: a valid record without p reads as p=none; not a DMARC record → null', () => {
  const r = L.parseDmarc('v=DMARC1; rua=mailto:postmaster@lab.example');
  assert.equal(r.p, 'none');
  assert.equal(r.pGiven, false);
  assert.equal(L.parseDmarc('v=spf1 -all'), null);
  assert.equal(L.parseDmarc('v=DMARC1; p=reject').p, 'reject');
});

test('rule 7: actions: a pass is delivered; a fail follows p; reject answers 550 5.7.1', () => {
  assert.equal(L.policyAction('pass', 'reject'), 'deliver');
  assert.equal(L.policyAction('none', 'reject'), 'deliver');
  assert.equal(L.policyAction('fail', 'none'), 'report');
  assert.equal(L.policyAction('fail', 'quarantine'), 'quarantine');
  assert.equal(L.policyAction('fail', 'reject'), 'reject');
  assert.deepEqual(L.replyFor('reject', 'lab.example'), { code: 550, text: '5.7.1 Email rejected per DMARC policy for lab.example' });
  assert.equal(L.replyFor('quarantine', 'lab.example').code, 250);
  assert.equal(end({ scenario: 'spoof', policy: 'quarantine' }).action, 'quarantine');
});

test('rule 7: the policy param writes the lab record; defaults give the book\'s record', () => {
  assert.equal(L.dmarcText(P({})), 'v=DMARC1; p=none; rua=mailto:postmaster@lab.example');
  assert.equal(at({ policy: 'reject' }, 3).dmarc.p, 'reject');
  assert.equal(at({ aspf: 'strict' }, 3).dmarc.aspf, 'strict');
});

// ── rule 8: forwarding through a list ──

test('rule 8: the list sends from its own IP with its own bounce address: SPF passes for the list, not aligned; the signature survives', () => {
  const s = end({ scenario: 'list', policy: 'reject' });
  assert.equal(s.msg.ip, '198.51.100.7');
  assert.equal(s.spf.domain, 'lista.example');
  assert.equal(s.spf.result, 'pass');
  assert.equal(s.aligned.spf.aligned, false);
  assert.equal(s.aligned.spf.sameOrg, false);
  // with Ana's envelope kept, the list's IP would fail lab.example's record
  assert.equal(L.checkHost(s.msg.ip, 'lab.example', s.dns).result, 'fail');
  assert.equal(s.dkim.result, 'pass');
  assert.equal(s.verdict, 'pass');
  assert.equal(s.unsubscribed, null);
});

test('rule 8: a refused list message unsubscribes the reader; a refused direct one does not', () => {
  assert.equal(end({ scenario: 'list', policy: 'reject', signed: false }).unsubscribed, 'ivan@drugdje.example');
  assert.equal(end({ scenario: 'list', policy: 'reject', listModifiesSubject: true }).unsubscribed, 'ivan@drugdje.example');
  assert.equal(end({ scenario: 'list', policy: 'quarantine', signed: false }).unsubscribed, null);
  assert.equal(end({ scenario: 'spoof', policy: 'reject' }).unsubscribed, null);
});

// ── presets and steps ──

test('presets: the expected outcomes (SPEC.md table)', () => {
  const row = (s) => [s.spf.domain, s.spf.result, s.spf.terms[s.spf.decided].text, s.spf.dnsTerms, s.dkim.result,
    s.aligned.spf.aligned, s.aligned.dkim ? s.aligned.dkim.aligned : null, s.verdict, s.action, s.reply.code, s.lookups.length];
  assert.deepEqual(row(end(PRESETS.legit)), ['lab.example', 'pass', 'mx', 2, 'pass', true, true, 'pass', 'deliver', 250, 6]);
  assert.deepEqual(row(end(PRESETS['mailing-list-signed'])), ['lista.example', 'pass', 'a', 1, 'pass', false, true, 'pass', 'deliver', 250, 4]);
  assert.deepEqual(row(end(PRESETS['mailing-list-unsigned'])), ['lista.example', 'pass', 'a', 1, 'none', false, null, 'fail', 'reject', 550, 3]);
  assert.deepEqual(row(end(PRESETS['spoof-own-domain'])), ['zlo.example', 'pass', 'ip4:203.0.113.66', 0, 'pass', false, false, 'fail', 'report', 250, 3]);
  assert.deepEqual(row(end(PRESETS['subdomain-alignment'])), ['news.lab.example', 'pass', 'a', 1, 'none', true, null, 'pass', 'deliver', 250, 3]);
});

test('legit: the six lookups in order', () => {
  assert.deepEqual(end({}).lookups.map((l) => l.step + ' ' + l.name + ' ' + l.type + ' ' + l.answer.length), [
    '1 lab.example TXT 1', '1 lab.example A/AAAA 0', '1 lab.example MX 1', '1 posluzitelj.lab.example A/AAAA 1',
    '2 sel1._domainkey.lab.example TXT 1', '3 _dmarc.lab.example TXT 1']);
});

test('one check per step, in order; nothing is decided early', () => {
  const ph = [];
  for (let n = 0; n <= L.steps; n++) ph.push(at({}, n).phase);
  assert.deepEqual(ph, ['arrive', 'spf', 'dkim', 'dmarc', 'align', 'verdict']);
  const s3 = at({ scenario: 'spoof' }, 3);
  assert.equal(s3.aligned, null);
  assert.equal(s3.verdict, null);
  assert.equal(at({}, 1).dkim, null);
  assert.equal(at({}, 0).lookups.length, 0);
});

test('changed marks name the check of the step', () => {
  assert.ok(at({}, 1).changed.includes('spf') && at({}, 1).changed.includes('id:mailFrom'));
  assert.ok(at({}, 2).changed.includes('id:dkim'));
  assert.ok(!at({ signed: false }, 2).changed.includes('dns'), 'no lookup without a signature');
  assert.ok(at({}, 3).changed.includes('id:from'));
  assert.deepEqual(at({}, 5).changed, ['verdict']);
});

// ── generic checks every sim keeps ──

const COMBOS = [{}, ...Object.values(PRESETS), { scenario: 'list', listModifiesSubject: true, policy: 'quarantine' }, { scenario: 'spoof', policy: 'reject', signed: false }];

test('state is JSON-safe at every step', () => {
  for (const o of COMBOS) for (let n = 0; n <= L.steps; n++) {
    const s = at(o, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of COMBOS) {
    const p = P(o);
    const forward = [];
    let s = L.initial(p);
    forward.push(s);
    for (let n = 1; n <= L.steps; n++) { s = L.step(s, n, p); forward.push(s); }
    for (let n = L.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scenario: 'list' });
  let s = L.initial(p);
  for (let n = 1; n <= L.steps; n++) {
    const before = structuredClone(s);
    const next = L.step(s, n, p);
    assert.deepEqual(s, before);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, L.steps, 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in L.defaults, `preset param ${k} is a model param`);
  // the page's presets are the ones this file tests
  const ids = [...html.matchAll(/\{ id: '([\w-]+)'/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS));
});
