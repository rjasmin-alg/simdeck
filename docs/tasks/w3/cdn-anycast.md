# cdn-anycast: Anycast and CDN edges

| | |
|---|---|
| Task | `cdn-anycast` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-cdn-anycast` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/cdn-anycast/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `internet` / `bgp`, `http` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `bgp-path-selection` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **one address, many places; BGP picks the nearest**.

The student: move clients, withdraw a site.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/bgp-path-selection/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/10-ipv6.md` (unicast, anycast, multicast: anycast delivered to the nearest interface; RFC 4291 §2)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` "Dinamičko usmjeravanje" (BGP between autonomous systems, RFC 4271)
- RFC 4786 "Operation of Anycast Services" (BCP 126) §2, §4; RFC 4271 §9.1 (decision process); RFC 5398 (documentation ASNs); RFC 5737 (documentation IPv4 prefixes)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** kit view K2 topology: a CDN network AS64500 with three edge sites (PoPs) ZG, VIE, FRA, all announcing the same prefix 203.0.113.0/24 and serving the same address 203.0.113.10; transit and access ASes (AS64501–AS64505) between them and four client groups. Each client group shows the AS path it selected and which PoP it reaches; links can be failed and PoPs withdrawn.
- **State (explorer):** derived from params: `{ announcements: [{ pop, up }], links: [{ a, b, up }], best: { clientAs: { path: [asn…], pop } }, moved: [clientAs] }` (the BGP best-path computation is copied from `bgp-path-selection`).
- **What the params drive live:** which PoPs announce, which links are up, and one AS's local preference; every client's chosen PoP recomputes at once.
- **Rules:**
  1. An anycast address identifies a set of interfaces; a packet goes to the "nearest" one (URM ch10, RFC 4291 §2 for IPv6; for IPv4 the same effect comes from announcing one prefix from many places, RFC 4786 §2, check).
  2. "Nearest" is the best BGP path as each AS sees it, not the shortest distance in km: highest local preference, then shortest AS path, then the tie-breaks of `bgp-path-selection` (RFC 4271 §9.1).
  3. Withdrawing a PoP's announcement makes its clients move to their next-best path; the address does not change (RFC 4786 §4, check).
  4. A client's flow may move to another PoP when paths change; for short HTTP requests that is harmless, for long TCP sessions the new PoP has no connection state (RFC 4786 §4.4, check).
  5. Tie-break: equal AS path length → lowest neighbour router ID (from `bgp-path-selection`).
- **Params:** toggles `popZG`, `popVIE`, `popFRA`, default all on; toggles for 3 named links, default on; choice `lpAs64503` (local preference towards FRA) 100/200, default 100.
- **Presets** (topology derived, unchecked; use RFC 5398 documentation ASNs and RFC 5737 prefixes):
  1. `three-pops` — clients in AS64501 (Zagreb ISP) reach ZG with path [64500]; AS64502 (Vienna) reaches VIE; AS64504 reaches FRA. One address, three places.
  2. `withdraw-zg` — ZG withdraws: AS64501's next-best path is [64502 64500] → VIE; nothing on the client changes.
  3. `nearest-is-not-closest` — AS64505 sits in Zagreb but buys transit only from AS64503, which connects to FRA: its best path is [64503 64500] to FRA although ZG is physically closer.
  4. `local-pref-wins` — AS64503 sets local preference 200 on FRA: its customers go to FRA even where VIE has an equally short path.
- **Steps:** none (explorer).
- **Legend:** PoPs as hexagons with labels, client ASes as circles labelled with their ASN, chosen path drawn thick with arrows, withdrawn PoP crossed and hatched; "changed" marks client groups whose PoP changed with the last param change.
- **Captions:** hr: "ZG je povukao najavu 203.0.113.0/24. Korisnici AS64501 sada idu na VIE putem [64502 64500]; adresa 203.0.113.10 ostala je ista." en: "ZG withdrew 203.0.113.0/24. Users in AS64501 now reach VIE via [64502 64500]; the address 203.0.113.10 is unchanged."
- **Terms:** *anycast address* — *anycast* adresa (URM ch10 keeps the English word); *point of presence (PoP)* — točka prisutnosti; *announcement / withdrawal* — najava / povlačenje; *autonomous system* — autonomni sustav; *AS path* — AS put; *edge server* — rubni poslužitelj.
- **Misconceptions:** "anycast picks the geographically nearest site"; "a CDN failover needs DNS changes"; "anycast load-balances evenly".
- **Reuse from `bgp-path-selection`:** the AS graph, announcement propagation and the best-path function; new here is one prefix originated at several PoPs of one AS.
- **Out of scope:** DNS-based CDN steering (GeoDNS), caching at the edge (`http-caching`), TCP session handling on path change, iBGP inside the CDN.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `cdn-anycast` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh cdn-anycast sims/cdn-anycast` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cdn-anycast/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
