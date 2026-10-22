<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# bgp-path-selection: spec

One concept: **AS path, local preference, prefix propagation between ASes** (task `docs/tasks/w2/bgp-path-selection.md`,
catalogue `inet-bgp-path-selection`, §4.2 and §5.11). The student steps announcements of one prefix across a small
internet of five autonomous systems, one synchronous round per step. eBGP only: every AS is one BGP speaker.

RFC 4271 was read offline (`~/projects/uvod-u-racunalne-mreze/references/chapter-11/rfc4271.txt`); section numbers
below are checked against it.

## Scene

| AS | ASN (RFC 5398) | router ID (BGP Identifier) | role |
|---|---|---|---|
| O | 64496 | 192.0.2.3 | originates 203.0.113.0/24 (RFC 5737) |
| A | 64497 | 192.0.2.1 | |
| B | 64498 | 192.0.2.2 | |
| C | 64499 | 192.0.2.4 | |
| D | 64500 | 192.0.2.5 | the observer (default `watch`) |

Links (one eBGP session each): O–A, O–B, A–C, B–C, B–D, C–D.

Router IDs: A 192.0.2.1 and B 192.0.2.2 are the task's. O and C are this sim's choice (derived): O < C, so at
`prependOtoB` 2, where B holds two paths of three ASNs (direct from O and via C), B keeps its direct path; at 3
the direct path is longer and B moves to C. Router IDs compare as 32-bit numbers.

## Rules

1. **BGP routes between autonomous systems**; an AS is a set of routers under one technical administration (RFC 4271
   §1; URM ch11 "Dinamičko usmjeravanje"). Each AS is drawn as one box with one table.
2. **AS_PATH and loop prevention.** An AS sending a route to an eBGP neighbour prepends its own ASN (RFC 4271 §5.1.2,
   "prepends its own AS number as the last element of the sequence"; leftmost on the page). A receiver whose own
   ASN is in the path excludes it (§9.1.2: "contains an AS loop … excluded from the Phase 2 decision function").
   **Tie-break of the model:** the dropped message still replaces what that neighbour sent before (§9: the new
   route "SHALL replace the older route in the Adj-RIB-In, thus implicitly withdrawing the older route"), so the
   receiver also loses the neighbour's old path. The page draws the message with a cross at the receiver.
