// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for priority-traffic's model (SPEC.md). Run: node --test sims/priority-traffic/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const msg = (s, from, prio) => s.messages.find((m) => m.from === from && (!prio || m.prio === prio));
/** The strip as short codes: "A" a message, "A-" one not heard, "!D" a break-in, "?D" the go-ahead, "+X" an ACK,
    ">X" a call, "~" no ACK, "E>F" relay, "F+E" relay ACK, "R+"/"R-" restriction on/off, "." idle. */
const strip = (s) => s.ncs.log.slice(1).map((e) => {
  const who = (id) => s.messages.find((m) => m.id === id).from;
  if (e.kind === 'msg') return e.who + (e.heard ? '' : '-');
  if (e.kind === 'breakin') return '!' + e.who;
  if (e.kind === 'goahead') return '?' + e.to;
  if (e.kind === 'noack') return '~';
  if (e.kind === 'relay') return e.who + '>' + e.to;
  if (e.kind === 'relayAck') return e.who + '+' + e.to;
  if (e.kind === 'idle') return '.';
  return e.acks.map((id) => '+' + who(id)).join('') + (e.announce ? (e.announce === 'on' ? 'R+' : 'R-') : '') + (e.call ? '>' + who(e.call) : '');
}).join(' ');
const PRESETS = {
  emergency: {},
  fifo: { priorities: false },
  'four-priority': { inject: '-2AI.-1BR.0CP.0DP.0EP.0FP' },
  'no-ack': { inject: '0ER', cutoff: 'E' }
};

// ── tie-breaks first ──

test('T1 (rule 1): messages registered in the same slot are queued in call-sign order, whatever the order written', () => {
  const s = at({ inject: '0FP.0DP.0EP.0CP' }, 0);
  assert.deepEqual([s.ncs.current.msgId, ...s.ncs.queue.map((e) => e.msgId)].map((id) => logic.msgOf(s, id).from), ['C', 'D', 'E', 'F']);
  assert.deepEqual(logic.injectsOf({ inject: '2BR.1FR.2AR' }).map((x) => x.from), ['F', 'A', 'B'], 'slot first, then call sign');
  // the same in plain FIFO, and for a mid-run registration
  assert.equal(strip(end({ priorities: false, inject: '0AR.1DR.1CR' })), 'A +A>C C +C>D D +D');
});

test('T2 (rule 1): within a priority the first registered is served first, not the first by call sign', () => {
  assert.equal(strip(end({ inject: '0AR.1FR.2BR' })), 'A +A>F F +F>B B +B');
});

test('T3 (rule 3): two HITNO in one slot: the first by call sign breaks in, the other waits at the front, not cut', () => {
  const s = end({ inject: '0AR.0BR.2DH.2CH' });
  assert.equal(strip(s), 'A !C ?C C +A+C>D D +D>B B +B');
  assert.ok(!msg(s, 'C').interrupted && !msg(s, 'D').interrupted);
});

test('T4 (rule 3): a HITNO does not cut another HITNO; it waits behind it and is called with the first one\'s ACK', () => {
  assert.equal(strip(end({ inject: '0AR.1DH.2EH' })), '!D ?D D +D>E E +E>A A +A');
  assert.equal(msg(end({ inject: '0AR.1DH.2EH' }), 'A').interrupted, true);
});

// ── rule 1: order of service ──

test('rule 1: HITNO > PRIORITET > RUTINSKO > INFORMATIVNO, whatever the registration order', () => {
  const s = end({ inject: '-3AI.-2BR.-1CP.0DH' });
  assert.equal(strip(s), 'D +D>C C +C>B B +B>A A +A');
});

test('rule 1: a registration lands after the last message of its own or a higher priority', () => {
  const s = at({ inject: '0AR.0BR.0CI.1DP' }, 1);
  assert.deepEqual(s.ncs.queue.map((e) => e.from + e.prio), ['DPRI', 'BRUT', 'CINF']);
  const f = at({ priorities: false, inject: '0AR.0BR.0CI.1DP' }, 1);
  assert.deepEqual(f.ncs.queue.map((e) => e.from + e.prio), ['BRUT', 'CINF', 'DPRI'], 'priorities off: plain FIFO');
});

// ── rule 2: INFORMATIVNO only when nothing else waits ──

test('rule 2 (preset four-priority): INF registered first still goes last; A delivered in slot 12', () => {
  const s = end(PRESETS['four-priority']);
  assert.equal(strip(s), 'C +C>D D +D>E E +E>F F +F>B B +B>A A +A');
  assert.deepEqual(['C', 'D', 'E', 'F', 'B', 'A'].map((x) => msg(s, x).deliveredAt), [2, 4, 6, 8, 10, 12]);
});

