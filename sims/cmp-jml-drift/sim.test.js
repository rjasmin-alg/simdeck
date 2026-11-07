// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-jml-drift. Run: node --test sims/cmp-jml-drift/
// Rules and expected numbers: SPEC.md. Tie-breaks and boundaries first, then the rules in order (the people × roles ×
// rights model in access.js, then the page's model in sim.js), the presets, the behaviour over many runs, and the
// template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const A = require('./access.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const CTL = (over) => Object.assign({ hr: false, roles: false, move: false, review: 'off', care: 50 }, over);
const NEED = [0, 1, 2, 3].map(A.teamMask);
/** A hand-made account. */
const ACC = (id, team, over) => Object.assign({ id, team, left: null, on: true, roles: 0, direct: NEED[team] }, over);
/** A hand-made event list: months 1…24 empty unless given. */
function EV(start, months) {
  const out = { start, months: [null] };
  for (let m = 1; m <= 24; m++) out.months.push(Object.assign({ leaves: [], joins: [], moves: [], requests: [] }, months[m] || {}));
  return out;
}
const bits = (...rs) => rs.reduce((m, r) => m | (1 << r), 0);

// ── tie-breaks and boundaries ──

test('rule 2: a draw equal to the chance does not fire (strict <)', () => {
  assert.equal(A.fires(0.0199999, 0.02), true);
  assert.equal(A.fires(0.02, 0.02), false);
  assert.equal(A.fires(0.5, A.TOLD), false);
  assert.equal(A.fires(0, A.MOVE), true);
});

test('rule 2: the mover goes to one of the other three teams; the request is the k-th right outside the team', () => {
  assert.deepEqual([0, 0.3333, 0.3334, 0.6667, 0.9999].map((u) => A.moveTo(0, u)), [1, 1, 2, 3, 3]);
  assert.deepEqual([0, 0.5, 0.9999].map((u) => A.moveTo(3, u)), [0, 1, 2]);
  assert.equal(A.outsideRight(0, 0), 5);
  assert.equal(A.outsideRight(0, 14), 19);
  assert.equal(A.outsideRight(2, 9), 9);
  assert.equal(A.outsideRight(2, 10), 15);
  for (let t = 0; t < 4; t++) for (let k = 0; k < 15; k++) assert.notEqual(A.teamOf(A.outsideRight(t, k)), t);
});

test('rule 6: the review list goes by name, and equal names by id', () => {
  const list = [ACC(7, 0), ACC(3, 0), ACC(5, 0)];
  assert.deepEqual(A.orderOf(list, () => 0.5).map((a) => a.id), [3, 5, 7]);
  assert.deepEqual(A.orderOf(list, (id) => ({ 7: 0.1, 3: 0.9, 5: 0.1 })[id]).map((a) => a.id), [5, 7, 3]);
  assert.deepEqual(list.map((a) => a.id), [7, 3, 5], 'the input is not reordered');
});

test('rule 6: the reviewer reads exactly `care` lines, roles before rights, and approves the rest unread', () => {
  // one account, roles off: 5 needed + 3 unneeded rights (10, 15, 19) = 8 lines, in right order 0-4, 10, 15, 19
  const mk = () => [ACC(1, 0, { direct: NEED[0] | bits(10, 15, 19) })];
  const at = (care) => { const a = mk(); const r = A.review(a, 3, CTL({ review: 'one', care }), 1); return [a[0].direct, r.checked, r.removed]; };
  assert.deepEqual(at(5), [NEED[0] | bits(10, 15, 19), 5, 0]);        // only the needed rights read
  assert.deepEqual(at(6), [NEED[0] | bits(15, 19), 6, 1]);            // the 6th line is right 10
  assert.deepEqual(at(7), [NEED[0] | bits(19), 7, 2]);
  assert.deepEqual(at(8), [NEED[0], 8, 3]);                          // lines = care: all read
  assert.deepEqual(at(500), [NEED[0], 8, 3]);
  // roles first: an account with roles 0 and 2 and one direct right reads the stray role before the right
  const b = [ACC(1, 0, { roles: bits(0, 2), direct: bits(7) })];
  assert.deepEqual(A.lineList(b[0]), [100, 102, 7]);
  A.review(b, 3, CTL({ review: 'one', care: 2, roles: true }), 1);
  assert.deepEqual([b[0].roles, b[0].direct], [bits(0), bits(7)]);
});

