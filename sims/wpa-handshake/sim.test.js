// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for wpa-handshake's model (SPEC.md). Tie-breaks first, then one test per rule, then the generic block.
// Run: node --test sims/wpa-handshake/sim.test.js
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
const MODES = ['psk', 'eap', 'sae', 'compare'];
/** The step (1-based) at which a run does kind; compare counts WPA2's waiting steps. */
const stepOf = (mode, kind) => L.SCRIPTS[mode].indexOf(kind) + 1;
const fieldsOf = (s, msg) => s.rows.filter((r) => r.kind === 'msg' && r.msg === msg).map((r) => r.fields.map((f) => f.name));

// ── tie-breaks (rule 4) ──

test('PTK: min/max makes both sides agree whichever MAC or nonce is smaller', () => {
  const pmk = L.pmkFromPass('qhzkrmto', 'HomeNet');
  const a = L.ptkOf(pmk, L.AP_MAC, L.STA_MAC, L.ANONCE, L.SNONCE);
  assert.deepEqual(L.ptkOf(pmk, L.STA_MAC, L.AP_MAC, L.ANONCE, L.SNONCE), a, 'MACs swapped');
  assert.deepEqual(L.ptkOf(pmk, L.AP_MAC, L.STA_MAC, L.SNONCE, L.ANONCE), a, 'nonces swapped');
  assert.deepEqual(L.ptkOf(pmk, L.STA_MAC, L.AP_MAC, L.SNONCE, L.ANONCE), a, 'both swapped');
});

test('PTK: min/max is unsigned byte order, first byte first, not string or signed order', () => {
  assert.ok(L.cmpBytes([0x0a], [0x5a]) < 0);
  assert.ok(L.cmpBytes([0x80], [0x7f]) > 0, 'unsigned: 0x80 sorts after 0x7f');
  assert.ok(L.cmpBytes([0x01, 0xff], [0x02, 0x00]) < 0, 'the first byte decides');
  assert.equal(L.cmpBytes([1, 2], [1, 2]), 0);
  // the order changes the PTK: concatenating max first gives another key
  const pmk = L.unhex(L.pmkFromPass('qhzkrmto', 'HomeNet'));
  const ap = L.macBytes(L.AP_MAC), sta = L.macBytes(L.STA_MAC);
  const an = L.unhex(L.ANONCE), sn = L.unhex(L.SNONCE);
  const lo = L.cmpBytes(an, sn) <= 0 ? an.concat(sn) : sn.concat(an);
  const hi = L.cmpBytes(an, sn) <= 0 ? sn.concat(an) : an.concat(sn);
  const right = L.hex(L.prf(pmk, 'Pairwise key expansion', ap.concat(sta, lo), 384)).slice(0, 32);
  const wrong = L.hex(L.prf(pmk, 'Pairwise key expansion', ap.concat(sta, hi), 384)).slice(0, 32);
  assert.equal(L.cmpBytes(ap, sta) < 0, true, 'the scene\'s AP MAC is the smaller one');
  assert.equal(L.ptkOf(L.hex(pmk), L.AP_MAC, L.STA_MAC, L.ANONCE, L.SNONCE).kck, right);
  assert.notEqual(right, wrong);
});

test('PTK: equal nonces need no special case (min = max)', () => {
  const pmk = L.pmkFromPass('qhzkrmto', 'HomeNet');
  assert.deepEqual(L.ptkOf(pmk, L.AP_MAC, L.STA_MAC, L.ANONCE, L.ANONCE), L.ptkOf(pmk, L.STA_MAC, L.AP_MAC, L.ANONCE, L.ANONCE));
});

// ── rule 1: PMK from the passphrase ──

test('rule 1: PBKDF2-HMAC-SHA1 matches the 802.11i Annex H.4 vectors', () => {
  assert.equal(L.pmkFromPass('password', 'IEEE'), 'f42c6fc52df0ebef9ebb4b90b38a5f902e83fe1b135a70e23aed762e9710a12e');
  assert.equal(L.pmkFromPass('ThisIsAPassword', 'ThisIsASSID'), '0dc0d6eb90555ed6419756b9a15ec3e3209b63df707dd508d14581f8982721af');
  assert.equal(L.hex(L.sha1(L.utf8('abc'))), 'a9993e364706816aba3e25717850c26c9cd0d89d', 'SHA-1 of "abc" (FIPS 180)');
});

