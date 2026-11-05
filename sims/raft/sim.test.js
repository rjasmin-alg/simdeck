// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for raft's model (SPEC.md). Run: node --test sims/raft/
// Tie-breaks first, then one test per rule (SPEC.md rules 0–8), the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
/** Every state of a run, 0..steps. */
const run = (over) => {
  const p = P(over);
  const out = [logic.initial(p)];
  for (let n = 1; n <= logic.steps(p); n++) out.push(logic.step(out[n - 1], n, p));
  return out;
};
const srv = (s, id) => s.servers.find((v) => v.id === id);
const notes = (s, k) => s.notes.filter((x) => x.k === k);
const terms = (v) => v.log.map((e) => e.term);
const BASE = logic.SCENARIOS['first-election'].timeouts;
/** A scenario for one test: the base timeouts, 20 steps. */
const custom = (over) => Object.assign({ timeouts: BASE, events: [], from: 0, steps: 20 }, over);
/** The first state of a run where f holds. */
const first = (states, f) => states.find(f);

// ── tie-breaks (SPEC.md "Order") ──

test('tie-break: replies are counted in (from, to) order, so the majority comes with the second reply (S3)', () => {
  const s = at({ sc: 'first-election' }, 3);
  assert.equal(s.t, 170);
  const tallies = notes(s, 'tally').map((x) => x.votes.length);
  assert.deepEqual(tallies, [2, 3], 'S2 then S3; leader after S3');
  assert.deepEqual(notes(s, 'leader')[0].votes, ['S1', 'S2', 'S3']);
  assert.deepEqual(srv(s, 'S1').votes, ['S1', 'S2', 'S3', 'S4', 'S5'], 'late votes are counted too');
});

test('tie-break: first come first served: the request that arrives first gets the vote', () => {
  const s = at({ sc: 'split-vote' }, 2); // 160 ms
  assert.equal(s.t, 160);
  assert.equal(srv(s, 'S3').votedFor, 'S1');
  assert.equal(srv(s, 'S4').votedFor, 'S2');
  const late = at({ sc: 'split-vote' }, 3); // 170: the slow requests are refused, the vote is taken
  assert.ok(notes(late, 'vote').some((x) => x.s === 'S4' && x.c === 'S1' && !x.granted && x.why === 'voted'));
  assert.ok(notes(late, 'vote').some((x) => x.s === 'S3' && x.c === 'S2' && !x.granted && x.why === 'voted'));
});

test('tie-break: outside events come before timers (a crash at 300 ms stops the heartbeat due at 300)', () => {
  const s = at({ sc: 'leader-crash' }, 1);
  assert.equal(s.t, 300);
  assert.equal(srv(s, 'S1').up, false);
  assert.equal(s.msgs.length, 0, 'no heartbeat left S1');
  assert.equal(at({ sc: 'leader-crash' }, 2).t, 460, 'S2 fires 200 ms after the heartbeat that arrived at 260');
});

test('tie-break: timers before deliveries, deliveries before client commands', () => {
  // the client command at 200 ms finds S1 already leader (it became leader on a delivery at 170)
  const s = at({ sc: 'replicate-commit' }, 1);
  assert.deepEqual(notes(s, 'client')[0], { k: 'client', s: 'S1', index: 1, term: 1, cmd: 'x←1' });
  // a timer firing at the same time as a delivery: S2 in split-vote has fired (150) before S1's request lands (160)
  const sv = at({ sc: 'split-vote' }, 2);
  assert.ok(notes(sv, 'vote').some((x) => x.s === 'S2' && x.c === 'S1' && x.why === 'voted'));
  // and a heartbeat sent at an event time is processed before the deliveries of that time (minority-leader, 600 ms):
  // S1's own heartbeat is due at 610, after it stepped down at 600, so it never sends a stale one
  const ml = run({ sc: 'minority-leader' });
  assert.ok(!ml.some((s2) => s2.ev.delivered.some((d) => d.res === 'stale')));
});

