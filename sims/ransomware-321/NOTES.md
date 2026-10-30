<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ransomware-321: notes

New stepper (task `docs/tasks/w3/ransomware-321.md`, catalogue `sec-ransomware-321`, §4.3, wave 3). Drawn by the page
(cards in three zones and a side column); no kit view is named by the task and none fits. Rules, tie-breaks and
expected numbers: `SPEC.md`.

## Decisions

- **Generic names, not the estate's.** The page shows "the file server", "the backup account", "a NAS", drive
  letters `D:\Shares`, `Z:`, `E:` and the times of DR S3 (logon Mon 2026-11-09 02:10), but not `hq-fs01`, `hq-nas02`,
  `svc_backup` or the studio. The `estate` preset is the classic small-office setup (mirror, attached USB disk,
  shadow copies off) the task asks for; with the estate's names it would be the S3 model answer worked out for the
  students (COMMON §1). Same choice as `rpo-rto` and `lateral-movement`.
- **The mirror and the USB disk stay in every design**, as the task's scene lists them for all designs; the other
  designs add a versioned repository and a third copy (cloud, locked cloud, or tape). So every design shows rules 2
  and 3 again, and the USB disk never ticks "offline".
- **Shadow copies are on in the three improved designs**, off in the estate (the task: "VSS off"). Without a design
  that has them, rule 4 would never show.
- **Shadow copies are not a copy on the checklist**: they live on the source volume (same disk, same host).
- **The checklist's second column** ("one credential") applies rule 1 and is shown only at the count, so the
  student first sees 3-2-1 ticked on paper. An immutable copy reached with the same credential counts on its own in
  that column: it survives, so folding it into the source would contradict the outcome (SPEC rule 6).
- **Media:** disk, object storage, tape. A NAS and a USB disk are disks, so the estate has one medium.
- **`credOnServer` off** means the jobs do not run on the server with a stored Domain Admin password: the NAS and
  the backup system pull the data with an account that is not on the server. The attacker then stays a local admin,
  and the mirror falls only at 22:00 (rule 2), which is where mirror and versioned backup differ visibly.
- **The cloud copy follows the repository**: with the repository deleted, its 22:00 copy job fails too.
- **Encrypting a copy marks every version on it encrypted** (the USB disk shows both weekly backups hatched); the
  mirror's 22:00 run replaces its one copy. Deleting removes every version not under a lock, and the chips stay,
  struck, so the student sees what was lost.
- **Survivors exclude the shadow copies** (on the source volume, as on the checklist). They only survive when nothing
  is attacked (MFA), where the source is intact anyway.
- **The checklist's "one credential" column applies rule 1 only**: a mirror out of the attacker's reach counts on
  its own there, though it falls at 22:00 (rule 2). The column answers what one credential reaches; the outcome box
  answers what survived.
- **The object lock is per version** (30 days from the version's time); the caption gives the earliest end (Sun
  6 Dec). The 22:00 encrypted version is locked as well: harmless, the old ones stay.
- **Data lost is counted to the attack (02:10)**, the task's rule 7; the encryption itself starts at 02:20.
- **Step clocks 02:12 … 02:40** are illustrative minutes after the logon; the explanation says so.
- **The attacker token** stands on the card acted on during steps 1–8 and is gone from the 22:00 jobs on.
- Inline SVG icons (lock, shield, plug, token) instead of emoji, so they render offline and in grayscale; the page
  adds them to the kit's legend swatches after mount.

## Deviations from the task

- **Discovery is Tuesday 07:50, not Monday.** The task's steps run the 22:00 jobs (step 9) before the discovery
  (step 10); with S3's discovery on Monday 07:50 no job would run in between. Rule 7 counts to the attack, so no
  number changes. `rpo-rto` uses Monday 07:50 for its own scenario.
- **The 3-2-1 caption says "every copy"** ("sve kopije") instead of "all three copies": with the mirror and the USB
  disk the `321-online` design has five copy cards.
