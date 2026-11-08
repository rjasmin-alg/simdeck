// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for slo-error-budget's model (rules in SPEC.md). Run: node --test sims/slo-error-budget/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const inc = (startDay, durationMin, errorRatePct) => ({ startDay, durationMin, errorRatePct });
const run = (incidents, at, over) => logic.compute(P(Object.assign({ incidents, at }, over)));
const preset = (id) => P(logic.presets.find((x) => x.id === id).params);
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const D = logic.DAY;

// ── tie-breaks first (rule 5) ──

test('tie-break: a burn rate exactly at 14.4 fires the fast page; one bp less does not', () => {
  const at = 2 * D + 60;
  const s = run([inc(2, 60, 1.44)], at);                    // 144 bp for 60 min = burn 14.4 over 1 h and 5 min
  near(s.burn.w1h, 14.4);
  near(s.burn.w5m, 14.4);
  assert.equal(s.alerts.fast, true);
  assert.deepEqual(s.lit.fast, [[at, at + 1]]);             // on at that one instant
  const under = run([inc(2, 60, 1.43)], at);
  assert.equal(under.alerts.fast, false);
  assert.deepEqual(under.lit.fast, []);
});

test('tie-break: exactly 6 over 6 h and 30 min fires the slow page; exactly 1 over 3 d and 6 h fires the ticket', () => {
  const slow = run([inc(1, 360, 0.6)], D + 360);            // 60 bp = 6 × 10 bp
  near(slow.burn.w6h, 6);
  assert.equal(slow.alerts.slow, true);
  assert.equal(run([inc(1, 360, 0.5)], D + 360).alerts.slow, false);
  const ticket = run([inc(0, 4320, 0.1)], 3 * D);           // 10 bp = burn 1, the 3-day window full
  near(ticket.burn.w3d, 1);
  near(ticket.burn.w6h, 1);
  assert.equal(ticket.alerts.ticket, true);
  assert.equal(ticket.firstFired.ticket, 3 * D);            // the 3-day window reaches burn 1 only when full
  assert.equal(run([inc(0, 4320, 0.05)], 3 * D).alerts.ticket, false);
});

test('tie-break: the budget is exhausted at the instant the errors reach it exactly', () => {
  const s = run([inc(0, 4320, 1)], 0, { slo: 99.9 });  // 100 bp × 4320 min = 432 000 = the budget
  assert.equal(s.exhaustedAt, 4320);
  near(s.usedMin, 43.2);
  near(s.remainingPct, 0);
  assert.equal(run([inc(0, 4319, 1)], 0).exhaustedAt, null);
});

// ── the rules ──

test('rule 1: error budget = (1 − SLO) × 30 days', () => {
  near(run([], 0, { slo: 99.9 }).budgetMin, 43.2);
  near(run([], 0, { slo: 99 }).budgetMin, 432);
  near(run([], 0, { slo: 99.5 }).budgetMin, 216);
  near(run([], 0, { slo: 99.99 }).budgetMin, 4.32);
  assert.equal(logic.allowedBp(99.9), 10);
  assert.equal(logic.allowedBp(99.99), 1);
});

test('rule 2: burn rate = window error rate / (1 − SLO); burn 1 spends the budget over the window', () => {
  near(logic.burnAt([inc(0, 60, 0.1)], 99.9, 60, 60), 1);
  near(logic.burnAt([inc(0, 60, 1.44)], 99.9, 60, 60), 14.4);
  near(logic.burnAt([inc(0, 60, 1.44)], 99, 60, 60), 1.44);           // a looser SLO burns slower
  const month = run([inc(0, 43200, 0.1)], logic.T);
  near(month.usedPct, 100);                                             // burn 1 all month = exactly the budget
  near(run([inc(0, 60, 1.44)], 60).usedPct, 2);                         // burn 14.4 for 1 h = 2 %
});

test('rule 2: a window reaching back before day 0 counts zeros there', () => {
  const s = run([inc(0, 43200, 0.2)], 60);
  near(s.burn.w1h, 2);
  near(s.burn.w3d, 2 * 60 / 4320);
});

test('rule 3: the fast page needs both 1 h and 5 min; the 5 min window ends it 5 min after the problem', () => {
  const s = logic.compute(preset('blip'));                 // 2 min at 100 % from day 5 12:00
  const t0 = 5.5 * D;
  assert.deepEqual(s.lit.fast, [[t0 + 1, t0 + 7]]);        // on 1 min in; off 5 min after the blip ended
  assert.equal(s.alerts.fast, false);                       // at t0 + 7
  near(s.burn.w1h, 100 / 3);                                // the long window alone would still page
  assert.equal(s.burn.w5m, 0);
  // the long window alone is not enough: a 5-min window over 14.4 without the hour does not page
  const short = run([inc(3, 5, 0.5)], 3 * D + 5);           // 50 bp × 5 min: 5 min burn 5, 1 h burn 0.42
  assert.equal(short.alerts.fast, false);
});

