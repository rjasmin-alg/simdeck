// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for route-summarisation's model: SPEC.md's rules, tie-breaks first, then every preset's numbers, then the
// generic block every sim keeps. Run: node --test sims/route-summarisation/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const ip = logic.parse;
const P = (over) => logic.withDefaults(over);
const D = (over) => logic.initial(P(over));
const B = (net, len) => ({ net: ip(net), len });
const NONE = { sales: false, prod: false, mgmt: false, branch: false, guest: false, link: false };
const pick = (...ids) => D(Object.assign({ plan: 'grafo' }, NONE, Object.fromEntries(ids.map((i) => [i, true]))));
const preset = (id) => D(logic.presets.find((p) => p.id === id).params);
const range = (r) => [logic.format(r.first), logic.format(r.last), r.count];
const rowsOf = (t) => t.map((r) => `${logic.format(r.net)}/${r.prefix} ${r.hop}`);

// ── tie-breaks ──

test('rule 4: a duplicated block counts once', () => {
  const s = logic.summarise([B('192.168.1.64', 27), B('192.168.1.64', 27)]);
  assert.equal(s.covered, 32);
  assert.equal(s.exact, true);
  assert.equal(s.len, 27);
});

test('rule 4: a block inside another picked block adds no addresses', () => {
  const s = logic.summarise([B('192.168.1.0', 25), B('192.168.1.64', 27)]);
  assert.equal(s.covered, 128);
  assert.equal(s.len, 25);
  assert.equal(s.exact, true);
  assert.equal(s.overCount, 0);
});

test('rule 4: overlapping and touching ranges merge into one', () => {
  assert.deepEqual(logic.union([B('10.0.0.0', 25), B('10.0.0.128', 25), B('10.0.0.64', 26)]),
    [{ first: ip('10.0.0.0'), last: ip('10.0.0.255') }]);
});

test('rule 5: one block is its own summary, exact', () => {
  const s = pick('mgmt');
  assert.equal(logic.format(s.summary.net), '192.168.1.96');
  assert.equal(s.summary.len, 28);
  assert.equal(s.exact, true);
  assert.deepEqual(s.overCovered, []);
  assert.deepEqual(rowsOf(s.tableAfter), rowsOf(s.tableBefore), 'one route replaced by itself');
});

test('nothing picked: no summary, the table stays as it is', () => {
  const s = pick();
  assert.equal(s.summary, null);
  assert.equal(s.installed, false);
  assert.deepEqual(s.pieces, []);
  assert.equal(s.covered, 0);
  assert.equal(s.exact, false);
  assert.ok(s.blocks.every((b) => !b.inSummary));
  assert.deepEqual(rowsOf(s.tableAfter), rowsOf(s.tableBefore));
});

test('lookup tie (from routing-table): equal prefixes keep the earlier entry', () => {
  const t = [{ net: ip('10.0.0.0'), prefix: 8 }, { net: ip('10.0.0.0'), prefix: 8 }];
  assert.equal(logic.lookup(t, ip('10.1.1.1')).winner, 0);
});

// ── rules ──

test('rule 1: length = leading bits shared by the lowest and the highest address; network = lowest AND mask', () => {
  assert.equal(logic.commonBits(ip('192.168.1.0'), ip('192.168.1.111')), 25);
  assert.equal(logic.commonBits(ip('192.168.1.128'), ip('192.168.1.139')), 28);
  assert.equal(logic.commonBits(ip('172.16.0.0'), ip('172.16.2.255')), 22);
  assert.equal(logic.commonBits(ip('10.0.0.1'), ip('10.0.0.1')), 32);
  assert.equal(logic.commonBits(ip('0.0.0.0'), ip('255.255.255.255')), 0);
  // the highest address is the last of the highest block, not its network address
  const s = logic.summarise([B('192.168.1.0', 26), B('192.168.1.96', 28)]);
  assert.equal(s.len, 25);
  assert.equal(logic.format(s.net), '192.168.1.0');
  // the network is the lowest address AND the mask, even when the lowest block is not on the summary's boundary
  const t = logic.summarise([B('192.168.1.64', 27), B('192.168.1.128', 29)]);
  assert.equal(t.len, 24);
  assert.equal(logic.format(t.net), '192.168.1.0');
});

test('rule 2: a prefix is aligned when its network is a multiple of its size; every summary is', () => {
  assert.equal(logic.aligned(ip('192.168.1.16'), 28), true);
  assert.equal(logic.aligned(ip('192.168.1.32'), 28), true);
  assert.equal(logic.aligned(ip('192.168.1.20'), 28), false, 'book ch. 9: .20 cannot start a /28');
  assert.equal(logic.aligned(ip('192.168.1.64'), 25), false);
  for (const ids of [['sales', 'prod', 'mgmt'], ['prod', 'guest'], ['branch', 'link'], ['guest', 'link']]) {
    const s = pick(...ids);
    assert.equal(s.summary.aligned, true, ids.join('+'));
    assert.equal(s.summary.net % s.summary.size, 0);
  }
});