3. **Highest LOCAL_PREF first.** The receiving AS sets it per neighbour by its own policy (§9.1.1, eBGP: "computes
   the degree of preference based on preconfigured policy"); the highest degree of preference is selected (§9.1.2;
   the tie-breaks of §9.1.2.2 apply only among equally preferred routes); it is never sent to an eBGP neighbour (§5.1.5: "MUST
   NOT include this attribute in UPDATE messages it sends to external peers"). Default 100 everywhere;
   `dLocalPrefFromC` sets D's value for routes from C. An announcement chip carries the AS path only.
4. **Then the shortest AS_PATH** (§9.1.2.2 a). A prepended ASN counts every time it appears.
5. **ORIGIN and MED** (§9.1.2.2 b, c): equal for every path in this model (all IGP origin, no MED); never decide.
   d (eBGP over iBGP) and e (interior cost) cannot differ either: eBGP only, one router per AS.
6. **Then the lowest BGP Identifier** (router ID) of the advertising neighbour (§9.1.2.2 f), then the lowest peer
   address (g). Router IDs are unique and every pair of ASes has at most one session, so g is never reached; the
   model's last guard (scene order of the neighbour) is never reached either (tested).
7. **Withdrawal and fallback.** A withdrawal removes the neighbour's path from the receiver; the receiver reruns
   the decision and falls back to its next-best stored path (§9: "SHALL be removed from the Adj-RIB-In … SHALL run
   its Decision Process"). A failed link closes the session: both ends delete every route learned over it (§8.2.2,
   "deletes all routes associated with this connection") and rerun the decision. An AS left with no path sends a
   withdrawal to every neighbour (§9.2: "newly unfeasible routes for which there is no replacement route SHALL be
   advertised to its peers"). Simplified: no timers, no MRAI, no hold time; the failure acts at once.
8. **Forwarding** uses the longest matching prefix (URM ch11 Primjer 2). This page has one prefix, so rule 8 only
   appears in the explanation; it matters for `bgp-hijack`.

**Locally originated:** O's own route (empty AS path) beats anything it could learn; every path O hears holds 64496
and is dropped by rule 2 anyway.

**What an AS stores:** at most one path per neighbour (its Adj-RIB-In for the prefix), the last one that neighbour
announced and that passed rule 2. The table shows them with the receiver's LOCAL_PREF; the best is marked.

## One step

Step 0: O has its local route; nobody else knows the prefix. O counts as "changed" so it sends in round 1.

Step n:

1. **Senders** are the ASes whose best path changed in step n − 1.
2. If there are senders, **a round**: each sender sends to every neighbour over a link that is up: its best path
   with its own ASN prepended (plus `prependOtoB` extra copies of 64496 from O towards B), or a withdrawal when it
   has no best. All messages are taken from the state before any is received; this includes sending the path back
   to the neighbour it came from (that one is dropped by rule 2). Receivers apply rules 2 and 7, then every receiver
   reruns the decision (rules 3–6); the ASes whose best changed (neighbour, path or LOCAL_PREF) are the next
   senders.
3. If there are no senders, **the network has converged**. If `failLink` names a link that has not failed yet, it
   fails now (rule 7) and the step is the failure; the ends whose best changed send in the next step. Otherwise
   the step is "converged" and the run ends.

## Presets and expected numbers (derived from the rules; each asserted in `sim.test.js`)

| # | id | params | expected |
|---|---|---|---|
| 1 | `shortest-path` | defaults | round 1 O → A, B; round 2 C has [64497 64496] from A and [64498 64496] from B, LP and length equal → A (192.0.2.1 < 192.0.2.2); D has [64498 64496] from B; round 3 D also hears [64499 64497 64496] from C: LP 100 = 100, 2 < 3 → **via B**; nothing changes; step 4 converged |
| 2 | `local-pref` | `dLocalPrefFromC` 200 | round 3 D: LP 200 from C beats 100 from B → **via C** although 3 > 2; round 4 D sends [64500 64499 64497 64496]: B stores it with LP **100** (its own default; D's 200 is not sent), C drops it (loop); step 5 converged |
| 3 | `router-id-tie` | defaults, `watch` C | round 2 C: [64497 64496] from A and [64498 64496] from B, equal LP and length → **A**, lower router ID |
| 4 | `link-failure` | `failLink` O–B | steps 1–3 as preset 1; step 4 O–B fails: B loses [64496] but already holds [64499 64497 64496] from C → best via C at once, no withdrawal; round 5 B sends [64498 64499 64497 64496]: C drops it (loop, and so loses B's old [64498 64496]), D replaces B's path → **D falls back to [64499 64497 64496] via C**; round 6 D tells B (stored) and C (dropped); step 7 converged |
| 5 | `prepending` | `prependOtoB` 2 | O sends [64496 64496 64496] to B; D gets [64498 64496 64496 64496] (4) from B and [64499 64497 64496] (3) from C → **via C**; B holds two paths of 3 and keeps O (192.0.2.3 < 192.0.2.4); step 5 converged |
| 6 | `withdrawal` | `failLink` O–A, `watch` C | steps 1–3 as preset 1; step 4 O–A fails: A has nothing else (C's path held 64497 and was dropped) → no path; round 5 **A withdraws** to C; C falls back to [64498 64496] from B; round 6 C sends [64499 64498 64496]: A **relearns** the prefix via C, B drops it (loop), D stores it (still via B); round 7 A's [64497 64499 64498 64496] is dropped by C; step 8 converged |

**Steps:** `shortest-path` 4, `local-pref` 5, `router-id-tie` 4, `link-failure` 7, `prepending` 5, `withdrawal` 8.
Every combination of params stays ≤ 20 (tested); the most is 11 (`failLink` O–A with `prependOtoB` 3). sim.json `steps` is the default's 4.

**Prepending, param sweep** (O towards B, all else default): 0 → D via B; 1 → D holds [64498 64496 64496] and
[64499 64497 64496], equal length, B wins on router ID (B 192.0.2.2 < C 192.0.2.4); 2 → D via
C, B keeps O on router ID; 3 → B via C as well (4 > 3).

## Marks

- An AS whose best changed this step: thick border and the kit's changed mark on its card, thick border on its
  table block, the changed highlight on its best row (★).
- A path removed this step (withdrawn, replaced by a looped path, or lost with a failed link) stays one step as a
  struck-through, muted row marked "removed".
- Each table block names the rule that decided its best: only path, local preference, shorter AS path, lower
  router ID (or own prefix at O).
- Announcement: a solid arrow beside the link with the path on its chip, in the sender's colour; dropped by rule 2:
  the arrow ends in a cross. Withdrawal: a dashed arrow with a chip "✕ withdraw".
- The watched AS's best path is drawn thick along the links it follows (its AS path), and its table is outlined.
- A failed link: the K2 `down` link (dashed, cross).

## Sources

- RFC 4271 (offline copy, URM references ch11): §1 (AS definition), §5.1.2 (prepend), §5.1.5 (LOCAL_PREF not sent to
  external peers), §8.2.2 (routes of a closed connection deleted), §9 (replacement and withdrawal in the
  Adj-RIB-In), §9.1.1 (eBGP degree of preference by local policy), §9.1.2 (highest preference selected; AS loop excluded), §9.1.2.2 a–g (tie
  breaks), §9.2 (an unfeasible route with no replacement is withdrawn).
- RFC 5398 (ASNs 64496–64511 for documentation), RFC 5737 (203.0.113.0/24 TEST-NET-3), RFC 5737 192.0.2.0/24 for
  router IDs: from the task file, not reread here.
- URM `book/chapters/11-usmjeravanje.md`: "Dinamičko usmjeravanje: kad tablicu gradi mreža sama" (BGP between ASes,
  AS definition, rule 1) and "Primjer 2: kad se u tablici podudara više puteva" (rule 8).
- NLA `meta/toc.md` T10 "BGP koliko treba sistemašu" (topic named only; no chapter yet).
