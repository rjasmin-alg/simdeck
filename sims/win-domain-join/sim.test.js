// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-domain-join's model (rules: SPEC.md). Run: node --test sims/win-domain-join/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const R = (a, over) => P(Object.assign({ scenario: 'revert', snapshotAge: a }, over));
const end = (p) => kit.stateAt(logic, p, logic.steps(p));
const at = (p, n) => kit.stateAt(logic, p, n);
/** The run as event kinds, with ✓/✕ on the ones that can fail. */
const path = (s) => s.log.map((e) => e.kind + ('ok' in e ? (e.ok ? '✓' : '✕') : ''));
const pw = (x) => [x.cur, x.prev];
const cli = (s) => pw(s.client.pwd);
const objPw = (s) => pw(s.dc.objects.PC07.pwd);

// ── tie-breaks first ──

test('T1: a change due on the revert day comes before the revert', () => {
  assert.deepEqual(end(R(30)).log.filter((e) => e.kind === 'change' && !e.afterRevert).map((e) => e.day), [30]);
  assert.deepEqual(end(R(60)).log.filter((e) => e.kind === 'change' && !e.afterRevert).map((e) => e.day), [30, 60]);
  assert.deepEqual(end(R(90)).log.filter((e) => e.kind === 'change' && !e.afterRevert).map((e) => e.day), [30, 60, 90]);
  assert.equal(end(R(30)).log.find((e) => e.kind === 'channel').ok, true, 'one change: works');
  assert.equal(end(R(60)).log.find((e) => e.kind === 'channel').ok, false, 'two changes: broken');
  assert.equal(end(R(55)).log.find((e) => e.kind === 'channel').ok, true);
});

test('T2: a copy exactly 30 days old is due; 29 days is not', () => {
  assert.equal(logic.due(0, 30), true);
  assert.equal(logic.due(0, 29), false);
  assert.equal(logic.due(null, 90), false, 'no password, nothing to change');
  assert.equal(logic.MAX_AGE, 30);
  assert.deepEqual(path(end(R(25))), ['snapshot', 'revert', 'channel✓', 'logon✓']);
});

test('T3: an empty previous never matches', () => {
  assert.equal(logic.channelMatch('p0', { cur: 'p0', prev: null }), 'cur');
  assert.equal(logic.channelMatch(null, { cur: 'p0', prev: null }), null);
  assert.equal(logic.channelMatch('p1', { cur: 'p0', prev: null }), null);
  assert.equal(logic.channelMatch('p0', { cur: 'p1', prev: 'p0' }), 'prev');
  assert.equal(logic.channelMatch('p0', { cur: 'p2', prev: 'p1' }), null);
});

test('T4: the revert restores the client only; the object and the label counter go on', () => {
  const p = R(65);
  const i = end(p).log.findIndex((e) => e.kind === 'revert') + 1;
  const s = at(p, i);
  assert.deepEqual(cli(s), ['p0', null]);
  assert.equal(s.client.lastSet, 0);
  assert.deepEqual(objPw(s), ['p2', 'p1']);
  assert.equal(s.nextPwd, 3);
  assert.equal(s.secureChannel, 'none', 'no channel until it is built again');
  assert.equal(at(p, i - 1).secureChannel, 'ok');
  assert.equal(end(p).log.find((e) => e.kind === 'reset').label, 'p3', 'the next label, not p1 again');
});

test('T5: a failed locate or quota leaves nothing: no object, no password, no channel, count unchanged', () => {
  for (const p of [P({ dnsServer: 'public', joinsByUser: 4 }), P({ joinsByUser: 10 })]) {
    const s = end(p);
    assert.deepEqual(s.dc.objects, {});
    assert.deepEqual(cli(s), [null, null]);
    assert.equal(s.secureChannel, 'none');
    assert.equal(s.client.joined, false);
    assert.equal(s.dc.quota.count, p.joinsByUser);
  }
});

test('T6: DNS is checked before the quota', () => {
  const s = end(P({ dnsServer: 'public', joinsByUser: 10 }));
  assert.equal(s.result, 'noDc');
  assert.deepEqual(path(s), ['srvQuery', 'srvAnswer', 'fail']);
});

// ── rules ──

test('rule 1: SRV query for _ldap._tcp.dc._msdcs.<domain>, DC01 answers, then an LDAP ping', () => {
  const s = end(P());
  assert.equal(logic.srvName('quillmoor.example'), '_ldap._tcp.dc._msdcs.quillmoor.example');
  assert.deepEqual(s.log[0], { kind: 'srvQuery', q: '_ldap._tcp.dc._msdcs.quillmoor.example', server: '10.10.0.10', n: 1, day: 0 });
  assert.deepEqual([s.log[1].rcode, s.log[1].target, s.log[1].port, s.log[1].ip], ['NOERROR', 'DC01.quillmoor.example', 389, '10.10.0.10']);
  assert.deepEqual([s.log[2].kind, s.log[2].to, s.log[2].port], ['ping', 'DC01', 389]);
  assert.deepEqual([s.log[3].kind, s.log[3].dc, s.log[3].domain], ['pong', 'DC01', 'quillmoor.example']);
  assert.equal(at(P(), 3).client.dc, null, 'the DC is known only after the ping reply');
  assert.equal(at(P(), 4).client.dc, 'DC01');
});

