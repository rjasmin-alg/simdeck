// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-special-bits. Run: node --test sims/lnx-special-bits/sim.test.js
// Rules and numbers: SPEC.md. Tie-breaks first, then one test per rule, then the presets' numbers, then the generic block.
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
const proc = (euid, egid, groups) => ({ cmd: 'x', ruid: euid, euid, rgid: egid, egid, groups: groups || [egid] });
const file = (owner, group, mode, kind) => ({ path: '/d/f', kind: kind || 'file', owner, group, mode, script: false });
const dir = (owner, group, mode) => file(owner, group, mode, 'dir');
const ids = (p) => [p.ruid, p.euid, p.rgid, p.egid];

// ── rule 9, the tie-break: file owner, then directory owner, then privilege ──

test('rule 9: root deleting in its own sticky /tmp passes by directory owner, not by privilege', () => {
  const r = logic.unlink(proc(0, 0), dir(0, 0, 0o1777), file(1001, 1001, 0o666));
  assert.equal(r.ok, true);
  assert.equal(r.by, 'dirOwner');
  assert.deepEqual(r.tests.map((x) => [x.test, x.ok]), [['fileOwner', false], ['dirOwner', true], ['privileged', true]]);
});

test('rule 9: root in a sticky directory owned by ana passes by privilege', () => {
  const r = logic.unlink(proc(0, 0), dir(1001, 1001, 0o1777), file(1000, 1000, 0o644));
  assert.equal(r.by, 'privileged');
});

test('rule 9: ana deleting her own file in a directory she owns passes by file owner (tested first)', () => {
  const r = logic.unlink(proc(1001, 1001), dir(1001, 1001, 0o1777), file(1001, 1001, 0o644));
  assert.equal(r.by, 'fileOwner');
  // and root deleting a file it owns in its own directory: file owner too
  assert.equal(logic.unlink(proc(0, 0), dir(0, 0, 0o1777), file(0, 0, 0o644)).by, 'fileOwner');
});

test('rule 9 on the stage: sticky-tmp step 4 with actor root names the directory owner', () => {
  const s = at({ script: 'sticky-tmp', actor: 'root' }, 4);
  assert.equal(s.result.ok, true);
  assert.equal(s.result.sticky.by, 'dirOwner');
  assert.equal(s.result.rule, 4);
});

// ── rule 3's own tie-break: the first class that matches decides, even when a later one would allow more ──

test('rule 3: the owner class decides even when group or others would allow', () => {
  const f = file(1000, 1002, 0o077);
  const r = logic.access(proc(1000, 1000, [1000, 1002]), f, 'r');
  assert.deepEqual([r.cls, r.bits, r.ok], ['owner', '---', false]);
  const g = logic.access(proc(1001, 1001, [1001, 1002]), file(0, 1002, 0o707), 'r');
  assert.deepEqual([g.cls, g.bits, g.ok], ['group', '---', false]);
});

test('rule 3: group matches by EGID or by a supplementary group', () => {
  assert.equal(logic.access(proc(1001, 1002, [1001]), file(0, 1002, 0o070), 'r').cls, 'group');
  assert.equal(logic.access(proc(1001, 1001, [1001, 1002]), file(0, 1002, 0o070), 'r').cls, 'group');
  assert.equal(logic.access(proc(1000, 1000, [1000]), file(0, 1002, 0o070), 'r').cls, 'others');
});

// ── rule 1: setuid, EUID ← the file's owner ──

test('rule 1: student runs passwd (root, 4755): RUID 1000, EUID 0, groups unchanged', () => {
  const s = at({}, 1);
  assert.deepEqual(ids(s.proc), [1000, 0, 1000, 1000]);
  assert.equal(s.result.exec.setuid, true);
  assert.equal(s.result.rule, 1);
  assert.ok(s.changed.includes('proc'));
});

