// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for static-default-route's model (rules: SPEC.md). Run: node --test sims/static-default-route/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const OFF = { r1Static: false, r1Default: false, r2Static: false, r2Default: false, r3Default: false, r3Back: false };
const P = (over) => Object.assign({}, logic.defaults, over);
/** Params with only the named routes on. */
const R = (routes, over) => Object.assign({}, logic.defaults, OFF, ...routes.map((k) => ({ [k]: true })), over);
const run = (p) => { const out = []; for (let n = 0; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n)); return out; };
const end = (p) => { const r = run(p); return r[r.length - 1]; };
/** One line per step: event, node, packet kind, TTL on it, the lookup winner's kind. */
const trace = (p) => run(p).slice(1).map((s) => {
  const row = s.lookup && s.lookup.winner >= 0 ? s.tables[s.lookup.node][s.lookup.winner].kind : '-';
  return [s.ev, s.node, s.packet.kind, s.packet.ttl, row].join(' ');
});
const PRESETS = {
  'both-ways': R(['r1Static', 'r2Static']),
  'one-way': R(['r1Static']),
  default: R(['r1Default', 'r2Static']),
  'to-internet': R(['r1Default', 'r2Default', 'r3Default'], { dst: '8.8.8.8' }),
  loop: R(['r1Default', 'r2Static', 'r2Default', 'r3Back'], { dst: '198.51.100.7', ttl: 8 })
};
const LOOP = ['r1Default', 'r2Static', 'r2Default', 'r3Back'];

// ── tie-breaks first ──

test('rule 9: a second entry with the same network and prefix is refused, the first stays', () => {
  const t = [{ net: '0.0.0.0', prefix: 0, key: 'r3Default' }];
  assert.deepEqual(logic.addRoute(t, { net: '0.0.0.0', prefix: 0, key: 'r3Back' }), { ok: false, reason: 'duplicate', clash: 'r3Default' });
  assert.equal(t.length, 1);
  assert.equal(t[0].key, 'r3Default');
  // a different prefix length is a different entry
  assert.deepEqual(logic.addRoute(t, { net: '192.168.2.0', prefix: 24, key: 'x' }), { ok: true });
});

test('rule 9: both default routes on R3 (from a URL): r3Default is installed, r3Back refused and listed', () => {
  const s = kit.stateAt(logic, R(['r3Default', 'r3Back']), 0);
  const defaults = s.tables.R3.filter((r) => r.prefix === 0);
  assert.deepEqual(defaults.map((r) => r.via), [logic.ISP_IP]);
  assert.deepEqual(s.refused, [{ key: 'r3Back', router: 'R3', reason: 'duplicate', clash: 'r3Default' }]);
});

test('rule 9: the control for a clashing route says which route blocks it', () => {
  assert.equal(logic.blockedBy(R(['r3Default']), 'r3Back'), 'r3Default');
  assert.equal(logic.blockedBy(R(['r3Back']), 'r3Default'), 'r3Back');
  assert.equal(logic.blockedBy(R([]), 'r3Back'), false);
  assert.equal(logic.blockedBy(R(['r3Default', 'r3Back']), 'r3Back'), false, 'an entry already on can always be switched off');
  assert.equal(logic.blockedBy(R(['r1Static']), 'r1Default'), false, '/24 and /0 do not clash');
  assert.equal(logic.blockedBy(R(['r2Default']), 'r1Default'), false, 'the same prefix on another router does not clash');
  assert.equal(logic.blockedBy(R(['r3Default']), 'r2Default'), false);
});

