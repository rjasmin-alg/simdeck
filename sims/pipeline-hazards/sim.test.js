// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for pipeline-hazards' model. Run: node --test sims/pipeline-hazards/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules, the presets, and the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (p) => kit.stepsOf(logic, p);
const end = (over) => { const p = P(over); return kit.stateAt(logic, p, steps(p)); };
const at = (over, n) => kit.stateAt(logic, P(over), n);

// A custom program without touching the presets: run the model over any list of lines to the end.
function run(lines, forwarding) {
  logic.PROGRAMS.custom = lines;
  try { return end({ program: 'custom', forwarding }); } finally { delete logic.PROGRAMS.custom; }
}
function runAt(lines, forwarding, n) {
  logic.PROGRAMS.custom = lines;
  try { return at({ program: 'custom', forwarding }, n); } finally { delete logic.PROGRAMS.custom; }
}
const cycles = (s) => s.cycle;
const fwd = (s) => s.forwards.map((f) => [f.from, f.reg, f.cycle, f.producer, f.consumer]);
// The diagram as text, one row per instruction: stages, '—' stall, '×' flushed, '.' empty.
function diagram(s) {
  return s.instrs.map((q) => {
    const row = [];
    for (let c = 1; c <= s.cycle; c++) {
      const x = logic.cell(q, c);
      row.push(x === 'stall' ? '—' : x === 'flush' ? '×' : x || '.');
    }
    return row.join(' ');
  });
}

// ── tie-breaks ──

test('tie-break (rule 6): both paths hold x1, the newer EX/MEM value wins', () => {
  // add x1 (in WB in cycle 5) and add x1 (in MEM in cycle 5) both write x1; sub in EX in cycle 5 takes the newer one
  const s = run(['add x1,x2,x3', 'add x1,x1,x4', 'sub x5,x1,x6'], true);
  assert.deepEqual(fwd(s).filter((f) => f[4] === 2), [['EX/MEM', 1, 5, 1, 2]]);
  assert.equal(s.stalls, 0);
});

test('tie-break (rule 6): without forwarding the newest producer decides the stall, not an older one', () => {
  // sub needs x1 from the second add (d = 1, 2 stalls), not from the first (d = 2, it would be 1)
  const s = run(['add x1,x2,x3', 'add x1,x7,x4', 'sub x5,x1,x6'], false);
  assert.equal(s.stalls, 2);
  assert.deepEqual(s.instrs[2].held, [5, 6]);
});

test('tie-break (rule 6): a flushed instruction is never the producer', () => {
  const lines = ['add x9,x2,x3', { text: 'beq x0,x0,L', taken: true }, 'addi x9,x0,1', 'addi x8,x0,2', 'L: sub x5,x9,x6'];
  const s = run(lines, true);
  assert.equal(s.instrs[2].flushed, 4);
  assert.equal(logic.producerOf(s, 4, 9), 0);
});

test('tie-break (rule 8): a flushed instruction in ID is not checked for hazards', () => {
  // without forwarding, addi x7,x9,1 would wait for add x9 (in MEM) if it were checked after its flush in cycle 4
  const lines = ['add x9,x2,x3', { text: 'beq x0,x0,L', taken: true }, 'addi x7,x9,1', 'addi x8,x0,2', 'L: sub x5,x6,x6'];
  const s = run(lines, false);
  assert.equal(s.stalls, 0);
  assert.equal(cycles(s), 9);   // 5 + (3 − 1) + 0 + 2
});

// ── rules ──

test('rule 1: one fetch per cycle; after the fill one instruction completes per cycle, each in 5 cycles', () => {
  const s = end({ program: 'independent' });
  assert.deepEqual(s.instrs.map((q) => q.stages.IF), [1, 2, 3, 4]);
  assert.deepEqual(s.instrs.map((q) => q.stages.WB - q.stages.IF), [4, 4, 4, 4]);
  const done = [];
  for (let n = 1; n <= 8; n++) done.push(at({ program: 'independent' }, n).completed);
  assert.deepEqual(done, [0, 0, 0, 0, 1, 2, 3, 4]);
});

test('rule 2: register file written in the first half, read in the second: d = 3 needs no stall without forwarding', () => {
  const s = run(['add x1,x2,x3', 'and x7,x8,x9', 'or x10,x11,x12', 'sub x4,x1,x5'], false);
  assert.equal(s.stalls, 0);
  assert.deepEqual(s.regPasses.map((r) => [r.reg, r.cycle, r.producer, r.consumer]), [[1, 5, 0, 3]]);
});

