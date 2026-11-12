// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-timers-cron. Run: node --test sims/lnx-timers-cron/sim.test.js
// Rules and numbers: SPEC.md. Tie-breaks first, then one test per rule, then the presets' numbers, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const { D, HOUR, DAY } = logic;
const P = (over) => Object.assign({}, logic.defaults, over);
const preset = (id, over) => P(Object.assign({}, logic.PRESETS.find((x) => x.id === id).params, over));
const end = (p) => kit.stateAt(logic, p, logic.steps(p));
const cron = (s) => logic.job(s, 'cron');
const timer = (s) => logic.job(s, 'timer');
const times = (list) => list.map((x) => (typeof x === 'number' ? x : x.t));
/** Every state of a run, step 0 … end. */
function all(p) {
  const out = [logic.initial(p)];
  for (let n = 1; n <= logic.steps(p); n++) out.push(logic.step(out[n - 1], n, p));
  return out;
}
/** The state right after the event at time x. */
const after = (p, x) => all(p).find((s) => s.now === x);

// ── tie-breaks ──

test('tie-break (rule 7): a boot exactly at the scheduled minute counts as on: both run normally, no catch-up', () => {
  const p = P({ offFrom: String(D(1, 22)), offTo: String(D(2, 3, 30)) }); // up again Wed 03:30
  const s = after(p, D(2, 3, 30));
  assert.equal(s.last.boot, true);
  assert.equal(s.last.cron, 'run');
  assert.equal(s.last.timer, 'run');
  assert.equal(timer(s).runs.at(-1).catchup, false);
  assert.deepEqual(cron(s).missed, []);
  assert.deepEqual(timer(s).missed, []);
  assert.equal(logic.steps(p), 8, 'boot and tick are one event');
});

test('tie-break (rule 7): a shutdown exactly at the scheduled minute counts as off: missed', () => {
  const p = P({ offFrom: String(D(2, 3, 30)), offTo: String(D(2, 8)) }); // off Wed 03:30
  const s = after(p, D(2, 3, 30));
  assert.equal(s.last.shutdown, true);
  assert.equal(s.last.cron, 'missed');
  assert.equal(s.last.timer, 'missed');
  const b = after(p, D(2, 8));
  assert.equal(b.last.timer, 'catchup');
});

test('tie-break (rule 2): only one of day-of-month and day-of-week restricted → both must match (AND)', () => {
  const dom = { kind: 'cron', min: 0, hour: 3, dom: [1], mon: null, dow: null };
  const dow = { kind: 'cron', min: 0, hour: 3, dom: null, mon: null, dow: [1] };
  const both = { kind: 'cron', min: 0, hour: 3, dom: [1], mon: null, dow: [1] };
  // day 1 = Tue 2026-09-01, day 7 = Mon 2026-09-07
  assert.equal(logic.cronDayMatches(dom, 1), true);
  assert.equal(logic.cronDayMatches(dom, 7), false);
  assert.equal(logic.cronDayMatches(dow, 1), false);
  assert.equal(logic.cronDayMatches(dow, 7), true);
  assert.equal(logic.cronDayMatches(both, 1), true, 'OR: the 1st, a Tuesday');
  assert.equal(logic.cronDayMatches(both, 7), true, 'OR: a Monday, not the 1st');
  assert.equal(logic.cronDayMatches(both, 2), false);
  // Sunday is 0 or 7
  assert.equal(logic.cronDayMatches({ kind: 'cron', min: 0, hour: 0, dom: null, mon: null, dow: [7] }, 6), true);
  assert.equal(logic.cronDayMatches({ kind: 'cron', min: 0, hour: 0, dom: null, mon: null, dow: [0] }, 6), true);
});

test('tie-break: a catch-up at a boot that falls on a scheduled time is one run, not two', () => {
  const p = P({ offFrom: String(D(1, 22)), offTo: String(D(3, 3, 30)) }); // off Tue 22:00 → Thu 03:30
  const s = after(p, D(3, 3, 30));
  const runs = timer(s).runs.filter((r) => r.t === D(3, 3, 30));
  assert.equal(runs.length, 1);
  assert.equal(runs[0].catchup, true);
  assert.deepEqual(runs[0].covers, [D(2, 3, 30)]);
  assert.deepEqual(timer(s).absorbed, [D(3, 3, 30)]);
  assert.equal(s.last.cron, 'run', 'cron runs Thu 03:30 normally (rule 7)');
});

// ── rules ──