test('rule 6 order: route lookup before TTL (no route and TTL 1 gives no-route, not ttl-expired)', () => {
  const t = kit.stateAt(logic, R([]), 0).tables;
  assert.equal(logic.decide(t.R1, { dst: '8.8.8.8', ttl: 1 }).action, 'no-route');
  assert.equal(logic.decide(t.R1, { dst: '192.168.1.10', ttl: 1 }).action, 'ttl-expired');
  assert.deepEqual(logic.decide(t.R1, { dst: '192.168.1.10', ttl: 2 }), { action: 'forward', matches: [0], winner: 0, ttl: 1 });
  // and in a run: the minimum TTL with no route at R1 is still 3/0
  const ev = logic.plan(R([], { ttl: 4 }));
  assert.equal(ev[1].why, 'no-route');
});

test('rule 4: the longest prefix wins regardless of table order; only a duplicate ties, and the earlier wins', () => {
  const rows = [{ net: '0.0.0.0', prefix: 0 }, { net: '192.168.1.0', prefix: 24 }];
  assert.equal(logic.routeLookup(rows, '192.168.1.10').winner, 1);
  assert.equal(logic.routeLookup(rows.slice().reverse(), '192.168.1.10').winner, 0);
  assert.equal(logic.lookup([{ net: 0, prefix: 0 }, { net: 0, prefix: 0 }], 5).winner, 0);
});

// ── rules ──

test('rule 1: connected networks are in every table without any route switched on', () => {
  const s = kit.stateAt(logic, R([]), 0);
  assert.deepEqual(s.tables.R1.map((r) => [r.kind, r.net + '/' + r.prefix, r.iface]), [['C', '192.168.1.0/24', 'Gi0/0'], ['C', '192.168.100.0/30', 'Gi0/1']]);
  assert.deepEqual(s.tables.R2.map((r) => r.net + '/' + r.prefix), ['192.168.2.0/24', '192.168.100.0/30', '192.168.100.4/30']);
  assert.deepEqual(s.tables.R3.map((r) => r.net + '/' + r.prefix), ['203.0.113.0/30', '192.168.100.4/30']);
  // R2 delivers to B on its connected network with no entry added
  const ev = logic.plan(R(['r1Static']));
  assert.equal(ev[2].node, 'R2');
  assert.equal(ev[2].arrive, 'B');
  assert.equal(s.tables.R2[ev[2].lookup.winner].kind, 'C');
});

test('rule 2: the tables come from the params only and no step changes them', () => {
  for (const p of Object.values(PRESETS)) {
    const r = run(p);
    for (const s of r) assert.deepEqual(s.tables, r[0].tables);
  }
  const s = kit.stateAt(logic, PRESETS.default, 0);
  assert.deepEqual(s.tables.R1.map((r) => [r.kind, r.net + '/' + r.prefix, r.via, r.iface]).slice(2), [['S*', '0.0.0.0/0', '192.168.100.2', 'Gi0/1']]);
  assert.deepEqual(s.tables.R2.map((r) => [r.kind, r.net + '/' + r.prefix, r.via]).slice(3), [['S', '192.168.1.0/24', '192.168.100.1']]);
});

test('rule 3: the default route matches every address and wins only when nothing longer matches', () => {
  const s = kit.stateAt(logic, PRESETS.default, 0);
  const def = s.tables.R1.findIndex((r) => r.prefix === 0);
  for (const ip of ['192.168.2.20', '8.8.8.8', '198.51.100.7', '192.168.1.10', '0.0.0.0', '255.255.255.255']) {
    assert.ok(logic.routeLookup(s.tables.R1, ip).matches.includes(def), ip);
  }
  assert.equal(logic.routeLookup(s.tables.R1, '192.168.2.20').winner, def);
  // Primjer 3c: traffic for 192.168.1.0/24 still leaves on Gi0/0, the /24 beats the /0
  const back = logic.routeLookup(s.tables.R1, '192.168.1.10');
  assert.deepEqual(back.matches, [0, def]);
  assert.equal(s.tables.R1[back.winner].iface, 'Gi0/0');
});

