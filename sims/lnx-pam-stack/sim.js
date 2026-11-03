/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-pam-stack: the `auth` section of one /etc/pam.d/ file decides a login. The lines run top to bottom;
   each module returns success, failure or "ignore", and the line's control flag (required, requisite, sufficient,
   optional) combines that result with the verdict so far and says whether the stack goes on or returns. It is not
   "first match": a failed `required` lets the stack run on, a `sufficient` success after it is ignored.
   The combination is Linux-PAM's dispatcher (libpam/pam_dispatch.c, _pam_dispatch_aux) restricted to the four
   keywords, and was checked against the real library on every stack of up to four lines (SPEC.md, "Real run").
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The reusable part (FLAGS, apply, runStack)
   works on plain data and is promotable to models/ unchanged.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var FLAGS = ['required', 'requisite', 'sufficient', 'optional'];
  var RESULTS = ['success', 'fail', 'ignore'];
  var MODULES = ['pam_env', 'pam_unix', 'pam_sss', 'pam_deny', 'pam_permit', 'pam_nologin', 'pam_echo'];
  var FORCES = ['auto', 'success', 'fail'];
  var USERS = { ana: { kind: 'local', root: false }, ivan: { kind: 'sss', root: false }, root: { kind: 'local', root: true } };
  var USER_IDS = ['ana', 'ivan', 'root'];
  var SLOTS = 5;

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── the core: one line's flag applied to the verdict so far (rules 1–6) ──

  /**
   * One line. v is the verdict so far: { verdict: 'none' | 'ok' | 'fail', by: line index | null }, where `by` is the
   * line that set it (the first success, or the first failure: rule 6's tie-break). Returns
   * { effect, ret, verdict, by }: what the flag did, whether the stack returns here, and the verdict after the line.
   *   effects: 'ignored' (the module said ignore), 'fail-ignored' (sufficient/optional failure), 'sets-fail',
   *   'keeps-fail' (a later required/requisite failure: the first stays the reason), 'sets-ok', 'adds-ok',
   *   'ok-ignored' (a success after a failure, any flag), 'returns-ok' (sufficient success, no failure above).
   */
  function apply(flag, result, v, i) {
    var out = { effect: null, ret: false, verdict: v.verdict, by: v.by };
    if (FLAGS.indexOf(flag) < 0) throw new Error('unknown control flag: ' + flag);
    if (RESULTS.indexOf(result) < 0) throw new Error('unknown result: ' + result);
    if (result === 'ignore') { out.effect = 'ignored'; return out; }
    if (result === 'success') {
      if (v.verdict === 'fail') { out.effect = 'ok-ignored'; return out; }   // rules 2 and 4: a failure above stands
      if (flag === 'sufficient') {                                          // rule 4: returns at once
        out.effect = 'returns-ok'; out.ret = true; out.verdict = 'ok'; out.by = i;
        return out;
      }
      if (v.verdict === 'none') { out.effect = 'sets-ok'; out.verdict = 'ok'; out.by = i; }
      else out.effect = 'adds-ok';
      return out;
    }
    // failure
    if (flag === 'sufficient' || flag === 'optional') { out.effect = 'fail-ignored'; return out; }  // rules 4 and 5
    if (v.verdict !== 'fail') { out.effect = 'sets-fail'; out.verdict = 'fail'; out.by = i; }      // rule 2
    else out.effect = 'keeps-fail';                                                                // rule 6 tie-break
    if (flag === 'requisite') out.ret = true;                                                      // rule 3
    return out;
  }

  /**
   * A whole stack: lines [{ flag, result }]. Returns { trace: [{ effect, ret, verdict, by }] for the lines that ran,
   * final: { ok, how, by, at } }: how is 'return-ok' | 'return-fail' | 'end-ok' | 'end-fail' | 'end-none'; by is the line
   * that decided (null for end-none: no module succeeded), at the line where the stack returned (null at the end).
   */
  function runStack(lines) {
    var v = { verdict: 'none', by: null };
    var trace = [];
    for (var i = 0; i < lines.length; i++) {
      var r = apply(lines[i].flag, lines[i].result, v, i);
      trace.push(r);
      v = { verdict: r.verdict, by: r.by };
      if (r.ret) {
        return { trace: trace, final: r.verdict === 'ok'
          ? { ok: true, how: 'return-ok', by: i, at: i }
          : { ok: false, how: 'return-fail', by: r.by, at: i } };
      }
    }
    // rule 6: the end of the stack
    if (v.verdict === 'fail') return { trace: trace, final: { ok: false, how: 'end-fail', by: v.by, at: null } };
    if (v.verdict === 'ok') return { trace: trace, final: { ok: true, how: 'end-ok', by: v.by, at: null } };
    return { trace: trace, final: { ok: false, how: 'end-none', by: null, at: null } };
  }

  // ── the modules (rule 7): what each one returns for this login attempt ──

  /**
   * attempt: { user, kind: 'local' | 'sss', root, passwordOk, nologin }. Returns { result, why } where why names the
   * reason (a string key the page translates).
   */
  function moduleResult(module, a) {
    switch (module) {
      case 'pam_unix':
        if (a.kind !== 'local') return { result: 'fail', why: 'notLocal' };
        return a.passwordOk ? { result: 'success', why: 'pwOk' } : { result: 'fail', why: 'pwBad' };
      case 'pam_sss':
        if (a.kind !== 'sss') return { result: 'fail', why: 'notSss' };
        return a.passwordOk ? { result: 'success', why: 'pwOk' } : { result: 'fail', why: 'pwBad' };
      case 'pam_deny': return { result: 'fail', why: 'deny' };
      case 'pam_permit': return { result: 'success', why: 'permit' };
      case 'pam_nologin':
        if (!a.nologin) return { result: 'ignore', why: 'noFile' };
        return a.root ? { result: 'ignore', why: 'rootPasses' } : { result: 'fail', why: 'nologin' };
      case 'pam_env': return { result: 'ignore', why: 'env' };
      case 'pam_echo': return { result: 'success', why: 'echo' };
    }
    throw new Error('unknown module: ' + module);
  }

  // ── params → the stack and the attempt ──

  function attemptOf(p) {
    var user = USERS[p.user] ? p.user : 'ana';
    return { user: user, kind: USERS[user].kind, root: USERS[user].root, passwordOk: !!p.password, nologin: !!p.nologin };
  }

  /** The lines in the slots m1…m5 (an empty slot is '-'), with their flags f1…f5 and forced results x1…x5. */
  function linesOf(p) {
    var a = attemptOf(p);
    var out = [];
    for (var k = 1; k <= SLOTS; k++) {
      var m = p['m' + k];
      if (MODULES.indexOf(m) < 0) continue;
      var flag = FLAGS.indexOf(p['f' + k]) >= 0 ? p['f' + k] : 'required';
      var force = FORCES.indexOf(p['x' + k]) >= 0 ? p['x' + k] : 'auto';
      var own = moduleResult(m, a);
      out.push({ slot: k, flag: flag, module: m, force: force,
        result: force === 'auto' ? own.result : force, why: force === 'auto' ? own.why : 'forced', own: own.result });
    }
    return out;
  }

  /** The slots that hold a line, in order (the page maps a line to its slot for reorder and edits). */
  function slotsOf(p) {
    var out = [];
    for (var k = 1; k <= SLOTS; k++) if (MODULES.indexOf(p['m' + k]) >= 0) out.push(k);
    return out;
  }

  /** Move line `from` (0-based, among the lines) to position `to`: a params patch for m, f and x in every slot. */
  function movePatch(p, from, to) {
    var slots = slotsOf(p);
    var rows = slots.map(function (k) { return { m: p['m' + k], f: p['f' + k], x: p['x' + k] }; });
    if (from < 0 || from >= rows.length) return {};
    to = Math.max(0, Math.min(rows.length - 1, to));
    var moved = rows.splice(from, 1)[0];
    rows.splice(to, 0, moved);
    var patch = {};
    for (var k = 1; k <= SLOTS; k++) {
      var r = rows[k - 1];
      patch['m' + k] = r ? r.m : '-';
      patch['f' + k] = r ? r.f : 'required';
      patch['x' + k] = r ? r.x : 'auto';
    }
    return patch;
  }

  // ── frames: step 0 the attempt; one step per line run; the last step the verdict ──

  function framesOf(p) {
    var attempt = attemptOf(p);
    var lines = linesOf(p);
    var run = runStack(lines);
    var s = {
      phase: 'start',
      attempt: attempt,
      lines: lines.map(function (l) {
        return { flag: l.flag, module: l.module, force: l.force, result: null, why: null, effect: null,
          verdict: null, by: null, ran: false, skipped: false };
      }),
      i: -1,                 // the line evaluated in this step
      verdict: 'none',       // the verdict so far
      by: null,              // the line that set it
      failed: false, firstFail: null, anySuccess: false,
      returnedAt: null,
      final: null,
      changed: []
    };
    var frames = [clone(s)];
    run.trace.forEach(function (r, i) {
      var l = s.lines[i];
      l.result = lines[i].result; l.why = lines[i].why; l.effect = r.effect;
      l.verdict = r.verdict; l.by = r.by; l.ran = true;
      s.phase = 'line';
      s.i = i;
      s.verdict = r.verdict; s.by = r.by;
      s.failed = r.verdict === 'fail';
      s.firstFail = s.failed ? r.by : null;
      s.anySuccess = s.anySuccess || r.effect === 'sets-ok' || r.effect === 'adds-ok' || r.effect === 'returns-ok';
      if (r.ret) {
        s.returnedAt = i;
        for (var k = i + 1; k < s.lines.length; k++) s.lines[k].skipped = true;
      }
      s.changed = ['line', 'verdict'];
      frames.push(clone(s));
    });
    s.phase = 'verdict';
    s.i = -1;
    s.final = run.final;
    s.changed = ['final'];
    frames.push(clone(s));
    return frames;
  }

  // ── captions: which sentence, and its data (pure; the page fills the strings) ──

  /** Did a line that ran compare the password? (Not a forced result, and not a module that did not know the user.) */
  function passwordChecked(s) {
    return s.lines.some(function (l) { return l.ran && (l.why === 'pwOk' || l.why === 'pwBad'); });
  }

  /**
   * The caption of a state: { key, vars, extra: [{ key, vars }] }. A string in vars is data (a module, a flag, a line
   * number: shown as code or a number), { t: key } a word from the tables.
   */
  function captionOf(s) {
    var a = s.attempt;
    if (s.phase === 'start') {
      return { key: 'cStart', vars: { user: a.user, n: s.lines.length }, extra: [] };
    }
    if (s.phase === 'line') {
      var l = s.lines[s.i];
      var head = { line: String(s.i + 1), flag: l.flag, module: l.module, res: { t: 'res_' + l.result }, why: { t: 'why_' + l.why } };
      var key = 'e_' + l.effect.replace(/-/g, '_');
      var vars = Object.assign({}, head);
      if (l.effect === 'keeps-fail' || l.effect === 'ok-ignored') {
        var f = s.lines[s.by];
        vars.first = String(s.by + 1); vars.fflag = f.flag; vars.fmodule = f.module;
        if (l.effect === 'ok-ignored' && l.flag === 'sufficient') key = 'e_ok_ignored_suff';
      }
      if (l.effect === 'sets-fail' && l.flag === 'requisite') key = 'e_sets_fail_requisite';
      if (l.effect === 'keeps-fail' && l.flag === 'requisite') key = 'e_keeps_fail_requisite';
      if (l.effect === 'fail-ignored') key = l.flag === 'sufficient' ? 'e_fail_ignored_suff' : 'e_fail_ignored_opt';
      if (l.effect === 'sets-ok' && l.flag === 'optional') key = 'e_sets_ok_opt';
      var extra = [];
      if (l.effect === 'returns-ok' || l.effect === 'sets-fail' && l.flag === 'requisite' || l.effect === 'keeps-fail' && l.flag === 'requisite') {
        var left = s.lines.length - s.i - 1;
        if (left > 0) extra.push({ key: 'notRun', vars: { n: left } });
      }
      // the task's caption for a sufficient success after a failure is a whole sentence of its own
      if (key === 'e_ok_ignored_suff') return { key: key, vars: vars, effect: null, extra: extra };
      return { key: 'cLine', vars: vars, effect: { key: key, vars: vars }, extra: extra };
    }
    // verdict
    var fin = s.final;
    var d = fin.by != null ? s.lines[fin.by] : null;
    var fv = d ? { line: String(fin.by + 1), flag: d.flag, module: d.module } : {};
    if (fin.how === 'return-fail' && fin.by !== fin.at) {
      var r = s.lines[fin.at];
      fv.rline = String(fin.at + 1); fv.rmodule = r.module;
    }
    var key2 = { 'return-ok': 'vReturnOk', 'return-fail': fin.by === fin.at ? 'vReturnFail' : 'vReturnFailEarlier',
      'end-ok': 'vEndOk', 'end-fail': 'vEndFail', 'end-none': 'vEndNone' }[fin.how];
    var extra2 = [];
    // the misconceptions the presets aim at
    if (fin.ok && !a.passwordOk) extra2.push({ key: 'xWrongPwIn', vars: {} });
    var ownOk = a.passwordOk && !(a.nologin && !a.root);
    if (!fin.ok && ownOk) extra2.push({ key: 'xRightPwOut', vars: {} });
    if (!passwordChecked(s)) extra2.push({ key: 'xNoPwCheck', vars: {} });
    return { key: key2, vars: fv, extra: extra2 };
  }

  /** Frames for the page's params (memoised on the params that shape them). */
  var memo = {};
  function keyOf(p) {
    var k = [p.user, !!p.password, !!p.nologin];
    for (var i = 1; i <= SLOTS; i++) k.push(p['m' + i], p['f' + i], p['x' + i]);
    return k.join('|');
  }
  function frames(p) {
    var key = keyOf(p);
    if (!memo[key]) memo[key] = framesOf(p);
    return memo[key];
  }
  function stateAt(p, n) { var fr = frames(p); return clone(fr[Math.max(0, Math.min(n, fr.length - 1))]); }

  /** Params for a stack written as [[flag, module, force?], …] (presets and tests). */
  function stackParams(rows) {
    var out = {};
    for (var k = 1; k <= SLOTS; k++) {
      var r = rows[k - 1];
      out['m' + k] = r ? r[1] : '-';
      out['f' + k] = r ? r[0] : 'required';
      out['x' + k] = r && r[2] ? r[2] : 'auto';
    }
    return out;
  }

  /** The presets' stacks and attempts (task "Presets"; SPEC.md). */
  var UNIX_THEN_SSS = [['required', 'pam_env'], ['sufficient', 'pam_unix'], ['sufficient', 'pam_sss'], ['required', 'pam_deny']];
  var PRESETS = [
    { id: 'unix-then-sss', stack: UNIX_THEN_SSS, attempt: { user: 'ana', password: true, nologin: false } },
    { id: 'required-runs-on', stack: [['required', 'pam_unix'], ['required', 'pam_env'], ['optional', 'pam_echo']],
      attempt: { user: 'ana', password: false, nologin: false } },
    { id: 'requisite-stops', stack: [['requisite', 'pam_nologin'], ['required', 'pam_unix']],
      attempt: { user: 'ana', password: true, nologin: true } },
    { id: 'deny-too-early', stack: [['required', 'pam_env'], ['required', 'pam_deny'], ['sufficient', 'pam_unix'], ['sufficient', 'pam_sss']],
      attempt: { user: 'ana', password: true, nologin: false } },
    { id: 'permit-first', stack: [['sufficient', 'pam_permit']].concat(UNIX_THEN_SSS),
      attempt: { user: 'ana', password: false, nologin: false } },
    { id: 'required-then-sufficient', stack: [['required', 'pam_nologin'], ['sufficient', 'pam_unix'], ['required', 'pam_env']],
      attempt: { user: 'ana', password: true, nologin: true } }
  ];
  function presetParams(id) {
    var pr = PRESETS.filter(function (x) { return x.id === id; })[0];
    if (!pr) throw new Error('unknown preset: ' + id);
    return Object.assign({}, pr.attempt, stackParams(pr.stack));
  }

  var logic = {
    /** Parameter defaults: the first preset (unix-then-sss, ana, right password, no /etc/nologin). */
    defaults: Object.assign({ user: 'ana', password: true, nologin: false }, stackParams(UNIX_THEN_SSS)),

    /** One step per line that runs, plus the verdict. */
    steps: function (p) { return frames(p).length - 1; },
    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    FLAGS: FLAGS, RESULTS: RESULTS, MODULES: MODULES, FORCES: FORCES, USERS: USERS, USER_IDS: USER_IDS, SLOTS: SLOTS,
    PRESETS: PRESETS,
    apply: apply, runStack: runStack, moduleResult: moduleResult, attemptOf: attemptOf, linesOf: linesOf,
    slotsOf: slotsOf, movePatch: movePatch, framesOf: framesOf, frames: frames, captionOf: captionOf,
    stackParams: stackParams, presetParams: presetParams
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
