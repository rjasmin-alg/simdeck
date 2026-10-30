// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for password-storage. Run: node --test sims/password-storage/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the rules, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const preset = (id) => logic.presets.find((p) => p.id === id).params;
const row = (s, scheme) => s.attack.schemes.find((r) => r.scheme === scheme);
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');
const YEAR = 365.25 * 86400;

// ── tie-breaks ──

test('tie-break: same-value groups list members in name order, groups by their first member', () => {
  assert.deepEqual(logic.sameGroups([
    { name: 'Zora', value: 'y' }, { name: 'Marko', value: 'x' }, { name: 'Iva', value: 'y' }, { name: 'Ana', value: 'x' }, { name: 'Ema', value: 'z' }
  ]), [['Ana', 'Marko'], ['Iva', 'Zora']]);
  // In the page's table: Luka types Iva's password, so there are two groups; Ana's comes first.
  assert.deepEqual(S({ password: 'Tr4m!vaj' }).groups.hash, [['Ana', 'Marko'], ['Iva', 'Luka']]);
  // Luka types Ana's password: one group of three, Luka between Ana and Marko by name.
  assert.deepEqual(S({ password: 'ljeto2026' }).groups.plain, [['Ana', 'Luka', 'Marko']]);
  // Equality is on the whole value: a password sharing only a prefix is no group.
  assert.deepEqual(S({ password: 'ljxyz' }).groups.plain, [['Ana', 'Marko']]);
  assert.deepEqual(S({ password: 'ljeto20266' }).groups.hash, [['Ana', 'Marko']]);
  // A user alone is no group.
  assert.deepEqual(logic.sameGroups([{ name: 'Ana', value: 'x' }]), []);
});

test('tie-break: a duration takes the largest unit that still shows at least 1 after rounding', () => {
  assert.deepEqual(logic.timeParts(59.97), { unit: 'min', value: 1 });
  assert.deepEqual(logic.timeParts(59.4), { unit: 's', value: 59 });
  assert.deepEqual(logic.timeParts(9.96), { unit: 's', value: 10 });
  assert.deepEqual(logic.timeParts(1e-7), { unit: 'us', value: 0.1 });
  assert.deepEqual(logic.timeParts(0), { unit: 'now' });
  // a million years and more switch to m · 10^e
  assert.deepEqual(logic.timeParts(999999.6 * YEAR), { unit: 'y', m: 1, e: 6 });
  assert.deepEqual(logic.timeParts(5e5 * YEAR), { unit: 'y', value: 500000 });
  assert.deepEqual(logic.timeParts(999999.4 * YEAR), { unit: 'y', value: 999999 });
  assert.deepEqual(logic.timeParts(5.3149e9 * YEAR), { unit: 'y', m: 5.31, e: 9 });
});

test('tie-break: caption focus: a preset decides, then a scheme change wins over the rest', () => {
  assert.equal(logic.nextFocus(null, null, P(), 'same-password', null), 'table');
  assert.equal(logic.nextFocus('table', P(), P(preset('four-chars')), 'four-chars', 'same-password'), 'time');
  assert.equal(logic.nextFocus('table', P(), P({ length: 9 }), null, null), 'time');
  assert.equal(logic.nextFocus('time', P(), P({ length: 9, scheme: 'salted' }), null, null), 'table');
  assert.equal(logic.nextFocus('time', P(), P(), null, null), 'time', 'nothing changed keeps it');
  assert.equal(logic.nextFocus(null, null, P(), null, null), 'table', 'page start on the defaults');
  assert.equal(logic.nextFocus(null, null, P({ fastRate: 1e9 }), null, null), 'time', 'a link that changes a rate');
  assert.equal(logic.nextFocus('table', P(), P({ password: 'k7Pm2xQb' }), null, null), 'time', 'typing that keeps the shape');
});

