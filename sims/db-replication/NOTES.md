<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# db-replication: notes

New stepper (task `docs/tasks/w2/db-replication.md`, catalogue `ha-db-replication`, wave 2b). Kit view **K2**
(`Simdeck.topology`) draws the client, the primary and the replicas with the records on the wire; kit view **K3**
(`Simdeck.blockGrid`) draws each server's write-ahead log as a strip of records. Rules and expected numbers:
`SPEC.md`.

## Decisions

- **K2 and K3, no own drawing.** The task said "K2 once it exists"; it does (kit 0.3.0). The log strips are K3 rows:
  applied = `fill`, not yet applied = `ghost` (dashed), lost = `bad`, discarded on rebuild = `dead`, applied this step =
  `now`. A bracket marks the lost tail on the promoted replica, the extra records on the returning old primary and the
  discarded ones on the rebuild. The column labels are the times the records were written (100 … 1000 ms): that is the
  task's "time axis (ms)", aligned with the records; the header's counter shows the clock `t = … ms`.
- **Layout: a diamond** (client left, primary top, R1 below it, R2 right), so no two links ever cross: client–primary
  (writes), client–R1 (reads, and writes after R1 is promoted), primary–R1, primary–R2, and R1–R2 from the follow step.
- **Packets.** Per replica link: the records applied in this step arrive (an arrow with their LSNs); the records still in
  flight sit half way (`mid`). At the failure, what was in flight dies at the replica (`drop`). The write and its ✓
  travel on the client–primary link; the read `x?` and its answer on the client–server link.
- **One key, x = k.** Every record sets `x` to its LSN, so a stale read is visible as a number ("x = 3, you wrote 5").
- **Lag is one number** (shipping plus replay): a record is on the replica at `at + lag`. Records not there when the
  primary fails never arrive (T3). This is the simplest model that gives the task's numbers; real systems may still
  replay what was shipped but not applied.
- **Two scenarios, not one timeline.** `read` (five writes, then a read at 600 ms, no more writes) and `failAt` (writes
  until the failure) exclude each other: the model ignores `failAt` when `read` is on, the page hides the failure
  control while the read is on and the read toggle while a failure is set. One concept at a time, and the panel fits.
- **The read run lasts until the replica has the client's write**: `max(8, ⌈(500 + lag) / 100⌉)` ticks, so with a long
  lag and "wait for my record" the answer is always on screen (15 steps at lag 1000). The task's 8 steps hold for
  `read-own-write`.
- **Failover steps take no time** (fail, promote, follow, return, rebuild at the failure time): detection and promotion
  time are not this page's concept (`rpo-rto` has the downtime).
- **The priority control (`prefer`) appears only on a tie**: two replicas with the same applied LSN at the failure
  (the page replays the model to the failure to know; equal LSNs also come from different lags, e.g. 250 and 300 ms
  both give LSN 7 at 1000 ms). That is the only time it decides anything (rule 4, T1), and the panel fits.
- **"About the last n ms of writes"** after a loss is `min(lag, failure time)`: with lag 1000 and a failure at 600 ms
  every write is lost, and there were only 600 ms of them.
