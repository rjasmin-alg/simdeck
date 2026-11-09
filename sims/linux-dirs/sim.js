/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for the Linux directory tree poster: the tree from / with the behaviour of each directory (static, variable,
   shareable, host-specific, may be lost, per-user, virtual), its FHS 3.0 section, one example file from the course
   book and the chapter it appears in. A reference page: no steps; the state is derived from the params (filter,
   ring, the preset's view and the selected node). Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Behaviours, in the order the legend and the badges list them. */
  var BEHAVIOURS = ['static', 'shareable', 'variable', 'host-specific', 'may-be-lost', 'per-user', 'virtual'];

  /** The poster, in poster order (alphabetical under each parent, as ls lists them). ring 1: the six names of UL
      ch05's ls -ld output; ring 2: the rest. b: behaviours, primary first. fhs: FHS 3.0 section ('3.7') or chapter
      ('4'), null where FHS does not name the directory. ch: the chapter of the course book where it appears.
      ex: one example file the book uses, with its chapter, or null. key: the strings.js suffix. */
  var NODES = [
    { path: '/', parent: null, ring: 1, b: [], fhs: '3', ch: 5, ex: { file: '/etc/fstab', ch: 5 }, key: 'root' },
    { path: '/boot', parent: '/', ring: 2, b: ['static', 'host-specific'], fhs: '3.5', ch: 11, ex: null, key: 'boot' },
    { path: '/boot/efi', parent: '/boot', ring: 2, b: ['static', 'host-specific'], fhs: null, ch: 11, ex: null, key: 'bootefi' },
    { path: '/dev', parent: '/', ring: 2, b: ['host-specific'], fhs: '3.6', ch: 11, ex: { file: '/dev/vdb1', ch: 11 }, key: 'dev' },
    { path: '/etc', parent: '/', ring: 1, b: ['host-specific', 'static'], fhs: '3.7', ch: 5, ex: { file: '/etc/fstab', ch: 5 }, key: 'etc' },
    { path: '/home', parent: '/', ring: 1, b: ['per-user'], fhs: '3.8', ch: 5, ex: { file: '/home/student', ch: 5 }, key: 'home' },
    { path: '/mnt', parent: '/', ring: 2, b: [], fhs: '3.12', ch: 11, ex: { file: '/mnt/vjezba', ch: 11 }, key: 'mnt' },
    { path: '/opt', parent: '/', ring: 2, b: ['static', 'shareable'], fhs: '3.13', ch: 5, ex: null, key: 'opt' },
    { path: '/proc', parent: '/', ring: 2, b: ['virtual'], fhs: '6.1.5', ch: 8, ex: { file: '/proc/[pid]/stat', ch: 8 }, key: 'proc' },
    { path: '/root', parent: '/', ring: 2, b: ['per-user'], fhs: '3.14', ch: 5, ex: null, key: 'roothome' },
    { path: '/run', parent: '/', ring: 2, b: ['variable', 'may-be-lost', 'virtual'], fhs: '3.15', ch: 13, ex: { file: '/run/log/journal', ch: 13 }, key: 'run' },
    { path: '/run/log/journal', parent: '/run', ring: 2, b: ['variable', 'may-be-lost', 'virtual'], fhs: null, ch: 13, ex: null, key: 'runjournal' },
    { path: '/srv', parent: '/', ring: 2, b: ['host-specific'], fhs: '3.17', ch: 18, ex: { file: '/srv/zajednicko', ch: 18 }, key: 'srv' },
    { path: '/tmp', parent: '/', ring: 1, b: ['may-be-lost', 'variable'], fhs: '3.18', ch: 5, ex: null, key: 'tmp' },
    { path: '/usr', parent: '/', ring: 1, b: ['static', 'shareable'], fhs: '4', ch: 5, ex: { file: '/usr/share/doc', ch: 5 }, key: 'usr' },
    { path: '/usr/bin', parent: '/usr', ring: 2, b: ['static', 'shareable'], fhs: '4.4', ch: 5, ex: { file: '/usr/bin/vi', ch: 5 }, key: 'usrbin' },
    { path: '/usr/local', parent: '/usr', ring: 2, b: ['static', 'shareable'], fhs: '4.9', ch: 10, ex: { file: '/usr/local/sbin/arhiva.sh', ch: 10 }, key: 'usrlocal' },
    { path: '/var', parent: '/', ring: 1, b: ['variable'], fhs: '5', ch: 5, ex: { file: '/var/spool/mail/student', ch: 20 }, key: 'var' },
    { path: '/var/lib', parent: '/var', ring: 2, b: ['variable'], fhs: '5.8', ch: 13, ex: { file: '/var/lib/nfs', ch: 7 }, key: 'varlib' },
    { path: '/var/log', parent: '/var', ring: 2, b: ['variable'], fhs: '5.10', ch: 5, ex: { file: '/var/log/messages', ch: 13 }, key: 'varlog' }
  ];

  var BY_PATH = Object.create(null);
  NODES.forEach(function (n) { BY_PATH[n.path] = n; });

  /** An own key of one of the tables below, so 'constructor' or 'toString' in a URL is no key. */
  function own(table, key) { return typeof key === 'string' && Object.prototype.hasOwnProperty.call(table, key); }

  /** Filters: the behaviours a node must carry, all of them. 'static-shareable' needs both (UL ch05: "does not change
      and may be shared"). */
  var FILTERS = {
    'static-shareable': ['static', 'shareable'],
    'variable': ['variable'],
    'host-specific': ['host-specific'],
    'may-be-lost': ['may-be-lost'],
    'virtual': ['virtual']
  };
  var FILTER_IDS = ['none'].concat(Object.keys(FILTERS));

  /** Views, set by the presets. lit: the nodes the view lights under filter 'none'; badges: show each lit node's
      primary badge in words; describe: show each node's one-line description (ring book only: there is no room
      for twenty). */
  var VIEWS = {
    'none': { lit: [] },
    'book-six': { lit: [], describe: true },
    'behaviour': { lit: ['/etc', '/home', '/tmp', '/usr', '/var'], badges: true },
    'where-are-logs': { lit: ['/run/log/journal', '/var/log'] },
    'boot-and-disks': { lit: ['/boot', '/boot/efi', '/dev', '/mnt'] },
    'virtual': { lit: ['/proc', '/run', '/run/log/journal'] }
  };
  var VIEW_IDS = Object.keys(VIEWS);

  // ── rule 1: the tree starts at / ──

  /** The chain from / to a poster node, / first; [] for a path that is not on the poster. */
  function pathTo(path) {
    var out = [];
    var n = own(BY_PATH, path) ? BY_PATH[path] : null;
    while (n) { out.unshift(n.path); n = n.parent === null ? null : BY_PATH[n.parent]; }
    return out;
  }

  /** Depth below /: 0 for /, 1 for /etc, 2 for /usr/bin and /run/log/journal (drawn as one node). */
  function depthOf(path) { return Math.max(0, pathTo(path).length - 1); }

  // ── rule 5: local layout is the site's ──

  /** Where an absolute path sits on the poster: the deepest poster node that holds it, matched by whole names, and
      whether the path is that node itself. A relative path is not read from the tree (rule 1): null. Doubled and
      trailing slashes are ignored. */
  function locate(path) {
    if (typeof path !== 'string' || path.charAt(0) !== '/') return null;
    var names = path.split('/').filter(function (s) { return s !== ''; });
    var best = '/', exact = names.length === 0;
    for (var i = 1; i <= names.length; i++) {
      var p = '/' + names.slice(0, i).join('/');
      if (own(BY_PATH, p)) { best = p; exact = i === names.length; }
    }
    return { node: best, onPoster: exact };
  }

  // ── rules 2–4: behaviours, filters and views ──

  function has(n, bs) { return bs.every(function (b) { return n.b.indexOf(b) >= 0; }); }

  function visible(n, ring) { return ring === 'book' ? n.ring === 1 : true; }

  /** The nodes a filter lights, in poster order, among the visible ones. */
  function byFilter(filter, ring) {
    if (!own(FILTERS, filter)) return [];
    var need = FILTERS[filter];
    return NODES.filter(function (n) { return visible(n, ring) && has(n, need); }).map(function (n) { return n.path; });
  }

  /** The lit set: the filter's when one is set, else the view's (filter beats view); visible nodes only, poster order. */
  function litOf(p) {
    if (own(FILTERS, p.filter)) return byFilter(p.filter, p.ring);
    var v = own(VIEWS, p.view) ? VIEWS[p.view] : VIEWS.none;
    return NODES.filter(function (n) { return visible(n, p.ring) && v.lit.indexOf(n.path) >= 0; }).map(function (n) { return n.path; });
  }

  /** The effective selection: a visible poster node, else null (unknown or hidden). */
  function selectedOf(p) {
    if (!own(BY_PATH, p.sel)) return null;
    var n = BY_PATH[p.sel];
    return visible(n, p.ring) ? n.path : null;
  }

  var logic = {
    BEHAVIOURS: BEHAVIOURS, NODES: NODES, BY_PATH: BY_PATH, FILTERS: FILTERS, FILTER_IDS: FILTER_IDS,
    VIEWS: VIEWS, VIEW_IDS: VIEW_IDS,

    defaults: { filter: 'none', ring: 'all', view: 'none', sel: '' },

    /** A reference page: no steps. */
    steps: 0,

    /** The whole poster as plain data, derived from the params. */
    initial: function (p) {
      var lit = litOf(p);
      var selected = selectedOf(p);
      var path = selected ? pathTo(selected) : [];
      var v = own(VIEWS, p.view) ? VIEWS[p.view] : VIEWS.none;
      return {
        filter: own(FILTERS, p.filter) ? p.filter : null,
        view: own(VIEWS, p.view) && p.view !== 'none' ? p.view : null,
        ring: p.ring === 'book' ? 'book' : 'all',
        selected: selected,
        lit: lit,
        path: path,
        badges: !!v.badges && !own(FILTERS, p.filter),
        describe: !!v.describe && p.ring === 'book',
        nodes: NODES.filter(function (n) { return visible(n, p.ring); }).map(function (n) {
          return {
            path: n.path, parent: n.parent, depth: depthOf(n.path), ring: n.ring, key: n.key,
            behaviours: n.b.slice(), primary: n.b.length ? n.b[0] : null,
            fhs: n.fhs, chapter: n.ch, example: n.ex ? { file: n.ex.file, chapter: n.ex.ch } : null,
            lit: lit.indexOf(n.path) >= 0, onPath: path.indexOf(n.path) >= 0
          };
        })
      };
    },

    step: function (s) { return s; },

    pathTo: pathTo, depthOf: depthOf, locate: locate, byFilter: byFilter, litOf: litOf, selectedOf: selectedOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