- **State:** `rpoMinutes` (integers) instead of `rpoHours`; `cred`, `lockDays`, `deleted`, `off` and per-version
  `lockedUntil`/`gone` added (SPEC "State").
- **Not reused: `backup-diff-incr`'s model.** It is a block-level week (8 blocks, incremental and differential
  sets); this sim needs only versions with times per copy. No code was copied; the shared idea is the timeline of
  versions and the newest restorable point. Nothing in `models/` yet.
- Titles: hr "3-2-1 i nepromjenjive kopije protiv ucjenjivačkog programa" (58 characters).

## Sources

See `SPEC.md` "Sources". Unchecked, marked *(check)*:
- the exact title of CISA's 3-2-1 guidance;
- object-lock compliance vs governance mode in the vendor documentation (the model uses compliance semantics:
  nobody deletes before the retention date);
- the Croatian terms below.

Instructor material (`dr-lecture-estate/instructor/`: S3, CV-17, CV-18, CV-19, CV-36) informed the model only. No
names, caveat texts or answers from it are on the page; the `estate` preset uses generic names (above).

## Term pairs

In `kit/glossary.js` and used as `[[…]]` in the explanation: *backup* (sigurnosna kopija), *mirroring* (zrcaljenje),
*recovery point* (točka oporavka). Missing, written out in both tables:

| English | Croatian | Source |
|---|---|---|
| ransomware | ucjenjivački program | task *(check)* |
| immutable (copy) | nepromjenjiva (kopija) | task |
| offline copy | kopija izvan mreže (the task: izvanmrežna kopija) | task *(check)* |
| credential | vjerodajnica | task |
| restore | oporavak | task, UL ch23 |
| shadow copies (VSS) | kopije u sjeni | simdeck *(check: Windows hr localisation)* |
| object lock | zaključavanje objekta | simdeck |

## Shared requests

None.

## Questions for the owner (for `docs/tasks/OPEN.md`)

- The `estate` preset follows the S3 cascade (VPN without MFA, the local-admin GPO, the saved backup Domain Admin
  password, Z: and the attached USB disk encrypted, total loss) with S3's date and times, as the task file asks, but
  with generic names (no `hq-fs01`, `svc_backup`). COMMON §1 says a scenario's model answer is not a preset: keep it
  as is, shift the date and times, or drop the drive letters too? The `mfa` preset is S3's last recovery step.
- Discovery Tuesday 07:50 (after the 22:00 jobs) rather than S3's Monday 07:50: keep?

## Checks

- Numbers printed from the model before the page and compared with the task: all equal (0; 0 with 3-2-1 ticked on
  paper; 1 survivor, Sun 22:00, 4 h 10 min; 1 survivor, Fri 22:00, 2 d 4 h 10 min; MFA: nothing encrypted).
- `node --test sims/ransomware-321/sim.test.js`: 38 tests. 40 mutations (one or more per rule and the tie-break,
  the jobs per design, the token, the clocks, the lock bookkeeping), all caught.
- Fresh review (a separate agent, against SPEC.md, about 80 mutations of its own): survivors in the 22:00 jobs (lock
  on the new version, the cloud copy failing with the repository, tape and USB untouched), the attacker token, the
  MFA flag and clock, the step clocks, one-locked-version deletes, `found`, the initial version times; tests added,
  all now caught. It also found the tape design's step-8 caption naming a cloud copy it does not have, shadow copies
  counted as survivors, encryption hiding the USB disk's two backups, the hr explanation saying "kopija" where en
  says "backup", "locked until" naming only the earliest lock, three Croatian wordings and the token left on the
  shadow-copy card at step 8; all fixed. Its note that the `estate` and `mfa` presets follow the S3 cascade is under
  "Questions for the owner".
- `npm run gate -- ransomware-321`: passes; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus each preset's end and the key steps (mirror at step 5, lock refusal at step 8, mirror at
  22:00 with the credential off the server, the tie-break) shot separately.

## Time

Start 2026-10-30 14:46 CET; done 15:08 CET (one session).
