// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-lvm-snapshot's model (SPEC.md). Run: node --test sims/lnx-lvm-snapshot/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const pct = (s) => logic.pctText(logic.dataPct(s));
const ver = (s, id) => logic.originOf(s, id).ver;
const O = logic.norm(P({}));
/** Run a script of I/Os from a fresh snapshot with the given params. */
function run(ops, over) {
  const o = logic.norm(P(over));
  let s = logic.initial(P(over));
  const evs = [];
  for (const op of ops) { const r = logic.io(s, op, o); s = r.s; evs.push(r.ev); }
  return { s, evs };
}
const W = (chunk) => ({ op: 'write', target: 'origin', chunk });
const WS = (chunk) => ({ op: 'write', target: 'snap', chunk });
const R = (chunk) => ({ op: 'read', chunk });

// ── tie-breaks first ──

test('rule 2 tie-break: the slot test is per chunk, not per write: rewriting C takes no new slot', () => {
  const { s, evs } = run([W('C'), W('C'), W('C')]);
  assert.equal(s.cow.length, 1);
  assert.equal(evs[1].slot, -1);
  assert.equal(evs[1].had, true);
  assert.equal(ver(s, 'C'), 4, 'every origin write still applies');
  assert.equal(s.cow[0].ver, 1, 'the slot keeps the version from the snapshot moment');
});

test('rule 2 tie-break: a chunk the snapshot wrote takes no slot when the origin writes it later', () => {
  const { s, evs } = run([WS('C'), W('C')]);
  assert.equal(s.cow.length, 1);
  assert.equal(evs[1].slot, -1);
  assert.equal(s.cow[0].src, 'snap');
  assert.equal(s.cow[0].ver, 2, 'the snapshot keeps its own C');
  assert.equal(ver(s, 'C'), 2);
});

test('rule 2 tie-break: the snapshot rewriting a saved chunk reuses that slot', () => {
  const { s, evs } = run([W('C'), WS('C')]);
  assert.equal(s.cow.length, 1);
  assert.equal(evs[1].slot, 0);
  assert.equal(s.cow[0].src, 'snap');
  assert.equal(s.cow[0].ver, 2, 'the snapshot\'s C goes up by one');
  assert.equal(logic.io(s, WS('C'), O).s.cow[0].ver, 3);
  assert.equal(ver(s, 'C'), 2);
});

test('rule 6 tie-break: a full area still takes rewrites of chunks it holds; only a new chunk invalidates', () => {
  const { s, evs } = run([W('A'), W('B'), W('A'), W('B')], { cap: 2 });
  assert.equal(s.valid, true);
  assert.equal(pct(s), '100.00');
  const r = logic.io(s, W('C'), O);
  assert.equal(r.s.valid, false);
  assert.equal(evs.some((e) => e.invalidated), false);
});

test('rule 7 tie-break: Data% exactly at the threshold does not grow; above it does (exceeds)', () => {
  // cap 4, threshold 50: write 2 → 50.00 → no growth; write 3 → 75.00 → grows
  const { s, evs } = run([W('A'), W('B'), W('C')], { autoextend: true, threshold: 50, percent: 50, vgFree: 4 });
  assert.equal(evs[1].after, 50);
  assert.equal(evs[1].grew, 0);
  assert.equal(evs[1].want, 0);
  assert.equal(evs[2].grew, 2);
  assert.equal(s.cap, 6);
});

test('rule 7 tie-break: a VG with exactly the growth free gives it', () => {
  const { s, evs } = run([W('A'), W('B'), W('C')], { autoextend: true, threshold: 70, percent: 50, vgFree: 2 });
  assert.equal(evs[2].grew, 2);
  assert.equal(s.vgFree, 0);
  assert.equal(s.cap, 6);
});

test('rule 7 tie-break: all or nothing: a VG with fewer free slots than the growth gives none', () => {
  const { s, evs } = run([W('A'), W('B'), W('C')], { autoextend: true, threshold: 70, percent: 50, vgFree: 1 });
  assert.equal(evs[2].want, 2);
  assert.equal(evs[2].short, true);
  assert.equal(evs[2].grew, 0);
  assert.equal(s.cap, 4);
  assert.equal(s.vgFree, 1);
});

