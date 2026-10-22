// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ssh-key-auth's model (rules: SPEC.md). Run: node --test sims/ssh-key-auth/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const at = (over, n) => kit.stateAt(L, P(over), n);
const last = (over) => at(over, L.steps(P(over)));
const [K0, K1, K2] = L.HOST_KEYS;
const ED = { type: 'ED25519', fp: K0 };
const line = (fp, host, type) => ({ host: host || L.HOST, type: type || 'ED25519', fp });
/** The events of a whole run, one per step. */
function events(over) {
  const p = P(over), out = [];
  for (let n = 1; n <= L.steps(p); n++) out.push(kit.stateAt(L, p, n).ev);
  return out;
}
/** Per step: the event, the marks, the rows and terminal lines it added, the connection and the prompt. */
const GOLDEN_RUNS = [{ script: 'first-connection' }, { script: 'first-connection', answer: 'no' }, { script: 'second-connection' },
  { script: 'host-key-changed' }, { script: 'key-login' }, { script: 'password-off' },
  { script: 'second-connection', queue: 'PKSPKS' }, { script: 'key-login', queue: 'NSDWS' }];
function snapshot() {
  return GOLDEN_RUNS.map((over) => {
    const p = P(over), steps = [];
    let prev = L.initial(p);
    steps.push({ ev: prev.ev, conn: prev.conn, prompt: prev.prompt, marks: prev.marks, files: [prev.client, prev.server] });
    for (let n = 1; n <= L.steps(p); n++) {
      const s = kit.stateAt(L, p, n);
      steps.push({ ev: s.ev, marks: s.marks, rows: s.rows.slice(prev.rows.length), conn: s.conn, prompt: s.prompt,
        term: s.transcript.filter((l) => l.n === n), termPrompts: s.transcript.filter((l) => l.prompt).length });
      prev = s;
    }
    return { run: over, steps };
  });
}
if (process.env.GOLDEN_WRITE) require('node:fs').writeFileSync(require('node:path').join(__dirname, 'golden.json'), JSON.stringify(snapshot(), null, 1) + '\n');
const kinds = (over) => events(over).map((e) => e.kind + (e.res ? ':' + e.res : '') + (e.out ? ':' + e.out : ''));

// ── tie-breaks first ──

test('tie-break: a line with the same key wins over a line with a different key (known, not mismatch)', () => {
  assert.deepEqual(L.hostCheck([line(K1), line(K0)], L.HOST, ED), { res: 'known', line: 2 });
  assert.deepEqual(L.hostCheck([line(K0), line(K1)], L.HOST, ED), { res: 'known', line: 1 });
});

test('tie-break: with several differing lines the last is the offending one; with several same lines the first matches', () => {
  assert.deepEqual(L.hostCheck([line(K1), line(K2)], L.HOST, ED), { res: 'mismatch', line: 2 });
  assert.deepEqual(L.hostCheck([line(K2), line(K1, '10.0.0.9'), line(K1)], L.HOST, ED), { res: 'mismatch', line: 3 });
  assert.deepEqual(L.hostCheck([line(K0), line(K0)], L.HOST, ED), { res: 'known', line: 1 });
});

test('tie-break: only lines for this host and this key type count', () => {
  assert.deepEqual(L.hostCheck([line(K1, '10.0.0.9')], L.HOST, ED), { res: 'unknown', line: null });
  assert.deepEqual(L.hostCheck([line(K1, L.HOST, 'RSA')], L.HOST, ED), { res: 'unknown', line: null });
  assert.deepEqual(L.hostCheck([line(K1, L.HOST, 'RSA'), line(K0)], L.HOST, ED), { res: 'known', line: 2 });
});

test('tie-break: a key that is not in authorized_keys falls back to password while it is listed, else denied', () => {
  const cli = { keyPair: { fp: L.USER_FP } };
  const on = L.userAuth(cli, { authorizedKeys: [], passwordAuth: true }, 'any');
  assert.equal(on.out, 'password-prompt');
  assert.deepEqual(on.tries.map((x) => [x.m, x.ok]), [['publickey', false]]);
  assert.equal(L.userAuth(cli, { authorizedKeys: [], passwordAuth: false }, 'any').out, 'denied');
});

// ── rule 1: two questions, two parts ──