test('preset default (Primjer 3c): same result as both-ways; R1 uses 0/0 out and /24 back', () => {
  assert.deepEqual(trace(PRESETS.default), [
    'send A echo 64 -', 'forward R1 echo 63 S*', 'forward R2 echo 62 C',
    'send B reply 64 -', 'forward R2 reply 63 S', 'forward R1 reply 62 C']);
  assert.deepEqual(end(PRESETS.default).seen, { kind: 'reply', ttl: 62 });
  assert.deepEqual(end(PRESETS.default).seen, end(PRESETS['both-ways']).seen);
  const last = end(PRESETS.default);
  assert.deepEqual(last.lookup.matches.length, 2, 'the default route matched too and lost');
});

test('preset both-ways (Primjer 3a): request A→R1→R2→B, reply B→R2→R1→A, 6 steps, TTL 62 at both ends', () => {
  assert.equal(logic.steps(PRESETS['both-ways']), 6);
  assert.deepEqual(trace(PRESETS['both-ways']), [
    'send A echo 64 -', 'forward R1 echo 63 S', 'forward R2 echo 62 C',
    'send B reply 64 -', 'forward R2 reply 63 S', 'forward R1 reply 62 C']);
  const r = run(PRESETS['both-ways']);
  assert.equal(r[3].arrive, 'B');
  assert.equal(r[3].outcome, 'delivered');
  assert.equal(r[6].arrive, 'A');
  assert.deepEqual(r[6].seen, { kind: 'reply', ttl: 62 });
});

test('rule 5 + 7 (Primjer 3b, one-way): the request arrives, R2 drops the reply, 3/0 goes to B, A sees silence', () => {
  assert.equal(logic.steps(PRESETS['one-way']), 6);
  const r = run(PRESETS['one-way']);
  assert.equal(r[3].arrive, 'B');
  assert.equal(r[5].ev, 'drop');
  assert.equal(r[5].node, 'R2');
  assert.equal(r[5].outcome, 'no-route');
  assert.equal(r[5].packet.kind, 'reply');
  assert.equal(r[5].lookup.winner, -1);
  assert.deepEqual(r[5].icmp, { type: 3, code: 0, src: '192.168.2.1', dst: '192.168.2.20' });
  assert.equal(r[5].ttlIn, 64, 'a no-route drop keeps the TTL it came with');
  assert.equal(r[5].from, 'B');
  assert.deepEqual(r[5].path[r[5].path.length - 1], { node: 'R2', ttl: 64, dropped: true });
  assert.equal(r[6].ev, 'send');
  assert.equal(r[6].packet.kind, 'icmp');
  assert.equal(r[6].arrive, 'B');
  assert.deepEqual(r[6].seen, { kind: 'silence' });
});

test('rule 5: no route at R1 for a ping to B: 3/0 from R1\'s interface towards A, 3 steps', () => {
  const p = R([]);
  assert.equal(logic.steps(p), 3);
  assert.deepEqual(end(p).seen, { kind: 'icmp', type: 3, code: 0, src: '192.168.1.1' });
});

test('rule 5: the ICMP source is the interface the error leaves on (R2 → A: 192.168.100.2)', () => {
  const p = R(['r1Default', 'r2Static'], { dst: '8.8.8.8' });
  assert.equal(logic.steps(p), 5);
  assert.deepEqual(end(p).seen, { kind: 'icmp', type: 3, code: 0, src: '192.168.100.2' });
});

test('preset to-internet: each router by its default route, the ISP takes it on, 5 steps', () => {
  assert.deepEqual(trace(PRESETS['to-internet']), [
    'send A echo 64 -', 'forward R1 echo 63 S*', 'forward R2 echo 62 S*', 'forward R3 echo 61 S*', 'out ISP echo 61 -']);
  const e = end(PRESETS['to-internet']);
  assert.equal(e.from, 'R3');
  assert.equal(e.at, 'ISP');
  assert.equal(e.outcome, 'left');
  assert.equal(e.lost, false);
  assert.deepEqual(e.seen, { kind: 'left' });
});

