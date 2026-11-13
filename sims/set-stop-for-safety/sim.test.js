// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-stop-for-safety: tie-breaks first (rules 9 and 11), then the crew it reads (crew.js, rules 1-2), the
// hazard and the message (sim.js, rules 4-12), the expected numbers and presets of SPEC.md, then the template's generic
// block. Run: node --test sims/set-stop-for-safety/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const crew = require('./crew.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
/** The log of one run at the last step: first minute of each outcome. */
const log = (over, action, rule) => at(over, logic.steps).runs[logic.key(action, rule)].log;
const plan = (over, action, rule) => logic.plan(P(over), action, rule);
const kinds = (ev) => ev.map((e) => e.kind);
const hops = (ev) => ev.filter((e) => e.kind === 'hop').map((e) => [e.t, e.from, e.to, e.how]);

// ── tie-breaks first ──

test('rule 11 tie-break: a halt in the fuse minute itself is too late', () => {
  // the trainee tells the 1st AD at the break; the stand falls at minute 7
  assert.equal(log({ action: 'break', breakAt: 7 }, 'break', 'on').accident, 7);
  assert.equal(log({ action: 'break', breakAt: 7 }, 'break', 'on').halt, null);
  assert.equal(log({ breakAt: 6 }, 'break', 'on').halt, 6, 'one minute earlier is in time');
  assert.equal(log({ breakAt: 6 }, 'break', 'on').accident, null);
});

test('rule 11 tie-break: a fix in the fuse minute is too late too', () => {
  // the electrician tells the gaffer at the break (rule off): fixed at B + 1 + 3; the cable's fuse is 12
  const o = { hazard: 'exit', noticer: 'own' };
  assert.equal(log(Object.assign({ breakAt: 8 }, o), 'break', 'off').accident, 12);
  assert.equal(log(Object.assign({ breakAt: 8 }, o), 'break', 'off').fixed, null);
  assert.equal(log(Object.assign({ breakAt: 7 }, o), 'break', 'off').fixed, 11);
  assert.equal(log(Object.assign({ breakAt: 7 }, o), 'break', 'off').accident, null);
});

test('rule 11: a hop in the fuse minute is kept (heard as it happens), the halt it would cause is not; the accident comes first', () => {
  const ev = plan({ hazard: 'exit', breakAt: 12 }, 'break', 'on');
  assert.deepEqual(kinds(ev), ['accident', 'hop']);
  assert.deepEqual(hops(ev), [[12, 'trainee', 'ad1', 'break']]);
  const s = at({ hazard: 'exit', breakAt: 12 }, 12).runs['break-on'];
  assert.deepEqual(kinds(s.now), ['accident', 'hop']);
});

test('rule 11: nothing after the fuse minute', () => {
  for (const hz of logic.HAZARDS.filter((h) => h.real)) {
    for (const a of logic.ACTIONS) for (const r of logic.RULES) {
      const ev = plan({ hazard: hz.id, action: a }, a, r);
      if (!ev.some((e) => e.kind === 'accident')) continue;
      assert.ok(ev.every((e) => e.t <= hz.fuse), `${hz.id} ${a} ${r}`);
      assert.ok(ev.every((e) => e.t < hz.fuse || e.kind === 'hop' || e.kind === 'lost' || e.kind === 'accident'), `${hz.id} ${a} ${r}`);
    }
  }
});

test('rule 9 order: with the rule off, the owning head acts (9b) instead of waiting for their own break (9c)', () => {
  // the electrician tells the gaffer at the break; the gaffer sends the electrician the next minute
  const ev = plan({ hazard: 'exit', noticer: 'own', breakAt: 5 }, 'break', 'off');
  assert.deepEqual(hops(ev), [[5, 'el', 'gaf', 'break'], [6, 'gaf', 'el', 'send']]);
  assert.equal(ev.find((e) => e.kind === 'fixed').t, 9);
});

