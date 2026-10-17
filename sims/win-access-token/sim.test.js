// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-access-token's model (rules: SPEC.md). Run: node --test sims/win-access-token/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const end = (p) => kit.stateAt(logic, p, logic.steps(p));
const at = (p, n) => kit.stateAt(logic, p, n);
/** The run as event kinds, with where and ✓/✕ on access attempts. */
const path = (s) => s.log.map((e) => e.kind + (e.where ? ':' + e.where : '') + ('ok' in e ? (e.ok ? '✓' : '✕') : ''));
const attempts = (s) => s.log.filter((e) => e.kind === 'attempt');
/** The step after which the event of this kind (the k-th one) has happened. */
const stepOf = (p, kind, k = 0) => end(p).log.filter((e) => e.kind === kind)[k].n;
const H = 3600, M = 60;
const ALL = [];
for (const change of logic.CHANGES) for (const changeOn of logic.CHANGE_ON) for (const action of logic.ACTIONS)
  for (const smbOpen of [false, true]) ALL.push(P({ change, changeOn, action, smbOpen }));

// ── tie-breaks first ──

test('T1 (rule 8): at the same time a logon comes before an access attempt, and a ticket before the attempt', () => {
  const ev = logic.sortEvents([
    { at: 100, kind: 'attempt', where: 'fs1' }, { at: 100, kind: 'ticket' }, { at: 100, kind: 'logon' },
    { at: 100, kind: 'logoff' }, { at: 100, kind: 'repl' }, { at: 100, kind: 'change' }, { at: 99, kind: 'attempt', where: 'local' }
  ]);
  assert.deepEqual(ev.map((e) => e.kind), ['attempt', 'change', 'repl', 'logoff', 'logon', 'ticket', 'attempt']);
  assert.deepEqual(logic.ORDER, ['change', 'repl', 'logoff', 'logon', 'tgt', 'ticket', 'attempt']);
  // in a run: the 10:11 ticket and the 10:11 attempt; the attempt uses the new ticket
  const s = end(P());
  const tk = s.log.find((e) => e.kind === 'ticket'), a = attempts(s).at(-1);
  assert.equal(tk.at, a.at);
  assert.ok(tk.n < a.n);
  assert.equal(s.attempt.since, tk.at);
  assert.equal(s.attempt.ok, true);
});

test('T1: an attempt listed before a logon at the same second still runs after it, with the new token', () => {
  const p = P();
  const shuffled = logic.plan(p).slice().reverse();
  assert.deepEqual(logic.sortEvents(shuffled).map((e) => e.kind + e.at), logic.plan(p).map((e) => e.kind + e.at));
});

test('T2 (rule 6): the other DC has the change from 15 s after it, not 14', () => {
  const c = { at: 10 * H, dc: 'DC2' };
  assert.equal(logic.reached(c, 'DC2', 10 * H), true, 'the originating DC at once');
  assert.equal(logic.reached(c, 'DC1', 10 * H + 14), false);
  assert.equal(logic.reached(c, 'DC1', 10 * H + 15), true);
  assert.equal(logic.REPL_DELAY, 15);
});

test('T3 (rule 5): an open SMB session wins over new tickets', () => {
  const s = end(P({ action: 'renew', smbOpen: true }));
  assert.deepEqual(path(s), ['change', 'attempt:fs1✕', 'tgt', 'attempt:fs1✕', 'attempt:local✕']);
  assert.equal(s.attempt.where, 'local');
  const fs = attempts(s)[1];
  assert.equal(fs.via, 'session');
  assert.deepEqual(s.session.tgt.groups, ['Domain Users', 'Prodaja'], 'the TGT has the group');
  assert.ok(!s.log.some((e) => e.kind === 'ticket'), 'no service ticket is asked for while the session is open');
  assert.equal(end(P({ action: 'renew' })).log.filter((e) => e.kind === 'attempt')[1].ok, true, 'without the session: new ticket, access');
});