test('tie-break: the buttons act on the up leader with the highest term, lowest id on a tie', () => {
  const s = { servers: [
    { id: 'S1', up: true, role: 'leader', term: 1 }, { id: 'S2', up: true, role: 'leader', term: 2 },
    { id: 'S3', up: false, role: 'leader', term: 3 }, { id: 'S4', up: true, role: 'leader', term: 2 },
    { id: 'S5', up: true, role: 'follower', term: 3 }] };
  assert.equal(logic.leaderOf(s), 'S2');
  assert.equal(logic.leaderOf({ servers: [{ id: 'S1', up: true, role: 'follower', term: 1 }] }), null);
});

// ── rules ──

test('rule 0: a message takes 10 ms; to a crashed server or across the partition it is lost', () => {
  const s = at({ sc: 'first-election' }, 1);
  assert.ok(s.msgs.every((m) => m.at === 160));
  const lc = at({ sc: 'leader-crash' }, 2); // S2's request to the crashed S1
  assert.ok(lc.ev.dropped.some((m) => m.type === 'RV' && m.to === 'S1'));
  const ml = at({ sc: 'minority-leader' }, 1); // across the partition
  assert.ok(ml.ev.dropped.some((m) => m.type === 'AE' && m.from === 'S1' && m.to === 'S3'));
  assert.ok(!ml.msgs.some((m) => m.to === 'S3'));
});

test('rule 1: a higher term makes a candidate (or leader) a follower of that term with no vote yet', () => {
  const s = at({ sc: 'split-vote' }, 6); // 330: S2, candidate of term 1, gets S1's request of term 2
  const n = notes(s, 'stepdown').find((x) => x.s === 'S2');
  assert.deepEqual(n, { k: 'stepdown', s: 'S2', term: 2, was: 'candidate' });
  assert.equal(srv(s, 'S2').votedFor, 'S1', 'forgot its own vote of term 1, then voted in term 2');
  const ml = at({ sc: 'minority-leader' }, 11); // 600: the old leader S1
  assert.equal(srv(ml, 'S1').role, 'follower');
  assert.equal(srv(ml, 'S1').term, 2);
  assert.ok(notes(ml, 'stepdown').some((x) => x.s === 'S1' && x.was === 'leader'));
});

test('rule 2: a timer firing starts an election: term + 1, candidate, own vote, a request to each other server', () => {
  const s = at({ sc: 'first-election' }, 1);
  const v = srv(s, 'S1');
  assert.equal(s.t, 150);
  assert.deepEqual([v.role, v.term, v.votedFor], ['candidate', 1, 'S1']);
  assert.deepEqual(s.msgs.map((m) => m.type + m.to), ['RVS2', 'RVS3', 'RVS4', 'RVS5']);
  assert.equal(v.timerAt, 300, 'its timer restarts (150 again)');
});

test('rule 3: one vote per term', () => {
  const s = at({ sc: 'split-vote' }, 2);
  // S1 and S2 voted for themselves and refuse each other
  assert.ok(notes(s, 'vote').some((x) => x.s === 'S1' && x.c === 'S2' && x.why === 'voted'));
  assert.ok(notes(s, 'vote').some((x) => x.s === 'S2' && x.c === 'S1' && x.why === 'voted'));
});