test('rule 9 order: the 1st AD is checked first (9a) even though the 1st AD heads a department (the AD department)', () => {
  const ev = plan({}, 'stop', 'off');
  assert.deepEqual(kinds(ev).slice(0, 3), ['hop', 'check', 'halt']);
});

test('rule 8 over rule 9: with the rule on, the owning head calls stop instead of fixing it without a halt', () => {
  const ev = plan({ noticer: 'own', breakAt: 5 }, 'break', 'on');
  assert.deepEqual(hops(ev).slice(0, 2), [[5, 'gr', 'kg', 'break'], [6, 'kg', 'ad1', 'call']]);
  assert.equal(ev.find((e) => e.kind === 'halt').t, 6);
});

// ── the crew it reads (crew.js) ──

test('rule 1: the owners and the noticers come from the shared crew', () => {
  assert.equal(crew.headOf('grip'), 'kg');
  assert.equal(crew.headOf('electric'), 'gaf');
  assert.equal(logic.crewOf('grip'), 'gr');
  assert.equal(logic.crewOf('electric'), 'el');
  assert.equal(crew.person('trainee').via, 'ad1');
  assert.equal(crew.person('actor').via, 'ad1');
  assert.equal(crew.person('gr').via, 'kg');
  assert.equal(crew.person('el').via, 'gaf');
  assert.equal(crew.PEOPLE.length, 15);
});

test('rule 2: paths along the lines (for the drawing)', () => {
  assert.deepEqual(crew.path('gr', 'ad1'), ['gr', 'kg', 'dop', 'ad1']);
  assert.deepEqual(crew.path('trainee', 'kg'), ['trainee', 'ad1', 'dop', 'kg']);
});

// ── the hazard and the message (sim.js) ──

test('rule 4: four hazards, their owners, fuses and fixes; silent means the accident at the fuse, or nothing for the false alarm', () => {
  assert.deepEqual(logic.HAZARDS.map((h) => [h.id, h.dept, h.fuse, h.fix, h.real]), [
    ['stand', 'grip', 7, 2, true], ['exit', 'electric', 12, 3, true], ['smoke', 'electric', 4, 2, true], ['smell', 'electric', null, 1, false]
  ]);
  for (const h of logic.HAZARDS) {
    for (const r of logic.RULES) {
      const l = log({ hazard: h.id }, 'silent', r);
      assert.equal(l.accident, h.fuse, `${h.id} ${r}`);
      assert.ok(Object.keys(l).every((k) => k === 'accident' || l[k] === null));
    }
  }
});

test('rule 5: who notices', () => {
  assert.equal(logic.noticer('trainee', logic.hazard('stand')), 'trainee');
  assert.equal(logic.noticer('dayplayer', logic.hazard('stand')), 'actor');
  assert.equal(logic.noticer('own', logic.hazard('stand')), 'gr');
  assert.equal(logic.noticer('own', logic.hazard('smoke')), 'el');
  assert.throws(() => logic.noticer('nobody', logic.hazard('stand')));
});

test('rule 6: the first hop of each action', () => {
  // the false alarm has no fuse, so no first hop is cut off by an accident
  const first = (over, a) => hops(plan(Object.assign({ hazard: 'smell' }, over), a, 'on'))[0];
  assert.equal(first({}, 'silent'), undefined);
  assert.deepEqual(first({}, 'stop'), [1, 'trainee', 'ad1', 'call']);
  assert.deepEqual(first({}, 'colleague'), [1, 'trainee', 'el', 'say']);
  assert.deepEqual(first({ noticer: 'dayplayer' }, 'colleague'), [1, 'actor', 'boom', 'say']);
  assert.deepEqual(first({ noticer: 'own', hazard: 'stand' }, 'colleague'), [1, 'gr', 'el', 'say']);
  assert.deepEqual(first({ noticer: 'own' }, 'colleague'), [1, 'el', 'gr', 'say']);
  assert.deepEqual(first({ noticer: 'own', hazard: 'stand', breakAt: 5 }, 'break'), [5, 'gr', 'kg', 'break']);
  assert.deepEqual(first({ breakAt: 9 }, 'break'), [9, 'trainee', 'ad1', 'break']);
  assert.deepEqual(first({ noticer: 'dayplayer', breakAt: 9 }, 'break'), [9, 'actor', 'ad1', 'break']);
  assert.deepEqual(first({ noticer: 'own', breakAt: 9 }, 'break'), [9, 'el', 'gaf', 'break']);
  assert.throws(() => logic.plan(P({}), 'shout', 'on'));
});

