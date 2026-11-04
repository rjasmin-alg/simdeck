// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ad-recycle-bin's model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
// numbers, a sweep of every param combination, and the template's generic block.
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
const stepsOf = (over) => logic.steps(P(over));
const end = (over) => at(over, stepsOf(over));
const tally = (s) => s.objects.reduce((m, o) => { m[o.state] = (m[o.state] || 0) + 1; return m; }, {});
const users = (s) => s.objects.filter((o) => o.kind === 'user');
const kinds = (over) => logic.plan(P(over)).map((e) => e.kind + (e.what ? '/' + e.what : ''));
/** The state after the step whose event is kind (first match). */
const after = (over, kind) => at(over, logic.plan(P(over)).findIndex((e) => e.kind + (e.what ? '/' + e.what : '') === kind) + 1);

// ── tie-breaks ──

test('rule 8 tie-break: users restored before their OU all fail with "parent", nothing changes; after the OU they restore', () => {
  const o = { recycleBin: 'before', usersFirst: true };
  assert.deepEqual(kinds(o), ['delete', 'restore/users', 'restore/ous', 'restore/users', 'outcome']);
  const s1 = at(o, 1), s2 = at(o, 2);
  assert.equal(s2.last.ok, 0);
  assert.equal(s2.last.failed, 65);
  assert.equal(s2.last.why, 'parent');
  assert.deepEqual(s2.objects, s1.objects, 'a failed restore changes no object');
  assert.equal(at(o, 3).last.ok, 2);
  const s4 = at(o, 4);
  assert.equal(s4.last.ok, 65);
  assert.equal(s4.last.failed, 0);
  assert.deepEqual(tally(s4), { live: 67 });
  // the same holds for reanimation (rule 5: the object goes back under its last known parent)
  const r = at({ usersFirst: true }, 2);
  assert.equal(r.last.method, 'reanimate');
  assert.equal(r.last.why, 'parent');
  assert.equal(r.last.failed, 65);
});

test('rule 8 tie-break: one user whose OU is live restores while the others still fail', () => {
  const s = at({ recycleBin: 'before' }, 1);
  s.objects.find((o) => o.id === 'OU-HQ').state = 'live';
  const plain = logic.step(s, 3, P({ recycleBin: 'before' }));   // step 3 of this plan: restore/users
  assert.equal(plain.last.what, 'users');
  assert.equal(plain.last.ok, 21, 'HQ users restore');
  assert.equal(plain.last.failed, 44, 'Brackenridge users fail');
  assert.equal(plain.last.why, 'parent');
});

test('rule 2 tie-break: a tombstone is still there on day 180 and gone on day 190', () => {
  const s180 = after({ daysSince: 180 }, 'wait');
  assert.deepEqual(tally(s180), { tombstone: 67 });
  assert.equal(s180.last.gone, 0);
  const s190 = after({ daysSince: 190 }, 'wait');
  assert.deepEqual(tally(s190), { gone: 67 });
  assert.equal(s190.last.gone, 67);
  assert.equal(logic.fateOn(logic.eff({}), 180), 'tombstone');
  assert.equal(logic.fateOn(logic.eff({}), 181), 'gone');
});

test('rule 4 tie-breaks: deleted object on day 180, recycled on 190 and 360, gone on 370', () => {
  const rb = (d) => tally(after({ recycleBin: 'before', daysSince: d }, 'wait'));
  assert.deepEqual(rb(180), { deleted: 67 });
  assert.deepEqual(rb(190), { recycled: 67 });
  assert.deepEqual(rb(360), { recycled: 67 });
  assert.deepEqual(rb(370), { gone: 67 });
});

test('rule 7 tie-break: a backup exactly 180 days old at the restore is used; 190 days is refused', () => {
  const ok = after({ recycleBin: 'after', daysSince: 100, backupAgeDays: 80 }, 'auth');
  assert.equal(ok.last.age, 180);
  assert.equal(ok.last.ok, 67);
  assert.deepEqual(tally(ok), { live: 67 });
  const old = after({ recycleBin: 'after', daysSince: 110, backupAgeDays: 80 }, 'auth');
  assert.equal(old.last.age, 190);
  assert.equal(old.last.ok, 0);
  assert.equal(old.last.why, 'too-old');
  assert.deepEqual(tally(old), { recycled: 67 });
});

// ── rules ──

test('rule 1: without the Recycle Bin a deleted object becomes a tombstone that keeps SID, GUID and name only', () => {
  const s = at({}, 1);
  assert.equal(s.last.kind, 'delete');
  assert.equal(s.last.users, 65);
  assert.equal(s.last.ous, 2);
  for (const o of s.objects) {
    assert.equal(o.state, 'tombstone');
    assert.deepEqual(o.keeps, { sid: true, guid: true, name: true, attrs: false, groups: false, password: false });
    assert.equal(o.deletedOn, 0);
    assert.equal(o.until, 180);
  }
});

