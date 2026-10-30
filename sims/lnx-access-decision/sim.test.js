// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-access-decision's model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
// numbers and the real run, then the template's generic block.
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
const all = (p) => Array.from({ length: steps(p) + 1 }, (_, n) => at(p, n));
const phases = (p) => all(p).map((s) => (s.phase === 'compare' ? 'compare:' + s.cursor : s.phase));

/** A test file: entries as 'user::rwx', 'user:1001:---', 'group:2000:r--', 'mask::rw-', 'other::---' (ids numeric). */
function file(kind, uid, gid, text) {
  const tag = { user: ['user_obj', 'user'], group: ['group_obj', 'group'] };
  const acl = text.split(',').map((x) => {
    const [t, q, perms] = x.split(':');
    if (t === 'mask' || t === 'other') return { tag: t, qual: null, perms };
    const e = { tag: tag[t][q ? 1 : 0], qual: q || null, perms };
    if (q) e[t === 'user' ? 'uid' : 'gid'] = Number(q);
    return e;
  });
  return { kind, uid, gid, acl };
}
const proc = (uid, ...gids) => ({ uid, gids });
const ok = (f, p, want) => logic.check(f, p, want).granted;

// ── tie-breaks ──

test('T1 (rule 4): several matching group entries are OR-ed, not the first of them', () => {
  const f = file('file', 1000, 1000, 'user::rw-,group::---,group:2000:r--,group:1001:-w-,mask::rwx,other::---');
  const ana = proc(1001, 1001, 2000);
  const w = logic.check(f, ana, 'w');
  assert.equal(w.matched, 'groups');
  assert.deepEqual(w.rows, [2, 3], 'both named groups match; group:: (gid 1000) does not');
  assert.deepEqual(w.granting, [3], 'w comes from group:1001, the second match');
  assert.equal(w.granted, true);
  assert.deepEqual(logic.check(f, ana, 'r').granting, [2], 'r comes from group:2000, the first match');
  assert.equal(ok(f, ana, 'x'), false);
  // the groups' order does not matter
  const g = file('file', 1000, 1000, 'user::rw-,group::---,group:1001:-w-,group:2000:r--,mask::rwx,other::---');
  for (const want of ['r', 'w', 'x']) assert.equal(ok(g, ana, want), ok(f, ana, want), want);
});

test('T2 (rule 4): a matching group class with no bit does not fall through to other', () => {
  const f = file('file', 1000, 1000, 'user::rw-,group::---,group:2000:r--,mask::rwx,other::rwx');
  const marko = proc(1002, 1002, 2000);
  const r = logic.check(f, marko, 'x');
  assert.equal(r.matched, 'groups');
  assert.equal(r.granted, false);
  assert.deepEqual(r.compared.map((c) => c.cls), ['owner', 'groups'], 'other is never compared');
  // without ACL entries: group:: ---, other rwx → a group member is denied, a stranger granted
  const plain = file('file', 1000, 2000, 'user::rw-,group::---,other::rwx');
  assert.equal(ok(plain, marko, 'r'), false);
  assert.equal(ok(plain, proc(65534, 65534), 'r'), true);
  // the page: preset 4's file, marko x, stops at the groups class
  assert.deepEqual(phases(P({ scene: 'druga', who: 'marko', want: 'x' })),
    ['start', 'identify', 'compare:owner', 'compare:groups', 'mask', 'verdict']);
});

test('T3 (rule 2): first match is final for the owner, even when the owner gets less than everyone else', () => {
  const e = end(P({ scene: 'plan', who: 'student', want: 'r' }));
  assert.equal(e.verdict, 'denied');
  assert.equal(e.matched, 'owner');
  assert.deepEqual(e.rows, ['hit', null, null], 'group and other are never read');
  assert.equal(end(P({ scene: 'plan', who: 'ana', want: 'r' })).verdict, 'granted');
  assert.equal(end(P({ scene: 'plan', who: 'nobody', want: 'w' })).verdict, 'granted');
  // druga.txt with mask rwx: ana owns it (rw-) and is in projekt (rwx); the owner entry decides
  assert.equal(end(P({ scene: 'druga', mask: 'rwx', who: 'ana', want: 'x' })).verdict, 'denied');
  assert.equal(end(P({ scene: 'druga', mask: 'rwx', who: 'marko', want: 'x' })).verdict, 'granted');
});

