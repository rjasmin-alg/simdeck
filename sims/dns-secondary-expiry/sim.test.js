// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dns-secondary-expiry. Run: node --test sims/dns-secondary-expiry/
// Rules first (tie-breaks first of all), then the presets' numbers, then the template's generic block. SPEC.md.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const NONE = logic.NONE;
const DAY = 86400;
const P = (over) => Object.assign({}, logic.defaults, over);
const PRESETS = {
  'book-edit': { scene: 'lab', refresh: 3600, retry: 900, expire: 604800, bumpSerial: true, editAt: 600, killAt: NONE, reviveAt: NONE },
  'no-serial-bump': { scene: 'lab', refresh: 3600, retry: 900, expire: 604800, bumpSerial: false, editAt: 600, killAt: NONE, reviveAt: NONE },
  'primary-dies': { scene: 'lab', refresh: 3600, retry: 900, expire: 604800, bumpSerial: true, editAt: NONE, killAt: 0, reviveAt: NONE },
  'estate-14-days': { scene: 'estate', refresh: 10800, retry: 3600, expire: 1209600, bumpSerial: true, editAt: NONE, killAt: 10680, reviveAt: NONE },
  'revived-in-time': { scene: 'lab', refresh: 3600, retry: 900, expire: 604800, bumpSerial: true, editAt: NONE, killAt: 0, reviveAt: 432000 }
};
const run = (over) => {
  const p = P(over);
  const n = logic.steps(p);
  const out = [kit.stateAt(logic, p, 0)];
  for (let i = 1; i <= n; i++) out.push(logic.step(out[i - 1], i, p));
  return out;
};
const DIES = PRESETS['primary-dies'];

// ── rule 4 and the order of events at one second: tie-breaks first ──

test('rule 4 tie-break: at exactly lastOk + EXPIRE the zone is expired, one retry earlier it is not', () => {
  const r = run(DIES);
  const before = r[r.length - 2], at = r[r.length - 1];
  assert.equal(before.t, 604800 - 900);
  assert.equal(before.secondary.expired, false);
  assert.equal(before.client.rcode, 'NOERROR');
  assert.equal(at.t, 604800);
  assert.equal(at.secondary.expired, true);
  assert.equal(at.secondary.expiredAt, 604800);
  assert.equal(at.client.rcode, 'SERVFAIL');
});

test('tie-break: the expiry comes before a check at the same second, even one that succeeds', () => {
  // P back at 604000 → the next retry is at 604800 = lastOk + EXPIRE: the zone expires, then the retry reloads it
  const r = run({ editAt: NONE, killAt: 0, reviveAt: 604000 });
  const m = r.find((s) => s.t === 604800 && s.ev.kind === 'moment');
  assert.ok(m, 'a moment at 604800');
  assert.equal(m.ev.expired, true);
  assert.equal(m.ev.check.outcome, 'transfer');
  assert.equal(m.secondary.expired, false);
  assert.equal(m.secondary.lastOk, 604800);
});

test('tie-break: an action at the second of a check comes after it', () => {
  // primary-dies: the check at 0 has succeeded (initial state), then P dies at 0
  const r = run(DIES);
  assert.equal(r[0].primary.up, true);
  assert.equal(r[0].secondary.lastOk, 0);
  assert.deepEqual([r[1].ev.kind, r[1].ev.act, r[1].t], ['action', 'kill', 0]);
  // revived-in-time: the retry at 432000 still fails; P comes back in the next step, at the same second
  const v = run(PRESETS['revived-in-time']);
  const i = v.findIndex((s) => s.ev.kind === 'action' && s.ev.act === 'revive');
  assert.equal(v[i - 1].t, 432000);
  assert.equal(v[i - 1].ev.check.outcome, 'fail');
  assert.equal(v[i].t, 432000);
});

test('tie-break: actions at the same second go edit, kill, revive', () => {
  assert.deepEqual(logic.actions(P({ editAt: 50, killAt: 50, reviveAt: 50 })).map((a) => a.kind), ['edit', 'kill', 'revive']);
  assert.deepEqual(logic.actions(P({ editAt: 60, killAt: 50, reviveAt: NONE })).map((a) => a.kind), ['kill', 'edit']);
});

