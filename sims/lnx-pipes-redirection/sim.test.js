// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-pipes-redirection's model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
// numbers, then the template's generic block.
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
const steps = (p) => kit.stepsOf(logic, p);
const at = (p, n) => kit.stateAt(logic, p, n);
const end = (p) => at(p, steps(p));
/** Every frame of a line typed as text, with files that exist before it runs. */
const run = (text, opts = {}) => logic.framesOf(logic.parse(text), opts.missing !== false, opts.pre);
const last = (fr) => fr[fr.length - 1];
const texts = (lines) => lines.map((l) => l.text);
const ERR = 'cat: /nema-me: No such file or directory';

// ── tie-breaks ──

test('tie-break (rule 7): the same fd redirected twice, the last wins, but every file named is opened and emptied', () => {
  const fr = run('cat /nema-me > ~/a > ~/b', { pre: { '~/a': ['old'] } });
  const e = last(fr);
  assert.equal(e.procs[0].fds['1'], 'file:~/b');
  assert.deepEqual(e.files['~/a'], { lines: [], created: true }, '~/a was opened by > and emptied');
  assert.equal(e.files['~/b'].created, true);
  assert.deepEqual(texts(e.terminal), [ERR]);
  // ~/a is emptied at its own step, before ~/b is even opened
  const openA = fr.find((f) => f.opened === '~/a');
  assert.deepEqual(openA.files['~/a'].lines, []);
  assert.equal(openA.files['~/b'].created, false);
  // a file that did not exist is created by the first >, although nothing is ever written to it
  const fresh = last(run('cat /nema-me > ~/c > ~/b'));
  assert.deepEqual(fresh.files['~/c'], { lines: [], created: true });
});

test('tie-break (rule 6): the same two redirections in the other order give the other outcome', () => {
  const sve = end(P({ line: 'sve' }));
  const obrnuto = end(P({ line: 'obrnuto' }));
  assert.deepEqual(sve.procs[0].fds, { 0: 'tty', 1: 'file:~/sve.txt', 2: 'file:~/sve.txt' });
  assert.deepEqual(obrnuto.procs[0].fds, { 0: 'tty', 1: 'file:~/sve.txt', 2: 'tty' });
  assert.deepEqual(texts(sve.files['~/sve.txt'].lines), [ERR]);
  assert.deepEqual(sve.terminal, []);
  assert.deepEqual(obrnuto.files['~/sve.txt'].lines, []);
  assert.deepEqual(texts(obrnuto.terminal), [ERR]);
});

test('tie-break (step order): within a process, stdout lines are written before stderr lines', () => {
  const fr = run('cat /nema-me /etc/hostname');
  const writes = fr.filter((f) => f.phase === 'run').map((f) => f.wrote.fd);
  assert.deepEqual(writes, [1, 2]);
  assert.deepEqual(texts(last(fr).terminal), [logic.HOSTNAME, ERR]);
});

test('tie-break (step order): processes write left to right, so the reader counts everything written before it', () => {
  const fr = run('cat /etc/hostname /nema-me 2>&1 | wc -l');
  const writes = fr.filter((f) => f.phase === 'run').map((f) => [f.wrote.proc, f.wrote.fd]);
  assert.deepEqual(writes, [[0, 1], [0, 2], [1, 1]]);
});

// ── rules ──

test('rule 1: every process starts with fd 0, 1, 2 open on the terminal; before that none is open', () => {
  for (const id of logic.LINE_IDS) {
    const p = P({ line: id });
    for (const proc of at(p, 0).procs) assert.deepEqual(proc.fds, { 0: null, 1: null, 2: null }, id);
    const s1 = at(p, 1);
    assert.equal(s1.phase, 'start');
    for (const proc of s1.procs) assert.deepEqual(proc.fds, { 0: 'tty', 1: 'tty', 2: 'tty' }, id);
    assert.equal(s1.changed.length, 3 * s1.procs.length);
  }
});