test('rule 2: an INF waiting is passed over by a later routine message', () => {
  assert.equal(strip(end({ inject: '0AR.0BI.1CR' })), 'A +A>C C +C>B B +B');
});

// ── rule 3: HITNO preempts ──

test('rule 3 (preset emergency): D cuts B in slot 3, D ACKed in 6, B resent 7–8, C 9–10', () => {
  const s = end(PRESETS.emergency);
  assert.equal(logic.steps(P(PRESETS.emergency)), 10);
  assert.equal(strip(s), 'A +A>B !D ?D D +D>B B +B>C C +C');
  assert.deepEqual(s.ncs.log[3].cut, { msgId: msg(s, 'B').id, phase: 'send' });
  assert.equal(msg(s, 'D').deliveredAt, 6);
  assert.equal(msg(s, 'B').interrupted, true);
  assert.equal(msg(s, 'B').deliveredAt, 8);
  assert.equal(msg(s, 'C').deliveredAt, 10);
});

test('rule 3: the cut message goes back to the front of its priority, not to the back or the head of the queue', () => {
  const s = at({ inject: '0AR.0BR.0CR.0EP.3DH' }, 3);   // E (PRI) first: 1 E, 2 +E>A, 3 A cut
  assert.deepEqual(s.ncs.queue.map((e) => e.from), ['A', 'B', 'C']);
  const t = at({ inject: '0AR.0BR.0CP.4EP.5DH' }, 5);   // 1 C, 2 +C>A, 3 A, 4 +A>B, 5 B cut; E (PRI) waits
  assert.deepEqual(t.ncs.queue.map((e) => e.from), ['E', 'B']);
});

test('rule 3: a break-in during an ACK slot cuts the ACK; it is owed and rides on the HITNO\'s ACK', () => {
  const s = end({ inject: '0AR.0BR.2CH' });
  assert.equal(strip(s), 'A !C ?C C +A+C>B B +B');
  assert.equal(s.ncs.log[2].cut.phase, 'ack');
  assert.equal(at({ inject: '0AR.0BR.2CH' }, 4).ncs.ackOwed.length, 1);
  assert.equal(msg(s, 'A').deliveredAt, 5, 'not delivered in slot 2: its ACK was cut');
  assert.equal(msg(s, 'A').interrupted, false, 'heard, so not resent');
});

test('rule 3: a HITNO on an idle net still breaks in, gets the go-ahead next slot: 4 slots, wait 0', () => {
  assert.equal(strip(end({ inject: '0AR.4DH' })), 'A +A . !D ?D D +D');
});

test('rule 3: with priorities off a HITNO does not break in; it waits its turn (preset fifo: delivered in 8)', () => {
  const s = end(PRESETS.fifo);
  assert.equal(logic.steps(P(PRESETS.fifo)), 8);
  assert.equal(strip(s), 'A +A>B B +B>C C +C>D D +D');
  assert.equal(msg(s, 'D').deliveredAt, 8);
  assert.ok(s.messages.every((m) => !m.interrupted));
});

test('rule 3: a HITNO from a station the NCS cannot hear does not break in; it queues first and retries, then relays', () => {
  const s = end({ cutoff: 'D' });
  assert.equal(strip(s), 'A +A>B B +B>D D- ~ D- ~ D- ~ D>C C+D C +D>C C +C');
  assert.equal(s.ncs.log.filter((e) => e.kind === 'breakin').length, 0);
  assert.equal(msg(s, 'D').tries, 3, 'a HITNO counts its tries too');
  assert.equal(msg(s, 'D').via, 'C');
});

test('rule 3: a later HITNO does not jump an older waiting one, and a waiting HITNO goes before an announcement', () => {
  const s = end({ inject: '0AR.3DH.4CH.7BH', restrict: '5' });
  assert.equal(strip(s), 'A +A !D ?D D +D>C C +C>B B +BR+');
  assert.deepEqual(['D', 'C', 'B'].map((x) => msg(s, x).deliveredAt), [6, 8, 10]);
  // a waiting HITNO (here from a station the NCS cannot hear) is not jumped by a later one that could break in
  const w = end({ cutoff: 'D', inject: '0AR.0BR.3DH.4CH' });
  assert.equal(w.ncs.log.filter((e) => e.kind === 'breakin').length, 0);
  assert.equal(strip(w).split(' ').slice(0, 4).join(' '), 'A +A>B B +B>D');
});

