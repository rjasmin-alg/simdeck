<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# bgp-path-selection: notes

New stepper (task `docs/tasks/w2/bgp-path-selection.md`, catalogue `inet-bgp-path-selection`, §4.2 and §5.11,
wave 2b) on kit view K2 (`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Stage.** Left: the K2 drawing, five AS cards (router shape, series colour, letter mark, ASN; O also the prefix),
  the six links, the announcements of this round as chips beside the links with the AS path written on them.
  Right: the round, then one block per AS: its ASN and router ID, the rule that decided ("shorter AS path
  decides"), and one row per stored path (neighbour, AS path, LP) with the best starred. Paths removed this step
  stay one step as struck rows ("removed"), so a withdrawal, a looped replacement or a failed link shows in the
  table too.
- **Router IDs.** A 192.0.2.1 and B 192.0.2.2 are the task's. O 192.0.2.3, C 192.0.2.4, D 192.0.2.5 are mine: O
  below C, so that at `prependOtoB` 2 B keeps its direct (three-ASN) path over C's equally long one and the preset is
  only about D. At 3 B moves to C too (shown by the param sweep in SPEC.md).
- **Sending back to the source.** An AS sends its best to every neighbour, including the one it learned it from
  (RFC 4271 allows it; the receiver's loop check drops it). That is what makes rule 2 visible in every preset. The
  dropped message still replaces what that neighbour sent before (RFC 4271 §9), so a stale path disappears: tested,
  and shown in the caption ("That also deletes the old path …").
- **Link failure after convergence.** `failLink` takes effect in the first step in which nobody has anything to
  send, not at a fixed round: the step reads "converged; now the link fails". For the defaults that is round 4,
  as the task says; with `local-pref` it is round 5.
- **`watch` param** (C or D, default D): which AS's best path is drawn thick and which AS the caption explains. It
  does not change the run (tested). Preset `router-id-tie` has the same model params as `shortest-path` and differs
  only by watching C, where the tie happens. The caption explains the watched AS when its best changed, else the
  first AS whose best changed, else the watched AS if it heard something.
- **Caption length.** A round can have a lot to say (lead, a loop drop, LP not sent, the decision). The lead, the
  LOCAL_PREF sentence and the decision always appear; the loop sentence and the closing sentences ("its best
  changed …", "best path also changed at …") only while the caption stays under 300 characters, which keeps every
  step of every preset within three lines at 1920×1080 in both languages (checked by a sweep of all 66 steps).
- **Names.** Captions name the explained AS by its ASN (as the task's caption does: "AS64500 has two paths …") and
  neighbours by letter, as on the cards and tables.
- **Withdrawal chip** uses K2's `cast: 'broadcast'` for the dashed arrow (K2 has no other dashed packet style); the
  chip says "✕ withdraw".

## Deviations from the task

- **Withdrawal never happens in the task's link-failure preset.** When O–B fails, B already holds C's path
  [64499 64497 64496] (C announced it in round 3) and switches to it at once; it sends the new path, not a
  withdrawal, and "relearning via C or D" does not happen. That follows from rules 2–7 and RFC 4271 (the Adj-RIB-In
  keeps the alternative). The preset keeps the task's D outcome (D falls back to [64499 64497 64496] via C).
- **Param `failLink` (none / O–B / O–A) instead of the toggle `linkOB`,** and a **sixth preset `withdrawal`**
  (O–A fails). Without it no param combination ever produces a withdrawal, so rule 7's withdrawal and the legend's
  dashed arrow would never appear. With O–A down, A has nothing left (C's path held 64497 and was dropped), withdraws
  to C, C falls back to B, and A relearns the prefix via C: the story the task's link-failure text describes.
- **Param `watch`** (not in the task) for preset 3, see above.
- **Step counts:** `local-pref` 5 (task 4) and `prepending` 5 (task 4): D's change in round 3 must still reach B and
  C in round 4 before a round with nothing to send. `shortest-path` 4, `router-id-tie` 4 and `link-failure` 7 as
  the task says; `withdrawal` 8. sim.json `steps` is 4.
- **Link failure timing:** "at round 4" became "once converged" (round 4 for the defaults), see Decisions.

## Shared requests (kit view K2)

- **A dashed packet style that is not a broadcast** (`style: 'dashed'` on a packet) for withdrawals. Workaround:
  `cast: 'broadcast'`, which only dashes the arrow.
- **Monospace chips** as an option: paths read better in the mono font. Workaround: page CSS on `.sd-topo-chip`.

## Model for later sims (`bgp-hijack`, `peering-transit`)

The engine is promotable: `decide`, `cmpPath`, `round`, `fail`, `initialOf`, `stepOf` take a plain scene (`ases`
with asn and routerId, `links`, `lp`, `prepend`, `fail`) and hold no strings. `bgp-hijack` needs a second prefix and
longest-prefix forwarding (rule 8): a `prefix` per route and a lookup on top; `peering-transit` needs export policy
(which neighbours a route goes to), which would be a filter in `round` where the messages are built.

## Term pairs (not in `kit/glossary.js`; written out in the explanation until added)

| English | Croatian | Source |
|---|---|---|
| autonomous system | autonomni sustav | URM ch11 ("autonomni sustav je skup usmjernika pod jednom tehničkom upravom") |
| AS path | AS put | task *(check)* |
| local preference | lokalna prednost | task *(check)* |
| announcement | najava | task *(check)* |
| withdrawal | povlačenje | task *(check)* |
| path selection | odabir puta | task |
| router ID | identifikator usmjernika (ID usmjernika in labels) | task *(check)* |
| prepending | produljivanje AS puta | mine *(check)* |

*network prefix* (mrežni prefiks) is in the glossary and used as `[[network prefix]]` in the explanation.

## Sources

- RFC 4271, read offline (`~/projects/uvod-u-racunalne-mreze/references/chapter-11/rfc4271.txt`): §1, §5.1.2,
  §5.1.5, §8.2.2, §9, §9.1.1, §9.1.2, §9.1.2.2 a–g, §9.2. Each rule in SPEC.md quotes the sentence it rests on.
- URM `book/chapters/11-usmjeravanje.md`: "Dinamičko usmjeravanje" (BGP, the AS definition) and Primjer 2 (longest
  prefix match, rule 8, explanation only).
- NLA `meta/toc.md` T10 "BGP koliko treba sistemašu": topic only, no chapter.
- RFC 5398 and RFC 5737 (documentation ASNs and prefixes): from the task file *(check: not reread)*.
- Every expected number in SPEC.md is asserted in `sim.test.js`.

## Checks

- **Mutation run** (each rule broken once in `sim.js`, tests run): 21 mutations (LP order and LP ignored, length
  order and ignored, router ID reversed, compared as text and before length, no prepend, prepend ignored, no loop
  check, loop keeps the old entry, LP taken from the sender, LP looked up on the sender's side, withdrawal ignored,
  no withdrawal sent, failed link keeps routes, failure before convergence, sending over a down link, everyone
  sends every round, change detection ignoring the path, not sending back to the source), plus 5 from the review
  below (a long path treated as a loop, D dropping C after a failure, `pathIds` without dedup of prepends, O's
  local route reported as "only path", a failed link forgotten at one end only). All 26 caught.
- **Fresh review** (a separate agent read the diff against SPEC.md and RFC 4271, hand-traced `link-failure` and
  `withdrawal`, ran all 24 param combinations and its own mutations): no model defects. Fixed from it: tests now
  check the converse at convergence (every neighbour's current, loop-free announcement is stored), `pathIds` with
  prepending, `by: 'local'`, and a failure of a link between two non-origin ASes; SPEC's rule 7 now cites §9.2 (not
  §9.1.3) and rule 3 also §9.1.2; the step bound reads ≤ 20 tested, 11 at most; the withdrawal preset's `watch` C is
  in the table; the explanation says the AS-path length counts AS numbers (a prepended one counts each time); the
  withdrawal caption has a variant for a receiver left with nothing (not reachable from the page's params).
- **Caption sweep:** all 66 steps (6 presets, both languages) at 1920×1080: no caption over three lines, no console
  error. Found and fixed: the router-ID sentence claimed equal length for all of C's three paths in round 3 (now it
  names only the tied two).
- **Gate:** `npm run gate -- bgp-path-selection` passes; screenshots (1920×1080 light, dark, grayscale; 375×812; hr
  and en) reviewed, plus round 3, the failure, the withdrawal and convergence steps of each preset.

## Time

Start 12:54, done 13:30 (one session, about 35 min of work plus the review).
