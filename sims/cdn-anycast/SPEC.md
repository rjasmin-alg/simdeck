<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cdn-anycast: spec

One concept: **one address, many places; BGP picks the nearest** (task `docs/tasks/w3/cdn-anycast.md`, catalogue
`inet-cdn-anycast`, §4.2). An explorer: the student withdraws PoPs, fails links and changes one local preference; every
AS's chosen PoP is recomputed at once and drawn. eBGP only, one BGP speaker per AS (and per PoP); no iBGP inside the
CDN, no DNS steering, no edge caching, no TCP handling (out of scope, task).

## Scene

A CDN network AS64500 has three edge sites (points of presence, PoPs), each with its own border router and its own
eBGP sessions. All three originate the same prefix 203.0.113.0/24 (RFC 5737 TEST-NET-3) and serve the same address
203.0.113.10 in it. ASNs from RFC 5398 (64496–64511 for documentation, §4, checked online).

| node | AS | router ID | place (drawing only) | role |
|---|---|---|---|---|
| ZG | 64500 | 192.0.2.10 | Zagreb | PoP |
| VIE | 64500 | 192.0.2.20 | Vienna | PoP |
| FRA | 64500 | 192.0.2.30 | Frankfurt | PoP |
| 64501 | 64501 | 192.0.2.1 | Zagreb | access ISP, client group |
| 64502 | 64502 | 192.0.2.2 | Vienna | access ISP, client group |
| 64503 | 64503 | 192.0.2.3 | Frankfurt | transit (no client group of its own) |
| 64504 | 64504 | 192.0.2.4 | Munich | access ISP, client group |
| 64505 | 64505 | 192.0.2.5 | Zagreb | access ISP, client group; buys transit only from 64503 |

Links (one eBGP session each): ZG–64501, VIE–64502, VIE–64503\*, FRA–64503\*, FRA–64504, 64501–64502\*, 64502–64503,
64503–64504, 64503–64505. The three marked \* are the page's link toggles.

The topology and the router IDs are this sim's (derived; the task's topology was "derived, unchecked"). They are chosen
so that every rule shows in some preset:

- VIE (192.0.2.20) < FRA (192.0.2.30): AS64503 has [64500] from both, equally preferred and equally long, and picks
  VIE by router ID (rule 5) unless local preference says otherwise (rule 2, preset 4).
- 64501 (192.0.2.1) < 64503 (192.0.2.3): with VIE withdrawn, AS64502 holds [64501 64500] and [64503 64500] and picks
  64501, so ZG (rule 5 again, no preset).

## Rules

