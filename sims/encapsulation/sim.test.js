// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the encapsulation model (SPEC.md). Run: node --test sims/encapsulation/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const kinds = (s) => s.pdu.map((b) => b.kind);
const steps = (over) => kit.stepsOf(logic, P(over));
const last = (over) => at(over, steps(over));
/** The state right after the sender's link layer acted (the finished frame). */
const frame = (over) => at(over, logic.plan(P(over)).findIndex((a) => a.action === 'wire'));

const PRESETS = {
  'http-get': { proto: 'tcp', payload: 300 },
  'dns-udp': { proto: 'udp', payload: 40 },
  'pure-ack': { proto: 'tcp', payload: 0 },
  'full-frame': { proto: 'tcp', payload: 1460 },
  'gre-tunnel': { proto: 'tcp', payload: 300, tunnel: true }
};

// ── tie-breaks first ──

test('rule 5 tie-break: a 46-byte payload gets no padding, 45 gets 1 byte; the frame is 64 either way', () => {
  assert.equal(logic.padFor(46), 0);
  assert.equal(logic.padFor(45), 1);
  assert.equal(logic.padFor(47), 0);
  const p46 = logic.encapsulate([{ kind: 'data', layer: 'application', bytes: 46 }], 'link', P());
  assert.deepEqual(p46.map((b) => b.kind), ['eth', 'data', 'fcs']);
  assert.equal(logic.total(p46), 64);
  const p45 = logic.encapsulate([{ kind: 'data', layer: 'application', bytes: 45 }], 'link', P());
  assert.deepEqual(p45.map((b) => b.kind), ['eth', 'data', 'pad', 'fcs']);
  assert.equal(logic.total(p45), 64);
  // through the whole model: udp 18 B → datagram 26 → packet 46: no padding
  assert.equal(logic.total(frame({ proto: 'udp', payload: 18 }).pdu), 64);
  assert.ok(!kinds(frame({ proto: 'udp', payload: 18 })).includes('pad'));
  assert.deepEqual(kinds(frame({ proto: 'udp', payload: 17 })), ['eth', 'ip', 'udp', 'data', 'pad', 'fcs']);
});

test('rule 5: padding sits behind the packet and in front of the FCS; pure ACK pads 6 B to a 64 B frame', () => {
  const s = frame(PRESETS['pure-ack']);
  assert.deepEqual(kinds(s), ['eth', 'ip', 'tcp', 'data', 'pad', 'fcs']);
  assert.equal(s.pdu[4].bytes, 6);
  assert.equal(logic.total(s.pdu), 64);
  const u = frame({ proto: 'udp', payload: 0 });
  assert.equal(u.pdu.find((b) => b.kind === 'pad').bytes, 18);
  assert.equal(logic.total(u.pdu), 64);
  // the tunnel's outer packet of 64 B needs none
  assert.ok(!kinds(frame({ proto: 'tcp', payload: 0, tunnel: true })).includes('pad'));
});

// ── rules ──

test('rule 1: going down, each layer only prepends; the inside is unchanged and in the same order', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    const pl = logic.plan(p);
    for (let n = 2; n <= pl.length; n++) {
      if (pl[n - 1].action !== 'add') continue;
      const before = at(over, n - 1).pdu, after = at(over, n).pdu;
      const k = after.findIndex((b) => b.layer !== pl[n - 1].layer);
      assert.ok(k >= 1, 'a header in front');
      assert.ok(after.slice(0, k).every((b) => b.layer === pl[n - 1].layer), 'only its own blocks in front');
      assert.deepEqual(after.slice(k, k + before.length), before, 'inside unchanged');
    }
  }
});

test('rule 2: order of adding is data → transport → network → link; the link header ends outermost', () => {
  const p = P(PRESETS['http-get']);
  assert.deepEqual(logic.plan(p).filter((a) => a.side === 'sender').map((a) => a.layer), ['application', 'transport', 'network', 'link']);
  assert.deepEqual(at(PRESETS['http-get'], 1).added, ['data']);
  assert.deepEqual(at(PRESETS['http-get'], 2).added, ['tcp']);
  assert.deepEqual(at(PRESETS['http-get'], 3).added, ['ip']);
  assert.deepEqual(at(PRESETS['http-get'], 4).added, ['eth', 'fcs']);
  assert.deepEqual(kinds(frame(PRESETS['http-get'])), ['eth', 'ip', 'tcp', 'data', 'fcs']);
});

