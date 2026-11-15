// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-gpo-software-install. Run: node --test sims/win-gpo-software-install/sim.test.js
// One test per rule of SPEC.md, tie-breaks first, then the presets' expected numbers, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const stepsOf = (over) => kit.stepsOf(logic, P(over));
const final = (over) => { const p = P(over); return kit.stateAt(logic, p, kit.stepsOf(logic, p)); };
/** The run as 'kind:result/mode' per event. */
const trace = (over) => final(over).events.map((e) =>
  e.kind + (e.si && e.si !== 'none' ? ':' + e.si : '') + (e.outcome ? ':' + e.outcome : '') +
  (e.bg ? ':' + [e.bg.computer, e.bg.user].join('+') : '') + (e.mode ? '/' + e.mode : ''));

// ── tie-breaks first ──

test('T1: computer and user assignment of the same package: the computer install wins, the user pass finds it', () => {
  const s = logic.initial(P({ deployment: 'user', fastLogon: false }));
  s.pc.installed = true;   // the same package, also assigned to PC07, installed at startup
  assert.equal(logic.siPass(s, 'user', 'fg'), 'viaComputer');
  assert.deepEqual(s.user, { advertised: false, offered: false, installed: false, viaComputer: true });
  assert.equal(logic.viewerFor(s), true);
  assert.equal(logic.hasWork(s, 'user'), false, 'and nothing is left to do for the user part');
});

test('T2: an unreadable share fails only in the synchronous pass: the second startup with fast logon', () => {
  assert.deepEqual(trace({ computersCanRead: false }), ['boot:signal/async', 'boot:failed/sync', 'logon']);
  assert.deepEqual(trace({ computersCanRead: false, fastLogon: false }), ['boot:failed/sync', 'logon']);
});

test('T3: gpupdate signals, so the first foreground pass after it is synchronous even with fast logon', () => {
  assert.deepEqual(trace({ gpupdate: true }), ['gpupdate:signal+none', 'boot:installed/sync', 'logon']);
  assert.equal(final({ gpupdate: true }).events[1].flagged, true);
  assert.equal(final({ gpupdate: true, fastLogon: false }).events[1].flagged, false, 'without fast logon the pass is synchronous anyway');
  assert.deepEqual(trace({ deployment: 'user', gpupdate: true }), ['gpupdate:none+signal', 'logon:advertised/sync', 'open:installedOnUse']);
});

test('T4: a failed install is retried at every startup', () => {
  const s = final({ computersCanRead: false });
  assert.equal(s.pc.failed, 'access');
  assert.equal(logic.hasWork(s, 'computer'), true, 'still work to do');
  const s2 = JSON.parse(JSON.stringify(s));
  assert.equal(logic.siPass(s2, 'computer', 'fg'), 'signal', 'the failed sync pass cleared the flag: the next startup signals again');
  assert.equal(logic.siPass(s2, 'computer', 'fg'), 'failed', 'and the one after fails again');
  s2.shareReadable.computers = true;
  s2.syncNext.computer = true;
  assert.equal(logic.siPass(s2, 'computer', 'fg'), 'installed', 'once computers can read, it installs');
  assert.equal(s2.pc.failed, null);
});

test('T5: over a slow link the pass is skipped, nothing is signalled, and the run ends', () => {
  const s = final({ slowLink: true });
  assert.deepEqual(trace({ slowLink: true }), ['boot:slow/async']);
  assert.equal(s.syncNext.computer, false);
  assert.equal(s.result, 'skipped');
  assert.equal(s.pc.installed, false);
});

test('T6: computersCanRead matters only to a computer deployment that installs', () => {
  for (const deployment of ['user', 'user-at-logon', 'publish']) {
    assert.deepEqual(final({ deployment, computersCanRead: false }).events, final({ deployment }).events, deployment);
  }
  assert.equal(final({ move: true, removeOnScope: true, computersCanRead: false }).result, 'removed');
});

// ── rules ──

test('rule 1: only an MSI on a UNC path is deployable (a transform is not a package)', () => {
  assert.equal(logic.deployable(logic.PACKAGE), true);
  assert.equal(logic.deployable('\\\\hq-fs01\\pkg$\\viewer.mst'), false, 'a transform alone');
  assert.equal(logic.deployable('\\\\hq-fs01\\pkg$\\apps\\viewer.MSI'), true);
  assert.equal(logic.deployable('C:\\pkg\\apps\\viewer.msi'), false, 'a local path');
  assert.equal(logic.deployable('\\\\hq-fs01\\pkg$\\setup.exe'), false, 'not Windows Installer');
  assert.equal(logic.deployable('\\\\hq-fs01\\viewer.msi'), false, 'no share');
  assert.equal(logic.deployable(null), false);
});

