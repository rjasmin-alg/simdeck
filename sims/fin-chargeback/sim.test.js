// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-chargeback. Run: node --test sims/fin-chargeback/sim.test.js
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the allocation module's rules (promotable with it),
// then the page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const A = require('./allocation.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const SP = (id, over) => logic.compute(Object.assign({}, preset(id), over));
const D = (id, u, quote, variable) => ({ id, units: { k: u }, variable: variable || 0, quote });
const row = (s, id) => s.rows.find((x) => x.id === id);

/** An independent spiral for the cross-check: exact fractions as [num, den] compared by cross-multiplying. */
function reference(fixed, depts, inIds, key, charged) {
  let ins = depts.filter((d) => inIds.includes(d.id));
  const out = [];
  for (;;) {
    const T = fixed + ins.reduce((s, d) => s + d.variable, 0);
    const U = ins.reduce((s, d) => s + d.units[key], 0);
    const outside = depts.filter((d) => !ins.includes(d)).reduce((s, d) => s + d.quote, 0);
    const r = { in: ins.map((d) => d.id), total: T, company: T + outside, leaves: null };
    out.push(r);
    if (!charged || !ins.length) break;
    // bill_d = T·u/U; over when bill > quote; leaver = largest bill − quote, first in order on a tie
    let best = null;
    for (const d of ins) {
      const over = T * d.units[key] - d.quote * U;   // (bill − quote)·U
      if (over > 0 && (best === null || over > best.over)) best = { d, over };
    }
    if (!best) break;
    r.leaves = best.d.id;
    ins = ins.filter((d) => d !== best.d);
  }
  return out;
}

// ── tie-breaks ──

test('rule 1a: bills add up to the shared cost; equal remainders take the extra euro in list order', () => {
  assert.deepEqual(A.bills(10, [D('a', 1), D('b', 1), D('c', 1)], 'k'), { a: 4, b: 3, c: 3 });
  assert.deepEqual(A.bills(11, [D('a', 1), D('b', 1), D('c', 1)], 'k'), { a: 4, b: 4, c: 3 });
  assert.deepEqual(A.bills(11, [D('c', 1), D('b', 1), D('a', 1)], 'k'), { c: 4, b: 4, a: 3 });
  // a larger remainder wins over the list order: 10 × 2/3 = 6.67, 10 × 1/3 = 3.33
  assert.deepEqual(A.bills(10, [D('a', 1), D('b', 2)], 'k'), { a: 3, b: 7 });
  // on the page: by VMs, Accounting and Customer support both have 16 VMs; Accounting comes first and gets the euro
  const s = S({ key: 'vms' });
  assert.equal(row(s, 'acct').bill, 3159);
  assert.equal(row(s, 'sup').bill, 3158);
  for (const x of logic.presets) {
    for (const r of logic.compute(x.params).rounds) {
      if (!r.in.length) continue;
      assert.equal(Object.values(r.bills).reduce((a, v) => a + v, 0), r.total, x.id);
    }
  }
});

test('rule 1b: a bill exactly equal to the offer stays', () => {
  const ds = [D('a', 1, 50), D('b', 1, 49)];          // T 100, U 2: each bill exactly 50
  assert.equal(A.excess(100, 2, ds[0], 'k'), 0);
  assert.deepEqual(A.over(100, ds, 'k'), ['b']);
  assert.equal(A.leaver(100, ds, 'k'), 'b');
  assert.equal(A.leaver(100, [D('a', 1, 50), D('b', 1, 50)], 'k'), null);
  // on the page: Development alone in round 5 of the spiral pays 33 560 against 34 000 and stays; at use 100 and a
  // fixed cost of 30 440 it would pay exactly its offer — not reachable on the 5 000 € grid, so checked in the module
  const dev = logic.departments(P({})).find((d) => d.id === 'dev');
  assert.equal(A.leaver(30440 + dev.variable, [dev], 'users'), null);
  assert.equal(A.leaver(30441 + dev.variable, [dev], 'users'), 'dev');
});

test('rule 1c: equal excesses go to the earlier department', () => {
  const ds = [D('a', 1, 10), D('b', 1, 10), D('c', 2, 100)];   // T 100, U 4: a and b pay 25, 15 over each
  assert.equal(A.leaver(100, ds, 'k'), 'a');
  assert.equal(A.leaver(100, [ds[1], ds[0], ds[2]], 'k'), 'b');
  assert.deepEqual(A.over(100, ds, 'k'), ['a', 'b']);
});

