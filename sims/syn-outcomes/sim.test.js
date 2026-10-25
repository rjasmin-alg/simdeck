// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for syn-outcomes' model (rules: SPEC.md). Run: node --test sims/syn-outcomes/
// Tie-breaks first, then rules 1–7 and the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const seq = require('../../kit/sequence.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const PRESETS = {
  'book-three': {},
  'book-capture': { scene: 'book-capture' },
  'behind-firewall': { scene: 'behind-firewall' },
  'drop-vs-reject': { scene: 'drop-vs-reject' },
  'no-host': { scene: 'no-host' }
};
/** Every state of a run, 0 … steps. */
function run(over) {
  const p = P(over);
  const out = [logic.initial(p)];
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) out.push(logic.step(out[i - 1], i, p));
  return out;
}
const last = (over) => run(over).slice(-1)[0];
const verdicts = (over) => last(over).table.map((r) => r.verdict);
const kinds = (over) => last(over).chart.map((e) => e.kind);

// ── tie-breaks ──

test('tie-break (rule 1): two rules for one port, the earlier wins', () => {
  const fw = { rules: [{ port: 22, action: 'allow' }, { port: 22, action: 'block' }], dflt: 'block' };
  assert.deepEqual(logic.fwDecide(fw, 22, 'drop'), { action: 'allow', rule: 0 });
  const fw2 = { rules: [{ port: 22, action: 'block' }, { port: 22, action: 'allow' }], dflt: 'allow' };
  assert.deepEqual(logic.fwDecide(fw2, 22, 'reject-icmp'), { action: 'reject-icmp', rule: 0 });
});

test('tie-break (rule 1): the default policy only when no rule matches', () => {
  const fw = { rules: [{ port: 80, action: 'allow' }], dflt: 'block' };
  assert.deepEqual(logic.fwDecide(fw, 8080, 'drop'), { action: 'drop', rule: 'default' });
  assert.deepEqual(logic.fwDecide(fw, 80, 'drop'), { action: 'allow', rule: 0 });
  assert.deepEqual(logic.fwDecide({ rules: [], dflt: 'allow' }, 22, 'drop'), { action: 'allow', rule: 'default' });
  // book-three: A's 8080 falls to the default
  assert.equal(last({}).probes[2].fwRule, 'default');
});

test('tie-break (rule 7): an RST from a reject-rst firewall is the same packet as the host\'s, and reads closed', () => {
  const s = last({ scene: 'drop-vs-reject' });
  const fwRst = s.chart.filter((e) => e.kind === 'rst')[0];
  const host = last({ scene: 'behind-firewall' }).chart.filter((e) => e.kind === 'rst')[0];
  assert.equal(fwRst.by, 'F');
  assert.equal(host.by, 'S');
  for (const k of ['flags', 'seq', 'ack']) assert.deepEqual(fwRst[k], host[k], k);
  assert.equal(s.table[2].verdict, 'closed');
  assert.equal(s.table[2].proves, 'tcp');
  assert.equal(s.table[2].path, 'fw-rst');
});

test('tie-break (rule 1): a probe\'s own blocking action wins over fwAction', () => {
  for (const a of logic.fwActions) assert.deepEqual(verdicts({ scene: 'drop-vs-reject', fwAction: a }), ['filtered', 'filtered', 'closed']);
});

// ── rules ──

test('rule 1: firewall first: a listening port behind a drop is silent', () => {
  const s = last({ scene: 'behind-firewall' });
  assert.equal(s.table[0].port, 22);
  assert.equal(s.table[0].path, 'fw-drop');
  assert.equal(s.table[0].reply, 'none');
  assert.equal(s.chart[0].fate, 'fw-drop');
  assert.ok(logic.SCENES['behind-firewall'].targets.srv.listening.includes(22));
});

test('rule 1: reject-icmp answers type 3 code 13 from the firewall', () => {
  const s = last({ scene: 'behind-firewall', fwAction: 'reject-icmp' });
  const icmp = s.chart.filter((e) => e.kind === 'icmp');
  assert.equal(icmp.length, 1);
  assert.deepEqual(icmp[0].icmp, { type: 3, code: 13 });
  assert.equal(icmp[0].by, 'F');
  assert.equal(icmp[0].t, 10);
  assert.equal(s.table[0].verdict, 'filtered');
  assert.equal(s.table[0].proves, 'filter');
});

