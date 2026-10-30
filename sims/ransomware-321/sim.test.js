// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ransomware-321's model (SPEC.md). Run: node --test sims/ransomware-321/
// Tie-breaks first, then one test per rule, then the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const H = 60, D = 1440;
const SUN22 = -2 * H, SAT22 = -D - 2 * H, FRI22 = -2 * D - 2 * H;
const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const run = (over) => at(over, logic.steps(P(over)));
const copy = (s, id) => logic.copyOf(s, id);
const st = (s, id) => logic.statusOf(copy(s, id));
const hit = (s, id) => s.last.hits.find((x) => x.id === id);

const PRESETS = {
  'estate': {},
  '321-online': { design: '321-online' },
  'immutable': { design: 'immutable' },
  'offline-tape': { design: 'offline-tape' },
  'mfa': { mfaOnVpn: true }
};

// ── tie-breaks ──

test('tie-break: equal newest clean versions: the copy on site wins over the one off site', () => {
  const s = run({ design: '321-online', credOnServer: false });
  assert.deepEqual(s.survivors, ['repo', 'cloud']);
  assert.equal(logic.newestClean(copy(s, 'repo')).t, logic.newestClean(copy(s, 'cloud')).t);
  assert.equal(s.best, 'repo');
  assert.equal(s.last.tie, 'cloud', 'the page names the copy it passed over');
});

test('tie-break: it holds whatever the card order, and only on equal times', () => {
  const s = run({ design: '321-online', credOnServer: false });
  const swapped = structuredClone(s);
  swapped.copies.reverse();
  assert.equal(logic.count(swapped).best, 'repo', 'off-site first in the list: on site still wins');
  copy(swapped, 'cloud').versions.push({ t: SUN22 + 1, clean: true });
  const k = logic.count(swapped);
  assert.equal(k.best, 'cloud', 'a newer clean version beats being on site');
  assert.equal(k.tie, null);
});

test('tie-break: a newer clean version wins over an older one on site (tape vs repository)', () => {
  const s = run({ design: 'offline-tape', credOnServer: false });
  assert.deepEqual(s.survivors, ['repo', 'tape']);
  assert.equal(s.best, 'repo');
  assert.equal(s.last.tie, null);
  assert.equal(s.rpoMinutes, logic.ATTACK - SUN22);
});

// ── rule 1: a copy reached with the same credential is one copy ──

test('rule 1: with the backup password saved on the server, every copy written as Domain Admin is "same credential"', () => {
  const s = logic.initial(P({ design: '321-online' }));
  for (const id of ['src', 'vss', 'mirror', 'usb', 'repo', 'cloud']) assert.equal(copy(s, id).reach, 'sameCred', id);
  const off = logic.initial(P({ design: '321-online', credOnServer: false }));
  for (const id of ['mirror', 'repo', 'cloud']) assert.equal(copy(off, id).reach, 'otherCred', id);
  for (const id of ['src', 'vss', 'usb']) assert.equal(copy(off, id).reach, 'sameCred', id);
});

test('rule 1: the saved password makes the attacker a Domain Admin; without it the escalation stops at local admin', () => {
  assert.deepEqual(at({}, 3).attacker.creds, ['user', 'localAdmin', 'domainAdmin']);
  assert.deepEqual(at({ credOnServer: false }, 3).attacker.creds, ['user', 'localAdmin']);
});

test('rule 1: what the attacker reaches with the same credential falls; what needs another credential survives', () => {
  const same = run({ design: '321-online' });
  for (const id of ['repo', 'cloud']) assert.equal(st(same, id), 'deleted', id);
  const other = run({ design: '321-online', credOnServer: false });
  for (const id of ['repo', 'cloud']) assert.equal(st(other, id), 'clean', id);
  assert.equal(hit(at({ design: '321-online', credOnServer: false }, 8), 'repo').effect, 'unreachable');
});

// ── rule 2: a mirror replicates encryption on its next run ──

test('rule 2: out of the attacker\'s reach, the mirror is clean until 22:00, then copies the encrypted files', () => {
  const p = { credOnServer: false };
  assert.equal(hit(at(p, 5), 'mirror').effect, 'unreachable');
  assert.equal(st(at(p, 8), 'mirror'), 'clean');
  const s9 = at(p, 9);
  assert.equal(s9.clock, logic.JOBS);
  assert.equal(st(s9, 'mirror'), 'encrypted');
  assert.deepEqual(copy(s9, 'mirror').versions, [{ t: logic.JOBS, clean: false }], 'one copy, replaced: the old one is gone');
  assert.deepEqual(run(p).survivors, []);
});