test('rule 3: only a candidate whose log is at least as up to date gets the vote (§5.4.1)', () => {
  // S5 is down while x←1 is committed, restarts at 230 with an empty log, S1 crashes at 240, S5 fires first (50 ms)
  const sc = custom({ timeouts: Object.assign({}, BASE, { S2: [300], S3: [320], S4: [340], S5: [50] }), down: ['S5'],
    events: [{ at: 200, type: 'client', to: 'S1', cmd: 'x←1' }, { at: 230, type: 'heal' }, { at: 240, type: 'crash', id: 'S1' }] });
  const states = run({ sc });
  // term 1 (280 ms): they already voted for S1 in term 1; term 2 (330 ms): no vote yet, but S5's log is behind
  const s1 = first(states, (x) => notes(x, 'vote').some((v) => v.c === 'S5'));
  assert.equal(s1.t, 290);
  assert.deepEqual(notes(s1, 'vote').map((v) => v.why), ['voted', 'voted', 'voted']);
  const s = first(states, (x) => notes(x, 'vote').some((v) => v.c === 'S5' && v.term === 2));
  assert.equal(s.t, 340);
  const refused = notes(s, 'vote').filter((v) => v.c === 'S5');
  assert.deepEqual(refused.map((v) => [v.s, v.granted, v.why]), [['S2', false, 'log'], ['S3', false, 'log'], ['S4', false, 'log']]);
  assert.equal(srv(s, 'S2').term, 2, 'the request still moved their term (rule 1)');
  assert.ok(!states.some((x) => srv(x, 'S5').role === 'leader'), 'S5 never leads');
  assert.equal(logic.upToDate(1, 1, { log: [{ term: 1 }] }), true);
  assert.equal(logic.upToDate(1, 0, { log: [{ term: 1 }] }), false);
  assert.equal(logic.upToDate(2, 1, { log: [{ term: 1 }, { term: 1 }] }), true, 'a higher last term wins over length');
});

test('rule 4: 3 of 5 votes make a leader, which sends heartbeats at once and every 50 ms', () => {
  assert.equal(logic.MAJORITY, 3);
  assert.equal(logic.neededOf(5), 3);
  assert.equal(logic.neededOf(4), 3);
  const s = at({ sc: 'first-election' }, 3);
  assert.equal(srv(s, 'S1').role, 'leader');
  assert.equal(srv(s, 'S1').hbAt, 220);
  assert.deepEqual(s.msgs.map((m) => m.type + m.to), ['AES2', 'AES3', 'AES4', 'AES5']);
  const f = at({ sc: 'first-election' }, 4);
  assert.ok(f.servers.filter((v) => v.id !== 'S1').every((v) => v.leader === 'S1'));
  assert.deepEqual(f.changed, ['S2', 'S3', 'S4', 'S5'], 'learning the leader marks the card');
});

test('rule 5: a split vote elects nobody; the next timer starts a new term', () => {
  const states = run({ sc: 'split-vote' });
  const s170 = first(states, (x) => x.t === 170);
  assert.deepEqual(srv(s170, 'S1').votes, ['S1', 'S3']);
  assert.deepEqual(srv(s170, 'S2').votes, ['S2', 'S4']);
  assert.ok(!states.some((x) => x.servers.some((v) => v.role === 'leader' && v.term === 1)), 'no leader in term 1');
  const last = states[states.length - 1];
  assert.equal(last.t, 350);
  assert.deepEqual([srv(last, 'S1').role, srv(last, 'S1').term], ['leader', 2]);
  assert.equal(first(states, (x) => srv(x, 'S1').role === 'leader').t, 340);
});

test('rule 6: an entry of the current term is committed once stored on 3 of 5; followers learn it with the next AE', () => {
  const states = run({ sc: 'replicate-commit' });
  const s = states[3];
  assert.equal(s.t, 220);
  assert.equal(srv(s, 'S1').commitIndex, 1);
  const stored = notes(s, 'stored');
  assert.deepEqual(stored.map((x) => x.on.length), [2], 'after S2 only 2 of 5');
  assert.deepEqual(notes(s, 'commit')[0].on, ['S1', 'S2', 'S3']);
  assert.ok(s.servers.filter((v) => v.id !== 'S1').every((v) => v.commitIndex === 0));
  const f = states[4];
  assert.equal(f.t, 260);
  assert.ok(f.servers.every((v) => v.commitIndex === 1));
});

