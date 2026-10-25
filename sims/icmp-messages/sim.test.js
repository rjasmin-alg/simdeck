// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for icmp-messages' model (rules: SPEC.md). Run: node --test sims/icmp-messages/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const run = (over) => { const p = P(over); const out = []; for (let n = 0; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n)); return out; };
const end = (over) => { const r = run(over); return r[r.length - 1]; };
/** Who decided and what the PC got: [node, rule, result kind, result source]. */
const outcome = (over) => {
  const r = run(over);
  const d = r.map((s) => s.decision).filter(Boolean).pop();
  const res = r[r.length - 1].result;
  return [d.node, d.rule, res.kind, res.from || null];
};
const PRESETS = {
  'echo-ok': {},
  'no-route': { scenario: 'noRoute' },
  'host-down': { scenario: 'hostDown' },
  'firewall-drop': { scenario: 'fwDrop' },
  'firewall-reject': { scenario: 'fwReject' },
  'ttl-low': { ttl: 1 },
  'local-down': { scenario: 'local' }
};

// ── tie-breaks first ──

test('tie-break (rule 8): the first device whose rule fires answers; nothing behind it is reached', () => {
  // TTL 1 dies at R1 whatever is broken further on: R2's filter, the missing server
  for (const sc of ['ok', 'hostDown', 'fwDrop', 'fwReject']) {
    assert.deepEqual(outcome({ scenario: sc, ttl: 1 }), ['R1', 'ttl', 'ttl', '192.168.1.1'], sc);
    const r = run({ scenario: sc, ttl: 1 });
    assert.ok(r.every((s) => !s.pkt || (s.pkt.from !== 'R2' && s.pkt.to !== 'R2')), sc + ': nothing reaches R2');
  }
});

test('tie-break: inside a router the route lookup comes before the TTL check (RFC 1812 §5.2.1.2)', () => {
  assert.deepEqual(outcome({ scenario: 'noRoute', ttl: 1 }), ['R1', 'net', 'net', '192.168.1.1']);
  const c = logic.routerChecks(1, 1, logic.SERVER, P({ scenario: 'noRoute' }));
  assert.deepEqual(c.checks.map((x) => x.k + ':' + x.st), ['route:fail', 'ttl:skip', 'arp:skip']);
});

test('tie-break: the filter comes before the TTL check (RFC 1812 §5.2.1.2 step 6 before step 7)', () => {
  assert.deepEqual(outcome({ scenario: 'fwDrop', ttl: 2 }), ['R2', 'drop', 'timeout', null]);
  assert.deepEqual(outcome({ scenario: 'fwReject', ttl: 2 }), ['R2', 'reject', 'prohibited', '10.0.12.2']);
  const c = logic.routerChecks(2, 1, logic.SERVER, P({ scenario: 'fwDrop' }));
  assert.deepEqual(c.checks.map((x) => x.k + ':' + x.st), ['route:ok', 'filter:drop', 'ttl:skip', 'arp:skip']);
});

test('tie-break: the TTL check comes before ARP', () => {
  assert.deepEqual(outcome({ scenario: 'hostDown', ttl: 2 }), ['R2', 'ttl', 'ttl', '10.0.12.2']);
  const c = logic.routerChecks(2, 1, logic.SERVER, P({ scenario: 'hostDown' }));
  assert.deepEqual(c.checks.map((x) => x.k + ':' + x.st), ['route:ok', 'ttl:fail', 'arp:skip']);
});

test('tie-break: TTL 1 → 0 fires; TTL 2 → 1 still forwards (the decrement comes first, then the check)', () => {
  assert.equal(logic.routerChecks(1, 1, logic.SERVER, P()).fired, 'ttl');
  assert.equal(logic.routerChecks(1, 2, logic.SERVER, P()).fired, null);
  // TTL 3 reaches the server with 1 and is answered
  assert.deepEqual(outcome({ ttl: 3 }), ['S', 'echo', 'reply', '192.168.2.50']);
  assert.equal(run({ ttl: 3 }).find((s) => s.decision).decision.ttlIn, 1);
});

// ── rules ──

test('rule 1: the server answers echo request type 8 with echo reply type 0, its own TTL 64, arriving 62', () => {
  const r = run({});
  assert.equal(r[1].pkt.type, 8);
  const d = r.find((s) => s.decision);
  assert.equal(d.decision.node, 'S');
  assert.deepEqual([d.answer.type, d.answer.code, d.answer.src, d.answer.dst, d.answer.ttl], [0, 0, '192.168.2.50', '192.168.1.10', 64]);
  // the reply's TTL is its own: the same 62 for a request sent with 64 or with 3
  assert.equal(end({}).result.ttl, 62);
  assert.equal(end({ ttl: 3 }).result.ttl, 62);
  assert.equal(end({}).result.time, 6);
});