test('rule 2: a | b moves only a\'s fd 1 (write end) and b\'s fd 0 (read end); fd 2 of both stays', () => {
  const s = at(P({ line: 'cijev' }), 2);
  assert.equal(s.phase, 'pipe');
  assert.equal(s.cursor, 'p0');
  assert.deepEqual(s.procs[0].fds, { 0: 'tty', 1: 'pipe:0:w', 2: 'tty' });
  assert.deepEqual(s.procs[1].fds, { 0: 'pipe:0:r', 1: 'tty', 2: 'tty' });
  assert.deepEqual(s.changed, ['0:1', '1:0']);
  assert.deepEqual(s.pipes, [{ id: 0, from: 0, to: 1, buffer: [], read: 0 }]);
});

test('rule 2: the pipe carries only fd 1, so the error bypasses it and wc counts 1', () => {
  const e = end(P({ line: 'cijev' }));
  assert.deepEqual(texts(e.terminal), [ERR, '1']);
  assert.equal(e.procs[1].read, 1);
  assert.deepEqual(e.pipes[0].buffer, [], 'the reader drained the pipe');
  const inPipe = at(P({ line: 'cijev' }), 3);
  assert.deepEqual(inPipe.pipes[0].buffer, [{ text: logic.HOSTNAME, fd: 1, proc: 0 }]);
});

test('rule 3: the pipe is connected before the command\'s redirections, so a 2>&1 | b sends stderr into the pipe', () => {
  const p = P({ line: 'cijev-2' });
  const phases = Array.from({ length: steps(p) + 1 }, (_, n) => at(p, n).phase);
  assert.deepEqual(phases.slice(0, 4), ['typed', 'start', 'pipe', 'redir']);
  const dup = at(p, 3);
  assert.equal(dup.cursor, 'r0-0');
  assert.equal(dup.procs[0].fds['2'], 'pipe:0:w');
  assert.deepEqual(texts(end(p).terminal), ['2']);
});

test('rule 3: |& is 2>&1 | with the 2>&1 after the command\'s own redirections', () => {
  assert.deepEqual(last(run('cat /etc/hostname /nema-me |& wc -l')).terminal, last(run('cat /etc/hostname /nema-me 2>&1 | wc -l')).terminal);
  const fr = run('cat /etc/hostname /nema-me > ~/x |& wc -l');
  const e = last(fr);
  assert.equal(e.procs[0].fds['1'], 'file:~/x');
  assert.equal(e.procs[0].fds['2'], 'file:~/x', 'the implicit 2>&1 copies fd 1 after > ~/x moved it');
  assert.deepEqual(texts(e.terminal), ['0']);
  const implicit = fr.find((f) => f.phase === 'redir' && f.cursor === 'p0');
  assert.ok(implicit, 'the implicit 2>&1 is its own step, lit on the |& token');
});

test('rule 4: > creates the file and empties it at open, before the command runs', () => {
  const fr = run('echo new > ~/f', { pre: { '~/f': ['old 1', 'old 2'] } });
  const open = fr.find((f) => f.phase === 'redir');
  assert.deepEqual(open.files['~/f'].lines, [], 'emptied at the redirection step');
  assert.equal(open.opened, '~/f');
  assert.deepEqual(texts(last(fr).files['~/f'].lines), ['new']);
  const absent = run('cat /nema-me > ~/g');
  assert.equal(absent[0].files['~/g'].created, false);
  assert.equal(last(absent).files['~/g'].created, true);
});

test('rule 4: >> appends, keeping what the file held', () => {
  const e = last(run('echo new >> ~/f', { pre: { '~/f': ['old'] } }));
  assert.deepEqual(texts(e.files['~/f'].lines), ['old', 'new']);
  const created = last(run('echo new >> ~/g'));
  assert.deepEqual(texts(created.files['~/g'].lines), ['new']);
});

