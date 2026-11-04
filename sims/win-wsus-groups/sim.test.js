// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-wsus-groups' model (rules: SPEC.md). Run: node --test sims/win-wsus-groups/sim.test.js
// Days are literal (step n = day n − 1), so a changed constant in the model fails here.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, 10);
const G = { na: 'o', det: 'd', inst: 'I', forced: 'F' };
/** KB-B's timeline of one computer as a string, one letter per day: o none, d detected, I installed, F forced. */
const line = (s, pc) => s.hist[pc].map((x) => G[x]).join('');
const PCS = ['PC-P1', 'PC-P2', 'PC-P3', 'PC-K1', 'PC-K2', 'PC-01', 'PC-02', 'PC-03', 'PC-04', 'PC-05', 'PC-06'];
const lines = (s) => Object.fromEntries(PCS.map((pc) => [pc, line(s, pc)]));
/** Run from a hand-made state (cases the presets do not reach). */
function runFrom(s, n0, n1) { for (let i = n0; i <= n1; i++) s = logic.step(s, i); return s; }

const PILOT_FIRST = {
  'PC-P1': 'dIIIIIIIII', 'PC-P2': 'ddddIIIIII', 'PC-P3': 'odIIIIIIII', 'PC-K1': 'dIIIIIIIII', 'PC-K2': 'oooooooooo',
  'PC-01': 'oooodIIIII', 'PC-02': 'oooodIIIII', 'PC-03': 'oooodIIIII', 'PC-04': 'oooodIIIII',
  'PC-05': 'ooooddddII', 'PC-06': 'ooooddddII'
};

// ── tie-breaks first ──

test('tie-break 1: an approval made on day d is detected at that day\'s scan', () => {
  assert.equal(at({}, 1).hist['PC-P1'][0], 'det');            // approved for Pilot on day 0, detected on day 0
  assert.equal(at({}, 5).hist['PC-01'][4], 'det');            // approved for Production on day 4, detected on day 4
});

test('tie-break 1 (task rule 7): a computer moved into a group on day d sees its approvals at its scan on day d', () => {
  const s = at({}, 2);
  assert.deepEqual(s.ev.admin, [{ kind: 'move', pc: 'PC-P3', to: 'Pilot' }]);
  assert.equal(s.hist['PC-P3'][1], 'det');
  assert.deepEqual(s.pc['PC-P3']['KB-B'], { st: 'detected', det: 1, due: 2, forced: false });
});

test('tie-break 2: client-side membership is set at the contact itself, before the approval is worked out', () => {
  const s = at({ targeting: 'client' }, 1);
  assert.deepEqual(s.ev.member, [{ pc: 'PC-P3', groups: ['Pilot'] }]);
  assert.equal(s.hist['PC-P3'][0], 'det');
  assert.equal(line(end({ targeting: 'client' }), 'PC-P3'), 'dIIIIIIIII');
  assert.equal(end({ targeting: 'client' }).plan.filter((a) => a.kind === 'move').length, 1);
  assert.equal(at({ targeting: 'client' }, 2).ev.admin.length, 0);   // nothing to move on day 1
});

test('tie-break 3: the user\'s own day and the deadline on the same day count as the user\'s install', () => {
  // PC-05 postpones: detected day 4, due day 8; a deadline on day 8 meets the user's own day
  const o = { prodDeadline: 8 };
  const s = end(o);
  assert.equal(line(s, 'PC-05'), 'ooooddddII');
  assert.deepEqual(at(o, 9).ev.pcs.filter((x) => x.pc === 'PC-05'), [{ pc: 'PC-05', update: 'KB-B', what: 'installed' }]);
});

test('tie-break 4: Install inherited on one group beats Remove that is another group\'s own approval', () => {
  const s = end({ firstApproval: 'all', kioskRemove: true });
  assert.deepEqual(logic.groupApproval(s, 'Pilot', 'KB-B'), { action: 'install', deadline: null, from: 'All Computers', inherited: true });
  assert.deepEqual(logic.groupApproval(s, 'Kiosks', 'KB-B'), { action: 'remove', deadline: null, from: 'Kiosks', inherited: false });
  assert.equal(s.effective['PC-K1']['KB-B'].action, 'install');
  assert.equal(s.effective['PC-K2']['KB-B'].action, 'remove');
  assert.equal(line(s, 'PC-K1'), 'dIIIIIIIII');
  assert.equal(line(s, 'PC-K2'), 'oooooooooo');
});

