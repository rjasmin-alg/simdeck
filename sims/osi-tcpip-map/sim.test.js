// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the osi-tcpip-map model (SPEC.md). Run: node --test sims/osi-tcpip-map/
// Expected verdicts and answers are the output of the independent Python check described in NOTES.md.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const ids = (rows) => rows.map((r) => r.id);

// ── tie-breaks first ──

test('tie-break: a card two rows of one model accept is both-ok in either row, and wrong elsewhere (ARP)', () => {
  assert.equal(L.check('arp', 'o2', false), 'both-ok');
  assert.equal(L.check('arp', 'o3', false), 'both-ok');
  assert.equal(L.check('arp', 'o1', false), 'wrong');
  assert.equal(L.check('arp', 'o4', false), 'wrong');
  assert.equal(L.check('arp', 'tl', false), 'both-ok');
  assert.equal(L.check('arp', 'ti', false), 'both-ok');
  assert.equal(L.check('arp', 'tt', false), 'wrong');
});

test('tie-break: both-ok counts rows of the target\'s model, so TLS is both-ok on OSI 5–7 but plain ok on TCP/IP application', () => {
  for (const r of ['o5', 'o6', 'o7']) assert.equal(L.check('tls', r, false), 'both-ok', r);
  assert.equal(L.check('tls', 'o4', false), 'wrong');
  assert.equal(L.check('tls', 'ta', false), 'ok');
  assert.equal(L.check('tls', 'tt', false), 'wrong');
  // L3 switch and firewall: two OSI rows, and two TCP/IP rows too
  assert.equal(L.check('l3switch', 'o2', false), 'both-ok');
  assert.equal(L.check('l3switch', 'ti', false), 'both-ok');
  assert.equal(L.check('firewall', 'o3', false), 'both-ok');
  assert.equal(L.check('firewall', 'tt', false), 'both-ok');
  assert.equal(L.check('firewall', 'o7', false), 'wrong');
});

test('tie-break: a single-layer card on a TCP/IP row covering several OSI layers is ok, not both-ok', () => {
  assert.equal(L.check('computer', 'ta', false), 'ok');
  assert.equal(L.check('resume', 'ta', false), 'ok');
  assert.equal(L.check('ethernet', 'tl', false), 'ok');
  assert.equal(L.check('cable', 'tl', false), 'ok');
});

test('tie-break: a sentence in the other model\'s column is wrong whatever the row, before coverage is looked at', () => {
  assert.equal(L.check('vocabB', 'o3', false), 'wrong');   // same function, OSI word is "mrežni"
  assert.equal(L.check('vocabB', 'ti', false), 'ok');
  assert.equal(L.check('vocabA', 'ta', false), 'wrong');   // ta covers 5, but TCP/IP has no session layer
  assert.equal(L.check('vocabA', 'o5', false), 'ok');
  assert.equal(L.check('vocabC', 'o6', false), 'both-ok');
  assert.equal(L.check('vocabC', 'o7', false), 'both-ok');
  assert.equal(L.check('vocabC', 'ta', false), 'wrong');
  assert.deepEqual(L.acceptingRows('vocabA', 'tcpip', false), []);
});

// ── rule 1: OSI ──

test('rule 1: OSI has seven rows o7…o1, each covering its own number', () => {
  const r = L.rowsOf('osi', false);
  assert.deepEqual(ids(r), ['o7', 'o6', 'o5', 'o4', 'o3', 'o2', 'o1']);
  r.forEach((x, i) => assert.deepEqual(x.covers, [7 - i]));
  assert.deepEqual(L.rowsOf('osi', true), r, 'layers5 does not touch OSI');
});

// ── rules 2 and 3: TCP/IP and the mapping ──

test('rule 2: TCP/IP has four rows; the 5-layer variant only splits fizički off podatkovni', () => {
  assert.deepEqual(ids(L.rowsOf('tcpip', false)), ['ta', 'tt', 'ti', 'tl']);
  assert.deepEqual(ids(L.rowsOf('tcpip', true)), ['ta', 'tt', 'ti', 'tl', 'tp']);
  assert.deepEqual(L.covers('tp', false), [], 'no physical row with four layers');
});

