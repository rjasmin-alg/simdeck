// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-log-evidence. Run: node --test sims/cmp-log-evidence/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the log-evidence model's rules (logs.js), then the
// sim's rules (sim.js), then the presets, then the strings and the page, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const logs = require('./logs.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const preset = (id) => logic.presets.find((x) => x.id === id);
const atPreset = (id, n) => kit.stateAt(logic, P(preset(id).params), n);
const LAST = logic.steps;
const SC = logic.SCENARIO;
const DAY = logs.DAY;
const T = (hh, mm, day = 0) => day * DAY + hh * 60 + mm;
const setup = (over) => Object.assign({ store: 'central', drift: { fs: 0 }, keep: 180, logged: { fileReads: true }, readers: 'named' }, over);
const act = (id) => SC.actions.find((a) => a.id === id);
const q = (s, id) => logic.question(s, id);
const answers = (s) => s.questions.map((x) => x.id + ':' + x.status + (x.reason ? '(' + x.reason + ')' : '')).join(' ');
const CENTRAL = { store: 'central', readers: 'named' };

// ── tie-breaks ──

test('tie-break: a record found exactly `keep` days later is still there; one day more and it has aged out', () => {
  assert.equal(logs.isAged(T(23, 10), T(10, 0, 30), 30), false);
  assert.equal(logs.isAged(T(23, 10), T(10, 0, 31), 30), true);
  assert.equal(logs.isAged(T(23, 10), T(0, 0, 31), 30), true);     // whole days: the day, not the hour, counts
  assert.equal(logs.isAged(T(23, 10), T(23, 59, 30), 30), false);
  assert.equal(at(Object.assign({ keep: 30, found: 30 }, CENTRAL), LAST).yes, 5);
  assert.equal(at(Object.assign({ keep: 30, found: 31 }, CENTRAL), LAST).yes, 0);
});

test('tie-break: equal timestamps make the order unknown (drift 6 and 10 put the copy on another action\'s minute)', () => {
  const six = at(Object.assign({ drift: 6 }, CENTRAL), LAST);
  assert.equal(six.order.ties, true);
  assert.deepEqual([q(six, 'order').status, q(six, 'order').reason], ['no', 'tie']);
  const ten = at(Object.assign({ drift: 10 }, CENTRAL), LAST);
  assert.deepEqual([q(ten, 'order').status, q(ten, 'order').reason], ['no', 'tie']);
  // display order on a tie: the scenario's host order (identity server before file server, gateway before file server)
  assert.deepEqual(six.order.list.map((x) => x.id), ['login', 'change', 'export']);
  assert.deepEqual(ten.order.list.map((x) => x.id), ['login', 'export', 'change']);
  assert.equal(ten.order.list[0].stamp, ten.order.list[1].stamp);
  // one minute either side is not a tie
  assert.equal(q(at(Object.assign({ drift: 5 }, CENTRAL), LAST), 'order').reason, 'drift');
  assert.equal(q(at(Object.assign({ drift: 7 }, CENTRAL), LAST), 'order').reason, 'wrong');
});

test('tie-break: a record written in the wipe\'s own minute goes with the wipe; a later one stays', () => {
  const sc = { hosts: ['a'], actions: [{ id: 'x', host: 'a', at: 100 }, { id: 'y', host: 'a', at: 101 }], wipe: { at: 100, hosts: ['a'] } };
  const su = setup({ store: 'local' });
  assert.equal(logs.copies(sc.actions[0], sc, su, 200)[0].status, 'wiped');
  assert.equal(logs.copies(sc.actions[1], sc, su, 200)[0].status, 'kept');
  // before the wipe the record is kept
  assert.equal(logs.copies(sc.actions[0], sc, su, 99).length, 0);
  assert.equal(logs.copies({ id: 'w', host: 'a', at: 90 }, sc, su, 99)[0].status, 'kept');
});

