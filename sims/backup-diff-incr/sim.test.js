// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for backup-diff-incr's model (rules: SPEC.md). Run: node --test sims/backup-diff-incr/sim.test.js
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
const lane = (over, n, i) => (n == null ? end(over) : at(over, n)).lanes[i || 0];
const sizes = (l) => l.sets.map((s) => Object.keys(s.blocks).length);
const THU = ['A2', 'B2', 'C', 'D1', 'E1', 'F', 'G1', 'H'];

// ── tie-breaks first ──

test('tie-break (rule 7): a block written twice in one day is stored once, with its last content', () => {
  const w = logic.write(['A', 'B'], [0, 0], [0, 1, 0]);
  assert.deepEqual(w.disk, ['A2', 'B1']);
  assert.deepEqual(w.written, [0, 1]);
  assert.deepEqual(w.twice, [0]);
  // Thursday of the week writes block 0 twice: the set stores it once, as A2, in every mode
  for (const mode of logic.MODES) {
    const thu = lane({ mode }, 10).sets[4];
    assert.equal(thu.blocks[0], 'A2');
  }
  assert.deepEqual(at({}, 9).twice, [0]);
  assert.deepEqual(Object.keys(lane({}, 10).sets[4].blocks), ['0']);
});

test('tie-break (rule 5): newest wins; block 1 arrives twice and Wednesday\'s B2 stays', () => {
  const p = {};
  const afterMon = lane(p, 13).restore;               // step 12 Sun, 13 Mon
  assert.equal(afterMon.result[1], 'B1');
  assert.equal(afterMon.from[1], 1);
  const afterWed = lane(p, 15).restore;
  assert.equal(afterWed.result[1], 'B2');
  assert.equal(afterWed.from[1], 3);
  assert.deepEqual(afterWed.now, [1, 6]);
  // applied in the other order the result would be wrong: the order of the plan is oldest first
  assert.deepEqual(lane(p).restore.plan, [0, 1, 2, 3, 4]);
});

// ── rules ──

