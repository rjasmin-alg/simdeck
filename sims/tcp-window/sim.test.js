// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for tcp-window's model. Run: node --test sims/tcp-window/sim.test.js
// Numbers from the URM book, ch. 13 (13-transportni-sloj.md): segments of 500 octets (the paragraph on sequence and
// acknowledgment numbers), the window field (RFC 9293 §3.1, quoted in the chapter; 16 bits, at most 65 535 octets,
// "Šire o temi"), and the figure ch13-prozor-kontrola-toka.svg: a window of 1000 octets, acknowledgment 1500, then
// 2000. The round-trip times and the link rate (500 octets/ms) are simdeck's (NOTES.md).
// Tie-breaks and edges first, then the rules, then the book's numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const run = (win, rtt) => Array.from({ length: logic.steps + 1 }, (_, n) => at({ win, rtt }, n));
const pattern = (win, rtt) => at({ win, rtt }, logic.steps).timeline.map((e) => (e.k ? '#' : '.')).join('');
const ALL = logic.windows.flatMap((win) => logic.rtts.map((rtt) => [win, rtt]));

// ── tie-breaks and edges ──

test('an acknowledgment arriving at the start of a millisecond is used in it (ack before send)', () => {
  // window 1000, rtt 4: segment 1 sent in ms 1, its ack arrives at the start of ms 5, and ms 5 sends
  const s = at({ win: 1000, rtt: 4 }, 5);
  assert.deepEqual(s.acked, [1500]);
  assert.ok(s.sentNow, 'ms 5 sends with the window the ack just opened');
  // window = path (2000, rtt 4): never idle, because each ack comes exactly when the window is full
  assert.equal(pattern(2000, 4), '#'.repeat(16));
});

test('a segment ending exactly on the right edge fits (≤, not <)', () => {
  assert.equal(logic.fits(1500, 2000, 1000), true);   // 2000–2499, right edge 2499
  assert.equal(logic.fits(1500, 2500, 1000), false);
  assert.equal(logic.fits(1500, 1500, 500), true);    // a window of one segment
  assert.equal(logic.fits(1500, 1500, 499), false);
  const s = at({ win: 1000, rtt: 4 }, 2);
  assert.equal(s.next - 1, s.right);
  assert.equal(s.inFlight, 1000);
});

test('the limit: window below the path, equal to it, above it', () => {
  assert.deepEqual(logic.limit(1000, 4), { rate: 250, pipe: 2000, by: 'window' });
  assert.deepEqual(logic.limit(2000, 4), { rate: 500, pipe: 2000, by: 'both' });
  assert.deepEqual(logic.limit(4000, 4), { rate: 500, pipe: 2000, by: 'link' });
  assert.deepEqual(logic.limit(2000, 8), { rate: 250, pipe: 4000, by: 'window' });
  assert.equal(logic.limit(1999, 4).by, 'window');
  assert.equal(logic.limit(2001, 4).by, 'link');
});

// ── the rules ──

test('in flight never exceeds the window; nothing past the right edge is sent', () => {
  for (const [win, rtt] of ALL) for (const s of run(win, rtt)) {
    assert.ok(s.inFlight >= 0 && s.inFlight <= win, `${win}/${rtt}: ${s.inFlight}`);
    assert.ok(s.next - 1 <= s.right, `${win}/${rtt}`);
    assert.equal(s.right, s.ack + win - 1);
    assert.equal(s.inFlight, s.flight.length * logic.seg);
  }
});

test('the link is idle only when the next segment does not fit', () => {
  for (const [win, rtt] of ALL) {
    const r = run(win, rtt);
    for (let n = 1; n <= logic.steps; n++) {
      const s = r[n];
      if (!s.sentNow) assert.ok(!logic.fits(s.ack, s.next, win), `${win}/${rtt} ms ${n}`);
    }
  }
});

test('every acknowledgment comes exactly one round trip after its segment was sent, in order', () => {
  for (const [win, rtt] of ALL) {
    const r = run(win, rtt);
    const sentAt = {};
    for (let n = 1; n <= logic.steps; n++) {
      const s = r[n];
      for (const seq of s.acked) assert.equal(n - sentAt[seq], rtt, `${win}/${rtt} seq ${seq}`);
      if (s.sentNow) sentAt[s.sentNow.seq] = n;
      assert.ok(s.ack >= r[n - 1].ack);
      assert.ok(s.acked.length <= 1);
      for (const f of s.flight) assert.ok(n - f.ms + 1 >= 1 && n - f.ms + 1 <= rtt, 'a segment is on the path at most rtt ms');
    }
  }
});