test('rule 1: question 1 (kex, check, answer) comes before question 2 (auth); everything after the key exchange is user auth', () => {
  assert.deepEqual(kinds({}), ['kex', 'check:unknown', 'answer', 'auth:password-prompt', 'password']);
  const s = last({});
  const order = s.rows.map((r) => r.k);
  assert.ok(order.indexOf('hostkey') < order.indexOf('check') && order.indexOf('check') < order.indexOf('none'));
});

// ── rules 2–4: known_hosts ──

test('rule 2: the check compares the presented host key with known_hosts', () => {
  assert.deepEqual(L.hostCheck([], L.HOST, ED), { res: 'unknown', line: null });
  assert.deepEqual(L.hostCheck([line(K0)], L.HOST, ED), { res: 'known', line: 1 });
  assert.deepEqual(L.hostCheck([line(K1)], L.HOST, ED), { res: 'mismatch', line: 1 });
});

test('rule 3: unknown host → the client shows the fingerprint and asks; yes stores the key, the next connection does not ask', () => {
  const s2 = at({}, 2);
  assert.deepEqual(s2.prompt, { kind: 'host', fp: K0 });
  assert.ok(s2.transcript.some((l) => l.text === 'ED25519 key fingerprint is ' + K0 + '.'));
  assert.ok(s2.transcript[s2.transcript.length - 1].prompt);
  const s3 = at({}, 3);
  assert.equal(s3.prompt, null);
  assert.deepEqual(s3.client.knownHosts, [line(K0)]);
  assert.deepEqual(s3.marks.kh, [1]);
  assert.match(s3.transcript.at(-1).text, /^Warning: Permanently added '192\.168\.122\.57' \(ED25519\)/);
  // connect again after the first connection: known, no question
  assert.deepEqual(kinds({ queue: 'S' }).slice(5, 7), ['kex', 'check:known']);
});

test('rule 3: no at the question stores nothing and ends the connection', () => {
  const p = { answer: 'no' };
  assert.equal(L.steps(P(p)), 3);
  const s = last(p);
  assert.deepEqual(s.client.knownHosts, []);
  assert.equal(s.conn.outcome, 'declined');
  assert.equal(s.conn.userAuth, null);
  assert.equal(s.transcript.at(-1).text, 'Host key verification failed.');
  assert.match(s.transcript.at(-2).text, /\(yes\/no\/\[fingerprint\]\)\? no$/);
});

test('rule 4: a changed host key → warning, refused without a question, nothing stored', () => {
  const s = at({ script: 'host-key-changed' }, 2);
  assert.equal(s.conn.hostCheck, 'mismatch');
  assert.equal(s.conn.outcome, 'refused');
  assert.equal(s.prompt, null);
  assert.deepEqual(s.client.knownHosts, [line(K0)]);
  const text = s.transcript.map((l) => l.text);
  assert.ok(text.includes('@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @'));
  assert.ok(text.includes('Offending ED25519 key in /home/student/.ssh/known_hosts:1'));
  assert.ok(text.includes(K1 + '.'));
  assert.equal(text.at(-1), 'Host key verification failed.');
  assert.equal(s.ev.stored, K0);
});

test('rule 4: after forget, the next connection is unknown and asks again; answering yes stores the new key', () => {
  assert.deepEqual(kinds({ script: 'host-key-changed' }),
    ['kex', 'check:mismatch', 'forget', 'kex', 'check:unknown', 'answer', 'auth:publickey']);
  const s3 = at({ script: 'host-key-changed' }, 3);
  assert.deepEqual(s3.client.knownHosts, []);
  assert.deepEqual(s3.marks.removed, [line(K0)]);
  assert.deepEqual(at({ script: 'host-key-changed' }, 5).prompt, { kind: 'host', fp: K1 });
  assert.deepEqual(last({ script: 'host-key-changed' }).client.knownHosts, [line(K1)]);
});

// ── rules 5–7: user authentication ──

