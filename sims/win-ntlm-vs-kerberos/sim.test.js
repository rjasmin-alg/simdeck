// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ntlm-vs-kerberos's model (rules: SPEC.md). Run: node --test sims/win-ntlm-vs-kerberos/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const end = (over) => { const p = P(over); return kit.stateAt(logic, p, logic.steps(p)); };
const names = (s) => s.log.map((e) => e.name);
const HASH = '28ccf512b96343c8ba6ad44df5c5fe9a';
const NTLM6 = ['NEGOTIATE', 'CHALLENGE', 'AUTHENTICATE', 'PASS-THROUGH', 'DC-REPLY', 'ACCESS'];

// ── tie-breaks first ──

test('rule 1 tie-break: with several reasons the first in order is given (local, realm, no DC, address)', () => {
  const all = { target: 'ip', localAccount: true, inRealm: false, dcReachable: false };
  assert.equal(logic.negotiate(all).reason, 'local');
  assert.equal(logic.negotiate(Object.assign({}, all, { localAccount: false })).reason, 'realm');
  assert.equal(logic.negotiate(Object.assign({}, all, { localAccount: false, inRealm: true })).reason, 'no-dc');
  assert.equal(logic.negotiate({ target: 'ip', inRealm: true, dcReachable: true }).reason, 'ip');
  // by name, each reason alone still forces NTLM; with none, Kerberos
  for (const o of [{ localAccount: true }, { inRealm: false }, { dcReachable: false }]) {
    assert.equal(logic.negotiate(Object.assign({ target: 'name' }, o)).protocol, 'ntlm', JSON.stringify(o));
  }
  assert.deepEqual(logic.negotiate({ target: 'name' }), { protocol: 'kerberos', reason: null, spn: 'cifs/fs01.quillmoor.example' });
});

test('rule 1 tie-break: an address gets Kerberos only with TryIPSPN set and an SPN for the address', () => {
  assert.equal(logic.negotiate({ target: 'ip' }).protocol, 'ntlm');
  assert.equal(logic.negotiate({ target: 'ip', tryIpSpn: true }).protocol, 'ntlm');
  assert.equal(logic.negotiate({ target: 'ip', ipSpn: true }).protocol, 'ntlm');
  assert.deepEqual(logic.negotiate({ target: 'ip', tryIpSpn: true, ipSpn: true }), { protocol: 'kerberos', reason: null, spn: 'cifs/10.10.0.20' });
});

test('rule 8 tie-break: the attacker\'s host goes by the address whatever the target', () => {
  for (const target of ['name', 'ip']) {
    const s = end({ target, attacker: 'admin' });
    assert.equal(s.target, 'ip');
    assert.equal(s.protocol, 'ntlm');
    assert.equal(s.reason, 'ip');
    assert.equal(s.unc, '\\\\10.10.0.20\\projects');
    assert.deepEqual(names(s), ['THEFT'].concat(NTLM6));
  }
});

// ── the arithmetic (checked against published vectors) ──

test('MD4 (RFC 1320 §A.5) and MD5 (against node:crypto)', () => {
  const md4 = (s) => logic.hex(logic.md4([...Buffer.from(s)]));
  assert.equal(md4(''), '31d6cfe0d16ae931b73c59d7e0c089c0');
  assert.equal(md4('abc'), 'a448017aaf21d8525fc10ae87aa6729d');
  assert.equal(md4('message digest'), 'd9130a8164549fe818874806e1c7014b');
  assert.equal(md4('1234567890'.repeat(8)), 'e33b4ddc9c38f2199c3e7b164fcc0536');
  for (const s of ['', 'abc', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'x'.repeat(200)]) {
    assert.equal(logic.hex(logic.md5([...Buffer.from(s)])), crypto.createHash('md5').update(s).digest('hex'), `md5 of ${s.length}`);
  }
  const key = crypto.randomBytes(16), msg = crypto.randomBytes(90);
  assert.equal(logic.hex(logic.hmacMd5([...key], [...msg])), crypto.createHmac('md5', key).update(msg).digest('hex'));
});

test('NTLMv2 matches [MS-NLMP] §4.2.4 (User, Domain, Password)', () => {
  const h = logic.ntHash('Password');
  assert.equal(h, 'a4f49c406510bdcab6824ee7c30fd852');
  assert.equal(logic.ntowfv2(h, 'User', 'Domain'), '0c868a403bfd7a93a3001ef22ef02e3f');
  const b = logic.blob('0000000000000000', 'aaaaaaaaaaaaaaaa', logic.targetInfo('Domain', 'Server'));
  assert.equal(logic.ntProof(h, 'User', 'Domain', '0123456789abcdef', b), '68cd0ab851e51c96aabc927bebef6a1c');
});

// ── rules ──

