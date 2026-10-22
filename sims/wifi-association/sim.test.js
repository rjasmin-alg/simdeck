// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for wifi-association's model (rules: SPEC.md). Run: node --test sims/wifi-association/
// Tie-breaks first, then rules 1–6 and the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const PRESETS = {
  'book-order': {},
  passive: { scan: 'passive' },
  'choose-best': {},
  'open-network': { security: 'open' },
  wpa3: { security: 'wpa3' },
  rejected: { reject: true }
};
const ALL = [];
for (const scan of ['active', 'passive']) for (const security of ['open', 'wpa2', 'wpa3']) for (const reject of [false, true])
  ALL.push({ scan, security, reject });

/** Every state of a run, 0 … steps. */
function run(over) {
  const p = P(over);
  const out = [logic.initial(p)];
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) out.push(logic.step(out[i - 1], i, p));
  return out;
}
const last = (over) => run(over).slice(-1)[0];
const kinds = (over) => run(over).slice(1).map((s) => s.ev.kind);
const types = (s) => s.frames.map((f) => f.type);
const heardOf = (ap, rssi, ssid) => ({ ap, bssid: ap, ssid: ssid || 'Grafo', ch: 1, rssi, sec: 'wpa2', via: 'probe' });

// ── tie-breaks ──

test('tie-break: equal signals, the AP heard first is chosen', () => {
  assert.equal(logic.choose([heardOf('AP2', -50), heardOf('AP1', -50)], 'Grafo', []), 'AP2');
  assert.equal(logic.choose([heardOf('AP1', -50), heardOf('AP2', -50)], 'Grafo', []), 'AP1');
  // a stronger one later still wins
  assert.equal(logic.choose([heardOf('AP2', -50), heardOf('AP1', -49)], 'Grafo', []), 'AP1');
});

test('tie-break: the scan goes channel by channel, lowest first, so the list fills AP3, AP1, AP2 in both modes', () => {
  assert.deepEqual(logic.SCAN.map((a) => a.ch), [1, 6, 11]);
  for (const scan of ['active', 'passive']) assert.deepEqual(last({ scan }).heard.map((h) => h.ap), ['AP3', 'AP1', 'AP2']);
  assert.deepEqual(run({ scan: 'passive' }).slice(1, 4).map((s) => s.ev.ap), ['AP3', 'AP1', 'AP2']);
});

// ── rules ──

test('rule 1: passive and active scans give the same information, SSID included', () => {
  const strip = (h) => ({ ap: h.ap, bssid: h.bssid, ssid: h.ssid, ch: h.ch, rssi: h.rssi, sec: h.sec });
  for (const security of ['open', 'wpa2', 'wpa3']) {
    const a = run({ security }), b = run({ security, scan: 'passive' });
    assert.deepEqual(a[2].heard.map(strip), b[3].heard.map(strip));
    assert.ok(a[2].heard.every((h) => h.via === 'probe' && h.ssid));
    assert.ok(b[3].heard.every((h) => h.via === 'beacon' && h.ssid));
  }
  // active: a Probe Request first, then the responses; passive: Beacons only, the station sends nothing
  assert.deepEqual(types(run({})[2]), ['probe-req', 'probe-resp', 'probe-resp', 'probe-resp']);
  assert.deepEqual(types(run({ scan: 'passive' })[3]), ['beacon', 'beacon', 'beacon']);
  assert.ok(run({ scan: 'passive' })[3].frames.every((f) => f.from !== 'STA'));
});

test('rule 2: every AP that hears the probe answers, and the station chooses the strongest of its network', () => {
  const s = run({})[2];
  assert.deepEqual(s.frames[0].to.slice().sort(), ['AP1', 'AP2', 'AP3']);
  assert.deepEqual(s.frames.filter((f) => f.type === 'probe-resp').map((f) => f.from).sort(), ['AP1', 'AP2', 'AP3']);
  assert.equal(s.chosen, null);                // the network has not chosen anything for the station
  const c = run({})[3];
  assert.equal(c.ev.kind, 'choose');
  assert.equal(c.chosen, 'AP1');               // −45 over −70
  // the SSID filter comes before the signal: Kafic stronger than everything is still not chosen
  assert.equal(logic.choose([heardOf('AP3', -30, 'Kafic'), heardOf('AP2', -70)], 'Grafo', []), 'AP2');
  assert.equal(logic.choose([heardOf('AP3', -30, 'Kafic')], 'Grafo', []), null);
  // a refused AP is skipped
  assert.equal(logic.choose([heardOf('AP1', -45), heardOf('AP2', -70)], 'Grafo', ['AP1']), 'AP2');
});

