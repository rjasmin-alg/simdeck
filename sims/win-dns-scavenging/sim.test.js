// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-dns-scavenging's model. Run: node --test sims/win-dns-scavenging/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules, the presets, and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const H = 24;
const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const ZONE = { aging: true, noRefresh: 7 * H, refresh: 7 * H, agingEnabledAt: 0, canScavengeAfter: 7 * H };
const r0 = (ts) => logic.rec('pc1', '10.0.0.51', null, ts);
/** Every state of a run, step 0 … steps. */
const run = (over) => {
  const p = P(over);
  const out = [];
  for (let n = 0; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n));
  return out;
};
const day = (s) => s.t / H;
const has = (s, name) => !!logic.find(s.records, name);
const runEntry = (s) => s.log.find((e) => e.k === 'run');

// ── tie-breaks ──

test('T1: at the same time clients act before the run, and the run judges the new timestamp', () => {
  const s = run({});
  const i = s.findIndex((x) => day(x) === 14 && x.phase === 'clients');
  assert.equal(s[i + 1].phase, 'run');
  assert.equal(day(s[i + 1]), 14);
  // too-aggressive with a 1-day lease: the renewal at day 2 00:00 comes before the run at day 2, so prn4 survives
  const r = run({ scenario: 'printer', noRefresh: 1, refresh: 1, period: 1, lease: 1, until: 8 });
  assert.ok(r.every((x) => x.phase !== 'run' || runEntry(x).deleted.length === 0));
});

test('T2: a refresh at exactly ts + noRefresh is accepted; one hour earlier it is ignored', () => {
  assert.equal(logic.refresh(r0(0), ZONE, 7 * H).accepted, true);
  assert.equal(logic.refresh(r0(0), ZONE, 7 * H).record.timestamp, 7 * H);
  assert.equal(logic.refresh(r0(0), ZONE, 7 * H - 1).accepted, false);
  assert.equal(logic.refresh(r0(0), ZONE, 7 * H - 1).record.timestamp, 0);
  // after the boundary the timestamp is the refresh's own time, not the end of the no-refresh interval
  assert.equal(logic.refresh(r0(0), ZONE, 9 * H).record.timestamp, 9 * H);
  const pr = run({ scenario: 'printer', lease: 8, until: 14 });
  assert.equal(logic.find(pr.find((x) => day(x) === 8).records, 'prn4').timestamp, 8 * H);
});

test('T3: at exactly ts + noRefresh + refresh a record is not stale; one hour later it is', () => {
  assert.equal(logic.isStale(r0(0), ZONE, 14 * H), false);
  assert.equal(logic.isStale(r0(0), ZONE, 14 * H + 1), true);
  // defaults: the day-14 run keeps pc2 (registered day 0), the day-21 run deletes it
  const s = run({});
  const d14 = s.find((x) => day(x) === 14 && x.phase === 'run');
  assert.ok(has(d14, 'pc2'));
  assert.deepEqual(runEntry(d14).kept.find((k) => k.name === 'pc2').state, 'refresh');
  assert.ok(!runEntry(d14).kept.some((k) => k.name === 'fs1'), 'a static record is not an aging record');
});

test('T4: a run at exactly canScavengeAfter skips the zone', () => {
  assert.equal(logic.zoneBlocks(ZONE, 7 * H), 'notYet');
  assert.equal(logic.zoneBlocks(ZONE, 7 * H + 1), null);
  const s = run({});
  assert.equal(runEntry(s.find((x) => day(x) === 7 && x.phase === 'run')).skipped, 'notYet');
  assert.equal(runEntry(s.find((x) => day(x) === 14 && x.phase === 'run')).skipped, null);
});

test('T5: an address change at a refresh time is one update', () => {
  const s = run({ scenario: 'move', until: 14 });
  const d3 = s.find((x) => day(x) === 3);
  assert.deepEqual(d3.log.filter((e) => e.name === 'pc1' && e.k !== 'ignored').map((e) => e.k), ['update']);
  assert.equal(d3.hist.filter((h) => h.at === 3 * H).length, 1);
  assert.ok(!d3.log.some((e) => e.k === 'ignored' && e.last === 3 * H), 'no separate refresh at the change');
});

