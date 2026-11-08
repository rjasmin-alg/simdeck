// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for tcp-states: the rules of SPEC.md (tie-breaks first), the presets' numbers, then the template's generic
// block. Run: node --test sims/tcp-states/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const drive = (events) => P({ mode: 'drive', script: events.join(',') });
const run = (events, n) => kit.stateAt(logic, drive(events), n === undefined ? events.length : n);
const segs = (s) => s.chart.filter((r) => r.kind === 'seg');
const seg = (s, id) => segs(s).find((r) => r.id === id);
/** The segment this step sent (a call) or delivered. */
const lastSeg = (s) => seg(s, s.last.sent || s.last.seg);
const reply = (s) => seg(s, s.last.reply);
const fields = (g) => ({ flags: g.flags.join('+'), seq: g.seq, ack: g.ack, len: g.len });
const states = (s) => [s.ends.A.state, s.ends.B.state];

const OPEN = ['B:listen', 'A:open', 'deliver', 'deliver', 'deliver'];

// ── tie-breaks first ──

test('rule 8 tie-break: FIN-WAIT-1 + a FIN that also acks our FIN goes straight to TIME-WAIT', () => {
  const s = at({ combineFinAck: true }, 9);
  assert.equal(s.last.code, 'deliver');
  assert.deepEqual(fields(lastSeg(s)), { flags: 'FIN+ACK', seq: 9501, ack: 4002, len: 0 });
  assert.equal(lastSeg(s).finAck, true);
  assert.deepEqual(s.last.changes.A, { from: 'FIN-WAIT-1', to: 'TIME-WAIT', edge: 'fw1-finack' });
  assert.deepEqual(fields(reply(s)), { flags: 'ACK', seq: 4002, ack: 9502, len: 0 });
  assert.equal(logic.stepsFor(P({ combineFinAck: true })), 11, 'one step fewer than preset 1');
});

test('rule 8: FIN-WAIT-1 + a FIN that does not ack our FIN goes to CLOSING, not TIME-WAIT', () => {
  const s = at({ closer: 'both' }, 7);
  assert.deepEqual(fields(lastSeg(s)), { flags: 'FIN+ACK', seq: 4001, ack: 9501, len: 0 });
  assert.deepEqual(s.last.changes.B, { from: 'FIN-WAIT-1', to: 'CLOSING', edge: 'fw1-fin' });
  assert.deepEqual(fields(reply(s)), { flags: 'ACK', seq: 9502, ack: 4002, len: 0 });
});

test('combineFinAck: the ACK of the FIN is held in CLOSE-WAIT and rides on the FIN', () => {
  const s7 = at({ combineFinAck: true }, 7);
  assert.equal(s7.last.what, 'held');
  assert.equal(s7.last.reply, undefined);
  assert.equal(s7.ends.B.state, 'CLOSE-WAIT');
  assert.equal(s7.ends.B.ackOwed, true);
  const s8 = at({ combineFinAck: true }, 8);
  assert.equal(lastSeg(s8).finAck, true);
  assert.equal(s8.ends.B.ackOwed, false);
  // without the toggle B's FIN is a plain FIN (its ACK went alone in step 7)
  assert.equal(lastSeg(at({}, 9)).finAck, false);
  // drive mode ignores the toggle
  const d = kit.stateAt(logic, P({ mode: 'drive', combineFinAck: true, script: OPEN.concat(['A:close', 'deliver']).join(',') }), 7);
  assert.ok(d.last.reply);
});

