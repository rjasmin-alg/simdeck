// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ad-sites' model (SPEC.md). Run: node --test sims/win-ad-sites/
// Tie-breaks first, then one test per rule, then the presets' numbers (checked by an independent hand model, NOTES.md
// "Checks"), then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const MIN = 60;
const tOf = (s, dc) => s.arrival[dc].t;
const treeOf = (s) => s.tree.map((e) => [e.a, e.b].sort().join('-')).sort();

// ── tie-breaks ──

test('tie-break (rule 5): equal-cost paths, fewer hops wins over the alphabetical order', () => {
  const links = logic.linksOf(P({ linkBC: true, costHC: 200, costHB: 100, costBC: 100 }));
  // HQ→Colo: direct 200, or HQ>Branch>Colo 200; "HQ>Branch>Colo" sorts first, but the direct link has fewer hops
  const p = logic.bestPath(links, 'HQ', 'Colo');
  assert.deepEqual(p.sites, ['HQ', 'Colo']);
  assert.equal(p.cost, 200);
});

test('tie-break (rule 5): the tree prefers a one-link edge over an equal-cost bridged one, then the alphabetical pair', () => {
  const tree = logic.spanningTree([
    { a: 'Alpha', b: 'Beta', cost: 100, links: ['x', 'y'] },
    { a: 'Alpha', b: 'Gamma', cost: 100, links: ['z'] },
    { a: 'Beta', b: 'Gamma', cost: 100, links: ['w'] }
  ]);
  assert.deepEqual(tree.map((e) => e.a + '-' + e.b), ['Alpha-Gamma', 'Beta-Gamma']);
  // all one link and equal: alphabetical pairs, Branch-Colo and Branch-HQ before Colo-HQ
  assert.deepEqual(treeOf(S({ linkBC: true })), ['Branch-Colo', 'Branch-HQ']);
});

test('tie-break (rule 8): equal-cost coverage goes to the alphabetically first site', () => {
  const s = S({ hqDcs: false });
  assert.equal(s.clients.HQ.how, 'coverage');
  assert.equal(s.clients.HQ.coveredBy, 'Branch');
  assert.deepEqual(s.clients.HQ.dcs, ['DC04']);
  // a cheaper link to Colo wins over the name
  assert.equal(S({ hqDcs: false, costHC: 99 }).clients.HQ.coveredBy, 'Colo');
});

test('tie-break (rule 8): equal-cost coverage prefers the site with more DCs, before the name', () => {
  const sites = [{ id: 'X', dcs: [], subnets: ['10.0.0.0/8'] }, { id: 'A', dcs: ['DC10'], subnets: [] }, { id: 'B', dcs: ['DC20', 'DC21'], subnets: [] }];
  const links = [{ id: 'XA', a: 'X', b: 'A', cost: 100, intervalMin: 180 }, { id: 'XB', a: 'X', b: 'B', cost: 100, intervalMin: 180 }];
  assert.equal(logic.locate(sites, links, 'X').coveredBy, 'B');
  sites[2].dcs = ['DC20'];
  assert.equal(logic.locate(sites, links, 'X').coveredBy, 'A');
});

test('tie-break: equal arrival times, the DC processed first (by name) delivers', () => {
  // password at Colo: DC03 (origin) and DC01 (PDC) both at 0; DC04 is 180 min from either, over HB or BC
  const s = S({ linkBC: true, origin: 'Colo' });
  assert.equal(tOf(s, 'DC04'), 180 * MIN);
  assert.equal(s.arrival.DC04.from.dc, 'DC01');
  assert.deepEqual(s.arrival.DC04.from.edge.sites, ['HQ', 'Branch']);
});

test('tie-break: equal arrival times keep the first found (the DC itself as a source before any copy)', () => {
  // fresh password: DC01 is the PDC, a source at 0; the replication from Branch later does not replace it
  const s = S({ origin: 'Branch' });
  assert.equal(tOf(s, 'DC01'), 0);
  assert.equal(s.arrival.DC01.from.kind, 'pdc');
});

// ── rules ──

test('rule 1: inside a site the change arrives 15 s later, by change notification', () => {
  const s = S({});
  assert.equal(tOf(s, 'DC01'), 0);
  assert.equal(tOf(s, 'DC02'), 15);
  assert.equal(s.arrival.DC02.from.kind, 'intra');
  assert.equal(s.arrival.DC02.from.dc, 'DC01');
});

