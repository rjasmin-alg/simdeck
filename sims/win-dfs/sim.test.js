// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dfs's model. Rules: SPEC.md. Run: node --test sims/win-dfs/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const stepsOf = (over) => logic.steps(P(over));
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, stepsOf(over));
const hm = (h, m) => h * 3600 + m * 60;
const kinds = (s) => s.msgs.map((m) => m.kind);
const srv = (s, id) => logic.server(s, id);
const cli = (s, id) => logic.client(s, id);
const R2 = { part: 'replication' };

// ── tie-breaks first ──

test('tie-break rule 2: equal cost → server name order (real order is random)', () => {
  const targets = [{ server: 'FS-ZG', site: 'ZG' }, { server: 'FS-OS', site: 'OS' }, { server: 'FS-RI', site: 'RI' }, { server: 'FS-ZG2', site: 'ZG' }, { server: 'FS-ST', site: 'ST' }];
  const costs = { 'ST|ZG': 100, 'OS|ZG': 100, 'RI|ZG': 50, 'OS|ST': 300, 'RI|ST': 200 };
  // own site (two targets, by name), then RI (50), then OS and ST at 100 by name
  assert.deepEqual(logic.orderTargets(targets, 'ZG', costs), ['FS-ZG', 'FS-ZG2', 'FS-RI', 'FS-OS', 'FS-ST']);
  // the input order does not matter
  assert.deepEqual(logic.orderTargets(targets.slice().reverse(), 'ZG', costs), ['FS-ZG', 'FS-ZG2', 'FS-RI', 'FS-OS', 'FS-ST']);
});

test('tie-break rule 7: equal save times → the version saved on the server whose name sorts first wins', () => {
  const v = { v1: { base: null }, a: { base: 'v1', mtime: 100, server: 'FS-ZG' }, b: { base: 'v1', mtime: 100, server: 'FS-ST' } };
  assert.equal(logic.compareVersions(v, 'a', 'b'), 'conflict-in');      // FS-ST's arrives at FS-ZG: it wins
  assert.equal(logic.compareVersions(v, 'b', 'a'), 'conflict-local');   // FS-ZG's arrives at FS-ST: FS-ST keeps its own
  // the same in a run: both save at 10:00
  const s = end(Object.assign({ secondEditDelay: 0 }, R2));
  assert.deepEqual(s.conflicts.map((c) => c.winner), ['marko']);
  assert.deepEqual(srv(s, 'FS-ZG').bin, ['ana']);
});

test('tie-break rule 5: a window at the same time as a user action runs first', () => {
  // Marko opens at 10:15, the window is at 10:15: Ana's change arrives first, so he opens her version
  const s = end(Object.assign({ secondEditDelay: 900, replicateAfter: 900 }, R2));
  const open = s.msgs.find((m) => m.kind === 'open' && m.from === 'CL-ST');
  assert.equal(open.t, hm(10, 15));
  assert.equal(open.version, 'ana');
  assert.ok(s.msgs.findIndex((m) => m.kind === 'repl') < s.msgs.indexOf(open));
  assert.equal(s.conflicts.length, 0);
  // and a save exactly on a window tick waits for the next window
  assert.equal(logic.nextWindow(hm(10, 15), hm(10, 0), 900), hm(10, 30));
  assert.equal(logic.nextWindow(hm(10, 0), hm(10, 0), 900), hm(10, 15));
});

test('tie-break rule 5: send order is by save time, then by sending server name', () => {
  const pend = [{ id: 'b', server: 'FS-ZG', mtime: 50 }, { id: 'a', server: 'FS-ST', mtime: 60 }, { id: 'c', server: 'FS-ST', mtime: 50 }];
  assert.deepEqual(logic.sendOrder(pend).map((x) => x.id), ['c', 'b', 'a']);
  // conflict preset: Ana's (10:00) goes before Marko's (10:02)
  const s = end(R2);
  assert.deepEqual(s.msgs.filter((m) => m.kind === 'repl').map((m) => m.from), ['FS-ZG', 'FS-ST']);
});

