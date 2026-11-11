// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-chain-of-command: the crew model (crew.js, SPEC.md rules 1-3), then the requests (sim.js, rules 4-11),
// tie-breaks first, then the expected numbers of SPEC.md, then the template's generic block.
// Run: node --test sims/set-chain-of-command/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const crew = require('./crew.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const run = (over, n, mode) => at(over, n).runs[mode];
const req = (r, id) => r.reqs.find((q) => q.id === id);
const only = (...ids) => Object.fromEntries(logic.REQUESTS.map((r) => [r.id, ids.includes(r.id)]));

/** Swap request specs for one test (the model reads them by id), and put them back. */
function withSpecs(patch, fn) {
  const saved = logic.REQUESTS.map((r) => Object.assign({}, r));
  logic.REQUESTS.forEach((r) => { if (patch[r.id]) Object.assign(r, patch[r.id]); });
  try { fn(); } finally { logic.REQUESTS.forEach((r, i) => { Object.keys(r).forEach((k) => delete r[k]); Object.assign(r, saved[i]); }); }
}

// ── tie-breaks first (rule 10) ──

test('rule 10 tie-break: a safety request goes first, even behind one that arrived in the same minute with a lower number', () => {
  const r = run({ mode: 'chain' }, 2, 'chain');
  const hops = r.events.filter((e) => e.kind === 'hop' && e.from === 'ad1');
  assert.deepEqual(hops.map((e) => e.req), ['exit']);
  assert.deepEqual(r.events.filter((e) => e.kind === 'wait').map((e) => [e.req, e.at, e.behind]), [['overtime', 'ad1', 'exit']]);
});

test('rule 10 tie-break: among the rest, the one held longest goes first, before list order', () => {
  // lamp rerouted through the 1st AD arrives there at minute 2; prop arrived at minute 1, waited behind the safety call
  withSpecs({ lamp: { from: 'boom', approvers: ['prod'], doer: 'ad1' } }, () => {
    const o = only('lamp', 'exit', 'prop');
    assert.equal(req(run(o, 2, 'chain'), 'lamp').at, 'ad1');
    assert.equal(req(run(o, 2, 'chain'), 'prop').at, 'ad1');
    const m3 = run(o, 3, 'chain');
    assert.deepEqual(m3.events.filter((e) => e.kind === 'hop' && e.from === 'ad1').map((e) => e.req), ['prop']);
  });
});

test('rule 10 tie-break: same arrival, no safety: list order (the director sends overtime before the prop)', () => {
  for (const mode of logic.MODES) {
    const r = run({}, 7, mode);
    assert.equal(req(r, 'overtime').sent, 1, mode);
    assert.equal(req(r, 'prop').sent, 2, mode);
  }
});

test('rule 10: one message a minute per person; arrivals move on the next minute at the earliest', () => {
  for (let n = 1; n <= logic.steps; n++) {
    for (const mode of logic.MODES) {
      const hops = run({}, n, mode).events.filter((e) => e.kind === 'hop');
      const senders = hops.map((e) => e.from);
      assert.equal(new Set(senders).size, senders.length, `minute ${n} ${mode}`);
      // a request that arrives somewhere this minute does not also move on in the same minute
      for (const e of hops) assert.ok(!hops.some((x) => x.req === e.req && x !== e), `minute ${n}: ${e.req} hopped twice`);
    }
  }
});

// ── the crew (crew.js, rules 1-3) ──

test('rule 1: every department but the cast has exactly one head; everyone but the 1st AD has one line up', () => {
  const depts = [...new Set(crew.PEOPLE.map((p) => p.dept))];
  for (const d of depts) assert.equal(crew.PEOPLE.filter((p) => p.dept === d && p.head).length, d === 'cast' ? 0 : 1, d);
  assert.equal(crew.headOf('cast'), null);
  assert.equal(crew.person('actor').via, 'ad1', 'the cast goes through the 1st AD');
  for (const p of crew.PEOPLE) {
    if (p.id === 'ad1') assert.equal(p.via, null);
    else assert.ok(crew.person(p.via), `${p.id} via ${p.via}`);
    if (!p.head && p.dept !== 'cast') assert.equal(p.via, crew.headOf(p.dept), `${p.id} goes through their own head`);
  }
  assert.equal(crew.person('gaf').via, 'dop');
  assert.equal(crew.person('kg').via, 'dop');
});