test('rule 4: n> f moves fd n; < f opens f on fd 0', () => {
  assert.equal(end(P({ line: 'greska' })).procs[0].fds['2'], 'file:~/greska.txt');
  const e = last(run('wc -l < ~/x', { pre: { '~/x': ['a', 'b', 'c'] } }));
  assert.equal(e.procs[0].fds['0'], 'file:~/x');
  assert.deepEqual(texts(e.terminal), ['3']);
  const missing = last(run('wc -l < ~/none'));
  assert.deepEqual(missing.error, { code: 'no-file', proc: 0, file: '~/none' });
  assert.equal(missing.procs[0].ran, false);
});

test('rule 5: n>&m copies fd m as it is at that moment; a later move of m does not move n', () => {
  const p = P({ line: 'obrnuto' });
  const dup = at(p, 2);
  assert.equal(dup.cursor, 'r0-0');
  assert.deepEqual(dup.changed, ['0:2']);
  assert.equal(dup.procs[0].fds['2'], 'tty', '2 copied 1 while 1 was the terminal');
  const moved = at(p, 3);
  assert.deepEqual(moved.changed, ['0:1']);
  assert.equal(moved.procs[0].fds['1'], 'file:~/sve.txt');
  assert.equal(moved.procs[0].fds['2'], 'tty');
});

test('rule 5: duplicating a descriptor that is not open is a redirection error, and the command does not run', () => {
  const fr = run('cat /nema-me 2>&3 > ~/f');
  const e = last(fr);
  assert.deepEqual(e.error, { code: 'bad-fd', proc: 0, fd: 3 });
  assert.equal(e.procs[0].failed, true);
  assert.equal(e.procs[0].ran, false);
  assert.equal(fr.filter((f) => f.phase === 'run').length, 0, 'no output at all');
  assert.equal(e.files['~/f'].created, false, 'the redirections after the error are not applied');
  assert.deepEqual(e.terminal, []);
});

test('rule 8: the last command\'s fd 1 is never in a pipe; it ends where it would without the pipeline', () => {
  for (const id of logic.LINE_IDS) {
    const e = end(P({ line: id }));
    const lastProc = e.procs[e.procs.length - 1];
    assert.ok(!/^pipe:/.test(lastProc.fds['1']), id);
  }
  assert.deepEqual(end(P({ line: 'cijev' })).procs[1].fds, { 0: 'pipe:0:r', 1: 'tty', 2: 'tty' });
});

test('step order: start, pipes, redirections left to right, output lines, final', () => {
  const fr = run('cat /etc/hostname /nema-me 2>&1 > ~/x | wc -l');
  assert.deepEqual(fr.map((f) => f.phase), ['typed', 'start', 'pipe', 'redir', 'redir', 'run', 'run', 'run', 'done']);
  assert.deepEqual(fr.filter((f) => f.phase === 'redir').map((f) => f.cursor), ['r0-0', 'r0-1']);
});

test('a written line goes wherever its fd points at that moment, and the step says where', () => {
  const s = at(P({ line: 'samo1' }), 3);
  assert.equal(s.phase, 'run');
  assert.deepEqual(s.wrote, { proc: 0, fd: 2, text: ERR, target: 'tty', lost: false });
  assert.equal(s.cursor, 'c0');
});

test('missing off: /nema-me exists, so cat writes its one line on stdout instead', () => {
  const e = end(P({ line: 'samo1', missing: false }));
  assert.deepEqual(texts(e.files['~/samo1.txt'].lines), [logic.NEMA_ME_LINE]);
  assert.deepEqual(e.terminal, []);
  assert.deepEqual(texts(end(P({ line: 'greska', missing: false })).terminal), [logic.NEMA_ME_LINE]);
  assert.deepEqual(texts(end(P({ line: 'cijev', missing: false })).terminal), ['2']);
});