test('one step changes at most one end, except both:close and a timeout with both in TIME-WAIT', () => {
  const cases = [{}, { closer: 'B' }, { halfCloseData: 2 }, { closer: 'both' }, { listen: false }, { combineFinAck: true },
    { combineFinAck: true, halfCloseData: 3, closer: 'B' }];
  for (const c of cases) {
    const p = P(c);
    for (let n = 1; n <= logic.stepsFor(p); n++) {
      const s = kit.stateAt(logic, p, n);
      const k = Object.keys(s.last.changes).length;
      if (s.last.code === 'both:close' || (s.last.code === 'timeout' && k === 2)) continue;
      assert.ok(k <= 1, `${JSON.stringify(c)} step ${n}: ${k} ends changed`);
    }
  }
  assert.equal(Object.keys(at({ closer: 'both' }, 6).last.changes).length, 2);
  assert.equal(Object.keys(at({ closer: 'both' }, 11).last.changes).length, 2);
});

test('delivery is FIFO: the oldest segment in flight arrives first', () => {
  const s = run(OPEN.concat(['A:send', 'A:send', 'deliver']));
  assert.equal(lastSeg(s).seq, 4001);
  assert.deepEqual(s.inFlight.map((id) => seg(s, id).seq), [4101, 9501].slice(0, s.inFlight.length));
});

// ── the rules ──

test('rule 1: CLOSED + passive OPEN → LISTEN, no segment', () => {
  const s = run(['B:listen']);
  assert.deepEqual(s.last.changes.B, { from: 'CLOSED', to: 'LISTEN', edge: 'open-passive' });
  assert.equal(segs(s).length, 0);
  assert.equal(s.inFlight.length, 0);
});

test('rule 2: CLOSED + active OPEN → SYN seq=ISN → SYN-SENT', () => {
  const s = run(['B:listen', 'A:open']);
  assert.deepEqual(fields(lastSeg(s)), { flags: 'SYN', seq: 4000, ack: null, len: 0 });
  assert.deepEqual(s.last.changes.A, { from: 'CLOSED', to: 'SYN-SENT', edge: 'open-active' });
  assert.equal(s.ends.A.sndNxt, 4001, 'the SYN takes one number');
});

test('rule 3: LISTEN + rcv SYN → SYN+ACK seq=ISN\' ack=SEG.SEQ+1 → SYN-RECEIVED', () => {
  const s = run(OPEN, 3);
  assert.deepEqual(fields(reply(s)), { flags: 'SYN+ACK', seq: 9500, ack: 4001, len: 0 });
  assert.deepEqual(s.last.changes.B, { from: 'LISTEN', to: 'SYN-RECEIVED', edge: 'listen-syn' });
  assert.equal(s.ends.A.state, 'SYN-SENT', 'only the receiver changes');
});

test('rule 4: SYN-SENT + rcv SYN+ACK → ACK → ESTABLISHED while B is still SYN-RECEIVED', () => {
  const s = run(OPEN, 4);
  assert.deepEqual(fields(reply(s)), { flags: 'ACK', seq: 4001, ack: 9501, len: 0 });
  assert.deepEqual(s.last.changes.A, { from: 'SYN-SENT', to: 'ESTABLISHED', edge: 'synsent-synack' });
  assert.deepEqual(states(s), ['ESTABLISHED', 'SYN-RECEIVED']);
});

test('rule 5: simultaneous open: SYN-SENT + rcv SYN → SYN+ACK → SYN-RECEIVED, then both ESTABLISHED with no third ACK', () => {
  const ev = ['A:open', 'B:open', 'deliver', 'deliver', 'deliver', 'deliver'];
  const s3 = run(ev, 3);
  assert.deepEqual(s3.last.changes.B, { from: 'SYN-SENT', to: 'SYN-RECEIVED', edge: 'synsent-syn' });
  assert.deepEqual(fields(reply(s3)), { flags: 'SYN+ACK', seq: 9500, ack: 4001, len: 0 });
  const s4 = run(ev, 4);
  assert.deepEqual(fields(reply(s4)), { flags: 'SYN+ACK', seq: 4000, ack: 9501, len: 0 });
  const s5 = run(ev, 5);
  assert.deepEqual(s5.last.changes.A, { from: 'SYN-RECEIVED', to: 'ESTABLISHED', edge: 'synrcvd-ack' });
  assert.equal(s5.last.reply, undefined);
  const s6 = run(ev);
  assert.deepEqual(states(s6), ['ESTABLISHED', 'ESTABLISHED']);
  assert.equal(s6.inFlight.length, 0);
  assert.deepEqual([s6.ends.A.sndNxt, s6.ends.A.rcvNxt, s6.ends.B.sndNxt, s6.ends.B.rcvNxt], [4001, 9501, 9501, 4001]);
});