test('rule 1: run as the owner, not as root: report (ana, 4755) gives EUID 1001; root running it drops to 1001', () => {
  assert.deepEqual(ids(at({ script: 'owner-not-root' }, 1).proc), [1000, 1001, 1000, 1000]);
  assert.deepEqual(ids(at({ script: 'owner-not-root', actor: 'root' }, 1).proc), [0, 1001, 0, 0]);
  assert.deepEqual(ids(at({ actor: 'ana' }, 1).proc), [1001, 0, 1001, 1001]);
  assert.deepEqual(ids(at({ actor: 'root' }, 1).proc), [0, 0, 0, 0]);
});

test('rule 1: without the bit, RUID = EUID = the caller', () => {
  const e = logic.exec(logic.user('student'), file(0, 0, 0o755));
  assert.deepEqual(ids(e.proc), [1000, 1000, 1000, 1000]);
  assert.equal(e.setuid, false);
});

test('rule 1: EUID 1001 is not root: the same process is refused /etc/shadow', () => {
  const s = at({ script: 'owner-not-root' }, 3);
  assert.deepEqual(ids(s.proc), [1000, 1001, 1000, 1000]);
  assert.deepEqual([s.result.ok, s.result.errno, s.result.check.cls, s.result.check.bits], [false, 'EACCES', 'others', '---']);
  assert.deepEqual(s.changed, []);
  assert.equal(s.proc.via, 'setuid');
});

// ── rule 2: setgid on an executable ──

test('rule 2: setgid with group x: EGID ← the file\'s group; with S (no group x) nothing changes', () => {
  const e = logic.exec(logic.user('student'), file(0, 1002, 0o2755));
  assert.deepEqual(ids(e.proc), [1000, 1000, 1000, 1002]);
  assert.equal(e.setgid, true);
  const s = logic.exec(logic.user('student'), file(0, 1002, 0o2745));
  assert.deepEqual(ids(s.proc), [1000, 1000, 1000, 1000]);
  assert.equal(s.setgid, false);
  // both bits: both IDs change
  assert.deepEqual(ids(logic.exec(logic.user('student'), file(1001, 1002, 0o6755)).proc), [1000, 1001, 1000, 1002]);
});

// ── rule 3: checks use EUID/EGID; EUID 0 skips them ──

test('rule 3: the passwd process (EUID 0) may write /etc/shadow (0000); student\'s cat may not', () => {
  const s2 = at({}, 2);
  assert.equal(s2.result.ok, true);
  assert.equal(s2.result.check.cls, 'root');
  assert.equal(s2.proc.ruid, 1000, 'the real UID is still the caller');
  const s3 = at({}, 3);
  assert.deepEqual([s3.result.ok, s3.result.errno, s3.result.check.cls, s3.result.check.bits], [false, 'EACCES', 'others', '---']);
  assert.deepEqual(ids(s3.proc), [1000, 1000, 1000, 1000]);
  assert.equal(s3.proc.cmd, 'cat');
});

test('rule 3: the check takes the effective ID: EUID 1001 reads ana\'s 0600 file, EUID 1000 would not', () => {
  const s = at({ script: 'owner-not-root' }, 2);
  assert.deepEqual([s.result.ok, s.result.check.cls, s.result.check.bits], [true, 'owner', 'rw-']);
  const plan = logic.findFile(s, '/home/ana/plan.txt');
  assert.equal(logic.access(logic.shellOf(logic.user('student'), 'cat'), plan, 'r').ok, false);
});

test('rule 3: root needs one x bit to execute a regular file; not for r or w', () => {
  const root = proc(0, 0);
  assert.equal(logic.access(root, file(0, 0, 0o644), 'x').ok, false);
  assert.equal(logic.access(root, file(0, 0, 0o001), 'x').ok, true);
  assert.equal(logic.access(root, file(0, 0, 0o000), 'rw').ok, true);
  assert.equal(logic.access(root, dir(0, 0, 0o000), 'x').ok, true);
});

test('rule 3: every letter asked for must be set', () => {
  assert.equal(logic.access(proc(1000, 1000), file(1000, 1000, 0o400), 'rw').ok, false);
  assert.equal(logic.access(proc(1000, 1000), file(1000, 1000, 0o600), 'rw').ok, true);
});

