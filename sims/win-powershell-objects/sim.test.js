// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-powershell-objects. Run: node --test sims/win-powershell-objects/
// Rules: SPEC.md. Tie-breaks first, then one test per rule, then presets, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const lanes = (over) => logic.lanes(P(over));
const names = (files, src) => src.filter((s) => s !== null).map((s) => files[s].name);
const lastStage = (l, lane) => l[lane].stages[l[lane].stages.length - 1];
const FILES = logic.listing(P({}));

// ── tie-breaks ──

test('tie-break: equal sizes sort by name in the bash lane, as text and with -n, whatever the input order', () => {
  const ls = logic.lsLong(FILES);
  const rev = { out: ls.out.slice().reverse(), src: ls.src.slice().reverse() };
  for (const n of [false, true]) {
    for (const input of [ls, rev]) {
      const order = names(FILES, logic.sortLines(input, { k: 5, n }).src);
      assert.ok(order.indexOf('raspored.csv') + 1 === order.indexOf('tablica.csv'), `n=${n}: raspored.csv right before tablica.csv`);
    }
  }
});

test('tie-break: Sort-Object keeps arrival order for equal keys (the model is stable), so equal sizes keep the listing\'s name order', () => {
  const objs = logic.getChildItem(FILES);
  const order = logic.sortObjects(objs, 'Length').out.map((o) => o.props.Name);
  assert.ok(order.indexOf('raspored.csv') + 1 === order.indexOf('tablica.csv'));
  // stable: reversed input keeps the reversed order for the tie (the name order comes from the listing)
  const rev = logic.sortObjects({ out: objs.out.slice().reverse() }, 'Length').out.map((o) => o.props.Name);
  assert.ok(rev.indexOf('tablica.csv') + 1 === rev.indexOf('raspored.csv'));
});

test('tie-break: both lanes list the directory in the same name order', () => {
  const l = lanes({ nameWithSpace: true });
  const bashNames = names(l.data, l.bash.stages[0].src);
  const psNames = l.ps.stages[0].out.map((o) => o.props.Name);
  assert.deepEqual(bashNames, psNames);
  assert.equal(psNames[2], 'godišnji izvještaj.pdf');
});

// ── rule 1: a bash pipe carries text; each program finds the meaning itself ──

test('rule 1: every bash stage writes lines of text, each a separate process', () => {
  for (const task of logic.TASKS) {
    const l = lanes({ task });
    l.bash.stages.forEach((st, i) => {
      assert.ok(st.out.every((x) => typeof x === 'string'), `${task} ${st.cmd} writes strings`);
      assert.equal(st.proc, i, 'one process per command');
    });
    assert.deepEqual(l.bash.terminal, lastStage(l, 'bash').out, 'the terminal shows the last lines as they are');
  }
});

test('rule 1: awk sees only the text: the same line from anywhere gives the same answer', () => {
  const line = '-rw-r--r-- 1 ana ana 2000000 Nov  3 10:15 x.bin';
  assert.deepEqual(logic.awkBigFiles({ out: [line, 'total 4'], src: [null, null] }).out, ['x.bin'], 'field 5 compared as a number; the total line is skipped');
  const exact = '-rw-r--r-- 1 ana ana 1048576 Nov  3 10:15 y.bin';
  assert.deepEqual(logic.awkBigFiles({ out: [exact], src: [null] }).out, [], '$5 > 1048576 is strict');
  assert.deepEqual(logic.awkLastDotField({ out: ['a.tar.gz', 'README'], src: [0, 1] }).out, ['gz', 'README'], 'awk -F. prints the last field, $NF');
});

// ── rule 2: a PowerShell pipe carries objects, in one process ──

test('rule 2: every PowerShell stage passes objects with a type and properties, all in one process', () => {
  for (const task of logic.TASKS) {
    for (const formatEarly of [false, true]) {
      const l = lanes({ task, formatEarly });
      l.ps.stages.forEach((st) => {
        assert.equal(st.proc, 0);
        assert.ok(st.out.every((o) => typeof o.type === 'string' && o.props && typeof o.props === 'object'), `${st.cmd} passes objects`);
      });
      assert.ok(l.ps.terminal.every((x) => typeof x === 'string'), 'only the terminal turns them into text');
    }
  }
  const o = logic.getChildItem(FILES).out[0];
  assert.equal(o.type, 'FileInfo');
  assert.equal(typeof o.props.Length, 'number');
  assert.equal(typeof o.props.Name, 'string');
});

