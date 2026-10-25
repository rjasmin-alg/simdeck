// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for csma-cd's model (rules: SPEC.md). Run: node --test sims/csma-cd/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const last = (over) => at(over, logic.steps(P(over)));
const PRESETS = {
  'two-collide': { scene: 'two-collide', stations: 2 },
  'same-draw': { scene: 'same-draw', stations: 2 },
  'wait-then-crash': { scene: 'wait-then-crash', stations: 3 },
  'three-stations': { scene: 'three-stations', stations: 3 },
  'full-duplex': { scene: 'full-duplex', stations: 2, duplex: 'full' }
};

/** A run of a hand-made cfg: stations given as [arrive, frames, draws]. */
function cfg(stations, over) {
  return Object.assign({ duplex: 'half', frameSlots: 2, seed: 7, maxSlots: 60, stations: stations.map((x, i) => ({
    id: logic.IDS[i], arrive: x[0], frames: x[1], draws: x[2] || null })) }, over);
}
function run(c, slots) {
  let s = logic.begin(c);
  const states = [s];
  for (let i = 0; i < (slots == null ? c.maxSlots : slots) && !(slots == null && s.done); i++) { s = logic.advance(s, c); states.push(s); }
  return states;
}
/** The timeline of station i as a string: X jam, s sending, S last slot, digit = backoff slots left, d defer, . none. */
function row(s, i) {
  return s.columns.map((c) => {
    const m = c.marks[i];
    if (!m) return '.';
    if (m.m === 'send') return m.end ? 'S' : 's';
    return { jam: 'X', defer: 'd', over: ' ', drop: '!', wait: String(m.v) }[m.m];
  }).join('').replace(/ +$/, '');
}
const media = (s) => s.columns.map((c) => c.medium[0]).join('');

// ── tie-breaks first ──

test('rule 7: two stations that draw the same k sense in the same slot and collide again (same-draw)', () => {
  const s = last(PRESETS['same-draw']);
  assert.equal(s.columns[0].medium, 'collision');
  assert.equal(s.columns[1].medium, 'idle', 'both wait their one slot');
  assert.equal(s.columns[2].medium, 'collision', 'and collide again in slot 3');
  assert.deepEqual(s.columns[2].senders, ['A', 'B']);
  const s3 = at(PRESETS['same-draw'], 3);
  assert.deepEqual(s3.stations.map((x) => [x.attempt, x.range]), [[2, 4], [2, 4]], 'n = 2: the range doubles to 0…3');
});

test('rule 7: a lower letter does not win; with the draws swapped, the order of the frames swaps', () => {
  const ab = run(cfg([[1, 1, [0]], [1, 1, [1]]])).pop();
  const ba = run(cfg([[1, 1, [1]], [1, 1, [0]]])).pop();
  assert.equal(row(ab, 0), 'XsS');
  assert.equal(row(ab, 1), 'X1dsS');
  assert.equal(row(ba, 0), 'X1dsS', 'A, though first in the alphabet, waits when it draws the larger k');
  assert.equal(row(ba, 1), 'XsS');
});

test('rule 7: three equal draws collide all three again; nothing but the draw breaks a tie', () => {
  const s = run(cfg([[1, 1, [1, 0]], [1, 1, [1, 1]], [1, 1, [1, 2]]]), 3).pop();
  assert.equal(media(s), 'cic');
  assert.deepEqual(s.columns[2].senders, ['A', 'B', 'C']);
});

test('rule 7 via rule 1: stations deferring behind the same frame all send when it ends, and collide (three-stations)', () => {
  const s = last(PRESETS['three-stations']);
  assert.equal(row(s, 1).slice(0, 4), 'X1dX');
  assert.equal(row(s, 2).slice(0, 4), 'X1dX');
  assert.equal(s.columns[3].medium, 'collision');
  assert.deepEqual(s.columns[3].senders, ['B', 'C']);
});

// ── rules ──

test('rule 1: a station that senses the bus busy defers and sends in the first idle slot (1-persistent)', () => {
  const s = last(PRESETS['two-collide']);
  assert.equal(row(s, 1), 'X1dsS', 'B waits slot 2, finds A\'s frame in slot 3, sends 4–5');
  assert.equal(at(PRESETS['two-collide'], 3).stations[1].phase, 'defer');
  // 1-persistent: no extra wait after the bus goes idle
  const w = last(PRESETS['wait-then-crash']);
  assert.equal(row(w, 0).slice(0, 3), '.dX');
});