test('rule 2: a versioned backup adds the encrypted version and keeps the old ones', () => {
  const s9 = at({ design: '321-online', credOnServer: false }, 9);
  const repo = copy(s9, 'repo');
  assert.deepEqual(repo.versions.map((v) => [v.t, v.clean]), [[FRI22, true], [SAT22, true], [SUN22, true], [logic.JOBS, false]]);
  assert.equal(logic.newestClean(repo).t, SUN22);
  assert.equal(hit(s9, 'repo').effect, 'added');
});

test('rule 2: with the mirror reachable it is encrypted directly at step 5', () => {
  const s5 = at({}, 5);
  assert.equal(hit(s5, 'mirror').effect, 'encrypted');
  assert.equal(st(s5, 'mirror'), 'encrypted');
  assert.equal(s5.attacker.at, 'mirror');
});

// ── rule 3: an attached disk is online ──

test('rule 3: the attached USB disk is encrypted by a local admin, with or without the Domain Admin credential', () => {
  for (const cred of [true, false]) {
    const s = at({ credOnServer: cred }, 6);
    assert.equal(copy(s, 'usb').online, true);
    assert.equal(hit(s, 'usb').effect, 'encrypted');
    assert.equal(st(s, 'usb'), 'encrypted');
    assert.deepEqual(copy(s, 'usb').versions, [{ t: -10 * D + 20 * H, clean: false }, { t: -3 * D + 20 * H, clean: false }],
      'both weekly backups on it are encrypted');
  }
});

test('rule 3: the USB disk does not tick "offline" on the checklist', () => {
  assert.equal(logic.initial(P({})).checklist.paper.offlineOrImmutable, 0);
});

// ── rule 4: on-volume snapshots are deleted by an admin of that machine ──

test('rule 4: a local admin deletes the shadow copies; they never survive a takeover of the host', () => {
  for (const cred of [true, false]) {
    const s = at({ design: '321-online', credOnServer: cred }, 7);
    assert.equal(hit(s, 'vss').effect, 'deleted');
    assert.equal(st(s, 'vss'), 'deleted');
  }
  const off = at({}, 7);
  assert.equal(hit(off, 'vss').effect, 'off', 'in the estate shadow copies are off: nothing to delete');
  assert.equal(st(off, 'vss'), 'off');
});

// ── rule 5: immutable until its retention date; offline out of reach ──

test('rule 5: the locked cloud copy refuses the delete, even from a Domain Admin', () => {
  const s8 = at({ design: 'immutable' }, 8);
  assert.equal(hit(s8, 'repo').effect, 'deleted');
  assert.equal(hit(s8, 'cloud').effect, 'locked');
  const cloud = copy(s8, 'cloud');
  assert.ok(cloud.versions.every((v) => !v.gone && v.clean));
  assert.equal(cloud.immutableUntil, FRI22 + 30 * D, 'the earliest lock ends 30 days after Friday 22:00');
});

test('rule 5: once a lock has ended, the version can be deleted', () => {
  const s = logic.initial(P({ design: 'immutable' }));
  const cloud = copy(s, 'cloud');
  assert.equal(logic.remove(cloud, FRI22 + 30 * D), 'locked', 'exactly at the end of the first lock: the newer two stay');
  assert.deepEqual(cloud.versions.map((v) => !!v.gone), [true, false, false]);
  assert.equal(logic.remove(cloud, SUN22 + 30 * D + 1), 'deleted');
  assert.equal(cloud.deleted, true);
});

test('rule 5: the offline tape is out of reach of every credential', () => {
  const s8 = at({ design: 'offline-tape' }, 8);
  assert.equal(hit(s8, 'tape').effect, 'offline');
  assert.equal(copy(s8, 'tape').reach, 'none');
  assert.equal(logic.canTouch(copy(s8, 'tape'), logic.CREDS), false);
  assert.equal(st(run({ design: 'offline-tape' }), 'tape'), 'clean');
});

test('rule 5: a delete that leaves one locked version is refused, and the lock end moves to that version', () => {
  const s = logic.initial(P({ design: 'immutable' }));
  const cloud = copy(s, 'cloud');
  assert.equal(logic.remove(cloud, SAT22 + 30 * D), 'locked');
  assert.deepEqual(cloud.versions.map((v) => !!v.gone), [true, true, false]);
  assert.equal(cloud.immutableUntil, SUN22 + 30 * D);
  assert.equal(cloud.deleted, false);
});