test('rule 3: exact iff the picked blocks fill the summary; otherwise over-covered = size − covered, as ranges', () => {
  const s = pick('sales', 'mgmt');                        // .0/26 + .96/28 → .0/25, prod .64–.95 and branch .112–.127 left
  assert.equal(s.summary.len, 25);
  assert.equal(s.exact, false);
  assert.equal(s.covered, 80);
  assert.equal(s.overCount, 128 - 80);
  assert.deepEqual(s.overCovered.map(range), [['192.168.1.64', '192.168.1.95', 32], ['192.168.1.112', '192.168.1.127', 16]]);
  assert.equal(s.overCovered.reduce((a, r) => a + r.count, 0), s.overCount);
  assert.equal(logic.gaps(0, 9, [{ first: 0, last: 9 }]).length, 0);
  assert.deepEqual(logic.gaps(0, 9, [{ first: 3, last: 4 }]), [{ first: 0, last: 2, count: 3 }, { first: 5, last: 9, count: 5 }]);
});

test('rule 6: an over-covered block behind R2 is a risk, but R2 keeps it by its longer connected route', () => {
  const s = preset('head-office');
  const br = s.pieces.find((x) => x.owner === 'branch');
  assert.equal(br.kind, 'risk');
  assert.equal(br.risk, true);
  assert.equal(br.safeOnR2, true);
  assert.equal(br.r2, 'connected');
  // the R1–R2 link and unpicked R1 blocks are reached through R1 as well: no risk
  const t = pick('sales', 'mgmt', 'guest', 'branch');     // .0/24: prod, link and the reserve over-covered
  const kinds = Object.fromEntries(t.pieces.map((x) => [x.owner || 'none', x.kind]));
  assert.deepEqual(kinds, { prod: 'same', link: 'same', none: 'unused' });
});

test('rule 6: a summary only replaces routes via R1; connected routes stay and win by length', () => {
  const s = preset('exact');                               // prod + mgmt + branch → .64/26
  assert.deepEqual(s.replaced, ['prod', 'mgmt']);
  assert.ok(rowsOf(s.tableAfter).includes('192.168.1.112/28 connected'));
  assert.equal(logic.lookup(s.tableAfter, ip('192.168.1.120')).winner,
    s.tableAfter.findIndex((r) => r.block === 'branch'));
  // nothing via R1 picked: no summary route is installed, and nothing is a risk
  const own = pick('branch', 'link');
  assert.equal(own.installed, false);
  assert.deepEqual(rowsOf(own.tableAfter), rowsOf(own.tableBefore));
  assert.ok(own.pieces.every((x) => !x.risk));
  // R2 has no route for nobody's addresses and keeps its routes via R1 for the R1 blocks
  assert.deepEqual(own.pieces.map((x) => [x.owner, x.r2]),
    [['sales', 'R1'], ['prod', 'R1'], ['mgmt', 'R1'], ['guest', 'R1'], [null, 'none']]);
});

test('rule 7: nobody\'s over-covered addresses are flagged unused; on R2 they now follow the summary', () => {
  const s = preset('small');
  assert.deepEqual(s.pieces.map((x) => [logic.format(x.first), logic.format(x.last), x.count, x.kind, x.r2]),
    [['192.168.1.140', '192.168.1.143', 4, 'unused', 'summary']]);
  assert.equal(s.pieces[0].safeOnR2, false, 'the summary itself carries them on R2');
});

test('inSummary marks the plan\'s blocks inside the summary, picked or not', () => {
  const s = pick('sales', 'mgmt');                         // .0/25
  assert.deepEqual(s.blocks.filter((b) => b.inSummary).map((b) => b.id), ['sales', 'prod', 'mgmt', 'branch']);
});

test('defaults are preset head-office with every /24 of four24 on; an unknown plan falls back to grafo', () => {
  const hp = logic.presets.find((p) => p.id === 'head-office').params;
  for (const [k, v] of Object.entries(hp)) assert.equal(logic.defaults[k], v, k);
  for (const k of ['n0', 'n1', 'n2', 'n3']) assert.equal(logic.defaults[k], true, k);
  const s = D({ plan: 'nonsense' });
  assert.equal(s.plan, 'grafo');
  assert.equal(s.blocks.length, 6);
});

test('owner pieces split a range at block edges', () => {
  const plan = logic.planOf('grafo');
  const pcs = logic.ownerPieces([{ first: ip('192.168.1.100'), last: ip('192.168.1.150') }], plan.blocks);
  assert.deepEqual(pcs.map((x) => [x.owner, x.count]), [['mgmt', 12], ['branch', 16], ['guest', 8], ['link', 4], [null, 11]]);
  // a gap before the first block and a block reaching past the range's end
  const ab = [{ id: 'a', net: 10, len: 30 }, { id: 'b', net: 16, len: 28 }];
  assert.deepEqual(logic.ownerPieces([{ first: 0, last: 20 }], ab).map((x) => [x.owner, x.first, x.last]),
    [[null, 0, 9], ['a', 10, 13], [null, 14, 15], ['b', 16, 20]]);
});

