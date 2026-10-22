// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for email-path's model (rules: SPEC.md). Run: node --test sims/email-path/
// Tie-breaks first, then rules 1–7, the presets' numbers and a golden run, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const PRESETS = {
  'two-domains': { script: 'two-domains' },
  'urm-two-devices': { script: 'urm-two-devices' },
  'envelope-vs-header': { script: 'envelope-vs-header', headerFromDiffers: true },
  'no-auth-submission': { script: 'no-auth-submission', authenticated: false }
};

/** Every state of a run, 0 … steps. */
function run(over) {
  const p = P(over);
  const out = [logic.initial(p)];
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) out.push(logic.step(out[i - 1], i, p));
  return out;
}
const last = (over) => run(over).slice(-1)[0];
const kinds = (over) => logic.plan(P(over)).map((x) => x.kind + (x.device ? ':' + x.device : ''));
const fmtReceived = (r) => 'from ' + r.from + ' by ' + r.by + ' with ' + r.with;
const msgOf = (from, rcpt, headerTo) => ({
  envelope: { mailFrom: from, rcptTo: [rcpt] }, header: { from: from, to: headerTo || rcpt, subject: 's' }, body: 'b', received: [], returnPath: null
});

// ── tie-breaks ──

test('tie-break: MX records of equal preference → the first listed', () => {
  const a = { pref: 10, host: 'a.example' }, b = { pref: 10, host: 'b.example' }, c = { pref: 5, host: 'c.example' };
  assert.equal(logic.pickMx([a, b]).host, 'a.example');
  assert.equal(logic.pickMx([b, a]).host, 'b.example');
  // a lower preference later in the list still wins over an earlier tie
  assert.equal(logic.pickMx([a, b, c]).host, 'c.example');
  assert.equal(logic.pickMx([]), null);
});

test('tie-break: lowest preference first, not the first listed (the zone lists mx2 = 20 before mx = 10)', () => {
  const recs = logic.SCENES.lab.dns['drugdje.example'];
  assert.equal(recs[0].host, 'mx2.drugdje.example');
  assert.equal(logic.pickMx(recs).host, 'mx.drugdje.example');
  assert.equal(logic.pickMx(recs).pref, 10);
  const s = run({}).find((x) => x.hop === 'mx');
  assert.deepEqual([s.mx.domain, s.mx.host, s.mx.pref], ['drugdje.example', 'mx.drugdje.example', 10]);
  assert.equal(s.ev.count, 2);
});

test('tie-break: a domain the server hosts itself is delivered there: no MX lookup, no relay', () => {
  assert.equal(logic.route('grafo', msgOf('marko@grafo.hr', 'petar@grafo.hr')).local, true);
  assert.equal(logic.route('lab', msgOf('ana@lab.example', 'iva@lab.example')).local, true);
  assert.equal(logic.route('lab', msgOf('ana@lab.example', 'ivan@drugdje.example')).local, false);
  const k = kinds({ script: 'urm-two-devices' });
  assert.ok(!k.includes('mx') && !k.includes('relay') && k.includes('local'));
  assert.equal(last({ script: 'urm-two-devices' }).mx, null);
});

// ── rules ──