test('rule 3: Ethernet adds a 14 B header in front and a 4 B FCS behind', () => {
  const s = frame(PRESETS['http-get']);
  assert.equal(s.pdu[0].kind, 'eth');
  assert.equal(s.pdu[0].bytes, 14);
  assert.equal(s.pdu[s.pdu.length - 1].kind, 'fcs');
  assert.equal(s.pdu[s.pdu.length - 1].bytes, 4);
});

test('rule 4: header sizes TCP 20, UDP 8, IPv4 20, GRE 4; the presets give the SPEC numbers', () => {
  assert.equal(at(PRESETS['http-get'], 2).pdu[0].bytes, 20);
  assert.equal(at(PRESETS['dns-udp'], 2).pdu[0].bytes, 8);
  assert.equal(at(PRESETS['http-get'], 3).pdu[0].bytes, 20);
  // SPEC "Expected numbers": data, segment or datagram, packet (outermost), frame, wire
  const expect = {
    'http-get': [300, 320, 340, 358, 366],
    'dns-udp': [40, 48, 68, 86, 94],
    'pure-ack': [0, 20, 40, 64, 72],
    'full-frame': [1460, 1480, 1500, 1518, 1526],
    'gre-tunnel': [300, 320, 364, 382, 390]
  };
  for (const [id, over] of Object.entries(PRESETS)) {
    const pl = logic.plan(P(over));
    const after = (layer) => logic.total(at(over, pl.findIndex((a) => a.side === 'sender' && a.layer === layer) + 1).pdu);
    const f = frame(over);
    const got = [after('application'), after('transport'), over.tunnel ? after('tunnel') : after('network'), logic.total(f.pdu), logic.onWire(f.pdu)];
    assert.deepEqual(got, expect[id], id);
  }
});

test('rule 6: names data → segment / datagram → packet → frame, after the outermost header', () => {
  const names = (over) => Array.from({ length: 5 }, (_, i) => logic.unitOf(at(over, i).pdu));
  assert.deepEqual(names(PRESETS['http-get']), [null, 'data', 'segment', 'packet', 'frame']);
  assert.deepEqual(names(PRESETS['dns-udp']), [null, 'data', 'datagram', 'packet', 'frame']);
  // nested units in the frame, outermost first; padding and FCS belong to the frame only
  const u = logic.units(frame(PRESETS['pure-ack']).pdu);
  assert.deepEqual(u.map((x) => [x.unit, x.bytes]), [['frame', 64], ['packet', 40], ['segment', 20], ['data', 0]]);
  const g = logic.units(frame(PRESETS['gre-tunnel']).pdu);
  assert.deepEqual(g.map((x) => [x.unit, x.kind, x.bytes]), [['frame', 'eth', 382], ['packet', 'oip', 364], ['packet', 'ip', 340], ['segment', 'tcp', 320], ['data', 'data', 300]]);
});

test('rule 7: going up, each layer strips only its own outermost blocks, in reverse order, until the data is left', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    const pl = logic.plan(p);
    const strips = pl.map((a, i) => [a, i + 1]).filter(([a]) => a.action === 'strip');
    const adds = pl.filter((a) => a.action === 'add').map((a) => a.layer);
    assert.deepEqual(strips.map(([a]) => a.layer), adds.slice().reverse(), 'reverse order of adding');
    for (const [a, n] of strips) {
      const before = at(over, n - 1).pdu, s = at(over, n);
      assert.ok(s.removed.length > 0);
      assert.equal(s.phase, 'up');
      for (const k of s.removed) assert.equal(before.find((b) => b.kind === k).layer, a.layer, 'removes only its own');
      // the rest is the inside, unchanged
      const front = before.findIndex((b) => b.layer !== a.layer);
      assert.deepEqual(s.pdu, before.slice(front, front + s.pdu.length));
    }
    const end = last(over);
    assert.deepEqual(kinds(end), ['data']);
    assert.equal(end.pdu[0].bytes, p.payload);
    assert.equal(end.phase, 'done');
  }
  // the receiving link layer takes header, padding and FCS in one step
  const pa = PRESETS['pure-ack'];
  assert.deepEqual(at(pa, 6).removed, ['eth', 'pad', 'fcs']);
  assert.deepEqual(kinds(at(pa, 6)), ['ip', 'tcp', 'data']);
  // decapsulate never takes a block that is not on the outside
  const odd = [{ kind: 'ip', layer: 'network', bytes: 20 }, { kind: 'eth', layer: 'link', bytes: 14 }, { kind: 'data', layer: 'application', bytes: 10 }];
  assert.deepEqual(logic.decapsulate(odd, 'link').removed, []);
});

