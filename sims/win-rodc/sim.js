/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-rodc: a read-only DC (RODC01) at a branch, its password replication policy (PRP), and what a stolen
   RODC exposes. One event per step: a logon at the branch (the RODC answers, forwards or fails), a WAN cut, or one
   theft/response action. Rules and expected numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers;
   state is plain JSON. The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var BRANCH_USERS = ['ana', 'luka', 'maja', 'ivan', 'petra', 'sara'];
  var PCS = ['BR-PC01', 'BR-PC02', 'BR-PC03', 'BR-PC04', 'BR-PC05', 'BR-PC06', 'BR-PC07', 'BR-PC08'];
  var RODC_KRBTGT = 'krbtgt_8123';
  var SCENARIOS = ['first-logon', 'wan-down', 'admin-at-branch', 'default-empty', 'stolen'];
  var USERS = ['ana', 'marko', 'tbrennan'];          // the `user` param's choices

  /** Every account of the domain, in display order: kind and direct group memberships. */
  var ACCOUNTS = (function () {
    var out = [];
    BRANCH_USERS.forEach(function (id) { out.push({ id: id, kind: 'user', groups: ['BRK-Staff'] }); });
    out.push({ id: 'marko', kind: 'user', groups: ['HQ-Staff'] });
    out.push({ id: 'tbrennan', kind: 'user', groups: ['Domain Admins', 'BRK-Staff'] });
    out.push({ id: 'krbtgt', kind: 'krbtgt', groups: [] });
    PCS.forEach(function (id) { out.push({ id: id, kind: 'computer', groups: ['BRK-PCs'] }); });
    return out;
  })();
  var KIND = {};
  ACCOUNTS.forEach(function (a) { KIND[a.id] = a.kind; });

  /** The PRP of RODC01 (rule 3, 4). Denied: the Denied RODC Password Replication Group's default members and the
      policy's own deny entries; the domain's krbtgt account is a member of the denied group. */
  var DENIED_GROUP = ['Domain Admins', 'Enterprise Admins', 'Schema Admins', 'Cert Publishers', 'Group Policy Creator Owners',
    'Domain Controllers', 'Read-only Domain Controllers', 'krbtgt'];
  var DENIED_POLICY = ['Administrators', 'Account Operators', 'Server Operators', 'Backup Operators'];
  var ALLOW_OF = { empty: [], brk: ['BRK-Staff', 'BRK-PCs'] };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function has(list, x) { return list.indexOf(x) >= 0; }
  function account(id) { for (var i = 0; i < ACCOUNTS.length; i++) if (ACCOUNTS[i].id === id) return ACCOUNTS[i]; return null; }

  /** Rule 3 and 4: the writable DC's PRP check. Deny wins over allow (tie-break T1); an account in neither list is not
      cached. Returns { verdict: 'deny' | 'allow' | 'none', by: the group that decided, or null, alsoAllowed }. */
  function prp(id, p) {
    var a = account(id);
    var groups = a.kind === 'krbtgt' ? ['krbtgt'] : a.groups;
    var deny = DENIED_GROUP.concat(DENIED_POLICY);
    var allow = ALLOW_OF[p.allowGroup] || [];
    var d = groups.filter(function (g) { return has(deny, g); })[0] || null;
    var al = groups.filter(function (g) { return has(allow, g); })[0] || null;
    if (d) return { verdict: 'deny', by: d, alsoAllowed: al };
    if (al) return { verdict: 'allow', by: al, alsoAllowed: null };
    return { verdict: 'none', by: null, alsoAllowed: null };
  }

  /** Rule 1, 2, 3, 5 for one account's secret: the RODC has it (local), forwards (and maybe caches it), or fails. */
  function authOne(s, id, p) {
    if (has(s.rodc.cached, id)) return { id: id, result: 'local', prp: null };
    if (!s.wan) return { id: id, result: 'failed', prp: null };
    var v = prp(id, p);
    if (v.verdict === 'allow') { s.rodc.cached.push(id); return { id: id, result: 'cached', prp: v }; }
    return { id: id, result: 'forwarded', prp: v };
  }

  /** One logon at the branch: the PC's own account first (its secure channel, rule 6), then the user (rule 2).
      user null = the PC only starts. Mutates s. */
  function logon(s, ev, p) {
    var rec = { kind: 'logon', user: ev.user, pc: ev.pc, pcRes: null, userRes: null, ok: false, tgt: null, pcLocal: false };
    if (s.stolen) { rec.ok = false; rec.gone = true; return rec; }
    rec.pcRes = authOne(s, ev.pc, p);
    if (ev.user) rec.userRes = authOne(s, ev.user, p);
    var pcOk = rec.pcRes.result !== 'failed';
    var userOk = !ev.user || rec.userRes.result !== 'failed';
    rec.ok = pcOk && userOk;
    if (ev.user && rec.ok) rec.tgt = rec.userRes.result === 'local' ? 'rodc' : 'domain'; // rule 7
    if (ev.user) {
      var seen = s.localLogons[ev.pc] || [];
      rec.pcLocal = !rec.ok && has(seen, ev.user);   // win-domain-logon rule 6: the PC's own cached logon
      if (rec.ok && !has(seen, ev.user)) { seen.push(ev.user); s.localLogons[ev.pc] = seen; }
    }
    return rec;
  }

  /** The history before the `stolen` demo: a month at the branch with the WAN up. Six branch users at their PCs, two
      PCs started with nobody logging on, marko and tbrennan visiting. */
  function history() {
    var out = BRANCH_USERS.map(function (u, i) { return { kind: 'logon', user: u, pc: PCS[i] }; });
    out.push({ kind: 'logon', user: null, pc: PCS[6] }, { kind: 'logon', user: null, pc: PCS[7] });
    out.push({ kind: 'logon', user: 'marko', pc: PCS[0] }, { kind: 'logon', user: 'tbrennan', pc: PCS[1] });
    return out;
  }

  function script(p) {
    var u = USERS.indexOf(p.user) >= 0 ? p.user : 'ana';
    function L(user) { return { kind: 'logon', user: user, pc: PCS[0] }; }
    var CUT = { kind: 'cut' };
    switch (p.scenario) {
      case 'wan-down': return [L(u), CUT, L(u), L('marko')];
      case 'admin-at-branch': return [L(u), L(u), CUT, L(u)];
      case 'default-empty': return [L(u), L(u), CUT, L(u)];
      case 'stolen': return [{ kind: 'steal' }, { kind: 'list' }, { kind: 'delete' }, { kind: 'resetUsers' }, { kind: 'resetComputers' }];
      default: return [L(u), L(u), L('marko'), L('marko')]; // first-logon
    }
  }

  /** Rule 8: the response resets exactly the accounts of the revealed list, users in one step and computers in the next. */
  function resetKind(s, kind) {
    var done = [];
    s.toReset.forEach(function (id) {
      if (KIND[id] !== kind || has(s.reset, id)) return;
      s.pwdVer[id] += 1;
      s.reset.push(id);
      done.push(id);
    });
    return done;
  }

  var logic = {
    ACCOUNTS: ACCOUNTS, BRANCH_USERS: BRANCH_USERS, PCS: PCS, USERS: USERS, SCENARIOS: SCENARIOS,
    RODC_KRBTGT: RODC_KRBTGT, DENIED_GROUP: DENIED_GROUP, DENIED_POLICY: DENIED_POLICY, ALLOW_OF: ALLOW_OF,

    defaults: { scenario: 'first-logon', allowGroup: 'brk', wan: true, user: 'ana' },

    /** One step per event: 4 / 4 / 4 / 4 / 5. */
    steps: function (p) { return script(p).length; },

    script: script,
    history: history,
    prp: prp,
    kindOf: function (id) { return KIND[id]; },

    initial: function (p) {
      var pwdVer = {};
      ACCOUNTS.forEach(function (a) { pwdVer[a.id] = 1; });
      var s = {
        wan: true,
        pwdVer: pwdVer,
        rodc: { cached: [], krbtgt: RODC_KRBTGT, account: true },
        localLogons: {},
        stolen: false,
        exposed: [],
        exposedKey: null,
        toReset: [],
        reset: [],
        before: 0,
        log: [],
        last: null
      };
      if (p.scenario === 'stolen') {
        history().forEach(function (ev) { logon(s, ev, p); });
        s.before = history().length;
      }
      s.wan = !!p.wan;
      return s;
    },

    step: function (prev, n, p) {
      var s = clone(prev);
      var ev = script(p)[n - 1];
      if (!ev) return s;
      var rec;
      switch (ev.kind) {
        case 'logon': rec = logon(s, ev, p); break;
        case 'cut': rec = { kind: 'cut', already: !s.wan }; s.wan = false; break;
        case 'steal':                                                           // rule 7
          rec = { kind: 'steal', already: s.stolen };
          s.stolen = true;
          s.exposed = s.rodc.cached.slice();
          s.exposedKey = s.rodc.krbtgt;                                      // its own key, not the domain's krbtgt
          break;
        case 'list': rec = { kind: 'list' }; s.toReset = s.rodc.cached.slice(); break; // rule 8: msDS-RevealedList
        case 'delete':                                                          // rule 8: the account and its key go
          rec = { kind: 'delete', already: !s.rodc.account };
          s.rodc.account = false;
          s.rodc.krbtgt = null;
          break;
        case 'resetUsers': rec = { kind: 'resetUsers', done: resetKind(s, 'user') }; break;
        case 'resetComputers': rec = { kind: 'resetComputers', done: resetKind(s, 'computer') }; break;
        default: rec = { kind: ev.kind };
      }
      rec.n = n;
      s.last = rec;
      s.log.push({ n: n, kind: rec.kind, user: rec.user || null, ok: rec.kind === 'logon' ? rec.ok : null,
        result: rec.userRes ? rec.userRes.result : rec.pcRes ? rec.pcRes.result : null, cached: s.rodc.cached.length });
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
