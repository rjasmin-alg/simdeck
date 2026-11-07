// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cmp-nis2-scope. Run: node --test sims/cmp-nis2-scope/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the scope functions (nis2.js), then the rules in order,
// the presets, and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const N = require('./nis2.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const M = 1000000;
const ix = (k, v) => logic.LADDERS[k].indexOf(k === 'staff' ? v : Math.round(v * M));
/** An organisation by values: sector, staff, turnover €M, balance €M, roles. */
const P = (sector, staff, t, b, ...roles) => {
  const p = { sector, staff: ix('staff', staff), turnover: ix('turnover', t), balance: ix('balance', b) };
  for (const k of ['staff', 'turnover', 'balance']) assert.ok(p[k] >= 0, `${k} on its ladder`);
  for (const r of N.ROLES) p[r] = roles.includes(r);
  return p;
};
const S = (...a) => logic.compute(P(...a));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const O = (staff, t, b) => ({ staff, turnover: Math.round(t * M), balance: Math.round(b * M) });

// ── tie-breaks ──

test('rule 1: staff equal to the headcount is over the ceiling ("fewer than")', () => {
  assert.equal(N.size(O(249, 6, 6)), 2);
  assert.equal(N.size(O(250, 6, 6)), 3);
  assert.equal(N.size(O(49, 6, 6)), 1);
  assert.equal(N.size(O(50, 6, 6)), 2);
  assert.equal(N.size(O(9, 0.5, 0.5)), 0);
  assert.equal(N.size(O(10, 0.5, 0.5)), 1);
  // on the page: the water utility at 249 is important, at 250 essential
  assert.deepEqual([S('water', 249, 30, 70).cls, S('water', 250, 30, 70).cls], ['important', 'essential']);
});

test('rule 1: money equal to the sum is within ("not exceeding")', () => {
  assert.equal(N.size(O(120, 50, 44)), 2);              // turnover exactly €50M: within
  assert.equal(N.size(O(120, 51, 44)), 3);
  assert.equal(N.size(O(120, 62, 43)), 2);              // balance exactly €43M: within
  assert.equal(N.size(O(30, 10, 10.5)), 1);
  assert.equal(N.size(O(30, 10.5, 10.5)), 2);
  assert.equal(N.size(O(5, 2, 2.1)), 0);
  assert.equal(N.size(O(5, 2.1, 2.1)), 1);
});

test('rule 1: one money figure within is enough; both over make the next class', () => {
  assert.equal(N.size(O(120, 62, 38)), 2);              // turnover over, balance within: medium
  assert.equal(N.size(O(120, 30, 70)), 2);              // turnover within, balance over: medium
  assert.equal(N.size(O(120, 62, 44)), 3);              // both over: large
  assert.deepEqual(N.within(O(120, 62, 38), N.CEILINGS[2]), { staff: true, turnover: false, balance: true, ok: true });
  assert.deepEqual(N.within(O(120, 62, 44), N.CEILINGS[2]), { staff: true, turnover: false, balance: false, ok: false });
  assert.deepEqual(N.within(O(250, 6, 6), N.CEILINGS[2]), { staff: false, turnover: true, balance: true, ok: false });
  // few staff never rescues big money; many staff makes large whatever the money
  assert.equal(N.size(O(3, 1500, 1500)), 3);
  assert.equal(N.size(O(3000, 0.5, 0.5)), 3);
});

test('rule 4: the deciding row is the first in table order that gives the class', () => {
  const s = S('water', 400, 90, 70, 'telecom', 'dns', 'qtsp', 'named');
  assert.equal(s.cls, 'essential');
  assert.equal(s.decider, 'annex1');                    // annex1 comes before every role
  assert.equal(s.leading, 5);
  assert.equal(S('water', 120, 30, 70, 'dns', 'qtsp').decider, 'dns');   // annex1 only important here
  assert.equal(S('retail', 9, 2, 2, 'qtsp', 'named').decider, 'qtsp');
  assert.equal(S('retail', 120, 30, 30, 'telecom', 'named').decider, 'telecom');
  assert.equal(S('central', 9, 2, 2, 'dns').decider, 'central');
  assert.equal(S('retail', 400, 90, 70).decider, null);
});

