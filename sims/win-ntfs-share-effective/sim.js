/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ntfs-share-effective: folder D:\Prodaja shared as \\FS1\Prodaja. A user's token (user, groups with
   nesting expanded, well-known groups), the folder's NTFS ACL evaluated in canonical order (explicit deny, explicit
   allow, inherited deny, inherited allow; the first ACE that mentions a right decides it), the share's ACL (allows
   add up, any deny wins), and the effective access: over the network the stricter of the two, right by right;
   locally NTFS alone. An explorer: initial(params) is the whole model, no steps. Rules and expected results: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Rights are evaluated as five atoms (SPEC §1): read data, execute/traverse, write, delete, change permissions and
      take ownership. The page shows the standard levels built from them (LEVELS). */
  var ATOMS = ['r', 'x', 'w', 'd', 'p'];

  /** NTFS standard permissions as atom sets (SPEC §1). Order = the chips R, X, W, M, F. */
  var LEVELS = ['read', 'readExecute', 'write', 'modify', 'full'];
  var NTFS_MASK = {
    read: ['r'],
    readExecute: ['r', 'x'],
    write: ['w'],
    modify: ['r', 'x', 'w', 'd'],
    full: ATOMS.slice()
  };
  /** Levels each level includes (for naming an atom set by its largest levels). */
  var IMPLIES = { read: [], readExecute: ['read'], write: [], modify: ['read', 'readExecute', 'write'], full: ['read', 'readExecute', 'write', 'modify'] };

  /** Share permissions (SPEC rule 7): Read ≈ NTFS Read & execute, Change ≈ Modify, Full Control ≈ Full Control.
      An allow grants the whole level; a deny removes what that box stands for: Read its read rights, Change what
      Change adds over Read, Full Control everything (SPEC rule 5). */
  var SHARE_LEVELS = ['read', 'change', 'full'];
  var SHARE_ALLOW = { read: ['r', 'x'], change: ['r', 'x', 'w', 'd'], full: ATOMS.slice() };
  var SHARE_DENY = { read: ['r', 'x'], change: ['w', 'd'], full: ATOMS.slice() };

  /** Canonical order of a DACL (SPEC rule 2). */
  var CANON = ['explicitDeny', 'explicitAllow', 'inheritedDeny', 'inheritedAllow'];

  var DOMAIN = 'QUILLMOOR';
  var DOM_SID = 'S-1-5-21-…';

  /** Groups and their SIDs. `in` lists the groups this group is a member of (nesting, SPEC rule 1). */
  var GROUPS = {
    Prodaja: { sid: DOM_SID + '-1201', scope: 'domain', in: [] },
    Pripravnici: { sid: DOM_SID + '-1202', scope: 'domain', in: [] },
    Voditelji: { sid: DOM_SID + '-1203', scope: 'domain', in: [] },
    'Domain Users': { sid: DOM_SID + '-513', scope: 'domain', in: ['Users'] },
    Users: { sid: 'S-1-5-32-545', scope: 'builtin', in: [] },
    Administrators: { sid: 'S-1-5-32-544', scope: 'builtin', in: [] }
  };
  /** Well-known SIDs every logged-on user carries; NETWORK or INTERACTIVE by how the user came in (SPEC rule 1). */
  var WELL_KNOWN = {
    Everyone: 'S-1-1-0',
    'Authenticated Users': 'S-1-5-11',
    NETWORK: 'S-1-5-2',
    INTERACTIVE: 'S-1-5-4',
    SYSTEM: 'S-1-5-18'
  };

  var USER_RID = { ana: 1104, ivan: 1105, marko: 1106 };

  function has(list, x) { return list.indexOf(x) >= 0; }
  function inOrder(set) { return ATOMS.filter(function (a) { return has(set, a); }); }
  function union(a, b) { return inOrder(a.concat(b)); }

  /** The scene's users for these params. Every domain user is in Domain Users (the primary group). */
  function usersOf(p) {
    return [
      { name: 'ana', groups: ['Domain Users', 'Prodaja'].concat(p.voditelji ? ['Voditelji'] : []) },
      { name: 'ivan', groups: ['Domain Users', 'Prodaja', 'Pripravnici'] },
      { name: 'marko', groups: ['Domain Users'] }
    ];
  }

  /** The share's ACL (SPEC §1). */
  function shareOf(p) {
    var rows = [
      { principal: 'Administrators', level: 'full', type: 'allow' },
      { principal: 'Everyone', level: SHARE_ALLOW[p.shareEveryone] ? p.shareEveryone : 'full', type: 'allow' }
    ];
    if (p.shareDenyEveryone) rows.push({ principal: 'Everyone', level: 'change', type: 'deny' });
    return rows;
  }

  /** The folder's NTFS ACL in the order it is written (SPEC §1); canonical() sorts it. */
  function ntfsOf(p) {
    var rows = [];
    if (p.denyPripravnici === 'explicit') rows.push({ principal: 'Pripravnici', rights: 'write', type: 'deny', inherited: false });
    if (p.explicitAllowIvan) rows.push({ principal: 'ivan', rights: 'modify', type: 'allow', inherited: false });
    rows.push({ principal: 'Prodaja', rights: p.ntfsProdaja === 'read' ? 'read' : 'modify', type: 'allow', inherited: false });
    rows.push({ principal: 'Voditelji', rights: 'write', type: 'allow', inherited: false });
    if (p.denyPripravnici === 'inherited') rows.push({ principal: 'Pripravnici', rights: 'write', type: 'deny', inherited: true });
    rows.push({ principal: 'Administrators', rights: 'full', type: 'allow', inherited: true });
    rows.push({ principal: 'SYSTEM', rights: 'full', type: 'allow', inherited: true });
    return rows;
  }

  /** A row's identity across param changes (rows come and go): who, allow or deny, explicit or inherited. */
  function aceId(ace) { return ace.principal + '|' + ace.type + (ace.inherited ? '|inherited' : ''); }
  function canonOf(ace) { return (ace.inherited ? 'inherited' : 'explicit') + (ace.type === 'deny' ? 'Deny' : 'Allow'); }
  /** Stable sort into canonical order; ACEs of the same group keep their written order (SPEC rule 2, tie-break). */
  function canonical(acl) {
    return acl.map(function (a, i) { return { a: a, i: i }; })
      .sort(function (x, y) { return (CANON.indexOf(canonOf(x.a)) - CANON.indexOf(canonOf(y.a))) || (x.i - y.i); })
      .map(function (x) { return Object.assign({}, x.a, { canon: canonOf(x.a) }); });
  }

  /** The token: the user, every group with nesting expanded (each once, first path wins), then the well-known
      groups (SPEC rule 1). Each entry { name, sid, kind: user|group|nested|wellKnown, via }. */
  function tokenOf(user, path) {
    var out = [{ name: user.name, sid: DOM_SID + '-' + USER_RID[user.name], kind: 'user', via: null }];
    var seen = {};
    seen[user.name] = true;
    var queue = user.groups.map(function (g) { return { name: g, via: null }; });
    while (queue.length) {
      var g = queue.shift();
      if (seen[g.name] || !GROUPS[g.name]) continue;
      seen[g.name] = true;
      out.push({ name: g.name, sid: GROUPS[g.name].sid, kind: g.via ? 'nested' : 'group', via: g.via });
      GROUPS[g.name].in.forEach(function (parent) { queue.push({ name: parent, via: g.name }); });
    }
    ['Everyone', 'Authenticated Users', path === 'local' ? 'INTERACTIVE' : 'NETWORK'].forEach(function (w) {
      out.push({ name: w, sid: WELL_KNOWN[w], kind: 'wellKnown', via: null });
    });
    return out;
  }

  /** NTFS check (SPEC rules 2–4): walk the ACEs in canonical order; for each atom the first ACE that matches a SID
      in the token and mentions it decides it (deny → refused, allow → granted); an atom no ACE mentions is refused
      (implicit deny). Returns { atoms, by: { atom: row index | -1 }, rows: [{ match, decided: [atoms] }] }. */
  function evalNtfs(acl, names) {
    var by = {}, granted = [];
    var rows = acl.map(function (ace, i) {
      var match = has(names, ace.principal), decided = [];
      if (match) NTFS_MASK[ace.rights].forEach(function (a) {
        if (by[a] !== undefined) return;
        by[a] = i;
        decided.push(a);
        if (ace.type === 'allow') granted.push(a);
      });
      return { match: match, decided: decided };
    });
    ATOMS.forEach(function (a) { if (by[a] === undefined) by[a] = -1; });
    return { atoms: inOrder(granted), by: by, rows: rows };
  }

  /** Share check (SPEC rule 5): every matching allow adds its level; any matching deny removes what it denies,
      whatever the order. by: { atom: [row indices that decided it] } (the denies if denied, else the allows). */
  function evalShare(acl, names) {
    var allowed = [], denied = [], allowBy = {}, denyBy = {};
    var match = acl.map(function (ace) { return has(names, ace.principal); });
    acl.forEach(function (ace, i) {
      if (!match[i]) return;
      var mask = ace.type === 'deny' ? SHARE_DENY[ace.level] : SHARE_ALLOW[ace.level];
      mask.forEach(function (a) {
        var to = ace.type === 'deny' ? denyBy : allowBy;
        (to[a] = to[a] || []).push(i);
      });
      if (ace.type === 'deny') denied = union(denied, mask); else allowed = union(allowed, mask);
    });
    var atoms = allowed.filter(function (a) { return !has(denied, a); });
    var by = {};
    ATOMS.forEach(function (a) { by[a] = denyBy[a] ? denyBy[a] : allowBy[a] ? allowBy[a] : []; });
    var rows = acl.map(function (ace, i) {
      var decided = ATOMS.filter(function (a) { return has(by[a], i); });
      return { match: match[i], decided: decided };
    });
    return { atoms: atoms, by: by, rows: rows };
  }

  /** Levels on/off for an atom set: a level holds when all its atoms do. */
  function levelsOf(atoms) {
    var out = {};
    LEVELS.forEach(function (l) { out[l] = NTFS_MASK[l].every(function (a) { return has(atoms, a); }); });
    return out;
  }
  /** The largest levels an atom set holds (none implied by another), e.g. ['readExecute', 'write']. */
  function nameOf(atoms) {
    var on = levelsOf(atoms);
    var held = LEVELS.filter(function (l) { return on[l]; });
    return held.filter(function (l) { return !held.some(function (m) { return m !== l && has(IMPLIES[m], l); }); });
  }
  /** The largest share level an atom set holds, or null. */
  function shareNameOf(atoms) {
    var best = null;
    SHARE_LEVELS.forEach(function (l) { if (SHARE_ALLOW[l].every(function (a) { return has(atoms, a); })) best = l; });
    return best;
  }

  /** Which ACE rows decided a level (SPEC §3 "decided by"): when held, the rows that supplied its atoms; when
      refused, the rows that refused one of its atoms, or [] for "no ACE grants it" (implicit deny). */
  function levelDeciders(levels, atoms, byAtom, kind) {
    var out = {};
    LEVELS.forEach(function (l) {
      var mask = NTFS_MASK[l], rows = [];
      var add = function (list) { list.forEach(function (i) { if (i >= 0 && !has(rows, i)) rows.push(i); }); };
      if (levels[l]) mask.forEach(function (a) { add(kind === 'share' ? byAtom[a] : [byAtom[a]]); });
      else mask.forEach(function (a) {
        if (has(atoms, a)) return;
        add(kind === 'share' ? byAtom[a] : [byAtom[a]]);
      });
      out[l] = rows.sort(function (a, b) { return a - b; });
    });
    return out;
  }

  /** Row marks for the rule table: a matching row that decided an atom wins; a matching row that decided nothing
      was too late (beaten); a row whose principal is not in the token is "no". */
  function marksOf(rows) {
    return rows.map(function (r) { return !r.match ? 'no' : r.decided.length ? 'win' : 'beaten'; });
  }

  function evaluate(p) {
    var users = usersOf(p);
    var user = users.filter(function (u) { return u.name === p.who; })[0] || users[0];
    var path = p.path === 'local' ? 'local' : 'network';
    var sids = tokenOf(user, path);
    var names = sids.map(function (s) { return s.name; });

    var ntfs = canonical(ntfsOf(p));
    var n = evalNtfs(ntfs, names);
    var ntfsLevels = levelsOf(n.atoms);
    var ntfsEff = {
      atoms: n.atoms, levels: ntfsLevels, name: nameOf(n.atoms),
      deciders: levelDeciders(ntfsLevels, n.atoms, n.by, 'ntfs'),
      rows: n.rows.map(function (r, i) { return { match: r.match, decided: r.decided, mark: marksOf(n.rows)[i] }; }),
      implicit: !n.rows.some(function (r) { return r.match; })
    };
    // Each row's decided levels (for the row's outcome): the levels whose deciders include it.
    ntfsEff.rows.forEach(function (r, i) { r.levels = LEVELS.filter(function (l) { return has(ntfsEff.deciders[l], i); }); });

    var share = shareOf(p);
    var shareEff = null;
    if (path === 'network') {
      var s = evalShare(share, names);
      var shareLevels = levelsOf(s.atoms);
      var marks = marksOf(s.rows);
      shareEff = {
        atoms: s.atoms, levels: shareLevels, name: nameOf(s.atoms), shareName: shareNameOf(s.atoms),
        deciders: levelDeciders(shareLevels, s.atoms, s.by, 'share'),
        rows: s.rows.map(function (r, i) { return { match: r.match, decided: r.decided, mark: marks[i] }; }),
      };
      shareEff.rows.forEach(function (r, i) { r.levels = LEVELS.filter(function (l) { return has(shareEff.deciders[l], i); }); });
    }

    // Effective (SPEC rule 6): over the network an atom needs both; locally NTFS alone.
    var effAtoms = shareEff ? n.atoms.filter(function (a) { return has(shareEff.atoms, a); }) : n.atoms.slice();
    var effLevels = levelsOf(effAtoms);
    var by = {};
    LEVELS.forEach(function (l) {
      if (!shareEff) by[l] = 'ntfs';
      else if (effLevels[l]) by[l] = 'both';
      else if (!ntfsLevels[l] && !shareEff.levels[l]) by[l] = 'neither';
      else by[l] = ntfsLevels[l] ? 'share' : 'ntfs';
    });
    var decidedBy;
    if (!shareEff) decidedBy = 'local';
    else {
      // compared level by level, as the page shows them (a leftover atom such as P alone changes no level)
      var eqN = sameLevels(effLevels, ntfsLevels), eqS = sameLevels(effLevels, shareEff.levels);
      decidedBy = eqN && eqS ? 'same' : eqN ? 'ntfs' : eqS ? 'share' : 'both';
    }

    return {
      who: user.name, path: path,
      users: users, share: share, ntfs: ntfs,
      sids: sids,
      ntfsEff: ntfsEff,
      shareEff: shareEff,
      effective: { atoms: effAtoms, levels: effLevels, name: nameOf(effAtoms), by: by },
      decidedBy: decidedBy
    };
  }
  function sameLevels(a, b) { return LEVELS.every(function (l) { return a[l] === b[l]; }); }

  var BASE = { who: 'ana', path: 'network', shareEveryone: 'full', shareDenyEveryone: false, ntfsProdaja: 'modify', denyPripravnici: 'none', explicitAllowIvan: false, voditelji: false };
  function preset(over) { return Object.assign({}, BASE, over); }

  var logic = {
    defaults: Object.assign({}, BASE),

    presets: [
      { id: 'classic', params: preset({}) },
      { id: 'default-share', params: preset({ shareEveryone: 'read' }) },
      { id: 'groups-add-up', params: preset({ ntfsProdaja: 'read', voditelji: true }) },
      { id: 'deny-wins', params: preset({ who: 'ivan', denyPripravnici: 'explicit' }) },
      { id: 'explicit-beats-inherited', params: preset({ who: 'ivan', ntfsProdaja: 'read', denyPripravnici: 'inherited', explicitAllowIvan: true }) },
      { id: 'deny-everyone-share', params: preset({ shareDenyEveryone: true }) }
    ],

    initial: evaluate,

    ATOMS: ATOMS,
    LEVELS: LEVELS,
    NTFS_MASK: NTFS_MASK,
    SHARE_LEVELS: SHARE_LEVELS,
    SHARE_ALLOW: SHARE_ALLOW,
    SHARE_DENY: SHARE_DENY,
    CANON: CANON,
    DOMAIN: DOMAIN,
    GROUPS: GROUPS,
    WELL_KNOWN: WELL_KNOWN,
    usersOf: usersOf,
    shareOf: shareOf,
    ntfsOf: ntfsOf,
    canonical: canonical,
    tokenOf: tokenOf,
    evalNtfs: evalNtfs,
    evalShare: evalShare,
    levelsOf: levelsOf,
    nameOf: nameOf,
    shareNameOf: shareNameOf,

    /** What changed between two states (the page's "changed" mark): NTFS and share row indices whose mark or
        decided levels changed, and the levels whose chip changed per result. */
    changes: function (a, b) {
      var out = { ntfs: [], share: [], chips: { share: [], ntfs: [], effective: [] } };
      if (!a || !b) return out;
      // Rows are matched by identity, not position: adding a row marks that row only, not every row below it.
      var keyOf = function (acl, e, id) {
        for (var i = 0; i < acl.length; i++) {
          if (aceId(acl[i]) !== id) continue;
          var r = e ? e.rows[i] : null;
          return JSON.stringify(acl[i]) + (r ? r.mark + ':' + r.levels.join(',') : '');
        }
        return null;
      };
      b.ntfs.forEach(function (x, i) { if (keyOf(a.ntfs, a.ntfsEff, aceId(x)) !== keyOf(b.ntfs, b.ntfsEff, aceId(x))) out.ntfs.push(i); });
      b.share.forEach(function (x, i) { if (keyOf(a.share, a.shareEff, aceId(x)) !== keyOf(b.share, b.shareEff, aceId(x))) out.share.push(i); });
      var lv = function (e) { return e ? e.levels : null; };
      [['share', lv(a.shareEff), lv(b.shareEff)], ['ntfs', a.ntfsEff.levels, b.ntfsEff.levels], ['effective', a.effective.levels, b.effective.levels]].forEach(function (x) {
        LEVELS.forEach(function (l) { if ((x[1] ? x[1][l] : null) !== (x[2] ? x[2][l] : null)) out.chips[x[0]].push(l); });
      });
      return out;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