test('rule 1: no station ever starts while a frame is on the bus; a frame takes consecutive slots', () => {
  for (let seed = 1; seed <= 99; seed += 7) {
    for (const stations of [2, 3, 4]) {
      for (const frameSlots of [1, 2, 3]) {
        const s = last({ stations, frameSlots, seed });
        s.columns.forEach((c, j) => {
          if (c.medium === 'busy') assert.equal(c.senders.length, 1, `seed ${seed} slot ${c.slot}`);
          const sends = c.marks.filter((m) => m && m.m === 'send');
          if (c.medium === 'busy') assert.equal(sends.length, 1);
          c.marks.forEach((m, i) => {
            if (m && m.m === 'send' && m.v > 1) {
              const before = s.columns[j - 1].marks[i];
              assert.equal(before.m, 'send');
              assert.equal(before.v, m.v - 1);
            }
          });
        });
      }
    }
  }
});

test('rule 2: two senders in one slot collide; neither frame is delivered or kept on the bus', () => {
  const s1 = at(PRESETS['two-collide'], 1);
  assert.equal(s1.medium, 'collision');
  assert.deepEqual(s1.tx, []);
  assert.deepEqual(s1.stations.map((x) => [x.delivered, x.sentSlots]), [[0, 0], [0, 0]]);
  assert.equal(s1.collisions, 1);
});

test('rule 3: every colliding sender jams in the collision slot and stops sending', () => {
  const s1 = at(PRESETS['three-stations'], 1);
  assert.deepEqual(s1.columns[0].marks.map((m) => m.m), ['jam', 'jam', 'jam']);
  assert.deepEqual(s1.stations.map((x) => x.phase), ['jam', 'jam', 'jam']);
});

test('rule 4: the range is 2^min(n, 10): n=1 → 0…1, 2 → 0…3, 3 → 0…7, 10 and beyond → 0…1023', () => {
  assert.deepEqual([1, 2, 3, 4, 9, 10, 11, 15, 16].map(logic.range), [2, 4, 8, 16, 512, 1024, 1024, 1024, 1024]);
});

test('rule 4: seeded draws stay in the range and cover it', () => {
  for (const n of [1, 2, 3]) {
    const seen = new Set();
    for (let seed = 1; seed <= 99; seed++) {
      for (let i = 0; i < 4; i++) {
        const k = logic.seededDraw(seed, i, 0, n);
        assert.ok(Number.isInteger(k) && k >= 0 && k < logic.range(n), `n=${n} k=${k}`);
        seen.add(k);
      }
    }
    assert.equal(seen.size, logic.range(n), `every k in 0…${logic.range(n) - 1} turns up for n=${n}`);
  }
  for (let seed = 1; seed <= 99; seed++) assert.ok(logic.seededDraw(seed, 0, 0, 12) < 1024);
});

test('rule 4: a station that draws k waits exactly k slots and senses in slot (collision + k + 1)', () => {
  for (const k of [0, 1, 2, 3]) {
    // both draw 1 and collide again in slot 3; then A draws k (B draws 3), so read A's row after that collision
    const s = run(cfg([[1, 1, [1, k]], [1, 1, [1, 3]]]), 12).pop();
    const r = row(s, 0);
    const second = r.indexOf('X', 1);
    assert.ok(second > 0);
    const after = r.slice(second + 1, second + 1 + k);
    assert.equal(after.length, k);
    assert.ok([...after].every((ch) => /\d/.test(ch)), `A waits ${k} slots: ${r}`);
    assert.ok('sdX'.includes(r[second + 1 + k]), `and senses in the next: ${r}`);
  }
});

test('rule 4: the countdown shows the slots left before each waiting slot', () => {
  const s = last(PRESETS['same-draw']);
  assert.equal(row(s, 0), 'X1X321sS');
});

test('rule 5: the 16th collision of a frame drops it (excessive collisions); the 15th does not', () => {
  const zeros = Array(16).fill(0);
  const states = run(cfg([[1, 1, zeros], [1, 1, zeros]]), 16);
  const s15 = states[15], s16 = states[16];
  assert.equal(media(s16), 'c'.repeat(16));
  assert.deepEqual(s15.stations.map((x) => [x.attempt, x.phase, x.gaveUp]), [[15, 'jam', 0], [15, 'jam', 0]]);
  assert.deepEqual(s16.stations.map((x) => [x.gaveUp, x.delivered, x.queued, x.phase]), [[1, 0, 0, 'gaveUp'], [1, 0, 0, 'gaveUp']]);
  assert.ok(s16.done);
  assert.deepEqual(s16.stations.map((x) => x.attempt), [0, 0], 'n resets after a drop too');
  assert.deepEqual(s16.log.find((e) => e.code === 'drop').ids, ['A', 'B']);
  assert.equal(logic.ATTEMPT_LIMIT, 16);
});

