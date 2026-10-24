// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ad-replication's model: tie-breaks first, then one test per rule (SPEC.md), then the presets' numbers,
// then the template's generic block.
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
const usns = (s) => Object.fromEntries(logic.DCS.map((d) => [d, s.dcs[d].usn]));
const phone = (s, d) => s.dcs[d].obj.telephoneNumber;
const meta = (a) => [a.value, a.ver, a.origDc, a.origUsn, a.origTime, a.localUsn];
const L2 = (obj) => logic.ATTRS.map((a) => obj[a].localUsn);
const ch = (o) => Object.assign({ value: 'x', ver: 2, origDc: 'DC01', origUsn: 1, origTime: 0 }, o);
/** The step whose event is the pull dest ← src. */
const pullStep = (p, dest, src) => logic.plan(p).findIndex((e) => e.kind === 'pull' && e.dest === dest && e.src === src) + 1;

// ── tie-breaks ──

test('rule 5 tie-breaks: version first, then the later time, then the higher invocationID', () => {
  // a higher version beats a later time
  assert.equal(logic.beats(ch({ ver: 3, origTime: 1 }), ch({ ver: 2, origTime: 5, origDc: 'DC02' })), true);
  assert.equal(logic.beats(ch({ ver: 2, origTime: 5, origDc: 'DC02' }), ch({ ver: 3, origTime: 1 })), false);
  assert.equal(logic.ruleOf(ch({ ver: 3, origTime: 1 }), ch({ ver: 2, origTime: 5 })), 'version');
  // equal version: the later time, whatever the DC
  assert.equal(logic.beats(ch({ origTime: 2, origDc: 'DC01' }), ch({ origTime: 0, origDc: 'DC02' })), true);
  assert.equal(logic.beats(ch({ origTime: 0, origDc: 'DC02' }), ch({ origTime: 2, origDc: 'DC01' })), false);
  assert.equal(logic.ruleOf(ch({ origTime: 2 }), ch({ origTime: 0 })), 'time');
  // equal version and time: the higher invocationID (DC02 > DC01), either way round
  assert.equal(logic.beats(ch({ origDc: 'DC02' }), ch({ origDc: 'DC01' })), true);
  assert.equal(logic.beats(ch({ origDc: 'DC01' }), ch({ origDc: 'DC02' })), false);
  assert.equal(logic.ruleOf(ch({ origDc: 'DC02' }), ch({ origDc: 'DC01' })), 'id');
});

test('rule 5 in a run: same version and second → DC02 wins on the invocationID', () => {
  const p = P({ t2: 0 });
  const s = at(p, pullStep(p, 'DC02', 'DC01'));
  assert.deepEqual(s.last.changes.map((c) => [c.attr, c.outcome, c.rule]), [['telephoneNumber', 'lost', 'id']]);
  const e = end(p);
  for (const d of logic.DCS) assert.equal(phone(e, d).value, '555-0222', d);
  const back = at(p, pullStep(p, 'DC01', 'DC03'));
  assert.deepEqual(back.last.changes.map((c) => [c.outcome, c.rule]), [['applied', 'id']]);
});

test('rule 7: writes in time order; in the same second DC01 before DC02; pulls after every write, in ring order', () => {
  const ev = logic.plan(P({ edits1: 3, t2: 1 }));
  assert.deepEqual(ev.slice(0, 4).map((e) => e.dc + '@' + e.t), ['DC01@0', 'DC01@1', 'DC02@1', 'DC01@2']);
  assert.deepEqual(logic.plan(P({ t2: 0 })).slice(0, 2).map((e) => e.dc), ['DC01', 'DC02']);
  const late = logic.plan(P({ t2: 10, direct: true }));
  assert.deepEqual(late.slice(2).map((e) => e.dest + '<' + e.src + '@' + e.t), ['DC02<DC01@15', 'DC03<DC02@16', 'DC03<DC01@17', 'DC01<DC03@18']);
  assert.ok(late.slice(0, 2).every((e) => e.kind === 'write' && e.t < 15));
  // the same-second tie decides which USN each write gets: DC01's 4101 is taken first
  const s = at(P({ t2: 0 }), 2);
  assert.deepEqual([s.writes[0].dc, s.writes[0].usn, s.writes[1].dc, s.writes[1].usn], ['DC01', 4101, 'DC02', 7301]);
});

