<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# stp: notes

New stepper (task `docs/tasks/w2/stp.md`, catalogue `net-stp`, §4.1 and §5.10, wave 2b) on kit view K2
(`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Stage.** Left: the K2 drawing (triangle of switch cards, hosts H1 and H3, link-end labels `p1 R`, BPDUs as
  chips beside the links, ⟨root, cost, sender, sender port⟩). Right: the time box (t, seconds since the cut, the
  three timers) and one block per switch: its BID, what it believes (root, cost, root port), and one row per port
  with role badge, state and stored BPDU (with its age, or "own" on a designated port).
- **Time model.** 1 s ticks, hellos every 2 s; a step is the next tick that changes something, plus the hello right
  after a change by BPDUs ("nothing changes: the tree is done"). Then one broadcast over the finished tree as the
  last step, so every STP preset ends by showing that the loop is cut (the copy towards the blocked port is
  discarded). SPEC.md "One step".
- **Ports go listening as soon as they are selected** (802.1D), so listening overlaps the BPDU rounds: claims at
  t = 0 s, learning at 15 s, forwarding at 30 s. S3 p2 is listening after the claims and goes back to blocking at
  t = 2 s.
- **Cut at t = 40 s**, right after that second's hello, so the stored BPDU on S3 p2 is fresh when the link goes and
  ages out exactly 20 s later (the task's "t = 20 s"). The page shows "since the cut".
- **Relay.** A non-root switch relays only when its root port heard the root at the previous hello; one hop per
  hello in this model (real bridges relay at once). Nothing in the three-switch scenes depends on that delay; a
  chain test pins it.
- **Ignored BPDUs** (inferior, 802.1D "supersedes") end in a cross at the receiver; the stable step after the cut
  says how old the stored one is.
- **"Root" badge**: `★ root` (filled) on the switch with the lowest BID once the claims are out; `thinks: root`
  (dashed) on any other switch that believes it is root (all of them at power-on, S2 after the cut).
- **Params.** `prioS1`–`prioS3` sit in one row of the panel (page CSS on the controls grid) so the panel fits at
  1920×1080; params that do nothing in the current set-up (priorities and cut with STP off, S3's priority, the cut
  and the slow link in the pair) are hidden (`visible`), not disabled, for the same reason. Every param resets to
  step 0 (each changes the run).
- **Extra param `topo`** (triangle / pair), set only by the presets (no control: the panel must fit at 1920×1080); the task's preset 5 needs the second topology.
- **Names on BPDUs**: S1, S2, S3 stand for the full BID on the chips and in the table (the explanation says so);
  the switch card and the block header show the BID `32768.…:01`.
- **Host ports** take part in STP (designated, they go through listening and learning) but receive no BPDU drawing.

## Deviations from the task

- **Step counts**: `triangle`/`priority`/`cost-wins` 6, not 7 (claims, round, stable, learning, forwarding,
  broadcast; listening starts with the claims, see above); `port-id` 5; `reconverge` 12, not 13. All derived from
  the timer rules; sim.json `steps` is 6.
- **`no-stp` counts**: with one host per end switch the in-flight count runs 1, 2, 3, 3, 4, 3 (the two circling
  copies plus the copies to the hosts, including H1 getting its own broadcast back). The task's "two copies circle
  in opposite directions" holds for the inter-switch links.
- **Port-id preset** has hosts H1 on S1 and H2 on S2 (there is no S3).
- **Parallel links** are drawn through two segment cards (L1, L2): K2 joins two cards with one line only.
- **`cutLink`** applies at t = 40 s, not "next step": the model replays from step 0 for every params change (kit
  contract), so a cut must be a fixed point in the run.
- **No "changed" mark on the BPDU chip** that caused a change: the K2 chip takes only text and a colour. The table
  cell of the stored BPDU it changed is marked instead, and the caption names it.

## Shared requests (kit view K2)

- **Parallel links** between the same two nodes (`linkBetween` returns the first only): an `offset` per link, or a
  packet `link` id to pick the link. Workaround: segment cloud cards.
- **Styled link-end labels**: `ends: { a: { text, k } }` so a role label can be solid / outlined / hatched like the
  legend. Workaround: the side table carries the styled badges, the ends carry `p1 R` as text.
- **A mark on a packet chip** (`changed: true`) for the BPDU that caused this step's change.

## Model for later presets (`broadcast-storm`)

The engine is promotable: `sceneOf`, `arrive`, `stepFlood`, `floodTree` and the STP functions take plain data and no
strings. The flood supports any scene: more than two inter-switch ports per switch (copies multiply: tested on a
four-switch mesh), a `router` node that absorbs broadcasts, and a loop-free tree (the flood ends). A preset task adds
a `topo` value to `sceneOf` and a layout in `index.html` `layoutOf`. If `storm` lands it replaces `no-stp` (task).

## Term pairs (added to kit/glossary.js with "src": "simdeck" on the owner's request, 2026-10-05; the page still writes them out)

| en | hr |
|---|---|
| spanning tree protocol | protokol razapinjućeg stabla *(check: URM has no term)* |
| root bridge | korijenski most |
| bridge ID | identifikator mosta |
| root port | korijenski priključak |
| designated port | određeni priključak |
| blocking | blokiranje |
| listening / learning / forwarding | osluškivanje / učenje / prosljeđivanje *(check)*; listening was already in the glossary (uvod-u-linux) |
| path cost | trošak puta |
| broadcast storm | *broadcast* oluja (URM ch07) |

## Sources

- URM `book/chapters/07-podatkovni-sloj.md` "Ethernet u preklopljenoj mreži", the broadcast oluja paragraph
  (line 183–187): rule 9 only. The book has no STP text; the catalogue seed "URM ch07" is wrong for STP itself.
- NLA `meta/toc.md` T06 "VLAN-ovi, mostovi i udruživanje sučelja": topic named; `stp_state` is not in the toc.
- IEEE 802.1D-1998 clause 8, 802.1D-2004 clause 17, 802.1Q-2018 clause 13 (from the task file, not available
  offline): rules 2, 4, 7 and 8 are *(check)* for a reviewer with the standard, in particular the 8.6.2 supersedes
  rule (a worse BPDU from the same designated port is ignored until max age) and the relay rule.
- Every expected number in SPEC.md is asserted in `sim.test.js`.

## Checks

- **Mutation run** (each rule broken once in `sim.js`, tests run): 20 mutations; all caught except "a router
  floods", which is equivalent (a router has no switch ports, so nothing can leave it either way). Flooding back out
  of the arrival port makes the flood endless; the test run times out on it, which counts as caught.
- **Fresh review** (a separate agent read the diff against this SPEC and broke rules on purpose): no model defects.
  Fixed from it: the confirming hello after a cut said "the tree is done" while S3 still waited for max age (now
  "nothing changes, but the tree is not done yet"); the max-age caption always said "the blocked port becomes
  designated", false with cut S1–S2 plus the slow link (S3's aged port is its root port, and its blocked p1 becomes
  the root port): the caption now names each port's new role. Two test gaps closed (own-port tie-break, designated
  compare by cost and by port ID). The ageing shortcut and the stricter receive check are now in SPEC.md.

## Time

Start 08:40, done 09:35 (one session, about 55 min).
