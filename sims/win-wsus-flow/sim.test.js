// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-wsus-flow's model (SPEC.md). Run: node --test sims/win-wsus-flow/
// Tie-breaks first, then one test per rule, then the presets' step counts, then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const def = { initial: logic.initial, step: logic.step };
const at = (over, n) => kit.stateAt(def, P(over), n);
/** The whole run: the log of every step. */
const run = (over) => { const p = P(over); return at(over, logic.steps(p)).log; };
const find = (log, kind, who, i = 0) => log.filter((e) => e.kind === kind && e.who === who)[i];
/** Run from a hand-made state until nothing changes; returns the log. */
function runFrom(s, p) {
  const log = [];
  for (let n = 1; n <= 40; n++) {
    s = logic.step(s, n, p);
    if (s.done) break;
    log.push(s.last);
  }
  return log;
}
// times: hours from Tue 19:00
const WED = (h) => 5 + h, THU = (h) => 29 + h, FRI = (h) => 53 + h, SAT = (h) => 77 + h;

// ── tie-breaks ──

test('tie-break: a scan at the same time as an approval sees it (approval phase 2 before scan phase 4)', () => {
  const p = P();
  const s = logic.initial(p);
  s.clients[0].nextScan = p.approveAt;           // PC-HQ1 scans at Wed 09:00, the moment of the approval
  const log = runFrom(s, p);
  const ap = log.findIndex((e) => e.kind === 'approve');
  const sc = log.findIndex((e) => e.kind === 'scan' && e.who === 'PC-HQ1');
  assert.ok(ap >= 0 && sc > ap, 'approval runs first');
  assert.equal(log[sc].t, p.approveAt);
  assert.equal(log[sc].outcome, 'detected');
});

test('tie-break: phase order at one time: sync before server content (approve at Wed 03:30)', () => {
  const log = run({ approveAt: 8.5 });
  const sync = log.findIndex((e) => e.kind === 'sync' && e.who === 'BR' && e.t === WED(4));
  const cont = log.findIndex((e) => e.kind === 'content' && e.who === 'HQ');
  assert.equal(log[cont].t, WED(4), 'HQ content at 04:00 = 03:30 + 30 min');
  assert.ok(sync >= 0 && sync < cont, 'the 04:00 sync runs before the 04:00 content download');
  assert.deepEqual(log[sync].got, ['meta', 'approval'], 'the replica takes the 03:30 approval at once');
});

test('tie-break: same time and phase: PC-HQ1 before PC-BR1', () => {
  const log = run({ branchPointsToHQ: true });
  const ins = log.filter((e) => e.kind === 'install');
  assert.deepEqual(ins.map((e) => [e.who, e.t]), [['PC-HQ1', THU(3)], ['PC-BR1', THU(3)]]);
  assert.ok(log.indexOf(ins[0]) < log.indexOf(ins[1]));
});

test('tie-break: the report goes with the scan at the same time (scan phase 4, report phase 7)', () => {
  const log = run({});
  const rep = find(log, 'report', 'PC-HQ1');
  assert.equal(rep.t, THU(10), 'PC-HQ1 scans Wed 14:00 + 20 h = Thu 10:00 and reports then');
});

test('tie-break: install at 03:00 counts a download at exactly 03:00 (nextAtHour is inclusive)', () => {
  assert.equal(logic.nextAtHour(WED(3), 3), WED(3));
  assert.equal(logic.nextAtHour(WED(3) + 0.5, 3), THU(3));
  assert.equal(logic.nextAtHour(0, 3), WED(3));
  assert.equal(logic.nextAtHour(0, 19), 0);
});

// ── rules ──

test('rule 1: the upstream syncs from Microsoft Update on its schedule, only for selected products', () => {
  const on = run({});
  assert.equal(on[0].kind, 'sync');
  assert.equal(on[0].who, 'HQ');
  assert.equal(on[0].t, WED(3));
  assert.deepEqual(on[0].got, ['meta']);
  const off = run({ upstreamProducts: false });
  assert.equal(off[0].outcome, 'skipped');
  assert.ok(off.every((e) => !(e.got && e.got.length)), 'never any metadata anywhere');
  assert.equal(at({ upstreamProducts: false }, logic.steps(P({ upstreamProducts: false }))).servers.HQ.meta, false);
});

test('rule 2: content downloads at approval (+30 min), not at sync', () => {
  const p = P();
  const afterSync = at({}, 1);
  assert.equal(afterSync.servers.HQ.meta, true);
  assert.equal(afterSync.servers.HQ.content, false);
  const log = run({});
  assert.equal(find(log, 'content', 'HQ').t, WED(9.5));
  assert.equal(find(log, 'approve', 'HQ').t, p.approveAt);
});