test('rule 3: authentication always comes before association', () => {
  for (const o of ALL) {
    const s = last(o);
    s.frames.forEach((f, i) => {
      if (f.type !== 'assoc-req') return;
      const ok = s.frames.slice(0, i).some((g) => g.type === 'auth' && g.from === f.to && g.status === 0 && (g.alg === 'open' || g.seq === 2));
      assert.ok(ok, 'auth before assoc to ' + f.to + ' ' + JSON.stringify(o));
    });
  }
  // the model refuses an Association Request to an AP the station has not authenticated with
  const s = structuredClone(run({})[4]);
  s.pair.AP1 = 1;
  assert.throws(() => logic.step(s, 5, P({})), /before authentication/);
});

test('rule 4: Open System for open and WPA2 networks, SAE Commit and Confirm for WPA3', () => {
  for (const security of ['open', 'wpa2']) {
    const s = run({ security })[4];
    assert.equal(s.ev.kind, 'auth');
    const auth = s.frames.filter((f) => f.type === 'auth');
    assert.deepEqual(auth.map((f) => [f.alg, f.seq, f.from]), [['open', 1, 'STA'], ['open', 2, 'AP1']]);
    assert.equal(s.pair.AP1, 2);
  }
  const w = run({ security: 'wpa3' });
  assert.equal(w[4].ev.kind, 'sae-commit');
  assert.equal(w[4].pair.AP1, 1);              // not authenticated after Commit alone
  assert.equal(w[5].ev.kind, 'sae-confirm');
  assert.equal(w[5].pair.AP1, 2);
  assert.deepEqual(w[5].frames.filter((f) => f.type === 'auth').map((f) => [f.alg, f.seq, f.from]),
    [['sae', 1, 'STA'], ['sae', 1, 'AP1'], ['sae', 2, 'STA'], ['sae', 2, 'AP1']]);
  // Open System checks nothing: the station is authenticated before any key or password is used
  assert.equal(run({})[4].staState, 'auth');
});

test('rule 5: status 0 gives an AID and informs the distribution system', () => {
  const s = run({})[6];
  assert.equal(s.ev.kind, 'assoc');
  const resp = s.frames.filter((f) => f.type === 'assoc-resp');
  assert.deepEqual(resp.map((f) => [f.status, f.aid]), [[0, 4]]);
  assert.equal(s.aid, 4);
  assert.equal(s.pair.AP1, 3);
  assert.deepEqual(s.frames.at(-1), { type: 'ds', at: 'AP1' });
});

test('rule 5: a non-zero status leaves the station authenticated, not associated, and it tries the next AP', () => {
  const states = run({ reject: true });
  const r = states[6];
  assert.equal(r.ev.kind, 'refused');
  assert.equal(r.status, logic.REFUSED);
  assert.equal(r.status, 17);
  assert.equal(r.aid, null);
  assert.equal(r.pair.AP1, 2);                 // authenticated with AP1, not associated
  assert.equal(r.chosen, 'AP2');
  assert.equal(r.staState, 'none');            // the ladder now counts towards AP2
  assert.ok(!r.frames.some((f) => f.type === 'ds'));
  assert.deepEqual(kinds({ reject: true }).slice(6), ['auth', 'assoc-req', 'assoc', 'keys', 'data']);
  const end = states.at(-1);
  assert.equal(end.aid, 2);
  assert.deepEqual(end.pair, { AP1: 2, AP2: 4, AP3: 1 });
  assert.equal(end.frames.filter((f) => f.type === 'data')[0].to, 'AP2');
});

