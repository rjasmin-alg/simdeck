# win-dns-scavenging: Aging and scavenging

| | |
|---|---|
| Task | `win-dns-scavenging` (wave 3, DNS on Windows Server) |
| Catalogue entry | `win-dns-scavenging` in `docs/catalogue.md` §4.5.3 |
| Kind | build a new simulator |
| Folder | `sims/win-dns-scavenging/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `dns` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-dns-dynamic-update` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **timestamps, no-refresh and refresh intervals, which stale records disappear and when**.

The student: run months of client activity, enable scavenging.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.3.
5. `sims/win-dns-dynamic-update/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Understanding Aging and Scavenging" (Windows Server DNS: no-refresh and refresh intervals, timestamps, "zone can be scavenged after"); "Set-DnsServerZoneAging" and "Set-DnsServerScavenging" (PowerShell; defaults 7 days); Ask the Directory Services Team blog, "Don't be afraid of DNS Scavenging. Just be patient."
- Catalogue seed: → §5.21

## Overlaps (catalogue §5)

- **§5.4 DNS:** Resolution and TTL can share one page with two modes, but each is a full 3–5 minute demo, so keep two pages on one model. Secondary expiry and split-brain are presets of one "zone servers over time" page.
- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** a timeline of days (0–60) with one row per record of `corp.example`; each row shows the record's timestamp marker, its no-refresh window, its refresh window and the point after which it is stale; scavenging runs are vertical lines. Side panel: zone aging settings, server scavenging setting, and a log of refreshes accepted/ignored and records deleted.
- **State:** `day`, `zone: { aging: bool, noRefresh, refresh, agingEnabledAt }`, `server: { scavenging: bool, period, lastRun }`, `records: [{ name, ip, timestamp (0 = static), source: client|dhcp|manual, alive }]`, `clients: [{ name, refreshEvery, leavesAt, changesIpAt }]`, `log`.
- **One step:** advance to the next event of interest (a refresh that changes a timestamp, an IP change, a client leaving, a scavenging run). Phases inside a step: (1) client refreshes and updates due by that day; (2) the scavenging run, if one is due.
- **Rules:**
  1. Static records (timestamp 0) are never scavenged; a manual record with "Delete this record when it becomes stale" gets a timestamp and ages like a dynamic one (Microsoft, "Understanding aging and scavenging" (check)).
  2. A refresh (same data) during the no-refresh interval (`now < ts + noRefresh`) does **not** change the timestamp; after it, the refresh sets `ts = now` (same source).
  3. An update (data changed, e.g. a new IP) always sets `ts = now`, even in the no-refresh interval.
  4. A record is stale when `now > ts + noRefresh + refresh` (strictly greater).
  5. Records are deleted only by a scavenging run on a server that has scavenging enabled; runs happen every `period` days after it is enabled. Zone aging alone deletes nothing.
  6. The zone may be scavenged only from `agingEnabledAt + refresh` on (the "zone can be scavenged after" time) (check).
  7. Defaults: no-refresh 7 days, refresh 7 days, scavenging period 7 days (Microsoft defaults (check)).
  8. Clients: a Windows client refreshes its own record every 24 h (check); a DHCP-registered record is refreshed when the lease renews (every half lease: 4 days for the 8-day default).
  9. Safe-setting rule shown on the page: `refresh` must be longer than the longest refresh period of any client (24 h or half the lease); otherwise live records get scavenged.
- **Params:** `noRefresh` range 1–14 days (default 7); `refresh` range 1–14 days (default 7); `period` range 1–7 days (default 7); `serverScavenging` toggle (default on); `aging` toggle (default on); `lease` choice 1 / 8 days (default 8).
- **Presets:**
  1. `defaults` — derived, unchecked: 7/7/7 enabled on day 0; PC1 online daily, PC2 registers day 0 and leaves day 1. PC1's timestamp moves on days 7, 14, 21. Runs on days 7, 14, 21: day 14 PC2 is not yet stale (0 + 14 is not > 14), day 21 PC2 is deleted — **20 days after it left**. 8 steps.
  2. `too-aggressive` — derived, unchecked: 1/1/1 days; printer PRN4 is DHCP-registered, lease 8 days, refreshed every 4 days. Stale after day 2 → deleted at the day-3 run; back at renewal on day 4. Name missing day 3–4, again day 7–8.
  3. `static-survives` — derived, unchecked: `fs1` static and `old-nas` manual with "delete when stale" (created day 0) → `fs1` stays forever, `old-nas` deleted on day 21.
  4. `aging-only` — derived, unchecked: zone aging on, server scavenging off → PC2 still present on day 60; the classic "we enabled scavenging" mistake.
  5. `ip-change` — derived, unchecked: PC1 changes IP on day 3 (in its no-refresh window) → timestamp becomes 3 at once (rule 3), next accepted refresh day 10.
- **Steps:** defaults 8; too-aggressive 8; static-survives 6; aging-only 6; ip-change 6.
- **Legend:** per row: timestamp ●, no-refresh band (hatched), refresh band (dotted), stale zone (cross-hatched), deleted ✕; static records marked 🔒 with no bands; scavenging runs as dashed vertical lines with a broom label "run". "Changed" marks rows whose timestamp moved or which were deleted in this step.
- **Captions:**
  - hr: "Dan 7: PC1 osvježava zapis i *timestamp* (vremenska oznaka) se pomiče na 7 — prvo osvježavanje nakon intervala bez osvježavanja."
  - en: "Day 7: PC1 refreshes its record and the timestamp moves to 7, the first refresh after the no-refresh interval."
  - hr: "Dan 21: PC2 je otišao prije 20 dana i tek ga sada brisanje zastarjelih zapisa uklanja: 0 + 7 + 7 < 21."
  - en: "Day 21: PC2 left 20 days ago, and only now does scavenging remove it: 0 + 7 + 7 < 21."
- **Terms:** aging — starenje zapisa; scavenging — brisanje zastarjelih zapisa (*scavenging*, check term); timestamp — vremenska oznaka; no-refresh interval — interval bez osvježavanja; refresh interval — interval osvježavanja; stale record — zastarjeli zapis; static record — statički zapis.
- **Misconceptions:** "turning on aging on the zone cleans it" (a server must scavenge); "a record disappears as soon as the machine is gone" (up to no-refresh + refresh + period later); "shorter intervals are always better" (live DHCP records vanish).
- **Out of scope:** AD tombstones of deleted records, replication of timestamps between DCs, DHCP lease cleanup (`win-dhcp-dns-update`), PTR zones.
- **Reuse from `win-dns-dynamic-update` (soft dependency):** the record table and the client registration events; new: timestamps, the two intervals, the scavenging run and the day timeline.
- **Note for the coordinator:** §5.21 puts this page, `win-dhcp-dns-update` and `win-dns-scavenging` on one record-lifecycle model (records with owner, timestamp, data). Whoever builds first should put that model where the others can copy it (COMMON.md §6), with fields `{ name, type, data, owner, timestamp, static }`.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dns-scavenging sims/win-dns-scavenging` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dns-scavenging/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
