// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-restore-evidence. Run: node --test sims/cmp-restore-evidence/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules in order, the presets (checked against the
// Python re-implementation in SPEC.md), the evidence-trail model copied from cmp-policy-to-record, and the
// template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const trail = require('./trail.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.compute(P(over));
const preset = (id) => L.presets.find((x) => x.id === id).params;
const ix = (id) => L.SYSTEMS.findIndex((s) => s.id === id);
const ids = (list) => list.map((i) => L.SYSTEMS[i].id);
const sched = (s) => [0, 1, 2, 3].map((q) => s.recs.filter((r) => r.q === q).map((r) => L.SYSTEMS[r.sys].id).join(','));
/** A hand-made plan's mask from [[system id, quarter], …]. */
const mask = (cells) => cells.reduce((m, [id, q]) => m + Math.pow(2, L.bitIndex(ix(id), q)), 0);

// ── tie-breaks first ──

test('rule 2: critical first: tier, then RTO, then inventory order; a total order', () => {
  const all = L.SYSTEMS.map((s, i) => i);
  assert.deepEqual(ids(all.slice().sort((a, b) => L.before('crit', a, b))),
    ['shop', 'idm', 'wms', 'erp', 'files', 'mail', 'pay', 'crm', 'wiki', 'print', 'dev', 'arch']);
  // shop and idm share tier 1 and RTO 4 h: the inventory order decides (shop is listed first)
  assert.ok(L.before('crit', ix('shop'), ix('idm')) < 0);
  // files, mail, pay, crm share tier 2 and 24 h
  assert.ok(L.before('crit', ix('mail'), ix('pay')) < 0);
  for (const i of all) assert.equal(L.before('crit', i, i), 0);
});

test('rule 2: quickest first: restore time, then inventory order; as listed and own: inventory order', () => {
  const all = L.SYSTEMS.map((s, i) => i);
  assert.deepEqual(ids(all.slice().sort((a, b) => L.before('easy', a, b))),
    ['print', 'wiki', 'shop', 'idm', 'wms', 'dev', 'files', 'crm', 'erp', 'mail', 'arch', 'pay']);
  assert.deepEqual(all.slice().sort((a, b) => L.before('list', b, a) * -1), all);
  assert.deepEqual(all.slice().reverse().sort((a, b) => L.before('own', a, b)), all);
  // equal times would fall back to the inventory order (no two systems share a time, so test it on the comparator)
  assert.ok(L.before('easy', ix('files'), ix('files')) === 0);
});

test('rule 3: the rotation: fewest tests so far first, the order only breaks ties', () => {
  // six slots: the first quarter takes the six first in the order, the second the other six, then again
  const s = S({ order: 'crit', slots: 6 });
  assert.deepEqual(sched(s), ['shop,idm,wms,erp,files,mail', 'pay,crm,wiki,print,dev,arch',
    'shop,idm,wms,erp,files,mail', 'pay,crm,wiki,print,dev,arch']);
  // four slots: 16 tests, every system once before anything twice; the second round starts at the top of the order
  const f = S({ order: 'crit', slots: 4 });
  assert.deepEqual(sched(f), ['shop,idm,wms,erp', 'files,mail,pay,crm', 'wiki,print,dev,arch', 'shop,idm,wms,erp']);
});

test('rule 3: a hand-made plan takes each quarter in inventory order and keeps the first `slots` of a full one', () => {
  const plan = mask([['arch', 0], ['shop', 0], ['files', 0], ['erp', 1]]);
  assert.deepEqual(sched(S({ order: 'own', slots: 3, plan })), ['files,shop,arch', 'erp', '', '']);
  assert.deepEqual(sched(S({ order: 'own', slots: 2, plan })), ['files,shop', 'erp', '', ''], 'arch dropped');
  assert.deepEqual(sched(S({ order: 'own', slots: 0, plan })), ['', '', '', '']);
});

test('rule 5: a restore equal to the RTO is in time; one hour more is slow', () => {
  // idm: 4 h against 4 h, once its failing backup is repaired
  const s = S({ order: 'own', slots: 1, plan: mask([['idm', 0], ['idm', 1]]) });
  assert.deepEqual(s.recs.map((r) => r.res), ['fail', 'ok']);
  assert.equal(L.SYSTEMS[ix('idm')].time, L.SYSTEMS[ix('idm')].rto);
  const r = L.run([{ q: 0, slot: 0, sys: ix('wms') }], 'full')[0];
  assert.equal(r.res, 'ok');
  assert.equal(L.run([{ q: 0, slot: 0, sys: ix('erp') }], 'full')[0].res, 'slow');
});

