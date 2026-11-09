// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for buffer-overflow's model. Run: node --test sims/buffer-overflow/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in SPEC order, the presets, the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (over) => logic.steps(P(over));
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, steps(over));
/** The state after the last copy step (before the return). */
const copied = (over) => at(over, 1 + logic.copySteps(P(over)));

// ── tie-breaks ──

test('tie-break: input exactly filling buf spills nothing and returns normally', () => {
  for (const bufSize of [4, 8, 12, 16]) {
    for (const canary of [false, true]) {
      const o = { bufSize, inputLen: bufSize, canary };
      const s = copied(o);
      const lay = logic.layout(P(o));
      for (let i = bufSize; i < lay.end; i++) assert.equal(s.cells[i], 'orig', `byte ${i} untouched`);
      assert.equal(end(o).outcome, 'normal');
    }
  }
});

test('tie-break: one byte past buf with a canary (off-by-one) is a canary-trip', () => {
  const o = { bufSize: 8, inputLen: 9, canary: true };
  const s = copied(o);
  assert.equal(s.cells[8], 'fill');
  assert.equal(s.cells[9], 'orig');
  assert.equal(s.canary.intact, false);
  assert.equal(end(o).outcome, 'canary-trip');
});

test('tie-break: a canary trip wins over every later layer and target', () => {
  for (const target of ['stack', 'code']) {
    const s = end({ inputLen: 24, canary: true, nx: true, aslr: true, target });
    assert.equal(s.outcome, 'canary-trip');
    assert.equal(s.jump, null, 'no jump after a trip');
    assert.deepEqual(s.layers, { canary: 'stopped', aslr: 'not-reached', nx: 'not-reached' });
  }
});

test('tie-break: ASLR decides before NX (the guessed address is not even mapped)', () => {
  const s = end({ inputLen: 24, nx: true, aslr: true, target: 'stack' });
  assert.equal(s.outcome, 'aslr-miss');
  assert.deepEqual(s.layers, { canary: 'off', aslr: 'stopped', nx: 'not-reached' });
});

// ── rule 1: no bounds check, input longer than buf writes past it ──

test('rule 1: the copy writes every input byte, also past buf', () => {
  const o = { bufSize: 8, inputLen: 18 };
  const s = copied(o);
  assert.equal(s.written, 18);
  for (let i = 0; i < 18; i++) assert.notEqual(s.cells[i], 'orig');
  assert.deepEqual(s.cells.slice(18), ['orig', 'orig'], 'the rest of the shown caller word is untouched');
  const short = copied({ bufSize: 8, inputLen: 5 });
  assert.deepEqual(short.cells.slice(0, 8), ['fill', 'fill', 'fill', 'fill', 'fill', 'empty', 'empty', 'empty'].map((k, i) => (i < 4 ? 'code' : k)));
});

// ── rule 2: layout, the overflow reaches canary, saved FP, then the return address ──

test('rule 2: slots sit above buf in the order canary, saved FP, return address', () => {
  const a = logic.layout(P({ bufSize: 8 }));
  assert.deepEqual([a.canaryOff, a.fpOff, a.raOff, a.callerOff], [-1, 8, 12, 16]);
  const b = logic.layout(P({ bufSize: 8, canary: true }));
  assert.deepEqual([b.canaryOff, b.fpOff, b.raOff, b.callerOff], [8, 12, 16, 20]);
  assert.equal(b.bufAddr + b.raOff, b.raAddr, 'buf is below the return address');
  assert.equal(a.raAddr, 0x7f7c);
  assert.equal(a.bufAddr, 0x7f70);
});

test('rule 2: the write reaches the saved FP before the return address', () => {
  const o = { bufSize: 8, inputLen: 24 };
  const first = {};
  for (let n = 2; n <= 1 + logic.copySteps(P(o)); n++) {
    for (const slot of at(o, n).hit) if (!(slot in first)) first[slot] = n;
  }
  assert.ok(first.fp < first.ra && first.ra < first.caller, JSON.stringify(first));
  assert.equal(first.fp, 6);  // bytes 8–9
  assert.equal(first.ra, 8);  // bytes 12–13
});

