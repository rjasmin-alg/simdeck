// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for flow-control's model. Run: node --test sims/flow-control/
// Numbers from the URM book, ch. 13 (13-transportni-sloj.md): segments of 500 octets from octet 1000 (the paragraph on
// sequence and acknowledgment numbers), the window field (RFC 9293 §3.1, quoted in the chapter), and the figure
// ch13-prozor-kontrola-toka.svg: a window of 1000 octets, moment 1 (acknowledgment 1500) and moment 2 (2000).
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
const run = (win) => Array.from({ length: logic.steps + 1 }, (_, n) => at({ win }, n));
const kinds = (win) => run(win).map((s) => s.event.kind);

// ── tie-breaks and edges ──

test('a segment ending exactly on the right edge fits (≤, not <)', () => {
  // ack 1500, window 1000: right edge 2499; segment 2000–2499 ends on it
  assert.equal(logic.fits(1500, 2000, 1000), true);
  assert.equal(logic.fits(1500, 2500, 1000), false);
  assert.equal(logic.fits(1500, 2001, 1000), false); // one octet past
  // window of one segment: exactly one segment fits from the left edge
  assert.equal(logic.fits(1500, 1500, 500), true);
  assert.equal(logic.fits(1500, 1500, 499), false);
  const s = at({}, 2);
  assert.equal(s.event.kind, 'send');
  assert.equal(s.event.to, s.right);
  assert.equal(s.free, 0);
});

test('the edges are inside the window: left edge = ack, right edge = ack + win − 1', () => {
  assert.equal(logic.region(1499, 1500, 2000, 1000), 'acked');
  assert.equal(logic.region(1500, 1500, 2000, 1000), 'flight');   // the acknowledged number itself is not yet received
  assert.equal(logic.region(1999, 1500, 2000, 1000), 'flight');
  assert.equal(logic.region(2000, 1500, 2000, 1000), 'allowed');  // next to send
  assert.equal(logic.region(2499, 1500, 2000, 1000), 'allowed');  // right edge
  assert.equal(logic.region(2500, 1500, 2000, 1000), 'blocked');
  assert.deepEqual(logic.edges(1500, 2000, 1000), { left: 1500, right: 2499, inFlight: 500, free: 500 });
});

test('a send comes before a wait, and an acknowledgment only after a wait', () => {
  // the order of the rules: after a wait, ack; otherwise send if it fits; otherwise wait
  for (const win of logic.windows) {
    const k = kinds(win);
    for (let n = 1; n <= logic.steps; n++) {
      if (k[n] === 'ack') assert.equal(k[n - 1], 'wait', `win ${win} step ${n}`);
      if (k[n - 1] === 'wait') assert.equal(k[n], 'ack', `win ${win} step ${n}`);
    }
  }
});

test('the sender never waits while the next segment fits, and never sends when it does not', () => {
  for (const win of logic.windows) {
    const r = run(win);
    for (let n = 1; n <= logic.steps; n++) {
      const prev = r[n - 1], s = r[n];
      if (s.event.kind === 'send') assert.ok(logic.fits(prev.ack, prev.next, win), `win ${win} step ${n}`);
      if (s.event.kind === 'wait') assert.ok(!logic.fits(prev.ack, prev.next, win), `win ${win} step ${n}`);
    }
  }
});

// ── the rules ──

test('in flight never exceeds the window, and nothing past the right edge is ever sent', () => {
  for (const win of logic.windows) for (const s of run(win)) {
    assert.ok(s.inFlight >= 0 && s.inFlight <= win, `win ${win}: ${s.inFlight}`);
    assert.ok(s.next - 1 <= s.right, `win ${win}: sent up to ${s.next - 1}, right edge ${s.right}`);
    assert.equal(s.inFlight + s.free, win);
  }
});

test('an acknowledgment slides the whole window by what it acknowledges; the size stays', () => {
  for (const win of logic.windows) {
    const r = run(win);
    for (let n = 1; n <= logic.steps; n++) {
      const prev = r[n - 1], s = r[n];
      if (s.event.kind === 'ack') {
        assert.equal(s.ack - prev.ack, s.event.moved);
        assert.equal(s.event.moved, logic.seg);          // one segment per acknowledgment
        assert.equal(s.right - prev.right, s.event.moved); // both edges move together
        assert.equal(s.right - s.left + 1, win);
        assert.equal(s.next, prev.next);                  // an acknowledgment sends nothing
      } else {
        assert.equal(s.ack, prev.ack);                    // only acknowledgments move the left edge
        assert.equal(s.right, prev.right);
      }
    }
  }
});