test('rule 2: no route at R1 → 3/0 from R1\'s interface towards the PC', () => {
  const d = run({ scenario: 'noRoute' }).find((s) => s.decision);
  assert.deepEqual([d.decision.node, d.answer.type, d.answer.code, d.answer.src], ['R1', 3, 0, '192.168.1.1']);
  assert.equal(logic.lookup('R1', logic.SERVER, P({ scenario: 'noRoute' })), null);
  assert.equal(logic.lookup('R1', logic.SERVER, P()).via, '10.0.12.2');
});

test('rule 3: R2 has the route but the server does not answer ARP → 3 tries 1 s apart, then 3/1', () => {
  const r = run({ scenario: 'hostDown' });
  const arp = r.find((s) => s.arp).arp;
  assert.deepEqual([arp.node, arp.ip, arp.tries], ['R2', '192.168.2.50', [2.5, 1002.5, 2002.5]]);
  const d = r.find((s) => s.decision);
  assert.deepEqual([d.decision.node, d.answer.type, d.answer.code, d.t], ['R2', 3, 1, 3002.5]);
  assert.equal(end({ scenario: 'hostDown' }).result.time, 3005);
  // with the server up R2's ARP succeeds and nothing fires
  assert.equal(logic.routerChecks(2, 64, logic.SERVER, P()).fired, null);
});

test('rule 4: TTL reaching 0 at a router → it drops and returns 11/0 from its interface towards the PC', () => {
  const d1 = run({ ttl: 1 }).find((s) => s.decision);
  assert.deepEqual([d1.decision.node, d1.answer.type, d1.answer.code, d1.answer.src], ['R1', 11, 0, '192.168.1.1']);
  const d2 = run({ ttl: 2 }).find((s) => s.decision);
  assert.deepEqual([d2.decision.node, d2.answer.type, d2.answer.code, d2.answer.src], ['R2', 11, 0, '10.0.12.2']);
  // an ICMP error starts at 64 and R1 takes one on the way back
  assert.equal(end({ ttl: 2 }).result.ttl, 63);
});

test('rule 5: a filter that rejects sends 3/13; one that drops sends nothing', () => {
  const rej = run({ scenario: 'fwReject' }).find((s) => s.decision);
  assert.deepEqual([rej.decision.node, rej.answer.type, rej.answer.code, rej.answer.src], ['R2', 3, 13, '10.0.12.2']);
  const r = run({ scenario: 'fwDrop' });
  const drop = r.find((s) => s.decision);
  assert.equal(drop.answer, null);
  assert.ok(r.slice(r.indexOf(drop)).every((s) => s.pkt === null), 'nothing on the wire after the drop');
});

test('rule 6: silence → the timer runs to 4 s and prints "Request timed out" (Windows); no line on Linux', () => {
  const r = run({ scenario: 'fwDrop' });
  assert.deepEqual(r.slice(1).map((s) => s.ev), ['hop', 'hop', 'decide', 'wait', 'print']);
  assert.equal(r[4].t, 2000, 'the timer is running');
  assert.equal(r[5].t, 4000);
  assert.equal(r[3].result, null, 'nothing printed before the timer runs out');
  assert.deepEqual(r[5].result, { kind: 'timeout' });
  assert.equal(logic.lineFor(r[5].result, 'win', 1), 'Request timed out.');
  assert.equal(logic.lineFor(r[5].result, 'linux', 1), null);
  assert.deepEqual(logic.tally(r[5].result, 'win'), { sent: 4, received: 0, lost: 4, loss: 100, errors: 0 });
});