test('rule 6: an entry of an earlier term is not committed by counting; it is committed with a new one (§5.4.2)', () => {
  // S1 commits x←1 at 220 and crashes at 230, before any follower learns it; S2 leads term 2 and holds 1:1 on all
  const sc = custom({ events: [{ at: 200, type: 'client', to: 'S1', cmd: 'x←1' }, { at: 230, type: 'crash', id: 'S1' },
    { at: 460, type: 'client', to: 'S2', cmd: 'x←2' }] });
  const states = run({ sc });
  const old = first(states, (x) => notes(x, 'stored').some((n) => n.old && n.on.length >= 3));
  assert.ok(old, 'the old entry reaches 3 of 5');
  assert.equal(srv(old, 'S2').role, 'leader');
  assert.equal(srv(old, 'S2').commitIndex, 0, 'but stays uncommitted');
  const c = first(states, (x) => notes(x, 'commit').some((n) => n.s === 'S2'));
  assert.deepEqual(notes(c, 'commit')[0], { k: 'commit', s: 'S2', index: 2, from: 1, on: ['S2', 'S3', 'S4'] });
});

test('rule 7: a conflicting entry and everything after it is replaced by the leader\'s', () => {
  const s = at({ sc: 'minority-leader' }, 11);
  assert.equal(s.t, 600);
  for (const id of ['S1', 'S2']) {
    const n = notes(s, 'truncate').find((x) => x.s === id);
    assert.deepEqual(n.removed, [{ term: 1, cmd: 'x←2' }]);
    assert.deepEqual(srv(s, id).log, [{ term: 1, cmd: 'x←1' }, { term: 2, cmd: 'x←3' }]);
    assert.equal(srv(s, id).commitIndex, 2);
  }
});

test('rule 7: a follower missing the previous entry refuses; the leader steps back one entry and resends', () => {
  // S5 is down while x←1 is written; it restarts at 300 as S1 crashes; S2 leads term 2 and starts S5 at index 2
  const sc = custom({ down: ['S5'], events: [{ at: 200, type: 'client', to: 'S1', cmd: 'x←1' }, { at: 300, type: 'heal' },
    { at: 300, type: 'crash', id: 'S1' }] });
  const states = run({ sc });
  const mm = first(states, (x) => notes(x, 'mismatch').length);
  assert.deepEqual(notes(mm, 'mismatch')[0], { k: 'mismatch', s: 'S5', from: 'S2', index: 1 });
  const back = first(states, (x) => notes(x, 'backoff').length);
  assert.deepEqual(notes(back, 'backoff')[0], { k: 'backoff', s: 'S2', peer: 'S5', next: 1 });
  assert.deepEqual(terms(srv(states[states.length - 1], 'S5')), [1]);
});

test('rule 8: a leader cut off in a minority commits nothing; the majority side elects and commits', () => {
  const states = run({ sc: 'minority-leader' });
  const s330 = first(states, (x) => x.t === 330);
  assert.deepEqual(notes(s330, 'stored')[0].on, ['S1', 'S2']);
  for (const x of states.filter((y) => y.t < 600)) assert.equal(srv(x, 'S1').commitIndex, 1);
  const s530 = first(states, (x) => x.t === 530);
  assert.deepEqual([srv(s530, 'S3').role, srv(s530, 'S3').term], ['leader', 2]);
  assert.equal(srv(s530, 'S1').role, 'leader', 'two leaders at once, in different terms');
  const s560 = first(states, (x) => x.t === 560);
  assert.deepEqual(notes(s560, 'commit')[0], { k: 'commit', s: 'S3', index: 2, from: 2, on: ['S3', 'S4', 'S5'] });
});

// ── steps, folding and the buttons ──

test('quiet heartbeat rounds are folded into the next step that changes something', () => {
  const s = at({ sc: 'minority-leader' }, 4);
  assert.equal(s.t, 510);
  assert.equal(s.foldFrom, 360);
  assert.ok(s.folded > 0);
  // no step of any preset ends on a time where nothing changed
  for (const sc of logic.SC_IDS) {
    const states = run({ sc });
    for (let n = 1; n < states.length; n++) assert.ok(states[n].notes.length, `${sc} step ${n} has something to say`);
  }
});

