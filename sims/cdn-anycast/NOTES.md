<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cdn-anycast: notes

New explorer (task `docs/tasks/w3/cdn-anycast.md`, catalogue `inet-cdn-anycast`, §4.2, wave 3) on kit view K2
(`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Model reused by copy.** `models/` has no BGP model yet, so the engine (`neighbours`, `lpFor`, `ridNum`, `cmpPath`,
  `decidedBy`, `decide`, `copyRoute`, `sameRoute`, `rerun`, `sortRib`, `pathOut`, `round`) is copied from
  `sims/bgp-path-selection/sim.js @ 969c181` (COMMON.md §6). `round` drops the per-message bookkeeping the stepper's
  page needed (`link`, `removed`, `result`); the decision is unchanged. New here: several origins with one ASN (each
  PoP is its own BGP speaker with its own router ID), links that start down, and `converge` (rounds until no best
  changes). Not promoted, not edited.
- **Explorer state is the converged result.** No rounds on the page: the params give the tables at once, as the task
  says ("every client's chosen PoP recomputes at once"). Every one of the 128 param combinations converges within 5
  rounds (tested).
- **Topology and router IDs are mine** (the task's were "derived, unchecked"): SPEC.md "Scene". AS64503 is the one
  transit AS and has equal paths to VIE and FRA, so both the router-ID tie (rule 5) and local preference (rule 2) are
  about one AS. AS64502–AS64503 is there so that a withdrawn VIE does not cut off the east, and it gives a second
  router-ID tie (AS64502 with VIE withdrawn).
- **Drawing.** 11 columns, an empty column between linked cards so the arrows show: PoPs on top (FRA, VIE, ZG, west to
  east), the access ASes under them, the transit AS64503 at the bottom, and AS64505 under Zagreb with its only link
  running west to AS64503 (preset 3's point, visible without words). Places on the cards are for the reader; the model
  has no coordinates.
- **Colour.** An AS takes the series colour of the PoP it reaches, and its "→ PoP" badge says the same in words; with
  no path its mark is dashed and the badge reads "no path". The grayscale screenshot keeps every meaning.
- **"Moved"** is tracked by the page (the state before the last param change; for a preset, the defaults), not stored
  in the state: it depends on two param sets (SPEC.md "State"). Marked on the card (changed mark, thick border), on the
  side block, and named in the caption.
- **Caption.** After a change: what changed, the first AS that moved (a client group before the transit AS64503),
  where it goes now and that the address is the same; after a local-preference change, how AS64503 decided; then, while
  under 300 characters, the other ASes that moved and rule 4's sentence (a short HTTP request vs a long TCP connection).
  With nothing changed: how many PoPs announce, and where each client group goes. Preset 3 has its own caption.
- **Side column.** The address and prefix (constant: misconception "failover needs DNS changes"), then one block per
  non-PoP AS: its stored paths with LP, the best starred and underlined, the rule that decided, the PoP. The PoP cards
  count the client groups each serves (misconception "anycast load-balances evenly").
- **Withdrawn PoP**: the K2 `down` card (dashed, hatched, muted) with a "✕ withdrawn" badge; the task's "crossed".

## Deviations from the task

- **Preset 3 reaches VIE, not FRA.** For the task's param (AS64503's local preference towards FRA) to change anything,
  AS64503 cannot already be on FRA at the defaults; so it, and AS64505 behind it, reach VIE by router ID. The preset's
  point (Zagreb's own PoP is not the one it reaches) holds. SPEC.md "Deviations".
- **`moved` not in the state** (above).
- **Link toggles named here:** AS64501–AS64502, AS64503–VIE, AS64503–FRA.
- **Rule 4 source:** the task cites RFC 4786 §4.4; the text on long-running flows is in §4.1.
- **No step, no packets moving**: an explorer. The arrows beside the chosen links are K2 packets without a chip and
  without the move.

## Shared requests (kit view K2)

- **A hexagon node kind** (`kind: 'pop'` or a `shape` option) for points of presence / sites. Workaround: page CSS
  `clip-path` on the `server` mark, and the legend swatch `ca-pop`.
- **A path marker without a packet**: `active` links with a direction (an arrowhead on the link itself) would say
  "traffic goes this way" for explorers. Workaround: a packet with `chip: false, move: false` beside each active link.
- **Legend swatches for node kinds** (circle, rounded square, hexagon) in ink, not a series colour. Workaround: page
  CSS `ca-client`, `ca-transit`, `ca-pop`.
- **Promote the BGP engine** to `models/` (third copy now: `bgp-path-selection`, `bgp-hijack`, here). What this sim
  needs on top of `bgp-path-selection`'s functions: several origins (a list instead of `scene.origin`), links that
  start down (`linkUp` in the scene), and a `converge(scene)` that runs rounds until nothing changes.

## Term pairs (not in `kit/glossary.js`; written out in the explanation until added)

| English | Croatian | Source |
|---|---|---|
| anycast address | *anycast* adresa | URM ch10 keeps the English word ("Anycast adresa identificira skup sučelja") |
| point of presence (PoP) | točka prisutnosti | task *(check)* |
| edge server | rubni poslužitelj | task *(check)* |
| announcement | najava | task, as in `bgp-path-selection` *(check)* |
| withdrawal | povlačenje | task, as in `bgp-path-selection` *(check)* |
| autonomous system | autonomni sustav | URM ch11 |
| AS path | AS put | task *(check)* |
| local preference | lokalna prednost | task, as in `bgp-path-selection` *(check)* |

*network prefix* (mrežni prefiks) is in the glossary and used as `[[network prefix]]` in the explanation.

## Unchecked *(check)*

- The Croatian terms marked above (task's, not found in the course books).
- RFC 4786 was read online, not from an offline copy; it does not say in so many words that clients need no change on
  a withdrawal (rule 3's "the address does not change" is the model's).
- City placement (which ISP is in which city) is invented for the drawing.

## Sources

- RFC 4291 §2, offline (`~/projects/uvod-u-racunalne-mreze/references/chapter-10/rfc4291.txt`): anycast to the
  "nearest" interface "according to the routing protocols' measure of distance".
- URM `book/chapters/10-ipv6.md` (three kinds of address) and `11-usmjeravanje.md` "Dinamičko usmjeravanje".
- RFC 4271 (offline, URM references ch11), via `sims/bgp-path-selection/SPEC.md`: §5.1.5, §8.2.2, §9.1.1, §9.1.2,
  §9.1.2.2.
- RFC 4786 (BCP 126) §1, §2, §4.1, §4.4.1 and RFC 5398 §4: read online (rfc-editor.org).
- RFC 5737 (203.0.113.0/24, 192.0.2.0/24): offline, URM references ch11.

## Checks

- **Tests:** 31 (tie-breaks first, each rule, all 128 param combinations for convergence, forwarding without loops,
  AS path = the hops' ASNs, the converse of storage at convergence, the presets, the generic block).
- **Fresh review** (a separate agent read the files against SPEC.md, hand-traced the defaults and VIE withdrawn by RFC
  4271's order, checked every SPEC claim by script and ran its own mutations): no model defects. Caught by the tests:
  LP ignored or reversed, length ignored or reversed, LP and length swapped, router ID reversed, loop check removed, a
  withdrawn PoP still originating, a down link still carrying, `moved` and `hopsOf` errors, LP on the wrong side or
  passed on, too few rounds, `loadOf` errors. Not caught, and fixed: the router-ID comparison removed or done as text
  (every tie here had scene order equal to router-ID order; new test with a scene where they disagree) and
  `announcements[].up` forced true (now asserted). Also fixed from it: preset 1's hint claimed one group per PoP; the
  overview caption said "every AS" but lists the client groups; preset 3's caption now needs its params (a hand-made
  URL can keep the preset with other params); `LP {lp}` moved to strings.js; Croatian word order and tense in two
  sentences. Left as is (harmless here, listed): `state.lp` untested and unused by the page; a withdrawal never
  happens from an empty start, so the withdraw branch of the copied `round` is never exercised; after a preset the
  "moved" marks compare with the defaults, not with the preset before (SPEC.md "State").
- **Gate:** `npm run gate -- cdn-anycast` passes; screenshots at 1920×1080 (light, dark, grayscale) and 375×812 in hr
  and en reviewed, plus every preset and a sequence of hand changes in both languages (captions read against the
  state; no console errors).

## Time

Start 16:02, done 16:24 (one session, about 22 min including the fresh review).
