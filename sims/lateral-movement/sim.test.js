// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lateral-movement's model (SPEC.md). Run: node --test sims/lateral-movement/
// Tie-breaks first, then one test per rule, then the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const run = (over) => { const p = P(over); return at(over, logic.steps(p)); };
const kinds = (over) => run(over).log.map((e) => e.kind);
const node = (s, id) => logic.nodeOf(s, id);
const whos = (n) => n.cachedCreds.map((c) => c.who).sort();
const held = (s) => s.attacker.held.map(logic.keyOf).sort();
/** A state with the attacker on `at`, as SYSTEM, holding `creds`; nothing visited but `at`. */
function holding(over, atId, creds, visited) {
  const s = logic.initial(P(over));
  Object.assign(s.attacker, { at: atId, priv: 'system', held: creds, visited: visited || [atId], dumped: [atId], path: [atId] });
  return s;
}
const LA = (id, hash, tier) => ({ who: 'Administrator', local: id, tier, kind: 'hash', hash });

const PRESETS = {
  flat: {},
  laps: { lapsOnWorkstations: true },
  tiered: { tiering: true },
  both: { tiering: true, lapsOnWorkstations: true },
  chain: { daLogsOnWS: false }
};

// ── tie-breaks ──

test('tie-break 1: the highest-tier credential goes first (Domain Admin before the shared local hash)', () => {
  const s = holding({}, 'WS1', [LA('WS1', '7c1e', 2), { who: 'da-admin', tier: 0, kind: 'hash' }]);
  const c = logic.candidates(s)[0];
  assert.equal(c.via, 'da-admin');
  assert.equal(c.to, 'DC1');
});

test('tie-break 2: with one credential, the highest-tier target first, then by node id', () => {
  const s = holding({}, 'WS1', [{ who: 'da-admin', tier: 0, kind: 'hash' }]);
  assert.deepEqual(logic.candidates(s).map((c) => c.to), ['DC1', 'APP1', 'FS1', 'WS2']);
  const t1 = holding({}, 'WS2', [{ who: 'srv-admin', tier: 1, kind: 'hash' }]);
  assert.deepEqual(logic.candidates(t1).map((c) => c.to), ['APP1', 'FS1']);
});

test('tie-break 3: same tier, same target: a domain account before a local hash', () => {
  const s = holding({}, 'APP1', [LA('APP1', '91c2', 1), { who: 'srv-admin', tier: 1, kind: 'hash' }]);
  const c = logic.candidates(s);
  assert.equal(c[0].to, 'FS1');
  assert.equal(c[0].via, 'srv-admin');
  assert.equal(c[1].via, 'local:91c2');
});

test('tie-break 1 over the whole list: every Tier 0 move before any Tier 1 move, even to the same target', () => {
  const s = holding({}, 'WS2', [{ who: 'srv-admin', tier: 1, kind: 'hash' }, { who: 'da-admin', tier: 0, kind: 'hash' }]);
  assert.deepEqual(logic.candidates(s).map((c) => c.via + '>' + c.to),
    ['da-admin>DC1', 'da-admin>APP1', 'da-admin>FS1', 'da-admin>WS1', 'srv-admin>APP1', 'srv-admin>FS1']);
});

test('tie-breaks hold when the held list is in any order', () => {
  const creds = [LA('WS1', '7c1e', 2), { who: 'srv-admin', tier: 1, kind: 'hash' }, { who: 'old-admin', tier: 0, kind: 'password' }, { who: 'da-admin', tier: 0, kind: 'hash' }];
  const a = logic.candidates(holding({}, 'WS1', creds));
  const b = logic.candidates(holding({}, 'WS1', creds.slice().reverse()));
  assert.deepEqual(a, b);
  assert.equal(a[0].via, 'da-admin', 'two Tier 0 accounts to DC1: by name');
});

// ── rule 1: cached credentials are reused by a local admin ──

test('rule 1: an interactive logon leaves the NT hash in memory; only SYSTEM can copy it', () => {
  const s0 = logic.initial(P({}));
  const ws1 = node(s0, 'WS1');
  assert.deepEqual(whos(ws1), ['ana', 'da-admin']);
  assert.ok(ws1.cachedCreds.every((c) => c.kind === 'hash'));
  const s1 = at({}, 1);
  assert.equal(s1.attacker.priv, 'user');
  assert.deepEqual(s1.attacker.held, [], 'a plain user copies nothing');
  assert.equal(at({}, 2).last.kind, 'escalate');
  const s3 = at({}, 3);
  assert.equal(s3.last.kind, 'dump');
  assert.deepEqual(held(s3), ['ana', 'da-admin', 'local:7c1e']);
});