test('T4 (rule 3): a named user entry decides before the groups', () => {
  const f = file('file', 1000, 1000, 'user::rw-,user:1001:---,group::---,group:2000:rwx,mask::rwx,other::rwx');
  const r = logic.check(f, proc(1001, 1001, 2000), 'r');
  assert.equal(r.matched, 'users');
  assert.equal(r.granted, false);
  assert.equal(ok(f, proc(1002, 1002, 2000), 'r'), true, 'marko, not named, gets the group');
});

test('T5 (rule 6): the mask never limits the owner or other', () => {
  for (const want of ['r', 'w', 'x']) assert.equal(end(P({ scene: 'proba', mask: '---', who: 'student', want })).verdict, 'granted', want);
  const e = end(P({ scene: 'proba', mask: '---', who: 'student', want: 'x' }));
  assert.equal(e.maskUsed, false, 'the file has a mask, and it does not apply to the owner');
  assert.deepEqual(phases(P({ scene: 'proba', mask: '---', who: 'student' })), ['start', 'identify', 'compare:owner', 'verdict']);
  const f = file('file', 1000, 1000, 'user::---,user:1001:rwx,group::rwx,mask::---,other::rwx');
  const stranger = logic.check(f, proc(65534, 65534), 'w');
  assert.equal(stranger.matched, 'other');
  assert.equal(stranger.granted, true);
  assert.equal(stranger.effective[4], 'rwx');
  assert.equal(ok(f, proc(1001, 1001), 'r'), false, 'the named user is masked to ---');
});

test('T6 (rule 1): root\'s x needs an x bit in the mode; an ACL x cut by the mask does not count', () => {
  const r = (scene, want, mask) => end(P({ scene, who: 'root', want, mask })).verdict;
  assert.equal(r('tajna', 'r'), 'granted');
  assert.equal(r('tajna', 'w'), 'granted');
  assert.equal(r('tajna', 'x'), 'denied');
  assert.equal(r('druga', 'x', 'rw-'), 'denied', 'group::rwx and group:projekt:rwx, but -rw-rw----');
  assert.equal(r('druga', 'x', 'rwx'), 'granted');
  assert.equal(r('proba', 'x', '---'), 'granted', 'the owner\'s x is in the mode');
  assert.equal(r('projekt', 'x'), 'granted', 'a directory: search is overridden');
  assert.equal(logic.check(file('dir', 1000, 1000, 'user::---,group::---,other::---'), proc(0, 0), 'x').granted, true);
  // an x in any one triplet is enough: other only, group only
  assert.equal(logic.check(file('file', 1000, 1000, 'user::---,group::---,other::r-x'), proc(0, 0), 'x').granted, true);
  assert.equal(logic.check(file('file', 1000, 1000, 'user::---,group::--x,other::---'), proc(0, 0), 'x').granted, true);
  assert.equal(end(P({ scene: 'tajna', who: 'root', want: 'x' })).reason, 'privilege-no-x');
  assert.equal(end(P({ scene: 'druga', who: 'root', want: 'x', mask: 'rwx' })).reason, 'privilege-x');
  assert.equal(end(P({ scene: 'projekt', who: 'root', want: 'x' })).reason, 'privilege-dir');
  assert.equal(end(P({ scene: 'tajna', who: 'root', want: 'w' })).reason, 'privilege');
});

// ── rules ──

test('rule 1: a privileged process is decided before the classes: identify, override, verdict', () => {
  const p = P({ scene: 'projekt', who: 'root' });
  assert.deepEqual(phases(p), ['start', 'identify', 'override', 'verdict']);
  assert.deepEqual(all(p).map((s) => s.changed), [[], ['proc'], ['override'], ['verdict']]);
  assert.deepEqual(all(p).map((s) => s.cursor), [null, null, null, null]);
  const e = end(p);
  assert.equal(e.privileged, true);
  assert.deepEqual(e.rows, [null, null, null], 'no class is read');
  assert.equal(e.matched, null);
  // root owns /srv/projekt; the privilege still comes first
  assert.equal(logic.fileOf(p).uid, 0);
  assert.equal(at(p, 1).privileged, true);
  assert.equal(at(P({}), 1).privileged, false);
});

test('rule 2: the owner entry decides, unmasked, and nothing after it is read', () => {
  const p = P({ scene: 'proba', who: 'student', want: 'w', mask: 'r--' });
  const e = end(p);
  assert.equal(e.matched, 'owner');
  assert.equal(e.verdict, 'granted');
  assert.deepEqual(e.effective, { 0: 'rwx' });
  assert.deepEqual(e.rows, ['hit', null, null, null, null]);
});

