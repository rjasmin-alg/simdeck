// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-sysvol-dfsr's model (SPEC.md). Run: node --test sims/win-sysvol-dfsr/
// Rules first, tie-breaks first of all; then the presets' numbers; then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (over) => kit.stepsOf(logic, P(over));
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, steps(over));
const kinds = (over) => logic.plan(P(over)).map((e) => e.kind + '@' + e.t);
/** The state right after the first event of this kind. */
function after(over, kind, nth) {
  const plan = logic.plan(P(over));
  let k = -1;
  for (let i = 0, seen = 0; i < plan.length; i++) if (plan[i].kind === kind && seen++ === (nth || 0)) { k = i; break; }
  assert.ok(k >= 0, 'event ' + kind + ' in the plan');
  return at(over, k + 1);
}

const PRESETS = {
  normal: { wanCut: 'never', adDelay: 2, dfsrDelay: 4, refreshAt: 5, twoEditors: false },
  'half-arrived': { wanCut: 'afterAd', adDelay: 2, dfsrDelay: 4, refreshAt: 3, twoEditors: false },
  'files-first': { wanCut: 'never', adDelay: 4, dfsrDelay: 2, refreshAt: 3, twoEditors: false },
  'two-editors': { wanCut: 'never', adDelay: 2, dfsrDelay: 4, refreshAt: 5, twoEditors: true }
};

// ── tie-breaks ──

test('tie-break in one tick: edits (DC01 first), WAN back, AD, DFSR, cut, refresh', () => {
  // everything at tick 2: AD, DFSR, the cut after them, the refresh last
  assert.deepEqual(kinds({ wanCut: 'afterAd', adDelay: 2, dfsrDelay: 2, refreshAt: 2 }), ['edit@0', 'ad@2', 'dfsr@2', 'cut@2', 'refresh@2', 'restore@4']);
  // a held DFSR goes right after the WAN comes back, in the same tick; a refresh in that tick comes after both
  assert.deepEqual(kinds({ wanCut: 'afterAd', adDelay: 2, dfsrDelay: 3, refreshAt: 4 }), ['edit@0', 'ad@2', 'cut@2', 'restore@4', 'dfsr@4', 'refresh@4']);
  // two editors: DC01 before DC03 in tick 0, so DC03's save is the later one
  const two = logic.plan(P({ twoEditors: true }));
  assert.deepEqual(two.slice(0, 2).map((e) => e.dc), ['DC01', 'DC03']);
  const s = at({ twoEditors: true }, 2);
  assert.equal(s.dcs.DC01.gpt.seq, 1);
  assert.equal(s.dcs.DC03.gpt.seq, 2);
});

test('tie-break: AD and DFSR due in the same tick deliver AD first', () => {
  const p = { adDelay: 3, dfsrDelay: 3, refreshAt: 6 };
  assert.deepEqual(kinds(p), ['edit@0', 'ad@3', 'dfsr@3', 'refresh@6']);
  const s = after(p, 'ad');
  assert.equal(s.dcs.DC03.gpc.ver, 6);
  assert.equal(s.dcs.DC03.gpt.ver, 5, 'the GPT is still old between the two deliveries of one tick');
});

test('tie-break: a refresh in the tick of the last delivery sees it (no final refresh)', () => {
  assert.deepEqual(kinds({ adDelay: 2, dfsrDelay: 4, refreshAt: 4 }), ['edit@0', 'ad@2', 'dfsr@4', 'refresh@4']);
  assert.equal(end({ adDelay: 2, dfsrDelay: 4, refreshAt: 4 }).client.applied.content, 'm6a');
});

test('tie-break: DFSR keeps the later save; equal GPC versions resolve to the later save', () => {
  const s = end({ twoEditors: true });
  assert.equal(s.dcs.DC01.gpt.content, 'm6b');
  assert.equal(s.dcs.DC03.gpt.content, 'm6b');
  assert.equal(s.dcs.DC01.gpc.by, 'DC03');
  assert.equal(s.dcs.DC03.gpc.by, 'DC03');
});

// ── rules ──