// ── rules ──

test('rule 1: a static record has no timestamp, is never stale and survives every run', () => {
  const fs1 = Object.assign(logic.rec('fs1', '10.0.0.20', null, null), { static: true });
  assert.equal(logic.ages(fs1), false);
  assert.equal(logic.isStale(fs1, ZONE, 1000 * H), false);
  assert.equal(logic.stateOf(fs1, ZONE, 1000 * H), 'static');
  assert.equal(logic.refresh(fs1, ZONE, 1000 * H).accepted, false);
  const s = run({ scenario: 'printer', noRefresh: 1, refresh: 1, period: 1, until: 8 });
  assert.ok(s.every((x) => has(x, 'fs1')));
});

test('rule 1: the admin\'s record with "delete when stale" ages from its creation and is never refreshed', () => {
  const s = run({ scenario: 'static' });
  assert.equal(logic.find(s[1].records, 'old-nas').timestamp, 0);
  assert.ok(s.every((x) => !x.hist.some((h) => h.name === 'old-nas' && h.kind === 'refresh')));
  const last = s[s.length - 1];
  assert.equal(day(last), 21);
  assert.deepEqual(runEntry(last).deleted.map((d) => d.name), ['old-nas']);
  assert.ok(has(last, 'fs1') && has(last, 'pc1'));
});

test('rule 2: refreshes inside the no-refresh interval leave the timestamp; the first one after it moves it', () => {
  const s = run({});
  const d1 = s.find((x) => day(x) === 1);
  assert.equal(logic.find(d1.records, 'pc1').timestamp, 0);
  assert.deepEqual(d1.log.find((e) => e.k === 'ignored' && e.name === 'pc1'), { k: 'ignored', name: 'pc1', count: 1, first: 24, last: 24, until: 7 * H });
  const d7 = s.find((x) => day(x) === 7 && x.phase === 'clients');
  assert.equal(logic.find(d7.records, 'pc1').timestamp, 7 * H);
  assert.equal(d7.log.find((e) => e.k === 'ignored').count, 5); // days 2–6
  assert.deepEqual(s.filter((x) => x.log.some((e) => e.k === 'refresh' && e.name === 'pc1')).map(day), [7, 14, 21]);
});

test('rule 2 uses the no-refresh interval, not the refresh interval', () => {
  const z = Object.assign({}, ZONE, { noRefresh: 2 * H, refresh: 5 * H });
  assert.equal(logic.refresh(r0(0), z, 2 * H).accepted, true);
  assert.equal(logic.refresh(r0(0), z, 2 * H - 1).accepted, false);
  const s = run({ noRefresh: 3, refresh: 10, until: 12 });
  assert.deepEqual(s.filter((x) => x.log.some((e) => e.k === 'refresh' && e.name === 'pc1')).map(day), [3, 6, 9, 12]);
});

test('the fields the captions read', () => {
  const s = run({});
  const d7c = s.find((x) => day(x) === 7 && x.phase === 'clients');
  assert.deepEqual(d7c.log.find((e) => e.k === 'refresh'), { k: 'refresh', name: 'pc1', prevTs: 0, ts: 7 * H });
  assert.deepEqual(d7c.log.find((e) => e.k === 'ignored'), { k: 'ignored', name: 'pc1', count: 5, first: 2 * H, last: 6 * H, until: 7 * H });
  const d7r = s.find((x) => day(x) === 7 && x.phase === 'run');
  assert.equal(runEntry(d7r).canScavengeAfter, 7 * H);
  assert.deepEqual([d7r.server.lastRun, d7r.server.nextRun], [7 * H, 14 * H]);
  const d14r = s.find((x) => day(x) === 14 && x.phase === 'run');
  assert.deepEqual(runEntry(d14r).kept, [
    { name: 'pc1', ts: 14 * H, staleAfter: 28 * H, state: 'noRefresh' },
    { name: 'pc2', ts: 0, staleAfter: 14 * H, state: 'refresh' }]);
  assert.deepEqual(runEntry(s.at(-1)).deleted, [{ name: 'pc2', ts: 0, staleAfter: 14 * H }]);
  assert.deepEqual(s[1].records.map((r) => r.source), ['static', 'client', 'client']);
  assert.equal(run({ scenario: 'printer' })[1].records[1].source, 'dhcp');
  assert.equal(run({ scenario: 'static' })[1].records[1].source, 'manual');
  // ip-change: the refresh on day 7 is ignored, until day 10
  const ip = run({ scenario: 'move', until: 14 }).find((x) => day(x) === 7);
  assert.deepEqual(ip.log.find((e) => e.k === 'ignored'), { k: 'ignored', name: 'pc1', count: 4, first: 4 * H, last: 7 * H, until: 10 * H });
  const up = run({ scenario: 'move', until: 14 }).find((x) => day(x) === 3).log.find((e) => e.k === 'update');
  assert.deepEqual(up, { k: 'update', name: 'pc1', from: '10.0.0.51', data: '10.0.1.23', prevTs: 0, ts: 3 * H });
});

