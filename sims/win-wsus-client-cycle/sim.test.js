// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-wsus-client-cycle's model (rules: SPEC.md). Run: node --test sims/win-wsus-client-cycle/
// Times are literal minutes from Mon 00:00 (Tue 03:00 = 1620), so a changed constant in the model fails here.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, 20);
/** Run from a hand-made step-0 state (tie-breaks and edge cases the presets do not reach). */
function runFrom(s, n) { for (let i = 1; i <= n; i++) s = logic.step(s, i, null); return s; }
function tweak(over, fn) { const s = logic.initial(P(over)); fn(s); return s; }
const mac = (s, id) => s.machines.find((m) => m.id === id);
const ev = (s, who, kind) => s.log.filter((e) => e.who === who && e.kind === kind);
const times = (s, who, kind) => ev(s, who, kind).map((e) => e.t);
const hm = (d, h, m = 0) => d * 1440 + h * 60 + m;   // d: 0 = Mon
const MON = 0, TUE = 1, WED = 2, THU = 3;

// ── tie-breaks first ──

test('tie-break 7: a scan earlier in the window than the approval finds nothing; a later one finds the update', () => {
  const early = runFrom(tweak({}, (s) => { mac(s, 'DESK-1').nextScan = hm(MON, 9); }), 2);
  assert.deepEqual(ev(early, 'DESK-1', 'scan').map((e) => [e.t, e.found]), [[hm(MON, 9), 'none']]);
  assert.equal(mac(early, 'DESK-1').state, 'idle');
  const late = runFrom(tweak({}, (s) => { mac(s, 'DESK-1').nextScan = hm(MON, 11); }), 2);
  assert.deepEqual(ev(late, 'DESK-1', 'scan').map((e) => [e.t, e.found]), [[hm(MON, 11), 'new']]);
  assert.equal(mac(late, 'DESK-1').detectT, hm(MON, 11));
});

test('tie-break 7: a scan in the minute of the approval sees it (approval phase first)', () => {
  const s = runFrom(tweak({}, (x) => { mac(x, 'DESK-1').nextScan = hm(MON, 10); }), 2);
  assert.equal(ev(s, 'DESK-1', 'scan')[0].found, 'new');
  assert.equal(mac(s, 'DESK-1').detectT, hm(MON, 10));
});

test('tie-break 8: a download ending at 03:00 is installed at 03:00', () => {
  const s = runFrom(tweak({}, (x) => { const d = mac(x, 'DESK-1'); x.update.approvedAt = hm(MON, 1); d.nextScan = hm(MON, 2); }), 2);
  assert.deepEqual(times(s, 'DESK-1', 'downloaded'), [hm(MON, 3)]);
  assert.deepEqual(ev(s, 'DESK-1', 'install').map((e) => [e.t, e.how]), [[hm(MON, 3), 'scheduled']]);
});

test('tie-break 8: an install outside active hours restarts in the same minute', () => {
  const s = end({});
  assert.deepEqual(times(s, 'DESK-1', 'install'), [hm(TUE, 3)]);
  assert.deepEqual(ev(s, 'DESK-1', 'restart').map((e) => [e.t, e.how]), [[hm(TUE, 3), 'outside']]);
});

test('tie-break 8: a restart pending at power-off completes at the shut-down, before the machine is off', () => {
  const s = end({ activeHours: '06-23' });
  assert.deepEqual(ev(s, 'LAP-1', 'restart').map((e) => [e.t, e.how]), [[hm(TUE, 18), 'shutdown']]);
  const tue18 = s.log.filter((e) => e.who === 'LAP-1' && e.t === hm(TUE, 18)).map((e) => e.kind);
  assert.deepEqual(tue18, ['restart', 'off']);
  assert.equal(mac(s, 'LAP-1').restartT, hm(TUE, 18));
  assert.equal(mac(s, 'LAP-1').restartHow, 'shutdown');
});

// ── rule 1: scan interval ──