// ── rule 3: a space in a name shifts awk's fields ──

test('rule 3: awk splits at runs of blanks; a name with a space makes a 10th field and $9 is half the name', () => {
  const ls = logic.lsLong(logic.listing(P({ nameWithSpace: true })));
  const line = ls.out.find((l) => l.includes('godišnji'));
  assert.equal(logic.fields(line).length, 10);
  assert.equal(logic.field(line, 5), '2516582');
  assert.equal(logic.field(line, 9), 'godišnji');
  assert.equal(logic.fields('  a   b\tc ').length, 3, 'leading and repeated blanks do not make empty fields');
  const res = logic.awkBigFiles(ls);
  assert.ok(res.out.includes('godišnji') && !res.out.includes('godišnji izvještaj.pdf'));
  assert.deepEqual(res.issue, { code: 'field-shift', items: [{ src: 2, nf: 10 }] });
  assert.equal(logic.awkBigFiles(logic.lsLong(FILES)).issue, null, 'no space, no shift');
});

// ── rule 4: PowerShell filters on a property; 1MB is 1048576 ──

test('rule 4: 1MB is the number 1048576 (KB, MB, GB are powers of 1024)', () => {
  assert.equal(logic.psNumber('1MB'), 1048576);
  assert.equal(logic.psNumber('1KB'), 1024);
  assert.equal(logic.psNumber('2GB'), 2147483648);
  assert.equal(logic.psNumber('1mb'), 1048576);
});

test('rule 4: Where-Object Length -gt 1MB reads Length: strictly greater, spaces in names do not matter', () => {
  const files = logic.listing(P({ nameWithSpace: true })).concat([{ name: 'tocno 1 MiB.bin', size: 1048576, mtime: '2026-11-03T10:15' }]);
  const kept = logic.whereGt(logic.getChildItem(files), 'Length', '1MB').out.map((o) => o.props.Name);
  assert.deepEqual(kept, ['arhiva.zip', 'godišnji izvještaj.pdf', 'predavanje.mp4', 'prezentacija.pptx']);
  const l = lanes({ nameWithSpace: true });
  assert.deepEqual(lastStage(l, 'ps').out.map((o) => o.props.Name), ['arhiva.zip', 'godišnji izvještaj.pdf', 'predavanje.mp4', 'prezentacija.pptx']);
  assert.equal(l.ps.correct, true);
  assert.equal(l.bash.correct, false);
});

test('rule 4: an object without the property does not pass Where-Object', () => {
  assert.deepEqual(logic.whereGt({ out: [{ type: 'X', props: {}, src: 0 }] }, 'Length', '1MB').out, []);
});

// ── rule 5: sorting a number ──

test('rule 5: sort -k5 compares text: 1048577 before 980; -n compares numbers', () => {
  const ls = logic.lsLong(FILES);
  const text = names(FILES, logic.sortLines(ls, { k: 5, n: false }).src);
  assert.ok(text.indexOf('predavanje.mp4') < text.indexOf('bilješke.txt'), '1048577 before 980');
  assert.equal(text[text.length - 1], 'bilješke.txt', '980 last: 9 is the largest first digit');
  const num = logic.sortLines(ls, { k: 5, n: true });
  assert.deepEqual(names(FILES, num.src), ['bilješke.txt', 'raspored.csv', 'tablica.csv', 'predavanje.mp4', 'prezentacija.pptx', 'arhiva.zip']);
  assert.equal(num.out[0], 'total 11280', 'the total line has no field 5 and sorts first both ways');
  assert.equal(logic.sortKey5('total 11280'), '');
  assert.equal(logic.sortKey5(ls.out[2]), '980 Nov  4 08:30 bilješke.txt', 'the key starts at field 5, blanks skipped');
});