// ── rules ──

test('rule 1: an originating write takes the next USN; ver + 1; origin, origUsn = localUsn, time = now', () => {
  const p = P({ edit2: false, edits1: 2 });
  const s1 = at(p, 1);
  assert.equal(s1.dcs.DC01.usn, 4101);
  assert.deepEqual(meta(phone(s1, 'DC01')), ['555-0111', 2, 'DC01', 4101, 0, 4101]);
  const s2 = at(p, 2);
  assert.deepEqual(meta(phone(s2, 'DC01')), ['555-0112', 3, 'DC01', 4102, 1, 4102]);
  // only that attribute and only that DC
  assert.deepEqual(meta(s2.dcs.DC01.obj.title), meta(at(p, 0).dcs.DC01.obj.title));
  assert.deepEqual(usns(s2), { DC01: 4102, DC02: 7300, DC03: 2200 });
  assert.deepEqual(s2.changed.sort(), ['DC01.obj.telephoneNumber', 'DC01.usn']);
  // DC02's write starts from its own counter
  const w = at(P({}), 2);
  assert.deepEqual(meta(phone(w, 'DC02')), ['555-0222', 2, 'DC02', 7301, 2, 7301]);
});

test('rule 2: a pull returns only attributes above the HWM, the current value once; HWM → the source\'s USN', () => {
  // two edits on DC01 travel as one change, the latest (v3, origUsn 4102)
  const p = P({ edit2: false, edits1: 2 });
  const s = at(p, pullStep(p, 'DC02', 'DC01'));
  assert.equal(s.last.from, 4100);
  assert.equal(s.last.to, 4102);
  assert.deepEqual(s.last.changes.map((c) => [c.attr, c.ver, c.srcUsn]), [['telephoneNumber', 3, 4102]]);
  assert.equal(s.dcs.DC02.hwm.DC01, 4102);
  // the attribute that did not change does not travel
  assert.ok(!s.last.changes.some((c) => c.attr === 'title'));
  // several changes come in the source's local-USN order
  const d = P({ t2: 0, sameAttr: false });
  const s3 = at(d, pullStep(d, 'DC03', 'DC02'));
  assert.deepEqual(s3.last.changes.map((c) => [c.attr, c.srcUsn]), [['title', 7301], ['telephoneNumber', 7302]]);
  // unit: the filter itself
  const dc = at(P({}), 0).dcs.DC01;
  assert.deepEqual(logic.changesAbove(dc, 4000), ['title']);
  assert.deepEqual(logic.changesAbove(dc, 3999), ['telephoneNumber', 'title']);
  assert.deepEqual(logic.changesAbove(dc, 4100), []);
});

test('rule 2: the HWM advances even when every change is left out', () => {
  const p = P({ edit2: false, direct: true });
  const k = pullStep(p, 'DC03', 'DC01');
  assert.equal(at(p, k - 1).dcs.DC03.hwm.DC01, 4100);
  const s = at(p, k);
  assert.deepEqual(s.last.changes.map((c) => c.outcome), ['utd']);
  assert.equal(s.dcs.DC03.hwm.DC01, 4101);
  assert.equal(s.dcs.DC03.usn, 2201, 'nothing applied, no new USN');
  assert.ok(s.changed.includes('DC03.hwm.DC01'));
  assert.ok(!s.changed.includes('DC03.usn'));
});

test('rule 3: propagation dampening, by the UTD and for the destination\'s own change', () => {
  const dest = { utd: { DC01: 4101, DC02: 7300 } };
  assert.equal(logic.dampened('DC03', dest, ch({ origDc: 'DC01', origUsn: 4101 })), 'utd');
  assert.equal(logic.dampened('DC03', dest, ch({ origDc: 'DC01', origUsn: 4100 })), 'utd');
  assert.equal(logic.dampened('DC03', dest, ch({ origDc: 'DC01', origUsn: 4102 })), null, '≤, not <');
  assert.equal(logic.dampened('DC03', dest, ch({ origDc: 'DC03', origUsn: 9999 })), 'own');
  // in a run: DC01 gets its own change back from DC03 and leaves it out
  const p = P({ edit2: false });
  const s = at(p, pullStep(p, 'DC01', 'DC03'));
  assert.deepEqual(s.last.changes.map((c) => [c.attr, c.outcome]), [['telephoneNumber', 'own']]);
  assert.equal(s.dcs.DC01.usn, 4101);
});

