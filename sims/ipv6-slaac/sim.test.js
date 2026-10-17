// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ipv6-slaac's model (rules: SPEC.md). Run: node --test sims/ipv6-slaac/
// Tie-breaks first, then one test per rule, then the generic block every sim keeps.
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
const phases = (over) => {
  const p = P(over), out = [];
  for (let n = 1; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n).phase);
  return out;
};
const LL = 'fe80::21a:2bff:fe3c:4d5e';
const GUA = '2001:db8:1:0:21a:2bff:fe3c:4d5e';
const SN = 'ff02::1:ff3c:4d5e';
const addr = (s, a) => s.addrs.find((x) => x.addr === a);

// ── tie-breaks ──

test('tie: two nodes probing the same address at once both lose (rule 5)', () => {
  const probeH = { type: 'NS', src: '::', target: GUA };
  const probeN = { type: 'NS', src: '::', target: GUA };
  assert.equal(logic.dadOutcome(GUA, [probeN]), 'duplicate', 'H hears N\'s probe');
  assert.equal(logic.dadOutcome(GUA, [probeH]), 'duplicate', 'N hears H\'s probe');
});

test('tie: an NS for the tentative target from a real address is address resolution, ignored (rule 5)', () => {
  assert.equal(logic.dadOutcome(GUA, [{ type: 'NS', src: 'fe80::2', target: GUA }]), 'unique');
  assert.equal(logic.dadOutcome(GUA, [{ type: 'NA', src: 'fe80::2', target: LL }]), 'unique', 'an NA about another target');
  assert.equal(logic.dadOutcome(GUA, [{ type: 'NA', src: GUA, target: '2001:db8:1::21a:2bff:fe3c:4d5e' }]), 'duplicate',
    'the same address written differently is the same target');
});

test('tie: prefix checks run in RFC order, A = 0 before the length (rule 8)', () => {
  const opt = (o) => Object.assign(logic.raOption(P({})), o);
  assert.deepEqual(logic.prefixCheck(opt({ A: false, len: 56 })), { ok: false, reason: 'a-flag' });
  assert.deepEqual(logic.prefixCheck(opt({ prefix: 'fe80::', len: 56 })), { ok: false, reason: 'link-local' });
  assert.deepEqual(logic.prefixCheck(opt({ preferred: 3e6, len: 56 })), { ok: false, reason: 'lifetimes' });
  assert.deepEqual(logic.prefixCheck(opt({ len: 56 })), { ok: false, reason: 'length' });
  assert.deepEqual(logic.prefixCheck(opt({ A: false, prefix: 'fe80::', preferred: 3e6 })), { ok: false, reason: 'a-flag' }, '(a) before (b) and (c)');
  assert.deepEqual(logic.prefixCheck(opt({ prefix: 'fe80::', preferred: 3e6 })), { ok: false, reason: 'link-local' }, '(b) before (c)');
  assert.deepEqual(logic.prefixCheck(opt({ prefix: 'febf::' })), { ok: false, reason: 'link-local' }, 'fe80::/10 reaches febf');
  assert.deepEqual(logic.prefixCheck(opt({ preferred: 2592000 })), { ok: true, reason: null }, 'preferred = valid is allowed');
  assert.deepEqual(logic.prefixCheck(opt({})), { ok: true, reason: null });
  assert.equal(end({ aFlag: false, prefixLen: 56 }).outcome, 'noAFlag');
});

test('tie: the longest zero run becomes ::, the first of equal runs, and never a single 0 (rule 11)', () => {
  assert.equal(logic.compress(logic.parse('2001:db8:1:0:21a:2bff:fe3c:4d5e')), GUA);
  assert.equal(logic.compress([0x2001, 0xdb8, 0, 0, 1, 0, 0, 1]), '2001:db8::1:0:0:1');
  assert.equal(logic.compress([0x2001, 0xdb8, 0, 0, 1, 0, 0, 0]), '2001:db8:0:0:1::');
  assert.equal(logic.compress([0xfe80, 0, 0, 0, 0, 0xff, 0xfe00, 1]), 'fe80::ff:fe00:1');
  assert.equal(logic.compress([0, 0, 0, 0, 0, 0, 0, 0]), '::');
});