test('rule 6: the share decides only when strictly higher; at €500M the fixed sum is named', () => {
  assert.deepEqual(N.fine('essential', 500 * M), { fixed: 10 * M, pct: 10 * M, ceiling: 10 * M, by: 'fixed' });
  assert.deepEqual(N.fine('important', 500 * M), { fixed: 7 * M, pct: 7 * M, ceiling: 7 * M, by: 'fixed' });
  assert.deepEqual(N.fine('essential', 500 * M + 100000), { fixed: 10 * M, pct: 10002000, ceiling: 10002000, by: 'pct' });
  assert.deepEqual(N.fine('important', 500 * M + 100000), { fixed: 7 * M, pct: 7001400, ceiling: 7001400, by: 'pct' });
  assert.equal(N.fine('out', 600 * M), null);
  assert.equal(N.fine('important', 333).pct, 4);       // rounded down to whole euros
});

test('rule 2: named applies only to a listed type; on an unlisted one it is idle', () => {
  for (const sector of ['retail', 'software', 'tourism', 'local']) {
    const s = S(sector, 400, 90, 70, 'named');
    assert.deepEqual([s.cls, s.namedIdle, s.rows.find((r) => r.id === 'named').applies], ['out', true, false], sector);
  }
  for (const sector of ['water', 'food', 'central']) {
    const s = S(sector, 9, 2, 2, 'named');
    assert.deepEqual([s.cls, s.decider, s.namedIdle], ['essential', sector === 'central' ? 'central' : 'named', false], sector);
  }
  for (const role of ['telecom', 'dns', 'qtsp']) {   // a listed role makes the type listed
    const s = S('retail', 9, 2, 2, role, 'named');
    assert.equal(s.rows.find((r) => r.id === 'named').applies, true, role);
    assert.equal(s.namedIdle, false, role);
  }
  assert.equal(S('water', 9, 2, 2).namedIdle, false);
});

// ── the scope functions (nis2.js) ──

test('rule 2: the rows and their cells, in order', () => {
  assert.deepEqual(N.ROWS.map((r) => [r.id, r.cells.join('')]), [
    ['annex1', '0012'], ['annex2', '0011'], ['central', '2222'], ['local', '0000'], ['unlisted', '0000'],
    ['telecom', '1122'], ['dns', '2222'], ['qtsp', '2222'], ['named', '2222']
  ]);
  assert.deepEqual(N.CLASSES, ['out', 'important', 'essential']);
  assert.deepEqual(N.SIZES, ['micro', 'small', 'medium', 'large']);
});

test('rule 2: exactly one sector row applies, the sector\'s group', () => {
  for (const [id, group] of logic.SECTORS) {
    const on = S(id, 120, 30, 30).rows.filter((r) => r.applies).map((r) => r.id);
    assert.deepEqual(on, [group], id);
  }
  assert.deepEqual(logic.SECTORS.map((x) => x[1]).filter((g, k, a) => a.indexOf(g) === k), N.GROUPS);
  // rule 7: the sectors and their groups, literally (SPEC)
  assert.deepEqual(logic.SECTORS, [
    ['energy', 'annex1'], ['transport', 'annex1'], ['health', 'annex1'], ['water', 'annex1'], ['cloud', 'annex1'],
    ['msp', 'annex1'],
    ['postal', 'annex2'], ['waste', 'annex2'], ['food', 'annex2'], ['manufacturing', 'annex2'], ['chemicals', 'annex2'],
    ['digital', 'annex2'], ['research', 'annex2'],
    ['central', 'central'], ['local', 'local'],
    ['retail', 'unlisted'], ['software', 'unlisted'], ['tourism', 'unlisted']
  ]);
});

