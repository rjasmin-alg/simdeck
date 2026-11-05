// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for crush-failure-domain (rules: SPEC.md). Run: node --test sims/crush-failure-domain/
// Tie-breaks first, then one test per rule, then every preset's numbers (from the cephsim engine), then the template's
// generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const last = (over) => at(over, logic.steps(P(over)));
const kinds = (over) => logic.norm(P(over)).events.map((e) => e.kind + (e.rule ? ':' + e.rule : ''));
const stopped = (c) => c.inactive + c.stale;
const sum = (c) => c.clean + c.degraded + c.inactive + c.stale;

// ── tie-breaks ──

test('tie-break (rule 6): the sample strip is PGs 0–11 in id order; the totals count every PG', () => {
  for (const pool of ['rbd', 'ec']) {
    const s = last({ pool, lostRack: 1 });
    assert.deepEqual(s.sample, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    assert.equal(s.pgs.length, logic.POOLS[pool].pgNum);
    assert.equal(sum(s.counts), logic.POOLS[pool].pgNum);
  }
});

test('tie-break: copies are drawn grouped by rack 1, 2, 3, in CRUSH order within a rack, holes last', () => {
  // rbd, type host, PG 0: CRUSH gives osd.24 (rack 1), osd.10 (rack 1), osd.83 (rack 3)
  assert.deepEqual(logic.rawOf('rbd', 'host')[0], [24, 10, 83]);
  assert.deepEqual(logic.drawOrder('rbd', 'host', 0).map((x) => x.osd), [24, 10, 83]);
  // PG 1: 39 (rack 2), 53 (rack 2), 17 (rack 1) → rack 1 first, then rack 2 in CRUSH order
  assert.deepEqual(logic.rawOf('rbd', 'host')[1], [39, 53, 17]);
  assert.deepEqual(logic.drawOrder('rbd', 'host', 1).map((x) => x.osd), [17, 39, 53]);
  // ec, type rack, PG 0: 83, -, 66, -, 29, - → 29 (rack 1), 66 (rack 2), 83 (rack 3), then three holes
  assert.deepEqual(logic.rawOf('ec', 'rack')[0], [83, null, 66, null, 29, null]);
  assert.deepEqual(logic.drawOrder('ec', 'rack', 0), [
    { osd: 29, rack: 1, host: 2 }, { osd: 66, rack: 2, host: 5 }, { osd: 83, rack: 3, host: 6 }, null, null, null]);
  for (let pg = 0; pg < 2048; pg++) {
    const racks = logic.drawOrder('rbd', 'host', pg).map((x) => x.rack);
    assert.deepEqual(racks, racks.slice().sort((a, b) => a - b));
  }
});

test('tie-break: the step script — one rule: place, risk, lose; the comparison runs the other rule, then totals', () => {
  assert.deepEqual(kinds({}), ['place:host', 'risk:host']);
  assert.deepEqual(kinds({ lostRack: 1 }), ['place:host', 'risk:host', 'lose:host']);
  assert.deepEqual(kinds({ rule: 'rack', compare: true, lostRack: 2 }),
    ['place:rack', 'risk:rack', 'lose:rack', 'place:host', 'risk:host', 'lose:host', 'totals:host']);
  assert.deepEqual(kinds({ compare: true }), ['risk:host', 'totals:rack']);
});

test('tie-break: switching the rule brings the lost rack back before placing again', () => {
  const s = at({ compare: true, lostRack: 1 }, 4);
  assert.equal(s.rule, 'rack');
  assert.equal(s.lostRack, null);
  assert.deepEqual(s.down, []);
  assert.equal(s.ev.switched, true);
  assert.equal(s.ev.back, 1);
  assert.equal(s.counts.clean, 2048);
  // the totals step keeps the last loss on screen
  const t = last({ compare: true, lostRack: 1 });
  assert.equal(t.lostRack, 1);
  assert.equal(t.rule, 'rack');
});

test('tie-break: params from a URL (strings) normalise to the same values', () => {
  assert.deepEqual(logic.norm({ lostRack: '2', compare: 'true' }).events, logic.norm({ lostRack: 2, compare: true }).events);
  assert.equal(logic.norm({ lostRack: '2' }).lost, 2);
});

// ── rules ──

test('rule 1: chooseleaf type host puts each copy on a different host; two may share a rack', () => {
  let shared = 0;
  for (let pg = 0; pg < 2048; pg++) {
    const c = logic.copiesOf('rbd', 'host', pg);
    assert.equal(c.length, 3);
    assert.equal(new Set(c.map(logic.hostOf)).size, 3, 'three hosts');
    if (new Set(c.map(logic.rackOf)).size < 3) shared += 1;
  }
  assert.equal(shared, 1390);
  assert.equal(logic.riskCount('rbd', 'host'), 1390);
});

test('rule 1: chooseleaf type rack puts each copy in a different rack; never two in one', () => {
  for (let pg = 0; pg < 2048; pg++) {
    const c = logic.copiesOf('rbd', 'rack', pg);
    assert.equal(new Set(c.map(logic.rackOf)).size, 3);
    assert.deepEqual(logic.riskRacks('rbd', 'rack', pg), []);
  }
  assert.equal(logic.riskCount('rbd', 'rack'), 0);
});

test('rule 2: a rule cannot place more copies than there are buckets of its type; the rest are holes', () => {
  // EC 4+2 over 3 racks: three shards placed (one per rack), three holes, every PG
  for (let pg = 0; pg < 1024; pg++) {
    assert.equal(logic.holesOf('ec', 'rack', pg), 3);
    assert.equal(new Set(logic.copiesOf('ec', 'rack', pg).map(logic.rackOf)).size, 3);
    assert.equal(logic.holesOf('ec', 'host', pg), 0);
  }
  assert.equal(logic.holeCount('ec', 'rack'), 1024);
  assert.equal(logic.holeCount('rbd', 'rack'), 0, 'size 3 fits three racks');
  // undersized from birth: 3 of 6 is below min_size 4, so inactive before anything fails
  const s = at({ pool: 'ec', rule: 'rack' }, 1);
  assert.deepEqual(s.counts, { clean: 0, degraded: 0, inactive: 1024, stale: 0 });
  assert.equal(s.holes, 1024);
});

test('rule 3: after a loss, ≥ 2 copies in the lost rack → inactive, exactly 1 → degraded, 0 → clean (size 3 / min_size 2)', () => {
  for (const rule of ['host', 'rack']) {
    for (const r of [1, 2, 3]) {
      const s = last({ rule, lostRack: r });
      for (let pg = 0; pg < 2048; pg++) {
        const inLost = logic.perRack('rbd', rule, pg)[r - 1];
        const want = inLost === 3 ? 'stale' : inLost === 2 ? 'inactive' : inLost === 1 ? 'degraded' : 'clean';
        assert.equal(logic.groupOf(s, pg), want, `${rule} rack ${r} PG ${pg}`);
      }
    }
  }
  // the thresholds themselves (ceph-min-size rules 1–4)
  assert.equal(logic.group(3, 3, 2), 'clean');
  assert.equal(logic.group(2, 3, 2), 'degraded');
  assert.equal(logic.group(1, 3, 2), 'inactive');
  assert.equal(logic.group(0, 3, 2), 'stale');
  assert.equal(logic.group(4, 6, 4), 'degraded');
  assert.equal(logic.group(3, 6, 4), 'inactive');
});

test('rule 3: a rack is "at risk" for a PG exactly when losing it stops that PG', () => {
  for (const [pool, rule] of [['rbd', 'host'], ['rbd', 'rack'], ['ec', 'host']]) {
    for (const r of [1, 2, 3]) {
      const s = last({ pool, rule, lostRack: r });
      for (let pg = 0; pg < logic.POOLS[pool].pgNum; pg++) {
        const stops = !logic.active(logic.groupOf(s, pg));
        assert.equal(logic.riskRacks(pool, rule, pg).includes(r), stops, `${pool} ${rule} rack ${r} PG ${pg}`);
      }
    }
  }
});

test('rule 4: all copies in the lost rack → stale (no copy left), and only then', () => {
  const s = last({ lostRack: 1 });
  let all3 = 0;
  for (let pg = 0; pg < 2048; pg++) if (logic.perRack('rbd', 'host', pg)[0] === 3) all3 += 1;
  assert.equal(all3, 33);
  assert.equal(s.counts.stale, 33);
});

test('rule 5: before the loss both rules report HEALTH_OK; after it, not', () => {
  for (const rule of ['host', 'rack']) {
    const placed = at({ rule }, 1);
    assert.equal(placed.health, 'HEALTH_OK');
    assert.equal(placed.counts.clean, 2048);
    assert.equal(last({ rule, lostRack: 1 }).health, 'HEALTH_WARN');
  }
  // even a loss that stops nothing is not OK: the rack's OSDs are down
  assert.equal(logic.health({ clean: 2048, degraded: 0, inactive: 0, stale: 0 }, [0]), 'HEALTH_WARN');
  // EC by rack is not OK even before anything fails (rule 2)
  assert.equal(at({ pool: 'ec', rule: 'rack' }, 1).health, 'HEALTH_WARN');
});

// ── presets (numbers: cephsim engine, evaluatePool on brokenRule / threeRacks; tools/gen-placement.mjs prints them) ──

test('preset by-host-lose-rack: 453 inactive (420 below min_size + 33 with no copy), 1096 degraded, 499 clean', () => {
  const p = { lostRack: 1 };
  assert.equal(logic.steps(P(p)), 3);
  const s = last(p);
  assert.deepEqual(s.counts, { clean: 499, degraded: 1096, inactive: 420, stale: 33 });
  assert.equal(stopped(s.counts), 453);
  assert.equal(s.ev.hit, 2048 - 499);
  // the other racks, from the same engine run
  assert.equal(stopped(last({ lostRack: 2 }).counts), 470);
  assert.equal(stopped(last({ lostRack: 3 }).counts), 467);
});

test('preset by-rack-lose-rack: 0 inactive, 2048 degraded', () => {
  const p = { rule: 'rack', lostRack: 1 };
  assert.equal(logic.steps(P(p)), 3);
  assert.deepEqual(last(p).counts, { clean: 0, degraded: 2048, inactive: 0, stale: 0 });
});

test('preset before-the-loss: both rules all 2048 active+clean; risk 1390 vs 0', () => {
  const p = { compare: true };
  assert.equal(logic.steps(P(p)), 2);
  const s = last(p);
  assert.equal(s.ev.kind, 'totals');
  assert.deepEqual(s.ev.totals.map((r) => [r.rule, r.health, r.before.clean, r.risky, r.after]),
    [['host', 'HEALTH_OK', 2048, 1390, null], ['rack', 'HEALTH_OK', 2048, 0, null]]);
});

test('preset ec-by-host: 271 of 1024 inactive with min_size 4 (783 with min_size 5)', () => {
  const p = { pool: 'ec', lostRack: 1 };
  assert.equal(logic.steps(P(p)), 3);
  const s = last(p);
  assert.deepEqual(s.counts, { clean: 14, degraded: 739, inactive: 271, stale: 0 });
  assert.deepEqual(s.ev.alt, { minSize: 5, inactive: 783 });
  assert.equal(logic.riskCount('ec', 'host'), 706);
});

test('preset host-then-rack: seven steps; the totals compare both rules after the same loss', () => {
  const p = { compare: true, lostRack: 1 };
  assert.equal(logic.steps(P(p)), 7);
  const s = last(p);
  const [host, rack] = s.ev.totals;
  assert.equal(stopped(host.after), 453);
  assert.equal(stopped(rack.after), 0);
  assert.equal(rack.after.degraded, 2048);
  assert.equal(host.health, 'HEALTH_OK');
  assert.equal(rack.health, 'HEALTH_OK');
  // step 3 is the host loss, step 6 the rack loss
  assert.equal(stopped(at(p, 3).counts), 453);
  assert.equal(stopped(at(p, 6).counts), 0);
});

test('a loss marks only the sample PGs whose state changed', () => {
  const s = last({ lostRack: 1 });
  for (const pg of s.sample) {
    const changed = logic.groupOf(s, pg) !== 'clean';
    assert.equal(s.ev.changed.includes(pg), changed, `PG ${pg}`);
  }
  assert.equal(s.ev.nChanged, 2048 - 499);
  for (const r of [1, 2, 3]) {
    const t = last({ lostRack: r });
    assert.ok(t.ev.changed.length > 0 && t.ev.changed.every((pg) => t.sample.includes(pg)), `rack ${r}: only sample PGs are marked`);
  }
});

test('steps: the risk shows from the risk step on; the place caption knows when the placement is new', () => {
  assert.equal(at({}, 1).risk, false);
  assert.equal(at({}, 2).risk, true);
  assert.equal(at({}, 1).ev.placedNow, true);
  assert.equal(at({}, 2).ev.placedNow, false);
  assert.equal(at({ compare: true }, 1).ev.placedNow, true, 'the no-loss comparison places and shows the risk at once');
  assert.equal(at({ compare: true, lostRack: 1 }, 4).ev.placedNow, true, 'the rule switch places afresh');
  assert.equal(at({ compare: true, lostRack: 1 }, 5).ev.placedNow, false);
});

test('the min_size 5 count is given for the EC pool only', () => {
  assert.equal(last({ lostRack: 1 }).ev.alt, undefined);
  assert.equal(last({ rule: 'rack', lostRack: 2 }).ev.alt, undefined);
});

test('totals use the rack that was lost, and the EC comparison', () => {
  const [host, rack] = last({ compare: true, lostRack: 2 }).ev.totals;
  assert.equal(stopped(host.after), 470);
  assert.equal(stopped(rack.after), 0);
  const [eh, er] = last({ pool: 'ec', compare: true, lostRack: 1 }).ev.totals;
  assert.equal(eh.health, 'HEALTH_OK');
  assert.equal(stopped(eh.after), 271);
  assert.equal(er.health, 'HEALTH_WARN', 'EC by rack is inactive before the loss (rule 2)');
  assert.equal(stopped(er.before), 1024);
  assert.equal(er.risky, 0);
});

test('a loss marks nothing when every PG was already inactive (EC by rack)', () => {
  const s = last({ pool: 'ec', rule: 'rack', lostRack: 1 });
  assert.deepEqual(s.ev.changed, []);
  assert.equal(s.ev.nChanged, 0);
});

test('labels: PG ids as Ceph writes them (pool.hex), the pools, the rule mode', () => {
  assert.equal(logic.pgId('rbd', 10), '1.a');
  assert.equal(logic.pgId('ec', 11), '3.b');
  assert.deepEqual([logic.POOLS.ec.k, logic.POOLS.ec.m, logic.POOLS.ec.width, logic.POOLS.ec.minSize], [4, 2, 6, 4]);
  assert.equal(logic.ruleMode('rbd'), 'firstn');
  assert.equal(logic.ruleMode('ec'), 'indep');
});

// ── generic (from the template) ──

const RUNS = [{}, { lostRack: 1 }, { rule: 'rack', lostRack: 3 }, { compare: true }, { pool: 'ec', lostRack: 1 },
  { pool: 'ec', rule: 'rack', compare: true, lostRack: 2 }, { compare: true, lostRack: 1 }];

test('state is JSON-safe at every step', () => {
  for (const r of RUNS) {
    const p = P(r);
    for (let k = 0; k <= logic.steps(p); k++) {
      const s = kit.stateAt(logic, p, k);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const r of RUNS) {
    const p = P(r), n = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let k = 1; k <= n; k++) { s = logic.step(s, k, p); forward.push(s); }
    for (let k = n; k >= 0; k--) assert.deepEqual(kit.stateAt(logic, p, k), forward[k]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ compare: true, lostRack: 1 });
  let s = logic.initial(p);
  for (let k = 1; k <= logic.steps(p); k++) {
    const copy = structuredClone(s);
    const next = logic.step(s, k, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('every step count stays within the 20-step limit', () => {
  for (const pool of ['rbd', 'ec']) for (const rule of logic.RULES) for (const lostRack of logic.LOST) for (const compare of [false, true]) {
    const n = logic.steps(P({ pool, rule, lostRack, compare }));
    assert.ok(n >= 2 && n <= 7, `${pool} ${rule} ${lostRack} ${compare}: ${n}`);
  }
});

test('unknown params fall back to the defaults', () => {
  const o = logic.norm({ pool: 'x', rule: 'row', lostRack: 7, compare: 'maybe' });
  assert.equal(o.pool, 'rbd');
  assert.equal(o.rule, 'host');
  assert.equal(o.lostRack, 'none');
  assert.equal(o.compare, false);
});

test('showAll is a view only: it does not change the steps or the states', () => {
  for (const r of RUNS) {
    const a = P(r), b = P(Object.assign({}, r, { showAll: true }));
    assert.equal(logic.steps(a), logic.steps(b));
    assert.deepEqual(kit.stateAt(logic, a, logic.steps(a)), kit.stateAt(logic, b, logic.steps(b)));
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model; meta steps = sim.json steps = the defaults', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults));
  const presets = html.slice(html.indexOf('presets: ['));
  const keys = [...presets.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(?:^|,)\s*(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, meta.steps);
});

test('placement.js is what tools/gen-placement.mjs writes from the cephsim engine (spot check)', () => {
  assert.deepEqual(logic.rawOf('rbd', 'host')[0], [24, 10, 83]);
  assert.deepEqual(logic.rawOf('rbd', 'rack')[0], [24, 91, 55]);
  assert.equal(logic.rawOf('rbd', 'host').length, 2048);
  assert.equal(logic.rawOf('ec', 'host').length, 1024);
  assert.equal(logic.hostName(0), 'ceph-r1-1');
  assert.equal(logic.hostName(8), 'ceph-r3-3');
  assert.deepEqual([logic.rackOf(35), logic.rackOf(36), logic.rackOf(107)], [1, 2, 3]);
});
