// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for asymmetric-path's model (SPEC.md). Run: node --test sims/asymmetric-path/
// Tie-breaks first, then one test per rule, then the presets' expected numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const row = (a, b, proto) => ({ proto: proto || 'tcp', a, b, state: 'ESTABLISHED', origin: 'exit1' });

// ── tie-breaks (rule 7) ──

test('tie-break: the verdict reads only the arriving device\'s table, never the other exit\'s', () => {
  const s = at({ returnPath: 'exit2' }, 5);
  assert.equal(s.tables.exit1.length, 1, 'exit 1 holds the matching row');
  assert.equal(logic.lookupState(s.tables.exit1, logic.reply), 0, 'exit 1\'s row would match the reply');
  assert.equal(s.lookup.device, 'exit2');
  assert.equal(s.lookup.result, 'miss');
  assert.equal(s.verdict, 'dropped');
});

test('tie-break: a row matches only the exact protocol, addresses and ports, in either direction', () => {
  const u = logic.user, v = logic.server;
  const table = [row(u, v)];
  assert.equal(logic.lookupState(table, logic.request), 0, 'the request direction');
  assert.equal(logic.lookupState(table, logic.reply), 0, 'the reply direction');
  assert.equal(logic.lookupState(table, Object.assign({}, logic.reply, { proto: 'udp' })), -1, 'other protocol');
  assert.equal(logic.lookupState(table, Object.assign({}, logic.reply, { src: { ip: v.ip, port: 80 } })), -1, 'other port');
  assert.equal(logic.lookupState(table, Object.assign({}, logic.reply, { src: { ip: '203.0.113.66', port: 443 } })), -1, 'other host');
  assert.equal(logic.lookupState(table, Object.assign({}, logic.reply, { dst: { ip: u.ip, port: 51001 } })), -1, 'other client port');
});

test('tie-break: replaying a step gives the same drop or accept (no timing in the verdict)', () => {
  for (const returnPath of logic.exits) {
    for (const fix of logic.fixes) {
      const a = at({ returnPath, fix }, 5), b = at({ returnPath, fix }, 5);
      assert.deepEqual(a, b);
      assert.deepEqual(logic.step(at({ returnPath, fix }, 4), 5, P({ returnPath, fix })), a);
    }
  }
});

test('tie-break: inserting a connection that is already there reuses its row', () => {
  const r = logic.insertState([row(logic.user, logic.server)], logic.request, 'exit1');
  assert.equal(r.added, false);
  assert.equal(r.row, 0);
  assert.equal(r.table.length, 1);
});

// ── rules ──

test('rule 1: state comes from the outbound half only, on the exit the request leaves through', () => {
  assert.deepEqual(at({}, 1).tables, { exit1: [], exit2: [] }, 'nothing written before the device sees the request');
  const s = at({}, 2);
  assert.equal(s.tables.exit1.length, 1);
  assert.deepEqual(s.tables.exit1[0].a, logic.user);
  assert.deepEqual(s.tables.exit1[0].b, logic.server);
  assert.equal(s.tables.exit1[0].state, 'ESTABLISHED');
  assert.deepEqual(s.inserted, [{ device: 'exit1', row: 0 }]);
  assert.equal(s.tables.exit2.length, 0, 'the other exit never saw it');
  // the reply coming in writes nothing, even where it is dropped
  for (let n = 3; n <= logic.steps; n++) {
    const t = at({ returnPath: 'exit2' }, n);
    assert.equal(t.tables.exit1.length, 1);
    assert.equal(t.tables.exit2.length, 0);
  }
  // an inbound packet with no row is not let in
  assert.deepEqual(logic.inspect([], logic.reply, true), { result: 'miss', row: -1, pass: false });
  assert.deepEqual(logic.inspect([row(logic.user, logic.server)], logic.reply, true), { result: 'hit', row: 0, pass: true });
});

test('rule 2: a reply through the other exit is dropped although the server sent it', () => {
  const s4 = at({ returnPath: 'exit2' }, 4);
  assert.equal(s4.reply.sent, true);
  const s5 = at({ returnPath: 'exit2' }, 5);
  assert.equal(s5.packet.to, 'exit2');
  assert.equal(s5.packet.drop, true);
  assert.equal(s5.reply.seenBy, 'exit2');
  assert.equal(s5.reply.matched, false);
  const s6 = at({ returnPath: 'exit2' }, 6);
  assert.equal(s6.packet, null, 'nothing reaches the user');
  assert.equal(s6.reply.delivered, false);
  assert.equal(s6.verdict, 'dropped');
  // the same path back through exit 1 is delivered
  const ok = at({ returnPath: 'exit1' }, 6);
  assert.equal(ok.verdict, 'delivered');
  assert.deepEqual(ok.packet, { kind: 'reply', from: 'exit1', to: 'user' });
});

