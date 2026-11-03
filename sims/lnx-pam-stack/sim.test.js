// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-pam-stack's model: tie-breaks first, then one test per rule (SPEC.md), then the real run pinned,
// the presets' numbers, the page's actions (reorder, forced results), the captions, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const PR = (id, over) => P(Object.assign(logic.presetParams(id), over));
const steps = (p) => kit.stepsOf(logic, p);
const at = (p, n) => kit.stateAt(logic, p, n);
const end = (p) => at(p, steps(p));
const all = (p) => Array.from({ length: steps(p) + 1 }, (_, n) => at(p, n));

const FLAG = { req: 'required', rqs: 'requisite', suf: 'sufficient', opt: 'optional' };
const RES = { S: 'success', F: 'fail', I: 'ignore' };
/** 'req:F suf:S' → [{ flag, result }, …] */
const stack = (txt) => txt.split(' ').map((x) => { const [f, r] = x.split(':'); return { flag: FLAG[f], result: RES[r] }; });
const run = (txt) => logic.runStack(stack(txt));
/** The return code the real library gives: 0 success; PAM_PERM_DENIED (6) when nothing succeeded; else line k's own
    failure code, 7 + k (the real run gave line k pam_debug's auth_err, cred_insufficient, authinfo_unavail, …). */
const code = (r) => (r.final.ok ? 0 : r.final.how === 'end-none' ? 6 : 7 + r.final.by);

// ── tie-breaks ──

test('T1 (rule 6): two failing required lines: the first stays the reason', () => {
  const r = run('req:F req:F');
  assert.equal(r.final.ok, false);
  assert.equal(r.final.by, 0);
  assert.deepEqual(r.trace.map((t) => t.effect), ['sets-fail', 'keeps-fail']);
  assert.equal(run('req:S req:F req:F').final.by, 1, 'a success above does not move the reason');
});

test('T2 (rules 3, 6): requisite failing after a required failure returns there, citing the earlier line', () => {
  const r = run('req:F rqs:F req:S');
  assert.equal(r.trace.length, 2, 'line 3 never runs');
  assert.deepEqual(r.final, { ok: false, how: 'return-fail', by: 0, at: 1 });
});

test('T3 (rule 4): sufficient success after a required failure does not return; the stack runs on to its failure', () => {
  const r = run('req:F suf:S req:I');
  assert.equal(r.trace.length, 3);
  assert.equal(r.trace[1].effect, 'ok-ignored');
  assert.equal(r.trace[1].ret, false);
  assert.deepEqual(r.final, { ok: false, how: 'end-fail', by: 0, at: null });
});

test('T4 (rule 4): sufficient success after a required success returns, and the lines below never run', () => {
  const r = run('req:S suf:S req:F');
  assert.equal(r.trace.length, 2);
  assert.deepEqual(r.final, { ok: true, how: 'return-ok', by: 1, at: 1 });
});

test('T5 (rule 6): nothing succeeded → fail, with no deciding line', () => {
  for (const txt of ['req:I', 'suf:F', 'opt:F', 'req:I suf:F opt:I', 'opt:F suf:I']) {
    const r = run(txt);
    assert.deepEqual(r.final, { ok: false, how: 'end-none', by: null, at: null }, txt);
  }
});

// ── rules ──

test('rule 1: not first match: a success on top does not end a stack of required lines', () => {
  const r = run('req:S req:F');
  assert.equal(r.trace.length, 2);
  assert.equal(r.final.ok, false, 'first match would have said success at line 1');
  assert.equal(run('req:S req:S').final.how, 'end-ok');
});

test('rule 2: required: a failure fails the stack but every later line still runs', () => {
  const r = run('req:F req:S opt:S suf:S');
  assert.equal(r.trace.length, 4, 'every line runs');
  assert.deepEqual(r.trace.map((t) => t.ret), [false, false, false, false]);
  assert.equal(r.final.ok, false);
  assert.equal(run('req:S').final.ok, true, 'a required success alone logs in');
});