test('rule 7: a call is heard the next minute; the check takes four minutes', () => {
  assert.equal(logic.CALL, 1);
  assert.equal(logic.CHECK, 4);
  const ev = plan({ hazard: 'exit' }, 'stop', 'off');
  const check = ev.find((e) => e.kind === 'check');
  assert.deepEqual([check.t, check.until, check.head], [1, 5, 'gaf']);
  assert.equal(ev.find((e) => e.kind === 'halt').t, 5);
});

test('rule 8: with the rule on, the 1st AD halts the minute they hear; anyone else who hears of it calls stop at once', () => {
  assert.equal(log({}, 'stop', 'on').halt, 1);
  const ev = plan({ noticer: 'dayplayer' }, 'colleague', 'on');
  assert.deepEqual(hops(ev).slice(0, 2), [[1, 'actor', 'boom', 'say'], [2, 'boom', 'ad1', 'call']]);
  assert.equal(log({ noticer: 'dayplayer' }, 'colleague', 'on').halt, 2);
  assert.equal(log({ noticer: 'dayplayer' }, 'colleague', 'on').lost, null);
});

test('rule 9a: with the rule off, a report from outside the owning department is checked first; from inside it is not', () => {
  assert.equal(log({ hazard: 'exit' }, 'stop', 'off').halt, 5);
  assert.equal(log({ hazard: 'exit' }, 'stop', 'off').check, 1);
  assert.equal(log({ hazard: 'exit', noticer: 'own' }, 'stop', 'off').halt, 1);
  assert.equal(log({ hazard: 'exit', noticer: 'own' }, 'stop', 'off').check, null);
});

test('rule 9a: a false alarm reported from outside is not halted; the one who reported it is told off when the check ends', () => {
  const s = at({ hazard: 'smell' }, logic.steps).runs['stop-off'];
  assert.equal(s.log.halt, null);
  assert.equal(s.log.blame, 5);
  assert.equal(s.blamed, 'trainee');
  // whoever reported it to the 1st AD is the one told off (the day player, at the break)
  const c = at({ hazard: 'smell', noticer: 'dayplayer', action: 'break', breakAt: 6 }, logic.steps).runs['break-off'];
  assert.equal(c.blamed, 'actor');
  assert.equal(c.log.blame, 10);
  // with the rule on, nobody is
  for (const a of logic.ACTIONS) assert.equal(log({ hazard: 'smell' }, a, 'on').blame, null, a);
});

test('rule 9b: with the rule off, the owning head sends their crew and it is fixed without a halt', () => {
  const l = log({ hazard: 'exit', noticer: 'own', breakAt: 5 }, 'break', 'off');
  assert.deepEqual([l.fixed, l.halt, l.restart, l.accident], [9, null, null, null]);
});

test('rule 9c: someone of the owning department hears it second-hand: tells their head at the break', () => {
  const ev = plan({ hazard: 'exit', breakAt: 8 }, 'colleague', 'off');
  assert.deepEqual(hops(ev), [[1, 'trainee', 'el', 'say'], [8, 'el', 'gaf', 'break'], [9, 'gaf', 'el', 'send']]);
  assert.equal(log({ hazard: 'exit', breakAt: 8 }, 'colleague', 'off').accident, 12, 'fixed at 12 is too late');
  assert.equal(log({ hazard: 'exit', breakAt: 7 }, 'colleague', 'off').fixed, 11);
});

