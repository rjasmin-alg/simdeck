// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the permission-bits model (sim.js). Run: node --test sims/lnx-permissions-rwx/
// The model's rules first (tie-breaks first of all), then the generic block every sim keeps. Numbers: SPEC.md.
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
const at = (over) => kit.stateAt(logic, P(over), 0);
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);
const oct = (s) => parseInt(s, 8);
const chmod = (start, cmd) => logic.applyCmd(oct(start), cmd).mode;

// The real run (SPEC.md, RUN): GNU bash 5.2.21, coreutils 9.4. `touch x; chmod <start> x; chmod <cmd> x; stat -c %a x`.
const RUN = {
  '000': { '640': '640', 'u+x,g-r': '100', 'g-w': '000', '755': '755', 'o=': '000' },
  '600': { '640': '640', 'u+x,g-r': '700', 'g-w': '600', '755': '755', 'o=': '600' },
  '640': { '640': '640', 'u+x,g-r': '700', 'g-w': '640', '755': '755', 'o=': '640' },
  '644': { '640': '640', 'u+x,g-r': '704', 'g-w': '644', '755': '755', 'o=': '640' },
  '700': { '640': '640', 'u+x,g-r': '700', 'g-w': '700', '755': '755', 'o=': '700' },
  '755': { '640': '640', 'u+x,g-r': '715', 'g-w': '755', '755': '755', 'o=': '750' },
  '777': { '640': '640', 'u+x,g-r': '737', 'g-w': '757', '755': '755', 'o=': '770' }
};
// `umask <m>; touch f; mkdir d; stat -c %a f d` in the same run.
const RUN_UMASK = {
  '000': ['666', '777'], '002': ['664', '775'], '022': ['644', '755'], '027': ['640', '750'], '077': ['600', '700'],
  '033': ['644', '744']
};

// ── tie-breaks and edge cases ──

test('= with an empty list clears the named class and sets nothing', () => {
  assert.equal(chmod('777', 'o='), oct('770'));
  assert.equal(chmod('777', 'go='), oct('700'));
  assert.equal(chmod('000', 'o='), 0);
});

test('+ of a set bit and - of a clear bit change nothing', () => {
  const s = at({ before: '644', cmd: 'g-w' });
  assert.equal(s.after, oct('644'));
  assert.deepEqual(s.changedBits, []);
  assert.equal(chmod('755', 'u+x'), oct('755'));
});

test('clauses apply left to right: a later clause wins on the same bit', () => {
  assert.equal(chmod('600', 'u+x,u-x'), oct('600'));
  assert.equal(chmod('600', 'u-x,u+x'), oct('700'));
  assert.equal(chmod('000', 'u+x-w'), oct('100'));
  assert.equal(chmod('600', 'u=,u+r'), oct('400'));
});

test('toggled is masked to nine bits, and before = start XOR toggled', () => {
  const s = at({ before: '644', toggled: 0o1001 });
  assert.equal(s.toggled, 1);
  assert.equal(s.before, oct('645'));
  assert.equal(at({ before: '777', toggled: oct('070') }).before, oct('707'));
});

test('the difference is null when the umask is larger than the base as a number', () => {
  const c = logic.create('file', oct('777'));
  assert.equal(c.created, 0);
  assert.equal(c.difference, null);
  assert.equal(c.differenceAgrees, false);
});

test('out-of-scope operands are rejected, not guessed', () => {
  assert.throws(() => logic.applyCmd(0, '4755'));     // special bits
  assert.throws(() => logic.applyCmd(0, '+x'));       // no who: POSIX filters through the umask
  assert.throws(() => logic.applyCmd(0, 'u+X'));
  assert.throws(() => logic.applyCmd(0, 'g=u'));
  assert.throws(() => logic.applyCmd(0, '8'));
  assert.throws(() => logic.parseOctal('0o644'));
});

// ── rule 1: nine bits, three groups, the type in front ──