test('rule 7: a local target that does not answer ARP: no packet leaves, the PC reports from its own address', () => {
  const r = run({ scenario: 'local' });
  assert.equal(end({ scenario: 'local' }).target, '192.168.1.77');
  assert.ok(r.every((s) => s.pkt === null), 'no IP packet on the wire');
  const arp = r.find((s) => s.arp).arp;
  assert.deepEqual([arp.node, arp.ip, arp.tries, arp.local], ['PC', '192.168.1.77', [0, 1000, 2000], { net: '192.168.1.0', own: '192.168.1.0' }]);
  const res = end({ scenario: 'local' }).result;
  assert.deepEqual([res.kind, res.from], ['host', '192.168.1.10']);
  assert.equal(logic.lineFor(res, 'win', 1), 'Reply from 192.168.1.10: Destination host unreachable.');
  assert.equal(logic.lineFor(res, 'linux', 1), 'From 192.168.1.10 icmp_seq=1 Destination Host Unreachable');
  // edge: Windows counts the line as received, so 0 % loss; Linux counts it as an error, 100 % loss
  assert.deepEqual(logic.tally(res, 'win'), { sent: 4, received: 4, lost: 0, loss: 0, errors: 0 });
  assert.deepEqual(logic.tally(res, 'linux'), { sent: 4, received: 0, lost: 4, loss: 100, errors: 4 });
  // the same network test as URM ch08 Primjer 2: .77 is local, 192.168.2.50 is not
  assert.equal(logic.netOf('192.168.2.50', 24), '192.168.2.0');
});

test('the TTL decreases by one per router, on the way out and on the way back', () => {
  const ttls = run({ ttl: 10 }).filter((s) => s.ev === 'hop').map((s) => s.pkt.from + '>' + s.pkt.to + ':' + s.pkt.ttl);
  assert.deepEqual(ttls, ['PC>R1:10', 'R1>R2:9', 'R2>S:8', 'S>R2:64', 'R2>R1:63', 'R1>PC:62']);
});

test('the console is printed only when the answer reaches the PC', () => {
  for (const [id, over] of Object.entries(PRESETS)) {
    const r = run(over);
    const first = r.findIndex((s) => s.result);
    assert.equal(first, r.length - 1, id + ': printed in the last step');
    if (over.scenario !== 'fwDrop' && over.scenario !== 'local') assert.equal(r[first].at, 'PC');
  }
});

test('the console lines and summaries (SPEC.md "Console")', () => {
  const ok = logic.consoleOf(end({}).result, 'win', '192.168.2.50');
  assert.equal(ok.head, 'Pinging 192.168.2.50 with 32 bytes of data:');
  assert.equal(ok.lines[0], 'Reply from 192.168.2.50: bytes=32 time=6ms TTL=62');
  assert.equal(ok.lines.length, 4);
  assert.equal(ok.summary[1], '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),');
  assert.equal(logic.lineFor(end({ scenario: 'noRoute' }).result, 'win', 1), 'Reply from 192.168.1.1: Destination net unreachable.');
  assert.equal(logic.lineFor(end({ scenario: 'hostDown' }).result, 'win', 1), 'Reply from 10.0.12.2: Destination host unreachable.');
  assert.equal(logic.lineFor(end({ ttl: 1 }).result, 'win', 1), 'Reply from 192.168.1.1: TTL expired in transit.');
  assert.equal(logic.lineFor(end({ scenario: 'fwReject' }).result, 'linux', 2), 'From 10.0.12.2 icmp_seq=2 Packet filtered');
  assert.equal(logic.lineFor(end({ ttl: 1 }).result, 'linux', 1), 'From 192.168.1.1 icmp_seq=1 Time to live exceeded');
  const lx = logic.consoleOf(end({ scenario: 'noRoute' }).result, 'linux', '192.168.2.50');
  assert.equal(lx.summary[1], '4 packets transmitted, 0 received, +4 errors, 100% packet loss');
  // Windows: every error "Reply from" counts as received (0 % loss)
  for (const sc of ['noRoute', 'hostDown', 'fwReject']) assert.equal(logic.tally(end({ scenario: sc }).result, 'win').loss, 0, sc);
  assert.equal(logic.tally(end({ ttl: 1 }).result, 'win').loss, 0);
  assert.equal(logic.tally(end({ ttl: 2 }).result, 'win').loss, 0);
  assert.equal(logic.lineFor(end({ scenario: 'fwReject' }).result, 'win', 1), 'Reply from 10.0.12.2: Destination net unreachable.');
  assert.equal(logic.lineFor(end({ scenario: 'noRoute' }).result, 'linux', 1), 'From 192.168.1.1 icmp_seq=1 Destination Net Unreachable');
  assert.equal(logic.lineFor(end({ scenario: 'hostDown' }).result, 'linux', 3), 'From 10.0.12.2 icmp_seq=3 Destination Host Unreachable');
  assert.equal(logic.consoleOf(null, 'win', '192.168.2.50').lines.length, 0);
  assert.equal(logic.consoleOf(null, 'win', '192.168.2.50').head, 'Pinging 192.168.2.50 with 32 bytes of data:');
  assert.equal(logic.consoleOf(null, 'linux', '192.168.2.50').head, 'PING 192.168.2.50 (192.168.2.50) 56(84) bytes of data.');
  assert.deepEqual(ok.summary.slice(2), ['Approximate round trip times in milli-seconds:', '    Minimum = 6ms, Maximum = 6ms, Average = 6ms']);
  const lok = logic.consoleOf(end({}).result, 'linux', '192.168.2.50');
  assert.equal(lok.lines[3], '64 bytes from 192.168.2.50: icmp_seq=4 ttl=62 time=6.00 ms');
  assert.deepEqual(lok.summary.slice(1), ['4 packets transmitted, 4 received, 0% packet loss', 'rtt min/avg/max/mdev = 6.000/6.000/6.000/0.000 ms']);
  const lto = logic.consoleOf(end({ scenario: 'fwDrop' }).result, 'linux', '192.168.2.50');
  assert.deepEqual(lto.lines, [null, null, null, null]);
  assert.deepEqual(lto.summary, ['--- 192.168.2.50 ping statistics ---', '4 packets transmitted, 0 received, 100% packet loss']);
  assert.equal(logic.consoleOf(end({ scenario: 'fwDrop' }).result, 'win', '192.168.2.50').summary.length, 2, 'no round trip line without a reply');
});

