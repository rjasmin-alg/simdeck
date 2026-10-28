// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for traceroute's model (rules: SPEC.md). Run: node --test sims/traceroute/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const run = (p) => { const out = []; for (let n = 0; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n)); return out; };
const end = (p) => { const r = run(p); return r[r.length - 1]; };
const printed = (p) => { const s = end(p); return s.lines.map((l) => logic.formatLine(l, s.tool)); };
const PRESETS = {
  basic: P({}),
  stars: P({ routers: 11, silent: 'R9' }),
  tools: P({ tool: 'traceroute' }),
  filtered: P({ destFilter: true, maxHops: 8 })
};
const ADDR = ['192.168.1.1', '10.0.1.2', '10.0.2.2', '10.0.3.2', '10.0.4.2'];

// ── tie-breaks first ──

test('rule 5 tie-break: max hops equal to the destination hop still ends with the reply', () => {
  const s = end(P({ maxHops: 6 }));
  assert.equal(logic.steps(P({ maxHops: 6 })), 6);
  assert.equal(s.end, 'reply');
  assert.equal(s.round.reply, 'echo-reply');
});

test('rule 5 tie-break: max hops below the destination hop ends at a router, not at S', () => {
  const p = P({ routers: 11, maxHops: 4 });
  assert.equal(logic.steps(p), 4);
  const s = end(p);
  assert.equal(s.end, 'max-hops');
  assert.equal(s.round.at, 'R4');
  assert.equal(s.round.reply, 'time-exceeded', 'the last router still answers');
});

test('rule 6 tie-break: silence at hop k never changes lines k + 1 … (address and times)', () => {
  for (let k = 1; k <= 11; k++) {
    const loud = end(P({ routers: 11 })).lines, quiet = end(P({ routers: 11, silent: 'R' + k })).lines;
    assert.equal(quiet.length, loud.length, 'same number of lines with R' + k + ' silent');
    quiet.forEach((l, i) => {
      if (i === k - 1) assert.deepEqual(l, { ttl: k, addr: null, rtts: null }, 'line ' + k + ' is * * *');
      else assert.deepEqual(l, loud[i], 'line ' + (i + 1) + ' unchanged with R' + k + ' silent');
    });
  }
});

test('rule 6 tie-break: a silent router not on the chain changes nothing and is reported', () => {
  const p = P({ silent: 'R9' });
  assert.deepEqual(end(p).lines, end(P({})).lines);
  assert.equal(logic.initial(p).silentOff, 'R9');
  assert.deepEqual(logic.initial(p).silent, []);
  assert.equal(logic.initial(P({ silent: 'R5' })).silentOff, null);
  assert.deepEqual(logic.initial(P({ silent: 'R5' })).silent, ['R5']);
});

test('rule 7 tie-break: filtering at S with a silent router: both hops are stars, the rest unchanged', () => {
  const s = end(P({ silent: 'R2', destFilter: true, maxHops: 7 }));
  assert.deepEqual(s.lines.map((l) => l.addr), [ADDR[0], null, ADDR[2], ADDR[3], ADDR[4], null, null]);
  assert.equal(s.end, 'max-hops');
});

test('rule 6 tie-break: the boundary: Rn silent is on the path (stars on line n, reply on n + 1), R(n + 1) is off it', () => {
  const on = end(P({ silent: 'R5' }));
  assert.deepEqual(on.silent, ['R5']);
  assert.equal(on.lines[4].addr, null);
  assert.equal(on.lines[5].addr, logic.DST);
  assert.equal(on.end, 'reply');
  const off = logic.initial(P({ silent: 'R6' }));
  assert.deepEqual(off.silent, []);
  assert.equal(off.silentOff, 'R6');
  assert.deepEqual(end(P({ silent: 'R6' })).lines, end(P({})).lines);
});

test('rule 5/7 tie-break: filter on with max hops below n + 1 ends at a router that answers; equal to n + 1 ends at S, filtered', () => {
  const below = end(P({ destFilter: true, maxHops: 4 }));
  assert.deepEqual([below.round.at, below.round.why, below.end], ['R4', 'ttl', 'max-hops']);
  const equal = end(P({ destFilter: true, maxHops: 6 }));
  assert.deepEqual([equal.round.at, equal.round.why, equal.end], ['S', 'filtered', 'max-hops']);
});