test('rule 8: the record shown: the first really slow test, else the first failed one, else the last', () => {
  const rec = (sys, res) => ({ sys: ix(sys), res });
  assert.equal(L.shownRecord([rec('shop', 'ok'), rec('crm', 'fail'), rec('erp', 'slow'), rec('pay', 'slow')]), 2);
  assert.equal(L.shownRecord([rec('shop', 'ok'), rec('crm', 'fail'), rec('idm', 'fail'), rec('wms', 'ok')]), 1);
  assert.equal(L.shownRecord([rec('shop', 'ok'), rec('wms', 'ok')]), 1);
  assert.equal(L.shownRecord([]), null);
});

// ── the rules ──

test('rule 1: twelve systems, four per tier; two backups fail, two systems restore slower than the RTO', () => {
  assert.equal(L.N, 12);
  for (const tier of [1, 2, 3]) assert.equal(L.SYSTEMS.filter((s) => s.tier === tier).length, 4);
  assert.deepEqual(L.SYSTEMS.filter((s) => s.fails).map((s) => s.id), ['crm', 'idm']);
  assert.deepEqual(L.SYSTEMS.filter((s) => s.time > s.rto).map((s) => s.id), ['pay', 'erp']);
  assert.equal(new Set(L.SYSTEMS.map((s) => s.time)).size, 12, 'no two restore times tie');
});

test('rule 4: slot k of quarter q runs on day 3 + 4k of the quarter\'s middle month', () => {
  assert.deepEqual(L.dateOf(0, 0), { month: 2, day: 3 });
  assert.deepEqual(L.dateOf(3, 5), { month: 11, day: 23 });
  const s = S({ order: 'crit', slots: 3 });
  assert.deepEqual(s.recs.slice(0, 4).map((r) => [r.month, r.day]), [[2, 3], [2, 7], [2, 11], [5, 3]]);
});

test('rule 5: a failing backup fails its first test only (repaired after it); full records and tickets', () => {
  const s = S({ order: 'own', slots: 2, plan: mask([['crm', 0], ['crm', 2], ['shop', 2]]) });
  assert.deepEqual(s.recs.map((r) => [L.SYSTEMS[r.sys].id, r.res]), [['crm', 'fail'], ['shop', 'ok'], ['crm', 'ok']]);
  assert.ok(s.recs.every((r) => r.complete));
  const t = S({ order: 'own', slots: 2, record: 'ticket', plan: mask([['crm', 0], ['erp', 1]]) });
  assert.ok(t.recs.every((r) => !r.complete));
  assert.deepEqual(t.recs.map((r) => r.res), ['fail', 'slow'], 'the truth does not depend on the record');
});

test('rule 6: each system is a yearly requirement in the evidence trail; its status comes from the last test', () => {
  const s = S({ order: 'own', slots: 2, plan: mask([['crm', 0], ['erp', 1], ['idm', 2], ['idm', 3], ['shop', 3]]) });
  const st = (id) => s.years[ix(id)].status;
  assert.equal(st('crm'), 'fail');
  assert.equal(st('erp'), 'slow');
  assert.equal(st('idm'), 'ok', 'failed in Q3, repaired, in time in Q4');
  assert.equal(s.years[ix('idm')].found, 2);
  assert.equal(st('shop'), 'ok');
  assert.equal(st('files'), 'never');
  assert.equal(s.years[ix('files')].finding, 'not-operating', 'the trail\'s operating finding');
  assert.equal(s.years[ix('shop')].finding, null);
  const t = S({ order: 'own', slots: 2, record: 'ticket', plan: mask([['crm', 0], ['erp', 1]]) });
  assert.equal(t.years[ix('crm')].status, 'fail', 'a failure is noticed even on a ticket');
  assert.equal(t.years[ix('erp')].status, 'done', 'a ticket has no time: slow is not shown');
});

test('rule 6: the backup job reports are green every day for every system, whatever the tests find', () => {
  for (const x of L.presets) assert.equal(L.compute(x.params).m.jobs, 12 * 365, x.id);
  assert.equal(L.DAYS, 365);
});