test('rule 3: a named user entry AND the mask decides', () => {
  const p = (want, mask) => end(P({ scene: 'proba', who: 'nobody', want, mask }));
  assert.equal(p('w', 'rw-').verdict, 'granted');
  assert.deepEqual(p('w', 'rw-').effective, { 1: 'rw-' });
  assert.equal(p('w', 'r--').verdict, 'denied');
  assert.deepEqual(p('w', 'r--').effective, { 1: 'r--' });
  assert.equal(p('x', 'rwx').verdict, 'denied', 'the entry has no x; the mask cannot add one');
  assert.equal(p('r', 'rw-').reason, 'users');
});

test('rule 4: the owning group and named groups are one class; the mask limits both', () => {
  const s = end(P({ scene: 'druga', who: 'marko', want: 'x' }));
  assert.deepEqual(s.matchedRows, [1, 2]);
  assert.deepEqual(s.effective, { 1: 'rw-', 2: 'rw-' });
  assert.deepEqual(s.granting, []);
  assert.equal(s.verdict, 'denied');
  const w = end(P({ scene: 'druga', who: 'marko', want: 'w' }));
  assert.deepEqual(w.granting, [1, 2]);
  // the owning group alone matches (supplementary group) on a file without an ACL
  const g = end(P({ scene: 'projekt', who: 'ana' }));
  assert.equal(g.matched, 'groups');
  assert.equal(g.verdict, 'granted');
  assert.equal(g.maskUsed, null, 'no mask on this file');
  assert.deepEqual(phases(P({ scene: 'projekt', who: 'ana' })), ['start', 'identify', 'compare:owner', 'compare:groups', 'verdict']);
});

test('rule 5: other decides last, unmasked, and matches every process', () => {
  const e = end(P({ scene: 'projekt', who: 'student' }));
  assert.equal(e.matched, 'other');
  assert.equal(e.verdict, 'denied');
  assert.deepEqual(e.rows, ['no', 'no', 'hit']);
  const f = end(P({ scene: 'proba', who: 'ana', want: 'r' }));
  assert.equal(f.matched, 'other');
  assert.deepEqual(phases(P({ scene: 'proba', who: 'ana' })), ['start', 'identify', 'compare:owner', 'compare:users', 'compare:groups', 'compare:other', 'verdict']);
});

test('rule 6: with a mask, ls -l shows the mask in the group triplet and a +', () => {
  const f = logic.fileOf(P({ scene: 'proba' }));
  assert.equal(f.ls, '-rwxrw----+', 'UL ch07, after setfacl -m u:nobody:rw proba');
  assert.equal(f.acl.find((e) => e.tag === 'group_obj').perms, '---', 'while getfacl says group::---');
  assert.equal(f.octal, '760');
  assert.equal(logic.fileOf(P({ scene: 'proba', mask: 'r--' })).ls, '-rwxr-----+');
  assert.equal(logic.fileOf(P({ scene: 'druga' })).ls, '-rw-rw----+', 'UL ch07: druga.txt');
  assert.equal(logic.fileOf(P({ scene: 'druga', mask: 'rwx' })).ls, '-rw-rwx---+');
  assert.equal(logic.masked('owner'), false);
  assert.equal(logic.masked('other'), false);
  assert.equal(logic.masked('users'), true);
  assert.equal(logic.masked('groups'), true);
});

test('rule 7: without ACL entries three rows, the same order, no mask, no +', () => {
  const f = logic.fileOf(P({ scene: 'projekt' }));
  assert.deepEqual(f.acl.map((e) => e.tag), ['user_obj', 'group_obj', 'other']);
  assert.equal(f.extended, false);
  assert.equal(f.ls, 'drwxrws---', 'UL ch07: ls -ld /srv/projekt');
  assert.deepEqual(logic.classesOf(f.acl).map((c) => c.cls), ['owner', 'groups', 'other']);
  assert.equal(logic.fileOf(P({ scene: 'plan', mask: '---' })).ls, '----rw-rw-', 'the mask param leaves a file without a mask alone');
  assert.equal(logic.fileOf(P({ scene: 'tajna' })).ls, '----------');
});