// ── rules ──

test('rule 1: modified EUI-64 splits the MAC, inserts ff:fe and inverts the U/L bit', () => {
  const e = logic.eui64('00:1a:2b:3c:4d:5e');
  assert.deepEqual(e.split, [[0x00, 0x1a, 0x2b], [0x3c, 0x4d, 0x5e]]);
  assert.deepEqual(e.inserted, [0x00, 0x1a, 0x2b, 0xff, 0xfe, 0x3c, 0x4d, 0x5e]);
  assert.equal(logic.full(e.groups), '021a:2bff:fe3c:4d5e');
  assert.deepEqual([e.ulBefore, e.ulAfter], [0, 1]);
  const local = logic.eui64('02:00:00:00:00:01');
  assert.equal(logic.full(local.groups), '0000:00ff:fe00:0001', 'the U/L bit flips the other way');
  assert.deepEqual([local.ulBefore, local.ulAfter], [1, 0]);
  assert.equal(logic.full(logic.eui64('00:00:5e:00:53:01').groups), '0200:5eff:fe00:5301');
  assert.equal(at({}, 1).iid, '021a:2bff:fe3c:4d5e');
});

test('rule 2: the link-local is fe80::/64 + the IID, formed before any router message', () => {
  const s = at({}, 2);
  assert.equal(s.phase, 'll');
  assert.deepEqual(s.addrs.map((a) => [a.addr, a.scope]), [[LL, 'link']]);
  assert.equal(s.msgs.length, 0);
  assert.equal(s.defaultRouter, null);
  assert.equal(end({ mac: '02:00:00:00:00:01' }).addrs[0].addr, 'fe80::ff:fe00:1');
});

test('rule 3: a new address is tentative and never a source; the RS waits for the preferred link-local', () => {
  assert.equal(addr(at({}, 2), LL).state, 'tentative');
  assert.equal(addr(at({}, 7), GUA).state, 'tentative');
  const s = end({});
  const ns = s.msgs.filter((m) => m.type === 'NS');
  assert.ok(ns.every((m) => m.src === '::'), 'DAD probes come from ::');
  const rs = s.msgs.find((m) => m.type === 'RS');
  assert.equal(rs.src, LL);
  assert.equal(addr(at({}, 4), LL).state, 'preferred', 'preferred one step before the RS');
  assert.equal(at({}, 5).phase, 'rs');
});

test('rule 4: DAD joins the groups first, sends NS to the solicited-node group, waits 1 s, then preferred', () => {
  const s2 = at({}, 2);
  assert.deepEqual(s2.groups.map((g) => g.addr), ['ff02::1', SN]);
  const s3 = at({}, 3);
  const ns = s3.msgs[0];
  assert.deepEqual([ns.type, ns.src, ns.dst, ns.target], ['NS', '::', SN, LL]);
  assert.equal(s3.t, 0);
  const s4 = at({}, 4);
  assert.equal(s4.t, logic.C.retransTimer);
  assert.equal(logic.C.retransTimer, 1);
  assert.equal(logic.C.dupAddrDetectTransmits, 1);
  assert.equal(addr(s4, LL).state, 'preferred');
  assert.deepEqual(s4.timers, [{ lane: 'H', from: 1, to: 2, end: 'expired' }], 'the NS row to the preferred note');
  assert.equal(logic.solicitedNode('2001:db8:1::ff:fe00:1'), 'ff02::1:ff00:1');
});

test('rule 5: an NA for the target makes it duplicate; a duplicate link-local stops IPv6', () => {
  const g = end({ duplicate: 'global' });
  assert.equal(addr(g, GUA).state, 'duplicate');
  assert.equal(addr(g, LL).state, 'preferred', 'H keeps its link-local');
  assert.equal(g.dupOf, 'N');
  assert.equal(g.ipv6, true);
  assert.equal(g.outcome, 'globalDuplicate');
  const l = end({ duplicate: 'link-local' });
  assert.equal(logic.steps(P({ duplicate: 'link-local' })), 4);
  assert.equal(addr(l, LL).state, 'duplicate');
  assert.equal(l.ipv6, false);
  assert.equal(l.outcome, 'llDuplicate');
  assert.ok(!l.msgs.some((m) => m.type === 'RS'), 'no RS without a link-local');
});