// ── rule 1: targeting ──

test('rule 1 (server-side): a new computer lands in Unassigned Computers and the admin moves it on day 1', () => {
  const s0 = at({}, 0);
  assert.equal(s0.computers.find((c) => c.name === 'PC-P3').registered, false);
  assert.deepEqual(logic.groupsOf(s0, 'PC-P3'), []);
  const s1 = at({}, 1);
  assert.deepEqual(s1.ev.reg, ['PC-P3']);
  assert.deepEqual(logic.groupsOf(s1, 'PC-P3'), ['Unassigned Computers']);
  assert.equal(s1.effective['PC-P3']['KB-B'].action, 'notApproved');
  assert.deepEqual(logic.groupsOf(at({}, 2), 'PC-P3'), ['Pilot']);
});

test('rule 1 (client-side): the policy names the group; no such group means Unassigned Computers', () => {
  const s = end({ targeting: 'client', gpoName: 'Pliot' });
  assert.deepEqual(logic.groupsOf(s, 'PC-P3'), ['Unassigned Computers']);
  assert.equal(line(s, 'PC-P3'), 'oooooooooo');
  assert.deepEqual(logic.groupsOf(s, 'PC-K1'), ['Pilot', 'Kiosks']);          // "Pilot;Kiosks": both groups
  assert.deepEqual(logic.targetGroups(s, 'pilot'), ['Pilot']);                 // case does not matter
  assert.deepEqual(logic.targetGroups(s, 'Pliot'), ['Unassigned Computers']);
  assert.deepEqual(logic.targetGroups(s, 'Pliot; Kiosks'), ['Kiosks']);
  assert.deepEqual(logic.targetGroups(s, 'All Computers'), ['Unassigned Computers']);
  assert.deepEqual(logic.targetGroups(s, 'Unassigned Computers;Pilot'), ['Pilot']);
  assert.deepEqual(logic.targetGroups(s, ''), ['Unassigned Computers']);
  assert.deepEqual(s.groups.map((g) => g.name), ['All Computers', 'Unassigned Computers', 'Pilot', 'Production', 'Kiosks']);   // no group created
});

// ── rule 2: one mode at a time ──

test('rule 2: in server-side mode the policy\'s group name is ignored', () => {
  assert.deepEqual(lines(end({ gpoName: 'Pliot' })), PILOT_FIRST);
  assert.deepEqual(logic.groupsOf(at({ gpoName: 'Pilot' }, 1), 'PC-P3'), ['Unassigned Computers']);
});

test('rule 2: in client-side mode the console cannot move a computer', () => {
  const s = at({ targeting: 'client', gpoName: 'Pliot' }, 2);
  assert.deepEqual(s.ev.admin, [{ kind: 'move', pc: 'PC-P3', to: 'Pilot', rejected: 'clientSide' }]);
  assert.deepEqual(logic.groupsOf(s, 'PC-P3'), ['Unassigned Computers']);
});

// ── rule 3: inheritance ──

test('rule 3: All Computers covers every group, Unassigned Computers included; a group\'s own approval overrides', () => {
  const s = at({ firstApproval: 'all' }, 1);
  for (const g of ['Unassigned Computers', 'Pilot', 'Production', 'Kiosks']) {
    assert.deepEqual(logic.cell(s, g, 'KB-B'), { action: 'install', deadline: null, from: 'All Computers', inherited: true }, g);
  }
  assert.deepEqual(logic.groupsOf(s, 'PC-P3'), ['Unassigned Computers']);
  assert.equal(s.hist['PC-P3'][0], 'det');
  const own = logic.initial(P({}));
  own.approvals.push({ update: 'KB-B', group: 'All Computers', action: 'install', deadline: null, day: 0 });
  own.approvals.push({ update: 'KB-B', group: 'Kiosks', action: 'notApproved', deadline: null, day: 0 });
  assert.equal(logic.effectiveOf(own, 'PC-K2', 'KB-B').action, 'notApproved');
  assert.equal(logic.effectiveOf(own, 'PC-01', 'KB-B').action, 'install');
  assert.deepEqual(logic.cell(own, 'All Computers', 'KB-A'), { action: 'notApproved', deadline: null, from: null, inherited: false });
});