test('rule 6: on WPA no data before the handshake; on an open network data right after association, unencrypted', () => {
  assert.equal(logic.dataAllowed('wpa2', 3), false);
  assert.equal(logic.dataAllowed('wpa3', 3), false);
  assert.equal(logic.dataAllowed('wpa2', 4), true);
  assert.equal(logic.dataAllowed('open', 3), true);
  assert.equal(logic.dataAllowed('open', 2), false);
  for (const o of ALL) {
    const states = run(o);
    const d = states.findIndex((s) => s.ev.kind === 'data');
    const k = states.findIndex((s) => s.ev.kind === 'keys');
    const a = states.findIndex((s) => s.ev.kind === 'assoc');
    if (o.security === 'open') { assert.equal(k, -1); assert.equal(d, a + 1); }
    else assert.ok(k > a && d === k + 1, JSON.stringify(o));
    assert.equal(states[d].frames.at(-1).enc, o.security !== 'open');
  }
  // the model refuses data on WPA before the keys
  const s = structuredClone(run({})[6]);
  assert.throws(() => logic.step(s, 8, P({})), /data before/);
});

test('the ladder only climbs towards one AP, in order', () => {
  for (const o of ALL) {
    const states = run(o);
    let prev = 0, target = null;
    for (const s of states) {
      const k = logic.LADDER.indexOf(s.staState);
      if (s.chosen !== target) { target = s.chosen; prev = k; continue; }
      const skip = o.security === 'open' && s.staState === 'data' ? 2 : 1;   // no keys rung on an open network
      assert.ok(k >= prev && k <= prev + skip, JSON.stringify(o) + ' step ' + s.n);
      prev = k;
    }
    assert.equal(states.at(-1).staState, 'data');
  }
});

// ── presets ──

test('presets: step counts and runs (SPEC.md table)', () => {
  const expect = { 'book-order': 8, passive: 9, 'choose-best': 8, 'open-network': 7, wpa3: 9, rejected: 11 };
  for (const [id, o] of Object.entries(PRESETS)) assert.equal(logic.steps(P(o)), expect[id], id);
  assert.deepEqual(kinds({}), ['probe', 'responses', 'choose', 'auth', 'assoc-req', 'assoc', 'keys', 'data']);
  assert.deepEqual(kinds({ scan: 'passive' }).slice(0, 4), ['beacon', 'beacon', 'beacon', 'choose']);
  assert.deepEqual(kinds({ security: 'open' }), ['probe', 'responses', 'choose', 'auth', 'assoc-req', 'assoc', 'data']);
  assert.deepEqual(kinds({ security: 'wpa3' }).slice(3, 5), ['sae-commit', 'sae-confirm']);
  assert.equal(kinds({ reject: true })[5], 'refused');
  assert.equal(logic.steps(P({ scan: 'passive', security: 'wpa3', reject: true })), 14);
});

/** A frame in one line: type, sender > receiver(s), channel, then the fields that matter. */
const fmt = (f) => f.type === 'ds' ? 'ds @' + f.at : [f.type + (f.alg ? '/' + f.alg + f.seq : ''), f.from + '>' + [].concat(f.to).join(','),
  'ch' + [].concat(f.ch).join(','), f.ssid, f.status != null ? 's' + f.status : null, f.aid ? 'aid' + f.aid : null,
  f.enc != null ? (f.enc ? 'enc' : 'clear') : null].filter(Boolean).join(' ');
const evs = (over) => run(over).slice(1).map((s) => [s.ev.kind, s.ev.ap, s.ev.next, s.ev.aid, s.ev.last].filter((x) => x != null).join(' '));

test('golden: book-order, every frame and event (SPEC.md preset 1)', () => {
  assert.deepEqual(last({}).frames.map(fmt), [
    'probe-req STA>AP3,AP1,AP2 ch1,6,11',
    'probe-resp AP3>STA ch1 Kafic', 'probe-resp AP1>STA ch6 Grafo', 'probe-resp AP2>STA ch11 Grafo',
    'auth/open1 STA>AP1 ch6', 'auth/open2 AP1>STA ch6 s0',
    'assoc-req STA>AP1 ch6 Grafo', 'assoc-resp AP1>STA ch6 s0 aid4', 'ds @AP1',
    'hs AP1>STA ch6', 'data STA>AP1 ch6 enc'
  ]);
  assert.deepEqual(evs({}), ['probe', 'responses', 'choose AP1', 'auth AP1', 'assoc-req AP1', 'assoc AP1 4', 'keys AP1', 'data AP1']);
  assert.deepEqual(last({}).heard.map((h) => h.ap + ' ' + h.sec), ['AP3 open', 'AP1 wpa2', 'AP2 wpa2']);
});

