# win-ad-replication: AD multi-master replication

| | |
|---|---|
| Task | `win-ad-replication` (wave 2b, Active Directory) |
| Catalogue entry | `win-ad-replication` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-ad-replication/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `active-directory`, `replication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `multimaster-conflict` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **USNs, up-to-dateness vector, attribute-level last writer wins**.

The student: change one attribute on two DCs at once.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/multimaster-conflict/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.7 (ha-multimaster-conflict)
- Microsoft Learn: "How the Active Directory replication model works" (Windows Server 2003 technical reference: USNs, HWM, UTD, conflict resolution)
- [MS-DRSR] Directory Replication Service Remote Protocol (replication metadata)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/forest.txt` (DC names qm-dc01, qm-dc02, brk-dc03)

## Overlaps (catalogue §5)

- **§5.7 Replication, quorum and consensus:** B1 multi-master gets presets "database row" and "AD attribute" (covers most of win-ad-replication). ha-db-replication and sto-sync-async-replication are one page. ha-quorum-split-brain gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets one native page (sto-ceph-min-size) and the cephsim and faultline samples link to it.

## Model and presets

- **Scene:** K2 topology with three DCs (estate names `qm-dc01`, `qm-dc02`, `brk-dc03`) in a ring. Each DC has a card: its `highestCommittedUSN`, its up-to-dateness vector (UTD: per originating DC, the highest originating USN seen) and its high-watermark per partner. One object, user `ana`, with two attributes (`telephoneNumber`, `title`); each attribute shows its replication metadata: version, originating DC, originating USN, originating time, local USN. A packet per replication pull moves along a link.
- **State:** `{ t, dcs: { id: { usn, utd: { origDc: usn }, hwm: { partner: usn }, obj: { attr: { value, ver, origDc, origUsn, origTime, localUsn } } } }, queue: [] }`. Each DC also has an invocationID (here equal to its name).
- **One step:** one event: an originating write on a DC, or one pull (destination asks source for changes above its high watermark, applies them, updates HWM and UTD).
- **Rules (Microsoft: "How the Active Directory replication model works" (Windows Server 2003 technical reference); [MS-DRSR]):**
  1. An originating write increments the DC's USN; the attribute gets `ver+1`, origDc = this DC, origUsn = localUsn = the new USN, origTime = now.
  2. A pull returns the source's changes with local USN > the destination's HWM for that source; the destination's HWM becomes the source's current USN.
  3. Propagation dampening: a change whose (origDc, origUsn) is ≤ the destination's UTD entry for origDc is skipped — it already has it.
  4. An applied replicated change gets a new local USN on the destination (its own counter), keeps the originating metadata, and raises the UTD entry for origDc.
  5. Conflict on the same attribute: higher version wins; equal version → later origTime wins; equal time → the higher originating invocationID (GUID) wins (check order and comparison).
  6. Different attributes of one object never conflict: each is resolved alone (attribute-level), so concurrent edits of `telephoneNumber` on DC01 and `title` on DC02 both survive.
  7. Tie-break for events in the same tick: originating writes first, then pulls in ring order.
- **Params:** `t2` range 0–10 s "second edit delay" default 2; `edits1` range 1–3 "edits on DC01" default 1; `sameAttr` toggle default on.
- **Presets (5):**
  - `one-change` — DC01 (USN 4100) sets `telephoneNumber`: DC01 USN 4101, ver 2. DC02 pulls → its own USN 7301, origUsn stays 4101; DC03 pulls from DC02 → USN 2201; UTD[DC01] = 4101 everywhere. 4 steps. Derived, unchecked.
  - `same-attr-time` — DC01 writes `phone=111` at t=0, DC02 writes `phone=222` at t=2, both ver 2 → after replication all hold 222 (later time). 6 steps.
  - `version-beats-time` — DC01 edits twice (ver 3) at t=0 and t=1, DC02 once (ver 2) at t=5 → all hold DC01's value: version beats a later time. 7 steps.
  - `different-attrs` — DC01 changes `telephoneNumber`, DC02 changes `title` at the same time → both values everywhere. 6 steps.
  - `dampening` — DC03 pulls DC01's change from DC02, then pulls DC01 directly → skipped by UTD (rule 3). 5 steps.
- **Steps:** max 7.
- **Legend:** DC (box with USN), UTD row, metadata row (ver / origin / time), replication packet; winning value (✓) vs overwritten (struck through); "changed" highlight marks the metadata fields changed by the step.
- **Captions:** hr: "DC02 zapisuje promjenu pod svojim USN-om 7301, ali čuva izvorni USN 4101 s DC01 — po tome DC03 zna da je već ima." en: "DC02 stores the change under its own USN 7301 but keeps the originating USN 4101 from DC01 — that is how DC03 knows it already has it."
  hr: "Ista verzija 2 na oba DC-a: pobjeđuje kasnije vrijeme, `222`." en: "Same version 2 on both DCs: the later time wins, `222`."
- **Terms (check):** update sequence number — slijedni broj promjene (USN); up-to-dateness vector — vektor ažurnosti; high-watermark — gornja oznaka; originating write — izvorna promjena; multi-master replication — replikacija s više glavnih kopija; attribute — atribut; conflict resolution — razrješavanje sukoba.
- **Misconceptions:** the latest edit always wins (version first); replication copies whole objects; USNs are global numbers.
- **Out of scope:** schedules, sites and the KCC (`win-ad-sites`), linked-value replication, naming conflicts (CNF objects), USN rollback (`win-ad-backup-restore`).
- **Builds on `multimaster-conflict`:** reuse its two-writer timeline and the "what is lost" display; new here are per-attribute versions, USN counters, HWM and UTD.
- **Note for the coordinator:** §5.7 makes "AD attribute" a preset of `multimaster-conflict`. That preset covers rules 5–6 only; this page's own concept is the USN/UTD bookkeeping (rules 1–4). Suggest: keep this page, focused on USNs, and let the B1 preset link here.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ad-replication sims/win-ad-replication` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ad-replication/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