test('rule 3: approve-all: all 11 computers detect on day 0 and have KB-B by day 4', () => {
  const s = end({ firstApproval: 'all' });
  for (const pc of PCS) assert.equal(s.hist[pc][0], 'det', pc);
  assert.deepEqual(lines(s), {
    'PC-P1': 'dIIIIIIIII', 'PC-P2': 'ddddIIIIII', 'PC-P3': 'dIIIIIIIII', 'PC-K1': 'dIIIIIIIII', 'PC-K2': 'dIIIIIIIII',
    'PC-01': 'dIIIIIIIII', 'PC-02': 'dIIIIIIIII', 'PC-03': 'dIIIIIIIII', 'PC-04': 'dIIIIIIIII',
    'PC-05': 'ddddIIIIII', 'PC-06': 'ddddIIIIII'
  });
  assert.equal(s.approvals.filter((a) => a.update === 'KB-B').length, 1);       // no separate Production approval
  assert.equal(logic.plan(P({ firstApproval: 'all', prodDeadline: 7 })).some((a) => a.group === 'Production'), false);
});

// ── rule 4: several groups ──

test('rule 4 (two-groups): PC-K1 in Pilot (Install) and Kiosks (Remove): Install wins; PC-K2 has nothing to remove', () => {
  const s = at({ kioskRemove: true }, 1);
  assert.deepEqual(s.ev.admin.map((a) => [a.group, a.action]), [['Pilot', 'install'], ['Kiosks', 'remove']]);
  assert.deepEqual(s.effective['PC-K1']['KB-B'], { action: 'install', deadline: null });
  assert.deepEqual(s.effective['PC-K2']['KB-B'], { action: 'remove', deadline: null });
  const e = end({ kioskRemove: true });
  assert.equal(line(e, 'PC-K1'), 'dIIIIIIIII');
  assert.equal(line(e, 'PC-K2'), 'oooooooooo');
  for (let n = 1; n <= 10; n++) assert.ok(!at({ kioskRemove: true }, n).ev.pcs.some((x) => x.what === 'removed'));
});

test('rule 4: Remove beats Not approved, and the earliest deadline among the Install groups applies', () => {
  const s = logic.initial(P({}));
  s.approvals.push({ update: 'KB-B', group: 'Kiosks', action: 'remove', deadline: null, day: 0 });
  s.approvals.push({ update: 'KB-B', group: 'Pilot', action: 'notApproved', deadline: null, day: 0 });
  assert.equal(logic.effectiveOf(s, 'PC-K1', 'KB-B').action, 'remove');
  s.approvals.push({ update: 'KB-B', group: 'All Computers', action: 'install', deadline: 6, day: 0 });
  s.approvals = s.approvals.filter((a) => !(a.group === 'Pilot'));
  s.approvals.push({ update: 'KB-B', group: 'Pilot', action: 'install', deadline: 3, day: 0 });
  assert.deepEqual(logic.effectiveOf(s, 'PC-K1', 'KB-B'), { action: 'install', deadline: 3 });   // Pilot 3 vs Kiosks' Remove
  s.approvals = s.approvals.filter((a) => !(a.group === 'Kiosks'));
  assert.deepEqual(logic.effectiveOf(s, 'PC-K1', 'KB-B'), { action: 'install', deadline: 3 });   // Pilot 3, Kiosks inherits 6
  s.approvals.push({ update: 'KB-B', group: 'Kiosks', action: 'install', deadline: null, day: 0 });
  assert.deepEqual(logic.effectiveOf(s, 'PC-K1', 'KB-B'), { action: 'install', deadline: 3 });   // a deadline beats none
  assert.deepEqual(logic.effectiveOf(s, 'PC-K2', 'KB-B'), { action: 'install', deadline: null });
});