test('rule 2: by name, Kerberos in 4 messages; PC07 asks DC01 once, FS01 never', () => {
  const s = end({});
  assert.equal(s.protocol, 'kerberos');
  assert.deepEqual(names(s), ['TGS-REQ', 'TGS-REP', 'AP-REQ', 'AP-REP']);
  assert.deepEqual(s.log.map((e) => [e.from, e.to, e.proto]), [['pc', 'dc', 'kerberos'], ['dc', 'pc', 'kerberos'], ['pc', 'fs', 'kerberos'], ['fs', 'pc', 'kerberos']]);
  assert.deepEqual(s.contacts, { pcToDc: 1, fsToDc: 0 });
  assert.equal(s.log[1].carries[0].lock, 'FS01$', 'the service ticket is locked with FS01\'s key');
  assert.equal(s.log[0].carries[0].lock, 'krbtgt', 'the TGT is locked with krbtgt');
  assert.equal(s.log[3].openedWith, 'FS01$');
  assert.equal(s.log[2].carries[0].lock, 'FS01$', 'AP-REQ carries the ticket FS01 opens');
  assert.equal(s.access, 'ana');
  assert.equal(s.challenge, null);
  assert.equal(s.response, null);
});

test('rule 3: by address, NTLM: NEGOTIATE, an 8-byte CHALLENGE, AUTHENTICATE with the NTLMv2 proof', () => {
  const s = end({ target: 'ip' });
  assert.equal(s.protocol, 'ntlm');
  assert.equal(s.reason, 'ip');
  assert.deepEqual(names(s), NTLM6);
  assert.equal(s.log[1].challenge.length, 16, '8 bytes');
  assert.equal(s.log[1].challenge, '8c2f61d04ab7e935');
  assert.deepEqual([s.log[2].from, s.log[2].to, s.log[2].user, s.log[2].domain], ['pc', 'fs', 'ana', 'QUILLMOOR']);
  assert.equal(s.log[2].proof, '023cb28a6572a5d0486c1f8454abc57e');
  assert.equal(s.response.blob.slice(0, 16), '0101000000000000');
  assert.equal(s.response.blob.slice(16, 32), logic.TIMESTAMP);
  assert.equal(s.response.blob.slice(32, 48), '5e1f0c3a9b2d7748', 'the client challenge');
});

test('rule 4: FS01 hands challenge and response to DC01, which checks them with its stored hash', () => {
  const s = end({ target: 'ip' });
  const pass = s.log[3], reply = s.log[4];
  assert.deepEqual([pass.from, pass.to, pass.proto, pass.challenge, pass.proof], ['fs', 'dc', 'netlogon', s.challenge, s.response.proof]);
  assert.deepEqual([reply.from, reply.to, reply.ok], ['dc', 'fs', true]);
  assert.deepEqual(s.contacts, { pcToDc: 0, fsToDc: 1 });
  assert.equal(s.access, 'ana');
  assert.equal(logic.dcVerify(s.store, s.response, s.challenge), true);
  assert.equal(logic.dcVerify({ ana: logic.ntHash('Zima2026') }, s.response, s.challenge), false, 'another hash fails');
  assert.equal(logic.dcVerify({}, s.response, s.challenge), false, 'unknown user fails');
  // a DC that refuses ends the run with access denied, in the same number of steps
  const p = P({ target: 'ip' });
  let x = kit.stateAt(logic, p, 4);
  x.store.ana = logic.ntHash('Zima2026');
  x = logic.step(x, 5, p);
  assert.equal(x.log[4].ok, false);
  x = logic.step(x, 6, p);
  assert.deepEqual([x.log[5].name, x.log[5].access, x.phase, x.access], ['ACCESS', false, 'done', null]);
});

test('rule 5: NT hash = MD4(UTF-16LE(password)), no salt: ana and ivan share one', () => {
  assert.equal(logic.ntHash('Jesen2026'), HASH);
  assert.equal(logic.hex(logic.md4(logic.utf16le('Jesen2026'))), HASH);
  const s = logic.initial(P());
  assert.equal(s.store.ana, HASH);
  assert.equal(s.store.ivan, s.store.ana);
  assert.notEqual(logic.ntHash('Zima2026'), HASH);
  assert.equal(s.memory.pc.hash, HASH, 'the hash sits in PC07\'s memory after ana\'s logon');
});

