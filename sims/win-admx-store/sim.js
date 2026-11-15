/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-admx-store: where the Group Policy editor's templates come from, and why two editors show the same
   GPO differently. An explorer (no steps): initial(params) computes the whole scene. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers; the state is plain JSON. No strings: words are in strings.js.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Template sets: one revision per ADMX file (SPEC.md, "Scene"; revisions illustrative). */
  var SETS = {
    old: { System: 1, AutoPlay: 1 },
    new: { System: 2, AutoPlay: 1, LAPS: 1 }
  };
  var FILES = ['System', 'AutoPlay', 'LAPS'];

  /** The GPO's Registry.pol: three configured values, each described by one ADMX from a revision on. */
  var VALUES = [
    { id: 'cmd', hive: 'HKCU', key: 'Software\\Policies\\Microsoft\\Windows\\System', name: 'DisableCMD', data: 1, admx: 'System', needs: 1 },
    { id: 'autoplay', hive: 'HKLM', key: 'Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer', name: 'NoDriveTypeAutoRun', data: 255, admx: 'AutoPlay', needs: 1 },
    { id: 'laps', hive: 'HKLM', key: 'Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\LAPS', name: 'BackupDirectory', data: 2, admx: 'LAPS', needs: 1 }
  ];

  /** The two admin machines and their local template set. */
  var ADMINS = [{ id: 'A', name: 'ADM-A', set: 'new' }, { id: 'B', name: 'ADM-B', set: 'old' }];

  var DOMAIN = 'quillmoor.example';
  var STORE_PATH = '\\\\' + DOMAIN + '\\SYSVOL\\' + DOMAIN + '\\Policies\\PolicyDefinitions';
  var LOCAL_PATH = '%SystemRoot%\\PolicyDefinitions';

  var STORES = ['none', 'old', 'new'];
  var LANGS = ['en-US', 'hr-HR'];
  var HR_ADML = ['none', 'match', 'old'];

  function pick(list, v, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function admin(id) { for (var i = 0; i < ADMINS.length; i++) if (ADMINS[i].id === id) return ADMINS[i]; return null; }
  function value(id) { for (var i = 0; i < VALUES.length; i++) if (VALUES[i].id === id) return VALUES[i]; return null; }

  /** A template location: { kind, set, langs: { 'en-US': set, 'hr-HR'?: set } } (an ADML folder holds a whole set). */
  function local(adminId) {
    var set = admin(adminId).set;
    return { kind: 'local', path: LOCAL_PATH, set: set, langs: { 'en-US': set, 'hr-HR': set } };   // rule 5: own set
  }
  function store(p) {
    if (p.store === 'none') return null;
    var langs = { 'en-US': p.store };
    if (p.hrAdml === 'match') langs['hr-HR'] = p.store;
    else if (p.hrAdml === 'old') langs['hr-HR'] = 'old';
    return { kind: 'store', path: STORE_PATH, set: p.store, langs: langs };
  }

  /** Rules 2 and 3: the store, if any, else the editor's own folder. The store wins even over newer local files. */
  function source(p, adminId) { return store(p) || local(adminId); }

  /** Rule 5: the ADML the editor uses for one ADMX file of a location, or why the file fails to load. */
  function adml(loc, file, lang) {
    var rev = SETS[loc.set][file];
    if (rev === undefined) return { ok: false, lang: lang, set: null, reason: 'no-admx' };                       // nothing to describe
    var folder = loc.langs[lang];
    var got = folder ? SETS[folder][file] : undefined;
    if (got === rev) return { ok: true, lang: lang, set: folder, fallback: false };
    if (got !== undefined) return { ok: false, lang: lang, set: folder, reason: 'revision', has: got, wants: rev };   // 5b
    if (lang !== 'en-US') {                                                                                       // 5c
      var en = loc.langs['en-US'];
      var enRev = en ? SETS[en][file] : undefined;
      if (enRev === rev) return { ok: true, lang: 'en-US', set: en, fallback: true };
      if (enRev !== undefined) return { ok: false, lang: 'en-US', set: en, reason: 'revision', has: enRev, wants: rev };
    }
    return { ok: false, lang: lang, set: null, reason: 'missing', wants: rev };                                   // 5c, 5d
  }

  /** One editor row: how the editor reading `loc` in `lang` shows value `v` (rules 4, 5). */
  function row(loc, v, lang) {
    var rev = SETS[loc.set][v.admx];
    if (rev === undefined || rev < v.needs) {                         // rule 4, decided before any ADML question
      return { id: v.id, show: 'extra', admx: v.admx, admxRev: rev === undefined ? null : rev, adml: null };
    }
    var a = adml(loc, v.admx, lang);
    return { id: v.id, show: a.ok ? 'named' : 'error', admx: v.admx, admxRev: rev, adml: a };
  }

  /** The ADMX files that failed to load, each once, in row order (one file can describe several values). */
  function errorFiles(rows) {
    var out = [];
    rows.forEach(function (r) { if (r.show === 'error' && out.indexOf(r.admx) < 0) out.push(r.admx); });
    return out;
  }

  /** One editor's whole view. */
  function editor(p, adminId) {
    var loc = source(p, adminId);
    var rows = VALUES.map(function (v) { return row(loc, v, p.uiLang); });
    var count = { named: 0, extra: 0, error: 0, fallback: 0 };
    rows.forEach(function (r) {
      count[r.show]++;
      if (r.show === 'named' && r.adml.fallback) count.fallback++;
    });
    var errors = errorFiles(rows);
    return {
      admin: adminId,
      from: loc.kind,
      path: loc.path,
      set: loc.set,
      localSet: admin(adminId).set,
      localIgnored: loc.kind === 'store',
      rows: rows,
      count: count,
      errors: errors
    };
  }

  /** Rule 1: the client reads Registry.pol only; every configured value applies, whatever the templates. */
  function client() { return VALUES.map(function (v) { return v.id; }); }

  /** Normalised params: unknown values fall back to the defaults; a selection must name an editor row. */
  function norm(p) {
    var q = {
      store: pick(STORES, p.store, 'none'),
      uiLang: pick(LANGS, p.uiLang, 'en-US'),
      hrAdml: pick(HR_ADML, p.hrAdml, 'none'),
      sel: ''
    };
    var m = typeof p.sel === 'string' ? /^([AB]):([a-z]+)$/.exec(p.sel) : null;
    if (m && value(m[2])) q.sel = p.sel;
    return q;
  }

  /** The rows whose view changed between two states: kind, language or fallback (selection excluded). */
  function changedRows(prev, s) {
    if (!prev) return [];
    var out = [];
    s.editors.forEach(function (e, i) {
      e.rows.forEach(function (r, j) {
        var o = prev.editors[i].rows[j];
        var lang = function (x) { return x.adml ? x.adml.lang + (x.adml.ok ? '' : '!') + (x.adml.fallback ? '*' : '') : ''; };
        if (o.show !== r.show || lang(o) !== lang(r)) out.push(e.admin + ':' + r.id);
      });
    });
    return out;
  }

  /** Which caption applies (SPEC.md, "Captions"): the first that applies, with its data. */
  function situation(s) {
    var A = s.editors[0], B = s.editors[1];
    var err = s.editors.filter(function (e) { return e.count.error > 0; })[0];
    if (err) return { kind: 'error', admin: err.admin, file: err.errors[0], both: A.count.error > 0 && B.count.error > 0 };
    var key = function (e) { return e.rows.map(function (r) { return r.show; }).join(); };
    if (key(A) !== key(B)) {
      var lacking = A.count.extra > B.count.extra ? A : B;
      var r = lacking.rows.filter(function (x) { return x.show === 'extra'; })[0];
      return { kind: 'disagree', admin: lacking.admin, value: r.id, admx: r.admx };
    }
    if (s.store && A.count.extra > 0) {
      var x = A.rows.filter(function (q) { return q.show === 'extra'; })[0];
      return { kind: 'storeOld', admin: 'A', value: x.id, admx: x.admx };
    }
    if (A.count.fallback > 0 || B.count.fallback > 0) return { kind: 'fallback' };
    if (s.store) return { kind: 'storeSame' };
    return { kind: 'localSame' };
  }

  var logic = {
    SETS: SETS,
    FILES: FILES,
    VALUES: VALUES,
    ADMINS: ADMINS,
    DOMAIN: DOMAIN,
    STORE_PATH: STORE_PATH,
    LOCAL_PATH: LOCAL_PATH,
    STORES: STORES,
    LANGS: LANGS,
    HR_ADML: HR_ADML,

    /** Parameter defaults (SPEC.md, "Params"). */
    defaults: { store: 'none', uiLang: 'en-US', hrAdml: 'none', sel: '' },

    /** Explorer: no steps. */
    steps: 0,

    /** Presets (SPEC.md table). Full params, so a preset never inherits another's. */
    presets: [
      { id: 'no-store', params: { store: 'none', uiLang: 'en-US', hrAdml: 'none', sel: '' } },
      { id: 'store-new', params: { store: 'new', uiLang: 'en-US', hrAdml: 'none', sel: '' } },
      { id: 'store-old', params: { store: 'old', uiLang: 'en-US', hrAdml: 'none', sel: 'A:laps' } },
      { id: 'language', params: { store: 'new', uiLang: 'hr-HR', hrAdml: 'none', sel: '' } },
      { id: 'stale-lang', params: { store: 'new', uiLang: 'hr-HR', hrAdml: 'old', sel: 'A:cmd' } }
    ],

    /** The whole scene for these params. */
    initial: function (params) {
      var p = norm(params || {});
      var st = store(p);
      var s = {
        store: st ? { set: st.set, langs: st.langs } : null,
        uiLang: p.uiLang,
        hrAdml: p.hrAdml,
        editors: ADMINS.map(function (a) { return editor(p, a.id); }),
        client: client(),
        selected: p.sel || null
      };
      s.situation = situation(s);
      return s;
    },

    source: source,
    adml: adml,
    row: row,
    editor: editor,
    errorFiles: errorFiles,
    norm: norm,
    changedRows: changedRows,
    situation: situation,
    value: value,
    admin: admin,

    /** The row a selection names, with its editor, or null. */
    selectedRow: function (s) {
      if (!s.selected) return null;
      var m = s.selected.split(':');
      var e = s.editors.filter(function (x) { return x.admin === m[0]; })[0];
      var r = e ? e.rows.filter(function (x) { return x.id === m[1]; })[0] : null;
      return r ? { editor: e, row: r, value: value(r.id) } : null;
    },

    /** Every selectable id ('' = none), for the hidden param. */
    selIds: function () {
      var out = [''];
      ADMINS.forEach(function (a) { VALUES.forEach(function (v) { out.push(a.id + ':' + v.id); }); });
      return out;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
