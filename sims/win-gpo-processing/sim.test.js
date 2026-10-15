// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-gpo-processing's model (rules: SPEC.md). Run: node --test sims/win-gpo-processing/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const end = (p) => logic.run(p);
const at = (p, n) => kit.stateAt(logic, p, n);
/** The run's events after the start, as "t kind result-of-the-edited-CSE", quiet refreshes marked. */
const cseFor = (p) => logic.cseOf(P(p).change).id;
const path = (p) => end(P(p)).events.filter((e) => !e.history && e.kind !== 'edit')
  .map((e) => `${e.t} ${e.kind}${e.mode ? ':' + Object.values(e.mode).join('/') : ''} ${e.results[cseFor(p)]}${e.quiet ? ' quiet' : ''}`);
/** A state after the edit, with the timer and the plan set by hand (for the tie-breaks no schedule reaches). */
function edited(over, nextRefresh, plan) {
  const p = P(over);
  const s = logic.step(logic.initial(p), 1, p);
  s.nextRefresh = nextRefresh;
  s.plan = plan;
  return s;
}

// ── tie-breaks first ──

test('T1: a logon and a refresh in the same minute: the logon runs, the refresh does not, its timer restarts', () => {
  const s = edited({ change: 'folders', action: 'relog' }, { t: 30, base: 30, off: 0 }, [{ t: 30, kind: 'logon' }]);
  assert.deepEqual(logic.nextEvent(s), { t: 30, kind: 'logon', planned: true });
  const e = logic.processNext(s, 2);
  assert.equal(e.kind, 'logon');
  assert.equal(s.nextRefresh.t, 30 + 90 + logic.offsetAt(s.seed, s.draws - 1), 'restarted from the logon');
  assert.ok(s.nextRefresh.t > 30, 'the refresh at 30 does not run');
  // and a refresh one minute earlier does run first
  const s2 = edited({ change: 'folders', action: 'relog' }, { t: 29, base: 29, off: 0 }, [{ t: 30, kind: 'logon' }]);
  assert.equal(logic.nextEvent(s2).kind, 'refresh');
});

test('T2: gpupdate and a refresh in the same minute: gpupdate first, the refresh still runs in that minute', () => {
  const s = edited({ change: 'folders', action: 'gpupdate' }, { t: 5, base: 5, off: 0 }, [{ t: 5, kind: 'gpupdate' }]);
  assert.equal(logic.processNext(s, 2).kind, 'gpupdate');
  assert.equal(s.nextRefresh.t, 5, 'gpupdate does not restart the timer');
  assert.deepEqual(logic.nextEvent(s), { t: 5, kind: 'refresh', planned: false });
});

test('T3: a CSE signalling again for a part already flagged is quiet; the first signal is not', () => {
  const s = edited({ change: 'folders' }, { t: 100, base: 100, off: 0 }, []);
  const first = logic.pass(s, 'bg', ['computer', 'user']);
  assert.equal(first.results.folders, 'signal');
  assert.equal(first.quiet, false);
  const again = logic.pass(s, 'bg', ['computer', 'user']);
  assert.equal(again.results.folders, 'signal');
  assert.equal(again.quiet, true);
});

test('T4: quiet refreshes before a planned action are not steps (DC01: refreshes 8…28 before the logon at 30)', () => {
  const p = P({ dc: true, change: 'folders', action: 'relog' });
  const s = end(p);
  assert.equal(logic.steps(p), 3);
  const step3 = s.events.filter((e) => e.n === 3);
  assert.deepEqual(step3.map((e) => e.t), [8, 13, 18, 23, 28, 30]);
  assert.ok(step3.slice(0, 5).every((e) => e.kind === 'refresh' && e.quiet && e.collapsed));
  assert.equal(step3[5].kind, 'logon');
  assert.equal(step3[5].collapsed, undefined);
});

