# win-ipam-discovery: IPAM discovery and provisioning

| | |
|---|---|
| Task | `win-ipam-discovery` (wave 3, IPAM) |
| Catalogue entry | `win-ipam-discovery` in `docs/catalogue.md` §4.5.5 |
| Kind | build a new simulator |
| Folder | `sims/win-ipam-discovery/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `ip-addressing` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ipam-address-plan` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **IPAM finds DHCP, DNS and DC servers and gets access through GPO**.

The student: add servers, provision access, see what IPAM sees.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.5.
5. `sims/win-ipam-address-plan/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Deploy IPAM server" / "Choose an IPAM provisioning method" (Group Policy-based vs manual); "Invoke-IpamGpoProvisioning" (PowerShell; GPO names `<prefix>_DHCP`, `<prefix>_DNS`, `<prefix>_DC_NPS`); "Server inventory and manageability status"; "Group Policy background refresh interval" (90 min with 0–30 min offset; DCs 5 min)

## Model and presets

- **Scene:** left, the domain `corp.example`: DC1 (DC + DNS), DC2 (DC + DNS), DHCP1, DHCP2, and NS-X (a DNS server that isn't Windows). Middle: the IPAM server IPAM1 with its Server Inventory table (server, roles, manageability status, IPAM access status). Right: the GPOs `IPAM1_DC_NPS`, `IPAM1_DHCP`, `IPAM1_DNS` with their links and security filter, and a clock with the next Group Policy refresh.
- **State:** `servers: [{ name, roles, os: windows|other, gpoApplied: bool }]`, `ipam: { domains: [], inventory: [{ server, roles, manageability: unspecified|managed|unmanaged, access: blocked|unblocked }], provisioning: gpo|manual }`, `gpos: [{ name, linked, filter: [server] }]`, `t` (minutes), `log`.
- **One step:** one action or scheduled task: configure discovery, run discovery, run GPO provisioning, set manageability, a Group Policy refresh, run access-status refresh, data collection.
- **Rules:**
  1. IPAM is installed on a domain member that is not a DC (Microsoft, "Deploy IPAM server" (check)).
  2. Discovery finds DCs, DNS, DHCP (and NPS) servers of the configured domains through AD; it finds only Windows servers with those roles (NS-X never appears).
  3. Discovered servers start with manageability "Unspecified"; IPAM manages only servers set to "Managed" (Microsoft, "Server inventory" (check)).
  4. GPO provisioning creates three GPOs named `<prefix>_DHCP`, `<prefix>_DNS`, `<prefix>_DC_NPS`, linked to the domain; setting a server "Managed" adds it to the matching GPO's security filter (check).
  5. A server gets the settings (firewall rules, local group memberships, shares for the DHCP audit log) only after it applies the GPO: on the next background refresh (members every 90 min ± 30, DCs every 5 min) or a forced refresh (Microsoft, "Group Policy background refresh" (check)).
  6. IPAM access status turns "Unblocked" only after the GPO is applied **and** IPAM refreshes server access status; data then arrives with the next collection tasks (e.g. address utilisation every 2 h (check)).
  7. Manual provisioning sets the same items by hand per server; one missed item (e.g. a firewall rule) leaves that role "Blocked" while others work.
  8. Tie-break: a server with two roles (DC1: DC + DNS) needs both GPOs applied for both roles to be unblocked; status is shown per role.
- **Params:** `provisioning` choice GPO / manual (default GPO); `setManaged` toggle (default on); `forceRefresh` button; `skipFirewall` toggle (manual only: DNS firewall rule missing on DC2; default off); `advance` choice +5 min / +90 min (default +5 min).
- **Presets:**
  1. `gpo-happy` — derived, unchecked: configure `corp.example` → discovery lists DC1, DC2, DHCP1, DHCP2 (4 servers, NS-LNX absent) → GPO provisioning → set Managed → DCs unblocked after 5 min, DHCP servers after a forced refresh → data collected.
  2. `not-managed` — derived, unchecked: GPOs exist but DHCP2 left "Unspecified" → not in the security filter → stays Blocked forever.
  3. `wait-for-refresh` — derived, unchecked: no forced refresh: DHCP1 unblocked only after its background refresh (up to 120 min).
  4. `non-windows-dns` — derived, unchecked: NS-X serves `lab.corp.example`; IPAM never sees it; its records are invisible to IPAM.
  5. `manual-miss` — derived, unchecked: manual provisioning, DC2's DNS firewall rule missing → DC2 DC role unblocked, DNS role blocked.
- **Steps:** gpo-happy 8; not-managed 6; wait-for-refresh 6; non-windows-dns 4; manual-miss 6.
- **Legend:** inventory rows with manageability chip (? unspecified, ✓ managed, ✕ unmanaged) and per-role access lock 🔒 blocked / 🔓 unblocked; GPO cards with a link line and filter list; clock with the next refresh. "Changed" marks inventory cells and GPO filters changed in this step.
- **Captions:**
  - hr: "*Discovery* (otkrivanje) je pronašao četiri poslužitelja. Status upravljanja im je „neodređeno” — IPAM s njima još ništa ne radi."
  - en: "Discovery found four servers. Their manageability status is Unspecified; IPAM does nothing with them yet."
  - hr: "GPO postoji i DHCP1 je u filtru, ali politiku još nije primijenio: pristup ostaje blokiran do sljedećeg osvježavanja pravila."
  - en: "The GPO exists and DHCP1 is in its filter, but it hasn't applied the policy yet: access stays blocked until the next policy refresh."
- **Terms:** discovery — otkrivanje; provisioning — priprema pristupa (*provisioning*, check term); manageability status — status upravljanja; access status — status pristupa; Group Policy Object — objekt grupnih pravila (GPO); security filtering — sigurnosno filtriranje; data collection task — zadatak prikupljanja podataka.
- **Misconceptions:** "IPAM sees every DNS and DHCP server on the network" (Windows roles in configured domains only); "provisioning works the moment the GPO is created"; "IPAM needs agents on the servers" (it uses remote management rights granted by GPO).
- **Out of scope:** IPAM role-based access, multi-forest IPAM, the IPAM database (WID vs SQL), utilisation and audit views (`win-ipam-utilisation`, `win-ipam-audit`).
- **Reuse from `win-ipam-address-plan` (soft dependency):** the IPAM server and inventory frame; new: discovery, manageability, GPO provisioning and the refresh clock.
- **Note for the coordinator:** the task's tags include `authentication`, which doesn't fit this concept (IPAM tags elsewhere suggest it was copied across the IPAM rows); `ip-addressing` alone, plus `dhcp`/`dns` where relevant, looks right.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-ipam-discovery` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-ipam-discovery sims/win-ipam-discovery` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ipam-discovery/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
