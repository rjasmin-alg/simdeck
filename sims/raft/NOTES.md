<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# raft: notes

Task `docs/tasks/w3/raft.md` (catalogue `ha-raft`, §4.7). Built in thread t-0277 on 2026-11-05.

## Decisions

- **Event-driven model** (`sim.js`): per-server election timers, a leader's 50 ms heartbeat timer, messages with a
  10 ms delay, scenario events (crash, partition, heal, client command) and the user's button actions. Order within one
  event time: outside events, timers (by id), deliveries by (deliverAt, from, to, send order), client commands
  (SPEC.md "Order").
- **Quiet event times are folded into the step** (SPEC.md "Steps"): a time at which only timers move (a heartbeat
  sent, received or acked without changing anything) does not end a step. Without this a leader in a minority adds
  three steps per 50 ms of heartbeats. A step folds at most 1000 ms and the caption says what was skipped.
- **Presets start from a snapshot** (`from`): events up to that time are replayed silently, so `leader-crash` and
  `minority-leader` start with S1 leading and `x←1` committed instead of re-running the election.
- **Buttons** (client command, crash the leader, partition {S1,S2} | {S3,S4,S5}, heal and restart) write
  `step:action` into the `acts` param and advance one step; the action acts 10 ms after the step shown. A demo with
  actions runs on to 20 steps; picking a preset clears them. A refused action (no leader, nothing to heal, already
  split) is a no-op whose reason is in the caption.