test('rule 2/5: the 22:00 jobs per design: which copies get a version, and which fail', () => {
  const imm = at({ design: 'immutable' }, 9);
  assert.deepEqual(imm.last.hits, [{ id: 'mirror', effect: 'replaced', clean: false }, { id: 'repo', effect: 'failed' }, { id: 'cloud', effect: 'failed' }]);
  assert.equal(copy(imm, 'cloud').versions.length, 3, 'no feed from a deleted repository');
  const off = at({ design: 'immutable', credOnServer: false }, 9);
  const last = copy(off, 'cloud').versions.at(-1);
  assert.deepEqual(last, { t: logic.JOBS, clean: false, lockedUntil: logic.JOBS + 30 * D }, 'the new version is locked too');
  for (const d of ['offline-tape', '321-online']) {
    const s8 = at({ design: d, credOnServer: false }, 8), s9 = at({ design: d, credOnServer: false }, 9);
    for (const id of ['usb', 'tape', 'vss', 'src']) assert.deepEqual(copy(s9, id), copy(s8, id), `${d}: ${id} untouched at 22:00`);
  }
});

// ── rule 6: the 3-2-1 checklist, and rule 1 overriding it ──

test('rule 6: 3-2-1 online is ticked on paper; one credential turns it into one copy', () => {
  const ck = logic.initial(P({ design: '321-online' })).checklist;
  assert.deepEqual(ck.paper, { copies: 5, media: 2, offsite: 1, offlineOrImmutable: 0 });
  assert.deepEqual(logic.ticks(ck.paper), { copies: true, media: true, offsite: true, offlineOrImmutable: false });
  assert.deepEqual(ck.real, { copies: 1, media: 1, offsite: 0, offlineOrImmutable: 0 });
});

test('rule 6: shadow copies are not a copy (same volume); an immutable or offline copy counts on its own', () => {
  assert.equal(logic.initial(P({})).checklist.paper.copies, 3, 'source, mirror, USB');
  for (const d of ['immutable', 'offline-tape']) {
    const ck = logic.initial(P({ design: d })).checklist;
    assert.deepEqual(ck.real, { copies: 2, media: 2, offsite: 1, offlineOrImmutable: 1 }, d);
  }
  const other = logic.initial(P({ design: '321-online', credOnServer: false })).checklist;
  assert.equal(other.real.copies, 4, 'source (with the USB disk) + mirror + repository + cloud');
});

// ── rule 7: data lost and the recovery point ──

test('rule 7: lost data runs from the newest clean surviving version to the attack at 02:10', () => {
  const imm = run({ design: 'immutable' });
  assert.equal(imm.best, 'cloud');
  assert.equal(imm.rpoMinutes, 4 * H + 10);
  const tape = run({ design: 'offline-tape' });
  assert.equal(tape.best, 'tape');
  assert.equal(tape.rpoMinutes, 2 * D + 4 * H + 10);
});

test('rule 7: no survivor is a total loss; an intact source loses nothing', () => {
  const est = run({});
  assert.equal(est.best, null);
  assert.equal(est.rpoMinutes, null);
  const mfa = run({ mfaOnVpn: true });
  assert.equal(mfa.best, 'src');
  assert.equal(mfa.rpoMinutes, 0);
  assert.equal(mfa.last.sourceIntact, true);
});

// ── params ──

test('mfaOnVpn: the logon fails at step 1 and the run ends at step 2 with nothing encrypted', () => {
  assert.equal(logic.steps(P({ mfaOnVpn: true })), 2);
  const s1 = at({ mfaOnVpn: true }, 1);
  assert.equal(s1.last.kind, 'blocked');
  assert.deepEqual(s1.attacker.creds, []);
  const s = run({ mfaOnVpn: true });
  assert.equal(s.done, true);
  assert.equal(s.last.kind, 'count');
  assert.ok(s.copies.every((c) => logic.statusOf(c) !== 'encrypted' && logic.statusOf(c) !== 'deleted'));
});

test('credOnServer off: only what a local admin reaches falls at once (source, USB, shadow copies)', () => {
  const s8 = at({ design: '321-online', credOnServer: false }, 8);
  for (const id of ['src', 'usb']) assert.equal(st(s8, id), 'encrypted', id);
  assert.equal(st(s8, 'vss'), 'deleted');
  for (const id of ['mirror', 'repo', 'cloud']) assert.equal(st(s8, id), 'clean', id);
});

test('an unknown design falls back to the estate', () => {
  assert.deepEqual(logic.initial({ design: 'nope' }).copies.map((c) => c.id), ['src', 'vss', 'mirror', 'usb']);
});

// ── presets: the task's expected numbers ──

test('presets: survivors, the copy to restore from and the data lost', () => {
  const want = {
    'estate': [[], null, null],
    '321-online': [[], null, null],
    'immutable': [['cloud'], 'cloud', 4 * H + 10],
    'offline-tape': [['tape'], 'tape', 2 * D + 4 * H + 10],
    'mfa': [['mirror', 'usb'], 'src', 0]
  };
  for (const [id, over] of Object.entries(PRESETS)) {
    const s = run(over);
    assert.deepEqual([s.survivors, s.best, s.rpoMinutes], want[id], id);
  }
});