test('T5: the run ends when the setting is applied, or at the first quiet refresh with nothing planned', () => {
  assert.equal(end(P()).result, 'applied');
  const w = end(P({ change: 'folders' }));
  assert.equal(w.result, 'waiting');
  assert.deepEqual(path({ change: 'folders' }), ['102 refresh signal', '193 refresh signal quiet']);
  assert.equal(w.applied.folders, logic.V_OLD);
  assert.equal(w.pending.syncNext.user, true, 'the next logon would be synchronous');
  assert.equal(end(P({ change: 'msi' })).pending.syncNext.computer, true);
});

test('T6: the CSEs run in table order', () => {
  assert.deepEqual(logic.CSES.map((c) => c.id), ['registry', 'security', 'folders', 'software']);
  const e = end(P({ action: 'force' })).events.find((x) => x.kind === 'force');
  assert.deepEqual(Object.keys(e.results), ['registry', 'security', 'folders', 'software']);
});

// ── rules ──

test('rule 1: a logon processes the user part only; a restart both; a refresh both', () => {
  const lo = end(P({ change: 'folders', action: 'relog' })).events.find((e) => e.kind === 'logon');
  assert.equal(lo.results.security, 'notRun');
  assert.equal(lo.results.software, 'notRun');
  assert.notEqual(lo.results.registry, 'notRun');
  const re = end(P({ change: 'msi', action: 'relog' })).events.find((e) => e.kind === 'restart' && !e.history);
  assert.ok(Object.values(re.results).every((r) => r !== 'notRun'));
  assert.deepEqual(Object.keys(re.mode), ['computer', 'user']);
  const bg = end(P()).events.find((e) => e.kind === 'refresh');
  assert.ok(Object.values(bg.results).every((r) => r !== 'notRun'));
});

test('rule 2: refresh 90 min after the previous one plus a 0–30 min offset from the seed; a DC every 5 min', () => {
  assert.deepEqual([0, 1, 2].map((k) => logic.offsetAt(3, k)), [22, 1, 14]);
  for (let seed = 1; seed <= 9; seed++) for (let k = 0; k < 6; k++) {
    const o = logic.offsetAt(seed, k);
    assert.ok(Number.isInteger(o) && o >= 0 && o <= 30);
  }
  assert.equal(logic.initial(P()).nextRefresh.t, -10 + 90 + 22);
  assert.deepEqual(path({}), ['102 refresh applied']);
  const r = end(P({ seed: 7 })).events.find((e) => e.kind === 'refresh');
  assert.equal(r.t, 80 + logic.offsetAt(7, 0));
  assert.equal(r.base, 80);
  assert.equal(r.off, logic.offsetAt(7, 0));
  // the next one after a refresh: 90 + the next draw
  assert.equal(end(P({ change: 'folders' })).events.at(-1).t, 102 + 90 + 1);
  // DC: last at −2, then 3, 8, …; no offset, the seed does not matter
  assert.deepEqual(path({ dc: true }), ['3 refresh applied']);
  assert.deepEqual(end(P({ dc: true, seed: 8, change: 'folders' })).events.filter((e) => e.kind === 'refresh').map((e) => e.t), [-7, -2, 3, 8]);
});

test('rule 3: unchanged → skipped; a sync CSE in an asynchronous pass signals; otherwise applied', () => {
  const e = end(P()).events.find((x) => x.kind === 'refresh');
  assert.deepEqual(e.results, { registry: 'applied', security: 'unchanged', folders: 'unchanged', software: 'unchanged' });
  const f = end(P({ change: 'folders' })).events.find((x) => x.kind === 'refresh');
  assert.equal(f.results.folders, 'signal');
  assert.equal(f.flags.user, true);
  assert.equal(f.flags.computer, false, 'Folder Redirection flags the user part');
  const m = end(P({ change: 'msi' })).events.find((x) => x.kind === 'refresh');
  assert.equal(m.results.software, 'signal');
  assert.deepEqual(m.flags, { computer: true, user: false });
  // the registry setting applies in an asynchronous logon too
  assert.deepEqual(path({ action: 'relog' }), ['30 logon:async applied']);
});

