// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-time-hierarchy's model (SPEC.md). Run: node --test sims/win-time-hierarchy/
// Tie-breaks first, then the rules, then the presets' numbers, then the template's generic block.
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
const offsets = (s) => Object.fromEntries(logic.IDS.map((id) => [id, s.nodes[id].offset]));
const srcs = (over) => logic.sources(P(over));

const PRESETS = {
  healthy: { pdcSource: 'external', pdcDrift: 0, memberStopped: false, pcbDrift: 40, pdcOn: 'DC01', rounds: 4 },
  'pdc-no-source': { pdcSource: 'none', pdcDrift: 60, memberStopped: false, pcbDrift: 40, pdcOn: 'DC01', rounds: 10 },
  'member-stopped': { pdcSource: 'external', pdcDrift: 0, memberStopped: true, pcbDrift: 40, pdcOn: 'DC01', rounds: 9 },
  'move-pdc': { pdcSource: 'external', pdcDrift: 30, memberStopped: false, pcbDrift: 40, pdcOn: 'DC02', rounds: 6 },
  quillmoor: { pdcSource: 'external', pdcDrift: 15, memberStopped: false, pcbDrift: 40, pdcOn: 'DC01', rounds: 3 }
};

// ── tie-breaks ──

test('rule 7 tie-break: sync order is top-down by depth, then by name', () => {
  assert.deepEqual(at({}, 1).order, ['loom', 'DC01', 'DC02', 'DC03', 'PC-A', 'PC-B']);
  // a stopped PC-B has no source: depth 0, and "PC-B" sorts before "loom"
  assert.deepEqual(at({ memberStopped: true }, 1).order, ['PC-B', 'loom', 'DC01', 'DC02', 'DC03', 'PC-A']);
  // DC02 as PDC without a source is a root; DC01 under loom, DC03 and PC-A under DC02, PC-B under DC03
  assert.deepEqual(at(PRESETS['move-pdc'], 1).order, ['DC02', 'loom', 'DC01', 'DC03', 'PC-A', 'PC-B']);
  // same depth: name decides (DC02 before DC03 under DC01)
  const o = logic.order({ loom: null, DC01: 'loom', DC03: 'DC01', DC02: 'DC01', 'PC-B': 'DC03', 'PC-A': 'DC02' });
  assert.deepEqual(o, ['loom', 'DC01', 'DC02', 'DC03', 'PC-A', 'PC-B']);
});

test('rule 7: a node takes its source\'s time after the source synced in the same round', () => {
  // PC-B ← DC03 ← DC02 (PDC, drifting): PC-B gets DC03's value of this round, not last round's or DC03's drifted one
  const s = at(PRESETS['move-pdc'], 1);
  assert.equal(s.nodes.DC03.drifted, 3, 'DC03 drifted by its own +3 first');
  assert.equal(s.nodes.DC03.offset, 30);
  assert.equal(s.nodes['PC-B'].offset, 30, 'PC-B follows DC03 after DC03 followed DC02');
});

test('rule 5 tie-break: exactly 300 s passes, 301 s fails', () => {
  assert.equal(logic.skewOk(300, 0), true);
  assert.equal(logic.skewOk(0, 300), true);
  assert.equal(logic.skewOk(301, 0), false);
  assert.equal(logic.skewOk(-301, 0), false);
  // PC-B stopped with 60 s/round: round 5 is exactly 300 s and passes, round 6 fails
  const p = { memberStopped: true, pcbDrift: 60, rounds: 6 };
  assert.deepEqual(at(p, 5).krb[1], { a: 'PC-B', b: 'DC03', kind: 'logon', skew: 300, ok: true });
  assert.equal(at(p, 6).krb[1].ok, false);
});

// ── rules ──

test('rule 1: members follow their own DC, not the PDC', () => {
  assert.equal(srcs({})['PC-A'], 'DC02');
  assert.equal(srcs({})['PC-B'], 'DC03');
  assert.equal(srcs({ pdcOn: 'DC02' })['PC-B'], 'DC03', 'the members do not move with the role');
  const s = at({}, 1);
  assert.equal(s.nodes['PC-A'].drifted, -5);
  assert.equal(s.nodes['PC-A'].offset, 0);
  assert.equal(s.nodes['PC-A'].corrected, 5);
});

test('rule 2: DCs follow the PDC emulator, found by role', () => {
  assert.equal(srcs({}).DC02, 'DC01');
  assert.equal(srcs({}).DC03, 'DC01');
  assert.equal(srcs({ pdcOn: 'DC02' }).DC03, 'DC02');
  assert.equal(srcs({ pdcOn: 'DC02', pdcSource: 'none' }).DC01, 'DC02', 'a domhier DC01 follows the new PDC');
});