test('rule 5: the text sort is flagged with the pair that shows it; -n and Sort-Object are not', () => {
  const l = lanes({ task: 'by-size' });
  assert.deepEqual(l.bash.stages[1].issue, { code: 'text-order', a: 2, b: 1 }, 'predavanje.mp4 (1048577) before bilješke.txt (980)');
  assert.equal(l.bash.correct, false);
  assert.equal(lanes({ task: 'by-size', numeric: true }).bash.stages[1].issue, null);
  assert.equal(lanes({ task: 'by-size', numeric: true }).bash.correct, true);
  const so = l.ps.stages[1];
  assert.equal(so.cmd, 'Sort-Object Length');
  assert.deepEqual(so.out.map((o) => o.props.Length), [980, 4096, 4096, 1048577, 3145728, 7340032]);
  assert.equal(so.issue, null);
  assert.equal(l.ps.correct, true);
});

// ── rule 6: formatting comes last ──

test('rule 6: Format-Table emits formatting records, without the objects\' properties', () => {
  const ft = logic.formatTable(logic.getChildItem(FILES)).out;
  assert.deepEqual(ft.map((o) => o.type), ['FormatStartData', 'GroupStartData'].concat(Array(6).fill('FormatEntryData'), ['GroupEndData', 'FormatEndData']));
  assert.ok(ft.every((o) => !('Length' in o.props) && !('Name' in o.props)));
});

test('rule 6: Sort-Object after Format-Table finds no Length: the order stays, the table is not sorted', () => {
  const l = lanes({ task: 'by-size', formatEarly: true, numeric: true });
  assert.deepEqual(l.ps.stages.map((s) => s.cmd), ['Get-ChildItem', 'Format-Table', 'Sort-Object Length']);
  const so = l.ps.stages[2];
  assert.deepEqual(so.issue, { code: 'no-property', prop: 'Length', count: 10 });
  assert.deepEqual(so.out.map((o) => o.type), l.ps.stages[1].out.map((o) => o.type), 'order unchanged');
  const rows = l.ps.terminal.filter((x) => x.startsWith('-a---'));
  assert.deepEqual(rows.map((r) => r.split(' ').pop()), FILES.map((f) => f.name), 'printed in name order, not by size');
  assert.equal(l.ps.correct, false);
  assert.equal(l.bash.correct, true);
  // formatting last: the same objects sorted first print sorted
  const ok = lanes({ task: 'by-size' });
  assert.deepEqual(ok.ps.stages.map((s) => s.cmd), ['Get-ChildItem', 'Sort-Object Length', 'Format-Table']);
  assert.equal(ok.ps.correct, true);
});

test('rule 6: Select-Object after Format-Table finds no Name either', () => {
  const ft = logic.formatTable(logic.getChildItem(FILES));
  assert.ok(logic.selectProps(ft, ['Name']).out.every((o) => o.props.Name === null));
});

// ── rule 7: sort and Sort-Object read everything first ──

test('rule 7: sort, Sort-Object and Group-Object collect all input; the other stages stream', () => {
  for (const task of logic.TASKS) {
    for (const formatEarly of [false, true]) {
      const l = lanes({ task, formatEarly });
      for (const lane of ['bash', 'ps']) {
        for (const st of l[lane].stages) {
          assert.equal(st.collects, /^(sort|Sort-Object|Group-Object)\b/.test(st.cmd), `${st.cmd}`);
        }
      }
    }
  }
});

// ── the count-by-extension task ──

test('by extension: uniq -c counts adjacent runs only, so sort comes before it; Group-Object counts by property', () => {
  assert.deepEqual(logic.uniqCount({ out: ['csv', 'zip', 'csv'], src: [0, 1, 2] }).out, ['      1 csv', '      1 zip', '      1 csv']);
  const l = lanes({ task: 'by-extension', nameWithSpace: true });
  assert.deepEqual(l.bash.terminal, ['      2 csv', '      1 mp4', '      1 pdf', '      1 pptx', '      1 txt', '      1 zip']);
  const g = lastStage(l, 'ps').out;
  assert.deepEqual(g.map((o) => [o.props.Name, o.props.Count]), [['.zip', 1], ['.txt', 1], ['.pdf', 1], ['.mp4', 1], ['.pptx', 1], ['.csv', 2]]);
  assert.equal(l.bash.correct, true);
  assert.equal(l.ps.correct, true);
});