test('rule 1: interval = detection frequency minus the fixed cut (DESK-1 10 %, LAP-1 15 %)', () => {
  assert.equal(logic.intervalOf(22, 10), 1188);
  assert.equal(logic.intervalOf(22, 15), 1122);
  assert.equal(logic.intervalOf(4, 10), 216);
  const s = end({ laptopOffAtNight: false });
  assert.deepEqual(times(s, 'DESK-1', 'scan'), [840, 2028, 3216, 4404, 5592, 6780]);
  assert.deepEqual(times(s, 'LAP-1', 'scan'), [900, 2022, 3144, 4266, 5388, 6510]);
  for (const id of ['DESK-1', 'LAP-1']) {
    const ts = times(s, id, 'scan');
    const iv = mac(s, id).interval;
    assert.ok(iv >= 17.6 * 60 && iv <= 22 * 60, `${id} interval within 17.6–22 h`);
    for (let i = 1; i < ts.length; i++) assert.equal(ts[i] - ts[i - 1], iv);
  }
});

test('rule 1: scans fall at anchor + k·interval; detection 4 h finds the update 24 min after the approval', () => {
  const s = end({ detection: 4 });
  assert.equal(times(s, 'DESK-1', 'scan')[0], hm(MON, 3, 12));
  assert.equal(mac(s, 'DESK-1').detectT, hm(MON, 10, 24));
  assert.equal(mac(s, 'LAP-1').detectT, hm(MON, 11, 29));
  assert.equal(mac(end({}), 'DESK-1').detectT, hm(MON, 14));
});

// ── rule 2: off means nothing happens ──

test('rule 2: a machine that is off never scans, downloads or installs', () => {
  for (const over of [{}, { detection: 1 }, { detection: 4, au: 3, deadline: 'thu12' }, { au: 2, userClicks: true },
    { au: 3, userClicks: true, activeHours: '06-23', detection: 10 }, { au: 2, userClicks: true, activeHours: '06-23', detection: 10 }]) {
    const s = end(over);
    const lap = mac(s, 'LAP-1');
    s.log.filter((e) => e.who === 'LAP-1' && !['on', 'off', 'missed'].includes(e.kind) && !(e.kind === 'restart' && e.how === 'shutdown'))
      .forEach((e) => assert.ok(logic.isOnAt(lap, e.t), `${e.kind} at ${e.t} while off`));
  }
});

test('rule 2: a scan due while off runs 5 min after start-up and the interval counts from it', () => {
  const s = end({});
  const scans = ev(s, 'LAP-1', 'scan');
  assert.deepEqual(scans.map((e) => [e.t, e.late]), [[900, false], [2022, false], [hm(WED, 8, 5), true], [hm(THU, 8, 5), true], [hm(4, 8, 5), true]]);
  assert.deepEqual(scans.map((e) => e.found), ['new', 'known', 'known', 'known', 'known']);   // after it is found: nothing new
  assert.equal(ev(at({}, 1), 'DESK-1', 'scan').length, 0);
});

test('rule 2: a download pauses while the machine is off and continues after start-up', () => {
  const s = runFrom(tweak({}, (x) => { mac(x, 'LAP-1').nextScan = hm(MON, 17, 30); }), 8);
  const lap = mac(s, 'LAP-1');
  assert.equal(lap.dlStartT, hm(MON, 17, 30));
  assert.equal(lap.dlEndT, hm(TUE, 8, 30));     // 30 min before 18:00, 30 min after 08:00
});

// ── rule 3: Automatic Updates options ──

test('rule 3: AU 2 shows a notice and downloads nothing until the user acts', () => {
  const s = end({ au: 2 });
  for (const id of ['DESK-1', 'LAP-1']) {
    assert.equal(mac(s, id).state, 'detected');
    assert.equal(ev(s, id, 'downloaded').length, 0);
  }
});

test('rule 3: AU 3 downloads at once and waits for the user', () => {
  const s = end({ au: 3 });
  assert.deepEqual(times(s, 'DESK-1', 'downloaded'), [hm(MON, 15)]);
  assert.deepEqual(times(s, 'LAP-1', 'downloaded'), [hm(MON, 16)]);
  for (const id of ['DESK-1', 'LAP-1']) { assert.equal(mac(s, id).state, 'ready'); assert.equal(ev(s, id, 'install').length, 0); }
});

