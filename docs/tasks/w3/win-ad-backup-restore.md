# win-ad-backup-restore: Restoring a DC, and USN rollback

| | |
|---|---|
| Task | `win-ad-backup-restore` (wave 3, Active Directory) |
| Catalogue entry | `win-ad-backup-restore` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-ad-backup-restore/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | WIN2, DR |
| Topic / tags / level | `windows-admin` / `active-directory`, `backup` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ad-replication` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **non-authoritative vs authoritative restore; reverting a DC snapshot silently breaks replication**.

The student: restore a DC each way, revert a VM snapshot.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-ad-replication/` (the model this one builds on) and its `NOTES.md`.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.21 (sto-backing-chains)
- Microsoft Learn: "Detecting and recovering from a USN rollback in Windows Server" (event 2095, Netlogon paused) (check title); "Virtualized domain controller architecture" (VM-Generation ID safeguards); "Performing an authoritative restore of Active Directory objects"; "Performing a nonauthoritative restore of AD DS" (check title)
- `~/projects/dr-lecture-estate/instructor/scenarios/S15.md` (USN rollback trap; whole-VM images 2026-08-16 to 09-13) and `~/projects/dr-lecture-estate/instructor/caveats.md` CV-66
- `docs/tasks/w2/win-ad-replication.md` (model reused)

## Overlaps (catalogue §5)

- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** two DCs, `qm-dc01` and `qm-dc02` (estate), each with a K3-style strip of its own USN range (cells = blocks of 100 USNs: committed, replicated to partner, never replicated), its invocationID, and the partner's up-to-dateness vector entry for it. A backup/snapshot shelf under each DC. A "replication health" lamp that stays green in the bad case — that is the point.
- **State:** `{ dcs: { id: { usn, invocationId, objects: {}, netlogonPaused } }, utd: { dst: { srcInvId: usn } }, hwm: { dst: { src: usn } }, shelf: [{ dc, kind: 'systemstate'|'vm-snapshot', usn, invocationId, day }], vmGenId: bool, log: [] }`.
- **One step:** one event (writes, a pull, take a backup/snapshot, restore one way, revert) and the USN strips and vectors after it.
- **Rules (Microsoft: "Detecting and recovering from a USN rollback in Windows Server"; "Virtualized domain controller architecture"; "Performing an authoritative restore of Active Directory objects"):**
  1. Partners pull changes above their high watermark for the source (from `win-ad-replication` rule 2) and filter by UTD per invocationID (rule 3 there).
  2. Non-authoritative restore (supported system-state backup, restored in DSRM): the DC gets a new invocationID, so partners see a "new" source and it pulls everything newer than the backup from them; its own old changes are not re-sent. Result: converges, deleted objects stay deleted.
  3. Authoritative restore: after the non-authoritative restore, an authoritative restore of a subtree raises those objects' version numbers (by 100,000 per day since the backup, default (check)) so they win over later changes, including deletions, on every DC.
  4. VM snapshot revert without safeguards: the DC's USN goes back but its invocationID stays the same. Partners' HWM/UTD for that invocationID are already higher, so its new changes with USNs ≤ those values are never pulled — silent divergence.
  5. Detection: when a partner notices the DC's USNs went backwards it logs event 2095 and the reverted DC pauses Netlogon and goes into "DSA not writable" (check: which side logs 2095 and when).
  6. With VM-Generation ID (Windows Server 2012+ DC on a hypervisor that exposes it) the DC detects the revert at boot, resets its invocationID and discards its RID pool → behaves like rule 2 (check: the estate's hypervisor exposes it only if configured).
  7. Recovery from USN rollback: demote/rebuild the DC (forced removal + metadata cleanup), not "force replication".
- **Params:** `vmGenId` toggle default off; `writesAfter` range 0–1000 step 100 default 600 (writes between snapshot and revert); `writesAfterRevert` range 0–1000 step 100 default 400.
- **Presets (5):**
  - `non-authoritative` — qm-dc01 restored from a 3-day-old system-state backup (USN 5000), new invocationID → pulls 600 newer changes from qm-dc02 → converged. 5 steps. Derived, unchecked.
  - `authoritative` — `OU=Brackenridge` deleted after the backup; non-authoritative restore alone → still deleted; authoritative restore of the OU → versions +100,000 × 3 days (check) → OU returns on every DC. 6 steps.
  - `usn-rollback` — snapshot of qm-dc01 at USN 5000; 600 writes (USN 5600, replicated: qm-dc02 HWM 5600); revert → USN 5000; 400 new writes get USNs 5001–5400 → qm-dc02 skips all (≤ 5600) → divergence; lamp still green. 6 steps.
  - `vm-genid` — same revert with VM-Generation ID → new invocationID, the 400 writes replicate. 5 steps.
  - `quillmoor-image` — estate S15 trap: the 2026-09-13 whole-VM image of qm-dc01 brought onto the network → rule 4 (DR S15 "Any DC image brought onto the network causes USN rollback"). 5 steps. From DR S15 (instructor).
- **Steps:** max 6.
- **Legend:** USN cell committed (filled), replicated (filled + tick), never replicated (hatched), invocationID tag, backup (disk icon) vs VM snapshot (camera icon), health lamp; "changed" highlight marks cells and vector entries changed this step.
- **Captions:** hr: "Nakon vraćanja snimke qm-dc01 ponovo daje USN-ove 5001–5400, a qm-dc02 već ima oznaku 5600: tih 400 promjena nikad neće povući." en: "After the snapshot revert qm-dc01 hands out USNs 5001–5400 again, and qm-dc02's watermark is already 5600: it will never pull those 400 changes."
  hr: "*Non-authoritative restore* (nemjerodavna obnova) daje DC-u novi invocationID, pa partneri šalju sve novije od sigurnosne kopije." en: "A non-authoritative restore gives the DC a new invocationID, so partners send everything newer than the backup."
- **Terms (check):** non-authoritative restore — nemjerodavna obnova; authoritative restore — mjerodavna obnova; USN rollback — vraćanje USN-a; snapshot — snimka; system state backup — sigurnosna kopija stanja sustava; invocation ID — identifikator instance baze; directory services restore mode — način obnove usluga imenika (DSRM).
- **Misconceptions:** a VM snapshot is a valid DC backup; replication health "green" means consistent; restoring a backup restores deleted objects everywhere.
- **Out of scope:** the Recycle Bin (`win-ad-recycle-bin`), backing chains of the snapshot itself (`sto-backing-chains`), DFSR SYSVOL restore, forest recovery.
- **Builds on `win-ad-replication`:** reuses its USN counters, HWM and UTD; new are invocationID resets, backups and the revert.
- **Note for the coordinator:** §5.21 suggests USN rollback as a preset next to `sto-backing-chains`; this spec keeps it here because it needs the replication model, and `sto-backing-chains` would link to `usn-rollback`.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ad-backup-restore sims/win-ad-backup-restore` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ad-backup-restore/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
