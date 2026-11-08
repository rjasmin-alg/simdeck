// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for multicast-igmp's model (SPEC.md). Run: node --test sims/multicast-igmp/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const G = logic.STREAM;
const ports = (s, key) => Object.keys((s.table[key] || { ports: {} }).ports).map(Number).sort();
const codes = (s, code) => s.events.filter((e) => e.code === code);
/** Two hosts behind a hub on port 3 (tie-break 7b). */
const HUB = { hosts: { H1: 1, H3: 3, H5: 3 }, routerPort: 5 };

// ── tie-breaks first ──

test('tie-break 7a: two members on different ports, one leaves: the other port keeps the stream', () => {
  const s = end({ script: 'leave' });
  assert.deepEqual(s.fwd, [1]);
  assert.deepEqual(ports(s, G), [1]);
  assert.ok(s.router.groups[G] != null, 'R keeps the group: H1 answered the group-specific queries');
  assert.equal(s.history.H1.filter((x) => x === 'use').length, 6, 'H1 used a frame in every step');
});

test('tie-break 7b: two members share a port behind a hub, one leaves: the other answers and the port stays', () => {
  const p = P({});
  const states = logic.run(HUB, [
    { t: 0, do: 'join', host: 'H3', group: G },
    { t: 0, do: 'join', host: 'H5', group: G },
    { t: 1, do: 'leave', host: 'H3', group: G },
    { t: 1, do: 'gsq' },
    { t: 2, do: 'gsq' },
    { t: 3, do: 'wait' }
  ], p);
  const last = states[states.length - 1];
  assert.deepEqual(ports(last, G), [3]);
  assert.deepEqual(last.fwd, [3]);
  assert.equal(last.table[G].ports[3], 2 + logic.GMI, 'refreshed by H5\'s answer to the second query');
  assert.deepEqual(codes(states[5], 'refresh').map((e) => e.port), [3]);
  assert.deepEqual(last.table[G].leaving, []);
  assert.equal(codes(last, 'expire-port').length, 0);
  // the same without H5's answer: the port goes at leave + 2 s
  const alone = logic.run(HUB, [
    { t: 0, do: 'join', host: 'H3', group: G },
    { t: 1, do: 'leave', host: 'H3', group: G },
    { t: 1, do: 'gsq' },
    { t: 2, do: 'gsq' },
    { t: 3, do: 'wait' }
  ], p);
  assert.deepEqual(ports(alone[alone.length - 1], G), []);
});

test('tie-break: a port is removed exactly when its time comes (≤), not one step later', () => {
  const s4 = at({ script: 'leave' }, 4);   // t = 6: second query, port 3 still listed until 7
  assert.equal(s4.clock, 6);
  assert.deepEqual(ports(s4, G), [1, 3]);
  const s5 = at({ script: 'leave' }, 5);   // t = 7 = leave + 2 s
  assert.equal(s5.clock, 7);
  assert.deepEqual(ports(s5, G), [1]);
  assert.deepEqual(codes(s5, 'expire-port').map((e) => [e.port, e.after]), [[3, 'leave']]);
  assert.deepEqual(codes(at({ script: 'silent' }, 5), 'expire-port').map((e) => [e.port, e.after]), [[2, 'gmi']]);
});

test('tie-break: a host that joins twice stays one member with one table port', () => {
  const p = P({});
  const st = logic.run(logic.SCENE, [{ t: 0, do: 'join', host: 'H1', group: G }, { t: 1, do: 'join', host: 'H1', group: G }], p);
  const s = st[2];
  assert.deepEqual(s.members.H1, [G]);
  assert.deepEqual(ports(s, G), [1]);
  assert.equal(s.table[G].ports[1], 1 + logic.GMI);
});

// ── rules ──

test('rule 1: group → MAC is 01-00-5E and the low 23 bits; the group bit is the lowest bit of the first octet', () => {
  assert.equal(logic.groupMac('239.1.1.1'), '01-00-5E-01-01-01');
  assert.equal(logic.groupMac('224.0.0.1'), '01-00-5E-00-00-01');
  assert.equal(logic.groupMac('239.255.255.255'), '01-00-5E-7F-FF-FF');
  assert.equal(logic.isGroupMac('01-00-5E-00-00-01'), true);
  assert.equal(logic.isGroupMac('00-1A-2B-3C-4D-5E'), false);
  assert.equal(logic.bitsOf('239.1.1.1'), '11101111000000010000000100000001');
});