test('rule 3: requisite: a failure returns at once; a success goes on', () => {
  const r = run('rqs:F req:S suf:S');
  assert.equal(r.trace.length, 1);
  assert.deepEqual(r.final, { ok: false, how: 'return-fail', by: 0, at: 0 });
  assert.equal(run('rqs:S req:F').trace.length, 2);
  assert.equal(run('rqs:S req:F').final.ok, false);
});

test('rule 4: sufficient: success returns at once with no failure above; its failure is ignored', () => {
  assert.deepEqual(run('suf:S req:F').final, { ok: true, how: 'return-ok', by: 0, at: 0 });
  const f = run('suf:F req:S');
  assert.equal(f.trace[0].effect, 'fail-ignored');
  assert.equal(f.final.ok, true);
  assert.equal(run('suf:F').final.ok, false, 'an ignored failure is not a success either');
});

test('rule 5: optional: its failure is ignored; its success counts only when nothing else has set the verdict', () => {
  assert.equal(run('opt:S').final.ok, true, 'the only module: its success logs in');
  assert.equal(run('opt:F').final.ok, false, 'the only module: its failure does not');
  assert.equal(run('opt:F req:S').final.ok, true, 'its failure is ignored');
  assert.equal(run('opt:S req:F').final.ok, false, 'a required failure beats it');
  assert.equal(run('req:F opt:S').trace[1].effect, 'ok-ignored');
  assert.equal(run('req:S opt:S').trace[1].effect, 'adds-ok');
  // real run, beyond the man page's words: the sufficient failure is ignored, so the optional success decides
  assert.deepEqual(run('opt:S suf:F').final, { ok: true, how: 'end-ok', by: 0, at: null });
});

test('rule 6: the end: a failure decides over later successes; else the first success; ignore never counts', () => {
  assert.deepEqual(run('req:S req:F req:S').final, { ok: false, how: 'end-fail', by: 1, at: null });
  assert.deepEqual(run('req:I opt:S req:S').final, { ok: true, how: 'end-ok', by: 1, at: null });
  for (const f of logic.FLAGS) assert.equal(logic.apply(f, 'ignore', { verdict: 'ok', by: 0 }, 1).effect, 'ignored', f);
});

test('rule 7: the modules give the results the page names, for each user, password and /etc/nologin', () => {
  const r = (m, over) => logic.moduleResult(m, logic.attemptOf(P(over))).result;
  assert.equal(r('pam_unix', { user: 'ana' }), 'success');
  assert.equal(r('pam_unix', { user: 'root' }), 'success');
  assert.equal(r('pam_unix', { user: 'ana', password: false }), 'fail');
  assert.equal(r('pam_unix', { user: 'ivan' }), 'fail', 'not in /etc/shadow');
  assert.equal(r('pam_sss', { user: 'ivan' }), 'success');
  assert.equal(r('pam_sss', { user: 'ivan', password: false }), 'fail');
  assert.equal(r('pam_sss', { user: 'ana' }), 'fail', 'not in the directory');
  assert.equal(r('pam_deny', {}), 'fail');
  assert.equal(r('pam_permit', { password: false }), 'success');
  assert.equal(r('pam_echo', {}), 'success');
  assert.equal(r('pam_env', {}), 'ignore', 'real run: pam_env auth returns PAM_IGNORE');
  assert.equal(r('pam_nologin', { nologin: false }), 'ignore');
  assert.equal(r('pam_nologin', { nologin: true }), 'fail');
  assert.equal(r('pam_nologin', { nologin: true, user: 'root' }), 'ignore', 'root may still log in');
  // a forced result replaces the module's own
  const lines = logic.linesOf(P({ x2: 'fail' }));
  assert.equal(lines[1].module, 'pam_unix');
  assert.equal(lines[1].result, 'fail');
  assert.equal(lines[1].own, 'success');
  assert.equal(lines[1].why, 'forced');
});

