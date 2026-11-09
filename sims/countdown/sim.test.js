// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the exercise countdown's model (SPEC.md). Run: node --test sims/countdown/
// Every function takes `now` (ms); these tests choose it. Tie-breaks first.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const T0 = 1_800_000_000_000; // an arbitrary epoch time
const S = 1000, M = 60 * S;
const running = (ms, warn = 60 * S) => logic.start(logic.create(ms, warn), T0);
const at = (s, ms) => logic.view(s, T0 + ms, 0);

// ── tie-breaks ──

test('rule 1a: shown seconds round up; a whole second shows itself', () => {
  assert.equal(logic.shownSeconds(240000), 240);
  assert.equal(logic.shownSeconds(240001), 241);
  assert.equal(logic.clock(240000), '4:00');
  assert.equal(logic.clock(240001), '4:01');
  assert.equal(logic.clock(0), '0:00');
  assert.equal(logic.clock(1), '0:01');
});

test('rule 3: remaining exactly equal to warnAt is warning, one ms more is running', () => {
  const s = running(5 * M);
  assert.equal(at(s, 4 * M).phase, 'warning');
  assert.equal(at(s, 4 * M - 1).phase, 'running');
});

test('rule 4: −1 min can bring the duration down to the time run, not below', () => {
  const s = running(5 * M);
  const a = logic.adjust(s, -M, T0 + 4.5 * M); // 30 s left
  assert.equal(a.durationMs, 4.5 * M);
  assert.equal(at(a, 4.5 * M).remainingMs, 0);
  assert.equal(logic.settle(a, T0 + 4.5 * M).status, 'done');
});

test('rule 7: end clock rounds to the nearest minute, half a minute up', () => {
  const t = Date.UTC(2026, 10, 9, 10, 44, 30);
  assert.equal(logic.clockTime(t, 0), '10:45');
  assert.equal(logic.clockTime(t - 1, 0), '10:44');
  assert.equal(logic.clockTime(t, 60), '11:45');
  assert.equal(logic.clockTime(Date.UTC(2026, 10, 9, 23, 59, 40), 0), '00:00', 'wraps past midnight');
  assert.equal(logic.clockTime(Date.UTC(2026, 10, 9, 0, 10, 0), -60), '23:10', 'negative offsets wrap back');
});

// ── rules ──

test('rule 1: a 5 min timer shows 5:00 at the start, 4:59 after one second, 0:00 only at the end', () => {
  const s = running(5 * M);
  assert.equal(at(s, 0).clock, '5:00');
  assert.equal(at(s, 999).clock, '5:00');
  assert.equal(at(s, 1000).clock, '4:59');
  assert.equal(at(s, 5 * M - 1).clock, '0:01');
  assert.equal(at(s, 5 * M).clock, '0:00');
  assert.equal(at(s, 6 * M).remainingMs, 0, 'never negative');
  assert.equal(at(s, 2 * M).fraction, 0.6);
});

test('rule 2: pause freezes the time; resume adds the paused time to pausedTotal', () => {
  let s = running(5 * M);
  s = logic.pause(s, T0 + 10 * S);
  assert.equal(s.status, 'paused');
  assert.equal(s.pausedAt, T0 + 10 * S);
  assert.equal(at(s, 50 * S).clock, '4:50', 'paused: frozen');
  s = logic.start(s, T0 + 70 * S);
  assert.equal(s.pausedTotalMs, 60 * S);
  assert.equal(s.pausedAt, null);
  assert.equal(at(s, 70 * S).clock, '4:50');
  assert.equal(at(s, 71 * S).clock, '4:49');
  // a second pause adds up
  s = logic.start(logic.pause(s, T0 + 80 * S), T0 + 100 * S);
  assert.equal(s.pausedTotalMs, 80 * S);
});

test('rule 2: reset returns to idle with the same duration and warning', () => {
  let s = logic.pause(running(3 * M, 30 * S), T0 + 5 * S);
  s = logic.reset(s);
  assert.deepEqual(s, logic.create(3 * M, 30 * S));
  assert.equal(s.status, 'idle');
});