test('rule 6 (preset loop): R1 8→7, R2, R3, R2, R3, R2, R3, R2 1→0 drops, 11/0 back to A: 11 steps', () => {
  const p = PRESETS.loop;
  assert.equal(logic.steps(p), 11);
  const r = run(p).slice(1);
  const handled = r.filter((s) => s.packet.kind === 'echo' && s.ev !== 'send');
  assert.deepEqual(handled.map((s) => s.node), ['R1', 'R2', 'R3', 'R2', 'R3', 'R2', 'R3', 'R2']);
  assert.deepEqual(handled.map((s) => [s.ttlIn, s.packet.ttl]), [[8, 7], [7, 6], [6, 5], [5, 4], [4, 3], [3, 2], [2, 1], [1, 0]]);
  assert.equal(r[8].ev, 'drop');
  assert.equal(r[8].outcome, 'ttl-expired');
  assert.equal(r[8].lookup.winner >= 0, true, 'the route was found; the TTL killed it');
  assert.deepEqual(r[8].icmp, { type: 11, code: 0, src: '192.168.100.2', dst: '192.168.1.10' });
  assert.equal(r[8].visit, 4, 'R2 handles it for the fourth time');
  assert.deepEqual(r[10].seen, { kind: 'icmp', type: 11, code: 0, src: '192.168.100.2' });
  assert.equal(r[10].packet.ttl, 7, 'the error starts at the same initial TTL, R1 takes one');
  // the send step of the error carries R2's lookup for its destination: r2Static wins over the default route
  const back = r[9].lookup;
  assert.equal(back.node, 'R2');
  assert.deepEqual([r[9].tables.R2[back.winner].kind, back.matches.length], ['S', 2]);
  assert.deepEqual(r[8].icmp, r[9].icmp, 'the error stays on show after the drop');
  assert.equal(r[9].at, 'R1');
  assert.equal(r[10].at, 'A');
});

test('rule 6: the TTL sets the loop\'s length: TTL 4 gives 7 steps, TTL 64 runs to 67 and still ends', () => {
  assert.equal(logic.steps(R(LOOP, { dst: '198.51.100.7', ttl: 4 })), 7);
  const p = R(LOOP, { dst: '198.51.100.7', ttl: 64 });
  assert.equal(logic.steps(p), 67);
  assert.equal(logic.plan(p).filter((e) => e.pkt.kind === 'echo' && e.ev !== 'send').length, 64);
});

test('rule 6: a host does not decrement; a router decrements once per pass, also on the way back', () => {
  const r = run(PRESETS['both-ways']);
  assert.equal(r[1].packet.ttl, 64);
  assert.deepEqual([r[2].ttlIn, r[2].packet.ttl], [64, 63]);
  assert.deepEqual([r[5].ttlIn, r[5].packet.ttl], [64, 63]);
});

test('the initial TTL is every sender\'s: B\'s reply and a router\'s error start at the set TTL, not 64', () => {
  assert.deepEqual(end(R(['r1Static', 'r2Static'], { ttl: 10 })).seen, { kind: 'reply', ttl: 8 });
  const one = run(R(['r1Static'], { ttl: 10 }));
  assert.equal(one[4].packet.ttl, 10, 'B\'s reply leaves with 10');
  assert.equal(one[6].packet.ttl, 10, 'R2\'s 3/0 leaves with 10');
});

test('rule 8: an ICMP error caught in the loop dies there without a new error (18 steps, A sees silence)', () => {
  const p = R(['r1Default', 'r2Default', 'r3Back'], { dst: '198.51.100.7', ttl: 8 });
  const ev = logic.plan(p);
  assert.equal(ev.length, 18);
  const drops = ev.filter((e) => e.ev === 'drop');
  assert.equal(drops.length, 2);
  assert.equal(drops[0].error.src, '192.168.100.5', 'R2 sends it out towards R3: its default route');
  assert.equal(drops[1].pkt.kind, 'icmp');
  assert.equal(drops[1].error, null);
  assert.equal(drops[1].noError, 'about-icmp');
  assert.equal(ev.filter((e) => e.pkt.kind === 'icmp' && e.ev === 'send').length, 1);
  assert.deepEqual(logic.aSees(ev), { kind: 'silence' });
});