test('presets: 11 steps each, 2 with MFA; the step kinds in order', () => {
  for (const [id, over] of Object.entries(PRESETS)) assert.equal(logic.steps(P(over)), id === 'mfa' ? 2 : 11, id);
  assert.deepEqual(run({}).log.map((e) => e.kind), ['logon', 'localAdmin', 'findCred', 'encryptSource', 'encryptMirror',
    'encryptUsb', 'deleteShadows', 'backups', 'jobs', 'discovery', 'count']);
  assert.deepEqual(run({ mfaOnVpn: true }).log.map((e) => e.kind), ['blocked', 'count']);
});

test('the attacker token: on the card acted on, back on the server when nothing is reached', () => {
  const where = (over) => run(over).log.map((e, i) => at(over, i + 1).attacker.at);
  assert.deepEqual(where({ design: 'immutable' }), ['src', 'src', 'src', 'src', 'mirror', 'usb', 'vss', 'repo', 'repo', 'repo', 'repo']);
  assert.deepEqual(where({ design: '321-online', credOnServer: false }), ['src', 'src', 'src', 'src', 'src', 'usb', 'vss', 'src', 'src', 'src', 'src']);
  const b = at({ mfaOnVpn: true }, 1);
  assert.equal(b.attacker.blocked, true);
  assert.equal(b.attacker.at, null);
  assert.equal(at({}, 1).attacker.blocked, false);
});

test('findCred reports what was found', () => {
  assert.equal(at({}, 3).last.found, true);
  assert.equal(at({ credOnServer: false }, 3).last.found, false);
});

test('MFA on an improved design: the shadow copies stay but are not counted; no tie is named', () => {
  const s = run({ design: '321-online', mfaOnVpn: true });
  assert.equal(st(s, 'vss'), 'clean');
  assert.deepEqual(s.survivors, ['mirror', 'usb', 'repo', 'cloud']);
  assert.equal(s.last.tie, null);
  assert.equal(s.last.t, logic.ATTACK, 'the count after a refused logon is at 02:10');
});

test('the copies start with the versions of the SPEC table', () => {
  const s = logic.initial(P({ design: '321-online' }));
  const times = (id) => copy(s, id).versions.map((v) => v.t);
  assert.deepEqual(times('src'), [logic.ATTACK]);
  assert.deepEqual(times('vss'), [-3 * D + 7 * H, -3 * D + 12 * H]);
  assert.deepEqual(times('mirror'), [SUN22]);
  assert.deepEqual(times('usb'), [-10 * D + 20 * H, -3 * D + 20 * H]);
  assert.deepEqual(times('repo'), [FRI22, SAT22, SUN22]);
  assert.deepEqual(times('cloud'), [FRI22, SAT22, SUN22]);
  const tape = logic.initial(P({ design: 'offline-tape' }));
  assert.deepEqual(copy(tape, 'tape').versions.map((v) => v.t), [-10 * D + 22 * H, FRI22]);
  for (const d of ['321-online', 'immutable', 'offline-tape']) assert.equal(copy(logic.initial(P({ design: d })), 'vss').off, false, d);
  assert.equal(copy(logic.initial(P({})), 'vss').off, true);
});

test('the clock: 02:10 logon, minutes apart until 02:40, jobs at 22:00, discovery Tuesday 07:50', () => {
  const log = run({}).log;
  assert.deepEqual(log.map((e) => e.t), [130, 132, 135, 140, 145, 150, 155, 160, 22 * H, D + 7 * H + 50, D + 7 * H + 50]);
  for (let i = 1; i < log.length; i++) assert.ok(log[i].t >= log[i - 1].t, 'the clock never runs back');
});

test('every combination of design and toggles ends done, with survivors exactly the copies (off the source volume) that hold a clean version', () => {
  for (const design of Object.keys(logic.DESIGNS)) for (const mfaOnVpn of [false, true]) for (const credOnServer of [false, true]) {
    const s = run({ design, mfaOnVpn, credOnServer });
    assert.ok(s.done);
    const clean = s.copies.filter((c) => !['src', 'vss'].includes(c.id) && logic.newestClean(c)).map((c) => c.id);
    assert.deepEqual(s.survivors, clean, JSON.stringify({ design, mfaOnVpn, credOnServer }));
    if (!credOnServer && !mfaOnVpn && design !== 'estate') assert.equal(s.best, 'repo', 'out of reach, the repository survives');
  }
});

test('steps after the end change nothing', () => {
  const p = P({});
  const s = at({}, logic.steps(p));
  assert.deepEqual(logic.step(s, 99, p), s);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ design: 'immutable' });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ design: 'offline-tape', credOnServer: false });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const before = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, before);
    s = next;
  }
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
  for (const m of html.matchAll(/design: '([^']+)'/g)) assert.ok(m[1] in logic.DESIGNS, `design ${m[1]}`);
});