test('rule 2: assign to computer installs in the synchronous startup pass, reading the share as the computer', () => {
  assert.deepEqual(trace({}), ['boot:signal/async', 'boot:installed/sync', 'logon']);
  const s = final({});
  assert.equal(s.pc.installed, true);
  assert.equal(s.user.installed, false, 'per machine, not per user');
  assert.equal(s.events[2].has, true, 'ana sees it at her logon');
  assert.equal(s.shareReadable.users, true, 'ana can read the share…');
  assert.equal(final({ computersCanRead: false }).result, 'failed', '…and it still fails: the computer reads it');
  assert.equal(final({ computersCanRead: false }).events[2].has, false);
});

test('rule 3: assign to user advertises at logon and installs at first use; at-logon installs at logon', () => {
  const adv = kit.stateAt(logic, P({ deployment: 'user' }), 2);
  assert.deepEqual(adv.user, { advertised: true, offered: false, installed: false, viaComputer: false });
  assert.equal(logic.viewerFor(adv), false, 'a shortcut only');
  assert.equal(final({ deployment: 'user' }).user.installed, true);
  assert.equal(final({ deployment: 'user' }).events[2].outcome, 'installedOnUse');
  assert.deepEqual(trace({ deployment: 'user-at-logon' }), ['logon:signal/async', 'logon:installed/sync', 'open:opens']);
  assert.equal(final({ deployment: 'user-at-logon' }).user.advertised, false);
});

test('rule 4: publish only offers it; it installs from "Get programs"; publish to a computer is not possible', () => {
  const off = kit.stateAt(logic, P({ deployment: 'publish' }), 2);
  assert.deepEqual(off.user, { advertised: false, offered: true, installed: false, viaComputer: false });
  assert.deepEqual(trace({ deployment: 'publish' }), ['logon:signal/async', 'logon:offered/sync', 'store:installedFromStore']);
  assert.equal(logic.allowed('publish', 'computer'), false);
  assert.equal(logic.allowed('publish', 'user'), true);
  assert.equal(logic.allowed('assign', 'computer'), true);
  assert.equal(logic.allowed('assign', 'user'), true);
  assert.ok(logic.DEPLOYMENTS.every((d) => logic.allowed(logic.MODES[d].how, logic.MODES[d].part)));
  // the store with nothing offered: not listed
  const s = logic.initial(P({ deployment: 'publish' }));
  assert.equal(logic.processEvent(s, 'store', 1).outcome, 'notListed');
});

test('rule 5: a background pass never installs; it only signals, and gpupdate asks for a restart or a logoff', () => {
  for (const deployment of logic.DEPLOYMENTS) {
    const s = logic.initial(P({ deployment }));
    const part = logic.MODES[deployment].part;
    assert.equal(logic.siPass(s, part, 'bg'), 'signal', deployment);
    assert.equal(logic.viewerFor(s), false);
    assert.equal(s.syncNext[part], true);
  }
  const s = logic.initial(P({ fastLogon: false }));   // background stays asynchronous even without fast logon
  assert.equal(logic.siPass(s, 'computer', 'bg'), 'signal');
  assert.equal(final({ gpupdate: true }).events[0].ask, 'restart');
  assert.equal(final({ gpupdate: true, deployment: 'publish' }).events[0].ask, 'logoff');
  assert.equal(final({ gpupdate: true, deployment: 'publish' }).events[0].changed.length, 0, 'nothing appears');
});

test('rule 6: fast logon makes the first foreground pass asynchronous; off, the first one installs; sync clears the flag', () => {
  assert.equal(stepsOf({}), 3);
  assert.equal(stepsOf({ fastLogon: false }), 2);
  assert.deepEqual(trace({ fastLogon: false }), ['boot:installed/sync', 'logon']);
  assert.deepEqual(trace({ deployment: 'user', fastLogon: false }), ['logon:advertised/sync', 'open:installedOnUse']);
  const s = final({});
  assert.deepEqual(s.events[0].flags, { computer: true, user: false });
  assert.deepEqual(s.events[1].flags, { computer: false, user: false });
  // a part with nothing new does not signal
  const s2 = logic.initial(P({}));
  assert.equal(logic.siPass(s2, 'user', 'fg'), 'none');
  assert.equal(s2.syncNext.user, false);
});

