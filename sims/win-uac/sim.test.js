// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-uac: the rules of SPEC.md (tie-break first), the presets' expected results, then the template's generic
// block. Run: node --test sims/win-uac/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const final = (over) => at(over, logic.steps(P(over)));
const kinds = (over) => logic.plan(P(over)).map((e) => e.kind);

const ALL = [];
for (const account of logic.ACCOUNT_KINDS) {
  for (const uac of [true, false]) {
    for (const task of logic.TASK_KEYS) {
      for (const children of [false, true]) ALL.push(P({ account, uac, task, children }));
    }
  }
}

/** A task with a DACL of its own, for the tie-break. */
const custom = (dacl, need = 'w') => ({ kind: 'file', need, il: 'M', dacl });

// ── tie-break T1 first: when a deny and an allow both match, the order of the DACL decides ──

test('T1: deny before allow → denied; allow before deny → allowed (full token)', () => {
  const full = logic.fullToken('ana');
  const denyFirst = logic.check(full, custom([
    { who: 'Administrators', type: 'deny', rights: ['w'] }, { who: 'Users', type: 'allow', rights: ['r', 'w'] }]));
  assert.equal(denyFirst.ok, false);
  assert.equal(denyFirst.row, 0);
  assert.deepEqual(denyFirst.rows, ['decides', 'skip']);
  const allowFirst = logic.check(full, custom([
    { who: 'Users', type: 'allow', rights: ['r', 'w'] }, { who: 'Administrators', type: 'deny', rights: ['w'] }]));
  assert.equal(allowFirst.ok, true);
  assert.equal(allowFirst.row, 0);
});

test('T1: a deny-only SID still matches a deny ACE (and decides before a later allow)', () => {
  const filtered = logic.filterToken(logic.fullToken('ana'));
  const r = logic.check(filtered, custom([
    { who: 'Administrators', type: 'deny', rights: ['w'] }, { who: 'Users', type: 'allow', rights: ['r', 'w'] }]));
  assert.equal(r.ok, false);
  assert.equal(r.row, 0);
  assert.equal(r.rows[0], 'decides');
  // the same token: the deny ACE after the allow is never reached
  const r2 = logic.check(filtered, custom([
    { who: 'Users', type: 'allow', rights: ['r', 'w'] }, { who: 'Administrators', type: 'deny', rights: ['w'] }]));
  assert.equal(r2.ok, true);
});

// ── rule 1: two linked tokens; the desktop runs with the filtered one ──

test('rule 1: UAC on, an administrator gets two linked tokens; Explorer runs with the filtered one', () => {
  const t = logic.logonTokens('ana', true);
  assert.equal(t.filtered.kind, 'filtered');
  assert.equal(t.full.kind, 'full');
  assert.ok(t.filtered.linked && t.full.linked);
  const s = at({}, 2);
  assert.equal(s.procs[0].image, 'explorer.exe');
  assert.equal(s.procs[0].token, 'filtered');
  assert.equal(s.procs[0].il, 'M');
});

test('rule 1: a standard user gets one token; UAC off gives an administrator one full token', () => {
  const std = logic.logonTokens('marko', true);
  assert.equal(std.full, null);
  assert.equal(std.filtered.kind, 'standard');
  assert.equal(logic.attrOf(std.filtered, 'Administrators'), null);
  const off = logic.logonTokens('ana', false);
  assert.equal(off.filtered, null);
  assert.equal(off.full.kind, 'full');
  assert.equal(off.full.linked, false);
  assert.equal(at({ uac: false }, 2).procs[0].token, 'full');
});

// ── rule 2: the filtered token ──

test('rule 2: filtered token: Administrators deny-only, five privileges, Medium; full: enabled, all, High', () => {
  const t = logic.logonTokens('ana', true);
  assert.equal(logic.attrOf(t.filtered, 'Administrators'), 'denyOnly');
  assert.equal(logic.attrOf(t.full, 'Administrators'), 'enabled');
  assert.equal(logic.attrOf(t.filtered, 'Users'), 'enabled');
  assert.deepEqual(t.filtered.privs.slice().sort(), logic.LIMITED_PRIVS.slice().sort());
  assert.equal(t.full.privs.length, logic.ADMIN_PRIVS.length);
  assert.ok(!t.filtered.privs.includes('SeSystemtimePrivilege'));
  assert.ok(t.filtered.privs.includes('SeTimeZonePrivilege'));
  assert.equal(t.filtered.il, 'M');
  assert.equal(t.full.il, 'H');
  // the same user SID and the same groups in both: only the attributes differ
  assert.deepEqual(t.filtered.sids.map((x) => x.sid), t.full.sids.map((x) => x.sid));
});

test('rule 2: a standard user has the same five privileges at Medium', () => {
  const m = logic.fullToken('marko');
  assert.deepEqual(m.privs, logic.LIMITED_PRIVS);
  assert.equal(m.il, 'M');
});

// ── rule 3: the access check ──

