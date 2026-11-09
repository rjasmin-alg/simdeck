// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for multiple-access (SPEC.md). Run: node --test sims/multiple-access/
// Tie-breaks first, then one test per rule, then the presets, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const preset = (id) => L.presets.find((x) => x.id === id).params;

// ── tie-breaks ──

test('tie-break (rule 3): a correlation of exactly 0 decides nothing; only a sign decides', () => {
  const s = S({ scheme: 'cdma', users: 2, bits: 1 });
  // codes 3 and 4 have no user: correlation 0, no bit
  assert.equal(s.cdma.decoded[2].corr, 0);
  assert.equal(s.cdma.decoded[2].sign, null);
  assert.equal(s.cdma.decoded[2].bit, null);
  assert.equal(s.cdma.decoded[3].bit, null);
  // +1 decides 1, −1 decides 0
  assert.equal(s.cdma.decoded[0].bit, 1);
  assert.equal(s.cdma.decoded[1].bit, 0);
});

test('tie-break (rule 6): users take the lowest free index in the order they were added; code reuse starts at code 1', () => {
  const s = S({ users: 5 });
  assert.deepEqual(s.users.map((u) => u.code), [0, 1, 2, 3, 0]);
  assert.deepEqual(s.fdma.channels.map((c) => c.user), [1, 2, 3, 4, 5]);
  assert.deepEqual(s.fdma.channels.map((c) => c.loKHz), [0, 20.5, 41, 61.5, 82]);
  assert.deepEqual(s.tdma.slots.map((x) => x.user), [1, 2, 3, 4]);
  assert.deepEqual(s.tdma.refused, [5]);
  // an idle user keeps its index: user 2 idle does not move users 3 and 4 down
  const idle = S({ users: 4, idle: 2 });
  assert.deepEqual(idle.fdma.channels.map((c) => [c.user, c.active]), [[1, true], [2, false], [3, true], [4, true]]);
  assert.deepEqual(idle.fdma.channels.map((c) => c.loKHz), S({ users: 4 }).fdma.channels.map((c) => c.loKHz));
  assert.deepEqual(idle.users.map((u) => u.code), [0, 1, 2, 3]);
});

test('tie-break (rule 5): capacity is a floor; exactly at the limit still fits', () => {
  // (100 + 2.5)/(12.5 + 2.5) = 6.83 → 6; (100 + 0)/(12.5 + 0) = 8 exactly → 8
  assert.equal(L.capacity('fdma', 100, true), 6);
  assert.equal(L.capacity('fdma', 100, false), 8);
  assert.equal(L.capacity('fdma', 12.5, true), 1);
  assert.equal(L.capacity('fdma', 12.5, false), 1);
  // 4 users fill TDMA and CDMA exactly: served, no overflow
  for (const k of ['tdma', 'cdma']) {
    const s = S({ scheme: k, users: 4 });
    assert.equal(s[k].overflow, false, k);
    assert.equal(s[k].capacityLeft, 0, k);
  }
});

// ── rules ──

test('rule 1: FDMA splits the band into N channels of (B − (N − 1)·guard)/N, kept even when silent', () => {
  const s = S({ users: 4 });
  assert.equal(s.fdma.perUser.bandwidthKHz, 23.125);
  assert.deepEqual(s.fdma.channels.map((c) => [c.loKHz, c.hiKHz]), [[0, 23.125], [25.625, 48.75], [51.25, 74.375], [76.875, 100]]);
  assert.deepEqual(s.fdma.guards.map((g) => [g.loKHz, g.hiKHz]), [[23.125, 25.625], [48.75, 51.25], [74.375, 76.875]]);
  assert.equal(s.fdma.guardShare, 0.075);
  assert.equal(s.fdma.perUser.timeShare, 1);
  // no guard: 4 × 25 kHz, no guard bands
  const ng = S({ users: 4, guard: false });
  assert.equal(ng.fdma.perUser.bandwidthKHz, 25);
  assert.deepEqual(ng.fdma.guards, []);
  assert.equal(ng.fdma.guardShare, 0);
  // one user has the whole band
  assert.equal(S({ users: 1 }).fdma.perUser.bandwidthKHz, 100);
  // idle: the channel stays, unused
  const idle = S({ users: 4, idle: 2 });
  assert.equal(idle.fdma.channels.length, 4);
  assert.equal(idle.fdma.idleShare, 0.23125);
  assert.equal(idle.fdma.usedShare, 0.69375);
});