test('rule 6: the owner answers the :: probe to all-nodes with S = 0, from the defended address', () => {
  const na = end({ duplicate: 'global' }).msgs.find((m) => m.type === 'NA');
  assert.deepEqual([na.from, na.src, na.dst, na.target, na.flags.S, na.flags.O], ['N', GUA, 'ff02::1', GUA, false, true]);
  assert.deepEqual(na.to, ['H', 'R']);
  assert.equal(na.react.H, 'processes');
});

test('rule 7: RS to all-routers, RA from fe80::1 to all-nodes, fe80::1 becomes the default router', () => {
  const s = at({}, 6);
  const [rs, ra] = s.msgs.slice(1);
  assert.deepEqual([rs.type, rs.dst, rs.members, rs.react.N, rs.react.R], ['RS', 'ff02::2', ['R'], 'notMember', 'answers']);
  assert.deepEqual([ra.type, ra.from, ra.src, ra.dst, ra.members], ['RA', 'R', 'fe80::1', 'ff02::1', ['H', 'N']]);
  assert.equal(ra.routerLifetime, 1800);
  assert.deepEqual(s.defaultRouter, { addr: 'fe80::1', lifetime: 1800 });
  assert.equal(at({}, 5).defaultRouter, null, 'not before the RA');
  assert.equal(end({ prefixLen: 56 }).defaultRouter.addr, 'fe80::1', 'a default router even without a global');
});

test('rule 8: A = 1 and /64 give prefix + IID; /56 or A = 0 give no global address', () => {
  assert.equal(logic.withIid('2001:db8:1::', 64, logic.eui64('00:1a:2b:3c:4d:5e').groups), GUA);
  assert.equal(logic.withIid('2001:db8:1::', 56, logic.eui64('00:1a:2b:3c:4d:5e').groups), null);
  const j = end({});
  assert.deepEqual(j.addrs.map((a) => [a.addr, a.state]), [[LL, 'preferred'], [GUA, 'preferred']]);
  assert.equal(j.outcome, 'ready');
  for (const [over, outcome] of [[{ prefixLen: 56 }, 'noLength'], [{ aFlag: false }, 'noAFlag']]) {
    const s = end(over);
    assert.deepEqual(s.addrs.map((a) => a.addr), [LL]);
    assert.equal(s.outcome, outcome);
    assert.equal(logic.steps(P(over)), 7);
  }
  const ra = end({ aFlag: false }).msgs.find((m) => m.type === 'RA');
  assert.deepEqual([ra.prefix.A, ra.flags.M], [false, true], 'A = 0 comes with M = 1');
});

test('rule 9: lifetimes from the option, infinite for the link-local', () => {
  const s = end({});
  assert.deepEqual([addr(s, GUA).valid, addr(s, GUA).preferred], [2592000, 604800]);
  assert.equal(2592000, 30 * 86400);
  assert.equal(604800, 7 * 86400);
  assert.deepEqual([addr(s, LL).valid, addr(s, LL).preferred], [null, null]);
});

test('rule 10: the solicited-node group depends on the low 24 bits only', () => {
  const s = at({}, 7);
  assert.deepEqual(s.groups.map((g) => g.addr), ['ff02::1', SN], 'the global joins no new group');
  assert.deepEqual(s.joined, []);
  // N holds the global, so it is in the group of H's link-local too: it takes the first NS and stays silent
  const n = at({ duplicate: 'global' }, 3).msgs[0];
  assert.deepEqual([n.react.N, n.react.R], ['notMine', 'notMember']);
  // MAC 02:00:00:00:00:01 shares R's group ff02::1:ff00:1
  const r = at({ mac: '02:00:00:00:00:01' }, 3).msgs[0];
  assert.deepEqual([r.dst, r.react.R, r.react.N], ['ff02::1:ff00:1', 'notMine', 'notMember']);
});