// ── stepping ──

test('steps: one per stage of the longer lane, plus the terminal', () => {
  assert.equal(logic.steps(P({})), 4);
  assert.equal(logic.steps(P({ nameWithSpace: true })), 4);
  assert.equal(logic.steps(P({ task: 'by-size' })), 4);
  assert.equal(logic.steps(P({ task: 'by-size', formatEarly: true })), 4);
  assert.equal(logic.steps(P({ task: 'by-extension' })), 5);
});

test('step n runs stage n of both lanes; outputs appear only once run; the terminal is the last step', () => {
  const s0 = at({}, 0);
  assert.ok(s0.bash.stages.every((st) => !st.ran && st.out === null));
  assert.equal(s0.bash.terminal, null);
  const s2 = at({}, 2);
  assert.deepEqual(s2.bash.stages.map((st) => st.ran), [true, true]);
  assert.deepEqual(s2.ps.stages.map((st) => st.ran), [true, true, false]);
  assert.deepEqual(s2.ps.stages.map((st) => st.now), [false, true, false]);
  assert.equal(s2.terminal, false);
  const s3 = at({}, 3);
  assert.deepEqual(s3.bash.stages.map((st) => st.now), [false, false], 'bash has no third stage');
  const s4 = at({}, 4);
  assert.equal(s4.terminal, true);
  assert.deepEqual(s4.bash.terminal, ['arhiva.zip', 'predavanje.mp4', 'prezentacija.pptx']);
  assert.deepEqual(s4.ps.terminal, ['Name', '----', 'arhiva.zip', 'predavanje.mp4', 'prezentacija.pptx']);
  assert.equal(s4.bash.correct, true);
  assert.equal(s4.ps.correct, true);
  assert.equal(s4.data.length, 6);
});

test('broken: the first wrong stage, shown from the step it runs', () => {
  assert.equal(at({ nameWithSpace: true }, 1).broken, null);
  assert.equal(at({ nameWithSpace: true }, 1).bash.stages[1].issue, null, 'a stage that has not run has no issue yet');
  assert.equal(at({ nameWithSpace: true }, 2).bash.stages[1].issue.code, 'field-shift');
  assert.deepEqual(at({ nameWithSpace: true }, 2).broken, { lane: 'bash', stage: 1, why: 'field-shift' });
  assert.deepEqual(at({ task: 'by-size' }, 2).broken, { lane: 'bash', stage: 1, why: 'text-order' });
  assert.equal(at({ task: 'by-size', numeric: true }, 4).broken, null);
  assert.equal(at({ task: 'by-size', formatEarly: true, numeric: true }, 2).broken, null);
  assert.deepEqual(at({ task: 'by-size', formatEarly: true, numeric: true }, 3).broken, { lane: 'ps', stage: 2, why: 'no-property' });
  assert.equal(at({}, 4).broken, null);
});

test('the listing: 6 files, 3 over 1 MiB; the space param adds a 2.4 MiB file; ls -l total in 1 KiB units of 4 KiB blocks', () => {
  assert.equal(FILES.length, 6);
  assert.equal(FILES.filter((f) => f.size > logic.MIB).length, 3);
  assert.equal(logic.listing(P({ nameWithSpace: true })).length, 7);
  assert.equal(logic.lsLong(FILES).out[0], 'total 11280');
  assert.equal(logic.lsLong(FILES).out[2], '-rw-r--r-- 1 ana ana     980 Nov  4 08:30 bilješke.txt', 'size right-aligned to the widest');
});

// ── generic checks every sim keeps ──

const ALL = [{}, { nameWithSpace: true }, { task: 'by-size' }, { task: 'by-size', formatEarly: true }, { task: 'by-size', numeric: true }, { task: 'by-extension', nameWithSpace: true }];

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    for (let n = 0; n <= logic.steps(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over);
    const steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input, and states do not share structure', () => {
  const p = P({ task: 'by-size' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  const s1 = logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  s1.ps.stages[0].out[0].props.Length = -1;
  assert.notEqual(logic.step(s0, 1, p).ps.stages[0].out[0].props.Length, -1);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