test('rule 7: the findings, in order: never tested, failed without a retest, slower than the RTO, records without time', () => {
  const s = S({ order: 'list', slots: 2 });
  assert.deepEqual(s.m.findings.map((f) => [f.kind, ids(f.systems)]),
    [['never', ['idm', 'erp', 'dev', 'arch']], ['failed', ['crm']], ['slow', ['pay']]]);
  const t = S({ order: 'crit', slots: 3, record: 'ticket' });
  assert.deepEqual(t.m.findings.map((f) => f.kind), ['failed', 'unproven']);
  assert.deepEqual(ids(t.m.findings[0].systems), ['idm', 'crm'], 'critical-first order');
  assert.equal(t.m.findings[1].systems.length, 10);
  assert.equal(t.m.findings[1].records, 10);
  const t6 = S({ order: 'crit', slots: 6, record: 'ticket' });
  assert.equal(t6.m.findings.find((f) => f.kind === 'unproven').records, 22, 'every ticket of a successful test');
  // the slow finding lists its systems critical first, while nSlow names the first slow restore by date
  const l3 = S({ order: 'list', slots: 3 });
  assert.deepEqual(ids(l3.m.slowSeen), ['pay', 'erp']);
  assert.deepEqual(ids(l3.m.findings.find((f) => f.kind === 'slow').systems), ['erp', 'pay']);
  // every system tested, the failures retested in time, nothing slow: no findings
  const plan = mask([['shop', 0], ['idm', 0], ['crm', 0], ['files', 0], ['mail', 1], ['wms', 1], ['wiki', 1],
    ['print', 1], ['dev', 2], ['arch', 2], ['idm', 2], ['crm', 2]]);
  const clean = S({ order: 'own', slots: 6, plan });
  assert.deepEqual(clean.m.findings.map((f) => f.kind), ['never']);
  assert.deepEqual(ids(clean.m.findings[0].systems), ['erp', 'pay']);
});

test('rule 7: the numbers: tested, never and critical never, found against really failing, slow shown against really slow', () => {
  const s = S({ order: 'easy', slots: 2 });
  assert.equal(s.m.tests, 8);
  assert.equal(s.m.tested, 8);
  assert.deepEqual(ids(s.m.never), ['erp', 'mail', 'pay', 'arch']);
  assert.equal(s.m.neverCrit, 1);
  assert.deepEqual(s.m.found.map((f) => [L.SYSTEMS[f.sys].id, f.q]), [['idm', 1], ['crm', 3]]);
  assert.equal(s.m.fails, 2);
  assert.deepEqual(s.m.slowSeen, []);
  assert.equal(s.m.slowTrue, 2);
  assert.deepEqual(ids(s.m.slowNever), ['erp', 'pay']);
  assert.deepEqual(s.perQ, [2, 2, 2, 2]);
});

test('rule 3: a click removes a test, adds one to a quarter with a free slot, or is refused', () => {
  const p = P({ order: 'crit', slots: 2 });
  // remove: the plan becomes hand-made, starting from the tests on the stage
  const r = L.toggle(p, ix('shop'), 0);
  assert.equal(r.params.order, 'own');
  assert.deepEqual(sched(L.compute(r.params)), ['idm', 'wms,erp', 'files,mail', 'pay,crm']);
  // add to the freed slot
  const a = L.toggle(r.params, ix('arch'), 0);
  assert.deepEqual(sched(L.compute(a.params)), ['idm,arch', 'wms,erp', 'files,mail', 'pay,crm']);
  // a full quarter refuses; no slots at all refuses with its own reason
  assert.deepEqual(L.toggle(a.params, ix('dev'), 0), { reject: 'full', q: 0 });
  assert.deepEqual(L.toggle(P({ slots: 0 }), ix('dev'), 2), { reject: 'noSlots', q: 2 });
  // a later quarter: free a slot in Q3 and fill it again
  const r3 = L.toggle(p, ix('files'), 2);
  const a3 = L.toggle(r3.params, ix('dev'), 2);
  assert.deepEqual(sched(L.compute(a3.params)), ['shop,idm', 'wms,erp', 'mail,dev', 'pay,crm']);
  assert.deepEqual(L.toggle(a3.params, ix('wiki'), 2), { reject: 'full', q: 2 });
  assert.deepEqual(L.toggle(a3.params, ix('wiki'), 3), { reject: 'full', q: 3 });
  // a hand-made plan with more tests than slots: the click works on the tests on the stage, not the stored bits
  const over = P({ order: 'own', slots: 2, plan: mask([['files', 0], ['shop', 0], ['arch', 0]]) });
  assert.deepEqual(L.toggle(over, ix('arch'), 0), { reject: 'full', q: 0 });
  assert.equal(L.toggle(over, ix('files'), 0).params.plan, mask([['shop', 0]]));
  // own plan with no slots: refused as noSlots
  assert.deepEqual(L.toggle(P({ order: 'own', slots: 0, plan: mask([['files', 0]]) }), ix('dev'), 1), { reject: 'noSlots', q: 1 });
  // the record kind is kept
  assert.equal(L.toggle(P({ record: 'ticket' }), ix('files'), 0).params.record, 'ticket');
});

