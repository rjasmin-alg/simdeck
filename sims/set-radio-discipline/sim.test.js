// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-radio-discipline's model (rules in SPEC.md). Run: node --test sims/set-radio-discipline/
// The "radio" tests cover radio.js (the shared channel, rules 5–11) with small hand-made runs; they move with it to
// models/. The "scene" tests cover sim.js (rules 1–4, 12, 13) and the presets.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const radio = require('./radio.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;

/** A segment: channel, talk, copy, priority. */
const S = (ch, len, copy = 0, prio = false) => ({ ch, len, copy, prio });
/** A small run: radios [{ deaf, backoff }] (default two hearing radios, backoff 3), arrivals [t, radio, segs, opts]. */
function R(arrivals, opts = {}) {
  return radio.run({
    len: opts.len || 40,
    radios: opts.radios || [{ deaf: false, backoff: 3 }, { deaf: false, backoff: 3 }],
    arrivals: arrivals.map(([t, r, segs, o]) => Object.assign({ t, radio: r, tag: 'x', segs }, o || {})),
    gap: opts.gap || 0,
    retryUrgent: opts.retryUrgent == null ? 1 : opts.retryUrgent
  });
}
const span = (x) => [x.radio, x.ch, x.start, x.end];

// ── radio: tie-breaks first ──

test('radio tie-break (rule 6): two radios that press in the same second do not hear each other; both are doubled', () => {
  const res = R([[5, 0, [S('main', 4)]], [5, 1, [S('main', 4)]]]);
  assert.deepEqual(res.tx.map(span), [[0, 'main', 5, 9], [1, 'main', 5, 9]]);
  assert.ok(res.tx.every((x) => x.doubled));
  assert.deepEqual(res.msgs.map((m) => m.outcome), ['lost', 'lost'], 'no copy expected: lost, nobody knows');
});

test('radio tie-break (rule 6): the whole queue presses the second the channel goes quiet', () => {
  const res = R([[0, 0, [S('main', 6)]], [2, 1, [S('main', 3)]]],
    { radios: [{ deaf: false, backoff: 3 }, { deaf: false, backoff: 3 }, { deaf: false, backoff: 3 }] });
  assert.deepEqual(res.tx.map(span), [[0, 'main', 0, 6], [1, 'main', 6, 9]], 'waits while busy, presses at the end second');
  assert.equal(res.tx[1].doubled, false);
  const three = R([[0, 0, [S('main', 6)]], [2, 1, [S('main', 3)]], [3, 2, [S('main', 3)]]],
    { radios: [{ deaf: false, backoff: 3 }, { deaf: false, backoff: 3 }, { deaf: false, backoff: 3 }] });
  assert.deepEqual(three.tx.slice(1).map(span), [[1, 'main', 6, 9], [2, 'main', 6, 9]]);
  assert.ok(three.tx[1].doubled && three.tx[2].doubled);
  assert.equal(three.tx[0].doubled, false, 'the one that ended at 6 is not touched');
  assert.deepEqual(three.queue.slice(0, 8), [0, 0, 1, 2, 2, 2, 0, 0], 'two waiting from 3 to 5');
});

test('radio tie-break (rule 7): back to back is not doubled; one shared second is', () => {
  const far = [{ deaf: false, backoff: 3 }, { deaf: true, backoff: 3 }];
  const touch = R([[0, 0, [S('main', 5)]], [5, 1, [S('main', 3)]]], { radios: far });
  assert.deepEqual(touch.tx.map((x) => x.doubled), [false, false]);
  const share = R([[0, 0, [S('main', 5)]], [4, 1, [S('main', 3)]]], { radios: far });
  assert.deepEqual(share.tx.map((x) => x.doubled), [true, true]);
});

