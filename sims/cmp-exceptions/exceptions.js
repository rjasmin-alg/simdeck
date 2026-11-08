/* SPDX-License-Identifier: AGPL-3.0-or-later
   Exceptions to a standard as risk acceptances over time (catalogue §5.24: the exception is scored and signed the way
   cmp-risk-register scores and signs a residual risk). Each exception names a system, the month it was granted, how
   many months the fix takes once someone works on it, whether it has an owner and a compensating control, its
   likelihood and impact, and the month the system is replaced (or none). The regime decides what happens at expiry:
   no expiry at all, nothing (the date passes), renew (renewed without a decision) or review (fix, renew once,
   escalate). SPEC.md rules 1-7.
   Pure functions over plain data, no words and no dependencies, ready to be promoted to models/ unchanged
   (models/README.md). In a page it registers on globalThis.SimdeckModels['exceptions']; under node it is
   module.exports. */
(function (root) {
  'use strict';

  var MODES = ['nothing', 'renew', 'review'];
  var STATUSES = ['open', 'valid', 'renewed', 'escalated', 'expired'];
  var APPETITE = 8;               // rule 2: cmp-risk-register's default score appetite

  // from sims/cmp-risk-register/scoring.js @ 302ce39
  /** Rule 1: the ordinal score. */
  function score(l, i) { return l * i; }
  // from sims/cmp-risk-register/scoring.js @ 302ce39
  /** Rule 4: strictly above the appetite; equal is within. */
  function above(value, appetite) { return value > appetite; }
  // from sims/cmp-risk-register/scoring.js @ 302ce39
  /** Rule 5: who signs the residual: 'avoided', 'board' (above the appetite) or 'owner'. */
  function signer(t, residual, appetite) {
    if (t === 'avoid') return 'avoided';
    return above(residual, appetite) ? 'board' : 'owner';
  }

  /** Rule 1: the regime. Expiry 0 means no end date, whatever is set for expiry. */
  function regime(expiry, mode) {
    if (!expiry) return 'none';
    return MODES.indexOf(mode) >= 0 ? mode : 'nothing';
  }

  /** Rule 2: an exception as granted. complete: the policy asks for an owner and a compensating control, so every
      exception has both; otherwise it has what the request named. A compensating control lowers the likelihood by
      one level (not below 1). The residual is scored l × i and signed by its owner within the appetite, by the board
      above it (equal is within). */
  function granted(r, complete) {
    var owner = complete ? true : !!r.owner;
    var ctl = complete ? true : !!r.ctl;
    var l = ctl ? Math.max(1, r.l - 1) : r.l;
    var s = score(l, r.i);
    return { owner: owner, ctl: ctl, l: l, i: r.i, score: s, signer: signer('accept', s, APPETITE) };
  }

  /** Rule 3: when the system meets the standard again, and why. Under review the owner works to the deadline: the fix
      is done at the first review at which the months since the work began reach the effort, so at
      start + ⌈f / E⌉ · E; the work begins at the grant, or, with no owner, at the first review, where it is escalated
      and the board names one. Under every other regime nobody fixes it: only a replacement closes it. A replacement
      earlier than the fix closes it as replaced; at the same month it counts as fixed (tie-break).
      Returns { at, why } with at = null (and why = null) when it stays open past every month. */
  function closes(r, expiry, mode, complete) {
    var g = granted(r, complete);
    var rg = regime(expiry, mode);
    var fix = null;
    if (rg === 'review') {
      var start = g.owner ? r.g : r.g + expiry;
      fix = start + Math.ceil(r.f / expiry) * expiry;
    }
    var rep = typeof r.rep === 'number' ? r.rep : null;
    if (rep !== null && (fix === null || rep < fix)) return { at: rep, why: 'replaced' };
    if (fix !== null) return { at: fix, why: 'fixed' };
    return { at: null, why: null };
  }

  /** Rule 4: open at month m when granted ≤ m < closed (closed at m means it meets the standard at m). */
  function isOpen(r, c, m) { return r.g <= m && (c.at === null || m < c.at); }

  /** Rule 5: the register's status of an open exception at month m, k = ⌊(m − g) / E⌋ periods since the grant (at
      g + E exactly the first period is over, tie-break). none: 'open' (no end date); nothing: 'valid', then
      'expired'; renew: 'valid', then 'renewed'; review: 'valid', 'renewed' for the second period, 'escalated' after;
      with no owner 'escalated' from the first review. null when not open. */
  function status(r, expiry, mode, complete, m) {
    var c = closes(r, expiry, mode, complete);
    if (!isOpen(r, c, m)) return null;
    var rg = regime(expiry, mode);
    if (rg === 'none') return 'open';
    var k = Math.floor((m - r.g) / expiry);
    if (k === 0) return 'valid';
    if (rg === 'nothing') return 'expired';
    if (rg === 'renew') return 'renewed';
    return granted(r, complete).owner && k === 1 ? 'renewed' : 'escalated';
  }

  /** Rule 6: what the reviews did by month m (review only; zero otherwise). Each exception counts at most once in
      each: fixed (closed by a fix at or before m), renewed (still open at its first review month, with an owner),
      escalated (still open at its second review month, or at its first with no owner). A review happens only while the exception is
      open: one replaced at or before the review month is not reviewed. noOwner counts the escalations from a missing
      owner. */
  function reviews(list, expiry, mode, complete, m) {
    var out = { fixed: 0, renewed: 0, escalated: 0, noOwner: 0 };
    if (regime(expiry, mode) !== 'review') return out;
    list.forEach(function (r) {
      var c = closes(r, expiry, mode, complete), g = granted(r, complete);
      var open = function (t) { return t <= m && isOpen(r, c, t); };
      if (c.why === 'fixed' && c.at <= m) out.fixed++;
      if (g.owner) {
        if (open(r.g + expiry)) out.renewed++;
        if (open(r.g + 2 * expiry)) out.escalated++;
      } else if (open(r.g + expiry)) { out.escalated++; out.noOwner++; }
    });
    return out;
  }

  /** Rule 7: the estate at month m. n systems; a system meets the standard unless it has an open exception. The
      oldest open exception has the largest age m − g; on a tie the first in the list (tie-break). Counts by status,
      open ones without a control or granted without an owner, above the appetite (the board signed), older than a year (age ≥ 12),
      and the systems closed by a replacement by m. */
  function estate(list, n, expiry, mode, complete, m) {
    var by = {};
    STATUSES.forEach(function (k) { by[k] = 0; });
    var open = 0, oldest = null, noCtl = 0, noOwner = 0, board = 0, year = 0, replaced = 0;
    var items = list.map(function (r, idx) {
      var st = status(r, expiry, mode, complete, m), g = granted(r, complete);
      var c = closes(r, expiry, mode, complete);
      if (c.why === 'replaced' && c.at <= m) replaced++;
      if (!st) return { idx: idx, sys: r.sys, st: null, age: null };
      var age = m - r.g;
      open++; by[st]++;
      if (!g.ctl) noCtl++;
      if (!g.owner) noOwner++;
      if (g.signer === 'board') board++;
      if (age >= 12) year++;
      if (oldest === null || age > oldest.age) oldest = { idx: idx, age: age };
      return { idx: idx, sys: r.sys, st: st, age: age, ctl: g.ctl, owner: g.owner, signer: g.signer };
    });
    return {
      items: items, open: open, meets: n - open, share: (n - open) / n, by: by,
      oldest: oldest, noCtl: noCtl, noOwner: noOwner, board: board, year: year, replaced: replaced
    };
  }

  var api = {
    MODES: MODES, STATUSES: STATUSES, APPETITE: APPETITE,
    score: score, above: above, signer: signer,
    regime: regime, granted: granted, closes: closes, isOpen: isOpen, status: status, reviews: reviews, estate: estate
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.SimdeckModels = root.SimdeckModels || {}).exceptions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