test('rule 3: nothing blocks deliberately: without state the same asymmetric reply is delivered', () => {
  const s5 = at({ returnPath: 'exit2', stateful: false }, 5);
  assert.equal(s5.lookup.result, 'none');
  assert.equal(s5.packet.drop, false);
  assert.equal(s5.reply.matched, null);
  assert.deepEqual(at({ returnPath: 'exit2', stateful: false }, 2).tables, { exit1: [], exit2: [] }, 'no state kept');
  assert.equal(at({ returnPath: 'exit2', stateful: false }, 6).verdict, 'delivered');
});

test('rule 4: the return path is the internet\'s choice; the request always leaves through exit 1', () => {
  for (const returnPath of logic.exits) {
    assert.equal(at({ returnPath }, 1).packet.to, 'exit1');
    assert.equal(at({ returnPath }, 2).packet.from, 'exit1');
    assert.equal(at({ returnPath }, 5).packet.to, returnPath);
    assert.equal(at({ returnPath }, 0).outPath, 'exit1');
    assert.equal(at({ returnPath }, 0).inPath, returnPath);
  }
  assert.equal(logic.defaults.returnPath, 'exit2', 'asymmetric by default');
});

test('rule 5: one capture alone is inconclusive; both together show the reply was lost between', () => {
  const s = at({ returnPath: 'exit2', captures: true }, 6);
  assert.deepEqual(s.captures.user.map((e) => e.ev), ['reqSent', 'nothing']);
  assert.deepEqual(s.captures.server.map((e) => e.ev), ['reqRecv', 'repSent']);
  assert.equal(logic.diagnose(s.captures, 'user'), 'inconclusive');
  assert.equal(logic.diagnose(s.captures, 'server'), 'inconclusive');
  assert.equal(logic.diagnose(s.captures, 'both'), 'lostBetween');
  // the user's capture is the same whether the server replied or not: alone it cannot tell
  const silentServer = { user: s.captures.user, server: [{ ev: 'reqRecv', n: 3 }] };
  assert.equal(logic.diagnose(silentServer, 'user'), logic.diagnose(s.captures, 'user'));
  assert.equal(logic.diagnose(silentServer, 'both'), 'inconclusive');
  const ok = at({ returnPath: 'exit1' }, 6);
  assert.equal(logic.diagnose(ok.captures, 'both'), 'complete');
  assert.equal(logic.diagnose(at({}, 4).captures, 'both'), 'inconclusive', 'too early to say');
});

test('rule 6: making the path symmetric or sharing the state lets the reply in', () => {
  const sym = at({ returnPath: 'exit2', fix: 'symmetric' }, 5);
  assert.equal(sym.inPath, 'exit1');
  assert.equal(sym.lookup.device, 'exit1');
  assert.equal(sym.lookup.result, 'hit');
  assert.equal(at({ returnPath: 'exit2', fix: 'symmetric' }, 6).verdict, 'delivered');

  const sh2 = at({ returnPath: 'exit2', fix: 'shared' }, 2);
  assert.equal(sh2.tables.exit2.length, 1, 'the row is in both tables');
  assert.equal(sh2.tables.exit2[0].origin, 'exit1', 'written at exit 1');
  assert.deepEqual(sh2.inserted, [{ device: 'exit1', row: 0 }, { device: 'exit2', row: 0 }]);
  const sh5 = at({ returnPath: 'exit2', fix: 'shared' }, 5);
  assert.equal(sh5.lookup.device, 'exit2');
  assert.equal(sh5.lookup.result, 'hit');
  assert.equal(at({ returnPath: 'exit2', fix: 'shared' }, 6).verdict, 'delivered');
});

// ── presets: expected numbers (SPEC.md) ──

// The page's presets, read from index.html, so a changed preset fails here.
function pagePresets() {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  return Object.fromEntries([...html.matchAll(/\{ id: '([\w-]+)', label: [^,]+, params: (\{[^}]*\})/g)]
    .map((m) => [m[1], Function('return (' + m[2] + ')')()]));
}

