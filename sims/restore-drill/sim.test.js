// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for restore-drill's model (SPEC.md). Run: node --test sims/restore-drill/
// Tie-breaks first, then one test per rule, then the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const steps = (over) => logic.steps(P(over));
const last = (over) => at(over, steps(over));
const row = (over, c) => last(over).cells[c].map((r) => r.v);
const R = (v) => ({ v });

// ── tie-breaks ──

test('tie-break (rule 7): a fail beats everything, all pass is green, anything else is grey', () => {
  assert.equal(logic.dashboard([R('pass'), R('fail')]), 'red');
  assert.equal(logic.dashboard([R('none'), R('fail')]), 'red');
  assert.equal(logic.dashboard([R('pass'), R('pass')]), 'green');
  assert.equal(logic.dashboard([R('pass'), R('none')]), 'grey');
  assert.equal(logic.dashboard([R('na')]), 'grey');
  assert.equal(logic.dashboard([]), 'grey');
});

test('tie-break (rule 8): size has no verdict without an earlier archive or a size; the run window does not hide the previous week', () => {
  assert.equal(last({ fault: 'named' }).cells.size[0].v, 'none');
  assert.equal(last({ fault: 'dotfile', repeat: true }).cells.size[3].v, 'none');
  assert.equal(last({ fault: 'checkpoint' }).cells.size[0].v, 'none');
  // four weeks start at 10-11: its size is still compared with 10-04, outside the window
  const s = last({ fault: 'checkpoint', weeks: 4 });
  assert.equal(s.jobs[0].date, '2026-10-11');
  assert.equal(s.cells.size[0].v, 'fail');
  assert.equal(s.cells.size[0].prev, 131945690300);
});

test('tie-break (rule 8): exactly half the previous size passes, less fails', () => {
  const sc = { kind: 'checkpoint', source: [{ path: 'db.*', bytes: null }], jobs: [{ bytes: 50, prevBytes: 100, members: ['db.*'] }] };
  assert.equal(logic.check('size', sc, 0).v, 'pass');
  sc.jobs[0].bytes = 49;
  assert.equal(logic.check('size', sc, 0).v, 'fail');
});

test('tie-break: focus is the first archive whose restore fails, else the newest', () => {
  assert.equal(last({ fault: 'checkpoint' }).focus, 4);
  assert.equal(last({ fault: 'checkpoint', weeks: 4 }).focus, 0);
  assert.equal(last({ fault: 'named', repeat: true }).focus, 0);
  const sc = logic.scenario(P({ fault: 'checkpoint' }));
  sc.jobs = sc.jobs.filter((j) => !j.partial);
  assert.equal(logic.focusOf(sc), sc.jobs.length - 1);
});

// ── rules ──

test('rule 1: tar -t and tar -d pass on an archive that misses a file', () => {
  const s = last({ fault: 'named' });
  assert.deepEqual([s.cells.list[0].v, s.cells.list[0].n, s.cells.list[0].status], ['pass', 2, 0]);
  assert.deepEqual([s.cells.diff[0].v, s.cells.diff[0].status], ['pass', 0]);
  assert.deepEqual(s.cells.restore[0].missing, ['var/named/lab.local.zone']);
});

test('rule 2: the job status is the only archive-side trace (2); a job that does not capture it passes', () => {
  const named = last({ fault: 'named' });
  assert.deepEqual([named.cells.status[0].v, named.cells.status[0].status], ['fail', 2]);
  const fails = logic.CHECKS.filter((c) => named.cells[c][0].v === 'fail');
  assert.deepEqual(fails, ['status', 'restore']);
  const dr = last({ fault: 'checkpoint' });
  assert.ok(dr.cells.status.every((r) => r.v === 'pass'));
  assert.ok(dr.jobs[4].log.some((l) => /Disk quota exceeded/.test(l)));
});

