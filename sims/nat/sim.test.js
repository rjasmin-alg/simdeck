// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for nat's model. Run: node --test sims/nat/
// Numbers from the URM book, ch. 11 (11-usmjeravanje.md), Primjer 4 (router R on 203.0.113.5, A and B from port
// 51000 to 198.51.100.10:443), and the fragment's exercises (nat.html). Tie-breaks and edges first, then the rules,
// then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const ep = (s) => { const [ip, port] = s.split(':'); return { ip, port: Number(port) }; };
const show = (e) => e.ip + ':' + e.port;
const rowsOf = (s) => s.table.map((r) => [show(r.inside), show(r.outside), show(r.dest)]);
const PAT = logic.natFor('pat');
const BASIC = logic.natFor('basic');
const out = (table, nat, src, dst = '198.51.100.10:443') => logic.translateOut(table, nat, { src: ep(src), dst: ep(dst) });

// ── tie-breaks and edges ──

test('PAT: a port already in the table is never handed out again; the lowest free one from 61000 is', () => {
  const t1 = out([], PAT, '192.168.1.10:51000').table;
  const t2 = out(t1, PAT, '192.168.1.11:51000').table;
  assert.equal(logic.freePort(t2, '203.0.113.5', 61000), 61002);
  // a hole below the highest port is filled first
  const holey = [t2[1]];
  assert.equal(logic.freePort(holey, '203.0.113.5', 61000), 61000);
  // a port taken on another outside address does not count
  assert.equal(logic.freePort([{ inside: ep('1.1.1.1:1'), outside: ep('203.0.113.6:61000'), dest: ep('2.2.2.2:2') }], '203.0.113.5', 61000), 61000);
});

test('PAT: the same connection again reuses its row and adds none (the duplicate id case)', () => {
  const first = out([], PAT, '192.168.1.10:51000');
  const again = out(first.table, PAT, '192.168.1.10:51000');
  assert.equal(again.outcome, 'reuse');
  assert.equal(again.row, 0);
  assert.equal(again.table.length, 1);
  assert.equal(show(again.out.src), '203.0.113.5:61000');
});

test('PAT: the same inside socket to another destination is a new connection and gets its own port', () => {
  const t1 = out([], PAT, '192.168.1.10:51000').table;
  const r = out(t1, PAT, '192.168.1.10:51000', '198.51.100.20:443');
  assert.equal(r.outcome, 'new');
  assert.equal(show(r.out.src), '203.0.113.5:61001');
});

test('Basic NAT: the only outside address bound to A leaves none for B, whose packet is dropped', () => {
  const t1 = out([], BASIC, '192.168.1.10:51000').table;
  const r = out(t1, BASIC, '192.168.1.11:51000');
  assert.equal(r.outcome, 'nofree');
  assert.equal(r.out, null);
  assert.equal(r.row, -1);
  assert.equal(r.table.length, 1);
});

test('Basic NAT: a host already bound reuses its address, even from another port', () => {
  const t1 = out([], BASIC, '192.168.1.10:51000').table;
  const r = out(t1, BASIC, '192.168.1.10:52000');
  assert.equal(r.outcome, 'reuse');
  assert.equal(show(r.out.src), '203.0.113.5:52000', 'address translated, port kept');
});

test('translateOut and translateIn do not change the table they are given', () => {
  const t1 = out([], PAT, '192.168.1.10:51000').table;
  const copy = structuredClone(t1);
  out(t1, PAT, '192.168.1.11:51000');
  logic.translateIn(t1, PAT, { src: null, dst: ep('203.0.113.5:61000') });
  assert.deepEqual(t1, copy);
});

test('an inbound packet to an empty table is dropped in both modes', () => {
  for (const nat of [PAT, BASIC]) assert.deepEqual(logic.translateIn([], nat, { src: null, dst: ep('203.0.113.5:61000') }), { row: -1, out: null });
});

// ── the rules ──

test('PAT looks up address and port: only the port in the table finds its row', () => {
  const t = out(out([], PAT, '192.168.1.10:51000').table, PAT, '192.168.1.11:51000').table;
  assert.equal(show(logic.translateIn(t, PAT, { src: null, dst: ep('203.0.113.5:61001') }).out.dst), '192.168.1.11:51000');
  assert.equal(logic.translateIn(t, PAT, { src: null, dst: ep('203.0.113.5:61050') }).row, -1);
  assert.equal(logic.translateIn(t, PAT, { src: null, dst: ep('203.0.113.6:61000') }).row, -1, 'another address');
});

test('Basic NAT looks up the address alone: any port of a bound address goes to its host, port unchanged', () => {
  const t = out([], BASIC, '192.168.1.10:51000').table;
  const r = logic.translateIn(t, BASIC, { src: null, dst: ep('203.0.113.5:61050') });
  assert.equal(r.row, 0);
  assert.equal(show(r.out.dst), '192.168.1.10:61050');
});

// ── the book's numbers ──