test('rule 4: fast logon: two logons / two restarts without a background pass first; one with it off', () => {
  assert.deepEqual(path({ change: 'folders', action: 'relog' }), ['30 logon:async signal', '60 logon:sync applied']);
  assert.deepEqual(path({ change: 'msi', action: 'relog' }), ['30 restart:async/async signal', '60 restart:sync/async applied']);
  assert.deepEqual(path({ change: 'folders', action: 'relog', fastLogon: false }), ['30 logon:sync applied']);
  assert.deepEqual(path({ change: 'msi', action: 'relog', fastLogon: false }), ['30 restart:sync/sync applied']);
  // a DC is always synchronous in the foreground
  assert.equal(logic.initial(P({ dc: true, fastLogon: true })).fastLogon, false);
  assert.deepEqual(path({ dc: true, change: 'msi', action: 'relog' }).at(-1), '30 restart:sync/sync applied');
  // the flag is cleared by the synchronous pass
  const s = end(P({ change: 'folders', action: 'relog' }));
  assert.equal(s.pending.syncNext.user, false);
  assert.equal(logic.syncForeground(s, 'user'), false);
});

test('rule 4: only a synchronous foreground pass clears a flag; a background pass with nothing new keeps both', () => {
  const s = edited({}, { t: 100, base: 100, off: 0 }, []);
  s.applied.screensaver = logic.V_NEW;
  s.pending.syncNext = { computer: true, user: true };
  const r = logic.pass(s, 'bg', ['computer', 'user']);
  assert.deepEqual(s.pending.syncNext, { computer: true, user: true });
  assert.equal(r.quiet, true);
  // reachable: DC01, /force with a Folder Redirection change flags both parts; the quiet refresh at 8 keeps them
  const e8 = end(P({ dc: true, change: 'folders', action: 'force' })).events.find((e) => e.t === 8);
  assert.deepEqual(e8.flags, { computer: true, user: true });
  // an asynchronous logon does not clear the user flag it sets
  const a = edited({ change: 'folders' }, { t: 100, base: 100, off: 0 }, []);
  logic.pass(a, 'fg', ['user'], { user: 'async' });
  assert.deepEqual(a.pending.syncNext, { computer: false, user: true });
});

test('rule 2: the seed is 1…9; 9 is used as given, out of range is clamped', () => {
  assert.equal(logic.initial(P({ seed: 9 })).seed, 9);
  assert.equal(logic.initial(P({ seed: 9 })).nextRefresh.t, 80 + logic.offsetAt(9, 0));
  assert.equal(logic.initial(P({ seed: 0 })).seed, 1);
  assert.equal(logic.initial(P({ seed: 12 })).seed, 9);
});

test('rule 4: a background pass first (gpupdate or the refresh) → one logon is enough', () => {
  assert.deepEqual(path({ change: 'folders', action: 'gpupdate' }), ['5 gpupdate signal', '10 logon:sync applied']);
  assert.deepEqual(path({ change: 'msi', action: 'gpupdate' }), ['5 gpupdate signal', '10 restart:sync/async applied']);
  assert.deepEqual(path({ dc: true, change: 'folders', action: 'relog' }).filter((x) => !x.includes('quiet')),
    ['3 refresh signal', '30 logon:sync applied']);
});

test('rule 5: gpupdate applies what changed now; /force reapplies the unchanged too; sync CSEs still only signal', () => {
  const g = end(P({ action: 'gpupdate' })).events.find((e) => e.kind === 'gpupdate');
  assert.deepEqual(g.results, { registry: 'applied', security: 'unchanged', folders: 'unchanged', software: 'unchanged' });
  const f = end(P({ action: 'force' })).events.find((e) => e.kind === 'force');
  assert.deepEqual(f.results, { registry: 'applied', security: 'reapplied', folders: 'signal', software: 'signal' });
  assert.deepEqual(f.flags, { computer: true, user: true });
  assert.equal(end(P({ action: 'force' })).result, 'applied');
  assert.deepEqual(path({ change: 'folders', action: 'force' }), ['5 force signal', '10 logon:sync applied']);
  // no follow-up when gpupdate applied it
  assert.equal(end(P({ action: 'gpupdate' })).events.some((e) => e.kind === 'logon'), false);
});