test('rule 2: between sites a bridgehead waits a whole interval (worst case), whatever the cost', () => {
  assert.equal(tOf(S({}), 'DC04'), 180 * MIN);
  assert.equal(tOf(S({ intervalHB: 15 }), 'DC04'), 15 * MIN);
  assert.equal(tOf(S({ costHB: 500 }), 'DC04'), 180 * MIN);
  assert.equal(S({}).arrival.DC04.from.kind, 'inter');
});

test('bridgeheads: one per site with DCs, the first by name', () => {
  assert.deepEqual(S({}).bridgeheads, { HQ: 'DC01', Branch: 'DC04', Colo: 'DC03' });
  assert.deepEqual(S({ hqDcs: false }).bridgeheads, { Branch: 'DC04', Colo: 'DC03' });
});

test('rule 3: the KCC replicates over the least-cost tree, not the shortest interval', () => {
  // direct Branch–Colo costs 300 with a 15 min interval; through HQ 100 + 100: the tree goes through HQ
  const s = S({ linkBC: true, costBC: 300, intervalBC: 15, origin: 'Branch', password: false });
  assert.deepEqual(treeOf(s), ['Branch-HQ', 'Colo-HQ']);
  assert.equal(tOf(s, 'DC03'), 360 * MIN);
  assert.equal(logic.linkUsed(s, 'BC'), false);
  // cheaper than either other link: the tree takes it
  const t = S({ linkBC: true, costBC: 99, intervalBC: 15, origin: 'Branch', password: false });
  assert.ok(logic.linkUsed(t, 'BC'));
  assert.equal(tOf(t, 'DC03'), 15 * MIN);
});

test('rule 3: one tree over all sites, so a pair can replicate the long way round (cost 150 < 200, still via HQ)', () => {
  const s = S({ linkBC: true, costBC: 150, intervalBC: 15, origin: 'Branch', password: false });
  assert.deepEqual(treeOf(s), ['Branch-HQ', 'Colo-HQ']);
  assert.equal(logic.bestPath(s.links, 'Branch', 'Colo').cost, 150);
  assert.equal(tOf(s, 'DC03'), 360 * MIN);
});

test('rule 3: bridging joins sites across a site without DCs, at the larger interval; without it they never replicate', () => {
  const on = S({ hqDcs: false, intervalHC: 60, origin: 'Branch', password: false });
  assert.deepEqual(treeOf(on), ['Branch-Colo']);
  assert.equal(on.tree[0].bridged, true);
  assert.deepEqual(on.tree[0].links, ['HB', 'HC']);
  assert.equal(on.tree[0].cost, 200);
  assert.equal(tOf(on, 'DC03'), 180 * MIN); // max(180, 60), not 240
  const off = S({ hqDcs: false, intervalHC: 60, origin: 'Branch', password: false, bridging: false });
  assert.deepEqual(off.tree, []);
  assert.equal(tOf(off, 'DC03'), null);
  // without bridging a direct link still works
  const direct = S({ hqDcs: false, bridging: false, linkBC: true, costBC: 300, intervalBC: 45, origin: 'Branch', password: false });
  assert.equal(tOf(direct, 'DC03'), 45 * MIN);
});

test('rule 3: with DCs in every site, bridging changes nothing here (store and forward through HQ)', () => {
  const on = S({ origin: 'Branch', password: false });
  const off = S({ origin: 'Branch', password: false, bridging: false });
  for (const dc of logic.ALL_DCS) assert.equal(tOf(on, dc), tOf(off, dc));
});

test('rule 4: arrival = intra-site at the origin + intervals along the tree + intra-site at the destination', () => {
  const s = S({ intervalHC: 60, origin: 'Branch', password: false });
  assert.equal(tOf(s, 'DC01'), 180 * MIN);
  assert.equal(tOf(s, 'DC02'), 180 * MIN + 15);
  assert.equal(tOf(s, 'DC03'), 240 * MIN);
  // a change made on a DC that is not the bridgehead first crosses its own site
  const st = S({});
  const arr = logic.arrivals(st.sites, st.tree, [{ dc: 'DC02', kind: 'origin' }]);
  assert.equal(arr.DC01.t, 15);
  assert.equal(arr.DC04.t, 15 + 180 * MIN);
  assert.equal(arr.DC03.t, 15 + 180 * MIN);
});

