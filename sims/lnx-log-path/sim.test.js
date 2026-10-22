// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-log-path. Run: node --test sims/lnx-log-path/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then one block per rule, the presets, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const sev = (name) => logic.SEVERITIES.indexOf(name);
const sel = (s, fac, sv) => logic.matchSelector(s, fac, sev(sv));
const MSG = '*.info;mail.none;authpriv.none;cron.none';
const where = (s) => s.records.map((r) => r.where);

// ── tie-breaks ──

test('tie-break: the last term that names the facility decides (rule 3)', () => {
  assert.deepEqual(sel(MSG, 'authpriv', 'info'), { match: false, term: 2 });
  assert.deepEqual(sel('authpriv.none;*.info', 'authpriv', 'info'), { match: true, term: 1 });
  assert.deepEqual(sel('*.info;authpriv.*', 'authpriv', 'debug'), { match: true, term: 1 });
  assert.deepEqual(sel('authpriv.*;*.info', 'authpriv', 'debug'), { match: false, term: 1 });
});

test('tie-break: a term that does not name the facility leaves the decision to the one before', () => {
  assert.deepEqual(sel(MSG, 'user', 'notice'), { match: true, term: 0 });
  assert.deepEqual(sel(MSG, 'mail', 'err'), { match: false, term: 1 });
  assert.deepEqual(sel(MSG, 'cron', 'info'), { match: false, term: 3 });
  assert.deepEqual(sel('authpriv.*', 'user', 'emerg'), { match: false, term: -1 }, 'no term names it: no match');
});

test('tie-break: severity boundary, info matches *.info and debug does not (rule 4)', () => {
  assert.equal(sel('*.info', 'user', 'info').match, true);
  assert.equal(sel('*.info', 'user', 'debug').match, false);
  assert.equal(sel('*.emerg', 'user', 'emerg').match, true);
  assert.equal(sel('*.emerg', 'user', 'alert').match, false);
});

test('tie-break: rules run in file order and every match fires, none stops the rest (rule 5)', () => {
  const s = end({ severity: 'emerg' });
  assert.deepEqual(s.ruleResults, [true, false, false, false, true]);
  assert.deepEqual(where(s), ['journal', '/var/log/messages', 'terminals'], 'records in the order the rules fired');
});

// ── rule 1: journald receives every message ──

test('journald stores every message, even one no rule takes', () => {
  for (const f of logic.FACILITY_IDS) for (const v of logic.SEVERITIES) {
    const s = at({ facility: f, severity: v }, 2);
    assert.equal(s.journal.length, 1, `${f}.${v}`);
    assert.equal(s.journal[0].PRIORITY, sev(v));
    assert.equal(s.journal[0].SYSLOG_FACILITY, logic.FACILITIES[f]);
  }
  assert.deepEqual(where(end({ severity: 'debug' })), ['journal']);
});

test('Storage= picks the journal directory', () => {
  assert.equal(logic.journalPath('persistent'), '/var/log/journal');
  assert.equal(logic.journalPath('volatile'), '/run/log/journal');
  assert.equal(at({ storage: 'volatile' }, 0).storage, 'volatile');
});

test('nothing is stored before step 2 and rsyslog reads at step 3', () => {
  assert.equal(at({}, 1).journal.length, 0);
  assert.equal(at({}, 1).at, 'sender');
  assert.equal(at({}, 2).at, 'journald');
  assert.equal(at({}, 3).at, 'rsyslog');
  assert.deepEqual(at({}, 3).ruleResults, [null, null, null, null, null]);
});

// ── rule 2: one event, two records, same PID ──

test('the file line and the journal entry carry the same tag and PID', () => {
  const s = end({});
  assert.equal(s.journal[0]._PID, 57063);
  assert.equal(s.journal[0].SYSLOG_IDENTIFIER, 'proba');
  assert.deepEqual(s.files['/var/log/messages'], ['demosrv1 proba[57063]: poruka iz 13. poglavlja']);
  assert.equal(s.records.length, 2);
});