test('rule 3: phases idle, running, warning, done follow the remaining time and warnAt', () => {
  const idle = logic.create(5 * M, 60 * S);
  assert.equal(logic.view(idle, T0, 0).phase, 'idle');
  assert.equal(logic.view(idle, T0, 0).clock, '5:00');
  const s = running(5 * M, 120 * S);
  assert.equal(at(s, 2 * M).phase, 'running');
  assert.equal(at(s, 3 * M).phase, 'warning');
  assert.equal(at(s, 5 * M).phase, 'done');
  assert.equal(at(running(30 * S), 0).phase, 'warning', 'shorter than the warning: warning from the start');
  const p = logic.pause(s, T0 + 4 * M);
  assert.equal(at(p, 9 * M).phase, 'warning', 'paused keeps its phase');
  assert.equal(at(p, 9 * M).paused, true);
});

test('rule 4: +1 / −1 min while running or paused move the duration', () => {
  const s = running(5 * M);
  assert.equal(logic.adjust(s, M, T0 + S).durationMs, 6 * M);
  assert.equal(logic.adjust(s, -M, T0 + S).durationMs, 4 * M);
  const p = logic.pause(s, T0 + 2 * M);
  assert.equal(logic.adjust(p, -M, T0 + 9 * M).durationMs, 4 * M, 'paused time does not count as run');
  assert.equal(logic.adjust(p, -10 * M, T0 + 9 * M).durationMs, 2 * M);
  assert.equal(logic.adjust(running(99 * M), 2 * M, T0).durationMs, logic.MAX_MS, 'capped at 99:59');
});

test('rule 4a: idle ±1 min stays within 0:05 and 99:59', () => {
  assert.equal(logic.adjust(logic.create(M, 0), -M, T0).durationMs, 5 * S);
  assert.equal(logic.adjust(logic.create(99.5 * M, 0), M, T0).durationMs, logic.MAX_MS);
  const floor = logic.create(5 * S, 0);
  assert.equal(logic.adjust(floor, -M, T0), floor, 'nothing to take: same object');
  assert.equal(logic.canAdjust(floor, -M, T0), false);
  assert.equal(logic.canAdjust(floor, M, T0), true);
});

test('rule 4b: after the end, +1 min runs one more minute from now; −1 min does nothing', () => {
  const done = logic.settle(running(M), T0 + M);
  assert.equal(done.status, 'done');
  const more = logic.adjust(done, M, T0 + 3 * M);
  assert.equal(more.status, 'running');
  assert.equal(at(more, 3 * M).clock, '1:00');
  assert.equal(logic.adjust(done, -M, T0 + 3 * M), done);
  const late = logic.adjust(done, M, T0 + 120 * M); // finished two hours ago, longer than the 99:59 cap
  assert.equal(late.status, 'running');
  assert.equal(at(late, 120 * M).clock, '1:00');
  assert.equal(logic.settle(late, T0 + 120 * M), late, 'does not end again at once');
  assert.equal(logic.view(late, T0 + 120 * M, 0).endClock, logic.clockTime(T0 + 121 * M, 0));
});

test('rule 6: a long gap between frames (throttled tab) is exact on the next view', () => {
  const s = running(15 * M);
  assert.equal(at(s, 10 * M + 250).clock, '5:00');
  assert.equal(at(s, 10 * M + 1000).clock, '4:59');
});

test('rule 7: end clock while running and paused is now + remaining; done is when it ended; idle none', () => {
  const t0 = Date.UTC(2026, 10, 9, 10, 40, 0);
  let s = logic.start(logic.create(5 * M, M), t0);
  assert.equal(logic.view(s, t0, 0).endClock, '10:45');
  s = logic.pause(s, t0 + M);
  assert.equal(logic.view(s, t0 + 3 * M, 0).endClock, '10:47', 'a pause pushes the end');
  s = logic.settle(logic.start(s, t0 + 3 * M), t0 + 20 * M);
  assert.equal(s.status, 'done');
  assert.equal(logic.view(s, t0 + 20 * M, 0).endClock, '10:47');
  assert.equal(logic.view(logic.create(5 * M, M), t0, 0).endClock, null);
});

