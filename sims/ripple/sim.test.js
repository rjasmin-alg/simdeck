// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the mains hum and ripple model. Run: node --test sims/ripple/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.initial(P(over));
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg || ''} ${a} vs ${b}`);
const W = 2 * Math.PI * 50;

// An independent check of the closed form: step through time with an ideal diode and the RC discharge. The capacitor
// keeps its voltage decayed by e^(−dt/τ), or the rectified source lifts it, whichever is higher.
function stepped(rect, tau, tEnd, dt) {
  let v = 0;
  const out = [];
  for (let t = 0; t <= tEnd + 1e-9; t += dt) {
    v = Math.max(logic.rectified(rect, t), tau > 0 ? v * Math.exp(-dt / tau) : 0);
    out.push([t, v]);
  }
  return out;
}

// ── tie-breaks first ──

test('tie-break: τ clamps to 0 … 200 ms, snaps to 10 (a half step up), a non-number is the default', () => {
  assert.equal(logic.clampTau(-5, 7), 0);
  assert.equal(logic.clampTau(900, 7), 200);
  assert.equal(logic.clampTau(15, 7), 20);
  assert.equal(logic.clampTau(14.9, 7), 10);
  assert.equal(logic.clampTau('40', 7), 40);
  assert.equal(logic.clampTau(0, 7), 0, '0 is a value (no capacitor), not missing');
  for (const bad of ['abc', '', null, NaN, undefined, true, false, Infinity]) assert.equal(logic.clampTau(bad, 7), 7, String(bad));
  assert.equal(at({ tau: 'x' }).tau, logic.defaults.tau);
});

test('tie-break: an unknown rectifier is the default; ac is true only for true, "true", 1, "1"', () => {
  assert.equal(at({ rect: 'x' }).rect, logic.defaults.rect);
  assert.equal(at({ rect: 'Half' }).rect, logic.defaults.rect, 'no case folding');
  assert.equal(at({ rect: 'half' }).rect, 'half');
  for (const v of [true, 'true', 1, '1']) assert.equal(at({ ac: v }).ac, true, String(v));
  for (const v of [false, 'false', 0, '0', '', null, undefined, 'yes']) assert.equal(at({ ac: v }).ac, false, String(v));
});

test('tie-break: at the switch-off phase the output is the sine\'s value, and it is continuous on both sides', () => {
  for (const rect of ['half', 'full']) {
    for (const tau of [10, 40, 200]) {
      const thOff = Math.PI - Math.atan(W * tau / 1000);
      const tOff = thOff / W * 1000;
      close(logic.out(rect, tau, tOff), Math.sin(thOff), 1e-12, `${rect} ${tau} at off`);
      close(logic.out(rect, tau, tOff + 1e-6), Math.sin(thOff), 1e-6, `${rect} ${tau} just after`);
      close(logic.out(rect, tau, tOff - 1e-6), Math.sin(thOff), 1e-6, `${rect} ${tau} just before`);
    }
  }
});

test('tie-break: τ = 0 is no capacitor: the output is the rectified wave itself', () => {
  for (const rect of ['half', 'full']) {
    for (let t = 0; t < 40; t += 0.37) assert.equal(logic.out(rect, 0, t), logic.rectified(rect, t));
  }
  assert.equal(at({ tau: 0 }).cap, false);
  assert.equal(at({ tau: 10 }).cap, true);
});

test('tie-break: right after the switch-off phase the output is the decay, above the falling sine', () => {
  for (const rect of ['half', 'full']) {
    for (const tau of [10, 40, 200]) {
      const wt = W * tau / 1000, thOff = Math.PI - Math.atan(wt);
      for (const d of [0.002, 0.01, 0.1, 0.3]) {
        const t = (thOff + d) / W * 1000;
        const v = logic.out(rect, tau, t);
        close(v, Math.sin(thOff) * Math.exp(-d / wt), 1e-12, `${rect} ${tau} +${d}`);
        assert.ok(v > logic.rectified(rect, t), `${rect} ${tau} +${d}: above the sine`);
      }
    }
  }
});

test('tie-break: any τ above 0 is a capacitor, however small (the voltage stays above 0 at the trough)', () => {
  for (const tau of [0.5, 1, 3, 7]) {
    assert.ok(logic.out('full', tau, 10) > 0, `full ${tau}`);
    assert.ok(logic.out('half', tau, 15) > 0, `half ${tau}`);
  }
});

test('tie-break: a negative time is the same point of the periodic steady state', () => {
  for (const t of [-3, -8, -11.5, -19]) {
    close(logic.out('half', 40, t), logic.out('half', 40, t + 40), 1e-12, `half ${t}`);
    close(logic.out('full', 40, t), logic.out('full', 40, t + 20), 1e-12, `full ${t}`);
  }
});

// ── the model's rules ──

test('rectified: half-wave max(u, 0), full-wave |u|', () => {
  close(logic.rectified('half', 5), 1, 1e-12);
  close(logic.rectified('half', 15), 0, 1e-12, 'negative half cut');
  close(logic.rectified('full', 15), 1, 1e-12, 'negative half turned up');
  close(logic.mains(15), -1, 1e-12);
});

test('the ripple frequency: 50 Hz half-wave, 100 Hz full-wave (the negative half-wave turned up doubles it)', () => {
  assert.equal(logic.rippleHz('half'), 50);
  assert.equal(logic.rippleHz('full'), 100);
  assert.equal(at({ rect: 'half' }).f, 50);
  assert.equal(at({ rect: 'full' }).f, 100);
  assert.equal(at({ rect: 'half' }).periodMs, 20);
  assert.equal(at({ rect: 'full' }).periodMs, 10);
  // the output repeats every ripple period, and the half-wave one not after 10 ms
  for (const tau of [0, 40]) {
    for (let t = 0; t < 20; t += 0.7) {
      close(logic.out('full', tau, t + 10), logic.out('full', tau, t), 1e-9);
      close(logic.out('half', tau, t + 20), logic.out('half', tau, t), 1e-9);
    }
    assert.ok(Math.abs(logic.out('half', tau, 15) - logic.out('half', tau, 5)) > 0.1, 'half-wave: 10 ms is not a period');
  }
});

test('the closed form equals a step-by-step ideal diode with RC discharge, after the first peak', () => {
  for (const rect of ['half', 'full']) {
    for (const tau of [10, 40, 160]) {
      const dt = 0.002;
      for (const [t, v] of stepped(rect, tau, 100, dt)) {
        if (t < 6) continue;          // before the first peak the capacitor is still charging up from 0
        close(logic.out(rect, tau, t), v, 2e-3, `${rect} ${tau} t=${t.toFixed(3)}`);
      }
    }
  }
});

test('without C: DC part 1/π half-wave, 2/π full-wave; ripple the whole Û', () => {
  const h = logic.stats('half', 0), f = logic.stats('full', 0);
  close(h.mean, 1 / Math.PI, 1e-3);
  close(f.mean, 2 / Math.PI, 1e-3);
  close(h.pp, 1, 1e-6);
  close(f.pp, 1, 1e-6);
  assert.equal(at({ rect: 'half', tau: 0 }).meanPct, 32);
  assert.equal(at({ rect: 'full', tau: 0 }).meanPct, 64);
  assert.equal(at({ rect: 'full', tau: 0 }).ppPct, 100);
});

test('with C: the output never falls below the rectified wave, never rises above Û, and reaches Û at each peak', () => {
  for (const rect of ['half', 'full']) {
    for (const tau of [10, 40, 200]) {
      for (let t = 0; t < 40; t += 0.13) {
        const v = logic.out(rect, tau, t);
        assert.ok(v >= logic.rectified(rect, t) - 1e-12, `${rect} ${tau} ${t}`);
        assert.ok(v <= 1 + 1e-12);
      }
      close(logic.out(rect, tau, 5), 1, 1e-12);
      close(logic.out(rect, tau, 5 + 1000 / logic.rippleHz(rect)), 1, 1e-9);
    }
  }
});

test('a larger capacitor: less ripple and a higher DC part; full-wave less ripple than half-wave at the same τ', () => {
  for (const rect of ['half', 'full']) {
    let last = logic.stats(rect, 0);
    for (let tau = 10; tau <= 200; tau += 10) {
      const s = logic.stats(rect, tau);
      assert.ok(s.pp < last.pp && s.mean > last.mean, `${rect} ${tau}`);
      last = s;
    }
  }
  for (let tau = 10; tau <= 200; tau += 10) assert.ok(logic.stats('full', tau).pp < logic.stats('half', tau).pp, String(tau));
});

test('a large capacitor: the ripple is about T / τ of Û (T the ripple period)', () => {
  for (const [rect, T] of [['half', 20], ['full', 10]]) {
    for (const tau of [160, 200]) {
      const pp = logic.stats(rect, tau).pp;
      assert.ok(pp < T / tau && pp > 0.8 * T / tau, `${rect} ${tau}: ${pp} vs ${T / tau}`);
    }
  }
  // the numbers on the page's presets
  assert.equal(at({ rect: 'full', tau: 40 }).ppPct, 18);
  assert.equal(at({ rect: 'half', tau: 40 }).ppPct, 35);
  assert.equal(at({ rect: 'full', tau: 160 }).ppPct, 5);
});

test('the hum: one ripple period of the AC part, mean 0, its size the ripple (a smaller ripple is quieter)', () => {
  for (const rate of [44100, 48000]) {
    for (const [rect, tau] of [['half', 0], ['full', 0], ['half', 40], ['full', 40], ['full', 160]]) {
      const hum = logic.humPeriod(rect, tau, rate);
      assert.equal(hum.length, Math.round(rate / logic.rippleHz(rect)));
      close(hum.reduce((a, b) => a + b, 0) / hum.length, 0, 1e-12, 'mean removed');
      const pp = Math.max(...hum) - Math.min(...hum);
      close(pp, logic.stats(rect, tau).pp, 2e-3, `${rect} ${tau} size`);
      assert.ok(Math.max(...hum.map(Math.abs)) < 0.7, 'within the page\'s gain budget');
    }
  }
  const loud = logic.humPeriod('full', 40, 48000), quiet = logic.humPeriod('full', 160, 48000);
  assert.ok(Math.max(...quiet) < Math.max(...loud) / 2);
});

test('the state: the DC part is the output\'s mean, the traces span 0 … 60 ms', () => {
  const s = at({ rect: 'full', tau: 40 });
  const mean = s.out.slice(0, 100).reduce((a, q) => a + q[1], 0) / 100;   // 0 … 10 ms, one ripple period
  close(mean, s.mean, 3e-3);
  assert.equal(s.out[0][0], 0);
  assert.equal(s.out[s.out.length - 1][0], logic.T_MS);
  assert.equal(s.mains.length, s.out.length);
  close(s.acPeak, Math.max(1 - s.mean, s.mean - s.min), 1e-4);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const p of logic.presets) {
    const s = at(p.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ rect: 'half', tau: 70, ac: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer has no steps');
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset is valid for the model, and the page meta is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `preset ${p.id}: param ${k}`);
    assert.ok(logic.RECTS.includes(p.params.rect), `preset ${p.id}: rect`);
    assert.equal(logic.clampTau(p.params.tau, NaN), p.params.tau, `preset ${p.id}: tau on the slider`);
  }
  // the original's two buttons are presets: a 50 Hz and a 100 Hz hum
  const byId = Object.fromEntries(logic.presets.map((p) => [p.id, at(p.params)]));
  assert.equal(byId.half.f, 50);
  assert.equal(byId.full.f, 100);
});
