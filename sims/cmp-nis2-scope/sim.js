/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-nis2-scope: a made-up organisation, described by its sector, staff, turnover, balance sheet and
   special roles, is placed in the NIS2 scope table: its size class (micro, small, medium, large), the rows that apply
   to it, and the class that follows (essential, important or out of scope); then the threshold that would change
   the class, and what each class means for supervision and the fine ceiling.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md.
   The scope rules (size, rows, class, fine) are nis2.js, pure and promotable to models/.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var N = typeof module === 'object' && module.exports
    ? require('./nis2.js')
    : root.SimdeckModels.nis2;

  /** Rule 7: the sectors in the order of the drop-down, each with its group (rule 2). */
  var SECTORS = [
    ['energy', 'annex1'], ['transport', 'annex1'], ['health', 'annex1'], ['water', 'annex1'], ['cloud', 'annex1'],
    ['msp', 'annex1'],
    ['postal', 'annex2'], ['waste', 'annex2'], ['food', 'annex2'], ['manufacturing', 'annex2'], ['chemicals', 'annex2'],
    ['digital', 'annex2'], ['research', 'annex2'],
    ['central', 'central'], ['local', 'local'],
    ['retail', 'unlisted'], ['software', 'unlisted'], ['tourism', 'unlisted']
  ];
  var SECTOR_IDS = SECTORS.map(function (x) { return x[0]; });
  var GROUP_OF = {};
  SECTORS.forEach(function (x) { GROUP_OF[x[0]] = x[1]; });

  /** Rule 7: the ladders the three sliders step through (an index param picks a value). Each ceiling has a value on
      it and one just over it, so every threshold can be reached. Staff in people (annual work units), money in €. */
  var M = 1000000;
  var STAFF = [3, 9, 10, 25, 49, 50, 120, 180, 249, 250, 400, 1000, 3000];
  var TURNOVER = [0.5, 2, 2.1, 6, 10, 10.5, 30, 50, 51, 62, 90, 200, 600, 1500].map(function (x) { return Math.round(x * M); });
  var BALANCE = [0.5, 2, 2.1, 6, 10, 10.5, 30, 38, 43, 44, 70, 200, 600, 1500].map(function (x) { return Math.round(x * M); });
  var LADDERS = { staff: STAFF, turnover: TURNOVER, balance: BALANCE };

  var KEYS = ['sector', 'staff', 'turnover', 'balance'].concat(N.ROLES);

  /** A whole organisation: sector, the three ladder indices and the roles listed on. */
  function org(sector, staff, turnover, balance, roles) {
    var p = { sector: sector, staff: STAFF.indexOf(staff), turnover: TURNOVER.indexOf(turnover * M), balance: BALANCE.indexOf(balance * M) };
    N.ROLES.forEach(function (r) { p[r] = (roles || []).indexOf(r) >= 0; });
    return p;
  }

  /** Presets, SPEC.md table; each carries every param, so a preset is a whole organisation. */
  var presets = [
    { id: 'water', params: org('water', 180, 30, 70) },
    { id: 'msp', params: org('msp', 120, 62, 38) },
    { id: 'machines', params: org('manufacturing', 400, 600, 200) },
    { id: 'shop', params: org('retail', 1000, 200, 200) },
    { id: 'dns', params: org('software', 9, 2, 0.5, ['dns']) },
    { id: 'agency', params: org('central', 49, 6, 6) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  /** Rule 8: a toggle is on only for true, 'true', 1 or '1'. */
  function bool(v) { return v === true || v === 'true' || v === 1 || v === '1'; }
  /** Rule 8: a ladder index: a number rounded and clamped; anything else is the fallback. */
  function index(v, len, fallback) {
    var x = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    if (typeof x !== 'number' || !isFinite(x)) return fallback;
    return Math.min(len - 1, Math.max(0, Math.round(x)));
  }

  /** Rule 8: params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p), out = {};
    out.sector = SECTOR_IDS.indexOf(q.sector) >= 0 ? q.sector : defaults.sector;
    ['staff', 'turnover', 'balance'].forEach(function (k) { out[k] = index(q[k], LADDERS[k].length, defaults[k]); });
    N.ROLES.forEach(function (r) { out[r] = bool(q[r]); });
    return out;
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var o = { staff: STAFF[p.staff], turnover: TURNOVER[p.turnover], balance: BALANCE[p.balance] };
    var group = GROUP_OF[p.sector];
    var roles = {};
    N.ROLES.forEach(function (r) { roles[r] = p[r]; });
    var size = N.size(o);
    var rs = N.rows({ group: group, roles: roles });
    var c = N.classAt(rs, size);
    var cls = N.CLASSES[c];
    var th = N.thresholds(rs, size);
    var leading = rs.filter(function (r) { return r.applies && r.cells[size] > 0; }).length;
    var publicBody = group === 'central' || group === 'local';
    return {
      p: p,
      sector: p.sector,
      group: group,
      staff: o.staff, turnover: o.turnover, balance: o.balance,
      size: size,
      sizeId: N.SIZES[size],
      ceilings: N.CEILINGS.map(function (x) { return N.within(o, x); }),
      rows: rs,
      byCol: N.SIZES.map(function (x, k) { return N.CLASSES[N.classAt(rs, k)]; }),
      cls: cls,
      decider: N.decider(rs, size),
      outWhy: c ? null : group === 'annex1' || group === 'annex2' ? 'small' : group,   // rule 9
      up: th.up,
      down: th.down,
      leading: leading,
      namedIdle: rs[rs.length - 1].idle,
      publicBody: publicBody,
      fines: { essential: N.fine('essential', o.turnover), important: N.fine('important', o.turnover) }
    };
  }

  /** Rule 10: what changed between two states: the size class, the class, and which rows started or stopped
      applying. */
  function flipped(prev, next) {
    if (!prev || !next) return { size: false, cls: false, rows: [] };
    return {
      size: prev.size !== next.size,
      cls: prev.cls !== next.cls,
      rows: next.rows.filter(function (r, k) { return prev.rows[k].applies !== r.applies; }).map(function (r) { return r.id; })
    };
  }

  /** Rule 9: the caption's main sentence, the threshold note and at most one more note, in order. */
  function captionKey(s) {
    var key = s.cls === 'out' ? 'capOut_' + s.outWhy : 'cap_' + s.decider + '_' + s.cls;
    var notes = [];
    if (s.up !== null) notes.push('nUp' + s.up);
    else if (s.cls === 'important') notes.push('nCap');
    else if (s.down !== null) notes.push('nDown' + s.down);
    else notes.push(s.cls === 'essential' ? 'nAny' : 'nNever');
    if (s.namedIdle) notes.push('nNamedIdle');
    else if (s.leading > 1) notes.push('nSeveral');
    return { key: key, notes: notes };
  }

  var logic = {
    SECTORS: SECTORS, SECTOR_IDS: SECTOR_IDS, GROUP_OF: GROUP_OF, LADDERS: LADDERS, KEYS: KEYS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
