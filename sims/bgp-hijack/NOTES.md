<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# bgp-hijack: notes

New stepper (task `docs/tasks/w3/bgp-hijack.md`, catalogue `inet-bgp-hijack`, §4.2, wave 3) on kit view K2
(`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Model reused by copy.** `models/` has no BGP model yet, so the decision functions (`ridNum`, `cmpPath`,
  `decidedBy`, `decide`, `pathOut`) are copied unchanged from `sims/bgp-path-selection/sim.js @ 969c181`
  (COMMON.md §6). `round`, `rerun` and the state are adapted: every route carries a prefix, the Adj-RIB-In is keyed by
  neighbour and prefix, and senders send the prefixes whose best changed. Not promoted, not edited: see "Shared
  requests".
- **Topology (mine, derived).** Eight ASes, nine links: O–A, O–B, A–C, B–C, C–D, A–E, B–F, E–X, F–X. Chosen so that
  with the same /24, exactly E and F (and X) are strictly closer to X, and the other five to O, as the task's
  "three … five stay correct" says (counting O and X). Drawn top to bottom, O | A C B | E D F | X: in this order the
  links between neighbours are vertical or long, so chips fit between the cards at 1920×1080.
- **Hijack presets start converged.** With a conflict, step 0 is the legitimate /24 already spread everywhere (the
  same rounds, run in `initial`), and X starts announcing in round 1. The student sees a working Internet first, and
  the "changed" marks then show exactly the ASes the hijack captures. `normal` alone starts from O's local route and
  shows the spread.
- **"Half" deployment** is O, B, C and F (4 of 8). Chosen so that a validating AS (C) is still drawn to X through a
  non-validating neighbour (A), the task's rov-half story; F next to X validates, E does not.
- **Where the traffic ends** is followed hop by hop (state `fwd.dest`, `fwd.hops`), not just the AS's own next hop.
  That is what makes the rov-half point visible (C's own table points to O via A, A sends to X) and also shows C and D
  drawn in during `more-specific` round 2, before they hear the /25 themselves.
- **The home AS delivers the test address itself.** O's internal routes for its own hosts are more specific than any
  announcement, so O never forwards 203.0.113.10 out, even when it stores the /25. Without this O would send its own
  address to X in `more-specific`, which is possible only for an origin whose internal routes are no longer than /24
  and would need its own explanation (second concept).
- **X's own route is never dropped by X.** RFC 6811 §2 says the lookup SHOULD apply to redistributed routes too, but
  an AS that originates a conflicting route is not the one filtering it; X's validation (in `all`) only affects what it
  receives. X's own traffic stays at X in every hijack preset.
- **Chips carry the prefix only** (`/24`, `/25`, `/25 I`); the AS path is in the receiver's table in the same step and
  in the caption. Full paths on the chips did not fit between neighbouring cards.
- **State shape.** Keyed by AS letter (O, A … X), not by ASN as in the task's sketch: the letters are the card marks,
  the ASN is in the scene. `ases[id]` holds `rib` (prefix, from, path, lp, local, valid), `best` and `by` per prefix,
  `rov`, and `fwd` { prefix, via, origin, dest, hops }; `roas`, `announcements`, `pending` as the task names them.
- **Validation labels** appear only at ASes that validate (they compute them); elsewhere the table has no badge. With
  ROV on and no ROA everything is NotFound and kept: the same outcome as no validation (tested).
- **Captions.** Captions name the explained AS by its ASN and neighbours by letter, as in `bgp-path-selection`. Focus
  per round: a validating AS drawn in, else an AS that switched to the longer prefix ("although its AS path is
  longer"), else one drawn in, else a shorter-path win, else a first route. Optional sentences are added while the
  caption stays under 300 characters; all 50 steps (5 presets, hr and en) checked at 1920×1080: at most three lines.

## Deviations from the task

- **Step counts:** `normal` 5 (task 3), `same-prefix` 3 (4), `more-specific` 6 (4), `rov-all` 2 (4), `rov-half` 4
  (5). The task's counts were marked "topology derived, unchecked"; these follow from the topology above and the
  `bgp-path-selection` round semantics (a final "converged" step).
- **`rov-all` outcome:** "all traffic returns to AS64496" holds for the seven other ASes; X keeps its own traffic
  (it originates the /25 itself).
- **`more-specific`:** "every AS that accepts it" is all seven others; O stores the /25 but delivers 203.0.113.10
  itself (decision above).
- **Params** as in the task (`conflict`, `roa`, `rovDeployment`); every param `resets: true`, since each changes the
  run from step 0.

## Shared requests

- **models/ (coordinator):** promote a BGP model shared by `bgp-path-selection`, `bgp-hijack` and later
  `peering-transit`. The smallest change that serves both: routes with a `prefix` field (default the scene's single
  prefix), `round` taking `send: [{ id, prefix }]`, plus `validate(roas, prefix, originAsn)` and the hop-by-hop
  `forwarding`. Until then this sim carries its own copy (header of `sim.js`).
- **K2:** none needed; the forwarding badge is a card badge with a node as its text.

## Unchecked *(check)*

- "Many networks do not accept IPv4 prefixes longer than /24" (task rule 6): stated in the explanation, not sourced.
- RFC 6480 and RFC 6482: not read; the ROA fields used are the ones RFC 6811 §2 names.
- Term pairs below marked *(check)*.
- RFC 5398 and RFC 5737 ranges: from the task, not reread.

## Term pairs (not in `kit/glossary.js`; written out in the explanation until added)

| English | Croatian | Source |
|---|---|---|
| route hijack | otmica prefiksa | task *(check)* |
| more-specific prefix | specifičniji prefiks | URM ch11 ("najspecifičniji") |
| longest prefix match | najdulji podudarajući prefiks | URM ch11 |
| route origin authorisation (ROA) | ovlaštenje izvorišta puta | task *(check)* |
| origin validation (ROV) | provjera izvorišta | task *(check)* |
| autonomous system | autonomni sustav | URM ch11 |

*network prefix* (mrežni prefiks) is in the glossary and used as `[[network prefix]]` in the explanation.

## Sources

- RFC 6811, read online for this task (rfc-editor.org): §1 (path attestation out of scope), §2 (Prefix, Covered,
  Matched, Route Origin ASN of an empty AS_PATH, Valid / Invalid / NotFound, the SHOULD for redistributed routes), §5
  (Invalid routes are local policy), §6 ("It only attempts to verify the origin").
- RFC 4271 through `sims/bgp-path-selection/SPEC.md` (§9 replacement, §9.1.2.2 tie-breaks).
- URM `book/chapters/11-usmjeravanje.md`: longest match ("najspecifičniji, odnosno najdulji podudarajući"), Primjer 2.
- No local chapter covers hijacks or RPKI (task).

## Checks

- **Mutation run:** 21 mutations of `sim.js` (router ID reversed, length ignored, local route not first, shortest
  prefix match, no home rule, no loop check, Invalid kept, validation everywhere, maxLength ignored, origin ignored,
  cover ignoring length, NotFound as Invalid, origin taken from the first ASN, old entry kept on replacement, prefix
  ignored on replacement, no hop-by-hop trace, no prepend, hijack before convergence, a different half set, withdrawal
  ignored, change detection ignoring the destination). All caught; "local route not first" only after adding a test
  with a learned route of higher LOCAL_PREF.
- **Fresh review** (a separate agent read the code against SPEC.md and RFC 6811 §2, hand-traced `more-specific` and
  `rov-half`, checked invariants over all 18 param combinations, ran its own mutations): no model defects. Fixed from
  it: the converged sentence "validates … yet its traffic goes to AS64511 via a neighbour that does not validate" was
  false without a ROA or when the next hop validates (now it needs a ROA, a validating AS whose own route has origin
  AS64496, and a non-validating next hop); "all validate" at the start of a sentence; "no best path changed" in a
  round where only X's own route changed (now "no other AS"); Croatian "za poslati". Six surviving mutants now caught
  by new tests: ROA maxLength, the "all" set, prefix cover with a different address, no decision rerun after a
  dropped message, local routes unlabelled, and router IDs swapped (E and F reversed → X picks F, so the tie is
  decided by router ID, not by ASN or scene order). Survivors left on purpose: validation before the loop check (only
  the label of a message that is dropped anyway), and three changes equivalent on all 18 combinations.
- **Caption sweep:** every step of all 18 param combinations in both languages (191 captions): at most three lines at
  1920×1080, no console error.
- **Gate:** `npm run gate -- bgp-hijack` passes; screenshots (1920×1080 light, dark, grayscale; 375×812; hr and en)
  reviewed, plus every step of every preset in both languages (caption sweep above).

## Time

Start 15:04, done 15:36 (one session, including the review and its fixes).