test('rule 6: reading the same list each quarter reaches the same people first', () => {
  // two people with one unneeded right each, care 6: only the first in name order is cleaned, every time
  const accts = [ACC(1, 0, { direct: NEED[0] | bits(5) }), ACC(2, 0, { direct: NEED[0] | bits(6) })];
  const first = A.orderOf(accts, (id) => A.nameKey(9, id))[0].id;
  A.review(accts, 3, CTL({ review: 'one', care: 6 }), 9);
  A.review(accts, 6, CTL({ review: 'one', care: 6 }), 9);
  const left = accts.filter((a) => A.popcount(A.excessOf(a)) > 0).map((a) => a.id);
  assert.deepEqual(left, [first === 1 ? 2 : 1]);
});

// ── rule 1: the department ──

test('rule 1: four teams of twelve, five rights each; everyone starts with exactly their job', () => {
  assert.deepEqual(NEED, [0x1f, 0x3e0, 0x7c00, 0xf8000]);
  assert.deepEqual([0, 4, 5, 19].map(A.teamOf), [0, 0, 1, 3]);
  assert.equal(A.rolesMask(bits(1, 3)), NEED[1] | NEED[3]);
  const ev = A.events(1);
  assert.deepEqual(ev.start.map((p) => p.id), Array.from({ length: 48 }, (_, i) => i + 1));
  assert.deepEqual(ev.start.map((p) => p.team), Array.from({ length: 48 }, (_, i) => Math.floor(i / 12)));
  for (const roles of [false, true]) {
    const r = A.replay(ev, CTL({ roles }), 1, 0);
    assert.equal(r.series[0].excess, 0);
    assert.equal(r.series[0].lines, roles ? 48 : 240);
    for (const a of r.accounts) assert.equal(A.rightsOf(a), NEED[a.team]);
  }
});

// ── rule 2: events ──

test('rule 2: six draws per active person per month in roster order, then one draw per joiner', () => {
  for (const seed of [949, 5, 77]) {
    const ev = A.events(seed);
    // redraw independently
    const r = A.rng(seed);
    let team = {}, ids = [], next = 49;
    for (let i = 1; i <= 48; i++) { team[i] = Math.floor((i - 1) / 12); ids.push(i); }
    for (let m = 1; m <= 24; m++) {
      const L = [], M = [], R = [], J = [];
      for (const i of ids) {
        const u = [r(), r(), r(), r(), r(), r()];
        if (u[0] < 0.02) { L.push({ id: i, team: team[i], told: u[1] < 0.5 }); continue; }
        let t = team[i];
        if (u[2] < 0.015) { const to = (t + 1 + Math.floor(u[3] * 3)) % 4; M.push({ id: i, from: t, to }); t = to; }
        if (u[4] < 0.05) R.push({ id: i, right: [...Array(20).keys()].filter((x) => Math.floor(x / 5) !== t)[Math.floor(u[5] * 15)] });
      }
      const stay = ids.filter((i) => !L.some((x) => x.id === i));
      for (const x of L) {
        const mates = stay.filter((i) => team[i] === x.team);
        const u = r();
        J.push({ id: next, team: x.team, copy: mates.length ? mates[Math.floor(u * mates.length)] : null });
        team[next++] = x.team;
      }
      for (const x of M) team[x.id] = x.to;
      ids = stay.concat(J.map((x) => x.id));
      assert.deepEqual(ev.months[m], { leaves: L, joins: J, moves: M, requests: R }, `seed ${seed} month ${m}`);
    }
  }
});

