// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-kerberos's model (rules: SPEC.md). Run: node --test sims/win-kerberos/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const end = (over) => { const p = P(over); return kit.stateAt(logic, p, logic.steps(p)); };
const names = (s) => s.log.map((e) => (e.kind === 'check' ? `check@${e.at}${e.ok ? '' : '!'}` : e.name));
const H = 3600, M = 60;

// ── tie-breaks first ──

test('rule 8 tie-break: exactly 5:00 apart passes, 5:01 fails, in both directions', () => {
  assert.equal(logic.skewOk(1000 + 300, 1000), true);
  assert.equal(logic.skewOk(1000 - 300, 1000), true);
  assert.equal(logic.skewOk(1000 + 301, 1000), false);
  assert.equal(logic.skewOk(1000 - 301, 1000), false);
  // in whole minutes: ±5 runs to the share, ±6 fails at the AS
  for (const k of [5, -5]) assert.equal(end({ skewMin: k }).log.length, 8, `skew ${k}`);
  for (const k of [6, -6]) {
    const s = end({ skewMin: k });
    assert.deepEqual(names(s), ['AS-REQ', 'check@kdc!', 'KRB-ERROR'], `skew ${k}`);
    assert.equal(s.error, 'KRB_AP_ERR_SKEW');
  }
});

test('rule 9 tie-break: a ticket is expired at its expiry; one second before it is valid', () => {
  const t = { expires: 18 * H };
  assert.equal(logic.valid(t, 18 * H - 1), true);
  assert.equal(logic.valid(t, 18 * H), false);
  assert.equal(logic.valid(null, 0), false);
  // 9 h after logon the TGT works (TGS + AP), at 10 h the run starts again with AS-REQ
  assert.equal(end({ hoursLater: 9 }).log[0].name, 'TGS-REQ');
  assert.equal(end({ hoursLater: 10 }).log[0].name, 'AS-REQ');
  assert.equal(end({ cached: true, hoursLater: 9 }).log[0].name, 'AP-REQ');
  assert.equal(end({ cached: true, hoursLater: 10 }).log[0].name, 'AS-REQ');
});

test('rule 5 tie-break: the authenticator is checked before the SPN is looked up', () => {
  assert.equal(logic.tgsCheck(10 * H + 7 * M, 10 * H, 'cifs/10.10.0.20').error, 'KRB_AP_ERR_SKEW');
  const s = end({ byName: false, hoursLater: 2, skewMin: 7 });
  assert.equal(s.error, 'KRB_AP_ERR_SKEW');
});

// ── rules ──

test('rule 1: AS-REQ carries a timestamp under ana\'s key (the PC\'s clock), nothing else secret', () => {
  const s = end({ skewMin: 3 });
  const req = s.log[0];
  assert.equal(req.name, 'AS-REQ');
  assert.equal(req.from, 'pc'); assert.equal(req.to, 'kdc'); assert.equal(req.half, 'as');
  assert.deepEqual(req.carries, [{ type: 'auth', lock: 'ana', time: 8 * H + 3 * M, pa: true }]);
});

test('rule 2: the KDC checks |PC − KDC| against 5 min with ana\'s key; outside → KRB_AP_ERR_SKEW (37), logon fails', () => {
  const ok = end({ skewMin: 4 }).log[1];
  assert.deepEqual([ok.kind, ok.at, ok.ok, ok.skew], ['check', 'kdc', true, 4 * M]);
  assert.deepEqual(ok.used, { kdc: ['ana'] });
  const s = end({ skewMin: 7 });
  assert.deepEqual([s.log[1].ok, s.log[1].skew], [false, 7 * M]);
  const err = s.log[2];
  assert.deepEqual([err.name, err.from, err.to, err.error, err.code], ['KRB-ERROR', 'kdc', 'pc', 'KRB_AP_ERR_SKEW', 37]);
  assert.equal(s.cache.tgt, null, 'no TGT');
  assert.equal(s.log.length, 3);
});

test('rule 3: AS-REP gives a TGT under krbtgt (session key + PAC) and the session key under ana\'s key', () => {
  const s = end({});
  const rep = s.log[2];
  assert.equal(rep.name, 'AS-REP');
  assert.equal(rep.carries[0].what, 'tgt');
  assert.equal(rep.carries[0].lock, 'krbtgt');
  assert.deepEqual(rep.carries[0].holds, ['skTgs', 'pac']);
  assert.equal(rep.carries[1].lock, 'ana');
  assert.deepEqual(rep.carries[1].holds, ['skTgs']);
  // PC07 holds ana's key, never krbtgt: it can open the second part, not the TGT
  assert.ok(s.keys.pc.includes('ana'));
  assert.ok(!s.keys.pc.includes('krbtgt'));
  assert.ok(s.keys.pc.includes('skTgs'));
  // the KDC keeps no session key: it travels inside the TGT
  assert.deepEqual(s.keys.kdc, ['krbtgt', 'ana', 'FS01$']);
});

