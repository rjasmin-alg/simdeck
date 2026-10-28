// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ddos-amplification (rules: SPEC.md). Tie-breaks and boundaries first, then the rules in order, then the
// presets and the generic block every sim keeps. Run: node --test sims/ddos-amplification/sim.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (o) => Object.assign({}, logic.defaults, o || {});
const S = (o) => logic.initial(P(o));

// ── tie-breaks and boundaries (first, per COMMON.md §7) ──

test('boundary (rule 7): reflected exactly equal to capacity counts as saturated (>=)', () => {
  // dns baf 54, sent such that reflected == capacity: 54 Mbit/s sent, 54 baf → 2916; pick cap to match reflected.
  const s = S({ service: 'dns', sentMbps: 10, victimMbps: 540 });
  assert.equal(s.reflectedMbps, 540);
  assert.equal(s.victimCapacity, 540);
  assert.equal(s.saturated, true, 'equal is saturated');
  assert.equal(s.effectiveMbps, 0, 'no headroom at the boundary');
});

test('boundary (rule 7): one Mbit/s under capacity is not saturated', () => {
  const s = S({ service: 'dns', sentMbps: 10, victimMbps: 541 });
  assert.equal(s.reflectedMbps, 540);
  assert.equal(s.saturated, false);
  assert.equal(s.effectiveMbps, 1);
});

test('tie-break (defence order): ingress filtering dominates every other defence', () => {
  // even with reflectors open and no rate limit, ingress filtering alone zeroes the attack
  const s = S({ ingressFiltering: true });
  assert.equal(s.sentEffective, 0);
  assert.equal(s.reflectedMbps, 0);
  assert.equal(s.stopped.atSource, true);
  // and with every other defence toggled too, still zero and still "at source"
  const s2 = S({ ingressFiltering: true, reflectorsClosed: true, rateLimit: true, victimFilter: true });
  assert.equal(s2.reflectedMbps, 0);
  assert.equal(s2.stopped.atSource, true);
  assert.equal(s2.stopped.atReflector, false, 'source wins the attribution');
});

// ── rules in order ──

test('rule 1/3: reflected = sent × BAF', () => {
  assert.equal(S({ service: 'dns', sentMbps: 10 }).reflectedMbps, 540);   // 10 × 54
  assert.equal(S({ service: 'dns', sentMbps: 1 }).reflectedMbps, 54);
  assert.equal(S({ service: 'ntp', sentMbps: 10 }).reflectedMbps, 5569);  // 10 × 556.9
  assert.equal(S({ service: 'snmp', sentMbps: 10 }).reflectedMbps, 63);   // 10 × 6.3
});

test('rule 2: the BAF per service matches the CISA alert figures', () => {
  const baf = Object.fromEntries(logic.SERVICES.map((x) => [x.id, x.baf]));
  assert.deepEqual(baf, { dns: 54, snmp: 6.3, ssdp: 30.8, ntp: 556.9 });
  assert.equal(S({ service: 'ssdp', sentMbps: 10 }).baf, 30.8);
});

test('rule 6a: ingress filtering (BCP 38) stops the forged requests at the source; victim free', () => {
  const s = S({ service: 'dns', sentMbps: 100, victimMbps: 100, ingressFiltering: true });
  assert.equal(s.sentEffective, 0);
  assert.equal(s.reflectedMbps, 0);
  assert.equal(s.load, 0);
  assert.equal(s.saturated, false);
  assert.equal(s.effectiveMbps, 100, 'the whole link is free for legitimate traffic');
});

test('rule 6b: closing the reflectors zeroes the reflected rate', () => {
  const s = S({ service: 'dns', sentMbps: 10, reflectorsClosed: true });
  assert.equal(s.sentEffective, 10, 'requests still leave the source');
  assert.equal(s.reflectedMbps, 0);
  assert.equal(s.stopped.atReflector, true);
});

test('rule 6b: rate-limiting halves the reflected rate', () => {
  assert.equal(S({ service: 'dns', sentMbps: 10, rateLimit: true }).reflectedMbps, 270);  // 540 / 2
  // rate limit after closing is still zero
  assert.equal(S({ service: 'dns', sentMbps: 10, reflectorsClosed: true, rateLimit: true }).reflectedMbps, 0);
});