test('rule 3: without forwarding, stalls by distance are 2, 1, 0', () => {
  assert.equal(run(['add x1,x2,x3', 'sub x4,x1,x5'], false).stalls, 2);
  assert.equal(run(['add x1,x2,x3', 'and x7,x8,x9', 'sub x4,x1,x5'], false).stalls, 1);
  assert.equal(run(['add x1,x2,x3', 'and x7,x8,x9', 'or x10,x11,x12', 'sub x4,x1,x5'], false).stalls, 0);
  // the consumer leaves ID only after the producer's WB cycle: IF ID — — EX
  assert.deepEqual(diagram(run(['add x1,x2,x3', 'sub x4,x1,x5'], false))[1], '. IF ID — — EX MEM WB');
});

test('rule 3: loads stall like ALU instructions without forwarding (d = 1 → 2)', () => {
  const s = end({ program: 'load-use', forwarding: false });
  assert.equal(s.stalls, 2);
  assert.equal(s.forwards.length, 0);
});

test('rule 4: with forwarding ALU → ALU needs no stall; d = 1 is EX/MEM → EX, d = 2 is MEM/WB → EX', () => {
  const s1 = run(['add x1,x2,x3', 'sub x4,x1,x5'], true);
  assert.equal(s1.stalls, 0);
  assert.deepEqual(fwd(s1), [['EX/MEM', 1, 4, 0, 1]]);
  const s2 = run(['add x1,x2,x3', 'and x7,x8,x9', 'sub x4,x1,x5'], true);
  assert.equal(s2.stalls, 0);
  assert.deepEqual(fwd(s2), [['MEM/WB', 1, 5, 0, 2]]);
  const s3 = run(['add x1,x2,x3', 'and x7,x8,x9', 'or x10,x11,x12', 'sub x4,x1,x5'], true);
  assert.deepEqual(fwd(s3), []);
});

test('rule 4: load → use costs exactly 1 stall at d = 1 and none at d = 2', () => {
  const s1 = end({ program: 'load-use', forwarding: true });
  assert.equal(s1.stalls, 1);
  assert.deepEqual(s1.instrs[1].held, [4]);
  assert.deepEqual(fwd(s1), [['MEM/WB', 1, 5, 0, 1]]);
  const s2 = run(['lw x1,0(x2)', 'and x7,x8,x9', 'add x3,x1,x4'], true);
  assert.equal(s2.stalls, 0);
  assert.deepEqual(fwd(s2), [['MEM/WB', 1, 5, 0, 2]]);
});

test('rule 4: a stall holds IF and ID and puts a bubble into EX', () => {
  const s = at({ program: 'mixed', forwarding: true }, 4);
  assert.deepEqual(s.inStage, { IF: 2, ID: 1, EX: 'bubble', MEM: 0, WB: null });
  assert.deepEqual(s.last.stall, { consumer: 1, producer: 0, reg: 1, cause: 'load-use' });
  assert.deepEqual(s.instrs[2].held, [4]);
  assert.deepEqual(at({ program: 'mixed', forwarding: true }, 5).inStage.MEM, 'bubble');
});

test('rule 5: a taken branch flushes the 2 younger instructions in its EX cycle; IF fetches the target next', () => {
  const s7 = at({ program: 'mixed' }, 7);
  assert.equal(s7.instrs[3].stages.EX, 7);
  assert.deepEqual(s7.last.flush, { branch: 3, ids: [4, 5], target: 6 });
  assert.equal(s7.instrs[4].flushedIn, 'ID');
  assert.equal(s7.instrs[5].flushedIn, 'IF');
  const s8 = at({ program: 'mixed' }, 8);
  assert.deepEqual(s8.inStage, { IF: 6, ID: 'flushed', EX: 'flushed', MEM: 3, WB: 2 });
  const s = end({ program: 'mixed' });
  assert.equal(s.flushes, 2);
  assert.equal(s.completed, 5);
  assert.equal(s.instrs[4].stages.EX, null);
});

test('rule 5: after a taken branch IF fetches the target, skipping what lies between', () => {
  // three lines between the branch and L: two are fetched and flushed, the third is never fetched
  const lines = [{ text: 'beq x0,x0,L', taken: true }, 'addi x7,x0,1', 'addi x8,x0,2', 'addi x9,x0,3', 'L: sub x5,x6,x6'];
  const s = run(lines, true);
  assert.equal(s.instrs[3].fetched, false);
  assert.equal(s.instrs[4].stages.IF, 4);   // beq in EX in cycle 3
  assert.equal(cycles(s), 8);                // 5 + (2 − 1) + 0 + 2
});