test('rule 4: TGS-REQ carries the TGT, an authenticator under the TGS session key and the SPN', () => {
  const req = end({ skewMin: -2 }).log[3];
  assert.equal(req.name, 'TGS-REQ');
  assert.equal(req.half, 'tgs');
  assert.deepEqual(req.carries.map((x) => [x.type, x.lock || x.spn]),
    [['ticket', 'krbtgt'], ['auth', 'skTgs'], ['spn', 'cifs/fs01.quillmoor.example']]);
  assert.equal(req.carries[1].time, 8 * H - 2 * M);
});

test('rule 5: the SPN\'s owner FS01$ locks the service ticket; no owner for the address → KDC_ERR_S_PRINCIPAL_UNKNOWN', () => {
  assert.equal(logic.spnOwner('cifs/fs01.quillmoor.example'), 'FS01$');
  assert.equal(logic.spnOwner('cifs/10.10.0.20'), null);
  assert.equal(logic.spnOwner('constructor'), null);
  const rep = end({}).log[4];
  assert.equal(rep.name, 'TGS-REP');
  assert.equal(rep.carries[0].lock, 'FS01$');
  assert.deepEqual(rep.carries[0].holds, ['skFs', 'pac']);
  assert.equal(rep.carries[1].lock, 'skTgs');
  assert.deepEqual(rep.used.kdc, ['krbtgt', 'FS01$']);
  const s = end({ byName: false });
  assert.deepEqual(names(s), ['AS-REQ', 'check@kdc', 'AS-REP', 'TGS-REQ', 'KRB-ERROR']);
  assert.equal(s.error, 'KDC_ERR_S_PRINCIPAL_UNKNOWN');
  assert.equal(s.log[4].code, 7);
  assert.equal(s.log[4].ntlm, true);
  assert.equal(s.spn, 'cifs/10.10.0.20');
  assert.equal(s.unc, '\\\\10.10.0.20\\projects');
  // a ticket cached for the name does not serve the address
  assert.deepEqual(names(end({ byName: false, cached: true })), ['TGS-REQ', 'KRB-ERROR']);
});

test('rule 6: FS01 opens the ticket with its own key, checks time and replay cache; the DC is not contacted', () => {
  const s = end({});
  const ap = s.log.slice(5);
  assert.deepEqual(names(s).slice(5), ['AP-REQ', 'check@fs', 'AP-REP']);
  assert.deepEqual(ap[0].carries.map((x) => [x.type, x.lock]), [['ticket', 'FS01$'], ['auth', 'skFs']]);
  assert.deepEqual(ap[1].used, { fs: ['FS01$'] });
  ap.forEach((e) => { if (e.kind === 'msg') assert.ok(e.from !== 'kdc' && e.to !== 'kdc'); });
  assert.equal(ap[2].access, true);
  assert.ok(s.keys.fs.includes('skFs'));
  assert.deepEqual(s.replay, [{ client: 'ana', time: 8 * H }]);
  // replay: the same authenticator again is refused; another time is not
  assert.equal(logic.apCheck({ client: 'ana', time: 100 }, 100, [{ client: 'ana', time: 100 }]), 'KRB_AP_ERR_REPEAT');
  assert.equal(logic.apCheck({ client: 'ana', time: 101 }, 100, [{ client: 'ana', time: 100 }]), null);
  assert.equal(logic.apCheck({ client: 'ana', time: 100 + 301 }, 100, []), 'KRB_AP_ERR_SKEW');
  // a cached service ticket with a skewed clock fails at FS01, not at the KDC
  const bad = end({ cached: true, skewMin: -6 });
  assert.deepEqual(names(bad), ['AP-REQ', 'check@fs!', 'KRB-ERROR']);
  assert.equal(bad.log[2].from, 'fs');
  assert.equal(bad.error, 'KRB_AP_ERR_SKEW');
  assert.equal(bad.replay.length, 0);
});

