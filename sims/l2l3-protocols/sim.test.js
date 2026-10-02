// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the L2/L3 encapsulation model (sim.js). Run: node --test sims/l2l3-protocols/
// The model's rules first (boundaries first of all), then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => kit.stateAt(logic, P(over), 0);
const frame = (id, over) => at(Object.assign({ frame: id }, over)).frame;
const segs = (fr) => fr.groups.flatMap((g) => g.segs);

// ── boundaries ──

test('ESP alignment: the encrypted part is a multiple of 4; the bytes it cannot use count as overhead', () => {
  // MTU 1500: 1500 − 20 − 8 − 8 − 16 = 1448 for (inner + pad + 2), already a multiple of 4.
  assert.equal(frame('esp').inner, 1446);
  assert.equal(frame('esp').waste, 0);
  // MTU 1504 and 1502: 1452 is aligned (inner 1450); 1450 is not, so 2 bytes go unused and the inner stays 1446.
  assert.equal(frame('esp', { mtu: 1504 }).inner, 1450);
  assert.equal(frame('esp', { mtu: 1502 }).inner, 1446);
  assert.equal(frame('esp', { mtu: 1502 }).waste, 2);
  assert.equal(frame('esp', { mtu: 1502 }).over, 56);
  for (const mtu of [1500, 1501, 1502, 1503, 1504, 9000]) {
    const fr = frame('esp', { mtu });
    assert.equal((fr.inner + 2) % logic.ESP_ALIGN, 0, `mtu ${mtu}`);
    assert.equal(fr.over + fr.inner, mtu, `mtu ${mtu}: over + inner = mtu`);
  }
});

test('the largest inner packet needs no ESP padding', () => {
  const pad = segs(frame('esp')).find((x) => x.f === 'pad');
  assert.equal(pad.b, 0);
});

test('a frame whose fixed headers do not fit the MTU says so instead of a negative payload', () => {
  // The slider stops at 576, where everything fits; the model still guards smaller values.
  const fr = logic.build('gre-ipsec', P({ mtu: 60 }));
  assert.equal(fr.fits, false);
  assert.ok(segs(fr).every((x) => x.b >= 0));
  assert.equal(fr.inner, 0);
  assert.equal(fr.over, 60);
  assert.equal(frame('gre-ipsec', { mtu: logic.MTU_MIN }).fits, true);
});

test('params are clamped: MTU to 576–9000, labels to 1–4, GENEVE options to 0–252 in steps of 4', () => {
  assert.equal(frame('eth', { mtu: 100 }).inner, logic.MTU_MIN);
  assert.equal(frame('eth', { mtu: 20000 }).inner, logic.MTU_MAX);
  assert.equal(frame('mpls', { labels: 9 }).over, 16);
  assert.equal(frame('mpls', { labels: 0 }).over, 4);
  assert.equal(frame('geneve', { opts: 7 }).over, 54);
  assert.equal(frame('geneve', { opts: 400 }).over, 50 + 252);
});

// ── the budget of each frame (numbers from the original page and the RFCs; NOTES.md) ──

test('plain Ethernet: 14 B header and 4 B FCS around the packet; the preamble is not counted', () => {
  const fr = frame('eth');
  assert.equal(fr.over, 0);
  assert.equal(fr.inner, 1500);
  assert.equal(fr.frame, 1518);
  assert.equal(fr.extra, 0);
  assert.equal(segs(fr).find((x) => x.f === 'pre').z, 'phy');
});

test('tags in the Ethernet header make the frame longer and leave the MTU alone', () => {
  assert.deepEqual(['dot1q', 'qinq', 'macsec'].map((id) => [frame(id).inner, frame(id).frame, frame(id).extra]),
    [[1500, 1522, 4], [1500, 1526, 8], [1500, 1550, 32]]);
});

test('header views: IPv4 takes 20 B (no options), IPv6 always 40 B', () => {
  assert.equal(frame('ipv4').over, 20);
  assert.equal(frame('ipv4').inner, 1480);
  assert.equal(frame('ipv6').over, 40);
  assert.equal(frame('ipv6').inner, 1460);
  assert.equal(frame('ipv4').extra, 0);
});

test('MPLS: every label takes 4 B of the MTU; only the last has S = 1', () => {
  for (let n = 1; n <= logic.LABELS_MAX; n++) {
    const fr = frame('mpls', { labels: n });
    assert.equal(fr.over, 4 * n);
    const labels = segs(fr).filter((x) => x.f === 'label' || x.f === 'labelBottom');
    assert.equal(labels.length, n);
    assert.equal(labels.filter((x) => x.f === 'labelBottom').length, 1);
    assert.equal(labels[n - 1].f, 'labelBottom');
  }
});

