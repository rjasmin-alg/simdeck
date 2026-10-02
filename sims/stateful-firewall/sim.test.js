// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for stateful-firewall's model. Run: node --test sims/stateful-firewall/
// The scenario is the URM book's, ch. 18 (18-kiberneticka-sigurnost.md), Primjer 5 (a client inside opens TCP to a
// server on port 443; stateless needs a separate return rule, stateful lets the reply through by its state table),
// end-of-chapter question 13 (the same for a DNS query over UDP) and the DMZ section (DMZ ↔ protected still goes
// through the firewall). Tie-breaks and edges first, then the rules, then the book's scenario, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const E = (ip, port, zone) => ({ ip, port, zone });
const pkt = (proto, src, dst) => ({ proto, src, dst });
const CLIENT = E('192.168.1.10', 51000, 'protected');
const WEB = E('198.51.100.10', 443, 'internet');

// ── tie-breaks and edges ──

test('first match: the earliest matching rule decides, and the rules after it are not read', () => {
  const list = [
    { id: 1, action: 'allow', proto: 'tcp', dport: 443 },
    { id: 2, action: 'deny', proto: 'tcp', dport: 443 },
    { id: 3, action: 'allow' }
  ];
  const m = logic.firstMatch(list, pkt('tcp', CLIENT, WEB));
  assert.equal(m.index, 0);
  assert.deepEqual(m.trace, ['hit', 'unchecked', 'unchecked']);
  // the same rules in the other order: the deny wins, because it now comes first
  const swapped = [list[1], list[0], list[2]];
  assert.equal(logic.judge('stateless', swapped, [], pkt('tcp', CLIENT, WEB)).verdict, 'deny');
});

test('no rule matches: the default is deny, and every rule was read', () => {
  const r = logic.judge('stateless', logic.rules('tcp', false), [], pkt('tcp', WEB, CLIENT));
  assert.equal(r.verdict, 'deny');
  assert.equal(r.by, 'default');
  assert.equal(r.rule, -1);
  assert.ok(r.trace.every((x) => x === 'miss'));
});

test('state lookup comes before the rules: a packet in the table passes and no rule is read', () => {
  const table = [{ proto: 'tcp', a: { ip: CLIENT.ip, port: 51000 }, b: { ip: WEB.ip, port: 443 } }];
  const denyAll = [{ id: 1, action: 'deny' }];
  const r = logic.judge('stateful', denyAll, table, pkt('tcp', WEB, CLIENT));
  assert.equal(r.verdict, 'allow');
  assert.equal(r.by, 'state');
  assert.equal(r.stateRow, 0);
  assert.deepEqual(r.trace, ['unchecked']);
  assert.equal(r.table.length, 1, 'a packet of a known connection adds no entry');
});

test('a state entry matches both directions of its connection, and nothing else', () => {
  const table = [{ proto: 'tcp', a: { ip: CLIENT.ip, port: 51000 }, b: { ip: WEB.ip, port: 443 } }];
  assert.equal(logic.lookupState(table, pkt('tcp', CLIENT, WEB)), 0, 'more of the same, outbound');
  assert.equal(logic.lookupState(table, pkt('tcp', WEB, CLIENT)), 0, 'the reply');
  assert.equal(logic.lookupState(table, pkt('udp', WEB, CLIENT)), -1, 'another protocol');
  assert.equal(logic.lookupState(table, pkt('tcp', E('203.0.113.66', 443, 'internet'), CLIENT)), -1, 'another source address');
  assert.equal(logic.lookupState(table, pkt('tcp', WEB, E(CLIENT.ip, 51001, 'protected'))), -1, 'another client port');
});

test('a stateless firewall keeps no table, even for packets it lets through', () => {
  const r = logic.judge('stateless', logic.rules('tcp', false), [], pkt('tcp', CLIENT, WEB));
  assert.equal(r.verdict, 'allow');
  assert.deepEqual(r.table, []);
  assert.equal(r.added, -1);
});

