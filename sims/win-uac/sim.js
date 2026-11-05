/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-uac: an administrator runs with a filtered token until elevated. ana (member of Administrators) logs
   on to PC-07; with UAC on LSA makes two linked tokens, a full one (Administrators enabled, every privilege, integrity
   High) and a filtered one (Administrators deny-only, five privileges, Medium), and the desktop runs with the filtered
   one. A task from Explorer (write to Program Files or HKLM\SOFTWARE, change the time zone, stop a service) is checked
   with that token; "Run as administrator" asks (consent for an administrator, credentials for a standard user) and
   starts a new process with the full token; children inherit their parent's token.
   The token card and the access check build on sims/win-access-token/sim.js @ b69e015 (tokenSids, check: entries top
   down, the first matching one decides), extended with deny ACEs, deny-only SIDs, rights per entry, integrity levels
   and privileges. models/ has no token model yet.
   One step = one event of the plan made from the params. Rules, tie-breaks and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var PC = 'PC-07';
  var LOCAL_SID = 'S-1-5-21-…';

  /** Accounts on PC-07 (all local). `rid` 500 is the built-in Administrator (rule 6). */
  var ACCOUNTS = {
    ana: { name: 'ana', sid: LOCAL_SID + '-1001', admin: true },
    marko: { name: 'marko', sid: LOCAL_SID + '-1003', admin: false },
    'admin-it': { name: 'admin-it', sid: LOCAL_SID + '-1002', admin: true },
    Administrator: { name: 'Administrator', sid: LOCAL_SID + '-500', admin: true, builtin: true }
  };
  /** The account param → who logs on. */
  var WHO = { admin: 'ana', standard: 'marko', 'builtin-admin': 'Administrator' };
  /** The administrator marko types into the credential prompt (rule 4). */
  var CRED_ADMIN = 'admin-it';

  /** Group and well-known SIDs a token can carry, in card order. */
  var SIDS = {
    Everyone: 'S-1-1-0',
    Administrators: 'S-1-5-32-544',
    Users: 'S-1-5-32-545',
    INTERACTIVE: 'S-1-5-4',
    NETWORK: 'S-1-5-2',
    'Authenticated Users': 'S-1-5-11',
    SYSTEM: 'S-1-5-18'
  };
  /** Groups that become deny-only in a filtered token (rule 2) (check). */
  var FILTERED_GROUPS = ['Administrators', 'Backup Operators', 'Power Users', 'Account Operators', 'Server Operators',
    'Print Operators', 'Network Configuration Operators'];

  /** The privileges an administrator's full token holds (rule 2) (check). */
  var ADMIN_PRIVS = [
    'SeIncreaseQuotaPrivilege', 'SeSecurityPrivilege', 'SeTakeOwnershipPrivilege', 'SeLoadDriverPrivilege',
    'SeSystemProfilePrivilege', 'SeSystemtimePrivilege', 'SeProfileSingleProcessPrivilege',
    'SeIncreaseBasePriorityPrivilege', 'SeCreatePagefilePrivilege', 'SeBackupPrivilege', 'SeRestorePrivilege',
    'SeShutdownPrivilege', 'SeDebugPrivilege', 'SeSystemEnvironmentPrivilege', 'SeChangeNotifyPrivilege',
    'SeRemoteShutdownPrivilege', 'SeUndockPrivilege', 'SeManageVolumePrivilege', 'SeImpersonatePrivilege',
    'SeCreateGlobalPrivilege', 'SeIncreaseWorkingSetPrivilege', 'SeTimeZonePrivilege', 'SeCreateSymbolicLinkPrivilege',
    'SeDelegateSessionUserImpersonatePrivilege'
  ];
  /** The privileges a filtered token keeps, and a standard user's token holds (rule 2) (check). */
  var LIMITED_PRIVS = ['SeShutdownPrivilege', 'SeChangeNotifyPrivilege', 'SeUndockPrivilege',
    'SeIncreaseWorkingSetPrivilege', 'SeTimeZonePrivilege'];

  /** Integrity levels, low to high (rule 2; MIC). Unlabelled objects are Medium. */
  var IL = ['L', 'M', 'H', 'S'];

  /** The four tasks: the target, what it needs, and the target's DACL top to bottom (SPEC.md "Scene"). Rights:
      r read, w write, q query, s stop. */
  var TASKS = {
    progfiles: { target: 'C:\\Program Files\\App', kind: 'file', need: 'w', il: 'M', dacl: [
      { who: 'SYSTEM', type: 'allow', rights: ['r', 'w'], level: 'full' },
      { who: 'Administrators', type: 'allow', rights: ['r', 'w'], level: 'full' },
      { who: 'Users', type: 'allow', rights: ['r'], level: 'rx' }] },
    hklm: { target: 'HKLM\\SOFTWARE', kind: 'key', need: 'w', il: 'M', dacl: [
      { who: 'SYSTEM', type: 'allow', rights: ['r', 'w'], level: 'full' },
      { who: 'Administrators', type: 'allow', rights: ['r', 'w'], level: 'full' },
      { who: 'Users', type: 'allow', rights: ['r'], level: 'read' }] },
    timezone: { target: 'timezone', kind: 'priv', need: 'SeTimeZonePrivilege' },
    service: { target: 'Spooler', kind: 'service', need: 's', il: 'M', dacl: [
      { who: 'SYSTEM', type: 'allow', rights: ['q', 's'], level: 'all' },
      { who: 'Administrators', type: 'allow', rights: ['q', 's'], level: 'all' },
      { who: 'INTERACTIVE', type: 'allow', rights: ['q'], level: 'query' }] }
  };

  function has(list, x) { return list.indexOf(x) >= 0; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ── the rules, as pure functions ──

  /** The SIDs of an interactive (or network) logon of `user`, every one enabled: the user, Everyone, Administrators
      for an administrator, Users, INTERACTIVE (or NETWORK), Authenticated Users. */
  function logonSids(user, logonType) {
    var a = ACCOUNTS[user];
    var list = [{ name: PC + '\\' + user, sid: a.sid, attr: 'enabled', user: true },
      { name: 'Everyone', sid: SIDS.Everyone, attr: 'enabled' }];
    if (a.admin) list.push({ name: 'Administrators', sid: SIDS.Administrators, attr: 'enabled' });
    list.push({ name: 'Users', sid: SIDS.Users, attr: 'enabled' },
      { name: logonType === 'network' ? 'NETWORK' : 'INTERACTIVE', sid: SIDS[logonType === 'network' ? 'NETWORK' : 'INTERACTIVE'], attr: 'enabled' },
      { name: 'Authenticated Users', sid: SIDS['Authenticated Users'], attr: 'enabled' });
    return list;
  }

  /** Rule 2: an unfiltered token: an administrator's full token (every privilege, High), or a standard user's (five
      privileges, Medium). */
  function fullToken(user, logonType) {
    var a = ACCOUNTS[user];
    return { user: user, kind: a.admin ? 'full' : 'standard', linked: false, sids: logonSids(user, logonType),
      privs: (a.admin ? ADMIN_PRIVS : LIMITED_PRIVS).slice(), il: a.admin ? 'H' : 'M' };
  }

  /** Rule 2: the filtered token made from a full one: the filtered groups deny-only, the privileges cut to the five,
      integrity Medium. */
  function filterToken(full) {
    var t = clone(full);
    t.kind = 'filtered';
    t.sids.forEach(function (s) { if (has(FILTERED_GROUPS, s.name)) s.attr = 'denyOnly'; });
    t.privs = full.privs.filter(function (p) { return has(LIMITED_PRIVS, p); });
    t.il = 'M';
    return t;
  }

  /** Is the account in Admin Approval Mode? An administrator other than the built-in one, with UAC on (rules 1, 6). */
  function inApprovalMode(user, uacOn) {
    var a = ACCOUNTS[user];
    return !!uacOn && a.admin && !a.builtin;
  }

  /** Rules 1, 2, 6: the tokens of an interactive logon: { filtered, full } (a standard user's single token in the
      `filtered` slot, an unsplit administrator's in `full`; the other slot null). */
  function logonTokens(user, uacOn) {
    var full = fullToken(user, 'interactive');
    if (!ACCOUNTS[user].admin) return { filtered: full, full: null };
    if (!inApprovalMode(user, uacOn)) return { filtered: null, full: full };
    var f = filterToken(full);
    full.linked = true; f.linked = true;
    return { filtered: f, full: full };
  }

  /** Rule 7: which token a network logon gets: a local administrator the filtered one (unless
      LocalAccountTokenFilterPolicy = 1, or the account is the built-in Administrator), a domain administrator the full
      one; a standard user her only one. opts: { admin, uacOn, domain, builtin, tokenFilterPolicy }. */
  function networkToken(opts) {
    if (!opts.admin) return 'standard';
    if (!opts.uacOn) return 'full';
    if (opts.builtin) return 'full';  // RID 500 is not filtered remotely either (rule 6) (check)
    if (opts.domain) return 'full';
    return opts.tokenFilterPolicy === 1 ? 'full' : 'filtered';
  }

  /** The token's attribute for a group or well-known name: 'enabled', 'denyOnly' or null (not in the token). */
  function attrOf(token, who) {
    var s = token.sids.filter(function (x) { return x.name === who; })[0];
    return s ? s.attr : null;
  }

  /** Rule 3 (MIC): may a process at level `procIl` do `need` to an object at `objIl`? Writes may not go up. */
  function integrityOk(procIl, objIl, need) {
    if (need === 'r' || need === 'q') return true;
    return IL.indexOf(procIl) >= IL.indexOf(objIl);
  }

  /** Rule 3: the access check of `token` for task `task` (a key of TASKS, or a task object).
      Returns { ok, by: 'priv' | 'mic' | 'dacl', row (deciding index; −1 none), rows: [per entry 'absent' |
      'denyOnly' | 'noRight' | 'decides' | 'skip'], priv, il: { proc, obj, ok } }. Tie-break T1: the first entry that
      matches and covers the right decides, deny or allow. */
  function check(token, task) {
    var tk = typeof task === 'string' ? TASKS[task] : task;
    if (tk.kind === 'priv') {
      var held = has(token.privs, tk.need);
      return { ok: held, by: 'priv', priv: tk.need, row: -1, rows: [], il: null };
    }
    var il = { proc: token.il, obj: tk.il || 'M', ok: integrityOk(token.il, tk.il || 'M', tk.need) };
    if (!il.ok) return { ok: false, by: 'mic', row: -1, rows: tk.dacl.map(function () { return 'skip'; }), il: il };
    var rows = [], row = -1, ok = false;
    for (var i = 0; i < tk.dacl.length; i++) {
      var ace = tk.dacl[i];
      if (row >= 0) { rows.push('skip'); continue; }
      var attr = attrOf(token, ace.who);
      var r;
      if (!attr) r = 'absent';
      else if (ace.type === 'allow' && attr !== 'enabled') r = 'denyOnly';
      else if (!has(ace.rights, tk.need)) r = 'noRight';
      else { r = 'decides'; row = i; ok = ace.type === 'allow'; }
      rows.push(r);
    }
    return { ok: ok, by: 'dacl', row: row, rows: rows, il: il };
  }

  // ── the plan ──

  /** Can "Run as administrator" elevate this account? Rules 4, 6, 8: only with UAC on, for an administrator in Admin
      Approval Mode (consent) or a standard user (credentials). Returns the prompt kind or null. */
  function promptKind(user, uacOn) {
    if (!uacOn) return null;
    if (!ACCOUNTS[user].admin) return 'credentials';
    return inApprovalMode(user, uacOn) ? 'consent' : null;
  }

  /** The tokens Explorer gets at logon (rule 1): the filtered one, or the only one. */
  function desktopToken(tokens) { return tokens.filtered ? 'filtered' : 'full'; }

  /** The run for these params, in step order: [{ kind, ... }]. */
  function plan(p) {
    var user = WHO[p.account] || WHO.admin;
    var uac = p.uac !== false;
    var task = TASKS[p.task] ? p.task : 'progfiles';
    var tokens = logonTokens(user, uac);
    var ev = [{ kind: 'logon' }, { kind: 'explorer' }, { kind: 'attempt', proc: 'explorer' }];
    var first = check(tokens[desktopToken(tokens)], task);
    var prompt = promptKind(user, uac);
    var elevated = !first.ok && !!prompt;
    if (elevated) ev.push({ kind: 'prompt', prompt: prompt }, { kind: 'approve' }, { kind: 'attempt', proc: 'cmd' });
    if (p.children) {
      if (elevated) ev.push({ kind: 'spawn', parent: 'cmd', id: 'notepad-cmd' });
      ev.push({ kind: 'spawn', parent: 'explorer', id: 'notepad-explorer' });
    }
    return ev;
  }

  // ── the run ──

  function proc(s, id) { return s.procs.filter(function (x) { return x.id === id; })[0] || null; }
  function tokenOf(s, pr) { return s.tokens[pr.token]; }

  var logic = {
    /** Parameter defaults: the admin-filtered preset. */
    defaults: { account: 'admin', uac: true, task: 'progfiles', children: false },

    PC: PC,
    ACCOUNTS: ACCOUNTS,
    WHO: WHO,
    CRED_ADMIN: CRED_ADMIN,
    SIDS: SIDS,
    FILTERED_GROUPS: FILTERED_GROUPS,
    ADMIN_PRIVS: ADMIN_PRIVS,
    LIMITED_PRIVS: LIMITED_PRIVS,
    IL: IL,
    TASKS: TASKS,
    ACCOUNT_KINDS: ['admin', 'standard', 'builtin-admin'],
    TASK_KEYS: ['progfiles', 'hklm', 'timezone', 'service'],

    /** Steps for these params: one per event of the plan (3 to 8). */
    steps: function (p) { return plan(p).length; },

    /** Step 0: the account is about to log on; no tokens, no processes. */
    initial: function (p) {
      var user = WHO[p.account] || WHO.admin;
      return {
        user: user,
        isAdmin: ACCOUNTS[user].admin,
        uacOn: p.uac !== false,
        task: TASKS[p.task] ? p.task : 'progfiles',
        tokens: { filtered: null, full: null },
        procs: [],
        attempts: [],
        prompt: null,
        last: null,
        log: []
      };
    },

    /** State after step n: the n-th event of the plan. */
    step: function (s0, n, p) {
      var e = plan(p)[n - 1];
      if (!e) return s0;
      var s = clone(s0);
      var out = { kind: e.kind, n: n };
      switch (e.kind) {
        case 'logon': {
          // rules 1, 2, 6: LSA builds the token(s)
          s.tokens = logonTokens(s.user, s.uacOn);
          out.split = !!(s.tokens.filtered && s.tokens.full);
          break;
        }
        case 'explorer': {
          // rule 1: the desktop runs with the filtered token, or the only one
          var tok = desktopToken(s.tokens);
          s.procs.push({ id: 'explorer', image: 'explorer.exe', user: s.user, token: tok, parent: null, il: s.tokens[tok].il });
          out.token = tok;
          break;
        }
        case 'attempt': {
          // rule 3: the check with the process's token
          var pr = proc(s, e.proc);
          var r = check(tokenOf(s, pr), s.task);
          var a = { n: n, proc: pr.id, user: pr.user, token: pr.token, task: s.task, ok: r.ok, by: r.by, row: r.row, rows: r.rows, il: r.il, priv: r.priv || null };
          s.attempts.push(a);
          out.proc = pr.id; out.ok = r.ok; out.by = r.by; out.row = r.row;
          break;
        }
        case 'prompt':
          // rule 4: consent for an administrator, credentials for a standard user
          s.prompt = e.prompt;
          out.prompt = e.prompt;
          break;
        case 'approve': {
          // rule 4: a new process with the full token: the linked one, or the typed-in administrator's
          var asUser = s.user;
          if (s.prompt === 'credentials') {
            asUser = CRED_ADMIN;
            s.tokens.full = fullToken(CRED_ADMIN, 'interactive');
          }
          out.prompt = s.prompt;
          s.prompt = null;
          s.procs.push({ id: 'cmd', image: 'cmd.exe', user: asUser, token: 'full', parent: 'explorer', il: s.tokens.full.il, elevated: true });
          out.user = asUser;
          break;
        }
        case 'spawn': {
          // rule 5: the child gets its parent's token, unchanged
          var parent = proc(s, e.parent);
          s.procs.push({ id: e.id, image: 'notepad.exe', user: parent.user, token: parent.token, parent: parent.id, il: parent.il });
          out.parent = parent.id; out.token = parent.token; out.il = parent.il; out.id = e.id;
          break;
        }
      }
      s.last = out;
      s.log.push(out);
      return s;
    },

    // exported for the page and the tests
    plan: plan,
    logonSids: logonSids,
    fullToken: fullToken,
    filterToken: filterToken,
    logonTokens: logonTokens,
    inApprovalMode: inApprovalMode,
    networkToken: networkToken,
    promptKind: promptKind,
    attrOf: attrOf,
    integrityOk: integrityOk,
    check: check
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