test('radio tie-break (rule 6): with a gap an ordinary segment waits one quiet second; a priority one does not', () => {
  const g = R([[0, 0, [S('main', 4)]], [1, 1, [S('main', 2)]]], { gap: 1 });
  assert.deepEqual(g.tx[1].start, 5, 'quiet at 4, presses at 5');
  const p = R([[0, 0, [S('main', 4)]], [1, 1, [S('main', 2, 0, true)]]], { gap: 1 });
  assert.equal(p.tx[1].start, 4);
  const both = R([[0, 0, [S('main', 4)]], [1, 1, [S('main', 2, 0, true)]], [1, 2, [S('main', 3)]]],
    { gap: 1, radios: [{ deaf: false, backoff: 3 }, { deaf: false, backoff: 3 }, { deaf: false, backoff: 3 }] });
  assert.deepEqual(both.tx.slice(1).map(span), [[1, 'main', 4, 6], [2, 'main', 7, 10]], 'priority first, the other after a quiet second');
  assert.ok(both.tx.every((x) => !x.doubled));
  const idle = R([[3, 1, [S('main', 2)]]], { gap: 1 });
  assert.equal(idle.tx[0].start, 3, 'a channel quiet for long: no extra wait');
});

test('radio tie-break (rule 5): the last second of a transmission is its end − 1; the channel is free at its end', () => {
  const res = R([[0, 0, [S('main', 3, 1)]], [1, 1, [S('main', 2)]]]);
  assert.deepEqual(res.tx.map(span), [[0, 'main', 0, 4], [1, 'main', 4, 6]], 'talk 3 + copy 1 occupies 0…3');
  assert.equal(res.tx[0].talk, 3);
  assert.equal(res.tx[0].copy, 1);
});

// ── radio: rules ──

test('radio rule 6: the far radio hears nobody and presses over whoever is talking; the floor hears it', () => {
  const radios = [{ deaf: false, backoff: 3 }, { deaf: true, backoff: 3 }];
  const res = R([[0, 0, [S('main', 6)]], [2, 1, [S('main', 3)]]], { radios });
  assert.deepEqual(res.tx.map(span), [[0, 'main', 0, 6], [1, 'main', 2, 5]]);
  assert.ok(res.tx.every((x) => x.doubled));
  const heard = R([[0, 1, [S('main', 6)]], [2, 0, [S('main', 3)]]], { radios });
  assert.deepEqual(heard.tx.map(span), [[1, 'main', 0, 6], [0, 'main', 6, 9]], 'the floor waits for the far radio');
  assert.ok(heard.tx.every((x) => !x.doubled));
});

test('radio rule 7: different channels never interfere', () => {
  const res = R([[0, 0, [S('main', 5)]], [0, 1, [S('side', 5)]]]);
  assert.deepEqual(res.tx.map((x) => [x.start, x.doubled]), [[0, false], [0, false]]);
});

test('radio rule 8: a doubled segment is repeated only when a copy was expected, after the radio\'s own pause', () => {
  const radios = [{ deaf: false, backoff: 2 }, { deaf: false, backoff: 5 }];
  const res = R([[0, 0, [S('main', 3, 1)]], [0, 1, [S('main', 3, 1)]]], { radios });
  assert.deepEqual(res.tx.map(span), [[0, 'main', 0, 4], [1, 'main', 0, 4], [0, 'main', 6, 10], [1, 'main', 10, 14]]);
  assert.deepEqual(res.tx.map((x) => [x.doubled, x.noticed, x.repeat, x.lost]),
    [[true, true, true, false], [true, true, true, false], [false, false, false, false], [false, false, false, false]]);
  assert.deepEqual(res.msgs.map((m) => [m.outcome, m.tries]), [['heard', 2], ['heard', 2]]);
});

test('radio rule 8: without a copy the message is lost and its later segments are not sent', () => {
  const res = R([[0, 0, [S('main', 2), S('side', 5)]], [0, 1, [S('main', 2)]]]);
  assert.deepEqual(res.tx.map(span), [[0, 'main', 0, 2], [1, 'main', 0, 2]]);
  assert.ok(res.tx.every((x) => x.lost && !x.repeat));
  assert.equal(res.msgs[0].outcome, 'lost');
});

test('radio rule 8: a doubled urgent segment is repeated after retryUrgent, copy or not', () => {
  const res = R([[0, 0, [S('main', 2)], { urgent: true }], [0, 1, [S('main', 4)]]], { retryUrgent: 1 });
  assert.deepEqual(res.tx.map(span), [[0, 'main', 0, 2], [1, 'main', 0, 4], [0, 'main', 4, 6]],
    'ready at 3, but the channel is busy until 4');
  assert.equal(res.heard, 6);
  const r3 = R([[0, 0, [S('main', 2)], { urgent: true }], [0, 1, [S('main', 2)]]], { retryUrgent: 3 });
  assert.equal(r3.tx[2].start, 5);
});

