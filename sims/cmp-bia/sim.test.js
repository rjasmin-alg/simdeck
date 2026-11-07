// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-bia. Run: node --test sims/cmp-bia/
// Rules and expected numbers: SPEC.md. Tie-breaks and boundaries first, then the rules in order, the presets (checked
// against the Python re-implementation in SPEC.md), and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => L.normalise(Object.assign({}, L.defaults, over));
const S = (over) => L.compute(Object.assign({}, L.defaults, over));
const preset = (id) => L.presets.find((x) => x.id === id).params;
const SP = (id, over) => L.compute(Object.assign({}, preset(id), over));
const sys = (s, id) => s.sys.find((x) => x.id === id);
const proc = (s, id) => s.procs.find((x) => x.id === id);
const CHAIN = { mode: 'chain' };

/** A small deterministic generator for the property tests (no Math.random in tests either). */
function lcg(seed) {
  let x = seed >>> 0;
  return (n) => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x % n; };
}
function randomParams(r) {
  const p = { mode: r(2) ? 'chain' : 'direct', margin: L.MARGINS[r(4)], pa: r(L.PA_MAX + 1), ai: r(L.AI_MAX + 1) };
  L.PROCS.forEach((x) => { p[x.key] = L.MTD_STEPS[r(L.MTD_STEPS.length)]; });
  L.SYSTEMS.forEach((id) => { p[L.sysKey(id)] = L.ACH_STEPS[r(L.ACH_STEPS.length)]; });
  return p;
}

// ── tie-breaks and boundaries first ──

test('rule 5 tie-break: equal required RTO → the smaller depth first (network, name resolution, then the shop)', () => {
  const s = S(CHAIN);
  assert.deepEqual([sys(s, 'net').req, sys(s, 'dns').req, sys(s, 'shop').req], [3, 3, 3]);
  assert.deepEqual([sys(s, 'net').depth, sys(s, 'dns').depth, sys(s, 'shop').depth], [0, 1, 2]);
  assert.deepEqual(s.order.slice(0, 3), ['net', 'dns', 'shop']);
});

test('rule 5 tie-break: equal required RTO and depth → SYSTEMS order (ERP, warehouse, e-mail)', () => {
  const s = S(CHAIN);
  for (const id of ['erp', 'wms', 'mail']) { assert.equal(sys(s, id).req, 23); assert.equal(sys(s, id).depth, 3); }
  assert.deepEqual(s.order.slice(3, 7), ['idm', 'erp', 'wms', 'mail']);
  // the order function itself, on hand-made rows that tie on everything but the list
  assert.deepEqual(L.order([{ id: 'mail', req: 5, depth: 1 }, { id: 'shop', req: 5, depth: 1 }, { id: 'dns', req: 5, depth: 1 }]),
    ['dns', 'shop', 'mail']);
});

test('rule 5 tie-break: depth before SYSTEMS order (a shop with no dependencies comes before name resolution)', () => {
  const ai = L.AI0 - Math.pow(2, L.aiBit('shop', 'dns')) - Math.pow(2, L.aiBit('shop', 'net'));
  const s = S(Object.assign({}, CHAIN, { ai: ai, mOrders: 24 }));
  for (const id of ['net', 'shop', 'dns', 'idm']) assert.equal(sys(s, id).req, 23, id);
  assert.equal(sys(s, 'shop').depth, 0);
  assert.deepEqual(s.order.slice(0, 4), ['net', 'shop', 'dns', 'idm']);
});

test('rule 4 tie-break: two processes with the same shortest MTD → the first in process order is named', () => {
  const s = S(CHAIN);                                  // dispatching 24 h and support 24 h both reach the directory
  assert.equal(sys(s, 'idm').from, 'dispatch');
  assert.equal(sys(s, 'mail').from, 'support');        // invoicing 72 h, support 24 h: the shorter wins
  assert.equal(L.compute(Object.assign({}, preset('chain'), { mDispatch: 48 })).sys.find((x) => x.id === 'idm').from, 'support');
});

