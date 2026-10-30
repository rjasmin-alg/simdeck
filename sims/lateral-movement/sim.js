/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lateral-movement: one attacker on a small AD estate follows stolen credentials from machine to machine.
   Five machines in three admin tiers; each holds in memory the credentials of whoever logged on there. The attacker
   gets a foothold on WS1, becomes local admin, copies what is cached, and reuses the best credential it holds
   (pass-the-hash) on the next machine, until it reaches the domain controller or nothing opens another door.
   Rules, tie-breaks and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. The estate and attacker functions take plain data and hold no words,
   so the model can be promoted to models/ unchanged (win-laps builds on it). */
(function (root) {
  'use strict';

  /** Tier of an ordinary user account: an admin nowhere. Admin tiers are 0 (identity), 1 (servers), 2 (workstations). */
  var USER = 3;

  /** The machines, by tier. Node ids sort as strings for the tie-break (rule T2). */
  var NODES = [
    { id: 'DC1', tier: 0, role: 'dc' },
    { id: 'APP1', tier: 1, role: 'app' },
    { id: 'FS1', tier: 1, role: 'fs' },
    { id: 'WS1', tier: 2, role: 'ws' },
    { id: 'WS2', tier: 2, role: 'ws' }
  ];

  /** Domain accounts and their tier. old-admin is a leaver whose Domain Admin account was never disabled. */
  var ACCOUNTS = {
    'ana': { tier: USER },
    'ivo': { tier: USER },
    'srv-admin': { tier: 1 },
    'da-admin': { tier: 0 },
    'old-admin': { tier: 0, leaver: true }
  };

  /** Short fragments of the local Administrator's NT hash; one image hash shared by the workstations. */
  var HASH = { image: '7c1e', WS1: '3fa9', WS2: 'd04b', APP1: '91c2', FS1: 'e58d' };

  /** Where the attacker lands, and as whom (phishing is upstream of this demo). */
  var FOOTHOLD = 'WS1';
  var FOOTHOLD_USER = 'ana';

  function tierOf(id) { for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i].tier; return null; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function byId(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  /**
   * Who logs on where, before tiering: [account, node, how]. 'interactive' leaves the NT hash in the logon
   * process's memory; 'task' (a scheduled task or service) stores the password in the machine's secrets.
   */
  function logons(p) {
    var out = [
      ['da-admin', 'DC1', 'interactive'],
      ['srv-admin', 'APP1', 'interactive'],
      ['srv-admin', 'FS1', 'interactive'],
      ['ana', 'WS1', 'interactive'],
      ['ivo', 'WS2', 'interactive'],
      ['srv-admin', 'WS2', 'interactive']            // a server admin works from their own workstation
    ];
    if (p.daLogsOnWS) out.push(['da-admin', 'WS1', 'interactive']);
    if (p.leaverAdmin) out.push(['old-admin', 'APP1', 'task']);
    return out;
  }

  /** Rule 4: with tiering, an admin account never logs on to an asset of a lower tier (a higher tier number). */
  function logonAllowed(who, nodeId, p) {
    var t = ACCOUNTS[who].tier;
    return !p.tiering || t === USER || t >= tierOf(nodeId);
  }

  /** Rule 3: the local Administrator's hash. LAPS: unique per workstation; else the image's, if shared. */
  function localAdminHash(node, p) {
    if (node.role === 'dc') return null;                 // a domain controller has no local accounts
    if (node.role !== 'ws') return HASH[node.id];        // servers are built one by one: their own password
    if (p.lapsOnWorkstations) return HASH[node.id];
    return p.sharedLocalAdmin ? HASH.image : HASH[node.id];
  }

  /** The estate for these params: each machine with what its memory holds, and the logons tiering refused. */
  function estate(p) {
    return NODES.map(function (n) {
      var cached = [], refused = [];
      logons(p).forEach(function (l) {
        if (l[1] !== n.id) return;
        var c = { who: l[0], tier: ACCOUNTS[l[0]].tier, kind: l[2] === 'task' ? 'password' : 'hash' };
        if (ACCOUNTS[l[0]].leaver) c.leaver = true;
        (logonAllowed(l[0], n.id, p) ? cached : refused).push(c);
      });
      return { id: n.id, tier: n.tier, role: n.role, localAdminHash: localAdminHash(n, p), cachedCreds: cached, refused: refused };
    });
  }

  function nodeOf(s, id) { for (var i = 0; i < s.nodes.length; i++) if (s.nodes[i].id === id) return s.nodes[i]; return null; }

  /** A held credential's key: a domain account by name, a local Administrator by its hash. */
  function keyOf(c) { return c.local ? 'local:' + c.hash : c.who; }

  /** Rule 1/2/3: does credential c give admin rights on node n? */
  function works(c, n) {
    if (c.local) return n.localAdminHash === c.hash;
    if (c.tier === 0) return true;                       // a Domain Admin is admin on every machine
    if (c.tier === USER) return false;
    return n.tier === c.tier;                            // a tier admin administers the machines of its tier
  }

  /**
   * Where the attacker will try credential c. A domain account's admin rights can be read from the directory by any
   * user, so the attacker tries exactly where it works. A local Administrator's hash is tried on the other machines
   * of the same tier (same image, maybe the same password): that is where LAPS shows.
   */
  function expects(c, n) {
    if (c.local) return n.id !== c.local && n.tier === c.tier && n.localAdminHash !== null;
    return works(c, n);
  }

  /**
   * The moves still open, best first. Tie-breaks: the credential's tier (highest first), then the target's tier
   * (highest first), then the target's node id, then a domain account before a local hash, then the account name.
   */
  function candidates(s) {
    var a = s.attacker, out = [];
    a.held.forEach(function (c) {
      s.nodes.forEach(function (n) {
        if (n.id === a.at || a.visited.indexOf(n.id) >= 0) return;
        if (!expects(c, n)) return;
        var k = keyOf(c);
        if (a.tried.some(function (t) { return t.via === k && t.to === n.id; })) return;
        out.push({ via: k, to: n.id, credTier: c.tier, nodeTier: n.tier, local: !!c.local, who: c.who, ok: works(c, n) });
      });
    });
    out.sort(function (x, y) {
      return x.credTier - y.credTier || x.nodeTier - y.nodeTier || byId(x.to, y.to) ||
        (x.local === y.local ? 0 : x.local ? 1 : -1) || byId(x.who, y.who) || byId(x.via, y.via);
    });
    return out;
  }

  /** Every edge from the attacker's machine it could try now, one per target: usable if any held credential works. */
  function edges(s) {
    var by = {};
    candidates(s).forEach(function (c) {
      var e = by[c.to] || (by[c.to] = { to: c.to, ok: false, via: [] });
      e.via.push(c.via);
      if (c.ok) e.ok = true;
    });
    return Object.keys(by).sort(byId).map(function (k) { return by[k]; });
  }

  /** Copy what a SYSTEM-level attacker reads on node n: its cached credentials and its local Administrator's hash. */
  function dumpOf(n) {
    var got = n.cachedCreds.map(function (c) { var o = clone(c); o.from = n.id; return o; });
    if (n.localAdminHash !== null) got.push({ who: 'Administrator', local: n.id, tier: n.tier, kind: 'hash', hash: n.localAdminHash, from: n.id });
    return got;
  }

  function best(held) {
    return held.reduce(function (m, c) { return Math.min(m, c.tier); }, USER);
  }

  var logic = {
    USER: USER,
    NODES: NODES,
    ACCOUNTS: ACCOUNTS,
    HASH: HASH,
    FOOTHOLD: FOOTHOLD,
    FOOTHOLD_USER: FOOTHOLD_USER,
    estate: estate,
    logonAllowed: logonAllowed,
    localAdminHash: localAdminHash,
    keyOf: keyOf,
    works: works,
    expects: expects,
    candidates: candidates,
    edges: edges,
    dumpOf: dumpOf,
    nodeOf: nodeOf,

    /** Defaults are the preset `flat`: no tiering, no LAPS, a Domain Admin logged on to WS1, one workstation image. */
    defaults: { tiering: false, lapsOnWorkstations: false, daLogsOnWS: true, sharedLocalAdmin: true, leaverAdmin: true },

    /** Steps for these params: every step until the domain falls or the attacker is stuck (flat: 5). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (!s.done && n < 30) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0: the estate; no attacker yet. */
    initial: function (p) {
      return {
        nodes: estate(p),
        attacker: { at: null, priv: null, held: [], visited: [], dumped: [], tried: [], path: [] },
        tiering: !!p.tiering,
        lapsOnWorkstations: !!p.lapsOnWorkstations,
        reachedTier0: false,
        outcome: null,
        done: false,
        last: null,
        log: []
      };
    },

    /** State after step n: one event (foothold, escalate, dump, move, refused, compromised, stalled). */
    step: function (prev, n, p) {
      var s = clone(prev), a = s.attacker, e;
      if (s.done) return s;
      if (a.at === null) {
        a.at = FOOTHOLD; a.priv = 'user'; a.visited.push(FOOTHOLD); a.path.push(FOOTHOLD);
        e = { kind: 'foothold', node: FOOTHOLD, who: FOOTHOLD_USER };
      } else if (a.priv === 'user') {
        a.priv = 'system';
        e = { kind: 'escalate', node: a.at };
      } else if (a.dumped.indexOf(a.at) < 0) {
        a.dumped.push(a.at);
        if (nodeOf(s, a.at).role === 'dc') {
          // the directory holds every account's hash; krbtgt signs every Kerberos ticket
          a.held.push({ who: 'krbtgt', tier: 0, kind: 'hash', from: a.at, all: true });
          s.reachedTier0 = true; s.outcome = 'compromised'; s.done = true;
          e = { kind: 'compromised', node: a.at, gained: ['krbtgt'] };
        } else {
          var gained = [], same = [];
          dumpOf(nodeOf(s, a.at)).forEach(function (c) {
            var k = keyOf(c);
            if (a.held.some(function (h) { return keyOf(h) === k; })) { same.push(k); return; }
            a.held.push(c); gained.push(k);
          });
          if (best(a.held) === 0) s.reachedTier0 = true;
          e = { kind: 'dump', node: a.at, gained: gained, same: same };
        }
      } else {
        var c = candidates(s)[0];
        if (!c) {
          s.outcome = 'contained'; s.done = true;
          e = { kind: 'stalled', node: a.at, tier: a.visited.reduce(function (m, id) { return Math.min(m, tierOf(id)); }, USER) };
        } else if (c.ok) {
          e = { kind: 'move', from: a.at, to: c.to, via: c.via };
          a.at = c.to; a.priv = 'system'; a.visited.push(c.to); a.path.push(c.to);
        } else {
          a.tried.push({ via: c.via, from: a.at, to: c.to });
          e = { kind: 'refused', from: a.at, to: c.to, via: c.via };
        }
      }
      e.n = n;
      s.last = e;
      s.log.push(e);
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