test('tie-break: the earliest cause names a lost copy: never logged before deleted before aged out', () => {
  const late = T(10, 0, 400);
  // never logged, even though it would also have aged out
  assert.deepEqual(logs.copies(act('export'), SC, setup({ store: 'local', logged: { fileReads: false } }), late), [{ where: 'local', status: 'unlogged' }]);
  // deleted, even though it would also have aged out
  assert.equal(logs.copies(act('change'), SC, setup({ store: 'local' }), late)[0].status, 'wiped');
  // the question takes the longest-lived copy: the central one aged out after the local one was deleted
  const cs = logs.copies(act('change'), SC, setup({ keep: 30 }), late);
  assert.deepEqual(cs.map((c) => c.status), ['wiped', 'aged']);
  assert.equal(logs.best(cs), 'aged');
  const s = at({ store: 'local', keep: 30, found: 200 }, LAST);
  assert.equal(q(s, 'what').reason, 'wiped');
  assert.equal(q(s, 'who').reason, 'aged');
});

test('tie-break: drift 0 with every record is the only "yes" for the order; any drift that keeps the order is "partly"', () => {
  assert.equal(q(at(CENTRAL, LAST), 'order').status, 'yes');
  for (let d = 1; d <= 5; d++) {
    const o = q(at(Object.assign({ drift: d }, CENTRAL), LAST), 'order');
    assert.deepEqual([o.status, o.reason], ['partly', 'drift'], 'drift ' + d);
  }
  // gaps win over drift as the reason for "partly": only reachable in the model (in the sim only the file server
  // drifts, and its record is the one missing), so a drifting gateway with file reads unlogged
  const g = logs.order(SC, setup({ drift: { gw: 1 }, logged: { fileReads: false } }), T(10, 0, 45));
  assert.deepEqual([g.status, g.reason], ['partly', 'gaps']);
});

test('tie-break: the display order of equal stamps is the scenario\'s host order, then the true order', () => {
  const sc = { hosts: ['b', 'a'], actions: [{ id: 'x', host: 'a', at: 100 }, { id: 'y', host: 'b', at: 100 }], wipe: null };
  const o = logs.order(sc, setup(), 200);
  assert.deepEqual(o.list.map((x) => x.id), ['y', 'x']);
  assert.deepEqual([o.ties, o.status, o.reason], [true, 'no', 'tie']);
  const one = { hosts: ['a'], actions: [{ id: 'x', host: 'a', at: 100 }, { id: 'y', host: 'a', at: 100 }], wipe: null };
  assert.deepEqual(logs.order(one, setup(), 200).list.map((x) => x.id), ['x', 'y']);
});

test('tie-break: the wipe is evidence from its own minute on', () => {
  assert.deepEqual(logs.tamper(SC, setup(), T(23, 31)), { status: 'yes', reason: null });
  assert.deepEqual(logs.tamper(SC, setup({ store: 'local' }), T(23, 31)), { status: 'partly', reason: 'gap' });
  assert.deepEqual(logs.tamper(SC, setup(), T(23, 30)), { status: 'none', reason: null });
});

// ── the log-evidence model (logs.js) ──

test('rule 1: a host stamps true time minus its clock\'s lag; hosts without a drift stamp true time', () => {
  assert.equal(logs.stamp(act('export'), setup({ drift: { fs: 12 } })), T(23, 8));
  assert.equal(logs.stamp(act('login'), setup({ drift: { fs: 12 } })), T(23, 10));
  assert.equal(logs.stamp(act('login'), setup({ drift: undefined })), T(23, 10));
  assert.equal(logs.stamp(act('login'), setup({ drift: { gw: 'x' } })), T(23, 10));
});

test('rule 2: an action needing a log source is recorded only when that source is on', () => {
  assert.equal(logs.isLogged(act('export'), setup()), true);
  assert.equal(logs.isLogged(act('export'), setup({ logged: { fileReads: false } })), false);
  assert.equal(logs.isLogged(act('export'), setup({ logged: undefined })), false);
  assert.equal(logs.isLogged(act('login'), setup({ logged: undefined })), true);
  // an unlogged action has no central copy either
  assert.deepEqual(logs.copies(act('export'), SC, setup({ logged: { fileReads: false } }), T(23, 25)), [{ where: 'local', status: 'unlogged' }]);
});