// ── rules ──

test('every probe of a round: where it stops, its reply and its own RTT', () => {
  const dest = logic.round(6, P({}));
  dest.probes.forEach((x, j) => assert.deepEqual([x.at, x.reply, x.rtt], ['S', 'echo-reply', logic.rtts(6, 5)[j]]));
  const te = logic.round(4, P({}));
  te.probes.forEach((x, j) => assert.deepEqual([x.at, x.reply, x.rtt], ['R4', 'time-exceeded', logic.rtts(4, 5)[j]]));
  for (const r of [logic.round(9, PRESETS.stars), logic.round(7, PRESETS.filtered)]) {
    r.probes.forEach((x) => { assert.equal(x.reply, null); assert.equal(x.rtt, null); });
    assert.equal(r.rtts, null);
  }
  logic.round(7, PRESETS.filtered).probes.forEach((x) => assert.equal(x.at, 'S'));
});

test('rule 1: every router takes 1 off; probe k crosses link i with TTL k − i + 1 and arrives at Rk with 1', () => {
  assert.deepEqual(logic.ttlOnLinks(3, 5), [3, 2, 1]);
  assert.deepEqual(logic.ttlOnLinks(1, 5), [1]);
  for (let k = 1; k <= 5; k++) {
    const r = logic.round(k, P({}));
    assert.equal(r.at, 'R' + k);
    assert.equal(r.ttlIn, 1, 'TTL 1 on arrival at R' + k);
    assert.equal(r.links.length, k);
    r.links.forEach((ttl, i) => assert.equal(ttl, k - i));
  }
});

test('rule 1: a host does not decrement: probes past Rn reach S with TTL k − n', () => {
  assert.deepEqual(logic.ttlOnLinks(6, 5), [6, 5, 4, 3, 2, 1]);
  const r = logic.round(8, P({ destFilter: true, maxHops: 8 }));
  assert.equal(r.at, 'S');
  assert.equal(r.hop, 6);
  assert.equal(r.ttlIn, 3);
  assert.deepEqual(r.links, [8, 7, 6, 5, 4, 3]);
});

test('rule 1: the router where TTL reaches 0 answers with Time Exceeded', () => {
  const r = logic.round(3, P({}));
  assert.equal(r.reply, 'time-exceeded');
  assert.equal(r.why, 'ttl');
  r.probes.forEach((x) => { assert.equal(x.at, 'R3'); assert.equal(x.reply, 'time-exceeded'); });
});

test('rule 2: line k names hop k: the address Rk answers from', () => {
  const s = end(P({ routers: 11 }));
  for (let k = 1; k <= 11; k++) {
    assert.equal(s.lines[k - 1].addr, logic.routerAddr(k));
    assert.equal(s.lines[k - 1].ttl, k);
  }
  assert.deepEqual(s.lines.slice(0, 5).map((l) => l.addr), ADDR);
  assert.equal(s.lines[11].addr, logic.DST);
});

test('rule 3: ICMP echo probes are answered by an echo reply from the destination; sequence numbers count up', () => {
  const r = logic.round(6, P({}));
  assert.equal(r.at, 'S');
  assert.equal(r.reply, 'echo-reply');
  assert.equal(r.from, logic.DST);
  assert.deepEqual(r.probes.map((x) => [x.kind, x.seq]), [['echo', 16], ['echo', 17], ['echo', 18]]);
  assert.equal(r.probes[0].port, undefined);
});

test('rule 4: UDP probes are answered by port unreachable; ports 33434 + 1 per probe', () => {
  const p = PRESETS.tools;
  assert.equal(logic.round(6, p).reply, 'port-unreachable');
  assert.deepEqual(logic.round(1, p).probes.map((x) => [x.kind, x.port]), [['udp', 33434], ['udp', 33435], ['udp', 33436]]);
  assert.deepEqual(logic.round(6, p).probes.map((x) => x.port), [33449, 33450, 33451]);
  assert.equal(logic.round(2, p).reply, 'time-exceeded', 'routers answer UDP probes the same way');
});

