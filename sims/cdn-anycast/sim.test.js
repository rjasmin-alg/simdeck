// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for cdn-anycast (rules: SPEC.md). Tie-breaks first, then the rules in order, then the presets and the generic
// block every sim keeps. Run: node --test sims/cdn-anycast/sim.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (o) => Object.assign({}, logic.defaults, o || {});
const S = (o) => logic.initial(P(o));
const pop = (s, id) => (s.best[id] ? s.best[id].pop : null);
const path = (s, id) => (s.best[id] ? s.best[id].path.join(' ') : null);
const SWITCHES = ['popZG', 'popVIE', 'popFRA', 'link64501_64502', 'link64503VIE', 'link64503FRA'];
function every(fn) {
  for (let m = 0; m < 128; m++) {
    const p = P();
    SWITCHES.forEach((k, i) => { p[k] = !(m & (1 << i)); });
    p.lpAs64503 = m & 64 ? 200 : 100;
    fn(p, logic.initial(p));
  }
}

// ── tie-breaks ──

test('tie-break (rule 5): equal LP and length → the lower router ID; AS64503 picks VIE (192.0.2.20) over FRA (192.0.2.30)', () => {
  const s = S();
  assert.equal(pop(s, '64503'), 'VIE');
  assert.equal(s.best['64503'].by, 'rid');
  assert.equal(s.best['64503'].from, 'VIE');
  const rib = s.ases['64503'].rib.filter((e) => e.path.length === 1).map((e) => e.from).sort();
  assert.deepEqual(rib, ['FRA', 'VIE'], 'both PoPs offer [64500]');
});

test('tie-break (rule 5): router IDs compare as numbers, not as text', () => {
  assert.ok(logic.ridNum('192.0.2.10') > logic.ridNum('192.0.2.9'));
  assert.ok(logic.ridNum('192.0.2.20') < logic.ridNum('192.0.2.30'));
});

test('tie-break (rule 5): the router ID decides, not the neighbour\'s place in the scene, and as a number', () => {
  // scene order disagrees with router-ID order, so a decision by order (or by text) picks the wrong one
  const scene = { ases: [{ id: 'X', asn: 1, routerId: '192.0.2.30' }, { id: 'Y', asn: 2, routerId: '192.0.2.20' }] };
  const d = logic.decide(scene, [{ from: 'X', path: [64500], lp: 100 }, { from: 'Y', path: [64500], lp: 100 }]);
  assert.equal(d.best.from, 'Y');
  assert.equal(d.by, 'rid');
  const text = { ases: [{ id: 'X', asn: 1, routerId: '192.0.2.9' }, { id: 'Y', asn: 2, routerId: '192.0.2.10' }] };
  assert.equal(logic.decide(text, [{ from: 'Y', path: [1], lp: 100 }, { from: 'X', path: [1], lp: 100 }]).best.from, 'X');
});

test('tie-break (rule 5): VIE withdrawn → AS64502 holds [64501 64500] and [64503 64500], picks 64501 (192.0.2.1 < 192.0.2.3) → ZG', () => {
  const s = S({ popVIE: false });
  assert.equal(path(s, '64502'), '64501 64500');
  assert.equal(s.best['64502'].by, 'rid');
  assert.equal(pop(s, '64502'), 'ZG');
});

test('tie-break: the last guard (scene order) is never reached', () => {
  every((p, s) => {
    for (const id of Object.keys(s.ases)) assert.notEqual(s.ases[id].by, 'order', JSON.stringify(p));
  });
});

// ── rule 1: one address, many places ──

test('rule 1: every announcing PoP originates the same prefix; three PoPs, three places', () => {
  const s = S();
  assert.equal(s.prefix, '203.0.113.0/24');
  assert.equal(s.address, '203.0.113.10');
  assert.deepEqual(s.announcements, [{ pop: 'ZG', up: true }, { pop: 'VIE', up: true }, { pop: 'FRA', up: true }]);
  const st = logic.converge(logic.sceneOf(P()));
  for (const id of ['ZG', 'VIE', 'FRA']) {
    assert.ok(st.ases[id].best.local, id + ' holds a local route');
    assert.deepEqual(st.ases[id].rib.filter((e) => !e.local), [], id + ' learns nothing from outside: every path holds 64500');
  }
  assert.deepEqual(new Set(['64501', '64502', '64504'].map((id) => pop(s, id))), new Set(['ZG', 'VIE', 'FRA']));
});

test('rule 1: what a PoP sends is [64500], the same from every PoP', () => {
  const scene = logic.sceneOf(P());
  const local = { from: null, path: [], lp: 100, local: true };
  for (const id of ['ZG', 'VIE', 'FRA']) assert.deepEqual(logic.pathOut(scene, id, '64501', local), [64500]);
});

// ── rule 2: nearest = best BGP path ──

test('rule 2: highest LOCAL_PREF first: LP 200 on FRA moves AS64503 to FRA although VIE is equally short and wins the router ID', () => {
  const s = S({ lpAs64503: 200 });
  assert.equal(pop(s, '64503'), 'FRA');
  assert.equal(s.best['64503'].by, 'lp');
  assert.equal(s.best['64503'].lp, 200);
});