test('rule 1: allowed SYNs reach the host and its reply passes back (stateful)', () => {
  const s = last({ scene: 'behind-firewall' });
  assert.deepEqual(s.table.map((r) => r.path), ['fw-drop', 'synack', 'rst']);
  assert.deepEqual(s.probes.map((q) => q.fwRule), [0, 1, 2]);
});

test('rule 1: firewall off removes every firewall', () => {
  assert.deepEqual(verdicts({ scene: 'behind-firewall', firewall: false }), ['open', 'open', 'closed']);
  assert.deepEqual(verdicts({ firewall: false }), ['open', 'closed', 'open']);
  assert.deepEqual(verdicts({ scene: 'drop-vs-reject', firewall: false }), ['open', 'open', 'open']);
  assert.ok(last({ firewall: false }).probes.every((q) => q.fwRule === null));
});

test('rule 2: no host at the address: silence, like a drop', () => {
  const s = last({ scene: 'no-host' });
  assert.deepEqual(s.table.map((r) => [r.path, r.reply, r.verdict]), [['nohost', 'none', 'filtered'], ['nohost', 'none', 'filtered']]);
  const drop = last({ scene: 'behind-firewall' }).chart.slice(0, 3);
  const none = s.chart.slice(0, 3);
  // the client's view: same messages at the same times
  assert.deepEqual(none.map((e) => [e.kind, e.from, e.to, e.seq, e.t]), drop.map((e) => [e.kind, e.from, e.to, e.seq, e.t]));
  assert.notEqual(none[0].fate, drop[0].fate);
});

test('rule 3: listening → SYN+ACK seq Y ack X+1, then ACK seq X+1 ack Y+1 (URM ch13 Primjer 3)', () => {
  const c = last({}).chart.slice(0, 3);
  assert.deepEqual(c.map((e) => [e.kind, e.flags.join('+'), e.seq, e.ack]),
    [['syn', 'SYN', 4000, null], ['synack', 'SYN+ACK', 9500, 4001], ['ack', 'ACK', 4001, 9501]]);
});

test('rule 3: half-open answers the SYN+ACK with RST and the same verdict', () => {
  const s = last({ scan: 'half-open' });
  assert.deepEqual(s.chart[2].flags, ['RST']);
  assert.equal(s.chart[2].kind, 'abort');
  assert.equal(s.chart[2].seq, 4001);
  assert.deepEqual(s.table.map((r) => r.verdict), verdicts({}));
  assert.equal(logic.steps(P({ scan: 'half-open' })), 8);
});

test('rule 4: nothing listening → RST+ACK seq 0 ack X+1 (RFC 9293 §3.10.7.1)', () => {
  const s = run({})[5];
  assert.equal(s.ev.kind, 'rst');
  assert.deepEqual(s.ev.flags, ['RST', 'ACK']);
  assert.equal(s.ev.seq, 0);
  assert.equal(s.ev.ack, 4001);
  assert.equal(s.ev.by, 'S');
  // wraps like any sequence number
  const sc = { x: logic.MOD - 1, targets: { t: { exists: true, listening: [], rtt: 1 } } };
  assert.equal(logic.eventsOf(sc, { target: 't', port: 1 }, 0, P({})).events[1].ack, 0);
});

test('rule 5: silence → the same SYN again after 1 s and 2 s more; two retransmissions, then give up', () => {
  const s = last({ scene: 'no-host' });
  const p0 = s.chart.filter((e) => e.probe === 0);
  assert.deepEqual(p0.map((e) => [e.kind, e.t, e.seq, e.k]), [['syn', 0, 4000, 0], ['retx', 1000, 4000, 1], ['retx', 3000, 4000, 2]]);
  assert.equal(s.table[0].retries, logic.RETRIES);
  assert.deepEqual(logic.gapsOf({}), [1000, 2000]);
  // the timers: 1 s and 2 s expire at the next SYN; the 4 s one after the third SYN expires on its row (the client
  // gives up), also when the silent probe is the last one
  assert.deepEqual(s.timers.filter((t) => t.probe === 0).map((t) => [t.rto, t.end, t.from, t.to]), [[1000, 'expired', 0, 1], [2000, 'expired', 1, 2], [4000, 'expired', 2, 2]]);
  assert.deepEqual(s.timers.filter((t) => t.probe === 1).map((t) => [t.rto, t.end, t.from, t.to]), [[1000, 'expired', 3, 4], [2000, 'expired', 4, 5], [4000, 'expired', 5, 5]]);
  // while the probe runs, its newest timer is still running
  assert.deepEqual(run({ scene: 'no-host' })[4].timers.slice(-1).map((t) => [t.rto, t.end, t.to]), [[1000, null, null]]);
});