test('times: DAD waits 1 s per address, nothing else takes time; the run ends with the default router', () => {
  const ts = (over) => { const p = P(over), out = []; for (let n = 1; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n).t); return out; };
  assert.deepEqual(ts({}), [0, 0, 0, 1, 1, 1, 1, 1, 2, 2]);
  assert.deepEqual(ts({ duplicate: 'global' }), [0, 0, 0, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(ts({ duplicate: 'link-local' }), [0, 0, 0, 0]);
  assert.deepEqual(end({}).defaultRouter, { addr: 'fe80::1', lifetime: 1800 });
  assert.deepEqual(end({ duplicate: 'global' }).defaultRouter, { addr: 'fe80::1', lifetime: 1800 }, 'H keeps the default router');
  assert.deepEqual(end({ duplicate: 'global' }).timers.map((t) => t.end), ['expired', 'stopped'], 'the NA stops the second wait');
  assert.equal(end({}).msgs.map((m) => m.t).join(), '0,1,1,1');
});

test('scene: N\'s addresses per duplicate setting, and the RA fields', () => {
  const n = (dup) => logic.others(P({ duplicate: dup }))[0].addrs;
  assert.deepEqual(n('none'), ['fe80::2']);
  assert.deepEqual(n('link-local'), [LL]);
  assert.deepEqual(n('global'), ['fe80::2', GUA]);
  assert.deepEqual(logic.others(P({}))[1].addrs, ['fe80::1', '2001:db8:1::1']);
  const ra = end({}).msgs.find((m) => m.type === 'RA');
  assert.deepEqual([ra.prefix.prefix, ra.prefix.len, ra.prefix.L, ra.prefix.A, ra.flags.M, ra.flags.O], ['2001:db8:1::', 64, true, true, false, false]);
  assert.deepEqual([ra.react.H, ra.react.N], ['processes', 'hears']);
});

test('the other two MACs through the whole run', () => {
  for (const [mac, ll, gua, sn, low] of [
    ['02:00:00:00:00:01', 'fe80::ff:fe00:1', '2001:db8:1::ff:fe00:1', 'ff02::1:ff00:1', '00:0001'],
    ['00:00:5e:00:53:01', 'fe80::200:5eff:fe00:5301', '2001:db8:1:0:200:5eff:fe00:5301', 'ff02::1:ff00:5301', '00:5301']]) {
    const s = end({ mac });
    assert.deepEqual(s.addrs.map((a) => a.addr), [ll, gua]);
    assert.deepEqual(s.groups.map((g) => g.addr), ['ff02::1', sn]);
    assert.deepEqual(logic.solicitedNodeParts(ll), { fixed: 'ff02::1:ff', low });
  }
  assert.deepEqual(logic.solicitedNodeParts(LL), { fixed: 'ff02::1:ff', low: '3c:4d5e' });
});

test('presets: step counts join 10, eui64 4, dad-fail 9, prefix-56 7, a-off 7, and the phase order', () => {
  assert.equal(logic.steps(P({})), 10);
  assert.equal(logic.steps(P({ iidOnly: true })), 4);
  assert.equal(logic.steps(P({ duplicate: 'global' })), 9);
  assert.equal(logic.steps(P({ prefixLen: 56 })), 7);
  assert.equal(logic.steps(P({ aFlag: false })), 7);
  assert.deepEqual(phases({}), ['iid', 'll', 'dadNs', 'dadOk', 'rs', 'ra', 'gua', 'dadNs', 'dadOk', 'ready']);
  assert.deepEqual(phases({ duplicate: 'global' }).slice(-2), ['dadNs', 'dadNa']);
  assert.deepEqual(phases({ iidOnly: true }), ['split', 'insert', 'flip', 'compare']);
  assert.equal(end({ iidOnly: true }).stage, 4);
});

// ── generic checks every sim keeps ──

const VARIANTS = [{}, { iidOnly: true }, { duplicate: 'global' }, { duplicate: 'link-local' }, { prefixLen: 56 },
  { aFlag: false, mac: '02:00:00:00:00:01' }];

test('state is JSON-safe at every step', () => {
  for (const over of VARIANTS) {
    const p = P(over);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of VARIANTS) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const over of VARIANTS) {
    const p = P(over);
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
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