test('tie-break: precomputed-table hits come in server order', () => {
  const s = S({ password: '123456' });
  assert.deepEqual(s.hits.hash.map((h) => h.name), ['Ana', 'Marko', 'Luka']);
  assert.deepEqual(s.hits.hash.map((h) => h.password), ['ljeto2026', 'ljeto2026', '123456']);
});

// ── rules ──

test('rule 1: plain stores the password itself; nothing to guess, no lookup needed', () => {
  const s = S();
  assert.deepEqual(s.table.map((r) => r.stored.plain), ['ljeto2026', 'ljeto2026', 'Tr4m!vaj', 'k7Pm2xQa']);
  assert.equal(s.hits.plain, null);
  assert.equal(row(s, 'plain').seconds, 0);
  assert.equal(row(s, 'plain').table, 0);
});

test('rule 2: unsalted hash: equal passwords give equal stored values, and the precomputed table reverses common ones', () => {
  const s = S();
  assert.equal(s.table[0].stored.hash, sha('ljeto2026').slice(0, 16));
  assert.equal(s.table[0].stored.hash, '3e618b3965085b27');
  assert.equal(s.table[0].stored.hash, s.table[1].stored.hash);
  assert.notEqual(s.table[2].stored.hash, s.table[0].stored.hash);
  assert.deepEqual(s.groups.hash, [['Ana', 'Marko']]);
  assert.deepEqual(s.hits.hash.map((h) => h.name), ['Ana', 'Marko'], 'Iva and Luka are not common');
  assert.deepEqual(S(preset('breached')).hits.hash.map((h) => h.name), ['Ana', 'Marko', 'Luka']);
  // the table is SHA-256 of each common password
  for (const e of logic.rainbowTable()) assert.equal(e.hash, sha(e.password));
  // one pass checks every stored value: the whole table costs the same as one password
  assert.equal(row(s, 'hash').table, row(s, 'hash').seconds);
});

test('rule 3: a salt per user makes equal passwords differ; the precomputed table finds nothing; each user separately', () => {
  const s = S();
  assert.equal(s.table[0].stored.salted, sha('3f9a1c07ljeto2026').slice(0, 16));
  assert.equal(s.table[0].stored.salted, 'a4e207329682f39b');
  assert.equal(s.table[1].stored.salted, 'c46c32b45600f6ca');
  assert.deepEqual(s.groups.salted, []);
  assert.deepEqual(s.groups.slow, []);
  assert.deepEqual(s.hits.salted, []);
  assert.deepEqual(s.hits.slow, []);
  // even a common password typed by Luka is not found once salted
  assert.deepEqual(S({ password: 'qwerty' }).hits.salted, []);
  // the salt is public: it is in the state next to the value
  assert.deepEqual(s.users.map((u) => u.salt), ['3f9a1c07', 'b24e6d91', '7c05e2ab', 'e81d4f36']);
  assert.equal(new Set(s.users.map((u) => u.salt)).size, 4);
  // each user is attacked separately: the whole table is 4 × one password
  assert.equal(row(s, 'salted').table, 4 * row(s, 'salted').seconds);
  assert.equal(row(s, 'salted').seconds, row(s, 'hash').seconds, 'per password the salt adds no work');
});

test('rule 4: slow hash: the attacker\'s rate is slowRate; the stored value is 1000 rounds of SHA-256 over salt + password', () => {
  let x = crypto.createHash('sha256').update('3f9a1c07ljeto2026').digest();
  for (let r = 1; r < 1000; r++) x = crypto.createHash('sha256').update(x).digest();
  assert.equal(logic.slowHash('3f9a1c07', 'ljeto2026'), x.toString('hex'));
  assert.equal(S().table[0].stored.slow, '02450440c1ca5d60');
  const s = S({ slowRate: 1e3, fastRate: 1e11 });
  assert.equal(row(s, 'slow').seconds, s.attack.guesses / 1e3);
  assert.equal(row(s, 'hash').seconds, s.attack.guesses / 1e11);
  assert.equal(row(s, 'slow').table, 4 * row(s, 'slow').seconds);
});

