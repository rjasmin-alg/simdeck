// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-wsus-cloned-id's model (rules: SPEC.md). Run: node --test sims/win-wsus-cloned-id/
// Times are literal minutes from Mon 00:00 (09:20 = 560), so a changed constant in the model fails here.
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
const rows = (s) => logic.rowsOf(s).map((r) => [r.id, r.name, r.status]);
const hm = (h, m = 0) => h * 60 + m;
/** Run from a hand-made state (tie-breaks the presets do not reach). */
function runFrom(s, p, n) { for (let i = 1; i <= n; i++) s = logic.step(s, i, p); return s; }

// ── tie-breaks first ──

test('tie-break 6: two reports with one ID in the same minute: the later machine in order wins the row', () => {
  const p = P({});
  const s = at({}, 1);
  s.machines[0].nextReport = hm(9, 20);           // PC-01 and PC-02 both due at 09:20
  const after = runFrom(s, p, 2);
  assert.deepEqual(after.log.slice(1).map((e) => [e.t, e.who]), [[hm(9, 20), 0], [hm(9, 20), 1]]);
  assert.deepEqual(rows(after), [['7f3a', 'PC-02', 'needed']]);
  // PC-02 and PC-03 both due at 09:20: PC-03, later in order, wins
  const s2 = at({}, 1);
  s2.machines[2].nextReport = hm(9, 20);
  const after2 = runFrom(s2, P({}), 3);
  assert.deepEqual(after2.log.slice(2).map((e) => [e.t, e.who]), [[hm(9, 20), 1], [hm(9, 20), 2]]);
  assert.deepEqual(rows(after2), [['7f3a', 'PC-03', 'installed']]);
});

test('tie-break 6: a reset machine due in the same minute as another goes first by machine order', () => {
  const s = end({ resetAt: 3 });
  assert.deepEqual(s.log.map((e) => [e.kind, e.t, e.who ?? null]), [
    ['deploy', hm(8), null], ['report', hm(9), 0], ['report', hm(9, 20), 1], ['reset', hm(9, 30), 1],
    ['report', hm(9, 40), 1], ['report', hm(9, 40), 2]]);
  assert.deepEqual(rows(s), [['7f3a', 'PC-03', 'installed'], ['9c6b', 'PC-02', 'needed']]);
});

test('events never go back in time', () => {
  for (const clones of [2, 3, 4, 5]) for (const generalised of [false, true]) for (let resetAt = -1; resetAt <= 9; resetAt++) {
    const p = P({ clones, generalised, resetAt });
    const s = end(p);
    for (let i = 1; i < s.log.length; i++) assert.ok(s.log[i].t >= s.log[i - 1].t, JSON.stringify(p));
  }
});

// ── rule 1: keyed by client ID, not by name ──

test('rule 1: three clones with one ID give one console row', () => {
  const s = end({});
  assert.deepEqual(Object.keys(s.console), ['7f3a']);
  assert.deepEqual(s.machines.map((m) => m.clientId), ['7f3a', '7f3a', '7f3a']);
  assert.equal(logic.summaryOf(s).rows, 1);
  assert.equal(logic.summaryOf(s).machines, 3);
});

test('rule 1: one ID per row whatever the names; the row count is the number of distinct IDs', () => {
  for (const clones of [2, 3, 4, 5]) for (const generalised of [false, true]) {
    const s = end({ clones, generalised });
    const ids = new Set(s.machines.map((m) => m.clientId));
    assert.equal(logic.rowsOf(s).length, ids.size);
    assert.equal(logic.rowsOf(s).length, generalised ? clones : 1);
  }
});

// ── rule 2: the ID is copied with the disk ──