test('rule 3: AU 4 downloads at once and installs at the scheduled 03:00', () => {
  const s = end({ laptopOffAtNight: false });
  for (const id of ['DESK-1', 'LAP-1']) assert.deepEqual(ev(s, id, 'install').map((e) => [e.t, e.how]), [[hm(TUE, 3), 'scheduled']]);
});

test('rule 3: the user answers an hour after the notice, inside active hours; AU 2 then downloads and installs', () => {
  const s = end({ au: 2, userClicks: true });
  assert.deepEqual(times(s, 'DESK-1', 'user'), [hm(MON, 15)]);
  assert.deepEqual(times(s, 'DESK-1', 'downloaded'), [hm(MON, 16)]);
  assert.deepEqual(ev(s, 'DESK-1', 'install').map((e) => [e.t, e.how]), [[hm(MON, 16), 'user']]);
  assert.deepEqual(times(s, 'DESK-1', 'restart'), [hm(MON, 17)]);
});

test('rule 3: AU 3, a notice at 16:00 is answered the next morning (17:00 is outside active hours)', () => {
  const s = end({ au: 3, userClicks: true });
  assert.deepEqual(times(s, 'DESK-1', 'user'), [hm(MON, 16)]);
  assert.deepEqual(times(s, 'LAP-1', 'user'), [hm(TUE, 8)]);
  assert.deepEqual(times(s, 'LAP-1', 'restart'), [hm(TUE, 17)]);
});

test('rule 3: the user setting changes nothing under AU 4', () => {
  assert.deepEqual(end({ userClicks: true }).log, end({}).log);
});

// ── rule 4: missed scheduled install ──

test('rule 4: off at 03:00, the install runs 5 min after start-up', () => {
  const s = end({});
  assert.deepEqual(times(s, 'LAP-1', 'missed'), [hm(TUE, 3)]);
  assert.deepEqual(ev(s, 'LAP-1', 'install').map((e) => [e.t, e.how]), [[hm(TUE, 8, 5), 'missed']]);
});

// ── rule 5: active hours ──

test('rule 5: active hours do not stop the install, only the restart, which waits for their end', () => {
  const s = end({});
  const lap = mac(s, 'LAP-1');
  assert.ok(logic.inActive(lap, lap.installT), 'installed inside active hours');
  assert.deepEqual(ev(s, 'LAP-1', 'restart').map((e) => [e.t, e.how]), [[hm(TUE, 17), 'outside']]);
});

test('rule 5: the restart pending state lasts from the install to the end of active hours', () => {
  assert.equal(mac(at({}, 6), 'LAP-1').state, 'pending');    // Tue 12:00
  assert.equal(mac(at({}, 7), 'LAP-1').state, 'done');       // Tue 18:00
  assert.equal(mac(at({}, 5), 'LAP-1').state, 'ready');      // Tue 06:00: missed, waits for start-up
});

test('rule 5: active hours 06–23 on a machine that stays on: the restart waits for 23:00', () => {
  const s = end({ activeHours: '06-23', laptopOffAtNight: false, au: 3, userClicks: true });
  assert.deepEqual(times(s, 'DESK-1', 'restart'), [hm(MON, 23)]);
});

// ── rule 6: deadline ──

test('rule 6: at the deadline both install and restart, inside active hours', () => {
  const s = end({ au: 3, deadline: 'thu12' });
  for (const id of ['DESK-1', 'LAP-1']) {
    assert.deepEqual(ev(s, id, 'install').map((e) => [e.t, e.how]), [[hm(THU, 12), 'deadline']]);
    assert.deepEqual(ev(s, id, 'restart').map((e) => [e.t, e.how]), [[hm(THU, 12), 'deadline']]);
    assert.ok(logic.inActive(mac(s, id), hm(THU, 12)));
  }
});

test('rule 6: AU 2 with a deadline downloads at the deadline, then installs and restarts', () => {
  const s = end({ au: 2, deadline: 'thu12' });
  assert.deepEqual(times(s, 'DESK-1', 'downloaded'), [hm(THU, 13)]);
  assert.deepEqual(ev(s, 'DESK-1', 'restart').map((e) => [e.t, e.how]), [[hm(THU, 13), 'deadline']]);
});