test('rule 3: the downstream syncs from its upstream and gets only what the upstream has', () => {
  const log = run({});
  const brSync = find(log, 'sync', 'BR');
  assert.equal(brSync.t, WED(4));
  assert.deepEqual(brSync.got, ['meta'], 'metadata only: HQ has not approved yet');
  const off = run({ upstreamProducts: false });
  assert.equal(find(off, 'sync', 'BR').outcome, 'empty');
  // a BR sync before the HQ sync has nothing: shift HQ's sync to 05:00
  const s = logic.initial(P());
  s.servers.HQ.syncHour = 5;
  const l2 = runFrom(s, P());
  assert.equal(l2[0].who, 'BR');
  assert.equal(l2[0].outcome, 'empty');
});

test('rule 4: replica takes approvals at its sync; its admin cannot approve', () => {
  const log = run({});
  const sync = log.filter((e) => e.kind === 'sync' && e.who === 'BR')[1];
  assert.equal(sync.t, THU(4));
  assert.deepEqual(sync.got, ['approval']);
  const cant = run({ brAt: 2 });
  const tryIt = find(cant, 'approve', 'BR');
  assert.equal(tryIt.outcome, 'replica');
  assert.equal(tryIt.t, WED(4));
  const s = at({ brAt: 2 }, 3);
  assert.equal(logic.approvedFor(s.servers.BR, logic.GROUP), false, 'nothing approved at the branch');
});

test('rule 4: autonomous gets metadata, not approvals; the branch admin approves locally', () => {
  const log = run({ mode: 'autonomous' });
  const syncs = log.filter((e) => e.kind === 'sync' && e.who === 'BR');
  assert.deepEqual(syncs[0].got, ['meta']);
  assert.equal(syncs[1].t, THU(4));
  assert.equal(syncs[1].notInherited, true);
  assert.deepEqual(syncs[1].got, []);
  assert.ok(!log.some((e) => e.who === 'PC-BR1' && e.kind !== 'scan'), 'PC-BR1 gets nothing');
  assert.equal(find(log, 'scan', 'PC-BR1').outcome, 'notApproved');
  const ok = run({ mode: 'autonomous', brAt: 10 });
  const ap = find(ok, 'approve', 'BR');
  assert.equal(ap.outcome, 'approved');
  assert.equal(ap.t, THU(10));
  assert.equal(find(ok, 'report', 'PC-BR1').t, FRI(5));
});

test('rule 4: the branch admin cannot approve what the branch does not know', () => {
  const log = run({ mode: 'autonomous', brAt: 0 });
  assert.equal(log[0].kind, 'approve');
  assert.equal(log[0].outcome, 'noMeta');
  assert.equal(find(run({ upstreamProducts: false }), 'approve', 'HQ').outcome, 'noMeta');
});

test('rule 5: downstream content after its approval, from the upstream; the upstream fetches first if needed', () => {
  const log = run({});
  assert.equal(find(log, 'content', 'BR').t, THU(4.5));
  assert.equal(find(log, 'content', 'BR').from, 'HQ');
  // autonomous branch approves at Wed 04:00, before HQ approved anything: HQ fetches at 04:30, BR copies at 05:00
  const early = run({ mode: 'autonomous', brAt: 2 });
  const hq = find(early, 'content', 'HQ'), br = find(early, 'content', 'BR');
  assert.equal(hq.t, WED(4.5));
  assert.equal(br.t, WED(5));
  assert.ok(early.indexOf(hq) < early.indexOf(br));
});

test('rule 6: a client scans its own WSUS about every 22 h minus 0–20 %, detecting only approved updates', () => {
  const s0 = logic.initial(P());
  for (const c of s0.clients) assert.ok(c.interval <= 22 && c.interval >= 22 * 0.8, `${c.id} interval ${c.interval}`);
  const log = run({});
  assert.deepEqual(log.filter((e) => e.kind === 'scan').map((e) => [e.who, e.server, e.t, e.outcome]), [
    ['PC-HQ1', 'HQ', WED(14), 'detected'],
    ['PC-BR1', 'BR', WED(17), 'notApproved'],
    ['PC-BR1', 'BR', THU(11), 'detected']
  ]);
  const off = run({ upstreamProducts: false });
  assert.deepEqual(off.filter((e) => e.kind === 'scan').map((e) => e.outcome), ['absent', 'absent']);
});