test('rule 1: every example passphrase is 8–63 characters', () => {
  for (const c of L.CLASSES) assert.ok(c.example.length >= 8 && c.example.length <= 63, c.id);
});

test('rule 1: the PMK is computed on both sides at step 1, equal, from the passphrase and the SSID', () => {
  const s0 = at({}, 0);
  assert.equal(s0.sta.keys.pmk, null);
  assert.equal(s0.ap.keys.pmk, null);
  const s = at({}, stepOf('psk', 'pmk'));
  assert.equal(s.sta.keys.pmk, L.pmkFromPass(L.classOf('lower8').example, 'HomeNet'));
  assert.equal(s.ap.keys.pmk, s.sta.keys.pmk);
  assert.equal(s.onAir.length, 0, 'nothing sent to get it');
  assert.notEqual(at({ passClass: 'rand20' }, 1).sta.keys.pmk, s.sta.keys.pmk, 'another passphrase, another PMK');
});

// ── rule 2: enterprise ──

test('rule 2: enterprise PMK comes from the per-user EAP exchange, reaches the AP over the wire, not the air', () => {
  const s1 = at({ mode: 'eap' }, 1);
  assert.equal(s1.sta.keys.pmk, L.EAP_PMK);
  assert.equal(s1.as.keys.pmk, L.EAP_PMK);
  assert.equal(s1.ap.keys.pmk, null, 'the AP waits for the server');
  assert.equal(s1.sta.keys.pass, null, 'no shared passphrase');
  const s2 = at({ mode: 'eap' }, 2);
  assert.equal(s2.ap.keys.pmk, L.EAP_PMK);
  const wire = s2.rows.filter((r) => r.msg === 'pmk')[0];
  assert.equal(wire.air, false);
  assert.equal(wire.lock, true);
  assert.equal(s2.onAir.some((f) => f.msg === 'pmk'), false);
  assert.equal(at({ mode: 'eap', passClass: 'rand20' }, 2).ap.keys.pmk, L.EAP_PMK, 'the passphrase class does not matter');
});

test('rule 2: the handshake after the PMK is identical in personal and enterprise mode', () => {
  const psk = end({ mode: 'psk' }), eap = end({ mode: 'eap' });
  for (const m of ['M1', 'M2', 'M3', 'M4']) assert.deepEqual(fieldsOf(eap, m), fieldsOf(psk, m), m);
  assert.deepEqual(L.SCRIPTS.eap.slice(2), L.SCRIPTS.psk.slice(1));
  assert.deepEqual(L.SCRIPTS.sae.slice(2), L.SCRIPTS.psk);
});

// ── rule 3: the four messages ──

test('rule 3: M1 ANonce in clear without MIC; M2 SNonce + MIC; M3 ANonce, {GTK}KEK, MIC, install; M4 MIC', () => {
  const s = end({});
  assert.deepEqual(s.onAir.map((f) => [f.msg, f.from, f.to]), [['M1', 'AP', 'STA'], ['M2', 'STA', 'AP'], ['M3', 'AP', 'STA'], ['M4', 'STA', 'AP']]);
  assert.deepEqual(fieldsOf(s, 'M1'), [['anonce']]);
  assert.deepEqual(fieldsOf(s, 'M2'), [['snonce', 'mic']]);
  assert.deepEqual(fieldsOf(s, 'M3'), [['anonce', 'gtkEnc', 'mic', 'install']]);
  assert.deepEqual(fieldsOf(s, 'M4'), [['mic']]);
  assert.equal(s.onAir[2].fields.gtkEnc, '{GTK}KEK');
  assert.ok(s.rows.filter((r) => r.kind === 'msg').every((r) => !/^M[234]$/.test(r.msg) || r.micOk === true), 'every MIC checks');
});

