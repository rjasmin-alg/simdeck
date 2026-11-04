// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ou-vs-group. Run: node --test sims/win-ou-vs-group/
// One test per rule of SPEC.md §2, the tie-break (rule 5) first, then the decks' expected bins, then the generic block.
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
const at = (over, n) => kit.stateAt(logic, P(over), n);
const final = (over) => { const p = P(over); return kit.stateAt(logic, p, kit.stepsOf(logic, p)); };
const answer = (need) => logic.classify(need).answer;
const bins = (s) => Object.fromEntries(logic.ANSWERS.map((a) => [a, logic.binOf(s, a).map((k) => k + 1)]));

// ── tie-break first ──

test('tie-break (rule 5): people over several OUs, the link goes on their lowest common OU, a group narrows it: both', () => {
  const r = logic.classify({ kind: 'policy', boxes: ['q-hq', 'q-brack'], filter: 'g-projects', gpo: 'X' });
  assert.equal(r.answer, 'both');
  assert.equal(r.mech.at, 'q-staff');
  assert.equal(r.mech.filter, 'g-projects');
  assert.equal(r.mech.gpo, 'X');
  assert.deepEqual(r.mech.reach, ['q-staff', 'q-hq', 'q-brack'], 'the link reaches the common OU and below');
  // the same boxes without a group: the OU alone
  assert.equal(answer({ kind: 'policy', boxes: ['q-hq', 'q-brack'], gpo: 'X' }), 'ou');
  // further apart: the common OU moves up; across a container it is the domain
  assert.equal(logic.lcaOf(['q-hq', 'q-ws']), 'q-quillmoor');
  assert.equal(logic.lcaOf(['q-hq', 'q-users']), 'q');
  assert.equal(logic.lcaOf(['q-brack', 'q-hq']), 'q-staff', 'order does not matter');
  assert.equal(logic.lcaOf(['q-kiosks']), 'q-kiosks', 'one box is its own LCA');
  assert.equal(logic.classify({ kind: 'policy', boxes: ['q-users', 'q-quillmoor'], gpo: 'X' }).mech.at, 'q');
});

test('tie-break (rules 1, 5): exactly the objects of a CN= container: no box can take the link, neither', () => {
  const r = logic.classify({ kind: 'policy', boxes: ['q-users'], exact: true, gpo: 'X' });
  assert.equal(r.answer, 'neither');
  assert.equal(r.mech.type, 'link-refused');
  assert.equal(r.mech.wouldReach, 'q', 'the next box up that takes a link is the domain');
  // not "exactly": the domain link that reaches them is fine
  assert.equal(answer({ kind: 'policy', boxes: ['q-users'], gpo: 'X' }), 'ou');
  // exact but an OU: the link goes right there
  assert.equal(answer({ kind: 'policy', boxes: ['q-ws'], exact: true, gpo: 'X' }), 'ou');
  // exact over two OUs: the common OU reaches others too (Brackenridge, Servers)
  assert.equal(answer({ kind: 'policy', boxes: ['q-hq', 'q-ws'], exact: true, gpo: 'X' }), 'neither');
  assert.equal(answer({ kind: 'policy', boxes: ['q-users', 'q-hq'], exact: true, gpo: 'X' }), 'neither');
  assert.equal(answer({ kind: 'policy', boxes: ['q-staff', 'q-hq'], exact: true, gpo: 'X' }), 'ou', 'the link box is one of them');
  // a group filter does not rescue a container
  assert.equal(answer({ kind: 'policy', boxes: ['q-users'], exact: true, filter: 'g-projects', gpo: 'X' }), 'neither');
  // the refused link is drawn on the box asked for, not on the box above
  assert.equal(r.mech.at, 'q-users');
  assert.equal(r.mech.gpo, 'X');
  // not exact: the link goes on the domain, and that is where the mechanism sits
  assert.equal(logic.classify({ kind: 'policy', boxes: ['q-users'], gpo: 'X' }).mech.at, 'q');
  assert.equal(logic.classify({ kind: 'policy', boxes: ['q-users'], gpo: 'X' }).mech.reach.length, logic.BOXES.length);
});

// ── rules ──

test('rule 1: a GPO links to a site, a domain or an OU, never to a group, a user or a CN= container', () => {
  assert.equal(logic.canLinkGpo('q'), true);
  assert.equal(logic.canLinkGpo('q-hq'), true);
  assert.equal(logic.canLinkGpo('q-users'), false);
  assert.equal(logic.canLinkGpo('q-computers'), false);
  assert.equal(logic.canLinkGpo('g-projects'), false);
  assert.equal(logic.canLinkGpo('ana'), false);
  assert.equal(logic.linkableFrom('q-computers'), 'q');
  assert.equal(logic.linkableFrom('q-kiosks'), 'q-kiosks');
});

