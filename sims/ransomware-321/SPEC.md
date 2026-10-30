<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ransomware-321: specification

One concept: **which copies survive encryption and deletion.** An attacker takes over a file server and encrypts or
deletes every copy of its data it can reach. The student releases the same attack on different backup designs and
counts what survives, the newest clean version, and how much is lost.

Task: `docs/tasks/w3/ransomware-321.md`. Catalogue: `sec-ransomware-321` (`docs/catalogue.md` §4.3).
Class: stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[S3]** `dr-lecture-estate/student/scenarios/S3.md`: attack Monday 2026-11-09, logon 02:10 over the VPN with a
  valid account; the NAS mirror Z: shows the same encryption. Student configs `configs/hq/hq-fs01/` (`net-use.txt`:
  Z: with the backup account's saved Domain Admin credential; `schtasks-mirror.txt`: mirror at 22:00;
  `vssadmin.txt`: no shadow copies; `wbadmin.txt`: weekly USB backup Fridays 20:00, disk always attached).
- **[S3i]** `dr-lecture-estate/instructor/scenarios/S3.md` (expected cascade, the trap "assuming the USB disk is an
  offline copy", the teaching point) and `instructor/caveats.md` CV-17 (interactive logon = local admin), CV-18/19
  (weak VPN credentials, no MFA), CV-36 (mirror with a Domain Admin credential, USB disk, VSS off; "a copy that the
  attacker can reach with the same credential is one copy"). Used for the model only; no answer, caveat text or
  estate name is on the page.
- **[P09]** `dr-lecture-estate/projects/briefs/P09.md`: the insurer asks where the offline or immutable copy is.
- **[UL23]** `uvod-u-linux` ch23 „Sigurnosne kopije i oporavak": sigurnosna kopija, točka oporavka, proba oporavka.
- **[UL12]** `uvod-u-linux` ch12 „Redundantno polje diskova": zrcaljenje protects against a device failure, not
  against what happens through the file system (Primjer 3, slika granica-zastite-zrcala).
- **[CISA]** CISA guidance on the 3-2-1 rule (3 copies, 2 media, 1 off site) *(check exact document title)*.
- **[OL]** Object-storage object lock documentation, compliance mode vs governance mode: in compliance mode no user,
  the root account included, can delete or overwrite a locked version before its retention date *(check vendor
  doc)*. The page says "object lock, WORM", no product.
- **[T]** The task file's "Model and presets".

## Scene

- **Three zones**, left to right, each with its own top rule (solid, double, dotted): *On the server* (source data
  `D:\Shares`, shadow copies on D:, the USB disk `E:`), *On the network, on site* (the NAS mirror `Z:`, the backup
  repository), *Off site* (the cloud copy or the tape; "nothing off site" in the estate).
- **A card per copy**: name and drive, status (clean / encrypted with a lock / deleted / off), medium · site · what
  it is, **reached by** (the credential) with a tag *same credential* / *other credential* / *offline*, the object
  lock if any, the **versions** as chips (time; hatched with a lock when encrypted; struck and dashed when deleted;
  a shield when locked) and the **newest clean** version.
- Card shapes: clean solid; encrypted hatched in `--danger` with a lock; deleted dashed and muted; immutable a double
  border and a shield; offline a plug icon. The card the attacker acts on carries the **attacker** token (steps
  1–8). Cards hit this step have the kit's changed mark.
- **Side column**: the clock; the attacker's credentials (user, local admin, Domain Admin; held filled, not held
  dashed; with MFA the user chip struck and "logon refused"); the **3-2-1 checklist** (on paper; after the count
  also by credential, cells that differ highlighted); at the end the outcome (survivors, restore from, newest clean
  version, data lost).

## State

```
{ clock, design, attacker: { creds: ['user'|'localAdmin'|'domainAdmin'], at, blocked },
  copies: [{ id, medium, site, cred, reach: 'sameCred'|'otherCred'|'none', online, kind, lockDays, immutableUntil,
             deleted, off, versions: [{ t, clean, lockedUntil?, gone? }] }],
  checklist: { paper: { copies, media, offsite, offlineOrImmutable }, real: { … } },
  survivors: null | [ids], best: null | id, rpoMinutes: null | number, done, last: event, log: [events] }
```

Times are minutes from Monday 2026-11-09 00:00 (Sun 22:00 = −120, Fri 22:00 = −3000). Deviations from the task's
state: `rpoMinutes` instead of `rpoHours` (exact integers); `cred` beside `reach`; `versions[].gone` keeps deleted
versions visible; `lockDays` per copy and `lockedUntil` per version (rule 5 acts per version).

## The copies

| id | Card | Medium | Site | Written by | Versions at the start |
|---|---|---|---|---|---|
| `src` | source data D:\Shares | disk | on site | local admin | live |
| `vss` | shadow copies on D: | disk (same volume) | on site | local admin | Fri 07:00, Fri 12:00 (off in the estate: none) |
| `mirror` | NAS mirror Z: | disk | on site | Domain Admin (the backup account) | Sun 22:00 (one copy) |
| `usb` | USB disk E: (attached) | disk | on site | local admin | Fri 30 Oct 20:00, Fri 6 Nov 20:00 |
| `repo` | backup repository on a NAS | disk | on site | Domain Admin | Fri, Sat, Sun 22:00 |
| `cloud` | cloud copy of the repository's versions | object storage | off site | Domain Admin | Fri, Sat, Sun 22:00 |
| `tape` | weekly tape | tape | off site | nothing online | Fri 30 Oct 22:00, Fri 6 Nov 22:00 |

**Designs** (`design`): `estate` src, vss (off), mirror, usb; `321-online` + vss on, repo, cloud; `immutable` the same
with the cloud copy under a 30-day object lock; `offline-tape` + vss on, repo, tape. The mirror and the USB disk stay
in every design (the task's scene lists them for every design).

## Rules

1. **Same credential, one copy** [S3i CV-36, S3 teaching point]: `reach` is `sameCred` when the credential that
   writes the copy can be had on the server (its local admin; the backup account's Domain Admin password when
   `credOnServer`), `otherCred` when only an account that is not on the server writes it, `none` when it is offline.
   The attacker reaches a copy iff it is online and the attacker holds its credential (`canTouch`).
2. **Mirror ≠ backup** [S3i CV-36, UL12]: at the 22:00 run a mirror **replaces** its one copy with the source as it
   is (encrypted), so out of the attacker's reach it still falls. A versioned backup **adds** a version (encrypted)
   and keeps the old ones. The cloud copy follows the repository; with the repository deleted both jobs fail.
3. **An attached disk is online** [S3i trap]: the USB disk is reached by a local admin and encrypted whole (both
   weekly backups on it); it never ticks "offline".
4. **On-volume snapshots fall with the host** [S3i CV-36 "VSS off"; Windows VSS]: a local admin of the server
   deletes the shadow copies, with or without the Domain Admin credential. In the estate they are off: nothing to
   delete.
5. **Immutable and offline** [OL compliance mode / WORM, P09]: a delete removes every version whose lock has ended
   (`lockedUntil ≤ t`) and is refused while any locked version is left, whoever asks; an offline copy is out of reach of every
   credential. Encryption by replication (rule 2) adds a new version and leaves the locked ones.
6. **3-2-1** [CISA, T]: the checklist counts cards: copies ≥ 3, media ≥ 2, off site ≥ 1, plus offline or immutable
   ≥ 1. Shadow copies are on the source volume and are not a copy. `paper` counts every card; `real` applies rule 1:
   the source and every *mutable* copy reached with the same credential count as one; a copy reached otherwise,
   offline or immutable counts on its own (an immutable copy reached with the same credential still survives, so it
   is not folded into the source). A mirror out of reach counts on its own in `real` although it falls at 22:00
   (rule 2): the column answers "what does one credential reach", not "what survives".
7. **Data lost** [UL23 točka oporavka, T]: survivors are the copies (not the source, nor the shadow copies on its
   volume, rule 6) that still hold a clean version.
   Lost = from the chosen survivor's newest clean version to the attack (02:10). No survivor: total loss
   (`rpoMinutes` null). An intact source (MFA): 0.

**Tie-break** [T]: the survivor to restore from is the one with the newest clean version; equal times prefer the
copy **on site** (faster restore), then card order (total order). The page names the copy passed over.

## One step

| n | Clock | Kind | Effect |
|---|---|---|---|
| 1 | Mon 02:10 | `logon` | valid account over the VPN: creds `user`. With `mfaOnVpn`: `blocked`, and step 2 is the count |
| 2 | 02:12 | `localAdmin` | the "interactive logon = local admin" group policy: + `localAdmin` |
| 3 | 02:15 | `findCred` | the backup account's saved password: + `domainAdmin` if `credOnServer`, else nothing found |
| 4 | 02:20 | `encryptSource` | D:\Shares encrypted (encrypting a copy marks every version on it encrypted) |
| 5 | 02:25 | `encryptMirror` | Z: encrypted if reached (rule 1), else `unreachable` |
| 6 | 02:30 | `encryptUsb` | E: encrypted (rule 3) |
| 7 | 02:35 | `deleteShadows` | shadow copies deleted (rule 4), or `off` |
| 8 | 02:40 | `backups` | repo, cloud, tape: deleted if reached, `locked` if under a lock, `offline`, or `unreachable`; the token goes back to the server when nothing is reached |
| 9 | Mon 22:00 | `jobs` | mirror replaced, repo and cloud add a version, or `failed` when the repository is gone (rule 2) |
| 10 | Tue 07:50 | `discovery` | users find the files |
| 11 | Tue 07:50 | `count` | survivors, best copy (tie-break), data lost; the checklist's `real` column shows |

Steps 2–8 are minutes apart (illustrative). Steps: 11; 2 with `mfaOnVpn` (the refused logon, then the count, both at
02:10). `sim.json` `steps` is 11. The attacker token is shown during steps 1–8.

## Params

`design` (choice, default `estate`), `mfaOnVpn` (toggle, off), `credOnServer` (toggle, on). None resets the step.

## Presets and expected numbers

Printed by a script over the model before the page was written, and in `sim.test.js`.

| Preset | Params | Checklist paper → real (copies, media, off site, offline/imm.) | Survivors | Restore from | Lost |
|---|---|---|---|---|---|
| `estate` | defaults | 3,1,0,0 → 1,1,0,0 | 0 | — | total loss |
| `321-online` | design 321-online | 5,2,1,0 (3-2-1 ✓) → 1,1,0,0 | 0 | — | total loss |
| `immutable` | design immutable | 5,2,1,1 → 2,2,1,1 | 1 (cloud) | cloud, Sun 22:00 | **4 h 10 min** (250 min) |
| `offline-tape` | design offline-tape | 5,2,1,1 → 2,2,1,1 | 1 (tape) | tape, Fri 22:00 | **2 d 4 h 10 min** (3130 min) |
| `mfa` | mfaOnVpn | 3,1,0,0 → 1,1,0,0 | 2 (mirror, USB), source intact | source | 0 |

With `credOnServer` off: `estate` 0 survivors (the mirror falls at 22:00, rule 2); `321-online` and `immutable`
repo and cloud both hold Sun 22:00 → **tie-break: the repository (on site)**, 4 h 10 min; `offline-tape` repo
(Sun 22:00) beats tape (Fri 22:00), 4 h 10 min.

The object lock in `immutable`: each version locked 30 days from its time; the earliest ends Sun 6 Dec 22:00.

## Captions (the task's)

- hr: "Z: je mapiran s istom vjerodajnicom domenskog administratora — napadač ga šifrira izravno." / en: "Z: is
  mapped with the same Domain Admin credential — the attacker encrypts it directly." (step 5 when reached)
- hr: "3-2-1 je zadovoljeno na papiru, ali sve kopije dohvaća ista vjerodajnica: preživjelih 0." / en: "3-2-1 is
  met on paper, but one credential reaches every copy: 0 survive." (the count, when 3-2-1 holds on paper and nothing
  survives; "every copy" for the task's "all three copies": the mirror and the USB disk are copies too here)

## Legend

Clean copy (solid), encrypted (hatched + lock), deleted (dashed), immutable (double border + shield), offline
(dotted + plug), attacker (token), changed (kit highlight).

## Misconceptions (in the explanation)

3-2-1 alone stops ransomware; a mirror or RAID is a backup; a USB disk is offline because it is "a separate disk".

## Out of scope

Restore speed (RTO), identity recovery, the way into the network beyond one step, dedup and retention schedules
(`backup-diff-incr`), any tool by name.