test('rule 7: download from its WSUS, install at 03:00, report at the next contact', () => {
  const log = run({});
  const d = find(log, 'download', 'PC-HQ1'), i = find(log, 'install', 'PC-HQ1'), r = find(log, 'report', 'PC-HQ1');
  assert.equal(d.t, WED(14.5));
  assert.equal(d.server, 'HQ');
  assert.equal(d.wan, false);
  assert.equal(i.t, THU(3));
  assert.equal(r.t, THU(10));
  assert.equal(r.server, 'HQ');
  assert.equal(find(log, 'install', 'PC-BR1').t, FRI(3));
  assert.equal(find(log, 'report', 'PC-BR1').t, FRI(5));
  const end = at({}, logic.steps(P()));
  assert.ok(end.clients.every((c) => c.state === 'reported'));
});

test('rule 7: a client waits for its server\'s content before it downloads', () => {
  const p = P();
  const s = logic.initial(p);
  s.clients[1].nextScan = THU(4);                // PC-BR1 scans at the sync that brings the approval, before the content
  const log = runFrom(s, p);
  const scan = log.find((e) => e.kind === 'scan' && e.who === 'PC-BR1' && e.outcome === 'detected');
  assert.equal(scan.t, THU(4));
  assert.equal(find(log, 'download', 'PC-BR1').t, THU(5), 'content at 04:30, then 30 min');
});

test('rule 7: the download starts only when the server has the files (autonomous approval before HQ has them)', () => {
  const p = P({ mode: 'autonomous', brAt: 2 });
  let s = kit.stateAt(def, p, 2);                 // after WSUS-BR's Wed 04:00 sync
  s = JSON.parse(JSON.stringify(s));
  s.clients[1].nextScan = WED(4);                 // PC-BR1 scans right after the branch approval at 04:00
  const log = [];
  for (let n = 3; n <= 40; n++) { s = logic.step(s, n, p); if (s.done) break; log.push(s.last); }
  assert.equal(find(log, 'scan', 'PC-BR1').outcome, 'detected');
  assert.equal(find(log, 'content', 'BR').t, WED(5));
  assert.equal(find(log, 'download', 'PC-BR1').t, WED(5.5), 'not 30 min after the scan');
});

test('tie-break: a report at the time of the branch sync is rolled up only at the following sync (sync phase 1)', () => {
  const p = P();
  let s = kit.stateAt(def, p, 14);                // PC-BR1 installed Fri 03:00
  assert.equal(s.last.kind, 'install');
  s = JSON.parse(JSON.stringify(s));
  s.clients[1].nextScan = FRI(4);                 // its next contact is at WSUS-BR's Fri 04:00 sync
  const log = [];
  for (let n = 15; n <= 40; n++) { s = logic.step(s, n, p); if (s.done) break; log.push(s.last); }
  assert.equal(find(log, 'report', 'PC-BR1').t, FRI(4));
  const roll = log.find((e) => e.kind === 'sync' && e.rolled && e.rolled.length);
  assert.equal(roll.t, SAT(4));
});

test('rule 8: a replica rolls client status up at its next sync; an autonomous server does not', () => {
  const log = run({});
  const last = log[log.length - 1];
  assert.equal(last.kind, 'sync');
  assert.equal(last.t, SAT(4));
  assert.deepEqual(last.rolled, ['PC-BR1']);
  assert.equal(at({}, logic.steps(P())).servers.HQ.reports['PC-BR1'], 'installed');
  const auto = at({ mode: 'autonomous', brAt: 10 }, logic.steps(P({ mode: 'autonomous', brAt: 10 })));
  assert.equal(auto.servers.BR.reports['PC-BR1'], 'installed');
  assert.equal(auto.servers.HQ.reports['PC-BR1'], undefined);
});

test('client pointing at WSUS-HQ downloads over the WAN and bypasses the branch server', () => {
  const log = run({ branchPointsToHQ: true });
  const scan = find(log, 'scan', 'PC-BR1');
  assert.equal(scan.server, 'HQ');
  assert.equal(scan.t, WED(17));
  const d = find(log, 'download', 'PC-BR1');
  assert.equal(d.wan, true);
  assert.equal(d.t, WED(18));
  assert.equal(find(log, 'report', 'PC-BR1').server, 'HQ');
  const end = at({ branchPointsToHQ: true }, logic.steps(P({ branchPointsToHQ: true })));
  assert.deepEqual(end.servers.BR.reports, {});
});

