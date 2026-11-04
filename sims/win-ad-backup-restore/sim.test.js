// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ad-backup-restore's model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
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
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps);
const blocksOf = (s, gen) => s.blocks.filter((b) => b.gen === gen);
const dc = (inv, usn) => ({ inv, usn, utd: {} });
const blk = (o) => Object.assign({ inv: 'a1f3', usn: 5100, ver: 2, day: 3 }, o);

// ── tie-breaks ──

test('rule 8 tie-break: the partner\'s entry equal to the USN is not a rollback; one block above is', () => {
  // writesAfterRevert = writesAfter: qm-dc01 is back at exactly 5600, qm-dc02's entry is 5600
  const eq = at({ mode: 'revert', writesAfter: 600, writesAfterRevert: 600 }, 6);
  assert.equal(eq.last.detected, false);
  assert.equal(eq.health, 'ok');
  assert.equal(eq.last.sent.length, 0, 'nothing above the HWM 5600');
  assert.deepEqual(eq.last.left, [], 'the block at the HWM is not even offered');
  assert.deepEqual(eq.events, []);
  const below = at({ mode: 'revert', writesAfter: 600, writesAfterRevert: 500 }, 6);
  assert.equal(below.last.detected, true);
  assert.equal(logic.rolledBack({ utd: { a1f3: 5600 } }, dc('a1f3', 5600)), false);
  assert.equal(logic.rolledBack({ utd: { a1f3: 5600 } }, dc('a1f3', 5500)), true);
  // another invocationID is never a rollback
  assert.equal(logic.rolledBack({ utd: { a1f3: 5600 } }, dc('b82e', 5000)), false);
});

test('rule 6 tie-breaks: version first, then the later day, then the higher invocationID', () => {
  assert.equal(logic.beats(blk({ ver: 300001, day: 3 }), blk({ ver: 2, day: 9 })), true);
  assert.equal(logic.beats(blk({ ver: 2, day: 9 }), blk({ ver: 300001, day: 3 })), false);
  assert.equal(logic.beats(blk({ day: 4 }), blk({ day: 3, inv: 'zzzz' })), true);
  assert.equal(logic.beats(blk({ day: 3, inv: 'zzzz' }), blk({ day: 4 })), false);
  assert.equal(logic.beats(blk({ inv: 'b82e' }), blk({ inv: 'a1f3' })), true);
  assert.equal(logic.beats(blk({ inv: 'a1f3' }), blk({ inv: 'b82e' })), false);
});

test('rule 2 tie-break: a UTD entry equal to the block\'s USN covers it; own invocationID is own at any USN', () => {
  const dest = { inv: 'e52b', utd: { a1f3: 5600 } };
  assert.equal(logic.dampened(dest, blk({ usn: 5600 })), 'utd');
  assert.equal(logic.dampened(dest, blk({ usn: 5700 })), null);
  assert.equal(logic.dampened({ inv: 'a1f3', utd: {} }, blk({ usn: 9900 })), 'own');
  assert.equal(logic.dampened({ inv: 'b82e', utd: {} }, blk({ usn: 5100 })), null, 'no entry: not covered');
});

// ── rules ──

test('rule 1: writes take USNs in blocks of 100 under the current invocationID; the last 100 delete the OU', () => {
  const s = at({ writesAfter: 300 }, 2);
  assert.equal(s.dcs.DC01.usn, 5300);
  assert.deepEqual(s.blocks.map((b) => [b.inv, b.usn, b.col, b.ou]), [['a1f3', 5100, 0, null], ['a1f3', 5200, 1, null], ['a1f3', 5300, 2, 'del']]);
  assert.deepEqual(s.dcs.DC01.ou, { exists: false, ver: 2, by: 3, inv: 'a1f3', day: 3 });
  assert.equal(s.dcs.DC02.ou.exists, true, 'the partner has not pulled yet');
});

test('rule 2: a pull applies blocks under the destination\'s own USNs and takes over HWM, invocationID and vector', () => {
  const s = at({}, 3);
  const d2 = s.dcs.DC02;
  assert.equal(s.last.from, 5000);
  assert.equal(s.last.sent.length, 6);
  assert.equal(d2.usn, 8800);
  assert.deepEqual(Object.values(d2.held).map((h) => h.local), [8300, 8400, 8500, 8600, 8700, 8800]);
  assert.equal(d2.hwm.DC01, 5600);
  assert.equal(d2.knows.DC01, 'a1f3');
  assert.deepEqual(d2.utd, { a1f3: 5600 });
  assert.equal(d2.ou.exists, false);
  // after the restore the partner records the new invocationID, and the vector merge keeps the higher entry
  const s6 = at({ mode: 'nonauth' }, 6);
  assert.equal(s6.dcs.DC02.knows.DC01, 'b82e');
  assert.deepEqual(s6.dcs.DC02.utd, { a1f3: 5600, b82e: 5400 }, 'a1f3 stays at 5600, not the restored DC\'s 5000');
  assert.deepEqual(end({ mode: 'nonauth' }).dcs.DC02.utd, { a1f3: 5600, b82e: 5400 });
});