test('rule 4: the class per sector group and size column (the scope table)', () => {
  const sizes = [[3, 0.5, 0.5], [25, 6, 6], [120, 30, 30], [400, 90, 70]];
  const table = {};
  for (const sector of ['water', 'food', 'central', 'local', 'retail']) {
    table[sector] = sizes.map((x) => S(sector, ...x).cls[0]).join('');
  }
  assert.deepEqual(table, { water: 'ooie', food: 'ooii', central: 'eeee', local: 'oooo', retail: 'oooo' });
  const roles = {};
  for (const r of N.ROLES) roles[r] = sizes.map((x) => S('food', ...x, r).cls[0]).join('');
  assert.deepEqual(roles, { telecom: 'iiee', dns: 'eeee', qtsp: 'eeee', named: 'eeee' });
  // the strictest counts: annex2 important + telecom essential at medium
  assert.equal(S('food', 120, 30, 30, 'telecom').cls, 'essential');
  assert.equal(S('food', 25, 6, 6, 'telecom').cls, 'important');
});

test('rule 4: classAt and decider over hand-made rows', () => {
  const rs = N.rows({ group: 'annex2', roles: { telecom: true } });
  assert.deepEqual([0, 1, 2, 3].map((c) => N.classAt(rs, c)), [1, 1, 2, 2]);
  assert.deepEqual([0, 1, 2, 3].map((c) => N.decider(rs, c)), ['telecom', 'telecom', 'telecom', 'telecom']);
  const none = N.rows({ group: 'unlisted', roles: {} });
  assert.deepEqual([N.classAt(none, 3), N.decider(none, 3)], [0, null]);
  // roles without a roles object; only true switches a role on
  assert.deepEqual(N.rows({ group: 'annex1' }).filter((r) => r.applies).map((r) => r.id), ['annex1']);
  assert.deepEqual(N.rows({ group: 'annex1', roles: { dns: 'true' } }).filter((r) => r.applies).map((r) => r.id), ['annex1']);
  // a role that is not exactly true does not make the type listed either
  const nm = N.rows({ group: 'unlisted', roles: { dns: 'true', named: true } }).find((r) => r.id === 'named');
  assert.deepEqual([nm.applies, nm.idle], [false, true]);
});

test('rule 5: thresholds up and down', () => {
  const at = (group, roles, col) => N.thresholds(N.rows({ group, roles }), col);
  assert.deepEqual(at('annex1', {}, 0), { up: 2, down: null });
  assert.deepEqual(at('annex1', {}, 1), { up: 2, down: null });
  assert.deepEqual(at('annex1', {}, 2), { up: 3, down: 1 });
  assert.deepEqual(at('annex1', {}, 3), { up: null, down: 2 });
  assert.deepEqual(at('annex2', {}, 3), { up: null, down: 1 });
  assert.deepEqual(at('annex2', {}, 2), { up: null, down: 1 });
  assert.deepEqual(at('unlisted', {}, 3), { up: null, down: null });
  assert.deepEqual(at('unlisted', { telecom: true }, 0), { up: 2, down: null });
  assert.deepEqual(at('unlisted', { telecom: true }, 3), { up: null, down: 1 });
  assert.deepEqual(at('unlisted', { dns: true }, 1), { up: null, down: null });
  // the loops reach both ends (micro and large) for a model with other rows
  assert.deepEqual(N.thresholds([{ applies: true, cells: [0, 1, 1, 1] }], 2), { up: null, down: 0 });
  assert.deepEqual(N.thresholds([{ applies: true, cells: [0, 0, 0, 1] }], 0), { up: 3, down: null });
});

test('rule 6: the fine ceilings, fixed below €500M and the share above', () => {
  assert.deepEqual(N.fine('essential', 30 * M), { fixed: 10 * M, pct: 600000, ceiling: 10 * M, by: 'fixed' });
  assert.deepEqual(N.fine('important', 30 * M), { fixed: 7 * M, pct: 420000, ceiling: 7 * M, by: 'fixed' });
  assert.deepEqual(N.fine('essential', 600 * M), { fixed: 10 * M, pct: 12 * M, ceiling: 12 * M, by: 'pct' });
  assert.deepEqual(N.fine('important', 600 * M), { fixed: 7 * M, pct: 8400000, ceiling: 8400000, by: 'pct' });
  assert.deepEqual(N.fine('essential', 1500 * M).ceiling, 30 * M);
  assert.deepEqual(N.fine('important', 1500 * M).ceiling, 21 * M);
  const s = S('water', 120, 600, 200);
  assert.deepEqual([s.fines.essential.ceiling, s.fines.important.ceiling], [12 * M, 8400000]);
});