// ── rule 3: on return the CPU jumps to the saved return address ──

test('rule 3: intact return address goes back to main; a whole overwrite goes where the input says', () => {
  const ok = end({ inputLen: 8 });
  assert.deepEqual(ok.jump, { to: 0x1a2c, region: 'code', what: 'caller' });
  const smash = end({ inputLen: 16 });
  assert.equal(smash.retAddr.state, 'target');
  assert.equal(smash.jump.to, 0x7f70);
  assert.equal(smash.outcome, 'hijack');
});

test('rule 3: a partly overwritten return address is an address nobody chose: crash', () => {
  for (const inputLen of [13, 14, 15]) {
    const s = end({ inputLen });
    assert.equal(s.retAddr.state, 'partial', `len ${inputLen}`);
    assert.equal(s.outcome, 'crash');
    assert.equal(s.why, 'mixed');
  }
});

test('rule 3: only the saved FP overwritten: the return works, then the caller crashes', () => {
  for (const inputLen of [9, 10, 12]) {
    const s = end({ inputLen });
    assert.equal(s.retAddr.state, 'orig');
    assert.equal(s.savedFP.intact, false);
    assert.equal(s.outcome, 'crash');
    assert.equal(s.why, 'fp');
    assert.equal(s.jump.what, 'caller');
  }
});

// ── rule 4: canary ──

test('rule 4: a changed canary aborts on return, before the jump', () => {
  const o = { inputLen: 24, canary: true };
  const c = logic.copySteps(P(o));
  const ret = at(o, 2 + c);
  assert.equal(ret.phase, 'return');
  assert.equal(ret.outcome, 'canary-trip');
  assert.equal(at(o, 3 + c).jump, null);
});

test('rule 4: an intact canary lets the return go on', () => {
  const s = end({ inputLen: 8, canary: true });
  assert.equal(s.canary.intact, true);
  assert.equal(s.outcome, 'normal');
  assert.equal(at({ inputLen: 8, canary: true }, 2 + logic.copySteps(P({ inputLen: 8 }))).outcome, null);
});

// ── rule 5: NX ──

test('rule 5: NX faults a jump into the stack', () => {
  const s = end({ inputLen: 24, nx: true, target: 'stack' });
  assert.equal(s.outcome, 'nx-block');
  assert.equal(s.jump.region, 'stack');
  assert.equal(s.layers.nx, 'stopped');
});

test('rule 5: NX does not stop a jump into code the program already has', () => {
  const s = end({ inputLen: 24, nx: true, target: 'code' });
  assert.equal(s.outcome, 'hijack');
  assert.equal(s.jump.to, 0x1b40);
  assert.equal(s.layers.nx, 'no-effect');
});

// ── rule 6: ASLR ──

test('rule 6: with ASLR a hardcoded address misses, for either target', () => {
  for (const target of ['stack', 'code']) {
    const s = end({ inputLen: 24, aslr: true, target });
    assert.equal(s.outcome, 'aslr-miss', target);
    assert.equal(s.jump.region, 'none');
    assert.equal(s.jump.to, target === 'code' ? 0x1b40 : 0x7f70, 'the address is the one from a run without ASLR');
  }
  const lay = logic.layout(P({ aslr: true }));
  assert.deepEqual(lay.stack, [0x5b00, 0x5c00]);
  assert.deepEqual(lay.code, [0x4000, 0x5000]);
});

test('rule 6: ASLR leaves a normal run normal (return address from this run)', () => {
  const s = end({ inputLen: 6, aslr: true });
  assert.equal(s.outcome, 'normal');
  assert.equal(s.jump.to, 0x4a2c);
});

// ── rule 7: independent layers ──

