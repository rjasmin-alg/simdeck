// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for hidden-node's model. Run: node --test sims/hidden-node/sim.test.js
// The scenario is the URM book's ch. 17, Primjer 1 (17-bezicne-mreze.md): A and C both hear the access point B, not
// each other; without RTS/CTS they collide at B and neither notices; with RTS/CTS, C hears the CTS from B, sets its
// NAV and does not send. Slot lengths, the start slots and the fixed waits are simdeck's (sim.js, NOTES.md).
// Tie-breaks and edges first, then the rules, then the book's scenario, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps);
const ALL = [false, true].flatMap((rts) => [false, true].map((hear) => ({ rts, hear })));
// one letter per slot: what x sends (R C D A) or N for a NAV in force, . otherwise
const row = (s, x) => s.slots.map((c) => (c.sends[x] ? c.sends[x].kind[0] : c.nav[x] ? 'N' : '.')).join('');
// what B hears: the sender's letter, X for a collision, - while B sends, . for silence
const atB = (s) => s.slots.map((c) => (c.sends.B ? '-' : c.collide ? 'X' : c.heard.B[0] || '.')).join('');
const events = (over, n, e) => at(over, n).events.filter((x) => x.e === e);

// ── tie-breaks and edges ──

test('a reply starts at once, a new attempt only after a quiet slot (SIFS before DIFS)', () => {
  // A and C hear each other: A's DATA 1–3, B's ACK in 4; C (ready from 3) defers in 3, 4 and 5 and starts in 6
  const s = end({ hear: true });
  assert.equal(row(s, 'A'), 'DDD.............');
  assert.equal(row(s, 'B'), '...A....A.......');
  assert.equal(row(s, 'C'), '.....DDD........');
  // slot 5: the medium is quiet now, but slot 4 carried B's ACK, so C still waits
  assert.deepEqual(events({ hear: true }, 5, 'defer'), [{ e: 'defer', who: 'C', why: 'busy' }]);
});

test('two stations decide from the slot before only: two starts in one slot do not see each other', () => {
  // C ready in slot 1 too (not a preset): even when A and C hear each other, both start in slot 1 and collide at B
  const p = P({ hear: true });
  let s = logic.initial(p);
  s.sta.C.ready = 1;
  s = logic.step(s, 1, p);
  assert.deepEqual(s.events.filter((e) => e.e === 'start').map((e) => e.who), ['A', 'C']);
  assert.equal(s.slots[0].collide, true);
  // in the book, C decides in slot 3 on slot 2, where it heard nothing
  assert.deepEqual(at({}, 3).slots[1].heard.C, []);
  assert.deepEqual(events({}, 3, 'start'), [{ e: 'start', who: 'C', kind: 'DATA', k: 1 }]);
});

test('a station that was sending in the slot before has not heard the medium idle', () => {
  // crafted (not reachable from a preset): A's DATA is on air in slot 1 and A also has a new frame from slot 2
  const p = P();
  let s = logic.step(logic.initial(p), 1, p);
  s.sta.A.phase = 'wait';
  s.sta.A.ready = 2;
  s = logic.step(s, 2, p);
  assert.deepEqual(s.events.filter((e) => e.who === 'A'), [{ e: 'defer', who: 'A', why: 'busy' }]);
  assert.equal(s.tx.filter((f) => f.src === 'A').length, 1);
});

test('NAV covers through the ACK of the exchange; the station may start only after it and a quiet slot', () => {
  assert.equal(logic.navUntil('RTS', 1), 1 + 1 + logic.dataLen + 1);
  assert.equal(logic.navUntil('CTS', 2), 2 + logic.dataLen + 1);
  // with RTS/CTS the CTS in slot 2 gives C a NAV until 6 = A's ACK; slot 7 is quiet, C's RTS goes in 8
  const s = end({ rts: true });
  assert.equal(s.slots[5].sends.B.kind, 'ACK');
  assert.equal(row(s, 'C'), '..NNNN.R.DDD....');
  assert.deepEqual(events({ rts: true }, 6, 'defer'), [{ e: 'defer', who: 'C', why: 'nav', until: 6 }]);
});

test('a NAV is set from the next slot on, not in the slot of the frame that set it', () => {
  const s = at({ rts: true }, 2);
  assert.equal(s.sta.C.nav, 6);
  assert.equal(s.slots[1].nav.C, false);
  assert.equal(at({ rts: true }, 3).slots[2].nav.C, true);
});