test('rule 1 and 4: the GPC travels only by AD replication, the GPT only by DFSR', () => {
  const ad = after({}, 'ad');
  assert.equal(ad.dcs.DC03.gpc.ver, 6);
  assert.equal(ad.dcs.DC03.gpt.ver, 5);
  assert.equal(ad.inflight.ad.length, 0);
  assert.equal(ad.inflight.dfsr.length, 1);
  const df = after({ adDelay: 6, dfsrDelay: 1 }, 'dfsr');
  assert.equal(df.dcs.DC03.gpt.ver, 6);
  assert.equal(df.dcs.DC03.gpt.content, 'm6a');
  assert.equal(df.dcs.DC03.gpc.ver, 5);
});

test('rule 2: one save bumps both halves on that DC, together, and sends one of each', () => {
  const s = at({}, 1);
  assert.deepEqual(s.last, { kind: 'edit', dc: 'DC01', seq: 1, from: { gpc: 5, gpt: 5, content: 'm5' }, ver: 6, content: 'm6a' });
  assert.equal(s.dcs.DC01.gpc.ver, 6);
  assert.equal(s.dcs.DC01.gpt.ver, 6);
  assert.equal(s.dcs.DC03.gpc.ver, 5, 'the other DC is untouched');
  assert.equal(s.dcs.DC03.gpt.ver, 5);
  assert.deepEqual(s.inflight.ad.map((x) => [x.from, x.to, x.ver, x.due]), [['DC01', 'DC03', 6, 2]]);
  assert.deepEqual(s.inflight.dfsr.map((x) => [x.from, x.to, x.ver, x.content, x.due]), [['DC01', 'DC03', 6, 'm6a', 4]]);
  assert.deepEqual(s.changed, ['DC01.gpc', 'DC01.gpt']);
});

test('rule 3: versionNumber = user × 65536 + computer', () => {
  assert.equal(logic.versionNumber(5), 327681);
  assert.equal(logic.versionNumber(6), 393217);
  assert.equal(logic.versionNumber(6, 2) - logic.versionNumber(6, 1), 1, 'a computer-side save adds 1');
  assert.equal(logic.versionNumber(7) - logic.versionNumber(6), 65536, 'a user-side save adds 65536');
  assert.deepEqual(logic.splitVersion(393217), { user: 6, computer: 1 });
});

test('rule 4: a cut WAN holds both pipes; what arrived before the cut stays', () => {
  const p = PRESETS['half-arrived'];
  const cut = after(p, 'cut');
  assert.equal(cut.wan, 'down');
  assert.equal(cut.dcs.DC03.gpc.ver, 6, 'the GPC arrived before the cut');
  assert.equal(cut.dcs.DC03.gpt.ver, 5);
  assert.deepEqual(cut.inflight.dfsr.map((x) => x.held), [true]);
  assert.deepEqual(cut.last.waiting, ['dfsr']);
  const back = after(p, 'restore');
  assert.equal(back.wan, 'up');
  assert.deepEqual(back.inflight.dfsr.map((x) => x.held), [false]);
  // the reverse half: the files arrive, the WAN goes, the GPC waits
  const rev = { wanCut: 'afterDfsr', adDelay: 4, dfsrDelay: 2, refreshAt: 3 };
  assert.deepEqual(kinds(rev), ['edit@0', 'dfsr@2', 'cut@2', 'refresh@3', 'restore@4', 'ad@4', 'refresh@5']);
  const r = after(rev, 'cut');
  assert.equal(r.dcs.DC03.gpt.ver, 6);
  assert.equal(r.dcs.DC03.gpc.ver, 5);
});

test('rule 4: a delivery due during the outage waits for the WAN; one due before the cut is not held', () => {
  const t = logic.timing(P({ wanCut: 'afterAd', adDelay: 2, dfsrDelay: 3 }));
  assert.deepEqual(t, { cutAt: 2, backAt: 4, ad: 2, dfsr: 4 });
  const t2 = logic.timing(P({ wanCut: 'afterAd', adDelay: 3, dfsrDelay: 1 }));
  assert.deepEqual(t2, { cutAt: 3, backAt: 5, ad: 3, dfsr: 1 });
  assert.equal(logic.timing(P({ wanCut: 'afterAd', adDelay: 2, dfsrDelay: 6 })).dfsr, 6, 'due after the WAN is back: on time');
});