test('routes are told in the direction of travel', () => {
  const s = S({ intervalHC: 60, origin: 'Branch', password: false });
  assert.deepEqual(s.arrival.DC01.from.edge.sites, ['Branch', 'HQ']);
  assert.deepEqual(s.arrival.DC03.from.edge.sites, ['HQ', 'Colo']);
  const b = S({ hqDcs: false, origin: 'Colo', password: false });
  assert.deepEqual(b.arrival.DC04.from.edge.sites, ['Colo', 'HQ', 'Branch']);
  assert.deepEqual(b.arrival.DC04.from.edge.links, ['HC', 'HB']);
});

test('rule 6: a client in a subnet gets a DC of its site; without subnets, any DC', () => {
  const s = S({});
  assert.deepEqual(s.clients.Branch, Object.assign({}, s.clients.Branch, { how: 'site', site: 'Branch', dcs: ['DC04'] }));
  assert.deepEqual(s.clients.HQ.dcs, ['DC01', 'DC02']);
  const n = S({ subnets: false });
  for (const sid of logic.SITES) {
    assert.equal(n.clients[sid].how, 'any');
    assert.equal(n.clients[sid].site, null);
    assert.deepEqual(n.clients[sid].dcs, ['DC01', 'DC02', 'DC03', 'DC04']);
  }
});

test('rule 7: a password goes to the PDC at once; a DC without it sends the logon to the PDC', () => {
  const s = S({ origin: 'Branch', clock: 5 * MIN });
  assert.equal(tOf(s, 'DC04'), 0);
  assert.equal(tOf(s, 'DC01'), 0);
  assert.equal(tOf(s, 'DC02'), 15);
  assert.equal(tOf(s, 'DC03'), 180 * MIN); // from the PDC over HQ–Colo, not 360 through Branch and HQ
  assert.equal(s.clients.Colo.logon, 'pdc');
  assert.deepEqual(s.clients.Colo.lacking, ['DC03']);
  assert.equal(s.clients.Branch.logon, 'local');
  assert.equal(S({ origin: 'Branch', clock: 180 * MIN }).clients.Colo.logon, 'local');
  // any other attribute waits for replication
  const ph = S({ origin: 'Branch', password: false });
  assert.equal(tOf(ph, 'DC01'), 180 * MIN);
  assert.equal(tOf(ph, 'DC03'), 360 * MIN);
  assert.equal(ph.clients.Colo.logon, null);
  // no subnets: some DCs have it, some send the logon on
  assert.equal(S({ subnets: false, clock: 60 }).clients.Branch.logon, 'depends');
});

test('rule 7: without DCs at HQ the PDC is DC03; a change there needs no urgent copy', () => {
  const s = S({ hqDcs: false, origin: 'Colo' });
  assert.equal(s.pdc, 'DC03');
  assert.equal(s.change.dc, 'DC03');
  assert.equal(tOf(s, 'DC04'), 180 * MIN);
});

test('rule 8: a site without DCs is covered by the nearest site; a change there is made on that DC', () => {
  const s = S({ hqDcs: false, origin: 'HQ' });
  assert.equal(s.change.dc, 'DC04');
  assert.equal(s.change.covered, true);
  assert.equal(tOf(s, 'DC01'), null);
  assert.equal(s.has.DC01, false);
  // the covering DC does not depend on the clients' subnets
  assert.equal(S({ hqDcs: false, subnets: false, origin: 'HQ' }).change.dc, 'DC04');
});

test('clock: who has the change, the next and the last arrival, the packets now', () => {
  const s = S({ clock: 15 });
  assert.deepEqual(logic.ALL_DCS.filter((d) => s.has[d]), ['DC01', 'DC02']);
  assert.equal(logic.nextArrival(s), 180 * MIN);
  assert.equal(logic.lastArrival(s), 180 * MIN);
  assert.deepEqual(logic.arrivingNow(s), ['DC02']);
  const end = S({ clock: 180 * MIN });
  assert.equal(logic.nextArrival(end), null);
  assert.deepEqual(logic.arrivingNow(end), ['DC03', 'DC04']);
  assert.deepEqual(logic.arrivingNow(S({ clock: 0 })), []); // the origin itself is not a packet
  assert.deepEqual(logic.arrivingNow(S({ clock: 0, origin: 'Branch' })), ['DC01']); // the urgent copy to the PDC
  assert.equal(logic.lastArrival(S({ hqDcs: false, bridging: false, origin: 'Branch', password: false })), 0);
});