test('rule 1: a public resolver answers NXDOMAIN and the join fails', () => {
  const p = P({ dnsServer: 'public' });
  const s = end(p);
  assert.equal(s.log[0].server, '198.51.100.53');
  assert.equal(s.log[1].rcode, 'NXDOMAIN');
  assert.equal(s.log[1].target, null);
  assert.equal(s.log[2].reason, 'noDc');
  assert.equal(s.result, 'noDc');
  assert.deepEqual(logic.locate('public').rcode, 'NXDOMAIN');
});

test('rule 2: CN=PC07 in CN=Computers; an ordinary user creates at most 10', () => {
  assert.equal(logic.QUOTA, 10);
  assert.equal(logic.mayCreate(9, 10), true);
  assert.equal(logic.mayCreate(10, 10), false);
  const s = end(P({ joinsByUser: 9 }));
  assert.equal(s.result, 'joined');
  assert.equal(s.dc.quota.count, 10);
  assert.equal(s.dc.objects.PC07.dn, 'CN=PC07,CN=Computers,DC=quillmoor,DC=example');
  const q = end(P({ joinsByUser: 10 }));
  assert.deepEqual(path(q), ['srvQuery', 'srvAnswer', 'ping', 'pong', 'create✕']);
  assert.equal(q.result, 'quota');
  assert.deepEqual([q.log[4].count, q.log[4].max, q.log[4].user], [10, 10, 'ana']);
  assert.equal(end(P()).dc.quota.count, 1);
  assert.equal(at(P(), 5).dc.objects.PC07.pwd.cur, null, 'the object has no password before step 6');
});

test('rule 3: p0 on the object and as the LSA secret; restart required', () => {
  const s = at(P(), 6);
  assert.deepEqual(s.log[5], { kind: 'setPwd', label: 'p0', n: 6, day: 0 });
  assert.deepEqual(cli(s), ['p0', null]);
  assert.deepEqual(objPw(s), ['p0', null]);
  assert.equal(s.client.lastSet, 0);
  assert.equal(s.client.restart, true);
  assert.equal(s.client.joined, true, 'a domain member from here on');
  assert.equal(at(P(), 5).client.joined, false, 'not before the password is set');
  assert.equal(s.secureChannel, 'none', 'no channel before the restart');
  assert.equal(at(P(), 7).client.restart, false);
});

test('rule 4: after the restart the secure channel is built with p0', () => {
  const s = end(P());
  assert.deepEqual(path(s), ['srvQuery', 'srvAnswer', 'ping', 'pong', 'create✓', 'setPwd', 'restart', 'channel✓']);
  assert.deepEqual([s.log[7].pwd, s.log[7].match], ['p0', 'cur']);
  assert.equal(s.secureChannel, 'ok');
  assert.equal(s.result, 'joined');
  assert.equal(at(P(), 7).secureChannel, 'none');
});

test('rule 5: the client changes every 30 days; both sides keep current and previous', () => {
  const p = R(65);
  const s = end(p);
  const ch = s.log.filter((e) => e.kind === 'change');
  assert.deepEqual(ch.map((e) => [e.day, e.from, e.label]), [[30, 'p0', 'p1'], [60, 'p1', 'p2']]);
  assert.deepEqual(pw(ch[1].client), ['p2', 'p1']);
  assert.deepEqual(pw(ch[1].obj), ['p2', 'p1']);
  assert.deepEqual(logic.rotate({ cur: 'p1', prev: 'p0' }, 'p2'), { cur: 'p2', prev: 'p1' });
});

test('rule 6: the channel works while the client has the object\'s current or previous password', () => {
  const s35 = end(R(35));
  const c35 = s35.log.find((e) => e.kind === 'channel');
  assert.deepEqual([c35.pwd, pw(c35.obj), c35.match], ['p0', ['p1', 'p0'], 'prev']);
  const c65 = end(R(65)).log.find((e) => e.kind === 'channel');
  assert.deepEqual([c65.pwd, pw(c65.obj), c65.match, c65.ok], ['p0', ['p2', 'p1'], null, false]);
});