test('rule 6: SYN-RECEIVED + rcv ACK of our SYN → ESTABLISHED, no reply', () => {
  const s = run(OPEN);
  assert.deepEqual(s.last.changes.B, { from: 'SYN-RECEIVED', to: 'ESTABLISHED', edge: 'synrcvd-ack' });
  assert.equal(s.last.reply, undefined);
  assert.deepEqual(states(s), ['ESTABLISHED', 'ESTABLISHED']);
});

test('rule 7: ESTABLISHED + CLOSE → FIN → FIN-WAIT-1; ESTABLISHED + rcv FIN → ACK → CLOSE-WAIT', () => {
  const s6 = at({}, 6);
  assert.deepEqual(fields(lastSeg(s6)), { flags: 'FIN+ACK', seq: 4001, ack: 9501, len: 0 });
  assert.equal(lastSeg(s6).finAck, false, 'the page writes FIN: its ack is not the ACK of a FIN');
  assert.deepEqual(s6.last.changes.A, { from: 'ESTABLISHED', to: 'FIN-WAIT-1', edge: 'estab-close' });
  const s7 = at({}, 7);
  assert.deepEqual(fields(reply(s7)), { flags: 'ACK', seq: 9501, ack: 4002, len: 0 });
  assert.deepEqual(s7.last.changes.B, { from: 'ESTABLISHED', to: 'CLOSE-WAIT', edge: 'estab-fin' });
});

test('rule 8: FIN-WAIT-1 + rcv ACK of our FIN → FIN-WAIT-2', () => {
  const s = at({}, 8);
  assert.deepEqual(s.last.changes.A, { from: 'FIN-WAIT-1', to: 'FIN-WAIT-2', edge: 'fw1-ack' });
  assert.equal(s.ends.A.finAcked, true);
  assert.equal(s.last.reply, undefined, 'a pure ACK is not answered');
});

test('rule 9: FIN-WAIT-2 + rcv FIN → ACK → TIME-WAIT; CLOSING + rcv ACK of FIN → TIME-WAIT', () => {
  const s10 = at({}, 10);
  assert.deepEqual(s10.last.changes.A, { from: 'FIN-WAIT-2', to: 'TIME-WAIT', edge: 'fw2-fin' });
  assert.deepEqual(fields(reply(s10)), { flags: 'ACK', seq: 4002, ack: 9502, len: 0 });
  const s9 = at({ closer: 'both' }, 9);
  assert.deepEqual(s9.last.changes.A, { from: 'CLOSING', to: 'TIME-WAIT', edge: 'closing-ack' });
});

test('rule 10: CLOSE-WAIT + CLOSE → FIN → LAST-ACK; LAST-ACK + rcv ACK of FIN → CLOSED', () => {
  const s9 = at({}, 9);
  assert.deepEqual(fields(lastSeg(s9)), { flags: 'FIN+ACK', seq: 9501, ack: 4002, len: 0 });
  assert.deepEqual(s9.last.changes.B, { from: 'CLOSE-WAIT', to: 'LAST-ACK', edge: 'cw-close' });
  const s11 = at({}, 11);
  assert.deepEqual(s11.last.changes.B, { from: 'LAST-ACK', to: 'CLOSED', edge: 'lastack-ack' });
  assert.deepEqual(states(s11), ['TIME-WAIT', 'CLOSED']);
});