test('rule 3: the shell glob skips the dot-file: 15 names, 19 members, everything 0, only the restore fails', () => {
  assert.equal(logic.glob(logic.DOT_SRC).length, 15);
  assert.equal(logic.DOT_SRC.length, 16);
  const s = last({ fault: 'dotfile' });
  assert.equal(s.jobs[0].members.length, 19);
  assert.equal(s.jobs[0].exitStatus, 0);
  for (const c of ['exists', 'list', 'diff', 'gzip', 'status']) assert.equal(s.cells[c][0].v, 'pass', c);
  assert.deepEqual([s.cells.restore[0].v, s.cells.restore[0].status], ['fail', 1]);
  assert.deepEqual(s.cells.restore[0].missing, ['.postavke']);
  assert.equal(s.srcDir, '/var/tmp/vjezba23/izvor/vjezba17');
});

test('rule 4: a cut archive fails gzip -t (1) and tar -t (2) after listing both members', () => {
  const s = last({ fault: 'truncated' });
  assert.equal(s.jobs[0].bytes, 1671 - 200);
  assert.deepEqual([s.cells.gzip[0].v, s.cells.gzip[0].status], ['fail', 1]);
  assert.deepEqual([s.cells.list[0].v, s.cells.list[0].status, s.cells.list[0].n], ['fail', 2, 2]);
  assert.deepEqual([s.cells.diff[0].v, s.cells.restore[0].v, s.cells.restore[0].status], ['fail', 'fail', 2]);
  assert.equal(s.cells.status[0].v, 'pass');
});

test('rule 5: an empty archive lists no lines with status 0, like a clean tar -d', () => {
  const s = last({ fault: 'empty' });
  assert.equal(s.jobs[0].bytes, 45);
  assert.deepEqual([s.cells.list[0].v, s.cells.list[0].n, s.cells.list[0].status], ['pass', 0, 0]);
  assert.deepEqual([s.cells.diff[0].v, s.cells.diff[0].status], ['pass', 0]);
  assert.equal(s.jobs[0].log.filter((l) => /Permission denied/.test(l)).length, 2);
  assert.deepEqual([s.cells.status[0].v, s.cells.status[0].status], ['fail', 2]);
  assert.deepEqual(s.cells.restore[0].missing, ['etc/named.conf', 'var/named/lab.example.zone']);
});

test('rule 6: restore + compare with the source list; a directory member counts as its entry', () => {
  assert.deepEqual(logic.missingFrom([{ path: 'a' }, { path: 'd/' }, { path: '.x' }], ['a', 'd/', 'd/f']), ['.x']);
  assert.deepEqual(logic.restoreOf({ members: ['a'], cut: true }), { paths: ['a'], status: 2 });
  const dr = last({ fault: 'checkpoint' });
  assert.deepEqual(row({ fault: 'checkpoint' }, 'restore'), ['pass', 'pass', 'pass', 'pass', 'fail', 'pass', 'pass', 'pass']);
  assert.equal(dr.cells.restore[4].code, 'short');
  assert.equal(dr.cells.restore[4].want, Math.round((131945690300 + 132478266245) / 2));
});

test('rule 6: only the restore test catches every fault', () => {
  for (const fault of logic.FAULTS) {
    const s = last({ fault });
    assert.ok(s.cells.restore.some((r) => r.v === 'fail'), fault);
    assert.ok(s.cells.exists.every((r) => r.v === 'pass'), fault + ': the file always exists');
  }
  // the only fault the archive checks see is the content fault
  for (const fault of logic.FAULTS) {
    const seen = ['list', 'diff', 'gzip'].some((c) => row({ fault }, c).includes('fail'));
    assert.equal(seen, fault === 'truncated', fault);
  }
});

test('rule 8: checkpoint size fails on 10-11 only; gzip -t passes a short, cleanly closed stream', () => {
  assert.deepEqual(row({ fault: 'checkpoint' }, 'size'), ['none', 'pass', 'pass', 'pass', 'fail', 'pass', 'pass', 'pass']);
  assert.ok(row({ fault: 'checkpoint' }, 'gzip').every((v) => v === 'pass'));
  assert.ok(row({ fault: 'checkpoint' }, 'list').every((v) => v === 'na'));
  assert.equal(last({ fault: 'checkpoint' }).jobs[4].bytes, 1214000);
});