test('rule 1d: one department leaves per round, the largest excess, even when several are over', () => {
  const s = SP('spiral');
  assert.deepEqual(s.rounds[1].over, ['sales', 'acct']);
  assert.equal(s.rounds[1].leaves, 'sales');            // 14 030 − 10 000 beats 7 015 − 5 500
  assert.deepEqual(s.rounds.map((r) => r.leaves), ['sup', 'sales', 'acct', 'mkt', null]);
  // the largest excess in euros, not the largest bill or the largest ratio
  const ds = [D('a', 6, 50), D('b', 4, 5)];             // T 100, U 10: a 60 (+10, ×1.2), b 40 (+35, ×8)
  assert.equal(A.leaver(100, ds, 'k'), 'b');
  const ds2 = [D('a', 6, 20), D('b', 4, 5)];            // a 60 (+40, ×3), b 40 (+35, ×8): a, the larger excess
  assert.equal(A.leaver(100, ds2, 'k'), 'a');
});

test('rule 1e: the unit price rounds to the nearest cent, halves up; none for no units', () => {
  assert.equal(A.cents(1, 8), 13);          // 12.5 → 13
  assert.equal(A.cents(39480, 248), 15919); // 159.1935…
  assert.equal(A.cents(37140, 68), 54618);  // 546.176…
  assert.equal(A.cents(5, 0), null);
  assert.equal(S({}).rounds[0].unit, 15919);
});

// ── the allocation module ──

test('rule 2: the shared cost is the fixed cost plus the variable cost of those in', () => {
  const ds = logic.departments(P({}));
  assert.deepEqual(ds.map((d) => d.variable), [1180, 920, 3560, 2400, 1420]);
  assert.equal(A.shared(30000, ds), 39480);
  assert.equal(A.shared(30000, []), 30000);
  assert.equal(A.shared(0, ds), 9480);
});

test('rule 2: usage scales a department\'s units, variable cost and offer together, in whole numbers', () => {
  const ds = logic.departments(P({ use_dev: 150, use_sales: 75 }));
  const dev = ds.find((d) => d.id === 'dev'), sales = ds.find((d) => d.id === 'sales');
  assert.deepEqual(dev.units, { users: 60, vms: 180, tb: 78, tickets: 72 });
  assert.equal(dev.variable, 3560 * 1.5);
  assert.equal(dev.quote, 51000);
  assert.deepEqual(sales.units, { users: 42, vms: 9, tb: 6, tickets: 45 });
  assert.equal(sales.quote, 7500);
  for (let u = 50; u <= 200; u += 25) {
    for (const d of logic.departments(P({ use_sales: u, use_acct: u, use_dev: u, use_sup: u, use_mkt: u }))) {
      for (const v of Object.values(d.units).concat([d.variable, d.quote])) assert.ok(Number.isInteger(v), `${d.id} ${u}`);
    }
  }
});

test('rule 3: the key\'s units are summed over those in', () => {
  const ds = logic.departments(P({}));
  assert.deepEqual(logic.KEYS.map((k) => A.units(ds, k)), [248, 200, 100, 400]);
  assert.equal(A.units(ds.slice(0, 2), 'users'), 84);
});

test('rule 4: a bill is the shared cost × the department\'s share of the key; the key decides who pays', () => {
  const by = (key) => S({ key }).rows.map((x) => x.bill);
  assert.deepEqual(by('users'), [8915, 4457, 6368, 15919, 3821]);
  assert.deepEqual(by('vms'), [2369, 3159, 23688, 3158, 7106]);
  assert.deepEqual(by('tb'), [3158, 4738, 20530, 3158, 7896]);
  assert.deepEqual(by('tickets'), [5922, 3948, 4738, 19740, 5132]);
  for (const key of logic.KEYS) assert.equal(by(key).reduce((a, v) => a + v, 0), 39480, key);
  // each bill is within a euro of the exact share
  const s = S({ key: 'users' });
  for (const x of s.rows) assert.ok(Math.abs(x.bill - 39480 * x.units / 248) < 1, x.id);
  // no department or no units: no bills
  assert.deepEqual(A.bills(100, [], 'k'), {});
  assert.deepEqual(A.bills(100, [D('a', 0)], 'k'), {});
});