test('rule 2: LOCAL_PREF is local: it is not sent on; AS64505 stores [64503 64500] with its own 100', () => {
  const s = S({ lpAs64503: 200 });
  assert.equal(s.best['64505'].lp, 100);
  assert.deepEqual(s.ases['64505'].rib.map((e) => e.lp), [100]);
  for (const id of ['64501', '64502', '64504']) s.ases[id].rib.forEach((e) => assert.equal(e.lp, 100, id));
});

test('rule 2: local preference beats a shorter path too (LP before length)', () => {
  // no param combination puts a longer FRA path against a shorter one at AS64503; ask the decision directly
  const scene = logic.sceneOf(P({ lpAs64503: 200 }));
  const d = logic.decide(scene, [{ from: 'VIE', path: [64500], lp: 100 }, { from: 'FRA', path: [64504, 64500], lp: 200 }]);
  assert.equal(d.best.from, 'FRA');
  assert.equal(d.by, 'lp');
});

test('rule 2: then the shorter AS path: AS64501 takes [64500] from ZG over [64502 64500]', () => {
  const s = S();
  assert.equal(path(s, '64501'), '64500');
  assert.equal(s.best['64501'].by, 'len');
  assert.ok(s.ases['64501'].rib.some((e) => e.path.join(' ') === '64502 64500'));
});

test('rule 2: nearest is not closest: AS64505 (Zagreb) does not reach ZG; its only path goes through AS64503', () => {
  const s = S();
  assert.notEqual(pop(s, '64505'), 'ZG');
  assert.equal(path(s, '64505'), '64503 64500');
  assert.deepEqual(s.best['64505'].hops, ['64505', '64503', 'VIE']);
});

test('rule 2: local preference ranks paths, it cannot create one (LP 200 with link 64503–FRA down)', () => {
  const s = S({ lpAs64503: 200, link64503FRA: false });
  assert.equal(pop(s, '64503'), 'VIE');
  assert.equal(pop(s, '64505'), 'VIE');
});

// ── rule 3: withdrawal → next-best; the address stays ──

test('rule 3: ZG withdraws → AS64501 falls back to [64502 64500] → VIE; the prefix and address are unchanged', () => {
  const a = S(), b = S({ popZG: false });
  assert.equal(path(b, '64501'), '64502 64500');
  assert.equal(pop(b, '64501'), 'VIE');
  assert.equal(b.address, a.address);
  assert.equal(b.prefix, a.prefix);
  assert.deepEqual(logic.moved(a, b), ['64501']);
  assert.deepEqual(b.announcements, [{ pop: 'ZG', up: false }, { pop: 'VIE', up: true }, { pop: 'FRA', up: true }]);
  assert.deepEqual(S({ popVIE: false, popFRA: false }).announcements.map((x) => x.up), [true, false, false]);
});

test('rule 3: a withdrawn PoP says nothing: no AS stores a path from it', () => {
  every((p, s) => {
    for (const x of s.announcements) {
      if (x.up) continue;
      for (const id of Object.keys(s.ases)) assert.ok(!s.ases[id].rib.some((e) => e.from === x.pop), `${id} from ${x.pop} ${JSON.stringify(p)}`);
    }
  });
});

test('rule 3: FRA withdraws → AS64504 moves to VIE via [64503 64500]', () => {
  const s = S({ popFRA: false });
  assert.equal(path(s, '64504'), '64503 64500');
  assert.equal(pop(s, '64504'), 'VIE');
});

test('rule 3: a failed link is a lost path: link 64503–VIE down → AS64503 and AS64505 move to FRA', () => {
  const a = S(), b = S({ link64503VIE: false });
  assert.equal(pop(b, '64503'), 'FRA');
  assert.equal(pop(b, '64505'), 'FRA');
  assert.deepEqual(logic.moved(a, b), ['64503', '64505']);
  assert.ok(!b.ases['64503'].rib.some((e) => e.from === 'VIE'));
});

test('rule 3: no path left → unreachable (null), and moved counts it', () => {
  const s = S({ popZG: false, link64501_64502: false });
  assert.equal(s.best['64501'], null);
  assert.deepEqual(logic.moved(S(), s), ['64501']);
  const none = S({ popZG: false, popVIE: false, popFRA: false });
  for (const id of Object.keys(none.best)) assert.equal(none.best[id], null);
});

test('rule 3: longer fallbacks: ZG and VIE withdrawn → AS64501 → FRA over [64502 64503 64500]; VIE and FRA → all to ZG', () => {
  const s = S({ popZG: false, popVIE: false });
  assert.equal(path(s, '64501'), '64502 64503 64500');
  assert.equal(pop(s, '64501'), 'FRA');
  const z = S({ popVIE: false, popFRA: false });
  for (const id of Object.keys(z.best)) assert.equal(pop(z, id), 'ZG', id);
  assert.equal(path(z, '64505'), '64503 64502 64501 64500');
});