test('rule 7: each layer alone closes its own step; none closes them all', () => {
  const grid = {};
  for (const m of ['none', 'canary', 'nx', 'aslr']) {
    for (const target of ['stack', 'code']) {
      const o = { inputLen: 24, target };
      if (m !== 'none') o[m] = true;
      grid[m + '/' + target] = end(o).outcome;
    }
  }
  assert.deepEqual(grid, {
    'none/stack': 'hijack', 'none/code': 'hijack',
    'canary/stack': 'canary-trip', 'canary/code': 'canary-trip',
    'nx/stack': 'nx-block', 'nx/code': 'hijack',
    'aslr/stack': 'aslr-miss', 'aslr/code': 'aslr-miss'
  });
});

test('rule 7: layer status words', () => {
  assert.deepEqual(end({ inputLen: 4, canary: true, nx: true, aslr: true }).layers, { canary: 'not-needed', aslr: 'not-needed', nx: 'not-needed' });
  assert.deepEqual(end({ inputLen: 24 }).layers, { canary: 'off', aslr: 'off', nx: 'off' });
});

// ── the input and the steps ──

test('the input puts injected code first and the target address exactly on the return address', () => {
  const b = logic.inputBytes(P({ bufSize: 8, inputLen: 20 }));
  assert.deepEqual(b.map((x) => x.k).join(','), 'code,code,code,code,fill,fill,fill,fill,fill,fill,fill,fill,addr,addr,addr,addr,fill,fill,fill,fill');
  assert.deepEqual(b.slice(12, 16).map((x) => x.v), [0x70, 0x7f, 0, 0], 'little-endian 0x7F70');
  const code = logic.inputBytes(P({ bufSize: 8, inputLen: 20, canary: true, target: 'code' }));
  assert.equal(code.filter((x) => x.k === 'code').length, 0);
  assert.deepEqual(code.map((x, i) => (x.k === 'addr' ? i : -1)).filter((i) => i >= 0), [16, 17, 18, 19]);
});

test('steps: frame, copy (2 bytes a step, 4 over 24 bytes, at least one), return, jump, outcome; never over 16', () => {
  assert.equal(steps({ inputLen: 0 }), 5);
  assert.equal(steps({ inputLen: 1 }), 5);
  assert.equal(steps({ inputLen: 8 }), 8);
  assert.equal(steps({ inputLen: 24 }), 16);
  assert.equal(steps({ inputLen: 25 }), 11);
  assert.equal(steps({ inputLen: 40 }), 14);
  for (let b = 4; b <= 16; b += 4) for (let l = 0; l <= 40; l++) assert.ok(steps({ bufSize: b, inputLen: l }) <= 16);
  const phases = [];
  for (let n = 0; n <= 8; n++) phases.push(at({ inputLen: 8 }, n).phase);
  assert.deepEqual(phases, ['start', 'frame', 'copy', 'copy', 'copy', 'copy', 'return', 'jump', 'outcome']);
});

test('the frame is laid out at step 1 and the outcome is known by the jump step', () => {
  const o = { inputLen: 24, nx: true };
  assert.ok(at(o, 0).cells.slice(0, 16).every((k) => k === 'none'));
  assert.equal(at(o, 1).cells[0], 'empty');
  assert.equal(at(o, 15).phase, 'jump');
  assert.equal(at(o, 15).outcome, 'nx-block');
  assert.equal(at(o, 15).layers, null);
});

test('the copy writes every byte exactly once, for every length and both chunk sizes', () => {
  for (let inputLen = 0; inputLen <= 40; inputLen++) {
    for (const bufSize of [4, 16]) {
      const o = { bufSize, inputLen, canary: inputLen % 2 === 0 };
      const c = logic.copySteps(P(o));
      const seen = [];
      for (let n = 2; n <= 1 + c; n++) seen.push(...at(o, n).changed);
      assert.deepEqual(seen, [...Array(inputLen).keys()], `len ${inputLen}`);
      const s = copied(o);
      assert.equal(s.written, inputLen);
      const bytes = logic.inputBytes(P(o));
      for (let i = 0; i < inputLen; i++) assert.equal(s.cells[i], bytes[i].k, `len ${inputLen} byte ${i}`);
    }
  }
});