test('rule 1: the lines form one tree rooted at the 1st AD', () => {
  for (const p of crew.PEOPLE) {
    const up = crew.upChain(p.id);
    assert.equal(up[up.length - 1], 'ad1', p.id);
    assert.equal(new Set(up).size, up.length, `${p.id}: no loop`);
  }
  assert.equal(crew.lines().length, crew.PEOPLE.length - 1);
});

test('rule 2: the path along the lines goes up to the first shared person, then down', () => {
  assert.deepEqual(crew.path('op', 'el'), ['op', 'dop', 'gaf', 'el']);
  assert.deepEqual(crew.path('dir', 'prod'), ['dir', 'ad1', 'prod']);
  assert.deepEqual(crew.path('trainee', 'gr'), ['trainee', 'ad1', 'dop', 'kg', 'gr']);
  assert.deepEqual(crew.path('el', 'el'), ['el']);
  assert.deepEqual(crew.path('gr', 'trainee'), crew.path('trainee', 'gr').slice().reverse());
  for (const a of crew.PEOPLE) for (const b of crew.PEOPLE) {
    const p = crew.path(a.id, b.id);
    for (let i = 1; i < p.length; i++) assert.ok(crew.isLine(p[i - 1], p[i]), `${a.id}->${b.id}`);
  }
});

test('rule 3: n(n-1)/2 possible lines when everyone talks to everyone, n - 1 through the heads', () => {
  assert.equal(crew.linksAll(40), 780);
  assert.equal(crew.linksChain(40), 39);
  assert.equal(crew.linksAll(60), 1770);
  assert.equal(crew.linksChain(60), 59);
  assert.equal(crew.linksAll(10), 45);
  assert.equal(crew.linksAll(crew.PEOPLE.length), 105);
  assert.equal(crew.linksChain(crew.PEOPLE.length), crew.lines().length);
  assert.equal(crew.linksChain(0), 0);
});

// ── the requests (sim.js, rules 4-9) ──

test('rule 4: five requests; approvers and doers are people of the crew; safety approvers are the 1st AD and the owning head', () => {
  assert.deepEqual(logic.REQUESTS.map((r) => r.id), ['lamp', 'overtime', 'actor', 'exit', 'prop']);
  for (const r of logic.REQUESTS) {
    for (const id of [r.from, r.doer, r.near, ...r.approvers]) assert.ok(crew.person(id), `${r.id}: ${id}`);
    if (r.safety) assert.deepEqual(r.approvers, ['ad1', crew.headOf(crew.person(r.doer).dept)]);
  }
});

test('rule 5: through the chain a request walks the lines from approver to approver, then to the doer', () => {
  const route = (id) => { const r = logic.spec(id); return logic.chainRoute(r.from, r, r.approvers); };
  assert.deepEqual(route('lamp').route, ['op', 'dop', 'gaf', 'el']);
  assert.deepEqual(route('overtime').route, ['dir', 'ad1', 'prod', 'ad1']);
  assert.deepEqual(route('actor').route, ['actor', 'ad1']);
  assert.deepEqual(route('prop').route, ['dir', 'ad1', 'prod', 'ad1', 'pmast', 'prop']);
  for (const id of ['lamp', 'overtime', 'actor', 'prop']) assert.ok(route(id).how.every((k) => k === 'line'), id);
});

test('rule 6: safety skips the lines: straight to the 1st AD, the 1st AD straight to the owning head', () => {
  const r = logic.spec('exit');
  const c = logic.chainRoute(r.from, r, r.approvers);
  assert.deepEqual(c.route, ['trainee', 'ad1', 'kg', 'gr']);
  assert.deepEqual(c.how, ['call', 'call', 'line']);
  assert.notDeepEqual(crew.path('ad1', 'kg'), ['ad1', 'kg'], 'the lines alone would go through the DoP');
});

test('rule 7: each approver says yes when the request reaches them, in order; done when it reaches the doer', () => {
  const r2 = run({}, 2, 'chain');
  assert.deepEqual(req(r2, 'lamp').yes, ['dop', 'gaf']);
  assert.equal(req(r2, 'lamp').status, 'moving');
  const r3 = run({}, 3, 'chain');
  assert.equal(req(r3, 'lamp').status, 'done');
  assert.equal(req(r3, 'lamp').at, 'el');
  // passing through the 1st AD is not a yes unless the 1st AD is an approver
  assert.deepEqual(req(run({}, 2, 'chain'), 'overtime').yes, []);
  assert.deepEqual(req(run({}, 7, 'chain'), 'overtime').yes, ['prod']);
});