test('rule 1: an OU link reaches its OU and the OUs below it; a domain link reaches the containers too', () => {
  assert.deepEqual(logic.reachOf('q-ws'), ['q-ws', 'q-kiosks']);
  assert.deepEqual(logic.reachOf('q-staff'), ['q-staff', 'q-hq', 'q-brack']);
  assert.ok(logic.reachOf('q').includes('q-users') && logic.reachOf('q').includes('q-computers'));
  assert.equal(logic.reachOf('q').length, logic.BOXES.length);
  assert.deepEqual(logic.reachOf('q-users'), [], 'a container takes no link, so reaches nothing');
  assert.ok(!logic.reachOf('q-ws').includes('q-computers'), 'CN=Computers is not under OU=Workstations');
});

test('rule 2: an ACE names a SID: a user or a security group; an OU has none, a distribution group cannot be named', () => {
  assert.deepEqual(logic.canBeTrustee('g-accounting'), { ok: true, reason: null });
  assert.deepEqual(logic.canBeTrustee('ana'), { ok: true, reason: null });
  assert.deepEqual(logic.canBeTrustee('q-hq'), { ok: false, reason: 'no-sid' });
  assert.deepEqual(logic.canBeTrustee('q-users'), { ok: false, reason: 'no-sid' });
  assert.deepEqual(logic.canBeTrustee('board'), { ok: false, reason: 'not-security' });
  assert.equal(logic.sidOf('q-hq'), null);
  assert.match(logic.sidOf('g-accounting'), /-1104$/);
  const ok = logic.classify({ kind: 'permission', resource: 's', right: 'read', trustee: 'g-accounting' });
  assert.equal(ok.answer, 'group');
  assert.equal(ok.mech.type, 'ace');
  assert.equal(ok.mech.sid, logic.sidOf('g-accounting'));
  const ou = logic.classify({ kind: 'permission', resource: 's', right: 'read', trustee: 'q-hq' });
  assert.equal(ou.answer, null);
  assert.equal(ou.mech.reason, 'no-sid');
  const dist = logic.classify({ kind: 'permission', resource: 's', right: 'read', trustee: 'board' });
  assert.equal(dist.answer, null);
  assert.equal(dist.mech.reason, 'not-security');
  assert.match(logic.sidOf('board'), /-1108$/, 'a distribution group has a SID, it just never stands in an ACE');
  assert.ok(logic.sidOf('ana'), 'a user has a SID');
  assert.equal(logic.canBeTrustee('q').ok, false, 'the domain head is no trustee here');
  assert.equal(answer({ kind: 'permission', resource: 's', right: 'read', trustee: 'ana' }), null, 'a user trustee is no group answer');
  assert.equal(ok.mech.on, 's');
  assert.equal(ok.mech.right, 'read');
});

test('rule 2: a mailing list is a group, and a distribution one', () => {
  const r = logic.classify({ kind: 'mail', group: 'board' });
  assert.equal(r.answer, 'group');
  assert.equal(r.mech.security, false);
  assert.equal(r.mech.group, 'board');
  assert.equal(answer({ kind: 'mail', group: 'nope' }), null);
  assert.equal(answer({ kind: 'membership', obj: 'nobody' }), null);
  assert.equal(answer({ kind: 'policy', boxes: [], gpo: 'X' }), null);
  assert.equal(answer({ kind: 'what' }), null);
});

test('rule 3: delegation is an ACE on the OU (or a container) naming a group: both; never to an OU or on a group', () => {
  const r = logic.classify({ kind: 'delegation', on: 'q-brack', right: 'reset-password', trustee: 'helpdesk' });
  assert.equal(r.answer, 'both');
  assert.equal(r.mech.on, 'q-brack');
  assert.equal(r.mech.trustee, 'helpdesk');
  assert.equal(r.mech.sid, logic.sidOf('helpdesk'));
  assert.equal(answer({ kind: 'delegation', on: 'q-brack', right: 'reset-password', trustee: 'q-hq' }), null);
  assert.equal(answer({ kind: 'delegation', on: 'g-projects', right: 'reset-password', trustee: 'helpdesk' }), null);
  assert.equal(answer({ kind: 'delegation', on: 'q-users', right: 'reset-password', trustee: 'helpdesk' }), 'both', 'a container can be delegated');
  assert.equal(answer({ kind: 'delegation', on: 'q-brack', right: 'reset-password', trustee: 'ana' }), 'both', 'a user may be the trustee (a group is best practice)');
  assert.equal(answer({ kind: 'delegation', on: 'q-brack', right: 'reset-password', trustee: 'q' }), null, 'the domain head is no trustee');
  assert.equal(answer({ kind: 'delegation', on: 'q-brack', right: 'reset-password', trustee: 'board' }), null, 'nor a distribution group');
  assert.equal(r.mech.right, 'reset-password');
});