test('diff marks the DCs, clients and links that changed', () => {
  const a = S({ clock: 15 }), b = S({ clock: 15, intervalHB: 60 });
  assert.deepEqual(logic.diff(a, b), { dcs: ['DC04'], clients: [], links: [] });
  assert.deepEqual(logic.diff(S({ clock: 0 }), S({ clock: 15 })).dcs, ['DC02']);
  const c = logic.diff(S({ linkBC: true, costBC: 300 }), S({ linkBC: true, costBC: 50 }));
  assert.deepEqual(c.links.sort(), ['BC', 'HC']); // BC joins the tree; HC (Colo-HQ) loses the tie to Branch-HQ
  assert.deepEqual(logic.diff(S({}), S({ subnets: false })).clients, ['HQ', 'Branch', 'Colo']);
  assert.deepEqual(logic.diff(null, S({})), { dcs: [], clients: [], links: [] });
  // a logon that no longer needs the PDC marks the client
  assert.ok(logic.diff(S({ origin: 'Branch', clock: 300 }), S({ origin: 'Branch', clock: 180 * MIN })).clients.includes('Colo'));
});

// ── presets (numbers from the hand model) ──

const PRESETS = {
  'two-sites': [{ clock: 15 }, { DC01: 0, DC02: 15, DC03: 180 * MIN, DC04: 180 * MIN }, ['Branch-HQ', 'Colo-HQ']],
  'hub-spoke': [{ intervalHC: 60, origin: 'Branch', password: false }, { DC01: 180 * MIN, DC02: 180 * MIN + 15, DC03: 240 * MIN, DC04: 0 }, ['Branch-HQ', 'Colo-HQ']],
  'cheap-detour': [{ linkBC: true, costBC: 300, intervalBC: 15, origin: 'Branch', password: false }, { DC01: 180 * MIN, DC02: 180 * MIN + 15, DC03: 360 * MIN, DC04: 0 }, ['Branch-HQ', 'Colo-HQ']],
  'empty-middle': [{ hqDcs: false, intervalHC: 60, origin: 'Branch', password: false }, { DC01: null, DC02: null, DC03: 180 * MIN, DC04: 0 }, ['Branch-Colo']],
  'no-subnets': [{ subnets: false, clock: 60 }, { DC01: 0, DC02: 15, DC03: 180 * MIN, DC04: 180 * MIN }, ['Branch-HQ', 'Colo-HQ']],
  'fresh-password': [{ origin: 'Branch', clock: 300 }, { DC01: 0, DC02: 15, DC03: 180 * MIN, DC04: 0 }, ['Branch-HQ', 'Colo-HQ']]
};

test('presets: arrival times and trees as SPEC.md', () => {
  for (const [id, [over, want, tree]] of Object.entries(PRESETS)) {
    const s = S(over);
    for (const dc of logic.ALL_DCS) assert.equal(tOf(s, dc), want[dc], `${id} ${dc}`);
    assert.deepEqual(treeOf(s), tree, id);
  }
});

test('presets in the page match the ones tested here', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  for (const id of Object.keys(PRESETS)) assert.ok(html.includes(`id: '${id}'`), id);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const over of [{}].concat(Object.values(PRESETS).map((x) => x[0]))) {
    const s = S(over);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ linkBC: true, costBC: 150, origin: 'Colo' });
  const copy = structuredClone(p);
  const a = logic.initial(p), b = logic.initial(p);
  assert.deepEqual(a, b);
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), a);
});

test('every param combination of the toggles and origins gives a valid state', () => {
  for (const linkBC of [false, true]) for (const bridging of [false, true]) for (const subnets of [false, true])
    for (const hqDcs of [false, true]) for (const password of [false, true]) for (const origin of logic.SITES) {
      const s = S({ linkBC, bridging, subnets, hqDcs, password, origin, costBC: 150 });
      assert.ok(s.change.dc, 'a change is always made somewhere');
      assert.equal(tOf(s, s.change.dc), 0);
      for (const dc of logic.ALL_DCS) {
        const t = tOf(s, dc);
        assert.ok(t === null || (t >= 0 && t <= 720 * MIN + 15));
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
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined, 'an explorer has no steps');
  assert.equal(logic.steps, 0);
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