test('rule 11: the timeout closes every end in TIME-WAIT; 2×MSL = 4 min, 60 s on many systems', () => {
  const s = at({}, 12);
  assert.deepEqual(s.last.changes.A, { from: 'TIME-WAIT', to: 'CLOSED', edge: 'tw-timeout' });
  assert.deepEqual(states(s), ['CLOSED', 'CLOSED']);
  assert.equal(2 * logic.MSL_S, 240);
  assert.equal(logic.SHORT_TW_S, 60);
  const none = run(OPEN.concat(['timeout']));
  assert.equal(none.last.ok, false);
  assert.equal(none.last.reason, 'noTimeWait');
  assert.deepEqual(states(none), ['ESTABLISHED', 'ESTABLISHED']);
});

test('rule 12: SYN and FIN take one number each, data its length, a pure ACK none', () => {
  assert.equal(logic.seqLen({ flags: ['SYN'] }), 1);
  assert.equal(logic.seqLen({ flags: ['FIN', 'ACK'] }), 1);
  assert.equal(logic.seqLen({ flags: ['ACK'], len: 100 }), 100);
  assert.equal(logic.seqLen({ flags: ['ACK'] }), 0);
  const s = at({ halfCloseData: 2 }, 13);
  assert.deepEqual(fields(reply(s)), { flags: 'ACK', seq: 4002, ack: 9701, len: 0 });
  assert.equal(logic.seqAdd(4294967295, 1), 0);
});

test('rule 13: a segment to a CLOSED end is answered with RST; SYN-SENT + that RST → CLOSED', () => {
  const s2 = at({ listen: false }, 2);
  assert.deepEqual(fields(reply(s2)), { flags: 'RST+ACK', seq: 0, ack: 4001, len: 0 });
  assert.equal(s2.ends.B.state, 'CLOSED');
  assert.deepEqual(s2.last.changes, {});
  const s3 = at({ listen: false }, 3);
  assert.deepEqual(s3.last.changes.A, { from: 'SYN-SENT', to: 'CLOSED', edge: 'synsent-rst' });
  // any synchronized state + a valid RST (seq = rcvNxt) → CLOSED; an RST with another seq is ignored
  const est = run(OPEN);
  const withRst = (seq) => {
    const s = structuredClone(est);
    s.chart.push({ kind: 'seg', id: 99, from: 'B', to: 'A', flags: ['RST'], seq, ack: null, len: 0, sent: 5, done: null, lost: false, outcome: null });
    s.inFlight.push(99);
    return logic.apply(s, 'deliver', 6, {});
  };
  assert.deepEqual(withRst(9501).last.changes.A, { from: 'ESTABLISHED', to: 'CLOSED', edge: 'rst' });
  assert.deepEqual(withRst(9700).last.changes, {});
  assert.equal(withRst(9501).last.reply, undefined, 'an RST is never answered');
});

test('rule 13: a lost segment changes nothing at the receiver; the sender stays', () => {
  const s = run(OPEN.concat(['A:close', 'lose']));
  assert.equal(lastSeg(s).lost, true);
  assert.deepEqual(s.last.changes, {});
  assert.deepEqual(states(s), ['FIN-WAIT-1', 'ESTABLISHED']);
  assert.equal(s.inFlight.length, 0);
  // the gap: the next segment from A is not the one B expects, so B drops it
  const g = run(OPEN.concat(['A:send', 'lose', 'A:close', 'deliver']));
  assert.equal(g.last.what, 'ignored');
  assert.equal(g.ends.B.state, 'ESTABLISHED');
});