test('rule 5: publickey is tried first when the client has a key and may use it', () => {
  const cli = { keyPair: { fp: L.USER_FP } }, srv = { authorizedKeys: [L.USER_FP], passwordAuth: true };
  assert.deepEqual(L.userAuth(cli, srv, 'any').tries.map((x) => x.m), ['publickey']);
  assert.equal(L.userAuth(cli, srv, 'any').out, 'publickey');
  // refusing the key: the none request asks for the methods, password is used
  const pw = L.userAuth(cli, srv, 'password');
  assert.deepEqual(pw.tries.map((x) => x.m), ['none']);
  assert.equal(pw.out, 'password-prompt');
  // no key pair at all: none, then password
  assert.deepEqual(L.userAuth({ keyPair: null }, srv, 'any').tries.map((x) => x.m), ['none']);
});

test('rule 5: the method list holds password only while it is allowed', () => {
  assert.deepEqual(L.methods({ passwordAuth: true }), ['publickey', 'gssapi-keyex', 'gssapi-with-mic', 'password']);
  assert.deepEqual(L.methods({ passwordAuth: false }), ['publickey', 'gssapi-keyex', 'gssapi-with-mic']);
});

test('rule 6: key login sends only the public key fingerprint and a signature; no password prompt', () => {
  const s = last({ script: 'key-login' });
  assert.equal(s.conn.userAuth, 'publickey');
  assert.equal(s.conn.outcome, 'session');
  const pk = s.rows.filter((r) => r.k === 'publickey');
  assert.deepEqual(pk.map((r) => r.fp), [L.USER_FP]);
  assert.ok(!s.rows.some((r) => r.k === 'password'));
  assert.ok(!s.transcript.some((l) => /password:/.test(l.text)));
  assert.equal(s.transcript.at(-1).text, L.SERVER_FQDN);
  // nothing in the run carries the private key: the state knows only fingerprints
  assert.ok(!JSON.stringify(s).includes('PRIVATE'));
});

test('rule 6: a password login prompts, then sends the password, every time', () => {
  const p = { script: 'second-connection', queue: 'S' };
  assert.deepEqual(kinds(p), ['kex', 'check:known', 'auth:password-prompt', 'password', 'kex', 'check:known', 'auth:password-prompt', 'password']);
  assert.deepEqual(at(p, 3).prompt, { kind: 'password' });
  assert.equal(last(p).rows.filter((r) => r.k === 'password').length, 2);
  assert.equal(last(p).conn.userAuth, 'password');
});

test('rule 7: PasswordAuthentication no + a client that will not use its key → Permission denied with the book\'s list', () => {
  const s = last({ script: 'password-off' });
  assert.equal(s.conn.userAuth, 'denied');
  assert.equal(s.conn.outcome, 'denied');
  assert.equal(s.transcript.at(-1).text, 'student@192.168.122.57: Permission denied (publickey,gssapi-keyex,gssapi-with-mic).');
  assert.match(s.transcript.at(-2).text, /ssh -o PubkeyAuthentication=no student@192\.168\.122\.57 'hostname'$/);
});

test('rule 7: password off, no key installed → denied; turning password on again lets the password in', () => {
  const p = { script: 'second-connection', queue: 'PS' };
  const ev = events(p);
  assert.deepEqual(ev.slice(4).map((e) => e.kind + ':' + (e.out || e.on)), ['pwset:false', 'kex:undefined', 'check:undefined', 'auth:denied']);
  const p2 = { script: 'password-off', queue: 'PW' };
  assert.equal(last(p2).conn.userAuth, 'password');
});

// ── rule 8: two fingerprints ──

test('rule 8: host-key and user-key fingerprints are distinct and stay in their own places', () => {
  assert.ok(!L.HOST_KEYS.includes(L.USER_FP));
  const s = last({ script: 'key-login' });
  assert.ok(s.client.knownHosts.every((e) => L.HOST_KEYS.includes(e.fp)));
  assert.ok(s.server.authorizedKeys.every((fp) => fp === L.USER_FP));
  assert.deepEqual(s.rows.filter((r) => r.k === 'hostkey').map((r) => r.fp), [K0]);
  assert.deepEqual(s.rows.filter((r) => r.k === 'publickey').map((r) => r.fp), [L.USER_FP]);
  assert.match(K0, /^SHA256:a8FjBS/);
  assert.match(L.USER_FP, /^SHA256:ACblrD/);
});

// ── the other actions ──