test('rule 4: an applied change gets the destination\'s next USN and keeps its originating metadata', () => {
  const p = P({ edit2: false });
  const s = at(p, pullStep(p, 'DC02', 'DC01'));
  assert.deepEqual(meta(phone(s, 'DC02')), ['555-0111', 2, 'DC01', 4101, 0, 7301]);
  assert.equal(s.dcs.DC02.usn, 7301);
  assert.equal(s.last.changes[0].localUsn, 7301);
  const s3 = at(p, pullStep(p, 'DC03', 'DC02'));
  assert.deepEqual(meta(phone(s3, 'DC03')), ['555-0111', 2, 'DC01', 4101, 0, 2201]);
});

test('rule 4: the destination takes over the source\'s vector; its entry for the source is the source\'s USN', () => {
  const p = P({ edit2: false });
  const s = at(p, pullStep(p, 'DC02', 'DC01'));
  assert.deepEqual(s.dcs.DC02.utd, { DC01: 4101, DC03: 2200 });
  const s3 = at(p, pullStep(p, 'DC03', 'DC02'));
  // DC01's entry from DC02's vector, DC02's own entry = DC02's USN
  assert.deepEqual(s3.dcs.DC03.utd, { DC01: 4101, DC02: 7301 });
  assert.ok(s3.changed.includes('DC03.utd.DC01') && s3.changed.includes('DC03.utd.DC02'));
  // a change that lost the conflict is still covered: DC02 has seen DC01's 4101
  const q = P({});
  assert.equal(at(q, pullStep(q, 'DC02', 'DC01')).dcs.DC02.utd.DC01, 4101);
  // a vector never goes down
  for (const pp of [P({}), P({ edits1: 3, direct: true }), P({ t2: 0, sameAttr: false })]) {
    for (let n = 1; n <= steps(pp); n++) {
      const a = at(pp, n - 1), b = at(pp, n);
      for (const d of logic.DCS) for (const o of Object.keys(a.dcs[d].utd)) assert.ok(b.dcs[d].utd[o] >= a.dcs[d].utd[o]);
    }
  }
});

test('rule 4: the merge keeps a later pull from carrying a change the source had (dampening via the vector)', () => {
  // same-attr-time with the direct pull: DC03 got DC02's vector (DC01: 4101), so DC01's losing 555-0111 is left out
  const p = P({ direct: true });
  const s = at(p, pullStep(p, 'DC03', 'DC01'));
  assert.deepEqual(s.last.changes.map((c) => [c.value, c.outcome]), [['555-0111', 'utd']]);
  assert.equal(phone(s, 'DC03').value, '555-0222');
});

test('rule 5: a losing incoming change is discarded; a held value that loses is overwritten', () => {
  const p = P({});
  const s = at(p, pullStep(p, 'DC02', 'DC01'));
  assert.deepEqual(s.last.changes.map((c) => [c.value, c.outcome, c.rule, c.localUsn]), [['555-0111', 'lost', 'time', null]]);
  assert.deepEqual(meta(phone(s, 'DC02')), ['555-0222', 2, 'DC02', 7301, 2, 7301]);
  assert.equal(s.dcs.DC02.usn, 7301);
  const b = at(p, pullStep(p, 'DC01', 'DC03'));
  assert.deepEqual(meta(phone(b, 'DC01')), ['555-0222', 2, 'DC02', 7301, 2, 4102]);
});