- **Drawing**: kit view K2 (`kit/topology.js`), five cards in a ring in a 16-column grid, full mesh of ten links. Messages
  in flight after the step are `mid` arrows with a chip coloured by term; lost votes and lost entries are drawn with a
  cross (lost heartbeats are not, the cut link's cross already shows them). The role is drawn in the mark: hollow
  circle (follower), dashed circle with "?" (candidate), filled circle in the term's colour with a crown (leader).
- **Log panel** beside the drawing: one row per server, entries `index:term` with the command, solid when committed on
  that server, dashed when not; colour = term (also written as a number, so grayscale works).
- **Colour by term** everywhere (log entries, message chips, the leader's mark): term 1 = `--c1`, term 2 = `--c2`, ….
- **Majority**: `neededOf(total) = floor(total/2) + 1` copied from `sims/quorum-split-brain/sim.js @ ccda38b`;
  `models/` has no shared model yet, so nothing is included from there. The "majority: 3 of 5" pill reuses the
  quorum page's wording, not its code.

## Deviations from the task file

- `first-election`: the task says "votes arrive at 160 ms". With a 10 ms delay the requests arrive at 160 and the
  votes at 170; S1 becomes leader at 170 ms (still on the second reply, S3's).
- `split-vote`: with equal delays the tie-break (from, to) delivers S1's requests first everywhere and S1 wins term 1
  at once; to get "S3 votes S1, S4 votes S2" the links S1–S4 and S2–S3 take 20 ms in this preset (labelled on the
  drawing, said in the step-0 caption). Then S1 leads term 2 at 340 ms, as the task expects.
- Step counts: `first-election` 4 (task 4), `replicate-commit` 4 (task 6: with folding the 250 ms heartbeat send is
  folded into the 260 ms step), `leader-crash` 8 (task 7: the preset adds a client command `x←2` at S2 and commits it
  on 3 of 5 while S1 is down), `minority-leader` 12 (task 12), `split-vote` 8 (task 8). `sim.json` `steps` is 4
  (the default preset).
- "One step: advance to the next event time" became "the next event time that changes something" (folding, above).
- Outside events (crash, partition, heal) are processed before timers at the same time; the task lists only timers,
  deliveries, client commands. This makes "S1 crashes at 300 ms" stop the heartbeat due at 300, which the task's
  460 ms for S2 assumes.
- `minority-leader`: the partition and `x←2` are at 310 ms and S3's command `x←3` at 540, heal at 570; S1's and S2's
  `2:1:x←2` is replaced in one AppendEntries at 600 ms (S3's next index for them was already 2, so no step-back is
  needed there; the step-back of rule 7 is covered by a test scenario).

## Sources

- D. Ongaro and J. Ousterhout, "In Search of an Understandable Consensus Algorithm (Extended Version)", USENIX ATC
  2014: §5.1 terms, §5.2 leader election, §5.3 log replication, §5.4.1 election restriction, §5.4.2 committing entries
  from previous terms, Figure 2 (state, RequestVote, AppendEntries, rules for servers). From memory of the paper; no
  copy was available offline in this thread.
- Majority count: `sims/quorum-split-brain/` (task `docs/tasks/w2/quorum-split-brain.md`).

## Not checked *(check)*

- The task asked to check the preset numbers against a reference implementation's trace before coding. No reference
  implementation was available offline; the numbers come from this model and are pinned by `sim.test.js` and a trace
  script. A check against the paper's Figure 2 by a fresh reviewer is recorded below.
- Randomized election timeouts of 150–300 ms ([R] §5.2/§9.3) *(check)*: here fixed per preset.
- Message delay 10 ms and heartbeat 50 ms are this sim's choices (task file), not values from the paper.
- `commitIndex = min(leaderCommit, index of last new entry)` for a heartbeat (no entries) uses `prevIndex` as the last
  new entry *(check)* against Figure 2's wording.
- Croatian terms (below) *(check)*.

## Term pairs (missing from `kit/glossary.js`)

The glossary has none of these, so the page writes them out (hr explanation: English in italics, Croatian in
parentheses). Proposed entries with `"src": "simdeck"`:

| en | hr |
|---|---|
| consensus | konsenzus |
| leader | vođa *(check)* |
| follower | sljedbenik *(check)* |
| candidate | kandidat *(check)* |
| term | mandat *(check)* |
| election timeout | istek izbornog vremena *(check)* |
| log entry | zapis u dnevniku |
| committed (entry) | potvrđen (zapis) *(check)* |
| majority | većina |
| heartbeat | otkucaj *(check; this sim's choice)* |

## Shared requests

- **K2 topology**: a label in the middle of a link (here the 20 ms of a slow link); `ends` puts it near one end, which
  on the short S2–S3 link sits close to the chips. Not blocking.
- **models/**: promote `neededOf` (majority of n voters) from `quorum-split-brain` so raft can include it instead of
  copying it.

## Review (fresh reviewer, 2026-11-05)

A separate agent read `sim.js` against SPEC.md and Figure 2 and broke rules on purpose on a copy.

- **No defect found in the model.** An invariant checker over 3000 random button runs (one leader per term, committed
  entries never differ, leader completeness, log matching, commit ≤ log) found no violation; every SPEC time matched.
- SPEC fixes it asked for: `leader-crash` commits `x←2` on S4's ack (3 of 5), S5's ack makes 4; the state shape
  lists `seq`, `cmds`, `ev.loud`.
- **Mutation pass:** 25 of 63 mutations first passed every test, three of them unsafe (prevTerm check removed; a
  conflict keeps the tail; ack `match` = log length). Added: a seeded safety-invariant test over 200 random button
  runs (also checks that no vote is granted for an older term), the reviewer's two rule-7 repros, highest-N commit,
  majority of the configured five with two servers down, crash keeps term/vote/log, the fold cap, same-pair send
  order, a candidate stepping down on an AE of its own term. Now 14 of 64 pass every test, none unsafe in those
  runs: equivalent or impossible in this model (duplicate vote, `>` vs `≥` on match, truncate-and-reappend of a
  matching entry, a message to a crashed server delivered on restart within 10 ms), or reply-term and order details
  no preset or seeded run depends on (an RVR carrying the request's term, a stale-AE reply's term, the leader not
  cleared on a higher term, back-off by 2 or without an immediate resend, follower commit without `min`,
  deliveries by (to, from), timers in reverse id order, `next` out of the step signature).

## Time

Start 09:53, done 10:40 (2026-11-05): about 47 minutes, one session.