test('tie-break rule 5: a pending change that lost a conflict on its own server is not sent', () => {
  // both at 10:00: FS-ST sends first (name order); FS-ZG then holds Marko's, so Ana's pending change is dropped
  const s = end(Object.assign({ secondEditDelay: 0 }, R2));
  assert.deepEqual(s.msgs.filter((m) => m.kind === 'repl').map((m) => m.from), ['FS-ST']);
  assert.deepEqual(srv(s, 'FS-ZG').pending, []);
  assert.equal(stepsOf(Object.assign({ secondEditDelay: 0 }, R2)), 7);
});

// ── rule 1: referral, then connect to a target directly ──

test('rule 1: the client asks its own site\'s namespace server, gets a list, connects to the target directly', () => {
  const s = end({});
  assert.deepEqual(s.msgs.map((m) => [m.kind, m.from, m.to]), [
    ['refReq', 'CL-ZG', 'DC-ZG'], ['referral', 'DC-ZG', 'CL-ZG'], ['connect', 'CL-ZG', 'FS-ZG'],
    ['refReq', 'CL-ST', 'DC-ST'], ['referral', 'DC-ST', 'CL-ST'], ['connect', 'CL-ST', 'FS-ST']]);
  for (const m of s.msgs.filter((x) => x.kind === 'refReq' || x.kind === 'referral')) assert.equal(m.path, logic.PATH);
  // the namespace server never carries file traffic
  assert.ok(s.msgs.every((m) => m.kind !== 'connect' || m.to.startsWith('FS-')));
});

// ── rule 2: lowest cost order ──

test('rule 2: own site first, then the other site', () => {
  assert.deepEqual(logic.orderTargets(logic.TARGETS, 'ZG'), ['FS-ZG', 'FS-ST']);
  assert.deepEqual(logic.orderTargets(logic.TARGETS, 'ST'), ['FS-ST', 'FS-ZG']);
  assert.equal(logic.siteCost('ZG', 'ZG'), 0);
  assert.equal(logic.siteCost('ST', 'ZG'), 100);
  assert.equal(logic.siteCost('ZG', 'ST'), 100);
  const s = end({});
  assert.deepEqual(cli(s, 'CL-ZG').cache[0].targets, ['FS-ZG', 'FS-ST']);
  assert.deepEqual(cli(s, 'CL-ST').cache[0].targets, ['FS-ST', 'FS-ZG']);
});

test('rule 2: other sites by ascending cost, not by name', () => {
  const t = [{ server: 'A', site: 'X' }, { server: 'B', site: 'Y' }, { server: 'C', site: 'H' }];
  assert.deepEqual(logic.orderTargets(t, 'H', { 'H|X': 300, 'H|Y': 20 }), ['C', 'B', 'A']);
});

// ── rule 3: cached for the TTL ──

test('rule 3: the referral is cached for 1800 s and expires at expiresAt', () => {
  assert.equal(logic.TTL_FOLDER, 1800);
  assert.equal(logic.TTL_ROOT, 300);
  const s = end({});
  const e = cli(s, 'CL-ST').cache[0];
  assert.equal(e.ttl, 1800);
  assert.equal(e.expiresAt, hm(9, 30));
  assert.equal(logic.valid(e, hm(9, 29)), true);
  assert.equal(logic.valid(e, hm(9, 30)), false);
  assert.equal(logic.left(e, hm(9, 15)), 900);
  assert.equal(logic.left(e, hm(9, 45)), 0);
});

test('rule 3: during the TTL the client does not ask again; after it, it does', () => {
  const s = end({ fsStUp: false });
  const reqs = s.msgs.filter((m) => m.kind === 'refReq');
  assert.deepEqual(reqs.map((m) => m.t), [hm(9, 0), hm(9, 31)]);
  assert.equal(reqs[1].expired, true);
  assert.equal(cli(s, 'CL-ST').cache[0].expiresAt, hm(9, 31) + 1800);
});

