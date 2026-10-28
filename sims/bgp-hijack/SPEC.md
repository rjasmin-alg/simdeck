<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# bgp-hijack: spec

One concept: **a more-specific prefix wins; route origin validation** (task `docs/tasks/w3/bgp-hijack.md`, catalogue
`inet-bgp-hijack`, §4.2). The student announces a conflicting route from AS64511, then publishes a ROA and turns on
origin validation, one synchronous round of BGP announcements per step. eBGP only: every AS is one BGP speaker.

## Scene

| AS | ASN (RFC 5398) | router ID | role |
|---|---|---|---|
| O | 64496 | 192.0.2.7 | holds 203.0.113.0/24 (RFC 5737) and the test address 203.0.113.10; the real origin |
| A | 64497 | 192.0.2.1 | |
| B | 64498 | 192.0.2.2 | |
| C | 64499 | 192.0.2.3 | |
| D | 64500 | 192.0.2.4 | |
| E | 64501 | 192.0.2.5 | |
| F | 64502 | 192.0.2.6 | |
| X | 64511 | 192.0.2.8 | announces a conflicting route (`conflict`); the false origin |

Links (one eBGP session each): O–A, O–B, A–C, B–C, C–D, A–E, B–F, E–X, F–X. Drawn top to bottom: O | A C B | E D F | X.

AS-hop distances (derived, `sim.test.js` asserts the outcomes): from O: A 1, B 1, C 2, E 2, F 2, D 3, X 3; from X:
E 1, F 1, A 2, B 2, C 3, O 3, D 4. So E and F are strictly closer to X, A, B, C and D strictly closer to O.

Router IDs (all derived, mine) settle the three ties that occur, in a stated way: C hears two /24 paths of two ASNs
from A and B → A; X hears two /24 paths of three ASNs from E and F → E; with a /25 hijack, O hears two /25 paths of
three ASNs from A and B → A (and C likewise).

**Origin validation per `rovDeployment`:** none; half = O, B, C, F; all = every AS. Half is chosen so that one
validating AS (C) is drawn in through a non-validating neighbour (A), which rule 5 is about.

**ROA (`roa` on):** 203.0.113.0/24, maxLength 24, origin AS64496 (the task's).

## Rules

1. **Path selection** per AS and per prefix as in `bgp-path-selection` (RFC 4271 §9.1.2.2; the functions are copied
   unchanged): a locally originated route first; then the highest LOCAL_PREF (100 everywhere here); then the shortest
   AS_PATH; ORIGIN and MED equal; then the lowest router ID of the advertising neighbour. An AS that finds its own ASN
   in a path drops it (loop), and every announcement replaces what that neighbour sent before for the same prefix
   (RFC 4271 §9), also when it is then dropped.
2. **Forwarding** of 203.0.113.10 at each AS uses the longest matching prefix among its best routes, whatever their
   origin (URM ch11 "Usmjeravanje", Primjer 2: "pobjeđuje najspecifičniji, dakle najdulji"). Where the traffic ends is
   found by following each AS's choice hop by hop: an AS can be drawn to X by its next hop even if its own route
   points to O. **The home AS (O) delivers the test address itself:** its internal routes are more specific than any
   announcement (a modelling decision, NOTES.md).
3. **Same prefix vs more-specific.** A conflicting announcement of the same /24 wins only where its AS path is
   shorter (rule 1): E and F. A /25 captures every AS that accepts it (rule 2), however long its path.
4. **Origin validation** (RFC 6811 §2): a ROA *covers* a route when the route's prefix lies in the ROA's prefix and is
   at least as long; it *matches* when it covers, the route's origin AS (the last ASN of the path; the AS itself for
   an empty path) equals the ROA's AS, and the length is ≤ maxLength. **Valid**: some ROA matches; **Invalid**: some
   ROA covers, none matches; **NotFound**: none covers. ROA content: RFC 6482 *(check: not read)*.
   **Tie-break:** several covering ROAs, any one matching → Valid (RFC 6811 §2 "at least one VRP Matches").