test('parsing and formatting: triplets, octal, the setgid letter', () => {
  assert.equal(logic.permBits('rw-'), 6);
  assert.equal(logic.permBits('--x'), 1);
  assert.equal(logic.permString(5), 'r-x');
  for (let b = 0; b < 8; b++) assert.equal(logic.permBits(logic.permString(b)), b);
  assert.throws(() => logic.permBits('wr-'));
  assert.equal(logic.octal(0o2770 & 0o777), '770');
  assert.equal(logic.lsString('dir', 0o760, { setgid: true }), 'drwxrwS---');
  assert.equal(logic.lsString('file', 0o640, { acl: true }), '-rw-r-----+');
  assert.throws(() => logic.check(logic.fileOf(P({})), logic.procOf(P({})), 'rw'));
});

test('steps: the demo stops at the verdict; the cursor lights the class being compared', () => {
  const p = P({ scene: 'proba', who: 'nobody', want: 'w' });
  const fr = all(p);
  assert.deepEqual(fr.map((s) => s.cursor), [null, null, 'owner', 'users', 'mask', null]);
  assert.deepEqual(fr[3].cursorRows, [1]);
  assert.deepEqual(fr[4].cursorRows, [3], 'the mask row');
  assert.equal(fr[3].effective, null, 'the mask is applied in its own step');
  assert.deepEqual(fr[4].effective, { 1: 'rw-' });
  assert.equal(fr[4].verdict, null);
  assert.equal(fr[5].verdict, 'granted');
  assert.deepEqual(fr[5].rows, ['no', 'hit', null, null, null], 'groups and other never read');
  assert.deepEqual(fr.map((s) => s.changed), [[], ['proc'], ['rows'], ['rows'], ['mask'], ['verdict']]);
});

// ── captions (captionOf picks the sentence; the page fills it) ──

const cap = (over, n) => logic.captionOf(n == null ? end(P(over)) : at(P(over), n));

test('captions: the task\'s two sentences where they belong', () => {
  // projekt, student: the third triplet decides, and it is empty (at the compare step of other)
  const c = cap({ scene: 'projekt', who: 'student' }, 4);
  assert.deepEqual(c, { key: 'cOtherEmpty', vars: { user: 'student', group: 'projekt' } });
  // druga.txt, marko x: the entry says rwx, the mask rw- stands between
  assert.deepEqual(cap({ scene: 'druga', who: 'marko', want: 'x' }, 4), { key: 'cMaskClips', vars: { entry: 'rwx', mask: 'rw-' } });
  // other with bits, or on a file with an ACL: the plain sentence
  assert.equal(cap({ scene: 'plan', who: 'nobody' }, 4).key, 'cOther');
  assert.equal(cap({ scene: 'proba', who: 'ana' }, 5).key, 'cOther');
});

test('captions: the verdict answers the misconception it shows, in a fixed priority', () => {
  assert.deepEqual(cap({ scene: 'plan', who: 'student' }), { key: 'cOwnerLocked', vars: { user: 'student', perms: '---' } });
  assert.equal(cap({ scene: 'tajna', who: 'student' }).key, 'cDenied', 'nobody else may either');
  // the owner's no: "others would be allowed" only when they would be after the mask
  assert.equal(cap({ scene: 'druga', who: 'ana', want: 'x', mask: 'rw-' }).key, 'cDenied', 'group x is cut, other ---');
  assert.deepEqual(cap({ scene: 'druga', who: 'ana', want: 'x', mask: 'rwx' }), { key: 'cOwnerLocked', vars: { user: 'ana', perms: 'rw-' } });
  // other decides: no "later row" to speak of
  assert.deepEqual(cap({ scene: 'proba', who: 'ana' }), { key: 'cDeniedOther', vars: { want: 'r' } });
  assert.deepEqual(cap({ scene: 'druga', who: 'marko', want: 'x' }), { key: 'cMaskDenied', vars: { want: 'x' } });
  assert.equal(cap({ scene: 'druga', who: 'marko', want: 'x', mask: 'rwx' }).key, 'cGranted');
  assert.equal(cap({ scene: 'proba', who: 'nobody', want: 'w', mask: 'r--' }).key, 'cMaskDenied');
  assert.equal(cap({ scene: 'proba', who: 'nobody', want: 'x', mask: 'rwx' }).key, 'cDenied', 'the entry has no x: not the mask\'s doing');
  assert.deepEqual(cap({ scene: 'projekt', who: 'student' }), { key: 'cDeniedOther', vars: { want: 'r' } });
  assert.deepEqual(cap({ scene: 'proba', who: 'nobody', want: 'x' }), { key: 'cDenied', vars: { cls: { t: 'oUsers' }, want: 'x' } });
  assert.deepEqual(cap({ scene: 'projekt', who: 'ana' }), { key: 'cGranted', vars: { cls: { t: 'oGroups' }, want: 'r' } });
  // no fall-through: no scene has a group without the bit and other with it, so give plan.txt's other an x here
  const s = end(P({ scene: 'plan', who: 'ana', want: 'x' }));
  s.file.acl[2].perms = 'r-x';
  assert.equal(logic.captionOf(s).key, 'cNoFallThrough');
  s.file.acl[2].perms = 'rw-';
  assert.equal(logic.captionOf(s).key, 'cDenied');
});