test('rule 7: out of scope: removed at the next synchronous pass with the option, left installed without', () => {
  assert.deepEqual(trace(preset('out-of-scope')), ['move', 'boot:signal/async', 'boot:removed/sync', 'logon']);
  const on = final(preset('out-of-scope'));
  assert.equal(on.pc.installed, false);
  assert.equal(on.events[3].has, false);
  assert.equal(on.result, 'removed');
  const off = final({ move: true });
  assert.deepEqual(trace({ move: true }), ['move', 'boot:signal/async', 'boot:stays/sync', 'logon']);
  assert.equal(off.pc.installed, true);
  assert.equal(off.managed, false, 'no longer managed');
  assert.equal(off.result, 'stays');
  // the user's packages the same way, and the follow-up checks the file
  assert.deepEqual(trace({ deployment: 'publish', move: true, removeOnScope: true }), ['move', 'logon:signal/async', 'logon:removed/sync', 'open:noApp']);
  assert.deepEqual(trace({ deployment: 'user', move: true }), ['move', 'logon:signal/async', 'logon:stays/sync', 'open:opens']);
  // a removed user assignment takes the advertisement with it: opening the file does not reinstall it
  assert.deepEqual(trace({ deployment: 'user', move: true, removeOnScope: true }), ['move', 'logon:signal/async', 'logon:removed/sync', 'open:noApp']);
  assert.equal(kit.stateAt(logic, P(preset('out-of-scope')), 1).inScope, false);
  assert.equal(kit.stateAt(logic, P(preset('out-of-scope')), 0).pc.installed, true, 'starts installed');
});

test('the changed targets are the ones whose state changed in the step', () => {
  const s = final({});
  assert.deepEqual(s.events.map((e) => e.changed), [[], ['pc'], []]);
  assert.deepEqual(final({ deployment: 'user' }).events.map((e) => e.changed), [[], ['user'], ['user']]);
});

// ── presets: the task's expected numbers ──

test('presets: step counts and results', () => {
  const want = { 'assign-computer': [3, 'installed'], 'assign-user': [3, 'installed'], 'publish-user': [3, 'installed'],
    'share-perms': [3, 'failed'], 'out-of-scope': [4, 'removed'] };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const [id, [steps, result]] of Object.entries(want)) {
    assert.equal(stepsOf(preset(id)), steps, id);
    assert.equal(final(preset(id)).result, result, id);
  }
});

test('steps over every page combination match an independent count, 2 to 4', () => {
  const counts = {};
  for (const deployment of logic.DEPLOYMENTS) for (const computersCanRead of [true, false]) for (const fastLogon of [true, false])
    for (const removeOnScope of [true, false]) for (const move of [true, false]) for (const gpupdate of [true, false]) {
      const p = { deployment, computersCanRead, fastLogon, removeOnScope, move, gpupdate };
      const want = (move ? 1 : 0) + (gpupdate ? 1 : 0) + (fastLogon && !gpupdate ? 2 : 1) + 1;
      const n = stepsOf(p);
      assert.equal(n, want, JSON.stringify(p));
      assert.equal(final(p).phase, 'done');
      counts[n] = (counts[n] || 0) + 1;
    }
  assert.deepEqual(counts, { 2: 16, 3: 64, 4: 48 });
});

test('the state carries the task\'s fields', () => {
  const s = logic.initial(P({}));
  for (const k of ['deployment', 'shareReadable', 'fastLogon', 'events', 'pc', 'user', 'removeOnScope', 'inScope']) assert.ok(k in s, k);
  assert.deepEqual(s.shareReadable, { computers: true, users: true });
  assert.equal(s.inScope, true);
  assert.equal(logic.initial(P({ deployment: 'nope' })).deployment, 'computer');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.presets) {
    const p = P(pr.params);
    for (let n = 0; n <= kit.stepsOf(logic, p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(preset('out-of-scope'));
  const steps = kit.stepsOf(logic, p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input; a finished state stays put', () => {
  const p = P({});
  const s1 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
  const end = final({});
  assert.deepEqual(logic.step(end, 9, p), end);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('the page: meta steps match the defaults; every preset id and param is the model\'s', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, kit.stepsOf(logic, logic.defaults), 'meta.steps matches the model');
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, meta.steps);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
  for (const k of [...html.matchAll(/\{ key: '(\w+)', type:/g)].map((m) => m[1])) assert.ok(k in logic.defaults, `page param ${k}`);
});