// ── the real run (SPEC.md): every stack of one or two lines and the presets' shapes, as the library answered ──

const REAL = [
  'req:S 0/1', 'req:F 7/1', 'req:I 6/1', 'rqs:S 0/1', 'rqs:F 7/1', 'rqs:I 6/1',
  'suf:S 0/1', 'suf:F 6/1', 'suf:I 6/1', 'opt:S 0/1', 'opt:F 6/1', 'opt:I 6/1',
  'req:S req:S 0/2', 'req:S req:F 8/2', 'req:S req:I 0/2', 'req:S rqs:S 0/2', 'req:S rqs:F 8/2', 'req:S rqs:I 0/2',
  'req:S suf:S 0/2', 'req:S suf:F 0/2', 'req:S suf:I 0/2', 'req:S opt:S 0/2', 'req:S opt:F 0/2', 'req:S opt:I 0/2',
  'req:F req:S 7/2', 'req:F req:F 7/2', 'req:F req:I 7/2', 'req:F rqs:S 7/2', 'req:F rqs:F 7/2', 'req:F rqs:I 7/2',
  'req:F suf:S 7/2', 'req:F suf:F 7/2', 'req:F suf:I 7/2', 'req:F opt:S 7/2', 'req:F opt:F 7/2', 'req:F opt:I 7/2',
  'req:I req:S 0/2', 'req:I req:F 8/2', 'req:I req:I 6/2', 'req:I rqs:S 0/2', 'req:I rqs:F 8/2', 'req:I rqs:I 6/2',
  'req:I suf:S 0/2', 'req:I suf:F 6/2', 'req:I suf:I 6/2', 'req:I opt:S 0/2', 'req:I opt:F 6/2', 'req:I opt:I 6/2',
  'rqs:S req:S 0/2', 'rqs:S req:F 8/2', 'rqs:S req:I 0/2', 'rqs:S rqs:S 0/2', 'rqs:S rqs:F 8/2', 'rqs:S rqs:I 0/2',
  'rqs:S suf:S 0/2', 'rqs:S suf:F 0/2', 'rqs:S suf:I 0/2', 'rqs:S opt:S 0/2', 'rqs:S opt:F 0/2', 'rqs:S opt:I 0/2',
  'rqs:F req:S 7/1', 'rqs:F req:F 7/1', 'rqs:F req:I 7/1', 'rqs:F rqs:S 7/1', 'rqs:F rqs:F 7/1', 'rqs:F rqs:I 7/1',
  'rqs:F suf:S 7/1', 'rqs:F suf:F 7/1', 'rqs:F suf:I 7/1', 'rqs:F opt:S 7/1', 'rqs:F opt:F 7/1', 'rqs:F opt:I 7/1',
  'rqs:I req:S 0/2', 'rqs:I req:F 8/2', 'rqs:I req:I 6/2', 'rqs:I rqs:S 0/2', 'rqs:I rqs:F 8/2', 'rqs:I rqs:I 6/2',
  'rqs:I suf:S 0/2', 'rqs:I suf:F 6/2', 'rqs:I suf:I 6/2', 'rqs:I opt:S 0/2', 'rqs:I opt:F 6/2', 'rqs:I opt:I 6/2',
  'suf:S req:S 0/1', 'suf:S req:F 0/1', 'suf:S req:I 0/1', 'suf:S rqs:S 0/1', 'suf:S rqs:F 0/1', 'suf:S rqs:I 0/1',
  'suf:S suf:S 0/1', 'suf:S suf:F 0/1', 'suf:S suf:I 0/1', 'suf:S opt:S 0/1', 'suf:S opt:F 0/1', 'suf:S opt:I 0/1',
  'suf:F req:S 0/2', 'suf:F req:F 8/2', 'suf:F req:I 6/2', 'suf:F rqs:S 0/2', 'suf:F rqs:F 8/2', 'suf:F rqs:I 6/2',
  'suf:F suf:S 0/2', 'suf:F suf:F 6/2', 'suf:F suf:I 6/2', 'suf:F opt:S 0/2', 'suf:F opt:F 6/2', 'suf:F opt:I 6/2',
  'suf:I req:S 0/2', 'suf:I req:F 8/2', 'suf:I req:I 6/2', 'suf:I rqs:S 0/2', 'suf:I rqs:F 8/2', 'suf:I rqs:I 6/2',
  'suf:I suf:S 0/2', 'suf:I suf:F 6/2', 'suf:I suf:I 6/2', 'suf:I opt:S 0/2', 'suf:I opt:F 6/2', 'suf:I opt:I 6/2',
  'opt:S req:S 0/2', 'opt:S req:F 8/2', 'opt:S req:I 0/2', 'opt:S rqs:S 0/2', 'opt:S rqs:F 8/2', 'opt:S rqs:I 0/2',
  'opt:S suf:S 0/2', 'opt:S suf:F 0/2', 'opt:S suf:I 0/2', 'opt:S opt:S 0/2', 'opt:S opt:F 0/2', 'opt:S opt:I 0/2',
  'opt:F req:S 0/2', 'opt:F req:F 8/2', 'opt:F req:I 6/2', 'opt:F rqs:S 0/2', 'opt:F rqs:F 8/2', 'opt:F rqs:I 6/2',
  'opt:F suf:S 0/2', 'opt:F suf:F 6/2', 'opt:F suf:I 6/2', 'opt:F opt:S 0/2', 'opt:F opt:F 6/2', 'opt:F opt:I 6/2',
  'opt:I req:S 0/2', 'opt:I req:F 8/2', 'opt:I req:I 6/2', 'opt:I rqs:S 0/2', 'opt:I rqs:F 8/2', 'opt:I rqs:I 6/2',
  'opt:I suf:S 0/2', 'opt:I suf:F 6/2', 'opt:I suf:I 6/2', 'opt:I opt:S 0/2', 'opt:I opt:F 6/2', 'opt:I opt:I 6/2',
  'req:I suf:S suf:F req:F 0/2', 'req:I suf:F suf:S req:F 0/3', 'req:I suf:F suf:F req:F 10/4', 'req:F req:I opt:S 7/3', 'rqs:F req:S 7/1', 'req:I req:F suf:S suf:F 8/4',
  'suf:S req:I suf:F suf:F req:F 0/1', 'req:F suf:S req:I 7/3', 'req:F rqs:F req:S 7/2', 'opt:S suf:F 0/2', 'opt:F req:S 0/2', 'req:S opt:F suf:S 0/3',
];