test('rule 2: TDMA splits the frame into N slots of (frame − N·guardTime)/N on the whole band', () => {
  const s = S({ scheme: 'tdma', users: 4 });
  assert.deepEqual(s.tdma.slots.map((x) => [x.startMs, x.endMs]), [[0, 12.5], [15, 27.5], [30, 42.5], [45, 57.5]]);
  assert.deepEqual(s.tdma.guards.map((g) => [g.startMs, g.endMs]), [[12.5, 15], [27.5, 30], [42.5, 45], [57.5, 60]]);
  assert.equal(s.tdma.perUser.bandwidthKHz, 100);
  assert.equal(s.tdma.perUser.timeShare, 0.208333333);
  assert.equal(s.tdma.guardShare, 0.166666667);
  const ng = S({ scheme: 'tdma', users: 3, guard: false });
  assert.deepEqual(ng.tdma.slots.map((x) => x.lenMs), [20, 20, 20]);
  assert.deepEqual(ng.tdma.guards, []);
  // idle: the slot stays, unused
  const idle = S({ scheme: 'tdma', users: 3, idle: 3 });
  assert.equal(idle.tdma.slots[2].active, false);
  assert.equal(idle.tdma.idleShare, 0.291666667);
});

test('rule 3: CDMA users send at once; the air is Σ d·c; receiver j gets (Σ chips × c_j)/L', () => {
  const s = S({ scheme: 'cdma', users: 4, bits: 13 });   // bits 1, 0, 1, 1
  assert.deepEqual(s.cdma.rows.map((r) => r.d), [1, -1, 1, 1]);
  assert.deepEqual(s.cdma.rows[1].chips, [-1, 1, -1, 1]);
  assert.deepEqual(s.cdma.sumChips, [2, 2, -2, 2]);
  assert.deepEqual(s.cdma.decoded.map((d) => d.corr), [1, -1, 1, 1]);
  assert.deepEqual(s.cdma.decoded.map((d) => d.bit), [1, 0, 1, 1]);
  assert.deepEqual(s.cdma.decoded[1].products, [2, -2, -2, -2]);
  // everyone has the whole band all the time
  assert.deepEqual(s.cdma.perUser, { bandwidthKHz: 100, timeShare: 1, share: 1 });
  // an idle user is absent: d = 0, its receiver reads 0
  const idle = S({ scheme: 'cdma', users: 4, idle: 3, bits: 13 });
  assert.deepEqual(idle.cdma.rows[2].chips, [0, 0, 0, 0]);
  assert.equal(idle.cdma.decoded[2].corr, 0);
  assert.equal(idle.cdma.decoded[2].bit, null);
  assert.deepEqual(idle.cdma.decoded.map((d) => d.bit), [1, 0, null, 1]);
  assert.equal(idle.cdma.idleShare, 0);
  assert.equal(idle.cdma.usedShare, 1);
  // nobody sending: nothing used
  const none = S({ scheme: 'cdma', users: 1, idle: 1 });
  assert.equal(none.cdma.usedShare, 0);
  assert.equal(none.cdma.freeShare, 1);
  assert.deepEqual(none.cdma.sumChips, [0, 0, 0, 0]);
});

test('rule 4: the four Walsh codes are mutually orthogonal; a code nobody holds correlates to 0', () => {
  assert.deepEqual(L.CODES, [[1, 1, 1, 1], [1, -1, 1, -1], [1, 1, -1, -1], [1, -1, -1, 1]]);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const dot = L.CODES[i].reduce((a, x, k) => a + x * L.CODES[j][k], 0);
    assert.equal(dot, i === j ? 4 : 0, `${i}·${j}`);
  }
  // every bit combination of three users: receiver 4 (no user) always reads 0, the others read their own bit
  for (let bits = 0; bits < 8; bits++) {
    const s = S({ scheme: 'cdma', users: 3, bits });
    assert.equal(s.cdma.decoded[3].corr, 0);
    for (let id = 1; id <= 3; id++) assert.equal(s.cdma.decoded[id - 1].bit, L.bitOf(bits, id));
  }
});

