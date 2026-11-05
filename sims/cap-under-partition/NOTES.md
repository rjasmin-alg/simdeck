<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cap-under-partition: notes

New stepper (task `docs/tasks/w3/cap-under-partition.md`, catalogue `ha-cap`, wave 3). Kit view **K2**
(`Simdeck.topology`) draws the two clients and the three replicas with the requests on the wire; kit view **K3**
(`Simdeck.blockGrid`) draws each replica's versions of `x` as a strip. Rules and expected numbers: `SPEC.md`.

## Decisions

- **The run is a param.** A stepper replays its steps from the params, so the student's actions live in a hidden
  `ops` param (`p.w1.r2.w2.h`). The six buttons add an action at the next step and drop the steps after it, then jump
  to it (the pattern of `distance-vector`'s events). The run stays in the URL, so a reload, a link or `L` keeps it; the
  hidden choice's options are the presets' runs plus the cleaned run from the page's URL (the kit reads a URL value only
  when it is an option).
- **One step per action, then a summary.** This gives the task's step counts exactly (3, 6, 6, 4). The summary counts
  each client's answers and the lost writes, and says the misconception that fits the mode.
- **Partition toggle = one button at a time.** The task lists a `partition` toggle and a "heal" button; the page shows
  "Razdvoji mrežu" while the network is whole and "Spoji mrežu" while it is partitioned (at the step on screen). The kit
  has no `visible` for button params, so the page sets `hidden` on the two buttons after each render (shared request
  below). A partition while partitioned or a heal while whole is still a valid, empty step (T4) for hand-made URLs.
- **The mode does not reset.** Switching CP ⇄ AP keeps the step and replays the same run, so the class sees the same
  requests answered the other way at the same point.