test('rule 5: flushed instructions are marked wrong path from their flush on; fetches are reported per cycle', () => {
  assert.deepEqual(at({ program: 'mixed' }, 6).instrs.map((q) => q.wrongPath), [false, false, false, false, false, false, false]);
  assert.deepEqual(at({ program: 'mixed' }, 7).instrs.map((q) => q.wrongPath), [false, false, false, false, true, true, false]);
  const fetched = [];
  for (let n = 1; n <= 12; n++) fetched.push(at({ program: 'mixed' }, n).last.fetched);
  assert.deepEqual(fetched, [0, 1, 2, null, 3, 4, 5, 6, null, null, null, null]);
});

test('rule 8: a flushed instruction in ID reads nothing from the register file', () => {
  // addi x7,x9,1 is in ID in cycle 5 (its flush cycle) while add x9 is in WB: no register-file pass is recorded
  const lines = ['add x9,x2,x3', 'and x10,x11,x12', { text: 'beq x0,x0,L', taken: true }, 'addi x7,x9,1', 'addi x8,x0,2', 'L: or x5,x6,x6'];
  const s = run(lines, false);
  assert.equal(s.instrs[3].flushed, 5);
  assert.deepEqual(s.regPasses, []);
});

test('rule 5: a taken branch to a label less than 3 lines ahead, or backward, is refused', () => {
  assert.throws(() => run(['add x1,x2,x3', { text: 'beq x0,x0,L', taken: true }, 'L: or x5,x6,x6'], true), /at least 3 lines/);
  assert.throws(() => run(['L: add x1,x2,x3', { text: 'beq x0,x0,L', taken: true }], true), /at least 3 lines/);
  assert.doesNotThrow(() => run(['add x1,x2,x3', { text: 'beq x0,x0,L', taken: false }, 'L: or x5,x6,x6'], true));
});

test('rule 5: a branch not taken loses nothing', () => {
  const lines = ['add x1,x2,x3', { text: 'beq x5,x0,L', taken: false }, 'addi x7,x0,1', 'addi x8,x0,2', 'L: sw x3,8(x2)'];
  const s = run(lines, true);
  assert.equal(s.flushes, 0);
  assert.equal(s.completed, 5);
  assert.equal(cycles(s), 9);
  assert.equal(runAt(lines, true, 4).last.notTaken, 1);
  assert.equal(runAt(lines, true, 4).last.flush, null);
});

test('rule 7: a store\'s data register is a source, forwarded and stalled like any other', () => {
  const s1 = run(['add x3,x2,x4', 'sw x3,8(x2)'], true);
  assert.deepEqual(fwd(s1), [['EX/MEM', 3, 4, 0, 1]]);
  assert.equal(run(['add x3,x2,x4', 'sw x3,8(x2)'], false).stalls, 2);
  assert.equal(run(['lw x3,0(x2)', 'sw x3,8(x2)'], true).stalls, 1);
  assert.deepEqual(logic.parse('sw x3,8(x2)').src, [2, 3]);
});

test('rule 7: x0 is never a hazard, even after an instruction that names x0 as its destination', () => {
  const s = run(['add x0,x1,x2', 'sub x3,x0,x4'], false);
  assert.equal(s.stalls, 0);
  assert.equal(run(['lw x0,0(x2)', 'sub x3,x0,x4'], true).stalls, 0);
  assert.deepEqual(fwd(run(['add x0,x1,x2', 'sub x3,x0,x4'], true)), []);
});

test('parse: kinds, destinations and sources', () => {
  assert.deepEqual(['lw x1,0(x2)', 'add x3,x1,x4', 'beq x5,x0,L', 'addi x7,x0,1', 'L: sw x3,8(x2)'].map((l) => {
    const q = logic.parse(l);
    return [q.kind, q.dst, q.src, q.label, q.target];
  }), [['load', 1, [2], null, null], ['alu', 3, [1, 4], null, null], ['branch', null, [5, 0], null, 'L'],
    ['alu', 7, [0], null, null], ['store', null, [2, 3], 'L', null]]);
});

test('cycles = 5 + (n − 1) + stalls + flushed for every preset program', () => {
  for (const program of logic.PROGRAM_IDS) for (const forwarding of [true, false]) {
    const s = end({ program, forwarding });
    assert.equal(cycles(s), 5 + (s.completed - 1) + s.stalls + s.flushes, `${program} ${forwarding}`);
    assert.equal(steps(P({ program, forwarding })), cycles(s));
  }
});

// ── presets (SPEC.md table) ──