test('rule 13: a segment with an ACK field to a CLOSED end gets <SEQ=SEG.ACK><CTL=RST>; SYN-RECEIVED + RST → LISTEN', () => {
  // A opens, closes before B answers (SYN-SENT + CLOSE → CLOSED), and then answers B's SYN+ACK with an RST
  const r = run(['B:listen', 'A:open', 'deliver', 'A:close', 'deliver']);
  assert.deepEqual(fields(reply(r)), { flags: 'RST', seq: 4001, ack: null, len: 0 });
  const s = run(['B:listen', 'A:open', 'deliver', 'A:close', 'deliver', 'deliver']);
  assert.deepEqual(s.last.changes.B, { from: 'SYN-RECEIVED', to: 'LISTEN', edge: 'synrcvd-rst' });
});

test('rule 14: illegal user calls are rejected with no state change and no segment', () => {
  const cases = [
    [['A:close'], 'noConn'], [['A:send'], 'noConn'], [['B:listen', 'B:listen'], 'exists'], [['B:listen', 'B:open'], 'exists'],
    [['B:listen', 'B:send'], 'notYet'], [['A:open', 'A:send'], 'notYet'], [OPEN.concat(['A:close', 'A:send']), 'closing'],
    [OPEN.concat(['A:close', 'A:close']), 'closing']
  ];
  for (const [ev, why] of cases) {
    const before = run(ev, ev.length - 1), s = run(ev);
    assert.equal(s.last.ok, false, ev.join(','));
    assert.equal(s.last.reason, why, ev.join(','));
    assert.deepEqual(s.ends, before.ends, ev.join(','));
    assert.deepEqual(segs(s), segs(before), ev.join(','));
    assert.equal(s.chart[s.chart.length - 1].code, 'rejected');
  }
});

test('CLOSE before the connection exists: LISTEN and SYN-SENT close without a segment, SYN-RECEIVED sends a FIN', () => {
  assert.deepEqual(run(['B:listen', 'B:close']).last.changes.B, { from: 'LISTEN', to: 'CLOSED', edge: 'listen-close' });
  assert.deepEqual(run(['A:open', 'A:close']).last.changes.A, { from: 'SYN-SENT', to: 'CLOSED', edge: 'synsent-close' });
  const s = run(['B:listen', 'A:open', 'deliver', 'B:close']);
  assert.deepEqual(s.last.changes.B, { from: 'SYN-RECEIVED', to: 'FIN-WAIT-1', edge: 'synrcvd-close' });
  assert.deepEqual(fields(lastSeg(s)), { flags: 'FIN+ACK', seq: 9501, ack: 4001, len: 0 });
});

test('half close: the end in CLOSE-WAIT still sends, the end in FIN-WAIT-2 still receives', () => {
  assert.equal(logic.canSend('CLOSE-WAIT'), true);
  assert.equal(logic.canSend('FIN-WAIT-2'), false);
  assert.equal(logic.canReceive('FIN-WAIT-2'), true);
  assert.equal(logic.canReceive('CLOSE-WAIT'), false);
  const s = at({ halfCloseData: 2 }, 10);
  assert.deepEqual(fields(lastSeg(s)), { flags: 'ACK', seq: 9501, ack: 4002, len: 100 });
  assert.equal(s.ends.A.rcvNxt, 9601);
});

test('rule 13: an RST is never answered; LISTEN ignores an RST and answers an ACK with <SEQ=SEG.ACK><CTL=RST>', () => {
  // A closes in SYN-SENT, then B's RST+ACK reaches A while it is CLOSED: no answer
  const closedRst = run(['A:open', 'deliver', 'A:close', 'deliver']);
  assert.equal(closedRst.last.what, 'ignored');
  assert.equal(closedRst.last.reply, undefined);
  const listenRst = run(['A:open', 'deliver', 'A:close', 'A:listen', 'deliver']);
  assert.equal(listenRst.ends.A.state, 'LISTEN');
  assert.equal(listenRst.last.what, 'ignored');
  assert.equal(listenRst.last.reply, undefined);
  // an ACK reaching a listening end (crafted: B back in LISTEN) gets <SEQ=SEG.ACK><CTL=RST>
  const est = run(OPEN);
  const s = structuredClone(est);
  s.ends.B = Object.assign(s.ends.B, { state: 'LISTEN', rcvNxt: null, sndNxt: 9500 });
  s.chart.push({ kind: 'seg', id: 99, from: 'A', to: 'B', flags: ['ACK'], seq: 4001, ack: 9501, len: 0, sent: 5, done: null, lost: false, outcome: null, became: null });
  s.inFlight.push(99);
  const r = logic.apply(s, 'deliver', 6, {});
  assert.deepEqual(fields(reply(r)), { flags: 'RST', seq: 9501, ack: null, len: 0 });
  assert.equal(r.ends.B.state, 'LISTEN');
});