test('radio rule 9: a heard segment readies the next at once; the message is heard when its last segment is', () => {
  const res = R([[0, 0, [S('main', 2, 1), S('side', 4, 1)]]]);
  assert.deepEqual(res.tx.map(span), [[0, 'main', 0, 3], [0, 'side', 3, 8]]);
  assert.deepEqual([res.msgs[0].outcome, res.msgs[0].end], ['heard', 8]);
});

test('radio rule 9: when the urgent call is heard, the floor stops; the far radio goes on', () => {
  const radios = [{ deaf: false, backoff: 3 }, { deaf: false, backoff: 3 }, { deaf: true, backoff: 3 }];
  const res = R([
    [0, 0, [S('main', 2)], { urgent: true }],
    [1, 1, [S('main', 3)]], [1, 1, [S('main', 3)]],
    [5, 1, [S('own', 3)]], [5, 2, [S('main', 3)]]
  ], { radios });
  assert.equal(res.heard, 2);
  assert.deepEqual(res.msgs.map((m) => m.outcome), ['heard', 'dropped', 'dropped', 'heard'], 'radio 1 queue dropped, its 5 s message never made');
  assert.deepEqual(res.tx.map(span), [[0, 'main', 0, 2], [2, 'main', 5, 8]]);
  assert.equal(res.msgs.length, 4);
});

test('radio rule 10: one segment at a time, messages in arrival order', () => {
  const res = R([[0, 0, [S('own', 5)]], [1, 0, [S('main', 2)]], [1, 0, [S('main', 1)]]]);
  assert.deepEqual(res.tx.map(span), [[0, 'own', 0, 5], [0, 'main', 5, 7], [0, 'main', 7, 8]]);
  assert.deepEqual(res.queue.slice(0, 9), [0, 0, 0, 0, 0, 0, 0, 0, 0], 'on air or busy with another channel: not in the main queue');
});

test('radio rule 10: the queue counts radios ready for main and not on air, not messages', () => {
  const res = R([[0, 0, [S('main', 4)]], [1, 1, [S('main', 2)]], [1, 1, [S('main', 2)]]]);
  assert.deepEqual(res.queue.slice(0, 9), [0, 1, 1, 1, 0, 0, 0, 0, 0]);
  assert.deepEqual(res.tx.map(span), [[0, 'main', 0, 4], [1, 'main', 4, 6], [1, 'main', 6, 8]]);
});

test('radio rule 4: a "first" message drops the radio\'s queue and cuts its own transmission', () => {
  const res = R([[0, 0, [S('main', 10)]], [1, 0, [S('main', 3)]], [4, 0, [S('main', 2)], { first: true, urgent: true }]]);
  assert.deepEqual(res.tx.map((x) => [x.start, x.end, x.cut]), [[0, 4, true], [4, 6, false]]);
  assert.deepEqual(res.msgs.map((m) => m.outcome), ['dropped', 'dropped', 'heard']);
  assert.equal(res.heard, 6);
});

// ── scene: rules ──

test('scene rule 1: arrivals at 30 s, with the stop at 40; the far radio every 60 s', () => {
  const arr = logic.arrivals(logic.clean(P())).filter((a) => a.t <= 70);
  assert.deepEqual(arr.map((a) => [a.t, logic.IDS[a.radio], a.tag]), [
    [3, 'grip', 'own'], [8, 'ad', 'ad'], [9, 'camera', 'own'], [9, 'base', 'ad'], [14, 'art', 'own'], [26, 'electric', 'cross'],
    [33, 'grip', 'cross'], [38, 'ad', 'ad'], [39, 'camera', 'cross'], [40, 'ad', 'stop'], [44, 'art', 'ad'], [56, 'electric', 'own'],
    [63, 'grip', 'ad'], [68, 'ad', 'ad'], [69, 'camera', 'own'], [69, 'base', 'ad']
  ]);
  const at60 = logic.arrivals(logic.clean(P({ rate: 60 }))).filter((a) => a.t < 40).map((a) => [a.t, logic.IDS[a.radio]]);
  assert.deepEqual(at60, [[6, 'grip'], [15, 'ad'], [18, 'camera'], [18, 'base'], [27, 'art']]);
  assert.equal(logic.arrivals(logic.clean(P())).filter((a) => a.tag === 'stop').length, 1);
});