test('rule 3: a break-in in a no-ACK slot cuts nothing on the air: the exchange is suspended, back to the front', () => {
  const s3 = at({ inject: '0ER.1AR.2DH', cutoff: 'E' }, 2);
  assert.deepEqual(s3.ncs.log[2].cut, { msgId: msg(s3, 'E').id, phase: 'wait' });
  assert.deepEqual(s3.ncs.queue.map((e) => e.from), ['E', 'A'], 'not lost, at the front of RUT');
  assert.equal(msg(s3, 'E').interrupted, false);
  assert.equal(strip(end({ inject: '0ER.2DH', cutoff: 'E' })), 'E- !D ?D D +D>E E- ~ E- ~ E>F F+E F +E');
});

test('rule 3: a break-in during the relay\'s ACK: the relay already holds the message and sends it when called', () => {
  const s = end({ inject: '0ER.8DH', cutoff: 'E' });
  assert.equal(strip(s), 'E- ~ E- ~ E- ~ E>F !D ?D D +D>E F +E');
  assert.equal(msg(s, 'E').via, 'F');
});

test('rule 3: an owed ACK is delivered only in the HITNO\'s ACK slot, not in the go-ahead', () => {
  for (const n of [2, 3, 4]) assert.equal(msg(at({ inject: '0AR.0BR.2CH' }, n), 'A').delivered, false, 'slot ' + n);
  assert.equal(msg(at({ inject: '0AR.0BR.2CH' }, 5), 'A').deliveredAt, 5);
});

test('rule 3: a break-in on an idle net that would have called someone reports the NCS cut; the call follows later', () => {
  const s = end({ inject: '0AR.4BR.4DH' });
  assert.equal(strip(s), 'A +A . !D ?D D +D>B B +B');
  assert.deepEqual(s.ncs.log[4].cut, { msgId: null, phase: 'ncs' });
  assert.equal(at({ inject: '0AR.4DH' }, 4).ncs.log[4].cut, null, 'nothing to cut');
});

// ── rule 4: restriction ──

test('rule 4: "PROMET SAMO PRIORITET I HITNO" takes the NCS\'s next transmission instead of the call; RUT and INF wait', () => {
  const s = end({ inject: '0AP.0BR.0CI.3DP', restrict: '1' });
  assert.equal(strip(s).split(' ').slice(0, 6).join(' '), 'A +AR+ >D D +D .');
  assert.equal(logic.steps(P({ inject: '0AP.0BR.0CI.3DP', restrict: '1' })), 20, 'never settles while RUT and INF wait');
  assert.ok(s.ncs.restricted);
  assert.deepEqual(s.ncs.queue.map((e) => e.from), ['B', 'C']);
});

test('rule 4: a second announcement lifts it; one requested during a send waits for the NCS\'s turn', () => {
  const s = end({ inject: '0AP.0BR', restrict: '1.5' });
  assert.equal(strip(s), 'A +AR+ . . R- >B B +B');
  assert.equal(s.ncs.restricted, false);
  assert.equal(strip(end({ inject: '0AR.0BR', restrict: '1.2' })), 'A +A>B B +B', 'two requests before airing cancel');
});

test('rule 4: an announcement requested during a HITNO (or in its break-in slot) rides on the HITNO\'s ACK, not lost', () => {
  assert.equal(strip(end({ inject: '0AR.0BR.2CH', restrict: '3' })).split(' ').slice(0, 6).join(' '), 'A !C ?C C +A+CR+ .');
  assert.equal(strip(end({ inject: '0AR.3DH', restrict: '3' })), 'A +A !D ?D D +DR+');
});

test('rule 4: the restriction holds with priorities off too (FIFO among PRIORITET and HITNO)', () => {
  const s = end({ priorities: false, inject: '0AR.0BR.0CP', restrict: '1' });
  assert.equal(strip(s).split(' ').slice(0, 6).join(' '), 'A +AR+ >C C +C .');
  assert.equal(msg(s, 'B').delivered, false);
});

test('rule 4: a HITNO breaks in under the restriction too', () => {
  assert.equal(strip(end({ inject: '0AP.0BR.4DH', restrict: '1.9' })).split(' ').slice(0, 7).join(' '), 'A +AR+ . !D ?D D +D');
});

// ── rule 5: ACK and retries ──

test('rule 5: delivered only in the ACK slot, never in the slot the NCS heard the message', () => {
  const s1 = at({}, 1);
  assert.equal(msg(s1, 'A').delivered, false);
  assert.equal(s1.ncs.current.phase, 'ack');
  assert.equal(msg(at({}, 2), 'A').deliveredAt, 2);
});