test('rule 3: slow page (6 h + 30 min) and ticket (3 d + 6 h) follow their own windows', () => {
  const s = run([inc(4, 360, 1)], 4 * D + 360);             // 100 bp for 6 h: burn 10
  assert.equal(s.alerts.slow, true);
  assert.equal(s.alerts.fast, false);                        // 10 < 14.4
  // on once the 6 h window holds 216 min of errors (6 × 360 × 10 bp·min at 100 bp); off once the 30 min window
  // holds under 18 (6 × 30 × 10 / 100): 13 min after the incident ends, not 30
  assert.deepEqual(s.lit.slow, [[4 * D + 216, 4 * D + 373]]);
  const sb = logic.compute(preset('slow-burn'));
  assert.deepEqual(sb.lit.fast, []);
  assert.deepEqual(sb.lit.slow, []);
  assert.deepEqual(sb.lit.ticket, [[2160, logic.T + 1]]);    // day 1.5, when the 3-day window is half full
});

test('rule 4: budget used by an incident = error rate × duration; overlaps add, capped at 100 %', () => {
  const s = run([inc(1, 20, 100), inc(2, 60, 1.44)], 0);
  near(s.incidents[0].usedMin, 20);
  near(s.incidents[1].usedMin, 0.864);
  near(s.usedMin, 20.864);
  const o = run([inc(1, 10, 60), inc(1, 10, 60)], 0);        // 120 % for 10 min, capped at 100 %
  near(o.usedMin, 10);
  near(o.incidents[0].usedMin + o.incidents[1].usedMin, 12);
  const clipped = run([inc(29.5, 1440, 100)], 0);             // runs past day 30: clipped
  near(clipped.usedMin, 720);
  near(clipped.incidents[0].usedMin, 720);
  assert.equal(clipped.incidents[0].end, logic.T);
});

test('rule 3: each alert\'s short window decides when it stops (outage: 5 min, 30 min, 6 h after the end)', () => {
  const o = logic.compute(preset('outage-20min'));          // 100 % from 15 120 to 15 140
  assert.deepEqual(o.lit.fast, [[15121, 15145]]);
  assert.deepEqual(o.lit.slow, [[15123, 15170]]);
  assert.deepEqual(o.lit.ticket, [[15125, 15500]]);
  // a ticket after a 3-day incident at burn 2: the 6 h window ends it once it holds under 180 min of errors
  const t = run([inc(0, 4320, 0.2)], 0);
  assert.deepEqual(t.lit.ticket, [[2160, 4501]]);
});

test('the budget so far, what is left, and the hourly bars', () => {
  const o = logic.compute(Object.assign(preset('outage-20min'), { at: 15130 }));
  near(o.usedAtMin, 10);
  near(o.remainingAtPct, 100 - 100 * 10 / 43.2);
  const sb = preset('slow-burn');
  near(logic.compute(sb).remainingAtPct, 0);                 // day 15: all gone
  near(logic.compute(Object.assign({}, sb, { at: 7.5 * D })).remainingAtPct, 50);
  assert.equal(logic.compute(sb).remainingPct, 0);           // 200 % used: what is left stops at 0
  near(logic.compute(sb).usedPct, 200);
  const b = logic.compute(preset('blip'));
  assert.equal(b.hourly.length, 720);
  near(b.hourly[132], 2 * 10000 / 60);                        // day 5 12:00 is hour 132: mean bp of that hour
  assert.equal(b.hourly[131], 0);
  assert.equal(b.hourly[133], 0);
});

test('inputs: starts round to the minute, a start before day 0 is clipped, rates cap at 100 %, the cursor is clamped', () => {
  assert.equal(logic.norm(inc(1 + 0.6 / D, 10, 1)).start, D + 1);
  assert.deepEqual(logic.norm(inc(-1, 1440, 100)), { start: 0, end: 0, bp: 10000 });
  assert.deepEqual(logic.norm(inc(-0.5, 1440, 100)), { start: 0, end: 720, bp: 10000 });
  near(run([inc(1, 10, 150)], 0).usedMin, 10);
  assert.equal(run([inc(1, 10, 150)], 0).incidents[0].bp, 10000);
  assert.equal(run([], -5).at, 0);
  assert.equal(run([], 1e9).at, logic.T);
});

test('presets: the task\'s numbers', () => {
  const o = logic.compute(preset('outage-20min'));
  near(o.usedPct, 100 * 20 / 43.2);
  near(o.burn.w1h, 1000 / 3);
  assert.equal(o.alerts.fast, true);
  const f = logic.compute(preset('fast-burn'));
  near(f.burn.w1h, 14.4);
  near(f.usedPct, 2);
  assert.equal(f.alerts.fast, true);
  const sb = logic.compute(preset('slow-burn'));
  near(sb.burn.w3d, 2);
  assert.equal(sb.exhaustedAt, 15 * D);
  assert.equal(sb.alerts.ticket, true);
  const b = logic.compute(preset('blip'));
  near(b.peak.w1h, 100 / 3);
  near(b.peak.w5m, 400);
  near(b.usedPct, 100 * 2 / 43.2);
  assert.deepEqual(b.lit.slow, []);
  const u = logic.compute(preset('under-the-radar'));
  near(u.burn.w3d, 0.5);
  near(u.usedPct, 50);
  for (const id of logic.ALERT_IDS) assert.deepEqual(u.lit[id], []);
});