test('rule 5: a drop by the firewall gets the same timers as a missing host', () => {
  const drop = last({}).timers, none = last({ scene: 'no-host' }).timers.filter((t) => t.probe === 0);
  assert.deepEqual(drop.map((t) => [t.rto, t.end]), none.map((t) => [t.rto, t.end]));
  assert.deepEqual(last({ scene: 'behind-firewall' }).timers.map((t) => t.rto), [1000, 2000, 4000]);
});

test('rule 5: the book\'s capture keeps its own gaps (1.029 s, 1.024 s)', () => {
  const s = last({ scene: 'book-capture' });
  const p2 = s.chart.filter((e) => e.probe === 2);
  assert.deepEqual(p2.map((e) => e.t), [0, 1029, 2053]);
  assert.deepEqual(s.timers.map((t) => t.rto), [1029, 1024]);
});

test('rule 6: verdicts from the reply, ICMP codes included', () => {
  assert.equal(logic.verdictOf('synack'), 'open');
  assert.equal(logic.verdictOf('rst'), 'closed');
  assert.equal(logic.verdictOf('none'), 'filtered');
  for (const c of [1, 2, 3, 9, 10, 13]) assert.equal(logic.verdictOf('icmp', c), 'filtered', 'code ' + c);
  for (const c of [0, 4, 5]) assert.equal(logic.verdictOf('icmp', c), null, 'code ' + c);
});

test('rule 6: the verdict row is written on the probe\'s last step, not before', () => {
  const states = run({});
  assert.deepEqual(states.map((s) => s.table.length), [0, 0, 0, 1, 1, 2, 2, 2, 3]);
  assert.deepEqual(states.map((s) => s.cur), [null, 0, 0, 0, 1, 1, 2, 2, 2]);
  assert.equal(states[8].done, true);
  assert.equal(states[7].done, false);
});

test('rule 7: what each reply proves; ranking C > B > A (URM ch15 Primjer 2)', () => {
  const s = last({});
  assert.deepEqual(s.table.map((r) => [r.name, r.proves]), [['C', 'app'], ['B', 'tcp'], ['A', 'nothing']]);
});

test('rules 1 and 4: a firewall\'s reject comes from the firewall after half the round trip; the SYN stops there', () => {
  const s = last({ scene: 'drop-vs-reject' });
  const icmp = s.chart[4], rst = s.chart[6];
  assert.deepEqual([icmp.from, icmp.t, rst.from, rst.t], ['F', 10, 'F', 10]);
  assert.deepEqual([s.chart[3].fate, s.chart[5].fate], ['fw-reject', 'fw-reject']);
  assert.deepEqual(s.probes.map((q) => q.as), ['drop', 'reject-icmp', 'reject-rst']);
  // the host's own RST takes the whole round trip
  assert.equal(last({}).chart[4].t, 20);
});

test('rule 3: half-open: the RST leaves when the SYN+ACK arrives and carries no ack', () => {
  const c = last({ scan: 'half-open' }).chart;
  assert.deepEqual([c[2].t, c[2].ack, c[2].from, c[2].to], [20, null, 'C', 'S']);
  const cap = last({ scene: 'book-capture', scan: 'half-open' }).chart;
  assert.equal(Math.round(cap[2].t * 1000), 7236);
});

test('probe state: waiting, running, done; retries counted', () => {
  const states = run({});
  assert.deepEqual(states[0].probes.map((q) => q.phase), ['wait', 'wait', 'wait']);
  assert.deepEqual(states[1].probes.map((q) => q.phase), ['run', 'wait', 'wait']);
  assert.deepEqual(states[4].probes.map((q) => q.phase), ['done', 'run', 'wait']);
  assert.deepEqual(states[7].probes.map((q) => q.retries), [0, 0, 1]);
  assert.deepEqual(states[8].probes.map((q) => q.retries), [0, 0, 2]);
  assert.deepEqual(states[8].table.map((r) => r.retries), [0, 0, 2]);
});

test('defaults: book-three, firewall on, drop, connect, the truth hidden', () => {
  assert.deepEqual(logic.defaults, { scene: 'book-three', firewall: true, fwAction: 'drop', scan: 'connect', reveal: false });
});