test('rule 3: the PDC with an external source follows it; without one it runs alone and logs event 12', () => {
  assert.equal(srcs({}).DC01, 'loom');
  assert.equal(logic.lonePdc(P({})), null);
  assert.deepEqual(at({}, 4).events, []);
  const p = { pdcSource: 'none', pdcDrift: 20 };
  assert.equal(srcs(p).DC01, null);
  assert.equal(logic.lonePdc(P(p)), 'DC01');
  assert.equal(at(p, 0).events.length, 0, 'nothing logged before the first round');
  assert.deepEqual(at(p, 1).events, [{ round: 1, node: 'DC01', code: 'noSource' }]);
  assert.deepEqual(at(p, 4).events, [{ round: 1, node: 'DC01', code: 'noSource' }], 'logged once');
  assert.equal(at(p, 3).nodes.DC01.offset, 60, 'it runs on its own clock');
  assert.equal(at(p, 3).nodes.DC01.corrected, 0);
});

test('rule 4: moving the role does not move the configuration', () => {
  const p = PRESETS['move-pdc'];
  const cfg = logic.config(P(p));
  assert.equal(cfg.DC01.config, 'manual');
  assert.equal(cfg.DC01.pdc, false);
  assert.equal(cfg.DC02.config, 'domhier');
  assert.equal(cfg.DC02.pdc, true);
  const src = srcs(p);
  assert.equal(src.DC01, 'loom', 'the old PDC keeps its manual peer');
  assert.equal(src.DC02, null, 'the new PDC has nobody above it');
  assert.equal(Object.values(src).filter((x) => x === 'DC01').length, 0, 'DC01 feeds nobody');
  assert.deepEqual(at(p, 1).events, [{ round: 1, node: 'DC02', code: 'noSource' }]);
  assert.equal(at(p, 3).nodes.DC01.offset, 0);
  assert.equal(at(p, 3).nodes.DC02.offset, 90);
});

test('rule 5: Kerberos compares the parties, not true time', () => {
  const s = at({ pdcSource: 'none', pdcDrift: -60, rounds: 10 }, 10);
  assert.equal(logic.domainOffset(s), -600, 'the whole domain is 10 minutes behind');
  assert.ok(s.krb.every((k) => k.ok && k.skew === 0));
  // the four pairs, in the strip's order
  assert.deepEqual(s.krb.map((k) => [k.a, k.b, k.kind]),
    [['PC-A', 'DC02', 'logon'], ['PC-B', 'DC03', 'logon'], ['DC02', 'DC01', 'dc'], ['DC03', 'DC01', 'dc']]);
  // a DC pair fails too: the role on DC02 drifting 60 s/round, DC01 on loom, past 300 s in round 6
  const m = { pdcOn: 'DC02', pdcDrift: 60, rounds: 6 };
  assert.equal(at(m, 5).krb[2].ok, true);
  assert.deepEqual(at(m, 6).krb.map((k) => k.ok), [true, true, false, false]);
  assert.deepEqual(at(m, 6).events.filter((e) => e.code === 'krbFail').map((e) => [e.round, e.node, e.peer]),
    [[6, 'DC02', 'DC01'], [6, 'DC03', 'DC01']]);
});

test('rule 6: a node that does not sync drifts away; the others are still corrected', () => {
  const s = at({ memberStopped: true, pcbDrift: 25 }, 3);
  assert.equal(s.nodes['PC-B'].source, null);
  assert.equal(s.nodes['PC-B'].syncs, false);
  assert.equal(s.nodes['PC-B'].offset, 75);
  assert.equal(s.nodes['PC-B'].corrected, 0);
  assert.equal(s.nodes.DC03.offset, 0);
  // not stopped: the same drift is pulled back every round
  const h = at({ pcbDrift: 25 }, 3);
  assert.equal(h.nodes['PC-B'].offset, 0);
  assert.equal(h.nodes['PC-B'].corrected, -25);
});

test('drift: the PDC holder drifts by pdcDrift, PC-B by pcbDrift, the rest by their own rates', () => {
  const c = logic.config(P({ pdcDrift: 7, pcbDrift: 9 }));
  assert.deepEqual(logic.IDS.map((id) => c[id].driftPerRound), [0, 7, -2, 3, -5, 9]);
  const m = logic.config(P({ pdcOn: 'DC02', pdcDrift: 7 }));
  assert.deepEqual(logic.IDS.map((id) => m[id].driftPerRound), [0, 1, 7, 3, -5, 40]);
  assert.equal(at({ pdcDrift: 7 }, 1).nodes.loom.offset, 0, 'loom is true time');
});

test('changed: the nodes whose offset differs from the step before', () => {
  assert.deepEqual(at({}, 1).changed, []);
  assert.deepEqual(at({ memberStopped: true }, 2).changed, ['PC-B']);
  assert.deepEqual(at(PRESETS['move-pdc'], 1).changed, ['DC02', 'DC03', 'PC-A', 'PC-B']);
});

// ── presets: the numbers of SPEC.md ──

test('preset healthy: everyone at 0 after every round; the corrections of round 1', () => {
  const p = PRESETS.healthy;
  assert.equal(steps(p), 4);
  for (let n = 1; n <= 4; n++) {
    const s = at(p, n);
    assert.ok(logic.IDS.every((id) => Math.abs(s.nodes[id].offset) <= 1));
    assert.ok(s.krb.every((k) => k.ok && k.skew === 0));
  }
  const s = at(p, 1);
  assert.deepEqual(logic.IDS.map((id) => s.nodes[id].corrected), [0, 0, 2, -3, 5, -40]);
  assert.deepEqual(end(p).events, []);
});

