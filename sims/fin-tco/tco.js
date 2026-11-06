/* SPDX-License-Identifier: AGPL-3.0-or-later
   Total cost of ownership over a horizon: cost lines paid once at the start, every year, or once at the end; the
   total of an option, the ranking of two, and the ranking for every horizon. Rules: SPEC.md rules 1–8.
   Pure: no DOM, no words, plain data in and out, so the coordinator can promote it to models/tco.js unchanged.
   Registers on globalThis.SimdeckModels.tco in a page; module.exports under node. */
(function (root) {
  'use strict';

  /** When each line is paid: 'start' (once, at the start), 'year' (every year), 'end' (once, at the end). */
  var WHEN = { start: 'start', year: 'year', end: 'end' };

  /** What one line adds over a horizon of H years (rule 2). `unit` multiplies a yearly amount (hours × rate). */
  function lineOver(line, amount, H) {
    var x = amount * (line.unit || 1);
    return line.when === WHEN.year ? x * H : x;
  }

  /** The total of one option (rule 3): lines is [{ key, when, unit }], amounts { key: n }, on { key: bool }. */
  function total(lines, amounts, on, H) {
    var sum = 0;
    lines.forEach(function (l) { if (on[l.key]) sum += lineOver(l, amounts[l.key] || 0, H); });
    return sum;
  }

  /** The one-off part and the yearly part of a total: total(H) = once + H × yearly (rule 8). */
  function parts(lines, amounts, on) {
    var once = 0, yearly = 0;
    lines.forEach(function (l) {
      if (!on[l.key]) return;
      var x = (amounts[l.key] || 0) * (l.unit || 1);
      if (l.when === WHEN.year) yearly += x; else once += x;
    });
    return { once: once, yearly: yearly };
  }

  /** 'a' when a is lower, 'b' when b is lower, 'tie' when equal (rules 1, 4). */
  function cheaper(a, b) { return a < b ? 'a' : b < a ? 'b' : 'tie'; }

  /** Rule 6: x as a whole percent of t, rounded half up; null when t is not above 0. */
  function share(x, t) {
    if (!(t > 0)) return null;
    return Math.floor((200 * x + t) / (2 * t));
  }

  /** Rule 8: the ranking for every horizon 1…hmax. */
  function strip(lines, A, B, on, hmax) {
    var out = [];
    for (var H = 1; H <= hmax; H++) out.push(cheaper(total(lines, A, on, H), total(lines, B, on, H)));
    return out;
  }

  /** Rule 8: when the strip starts with one strict winner and ends with the other, the last horizon the first wins
      and the first horizon the other wins; otherwise null. */
  function crossing(s) {
    var first = s[0], last = s[s.length - 1];
    if (first === 'tie' || last === 'tie' || first === last) return null;
    return { early: first, upTo: s.lastIndexOf(first) + 1, late: last, from: s.indexOf(last) + 1 };
  }

  var tco = {
    WHEN: WHEN, lineOver: lineOver, total: total, parts: parts, cheaper: cheaper, share: share, strip: strip,
    crossing: crossing
  };

  if (typeof module === 'object' && module.exports) module.exports = tco;
  else (root.SimdeckModels = root.SimdeckModels || {}).tco = tco;
})(typeof globalThis !== 'undefined' ? globalThis : this);