test('rule 1: submission is on 587; without a login the MSA refuses MAIL with 530 5.7.0 and nothing moves', () => {
  assert.equal(logic.PORT.submission, 587);
  assert.deepEqual(logic.submissionReply(true), { ok: true, code: 250 });
  assert.deepEqual(logic.submissionReply(false), { ok: false, code: 530, enh: '5.7.0' });
  const s = run({}).find((x) => x.hop === 'submit');
  assert.equal(s.rows.at(-1).port, 587);
  assert.equal(s.rows.at(-1).auth, true);
  assert.equal(s.at, 'P');
  const states = run(PRESETS['no-auth-submission']);
  assert.deepEqual(kinds(PRESETS['no-auth-submission']), ['try', 'refuse']);
  const end = states.at(-1);
  assert.equal(end.at, 'A');
  assert.equal(end.msg.received.length, 0);
  assert.deepEqual(end.refused, { code: 530, enh: '5.7.0' });
  assert.equal(end.store.messages.length, 0);
  assert.equal(end.mx, null);
  assert.deepEqual(end.log.map((l) => [l.host, l.role, l.status, l.code]), [['posluzitelj.lab.example', 'receive', 'reject', '530 5.7.0']]);
  assert.deepEqual(end.rows.map((r) => [r.from, r.to, r.kind, r.port || r.code]), [['A', 'P', 'smtp', 587], ['P', 'A', 'reply', 530]]);
  // the login switch refuses on every script, whatever the scene
  for (const script of Object.keys(logic.SCRIPTS)) assert.deepEqual(kinds({ script, authenticated: false }), ['try', 'refuse']);
});

test('rule 2: MTA to MTA is SMTP on port 25, one hop, from the sending server to the MX host', () => {
  assert.equal(logic.PORT.relay, 25);
  const s = run({}).find((x) => x.hop === 'relay');
  const r = s.rows.at(-1);
  assert.deepEqual([r.from, r.to, r.kind, r.port], ['P', 'M', 'smtp', 25]);
  assert.equal(s.at, 'M');
  assert.equal(s.ev.to, 'mx.drugdje.example');
  assert.equal(s.rows.filter((x) => x.kind === 'smtp').length, 2);
});

test('rule 3: the next hop is chosen by the envelope RCPT TO domain, not the header To:', () => {
  const m = msgOf('ana@lab.example', 'ivan@drugdje.example', 'netko@lab.example');
  const r = logic.route('lab', m);
  assert.equal(r.local, false);
  assert.equal(r.domain, 'drugdje.example');
  assert.equal(r.host, 'mx.drugdje.example');
  const m2 = msgOf('ana@lab.example', 'iva@lab.example', 'ivan@drugdje.example');
  assert.equal(logic.route('lab', m2).local, true);
  // domains compare without case
  assert.equal(logic.route('lab', msgOf('ana@lab.example', 'Ivan@DRUGDJE.example')).host, 'mx.drugdje.example');
});

test('rule 4: a relay adds one Received: line on top and changes nothing else', () => {
  const states = run({});
  for (let i = 1; i < states.length; i++) {
    const a = states[i - 1].msg, b = states[i].msg;
    const added = b.received.length - a.received.length;
    assert.ok(added === 0 || added === 1, 'at most one trace line per step');
    if (added) assert.deepEqual(b.received.slice(1), a.received, 'the new line goes on top');
    assert.deepEqual(b.envelope, a.envelope);
    assert.deepEqual(b.header, a.header);
    assert.equal(b.body, a.body);
  }
  const before = states.find((x) => x.hop === 'mx').msg, after = states.find((x) => x.hop === 'relay').msg;
  assert.deepEqual(after.received[0], { from: 'posluzitelj.lab.example', by: 'mx.drugdje.example', with: 'ESMTP' });
  assert.equal(after.returnPath, null);
  const t = logic.trace(before, 'x', 'y', 'ESMTP');
  assert.deepEqual(before.received.length + 1, t.received.length, 'trace copies, the input is kept');
});

test('rule 5: envelope and header differ; routing, trace and logs follow the envelope, the device shows the header', () => {
  const plain = run({ script: 'envelope-vs-header' }), fake = run(PRESETS['envelope-vs-header']);
  assert.deepEqual(kinds(PRESETS['envelope-vs-header']), kinds({ script: 'envelope-vs-header' }));
  const a = plain.at(-1), b = fake.at(-1);
  assert.equal(b.msg.envelope.mailFrom, 'ana@lab.example');
  assert.equal(b.msg.header.from, 'direktor@lab.example');
  assert.equal(a.msg.header.from, 'ana@lab.example');
  assert.deepEqual(b.msg.received, a.msg.received);
  assert.deepEqual(b.log, a.log);
  assert.deepEqual(b.mx, a.mx);
  assert.equal(b.msg.returnPath, 'ana@lab.example');
  assert.ok(b.log.every((l) => !l.from || l.from === 'ana@lab.example'));
  assert.equal(b.at, 'S');
  assert.deepEqual(b.devices.find((d) => d.id === 'computer').sees, [{ id: 1, seen: false }]);
});