test('rule 2: copies: a local one on its host, and a central one only with a central store; none before the action', () => {
  assert.deepEqual(logs.copies(act('login'), SC, setup({ store: 'local' }), T(23, 10)), [{ where: 'local', status: 'kept' }]);
  assert.deepEqual(logs.copies(act('login'), SC, setup(), T(23, 10)), [{ where: 'local', status: 'kept' }, { where: 'central', status: 'kept' }]);
  assert.deepEqual(logs.copies(act('login'), SC, setup(), T(23, 9)), []);
});

test('rule 2: the wipe deletes local copies on the wiped hosts only, and only from the wipe on; central copies stay', () => {
  const before = T(23, 30), after = T(23, 31);
  assert.equal(logs.copies(act('change'), SC, setup(), before)[0].status, 'kept');
  assert.deepEqual(logs.copies(act('change'), SC, setup(), after).map((c) => c.status), ['wiped', 'kept']);
  assert.deepEqual(logs.copies(act('export'), SC, setup(), after).map((c) => c.status), ['wiped', 'kept']);
  assert.equal(logs.copies(act('login'), SC, setup(), after)[0].status, 'kept');       // the gateway is out of reach
  const noWipe = { hosts: SC.hosts, actions: SC.actions, wipe: null };
  assert.equal(logs.copies(act('change'), noWipe, setup(), after)[0].status, 'kept');
});

test('rule 3: retention ages out local and central copies alike, by the day they were written', () => {
  const found = T(10, 0, 45);
  assert.deepEqual(logs.copies(act('login'), SC, setup({ keep: 30 }), found).map((c) => c.status), ['aged', 'aged']);
  assert.deepEqual(logs.copies(act('login'), SC, setup({ keep: 90 }), found).map((c) => c.status), ['kept', 'kept']);
  // the stamp does not change the day a record ages (drift only moves the stamp)
  assert.equal(logs.copies(act('export'), SC, setup({ keep: 45, drift: { fs: 30 } }), found)[1].status, 'kept');
});

test('rule 4: the best copy is the longest-lived (unlogged < wiped < aged < kept); none is null', () => {
  assert.equal(logs.best([]), null);
  assert.equal(logs.best([{ status: 'wiped' }, { status: 'kept' }]), 'kept');
  assert.equal(logs.best([{ status: 'kept' }, { status: 'wiped' }]), 'kept');
  assert.equal(logs.best([{ status: 'aged' }, { status: 'wiped' }]), 'aged');
  assert.equal(logs.best([{ status: 'unlogged' }]), 'unlogged');
  assert.deepEqual(logs.RANK, ['unlogged', 'wiped', 'aged', 'kept']);
});

test('rule 5: the central store keeps a record of the wipe per wiped host, stamped by that host, that ages like the rest', () => {
  assert.deepEqual(logs.wipeRecords(SC, setup({ store: 'local' }), T(23, 40)), []);
  assert.deepEqual(logs.wipeRecords(SC, setup(), T(23, 30)), []);
  const w = logs.wipeRecords(SC, setup({ drift: { fs: 6 } }), T(23, 31));
  assert.deepEqual(w.map((x) => [x.host, x.stamp, x.status]), [['idm', T(23, 31), 'kept'], ['fs', T(23, 25), 'kept']]);
  assert.deepEqual(logs.wipeRecords(SC, setup({ keep: 30 }), T(10, 0, 31)).map((x) => x.status), ['aged', 'aged']);
});

test('rule 6: the order: available records sorted by stamp; wrong when a later action is stamped before an earlier one', () => {
  const o = logs.order(SC, setup({ drift: { fs: 12 } }), T(10, 0, 45));
  assert.deepEqual(o.list.map((x) => [x.id, x.seq]), [['export', 2], ['login', 0], ['change', 1]]);
  assert.deepEqual([o.wrong, o.ties, o.status, o.reason], [true, false, 'no', 'wrong']);
  const o2 = logs.order(SC, setup({ drift: { fs: 8 } }), T(10, 0, 45));
  assert.deepEqual(o2.list.map((x) => x.id), ['login', 'export', 'change']);
  assert.equal(o2.reason, 'wrong');
});