test('rule 4: a Remove approval\'s deadline does not count; an inherited deadline earlier than none applies', () => {
  const s = logic.initial(P({}));
  s.approvals.push({ update: 'KB-B', group: 'Kiosks', action: 'remove', deadline: 2, day: 0 });
  s.approvals.push({ update: 'KB-B', group: 'Pilot', action: 'install', deadline: null, day: 0 });
  assert.deepEqual(logic.effectiveOf(s, 'PC-K1', 'KB-B'), { action: 'install', deadline: null });
  const t = logic.initial(P({}));
  t.approvals.push({ update: 'KB-B', group: 'All Computers', action: 'install', deadline: 3, day: 0 });
  t.approvals.push({ update: 'KB-B', group: 'Pilot', action: 'install', deadline: null, day: 0 });
  assert.deepEqual(logic.effectiveOf(t, 'PC-K1', 'KB-B'), { action: 'install', deadline: 3 });   // Kiosks inherits 3
  assert.deepEqual(logic.effectiveOf(t, 'PC-P1', 'KB-B'), { action: 'install', deadline: null }); // Pilot's own overrides
});

// ── rule 5: declined ──

test('rule 5 (decline): declined on day 2: nobody else installs it; PC-P1 and PC-K1 keep it', () => {
  const o = { declineAt: 2 };
  const s3 = at(o, 3);
  assert.deepEqual(s3.ev.admin, [{ kind: 'decline', update: 'KB-B' }]);
  assert.deepEqual(s3.ev.pcs.filter((x) => x.update === 'KB-B'), [
    { pc: 'PC-P2', update: 'KB-B', what: 'withdrawn' }, { pc: 'PC-P3', update: 'KB-B', what: 'withdrawn' }]);
  for (const g of ['All Computers', 'Unassigned Computers', 'Pilot', 'Production', 'Kiosks']) assert.equal(logic.cell(s3, g, 'KB-B').action, 'declined');
  assert.equal(logic.cell(s3, 'Pilot', 'KB-A').action, 'install');            // only KB-B
  assert.deepEqual(at(o, 5).ev.admin, [{ kind: 'skipped', update: 'KB-B', group: 'Production' }]);
  const s = end(o);
  assert.deepEqual(lines(s), {
    'PC-P1': 'dIIIIIIIII', 'PC-P2': 'ddoooooooo', 'PC-P3': 'odoooooooo', 'PC-K1': 'dIIIIIIIII', 'PC-K2': 'oooooooooo',
    'PC-01': 'oooooooooo', 'PC-02': 'oooooooooo', 'PC-03': 'oooooooooo', 'PC-04': 'oooooooooo',
    'PC-05': 'oooooooooo', 'PC-06': 'oooooooooo'
  });
  assert.deepEqual(logic.countOf(s), { installed: 2, detected: 0, none: 9, computers: 11 });
  assert.equal(s.effective['PC-P1']['KB-B'].action, 'declined');
});

test('rule 5: a decline on day 0 comes before the day\'s approval, which is skipped', () => {
  const s = at({ declineAt: 0 }, 1);
  assert.deepEqual(s.ev.admin, [{ kind: 'decline', update: 'KB-B' }, { kind: 'skipped', update: 'KB-B', group: 'Pilot' }]);
  assert.equal(s.approvals.some((a) => a.update === 'KB-B'), false);
  assert.equal(logic.countOf(end({ declineAt: 0 })).installed, 0);
});

test('rule 5: a decline on day 0 skips every approval of the day (Remove too); the move still happens', () => {
  const s = at({ declineAt: 0, kioskRemove: true }, 1);
  assert.deepEqual(s.ev.admin.map((a) => [a.kind, a.group || null]), [['decline', null], ['skipped', 'Pilot'], ['skipped', 'Kiosks']]);
  assert.deepEqual(at({ declineAt: 0 }, 2).ev.admin, [{ kind: 'move', pc: 'PC-P3', to: 'Pilot' }]);
});

// ── rule 6: acting on the approval ──

test('rule 6 (pilot-first): every computer\'s KB-B timeline; Production stays "not approved" until day 4', () => {
  const s = end({});
  assert.deepEqual(lines(s), PILOT_FIRST);
  const s4 = at({}, 4);
  for (const pc of ['PC-01', 'PC-06']) assert.equal(s4.effective[pc]['KB-B'].action, 'notApproved');
  assert.deepEqual(logic.countOf(s), { installed: 10, detected: 0, none: 1, computers: 11 });
  assert.deepEqual(at({}, 2).ev.pcs.filter((x) => x.what === 'postponed'), [{ pc: 'PC-P2', update: 'KB-B', what: 'postponed' }]);
});