test('rule 3: the STA has the GTK only after M3; both install the TK at M4, in every mode', () => {
  for (const mode of ['psk', 'eap', 'sae']) {
    assert.equal(at({ mode }, stepOf(mode, 'm3') - 1).sta.keys.gtk, null, mode);
    assert.equal(at({ mode }, stepOf(mode, 'm3')).sta.keys.gtk, L.GTK, mode);
    const before = at({ mode }, stepOf(mode, 'm4') - 1);
    assert.equal(before.sta.keys.installed || before.ap.keys.installed, false, mode + ': nobody installs before M4');
    const s = end({ mode });
    assert.equal(s.sta.keys.installed && s.ap.keys.installed, true, mode);
  }
});

test('changed names the keys derived in this step', () => {
  assert.deepEqual(at({}, 1).changed, ['sta.pmk', 'ap.pmk']);
  assert.deepEqual(at({}, stepOf('psk', 'm1')).changed, []);
  assert.deepEqual(at({}, stepOf('psk', 'staPtk')).changed, ['sta.kck', 'sta.kek', 'sta.tk']);
  assert.deepEqual(at({ mode: 'eap' }, 2).changed, ['ap.pmk']);
});

// ── rule 4: the PTK ──

test('rule 4: PRF matches the 802.11i Annex H.3 vector', () => {
  assert.equal(L.hex(L.prf(new Array(20).fill(0x0b), 'prefix', L.utf8('Hi There'), 512)),
    'bcd4c650b30b9684951829e0d75f9d54b862175ed9f00606e17d8da35402ffee75df78c3d31e0f889f012120c0862beb67753e7439ae242edb8373698356cf5a');
});

test('rule 4: PTK splits into KCK, KEK, TK of 128 bits each; values checked against an independent computation', () => {
  const k = L.ptkOf(L.pmkFromPass('qhzkrmto', 'HomeNet'), L.AP_MAC, L.STA_MAC, L.ANONCE, L.SNONCE);
  assert.deepEqual(k, { kck: 'fa9da4df38a60d451079309d9c2f7630', kek: 'c7f5085d86ea573244d9956cc973e595', tk: '184b7291e650864d1f14aa8bb6c903c8' });
  assert.equal(L.micOf(k.kck, 2, L.SNONCE), '985b6bc03e66c1abe86442a70fba955a');
});

test('rule 4: the STA derives the PTK after M1, the AP after M2, and they agree', () => {
  for (const mode of ['psk', 'eap', 'sae']) {
    const m1 = stepOf(mode, 'm1'), m2 = stepOf(mode, 'm2');
    assert.equal(at({ mode }, m1).sta.keys.kck, null, mode + ': not at M1 itself');
    assert.notEqual(at({ mode }, m1 + 1).sta.keys.kck, null, mode + ': the step after M1');
    assert.equal(at({ mode }, m2 - 1).ap.keys.kck, null, mode + ': AP not before M2');
    const s = at({ mode }, m2);
    assert.deepEqual([s.ap.keys.kck, s.ap.keys.kek, s.ap.keys.tk], [s.sta.keys.kck, s.sta.keys.kek, s.sta.keys.tk], mode);
  }
});

// ── rule 5: what the observer records ──

// The secrets of a run, hard-coded here (not read from the model), plus derived values that must not go on the air either:
// a hash of the password or the login (the misconception "WPA2 sends a hash of the password") and the PSK-style PMK.
const SECRETS = ['pass', 'cred', 'pmk', 'kck', 'kek', 'tk', 'gtk'];
const sha1hex = (s) => L.hex(L.sha1(L.utf8(s)));
/** True when a and b share a run of 8 or more characters (a leaked prefix or part of a key counts). */
const overlaps = (a, b) => { for (let i = 0; i + 8 <= b.length; i++) if (a.includes(b.slice(i, i + 8))) return true; return false; };

