// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for arp-local-remote's model (rules: SPEC.md). Run: node --test sims/arp-local-remote/
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
const phases = (over) => { const p = P(over); const out = []; for (let n = 1; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n).phase); return out; };
/** The state right after the first step whose phase is `phase` (packet `pkt`). */
const after = (over, phase, pkt = 0) => {
  const p = P(over);
  for (let n = 1; n <= logic.steps(p); n++) { const s = kit.stateAt(logic, p, n); if (s.phase === phase && s.pkt === pkt) return s; }
  return null;
};
const LAN = logic.NETS.lan.stations;
const mac = (id) => LAN.find((s) => s.id === id).mac;

// ── tie-breaks first ──

test('tie-break: the gateway itself as destination is local, and ARP asks for it directly', () => {
  const s = after({ dst: '192.168.1.1' }, 'decide');
  assert.equal(s.decision, 'local');
  assert.equal(s.nextHop, '192.168.1.1');
  const f = end({ dst: '192.168.1.1' }).frame;
  assert.equal(f.dstMac, mac('R'));
  assert.equal(f.dstIp, '192.168.1.1');
});

test('tie-break: C hears the request but neither answers nor learns (it had no entry for A)', () => {
  const s = after({ dst: '192.168.1.20' }, 'arpHear');
  assert.deepEqual(s.heardBy, ['B', 'C', 'R']);
  assert.equal(s.answeredBy, 'B');
  assert.deepEqual(s.arp.C, []);
  assert.deepEqual(s.arp.R, []);
});

test('tie-break: a non-target that already has the sender refreshes that entry but does not answer (RFC 826 merge)', () => {
  // mask-28: B learned A on packet 1; packet 2 asks for R, B hears it.
  const s = after({ net: 'lan28' }, 'arpHear', 1);
  assert.equal(s.answeredBy, 'R');
  assert.deepEqual(s.arp.B, [{ ip: '192.168.5.77', mac: '02:00:00:aa:aa:aa', state: 'refreshed' }]);
  // and directly, with a stale MAC: the merge overwrites it
  const arp = { A: [], B: [{ ip: '192.168.1.10', mac: '02:00:00:99:99:99', state: 'old' }], C: [], R: [] };
  const h = logic.hear(arp, LAN, { srcMac: mac('A'), srcIp: '192.168.1.10', targetIp: '192.168.1.1' });
  assert.equal(h.arp.B[0].mac, mac('A'));
  assert.equal(h.arp.B[0].state, 'refreshed');
  assert.equal(h.answeredBy, 'R');
});

test('tie-break: /28 on A makes B on the same wire remote (A\'s mask decides, not the cable)', () => {
  const s = after({ dst: '192.168.1.20', mask: 28 }, 'decide');
  assert.equal(s.netSrc, '192.168.1.0');
  assert.equal(s.netDst, '192.168.1.16');
  assert.equal(s.decision, 'remote');
  assert.equal(s.nextHop, '192.168.1.1');
});

// ── rules ──

test('rule 1: equal AND results → local, the next hop is the destination', () => {
  const s = after({ dst: '192.168.1.20' }, 'decide');
  assert.equal(s.netSrc, '192.168.1.0');
  assert.equal(s.netDst, '192.168.1.0');
  assert.equal(s.decision, 'local');
  assert.equal(s.nextHop, '192.168.1.20');
  assert.equal(after({ dst: '192.168.1.20', mask: 25 }, 'decide').decision, 'local');
});

test('rule 1: the AND results arrive one per step (own address first, then the destination)', () => {
  const s1 = at({ dst: '8.8.8.8' }, 1), s2 = at({ dst: '8.8.8.8' }, 2);
  assert.equal(s1.netSrc, '192.168.1.0');
  assert.equal(s1.netDst, null);
  assert.equal(s2.netDst, '8.8.8.0');
  assert.equal(s2.decision, null);
});

test('rule 2: different AND results → remote, via the gateway; the IP destination stays remote', () => {
  for (const dst of ['8.8.8.8', '192.168.2.50']) {
    const s = after({ dst }, 'decide');
    assert.equal(s.decision, 'remote', dst);
    assert.equal(s.nextHop, '192.168.1.1', dst);
    assert.equal(end({ dst }).frame.dstIp, dst);
  }
  assert.equal(after({ dst: '192.168.2.50' }, 'decide').netDst, '192.168.2.0');
});

test('rule 3: ARP asks for the next hop, never for the remote destination', () => {
  const s = after({ dst: '8.8.8.8' }, 'arpReq');
  assert.equal(s.frame.targetIp, '192.168.1.1');
  assert.ok(!end({ dst: '8.8.8.8' }).arp.A.some((e) => e.ip === '8.8.8.8'));
});

test('rule 4: a next hop already in A\'s table sends at once (steps 5–7 skipped)', () => {
  assert.deepEqual(phases({ dst: '8.8.8.8', cache: true }), ['andSrc', 'andDst', 'decide', 'lookup', 'send']);
  assert.equal(after({ dst: '8.8.8.8', cache: true }, 'lookup').hit, true);
  assert.equal(after({ dst: '8.8.8.8' }, 'lookup').hit, false);
  assert.deepEqual(phases({ dst: '8.8.8.8' }), ['andSrc', 'andDst', 'decide', 'lookup', 'arpReq', 'arpHear', 'arpRep', 'send']);
});

