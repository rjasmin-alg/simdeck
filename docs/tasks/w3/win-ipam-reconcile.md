# win-ipam-reconcile: IPAM vs reality

| | |
|---|---|
| Task | `win-ipam-reconcile` (wave 3, IPAM) |
| Catalogue entry | `win-ipam-reconcile` in `docs/catalogue.md` §4.5.5 |
| Kind | build a new simulator |
| Folder | `sims/win-ipam-reconcile/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `ip-addressing` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ipam-address-plan` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **records drift from the DHCP and DNS servers; stale reservations, overlapping ranges**.

The student: make changes outside IPAM, reconcile.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.5.
5. `sims/win-ipam-address-plan/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "IPAM: manage IP addresses" (DNS record status, reservation status, "Reconcile IP address inconsistencies"); "IPAM data collection tasks" (schedules); "Manage IP address blocks and ranges" (overlapping ranges, address spaces)

## Model and presets

- **Scene:** three columns side by side for one range `10.0.10.0/24`: what IPAM records (address inventory, reservations, ranges), what the DHCP servers hold (scopes, reservations, leases), what DNS holds (A and PTR). Rows are addresses or ranges; a status column shows IPAM's verdict (consistent, mismatch, not found, overlap). A clock shows the next IPAM collection run; an action bar holds "change outside IPAM" actions and "reconcile".
- **State:** `ipam: { ranges, addresses: [{ ip, host, mac, assignment: static|reserved|dynamic, dnsStatus, reservationStatus }] }`, `dhcp: [{ server, scopes: [{ from, to }], reservations: [{ ip, mac }], leases }]`, `dns: [{ name, type, data }]`, `lastCollection`, `t` (hours), `log`.
- **One step:** one event: an admin change made directly on DHCP or DNS, an IPAM collection run, or a reconcile action.
- **Rules:**
  1. Changes made directly on the DHCP or DNS server are not in IPAM until its next collection run (every few hours, task-dependent (check)); until then IPAM shows the old state as if it were true.
  2. After a run, IPAM compares its inventory with the servers: an address recorded with a host name whose A/PTR record is missing or different shows a DNS status of "not found" / "mismatch" (check status names).
  3. A reservation in IPAM that the DHCP server lacks, or the other way round, shows a reservation status mismatch (check).
  4. Two ranges in one address space that overlap are flagged; scopes in a failover relationship are one range, not an overlap (check).
  5. Reconcile pushes one side to match the other: the admin chooses the source of truth. Reconciling "IPAM → server" undoes a correct field change; "server → IPAM" records a wrong one.
  6. A stale reservation (MAC never seen in any lease for N days) is not an error IPAM raises by itself; it is visible only by comparing reservations with lease history (derived).
  7. Tie-break: if both IPAM and the server changed the same row between runs, IPAM shows a mismatch and changes nothing until the admin chooses.
- **Params:** `action` choice: reservation added on DHCP1 / A record changed by hand / overlapping scope on DHCP2 / printer retired (default reservation added); `collect` button (run collection now); `reconcileDirection` choice IPAM → server / server → IPAM (default server → IPAM).
- **Presets:**
  1. `outside-change` — derived, unchecked: technician adds reservation `10.0.10.45` for a camera directly on DHCP1 at 10:00 → IPAM unaware until the run at 12:00 → then listed as reserved.
  2. `dns-mismatch` — derived, unchecked: IPAM has PRN-2 `10.0.10.20` static; someone changes `prn-2 A` to `10.0.10.21` → after the run: DNS status mismatch; reconcile IPAM → DNS restores `.20`.
  3. `overlap` — derived, unchecked: DHCP2 gets scope range `.100–.150` while DHCP1 serves `.50–.200` (no failover) → after the run IPAM flags the overlap; two servers may lease the same address.
  4. `stale-reservation` — derived, unchecked: PRN-9 retired 60 days ago; its reservation `10.0.10.30` stays everywhere and counts as used in utilisation; no flag until compared with leases.
  5. `wrong-direction` — derived, unchecked: preset 2 reconciled server → IPAM → IPAM now records `.21`, and the printer at `.20` is unreachable by name everywhere.
- **Steps:** outside-change 4; dns-mismatch 5; overlap 4; stale-reservation 4; wrong-direction 5.
- **Legend:** status chips ✓ consistent / ≠ mismatch / ? not found / ⧉ overlap / ⌛ not yet collected; columns labelled IPAM / DHCP / DNS; the "source of truth" arrow on reconcile. "Changed" marks the rows changed by the event in this step.
- **Captions:**
  - hr: "Rezervacija je dodana izravno na DHCP1. IPAM to ne zna sve do sljedećeg prikupljanja podataka u 12:00."
  - en: "The reservation was added directly on DHCP1. IPAM doesn't know until its next data collection at 12:00."
  - hr: "*Reconcile* (usklađivanje) ne zna što je točno: kopira jednu stranu na drugu, a stranu bira administrator."
  - en: "Reconcile doesn't know which side is right: it copies one side onto the other, and the admin picks the side."
- **Terms:** reconcile — usklađivanje; inventory — popis (inventar) adresa; source of truth — izvor istine (mjerodavni izvor); mismatch — neslaganje; overlapping ranges — preklapajući rasponi; stale reservation — zastarjela rezervacija; data collection — prikupljanje podataka.
- **Misconceptions:** "IPAM is live" (it is a periodic copy); "reconcile fixes the error" (it copies a side); "no flag means no problem" (stale reservations).
- **Out of scope:** IPAM role-based access and change auditing, IPv6, multiple address spaces, discovery (`win-ipam-discovery`).
- **Reuse from `win-ipam-address-plan` (soft dependency):** block/range objects; new: the three-way comparison, collection runs and reconcile.
- **Note for the coordinator:** the task's tags include `authentication`, which doesn't fit this concept (it seems copied across the IPAM rows); `ip-addressing` (plus `dhcp`/`dns`) looks right.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ipam-reconcile sims/win-ipam-reconcile` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ipam-reconcile/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