test('the kernel has no PID: its line has the tag alone', () => {
  const s = end({ facility: 'kern', severity: 'info' });
  assert.equal(s.journal[0]._PID, null);
  assert.equal(s.journal[0]._TRANSPORT, 'kernel');
  assert.match(s.files['/var/log/messages'][0], /^demosrv1 kernel: /);
});

// ── rules 3 and 4: selectors ──

test('* is any facility and any severity; none is no message of that facility', () => {
  assert.equal(sel('*.*', 'kern', 'debug').match, true);
  assert.equal(sel('mail.*', 'mail', 'debug').match, true);
  assert.equal(sel('mail.none', 'mail', 'emerg').match, false);
  assert.equal(sel('*.debug', 'daemon', 'debug').match, true);
});

test('a comma lists several facilities with one severity', () => {
  assert.equal(sel('uucp,news.crit', 'news', 'crit').match, true);
  assert.equal(sel('uucp,news.crit', 'news', 'err').match, false);
  assert.deepEqual(logic.parseSelector('uucp,news.crit;mail.none'), [{ facs: ['uucp', 'news'], sev: 'crit' }, { facs: ['mail'], sev: 'none' }]);
});

test('a severity takes itself and every more severe one, for every level', () => {
  for (const part of logic.SEVERITIES) for (const v of logic.SEVERITIES) {
    assert.equal(sel('*.' + part, 'user', v).match, sev(v) <= sev(part), `*.${part} vs ${v}`);
  }
});

test('the SPEC table: which rules take which message', () => {
  const table = [
    ['user', 'notice', [true, false, false, false, false], 2],
    ['authpriv', 'info', [false, true, false, false, false], 2],
    ['user', 'debug', [false, false, false, false, false], 1],
    ['user', 'emerg', [true, false, false, false, true], 3],
    ['cron', 'info', [false, false, false, true, false], 2],
    ['mail', 'err', [false, false, true, false, false], 2],
    ['kern', 'info', [true, false, false, false, false], 2],
    ['authpriv', 'emerg', [false, true, false, false, true], 3],
    ['user', 'alert', [true, false, false, false, false], 2]
  ];
  for (const [f, v, results, n] of table) {
    const s = end({ facility: f, severity: v });
    assert.deepEqual(s.ruleResults, results, `${f}.${v}`);
    assert.equal(s.records.length, n, `${f}.${v} records`);
  }
});

test('a matching file rule appends one line to its file, and nothing else changes', () => {
  const before = at({ facility: 'cron', severity: 'info' }, 6);
  const after = at({ facility: 'cron', severity: 'info' }, 7);
  assert.deepEqual(after.event.changed, ['file:/var/log/cron']);
  assert.equal(after.files['/var/log/cron'].length, before.files['/var/log/cron'].length + 1);
  assert.deepEqual(at({ facility: 'cron', severity: 'info' }, 4).event.changed, [], 'rule 1 does not match: nothing changes');
});

// ── rule 6: numbers ──

test('severity and facility numbers, and PRI = facility × 8 + severity', () => {
  assert.deepEqual(logic.SEVERITIES, ['emerg', 'alert', 'crit', 'err', 'warning', 'notice', 'info', 'debug']);
  assert.deepEqual(logic.FACILITIES, { kern: 0, user: 1, mail: 2, daemon: 3, cron: 9, authpriv: 10 });
  assert.equal(logic.pri('user', sev('notice')), 13);
  assert.equal(logic.pri('authpriv', sev('info')), 86);
  assert.equal(logic.pri('cron', sev('info')), 78);
  assert.equal(logic.pri('user', sev('emerg')), 8);
  assert.equal(logic.pri('user', sev('debug')), 15);
  assert.equal(logic.pri('kern', sev('info')), 6);
});

test('the book entry: user.notice is PRIORITY=5, SYSLOG_FACILITY=1; sshd-session is facility 10', () => {
  assert.equal(at({}, 2).journal[0].PRIORITY, 5);
  assert.equal(at({}, 2).journal[0].SYSLOG_FACILITY, 1);
  assert.equal(at({ facility: 'authpriv', severity: 'info' }, 2).journal[0].SYSLOG_FACILITY, 10);
});

// ── rule 7: remote ──