1. **An anycast address identifies a set of interfaces; a packet goes to the "nearest" one.** RFC 4291 §2 (offline,
   URM references ch10): "Anycast: An identifier for a set of interfaces … A packet sent to an anycast address is
   delivered to one of the interfaces identified by that address (the "nearest" one, according to the routing
   protocols' measure of distance)"; URM ch10 "Adrese se dijele na tri vrste". For IPv4 the same effect comes from
   announcing one prefix from many places: RFC 4786 §1 "reachability to those addresses is advertised in a routing
   system from multiple, independent service nodes", §2 "Anycast: the practice of making a particular Service Address
   available in multiple, discrete, autonomous locations" (checked online). In the model: every PoP that announces
   holds a locally originated route for 203.0.113.0/24 and sends [64500] to its neighbours.
2. **"Nearest" is the best BGP path as each AS sees it, not distance in km.** Highest LOCAL_PREF, then shortest
   AS_PATH, then the tie-breaks of `bgp-path-selection` (RFC 4271 §9.1.2, §9.1.2.2 a–g; its SPEC.md rules 3–6).
   LOCAL_PREF is set by the receiving AS per neighbour and never sent to an eBGP neighbour (RFC 4271 §5.1.5, §9.1.1).
   The page's param `lpAs64503` sets AS64503's value for routes from FRA (100 or 200); every other value is 100. The
   places on the cards are for the reader; the model has no coordinates.
3. **Withdrawing a PoP's announcement moves its clients to their next-best path; the address does not change.** RFC
   4786 §4.4.1: "non-availability of the service triggers a route withdrawal … to route requests to a different Anycast
   Node where the service is working normally" (checked online). A withdrawn PoP has no local route; it still has its
   sessions but every path it hears holds 64500 and is dropped (loop prevention, RFC 4271 §9.1.2), so it says nothing.
   A failed link closes its session (RFC 4271 §8.2.2). The model recomputes the converged tables for the new params;
   the address shown on every PoP stays 203.0.113.10. *RFC 4786 does not say in so many words that clients need no
   change; the task's "the address does not change" is the model's (the prefix and address are constants).*
4. **A moved flow lands on a PoP that has no state for it.** For a short HTTP request that is harmless; a long TCP
   connection to the old PoP breaks. RFC 4786 §4.1: routing "ought to be stable for substantially longer than the
   expected transaction time … especially for long running flows, there are potential failure modes using anycast"
   (checked online; the task cited §4.4, the text is in §4.1). Shown in the caption only; no TCP model (out of scope).
5. **Tie-break: equal LOCAL_PREF and AS-path length → lowest router ID of the advertising neighbour** (RFC 4271
   §9.1.2.2 f, from `bgp-path-selection`). ORIGIN and MED are equal for every path; one session per pair of ASes, so g
   (peer address) is never reached; the model's last guard (scene order) is never reached either (tested).

**Convergence.** The state is the result of synchronous rounds (the `bgp-path-selection` engine: each AS whose best
changed sends it, own ASN prepended, to every neighbour; a receiver drops a path holding its own ASN, else stores it
in place of what that neighbour sent before, and reruns the decision) from the announcing PoPs until no best changes.
Every one of the 128 param combinations converges, in at most 5 rounds (tested). A converged state has no forwarding
loop: following each AS's own best hop by hop always ends at a PoP (tested).

**Where an AS goes.** The PoP an AS reaches is where its traffic ends hop by hop: its best path's neighbour, that
neighbour's best path's neighbour, … until a PoP. The AS path alone cannot say it ([64500] is the same for all three).

## State (explorer)

`initial(params)` returns `{ prefix, address, announcements: [{ pop, up }], links: [{ id, a, b, up }], lp, ases: { id:
{ rib, by } }, best: { as: { path, pop, hops, from, lp, by } | null }, rounds, converged }`. `best` covers the five
non-PoP ASes; null means no path (203.0.113.10 unreachable from there).

**Moved** (task: `moved: [clientAs]`) is not in the state: it compares two states, so the page keeps the state before
the last param change and calls `moved(prev, cur)`, the non-PoP ASes whose PoP (or reachability) differs. For a preset,
the page compares with the defaults (preset 1), so a preset's marks show what its one change does.

## Presets and expected numbers (each asserted in `sim.test.js`)

| # | id | params | expected |
|---|---|---|---|
| 1 | `three-pops` | defaults | 64501 → **ZG** [64500]; 64502 → **VIE** [64500]; 64504 → **FRA** [64500]; 64503 → VIE [64500] (tie with FRA, router ID 192.0.2.20 < 192.0.2.30); 64505 → VIE [64503 64500]. One address, three places. Load: ZG 1, VIE 2, FRA 1 client groups |
| 2 | `withdraw-zg` | `popZG` off | 64501's next-best is [64502 64500] → **VIE**; nobody else moves; moved = [64501]. Load ZG 0, VIE 3, FRA 1 |
| 3 | `nearest-is-not-closest` | defaults | AS64505 sits in Zagreb, but its only neighbour is 64503: its best is [64503 64500] → **VIE**, although ZG is in the same city |
| 4 | `local-pref-wins` | `lpAs64503` 200 | AS64503: [64500] from FRA with LP 200 beats [64500] from VIE with LP 100, equally short → **FRA**; 64505 follows, [64503 64500] → FRA; moved = [64503, 64505]. Load ZG 1, VIE 1, FRA 2 |

**Other combinations** (tested): VIE withdrawn → 64502 holds [64501 64500] and [64503 64500], picks 64501 by router ID →
ZG; 64503 and 64505 → FRA. FRA withdrawn → 64504 → [64503 64500] → VIE. ZG withdrawn and link 64501–64502 down →
64501 has no path. ZG and VIE withdrawn → 64501 → [64502 64503 64500] → FRA. VIE and FRA withdrawn → everyone → ZG,
64504 and 64505 over [64503 64502 64501 64500]. All three withdrawn → nobody has a path. Link 64503–VIE down → 64503
and 64505 → FRA (the same move as preset 4, by losing a path instead of preferring one). LP 200 with link 64503–FRA
down → 64503 stays on VIE (local preference ranks paths, it cannot create one).

## Deviations from the task

- **Preset 3 reaches VIE, not FRA.** With the task's param (local preference at AS64503 towards FRA), preset 4 can
  only change something if AS64503 is not already on FRA at the defaults; so at the defaults AS64503, and AS64505 behind
  it, reach VIE (rule 5's tie). Preset 3's point is unchanged: Zagreb's own PoP is not the one it reaches.
- **`moved` is computed by the page** from the state before the last change (above), not stored in the state: it
  depends on two param sets, not on one.
- **Link toggles** (the task leaves them unnamed): `link64501_64502`, `link64503VIE`, `link64503FRA`.

## Marks

- PoP: hexagon mark (page CSS on the K2 `server` mark), name, AS64500 and 203.0.113.10; a badge with the number of
  client groups it serves. Withdrawn: the K2 `down` card (dashed, hatched, muted) and a "✕ withdrawn" badge.
- AS: client groups as circles (K2 `host`) with the ASN; the transit AS64503 as a rounded square (K2 `router`).
  Each card has a badge "→ PoP" (filled) or "no path" (dashed).
- Links on someone's chosen path: drawn in ink with an arrow beside the link towards the PoP (K2 `active` link and a
  packet without a chip). A failed link: K2 `down` (dashed, cross).
- Moved since the last change: the kit's changed mark on the card and on its row in the side column, and a thick border.
- Side column: one block per non-PoP AS: its stored paths (neighbour, AS path, LP), the best starred, the rule that
  decided, and the PoP it reaches.

## Sources

- RFC 4291 §2 (offline, `~/projects/uvod-u-racunalne-mreze/references/chapter-10/rfc4291.txt`), URM
  `book/chapters/10-ipv6.md` (three kinds of address; anycast to the nearest).
- RFC 4271 (offline, URM references ch11): §5.1.5, §8.2.2, §9.1.1, §9.1.2, §9.1.2.2; via `sims/bgp-path-selection/SPEC.md`.
- URM `book/chapters/11-usmjeravanje.md` "Dinamičko usmjeravanje" (BGP between ASes).
- RFC 4786 (BCP 126) §1, §2, §4.1, §4.4.1: read online (rfc-editor.org), not in the offline references.
- RFC 5398 §4 (documentation ASNs 64496–64511): read online. RFC 5737 (203.0.113.0/24, 192.0.2.0/24): offline, URM
  references ch11.
