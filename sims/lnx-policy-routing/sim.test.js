// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-policy-routing's model. Run: node --test sims/lnx-policy-routing/
// Rules and numbers: SPEC.md (checked on a Linux 6.8 kernel). Tie-breaks first, then one or more tests per rule, the
// presets' numbers, and the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const PRESETS = {
  'two-sources': {},
  'lan-leak': { script: 'lan-leak', replyRule: true },
  'empty-table': { script: 'empty-table' },
  'reply-path': { script: 'reply-path' },
  blackhole: { script: 'blackhole' }
};
const pk = (from, dst) => Object.assign({ dst }, logic.SOURCES[from]);
const cfg = (over) => logic.configFor(P(over));
/** The decision as short words: r<prio>+ / r<prio>- / <table>✓ / <table>✕ / fwd:<fate>@<at>. */
function trace(c, packet) {
  return logic.decide(c, packet).map((e) => e.kind === 'rule' ? 'r' + c.rules[e.idx].prio + (e.match ? '+' : '-')
    : e.kind === 'lookup' ? e.table + (e.winner < 0 ? '✕' : '✓') : 'fwd:' + e.fate + '@' + e.at);
}
const last = (c, packet) => { const evs = logic.decide(c, packet); return evs[evs.length - 1]; };
const prios = (rules) => rules.map((r) => r.prio);

// ── tie-breaks (rule 6) ──

test('rule 6a: equal priority, the rule added first is tried first', () => {
  const c = cfg({ ruleFrom30: false });
  logic.ruleAdd(c.rules, { prio: 700, from: '192.168.10.20/32', table: '100' });
  logic.ruleAdd(c.rules, { prio: 700, from: '192.168.10.20/32', table: 'main' });
  assert.deepEqual(prios(c.rules), [0, 700, 700, 32766, 32767]);
  assert.equal(c.rules[1].table, '100');
  const e = last(c, pk('pc20', logic.SERVER));
  assert.equal(e.table, '100');
  assert.equal(e.at, 'inet');
  assert.equal(e.dev, 'eth1'); // kernel: via 198.51.100.1 dev eth1 table 100
});

test('rule 6a: a new rule goes after its equals and before the first higher priority', () => {
  const c = cfg({});
  logic.ruleAdd(c.rules, { prio: 1000, from: '192.168.10.20/32', table: '200' });
  assert.deepEqual(prios(c.rules), [0, 1000, 1000, 32766, 32767]);
  assert.equal(c.rules[1].from, '192.168.10.30/32');
  assert.equal(c.rules[2].from, '192.168.10.20/32');
  assert.notEqual(c.rules[1].id, c.rules[2].id, 'ids stay unique');
});

test('rule 6b: no priority → the second rule\'s priority minus one (999 with rule 1000, 32765 alone)', () => {
  assert.deepEqual(prios(cfg({ replyRule: true }).rules), [0, 999, 1000, 32766, 32767]);
  assert.deepEqual(prios(cfg({ ruleFrom30: false, replyRule: true }).rules), [0, 32765, 32766, 32767]);
  assert.deepEqual(prios(cfg({ script: 'empty-table', replyRule: true }).rules), [0, 899, 900, 1000, 32766, 32767]);
  assert.deepEqual(prios(cfg({ script: 'blackhole', replyRule: true }).rules), [0, 499, 500, 1000, 32766, 32767]);
  // the second rule at priority 0 gives 0
  const rules = [{ prio: 0 }, { prio: 0 }];
  assert.equal(logic.autoPrio(rules), 0);
});

test('rule 6c: an identical rule at the same priority is refused (File exists); the list does not change', () => {
  const c = cfg({});
  assert.equal(logic.ruleAdd(c.rules, { prio: 1000, from: '192.168.10.30/32', table: '100' }), null);
  assert.deepEqual(prios(c.rules), [0, 1000, 32766, 32767]);
  // another selector or table at the same priority is fine (rule 6a)
  assert.ok(logic.ruleAdd(c.rules, { prio: 1000, from: '192.168.10.30/32', table: 'main' }));
});

test('rule 6c: an identical rule without a priority gets a new one and is added again', () => {
  // with the rule on from the start the first reply takes 5 steps: the command is step 2 + 5 + 1
  const s = at({ script: 'reply-path', replyRule: true }, 8);
  assert.equal(s.phase, 'change');
  assert.equal(s.run.prio, 998);
  assert.equal(s.run.dup, true);
  assert.equal(s.rules.filter((r) => r.from === '198.51.100.10/32').length, 2);
});