test('rule 7 tie-break: equally slow systems → the smaller depth, then SYSTEMS order, is the slowest', () => {
  const s = SP('late');                                // network, name resolution and shop all take 2 h
  assert.equal(proc(s, 'orders').slow, 'net');
  const t = SP('late', { aDns: 1, aNet: 1 });          // only the shop is left at 2 h
  assert.equal(proc(t, 'orders').slow, 'shop');
});

test('rule 6 tie-break: equal largest gaps → the earlier in the recovery order is the worst', () => {
  const s = SP('late');
  assert.deepEqual(s.m.work, ['net', 'dns', 'shop']);
  for (const id of s.m.work) assert.equal(sys(s, id).gap, 1);
  assert.equal(s.m.worst, 'net');
});

test('boundaries: achieved = required is no gap; back = MTD is in time', () => {
  const s = S(Object.assign({}, CHAIN, { aDns: 2, aIdm: 24 }));   // directory: required 23, achieved 24 → gap 1
  assert.equal(sys(s, 'idm').gap, 1);
  const t = S(Object.assign({}, CHAIN, { margin: 0, aDns: 4, aIdm: 24 }));
  assert.equal(sys(t, 'dns').req, 4);
  assert.equal(sys(t, 'dns').gap, 0);
  assert.equal(t.m.work.indexOf('dns'), -1);
  assert.equal(proc(t, 'orders').back, 4);             // 0 h + 4 h = MTD 4 h
  assert.equal(proc(t, 'orders').within, true);
  assert.equal(proc(t, 'dispatch').back, 24);
  assert.equal(proc(t, 'dispatch').within, true);
});

test('rule 8 tie-break: a value between two steps goes to the smaller', () => {
  assert.equal(P({ mOrders: 6 }).mOrders, 4);          // 4 and 8
  assert.equal(P({ aShop: 3 }).aShop, 2);              // 2 and 4
  assert.equal(P({ aShop: 3.1 }).aShop, 4);
  assert.equal(P({ mPayroll: 'x' }).mPayroll, L.defaults.mPayroll);
});

test('rule 7 tie-break: equally slow → the smaller depth wins, even listed later', () => {
  const ai = L.AI0 - Math.pow(2, L.aiBit('erp', 'dns')) - Math.pow(2, L.aiBit('erp', 'net')) - Math.pow(2, L.aiBit('wms', 'idm'));
  const s = S(Object.assign({}, CHAIN, { ai: ai, aIdm: 48, aWms: 48, aErp: 2 }));
  assert.equal(sys(s, 'idm').depth, 2);
  assert.equal(sys(s, 'wms').depth, 1);
  assert.equal(proc(s, 'dispatch').slow, 'wms');
});

test('rule 7 tie-break: equally slow and equally deep → SYSTEMS order (ERP before warehouse)', () => {
  const s = S(Object.assign({}, CHAIN, { aErp: 48, aWms: 48, aIdm: 12 }));
  assert.equal(proc(s, 'dispatch').slow, 'erp');
});

test('rule 9 boundary and order: nMargin takes achieved = MTD, and the first in the recovery order', () => {
  assert.equal(L.marginGap(S(Object.assign({}, CHAIN, { aDns: 4, aIdm: 12 }))), 'dns');   // 4 h = MTD 4 h
  assert.equal(L.marginGap(S(Object.assign({}, CHAIN, { aDns: 2, aShop: 4, aIdm: 24 }))), 'shop');   // before the directory
});

test('rule 6: the work list and the broken list follow the recovery order, not SYSTEMS', () => {
  assert.deepEqual(S(Object.assign({}, CHAIN, { aShop: 6 })).m.work, ['dns', 'shop', 'idm']);
  assert.equal(S({ mPayroll: 4, mOrders: 24 }).m.broken[0], 'pay');
});