test('rule 1: ls string is the type, then r w x per group owner, group, other; dash for clear', () => {
  assert.equal(logic.lsString('file', oct('644')), '-rw-r--r--');
  assert.equal(logic.lsString('file', oct('640')), '-rw-r-----');
  assert.equal(logic.lsString('dir', oct('755')), 'drwxr-xr-x');
  assert.equal(logic.lsString('file', 0), '----------');
  assert.equal(logic.lsString('file', oct('777')), '-rwxrwxrwx');
  for (let i = 0; i < 9; i++) {
    const s = logic.lsString('file', logic.bit(i));
    assert.equal(s.replace(/-/g, '').length, 1, `bit ${i}`);
    assert.equal(s[1 + i], 'rwx'[i % 3], `bit ${i} at its place`);
  }
  assert.deepEqual(logic.bitsOf(oct('640')), [1, 1, 0, 1, 0, 0, 0, 0, 0]);
  assert.equal(logic.bit(0), 0o400);
  assert.equal(logic.bit(8), 0o001);
});

test('rule 1: the type character is not a permission: kind changes only it', () => {
  const f = at({ kind: 'file', before: '755' }), d = at({ kind: 'dir', before: '755' });
  assert.equal(f.views.after.ls.slice(1), d.views.after.ls.slice(1));
  assert.equal(f.views.after.ls[0], '-');
  assert.equal(d.views.after.ls[0], 'd');
  assert.equal(f.after, d.after);
});

// ── rule 2: octal digit = 4 + 2 + 1 ──

test('rule 2: each octal digit is the sum r 4 + w 2 + x 1 of its group, owner first', () => {
  assert.equal(logic.octal(oct('640')), '640');
  assert.equal(logic.octal(0), '000');
  assert.equal(logic.octal(5), '005');
  assert.deepEqual(logic.digits(oct('640')), [{ r: 4, w: 2, x: 0, sum: 6 }, { r: 4, w: 0, x: 0, sum: 4 }, { r: 0, w: 0, x: 0, sum: 0 }]);
  assert.equal(oct('400') + oct('200') + oct('100'), oct('700')); // S_IRUSR + S_IWUSR + S_IXUSR = S_IRWXU
  for (let m = 0; m < 512; m++) {
    const d = logic.digits(m);
    assert.equal(d.map((x) => x.sum).join(''), logic.octal(m), `${m}`);
    d.forEach((x) => assert.equal(x.r + x.w + x.x, x.sum));
  }
});

test('rule 2: symbolic notation is the same value with = per class', () => {
  assert.equal(logic.symbolic(oct('640')), 'u=rw,g=r,o=');
  assert.equal(logic.symbolic(0), 'u=,g=,o=');
  assert.equal(logic.symbolic(oct('777')), 'u=rwx,g=rwx,o=rwx');
  for (let m = 0; m < 512; m++) for (const start of [0, oct('777'), oct('525')]) {
    assert.equal(logic.applyCmd(start, logic.symbolic(m)).mode, m, `${m} from ${start}`);
  }
});

// ── rule 3: octal chmod is absolute ──