test('rule 3: an open inside the TTL uses the cache (no request); an open at expiresAt asks again', () => {
  // no schedule opens a folder twice inside the TTL, so inject one into the finished referral run
  const p = P({});
  const base = end({});
  const inject = (t) => Object.assign(structuredClone(base), { phase: 'run', todo: [{ t, kind: 'open', client: 'CL-ZG' }] });
  const n = base.msgs.length + 1;
  const s = logic.step(inject(hm(9, 10)), n, p);
  const last = s.msgs[s.msgs.length - 1];
  assert.deepEqual([last.kind, last.to, last.how, last.ok], ['connect', 'FS-ZG', 'cached', true]);
  assert.equal(s.msgs.filter((m) => m.kind === 'refReq').length, 2);
  assert.equal(cli(s, 'CL-ZG').cache[0].expiresAt, hm(9, 30));
  // at 09:30 the entry has expired: a referral request, marked as after an expiry
  const e = logic.step(inject(hm(9, 30)), n, p);
  assert.deepEqual([e.msgs[n - 1].kind, e.msgs[n - 1].expired], ['refReq', true]);
});

// ── rule 4: failover, stickiness, failback ──

test('rule 4: a down target is tried, fails, and the client goes to the next one in its list', () => {
  const s = at({ fsStUp: false }, 4);
  const c = s.msgs.filter((m) => m.kind === 'connect');
  assert.deepEqual(c.map((m) => [m.to, m.ok, m.how]), [['FS-ST', false, 'first'], ['FS-ZG', true, 'next']]);
  assert.equal(c[1].wan, true);
  assert.equal(cli(s, 'CL-ST').connectedTo, 'FS-ZG');
  // the referral still listed the down target
  assert.deepEqual(s.msgs[1].targets, ['FS-ST', 'FS-ZG']);
});

test('rule 4: failback off → the client sticks to FS-ZG even after a new referral that lists FS-ST first', () => {
  const s = end({ fsStUp: false, failback: false });
  assert.equal(srv(s, 'FS-ST').up, true);
  const last = s.msgs[s.msgs.length - 1];
  assert.deepEqual([last.kind, last.to, last.how, last.ok], ['connect', 'FS-ZG', 'stick', true]);
  assert.deepEqual(cli(s, 'CL-ST').cache[0].targets, ['FS-ST', 'FS-ZG']);
  assert.equal(cli(s, 'CL-ST').connectedTo, 'FS-ZG');
});

test('rule 4: failback on → at the new referral the client goes back to FS-ST', () => {
  const s = end({ fsStUp: false, failback: true });
  const last = s.msgs[s.msgs.length - 1];
  assert.deepEqual([last.kind, last.to, last.how, last.ok], ['connect', 'FS-ST', 'failback', true]);
  assert.equal(cli(s, 'CL-ST').connectedTo, 'FS-ST');
  // failback waits for the referral to expire: at 09:10 (FS-ST back) the client is still on FS-ZG
  assert.equal(cli(at({ fsStUp: false, failback: true }, 5), 'CL-ST').connectedTo, 'FS-ZG');
});

// ── rule 5: windows and the link ──

test('rule 5: a change waits for the next window; windows are at 10:00 + k·replicateAfter', () => {
  const s = end(R2);
  const w = s.msgs.filter((m) => m.kind === 'window');
  assert.deepEqual(w.map((m) => m.t), [hm(10, 15)]);
  // before the window, Marko still opens v1 on FS-ST
  assert.equal(s.msgs.find((m) => m.kind === 'open' && m.from === 'CL-ST').version, 'v1');
  const fast = end(Object.assign({ replicateAfter: 60 }, R2));
  assert.deepEqual(fast.msgs.filter((m) => m.kind === 'window').map((m) => m.t), [hm(10, 1), hm(10, 3)]);
  assert.equal(fast.msgs.find((m) => m.kind === 'open' && m.from === 'CL-ST').version, 'ana');
});