test('rule 7 tie-break: the growth rounds up and is at least one slot', () => {
  const a = run([W('A'), W('B'), W('C')], { cap: 4, autoextend: true, threshold: 70, percent: 10, vgFree: 8 });
  assert.equal(a.evs[2].grew, 1, 'ceil(4 × 10 %) = 1');
  const b = run([W('A'), W('B'), W('C')], { cap: 3, autoextend: true, threshold: 70, percent: 50, vgFree: 8 });
  assert.equal(b.evs[1].grew, 0, '2 of 3 = 66.67 < 70');
  assert.equal(b.evs[2].grew, 2, 'ceil(3 × 50 %) = ceil(1.5) = 2');
  assert.equal(b.evs[1].after.toFixed(2), '66.67');
  const c = run([W('A'), W('B'), W('C')], { cap: 4, autoextend: true, threshold: 70, percent: 30, vgFree: 8 });
  assert.equal(c.evs[2].grew, 2, 'ceil(4 × 30 %) = ceil(1.2) = 2, not round');
});

// ── rules ──

test('rule 1: the first origin write copies the old chunk into one slot, then overwrites the origin', () => {
  const { s, evs } = run([W('C')]);
  assert.deepEqual(s.cow, [{ chunk: 'C', ver: 1, src: 'origin' }]);
  assert.equal(evs[0].slot, 0);
  assert.equal(evs[0].saved, 1);
  assert.equal(ver(s, 'C'), 2);
  assert.equal(ver(s, 'A'), 1);
});

test('rule 3: the snapshot reads its slot if there is one, else the current origin chunk', () => {
  const { s } = run([W('C')]);
  assert.deepEqual(logic.readSnap(s, 'C'), { from: 'cow', ver: 1, src: 'origin', slot: 0 });
  assert.deepEqual(logic.readSnap(s, 'A'), { from: 'origin', ver: 1, src: null, slot: -1 });
  // every chunk reads as at the snapshot moment
  for (const id of logic.CHUNKS) assert.equal(logic.readSnap(s, id).ver, 1);
});

test('rule 4: a snapshot write takes a slot for a new chunk and leaves the origin alone', () => {
  const { s, evs } = run([WS('H')]);
  assert.deepEqual(s.cow, [{ chunk: 'H', ver: 2, src: 'snap' }]);
  assert.equal(evs[0].slot, 0);
  assert.equal(ver(s, 'H'), 1);
  assert.equal(logic.readSnap(s, 'H').ver, 2);
});

test('rule 5: Data% = used / cap with two decimals', () => {
  assert.equal(pct(run([W('A')], { cap: 3 }).s), '33.33');
  assert.equal(pct(run([W('A'), W('B')], { cap: 3 }).s), '66.67');
  assert.equal(pct(run([W('A'), W('B')], { cap: 8 }).s), '25.00');
  assert.equal(pct(logic.initial(P({}))), '0.00');
});

test('rule 6: slot cap + 1 invalidates: attr I, Data% 100, content lost, the origin goes on', () => {
  const { s, evs } = run([W('A'), W('B'), W('C')], { cap: 2 });
  assert.equal(evs[2].invalidated, true);
  assert.equal(s.valid, false);
  assert.equal(logic.snapAttr(s), 'swi-I-s---');
  assert.equal(logic.snapAttr(logic.initial(P({}))), 'swi-a-s---');
  assert.equal(logic.snapAttr(logic.initial(P({ scene: 'backup-window' }))), 'swi-aos---', 'mounted: open');
  assert.equal(logic.snapAttr(Object.assign(logic.initial(P({ scene: 'backup-window' })), { valid: false })), 'swi-Ios---');
  assert.equal(pct(s), '100.00');
  assert.equal(ver(s, 'C'), 2, 'the origin write went through');
  assert.equal(logic.readSnap(s, 'A').from, 'lost', 'even a saved chunk is gone');
  assert.equal(logic.readSnap(s, 'P').from, 'lost');
  // later: origin writes go on; snapshot writes and reads fail; it stays invalid
  const r1 = logic.io(s, W('D'), O);
  assert.equal(ver(r1.s, 'D'), 2);
  assert.equal(r1.ev.failed, false);
  const r2 = logic.io(s, WS('E'), O);
  assert.equal(r2.ev.failed, true);
  assert.equal(ver(r2.s, 'E'), 1);
  assert.equal(logic.io(s, R('B'), O).ev.failed, true);
});

