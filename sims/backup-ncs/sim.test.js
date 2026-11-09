// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for backup-ncs's model (SPEC.md). Run: node --test sims/backup-ncs/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const slot = (over, n) => at(over, n).channel[n - 1];
const st = (s, id) => s.stations.find((x) => x.id === id);
const acts = (c) => c.acts.map((a) => a.who + ':' + a.kind + (a.target ? '>' + a.target : '') + (a.ack ? '+' + a.ack : ''));
const PRESETS = {
  takeover: {},
  'no-backup': { backup: false },
  'too-early': { wait: 1, ncsReturns: true, returnAt: 7 },
  'no-log': { logging: false }
};

// ── tie-breaks first ──

test('T1: in the hand-back slot the returned NCS listens; only the backup transmits', () => {
  const c = slot(PRESETS['too-early'], 8);
  assert.deepEqual(acts(c), ['bncs:handback']);
  assert.equal(c.outcome, 'heard');
  assert.deepEqual(acts(slot(PRESETS['too-early'], 9)), ['ncs:call>C+B']);
});

test('T2: a station called just before the NCS falls silent still answers; delivered only if someone logs it', () => {
  // NCS calls B in 3, falls silent in 4: B answers in 4
  assert.deepEqual(acts(slot({ failAt: 4 }, 4)), ['B:answer']);
  assert.equal(st(at({ failAt: 4 }, 4), 'B').deliveredAt, 4, 'the logging backup heard it');
  assert.equal(st(at({ failAt: 4, logging: false }, 4), 'B').deliveredAt, null, 'nobody logged it');
  assert.equal(st(at({ failAt: 4, backup: false }, 4), 'B').deliveredAt, null);
  // silence counts from failAt, including that answer slot: 4 slots → announce in 8
  assert.deepEqual(acts(slot({ failAt: 4 }, 8)), ['bncs:announce']);
});

test('T3: an NCS back before the takeover resumes from its own log; the silence counter resets', () => {
  const o = { ncsReturns: true, returnAt: 7 };
  assert.equal(at(o, 6).ncs.silence, 2);
  assert.equal(at(o, 7).ncs.silence, 0);
  assert.deepEqual(acts(slot(o, 7)), ['ncs:call>C+B']);
  const s = end(o);
  assert.equal(logic.steps(P(o)), 12);
  assert.equal(s.backup.announced, null);
  assert.equal(logic.counts(s).doubled, 0);
  assert.ok(!s.events.some((e) => e.code === 'backup.takeover'));
});

test('T4: the NCS returning in the announcement slot doubles it; the backup hands back next', () => {
  const o = { ncsReturns: true, returnAt: 9 };
  const c = slot(o, 9);
  assert.equal(c.outcome, 'doubled');
  assert.deepEqual(acts(c), ['ncs:call>C+B', 'bncs:announce']);
  assert.equal(c.controller, 'both');
  assert.deepEqual(acts(slot(o, 10)), ['bncs:handback']);
  assert.equal(at(o, 10).backup.active, false);
});

test('T5: a backup without a log never ACKs a message it did not hear', () => {
  const s = end(PRESETS['no-log']);
  assert.equal(st(s, 'B').deliveredAt, 4);
  assert.equal(st(s, 'B').ackedAt, null);
  assert.equal(slot(PRESETS['no-log'], 15).acts[0].ack, null, 'first call after check-in carries no ACK');
});

test('T6: alphabetical calling and check-in order; nobody already in the log is called', () => {
  const s = end(PRESETS['no-log']);
  const ci = s.channel.filter((c) => c.kind === 'checkin').map((c) => c.tx[0]);
  assert.deepEqual(ci, ['A', 'B', 'C', 'D', 'E']);
  const calls = s.channel.flatMap((c) => c.acts).filter((a) => a.kind === 'call').map((a) => a.target);
  assert.deepEqual(calls, ['A', 'B', 'C', 'D', 'E']);
  assert.equal(logic.nextTarget(['A', 'C']), 'B');
  assert.equal(logic.nextTarget(['A', 'B', 'C', 'D', 'E']), null);
});