test('rule 9: steps = jobs + 3', () => {
  for (const fault of ['named', 'dotfile', 'truncated', 'empty']) {
    assert.equal(steps({ fault }), 4);
    assert.equal(steps({ fault, repeat: true }), 7);
  }
  assert.equal(steps({ fault: 'checkpoint' }), 11);
  assert.equal(steps({ fault: 'checkpoint', weeks: 4 }), 7);
  assert.equal(steps({ fault: 'checkpoint', repeat: true }), 11, 'repeat is ignored for checkpoints');
  assert.equal(steps({ fault: 'checkpoint', weeks: 99 }), 11, 'weeks clamped');
});

// ── one step ──

test('a job step runs only the relied-on check and sets its dashboard', () => {
  const s = at({ fault: 'named', reliedOn: 'diff' }, 1);
  assert.equal(s.phase, 'job');
  assert.equal(s.dash[0], 'green');
  for (const c of logic.CHECKS) assert.equal(s.cells[c][0] !== null, c === 'diff', c);
  assert.deepEqual(s.fresh, [['diff', 0]]);
  assert.equal(s.restored[0], null);
});

test('relying on the restore test restores at job time and turns the dashboard red', () => {
  const s = at({ fault: 'dotfile', reliedOn: 'restore' }, 1);
  assert.equal(s.dash[0], 'red');
  assert.deepEqual(s.restored[0].paths.length, 19);
});

test('after the jobs: restore every archive, then compare, then reveal every cell', () => {
  const o = { fault: 'checkpoint', weeks: 5 };
  const r = at(o, 6), c = at(o, 7), v = at(o, 8);
  assert.equal(r.phase, 'restore');
  assert.ok(r.restored.every(Boolean));
  assert.ok(r.cells.restore.every((x) => x === null));
  assert.equal(c.phase, 'compare');
  assert.ok(c.cells.restore.every(Boolean));
  assert.equal(c.fresh.length, 5);
  assert.equal(v.phase, 'reveal');
  for (const k of logic.CHECKS) assert.ok(v.cells[k].every(Boolean), k);
  assert.equal(v.fresh.length, 5 * 7 - 5 - 5, 'the relied-on row and the restore row were already filled');
});

test('the dashboards: green all 8 weeks on the log line; size would have caught 10-11', () => {
  assert.deepEqual(last({ fault: 'checkpoint', reliedOn: 'status' }).dash, Array(8).fill('green'));
  assert.deepEqual(last({ fault: 'checkpoint', reliedOn: 'size' }).dash, ['grey', 'green', 'green', 'green', 'red', 'green', 'green', 'green']);
  assert.deepEqual(last({ fault: 'named', reliedOn: 'diff' }).dash, ['green']);
  assert.deepEqual(last({ fault: 'dotfile', repeat: true }).dash, Array(4).fill('green'));
  assert.deepEqual(last({ fault: 'empty', reliedOn: 'list' }).dash, ['green']);
  assert.deepEqual(last({ fault: 'truncated', reliedOn: 'list' }).dash, ['red']);
});

test('bookkeeping: phase, cursor, focus and fresh per step', () => {
  const trace = (o) => Array.from({ length: steps(o) + 1 }, (_, n) => { const s = at(o, n); return [s.phase, s.cursor, s.focus, s.fresh.length]; });
  assert.deepEqual(trace({ fault: 'named' }), [['start', 0, null, 0], ['job', 1, 0, 1], ['restore', 1, 0, 0], ['compare', 1, 0, 1], ['reveal', 1, 0, 5]]);
  assert.deepEqual(trace({ fault: 'checkpoint', weeks: 4, reliedOn: 'restore' }), [['start', 0, null, 0],
    ['job', 1, 0, 1], ['job', 2, 1, 1], ['job', 3, 2, 1], ['job', 4, 3, 1],
    ['restore', 4, 0, 0], ['compare', 4, 0, 0], ['reveal', 4, 0, 24]]);
});