test('rule 3: an update inside the no-refresh interval sets the timestamp at once', () => {
  assert.equal(logic.update(r0(0), '10.0.1.23', 3 * H).timestamp, 3 * H);
  const s = run({ scenario: 'move', until: 14 });
  const d3 = s.find((x) => day(x) === 3);
  assert.equal(logic.find(d3.records, 'pc1').data, '10.0.1.23');
  assert.equal(logic.find(d3.records, 'pc1').timestamp, 3 * H);
  // day 7: its refresh is ignored (3 + 7 = 10); day 10: accepted
  assert.ok(s.find((x) => day(x) === 7).log.some((e) => e.k === 'ignored' && e.until === 10 * H));
  const d10 = s.find((x) => day(x) === 10);
  assert.equal(logic.find(d10.records, 'pc1').timestamp, 10 * H);
  assert.deepEqual(s.map(day), [0, 0, 3, 7, 10, 14]);
});

test('rule 4: stale is strictly after ts + noRefresh + refresh, with the zone\'s own intervals', () => {
  const z = Object.assign({}, ZONE, { noRefresh: 2 * H, refresh: 3 * H });
  assert.equal(logic.staleAfter(r0(H), z), 6 * H);
  assert.equal(logic.stateOf(r0(H), z, 2 * H), 'noRefresh');
  assert.equal(logic.stateOf(r0(H), z, 3 * H), 'refresh');
  assert.equal(logic.stateOf(r0(H), z, 6 * H), 'refresh');
  assert.equal(logic.stateOf(r0(H), z, 6 * H + 1), 'stale');
});

test('rule 5: zone aging alone deletes nothing; runs come every period after day 0', () => {
  const s = run({ scavenging: false, until: 60 });
  assert.ok(s.every((x) => x.phase !== 'run'));
  const last = s[s.length - 1];
  assert.equal(last.phase, 'end');
  assert.equal(day(last), 60);
  assert.ok(has(last, 'pc2'));
  assert.equal(logic.stateOf(logic.find(last.records, 'pc2'), last.zone, last.t), 'stale');
  assert.deepEqual(run({ period: 3, until: 21 }).filter((x) => x.phase === 'run').map(day), [3, 6, 9, 12, 15, 18, 21]);
  assert.equal(logic.isRun(P({ period: 3 }), 0), false);
});

test('rule 5: nothing but a run deletes, even long after a record is stale', () => {
  const s = run({ period: 7, until: 20 });
  assert.ok(s.slice(1).every((x) => has(x, 'pc2'))); // stale since day 14, the next run is on day 21
});

test('rule 6: canScavengeAfter = aging enabled (0) + refresh; aging off skips every run', () => {
  assert.equal(at({ refresh: 5 }, 0).zone.canScavengeAfter, 5 * H);
  const s = run({ aging: false, until: 28 });
  assert.ok(s.filter((x) => x.phase === 'run').every((x) => runEntry(x).skipped === 'aging'));
  assert.ok(has(s[s.length - 1], 'pc2'));
  // a short period: runs before the zone may be scavenged skip it
  const q = run({ period: 2, refresh: 7, until: 10 });
  assert.deepEqual(q.filter((x) => x.phase === 'run').map((x) => [day(x), runEntry(x).skipped]),
    [[2, 'notYet'], [4, 'notYet'], [6, 'notYet'], [8, null], [10, null]]);
  assert.equal(runEntry(q.find((x) => day(x) === 2 && x.phase === 'run')).canScavengeAfter, 7 * H);
});