test('rule 6: a deadline is known only after the scan; found after it, the update installs and restarts at once', () => {
  const s = runFrom(tweak({ au: 3, deadline: 'thu12' }, (x) => { mac(x, 'DESK-1').nextScan = hm(THU, 14); }), 20);
  const d = mac(s, 'DESK-1');
  assert.equal(d.detectT, hm(THU, 14));
  assert.equal(d.installT, hm(THU, 15));
  assert.equal(d.restartT, hm(THU, 15));
  assert.equal(d.restartHow, 'deadline');
});

test('rule 6: a machine that is off at the deadline installs and restarts at start-up', () => {
  const s = runFrom(tweak({ au: 3, deadline: 'thu12' }, (x) => { x.update.deadline = hm(THU, 6); }), 20);
  assert.deepEqual(ev(s, 'LAP-1', 'install').map((e) => [e.t, e.how]), [[hm(THU, 8), 'deadline']]);
  assert.deepEqual(times(s, 'LAP-1', 'restart'), [hm(THU, 8)]);
  assert.equal(mac(s, 'DESK-1').restartT, hm(THU, 6));
});

test('rule 6: no deadline, no forced install', () => {
  const s = end({ au: 3 });
  assert.equal(s.log.filter((e) => e.kind === 'deadline').length, 0);
});

// ── presets ──

const PRESETS = {
  'desktop-scheduled': { laptopOffAtNight: false },
  'laptop-missed': {},
  'notify-ignored': { au: 3, deadline: 'thu12' },
  'notify-only': { au: 2 },
  'short-detection': { detection: 4 }
};
const key = (s) => s.log.filter((e) => !['on', 'off'].includes(e.kind) && !(e.kind === 'scan' && e.found !== 'new'))
  .map((e) => `${e.t} ${e.who} ${e.kind}${e.how ? ' ' + e.how : ''}`);

test('presets: the timelines of SPEC.md', () => {
  assert.deepEqual(key(end(PRESETS['desktop-scheduled'])), ['600 WSUS approve', '840 DESK-1 scan', '900 LAP-1 scan',
    '900 DESK-1 downloaded', '960 LAP-1 downloaded', '1620 DESK-1 install scheduled', '1620 LAP-1 install scheduled',
    '1620 DESK-1 restart outside', '1620 LAP-1 restart outside']);
  assert.deepEqual(key(end(PRESETS['laptop-missed'])), ['600 WSUS approve', '840 DESK-1 scan', '900 LAP-1 scan',
    '900 DESK-1 downloaded', '960 LAP-1 downloaded', '1620 DESK-1 install scheduled', '1620 LAP-1 missed',
    '1620 DESK-1 restart outside', '1925 LAP-1 install missed', '2460 LAP-1 restart outside']);
  assert.deepEqual(key(end(PRESETS['notify-ignored'])), ['600 WSUS approve', '840 DESK-1 scan', '900 LAP-1 scan',
    '900 DESK-1 downloaded', '960 LAP-1 downloaded', '5040 WSUS deadline', '5040 DESK-1 install deadline',
    '5040 LAP-1 install deadline', '5040 DESK-1 restart deadline', '5040 LAP-1 restart deadline']);
  assert.deepEqual(key(end(PRESETS['notify-only'])), ['600 WSUS approve', '840 DESK-1 scan', '900 LAP-1 scan']);
  assert.deepEqual(key(end(PRESETS['short-detection'])), ['600 WSUS approve', '624 DESK-1 scan', '684 DESK-1 downloaded',
    '689 LAP-1 scan', '749 LAP-1 downloaded', '1620 DESK-1 install scheduled', '1620 LAP-1 missed',
    '1620 DESK-1 restart outside', '1925 LAP-1 install missed', '2460 LAP-1 restart outside']);
});

test('presets: notify-ignored waits all week before the deadline', () => {
  const s = at(PRESETS['notify-ignored'], 14);  // Thu 12:00
  assert.equal(s.machines.filter((m) => m.state === 'done').length, 2);
  const before = at(PRESETS['notify-ignored'], 13); // Thu 06:00
  assert.deepEqual(before.machines.map((m) => m.state), ['ready', 'ready']);
});