test('rule 6d: a route that is there already is refused (File exists, exit 2)', () => {
  const s = at({ script: 'lan-leak', replyRule: true, lanInTable100: true }, 8);
  assert.equal(s.phase, 'change');
  assert.equal(s.run.ok, false);
  assert.equal(s.run.exit, 2);
  assert.deepEqual(s.run.out, ['RTNETLINK answers: File exists']);
  assert.equal(s.tables['100'].length, 2);
});

test('rule 3 tie-breaks (copied lookup): longer prefix, then metric, then table order', () => {
  const t = [{ dst: '0.0.0.0', prefix: 0, metric: 0 }, { dst: '10.0.0.0', prefix: 8, metric: 600 }, { dst: '10.0.0.0', prefix: 8, metric: 100 },
    { dst: '10.0.0.0', prefix: 8, metric: 100 }];
  assert.equal(logic.lookup(t, '10.1.2.3').winner, 2);
  assert.deepEqual(logic.lookup(t, '10.1.2.3').order, [2, 3, 1, 0]);
  assert.equal(logic.lookup(t, '8.8.8.8').winner, 0);
});

// ── rule 1: order, the default rules, the local table ──

test('rule 1: the default list is 0 local, 32766 main, 32767 default', () => {
  const c = cfg({ ruleFrom30: false });
  assert.deepEqual(c.rules.map(logic.ruleLine), ['0:\tfrom all lookup local', '32766:\tfrom all lookup main', '32767:\tfrom all lookup default']);
  assert.equal(logic.ruleLine(cfg({}).rules[1]), '1000:\tfrom 192.168.10.30 lookup 100');
});

test('rule 1: every packet first matches rule 0 and finds no route in local unless it is for rt1', () => {
  for (const from of ['pc20', 'pc30', 'rt1']) {
    const tr = trace(cfg({}), pk(from, logic.SERVER));
    assert.deepEqual(tr.slice(0, 2), ['r0+', 'local✕'], from);
  }
  const e = last(cfg({}), pk('pc30', '192.168.10.1'));
  assert.equal(e.kind, 'lookup');
  assert.equal(e.outcome.kind, 'local');
  assert.equal(e.get, 'local 192.168.10.1 from 192.168.10.30 dev lo table local'); // kernel
});

test('rule 1: rules run in ascending priority whatever order they were added in', () => {
  const c = cfg({ ruleFrom30: false });
  logic.ruleAdd(c.rules, { prio: 2000, from: '192.168.10.20/32', table: 'main' });
  logic.ruleAdd(c.rules, { prio: 1500, from: '192.168.10.20/32', table: '100' });
  assert.deepEqual(prios(c.rules), [0, 1500, 2000, 32766, 32767]);
  assert.equal(last(c, pk('pc20', logic.SERVER)).table, '100');
});

// ── rule 2: selectors ──

test('rule 2: from matches the source, not the destination', () => {
  const c = cfg({});
  const r = c.rules[1];
  assert.deepEqual(logic.selectorMiss(r, pk('pc30', logic.SERVER)), []);
  assert.deepEqual(logic.selectorMiss(r, pk('pc20', '192.168.10.30')), ['from']);
});

test('rule 2: to, iif, and every selector must match', () => {
  const rule = { from: '192.168.10.0/24', to: '192.0.2.0/24', iif: 'eth2' };
  assert.deepEqual(logic.selectorMiss(rule, pk('pc20', logic.SERVER)), []);
  assert.deepEqual(logic.selectorMiss(rule, pk('pc20', '192.168.10.30')), ['to']);
  assert.deepEqual(logic.selectorMiss(rule, pk('rt1', logic.SERVER)), ['from', 'iif']);
  assert.deepEqual(logic.selectorMiss({ from: null, to: null, iif: null }, pk('inet', '198.51.100.10')), []);
});

test('rule 2: a source rule catches LAN traffic too (misconception)', () => {
  assert.deepEqual(trace(cfg({ replyRule: true }), pk('rt1', '192.168.10.20')), ['r0+', 'local✕', 'r999+', '100✓', 'fwd:lost@ispB']);
  assert.deepEqual(trace(cfg({}), pk('rt1', '192.168.10.20')), ['r0+', 'local✕', 'r1000-', 'r32766+', 'main✓', 'fwd:delivered@pc20']);
});