test('rule 4: one parent, many groups: a move replaces the OU, a join adds a group once', () => {
  const placed = logic.placement();
  assert.equal(placed.ana, 'q-hq');
  const moved = logic.move(placed, 'ana', 'q-brack');
  assert.deepEqual(moved, { ana: 'q-brack' }, 'exactly one parent after a move');
  assert.equal(placed.ana, 'q-hq', 'input not mutated');
  assert.deepEqual(logic.move(placed, 'ana', 'g-projects'), placed, 'a group is not a parent');
  assert.deepEqual(logic.move(placed, 'ana', 'q'), placed, 'the scene keeps objects in OUs and containers');
  const m = logic.membership();
  assert.deepEqual(m.ana, ['g-accounting', 'g-projects', 'all-staff']);
  const joined = logic.join(m, 'ana', 'helpdesk');
  assert.deepEqual(joined.ana, ['g-accounting', 'g-projects', 'all-staff', 'helpdesk']);
  assert.deepEqual(logic.join(joined, 'ana', 'helpdesk').ana, joined.ana, 'a second join changes nothing');
  assert.equal(m.ana.length, 3, 'input not mutated');
  const r = logic.classify({ kind: 'membership', obj: 'ana' });
  assert.equal(r.answer, 'group');
  assert.equal(r.mech.parent, 'q-hq');
  assert.equal(r.mech.groups.length, 3);
});

test('verdict: exact is right, one half of "both" is half, no guess is skipped', () => {
  assert.equal(logic.verdict('ou', 'ou'), 'right');
  assert.equal(logic.verdict('group', 'both'), 'half');
  assert.equal(logic.verdict('ou', 'both'), 'half');
  assert.equal(logic.verdict('both', 'ou'), 'wrong');
  assert.equal(logic.verdict('neither', 'group'), 'wrong');
  assert.equal(logic.verdict('neither', 'both'), 'wrong', 'neither is no half of both');
  assert.equal(logic.verdict('', 'group'), 'skipped');
  assert.equal(logic.verdict('nonsense', 'group'), 'skipped');
});

// ── decks: expected bins (SPEC §3) ──

test('basic deck: 8 steps; bins ou {1, 6}, group {2, 4, 5}, both {3, 7}, neither {8}', () => {
  assert.equal(kit.stepsOf(logic, P({ deck: 'basic' })), 8);
  assert.deepEqual(bins(final({ deck: 'basic' })), { ou: [1, 6], group: [2, 4, 5], both: [3, 7], neither: [8] });
  const lit = final({ deck: 'basic' }).lit;
  assert.equal(lit.find((m) => m.card === 'drive-p').at, 'q-staff');
  assert.equal(lit.find((m) => m.card === 'screen-lock').at, 'q-ws');
  assert.equal(lit.find((m) => m.card === 'cn-users').type, 'link-refused');
});

test('quillmoor deck: 4 steps; Chirp on OU=Workstations, CN=Computers neither, drive maps on the domain, the share a group', () => {
  assert.equal(kit.stepsOf(logic, P({ deck: 'quillmoor' })), 4);
  const s = final({ deck: 'quillmoor' });
  assert.deepEqual(bins(s), { ou: [1, 3], group: [4], both: [], neither: [2] });
  const chirp = s.lit.find((m) => m.card === 'chirp');
  assert.equal(chirp.at, 'q-ws');
  assert.equal(logic.node('q-ws').computers, 35, 'ou-tree.txt count');
  assert.ok(!chirp.reach.includes('q-computers'));
  assert.equal(logic.node('q-computers').computers, 159);
  assert.equal(s.lit.find((m) => m.card === 'chirp-cn').moveTo, 'q-ws');
  assert.equal(s.lit.find((m) => m.card === 'drive-maps').at, 'q');
  assert.equal(logic.node('q-users').users, 155);
});