test('an acknowledgment slides the window; its size stays', () => {
  for (const [win, rtt] of ALL) {
    const r = run(win, rtt);
    for (let n = 1; n <= logic.steps; n++) {
      const moved = r[n].ack - r[n - 1].ack;
      assert.equal(moved, r[n].acked.length * logic.seg);
      assert.equal(r[n].right - r[n - 1].right, moved);
    }
  }
});

test('over 16 ms, the link is busy exactly min(window / rtt, link) of the time', () => {
  for (const [win, rtt] of ALL) {
    const s = at({ win, rtt }, logic.steps);
    const lim = logic.limit(win, rtt);
    assert.equal(s.busy * logic.seg / logic.steps, lim.rate, `${win}/${rtt}: ${pattern(win, rtt)}`);
    assert.equal(s.sent, s.busy);
  }
});

test('the patterns, millisecond by millisecond', () => {
  assert.equal(pattern(1000, 4), '##..##..##..##..');
  assert.equal(pattern(2000, 8), '####....####....');
  assert.equal(pattern(500, 2), '#.#.#.#.#.#.#.#.');
  assert.equal(pattern(3000, 8), '######..######..');
  assert.equal(pattern(4000, 4), '#'.repeat(16));
});

test('the same window on a path twice as long gives half the rate; a window past the path adds nothing', () => {
  assert.equal(at({ win: 2000, rtt: 8 }, 16).busy * 2, at({ win: 2000, rtt: 4 }, 16).busy);
  assert.equal(at({ win: 4000, rtt: 4 }, 16).busy, at({ win: 2000, rtt: 4 }, 16).busy);
  // more window never lowers the rate
  for (const rtt of logic.rtts) {
    const busy = logic.windows.map((w) => at({ win: w, rtt }, 16).busy);
    for (let i = 1; i < busy.length; i++) assert.ok(busy[i] >= busy[i - 1], `rtt ${rtt}: ${busy}`);
  }
});

// ── the book's numbers ──

test('the book: window 1000, step 1 is the figure\'s moment 1 (ack 1500, in flight 1500–1999, right edge 2499)', () => {
  assert.equal(logic.defaults.win, 1000);
  const s = at({}, 1);
  assert.equal(s.ack, 1500);
  assert.equal(s.inFlight, 500);
  assert.equal(s.right, 2499);
  assert.deepEqual(s.sentNow, { seq: 1500, k: 1 });
});

test('the book: acknowledgment 2000 moves the window by 500, to 2000–2999, same size (fragment exercise 1)', () => {
  const r = run(1000, 4);
  const n = r.findIndex((s) => s.ack === 2000);
  assert.equal(n, 5);
  assert.equal(r[n].ack - r[n - 1].ack, 500);
  assert.equal(r[n].right, 2999);
  assert.equal(r[n].right - r[n].ack + 1, 1000);
});

test('the 16-bit window field: 65 535 octets at most', () => {
  assert.equal(2 ** 16 - 1, 65535);
  assert.ok(Math.max(...logic.windows) <= 65535);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const [win, rtt] of ALL) for (let n = 0; n <= logic.steps; n++) {
    const s = at({ win, rtt }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ win: 3000, rtt: 8 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
  let s = logic.initial(p);
  for (let n = 1; n <= 6; n++) {
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
  const val = (b, k) => Number(b.match(new RegExp(k + ':\\s*(\\d+)'))[1]);
  for (const b of blocks) {
    for (const k of b.matchAll(/(?:^|[\s,])(\w+):/g)) assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
    assert.ok(logic.windows.includes(val(b, 'win')));
    assert.ok(logic.rtts.includes(val(b, 'rtt')));
  }
  assert.equal(val(blocks[0], 'win'), logic.defaults.win);
  assert.equal(val(blocks[0], 'rtt'), logic.defaults.rtt);
  // the presets show the three regimes: window limits, both equal, link limits
  assert.deepEqual(blocks.map((b) => logic.limit(val(b, 'win'), val(b, 'rtt')).by), ['window', 'both', 'window', 'link']);
});