test('rule 1: a stolen hash is used as it is (pass-the-hash), no password needed', () => {
  const s = at({}, 4);
  assert.equal(s.last.kind, 'move');
  assert.equal(s.last.via, 'da-admin');
  const da = s.attacker.held.find((c) => c.who === 'da-admin');
  assert.equal(da.kind, 'hash');
  assert.equal(s.attacker.at, 'DC1');
});

// ── rule 2: one admin login exposes that admin's rights everywhere ──

test('rule 2: a Domain Admin credential works on every machine; ordinary users on none', () => {
  const s0 = logic.initial(P({}));
  for (const n of s0.nodes) {
    assert.ok(logic.works({ who: 'da-admin', tier: 0 }, n), n.id);
    assert.ok(!logic.works({ who: 'ana', tier: logic.USER }, n), n.id);
  }
  assert.deepEqual(s0.nodes.filter((n) => logic.works({ who: 'srv-admin', tier: 1 }, n)).map((n) => n.id), ['APP1', 'FS1']);
});

test('rule 2: with the Domain Admin cached on WS1 the attacker goes straight to the DC and the domain falls', () => {
  const s = run({});
  assert.deepEqual(s.attacker.path, ['WS1', 'DC1']);
  assert.equal(s.outcome, 'compromised');
  assert.ok(s.reachedTier0);
  assert.equal(at({}, 3).reachedTier0, true, 'Tier 0 is in hand at the dump');
});

// ── rule 3: one local admin password across machines; LAPS ──

test('rule 3: the shared image hash opens the other workstation; LAPS makes it unique', () => {
  const shared = logic.initial(P({}));
  assert.equal(node(shared, 'WS1').localAdminHash, node(shared, 'WS2').localAdminHash);
  const la = { who: 'Administrator', local: 'WS1', tier: 2, hash: node(shared, 'WS1').localAdminHash };
  assert.ok(logic.works(la, node(shared, 'WS2')));
  const laps = logic.initial(P({ lapsOnWorkstations: true }));
  assert.notEqual(node(laps, 'WS1').localAdminHash, node(laps, 'WS2').localAdminHash);
  const la2 = { who: 'Administrator', local: 'WS1', tier: 2, hash: node(laps, 'WS1').localAdminHash };
  assert.ok(!logic.works(la2, node(laps, 'WS2')));
  assert.ok(logic.expects(la2, node(laps, 'WS2')), 'the attacker still tries it');
  // LAPS wins over the shared toggle; servers never share the image's password; the DC has no local account
  assert.notEqual(node(logic.initial(P({ lapsOnWorkstations: true, sharedLocalAdmin: true })), 'WS1').localAdminHash, logic.HASH.image);
  assert.notEqual(node(shared, 'APP1').localAdminHash, logic.HASH.image);
  assert.equal(node(shared, 'DC1').localAdminHash, null);
});

test('rule 3: with LAPS the try is refused and the edge is cut; LAPS alone does not stop the cached Domain Admin', () => {
  const both = run({ tiering: true, lapsOnWorkstations: true });
  const r = both.log.find((e) => e.kind === 'refused');
  assert.deepEqual([r.from, r.to, r.via], ['WS1', 'WS2', 'local:3fa9']);
  assert.equal(both.outcome, 'contained');
  const laps3 = at({ lapsOnWorkstations: true }, 3);
  const e = logic.edges(laps3).find((x) => x.to === 'WS2');
  assert.ok(e.ok, 'WS2 is still open, with the Domain Admin');
  const lapsOnly = logic.candidates(laps3).filter((c) => c.via.startsWith('local:'));
  assert.deepEqual(lapsOnly.map((c) => [c.to, c.ok]), [['WS2', false]]);
  assert.equal(run({ lapsOnWorkstations: true }).outcome, 'compromised');
});

// ── rule 4: tiering ──

test('rule 4: with tiering no admin credential is ever cached below its tier; the refused logons are listed', () => {
  for (const over of [{ tiering: true }, { tiering: true, daLogsOnWS: true, leaverAdmin: true }]) {
    const s = logic.initial(P(over));
    for (const n of s.nodes) for (const c of n.cachedCreds) assert.ok(c.tier === logic.USER || c.tier <= n.tier, `${c.who} on ${n.id}`);
    assert.deepEqual(node(s, 'WS1').refused.map((c) => c.who), ['da-admin']);
    assert.deepEqual(node(s, 'WS2').refused.map((c) => c.who), ['srv-admin']);
    assert.deepEqual(node(s, 'APP1').refused.map((c) => c.who), ['old-admin']);
    assert.deepEqual(whos(node(s, 'DC1')), ['da-admin'], 'Tier 0 still logs on to Tier 0');
  }
  const off = logic.initial(P({}));
  assert.ok(off.nodes.every((n) => n.refused.length === 0));
});