test('rule 3: mapping 5–7 → application, 4 → transport, 3 → internet, 1–2 → link (2 / 1 with five)', () => {
  assert.deepEqual(L.covers('ta', false), [5, 6, 7]);
  assert.deepEqual(L.covers('tt', false), [4]);
  assert.deepEqual(L.covers('ti', false), [3]);
  assert.deepEqual(L.covers('tl', false), [1, 2]);
  assert.deepEqual(L.covers('tl', true), [2]);
  assert.deepEqual(L.covers('tp', true), [1]);
  assert.deepEqual(L.span('ta', false), { lo: 5, hi: 7 });
  assert.deepEqual(L.span('tl', false), { lo: 1, hi: 2 });
  assert.deepEqual(L.span('tl', true), { lo: 2, hi: 2 });
  // every OSI layer lands in exactly one TCP/IP row, either way
  for (const l5 of [false, true]) {
    for (let n = 1; n <= 7; n++) assert.equal(L.rowsOf('tcpip', l5).filter((r) => r.covers.includes(n)).length, 1, `${n} ${l5}`);
  }
});

// ── rule 4: devices ──

test('rule 4: devices by the highest layer they read (hub 1, switch and AP 2, router 3, the ends 7)', () => {
  const want = { hub: 'o1', 'switch': 'o2', ap: 'o2', router: 'o3', computer: 'o7', server: 'o7' };
  for (const [c, r] of Object.entries(want)) {
    assert.equal(L.answer(c, 'osi', false), r, c);
    assert.equal(L.check(c, r, false), 'ok', c);
  }
  assert.equal(L.check('switch', 'o3', false), 'wrong', 'a switch does not read the network layer');
  assert.equal(L.check('router', 'o7', false), 'wrong', 'a router does not read everything');
  assert.equal(L.check('ap', 'ti', false), 'wrong', 'an access point is a bridge, not a router');
  assert.equal(L.check('router', 'ti', false), 'ok');
  assert.equal(L.check('hub', 'tl', false), 'ok');
  assert.equal(L.check('hub', 'tl', true), 'wrong');
  assert.equal(L.check('hub', 'tp', true), 'ok');
});

// ── rule 5: protocols ──

test('rule 5: protocols by layer; Ethernet and 802.11 on a layer-1-only row are wrong, with the physical-part note', () => {
  const want = { http: 'o7', dns: 'o7', tcp: 'o4', udp: 'o4', ip: 'o3', icmp: 'o3', ethernet: 'o2', wifi: 'o2' };
  for (const [c, r] of Object.entries(want)) assert.equal(L.check(c, r, false), 'ok', c);
  assert.equal(L.check('ethernet', 'o1', false), 'wrong');
  assert.equal(L.note('ethernet', 'o1', false), 'physPart');
  assert.equal(L.check('wifi', 'tp', true), 'wrong');
  assert.equal(L.note('wifi', 'tp', true), 'physPart');
  assert.equal(L.note('ethernet', 'tl', false), null, 'the 4-layer link row covers 1–2: no note');
  assert.equal(L.note('ethernet', 'o3', false), null, 'the physical-part note only on a layer-1-only row');
  assert.equal(L.note('wifi', 'tl', true), null);
  assert.equal(L.check('ip', 'o2', false), 'wrong');
  assert.equal(L.check('udp', 'ti', false), 'wrong');
});

// ── rule 6: ambiguous cards (tie-breaks above); primary answers ──

test('rule 6: an ambiguous card is revealed on its primary (first) layer', () => {
  assert.equal(L.answer('arp', 'osi', false), 'o2');
  assert.equal(L.answer('tls', 'osi', false), 'o6');
  assert.equal(L.answer('l3switch', 'osi', false), 'o3');
  assert.equal(L.answer('firewall', 'osi', false), 'o4');
  assert.equal(L.answer('vocabC', 'osi', false), 'o6');
});

// ── rule 7: problems ──

