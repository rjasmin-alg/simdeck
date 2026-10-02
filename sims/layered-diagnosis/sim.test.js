// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for layered-diagnosis's model. Run: node --test sims/layered-diagnosis/sim.test.js
// The orders are the URM book's ch. 15 ("Metodika rješavanja problema po slojevima", Primjer 8, figure
// ch15-metodika-po-slojevima.svg); the fragment's exercises give 5 checks when the test passes and 3 when it fails.
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
const end = (over) => at(over, logic.steps);
const FAULTS = [1, 2, 3, 4, 5, 6, 7];
const order = (s, a) => s.runs[a].checks.map((c) => c.layer);

// ── tie-breaks and edges ──

test('a failed reachability test is not yet a found fault', () => {
  for (const fault of [1, 2, 3]) {
    const s = at({ fault }, 1);
    assert.deepEqual(s.runs.dc.checks, [{ layer: 3, ok: false, test: true }]);
    assert.equal(s.runs.dc.found, null, `fault ${fault}`);
  }
});

test('a fault in the network layer: the test fails, 2 and 1 work, found there by elimination in 3 checks', () => {
  const s = end({ fault: 3 });
  assert.deepEqual(order(s, 'dc'), [3, 2, 1]);
  assert.deepEqual(s.runs.dc.found, { layer: 3, at: 3, checks: 3, elim: true });
});

test('elimination only after the test failed and both lower layers worked', () => {
  // fault 1: the test fails, 2 works, 1 fails: found by the check, not by elimination
  assert.deepEqual(end({ fault: 1 }).runs.dc.found, { layer: 1, at: 3, checks: 3, elim: false });
  // fault 2: found at 2, layer 1 is never checked
  assert.deepEqual(end({ fault: 2 }).runs.dc.found, { layer: 2, at: 2, checks: 2, elim: false });
  assert.deepEqual(order(end({ fault: 2 }), 'dc'), [3, 2]);
  // a passed test never ends in elimination
  for (const fault of [4, 5, 6, 7]) assert.equal(end({ fault }).runs.dc.found.elim, false);
});

test('a finished approach makes no more checks and emits no more events', () => {
  for (const fault of FAULTS) {
    for (let n = 1; n <= logic.steps; n++) {
      const prev = at({ fault }, n - 1), s = at({ fault }, n);
      for (const a of logic.approaches) {
        if (prev.runs[a].found) {
          assert.deepEqual(s.runs[a], prev.runs[a]);
          assert.ok(!s.events.some((e) => e.a === a), `fault ${fault}, step ${n}, ${a}`);
        }
      }
    }
  }
});

test('the longest run is seven checks, so seven steps end every approach', () => {
  assert.equal(logic.steps, 7);
  for (const fault of FAULTS) for (const a of logic.approaches) assert.ok(end({ fault }).runs[a].found, `${a} ${fault}`);
  assert.equal(at({ fault: 7 }, 6).runs.bu.found, null);
  assert.equal(at({ fault: 1 }, 6).runs.td.found, null);
});

// ── rules ──

test('bottom-up checks 1, 2, … and stops at the faulty layer', () => {
  for (const fault of FAULTS) {
    const s = end({ fault });
    assert.deepEqual(order(s, 'bu'), FAULTS.slice(0, fault));
    assert.deepEqual(s.runs.bu.found, { layer: fault, at: fault, checks: fault, elim: false });
  }
});

test('top-down checks 7, 6, … and stops at the faulty layer', () => {
  for (const fault of FAULTS) {
    const s = end({ fault });
    assert.deepEqual(order(s, 'td'), [7, 6, 5, 4, 3, 2, 1].slice(0, 8 - fault));
    assert.equal(s.runs.td.found.layer, fault);
  }
});

test('a one-layer check fails exactly on the faulty layer', () => {
  for (const fault of FAULTS) {
    for (const a of logic.approaches) {
      for (const c of end({ fault }).runs[a].checks) if (!c.test) assert.equal(c.ok, c.layer !== fault);
    }
  }
});

test('the reachability test at layer 3 works exactly when layers 1–3 all work', () => {
  for (const fault of FAULTS) {
    const s = at({ fault }, 1);
    assert.equal(s.ping, fault > 3);
    assert.deepEqual(s.events.filter((e) => e.e === 'test'), [{ e: 'test', a: 'dc', layer: 3, ok: fault > 3 }]);
    assert.equal(at({ fault }, 0).ping, null);
  }
});

test('divide and conquer: upward 4…7 after a passed test, downward 2, 1 after a failed one', () => {
  assert.deepEqual(order(end({ fault: 7 }), 'dc'), [3, 4, 5, 6, 7]);
  assert.deepEqual(order(end({ fault: 5 }), 'dc'), [3, 4, 5]);
  assert.deepEqual(order(end({ fault: 1 }), 'dc'), [3, 2, 1]);
  assert.deepEqual(logic.plan('dc', null), [3]);
  assert.deepEqual(logic.plan('dc', true), [3, 4, 5, 6, 7]);
  assert.deepEqual(logic.plan('dc', false), [3, 2, 1]);
  assert.deepEqual(logic.excluded(null), []);
  assert.deepEqual(logic.excluded(true), [1, 2, 3]);
  assert.deepEqual(logic.excluded(false), [4, 5, 6, 7]);
});

test('checksFor and plan agree with the replay for every fault', () => {
  for (const fault of FAULTS) {
    const s = end({ fault });
    for (const a of logic.approaches) {
      assert.equal(logic.checksFor(a, fault), s.runs[a].found.checks, `${a} ${fault}`);
      assert.deepEqual(order(s, a), logic.plan(a, a === 'dc' ? s.ping : null).slice(0, s.runs[a].found.checks));
    }
  }
});

// ── the book's numbers ──

test('Primjer 8 (web application, test passes): divide and conquer needs 5 checks, bottom-up 7', () => {
  const s = end({ fault: 7 });
  assert.equal(s.runs.dc.found.checks, 5);  // exercise 1: the test, then transport, session, presentation, application
  assert.equal(s.runs.bu.found.checks, 7);  // "would start checking cables and signal first"
  assert.equal(s.runs.td.found.checks, 1);
});

test('the test fails: divide and conquer checks three layers, the test, data link, physical', () => {
  assert.deepEqual(order(end({ fault: 1 }), 'dc'), [3, 2, 1]); // exercise 2
});

test('"usually faster": on average over the seven layers divide and conquer needs the fewest checks', () => {
  assert.equal(logic.average('bu'), 4);
  assert.equal(logic.average('td'), 4);
  assert.equal(logic.average('dc'), 22 / 7);
  // and not always: top-down wins on an application fault, bottom-up on a physical one
  assert.ok(logic.checksFor('td', 7) < logic.checksFor('dc', 7));
  assert.ok(logic.checksFor('bu', 1) < logic.checksFor('dc', 1));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const fault of FAULTS) {
    for (let n = 0; n <= logic.steps; n++) {
      const s = at({ fault }, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const fault of FAULTS) {
    const p = P({ fault });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ fault: 3 });
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
  const parsed = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) =>
    Object.fromEntries([...m[1].matchAll(/(\w+):\s*(\d+)/g)].map((k) => [k[1], Number(k[2])])));
  assert.equal(parsed.length, 4, 'found the four presets');
  for (const b of parsed) {
    for (const k of Object.keys(b)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok(FAULTS.includes(b.fault));
  }
  assert.deepEqual(parsed[0], logic.defaults);
  assert.deepEqual(parsed.map((b) => b.fault), [7, 1, 4, 3]);
});