test('rule 2: a leaver neither moves nor requests; a joiner copies a colleague who stayed in that team', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const ev = A.events(seed);
    const team = {};
    ev.start.forEach((p) => { team[p.id] = p.team; });
    for (let m = 1; m <= 24; m++) {
      const e = ev.months[m];
      const gone = new Set(e.leaves.map((x) => x.id));
      for (const x of e.moves) assert.ok(!gone.has(x.id));
      for (const x of e.requests) assert.ok(!gone.has(x.id));
      assert.equal(e.joins.length, e.leaves.length);
      e.joins.forEach((j, k) => {
        assert.equal(j.team, e.leaves[k].team);
        if (j.copy !== null) { assert.ok(!gone.has(j.copy)); assert.equal(team[j.copy], j.team); assert.ok(j.copy < j.id); }
      });
      const moved = Object.fromEntries(e.moves.map((x) => [x.id, x.to]));
      for (const x of e.requests) assert.notEqual(A.teamOf(x.right), moved[x.id] ?? team[x.id], 'outside the (new) team');
      e.joins.forEach((j) => { team[j.id] = j.team; });
      e.moves.forEach((x) => { assert.equal(team[x.id], x.from); team[x.id] = x.to; });
    }
  }
});

// ── rules 3-5: joiners, movers, leavers, requests ──

test('rule 3: without roles a joiner gets the job plus a copy of the colleague; with roles only the role', () => {
  const mate = ACC(5, 1, { direct: NEED[1] | bits(0, 17) });
  const a = A.account(60, 1, CTL(), mate);
  assert.deepEqual([a.roles, a.direct], [0, NEED[1] | bits(0, 17)]);
  assert.equal(A.popcount(A.excessOf(a)), 2);
  const b = A.account(60, 1, CTL(), null);
  assert.deepEqual([b.roles, b.direct], [0, NEED[1]]);
  const c = A.account(60, 1, CTL({ roles: true }), mate);
  assert.deepEqual([c.roles, c.direct], [bits(1), 0]);
  // in a replay: the copied surplus is counted per month
  const ev = EV([{ id: 1, team: 0 }, { id: 2, team: 0 }], {
    1: { requests: [{ id: 1, right: 9 }] },
    2: { leaves: [{ id: 2, team: 0, told: true }], joins: [{ id: 3, team: 0, copy: 1 }] }
  });
  const r = A.replay(ev, CTL(), 1, 24);
  assert.deepEqual(r.copied.slice(0, 3), [0, 0, 1]);
  assert.equal(r.accounts.find((x) => x.id === 3).direct, NEED[0] | bits(9));
  assert.deepEqual(A.replay(ev, CTL({ roles: true }), 1, 24).copied.slice(0, 3), [0, 0, 0]);
});

test('rule 4: a move adds the new access, and takes the old away only with removal on move', () => {
  const ev = EV([{ id: 1, team: 0 }], { 1: { requests: [{ id: 1, right: 12 }] }, 2: { moves: [{ id: 1, from: 0, to: 1 }] } });
  const end = (ctl) => { const a = A.replay(ev, CTL(ctl), 1, 24).accounts[0]; return [a.team, a.roles, a.direct]; };
  assert.deepEqual(end({}), [1, 0, NEED[0] | NEED[1] | bits(12)]);
  assert.deepEqual(end({ move: true }), [1, 0, NEED[1] | bits(12)]);              // the one-off grant stays
  assert.deepEqual(end({ roles: true }), [1, bits(0, 1), bits(12)]);
  assert.deepEqual(end({ roles: true, move: true }), [1, bits(1), bits(12)]);
  const r = A.replay(ev, CTL({ roles: true }), 1, 24);
  assert.equal(r.series[2].excess, 6);                                             // old role (5) + the request
  assert.equal(r.series[2].lines, 3);                                              // two roles, one right
});