test('T7: an NCS back during a re-run check-in listens until the check-in ends, then both control slots double', () => {
  const o = { logging: false, ncsReturns: true, returnAt: 11 };
  const s = at(o, 16);
  for (let n = 11; n <= 14; n++) {
    assert.equal(s.channel[n - 1].kind, 'checkin', `slot ${n}`);
    assert.equal(s.channel[n - 1].controller, 'both', `slot ${n}`);
  }
  assert.equal(s.channel[14].outcome, 'doubled');
  assert.deepEqual(acts(s.channel[15]), ['bncs:handback']);
  assert.equal(logic.delivered(end(o)), 4, 'four of five at slot 20');
});

test('T8: a message only the passive backup logged is sent again for the returned NCS; the first delivery stays', () => {
  const o = { failAt: 4, ncsReturns: true, returnAt: 5 };
  assert.deepEqual(acts(slot(o, 5)), ['ncs:call>B'], 'no ACK: the NCS never heard B');
  assert.deepEqual(acts(slot(o, 6)), ['B:answer']);
  const s = end(o);
  assert.equal(st(s, 'B').deliveredAt, 4);
  assert.equal(st(s, 'B').ackedAt, 7);
});

test('the NCS logs and owes an ACK only for what it heard on the air', () => {
  const s = at({ failAt: 4 }, 4);
  assert.deepEqual(s.ncs.log, ['A']);
  assert.equal(s.ncs.ackDue, null, 'A was ACKed in 3; B was not heard by the NCS');
  assert.deepEqual(s.backup.log, ['A', 'B']);
});

test('the return slot is never before the slot after the failure', () => {
  assert.equal(logic.returnSlot(P({ ncsReturns: true, returnAt: 3 })), 6);
  assert.equal(logic.returnSlot(P({ ncsReturns: true, returnAt: 5, failAt: 5 })), 6);
  assert.equal(logic.returnSlot(P({ ncsReturns: true, returnAt: 7 })), 7);
  assert.equal(logic.returnSlot(P({ ncsReturns: false })), null);
  assert.equal(logic.ncsAlive(P({ ncsReturns: true, returnAt: 3 }), 5), false);
  assert.equal(logic.ncsAlive(P({ ncsReturns: true, returnAt: 3 }), 6), true);
});

test('rule 6: the hand-back passes the backup\'s log and its owed ACK to the NCS', () => {
  const o = { wait: 1, ncsReturns: true, returnAt: 9 };
  const c9 = slot(o, 9);
  assert.equal(c9.outcome, 'doubled');
  assert.deepEqual(acts(c9), ['ncs:call>C', 'bncs:call>D+C'], 'the NCS has not heard C; the backup has');
  assert.deepEqual(at(o, 10).ncs.log, ['A', 'B', 'C']);
  assert.deepEqual(acts(slot(o, 11)), ['ncs:call>D+C']);
});

test('rule 5: without a backup the net is down after 60 s, whatever the (hidden) wait setting', () => {
  const s = end({ backup: false, wait: 1 });
  assert.deepEqual(s.events.filter((e) => e.code === 'net.dead'), [{ slot: 8, code: 'net.dead' }]);
  assert.equal(logic.DEAD_AFTER * logic.SLOT_S, 60);
});

test('events: silence, return, takeover, doubling, hand-back, check-in', () => {
  const codes = (o) => end(o).events.map((e) => e.slot + ' ' + e.code);
  assert.deepEqual(codes(PRESETS.takeover), ['5 ncs.silent', '9 backup.takeover']);
  assert.deepEqual(codes(PRESETS['too-early']), ['5 ncs.silent', '6 backup.takeover', '7 ncs.return', '7 ncs.double', '8 backup.handback']);
  assert.deepEqual(codes(PRESETS['no-log']), ['5 ncs.silent', '9 backup.takeover', '10 checkin.rerun', '14 checkin.done']);
  assert.deepEqual(codes({ ncsReturns: true, returnAt: 7 }), ['5 ncs.silent', '7 ncs.return']);
});