test('forwarding routers: the hop that leaves a router carries its checks, on the way out and back', () => {
  const hops = run({ ttl: 10 }).filter((s) => s.ev === 'hop');
  assert.deepEqual(hops.map((s) => s.fwd && s.fwd.node), [null, 'R1', 'R2', null, 'R2', 'R1']);
  const out = hops[1].fwd.checks.map((x) => [x.k, x.st, x.via || x.ip || null, x.a == null ? null : x.a + '>' + x.b]);
  assert.deepEqual(out, [['route', 'ok', '10.0.12.2', null], ['ttl', 'ok', null, '10>9'], ['arp', 'ok', '10.0.12.2', null]]);
  const back = hops[4].fwd.checks.map((x) => [x.k, x.st, x.via || x.ip || null, x.a == null ? null : x.a + '>' + x.b]);
  assert.deepEqual(back, [['route', 'ok', '10.0.12.1', null], ['ttl', 'ok', null, '64>63'], ['arp', 'ok', '10.0.12.1', null]]);
  assert.equal(hops[5].fwd.checks[2].ip, '192.168.1.10', 'R1 delivers to the PC directly');
  assert.deepEqual(end({ scenario: 'noRoute' }).dropped, { node: 'R1', rule: 'net' });
});

test('presets: step counts from the task (7, 3, 6, 5, 5, 3) and 2 for the added local-down', () => {
  const want = { 'echo-ok': 7, 'no-route': 3, 'host-down': 6, 'firewall-drop': 5, 'firewall-reject': 5, 'ttl-low': 3, 'local-down': 2 };
  for (const [id, over] of Object.entries(PRESETS)) assert.equal(logic.steps(P(over)), want[id], id);
  // the os param never changes the run
  for (const over of Object.values(PRESETS)) assert.deepEqual(logic.plan(P(over)), logic.plan(P(Object.assign({}, over, { os: 'linux' }))));
  // at most 7 for any params, at most 20 (contract)
  for (const scenario of logic.SCENARIOS) for (let ttl = 1; ttl <= 64; ttl++) assert.ok(logic.steps(P({ scenario, ttl })) <= 7);
});

test('the clock: arrival times of every answer (SPEC.md "Clock")', () => {
  assert.equal(end({ scenario: 'noRoute' }).result.time, 1);
  assert.equal(end({ ttl: 1 }).result.time, 1);
  assert.equal(end({ ttl: 2 }).result.time, 5);
  assert.equal(end({ scenario: 'fwReject' }).result.time, 5);
  assert.equal(end({ scenario: 'local' }).t, 3000);
});

test('params out of range are clamped; an unknown scenario is ok', () => {
  assert.equal(at({ ttl: 0 }, 0).ttl, 1);
  assert.equal(at({ ttl: 99 }, 0).ttl, 64);
  assert.equal(at({ scenario: 'nope' }, 0).scenario, 'ok');
  assert.equal(logic.initial({ scenario: 'ok' }).ttl, 64, 'a missing ttl is the default, not 1');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of Object.values(PRESETS)) for (const s of run(over)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of [{}, { scenario: 'hostDown', ttl: 5 }, { scenario: 'fwDrop' }]) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scenario: 'hostDown' });
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
  const ids = [...html.matchAll(/\{ id: '([a-z-]+)', label:/g)].map((m) => m[1]);
  assert.deepEqual(ids, Object.keys(PRESETS));
});