test('rule 5: a leaver\'s account closes on the last day with HR records or when IT was told, else stays open', () => {
  const ev = EV([{ id: 1, team: 0 }, { id: 2, team: 0 }], {
    4: { leaves: [{ id: 1, team: 0, told: false }, { id: 2, team: 0, told: true }],
      joins: [{ id: 3, team: 0, copy: null }, { id: 4, team: 0, copy: null }] }
  });
  const open = (ctl) => A.replay(ev, CTL(ctl), 1, 24).accounts.filter((a) => a.on).map((a) => a.id);
  assert.deepEqual(open({}), [1, 3, 4]);
  assert.deepEqual(open({ hr: true }), [3, 4]);
  const r = A.replay(ev, CTL(), 1, 24);
  assert.deepEqual([r.series[3].orphans, r.series[4].orphans, r.series[4].orphanRights], [0, 1, 5]);
  assert.deepEqual([r.series[4].people, r.series[4].excess], [2, 0], 'an orphan\'s rights are not counted per person');
  const a = r.accounts.find((x) => x.id === 1);
  assert.equal(a.left, 4);
  assert.equal(A.excessOf(a), NEED[0], 'every right of a leaver is unneeded');
});

test('rule 5: a request is granted directly and stays', () => {
  const ev = EV([{ id: 1, team: 2 }], { 1: { requests: [{ id: 1, right: 3 }] }, 5: { requests: [{ id: 1, right: 3 }] } });
  const r = A.replay(ev, CTL({ roles: true }), 1, 24);
  assert.equal(r.accounts[0].direct, bits(3));
  assert.deepEqual([r.series[1].excess, r.series[24].excess, r.series[24].lines], [1, 1, 2]);
});

test('rule 5: within a month, joiners copy before the moves, and requests come after the moves', () => {
  const ev = EV([{ id: 1, team: 0 }, { id: 2, team: 0 }], {
    1: { leaves: [{ id: 2, team: 0, told: true }], joins: [{ id: 3, team: 0, copy: 1 }],
      moves: [{ id: 1, from: 0, to: 1 }], requests: [{ id: 1, right: 3 }] }
  });
  const r = A.replay(ev, CTL({ move: true }), 1, 24);
  const by = Object.fromEntries(r.accounts.map((a) => [a.id, a]));
  assert.equal(by[3].direct, NEED[0], 'the copy is the colleague before the move');
  assert.equal(by[1].direct, NEED[1] | bits(3), 'the request survives the removal on move');
  assert.equal(r.copied[1], 0);
});

// ── rule 6: the review ──

test('rule 6: a read line that is not needed goes, a needed one stays, a leaver\'s read line closes the account', () => {
  const accts = [
    ACC(1, 0, { direct: NEED[0] | bits(6) }),
    ACC(2, 1, { left: 2, direct: NEED[1] | bits(0) }),
    ACC(3, 2, { roles: bits(2, 3), direct: 0 }),
    ACC(4, 3, { on: false, direct: NEED[3] | bits(1) })     // closed: not listed
  ];
  const r = A.review(accts, 3, CTL({ review: 'one', care: 500 }), 1);
  assert.deepEqual(accts.map((a) => [a.on, a.roles, a.direct]), [
    [true, 0, NEED[0]], [false, 0, NEED[1] | bits(0)], [true, bits(2), 0], [false, 0, NEED[3] | bits(1)]]);
  assert.deepEqual([r.lines, r.reviewers, r.perReviewer, r.checked, r.excess, r.removed, r.orphans, r.closed],
    [6 + 6 + 2, 1, 14, 14, 1 + 5, 6, 1, 1]);
});

test('rule 6: team leads review their own team; a leaver is listed under the team they left', () => {
  const accts = [
    ACC(1, 0, { direct: NEED[0] | bits(6) }), ACC(2, 0, { left: 1, direct: NEED[0] }),
    ACC(3, 1, { direct: NEED[1] | bits(0, 11) })
  ];
  const r = A.review(accts, 3, CTL({ review: 'teams', care: 6 }), 4);
  // team 0: 6 + 5 = 11 lines, team 1: 7 lines; each lead reads 6
  assert.deepEqual([r.reviewers, r.lines, r.perReviewer, r.checked], [2, 18, 11, 12]);
  assert.equal(accts[2].direct, NEED[1] | bits(11), 'lead 1 read right 0 (6th line) but not right 11');
});