test('rule 3: an allow ACE does not count for a deny-only SID', () => {
  const t = logic.logonTokens('ana', true);
  const r = logic.check(t.filtered, 'progfiles');
  assert.equal(r.ok, false);
  assert.equal(r.by, 'dacl');
  assert.equal(r.row, -1);
  assert.deepEqual(r.rows, ['absent', 'denyOnly', 'noRight']);
  const f = logic.check(t.full, 'progfiles');
  assert.equal(f.ok, true);
  assert.equal(f.row, 1);
  assert.deepEqual(f.rows, ['absent', 'decides', 'skip']);
});

test('rule 3: a matching ACE that does not cover the right is skipped (service: INTERACTIVE may query only)', () => {
  const t = logic.logonTokens('ana', true);
  const r = logic.check(t.filtered, 'service');
  assert.deepEqual(r.rows, ['absent', 'denyOnly', 'noRight']);
  assert.equal(r.ok, false);
  assert.equal(logic.check(t.full, 'service').ok, true);
});

test('rule 3: privileges gate the time zone; the system time needs one the filtered token lacks', () => {
  const t = logic.logonTokens('ana', true);
  const r = logic.check(t.filtered, 'timezone');
  assert.equal(r.ok, true);
  assert.equal(r.by, 'priv');
  const systime = { kind: 'priv', need: 'SeSystemtimePrivilege' };
  assert.equal(logic.check(t.filtered, systime).ok, false);
  assert.equal(logic.check(t.full, systime).ok, true);
});

test('rule 3: integrity is checked first: a Medium process cannot write a High object, a High one can', () => {
  const t = logic.logonTokens('ana', true);
  const high = { kind: 'file', need: 'w', il: 'H', dacl: [{ who: 'Users', type: 'allow', rights: ['r', 'w'] }] };
  const r = logic.check(t.filtered, high);
  assert.equal(r.ok, false);
  assert.equal(r.by, 'mic');
  assert.equal(logic.check(t.full, high).ok, true);
  // reading up is allowed
  assert.equal(logic.integrityOk('M', 'H', 'r'), true);
  // the four tasks' objects are Medium: integrity never decides them
  for (const k of ['progfiles', 'hklm', 'service']) assert.equal(logic.check(t.filtered, k).il.ok, true);
});

test('rule 3: no matching entry → implicit deny', () => {
  const r = logic.check(logic.fullToken('marko'), custom([{ who: 'SYSTEM', type: 'allow', rights: ['w'] }]));
  assert.equal(r.ok, false);
  assert.equal(r.row, -1);
  assert.deepEqual(r.rows, ['absent']);
});

// ── rule 4: elevation ──

test('rule 4: an administrator gets a consent prompt and a new process with her full token', () => {
  assert.deepEqual(kinds({}), ['logon', 'explorer', 'attempt', 'prompt', 'approve', 'attempt']);
  assert.equal(at({}, 4).prompt, 'consent');
  const s = at({}, 5);
  assert.equal(s.prompt, null);
  const cmd = s.procs.find((x) => x.id === 'cmd');
  assert.equal(cmd.user, 'ana');
  assert.equal(cmd.token, 'full');
  assert.equal(cmd.il, 'H');
});

test('rule 4: a standard user gets a credential prompt; the process runs as admin-it, not marko', () => {
  assert.equal(at({ account: 'standard' }, 4).prompt, 'credentials');
  const s = at({ account: 'standard' }, 5);
  const cmd = s.procs.find((x) => x.id === 'cmd');
  assert.equal(cmd.user, 'admin-it');
  assert.equal(s.tokens.full.user, 'admin-it');
  assert.equal(s.tokens.filtered.user, 'marko');
  assert.equal(s.procs.find((x) => x.id === 'explorer').user, 'marko');
});

test('rule 4: no elevation when the first attempt is allowed', () => {
  assert.deepEqual(kinds({ task: 'timezone' }), ['logon', 'explorer', 'attempt']);
});

// ── rule 5: inheritance ──

test('rule 5: a child gets its parent\'s token; elevation does not change Explorer', () => {
  const s = final({ children: true });
  const by = (id) => s.procs.find((x) => x.id === id);
  assert.equal(by('notepad-cmd').token, 'full');
  assert.equal(by('notepad-cmd').il, 'H');
  assert.equal(by('notepad-explorer').token, 'filtered');
  assert.equal(by('notepad-explorer').il, 'M');
  assert.equal(by('explorer').token, 'filtered');
  // Explorer's token is the same before and after the elevation
  assert.deepEqual(at({}, 3).procs[0], s.procs[0]);
  // step 7 is the console's child, step 8 Explorer's
  const ev = logic.plan(P({ children: true }));
  assert.deepEqual(ev.slice(6).map((e) => [e.kind, e.parent]), [['spawn', 'cmd'], ['spawn', 'explorer']]);
});

test('rule 5: on the credential path the console\'s child runs as admin-it; cmd.exe\'s parent is Explorer', () => {
  const s = final({ account: 'standard', children: true });
  const by = (id) => s.procs.find((x) => x.id === id);
  assert.equal(by('cmd').parent, 'explorer');
  assert.equal(by('notepad-cmd').user, 'admin-it');
  assert.equal(by('notepad-cmd').parent, 'cmd');
  assert.equal(by('notepad-explorer').user, 'marko');
});