test('scene rule 4: a call the 1st AD would make at second 40 is replaced by the stop', () => {
  const ad = logic.STATIONS[0], keep = ad.phase;
  try {
    ad.phase = 10 / 15;                    // first call at 10, then 25, 40, 55 at the 15 s rate
    const arr = logic.arrivals(logic.clean(P({ rate: 15 }))).filter((a) => a.radio === 0 && a.t <= 55);
    assert.deepEqual(arr.map((a) => [a.t, a.tag]), [[10, 'ad'], [25, 'ad'], [40, 'stop'], [55, 'ad']]);
  } finally { ad.phase = keep; }
});

test('scene rule 1: the radios\' fixed timing and pauses', () => {
  assert.deepEqual(logic.STATIONS.map((s) => [s.id, s.phase, s.every, s.backoff, s.far]), [
    ['ad', 0.25, 1, 2, false], ['camera', 0.3, 1, 3, false], ['electric', 0.85, 1, 4, false],
    ['grip', 0.1, 1, 5, false], ['art', 0.45, 1, 6, false], ['base', 0.15, 2, 7, true]
  ]);
});

test('scene rule 2: params are cleaned', () => {
  assert.deepEqual(logic.clean({}), { channels: 'one', rate: 30, len: 12, short: false, side: false, word: false });
  assert.deepEqual(logic.clean({ channels: 'many', rate: 45, len: 'x', short: 'yes', side: 1, word: true }),
    { channels: 'one', rate: 30, len: 12, short: false, side: false, word: true });
  assert.equal(logic.clean({ len: 7 }).len, 8);
  assert.equal(logic.clean({ len: 5 }).len, 6, 'half rounds up');
  assert.equal(logic.clean({ len: 1 }).len, 4);
  assert.equal(logic.clean({ len: 99 }).len, 20);
  assert.equal(logic.clean({ len: '10' }).len, 10);
  assert.equal(logic.clean({ len: '' }).len, 12);
  assert.equal(logic.clean({ len: null }).len, 12);
  assert.equal(logic.clean({ len: Infinity }).len, 20);
  assert.equal(logic.clean({ len: -Infinity }).len, 4);
  assert.equal(logic.clean({ rate: '15' }).rate, 15);
  assert.equal(logic.clean({ channels: 'own' }).channels, 'own');
});

test('scene rule 3: routing of each kind', () => {
  const r = (over, kind, id = 'grip') => logic.route(logic.clean(P(over)), id, kind).map((s) => [s.ch, s.len, s.copy, s.role]);
  assert.deepEqual(r({}, 'own'), [['main', 12, 0, 'msg']]);
  assert.deepEqual(r({}, 'ad'), [['main', 12, 0, 'msg']]);
  assert.deepEqual(r({ channels: 'own' }, 'own'), [['own-grip', 12, 0, 'msg']]);
  assert.deepEqual(r({ channels: 'own' }, 'cross'), [['main', 12, 0, 'msg']]);
  assert.deepEqual(r({ short: true }, 'ad'), [['main', 4, 1, 'msg']]);
  assert.deepEqual(r({ short: true, len: 4 }, 'ad'), [['main', 4, 1, 'msg']]);
  assert.deepEqual(r({ side: true }, 'cross'), [['main', 2, 0, 'hail'], ['side', 12, 0, 'msg']]);
  assert.deepEqual(r({ side: true }, 'own'), [['main', 2, 0, 'hail'], ['side', 12, 0, 'msg']], 'one channel: own talk moves too');
  assert.deepEqual(r({ side: true, channels: 'own' }, 'own'), [['own-grip', 12, 0, 'msg']], 'already on its own channel');
  assert.deepEqual(r({ side: true, short: true }, 'cross'), [['main', 2, 1, 'hail'], ['side', 4, 1, 'msg']]);
  assert.deepEqual(r({ side: true, short: true, word: true }, 'ad'), [['main', 4, 1, 'msg']], 'for the 1st AD: stays on main');
  assert.ok(logic.route(logic.clean(P()), 'grip', 'ad').every((s) => s.prio === false));
});