test('rule 7: the five problems of Primjer 1 are 1, 5, 6, 4, 4; out of order is 4, not 3, with the note', () => {
  assert.deepEqual(L.SETS.problems.map((c) => L.answer(c, 'osi', false)), ['o1', 'o5', 'o6', 'o4', 'o4']);
  assert.equal(L.check('order', 'o3', false), 'wrong');
  assert.equal(L.note('order', 'o3', false), 'notCause');
  assert.equal(L.note('order', 'ti', false), 'notCause');
  assert.equal(L.note('order', 'o4', false), null);
  assert.equal(L.note('identical', 'o3', false), null, 'only the out-of-order card has that note');
});

// ── rule 8: OSI-only problems on TCP/IP ──

test('rule 8: a problem at 5 or 6 on TCP/IP application is right, with the "TCP/IP does not name it" note', () => {
  for (const c of ['resume', 'chars']) {
    assert.equal(L.check(c, 'ta', false), 'ok', c);
    assert.equal(L.note(c, 'ta', false), 'tcpipNoName', c);
    assert.equal(L.note(c, 'tt', false), null, `${c}: wrong row, no note`);
  }
  assert.equal(L.note('computer', 'ta', false), null, 'a layer-7 card gets no note');
  assert.equal(L.note('resume', 'o5', false), null, 'not on OSI');
});

// ── rule 9: vocabulary ──

test('rule 9: sentences (a) OSI, (b) TCP/IP, (c) OSI; the other model\'s column gives the otherModel note', () => {
  assert.equal(L.answer('vocabA', 'osi', false), 'o5');
  assert.equal(L.answer('vocabA', 'tcpip', false), null);
  assert.equal(L.answer('vocabB', 'tcpip', false), 'ti');
  assert.equal(L.answer('vocabB', 'osi', false), null);
  assert.equal(L.answer('vocabC', 'tcpip', false), null);
  assert.equal(L.note('vocabA', 'ta', false), 'otherModel');
  assert.equal(L.note('vocabB', 'o3', false), 'otherModel');
  assert.equal(L.note('vocabB', 'ti', false), null);
});

test('rule 9: the vocab set always shows both columns', () => {
  assert.equal(L.effectiveModel(P({ set: 'vocab', model: 'osi' })), 'both');
  assert.equal(L.effectiveModel(P({ set: 'devices', model: 'osi' })), 'osi');
  assert.equal(L.initial(P({ set: 'vocab', model: 'tcpip' })).model, 'both');
});

// ── SPEC answer table: primary answers on TCP/IP (the Python check's output) ──

test('answer table: primary TCP/IP rows with four and with five layers', () => {
  const by = (l5) => {
    const out = {};
    for (const set of Object.values(L.SETS)) for (const c of set) {
      const r = L.answer(c, 'tcpip', l5);
      (out[r] = out[r] || []).push(c);
    }
    for (const k of Object.keys(out)) out[k].sort();
    return out;
  };
  const four = by(false);
  assert.deepEqual(four.ta, ['chars', 'computer', 'dns', 'http', 'resume', 'server', 'tls']);
  assert.deepEqual(four.tt, ['firewall', 'identical', 'order', 'tcp', 'udp']);
  assert.deepEqual(four.ti, ['icmp', 'ip', 'l3switch', 'router', 'vocabB']);
  assert.deepEqual(four.tl, ['ap', 'arp', 'cable', 'ethernet', 'hub', 'switch', 'wifi']);
  assert.deepEqual(four.null, ['vocabA', 'vocabC']);
  const five = by(true);
  assert.deepEqual(five.tp, ['cable', 'hub']);
  assert.deepEqual(five.tl, ['ap', 'arp', 'ethernet', 'switch', 'wifi']);
  assert.deepEqual(five.ta, four.ta);
});

test('answer table: the sets and their order', () => {
  assert.deepEqual(L.SETS.devices, ['computer', 'switch', 'router', 'server']);
  assert.deepEqual(L.SETS.extra, ['hub', 'ap', 'l3switch', 'firewall']);
  assert.deepEqual(L.SETS.protocols, ['http', 'dns', 'tcp', 'udp', 'ip', 'icmp', 'arp', 'ethernet', 'wifi', 'tls']);
  assert.deepEqual(L.SETS.vocab, ['vocabA', 'vocabB', 'vocabC']);
  for (const set of Object.values(L.SETS)) for (const c of set) assert.ok(L.CARDS[c], c);
});