test('golden: rejected, every frame and event (SPEC.md preset 6)', () => {
  const s = last({ reject: true });
  assert.deepEqual(s.frames.slice(4).map(fmt), [
    'auth/open1 STA>AP1 ch6', 'auth/open2 AP1>STA ch6 s0',
    'assoc-req STA>AP1 ch6 Grafo', 'assoc-resp AP1>STA ch6 s17',
    'auth/open1 STA>AP2 ch11', 'auth/open2 AP2>STA ch11 s0',
    'assoc-req STA>AP2 ch11 Grafo', 'assoc-resp AP2>STA ch11 s0 aid2', 'ds @AP2',
    'hs AP2>STA ch11', 'data STA>AP2 ch11 enc'
  ]);
  assert.deepEqual(evs({ reject: true }).slice(5), ['refused AP1 AP2', 'auth AP2', 'assoc-req AP2', 'assoc AP2 2', 'keys AP2', 'data AP2']);
  assert.equal(s.status, 0);
  assert.equal(run({ reject: true })[6].status, 17);
});

test('golden: passive + WPA3 + reject, every frame and event; Kafic stays open whatever Grafo uses', () => {
  const o = { scan: 'passive', security: 'wpa3', reject: true };
  assert.deepEqual(last(o).frames.map(fmt), [
    'beacon AP3>STA ch1 Kafic', 'beacon AP1>STA ch6 Grafo', 'beacon AP2>STA ch11 Grafo',
    'auth/sae1 STA>AP1 ch6', 'auth/sae1 AP1>STA ch6 s0', 'auth/sae2 STA>AP1 ch6', 'auth/sae2 AP1>STA ch6 s0',
    'assoc-req STA>AP1 ch6 Grafo', 'assoc-resp AP1>STA ch6 s17',
    'auth/sae1 STA>AP2 ch11', 'auth/sae1 AP2>STA ch11 s0', 'auth/sae2 STA>AP2 ch11', 'auth/sae2 AP2>STA ch11 s0',
    'assoc-req STA>AP2 ch11 Grafo', 'assoc-resp AP2>STA ch11 s0 aid2', 'ds @AP2',
    'hs AP2>STA ch11', 'data STA>AP2 ch11 enc'
  ]);
  assert.deepEqual(evs(o), ['beacon AP3 false', 'beacon AP1 false', 'beacon AP2 true', 'choose AP1', 'sae-commit AP1',
    'sae-confirm AP1', 'assoc-req AP1', 'refused AP1 AP2', 'sae-commit AP2', 'sae-confirm AP2', 'assoc-req AP2',
    'assoc AP2 2', 'keys AP2', 'data AP2']);
  for (const security of ['open', 'wpa2', 'wpa3']) {
    const h = last({ security }).heard;
    assert.deepEqual(h.map((x) => x.sec), ['open', security, security]);
    assert.equal(last({ security }).scanMode, 'active');
  }
  assert.equal(last({ scan: 'passive' }).scanMode, 'passive');
});

test('every combination ends in data within 20 steps; reject changes nothing before the Association Response', () => {
  for (const o of ALL) {
    const n = logic.steps(P(o));
    assert.ok(n >= 7 && n <= 20, JSON.stringify(o));
    assert.ok(last(o).done);
    if (o.reject) {
      const a = run(o), b = run(Object.assign({}, o, { reject: false }));
      const at = a.findIndex((s) => s.ev.kind === 'refused');
      for (let i = 0; i < at; i++) assert.deepEqual(a[i], b[i]);
    }
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of ALL) for (const s of run(o)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of ALL) {
    const p = P(o);
    const forward = run(o);
    for (let n = forward.length - 1; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ security: 'wpa3', reject: true });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of Object.keys(PRESETS)) assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
});