test('a stateful firewall writes an entry only for a new connection a rule allows, never for a denied one', () => {
  const list = logic.rules('tcp', false);
  const out = logic.judge('stateful', list, [], pkt('tcp', CLIENT, WEB));
  assert.equal(out.added, 0);
  assert.deepEqual(out.table, [{ proto: 'tcp', a: { ip: CLIENT.ip, port: 51000 }, b: { ip: WEB.ip, port: 443 } }]);
  const denied = logic.judge('stateful', list, out.table, pkt('tcp', E('203.0.113.66', 443, 'internet'), CLIENT));
  assert.equal(denied.verdict, 'deny');
  assert.equal(denied.table, out.table);
});

test('judge does not change the table it is given', () => {
  const table = [{ proto: 'tcp', a: { ip: CLIENT.ip, port: 51000 }, b: { ip: WEB.ip, port: 443 } }];
  const copy = structuredClone(table);
  logic.judge('stateful', logic.rules('tcp', false), table, pkt('tcp', E('192.168.1.10', 51001, 'protected'), WEB));
  assert.deepEqual(table, copy);
});

// ── the rules ──

test('a rule field left out matches anything; each field given must match', () => {
  const p = pkt('tcp', CLIENT, WEB);
  assert.ok(logic.matchRule({}, p));
  assert.ok(logic.matchRule({ proto: 'tcp', from: 'protected', to: 'internet', dport: 443 }, p));
  assert.ok(!logic.matchRule({ proto: 'udp' }, p));
  assert.ok(!logic.matchRule({ from: 'dmz' }, p));
  assert.ok(!logic.matchRule({ to: 'dmz' }, p));
  assert.ok(!logic.matchRule({ dst: '192.168.2.10' }, p));
  assert.ok(!logic.matchRule({ dport: 80 }, p));
  assert.ok(!logic.matchRule({ sport: 443 }, p));
  assert.ok(logic.matchRule({ sport: 51000 }, p));
});

test('the rule list: outbound 443/TCP, outbound 53/UDP, internet to the DMZ web server; the return rule only on request', () => {
  assert.deepEqual(logic.rules('tcp', false).map((r) => r.id), [1, 2, 3]);
  const withReturn = logic.rules('udp', true);
  assert.deepEqual(withReturn.map((r) => r.id), [1, 2, 3, 4]);
  assert.deepEqual(withReturn[3], { id: 4, action: 'allow', proto: 'udp', from: 'internet', to: 'protected', sport: 53 });
  assert.equal(logic.rules('tcp', true)[3].sport, 443);
});

// ── the book's scenario ──

test('step 1: the client\'s request to port 443 is allowed by rule 1, in both kinds; stateful records it', () => {
  for (const kind of logic.kinds) {
    const s = at({ kind }, 1);
    assert.equal(s.event.verdict, 'allow');
    assert.equal(s.rules[s.event.rule].id, 1);
    assert.equal(s.table.length, kind === 'stateful' ? 1 : 0);
  }
});

test('Primjer 5, stateless: without a separate rule the reply from port 443 is dropped by default', () => {
  const e = at({}, 2).event;
  assert.equal(e.packet.kind, 'reply');
  assert.equal(e.packet.src.port, 443);
  assert.equal(e.packet.dst.port, 51000);
  assert.equal(e.verdict, 'deny');
  assert.equal(e.by, 'default');
});

test('Primjer 5, stateless with the return rule: the reply passes by rule 4', () => {
  const s = at({ returnRule: true }, 2);
  assert.equal(s.event.verdict, 'allow');
  assert.equal(s.rules[s.event.rule].id, 4);
});

test('Primjer 5, stateful: the reply passes by its state entry, with no rule for that direction', () => {
  const e = at({ kind: 'stateful' }, 2).event;
  assert.equal(e.verdict, 'allow');
  assert.equal(e.by, 'state');
  assert.equal(e.stateRow, 0);
});