test('scene data: documentation addresses, a server on another network behind the firewall', () => {
  const sc = logic.SCENES;
  assert.deepEqual(Object.values(sc['book-three'].targets).map((x) => x.addr), ['198.51.100.10', '198.51.100.20', '203.0.113.30']);
  assert.deepEqual(sc['book-three'].targets.A.fw, { rules: [{ port: 443, action: 'allow' }], dflt: 'block' });
  assert.equal(sc['no-host'].targets.none.addr, '192.0.2.1');
  for (const id of ['behind-firewall', 'drop-vs-reject']) {
    const srv = sc[id].targets.srv;
    assert.equal(srv.addr, '192.168.2.20');
    assert.notEqual(srv.addr.split('.').slice(0, 3).join('.'), sc[id].client.split('.').slice(0, 3).join('.'));
    assert.deepEqual(srv.strip, [22, 80, 8080]);
    assert.equal(srv.fw.dflt, 'block');
  }
  for (const id of logic.scenes) assert.equal(sc[id].client, '192.168.1.139');
});

// ── presets ──

test('presets: step counts 8, 8, 8, 7, 6 and their verdicts', () => {
  assert.deepEqual(Object.values(PRESETS).map((o) => logic.steps(P(o))), [8, 8, 8, 7, 6]);
  assert.deepEqual(verdicts({}), ['open', 'closed', 'filtered']);
  assert.deepEqual(verdicts({ scene: 'book-capture' }), ['open', 'closed', 'filtered']);
  assert.deepEqual(verdicts({ scene: 'behind-firewall' }), ['filtered', 'open', 'closed']);
  assert.deepEqual(verdicts({ scene: 'drop-vs-reject' }), ['filtered', 'filtered', 'closed']);
  assert.deepEqual(verdicts({ scene: 'no-host' }), ['filtered', 'filtered']);
  assert.deepEqual(kinds({ scene: 'drop-vs-reject' }), ['syn', 'retx', 'retx', 'syn', 'icmp', 'syn', 'rst']);
});

test('book-capture: the capture\'s addresses, ports, relative numbers and times', () => {
  const s = last({ scene: 'book-capture' });
  assert.deepEqual(s.table.map((r) => r.addr + ':' + r.port), ['172.66.147.243:80', '192.168.1.1:59999', '192.0.2.1:80']);
  const c = s.chart;
  assert.deepEqual([c[1].seq, c[1].ack, c[1].t], [0, 1, 7.203]);
  assert.equal(Math.round(c[2].t * 1000), 7236);
  assert.deepEqual([c[4].kind, c[4].seq, c[4].ack, c[4].t], ['rst', 0, 1, 0.628]);
});

test('page helpers: firewall controls matter only where a firewall blocks a probe', () => {
  assert.equal(logic.hasFirewall(P({})), true);
  assert.equal(logic.hasFirewall(P({ scene: 'book-capture' })), false);
  assert.equal(logic.hasFirewall(P({ scene: 'no-host' })), false);
  assert.equal(logic.fwActionMatters(P({})), true);
  assert.equal(logic.fwActionMatters(P({ firewall: false })), false);
  assert.equal(logic.fwActionMatters(P({ scene: 'drop-vs-reject' })), false);
});

test('every combination: 3 to 20 steps, valid K1 timers, a verdict for every probe', () => {
  for (const scene of logic.scenes) for (const firewall of [true, false]) for (const fwAction of logic.fwActions)
    for (const scan of ['connect', 'half-open']) {
      const o = { scene, firewall, fwAction, scan };
      const n = logic.steps(P(o));
      assert.ok(n >= 3 && n <= 20, JSON.stringify(o));
      const s = kit.stateAt(logic, P(o), n);
      assert.ok(s.done);
      assert.equal(s.table.length, s.probes.length);
      assert.ok(s.table.every((r) => r.verdict), JSON.stringify(o));
      s.timers.forEach((tm) => {
        assert.ok(tm.from < s.chart.length && (tm.to === null || (tm.to >= tm.from && tm.to < s.chart.length)), JSON.stringify(o));
      });
      // the chart as the page draws it, checked by the kit view
      const spec = {
        lanes: [{ id: 'C' }, { id: 'F' }, { id: 'S' }],
        rows: s.chart.map((e) => ({ from: e.from, to: e.to, label: 'x' })),
        timers: s.timers.map((tm) => ({ lane: 'C', from: tm.from, to: tm.to === null ? undefined : tm.to }))
      };
      assert.deepEqual(seq.checkSpec(spec), [], JSON.stringify(o));
    }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS)) for (const s of run(o)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    const forward = run(o);
    for (let n = forward.length - 1; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scene: 'drop-vs-reject' });
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
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of Object.keys(PRESETS)) assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
});