test('rule 4: when one department grows, everyone else\'s bill falls', () => {
  const a = SP('by-vms'), b = SP('dev-grows');
  for (const id of ['sales', 'acct', 'sup', 'mkt']) assert.ok(row(b, id).bill < row(a, id).bill, id);
  assert.ok(row(b, 'dev').bill > row(a, 'dev').bill);
  assert.equal(b.rounds[0].total, 43040);
});

test('rule 5: over means the exact bill is above the offer (integers, no rounding)', () => {
  const s = S({});
  assert.deepEqual(s.rounds[0].over, ['sup']);   // 15 919 > 13 000
  assert.equal(row(s, 'sup').status, 'over');
  assert.equal(row(s, 'sales').status, 'in');
  // T × u − q × U: 39 480 × 100 − 13 000 × 248
  const sup = logic.departments(P({})).find((d) => d.id === 'sup');
  assert.equal(A.excess(39480, 248, sup, 'users'), 724000);
});

test('rule 6: the department that leaves loses only its variable cost from the shared cost', () => {
  const s = SP('spiral');
  for (let i = 1; i < s.rounds.length; i++) {
    const gone = s.rounds[i - 1].leaves;
    assert.equal(s.rounds[i - 1].total - s.rounds[i].total, row(s, gone).variable, `round ${i}`);
  }
  // the bills of those left rise
  assert.ok(s.rounds[1].bills.sales > s.rounds[0].bills.sales);
  assert.ok(s.rounds[1].bills.dev > s.rounds[0].bills.dev);
});

test('rule 7: the company pays the shared cost of those in plus the offers of those out', () => {
  const ds = logic.departments(P({}));
  assert.equal(A.company(30000, ds, logic.IDS), 39480);
  assert.equal(A.company(30000, ds, ['dev']), 33560 + 10000 + 5500 + 13000 + 8000);
  assert.equal(A.company(30000, ds, []), 30000 + 10000 + 5500 + 34000 + 13000 + 8000);
  const s = SP('spiral');
  assert.deepEqual(s.rounds.map((r) => r.company), [39480, 50080, 58900, 63480, 70060]);
  // every departure costs the company its offer less its variable cost (> 0 here), so the total only grows
  for (let i = 1; i < s.rounds.length; i++) assert.ok(s.rounds[i].company > s.rounds[i - 1].company);
});

test('rule 8: showback is one round and nobody leaves; chargeback stops when nobody is over or nobody is left', () => {
  assert.equal(SP('by-users').rounds.length, 1);
  assert.equal(SP('by-users').rounds[0].leaves, null);
  assert.equal(SP('by-users', { mode: 'charge' }).rounds.length, 5);
  const last = SP('spiral').rounds.at(-1);
  assert.deepEqual(last.in, ['dev']);
  assert.deepEqual(last.over, []);
  // a fixed cost of 40 000: everyone leaves, the last round has nobody in and the fixed cost stays
  const s = S({ mode: 'charge', fixed: 40000 });
  assert.equal(s.outcome, 'collapse');
  assert.deepEqual(s.departed, ['sup', 'sales', 'acct', 'mkt', 'dev']);
  assert.deepEqual(s.rounds.at(-1).in, []);
  assert.equal(s.rounds.at(-1).total, 40000);
  assert.equal(s.rounds.at(-1).unit, null);
  assert.equal(s.company, 40000 + 70500);
});

test('rule 8: the spiral agrees with an independent reference over a grid of params', () => {
  let n = 0;
  for (const key of logic.KEYS) {
    for (let fixed = 0; fixed <= 60000; fixed += 5000) {
      for (const use of [50, 100, 150, 200]) {
        for (const out of [[], ['mkt'], ['sup', 'acct']]) {
          for (const mode of logic.MODES) {
            const p = P({ key, fixed, mode, use_dev: use, use_sup: 250 - use });
            out.forEach((id) => { p['out_' + id] = true; });
            const s = logic.compute(p);
            const ds = logic.departments(s.p);
            const ref = reference(fixed, ds, logic.IDS.filter((id) => !out.includes(id)), key, mode === 'charge');
            assert.deepEqual(s.rounds.map((r) => [r.in, r.total, r.company, r.leaves]),
              ref.map((r) => [r.in, r.total, r.company, r.leaves]), JSON.stringify(p));
            n++;
          }
        }
      }
    }
  }
  assert.ok(n > 1000);
});