test('rule 6: fewer than two available records give no order; missing ones give "partly"', () => {
  const none = logs.order(SC, setup({ keep: 30 }), T(10, 0, 45));
  assert.deepEqual([none.list.length, none.status, none.reason], [0, 'no', 'gaps']);
  const one = logs.order(SC, setup({ store: 'local' }), T(10, 0, 45));
  assert.deepEqual([one.list.map((x) => x.id), one.status, one.reason], [['login'], 'no', 'gaps']);
  const two = logs.order(SC, setup({ logged: { fileReads: false } }), T(10, 0, 45));
  assert.deepEqual([two.list.length, two.status, two.reason], [2, 'partly', 'gaps']);
});

test('rule 7: evidence of the wipe: kept in the store (yes), a visible gap on the hosts (partly), aged out (no)', () => {
  assert.deepEqual(logs.tamper(SC, setup(), T(10, 0, 45)), { status: 'yes', reason: null });
  assert.deepEqual(logs.tamper(SC, setup({ store: 'local' }), T(10, 0, 45)), { status: 'partly', reason: 'gap' });
  assert.deepEqual(logs.tamper(SC, setup({ store: 'local', keep: 30 }), T(10, 0, 45)), { status: 'no', reason: 'aged' });
  assert.deepEqual(logs.tamper(SC, setup({ keep: 30 }), T(10, 0, 45)), { status: 'no', reason: 'aged' });
  assert.deepEqual(logs.tamper(SC, setup(), T(23, 30)), { status: 'none', reason: null });
});

test('rule 8: who reads the log: every host admin (no store), every admin, or named reviewers; only the last is ok', () => {
  assert.deepEqual(logs.access(setup({ store: 'local', readers: 'named' })), { who: 'host', ok: false });
  assert.deepEqual(logs.access(setup({ readers: 'admins' })), { who: 'admins', ok: false });
  assert.deepEqual(logs.access(setup({ readers: 'named' })), { who: 'named', ok: true });
});

// ── the sim (sim.js) ──

test('rule 9: params are made valid (store, numbers rounded and clamped, keep one of four, toggle, readers)', () => {
  assert.deepEqual(logic.normalise({}), logic.defaults);
  assert.deepEqual(logic.normalise(null), logic.defaults);
  const n = logic.normalise({ store: 'cloud', drift: 99, keep: 60, found: 0, fileReads: 'yes', readers: 'all' });
  assert.deepEqual(n, Object.assign({}, logic.defaults, { drift: 30, found: 1 }));
  assert.equal(logic.normalise({ drift: -3 }).drift, 0);
  assert.equal(logic.normalise({ drift: '7.6' }).drift, 8);
  assert.equal(logic.normalise({ drift: true }).drift, logic.defaults.drift);
  assert.equal(logic.normalise({ found: Infinity }).found, logic.defaults.found);
  assert.equal(logic.normalise({ found: 1000 }).found, 365);
  assert.equal(logic.normalise({ keep: '30' }).keep, 30);
  assert.equal(logic.normalise({ keep: 365 }).keep, 365);
  for (const k of [30, 90, 180, 365]) assert.equal(logic.normalise({ keep: k, found: 1 }).keep, k);
  assert.equal(logic.normalise({ found: '' }).found, logic.defaults.found);
  assert.equal(logic.normalise({ found: null }).found, logic.defaults.found);
  assert.equal(logic.normalise({ found: '  ' }).found, logic.defaults.found);
  assert.equal(logic.normalise({ fileReads: '0' }).fileReads, false);
  assert.equal(logic.normalise({ fileReads: 'false' }).fileReads, false);
  assert.equal(logic.normalise({ fileReads: 0 }).fileReads, false);
  assert.equal(logic.normalise({ fileReads: 1 }).fileReads, true);
  assert.equal(logic.normalise({ store: 'central', readers: 'named' }).readers, 'named');
  assert.deepEqual(Object.keys(logic.normalise({ readers: 'named', store: 'central' })), Object.keys(logic.defaults));
});