test('rule 6 (production-deadline): approved day 4 with deadline day 7: four install day 5, two forced day 7', () => {
  const o = { prodDeadline: 7 };
  const s5 = at(o, 5);
  assert.deepEqual(s5.ev.admin, [{ kind: 'approve', update: 'KB-B', group: 'Production', action: 'install', deadline: 7 }]);
  assert.deepEqual(s5.effective['PC-05']['KB-B'], { action: 'install', deadline: 7 });
  const s8 = at(o, 8);
  assert.deepEqual(s8.ev.pcs.map((x) => [x.pc, x.what]), [['PC-05', 'forced'], ['PC-06', 'forced']]);
  const s = end(o);
  assert.equal(line(s, 'PC-01'), 'oooodIIIII');
  assert.equal(line(s, 'PC-05'), 'oooodddFII');
  assert.equal(line(s, 'PC-06'), 'oooodddFII');
  assert.equal(line(s, 'PC-P2'), 'ddddIIIIII');                // Pilot's approval has no deadline
  assert.equal(PCS.filter((pc) => pc.startsWith('PC-0') && s.hist[pc][7] !== 'det').length, 6);
});

test('rule 6: an update detected on or after its deadline day installs by force that day', () => {
  const s = logic.initial(P({}));
  s.plan = [{ kind: 'approve', update: 'KB-B', group: 'Production', action: 'install', deadline: 1, day: 2 }];
  const after = runFrom(s, 1, 3);
  assert.equal(line(after, 'PC-01'), 'ooF');
  assert.equal(line(after, 'PC-05'), 'ooF');
});

test('rule 6: Remove uninstalls an installed update at the scan; Not approved and Declined do not', () => {
  const s = logic.initial(P({}));
  s.plan = [{ kind: 'approve', update: 'KB-A', group: 'Kiosks', action: 'remove', deadline: null, day: 0 },
    { kind: 'approve', update: 'KB-A', group: 'Production', action: 'notApproved', deadline: null, day: 0 }];
  const after = runFrom(s, 1, 1);
  assert.equal(after.pc['PC-K2']['KB-A'].st, 'none');            // Remove: uninstalled
  assert.equal(after.pc['PC-K1']['KB-A'].st, 'installed');       // Pilot still Install: Install beats Remove
  assert.equal(after.pc['PC-01']['KB-A'].st, 'installed');       // Not approved: kept
  assert.deepEqual(after.ev.pcs, [{ pc: 'PC-K2', update: 'KB-A', what: 'removed' }]);
});

test('rule 6: KB-A was rolled out before day 0: every member of Pilot, Production and Kiosks has it; PC-P3 gets it in Pilot', () => {
  const s0 = at({}, 0);
  for (const pc of PCS) assert.equal(s0.pc[pc]['KB-A'].st, pc === 'PC-P3' ? 'none' : 'installed', pc);
  assert.equal(end({}).pc['PC-P3']['KB-A'].st, 'installed');
  assert.equal(end({ targeting: 'client', gpoName: 'Pliot' }).pc['PC-P3']['KB-A'].st, 'none');
});

test('rule 6: Not approved after detection withdraws the offer', () => {
  const s = logic.initial(P({}));
  s.plan = [{ kind: 'approve', update: 'KB-B', group: 'Pilot', action: 'install', deadline: null, day: 0 },
    { kind: 'approve', update: 'KB-B', group: 'Pilot', action: 'notApproved', deadline: null, day: 1 }];
  const after = runFrom(s, 1, 2);
  assert.equal(line(after, 'PC-P1'), 'do');
  assert.deepEqual(after.pc['PC-P1']['KB-B'], { st: 'none', det: null, due: null, forced: false });
  assert.ok(after.ev.pcs.some((x) => x.pc === 'PC-P1' && x.what === 'withdrawn'));
});

test('tie-break 3 for a user who installs when asked: due day = deadline day is the user\'s install', () => {
  const s = logic.initial(P({}));
  s.plan = [{ kind: 'approve', update: 'KB-B', group: 'Production', action: 'install', deadline: 5, day: 4 }];
  const after = runFrom(s, 1, 6);
  assert.equal(line(after, 'PC-01'), 'oooodI');
  assert.equal(line(after, 'PC-05'), 'oooodF');
});