test('rule 5: space = alphabet^length; worst = space / rate, average half; the task\'s numbers', () => {
  const four = S(preset('four-chars'));
  assert.equal(four.attack.space, 456976);
  assert.deepEqual(logic.timeParts(row(four, 'hash').seconds), { unit: 'us', value: 46 });
  assert.deepEqual(logic.timeParts(row(four, 'slow').seconds), { unit: 's', value: 46 });
  assert.equal(row(four, 'slow').average, row(four, 'slow').seconds / 2);
  const eight = S(preset('eight-alnum'));
  assert.equal(eight.attack.space, 218340105584896);
  assert.deepEqual(logic.timeParts(row(eight, 'hash').seconds), { unit: 'h', value: 6.1 });
  assert.deepEqual(logic.timeParts(row(eight, 'slow').seconds), { unit: 'y', value: 692 });
  const pass = S(preset('passphrase15'));
  assert.deepEqual(logic.sci(pass.attack.space), { m: 1.68, e: 21 });
  assert.deepEqual(logic.timeParts(row(pass, 'hash').seconds), { unit: 'y', value: 5315 });
  assert.equal(S({ length: 20, alphabet: 95 }).attack.space, Math.pow(95, 20));
  assert.equal(four.attack.secondsWorst, row(four, 'slow').seconds, 'secondsWorst is the chosen scheme\'s');
});

test('rule 6: a password in a breach list falls within list-size guesses, whatever its length', () => {
  const b = S(preset('breached'));
  assert.equal(b.attack.guesses, 1e6);
  assert.deepEqual(logic.timeParts(row(b, 'hash').seconds), { unit: 'us', value: 100 });
  assert.equal(row(b, 'slow').seconds, 100);
  assert.equal(S({ length: 20, alphabet: 95, inBreachList: true }).attack.guesses, 1e6);
  // a space smaller than the list is searched whole
  assert.equal(S({ length: 4, alphabet: 10, inBreachList: true }).attack.guesses, 1e4);
});

test('rule 7: the explanation names /etc/shadow (root only) in both languages', () => {
  for (const l of ['hr', 'en']) assert.match(strings[l].explain, /\/etc\/shadow/);
});

test('a typed password gives the attack its shape: length 4…20, smallest alphabet, breach-list flag', () => {
  assert.deepEqual(logic.shapeOf('kava'), { length: 4, alphabet: 26, inBreachList: false });
  assert.deepEqual(logic.shapeOf('1234'), { length: 4, alphabet: 10, inBreachList: false });
  assert.deepEqual(logic.shapeOf('k7Pm2xQa'), { length: 8, alphabet: 62, inBreachList: false });
  assert.deepEqual(logic.shapeOf('Tr4m!vaj'), { length: 8, alphabet: 95, inBreachList: false });
  assert.deepEqual(logic.shapeOf('qwertyuiopasdfg'), { length: 15, alphabet: 26, inBreachList: true });
  assert.deepEqual(logic.shapeOf('ab'), { length: 4, alphabet: 26, inBreachList: false });
  assert.equal(logic.shapeOf('x'.repeat(30)).length, 20);
  assert.equal(logic.shapeOf('ćevap').length, 5, 'code points, not UTF-16 units');
  assert.equal(logic.shapeOf('ćevap').alphabet, 95);
  assert.equal(logic.shapeOf(''), null);
  assert.equal(logic.shapeOf('KAVA').alphabet, 62, 'uppercase is not a–z');
  assert.equal(logic.shapeOf('kaVa').alphabet, 62);
  assert.equal(logic.shapeOf('ab12').alphabet, 62);
  assert.equal(logic.shapeOf('12ab').alphabet, 62);
  assert.equal(logic.shapeOf('a b c d').alphabet, 95, 'a space is not a letter or digit');
  assert.equal(logic.shapeOf('😀😀😀😀😀').length, 5, 'code points, not UTF-16 units');
  assert.equal(logic.shapeOf('😀😀😀😀😀😀😀😀😀😀😀').length, 11);
  assert.equal(logic.shapeOf('QWERTY').inBreachList, false, 'the list is matched exactly');
  assert.equal(logic.shapeOf('qwerty').inBreachList, true);
  for (const p of logic.presets) {
    if (p.params.password === undefined) continue;
    const sh = logic.shapeOf(p.params.password);
    assert.equal(sh.length, p.params.length, p.id);
    assert.equal(sh.alphabet, p.params.alphabet, p.id);
    assert.equal(sh.inBreachList, p.params.inBreachList, p.id);
  }
  const d = logic.shapeOf(logic.defaults.password);
  assert.deepEqual([d.length, d.alphabet, d.inBreachList], [logic.defaults.length, logic.defaults.alphabet, logic.defaults.inBreachList]);
});