test('rule 5: with the link down nothing travels; one blocked window per batch of saves', () => {
  const s = end(Object.assign({ linkUp: false }, R2));
  assert.deepEqual(kinds(s), ['save', 'open', 'save', 'window', 'open']);
  assert.equal(s.msgs[3].blocked, true);
  assert.equal(srv(s, 'FS-ZG').file, 'ana');
  assert.equal(srv(s, 'FS-ST').file, 'marko');
  assert.equal(srv(s, 'FS-ZG').pending.length + srv(s, 'FS-ST').pending.length, 2);
  const s20 = end(Object.assign({ linkUp: false, secondEditDelay: 1200 }, R2));
  assert.deepEqual(kinds(s20), ['save', 'window', 'open', 'save', 'window', 'open']);
  assert.deepEqual(s20.msgs.filter((m) => m.kind === 'window').map((m) => m.t), [hm(10, 15), hm(10, 30)]);
});

test('rule 5: a blocked window is strictly after the newest save of its batch; time never runs back', () => {
  const want = { 120: [hm(10, 1), hm(10, 3)], 1200: [hm(10, 1), hm(10, 21)] };
  for (const d of [120, 1200]) {
    const s = end(Object.assign({ linkUp: false, replicateAfter: 60, secondEditDelay: d }, R2));
    for (let i = 1; i < s.msgs.length; i++) assert.ok(s.msgs[i].t >= s.msgs[i - 1].t, `delay ${d}, message ${i + 1}`);
    assert.deepEqual(s.msgs.filter((m) => m.kind === 'window').map((m) => m.t), want[d]);
    assert.equal(s.msgs.length, 6);
  }
});

// ── rule 6: compare on arrival ──

test('rule 6: a version built on the local one replaces it; an older one changes nothing', () => {
  const v = { v1: { base: null }, ana: { base: 'v1', mtime: 1, server: 'FS-ZG' }, marko: { base: 'ana', mtime: 2, server: 'FS-ST' } };
  assert.equal(logic.compareVersions(v, 'v1', 'ana'), 'replace');
  assert.equal(logic.compareVersions(v, 'v1', 'marko'), 'replace');
  assert.equal(logic.compareVersions(v, 'ana', 'marko'), 'replace');
  assert.equal(logic.compareVersions(v, 'marko', 'ana'), 'older');
  assert.equal(logic.compareVersions(v, 'ana', 'ana'), 'same');
  assert.deepEqual(logic.ancestors(v, 'marko'), ['ana', 'v1']);
});

test('rule 6: two versions saved over the same v1 are a conflict on both servers', () => {
  const s = end(R2);
  const r = s.msgs.filter((m) => m.kind === 'repl');
  assert.deepEqual(r.map((m) => m.result), ['conflict-local', 'conflict-in']);
});

// ── rule 7: the later save wins; the loser goes to ConflictAndDeleted ──

test('rule 7: the later save wins, regardless of who sends first', () => {
  const v = { v1: { base: null }, ana: { base: 'v1', mtime: hm(10, 0), server: 'FS-ZG' }, marko: { base: 'v1', mtime: hm(10, 2), server: 'FS-ST' } };
  assert.equal(logic.compareVersions(v, 'ana', 'marko'), 'conflict-in');
  assert.equal(logic.compareVersions(v, 'marko', 'ana'), 'conflict-local');
  const later = { v1: { base: null }, ana: { base: 'v1', mtime: hm(10, 5), server: 'FS-ZG' }, marko: { base: 'v1', mtime: hm(10, 2), server: 'FS-ST' } };
  assert.equal(logic.compareVersions(later, 'ana', 'marko'), 'conflict-local');
});