test('rule 9: params made safe', () => {
  assert.deepEqual(L.normalise({}), L.defaults);
  assert.deepEqual(L.normalise({ slots: '9', order: 'x', record: 'paper', plan: -5 }),
    { slots: 6, order: 'list', record: 'full', plan: 0 });
  assert.equal(L.normalise({ slots: 2.6 }).slots, 3);
  assert.equal(L.normalise({ slots: '' }).slots, L.defaults.slots);
  assert.equal(L.normalise({ slots: Infinity }).slots, L.defaults.slots);
  assert.equal(L.normalise({ plan: 1e20 }).plan, L.PLAN_MAX);
  assert.equal(L.normalise({ plan: '2.6' }).plan, 3, 'a whole mask');
  assert.equal(L.PLAN_MAX, Math.pow(2, 48) - 1);
  assert.equal(L.normalise({ plan: 'abc' }).plan, 0);
  // the mask layout is part of shared URLs: bit = system · 4 + quarter
  assert.equal(L.bitIndex(ix('crm'), 2), 30);
  assert.deepEqual(sched(S({ order: 'own', slots: 2, plan: Math.pow(2, 30) + Math.pow(2, 1) })), ['', 'files', 'crm', '']);
  assert.ok(Number.isSafeInteger(L.PLAN_MAX));
  assert.equal(L.normalise({ order: 'own' }).order, 'own');
});

test('rule 10: the caption: main line, then at most two notes in order', () => {
  const key = (over) => L.captionKey(S(over));
  assert.deepEqual(key(preset('jobs')), { key: 'capNone', notes: ['nHidden', 'nSlowHidden'] });
  assert.deepEqual(key(preset('list')), { key: 'capSomeCrit', notes: ['nHidden', 'nFound'] });
  assert.deepEqual(key(preset('crit')), { key: 'capSome', notes: ['nFound', 'nSlow'] });
  assert.deepEqual(key(preset('easy')), { key: 'capSomeCrit', notes: ['nFound', 'nSlowHidden'] });
  assert.deepEqual(key(preset('all')), { key: 'capAll', notes: ['nFound', 'nSlow'] });
  assert.deepEqual(key(preset('ticket')), { key: 'capAll', notes: ['nTicket', 'nFound'] });
  // nSlowHidden only with full records; nTicket only with tests
  assert.deepEqual(key({ slots: 0, record: 'ticket' }).notes, ['nHidden']);
  // exactly one slow restore shown still gets its note
  assert.deepEqual(key({ order: 'own', slots: 1, plan: mask([['crm', 0], ['idm', 1], ['erp', 2]]) }).notes, ['nFound', 'nSlow']);
  // twelve tests that repeat systems are not "all tested"
  const rep = mask([0, 1, 2, 3].flatMap((q) => [['shop', q], ['idm', q], ['erp', q]]));
  assert.equal(key({ order: 'own', slots: 3, plan: rep }).key, 'capSomeCrit');
  // the first slow restore by date is the one named
  assert.equal(L.SYSTEMS[S(preset('crit')).m.slowSeen[0]].id, 'erp');
  // nothing to say: one test, in time, all else unknown but neither failing nor slow untested is impossible here
  const one = S({ order: 'own', slots: 1, plan: mask([['shop', 0]]) });
  assert.deepEqual(L.captionKey(one), { key: 'capSomeCrit', notes: ['nHidden', 'nSlowHidden'] });
});

test('presets: the numbers in SPEC.md (checked by the Python re-implementation there)', () => {
  const want = {
    jobs: { sched: ['', '', '', ''], tested: 0, never: 12, crit: 4, found: [], hidden: ['idm', 'crm'], slow: [], shown: null },
    list: { sched: ['files,mail', 'wiki,shop', 'print,pay', 'wms,crm'], tested: 8, never: 4, crit: 2, found: ['crm:3'], hidden: ['idm'], slow: ['pay'], shown: 'pay' },
    crit: { sched: ['shop,idm', 'wms,erp', 'files,mail', 'pay,crm'], tested: 8, never: 4, crit: 0, found: ['idm:0', 'crm:3'], hidden: [], slow: ['erp', 'pay'], shown: 'erp' },
    easy: { sched: ['print,wiki', 'shop,idm', 'wms,dev', 'files,crm'], tested: 8, never: 4, crit: 1, found: ['idm:1', 'crm:3'], hidden: [], slow: [], shown: 'idm' },
    all: { sched: ['shop,idm,wms', 'erp,files,mail', 'pay,crm,wiki', 'print,dev,arch'], tested: 12, never: 0, crit: 0, found: ['idm:0', 'crm:2'], hidden: [], slow: ['erp', 'pay'], shown: 'erp' },
    ticket: { sched: ['shop,idm,wms', 'erp,files,mail', 'pay,crm,wiki', 'print,dev,arch'], tested: 12, never: 0, crit: 0, found: ['idm:0', 'crm:2'], hidden: [], slow: [], shown: 'erp' }
  };
  for (const x of L.presets) {
    const s = L.compute(x.params), w = want[x.id], m = s.m;
    assert.deepEqual(sched(s), w.sched, x.id);
    assert.equal(m.tested, w.tested, x.id);
    assert.equal(m.never.length, w.never, x.id);
    assert.equal(m.neverCrit, w.crit, x.id);
    assert.deepEqual(m.found.map((f) => L.SYSTEMS[f.sys].id + ':' + f.q), w.found, x.id);
    assert.deepEqual(ids(m.hidden), w.hidden, x.id);
    assert.deepEqual(ids(m.slowSeen), w.slow, x.id);
    assert.equal(s.shown === null ? null : L.SYSTEMS[s.recs[s.shown].sys].id, w.shown, x.id);
  }
});

