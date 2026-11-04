/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-gpo-tattooing: the GPO "Quillmoor Desktop" holds a policy (Administrative Templates, written under a
   Policies key) and a preference (a Registry item, written to an ordinary key). ana logs on to PC07 (t = 0), then the
   admin unlinks the GPO or ana changes things (t = 30), then a background refresh runs (t = 100). In each processing
   pass a first-match rule table decides, per item, whether its value is written, deleted or left behind (tattoo).
   One step = one event. Rules, tie-breaks and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. isPolicyKey(), ROWS, ruleFor(), pass() and userChange() take any item,
   so they can move to models/ unchanged. */
(function (root) {
  'use strict';

  /** The two items of the GPO (SPEC.md, "Scene"). */
  var ITEMS = [
    { id: 'policy', kind: 'policy', key: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer', name: 'NoControlPanel', value: 1 },
    { id: 'pref', kind: 'preference', key: 'HKCU\\Software\\Quillmoor', name: 'ProxyMode', value: 1 }
  ];

  /** Rule 1: the keys Group Policy owns (HKCU and HKLM alike). */
  var POLICY_KEYS = ['\\Software\\Policies', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies'];

  function isPolicyKey(key) {
    var k = key.replace(/^(HKCU|HKLM|HKEY_CURRENT_USER|HKEY_LOCAL_MACHINE)/i, '').toLowerCase();
    return POLICY_KEYS.some(function (p) { p = p.toLowerCase(); return k === p || k.indexOf(p + '\\') === 0; });
  }

  function pathOf(item) { return item.key + '\\' + item.name; }

  /**
   * What a processing pass does with an item: first match, top down (SPEC.md, rule table). applies: does the GPO
   * still apply; cond: an extra condition; act: write | delete | leave.
   */
  var ROWS = [
    { kind: 'policy', applies: true, cond: null, act: 'write' },
    { kind: 'policy', applies: false, cond: 'policyKey', act: 'delete' },
    { kind: 'policy', applies: false, cond: 'outsideKey', act: 'leave' },
    { kind: 'preference', applies: false, cond: 'remove', act: 'delete' },
    { kind: 'preference', applies: false, cond: null, act: 'leave' },
    { kind: 'preference', applies: true, cond: 'onceApplied', act: 'leave' },
    { kind: 'preference', applies: true, cond: null, act: 'write' }
  ];

  function condHolds(cond, item, flags, appliedBefore) {
    if (!cond) return true;
    if (cond === 'policyKey') return isPolicyKey(item.key);
    if (cond === 'outsideKey') return !isPolicyKey(item.key);
    if (cond === 'remove') return !!flags.removeWhenNotApplied;
    if (cond === 'onceApplied') return !!flags.applyOnce && !!appliedBefore;
    return false;
  }

  /**
   * The rows an item reads and the one that decides: { row, hits } where hits[i] is true (decides), false (read, no
   * match) or null (another kind's row, or below the deciding row: not read).
   */
  function ruleFor(item, applies, flags, appliedBefore) {
    var row = -1;
    var hits = ROWS.map(function (r, i) {
      if (r.kind !== item.kind || row >= 0) return null;
      var m = r.applies === applies && condHolds(r.cond, item, flags, appliedBefore);
      if (m) row = i;
      return m;
    });
    return { row: row, hits: hits };
  }

  /** Rule 2: the Remove option makes the preference's action Replace. */
  function actionOf(flags) { return flags.removeWhenNotApplied ? 'Replace' : 'Update'; }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /**
   * One processing pass over the items (rules 1–3, 5). Mutates s.registry and s.history; returns
   * { [item id]: { code, row, hits, before, after } }. code: write | same | overwrite | once | remove | tattoo | none.
   */
  function pass(s, applies) {
    var out = {};
    ITEMS.forEach(function (item) {
      var path = pathOf(item), before = s.registry[path];
      var r = ruleFor(item, applies, s.itemFlags, s.history[item.id]);
      var act = ROWS[r.row].act, code;
      if (act === 'write') {
        code = before == null ? 'write' : before === item.value ? 'same' : 'overwrite';
        s.registry[path] = item.value;
        s.history[item.id] = true;
      } else if (act === 'delete') {
        // a preference is removed only if this computer's history says it was applied (KB 3060859)
        var known = item.kind === 'policy' || !!s.history[item.id];
        code = before != null && known ? 'remove' : 'none';
        if (known) s.registry[path] = null;
        s.history[item.id] = false;
      } else if (ROWS[r.row].cond === 'onceApplied') {
        code = 'once';
      } else {
        code = before != null ? 'tattoo' : 'none';
      }
      out[item.id] = { code: code, row: r.row, hits: r.hits, before: before, after: s.registry[path] };
    });
    s.refreshes++;
    return out;
  }

  /** Rule 4: may the user change this item's value? Not under a Policies key (users only read those). */
  function userChange(s, item, value) {
    var path = pathOf(item), before = s.registry[path];
    var ok = !isPolicyKey(item.key);
    if (ok) s.registry[path] = value;
    return { ok: ok, before: before, after: s.registry[path] };
  }

  /** What happens after ana's logon (SPEC.md, "Params"). */
  var SCRIPTS = {
    unlink: [{ t: 0, kind: 'logon' }, { t: 30, kind: 'unlink' }, { t: 100, kind: 'refresh' }],
    unlinkAtRefresh: [{ t: 0, kind: 'logon' }, { t: 100, kind: 'unlinkRefresh' }],
    edit: [{ t: 0, kind: 'logon' }, { t: 30, kind: 'edit' }, { t: 100, kind: 'refresh' }],
    'try': [{ t: 0, kind: 'logon' }, { t: 30, kind: 'try' }]
  };

  function itemById(id) { return ITEMS.filter(function (it) { return it.id === id; })[0]; }

  function noPass(s, code) {
    var out = {};
    ITEMS.forEach(function (item) {
      var v = s.registry[pathOf(item)];
      out[item.id] = { code: code, row: -1, hits: null, before: v, after: v };
    });
    return out;
  }

  var logic = {
    defaults: { script: 'unlink', removeWhenNotApplied: false, applyOnce: false },

    presets: [
      { id: 'unlink', params: { script: 'unlink' } },
      { id: 'remove-flag', params: { script: 'unlink', removeWhenNotApplied: true } },
      { id: 'user-edit', params: { script: 'edit' } },
      { id: 'apply-once', params: { script: 'edit', applyOnce: true } },
      { id: 'policy-locked', params: { script: 'try' } }
    ],

    steps: function (p) { return SCRIPTS[p.script].length; },

    initial: function (p) {
      var registry = {};
      ITEMS.forEach(function (it) { registry[pathOf(it)] = null; });
      return {
        linked: true,
        refreshes: 0,
        registry: registry,
        history: { policy: false, pref: false },      // what this computer recorded as applied (rule 2, Remove)
        itemFlags: { removeWhenNotApplied: !!p.removeWhenNotApplied, applyOnce: !!p.applyOnce },
        userEdits: [],
        log: [],
        event: null,                                  // { t, kind }
        items: null                                   // per item: { code, row, hits, before, after }
      };
    },

    step: function (s0, n, p) {
      var s = clone(s0);
      var ev = SCRIPTS[p.script][n - 1];
      var items;
      if (ev.kind === 'logon' || ev.kind === 'refresh') {
        items = pass(s, s.linked);
      } else if (ev.kind === 'unlink') {
        s.linked = false;                             // rule 7: nothing on the PC changes yet
        items = noPass(s, 'waits');
      } else if (ev.kind === 'unlinkRefresh') {
        s.linked = false;                             // rule 6: the unlink first, then the refresh without the GPO
        items = pass(s, false);
      } else {
        // edit: ana sets ProxyMode = 0; try: she also tries Control Panel
        items = noPass(s, 'untouched');
        var pref = itemById('pref'), pol = itemById('policy');
        var e = userChange(s, pref, 0);
        items.pref = { code: 'userSet', row: -1, hits: null, before: e.before, after: e.after };
        s.userEdits.push({ t: ev.t, item: 'pref', value: 0, ok: e.ok });
        if (ev.kind === 'try') {
          var v = s.registry[pathOf(pol)];
          var tried = userChange(s, pol, null);       // the restriction stays: the value is not hers to delete
          items.policy = { code: v === pol.value ? 'blocked' : 'open', row: -1, hits: null, before: v, after: tried.after };
          s.userEdits.push({ t: ev.t, item: 'policy', value: null, ok: tried.ok });
        }
      }
      s.event = { t: ev.t, kind: ev.kind };
      s.items = items;
      s.log.push({ t: ev.t, kind: ev.kind });
      return s;
    },

    ITEMS: ITEMS,
    ROWS: ROWS,
    SCRIPTS: SCRIPTS,
    POLICY_KEYS: POLICY_KEYS,
    isPolicyKey: isPolicyKey,
    pathOf: pathOf,
    ruleFor: ruleFor,
    actionOf: actionOf,
    pass: pass,
    userChange: userChange
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