test('rule 1: cron never runs a time missed while the machine was off', () => {
  const s = end(preset('book-arhiva'));
  assert.deepEqual(times(cron(s).missed), [D(2, 3, 30)]);
  assert.deepEqual(times(cron(s).runs), [0, 1, 3, 4, 5, 6].map((d) => D(d, 3, 30)));
  assert.equal(cron(after(preset('book-arhiva'), D(2, 8))).runs.length, 2, 'nothing at boot');
});

test('rule 2: 0 3 1 * 1 over September 2026: runs on the 1st (a Tuesday) and on 7, 14, 21, 28', () => {
  const p = preset('cron-or-trap');
  const s = end(p);
  assert.deepEqual(times(cron(s).runs), [1, 7, 14, 21, 28].map((d) => D(d, 3)));
  assert.deepEqual(times(cron(s).runs).map((x) => logic.civil(logic.dayOf(x)).dom), [1, 7, 14, 21, 28]);
  assert.equal(logic.steps(p), 5);
});

test('rule 3: calendar expressions: Mon..Fri 03:30, daily 00:00, weekday AND date', () => {
  const sc = logic.SCENES;
  assert.deepEqual(logic.ticksIn(sc.arhiva.timer, 0, D(7)), [0, 1, 2, 3, 4].map((d) => D(d, 3, 30)));
  assert.deepEqual(logic.ticksIn(sc.daily.timer, D(3, 12), D(7, 12)), [4, 5, 6, 7].map((d) => D(d)));
  // `Mon *-*-01 03:00:00`: no elapse in September 2026; the next is Mon 2027-02-01 (systemd-analyze calendar)
  assert.deepEqual(logic.ticksIn(sc['cron-or'].timer, D(1), D(31)), []);
  assert.equal(logic.stamp(logic.nextTick(sc['cron-or'].timer, D(1))), 'Mon 2027-02-01 03:00:00 CET');
  assert.equal(logic.stamp(logic.prevTick(sc['cron-or'].timer, D(1))), 'Mon 2026-06-01 03:00:00 CEST');
  // the calendar itself
  assert.deepEqual(logic.civil(0), { y: 2026, m: 8, dom: 31, dow: 0 });
  assert.deepEqual(logic.civil(30), { y: 2026, m: 9, dom: 30, dow: 2 });
  assert.deepEqual(logic.civil(31), { y: 2026, m: 10, dom: 1, dow: 3 });
  assert.equal(logic.stamp(D(0, 1, 15)), 'Mon 2026-08-31 01:15:00 CEST');
});

test('rule 4: without Persistent= a missed elapse is not caught up, and nothing is stored', () => {
  const p = preset('no-persistent');
  const b = after(p, D(2, 8));
  assert.equal(b.last.boot, true);
  assert.equal(b.last.timer, null);
  assert.equal(timer(b).pending, null);
  assert.equal(timer(b).stamp, null);
  assert.equal(timer(b).lastTrigger, null, 'list-timers LAST is empty after the reboot');
  assert.equal(logic.listTimers(b).cells.last, '-');
  assert.equal(logic.stamp(logic.nextOf(b).at), 'Thu 2026-09-03 03:30:00 CEST');
  const s = end(p);
  assert.deepEqual(times(timer(s).runs), [0, 1, 3, 4].map((d) => D(d, 3, 30)));
  assert.deepEqual(timer(s).missed, [D(2, 3, 30)]);
});

test('rule 5: Persistent=true catches up at boot, once, however many were missed', () => {
  const b = after(preset('book-arhiva'), D(2, 8));
  assert.equal(b.last.timer, 'catchup');
  assert.equal(timer(b).runs.at(-1).t, D(2, 8));
  assert.equal(timer(b).stamp, D(2, 8), 'the record on disk moves to the catch-up run');
  const p = preset('long-weekend');
  const s = end(p);
  const catchups = timer(s).runs.filter((r) => r.catchup);
  assert.equal(catchups.length, 1);
  assert.equal(catchups[0].t, D(7, 8));
  assert.deepEqual(catchups[0].covers, [5, 6, 7].map((d) => D(d)));
  assert.deepEqual(timer(s).missed, [5, 6, 7].map((d) => D(d)));
  // while the machine is off the record stays where the last run left it
  assert.equal(timer(after(p, D(6))).stamp, D(4));
  // nothing missed since the last run → no catch-up
  const q = P({ offFrom: String(D(1, 8)), offTo: String(D(1, 18)) });
  assert.equal(after(q, D(1, 18)).last.timer, null);
});