test('the model gives the real library\'s code and number of lines run for every pinned stack', () => {
  assert.equal(REAL.length, 12 + 144 + 12);
  for (const row of REAL) {
    const [, txt, c, n] = row.match(/^(.*) (\d+)\/(\d+)$/);
    const r = run(txt);
    assert.equal(code(r), Number(c), txt + ': code');
    assert.equal(r.trace.length, Number(n), txt + ': lines run');
  }
});

// ── the presets (SPEC.md table) ──

test('preset numbers: steps, verdict and the deciding line', () => {
  const rows = [
    ['unix-then-sss', {}, 3, 'return-ok', 2],
    ['unix-then-sss', { user: 'ivan' }, 4, 'return-ok', 3],
    ['unix-then-sss', { user: 'root' }, 3, 'return-ok', 2],
    ['unix-then-sss', { password: false }, 5, 'end-fail', 4],
    ['required-runs-on', {}, 4, 'end-fail', 1],
    ['requisite-stops', {}, 2, 'return-fail', 1],
    ['deny-too-early', {}, 5, 'end-fail', 2],
    ['permit-first', {}, 2, 'return-ok', 1],
    ['required-then-sufficient', {}, 4, 'end-fail', 1]
  ];
  for (const [id, over, n, how, by] of rows) {
    const p = PR(id, over);
    assert.equal(steps(p), n, id + ' steps');
    const e = end(p);
    assert.equal(e.final.how, how, id);
    assert.equal(e.final.by + 1, by, id + ' by');
  }
  assert.equal(steps(P({})), 3, 'the defaults are preset 1');
});