test('rule 4: an AD send held by the WAN arrives when it comes back; the in-flight item shows that tick', () => {
  const p = { wanCut: 'afterDfsr', adDelay: 3, dfsrDelay: 2, refreshAt: 6 };
  assert.deepEqual(kinds(p), ['edit@0', 'dfsr@2', 'cut@2', 'restore@4', 'ad@4', 'refresh@6']);
  assert.deepEqual(at(p, 1).inflight.ad.map((x) => x.due), [4], 'due is the real arrival, after the hold');
  const cut = after(p, 'cut');
  assert.deepEqual(cut.inflight.ad.map((x) => x.held), [true]);
  assert.deepEqual([cut.last.waiting, cut.last.later], [['ad'], []]);
  const back = after(p, 'restore');
  assert.deepEqual(back.last.waiting, ['ad']);
  assert.deepEqual(back.changed, ['wan']);
  assert.deepEqual(at({ wanCut: 'afterAd', adDelay: 2, dfsrDelay: 3 }, 1).inflight.dfsr.map((x) => x.due), [4]);
});

test('rule 4: a send due after the WAN is back is not held up by the cut', () => {
  const p = { wanCut: 'afterAd', adDelay: 2, dfsrDelay: 8, refreshAt: 9 };
  assert.deepEqual(kinds(p), ['edit@0', 'ad@2', 'cut@2', 'restore@4', 'dfsr@8', 'refresh@9']);
  const cut = after(p, 'cut');
  assert.deepEqual(cut.inflight.dfsr.map((x) => [x.held, x.due]), [[false, 8]]);
  assert.deepEqual([cut.last.waiting, cut.last.later], [[], ['dfsr']]);
  assert.deepEqual(after(p, 'restore').last.waiting, []);
  // nothing in flight at all: both halves arrived before the cut
  const none = after({ wanCut: 'afterDfsr', adDelay: 2, dfsrDelay: 4 }, 'cut');
  assert.deepEqual([none.last.waiting, none.last.later], [[], []]);
});

test('delivery and refresh events carry what the captions read', () => {
  const ad = after({}, 'ad');
  assert.deepEqual(ad.last.items, [{ from: 'DC01', to: 'DC03', ver: 6, by: 'DC01', held: 5, outcome: 'applied' }]);
  assert.deepEqual(ad.changed, ['DC03.gpc']);
  const df = after({}, 'dfsr');
  assert.deepEqual(df.last.items.map((x) => [x.to, x.ver, x.content, x.outcome, x.held.ver]), [['DC03', 6, 'm6a', 'applied', 5]]);
  assert.deepEqual(df.changed, ['DC03.gpt']);
  const r = after(PRESETS['half-arrived'], 'refresh');
  assert.deepEqual([r.last.gpc, r.last.gpt, r.last.content, r.last.was.ver, r.last.final], [6, 5, 'm5', 5, false]);
  const f = after(PRESETS['files-first'], 'refresh');
  assert.deepEqual([f.last.gpc, f.last.gpt, f.last.content, f.last.stale], [5, 6, 'm6a', true]);
  assert.equal(f.client.report, null, 'files-first: nothing was applied under a mismatch');
});

test('rule 5: newer GPC → PC-B applies whatever files DC03 has and records the GPC version', () => {
  const s = after(PRESETS['half-arrived'], 'refresh');
  assert.equal(s.last.outcome, 'applied');
  assert.deepEqual(s.client.applied, { ver: 6, content: 'm5', gptVer: 5 });
  assert.equal(s.client.report, 'mismatch');
  assert.ok(s.changed.includes('client'));
});