test('rule 6: autoextend no longer helps an invalid snapshot', () => {
  const { s } = run([W('A'), W('B'), W('C')], { cap: 2, autoextend: true, threshold: 95, percent: 50, vgFree: 0 });
  assert.equal(s.valid, false);
  const copy = Object.assign(JSON.parse(JSON.stringify(s)), { vgFree: 8 });
  const a = logic.autoextend(copy, logic.norm(P({ autoextend: true, threshold: 50, percent: 50 })));
  assert.equal(a.grew, 0);
  assert.equal(copy.cap, 2);
  // Data% of an invalid snapshot is 100 whatever its slots held
  assert.equal(logic.pctText(logic.dataPct({ valid: false, cow: [], cap: 4 })), '100.00');
});

test('rule 7: autoextend off never grows; on, it takes VG free space', () => {
  const off = run([W('A'), W('B'), W('C'), W('D')]);
  assert.equal(off.s.cap, 4);
  assert.equal(off.s.vgFree, 4);
  const on = run([W('A'), W('B'), W('C')], { autoextend: true, vgFree: 4 });
  assert.equal(on.s.cap, 6);
  assert.equal(on.s.vgFree, 2);
});

test('reads change nothing', () => {
  const a = run([W('C')]).s;
  const r = logic.io(a, R('C'), O);
  assert.deepEqual({ ...r.s }, a);
});

// ── presets (SPEC.md "Presets") ──

const series = (over) => {
  const p = P(over), out = [];
  for (let n = 1; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n));
  return out;
};

test('preset fill-up: 25, 50, 75, 100, then write 5 invalidates; the origin has all 6 writes', () => {
  const ss = series({ scene: 'fill-up' });
  assert.equal(ss.length, 6);
  assert.deepEqual(ss.slice(0, 4).map(pct), ['25.00', '50.00', '75.00', '100.00']);
  assert.equal(ss[3].valid, true);
  assert.equal(ss[4].valid, false);
  assert.equal(ss[4].ev.invalidated, true);
  for (const id of 'CFHKMA') assert.equal(ver(ss[5], id), 2);
});

test('preset same-chunks: 10 writes to A and B stop at 50 %, the snapshot still reads A1, B1', () => {
  const ss = series({ scene: 'same-chunks' });
  assert.equal(ss.length, 10);
  assert.deepEqual(ss.map(pct), ['25.00', '50.00', '50.00', '50.00', '50.00', '50.00', '50.00', '50.00', '50.00', '50.00']);
  const last = ss[9];
  assert.equal(last.valid, true);
  assert.equal(logic.readSnap(last, 'A').ver, 1);
  assert.equal(logic.readSnap(last, 'B').ver, 1);
  assert.equal(ver(last, 'A'), 6);
});

test('preset autoextend: write 3 → cap 6 (VG free 4), write 5 → cap 9 (VG free 1), all fit', () => {
  const over = { scene: 'autoextend', autoextend: true, threshold: 70, percent: 50, vgFree: 6 };
  const ss = series(over);
  assert.equal(ss.length, 6);
  assert.deepEqual(ss.map((s) => s.ev.after.toFixed(2)), ['25.00', '50.00', '75.00', '66.67', '83.33', '66.67']);
  assert.deepEqual(ss.map((s) => s.cap), [4, 4, 6, 6, 9, 9]);
  assert.deepEqual(ss.map((s) => s.vgFree), [6, 6, 4, 4, 1, 1]);
  assert.deepEqual(ss.map(pct), ['25.00', '50.00', '50.00', '66.67', '55.56', '66.67']);
  assert.deepEqual(ss.map((s) => s.ev.final.toFixed(2)), ['25.00', '50.00', '50.00', '66.67', '55.56', '66.67']);
  assert.ok(ss.every((s) => s.valid));
  const off = series(Object.assign({}, over, { autoextend: false }));
  assert.equal(off[4].valid, false, 'without autoextend write 5 invalidates');
});

