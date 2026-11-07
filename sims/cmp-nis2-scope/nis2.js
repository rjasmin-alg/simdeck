/* SPDX-License-Identifier: AGPL-3.0-or-later
   NIS2 scope (rules: SPEC.md 1–6). An organisation's size class from staff headcount, yearly turnover and balance
   sheet total (the EU definition of micro, small and medium-sized enterprises, Recommendation 2003/361/EC, Annex
   art. 2); the scope rows of Directive (EU) 2022/2555 (art. 2 and 3), each giving a class per size column; the
   entity's class as the strictest of the rows that apply; the fine ceiling as the higher of a fixed sum and a share
   of worldwide yearly turnover (art. 34(4) and (5)).
   Pure: no DOM, no words, plain data in and out (money in whole euros), so the coordinator can promote it to
   models/nis2.js unchanged (cmp-cost-of-noncompliance needs the class and the fine ceiling).
   Registers on globalThis.SimdeckModels.nis2 in a page; module.exports under node. */
(function (root) {
  'use strict';

  /** Rule 1: size columns, smallest first. */
  var SIZES = ['micro', 'small', 'medium', 'large'];
  /** Rule 1: the ceilings of micro, small and medium (index = size column): staff fewer than, money not exceeding (€). */
  var CEILINGS = [
    { staff: 10, turnover: 2000000, balance: 2000000 },
    { staff: 50, turnover: 10000000, balance: 10000000 },
    { staff: 250, turnover: 50000000, balance: 43000000 }
  ];
  /** Rule 4: classes, weakest first; the index is the order. */
  var CLASSES = ['out', 'important', 'essential'];

  /** Rule 1: within a ceiling: fewer staff than its headcount, and turnover or balance sheet not above its sum. */
  function within(org, c) {
    var staff = org.staff < c.staff, turnover = org.turnover <= c.turnover, balance = org.balance <= c.balance;
    return { staff: staff, turnover: turnover, balance: balance, ok: staff && (turnover || balance) };
  }

  /** Rule 1: the size column (0 micro … 3 large): the smallest category whose ceiling the organisation is within. */
  function size(org) {
    for (var k = 0; k < CEILINGS.length; k++) if (within(org, CEILINGS[k]).ok) return k;
    return CEILINGS.length;
  }

  /** Rule 2: the scope rows in order, the class index per size column (micro, small, medium, large). Sector rows
      apply by the sector's group; role rows by their switch; `named` only for an organisation of a listed type. */
  var ROWS = [
    { id: 'annex1', kind: 'sector', cells: [0, 0, 1, 2] },
    { id: 'annex2', kind: 'sector', cells: [0, 0, 1, 1] },
    { id: 'central', kind: 'sector', cells: [2, 2, 2, 2] },
    { id: 'local', kind: 'sector', cells: [0, 0, 0, 0] },
    { id: 'unlisted', kind: 'sector', cells: [0, 0, 0, 0] },
    { id: 'telecom', kind: 'role', cells: [1, 1, 2, 2] },
    { id: 'dns', kind: 'role', cells: [2, 2, 2, 2] },
    { id: 'qtsp', kind: 'role', cells: [2, 2, 2, 2] },
    { id: 'named', kind: 'role', cells: [2, 2, 2, 2] }
  ];
  var GROUPS = ['annex1', 'annex2', 'central', 'local', 'unlisted'];
  var ROLES = ['telecom', 'dns', 'qtsp', 'named'];
  /** Rule 2: groups and roles that make an organisation of a type listed in Annex I or II. */
  var LISTED_GROUPS = ['annex1', 'annex2', 'central'];
  var LISTED_ROLES = ['telecom', 'dns', 'qtsp'];

  /** Rule 2: which rows apply. org: { group, roles: { telecom, dns, qtsp, named } }. Returns [{ id, applies, idle }]. */
  function rows(org) {
    var r = org.roles || {};
    var listed = LISTED_GROUPS.indexOf(org.group) >= 0 || LISTED_ROLES.some(function (k) { return r[k] === true; });
    return ROWS.map(function (row) {
      var on = row.kind === 'sector' ? org.group === row.id : r[row.id] === true;
      var applies = on && (row.id !== 'named' || listed);
      return { id: row.id, kind: row.kind, cells: row.cells.slice(), applies: applies, idle: on && !applies };
    });
  }

  /** Rule 4: the class index at one size column over the rows that apply (0 when none gives one). */
  function classAt(rs, col) {
    var best = 0;
    rs.forEach(function (row) { if (row.applies && row.cells[col] > best) best = row.cells[col]; });
    return best;
  }

  /** Rule 4: the deciding row: the first row in order that applies and gives the class; null when out. */
  function decider(rs, col) {
    var c = classAt(rs, col);
    if (!c) return null;
    for (var k = 0; k < rs.length; k++) if (rs[k].applies && rs[k].cells[col] === c) return rs[k].id;
    return null;
  }

  /** Rule 5: the nearest larger size column with a stricter class (null if none), and the nearest smaller one with a
      weaker class (null if none). */
  function thresholds(rs, col) {
    var c = classAt(rs, col), up = null, down = null, k;
    for (k = col + 1; k < SIZES.length && up === null; k++) if (classAt(rs, k) > c) up = k;
    for (k = col - 1; k >= 0 && down === null; k--) if (classAt(rs, k) < c) down = k;
    return { up: up, down: down };
  }

  /** Rule 6: the fine ceiling for a class from yearly worldwide turnover (€): the higher of the fixed sum and the
      share; `by` is 'pct' only when the share is strictly higher. Null for 'out'. */
  var FINES = {
    essential: { fixed: 10000000, num: 2, den: 100 },
    important: { fixed: 7000000, num: 14, den: 1000 }
  };
  function fine(cls, turnover) {
    var f = FINES[cls];
    if (!f) return null;
    var pct = Math.floor(turnover * f.num / f.den);
    return { fixed: f.fixed, pct: pct, ceiling: Math.max(f.fixed, pct), by: pct > f.fixed ? 'pct' : 'fixed' };
  }

  var nis2 = {
    SIZES: SIZES, CEILINGS: CEILINGS, CLASSES: CLASSES, ROWS: ROWS, GROUPS: GROUPS, ROLES: ROLES, FINES: FINES,
    within: within, size: size, rows: rows, classAt: classAt, decider: decider, thresholds: thresholds, fine: fine
  };

  if (typeof module === 'object' && module.exports) module.exports = nis2;
  else (root.SimdeckModels = root.SimdeckModels || {}).nis2 = nis2;
})(typeof globalThis !== 'undefined' ? globalThis : this);