test('captions: every phase, root and the rest', () => {
  assert.deepEqual(cap({}, 0), { key: 'cStart', vars: { user: 'student', want: 'r', path: '/srv/projekt' } });
  assert.deepEqual(cap({}, 1), { key: 'cIdNo', vars: { uid: '1000', groups: 'student' } });
  assert.deepEqual(cap({ who: 'ana' }, 1).vars.groups, 'ana, projekt');
  assert.equal(cap({ who: 'root' }, 1).key, 'cIdRoot');
  assert.deepEqual(cap({}, 2), { key: 'cOwnerNo', vars: { owner: 'root', user: 'student' } });
  assert.deepEqual(cap({ scene: 'plan' }, 2), { key: 'cOwnerYes', vars: { user: 'student', entry: 'user::---' } });
  assert.deepEqual(cap({ scene: 'proba', who: 'nobody' }, 3), { key: 'cUsersYes', vars: { entry: 'user:nobody:rw-', user: 'nobody' } });
  assert.deepEqual(cap({ scene: 'proba', who: 'ana' }, 3), { key: 'cUsersNo', vars: { tag: 'user:', user: 'ana' } });
  assert.deepEqual(cap({ scene: 'proba', who: 'ana' }, 4), { key: 'cGroupsNo', vars: { groups: 'ana, projekt' } });
  assert.deepEqual(cap({ scene: 'projekt', who: 'ana' }, 3), { key: 'cGroupsYes', vars: { group: 'projekt', entry: 'group::rwx' } });
  assert.deepEqual(cap({ scene: 'druga', who: 'marko' }, 3),
    { key: 'cGroupsYesMany', vars: { group: 'projekt', entries: 'group::rwx, group:projekt:rwx' } });
  assert.deepEqual(cap({ scene: 'proba', who: 'nobody', want: 'w', mask: 'rwx' }, 4), { key: 'cMaskSame', vars: { mask: 'rwx', entry: 'rw-', eff: 'rw-' } });
  // the mask clips a bit that is not the wanted one: still "the mask stands between"
  assert.deepEqual(cap({ scene: 'druga', who: 'marko', want: 'r' }, 4), { key: 'cMaskClips', vars: { entry: 'rwx', mask: 'rw-' } });
  assert.deepEqual(cap({ scene: 'tajna', who: 'root' }, 2), { key: 'cOverride', vars: { ls: '----------' } });
  assert.equal(cap({ scene: 'projekt', who: 'root' }, 2).key, 'cOverrideDir');
  assert.equal(cap({ scene: 'tajna', who: 'root', want: 'w' }).key, 'cRootRW');
  assert.equal(cap({ scene: 'projekt', who: 'root', want: 'x' }).key, 'cRootDir');
  assert.deepEqual(cap({ scene: 'druga', who: 'root', want: 'x', mask: 'rwx' }), { key: 'cRootX', vars: { ls: '-rw-rwx---+' } });
  assert.deepEqual(cap({ scene: 'tajna', who: 'root', want: 'x' }), { key: 'cRootNoX', vars: { ls: '----------' } });
});

test('captions: every key the model picks exists in both tables with exactly its placeholders', () => {
  const ph = (str) => [...String(str).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const scene of logic.SCENE_IDS) for (const who of logic.USER_IDS) for (const want of logic.WANTS) for (const mask of logic.MASKS) {
    const p = P({ scene, who, want, mask });
    for (let n = 0; n <= steps(p); n++) {
      const c = logic.captionOf(at(p, n));
      for (const lang of ['hr', 'en']) {
        assert.ok(strings[lang][c.key], `${lang}.${c.key}`);
        assert.deepEqual(ph(strings[lang][c.key]), Object.keys(c.vars).sort(), `${lang}.${c.key}`);
        for (const v of Object.values(c.vars)) if (typeof v === 'object') assert.ok(strings[lang][v.t], `${lang}.${v.t}`);
      }
    }
  }
});

// ── presets (SPEC.md table) ──