test('rule 3: exec without x is refused (the process is not changed by the bit)', () => {
  const e = logic.exec(logic.user('student'), file(0, 0, 0o4750));
  assert.equal(e.ok, false);
  assert.equal(e.setuid, false);
  assert.equal(e.proc.euid, 1000);
});

// ── rule 4: the sticky directory ──

test('rule 4: student may write ana\'s 666 file in /tmp but not delete it: EPERM, all three tests fail', () => {
  const s3 = at({ script: 'sticky-tmp' }, 3);
  assert.deepEqual([s3.result.ok, s3.result.check.cls, s3.result.check.bits], [true, 'others', 'rw-']);
  assert.deepEqual(ids(s3.proc), [1000, 1000, 1000, 1000]);
  const s4 = at({ script: 'sticky-tmp' }, 4);
  assert.deepEqual([s4.result.ok, s4.result.errno, s4.result.rule], [false, 'EPERM', 4]);
  assert.equal(s4.result.check.ok, true, 'writing the directory passed');
  assert.deepEqual(s4.result.sticky.tests.map((x) => x.ok), [false, false, false]);
  assert.ok(logic.findFile(s4, '/tmp/ana.txt'), 'the file is still there');
  assert.deepEqual(s4.changed, ['proc']);
});

test('rule 4: ana deletes her own file; the entry goes', () => {
  const s = at({ script: 'sticky-tmp' }, 5);
  assert.deepEqual([s.result.ok, s.result.sticky.by], [true, 'fileOwner']);
  assert.equal(logic.findFile(s, '/tmp/ana.txt'), null);
  assert.ok(s.changed.includes('entry:/tmp/ana.txt'));
  assert.equal(s.result.removed.owner, 1001);
  assert.deepEqual(s.gone, { '/tmp/ana.txt': 5 });
});

test('rule 4: sticky off (0777): writing the directory is enough; then ana\'s rm finds nothing', () => {
  const s4 = at({ script: 'sticky-tmp', sticky: false }, 4);
  assert.deepEqual([s4.result.ok, s4.result.sticky.on, s4.result.sticky.by], [true, false, 'dirWrite']);
  assert.deepEqual(s4.result.sticky.tests, []);
  const s5 = at({ script: 'sticky-tmp', sticky: false }, 5);
  assert.deepEqual([s5.result.ok, s5.result.errno, s5.result.goneAt], [false, 'ENOENT', 4]);
});

test('rule 4: writing the directory is checked first: without wx on it, EACCES before the sticky tests', () => {
  const r = logic.unlink(proc(1000, 1000), dir(0, 0, 0o1755), file(1000, 1000, 0o644));
  assert.deepEqual([r.ok, r.errno, r.tests], [false, 'EACCES', []]);
  const n = logic.unlink(proc(1000, 1000), dir(0, 0, 0o1777), null);
  assert.equal(n.errno, 'ENOENT');
});

// ── rule 5: setgid on a directory ──

test('rule 5: ana\'s file in /srv/projekt (2770) gets group projekt; in /tmp, her own group', () => {
  const s1 = at({ script: 'setgid-dir' }, 1);
  const a = logic.findFile(s1, '/srv/projekt/ana.txt');
  assert.deepEqual([a.owner, a.group, a.mode, a.isNew], [1001, 1002, 0o644, true]);
  assert.deepEqual([s1.result.check.cls, s1.result.created.fromDir, s1.proc.egid], ['group', true, 1001]);
  assert.ok(s1.changed.includes('entry:/srv/projekt/ana.txt'));
  const s3 = at({ script: 'setgid-dir' }, 3);
  const b = logic.findFile(s3, '/tmp/ana2.txt');
  assert.deepEqual([b.owner, b.group, s3.result.created.fromDir], [1001, 1001, false]);
  assert.equal(logic.findFile(s3, '/srv/projekt/ana.txt').isNew, false, 'only the newest is new');
});