// ── rules in order (page side) ──

test('rule 7: the ladders hold each ceiling and a value just over it', () => {
  const L = logic.LADDERS;
  for (const c of N.CEILINGS) {
    assert.ok(L.staff.includes(c.staff) && L.staff.includes(c.staff - 1), `staff ${c.staff}`);
    assert.ok(L.turnover.includes(c.turnover) && L.turnover.some((v) => v > c.turnover && v <= c.turnover * 1.05), `turnover ${c.turnover}`);
    assert.ok(L.balance.includes(c.balance) && L.balance.some((v) => v > c.balance && v <= c.balance * 1.05), `balance ${c.balance}`);
  }
  for (const k of ['staff', 'turnover', 'balance']) {
    assert.deepEqual(L[k].slice().sort((a, b) => a - b), L[k], `${k} ascending`);
    assert.ok(L[k].every(Number.isInteger), `${k} whole numbers`);
  }
  assert.ok(L.turnover.every((v) => v % 100000 === 0), 'turnover in steps of €100 000');
  assert.deepEqual(L.staff, [3, 9, 10, 25, 49, 50, 120, 180, 249, 250, 400, 1000, 3000]);
  assert.deepEqual(L.turnover.map((v) => v / M), [0.5, 2, 2.1, 6, 10, 10.5, 30, 50, 51, 62, 90, 200, 600, 1500]);
  assert.deepEqual(L.balance.map((v) => v / M), [0.5, 2, 2.1, 6, 10, 10.5, 30, 38, 43, 44, 70, 200, 600, 1500]);
});

test('rule 8: params are normalised', () => {
  const n = logic.normalise({ sector: 'bank', staff: 99, turnover: -3, balance: '4.6', telecom: 'true', dns: 1, qtsp: 'yes', named: '1' });
  assert.deepEqual(n, { sector: 'water', staff: 12, turnover: 0, balance: 5, telecom: true, dns: true, qtsp: false, named: true });
  assert.deepEqual(logic.normalise({ staff: 'x', turnover: null, balance: '' }), logic.defaults);
  assert.deepEqual(logic.normalise({}), logic.defaults);
  assert.equal(logic.compute({ sector: 'constructor' }).sector, 'water');
});

test('rule 9: main caption key and notes', () => {
  const k = (...a) => logic.captionKey(S(...a));
  assert.deepEqual(k('water', 120, 30, 70), { key: 'cap_annex1_important', notes: ['nUp3'] });
  assert.deepEqual(k('water', 400, 90, 70), { key: 'cap_annex1_essential', notes: ['nDown2'] });
  assert.deepEqual(k('water', 25, 6, 6), { key: 'capOut_small', notes: ['nUp2'] });
  assert.deepEqual(k('food', 400, 90, 70), { key: 'cap_annex2_important', notes: ['nCap'] });
  assert.deepEqual(k('food', 25, 6, 6), { key: 'capOut_small', notes: ['nUp2'] });
  assert.deepEqual(k('retail', 400, 90, 70), { key: 'capOut_unlisted', notes: ['nNever'] });
  assert.deepEqual(k('local', 400, 90, 70), { key: 'capOut_local', notes: ['nNever'] });
  assert.deepEqual(k('central', 3, 0.5, 0.5), { key: 'cap_central_essential', notes: ['nAny'] });
  assert.deepEqual(k('retail', 25, 6, 6, 'telecom'), { key: 'cap_telecom_important', notes: ['nUp2'] });
  assert.deepEqual(k('retail', 400, 90, 70, 'telecom'), { key: 'cap_telecom_essential', notes: ['nDown1'] });
  assert.deepEqual(k('retail', 3, 0.5, 0.5, 'qtsp'), { key: 'cap_qtsp_essential', notes: ['nAny'] });
  assert.deepEqual(k('food', 3, 0.5, 0.5, 'named'), { key: 'cap_named_essential', notes: ['nAny'] });
  // the second note: idle named first, otherwise several rows
  assert.deepEqual(k('retail', 400, 90, 70, 'named'), { key: 'capOut_unlisted', notes: ['nNever', 'nNamedIdle'] });
  assert.deepEqual(k('water', 400, 90, 70, 'dns'), { key: 'cap_annex1_essential', notes: ['nAny', 'nSeveral'] });
  assert.deepEqual(k('water', 120, 30, 70, 'dns'), { key: 'cap_dns_essential', notes: ['nAny', 'nSeveral'] });
  assert.deepEqual(k('local', 3, 0.5, 0.5, 'dns', 'named'), { key: 'cap_dns_essential', notes: ['nAny', 'nSeveral'] });
  // important with an up: up wins over cap
  assert.deepEqual(k('food', 25, 6, 6, 'telecom'), { key: 'cap_telecom_important', notes: ['nUp2'] });
});