test('rule 5: no secret, no part of one and no hash of the password ever goes on the air, in any mode, at any step', () => {
  for (const mode of MODES) {
    for (const passClass of ['lower8', 'rand20']) {
      const p = P({ mode, passClass });
      for (let n = 0; n <= L.steps(p); n++) {
        for (const run of L.runs(kit.stateAt(L, p, n))) {
          const secrets = [];
          for (const side of [run.sta, run.ap, run.as].filter(Boolean)) {
            for (const k of SECRETS) if (side.keys[k] && side.keys[k] !== '*') secrets.push(side.keys[k]);
          }
          if (run.passphrase) secrets.push(run.passphrase, sha1hex(run.passphrase), L.pmkFromPass(run.passphrase, run.ssid));
          if (run.sta.keys.cred) secrets.push(sha1hex(run.sta.keys.cred));
          const aired = run.onAir.flatMap((f) => Object.values(f.fields)).concat(run.observer.captured.map((c) => c.value))
            .concat(run.rows.filter((r) => r.kind === 'msg').flatMap((r) => r.fields.map((f) => f.value)));
          for (const v of aired) for (const sec of secrets) {
            assert.ok(!(sec.length >= 8 ? overlaps(String(v), sec) : String(v).includes(sec)), `${mode} step ${n}: part of ${sec} in ${v}`);
          }
        }
      }
    }
  }
});

test('rule 5: what the observer holds in enterprise and WPA3 mode, MACs and SSID with the first frame', () => {
  const eap = end({ mode: 'eap' });
  assert.deepEqual(eap.observer.captured.map((c) => c.item + ':' + c.from),
    ['apMac:AP', 'staMac:STA', 'ssid:AP', 'eap:STA', 'anonce:AP', 'snonce:STA', 'mic2:STA', 'gtkEnc:AP', 'mic3:AP', 'mic4:STA']);
  assert.equal(at({ mode: 'eap' }, 1).observer.captured.filter((c) => c.item === 'ssid')[0].value, 'Campus', 'with the EAP frame');
  const sae = end({ mode: 'sae' });
  assert.deepEqual(sae.observer.captured.map((c) => c.item + ':' + c.from),
    ['apMac:AP', 'staMac:STA', 'ssid:AP', 'saeCommit:STA', 'saeCommit:AP', 'saeConfirm:STA', 'saeConfirm:AP',
      'anonce:AP', 'snonce:STA', 'mic2:STA', 'gtkEnc:AP', 'mic3:AP', 'mic4:STA']);
  assert.equal(sae.ssid, 'HomeNet');
  assert.equal(at({ mode: 'sae' }, 1).observer.captured.filter((c) => c.item === 'ssid').length, 1, 'with the first SAE commit');
  for (const mode of ['psk', 'eap', 'sae']) {
    const s = end({ mode });
    for (const c of s.observer.captured) assert.ok(c.step >= 1 && c.step <= L.steps(P({ mode })), mode + ' ' + c.item);
    assert.equal(s.observer.captured.filter((c) => c.item === 'snonce')[0].step, stepOf(mode, 'm2'), mode + ': SNonce recorded at M2');
  }
});

test('rule 5: the wired server → AP row carries no field values', () => {
  const s = end({ mode: 'eap' });
  assert.deepEqual(s.rows.filter((r) => r.msg === 'pmk').map((r) => r.fields), [[]]);
});

test('rule 5: after the WPA2-Personal handshake the observer holds MACs, SSID, both nonces, three MICs, {GTK}KEK', () => {
  const s = end({});
  assert.deepEqual(s.observer.captured.map((c) => c.item).sort(),
    ['anonce', 'apMac', 'gtkEnc', 'mic2', 'mic3', 'mic4', 'snonce', 'ssid', 'staMac']);
  const v = Object.fromEntries(s.observer.captured.map((c) => [c.item, c.value]));
  assert.equal(v.apMac, L.AP_MAC);
  assert.equal(v.staMac, L.STA_MAC);
  assert.equal(v.ssid, 'HomeNet');
  assert.equal(v.anonce, L.ANONCE);
  assert.equal(v.snonce, L.SNONCE);
  assert.equal(at({}, stepOf('psk', 'm1')).observer.captured.filter((c) => c.item === 'ssid').length, 1, 'MACs and SSID with the first frame');
});

// ── rule 6: offline testing in WPA2-Personal ──