test('rule 2: without generalising, every clone starts with the image\'s ID 7f3a', () => {
  const s0 = at({}, 0);
  assert.equal(s0.image.id, '7f3a');
  assert.equal(s0.deployed, false);
  assert.deepEqual(s0.machines.map((m) => m.clientId), [null, null, null]);
  const s1 = at({ clones: 5 }, 1);
  assert.equal(s1.ev.kind, 'deploy');
  assert.equal(s1.t, hm(8));
  assert.deepEqual(s1.machines.map((m) => m.clientId), ['7f3a', '7f3a', '7f3a', '7f3a', '7f3a']);
  assert.deepEqual(s1.console, {});
});

// ── rule 3: a report overwrites the row of its ID ──

test('rule 3 (one-row): the row\'s name flips PC-01 → PC-02 → PC-03; name, IP, time and status are the last reporter\'s', () => {
  const o = { pc02Missing: false };
  assert.equal(logic.steps(P(o)), 4);
  const names = [2, 3, 4].map((n) => at(o, n).console['7f3a']);
  assert.deepEqual(names.map((r) => [r.name, r.ip, r.lastReport]),
    [['PC-01', '10.0.20.11', hm(9)], ['PC-02', '10.0.20.12', hm(9, 20)], ['PC-03', '10.0.20.13', hm(9, 40)]]);
  const s3 = at(o, 3);
  assert.equal(s3.ev.created, false);
  assert.deepEqual([s3.ev.who, s3.ev.id], [1, '7f3a']);
  assert.deepEqual(s3.machines.map((m) => [m.lastReport, m.reportedId]), [[hm(9), '7f3a'], [hm(9, 20), '7f3a'], [null, null]]);
  assert.deepEqual(s3.ev.before, { name: 'PC-01', ip: '10.0.20.11', status: 'installed', lastReport: hm(9) });
  assert.equal(at(o, 2).ev.created, true);
});

test('rule 3 (false-green): status ✓ → ✕ → ✓; the console says 0 needed while PC-02 misses KB-C', () => {
  assert.equal(logic.steps(P({})), 4);
  assert.deepEqual([2, 3, 4].map((n) => at({}, n).console['7f3a'].status), ['installed', 'needed', 'installed']);
  assert.deepEqual(logic.summaryOf(at({}, 0)), { rows: 0, installed: 0, needed: 0, machines: 3, missing: 1, unseen: 3 });
  assert.deepEqual(logic.summaryOf(at({}, 2)), { rows: 1, installed: 1, needed: 0, machines: 3, missing: 1, unseen: 2 });
  const sum = logic.summaryOf(end({}));
  assert.deepEqual(sum, { rows: 1, installed: 1, needed: 0, machines: 3, missing: 1, unseen: 2 });
});

test('rule 3: with two clones PC-02 reports last and the row is (by chance) right', () => {
  const s = end({ clones: 2 });
  assert.deepEqual(rows(s), [['7f3a', 'PC-02', 'needed']]);
});

test('reports: PC-0k at 09:00 + 20 min · (k − 1), one each', () => {
  const s = end({ clones: 5 });
  assert.deepEqual(s.log.filter((e) => e.kind === 'report').map((e) => [e.who, e.t]),
    [[0, 540], [1, 560], [2, 580], [3, 600], [4, 620]]);
  assert.ok(s.machines.every((m) => m.nextReport === null));
});

// ── rule 4: a generalised image ──

test('rule 4 (generalised-image): each clone makes its own ID at first start; three rows from the first reports', () => {
  const o = { generalised: true };
  assert.equal(logic.steps(P(o)), 4);
  assert.deepEqual(at(o, 0).machines.map((m) => m.clientId), [null, null, null]);
  assert.deepEqual(at(o, 1).machines.map((m) => m.clientId), ['a2c4', 'd91e', '5b07']);
  assert.deepEqual(at(o, 1).ev.ids, ['a2c4', 'd91e', '5b07']);
  assert.deepEqual(at({}, 1).ev.ids, ['7f3a', '7f3a', '7f3a']);
  assert.deepEqual([at(o, 3).ev.who, at(o, 3).ev.id], [1, 'd91e']);
  assert.deepEqual(end(o).machines.map((m) => m.reportedId), ['a2c4', 'd91e', '5b07']);
  assert.deepEqual(rows(end(o)), [['a2c4', 'PC-01', 'installed'], ['d91e', 'PC-02', 'needed'], ['5b07', 'PC-03', 'installed']]);
  assert.deepEqual(logic.summaryOf(end(o)), { rows: 3, installed: 2, needed: 1, machines: 3, missing: 1, unseen: 0 });
  assert.deepEqual(at({ generalised: true, clones: 5 }, 1).machines.map((m) => m.clientId), ['a2c4', 'd91e', '5b07', 'e3f8', '16bd']);
});