- **A replica with no record** is said so in the captions ("još nije primijenila nijedan zapis"), never "up to 0".
- **The old primary after rebuild is a replica of the new primary**, drawn as "replika" with "obnovljen" and
  "prati R1". With lag 0 it has nothing extra: not refused, it attaches (rule 7's second case).
- **Rule 6's rewind** (a follower ahead of the new primary) cannot happen with rule 4 among reachable replicas, so no
  preset shows it; `followPlan` implements it and the tests cover it directly. The returning old primary is the case
  the page shows (rule 7).
- **Captions** follow COMMON.md §4's term rule (*English term* (Croatian) at first mention in a caption), so the task's
  Croatian caption reads „*Primary* (primarni poslužitelj) potvrdio je zapise 8, 9 i 10, ali ih replika R1 još nije
  primijenila. Nakon preuzimanja ti su zapisi izgubljeni." The English caption for the stale read is the task's, with the
  value it returns added.
- **Presets** in two columns with short labels (Zaostatak, Svoj upis, Gubi se rep, Dvije replike, Povratak), so the
  panel fits at 1920×1080 with every control shown (checked in hr and en with two replicas, a failure, a tie and the old
  primary returning; and with a read from a replica with the wait on).
- **Legend**: seven entries with short words; the ack (✓) and the stale answer are page swatches (`dr-ack`, `dr-stale`).
- **Concepts, not tools**: no database product, command or setting is named; "write-ahead log", "LSN" and "WAL" are
  the generic terms.

## Deviations from the task

- Params: `read` (a toggle) added, the scenario switch for "read from a replica" (the task's `readFrom` and `rywWait`
  need a read to act on). `failAt` "none" is `0`. `prefer` (none / R1 / R2) is the task's "configured priority".
  `oldBack` added: the switch for preset 5.
- State: as the task's, plus `phase`, `ids`, `primary`, `refused`, `changed`, and per server `follows`, `extra`,
  `discarded`; each read has `own`, `wait`, `gotLsn`, `servedAt`. Writes after the promotion carry `lost: true`.
- The read scenario's step count grows with the lag (Decisions).
- Steps: failover events take no clock time (Decisions).

## Sources

- NLA `meta/toc.md` T55 „Replikacija baze — nastavak na cjelinu o bazama iz knjige 1" (chapter not written). Read.
- `~/projects/uvod-u-linux/book/chapters/22-baze-podataka.md`: the database as a service; only `replication` lines in
  `pg_hba.conf`, no replication model. Read.
- M. Kleppmann, *Designing Data-Intensive Applications*, ch. 5 "Replication": leaders and followers, synchronous vs
  asynchronous, replication lag, reading your own writes, failover losing writes, the old leader coming back
  *(check: from memory, no local copy)*.
- PostgreSQL documentation, "High Availability, Load Balancing, and Replication" (streaming replication asynchronous
  by default; a failed primary must not come back as a primary) *(check: from memory)*.
- MySQL documentation, "Replication" *(not consulted: not available offline)*.

## Checks

- Numbers printed by a script from the model before the page was written (the five presets and six more
  combinations), asserted in `sim.test.js`; the maximum over all combinations is 15 steps.
- **Mutations**: 21 one-at-a-time mutations of `sim.js` (priority ignored, the higher id on a tie, priority before the
  LSN, `<` for `≤` in the apply rule, lag ignored, a read answered with the primary's value or off by one, the wait
  ignored, every read fresh, a waiting read answered at the tick instead of at the apply time, writes going on after
  the read, the lowest LSN promoted, the lost tail including the promoted LSN, nothing lost, the follower not caught
  up, a rewind not detected, the old primary always accepted, the rebuild keeping its extra records, in-flight records
  arriving after the failure, the read before the apply in a tick, an extra failover step): each fails at least one
  test.
- **Fresh reviewer** (a separate agent, COMMON.md §8): read SPEC.md, the model and the page; every number and
  tie-break matched. It found the priority control hidden on ties from unequal lags, a caption overstating the lost
  time, "up to 0" captions, two SPEC wordings, and 12 surviving mutations (rounding down the read run, and state fields
  only the page used: failure time, roles, the changed marks). All fixed; the 12 mutations now fail the tests
  (24 tests). Its other survivors are equivalent mutants (no input can tell them apart).
- Browser sweep: 1532 states (78 param combinations × every step, both languages): no console error, no unfilled
  placeholder, no page or panel overflow.
- Gate: `npm run gate -- db-replication` passes (62/62 browser checks); screenshots at 1920×1080 light, dark,
  grayscale and 375×812 in both languages reviewed, plus steps of every preset at 1920×1080 (read stale, read waiting,
  fail, promote with two replicas, follow, return, rebuild).
- Panel fit measured with a script (panel `scrollHeight` = `clientHeight`) for the heaviest control sets in both
  languages.

## Term pairs

Missing from `kit/glossary.js`, written out in the strings (*English* (Croatian) on Croatian pages):

| English | Croatian | Note |
|---|---|---|
| replica | replika | |
| replication lag | zaostatak replikacije | task |
| write-ahead log | dnevnik unaprijednog pisanja | task *(check)* |
| failover | preuzimanje | task *(check)* |
| promotion | promaknuće | task *(check)*; the page says "promaknut" on the card |
| stale read | zastarjelo čitanje | task |
| read-your-writes | čitanje vlastitih upisa | task *(check)* |
| fencing | ograđivanje | NLA T53 |

`primary server` / `primarni poslužitelj` is in the glossary (uvod-u-linux) and used as `[[primary server]]` in the
explanation.

## Shared requests

None. K2 and K3 had everything this page needed.

## Time

Start 2026-10-24 08:39, done 2026-10-24 09:02 by the machine clock (one session).

# Preset task sync-async-replication (catalogue `sto-sync-async-replication`)

Task `docs/tasks/w3/sync-async-replication.md`, wave 3. One concept: **RPO 0 at the cost of latency vs lag and data
loss on failover**. Rules, tie-break and numbers: `SPEC.md`, "Synchronous commit".

## Decisions (sync-async-replication)

- **The host model was extended additively, not requested and stopped.** The task says to write the needed change under
  Shared requests and stop if the host cannot express it; it could not (no commit mode, no acknowledgement time, no
  RTT, no replica-down event, no policy). As the `win-vss`, `win-boot`, `win-update-rings` and `win-failover-cluster`
  preset tasks did with their hosts, and running unattended with the host done, I made the change inside this folder:
  `eff` gains `mode`, `rttMs`, `onSyncLost`, `r1DownAt`; `planOf` (the step list, with the `replicaDown` step);
  `tickExt`; `commitLatency`, `serialRate`, `extOf`. With `mode: 'async'` (the default) the model runs the host's
  `tick` and its states carry no new field (tested); the 24 host tests pass unchanged except the max-steps test, which
  now also covers the sync params.
- **Synchronous is one replica.** With `mode: 'sync'` the model forces one replica and the page hides the replica count
  (quorum commit over several replicas is out of scope, and the panel fits). The mode choice shows only with one
  replica (or while sync is on).
- **"R1 down" is "R1 unreachable from the primary"**: the replica or the link fails, the primary cannot tell which. R1
  keeps its log and can be promoted. That is what lets `degrade-silently` end with a failover that loses 6–10 ("no
  replica had them"): a replica that had truly failed could not be promoted, and nothing would be lost, only down. The
  K2 link P–R1 is drawn cut, R1 gets an "unreachable" badge; the task's en caption says "down", the page says
  "unreachable".
- **`replicaDown` is sync-only.** With an asynchronous R1 a cut changes nothing in the commit path, so the control is
  shown (and the model acts on it) only with `mode: 'sync'`. One concept.
- **The cut is a step of its own** after the tick at 500 ms, without clock time, like the host's failover events: that
  gives the task's 11 steps for `sync-replica-down`.
- **Local commit takes no time** (the host acknowledges in the same tick), so the latency the page shows is the
  replication's share: "+1 ms", "+40 ms". The rate cap (25/s at 40 ms) is said in the last caption of the run and in
  the explanation; with writes every 100 ms the client itself never hits it.
- **Applied = durably received** on a synchronous R1: the K3 strip does not split received from replayed (the host's
  lag is one number too). Reads are off in sync mode (the read scenario forces async), so "synchronous means fresh
  reads" is never shown.
- **Only acknowledged records count as lost.** `lost` filters on `acked` (no change for the host: every host write is
  acknowledged). Block plus a failure loses nothing acknowledged; the caption says 6–10 were never acknowledged.
- **Presets on top of the defaults**: the host's five presets need no change (the kit applies a preset over the
  defaults, so they reset `mode` to async). Nine presets fill the keys 1–9.
- **Legend per params**: the kit has no per-mode legend, so `setMode` hides items that cannot appear (`data-off`), as
  `lnx-cow-filesystem` does; with all ten shown the header wrapped to two lines. The subtitle swaps to the sync concept
  in sync mode (same pattern; see Shared requests).
- **Panel fit**: nine presets and the sync controls needed tighter spacing: preset gap 0.2rem, panel gap 0.4rem, group
  gap 0.35rem (page CSS; button heights and text sizes unchanged). Measured by a sweep (below).
- **Explanation**: the host's last paragraph ("synchronous commit is not part of this page") is replaced by two on
  synchronous replication, the block / degrade policies and the misconceptions, with links to `rpo-rto` and
  `restore-drill`.

## Deviations from the task (sync-async-replication)

- **`async-failover` is the host's `failover-tail`** (identical params and numbers: 3 lost at lag 250 ms). A second
  button with the same params would be a duplicate (the kit marks the active preset by params) and a tenth preset has no
  number key. `sync-failover`'s hint points to it ("Compare with Lost tail").
- **`degrade-silently` has 13 steps, not 12**: 10 ticks, the cut, fail and promote. The task's 12 seems to leave out
  either the cut or the promotion.
- **`mode` defaults to `async`**, not `sync`: the host's default page is asynchronous and its five presets rely on it.
  The sync presets set `mode: 'sync'`.
- **Term rule in the captions**: „*Synchronous replication* (sinkrona replikacija): zapis 7 potvrđen je tek kad ga je
  replika R1 spremila, u 701 ms. Pad primarnog sada ne gubi ništa — ali svaki upis čeka povratni put do replike, 1 ms."
  (the task wrote „Sinkrono (*synchronous*)", reversed). The en caption for the blocked commits says "nothing is being
  committed" (the task: "written": the primary does write them to its own log).
- **Legend**: the confirmation is "↩ replica confirms" and the record's chip carries ⌛ while it travels to R1 (the
  wait is inside one 100 ms tick, so it is never a state of its own); "blocked" is a crossed ⌛ with "čeka" on the cell.
- **Topic**: the task names `storage`; the host's topic is `distributed`, and a preset has no topic of its own. The
  entry is listed under the host's topic. Tag `replication` as the task says.

## Sources (sync-async-replication)

- M. Kleppmann, *Designing Data-Intensive Applications*, ch. 5 "Synchronous Versus Asynchronous Replication"
  *(check: from memory, no local copy)*.
- PostgreSQL documentation, "Synchronous Replication": commits wait for the synchronous standby; while none is
  connected they wait *(check: from memory)*. Which database blocks and which degrades by default *(check)*.
- `~/projects/dr-lecture-estate/student/handbook/sites.md`, "WAN links": one-way latencies 0.8–14 ms (hq–brk IPsec 9
  ms), so 40 ms RTT is a long WAN link, 10 ms a regional one *(not re-read in this session; the task's numbers used)*.
- NLA `meta/toc.md` T55 (chapter not written).

## Checks (sync-async-replication)

- Numbers printed by a script from the model before the page, asserted in `sim.test.js` (11 new tests, 35 in all):
  tie-break S5 and the cut's order first, then S1–S4, params, "host states carry no new field", the four presets, max
  steps 15.
- **Mutations**: 20 one-at-a-time mutations of the new code (no round trip, the sync replica applying by its lag, block
  not waiting, degrade ignored or applied on block, unacknowledged counted lost, the cut a tick late or merged into the
  tick, an unreachable replica still receiving, the confirmation in the next tick, a wrong rate, async latency = RTT,
  sync with two replicas, a cut while async, blocked listed twice, the cut failing R1, `ackAt` without the RTT, no
  latency record, new fields on host states, RTT not validated): each fails at least one test.
- **Browser sweep**: the nine presets at every step, plus the heaviest control sets (sync + cut + degrade + failure +
  old primary back; sync + cut + block + failure + old primary back at RTT 40; sync + failure at 600 + old primary; two
  replicas with a tie and the old primary back), both languages, 342 states: no console error, no unfilled placeholder,
  no page or panel overflow at 1920×1080. It found a caption with a repeated placeholder that lost its first value
  (fixed with the page's `rich`).
- Gate: `npm run gate -- db-replication` passes (63/63 browser checks, the `sync-failover` entry opens); screenshots at
  1920×1080 light, dark, grayscale and 375×812 in both languages reviewed, plus sync steps of every new preset.
- **No fresh reviewer**: COMMON.md §8 asks for one on new sims; this is a preset on a reviewed host.

## Term pairs (sync-async-replication)

| English | Croatian | Note |
|---|---|---|
| synchronous replication | sinkrona replikacija | task |
| asynchronous replication | asinkrona replikacija | task |
| round-trip time (RTT) | vrijeme povratnog puta | task, URM *(check)* |
| commit | potvrda transakcije | task *(check)*; the page says "potvrda" / "upis" |
| acknowledgement | potvrda | task |
| RPO | RPO (ciljna točka oporavka) | task; links `rpo-rto` |

`latency` / `latencija` is in the glossary (ossimulator) and used as `[[latency]]` in the explanation.

## Shared requests (sync-async-replication)

- **kit.js legend per params**: a legend item's optional `visible(params)` (as a param's), so a page with modes does not
  hide `li` elements itself (also asked by `win-vss`).
- **kit.js subtitle per preset entry**: when a `sim.json` entry is the active preset, show its `concept` as the
  subtitle (also asked by `win-vss`); this page swaps the subtitle in sync mode itself.

## Time (sync-async-replication)

Start 2026-11-05 07:41, done 08:00 by the machine clock (one session).