test('the return rule is a hole: a packet nobody asked for, from port 443, passes it too; stateful drops it', () => {
  const hole = at({ returnRule: true }, 3).event;
  assert.equal(hole.packet.kind, 'unsolicited');
  assert.equal(hole.packet.src.ip, '203.0.113.66');
  assert.equal(hole.verdict, 'allow');
  assert.equal(hole.rule, 3);
  assert.equal(at({}, 3).event.verdict, 'deny');
  const st = at({ kind: 'stateful' }, 3).event;
  assert.equal(st.verdict, 'deny');
  assert.equal(st.by, 'default');
  // the return rule on a stateful firewall opens the same hole: the rules still decide what the table does not know
  assert.equal(at({ kind: 'stateful', returnRule: true }, 3).event.verdict, 'allow');
});

test('question 13, UDP to port 53: the same outcomes as TCP; stateful remembers the query although UDP has no connection', () => {
  assert.equal(at({ proto: 'udp' }, 1).event.verdict, 'allow');
  assert.equal(at({ proto: 'udp' }, 1).rules[at({ proto: 'udp' }, 1).event.rule].id, 2);
  assert.equal(at({ proto: 'udp' }, 2).event.packet.src.ip, '198.51.100.53');
  assert.equal(at({ proto: 'udp' }, 2).event.verdict, 'deny');
  assert.equal(at({ proto: 'udp', kind: 'stateful' }, 2).event.by, 'state');
  assert.equal(at({ proto: 'udp', kind: 'stateful' }, 1).table[0].proto, 'udp');
  assert.equal(at({ proto: 'udp', returnRule: true }, 3).event.packet.src.port, 53);
});

test('DMZ: the internet reaches the DMZ web server by rule 3', () => {
  for (const kind of logic.kinds) {
    const e = at({ kind }, 4).event;
    assert.equal(e.packet.dst.zone, 'dmz');
    assert.equal(e.verdict, 'allow');
    assert.equal(at({ kind }, 4).rules[e.rule].id, 3);
  }
});

test('DMZ is not a hole: DMZ to the protected network goes through the same rules and is dropped by default', () => {
  for (const kind of logic.kinds) {
    for (const returnRule of [false, true]) {
      const e = at({ kind, returnRule }, 5).event;
      assert.equal(e.packet.src.zone, 'dmz');
      assert.equal(e.packet.dst.zone, 'protected');
      assert.equal(e.verdict, 'deny');
      assert.equal(e.by, 'default');
    }
  }
  // the entry for the internet → DMZ connection does not let the DMZ server reach inside
  assert.equal(at({ kind: 'stateful' }, 5).table.length, 2);
});

// ── steps ──

test('steps: start, request, reply, unsolicited, to the DMZ, DMZ to inside', () => {
  assert.equal(logic.steps, 5);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => at({}, n).phase), ['start', 'request', 'reply', 'unsolicited', 'toDmz', 'dmzToInside']);
  assert.equal(at({}, 0).event, null);
  assert.deepEqual(at({ kind: 'stateful' }, 0).table, []);
});

test('a param change recomputes at the same step', () => {
  assert.equal(at({ kind: 'stateless' }, 2).event.verdict, 'deny');
  assert.equal(at({ kind: 'stateful' }, 2).event.verdict, 'allow');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const kind of logic.kinds) {
    for (const proto of logic.protos) {
      for (let n = 0; n <= logic.steps; n++) {
        const s = at({ kind, proto, returnRule: true }, n);
        assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
      }
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ kind: 'stateful', proto: 'udp', returnRule: true });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ kind: 'stateful' });
  const s1 = logic.step(logic.initial(p), 1, p);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length > 0, 'found preset params');
  const offered = { kind: logic.kinds, proto: logic.protos, returnRule: ['true', 'false'] };
  for (const b of blocks) {
    for (const k of b.matchAll(/(\w+):\s*'?([\w-]+)'?/g)) {
      assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
      assert.ok(offered[k[1]].includes(k[2]), `preset ${k[1]} ${k[2]} is offered`);
    }
  }
});