test('one bad slot spoils the whole frame; a sending station hears nothing', () => {
  // the book: A's DATA 1–3 is clean in 1 and 2, collides in 3, and is lost
  const s = at({}, 3);
  const a = s.tx.find((f) => f.src === 'A');
  assert.equal(a.ok.B, false);
  assert.equal(s.slots[0].heard.B.length, 1);
  assert.deepEqual(s.slots[2].heard.B.sort(), ['A', 'C']);
  // B sending its CTS hears nothing, even with a frame on air
  for (const p of ALL) for (const c of end(p).slots) if (c.sends.B) assert.deepEqual(c.heard.B, []);
});

test('a garbled RTS or CTS sets no NAV; a station sets NAV only from frames it heard intact', () => {
  for (const p of ALL) {
    const s = end(p);
    for (let n = 1; n <= logic.steps; n++) {
      for (const e of at(p, n).events.filter((x) => x.e === 'nav')) {
        const f = s.tx.find((x) => x.kind === e.kind && x.end === n);
        assert.ok(f && f.ok[e.who], `${JSON.stringify(p)} slot ${n}`);
      }
    }
  }
});

test('the wait after a failure: the fixed list, then its last value', () => {
  assert.equal(logic.backoff('A', 1), 1);
  assert.equal(logic.backoff('A', 2), 3);
  assert.equal(logic.backoff('A', 5), 3);
  assert.equal(logic.backoff('C', 1), 1);
  assert.equal(logic.backoff('C', 2), 5);
});

// ── the rules ──

test('who hears whom: B hears both and both hear B; A and C only with "hear"', () => {
  for (const hear of [false, true]) {
    const p = { hear };
    assert.equal(logic.hears(p, 'A', 'B'), true);
    assert.equal(logic.hears(p, 'C', 'B'), true);
    assert.equal(logic.hears(p, 'B', 'A'), true);
    assert.equal(logic.hears(p, 'B', 'C'), true);
    assert.equal(logic.hears(p, 'A', 'C'), hear);
    assert.equal(logic.hears(p, 'C', 'A'), hear);
    assert.equal(logic.hears(p, 'A', 'A'), false);
  }
});

test('a new attempt never starts while the station hears the medium busy, or during its NAV', () => {
  for (const p of ALL) {
    const s = end(p);
    for (const f of s.tx.filter((x) => x.src !== 'B' && (x.kind === 'RTS' || (x.kind === 'DATA' && !p.rts)))) {
      const before = s.slots[f.start - 2];
      if (before) {
        assert.equal(before.sends[f.src], null, `${JSON.stringify(p)} ${f.src} sent in ${f.start - 1}`);
        assert.deepEqual(before.heard[f.src], [], `${JSON.stringify(p)} ${f.src} heard something in ${f.start - 1}`);
      }
      assert.ok(!s.slots[f.start - 1].nav[f.src]);
    }
  }
});

test('a collision is two or more frames heard at once at B, and every frame in it is lost', () => {
  for (const p of ALL) {
    const s = end(p);
    s.slots.forEach((c, i) => {
      assert.equal(c.collide, !c.sends.B && c.heard.B.length > 1);
      if (c.collide) for (const f of s.tx.filter((x) => x.dst === 'B' && x.start <= i + 1 && i + 1 <= x.end)) assert.equal(f.ok.B, false);
    });
    assert.equal(s.collisions, s.slots.filter((c) => c.collide).length);
  }
});

test('B answers only what it received intact: CTS for an RTS, ACK for DATA, in the next slot', () => {
  for (const p of ALL) {
    const s = end(p);
    for (const f of s.tx.filter((x) => x.dst === 'B' && x.end < logic.steps)) {
      const reply = s.tx.find((x) => x.src === 'B' && x.start === f.end + 1);
      if (f.ok.B) assert.equal(reply && reply.kind, f.kind === 'RTS' ? 'CTS' : 'ACK');
      else assert.equal(reply, undefined);
    }
  }
});