test('rule 5: three probes per round, TTL 1, 2, 3 …; stops at the reply; max hops 30 by default', () => {
  assert.equal(logic.defaults.maxHops, 30);
  const r = run(P({}));
  assert.equal(r.length - 1, 6);
  r.slice(1).forEach((s, i) => {
    assert.equal(s.round.ttl, i + 1);
    assert.equal(s.round.probes.length, 3);
    s.round.probes.forEach((x) => assert.equal(x.ttl, i + 1));
    assert.equal(s.lines.length, i + 1);
    assert.equal(s.done, i === 5);
  });
  assert.equal(r[6].end, 'reply');
  assert.equal(r[5].end, null);
});

test('rule 6: a silent router: its probe still dies there, no reply, the next probes pass it', () => {
  const p = PRESETS.stars;
  const r9 = logic.round(9, p);
  assert.equal(r9.at, 'R9');
  assert.equal(r9.ttlIn, 1);
  assert.equal(r9.reply, null);
  assert.equal(r9.why, 'silent');
  assert.equal(r9.from, null);
  const r10 = logic.round(10, p);
  assert.equal(r10.links[8], 2, 'probe 10 crosses into R9 with TTL 2 and passes');
  assert.equal(r10.at, 'R10');
  assert.equal(r10.reply, 'time-exceeded');
});

test('rule 7: a filtering destination prints stars to max hops and never completes', () => {
  const s = end(PRESETS.filtered);
  assert.equal(s.lines.length, 8);
  assert.deepEqual(s.lines.slice(5).map((l) => l.addr), [null, null, null]);
  assert.equal(s.end, 'max-hops');
  assert.equal(s.filteredAtDest, true);
  [6, 7, 8].forEach((k) => assert.equal(logic.round(k, PRESETS.filtered).why, 'filtered'));
  assert.equal(logic.steps(P({ destFilter: true })), 30, 'up to max hops');
});

test('rule 8: RTT = 2 × one-way delay + reply delay + jitter (µs), and need not grow', () => {
  assert.deepEqual(logic.rtts(1, 5), [700, 741, 717]);
  assert.deepEqual(logic.rtts(4, 5), [54447, 54435, 54458]);
  assert.deepEqual(logic.rtts(5, 5), [49821, 49800, 49841]);
  assert.deepEqual(logic.rtts(6, 5), [50117, 50163, 50108]);
  assert.ok(logic.rtts(5, 5)[0] < logic.rtts(4, 5)[0], 'hop 5 answers faster than hop 4');
  assert.deepEqual(logic.rtts(12, 11), [79174, 79112, 79147]);
});

// ── printing and presets (SPEC.md expected numbers) ──

test('printing: ICMP echo style, whole ms half up, <1 under a millisecond, stars without an address', () => {
  assert.equal(logic.msWhole(999), '<1');
  assert.equal(logic.msWhole(1000), '1');
  assert.equal(logic.msWhole(1499), '1');
  assert.equal(logic.msWhole(1500), '2');
  assert.equal(logic.msFine(700), '0.700');
  assert.equal(logic.msFine(54007), '54.007');
  assert.equal(logic.msFine(50063), '50.063');
  assert.equal(logic.formatLine({ ttl: 1, addr: '192.168.1.1', rtts: [700, 741, 717] }, 'tracert'), '  1    <1 ms    <1 ms    <1 ms  192.168.1.1');
  assert.equal(logic.formatLine({ ttl: 9, addr: null, rtts: null }, 'tracert'), '  9     *        *        *   ');
  assert.equal(logic.formatLine({ ttl: 9, addr: null, rtts: null }, 'traceroute'), ' 9  * * *');
});

test('preset basic: 6 lines, hop 4 slower than hop 5, echo reply', () => {
  assert.deepEqual(printed(PRESETS.basic), [
    '  1    <1 ms    <1 ms    <1 ms  192.168.1.1',
    '  2     4 ms     4 ms     4 ms  10.0.1.2',
    '  3    10 ms    10 ms    10 ms  10.0.2.2',
    '  4    54 ms    54 ms    54 ms  10.0.3.2',
    '  5    50 ms    50 ms    50 ms  10.0.4.2',
    '  6    50 ms    50 ms    50 ms  192.0.2.20'
  ]);
  assert.equal(logic.command(PRESETS.basic), 'tracert -d -h 30 192.0.2.20');
});

