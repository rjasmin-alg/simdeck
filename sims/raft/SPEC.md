<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# raft: specification

One concept: **terms, votes, majority commit**. Five servers S1–S5 elect a leader, replicate a log and commit an
entry once a majority stores it; the student crashes the leader, cuts the cluster in two and steps the messages.
Task: `docs/tasks/w3/raft.md`; catalogue `ha-raft` (§4.7).

Source for every rule: D. Ongaro and J. Ousterhout, "In Search of an Understandable Consensus Algorithm (Extended
Version)", USENIX ATC 2014 (here **[R]**), §5.1–§5.4 and Figure 2. Rules marked *(check)* follow the paper as I read
it without a second source; numbers that are this sim's own choices say so.

## Scene

Five servers in a ring (kit view K2, full mesh of ten links). Each card shows the role (follower: hollow circle;
candidate: circle with "?"; leader: filled circle with a crown), the current **term**, **voted for**, the known
leader and the election timer (a ring that empties, with the time it fires). The log panel beside the drawing shows
each server's log as a row of squares `index:term` with the command; committed entries are solid, uncommitted ones
dashed outlines. A crashed server is greyed and crossed; a partition is drawn as cut (crossed) links. The majority
badge reads "3 of 5" (from `quorum-split-brain`).

## Model

State (`sim.js`, plain JSON):

```
{ t, seq, cmds, servers: [{ id, up, role, term, votedFor, log: [{ term, cmd }], commitIndex, leader, votes: [ids],
                 elections, timeout, timerAt, hbAt, next: {peer: i}, match: {peer: i} }],
  msgs: [{ id, from, to, type, term, sentAt, at, …payload }], partition: [[ids], [ids]] | null,
  ev: { delivered, dropped, sent, loud }, notes: [...], changed: [ids], folded, foldFrom }
```

Message types and payloads ([R] Figure 2): `RV` RequestVote (`lastIndex`, `lastTerm`), `RVR` its reply
(`granted`), `AE` AppendEntries (`prevIndex`, `prevTerm`, `entries`, `commit` = leaderCommit; no entries =
heartbeat), `AER` its reply (`success`, `match`).

Constants: 5 servers, majority `floor(5/2) + 1 = 3` (`neededOf`, copied from `sims/quorum-split-brain/sim.js`);
message delay 10 ms (this sim's choice, task file); heartbeat every 50 ms (this sim's choice, task file; [R] §5.2
only asks that it is well below the election timeout); election timeouts fixed per preset and server (below)
instead of drawn at random from 150–300 ms ([R] §5.2, §9.3 *(check)*), so every run is the same.

### Rules

0. **Messages.** A message takes 10 ms (the `split-vote` preset makes the links S1–S4 and S2–S3 take 20 ms). A
   message sent to a crashed server or across the partition is lost at once; one in flight when its receiver
   crashes or the link is cut is lost on arrival. Lost messages are drawn with a cross.
1. **Terms** ([R] §5.1). A server that sees a higher term in any message takes that term, forgets its vote and, if it
   was a candidate or leader, becomes a follower ("steps down"). A message with a lower term is refused (`AE`: reply
   `success: false` with the newer term; `RV`: vote refused).
2. **Election timeout** ([R] §5.2). A follower or candidate whose timer fires increments its term, becomes a
   candidate, votes for itself and sends `RV` to the other four. Its timer restarts with its next timeout (the k-th
   election a server starts uses entry k of its timeout list; the last entry repeats).
3. **One vote per term, first come first served, up-to-date log only** ([R] §5.2, §5.4.1). A server grants its vote
   when the request's term is not older, it has not voted for someone else in this term, and the candidate's log is
   at least as up to date as its own: last term higher, or equal and last index ≥. Granting a vote restarts the
   voter's election timer. The reply carries the voter's term.
4. **Leader** ([R] §5.2). A candidate with votes from 3 of 5 (itself included) becomes leader at once, sets each
   follower's next index to its last index + 1 and match index to 0, and sends `AE` to all; then every 50 ms. Any
   `AE` round (heartbeat or a client command) restarts the 50 ms. A follower that accepts an `AE` (term not older)
   restarts its election timer and records the sender as leader; a candidate that gets an `AE` of its own term
   becomes a follower.
5. **Split vote** ([R] §5.2). Without a majority nothing happens until a candidate's timer fires again: a new term,
   a new election.