test('tunnels: IP in IP 20, GRE 24, VXLAN 50, GENEVE 50 + options, ESP 54, VXLAN + inner tag 54, GRE over IPsec 78', () => {
  const over = (id, o) => frame(id, o).over;
  assert.equal(over('ipip'), 20);
  assert.equal(over('gre'), 24);
  assert.equal(over('vxlan'), 50);
  assert.equal(frame('vxlan').inner, 1450);
  assert.equal(over('geneve', { opts: 0 }), 50);
  assert.equal(over('geneve', { opts: 252 }), 302);
  assert.equal(over('esp'), 54);
  assert.equal(over('vxlan-dot1q'), 54);
  assert.equal(over('gre-ipsec'), 78);
  assert.equal(frame('gre-ipsec').inner, 1422);
});

test('a tunnel frame on the wire is still a plain Ethernet frame: 18 B around the link MTU', () => {
  for (const id of ['ipip', 'gre', 'vxlan', 'geneve', 'esp', 'mpls', 'vxlan-dot1q', 'gre-ipsec']) {
    const fr = frame(id, { mtu: 9000 });
    assert.equal(fr.frame, 9018, id);
    assert.equal(fr.extra, 0, id);
    assert.equal(fr.over + fr.inner, 9000, id);
  }
});

test('group sizes add up to the frame (the preamble left out)', () => {
  for (const id of logic.FRAME_IDS) {
    const fr = frame(id);
    const total = fr.groups.reduce((a, g) => a + g.bytes, 0);
    assert.equal(total, fr.kind === 'hdr' ? fr.over + fr.inner : fr.frame, id);
  }
});

test('the payload segment fills what the headers leave of the inner part', () => {
  const fr = frame('vxlan-dot1q');
  const inner = segs(fr).filter((x) => x.z === 'inner').reduce((a, x) => a + x.b, 0);
  assert.equal(inner, fr.inner);
  assert.equal(segs(fr).find((x) => x.f === 'pay').b, 1446 - 20 - 20);
});

test('encrypted segments: ESP hides the inner packet and its trailer, MACsec the EtherType and the packet', () => {
  const enc = (id) => segs(frame(id)).filter((x) => x.enc).map((x) => x.f);
  assert.deepEqual(enc('esp'), ['iip', 'pay', 'pad', 'esptrl']);
  assert.deepEqual(enc('gre-ipsec'), ['gip', 'gre', 'iip', 'pay', 'pad', 'esptrl']);
  assert.deepEqual(enc('macsec'), ['etype', 'pay']);
  assert.deepEqual(enc('vxlan'), []);
});

test('compare lists every frame but the header views, with the same numbers as the frame view', () => {
  const st = at({ view: 'compare', mtu: 1500 });
  assert.deepEqual(st.rows.map((r) => r.id), logic.FRAME_IDS.filter((id) => logic.kindOf(id) !== 'hdr'));
  for (const r of st.rows) assert.equal(r.inner, frame(r.id).inner, r.id);
  assert.deepEqual(at({ view: 'frame' }).rows, []);
});

test('an unknown frame id falls back to Ethernet', () => {
  assert.equal(at({ frame: 'nope' }).frame.id, 'eth');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every frame', () => {
  for (const id of logic.FRAME_IDS) {
    const s = at({ frame: id, view: 'compare' });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ frame: 'geneve', opts: 24, mtu: 1400 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  // Building one frame does not change the next (shared segment definitions are copied).
  const a = JSON.stringify(logic.build('eth', p));
  logic.build('dot1q', P({ mtu: 9000 }));
  assert.equal(JSON.stringify(logic.build('eth', p)), a);
});

test('an explorer has no steps', () => {
  assert.equal(kit.stepsOf(logic, logic.defaults), 0);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every field, group and frame the model uses has its strings', () => {
  const need = new Set();
  for (const id of logic.FRAME_IDS) {
    need.add('f_' + id); need.add('a_' + id);
    const fr = logic.build(id, P({ labels: 2 }));
    for (const g of fr.groups) {
      need.add(g.g);
      for (const x of g.segs) { need.add('s_' + x.f); need.add('n_' + x.f); need.add('d_' + x.f); }
    }
  }
  for (const k of need) assert.ok(k in strings.en && k in strings.hr, `missing string ${k}`);
});

test('every preset is valid for the model; the page metadata matches sim.json', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.deepEqual(meta.title, json.title);
  assert.deepEqual(meta.concept, json.concept);
  assert.equal(logic.presets.length, 9);
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset ${pr.id}: ${k} is a model param`);
    if (pr.params.frame) assert.ok(logic.FRAME_IDS.includes(pr.params.frame), `preset ${pr.id}: frame ${pr.params.frame}`);
  }
});