test('rule 6: the review runs after the month\'s events, at the end of every third month only', () => {
  const ev = EV([{ id: 1, team: 0 }], { 3: { requests: [{ id: 1, right: 7 }] }, 4: { requests: [{ id: 1, right: 8 }] } });
  const r = A.replay(ev, CTL({ review: 'one', care: 50 }), 1, 24);
  assert.deepEqual(r.reviews.map((x) => x.month), [3, 6, 9, 12, 15, 18, 21, 24]);
  assert.deepEqual([r.reviews[0].removed, r.reviews[1].removed], [1, 1]);
  assert.deepEqual([r.series[3].excess, r.series[4].excess, r.series[5].excess, r.series[6].excess], [0, 1, 1, 0]);
  assert.equal(A.replay(ev, CTL(), 1, 24).reviews.length, 0);
});

// ── rule 7: numbers ──

test('rule 7: tenths halve up; lines are roles plus direct rights over open accounts', () => {
  assert.deepEqual([[0, 48], [1, 48], [2, 48], [3, 48], [24, 48], [134, 48]].map(([a, b]) => A.tenths(a, b)), [0, 0, 0, 1, 5, 28]);
  assert.equal(A.tenths(1, 20), 1);   // 0.05 → 0.1
  assert.equal(A.linesOf(ACC(1, 0, { roles: bits(0, 1), direct: bits(3) })), 3);
  const snap = A.snapshot([ACC(1, 0, { direct: NEED[0] | bits(9) }), ACC(2, 1, { on: false }), ACC(3, 2, { left: 3, roles: bits(2), direct: 0 })]);
  assert.deepEqual(snap, { people: 1, excess: 1, excess10: 10, orphans: 1, orphanRights: 5, lines: 6 + 1 });
});

test('rule 7: replay returns copies of the accounts at the chosen month and leaves the events alone', () => {
  const ev = A.events(949), before = structuredClone(ev);
  const r12 = A.replay(ev, CTL(), 949, 12), r24 = A.replay(ev, CTL(), 949, 24);
  assert.deepEqual(ev, before);
  assert.equal(r12.series.length, 25);
  assert.deepEqual(r12.series, r24.series);
  assert.ok(r12.accounts.length < r24.accounts.length);
  assert.equal(A.snapshot(r12.accounts).excess, r12.series[12].excess);
  assert.equal(A.snapshot(r24.accounts).lines, r24.series[24].lines);
});

test('rule 7: the accounts at a review month are taken after the review, like the numbers', () => {
  for (const m of [3, 12, 24]) {
    const r = A.replay(A.events(949), CTL({ review: 'one' }), 949, m);
    assert.deepEqual(A.snapshot(r.accounts), r.series[m], `month ${m}`);
  }
});

// ── rules 8-10: the page's model ──