6. **Commit** ([R] §5.3, §5.4.2). The leader appends a client command to its log and sends it in `AE` to every
   follower (from that follower's next index). A follower's `AER` success moves its match index. The leader commits
   the highest index N whose entry is **of the current term** and is stored on a majority (leader + matches ≥ N);
   every earlier entry is committed with it. An entry of an earlier term is never committed by counting alone
   (§5.4.2). Followers learn the commit index from the next `AE`: `commitIndex = min(leaderCommit, index of the last
   new entry)` when larger than their own.
7. **Log matching and repair** ([R] §5.3). A follower accepts an `AE` only if its log holds an entry at `prevIndex`
   with term `prevTerm`; otherwise it replies `success: false` and the leader steps that follower's next index back
   by one and resends at once. When an incoming entry conflicts with one in the log (same index, different term), the
   follower deletes that entry and everything after it, then appends the leader's.
8. **Minority leader** (follows from 1, 6). A leader cut off with fewer than 3 servers keeps sending heartbeats to the
   servers it reaches and appends client commands, but no new entry can reach a majority, so it commits nothing.
   When it hears a higher term (after the partition heals) it steps down (rule 1) and its uncommitted entries are
   replaced (rule 7).

Outside the paper's rules, this sim's own: **crash** keeps a server's term, vote, log and commit index and drops its
role (it restarts as a follower with a fresh timer when the network heals; volatile state is kept for simplicity,
out of scope); **heal** joins the partition and restarts crashed servers; a **client command** goes to the leader
named in the preset, or for the button to the up leader with the highest term (lowest id on a tie); it is refused
when there is none (caption says why).

### Order (tie-breaks)

Within one event time, in this order:

1. outside events: crash, partition, heal (preset events in their listed order, then the user's actions);
2. timer expiries, by server id (a leader's heartbeat timer, a follower's or candidate's election timer);
3. message deliveries, by (deliverAt, from, to, send order);
4. client commands (preset, then button).

Replies to RV arrive in the same order, so in `first-election` S1 counts S2's vote, then S3's (majority on the second
reply), then S4's and S5's (counted, shown as late votes).

### Steps

One step advances to the next event time and processes everything due at it. An event time at which nothing visible
changes (only timers move: a heartbeat sent, a heartbeat received, an ack that moves nothing) is **folded** into the
step: the step goes on to the next event time, until one changes a role, term, vote, log, commit index, known leader,
match or next index, a crash or the partition, or carries vote traffic or a client command. A step folds at most
1000 ms of quiet; the caption says so. Deviation from the task file ("advance to the next event time"): without
folding a minority leader's heartbeats add three steps per 50 ms and `minority-leader` would need about 25 steps.

A user action (button) acts at the next 10 ms tick, in the step after the one shown; it ends any folding. A preset
with a user action runs on to 20 steps; changing a preset clears the actions.

Step 0 of a preset replays every event up to its `from` time silently (the earlier presets' story), so the demo starts
where its concept starts.

## Presets (numbers from the model; checked by `sim.test.js` and a trace script, see NOTES.md)

Timeouts unless stated: S1 150, S2 200, S3 250, S4 280, S5 300 ms.

1. **`first-election`** (from 0 ms, 4 steps). 150 ms: S1's timer fires, S1 candidate of term 1, sends RV.
   160: S2–S5 grant (term 1, no earlier vote, logs equal). 170: replies arrive; S1 has 3 of 5 on the second reply
   (S2, S3) and becomes **leader of term 1** at 170 ms; 5 votes in all; heartbeats out. 180: every follower knows
   S1 as leader. (Task file: "votes arrive at 160 ms"; with a 10 ms delay the requests arrive at 160 and the votes
   at 170.)
2. **`replicate-commit`** (from 190 ms, 4 steps). 200: client `x←1` at S1, entry 1:1, AE to all. 210: S2–S5 append.
   220: acks; S2's makes 2 of 5, S3's 3 of 5: **committed at 220 ms**. 260: the heartbeat sent at 250 carries commit
   index 1 and every follower marks 1:1 committed (the send at 250 is folded).
3. **`leader-crash`** (from 270 ms, 8 steps). 300: S1 crashes. 460: S2's timer fires (last heartbeat arrived at 260
   + 200) → candidate of term 2; its RV to S1 is lost. 470: S3, S4, S5 grant (S2's log 1:1 is as up to date as
   theirs). 480: **S2 leader of term 2** (3 of 5). 490: followers know S2; committed `x←1` is still there. 500:
   client `x←2` at S2, entry 2:2. 510: S3–S5 append. 520: committed on S4's ack, 3 of 5 (S2, S3, S4); S5's ack then makes 4 of 5 (S1 is down).
   (Task file: 7 steps; the last three show the cluster committing with one server down.)
4. **`minority-leader`** (from 270 ms, 12 steps). 310: partition {S1, S2} | {S3, S4, S5} and client `x←2` at S1 →
   entry 2:1, sent to S2 only (the 300 ms heartbeat to S3–S5 is lost on arrival). 320: S2 appends. 330: S1 has 2:1 on
   **2 of 5: not committed**. 510: S3's timer fires (last heartbeat at 260 + 250) → candidate of term 2. 520: S4, S5
   grant. 530: **S3 leader of term 2** with 3 of 5. 540: client `x←3` at S3 → entry 2:2; S4, S5 learn S3. 550: S4, S5
   append. 560: **committed** on S3, S4, S5. 570: heal. 600: S3's heartbeat (sent 590, term 2) reaches S1 and S2: S1
   **steps down**, both delete `2:1:x←2` and take `2:2:x←3` (rule 7), commit index 2. 610: acks. (Task file: 12
   steps.)
5. **`split-vote`** (from 0 ms, 8 steps). S5 down; timeouts S1 150 then 170, S2 150 then 230; the links S1–S4 and
   S2–S3 take 20 ms. 150: S1 and S2 both candidates of term 1. 160: S3 gets S1's request first and votes S1; S4 gets
   S2's first and votes S2; S1 and S2 refuse each other. 170: S1 has 2 votes, S2 has 2: **no majority** (3 of 5 counts
   the configured five, not the four up); the slow requests are refused. 190: the slow refusals arrive. 320: S1's
   timer (150 + 170) fires → term 2. 330: S2 (term 1 < 2: steps down) and S3 grant. 340: **S1 leader of term 2**.
   350: S2 and S3 know S1. (Deviation: the task file has no slow links; with equal delays the tie-break (from, to) lets
   S1's requests arrive first everywhere and S1 wins at once.)

## Captions

Built from the step's notes (`notes` in the state): crash, partition, heal; timeouts; votes granted or refused and
why (already voted, older term, log not up to date); tallies against "3 of 5"; new leader; step-downs; entries
appended, conflicting entries deleted; commit with the servers that store it; an entry stored on fewer than 3; an old
entry that cannot be committed by counting; folded quiet time.

## Out of scope

Membership changes, log compaction and snapshots, pre-vote, client retries and linearizable reads, Paxos; persistence
details of a restart; randomized timeouts (fixed per preset).
