# peering-transit: Transit vs peering

| | |
|---|---|
| Task | `peering-transit` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-peering-transit` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/peering-transit/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `internet` / `bgp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `bgp-path-selection` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **who pays whom, tier-1, IXPs**.

The student: connect networks, follow the money and the traffic.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/bgp-path-selection/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course book covers transit and peering. Related: `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` "Dinamičko usmjeravanje" (BGP between autonomous systems)
- L. Gao, "On Inferring Autonomous System Relationships in the Internet", IEEE/ACM Transactions on Networking 9(6), 2001 (customer/peer/provider, valley-free export)
- RFC 7908 "Problem Definition and Classification of BGP Route Leaks" §1–2; RFC 9234 "Route Leak Prevention and Detection Using Roles in UPDATE and OPEN Messages" §1 (relationship roles); RFC 4271 §9.1
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** a small Internet: two tier-1 networks T1 (AS64496) and T2 (AS64497) peering with each other; two regional ISPs R1 (AS64498, customer of T1) and R2 (AS64499, customer of T2); two access ISPs L1 (AS64500, customer of R1) and L2 (AS64501, customer of R2); an Internet exchange point (IXP) where R1 and R2 are both present. Links are drawn by relationship (arrow from customer to provider = "pays", plain line = peering). A money panel shows who pays whom for the L1 ↔ L2 traffic; a traffic panel shows its path.
- **State (explorer):** derived from params: `{ rel: [{ a, b, kind: 'c2p'|'p2p', up }], paths: { pair: [asn…] }, payments: [{ payer, payee, mbps, cost }] }`.
- **What the params drive live:** whether R1 and R2 peer at the IXP, which links are up, traffic volume and the transit price; path and payments recompute.
- **Rules:**
  1. Customer → provider (transit): the customer pays and gets reachability to the whole Internet; the provider announces the customer's routes to everyone (Gao 2001; RFC 9234 §1 role definitions, check).
  2. Peering: two networks exchange traffic **between their own customers** only, usually without payment (settlement-free) (Gao 2001; RFC 7908 §1 terminology, check).
  3. Export ("valley-free") rule: routes learned from a customer are announced to everyone; routes learned from a peer or a provider are announced only to customers (Gao 2001; RFC 7908 §2 defines violations as route leaks).
  4. Route preference: customer route > peer route > provider route, set as local preference (`bgp-path-selection` rule 3), then AS-path length.
  5. A tier-1 network reaches every destination without buying transit (only peers and customers) (check definition source).
  6. Cost model (teaching simplification): each customer pays its provider `price × Mbit/s` carried over that link; peering links cost nothing per Mbit/s (port and IXP fees ignored, stated on the page).
- **Params:** toggle `ixpPeering` (R1–R2), default off; toggles for each link, default up; range `mbps` 100–10000, default 1000; range `price` 0.1–2 €/Mbit/s per month, default 0.5.
- **Presets** (derived from rules 1–6, unchecked):
  1. `transit-only` — L1 → L2 goes L1 → R1 → T1 → T2 → R2 → L2; at 1000 Mbit/s and 0.5 €: L1 pays R1 500 €, R1 pays T1 500 €, L2 pays R2 500 €, R2 pays T2 500 €; T1–T2 peering costs nothing.
  2. `ixp-peering` — R1 and R2 peer: the path becomes L1 → R1 → R2 → L2 (preferred by rule 4); R1 and R2 stop paying T1/T2 for this traffic (−500 € each); L1 and L2 still pay their providers.
  3. `no-free-transit` — with peering on, T2's customer routes are **not** reachable through R2 for R1: R2 does not export its provider's routes to a peer (rule 3); R1 → T2's other customers still goes via T1.
  4. `peering-down` — IXP link fails: traffic falls back to the transit path of preset 1, and the costs come back.
- **Steps:** none (explorer).
- **Legend:** customer→provider arrows with a € badge, peering lines plain with "=", traffic path drawn thick, IXP as a shaded hub; "changed" marks links whose traffic or payment changed with the last param change.
- **Captions:** hr: "R1 i R2 sada se izravno povezuju na IXP-u. Promet L1 ↔ L2 više ne ide kroz T1 i T2, pa R1 i R2 za njega ne plaćaju tranzit." en: "R1 and R2 now peer directly at the IXP. L1 ↔ L2 traffic no longer goes through T1 and T2, so R1 and R2 no longer pay transit for it."
- **Terms:** *transit* — tranzit; *peering* — izravno povezivanje (*peering*, check); *customer / provider* — korisnik / pružatelj usluge; *Internet exchange point (IXP)* — točka razmjene internetskog prometa (check); *tier-1 network* — mreža razine 1 (check); *route leak* — curenje puteva (check).
- **Misconceptions:** "the Internet routes by shortest path" (it routes by business relationship first); "a peer will carry my traffic anywhere"; "a tier-1 network is the biggest one" (it is one that buys no transit).
- **Reuse from `bgp-path-selection`:** the AS graph and the decision process; new here are relationship types, the export rule and the cost panel.
- **Out of scope:** real prices, 95th-percentile billing (mention as "check"), paid peering, CDNs embedded in ISPs, remote peering.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `peering-transit` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh peering-transit sims/peering-transit` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/peering-transit/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