test('defaults and numbers: >&m without a number is fd 1; n>&m and n< f move fd n, not a fixed one', () => {
  const a = last(run('cat /etc/hostname >&2 2> ~/e'));
  assert.deepEqual(a.procs[0].fds, { 0: 'tty', 1: 'tty', 2: 'file:~/e' });
  assert.deepEqual(texts(a.terminal), [logic.HOSTNAME]);
  assert.deepEqual(a.files['~/e'].lines, []);
  const d = last(run('cat /nema-me /etc/hostname 2> ~/e >&2'));
  assert.deepEqual(texts(d.files['~/e'].lines), [logic.HOSTNAME, ERR], '>&2 moved fd 1 (a copy of 2, now the file)');
  assert.deepEqual(d.terminal, []);
  const b = last(run('cat /etc/hostname 1>&2 | wc -l'));
  assert.deepEqual(texts(b.terminal), [logic.HOSTNAME, '0'], '1>&2 after the pipe: stdout leaves the pipe');
  const c = last(run('cat 3< /etc/hostname'));
  assert.equal(c.procs[0].fds['3'], 'file:/etc/hostname');
  assert.equal(c.procs[0].fds['0'], 'tty');
});

test('< f: reads the file (a file of the machine too), marks the wire and the file, and a missing f stops the rest', () => {
  const fr = run('wc -l < /etc/hostname');
  assert.deepEqual(texts(last(fr).terminal), ['1']);
  assert.equal(last(fr).files['/etc/hostname'].created, true);
  const open = fr.find((f) => f.phase === 'redir');
  assert.deepEqual(open.changed, ['0:0']);
  assert.equal(open.opened, '/etc/hostname');
  assert.deepEqual(texts(last(run('cat < /etc/hostname | wc -l')).terminal), ['1'], 'cat without files copies fd 0');
  const missing = last(run('wc -l < ~/none > ~/o'));
  assert.equal(missing.error.code, 'no-file');
  assert.equal(missing.files['~/o'].created, false, 'the redirection after the error is not applied');
  const same = last(run('cat < ~/f > ~/f'));
  assert.equal(same.error.code, 'no-file', 'a file only named later on the line does not exist yet');
  assert.equal(same.files['~/f'].created, false);
});

test('the step records what the page shows: the target written, the file opened, no wire moved by an error', () => {
  assert.equal(at(P({ line: 'cijev' }), 3).wrote.target, 'pipe:0:w');
  assert.equal(at(P({ line: 'greska' }), 3).wrote.target, 'file:~/greska.txt');
  assert.equal(run('echo new >> ~/f').find((f) => f.phase === 'redir').opened, '~/f');
  assert.deepEqual(run('cat /nema-me 2>&3').find((f) => f.error).changed, []);
  assert.equal(end(P({ line: 'cijev' })).pipes[0].read, 1);
  assert.equal(end(P({ line: 'cijev-2' })).pipes[0].read, 2);
});

test('pipes are connected left to right; a write to a pipe\'s read end is lost', () => {
  const fr = run('cat /etc/hostname | cat | wc -l');
  assert.deepEqual(fr.filter((f) => f.phase === 'pipe').map((f) => f.cursor), ['p0', 'p1']);
  assert.deepEqual(last(fr).pipes.map((x) => [x.from, x.to]), [[0, 1], [1, 2]]);
  assert.deepEqual(texts(last(fr).terminal), ['1']);
  const lost = last(run('cat /etc/hostname | wc -l 1>&0'));
  assert.equal(lost.procs[1].fds['1'], 'pipe:0:r');
  assert.deepEqual(lost.wrote, null);
  assert.ok(run('cat /etc/hostname | wc -l 1>&0').some((f) => f.wrote && f.wrote.lost));
  assert.deepEqual(lost.terminal, []);
});

test('parse: a trailing | adds no pipe; a word after a redirection is its own token; bad redirections throw', () => {
  assert.deepEqual(last(run('cat /etc/hostname |')).pipes, []);
  assert.deepEqual(logic.parse('cat > ~/f /etc/hostname').tokens.map((t) => [t.kind, t.text]),
    [['cmd', 'cat'], ['redir', '> ~/f'], ['cmd', '/etc/hostname']]);
  assert.deepEqual(logic.parse('cat > ~/f /etc/hostname').cmds[0].words, ['cat', '/etc/hostname']);
  assert.throws(() => logic.parse('cat >'));
  assert.throws(() => logic.parse('cat 2>&-'));
});

