/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-gpo-software-install: the GPO "Deploy Viewer" deploys \\hq-fs01\pkg$\viewer.msi one of four ways
   (assign to computer, assign to user, assign to user + install at logon, publish to user), and the target, PC07 or
   ana, gets it only in a synchronous foreground pass (a startup or a logon): a background pass (gpupdate) only signals,
   and with fast logon optimisation the first foreground pass is asynchronous and signals too (the rule of
   win-gpo-processing, re-stated here for the one extension, Software Installation). A computer install reads the share
   with the computer's account. Moving the target out of the GPO's scope removes the package only with the uninstall
   option. One step = one event on the timeline. Rules, tie-breaks and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var PACKAGE = '\\\\hq-fs01\\pkg$\\viewer.msi';
  var DEPLOYMENTS = ['computer', 'user', 'user-at-logon', 'publish'];
  /** Rule 2–4: what each deployment is, and whose part it lives in. */
  var MODES = {
    computer: { how: 'assign', part: 'computer' },
    user: { how: 'assign', part: 'user' },
    'user-at-logon': { how: 'assign', part: 'user', atLogon: true },
    publish: { how: 'publish', part: 'user' }
  };
  /** The foreground event of each part (rule 5). */
  var FG = { computer: 'boot', user: 'logon' };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ── the rules, as pure functions ──

  /** Rule 1: a Windows Installer package on a UNC path (a transform is added to a package, never deployed alone). */
  function deployable(path) {
    return typeof path === 'string' && /^\\\\[^\\]+\\[^\\]+\\(.+\\)?[^\\]+\.msi$/i.test(path);
  }

  /** Rule 4: assign works for both parts; publish only for users. */
  function allowed(how, part) { return how === 'assign' || (how === 'publish' && part === 'user'); }

  function modeOf(s) { return MODES[s.deployment]; }

  /** Does Viewer work for ana right now (per machine or per user)? */
  function viewerFor(s) { return s.pc.installed || s.user.installed; }

  /** Is there anything new for Software Installation in this part? */
  function hasWork(s, part) {
    if (part !== s.part) return false;
    if (s.move) return !s.inScope && s.managed;
    if (part === 'computer') return !s.pc.installed;
    return !(s.user.advertised || s.user.offered || s.user.installed || s.user.viaComputer);
  }

  /** Rules 2–4, 7, T1: the synchronous pass of the target's part actually does it. */
  function apply(s, part) {
    s.syncNext[part] = false;
    if (s.move) {
      s.managed = false;
      if (!s.removeOnScope) return 'stays';
      if (part === 'computer') s.pc.installed = false;
      else s.user = { advertised: false, offered: false, installed: false, viaComputer: false };
      return 'removed';
    }
    if (part === 'computer') {
      if (!s.shareReadable.computers) { s.pc.failed = 'access'; return 'failed'; }   // rule 2: SYSTEM = the computer account
      s.pc.installed = true;
      s.pc.failed = null;
      return 'installed';
    }
    if (s.pc.installed) { s.user.viaComputer = true; return 'viaComputer'; }   // T1
    var m = modeOf(s);
    if (m.how === 'publish') { s.user.offered = true; return 'offered'; }
    if (m.atLogon) { s.user.installed = true; return 'installed'; }
    s.user.advertised = true;
    return 'advertised';
  }

  /**
   * Rules 5, 6: one Software Installation pass of one part. kind 'fg' (startup, logon) or 'bg' (gpupdate).
   * Returns 'none' (nothing new) | 'slow' | 'signal' | what apply() returned. Mutates s.
   */
  function siPass(s, part, kind) {
    if (!hasWork(s, part)) return 'none';
    if (kind === 'fg' && s.slowLink) return 'slow';
    var sync = kind === 'fg' && (!s.fastLogon || s.syncNext[part]);
    if (!sync) { s.syncNext[part] = true; return 'signal'; }
    return apply(s, part);
  }

  /** The follow-up event once the pass is done: ana logs on (computer), opens the file, or opens "Get programs". */
  function followUp(s) {
    if (s.part === 'computer') return 'logon';
    if (modeOf(s).how === 'publish' && !s.move) return 'store';
    return 'open';
  }

  /** SPEC "Steps": the next event, or null when the run is over. */
  function nextKind(s) {
    if (s.move && s.inScope) return 'move';
    if (s.gpupdate && !s.events.some(function (e) { return e.kind === 'gpupdate'; })) return 'gpupdate';
    if (!s.siDone) return FG[s.part];
    if (s.siResult === 'slow') return null;   // T5
    if (!s.followed) return followUp(s);
    return null;
  }

  /** Process one event; returns the event record. */
  function processEvent(s, kind, n) {
    var e = { n: n, kind: kind, changed: [] };
    var pcBefore = JSON.stringify(s.pc), userBefore = JSON.stringify(s.user);
    if (kind === 'move') {
      s.inScope = false;
    } else if (kind === 'gpupdate') {
      e.bg = { computer: siPass(s, 'computer', 'bg'), user: siPass(s, 'user', 'bg') };
      e.ask = e.bg.computer === 'signal' ? 'restart' : e.bg.user === 'signal' ? 'logoff' : null;
    } else if (kind === FG[s.part] && !s.siDone) {
      e.part = s.part;
      e.mode = !s.fastLogon || s.syncNext[s.part] ? 'sync' : 'async';
      e.flagged = s.fastLogon && s.syncNext[s.part];
      e.si = siPass(s, s.part, 'fg');
      if (e.si !== 'signal') { s.siDone = true; s.siResult = e.si; }
    } else if (kind === 'logon') {
      s.followed = true;
      e.part = 'user';
      e.si = 'none';
      e.has = viewerFor(s);
    } else if (kind === 'open') {
      s.followed = true;
      if (viewerFor(s)) e.outcome = 'opens';
      else if (s.user.advertised) { s.user.installed = true; e.outcome = 'installedOnUse'; }
      else e.outcome = 'noApp';
    } else if (kind === 'store') {
      s.followed = true;
      if (s.user.offered && !s.user.installed) { s.user.installed = true; e.outcome = 'installedFromStore'; }
      else e.outcome = 'notListed';
    }
    if (JSON.stringify(s.pc) !== pcBefore) e.changed.push('pc');
    if (JSON.stringify(s.user) !== userBefore) e.changed.push('user');
    e.flags = clone(s.syncNext);
    s.events.push(e);
    s.event = e;
    return e;
  }

  /** The run's outcome for the target. */
  function outcomeOf(s) {
    if (s.siResult === 'slow') return 'skipped';
    if (s.move) return s.siResult;   // removed | stays
    if (s.pc.failed) return 'failed';
    return viewerFor(s) ? 'installed' : s.user.offered ? 'offered' : s.user.advertised ? 'advertised' : 'none';
  }

  var logic = {
    /** Parameter defaults (the task's four, plus move and gpupdate; slowLink is model only). */
    defaults: { deployment: 'computer', computersCanRead: true, fastLogon: true, removeOnScope: false, move: false, gpupdate: false, slowLink: false },

    PACKAGE: PACKAGE,
    DEPLOYMENTS: DEPLOYMENTS,
    MODES: MODES,
    FG: FG,

    presets: [
      { id: 'assign-computer', params: { deployment: 'computer' } },
      { id: 'assign-user', params: { deployment: 'user' } },
      { id: 'publish-user', params: { deployment: 'publish' } },
      { id: 'share-perms', params: { deployment: 'computer', computersCanRead: false } },
      { id: 'out-of-scope', params: { deployment: 'computer', move: true, removeOnScope: true } }
    ],

    /** Steps for these params: one per event until nextKind says the run is over. */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 20) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0. */
    initial: function (p) {
      var deployment = DEPLOYMENTS.indexOf(p.deployment) >= 0 ? p.deployment : 'computer';
      var part = MODES[deployment].part;
      var move = p.move === true;
      var s = {
        deployment: deployment,
        part: part,
        target: part === 'computer' ? 'pc07' : 'ana',
        package: PACKAGE,
        shareReadable: { computers: p.computersCanRead !== false, users: true },
        fastLogon: p.fastLogon !== false,
        removeOnScope: p.removeOnScope === true,
        move: move,
        gpupdate: p.gpupdate === true,
        slowLink: p.slowLink === true,
        inScope: true,
        managed: move,
        syncNext: { computer: false, user: false },
        pc: { installed: move && part === 'computer', failed: null },
        user: { advertised: move && deployment === 'user', offered: move && deployment === 'publish', installed: move && part === 'user', viaComputer: false },
        siDone: false,
        siResult: null,
        followed: false,
        events: [],
        event: null,
        phase: 'run',
        result: null
      };
      return s;
    },

    /** State after step n: the next event. */
    step: function (s0, n) {
      var s = clone(s0);
      if (s.phase === 'done') return s;
      var kind = nextKind(s);
      if (kind) processEvent(s, kind, n);
      if (!nextKind(s)) { s.phase = 'done'; s.result = outcomeOf(s); }
      return s;
    },

    // exported for the page and the tests
    deployable: deployable,
    allowed: allowed,
    hasWork: hasWork,
    siPass: siPass,
    apply: apply,
    nextKind: nextKind,
    processEvent: processEvent,
    viewerFor: viewerFor,
    outcomeOf: outcomeOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