test('rule 1: the first night is a full backup of every block, in every mode; mode full stores all each night', () => {
  for (const mode of logic.MODES) {
    const sun = lane({ mode }, 2).sets[0];
    assert.equal(sun.kind, 'full');
    assert.deepEqual(sun.blocks, { 0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H' });
  }
  const full = lane({ mode: 'full' });
  assert.deepEqual(full.sets.map((s) => s.kind), ['full', 'full', 'full', 'full', 'full']);
  assert.deepEqual(sizes(full), [8, 8, 8, 8, 8]);
  assert.equal(full.stored, 40);
  assert.deepEqual(Object.values(full.sets[2].blocks), ['A', 'B1', 'C', 'D1', 'E1', 'F', 'G', 'H']);
});

test('rule 2: incremental stores what changed since the previous backup of any kind', () => {
  const l = lane({});
  assert.deepEqual(l.sets.map((s) => s.kind), ['full', 'incr', 'incr', 'incr', 'incr']);
  assert.deepEqual(l.sets.map((s) => Object.keys(s.blocks).map(Number)), [[0, 1, 2, 3, 4, 5, 6, 7], [1], [3, 4], [1, 6], [0]]);
  assert.deepEqual(sizes(l), [8, 1, 2, 2, 1]);
  assert.equal(l.stored, 14);
  // the content stored is the night's content
  assert.deepEqual(l.sets[3].blocks, { 1: 'B2', 6: 'G1' });
  // changed-since-last empties after each backup
  assert.deepEqual(at({}, 7).changed.sinceLast, [1, 6]);
  assert.deepEqual(at({}, 8).changed.sinceLast, []);
});

test('rule 3: differential stores what changed since the last full backup', () => {
  const l = lane({ mode: 'diff' });
  assert.deepEqual(l.sets.map((s) => s.kind), ['full', 'diff', 'diff', 'diff', 'diff']);
  assert.deepEqual(l.sets.map((s) => Object.keys(s.blocks).map(Number)), [[0, 1, 2, 3, 4, 5, 6, 7], [1], [1, 3, 4], [1, 3, 4, 6], [0, 1, 3, 4, 6]]);
  assert.deepEqual(sizes(l), [8, 1, 3, 4, 5]);
  assert.equal(l.stored, 21);
  assert.deepEqual(l.sets[4].blocks, { 0: 'A2', 1: 'B2', 3: 'D1', 4: 'E1', 6: 'G1' });
  // changed-since-full keeps growing after the nightly backups
  assert.deepEqual(at({ mode: 'diff' }, 8).changed.sinceFull, [1, 3, 4, 6]);
});

test('rule 4: what a restore needs; incremental the whole chain, differential the full and one set', () => {
  assert.deepEqual(logic.planFor('incr', 4), [0, 1, 2, 3, 4]);
  assert.deepEqual(logic.planFor('incr', 2), [0, 1, 2]);
  assert.deepEqual(logic.planFor('diff', 4), [0, 4]);
  assert.deepEqual(logic.planFor('diff', 1), [0, 1]);
  assert.deepEqual(logic.planFor('full', 3), [3]);
  const cases = [[{}, 5, 14], [{ mode: 'diff' }, 2, 13], [{ mode: 'full' }, 1, 8]];
  for (const [p, sets, read] of cases) {
    const r = lane(p).restore;
    assert.equal(r.applied, sets, JSON.stringify(p));
    assert.equal(r.read, read, JSON.stringify(p));
    assert.equal(r.ok, true);
    assert.equal(r.end, 'compare');
    assert.deepEqual(r.result, THU);
  }
  // an earlier target restores that day's disk
  for (const mode of logic.MODES) {
    for (let d = 1; d <= 4; d++) {
      const s = end({ mode, restoreDay: d });
      assert.deepEqual(s.lanes[0].restore.result, s.history[d], `${mode} ${d}`);
      assert.equal(s.lanes[0].restore.ok, true);
    }
  }
});

test('rule 6: a lost set stops an incremental restore at the day before; it never passes old blocks off as current', () => {
  const r = lane({ lose: 2 }).restore;
  assert.equal(r.ok, false);
  assert.equal(r.end, 'gap');
  assert.equal(r.applied, 2);                        // Sun, Mon
  assert.equal(r.read, 9);
  assert.equal(r.reached, 1);                        // the result is Monday's disk
  assert.equal(r.newest, 1);
  assert.deepEqual(r.result, at({}, 4).disk);        // Monday's disk at the end of Monday
  assert.deepEqual(r.wrong, [0, 1, 3, 4, 6]);        // not Thursday's
  // skipping the gap would bring blocks 3 and 4 back as Sunday's D and E
  const sets = lane({}).sets;
  const skip = Object.assign({}, sets[0].blocks, sets[1].blocks, sets[3].blocks, sets[4].blocks);
  assert.equal(skip[3], 'D');
  assert.equal(skip[4], 'E');
  // a loss after the target does not matter; a loss of Monday breaks Tuesday too
  assert.equal(lane({ lose: 3, restoreDay: 2 }).restore.ok, true);
  assert.equal(lane({ lose: 1, restoreDay: 2 }).restore.reached, 0);
  assert.equal(at({ lose: 2 }, 10).lost, null);      // the loss shows when the restore needs the set
  assert.equal(at({ lose: 2 }, 11).lost, 2);
});

test('rule 6: in differential and full mode only the lost day itself is unrestorable', () => {
  const r = lane({ mode: 'diff', lose: 2 }).restore;
  assert.equal(r.ok, true);
  assert.deepEqual(r.plan, [0, 4]);
  const same = lane({ mode: 'diff', lose: 2, restoreDay: 2 }).restore;
  assert.equal(same.ok, false);
  assert.equal(same.reached, 0);                     // stopped after Sunday's full
  assert.equal(same.newest, 1);                      // Monday was restorable (Sun + Mon)
  assert.deepEqual(same.wrong, [1, 3, 4]);
  const full = lane({ mode: 'full', lose: 3, restoreDay: 3 }).restore;
  assert.equal(full.ok, false);
  assert.equal(full.applied, 0);
  assert.equal(full.reached, null);
  assert.deepEqual(full.wrong, [0, 1, 2, 3, 4, 5, 6, 7]);   // nothing restored: every block differs
  assert.equal(full.newest, 2);
  assert.equal(lane({ mode: 'full', lose: 3 }).restore.ok, true);
  assert.equal(logic.newestRestorable('incr', 4, 3), 2);
  assert.equal(logic.newestRestorable('diff', 4, 3), 4);
  assert.equal(logic.newestRestorable('incr', 4, null), 4);
});

test('steps per preset: 17, 14, 13, 14, 17; compare runs both lanes and the shorter waits', () => {
  assert.equal(logic.steps(P({})), 17);
  assert.equal(logic.steps(P({ mode: 'diff' })), 14);
  assert.equal(logic.steps(P({ mode: 'full' })), 13);
  assert.equal(logic.steps(P({ lose: 2 })), 14);
  assert.equal(logic.steps(P({ compare: true })), 17);
  assert.equal(logic.steps(P({ mode: 'full', lose: 3, restoreDay: 3 })), 12);
  for (const mode of logic.MODES) for (let d = 1; d <= 4; d++) for (let lose = 0; lose <= 3; lose++) for (const compare of [false, true]) {
    assert.ok(logic.steps(P({ mode, restoreDay: d, lose, compare })) <= 20);
  }
  const s = end({ compare: true });
  assert.deepEqual(s.lanes.map((l) => l.mode), ['incr', 'diff']);
  assert.deepEqual(s.lanes.map((l) => l.stored), [14, 21]);
  assert.deepEqual(s.lanes.map((l) => [l.restore.applied, l.restore.read]), [[5, 14], [2, 13]]);
  // the differential lane finishes at step 14 and keeps its result while the incremental one goes on
  const d14 = at({ compare: true }, 14).lanes[1].restore;
  assert.equal(d14.step, 'compare');
  const d15 = at({ compare: true }, 15).lanes[1].restore;
  assert.equal(d15.step, null);
  assert.equal(d15.done, true);
  assert.deepEqual(d15.result, THU);
  // compare ignores mode
  assert.deepEqual(end({ compare: true, mode: 'full' }).lanes.map((l) => l.mode), ['incr', 'diff']);
});

test('phases: write and backup alternate per day, then target, then restore', () => {
  const ph = [];
  for (let n = 0; n <= 17; n++) ph.push(at({}, n).phase);
  assert.deepEqual(ph.slice(0, 12), ['start', 'write', 'backup', 'write', 'backup', 'write', 'backup', 'write', 'backup', 'write', 'backup', 'target']);
  assert.ok(ph.slice(12).every((x) => x === 'restore'));
  assert.deepEqual(at({}, 3).written, [1]);
  assert.deepEqual(at({}, 4).written, []);
  assert.deepEqual(at({}, 10).history.length, 5);
});

test('params: unknown values fall back to the defaults', () => {
  assert.deepEqual(logic.norm({ mode: 'x', restoreDay: 9, lose: 4 }), { modes: ['incr'], target: 4, lost: null });
  assert.deepEqual(logic.norm({ mode: 'full', restoreDay: '2', lose: '3' }), { modes: ['full'], target: 2, lost: 3 });
});

// ── lnx-send-receive presets (repl): replication from snapshot pairs ──

const R = (repl, force) => ({ repl, force: !!force });
const MON = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const TUE = ['A', 'B', 'C', 'D1', 'E1', 'F', 'G', 'H'];
const WED = ['A', 'B', 'C', 'D1', 'E1', 'F', 'G1', 'H'];
const side = (days) => ({ live: null, snaps: days.map(([day, blocks]) => ({ day, ro: true, blocks })), modified: false });

test('send tie-break (rule 5): of several common snapshots the newest is the parent', () => {
  assert.equal(logic.commonParent(side([[0, MON], [1, TUE]]), side([[0, MON], [1, TUE]])), 1);
  assert.equal(logic.commonParent(side([[0, MON], [1, TUE], [2, WED]]), side([[0, MON], [1, TUE]])), 1);
  assert.equal(logic.commonParent(side([[1, TUE]]), side([[0, MON]])), null);
  // send-chain, Wednesday: @mon and @tue are on both sides; the stream goes from @tue
  const before = at(R('chain'), 2);
  assert.deepEqual(logic.commonSnaps(before.src, before.tgt), [0, 1]);
  const wed = at(R('chain'), 3).stream;
  assert.equal(wed.parent, 1);
  assert.deepEqual(wed.carried, [6]);
  // common-kept: after @mon is deleted on the source, @tue is the only common one and still the parent
  const s = at(R('common'), 3);
  assert.deepEqual(logic.commonSnaps(s.src, s.tgt), [1]);
  assert.equal(at(R('common'), 4).stream.parent, 1);
});

test('send rule 1: an incremental stream carries only the blocks that differ between parent and child', () => {
  const carried = [1, 2, 3].map((n) => at(R('chain'), n).stream);
  assert.deepEqual(carried.map((x) => x.kind), ['full', 'incr', 'incr']);
  assert.deepEqual(carried.map((x) => x.carried.length), [8, 2, 1]);
  assert.deepEqual(carried[1].carried, [3, 4]);
  assert.deepEqual(carried[1].blocks, { 3: 'D1', 4: 'E1' });
  // from @mon straight to @wed: the difference, not the sum of the days
  const src = at(R('chain'), 3).src;
  assert.deepEqual(logic.makeStream(src, 2, 0).carried, [3, 4, 6]);
  assert.deepEqual(logic.makeStream(src, 2, null).carried, [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('send rule 2: only a read-only snapshot can be sent, and an incremental one needs its parent on the source', () => {
  const src = side([[0, MON], [1, TUE]]);
  src.snaps[1].ro = false;
  assert.equal(logic.makeStream(src, 1, 0).refused, 'not-snapshot');
  assert.equal(logic.makeStream(src, 2, 0).refused, 'not-snapshot');      // no such snapshot
  assert.equal(logic.makeStream(side([[1, TUE]]), 1, 0).refused, 'no-source-parent');
  for (const id of logic.REPL_IDS) assert.ok(end(R(id)).src.snaps.every((x) => x.ro === true), id);
});

test('send rule 3: the receive is refused without the parent on the target; a full send works instead', () => {
  const del = at(R('missing'), 2);
  assert.deepEqual(del.deleted, { side: 'tgt', day: 0 });
  assert.deepEqual(del.tgt.snaps, []);
  const s = at(R('missing'), 3);
  assert.equal(s.stream.kind, 'incr');
  assert.equal(s.stream.parent, 0);
  assert.equal(s.check, 'no-parent');
  assert.deepEqual(s.tgt, del.tgt);                    // refused: the target is unchanged
  const full = at(R('missing'), 4);
  assert.equal(full.check, null);
  assert.equal(full.stream.kind, 'full');
  assert.equal(full.stream.carried.length, 8);
  assert.deepEqual(full.tgt.snaps.map((x) => x.day), [1]);
  assert.deepEqual(full.tgt.snaps[0].blocks, TUE);
});

test('send rule 3: a target written after its newest snapshot refuses the receive, unless forced to roll back', () => {
  const t2 = at(R('touched'), 2);
  assert.equal(t2.tgt.modified, true);
  assert.equal(t2.tgt.live[logic.TOUCH], 'F*');
  const no = end(R('touched'));
  assert.equal(no.check, 'modified');
  assert.deepEqual(no.tgt, t2.tgt);                    // nothing applied, the write is still there
  assert.deepEqual(no.lostWrites, []);
  const yes = end(R('touched', true));
  assert.equal(yes.check, null);
  assert.deepEqual(yes.lostWrites, [logic.TOUCH]);    // the rollback threw the write away
  assert.deepEqual(yes.tgt.live, TUE);
  assert.equal(yes.tgt.modified, false);
  assert.deepEqual(yes.tgt.snaps.map((x) => x.day), [0, 1]);
  // force changes nothing where the target was not written to
  assert.deepEqual(end(R('chain', true)), end(R('chain')));
  // a full stream needs no parent
  assert.equal(logic.receiveCheck(side([]), { kind: 'full', refused: null }, false), null);
});

test('send rule 4: a received snapshot is a whole filesystem; restoring Wednesday reads @wed alone', () => {
  const s = end(R('chain'));
  assert.deepEqual(s.tgt.snaps.map((x) => x.blocks), [MON, TUE, WED]);
  s.tgt.snaps.forEach((x) => assert.deepEqual(x.blocks, logic.snapOf(s.src, x.day).blocks));
  assert.deepEqual(s.restore, { day: 2, from: [2], read: 8, result: WED, ok: true });
  // the snapshots share their unchanged blocks: the target stores 8 + 2 + 1
  assert.equal(logic.storedOn(s.tgt), 11);
  assert.equal(logic.refsOf(s.tgt, 0, 'A'), 3);
  assert.equal(logic.refsOf(s.tgt, 6, 'G1'), 1);
  // deleting an older snapshot does not break a later one, on either side
  const c = at(R('common'), 3);
  assert.deepEqual(c.src.snaps.map((x) => [x.day, x.blocks]), [[1, TUE]]);
  assert.equal(logic.storedOn(c.src), 8);              // Monday's D and E are freed
  const r = logic.receive(c.tgt, logic.makeStream(Object.assign({}, c.src, { snaps: c.src.snaps.concat([{ day: 2, ro: true, blocks: WED }]) }), 2, 1)).tgt;
  r.snaps = r.snaps.filter((x) => x.day !== 0);
  assert.deepEqual(logic.snapOf(r, 2).blocks, WED);
  // common-kept ends with the same three snapshots on the target as send-chain
  assert.deepEqual(end(R('common')).tgt.snaps.map((x) => x.blocks), [MON, TUE, WED]);
});

test('send presets: steps 4, 4, 4, 3; the host scenes are unchanged', () => {
  assert.deepEqual(logic.REPL_IDS.map((id) => logic.steps(P(R(id)))), [4, 4, 4, 3]);
  assert.equal(logic.steps(P(R('touched', true))), 3);
  assert.deepEqual(logic.REPL_IDS.map((id) => [1, 2, 3, 4].map((n) => n <= logic.steps(P(R(id))) ? at(R(id), n).phase : '-')),
    [['send', 'send', 'send', 'restore'], ['send', 'del', 'send', 'resend'], ['send', 'send', 'del', 'send'], ['send', 'touch', 'send', '-']]);
  // repl off (or unknown) is the backup week; its states carry no send/receive field
  assert.equal(logic.steps(P({ repl: 'x' })), 17);
  const host = Object.keys(at({}, 0)).sort();
  assert.deepEqual(host, ['changed', 'day', 'disk', 'history', 'lanes', 'lost', 'phase', 'target', 'ver', 'written', 'twice'].sort());
  for (let n = 0; n <= 17; n++) assert.deepEqual(Object.keys(at({}, n)).sort(), host);
  assert.deepEqual(logic.normRepl({ repl: 'chain', force: 'true' }), { id: 'chain', force: true });
  assert.deepEqual(logic.normRepl({}), { id: null, force: false });
});

// ── generic checks every sim keeps ──

const ALL = [{}, { mode: 'diff' }, { mode: 'full' }, { lose: 2 }, { compare: true, lose: 1, restoreDay: 3 },
  R('chain'), R('missing'), R('common'), R('touched'), R('touched', true)];

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
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of [{ compare: true }, R('missing'), R('common'), R('touched', true)]) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