test('rule 6: RandomizedDelaySec=1h: a new even delay below 1 h for each elapse, from the seed', () => {
  const p = preset('randomized');
  const s = end(p);
  const d = timer(s).runs.map((r) => r.delay);
  assert.deepEqual(d, [442, 3574, 2461]);
  assert.ok(d.every((x) => x >= 0 && x < HOUR));
  assert.deepEqual(times(timer(s).runs), [D(1) + 442, D(2) + 3574, D(3) + 2461]);
  assert.deepEqual(times(cron(s).runs), [1, 2, 3].map((x) => D(x)), 'cron at 00:00 exactly');
  assert.equal(logic.steps(p), 6);
  // another seed, other delays; no delay, no extra steps
  assert.notDeepEqual(timer(end(preset('randomized', { seed: 4 }))).runs.map((r) => r.delay), d);
  assert.equal(logic.steps(preset('randomized', { delay: 0 })), 3);
  // evenly distributed: the mean over many draws is near half the maximum
  let sum = 0;
  for (let k = 0; k < 2000; k++) sum += logic.delayFor(3, k * 977, HOUR);
  assert.ok(Math.abs(sum / 2000 - HOUR / 2) < 120, String(sum / 2000));
});

test('rule 6: the catch-up after boot is delayed too, from the boot time', () => {
  const p = preset('book-arhiva', { delay: HOUR });
  const b = after(p, D(2, 8));
  assert.equal(b.last.timer, 'catchup-wait');
  const dl = logic.delayFor(3, D(2, 8), HOUR);
  assert.ok(dl > 0 && dl < HOUR);
  assert.equal(timer(b).pending.at, D(2, 8) + dl);
  const r = after(p, D(2, 8) + dl);
  assert.equal(r.last.timer, 'catchup');
  assert.equal(timer(r).runs.at(-1).t, D(2, 8) + dl);
});

test('shutdown while a delayed start waits: the start is lost and the elapse counts as missed', () => {
  const p = preset('randomized');
  let s = logic.initial(p);
  s.power = [{ from: D(1, 0, 5), to: D(1, 8) }]; // off 5 minutes after Tuesday's elapse (its delay is 7 min 22 s)
  const seen = [];
  for (let n = 1; logic.nextEvent(s) != null; n++) { s = logic.step(s, n, p); seen.push(s.last); }
  const off = seen.find((e) => e.shutdown);
  assert.equal(off.lost, D(1));
  assert.ok(timer(s).missed.includes(D(1)));
  const boot = seen.find((e) => e.boot);
  assert.ok(boot.timer === 'catchup-wait' || boot.timer === 'catchup', 'Persistent= makes it up');
});

test('list-timers: systemd\'s relative times and the row', () => {
  assert.equal(logic.relative(146), '2min 26s');
  assert.equal(logic.relative(300), '5min');
  assert.equal(logic.relative(91 * 60), '1h 31min');
  assert.equal(logic.relative(10 * HOUR), '10h');
  assert.equal(logic.relative(DAY), '24h');
  assert.equal(logic.relative(DAY + HOUR), '1 day 1h');
  assert.equal(logic.relative(2 * DAY), '2 days');
  assert.equal(logic.relative(80 * DAY + 7 * HOUR), '2 months 19 days');
  assert.equal(logic.relative(0), 'now');
  const s = after(preset('book-arhiva'), D(2, 8));
  const lt = logic.listTimers(s);
  assert.equal(lt.cells.next, 'Thu 2026-09-03 03:30:00 CEST');
  assert.equal(lt.cells.left, '19h');
  assert.equal(lt.cells.last, 'Wed 2026-09-02 08:00:00 CEST');
  assert.equal(lt.cells.passed, 'now');
  assert.match(lt.head, /^NEXT +LEFT LAST +PASSED UNIT +ACTIVATES$/);
  const m = end(preset('cron-or-trap'));
  assert.equal(logic.listTimers(m).cells.next, 'Mon 2027-02-01 03:00:00 CET');
  assert.equal(logic.listTimers(m).cells.last, 'Mon 2026-06-01 03:00:00 CEST');
});

