/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ntfs-inheritance: a folder tree on two NTFS volumes, each object with its own (explicit) ACEs and the
   ACEs it inherits from the folders above it. One step = one operation of the preset's script (add or remove an ACE,
   disable inheritance, copy, move, look at another object); after it the inherited ACEs are recomputed over the tree,
   every DACL is sorted (explicit deny, explicit allow, then the inherited ones level by level, the parent's first,
   deny before allow within a level) and the chosen user's effective access is read from it (the first ACE that
   mentions a right decides it). Rules and expected results: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── rights: from sims/win-ntfs-share-effective/sim.js @ 03cc601 (ATOMS, LEVELS, NTFS_MASK, IMPLIES, levelsOf,
  //    nameOf; the access check below is its evalNtfs with "applies to this object" added). models/ has no NTFS model
  //    yet: see NOTES.md "Shared requests". ──
  var ATOMS = ['r', 'x', 'w', 'd', 'p'];
  var LEVELS = ['read', 'readExecute', 'write', 'modify', 'full'];
  var NTFS_MASK = {
    read: ['r'],
    readExecute: ['r', 'x'],
    write: ['w'],
    modify: ['r', 'x', 'w', 'd'],
    full: ATOMS.slice()
  };
  var IMPLIES = { read: [], readExecute: ['read'], write: [], modify: ['read', 'readExecute', 'write'], full: ['read', 'readExecute', 'write', 'modify'] };

  function has(list, x) { return list.indexOf(x) >= 0; }
  function inOrder(set) { return ATOMS.filter(function (a) { return has(set, a); }); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function levelsOf(atoms) {
    var out = {};
    LEVELS.forEach(function (l) { out[l] = NTFS_MASK[l].every(function (a) { return has(atoms, a); }); });
    return out;
  }
  function nameOf(atoms) {
    var on = levelsOf(atoms);
    var held = LEVELS.filter(function (l) { return on[l]; });
    return held.filter(function (l) { return !held.some(function (m) { return m !== l && has(IMPLIES[m], l); }); });
  }

  // ── "applies to" and the inheritance flags (SPEC rule 2) ──
  var APPLIES = ['this', 'this+sub+files', 'sub+files', 'files'];
  var FLAGS = { 'this': [], 'this+sub+files': ['OI', 'CI'], 'sub+files': ['OI', 'CI', 'IO'], 'files': ['OI', 'IO'] };

  /** Does the ACE count in the access check of the object that holds it? Inherit-only ACEs do not. Files: always. */
  function effectiveOn(ace, kind) { return kind === 'file' || ace.appliesTo === 'this' || ace.appliesTo === 'this+sub+files'; }
  /** What a child of this kind receives from a folder's ACE: its "applies to" there, or null for nothing. */
  function passDown(appliesTo, childKind) {
    if (appliesTo === 'this') return null;
    if (childKind === 'file') return 'this';
    if (appliesTo === 'files') return 'files';          // OI IO stays inherit-only on a subfolder, for its files
    return 'this+sub+files';                             // OI CI (an IO on the parent is cleared on the child)
  }

  // ── the scene (SPEC §1) ──
  var USERS = {
    ana: ['Zaposlenici', 'Grafičari'],
    marko: ['Zaposlenici', 'Arhivari'],
    vanjski: ['Vanjski']
  };
  function tokenOf(user) { return [user].concat(USERS[user] || []); }

  function ace(id, trustee, type, rights, appliesTo) {
    return { id: id, trustee: trustee, type: type, rights: rights, appliesTo: appliesTo };
  }
  var TSF = 'this+sub+files';
  function baseTree() {
    return [
      { id: 'proj', name: 'D:\\Projekti', parent: null, kind: 'folder', vol: 'D', inherit: true, kept: null,
        aces: [ace('p1', 'Administrators', 'allow', 'full', TSF), ace('p2', 'Zaposlenici', 'allow', 'readExecute', TSF)] },
      { id: 'arh', name: 'Arhiva', parent: 'proj', kind: 'folder', vol: 'D', inherit: true, kept: null,
        aces: [ace('a1', 'Arhivari', 'allow', 'modify', TSF)] },
      { id: 'graf', name: 'Grafika', parent: 'proj', kind: 'folder', vol: 'D', inherit: true, kept: null, aces: [] },
      { id: 'kamp', name: 'Kampanja2026', parent: 'graf', kind: 'folder', vol: 'D', inherit: true, kept: null, aces: [] },
      { id: 'logo', name: 'logo.psd', parent: 'kamp', kind: 'file', vol: 'D', inherit: true, kept: null, aces: [] },
      { id: 'plakat', name: 'plakat.psd', parent: 'kamp', kind: 'file', vol: 'D', inherit: true, kept: null,
        aces: [ace('k1', 'ana', 'allow', 'full', 'this')] },
      { id: 'earh', name: 'E:\\Arhiva', parent: null, kind: 'folder', vol: 'E', inherit: true, kept: null,
        aces: [ace('e1', 'Administrators', 'allow', 'full', TSF), ace('e2', 'Arhivari', 'allow', 'modify', TSF), ace('e3', 'Zaposlenici', 'allow', 'readExecute', TSF)] }
    ];
  }

  // ── the tree ──
  function byId(tree, id) {
    for (var i = 0; i < tree.length; i++) if (tree[i].id === id) return tree[i];
    return null;
  }
  function byName(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0; }
  function childrenOf(tree, id) { return tree.filter(function (x) { return x.parent === id; }).sort(byName); }
  /** Every node, parents before children, siblings by name (then id); the tops by name (D: before E:). */
  function order(tree) {
    var out = [];
    (function walk(list, depth) {
      list.forEach(function (x) { out.push({ id: x.id, depth: depth }); walk(childrenOf(tree, x.id), depth + 1); });
    })(tree.filter(function (x) { return x.parent === null || !byId(tree, x.parent); }).sort(byName), 0);
    return out;
  }
  function pathOf(tree, id) {
    var x = byId(tree, id);
    if (!x) return '';
    var up = x.parent ? byId(tree, x.parent) : null;
    return up ? pathOf(tree, up.id) + '\\' + x.name : x.name;
  }
  /** id and every node below it. */
  function subtree(tree, id) {
    var out = [id];
    childrenOf(tree, id).forEach(function (c) { out = out.concat(subtree(tree, c.id)); });
    return out;
  }

  // ── DACLs (SPEC rules 1–3) ──
  /** Sort key of a DACL row: explicit deny 0, explicit allow 1; inherited: level by level, deny before allow. */
  function rank(r) { return r.explicit ? (r.type === 'deny' ? 0 : 1) : 2 * r.lvl + (r.type === 'deny' ? 0 : 1); }
  /** Stable sort into Windows order (rule 3; same group keeps its order). */
  function sortDacl(rows) {
    return rows.map(function (r, i) { return { r: r, i: i }; })
      .sort(function (a, b) { return (rank(a.r) - rank(b.r)) || (a.i - b.i); })
      .map(function (x) { return x.r; });
  }
  /** Every node's DACL, computed: its explicit ACEs plus what it inherits (or its kept set after a move). Rows:
      { id, trustee, type, rights, appliesTo, explicit, from (node id or null), lvl (0 explicit, 1 parent, …), kept }. */
  function dacls(tree) {
    var out = {};
    order(tree).forEach(function (o) {
      var x = byId(tree, o.id);
      var own = x.aces.map(function (a) {
        return { id: a.id, trustee: a.trustee, type: a.type, rights: a.rights, appliesTo: x.kind === 'file' ? 'this' : a.appliesTo, explicit: true, from: null, lvl: 0, kept: false };
      });
      var inh = [];
      if (x.inherit && x.kept) inh = x.kept.map(function (r) { return Object.assign({}, r, { kept: true }); });
      else if (x.inherit && x.parent && out[x.parent]) {
        out[x.parent].forEach(function (r) {
          var to = passDown(r.appliesTo, x.kind);
          if (!to) return;
          inh.push({ id: r.id, trustee: r.trustee, type: r.type, rights: r.rights, appliesTo: to, explicit: false,
            from: r.explicit ? x.parent : r.from, lvl: r.lvl + 1, kept: false });
        });
      }
      out[o.id] = sortDacl(own.concat(inh));
    });
    return out;
  }

  /** The access check (rule 3): walk the DACL in order; for each atom the first row that applies to this object,
      matches a SID in the token and mentions the atom decides it. Rows: { applies, match, decided, mark }:
      mark 'skip' (inherit-only here), 'no' (not in the token), 'win' (decided something), 'beaten' (too late). */
  function access(dacl, kind, user) {
    var token = tokenOf(user);
    var by = {}, granted = [];
    var rows = dacl.map(function (r, i) {
      var applies = effectiveOn(r, kind), match = applies && has(token, r.trustee), decided = [];
      if (match) NTFS_MASK[r.rights].forEach(function (a) {
        if (by[a] !== undefined) return;
        by[a] = i;
        decided.push(a);
        if (r.type === 'allow') granted.push(a);
      });
      return { applies: applies, match: match, decided: decided, mark: !applies ? 'skip' : !match ? 'no' : decided.length ? 'win' : 'beaten' };
    });
    ATOMS.forEach(function (a) { if (by[a] === undefined) by[a] = -1; });
    var atoms = inOrder(granted), levels = levelsOf(atoms);
    // which rows decided each level: held → the rows that granted its atoms; refused → the rows that refused one
    var deciders = {};
    LEVELS.forEach(function (l) {
      var list = [];
      NTFS_MASK[l].forEach(function (a) {
        if (!levels[l] && has(atoms, a)) return;
        if (by[a] >= 0 && !has(list, by[a])) list.push(by[a]);
      });
      deciders[l] = list.sort(function (a, b) { return a - b; });
    });
    rows.forEach(function (r, i) { r.levels = LEVELS.filter(function (l) { return has(deciders[l], i); }); });
    return { atoms: atoms, levels: levels, name: nameOf(atoms), by: by, deciders: deciders, rows: rows,
      implicit: !rows.some(function (r) { return r.match; }) };
  }

  // ── operations (SPEC §2 "One step") ──
  /** Drop the kept sets of id and everything below it (rule 7: a change there propagates again). The walk does not
      go below a folder with inheritance disabled (other than id itself): nothing from above reaches that subtree. */
  function repropagate(tree, id) {
    (function walk(k, first) {
      var x = byId(tree, k);
      if (!first && !x.inherit) return;
      x.kept = null;
      childrenOf(tree, k).forEach(function (c) { walk(c.id, false); });
    })(id, true);
  }
  /** Apply one operation to a copy of the tree. Returns { tree, selected, event }; a rejected operation returns the
      tree unchanged with event.ok false and a reason. */
  function apply(tree0, op, p) {
    var tree = clone(tree0);
    var ev = { kind: op.kind, target: op.target, dest: op.dest || null, ok: true, reason: null };
    var x = byId(tree, op.target);
    function reject(reason) { ev.ok = false; ev.reason = reason; return { tree: tree0, selected: null, event: ev }; }
    if (!x) return reject('missing');
    if (op.kind === 'select') return { tree: tree, selected: x.id, event: ev };

    if (op.kind === 'add') {
      x.aces.push(ace(op.ace.id, op.ace.trustee, op.ace.type, op.ace.rights, x.kind === 'file' ? 'this' : op.ace.appliesTo));
      ev.ace = clone(op.ace);
      repropagate(tree, x.id);
      return { tree: tree, selected: x.id, event: ev };
    }
    if (op.kind === 'remove') {
      var before = x.aces.length;
      x.aces = x.aces.filter(function (a) { return a.trustee !== op.trustee; });
      if (x.aces.length === before) return reject('noSuchAce');
      ev.trustee = op.trustee;
      repropagate(tree, x.id);
      return { tree: tree, selected: x.id, event: ev };
    }
    if (op.kind === 'disable') {
      if (!x.inherit) return reject('alreadyOff');
      var mode = p && p.disable === 'remove' ? 'remove' : 'convert';
      if (mode === 'convert') {
        // the rows as they are now, in their order, become explicit (rule 4)
        var now = dacls(tree0)[x.id];
        x.aces = now.map(function (r) {
          return ace(r.explicit ? r.id : r.id + '~' + x.id, r.trustee, r.type, r.rights, r.appliesTo);
        });
      }
      ev.mode = mode;
      x.inherit = false;
      repropagate(tree, x.id);
      return { tree: tree, selected: x.id, event: ev };
    }
    if (op.kind === 'copy' || op.kind === 'move') {
      var dest = byId(tree, op.dest);
      if (!dest) return reject('missing');
      if (dest.kind !== 'folder') return reject('destNotFolder');
      if (x.kind !== 'file') return reject('notFile');
      if (op.kind === 'move' && x.parent === dest.id) return reject('sameFolder');
      if (childrenOf(tree, dest.id).some(function (c) { return c.name === x.name; })) return reject('nameTaken');
      ev.from = x.parent;
      if (op.kind === 'copy') {
        var id = x.id + '@' + dest.id;
        if (byId(tree, id)) return reject('nameTaken');
        // rule 5: a new object, no explicit ACEs, inherits from its new parent
        tree.push({ id: id, name: x.name, parent: dest.id, kind: x.kind, vol: dest.vol, inherit: true, kept: null, aces: [] });
        ev.copy = id;
        return { tree: tree, selected: id, event: ev };
      }
      if (dest.vol === x.vol) {
        // rule 6: keeps its explicit ACEs and its inherited ones as they were
        var rows = dacls(tree0)[x.id].filter(function (r) { return !r.explicit; });
        x.kept = x.inherit ? rows.map(function (r) { var c = Object.assign({}, r); delete c.kept; return c; }) : null;
        x.parent = dest.id;
        ev.cross = false;
      } else {
        // rule 5: another volume = a copy and a delete
        x.parent = dest.id;
        x.vol = dest.vol;
        x.aces = [];
        x.kept = null;
        x.inherit = true;
        ev.cross = true;
      }
      return { tree: tree, selected: x.id, event: ev };
    }
    return reject('unknownOp');
  }

  // ── presets: a setup (applied before step 0) and a script (one operation per step) ──
  function add(target, id, trustee, type, rights, appliesTo) {
    return { kind: 'add', target: target, ace: { id: id, trustee: trustee, type: type, rights: rights, appliesTo: appliesTo || TSF } };
  }
  function sel(target) { return { kind: 'select', target: target }; }
  var SCRIPTS = {
    'basic': { user: 'ana', start: 'proj', setup: [],
      ops: [add('proj', 'g1', 'Grafičari', 'allow', 'modify'), sel('kamp'), sel('logo')] },
    'explicit-beats-inherited': { user: 'vanjski', start: 'proj', setup: [add('proj', 'v1', 'Vanjski', 'allow', 'readExecute')],
      ops: [add('proj', 'v2', 'Vanjski', 'deny', 'write'), sel('kamp'), add('kamp', 'v3', 'Vanjski', 'allow', 'write'), sel('graf'), sel('logo')] },
    'disable-convert': { user: 'ana', start: 'kamp', setup: [add('proj', 'g1', 'Grafičari', 'allow', 'modify')],
      ops: [{ kind: 'disable', target: 'kamp' }, { kind: 'remove', target: 'proj', trustee: 'Grafičari' }, sel('graf'), sel('kamp'), sel('logo')] },
    'copy-vs-move': { user: 'ana', start: 'plakat', setup: [add('graf', 'g2', 'Grafičari', 'allow', 'modify')],
      ops: [{ kind: 'copy', target: 'plakat', dest: 'arh' }, { kind: 'move', target: 'logo', dest: 'arh' },
        add('arh', 'g3', 'Grafičari', 'allow', 'readExecute'), sel('logo')] },
    'cross-volume': { user: 'ana', start: 'logo', setup: [add('graf', 'g2', 'Grafičari', 'allow', 'modify')],
      ops: [{ kind: 'move', target: 'logo', dest: 'earh' }, { kind: 'move', target: 'plakat', dest: 'earh' },
        add('earh', 'g4', 'Grafičari', 'allow', 'modify')] }
  };
  var SCRIPT_IDS = Object.keys(SCRIPTS);
  function scriptOf(p) { return SCRIPTS[p && p.script] || SCRIPTS.basic; }

  function makeState(tree, selected, op, event) {
    return { tree: tree, selected: selected, op: op, event: event };
  }

  var logic = {
    defaults: { script: 'basic', user: 'ana', showFlags: false, disable: 'convert', pick: '' },

    /** One step per operation of the script (SPEC §4). */
    steps: function (p) { return scriptOf(p).ops.length; },

    /** Step 0: the scene with the preset's setup applied. */
    initial: function (p) {
      var sc = scriptOf(p), tree = baseTree();
      sc.setup.forEach(function (op) { tree = apply(tree, op, p).tree; });
      return makeState(tree, sc.start, null, null);
    },

    /** Step n: operation n of the script. */
    step: function (s, n, p) {
      var op = scriptOf(p).ops[n - 1];
      if (!op) return clone(s);
      var r = apply(s.tree, op, p);
      return makeState(clone(r.tree), r.event.ok ? r.selected : s.selected, clone(op), r.event);
    },

    /** Everything the page draws, for a state and the params: the shown object (the student's pick, else the
        step's), every node with its DACL and the user's access, the shown DACL and access. */
    view: function (s, p) {
      var all = dacls(s.tree);
      var shown = p && p.pick && byId(s.tree, p.pick) ? p.pick : s.selected;
      var user = p && USERS[p.user] ? p.user : 'ana';
      var nodes = order(s.tree).map(function (o) {
        var x = byId(s.tree, o.id);
        var d = all[o.id];
        return { id: x.id, name: x.name, path: pathOf(s.tree, x.id), kind: x.kind, vol: x.vol, depth: o.depth,
          inherit: x.inherit, kept: !!x.kept, explicit: d.filter(function (r) { return r.explicit; }).length,
          inherited: d.filter(function (r) { return !r.explicit; }).length, access: access(d, x.kind, user).name };
      });
      var sx = byId(s.tree, shown);
      return { shown: shown, picked: shown !== s.selected, user: user, nodes: nodes, dacl: all[shown],
        node: nodes.filter(function (n) { return n.id === shown; })[0], access: access(all[shown], sx.kind, user) };
    },

    /** What changed from one state to the next (the "changed" marks): nodes whose DACL changed or that are new, and
        the rows of `shown` that are new or re-sorted (SPEC §2 "Changed"); removed rows are counted. */
    changes: function (a, b, shown) {
      var out = { nodes: [], rows: [], removed: 0 };
      if (!a || !b) return out;
      var da = dacls(a.tree), db = dacls(b.tree);
      var key = function (r) { return [r.trustee, r.type, r.rights, r.appliesTo, r.explicit ? 'e' : 'i', r.from, r.lvl].join('|'); };
      Object.keys(db).forEach(function (id) {
        if (!da[id] || da[id].map(key).join(';') !== db[id].map(key).join(';')) out.nodes.push(id);
      });
      if (shown && db[shown]) {
        var before = da[shown] ? da[shown].map(key) : [];
        var now = db[shown].map(key);
        // new rows, and rows whose order among the rows present in both changed (re-sorted); a row that only moved
        // down because a new one came in above it is not marked
        var common = now.filter(function (k) { return has(before, k); });
        var was = before.filter(function (k) { return has(now, k); });
        now.forEach(function (k, i) {
          if (!has(before, k) || common.indexOf(k) !== was.indexOf(k)) out.rows.push(i);
        });
        // removed: rows gone as rights, whatever their source (a convert turns rows explicit, it removes nothing)
        var bare = function (r) { return [r.trustee, r.type, r.rights, r.appliesTo].join('|'); };
        var nowBare = db[shown].map(bare);
        out.removed = (da[shown] || []).filter(function (r) { return !has(nowBare, bare(r)); }).length;
      }
      return out;
    },

    ATOMS: ATOMS,
    LEVELS: LEVELS,
    NTFS_MASK: NTFS_MASK,
    APPLIES: APPLIES,
    FLAGS: FLAGS,
    USERS: USERS,
    SCRIPTS: SCRIPTS,
    SCRIPT_IDS: SCRIPT_IDS,
    baseTree: baseTree,
    order: order,
    pathOf: pathOf,
    passDown: passDown,
    effectiveOn: effectiveOn,
    sortDacl: sortDacl,
    dacls: dacls,
    access: access,
    apply: apply,
    levelsOf: levelsOf,
    nameOf: nameOf,
    tokenOf: tokenOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