test('rule 5: GPC not newer → skipped, even when newer files are there', () => {
  const s = after(PRESETS['files-first'], 'refresh');
  assert.equal(s.dcs.DC03.gpt.ver, 6);
  assert.equal(s.last.outcome, 'skipped');
  assert.deepEqual(s.client.applied, { ver: 5, content: 'm5', gptVer: 5 });
  assert.deepEqual(s.changed, []);
});

test('rule 5: the stale client is not fixed by the next normal refresh, only by a forced one', () => {
  const p = PRESETS['half-arrived'];
  const fin = after(p, 'refresh', 1);
  assert.equal(fin.last.final, true);
  assert.equal(fin.dcs.DC03.gpt.content, 'm6a');
  assert.equal(fin.last.outcome, 'skipped');
  assert.equal(fin.last.stale, true);
  assert.equal(fin.client.applied.content, 'm5');
  const f = end(p);
  assert.equal(f.last.kind, 'force');
  assert.equal(f.last.outcome, 'applied');
  assert.deepEqual(f.client.applied, { ver: 6, content: 'm6a', gptVer: 6 });
  assert.equal(f.client.report, null);
  // no failure needed: an unlucky background refresh between the two deliveries does the same
  assert.deepEqual(kinds({ refreshAt: 3 }), ['edit@0', 'ad@2', 'refresh@3', 'dfsr@4', 'refresh@5', 'force@6']);
  // and no forced refresh when the client was never stale
  for (const id of ['normal', 'files-first', 'two-editors']) assert.ok(!kinds(PRESETS[id]).some((k) => k.startsWith('force')), id);
});

test('rule 6: GPMC mismatch when GPC and GPT versions differ on a DC; not for equal versions, other content', () => {
  const half = after(PRESETS['half-arrived'], 'ad');
  assert.equal(logic.mismatch(half, 'DC03'), true);
  assert.equal(logic.mismatch(half, 'DC01'), false);
  assert.equal(logic.mismatch(after(PRESETS['files-first'], 'dfsr'), 'DC03'), true);
  const two = at({ twoEditors: true }, 2);
  assert.notEqual(two.dcs.DC01.gpt.content, two.dcs.DC03.gpt.content);
  assert.equal(logic.mismatch(two, 'DC01'), false);
  assert.equal(logic.mismatch(two, 'DC03'), false);
  for (const id of Object.keys(PRESETS)) {
    const s = end(PRESETS[id]);
    for (const dc of logic.DCS) assert.equal(logic.mismatch(s, dc), false, id + ' ' + dc + ' ends matched');
  }
});

test('rule 7: two editors: last writer wins, the other copy to ConflictAndDeleted on both DCs', () => {
  const p = PRESETS['two-editors'];
  const ad = after(p, 'ad');
  assert.deepEqual(ad.last.items.map((x) => [x.to, x.outcome]), [['DC03', 'equal'], ['DC01', 'equal']]);
  assert.equal(ad.dcs.DC01.gpc.ver, 6);
  assert.equal(ad.dcs.DC03.gpc.ver, 6);
  const df = after(p, 'dfsr');
  assert.deepEqual(df.last.items.map((x) => [x.from, x.to, x.outcome]), [['DC01', 'DC03', 'lost'], ['DC03', 'DC01', 'won']]);
  assert.deepEqual(df.dcs.DC01.cad, [{ ver: 6, content: 'm6a', by: 'DC01' }]);
  assert.deepEqual(df.dcs.DC03.cad, [{ ver: 6, content: 'm6a', by: 'DC01' }]);
  assert.deepEqual(df.changed.sort(), ['DC01.cad', 'DC01.gpt', 'DC03.cad']);
  const s = end(p);
  assert.deepEqual(s.client.applied, { ver: 6, content: 'm6b', gptVer: 6 });
});

// ── presets (SPEC.md table, checked by the hand model in the thread's library folder) ──

test('preset normal: 4 steps, PC-B applies v6 with the new drive map', () => {
  assert.deepEqual(kinds(PRESETS.normal), ['edit@0', 'ad@2', 'dfsr@4', 'refresh@5']);
  const s = end(PRESETS.normal);
  assert.deepEqual(s.client.applied, { ver: 6, content: 'm6a', gptVer: 6 });
  assert.equal(logic.versionNumber(s.dcs.DC03.gpc.ver), 393217);
});