test('rule 7: the losing copy is moved to ConflictAndDeleted on the server that held it, and logged', () => {
  const s = end(R2);
  assert.deepEqual(srv(s, 'FS-ZG').bin, ['ana']);
  assert.deepEqual(srv(s, 'FS-ST').bin, []);
  assert.equal(srv(s, 'FS-ZG').file, 'marko');
  assert.equal(srv(s, 'FS-ST').file, 'marko');
  assert.deepEqual(s.conflicts.map((c) => [c.at, c.winner, c.loser, c.movedTo]),
    [['FS-ST', 'marko', 'ana', null], ['FS-ZG', 'marko', 'ana', 'ConflictAndDeleted']]);
  const logI = s.msgs.findIndex((m) => m.kind === 'log');
  assert.equal(s.msgs[logI - 1].result, 'conflict-in');
  assert.equal(s.msgs[logI].lane, 'FS-ZG');
  // nothing is merged: Marko's version was saved over v1, not over Ana's
  assert.equal(s.versions.marko.base, 'v1');
  assert.equal(cli(s, 'CL-ZG').saw, 'marko');
});

// ── presets and expected numbers (SPEC.md) ──

test('steps per preset and per param set', () => {
  const want = { referral: 6, failover: 8, conflict: 8, 'no-conflict': 8 };
  for (const pr of logic.presets) assert.equal(stepsOf(pr.params), want[pr.id], pr.id);
  assert.equal(stepsOf({ fsStUp: false, failback: true }), 8);
  assert.equal(stepsOf({ failback: true }), 6);
  assert.equal(stepsOf(Object.assign({ replicateAfter: 60 }, R2)), 8);
  assert.equal(stepsOf(Object.assign({ linkUp: false }, R2)), 5);
  assert.equal(stepsOf(Object.assign({ linkUp: false, secondEditDelay: 1200 }, R2)), 6);
});

test('preset no-conflict: Marko edits Ana\'s version, nothing is lost', () => {
  const p = { part: 'replication', secondEditDelay: 1200 };
  const s = end(p);
  assert.deepEqual(kinds(s), ['save', 'window', 'repl', 'open', 'save', 'window', 'repl', 'open']);
  assert.deepEqual(s.msgs.filter((m) => m.kind === 'window').map((m) => m.t), [hm(10, 15), hm(10, 30)]);
  assert.equal(s.versions.marko.base, 'ana');
  assert.deepEqual(s.conflicts, []);
  assert.deepEqual(srv(s, 'FS-ZG').bin, []);
  assert.equal(cli(s, 'CL-ZG').saw, 'marko');
});

test('preset conflict: the eight steps in order', () => {
  const s = end(R2);
  assert.deepEqual(kinds(s), ['save', 'open', 'save', 'window', 'repl', 'repl', 'log', 'open']);
  assert.deepEqual(s.msgs.map((m) => m.t), [hm(10, 0), hm(10, 2), hm(10, 2), hm(10, 15), hm(10, 15), hm(10, 15), hm(10, 15), hm(10, 15)]);
});

test('the last step ends the run; stepping past it changes nothing', () => {
  for (const pr of logic.presets) {
    const n = stepsOf(pr.params);
    assert.equal(at(pr.params, n).phase, 'done', pr.id);
    assert.notEqual(at(pr.params, n - 1).phase, 'done', pr.id);
    const e = at(pr.params, n);
    assert.deepEqual(logic.step(e, n + 1, P(pr.params)), e);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.presets) for (let n = 0; n <= stepsOf(pr.params); n++) {
    const s = at(pr.params, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const pr of logic.presets) {
    const p = P(pr.params), steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input; one message per step', () => {
  const p = P(R2);
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  for (const pr of logic.presets) for (let n = 1; n <= stepsOf(pr.params); n++) assert.equal(at(pr.params, n).msgs.length, n, `${pr.id} ${n}`);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page lists the model presets and its meta steps match', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
});
