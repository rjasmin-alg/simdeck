<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# quorum-split-brain: notes

New stepper (task `docs/tasks/w2/quorum-split-brain.md`, catalogue `ha-quorum-split-brain`, wave 2b). Kit view **K2**
(`Simdeck.topology`) draws the ring of nodes, the witness and the links; the page draws the side column (one card per
side) itself. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Partitions are concrete groupings of the ring**, one choice param per node count (`split2` … `split5`, only the
  one for the current count is shown), e.g. `AB | C`, `A | BC`, `A | B | C`, `AB | C pao`. A node letter on the page
  says more than "2|1", and it fixes which side holds the resource (it starts on `A`). A failed node (`!X`) is one of
  the options, so rule 8 is on the page, not only in the tests.
- **`witnessAt`** (`A` / the last node) is a param the task did not list: rule 4 says "the side that reaches it
  wins", so the student needs to choose that side. Visible only with the witness on.
- **`scene`** (`ha` / `win` / `ceph`) is a param without a control, set by the presets (as `stp`'s `topo`): catalogue
  §5.7 asks for a Linux HA preset, a Windows failover cluster with a witness, and Ceph monitors. The scene changes
  labels only (node noun, resource noun, witness noun, scene line above the drawing). In `ceph` the witness and the
  policy controls are hidden and the model forces them off / `stop` (Ceph cannot ignore its monitor quorum); the
  resource is the leader role, whose takeover rule (lowest id in quorum) is the monitors' own.
- **Steps**: partition, count, act, heal (4), plus one write step per running side when two or more run. The task's
  "summary" step is the heal: it is where the outcome is visible (the service ran all along / was down the whole
  partition and now restarts / the copies differ). `split-brain` has 6 steps as the task says; 5 nodes `ignore`
  `AB|CD|E` has 7 (three writers).
- **Data, not a shared disk**: the task's resource has "a shared disk", but its split-brain step needs "the copies
  differ", which only happens with replicated data. The service holds data `x` per side; the stage says "data", not
  "disk".
- **Heal keeps failed nodes down** (it heals the network); after a node failure (no link cut) the last step is a
  summary ("Na kraju" / "In the end") instead of "the network is whole again".
- **The witness outlives its node**: `witnessAt` only decides which side reaches it in a partition. When that node
  fails, no link is cut, so the witness answers the side still up (T3): two nodes and a witness survive losing either
  node.
- **"Changed"** marks side cards whose membership, counted state, quorum, running node or data changed; nodes whose
  service started or stopped, or that took a write, get the kit's changed mark too.
- **Fencing** (rule 7) is not modelled (preset task `fencing`). The takeover caption (a quorum side *starts* the
  service) adds "a real cluster first fences the lost node: quorum cannot stop a node that does not hear the
  decision", and the explanation's last paragraph says the same.
- **The witness is a diamond**: K2 has no diamond kind, so the page clips the witness card's mark to a diamond
  (`.sd-topo-card[data-id="W"]`). Its links are dashed by nature; cut ones carry the kit's cross.
- **No-quorum frame**: the side card is hatched only in a band around a plain inner panel, so the text stays clean;
  plus a dashed border and a red dashed "bez kvoruma" chip. Quorum: thick solid border and a filled "kvorum" chip.
  Both survive grayscale.
- **Concepts, not tools**: Pacemaker and Corosync (NLA T52), Windows failover clustering (WIN2, Windows Server
  feature), Ceph (NLA T26) are named only in the scene line and preset names, as the catalogue's three presets ask.
  No commands, no configuration.
- **Panel fit**: six presets in two columns with short labels (`Tri: 2 | 1`); "Rascjep mozga" wraps on two lines in
  its button, which is legible and kept.

## Deviations from the task

- Params added: `witnessAt`, `scene` (Decisions); `split` is one param per node count.
- State: as the task's, plus `phase`, `split`, `total`, `cut`, `splitBrain`, `changed`, `diverged`, and per side
  `{ votes, total, needed, quorum, witness, counted, act, node, running, value }` (the task derived `sides`; here they
  are stored per step so the heal can merge them). `writes` is `[{ side, node, value }]`.
- The summary step is the heal (Decisions). `ceph-mons` isolates every monitor (`A | B | C`); "one host isolated"
  (2 of 3) is one click away (`AB | C`), named in the preset's hint.
- Resource: data instead of a shared disk (Decisions).

## Sources

- cephsim `js/engine/net.js` "quorum": `needed = Math.floor(monHosts.length / 2) + 1`, "A majority of *configured*
  mons must be mutually reachable, or the cluster stops serving entirely"; `health.js` messages ("monitors have lost
  quorum: k of n can see each other, m needed"). Read on this machine.
- faultline `js/engine/graph.js` `GATES.quorum` ("a majority of", `Math.floor(n / 2) + 1`); `PEDAGOGY.md` §1 ("kill
  one of three; partition 2/1 …; add a fourth node and discover it made things worse; add a fifth"). Read.
- NLA `meta/toc.md` T52 „Grozd — Pacemaker i Corosync, resursi, ograničenja", T53 „Ograđivanje (fencing) — zašto
  grozd bez njega nije grozd" (chapters not written). Read.
- votequorum(5) (expected votes, quorum = more than half; `two_node`, `wait_for_all` out of scope) *(check: from
  memory, not available offline)*.
- ClusterLabs "Pacemaker Explained", `no-quorum-policy` (`stop` default, `ignore`) *(check: from memory)*.
- Microsoft Learn "Understanding cluster and pool quorum" (witness types, node and file-share majority; dynamic
  quorum and dynamic witness out of scope) *(check: title and details from memory)*.

## Checks

- Numbers printed by a script from the model before the page was written (the six presets and nine other
  combinations; the maximum over all 360 param combinations is 7 steps; never two quorums), asserted in `sim.test.js`.
- **Mutations**: 33 one-at-a-time mutations of `sim.js` (needed = half, `>` for `≥`, total from live votes, failed
  nodes voting, witness ignored / given to every side / dying with its node, `witnessAt` ignored, the heal's witness
  lost or at the last node, the heal bringing back links to a failed node, `splitBrain` with one copy, a failed side
  still running, failed cards at the heal uncounted or losing their action, start on the
  highest id, ignore treated as stop, no-quorum side keeping, quorum side not starting, lost treated as off, a failed
  node still running, no write steps, writes for a single writer, write values reversed, no divergence at the heal, no
  restart at the heal, the heal restoring failed nodes, dead links counted as cut, ceph allowing ignore or a witness,
  a closed ring for two nodes, changed ignoring the running node, split order reversed): all **33** fail a test.
- `npm run gate -- quorum-split-brain`: pass (manifest, tests, build, 62 browser checks, tokens, scope). Screenshots at
  1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed; plus every preset at its key steps with a local
  Playwright script. Fixed from them: the panel scrolling (two-column presets, short legend), the hatch hidden by a
  `background` shorthand, cards stretched to the row height, the witness name wrapping letter by letter (span 4,
  `max-content`), hatch under the side text (hatched frame), "x = 0" data in the Ceph scene (hidden there).

- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page; it enumerated every
  combination, confirmed every SPEC number and ran its own mutations). Fixed from it: the witness dying with its node
  (T3 was wrong: a failed node cuts no link, so two nodes and a witness now survive losing either node); "has
  quorum" in the act caption when quorum is ignored on a single live side (`aKeepIgn`, `aStartIgn`); the Ceph
  resource ("leader role (maps)", not "(I/O)": clients talk to the OSDs) and no fencing sentence for monitors; heal
  captions after a node failure (`capHeal*F`, a summary); "the other" where there can be several sides or copies;
  `capFour` and `capHealTwo` naming "the service" in every scene; Croatian genitive after negation ("nema
  kvoruma"), the start caption's "više od pola od 3 glasa", the „pao“ quotes; five uncaught mutations (tests added).

## Term pairs

None of these is in `kit/glossary.js`; the Croatian explanation writes the term rule out by hand
(`<i lang="en">quorum</i> (kvorum)`), captions use the Croatian words. The four-node caption gives the term as COMMON.md §4 orders it,
„*quorum* (kvorum)"; the task file wrote „kvorum (*quorum*)". For the coordinator to add with `"src": "simdeck"`:

| en | hr | source |
|---|---|---|
| quorum | kvorum | task |
| split-brain | rascjep mozga | task *(check)* |
| witness | svjedok | task |
| vote | glas | task |
| network partition | razdvajanje mreže | task |
| cluster | grozd | NLA T52 |
| resource | resurs | task (the page says "usluga", service) |
| fencing | ograđivanje | NLA T53 |

## Shared requests

- K2 (`topology.js`): a `witness`/`arbiter` node kind (a small diamond, vote only), or a `className` per node so a
  page can style one card without `[data-id]`. Consumers: this page, `win-failover-cluster`, `raft` (a learner),
  `vrrp-failover`.
- K2: an `align: 'center'` default for cards in a row with a `1fr` track; this page sets `align` on every node.

## Time

Start 2026-10-15 12:07, done 12:50 (CEST): about 45 minutes, one session, including the fresh review.

## Preset task `win-failover-cluster` (Windows failover cluster quorum)

Task `docs/tasks/w3/win-failover-cluster.md`, thread t-0257. Five presets (`win-2node-fsw`, `win-2node-none`,
`win-4node-split`, `win-dynamic`, `win-witness-lost`), rules and numbers in `SPEC.md` "Windows failover sequence".

### Decisions

- **The host model could not express it, so it was extended additively** (as the `win-boot` and `win-update-rings`
  preset tasks did with their hosts). The task says "write the change under Shared requests and stop"; running
  unattended, with the host's author long done and the change contained, I made it instead. What was missing: a
  sequence of events (two of the five presets fail two members one after the other), a witness that can go away, and
  per-member votes that change (dynamic quorum, dynamic witness, the tie-breaker). The new flow is opt-in (`failover`,
  off by default): `initial`, `step` and `steps` hand over to it only when it is set, and every classic result is
  unchanged (test `W-off`; the 35 tests include all the host's).
- **Steps**: per event an event step, a recount step, and an adjust step only when dynamic votes change something. The
  task's "2–5 steps per preset" holds for four presets; `win-dynamic` has 6 (two failures, each with its recount and
  its adjustment). Folding the adjustment into the recount would show "3 of 4, quorum" next to badges already at the new
  votes.
- **Comparisons are one control away**, not separate presets: `win-4node-split` has the disk witness on (3 of 5); the
  witness switched off gives the task's 2 : 2 caption. `win-dynamic` starts dynamic (A runs to the end); static stops at
  2 of 4. `win-witness-lost` starts static (stops at 1 of 3); dynamic keeps A running; "dynamic, A drops its vote first"
  stops it again. Each hint (tooltip) says which switch.
- **One `votes` select** (static / dynamic / dynamic with A dropping its vote first) instead of a dynamic toggle plus a
  tie-break choice: the panel had no room for both at 1920×1080 (it overflowed by 50–67 px).
- **No "witness sits with" control in this flow**: with it the panel overflowed again (52 px). The witness is reached by
  A's side (where the roles start); the param still works (URL, tests) and the classic flow keeps its control.
- **Node names stay A–E** (the host's), not N1…N4 as the task writes: the same page, the same letters in both flows.
- **Witness kinds** change labels and the witness-lost sentence; the model treats all three alike (rule W2: whoever
  reaches it). "Owns the disk" / "locks the witness file" is said in the caption at a cut.
- **Captions** follow the task's two examples ("Side A + witness has 2 of 3 votes: a majority, the roles stay on A";
  "A 2 : 2 split with no witness: nobody has more than half, the cluster stops on both sides"). With static votes and a
  lost majority the caption adds that failed members still count in the total (the "static" misconception).
- **Misconceptions** shown: two nodes without a witness do not survive one cut link (`win-2node-none`); the witness holds
  no data (explanation); more nodes are not safer when even (the 2 : 2 split).
- **Explanation**: one paragraph added for Windows (witness kinds, dynamic quorum, dynamic witness, tie-breaker).
- **Entries**: `win-2node-fsw` and `win-dynamic` (the two a WIN2 course would name).
- **Concepts, not tools**: no PowerShell, no property names on the page; `LowerQuorumPriorityNodeID` is only in
  `SPEC.md`. "Windows failover cluster" is named because the WIN2 course teaches it.

### Deviations from the task

- Host model changed (additive, see Decisions) instead of stopping with a shared request.
- Node ids A–E instead of N1–N4; `win-dynamic` has 6 steps; no witness-side control in this flow.
- The task's state sketch (`partitions`, `rolesOn`, `reachableFrom`) is carried as the host's `sides`,
  `resource.runningOn` and `witness.reach`, plus `groups`, `ev`, `adjust`, `lost`, `stopped`.
- Dynamic quorum also removes the votes of nodes cut off in a minority side (they are gone from the quorum side's view);
  the task only speaks of failed nodes. *(check)*

### Sources and unchecked items

No local course material on Windows clustering (NLA T52–T53 are the Linux counterpart, chapters not written). From
memory of Microsoft Learn, not readable offline; all *(check)*:

- *Understanding cluster and pool quorum* / *Configure and manage quorum*: majority of votes, one vote per node and one
  for the witness; witness types disk, file share, cloud *(check titles and wording)*.
- Dynamic quorum from Windows Server 2012; dynamic witness from 2012 R2 (the witness votes only when node votes are
  even) *(check)*.
- The tie-breaker for a 50 % split (2012 R2), property `LowerQuorumPriorityNodeID`; which node loses its vote when unset
  (the model: the highest id, as the task decides) *(check)*.
- A disk witness belongs to the side that owns (reserves) the disk; a file share or cloud witness to the side that
  locks the witness file *(check)*.
- After the witness is lost in a two-node cluster with dynamic quorum, one node's vote is removed (`win-witness-lost`
  dynamic) *(check)*.
- Minority-side nodes losing their votes after a split (Deviations) *(check)*.

### Checks

- Numbers printed by a Python script (independent of `sim.js`) before coding; asserted in `sim.test.js` (`W-*` tests).
- **Mutations** of the new code, one at a time (19): tie picks the lowest node, tie ignores the A choice (twice: in the
  adjustment and in reading `votes`), no removal of
  outside votes, dynamic witness inverted, no tie-breaker, static total counting only live nodes, a lost witness still
  reached, reach ignoring `witnessAt`, `>` for `≥`, roles starting on the highest node, an adjust step every time, the
  witness vote to every side, dynamic always on, no adjustment at the start, roles not lost with their node, a
  no-quorum side keeping the roles: **17 caught**. Two are equivalent within the offered events: adjusting when stopped
  (`stopped` is exactly "no side has quorum") and dynamic witness ignoring reach (no offered sequence leaves an up
  witness unreachable from a quorum side with even node votes).
- `npm run gate -- quorum-split-brain`: pass. Every Windows preset at every step, both languages, plus the
  static/dynamic and witness-off variants, shot at 1920×1080 with a local Playwright script: panel, stage and page fit,
  console clean; dark and 375×812 (no sideways scroll) reviewed. Fixed from them: preset labels wrapping beside their key badges
  (shortened), the panel overflowing (one `votes` select, no witness-side control), failed-node cards marked "changed"
  when only the total changed, and a lost witness drawn with cut links (now dead links).

### Term pairs (failover flow)

Written out by hand in the explanation; for the coordinator to add with `"src": "simdeck"`:

| en | hr | source |
|---|---|---|
| dynamic quorum | dinamički kvorum | this task *(check)* |
| dynamic witness | dinamički svjedok | this task *(check)* |
| disk witness | diskovni svjedok | this task *(check)* |
| file share witness | svjedok (dijeljena mapa) | host page *(check)* |
| cloud witness | svjedok u oblaku | this task *(check)* |
| failover cluster | grozd s prebacivanjem | task *(check)*; the page says "Windows grozd" |
| clustered role | uloga grozda | host page |

### Shared requests (failover flow)

- K2 (`topology.js`): a vote badge kind (or a per-node `votes` field) would save every quorum page its own badge text.
- None blocking.

### Time

Start 2026-11-04 20:27, done 20:50 (CET): about 25 minutes, one session (no separate fresh review: a preset task; the
mutations and the script check stand in for it).
