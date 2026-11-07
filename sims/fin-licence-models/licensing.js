/* SPDX-License-Identifier: AGPL-3.0-or-later
   Licensing on the ledger (SPEC.md rules 1-7): how many licences a metric counts each year, the perpetual licence
   (bought, capitalised and amortised, plus yearly maintenance, a lapse and its back-fees) and the subscription
   (a yearly fee, all expense), as rows of the shared ledger (ledger.js, copied from fin-capex-opex). Rows 0…H: row 0
   is day one (empty), row y is year y; a payment due on the first day of year y sits in row y, so each row holds that
   year's cash and expense. Pure functions over plain numbers, no words, so the coordinator can promote it to
   models/licensing.js unchanged. In a page it registers on globalThis.SimdeckModels.licensing; under node it is
   module.exports. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var Lg = node ? require('./ledger.js') : root.SimdeckModels.ledger;

  function row() { return { cash: 0, capex: 0, dep: 0, opex: 0 }; }
  function zeros(H) { var out = []; for (var y = 0; y <= H; y++) out.push(0); return out; }

  /** Kept to a millionth, so 220.50000000000003 and 220.49999999999997 both count as 220.5 (rule 1). */
  function tidy(x) {
    var v = Math.round(x * 1e6) / 1e6;
    return v === 0 ? 0 : v;
  }

  /** Rule 1: users in year y, u0 growing by g a year, rounded to whole users, half up. */
  function usersIn(u0, g, y) {
    return Math.round(tidy(u0 * Math.pow(1 + g, y - 1)));
  }

  /** Rule 1: the hardware and both counts for years 1…H (index 0 is day one, all 0). Servers: one per `perServer`
      users, rounded up; cores per server `small` before the refresh year, `big` from it on (refresh 0: never). */
  function counts(c) {
    var out = { users: zeros(c.H), servers: zeros(c.H), perServer: zeros(c.H), cores: zeros(c.H) };
    for (var y = 1; y <= c.H; y++) {
      var u = usersIn(c.u0, c.g, y);
      var s = Math.ceil(u / c.perServer);
      var k = c.refresh > 0 && y >= c.refresh ? c.big : c.small;
      out.users[y] = u;
      out.servers[y] = s;
      out.perServer[y] = k;
      out.cores[y] = s * k;
    }
    return out;
  }

  /** Rule 2: the list price of one licence in year y, rising by r a year. */
  function listPrice(base, r, y) { return base * Math.pow(1 + r, y - 1); }

  /** Rule 3: perpetual licences held: never fewer than the year before (bought licences are kept). */
  function held(need) {
    var out = zeros(need.length - 1), h = 0;
    for (var y = 1; y < need.length; y++) { h = Math.max(h, need[y]); out[y] = h; }
    return out;
  }

  /** Rules 3-6: the perpetual licence. o: { need[], list[] (by year), m (maintenance share), life (years),
      lapse (first lapsed year, 0 = none), gap (years lapsed), fee (reinstatement share) }. */
  function perpetual(o) {
    var H = o.need.length - 1;
    var h = held(o.need);
    var r = [row()], parts = [{ amort: 0, maint: 0, back: 0 }], bought = [0];
    var lapsed = function (y) { return o.lapse > 0 && y >= o.lapse && y < o.lapse + o.gap; };
    var backYear = o.lapse > 0 ? o.lapse + o.gap : 0;
    for (var y = 1; y <= H; y++) { r.push(row()); parts.push({ amort: 0, maint: 0, back: 0 }); bought.push(h[y] - h[y - 1]); }
    var skipped = 0, missed = 0;
    for (y = 1; y <= H; y++) {
      var capex = bought[y] * o.list[y];
      r[y].capex = capex;
      // rule 4: amortised straight-line from the year it is bought, a full year in that year
      for (var k = y; k <= Math.min(H, y + o.life - 1); k++) {
        r[k].dep += capex / o.life;
        parts[k].amort += capex / o.life;
      }
      // rule 5: maintenance on every licence held, at this year's list price; none while lapsed
      if (lapsed(y)) {
        skipped += h[y] * o.list[y] * o.m;
        missed += h[y];
      } else {
        parts[y].maint = h[y] * o.list[y] * o.m;
      }
      // rule 6: coming back pays every missed licence-year at this year's price, plus the reinstatement fee
      if (y === backYear) parts[y].back = missed * o.list[y] * o.m * (1 + o.fee);
      r[y].opex = parts[y].maint + parts[y].back;
      r[y].cash = capex + r[y].opex;
    }
    return { rows: r, parts: parts, held: h, bought: bought, skipped: skipped, missed: missed, backYear: backYear };
  }

  /** Rule 7: the subscription: each year's licences at s × this year's list price, paid and expensed that year. */
  function subscription(o) {
    var H = o.need.length - 1;
    var r = [row()], fee = [0];
    for (var y = 1; y <= H; y++) {
      var f = o.need[y] * o.list[y] * o.s;
      r.push({ cash: f, capex: 0, dep: 0, opex: f });
      fee.push(f);
    }
    return { rows: r, fee: fee };
  }

  /** Cash paid so far at the end of each year, rounded to the euro as shown (index 0: day one, 0). */
  function cumulative(rows) {
    return rows.map(function (_, y) { return Lg.roundMoney(Lg.sums(rows, y).cash); });
  }

  /** Rule 8: the crossing year: the first year from which the subscription has cost more cash so far (rounded,
      strictly more) in every remaining year of the horizon; 0 when it has not by the end. */
  function crossing(perp, sub) {
    var cross = 0;
    for (var y = perp.length - 1; y >= 1; y--) {
      if (sub[y] > perp[y]) cross = y;
      else break;
    }
    return cross;
  }

  var model = {
    tidy: tidy, usersIn: usersIn, counts: counts, listPrice: listPrice, held: held,
    perpetual: perpetual, subscription: subscription, cumulative: cumulative, crossing: crossing
  };

  if (node) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {}).licensing = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