test('slotOf at every boundary, with and without the canary', () => {
  const a = logic.layout(P({ bufSize: 8 }));
  assert.deepEqual([7, 8, 11, 12, 15, 16].map((o) => logic.slotOf(a, o)), ['buf', 'fp', 'fp', 'ra', 'ra', 'caller']);
  const b = logic.layout(P({ bufSize: 8, canary: true }));
  assert.deepEqual([7, 8, 11, 12, 15, 16, 19, 20].map((o) => logic.slotOf(b, o)), ['buf', 'canary', 'canary', 'fp', 'fp', 'ra', 'ra', 'caller']);
});

test('shown region: at least one word of the caller, more when the input reaches further', () => {
  for (const inputLen of [0, 8, 16]) assert.equal(logic.layout(P({ bufSize: 8, inputLen })).end, 20);
  assert.equal(logic.layout(P({ bufSize: 8, inputLen: 17 })).end, 20);
  assert.equal(logic.layout(P({ bufSize: 8, inputLen: 21 })).end, 24);
  assert.equal(logic.layout(P({ bufSize: 4, inputLen: 40 })).end, 40);
});

test('slot values: saved FP 0x7F98, canary 0xC3A95E17, canary present only when on', () => {
  const s = at({ inputLen: 4 }, 1);
  assert.equal(s.savedFP.value, 0x7f98);
  assert.equal(s.canary.present, false);
  const c = at({ inputLen: 4, canary: true }, 1);
  assert.equal(c.canary.present, true);
  assert.equal(c.canary.value, 0xc3a95e17);
  assert.equal(at({ aslr: true }, 1).savedFP.value, 0x5b98);
  assert.equal(copied({ inputLen: 4 }).canary.present, false, 'still absent after the copy');
  assert.equal(copied({ inputLen: 4, canary: true }).canary.present, true);
});

test('a hijack says where it went: buf for a stack target, admin() for a code target', () => {
  const st = end({ inputLen: 24, target: 'stack' });
  assert.equal(st.retAddr.label, 'buf');
  assert.equal(st.jump.what, 'buf');
  const co = end({ inputLen: 24, target: 'code' });
  assert.equal(co.retAddr.label, 'admin');
  assert.equal(co.jump.what, 'admin');
});

test('rule 7: a crash leaves the protections that are on "not needed"', () => {
  assert.deepEqual(end({ inputLen: 14, nx: true, aslr: true }).layers, { canary: 'off', aslr: 'not-needed', nx: 'not-needed' });
  assert.deepEqual(end({ inputLen: 10, nx: true }).layers, { canary: 'off', aslr: 'off', nx: 'not-needed' });
});

// ── presets (as in index.html) ──

test('presets give the outcomes the task derives, each within 16 steps', () => {
  const presets = {
    fits: [{ bufSize: 8, inputLen: 8 }, 'normal'],
    smash: [{ bufSize: 8, inputLen: 24, target: 'stack' }, 'hijack'],
    canary: [{ bufSize: 8, inputLen: 24, canary: true, target: 'stack' }, 'canary-trip'],
    nx: [{ bufSize: 8, inputLen: 24, nx: true, target: 'stack' }, 'nx-block'],
    aslr: [{ bufSize: 8, inputLen: 24, aslr: true, target: 'code' }, 'aslr-miss'],
    'all-on': [{ bufSize: 8, inputLen: 24, canary: true, nx: true, aslr: true, target: 'stack' }, 'canary-trip']
  };
  for (const [id, [o, out]] of Object.entries(presets)) {
    assert.equal(end(o).outcome, out, id);
    assert.ok(steps(o) <= 16, id);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const o = { bufSize: 4, inputLen: 37, canary: true, aslr: true };
  for (let n = 0; n <= steps(o); n++) {
    const s = at(o, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ bufSize: 12, inputLen: 30, nx: true, target: 'code' });
  const n = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let i = 1; i <= n; i++) { s = logic.step(s, i, p); forward.push(s); }
  for (let i = n; i >= 0; i--) assert.deepEqual(kit.stateAt(logic, p, i), forward[i]);
});

test('step does not mutate its input', () => {
  const p = P({ inputLen: 24 });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model at the defaults');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