test('preset pdc-no-source: the whole domain 10 minutes ahead after 10 rounds, Kerberos green', () => {
  const p = PRESETS['pdc-no-source'];
  assert.equal(steps(p), 10);
  for (let n = 1; n <= 10; n++) {
    const s = at(p, n);
    assert.equal(logic.domainOffset(s), 60 * n);
    assert.ok(s.krb.every((k) => k.ok));
  }
  const s = end(p);
  assert.deepEqual(offsets(s), { loom: 0, DC01: 600, DC02: 600, DC03: 600, 'PC-A': 600, 'PC-B': 600 });
  assert.deepEqual(s.events, [{ round: 1, node: 'DC01', code: 'noSource' }]);
});

test('preset member-stopped: PC-B crosses 5 minutes in round 8 (320 s)', () => {
  const p = PRESETS['member-stopped'];
  assert.equal(steps(p), 9);
  assert.deepEqual([7, 8, 9].map((n) => at(p, n).krb[1].skew), [280, 320, 360]);
  assert.deepEqual([7, 8, 9].map((n) => at(p, n).krb[1].ok), [true, false, false]);
  assert.equal(at(p, 9).nodes.DC03.offset, 0);
  assert.deepEqual(end(p).events, [{ round: 8, node: 'PC-B', peer: 'DC03', code: 'krbFail' }]);
  assert.ok(end(p).krb.filter((k, i) => i !== 1).every((k) => k.ok));
});

test('preset move-pdc: DC02 alone at +30 per round, the domain follows, DC01 stays on loom', () => {
  const p = PRESETS['move-pdc'];
  assert.equal(steps(p), 6);
  const s = end(p);
  assert.deepEqual(offsets(s), { loom: 0, DC01: 0, DC02: 180, DC03: 180, 'PC-A': 180, 'PC-B': 180 });
  assert.deepEqual(s.krb.map((k) => [k.skew, k.ok]), [[0, true], [0, true], [180, true], [180, true]]);
  assert.deepEqual(s.events, [{ round: 1, node: 'DC02', code: 'noSource' }]);
});

test('preset quillmoor: the PDC on loom, its own +15 pulled back each round', () => {
  const p = PRESETS.quillmoor;
  assert.equal(steps(p), 3);
  assert.equal(srcs(p).DC01, 'loom');
  for (let n = 1; n <= 3; n++) {
    const s = at(p, n);
    assert.equal(s.nodes.DC01.drifted, 15);
    assert.equal(s.nodes.DC01.corrected, -15);
    assert.ok(logic.IDS.every((id) => s.nodes[id].offset === 0));
  }
});

test('every param combination: at most 10 steps, the strip consistent with the offsets', () => {
  let max = 0;
  for (const pdcSource of ['external', 'none']) for (const pdcOn of ['DC01', 'DC02']) for (const memberStopped of [false, true])
    for (const pdcDrift of [-60, -31, 0, 17, 60]) for (const pcbDrift of [0, 40, 120]) {
      const p = { pdcSource, pdcOn, memberStopped, pdcDrift, pcbDrift, rounds: 10 };
      max = Math.max(max, steps(p));
      for (let n = 0; n <= 10; n++) {
        const s = at(p, n);
        for (const k of s.krb) assert.equal(k.ok, Math.abs(s.nodes[k.a].offset - s.nodes[k.b].offset) <= 300);
        for (const id of logic.IDS) if (s.nodes[id].source) assert.equal(s.nodes[id].offset, s.nodes[s.nodes[id].source].offset);
      }
    }
  assert.equal(max, 10);
});

test('the strip\'s skew is a distance (never negative); domainOffset only when all agree', () => {
  // PC-B stopped at 0 while the domain runs ahead: PC-B is behind DC03, the skew is still positive
  const p = { pdcSource: 'none', pdcDrift: 60, memberStopped: true, pcbDrift: 0 };
  const s = at(p, 3);
  assert.equal(s.nodes['PC-B'].offset - s.nodes.DC03.offset, -180);
  assert.equal(s.krb[1].skew, 180);
  assert.equal(logic.domainOffset(s), null, 'a stopped member that disagrees: no single domain offset');
  assert.equal(logic.domainOffset(at({ pdcSource: 'none', pdcDrift: 60 }, 3)), 180);
});

test('params are clamped', () => {
  assert.deepEqual(logic.eff({ pdcSource: 'x', pdcDrift: 99, memberStopped: 0, pcbDrift: -3, pdcOn: 'DC09', rounds: 'a' }),
    { pdcSource: 'external', pdcDrift: 60, memberStopped: false, pcbDrift: 0, pdcOn: 'DC01', rounds: 4 });
  assert.equal(steps({ rounds: 50 }), 10);
  assert.equal(steps({ rounds: 0 }), 1);
  assert.equal(logic.eff({ pcbDrift: 500 }).pcbDrift, 120);
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
  const p = P(PRESETS['move-pdc']);
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