test('rule 6: n resets to 0 after a delivered frame; the next frame collides as n = 1 and draws from the seed', () => {
  // A has two frames: its first goes through in slots 2–3, its second meets B (deferring) in slot 4
  const seed = [...Array(99).keys()].map((i) => i + 1).find((x) => logic.seededDraw(x, 0, 1, 1) === 1);
  const states = run(cfg([[1, 2, [0, 0]], [1, 1, [1]]], { seed }), 4);
  assert.equal(states[1].stations[0].attempt, 1);
  assert.equal(states[3].stations[0].delivered, 1);
  assert.equal(states[3].stations[0].attempt, 0, 'n is back to 0 once the frame is delivered');
  assert.equal(states[4].medium, 'collision');
  const a = states[4].stations[0];
  assert.deepEqual([a.attempt, a.range, a.frame], [1, 2, 1], 'the second frame starts fresh: n = 1, 0…1');
  assert.equal(a.k, 1, 'and the script (first frame only) does not apply to it: k comes from the seed');
});

test('rule 6: the old two-frame run delivers both frames', () => {
  // A has two frames; B collides with A's first frame twice
  const states = run(cfg([[1, 2, [1, 0]], [1, 1, [1, 3]]]), 30);
  const firstDone = states.findIndex((s) => s.stations[0].delivered === 1);
  assert.ok(firstDone > 0);
  assert.equal(states[firstDone - 1].stations[0].attempt, 2, 'A\'s first frame had two collisions');
  assert.equal(states[firstDone].stations[0].attempt, 0, 'and n is back to 0 once it is delivered');
  const nextCollision = states.findIndex((s, j) => j > firstDone && s.medium === 'collision' && s.columns[s.columns.length - 1].senders.includes('A'));
  if (nextCollision > 0) {
    const a = states[nextCollision].stations[0];
    assert.equal(a.attempt, 1);
    assert.equal(a.range, 2);
  }
  // with a frame for B right behind A's second frame start: A's second frame begins fresh
  assert.equal(states[states.length - 1].stations[0].delivered, 2);
});

test('rule 8: full duplex: both ends send at once and both frames arrive; never a collision', () => {
  const s = last(PRESETS['full-duplex']);
  assert.equal(logic.steps(P(PRESETS['full-duplex'])), 2);
  assert.equal(media(s), 'bb');
  assert.deepEqual(s.columns[0].senders, ['A', 'B']);
  assert.deepEqual(s.stations.map((x) => x.delivered), [1, 1]);
  assert.equal(s.collisions, 0);
  for (let seed = 1; seed <= 99; seed += 5) {
    for (const scene of Object.keys(logic.SCENES)) {
      const f = last({ scene, duplex: 'full', stations: 4, seed });
      assert.equal(f.collisions, 0);
      assert.ok(f.columns.every((c) => c.medium !== 'collision'));
    }
  }
});

test('rule 8: a full-duplex link joins exactly two ends, whatever the stations slider says', () => {
  assert.equal(at({ duplex: 'full', stations: 4 }, 0).stations.length, 2);
  assert.equal(at({ duplex: 'half', stations: 4 }, 0).stations.length, 4);
});

test('rule 4: seeded draws are independent per station and per collision, and reach the top of the range', () => {
  let same1 = 0;
  const pairs = new Set();
  let high = 0;
  for (let seed = 1; seed <= 99; seed++) {
    if (logic.seededDraw(seed, 0, 0, 1) === logic.seededDraw(seed, 1, 0, 1)) same1++;
    pairs.add(logic.seededDraw(seed, 0, 0, 1) + ',' + logic.seededDraw(seed, 0, 0, 2));
    for (let i = 0; i < 4; i++) if (logic.seededDraw(seed, i, 0, 10) >= 512) high++;
  }
  assert.ok(same1 > 30 && same1 < 70, `A and B draw the same k at n = 1 about half the time: ${same1}/99`);
  assert.equal(pairs.size, 8, 'k at n = 2 does not follow from k at n = 1');
  assert.ok(high > 150 && high < 250, `half of the n = 10 draws are 512 or more: ${high}/396`);
  let both = 0;
  for (let seed = 1; seed <= 99; seed++) if (last({ seed, stations: 2 }).stations.every((x) => x.delivered === 1)) both++;
  assert.ok(both >= 95, `two stations with seeded draws almost always both get through: ${both}/99`);
});