test('rule 7: lifetimes 10 h, 7 days, 600 min; a service ticket never outlives its TGT; a cached ticket skips exchanges', () => {
  assert.deepEqual(logic.POLICY, { skew: 300, tgtLife: 10 * H, renew: 7 * 86400, stLife: 600 * M });
  const s = end({});
  assert.deepEqual(s.cache.tgt, { issued: 8 * H, expires: 18 * H, renewTill: 8 * H + 7 * 86400 });
  assert.deepEqual(s.cache.st['cifs/fs01.quillmoor.example'], { issued: 8 * H, expires: 18 * H });
  // three hours after logon: the TGT from 08:00 caps the new service ticket at 18:00, not 21:00
  const later = end({ hoursLater: 3 });
  assert.deepEqual(names(later), ['TGS-REQ', 'TGS-REP', 'AP-REQ', 'check@fs', 'AP-REP']);
  assert.deepEqual(later.cache.st['cifs/fs01.quillmoor.example'], { issued: 11 * H, expires: 18 * H });
  assert.deepEqual(logic.newSt(8 * H, logic.newTgt(8 * H)), { issued: 8 * H, expires: 18 * H });
  assert.equal(logic.newSt(17 * H, { expires: 30 * H }).expires, 27 * H);
  // a cached service ticket: AP only
  assert.deepEqual(names(end({ cached: true, hoursLater: 2 })), ['AP-REQ', 'check@fs', 'AP-REP']);
  // a cached TGT and a skewed clock: refused at the TGS
  assert.deepEqual(names(end({ hoursLater: 3, skewMin: 7 })), ['TGS-REQ', 'KRB-ERROR']);
});

test('tickets are issued on the KDC\'s clock, not the PC\'s; cached under the SPN asked for', () => {
  const s = end({ skewMin: 4, hoursLater: 1 });
  assert.deepEqual(s.cache.st['cifs/fs01.quillmoor.example'], { issued: 9 * H, expires: 18 * H });
  const f = end({ skewMin: -3 });
  assert.equal(f.cache.tgt.issued, 8 * H);
  assert.equal(f.cache.st['cifs/fs01.quillmoor.example'].issued, 8 * H);
  // a fresh AS exchange 10 h later keeps the old service ticket entry; the new one replaces it
  const late = end({ cached: true, hoursLater: 11 });
  assert.deepEqual(late.cache.tgt, { issued: 19 * H, expires: 29 * H, renewTill: 19 * H + 7 * 86400 });
  assert.deepEqual(late.cache.st['cifs/fs01.quillmoor.example'], { issued: 19 * H, expires: 29 * H });
  assert.deepEqual(Object.keys(late.cache.st), ['cifs/fs01.quillmoor.example']);
  // a new TGT does not purge the expired service ticket: it stays (struck through) until replaced
  assert.deepEqual(end({ cached: true, hoursLater: 11, byName: false }).cache.st, { 'cifs/fs01.quillmoor.example': { issued: 8 * H, expires: 18 * H } });
});

test('start of the run: hoursLater 1 starts at the TGS; the starting keys follow the cache', () => {
  assert.equal(logic.initial(P({ hoursLater: 1 })).start, 'tgs-req');
  assert.equal(logic.initial(P()).start, 'as-req');
  assert.equal(logic.initial(P({ cached: true })).start, 'ap-req');
  assert.equal(logic.initial(P({ hoursLater: 12 })).start, 'as-req');
  assert.deepEqual(logic.initial(P()).keys, { pc: ['ana'], kdc: ['krbtgt', 'ana', 'FS01$'], fs: ['FS01$'] });
  assert.deepEqual(logic.initial(P({ hoursLater: 1 })).keys.pc, ['ana', 'skTgs']);
  assert.deepEqual(logic.initial(P({ cached: true })).keys.pc, ['ana', 'skTgs', 'skFs']);
  assert.deepEqual(logic.initial(P({ hoursLater: 1 })).cache, { tgt: { issued: 8 * H, expires: 18 * H, renewTill: 8 * H + 7 * 86400 }, st: {} });
});