test('rule 3: a changed invocationID makes the partner pull from 0; the UTD still leaves out what it has', () => {
  const s = at({ mode: 'nonauth' }, 6);
  assert.equal(s.last.reset, true);
  assert.equal(s.last.hwm, 5600);
  assert.equal(s.last.from, 0);
  assert.equal(s.last.sent.length, 4);
  // same invocationID: no reset, the HWM counts
  const r = at({ mode: 'revert', writesAfterRevert: 1000 }, 6);
  assert.equal(r.last.reset, false);
  assert.equal(r.last.from, 5600);
});

test('rule 4: a non-authoritative restore gives the backup\'s state, a new invocationID and the retired entry', () => {
  const s = at({ mode: 'nonauth' }, 4);
  const d1 = s.dcs.DC01;
  assert.equal(d1.usn, 5000);
  assert.equal(d1.inv, 'b82e');
  assert.deepEqual(d1.utd, { e52b: 8200, a1f3: 5000 });
  assert.equal(d1.hwm.DC02, 8200);
  assert.deepEqual(d1.held, {});
  assert.equal(d1.ou.exists, true);
  assert.equal(d1.dsrm, true);
  assert.equal(s.shelf[0].kind, 'systemstate');
  // it pulls its own old changes back under the old invocationID, and the deletion with them
  const e = end({ mode: 'nonauth' });
  assert.equal(e.dcs.DC01.ou.exists, false);
  assert.equal(e.last.sent.filter((x) => x.outcome === 'applied').length, 6);
  assert.deepEqual(e.last.left.map((x) => x.why), ['own', 'own', 'own', 'own']);
  assert.equal(logic.reality(e).inStep, true);
});

test('rule 5: the authoritative restore raises the version by 100,000 per day and wins on every DC', () => {
  const s = at({ mode: 'auth' }, 5);
  assert.equal(s.last.days, 3);
  assert.equal(s.last.ver, 300001);
  assert.equal(s.dcs.DC01.usn, 5100);
  assert.equal(s.dcs.DC01.dsrm, true);
  const e = end({ mode: 'auth' });
  for (const d of logic.DCS) assert.deepEqual([e.dcs[d].ou.exists, e.dcs[d].ou.ver], [true, 300001]);
  const delBlock = e.blocks.find((b) => b.ou === 'del').id;
  assert.equal(logic.where(e, delBlock).dead, true, 'the deletion is overwritten everywhere');
  assert.equal(logic.reality(e).inStep, true);
  // without the authoritative step the deletion wins again
  assert.equal(end({ mode: 'nonauth' }).dcs.DC02.ou.exists, false);
});

test('rule 6: an incoming OU change that loses is dropped and leaves the held one live', () => {
  // auth: at step 7 the deletion is no longer live on qm-dc02, so it is not even offered
  const e = end({ mode: 'auth' });
  assert.equal(e.last.sent.length, 5);
  assert.ok(e.last.sent.every((x) => x.outcome === 'applied'));
  // the params never offer a losing OU change; build one: qm-dc02 still offers the deletion (v2) to qm-dc01 (v300001)
  const s6 = structuredClone(at({ mode: 'auth' }, 6));
  const del = s6.blocks.find((b) => b.ou === 'del').id;
  s6.dcs.DC02.held[del].live = true;
  const s7 = logic.step(s6, 7, P({ mode: 'auth' }));
  assert.deepEqual(s7.last.sent.find((x) => x.id === del), { id: del, outcome: 'lost' });
  assert.equal(s7.dcs.DC01.held[del], undefined, 'not stored');
  assert.deepEqual([s7.dcs.DC01.ou.exists, s7.dcs.DC01.ou.ver], [true, 300001]);
  assert.equal(s7.dcs.DC01.usn, 5600, 'only the 500 others took USNs');
});

test('rule 7: a plain revert keeps the invocationID and reuses USNs the partner has seen', () => {
  const s = at({ mode: 'revert' }, 5);
  assert.equal(s.dcs.DC01.inv, 'a1f3');
  assert.deepEqual(s.dcs.DC01.utd, { e52b: 8200 });
  assert.deepEqual(blocksOf(s, 2).map((b) => [b.inv, b.usn]), [['a1f3', 5100], ['a1f3', 5200], ['a1f3', 5300], ['a1f3', 5400]]);
  assert.deepEqual(blocksOf(s, 1).slice(0, 4).map((b) => [b.inv, b.usn]), blocksOf(s, 2).map((b) => [b.inv, b.usn]), 'same numbers, other changes');
  for (const b of blocksOf(s, 2)) assert.equal(logic.never(s, b.id), true);
  assert.equal(s.shelf[0].kind, 'vm-snapshot');
  assert.equal(at({ mode: 'revert' }, 4).dcs.DC01.dsrm, false, 'a revert is no DSRM boot');
});