// ── rule 4 is shown in the caption only (no TCP model); moved is what triggers it ──

test('moved: nothing before → nothing; same → nothing; scene order; reachability counts', () => {
  const a = S();
  assert.deepEqual(logic.moved(null, a), []);
  assert.deepEqual(logic.moved(a, S()), []);
  assert.deepEqual(logic.moved(a, S({ lpAs64503: 200 })), ['64503', '64505']);
  assert.deepEqual(logic.moved(S({ lpAs64503: 200 }), a), ['64503', '64505']);
  assert.deepEqual(logic.moved(S({ popVIE: false }), a), ['64502', '64503', '64505']);
});

// ── convergence and forwarding ──

test('every param combination converges, within 5 rounds', () => {
  let max = 0;
  every((p, s) => { assert.ok(s.converged, JSON.stringify(p)); max = Math.max(max, s.rounds); });
  assert.equal(max, 5);
});

test('converged: hop by hop every AS ends at an announcing PoP, its AS path has one ASN per hop, no loops', () => {
  every((p, s) => {
    const up = s.announcements.filter((x) => x.up).map((x) => x.pop);
    for (const id of Object.keys(s.best)) {
      const b = s.best[id];
      if (!b) continue;
      assert.ok(up.includes(b.pop), `${id} ${JSON.stringify(p)}`);
      assert.equal(new Set(b.hops).size, b.hops.length);
      const asns = b.hops.slice(1).map((h) => logic.asOf(logic.sceneOf(p), h).asn);
      assert.deepEqual(b.path, asns, `${id} path = the ASNs of the hops ${JSON.stringify(p)}`);
    }
  });
});

test('converged: every neighbour\'s announcement over an up link is stored, unless it holds the receiver\'s ASN', () => {
  every((p, s) => {
    const scene = logic.sceneOf(p);
    const st = logic.converge(scene);
    for (const l of s.links) {
      if (!l.up) continue;
      for (const [to, from] of [[l.a, l.b], [l.b, l.a]]) {
        const fb = st.ases[from].best;
        const e = st.ases[to].rib.find((x) => x.from === from);
        if (!fb) { assert.equal(e, undefined); continue; }
        const sent = logic.pathOut(scene, from, to, fb);
        if (sent.includes(logic.asOf(scene, to).asn)) assert.equal(e, undefined, `${to} drops ${from}`);
        else assert.deepEqual(e && e.path, sent, `${to} stores ${from} ${JSON.stringify(p)}`);
      }
    }
  });
});

test('load per PoP: counts client groups only (not the transit AS64503)', () => {
  assert.deepEqual(logic.loadOf(S()), { ZG: 1, VIE: 2, FRA: 1 });
  assert.deepEqual(logic.loadOf(S({ popZG: false })), { ZG: 0, VIE: 3, FRA: 1 });
  assert.deepEqual(logic.loadOf(S({ lpAs64503: 200 })), { ZG: 1, VIE: 1, FRA: 2 });
});

// ── presets (SPEC.md table) ──

test('preset three-pops: 64501 ZG, 64502 VIE, 64504 FRA, 64503 VIE, 64505 VIE via [64503 64500]', () => {
  const s = S(logic.presets.find((x) => x.id === 'three-pops').params);
  assert.deepEqual(['64501', '64502', '64503', '64504', '64505'].map((id) => pop(s, id)), ['ZG', 'VIE', 'VIE', 'FRA', 'VIE']);
  assert.deepEqual(['64501', '64502', '64504'].map((id) => path(s, id)), ['64500', '64500', '64500']);
});

test('preset withdraw-zg: only AS64501 moves, to VIE via [64502 64500]', () => {
  const s = S(logic.presets.find((x) => x.id === 'withdraw-zg').params);
  assert.equal(path(s, '64501'), '64502 64500');
  assert.equal(pop(s, '64501'), 'VIE');
  assert.deepEqual(logic.moved(S(), s), ['64501']);
});

test('preset nearest-is-not-closest: the defaults, AS64505 reaches VIE, not ZG', () => {
  const s = S(logic.presets.find((x) => x.id === 'nearest-is-not-closest').params);
  assert.equal(pop(s, '64505'), 'VIE');
  assert.equal(path(s, '64505'), '64503 64500');
});

test('preset local-pref-wins: AS64503 and AS64505 move to FRA, decided by LP', () => {
  const s = S(logic.presets.find((x) => x.id === 'local-pref-wins').params);
  assert.equal(pop(s, '64503'), 'FRA');
  assert.equal(pop(s, '64505'), 'FRA');
  assert.equal(s.best['64503'].by, 'lp');
  assert.deepEqual(logic.moved(S(), s), ['64503', '64505']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  every((p, s) => assert.deepEqual(JSON.parse(JSON.stringify(s)), s));
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ popVIE: false, lpAs64503: 200 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; the page is an explorer', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
    for (const lang of ['hr', 'en']) assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