test('rule 6: canTestGuesses turns true exactly at M2', () => {
  const m2 = stepOf('psk', 'm2');
  for (let n = 0; n < m2; n++) assert.equal(at({}, n).observer.canTestGuesses, false, 'step ' + n);
  for (let n = m2; n <= 6; n++) assert.equal(at({}, n).observer.canTestGuesses, true, 'step ' + n);
  assert.deepEqual([0, 1, 2, 3, 4].map((n) => at({}, n).observer.note), ['nothing', 'nothing', 'waiting', 'waiting', 'testable']);
});

test('rule 6: the recorded values plus a guess reproduce the recorded MIC only for the right passphrase', () => {
  const s = at({ passClass: 'mixed8' }, stepOf('psk', 'm2'));
  const v = Object.fromEntries(s.observer.captured.map((c) => [c.item, c.value]));
  const micFor = (guess) => L.micOf(L.ptkOf(L.pmkFromPass(guess, v.ssid), v.apMac, v.staMac, v.anonce, v.snonce).kck, 2, v.snonce);
  assert.equal(micFor(L.classOf('mixed8').example), v.mic2);
  assert.notEqual(micFor('x7Qp2mKb'), v.mic2);
});

// ── rule 7: enterprise ──

test('rule 7: enterprise never allows offline testing; the note says no shared password', () => {
  const p = P({ mode: 'eap' });
  for (let n = 0; n <= L.steps(p); n++) assert.equal(at({ mode: 'eap' }, n).observer.canTestGuesses, false);
  assert.equal(at({ mode: 'eap' }, 0).observer.note, 'nothing');
  assert.equal(at({ mode: 'eap' }, 1).observer.note, 'noShared');
  assert.equal(end({ mode: 'eap' }).observer.note, 'noShared');
});

// ── rule 8: WPA3 SAE ──

test('rule 8: the SAE PMK is not PBKDF2 of the passphrase, and a new session gives a new PMK', () => {
  const s = at({ mode: 'sae' }, stepOf('sae', 'pmk'));
  const pass = L.classOf('lower8').example;
  assert.equal(s.sta.keys.pmk, s.ap.keys.pmk);
  assert.notEqual(s.sta.keys.pmk, L.pmkFromPass(pass, 'HomeNet'));
  assert.equal(s.sta.keys.pmk, L.saePmk(pass, L.SAE_RS, L.SAE_RA));
  assert.notEqual(L.saePmk(pass, L.SAE_RS, L.SAE_RS), s.sta.keys.pmk, 'other fresh values, other PMK (forward secrecy)');
  assert.equal(at({ mode: 'sae' }, stepOf('sae', 'pmk') - 1).sta.keys.pmk, null, 'not before SAE confirm');
  assert.notEqual(L.saePmk('passwordA', L.SAE_RS, L.SAE_RA), L.saePmk('passwordB', L.SAE_RS, L.SAE_RA), 'it depends on the password');
  assert.notEqual(at({ mode: 'sae', passClass: 'rand20' }, 3).sta.keys.pmk, s.sta.keys.pmk, 'another password, another SAE PMK');
});

test('rule 8: SAE is commit then confirm, both ways, before the handshake; never testable offline', () => {
  const s2 = at({ mode: 'sae' }, 2);
  assert.deepEqual(s2.onAir.map((f) => [f.msg, f.from]), [['saeCommit', 'STA'], ['saeCommit', 'AP'], ['saeConfirm', 'STA'], ['saeConfirm', 'AP']]);
  for (let n = 0; n <= 8; n++) assert.equal(at({ mode: 'sae' }, n).observer.canTestGuesses, false);
  assert.equal(at({ mode: 'sae' }, 0).observer.note, 'nothing');
  assert.equal(at({ mode: 'sae' }, 1).observer.note, 'online');
  assert.equal(end({ mode: 'sae' }).observer.note, 'online');
});

// ── steps, compare, explorer ──

test('steps per preset: 6 / 6 / 7 / 8 / 8', () => {
  assert.deepEqual([['psk'], ['psk'], ['eap'], ['sae'], ['compare']].map(([mode]) => L.steps(P({ mode }))), [6, 6, 7, 8, 8]);
});