test('reinstall gets the next host key and never an old one: N is refused after the last', () => {
  const K3 = L.HOST_KEYS[3];
  const p = { script: 'second-connection', queue: 'NNN' };
  const ev = events(p).filter((e) => e.kind === 'reinstall');
  assert.deepEqual(ev.map((e) => [e.old, e.fp]), [[K0, K1], [K1, K2], [K2, K3]]);
  assert.equal(new Set(L.HOST_KEYS).size, L.HOST_KEYS.length);
  assert.equal(L.canQueue(P(p), 'N'), false);
  assert.equal(L.canQueue(P({ script: 'second-connection', queue: 'NN' }), 'N'), true);
  assert.equal(L.canQueue(P({ script: 'host-key-changed', queue: 'NN' }), 'N'), false);
  // past the list the model changes nothing (the buttons never get there)
  const s = last({ script: 'second-connection', queue: 'NNNN' });
  assert.equal(s.server.hostKey.fp, K3);
  assert.equal(s.ev.fp, null);
});

test('key makes the pair when missing (two steps), else only installs; a second install adds nothing', () => {
  assert.deepEqual(kinds({ script: 'key-login' }).slice(0, 2), ['keygen', 'install']);
  const p = { script: 'key-login', queue: 'K' };
  const ev = events(p);
  assert.equal(ev.at(-1).kind, 'install');
  assert.equal(ev.at(-1).dup, true);
  assert.deepEqual(last(p).server.authorizedKeys, [L.USER_FP]);
  assert.equal(ev.filter((e) => e.kind === 'keygen').length, 1);
});

test('install is refused while password login is off and no key is in authorized_keys (no way in)', () => {
  const p = { script: 'second-connection', queue: 'PKS' };
  assert.deepEqual(kinds(p).slice(4), ['pwset', 'keygen', 'install', 'kex', 'check:known', 'auth:denied']);
  const ev = events(p);
  assert.equal(ev[6].refused, true);
  const s = last(p);
  assert.deepEqual(s.server.authorizedKeys, []);
  assert.equal(s.rows.find((r) => r.k === 'install').refused, true);
  assert.equal(at(p, 7).marks.ak, undefined);
  // with password on the same install goes through
  assert.equal(events({ script: 'second-connection', queue: 'KS' })[5].refused, false);
});

test('forget: the caption knows whether the removed line held another key; the next question is "again"', () => {
  const changed = events({ script: 'host-key-changed' });
  assert.equal(changed[2].changed, true);
  assert.equal(changed[4].again, true);
  const same = events({ script: 'second-connection', queue: 'DS' });
  assert.equal(same[4].kind, 'forget');
  assert.equal(same[4].changed, false);
  assert.equal(same[6].again, true);
  // a forget that removed nothing does not make the next question "again"
  const none = events({ answer: 'no', queue: 'DS' });
  assert.equal(none[3].count, 0);
  assert.equal(none[5].again, false);
  // after the key is stored the flag is gone
  assert.equal(last({ script: 'host-key-changed' }).forgot, false);
  assert.equal(at({ script: 'host-key-changed' }, 3).forgot, true);
});

test('the client\'s key pair is in the events the captions read (kex, auth)', () => {
  assert.equal(events({ script: 'password-off' })[3].keyPair, true);
  assert.equal(events({ script: 'password-off' })[5].keyPair, true);
  assert.equal(events({})[0].keyPair, false);
  assert.equal(events({})[3].keyPair, false);
});

test('forget with no line removes nothing', () => {
  const s = last({ script: 'first-connection', answer: 'no', queue: 'D' });
  assert.equal(s.ev.kind, 'forget');
  assert.equal(s.ev.count, 0);
  assert.deepEqual(s.marks.removed, []);
});

test('the queue: letters run after the script in order; unknown letters are ignored', () => {
  assert.deepEqual(L.actions(P({ script: 'second-connection', queue: 'NxKDW' })).map((a) => a.a + ':' + a.offer),
    ['connect:any', 'reinstall:any', 'key:any', 'forget:any', 'connect:password']);
});