test('rule 5: the owner is the EUID and the group the directory\'s, whatever the EGID', () => {
  const c = logic.create(proc(1000, 1000, [1000, 1002]), dir(0, 1002, 0o2777), '/d/x', 0o644);
  assert.deepEqual([c.file.owner, c.file.group], [1000, 1002]);
  // a setuid process (RUID 1000, EUID 1001): the new file is the EUID's
  const su = { cmd: 'x', ruid: 1000, euid: 1001, rgid: 1000, egid: 1000, groups: [1000] };
  assert.equal(logic.create(su, dir(0, 0, 0o777), '/d/x', 0o644).file.owner, 1001);
  const d = logic.create(proc(1000, 1000), dir(0, 1002, 0o0777), '/d/x', 0o644);
  assert.equal(d.file.group, 1000);
  assert.equal(logic.create(proc(1000, 1000), dir(0, 1002, 0o2770), '/d/x', 0o644).errno, 'EACCES');
});

test('rule 5: student, in no group of /srv/projekt, cannot list it', () => {
  const s = at({ script: 'setgid-dir' }, 2);
  assert.deepEqual([s.result.ok, s.result.errno, s.result.check.cls, s.result.check.bits], [false, 'EACCES', 'others', '---']);
  assert.deepEqual([at({ script: 'setgid-dir', actor: 'ana' }, 2).result.check.cls, at({ script: 'setgid-dir', actor: 'root' }, 2).result.check.cls], ['group', 'root']);
});

// ── rule 6: the fourth digit and the letters ──

test('rule 6: lowercase with x, uppercase without, in each class', () => {
  const cases = [['file', 0o4755, '-rwsr-xr-x'], ['dir', 0o1777, 'drwxrwxrwt'], ['dir', 0o2770, 'drwxrws---'],
    ['file', 0o4644, '-rwSr--r--'], ['file', 0o2644, '-rw-r-Sr--'], ['dir', 0o1770, 'drwxrwx--T'],
    ['file', 0o7777, '-rwsrwsrwt'], ['file', 0o7000, '---S--S--T'], ['file', 0o0000, '----------'], ['file', 0o0755, '-rwxr-xr-x']];
  for (const [k, m, ls] of cases) assert.equal(logic.lsString(k, m), ls, m.toString(8));
});

test('rule 6: four octal digits, the special one 4 + 2 + 1', () => {
  assert.equal(logic.octal4(0o4755), '4755');
  assert.equal(logic.octal4(0o1777), '1777');
  assert.equal(logic.octal4(0o2770), '2770');
  assert.equal(logic.octal4(0o600), '0600');
  const sp = logic.special('file', 0o7777);
  assert.equal(sp.digit, 7);
  assert.deepEqual(sp.bits.map((b) => [b.bit, b.value, b.index, b.letter, b.upper]),
    [['setuid', 4, 3, 's', false], ['setgid', 2, 6, 's', false], ['sticky', 1, 9, 't', false]]);
  assert.deepEqual(logic.special('dir', 0o1770).bits.map((b) => [b.letter, b.upper]), [['T', true]]);
  assert.deepEqual(logic.special('file', 0o755), { digit: 0, bits: [] });
});

test('rule 6: the sticky step reads /tmp as 1777 (on) or 0777 (off)', () => {
  const on = at({ script: 'sticky-tmp' }, 1), off = at({ script: 'sticky-tmp', sticky: false }, 1);
  assert.equal(on.result.rule, 6);
  assert.equal(logic.octal4(logic.findFile(on, '/tmp').mode), '1777');
  assert.equal(logic.octal4(logic.findFile(off, '/tmp').mode), '0777');
});

// ── rule 7: what clears the bits ──