// ── rule 1: refresh every REFRESH after the last check ──

test('rule 1: S asks P every REFRESH seconds after its last check', () => {
  const r = run(PRESETS['book-edit']);
  assert.deepEqual(r.slice(2).map((s) => [s.t, s.ev.check.kind]), [[3600, 'refresh'], [7200, 'refresh'], [604800, 'refresh']]);
  assert.equal(r[3].secondary.nextRefresh, 7200 + 3600);
  const r2 = run(P({ refresh: 900, editAt: 100 }));
  assert.equal(r2[2].t, 900);
});

// ── rule 2: serials, not contents ──

test('rule 2: a greater serial on P → S transfers the zone and takes the new record', () => {
  const r = run(PRESETS['book-edit']);
  assert.equal(r[1].primary.serial, 2026090302);
  assert.equal(r[1].client.value, '192.168.180.100');
  assert.equal(r[2].ev.check.outcome, 'transfer');
  assert.equal(r[2].secondary.serial, 2026090302);
  assert.equal(r[2].secondary.records.klijent, '192.168.180.101');
  assert.equal(r[2].secondary.lastXfer, 3600);
  assert.equal(r[2].client.value, '192.168.180.101');
});

test('rule 2: an equal serial → S keeps its copy although P\'s record differs, and nothing reports an error', () => {
  const r = run(PRESETS['no-serial-bump']);
  assert.equal(r[1].primary.serial, 2026090301);
  assert.equal(r[1].primary.records.klijent, '192.168.180.101');
  for (const s of r.slice(2)) {
    assert.equal(s.ev.check.outcome, 'current');
    assert.equal(s.secondary.records.klijent, '192.168.180.100');
    assert.equal(s.client.rcode, 'NOERROR');
    assert.equal(s.secondary.mode, 'ok');
  }
  assert.equal(r[r.length - 1].t, 604800);
});

test('rule 2: a check with an equal serial is a successful refresh: lastOk and the expire deadline move', () => {
  const r = run(PRESETS['no-serial-bump']);
  assert.equal(r[2].secondary.lastOk, 3600);
  assert.equal(r[2].secondary.expireAt, 3600 + 604800);
  assert.equal(r[2].secondary.lastXfer, 0, 'no transfer');
});

test('rule 2: serial arithmetic per RFC 1982 (wrap, equal, exactly half the space apart)', () => {
  assert.equal(logic.serialGt(2026090302, 2026090301), true);
  assert.equal(logic.serialGt(2026090301, 2026090301), false);
  assert.equal(logic.serialGt(2026090300, 2026090301), false);
  assert.equal(logic.serialGt(0, 4294967295), true, 'wrapped past 2^32 − 1');
  assert.equal(logic.serialGt(4294967295, 0), false);
  assert.equal(logic.serialGt(2147483648, 0), false, 'exactly 2^31 apart is undefined, so not greater');
  assert.equal(logic.serialGt(0, 2147483648), false);
  assert.equal(logic.serialGt(2147483647, 0), true);
  assert.equal(logic.serialInc(4294967295), 0);
});

test('rule 2: a smaller serial on P is not a change either', () => {
  const s = logic.initial(P({ editAt: NONE }));
  s.primary.serial = 2026090300;
  s.primary.records.klijent = '192.0.2.1';
  const m = logic.moment(s, 3600);
  assert.equal(m.check.outcome, 'current');
  assert.equal(s.secondary.records.klijent, '192.168.180.100');
});

// ── rule 3: retry every RETRY while P does not answer ──