test('a redirection to a file of the machine keeps what it holds with >>', () => {
  const e = last(run('echo x >> /nema-me', { missing: false }));
  assert.deepEqual(texts(e.files['/nema-me'].lines), [logic.NEMA_ME_LINE, 'x']);
});

// ── the presets' numbers (task file, Presets and Steps) ──

test('steps per preset: samo1 4, greska 4, sve 5, obrnuto 5, cijev 6, cijev-2 7, the same with missing off', () => {
  const want = { samo1: 4, greska: 4, sve: 5, obrnuto: 5, cijev: 6, 'cijev-2': 7 };
  for (const missing of [true, false]) {
    for (const id of logic.LINE_IDS) assert.equal(steps(P({ line: id, missing })), want[id], `${id} missing=${missing}`);
  }
  for (const n of Object.values(want)) assert.ok(n <= 20);
});

test('outcomes per preset: what ends on the screen and in each file', () => {
  const out = (id) => {
    const e = end(P({ line: id }));
    const files = {};
    for (const [k, v] of Object.entries(e.files)) files[k] = texts(v.lines);
    return { tty: texts(e.terminal), files };
  };
  assert.deepEqual(out('samo1'), { tty: [ERR], files: { '~/samo1.txt': [] } });
  assert.deepEqual(out('greska'), { tty: [], files: { '~/greska.txt': [ERR] } });
  assert.deepEqual(out('sve'), { tty: [], files: { '~/sve.txt': [ERR] } });
  assert.deepEqual(out('obrnuto'), { tty: [ERR], files: { '~/sve.txt': [] } });
  assert.deepEqual(out('cijev'), { tty: [ERR, '1'], files: {} });
  assert.deepEqual(out('cijev-2'), { tty: ['2'], files: {} });
});

test('the command line: one token per command, redirection and pipe, as typed', () => {
  assert.deepEqual(logic.tokensOf(P({ line: 'obrnuto' })).map((t) => [t.id, t.kind, t.text]),
    [['c0', 'cmd', 'cat /nema-me'], ['r0-0', 'redir', '2>&1'], ['r0-1', 'redir', '> ~/sve.txt']]);
  assert.deepEqual(logic.tokensOf(P({ line: 'cijev-2' })).map((t) => t.text), ['cat /etc/hostname /nema-me', '2>&1', '|', 'wc -l']);
  const r = logic.parse('cat x 2>> ~/e 3<~/i 1>&2').cmds[0].redirs;
  assert.deepEqual(r.map((x) => [x.fd, x.op, x.file ?? x.to]), [[2, '>>', '~/e'], [3, '<', '~/i'], [1, '>&', 2]]);
});

test('sim.json steps is the default line\'s count, and its preset entries are the page\'s presets', () => {
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, steps(P({})));
  for (const e of sim.entries) assert.ok(logic.LINE_IDS.includes(e.preset), e.preset);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const id of logic.LINE_IDS) {
    const p = P({ line: id });
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const id of logic.LINE_IDS) {
    const p = P({ line: id, missing: id === 'cijev' ? false : true });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input, and states handed out are copies', () => {
  const p = P({ line: 'cijev-2' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const s3 = at(p, 3);
  s3.procs[0].fds['1'] = 'tty';
  assert.equal(at(p, 3).procs[0].fds['1'], 'pipe:0:w');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  // the presets are one per line, ids equal to the line ids, so a link ?preset=<line> works
  assert.match(html, /presets: L\.LINE_IDS\.map\(function \(id\) \{ return \{ id: id,/);
  for (const id of logic.LINE_IDS) assert.ok(logic.LINES[id], id);
});