test('rule 7: an unprivileged write clears setuid, and setgid with group x; an S only for a writer outside the group', () => {
  const ana = proc(1001, 1001, [1001, 1002]), student = proc(1000, 1000);
  // the kernel run (SPEC.md rule 7)
  assert.equal(logic.writeClears(file(1001, 1001, 0o6755), ana), 0o755);
  assert.equal(logic.writeClears(file(1001, 1001, 0o6745), ana), 0o2745);
  assert.equal(logic.writeClears(file(1001, 1001, 0o2747), ana), 0o2747);
  assert.equal(logic.writeClears(file(1001, 1001, 0o6747), student), 0o747);
  assert.equal(logic.writeClears(file(0, 0, 0o6755), proc(0, 0)), 0o6755);
  assert.equal(logic.writeClears(dir(1001, 1002, 0o2770), ana), 0o2770);
  // in the group by a supplementary group only
  assert.equal(logic.writeClears(file(0, 1002, 0o2747), ana), 0o2747);
});

test('rule 7: chown or chgrp clears setuid (even with no x bit), setgid with group x; root keeps an S', () => {
  const ana = proc(1001, 1001, [1001, 1002]), root = proc(0, 0);
  assert.equal(logic.chownClears(file(1001, 1001, 0o6755), ana), 0o755);
  assert.equal(logic.chownClears(file(1001, 1001, 0o6644), ana), 0o2644);
  assert.equal(logic.chownClears(file(0, 0, 0o6755), root), 0o755);
  assert.equal(logic.chownClears(file(1001, 1001, 0o2745), root), 0o2745);
  assert.equal(logic.chownClears(file(1001, 1001, 0o2745), proc(1000, 1000)), 0o745);
  assert.equal(logic.chownClears(dir(0, 1002, 0o2770), root), 0o2770);
});

// ── effective, not real: fixtures where the two differ (fresh review) ──

const split = (ruid, euid, rgid, egid, groups) => ({ cmd: 'x', ruid, euid, rgid, egid, groups: groups || [rgid] });

test('rule 3: the group class matches the EGID, not the RGID', () => {
  const p = split(1000, 1000, 1000, 1002, [1000]);
  assert.equal(logic.access(p, file(0, 1002, 0o040), 'r').cls, 'group');
  assert.equal(logic.access(split(1000, 1000, 1002, 1000, [1000]), file(0, 1002, 0o040), 'r').cls, 'others');
});

test('rule 5: a new file outside a setgid directory takes the EGID, not the RGID', () => {
  const c = logic.create(split(1000, 1000, 1000, 1002, [1000]), dir(0, 0, 0o777), '/d/x', 0o644);
  assert.equal(c.file.group, 1002);
});

test('rule 4: the sticky tests use the EUID; the directory\'s owner, not its group', () => {
  // RUID owns the file, EUID does not: refused
  assert.equal(logic.unlink(split(1001, 1000, 1000, 1000), dir(0, 0, 0o1777), file(1001, 1001, 0o666)).errno, 'EPERM');
  // EUID owns the file, RUID does not: allowed by file owner
  assert.equal(logic.unlink(split(1000, 1001, 1000, 1000), dir(0, 0, 0o1777), file(1001, 1001, 0o666)).by, 'fileOwner');
  // EUID owns the directory, RUID does not
  assert.equal(logic.unlink(split(1000, 1001, 1000, 1000), dir(1001, 0, 0o1777), file(1000, 1000, 0o666)).by, 'dirOwner');
  // EUID 0 with RUID 1000: privilege
  assert.equal(logic.unlink(split(1000, 0, 1000, 1000), dir(1001, 1001, 0o1777), file(1000, 1000, 0o666)).by, 'privileged');
  // being in the directory's group is not owning it
  assert.equal(logic.unlink(proc(1000, 1002), dir(0, 1002, 0o1777), file(1001, 1001, 0o666)).errno, 'EPERM');
});

test('rules 4, 5: deleting or creating needs w and x on the directory', () => {
  assert.equal(logic.unlink(proc(1000, 1000), dir(0, 0, 0o1776), file(1000, 1000, 0o644)).errno, 'EACCES');
  assert.equal(logic.unlink(proc(1000, 1000), dir(0, 0, 0o0776), file(1000, 1000, 0o644)).errno, 'EACCES');
  assert.equal(logic.create(proc(1000, 1000), dir(0, 0, 0o776), '/d/x', 0o644).errno, 'EACCES');
  assert.equal(logic.create(proc(1000, 1000), dir(0, 0, 0o775), '/d/x', 0o644).errno, 'EACCES');
});

