# rpo-rto: RPO and RTO

| | |
|---|---|
| Task | `rpo-rto` (wave 2b, Storage and backup) |
| Catalogue entry | `dr-rpo-rto` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/rpo-rto/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | DR |
| Topic / tags / level | `storage` / `disaster-recovery` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **how much data and how much time you lose, on one timeline**.

The student: place backups and an incident, measure loss.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: DR scenarios
- DR estate (student side only): `student/scenarios/S1.md` (HQ power loss Thu 14:05), `S3.md` (ransomware,
  logon 02:10, found 07:50), `S12.md` (UPS tripped Sat 23:40, found Mon 08:10), `S15.md` (AD mass deletion
  16:40–16:55 on all three DCs); `student/logs/hqc/vzdump-2026-11-01.log` (the VM backup log, job start 01:40; preset 1) and
  `vzdump-history.txt` (the VM backup history, failures from 2026-09-14, last good 2026-09-13 01:52; preset 2); `student/configs/hq/hq-nas02/shares-and-dumps.txt`
- UL ch23 definicija „točka oporavka" and Primjer 6 (spacing of points vs how far back)
- ISO 22301 / ISO 22300 vocabulary for RPO and RTO (rule 1) *(check)*; the Croatian terms are not in the course books
  *(check)*

## Model and presets

- **Scene:** one horizontal timeline. Recovery points (backups, snapshots, replica positions) as ticks on
  the left; the **incident** as a red-and-labelled marker; to its right the recovery phases as consecutive
  bars: **detection**, **decision**, **restore**, **verification**, then "service back". Two brackets: the
  **data lost** (last good point → incident) = actual RPO, and the **time down** (incident → service back) =
  actual RTO, each next to its target with ✓ / ✗.
- **State:** pure function of params → `{ points: t[], lastGood, lossH, downH, rpoMet, rtoMet }`.
- **Live:** dragging the incident or changing the interval moves the brackets; the phases stack from the
  incident.
- **Rules:**
  1. Actual RPO = incident time − the newest **good** recovery point before it (a point is good only if a
     restore from it works: link `restore-drill`) (standard BC/DR definition, check, Sources).
  2. Worst-case RPO of a schedule = the interval between points (+ the time a point takes to complete);
     average ≈ half of it.
  3. Actual RTO = detection + decision + restore + verification; detection counts from the incident, not
     from when someone noticed (derived; DR estate scenarios).
  4. A recovery point after the incident's real start but before its detection is not good if the damage
     replicated into it (corruption, deletion, encryption): the last good point is before the start
     (DR S3, S15).
  5. A target is met when actual ≤ target; tie (equal) counts as met.
- **Params:** `interval` choice 15 min / 1 h / 24 h / 7 d (24 h); `incidentAt` range over one week
  (Thursday 14:05); `detectH` range 0–48 (0.5); `decideH` 0–24 (1); `restoreH` 0–72 (4); `verifyH` 0–8 (1);
  `damageStartsBefore` range 0–72 h (0, for corruption that is found late); targets `rpoH` (24), `rtoH` (8).
- **Presets** (DR estate student material; times derived from the stated facts):
  1. `nightly-backup` — backups daily at 01:40 (DR estate: the VM backup log of 2026-11-01), incident Thursday 14:05 (S1):
     actual RPO **12 h 25 min**, RTO 0.5 + 1 + 4 + 1 = **6.5 h**: both targets met.
  2. `failing-backups` — the same incident on 2026-11-01, but jobs have failed since 2026-09-14 (DR estate: the VM backup history): last good point 2026-09-13 01:52, actual RPO **49 days**.
  3. `found-on-monday` — S12: the UPS tripped on Saturday 23:40, discovered Monday 08:10: detection alone is
     **32.5 h**; RTO target missed before any restore starts.
  4. `ransomware` — S3: attacker logged on at 02:10, files found encrypted at 07:50; the NAS mirror shows the
     same: the nightly copy taken after 02:10 is not good (rule 4); last good point is the previous night.
  5. `replica-not-backup` — S15: mass deletion at 16:40 replicated to all three domain controllers by
     16:55: replication gives RPO 0 for a disk failure and **no** recovery point for this incident; the
     recovery point is the last backup, wherever it is.
- **Steps:** explorer, no steps.
- **Legend:** recovery point (tick, ✓ good / ✗ bad), incident (marker + label), phase bars (patterned
  differently: detection dotted, decision hatched, restore solid, verification outlined), RPO/RTO brackets
  with target lines. "Changed" marks a bracket whose verdict flipped after the last change.
- **Captions:**
  - hr: „Ciljna točka oporavka (*RPO*) mjeri koliko podataka gubite, ciljno vrijeme oporavka (*RTO*) koliko
    vremena. Ovdje je otkrivanje samo trajalo 32,5 sata."
  - en: "Backups every night, but the last one that restores is from 13 September: 49 days of data lost."
- **Terms:** recovery point objective (RPO) — ciljna točka oporavka (check); recovery time objective (RTO) —
  ciljno vrijeme oporavka (check); recovery point — točka oporavka (UL ch23); incident — incident;
  detection — otkrivanje; restore — oporavak / vraćanje.
- **Misconceptions:** "RPO = how often we back up" (only if every backup is good and found in time); "RTO =
  restore time" (detection and decision come first); "replication gives RPO 0" (not for deletes or
  ransomware).
- **Out of scope:** business impact analysis, cost of downtime, backup retention (`retention-gfs`), site
  failover mechanics (`site-failover`), transfer times (`backup-window`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `rpo-rto` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh rpo-rto sims/rpo-rto` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/rpo-rto/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