test('rule 8: under chargeback nobody still in is over at the end', () => {
  for (const key of logic.KEYS) {
    for (let fixed = 0; fixed <= 60000; fixed += 5000) {
      const s = S({ key, fixed, mode: 'charge' });
      assert.deepEqual(s.rounds.at(-1).over, [], `${key} ${fixed}`);
      for (const x of s.rows) if (x.status === 'in') assert.ok(x.bill <= x.quote, `${key} ${fixed} ${x.id}`);
    }
  }
});

test('rule 8: a smaller fixed cost stops the spiral before it starts', () => {
  assert.equal(S({ mode: 'charge', fixed: 20000 }).outcome, 'stable');
  assert.equal(S({ mode: 'charge', fixed: 25000 }).outcome, 'spiral');
});

test('rule 9: the changed mark follows a status or the result', () => {
  const a = SP('charged'), b = SP('one-leaves');
  assert.deepEqual(logic.flipped(a, b), ['acct', 'mkt', 'result']);
  assert.deepEqual(logic.flipped(a, a), []);
  assert.deepEqual(logic.flipped(null, a), []);
  assert.deepEqual(logic.flipped(SP('by-users'), SP('by-vms')), ['sup']);   // over → in; result stays "show"
  const c = SP('spiral'), d = SP('spiral', { fixed: 20000 });
  assert.equal(d.outcome, 'stable');
  assert.ok(logic.flipped(c, d).includes('result'));
  // still "left", but in another round: Sales leaves in round 2 by users, in round 4 by tickets
  const u = S({ mode: 'charge', key: 'users' }), k = S({ mode: 'charge', key: 'tickets', fixed: 25000 });
  assert.deepEqual([row(u, 'sales').round, row(k, 'sales').round], [1, 3]);
  assert.ok(logic.flipped(u, k).includes('sales'));
  // still a spiral, but more leave: by VMs only Marketing, by storage Marketing and Accounting (fixed 35 000)
  const v = S({ mode: 'charge', key: 'vms', fixed: 35000 }), t = S({ mode: 'charge', key: 'tb', fixed: 35000 });
  assert.deepEqual([v.outcome, v.departed, t.outcome, t.departed], ['spiral', ['mkt'], 'spiral', ['mkt', 'acct']]);
  assert.deepEqual(logic.flipped(v, t), ['acct', 'result']);
});

test('rule 9: a change of numbers alone does not mark the result', () => {
  // by VMs, shown: a fixed cost of 35 000 pushes Marketing over its offer, but nobody moves and the result stays
  assert.deepEqual(logic.flipped(S({ key: 'vms' }), S({ key: 'vms', fixed: 35000 })), ['mkt']);
  assert.deepEqual(logic.flipped(S({ key: 'vms' }), S({ key: 'vms', fixed: 20000 })), []);
});

test('who would leave first: the largest excess among those in, not the list order', () => {
  const s = S({ fixed: 40000 });
  assert.deepEqual(s.rounds[0].over, ['sales', 'acct', 'sup']);
  assert.equal(s.firstOver, 'sup');
  // only Accounting in (the rest out by hand): it is the one over
  const o = S({ fixed: 25000, out_sales: true, out_dev: true, out_sup: true, out_mkt: true,
    use_acct: 175, use_dev: 125, use_sup: 150, use_mkt: 150, use_sales: 75 });
  assert.equal(o.firstOver, 'acct');
});

// ── the page model ──