test('tie-break: a scheduled time while a delayed catch-up still waits is absorbed: one run', () => {
  const p = P({ offFrom: String(D(1, 22)), offTo: String(D(3, 3, 30)), delay: HOUR }); // back Thu 03:30, 1h delay
  const b = after(p, D(3, 3, 30));
  assert.equal(b.last.boot, true);
  assert.equal(b.last.timer, 'catchup-wait');
  assert.equal(b.last.absorbed, true);
  assert.deepEqual(timer(b).absorbed, [D(3, 3, 30)]);
  const dl = logic.delayFor(3, D(3, 3, 30), HOUR);
  const s = end(p);
  const thu = timer(s).runs.filter((r) => r.t >= D(3) && r.t < D(4));
  assert.equal(thu.length, 1, 'one run on Thursday');
  assert.equal(thu[0].catchup, true);
  assert.equal(thu[0].t, D(3, 3, 30) + dl);
});

test('the outage\'s cost per lane: ticks from the shutdown (inclusive) to the boot', () => {
  assert.equal(after(preset('long-weekend'), D(7, 8)).last.missedInOutage, 3);
  assert.equal(after(preset('long-weekend'), D(7, 8)).last.cronMissedInOutage, 3);
  const q = P({ offFrom: String(D(2, 3, 30)), offTo: String(D(2, 8)) }); // shutdown exactly at Wed 03:30
  assert.equal(after(q, D(2, 8)).last.missedInOutage, 1);
  const r = P({ offFrom: String(D(4, 22)), offTo: String(D(5, 8)) }); // Fri 22:00 → Sat 08:00: only cron misses Sat
  assert.equal(after(r, D(5, 8)).last.missedInOutage, 0);
  assert.equal(after(r, D(5, 8)).last.cronMissedInOutage, 1);
});

test('an outage that starts before the window: the last run is the last scheduled time the machine was on', () => {
  const p = preset('long-weekend', { offFrom: String(D(0, 3, 30)), offTo: String(D(3, 18)) }); // Mon 03:30 → Thu 18:00
  const s0 = logic.initial(p);
  assert.equal(s0.on, false);
  assert.equal(timer(s0).stamp, D(0), 'Mon 00:00, before the outage');
  const b = after(p, D(3, 18));
  assert.equal(b.last.timer, 'catchup');
  assert.deepEqual(timer(b).runs[0].covers, [1, 2, 3].map((d) => D(d)));
  assert.equal(b.last.missedInOutage, 3);
  const q = preset('long-weekend', { offFrom: String(D(2, 22)), offTo: String(D(4, 8)) }); // Wed 22:00 → Fri 08:00
  assert.equal(timer(logic.initial(q)).stamp, D(2), 'Wed 00:00, not Thursday');
  assert.deepEqual(timer(after(q, D(4, 8))).runs[0].covers, [D(3), D(4)]);
});

test('delayed runs: the record on disk, LAST and NEXT carry the run time, not the scheduled one', () => {
  const p = preset('randomized');
  const s0 = logic.initial(p);
  assert.equal(logic.stamp(timer(s0).lastTrigger), 'Mon 2026-08-31 00:24:16 CEST');
  assert.equal(logic.listTimers(s0).cells.next, 'Tue 2026-09-01 00:07:22 CEST', 'NEXT includes the delay');
  const e = after(p, D(1));
  assert.equal(e.last.timer, 'elapse');
  assert.equal(logic.nextOf(e).at, D(1) + 442, 'NEXT is the waiting start');
  assert.equal(logic.listTimers(e).cells.left, '7min');
  const r = after(p, D(1) + 442);
  assert.equal(timer(r).stamp, D(1) + 442);
  assert.equal(timer(r).lastTrigger, D(1) + 442);
  // the waiting catch-up is NEXT too
  const c = after(preset('book-arhiva', { delay: HOUR }), D(2, 8));
  assert.equal(logic.nextOf(c).at, D(2, 8) + logic.delayFor(3, D(2, 8), HOUR));
  assert.equal(logic.nextOf(c).catchup, true);
});

test('shutdown clears a waiting start, without Persistent= too', () => {
  const p = preset('randomized', { persistent: false });
  let s = logic.initial(p);
  s.power = [{ from: D(1, 0, 5), to: D(1, 8) }];
  for (let n = 1; logic.nextEvent(s) != null; n++) {
    s = logic.step(s, n, p);
    if (s.last.shutdown) { assert.equal(timer(s).pending, null); assert.equal(s.last.lost, D(1)); }
    if (s.last.boot) assert.equal(s.last.timer, null, 'nothing to catch up without Persistent=');
  }
  assert.ok(!timer(s).runs.some((r) => r.sched === D(1)));
});