test('Primjer 4 (a): A and B, both from 51000, get 203.0.113.5:61000 and :61001 (the book\'s table)', () => {
  const s = at({}, 2);
  assert.deepEqual(rowsOf(s), [
    ['192.168.1.10:51000', '203.0.113.5:61000', '198.51.100.10:443'],
    ['192.168.1.11:51000', '203.0.113.5:61001', '198.51.100.10:443']
  ]);
  assert.equal(show(s.event.after.src), '203.0.113.5:61001');
  assert.equal(show(s.event.after.dst), '198.51.100.10:443', 'the destination is not translated outbound');
});

test('Primjer 4 (a): the reply to 203.0.113.5:61000 goes back to 192.168.1.10:51000, and :61001 to B', () => {
  const r3 = at({}, 3).event, r4 = at({}, 4).event;
  assert.equal(show(r3.before.src), '198.51.100.10:443');
  assert.equal(show(r3.before.dst), '203.0.113.5:61000');
  assert.equal(show(r3.after.dst), '192.168.1.10:51000');
  assert.equal(show(r3.after.src), '198.51.100.10:443', 'the source is not translated inbound');
  assert.equal(show(r4.after.dst), '192.168.1.11:51000');
});

test('Primjer 4 (b), exercise 2: a packet from outside to 203.0.113.5:61050 finds no row and is dropped', () => {
  const e = at({}, 5).event;
  assert.equal(e.kind, 'probe');
  assert.equal(show(e.before.dst), '203.0.113.5:61050');
  assert.equal(e.outcome, 'drop');
  assert.equal(e.after, null);
});

test('exercise 3: the same packet to 61000, a port A opened, reaches A', () => {
  const e = at({ probe: '61000' }, 5).event;
  assert.equal(e.outcome, 'deliver');
  assert.equal(e.who, 'A');
  assert.equal(show(e.after.dst), '192.168.1.10:51000');
  assert.equal(at({ probe: '61001' }, 5).event.who, 'B');
});

test('A twice: one row; both replies and a probe to 61000 reach A; 61001 is dropped', () => {
  const s = at({ second: 'A' }, 5);
  assert.equal(s.table.length, 1);
  assert.equal(at({ second: 'A' }, 2).event.outcome, 'reuse');
  assert.equal(show(at({ second: 'A' }, 4).event.after.dst), '192.168.1.10:51000');
  assert.equal(at({ second: 'A', probe: '61001' }, 5).event.outcome, 'drop');
});

test('Basic NAT, one address: A goes out as 203.0.113.5:51000; B is dropped and gets no reply', () => {
  assert.equal(show(at({ mode: 'basic' }, 1).event.after.src), '203.0.113.5:51000');
  const e2 = at({ mode: 'basic' }, 2).event;
  assert.equal(e2.outcome, 'nofree');
  assert.equal(at({ mode: 'basic' }, 4).event.kind, 'noreply');
  assert.equal(at({ mode: 'basic' }, 4).table.length, 1);
});

test('Basic NAT, two addresses: B is bound to 203.0.113.6 and keeps port 51000; its reply comes back', () => {
  const s = at({ mode: 'basic2' }, 4);
  assert.deepEqual(rowsOf(s), [
    ['192.168.1.10:51000', '203.0.113.5:51000', '198.51.100.10:443'],
    ['192.168.1.11:51000', '203.0.113.6:51000', '198.51.100.10:443']
  ]);
  assert.equal(show(s.event.after.dst), '192.168.1.11:51000');
});

test('Basic NAT: the packet from outside to 203.0.113.5:61050 reaches A, port unchanged', () => {
  const e = at({ mode: 'basic' }, 5).event;
  assert.equal(e.outcome, 'deliver');
  assert.equal(show(e.after.dst), '192.168.1.10:61050');
});

// ── steps ──

test('steps: start, two outbound, two replies, one probe', () => {
  assert.equal(logic.steps, 5);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => at({}, n).phase), ['start', 'out', 'out', 'reply', 'reply', 'probe']);
  assert.equal(at({}, 0).event, null);
  assert.deepEqual(at({}, 0).table, []);
});

test('a param change recomputes the table at the same step', () => {
  assert.equal(at({ mode: 'basic2' }, 2).table[1].outside.ip, '203.0.113.6');
  assert.equal(at({ mode: 'pat' }, 2).table[1].outside.port, 61001);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const mode of logic.modes) {
    for (let n = 0; n <= logic.steps; n++) {
      const s = at({ mode, second: 'A', probe: '61000' }, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ mode: 'basic', probe: '61001' });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
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
  const offered = { mode: logic.modes, second: logic.seconds, probe: logic.probes };
  for (const b of blocks) {
    for (const k of b.matchAll(/(\w+):\s*'([^']+)'/g)) {
      assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
      assert.ok(offered[k[1]].includes(k[2]), `preset ${k[1]} ${k[2]} is offered`);
    }
  }
});