test('presets: the point each one makes', () => {
  // unix-then-sss, ivan: pam_unix fails and is ignored, pam_sss logs in at line 3
  const ivan = end(PR('unix-then-sss', { user: 'ivan' }));
  assert.deepEqual(ivan.lines.map((l) => l.effect), ['ignored', 'fail-ignored', 'returns-ok', null]);
  assert.equal(ivan.lines[3].skipped, true);
  // required-runs-on: line 1 fails, lines 2 and 3 still run
  const ro = end(PR('required-runs-on'));
  assert.deepEqual(ro.lines.map((l) => l.ran), [true, true, true]);
  // requisite-stops: the password is never checked
  const rs = end(PR('requisite-stops'));
  assert.equal(rs.lines[1].ran, false);
  assert.ok(logic.captionOf(rs).extra.some((x) => x.key === 'xNoPwCheck'));
  // deny-too-early: the right password, and nobody logs in
  for (const user of logic.USER_IDS) assert.equal(end(PR('deny-too-early', { user })).final.ok, false, user);
  // permit-first: any password
  for (const password of [true, false]) for (const user of logic.USER_IDS) {
    assert.equal(end(PR('permit-first', { user, password })).final.ok, true, user + password);
  }
  // required-then-sufficient: the sufficient success is ignored, line 3 still runs
  const rts = at(PR('required-then-sufficient'), 2);
  assert.equal(rts.lines[1].effect, 'ok-ignored');
  assert.equal(logic.captionOf(rts).key, 'e_ok_ignored_suff');
  assert.equal(end(PR('required-then-sufficient')).lines[2].ran, true);
});

// ── the page's actions ──

test('reorder: movePatch moves a line with its flag and forced result', () => {
  const p = P({ x4: 'success' });
  const patch = logic.movePatch(p, 3, 1);           // pam_deny from line 4 to line 2
  const q = Object.assign({}, p, patch);
  assert.deepEqual(logic.linesOf(q).map((l) => l.flag + ' ' + l.module + ' ' + l.force),
    ['required pam_env auto', 'required pam_deny success', 'sufficient pam_unix auto', 'sufficient pam_sss auto']);
  assert.deepEqual(logic.movePatch(p, 9, 0), {}, 'no such line');
  const low = Object.assign({}, p, logic.movePatch(p, 2, -1));
  assert.equal(logic.linesOf(low)[0].module, 'pam_sss', 'moving above the top stops at the first line');
  assert.equal(logic.linesOf(low).length, 4);
  const clamp = Object.assign({}, p, logic.movePatch(p, 0, 99));
  assert.equal(logic.linesOf(clamp)[3].module, 'pam_env', 'moving past the end stops at the last line');
  // empty slots in the middle are compacted; the line count stays
  const gap = P({ m2: '-' });
  assert.equal(logic.linesOf(gap).length, 3);
  assert.equal(logic.linesOf(Object.assign({}, gap, logic.movePatch(gap, 2, 0)))[0].module, 'pam_deny');
});

test('a reorder is the misconfiguration: deny above sufficient pam_unix refuses everybody', () => {
  const p = P({});
  const moved = Object.assign({}, p, logic.movePatch(p, 3, 1));
  assert.equal(end(p).final.ok, true);
  assert.equal(end(moved).final.ok, false);
  assert.deepEqual(logic.linesOf(moved).map((l) => l.module), logic.PRESETS[3].stack.map((x) => x[1]));
});