test('acknowledgments are in order and never pass what was sent', () => {
  for (const win of logic.windows) for (const s of run(win)) {
    assert.ok(s.ack <= s.next);
    assert.equal((s.ack - logic.first) % logic.seg, 0);
  }
});

test('the window size decides how many segments go out before the first wait', () => {
  const firstWait = (win) => kinds(win).indexOf('wait');
  assert.equal(firstWait(500), 2);   // send, wait
  assert.equal(firstWait(1000), 3);  // send, send, wait
  assert.equal(firstWait(1500), 4);
  assert.equal(firstWait(2000), 5);
  // and a larger window sends at least as many segments in the same number of steps
  const sent = logic.windows.map((w) => at({ win: w }, logic.steps).sent);
  for (let i = 1; i < sent.length; i++) assert.ok(sent[i] >= sent[i - 1], sent.join(' '));
  assert.deepEqual(sent, [4, 5, 6, 6]);
});

test('the event sequences, step by step', () => {
  assert.deepEqual(kinds(500), ['start', 'send', 'wait', 'ack', 'send', 'wait', 'ack', 'send', 'wait', 'ack', 'send', 'wait', 'ack']);
  assert.deepEqual(kinds(1000), ['start', 'send', 'send', 'wait', 'ack', 'send', 'wait', 'ack', 'send', 'wait', 'ack', 'send', 'wait']);
  assert.deepEqual(kinds(2000), ['start', 'send', 'send', 'send', 'send', 'wait', 'ack', 'send', 'wait', 'ack', 'send', 'wait', 'ack']);
});

test('the page\'s strip (octets 1000–5499) holds every window edge of every offered window', () => {
  for (const win of logic.windows) for (const s of run(win)) {
    assert.ok(s.left >= logic.first && s.right <= logic.first + 9 * logic.seg - 1, `win ${win}: ${s.left}–${s.right}`);
  }
});

// ── the book's numbers ──

test('figure ch13-prozor-kontrola-toka, moment 1 = step 1: acknowledged 1000–1499, in flight 1500–1999, may send 2000–2499', () => {
  const s = at({}, 1);
  assert.equal(logic.defaults.win, 1000);
  assert.equal(s.ack, 1500);       // "potvrda 1500: sve do 1499 je primljeno, čekam 1500"
  assert.equal(s.right, 2499);     // "desni rub prozora — oktet 2499"
  assert.deepEqual([1000, 1499, 1500, 1999, 2000, 2499, 2500].map((o) => logic.region(o, s.ack, s.next, s.win)),
    ['acked', 'acked', 'flight', 'flight', 'allowed', 'allowed', 'blocked']);
  assert.equal(s.inFlight, 500);   // the figure's choice: half the window sent, not acknowledged
});

test('figure moment 2 = step 4: acknowledgment 2000, window 2000–2999, in flight 2000–2499, may send 2500–2999', () => {
  const s = at({}, 4);
  assert.equal(s.event.kind, 'ack');
  assert.equal(s.ack, 2000);
  assert.equal(s.right, 2999);     // "novi desni rub — oktet 2999"
  assert.equal(s.event.moved, 500); // fragment exercise 1: moved by 500, size still 1000
  assert.equal(s.right - s.left + 1, 1000);
  assert.deepEqual([1999, 2000, 2499, 2500, 2999, 3000].map((o) => logic.region(o, s.ack, s.next, s.win)),
    ['acked', 'flight', 'flight', 'allowed', 'allowed', 'blocked']);
});

test('step 0: octets 1000–1499 acknowledged, nothing in flight', () => {
  const s = at({}, 0);
  assert.equal(s.event.kind, 'start');
  assert.equal(s.ack, 1500);
  assert.equal(s.next, 1500);
  assert.equal(s.inFlight, 0);
  assert.equal(s.free, 1000);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const win of logic.windows) for (let n = 0; n <= logic.steps; n++) {
    const s = at({ win }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ win: 1500 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and the first is the book\'s', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.equal(blocks.length, 3, 'found the three presets');
  for (const b of blocks) {
    for (const k of b.matchAll(/(?:^|[\s,])(\w+):/g)) assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
    const win = Number(b.match(/win:\s*(\d+)/)[1]);
    assert.ok(logic.windows.includes(win), `preset window ${win} is offered`);
  }
  assert.equal(Number(blocks[0].match(/win:\s*(\d+)/)[1]), logic.defaults.win);
});
