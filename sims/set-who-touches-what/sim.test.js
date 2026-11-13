// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-who-touches-what (rules in SPEC.md): tie-breaks first (rule 5's order, unknown params), then the
// departments (rules 1-2, departments.js) and the crew they read (crew.js), the problems (rule 3), the outcomes
// (rules 4-5), the totals and strategies (rules 6-7), the presets, then the generic block.
// Run: node --test sims/set-who-touches-what/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const dep = require('./departments.js');
const crew = require('./crew.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const K = logic.key;
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const row = (s, id) => s.rows.find((r) => r.id === id);
const O = (id, choice, you = 'trainee') => logic.outcome(id, choice, you);

// ── tie-breaks first ──

test('tie-break (rule 5b before c): asking your own department when it owns the problem is the owner fix, not "myself"', () => {
  assert.deepEqual(O('flag', 'grip', 'gr'), { kind: 'fixed', now: 2, later: 0, by: 'grip' });
  assert.deepEqual(O('cable', 'electric', 'el'), { kind: 'fixed', now: 3, later: 0, by: 'electric' });
});

test('tie-break (rule 5c): "myself" by a member of the owning department is the department\'s own work, same minutes as asking', () => {
  assert.deepEqual(O('flag', 'self', 'gr'), { kind: 'own', now: 2, later: 0, by: 'grip' });
  assert.deepEqual(O('track', 'self', 'gr'), { kind: 'own', now: 4, later: 0, by: 'grip' });
  assert.deepEqual(O('curtain', 'self', 'el'), { kind: 'own', now: 2, later: 0, by: 'electric' });
  assert.deepEqual(O('cup', 'self', 'prop'), { kind: 'own', now: 2, later: 0, by: 'props' });
  assert.deepEqual(O('pack', 'self', 'boom'), { kind: 'own', now: 3, later: 0, by: 'sound' });
  for (const id of logic.IDS) {
    const own = O(id, logic.ownerOfProblem(id));
    for (const you of logic.YOU) {
      const s = O(id, 'self', you);
      if (s.kind === 'own') assert.equal(s.now, own.now, `${id} ${you}`);
    }
  }
});

test('tie-break (rule 5c): the AD trainee owns nothing, so "myself" always harms; the 1st AD\'s department owns no thing', () => {
  for (const id of logic.IDS) assert.equal(O(id, 'self', 'trainee').kind, 'harm', id);
  assert.equal(dep.deptOf('trainee'), 'ad');
  assert.ok(!dep.DEPTS.includes('ad'));
});

test('tie-break (rule 5f): your own department, when it does not own the problem, passes it on like any other', () => {
  assert.deepEqual(O('cup', 'grip', 'gr'), { kind: 'passed', now: 3 + 2, later: 0, by: 'props', via: 'grip' });
  assert.deepEqual(O('flag', 'electric', 'el'), { kind: 'passed', now: 3 + 2, later: 0, by: 'grip', via: 'electric' });
});

test('tie-break (rule 5a): an unknown or missing choice reads as not decided; an unknown "you" as the trainee; an unknown selection as the first problem', () => {
  for (const bad of ['', 'dragon', null, undefined, 3, 'ad1', 'direction', 'cast']) {
    assert.deepEqual(O('flag', bad), { kind: 'open', now: null, later: 0, by: null }, String(bad));
    assert.equal(row(D({ [K('flag')]: bad }), 'flag').kind, 'open', String(bad));
  }
  assert.equal(D({ you: 'dop' }).you, 'trainee');
  assert.equal(D({ you: 'x' }).youDept, 'ad');
  assert.equal(D({ sel: 'dragon' }).sel, 'flag');
  assert.equal(D({ sel: 'van' }).sel, 'van');
});

test('tie-break (rule 4): the owner\'s fix is never faster than an outsider\'s own fix (SELF), nor slower than the 1st AD route', () => {
  for (const x of logic.PROBLEMS) {
    assert.ok(x.fix > logic.SELF, `${x.id}: the outsider's fix looks fastest`);
    assert.ok(logic.AD < logic.PASS, 'the 1st AD routes faster than a wrong department passes it on');
  }
});

test('rule 5 is a function of the problem, the choice and the person only: the order of rows does not matter', () => {
  const p = P(Object.assign({}, preset('look'), { [K('van')]: 'self' }));
  const s = logic.derive(p);
  for (const r of s.rows) {
    const o = O(r.id, r.choice, s.you);
    for (const k of Object.keys(o)) assert.deepEqual(r[k], o[k], `${r.id}.${k}`);
  }
});

// ── the departments (departments.js) and the crew they read (crew.js) ──

test('rule 1: ten departments in the page\'s order, each with one head; the crew\'s heads are reused, four are added', () => {
  assert.deepEqual(dep.DEPTS, ['electric', 'grip', 'camera', 'sound', 'art', 'props', 'costume', 'makeup', 'locations', 'production']);
  const heads = dep.DEPTS.map(dep.headOf);
  assert.deepEqual(heads, ['gaf', 'kg', 'dop', 'snd', 'artd', 'pmast', 'cos', 'mu', 'loc', 'prod']);
  assert.equal(new Set(heads).size, 10);
  for (const d of ['electric', 'grip', 'camera', 'sound', 'props', 'production']) assert.equal(dep.headOf(d), crew.headOf(d), d);
  for (const h of dep.EXTRA_HEADS) {
    assert.equal(crew.headOf(h.dept), null, `${h.dept} is not in the crew model`);
    assert.equal(h.via, 'ad1');
    assert.equal(h.head, true);
    assert.equal(dep.deptOf(h.id), h.dept);
  }
  assert.equal(dep.headOf('cast'), null);
});

test('crew.js is the shared crew, unchanged: fifteen people, the 1st AD at the root, the people "you" can be', () => {
  assert.equal(crew.PEOPLE.length, 15);
  assert.equal(crew.person('ad1').via, null);
  assert.deepEqual(crew.path('gr', 'ad1'), ['gr', 'kg', 'dop', 'ad1']);
  assert.deepEqual(logic.YOU.map((y) => crew.person(y).dept), ['ad', 'grip', 'electric', 'props', 'sound']);
  for (const y of logic.YOU) assert.equal(crew.person(y).head, false, `${y} is crew, not a head`);
});

test('rule 2: every kind of thing has exactly one owner; the catalogue\'s list', () => {
  const seen = {};
  for (const d of dep.DEPTS) for (const k of dep.OWNS[d]) {
    assert.equal(seen[k], undefined, `${k} owned twice`);
    seen[k] = d;
    assert.equal(dep.ownerOf(k), d);
  }
  assert.deepEqual(dep.OWNS, {
    electric: ['lamp', 'power', 'cable'], grip: ['stand', 'flag', 'track', 'rigging', 'sandbag'], camera: ['camera', 'card'],
    sound: ['microphone', 'transmitter'], art: ['dressing'], props: ['prop'], costume: ['clothing'], makeup: ['face', 'hair'],
    locations: ['location', 'owner'], production: ['paperwork', 'transport', 'catering']
  });
  assert.equal(dep.ownerOf('lamp'), 'electric');
  assert.equal(dep.ownerOf('power'), 'electric');
  assert.equal(dep.ownerOf('stand'), 'grip');
  assert.equal(dep.ownerOf('flag'), 'grip');
  assert.equal(dep.ownerOf('track'), 'grip');
  assert.equal(dep.ownerOf('rigging'), 'grip');
  assert.equal(dep.ownerOf('card'), 'camera');
  assert.equal(dep.ownerOf('transmitter'), 'sound');
  assert.equal(dep.ownerOf('dressing'), 'art');
  assert.equal(dep.ownerOf('prop'), 'props');
  assert.equal(dep.ownerOf('clothing'), 'costume');
  assert.equal(dep.ownerOf('hair'), 'makeup');
  assert.equal(dep.ownerOf('owner'), 'locations');
  assert.equal(dep.ownerOf('catering'), 'production');
  assert.throws(() => dep.ownerOf('dragon'), /nobody owns/);
  assert.throws(() => dep.ownerOf('toString'), /nobody owns/);
  for (const d of dep.DEPTS) assert.ok(dep.OWNS[d].length >= 1, d);
});

// ── the problems (rule 3) ──

test('rule 3: the thing each problem is about (its owner follows from rule 2)', () => {
  assert.deepEqual(logic.PROBLEMS.map((x) => x.thing),
    ['flag', 'prop', 'cable', 'lamp', 'clothing', 'camera', 'transmitter', 'dressing', 'face', 'owner', 'transport', 'track']);
});

test('the choices in the picker\'s order: myself, the ten departments in rule 1\'s order, the 1st AD', () => {
  assert.deepEqual(logic.CHOICES, ['self', ...dep.DEPTS, 'ad']);
});

test('rule 3: twelve problems; every department owns at least one; the table of owners, fixes, harms and costs', () => {
  const want = {
    flag: ['grip', 2, 'injury', 20], cup: ['props', 2, 'continuity', 30], cable: ['electric', 3, 'spoiled', 10],
    curtain: ['electric', 2, 'injury', 20], coat: ['costume', 5, 'damage', 45], monitor: ['camera', 2, 'spoiled', 40],
    pack: ['sound', 3, 'spoiled', 15], vase: ['art', 2, 'continuity', 25], shine: ['makeup', 2, 'continuity', 20],
    armchair: ['locations', 5, 'damage', 30], van: ['production', 4, 'damage', 30], track: ['grip', 4, 'spoiled', 15]
  };
  assert.deepEqual(logic.IDS, Object.keys(want));
  for (const x of logic.PROBLEMS) {
    assert.deepEqual([logic.ownerOfProblem(x.id), x.fix, x.harm, x.cost], want[x.id], x.id);
    assert.ok(logic.HARMS.includes(x.harm));
  }
  assert.deepEqual(new Set(logic.IDS.map(logic.ownerOfProblem)), new Set(dep.DEPTS));
  for (const h of logic.HARMS) assert.ok(logic.PROBLEMS.some((x) => x.harm === h), h);
  assert.throws(() => logic.problem('dragon'), /unknown problem/);
});

// ── the outcomes (rules 4-5) ──

test('rule 4: the minutes', () => {
  assert.equal(logic.SELF, 1);
  assert.equal(logic.PASS, 3);
  assert.equal(logic.AD, 2);
});

test('rule 5b: the owning department fixes it after its fix minutes, whoever asks', () => {
  for (const x of logic.PROBLEMS) for (const you of logic.YOU) {
    assert.deepEqual(O(x.id, logic.ownerOfProblem(x.id), you), { kind: 'fixed', now: x.fix, later: 0, by: logic.ownerOfProblem(x.id) });
  }
});

test('rule 5d: an outsider\'s own fix: gone in SELF minutes, and the hidden harm costs its minutes later', () => {
  assert.deepEqual(O('flag', 'self'), { kind: 'harm', now: 1, later: 20, by: null, harm: 'injury' });
  assert.deepEqual(O('cup', 'self'), { kind: 'harm', now: 1, later: 30, by: null, harm: 'continuity' });
  assert.deepEqual(O('monitor', 'self', 'gr'), { kind: 'harm', now: 1, later: 40, by: null, harm: 'spoiled' });
  assert.deepEqual(O('van', 'self', 'el'), { kind: 'harm', now: 1, later: 30, by: null, harm: 'damage' });
  assert.deepEqual(O('flag', 'self', 'el'), { kind: 'harm', now: 1, later: 20, by: null, harm: 'injury' }, 'electric does not own the flag');
});

test('rule 5e: the 1st AD sends it to the owner: AD + fix minutes', () => {
  for (const x of logic.PROBLEMS) assert.deepEqual(O(x.id, 'ad'), { kind: 'routed', now: 2 + x.fix, later: 0, by: logic.ownerOfProblem(x.id) });
});

test('rule 5f: a wrong department does not touch it: PASS + fix minutes, fixed by the owner', () => {
  assert.deepEqual(O('flag', 'electric'), { kind: 'passed', now: 5, later: 0, by: 'grip', via: 'electric' });
  assert.deepEqual(O('cable', 'grip'), { kind: 'passed', now: 6, later: 0, by: 'electric', via: 'grip' });
  for (const x of logic.PROBLEMS) for (const d of dep.DEPTS) {
    if (d === logic.ownerOfProblem(x.id)) continue;
    const o = O(x.id, d);
    assert.equal(o.kind, 'passed');
    assert.equal(o.now, 3 + x.fix);
    assert.equal(o.later, 0, 'nothing breaks: they did not touch it');
  }
});

test('rows carry the owner and its head, and the choice as read', () => {
  const s = D({ [K('armchair')]: 'art' });
  const r = row(s, 'armchair');
  assert.equal(r.owner, 'locations');
  assert.equal(r.head, 'loc');
  assert.equal(r.choice, 'art');
  assert.equal(row(s, 'flag').head, 'kg');
  assert.equal(row(s, 'flag').choice, '');
});

// ── totals and strategies (rules 6-7) ──

test('rule 6: totals count each kind and harm, add the minutes now and later; open rows add nothing', () => {
  const s = D({});
  assert.equal(s.totals.open, 12);
  assert.equal(s.totals.total, 0);
  const m = D({ [K('flag')]: 'self', [K('cup')]: 'props', [K('cable')]: 'ad', [K('coat')]: 'art', [K('vase')]: 'self' });
  assert.deepEqual(
    [m.totals.open, m.totals.fixed, m.totals.routed, m.totals.passed, m.totals.harm, m.totals.injury, m.totals.continuity],
    [7, 1, 1, 1, 2, 1, 1]);
  assert.equal(m.totals.now, 1 + 2 + (2 + 3) + (3 + 5) + 1);
  assert.equal(m.totals.later, 20 + 25);
  assert.equal(m.totals.total, m.totals.now + m.totals.later);
});

test('rule 7: the three strategies for the trainee: owner 36, 1st AD 60, myself 12 now + 300 later', () => {
  const c = D({}).compare;
  assert.deepEqual([c.owner.now, c.owner.later, c.owner.total, c.owner.fixed], [36, 0, 36, 12]);
  assert.deepEqual([c.ad.now, c.ad.later, c.ad.total, c.ad.routed], [60, 0, 60, 12]);
  assert.deepEqual([c.self.now, c.self.later, c.self.total, c.self.harm, c.self.injury], [12, 300, 312, 12, 2]);
  const g = D({ you: 'gr' }).compare.self;
  assert.deepEqual([g.own, g.harm, g.now, g.later, g.injury], [2, 10, 16, 265, 1]);
  assert.deepEqual(D({ you: 'el' }).compare.self.total, 285);
  assert.deepEqual(D({ you: 'prop' }).compare.self.total, 283);
  assert.deepEqual(D({ you: 'boom' }).compare.self.total, 299);
});

test('rule 7: for every person, myself shows the problems gone soonest and costs the day the most', () => {
  for (const you of logic.YOU) {
    const c = D({ you }).compare;
    assert.ok(c.self.now < c.owner.now && c.owner.now < c.ad.now, you);
    assert.ok(c.self.total > c.ad.total && c.ad.total > c.owner.total, you);
  }
});

// ── presets ──

test('presets: their choices and their expected numbers (SPEC.md, presets)', () => {
  const want = {
    start: { you: 'trainee', sel: 'flag', open: 12, now: 0, later: 0 },
    self: { you: 'trainee', sel: 'flag', harm: 12, now: 12, later: 300, injury: 2 },
    owner: { you: 'trainee', sel: 'flag', fixed: 12, now: 36, later: 0 },
    look: { you: 'trainee', sel: 'cup', fixed: 6, passed: 6, now: 54, later: 0 },
    ad: { you: 'trainee', sel: 'flag', routed: 12, now: 60, later: 0 },
    grip: { you: 'gr', sel: 'flag', own: 2, harm: 10, now: 16, later: 265, injury: 1 }
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const x of logic.presets) {
    const s = logic.derive(x.params);
    for (const [k, v] of Object.entries(want[x.id])) {
      if (k === 'you' || k === 'sel') assert.equal(s[k], v, `${x.id} ${k}`);
      else assert.equal(s.totals[k], v, `${x.id} ${k}`);
    }
  }
  assert.deepEqual(logic.LOOK, {
    flag: 'electric', cup: 'art', cable: 'grip', curtain: 'electric', coat: 'costume', monitor: 'camera',
    pack: 'costume', vase: 'props', shine: 'makeup', armchair: 'art', van: 'production', track: 'grip'
  });
  const look = logic.derive(preset('look'));
  assert.deepEqual(look.rows.filter((r) => r.kind === 'passed').map((r) => r.id), ['flag', 'cup', 'cable', 'pack', 'vase', 'armchair']);
});

// ── generic ──

function* someParams() {
  for (const x of logic.presets) yield x.params;
  yield P({ you: 'boom', sel: 'pack', [K('pack')]: 'self', [K('van')]: 'ad', [K('coat')]: 'makeup' });
  yield P({ you: 'nobody', sel: 7, [K('flag')]: 'dragon' });
}

test('state is JSON-safe', () => {
  for (const p of someParams()) {
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P(preset('look'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; every id has its words; the page is an explorer', () => {
  for (const x of logic.presets) {
    assert.deepEqual(Object.keys(x.params).sort(), Object.keys(logic.defaults).sort(), x.id);
    for (const id of logic.IDS) assert.ok(['', ...logic.CHOICES].includes(x.params[K(id)]), `${x.id} ${id}`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + x.id], `${lang} name of ${x.id}`);
      assert.ok(strings[lang]['hint_' + x.id], `${lang} hint of ${x.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    const T = strings[lang];
    for (const id of logic.IDS) for (const pre of ['short_', 'see_', 'hidden_', 'fix_', 'harm_']) assert.ok(T[pre + id], `${lang} ${pre}${id}`);
    for (const d of dep.DEPTS) for (const pre of ['dept_', 'head_']) assert.ok(T[pre + d], `${lang} ${pre}${d}`);
    for (const y of logic.YOU) assert.ok(T['you_' + y], `${lang} you_${y}`);
    for (const h of logic.HARMS) assert.ok(T['harmk_' + h], `${lang} harmk_${h}`);
    for (const k of ['open', 'fixed', 'own', 'routed', 'passed', 'harm']) assert.ok(T['out_' + k], `${lang} out_${k}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