test('rule 10: 7 steps; now walks the night (23:10, 23:14, 23:20, 23:31) and then stays on the found day at 10:00', () => {
  assert.equal(LAST, 7);
  assert.deepEqual(logic.STAGES, ['start', 'login', 'change', 'export', 'cover', 'found', 'timeline', 'answers']);
  const nows = [];
  for (let n = 0; n <= LAST; n++) nows.push(at({ found: 45 }, n).now);
  assert.deepEqual(nows, [-1, T(23, 10), T(23, 14), T(23, 20), T(23, 31), T(10, 0, 45), T(10, 0, 45), T(10, 0, 45)]);
  assert.equal(at({}, 99).stage, 'answers');
  assert.equal(at({}, -2).stage, 'start');
  assert.equal(logic.step(null, 2.4, P({})).stage, 'change');
  assert.equal(logic.step(null, 2.6, P({})).stage, 'export');
  assert.equal(logic.step(null, 2.6, P({})).n, 3);
  assert.equal(at({}, 99).n, LAST);
});

test('rule 10: what the stage holds follows now: no record at the start, the wipe at 23:31, ageing only at the found step', () => {
  const s0 = at(CENTRAL, 0);
  assert.ok(s0.inv.actions.every((a) => a.copies.length === 0));
  const s1 = at(CENTRAL, 1);
  assert.deepEqual(s1.inv.actions.map((a) => a.copies.length), [2, 0, 0]);
  const s3 = at(CENTRAL, 3);
  assert.equal(s3.inv.actions[1].copies[0].status, 'kept');
  const s4 = at(CENTRAL, 4);
  assert.equal(s4.inv.actions[1].copies[0].status, 'wiped');
  assert.equal(s4.inv.wipes.length, 2);
  const k4 = at(Object.assign({ keep: 30 }, CENTRAL), 4);
  assert.equal(k4.inv.actions[0].copies[0].status, 'kept');
  const k5 = at(Object.assign({ keep: 30 }, CENTRAL), 5);
  assert.equal(k5.inv.actions[0].copies[0].status, 'aged');
  // the answers, the order and "aged" are those of the found day at every step
  assert.deepEqual(answers(at(Object.assign({ keep: 30 }, CENTRAL), 1)), answers(k5));
  assert.equal(at({ keep: 30 }, 1).aged, true);
  assert.deepEqual(at(CENTRAL, 1).order, at(CENTRAL, LAST).order);
  assert.deepEqual(at(Object.assign({ drift: 12 }, CENTRAL), 0).order, atPreset('drift', LAST).order);
});

test('rule 11: the five questions: who, what, data from their actions; order and tamper from the model; counts', () => {
  const s = atPreset('local', LAST);
  assert.deepEqual(s.questions.map((x) => x.id), logic.QUESTIONS);
  assert.deepEqual(s.questions.map((x) => x.id), ['who', 'what', 'data', 'order', 'tamper']);
  assert.equal(answers(s), 'who:yes what:no(wiped) data:no(wiped) order:no(gaps) tamper:partly(gap)');
  assert.equal(s.yes, 1);
  assert.equal(s.partly, 1);
  assert.equal(s.access.who, 'host');
  assert.equal(s.aged, false);
  assert.equal(at({ keep: 30 }, LAST).aged, true);
});

test('rule 12: caption keys at every step (sequence for the default)', () => {
  const seq = [];
  for (let n = 0; n <= LAST; n++) seq.push(logic.captionKeys(at({}, n)));
  assert.deepEqual(seq, [
    ['cStart', 'cStartLocal'], ['cLogin', 'cLoginLocal'], ['cChange'], ['cExport'], ['cCoverLocal'],
    ['cFound', 'cFoundKept'], ['cOrderNone'], ['cAnswersSome', 'cAccessHost']
  ]);
});