test('rule 8: both runs replay the same events; the baseline is the no-controls run', () => {
  const s = S({ hr: true, roles: true, move: true, review: 'teams', month: 17 });
  const ev = A.events(949);
  assert.deepEqual(s.base.series, A.replay(ev, logic.NONE, 949, 17).series);
  const mine = A.replay(ev, logic.controlsOf(s.p), 949, 17);
  assert.deepEqual(s.mine.series, mine.series);
  assert.deepEqual(s.mine.reviews, mine.reviews.map((r) => r.month));
  assert.deepEqual(s.mine.sum, logic.reviewsUpTo(mine.reviews, 17));
  assert.equal(s.mine.sum.count, 5);
  assert.deepEqual(s.mine.sum.last, mine.reviews[4]);
  // the matrix: open accounts, active by team then id, then leavers by id
  const cols = s.mine.cols;
  assert.deepEqual(cols, logic.matrix(mine.accounts));
  const active = cols.filter((c) => c.left === null), gone = cols.filter((c) => c.left !== null);
  assert.deepEqual(cols, active.concat(gone));
  for (let i = 1; i < active.length; i++) assert.ok(active[i - 1].team < active[i].team || (active[i - 1].team === active[i].team && active[i - 1].id < active[i].id));
  assert.equal(active.length, 48);
  assert.equal(gone.length, s.mine.series[17].orphans, 'only open leavers\' accounts');
  // with leavers' accounts open (no HR records): they come last, by id
  const g = S({ review: 'one', month: 17 }), gc = g.mine.cols.filter((c) => c.left !== null);
  assert.equal(gc.length, g.mine.series[17].orphans);
  assert.ok(gc.length > 1);
  assert.deepEqual(g.mine.cols.slice(-gc.length), gc);
  for (let i = 1; i < gc.length; i++) assert.ok(gc[i - 1].id < gc[i].id, 'leavers by id');
  for (const c of cols) {
    const a = mine.accounts.find((x) => x.id === c.id);
    assert.equal(a.on, true);
    assert.deepEqual([c.held, c.extra, c.lines], [A.rightsOf(a), A.excessOf(a), A.linesOf(a)]);
  }
  // copied: the controlled run's, summed up to the month
  const run = A.replay(ev, logic.controlsOf(s.p), 949, 17), base = A.replay(ev, logic.NONE, 949, 17);
  const upTo = (x, m) => x.copied.slice(1, m + 1).reduce((a, b) => a + b, 0);
  for (const m of [5, 17, 24]) {
    const t = S({ review: 'one', month: m }), r1 = A.replay(ev, logic.controlsOf(t.p), 949, m);
    assert.equal(t.mine.copied, upTo(r1, m), `month ${m}`);
    assert.equal(t.base.copied, upTo(base, m), `base month ${m}`);
  }
  assert.equal(upTo(run, 17), 0, 'roles: no copies');
  assert.ok(S({ review: 'one', month: 17 }).mine.copied > 0);
  // counts up to the month
  let leaves = 0;
  for (let m = 1; m <= 17; m++) leaves += ev.months[m].leaves.length;
  assert.equal(s.counts.leaves, leaves);
});

test('rule 8: the month only cuts what the page shows, never the runs', () => {
  const a = S({ review: 'one', month: 24 }), b = S({ review: 'one', month: 7 });
  assert.deepEqual(a.base.series, b.base.series);
  assert.deepEqual(a.mine.series, b.mine.series);
  assert.equal(b.mine.sum.count, 2);
  assert.equal(S({ review: 'one', month: 2 }).mine.sum.last, null);
});

test('rule 9: params made safe', () => {
  assert.deepEqual(logic.normalise({}), logic.defaults);
  assert.deepEqual(logic.normalise({ hr: 'true', roles: '1', move: 'false', review: 'teams' }),
    P({ hr: true, roles: true, move: false, review: 'teams' }));
  assert.deepEqual(logic.normalise({ hr: 'maybe', review: 'all' }), logic.defaults);
  assert.equal(logic.normalise({ care: 44 }).care, 40);
  assert.equal(logic.normalise({ care: 45 }).care, 50);
  assert.equal(logic.normalise({ care: 3 }).care, 10);
  assert.equal(logic.normalise({ care: 9999 }).care, 500);
  assert.equal(logic.normalise({ care: '' }).care, 50);
  assert.equal(logic.normalise({ month: -3 }).month, 0);
  assert.equal(logic.normalise({ month: '12.6' }).month, 13);
  assert.equal(logic.normalise({ month: 99 }).month, 24);
  assert.equal(logic.normalise({ month: 'x' }).month, 24);
  assert.equal(logic.normalise({ seed: 0 }).seed, 1);
  assert.equal(logic.normalise({ seed: 1e9 }).seed, 999999);
  assert.equal(logic.normalise({ seed: ' ' }).seed, 949);
  assert.equal(logic.normalise({ seed: 12.6 }).seed, 13);
  assert.equal(logic.normalise({ seed: Infinity }).seed, 949);
  assert.equal(logic.normalise({ hr: 1, roles: 0 }).hr, true);
});