test('folding stops after 1000 ms of quiet', () => {
  const s = at({ sc: 'replicate-commit', acts: '5:heal' }, 6); // heal does nothing, then only heartbeats
  assert.deepEqual(notes(at({ sc: 'replicate-commit', acts: '5:heal' }, 5), 'already'), [{ k: 'already', act: 'heal' }]);
  assert.deepEqual(s.notes, [{ k: 'quiet' }]);
  assert.ok(s.t - s.foldFrom >= logic.QUIET_CAP);
});

test('presets: the step counts and the times of SPEC.md', () => {
  const want = { 'first-election': [4, 0, 180], 'replicate-commit': [4, 190, 260], 'leader-crash': [8, 270, 520],
    'minority-leader': [12, 270, 610], 'split-vote': [8, 0, 350] };
  for (const [sc, [steps, from, end]] of Object.entries(want)) {
    assert.equal(logic.steps(P({ sc })), steps, sc);
    assert.equal(at({ sc }, 0).t, from, sc + ' from');
    assert.equal(at({ sc }, steps).t, end, sc + ' end');
  }
  const lc = run({ sc: 'leader-crash' });
  assert.deepEqual(lc.map((s) => s.t), [270, 300, 460, 470, 480, 490, 500, 510, 520]);
  assert.equal(first(lc, (s) => srv(s, 'S2').role === 'leader').t, 480);
  assert.ok(lc.every((s) => s.servers.filter((v) => v.up).every((v) => v.log[0] && v.log[0].cmd === 'x←1')), 'x←1 survives');
});

test('buttons: an action acts 10 ms after the step shown, and the demo runs on to 20 steps', () => {
  const p = P({ sc: 'first-election', acts: '5:client' });
  assert.equal(logic.steps(p), logic.FREE_STEPS);
  const s = at({ sc: 'first-election', acts: '5:client' }, 5);
  assert.equal(s.t, 190);
  assert.deepEqual(srv(s, 'S1').log, [{ term: 1, cmd: 'x←1' }]);
  const c = at({ sc: 'first-election', acts: '5:crash' }, 5);
  assert.equal(srv(c, 'S1').up, false);
  const pt = at({ sc: 'first-election', acts: '5:partition' }, 5);
  assert.deepEqual(pt.partition, logic.PARTITION);
  // refused: no leader yet
  const r = at({ sc: 'first-election', acts: '1:client,2:crash' }, 2);
  assert.deepEqual(notes(at({ sc: 'first-election', acts: '1:client' }, 1), 'clientRejected'), [{ k: 'clientRejected', s: null, cmd: 'x←1' }]);
  assert.deepEqual(notes(r, 'noLeader'), [{ k: 'noLeader', act: 'crash' }]);
  // heal restarts crashed servers as followers with their log
  const h = at({ sc: 'leader-crash', acts: '9:heal' }, 9);
  assert.deepEqual([srv(h, 'S1').up, srv(h, 'S1').role, srv(h, 'S1').term], [true, 'follower', 1]);
  assert.deepEqual(notes(h, 'heal')[0].restarted, ['S1']);
});

test('acts: parsing and adding drops later actions', () => {
  assert.deepEqual(logic.parseActs('3:crash, 5:client,x:y'), [{ n: 3, type: 'crash' }, { n: 5, type: 'client' }]);
  assert.equal(logic.addAct('3:crash,7:heal', 5, 'client'), '3:crash,5:client');
  assert.equal(logic.addAct('', 1, 'heal'), '1:heal');
});

// ── review additions: safety invariants under random button sequences, and the gaps a mutation pass found ──

