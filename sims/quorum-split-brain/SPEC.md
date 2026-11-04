<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# quorum-split-brain: specification

Task `docs/tasks/w2/quorum-split-brain.md`, catalogue `ha-quorum-split-brain` (§4.7, overlap §5.7). One concept:
**a majority of the configured votes keeps one side alive; an even split leaves none; a witness breaks the tie;
without quorum both halves run the service (split-brain)**. Fencing is named where it matters (a takeover) and left
to the preset task `fencing`.

## Scene

- 2–5 cluster **nodes** `A`…`E` in a ring of links (`A–B`, `B–C`, …, last–`A`; two nodes have one link `A–B`).
  Every node has 1 vote.
- An optional **witness** `W`: a vote-only member in a third place, linked to every node. It never runs the service.
- One **resource**: a service with a virtual IP and its data (`x`, 0 at the start), running on `A` at step 0.
- **Scenes** (labels only, catalogue §5.7): `ha` (a Linux HA cluster), `win` (a Windows failover cluster; the witness
  is a file-share witness), `ceph` (Ceph monitors; the resource is the leader role, held by the lowest-ranked monitor
  in quorum; without a monitor quorum clients get no maps and the cluster stops serving I/O, cephsim `net.js`). `ceph` has no witness and no `ignore` policy (it cannot switch
  quorum off): the model treats them as off and `stop`.

## Params

| Param | Values | Default |
|---|---|---|
| `nodes` | 2–5 | 3 |
| `split2` … `split5` | the partition for that node count (below) | `A|B`, `AB|C`, `AB|CD`, `AB|CD|E` |
| `witness` | on / off | off |
| `witnessAt` | `first` (the side of `A`) / `last` (the side of the last node) | `first` |
| `policy` | `stop` / `ignore` | `stop` |
| `scene` | `ha` / `win` / `ceph` (set by presets, not a control) | `ha` |

Partitions (groups of the ring, `|` between sides, `!X` = node X has failed instead of being cut off):
2: `A|B`, `A|!B`, `!A|B`; 3: `AB|C`, `A|BC`, `A|B|C`, `AB|!C`; 4: `AB|CD`, `ABC|D`, `AB|C|D`, `A|BCD`;
5: `ABC|DE`, `AB|CDE`, `AB|CD|E`, `ABCD|E`. A ring link is cut when its two ends are in different sides; a link to a
failed node is dead (drawn off, not cut). A witness link is up only to the up nodes of the witness's side.

## Rules

1. **Quorum** = more than half of the **configured** votes: `needed = ⌊total/2⌋ + 1`, `total` = nodes + witness
   (cephsim `js/engine/net.js` "A majority of *configured* mons must be mutually reachable", `needed =
   floor(monHosts/2) + 1`; faultline `GATES.quorum` "a majority of", `floor(n/2) + 1`; votequorum(5) *(check)*).
   Failed nodes and an unreachable witness still count in `total`.