test('full final cells: the codes and fields the page writes', () => {
  const s = last({ fault: 'named' });
  assert.deepEqual(logic.CHECKS.map((c) => s.cells[c][0]), [
    { v: 'pass', code: 'exists', bytes: 1671, file: 'named-puna.tar.gz' },
    { v: 'none', code: 'first', bytes: 1671 },
    { v: 'pass', code: 'list', n: 2, status: 0 },
    { v: 'pass', code: 'nolines', status: 0 },
    { v: 'pass', code: 'ok', status: 0 },
    { v: 'fail', code: 'status', status: 2 },
    { v: 'fail', code: 'missing', missing: ['var/named/lab.local.zone'], status: 1 }]);
  assert.equal(s.srcDir, null, 'named compares with a list, not a directory');
  const tr = last({ fault: 'truncated' });
  assert.deepEqual([tr.cells.list[0], tr.cells.diff[0], tr.cells.gzip[0], tr.cells.restore[0]], [
    { v: 'fail', code: 'eof', n: 2, status: 2 }, { v: 'fail', code: 'eof', status: 2 },
    { v: 'fail', code: 'eof', status: 1 }, { v: 'fail', code: 'eof', status: 2 }]);
  const dot = last({ fault: 'dotfile' });
  assert.deepEqual([dot.cells.exists[0], dot.cells.size[0]], [
    { v: 'pass', code: 'exists', bytes: null, file: 'kvar1.tar.gz' }, { v: 'none', code: 'unknown', bytes: null }]);
  const dr = last({ fault: 'checkpoint' });
  assert.deepEqual(dr.cells.status[4], { v: 'pass', code: 'logline', status: 0 });
  assert.deepEqual(dr.cells.restore[4], { v: 'fail', code: 'short', bytes: 1214000, want: Math.round((131945690300 + 132478266245) / 2), status: 1 });
  assert.deepEqual(dr.jobs[4].members, ['db.*'], 'the short checkpoint holds the start of db.*: partial, not missing');
});

test('scenario data as in the sources', () => {
  assert.deepEqual(logic.CHECKPOINTS.map((c) => c[1]), [131146826383, 131413114355, 131679402328, 131945690300, 1214000,
    132478266245, 132744554217, 133010842189]);
  const dr = logic.scenario(P({ fault: 'checkpoint' }));
  assert.deepEqual(dr.jobs.map((j) => j.file.slice(11, 19)), ['20260913', '20260920', '20260927', '20261004', '20261011', '20261018', '20261025', '20261101']);
  assert.deepEqual(dr.jobs[4].log.filter((l) => /nightly OK|Disk quota|checkpointing/.test(l)).map((l) => l.slice(0, 8)), ['02:16:40', '02:58:12']);
  assert.ok(!dr.jobs.some((j) => j.log.some((l) => /p4|Perforce/.test(l))), 'no product name on the page');
  const named = logic.scenario(P({ fault: 'named' })).jobs[0];
  assert.equal(named.log.length, 2);
  assert.equal(logic.scenario(P({ fault: 'empty' })).jobs[0].log.length, 3);
  assert.deepEqual(logic.scenario(P({ fault: 'named', repeat: true })).jobs.map((j) => j.date), ['2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08']);
});

test('four nights: size passes from the second night (same size), the first has nothing to compare with', () => {
  assert.deepEqual(row({ fault: 'named', repeat: true }, 'size'), ['none', 'pass', 'pass', 'pass']);
  assert.equal(last({ fault: 'named', repeat: true }).cells.size[1].prev, 1671);
});

test('params are cleaned: unknown fault and check fall back to the defaults', () => {
  const o = logic.norm({ fault: 'x', reliedOn: 'gzip', weeks: 2, repeat: true });
  assert.deepEqual(o, { fault: 'named', reliedOn: ['exists'], weeks: 4, repeat: true });
});

// ── generic checks every sim keeps ──

const COMBOS = [];
for (const fault of logic.FAULTS) for (const reliedOn of logic.RELY) for (const repeat of [false, true]) COMBOS.push({ fault, reliedOn, repeat, weeks: 6 });

test('state is JSON-safe at every step', () => {
  for (const o of COMBOS) for (let n = 0; n <= steps(o); n++) {
    const s = at(o, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of COMBOS) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ fault: 'checkpoint', reliedOn: 'restore' });
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

test('every preset in the page is valid for the model, and the steps match sim.json', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 6, 'found preset params');
  for (const b of blocks) for (const k of b.matchAll(/(\w+):\s*('?[\w-]+'?)/g)) {
    assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
    if (k[1] === 'fault') assert.ok(logic.FAULTS.includes(k[2].replace(/'/g, '')), k[2]);
    if (k[1] === 'reliedOn') assert.ok(logic.RELY.includes(k[2].replace(/'/g, '')), k[2]);
  }
});