- **Coordinators.** K1 always sends to A, K2 to C (the task's "K1 near A/B, K2 near C"). The coordinator sends to every
  replica it can reach and acts on this step's answers: a CP write needs 2 acknowledgements, a CP read 2 answers.
- **A refused CP write is applied nowhere** (not left on C): the minority cannot commit. Its value still counts for
  numbering, so K2's refused write in `cp-majority` is `x = 3` as in the task.
- **Stale** means older than the newest acknowledged value anywhere (by the LWW order). With LWW the newest version is
  never the one lost, so this is the newest value in the system.
- **Divergence vs behind.** The sides diverge only when both accepted a write since the partition began; one side
  that missed writes is "behind" (badge „zaostaje") and the heal is a catch-up. A second partition starts a new window.
- **Catch-up and LWW send the newest version only** (one key; intermediate values are overwritten anyway). The K3
  strip therefore shows the versions a replica never received as empty cells after a heal.
- **Several requests in one step** (`w1+r2`) exist in the model for rule 6 (K1 before K2, and the LWW tie: larger
  client id wins, as in `multimaster-conflict`). The buttons make one request per step; a URL can make more.
- **Drawing.** Grid of 14 columns: K1, A over B, an empty middle column with the **partition wall** (a hatched grid item
  under the links, so the links' red crosses sit on it), C, K2. Every request draws: client → coordinator, coordinator
  → each other replica (dropped half way at the wall when cut), the acknowledgements or answers back (CP only; AP sends a
  write on without waiting and reads alone), and the answer to the client (ending in a cross on ✗). Chips sit at 0.3 of
  their own way so a message and its reply do not overlap. At a conflict heal each replica shows the two versions
  stacked, the loser struck, and „!".
- **Answer bubble** on the client card, copied from `db-replication`: solid ✓, hatched red frame „zastarjelo", dashed
  red „✗ isteklo".
- **K3 strip:** one column per write of the whole run (the strip keeps its width), labelled with its sender; a held
  version is `fill` in the sender's colour, a version that did not reach the replica `ghost` (dashed), a refused write
  `dead` on its coordinator, a lost write `bad`. The counter shows `CP: W = 2, R = 2, N = 3` or `AP: W = 1, R = 1, N = 3`.
- **Legend by mode:** items that cannot appear in the current mode are hidden (CP never answers stale nor loses a
  write; AP never times out), so the header stays one line.
- **Term rule.** None of the terms is in `kit/glossary.js`; captions write *English term* (Croatian) at first mention
  in a caption (as `db-replication` does). The task's Croatian caption therefore reads „… Sustav je *consistent*
  (dosljedan), ali za klijenta K2 nedostupan." (the task had „dosljedan (*consistent*)").
- **Concepts, not tools:** no database or product is named; CAP, quorum, LWW are the generic terms.

## Reuse of db-replication (COMMON.md §6)

`models/` has no promoted model (only `README.md` and `CHANGELOG.md`). From `sims/db-replication/` @ 7262ad5 this sim
reuses the state shape (`servers`, `writes`), the K2 + K3 page layout and the answer bubble's CSS. None of its model
functions applies (they model a primary's log, lag and failover; this is a leaderless quorum), so no function is
copied and there is nothing to promote from here. This model is pure and promotable as it is, if `raft` or a later
quorum sim wants it.

## Deviations from the task

- `partition` is the Razdvoji / Spoji button pair, not a toggle param (a partition is a step of its own, task "One
  step").
- State: as the task's (`mode`, `partition`, `quorum`, `requests`, `divergence`) and db-replication's (`servers`,
  `writes`), plus `n`, `phase`, `partitionedAt`, `heal`, `tally`, `changed`, `noop`. Requests carry `value`, `seq`,
  `consulted`, `newest`; servers `at`, `client`, `seq`, `got`.
- The task's Croatian caption „… dosljedan (*consistent*) …" is written „… *consistent* (dosljedan) …" (COMMON.md §4
  term rule, as in db-replication), and its R-read refusal keeps the task's word „potvrde".
- The LWW stamp is the step number with the client id as tie-break (the model has no clocks; clock skew is
  `multimaster-conflict`'s concept).

## Sources

- E. Brewer, "Towards Robust Distributed Systems", PODC 2000 keynote *(check: from memory, no local copy)*.
- S. Gilbert, N. Lynch, "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web
  Services", *SIGACT News* 33(2), 2002 *(check: from memory)*.
- E. Brewer, "CAP Twelve Years Later: How the 'Rules' Have Changed", *Computer* 45(2), 2012: the choice is made only
  during a partition; "2 of 3" is misleading *(check: from memory)*.
- M. Kleppmann, *Designing Data-Intensive Applications*, ch. 5 "Quorums for reading and writing" (w + r > n), "Last
  write wins"; ch. 9 "The CAP theorem" *(check: from memory, no local copy)*.
- No local course material on CAP (NLA, DR). `sims/db-replication/` and `sims/multimaster-conflict/` read for the
  shared drawing and the LWW tie rule.

## Unchecked *(check)*

- Rule 1's wording that both modes behave the same without a partition (Brewer 2000; Gilbert & Lynch 2002).
- Rule 2's quorum overlap statement and its source section in *DDIA* ch. 5.
- Rule 5's LWW description (*DDIA* ch. 5).
- Croatian „otpornost na razdvajanje mreže" for *partition tolerance* (task marks it *(check)*); used only in the
  aliases, not on the page.

## Term pairs (not in `kit/glossary.js`)

- consistency — dosljednost (consistent — dosljedan)
- availability — dostupnost (available — dostupan)
- network partition — razdvajanje mreže
- partition tolerance — otpornost na razdvajanje mreže *(check)*
- quorum — kvorum; read / write quorum — kvorum čitanja / pisanja
- stale read — zastarjelo čitanje
- last write wins — posljednji upis pobjeđuje
- replica — replika

## Shared requests

- **Kit: `visible` (and `disabled`) for `button` params** (`kit/kit.js`, the settings group). Why: a page with a
  pair of actions that apply in opposite states (partition / heal) must hide one. Smallest change: run the button
  through `syncState` like the other controls. Workaround here: `syncButtons()` in the page sets `hidden` on the two
  buttons found by their label; drop it once the kit has it.

## Checks

- Numbers printed by a script from the model before the page was written (the four presets in both modes and nine more
  runs), asserted in `sim.test.js`.
- Every rule and tie-break broken once on purpose (14 of mine, then the reviewer's: client order, LWW tie, CP read source, double
  partition, AP propagation, W and R, a refused write left on C, stale detection, divergence, nothing lost, wrong loser,
  no catch-up, value numbering): each makes at least one test fail. T3 needed a hand-built state, because no run leaves
  a CP coordinator behind its reachable peers.
- A fresh reviewer (subagent) read the code against SPEC.md, ran 20 more mutations and drove the page. Fixed from
  its findings: the AP read caption lost the replica name (a node used twice in `t.parts`; captions now go through
  `rich`, which clones), a plural catch-up sentence, the divergence and "same in both modes" sentences repeated in
  one step, the AP summary saying "no loss" while still diverged, an AP caption claiming acknowledgements, "nobody
  wrote" after a refused write, P left undefined in the explanation, Croatian quotes and agreement; and five
  mutations no test caught (two lost writes, `got`, `changed.servers`, the heal reset, the AP read's consulted set,
  a `w1+p` step), now each tested.
- An exhaustive check: every CP run of five actions (7776 runs) has no stale read and no lost write.
- Buttons driven in a browser: partition, K2 read and write in CP, switch to AP mid-run, K1 write, heal, summary,
  insert at an earlier step (later steps dropped), reload from the URL, `L`; no console errors.

## Time

Started 2026-11-05 08:32 CET, done 08:57 CET: about 25 minutes (model, tests and SPEC about 10, page and strings about 8, review
and fixes about 7).