test('DSRM: on during the restore (and the authoritative mark), off once the DC is back at work', () => {
  assert.equal(at({ mode: 'nonauth' }, 4).dcs.DC01.dsrm, true);
  assert.equal(at({ mode: 'nonauth' }, 5).dcs.DC01.dsrm, false);
  assert.equal(at({ mode: 'auth' }, 5).dcs.DC01.dsrm, true);
  assert.equal(at({ mode: 'auth' }, 6).dcs.DC01.dsrm, false);
  assert.equal(at({ mode: 'revert', vmGenId: true }, 4).dcs.DC01.dsrm, false);
});

test('rule 8: detection logs 2095 on the source, pauses Netlogon and refuses replication both ways', () => {
  const s = at({ mode: 'revert' }, 6);
  assert.equal(s.last.detected, true);
  assert.equal(s.last.utdSeen, 5600);
  assert.deepEqual(s.events, [{ dc: 'DC01', code: 2095, day: 3 }]);
  assert.equal(s.dcs.DC01.netlogon, 'paused');
  assert.equal(s.dcs.DC01.writable, false);
  assert.equal(s.health, 'error');
  assert.equal(s.dcs.DC02.usn, 8800, 'nothing applied');
  const e = end({ mode: 'revert' });
  assert.equal(e.last.refused, 'DC01');
  assert.equal(e.dcs.DC01.usn, 5400);
  assert.deepEqual(logic.reality(e), { only1: 400, only2: 600, never1: 400, never2: 600, ouSame: false, inStep: false });
});

test('rule 8: past the partner\'s entry nothing is detected and the divergence is silent and permanent', () => {
  const s6 = at({ mode: 'revert', writesAfterRevert: 1000 }, 6);
  assert.equal(s6.last.detected, false);
  assert.deepEqual(s6.last.sent.map((x) => s6.blocks[x.id - 1].usn), [5700, 5800, 5900, 6000]);
  const e = end({ mode: 'revert', writesAfterRevert: 1000 });
  assert.equal(e.health, 'ok');
  assert.equal(e.last.sent.length, 0);
  assert.equal(e.last.left.length, 10);
  assert.ok(e.last.left.every((x) => x.why === 'own'));
  assert.deepEqual(logic.reality(e), { only1: 600, only2: 600, never1: 600, never2: 600, ouSame: false, inStep: false });
  assert.deepEqual([e.dcs.DC01.ou.exists, e.dcs.DC02.ou.exists], [true, false]);
});

test('rule 9: with VM-Generation ID the revert behaves like a non-authoritative restore', () => {
  const g = at({ mode: 'revert', vmGenId: true }, 4);
  assert.equal(g.dcs.DC01.inv, 'b82e');
  assert.deepEqual(g.dcs.DC01.utd, { e52b: 8200, a1f3: 5000 });
  assert.equal(g.last.fresh, true);
  const strip = (s) => ({ d1: [s.dcs.DC01.usn, s.dcs.DC01.ou], d2: [s.dcs.DC02.usn, s.dcs.DC02.ou, s.dcs.DC02.utd], health: s.health });
  assert.deepEqual(strip(end({ mode: 'revert', vmGenId: true })), strip(end({ mode: 'nonauth' })));
  // the toggle means nothing outside revert
  assert.equal(at({ mode: 'nonauth', vmGenId: true }, 4).last.genId, false);
});

test('never(): blocks on one DC only that cannot arrive any more', () => {
  const s = at({ mode: 'nonauth' }, 5);
  for (const b of s.blocks) assert.equal(logic.never(s, b.id), false, 'everything can still arrive after a restore');
  // a plain revert: qm-dc01 counts its lost changes as its own at any USN, so they never come back
  const r = at({ mode: 'revert' }, 4);
  assert.ok(blocksOf(r, 1).every((b) => logic.never(r, b.id)));
  // boundaries: qm-dc02's UTD equal to the block's USN covers it
  const eq = at({ mode: 'revert', writesAfter: 600, writesAfterRevert: 600 }, 5);
  assert.equal(logic.never(eq, blocksOf(eq, 2).find((b) => b.usn === 5600).id), true);
  const one = at({ mode: 'revert', writesAfter: 100, writesAfterRevert: 100 }, 5);
  assert.equal(logic.never(one, blocksOf(one, 1)[0].id), true);
  assert.equal(logic.never(one, blocksOf(one, 2)[0].id), true);
  // partly: 200 after a revert past 100, the second 100 still arrive
  const part = at({ mode: 'revert', writesAfter: 100, writesAfterRevert: 200 }, 5);
  assert.deepEqual(blocksOf(part, 2).map((b) => logic.never(part, b.id)), [true, false]);
  assert.deepEqual([logic.reality(part).only1, logic.reality(part).never1], [200, 100]);
});