test('compare: lockstep, WPA2 waits during SAE, both end on their verdicts at the last step', () => {
  const p = P({ mode: 'compare' });
  assert.equal(L.COMPARE_WAIT, 2);
  for (const n of [1, 2]) {
    const s = kit.stateAt(L, p, n);
    assert.equal(s.a.last.did, 'wait');
    assert.equal(s.a.rows.length, 0);
    assert.equal(s.b.last.did, L.SCRIPTS.sae[n - 1]);
  }
  for (let n = 3; n <= 8; n++) {
    const s = kit.stateAt(L, p, n);
    assert.equal(s.a.last.did, s.b.last.did, 'the same step on both sides from the PMK on, step ' + n);
  }
  const s = end({ mode: 'compare' });
  assert.equal(s.a.observer.note, 'testable');
  assert.equal(s.b.observer.note, 'online');
  assert.equal(s.a.sta.keys.installed && s.b.sta.keys.installed, true);
  assert.equal(kit.stateAt(L, p, 6).a.observer.canTestGuesses, true, 'WPA2 testable from its M2 at step 6');
  const c = end({ mode: 'compare', passClass: 'rand20' });
  assert.equal(c.a.sta.keys.pmk, end({ mode: 'psk', passClass: 'rand20' }).sta.keys.pmk, 'the WPA2 side takes passClass');
  assert.equal(c.b.sta.keys.pmk, end({ mode: 'sae', passClass: 'rand20' }).sta.keys.pmk, 'the WPA3 side takes passClass');
});

test('explorer: passphrase spaces and times at 10^6 per second', () => {
  const ex = Object.fromEntries(L.explore(P({ guessRate: 6 })).map((r) => [r.id, r]));
  const year = 365.25 * 86400;
  assert.equal(ex.lower8.space, 208827064576);
  assert.equal(ex.words4.space, 3656158440062976);
  assert.equal(ex.mixed8.space, 218340105584896);
  assert.ok(Math.abs(ex.rand12.space / 3.226266762397899821056e21 - 1) < 1e-12);
  assert.ok(Math.abs(ex.rand20.space / 7.04423425546998e35 - 1) < 1e-12);
  assert.equal(Math.round(ex.lower8.seconds / 86400 * 10) / 10, 2.4, '≈ 2.4 days');
  assert.equal(Math.round(ex.words4.seconds / year), 116, '≈ 116 years');
  assert.equal(Math.round(ex.rand12.seconds / year / 1e6) / 100, 1.02, '≈ 1.0 × 10^8 years');
  assert.equal(Math.round(ex.mixed8.seconds / year * 10) / 10, 6.9, '≈ 6.9 years');
  assert.equal(Math.round(ex.rand20.seconds / year / 1e21) / 10, 2.2, '≈ 2.2 × 10^22 years');
  assert.equal(L.explore(P({ guessRate: 9 }))[0].seconds, ex.lower8.seconds / 1000, 'a thousand times the rate, a thousandth of the time');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step of every mode', () => {
  for (const mode of MODES) {
    const p = P({ mode, observer: true });
    for (let n = 0; n <= L.steps(p); n++) {
      const s = kit.stateAt(L, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const mode of MODES) {
    const p = P({ mode, passClass: 'words4' });
    const forward = [];
    let s = L.initial(p);
    forward.push(s);
    for (let n = 1; n <= L.steps(p); n++) { s = L.step(s, n, p); forward.push(s); }
    for (let n = L.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n], mode + ' ' + n);
  }
});

test('step does not mutate its input', () => {
  for (const mode of MODES) {
    const p = P({ mode });
    let s = L.initial(p);
    for (let n = 1; n <= L.steps(p); n++) {
      const copy = structuredClone(s);
      const next = L.step(s, n, p);
      assert.deepEqual(s, copy, mode + ' ' + n);
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
  assert.equal(presets.length, 5, 'five presets');
  for (const m of presets) {
    const p = Function('return {' + m[1] + '}')();
    for (const k of Object.keys(p)) assert.ok(k in L.defaults, `preset param ${k} is a model param`);
    if (p.mode) assert.ok(p.mode in L.SCRIPTS || p.mode === 'compare', p.mode);
  }
});