test('rule 9d: anyone else drops it: lost where it stopped', () => {
  const s = at({ hazard: 'exit', noticer: 'dayplayer' }, logic.steps).runs['colleague-off'];
  assert.equal(s.log.lost, 1);
  assert.equal(s.lostAt, 'boom');
  assert.equal(s.log.accident, 12);
  // the trainee's colleague is an electrician: lost for the grip's stand, passed on for the electric hazards
  assert.equal(log({}, 'colleague', 'off').lost, 1);
  assert.equal(log({ hazard: 'smoke' }, 'colleague', 'off').lost, null);
  // the own crew's colleague is from the other department
  assert.equal(log({ noticer: 'own' }, 'colleague', 'off').lost, 1);
  assert.equal(log({ noticer: 'own', hazard: 'exit' }, 'colleague', 'off').lost, 1);
});

test('rule 10: after the halt: the owning head sends the crew, fixed after the fix time, the 1st AD restarts a minute later', () => {
  const ev = plan({}, 'stop', 'on');
  assert.deepEqual(ev.map((e) => [e.t, e.kind]), [[1, 'hop'], [1, 'halt'], [2, 'hop'], [4, 'fixed'], [5, 'restart']]);
  assert.deepEqual(hops(ev)[1], [2, 'kg', 'gr', 'send']);
  const f = plan({ hazard: 'smell' }, 'stop', 'on');
  assert.deepEqual(f.map((e) => [e.t, e.kind]), [[1, 'hop'], [1, 'halt'], [2, 'hop'], [3, 'clear'], [4, 'restart']]);
});

test('rule 12: the outcome at a minute, in its order', () => {
  const o = (over, n, a, r) => {
    const p = P(over);
    return logic.outcome(kit.stateAt(logic, p, n).runs[logic.key(a, r)], p, a, r, n);
  };
  const ex = { hazard: 'exit' };
  assert.equal(o(ex, 0, 'stop', 'off').kind, 'waiting');
  assert.equal(o(ex, 1, 'stop', 'off').kind, 'check');
  assert.equal(o(ex, 1, 'stop', 'off').until, 5);
  assert.equal(o(ex, 5, 'stop', 'off').kind, 'halt');
  assert.deepEqual(o(ex, 10, 'stop', 'off'), { kind: 'restart', t: 10, halt: 5, stopped: 5 });
  assert.deepEqual(o(ex, 0, 'break', 'on'), { kind: 'waiting', t: 10, how: 'break' });
  assert.equal(o(ex, 5, 'silent', 'on').kind, 'quiet');
  assert.equal(o(ex, 12, 'silent', 'on').kind, 'accident');
  assert.equal(o(ex, 3, 'colleague', 'off').kind, 'waiting', 'the electrician waits for the break');
  const d = { hazard: 'exit', noticer: 'dayplayer' };
  assert.equal(o(d, 3, 'colleague', 'off').kind, 'lost');
  assert.equal(o(d, 12, 'colleague', 'off').kind, 'accident', 'accident outranks lost');
  assert.equal(o({ hazard: 'smell', noticer: 'own', breakAt: 5 }, 7, 'break', 'off').kind, 'clear');
  assert.equal(o({ hazard: 'smell' }, 6, 'stop', 'off').kind, 'blame');
  assert.equal(o({ hazard: 'exit', noticer: 'own', breakAt: 5 }, 9, 'break', 'off').kind, 'fixed');
  // halt outranks fixed: in minute H + 1 + fix the crew has fixed it but the work still stands until the restart
  assert.equal(o(ex, 9, 'stop', 'off').kind, 'halt');
  // a message that arrived this minute is not "still to come": the electrician now waits for the break
  assert.deepEqual(o(ex, 1, 'colleague', 'off'), { kind: 'waiting', t: 10, how: 'break' });
});