test('fail some: forcing a result changes that line only, and the steps follow', () => {
  const p = P({ x2: 'fail' });                       // pam_unix forced to fail: pam_sss fails for ana, pam_deny
  assert.equal(steps(p), 5);
  assert.equal(end(p).final.by, 3);
  assert.equal(steps(P({ x1: 'success' })), 3, 'pam_env forced to success sets the verdict, pam_unix still returns');
  assert.equal(end(P({ x1: 'fail' })).final.ok, false, 'a forced required failure: the sufficient success no longer returns');
});

// ── frames and captions ──

test('frames follow every param that shapes them (the memo key)', () => {
  for (const [k, a, b] of [['nologin', true, false], ['password', true, false], ['user', 'ana', 'ivan'], ['x2', 'auto', 'fail'], ['f2', 'sufficient', 'required'], ['m4', 'pam_deny', '-']]) {
    const pa = PR('requisite-stops', { [k]: a }), pb = PR('requisite-stops', { [k]: b });
    const ea = JSON.stringify(logic.frames(pa)), eb = JSON.stringify(logic.frames(pb));
    assert.equal(ea, JSON.stringify(logic.framesOf(pa)), k + '=' + a);
    assert.equal(eb, JSON.stringify(logic.framesOf(pb)), k + '=' + b);
  }
});

test('frames: the attempt, one step per line run, then the verdict; skipped lines are marked', () => {
  const p = PR('requisite-stops');
  const fr = all(p);
  assert.deepEqual(fr.map((s) => s.phase), ['start', 'line', 'verdict']);
  assert.deepEqual(fr[0].lines.map((l) => l.result), [null, null]);
  assert.equal(fr[1].i, 0);
  assert.equal(fr[1].returnedAt, 0);
  assert.deepEqual(fr[1].lines.map((l) => l.skipped), [false, true]);
  assert.equal(fr[1].failed, true);
  assert.equal(fr[1].firstFail, 0);
  assert.equal(fr[2].final.ok, false);
  const ok = all(P({}));
  assert.deepEqual(ok.map((s) => s.verdict), ['none', 'none', 'ok', 'ok']);
  assert.deepEqual(ok.map((s) => s.anySuccess), [false, false, true, true]);
});