test('rule 9: every reachable caption key and note has words, and nothing else is reachable', () => {
  const keys = new Set(), notes = new Set();
  const L = logic.LADDERS;
  for (const [sector] of logic.SECTORS) {
    for (let st = 0; st < L.staff.length; st++) {
      for (const tu of [0, 2, 5, 8, 9, 13]) {
        for (const ba of [0, 2, 5, 8, 9, 13]) {
          for (let m = 0; m < 16; m++) {
            const p = { sector, staff: st, turnover: tu, balance: ba };
            N.ROLES.forEach((r, j) => { p[r] = Boolean(m & (1 << j)); });
            const c = logic.captionKey(logic.compute(p));
            keys.add(c.key);
            c.notes.forEach((x) => notes.add(x));
            assert.ok(c.notes.length >= 1 && c.notes.length <= 2);
          }
        }
      }
    }
  }
  assert.deepEqual([...keys].sort(), [
    'capOut_local', 'capOut_small', 'capOut_unlisted',
    'cap_annex1_essential', 'cap_annex1_important', 'cap_annex2_important', 'cap_central_essential',
    'cap_dns_essential', 'cap_named_essential', 'cap_qtsp_essential', 'cap_telecom_essential', 'cap_telecom_important'
  ]);
  assert.deepEqual([...notes].sort(), ['nAny', 'nCap', 'nDown1', 'nDown2', 'nNamedIdle', 'nNever', 'nSeveral', 'nUp2', 'nUp3']);
  for (const lang of ['hr', 'en']) for (const x of [...keys, ...notes]) assert.ok(strings[lang][x], `${lang} ${x}`);
});

test('rule 10: what changed between two states', () => {
  const a = S('water', 249, 30, 70), b = S('water', 250, 30, 70);
  assert.deepEqual(logic.flipped(a, b), { size: true, cls: true, rows: [] });
  assert.deepEqual(logic.flipped(a, a), { size: false, cls: false, rows: [] });
  assert.deepEqual(logic.flipped(null, a), { size: false, cls: false, rows: [] });
  assert.deepEqual(logic.flipped(a, null), { size: false, cls: false, rows: [] });
  const c = S('food', 249, 30, 70, 'dns');
  assert.deepEqual(logic.flipped(a, c), { size: false, cls: true, rows: ['annex1', 'annex2', 'dns'] });
  // a role switched on that does not change the class: only its row
  assert.deepEqual(logic.flipped(b, S('water', 250, 30, 70, 'qtsp')), { size: false, cls: false, rows: ['qtsp'] });
});