test('waitingFor: what each machine waits for', () => {
  const s = at({}, 1);
  assert.deepEqual(logic.waitingFor(s, mac(s, 'DESK-1'), s.t), { what: 'scan', at: 840 });
  const r = at({}, 3);                          // Mon 18:00
  assert.deepEqual(logic.waitingFor(r, mac(r, 'DESK-1'), r.t), { what: 'install', at: 1620 });
  assert.deepEqual(logic.waitingFor(r, mac(r, 'LAP-1'), r.t), { what: 'startup', at: hm(TUE, 8) });
  const p = at({}, 6);                          // Tue 12:00
  assert.deepEqual(logic.waitingFor(p, mac(p, 'LAP-1'), p.t), { what: 'restart', at: hm(TUE, 17) });
  const w = at({ activeHours: '06-23' }, 6);
  assert.deepEqual(logic.waitingFor(w, mac(w, 'LAP-1'), w.t), { what: 'shutdown', at: hm(TUE, 18) });
  const u = at({ au: 3, deadline: 'thu12' }, 4);
  assert.deepEqual(logic.waitingFor(u, mac(u, 'DESK-1'), u.t), { what: 'user', at: null, deadline: 5040 });
  assert.deepEqual(logic.waitingFor(at({}, 20), mac(at({}, 20), 'DESK-1'), 7200), { what: 'none', at: null });
  const n = at({ au: 2 }, 9);                   // Wed 06:00, LAP-1 off: still waits for the user, not for start-up
  assert.deepEqual(logic.waitingFor(n, mac(n, 'LAP-1'), n.t), { what: 'user', at: null, deadline: null });
  const i = at({}, 1);                          // Mon 06:00, LAP-1 off; its scan is due Mon 15:00, while on
  assert.deepEqual(logic.waitingFor(i, mac(i, 'LAP-1'), i.t), { what: 'scan', at: 900 });
  const sd = at({ detection: 4 }, 1);           // LAP-1 missed its 01:24 scan: it runs at 08:05
  assert.deepEqual(logic.waitingFor(sd, mac(sd, 'LAP-1'), sd.t), { what: 'scan', at: hm(MON, 8, 5) });
  const late = runFrom(tweak({}, (x) => { mac(x, 'LAP-1').nextScan = hm(MON, 20); }), 1);   // due while off at 20:00
  assert.equal(logic.nextScanAt(mac(late, 'LAP-1'), late.t), hm(TUE, 8, 5));
});

test('every combination: events in time order, states only move forward, at most one install and restart', () => {
  const ORDER = ['idle', 'detected', 'downloading', 'ready', 'pending', 'done'];
  for (const au of [2, 3, 4]) for (const detection of [1, 4, 13, 22]) for (const activeHours of ['08-17', '06-23'])
    for (const deadline of ['none', 'thu12']) for (const laptopOffAtNight of [true, false]) for (const userClicks of [true, false]) {
      const p = P({ au, detection, activeHours, deadline, laptopOffAtNight, userClicks });
      let s = logic.initial(p), prev = s;
      for (let n = 1; n <= 20; n++) {
        s = logic.step(s, n, p);
        s.machines.forEach((m, i) => assert.ok(ORDER.indexOf(m.state) >= ORDER.indexOf(prev.machines[i].state)));
        prev = s;
      }
      for (let i = 1; i < s.log.length; i++) assert.ok(s.log[i].t >= s.log[i - 1].t);
      for (const id of ['DESK-1', 'LAP-1']) {
        assert.ok(ev(s, id, 'install').length <= 1 && ev(s, id, 'restart').length <= 1);
        if (deadline === 'thu12') assert.equal(mac(s, id).state, 'done', `${JSON.stringify(p)} ${id} done after the deadline`);
      }
    }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ au: 3, deadline: 'thu12', detection: 5 }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ au: 2, userClicks: true, detection: 7 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = kit.stateAt(logic, p, 2);
  const copy = structuredClone(s0);
  logic.step(s0, 3, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model and matches SPEC.md', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const found = [...html.matchAll(/\{ id: '([\w-]+)',[^\n]*?params: (\{[^}]*\})/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(found.map((f) => f[0]), Object.keys(PRESETS));
  for (const [id, src] of found) {
    const params = Function('return ' + src)();
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.deepEqual(params, PRESETS[id], `${id} params as in SPEC.md`);
  }
});