test('scene rule 3: the stop is 2 s on main without copy; a priority segment only with the word', () => {
  const stop = (over) => logic.arrivals(logic.clean(P(over))).find((a) => a.tag === 'stop');
  assert.deepEqual(stop({}).segs.map((s) => [s.ch, s.len, s.copy, s.prio, s.role]), [['main', 2, 0, false, 'stop']]);
  assert.deepEqual(stop({ word: true, short: true }).segs.map((s) => [s.ch, s.len, s.copy, s.prio]), [['main', 2, 0, true]]);
  assert.ok(stop({}).urgent && stop({}).first);
});

test('scene rule 4: the 1st AD talking at 0:40 lets go at once', () => {
  const s = D({ channels: 'own', rate: 30 });
  const cut = s.tx.filter((x) => x.cut);
  assert.deepEqual(cut.map((x) => [x.st, x.start, x.end]), [['ad', 38, 40]]);
});

test('scene rule 6: the word lets the stop in before the queue', () => {
  const main = (s) => s.tx.filter((x) => x.ch === 'main' && x.start >= 38 && x.start < 66)
    .map((x) => [x.st, x.start, x.end, x.role, x.doubled]);
  // Without the word the stop waits for grip (on air to 50), then the queue presses with it at 50 and again at 62.
  assert.deepEqual(main(D({ channels: 'own' })), [
    ['ad', 38, 40, 'msg', true], ['grip', 38, 50, 'msg', true],
    ['ad', 50, 52, 'stop', true], ['camera', 50, 62, 'msg', true], ['art', 50, 62, 'msg', true], ['ad', 62, 64, 'stop', false]
  ]);
  // With it (long messages still): the queue waits a quiet second, so the stop goes alone at 51, after the 12 s on air.
  assert.deepEqual(main(D({ channels: 'own', word: true })), [
    ['ad', 39, 40, 'msg', true], ['camera', 39, 51, 'msg', true], ['grip', 39, 51, 'msg', true], ['ad', 51, 53, 'stop', false]
  ]);
  assert.equal(D({ channels: 'own', word: true }).delay, 13, 'the word waits for what is on air');
  const short = D({ channels: 'own', word: true, short: true });
  assert.deepEqual([short.delay, short.reason, short.waited], [6, 'wait', 4], 'short messages: it waits only 4 s');
});

test('scene rule 9: after the stop is heard only the far radio talks', () => {
  for (const id of ['crowded', 'quiet', 'own', 'short', 'side', 'word']) {
    const s = logic.derive(preset(id));
    if (s.heard === null) continue;
    const after = s.tx.filter((x) => x.start >= s.heard);
    assert.ok(after.every((x) => x.st === 'base'), id);
  }
});

test('scene rule 11: a transmission that ends exactly at 120 s is not "over"', () => {
  const p = logic.clean(P({ rate: 60, len: 20 }));
  const raw = logic.score(p).res.tx.filter((x) => x.end === logic.LEN);
  assert.ok(raw.length >= 1);
  const s = logic.derive(p);
  assert.ok(s.tx.filter((x) => x.end === logic.LEN).some((x) => !x.over));
});

test('scene rule 11: transmissions past 120 s are clipped and marked; a stop never heard is null', () => {
  const s = D({ len: 20 });
  assert.ok(s.tx.every((x) => x.end <= logic.LEN));
  assert.equal(s.heard, null);
  assert.equal(s.delay, null);
  const over = s.tx.filter((x) => x.over);
  assert.ok(over.length >= 1);
  assert.ok(over.every((x) => x.end === logic.LEN));
});

test('scene rule 12: the presets give the numbers in SPEC.md', () => {
  const want = {
    crowded: [null, 26, 18, 6, 2, 37, 7, null, 4],
    quiet: [4, 3, 3, 0, 0, 34, 1, 4, 2],
    own: [24, 7, 5, 1, 1, 27, 2, 24, 2],
    short: [17, 8, 0, 6, 1, 28, 4, 24, 2],
    side: [5, 4, 0, 3, 1, 24, 2, 24, 2],
    word: [2, 2, 0, 2, 1, 24, 1, 24, 2]
  };
  for (const [id, w] of Object.entries(want)) {
    const s = logic.derive(preset(id));
    assert.deepEqual([s.delay, s.doubled, s.lost, s.repeats, s.waiting, Math.round(s.busy * 40), s.stopTries, s.none.delay, s.all.delay], w, id);
  }
});