test('preset half-arrived: 8 steps; GPC 6 / GPT 5 at Branch; stale until forced', () => {
  assert.deepEqual(kinds(PRESETS['half-arrived']),
    ['edit@0', 'ad@2', 'cut@2', 'refresh@3', 'restore@4', 'dfsr@4', 'refresh@5', 'force@6']);
  const ad = after(PRESETS['half-arrived'], 'ad');
  assert.deepEqual([ad.dcs.DC03.gpc.ver, ad.dcs.DC03.gpt.ver], [6, 5]);
});

test('preset files-first: 5 steps; GPT 6 / GPC 5 at Branch; client keeps v5 until the GPC arrives', () => {
  assert.deepEqual(kinds(PRESETS['files-first']), ['edit@0', 'dfsr@2', 'refresh@3', 'ad@4', 'refresh@5']);
  const s = end(PRESETS['files-first']);
  assert.deepEqual(s.client.applied, { ver: 6, content: 'm6a', gptVer: 6 });
});

test('preset two-editors: 5 steps', () => {
  assert.deepEqual(kinds(PRESETS['two-editors']), ['edit@0', 'edit@0', 'ad@2', 'dfsr@4', 'refresh@5']);
});

test('every param combination: 4 to 8 steps, ends converged, no forced refresh with two editors', () => {
  let max = 0;
  for (const wanCut of ['never', 'afterAd', 'afterDfsr']) {
    for (let a = 1; a <= 10; a++) for (let d = 1; d <= 10; d++) for (let r = 1; r <= 12; r++) for (const two of [false, true]) {
      const p = { wanCut, adDelay: a, dfsrDelay: d, refreshAt: r, twoEditors: two };
      const n = steps(p);
      max = Math.max(max, n);
      assert.ok(n >= 4 && n <= 8, JSON.stringify(p) + ' ' + n);
      const s = end(p);
      assert.equal(s.wan, 'up');
      assert.equal(s.inflight.ad.length + s.inflight.dfsr.length, 0);
      assert.equal(s.dcs.DC01.gpt.content, s.dcs.DC03.gpt.content);
      assert.equal(s.client.applied.content, s.dcs.DC03.gpt.content, 'PC-B ends on the files');
      if (two) assert.ok(!logic.plan(P(p)).some((e) => e.kind === 'force'));
      const ts = logic.plan(P(p)).map((e) => e.t);
      assert.deepEqual(ts, ts.slice().sort((x, y) => x - y), 'events in time order');
    }
  }
  assert.equal(max, 8);
});

test('params are clamped', () => {
  assert.deepEqual(logic.eff({ wanCut: 'x', adDelay: 99, dfsrDelay: -3, refreshAt: 'a' }),
    { wanCut: 'never', adDelay: 10, dfsrDelay: 1, refreshAt: 5, twoEditors: false });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of Object.values(PRESETS)) {
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    const n = kit.stepsOf(logic, p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let i = 1; i <= n; i++) { s = logic.step(s, i, p); forward.push(s); }
    for (let i = n; i >= 0; i--) assert.deepEqual(kit.stateAt(logic, p, i), forward[i]);
  }
});

test('step does not mutate its input', () => {
  const p = P(PRESETS['two-editors']);
  let s = logic.initial(p);
  for (let i = 1; i <= kit.stepsOf(logic, p); i++) {
    const copy = structuredClone(s);
    const next = logic.step(s, i, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, with the numbers of SPEC.md', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, kit.stepsOf(logic, logic.defaults), 'meta.steps matches the model at its defaults');
  const found = [...html.matchAll(/\{ id: '([\w-]+)', label: [^,]+, params: (\{[^}]*\})/g)];
  assert.deepEqual(found.map((m) => m[1]), Object.keys(PRESETS));
  for (const m of found) {
    const params = Function('return ' + m[2])();
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.deepEqual(params, PRESETS[m[1]], m[1]);
  }
});