test('rule 5: the request is a broadcast heard by every other station; only the owner answers, unicast to the asker', () => {
  const req = after({ dst: '8.8.8.8' }, 'arpReq').frame;
  assert.equal(req.dstMac, 'ff:ff:ff:ff:ff:ff');
  assert.equal(req.srcMac, mac('A'));
  const heard = after({ dst: '8.8.8.8' }, 'arpHear');
  assert.deepEqual(heard.heardBy, ['B', 'C', 'R']);
  assert.equal(heard.answeredBy, 'R');
  const rep = after({ dst: '8.8.8.8' }, 'arpRep').frame;
  assert.equal(rep.dstMac, mac('A'));
  assert.equal(rep.srcMac, mac('R'));
  assert.equal(rep.to, 'A');
});

test('rule 6: the owner learns the asker on the request, the asker learns the owner on the reply', () => {
  const heard = after({ dst: '192.168.1.20' }, 'arpHear');
  assert.deepEqual(heard.arp.B, [{ ip: '192.168.1.10', mac: mac('A'), state: 'new' }]);
  assert.deepEqual(heard.arp.A, []);
  const rep = after({ dst: '192.168.1.20' }, 'arpRep');
  assert.deepEqual(rep.arp.A, [{ ip: '192.168.1.20', mac: mac('B'), state: 'new' }]);
  assert.equal(after({ dst: '192.168.1.20' }, 'send').arp.A[0].state, 'old');
});

test('rule 7: the frame carries the next hop\'s MAC and the final destination\'s IP', () => {
  const local = end({ dst: '192.168.1.30' });
  assert.equal(local.frame.kind, 'ip');
  assert.equal(local.frame.dstMac, mac('C'));
  assert.equal(local.frame.srcMac, mac('A'));
  assert.equal(local.frame.srcIp, '192.168.1.10');
  assert.equal(local.deliveredTo, 'C');
  const remote = end({ dst: '8.8.8.8' });
  assert.equal(remote.frame.dstMac, mac('R'));
  assert.equal(remote.frame.dstIp, '8.8.8.8');
  assert.equal(remote.deliveredTo, 'R');
});

test('rule 7: the frame\'s dst MAC comes from A\'s ARP table (even a stale entry), not from the stations', () => {
  const p = P({ dst: '8.8.8.8', cache: true });
  const s = structuredClone(kit.stateAt(logic, p, 4));
  assert.equal(s.phase, 'lookup');
  s.arp.A[0].mac = '02:00:00:99:99:99';
  assert.equal(logic.step(s, 5, p).frame.dstMac, '02:00:00:99:99:99');
});

test('rule 6: a target that already has the asker refreshes that one entry, never a second row', () => {
  const arp = { A: [], B: [], C: [], R: [{ ip: '192.168.1.10', mac: '02:00:00:99:99:99', state: 'old' }] };
  const h = logic.hear(arp, LAN, { srcMac: mac('A'), srcIp: '192.168.1.10', targetIp: '192.168.1.1' });
  assert.deepEqual(h.arp.R, [{ ip: '192.168.1.10', mac: mac('A'), state: 'refreshed' }]);
});

// ── presets and step counts (SPEC.md table) ──

test('step counts: 8, 8, 8, 5, 16; defaults give sim.json steps', () => {
  assert.equal(logic.steps(P({})), 8);
  assert.equal(logic.steps(P({ dst: '8.8.8.8' })), 8);
  assert.equal(logic.steps(P({ dst: '192.168.2.50' })), 8);
  assert.equal(logic.steps(P({ dst: '8.8.8.8', cache: true })), 5);
  assert.equal(logic.steps(P({ net: 'lan28' })), 16);
  assert.equal(logic.steps(P({ net: 'lan28', cache: true })), 10);
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, logic.steps(P({})));
});

test('mask-28: 77 AND 240 = 64 = 70 AND 240 → local; 90 AND 240 = 80 → remote via .65', () => {
  const p1 = after({ net: 'lan28' }, 'decide', 0);
  assert.deepEqual([p1.netSrc, p1.netDst, p1.decision, p1.nextHop], ['192.168.5.64', '192.168.5.64', 'local', '192.168.5.70']);
  const p2 = after({ net: 'lan28' }, 'decide', 1);
  assert.deepEqual([p2.netSrc, p2.netDst, p2.decision, p2.nextHop], ['192.168.5.64', '192.168.5.80', 'remote', '192.168.5.65']);
  assert.equal(p2.mask, 28);
  const last = end({ net: 'lan28' });
  assert.equal(last.done, true);
  assert.equal(last.frame.dstMac, '02:00:00:00:00:01');
  assert.equal(last.frame.dstIp, '192.168.5.90');
  // the mask param does not apply to the fixed /28 network
  assert.deepEqual(end({ net: 'lan28', mask: 24 }), last);
});

test('helpers: AND, mask and bits', () => {
  assert.equal(logic.and('192.168.5.77', 28), '192.168.5.64');
  assert.equal(logic.maskIp(24), '255.255.255.0');
  assert.equal(logic.maskIp(25), '255.255.255.128');
  assert.equal(logic.maskIp(28), '255.255.255.240');
  assert.equal(logic.bits('192.168.5.77').slice(24).join(''), '01001101');
  assert.equal(logic.bits('255.255.255.240').slice(24).join(''), '11110000');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = P({ net: 'lan28' });
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of [{ net: 'lan28' }, { dst: '8.8.8.8', cache: true }]) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ net: 'lan28' });
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
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