/** This slot's events as short codes: code:ids, <by, =left, /draws (id n range k). */
const events = (s) => s.log.map((e) => e.code + ':' + e.ids.join('') + (e.by ? '<' + e.by : '') + (e.left ? '=' + e.left.join('') : '') +
  (e.draws ? '/' + e.draws.map((d) => d.id + d.n + d.range + 'k' + d.k).join(',') : ''));

test('the caption\'s events and the stations\' phases, slot by slot (two-collide, wait-then-crash)', () => {
  const two = [
    [['collision:AB/A12k0,B12k1'], 'jam,jam'],
    [['start:A', 'wait:B=0'], 'send,backoff'],
    [['defer:B<A', 'deliver:A'], 'done,defer'],
    [['start:B'], 'done,send'],
    [['deliver:B'], 'done,done']
  ];
  two.forEach(([ev, ph], j) => {
    const s = at(PRESETS['two-collide'], j + 1);
    assert.deepEqual(events(s), ev, `slot ${j + 1}`);
    assert.equal(s.stations.map((x) => x.phase).join(','), ph, `slot ${j + 1}`);
  });
  const wait = [
    [['start:C'], 'idle,idle,send'],
    [['arrive:AB', 'defer:AB<C', 'deliver:C'], 'defer,defer,done'],
    [['collision:AB/A12k0,B12k1'], 'jam,jam,done'],
    [['start:A', 'wait:B=0'], 'send,backoff,done'],
    [['defer:B<A', 'deliver:A'], 'done,defer,done'],
    [['start:B'], 'done,send,done'],
    [['deliver:B'], 'done,done,done']
  ];
  wait.forEach(([ev, ph], j) => {
    const s = at(PRESETS['wait-then-crash'], j + 1);
    assert.deepEqual(events(s), ev, `slot ${j + 1}`);
    assert.equal(s.stations.map((x) => x.phase).join(','), ph, `slot ${j + 1}`);
  });
  // a longer backoff: the wait log counts down 2, 1, 0 and the phase stays backoff
  const sd = [4, 5, 6].map((n) => at(PRESETS['same-draw'], n));
  assert.deepEqual(sd.map((s) => s.log.find((e) => e.code === 'wait').left[0]), [2, 1, 0]);
  assert.deepEqual(sd.map((s) => s.stations[0].phase), ['backoff', 'backoff', 'backoff']);
  assert.equal(at(PRESETS['same-draw'], 3).log.find((e) => e.code === 'collision').draws.map((d) => d.n).join(), '2,2');
});

// ── presets: the expected numbers of SPEC.md ──

test('preset two-collide: A XsS, B X1dsS; 5 steps, 1 collision, 2 frames', () => {
  const s = last(PRESETS['two-collide']);
  assert.equal(logic.steps(P(PRESETS['two-collide'])), 5);
  assert.deepEqual([row(s, 0), row(s, 1), media(s)], ['XsS', 'X1dsS', 'cbbbb']);
  assert.equal(s.collisions, 1);
  assert.deepEqual(s.stations.map((x) => x.delivered), [1, 1]);
  assert.ok(s.done);
});

test('preset same-draw: A X1X321sS, B X1XsS; 8 steps, 2 collisions', () => {
  const s = last(PRESETS['same-draw']);
  assert.equal(logic.steps(P(PRESETS['same-draw'])), 8);
  assert.deepEqual([row(s, 0), row(s, 1), media(s)], ['X1X321sS', 'X1XsS', 'cicbbibb']);
  assert.equal(s.collisions, 2);
});

test('preset wait-then-crash: C sends, A and B arrive in slot 2, defer, collide in slot 3; 7 steps', () => {
  const s = last(PRESETS['wait-then-crash']);
  assert.equal(logic.steps(P(PRESETS['wait-then-crash'])), 7);
  assert.deepEqual([row(s, 0), row(s, 1), row(s, 2), media(s)], ['.dXsS', '.dX1dsS', 'sS', 'bbcbbbb']);
  assert.equal(s.collisions, 1);
  assert.deepEqual(s.stations.map((x) => x.delivered), [1, 1, 1]);
  assert.deepEqual(at(PRESETS['wait-then-crash'], 0).stations.map((x) => x.phase), ['idle', 'idle', 'ready']);
});