test('rule 3: a failed check → retries every RETRY; the refresh timer stops; the expiry stays put', () => {
  const r = run(DIES);
  assert.deepEqual([r[2].t, r[2].ev.check.kind, r[2].ev.check.outcome], [3600, 'refresh', 'fail']);
  assert.equal(r[2].secondary.mode, 'retrying');
  assert.equal(r[2].secondary.nextRefresh, null);
  assert.equal(r[2].secondary.nextRetry, 3600 + 900);
  assert.equal(r[2].secondary.expireAt, 604800);
  assert.deepEqual([r[3].t, r[3].ev.check.kind], [4500, 'retry']);
  assert.equal(r[3].secondary.nextRetry, 5400);
  const r2 = run(Object.assign({}, DIES, { retry: 600 }));
  assert.equal(r2[3].t, 3600 + 600);
});

// ── rules 4 and 5: the last copy until the expiry, then SERVFAIL ──

test('rule 5: until the expiry the client gets the last copy, whatever P does', () => {
  for (const s of run(DIES).slice(0, -1)) {
    assert.equal(s.client.rcode, 'NOERROR', `t = ${s.t}`);
    assert.equal(s.client.value, '192.168.180.100');
  }
});

test('rule 4: the expire clock runs from the last successful check, not from the last zone transfer', () => {
  const r = run(PRESETS['estate-14-days']);
  assert.equal(r[0].secondary.lastXfer, -734400);
  assert.equal(r[0].secondary.lastOk, 0);
  const last = r[r.length - 1];
  assert.equal(last.t, 1209600);
  assert.equal(last.secondary.expired, true);
  // in the estate's calendar: t = 0 is Tue 2026-11-10 17:02; SERVFAIL from Tue 2026-11-24 17:02
  const epoch = Date.parse(logic.SCENES.estate.epoch + ':00Z');
  assert.equal(new Date(epoch + last.t * 1000).toISOString(), '2026-11-24T17:02:00.000Z');
  assert.equal(new Date(epoch + last.t * 1000).getUTCDay(), 2);
  assert.equal(new Date(epoch + r[1].t * 1000).toISOString(), '2026-11-10T20:00:00.000Z');
  assert.equal(new Date(epoch + logic.SCENES.estate.lastXfer * 1000).toISOString(), '2026-11-02T05:02:00.000Z');
});

test('rule 4: after the expiry S keeps retrying; when P is back the zone is taken again, even with the same serial', () => {
  const r = run({ editAt: NONE, killAt: 0, reviveAt: 700000 });
  const exp = r.find((s) => s.ev.expired);
  assert.equal(exp.t, 604800);
  const back = r.find((s) => s.ev.kind === 'moment' && s.t > 700000);
  assert.equal(back.ev.check.outcome, 'transfer');
  assert.equal(back.secondary.serial, 2026090301);
  assert.equal(back.secondary.expired, false);
  assert.equal(back.client.rcode, 'NOERROR');
  assert.equal(back.secondary.lastXfer, back.t);
  // the retries between the expiry and P's return failed and kept the zone expired
  const between = r.filter((s) => s.t > 604800 && s.t <= 700000 && s.ev.kind === 'run');
  assert.equal(between.length, 1);
  assert.equal(between[0].client.rcode, 'SERVFAIL');
});

// ── rule 6: P back before the expiry ──

test('rule 6: P back before the expiry → the next retry succeeds and the expire clock starts over', () => {
  const r = run(PRESETS['revived-in-time']);
  const i = r.findIndex((s) => s.ev.kind === 'action' && s.ev.act === 'revive');
  const ok = r[i + 1];
  assert.deepEqual([ok.t, ok.ev.check.kind, ok.ev.check.outcome], [432900, 'retry', 'current']);
  assert.equal(ok.secondary.lastOk, 432900);
  assert.equal(ok.secondary.expireAt, 432900 + 604800);
  assert.equal(ok.secondary.mode, 'ok');
  assert.equal(ok.secondary.nextRefresh, 432900 + 3600);
  assert.equal(ok.secondary.nextRetry, null);
  assert.ok(r.every((s) => !s.secondary.expired));
});

// ── rule 7: no NOTIFY ──

test('rule 7: without NOTIFY an edit reaches S only at the next refresh', () => {
  const r = run(PRESETS['book-edit']);
  assert.equal(r[1].t, 600);
  assert.equal(r[1].secondary.serial, 2026090301);
  assert.equal(r[1].secondary.nextRefresh, 3600, 'the edit does not move the refresh');
});