test('check-in: each station records whether it had traffic when it checked in', () => {
  const s = end(PRESETS['no-log']);
  assert.deepEqual(s.stations.map((x) => [x.checkedIn, x.hadTraffic]),
    [[10, false], [11, false], [12, true], [13, true], [14, true]]);
  assert.equal(st(s, 'C').pending, false, 'C delivered later; its check-in answer stays "has a message"');
});

test('T3: the controller of the return slot is the NCS', () => {
  assert.equal(slot({ ncsReturns: true, returnAt: 7 }, 7).controller, 'ncs');
  assert.equal(slot({ ncsReturns: true, returnAt: 7 }, 6).controller, 'none');
});

// ── rules ──

test('rule 1: the passive backup never transmits and copies every message and ACK it hears', () => {
  const o = PRESETS.takeover;
  for (let n = 1; n <= 8; n++) assert.ok(!at(o, n).channel[n - 1].tx.includes('bncs'), `slot ${n}`);
  const s4 = at(o, 4);
  assert.deepEqual(s4.backup.log, ['A', 'B']);
  assert.equal(s4.backup.ackDue, 'B', 'A was ACKed by the NCS in 3, the backup heard it');
  // without logging it keeps nothing
  assert.deepEqual(at({ logging: false }, 4).backup.log, []);
});

test('rule 2: takeover after 60 s (4 slots) of silence, announced in one slot with the UTC time', () => {
  const o = PRESETS.takeover;
  assert.equal(at(o, 8).ncs.silence * logic.SLOT_S, 60);
  assert.equal(at(o, 8).backup.active, true);
  assert.equal(at(o, 7).backup.active, false);
  assert.deepEqual(acts(slot(o, 9)), ['bncs:announce']);
  assert.equal(at(o, 9).backup.takeoverUtc, '10:32:00');
  assert.deepEqual(logic.eventsAt(at(o, 9), 9), ['backup.takeover']);
  assert.equal(logic.utc(1), '10:30:00');
});

test('rule 3: while the NCS is silent and nobody controls, the channel stays idle', () => {
  const s = at(PRESETS.takeover, 8);
  for (let n = 5; n <= 8; n++) {
    assert.equal(s.channel[n - 1].outcome, 'idle', `slot ${n}`);
    assert.equal(s.channel[n - 1].controller, 'none');
  }
});

test('rule 4: with a log the backup resumes at the first undelivered message, with the ACK the NCS owed', () => {
  const o = PRESETS.takeover;
  assert.deepEqual(acts(slot(o, 10)), ['bncs:call>C+B']);
  const s = end(o);
  assert.equal(logic.steps(P(o)), 15);
  assert.equal(logic.delivered(s), 5);
  assert.deepEqual(s.stations.map((x) => x.deliveredAt), [2, 4, 11, 13, 15]);
  assert.equal(logic.counts(s).gap, 4, 'one 60 s gap');
});

test('rule 4: without a log the backup re-runs the check-in, one slot per station, then calls C', () => {
  const o = PRESETS['no-log'];
  const s = end(o);
  assert.equal(logic.steps(P(o)), 20);
  assert.deepEqual(s.channel.slice(9, 14).map((c) => c.kind), ['checkin', 'checkin', 'checkin', 'checkin', 'checkin']);
  assert.deepEqual(acts(s.channel[14]), ['bncs:call>C']);
  assert.deepEqual(s.stations.map((x) => x.deliveredAt), [2, 4, 16, 18, 20]);
  assert.deepEqual(logic.eventsAt(s, 10), ['checkin.rerun']);
});