test('rule 7: a LAN host sending to its own LAN never asks rt1', () => {
  const evs = logic.decide(cfg({}), pk('pc30', '192.168.10.20'));
  assert.equal(evs.length, 1);
  assert.equal(evs[0].kind, 'direct');
  assert.deepEqual([evs[0].outcome.fate, evs[0].outcome.at], ['delivered', 'pc20']);
  const s = at({ script: 'one', source: 'pc30', dst: '192.168.10.20' }, 1);
  assert.equal(logic.steps(P({ script: 'one', source: 'pc30', dst: '192.168.10.20' })), 1);
  assert.equal(s.phase, 'direct');
  assert.equal(s.forward.at, 'pc20');
  assert.equal(s.chosen, null);
  assert.deepEqual(s.marks, ['pending', 'pending', 'pending', 'pending']);
  assert.equal(s.log.length, 1);
});

// ── rule 3: longest prefix in the chosen table ──

test('rule 3: in table 100 the LAN /24 beats the default /0', () => {
  const c = cfg({ lanInTable100: true, replyRule: true });
  const lk = logic.decide(c, pk('rt1', '192.168.10.20')).find((e) => e.kind === 'lookup' && e.table === '100');
  assert.deepEqual(lk.matches, [0, 1]);
  assert.equal(lk.winner, 1);
  assert.equal(last(c, pk('rt1', '192.168.10.20')).get, '192.168.10.20 from 198.51.100.10 dev eth2 table 100 uid 0'); // kernel (reviewer)
  assert.equal(last(c, pk('pc30', logic.SERVER)).via, '198.51.100.1');
});

test('rule 3: the same destination, two sources, two tables, two exits', () => {
  const c = cfg({});
  assert.equal(last(c, pk('pc20', logic.SERVER)).get, '192.0.2.80 from 192.168.10.20 via 203.0.113.1 dev eth0'); // kernel
  assert.equal(last(c, pk('pc30', logic.SERVER)).get, '192.0.2.80 from 192.168.10.30 via 198.51.100.1 dev eth1 table 100'); // kernel
});

// ── rule 4: a failed lookup goes on ──

test('rule 4: a table that does not exist sends evaluation to the next rule', () => {
  assert.deepEqual(trace(cfg({ script: 'empty-table' }), pk('pc20', logic.SERVER)),
    ['r0+', 'local✕', 'r900+', '200✕', 'r1000-', 'r32766+', 'main✓', 'fwd:delivered@inet']);
  const lk = logic.decide(cfg({ script: 'empty-table' }), pk('pc20', logic.SERVER))[3];
  assert.equal(lk.exists, false);
});

test('rule 4: a table with routes but none for the destination goes on too', () => {
  const c = cfg({});
  c.tables['100'] = [];
  logic.routeAdd(c.tables, '100', { dst: '192.168.10.0', prefix: 24, dev: 'eth2' });
  assert.deepEqual(trace(c, pk('pc30', logic.SERVER)), ['r0+', 'local✕', 'r1000+', '100✕', 'r32766+', 'main✓', 'fwd:delivered@inet']);
});

test('rule 4: when the last rule fails as well, Network is unreachable', () => {
  const c = cfg({});
  c.tables.main = c.tables.main.filter((r) => r.prefix !== 0);
  const evs = logic.decide(c, pk('pc20', logic.SERVER));
  const e = evs[evs.length - 1];
  assert.equal(e.kind, 'lookup');
  assert.equal(e.table, 'default');
  assert.equal(e.outcome.kind, 'noroute');
  assert.equal(e.get, 'RTNETLINK answers: Network is unreachable');
});

// ── rule 5: actions that end it ──

test('rule 5: blackhole ends the decision at the rule, no table read', () => {
  const evs = logic.decide(cfg({ script: 'blackhole' }), pk('pc20', logic.SERVER));
  assert.equal(evs.length, 3);
  assert.equal(evs.filter((e) => e.kind === 'lookup' && e.table !== 'local').length, 0);
  assert.equal(evs[2].end, 'blackhole');
  assert.equal(evs[2].outcome.fate, 'dropped');
  assert.equal(evs[2].get, 'RTNETLINK answers: Invalid argument'); // kernel
  // the LAN is not caught by `to 192.0.2.0/24`
  assert.deepEqual(trace(cfg({ script: 'blackhole' }), pk('rt1', '192.168.10.30')).slice(2, 3), ['r500-']);
});

test('rule 5: unreachable and prohibit end it with an error', () => {
  for (const [action, msg] of [['unreachable', 'Network is unreachable'], ['prohibit', 'Permission denied']]) {
    const c = cfg({});
    logic.ruleAdd(c.rules, { prio: 500, to: '192.0.2.0/24', action });
    const e = last(c, pk('pc30', logic.SERVER));
    assert.equal(e.end, action);
    assert.equal(e.outcome.fate, 'error');
    assert.equal(e.get, 'RTNETLINK answers: ' + msg); // kernel
  }
});

