<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# consistent-hashing: notes

New explorer (task `docs/tasks/w3/consistent-hashing.md`, catalogue `ha-consistent-hashing`, wave 3). Rules and
expected numbers: `SPEC.md`.

## Decisions

- **Hash: FNV-1a 32-bit plus MurmurHash3's `fmix32` finaliser.** The task suggests FNV-1a. A check script over four
  naming schemes showed plain FNV-1a clusters badly on sequential names (`key-0`, `key-1`, …; `A-0`, `A-1`, …): with 4
  nodes and one point each one node got 785 of 1000 keys, and with 100 points per node only 121 keys moved for 4 → 5
  instead of about 200; `hash mod 4` gave exactly 250 per node, a sign of a weak low-bit spread. The finaliser fixes
  both; the page's explanation names the hash (it is the subject, not a tool).
- **Names** `key-<i>` and `<letter>-<j>`: of the four naming schemes tried with the finaliser, this one gives the
  100-point numbers closest to the task's (225 moved vs 221; loads 165–225 after vs 168–223). The one-point numbers
  differ from the task's (234 moved vs 80) for any naming: with one point the result depends on where the single new
  point lands (68 … 750 across the names tried), which is the lesson of the preset. The page's caption is computed,
  so it states the numbers it shows.
- **`from` as a visible param.** The task wants "keys moved by the last change" in a pure state. The change is
  `from → nodes`: the add/remove buttons set `from` to the old count, and both counts are sliders, so any comparison
  (e.g. 4 → 7) is one URL. `from = nodes` means no change yet.
- **Nodes are always A … the n-th letter.** Removing takes away the last node, so 5 → 4 removes E. Removing a chosen
  node would change nothing on the ring rule and is not needed for mod n (any removal changes n).
- **Ideal box** shows |b − a| / max(a, b); before any change it shows the ideal for the next "add node", not 0/4.
- **Presets 1 and 2 have the same params** (4 → 5, one point), as the task lists them; the caption tells them apart
  (1: why mod n moves 4/5 of the keys, the residues; 2: the uneven arcs).
- **10 nodes, 8 series colours:** I and J reuse c1 and c2; the letter on every dot, chip and bar tells them apart.
- **Removed nodes** are dashed and muted, not struck through: a struck D reads as the Croatian letter Đ.
- **Letters on the ring:** the node point is a lettered dot; arcs ≥ 0.33 rad get a letter in the band; virtual points
  get a letter outside the ring only where it is at least 0.13 rad from the last one placed (including across the top),
  so with 100 points the colours of the band carry most of the identity and the load bars beside the ring carry the
  numbers. In grayscale the letters, the hatch and the outline still read.
- **Moved keys** on the ring are longer ticks, highlighted and outlined in ink; with 100s of them they merge into
  highlighted runs, which is exactly the arcs taken over.
- **Refused presses** (add at 10, remove at 2) keep focus (the kit's buttons never take it) and put "At most 10 nodes."
  before the caption until the params change (COMMON.md §11).
- **Keys `+` and `−`** for the buttons (free in the kit; `-` on the keyboard).
- **Concepts, not tools:** no product is named on the page. CRUSH and Ceph appear only in `related` and in Sources.

## Deviations from the task

- Preset numbers regenerated with the sim's hash (the task asked for it): 805 (task 797), 234 (task 80), 225 (task 221),
  remove 225. One-point loads before: 108 / 279 / 92 / 521 (task 352 / 311 / 232 / 105).
- The en caption of `ring-add-1vnode` ("took 80 keys, but node C was already carrying only 105") is regenerated as
  "the arcs are uneven, D carries 521 keys and B only 45" (loads after the change; B lost 234 to E).
- `remove-node` uses 100 points per node, so the removed node's keys visibly spread over all four (73 / 72 / 41 / 39);
  the task did not fix the point count.
- An extra param `from` (Decisions).

## Sources

- cephsim `js/engine/hash.js` (`stableMod`, `bmaskFor`) and `js/engine/pgmap.js` (`pgToPps`) in
  `~/projects/cephsim`: read. They are the contrast case named by the task (Ceph's power-of-two-friendly modulo, why
  raising `pgp_num` moves data); this page does not use them (CRUSH is out of scope). `js/samples.js` was not needed.
- FNV-1a: G. Fowler, L. C. Noll, K.-P. Vo, the FNV hash (offset basis and prime, reference values in `sim.test.js`)
  *(check: from memory, no network; the test vectors `"a"` and `"foobar"` match the published list as remembered)*.
- MurmurHash3 `fmix32` (A. Appleby) *(check: constants from memory)*.
- D. Karger, E. Lehman, T. Leighton, R. Panigrahy, M. Levine, D. Lewin, "Consistent Hashing and Random Trees", STOC
  1997 (the ring rule) *(check)*.
- G. DeCandia et al., "Dynamo: Amazon's Highly Available Key-value Store", SOSP 2007 (virtual nodes) *(check)*.
- Numbers: a check script (keys, names, both schemes, all counts 2–10 for 1, 10, 100 points), its results in
  `SPEC.md`; `sim.test.js` pins the presets.

## Term pairs

Missing from `kit/glossary.js`, written out in `strings.js` (hr: English in italics, Croatian in parentheses):

- consistent hashing — dosljedno raspršivanje (task: *(check)*)
- virtual node — virtualni čvor
- hash — sažetak (the glossary has *hashing* — raspršivanje)
- rebalancing — preraspodjela (used only in `aliases`)

`ring` — prsten is in the glossary and used as `[[ring]]`.

## Shared requests

None. The page draws the ring itself (no kit view covers a circle); if a second sim needs a hash ring, the drawing
(`ringSvg`, `ringLabels` in `index.html`) and the model's ring functions (`ringPoints`, `successor`, `ringOwner`, pure)
are ready to promote.

## Checks

- `node --test sims/consistent-hashing/sim.test.js`: 30 tests; each rule broken once (tie-break order, key on a point,
  wrap, the hash prime, mod n, ignoring vnodes, a ring that reshuffles with n, the ideal, the extremes tie) and seen to
  fail.
- Fresh review (a separate agent, no shared context): read the diff against `SPEC.md`, checked every number and the
  add/remove invariants over all 243 (vnodes, from, nodes) combinations, ran 40 mutations on a mirror copy. Fixed from
  it: the refusal message came back when the params returned to the refused values; Croatian nouns after computed
  numbers were a fixed "ključeva" (now plural forms, e.g. "521 ključ"); the aria labels' plurals; *hash* in italics in
  the hr caption; "move again" dropped from the remove caption. Two surviving mutations got tests (`change` refusing a
  step early; `before.points`). Not acted on: `Math.floor` vs `Math.round` in clamping (the kit snaps sliders).
- `npm run gate -- consistent-hashing --shots …`: pass. Screenshots reviewed: default/entry, all four presets, 7 → 10
  with 10 points, 6 → 2 with 100 points, hr and en, light, dark, grayscale, 375×812.

## Time

Start 2026-11-05 09:01; first gate pass about 09:10; review fixes and done 09:20 (about 20 minutes, one session).