test('rule 12: a message the accident will overtake still shows as waiting for the break until then', () => {
  // the stand falls at 7, the break is at 10: the hop at 10 never happens, but until 7 the trainee is waiting for it
  assert.deepEqual(hops(plan({}, 'break', 'on')), []);
  assert.deepEqual(hops(logic.intended(P({}), 'break', 'on'))[0], [10, 'trainee', 'ad1', 'break']);
  const p = P({ action: 'break' });
  assert.deepEqual(logic.outcome(kit.stateAt(logic, p, 2).runs['break-on'], p, 'break', 'on', 2), { kind: 'waiting', t: 10, how: 'break' });
  assert.equal(logic.outcome(kit.stateAt(logic, p, 7).runs['break-on'], p, 'break', 'on', 7).kind, 'accident');
});

// ── expected numbers and presets (SPEC.md) ──

test('SPEC expected numbers, break at 10', () => {
  const T = (hz, who, a, r) => {
    const l = log({ hazard: hz, noticer: who }, a, r);
    return Object.fromEntries(Object.entries(l).filter(([, v]) => v !== null));
  };
  assert.deepEqual(T('stand', 'trainee', 'stop', 'on'), { halt: 1, fixed: 4, restart: 5 });
  assert.deepEqual(T('stand', 'trainee', 'stop', 'off'), { check: 1, halt: 5, fixed: 8, restart: 9 });
  assert.deepEqual(T('stand', 'trainee', 'colleague', 'on'), { halt: 2, fixed: 5, restart: 6 });
  assert.deepEqual(T('stand', 'trainee', 'colleague', 'off'), { lost: 1, accident: 7 });
  assert.deepEqual(T('stand', 'trainee', 'break', 'on'), { accident: 7 });
  assert.deepEqual(T('exit', 'trainee', 'break', 'on'), { halt: 10, fixed: 14, restart: 15 });
  assert.deepEqual(T('exit', 'trainee', 'break', 'off'), { check: 10, accident: 12 });
  assert.deepEqual(T('exit', 'own', 'break', 'on'), { halt: 11, fixed: 15, restart: 16 });
  assert.deepEqual(T('exit', 'own', 'break', 'off'), { accident: 12 });
  assert.deepEqual(T('exit', 'trainee', 'colleague', 'off'), { accident: 12 });
  assert.deepEqual(T('smoke', 'trainee', 'stop', 'off'), { check: 1, accident: 4 });
  assert.deepEqual(T('smoke', 'own', 'stop', 'off'), { halt: 1, fixed: 4, restart: 5 });
  assert.deepEqual(T('smell', 'trainee', 'stop', 'on'), { halt: 1, clear: 3, restart: 4 });
  assert.deepEqual(T('smell', 'trainee', 'stop', 'off'), { check: 1, blame: 5 });
  assert.deepEqual(T('smell', 'trainee', 'break', 'off'), { check: 10, blame: 14 });
  assert.deepEqual(T('smell', 'own', 'break', 'off'), { clear: 12 });
  assert.deepEqual(T('smell', 'trainee', 'colleague', 'off'), { clear: 12 });
  assert.deepEqual(T('smell', 'dayplayer', 'colleague', 'off'), { lost: 1 });
  assert.deepEqual(T('smell', 'trainee', 'silent', 'on'), {});
});

test('the briefing\'s rule never makes the halt later or an accident likelier', () => {
  for (const h of logic.HAZARDS) for (const who of logic.NOTICERS) for (const a of logic.ACTIONS) {
    for (let B = logic.BREAK_MIN; B <= logic.BREAK_MAX; B++) {
      const on = log({ hazard: h.id, noticer: who, breakAt: B }, a, 'on');
      const off = log({ hazard: h.id, noticer: who, breakAt: B }, a, 'off');
      const safe = (l) => [l.halt, l.fixed].filter((v) => v !== null).reduce((m, v) => Math.min(m, v), Infinity);
      assert.ok(safe(on) <= safe(off), `${h.id} ${who} ${a} ${B}`);
      if (off.accident === null) assert.equal(on.accident, null);
      assert.equal(on.lost, null, 'nothing is lost with the rule on');
    }
  }
});