test('a step is an event that changes something: no silent sync or scan in the log', () => {
  const log = run({});
  assert.ok(!log.some((e) => e.kind === 'sync' && e.who === 'HQ' && e.t === THU(3)), 'HQ\'s Thu 03:00 sync changes nothing');
  const scans = log.filter((e) => e.kind === 'scan' && e.who === 'PC-HQ1');
  assert.equal(scans.length, 1, 'PC-HQ1\'s later scans change nothing (the report is its own step)');
  log.forEach((e, i) => assert.equal(e.n, i + 1));
  for (let i = 1; i < log.length; i++) assert.ok(log[i].t >= log[i - 1].t, 'time never runs back');
});

test('autonomous: an upstream change the branch already has is no step', () => {
  const log = run({ mode: 'autonomous', brAt: 5 });
  assert.ok(!log.some((e) => e.kind === 'sync' && e.who === 'BR' && e.outcome === 'nothing' && !e.notInherited), 'no "nothing new" sync');
});

test('autonomous with the HQ approval before the branch sync: metadata comes, the approval does not', () => {
  const sync = find(run({ mode: 'autonomous', approveAt: 8.5 }), 'sync', 'BR');
  assert.deepEqual(sync.got, ['meta']);
  assert.equal(sync.notInherited, true);
});

test('the button at the end of autonomous-waits: the branch timeline', () => {
  const log = run({ mode: 'autonomous', brAt: 10 }).slice(10);
  assert.deepEqual(log.map((e) => [e.kind, e.who, e.t]), [
    ['approve', 'BR', THU(10)], ['content', 'BR', THU(10.5)], ['scan', 'PC-BR1', THU(11)],
    ['download', 'PC-BR1', THU(11.5)], ['install', 'PC-BR1', FRI(3)], ['report', 'PC-BR1', FRI(5)]
  ]);
});

test('the page\'s scan time is the last scan that was a step (later silent scans do not move it)', () => {
  const end = at({}, logic.steps(P()));
  const hq1 = end.clients[0];
  assert.equal(hq1.scanT, WED(14));
  assert.ok(hq1.lastScan > THU(10), 'silent scans went on');
  assert.equal(end.clients[1].scanT, THU(11));
});

test('time never runs back, in any combination', () => {
  for (const mode of ['replica', 'autonomous'])
    for (const branchPointsToHQ of [true, false])
      for (const approveAt of [14, 8.5])
        for (let brAt = -1; brAt <= 18; brAt++) {
          const log = run({ mode, branchPointsToHQ, approveAt, brAt });
          for (let i = 1; i < log.length; i++) assert.ok(log[i].t >= log[i - 1].t, `${mode} ${branchPointsToHQ} ${approveAt} ${brAt} step ${i + 1}`);
        }
});

// ── presets and step counts (SPEC.md, "Presets") ──

test('presets: step counts and the default', () => {
  assert.equal(logic.steps(P({})), 16, 'replica-two-sites');
  assert.equal(logic.steps(P({ mode: 'autonomous' })), 10, 'autonomous-waits');
  assert.equal(logic.steps(P({ mode: 'autonomous', brAt: 10 })), 16, 'autonomous, approved at the branch at the end');
  assert.equal(logic.steps(P({ brAt: 2 })), 17, 'replica-cant-approve');
  assert.equal(logic.steps(P({ upstreamProducts: false })), 5, 'not-synced');
  assert.equal(logic.steps(P({ branchPointsToHQ: true })), 14, 'client-points-to-hq');
  assert.equal(logic.steps(P({ approveAt: 8.5 })), 14, 'approve at Wed 03:30');
  const json = require('./sim.json');
  assert.equal(json.steps, logic.steps(P({})));
});

test('replica: the branch is a day behind HQ', () => {
  const log = run({});
  assert.equal(find(log, 'install', 'PC-BR1').t - find(log, 'install', 'PC-HQ1').t, 24);
});

test('every combination stays within 20 steps', () => {
  let max = 0;
  for (const mode of ['replica', 'autonomous'])
    for (const upstreamProducts of [true, false])
      for (const branchPointsToHQ of [true, false])
        for (const approveAt of [14, 8.5])
          for (let brAt = -1; brAt <= 20; brAt++) max = Math.max(max, logic.steps(P({ mode, upstreamProducts, branchPointsToHQ, approveAt, brAt })));
  assert.ok(max <= 20, `max ${max}`);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = P({ mode: 'autonomous', brAt: 4 });
  for (let n = 0; n <= logic.steps(p); n++) {
    const s = at({ mode: 'autonomous', brAt: 4 }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ branchPointsToHQ: true, approveAt: 8.5 });
  const steps = logic.steps(p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(def, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ brAt: 1 });
  const s0 = logic.initial(p);
  const s1 = logic.step(s0, 1, p);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