test('rule 8 D2: someone from the doer\'s department, not its head, does it at once without the yes', () => {
  const r = run({}, 1, 'direct');
  const q = req(r, 'lamp');
  assert.equal(q.status, 'unapproved');
  assert.equal(q.at, 'el');
  assert.deepEqual(q.yes, []);
  assert.equal(req(run({}, 2, 'direct'), 'prop').status, 'unapproved');
});

test('rule 8 D3: someone who neither decides it nor works in the doer\'s department: the request is lost there', () => {
  const r = run({}, 1, 'direct');
  assert.equal(req(r, 'overtime').status, 'lost');
  assert.equal(req(r, 'overtime').at, 'dop');
  assert.equal(req(r, 'actor').at, 'boom');
  assert.equal(req(r, 'exit').status, 'lost');
  assert.equal(req(r, 'exit').at, 'el', 'an electrician is not grip');
});

test('rule 8 D1: when the nearest is one who decides, it goes on through the chain from there', () => {
  withSpecs({ actor: { near: 'ad1' }, lamp: { near: 'gaf' } }, () => {
    const r1 = run({}, 1, 'direct');
    assert.equal(req(r1, 'actor').status, 'done');
    assert.equal(logic.answerTime(req(r1, 'actor')), 1);
    const r4 = run({}, 4, 'direct');
    assert.deepEqual(req(r4, 'lamp').route, ['op', 'gaf', 'dop', 'gaf', 'el']);
    assert.equal(req(r4, 'lamp').status, 'done');
    assert.deepEqual(req(r4, 'lamp').yes, ['gaf', 'dop']);
  });
});

test('rule 9: one minute after D2 the head calls their crew member back: two orders for that person', () => {
  assert.deepEqual(run({}, 1, 'direct').two, []);
  const r2 = run({}, 2, 'direct');
  assert.deepEqual(r2.events.filter((e) => e.kind === 'counter').map((e) => [e.from, e.to]), [['gaf', 'el']]);
  assert.deepEqual(r2.two, ['el']);
  const r3 = run({}, 3, 'direct');
  assert.deepEqual(r3.events.filter((e) => e.kind === 'counter').map((e) => [e.from, e.to]), [['pmast', 'prop']]);
  assert.deepEqual(r3.two, ['el', 'prop']);
});

test('rule 9: no counter-order when the one asking is the doer\'s own head', () => {
  withSpecs({ lamp: { from: 'gaf' } }, () => {
    const r = run(only('lamp'), 3, 'direct');
    assert.equal(req(r, 'lamp').status, 'unapproved');
    assert.deepEqual(r.two, []);
  });
});

test('rule 9: a person is counted once however many orders reach them', () => {
  withSpecs({ exit: { near: 'gr' }, prop: { near: 'gr', doer: 'gr', approvers: ['prod', 'kg'] } }, () => {
    const r = run(only('exit', 'prop'), 4, 'direct');
    assert.equal(req(r, 'exit').status, 'unapproved');
    assert.equal(req(r, 'prop').status, 'unapproved');
    assert.deepEqual(r.two, ['gr']);
  });
});

test('rule 8: a head of the doer\'s department who is not an approver does not act: D3, lost', () => {
  withSpecs({ prop: { approvers: ['prod'], near: 'pmast' } }, () => {
    const r = run(only('prop'), 3, 'direct');
    assert.equal(req(r, 'prop').status, 'lost');
    assert.deepEqual(r.two, []);
  });
});

test('rule 9: a counter-order does not use the head\'s minute', () => {
  // the gaffer calls the electrician back in minute 2 and also sends their own second request in minute 2
  withSpecs({ overtime: { from: 'gaf', near: 'dop' }, prop: { from: 'gaf', near: 'kg' } }, () => {
    const r = run(only('lamp', 'overtime', 'prop'), 2, 'direct');
    assert.deepEqual(r.events.filter((e) => e.kind === 'counter').map((e) => e.from), ['gaf']);
    assert.equal(req(r, 'prop').sent, 2);
  });
});

test('rule 10 tie-break: one\'s own unsent request counts as held from minute 0, before one passed on in minute 1', () => {
  withSpecs({ actor: { from: 'ad1', approvers: ['prod'], doer: 'ad1' }, prop: { from: 'ad1', approvers: ['prod'], doer: 'ad1' } }, () => {
    const o = only('overtime', 'actor', 'prop');
    assert.equal(req(run(o, 1, 'chain'), 'actor').sent, 1);
    const m2 = run(o, 2, 'chain');
    assert.deepEqual(m2.events.filter((e) => e.kind === 'hop' && e.from === 'ad1').map((e) => e.req), ['prop']);
    assert.deepEqual(m2.events.filter((e) => e.kind === 'wait').map((e) => [e.req, e.behind]), [['overtime', 'prop']]);
  });
});