test('rule 8: Space cycles idle → running → paused → running; done → idle', () => {
  let s = logic.create(5 * M, M);
  s = logic.toggle(s, T0); assert.equal(s.status, 'running');
  s = logic.toggle(s, T0 + S); assert.equal(s.status, 'paused');
  s = logic.toggle(s, T0 + 2 * S); assert.equal(s.status, 'running');
  s = logic.settle(s, T0 + 10 * M); assert.equal(s.status, 'done');
  s = logic.toggle(s, T0 + 11 * M); assert.deepEqual(s, logic.create(5 * M, M));
  assert.equal(logic.start(running(M), T0 + S).startedAt, T0, 'start on a running timer changes nothing');
  assert.equal(logic.pause(logic.create(M, 0), T0).status, 'idle', 'pause on idle changes nothing');
});

test('rule 9: a new duration or a bare reset gives a fresh timer; warning, title and sound keep it running', () => {
  const p = Object.assign({}, logic.defaults);
  const cfg = logic.initial(p);
  const s = running(cfg.durationMs);
  assert.deepEqual(logic.reconcile(null, null, cfg), logic.create(5 * M, M), 'first load');
  assert.deepEqual(logic.reconcile(s, cfg, Object.assign({}, cfg)), logic.create(5 * M, M), 'R with nothing changed');
  assert.deepEqual(logic.reconcile(s, cfg, logic.initial(Object.assign({}, p, { minutes: 10 }))), logic.create(10 * M, M));
  const warned = logic.reconcile(s, cfg, logic.initial(Object.assign({}, p, { warn: 120 })));
  assert.equal(warned.status, 'running');
  assert.equal(warned.warnAtMs, 120 * S);
  assert.equal(logic.reconcile(s, cfg, logic.initial(Object.assign({}, p, { sound: true }))), s, 'sound: same timer');
  assert.equal(logic.reconcile(s, cfg, logic.initial(Object.assign({}, p, { label: 'break' }))), s, 'title: same timer');
  // R or a preset (the page says so) resets even when only the warning, title or sound differ
  const soundOn = logic.initial(Object.assign({}, p, { sound: true }));
  assert.deepEqual(logic.reconcile(s, soundOn, cfg, true), logic.create(5 * M, M), 'R after a sound change');
  assert.equal(logic.reconcile(s, soundOn, cfg, false), s);
});

test('rule 10: settle ends a running timer once, and a paused one that −1 min brought to 0', () => {
  const s = running(M);
  assert.equal(logic.settle(s, T0 + M - 1), s, 'not yet: same object');
  const d = logic.settle(s, T0 + M);
  assert.equal(d.status, 'done');
  assert.equal(logic.settle(d, T0 + 2 * M), d, 'already done: same object');
  const p = logic.adjust(logic.pause(running(5 * M), T0 + 4.5 * M), -M, T0 + 6 * M);
  assert.equal(logic.settle(p, T0 + 6 * M).status, 'done');
  assert.equal(logic.view(logic.settle(p, T0 + 6 * M), T0 + 6 * M, 0).endClock, logic.clockTime(T0 + 6 * M, 0), 'ended when −1 min ended it');
});

test('pause on a paused timer and start on a done one change nothing', () => {
  const p = logic.pause(running(5 * M), T0 + S);
  assert.equal(logic.pause(p, T0 + 9 * S), p);
  const d = logic.settle(running(M), T0 + M);
  assert.equal(logic.start(d, T0 + 2 * M), d);
});

test('minutes left round up (caption and badge)', () => {
  const s = running(5 * M);
  assert.equal(at(s, 0).minutesLeft, 5);
  assert.equal(at(s, 1).minutesLeft, 5, '4:59.999 left: still under 5');
  assert.equal(at(s, M).minutesLeft, 4);
  assert.equal(at(s, 100 * S).minutesLeft, 4, '3:20 left: 4, not 3');
  assert.equal(at(s, 4.5 * M).minutesLeft, 1, '30 s left: 1 min');
  assert.equal(at(s, 5 * M).minutesLeft, 0);
});

