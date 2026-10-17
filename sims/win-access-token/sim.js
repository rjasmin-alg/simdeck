/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-access-token: ana logged on to PC-07 at 08:00, so her access token (user SID, group SIDs with
   nesting expanded, well-known SIDs) and her Kerberos TGT carry the groups AD had then. An administrator adds her to
   Prodaja (or removes her) on DC1 or DC2; the change reaches the other DC about 15 s later. Her access to FS1's
   folder Prodaja (ACL: DL_FS1_Prodaja_Modify Modify; Prodaja is a member of that group) and to a local folder on
   PC-07 is decided by the token the check is given: on FS1 a token built from her service ticket (or kept by an open
   SMB session), on PC-07 her logon token. Logging off and on, or new tickets, bring in the new groups.
   The run is a schedule of events made from the params (plan), sorted by time with a fixed order of kinds at the
   same time (tie-break); one step = one event. Rules, tie-breaks and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MIN = 60, HOUR = 3600;
  var NETBIOS = 'QUILLMOOR';
  var DOM_SID = 'S-1-5-21-…';
  var USER = 'ana';
  var USER_SID = DOM_SID + '-1104';
  var PC = 'PC-07';
  var FS = 'FS1';
  var DCS = ['DC1', 'DC2'];
  /** The DC that answers ana's logon and ticket requests (rule 6). */
  var LOGON_DC = 'DC1';
  var SHARE = '\\\\FS1\\Prodaja';
  var LOCAL_FOLDER = 'C:\\Ponude';

  /** Groups in display order, with their SIDs; the DL group is domain local (rule 3). */
  var GROUPS = ['Domain Users', 'Prodaja', 'DL_FS1_Prodaja_Modify'];
  var DOMAIN_LOCAL = ['DL_FS1_Prodaja_Modify'];
  var GROUP_SID = {
    'Domain Users': DOM_SID + '-513',
    Prodaja: DOM_SID + '-1201',
    DL_FS1_Prodaja_Modify: DOM_SID + '-1210',
    Administrators: 'S-1-5-32-544'
  };
  /** Well-known SIDs every token here carries; INTERACTIVE for the logon on PC-07, NETWORK on FS1 (rule 1). */
  var WELL_KNOWN = { Everyone: 'S-1-1-0', 'Authenticated Users': 'S-1-5-11', INTERACTIVE: 'S-1-5-4', NETWORK: 'S-1-5-2' };

  /** Kerberos policy defaults (rule 4): user ticket (TGT) 10 h, service ticket 600 min, capped at the TGT's end;
      the client renews its TGT 15 min before the end, up to 7 days after logon, and a renewal copies the groups. */
  var TGT_LIFE = 10 * HOUR;
  var SERVICE_LIFE = 600 * MIN;
  var RENEW_BEFORE = 15 * MIN;
  var RENEW_MAX = 7 * 24 * HOUR;
  /** Intra-site change notification: a change reaches the other DC about 15 s later (rule 6). */
  var REPL_DELAY = 15;

  var LOGON_AT = 8 * HOUR;
  var MORNING_TICKET_AT = 8 * HOUR + 5 * MIN;
  var CHANGE_AT = { add: 10 * HOUR, remove: 13 * HOUR };

  /** The ACLs, top to bottom. Every entry allows at least Modify, which is what ana asks for (she saves a file). */
  var ACL = {
    fs1: [{ who: 'Administrators', rights: 'full' }, { who: 'DL_FS1_Prodaja_Modify', rights: 'modify' }],
    local: [{ who: 'Administrators', rights: 'full' }, { who: 'Prodaja', rights: 'modify' }]
  };

  /** Tie-break (rule 8, T1): at the same time, events apply in this order, so an access attempt uses a token or a
      ticket made at the same moment, and a logon sees a change or a replication of the same moment. */
  var ORDER = ['change', 'repl', 'logoff', 'logon', 'tgt', 'ticket', 'attempt'];

  function has(list, x) { return list.indexOf(x) >= 0; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ── the rules, as pure functions ──

  /** Membership before any change: ana in Domain Users (and in Prodaja for a removal); Prodaja nested in the DL group. */
  function baseMembers(change) {
    return {
      'Domain Users': [USER],
      Prodaja: change === 'remove' ? [USER] : [],
      DL_FS1_Prodaja_Modify: ['Prodaja']
    };
  }

  /** One membership change applied to a copy. */
  function applyChange(members, c) {
    var m = clone(members);
    var list = m[c.group] || (m[c.group] = []);
    if (c.op === 'add' && !has(list, c.principal)) list.push(c.principal);
    if (c.op === 'remove') m[c.group] = list.filter(function (x) { return x !== c.principal; });
    return m;
  }

  /** Rule 1: every group the principal is in, directly or through nesting, in display order. */
  function expand(members, principal) {
    var found = [], queue = [principal];
    while (queue.length) {
      var who = queue.shift();
      GROUPS.forEach(function (g) {
        if (!has(found, g) && has(members[g] || [], who)) { found.push(g); queue.push(g); }
      });
    }
    return GROUPS.filter(function (g) { return has(found, g); });
  }

  /** Rule 3: the groups a TGT carries: the user's groups without the domain local ones. */
  function tgtGroups(members, principal) {
    return expand(members, principal).filter(function (g) { return !has(DOMAIN_LOCAL, g); });
  }

  /** Rule 3: a service ticket's groups: the TGT's, plus the domain local groups the user or those groups are in, as
      the issuing DC has them now. */
  function withDomainLocal(members, groups) {
    var out = groups.slice(), changed = true;
    while (changed) {
      changed = false;
      DOMAIN_LOCAL.forEach(function (g) {
        if (has(out, g)) return;
        if ((members[g] || []).some(function (m) { return m === USER || has(out, m); })) { out.push(g); changed = true; }
      });
    }
    return GROUPS.filter(function (g) { return has(out, g); });
  }

  /** Rule 6: the membership a DC has: the base plus the changes that have reached it. */
  function membersAt(ad, dc) {
    var d = ad.dcs.filter(function (x) { return x.id === dc; })[0];
    var m = ad.base;
    for (var i = 0; i < d.replicatedUpTo; i++) m = applyChange(m, ad.changes[i]);
    return m;
  }

  /** Rule 6: has change c reached dc by time t? The originating DC has it at once, the other after REPL_DELAY. */
  function reached(c, dc, t) { return c.dc === dc || t >= c.at + REPL_DELAY; }

  /** The SIDs of a token: the user, her groups, the well-known SIDs (INTERACTIVE locally, NETWORK on a server). */
  function tokenSids(groups, where) {
    return [USER_SID].concat(groups.map(function (g) { return GROUP_SID[g]; }),
      [WELL_KNOWN.Everyone, WELL_KNOWN['Authenticated Users'], where === 'local' ? WELL_KNOWN.INTERACTIVE : WELL_KNOWN.NETWORK]);
  }

  /** The access check: entries read top down; the first whose principal is in the token decides (all allow ≥ Modify).
      No entry matches: denied. Returns { ok, row (index, −1 for none), hits (per row read, up to the deciding one) }. */
  function check(acl, groups, where) {
    var sids = tokenSids(groups, where), hits = [];
    for (var i = 0; i < acl.length; i++) {
      var hit = has(sids, GROUP_SID[acl[i].who]);
      hits.push(hit);
      if (hit) return { ok: true, row: i, hits: hits };
    }
    return { ok: false, row: -1, hits: hits };
  }

  /** Rules 3, 4: a service ticket copies the TGT's groups and gets the domain local ones added (`members`: what the
      issuing DC has); it lives 600 min but never past the TGT. */
  function serviceTicket(tgt, server, t, members) {
    return { server: server, issuedAt: t, groups: withDomainLocal(members, tgt.groups), expiresAt: Math.min(t + SERVICE_LIFE, tgt.expiresAt), dc: tgt.dc };
  }

  /** Rule 4: an automatic renewal at t: the same groups (copied), a new end, never past logon + 7 days. */
  function renewTgt(tgt, t, logonAt) {
    return { issuedAt: t, groups: tgt.groups.slice(), expiresAt: Math.min(t + TGT_LIFE, logonAt + RENEW_MAX), dc: tgt.dc, renewed: true };
  }

  /** Groups in `a` and not in `b`, and in `b` and not in `a` (the page flags these ≠). */
  function diff(a, b) {
    return { extra: a.filter(function (g) { return !has(b, g); }), missing: b.filter(function (g) { return !has(a, g); }) };
  }

  /** "10:05", or "10:00:15" when there are seconds; the time of day (the page says when it is the next day). */
  function clock(t) {
    function two(x) { return (x < 10 ? '0' : '') + x; }
    t = t % (24 * HOUR);
    var s = two(Math.floor(t / HOUR)) + ':' + two(Math.floor(t % HOUR / MIN));
    return t % MIN ? s + ':' + two(t % MIN) : s;
  }

  // ── the schedule ──

  /** The run for these params, in step order: [{ at, kind, ... }]. */
  function plan(p) {
    var T = CHANGE_AT[p.change] !== undefined ? CHANGE_AT[p.change] : CHANGE_AT.add;
    var onDc2 = p.changeOn === 'DC2';
    var ev = [{ at: T, kind: 'change', dc: onDc2 ? 'DC2' : 'DC1', op: p.change === 'remove' ? 'remove' : 'add' }];
    var fix = onDc2 && p.action !== 'none'
      ? [T + 5, T + 20]               // replication-lag: tried 5 s after the change, before replication, then again
      : [T + 10 * MIN];
    if (onDc2) ev.push({ at: T + REPL_DELAY, kind: 'repl', from: 'DC2', to: 'DC1' });
    if (!onDc2 || p.action === 'none') ev.push({ at: T + 5 * MIN, kind: 'attempt', where: 'fs1' });
    var after = fix[fix.length - 1] + (onDc2 ? MIN - 20 : MIN);
    if (p.action === 'relog') {
      fix.forEach(function (at) { ev.push({ at: at, kind: 'logoff' }, { at: at, kind: 'logon' }); });
      ev.push({ at: after, kind: 'ticket' }, { at: after, kind: 'attempt', where: 'fs1' });
    } else if (p.action === 'renew') {
      fix.forEach(function (at) { ev.push({ at: at, kind: 'tgt', reason: 'renew' }); });
      // an open SMB session needs no ticket: the client goes on using it (rule 5)
      if (!p.smbOpen) ev.push({ at: after, kind: 'ticket' });
      ev.push({ at: after, kind: 'attempt', where: 'fs1' }, { at: after + MIN, kind: 'attempt', where: 'local' });
    } else {
      // nothing done: the client renews the TGT of 08:00 at 17:45 (groups copied); the service ticket of 08:05 ends
      // with the old TGT at 18:00, so the access at 18:05 needs a new one (rule 4)
      var end = LOGON_AT + TGT_LIFE, next = end + 5 * MIN;
      ev.push({ at: end - RENEW_BEFORE, kind: 'tgt', reason: 'renewal' }, { at: next, kind: 'ticket' }, { at: next, kind: 'attempt', where: 'fs1' });
    }
    return sortEvents(ev);
  }

  /** Rule 8, T1: by time, then by ORDER, then as listed. */
  function sortEvents(ev) {
    return ev.map(function (e, i) { return { e: e, i: i }; }).sort(function (a, b) {
      return a.e.at - b.e.at || ORDER.indexOf(a.e.kind) - ORDER.indexOf(b.e.kind) || a.i - b.i;
    }).map(function (x) { return x.e; });
  }

  // ── the run ──

  /** Bring the scene up to time t: replication by time (rule 6). */
  function sync(s) {
    s.ad.dcs.forEach(function (d) {
      var k = 0;
      while (k < s.ad.changes.length && reached(s.ad.changes[k], d.id, s.t)) k++;
      d.replicatedUpTo = Math.max(d.replicatedUpTo, k);
    });
  }

  function newTgt(s) {
    var groups = tgtGroups(membersAt(s.ad, LOGON_DC), USER);
    return { issuedAt: s.t, groups: groups, expiresAt: s.t + TGT_LIFE, dc: LOGON_DC };
  }

  function validTicket(s, server) {
    return s.session.serviceTickets.filter(function (x) { return x.server === server && x.expiresAt > s.t; })[0] || null;
  }

  var logic = {
    /** Parameter defaults. */
    defaults: { change: 'add', changeOn: 'DC1', action: 'relog', smbOpen: false },

    NETBIOS: NETBIOS,
    USER: USER,
    USER_SID: USER_SID,
    PC: PC,
    FS: FS,
    DCS: DCS,
    LOGON_DC: LOGON_DC,
    SHARE: SHARE,
    LOCAL_FOLDER: LOCAL_FOLDER,
    GROUPS: GROUPS,
    GROUP_SID: GROUP_SID,
    WELL_KNOWN: WELL_KNOWN,
    TGT_LIFE: TGT_LIFE,
    SERVICE_LIFE: SERVICE_LIFE,
    REPL_DELAY: REPL_DELAY,
    RENEW_BEFORE: RENEW_BEFORE,
    RENEW_MAX: RENEW_MAX,
    DOMAIN_LOCAL: DOMAIN_LOCAL,
    ACL: ACL,
    ORDER: ORDER,
    CHANGES: ['add', 'remove'],
    CHANGE_ON: ['DC1', 'DC2'],
    ACTIONS: ['relog', 'renew', 'none'],

    /** Steps for these params: one per event of the schedule (4 to 8). */
    steps: function (p) { return plan(p).length; },

    /** State at step 0, 08:05: ana logged on at 08:00 against DC1 and opened a share on FS1 at 08:05 (a service
        ticket for FS1; with smbOpen the session from then is still open). */
    initial: function (p) {
      var base = baseMembers(p.change);
      var s = {
        t: MORNING_TICKET_AT,
        ad: {
          base: base,
          members: clone(base),
          changes: [],
          dcs: DCS.map(function (id) { return { id: id, replicatedUpTo: 0 }; })
        },
        session: null,
        fs1: { acl: clone(ACL.fs1), sessions: [] },
        local: { acl: clone(ACL.local) },
        attempt: null,
        log: []
      };
      var tgt = { issuedAt: LOGON_AT, groups: tgtGroups(base, USER), expiresAt: LOGON_AT + TGT_LIFE, dc: LOGON_DC };
      var st = serviceTicket(tgt, FS, MORNING_TICKET_AT, base);
      s.session = {
        user: USER, pc: PC, logonAt: LOGON_AT, logonDc: LOGON_DC, tokenGroups: expand(base, USER), tgt: tgt,
        serviceTickets: [st]
      };
      if (p.smbOpen) s.fs1.sessions.push({ user: USER, groups: st.groups.slice(), since: MORNING_TICKET_AT, expiresAt: s.session.serviceTickets[0].expiresAt });
      return s;
    },

    /** State after step n: the n-th event of the schedule. */
    step: function (s0, n, p) {
      var e = plan(p)[n - 1];
      if (!e) return s0;
      var s = clone(s0);
      var out = { kind: e.kind, at: e.at };
      s.t = e.at;
      sync(s);
      var ses = s.session;
      switch (e.kind) {
        case 'change': {
          // rule 6: the change is on the DC it was made on; the other DC gets it by replication
          var c = { at: e.at, dc: e.dc, op: e.op, principal: USER, group: 'Prodaja' };
          s.ad.changes.push(c);
          s.ad.members = applyChange(s.ad.members, c);
          sync(s);
          out.dc = e.dc; out.op = e.op; out.group = 'Prodaja';
          break;
        }
        case 'repl':
          out.from = e.from; out.to = e.to;
          break;
        case 'logoff':
          // rule 5: logging off ends the session: its token, its tickets and its SMB sessions
          out.groups = ses ? ses.tokenGroups.slice() : [];
          s.session = null;
          s.fs1.sessions = s.fs1.sessions.filter(function (x) { return x.user !== USER; });
          break;
        case 'logon': {
          // rule 1: a new token from what the answering DC has now, nesting expanded; a new TGT
          var tgt = newTgt(s);
          s.session = { user: USER, pc: PC, logonAt: s.t, logonDc: LOGON_DC, tokenGroups: expand(membersAt(s.ad, LOGON_DC), USER), tgt: tgt, serviceTickets: [] };
          out.dc = LOGON_DC; out.groups = s.session.tokenGroups.slice();
          break;
        }
        case 'tgt':
          // rule 4: new tickets (the old ones discarded: a new TGT from what DC1 has now), or the automatic renewal (the
          // groups copied, the service tickets kept); the logon token is not touched (rule 2)
          if (e.reason === 'renewal') ses.tgt = renewTgt(ses.tgt, s.t, ses.logonAt);
          else { ses.tgt = newTgt(s); ses.serviceTickets = []; }
          out.expiresAt = ses.tgt.expiresAt;
          out.reason = e.reason; out.dc = LOGON_DC; out.groups = ses.tgt.groups.slice();
          break;
        case 'ticket': {
          // rules 3, 4: the service ticket copies the TGT's groups; DC1 adds the domain local ones
          var st = serviceTicket(ses.tgt, FS, s.t, membersAt(s.ad, LOGON_DC));
          ses.serviceTickets = ses.serviceTickets.filter(function (x) { return x.server !== FS; }).concat([st]);
          out.server = FS; out.groups = st.groups.slice(); out.expiresAt = st.expiresAt;
          break;
        }
        case 'attempt': {
          var groups, via, since;
          if (e.where === 'local') {
            // rule 2: on PC-07 the check gets the logon token
            groups = ses.tokenGroups; via = 'token'; since = ses.logonAt;
          } else {
            // rules 3, 5: FS1 uses the open session's token while its ticket lasts; else it builds one from the
            // service ticket (a new session, or the open one authenticated again)
            var open = s.fs1.sessions.filter(function (x) { return x.user === USER; })[0];
            if (open && open.expiresAt > s.t) { groups = open.groups; via = 'session'; since = open.since; }
            else {
              var tk = validTicket(s, FS);
              groups = tk.groups; via = open ? 'reauth' : 'ticket'; since = tk.issuedAt;
              if (open) { open.groups = groups.slice(); open.since = s.t; open.expiresAt = tk.expiresAt; }
              else if (p.smbOpen) s.fs1.sessions.push({ user: USER, groups: groups.slice(), since: s.t, expiresAt: tk.expiresAt });
            }
          }
          var r = check(s[e.where === 'local' ? 'local' : 'fs1'].acl, groups, e.where);
          s.attempt = { at: s.t, where: e.where, ok: r.ok, row: r.row, hits: r.hits, groups: groups.slice(), via: via, since: since, n: n };
          out.where = e.where; out.ok = r.ok; out.via = via;
          break;
        }
      }
      out.n = n;
      s.log.push(out);
      return s;
    },

    // exported for the page and the tests
    plan: plan,
    sortEvents: sortEvents,
    baseMembers: baseMembers,
    applyChange: applyChange,
    expand: expand,
    tgtGroups: tgtGroups,
    withDomainLocal: withDomainLocal,
    renewTgt: renewTgt,
    membersAt: membersAt,
    reached: reached,
    tokenSids: tokenSids,
    check: check,
    serviceTicket: serviceTicket,
    diff: diff,
    clock: clock
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