test('T4 (rule 4): a service ticket never outlives its TGT', () => {
  const s0 = logic.initial(P());
  assert.equal(s0.session.tgt.expiresAt, 18 * H);
  assert.equal(s0.session.serviceTickets[0].issuedAt, 8 * H + 5 * M);
  assert.equal(s0.session.serviceTickets[0].expiresAt, 18 * H, '08:05 + 600 min = 18:05, capped at 18:00');
  const m = logic.baseMembers('add');
  const st = logic.serviceTicket({ groups: ['Domain Users'], expiresAt: 20 * H + 10 * M, dc: 'DC1' }, 'FS1', 10 * H + 11 * M, m);
  assert.equal(st.expiresAt, 20 * H + 10 * M);
  const st2 = logic.serviceTicket({ groups: ['Domain Users'], expiresAt: 30 * H, dc: 'DC1' }, 'FS1', 10 * H, m);
  assert.equal(st2.expiresAt, 20 * H, '600 min when the TGT lives longer');
});

// ── rules ──

test('rule 1: the token has the user SID, every group with nesting expanded, and the well-known SIDs', () => {
  const m = logic.baseMembers('remove');
  assert.deepEqual(logic.expand(m, 'ana'), ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify']);
  assert.deepEqual(logic.expand(logic.baseMembers('add'), 'ana'), ['Domain Users']);
  assert.deepEqual(logic.expand(m, 'Prodaja'), ['DL_FS1_Prodaja_Modify']);
  assert.deepEqual(logic.tokenSids(['Domain Users', 'Prodaja'], 'local'),
    ['S-1-5-21-…-1104', 'S-1-5-21-…-513', 'S-1-5-21-…-1201', 'S-1-1-0', 'S-1-5-11', 'S-1-5-4']);
  assert.equal(logic.tokenSids([], 'fs1').at(-1), 'S-1-5-2', 'NETWORK on the server');
  const s = at(P(), stepOf(P(), 'logon'));
  assert.deepEqual(s.session.tokenGroups, ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify']);
  assert.equal(s.session.logonAt, 10 * H + 10 * M);
});

test('rule 3: the TGT carries the global groups; the DC adds the domain local ones to each service ticket', () => {
  const m = logic.baseMembers('remove');
  assert.deepEqual(logic.tgtGroups(m, 'ana'), ['Domain Users', 'Prodaja']);
  assert.deepEqual(logic.withDomainLocal(m, ['Domain Users', 'Prodaja']), ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify']);
  assert.deepEqual(logic.withDomainLocal(m, ['Domain Users']), ['Domain Users'], 'no Prodaja in the TGT: no DL group');
  assert.deepEqual(logic.withDomainLocal({ DL_FS1_Prodaja_Modify: ['ana'] }, ['Domain Users']), ['Domain Users', 'DL_FS1_Prodaja_Modify'], 'a direct member');
  const s = end(P());
  assert.deepEqual(s.session.tgt.groups, ['Domain Users', 'Prodaja']);
  assert.deepEqual(s.session.serviceTickets[0].groups, ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify']);
  assert.deepEqual(logic.DOMAIN_LOCAL, ['DL_FS1_Prodaja_Modify']);
});

test('rule 2: the token does not change during the session, whatever AD does', () => {
  for (const p of ALL) {
    const s = end(p);
    let token = logic.initial(p).session.tokenGroups, logonAt = 8 * H;
    for (let n = 1; n <= logic.steps(p); n++) {
      const x = at(p, n), e = x.log.at(-1);
      if (e.kind === 'logon') { token = x.session.tokenGroups; logonAt = x.session.logonAt; continue; }
      if (!x.session) continue;
      assert.deepEqual(x.session.tokenGroups, token, JSON.stringify(p) + ' step ' + n);
      assert.equal(x.session.logonAt, logonAt);
    }
    assert.ok(s);
  }
  const c = at(P(), 1);
  assert.deepEqual(c.ad.members.Prodaja, ['ana'], 'AD has the change');
  assert.deepEqual(c.session.tokenGroups, ['Domain Users'], 'the token does not');
});

test('rule 3: FS1 builds its token from the service ticket; it does not ask AD', () => {
  const s = at(P(), 2);
  assert.deepEqual(path(s), ['change', 'attempt:fs1✕']);
  assert.equal(s.attempt.via, 'ticket');
  assert.equal(s.attempt.since, 8 * H + 5 * M, 'the morning ticket');
  assert.deepEqual(s.attempt.groups, ['Domain Users']);
  assert.deepEqual(s.ad.members.Prodaja, ['ana'], 'while AD already says yes');
  assert.deepEqual(s.attempt.hits, [false, false]);
  assert.equal(s.attempt.row, -1, 'no entry matches: denied');
  const ok = end(P());
  assert.deepEqual([ok.attempt.ok, ok.attempt.row, ok.attempt.hits], [true, 1, [false, true]], 'DL_FS1_Prodaja_Modify decides');
});

test('rule 4: new tickets bring the new groups to FS1; the local token stays (renew-tickets)', () => {
  const p = P({ action: 'renew' });
  const s = end(p);
  assert.deepEqual(path(s), ['change', 'attempt:fs1✕', 'tgt', 'ticket', 'attempt:fs1✓', 'attempt:local✕']);
  assert.equal(s.log[2].reason, 'renew');
  assert.equal(s.session.tgt.expiresAt, 20 * H + 10 * M);
  assert.deepEqual(s.session.tgt.groups, ['Domain Users', 'Prodaja']);
  assert.deepEqual(s.session.tokenGroups, ['Domain Users'], 'the logon token from 08:00');
  assert.equal(s.session.logonAt, 8 * H);
  assert.equal(at(p, 3).session.serviceTickets.length, 0, 'the old tickets are discarded');
  assert.deepEqual([s.attempt.where, s.attempt.via, s.attempt.row], ['local', 'token', -1]);
  assert.equal(s.attempt.at, 10 * H + 12 * M);
});

test('rule 4: with nothing done, the automatic renewal copies the groups, so access outlasts 18:00 (remove-still-works)', () => {
  const p = P({ change: 'remove', action: 'none' });
  const s = end(p);
  assert.deepEqual(path(s), ['change', 'attempt:fs1✓', 'tgt', 'ticket', 'attempt:fs1✓']);
  assert.deepEqual(s.log.map((e) => logic.clock(e.at)), ['13:00', '13:05', '17:45', '18:05', '18:05']);
  assert.equal(s.log[2].reason, 'renewal');
  assert.deepEqual(s.session.tgt.groups, ['Domain Users', 'Prodaja'], 'copied, not read from AD');
  assert.equal(s.session.tgt.expiresAt, 27 * H + 45 * M, '17:45 + 10 h');
  assert.equal(logic.clock(s.session.tgt.expiresAt), '03:45');
  assert.equal(at(p, 3).session.serviceTickets.length, 1, 'a renewal keeps the service ticket');
  assert.equal(at(p, 3).session.serviceTickets[0].expiresAt, 18 * H, 'which still ends with the old TGT');
  assert.deepEqual(s.session.serviceTickets[0].groups, ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify']);
  assert.deepEqual(s.session.tokenGroups, ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify'], 'the local token still has it');
  assert.equal(end(P({ action: 'none' })).attempt.ok, false, 'an added user waits just as long');
  const r = logic.renewTgt({ groups: ['x'], expiresAt: 0, dc: 'DC1' }, 8 * H + 7 * 24 * H - M, 8 * H);
  assert.equal(r.expiresAt, 8 * H + logic.RENEW_MAX, 'never past logon + 7 days');
  assert.equal(logic.RENEW_BEFORE, 15 * M);
});

test('rule 5: an open session keeps its token until logoff or until its ticket expires', () => {
  const p = P({ change: 'remove', action: 'none', smbOpen: true });
  const s0 = logic.initial(p);
  assert.deepEqual(s0.fs1.sessions, [{ user: 'ana', groups: ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify'], since: 8 * H + 5 * M, expiresAt: 18 * H }]);
  assert.equal(at(p, 2).attempt.via, 'session');
  const s = end(p);
  assert.equal(s.attempt.via, 'reauth', 'its ticket ended at 18:00: at 18:05 it is authenticated again with the new ticket');
  assert.deepEqual(s.fs1.sessions.map((x) => [x.since, x.expiresAt]), [[18 * H + 5 * M, 27 * H + 45 * M]]);
  assert.equal(s.attempt.ok, true);
  const r = P({ smbOpen: true });
  assert.equal(at(r, stepOf(r, 'logoff')).fs1.sessions.length, 0, 'logoff closes it');
  assert.deepEqual(end(r).fs1.sessions.map((x) => [x.since, x.groups]), [[10 * H + 11 * M, ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify']]],
    'after the relogon the access opens a new session, which stays open');
  assert.equal(logic.initial(P()).fs1.sessions.length, 0, 'without smbOpen there is none');
  assert.equal(at(P(), 2).fs1.sessions.length, 0, 'and an access does not leave one open');
});

test('rule 6: a logon uses what DC1 has; a change on DC2 reaches it after replication (replication-lag)', () => {
  const p = P({ changeOn: 'DC2' });
  const s = end(p);
  assert.deepEqual(path(s), ['change', 'logoff', 'logon', 'repl', 'logoff', 'logon', 'ticket', 'attempt:fs1✓']);
  assert.deepEqual(s.log.map((e) => logic.clock(e.at)), ['10:00', '10:00:05', '10:00:05', '10:00:15', '10:00:20', '10:00:20', '10:01', '10:01']);
  const early = at(p, 3);
  assert.deepEqual(early.session.tokenGroups, ['Domain Users'], '10:00:05: DC1 does not know yet');
  assert.deepEqual(early.ad.dcs.map((d) => d.replicatedUpTo), [0, 1]);
  assert.deepEqual(logic.membersAt(early.ad, 'DC2').Prodaja, ['ana']);
  assert.deepEqual(logic.membersAt(early.ad, 'DC1').Prodaja, []);
  assert.deepEqual(at(p, 4).ad.dcs.map((d) => d.replicatedUpTo), [1, 1]);
  assert.deepEqual(at(p, 6).session.tokenGroups, ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify']);
  assert.deepEqual(s.log[3], { kind: 'repl', at: 10 * H + 15, from: 'DC2', to: 'DC1', n: 4 });
  // new tickets before replication carry what DC1 has, not the newest membership
  const r = P({ changeOn: 'DC2', action: 'renew' });
  assert.deepEqual(path(end(r)), ['change', 'tgt', 'repl', 'tgt', 'ticket', 'attempt:fs1✓', 'attempt:local✕']);
  assert.deepEqual(at(r, 2).session.tgt.groups, ['Domain Users'], '10:00:05: DC1 does not know yet');
  assert.deepEqual(at(r, 4).session.tgt.groups, ['Domain Users', 'Prodaja']);
  // a change on DC1 reaches DC2 without a step of its own
  const q = at(P(), 2);
  assert.deepEqual(q.ad.dcs.map((d) => d.replicatedUpTo), [1, 1]);
  assert.deepEqual(at(P(), 1).ad.dcs.map((d) => d.replicatedUpTo), [1, 0]);
});

test('rule 7: removal works the same way: access stays until the token and tickets are renewed', () => {
  const p = P({ change: 'remove' });
  const s = end(p);
  assert.deepEqual(path(s), ['change', 'attempt:fs1✓', 'logoff', 'logon', 'ticket', 'attempt:fs1✕']);
  assert.deepEqual(s.log.map((e) => logic.clock(e.at)), ['13:00', '13:05', '13:10', '13:10', '13:11', '13:11']);
  assert.deepEqual(at(p, 2).attempt.groups, ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify']);
  assert.deepEqual(s.session.tokenGroups, ['Domain Users']);
  const rr = end(P({ change: 'remove', action: 'renew' }));
  assert.deepEqual(path(rr), ['change', 'attempt:fs1✓', 'tgt', 'ticket', 'attempt:fs1✕', 'attempt:local✓'], 'locally it still works after new tickets');
});

test('the change: on the DC chosen, at 10:00 (add) or 13:00 (remove), ana and Prodaja', () => {
  const a = at(P({ changeOn: 'DC2' }), 1);
  assert.deepEqual(a.ad.changes, [{ at: 10 * H, dc: 'DC2', op: 'add', principal: 'ana', group: 'Prodaja' }]);
  assert.deepEqual(a.ad.members.Prodaja, ['ana']);
  const r = at(P({ change: 'remove' }), 1);
  assert.deepEqual([r.ad.changes[0].at, r.ad.changes[0].op, r.ad.members.Prodaja], [13 * H, 'remove', []]);
  assert.deepEqual(logic.applyChange({ Prodaja: ['ana'] }, { op: 'add', principal: 'ana', group: 'Prodaja' }), { Prodaja: ['ana'] }, 'adding twice keeps one');
  assert.deepEqual(r.ad.members.DL_FS1_Prodaja_Modify, ['Prodaja'], 'the nesting is not touched');
});

test('the access check: first entry whose SID is in the token decides; none: denied', () => {
  const acl = logic.ACL.fs1;
  assert.deepEqual(logic.check(acl, ['Domain Users'], 'fs1'), { ok: false, row: -1, hits: [false, false] });
  assert.deepEqual(logic.check(acl, ['Domain Users', 'Prodaja'], 'fs1'), { ok: false, row: -1, hits: [false, false] }, 'Prodaja alone: the ACL names only the DL group');
  assert.deepEqual(logic.check(acl, ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify'], 'fs1'), { ok: true, row: 1, hits: [false, true] });
  assert.deepEqual(logic.check(logic.ACL.local, ['Domain Users', 'Prodaja'], 'local'), { ok: true, row: 1, hits: [false, true] });
});

test('nested: after the relogon the token shows both SIDs; the ACL names only the DL group', () => {
  const s = end(P());
  assert.ok(s.session.tokenGroups.includes('Prodaja') && s.session.tokenGroups.includes('DL_FS1_Prodaja_Modify'));
  assert.ok(!logic.ACL.fs1.some((x) => x.who === 'Prodaja'));
  assert.equal(logic.ACL.fs1[s.attempt.row].who, 'DL_FS1_Prodaja_Modify');
});

test('diff: groups the token has and AD has not, and the other way', () => {
  assert.deepEqual(logic.diff(['Domain Users'], ['Domain Users', 'Prodaja']), { extra: [], missing: ['Prodaja'] });
  assert.deepEqual(logic.diff(['Domain Users', 'Prodaja'], ['Domain Users']), { extra: ['Prodaja'], missing: [] });
});

test('clock: minutes, seconds only when there are any', () => {
  assert.equal(logic.clock(8 * H + 5 * M), '08:05');
  assert.equal(logic.clock(10 * H + 15), '10:00:15');
  assert.equal(logic.clock(18 * H), '18:00');
});

test('presets: add-then-relog 6, nested from step 2 (4 left), remove-still-works 5, renew-tickets 6, replication-lag 8; at most 8', () => {
  assert.equal(logic.steps(P()), 6);
  assert.equal(logic.steps(P({ change: 'remove', action: 'none' })), 5);
  assert.equal(logic.steps(P({ action: 'renew' })), 6);
  assert.equal(logic.steps(P({ changeOn: 'DC2' })), 8);
  let max = 0;
  for (const p of ALL) {
    const n = logic.steps(p);
    max = Math.max(max, n);
    assert.ok(n >= 4, JSON.stringify(p));
    assert.equal(end(p).log.length, n);
  }
  assert.equal(max, 8);
  assert.equal(logic.steps(logic.defaults), 6);
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
  for (const p of [P(), P({ changeOn: 'DC2' }), P({ change: 'remove', action: 'none', smbOpen: true })]) {
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
  const pairs = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):\s*'?(\w+)'?/g)].map((k) => [k[1], k[2]]));
  assert.ok(pairs.length > 0, 'found preset params');
  for (const [k, v] of pairs) {
    assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    if (k === 'change') assert.ok(logic.CHANGES.includes(v), `change ${v}`);
    if (k === 'changeOn') assert.ok(logic.CHANGE_ON.includes(v), `changeOn ${v}`);
    if (k === 'action') assert.ok(logic.ACTIONS.includes(v), `action ${v}`);
  }
  const sim = JSON.parse(fs.readFileSync(path_.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
});