test('steps: 9, and 11 with forwarding', () => {
  assert.equal(logic.steps(P({})), 9);
  assert.equal(logic.steps(P({ remote: true })), 11);
  assert.equal(logic.rulesOf(P({ remote: true }))[0].selector, '*.*', 'the included file is read before rsyslog.conf\'s rules');
  assert.equal(logic.rulesOf(P({ remote: true }))[0].file, '/etc/rsyslog.d/90-slanje.conf');
  assert.equal(at({}, 9).at, 'done');
  assert.equal(at({ remote: true }, 4).at, 0);
  assert.equal(at({ remote: true }, 9).at, 5);
  assert.equal(at({ remote: true }, 10).at, 'server');
  assert.equal(at({ remote: true }, 11).at, 'done');
});

test('server up: the line goes over the wire, then into the server file with the client host name', () => {
  const fwd = at({ remote: true }, 4);
  assert.equal(fwd.ruleResults[0], true);
  assert.equal(fwd.remote.inFlight, true);
  assert.equal(fwd.remote.received.length, 2, 'not on the server yet while in flight');
  assert.equal(at({ remote: true }, 9).remote.received.length, 2, 'still in flight while the other rules are read');
  const srv = at({ remote: true }, 10);
  assert.equal(srv.remote.received.length, 3);
  assert.equal(srv.remote.received[2].text, 'democli1 klijent[9512]: treća poruka s klijenta');
  assert.deepEqual(where(end({ remote: true })), ['journal', '/var/log/messages', 'remote']);
  assert.equal(end({ remote: true }).records[2].status, 'yes');
});

test('server down: suspended and resumed in the client journal; the server has the two old lines; remote unknown', () => {
  const p = { remote: true, serverUp: false };
  const fwd = at(p, 4);
  assert.equal(fwd.remote.suspended, true);
  assert.deepEqual(fwd.journal.slice(1).map((e) => [e.time, e.MESSAGE]), [
    ['18:09:20', "action 'action-1-builtin:omfwd' suspended"], ['18:09:20', 'cannot connect to 192.168.122.57:514']]);
  const srv = at(p, 10);
  assert.equal(srv.remote.resumed, true);
  assert.equal(srv.remote.checked, '18:10:43');
  assert.equal(srv.journal[3].time, '18:09:58');
  assert.deepEqual(srv.remote.received.map((r) => r.time), ['18:08:39', '18:09:03']);
  const e = end(p);
  assert.deepEqual(e.records.map((r) => [r.where, r.status]), [['journal', 'yes'], ['/var/log/messages', 'yes'], ['remote', 'unknown']]);
  assert.equal(e.journal.length, 4);
  assert.equal(e.msg.text, 'poruka dok je poslužitelj ugašen');
});

test('the remote machine is the client: its own files still get the line', () => {
  const s = end({ remote: true, serverUp: false });
  assert.equal(s.host, 'democli1');
  assert.deepEqual(s.files['/var/log/messages'], ['democli1 klijent[9512]: poruka dok je poslužitelj ugašen']);
});

test('remote: *.* forwards every facility and severity, and the client keeps its own records', () => {
  for (const f of ['user', 'kern', 'daemon']) {   // authpriv.*, mail.* and cron.* would take debug locally too
    const s = end({ remote: true, facility: f, severity: 'debug', serverUp: false });
    assert.equal(s.ruleResults[0], true, f);
    assert.deepEqual(s.ruleResults.slice(1), [false, false, false, false, false], `${f}.debug: no local rule`);
    assert.deepEqual(s.records.map((r) => [r.where, r.status]), [['journal', 'yes'], ['remote', 'unknown']], f);
  }
  const a = end({ remote: true, facility: 'authpriv', severity: 'info' });
  assert.deepEqual(where(a), ['journal', '/var/log/secure', 'remote']);
  assert.equal(a.remote.received[2].text, 'democli1 sshd-session[57230]: Accepted publickey for student from 192.168.122.1');
});

// ── data from the book, verbatim ──