// ── actions ──

test('actions: an edit without the serial toggle keeps the serial; edits and kills that cannot apply do nothing', () => {
  assert.equal(run(PRESETS['no-serial-bump'])[1].ev.bumped, false);
  const r = run({ editAt: 100, killAt: 50, reviveAt: NONE });
  const ed = r.find((s) => s.ev.act === 'edit');
  assert.equal(ed.ev.applied, false);
  assert.equal(ed.primary.records.klijent, '192.168.180.100');
  const v = run({ editAt: NONE, killAt: NONE, reviveAt: 100 });
  assert.equal(v.find((s) => s.ev.act === 'revive').ev.applied, false);
});

test('actions: an action shown at state n, added at its moment, leaves states 0..n as they were', () => {
  // the page's buttons put the action at s.t (a second later after an action at s.t) and drop later actions
  for (const [id, pre] of Object.entries(PRESETS)) {
    const base = run(pre);
    base.forEach((s, n) => {
      for (const kind of ['edit', 'kill', 'revive']) {
        if (s.acted.includes(kind)) continue;
        if ((kind === 'kill' || kind === 'edit') && !s.primary.up) continue;
        if (kind === 'revive' && s.primary.up) continue;
        const at = s.lastActionAt === s.t ? s.t + 1 : s.t;
        const p = Object.assign({}, pre);
        for (const k of ['edit', 'kill', 'revive']) if (!s.acted.includes(k)) p[k + 'At'] = NONE;
        p[kind + 'At'] = at;
        const r = run(p);
        assert.ok(r.length > n + 1, `${id} n=${n} ${kind}: a step follows`);
        for (let i = 0; i <= n; i++) {
          const a = Object.assign({}, base[i], { done: null }), b = Object.assign({}, r[i], { done: null });
          assert.deepEqual(b, a, `${id} n=${n} ${kind}: state ${i} unchanged`);
        }
        assert.equal(r[n + 1].ev.kind, 'action', `${id} n=${n} ${kind}: the next step is the action`);
        assert.equal(r[n + 1].ev.act, kind);
      }
    });
  }
});

// ── steps: routine checks are one step ──

test('steps: the first check of a kind is its own step; the identical ones after it are one step with a count', () => {
  const r = run(DIES);
  assert.deepEqual(r.slice(1).map((s) => s.ev.kind), ['action', 'moment', 'moment', 'run', 'moment']);
  assert.deepEqual([r[4].ev.from, r[4].t, r[4].ev.count], [5400, 603900, 666]);
});

test('steps: a check after an action, a transfer and a change of outcome are never folded into a run', () => {
  const r = run(PRESETS['book-edit']);
  assert.deepEqual(r.slice(1).map((s) => s.ev.kind), ['action', 'moment', 'moment', 'run']);
  assert.equal(r[3].ev.check.outcome, 'current');
  assert.equal(r[4].ev.count, 166);
  assert.equal(run(PRESETS['no-serial-bump'])[2].ev.kind, 'moment', 'first check after the edit');
});

test('steps: the run ends at the expiry while P is down, and one EXPIRE after the last action while P is up', () => {
  const dies = run(DIES);
  assert.equal(dies[dies.length - 1].ev.expired, true);
  assert.equal(dies[dies.length - 1].done, true);
  const edit = run(PRESETS['book-edit']);
  assert.equal(edit[edit.length - 1].t, 604800, 'last refresh not after 600 + 604800');
  const quiet = run({ editAt: NONE });
  assert.equal(quiet.length, 2);
  assert.deepEqual([quiet[1].ev.from, quiet[1].t, quiet[1].ev.count], [3600, 604800, 168]);
  assert.equal(logic.horizon(quiet[1], P({ editAt: NONE })), 604800);
});