test('rule 7: two changes since the snapshot: broken, logon refused; one change: works, then changes at once', () => {
  const b = end(R(65));
  assert.deepEqual(path(b), ['snapshot', 'change', 'change', 'revert', 'channel✕', 'logon✕', 'reset', 'channel✓', 'logon✓']);
  const i = b.log.findIndex((e) => e.kind === 'logon') + 1;
  assert.equal(at(R(65), i).logon, 'refused');
  assert.equal(at(R(65), i).secureChannel, 'broken');
  const r = b.log.find((e) => e.kind === 'revert');
  assert.deepEqual([pw(r.before), pw(r.after), r.snapshotDay, r.day], [['p2', 'p1'], ['p0', null], 0, 65]);
  const w = end(R(35));
  assert.deepEqual(path(w), ['snapshot', 'change', 'revert', 'channel✓', 'logon✓', 'change']);
  const post = w.log.at(-1);
  assert.deepEqual([post.afterRevert, post.day, post.from, post.label], [true, 35, 'p0', 'p2']);
  assert.deepEqual(cli(w), ['p2', 'p0']);
  assert.deepEqual(objPw(w), ['p2', 'p1']);
  assert.equal(logic.channelMatch(w.client.pwd.cur, w.dc.objects.PC07.pwd), 'cur', 'in step again');
});

test('rule 8: the admin resets both sides; the channel and the logon work again; the object stays', () => {
  const s = end(R(65));
  const r = s.log.find((e) => e.kind === 'reset');
  assert.deepEqual([r.by, r.from, r.label, pw(r.client), pw(r.obj)], ['admin', 'p0', 'p3', ['p3', 'p0'], ['p3', 'p2']]);
  assert.equal(s.secureChannel, 'ok');
  assert.equal(s.logon, 'ok');
  assert.equal(s.result, 'repaired');
  assert.equal(s.dc.objects.PC07.dn, logic.DN, 'the same object');
  assert.equal(s.client.lastSet, 65);
  const n90 = end(R(90));
  assert.deepEqual([cli(n90), objPw(n90)], [['p4', 'p0'], ['p4', 'p3']]);
});

test('revert scenario starts joined on day 0 with p0 and a working channel; the join params do not apply', () => {
  const s = logic.initial(R(65, { dnsServer: 'public', joinsByUser: 10 }));
  assert.deepEqual([cli(s), objPw(s), s.secureChannel, s.client.joined, s.client.dns, s.dc.quota.count], [['p0', null], ['p0', null], 'ok', true, '10.10.0.10', 1]);
  assert.deepEqual(path(end(R(65, { dnsServer: 'public', joinsByUser: 10 }))), path(end(R(65))));
  assert.deepEqual(path(end(P({ snapshotAge: 90 }))), path(end(P())), 'snapshotAge does not change a join');
});

test('days: snapshot 0, changes 30/60/90, revert and everything after it on the revert day', () => {
  assert.deepEqual(end(R(65)).log.map((e) => e.day), [0, 30, 60, 65, 65, 65, 65, 65, 65]);
  assert.deepEqual(end(P()).log.map((e) => e.day), [0, 0, 0, 0, 0, 0, 0, 0]);
});

test('presets: join 8, revert-65 9, revert-35 6, wrong-dns 3, quota 5; at most 10 over all params', () => {
  const cases = [[P(), 8], [R(65), 9], [R(35), 6], [P({ dnsServer: 'public' }), 3], [P({ joinsByUser: 10 }), 5]];
  for (const [p, n] of cases) assert.equal(logic.steps(p), n, JSON.stringify(p));
  let max = 0;
  for (let a = 0; a <= 90; a += 5) {
    const n = logic.steps(R(a));
    const k = Math.floor(a / 30);
    assert.equal(n, k <= 1 ? 4 + 2 * k : 7 + k, 'a=' + a);
    max = Math.max(max, n);
    assert.equal(end(R(a)).phase, 'done');
  }
  for (const d of logic.DNS_SERVERS) for (let q = 0; q <= 10; q++) {
    const s = end(P({ dnsServer: d, joinsByUser: q }));
    max = Math.max(max, s.log.length);
    assert.equal(s.phase, 'done');
  }
  assert.equal(max, 10);
  assert.equal(logic.steps(logic.defaults), 8);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of [P(), R(65), R(35), R(90), P({ joinsByUser: 10 })]) {
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of [P(), R(65)]) {
    const steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const p of [P(), R(65)]) {
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
  const fs = require('node:fs'), path_ = require('node:path');
  const html = fs.readFileSync(path_.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const pairs = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):\s*'?(\w+)'?/g)].map((k) => [k[1], k[2]]));
  assert.ok(pairs.length > 0, 'found preset params');
  for (const [k, v] of pairs) {
    assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    if (k === 'scenario') assert.ok(logic.SCENARIOS.includes(v), `scenario ${v}`);
    if (k === 'dnsServer') assert.ok(logic.DNS_SERVERS.includes(v), `dnsServer ${v}`);
  }
  const sim = JSON.parse(fs.readFileSync(path_.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
});