test('presets give the SPEC numbers', () => {
  const sum = (id) => {
    const s = SP(id);
    return [s.outcome, s.departed.join(' '), s.rounds[0].total, s.rounds[0].unit, s.company,
      s.rows.map((x) => x.status[0] + (x.bill === null ? '-' : x.bill)).join(' ')];
  };
  assert.deepEqual(sum('by-users'), ['show', '', 39480, 15919, 39480, 'i8915 i4457 i6368 o15919 i3821']);
  assert.deepEqual(sum('by-vms'), ['show', '', 39480, 19740, 39480, 'i2369 i3159 i23688 i3158 i7106']);
  assert.deepEqual(sum('dev-grows'), ['show', '', 43040, 13450, 43040, 'i1614 i2152 i32280 i2152 i4842']);
  assert.deepEqual(sum('charged'), ['stable', '', 39480, 39480, 39480, 'i3158 i4738 i20530 i3158 i7896']);
  assert.deepEqual(sum('one-leaves'), ['spiral', 'acct', 38060, 47575, 50640, 'i4370 l5709 i28401 i4369 f-']);
  assert.deepEqual(sum('spiral'), ['spiral', 'sup sales acct mkt', 39480, 15919, 70060,
    'l14030 l10926 i33560 l15919 l13117']);
  assert.deepEqual(SP('spiral').rounds.map((r) => r.unit), [15919, 25054, 39022, 54656, 83900]);
  assert.deepEqual(SP('one-leaves').rounds.map((r) => r.unit), [47575, 54618]);
  const f = SP('one-leaves').forced;
  assert.deepEqual(f, { ids: ['mkt'], bill: 7896, variable: 1420, shifted: 6476 });
});

test('SPEC extra cases', () => {
  // everyone out by hand: the fixed cost and every offer
  const all = {};
  logic.IDS.forEach((id) => { all['out_' + id] = true; });
  const e = S(all);
  assert.equal(e.outcome, 'empty');
  assert.equal(e.company, 30000 + 70500);
  assert.equal(e.firstOver, null);
  assert.deepEqual(logic.captionKey(e), { before: [], key: 'capEmpty', notes: [] });
  // no fixed cost, by users, Development out: its bill was below its own variable cost, the others pay less
  const z = S({ fixed: 0, out_dev: true });
  assert.equal(row(S({ fixed: 0 }), 'dev').bill, 1529);
  assert.deepEqual(z.forced, { ids: ['dev'], bill: 1529, variable: 3560, shifted: -2031 });
  assert.deepEqual(logic.captionKey(z).before, ['nForcedSub']);
  // two out by hand
  const two = S({ key: 'tb', out_mkt: true, out_sup: true });
  assert.deepEqual(two.forced, { ids: ['sup', 'mkt'], bill: 3158 + 7896, variable: 2400 + 1420, shifted: 7234 });
  assert.deepEqual(logic.captionKey(two).before, ['nForcedN']);
  assert.deepEqual(logic.captionKey(S({ fixed: 0, out_dev: true, out_mkt: true, key: 'users' })).before, ['nForcedSubN']);
  // the mostly variable case: users, chargeback, fixed 5 000: stable
  const v = S({ mode: 'charge', fixed: 5000 });
  assert.equal(v.outcome, 'stable');
  assert.equal(v.rounds[0].total, 14480);
});