test('rule 6: an unchanged Security setting is skipped (16 h reapply is beyond every run)', () => {
  for (const dc of [false, true]) for (const change of logic.CHANGES) for (const action of logic.ACTIONS) {
    const s = end(P({ dc, change, action }));
    const last = s.events.at(-1).t;
    assert.ok(last < logic.SECURITY_REAPPLY);
    for (const e of s.events) if (e.results && e.kind !== 'force') assert.ok(['unchanged', 'notRun'].includes(e.results.security));
  }
});

test('rule 7: a logon or restart restarts the timer; gpupdate does not', () => {
  const s = end(P({ change: 'folders', action: 'relog' }));
  const lo = s.events.filter((e) => e.kind === 'logon');
  assert.equal(lo[0].next.t, 30 + 90 + logic.offsetAt(3, 1));
  assert.equal(lo[1].next.t, 60 + 90 + logic.offsetAt(3, 2));
  const g = end(P({ change: 'folders', action: 'gpupdate' })).events.find((e) => e.kind === 'gpupdate');
  assert.equal(g.next.t, 102, 'gpupdate keeps the timer');
});

test('the edit is step 1 and changes only the GPO', () => {
  const p = P({ change: 'msi' });
  const s0 = at(p, 0), s1 = at(p, 1);
  assert.equal(s0.gpo.msi, logic.V_OLD);
  assert.equal(s1.gpo.msi, logic.V_NEW);
  assert.equal(s1.applied.msi, logic.V_OLD);
  assert.deepEqual(s1.gpo.screensaver, logic.V_OLD);
  assert.equal(s1.events.at(-1).kind, 'edit');
  assert.equal(s1.t, 0);
});

test('presets: background 2, gpupdate 2, folder-redirection 3, msi-two-reboots 3, dc 2, force-folders 3; max 4', () => {
  const cases = [[P(), 2], [P({ action: 'gpupdate' }), 2], [P({ change: 'folders', action: 'relog' }), 3],
    [P({ change: 'msi', action: 'relog' }), 3], [P({ change: 'msi', action: 'relog', fastLogon: false }), 2],
    [P({ dc: true }), 2], [P({ change: 'folders', action: 'force' }), 3]];
  for (const [p, n] of cases) assert.equal(logic.steps(p), n, JSON.stringify(p));
  const count = { 2: 0, 3: 0, 4: 0 };
  for (const dc of [false, true]) for (const change of logic.CHANGES) for (const action of logic.ACTIONS)
    for (const fastLogon of [true, false]) for (let seed = 1; seed <= 9; seed++) {
      const p = P({ dc, change, action, fastLogon, seed });
      const n = logic.steps(p);
      count[n]++;
      assert.equal(end(p).phase, 'done');
    }
  assert.deepEqual(count, { 2: 162, 3: 198, 4: 72 }, 'as the hand model (SPEC.md)');
  assert.equal(logic.steps(P({ dc: true, change: 'folders', action: 'gpupdate' })), 4);
  assert.equal(logic.steps(logic.defaults), 2);
});

// ── generic checks every sim keeps ──

const SAMPLE = [P(), P({ change: 'folders', action: 'relog' }), P({ change: 'msi', action: 'gpupdate' }),
  P({ dc: true, change: 'folders', action: 'gpupdate' }), P({ change: 'folders', action: 'force', seed: 9 })];

test('state is JSON-safe at every step', () => {
  for (const p of SAMPLE) {
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of SAMPLE) {
    const steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const p of SAMPLE) {
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const fs = require('node:fs'), path_ = require('node:path');
  const html = fs.readFileSync(path_.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const pairs = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):\s*'?(\w+)'?/g)].map((k) => [k[1], k[2]]));
  assert.ok(pairs.length > 0, 'found preset params');
  for (const [k, v] of pairs) {
    assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    if (k === 'dc') assert.ok(v === 'true' || v === 'false', `dc ${v}`);
    if (k === 'change') assert.ok(logic.CHANGES.includes(v), `change ${v}`);
    if (k === 'action') assert.ok(logic.ACTIONS.includes(v), `action ${v}`);
  }
  const sim = JSON.parse(fs.readFileSync(path_.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults), 'sim.json steps matches the model');
});