// ── rule 5: resetting one machine's ID ──

test('rule 5 (reset-one): PC-02 gets 9c6b at 09:50 and a second row at 10:00; PC-01 and PC-03 still share 7f3a', () => {
  const o = { resetAt: 4 };
  assert.equal(logic.steps(P(o)), 6);
  const s5 = at(o, 5);
  assert.deepEqual([s5.ev.kind, s5.ev.t, s5.ev.who, s5.ev.oldId, s5.ev.id], ['reset', hm(9, 50), 1, '7f3a', '9c6b']);
  assert.equal(s5.machines[1].clientId, '9c6b');
  assert.equal(s5.machines[1].nextReport, hm(10));
  assert.deepEqual([s5.machines[1].lastReport, s5.machines[1].reportedId], [hm(9, 20), '7f3a']);   // a reset keeps the last report
  assert.deepEqual(rows(s5), [['7f3a', 'PC-03', 'installed']]);     // a reset adds no row by itself
  const s6 = at(o, 6);
  assert.deepEqual([s6.ev.kind, s6.ev.t, s6.ev.created, s6.ev.who, s6.ev.id], ['report', hm(10), true, 1, '9c6b']);
  assert.deepEqual([s6.machines[1].lastReport, s6.machines[1].reportedId], [hm(10), '9c6b']);
  assert.deepEqual(rows(s6), [['7f3a', 'PC-03', 'installed'], ['9c6b', 'PC-02', 'needed']]);
  assert.equal(s6.machines[0].clientId, '7f3a');
  assert.equal(s6.machines[2].clientId, '7f3a');
  assert.deepEqual(logic.summaryOf(s6), { rows: 2, installed: 1, needed: 1, machines: 3, missing: 1, unseen: 1 });
});

test('rule 5: the reset is the step right after the button; next contact = min(scheduled report, reset + 10)', () => {
  const s = end({ resetAt: 2 });
  assert.deepEqual(s.log.map((e) => [e.kind, e.t]), [['deploy', 480], ['report', 540], ['reset', 550], ['report', 560], ['report', 580]]);
  assert.deepEqual(rows(s), [['7f3a', 'PC-03', 'installed'], ['9c6b', 'PC-02', 'needed']]);
  const s1 = end({ resetAt: 1 });                                   // reset at 08:10: PC-02's own report at 09:20 is later
  assert.deepEqual(s1.log.map((e) => [e.kind, e.t]), [['deploy', 480], ['reset', 490], ['report', 500], ['report', 540], ['report', 580]]);
});

test('rule 5: a scheduled report sooner than reset + 10 is kept (hand-made state)', () => {
  const p = P({ resetAt: 2 });
  const s = at({ resetAt: 2 }, 2);                  // 09:00, PC-01 has reported
  s.machines[1].nextReport = hm(9, 12);             // PC-02 due at 09:12, before reset (09:10) + 10
  const r = logic.step(s, 3, p);
  assert.deepEqual([r.ev.kind, r.ev.t], ['reset', hm(9, 10)]);
  assert.equal(r.machines[1].nextReport, hm(9, 12));
});