test('rule 13: SYN-RECEIVED + RST after a simultaneous open → CLOSED; after a passive open → LISTEN with fresh numbers', () => {
  const act = run(['A:open', 'B:open', 'deliver', 'A:close', 'deliver', 'deliver', 'deliver', 'deliver']);
  assert.deepEqual(act.last.changes.B, { from: 'SYN-RECEIVED', to: 'CLOSED', edge: 'rst' });
  const pas = run(['B:listen', 'A:open', 'deliver', 'A:close', 'deliver', 'deliver']);
  assert.equal(pas.ends.B.rcvNxt, null);
  assert.equal(pas.ends.B.sndNxt, 9500);
  assert.equal(pas.ends.B.passive, true);
});

test('OPEN starts a fresh connection: a second open and close after a full close works', () => {
  const first = ['B:listen', 'A:open', 'deliver', 'deliver', 'deliver', 'A:close', 'deliver', 'deliver', 'B:close', 'deliver', 'deliver', 'timeout'];
  const again = first.concat(['B:listen', 'A:open', 'deliver', 'deliver', 'deliver', 'A:close', 'deliver']);
  const s = run(again);
  assert.deepEqual(s.last.changes.B, { from: 'ESTABLISHED', to: 'CLOSE-WAIT', edge: 'estab-fin' });
  assert.deepEqual(fields(reply(s)), { flags: 'ACK', seq: 9501, ack: 4002, len: 0 });
  const done = run(again.concat(['deliver', 'B:close', 'deliver', 'deliver', 'timeout']));
  assert.deepEqual(states(done), ['CLOSED', 'CLOSED']);
  assert.equal(run(['A:listen', 'A:close', 'A:open']).ends.A.passive, false);
});

test('SYN-RECEIVED + a FIN that acks our SYN (the handshake ACK lost): through ESTABLISHED to CLOSE-WAIT in one step', () => {
  const s = run(['B:listen', 'A:open', 'deliver', 'deliver', 'lose', 'A:close', 'deliver']);
  assert.deepEqual(s.last.changes.B, { from: 'SYN-RECEIVED', to: 'CLOSE-WAIT', edge: 'estab-fin', via: 'synrcvd-ack' });
  assert.equal(s.ends.B.via, 'synrcvd-ack');
  assert.deepEqual(fields(reply(s)), { flags: 'ACK', seq: 9501, ack: 4002, len: 0 });
  assert.equal(run(OPEN).ends.B.via, null);
});

test('rule 14: SEND in SYN-RECEIVED is rejected', () => {
  const s = run(['B:listen', 'A:open', 'deliver', 'B:send']);
  assert.equal(s.last.ok, false);
  assert.equal(s.last.reason, 'notYet');
});