test('captions pick the sentence for each effect and verdict, and the misconception it answers', () => {
  const keyAt = (p, n) => { const c = logic.captionOf(at(p, n)); return c.effect ? c.effect.key : c.key; };
  assert.equal(keyAt(P({}), 0), 'cStart');
  assert.equal(keyAt(P({}), 1), 'e_ignored');
  assert.equal(keyAt(P({}), 2), 'e_returns_ok');
  assert.equal(keyAt(P({}), 3), 'vReturnOk');
  assert.equal(keyAt(PR('required-runs-on'), 1), 'e_sets_fail');
  assert.equal(keyAt(PR('required-runs-on'), 3), 'e_ok_ignored');
  assert.equal(keyAt(PR('required-runs-on'), 4), 'vEndFail');
  assert.equal(keyAt(PR('requisite-stops'), 1), 'e_sets_fail_requisite');
  assert.equal(keyAt(PR('unix-then-sss', { user: 'ivan' }), 2), 'e_fail_ignored_suff');
  assert.equal(keyAt(P({ m1: 'pam_echo', f1: 'optional' }), 1), 'e_sets_ok_opt');
  assert.equal(keyAt(P(logic.stackParams([['optional', 'pam_deny'], ['required', 'pam_permit']])), 1), 'e_fail_ignored_opt');
  assert.equal(keyAt(P(logic.stackParams([['required', 'pam_permit'], ['required', 'pam_echo']])), 2), 'e_adds_ok');
  assert.equal(keyAt(P(logic.stackParams([['required', 'pam_permit'], ['required', 'pam_echo']])), 3), 'vEndOk');
  assert.equal(keyAt(P(logic.stackParams([['required', 'pam_deny'], ['required', 'pam_deny']])), 2), 'e_keeps_fail');
  const rq = P(logic.stackParams([['required', 'pam_deny'], ['requisite', 'pam_deny'], ['required', 'pam_permit']]));
  assert.equal(keyAt(rq, 2), 'e_keeps_fail_requisite');
  assert.equal(keyAt(rq, 3), 'vReturnFailEarlier');
  assert.deepEqual(logic.captionOf(end(rq)).vars, { line: '1', flag: 'required', module: 'pam_deny', rline: '2', rmodule: 'pam_deny' });
  assert.equal(at(rq, 2).firstFail, 0, 'a later failure keeps the first as firstFail');
  assert.equal(logic.captionOf(at(P({}), 0)).vars.n, 4, 'cStart takes a number for its plural');
  assert.equal(keyAt(P(logic.stackParams([['required', 'pam_env']])), 2), 'vEndNone');
  // the extras: lines not run, a wrong password let in, a right one refused, no password checked
  assert.deepEqual(logic.captionOf(at(P({}), 2)).extra, [{ key: 'notRun', vars: { n: 2 } }]);
  const extras = (p) => logic.captionOf(end(p)).extra.map((x) => x.key);
  assert.deepEqual(extras(PR('permit-first')), ['xWrongPwIn', 'xNoPwCheck']);
  assert.deepEqual(extras(PR('deny-too-early')), ['xRightPwOut']);
  assert.deepEqual(extras(PR('requisite-stops')), ['xNoPwCheck']);
  assert.deepEqual(extras(P({})), []);
  // a forced pam_unix, or pam_unix not knowing the user, checked no password
  assert.ok(extras(P({ x2: 'success' })).includes('xNoPwCheck'));
  assert.ok(!extras(PR('unix-then-sss', { user: 'ivan' })).includes('xNoPwCheck'), 'pam_sss checked it');
  assert.ok(extras(P(Object.assign(logic.stackParams([['required', 'pam_unix']]), { user: 'ivan' }))).includes('xNoPwCheck'));
  // every key the model names exists in the tables
  const keys = new Set();
  for (const pr of logic.PRESETS) for (const user of logic.USER_IDS) for (const password of [true, false]) for (const nologin of [true, false]) {
    for (const s of all(PR(pr.id, { user, password, nologin }))) {
      const c = logic.captionOf(s);
      keys.add(c.key);
      if (c.effect) keys.add(c.effect.key);
      c.extra.forEach((x) => keys.add(x.key));
      s.lines.forEach((l) => { if (l.result) { keys.add('res_' + l.result); keys.add('why_' + l.why); } });
    }
  }
  for (const k of keys) for (const lang of ['hr', 'en']) assert.ok(k in strings[lang], lang + ': ' + k);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.PRESETS) for (const s of all(PR(pr.id))) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  const p = PR('deny-too-early', { user: 'ivan' });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input, and the memoised frames are not shared', () => {
  const p = PR('required-runs-on');
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  at(p, 2).lines[0].effect = 'tampered';
  assert.notEqual(at(p, 2).lines[0].effect, 'tampered');
});

test('unknown flags, results and modules are errors, not silent', () => {
  assert.throws(() => logic.apply('include', 'success', { verdict: 'none', by: null }, 0));
  assert.throws(() => logic.apply('required', 'maybe', { verdict: 'none', by: null }, 0));
  assert.throws(() => logic.moduleResult('pam_x', logic.attemptOf(P({}))));
  // a bad param value falls back to a valid one
  assert.equal(logic.linesOf(P({ f1: 'nonsense', x1: 'nonsense' }))[0].flag, 'required');
  assert.equal(logic.attemptOf(P({ user: 'mallory' })).user, 'ana');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page, sim.json and the model agree: steps, presets and entries', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, steps(P({})));
  assert.equal(sim.steps, steps(P({})));
  for (const pr of logic.PRESETS) {
    for (const k of Object.keys(logic.presetParams(pr.id))) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
    assert.ok(html.includes(`'${pr.id}'`), `the page lists preset ${pr.id}`);
  }
  for (const e of sim.entries || []) assert.ok(logic.PRESETS.some((x) => x.id === e.preset), e.preset);
});
