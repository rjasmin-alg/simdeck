<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-zfs-self-heal: notes

New stepper (task `docs/tasks/w3/lnx-zfs-self-heal.md`, catalogue `lnx-zfs-self-heal` §4.4), drawn on kit view
**K3: block grid** (`kit/blockgrid.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Scripts, not free-form actions.** As in `lnx-cow-filesystem`, each preset is a fixed script (corrupt, read, scrub
  one block, md check, md repair), one action or one scrubbed block per step, held in a hidden `scene` select set by
  the presets. `redundancy` and `copies2` are free: every scene runs under every layout (copy indexes wrap, SPEC rule
  8), so a class can run "A scrub repairs" on md and watch the compare count two mismatches and repair nothing, or
  "md, no checksums" on ZFS and watch it heal.
- **Reuse of `lnx-cow-filesystem`:** the picture (a row of pointers over rows of physical blocks, the pointer tree
  above the data) and the page conventions (`rich()` for the term rule, hidden `scene`, `.sd-ctl[hidden]`). No function
  of its model is needed (snapshots, reference counts and allocation are not part of this concept), so nothing is
  copied from its `sim.js` and nothing needs promoting. The model here (`checksum`, `step`, `permanentFiles`) is pure
  and holds no words, if a later sim wants it.
- **One grid** (so the repair arrows can join two disk rows): the root (carrying the pointer block's sum), the pointer
  row with each pointer's stored sum and the files as spans under it, then one row per copy. The scrub cursor is a
  bracket over the pointer being compared ("provjera" / "scrub"; md: "usporedba" / "compare"). A copy read this step
  has the kit's underline bar and its computed sum with ✓ or ✗ as the second line; a copy corrupted or rewritten this
  step is on the highlight; a repair is a `now` arrow from the good copy to the rewritten one.
- **Cell states:** good copy solid in the row's colour with its byte (`D`); damaged copy hatched with `d⚡` (the byte
  with one bit flipped, 0x44 → 0x64); a rewritten copy keeps `↺` from then on; a copy in a permanent error is the kit's
  `bad` (red frame, ✕). Free blocks are plain cells with no pointer above them.
- **Status panel** beside the grid: a `zpool status -v` shaped block (pool, state, scan, the device table with READ
  WRITE CKSUM, errors), or for md `/proc/mdstat`'s two lines, `sync_action`, `last_sync_action` and `mismatch_cnt`.
  The output is data (English, `translate="no"`), as a terminal shows it; the panel title and everything around it are
  in both languages. Changed values are on the highlight. The real output's `status:`/`action:` paragraphs, duration
  and date are left out for space.
- **Toy checksum:** a 16-bit FNV-1a over the block's byte, 4 hex digits; the meta line says the sum is cut short and
  the explanation names fletcher4 and sha256. All 16 contents give distinct sums (tested), so a flipped bit is always
  caught.
- **Term rule:** *checksum*, *scrub*, *self-healing* and *silent corruption* are not in `kit/glossary.js`; they are
  written out (`termSum`, `termScrub`, `termHeal`, `termRot` and their `Later` / `Cap` forms). A caption uses the first
  form (with the Croatian in parentheses) only when no earlier step's caption used the term (`termsOf()` replays the
  run). Labels, legend and presets use the Croatian words.
- **ZFS and md are named:** NLA T23 teaches ZFS as the topic, and md RAID 1 is the course's own contrast (NLA T24,
  `lnx-mirror-not-backup`). `zpool status -v`, `copies=2`, `mismatch_cnt`, `check` and `repair` appear because they
  are the subject being taught; no other tool is named.

## Deviations from the task

See `SPEC.md` "Deviations": 10 blocks per disk (2 free) instead of 8; md-contrast rots `sda` and adds `repair`;
single-disk ends at CKSUM 2 (re-read); pool/vdev counters added; scan line in bytes.

## Sources

- NLA `meta/toc.md` T23 ("ZFS na Linuxu — bazeni, `datasets`, provjera integriteta"): the words *bazen* and
  *provjera integriteta*; no chapter yet, so every number is derived from the rules.
- OpenZFS zfsprops(7) `checksum` (fletcher4 default, sha256) and `copies`; zfsconcepts(7) and zpoolconcepts(7)
  (self-healing on mirrors); zpool-scrub(8) (a scrub reads all data, repairs from redundancy); zpool-status(8)
  (READ/WRITE/CKSUM, `-v`, "Permanent errors have been detected in the following files:", "No known data errors",
  "scrub repaired … with N errors", "scrub in progress"): from memory, not re-read *(check)*.
- Whether the mirror vdev and pool lines count a CKSUM error when every copy fails: from memory of real outputs
  *(check)*.
- md(4) `mismatch_cnt` (sectors re-written, or that would be, for check; may overcount by page size), `sync_action`,
  `last_sync_action`; drivers/md/raid1.c `process_checks` (the first device with a good read is the primary; repair
  copies it over the others): from memory *(check)*. md's read balancing is modelled as alternation.
- `single-page-labs/zfs-btrfs-topology-lab.html`: "scrub checksummed data and repair when a redundant good copy
  exists"; its vocabulary only.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| checksum | kontrolni zbroj (UL ch09) |
| scrub (integrity check) | provjera integriteta (NLA toc T23) |
| self-healing | samoizlječenje *(check)* |
| silent corruption | tiho oštećenje *(check)* |
| block pointer | pokazivač na blok *(check)* |
| pool (storage) | bazen (NLA T23); the glossary's *pool* is "skup adresa", the DHCP sense |

*mirror* (zrcalo) is used as a plain Croatian word; the glossary has *mirroring* (zrcaljenje).

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute (filed before by `lnx-overlayfs-layers` and
  `lnx-cow-filesystem`); worked around in the page the same way.

## Checks

- Numbers before the page: a node script over the model printed every step of every preset (and of every preset
  under the other layouts); they match the task: sdb CKSUM 2, 2 blocks repaired, 0 errors; sda CKSUM 1 with no
  scrub; permanent `film.mkv` with sda 1, sdb 1; single disk CKSUM 1 at detection, repaired with copies=2; md
  `mismatch_cnt` 8.
- `node --test sims/lnx-zfs-self-heal/sim.test.js`: 25 tests.
- `npm run gate -- lnx-zfs-self-heal`: pass. Screenshots looked at: the gate's 1920×1080 light, dark, grayscale, panel
  hidden, help and 375×812, both languages; extra states at 1920×1080: scrub-repairs 0, 3, 6, 10; both-bad 9, 10;
  single-disk 2 with copies=2, 6; md-contrast 4, 5; and both-bad 9 at 375×812.

## Review

A fresh reviewer wrote their own reference model from `SPEC.md` and compared it with `sim.js` over all 5 scenes × 3
layouts × `copies2` on/off, every step (disk contents, rotten/healed flags, CKSUM per device and pool line, permanent
list, scrub totals, md mismatch and reads): no difference. Of 45 mutants, 9 survived; the 5 that mattered (READ counted
on a checksum error, duplicate permanent entries, md check and walk skipping free blocks, the ZFS whole pass doing
nothing or stopping at the first good copy) are now tested (25 tests) and each fails its test; the other 4 cannot
change any result with at most two copies. Fixed from the review:

- "on every copy" / "na svim kopijama" was said on a single disk: a one-copy variant.
- "film.mkv goes on the list" was repeated on a re-read and for a second bad block of the same file: now "is already on
  the list" when it is.
- The term rule glossed *silent corruption* again on md layouts: corrupt steps now count on md too.
- hr "(disk bira sam)" read as "the disk chooses": now "(md sam bira disk)"; "promijenio se jedan bit …" word order.
- Re-corrupting a damaged copy cleared its ↺ mark: no longer (rule 8: nothing changes).
- `mismatch_cnt` per 4K block, the stylized pool/vdev counts and "always the first copy" are now stated as deviations
  in `SPEC.md` (real raid1 counts its resync window; real ZFS retries and balances reads).

The reviewer confirmed the `zpool status -v` wordings, md raid1 repair taking the first device with a good read, and
`last_sync_action` values from their knowledge; still marked *(check)* against the man pages.

## Time

Start 2026-11-04 01:40 CET, done 02:02 CET (about 22 minutes).
