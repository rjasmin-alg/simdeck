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

## Out of scope

Consensus internals (`raft`), dynamic quorum and vote adjustment (including two-node special modes), fencing
mechanics (`fencing`), resource constraints and placement, timing.