test('rule 8: the tunnel adds outer IPv4 + GRE (24 B) around the unchanged packet, one step each way', () => {
  const over = PRESETS['gre-tunnel'];
  const inner = at(over, 3).pdu;
  const s = at(over, 4);
  assert.equal(s.layer, 'tunnel');
  assert.deepEqual(s.added, ['oip', 'gre']);
  assert.deepEqual(kinds(s), ['oip', 'gre', 'ip', 'tcp', 'data']);
  assert.deepEqual(s.pdu.slice(2), inner);
  assert.equal(logic.total(s.pdu) - logic.total(inner), 24);
  const up = at(over, 8);
  assert.equal(up.layer, 'tunnel');
  assert.deepEqual(up.removed, ['oip', 'gre']);
  assert.deepEqual(up.pdu, inner);
});

test('steps: 9 without the tunnel (start + 4 down + wire + 4 up = 10 positions), 11 with it', () => {
  for (const id of ['http-get', 'dns-udp', 'pure-ack', 'full-frame']) assert.equal(steps(PRESETS[id]), 9, id);
  assert.equal(steps(PRESETS['gre-tunnel']), 11);
  assert.deepEqual(logic.plan(P()).map((a) => a.action), ['create', 'add', 'add', 'add', 'wire', 'strip', 'strip', 'strip', 'deliver']);
  assert.equal(at({}, 0).phase, 'start');
  assert.deepEqual(at({}, 0).pdu, []);
});

test('rule 9: payload max 1460, or 1430 with the tunnel, keeps the packet within 1500 B', () => {
  assert.equal(logic.payloadMax(P()), 1460);
  assert.equal(logic.payloadMax(P({ tunnel: true })), 1430);
  for (const proto of ['tcp', 'udp']) for (const tunnel of [false, true]) {
    const over = { proto, tunnel, payload: logic.payloadMax(P({ tunnel })) };
    const f = frame(over);
    assert.ok(logic.total(f.pdu) - 18 <= 1500, `${proto} ${tunnel}`);
  }
});

test('rule 10: the wire step changes nothing in the frame; preamble and SFD count only on the wire', () => {
  for (const over of Object.values(PRESETS)) {
    const n = logic.plan(P(over)).findIndex((a) => a.action === 'wire') + 1;
    const w = at(over, n);
    assert.equal(w.phase, 'wire');
    assert.equal(w.layer, 'physical');
    assert.deepEqual(w.pdu, at(over, n - 1).pdu);
    assert.deepEqual(w.added, []);
    assert.equal(logic.onWire(w.pdu), logic.total(w.pdu) + 8);
  }
});

test('the sender adds on the left side, the receiver strips on the right side', () => {
  const pl = logic.plan(P(PRESETS['gre-tunnel']));
  assert.ok(pl.filter((a) => a.action === 'add' || a.action === 'create').every((a) => a.side === 'sender'));
  assert.ok(pl.filter((a) => a.action === 'strip' || a.action === 'deliver').every((a) => a.side === 'receiver'));
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of Object.values(PRESETS)) {
    for (let n = 0; n <= steps(over); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(PRESETS['gre-tunnel']);
  const total = kit.stepsOf(logic, p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= total; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = total; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P(PRESETS['pure-ack']);
  let s = logic.initial(p);
  for (let n = 1; n <= kit.stepsOf(logic, p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model and matches the SPEC', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, kit.stepsOf(logic, P()), 'meta.steps matches the model with default params');
  const found = [...html.matchAll(/id: '([\w-]+)',[^\n]*params: \{([^}]*)\}/g)];
  assert.equal(found.length, 5, 'five presets');
  for (const [, id, body] of found) {
    const params = Function('return {' + body + '}')();
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.deepEqual(Object.assign({ tunnel: false }, params), Object.assign({ tunnel: false }, PRESETS[id]), id);
  }
});