test('state: values, size checks per ceiling, classes per column, public body', () => {
  const s = S('msp', 120, 62, 38);
  assert.deepEqual([s.staff, s.turnover, s.balance, s.size, s.sizeId], [120, 62 * M, 38 * M, 2, 'medium']);
  assert.deepEqual(s.ceilings.map((c) => c.ok), [false, false, true]);
  assert.deepEqual(s.byCol, ['out', 'out', 'important', 'essential']);
  assert.equal(s.publicBody, false);
  assert.equal(S('central', 49, 6, 6).publicBody, true);
  assert.equal(S('local', 49, 6, 6).publicBody, true);
  assert.equal(s.group, 'annex1');
});

// ── presets ──

test('presets: the SPEC table', () => {
  const row = (id) => {
    const s = logic.compute(preset(id));
    const c = logic.captionKey(s);
    return [s.sector, s.staff, s.turnover / M, s.balance / M, s.sizeId, s.cls, s.decider, c.notes.join(' '),
      s.fines.essential.ceiling / M, s.fines.essential.by, s.fines.important.ceiling / M, s.fines.important.by, s.publicBody];
  };
  assert.deepEqual(row('water'), ['water', 180, 30, 70, 'medium', 'important', 'annex1', 'nUp3', 10, 'fixed', 7, 'fixed', false]);
  assert.deepEqual(row('msp'), ['msp', 120, 62, 38, 'medium', 'important', 'annex1', 'nUp3', 10, 'fixed', 7, 'fixed', false]);
  assert.deepEqual(row('machines'), ['manufacturing', 400, 600, 200, 'large', 'important', 'annex2', 'nCap', 12, 'pct', 8.4, 'pct', false]);
  assert.deepEqual(row('shop'), ['retail', 1000, 200, 200, 'large', 'out', null, 'nNever', 10, 'fixed', 7, 'fixed', false]);
  assert.deepEqual(row('dns'), ['software', 9, 2, 0.5, 'micro', 'essential', 'dns', 'nAny', 10, 'fixed', 7, 'fixed', false]);
  assert.deepEqual(row('agency'), ['central', 49, 6, 6, 'small', 'essential', 'central', 'nAny', 10, 'fixed', 7, 'fixed', true]);
});

test('presets: what the student does next (SPEC)', () => {
  const p = (id, over) => logic.compute(Object.assign({}, preset(id), over));
  assert.equal(p('water', { staff: ix('staff', 250) }).cls, 'essential');
  assert.deepEqual([p('msp', { balance: ix('balance', 44) }).sizeId, p('msp', { balance: ix('balance', 44) }).cls], ['large', 'essential']);
  assert.equal(p('machines', { sector: 'energy' }).cls, 'essential');
  assert.equal(p('machines', { staff: ix('staff', 50), turnover: ix('turnover', 6), balance: ix('balance', 6) }).cls, 'important');
  assert.equal(p('shop', { dns: true }).cls, 'essential');
  assert.equal(p('dns', { dns: false }).cls, 'out');
  assert.equal(p('agency', { sector: 'water' }).cls, 'out');
});

test('the defaults are the first preset; presets carry every key', () => {
  assert.deepEqual(logic.defaults, logic.presets[0].params);
  for (const x of logic.presets) {
    assert.deepEqual(Object.keys(x.params).sort(), logic.KEYS.slice().sort(), x.id);
    for (const k of ['staff', 'turnover', 'balance']) assert.ok(x.params[k] >= 0, `${x.id} ${k}`);
  }
  assert.equal(new Set(logic.presets.map((x) => x.id)).size, logic.presets.length);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.compute(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = Object.assign({}, preset('msp'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every sector, row, size, class and preset has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const lang of ['hr', 'en']) {
    for (const [id] of logic.SECTORS) assert.ok(strings[lang]['s_' + id], `${lang} s_${id}`);
    for (const g of N.GROUPS) assert.ok(strings[lang]['g_' + g], `${lang} g_${g}`);
    for (const r of N.ROWS) assert.ok(strings[lang]['r_' + r.id], `${lang} r_${r.id}`);
    for (const z of N.SIZES) assert.ok(strings[lang]['z_' + z], `${lang} z_${z}`);
    for (const c of N.CLASSES) for (const k of ['c_', 'cl_']) assert.ok(strings[lang][k + c], `${lang} ${k}${c}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: msp → pMsp. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