test('scene rule 12: none and all are the same traffic with the practices off and on', () => {
  const s = D({ channels: 'own', rate: 15, len: 8, short: true });
  const none = D({ channels: 'own', rate: 15, len: 8 }), all = D({ channels: 'own', rate: 15, len: 8, short: true, side: true, word: true });
  assert.deepEqual(s.none, { delay: none.delay, doubled: none.doubled, lost: none.lost });
  assert.deepEqual(s.all, { delay: all.delay, doubled: all.doubled, lost: all.lost });
});

test('scene rule 12: with copy nothing is lost; lost and repeated are exclusive per transmission', () => {
  for (const rate of logic.RATES) for (const channels of ['one', 'own']) for (const len of [4, 12, 20]) {
    const s = D({ rate, channels, len, short: true });
    assert.equal(s.lost, 0, `${rate} ${channels} ${len}`);
    const n = D({ rate, channels, len });
    assert.ok(n.tx.every((x) => !(x.lost && x.repeat)));
    assert.ok(n.tx.filter((x) => x.repeat).every((x) => x.role === 'stop'), 'without copy only the stop is repeated');
    assert.equal(n.doubled, n.tx.filter((x) => x.doubled).length);
  }
});

test('scene rule 13: the channels drawn', () => {
  assert.deepEqual(D().chans, ['main']);
  assert.deepEqual(D({ side: true }).chans, ['main', 'side']);
  assert.deepEqual(D({ channels: 'own', side: true }).chans, ['main', 'side', 'own-camera', 'own-electric', 'own-grip', 'own-art']);
  for (const id of ['crowded', 'own', 'side']) {
    const s = logic.derive(preset(id));
    assert.ok(s.tx.every((x) => s.chans.includes(x.ch)), id);
  }
});

test('radio rule 9: transmissions ending with the heard stop are settled before the silence, in any order', () => {
  // radio 1's doubled-with-copy message ends at the same second as the stop on another channel: it is noticed, then dropped
  const radios = [{ deaf: false, backoff: 3 }, { deaf: false, backoff: 3 }, { deaf: false, backoff: 3 }];
  const a = R([[0, 1, [S('side', 3, 1)]], [0, 2, [S('side', 3, 1)]], [2, 0, [S('main', 2)], { urgent: true }]], { radios });
  assert.equal(a.heard, 4);
  assert.deepEqual(a.tx.map((x) => [x.radio, x.doubled, x.noticed, x.repeat]), [[1, true, true, false], [2, true, true, false], [0, false, false, false]],
    'noticed, but the repeat never goes out');
  assert.deepEqual(a.msgs.map((m) => m.outcome), ['dropped', 'dropped', 'heard']);
  // a heard message ending in the same second keeps its outcome
  const b = R([[0, 1, [S('side', 4)]], [2, 0, [S('main', 2)], { urgent: true }]]);
  assert.deepEqual(b.msgs.map((m) => m.outcome), ['heard', 'heard']);
});

test('radio rule 9: the far radio keeps what it was waiting to send when the stop is heard', () => {
  const radios = [{ deaf: false, backoff: 3 }, { deaf: true, backoff: 9 }];
  // the far radio's copy-expecting message is doubled with the first stop; its repeat is due after the stop is heard
  const res = R([[0, 0, [S('main', 2)], { urgent: true }], [0, 1, [S('main', 2, 1)]]], { radios, retryUrgent: 1 });
  assert.equal(res.heard, 5);
  assert.deepEqual(res.tx.map(span), [[0, 'main', 0, 2], [1, 'main', 0, 3], [0, 'main', 3, 5], [1, 'main', 12, 15]]);
  assert.equal(res.msgs[1].outcome, 'heard');
});

test('radio rule 6: the quiet second applies on every channel, not only main', () => {
  const g = R([[0, 0, [S('side', 4)]], [1, 1, [S('side', 2)]]], { gap: 1 });
  assert.equal(g.tx[1].start, 5);
});