test('steps: every case over every param ends by minute 16, and one ends exactly there', () => {
  let latest = 0;
  for (const h of logic.HAZARDS) for (const who of logic.NOTICERS) for (const a of logic.ACTIONS) for (const r of logic.RULES) {
    for (let B = logic.BREAK_MIN; B <= logic.BREAK_MAX; B++) {
      for (const e of plan({ hazard: h.id, noticer: who, breakAt: B }, a, r)) latest = Math.max(latest, e.t);
    }
  }
  assert.equal(latest, logic.steps);
  assert.equal(log({ hazard: 'smell', noticer: 'own', breakAt: 12 }, 'break', 'on').restart, 16);
  assert.equal(log({ hazard: 'exit', breakAt: 11 }, 'break', 'on').restart, 16);
  assert.equal(log({ hazard: 'exit', noticer: 'own', breakAt: 12 }, 'break', 'on').accident, 12, 'halt at 13 is too late');
});

const PRESETS = {
  stop: { hazard: 'stand', noticer: 'trainee', action: 'stop', anyone: true },
  break: { hazard: 'stand', noticer: 'trainee', action: 'break', anyone: true },
  colleague: { hazard: 'exit', noticer: 'dayplayer', action: 'colleague', anyone: false },
  smoke: { hazard: 'smoke', noticer: 'trainee', action: 'stop', anyone: false },
  false: { hazard: 'smell', noticer: 'dayplayer', action: 'stop', anyone: true }
};
const chosen = (id) => {
  const p = PRESETS[id];
  return log(p, p.action, p.anyone ? 'on' : 'off');
};

test('presets: the outcomes SPEC.md promises', () => {
  assert.deepEqual([chosen('stop').halt, chosen('stop').fixed, chosen('stop').restart], [1, 4, 5]);
  assert.deepEqual([chosen('break').accident, chosen('break').halt], [7, null]);
  assert.deepEqual([chosen('colleague').lost, chosen('colleague').accident], [1, 12]);
  assert.equal(log(PRESETS.colleague, 'colleague', 'on').halt, 2);
  assert.deepEqual([chosen('smoke').check, chosen('smoke').accident, chosen('smoke').halt], [1, 4, null]);
  assert.equal(log(PRESETS.smoke, 'stop', 'on').halt, 1);
  // the own crew at the break, rule off (controls only, no preset): the fix would come after the accident
  const own = { hazard: 'exit', noticer: 'own' };
  assert.deepEqual([log(own, 'break', 'off').accident, log(own, 'break', 'off').fixed], [12, null]);
  assert.deepEqual(hops(plan(own, 'break', 'off')), [[10, 'el', 'gaf', 'break'], [11, 'gaf', 'el', 'send']]);
  assert.deepEqual([chosen('false').halt, chosen('false').clear, chosen('false').restart, chosen('false').blame], [1, 3, 4, null]);
  assert.equal(log(PRESETS.false, 'stop', 'off').blame, 5);
});

test('the page\'s presets match the ones tested here', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  for (const [id, p] of Object.entries(PRESETS)) {
    const m = html.match(new RegExp(`id: '${id}',[^\\n]*params: \\{([^}]*)\\}`));
    assert.ok(m, `preset ${id} in the page`);
    const got = Object.fromEntries([...m[1].matchAll(/(\w+): ('?)([\w]+)\2/g)].map((x) => [x[1], x[2] ? x[3] : x[3] === 'true']));
    assert.deepEqual(got, p, id);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ hazard: 'exit', noticer: 'own', breakAt: 12 }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ hazard: 'smell', noticer: 'dayplayer', breakAt: 7 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = logic.step(logic.initial(p), 1, p);
  const copy = structuredClone(s0);
  logic.step(s0, 2, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