2. With policy `stop`, a side with quorum **keeps** the resource (it runs on one of its nodes) or **starts** it; a side
   without quorum **stops** it (it ran there) or leaves it **off** (Pacemaker's `no-quorum-policy=stop` *(check)*).
3. **Even splits leave no side with quorum**: 2|2 of 4 → 2 < 3, both stop; 1|1 of 2 → 1 < 2, both stop (faultline
   PEDAGOGY §1: "add a fourth node and discover it made things worse").
4. The **witness** adds one vote, to the one side that reaches it (Microsoft Learn "Understanding cluster and pool
   quorum", witness types *(check)*). 2 nodes + witness split 1|1: the witness's side has 2 of 3.
5. **Three or more sides**: quorum only if one side alone has the majority (5 nodes 2|2|1 → 2, 2, 1 < 3 → none).
   At most one side can ever have quorum (two majorities of the same total would share a vote).
6. Policy `ignore` (quorum switched off): every side with an up node keeps or starts the resource. Two or more running
   copies = **split-brain**: a client write lands on each (`x = 1`, `x = 2`, …); after the heal the copies differ and
   all but one side's writes must be thrown away (link `multimaster-conflict`).
7. Quorum decides who *may* run; it cannot stop a node that does not hear the decision. That is **fencing**, not
   modelled here (preset task `fencing`): the takeover caption and the explanation say so. No test (nothing to break).
8. A **failed node** is a side of one with 0 votes; if the resource ran there it is **lost** (not stopped by anyone).

### Tie-breaks

- T1. A quorum side that must start the resource starts it on its **lowest-id up node** (`A` < `B` < …). In the
  `ceph` scene this is the monitors' own rule: the leader is the lowest rank in quorum.
- T2. Exactly half is not quorum (`votes ≥ needed`, never `votes ≥ total/2`): 2 of 4, 1 of 2.
- T3. In a partition the witness's side is the side holding `A` (`first`) or the last node (`last`). A failed node
  cuts no link, so if that node has failed the witness answers the first up node's side: `!A|B` with the witness at
  `A` → B has 2 of 3 and starts the service (two nodes and a witness survive losing either node).
- T4. Side order: by the lowest node id in the side (the order of the split string); failed singletons in place.
- T5. Write values follow side order among the running sides: the first running side writes `x = 1`, the next `x = 2`.

## Steps

`steps = 4`, or `3 + w + 1` when `w ≥ 2` sides run the resource after step 3 (split-brain).

0. One cluster: one side with all votes, quorum, the resource on `A`, `x = 0` everywhere.
1. **Partition**: cut the links / fail the node; the sides appear, not yet counted.
2. **Count**: each side counts its votes (and the witness's), `k of total`, quorum or not.
3. **Act**: each side keeps / starts / stops / leaves off the resource; a failed side loses it.
4. … (split-brain only) **Write**: one step per running side, a client write `x = i` on that side's node.
5. **Heal**: the links come back (failed nodes stay down); one side again, counted. If one copy ran, the others take
   its data. If none ran and the healed side has quorum, it starts the resource (T1). If two or more ran with
   different data, the copies **differ** (`diverged`): the cluster cannot merge them.

"Changed" marks a side whose quorum status, action, data or membership changed in this step.

## Presets (numbers checked by script, asserted in `sim.test.js`)

| # | id | Params | Count | Act | Steps |
|---|---|---|---|---|---|
| 1 | `three-nodes` | ha, 3, `AB|C` | AB 2/3 quorum, C 1/3 no | AB keeps on A, C off | 4 |
| 2 | `four-nodes` | ha, 4, `AB|CD` | AB 2/4, CD 2/4, needed 3: none | AB stops, CD off; heal starts on A | 4 |
| 3 | `two-plus-witness` | win, 2, `A|B`, witness at A | A+W 2/3 quorum, B 1/3 no | A keeps, B off | 4 |
| 4 | `five-three-way` | ha, 5, `AB|CD|E` | 2/5, 2/5, 1/5, needed 3: none | AB stops, CD off, E off | 4 |
| 5 | `split-brain` | ha, 2, `A|B`, ignore | 1/2, 1/2: none | A keeps, B starts | 6: x = 1 on A, x = 2 on B, heal: diverged |
| 6 | `ceph-mons` | ceph, 3, `A|B|C` | 1/3 each, needed 2: none | leader A stops, nobody serves | 4 |

Other checked numbers: 2 nodes `A|!B` → A 1/2, no quorum, stops (the two-node misconception); with the witness (at
either node) → 2/3, keeps. `!A|B` + witness → resource lost, B 2/3 starts it (T1, T3); without the witness B 1/2, off.
3 nodes `AB|!C` + witness at the last node → AB 3/4 keeps.
3 nodes `A|BC` → BC 2/3 starts on B. 3 nodes + witness (total 4, needed 3) `AB|C`, witness at the last node → 2 and
2: none (a witness on an odd count can make it worse). 4 nodes + witness `AB|CD` → AB 3/5 keeps. 5 nodes `ignore`
`AB|CD|E` → three writers, 7 steps (the maximum).

## Windows failover sequence (preset task `win-failover-cluster`)

Task `docs/tasks/w3/win-failover-cluster.md` (catalogue `win-failover-cluster`, §4.5.7 and §5.7). One concept: **node
majority, disk and file-share witness** (and the dynamic vote adjustment Windows adds). An opt-in second flow: param
`failover` (`false` by default, set only by the `win-*` presets) replaces the partition / count / act / heal steps with a
sequence of events. With `failover` off nothing above changes (test `W-off`).

### Params (failover flow)

| Param | Values | Default |
|---|---|---|
| `nodes` | 2–5 (shared with the classic flow) | 3 |
| `ev2` … `ev5` | the event sequence for that node count (below) | `!B`, `!C`, `AB|CD`, `AB|CDE` |
| `wkind` | `none` / `disk` / `fileshare` / `cloud` | `fileshare` |
| `witnessAt` | shared: the witness is reached by the side of `A` (`first`) or of the last node | `first` (no control in this flow) |
| `votes` | `static` / `dynamic` (dynamic quorum and dynamic witness) / `dynamicA` (dynamic, A drops its vote in a tie) | `static` |

Events (`,` between events; `!X` node X fails, `W` the witness goes away, `AB|CD` the network splits):
2: `!B`, `A|B`, `W,!B`, `!A`; 3: `!C`, `AB|C`, `!C,!B`, `W,!C,!B`; 4: `AB|CD`, `W,AB|CD`, `!D,!C`, `!D,!C,!B`;
5: `AB|CDE`, `AB|CD|E`, `!E,!D`, `!E,!D,!C`. A `W` event is skipped when `wkind` is `none`.

### Rules (Windows)

- **W1.** A side keeps running only with **more than half of all assigned votes**: `needed = ⌊total/2⌋ + 1`, `total` = node
  votes + the witness's vote, failed members included (Microsoft Learn *Understanding cluster and pool quorum*,
  *Configure and manage quorum* *(check)*). Each node and the witness start with one vote. With **static** votes the
  total never changes.
- **W2.** The witness vote belongs to the side that reaches it: owns the witness disk (disk witness) or can lock the
  witness file (file share, cloud) *(check)*. The model's rule is the host's T3: the side of `A` (or of the last node);
  if that node has failed, the first up node's side. A witness that is gone gives its vote to nobody. The kind changes
  labels and the witness-lost sentence only (test `W2` runs all three).
- **W3.** Even node counts without a witness can split 50/50 and neither side has more than half (from W1).
- **W4.** **Dynamic quorum** (Windows Server 2012 and later *(check)*): after an event, if one side has quorum, every node
  outside it (failed, or cut off in a minority side) loses its vote. So a cluster that loses nodes one at a time runs
  down to one node ("last man standing"). Nothing is adjusted when no side has quorum.
- **W5.** **Dynamic witness** (2012 R2 and later *(check)*): with dynamic votes the witness has a vote only when the
  node votes are even, and none when it is gone or unreachable from the quorum side. It is evaluated at the start too.
- **W6.** **Tie-breaker** (2012 R2 *(check)*; the cluster property is `LowerQuorumPriorityNodeID` *(check)*): with dynamic
  votes, if the total is still even after W4–W5, one node of the quorum side gives up its vote in advance, so a 50/50
  split has a winner.
- **Roles** (host rule 2 with Windows words): the side with quorum keeps the clustered roles or they move to it; every
  other side stops them. A failed node takes the roles with it at once (host rule 8).

### Tie-breaks (Windows)

- **T6.** The node that gives up its vote in a tie (W6) is the **highest-id voting node** of the quorum side (`votes:
  'dynamic'`), or `A` when chosen and still voting (`votes: 'dynamicA'`, the property set to A). The task's tie-break:
  "highest id unless set".
- **T1** (host) holds: roles that move start on the lowest-id up node of the quorum side.
- **T7.** Order inside one step: event; recount (votes, quorum, roles); then, only with dynamic votes and only if it
  changes a vote, an **adjust** step (W4, then W5, then W6) with the sides recounted against the new total.
- Sides: live sides in partition order, then one card per failed node by id.

### Steps

0. Start: one side with every vote and the roles on `A`; with dynamic votes W5 and W6 have already run (4 nodes, no
   witness: `D` has no vote; 3 nodes + witness: the witness has none).
Then per event: **event** (the node fails / the network splits / the witness goes away; sides appear, not counted),
**recount**, and **adjust** when it changes something. 2 to 9 steps (all 384 combinations checked in `W-events`).

### Presets (numbers checked by a script before coding, asserted in `sim.test.js` `W-presets`)

| # | id | Params | Steps | Outcome |
|---|---|---|---|---|
| 7 | `win-2node-fsw` | 2 nodes, `!B`, file share, static | 2 | A + witness 2 of 3: roles stay on A |
| 8 | `win-2node-none` | 2 nodes, `A|B`, none, static | 2 | 1 of 2 each: both stop |
| 9 | `win-4node-split` | 4 nodes, `AB|CD`, disk, static | 2 | AB + witness 3 of 5: runs (witness off: 2 of 4 each, both stop) |
| 10 | `win-dynamic` | 3 nodes, `!C,!B`, file share, dynamic | 6 | start W 0 (total 3); C fails: AB 2/3; adjust C 0, W 1 (total 3); B fails: A + W 2/3; adjust B 0, W 0: A 1 of 1. Static: 3/4, then A + W 2 of 4: stop (4 steps) |
| 11 | `win-witness-lost` | 2 nodes, `W,!B`, file share, static | 4 | witness gone: 2 of 3, runs; B fails: 1 of 3, stop. Dynamic: adjust W 0 and B 0 (tie), then A 1 of 1 keeps running (5 steps); `dynamicA`: A 0 of 1, stop |

Other checked numbers: 4 nodes, no witness, dynamic: D has no vote from the start, `AB|CD` → AB 2 of 3 runs; with
`dynamicA` → CD 2 of 3, roles move to C. 2 nodes `!A` + witness → B + witness 2 of 3, roles move to B. 4 nodes
`!D,!C,!B` no witness: dynamic runs to A 1 of 1; static stops at C (2 of 4). 5 nodes `AB|CD|E` dynamic: no quorum, no
vote changes. Never two quorums, never more than one running copy.

## Out of scope

Consensus internals (`raft`), fencing mechanics (`fencing`), resource constraints and placement, timing. Dynamic quorum
and vote adjustment exist only in the Windows failover sequence above; two-node special modes of other stacks, node
weights set by hand, Cluster Shared Volumes, stretched clusters and forcing quorum are out of scope.