test('rule 9: nAllOk only when some system has an RTO (every edge removed: nothing to meet)', () => {
  const s = S(Object.assign({}, CHAIN, { pa: 0 }));
  assert.equal(s.m.within, 5);
  assert.deepEqual(L.captionKey(s).notes, []);
});

// ── rules in order ──

test('rule 1: five processes, five applications, three infrastructure services; SYSTEMS puts the infrastructure first', () => {
  assert.equal(L.PROCS.length, 5);
  assert.equal(L.APPS.length, 5);
  assert.equal(L.INFRA.length, 3);
  assert.deepEqual(L.SYSTEMS, ['net', 'dns', 'idm', 'shop', 'erp', 'wms', 'mail', 'pay']);
});

test('rule 2: edges are bits; the default masks hold exactly the drawn pairs; the infrastructure chain is fixed', () => {
  const p = P({});
  assert.equal(L.paBit('orders', 'shop'), 0);
  assert.equal(L.paBit('support', 'pay'), 24);
  assert.equal(L.aiBit('pay', 'net'), 14);
  let pa = 0, ai = 0;
  for (const x of L.PROCS) for (const a of L.APPS) if (L.hasEdge(p, x.id, a.id)) pa++;
  for (const a of L.APPS) for (const i of L.INFRA) if (L.hasEdge(p, a.id, i.id)) ai++;
  assert.equal(pa, 7);
  assert.equal(ai, 12);
  assert.equal(L.hasEdge(p, 'orders', 'shop'), true);
  assert.equal(L.hasEdge(p, 'orders', 'erp'), false);
  assert.equal(L.hasEdge(p, 'shop', 'idm'), false);
  assert.equal(L.hasEdge(p, 'idm', 'dns'), true);
  assert.equal(L.hasEdge(p, 'dns', 'net'), true);
  assert.equal(L.hasEdge(p, 'idm', 'net'), false);
  assert.equal(L.hasEdge(p, 'net', 'dns'), false);
  assert.deepEqual(L.adjacency(p).idm, ['dns']);
  assert.deepEqual(L.adjacency(p).net, []);
});

test('rule 2: toggle adds and removes one edge and nothing else; fixed and upward edges do not toggle', () => {
  const p = P({});
  const on = Object.assign({}, p, L.toggle(p, 'shop', 'idm'));
  assert.equal(on.ai, p.ai + Math.pow(2, L.aiBit('shop', 'idm')));
  assert.equal(L.hasEdge(on, 'shop', 'idm'), true);
  const off = Object.assign({}, on, L.toggle(on, 'shop', 'idm'));
  assert.equal(off.ai, p.ai);
  const cut = Object.assign({}, p, L.toggle(p, 'orders', 'shop'));
  assert.equal(cut.pa, p.pa - 1);
  assert.deepEqual(L.toggle(p, 'idm', 'dns'), {});
  assert.deepEqual(L.toggle(p, 'shop', 'orders'), {});
  assert.deepEqual(L.toggle(p, 'orders', 'idm'), {});   // processes reach infrastructure only through applications
});

test('rule 3: the closure follows the graph through applications and the infrastructure chain, in SYSTEMS order', () => {
  const adj = L.adjacency(P({}));
  assert.deepEqual(L.closure(adj, 'orders'), ['net', 'dns', 'shop']);
  assert.deepEqual(L.closure(adj, 'payroll'), ['net', 'dns', 'idm', 'pay']);   // the directory brings name resolution
  assert.deepEqual(L.closure(adj, 'idm'), ['net', 'dns']);
  assert.deepEqual(L.closure(adj, 'net'), []);
});