// ── rule 8: after the router ──

test('rule 8: the other uplink\'s source is filtered by the ISP; its own passes', () => {
  assert.deepEqual(trace(cfg({}), pk('rt1', logic.SERVER)).slice(-1), ['fwd:filtered@ispA']);
  assert.deepEqual(trace(cfg({ replyRule: true }), pk('rt1', logic.SERVER)).slice(-1), ['fwd:delivered@inet']);
  assert.equal(last(cfg({ replyRule: true }), pk('rt1', logic.SERVER)).get, '192.0.2.80 from 198.51.100.10 via 198.51.100.1 dev eth1 table 100 uid 0'); // kernel
  assert.equal(last(cfg({}), pk('rt1', logic.SERVER)).get, '192.0.2.80 from 198.51.100.10 via 203.0.113.1 dev eth0 uid 0'); // kernel
});

test('rule 8: LAN sources pass either ISP (NAT assumed); a LAN destination at an ISP is lost', () => {
  assert.equal(logic.fateOf({ via: '203.0.113.1', dev: 'eth0' }, pk('pc20', logic.SERVER)).fate, 'delivered');
  assert.equal(logic.fateOf({ via: '198.51.100.1', dev: 'eth1' }, pk('pc20', logic.SERVER)).fate, 'delivered');
  assert.deepEqual(logic.fateOf({ via: '198.51.100.1', dev: 'eth1' }, pk('pc30', '192.168.10.20')), { fate: 'lost', at: 'ispB' });
  assert.deepEqual(logic.fateOf({ via: null, dev: 'eth2' }, pk('pc30', '192.168.10.20')), { fate: 'delivered', at: 'pc20' });
  assert.deepEqual(logic.fateOf({ via: null, dev: 'eth2' }, pk('pc30', '192.168.10.99')), { fate: 'lost', at: 'lan' });
});

// ── presets and steps ──

test('steps per preset: 11, 11, 8, 14, 3; the default page has 11', () => {
  const want = { 'two-sources': 11, 'lan-leak': 13, 'empty-table': 8, 'reply-path': 14, blackhole: 3 };
  for (const [id, over] of Object.entries(PRESETS)) assert.equal(logic.steps(P(over)), want[id], id);
  assert.equal(logic.steps(logic.defaults), 11);
  assert.equal(logic.steps(P({ script: 'one', source: 'pc30' })), 5);
});

test('two-sources: pc20 → main → ISP-A, pc30 → 100 → ISP-B; the log keeps both', () => {
  const s = at({}, 11);
  assert.deepEqual(s.log.map((l) => [l.from, l.prio, l.table, l.via, l.fate]),
    [['pc20', 32766, 'main', '203.0.113.1', 'delivered'], ['pc30', 1000, '100', '198.51.100.1', 'delivered']]);
  const s6 = at({}, 6);
  assert.equal(s6.phase, 'forward');
  assert.equal(s6.log.length, 1);
  assert.equal(at({}, 5).log.length, 0, 'the log has a packet once its fate is known');
  assert.equal(at({}, 5).get, '192.0.2.80 from 192.168.10.20 via 203.0.113.1 dev eth0', 'the get line is known at the lookup');
});

test('lan-leak: pc20 asks rt1, the reply is lost at ISP-B, the route is added, then on the LAN', () => {
  const s = at(PRESETS['lan-leak'], 13);
  assert.deepEqual(s.log.map((l) => l.kind + ':' + l.table + ':' + l.fate + '@' + l.at), ['local:local:delivered@rt1', 'forward:100:lost@ispB', 'forward:100:delivered@pc20']);
  const c = at(PRESETS['lan-leak'], 8);
  assert.equal(c.run.ok, true);
  assert.equal(c.run.text, 'ip route add 192.168.10.0/24 dev eth2 table 100');
  assert.deepEqual(c.event.changed, ['table:100']);
  assert.deepEqual(c.tables['100'].map(logic.routeLine), ['default via 198.51.100.1 dev eth1', '192.168.10.0/24 dev eth2 scope link']); // kernel listing
});

test('reply-path: the request is for rt1, the reply is filtered, the rule (999) fixes it', () => {
  const s2 = at({ script: 'reply-path' }, 2);
  assert.equal(s2.outcome.kind, 'local');
  assert.equal(s2.get, 'local 198.51.100.10 from 192.0.2.80 dev lo table local');
  assert.equal(at({ script: 'reply-path' }, 8).forward.fate, 'filtered');
  const c = at({ script: 'reply-path' }, 9);
  assert.equal(c.run.prio, 999);
  assert.equal(c.run.text, 'ip rule add from 198.51.100.10 lookup 100');
  assert.equal(at({ script: 'reply-path' }, 14).forward.fate, 'delivered');
});