test('rule 5: identical metadata is the same change, not a conflict', () => {
  const a = ch({ origDc: 'DC02', origUsn: 7301 });
  assert.equal(logic.sameChange(a, Object.assign({}, a, { localUsn: 5 })), true);
  assert.equal(logic.sameChange(a, ch({ origDc: 'DC02', origUsn: 7302 })), false);
  assert.equal(logic.sameChange(a, ch({ origDc: 'DC01', origUsn: 7301 })), false);
  assert.equal(logic.sameChange(a, ch({ origDc: 'DC02', origUsn: 7301, ver: 3 })), false);
  // reached through the model: a destination whose vector was reset to below a change it holds
  const p = P({ edit2: false });
  const k = pullStep(p, 'DC03', 'DC02');
  const prev = at(p, k);
  prev.dcs.DC03.utd.DC01 = 4100;
  prev.dcs.DC03.hwm.DC02 = 7300;
  const again = logic.step(prev, k, p);
  assert.deepEqual(again.last.changes.map((c) => c.outcome), ['same']);
  assert.equal(again.dcs.DC03.usn, 2201);
});

test('rule 6: different attributes of one object never conflict; both survive everywhere', () => {
  const p = P({ t2: 0, sameAttr: false });
  const e = end(p);
  for (const d of logic.DCS) {
    assert.equal(phone(e, d).value, '555-0111', d);
    assert.equal(e.dcs[d].obj.title.value, '@title1', d);
  }
  const s = at(p, pullStep(p, 'DC03', 'DC02'));
  assert.deepEqual(s.last.changes.map((c) => c.outcome), ['applied', 'applied']);
  assert.ok(s.last.changes.every((c) => c.rule !== null), 'each resolved against its own attribute');
  // one update of the object: both attributes under one new local USN
  assert.equal(s.dcs.DC03.usn, 2201, 'two attributes, one USN');
  assert.deepEqual(s.last.changes.map((c) => c.localUsn), [2201, 2201]);
  assert.deepEqual(L2(s.dcs.DC03.obj), [2201, 2201]);
  // and they travel on together: equal source USNs come in attribute order
  const back = at(p, pullStep(p, 'DC01', 'DC03'));
  assert.deepEqual(back.last.changes.map((c) => [c.attr, c.srcUsn, c.outcome]), [['telephoneNumber', 2201, 'own'], ['title', 2201, 'applied']]);
  for (const w of e.writes) assert.equal(logic.fateOf(e, w.wid), 'kept');
});

test('fate: kept, overwritten in order, lost; holders at every step', () => {
  const e = end(P({ edits1: 2, t2: 5 }));
  const fate = Object.fromEntries(e.writes.map((w) => [w.value, logic.fateOf(e, w.wid)]));
  assert.deepEqual(fate, { '555-0111': 'overwritten', '555-0112': 'kept', '555-0222': 'lost' });
  const d = end(P({}));
  assert.deepEqual(d.writes.map((w) => logic.fateOf(d, w.wid)), ['lost', 'kept']);
  const p = P({});
  assert.deepEqual(logic.holders(at(p, 2), 1), ['DC01']);
  assert.deepEqual(logic.holders(at(p, 3), 2), ['DC02']);
  assert.deepEqual(logic.holders(at(p, 4), 2), ['DC02', 'DC03']);
  assert.deepEqual(logic.holders(at(p, 5), 2), ['DC01', 'DC02', 'DC03']);
  assert.deepEqual(logic.holders(at(p, 5), 1), []);
});

test('every run ends converged', () => {
  for (const edits1 of [1, 2, 3]) for (const edit2 of [false, true]) for (const t2 of [0, 1, 2, 5, 10])
    for (const sameAttr of [false, true]) for (const direct of [false, true]) {
      const p = P({ edits1, edit2, t2, sameAttr, direct });
      assert.ok(logic.converged(end(p)), JSON.stringify(p));
      assert.ok(!logic.converged(at(p, logic.plan(p).filter((e) => e.kind === 'write').length)), 'not before the pulls');
    }
});

test('converged looks at every attribute', () => {
  const s = end(P({ t2: 0, sameAttr: false }));
  assert.equal(logic.converged(s), true);
  const t = structuredClone(s);
  t.dcs.DC03.obj.title.wid = 99;
  assert.equal(logic.converged(t), false);
  const u = structuredClone(s);
  u.dcs.DC02.obj.telephoneNumber.wid = 99;
  assert.equal(logic.converged(u), false);
});