// ── rule 6: the built-in Administrator ──

test('rule 6: the built-in Administrator (RID 500) is not in Admin Approval Mode: one full token, no prompt', () => {
  assert.equal(logic.inApprovalMode('Administrator', true), false);
  assert.equal(logic.inApprovalMode('ana', true), true);
  assert.equal(logic.ACCOUNTS.Administrator.sid.endsWith('-500'), true);
  const s = final({ account: 'builtin-admin' });
  assert.equal(s.tokens.filtered, null);
  assert.equal(s.procs[0].token, 'full');
  assert.equal(s.attempts[0].ok, true);
  assert.equal(s.attempts[0].row, 1);
  assert.equal(logic.promptKind('Administrator', true), null);
  assert.equal(logic.steps(P({ account: 'builtin-admin' })), 3);
});

// ── rule 7: network logon ──

test('rule 7: a local administrator over the network gets the filtered token; a domain one the full', () => {
  assert.equal(logic.networkToken({ admin: true, uacOn: true, domain: false, tokenFilterPolicy: 0 }), 'filtered');
  assert.equal(logic.networkToken({ admin: true, uacOn: true, domain: true, tokenFilterPolicy: 0 }), 'full');
  assert.equal(logic.networkToken({ admin: true, uacOn: true, domain: false, tokenFilterPolicy: 1 }), 'full');
  assert.equal(logic.networkToken({ admin: false, uacOn: true }), 'standard');
  assert.equal(logic.networkToken({ admin: true, uacOn: false, domain: false, tokenFilterPolicy: 0 }), 'full');
  assert.equal(logic.networkToken({ admin: true, uacOn: true, domain: false, builtin: true, tokenFilterPolicy: 0 }), 'full');
  assert.equal(logic.fullToken('ana', 'network').sids.some((x) => x.name === 'NETWORK'), true);
});

// ── rule 8: UAC off ──

test('rule 8: with UAC off nothing elevates: an admin succeeds at once, a standard user stays denied', () => {
  assert.deepEqual(kinds({ uac: false }), ['logon', 'explorer', 'attempt']);
  assert.equal(final({ uac: false }).attempts[0].ok, true);
  const std = final({ account: 'standard', uac: false });
  assert.equal(std.attempts.length, 1);
  assert.equal(std.attempts[0].ok, false);
  assert.equal(logic.promptKind('marko', false), null);
  assert.equal(logic.promptKind('ana', false), null);
  assert.equal(logic.promptKind('ana', true), 'consent');
});

// ── the presets (SPEC.md "Expected results") ──

const PRESETS = {
  'admin-filtered': [{}, 6, [[false, -1], [true, 1]]],
  'time-zone': [{ task: 'timezone' }, 3, [[true, -1]]],
  'standard-user': [{ account: 'standard' }, 6, [[false, -1], [true, 1]]],
  'child-inherits': [{ children: true }, 8, [[false, -1], [true, 1]]],
  'uac-off': [{ uac: false, children: true }, 4, [[true, 1]]]
};

test('presets: step counts and access results as in SPEC.md', () => {
  for (const [id, [over, steps, results]] of Object.entries(PRESETS)) {
    assert.equal(logic.steps(P(over)), steps, id);
    const s = final(over);
    assert.deepEqual(s.attempts.map((a) => [a.ok, a.row]), results, id);
  }
  assert.equal(final({ uac: false, children: true }).procs.find((x) => x.id === 'notepad-explorer').il, 'H');
  assert.equal(final({ task: 'service' }).attempts.length, 2);
  assert.equal(final({ account: 'standard', task: 'timezone' }).attempts[0].ok, true);
  assert.equal(final({ task: 'hklm' }).attempts.map((a) => a.ok).join(), 'false,true');
});

test('an unknown task falls back to the default instead of throwing', () => {
  assert.equal(logic.steps(P({ task: 'bogus' })), 6);
});

test('every param set gives 3 to 8 steps', () => {
  for (const p of ALL) {
    const n = logic.steps(p);
    assert.ok(n >= 3 && n <= 8, JSON.stringify(p));
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of ALL) {
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of [P(), P({ account: 'standard', children: true }), P({ uac: false, children: true })]) {
    const steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const p of ALL) {
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
  const pairs = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):\s*'?([\w-]+)'?/g)].map((k) => [k[1], k[2]]));
  assert.ok(pairs.length > 0, 'found preset params');
  for (const [k, v] of pairs) {
    assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    if (k === 'account') assert.ok(logic.ACCOUNT_KINDS.includes(v), `account ${v}`);
    if (k === 'task') assert.ok(logic.TASK_KEYS.includes(v), `task ${v}`);
  }
  const ids = [...html.matchAll(/\{ id: '([\w-]+)'/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS), 'the page has the presets SPEC.md lists, in order');
  const sim = JSON.parse(fs.readFileSync(path_.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
});