test('chart: notes for calls without a segment and for the timeout; deliveries record the outcome and the new state', () => {
  const s = at({}, 12);
  const notes = s.chart.filter((r) => r.kind === 'note').map((r) => `${r.lane}:${r.code}@${r.at}`);
  assert.deepEqual(notes, ['B:listen@1', 'A:timeout@12']);
  assert.deepEqual(segs(s).map((g) => [g.sent, g.done]), [[2, 3], [3, 4], [4, 5], [6, 7], [7, 8], [9, 10], [10, 11]]);
  assert.deepEqual(segs(s).map((g) => g.became), ['SYN-RECEIVED', 'ESTABLISHED', 'ESTABLISHED', 'CLOSE-WAIT', 'FIN-WAIT-2', 'TIME-WAIT', 'CLOSED']);
  assert.equal(at({ combineFinAck: true }, 7).chart.filter((r) => r.kind === 'seg')[3].outcome, 'held');
  assert.deepEqual(run(['B:listen', 'B:close']).chart.map((r) => r.code), ['listen', 'close']);
});

// ── presets (SPEC.md) ──

const PRESETS = {
  'book-open-close': {},
  'server-closes': { closer: 'B' },
  'half-close': { halfCloseData: 2 },
  'simultaneous-close': { closer: 'both' },
  'closed-port': { listen: false }
};

test('preset step counts: 12, 12, 18, 11, 3; the default is preset 1 and sim.json steps', () => {
  assert.deepEqual(Object.values(PRESETS).map((o) => logic.stepsFor(P(o))), [12, 12, 18, 11, 3]);
  assert.equal(logic.stepsFor(P({})), logic.steps);
  assert.equal(require('./sim.json').steps, logic.steps);
  assert.equal(logic.stepsFor(P({ halfCloseData: 3 })), 21);
  assert.equal(logic.stepsFor(P({ mode: 'drive' })), 0);
});

test('preset book-open-close: every segment and both states after each step', () => {
  const want = [
    [null, 'CLOSED', 'LISTEN'], ['SYN 4000 -', 'SYN-SENT', 'LISTEN'], ['SYN+ACK 9500 4001', 'SYN-SENT', 'SYN-RECEIVED'],
    ['ACK 4001 9501', 'ESTABLISHED', 'SYN-RECEIVED'], [null, 'ESTABLISHED', 'ESTABLISHED'], ['FIN+ACK 4001 9501', 'FIN-WAIT-1', 'ESTABLISHED'],
    ['ACK 9501 4002', 'FIN-WAIT-1', 'CLOSE-WAIT'], [null, 'FIN-WAIT-2', 'CLOSE-WAIT'], ['FIN+ACK 9501 4002', 'FIN-WAIT-2', 'LAST-ACK'],
    ['ACK 4002 9502', 'TIME-WAIT', 'LAST-ACK'], [null, 'TIME-WAIT', 'CLOSED'], [null, 'CLOSED', 'CLOSED']
  ];
  want.forEach(([g, a, b], i) => {
    const s = at({}, i + 1);
    const out = s.last.reply ? reply(s) : s.last.sent ? lastSeg(s) : null;
    assert.equal(out ? `${out.flags.join('+')} ${out.seq} ${out.ack === null ? '-' : out.ack}` : null, g, `step ${i + 1}`);
    assert.deepEqual(states(s), [a, b], `step ${i + 1}`);
  });
});

test('preset server-closes: B passes FIN-WAIT and holds TIME-WAIT, A passes CLOSE-WAIT and LAST-ACK', () => {
  const seen = { A: new Set(), B: new Set() };
  for (let n = 6; n <= 12; n++) { const s = at({ closer: 'B' }, n); seen.A.add(s.ends.A.state); seen.B.add(s.ends.B.state); }
  assert.deepEqual([...seen.A], ['ESTABLISHED', 'CLOSE-WAIT', 'LAST-ACK', 'CLOSED']);
  assert.deepEqual([...seen.B], ['FIN-WAIT-1', 'FIN-WAIT-2', 'TIME-WAIT', 'CLOSED']);
  assert.deepEqual(fields(lastSeg(at({ closer: 'B' }, 6))), { flags: 'FIN+ACK', seq: 9501, ack: 4001, len: 0 });
  assert.deepEqual(fields(reply(at({ closer: 'B' }, 10))), { flags: 'ACK', seq: 9502, ack: 4002, len: 0 });
  assert.deepEqual(states(at({ closer: 'B' }, 11)), ['CLOSED', 'TIME-WAIT']);
});