test('rule 4: tiering stalls the attacker at Tier 2, even with the shared image hash', () => {
  const s = run({ tiering: true });
  assert.deepEqual(s.attacker.path, ['WS1', 'WS2']);
  assert.equal(s.outcome, 'contained');
  assert.equal(s.last.kind, 'stalled');
  assert.equal(s.last.tier, 2);
  assert.equal(s.reachedTier0, false);
});

// ── rule 5: leaver admin accounts ──

test('rule 5: a leaver\'s Domain Admin account running a task leaves its password on APP1 and opens the DC', () => {
  const s0 = logic.initial(P({}));
  const old = node(s0, 'APP1').cachedCreds.find((c) => c.who === 'old-admin');
  assert.equal(old.kind, 'password');
  assert.equal(old.tier, 0);
  assert.equal(old.leaver, true, 'the page tells a leaver from a logged-on admin by this flag');
  assert.ok(!node(s0, 'WS1').cachedCreds.find((c) => c.who === 'da-admin').leaver);
  const chain = run({ daLogsOnWS: false });
  assert.deepEqual(chain.attacker.path, ['WS1', 'WS2', 'APP1', 'DC1']);
  assert.equal(chain.log.find((e) => e.kind === 'move' && e.to === 'DC1').via, 'old-admin');
  const offboarded = run({ daLogsOnWS: false, leaverAdmin: false });
  assert.deepEqual(offboarded.attacker.path, ['WS1', 'WS2', 'APP1', 'FS1']);
  assert.equal(offboarded.outcome, 'contained');
  assert.equal(offboarded.last.tier, 1, 'stuck at Tier 1');
});

// ── dump details ──

test('a dump adds only what is new: the same image hash on WS2 is not held twice', () => {
  const s = at({ tiering: true }, 5);
  assert.equal(s.last.kind, 'dump');
  assert.deepEqual(s.last.gained, ['ivo']);
  assert.deepEqual(s.last.same, ['local:7c1e']);
});

test('a server dump copies its own local hash at Tier 1, next to the leaver\'s password', () => {
  const s = at({ daLogsOnWS: false }, 7);
  assert.equal(s.last.kind, 'dump');
  assert.equal(s.last.node, 'APP1');
  assert.deepEqual(s.last.gained, ['old-admin', 'local:91c2']);
  assert.deepEqual(s.last.same, ['srv-admin']);
  const la = s.attacker.held.find((c) => c.local === 'APP1');
  assert.equal(la.tier, 1);
  const fs = at({ daLogsOnWS: false, leaverAdmin: false }, 9);
  assert.deepEqual([fs.last.node, fs.last.gained, fs.last.same], ['FS1', ['local:e58d'], ['srv-admin']]);
});

test('the foothold runs as the phished user', () => {
  assert.deepEqual([at({}, 1).last.who, at({}, 1).attacker.at], [logic.FOOTHOLD_USER, logic.FOOTHOLD]);
});

test('the domain controller dump ends the run: krbtgt and every account', () => {
  const s = run({});
  assert.equal(s.last.kind, 'compromised');
  assert.ok(s.attacker.held.some((c) => c.who === 'krbtgt' && c.all));
  assert.ok(s.done);
});

// ── presets and step counts ──

test('steps per preset: flat 5, laps 5, tiered 6, both 5, chain 9', () => {
  const want = { flat: 5, laps: 5, tiered: 6, both: 5, chain: 9 };
  for (const [id, over] of Object.entries(PRESETS)) assert.equal(logic.steps(P(over)), want[id], id);
  assert.deepEqual(kinds({}), ['foothold', 'escalate', 'dump', 'move', 'compromised']);
  assert.deepEqual(kinds({ tiering: true }), ['foothold', 'escalate', 'dump', 'move', 'dump', 'stalled']);
  assert.deepEqual(kinds({ tiering: true, lapsOnWorkstations: true }), ['foothold', 'escalate', 'dump', 'refused', 'stalled']);
});

test('every combination of the five toggles ends within 10 steps, compromised exactly when Tier 0 was stolen', () => {
  const keys = Object.keys(logic.defaults);
  for (let m = 0; m < 1 << keys.length; m++) {
    const over = Object.fromEntries(keys.map((k, i) => [k, !!(m >> i & 1)]));
    const n = logic.steps(P(over));
    assert.ok(n <= 10, `${JSON.stringify(over)}: ${n}`);
    const s = at(over, n);
    assert.ok(s.done);
    assert.equal(s.outcome === 'compromised', s.reachedTier0, JSON.stringify(over));
    if (over.tiering) assert.equal(s.outcome, 'contained', 'tiering always contains the attacker here');
  }
});

test('steps after the end change nothing', () => {
  const p = P({});
  const s = at({}, logic.steps(p));
  assert.deepEqual(logic.step(s, 99, p), s);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ daLogsOnWS: false });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ daLogsOnWS: false });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