test('rule 6: pass-the-hash: the hash alone answers a new challenge as ana; the DC accepts it', () => {
  const s = end({ attacker: 'admin' });
  assert.equal(s.log[0].name, 'THEFT');
  assert.deepEqual([s.log[0].kind, s.log[0].at, s.log[0].to], ['note', 'pc', 'x']);
  assert.equal(s.memory.x.hash, HASH);
  assert.equal(s.attacker.hash, true);
  assert.deepEqual(s.wire, [{ n: 1, item: 'hash' }]);
  assert.equal(s.client, 'x');
  assert.ok(s.log.slice(1).every((e) => e.from === 'x' || e.to === 'x' || e.to === 'dc' || e.from === 'dc'), 'PC07 sends nothing after the theft');
  assert.equal(s.challenge, '3d90e2b7c1458a6f', 'a new challenge, not ana\'s');
  assert.equal(s.response.proof, '75e614ada747b09c00ae4876d4c0bdb2');
  assert.equal(s.log[5].ok, true);
  assert.equal(s.access, 'ana');
  // the response from the hash equals the response from the password
  const b = s.response.blob;
  assert.equal(logic.ntProof(logic.ntHash('Jesen2026'), 'ana', 'QUILLMOOR', s.challenge, b), s.response.proof);
});

test('rule 6: the client answers with the hash in its own memory; a wrong hash there is refused', () => {
  const p = P({ attacker: 'admin' });
  let x = kit.stateAt(logic, p, 1);
  x.memory.x.hash = logic.ntHash('Zima2026');
  for (let n = 2; n <= logic.steps(p); n++) x = logic.step(x, n, p);
  assert.equal(x.log[5].ok, false);
  assert.equal(x.access, null);
  const q = P({ target: 'ip' });
  let y = logic.initial(q);
  y.memory.pc.hash = logic.ntHash('Zima2026');
  for (let n = 1; n <= logic.steps(q); n++) y = logic.step(y, n, q);
  assert.equal(y.log[4].ok, false, 'PC07 too computes from memory, not from the password');
});

test('rule 6: without the theft, the attacker\'s host has no hash', () => {
  const s = logic.initial(P({ attacker: 'admin' }));
  assert.equal(s.memory.x.hash, null);
  assert.equal(s.phase, 'theft');
  assert.equal(s.attacker.hash, false);
});

test('rule 7: a capture does not answer a new challenge; it only checks guesses offline', () => {
  const s = end({ target: 'ip', attacker: 'observer' });
  assert.deepEqual(s.wire, [{ n: 2, item: 'challenge' }, { n: 3, item: 'response' }]);
  assert.deepEqual(s.attacker, { hash: false, capture: true });
  const capture = Object.assign({ challenge: s.challenge }, s.response);
  // replayed against FS01's next challenge (the attacker host's), the DC refuses it
  assert.equal(logic.dcVerify(s.store, s.response, logic.RUN.x.challenge), false);
  assert.equal(logic.guessMatches(capture, 'Jesen2026'), true);
  assert.equal(logic.guessMatches(capture, 'jesen2026'), false);
  assert.equal(logic.guessMatches(capture, 'Zima2026'), false);
});

test('observer by name: sees Kerberos messages, gains nothing; observer gains only from NTLM', () => {
  const s = end({ attacker: 'observer' });
  assert.deepEqual(names(s), ['TGS-REQ', 'TGS-REP', 'AP-REQ', 'AP-REP']);
  assert.deepEqual(s.wire, []);
  assert.deepEqual(s.attacker, { hash: false, capture: false });
  assert.deepEqual(end({ target: 'ip' }).wire, [], 'nobody watching, nothing gained');
});

test('lanes: the attacker\'s host only with an admin attacker', () => {
  assert.deepEqual(logic.lanes(P()), ['pc', 'fs', 'dc']);
  assert.deepEqual(logic.lanes(P({ attacker: 'observer' })), ['pc', 'fs', 'dc']);
  assert.deepEqual(logic.lanes(P({ attacker: 'admin' })), ['pc', 'x', 'fs', 'dc']);
  for (const over of [{}, { target: 'ip' }, { attacker: 'admin' }]) {
    const lanes = logic.lanes(P(over));
    for (const e of end(over).log) for (const id of [e.from, e.to, e.at]) if (id) assert.ok(lanes.includes(id), `${id} in ${lanes}`);
  }
});

test('presets: by-name 4, by-ip 6, capture 6, pass-the-hash 7; at most 7 for any params', () => {
  const cases = [[{}, 4], [{ target: 'ip' }, 6], [{ target: 'ip', attacker: 'observer' }, 6], [{ attacker: 'admin' }, 7]];
  for (const [over, n] of cases) assert.equal(logic.steps(P(over)), n, JSON.stringify(over));
  let max = 0;
  for (const target of ['name', 'ip']) for (const attacker of ['none', 'observer', 'admin']) {
    const s = end({ target, attacker });
    max = Math.max(max, s.log.length);
    assert.equal(s.phase, 'done');
    assert.equal(s.access, 'ana');
  }
  assert.equal(max, 7);
  assert.equal(logic.steps(logic.defaults), 4);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { target: 'ip', attacker: 'observer' }, { attacker: 'admin' }]) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of [{ target: 'ip', attacker: 'observer' }, { attacker: 'admin' }]) {
    const p = P(over);
    const steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of [{}, { attacker: 'admin' }]) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
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
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const sim = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
});