test('every log entry: parties, half, skew sign, highlights (five presets and a failed AP check)', () => {
  const pick = (e) => [e.name || 'check@' + e.at, e.from || '', e.to || '', e.half || '', e.skew === undefined ? '' : e.skew, !!e.ntlm, !!e.fromCache, e.issued || '',
    JSON.stringify(e.used), JSON.stringify(e.added || {}), (e.carries || []).map((x) => (x.fresh ? 'F' : '-')).join('')];
  assert.deepEqual(end({ skewMin: 4 }).log.map(pick), [
    ['AS-REQ', 'pc', 'kdc', 'as', '', false, false, '', '{"pc":["ana"]}', '{}', '-'],
    ['check@kdc', '', '', 'as', 240, false, false, '', '{"kdc":["ana"]}', '{}', ''],
    ['AS-REP', 'kdc', 'pc', 'as', '', false, false, 'tgt', '{"kdc":["krbtgt","ana"],"pc":["ana"]}', '{"pc":["skTgs"]}', 'F-'],
    ['TGS-REQ', 'pc', 'kdc', 'tgs', '', false, false, '', '{"pc":["skTgs"]}', '{}', '---'],
    ['TGS-REP', 'kdc', 'pc', 'tgs', 240, false, false, 'st', '{"kdc":["krbtgt","FS01$"],"pc":["skTgs"]}', '{"pc":["skFs"]}', 'F-'],
    ['AP-REQ', 'pc', 'fs', '', '', false, false, '', '{"pc":["skFs"]}', '{}', '--'],
    ['check@fs', '', '', '', 240, false, false, '', '{"fs":["FS01$"]}', '{"fs":["skFs"]}', ''],
    ['AP-REP', 'fs', 'pc', '', '', false, false, '', '{"fs":["skFs"],"pc":["skFs"]}', '{}', '-']
  ]);
  assert.deepEqual(end({ skewMin: 7 }).log.map(pick)[2], ['KRB-ERROR', 'kdc', 'pc', 'as', 420, false, false, '', '{}', '{}', '']);
  assert.deepEqual(end({ byName: false }).log.map(pick)[4], ['KRB-ERROR', 'kdc', 'pc', 'tgs', 0, true, false, '', '{"kdc":["krbtgt"]}', '{}', '']);
  assert.deepEqual(end({ hoursLater: 2, skewMin: -7 }).log.map(pick)[1], ['KRB-ERROR', 'kdc', 'pc', 'tgs', -420, false, false, '', '{"kdc":["krbtgt"]}', '{}', '']);
  const c = end({ cached: true, hoursLater: 2 }).log.map(pick);
  assert.equal(c[0][6], true, 'AP-REQ from the cache');
  const bad = end({ cached: true, skewMin: -6 });
  assert.deepEqual(bad.log.map(pick), [
    ['AP-REQ', 'pc', 'fs', '', '', false, true, '', '{"pc":["skFs"]}', '{}', '--'],
    ['check@fs', '', '', '', -360, false, false, '', '{"fs":["FS01$"]}', '{}', ''],
    ['KRB-ERROR', 'fs', 'pc', '', -360, false, false, '', '{}', '{}', '']
  ]);
  assert.deepEqual(bad.keys.fs, ['FS01$'], 'no session key at FS01 after a failed check');
  assert.equal(end({ hoursLater: 3 }).log[2].fromCache, false, 'a ticket just issued is not from the cache');
  assert.equal(end({ hoursLater: 3 }).log[0].carries[0].expires, 18 * H, 'TGS-REQ shows the TGT\'s expiry');
});

test('replay cache: per client, checked after the time; KRB_AP_ERR_REPEAT is 34', () => {
  assert.equal(logic.ERR.KRB_AP_ERR_REPEAT, 34);
  assert.equal(logic.ERR.KDC_ERR_S_PRINCIPAL_UNKNOWN, 7);
  assert.equal(logic.apCheck({ client: 'ana', time: 100 }, 100, [{ client: 'ivo', time: 100 }]), null);
  // a replayed authenticator that is also too old is refused for its time first
  assert.equal(logic.apCheck({ client: 'ana', time: 100 }, 100 + 400, [{ client: 'ana', time: 100 }]), 'KRB_AP_ERR_SKEW');
});

test('clocks: the PC is KDC + skew; FS01 and the KDC agree; the run is hoursLater after 08:00', () => {
  const s = logic.initial(P({ skewMin: -4, hoursLater: 5 }));
  assert.deepEqual(s.clocks, { pc: 13 * H - 4 * M, kdc: 13 * H, fs: 13 * H });
});

test('presets: open-share 8, skew-7 3, skew-4 8, cached 3, by-ip 5; at most 8 for any params', () => {
  const cases = [[{}, 8], [{ skewMin: 7 }, 3], [{ skewMin: 4 }, 8], [{ cached: true, hoursLater: 2 }, 3], [{ byName: false }, 5]];
  for (const [over, n] of cases) assert.equal(logic.steps(P(over)), n, JSON.stringify(over));
  let max = 0;
  for (let k = -10; k <= 10; k++) for (const byName of [true, false]) for (const cached of [true, false]) for (let h = 0; h <= 12; h++) {
    const s = end({ skewMin: k, byName, cached, hoursLater: h });
    max = Math.max(max, s.log.length);
    assert.ok(s.error || s.log[s.log.length - 1].access, 'ends in access or an error');
  }
  assert.equal(max, 8);
  assert.equal(logic.steps(logic.defaults), 8);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { skewMin: 7 }, { byName: false, cached: true, hoursLater: 4 }]) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ skewMin: 3, hoursLater: 1 });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const sim = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
});