test('presets: cycles, stalls and flushed', () => {
  const want = [
    [{ program: 'independent', forwarding: true }, 8, 0, 0],
    [{ program: 'raw', forwarding: false }, 8, 2, 0],
    [{ program: 'raw', forwarding: true }, 6, 0, 0],
    [{ program: 'load-use', forwarding: true }, 7, 1, 0],
    [{ program: 'load-use', forwarding: false }, 8, 2, 0],
    [{ program: 'mixed', forwarding: true }, 12, 1, 2],
    [{ program: 'mixed', forwarding: false }, 17, 6, 2]
  ];
  for (const [p, c, st, fl] of want) {
    const s = end(p);
    assert.deepEqual([cycles(s), s.stalls, s.flushes], [c, st, fl], JSON.stringify(p));
  }
});

test('preset raw-fwd: one EX/MEM → EX forward of x1 in cycle 4; raw-no-fwd: x1 through the register file in cycle 5', () => {
  assert.deepEqual(fwd(end({ program: 'raw', forwarding: true })), [['EX/MEM', 1, 4, 0, 1]]);
  const s = end({ program: 'raw', forwarding: false });
  assert.deepEqual(s.regPasses.map((r) => [r.reg, r.cycle]), [[1, 5]]);
});

test('preset mixed: the diagram and the forwards', () => {
  const s = end({ program: 'mixed', forwarding: true });
  assert.deepEqual(diagram(s), [
    'IF ID EX MEM WB . . . . . . .',
    '. IF ID — EX MEM WB . . . . .',
    '. . IF — ID EX MEM WB . . . .',
    '. . . . IF ID EX MEM WB . . .',
    '. . . . . IF × . . . . .',
    '. . . . . . × . . . . .',
    '. . . . . . . IF ID EX MEM WB'
  ]);
  assert.deepEqual(fwd(s), [['MEM/WB', 1, 5, 0, 1], ['EX/MEM', 3, 6, 1, 2], ['EX/MEM', 5, 7, 2, 3]]);
  const off = end({ program: 'mixed', forwarding: false });
  assert.deepEqual(diagram(off)[3], '. . . . . IF — — ID — — EX MEM WB . . .');
  assert.equal(off.last.completed, 6);
});

test('task caption: load-use step 4 stalls add (in ID) on x1 from lw (in MEM)', () => {
  const s = at({ program: 'load-use', forwarding: true }, 4);
  assert.deepEqual(s.last.stall, { consumer: 1, producer: 0, reg: 1, cause: 'load-use' });
  assert.equal(s.inStage.MEM, 0);
});

test('steps: 8, 8, 6, 7 (8), 12 (17)', () => {
  assert.deepEqual([
    steps(P({ program: 'independent' })), steps(P({ program: 'raw', forwarding: false })), steps(P({ program: 'raw' })),
    steps(P({ program: 'load-use' })), steps(P({ program: 'load-use', forwarding: false })),
    steps(P({ program: 'mixed' })), steps(P({ program: 'mixed', forwarding: false }))
  ], [8, 8, 6, 7, 8, 12, 17]);
  assert.ok(Math.max(...logic.PROGRAM_IDS.flatMap((program) => [true, false].map((f) => steps(P({ program, forwarding: f }))))) <= 20);
});

test('step 0 is before cycle 1: nothing fetched; the last step has the last instruction in WB', () => {
  const s0 = at({ program: 'mixed' }, 0);
  assert.equal(s0.cycle, 0);
  assert.deepEqual(s0.inStage, { IF: null, ID: null, EX: null, MEM: null, WB: null });
  const s = end({ program: 'mixed' });
  assert.equal(s.inStage.WB, 6);
  assert.equal(s.finished, true);
  assert.equal(at({ program: 'mixed' }, 11).finished, false);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const program of logic.PROGRAM_IDS) for (const forwarding of [true, false]) {
    const p = P({ program, forwarding });
    for (let n = 0; n <= steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ program: 'mixed', forwarding: false });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ program: 'mixed' });
  let s = logic.initial(p);
  for (let n = 1; n <= 8; n++) {
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
  assert.equal(meta.steps, steps(P({})), 'meta.steps matches the model at the defaults');
  const sets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(sets.length > 0, 'found preset params');
  for (const body of sets) {
    for (const k of [...body.matchAll(/(\w+):/g)].map((x) => x[1])) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const pr = body.match(/program:\s*'([^']+)'/);
    if (pr) assert.ok(logic.PROGRAM_IDS.includes(pr[1]), `program ${pr[1]} exists`);
  }
  const sim = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, steps(P({})), 'sim.json steps matches the model at the defaults');
});
