# route-summarisation: Route summarisation

| | |
|---|---|
| Task | `route-summarisation` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-route-summarisation` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/route-summarisation/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `routing`, `ip-addressing` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `routing-table` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **aggregating contiguous prefixes into one route**.

The student: pick networks, see the summary and what it over-covers.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/routing-table/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/09-podmrezavanje.md` §"CIDR zapis i duljina prefiksa", §"Izrada adresne sheme: postupak i uobičajene pogreške" (step 4, alignment), Primjer 1 (adresna shema za Grafo d.o.o., blocks and the 116-address reserve); diagrams `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch09-vlsm-podjela-24.svg`, `ch09-poravnanje-binarno.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` §"Usmjeravanje" (longest prefix match), Primjer 2; `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/tablica-usmjeravanja.html` (table vocabulary)
- RFC 4632 (CIDR; aggregation sections (check)); RFC 1812 §2.2.5.2
- The book has no summarisation section: numbers derived.
- Catalogue seed: URM ch09

## Model and presets

- **Scene:** an address strip of `192.168.1.0/24` with the Grafo d.o.o. blocks drawn to scale (as `ch09-vlsm-podjela-24.svg`), one toggle per block; under it the summary as a bracket over the strip, its range and the over-covered part hatched. Right, R2's routing table (rule/table view, columns Odredišna mreža / Prefiks / Sljedeći skok) before and after summarising.
- **State:** `{ selected:[blockIds], summary:{net, len, first, last}, covered, overCovered:[{first,last,count}], exact, tableBefore:[], tableAfter:[] }`. Explorer: no steps.
- **What the params drive:** toggling a block recomputes the summary, the over-covered ranges and R2's table live.
- **Rules:**
  1. Summary length = number of leading bits shared by the lowest and the highest address of all selected blocks; summary network = lowest address AND that mask (RFC 4632 §3.1 (check section); book ch09 "CIDR zapis").
  2. A prefix is a valid summary only on an aligned boundary: its network address is a multiple of its size (book ch09 "Izrada adresne sheme", step 4 and `ch09-poravnanje-binarno.svg`).
  3. Exact iff the selected blocks' sizes add up to the summary's size with no gaps; otherwise over-covered = summary size − covered, listed as ranges (derived from rules 1–2).
  4. Duplicate or nested selections count once (tie-break: a block inside another selected block adds no addresses).
  5. One block selected: the summary is that block, exact.
  6. On a router, the more specific route still wins over the summary (longest prefix match, RFC 1812 §2.2.5.2; book ch11 Primjer 2), so over-covering a network that the router reaches another way is harmless there, but sends traffic to the wrong place on routers that only have the summary (marked "risk" when an over-covered range belongs to a block behind another router).
  7. Over-covered addresses that belong to nobody are dropped or looped further on; the page only flags them, it does not route (derived).
- **Params:** one toggle per block: `sales` (.0/26), `prod` (.64/27), `mgmt` (.96/28), `branch` (.112/28), `guest` (.128/29), `link` (.136/30); `plan` choice `grafo | four24`, default `grafo` (`four24` swaps the strip for 172.16.0.0/24 … 172.16.3.0/24).
- **Presets (5):**
  1. `head-office` — R2 summarises the three R1 networks Prodaja + Proizvodnja + Uprava (.0–.111): summary `192.168.1.0/25`, 3 routes → 1, over-covers .112–.127 (16) = Podružnica, which is R2's own connected `/28`, so LPM keeps it safe on R2. Addresses from book ch09 Primjer 1; summary derived.
  2. `exact` — Proizvodnja + Uprava + Podružnica: `192.168.1.64/26`, 32 + 16 + 16 = 64, exact. Derived from book ch09 Primjer 1.
  3. `small` — Gosti + Veza: `192.168.1.128/28`, over-covers .140–.143 (4 unused). Derived.
  4. `all` — all six: `192.168.1.0/24`, over-covers .140–.255 = 116 addresses, the book's reserve. From book ch09 Primjer 1 (116 is the book's number).
  5. `four24` — 172.16.0.0/24 … 172.16.3.0/24: `172.16.0.0/22`, exact; drop 172.16.3.0/24 and the /22 over-covers 256. Derived (standard textbook case).
- **Steps:** none (explorer).
- **Legend:** one series colour + label per block, summary bracket (`--ink`), over-covered range (hatch, `--warn`), "risk" range (hatch + `--danger` + label); "changed" = blocks and table rows changed by the last toggle.
- **Captions:**
  - hr: „Prodaja, Proizvodnja i Uprava sažimaju se u `192.168.1.0/25`: tri zapisa postaju jedan, ali sažetak pokriva i `.112`–`.127` (16 adresa), a to je Podružnica."
  - en: "Sales, Production and Management summarise to `192.168.1.0/25`: three routes become one, but the summary also covers `.112`–`.127` (16 addresses), which is the branch."
- **Terms:** route summarisation — sažimanje puteva (check); summary route — sažeti put (check); prefix length — duljina prefiksa; address block — blok adresa; alignment — poravnanje; longest prefix match — najdulji podudarajući prefiks; routing table — tablica usmjeravanja.
- **Misconceptions:** any contiguous networks summarise exactly; a summary only covers the networks you picked; the summary replaces the more specific routes on every router.
- **Reused from `routing-table`:** the table view, column names and the LPM lookup. New: the address strip, summary arithmetic, over-coverage.
- **Out of scope:** automatic summarisation in routing protocols, IPv6, supernetting history (classful), route aggregation with AS_SET in BGP.
- **Note for the coordinator:** the book has no section or example on summarisation (ch09 covers CIDR and alignment only), so every summary number here is derived; the Croatian term is unchecked.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh route-summarisation sims/route-summarisation` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/route-summarisation/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