test('rule 2: a tombstone lives tombstoneLifetime days; garbage collection removes it after (twice a day)', () => {
  const s = after({ daysSince: 200 }, 'wait');
  assert.equal(s.day, 200);
  assert.equal(s.last.gc, 400);
  for (const o of s.objects) {
    assert.equal(o.state, 'gone');
    assert.deepEqual(o.keeps, { sid: false, guid: false, name: false, attrs: false, groups: false, password: false });
  }
  const a = at({ daysSince: 200 }, 3);
  assert.equal(a.last.kind, 'attempt');
  assert.equal(a.last.why, 'gone');
});

test('rule 3: reanimation brings back SID, GUID and name; attributes, memberships and password stay lost', () => {
  const s = after({}, 'restore/users');
  assert.equal(s.last.method, 'reanimate');
  assert.equal(s.last.ok, 65);
  for (const o of users(s)) {
    assert.equal(o.state, 'live');
    assert.equal(o.by, 'reanimate');
    assert.deepEqual(o.keeps, { sid: true, guid: true, name: true, attrs: false, groups: false, password: false });
    assert.deepEqual(logic.verdict(o), { logon: 'reset', files: true, groups: false });
  }
});

test('rule 4: with the Recycle Bin a deleted object keeps everything, then is recycled (stripped) for tombstoneLifetime more', () => {
  const s = at({ recycleBin: 'before' }, 1);
  for (const o of s.objects) {
    assert.equal(o.state, 'deleted');
    assert.equal(o.until, 180);
    assert.ok(Object.values(o.keeps).every(Boolean));
  }
  const r = after({ recycleBin: 'before', daysSince: 200 }, 'wait');
  for (const o of r.objects) {
    assert.equal(o.state, 'recycled');
    assert.equal(o.until, 360);
    assert.deepEqual(o.keeps, { sid: true, guid: true, name: true, attrs: false, groups: false, password: false });
  }
  assert.equal(r.last.recycled, 67);
  // a recycled object is neither in the Recycle Bin nor reanimatable
  const opt = logic.options(r);
  assert.equal(opt.bin.ok, false);
  assert.equal(opt.reanimate.ok, false);
  assert.equal(opt.bin.why, 'recycled');
  assert.equal(at({ recycleBin: 'before', daysSince: 200 }, 3).last.why, 'recycled');
});

test('rule 5: restoring from the Recycle Bin brings the users back whole, OU first', () => {
  assert.deepEqual(kinds({ recycleBin: 'before' }), ['delete', 'restore/ous', 'restore/users', 'outcome']);
  const s = after({ recycleBin: 'before' }, 'restore/users');
  assert.equal(s.last.method, 'bin');
  for (const o of users(s)) {
    assert.equal(o.by, 'bin');
    assert.ok(Object.values(o.keeps).every(Boolean));
    assert.deepEqual(logic.verdict(o), { logon: 'yes', files: true, groups: true });
  }
});

test('rule 6: turning the Recycle Bin on after the deletion makes every tombstone a recycled object; nothing to restore', () => {
  const o = { recycleBin: 'after' };
  assert.deepEqual(kinds(o), ['delete', 'enable', 'attempt', 'outcome']);
  const s = after(o, 'enable');
  assert.equal(s.recycleBin, true);
  assert.equal(s.enabledOn, 0);
  assert.equal(s.last.recycled, 67);
  assert.deepEqual(tally(s), { recycled: 67 });
  for (const x of s.objects) assert.equal(x.until, 180, 'recycled objects keep the tombstone clock');
  const opt = logic.options(s);
  assert.equal(opt.reanimate.ok, false, 'no longer reanimatable');
  assert.equal(opt.reanimate.why, 'recycled');
  assert.equal(opt.bin.ok, false, 'not in the Recycle Bin either');
  const a = after(o, 'attempt');
  assert.equal(a.last.ok, 0);
  assert.equal(a.last.why, 'recycled');
  // and they still go at the tombstone's end
  assert.deepEqual(tally(after({ recycleBin: 'after', daysSince: 190 }, 'enable')), { gone: 67 });
  // an unknown value means off
  assert.deepEqual([logic.eff({ recycleBin: 'x' }).recycleBin, logic.eff({ recycleBin: 'x' }).enableAfter], [false, false]);
});