test('rule 6: "postponed" is reported once, the day after detection', () => {
  const ev = [];
  for (let n = 1; n <= 10; n++) for (const x of at({}, n).ev.pcs) if (x.what === 'postponed') ev.push([n - 1, x.pc]);
  assert.deepEqual(ev, [[1, 'PC-P2'], [5, 'PC-05'], [5, 'PC-06']]);
});

test('counts and effective approvals cover registered computers only; detected is counted', () => {
  const s0 = at({}, 0);
  assert.deepEqual(logic.countOf(s0), { installed: 0, detected: 0, none: 10, computers: 10 });
  assert.equal('PC-P3' in s0.effective, false);
  assert.deepEqual(logic.countOf(at({}, 1)), { installed: 0, detected: 3, none: 8, computers: 11 });
  assert.deepEqual(logic.countOf(at({}, 6)), { installed: 8, detected: 2, none: 1, computers: 11 });
});

// ── the run ──

test('steps: every run is 10 days; past the end nothing changes', () => {
  assert.equal(logic.steps, 10);
  const s = end({});
  assert.equal(s.day, 9);
  const past = logic.step(s, 11);
  assert.equal(past.day, 9);
  assert.equal(past.ev, null);
  assert.deepEqual(past.hist, s.hist);
});

test('typo-unassigned: 9 of 11 have KB-B on day 9; PC-P3 never gets the pilot approval', () => {
  const s = end({ targeting: 'client', gpoName: 'Pliot' });
  assert.deepEqual(logic.countOf(s), { installed: 9, detected: 0, none: 2, computers: 11 });
  const want = Object.assign({}, PILOT_FIRST, { 'PC-P3': 'oooooooooo' });
  assert.deepEqual(lines(s), want);
});

test('every combination: KB-B never goes from installed back to not installed unless removed, and histories have 10 days', () => {
  for (const targeting of ['server', 'client']) for (const gpoName of ['Pilot', 'Pliot']) for (const prodDeadline of [-1, 7])
    for (const kioskRemove of [false, true]) for (const firstApproval of ['pilot', 'all']) for (let declineAt = -1; declineAt <= 10; declineAt++) {
      const p = { targeting, gpoName, prodDeadline, kioskRemove, firstApproval, declineAt };
      const s = end(p);
      for (const pc of PCS) {
        assert.equal(s.hist[pc].length, 10);
        const l = line(s, pc);
        assert.ok(!/[IF][od]/.test(l), JSON.stringify(p) + ' ' + pc + ' ' + l);
      }
    }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = P({ targeting: 'client', gpoName: 'Pliot', prodDeadline: 7, kioskRemove: true, declineAt: 5 });
  for (let n = 0; n <= 10; n++) {
    const s = kit.stateAt(logic, p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ prodDeadline: 7, declineAt: 6 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= 10; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = 10; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ kioskRemove: true, declineAt: 2 });
  for (let n = 0; n < 10; n++) {
    const s = kit.stateAt(logic, p, n);
    const copy = structuredClone(s);
    logic.step(s, n + 1, p);
    assert.deepEqual(s, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model; meta.steps is 10', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps);
  const presets = [...html.matchAll(/\{ id: '([\w-]+)',[^\n]*params: \{([^}]*)\}/g)];
  assert.deepEqual(presets.map((m) => m[1]), ['pilot-first', 'production-deadline', 'typo-unassigned', 'two-groups', 'approve-all', 'decline']);
  const want = {
    'pilot-first': {}, 'production-deadline': { prodDeadline: 7 }, 'typo-unassigned': { targeting: 'client', gpoName: 'Pliot' },
    'two-groups': { kioskRemove: true }, 'approve-all': { firstApproval: 'all' }, decline: { declineAt: 2 }
  };
  for (const m of presets) {
    const over = {};
    for (const kv of m[2].matchAll(/(\w+):\s*('[^']*'|[^,\s]+)/g)) {
      assert.ok(kv[1] in logic.defaults, `preset param ${kv[1]} is a model param`);
      over[kv[1]] = JSON.parse(kv[2].replace(/'/g, '"'));
    }
    assert.deepEqual(over, want[m[1]], m[1]);
  }
});