test('rule 12: caption keys by case (central, drift, unlogged, aged, order reasons, answer counts, access)', () => {
  const ck = (over, n) => logic.captionKeys(at(over, n));
  assert.deepEqual(ck(CENTRAL, 0), ['cStart', 'cStartCentral']);
  assert.deepEqual(ck(CENTRAL, 1), ['cLogin', 'cLoginCentral']);
  assert.deepEqual(ck(Object.assign({ drift: 1 }, CENTRAL), 3), ['cExport', 'cExportDrift']);
  assert.deepEqual(ck(Object.assign({ drift: 4, fileReads: false }, CENTRAL), 3), ['cExportUnlogged']);
  assert.deepEqual(ck(CENTRAL, 4), ['cCoverCentral']);
  assert.deepEqual(ck(Object.assign({ keep: 30 }, CENTRAL), 5), ['cFound', 'cFoundAged']);
  assert.deepEqual(ck(CENTRAL, 6), ['cOrderYes']);
  assert.deepEqual(ck(Object.assign({ fileReads: false }, CENTRAL), 6), ['cOrderGaps']);
  assert.deepEqual(ck(Object.assign({ drift: 3 }, CENTRAL), 6), ['cOrderLucky']);
  assert.deepEqual(ck(Object.assign({ drift: 6 }, CENTRAL), 6), ['cOrderTie']);
  assert.deepEqual(ck(Object.assign({ drift: 12 }, CENTRAL), 6), ['cOrderWrong']);
  assert.deepEqual(ck(Object.assign({ keep: 30 }, CENTRAL), 6), ['cOrderNone']);
  assert.deepEqual(ck(CENTRAL, LAST), ['cAnswersAll', 'cAccessNamed']);
  assert.deepEqual(ck({ store: 'central', readers: 'admins' }, LAST), ['cAnswersAll', 'cAccessAdmins']);
  assert.deepEqual(ck(Object.assign({ keep: 30 }, CENTRAL), LAST), ['cAnswersNone', 'cAccessNamed']);
  assert.deepEqual(ck(Object.assign({ drift: 12 }, CENTRAL), LAST), ['cAnswersCount', 'cAccessNamed']);
  assert.deepEqual(ck(Object.assign({ fileReads: false }, CENTRAL), LAST), ['cAnswersSome', 'cAccessNamed']);
  // "none" needs no partly answer either: the local store found within its retention still has the gap
  assert.deepEqual(ck({ store: 'local', found: 200 }, LAST), ['cAnswersNone', 'cAccessHost']);
});

test('captions: every key the model can name exists in both tables, and every caption key in the tables is reachable', () => {
  const named = new Set();
  const opts = [];
  for (const store of ['local', 'central']) for (const drift of [0, 3, 6, 12]) for (const keep of [30, 180])
    for (const fileReads of [true, false]) for (const readers of ['admins', 'named']) opts.push({ store, drift, keep, found: 45, fileReads, readers });
  for (const o of opts) for (let n = 0; n <= LAST; n++) logic.captionKeys(at(o, n)).forEach((k) => named.add(k));
  for (const k of named) assert.ok(k in strings.hr && k in strings.en, k);
  const all = Object.keys(strings.hr).filter((k) => /^c[A-Z]/.test(k));
  for (const k of all) assert.ok(named.has(k), 'unreachable caption key ' + k);
});

// ── presets ──

test('preset 1 local (= defaults): only the gateway\'s record is left; the gap shows something was deleted', () => {
  assert.deepEqual(preset('local').params, logic.defaults);
  const s = atPreset('local', LAST);
  assert.equal(answers(s), 'who:yes what:no(wiped) data:no(wiped) order:no(gaps) tamper:partly(gap)');
  assert.deepEqual([s.yes, s.partly, s.access.ok], [1, 1, false]);
});

test('preset 2 central: every question answered, the log read by named reviewers', () => {
  const s = atPreset('central', LAST);
  assert.equal(answers(s), 'who:yes what:yes data:yes order:yes tamper:yes');
  assert.deepEqual([s.yes, s.access.who, s.access.ok], [5, 'named', true]);
  assert.deepEqual(s.order.list.map((x) => x.stamp), [T(23, 10), T(23, 14), T(23, 20)]);
});

test('preset 3 drift: the copy is stamped 23:08 and seems to come before the 23:10 login', () => {
  const s = atPreset('drift', LAST);
  assert.equal(answers(s), 'who:yes what:yes data:yes order:no(wrong) tamper:yes');
  assert.deepEqual(s.order.list.map((x) => [x.id, x.stamp]), [['export', T(23, 8)], ['login', T(23, 10)], ['change', T(23, 14)]]);
  assert.equal(s.yes, 4);
});

