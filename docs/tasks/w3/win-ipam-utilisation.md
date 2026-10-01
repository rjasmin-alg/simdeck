# win-ipam-utilisation: Utilisation and thresholds

| | |
|---|---|
| Task | `win-ipam-utilisation` (wave 3, IPAM) |
| Catalogue entry | `win-ipam-utilisation` in `docs/catalogue.md` §4.5.5 |
| Kind | build a new simulator |
| Folder | `sims/win-ipam-utilisation/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `ip-addressing`, `performance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ipam-address-plan` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **scope fill across servers, alerts before a range runs out**.

The student: let leases grow over a term.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.5.
5. `sims/win-ipam-address-plan/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "IPAM: monitor IP address utilisation" / "Set-IpamConfiguration" (utilisation thresholds; defaults under 20 %, over 80 %); IPAM data collection tasks (AddressUtilization interval)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/18-mrezne-usluge.md`, "Tko dijeli adrese" → "Šire o temi": "Koliko dodjela traje, i zašto to nije proizvoljno" (pool exhaustion, long vs short leases); "Primjer 3 — koliko traje dodjela u učionici"

## Model and presets

- **Scene:** an IPAM-style utilisation view: a table of ranges (scopes) across DHCP1 and DHCP2 — name, server, size, leased, utilisation % with a bar, status (under / optimal / over) — and above it the block `10.0.0.0/16` with its aggregate bar. A week slider (term weeks 0–16) drives the leases; a small trend line per range shows the weeks so far.
- **State:** `week`, `thresholds: { under, over }`, `ranges: [{ name, server, size, residents0, residentGrowth (devices per week), visitorsPerDay, lease (days) }]`, derived `leased[range]`, `util[range]`, `status[range]`, `blockUtil`, `firstOverWeek[range]`.
- **One step:** explorer. The week slider and params recompute every range.
- **Rules:**
  1. Utilisation of a range = leased (incl. reserved) / total addresses; a block's utilisation = sum of its ranges' used / block size (Microsoft, "IPAM address utilisation" (check)).
  2. Status: under-utilised below 20 %, over-utilised above 80 %, optimal in between (IPAM defaults, configurable (check)).
  3. Leased at week w = min(size, residents0 + residentGrowth × w + visitorsPerDay × lease days): residents hold an address all term; each day's visitors (BYOD phones, guests) leave the same day but keep their lease until it expires (derived toy model, unchecked; UL ch18 "Koliko dodjela traje" and Primjer 3: long leases fill the pool with machines that have left).
  4. IPAM sees the numbers only after its address-utilisation collection task runs (every 2 h by default (check)); the view shows "collected at".
  5. A range at 100 % refuses new clients (UL ch18 "skup adresa se iscrpi").
  6. A scope in a failover pair is counted once, not once per server (check).
- **Params:** `week` range 0–16 (default 0); `lease` choice 1 day / 8 days (default 8); `residentGrowth` range 0–20 per week (default 10); `visitors` range 0–30 per day (default 15); `over` range 60–95 % (default 80); `under` range 5–40 % (default 20).
- **Presets:**
  1. `byod-term` — derived, unchecked: student range 200 addresses; 40 residents + 10 per week; 15 visitors a day; lease 8 days → visitors hold 120 leases; week 0: 160 (80 %), week 1: 170 → over-utilised; week 4: 200, full.
  2. `short-lease` — derived, unchecked: same with a 1-day lease → visitors hold 15 → week 0: 55 (28 %); over 80 % at week 11 (165); full at week 15. Same devices, eleven more weeks.
  3. `hidden-hotspot` — derived, unchecked: block `10.0.0.0/16` (65 536 addresses) with 5 700 used in other ranges plus the full student range → (5 700 + 200) / 65 536 = 9 % (under-utilised) while the student range is at 100 %.
  4. `server-vlan-under` — derived, unchecked: server VLAN range 254 addresses, 6 used → 2 %, flagged under-utilised; caption: under-utilised is not a fault, it is planning data.
  5. `threshold-70` — derived, unchecked: preset 2 with the over threshold at 70 % → the alert comes at week 9 (145) instead of week 11.
- **Steps:** none (explorer).
- **Legend:** utilisation bars with threshold ticks at under/over and a status chip with text (Under, Optimal, Over) and shape (▽, ○, △); the block aggregate bar above; trend sparklines. "Changed" marks ranges whose status changed with the last param.
- **Captions:**
  - hr: "Tjedan 11: studentski raspon prelazi 80 % i IPAM ga označava kao *over-utilized* (prepunjen) — četiri tjedna prije nego što se napuni."
  - en: "Week 11: the student range crosses 80 % and IPAM marks it over-utilized, four weeks before it is full."
  - hr: "Cijeli blok je iskorišten 9 % — a jedan raspon u njemu je pun. Zbroj skriva vruće mjesto."
  - en: "The whole block is 9 % used, and one range in it is full. The total hides the hot spot."
- **Terms:** utilisation — iskorištenost; threshold — prag; over-utilised / under-utilised — prepunjen / nedovoljno iskorišten (check terms); address pool — skup adresa (UL ch18); lease duration — trajanje dodjele (UL ch18); trend — trend.
- **Misconceptions:** "utilisation counts devices that are on now" (it counts leases, including those of devices long gone); "a healthy block means healthy ranges"; "an alert means the range is full".
- **Out of scope:** capacity planning beyond one term, IPv6 utilisation, IPAM's address-expiry alerts for static assignments, discovery (`win-ipam-discovery`).
- **Reuse from `win-ipam-address-plan` (soft dependency):** block and range objects; new: lease growth over weeks, thresholds and status.
- **Note for the coordinator:** the task's tags include `authentication`, which doesn't fit this concept (IPAM tags elsewhere suggest it was copied across the IPAM rows); `ip-addressing` alone, plus `dhcp`/`dns` where relevant, looks right.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ipam-utilisation sims/win-ipam-utilisation` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ipam-utilisation/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