test('rule 6: delivery moves the message into the mailbox, writes Return-Path from MAIL FROM and one Received:', () => {
  const states = run({});
  const i = states.findIndex((x) => x.hop === 'deliver');
  const a = states[i - 1], s = states[i];
  assert.equal(a.store.messages.length, 0);
  assert.equal(s.at, 'S');
  assert.deepEqual(s.store.messages, [{ id: 1, seen: false, deleted: false }]);
  assert.equal(s.msg.returnPath, 'ana@lab.example');
  assert.equal(s.msg.received.length, a.msg.received.length + 1);
  assert.equal(s.msg.received[0].with, 'LMTP');
  assert.deepEqual(s.rows.at(-1), { n: i, from: 'M', to: 'S', kind: 'deliver', mailbox: 'ivan@drugdje.example' });
  assert.deepEqual(s.log.at(-1), { n: i, host: 'mx.drugdje.example', role: 'deliver', to: 'ivan@drugdje.example', status: 'delivered' });
  // in the grafo scene the sending server delivers itself
  const g = run({ script: 'urm-two-devices' }).find((x) => x.hop === 'deliver');
  assert.equal(g.rows.at(-1).from, 'P');
});

test('rule 7: fetching is IMAP 143 or POP3 110, never SMTP; IMAP keeps state on the server', () => {
  const s = last({ script: 'urm-two-devices' });
  const fetches = s.rows.filter((r) => r.from === 'I' && r.to === 'S');
  assert.ok(fetches.length >= 2);
  for (const r of fetches) { assert.notEqual(r.kind, 'smtp'); assert.ok([143].includes(r.port)); }
  assert.deepEqual(s.devices.map((d) => [d.id, d.sees]), [['phone', [{ id: 1, seen: true }]], ['computer', [{ id: 1, seen: true }]]]);
  assert.deepEqual(s.store.messages, [{ id: 1, seen: true, deleted: false }]);
  const read = run({ script: 'urm-two-devices' }).find((x) => x.hop === 'read');
  assert.equal(read.ev.onServer, true);
  assert.equal(read.rows.at(-1).kind, 'imap-seen');
  // before anyone reads it, both devices see it unread
  assert.deepEqual(last({}).devices.map((d) => d.sees), [[{ id: 1, seen: false }], [{ id: 1, seen: false }]]);
});

test('rule 7: POP3 with delete: the first device takes the message away; the second finds nothing', () => {
  const states = run({ script: 'urm-two-devices', fetch: 'pop3' });
  const f1 = states.find((x) => x.hop === 'fetch' && x.ev.device === 'phone');
  assert.deepEqual(f1.store.messages, [{ id: 1, seen: false, deleted: true }]);
  assert.equal(f1.ev.removed, 1);
  assert.deepEqual(f1.rows.at(-1), { n: 4, from: 'I', to: 'S', kind: 'pop3', port: 110, device: 'phone', count: 1, removed: true });
  const rd = states.find((x) => x.hop === 'read');
  assert.equal(rd.ev.onServer, false);
  assert.equal(rd.rows.at(-1).kind, 'note-read');
  assert.equal(rd.store.messages[0].seen, false, 'read on the phone does not reach the server');
  const end = states.at(-1);
  assert.equal(end.ev.count, 0);
  assert.deepEqual(end.devices.map((d) => [d.id, d.sees]), [['phone', [{ id: 1, seen: true }]], ['computer', []]]);
  // two-domains with POP3: the computer misses it too
  assert.deepEqual(last({ fetch: 'pop3' }).devices.map((d) => d.sees.length), [1, 0]);
});

