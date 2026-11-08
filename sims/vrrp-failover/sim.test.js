// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for vrrp-failover's model (rules in SPEC.md). Run: node --test sims/vrrp-failover/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const last = (over) => at(over, logic.steps(P(over)));
const R = (s, id) => s.routers.find((r) => r.id === id);
const phaseAt = (over, phase) => at(over, logic.plan(P(over)).indexOf(phase) + 1);
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || ''} ${a} ≈ ${b}`);

// ── tie-breaks first ──

test('rule 3 tie-break: equal priority, the higher primary address wins', () => {
  const r1 = { prio: 100, ip: '192.168.1.2' }, r2 = { prio: 100, ip: '192.168.1.3' };
  assert.equal(logic.wins(r2, r1), true);
  assert.equal(logic.wins(r1, r2), false);
  // compared as numbers, not as text: .10 beats .9
  assert.equal(logic.wins({ prio: 100, ip: '192.168.1.10' }, { prio: 100, ip: '192.168.1.9' }), true);
});

test('rule 3: priority decides before the address', () => {
  assert.equal(logic.wins({ prio: 200, ip: '192.168.1.2' }, { prio: 100, ip: '192.168.1.3' }), true);
  assert.equal(logic.wins({ prio: 99, ip: '192.168.1.3' }, { prio: 100, ip: '192.168.1.2' }), false);
});

test('preset tie: both start at once, both become Master, R2 (.3) stays Master and R1 (.2) steps down', () => {
  const p = { event: 'start', prioR1: 100, prioR2: 100 };
  assert.deepEqual(logic.plan(P(p)), ['start', 'expire', 'announce', 'flood', 'summary']);
  const ex = phaseAt(p, 'expire');
  assert.deepEqual(ex.takers, ['R1', 'R2'], 'equal timers expire together');
  const an = phaseAt(p, 'announce');
  assert.deepEqual(an.flap, [3, 4], 'the switch sees the virtual MAC on both ports');
  const fl = phaseAt(p, 'flood');
  assert.equal(R(fl, 'R1').state, 'backup');
  assert.equal(R(fl, 'R1').heard, 'stepdown');
  assert.equal(R(fl, 'R2').state, 'master');
  assert.equal(R(fl, 'R2').heard, 'assert');
  assert.equal(fl.switchMac[logic.VMAC], 4);
  assert.equal(fl.flap, null);
  assert.equal(last(p).fw, 'R2');
});

test('rule 4 tie: a Backup with the same priority as the advertisement resets its timer (no preemption on equal)', () => {
  assert.equal(logic.backupHears(100, 100, true), 'reset');
});

// ── rules ──

test('rule 2: Skew_Time and Master_Down_Interval (centiseconds)', () => {
  close(logic.skewTime(100, 100), 60.9375);
  close(logic.downInterval(100, 100), 360.9375, 'R2 at 100: 3.61 s');
  close(logic.downInterval(200, 100), 321.875, 'R1 at 200: 3.22 s');
  close(logic.downInterval(100, 10), 36.09375, 'fast adverts: 0.36 s');
  assert.ok(logic.downInterval(200, 100) < logic.downInterval(100, 100), 'higher priority, shorter wait');
});

test('rule 1: the Master advertises and the Backup resets its timer to the full interval', () => {
  const s = phaseAt({}, 'advert');
  assert.equal(s.frame.kind, 'advert');
  assert.equal(s.frame.prio, 200);
  assert.equal(s.frame.interval, 100);
  assert.equal(R(s, 'R2').heard, 'reset');
  close(R(s, 'R2').downAt - s.t, 360.9375);
});

test('rule 5: advertisements and the gratuitous ARP carry the virtual MAC as source', () => {
  const adv = phaseAt({}, 'advert');
  assert.equal(adv.frame.srcMac, logic.VMAC);
  assert.equal(adv.frame.dstIp, '224.0.0.18');
  const an = phaseAt({}, 'announce');
  assert.equal(an.frame.kind, 'garp');
  assert.equal(an.frame.srcMac, logic.VMAC);
  assert.equal(an.frame.dstMac, logic.BROADCAST);
  assert.equal(an.frame.senderIp, logic.VIP);
  assert.equal(an.frame.targetIp, logic.VIP);
  assert.equal(an.frame.senderMac, logic.VMAC);
});

test('preset master-fails: R2 takes over after 3.61 s, the switch moves the MAC, hosts keep their entry', () => {
  assert.equal(logic.steps(P({})), 8);
  const w = phaseAt({}, 'wait');
  assert.equal(w.t, 300);
  assert.equal(w.fw, null, 'frames to the gateway are lost while R2 waits');
  close(R(w, 'R2').downAt - w.t, 60.9375);
  const ex = phaseAt({}, 'expire');
  close(ex.t, 360.9375);
  assert.equal(R(ex, 'R2').state, 'master');
  assert.equal(ex.switchMac[logic.VMAC], 3, 'until the announcement, the switch still sends to R1\'s port');
  const an = phaseAt({}, 'announce');
  assert.equal(an.switchMac[logic.VMAC], 4);
  assert.equal(an.switchChanged, true);
  const fl = phaseAt({}, 'flood');
  for (const h of ['A', 'B']) {
    assert.deepEqual(fl.arp[h].map((e) => [e.ip, e.mac]), [[logic.VIP, logic.VMAC]], `${h}: one entry, same MAC`);
    assert.equal(fl.arp[h][0].state, 'refreshed');
  }
  const fr = phaseAt({}, 'frame');
  assert.equal(fr.frame.dstMac, logic.VMAC, 'A still sends to the virtual MAC');
  assert.equal(fr.frame.via, 'R2');
  const end = last({});
  close(end.lost, 360.9375, 'about 3.6 s of lost frames');
  assert.equal(end.gwChanges, 1);
});

test('rule 4 preemption on: R1 (200) ignores R2\'s (100) adverts, takes over after its own timer; R2 steps down', () => {
  const p = { event: 'restore' };
  assert.equal(logic.steps(P(p)), 8);
  const w = phaseAt(p, 'wait');
  assert.equal(R(w, 'R1').heard, 'discard');
  assert.equal(w.discarded, 3);
  close(R(w, 'R1').downAt, 321.875, 'the timer was never reset');
  const ex = phaseAt(p, 'expire');
  close(ex.t, 321.875);
  assert.equal(R(ex, 'R1').state, 'master');
  const fl = phaseAt(p, 'flood');
  assert.equal(R(fl, 'R2').heard, 'stepdown');
  assert.equal(R(fl, 'R2').state, 'backup');
  const end = last(p);
  assert.equal(end.fw, 'R1');
  assert.equal(end.gwChanges, 1, 'a second switch-over');
  assert.equal(end.lost, 0);
});

test('rule 4 preemption off: R1 resets its timer on every lower advert and stays Backup', () => {
  const p = { event: 'restore', preempt: false };
  assert.deepEqual(logic.plan(P(p)), ['advert', 'restore', 'wait', 'summary']);
  const end = last(p);
  assert.equal(R(end, 'R1').state, 'backup');
  assert.equal(R(phaseAt(p, 'wait'), 'R1').heard, 'reset');
  close(R(phaseAt(p, 'wait'), 'R1').downAt, 300 + 321.875, 'reset at the last advert, t = 3 s');
  assert.equal(R(end, 'R2').state, 'master');
  assert.equal(end.gwChanges, 0);
  assert.equal(logic.backupHears(200, 100, false), 'reset');
  assert.equal(logic.backupHears(200, 100, true), 'discard');
});

test('rule 3/4: the address owner (255) always preempts, even with preempt off', () => {
  assert.equal(logic.backupHears(255, 100, false), 'discard');
  assert.equal(logic.clampPrio(255, 100), 254, 'no router in this scene owns 192.168.1.1');
  assert.equal(logic.clampPrio(0, 100), 1);
});

test('rule 6: a clean shutdown sends priority 0 and the Backup waits Skew_Time only (0.61 s)', () => {
  const p = { event: 'shutdown' };
  const sd = phaseAt(p, 'shutdown');
  assert.equal(sd.frame.prio, 0);
  assert.equal(R(sd, 'R2').heard, 'skew');
  close(R(sd, 'R2').downAt - sd.t, 60.9375);
  assert.equal(logic.backupHears(100, 0, true), 'skew');
  assert.equal(logic.backupHears(100, 0, false), 'skew');
  close(last(p).lost, 60.9375);
});

test('rule 6: a Master hearing priority 0 or a lower priority asserts itself', () => {
  assert.equal(logic.masterHears({ prio: 100, ip: '192.168.1.3' }, { prio: 0, ip: '192.168.1.9' }), 'assert');
  assert.equal(logic.masterHears({ prio: 100, ip: '192.168.1.3' }, { prio: 50, ip: '192.168.1.9' }), 'assert');
  assert.equal(logic.masterHears({ prio: 100, ip: '192.168.1.3' }, { prio: 150, ip: '192.168.1.2' }), 'stepdown');
});

test('preset fast-adverts: 0.1 s adverts, Master_Down 0.36 s', () => {
  const p = { advInterval: 10 };
  const ex = phaseAt(p, 'expire');
  close(ex.t, 36.09375);
  assert.equal(phaseAt(p, 'wait').t, 30);
  close(last(p).lost, 36.09375);
});

test('rule 7: routers that cannot hear each other both become Master; the switch flaps the MAC', () => {
  const p = { event: 'cut' };
  const w = phaseAt(p, 'wait');
  assert.equal(R(w, 'R2').heard, 'lost');
  assert.equal(w.packets.some((k) => k.drop), true);
  const fl = phaseAt(p, 'flood');
  assert.equal(R(fl, 'R1').state, 'master');
  assert.equal(R(fl, 'R2').state, 'master');
  assert.equal(fl.switchMac[logic.VMAC], 4);
  const fp = phaseAt(p, 'flap');
  assert.equal(fp.t, 400);
  assert.equal(fp.switchMac[logic.VMAC], 3, 'R1\'s next advert pulls the MAC back');
  assert.equal(last(p).gwChanges, 2);
});

test('failing the Backup changes nothing for the hosts', () => {
  const p = { prioR2: 250 };
  assert.deepEqual(logic.plan(P(p)), ['advert', 'fail', 'summary']);
  const end = last(p);
  assert.equal(end.fw, 'R2');
  assert.equal(end.lost, 0);
  assert.equal(end.gwChanges, 0);
});

test('start-up without a tie: the higher priority expires first, the other resets on its advert', () => {
  const p = { event: 'start' };
  const ex = phaseAt(p, 'expire');
  assert.deepEqual(ex.takers, ['R1']);
  close(ex.t, 321.875);
  assert.equal(R(phaseAt(p, 'flood'), 'R2').heard, 'reset');
  assert.deepEqual(phaseAt(p, 'flood').arp.A, [], 'a gratuitous ARP adds no entry a host did not have');
});

test('the forwarder is the up Master on the switch port of the virtual MAC', () => {
  const s = at({}, 0);
  assert.equal(logic.forwarder(s), 'R1');
  const f = phaseAt({}, 'fail');
  assert.equal(logic.forwarder(f), null);
});

test('review: a Master that steps down restarts its Master_Down timer', () => {
  const fl = phaseAt({ event: 'restore' }, 'flood');
  close(R(fl, 'R2').downAt - fl.t, 360.9375);
  const tie = phaseAt({ event: 'start', prioR1: 100 }, 'flood');
  close(R(tie, 'R1').downAt - tie.t, 360.9375);
});

test('review: a Backup that shuts down sends nothing and stops its timer', () => {
  const s = phaseAt({ event: 'shutdown', prioR2: 250 }, 'shutdown');
  assert.equal(s.frame, null);
  assert.deepEqual(s.packets, []);
  assert.equal(R(s, 'R1').downAt, null);
  assert.equal(R(s, 'R1').state, 'init');
  assert.equal(R(s, 'R2').state, 'master');
});

test('review: a failed router is not Master any more', () => {
  const s = phaseAt({}, 'fail');
  assert.equal(R(s, 'R1').up, false);
  assert.equal(R(s, 'R1').state, 'init');
});

test('review: in a cut the old Master hears nothing of the new one', () => {
  const fl = phaseAt({ event: 'cut' }, 'flood');
  assert.equal(R(fl, 'R1').heard, 'lost');
  assert.ok(fl.packets.some((k) => k.to === 'R1' && k.drop));
});

test('review: at step 0 the Backup timer uses the Backup\'s own priority', () => {
  close(R(at({}, 0), 'R2').downLen, 360.9375);
  close(R(at({ prioR2: 250 }, 0), 'R1').downLen, 321.875);
});

test('review: tie at start-up: the switch keeps the last port, then the asserting Master advertises again', () => {
  const p = { event: 'start', prioR1: 100 };
  assert.equal(phaseAt(p, 'announce').switchMac[logic.VMAC], 4);
  const fl = phaseAt(p, 'flood');
  assert.ok(fl.packets.some((k) => k.from === 'R2' && k.to === 'SW' && k.second), 'R2 sends its own advert at once');
});

test('review: cut with R2 as the first Master is symmetric', () => {
  const p = { event: 'cut', prioR2: 250 };
  const fp = phaseAt(p, 'flap');
  assert.equal(fp.switchMac[logic.VMAC], 4, 'R2\'s advert pulls the MAC back to port 4');
  assert.equal(R(fp, 'R1').state, 'master');
  assert.equal(R(fp, 'R2').state, 'master');
});

// ── generic checks every sim keeps ──

const ALL = [{}, { event: 'restore' }, { event: 'restore', preempt: false }, { event: 'start', prioR1: 100 },
  { event: 'start' }, { event: 'shutdown' }, { advInterval: 10 }, { event: 'cut' }, { prioR2: 250 },
  { event: 'shutdown', prioR2: 250 }, { event: 'cut', prioR2: 250 }, { event: 'restore', prioR1: 50 }];

test('every run has at most 20 steps and ends done', () => {
  for (const o of ALL) {
    const n = logic.steps(P(o));
    assert.ok(n > 0 && n <= 20, JSON.stringify(o));
    assert.equal(last(o).done, true);
  }
});

test('state is JSON-safe at every step', () => {
  for (const o of ALL) {
    for (let n = 0; n <= logic.steps(P(o)); n++) {
      const s = at(o, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of ALL) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const o of ALL) {
    const p = P(o);
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