test('presets give the numbers of SPEC.md', () => {
  const presets = pagePresets();
  const cases = {
    'symmetric-ok': [1, 0, 'exit1', 'hit', 'delivered'],
    'asymmetric-drop': [1, 0, 'exit2', 'miss', 'dropped'],
    'two-captures': [1, 0, 'exit2', 'miss', 'dropped'],
    'make-symmetric': [1, 0, 'exit1', 'hit', 'delivered'],
    'share-state': [1, 1, 'exit2', 'hit', 'delivered'],
    'no-state': [0, 0, 'exit2', 'none', 'delivered']
  };
  assert.deepEqual(Object.keys(presets), Object.keys(cases), 'the page has exactly the presets of SPEC.md');
  for (const [id, [r1, r2, dev, result, verdict]] of Object.entries(cases)) {
    const p = presets[id];
    const s2 = at(p, 2), s5 = at(p, 5), s6 = at(p, 6);
    assert.equal(s2.tables.exit1.length, r1, id);
    assert.equal(s2.tables.exit2.length, r2, id);
    assert.equal(s5.lookup.device, dev, id);
    assert.equal(s5.lookup.result, result, id);
    if (result === 'hit') assert.equal(s5.lookup.row, 0, id);
    assert.equal(s5.verdict, result === 'miss' ? 'dropped' : null, id + ': no verdict before the user step unless dropped');
    assert.equal(s6.verdict, verdict, id);
    assert.equal(s6.reply.delivered, verdict === 'delivered', id);
    if (verdict === 'delivered') assert.deepEqual(s6.packet, { kind: 'reply', from: dev, to: 'user' }, id + ': delivered from the exit it came in by');
  }
  assert.deepEqual(presets['two-captures'].captures, true);
});

test('lookup and inserted describe only the current step', () => {
  for (const p of [{}, { fix: 'shared' }, { returnPath: 'exit1' }]) {
    for (let n = 0; n <= logic.steps; n++) {
      const s = at(p, n);
      if (n !== 2) assert.equal(s.inserted, null, `inserted at ${n}`);
      if (n !== 2 && n !== 5) assert.equal(s.lookup, null, `lookup at ${n}`);
    }
  }
  assert.deepEqual(at({}, 2).lookup, { device: 'exit1', row: -1, result: 'miss' }, 'the request is a new connection at exit 1');
  assert.equal(at({ stateful: false }, 2).lookup, null, 'no lookup without state');
});

test('captures carry the step numbers the page shows', () => {
  const drop = at({ returnPath: 'exit2' }, 6), ok = at({ returnPath: 'exit1' }, 6);
  assert.deepEqual(drop.captures.user.map((e) => e.n), [1, 6]);
  assert.deepEqual(drop.captures.server.map((e) => e.n), [3, 4]);
  assert.deepEqual(ok.captures.user.map((e) => [e.ev, e.n]), [['reqSent', 1], ['repRecv', 6]]);
});

test('the fixes apply from step 0 and whatever the internet chooses', () => {
  assert.equal(at({ returnPath: 'exit2', fix: 'symmetric' }, 0).inPath, 'exit1');
  const s = at({ returnPath: 'exit1', fix: 'shared' }, 2);
  assert.equal(s.tables.exit1.length, 1);
  assert.equal(s.tables.exit2.length, 1, 'shared state is copied even when the reply would come back through exit 1');
});

test('insertState leaves its input alone; lookupState reads every row', () => {
  const other = row({ ip: '192.0.2.20', port: 52000 }, logic.server);
  const input = Object.freeze([Object.freeze(other)]);
  const r = logic.insertState(input, logic.request, 'exit1');
  assert.equal(input.length, 1);
  assert.equal(r.added, true);
  assert.equal(r.row, 1);
  assert.equal(logic.lookupState(r.table, logic.reply), 1, 'the match is the second row');
  assert.deepEqual(logic.inspect(r.table, logic.reply, true), { result: 'hit', row: 1, pass: true });
});

test('the captures param changes the view only, not the model', () => {
  for (let n = 0; n <= logic.steps; n++) assert.deepEqual(at({ captures: true }, n), at({ captures: false }, n));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const fix of logic.fixes) {
    for (let n = 0; n <= logic.steps; n++) {
      const s = at({ fix }, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ returnPath: 'exit2', fix: 'shared' });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ fix: 'shared' });
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

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