test('rule 10: the caption: month 0, no controls, and the notes in order, at most two', () => {
  assert.deepEqual(logic.captionKey(S({ month: 0 })), { key: 'capStart', notes: [] });
  assert.deepEqual(logic.captionKey(S({})), { key: 'capNone', notes: ['nCopy', 'nUntold'] });
  assert.deepEqual(logic.captionKey(S({ hr: true })), { key: 'capMain', notes: ['nCopy'] });
  assert.deepEqual(logic.captionKey(S({ review: 'one' })), { key: 'capMain', notes: ['nReview', 'nCopy'] });
  assert.ok(!logic.captionKey(S({ review: 'one', month: 2 })).notes.includes('nReview'), 'no review before month 3');
  assert.ok(logic.captionKey(S({ review: 'one', month: 3 })).notes.includes('nReview'));
  assert.deepEqual(logic.captionKey(S({ roles: true })), { key: 'capMain', notes: ['nRolesNoMove', 'nUntold'] });
  assert.deepEqual(logic.captionKey(S({ hr: true, roles: true, move: true })), { key: 'capMain', notes: ['nOneOff'] });
  assert.deepEqual(logic.captionKey(S({ hr: true, roles: true, move: true, review: 'teams' })), { key: 'capMain', notes: ['nReview'] });
  // nothing to say: roles and move on, no unneeded rights at month 1 of a quiet run
  const quiet = S({ hr: true, roles: true, move: true, month: 1 });
  assert.equal(quiet.mine.series[1].excess > 0, logic.captionKey(quiet).notes.includes('nOneOff'));
  assert.equal(logic.isNone(logic.NONE), true);
  assert.equal(logic.isNone(Object.assign({}, logic.NONE, { care: 200 })), true, 'care alone does nothing');
  for (const k of ['hr', 'roles', 'move']) assert.equal(logic.isNone(Object.assign({}, logic.NONE, { [k]: true })), false, k);
  assert.equal(logic.isNone(Object.assign({}, logic.NONE, { review: 'one' })), false);
  assert.equal(logic.captionKey(S({ move: true })).key, 'capMain');
});

test('rule 10: each note has its own condition', () => {
  // a hand-made state: month 5, nothing happened unless given
  const st = (p, over) => Object.assign({
    p: Object.assign({ hr: false, roles: false, move: false, review: 'off', month: 5 }, p), none: false,
    counts: { moves: 0, untold: 0 }, mine: { sum: { last: null }, copied: 0, series: Array(25).fill({ excess: 0 }) }
  }, over);
  const notes = (p, over) => logic.captionKey(st(p, over)).notes;
  assert.deepEqual(notes({}), []);
  assert.deepEqual(notes({ roles: true }), [], 'roles without moves: nothing kept');
  assert.deepEqual(notes({ roles: true }, { counts: { moves: 1, untold: 0 } }), ['nRolesNoMove']);
  assert.deepEqual(notes({ roles: true, move: true }, { counts: { moves: 1, untold: 0 } }), []);
  assert.deepEqual(notes({}, { mine: { sum: { last: null }, copied: 3, series: Array(25).fill({ excess: 0 }) } }), ['nCopy']);
  assert.deepEqual(notes({ roles: true }, { mine: { sum: { last: null }, copied: 3, series: Array(25).fill({ excess: 0 }) } }), []);
  assert.deepEqual(notes({}, { counts: { moves: 0, untold: 2 } }), ['nUntold']);
  assert.deepEqual(notes({ hr: true }, { counts: { moves: 0, untold: 2 } }), []);
  const ex = { mine: { sum: { last: null }, copied: 0, series: Array(25).fill({ excess: 4 }) } };
  assert.deepEqual(notes({ roles: true, move: true, hr: true }, ex), ['nOneOff']);
  assert.deepEqual(notes({ roles: true, move: false, hr: true }, ex), [], 'one-off note needs removal on move');
  assert.deepEqual(notes({ roles: false, move: true, hr: true }, ex), []);
  assert.deepEqual(notes({}, { mine: { sum: { last: { month: 3 } }, copied: 0, series: Array(25).fill({ excess: 0 }) } }), ['nReview']);
});