test('preset three-stations: A XsS, B X1dX21sS, C X1dXsS; 8 steps, 2 collisions, 3 frames', () => {
  const s = last(PRESETS['three-stations']);
  assert.equal(logic.steps(P(PRESETS['three-stations'])), 8);
  assert.deepEqual([row(s, 0), row(s, 1), row(s, 2), media(s)], ['XsS', 'X1dX21sS', 'X1dXsS', 'cbbcbbbb']);
  assert.equal(s.collisions, 2);
  assert.deepEqual(s.stations.map((x) => x.delivered), [1, 1, 1]);
});

test('frameSlots sets the length of a frame on the bus', () => {
  const one = last({ frameSlots: 1 });
  assert.deepEqual([row(one, 0), row(one, 1)], ['XS', 'X1S']);
  const four = last({ frameSlots: 4 });
  assert.equal(row(four, 0), 'XsssS');
});

test('the seed: 0 takes the scene\'s scripted draws, 1–99 draws every k from the seed and ignores the script', () => {
  const c0 = logic.cfgOf(P(PRESETS['same-draw']));
  assert.deepEqual(c0.stations.map((x) => x.draws), [[1, 3], [1, 0]]);
  const c5 = logic.cfgOf(P(Object.assign({}, PRESETS['same-draw'], { seed: 5 })));
  assert.deepEqual(c5.stations.map((x) => x.draws), [null, null]);
  for (let seed = 1; seed <= 99; seed++) {
    const c = logic.cfgOf(P(Object.assign({}, PRESETS['same-draw'], { seed })));
    assert.equal(logic.drawFor(c, 0, 0, 2), logic.seededDraw(seed, 0, 0, 2));
  }
});

test('the same seed replays the same run; different seeds differ', () => {
  const a = last({ seed: 12, stations: 3 });
  const b = last({ seed: 12, stations: 3 });
  assert.deepEqual(a, b);
  const runs = new Set();
  for (let seed = 1; seed <= 20; seed++) runs.add(JSON.stringify(last({ seed, stations: 3 }).columns));
  assert.ok(runs.size > 5, 'different seeds give different runs');
});

test('a run ends when every frame is through, and never goes past 20 slots', () => {
  for (let seed = 1; seed <= 99; seed += 3) {
    for (const stations of [2, 3, 4]) {
      for (const frameSlots of [1, 2, 3, 4]) {
        const p = { stations, frameSlots, seed };
        const n = logic.steps(P(p));
        assert.ok(n >= 1 && n <= logic.MAX_SLOTS);
        const s = last(p);
        if (n < logic.MAX_SLOTS) assert.ok(s.done, 'ended early only when done');
        if (s.done && n > 1) assert.ok(!at(p, n - 1).done, 'and not a slot later than needed');
      }
    }
  }
});

test('a capped run stops at 20 slots with frames still waiting', () => {
  const p = { stations: 4, frameSlots: 4, seed: 7 };
  assert.equal(logic.steps(P(p)), 20);
  const s = last(p);
  assert.equal(s.done, false);
  assert.ok(s.stations.some((x) => x.queued > 0));
});

test('stations beyond a scene\'s script draw from the seed', () => {
  const s = last({ scene: 'two-collide', stations: 3 });
  assert.equal(s.columns[0].senders.length, 3);
  assert.ok(s.done || logic.steps(P({ scene: 'two-collide', stations: 3 })) === 20);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = P({ stations: 4, seed: 33 });
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(PRESETS['three-stations']);
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P(PRESETS['same-draw']);
  const s0 = kit.stateAt(logic, p, 2);
  const copy = structuredClone(s0);
  logic.step(s0, 3, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model at the defaults');
  const presets = [...html.matchAll(/\{ id: '([\w-]+)'[^\n]*params: \{([^}]*)\}/g)];
  assert.equal(presets.length, 5, 'found the five presets');
  for (const m of presets) {
    const keys = [...m[2].matchAll(/(\w+):/g)].map((k) => k[1]);
    for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok(m[1] in logic.SCENES, `preset ${m[1]} has its scene`);
    assert.match(m[2], new RegExp(`scene: '${m[1]}'`), `preset ${m[1]} loads its own scene`);
  }
});
