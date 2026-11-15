/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-gpo-targeting: the GPO "Drive Maps" holds four drive-map preference items (P:, K:, H:, X:), each with
   a targeting expression over the user's groups (from the logon token), the client's IP address and its OS. With
   targeting on, the logon is walked one item per step; every later event (the laptop moves, the user is moved to
   another group, a new logon) is one whole pass. An item that does not match is not applied, and a drive it mapped
   earlier stays (tattoo) unless "Remove this item when it is no longer applied" is set. Rules, tie-break and numbers:
   SPEC.md. Builds on win-gpo-tattooing (Remove sets the action to Replace; removal needs this computer's history);
   no code is copied from it: its registry rule table does not fit drive maps.
   Pure: no DOM, no Math.random, no Date. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. ipToNumber(), termHolds(), evalTarget(), applyItem() and pass() take
   any items and client, so they can move to models/ unchanged. */
(function (root) {
  'use strict';

  /** The GPO's four items, in processing order (SPEC.md, "Scene"; the estate's gpos.txt). */
  var ITEMS = [
    { letter: 'P:', path: '\\\\hq-fs01\\projects', target: [{ op: 'and', not: false, type: 'group', value: 'Projects' }] },
    { letter: 'K:', path: '\\\\hq-fs01\\cinematics', target: [{ op: 'and', not: false, type: 'group', value: 'Cinematics' }] },
    { letter: 'H:', path: '\\\\weft\\home$\\%USERNAME%', target: [] },
    { letter: 'X:', path: '\\\\LOOM\\builds', target: [
      { op: 'and', not: false, type: 'ip', value: ['10.20.0.0', '10.20.255.255'] },
      { op: 'and', not: true, type: 'os', value: 'server' }
    ] }
  ];

  var USERS = {
    ana: { group: 'Projects', pc: 'LT07' },
    eyardley: { group: 'Cinematics', pc: 'LT12' }
  };
  var SITES = { hq: '10.10.20.57', branch: '10.20.0.57' };
  var OS = 'workstation';                          // a computer role: workstation, member server, domain controller
  var OTHER_GROUP = { Projects: 'Cinematics', Cinematics: 'Projects' };

  function ipToNumber(a) {
    return a.split('.').reduce(function (n, x) { return n * 256 + Number(x); }, 0);
  }

  /** One targeting item against the client, after "is not". client: { groups, ip, server }. */
  function termHolds(term, client) {
    var r;
    if (term.type === 'group') r = client.groups.indexOf(term.value) >= 0;
    else if (term.type === 'ip') {
      var n = ipToNumber(client.ip);
      r = n >= ipToNumber(term.value[0]) && n <= ipToNumber(term.value[1]);
    } else if (term.type === 'os') r = term.value === 'server' ? !!client.server : false;
    else r = false;
    return term.not ? !r : r;
  }

  /**
   * Rule 2: left to right, each term joined to the result so far by its own AND/OR (the first term's op is not
   * read). An empty target matches. Returns { match, terms: [bool per term] }.
   */
  function evalTarget(target, client) {
    var acc = null;
    var terms = target.map(function (term) {
      var r = termHolds(term, client);
      acc = acc === null ? r : term.op === 'or' ? (acc || r) : (acc && r);
      return r;
    });
    return { match: acc === null ? true : acc, terms: terms };
  }

  /** Remove sets the action to Replace (win-gpo-tattooing, rule 2). */
  function actionOf(removeFlag) { return removeFlag ? 'Replace' : 'Update'; }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /**
   * One item in one pass (rules 1, 5, 6). Mutates s.mapped and s.history. client: { groups, ip, server }.
   * Returns { code, match, fails, before, after }; code: map | same | skip | stale | remove | noGpo.
   */
  function applyItem(s, i, client) {
    var item = s.items[i];
    var cur = s.mapped[item.letter] || null;
    var before = cur ? clone(cur) : null;
    if (!s.gpoApplies) {
      return { code: 'noGpo', match: null, fails: [], before: before, after: before };      // rule 1
    }
    var ev = s.targeting ? evalTarget(item.target, client) : { match: true, terms: [] };
    var fails = [];
    item.target.forEach(function (term, k) { if (s.targeting && !ev.terms[k]) fails.push(term.type); });
    var code;
    if (ev.match) {
      // rule 6: a later item for the same letter maps over an earlier one (it is processed last)
      code = cur && cur.item === i ? 'same' : 'map';
      s.mapped[item.letter] = { path: item.path, item: i, stale: false };
      s.history[i] = true;
    } else if (cur && cur.item === i) {
      if (s.removeFlag && s.history[i]) {                                                   // rule 5, Remove
        delete s.mapped[item.letter];
        s.history[i] = false;
        code = 'remove';
      } else {
        s.mapped[item.letter].stale = true;                                                // rule 5, tattoo
        code = 'stale';
      }
    } else {
      code = 'skip';
    }
    var after = s.mapped[item.letter] ? clone(s.mapped[item.letter]) : null;
    return { code: code, match: ev.match, fails: fails, before: before, after: after };
  }

  /** The client as targeting sees it: groups from the token (rule 3), the current IP (rule 4), the OS. */
  function clientOf(s) {
    return { groups: s.user.tokenGroups || [], ip: s.pc.ip, server: s.pc.server };
  }

  /** A whole pass over the items in order. */
  function pass(s) {
    var c = clientOf(s);
    return s.items.map(function (it, i) { return applyItem(s, i, c); });
  }

  /** The events of a run (SPEC.md, "Steps"). */
  function events(p) {
    var ev = [];
    if (p.targeting) for (var i = 0; i < ITEMS.length; i++) ev.push({ t: 0, kind: 'logon', cursor: i });
    else ev.push({ t: 0, kind: 'logon', cursor: 'all' });
    if (p.script === 'move') ev.push({ t: 100, kind: 'moveRefresh', cursor: 'all' });
    if (p.script === 'group') {
      ev.push({ t: 100, kind: 'groupRefresh', cursor: 'all' });
      ev.push({ t: 1440, kind: 'relogon', cursor: 'all' });
    }
    return ev;
  }

  var logic = {
    defaults: { user: 'ana', location: 'hq', script: 'group', targeting: true, removeFlag: false },

    presets: [
      { id: 'quillmoor-as-is', params: { user: 'ana', location: 'hq', script: 'none', targeting: false, removeFlag: false } },
      { id: 'targeted', params: { user: 'ana', location: 'hq', script: 'none', targeting: true, removeFlag: false } },
      { id: 'branch-laptop', params: { user: 'ana', location: 'hq', script: 'move', targeting: true, removeFlag: false } },
      { id: 'group-change', params: { user: 'ana', location: 'hq', script: 'group', targeting: true, removeFlag: false } },
      { id: 'remove-flag', params: { user: 'ana', location: 'hq', script: 'group', targeting: true, removeFlag: true } }
    ],

    steps: function (p) { return events(p).length; },

    initial: function (p) {
      var u = USERS[p.user];
      return {
        targeting: !!p.targeting,
        removeFlag: !!p.removeFlag,
        gpoApplies: true,                                           // rule 1: linked at the root, Authenticated Users
        items: ITEMS.map(function (it) {
          return { letter: it.letter, path: it.path, target: clone(it.target), action: actionOf(!!p.removeFlag) };
        }),
        user: { name: p.user, groups: [u.group], tokenGroups: null },
        pc: { name: u.pc, ip: SITES[p.location], site: p.location, os: OS, server: false },
        mapped: {},                                                 // letter → { path, item, stale }
        history: ITEMS.map(function () { return false; }),          // applied before on this computer (Remove)
        event: null,                                                // { t, kind, cursor }
        results: ITEMS.map(function () { return null; }),           // per item, from its latest evaluation
        log: []
      };
    },

    step: function (s0, n, p) {
      var s = clone(s0);
      var ev = events(p)[n - 1];
      if (ev.kind === 'logon' && (ev.cursor === 0 || ev.cursor === 'all')) {
        s.user.tokenGroups = s.user.groups.slice();                 // rule 3: the token is made at the logon
        s.results = s.items.map(function () { return null; });
      }
      if (ev.kind === 'moveRefresh') {                              // rule 4: the laptop gets the other site's address
        s.pc.site = s.pc.site === 'hq' ? 'branch' : 'hq';
        s.pc.ip = SITES[s.pc.site];
      }
      if (ev.kind === 'groupRefresh') {                             // rule 3: the directory changes, the token does not
        s.user.groups = s.user.groups.map(function (g) { return OTHER_GROUP[g] || g; });
      }
      if (ev.kind === 'relogon') s.user.tokenGroups = s.user.groups.slice();
      if (ev.cursor === 'all') s.results = pass(s);
      else s.results[ev.cursor] = applyItem(s, ev.cursor, clientOf(s));
      s.event = { t: ev.t, kind: ev.kind, cursor: ev.cursor };
      s.log.push({ t: ev.t, kind: ev.kind, cursor: ev.cursor });
      return s;
    },

    ITEMS: ITEMS,
    USERS: USERS,
    SITES: SITES,
    events: events,
    ipToNumber: ipToNumber,
    termHolds: termHolds,
    evalTarget: evalTarget,
    actionOf: actionOf,
    applyItem: applyItem,
    pass: pass
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