test('preset half-close: B sends 9501 and 9601, A acks 9601 and 9701, B\'s FIN is 9701, A acks 9702', () => {
  const p = { halfCloseData: 2 };
  assert.deepEqual(fields(lastSeg(at(p, 9))), { flags: 'ACK', seq: 9501, ack: 4002, len: 100 });
  assert.equal(reply(at(p, 10)).ack, 9601);
  assert.deepEqual(fields(lastSeg(at(p, 12))), { flags: 'ACK', seq: 9601, ack: 4002, len: 100 });
  assert.equal(reply(at(p, 13)).ack, 9701);
  assert.deepEqual(fields(lastSeg(at(p, 15))), { flags: 'FIN+ACK', seq: 9701, ack: 4002, len: 0 });
  assert.deepEqual(fields(reply(at(p, 16))), { flags: 'ACK', seq: 4002, ack: 9702, len: 0 });
  for (let n = 9; n <= 14; n++) assert.deepEqual(states(at(p, n)), ['FIN-WAIT-2', 'CLOSE-WAIT'], `step ${n}`);
});

test('preset simultaneous-close: both FIN-WAIT-1 → CLOSING → TIME-WAIT, then both CLOSED', () => {
  const p = { closer: 'both' };
  const s6 = at(p, 6);
  assert.deepEqual(states(s6), ['FIN-WAIT-1', 'FIN-WAIT-1']);
  assert.deepEqual(s6.inFlight.map((id) => fields(seg(s6, id))), [
    { flags: 'FIN+ACK', seq: 4001, ack: 9501, len: 0 }, { flags: 'FIN+ACK', seq: 9501, ack: 4001, len: 0 }]);
  assert.deepEqual(states(at(p, 8)), ['CLOSING', 'CLOSING']);
  assert.deepEqual(fields(reply(at(p, 8))), { flags: 'ACK', seq: 4002, ack: 9502, len: 0 });
  assert.deepEqual(states(at(p, 10)), ['TIME-WAIT', 'TIME-WAIT']);
  assert.deepEqual(states(at(p, 11)), ['CLOSED', 'CLOSED']);
});

test('drive mode: the events are the script, capped; extend drops later events', () => {
  const p = drive(['B:listen', 'A:open', 'deliver']);
  assert.equal(logic.stepsFor(p), 3);
  assert.equal(logic.extend(p, 1, 'A:close'), 'B:listen,A:close');
  const long = drive(Array(40).fill('A:open'));
  assert.equal(logic.stepsFor(long), logic.MAX_DRIVE);
  const s = run(['B:listen']);
  assert.equal(logic.canAdd(s, 'deliver'), false);
  assert.equal(logic.canAdd(s, 'timeout'), false);
  assert.equal(logic.canAdd(run(['A:open']), 'lose'), true);
  assert.equal(logic.canAdd(at({}, 11), 'timeout'), true);
});

// ── generic checks every sim keeps ──

const ALL = [{}, { closer: 'B' }, { halfCloseData: 2 }, { closer: 'both' }, { listen: false }, { combineFinAck: true },
  { mode: 'drive', script: 'A:open,B:open,deliver,lose,A:close,deliver,B:send,timeout' }];

test('state is JSON-safe at every step', () => {
  for (const o of ALL) {
    const p = P(o);
    for (let n = 0; n <= logic.stepsFor(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of ALL) {
    const p = P(o), forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.stepsFor(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.stepsFor(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ closer: 'both' });
  const s5 = kit.stateAt(logic, p, 5);
  const copy = structuredClone(s5);
  logic.step(s5, 6, p);
  assert.deepEqual(s5, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and the page has the task\'s five plus drive', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)'/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS).concat(['drive']));
});