test('changed lists the USN, the applied attributes, the HWM and the UTD entries a pull moved', () => {
  const p = P({ edit2: false });
  assert.deepEqual(at(p, 2).changed.sort(), ['DC02.hwm.DC01', 'DC02.obj.telephoneNumber', 'DC02.usn', 'DC02.utd.DC01']);
  // a pull that applies nothing moves no USN and no attribute
  assert.deepEqual(at(p, 4).changed.sort(), ['DC01.hwm.DC03', 'DC01.utd.DC02', 'DC01.utd.DC03']);
});

test('params are clamped', () => {
  assert.deepEqual(logic.eff(P({ edits1: 9, t2: -4 })), { edits1: 3, edit2: true, t2: 0, sameAttr: true, direct: false });
  assert.equal(logic.eff(P({ t2: 'x' })).t2, 2);
});

// ── presets (SPEC.md) ──

const PRESETS = {
  'one-change': P({ edit2: false }),
  'same-attr-time': P({}),
  'version-beats-time': P({ edits1: 2, t2: 5 }),
  'different-attrs': P({ t2: 0, sameAttr: false }),
  'dampening': P({ edit2: false, direct: true })
};

test('presets: the numbers in SPEC.md', () => {
  const want = { 'one-change': 4, 'same-attr-time': 5, 'version-beats-time': 6, 'different-attrs': 5, 'dampening': 5 };
  for (const id of Object.keys(want)) assert.equal(steps(PRESETS[id]), want[id], id);

  const one = PRESETS['one-change'];
  assert.deepEqual([at(one, 1).dcs.DC01.usn, phone(at(one, 1), 'DC01').ver], [4101, 2]);
  assert.deepEqual([at(one, 2).dcs.DC02.usn, phone(at(one, 2), 'DC02').origUsn], [7301, 4101]);
  assert.equal(at(one, 3).dcs.DC03.usn, 2201);
  const e1 = end(one);
  assert.deepEqual([e1.dcs.DC02.utd.DC01, e1.dcs.DC03.utd.DC01, e1.dcs.DC01.usn], [4101, 4101, 4101]);

  const same = end(PRESETS['same-attr-time']);
  for (const d of logic.DCS) assert.equal(phone(same, d).value, '555-0222');
  assert.deepEqual(usns(same), { DC01: 4102, DC02: 7301, DC03: 2201 });

  const ver = end(PRESETS['version-beats-time']);
  for (const d of logic.DCS) assert.deepEqual([phone(ver, d).value, phone(ver, d).ver], ['555-0112', 3]);
  assert.deepEqual(usns(ver), { DC01: 4102, DC02: 7302, DC03: 2201 });

  const diff = end(PRESETS['different-attrs']);
  assert.deepEqual(usns(diff), { DC01: 4102, DC02: 7302, DC03: 2201 });

  const damp = PRESETS['dampening'];
  const k = pullStep(damp, 'DC03', 'DC01');
  assert.equal(k, 4);
  assert.deepEqual([at(damp, k).last.changes[0].outcome, at(damp, k).dcs.DC03.utd.DC01], ['utd', 4101]);
});

test('the page lists exactly these presets, in this order', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)', label:/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS));
});

test('no combination of params exceeds 20 steps; the most is 8, the least 4', () => {
  let max = 0, min = 99;
  for (const edits1 of [1, 2, 3]) for (const edit2 of [false, true]) for (const direct of [false, true]) {
    const n = steps(P({ edits1, edit2, direct }));
    max = Math.max(max, n);
    min = Math.min(min, n);
  }
  assert.deepEqual([min, max], [4, 8]);
});

// ── generic checks every sim keeps ──

const SAMPLES = [P({}), P({ edits1: 3, direct: true }), P({ t2: 0, sameAttr: false, direct: true }), P({ edit2: false, edits1: 2 })];

test('state is JSON-safe at every step', () => {
  for (const p of SAMPLES) for (let n = 0; n <= steps(p); n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of SAMPLES) {
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const p of SAMPLES) for (let n = 1; n <= steps(p); n++) {
    const prev = at(p, n - 1);
    const copy = structuredClone(prev);
    logic.step(prev, n, p);
    assert.deepEqual(prev, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const m = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(m.steps, steps(P({})), 'meta.steps matches the model at the defaults');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((x) => [...x[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
