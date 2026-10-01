# win-ipam-address-plan: Planning the address space

| | |
|---|---|
| Task | `win-ipam-address-plan` (wave 2b, IPAM) |
| Catalogue entry | `win-ipam-address-plan` in `docs/catalogue.md` §4.5.5 |
| Kind | build a new simulator |
| Folder | `sims/win-ipam-address-plan/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | WIN1, URM |
| Topic / tags / level | `windows-admin` / `ip-addressing` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **blocks → ranges → addresses for sites and VLANs, with room to grow**.

The student: allocate a block to sites, run out, re-plan.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.5.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/09-podmrezavanje.md` (Uvod u računalne mreže), sections "VLSM: različita veličina svake podmreže", "Izrada adresne sheme: postupak i uobičajene pogreške", "Primjer 1: adresna shema za Grafo d.o.o.", "Primjer 2: kad prostor ne stane"; diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch09-vlsm-podjela-24.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/12-izgradnja-mreze.md`, "Primjer 3: proširite mrežu sami" (Nabava, 4 hosts)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vlsm.html` (the `urm-vlsm` card whose arithmetic is reused)
- Microsoft, "IP Address Management (IPAM)" overview; "Manage IP address blocks and ranges" / "Add-IpamBlock", "Add-IpamRange" (PowerShell)
- RFC 1918 (private blocks); RFC 4632 (CIDR)
- Catalogue seed: urm-vlsm → §5.21

## Overlaps (catalogue §5)

- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** kit view K4 rule table, with a bar like URM's `ch09-vlsm-podjela-24.svg`. Top: the IP address block as a horizontal bar, each range a segment whose width is its size, free space hatched. Below: IPAM's tree Block → Ranges → (sample) Addresses as a table: range, prefix, mask, total, usable, site/VLAN, "managed by", utilisation. A needs table on the right (site/VLAN, hosts, growth).
- **State:** `block: { prefix }`, `needs: [{ name, site, vlan, hosts }]`, `growth` (percent), `strategy: largestFirst|asListed`, derived `ranges: [{ name, network, prefixLen, total, usable, start, end }]`, `free: [[from, to]]`, `fits: bool`, `errors`.
- **One step:** explorer. Every param change recomputes the plan from scratch with the chosen strategy.
- **Rules:**
  1. Hosts needed per range = `ceil(hosts × (1 + growth))`; the range is the smallest prefix with `2^(32−n) − 2 ≥ needed` (URM ch09 Primjer 1, Korak 1).
  2. Largest first; each range starts at the next address that is a multiple of its own size (URM ch09 Primjer 1, Korak 2). "As listed" keeps the order given and shows the alignment gaps it creates.
  3. Ranges never overlap and all lie inside the block (URM ch09; IPAM rejects a range outside any block and flags overlapping ranges in one address space (check)).
  4. If the sum of range sizes exceeds the block, or alignment leaves no fitting gap, the plan "doesn't fit": the first range that can't be placed is marked (URM ch09 Primjer 2 shows the fixed-mask version of the same failure).
  5. IPAM hierarchy: a block (e.g. a private RFC 1918 block) contains ranges; a range is what a DHCP scope or a static pool maps to; addresses live in ranges (Microsoft, "Manage IP address blocks and ranges" (check)).
  6. /30 for router links (2 usable); /31 per RFC 3021 is out of scope here (URM ch09 Primjer 3 covers it).
- **Params:** `block` choice `192.168.1.0/24` / `10.20.0.0/16` (default /24); `growth` range 0–200 % step 25 (default 0); `nabava` toggle (adds Nabava, 4 hosts; default off); `strategy` choice largest first / as listed (default largest first); `needsSet` choice Grafo / two sites (default Grafo).
- **Presets:**
  1. `grafo` — from URM ch09 Primjer 1: `192.168.1.0/24`; Prodaja /26 `.0–.63`, Proizvodnja /27 `.64–.95`, Uprava /28 `.96–.111`, Podružnica /28 `.112–.127`, Gosti /29 `.128–.135`, R1–R2 /30 `.136–.139`; free `.140–.255` = 116 addresses.
  2. `add-nabava` — derived, unchecked (the question of URM ch12 Primjer 3): Nabava 4 hosts → /29; next multiple of 8 after `.139` is `.144` → `.144–.151`; gap `.140–.143` (4) stays free; total free 108.
  3. `double-growth` — derived, unchecked: growth 100 % → /25, /26, /27, /27, /28, /30 = 128 + 64 + 32 + 32 + 16 + 4 = 276 > 256 → doesn't fit; Gosti is the first range that can't be placed. Re-plan: choose `10.20.0.0/16`.
  4. `as-listed` — derived, unchecked: Grafo needs in the order Gosti, Prodaja, … with "as listed": Gosti `.0–.7`, Prodaja must start at `.64` → 56 addresses wasted before it; compare with preset 1.
  5. `two-sites` — derived, unchecked: `10.20.0.0/16`, Zagreb 6 VLANs of 200 hosts (/24 each) and Split 3 VLANs of 100 hosts (/25 each): Zagreb `10.20.0.0–10.20.5.255`, Split `10.20.6.0–10.20.7.127`; free from `10.20.7.128`.
- **Steps:** none (explorer).
- **Legend:** block bar with ranges as labelled segments (name + prefix inside, so colour is not the carrier), free space hatched, alignment gaps dotted; the "doesn't fit" range outlined with ✕. "Changed" marks ranges whose position or size changed with the last param.
- **Captions:**
  - hr: "Najveći prvi, svaki blok poravnat na vlastitu veličinu: Prodaja /26 od .0, Proizvodnja /27 od .64 … Slobodno ostaje 116 adresa, od .140 do .255."
  - en: "Largest first, each block aligned on its own size: Sales /26 from .0, Production /27 from .64 … 116 addresses stay free, .140 to .255."
  - hr: "Nabava traži /29, a .140 nije višekratnik od 8 — raspon počinje na .144 i ostavlja rupu od četiri adrese."
  - en: "Purchasing needs a /29, and .140 isn't a multiple of 8, so the range starts at .144 and leaves a four-address gap."
- **Terms:** IP address block — adresni blok; IP address range — raspon adresa; prefix length — duljina prefiksa (URM ch09); VLSM — VLSM (URM ch09); address plan — adresna shema (URM ch09); room for growth — prostor za rast (URM ch09); alignment — poravnanje.
- **Misconceptions:** "any free gap of the right size will do" (alignment); "plan exactly for today's hosts" (the /29 for guests is full on day one, URM ch09); "IPAM allocates addresses for you" (it records the plan; DHCP hands them out).
- **Out of scope:** IPv6 planning, IPAM discovery and utilisation collection (`win-ipam-discovery`, `win-ipam-utilisation`), route summarisation, /31 links.
- **Reuse from `urm-vlsm` (catalogue §5.21):** the prefix and aligned-allocation arithmetic of `vlsm.html` (copy per COMMON.md §6); new: the IPAM block/range hierarchy, growth and the "doesn't fit" case.
- **Note for the coordinator:** the task's tags include `authentication`, which doesn't fit this concept (IPAM tags elsewhere suggest it was copied across the IPAM rows); `ip-addressing` alone, plus `dhcp`/`dns` where relevant, looks right.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ipam-address-plan sims/win-ipam-address-plan` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ipam-address-plan/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