test('log, numbering and the view fields', () => {
  const b = at({ script: 'blackhole' }, 3);
  assert.deepEqual(b.log.map((l) => [l.n, l.kind, l.fate, l.prio, l.table]), [[1, 'blackhole', 'dropped', 500, null]]);
  assert.deepEqual(at({}, 11).log.map((l) => l.n), [1, 2]);
  assert.equal(at({}, 7).packet.n, 2);
  const r = at({ script: 'reply-path' }, 2);
  assert.deepEqual([r.log[0].kind, r.log[0].table, r.log[0].prio], ['local', 'local', 0]);
  const look = at({}, 10);
  assert.deepEqual(look.chosen, { table: '100', route: 0 });
  const fwd = at({}, 11);
  assert.deepEqual(fwd.forward, { via: '198.51.100.1', dev: 'eth1', fate: 'delivered', at: 'inet' });
  assert.deepEqual(fwd.chosen, { table: '100', route: 0 });
  const no = at({}, 3);
  assert.deepEqual(no.miss, ['from']);
  assert.equal(no.chosen, null);
  assert.deepEqual(at({ script: 'reply-path' }, 9).event.changed, ['rules']);
  assert.equal(at({ script: 'reply-path' }, 9).run.rule, 'r999');
});

test('ruleLine and the scene\'s tables in kernel order; default and 200 do not exist', () => {
  const c = cfg({ script: 'blackhole' });
  assert.equal(logic.ruleLine(c.rules[1]), '500:\tfrom all to 192.0.2.0/24 blackhole');
  assert.deepEqual(c.tables.main.map(logic.routeLine), ['default via 203.0.113.1 dev eth0',
    '192.168.10.0/24 dev eth2 proto kernel scope link src 192.168.10.1', '198.51.100.0/24 dev eth1 proto kernel scope link src 198.51.100.10',
    '203.0.113.0/24 dev eth0 proto kernel scope link src 203.0.113.10']);
  assert.deepEqual(c.tables.local.map((r) => r.dst), ['192.168.10.1', '198.51.100.10', '203.0.113.10']);
  assert.equal('default' in c.tables, false);
  assert.equal('200' in cfg({ script: 'empty-table' }).tables, false);
  // routeAdd compares the prefix too, and creates a table that is not there
  const t = logic.baseTables();
  assert.equal(logic.routeAdd(t, '100', { dst: '0.0.0.0', prefix: 8, dev: 'eth2' }), true);
  assert.equal(logic.routeAdd(t, '300', { dst: '10.0.0.0', prefix: 8, dev: 'eth2' }), true);
  assert.equal(t['300'].length, 1);
});

test('marks: tested rules no/hit/empty, the deciding rule win, the rest skip', () => {
  const m = (n, over) => at(over || { script: 'empty-table', script: 'empty-table' }, n).marks;
  assert.deepEqual(m(1), ['hit', 'pending', 'pending', 'pending', 'pending']);
  assert.deepEqual(m(2), ['empty', 'pending', 'pending', 'pending', 'pending']);
  assert.deepEqual(m(4), ['empty', 'empty', 'pending', 'pending', 'pending']);
  assert.deepEqual(m(5), ['empty', 'empty', 'no', 'pending', 'pending']);
  assert.deepEqual(m(7), ['empty', 'empty', 'no', 'win', 'skip']);
  assert.deepEqual(m(3, PRESETS.blackhole), ['empty', 'win', 'skip', 'skip', 'skip']);
  assert.deepEqual(at({}, 7).marks, ['hit', 'pending', 'pending', 'pending'], 'a new packet starts afresh');
});

test('the one-packet script uses source and dst', () => {
  const s = at({ script: 'one', source: 'rt1', dst: '192.168.10.20' }, 6);
  assert.equal(s.forward.at, 'pc20');
  assert.equal(s.getCmd, 'ip route get 192.168.10.20 from 198.51.100.10');
  assert.equal(at({ script: 'one', source: 'pc30' }, 1).getCmd, 'ip route get 192.0.2.80 from 192.168.10.30 iif eth2');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step of every preset', () => {
  for (const over of Object.values(PRESETS)) {
    for (let n = 0; n <= logic.steps(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ script: 'reply-path' });
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
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
