// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for vlan's model. Run: node --test sims/vlan/
// Numbers from the URM book, ch. 7 (07-podatkovni-sloj.md): "VLAN-ovi: jedna žica, više logičkih mreža" (access
// ports never tag; a trunk tags right after the source address; the far switch reads and removes the tag), Primjer 5
// (two switches, VLAN 10 accounting and VLAN 20 sales, one cable; (b) access port in VLAN 10 cuts VLAN 20 off) and
// Primjer 6 (an access port where tags are expected carries only its one VLAN, untagged); and the fragment vlan.html.
// Tie-breaks and edges first, then the book's numbers, then the steps, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const final = (link) => at({ link }, logic.steps).results;

// ── rules, tie-breaks and edges ──

test('an access port carries exactly its own VLAN; a trunk carries every VLAN', () => {
  assert.equal(logic.carries('access-10', 10), true);
  assert.equal(logic.carries('access-10', 20), false);
  assert.equal(logic.carries('access-20', 10), false);
  assert.equal(logic.carries('access-20', 20), true);
  for (const v of [1, 10, 20, 4094]) assert.equal(logic.carries('trunk', v), true);
});

test('tie-break: an access port tags nothing, even a frame of its own VLAN; a trunk tags with the frame\'s VLAN', () => {
  assert.equal(logic.tagOnLink('access-10', 10), null);
  assert.equal(logic.tagOnLink('access-20', 20), null);
  assert.equal(logic.tagOnLink('trunk', 10), 10);
  assert.equal(logic.tagOnLink('trunk', 20), 20);
});

test('the receiving switch takes the VLAN from the tag on a trunk and from its own port on an access link', () => {
  assert.equal(logic.arrivalVlan('trunk', 20), 20);
  assert.equal(logic.arrivalVlan('trunk', 10), 10);
  assert.equal(logic.arrivalVlan('access-10', null), 10);
  // an access port never looks for a tag
  assert.equal(logic.arrivalVlan('access-20', 10), 20);
});

test('cross: a held frame has no tag and no VLAN on the far switch', () => {
  assert.deepEqual(logic.cross('access-10', 20), { crosses: false, tag: null, vlanOnSw2: null });
  assert.deepEqual(logic.cross('access-10', 10), { crosses: true, tag: null, vlanOnSw2: 10 });
  assert.deepEqual(logic.cross('trunk', 20), { crosses: true, tag: 20, vlanOnSw2: 20 });
});

test('parseLink reads the three settings and refuses anything else', () => {
  assert.deepEqual(logic.links.map(logic.parseLink),
    [{ mode: 'trunk', vlan: null }, { mode: 'access', vlan: 10 }, { mode: 'access', vlan: 20 }]);
  assert.throws(() => logic.parseLink('hybrid'));
});

test('a host never sees a tag: every frame enters and is delivered untagged, on every link', () => {
  for (const link of logic.links) for (let n = 1; n <= logic.steps; n++) {
    const s = at({ link }, n);
    if (s.phase === 'enter' || s.phase === 'exit') assert.equal(s.tag, null, `${link} step ${n}`);
  }
});

test('a frame is delivered only to the host of its own VLAN on the far switch, never to the other VLAN', () => {
  for (const link of logic.links) for (const n of [3, 6]) {
    const s = at({ link }, n);
    if (s.delivered) assert.equal(logic.hosts.find((x) => x.id === s.delivered).vlan, s.vlan);
  }
});

test('tie-break: the tag is added on the link step and removed on the delivery step, nowhere else', () => {
  const tr = [...Array(7).keys()].map((n) => at({ link: 'trunk' }, n).tagChange);
  assert.deepEqual(tr, [null, null, 'added', 'removed', null, 'added', 'removed']);
  for (const link of ['access-10', 'access-20']) {
    assert.deepEqual([...Array(7).keys()].map((n) => at({ link }, n).tagChange), [null, null, null, null, null, null, null]);
  }
});

// ── the book's numbers ──

test('Primjer 5 (a): a trunk carries both VLANs; Ra1 ↔ Ra2 and Pr1 ↔ Pr2 both work, tagged VID 10 and 20', () => {
  assert.deepEqual(final('trunk'), { 10: 'ok', 20: 'ok' });
  assert.equal(at({ link: 'trunk' }, 2).tag, 10);
  assert.equal(at({ link: 'trunk' }, 5).tag, 20);
  assert.equal(at({ link: 'trunk' }, 3).delivered, 'Ra2');
  assert.equal(at({ link: 'trunk' }, 6).delivered, 'Pr2');
});

test('Primjer 5 (b), the defaults: an access port in VLAN 10 carries VLAN 10 untagged and cuts VLAN 20 off', () => {
  assert.equal(logic.defaults.link, 'access-10');
  assert.deepEqual(final('access-10'), { 10: 'ok', 20: 'cut' });
  assert.equal(at({}, 2).at, 'link');
  assert.equal(at({}, 2).tag, null);
  assert.equal(at({}, 5).at, 'held');
  assert.equal(at({}, 6).delivered, null);
});

test('Primjer 6 / preset wrong: an access port in VLAN 20 carries only VLAN 20, untagged; VLAN 10 is cut', () => {
  assert.deepEqual(final('access-20'), { 10: 'cut', 20: 'ok' });
  assert.equal(at({ link: 'access-20' }, 2).at, 'held');
  assert.equal(at({ link: 'access-20' }, 5).tag, null, 'no frame carries a tag');
  assert.equal(at({ link: 'access-20' }, 6).delivered, 'Pr2');
});

test('the fragment: exactly one VLAN passes an access link, both pass a trunk', () => {
  for (const link of logic.links) {
    const r = final(link);
    const ok = logic.vlans.filter((v) => r[v] === 'ok').length;
    assert.equal(ok, link === 'trunk' ? 2 : 1, link);
  }
});

// ── steps ──

test('six steps: two frames (VLAN 10, then VLAN 20), each enters, reaches the link, exits', () => {
  assert.equal(logic.steps, 6);
  assert.deepEqual([...Array(7).keys()].map((n) => at({}, n).phase), ['idle', 'enter', 'link', 'exit', 'enter', 'link', 'exit']);
  assert.deepEqual([1, 4].map((n) => [at({}, n).src, at({}, n).dst, at({}, n).vlan]), [['Ra1', 'Ra2', 10], ['Pr1', 'Pr2', 20]]);
});

test('an outcome is known only after its frame\'s delivery step and is kept to the end', () => {
  const r = [...Array(7).keys()].map((n) => at({ link: 'trunk' }, n).results);
  assert.deepEqual(r[2], { 10: null, 20: null });
  assert.deepEqual(r[3], { 10: 'ok', 20: null });
  assert.deepEqual(r[5], { 10: 'ok', 20: null });
  assert.deepEqual(r[6], { 10: 'ok', 20: 'ok' });
});

test('a param change recomputes the same step', () => {
  assert.equal(at({ link: 'trunk' }, 5).at, 'link');
  assert.equal(at({ link: 'access-10' }, 5).at, 'held');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const link of logic.links) for (let n = 0; n <= logic.steps; n++) {
    const s = at({ link }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ link: 'trunk' });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps; n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 3, 'found preset params');
  for (const b of blocks) {
    for (const k of b.matchAll(/(\w+):/g)) assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
    const l = b.match(/link:\s*'([^']+)'/);
    if (l) assert.ok(logic.links.includes(l[1]), `link ${l[1]}`);
  }
});
