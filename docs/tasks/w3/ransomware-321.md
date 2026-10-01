# ransomware-321: 3-2-1 and immutable copies vs ransomware

| | |
|---|---|
| Task | `ransomware-321` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-ransomware-321` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/ransomware-321/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | DR, SEC |
| Topic / tags / level | `security` / `backup`, `attacks` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `backup-diff-incr` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **which copies survive encryption and deletion**.

The student: release ransomware on an estate with different backup designs.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.
5. `sims/backup-diff-incr/` (the model this one builds on) and its `NOTES.md`.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S3.md` (DR estate scenario)
- Catalogue seed: DR S3, P09
- `/home/rjasmin/projects/dr-lecture-estate/instructor/scenarios/S3.md` (model answer: expected cascade, RPO/RTO, traps, teaching point).
- `/home/rjasmin/projects/dr-lecture-estate/instructor/caveats.md` CV-17, CV-18, CV-19, CV-36 (robocopy /MIR with a Domain Admin credential, USB disk, VSS off).
- `/home/rjasmin/projects/dr-lecture-estate/projects/briefs/P09.md` (what "immutable" means for the insurer).
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/23-odrzavanje-sustava.md`, „Sigurnosne kopije i oporavak" (točka oporavka, proba oporavka); `12-lvm-zauzece-redundancija.md`, „Redundantno polje diskova" (zrcaljenje is not a backup, Primjer 3).
- CISA/US-CERT guidance on the 3-2-1 backup rule *(check title)*; AWS *S3 Object Lock* documentation (compliance vs governance mode) *(check)*.

## Model and presets

- **Scene:** the DR estate's file server hq-fs01 (source data D:\Shares) and every copy of it as a card: NAS
  mirror (robocopy /MIR, mapped as Z: with the svc_backup Domain Admin credential), USB disk E: (always
  attached), VSS shadow copies, and, depending on the design, a backup repository, an off-site copy, an
  immutable copy (object lock / WORM) and an offline tape. Each card shows: medium, location, which credential can
  reach it, and the newest clean version's time. An attacker token moves across the cards. A 3-2-1 checklist
  sits in the corner.
- **State:** `{ clock, design, attacker: {creds: ['user','localAdmin','domainAdmin'], at}, copies: [{id, medium,
  site, reach: 'sameCred'|'otherCred'|'none', immutableUntil, online, versions: [{t, clean}]}], survivors,
  rpoHours, checklist: {copies, media, offsite, offlineOrImmutable} }`.
- **One step:** one attacker action, then copies that sync on schedule: 1 02:10 logon over VPN with a valid
  account; 2 local admin via the "interactive = local admin" GPO; 3 finds the saved svc_backup credential → Domain
  Admin; 4 encrypts D:\Shares; 5 encrypts Z: (mirror) directly; 6 encrypts the attached USB disk; 7 deletes VSS
  shadows; 8 tries the backup repository and any copy reachable with Domain Admin (deleted or encrypted unless
  immutable or offline); 9 22:00 scheduled jobs run: a mirror copies the encrypted files, a versioned backup adds
  an encrypted version but keeps the old ones; 10 07:50 discovery; 11 count survivors, newest clean version, RPO.
- **Rules:**
  1. A copy the attacker can reach with the same credential is one copy, not a backup (DR CV-36 teaching point;
     S3 model answer).
  2. A mirror replicates deletions and encryption on its next run; mirror ≠ backup (DR CV-36; UL ch12
     „Redundantno polje diskova", the mirror paragraph, same idea for RAID 1).
  3. An attached disk is online, whatever its label (DR S3 trap "assuming the USB disk is an offline copy").
  4. On-volume snapshots (Windows VSS "Previous Versions") can be deleted by an administrator of that machine, so
     they do not survive a full compromise of the host (DR CV-36 "VSS off"; concept depends on Windows VSS).
  5. An immutable copy cannot be deleted or overwritten before its retention date, even by an admin of the backup
     system (S3 Object Lock compliance mode / WORM *(check vendor doc)*); an offline copy is out of reach until
     reconnected.
  6. 3-2-1: at least 3 copies, on 2 different media, 1 off-site; the checklist is ticked by counting cards
     (US-CERT/CISA backup guidance *(check exact document title)*). Rule 1 overrides the tick: copies with
     `reach: sameCred` count as one.
  7. Data lost = everything written between the newest clean surviving version and the encryption (02:10); the
     page shows it as the achieved recovery point (UL ch23 „Više kopija u vremenu…", točka oporavka).
  Tie-break: if two surviving copies have the same newest clean time, prefer the one on site (faster restore) and
  say so.
- **Params:** `design` choice estate/3-2-1-online/immutable/offline-tape (estate); `mfaOnVpn` toggle (off: on blocks
  step 1 and ends the run); `credOnServer` toggle (on: off stops the escalation at local admin, so only copies a
  local admin reaches fall).
- **Presets** (times from DR S3: attack 02:10 Mon 2026-11-09, discovery 07:50):
  - `estate` hq-fs01 as it is: source, Z: mirror, USB E:, VSS off → 0 survivors; RPO: total loss of anything not
    elsewhere. From DR `instructor/scenarios/S3.md` and CV-36.
  - `321-online` nightly versioned backup to a NAS plus a cloud copy, both writable with Domain Admin: 3 copies,
    2 media, 1 off-site ticked, yet 0 survivors. Derived from rule 1.
  - `immutable` same, cloud copy with 30-day object lock: 1 survivor, newest clean version Sun 22:00 → 4 h 10 min of
    changes lost. Derived, checked by hand.
  - `offline-tape` weekly tape taken off site Friday: 1 survivor, Fri 22:00 → 2 days 4 h 10 min lost. Derived,
    checked by hand.
  - `mfa` MFA on the VPN: step 1 fails, nothing is encrypted. From DR S3 recovery order ("re-enable remote access —
    with MFA").
- **Steps:** 11 for every preset except `mfa` (2).
- **Legend:** clean copy (solid card), encrypted (hatched card + lock), deleted (dashed outline), immutable (shield
  shape), offline (unplugged plug icon), attacker (token), changed (kit highlight on cards hit this step).
- **Captions:** hr: "Z: je mapiran s istom vjerodajnicom domenskog administratora — napadač ga šifrira izravno."
  / en: "Z: is mapped with the same Domain Admin credential — the attacker encrypts it directly." — hr: "3-2-1 je
  zadovoljeno na papiru, ali sve tri kopije dohvaća ista vjerodajnica: preživjelih 0." / en: "3-2-1 is met on
  paper, but one credential reaches all three copies: 0 survive."
- **Terms:** backup — sigurnosna kopija (UL ch23); mirror — zrcalo (UL ch12); restore — oporavak; recovery point —
  točka oporavka (UL ch23); immutable — nepromjenjiv; offline copy — izvanmrežna kopija *(check)*; credential —
  vjerodajnica; ransomware — ucjenjivački program *(check)*.
- **Misconceptions:** 3-2-1 alone stops ransomware; a mirror or RAID is a backup; a USB disk is offline because
  it is "a separate disk".
- **Out of scope:** restore speed (RTO), identity recovery (krbtgt reset), the network entry path beyond one step,
  dedup and retention schedules (`backup-diff-incr`).
- **Builds on `backup-diff-incr`:** reuses its timeline of backup versions and their times; new are reach by
  credential, immutability, the attacker and the 3-2-1 checklist.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `ransomware-321` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh ransomware-321 sims/ransomware-321` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ransomware-321/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