function presetsOfPage() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const block = html.match(/presets:\s*\[([\s\S]*?)\n\s*\],/)[1];
  return [...block.matchAll(/id: '([\w-]+)'[^}]*params: (\{[^}]*\})/g)].map((m) => ({
    id: m[1], params: Function('return ' + m[2])()
  }));
}

test('presets: path, verdict and step count as in SPEC.md', () => {
  const want = {
    'projekt-other': ['denied', 5, 'other'],
    'owner-locked': ['denied', 3, 'owner'],
    'named-user': ['granted', 5, 'users'],
    'mask-clips': ['denied', 5, 'groups'],
    root: ['granted', 3, 'privilege']
  };
  const presets = presetsOfPage();
  assert.deepEqual(presets.map((p) => p.id), Object.keys(want));
  for (const pr of presets) {
    const p = P(pr.params);
    const e = end(p);
    assert.deepEqual([e.verdict, steps(p), e.reason], want[pr.id], pr.id);
  }
  assert.equal(end(P({ scene: 'projekt', who: 'ana' })).verdict, 'granted', 'preset 1 with ana');
  assert.equal(end(P({ scene: 'druga', who: 'marko', want: 'w' })).verdict, 'granted', 'preset 4 with w');
  assert.equal(end(P({ scene: 'tajna', who: 'root', want: 'x' })).verdict, 'denied', 'preset 5 with x');
});

test('steps: 3 to 6 for every combination; sim.json and the page give the defaults\' 5', () => {
  let max = 0;
  for (const scene of logic.SCENE_IDS) for (const who of logic.USER_IDS) for (const want of logic.WANTS) for (const mask of logic.MASKS) {
    const n = steps(P({ scene, who, want, mask }));
    assert.ok(n >= 3 && n <= 6, `${scene} ${who} ${want} ${mask}: ${n}`);
    max = Math.max(max, n);
  }
  assert.equal(max, 6);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, steps(P({})));
  assert.equal(json.steps, 5);
});

// ── the real run (SPEC.md, Sources): 2026-10-30, kernel 6.8.0, access() and the real operation agreed ──
// [scene, mask, ls -l, verdicts for student ana marko nobody root, each r w x (1 granted)]
const RUN = [
  ['projekt', 'rw-', 'drwxrws---', '000 111 111 000 111'],
  ['plan', 'rw-', '----rw-rw-', '000 110 110 110 110'],
  ['tajna', 'rw-', '----------', '000 000 000 000 110'],
  ['proba', 'rwx', '-rwxrwx---+', '111 000 000 110 111'],
  ['druga', 'rwx', '-rw-rwx---+', '000 110 111 000 111'],
  ['proba', 'rw-', '-rwxrw----+', '111 000 000 110 111'],
  ['druga', 'rw-', '-rw-rw----+', '000 110 110 000 110'],
  ['proba', 'r--', '-rwxr-----+', '111 000 000 100 111'],
  ['druga', 'r--', '-rw-r-----+', '000 110 100 000 110'],
  ['proba', '---', '-rwx------+', '111 000 000 000 111'],
  ['druga', '---', '-rw-------+', '000 110 000 000 110']
];

test('the real run: all 165 cases equal the model', () => {
  let n = 0;
  for (const [scene, mask, ls, bits] of RUN) {
    assert.equal(logic.fileOf(P({ scene, mask })).ls, ls, `${scene} ${mask}`);
    const got = logic.USER_IDS.map((who) => logic.WANTS.map((want) => {
      n += 1;
      return end(P({ scene, mask, who, want })).verdict === 'granted' ? '1' : '0';
    }).join('')).join(' ');
    assert.equal(got, bits, `${scene} ${mask}`);
  }
  assert.equal(n, 165);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene, who: 'ana' });
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ scene: 'druga', who: 'marko', want: 'x' });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ scene: 'proba', who: 'nobody' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  // and the memoised frames are not shared with the caller
  at(p, 2).rows[0] = 'tampered';
  assert.notEqual(at(p, 2).rows[0], 'tampered');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, steps(P({})), 'meta.steps matches the model');
  const presets = presetsOfPage();
  assert.ok(presets.length > 0, 'found presets');
  for (const pr of presets) for (const [k, v] of Object.entries(pr.params)) {
    assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const okv = { scene: logic.SCENE_IDS, who: logic.USER_IDS, want: logic.WANTS, mask: logic.MASKS }[k];
    assert.ok(okv.includes(v), `${pr.id}: ${k}=${v}`);
  }
});