test('rule 7: the defaults are 7/7/7, aging and scavenging on', () => {
  const d = logic.defaults;
  assert.deepEqual([d.noRefresh, d.refresh, d.period, d.aging, d.scavenging], [7, 7, 7, true, true]);
});

test('rule 8: clients refresh every 24 h, DHCP records every half lease, the admin\'s never', () => {
  assert.equal(logic.everyOf('client', P({})), 24);
  assert.equal(logic.everyOf('dhcp', P({ lease: 8 })), 96);
  assert.equal(logic.everyOf('dhcp', P({ lease: 1 })), 12);
  assert.equal(logic.everyOf('manual', P({})), null);
  assert.deepEqual(logic.times(P({ scenario: 'printer', scavenging: false, until: 8 })), [0, 96, 192]);
  // a client that left sends nothing
  const s = run({ until: 21 });
  assert.ok(s.every((x) => !x.hist.some((h) => h.name === 'pc2' && h.at > 0 && h.kind !== 'delete')));
});

test('rule 9: safe when refresh is at least the longest client refresh period', () => {
  assert.equal(logic.longestPeriod(P({ scenario: 'printer', lease: 8 })), 96);
  assert.equal(logic.safe(P({ scenario: 'printer', lease: 8, refresh: 1 })), false);
  assert.equal(logic.safe(P({ scenario: 'printer', lease: 8, refresh: 4 })), true);
  assert.equal(logic.safe(P({ scenario: 'printer', lease: 1, refresh: 1 })), true);
  assert.equal(logic.safe(P({ scenario: 'leaver', refresh: 1 })), true);
  assert.equal(logic.longestPeriod(P({ scenario: 'static' })), 24);
});

test('rule 10: a scavenged record comes back at its client\'s next refresh, with a new timestamp', () => {
  const s = run({ scenario: 'printer', noRefresh: 1, refresh: 1, period: 1, until: 8 });
  const d4 = s.find((x) => day(x) === 4 && x.phase === 'clients');
  const e = d4.log.find((x) => x.k === 'create');
  assert.deepEqual([e.name, e.again, e.ts], ['prn4', true, 4 * H]);
  assert.equal(s[1].log.find((x) => x.k === 'create').again, false);
});

test('rule 11: with aging off timestamps still move by rule 2', () => {
  const s = run({ aging: false, until: 21 });
  assert.deepEqual(s.filter((x) => x.log.some((e) => e.k === 'refresh')).map(day), [7, 14, 21]);
});

test('deletionAt: the first run strictly after both the stale point and canScavengeAfter', () => {
  const p = P({});
  assert.equal(logic.deletionAt(r0(0), ZONE, p), 21 * H);
  assert.equal(logic.deletionAt(r0(H), ZONE, p), 21 * H);
  assert.equal(logic.deletionAt(r0(7 * H), ZONE, p), 28 * H);
  const z1 = Object.assign({}, ZONE, { noRefresh: H, refresh: H, canScavengeAfter: H });
  assert.equal(logic.deletionAt(r0(0), z1, P({ period: 1 })), 3 * H);
  assert.equal(logic.deletionAt(r0(0), z1, P({ period: 1, scavenging: false })), null);
  assert.equal(logic.deletionAt(r0(0), Object.assign({}, ZONE, { aging: false }), p), null);
  // the forecast agrees with the run
  const s = run({});
  assert.equal(logic.deletionAt(logic.find(s[2].records, 'pc2'), s[2].zone, P({})), 21 * H);
});