test('rule 7: an authoritative restore from a usable backup brings everything back as of the backup', () => {
  const o = { recycleBin: 'after', backupAgeDays: 80 };
  assert.deepEqual(kinds(o), ['delete', 'enable', 'attempt', 'auth', 'outcome']);
  const s = after(o, 'auth');
  assert.equal(s.last.age, 80);
  for (const x of s.objects) {
    assert.equal(x.state, 'live');
    assert.equal(x.by, 'auth');
    assert.equal(x.asOf, -80);
    assert.ok(Object.values(x.keeps).every(Boolean));
  }
  // no backup: no auth step at all; too old: refused
  assert.ok(!kinds({ recycleBin: 'after' }).includes('auth'));
  const late = after({ daysSince: 200, backupAgeDays: 80 }, 'auth');
  assert.equal(late.last.why, 'too-old');
  assert.equal(late.last.age, 280);
  assert.deepEqual(tally(late), { gone: 67 });
  // with the Recycle Bin the backup's life is the smaller lifetime (both 180 here)
  assert.equal(logic.backupUsable({ recycleBin: 'before', tsl: 180, dol: 120, day: 50, backup: { day: -80 } }).ok, false);
  assert.equal(logic.backupUsable({ recycleBin: false, tsl: 180, dol: 120, day: 50, backup: { day: -80 } }).ok, true);
  assert.equal(logic.backupUsable({ recycleBin: false, tsl: 180, dol: 180, day: 0, backup: null }).why, 'none');
});

test('rule 7: the online restore is tried first; the backup is only used when it fails', () => {
  assert.deepEqual(kinds({ daysSince: 100, backupAgeDays: 80 }), ['delete', 'wait', 'restore/ous', 'restore/users', 'outcome']);
  const s = after({ daysSince: 100, backupAgeDays: 80 }, 'wait');
  const opt = logic.options(s);
  assert.equal(opt.reanimate.ok, true);
  assert.equal(opt.auth.ok, true);
  assert.equal(opt.auth.age, 180);
  assert.equal(opt.bin.why, 'off');
});

test('rule 9: verdicts: nothing back means no logon, no files, no groups', () => {
  const s = end({ daysSince: 200 });
  for (const o of users(s)) assert.deepEqual(logic.verdict(o), { logon: 'no', files: false, groups: false });
  const live = at({}, 0);
  for (const o of users(live)) assert.deepEqual(logic.verdict(o), { logon: 'yes', files: true, groups: true });
});

test('restore panel: options before the deletion and after a full restore say "live"', () => {
  const s0 = at({}, 0);
  const o = logic.options(s0);
  assert.equal(o.reanimate.why, 'live');
  assert.equal(o.bin.why, 'live');
  assert.equal(o.auth.why, 'live');
  const rb = logic.options(at({ recycleBin: 'before' }, 1));
  assert.equal(rb.bin.ok, true);
  assert.equal(rb.bin.n, 67);
  assert.equal(rb.reanimate.why, 'bin-on');
});

// ── presets ──

const PRESETS = {
  'no-recycle-bin': {},
  'with-recycle-bin': { recycleBin: 'before' },
  'enable-after': { recycleBin: 'after' },
  'too-late': { daysSince: 200 },
  'wrong-order': { recycleBin: 'before', usersFirst: true }
};

test('presets: step counts and end states (SPEC.md "Presets")', () => {
  const want = {
    'no-recycle-bin': [4, { live: 67 }, 0],
    'with-recycle-bin': [4, { live: 67 }, 65],
    'enable-after': [4, { recycled: 67 }, 0],
    'too-late': [4, { gone: 67 }, 0],
    'wrong-order': [5, { live: 67 }, 65]
  };
  for (const [id, o] of Object.entries(PRESETS)) {
    const [n, t, pw] = want[id];
    assert.equal(stepsOf(o), n, id);
    const s = end(o);
    assert.deepEqual(tally(s), t, id);
    assert.equal(users(s).filter((u) => logic.verdict(u).logon === 'yes').length, pw, id);
  }
  assert.equal(logic.steps(logic.defaults), 4, 'sim.json steps');
});

test('presets in the page match the model and sim.json', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, logic.steps(logic.defaults));
  assert.equal(json.steps, meta.steps);
  for (const id of Object.keys(PRESETS)) assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});

// ── sweep ──