test('rule 5: past capacity FDMA and TDMA refuse the extra user; CDMA reuses a code and the two collide', () => {
  // TDMA: 5 users, 4 slots
  const t = S({ scheme: 'tdma', users: 5 });
  assert.equal(t.tdma.overflow, true);
  assert.equal(t.tdma.served, 4);
  assert.deepEqual(t.tdma.refused, [5]);
  assert.equal(t.tdma.slots.length, 4);
  // FDMA in 12.5 kHz: one channel; users 2 and 3 refused (a channel would be 2.5 kHz)
  const f = S({ users: 3, band: 12.5 });
  assert.equal(f.fdma.served, 1);
  assert.deepEqual(f.fdma.refused, [2, 3]);
  assert.equal(f.fdma.wouldBeKHz, 2.5);
  assert.equal(f.fdma.channels.length, 1);
  assert.equal(f.fdma.channels[0].widthKHz, 12.5);
  // FDMA in 100 kHz holds all 5 (6 fit)
  assert.equal(S({ users: 5 }).fdma.overflow, false);
  assert.equal(S({ users: 5 }).fdma.capacityLeft, 1);
  // CDMA: user 5 shares code 1 with user 1; opposite bits cancel (0), equal bits add (±2): unreadable either way
  const opp = S({ scheme: 'cdma', users: 5, bits: 13 });   // user 1 sends 1, user 5 sends 0
  assert.equal(opp.cdma.overflow, true);
  assert.deepEqual(opp.cdma.refused, []);
  assert.deepEqual(opp.cdma.reused, [5]);
  assert.deepEqual(opp.cdma.collided, [1, 5]);
  assert.equal(opp.cdma.decoded[0].corr, 0);
  assert.equal(opp.cdma.decoded[0].bit, null);
  const same = S({ scheme: 'cdma', users: 5, bits: 13 | 16 });
  assert.equal(same.cdma.decoded[0].corr, 2);
  assert.equal(same.cdma.decoded[0].collision, true);
  assert.equal(same.cdma.decoded[0].bit, null);
  const both0 = S({ scheme: 'cdma', users: 5, bits: 0 });
  assert.equal(both0.cdma.decoded[0].corr, -2);
  assert.equal(both0.cdma.decoded[0].bit, null);
  // the other codes are still read correctly
  assert.deepEqual(opp.cdma.decoded.slice(1).map((d) => d.bit), [0, 1, 1]);
  // one of the two idle: no collision, the other is read
  const idle5 = S({ scheme: 'cdma', users: 5, idle: 5, bits: 13 });
  assert.equal(idle5.cdma.decoded[0].collision, false);
  assert.deepEqual(idle5.cdma.decoded[0].holders, [1, 5]);   // the silent user still holds its code
  assert.deepEqual(idle5.cdma.decoded[0].senders, [1]);
  // served: a collided user is not served (no bit can be read), a silent one is
  assert.equal(opp.cdma.served, 3);
  assert.equal(idle5.cdma.served, 5);
  assert.equal(idle5.cdma.decoded[0].bit, 1);
  assert.deepEqual(idle5.cdma.collided, []);
});

test('counters: users served, capacity left, unused share; the shares of the plane add up to 1', () => {
  for (const scheme of L.SCHEMES) for (let users = 1; users <= 5; users++) for (let idle = 0; idle <= 5; idle++)
    for (const guard of [true, false]) for (const band of L.BANDS) {
      const x = S({ scheme, users, idle, guard, band })[scheme];
      const sum = x.usedShare + x.idleShare + x.guardShare + x.freeShare;
      assert.ok(Math.abs(sum - 1) < 1e-6, `${scheme} ${users} ${idle} ${guard} ${band}: ${sum}`);
      assert.equal(x.served + x.refused.length + (x.collided ? x.collided.length : 0), users);
      assert.equal(x.capacityLeft, Math.max(0, x.capacity - users));
    }
});

test('changed: FDMA and TDMA re-partition every strip; CDMA keeps the old codes and marks only the new user', () => {
  const f = L.changed(S({ users: 3 }), S({ users: 4 }));
  assert.deepEqual(f.users, [1, 2, 3, 4]);   // channel 1 still starts at 0, but its top edge moved
  // idling a user moves nothing
  assert.deepEqual(L.changed(S({ users: 4 }), S({ users: 4, idle: 2 })).users, []);
  const t = L.changed(S({ scheme: 'tdma', users: 2 }), S({ scheme: 'tdma', users: 3 }));
  assert.deepEqual(t.users, [1, 2, 3]);
  const c = L.changed(S({ scheme: 'cdma', users: 2 }), S({ scheme: 'cdma', users: 3 }));
  assert.deepEqual(c.users, [3]);
  assert.deepEqual(c.chips, [0, 1, 2, 3]);
  // a flipped bit changes that user's chips only
  const b = L.changed(S({ scheme: 'cdma', users: 2, bits: 1 }), S({ scheme: 'cdma', users: 2, bits: 3 }));
  assert.deepEqual(b.users, [2]);
  // a scheme switch marks nothing; no change marks nothing
  assert.deepEqual(L.changed(S({}), S({ scheme: 'tdma' })), { users: [], chips: [] });
  assert.deepEqual(L.changed(S({}), S({})), { users: [], chips: [] });
  assert.deepEqual(L.changed(null, S({})), { users: [], chips: [] });
  // a scheme switch together with another change still marks nothing
  assert.deepEqual(L.changed(S({ users: 3 }), S({ scheme: 'tdma', users: 4 })), { users: [], chips: [] });
  assert.deepEqual(L.changed(S({ scheme: 'tdma', users: 3 }), S({ scheme: 'cdma', users: 4 })), { users: [], chips: [] });
});