test('rule 2: without snooping the stream is flooded to every port but the ingress: 4 copies', () => {
  const s = end({ snooping: false, script: 'h1' });
  assert.deepEqual(s.fwd, [1, 2, 3, 4]);
  assert.equal(codes(s, 'stream')[0].copies, 4);
  assert.deepEqual(s.received, { H1: 2, H2: 2, H3: 2, H4: 2 });
  assert.deepEqual(s.used, { H1: 2, H2: 0, H3: 0, H4: 0 }, 'only H1 asked; the others\' cards drop it');
  assert.equal(s.history.H2[2], 'nic');
  // and the report itself is flooded too
  const s1 = at({ snooping: false, script: 'h1' }, 2);
  assert.deepEqual(codes(s1, 'report')[0].to, [2, 3, 4, 5]);
});

test('rule 3: a join sends an unsolicited report to the group address', () => {
  const s = at({ script: 'h1' }, 2);
  const m = s.inFlight.find((x) => x.type === 'report');
  assert.equal(m.from, 'H1');
  assert.equal(m.dst, G);
  assert.equal(m.cause, 'join');
});

test('rule 4: with snooping the report goes only to the router port and the stream only to member ports', () => {
  const s3 = at({ script: 'h1h3' }, 3);
  assert.deepEqual(codes(s3, 'report')[0].to, [5]);
  assert.deepEqual(codes(s3, 'add-port').map((e) => e.port), [3]);
  assert.deepEqual(s3.fwd, [1, 3]);
  const s = end({ script: 'h1h3' });
  assert.equal(codes(s, 'stream')[0].copies, 2);
  assert.deepEqual(s.received, { H1: 3, H2: 0, H3: 2, H4: 0 });
  // unregistered: a known group at R but no entry on the switch goes to the router port only (nowhere else)
  const blank = logic.blank(logic.SCENE);
  assert.deepEqual(logic.dataPorts(blank, logic.SCENE, P({}), G, 5), []);
});

test('rule 4: before any join R does not forward the stream onto the LAN', () => {
  const s = at({ script: 'h1h3' }, 1);
  assert.deepEqual(s.fwd, []);
  assert.equal(codes(s, 'no-stream').length, 1);
});

test('rule 5: a general query goes to 224.0.0.1 on every host port and members answer', () => {
  const s = at({ script: 'overlap' }, 3);
  const q = s.inFlight.find((x) => x.type === 'gq');
  assert.equal(q.dst, '224.0.0.1');
  assert.deepEqual(q.to, [1, 2, 3, 4]);
  assert.deepEqual(codes(s, 'report').map((e) => [e.host, e.group, e.cause]),
    [['H1', G, 'gq'], ['H4', '224.1.1.1', 'gq']]);
});

test('rule 5: a silent member\'s port is removed 260 s after its last report, not at a query', () => {
  assert.equal(logic.GMI, 260);
  const q1 = at({ script: 'silent' }, 3);
  const q2 = at({ script: 'silent' }, 4);
  assert.deepEqual([q1.clock, q2.clock], [125, 250]);
  assert.deepEqual(ports(q1, G), [2]);
  assert.deepEqual(ports(q2, G), [2]);
  assert.deepEqual(codes(q2, 'no-answer').map((e) => e.port), [1, 2, 3, 4]);
  const gone = at({ script: 'silent' }, 5);
  assert.equal(gone.clock, 260);
  assert.deepEqual(ports(gone, G), []);
  assert.equal(gone.router.groups[G], undefined, 'R drops the group at the same time');
  assert.deepEqual(gone.fwd, []);
  assert.deepEqual(end({ script: 'silent' }).received, { H1: 0, H2: 4, H3: 0, H4: 0 });
  assert.deepEqual(end({ script: 'silent' }).used, { H1: 0, H2: 1, H3: 0, H4: 0 }, 'after it hangs H2 takes nothing');
});