// ── presets (SPEC.md table) ──

test('presets: the SPEC table at month 24, seed 949', () => {
  const row = (id) => {
    const s = logic.compute(preset(id)), m = s.mine.series[24], b = s.base.series[24], l = s.mine.sum.last;
    return [b.excess10, b.orphans, b.lines, m.excess10, m.orphans, m.lines, s.mine.sum.removed, s.mine.sum.closed,
      l ? [l.lines, l.perReviewer, l.checked, l.removed, l.excess, l.closed, l.orphans] : null, s.mine.copied];
  };
  assert.deepEqual(row('drift'), [28, 12, 451, 28, 12, 451, 0, 0, null, 50]);
  assert.deepEqual(row('hr'), [28, 12, 451, 28, 0, 373, 0, 0, null, 50]);
  assert.deepEqual(row('big-review'), [28, 12, 451, 21, 12, 418, 27, 0, [424, 424, 50, 6, 106, 0, 12], 42]);
  assert.deepEqual(row('team-review'), [28, 12, 451, 5, 4, 290, 106, 8, [307, 112, 200, 12, 36, 1, 5], 18]);
  assert.deepEqual(row('roles'), [28, 12, 451, 9, 0, 91, 0, 0, null, 0]);
  assert.deepEqual(row('all'), [28, 12, 451, 0, 0, 48, 58, 0, [56, 19, 56, 8, 8, 0, 0], 0]);
  const c = logic.compute(preset('drift')).counts;
  assert.deepEqual(c, { leaves: 23, moves: 17, requests: 58, joins: 23, untold: 12 });
  assert.deepEqual([3, 6, 12].map((m) => logic.compute(P({ month: m })).base.series[m].excess10), [7, 9, 13]);
});

test('over many runs: the orderings SPEC.md promises hold for seeds 1-60', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const e = (over) => logic.compute(P(Object.assign({ seed }, over))).mine.series[24];
    const drift = e(preset('drift')), big = e(preset('big-review')), team = e(preset('team-review'));
    const roles = e(preset('roles')), all = e(preset('all')), noMove = e({ hr: true, roles: true });
    assert.equal(e(preset('hr')).orphans, 0, `seed ${seed}`);
    assert.ok(big.excess10 < drift.excess10 && team.excess10 < big.excess10, `seed ${seed}: reviews`);
    assert.ok(big.orphans <= drift.orphans, `seed ${seed}`);
    assert.ok(roles.excess10 < drift.excess10 && all.excess10 <= roles.excess10, `seed ${seed}: roles`);
    assert.ok(noMove.excess10 > roles.excess10, `seed ${seed}: removal on move`);
  }
});

test('the controls: next seed; the defaults are the no-controls preset; every preset sits inside the ranges', () => {
  assert.equal(logic.nextSeed(949), 950);
  assert.equal(logic.nextSeed(logic.RANGES.seed[1]), 1);
  assert.deepEqual(logic.defaults, preset('drift'));
  for (const x of logic.presets) assert.deepEqual(logic.normalise(x.params), x.params, x.id);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params), [P({ month: 0 })])) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('team-review'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset, team, right, review and caption has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="access\.js"><\/script>\s*<script src="strings\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const caps = ['capStart', 'capNone', 'capMain', 'nReviewOne', 'nReviewTeams', 'nRemoved', 'nRemovedClosed',
    'nRolesNoMove', 'nCopy', 'nUntold', 'nOneOff'];
  for (const lang of ['hr', 'en']) {
    for (let t = 0; t < logic.TEAMS; t++) assert.ok(strings[lang]['t_' + t], `${lang} t_${t}`);
    for (let r = 0; r < logic.RIGHTS; r++) assert.ok(strings[lang]['x_' + r], `${lang} x_${r}`);
    for (const x of logic.REVIEWS) assert.ok(strings[lang]['rv_' + x], `${lang} rv_${x}`);
    for (const k of caps) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: big-review → pBigReview. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