// ── placements: hidden columns, layers5 fold, score ──

test('placements: a card in a hidden column is open; tp folds into tl without layers5', () => {
  assert.equal(L.visibleRow('ta', P({ model: 'osi' })), null);
  assert.equal(L.visibleRow('o3', P({ model: 'tcpip' })), null);
  assert.equal(L.visibleRow('o3', P({ model: 'tcpip', set: 'vocab' })), 'o3', 'vocab shows both');
  assert.equal(L.visibleRow('tp', P({ layers5: false })), 'tl');
  assert.equal(L.visibleRow('tp', P({ layers5: true })), 'tp');
  assert.equal(L.visibleRow(null, P()), null);
  assert.equal(L.visibleRow(undefined, P()), null);
});

test('score: ok, both, wrong, open over the tray (SPEC example), and hidden columns count as open', () => {
  const placed = { computer: 'o7', 'switch': 'o3', router: null, server: 'ta' };
  assert.deepEqual(L.score(placed, P()), { ok: 2, both: 0, wrong: 1, open: 1 });
  assert.deepEqual(L.score(placed, P({ model: 'osi' })), { ok: 1, both: 0, wrong: 1, open: 2 });
  assert.deepEqual(L.score({}, P({ set: 'protocols' })), { ok: 0, both: 0, wrong: 0, open: 10 });
  assert.deepEqual(L.score({ arp: 'o3', tls: 'ta', ethernet: 'o1' }, P({ set: 'protocols' })), { ok: 1, both: 1, wrong: 1, open: 7 });
  assert.deepEqual(L.score({ cable: 'tp' }, P({ set: 'problems' })), { ok: 1, both: 0, wrong: 0, open: 4 }, 'tp shown as tl');
  assert.deepEqual(L.score({ http: 'o7' }, P({ set: 'devices' })), { ok: 0, both: 0, wrong: 0, open: 4 }, 'other sets ignored');
});

test('place returns a new object and never mutates; null puts the card back', () => {
  const a = { http: 'o7' };
  const b = L.place(a, 'dns', 'o7');
  assert.deepEqual(a, { http: 'o7' });
  assert.deepEqual(b, { http: 'o7', dns: 'o7' });
  assert.deepEqual(L.place(b, 'http', null), { http: null, dns: 'o7' });
  assert.deepEqual(L.place(b, 'http', 'o4'), { http: 'o4', dns: 'o7' }, 'moving a card replaces its row');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [L.defaults].concat(L.presets.map((x) => P(x.params)))) {
    const s = L.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its input; explorer has no steps', () => {
  const p = P({ set: 'protocols' });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
  L.initial(p).cards.push('x');
  assert.deepEqual(L.SETS.protocols.length, 10, 'state does not share the set array');
  assert.equal(kit.stepsOf(L, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every card, row, set, model, note and preset has its words; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const lang of ['hr', 'en']) {
    const s = strings[lang];
    for (const c of Object.keys(L.CARDS)) for (const k of ['c_', 'r_']) assert.ok(s[k + c], `${lang} ${k}${c}`);
    for (const r of ['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'ta', 'tt', 'ti', 'tl', 'tp']) {
      assert.ok(s['row_' + r], `${lang} row_${r}`);
      assert.ok(s['pdu_' + r], `${lang} pdu_${r}`);
    }
    for (const k of Object.keys(L.SETS)) assert.ok(s['set_' + k], `${lang} set_${k}`);
    for (const k of ['osi', 'tcpip', 'both']) assert.ok(s['model_' + k], `${lang} model_${k}`);
    for (const k of ['otherModel', 'tcpipNoName', 'physPart', 'notCause']) assert.ok(s['n_' + k], `${lang} n_${k}`);
    for (const x of L.presets) assert.ok(s['p_' + x.id], `${lang} p_${x.id}`);
  }
  for (const x of L.presets) for (const k of Object.keys(x.params)) assert.ok(k in L.defaults, `${x.id}: ${k}`);
});