// ── presets (SPEC.md table) ──

test('preset fdma-4: 4 channels of 23.125 kHz with three 2.5 kHz guards; 6 fit, 2 left', () => {
  const s = S(preset('fdma-4'));
  assert.equal(s.scheme, 'fdma');
  assert.equal(s.fdma.channels.length, 4);
  assert.equal(s.fdma.perUser.bandwidthKHz, 23.125);
  assert.equal(s.fdma.capacity, 6);
  assert.equal(s.fdma.capacityLeft, 2);
  assert.equal(s.fdma.usedShare, 0.925);
});

test('preset fdma-idle: user 2 silent, its 23.125 kHz (1 of 4 channels, 23.1 % of the band) unused', () => {
  const s = S(preset('fdma-idle'));
  assert.equal(s.idle, 2);
  assert.equal(s.fdma.idleShare, 0.23125);
  assert.equal(s.fdma.served, 4);
});

test('preset tdma-dmr: 2 users in one 12.5 kHz channel, 2 slots of 27.5 ms + 2.5 ms guard = 30 ms per 60 ms frame', () => {
  const s = S(preset('tdma-dmr'));
  assert.equal(s.bandKHz, 12.5);
  assert.deepEqual(s.tdma.slots.map((x) => [x.startMs, x.endMs]), [[0, 27.5], [30, 57.5]]);
  assert.equal(s.tdma.perUser.bandwidthKHz, 12.5);
  assert.equal(s.tdma.perUser.timeShare, 0.458333333);
});

test('preset cdma-2: air (0, 2, 0, 2); receiver 1 +1 → 1, receiver 2 −1 → 0, code + + − − reads 0 (nobody)', () => {
  const s = S(preset('cdma-2'));
  assert.deepEqual(s.cdma.sumChips, [0, 2, 0, 2]);
  assert.deepEqual(s.cdma.decoded.map((d) => [d.corr, d.bit]), [[1, 1], [-1, 0], [0, null], [0, null]]);
  assert.deepEqual(s.cdma.decoded[2].holders, []);
});

test('preset cdma-overflow: 5 users on 4-chip codes; user 5 reuses code 1; receiver 1 reads 0 and cannot decide', () => {
  const s = S(preset('cdma-overflow'));
  assert.deepEqual(s.cdma.sumChips, [1, 1, -3, 1]);
  assert.deepEqual(s.cdma.decoded.map((d) => d.corr), [0, -1, 1, 1]);
  assert.equal(s.cdma.decoded[0].bit, null);
  assert.deepEqual(s.cdma.decoded[0].holders, [1, 5]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset, the defaults and a spread of params; bad params fall back', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  const bad = S({ scheme: 'ofdma', users: 99, idle: -3, bits: 'x', band: 7 });
  assert.equal(bad.scheme, 'fdma'); assert.equal(bad.n, 5); assert.equal(bad.idle, 0);
  assert.equal(bad.bits, 13); assert.equal(bad.bandKHz, 100);
  // idle beyond the users is ignored
  assert.equal(S({ users: 2, idle: 4 }).idle, 0);
  assert.equal(S({ users: 2, idle: 4 }).fdma.idleShare, 0);
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ scheme: 'cdma', users: 5, idle: 3, bits: 22 });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
});

test('bit helpers', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((id) => L.bitOf(13, id)), [1, 0, 1, 1, 0]);
  assert.equal(L.flipBit(13, 2), 15);
  assert.equal(L.flipBit(15, 2), 13);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a name and hint in both languages; the page is an explorer', () => {
  for (const pr of L.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k}`);
    for (const key of ['preset_' + pr.id, 'preset_' + pr.id + 'Hint']) assert.ok(strings.hr[key] && strings.en[key], key);
  }
  assert.deepEqual(L.presets.map((x) => x.id), ['fdma-4', 'fdma-idle', 'tdma-dmr', 'cdma-2', 'cdma-overflow']);
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.id, 'multiple-access');
});

test('constants SPEC.md names', () => {
  assert.equal(L.MIN_CHANNEL_KHZ, 12.5); assert.equal(L.GUARD_KHZ, 2.5);
  assert.equal(L.FRAME_MS, 60); assert.equal(L.GUARD_MS, 2.5); assert.equal(L.MAX_SLOTS, 4);
  assert.equal(L.MAX_USERS, 5); assert.equal(L.L, 4); assert.deepEqual(L.BANDS, [100, 12.5]);
  assert.deepEqual(L.defaults, { scheme: 'fdma', users: 4, idle: 0, bits: 13, guard: true, band: 100 });
});