test('rule 1: exec keeps the caller\'s supplementary groups', () => {
  assert.deepEqual(at({ actor: 'ana' }, 1).proc.groups, [1001, 1002]);
  assert.deepEqual(at({ script: 'owner-not-root' }, 1).proc.groups, [1000]);
});

test('the rule each step reports (the badge on the page)', () => {
  const rules = (over) => Array.from({ length: logic.steps(P(over)) }, (_, i) => at(over, i + 1).result.rule);
  assert.deepEqual(rules({}), [1, 3, 3]);
  assert.deepEqual(rules({ script: 'owner-not-root' }), [1, 3, 3]);
  assert.deepEqual(rules({ script: 'sticky-tmp' }), [6, 5, 3, 4, 4]);
  assert.deepEqual(rules({ script: 'sticky-tmp', sticky: false }), [6, 5, 3, 4, 3]);
  assert.deepEqual(rules({ script: 'setgid-dir' }), [5, 3, 5]);
  assert.deepEqual(rules({ script: 'script-ignored' }), [8, 3]);
  // setgid alone on a binary: rule 2
  const s = logic.exec(logic.user('student'), file(0, 1002, 0o2755));
  assert.equal(s.proc.via, 'setgid');
});

test('rule 3: root\'s check says whether the bits alone would have allowed it; letters keep s and t', () => {
  assert.equal(at({}, 2).result.check.bitsAllow, false);
  assert.equal(at({ script: 'sticky-tmp', actor: 'root' }, 3).result.check.bitsAllow, true);
  const g = at({ script: 'setgid-dir', actor: 'ana' }, 2).result.check;
  assert.deepEqual([g.bits, g.letters], ['rwx', 'rws']);
});

test('rule 8: a script with setgid only is ignored too', () => {
  const e = logic.exec(logic.user('student'), Object.assign(file(0, 1002, 0o2755), { script: true }));
  assert.deepEqual([e.ignored, e.proc.egid], [true, 1000]);
});

// ── rule 8: scripts ──

test('rule 8: a setuid-root script runs with the caller\'s EUID; its open of /etc/shadow is refused', () => {
  const s1 = at({ script: 'script-ignored' }, 1);
  assert.deepEqual(ids(s1.proc), [1000, 1000, 1000, 1000]);
  assert.deepEqual([s1.result.exec.ignored, s1.result.exec.setuid, s1.result.rule], [true, false, 8]);
  assert.equal(s1.proc.cmd, 'sh cleanup.sh');
  const s2 = at({ script: 'script-ignored' }, 2);
  assert.deepEqual([s2.result.ok, s2.result.errno], [false, 'EACCES']);
  // the same mode on a binary would change the EUID
  assert.equal(logic.exec(logic.user('student'), file(0, 0, 0o4755)).proc.euid, 0);
  // a script without the bits: nothing ignored
  assert.equal(logic.exec(logic.user('student'), Object.assign(file(0, 0, 0o755), { script: true })).ignored, false);
});

// ── presets ──

test('steps per preset: 3, 3, 5, 3, 2; sim.json steps is the default\'s', () => {
  assert.deepEqual(logic.PRESETS.map((p) => logic.steps(p.params)), [3, 3, 5, 3, 2]);
  assert.equal(logic.steps({}), 3);
});

test('a running program\'s open keeps its process; a user\'s own action starts a new one', () => {
  const s2 = at({}, 2);
  assert.deepEqual(s2.changed, []);
  assert.equal(s2.proc.cmd, 'passwd');
  assert.equal(s2.action.who, null);
  const t3 = at({ script: 'sticky-tmp', actor: 'ana' }, 3);
  assert.deepEqual([t3.proc.cmd, t3.proc.euid, t3.result.check.cls], ['sh', 1001, 'owner']);
});