test('rule 6: leave goes to 224.0.0.2, two group-specific queries 1 s apart, the port goes at leave + 2 s', () => {
  const sL = at({ script: 'leave' }, 2);
  const m = sL.inFlight.find((x) => x.type === 'leave');
  assert.equal(m.dst, '224.0.0.2');
  assert.deepEqual(m.to, [5]);
  assert.equal(sL.table[G].ports[3], 5 + logic.LMQC * logic.LMQI);
  assert.deepEqual(sL.fwd, [1, 3], 'the stream still reaches port 3 right after the leave');
  assert.equal(sL.history.H3[1], 'nic', 'H3 left: its card drops the frames that still arrive');
  const q = [at({ script: 'leave' }, 3), at({ script: 'leave' }, 4)];
  assert.deepEqual(q.map((s) => s.clock), [5, 6]);
  assert.deepEqual(q.map((s) => codes(s, 'gsq')[0].n), [1, 2]);
  q.forEach((s) => {
    assert.equal(s.inFlight.find((x) => x.type === 'gsq').dst, G);
    assert.deepEqual(codes(s, 'report').map((e) => e.host), ['H1']);
    assert.deepEqual(codes(s, 'no-answer').map((e) => e.port), [3]);
  });
  // no third query: the count is 2
  const p = P({ script: 'leave' });
  const extra = logic.apply(at({ script: 'leave' }, 4), { t: 6, do: 'gsq' }, logic.SCENE, p);
  assert.equal(codes(extra, 'gsq').length, 0);
});

test('rule 6: fast leave is off: the port is not removed on the leave itself', () => {
  const s = at({ script: 'leave' }, 2);
  assert.deepEqual(ports(s, G), [1, 3]);
});

test('rule 8: 224.0.0.x is flooded even with snooping', () => {
  const s = end({ script: 'h1h3' });
  assert.equal(logic.isLinkLocal('224.0.0.1'), true);
  assert.equal(logic.isLinkLocal('224.1.1.1'), false);
  assert.deepEqual(logic.dataPorts(s, logic.SCENE, P({}), '224.0.0.251', 1), [2, 3, 4, 5]);
  assert.deepEqual(logic.dataPorts(s, logic.SCENE, P({}), G, 5), [1, 3]);
});

test('rule 9: 224.1.1.1 and 239.1.1.1 share a MAC; a MAC-keyed table sends the stream to H4, whose IP layer drops it', () => {
  assert.equal(logic.groupMac('224.1.1.1'), logic.groupMac(G));
  const mac = end({ script: 'overlap', keyBy: 'mac' });
  assert.deepEqual(Object.keys(mac.table), ['01-00-5E-01-01-01']);
  assert.deepEqual(mac.table['01-00-5E-01-01-01'].groups, [G, '224.1.1.1']);
  assert.deepEqual(mac.fwd, [1, 4]);
  assert.equal(mac.history.H4[1], 'ip');
  assert.deepEqual(mac.received, { H1: 4, H2: 0, H3: 0, H4: 3 });
  assert.equal(mac.used.H4, 0);
  // keyed by group address the two stay apart
  const ip = end({ script: 'overlap', keyBy: 'ip' });
  assert.deepEqual(ip.fwd, [1]);
  assert.equal(ip.received.H4, 0);
});

test('rule 5: answers to a general query refresh R\'s group and the switch ports to t + 260', () => {
  const s = at({ script: 'overlap', keyBy: 'mac' }, 3);
  assert.equal(s.clock, 125);
  assert.deepEqual(s.table['01-00-5E-01-01-01'].ports, { 1: 385, 4: 385 });
  assert.equal(s.router.groups[G], 385);
  assert.equal(s.router.groups['224.1.1.1'], 385);
  assert.deepEqual(codes(s, 'refresh').map((e) => e.port), [1, 4]);
});

test('rule 5: a member of two groups answers a general query once per group', () => {
  const st = logic.run(logic.SCENE, [
    { t: 0, do: 'join', host: 'H1', group: G },
    { t: 1, do: 'join', host: 'H1', group: '239.2.2.2' },
    { t: 125, do: 'query' }
  ], P({}));
  assert.deepEqual(codes(st[3], 'report').map((e) => e.group), [G, '239.2.2.2']);
  assert.equal(st[3].table['239.2.2.2'].ports[1], 385);
});

test('rule 4a and 6: when the last member leaves, R drops the group at leave + 2 s and the stream stops', () => {
  const st = logic.run(logic.SCENE, [
    { t: 0, do: 'join', host: 'H1', group: G },
    { t: 10, do: 'leave', host: 'H1', group: G },
    { t: 10, do: 'gsq' },
    { t: 11, do: 'gsq' },
    { t: 12, do: 'wait' }
  ], P({}));
  assert.equal(st[2].router.groups[G], 12, 'R\'s timer is cut to leave + 2 s');
  assert.deepEqual(st[2].fwd, [1]);
  assert.deepEqual(st[4].fwd, [1]);
  assert.equal(st[5].router.groups[G], undefined);
  assert.deepEqual(st[5].fwd, []);
  assert.deepEqual(codes(st[5], 'router-expire').map((e) => e.group), [G]);
  assert.deepEqual(st[5].table, {});
});