test('rule 11: the mean is over answered requests only', () => {
  const t = logic.tally({ reqs: [
    { status: 'done', sent: 1, ended: 3 }, { status: 'lost', sent: 1, ended: 1 },
    { status: 'unapproved', sent: 2, ended: 2 }, { status: 'moving', sent: 1, ended: 0 }], two: [] });
  assert.deepEqual([t.done, t.lost, t.unapproved, t.open, t.minutes, t.mean], [1, 1, 1, 1, 3, 3]);
});

// ── expected numbers (SPEC.md) ──

test('expected: all five through the chain, minute by minute', () => {
  const r = run({}, 7, 'chain');
  const got = Object.fromEntries(r.reqs.map((q) => [q.id, [q.status, q.sent, q.ended, logic.answerTime(q)]]));
  assert.deepEqual(got, {
    lamp: ['done', 1, 3, 3], overtime: ['done', 1, 4, 4], actor: ['done', 1, 1, 1],
    exit: ['done', 1, 3, 3], prop: ['done', 2, 7, 6]
  });
  const t = logic.tally(r);
  assert.deepEqual([t.done, t.unapproved, t.lost, t.two, t.minutes], [5, 0, 0, 0, 17]);
  assert.equal(t.mean, 3.4);
  assert.equal(req(run({}, 6, 'chain'), 'prop').status, 'moving', 'the slowest ends exactly at the last step');
});

test('expected: all five to the nearest', () => {
  const r = run({}, 7, 'direct');
  const got = Object.fromEntries(r.reqs.map((q) => [q.id, [q.status, q.at, q.ended]]));
  assert.deepEqual(got, {
    lamp: ['unapproved', 'el', 1], overtime: ['lost', 'dop', 1], actor: ['lost', 'boom', 1],
    exit: ['lost', 'el', 1], prop: ['unapproved', 'prop', 2]
  });
  const t = logic.tally(r);
  assert.deepEqual([t.done, t.unapproved, t.lost, t.two, t.mean], [0, 2, 3, 2, null]);
  assert.deepEqual(run({}, 4, 'direct').events, [], 'nothing happens after minute 3');
});

test('expected: presets exit and overtime alone', () => {
  const e = req(run(only('exit'), 7, 'chain'), 'exit');
  assert.deepEqual([e.status, logic.answerTime(e)], ['done', 3]);
  const o = req(run(only('overtime'), 7, 'chain'), 'overtime');
  assert.deepEqual([o.status, logic.answerTime(o)], ['done', 3], 'no wait at the 1st AD when alone');
  assert.equal(req(run(only('exit'), 7, 'direct'), 'exit').status, 'lost');
});

test('every subset of requests ends by the last step, in both ways; the chain never loses or doubles an order', () => {
  const ids = logic.REQUESTS.map((r) => r.id);
  for (let mask = 0; mask < 32; mask++) {
    const o = Object.fromEntries(ids.map((id, i) => [id, !!(mask & (1 << i))]));
    for (const mode of logic.MODES) {
      const r = run(o, logic.steps, mode);
      assert.ok(r.reqs.every((q) => q.status !== 'idle' && q.status !== 'moving'), `mask ${mask} ${mode}`);
    }
    const c = logic.tally(run(o, logic.steps, 'chain'));
    assert.deepEqual([c.unapproved, c.lost, c.two], [0, 0, 0], `mask ${mask}`);
    assert.equal(logic.tally(run(o, logic.steps, 'direct')).done, 0, `mask ${mask}: no one nearest decides`);
  }
});

test('the crew size changes only the line count, not the runs', () => {
  assert.deepEqual(at({ crew: 10 }, 7).runs, at({ crew: 60 }, 7).runs);
  assert.deepEqual(at({ mode: 'direct' }, 5).runs, at({ mode: 'chain' }, 5).runs, 'both ways always run; mode only picks the view');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ actor: false }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ overtime: false });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps; n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every person, decision and request has its words', () => {
  for (const lang of ['hr', 'en']) {
    for (const p of crew.PEOPLE) {
      assert.ok(strings[lang]['r_' + p.id], `${lang} r_${p.id}`);
      if (p.decides) assert.ok(strings[lang]['d_' + p.decides], `${lang} d_${p.decides}`);
    }
    for (const r of logic.REQUESTS) assert.ok(strings[lang]['q_' + r.id], `${lang} q_${r.id}`);
  }
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