test('numbers for the page: separators, m · 10^e, superscripts, the log axis', () => {
  assert.equal(logic.fmtNum(456976, ' ', ','), '456 976');
  assert.equal(logic.fmtNum(456976, ',', '.'), '456,976');
  assert.equal(logic.fmtNum(6.1, ',', '.'), '6.1');
  assert.equal(logic.fmtNum(6.1, ' ', ','), '6,1');
  assert.equal(logic.fmtNum(1000000, ',', '.'), '1,000,000');
  assert.deepEqual(logic.sci(218340105584896), { m: 2.18, e: 14 });
  assert.deepEqual(logic.sci(9.996e9), { m: 1, e: 10 });
  assert.equal(logic.sup(14), '¹⁴');
  assert.equal(logic.sup(-6), '⁻⁶');
  assert.deepEqual(logic.axisPos(0), { pos: 0, over: false });
  assert.equal(logic.axisPos(1e-7).pos, 0);
  assert.equal(logic.axisPos(1e-9).pos, 0, 'clamped at the left end');
  assert.ok(logic.axisPos(1e-6).pos > 0);
  assert.ok(Math.abs(logic.axisPos(1e12 * YEAR).pos - 1) < 1e-12);
  assert.equal(logic.axisPos(1e12 * YEAR).over, false);
  assert.equal(logic.axisPos(1e11 * YEAR).pos < 1, true);
  assert.deepEqual(logic.axisPos(1e13 * YEAR), { pos: 1, over: true });
  assert.deepEqual(logic.axisPos(Math.pow(95, 20) / 1e8), { pos: 1, over: true }, 'the longest time fills the bar');
  assert.ok(Math.abs(logic.axisPos(1).pos - 7 / (7 + Math.log10(1e12 * YEAR))) < 1e-12);
  assert.ok(logic.axisPos(1).pos > logic.axisPos(1e-3).pos);
});

test('SHA-256 copy agrees with node on assorted inputs', () => {
  for (const x of ['', 'abc', 'ljeto2026', 'ćevapčići', 'x'.repeat(200), '😀']) assert.equal(logic.sha256(x), sha(x), x);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = S(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, p.id);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P(preset('breached'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model, and the page has no steps', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.equal(logic.steps, undefined);
  for (const p of logic.presets) for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
  for (const id of ['four-chars', 'same-password', 'eight-alnum', 'passphrase15', 'breached']) assert.ok(logic.presets.some((p) => p.id === id), id);
  assert.deepEqual(logic.presets.map((p) => P(p.params).scheme), ['slow', 'hash', 'hash', 'hash', 'slow']);
  assert.deepEqual(logic.FAST_RATES, [1e8, 1e9, 1e10, 1e11]);
  assert.deepEqual(logic.SLOW_RATES, [1e3, 1e4, 1e5, 1e6]);
  assert.deepEqual(logic.ALPHABETS, [10, 26, 62, 95]);
  assert.equal(S({ inBreachList: 1 }).policy.inBreachList, true, 'the flag is a boolean in the state');
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  for (const e of json.entries || []) assert.ok(logic.presets.some((p) => p.id === e.preset), e.preset);
});