test('rule 3: direct counts only processes with an edge to the system; chain every process whose closure holds it', () => {
  const adj = L.adjacency(P({}));
  assert.deepEqual(L.dependents(adj, 'direct', 'net'), []);
  assert.deepEqual(L.dependents(adj, 'chain', 'net'), ['orders', 'dispatch', 'invoice', 'payroll', 'support']);
  assert.deepEqual(L.dependents(adj, 'direct', 'erp'), ['dispatch', 'invoice']);
  assert.deepEqual(L.dependents(adj, 'chain', 'idm'), ['dispatch', 'invoice', 'payroll', 'support']);
});

test('rule 4: required RTO = the shortest MTD among the dependents less the margin; null without dependents; never below 0', () => {
  const s = S(CHAIN);
  assert.equal(sys(s, 'pay').req, 168 - 1);
  assert.equal(sys(s, 'net').req, 4 - 1);
  assert.equal(sys(s, 'idm').req, 24 - 1);
  const d = S({});
  assert.equal(sys(d, 'net').req, null);
  assert.equal(sys(d, 'net').from, null);
  assert.equal(sys(d, 'shop').req, 3);
  const raw = Object.assign({}, P(CHAIN), { margin: 9 });      // outside the params' range, to see the floor
  assert.equal(L.required(raw, L.adjacency(raw), 'net').req, 0);
  // with no edge to the payroll system it has no dependents at all, in either mode
  const p = P(Object.assign({}, CHAIN, { pa: L.PA0 - Math.pow(2, L.paBit('payroll', 'pay')) }));
  const t = L.compute(p);
  assert.equal(sys(t, 'pay').req, null);
  assert.deepEqual(sys(t, 'pay').users, []);
});

test('rule 4: a longer MTD on the process that set the requirement hands it to the next shortest', () => {
  assert.equal(sys(S(CHAIN), 'dns').req, 3);
  const s = S(Object.assign({}, CHAIN, { mOrders: 48 }));
  assert.equal(sys(s, 'dns').req, 23);
  assert.equal(sys(s, 'dns').from, 'dispatch');
});