test('list-timers: the relative-time thresholds', () => {
  assert.equal(logic.relative(6 * HOUR - 60), '5h 59min');
  assert.equal(logic.relative(6 * HOUR), '6h');
  assert.equal(logic.relative(5 * 60 - 1), '4min 59s');
  assert.equal(logic.relative(59), '59s');
  assert.equal(logic.relative(25 * HOUR - 1), '24h');
  assert.equal(logic.relative(9 * DAY), '1 week 2 days');
  assert.equal(logic.relative(14 * DAY), '2 weeks 0 days');
  assert.equal(logic.relative(400 * DAY), '1 year 1 month');
  assert.equal(logic.zone(D(0)), 'CEST');
  assert.equal(logic.zone(D(56)), 'CET', 'Mon 26 Oct 2026, after the last Sunday of October');
  assert.equal(logic.zone(D(55)), 'CET', 'Sun 25 Oct 2026, the change day');
  assert.equal(logic.zone(D(54)), 'CEST');
});

// ── the presets' numbers ──

test('presets: steps and outcomes (SPEC.md)', () => {
  const steps = Object.fromEntries(logic.PRESETS.map((x) => [x.id, logic.steps(P(x.params))]));
  assert.deepEqual(steps, { 'book-arhiva': 9, 'no-persistent': 9, 'long-weekend': 6, randomized: 6, 'cron-or-trap': 5 });
  const a = end(preset('book-arhiva'));
  assert.equal(cron(a).runs.length, 6); assert.equal(cron(a).missed.length, 1);
  assert.equal(timer(a).runs.length, 5); assert.equal(timer(a).missed.length, 1);
  assert.deepEqual(a.events.map((e) => (e.boot ? 'on' : e.shutdown ? 'off' : e.cron + '/' + e.timer)),
    ['run/run', 'run/run', 'off', 'missed/missed', 'on', 'run/run', 'run/run', 'run/null', 'run/null']);
  const w = end(preset('long-weekend'));
  assert.equal(cron(w).runs.length, 1); assert.equal(cron(w).missed.length, 3);
  assert.equal(timer(w).runs.length, 2);
  assert.equal(timer(end(preset('cron-or-trap'))).runs.length, 0);
  assert.equal(logic.steps(logic.defaults), 9);
});

test('params are made safe', () => {
  const n = logic.norm({ scene: 'x', delay: 5, offFrom: '123', offTo: 'y', seed: 500, persistent: 'false' });
  assert.equal(n.scene, 'arhiva');
  assert.equal(n.delay, 0);
  assert.equal(n.offFrom, 'none');
  assert.equal(n.offTo, logic.defaults.offTo);
  assert.equal(n.seed, 99);
  assert.equal(n.persistent, false);
  assert.deepEqual(logic.powerOf(logic.norm({ offFrom: String(D(2, 8)), offTo: String(D(1, 22)) })), [{ from: D(1, 22), to: D(2, 8) }], 'reversed picks are swapped');
  assert.deepEqual(logic.powerOf(logic.norm({ offFrom: String(D(2, 8)), offTo: String(D(2, 8)) })), []);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.PRESETS) {
    for (const s of all(P(pr.params))) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const pr of logic.PRESETS) {
    for (const over of [{}, { delay: HOUR }, { persistent: false }]) {
      const p = P(Object.assign({}, pr.params, over));
      const forward = all(p);
      for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
    }
  }
});

test('step does not mutate its input', () => {
  const p = preset('long-weekend');
  const s = kit.stateAt(logic, p, 5);
  const copy = structuredClone(s);
  logic.step(s, 6, p);
  assert.deepEqual(s, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('strings: every preset has its words, every day and month its name', () => {
  for (const lang of ['hr', 'en']) {
    const tb = strings[lang];
    for (const pr of logic.PRESETS) { assert.ok(tb['preset_' + pr.id], lang + pr.id); assert.ok(tb['preset_' + pr.id + '_hint'], lang + pr.id); }
    for (let i = 0; i < 7; i++) for (const k of ['d', 'dn', 'da']) assert.ok(tb[k + i], lang + k + i);
    for (let m = 1; m <= 12; m++) assert.ok(tb['mon_' + m], lang + m);
  }
});

test('the page: meta steps match the default; presets come from the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults));
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults));
  assert.match(html, /L\.PRESETS\.map/);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, k);
  for (const e of sim.entries || []) assert.ok(logic.PRESETS.some((x) => x.id === e.preset), e.preset);
});