test('rule 8: no route back to the source: the error is not sent', () => {
  // only r1Static: R1 has no route to 8.8.8.8 — but 3/0 to A is fine (connected). Make R2 lack the way back instead:
  // r1Default only, ping 8.8.8.8: R2 has no route to 8.8.8.8 and none to 192.168.1.10 either.
  const ev = logic.plan(R(['r1Default'], { dst: '8.8.8.8' }));
  assert.equal(ev.length, 3);
  assert.equal(ev[2].ev, 'drop');
  assert.equal(ev[2].noError, 'no-route-to-source');
  assert.equal(ev[2].error, null);
  assert.deepEqual(logic.aSees(ev), { kind: 'silence' });
});

test('rule 7: a default route on R2 hides the missing way back: the reply leaves at the ISP and is lost', () => {
  const p = R(['r1Static', 'r2Default', 'r3Default']);
  assert.deepEqual(trace(p).slice(3), ['send B reply 64 -', 'forward R2 reply 63 S*', 'forward R3 reply 62 S*', 'out ISP reply 62 -']);
  const e = end(p);
  assert.equal(e.lost, true);
  assert.deepEqual(e.seen, { kind: 'silence' });
});

test('hosts: A sends to its gateway for another network; the path lists every node with the TTL it left with', () => {
  assert.deepEqual(logic.hostHop('A', '192.168.2.20'), { own: false, net: '192.168.1.0/24', gw: '192.168.1.1', next: 'R1' });
  assert.deepEqual(logic.hostHop('B', '192.168.1.10'), { own: false, net: '192.168.2.0/24', gw: '192.168.2.1', next: 'R2' });
  assert.deepEqual(end(PRESETS['both-ways']).path, [{ node: 'B', ttl: 64 }, { node: 'R2', ttl: 63 }, { node: 'R1', ttl: 62 }, { node: 'A', ttl: 62 }]);
});

test('what A sees and done are set only at the last step; sent lists every packet of the run', () => {
  for (const p of Object.values(PRESETS)) {
    const r = run(p);
    r.slice(0, -1).forEach((s) => { assert.equal(s.seen, null); assert.equal(s.done, false); });
    assert.equal(r[r.length - 1].done, true);
    assert.notEqual(r[r.length - 1].seen, null);
  }
  assert.deepEqual(end(PRESETS['one-way']).sent.map((x) => [x.kind, x.from]), [['echo', 'A'], ['reply', 'B'], ['icmp', 'R2']]);
  assert.equal(logic.steps(R(['r1Default', 'r2Default', 'r3Back'], { dst: '8.8.8.8', ttl: 64 })), 130, 'the longest free play');
});

test('params: unknown dst and out-of-range TTL are normalised; every preset stays at or under 20 steps', () => {
  assert.equal(logic.norm({ dst: 'x', ttl: 2 }).dst, 'B');
  assert.equal(logic.norm({ ttl: 2 }).ttl, 4);
  assert.equal(logic.norm({ ttl: 900 }).ttl, 64);
  assert.equal(logic.norm({ ttl: 'x' }).ttl, 64);
  assert.deepEqual(Object.values(PRESETS).map((p) => logic.steps(p)), [6, 6, 6, 5, 11]);
  assert.equal(logic.steps(logic.defaults), 6);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of Object.values(PRESETS)) for (const s of run(p)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of [P({}), PRESETS.loop, R(['r1Default', 'r2Default', 'r3Back'], { dst: '198.51.100.7', ttl: 5 })]) {
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = PRESETS['one-way'];
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