5. **Drop Invalid.** An AS with validation on labels every route it receives and drops an Invalid one before the
   decision (local policy: RFC 6811 §5 "Considering invalid routes for BGP decision process is a purely local policy
   matter"). The dropped message still replaces what that neighbour sent before (rule 1). An AS without validation
   keeps everything and labels nothing. A locally originated route is never dropped by its own AS.
6. **Many networks do not accept IPv4 prefixes longer than /24** *(check)*: stated in the explanation only; the
   model accepts the /25 as an illustration of rule 2.
7. **Validation reads the origin only**, never the rest of the path (RFC 6811 §1 "complete path attestation against
   the AS_PATH attribute of a route is outside the scope of this document", §6 "It only attempts to verify the
   origin"). `validate(roas, prefix, originAsn)` has no path argument.

Withdrawals (an AS left with no route for a prefix tells its neighbours) are kept from `bgp-path-selection`; no
param combination here reaches one (tested in isolation).

## One step

- **Step 0 without a conflict** (`normal`): O has its local /24 and sends it in round 1.
- **Step 0 with a conflict:** the legitimate /24 has already spread and converged (the same rounds, run in
  `initial`); every AS forwards 203.0.113.10 to O. X will start announcing in round 1.
- **Step n:** the ASes whose best route for a prefix changed in step n − 1 send that prefix to every neighbour (in
  round 1 also X with its new route). All messages are taken from the state before any is received; receivers apply
  the loop check, then validation (rule 5) where it is on, then rerun the decision for the prefixes they heard. Then
  every AS's forwarding is recomputed (rule 2); "changed" marks the ASes whose next hop, prefix or destination
  changed. A step with nothing to send is "converged" and the run ends.

## Presets and expected numbers (derived; each asserted in `sim.test.js`)

| # | id | params | expected |
|---|---|---|---|
| 1 | `normal` | defaults | changed: round 1 A, B; round 2 C, E, F (C: A over B on router ID); round 3 D, X (X: E over F on router ID); round 4 none; step 5 converged; all eight forward to O |
| 2 | `same-prefix` | conflict same-prefix | step 0 converged, all to O; round 1 X sends [64511] to E and F, which prefer it to [64497 64496] / [64498 64496] (1 < 2); round 2 A and B keep [64496] (1 < 2); step 3 converged: **E, F, X → X; O, A, B, C, D → O** (3 and 5) |
| 3 | `more-specific` | conflict more-specific | round 1 E, F take the /25; round 2 A, B take it ([64501 64511] although their /24 is [64496]), C and D are drawn in through A and C before hearing it; round 3 C takes the /25 itself (A over B), O stores it but delivers itself; round 4 D takes it; step 6 converged: **all seven others → X** |
| 4 | `rov-all` | more-specific, roa, all | round 1 E and F label the /25 Invalid (wrong origin, longer than maxLength) and drop it; nobody else changes; step 2 converged: **everyone but X → O** (X keeps its own) |
| 5 | `rov-half` | more-specific, roa, half | round 1 F drops it, E takes it; round 2 A takes it from E; C (validating) and D are drawn in through A; round 3 O and C drop the /25 from A; step 4 converged: **A, C, D, E, X → X; O, B, F → O**; C validates and still ends at X |

**Steps:** `normal` 5, `same-prefix` 3, `more-specific` 6, `rov-all` 2, `rov-half` 4. Every one of the 18 param
combinations converges, at most 6 steps (tested). `sim.json` `steps` is the default's 5.

## Marks

- Card: ● real origin (O), ▲ false origin (X once it announces), the forwarding badge "→ next hop ●/▲" (outlined for
  O, filled for X), "ROV" where validation is on; thick border: sent this round; kit changed mark: forwarding changed.
- Links on the way of traffic that ends at X: drawn thick in ink.
- Announcement: an arrow beside the link with the prefix on its chip; dropped (loop or Invalid): the arrow ends in a
  cross, an Invalid chip adds "I".
- Side column: the ROA card, who validates, then per AS its best path per prefix with V / I / NF (validating ASes
  only), an announcement dropped as Invalid this round struck through, and its forwarding line (filled when it ends at
  X, highlighted when it changed).

## Sources

- RFC 4271 (offline, URM references ch11): §9 (replacement in the Adj-RIB-In), §9.1.2.2 (tie-breaks); through
  `bgp-path-selection`'s SPEC.md.
- RFC 6811, read online (rfc-editor.org) for this task: §1, §2 (definitions, states, origin AS of an empty path), §5,
  §6.
- RFC 6480 (RPKI architecture), RFC 6482 (ROA profile): not read *(check)*; the ROA fields used are the ones RFC 6811
  §2 names (prefix, maximum length, AS).
- URM `book/chapters/11-usmjeravanje.md`: "Usmjeravanje: kako paket pronalazi put kroz mrežu" (najspecifičniji,
  najdulji podudarajući) and Primjer 2.
- RFC 5398, RFC 5737 (documentation ASNs and addresses).