test('the actor plays student\'s part only; ana\'s own actions stay hers', () => {
  const s = at({ script: 'sticky-tmp', actor: 'root' }, 2);
  assert.equal(s.action.who, 'ana');
  assert.equal(at({ script: 'sticky-tmp', actor: 'root' }, 4).action.who, 'root');
  assert.equal(at({ script: 'setgid-dir', actor: 'root' }, 1).action.who, 'ana');
});

test('the scene\'s files: shadow 0000, passwd 4755 root, report 4755 ana, projekt 2770 root:projekt', () => {
  const s = at({}, 0);
  const m = (p) => { const x = logic.findFile(s, p); return [x.owner, x.group, logic.octal4(x.mode), x.kind]; };
  assert.deepEqual(m('/etc/shadow'), [0, 0, '0000', 'file']);
  assert.deepEqual(m('/usr/bin/passwd'), [0, 0, '4755', 'file']);
  assert.deepEqual(m('/opt/ana/report'), [1001, 1001, '4755', 'file']);
  assert.deepEqual(m('/srv/projekt'), [0, 1002, '2770', 'dir']);
  assert.deepEqual(m('/tmp'), [0, 0, '1777', 'dir']);
  assert.equal(logic.findFile(s, '/usr/local/bin/cleanup.sh').script, true);
  assert.deepEqual(logic.USERS.map((u) => [u.name, u.uid, u.groups]), [['root', 0, [0]], ['student', 1000, [1000]], ['ana', 1001, [1001, 1002]]]);
  assert.equal(s.proc, null);
});

test('entries and target for the page', () => {
  const s = at({ script: 'sticky-tmp' }, 2);
  assert.deepEqual(logic.entries(s, '/tmp').map((x) => x.path), ['/tmp/ana.txt']);
  assert.equal(logic.targetOf(s), '/tmp/ana.txt');
  assert.equal(logic.targetOf(at({}, 1)), '/usr/bin/passwd');
  assert.equal(logic.targetOf(at({}, 0)), null);
});

test('params are normalised: unknown script and actor fall back; sticky "false" is off', () => {
  assert.deepEqual(logic.norm({ script: 'nope', actor: 'mallory' }), { script: 'passwd', actor: 'student', sticky: true });
  assert.equal(logic.norm({ sticky: 'false' }).sticky, false);
  assert.equal(logic.norm({ sticky: 0 }).sticky, false);
});

// ── generic checks every sim keeps ──

const ALL_PARAMS = [];
for (const script of logic.SCRIPT_IDS) for (const actor of logic.ACTORS) for (const sticky of [true, false]) ALL_PARAMS.push(P({ script, actor, sticky }));

test('state is JSON-safe at every step', () => {
  for (const p of ALL_PARAMS) {
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of ALL_PARAMS) {
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ script: 'sticky-tmp' });
  const s0 = kit.stateAt(logic, p, 4);
  const copy = structuredClone(s0);
  logic.step(s0, 5, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('strings: every preset, goal, access class, sticky test and user has its words', () => {
  for (const lang of ['hr', 'en']) {
    const tb = strings[lang];
    for (const pr of logic.PRESETS) {
      for (const k of ['preset_' + pr.id, 'preset_' + pr.id + '_hint', 'goal_' + pr.id]) assert.ok(tb[k], lang + ' ' + k);
    }
    for (const k of ['cls_owner', 'cls_group', 'cls_others', 'test_fileOwner', 'test_dirOwner', 'test_privileged', 'by_dirWrite',
      'actor_student', 'actor_ana', 'actor_root', 'need_r', 'need_w']) assert.ok(tb[k], lang + ' ' + k);
    for (let r = 1; r <= 8; r++) assert.ok(tb['rule_' + r], lang + ' rule_' + r);
  }
});

test('the page: meta steps match the default script; presets come from the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults));
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults));
  assert.match(html, /L\.PRESETS\.map/);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, k);
  for (const e of sim.entries || []) assert.ok(logic.PRESETS.some((x) => x.id === e.preset), e.preset);
});