test('radio rule 8: a doubled transmission on a side channel without copy is lost too', () => {
  const res = R([[0, 0, [S('own', 3)]], [0, 1, [S('own', 3)]]]);
  assert.deepEqual(res.msgs.map((m) => m.outcome), ['lost', 'lost']);
});

test('radio rule 10: a radio in its pause before a repeat is not in the queue', () => {
  const radios = [{ deaf: false, backoff: 4 }, { deaf: false, backoff: 4 }];
  const res = R([[0, 0, [S('main', 2, 1)]], [0, 1, [S('main', 2, 1)]]], { radios });
  assert.deepEqual(res.queue.slice(0, 8), [0, 0, 0, 0, 0, 0, 0, 0], 'both pause 3…6 and press together at 7');
  assert.deepEqual(res.tx.slice(2, 4).map(span), [[0, 'main', 7, 10], [1, 'main', 7, 10]], 'equal pauses: they double again');
});

test('scene rule 10: the full queue of the "own" preset', () => {
  assert.equal(logic.derive(preset('own')).queue.join(''),
    '000000000000000000000000000000000111110122223333330001111111110100000000000000000000000000000000000000000000000000000000');
});

test('scene rule 12: the reason and the wait for every preset', () => {
  const want = { crowded: ['far', 5], quiet: ['wait', 2], own: ['queue', 10], short: ['queue', 0], side: ['queue', 0], word: ['once', 0] };
  for (const [id, w] of Object.entries(want)) {
    const s = logic.derive(preset(id));
    assert.deepEqual([s.reason, s.waited], w, id);
  }
  assert.deepEqual(logic.reasonOf([]), { reason: 'busy', waited: null });
  const st = (o) => Object.assign({ radio: 0, ch: 'main', urgent: false, doubled: false }, o);
  const stop = st({ start: 43, end: 45, urgent: true, doubled: true });
  assert.equal(logic.reasonOf([stop, st({ radio: 5, start: 44, end: 50, doubled: true })]).reason, 'far');
  assert.equal(logic.reasonOf([stop, st({ radio: 2, start: 43, end: 50, doubled: true })]).reason, 'queue');
  assert.deepEqual(logic.reasonOf([st({ start: 40, end: 42, urgent: true })]), { reason: 'once', waited: 0 });
  assert.deepEqual(logic.reasonOf([st({ start: 46, end: 48, urgent: true, doubled: true }), st({ radio: 1, start: 46, end: 50, doubled: true }),
    st({ start: 51, end: 53, urgent: true })]), { reason: 'queue', waited: 6 }, 'waited counts to the first try');
});

test('scene rule 12: repeats are counted only when really sent', () => {
  const s = logic.derive(preset('short'));
  assert.equal(s.tx.filter((x) => x.noticed).length, 8);
  assert.equal(s.repeats, 6, 'two were due after the stop was heard');
  assert.ok(s.tx.every((x) => !x.repeat || x.noticed));
});

// ── generic ──

test('state is JSON-safe and deterministic', () => {
  for (const pr of logic.presets) {
    const a = logic.derive(pr.params), b = logic.derive(JSON.parse(JSON.stringify(pr.params)));
    assert.deepEqual(JSON.parse(JSON.stringify(a)), a, pr.id);
    assert.deepEqual(a, b, pr.id);
  }
});

test('derive does not mutate its params', () => {
  const p = P({ channels: 'own', short: true });
  const copy = JSON.parse(JSON.stringify(p));
  logic.derive(p);
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has its strings', () => {
  assert.ok(logic.presets.length >= 3 && logic.presets.length <= 6);
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
    assert.deepEqual(logic.clean(pr.params), pr.params, `${pr.id} is already clean`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + pr.id], `${lang} preset_${pr.id}`);
      assert.ok(strings[lang]['hint_' + pr.id], `${lang} hint_${pr.id}`);
    }
  }
  for (const id of logic.IDS) for (const lang of ['hr', 'en']) {
    assert.ok(strings[lang]['st_' + id] && strings[lang]['letter_' + id], `${lang} ${id}`);
  }
});

test('the page has no steps (explorer) and its meta matches sim.json', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.class, 'explorer');
  assert.equal(sim.class, 'explorer');
  assert.equal(sim.steps, undefined);
  assert.deepEqual(meta.title, sim.title);
  assert.deepEqual(meta.concept, sim.concept);
});
