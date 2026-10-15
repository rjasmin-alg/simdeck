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