test('rule 5: systems without a required RTO go last, by depth', () => {
  const s = S({});
  assert.deepEqual(s.order, ['shop', 'erp', 'wms', 'mail', 'pay', 'net', 'dns', 'idm']);
  assert.deepEqual(s.order.map((id) => sys(s, id).pos), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('rule 5: in chain mode the order never restores a system before one it needs; direct mode can', () => {
  const r = lcg(7);
  for (let k = 0; k < 400; k++) {
    const s = L.compute(Object.assign(randomParams(r), CHAIN));
    for (const x of s.sys) assert.deepEqual(x.waits, [], `chain case ${k}: ${x.id}`);
    assert.deepEqual(s.m.broken, []);
  }
  const d = S({});
  assert.deepEqual(sys(d, 'shop').waits, ['net', 'dns']);
  assert.deepEqual(d.m.broken, ['shop', 'erp', 'wms', 'mail', 'pay']);   // the unrated infrastructure still sorts by depth
});

test('rule 6: gap = achieved − required when positive, 0 when within, null without a requirement; the work list is in recovery order', () => {
  const s = S(CHAIN);
  assert.equal(sys(s, 'dns').gap, 8 - 3);
  assert.equal(sys(s, 'idm').gap, 48 - 23);
  assert.equal(sys(s, 'net').gap, 0);
  assert.deepEqual(s.m.work, ['dns', 'idm']);
  assert.equal(s.m.worst, 'idm');
  const d = S({});
  assert.equal(sys(d, 'idm').gap, null);
  assert.deepEqual(d.m.work, []);
  assert.deepEqual(d.m.unrated, ['net', 'dns', 'idm']);
});

test('rule 6: unrated counts only systems some process needs', () => {
  const p = Object.assign({}, CHAIN, { pa: L.PA0 - Math.pow(2, L.paBit('payroll', 'pay')) });
  assert.deepEqual(S(p).m.unrated, []);                        // the payroll system: no RTO, but nobody needs it
});

test('rule 7: a process is back after the margin plus its slowest dependency; with no dependency, after the margin', () => {
  const s = S(CHAIN);
  assert.equal(proc(s, 'orders').back, 1 + 8);
  assert.equal(proc(s, 'orders').slow, 'dns');
  assert.equal(proc(s, 'orders').within, false);
  assert.equal(proc(s, 'invoice').back, 1 + 48);
  assert.equal(proc(s, 'invoice').within, true);
  const lone = S(Object.assign({}, CHAIN, { pa: L.PA0 - 1 }));   // taking orders without the shop
  assert.equal(proc(lone, 'orders').back, 1);
  assert.equal(proc(lone, 'orders').slow, null);
  assert.deepEqual(proc(lone, 'orders').deps, []);
});

test('rule 7: the outcome is the same in both modes (the analysis does not change the graph)', () => {
  const r = lcg(11);
  for (let k = 0; k < 100; k++) {
    const p = randomParams(r);
    assert.deepEqual(L.compute(Object.assign({}, p, { mode: 'chain' })).procs, L.compute(Object.assign({}, p, { mode: 'direct' })).procs);
  }
});

test('rules 4–7: in chain mode, an empty work list ⇔ every process in time; direct mode breaks it', () => {
  const r = lcg(3);
  for (let k = 0; k < 600; k++) {
    const s = L.compute(Object.assign(randomParams(r), CHAIN));
    assert.equal(s.m.work.length === 0, s.m.within === 5, `case ${k}`);
    // and every late process has a system with a gap in its closure
    for (const x of s.procs) if (!x.within) assert.ok(x.deps.some((id) => sys(s, id).gap > 0), `case ${k} ${x.id}`);
  }
  const d = S({});
  assert.deepEqual(d.m.work, []);
  assert.equal(d.m.within, 2);
});

test('rule 8: params made safe: unknown mode and margin fall back, masks are clamped, stepList stops at the ends', () => {
  const p = P({ mode: 'all', margin: 7, pa: -5, ai: 1e9 });
  assert.equal(p.mode, 'direct');
  assert.equal(p.margin, 1);
  assert.equal(p.pa, 0);
  assert.equal(p.ai, L.AI_MAX);
  assert.equal(P({ margin: '2' }).margin, 2);
  assert.equal(P({ margin: '' }).margin, 1);                   // empty → default, not 0
  assert.equal(P({ pa: 2.6 }).pa, 3);
  assert.equal(P({ pa: 1e12 }).pa, L.PA_MAX);
  assert.equal(P({ ai: -1 }).ai, 0);
  assert.equal(L.stepList(L.MTD_STEPS, 4, -1), 4);
  assert.equal(L.stepList(L.MTD_STEPS, 4, 1), 8);
  assert.equal(L.stepList(L.ACH_STEPS, 168, 1), 168);
  assert.equal(L.stepList(L.ACH_STEPS, 5, 1), 6);              // off the list: from the nearest (4) one up
});

test('rule 9: caption notes, direct mode: unrated (with the late process, else any), the broken order, a late process', () => {
  assert.deepEqual(L.captionKey(S({})), { key: 'capEmpty', notes: ['nUnrated', 'nWaits'] });
  assert.deepEqual(L.unratedLate(S({})), { proc: 'orders', sys: 'dns' });
  const ok = S({ aDns: 2, aIdm: 12 });                         // the fixed estate, read by direct users
  assert.equal(ok.m.within, 5);
  assert.deepEqual(L.captionKey(ok), { key: 'capEmpty', notes: ['nUnratedAny', 'nWaits'] });
  // late, but the slowest system has an RTO (the shop is slow): nUnratedAny, and nMiss comes third and is cut
  const shop = S({ aDns: 2, aIdm: 12, aShop: 6 });
  assert.equal(L.unratedLate(shop), null);
  assert.deepEqual(L.captionKey(shop), { key: 'capMain', notes: ['nUnratedAny', 'nWaits'] });
});

test('rule 9: caption notes, chain mode: a late process, a gap only the margin opens, inheritance, all in time', () => {
  assert.deepEqual(L.captionKey(SP('chain')), { key: 'capMain', notes: ['nMiss', 'nInherit'] });
  assert.deepEqual(L.captionKey(SP('fixed')), { key: 'capEmpty', notes: ['nInherit', 'nAllOk'] });
  assert.deepEqual(L.captionKey(SP('late')), { key: 'capMain', notes: ['nMiss', 'nMargin'] });
  assert.equal(L.marginGap(SP('late')), 'net');
  assert.equal(L.marginGap(SP('chain')), null);                // name resolution: 8 h > MTD 4 h, not only the margin
  assert.equal(L.marginGap(SP('late', { margin: 0 })), null);
  assert.equal(L.inherited(SP('chain')), 'net');
  assert.equal(L.inherited(S({})), null);
});

// ── presets (SPEC.md table) ──

test('presets: within, work list, worst, order', () => {
  const want = {
    direct: { within: 2, work: [], worst: null, first: 'shop' },
    chain: { within: 2, work: ['dns', 'idm'], worst: 'idm', first: 'net' },
    hidden: { within: 2, work: ['dns', 'idm'], worst: 'idm', first: 'net' },
    fixed: { within: 5, work: [], worst: null, first: 'net' },
    late: { within: 4, work: ['net', 'dns', 'shop'], worst: 'net', first: 'net' }
  };
  for (const x of L.presets) {
    const s = L.compute(x.params), w = want[x.id];
    assert.equal(s.m.within, w.within, x.id);
    assert.deepEqual(s.m.work, w.work, x.id);
    assert.equal(s.m.worst, w.worst, x.id);
    assert.equal(s.order[0], w.first, x.id);
  }
  const h = SP('hidden');
  assert.equal(sys(h, 'idm').req, 3);
  assert.equal(sys(h, 'idm').gap, 45);
  assert.equal(sys(h, 'idm').from, 'orders');
  assert.deepEqual(h.order, ['net', 'dns', 'idm', 'shop', 'erp', 'wms', 'mail', 'pay']);
  assert.equal(proc(h, 'orders').back, 49);
  assert.deepEqual(SP('direct').procs.map((x) => x.back), [9, 49, 49, 49, 49]);
  assert.deepEqual(SP('fixed').procs.map((x) => x.back), [3, 13, 13, 49, 13]);
  assert.deepEqual(SP('late').procs.map((x) => x.back), [5, 15, 15, 51, 15]);
  assert.deepEqual(L.defaults, preset('direct'));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [L.defaults].concat(L.presets.map((x) => x.params))) {
    const s = L.initial(Object.assign({}, p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = Object.assign({}, preset('hidden'));
  const copy = structuredClone(p);
  assert.deepEqual(L.compute(p), L.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(L, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every node, preset, caption and note has its words; the page uses the model\'s presets; preset params are model params', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="strings\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const keys = ['capMain', 'capEmpty', 'nUnrated', 'nUnratedAny', 'nWaits', 'nMiss', 'nMargin', 'nInherit', 'nAllOk'];
  for (const lang of ['hr', 'en']) {
    for (const x of L.PROCS) assert.ok(strings[lang]['proc_' + x.id], `${lang} proc_${x.id}`);
    for (const id of L.SYSTEMS) for (const k of ['sys_', 'short_']) assert.ok(strings[lang][k + id], `${lang} ${k}${id}`);
    for (const k of keys) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of L.presets) {
      const k = 'p' + x.id[0].toUpperCase() + x.id.slice(1);
      assert.ok(strings[lang][k], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][k + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
  for (const x of L.presets) for (const k of Object.keys(x.params)) assert.ok(k in L.defaults, `${x.id}: ${k}`);
});