test('preset snapshot-write: two slots each side, 100 % after 4, the 5th (origin) invalidates', () => {
  const ss = series({ scene: 'snapshot-write' });
  assert.equal(ss.length, 5);
  assert.deepEqual(ss.slice(0, 4).map(pct), ['25.00', '50.00', '75.00', '100.00']);
  assert.deepEqual(ss[3].cow.map((x) => x.src), ['origin', 'snap', 'origin', 'snap']);
  assert.equal(ss[4].ev.target, 'origin');
  assert.equal(ss[4].valid, false);
});

test('preset backup-window: reads from origin and CoW, then the reads after invalidation fail', () => {
  const ss = series({ scene: 'backup-window', cap: 3 });
  assert.equal(ss.length, 8);
  assert.deepEqual(ss.map((s) => s.ev.op[0] + s.ev.chunk).join(' '), 'wC rA wD rC wE wF rD rE');
  assert.equal(ss[1].ev.read.from, 'origin');
  assert.equal(ss[3].ev.read.from, 'cow');
  assert.equal(ss[3].ev.read.ver, 1);
  assert.equal(ver(ss[3], 'C'), 2);
  assert.equal(pct(ss[4]), '100.00');
  assert.equal(ss[4].valid, true);
  assert.equal(ss[5].ev.invalidated, true);
  assert.equal(ss[6].ev.failed, true);
  assert.equal(ss[7].ev.failed, true);
  for (const id of 'CDEF') assert.equal(ver(ss[7], id), 2);
});

test('params are clamped and stepped, both ends', () => {
  const lo = logic.norm({ cap: -5, threshold: 0, percent: 0, vgFree: -3, scene: 'nope', autoextend: 'yes' });
  assert.deepEqual(lo, { scene: 'fill-up', cap: 2, autoextend: false, threshold: 50, percent: 10, vgFree: 0 });
  const hi = logic.norm({ cap: 99, threshold: 120, percent: 300, vgFree: 99, autoextend: true });
  assert.deepEqual(hi, { scene: 'fill-up', cap: 8, autoextend: true, threshold: 95, percent: 100, vgFree: 8 });
  const st = logic.norm({ threshold: 72, percent: 44 });
  assert.equal(st.threshold, 70);
  assert.equal(st.percent, 40);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene, autoextend: true, threshold: 50, percent: 30 });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene, cap: 3, autoextend: true, vgFree: 5 });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scene: 'snapshot-write' });
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
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the default preset');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const scenes = [...html.matchAll(/scene:\s*'([\w-]+)'/g)].map((m) => m[1]);
  // each page preset's params, as SPEC.md "Presets" sets them
  const presets = Object.fromEntries([...html.matchAll(/\{ id: '([\w-]+)', label: [^,]+, params: (\{[^}]*\})/g)]
    .map((m) => [m[1], Function('return ' + m[2])()]));
  const off = { cap: 4, vgFree: 4, autoextend: false };
  assert.deepEqual(presets, {
    'fill-up': { scene: 'fill-up', ...off },
    'same-chunks': { scene: 'same-chunks', ...off },
    autoextend: { scene: 'autoextend', cap: 4, vgFree: 6, autoextend: true, threshold: 70, percent: 50 },
    'snapshot-write': { scene: 'snapshot-write', ...off },
    'backup-window': { scene: 'backup-window', ...off, cap: 3 }
  });
  assert.deepEqual([...new Set(scenes)].sort(), [...logic.SCENE_IDS].sort(), 'every scene has a preset');
});