test('the table after is in address order, the summary before a longer route with the same network', () => {
  const s = pick('sales', 'prod', 'mgmt', 'branch', 'guest');   // .0/24 via R1, branch and link stay
  assert.deepEqual(rowsOf(s.tableAfter), ['192.168.1.0/24 R1', '192.168.1.112/28 connected', '192.168.1.136/30 connected']);
  // tie on the network: branch + guest → .0/24, and Sales' .0/26 (not picked) stays after it
  assert.deepEqual(rowsOf(pick('branch', 'guest').tableAfter).slice(0, 2), ['192.168.1.0/24 R1', '192.168.1.0/26 R1']);
});

test('changed: blocks whose pick changed and rows new in the table after', () => {
  const a = preset('head-office'), b = pick('sales', 'prod');
  assert.deepEqual(logic.changed(a, b), { blocks: ['mgmt'], rows: [`${ip('192.168.1.96')}/28/R1`] });
  assert.deepEqual(logic.changed(a, a), { blocks: [], rows: [] });
  assert.deepEqual(logic.changed(null, a), { blocks: [], rows: [] });
  assert.deepEqual(logic.changed(a, preset('four24')), { blocks: [], rows: [] }, 'another plan: nothing to compare');
});

// ── presets: the task's numbers ──

test('R2\'s table before (URM ch. 9, Primjer 1): four routes via R1, the branch and the link connected', () => {
  assert.deepEqual(rowsOf(preset('head-office').tableBefore), [
    '192.168.1.0/26 R1', '192.168.1.64/27 R1', '192.168.1.96/28 R1',
    '192.168.1.112/28 connected', '192.168.1.128/29 R1', '192.168.1.136/30 connected']);
});

test('preset head-office: 192.168.1.0/25, 3 routes → 1, over-covers .112–.127 (16) = the branch', () => {
  const s = preset('head-office');
  assert.equal(`${logic.format(s.summary.net)}/${s.summary.len}`, '192.168.1.0/25');
  assert.deepEqual(s.replaced, ['sales', 'prod', 'mgmt']);
  assert.equal(s.tableBefore.length - s.tableAfter.length, 2);
  assert.deepEqual(s.overCovered.map(range), [['192.168.1.112', '192.168.1.127', 16]]);
  assert.deepEqual(s.pieces.map((x) => x.owner), ['branch']);
});

test('preset exact: 192.168.1.64/26, 32 + 16 + 16 = 64, exact', () => {
  const s = preset('exact');
  assert.equal(`${logic.format(s.summary.net)}/${s.summary.len}`, '192.168.1.64/26');
  assert.equal(s.covered, 64);
  assert.equal(s.exact, true);
});

test('preset small: 192.168.1.128/28, over-covers .140–.143 (4 unused)', () => {
  const s = preset('small');
  assert.equal(`${logic.format(s.summary.net)}/${s.summary.len}`, '192.168.1.128/28');
  assert.deepEqual(s.overCovered.map(range), [['192.168.1.140', '192.168.1.143', 4]]);
});

test('preset all: 192.168.1.0/24, over-covers .140–.255 = 116, the book\'s reserve', () => {
  const s = preset('all');
  assert.equal(`${logic.format(s.summary.net)}/${s.summary.len}`, '192.168.1.0/24');
  assert.equal(s.covered, 140);
  assert.deepEqual(s.overCovered.map(range), [['192.168.1.140', '192.168.1.255', 116]]);
  assert.deepEqual(rowsOf(s.tableAfter), ['192.168.1.0/24 R1', '192.168.1.112/28 connected', '192.168.1.136/30 connected']);
});

test('preset four24: 172.16.0.0/22, exact; without 172.16.3.0/24 the /22 over-covers 256', () => {
  const s = preset('four24');
  assert.equal(`${logic.format(s.summary.net)}/${s.summary.len}`, '172.16.0.0/22');
  assert.equal(s.exact, true);
  assert.equal(s.tableAfter.length, 1);
  const d = D({ plan: 'four24', n3: false });
  assert.equal(d.summary.len, 22);
  assert.deepEqual(d.overCovered.map(range), [['172.16.3.0', '172.16.3.255', 256]]);
  assert.deepEqual(d.pieces.map((x) => [x.owner, x.kind, x.r2]), [['n3', 'same', 'R1']]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  const s = pick();
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ branch: true, link: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; every block has a name', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
    for (const lang of ['hr', 'en']) assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
  }
  for (const id of logic.BLOCK_IDS) assert.ok(id in logic.defaults, `toggle ${id}`);
  for (const id of logic.PLANS.grafo.blocks.map((b) => b.id)) {
    for (const lang of ['hr', 'en']) assert.ok(strings[lang]['block_' + id], `${lang} name of ${id}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