test('captions: the main sentence and notes follow the outcome', () => {
  assert.deepEqual(logic.captionKey(SP('by-users')), { before: [], key: 'capShow', notes: ['nWould'] });
  assert.deepEqual(logic.captionKey(SP('by-vms')), { before: [], key: 'capShow', notes: [] });
  assert.deepEqual(logic.captionKey(SP('charged')), { before: [], key: 'capStable', notes: [] });
  assert.deepEqual(logic.captionKey(SP('one-leaves')), { before: ['nForced'], key: 'capSpiral1', notes: ['nTotal'] });
  assert.deepEqual(logic.captionKey(SP('spiral')), { before: [], key: 'capSpiralN', notes: ['nTotal'] });
  assert.deepEqual(logic.captionKey(S({ mode: 'charge', fixed: 40000 })), { before: [], key: 'capCollapse', notes: ['nTotal'] });
  assert.deepEqual(logic.captionKey(SP('by-users', { out_mkt: true })), { before: ['nForced'], key: 'capShow', notes: ['nWould', 'nTotal'] });
  // exactly two leave: the "N" sentence
  assert.deepEqual(logic.captionKey(S({ key: 'tb', mode: 'charge', fixed: 35000 })), { before: [], key: 'capSpiralN', notes: ['nTotal'] });
  // out by hand and stable; a shift of only 3 € is still a shift onto the rest
  assert.deepEqual(logic.captionKey(S({ mode: 'charge', fixed: 20000, out_mkt: true })), { before: ['nForced'], key: 'capStable', notes: ['nTotal'] });
  const small = S({ key: 'tb', mode: 'charge', fixed: 25000, use_sales: 200, use_acct: 150, use_dev: 125, out_sup: true, use_sup: 75, use_mkt: 75 });
  assert.equal(small.forced.shifted, 3);
  assert.deepEqual(logic.captionKey(small).before, ['nForced']);
  // bills exactly equal to their own variable cost: the others pay the same
  const even = S({ fixed: 0, out_sales: true, out_mkt: true, use_sales: 125, use_mkt: 125, use_acct: 50, use_dev: 75, use_sup: 200 });
  assert.deepEqual(even.forced, { ids: ['sales', 'mkt'], bill: 3250, variable: 3250, shifted: 0 });
  assert.deepEqual(logic.captionKey(even).before, ['nForcedEvenN']);
  assert.deepEqual(logic.captionKey(S({ fixed: 0, out_dev: true, use_dev: 50, key: 'tickets' })).before.length, 1);
  // everyone out with no fixed cost: nothing is paid inside
  const all0 = { fixed: 0 };
  logic.IDS.forEach((id) => { all0['out_' + id] = true; });
  assert.equal(logic.captionKey(S(all0)).key, 'capEmptyFree');
  assert.equal(SP('by-users').firstOver, 'sup');
  assert.equal(SP('by-vms').firstOver, null);
});

test('the bar scales cover every bill, offer and company total', () => {
  for (const x of logic.presets) {
    const s = logic.compute(x.params);
    for (const r of s.rows) assert.ok(r.quote <= s.scale && (r.bill || 0) <= s.scale, x.id);
    for (const r of s.rounds) assert.ok(r.company <= s.cscale, x.id);
    assert.equal(s.scale % 5000, 0);
  }
  assert.equal(SP('by-users').scale, 35000);
  assert.equal(SP('dev-grows').scale, 70000);
  assert.equal(SP('spiral').cscale, 75000);
});

test('the defaults are preset 1', () => {
  assert.deepEqual(logic.defaults, preset('by-users'));
});

test('normalise clamps, snaps and defaults params from a URL', () => {
  const n = logic.normalise;
  assert.equal(n({ fixed: 70000 }).fixed, 60000);
  assert.equal(n({ fixed: -5 }).fixed, 0);
  assert.equal(n({ fixed: 12600 }).fixed, 15000);
  assert.equal(n({ fixed: '' }).fixed, 30000);
  assert.equal(n({ fixed: 'x' }).fixed, 30000);
  assert.equal(n({ fixed: true }).fixed, 30000);
  assert.equal(n({ fixed: Infinity }).fixed, 30000);
  assert.equal(n({ fixed: null }).fixed, 30000);
  assert.equal(n({ use_dev: 130 }).use_dev, 125);
  assert.equal(n({ use_dev: 10 }).use_dev, 50);
  assert.equal(n({ use_dev: 900 }).use_dev, 200);
  assert.equal(n({ key: 'cpu' }).key, 'users');
  assert.equal(n({ key: 'tb' }).key, 'tb');
  assert.equal(n({ mode: 'bill' }).mode, 'show');
  assert.equal(n({ out_mkt: 'true' }).out_mkt, true);
  assert.equal(n({ out_mkt: 'yes' }).out_mkt, false);
  assert.equal(n({ out_mkt: true }).out_mkt, true);
});

test('every preset sits inside the ranges', () => {
  for (const x of logic.presets) {
    assert.deepEqual(logic.normalise(x.params), Object.assign({}, logic.defaults, x.params), x.id);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  const all = {};
  logic.IDS.forEach((id) => { all['out_' + id] = true; });
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params), [all, { fixed: 0, mode: 'charge' }])) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('one-leaves'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset has its label and hint; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const lang of ['hr', 'en']) {
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
    for (const k of ['Users', 'Vms', 'Tb', 'Tickets']) {
      for (const pre of ['k', 'n', 'per', 'by']) assert.ok(strings[lang][pre + k], `${lang} ${pre}${k}`);
    }
  }
});

/** Preset id → string key: by-users → pByUsers. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