test('IMAP fetch takes nothing away and does not mark the message read', () => {
  const states = run({});
  for (const s of states.filter((x) => x.hop === 'fetch')) {
    assert.deepEqual(s.store.messages, [{ id: 1, seen: false, deleted: false }]);
    assert.equal(s.ev.removed, 0);
    assert.equal(s.ev.count, 1);
  }
});

test('POP3 hands the only copy to the device; an empty POP3 session removes nothing', () => {
  const states = run({ script: 'urm-two-devices', fetch: 'pop3' });
  const f1 = states.find((x) => x.hop === 'fetch' && x.ev.device === 'phone');
  assert.equal(f1.at, 'I');
  const end = states.at(-1);
  assert.deepEqual(end.rows.at(-1), { n: 6, from: 'I', to: 'S', kind: 'pop3', port: 110, device: 'computer', count: 0, removed: false });
  assert.equal(end.ev.removed, 0);
  // IMAP leaves the message in the mailbox
  assert.equal(last({ script: 'urm-two-devices' }).at, 'S');
});

test('devices are marked as connected only once they fetched', () => {
  const st = run({});
  assert.deepEqual(st[4].devices.map((d) => d.synced), [false, false]);
  assert.deepEqual(st[5].devices.map((d) => d.synced), [true, false]);
  assert.deepEqual(st[6].devices.map((d) => d.synced), [true, true]);
});

test('the relay goes to the host the MX lookup picked, not to a fixed name', () => {
  const dns = logic.SCENES.lab.dns['drugdje.example'];
  logic.SCENES.lab.dns['drugdje.example'] = [{ pref: 30, host: 'mx.drugdje.example' }, { pref: 5, host: 'backup.drugdje.example' }];
  try {
    const s = run({}).find((x) => x.hop === 'relay');
    assert.equal(s.ev.to, 'backup.drugdje.example');
    assert.equal(s.msg.received[0].by, 'backup.drugdje.example');
    assert.deepEqual(s.log.slice(-2).map((l) => [l.host, l.relay || null]), [['posluzitelj.lab.example', 'backup.drugdje.example'], ['backup.drugdje.example', null]]);
  } finally { logic.SCENES.lab.dns['drugdje.example'] = dns; }
});

test('log entries: the submission names the login, the sending side says sent', () => {
  const s = last({});
  assert.equal(s.log[0].auth, 'ana');
  assert.equal(s.log[0].status, 'accepted');
  assert.equal(s.log[1].status, 'sent');
  assert.equal(s.log[2].status, 'accepted');
  assert.equal(last({ script: 'urm-two-devices' }).log[0].auth, 'marko');
});

// ── the presets' numbers (SPEC.md) ──

test('steps per preset: 6, 6, 5, 2', () => {
  assert.equal(logic.steps(P(PRESETS['two-domains'])), 6);
  assert.equal(logic.steps(P(PRESETS['urm-two-devices'])), 6);
  assert.equal(logic.steps(P(PRESETS['envelope-vs-header'])), 5);
  assert.equal(logic.steps(P(PRESETS['no-auth-submission'])), 2);
  assert.deepEqual(kinds({}), ['submit', 'mx', 'relay', 'deliver', 'fetch:phone', 'fetch:computer']);
  assert.deepEqual(kinds({ script: 'urm-two-devices' }), ['submit', 'local', 'deliver', 'fetch:phone', 'read:phone', 'fetch:computer']);
  assert.deepEqual(kinds(PRESETS['envelope-vs-header']), ['submit', 'mx', 'relay', 'deliver', 'fetch:computer']);
});

test('two-domains: 3 Received: lines and four log entries, one per role', () => {
  const s = last({});
  assert.deepEqual(s.msg.received.map(fmtReceived), [
    'from mx.drugdje.example by mx.drugdje.example with LMTP',
    'from posluzitelj.lab.example by mx.drugdje.example with ESMTP',
    'from democli1.lab.example by posluzitelj.lab.example with ESMTPSA'
  ]);
  assert.deepEqual(s.log.map((l) => [l.host, l.role, l.port || null]), [
    ['posluzitelj.lab.example', 'receive', 587],
    ['posluzitelj.lab.example', 'send', 25],
    ['mx.drugdje.example', 'receive', 25],
    ['mx.drugdje.example', 'deliver', null]
  ]);
  assert.equal(s.log[1].relay, 'mx.drugdje.example');
  assert.equal(s.done, true);
});