test('captions: the key each preset calls for', () => {
  const key = (id) => logic.captionKey(logic.compute(preset(id)));
  assert.deepEqual(key('outage-20min'), { key: 'page', alert: 'fast' });
  assert.deepEqual(key('fast-burn'), { key: 'page', alert: 'fast' });
  assert.deepEqual(key('slow-burn'), { key: 'slowBurn', alert: 'ticket' });
  assert.deepEqual(key('blip'), { key: 'cleared', alert: 'fast' });
  assert.deepEqual(key('under-the-radar'), { key: 'quiet' });
  assert.deepEqual(logic.captionKey(run([], 0)), { key: 'empty' });
  assert.deepEqual(logic.captionKey(run([inc(1, 20, 100)], 3 * D)), { key: 'after' });
  assert.deepEqual(logic.captionKey(run([inc(1, 20, 100), inc(2, 43200, 0.5)], 0)), { key: 'exhausted' });
  assert.deepEqual(logic.captionKey(run([inc(0, 4320, 0.1)], 3 * D)), { key: 'ticket', alert: 'ticket' });
  assert.equal(logic.firstAlert(logic.compute(preset('outage-20min'))), 'fast');
  // a page fired, the budget is exhausted, and the ticket is on at the cursor: the ticket caption comes first
  assert.deepEqual(logic.captionKey(run([inc(1, 20, 100), inc(2, 43200, 0.5)], 10 * D)), { key: 'ticket', alert: 'ticket' });
  // on a tie the most severe alert is the first
  assert.equal(logic.firstAlert({ firstFired: { fast: 5, slow: 5, ticket: 5 } }), 'fast');
  assert.equal(logic.firstAlert({ firstFired: { fast: null, slow: 9, ticket: 9 } }), 'slow');
  assert.equal(logic.firstAlert({ firstFired: { fast: null, slow: null, ticket: null } }), null);
});

test('changed lamps: the alerts whose state differs from the previous state', () => {
  const a = logic.compute(preset('blip'));
  const b = logic.compute(Object.assign(preset('blip'), { at: 5.5 * D + 3 }));
  assert.deepEqual(logic.changedAlerts(a, b), ['fast']);
  assert.deepEqual(logic.changedAlerts(null, b), []);
  assert.deepEqual(logic.changedAlerts(a, a), []);
});

test('editor: mirror and applyEdit round-trip; addIncident starts at the cursor\'s hour, at most six', () => {
  const p = P({ incidents: [inc(10.5, 20, 100)], sel: 0 });
  const m = logic.mirror(p.incidents, 0);
  assert.deepEqual(m, { iStart: 252, iDur: logic.DURATIONS.indexOf(20), iRate: logic.RATES.indexOf(100) });
  assert.deepEqual(logic.applyEdit(Object.assign({}, p, m)), p.incidents);
  const moved = logic.applyEdit(Object.assign({}, p, m, { iStart: 24 }));
  assert.equal(moved[0].startDay, 1);
  assert.equal(p.incidents[0].startDay, 10.5, 'input kept');
  assert.deepEqual(logic.mirror(p.incidents, 3), {});
  const added = logic.addIncident(P({ incidents: [], at: 2 * D + 105 }));   // hour 49.75 → 49 (floor), not 50
  assert.deepEqual(added, [inc(49 / 24, 30, 10)]);
  assert.deepEqual(logic.addIncident(P({ incidents: [], at: logic.T })), [inc(719 / 24, 30, 10)]);
  assert.equal(logic.mirror([inc(29.99, 10, 1)], 0).iStart, 719);         // clamped to the last hour
  assert.equal(logic.mirror([inc(1 + 0.6 / 24, 10, 1)], 0).iStart, 25);   // rounded to the nearest hour
  const six = Array.from({ length: 6 }, () => inc(0, 1, 1));
  assert.equal(logic.addIncident(P({ incidents: six })).length, 6);
  for (const pr of logic.presets) for (const x of pr.params.incidents) {
    const mm = logic.mirror([x], 0);
    assert.equal(logic.DURATIONS[mm.iDur], x.durationMin, `${pr.id}: duration on a stop`);
    assert.equal(logic.RATES[mm.iRate], x.errorRatePct, `${pr.id}: rate on a stop`);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and a pure function of the params', () => {
  for (const pr of logic.presets) {
    const p = preset(pr.id);
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(logic.compute(p), s);
  }
});

test('compute does not mutate its input', () => {
  const p = preset('outage-20min');
  const copy = structuredClone(p);
  logic.compute(p);
  logic.applyEdit(p);
  logic.addIncident(p);
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined, 'an explorer has no steps');
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const ids = meta.entries.map((e) => e.preset);
  assert.deepEqual(ids, logic.presets.map((x) => x.id), 'sim.json entries list the presets in order');
});