test('the defaults are preset 2 (two slots, as listed); every preset is normal', () => {
  assert.deepEqual(L.defaults, preset('list'));
  for (const x of L.presets) assert.deepEqual(L.normalise(x.params), x.params, x.id);
});

// ── the evidence-trail model (trail.js, copied unchanged from cmp-policy-to-record; its own rule tests) ──

test('trail: yearly periods; a record anywhere in the year covers it; outside the period or fractional months are ignored', () => {
  assert.deepEqual(trail.periods('yearly', 12), [{ index: 0, from: 1, to: 12 }]);
  assert.equal(trail.periodOf(11, 'yearly', 12), 0);
  assert.equal(trail.periodOf(13, 'yearly', 12), -1);
  assert.equal(trail.periodOf(2.5, 'yearly', 12), -1);
  assert.deepEqual(trail.coverage([2, 11], 'yearly', 12), [{ index: 0, from: 1, to: 12, count: 2, ok: true }]);
  assert.throws(() => trail.periods('weekly', 12));
});

test('trail: a whole chain without records is an operating finding; with one, none; the first break wins', () => {
  const chain = (over) => Object.assign({ policy: true, standard: 'measurable', procedure: true, freq: 'yearly', records: [] }, over);
  assert.deepEqual([trail.walk(chain(), 12).finding.kind, trail.walk(chain(), 12).finding.reason], ['operation', 'not-operating']);
  assert.equal(trail.walk(chain({ records: [5] }), 12).finding.kind, 'none');
  assert.equal(trail.walk(chain({ policy: false, records: [5] }), 12).finding.reason, 'no-policy');
  assert.equal(trail.walk(chain({ standard: 'vague', records: [5] }), 12).finding.reason, 'vague-standard');
  assert.equal(trail.walk(chain({ procedure: false }), 12).breakAt, 'procedure');
  const q = trail.walk(chain({ freq: 'quarterly', records: [2, 5] }), 12).finding;
  assert.deepEqual([q.kind, q.reason, q.expected, q.found, q.missing, q.last], ['operation', 'gaps', 4, 2, [2, 3], 5]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [L.defaults].concat(L.presets.map((x) => x.params))) {
    const s = L.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('crit'));
  const copy = structuredClone(p);
  assert.deepEqual(L.compute(p), L.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(L, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every system, tier, preset, caption and note has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  assert.match(html, /<script src="trail\.js"><\/script>\s*<script src="strings\.js"><\/script>\s*<script src="sim\.js"><\/script>/);
  const keys = ['capNone', 'capAll', 'capSome', 'capSomeCrit', 'nTicket', 'nHidden', 'nFound', 'nSlow', 'nSlowHidden',
    'rejFull', 'rejNone', 'fNever', 'fFailed', 'fSlow', 'fUnproven', 'fNone'];
  for (const lang of ['hr', 'en']) {
    for (const s of L.SYSTEMS) assert.ok(strings[lang]['sys_' + s.id], `${lang} sys_${s.id}`);
    for (const tier of [1, 2, 3]) assert.ok(strings[lang]['tier_' + tier], `${lang} tier_${tier}`);
    for (const mo of L.MONTH) assert.ok(strings[lang]['mon_' + mo], `${lang} mon_${mo}`);
    for (const k of keys) assert.ok(strings[lang][k], `${lang} ${k}`);
    for (const x of L.presets) {
      const k = 'p' + x.id[0].toUpperCase() + x.id.slice(1);
      assert.ok(strings[lang][k], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][k + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});