test('the rules, the forwarding line and the senders are the book\'s', () => {
  const conf = [
    '*.info;mail.none;authpriv.none;cron.none action(type="omfile" file="/var/log/messages")',
    'authpriv.* action(type="omfile" file="/var/log/secure")',
    'mail.* action(type="omfile" file="/var/log/maillog" sync="on")',
    'cron.* action(type="omfile" file="/var/log/cron")',
    '*.emerg action(type="omusrmsg" users="*")'
  ];
  assert.deepEqual(logic.RULES.map((r) => r.selector + ' ' + r.action), conf);
  assert.deepEqual(logic.RULES.map((r) => r.target), ['/var/log/messages', '/var/log/secure', '/var/log/maillog', '/var/log/cron', '*']);
  assert.equal(logic.FORWARD.selector + ' ' + logic.FORWARD.action, '*.* action(type="omfwd" target="192.168.122.57" port="514" protocol="tcp")');
  assert.equal(logic.FORWARD.target, '192.168.122.57:514');
  assert.equal(logic.ident(logic.messageFor(P({}))), 'proba[57063]');
  assert.equal(logic.ident(logic.messageFor(P({ facility: 'authpriv' }))), 'sshd-session[57230]');
  assert.equal(logic.ident(logic.messageFor(P({ facility: 'cron' }))), 'CROND[55240]');
  assert.equal(logic.ident(logic.messageFor(P({ facility: 'daemon' }))), 'systemd[1]');
  assert.equal(logic.lineOf(logic.messageFor(P({ facility: 'kern' })), 'demosrv1'), 'demosrv1 kernel: virtio_net virtio0 enp1s0: renamed from eth0');
});

// ── senders ──

test('the sender follows the facility; logger gets a command, others do not', () => {
  assert.equal(logic.commandOf(logic.messageFor(P({})), P({})), "logger -t proba -p user.notice 'poruka iz 13. poglavlja'");
  assert.equal(logic.commandOf(logic.messageFor(P({ facility: 'mail', severity: 'err' })), P({})), "logger -t proba -p mail.err 'poruka iz 13. poglavlja'");
  const rp = P({ remote: true, serverUp: false });
  assert.equal(logic.commandOf(logic.messageFor(rp), rp), "logger -t klijent 'poruka dok je poslužitelj ugašen'");
  assert.equal(logic.commandOf(logic.messageFor(P({ facility: 'authpriv' })), P({})), null);
  assert.equal(logic.messageFor(P({ facility: 'cron' })).tag, 'CROND');
  assert.equal(logic.messageFor(P({ facility: 'daemon' })).pid, 1);
});

// ── presets ──

test('presets end where the SPEC says', () => {
  const ends = {
    'logger-notice': [{}, ['journal', '/var/log/messages']],
    authpriv: [{ facility: 'authpriv', severity: 'info' }, ['journal', '/var/log/secure']],
    'debug-journal-only': [{ severity: 'debug' }, ['journal']],
    emerg: [{ severity: 'emerg' }, ['journal', '/var/log/messages', 'terminals']],
    cron: [{ facility: 'cron', severity: 'info' }, ['journal', '/var/log/cron']],
    'remote-down': [{ remote: true, serverUp: false }, ['journal', '/var/log/messages', 'remote']]
  };
  for (const [id, [p, w]] of Object.entries(ends)) assert.deepEqual(where(end(p)), w, id);
  assert.equal(at({ facility: 'authpriv', severity: 'info' }, 4).ruleTerms[0], 2, 'authpriv.none decides line 1');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of [{}, { remote: true, serverUp: false }, { facility: 'kern', severity: 'emerg', remote: true }]) {
    for (let n = 0; n <= logic.steps(P(p)); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ facility: 'authpriv', severity: 'emerg', remote: true, serverUp: false });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ remote: true, serverUp: false });
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
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const presets = [...html.matchAll(/\{ id: '([\w-]+)', label: t\('\w+'\), params: \{([^}]*)\}/g)];
  assert.equal(presets.length, 6, 'six presets');
  for (const m of presets) {
    const keys = [...m[2].matchAll(/(\w+):/g)].map((k) => k[1]);
    for (const k of keys) assert.ok(k in logic.defaults, `preset ${m[1]}: param ${k} is a model param`);
  }
});