test('long timers: clock above an hour, cap at 99:59', () => {
  assert.equal(logic.MAX_MS, 5999000);
  assert.equal(logic.clock(75 * M), '75:00');
  assert.equal(logic.clock(logic.MAX_MS), '99:59');
});

test('canAdjust while running: off at the cap and with nothing left to take', () => {
  const big = running(logic.MAX_MS);
  assert.equal(logic.canAdjust(big, M, T0 + S), false, 'at 99:59');
  assert.equal(logic.canAdjust(big, -M, T0 + S), true);
  const spent = logic.adjust(running(M), -M, T0 + 2 * S); // −1 min two seconds in: duration down to the 2 s run
  assert.equal(spent.durationMs, 2 * S, 'running has no 5 s floor, only the time run');
  assert.equal(logic.canAdjust(spent, -M, T0 + 2 * S), false);
});

test('params: minutes plus seconds; presets lengths', () => {
  assert.equal(logic.durationOf({ minutes: 1, seconds: 30 }), 90 * S);
  assert.equal(logic.durationOf({ minutes: 15, seconds: 0 }), 15 * M);
  assert.equal(logic.initial(logic.defaults).durationMs, 5 * M);
  assert.equal(logic.initial(logic.defaults).warnAtMs, 60 * S);
  assert.equal(logic.defaults.sound, false, 'tone off by default');
});

test('sanitize repairs a stored timer and refuses junk', () => {
  assert.equal(logic.sanitize(null), null);
  assert.equal(logic.sanitize({ status: 'x', durationMs: 1, warnAtMs: 0 }), null);
  assert.deepEqual(logic.sanitize({ status: 'running', durationMs: 5 * M, warnAtMs: M }), logic.create(5 * M, M), 'no start time: idle');
  assert.equal(logic.sanitize({ status: 'running', durationMs: 0, startedAt: T0, warnAtMs: M }), null, 'zero length');
  const back = (x) => logic.sanitize(JSON.parse(JSON.stringify(x)));
  const s = logic.pause(running(5 * M), T0 + S);
  assert.deepEqual(back(s), s);
  const twice = logic.start(logic.pause(logic.start(s, T0 + 20 * S), T0 + 30 * S), T0 + 50 * S);
  assert.equal(twice.pausedTotalMs, 39 * S);
  assert.deepEqual(back(twice), twice, 'running, with a paused total');
  const done = logic.settle(running(M), T0 + M);
  assert.deepEqual(back(done), done, 'done stays done');
  assert.deepEqual(back(Object.assign({}, s, { pausedAt: null })), logic.create(5 * M, M), 'paused without pausedAt: idle');
  const cut = logic.adjust(running(M), -M, T0 + 3 * S); // 3 s long, below the idle floor
  assert.equal(back(cut).durationMs, 3 * S, 'a length cut below 0:05 is kept');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe after every action', () => {
  let s = logic.create(5 * M, M);
  const acts = [(x) => logic.start(x, T0), (x) => logic.pause(x, T0 + S), (x) => logic.adjust(x, M, T0 + 2 * S),
    (x) => logic.start(x, T0 + 3 * S), (x) => logic.settle(x, T0 + 99 * M), (x) => logic.toggle(x, T0 + 100 * M)];
  for (const a of acts) { s = a(s); assert.deepEqual(JSON.parse(JSON.stringify(s)), s); }
});

test('the model is deterministic and does not mutate its input', () => {
  const s = logic.pause(running(5 * M), T0 + S);
  const copy = structuredClone(s);
  assert.deepEqual(logic.start(s, T0 + 9 * S), logic.start(s, T0 + 9 * S));
  logic.start(s, T0 + 9 * S); logic.adjust(s, -M, T0); logic.reset(s); logic.settle(s, T0 + 99 * M); logic.setWarn(s, 1);
  assert.deepEqual(s, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('the page metadata matches the model: a tool, no steps; presets use model params', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'tool');
  assert.equal(meta.steps, undefined);
  assert.ok(!('step' in logic), 'no step function');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