test('the queue is refused past 20 steps or 12 actions', () => {
  assert.equal(L.canQueue(P({}), 'S'), true);
  assert.equal(L.canQueue(P({}), 'Z'), false);
  // 5 + 4 × 4 (known host + password) = 21 > 20
  assert.equal(L.canQueue(P({ queue: 'SSS' }), 'S'), false);
  // 4 + 4 × 4 = 20: exactly the limit is allowed
  assert.equal(L.canQueue(P({ script: 'second-connection', queue: 'SSS' }), 'S'), true);
  assert.equal(L.steps(P({ script: 'second-connection', queue: 'SSSS' })), 20);
  assert.equal(L.canQueue(P({ queue: 'SSS' }), 'N'), true);
  assert.equal(L.canQueue(P({ script: 'second-connection', queue: 'DDDDDDDDDDDD' }), 'D'), false);
  assert.equal(L.canQueue(P({ script: 'second-connection', queue: 'DDDDDDDDDDD' }), 'D'), true);
});

test('connections are numbered in order (the chart\'s time column)', () => {
  const p = { script: 'password-off', queue: 'S' };
  assert.deepEqual(events(p).filter((e) => e.kind === 'kex').map((e) => e.conn), [1, 2, 3]);
  assert.deepEqual(last(p).rows.filter((r) => r.k === 'kex').map((r) => r.conn), [1, 2, 3]);
  assert.equal(last(p).conn.n, 3);
});

// ── the presets' numbers (SPEC.md) ──

test('presets: step counts', () => {
  const want = { 'first-connection': 5, 'second-connection': 4, 'host-key-changed': 7, 'key-login': 5, 'password-off': 6 };
  for (const [script, n] of Object.entries(want)) assert.equal(L.steps(P({ script })), n, script);
  assert.equal(L.steps(L.defaults), 5);
});

test('presets: every step\'s event (golden)', () => {
  assert.deepEqual(kinds({ script: 'second-connection' }), ['kex', 'check:known', 'auth:password-prompt', 'password']);
  assert.deepEqual(kinds({ script: 'key-login' }), ['keygen', 'install', 'kex', 'check:known', 'auth:publickey']);
  assert.deepEqual(kinds({ script: 'password-off' }), ['kex', 'check:known', 'auth:publickey', 'kex', 'check:known', 'auth:denied']);
  const fc = last({});
  assert.deepEqual(fc.transcript.map((l) => l.text), [
    "[student@democli1 ~]$ ssh student@192.168.122.57 'hostname'",
    "The authenticity of host '192.168.122.57 (192.168.122.57)' can't be established.",
    'ED25519 key fingerprint is SHA256:a8FjBS05WGhECCl2x0lY5eQjjVRGMGSZ5fx73CdxIBA.',
    'This key is not known by any other names.',
    'Are you sure you want to continue connecting (yes/no/[fingerprint])? yes',
    "Warning: Permanently added '192.168.122.57' (ED25519) to the list of known hosts.",
    "student@192.168.122.57's password: ",
    'demosrv1.lab.local'
  ]);
  assert.deepEqual(fc.rows.map((r) => r.k), ['kex', 'hostkey', 'check', 'answer', 'none', 'failure', 'password', 'success', 'session']);
  assert.deepEqual(fc.rows.find((r) => r.k === 'failure').list, ['publickey', 'gssapi-keyex', 'gssapi-with-mic', 'password']);
});

test('the step marks: changed rows carry this step\'s number', () => {
  const s = at({}, 4);
  assert.deepEqual(s.rows.filter((r) => r.n === 4).map((r) => r.k), ['none', 'failure']);
  assert.ok(s.transcript.at(-1).prompt);
});

test('golden: every page-visible field of every step (presets and two queued runs, golden.json)', () => {
  const golden = require('./golden.json');
  assert.deepEqual(snapshot(), golden);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const script of Object.keys(L.SCRIPTS)) {
    const p = P({ script, queue: 'NSKDPW' });
    for (let n = 0; n <= L.steps(p); n++) {
      const s = kit.stateAt(L, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ script: 'host-key-changed', queue: 'NSD' });
  const forward = [];
  let s = L.initial(p);
  forward.push(s);
  for (let n = 1; n <= L.steps(p); n++) { s = L.step(s, n, p); forward.push(s); }
  for (let n = L.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  let s = L.initial(p);
  for (let n = 1; n <= L.steps(p); n++) {
    const copy = structuredClone(s);
    const next = L.step(s, n, p);
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
  assert.equal(meta.steps, L.steps(L.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in L.defaults, `preset param ${k} is a model param`);
  const scripts = [...html.matchAll(/script: '([\w-]+)'/g)].map((m) => m[1]);
  assert.deepEqual(scripts, Object.keys(L.SCRIPTS));
});
