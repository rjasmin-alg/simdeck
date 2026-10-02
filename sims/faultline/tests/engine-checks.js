// Properties, not fixtures.
//
// "No cut set is ever a superset of another" is a claim about the algorithm.
// "Cut #3 is {osd-1, osd-2}" is a claim about the day the test was written. Only
// the first kind survives a refactor, and only the first kind would have caught
// the bug where the service counted as a cut of itself.

import { buildGraph, evaluator, explain } from '../js/engine/graph.js';
import { cutSets, isMinimal, killsTarget } from '../js/engine/cutset.js';
import { dedupeUniverse, eventUniverse } from '../js/engine/events.js';
import { IMPLICIT_AUTHORITIES, attachAuthorities } from '../js/engine/authorities.js';
import { commonAncestor, componentsIn, spread } from '../js/engine/domain.js';
import { analyse, compile, invalidate, structuralSignature } from '../js/compile.js';
import { SAMPLES, makeSample } from '../js/samples.js';

export const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, detail: fn() || '' }); }
  catch (err) { results.push({ name, pass: false, detail: err.message }); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const sample = (k) => { invalidate(); return makeSample(k); };
const first = (k) => analyse(sample(k)).services[0];
const keys = Object.keys(SAMPLES);

// --- graph semantics ------------------------------------------------------

check('an undrawn dependency is "not described", not broken', () => {
  const g = buildGraph({ components: [{ id: 'a' }], deps: [{ id: 'd', from: 'a', to: 'ghost' }] });
  assert(evaluator(g, new Set()).isUp('a'), 'a node depending on nothing modelled went down');
  return 'unmodelled dependency reads as up';
});

check('a dependency cycle leaves nothing able to bootstrap', () => {
  const g = buildGraph({
    components: [{ id: 'a' }, { id: 'b' }],
    deps: [{ id: '1', from: 'a', to: 'b' }, { id: '2', from: 'b', to: 'a' }],
  });
  const ev = evaluator(g, new Set());
  assert(!ev.isUp('a') && !ev.isUp('b'), 'a circular control-plane dependency should not self-start');
  return 'A needs B needs A: both down';
});

check('gates need what they say they need', () => {
  const mk = (gate, n) => buildGraph({
    components: [{ id: 's' }, { id: 'x' }, { id: 'y' }, { id: 'z' }],
    deps: ['x', 'y', 'z'].map((t, i) => ({ id: `d${i}`, from: 's', to: t, gate, n })),
  });
  const up = (g, down) => evaluator(g, new Set(down)).isUp('s');
  assert(up(mk('any'), ['x', 'y']) && !up(mk('any'), ['x', 'y', 'z']), 'any-of failed');
  assert(up(mk('quorum'), ['x']) && !up(mk('quorum'), ['x', 'y']), 'majority of 3 is 2');
  assert(!up(mk('all'), ['x']), 'all-of failed');
  assert(up(mk('kofn', 2), ['x']) && !up(mk('kofn', 2), ['x', 'y']), 'k-of-n failed');
  return 'all / any / quorum / kofn';
});

check('explain() names a gate that is short, not just the dead leaves', () => {
  const doc = sample('threeZone');
  const { graph } = compile(doc);
  const e = explain(graph, new Set(['etcd1', 'etcd2']), 'svc');
  assert(!e.up, 'losing two of three quorum members should be fatal');
  assert(e.reasons.some((r) => r.gate === 'quorum' && r.live < r.need), 'no quorum reason reported');
  return e.reasons.filter((r) => r.gate).map((r) => `${r.gate} ${r.live}/${r.need}`).join(', ');
});

// --- cut-set correctness --------------------------------------------------

check('every reported cut really does take the service down', () => {
  let n = 0;
  for (const k of keys) {
    const doc = sample(k);
    const c = compile(doc);
    const uni = new Map(c.universe.map((e) => [e.id, e]));
    for (const s of analyse(doc).services) {
      for (const cut of s.cuts) {
        const events = cut.events.map((e) => uni.get(e.id));
        assert(killsTarget(c.graph, s.service.id, events),
          `${k}: {${cut.events.map((e) => e.name).join(', ')}} did not kill ${s.service.name}`);
        n++;
      }
    }
  }
  return `${n} cuts verified sound across ${keys.length} samples`;
});

check('every reported cut is minimal — drop any one and it survives', () => {
  let n = 0;
  for (const k of keys) {
    const doc = sample(k);
    const c = compile(doc);
    const uni = new Map(c.universe.map((e) => [e.id, e]));
    for (const s of analyse(doc).services) {
      for (const cut of s.cuts) {
        const events = cut.events.map((e) => uni.get(e.id));
        assert(isMinimal(c.graph, s.service.id, events),
          `${k}: {${cut.events.map((e) => e.name).join(', ')}} is not minimal`);
        n++;
      }
    }
  }
  return `${n} cuts verified minimal`;
});

check('no reported cut is a superset of another', () => {
  for (const k of keys) {
    for (const s of analyse(sample(k)).services) {
      const sets = s.cuts.map((c) => new Set(c.events.map((e) => e.id)));
      for (let i = 0; i < sets.length; i++) {
        for (let j = 0; j < sets.length; j++) {
          if (i === j) continue;
          const sub = [...sets[j]].every((e) => sets[i].has(e));
          assert(!sub, `${k}: cut ${i} contains cut ${j}`);
        }
      }
    }
  }
  return 'antichain holds in every sample';
});

check('a service is never reported as a cut of itself', () => {
  for (const k of keys) {
    for (const s of analyse(sample(k)).services) {
      for (const cut of s.cuts) {
        assert(!cut.events.some((e) => e.id === `ev:comp:${s.service.id}`),
          `${k}: ${s.service.name} listed as its own single point of failure`);
      }
    }
  }
  return 'the top event is not a basic event';
});

// --- the thesis -----------------------------------------------------------

check('THESIS: a fully redundant drawn model still has a point of failure', () => {
  // threeZone is the "I am finished" design: three zones, quorum of three,
  // replicas in every zone. Nothing drawn kills it below the whole region.
  const s = first('threeZone');
  const zoneCuts = s.drawnCuts.filter((c) => c.size === 1 && c.blastRadius <= 3);
  assert(zoneCuts.length === 0, `a single zone-sized failure killed it: ${zoneCuts.map((c) => c.events[0].name)}`);
  assert(s.cuts.length > 0, 'a model with no cut set at all would be the one thing this tool must never report');
  assert(s.implicitCuts.length > 0, 'the drawn model looked bulletproof and nothing was surfaced');
  return `${s.drawnCuts.length} drawn cuts (smallest ${s.drawnCuts[0].size}), ${s.implicitCuts.length} implicit`;
});

check('THESIS: every sample, however drawn, reports at least one cut set', () => {
  const out = [];
  for (const k of keys) {
    for (const s of analyse(sample(k)).services) {
      assert(s.cuts.length > 0, `${k}: ${s.service.name} reported zero points of failure`);
      out.push(`${k}:${s.cuts.length}`);
    }
  }
  return out.join(' ');
});

check('THESIS: the six authorities are each a single point of failure', () => {
  const s = first('threeZone');
  const found = new Set(s.implicitCuts.filter((c) => c.size === 1).map((c) => c.events[0].name));
  for (const a of IMPLICIT_AUTHORITIES) {
    assert(found.has(a.name), `${a.name} was not reported as a size-1 cut`);
  }
  return `${found.size} authorities, all size 1`;
});

check('modelling an authority yourself replaces it rather than adding to it', () => {
  // usEast1 draws IAM/STS and Route 53 explicitly, in the region they live in.
  const doc = sample('usEast1');
  const { added } = attachAuthorities(doc);
  assert(!added.includes('auth:identity'), 'identity was drawn and should not have been re-added');
  assert(!added.includes('auth:naming'), 'naming was drawn and should not have been re-added');
  assert(added.includes('auth:change'), 'change was not drawn and should have been added');
  return `added ${added.length}: ${added.map((a) => a.split(':')[1]).join(', ')}`;
});

check('turning the authorities off is possible, and then the thesis stops holding', () => {
  // Not a feature so much as a control: if the reveal can be switched off and
  // the drawn model then reports nothing at zone scale, the reveal was doing
  // real work rather than padding the list.
  const doc = { ...sample('threeZone'), settings: { maxCutSize: 3, authorities: false } };
  const s = analyse(doc).services[0];
  assert(s.implicitCuts.length === 0, 'authorities were disabled but still appeared');
  assert(!s.cuts.some((c) => c.size === 1 && c.blastRadius <= 3), 'a small drawn cut appeared from nowhere');
  return `${s.cuts.length} drawn cuts only`;
});

// --- correlated failure ---------------------------------------------------

check('a shared power feed collapses three-way redundancy to size 1', () => {
  const s = first('onePdu');
  const pdu = s.drawnCuts.find((c) => c.size === 1 && c.events[0].name.includes('PDU'));
  assert(pdu, 'the PDU event was not found as a single point of failure');
  assert(pdu.blastRadius === 2, `PDU should reach 2 replicas, reached ${pdu.blastRadius}`);
  const pairs = s.drawnCuts.filter((c) => c.size === 2);
  assert(pairs.length === 3, `expected the three replica pairs, got ${pairs.length}`);
  return `PDU is size 1 (radius 2); losing replicas takes ${pairs.length} distinct pairs`;
});

check('the tighter blast radius is reported first among equal-sized cuts', () => {
  const s = first('onePdu');
  const ones = s.drawnCuts.filter((c) => c.size === 1);
  assert(ones.length >= 2, 'expected both the PDU and the room');
  assert(ones[0].blastRadius < ones[1].blastRadius,
    '"one power strip" should rank above "the whole room"');
  return `${ones[0].events[0].name} (r=${ones[0].blastRadius}) before ${ones[1].events[0].name} (r=${ones[1].blastRadius})`;
});

check('drawn cuts rank ahead of the authorities nobody drew', () => {
  // REVIEW.md finding 1. An authority hits one component, so its radius is 1,
  // so when radius sorted before drawn-ness every authority landed ahead of
  // every drawn cut of the same size and the reveal arrived before the setup.
  // Stated as a property of the order rather than as a fixed list: within any
  // run of equal-sized cuts, drawn-ness never goes backwards.
  const out = [];
  for (const k of keys) {
    for (const s of analyse(sample(k)).services) {
      for (let i = 1; i < s.cuts.length; i++) {
        const prev = s.cuts[i - 1];
        const cur = s.cuts[i];
        if (prev.size !== cur.size) continue;
        assert(!(prev.implicit && cur.drawn),
          `${k}: not-drawn "${prev.events[0].name}" sorted ahead of drawn "${cur.events[0].name}" at size ${cur.size}`);
      }
      out.push(k);
    }
  }
  return `drawn-before-implicit holds in ${out.length} services across ${keys.length} samples`;
});

check('the tightest blast radius still wins inside each group', () => {
  // The other half of finding 1: promoting drawn-ness must not cost the radius
  // ordering that makes "this one power strip" beat "this whole room".
  for (const k of keys) {
    for (const s of analyse(sample(k)).services) {
      for (const group of [s.drawnCuts, s.implicitCuts]) {
        for (let i = 1; i < group.length; i++) {
          if (group[i - 1].size !== group[i].size) continue;
          assert(group[i - 1].blastRadius <= group[i].blastRadius,
            `${k}: radius went backwards, ${group[i - 1].blastRadius} then ${group[i].blastRadius}`);
        }
      }
    }
  }
  return 'radius ascends within every equal-sized run of both groups';
});

check('the headline says what kind of thing the smallest failure is, not just how many', () => {
  // REVIEW.md finding 2. The count alone is nearly information-free: a design
  // that is correctly redundant up to the region boundary and a design where
  // one server ends it both report 1. So the property is precisely that the
  // descriptor separates what the count conflates — there must exist two
  // samples with the *same* size and a *different* scope or radius.
  const hs = [];
  for (const k of keys) {
    const s = first(k);
    const h = s.smallestDrawn;
    assert(h, `${k}: no drawn cut to headline`);
    assert(typeof h.scope === 'string' && h.scope.length > 0, `${k}: headline carries no scope`);
    const actual = s.drawnCuts[0];
    assert(h.size === actual.size && h.blastRadius === actual.blastRadius && h.scope === actual.scope,
      `${k}: headline disagrees with the cut it describes`);
    hs.push([k, h]);
  }

  let separated = null;
  for (const [ka, a] of hs) {
    for (const [kb, b] of hs) {
      if (a.size !== b.size) continue;
      if (a.scope !== b.scope || a.blastRadius !== b.blastRadius) separated = `${ka} (${a.size}, ${a.scope}, r${a.blastRadius}) vs ${kb} (${b.size}, ${b.scope}, r${b.blastRadius})`;
    }
  }
  assert(separated, 'every sample headlined identically — the descriptor is adding nothing');
  return separated;
});

check('min_size == size means one replica loss is fatal; k-of-n means it is not', () => {
  const two = first('sizeTwo');
  const fatal = two.drawnCuts.filter((c) => c.size === 1 && c.events[0].kind === 'component');
  assert(fatal.length === 2, `size=2,min_size=2 should make each OSD fatal, got ${fatal.length}`);

  const three = first('onePdu'); // size=3, min_size=2 expressed as kofn n=2
  const solo = three.drawnCuts.filter((c) => c.size === 1 && c.events[0].kind === 'component');
  assert(solo.length === 0, 'a 2-of-3 pool should survive any single replica');
  return 'size=2/min_size=2: 2 fatal singles; size=3/min_size=2: 0';
});

// --- the cloud lesson -----------------------------------------------------

check('a multi-region workload still dies with its single-region control plane', () => {
  const s = first('usEast1');
  const names = s.drawnCuts.filter((c) => c.size === 1).map((c) => c.events[0].name);
  for (const want of ['IAM / STS', 'Route 53 control plane']) {
    assert(names.some((n) => n === want), `${want} should be a single point of failure`);
  }
  // and the replicas in eu-west-1, drawn across two zones, are not the problem
  assert(!s.drawnCuts.some((c) => c.size === 1 && c.events[0].name.startsWith('app-')),
    'the replicas should not be single points of failure');
  return `single-region control planes that kill it: ${names.filter((n) => n.includes('/') || n.includes('53')).join(', ')}`;
});

check('a global config push defeats every region at once', () => {
  const s = first('frontDoor');
  const one = s.drawnCuts.filter((c) => c.size === 1).map((c) => c.events[0].name);
  assert(one.includes('Front Door'), 'the shared edge fabric should be a single point of failure');
  assert(!s.drawnCuts.some((c) => c.size === 1 && c.events[0].name.startsWith('vm-')),
    'individual VMs should not be single points of failure');
  return `kills every region: ${one.join(', ')}`;
});

// --- domain helpers -------------------------------------------------------

check('spread counts distinct failure domains, not copies', () => {
  const doc = sample('onePdu');
  const s = spread(doc, ['osd1', 'osd2', 'osd3'], 'rack');
  assert(s.count === 3, `three replicas should occupy three racks, got ${s.count}`);
  const same = spread(doc, ['osd1', 'osd1'], 'rack');
  assert(same.count === 1, 'the same replica twice is still one rack');
  return `3 replicas -> ${s.count} racks`;
});

check('commonAncestor finds the shared blast radius', () => {
  const doc = sample('threeZone');
  assert(commonAncestor(doc, ['etcd1', 'etcd2']) === 'reg', 'two zones share the region');
  assert(commonAncestor(doc, ['etcd1', 'app1']) === 'az1', 'same zone should be the zone');
  return 'region for cross-zone, zone for same-zone';
});

check('componentsIn walks the whole subtree', () => {
  const doc = sample('threeZone');
  assert(componentsIn(doc, 'reg').length === 7, 'the region holds every component');
  assert(componentsIn(doc, 'az1').length === 2, 'each zone holds two');
  return '7 under the region, 2 per zone';
});

// --- events and caching ---------------------------------------------------

check('events that hit exactly the same things are told once', () => {
  const doc = {
    domains: [{ id: 'r', name: 'rack', kind: 'rack' }],
    components: [{ id: 'h', name: 'host', role: 'replica', domain: 'r' }],
    deps: [], events: [],
  };
  const raw = eventUniverse(doc);
  assert(raw.length === 2, 'expected a component event and a domain event');
  const deduped = dedupeUniverse(raw);
  assert(deduped.length === 1, 'a rack holding one host is the same failure twice');
  assert(deduped[0].kind === 'component', 'the more specific story should survive');
  return `${raw.length} -> ${deduped.length}`;
});

check('the signature ignores anything that cannot change an answer', () => {
  const a = sample('threeZone');
  const b = JSON.parse(JSON.stringify(a));
  b.title = 'renamed';
  b.components[0].x = 999;
  b.components[0].name = 'something else';
  assert(structuralSignature(a) === structuralSignature(b), 'a cosmetic edit changed the signature');
  b.deps.push({ id: 'x', from: 'svc', to: 'etcd1', gate: 'all' });
  assert(structuralSignature(a) !== structuralSignature(b), 'a new dependency did not change the signature');
  return 'position and label out, topology and gates in';
});

check('the search reports its own bound instead of implying completeness', () => {
  const doc = { ...sample('threeZone'), settings: { maxCutSize: 2 } };
  const r = analyse(doc).services[0];
  assert(r.maxSize === 2, 'the bound was not reported back');
  assert(!r.cuts.some((c) => c.size > 2), 'a cut larger than the bound was returned');
  assert(!r.truncated, `the sample should fit the budget, searched ${r.searched}`);
  return `searched ${r.searched} combinations to size ${r.maxSize}`;
});

check('every sample stays well under the search budget', () => {
  const worst = keys.map((k) => {
    const s = analyse(sample(k)).services;
    return { k, n: Math.max(...s.map((x) => x.searched)), t: s.some((x) => x.truncated) };
  });
  for (const w of worst) assert(!w.t, `${w.k} truncated at ${w.n}`);
  const max = worst.reduce((a, b) => (a.n > b.n ? a : b));
  return `worst: ${max.k} at ${max.n} combinations`;
});