test('rule 6c: a victim-edge filter changes nothing numeric (the link is already full)', () => {
  const base = S({ service: 'dns', sentMbps: 10, victimMbps: 100 });
  const filtered = S({ service: 'dns', sentMbps: 10, victimMbps: 100, victimFilter: true });
  assert.equal(filtered.reflectedMbps, base.reflectedMbps);
  assert.equal(filtered.load, base.load);
  assert.equal(filtered.times, base.times);
  assert.equal(filtered.saturated, base.saturated);
  assert.equal(filtered.defences.victimFilter, true);
});

test('rule 4/7: load is not clamped (can exceed 100 %); effective headroom is clamped at 0', () => {
  const s = S({ service: 'ntp', sentMbps: 10, victimMbps: 1000 });  // 5569 vs 1000
  assert.ok(s.load > 1, 'load reads over 100%');
  assert.equal(s.loadPct, 557);
  assert.equal(s.times, 5.6);
  assert.equal(s.saturated, true);
  assert.equal(s.effectiveMbps, 0, 'never negative');
});

test('round1: displayed rates are rounded to one decimal', () => {
  assert.equal(logic.round1(556.9 * 10), 5569);
  assert.equal(S({ service: 'snmp', sentMbps: 7 }).reflectedMbps, 44.1);  // 7 × 6.3
});

// ── presets ──

test('presets match SPEC.md (arithmetic from rule 1)', () => {
  const by = Object.fromEntries(logic.presets.map((p) => [p.id, S(p.params)]));
  assert.equal(by['book-dns'].reflectedMbps, 540);
  assert.equal(by['book-dns'].loadPct, 54);
  assert.equal(by['book-dns'].saturated, false);

  assert.equal(by['saturation'].reflectedMbps, 540);
  assert.equal(by['saturation'].saturated, true);
  assert.equal(by['saturation'].times, 5.4);

  assert.equal(by['larger-factor'].baf, 556.9);
  assert.equal(by['larger-factor'].reflectedMbps, 5569);
  assert.equal(by['larger-factor'].saturated, true);

  assert.equal(by['ingress-filtering'].reflectedMbps, 0);
  assert.equal(by['ingress-filtering'].saturated, false);
  assert.equal(by['ingress-filtering'].effectiveMbps, 100);

  // the victim-side filter preset reads the same load as saturation: the filter does not help
  assert.equal(by['victim-side-filter'].reflectedMbps, by['saturation'].reflectedMbps);
  assert.equal(by['victim-side-filter'].saturated, true);
  assert.equal(by['victim-side-filter'].defences.victimFilter, true);
});

// ── generic checks every sim keeps ──

function every(fn) {
  const services = logic.SERVICES.map((x) => x.id);
  const sents = [1, 10, 100];
  const caps = [100, 1000, 10000];
  for (const service of services) for (const sentMbps of sents) for (const victimMbps of caps) {
    for (let m = 0; m < 16; m++) {
      const p = P({ service, sentMbps, victimMbps,
        ingressFiltering: !!(m & 1), reflectorsClosed: !!(m & 2), rateLimit: !!(m & 4), victimFilter: !!(m & 8) });
      fn(p, logic.initial(p));
    }
  }
}

test('state is JSON-safe for every param combination', () => {
  every((p, s) => assert.deepEqual(JSON.parse(JSON.stringify(s)), s));
});

test('invariants hold everywhere: reflected ≥ 0, effective in [0, capacity], saturated matches load', () => {
  every((p, s) => {
    assert.ok(s.reflectedMbps >= 0, JSON.stringify(p));
    assert.ok(s.effectiveMbps >= 0 && s.effectiveMbps <= s.victimCapacity, JSON.stringify(p));
    assert.equal(s.saturated, s.reflectedMbps >= s.victimCapacity, JSON.stringify(p));
    if (s.defences.ingressFiltering) assert.equal(s.reflectedMbps, 0, JSON.stringify(p));
  });
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ service: 'ntp', sentMbps: 42, rateLimit: true });
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
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