test('scavenge() is pure and splits kept from deleted', () => {
  const recs = [r0(0), Object.assign(logic.rec('pc2', '10.0.0.52', null, 10 * H), {})];
  const copy = structuredClone(recs);
  const out = logic.scavenge(recs, ZONE, 15 * H);
  assert.deepEqual(out.deleted.map((r) => r.name), ['pc1']);
  assert.deepEqual(out.kept.map((r) => r.name), ['pc2']);
  assert.deepEqual(recs, copy);
});

test('step 0 is day 0 before anything: only the static record', () => {
  const s = at({}, 0);
  assert.equal(s.t, 0);
  assert.equal(s.phase, 'start');
  assert.deepEqual(s.records.map((r) => r.name), ['fs1']);
});

test('records stay sorted by name and changed lists what moved', () => {
  const s = run({ scenario: 'static' });
  assert.deepEqual(s[1].records.map((r) => r.name), ['fs1', 'old-nas', 'pc1']);
  assert.deepEqual(s[1].changed, ['old-nas', 'pc1']);
  assert.deepEqual(s[s.length - 1].changed, ['old-nas']);
});

test('at most 20 steps; a capped run says so on its last step', () => {
  const p = P({ scenario: 'printer', noRefresh: 1, refresh: 1, period: 1, lease: 1, until: 60 });
  assert.equal(logic.steps(p), 20);
  assert.equal(kit.stateAt(logic, p, 20).capped, true);
  assert.equal(kit.stateAt(logic, P({}), 8).capped, false);
});

test('an end moment only when the last moment is before day until', () => {
  assert.equal(run({}).at(-1).phase, 'run'); // day 21 run is the last
  const s = run({ until: 25 });
  assert.equal(s.at(-1).phase, 'end');
  assert.equal(day(s.at(-1)), 25);
});

// ── presets (SPEC.md, "Presets and expected numbers") ──

test('presets: steps and the key numbers', () => {
  const cases = {
    defaults: [{}, 8],
    'too-aggressive': [{ scenario: 'printer', noRefresh: 1, refresh: 1, period: 1, lease: 8, until: 8 }, 11],
    'static-survives': [{ scenario: 'static' }, 7],
    'aging-only': [{ scavenging: false, until: 60 }, 11],
    'ip-change': [{ scenario: 'move', until: 14 }, 5]
  };
  for (const [id, [over, n]] of Object.entries(cases)) assert.equal(logic.steps(P(over)), n, id);
  // defaults: pc2 deleted on day 21, 20 days after it left
  const d = run({});
  assert.deepEqual(d.filter((x) => x.phase === 'run').map((x) => [day(x), runEntry(x).deleted.map((e) => e.name)]),
    [[7, []], [14, []], [21, ['pc2']]]);
  // too-aggressive: missing day 3–4 and 7–8
  const t = run(cases['too-aggressive'][0]);
  assert.deepEqual(t.filter((x) => x.changed.includes('prn4')).map((x) => [day(x), x.phase]),
    [[0, 'clients'], [3, 'run'], [4, 'clients'], [7, 'run'], [8, 'clients']]);
  assert.equal(logic.steps(P({ scenario: 'printer', noRefresh: 1, refresh: 1, period: 1, lease: 1, until: 8 })), 17);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { scenario: 'printer', noRefresh: 1, refresh: 1, period: 1 }, { scenario: 'move' }]) {
    for (const s of run(over)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ scenario: 'static', period: 3, until: 30 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = kit.stateAt(logic, p, 3);
  const copy = structuredClone(s0);
  logic.step(s0, 4, p);
  assert.deepEqual(s0, copy);
});

test('every combination of params runs to its last step without errors', () => {
  for (const scenario of logic.SCENARIO_IDS) {
    for (const nr of [1, 7, 14]) for (const rf of [1, 7, 14]) for (const period of [1, 7]) {
      for (const flags of [[true, true], [false, true], [true, false], [false, false]]) {
        const p = P({ scenario, noRefresh: nr, refresh: rf, period, scavenging: flags[0], aging: flags[1], until: 60 });
        const n = logic.steps(p);
        assert.ok(n >= 1 && n <= 20, `${JSON.stringify(p)}: ${n}`);
        kit.stateAt(logic, p, n);
      }
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
