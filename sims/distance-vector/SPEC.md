# distance-vector: Distance vector and count to infinity

<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

Task: `docs/tasks/w3/distance-vector.md` (catalogue `net-distance-vector`, §4.1). Class: stepper. Kit view **K2:
topology** (`kit/topology.js`), routers as cards with their routing table inside, the advertised vectors as packets
on the links.

**One concept:** RIP-style updates, slow convergence, split horizon.

Sources, short names used below: **URM11** = Uvod u računalne mreže `book/chapters/11-usmjeravanje.md`, section
"Dinamičko usmjeravanje: kad tablicu gradi mreža sama" (footnotes carnet-dv-ls, rfc2453-rip, carnet-rip) and its
"Šire o temi"; **RFC** = RFC 2453 (RIP version 2); **check** = the check script (below), written before the model and
independent of it.

## Scenes

| `topo` | Routers | Links (cost 1 each) | Network N on | Source |
|---|---|---|---|---|
| `line` | A, B, C | A–B, B–C | C | task preset 1 |
| `ring` | A, B, C, D | A–B, B–C, C–D, A–D | C | task preset 4 |
| `triangle` | A, B, C, D | A–B, A–C, B–C, C–D | D | task preset 5 |

One destination, network N, drawn as a cloud beside its router. Every table therefore has one row (N, metric, next
hop); the model is written for any number of networks, the scenes use one so the count stays readable.

## State

```
{ round, since, tables: { R: { N: { metric, via } } }, links: [{ id, a, b, up }], nets: { N: { at, up } },
  kind: 'start' | 'round' | 'cut' | 'down', ev, noop, ads: [...], changes: [...], quiet, cutOff: [R], end }
```

`via` is the next hop's name, or `null` for a directly connected network. `ads` are the vectors on the wire in this
round: `{ from, to, dest, metric, sent: 'full' | 'suppressed' | 'poison', used }`. `changes` are the table updates in
the order they were made: `{ r, dest, from: {metric, via} | null, to: {metric, via}, by, why, false }`, `why` one of
`new`, `better`, `nexthop`, `cut`, `down`; `false` marks a finite route at a router that has no path to N any more
(the false route of count to infinity). `cutOff` lists the routers with no path to an up network N (graph search over
up links). `since` counts the rounds since the last topology change. The task's `mode` and `events` are params.

## Params

