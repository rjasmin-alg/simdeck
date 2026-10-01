# win-sysvol-dfsr: SYSVOL replication

| | |
|---|---|
| Task | `win-sysvol-dfsr` (wave 3, Active Directory) |
| Catalogue entry | `win-sysvol-dfsr` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-sysvol-dfsr/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `active-directory` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ad-replication` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **GPO version in AD vs in SYSVOL; a GPO that half-arrived at a branch**.

The student: edit a GPO, cut the link to a site.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-ad-replication/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.21
- Microsoft Learn: "Group Policy architecture" (GPC and GPT); "SYSVOL replication migration guide: FRS to DFS Replication"
- [MS-GPOL] Group Policy: Core Protocol (GPC/GPT, `versionNumber`: user version in the high 16 bits, computer version in the low 16 bits)
- `/home/rjasmin/projects/topologydrafter/js/samples.js` (sample `two-sites`: HQ and Branch over an IPsec tunnel)

## Overlaps (catalogue §5)

- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** two DCs, `DC01` (HQ, PDC emulator) and writable `DC03` at Branch (topologydrafter `two-sites` has `RODC01` there; it would do for every preset except `two-editors`), linked by the WAN with a cut switch. Each DC shows the GPO "Drive Maps" in two halves: GPC (in AD: `CN={GUID},CN=Policies,CN=System`, attribute `versionNumber`) and GPT (in SYSVOL: `\Policies\{GUID}\GPT.INI` `Version=` and `Registry.pol`/`Drives.xml`). Two pipes between the DCs: AD replication (carries GPC) and DFSR (carries GPT). A branch client `PC-B` shows the version it last applied.
- **State:** `{ t, wan, dcs: { id: { gpc: { ver }, gpt: { ver, content } } }, inflight: { ad: [], dfsr: [] }, client: { applied: { ver, content }, report: null|'mismatch' } }`.
- **One step:** one event: an edit, an AD replication delivery, a DFSR delivery, a WAN cut/restore, or a client refresh.
- **Rules:**
  1. A GPO is two objects: the GPC in the directory (replicated by AD replication) and the GPT folder in SYSVOL (replicated by DFSR, independently) (Microsoft: "Group Policy architecture"; [MS-GPOL] §2.2).
  2. GPMC edits on the PDC emulator by default; each save bumps both versions together on that DC.
  3. `versionNumber` = user version × 65536 + computer version; a computer-settings edit adds 1 ([MS-GPOL] (check section)).
  4. AD replication and DFSR arrive at different times; a WAN cut can leave a DC with the new GPC and the old GPT, or the reverse.
  5. The client reads the GPC version from its DC and the files from that DC's SYSVOL; if the GPC version is newer than what it applied, it processes the GPO with whatever files are there (check: client behaviour on mismatch). With old files it applies old settings and records the new version, so it may not reprocess when the files arrive later — until the next version bump or a forced refresh (check).
  6. The management console's status view shows "AD / SYSVOL version mismatch" for that DC (Microsoft: GPMC infrastructure status, Windows Server 2012+ (check)).
  7. Two admins saving the same GPO on two DCs before DFSR syncs: DFSR keeps the last writer's file and moves the other to `ConflictAndDeleted` (check).
- **Params:** `wanCutAt` choice {never, after AD, after DFSR} default never; `adDelay` range 1–10 ticks default 2; `dfsrDelay` range 1–10 ticks default 4.
- **Presets (4):**
  - `normal` — edit drive maps on DC01: GPC 5→6 and GPT 5→6 on DC01; AD replication at tick 2, DFSR at tick 4; client refresh at tick 5 applies v6. 5 steps. Derived, unchecked.
  - `half-arrived` — WAN cut after the GPC arrives (tick 2) and before DFSR: Branch DC has GPC 6, GPT 5; PC-B applies old drive maps and records v6; GPMC shows mismatch. WAN back, files arrive, PC-B stays on old settings until `gpupdate /force`. 8 steps.
  - `files-first` — DFSR faster than AD: GPT 6, GPC 5 at Branch → client sees no new version, keeps v5 until the GPC arrives. 6 steps.
  - `two-editors` — admins on DC01 and DC03 save at the same tick: one `Drives.xml` wins, the other goes to ConflictAndDeleted (check). 5 steps.
- **Steps:** max 8.
- **Legend:** GPC half (cylinder), GPT half (folder), AD replication pipe (solid), DFSR pipe (dashed), version badge, mismatch (≠ sign); "changed" highlight marks halves whose version changed this step.
- **Captions:** hr: "Na DC-u u Branchu GPC je verzija 6, a GPT još 5: GPO je stigao napola." en: "On the Branch DC the GPC is version 6 but the GPT is still 5: the GPO has half-arrived."
  hr: "*SYSVOL* replicira DFSR, a ne replikacija AD-a — dva puta, dva vremena." en: "SYSVOL is replicated by DFSR, not by AD replication — two paths, two timings."
- **Terms (check):** Group Policy container — spremnik pravila grupe (GPC); Group Policy template — predložak pravila grupe (GPT); version number — broj verzije; DFS Replication — DFS replikacija; mismatch — nepodudaranje; replication — replikacija.
- **Misconceptions:** a GPO is one thing that replicates as a unit; editing on any DC is the same; a version mismatch fixes itself without trace.
- **Out of scope:** FRS-to-DFSR migration, authoritative SYSVOL restore (D4 / `msDFSR-Options`), DFSR schedules and staging quota, GPO precedence.
- **Builds on `win-ad-replication`:** reuses its DC cards and the AD replication pipe; new is the second, independent DFSR pipe.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-sysvol-dfsr sims/win-sysvol-dfsr` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-sysvol-dfsr/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