test('rule 5: no backup → the net stops: nobody calls, nothing more is delivered', () => {
  const o = PRESETS['no-backup'];
  const s = end(o);
  assert.equal(logic.steps(P(o)), 15);
  assert.equal(logic.delivered(s), 2);
  for (let n = 5; n <= 15; n++) assert.equal(s.channel[n - 1].outcome, 'idle');
  assert.deepEqual(logic.eventsAt(s, 8), ['net.dead']);
  assert.equal(s.events.filter((e) => e.code === 'net.dead').length, 1);
  assert.equal(st(s, 'B').ackedAt, null);
});

test('rule 6: early takeover, the old NCS returns: both call C and double, the backup hands back', () => {
  const o = PRESETS['too-early'];
  assert.deepEqual(acts(slot(o, 6)), ['bncs:announce']);
  const c7 = slot(o, 7);
  assert.equal(c7.outcome, 'doubled');
  assert.deepEqual(acts(c7), ['ncs:call>C+B', 'bncs:call>C+B']);
  assert.equal(slot(o, 8).kind, 'control', 'C answers nobody in 8');
  assert.equal(at(o, 8).backup.active, false);
  assert.equal(at(o, 9).controller, 'ncs');
  const s = end(o);
  assert.equal(logic.steps(P(o)), 14);
  assert.deepEqual(s.stations.map((x) => x.deliveredAt), [2, 4, 10, 12, 14]);
  assert.equal(logic.counts(s).doubled, 1);
  // at slot 12 (the task file's end): 4 of 5 heard, 3 ACKed (SPEC.md "Deviation")
  const s12 = at(o, 12);
  assert.equal(logic.delivered(s12), 4);
  assert.equal(s12.stations.filter((x) => x.ackedAt !== null).length, 3);
});

test('controller band: ncs / none / backup / both', () => {
  assert.deepEqual(end(PRESETS.takeover).channel.map((c) => c.controller), [
    'ncs', 'ncs', 'ncs', 'ncs', 'none', 'none', 'none', 'none', 'backup', 'backup', 'backup', 'backup', 'backup', 'backup', 'backup']);
  assert.deepEqual(end(PRESETS['too-early']).channel.slice(4, 9).map((c) => c.controller), ['none', 'backup', 'both', 'both', 'ncs']);
});

test('steps: within the stepper limit for every param combination', () => {
  for (const failAt of [3, 4, 5, 6, 7, 8, 9, 10]) {
    for (const backup of [true, false]) for (const logging of [true, false]) for (const wait of [1, 4]) {
      for (const ncsReturns of [false, true]) for (const returnAt of [4, 7, 12, 20]) {
        const p = P({ failAt, backup, logging, wait, ncsReturns, returnAt });
        const n = logic.steps(p);
        assert.ok(n >= 1 && n <= 20, JSON.stringify(p));
        const s = kit.stateAt(logic, p, n);
        assert.ok(logic.delivered(s) <= 5);
        // never two controllers for long: a doubling is always followed by a hand-back
        s.channel.forEach((c, i) => {
          if (c.outcome === 'doubled' && s.channel[i + 1]) assert.deepEqual(s.channel[i + 1].acts.map((a) => a.kind), ['handback'], JSON.stringify(p));
        });
      }
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS)) {
    for (let n = 0; n <= logic.steps(P(o)); n++) {
      const s = at(o, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(PRESETS['too-early']);
  const N = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= N; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = N; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P(PRESETS['too-early']);
  const s6 = kit.stateAt(logic, p, 6);
  const copy = structuredClone(s6);
  logic.step(s6, 7, p);
  assert.deepEqual(s6, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model; meta.steps equals steps(defaults)', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  for (const id of Object.keys(PRESETS)) {
    assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
    assert.ok(json.entries.some((e) => e.preset === id), `preset ${id} in sim.json entries`);
  }
});