test('every param combination: 4–6 steps, a valid end, no object restored twice, users never live without their OU', () => {
  let max = 0, min = 99;
  for (const recycleBin of ['off', 'before', 'after']) for (const usersFirst of [false, true])
    for (const backupAgeDays of [0, 80]) for (let daysSince = 0; daysSince <= 400; daysSince += 10) {
      const o = { recycleBin, usersFirst, backupAgeDays, daysSince };
      const n = stepsOf(o);
      max = Math.max(max, n); min = Math.min(min, n);
      let s = logic.initial(P(o));
      for (let k = 1; k <= n; k++) {
        s = logic.step(s, k, P(o));
        for (const u of users(s)) {
          if (u.state === 'live') assert.equal(s.objects.find((x) => x.id === u.parent).state, 'live', JSON.stringify(o));
        }
      }
      assert.equal(s.last.kind, 'outcome');
      const t = tally(s);
      assert.equal(Object.keys(t).length, 1, 'all objects end in one state: ' + JSON.stringify(o));
    }
  assert.equal(min, 4);
  assert.equal(max, 6);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS)) for (let n = 0; n <= stepsOf(o); n++) {
    const s = at(o, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ recycleBin: 'before' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('lane: the projected life of an object, cut at its restore', () => {
  const u = (s) => s.objects.find((o) => o.kind === 'user');
  const simple = (segs) => segs.map((g) => [g.from, g.to, g.state]);
  assert.deepEqual(logic.lane(at({}, 0), u(at({}, 0)), 400), []);
  const t = at({}, 1);
  assert.deepEqual(simple(logic.lane(t, u(t), 400)), [[0, 180, 'tombstone'], [180, 400, 'gone']]);
  const b = at({ recycleBin: 'before' }, 1);
  assert.deepEqual(simple(logic.lane(b, u(b), 400)), [[0, 180, 'deleted'], [180, 360, 'recycled'], [360, 400, 'gone']]);
  const e = after({ recycleBin: 'after', daysSince: 50 }, 'enable');
  assert.deepEqual(simple(logic.lane(e, u(e), 400)), [[0, 50, 'tombstone'], [50, 180, 'recycled'], [180, 400, 'gone']]);
  const r = after({ daysSince: 100 }, 'restore/users');
  assert.deepEqual(simple(logic.lane(r, u(r), 400)), [[0, 100, 'tombstone'], [100, 400, 'live']]);
  assert.equal(logic.lane(r, u(r), 400)[1].by, 'reanimate');
});

// ── from the fresh review: gaps a mutation run found ──

test('plan and advance agree: before an attempt nothing is restorable; every restore but usersFirst\'s first fails nothing', () => {
  assert.deepEqual(kinds({ recycleBin: 'before', daysSince: 180 }), ['delete', 'wait', 'restore/ous', 'restore/users', 'outcome']);
  for (const recycleBin of ['off', 'before', 'after']) for (const usersFirst of [false, true])
    for (const backupAgeDays of [0, 80]) for (let daysSince = 0; daysSince <= 400; daysSince += 10) {
      const o = { recycleBin, usersFirst, backupAgeDays, daysSince };
      const plan = logic.plan(P(o));
      let firstRestore = true;
      plan.forEach((ev, i) => {
        const before = at(o, i), s = at(o, i + 1);
        if (ev.kind === 'attempt') {
          const t = tally(before);
          assert.ok(!t.deleted && !t.tombstone, 'attempt only when nothing is restorable: ' + JSON.stringify(o));
        }
        if (ev.kind === 'restore') {
          if (!(usersFirst && firstRestore)) assert.equal(s.last.failed, 0, JSON.stringify(o) + ' step ' + (i + 1));
          firstRestore = false;
          for (const x of s.objects) if (x.state === 'live') assert.equal(x.until, null);
        }
      });
    }
});

test('attempt: its method and the count of recycled objects; the delete event names its state', () => {
  assert.equal(at({ daysSince: 200 }, 3).last.method, 'reanimate');
  assert.equal(at({ recycleBin: 'after' }, 3).last.method, 'bin');
  assert.equal(at({ recycleBin: 'after' }, 3).last.recycled, 67);
  assert.equal(at({ recycleBin: 'before' }, 1).last.state, 'deleted');
  assert.equal(at({}, 1).last.state, 'tombstone');
});

test('verdicts on recycled users: nothing works; a late enable keeps the tombstone clock', () => {
  for (const u of users(end({ recycleBin: 'after' }))) assert.deepEqual(logic.verdict(u), { logon: 'no', files: false, groups: false });
  for (const x of after({ recycleBin: 'after', daysSince: 100 }, 'enable').objects) assert.equal(x.until, 180);
});

test('restore panel during a partial restore', () => {
  const b = logic.options(after({ recycleBin: 'before' }, 'restore/ous'));
  assert.equal(b.reanimate.why, 'bin-on');
  assert.equal(b.bin.n, 65);
  assert.equal(logic.options(after({}, 'restore/ous')).reanimate.n, 65);
});