test('preset 4 short-keep: kept 30 days, found on day 45: nothing is left; 180 days would answer everything', () => {
  const s = atPreset('short-keep', LAST);
  assert.equal(answers(s), 'who:no(aged) what:no(aged) data:no(aged) order:no(gaps) tamper:no(aged)');
  assert.equal(s.yes + s.partly, 0);
  assert.equal(at(Object.assign({}, preset('short-keep').params, { keep: 180 }), LAST).yes, 5);
  assert.equal(at(Object.assign({}, preset('short-keep').params, { keep: 90 }), LAST).yes, 5);
});

test('preset 5 not-logged: which personal data was copied is unknown; the order covers two actions', () => {
  const s = atPreset('not-logged', LAST);
  assert.equal(answers(s), 'who:yes what:yes data:no(unlogged) order:partly(gaps) tamper:yes');
  assert.deepEqual([s.yes, s.partly], [3, 1]);
});

test('preset 6 open-store: all five answered, but every admin (adm07 too) reads the log', () => {
  const s = atPreset('open-store', LAST);
  assert.equal(s.yes, 5);
  assert.deepEqual(s.access, { who: 'admins', ok: false });
});

test('presets: ids unique, params complete and valid, at most nine; the entry is a preset', () => {
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 3 && ids.length <= 9);
  for (const pr of logic.presets) {
    assert.deepEqual(Object.keys(pr.params).sort(), Object.keys(logic.defaults).sort(), pr.id);
    assert.deepEqual(logic.normalise(pr.params), pr.params, `${pr.id} params are already valid`);
    assert.equal(pr.step, 0, `${pr.id} opens at the start`);
  }
});

// ── strings and the page ──

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every string key the page names exists', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const keys = new Set();
  for (const m of html.matchAll(/\bt(?:\.n|\.parts)?\('([A-Za-z0-9]+)'\s*[,)]/g)) keys.add(m[1]);
  for (const k of ['Gw', 'Idm', 'Fs']) { keys.add('host' + k); keys.add('badge' + k); }
  for (const k of ['Login', 'Change', 'Export']) { keys.add('r' + k); keys.add('a' + k); }
  for (const k of ['Login', 'Change']) keys.add('ox' + k);
  for (const k of ['Who', 'What', 'Data', 'Order', 'Tamper']) { keys.add('q' + k); keys.add('y' + k); }
  for (const k of ['Host', 'Admins', 'Named']) keys.add('access' + k);
  for (const k of ['sWiped', 'sAged', 'sWipedL', 'sAgedL', 'whyUnlogged', 'whyWiped', 'whyAged', 'whyOrderGaps', 'whyOrderDrift',
    'whyOrderTie', 'whyOrderWrong', 'ansYes', 'ansPartly', 'ansNo', 'ansOk', 'ansBad', 'ansWait']) keys.add(k);
  for (const k of ['prLocal', 'prCentral', 'prDrift', 'prShortKeep', 'prNotLogged', 'prOpenStore']) { keys.add(k); keys.add(k + 'Hint'); }
  for (const k of keys) assert.ok(k in strings.hr && k in strings.en, k);
});

test('the page\'s meta matches sim.json and the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, logic.steps);
  assert.equal(json.steps, logic.steps);
  assert.deepEqual(meta.title, json.title);
  assert.deepEqual(meta.concept, json.concept);
  for (const e of json.entries) assert.ok(preset(e.preset), `entry ${e.preset} is a preset`);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.presets) {
    for (let n = 0; n <= LAST; n++) {
      const s = atPreset(pr.id, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(preset('drift').params);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= LAST; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = LAST; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const sc = structuredClone(SC);
  logic.step(s0, LAST, P(preset('drift').params));
  assert.deepEqual(SC, sc);
});

test('the model and the logs module are pure (no DOM, randomness, clock or timers)', () => {
  for (const f of ['sim.js', 'logs.js']) {
    const src = fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(src, /\b(document|window|Math\.random|Date|setTimeout|setInterval|localStorage)\b/, f);
  }
});