test('rule 5 (preset no-ack): E sends 1, 3, 5 without an ACK; 7 E→F, 8 F ACKs, 9 "E via F", 10 delivered', () => {
  const s = end(PRESETS['no-ack']);
  assert.equal(logic.steps(P(PRESETS['no-ack'])), 10);
  assert.equal(strip(s), 'E- ~ E- ~ E- ~ E>F F+E F +E');
  const m = msg(s, 'E');
  assert.equal(m.tries, 3);
  assert.equal(m.via, 'F');
  assert.equal(m.deliveredAt, 10);
  assert.deepEqual([1, 3, 5].map((n) => at(PRESETS['no-ack'], n).messages[0].tries), [1, 2, 3]);
});

test('rule 5: two failed tries are not enough; the third sends to the relay', () => {
  assert.equal(at(PRESETS['no-ack'], 4).ncs.current.phase, 'send');
  assert.equal(at(PRESETS['no-ack'], 6).ncs.current.phase, 'relay');
});

test('rule 5: if the relay cannot reach the NCS either, the message leaves for another channel, undelivered', () => {
  const s = end({ inject: '0ER.1AR', cutoff: 'EF' });
  const e = msg(s, 'E');
  assert.equal(e.offChannel, true);
  assert.equal(e.delivered, false);
  assert.equal(strip(s), 'E- ~ E- ~ E- ~ >A A +A');
});

// ── rule 6: relay ──

test('rule 6: relays are pairs A↔B, C↔D, E↔F; the relay keeps the sender\'s priority and its turn', () => {
  assert.deepEqual(logic.IDS.map((x) => logic.RELAYS[x]).join(''), 'BADCFE');
  const s = end({ inject: '0BP.0AR', cutoff: 'B' });
  assert.equal(strip(s), 'B- ~ B- ~ B- ~ B>A A+B A +B>A A +A');
  assert.equal(msg(s, 'B').via, 'A');
  assert.equal(msg(s, 'B').prio, 'PRI');
});

test('rule 6: a relayed message cut by a HITNO goes back with its relay and is sent by the relay when called', () => {
  const s = end({ inject: '0ER.9DH', cutoff: 'E' });   // 9 is F's "E via F"
  assert.equal(strip(s), 'E- ~ E- ~ E- ~ E>F F+E !D ?D D +D>E F +E');
  assert.equal(msg(s, 'E').via, 'F');
});

test('rule 6: a message cut after three failed tries goes to the relay when called again', () => {
  assert.equal(strip(end({ inject: '0ER.7DH', cutoff: 'E' })), 'E- ~ E- ~ E- ~ !D ?D D +D>E E>F F+E F +E');
});

// ── params and steps ──

test('steps: the task\'s 10, 8, 12, 10; sim.json\'s 10 is the defaults; never more than 20, never 0', () => {
  assert.deepEqual(Object.values(PRESETS).map((o) => logic.steps(P(o))), [10, 8, 12, 10]);
  assert.equal(logic.steps(P({})), 10);
  assert.equal(logic.steps(P({ inject: '' })), 1);
  assert.equal(logic.steps(P({ inject: '0AR.0BR.0CR.0DR.0ER.0FR.0AR.0BR.0CR.0DR.0ER' })), 20);
  assert.equal(logic.steps(P({ inject: '0AR.12BI' })), 14, 'runs on to a later injection');
});

test('inject tokens: invalid ones ignored, at most 12, slots −9…19; duplicates are separate messages', () => {
  assert.deepEqual(logic.injectsOf({ inject: 'x.0GR.0Ax.20AR.-10AR.19AR.0aR.3AR.3AR' }).map((x) => x.slot + x.from + x.prio), ['3ARUT', '3ARUT', '19ARUT']);
  assert.equal(logic.injectsOf({ inject: Array(15).fill('1AR').join('.') }).length, 12);
  assert.equal(logic.token(4, 'D', 'HIT'), '4DH');
  assert.deepEqual(logic.restrictsOf({ restrict: '5.1.5.x.0.20.3' }), [1, 3, 5]);
  assert.deepEqual(logic.restrictsOf({ restrict: '1.2.3.4.5.6.7.8' }), [1, 2, 3, 4, 5, 6], 'at most 6');
  const s = end({ inject: '0AR.0AR' });
  assert.equal(s.messages.filter((m) => m.delivered).length, 2);
});

// ── generic checks every sim keeps ──

const ALL = Object.values(PRESETS).concat([{ inject: '0AR.0BR.2CH.2DH.4EP.6FI', restrict: '3.11', cutoff: 'C' }]);

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
    const p = P(o), N = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= N; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = N; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const o of ALL) {
    const p = P(o);
    let s = logic.initial(p);
    for (let n = 1; n <= 6; n++) {
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

test('every preset in the page is valid for the model; meta.steps matches', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const ids = [...html.matchAll(/\{ id: '([\w-]+)'/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS));
});