test('preset stars (URM ch11 Primjer 5): 12 lines, line 9 stars, 10–12 normal down to the reply', () => {
  assert.equal(logic.steps(PRESETS.stars), 12);
  const out = printed(PRESETS.stars);
  assert.equal(out.length, 12);
  assert.equal(out[8], '  9     *        *        *   ');
  assert.deepEqual(out.slice(9), [
    ' 10    78 ms    78 ms    78 ms  10.0.9.2',
    ' 11    79 ms    79 ms    79 ms  10.0.10.2',
    ' 12    79 ms    79 ms    79 ms  192.0.2.20'
  ]);
  assert.equal(end(PRESETS.stars).end, 'reply');
});

test('preset tools (URM ch11 Primjer 6): same 6 addresses, UDP style, port unreachable', () => {
  const s = end(PRESETS.tools);
  assert.deepEqual(s.lines.map((l) => l.addr), end(PRESETS.basic).lines.map((l) => l.addr));
  assert.equal(printed(PRESETS.tools)[0], ' 1  192.168.1.1  0.700 ms  0.741 ms  0.717 ms');
  assert.equal(printed(PRESETS.tools)[5], ' 6  192.0.2.20  50.117 ms  50.163 ms  50.108 ms');
  assert.equal(s.round.reply, 'port-unreachable');
  assert.equal(logic.command(PRESETS.tools), 'traceroute -n -m 30 192.0.2.20');
});

test('preset filtered: 8 steps, lines 6–8 stars, ends at max hops', () => {
  assert.equal(logic.steps(PRESETS.filtered), 8);
  assert.deepEqual(printed(PRESETS.filtered).slice(5), ['  6     *        *        *   ', '  7     *        *        *   ', '  8     *        *        *   ']);
  assert.equal(logic.command(PRESETS.filtered), 'tracert -d -h 8 192.0.2.20');
});

test('steps per preset: basic 6, stars 12, tools 6, filtered 8; all within 20', () => {
  assert.deepEqual(Object.values(PRESETS).map(logic.steps), [6, 12, 6, 8]);
});

test('params are normalised: bad values fall back, ranges clamp', () => {
  assert.deepEqual(logic.norm({ tool: 'x', routers: 99, silent: 'R12', destFilter: 'true', maxHops: 1 }),
    { tool: 'tracert', routers: 11, silent: 'none', destFilter: true, maxHops: 4 });
  assert.deepEqual(logic.norm({ routers: 'zz', maxHops: 'zz' }).routers, 5);
  assert.equal(logic.norm({ maxHops: 'zz' }).maxHops, 30);
  assert.equal(logic.norm({ destFilter: 'false' }).destFilter, false);
  assert.equal(logic.initial(P({})).dst, '192.0.2.20');
});

test('the chain: A, R1 … Rn, S with the addresses they answer from', () => {
  assert.deepEqual(logic.chain(2).map((x) => [x.id, x.kind, x.addr]),
    [['A', 'host', '192.168.1.10'], ['R1', 'router', '192.168.1.1'], ['R2', 'router', '10.0.1.2'], ['S', 'server', '192.0.2.20']]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const p of Object.values(PRESETS)) run(p).forEach((s) => assert.deepEqual(JSON.parse(JSON.stringify(s)), s));
});

test('replay is deterministic and step back equals replay', () => {
  const p = PRESETS.stars;
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = PRESETS.basic;
  const s1 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('Croatian plural of max hops in the start caption: 1 and 21–24 skoka, 5–20 skokova', () => {
  const hr = strings.hr.hopsN, pick = (n) => hr[kit.pluralIndex('hr', n)].replace('{n}', n);
  assert.deepEqual([4, 5, 21, 22, 25, 30].map(pick), ['4 skoka', '5 skokova', '21 skoka', '22 skoka', '25 skokova', '30 skokova']);
  assert.ok(strings.hr.capStart.includes('{hops}') && strings.en.capStart.includes('{hops}'));
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