test('one step turns one card: it is revealed, lit as now, and the earlier ones stay lit', () => {
  const s0 = at({}, 0);
  assert.equal(s0.cursor, 0);
  assert.equal(s0.last, -1);
  assert.equal(s0.lit.length, 0);
  assert.ok(s0.cards.every((c) => !c.revealed));
  const s3 = at({}, 3);
  assert.deepEqual(s3.cards.map((c) => c.revealed), [true, true, true, false, false, false, false, false]);
  assert.equal(s3.last, 2);
  assert.equal(s3.cursor, 3);
  assert.equal(s3.lit.length, 3);
  assert.deepEqual(s3.lit.map((m) => m.now), [false, false, true]);
  assert.equal(s3.lit[2].card, 'helpdesk-reset');
  // the bins hold only turned cards
  assert.deepEqual(bins(s0), { ou: [], group: [], both: [], neither: [] });
  assert.deepEqual(bins(s3), { ou: [1], group: [2], both: [3], neither: [] });
  // every card lights its mechanism, the mailing list too
  const lit = final({}).lit;
  assert.deepEqual(lit.map((m) => m.card), logic.DECKS.basic.map((c) => c.id));
  assert.equal(lit.find((m) => m.card === 'board-list').type, 'mail');
  assert.deepEqual(lit.find((m) => m.card === 'screen-lock').reach, ['q-ws', 'q-kiosks']);
  assert.equal(lit.find((m) => m.card === 'finance-share').on, '\\\\hq-fs01\\finance');
});

test('each card names the rule that decides it', () => {
  assert.deepEqual(at({}, 0).cards.map((c) => c.rule), [1, 2, 3, 4, 2, 1, 5, 1]);
  assert.deepEqual(at({ deck: 'quillmoor' }, 0).cards.map((c) => c.rule), [1, 1, 1, 2]);
});

test('scene data: the estate OU tree, its counts and the invented OU', () => {
  const kinds = Object.fromEntries(logic.BOXES.map((b) => [b.id, b.kind]));
  assert.deepEqual(kinds, { q: 'domain', 'q-users': 'container', 'q-computers': 'container', 'q-quillmoor': 'ou', 'q-staff': 'ou',
    'q-hq': 'ou', 'q-brack': 'ou', 'q-ws': 'ou', 'q-kiosks': 'ou', 'q-servers': 'ou' });
  const counts = Object.fromEntries(logic.BOXES.map((b) => [b.id, [b.users, b.computers]]));
  assert.deepEqual(counts['q-hq'], [21, 0]);
  assert.deepEqual(counts['q-brack'], [0 + 44, 0]);
  assert.deepEqual(counts['q-servers'], [0, 5]);
  assert.deepEqual(logic.BOXES.filter((b) => b.invented).map((b) => b.id), ['q-kiosks']);
  assert.deepEqual(logic.GROUPS.map((g) => g.type), ['security', 'security', 'security', 'security', 'distribution']);
});

test('quiz: guesses are judged when their card turns and counted; show mode ignores them', () => {
  const g = { mode: 'quiz', g1: 'ou', g2: 'ou', g3: 'group' };
  const s = at(g, 4);
  assert.deepEqual(s.cards.slice(0, 4).map((c) => c.verdict), ['right', 'wrong', 'half', 'skipped']);
  assert.deepEqual(s.score, { right: 1, half: 1, wrong: 1, skipped: 1 });
  assert.equal(at(g, 2).cards[2].verdict, null, 'card 3 not judged before it turns');
  const show = at(Object.assign({}, g, { mode: 'show' }), 4);
  assert.ok(show.cards.every((c) => c.guess === null && c.verdict === null));
  assert.equal(at({ mode: 'quiz', g1: 'bogus' }, 1).cards[0].verdict, 'skipped', 'an invalid guess is no guess');
  assert.equal(at({ mode: 'bogus', g1: 'ou' }, 1).mode, 'show', 'an unknown mode is show');
  assert.equal(at({ mode: 'bogus', g1: 'ou' }, 1).cards[0].verdict, null);
});

test('an unknown deck falls back to basic', () => {
  assert.equal(at({ deck: 'nope' }, 0).deck, 'basic');
  assert.equal(kit.stepsOf(logic, P({ deck: 'nope' })), 8);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of [{}, { deck: 'quillmoor' }, { mode: 'quiz', g1: 'both', g5: 'group' }]) {
    const p = P(over);
    for (let n = 0; n <= kit.stepsOf(logic, p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ mode: 'quiz', g2: 'group', g7: 'both' });
  const steps = kit.stepsOf(logic, p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const s1 = logic.step(s0, 1, p);
  const copy1 = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy1);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every card has its question, short title and reason in both languages', () => {
  const key = (id) => id.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
  for (const deck of Object.values(logic.DECKS)) {
    for (const c of deck) for (const pre of ['q_', 's_', 'r_']) {
      assert.ok(strings.hr[pre + key(c.id)] && strings.en[pre + key(c.id)], `${pre}${key(c.id)}`);
    }
  }
});

test('every preset is valid for the model; sim.json steps is the default deck\'s', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.steps, kit.stepsOf(logic, logic.defaults));
  assert.equal(sim.steps, kit.stepsOf(logic, logic.defaults));
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  assert.deepEqual(logic.presets.map((x) => x.id), ['basic', 'quiz', 'quillmoor']);
});