/** Raft's safety properties ([R] Figure 3) on one run: election safety, log matching, leader completeness, commit ≤ log. */
function safety(states) {
  const leaders = {};       // term → leader id
  const committed = [];     // index → { term, cmd } once committed anywhere
  for (const s of states) {
    // rule 1/3: a vote is only granted for the voter's current term (an older request is refused)
    for (const n of notes(s, 'vote')) if (n.granted) assert.equal(n.term, srv(s, n.s).term, `t=${s.t}: ${n.s} granted a vote for older term ${n.term}`);
    for (const v of s.servers) {
      assert.ok(v.commitIndex <= v.log.length, `t=${s.t} ${v.id}: commit beyond the log`);
      if (v.role === 'leader') {
        assert.ok(!leaders[v.term] || leaders[v.term] === v.id, `t=${s.t}: two leaders in term ${v.term}`);
        leaders[v.term] = v.id;
      }
      for (let i = 0; i < v.commitIndex; i++) {
        const e = JSON.stringify(v.log[i]);
        assert.ok(!committed[i] || committed[i] === e, `t=${s.t} ${v.id}: committed entry ${i + 1} differs`);
        committed[i] = e;
      }
    }
    for (const v of s.servers) {
      if (v.role === 'leader' && v.up) committed.forEach((e, i) => {
        if (s.servers.some((u) => u.commitIndex > i && u.term <= v.term)) assert.equal(JSON.stringify(v.log[i]), e, `t=${s.t} leader ${v.id} lacks committed ${i + 1}`);
      });
      for (const u of s.servers) {   // log matching: same index and term → same prefix
        const n = Math.min(u.log.length, v.log.length);
        for (let i = n - 1; i >= 0; i--) if (u.log[i].term === v.log[i].term) {
          assert.deepEqual(u.log.slice(0, i + 1), v.log.slice(0, i + 1), `t=${s.t}: logs of ${u.id} and ${v.id} match at ${i + 1} but differ before`);
          break;
        }
      }
    }
  }
}

test('safety holds under random button sequences (seeded): one leader per term, committed entries never change, logs match', () => {
  const types = ['crash', 'partition', 'heal', 'client', 'client'];
  for (const sc of logic.SC_IDS) {
    const r = kit.rng(sc.length * 7919);
    for (let k = 0; k < 40; k++) {
      const acts = [];
      for (let n = 1; n <= logic.FREE_STEPS; n++) if (r() < 0.35) acts.push(n + ':' + types[r.int(types.length)]);
      safety(run({ sc, acts: acts.join(',') }));
    }
  }
});

test('rule 7 regressions: a stale entry at prevIndex (wrong term) and a conflict with a tail after it', () => {
  // found by the review: dropping the prevTerm check, or keeping the tail after a conflict, broke log matching here
  for (const acts of ['2:crash,3:crash,6:client,10:crash', '1:partition,2:client,3:client,5:heal,7:heal,8:crash']) safety(run({ sc: 'minority-leader', acts }));
  const states = run({ sc: 'minority-leader', acts: '1:partition,2:client,3:client,5:heal,7:heal,8:crash' });
  assert.ok(states.some((s) => notes(s, 'truncate').some((n) => n.removed.length > 1)), 'a conflict with a tail is exercised');
  const mm = run({ sc: 'minority-leader', acts: '2:crash,3:crash,6:client,10:crash' });
  assert.ok(mm.some((s) => s.ev.delivered.some((d) => d.res === 'mismatch')), 'a prevIndex/prevTerm mismatch is exercised');
});