test('steps: never more than MAX_STEPS (20)', () => {
  assert.equal(logic.MAX_STEPS, 20);
  const p = P({ refresh: 86400, retry: 7200, expire: 1209600, editAt: 0, killAt: 1, reviveAt: 1300000 });
  assert.ok(logic.steps(p) <= logic.MAX_STEPS);
  for (const pre of Object.values(PRESETS)) assert.ok(logic.steps(P(pre)) <= logic.MAX_STEPS);
});

// ── marks ──

test('marks: what changed in a step', () => {
  const r = run(DIES);
  assert.deepEqual(r[1].changed, ['primary']);
  assert.deepEqual(r[2].changed, ['secondary', 'refresh', 'retry']);
  assert.deepEqual(r[r.length - 1].changed, ['secondary', 'retry', 'expire', 'client']);
});

// ── the presets' numbers (SPEC.md §3) ──

test('presets: steps and the moments they show', () => {
  const sum = (id) => run(PRESETS[id]).slice(1).map((s) => [s.t, s.ev.kind === 'action' ? s.ev.act : s.ev.kind === 'run' ? '×' + s.ev.count : s.ev.expired ? 'expire' : s.ev.check.outcome]);
  assert.deepEqual(sum('book-edit'), [[600, 'edit'], [3600, 'transfer'], [7200, 'current'], [604800, '×166']]);
  assert.deepEqual(sum('no-serial-bump'), [[600, 'edit'], [3600, 'current'], [604800, '×167']]);
  assert.deepEqual(sum('primary-dies'), [[0, 'kill'], [3600, 'fail'], [4500, 'fail'], [603900, '×666'], [604800, 'expire']]);
  assert.deepEqual(sum('estate-14-days'), [[10680, 'kill'], [10800, 'fail'], [14400, 'fail'], [1206000, '×331'], [1209600, 'expire']]);
  assert.deepEqual(sum('revived-in-time'), [[0, 'kill'], [3600, 'fail'], [4500, 'fail'], [432000, '×475'], [432000, 'revive'],
    [432900, 'current'], [436500, 'current'], [1034100, '×166']]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pre of Object.values(PRESETS)) {
    for (const s of run(pre)) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const pre of Object.values(PRESETS)) {
    const p = P(pre);
    const forward = run(pre);
    for (let n = forward.length - 1; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P(DIES);
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  // and the page's presets are the ones tested here
  for (const [id, pre] of Object.entries(PRESETS)) {
    const m = html.match(new RegExp(`id: '${id}'[\\s\\S]*?params: \\{([^}]*)\\}`));
    assert.ok(m, `preset ${id} in the page`);
    const page = Function(`return {${m[1]}}`)();
    assert.deepEqual(page, pre, `preset ${id} params`);
  }
});

// ── split brain (task dns-split-brain): two primaries of one zone; SPEC.md "Split brain" ──

const SPLIT_PRESETS = {
  'split-brain': { scene: 'split', refresh: 3600, retry: 900, expire: 604800, bumpSerial: true, editAt: NONE, killAt: NONE, reviveAt: NONE },
  'split-brain-retire': { scene: 'retire', refresh: 3600, retry: 900, expire: 604800, bumpSerial: true, editAt: NONE, killAt: NONE, reviveAt: NONE }
};
const SPLIT = SPLIT_PRESETS['split-brain'], RETIRE = SPLIT_PRESETS['split-brain-retire'];
const vals = (list) => list.map((a) => (a.rcode === 'NOERROR' ? a.value : a.rcode));
/** Step a state the test has changed by hand to the end of its script. */
const runFrom = (s0, p) => { const out = [s0]; while (!out[out.length - 1].done) out.push(logic.step(out[out.length - 1], out.length, p)); return out; };

test('split tie-break: equal serials on two primaries still move nothing between them', () => {
  const p = P(SPLIT);
  const s0 = logic.initial(p);
  s0.servers.P1.serial = s0.servers.P2.serial; // the serial is the one thing a transfer would compare
  const r = runFrom(s0, p);
  for (const s of r) assert.deepEqual(s.servers.P1, s0.servers.P1, 'P1 never changes');
  assert.deepEqual(vals(r[r.length - 1].direct.P1), ['192.0.2.10', 'NXDOMAIN']);
});

test('split tie-break: a greater serial on the stale primary does not make its copy win, nor the other\'s', () => {
  const p = P(SPLIT);
  const s0 = logic.initial(p);
  s0.servers.P1.serial = 4000000000; // P1 now "newer" by serial
  const end = runFrom(s0, p).pop();
  assert.deepEqual(vals(end.groups.H.answers), ['192.0.2.10', 'NXDOMAIN']);
  assert.deepEqual(vals(end.groups.D.answers), ['192.0.2.20', '192.0.2.30']);
  assert.deepEqual(end.servers.P2.records, { 'corp.example': '192.0.2.20', 'app.corp.example': '192.0.2.30' });
});

test('split rule 1: a primary answers from its own copy only; the edit on P2 never reaches P1', () => {
  const r = run(SPLIT);
  const P1 = r[0].servers.P1;
  for (const s of r) assert.deepEqual(s.servers.P1, P1);
  const edit = r.find((s) => s.ev.kind === 'edit');
  assert.equal(edit.servers.P2.records['app.corp.example'], '192.0.2.30');
  assert.equal(edit.servers.P2.serial, 2026110102);
  assert.deepEqual(edit.changed, ['P2'], 'the edit changes P2 and nothing else');
  assert.deepEqual(logic.zoneAnswer({ records: { a: '1' } }, 'b'), { qname: 'b', rcode: 'NXDOMAIN', value: null, aa: true });
});

test('split rule 2: both servers answer with aa, each from its own copy, NXDOMAIN included', () => {
  const end = run(SPLIT).pop();
  assert.deepEqual(vals(end.direct.P1), ['192.0.2.10', 'NXDOMAIN']);
  assert.deepEqual(vals(end.direct.P2), ['192.0.2.20', '192.0.2.30']);
  for (const k of ['P1', 'P2']) for (const a of end.direct[k]) assert.equal(a.aa, true, `${k} ${a.qname} aa`);
  for (const g of ['H', 'D']) for (const a of end.groups[g].answers) assert.equal(a.aa, true, `group ${g} ${a.qname} aa`);
});

test('split rule 3: a group\'s answers depend only on the resolver it was given', () => {
  const p = P(SPLIT);
  const s0 = logic.initial(p);
  s0.groups.H.resolver = 'P2'; s0.groups.D.resolver = 'P1'; // swap DHCP option 6
  const end = runFrom(s0, p).pop();
  assert.deepEqual(vals(end.groups.H.answers), ['192.0.2.20', '192.0.2.30']);
  assert.deepEqual(vals(end.groups.D.answers), ['192.0.2.10', 'NXDOMAIN']);
  // and in the preset: H via P1, D via P2
  const r = run(SPLIT);
  for (const s of r.filter((x) => x.ev.kind === 'ask')) assert.equal(s.ev.server, { H: 'P1', D: 'P2' }[s.ev.group]);
});

test('retire tie-break: the converted secondary takes the zone only on a greater serial (equal, smaller, 2^31 apart keep it)', () => {
  const sec = (serial) => ({ serial, records: { 'corp.example': '192.0.2.10' } });
  const master = { serial: 2026110102, records: { 'corp.example': '192.0.2.20', 'app.corp.example': '192.0.2.30' } };
  for (const s of [2026110102, 2026110103, (2026110102 + 2147483648) % 4294967296]) {
    const x = sec(s);
    assert.equal(logic.refreshFrom(x, master), 'current', `serial ${s}`);
    assert.deepEqual(x.records, { 'corp.example': '192.0.2.10' });
  }
  const y = sec(2017010101);
  assert.equal(logic.refreshFrom(y, master), 'transfer');
  assert.deepEqual(y.records, master.records);
  assert.equal(y.serial, master.serial);
  // in the run: a P1 serial equal to P2's leaves group H on the old answers after the refresh
  const p = P(RETIRE);
  const s0 = logic.initial(p);
  s0.servers.P1.serial = s0.servers.P2.serial;
  const end = runFrom(s0, p).pop();
  assert.deepEqual(vals(end.groups.H.answers), ['192.0.2.10', 'NXDOMAIN']);
});

test('retire: the role changes at once, the copy only at the next refresh (REFRESH after the switch)', () => {
  const r = run(RETIRE);
  const conv = r.find((s) => s.ev.kind === 'convert');
  assert.equal(conv.servers.P1.role, 'secondary');
  assert.equal(conv.servers.P1.master, 'P2');
  assert.equal(conv.servers.P1.serial, 2017010101);
  assert.equal(conv.nextRefresh, 3600);
  const before = r.find((s) => s.ev.kind === 'ask');
  assert.deepEqual(vals(before.groups.H.answers), ['192.0.2.10', 'NXDOMAIN'], 'still the old copy, with aa');
  const ref = r.find((s) => s.ev.kind === 'refresh');
  assert.deepEqual([ref.t, ref.ev.outcome, ref.servers.P1.serial], [3600, 'transfer', 2026110102]);
  assert.equal(logic.step(logic.initial(P({ ...RETIRE, refresh: 900 })), 1, P({ ...RETIRE, refresh: 900 })).nextRefresh, 900);
});

test('split presets: steps and what each one shows (SPEC.md, "Split brain")', () => {
  const sum = (pre) => run(pre).slice(1).map((s) => [s.t, s.ev.kind + (s.ev.group ? ':' + s.ev.group : ''),
    s.ev.group ? vals(s.groups[s.ev.group].answers).join(' ') : s.direct ? ['P1', 'P2'].map((k) => vals(s.direct[k]).join(' ')).join(' / ') : '']);
  assert.deepEqual(sum(SPLIT), [[0, 'ask:H', '192.0.2.10 NXDOMAIN'], [0, 'ask:D', '192.0.2.20 NXDOMAIN'], [0, 'edit', ''],
    [0, 'ask:H', '192.0.2.10 NXDOMAIN'], [0, 'ask:D', '192.0.2.20 192.0.2.30'], [0, 'direct', '192.0.2.10 NXDOMAIN / 192.0.2.20 192.0.2.30']]);
  assert.deepEqual(sum(RETIRE), [[0, 'convert', ''], [0, 'ask:H', '192.0.2.10 NXDOMAIN'], [3600, 'refresh', ''],
    [3600, 'ask:H', '192.0.2.20 192.0.2.30'], [3600, 'direct', '192.0.2.20 192.0.2.30 / 192.0.2.20 192.0.2.30']]);
  assert.equal(logic.steps(P(SPLIT)), 6);
  assert.equal(logic.steps(P(RETIRE)), 5);
  // retire starts where split-brain ends
  const endSplit = run(SPLIT).pop(), startRetire = logic.initial(P(RETIRE));
  assert.deepEqual(startRetire.servers, endSplit.servers);
  assert.deepEqual(startRetire.groups, endSplit.groups);
});

test('split marks: what changed in a step', () => {
  const r = run(SPLIT);
  assert.deepEqual(r.slice(1).map((s) => s.changed), [['H'], ['D'], ['P2'], [], ['D'], ['direct']]);
});

test('split: JSON-safe, deterministic, step back equals replay, input not mutated, page presets match', () => {
  for (const pre of Object.values(SPLIT_PRESETS)) {
    const p = P(pre), forward = run(pre);
    for (const s of forward) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    for (let n = forward.length - 1; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
    const s0 = logic.initial(p), copy = structuredClone(s0);
    logic.step(s0, 1, p);
    assert.deepEqual(s0, copy);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  for (const [id, pre] of Object.entries(SPLIT_PRESETS)) {
    const m = html.match(new RegExp(`id: '${id}'[\\s\\S]*?params: \\{([^}]*)\\}`));
    assert.ok(m, `preset ${id} in the page`);
    assert.deepEqual(Function(`return {${m[1]}}`)(), pre, `preset ${id} params`);
  }
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.ok(json.entries.some((e) => e.preset === 'split-brain'), 'entry split-brain');
});