test('rule 6: a Leave never lengthens a port\'s time (min), and a later report clears the leave mark', () => {
  const st = logic.run(HUB, [
    { t: 0, do: 'join', host: 'H3', group: G },
    { t: 0, do: 'join', host: 'H5', group: G },
    { t: 1, do: 'leave', host: 'H3', group: G },
    { t: 2, do: 'leave', host: 'H5', group: G }
  ], P({}));
  assert.equal(st[3].table[G].ports[3], 3);
  assert.deepEqual(st[3].table[G].leaving, [3]);
  assert.equal(st[4].table[G].ports[3], 3, 'a second Leave keeps the shorter time');
  const back = logic.apply(st[3], { t: 2, do: 'join', host: 'H3', group: G }, HUB, P({}));
  assert.deepEqual(back.table[G].leaving, []);
  assert.equal(back.table[G].ports[3], 2 + logic.GMI);
});

test('rule 2: without snooping the Leave and the group-specific queries are flooded; H1 answers, the stream goes on', () => {
  const sL = at({ script: 'leave', snooping: false }, 2);
  assert.deepEqual(codes(sL, 'leave')[0].to, [1, 2, 4, 5]);
  const q = at({ script: 'leave', snooping: false }, 3);
  assert.deepEqual(codes(q, 'gsq')[0].to, [1, 2, 3, 4]);
  assert.deepEqual(codes(q, 'report').map((e) => e.host), ['H1']);
  const e = end({ script: 'leave', snooping: false });
  assert.deepEqual(e.fwd, [1, 2, 3, 4]);
  assert.ok(e.router.groups[G] != null);
  assert.deepEqual(e.table, {}, 'no snooping, no table');
});

test('rule 4a: R forwards the 239.1.1.1 stream only for that group, not for any group it knows', () => {
  const st = logic.run(logic.SCENE, [{ t: 0, do: 'join', host: 'H4', group: '224.1.1.1' }], P({}));
  assert.ok(st[1].router.groups['224.1.1.1'] != null);
  assert.deepEqual(st[1].fwd, []);
  assert.equal(codes(st[1], 'no-stream').length, 1);
});

test('rule 4: unregistered multicast from a host port goes to the router port only', () => {
  const blank = logic.blank(logic.SCENE);
  assert.deepEqual(logic.dataPorts(blank, logic.SCENE, P({}), G, 1), [5]);
  assert.deepEqual(logic.dataPorts(blank, logic.SCENE, P({ snooping: false }), G, 1), [2, 3, 4, 5]);
});

test('rule 8: only 224.0.0.0/24 is link-local', () => {
  assert.equal(logic.isLinkLocal('224.0.0.255'), true);
  assert.equal(logic.isLinkLocal('224.0.1.1'), false);
  const s = end({ script: 'h1h3' });
  assert.deepEqual(logic.dataPorts(s, logic.SCENE, P({}), '224.0.1.1', 5), []);
});

test('presets: step counts 3, 4, 6, 6, 4; defaults give sim.json steps', () => {
  assert.deepEqual(['h1', 'h1h3', 'leave', 'silent', 'overlap'].map((script) => logic.steps(P({ script }))), [3, 4, 6, 6, 4]);
  const meta = require('./sim.json');
  assert.equal(logic.steps(P({})), meta.steps);
});

test('the leave preset starts where the two-receivers preset ends', () => {
  const s0 = at({ script: 'leave' }, 0);
  const s = end({ script: 'h1h3' });
  assert.deepEqual(s0.table, s.table);
  assert.deepEqual(s0.members, s.members);
  assert.deepEqual(s0.received, { H1: 0, H2: 0, H3: 0, H4: 0 });
});

test('unknown script falls back to the default', () => {
  assert.deepEqual(at({ script: 'nope' }, 2), at({}, 2));
});

// ── generic checks every sim keeps ──

const ALL = [];
for (const script of Object.keys(logic.SCRIPTS).filter((k) => k !== 'h1only')) {
  for (const snooping of [true, false]) for (const keyBy of ['ip', 'mac']) ALL.push({ script, snooping, keyBy });
}

test('state is JSON-safe at every step', () => {
  for (const o of ALL) {
    for (let n = 0; n <= logic.steps(P(o)); n++) {
      const s = at(o, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of ALL) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ script: 'leave' });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const before = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, before);
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
  const scripts = [...html.matchAll(/script:\s*'(\w+)'/g)].map((m) => m[1]);
  for (const k of scripts) assert.ok(k in logic.SCRIPTS, `preset script ${k} exists`);
});