test('rule 5: a reset before the clones exist is rejected and changes nothing', () => {
  const s1 = at({ resetAt: 0 }, 1);
  assert.deepEqual([s1.ev.kind, s1.ev.t, s1.ev.rejected], ['reset', hm(7, 40), 'notDeployed']);
  assert.equal(s1.deployed, false);
  assert.deepEqual(s1.machines.map((m) => m.clientId), [null, null, null]);
  const s = end({ resetAt: 0 });
  assert.equal(logic.steps(P({ resetAt: 0 })), 5);
  assert.deepEqual(rows(s), [['7f3a', 'PC-03', 'installed']]);
});

test('rule 5: on a generalised image the old row stays as a stale entry and PC-02 shows twice', () => {
  const s = end({ generalised: true, resetAt: 4 });
  assert.deepEqual(rows(s).map((r) => r.slice(0, 2)), [['a2c4', 'PC-01'], ['d91e', 'PC-02'], ['5b07', 'PC-03'], ['9c6b', 'PC-02']]);
  assert.equal(s.console.d91e.lastReport, hm(9, 20));
  assert.equal(s.console['9c6b'].lastReport, hm(10));
});

test('rule 5: a button pressed past the end resets at the end; one reset per run', () => {
  const o = { resetAt: 9 };
  assert.equal(logic.steps(P(o)), 6);
  const s = end(o);
  assert.deepEqual(s.log.slice(4).map((e) => [e.kind, e.t]), [['reset', hm(9, 50)], ['report', hm(10)]]);
  assert.equal(s.log.filter((e) => e.kind === 'reset').length, 1);
  assert.equal(logic.steps(P({ clones: 5, resetAt: 6 })), 8);
});

// ── truth on the machines ──

test('only PC-02 misses KB-C, and only when pc02Missing is on', () => {
  assert.deepEqual(at({ clones: 5 }, 0).machines.map((m) => m.patched), [true, false, true, true, true]);
  assert.deepEqual(at({ clones: 5, pc02Missing: false }, 0).machines.map((m) => m.patched), [true, true, true, true, true]);
});

test('clones is clamped to 2–5', () => {
  assert.equal(at({ clones: 1 }, 0).machines.length, 2);
  assert.equal(at({ clones: 9 }, 0).machines.length, 5);
});

test('the demo ends when no event is left; a step past the end changes nothing', () => {
  const p = P({});
  const s = end({});
  assert.equal(logic.nextEvent(s, 5, p), null);
  const past = logic.step(s, 5, p);
  assert.equal(past.ev, null);
  assert.deepEqual(past.console, s.console);
});

test('steps stay within 20 for every combination', () => {
  let max = 0;
  for (const clones of [2, 3, 4, 5]) for (const generalised of [false, true]) for (let resetAt = -1; resetAt <= 9; resetAt++) {
    max = Math.max(max, logic.steps(P({ clones, generalised, resetAt })));
  }
  assert.equal(max, 8);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = P({ clones: 5, generalised: true, resetAt: 3 });
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ clones: 4, resetAt: 2 });
  const N = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= N; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = N; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ resetAt: 2 });
  for (let n = 0; n < logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    const copy = structuredClone(s);
    logic.step(s, n + 1, p);
    assert.deepEqual(s, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, with the step counts SPEC.md gives', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const presets = [...html.matchAll(/\{ id: '([\w-]+)',[^\n]*params: \{([^}]*)\}/g)];
  assert.deepEqual(presets.map((m) => m[1]), ['one-row', 'false-green', 'reset-one', 'generalised-image']);
  const want = { 'one-row': 4, 'false-green': 4, 'reset-one': 6, 'generalised-image': 4 };
  for (const m of presets) {
    const over = {};
    for (const kv of m[2].matchAll(/(\w+):\s*([^,\s]+)/g)) {
      assert.ok(kv[1] in logic.defaults, `preset param ${kv[1]} is a model param`);
      over[kv[1]] = JSON.parse(kv[2]);
    }
    assert.equal(logic.steps(P(over)), want[m[1]], m[1]);
  }
});