test('rule 3: octal chmod writes all nine bits; the start plays no part', () => {
  for (let m = 0; m < 512; m += 7) {
    const r = logic.applyCmd(m, '640');
    assert.equal(r.mode, oct('640'));
    assert.equal(r.form, 'octal');
    assert.equal(r.written, oct('777'));
  }
  const s = preset('octal-erases');
  assert.equal(s.views.before.ls, '-rwx------');
  assert.equal(s.views.after.ls, '-rw-r-----');
  assert.deepEqual(s.lost, [2], 'the owner\'s x is gone');
  assert.deepEqual(s.gained, [3]);
  assert.deepEqual(s.written, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
});

test('rule 3: one to four digits; a leading zero is fine', () => {
  assert.equal(chmod('777', '0640'), oct('640'));
  assert.equal(chmod('777', '7'), oct('007'));
  assert.equal(chmod('000', '0'), 0);
});

// ── rule 4: symbolic chmod is relative ──

test('rule 4: + sets and - clears only the named bits; bits outside written never change', () => {
  const s = preset('symbolic');
  assert.equal(s.views.after.ls, '-rwx------');
  assert.equal(s.views.after.octal, '700');
  assert.deepEqual(s.changedBits, [2, 3]);
  assert.deepEqual(s.written, [2, 3]);
  assert.equal(s.form, 'symbolic');
  for (let m = 0; m < 512; m++) for (const cmd of ['u+x,g-r', 'g-w', 'o=', 'a+r', 'ug-wx']) {
    const r = logic.applyCmd(m, cmd);
    assert.equal((r.mode ^ m) & ~r.written, 0, `${logic.octal(m)} ${cmd}`);
  }
});

test('rule 4: = clears the named classes first, then sets', () => {
  assert.equal(chmod('777', 'g=r'), oct('747'));
  assert.equal(chmod('000', 'u=rw'), oct('600'));
  assert.deepEqual(logic.applyCmd(0, 'o=').written, oct('007'));
  assert.equal(chmod('000', 'a=rx'), oct('555'));
  assert.equal(chmod('123', 'a+r'), oct('567'));
});

test('rule 3 vs 4: octal gives one result from every start, symbolic as many as there were starts', () => {
  const starts = Object.keys(RUN);
  assert.equal(new Set(starts.map((b) => chmod(b, '640'))).size, 1);
  assert.equal(new Set(starts.map((b) => chmod(b, 'g-w'))).size, starts.length);
});

// ── rule 5: base AND NOT umask ──

test('rule 5: base 666 for a file, 777 for a directory; the new mode clears the umask bits', () => {
  assert.equal(logic.BASE.file, oct('666'));
  assert.equal(logic.BASE.dir, oct('777'));
  for (const [u, [f, d]] of Object.entries(RUN_UMASK)) {
    assert.equal(logic.octal(logic.create('file', oct(u)).created), f, `file ${u}`);
    assert.equal(logic.octal(logic.create('dir', oct(u)).created), d, `dir ${u}`);
  }
});

test('rule 5: clearing, not subtraction: 666 & ~077 = 600, not 567; 666 & ~033 = 644, not 633', () => {
  const a = logic.create('file', oct('077'));
  assert.equal(logic.octal(a.created), '600');
  assert.equal(logic.octal(a.difference), '567');
  assert.equal(a.differenceAgrees, false);
  const b = logic.create('file', oct('033'));
  assert.equal(logic.octal(b.created), '644');
  assert.equal(logic.octal(b.difference), '633');
  assert.equal(b.differenceAgrees, false);
  const c = logic.create('file', oct('022'));
  assert.equal(c.differenceAgrees, true, 'with 022 subtraction happens to agree');
  assert.equal(logic.octal(logic.create('file', oct('027')).difference), '637');
});

test('rule 5: cleared lists the base bits the mask removed', () => {
  assert.deepEqual(logic.create('file', oct('077')).cleared, [3, 4, 6, 7]);
  assert.deepEqual(logic.create('file', oct('022')).cleared, [4, 7]);
  assert.deepEqual(logic.create('dir', oct('022')).cleared, [4, 7]);
  assert.deepEqual(logic.create('file', 0).cleared, []);
});

// ── rule 6: x on a directory is search ──

test('rule 6: x means execute on a file and search on a directory', () => {
  assert.equal(at({ kind: 'file' }).xMeaning, 'execute');
  assert.equal(at({ kind: 'dir' }).xMeaning, 'search');
});

// ── rule 7: the umask acts only on files created after it, in that shell ──

test('rule 7: the umask never changes the chmod panel; start and command never change the create panel', () => {
  for (const u of logic.UMASKS) {
    const a = at({ before: '755', cmd: 'u+x,g-r', umask: u });
    assert.equal(a.after, oct('715'), u);
    assert.deepEqual(a.views.after, at({ before: '755', cmd: 'u+x,g-r' }).views.after);
  }
  const base = at({ umask: '027' });
  for (const b of logic.BEFORE) for (const c of logic.CMDS) {
    const s = at({ umask: '027', before: b, cmd: c });
    assert.equal(s.created, base.created, `${b} ${c}`);
    assert.deepEqual(s.cleared, base.cleared);
  }
});

// ── rule 8: umask x bits do nothing to a file ──

test('rule 8: x bits of the umask have no effect on a file (022 and 033 give 644) but do on a directory', () => {
  assert.equal(logic.create('file', oct('022')).created, logic.create('file', oct('033')).created);
  assert.deepEqual(logic.create('file', oct('033')).noEffect, [5, 8]);
  assert.deepEqual(logic.create('file', oct('027')).noEffect, [8]);
  assert.deepEqual(logic.create('dir', oct('027')).noEffect, []);
  assert.equal(logic.octal(logic.create('dir', oct('027')).created), '750');
  assert.equal(logic.octal(logic.create('file', oct('027')).created), '640');
});

// ── the real run, whole table ──

test('every start × command of the page agrees with the real run', () => {
  assert.deepEqual(Object.keys(RUN).sort(), [...logic.BEFORE].sort()); // integer-like keys come first in JS objects
  for (const [b, row] of Object.entries(RUN)) {
    assert.deepEqual(Object.keys(row).sort(), logic.CMDS.slice(1).sort());
    for (const [c, want] of Object.entries(row)) assert.equal(logic.octal(chmod(b, c)), want, `${b} ${c}`);
  }
});

// ── clicks ──

test('a click flips one bit of the strip it is on and drops the command', () => {
  const p = P({ before: '644', cmd: '640' });
  const s = at(p);
  // on the start strip: 644 with other r flipped = 640, which is on the list
  assert.deepEqual(logic.clickPatch(p, s.before, 6), { before: '640', toggled: 0, cmd: 'none' });
  // on the result strip: 640 with owner x flipped = 740, not on the list
  const patch = logic.clickPatch(p, s.after, 2);
  assert.equal(patch.cmd, 'none');
  const t = at(Object.assign({}, p, patch));
  assert.equal(t.views.before.octal, '740');
  assert.equal(t.after, t.before);
  assert.deepEqual(t.changedBits, []);
});

test('two clicks on the same cell give back the start', () => {
  let p = P({ before: '755' });
  for (let k = 0; k < 2; k++) p = Object.assign({}, p, logic.clickPatch(p, at(p).before, 4));
  assert.equal(at(p).before, oct('755'));
  assert.equal(p.toggled, 0);
});

// ── edge cases found by the fresh review ──

test('a clause with several actions applies each of them', () => {
  assert.equal(chmod('600', 'u+x-w'), oct('500'));
});

test('the command acts on the clicked start, not on the listed one', () => {
  assert.equal(at({ before: '644', toggled: 1, cmd: 'o=' }).after, oct('640'));
  assert.equal(at({ before: '644', toggled: 1, cmd: 'g-w' }).after, oct('645'));
});

test('written: = writes its whole class; + of a set bit still writes it', () => {
  assert.equal(logic.applyCmd(oct('777'), 'g=r').written, oct('070'));
  assert.equal(logic.applyCmd(oct('755'), 'u+x').written, oct('100'));
  assert.equal(logic.applyCmd(oct('755'), 'u+x').mode, oct('755'));
});

test('a directory clears its own base: 027 clears g w and o r w x of 777', () => {
  assert.deepEqual(logic.create('dir', oct('027')).cleared, [4, 6, 7, 8]);
  const s = at({ kind: 'dir' });
  assert.equal(s.views.base.ls[0], 'd');
  assert.equal(s.views.created.ls[0], 'd');
});

test('lost and gained split changedBits, every start × command', () => {
  for (const b of logic.BEFORE) for (const c of logic.CMDS) for (const tg of [0, 1, 0o421]) {
    const s = at({ before: b, cmd: c, toggled: tg });
    assert.deepEqual([...s.lost, ...s.gained].sort((x, y) => x - y), s.changedBits, `${b} ${c} ${tg}`);
    s.lost.forEach((i) => assert.ok(s.before & logic.bit(i) && !(s.after & logic.bit(i))));
    s.gained.forEach((i) => assert.ok(s.after & logic.bit(i) && !(s.before & logic.bit(i))));
  }
});

test('a difference of exactly 0 is reported, not null', () => {
  assert.equal(logic.create('file', oct('666')).difference, 0);
  assert.equal(logic.create('file', oct('666')).differenceAgrees, true);
});

test('a click that lands on the first listed mode (000) still writes before', () => {
  assert.deepEqual(logic.clickPatch(P({ before: '644' }), oct('400'), 0), { before: '000', toggled: 0, cmd: 'none' });
});

test('more than four octal digits are rejected', () => {
  assert.throws(() => logic.applyCmd(0, '00640'));
});

// ── what the caption says (SPEC.md, Captions) ──

test('lostUnasked: a lost bit in a group whose digit is not 0; a 0 digit asked for it', () => {
  assert.deepEqual(preset('octal-erases').lostUnasked, [2]);
  assert.deepEqual(preset('chmod-640').lostUnasked, [], 'the 0 for others asked for it');
  assert.deepEqual(preset('chmod-640').lost, [6]);
  assert.deepEqual(at({ before: '755', cmd: '640' }).lostUnasked, [2, 5]);
  assert.deepEqual(preset('symbolic').lostUnasked, [], 'octal only');
  assert.deepEqual(at({ before: '755', cmd: 'u+x,g-r' }).lostUnasked, [], 'octal only, even with digits left in the group');
});

test('captionKey, chmod panel: one branch per case', () => {
  const k = (over) => logic.captionKey(at(over), 'chmod');
  assert.deepEqual(k({}), { key: 'cNone' });
  assert.deepEqual(k({ before: '700', cmd: '640' }), { key: 'cOctalLost', bit: 2 });
  assert.deepEqual(k({ before: '755', cmd: '640' }), { key: 'cOctalLostN', n: 2 });
  assert.deepEqual(k({ before: '644', cmd: '640' }), { key: 'cOctalZero', n: 1 });
  assert.deepEqual(k({ before: '600', cmd: '640' }), { key: 'cOctalKeep' });
  assert.deepEqual(k({ before: '640', cmd: 'u+x,g-r' }), { key: 'cSymChanged', n: 2 });
  assert.deepEqual(k({ before: '644', cmd: 'g-w' }), { key: 'cSymSame' });
});

test('captionKey, create panel: clearing vs subtraction, nothing cleared, the no-effect sentence', () => {
  const k = (over) => logic.captionKey(at(over), 'create');
  assert.deepEqual(k({ umask: '077' }), { key: 'cMask', noEffect: true });
  assert.deepEqual(k({ umask: '027' }), { key: 'cMask', noEffect: true });
  assert.deepEqual(k({ umask: '022' }), { key: 'cAgree', n: 2, noEffect: false });
  assert.deepEqual(k({ umask: '002' }), { key: 'cAgree', n: 1, noEffect: false });
  assert.deepEqual(k({ umask: '000' }), { key: 'cZero', noEffect: false });
  assert.deepEqual(k({ umask: '001' }), { key: 'cZero', noEffect: true }, 'only a no-effect bit: nothing cleared');
  assert.deepEqual(k({ umask: '077', kind: 'dir' }), { key: 'cAgree', n: 6, noEffect: false });
  assert.equal(logic.captionKey(at({ umask: '077', cmd: '640' }), 'create').key, 'cMask', 'focus, not the command, picks the panel');
});

test('nextFocus: a new preset speaks for its panel, else the panel whose params changed', () => {
  const d = P({});
  for (const pr of logic.presets) assert.ok(['chmod', 'create'].includes(pr.focus), pr.id);
  assert.equal(logic.nextFocus(null, null, d, 'octal-erases', null), 'chmod');
  assert.equal(logic.nextFocus('chmod', d, d, 'umask-077', 'octal-erases'), 'create');
  assert.equal(logic.nextFocus('chmod', d, P({ umask: '077' }), null, null), 'create');
  assert.equal(logic.nextFocus('chmod', d, P({ kind: 'dir' }), null, null), 'create');
  assert.equal(logic.nextFocus('create', d, P({ cmd: '640' }), null, null), 'chmod');
  assert.equal(logic.nextFocus('create', d, P({ toggled: 4 }), null, null), 'chmod');
  assert.equal(logic.nextFocus('create', d, P({ before: '700' }), null, null), 'chmod');
  assert.equal(logic.nextFocus('chmod', d, d, 'symbolic', 'symbolic'), 'chmod', 'the same preset again keeps the focus');
  assert.equal(logic.nextFocus(null, null, d, null, null), 'create', 'no command: create');
  assert.equal(logic.nextFocus(null, null, P({ cmd: 'g-w' }), null, null), 'chmod', 'a command: chmod');
});

test('clearsToggled: only when the select moved before and clicked bits are set', () => {
  assert.equal(logic.clearsToggled(null, P({ toggled: 4 })), false);
  assert.equal(logic.clearsToggled(P({ toggled: 4 }), P({ before: '700', toggled: 4 })), true);
  assert.equal(logic.clearsToggled(P({ toggled: 4 }), P({ before: '700', toggled: 0 })), false);
  assert.equal(logic.clearsToggled(P({ toggled: 0 }), P({ before: '700', toggled: 4 })), false, 'a click changes both');
  assert.equal(logic.clearsToggled(P({ toggled: 4 }), P({ toggled: 4, umask: '077' })), false);
});

test('every caption key the model returns exists in both tables', () => {
  const keys = new Set();
  for (const b of logic.BEFORE) for (const c of logic.CMDS) for (const u of logic.UMASKS) for (const kind of logic.KINDS) {
    const s = at({ before: b, cmd: c, umask: u, kind });
    keys.add(logic.captionKey(s, 'chmod').key);
    keys.add(logic.captionKey(s, 'create').key);
  }
  for (const k of keys) for (const l of ['hr', 'en']) assert.ok(k in strings[l], `${k} ${l}`);
  assert.equal(keys.size, 10);
});

// ── presets: what each one is for (SPEC.md, Presets) ──

test('presets: order and the numbers each one shows', () => {
  assert.deepEqual(logic.presets.map((x) => x.id), ['touch-default', 'chmod-640', 'symbolic', 'octal-erases', 'umask-077', 'dir-umask']);
  assert.equal(preset('touch-default').views.created.ls, '-rw-r--r--');
  assert.equal(preset('touch-default').views.created.octal, '644');
  const c = preset('chmod-640');
  assert.equal(c.views.after.ls, '-rw-r-----');
  assert.deepEqual(c.changedBits, [6]);
  assert.equal(c.views.after.symbolic, 'u=rw,g=r,o=');
  assert.equal(preset('symbolic').views.after.octal, '700');
  assert.equal(preset('octal-erases').views.after.octal, '640');
  const u = preset('umask-077');
  assert.equal(u.views.created.ls, '-rw-------');
  assert.equal(logic.octal(u.difference), '567');
  const d = preset('dir-umask');
  assert.equal(d.views.created.ls, 'drwxr-xr-x');
  assert.equal(d.xMeaning, 'search');
});

test('defaults are as SPEC.md says', () => {
  assert.deepEqual(logic.defaults, { kind: 'file', before: '644', cmd: 'none', umask: '022', toggled: 0 });
  const s = at({});
  assert.equal(s.form, 'none');
  assert.equal(s.after, s.before);
  assert.deepEqual(s.written, []);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and every option', () => {
  const cases = logic.presets.map((x) => x.params);
  for (const b of logic.BEFORE) for (const c of logic.CMDS) cases.push({ before: b, cmd: c, kind: 'dir', umask: '027' });
  for (const pr of cases) {
    const s = at(pr);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ before: '755', cmd: 'o=', toggled: 9 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a label in the page', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(ids.length <= 9, 'keys 1–9');
  const options = { kind: logic.KINDS, before: logic.BEFORE, cmd: logic.CMDS, umask: logic.UMASKS };
  for (const pr of logic.presets) {
    for (const [k, v] of Object.entries(pr.params)) {
      assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
      if (options[k]) assert.ok(options[k].includes(v), `${pr.id}: ${k} = ${v} is an option`);
    }
    assert.ok(html.includes(`'${pr.id}'`), `${pr.id}: label in index.html`);
  }
  for (const [k, list] of Object.entries(options)) assert.ok(list.includes(logic.defaults[k]), `default ${k}`);
});