| Param | Values | Default | Shown |
|---|---|---|---|
| `mode` | `plain`, `split` (split horizon), `poison` (poisoned reverse) | `plain` | choice |
| `cutLine`, `cutRing`, `cutTri` | the scene's links | `B-C`, `B-C`, `C-D` | choice, the one for the scene (the link the button cuts; drawn in ink) |
| button "Cut link" (key X) | adds a cut of the chosen link at step n + 1 to `events`, then steps | | |
| button "Network down" (key D) | adds N down at step n + 1 to `events`, then steps | | |
| `topo` | `line`, `ring`, `triangle` | `line` | hidden choice (kept in the URL), set by presets |
| `start` | `cold` (only N's router knows N), `converged` (rounds run from cold until quiet, under `mode`) | `cold` | hidden choice, set by presets |
| `events` | a number: one base-6 digit per step, step 1 lowest (0 nothing, 1 N down, 2 + i cut the scene's link i, links in the order of the Scenes table); the text form `"1:down,3:cut:B-C"` is accepted too (tests) | `0` | hidden choice, set by presets (`code(topo, text)`) and the buttons; a number so the kit keeps it in the URL |

A button press at step n puts the event at step n + 1 and drops every event after step n (the future is rewritten).
Rejected, with a caption note and no step: cutting a link that is already down, taking N down twice, any event past
step 20. A malformed number, a digit for a link the scene lacks, or (text form) an unknown entry is ignored; in the
text form two events for one step keep the first.

## One step

**A round** (every step without an event, task "one step = one synchronous update round"):

1. Every router builds its vector from its table **at the start of the round** (snapshot) and sends it on every up
   link (rule 1). A router with no entry sends nothing (no arrow).
2. All vectors are delivered at once; each router then processes the vectors it received **one by one in the
   sender's name order**, against its table as it stands so far (rules 2–6).

**A topology change** is its own step and changes only the routers that see it directly (rule 7). No vectors move.

### Rules

| # | Rule | Source |
|---|---|---|
| 1 | Each router sends its whole table to every neighbour each round. | URM11 "Dinamičko usmjeravanje" (footnote carnet-dv-ls: "svaki usmjerivač cijelu svoju tablicu informacija dijeli sa susjednim usmjerivačima"); RFC §3.4 |
| 2 | Metric = hop count; a directly connected network has metric 1; a received metric m becomes min(m + 1, 16). The page's explanation says that some router vendors print a learned route one lower than this convention (connected = 0) *(check)*. | URM11 (footnote rfc2453-rip, "broj skokova"); RFC §3.4, §3.9.2 ("metric = MIN (metric + cost, infinity)") |
| 3 | 16 means unreachable, so no path is longer than 15 hops. | URM11 (footnotes rfc2453-rip, carnet-rip "Maksimalno je dozvoljeno 15 koraka"); RFC §3.4.2 |
| 4 | Accept an offer when the router has no route to that network and the new metric is below 16, or when the new metric is strictly lower than the current one. A route at 16 (also a directly connected network that went down) is beaten by any finite offer. | RFC §3.9.2 ("If there is no such route, add this route to the routing table, unless the metric is infinity"; "or, if the new metric is lower than the old one") |
| 5 | An update from the **current next hop** is always believed, better or worse (the metric is set to min(m + 1, 16)). Same metric: no change. | RFC §3.9.2 ("If the datagram is from the same router as the existing route, and the new metric is different than the old one … Adopt the route"), §3.4.4 ("the receiving router is required to believe the new information, whether the new metric is higher or lower") |
| 6 | Tie-break: an equal metric from a different neighbour does not replace the route (rule 4 says strictly lower). Two equal new offers in one round: the sender first in name order wins, because it is processed first and the second is not strictly lower. | RFC §3.9.2 ("Normally, it is senseless to replace a route if the new route has the same metric"); name order derived (determinism) |
| 6a | Processing order: the received vectors in the sender's name order, applied one after another. Consequence (triangle, preset 5): A's offer from B (4) is not better than its 3 via C, then C's 16 is believed, so A ends at 16, not at 4 via B. | derived (determinism); RFC §3.9.2 processes each response as it arrives |
| 7 | A directly connected network that goes down gets metric 16 on its router (next hop stays "direct"). A cut link sets 16 on every route whose next hop was across it, on both ends; the link carries nothing afterwards. | task rule 7; RFC §3.4.1 ("we mark the route as invalid"), §3.4.2 ("All of the immediately neighboring routers time out and set the metric for that network to 16") |
| 8 | Split horizon: a route is not advertised to the neighbour it was learned from (struck out on the arrow). Poisoned reverse: it is advertised to that neighbour with metric 16. A directly connected route has no next hop and is never held back. Plain: everything is sent. | RFC §3.4.3 |
| 9 | Routes at 16 stay in the table and are still advertised (that is how bad news travels); RIP's garbage-collection timer, which would delete them later, is out of scope. | RFC §3.8 (an expired route "is retained in the routing table for a short time so that neighbors can be notified that the route has been dropped"; mentioned only) |

### End of a run

The run ends at the first step after which nothing can change and no event is still to come:

- **quiet**: a round in which no table changed (shown, "the routers have converged"), as in the cold start's round 3;
- **unreachable**: a round after which no router cut off from N has a finite route to it (each holds 16 or has no
  entry), at least one cut-off router holds 16 (a router cut off before it ever learned N got no bad news), and the
  next round would change nothing. Never on a topology-change step. Its caption says the bad news has reached everyone
  after `since` rounds. No quiet round follows: nobody can offer a finite metric any more.
- **limit**: step 20 (contract: a stepper has at most 20 steps); the caption says the count would go on.

`steps(p)` replays to the end. The task's step counts follow from these two endings.

## Presets (numbers from the check script)

Notation per step: `router=metric/next hop` (`*` = directly connected, `-` = no entry). Rounds are numbered from the
start of the run (the page's "Krug k"); a topology change is a step but not a round.

### 1 `cold-start`: line, cold, plain — 3 steps

| Step | Tables | Note |
|---|---|---|
| 0 | A=- B=- C=1/* | only C knows N |
| 1 | A=- B=2/C C=1/* | round 1: B learns N = 2 via C (C→B carries N:1) |
| 2 | A=3/B B=2/C C=1/* | round 2: A learns N = 3 via B |
| 3 | unchanged | round 3: no change, converged (end quiet) |

Source: RFC §3.4 (method); task preset 1; check.

### 2 `count-to-infinity`: line, converged, plain, `1:down` — 15 steps

| Step | Tables |
|---|---|
| 0 | A=3/B B=2/C C=1/* |
| 1 | N goes down: C=16/* |
| 2 | round 1: A=3/B **B=16/C** **C=3/B** (C believes B's old 2; B believes its next hop C) |
| 3 | round 2: A=16/B B=4/A C=16/B |
| 4 | round 3: A=5/B B=16/A C=5/B (the task's hr caption: "Krug 3: C još vjeruje B-u, koji javlja 4 …, pa C upisuje 5") |
| 5…14 | B and A/C alternate 6, 7, 8 … 15 |
| 15 | round 14: A=16/B B=16/A C=16/B, every router 16 (end unreachable) |

Source: RFC §3.4.2 (mechanism); round count from check (synchronous rounds); task preset 2.

### 3 `split-horizon`: line, converged, split, `1:down` — 3 steps

| Step | Tables |
|---|---|
| 1 | N goes down: C=16/* |
| 2 | round 1: B=16/C (B→C is held back, so C has nothing to believe) |
| 3 | round 2: A=16/B, all 16 (end unreachable) |

Poisoned reverse gives the same 3 steps (B→C carries N:16, which changes nothing at C). Source: RFC §3.4.3; check.

### 4 `ring-reroute`: ring, cold, split, `3:cut:B-C` — 6 steps

| Step | Tables |
|---|---|
| 0 | A=- B=- C=1/* D=- |
| 1 | round 1: B=2/C D=2/C |
| 2 | round 2: A=3/B (B and D both offer 2; B is first in name order, rule 6) |
| 3 | B–C cut: B=16/C (A, C, D unchanged) |
| 4 | round 3, the first after the cut: A believes B's 16 first (rule 5), then takes D's 2 → **A=3/D** |
| 5 | round 4: **B=4/A** (good news reaches B) |
| 6 | round 5: no change (end quiet) |

Plain gives 5 steps (B already takes A's stale 3 → 4/A in round 1, which happens to be right after A's switch).
Source: derived; check.

### 5 `triangle-plain`: triangle, converged, plain, `1:cut:C-D` — 14 steps

| Step | Tables |
|---|---|
| 0 | A=3/C B=3/C C=2/D D=1/* |
| 1 | C–D cut: C=16/D |
| 2 | round 1: A=16/C B=16/C **C=4/A** (A and B both offer 4; A first, rule 6) |
| 3 | round 2: A=5/C B=5/C C=16/A |
| 4…13 | C and A/B alternate 6 … 15 |
| 14 | round 13: A=16/C B=16/C C=16/A; D still has N=1 (end unreachable: A, B, C are cut off and all hold 16) |

Split horizon or poisoned reverse: all 16 in round 1 (2 steps). Source: derived; check.

### 6 `ring-split`: ring, converged, split, `1:down` — 15 steps (added by this sim)

| Step | Tables |
|---|---|
| 0 | A=3/B B=2/C C=1/* D=2/C |
| 1 | N goes down: C=16/* |
| 2 | round 1: B=16/C D=16/C (A keeps 3/B: B's snapshot still said 2) |
| 3 | round 2: A=16/B **D=4/A** (A learned N from B, so split horizon lets A tell D) |
| 4 | round 3: C=5/D, D=16/A |
| 5…14 | the false route goes round the loop A → D → C → B → A, one hop longer each round |
| 15 | round 14: all four 16 (end unreachable) |

The task (rule 9) says split horizon stops preset 2's two-router loop and that loops through three or more routers
"can still count to infinity with real, unsynchronised timers … which this model does not show". In a ring it shows
even with synchronous rounds: A has a second neighbour that never gave it the route, so split horizon does not hold
A's stale 3 back from D. The explanation says so; NOTES.md records the deviation. Source: RFC §3.4.4 ("it is still possible to end
up with patterns in which three routers are engaged in mutual deception … Split horizon cannot stop such a loop"); check.

## Steps and the contract

Steps per preset: 3, 15, 3, 6, 14, 15 (all ≤ 20). Defaults = preset 1, `sim.json` `steps` = 3. Free play (the
buttons) is capped at 20 by the `limit` end.

## Check script

`check.py` (written in the thread's scratchpad; its source and a summary of its output are in NOTES.md): a dictionary model in
Python, written from the rules above before `sim.js`, running every preset and the other mode for each. Every
number in the tables above is its output; `sim.test.js` asserts the same numbers.

## Page

- Stage: K2 topology. Router cards (rounded square mark) with a three-column table inside (destination, metric,
  next hop); N as a cloud. The link the cut button would cut is drawn in ink. During a round, each link carries an
  arrow each way with the sender's vector as a chip (`N:2`); a held-back entry is a hollow dashed chip, struck out;
  metric 16 is a danger chip with the number struck through; an arrow whose vector changed a table is highlighted
  (the kit's changed mark).
- Table row: route via a neighbour (left bar c1), directly connected (c2 solid square), unreachable (16 struck out,
  danger), changed this step (`sd-changed`).
- Legend: via a neighbour, directly connected, unreachable 16, held back by split horizon, changed.
- Caption: the round (or the topology change), the changes grouped by kind, the split-horizon note when a held-back
  entry would have brought back a false route, the count-to-infinity sentence when a false route was written, and
  the end.
- Explanation: rules 1–8, why 16, count to infinity, split horizon and poisoned reverse and their limit (ring),
  timers in seconds (30 s, 180 s, 120 s, RFC §3.8) mentioned as out of scope, the hop-count convention note.

## Out of scope

RIP timers in seconds, triggered updates and hold-down, RIP message format, link state (`link-state-spf`), the
optional "send a packet" check (task "Reuse": not built, see NOTES.md).