test('urm-two-devices: 2 Received: lines, two log entries, all on 192.168.1.99', () => {
  const s = last({ script: 'urm-two-devices' });
  assert.equal(s.msg.received.length, 2);
  assert.deepEqual(s.log.map((l) => [l.host, l.role]), [['[192.168.1.99]', 'receive'], ['[192.168.1.99]', 'deliver']]);
  assert.equal(s.msg.envelope.mailFrom, 'marko@grafo.hr');
});

test('golden: the chart rows of two-domains', () => {
  const all = last({}).rows;
  assert.deepEqual(all.filter((r) => r.kind.startsWith('dns')), [
    { n: 2, from: 'P', to: 'D', kind: 'dns-q', domain: 'drugdje.example' },
    { n: 2, from: 'D', to: 'P', kind: 'dns-a', host: 'mx.drugdje.example', pref: 10 }
  ]);
  const rows = all.map((r) => [r.n, r.from, r.to, r.kind].join(' '));
  assert.deepEqual(rows, [
    '1 A P smtp', '2 P D dns-q', '2 D P dns-a', '3 P M smtp', '4 M S deliver',
    '5 I S imap', '6 I S imap'
  ]);
  const urm = last({ script: 'urm-two-devices' }).rows.map((r) => [r.n, r.from, r.to, r.kind].join(' '));
  assert.deepEqual(urm, ['1 A P smtp', '2 P P note-local', '3 P S deliver', '4 I S imap', '5 I S imap-seen', '6 I S imap']);
  // every row is between lanes of its scene
  for (const o of Object.values(PRESETS)) {
    const s = last(o);
    const lanes = logic.SCENES[s.scene].lanes;
    for (const r of s.rows) assert.ok(lanes.includes(r.from) && lanes.includes(r.to), JSON.stringify(r));
  }
});

test('events carry what the captions need', () => {
  const st = run({});
  assert.deepEqual(st.map((s) => s.ev.kind), ['start', 'submit', 'mx', 'relay', 'deliver', 'fetch', 'fetch']);
  assert.deepEqual(st[2].ev, { kind: 'mx', domain: 'drugdje.example', host: 'mx.drugdje.example', pref: 10, count: 2 });
  assert.deepEqual(st[5].ev, { kind: 'fetch', device: 'phone', proto: 'imap', port: 143, count: 1, seen: false, removed: 0 });
  assert.equal(run({ script: 'urm-two-devices' })[6].ev.seen, true);
  assert.deepEqual(run({ script: 'urm-two-devices' })[2].ev, { kind: 'local', domain: 'grafo.hr' });
});

// ── generic checks every sim keeps ──

const ALL = Object.values(PRESETS).concat([
  { script: 'urm-two-devices', fetch: 'pop3', headerFromDiffers: true },
  { script: 'two-domains', fetch: 'pop3' },
  { script: 'urm-two-devices', authenticated: false }
]);

test('state is JSON-safe at every step', () => {
  for (const o of ALL) for (const s of run(o)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of ALL) {
    const p = P(o);
    const forward = run(o);
    for (let n = forward.length - 1; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const o of ALL) {
    const p = P(o);
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
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const found = [...html.matchAll(/\{ id: '([\w-]+)',[^\n]*params: \{([^}]*)\}/g)];
  assert.equal(found.length, Object.keys(PRESETS).length, 'found every preset');
  for (const m of found) {
    const params = Function('return {' + m[2] + '}')();
    assert.deepEqual(params, PRESETS[m[1]], `preset ${m[1]} as the tests run it`);
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  }
});