test('params are clamped and snapped to 100', () => {
  assert.deepEqual(logic.eff({ mode: 'x', writesAfter: 0, writesAfterRevert: 1234 }), { mode: 'nonauth', vmGenId: false, writesAfter: 100, writesAfterRevert: 1000 });
  assert.deepEqual(logic.eff({ mode: 'revert', vmGenId: 1, writesAfter: 449, writesAfterRevert: -5 }), { mode: 'revert', vmGenId: true, writesAfter: 400, writesAfterRevert: 0 });
  assert.equal(at({ writesAfterRevert: 0 }, 5).dcs.DC01.usn, 5000);
});

// ── presets ──

const PRESETS = {
  'non-authoritative': { mode: 'nonauth', vmGenId: false, writesAfter: 600, writesAfterRevert: 400 },
  authoritative: { mode: 'auth', vmGenId: false, writesAfter: 600, writesAfterRevert: 400 },
  'usn-rollback': { mode: 'revert', vmGenId: false, writesAfter: 600, writesAfterRevert: 400 },
  'vm-genid': { mode: 'revert', vmGenId: true, writesAfter: 600, writesAfterRevert: 400 },
  'silent-rollback': { mode: 'revert', vmGenId: false, writesAfter: 600, writesAfterRevert: 1000 }
};

test('presets: the numbers in SPEC.md', () => {
  const usns = (o) => [...Array(8).keys()].map((n) => { const s = at(o, n); return [s.dcs.DC01.usn, s.dcs.DC02.usn]; });
  assert.deepEqual(usns(PRESETS['non-authoritative']),
    [[5000, 8200], [5000, 8200], [5600, 8200], [5600, 8800], [5000, 8800], [5400, 8800], [5400, 9200], [6000, 9200]]);
  assert.deepEqual(usns(PRESETS.authoritative),
    [[5000, 8200], [5000, 8200], [5600, 8200], [5600, 8800], [5000, 8800], [5100, 8800], [5100, 8900], [5600, 8900]]);
  assert.deepEqual(usns(PRESETS['usn-rollback']),
    [[5000, 8200], [5000, 8200], [5600, 8200], [5600, 8800], [5000, 8800], [5400, 8800], [5400, 8800], [5400, 8800]]);
  assert.deepEqual(usns(PRESETS['vm-genid']), usns(PRESETS['non-authoritative']));
  assert.deepEqual(usns(PRESETS['silent-rollback']),
    [[5000, 8200], [5000, 8200], [5600, 8200], [5600, 8800], [5000, 8800], [6000, 8800], [6000, 9200], [6000, 9200]]);
  const fin = (k) => { const e = end(PRESETS[k]); return [e.health, logic.reality(e).inStep, e.dcs.DC01.ou.exists, e.dcs.DC02.ou.exists]; };
  assert.deepEqual(fin('non-authoritative'), ['ok', true, false, false]);
  assert.deepEqual(fin('authoritative'), ['ok', true, true, true]);
  assert.deepEqual(fin('usn-rollback'), ['error', false, true, false]);
  assert.deepEqual(fin('vm-genid'), ['ok', true, false, false]);
  assert.deepEqual(fin('silent-rollback'), ['ok', false, true, false]);
});

test('the page lists exactly these presets, in this order, with these params', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)', label:/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS));
  for (const [id, params] of Object.entries(PRESETS)) {
    const m = html.match(new RegExp(`id: '${id}'[^\\n]*params: (\\{[^}]*\\})`));
    assert.ok(m, id);
    assert.deepEqual(Function(`return ${m[1]}`)(), params, id);
  }
});

test('every combination of params stays valid: 7 steps, USNs within the strip, one restore', () => {
  for (const mode of ['nonauth', 'auth', 'revert']) {
    for (const vmGenId of [false, true]) {
      for (let a = 100; a <= 1000; a += 100) {
        for (let b = 0; b <= 1000; b += 100) {
          const p = { mode, vmGenId, writesAfter: a, writesAfterRevert: b };
          const e = end(p);
          assert.equal(kit.stepsOf(logic, P(p)), 7);
          for (const blk of e.blocks) assert.ok(blk.col >= 0 && blk.col < logic.COLS, JSON.stringify(p));
          assert.equal(e.shelf.length, 1);
          if (mode !== 'revert' || vmGenId) assert.equal(logic.reality(e).inStep, true, JSON.stringify(p));
        }
      }
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS)) {
    for (let n = 0; n <= logic.steps; n++) {
      const s = at(o, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ mode: 'auth' });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps; n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