test('rule 6: one ack can commit two entries (the highest N), and a follower commits only what it holds', () => {
  // S1 leads with S2 only (partition), takes two commands (on 2 of 5), heal: one AE carries both to S3–S5, and the
  // first ack from that side commits index 2 at once, index 1 with it
  const states0 = run({ sc: 'first-election', acts: '5:partition,6:client,7:client,8:heal' });
  const c = first(states0, (x) => notes(x, 'commit').length);
  assert.deepEqual(notes(c, 'commit')[0], { k: 'commit', s: 'S1', index: 2, from: 1, on: ['S1', 'S2', 'S3'] });
  // S5 down while x←1 and x←2 commit, restarted: the first AE it gets carries commit 2 but it holds nothing yet
  const sc = custom({ down: ['S5'], events: [{ at: 200, type: 'client', to: 'S1', cmd: 'x←1' }, { at: 260, type: 'heal' }] });
  for (const st of run({ sc })) { const v = srv(st, 'S5'); assert.ok(v.commitIndex <= v.log.length); }
});

test('rule 1 and 4: replies carry the voter\'s term; a candidate getting an AE of its own term becomes a follower', () => {
  // split-vote at 330: S2 (candidate of term 1) refuses nothing but moves to term 2; its RVR carries term 2
  const s = at({ sc: 'split-vote' }, 6);
  assert.ok(s.msgs.filter((m) => m.type === 'RVR').every((m) => m.term === 2));
  // free play: S2 stands in term 2 inside {S1(down), S2}; after heal S3's AE of term 2… S2 steps down (candidate, same term)
  const states = run({ sc: 'first-election', acts: '5:client,8:crash,9:partition,14:heal,15:client' });
  assert.ok(states.some((x) => notes(x, 'stepdown').some((n) => n.s === 'S2' && n.was === 'candidate' && n.term === 2)));
});

test('rule 3/5: the majority counts the configured five, not the servers up (2 down: 2 votes elect nobody)', () => {
  const sc = custom({ timeouts: { S1: [150, 170], S2: [150, 230], S3: [250], S4: [280], S5: [300] }, down: ['S4', 'S5'], slow: { 'S2-S3': 20 } });
  const states = run({ sc });
  assert.deepEqual(srv(first(states, (x) => x.t === 170), 'S1').votes, ['S1', 'S3']);
  assert.ok(!states.some((x) => x.servers.some((v) => v.role === 'leader' && v.term === 1)), '2 of 5 is no majority, even with three up');
});

test('a crash keeps term, vote and log', () => {
  const s = at({ sc: 'leader-crash' }, 1);
  const v = srv(s, 'S1');
  assert.deepEqual([v.term, v.votedFor, v.log, v.commitIndex], [1, 'S1', [{ term: 1, cmd: 'x←1' }], 1]);
});

test('folding stops at the 1000 ms cap, not later', () => {
  const s = at({ sc: 'replicate-commit', acts: '5:heal' }, 6);
  assert.ok(s.t - s.foldFrom < logic.QUIET_CAP + logic.HEARTBEAT, `${s.foldFrom}–${s.t}`);
});

test('tie-break: a heartbeat and a client AE to one follower at the same time are delivered in send order', () => {
  // first-election + a client command at 170: S1 becomes leader on a delivery and sends heartbeats, then the command
  // (client commands come after deliveries) sends the entry; both reach S2 at 180
  const s = at({ sc: 'first-election', acts: '3:client' }, 3);
  assert.equal(s.t, 170);
  const toS2 = s.msgs.filter((m) => m.to === 'S2');
  assert.deepEqual(toS2.map((m) => m.entries.length), [0, 1]);
  const next = at({ sc: 'first-election', acts: '3:client' }, 4);
  assert.deepEqual(next.ev.delivered.filter((d) => d.to === 'S2').map((d) => d.entries), [0, 1]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const sc of logic.SC_IDS) {
    const states = run({ sc, acts: '3:client,6:crash,9:partition,12:heal' });
    for (const s of states) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const sc of logic.SC_IDS) {
    const p = P({ sc, acts: '4:partition,8:client,11:heal' });
    const forward = run(p);
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ sc: 'minority-leader' });
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
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const ids = [...html.matchAll(/sc:\s*'([a-z-]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(ids)].sort(), [...logic.SC_IDS].sort(), 'one preset per scenario');
});