test('without a reply the sender times out and waits; with RTS/CTS, DATA follows only a CTS', () => {
  const t = events({}, 4, 'timeout');
  assert.deepEqual(t, [{ e: 'timeout', who: 'A', kind: 'ACK', k: 1, wait: 1, ready: 6 }]);
  for (const p of ALL.filter((x) => x.rts)) {
    const s = end(p);
    for (const d of s.tx.filter((x) => x.kind === 'DATA')) {
      const cts = s.tx.find((x) => x.kind === 'CTS' && x.end === d.start - 1 && x.dst === d.src);
      assert.ok(cts && cts.ok[d.src], `${JSON.stringify(p)} DATA from ${d.src} at ${d.start}`);
    }
  }
});

test('a frame is delivered exactly when its ACK reached the sender intact', () => {
  for (const p of ALL) {
    const s = end(p);
    for (const x of ['A', 'C']) {
      const ack = s.tx.find((f) => f.kind === 'ACK' && f.dst === x && f.ok[x]);
      assert.equal(s.sta[x].delivered, ack ? ack.end : 0, `${JSON.stringify(p)} ${x}`);
    }
  }
});

// ── the book's scenario (ch. 17, Primjer 1) and the comparisons ──

test('the book: without RTS/CTS, A and C collide at B, neither notices, and the collision repeats', () => {
  const s = end({});
  assert.equal(row(s, 'A'), 'DDD..DDD....DDD.');
  assert.equal(row(s, 'C'), '..DDD..DDD......');
  assert.equal(atB(s), 'AAXCCAAXCC..AAA-');
  assert.equal(s.collisions, 2);
  assert.equal(s.lost, 4);
  // neither sender hears the other's frame at any time
  for (const c of s.slots) {
    assert.ok(!c.heard.A.includes('C'));
    assert.ok(!c.heard.C.includes('A'));
  }
  // A gets through on its third attempt in slot 16; C still waits (ready from 17)
  assert.equal(s.sta.A.delivered, 16);
  assert.equal(s.sta.C.delivered, 0);
  assert.equal(s.sta.C.ready, 17);
});

test('the book with RTS/CTS: C hears the CTS from B, never A, sets its NAV and waits; no collision', () => {
  const s = end({ rts: true });
  assert.equal(row(s, 'A'), 'R.DDD....NNNN...');
  assert.equal(row(s, 'B'), '.C...A..C...A...');
  assert.equal(atB(s), 'A-AAA-.C-CCC-...');
  assert.deepEqual(events({ rts: true }, 2, 'nav'), [{ e: 'nav', who: 'C', kind: 'CTS', owner: 'A', until: 6 }]);
  assert.equal(s.collisions, 0);
  assert.equal(s.lost, 0);
  assert.equal(s.sta.A.delivered, 6);
  assert.equal(s.sta.C.delivered, 13);
});

test('when A and C hear each other, listening alone prevents the collision', () => {
  const s = end({ hear: true });
  assert.equal(s.collisions, 0);
  assert.equal(s.sta.A.delivered, 4);
  assert.equal(s.sta.C.delivered, 9);
});

test('RTS/CTS costs two slots per frame when the stations hear each other anyway', () => {
  const plain = end({ hear: true }), rts = end({ rts: true, hear: true });
  assert.equal(rts.sta.A.delivered - plain.sta.A.delivered, 2);
  assert.equal(rts.collisions, 0);
  assert.equal(rts.sta.C.delivered, 13);
  // here C also hears A's RTS: its NAV starts one slot earlier than when hidden
  assert.equal(row(rts, 'C'), '.NNNNN.R.DDD....');
});

test('every layout runs to its own end within the 16 slots it shows', () => {
  for (const p of ALL) {
    const s = end(p);
    if (p.rts || p.hear) assert.ok(s.sta.A.delivered && s.sta.C.delivered, JSON.stringify(p));
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of ALL) for (let n = 0; n <= logic.steps; n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ rts: true });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps; n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and the first is the book\'s', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.equal(blocks.length, 4, 'found the four presets');
  const parsed = blocks.map((b) => Object.fromEntries([...b.matchAll(/(\w+):\s*(true|false)/g)].map((m) => [m[1], m[2] === 'true'])));
  for (const b of parsed) for (const k of Object.keys(b)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  assert.deepEqual(parsed[0], logic.defaults);
  assert.deepEqual(parsed, ALL.slice().sort((x, y) => (x.hear - y.hear) || (x.rts - y.rts)));
});
