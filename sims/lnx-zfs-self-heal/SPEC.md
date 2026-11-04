<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-zfs-self-heal: spec

One concept: **a scrub finds a bad block and repairs it from the mirror.** Task `docs/tasks/w3/lnx-zfs-self-heal.md`,
catalogue `lnx-zfs-self-heal` (§4.4). Stepper on kit view K3 (block grid). Builds on `lnx-cow-filesystem` (the block
grid and the tree of pointers above the data).

## Model

```
redundancy: 'mirror' | 'single' | 'md-mirror'
disks:      [{ name, copy, blocks: [{ data, rotten, healed }] }]   one entry per copy of the data, 10 blocks each
ptrs:       [{ block, sum }]          a pointer per allocated block (0–7); sum null on md (no checksums)
counters:   { sda: { read, write, cksum }, sdb: {…}, top: {…} }   top: the pool and vdev lines
scrub:      null | { at, done, repaired, errors, kind }   kind 'zfs', or md's 'check' / 'repair'
permanent:  [block]                   blocks no copy could serve
mismatch:   md mismatch_cnt, in sectors
mdReads:    md reads so far (which copy md reads)
last:       what this step did: { op, block, copy, read: [{ copy, sum, ok }], wrote: [copy], from, result, … }
```

Pool `tank`; `mirror` is vdev `mirror-0` of `sda` and `sdb`; `single` is `sda` alone, or `sda` with two copies of every
block (`copies2`); `md-mirror` is an md RAID 1 `md0` of `sda` and `sdb` with a filesystem without data checksums.
Blocks 0–7 are allocated (`log.txt` 0–2, `film.mkv` 3–6, `todo.md` 7), blocks 8–9 free. Block k holds one byte, the
letter A–H; bit rot flips bit 0x20 (D → d). Above the data: a root block carrying the sum of the pointer block, and the
pointer block (L1) with a pointer and its sum per data block. A block is 4K (8 sectors of 512 bytes).

The checksum is a toy (16-bit FNV-1a, 4 hex digits) standing for fletcher4 / sha256; it differs for all 16 contents the
model can hold (tested).

## Rules

1. **Each block pointer stores the checksum of the block it points to** (default fletcher4, `sha256` optional), so a
   block is checked by its parent, not by itself. Bit rot changes no counter: the disk reports success.
   (zfsprops(7) `checksum`; zfsconcepts(7) *(check)*)
2. **On read, a copy whose checksum does not match is rejected;** on a mirror the other copy is read and, if it matches,
   returned to the application, and the bad copy is rewritten from it (self-healing); the bad device's `CKSUM` counter
   goes up by one. READ and WRITE stay 0 (they count errors the device reported). The application sees no error.
   (zpoolconcepts(7) *(check)*)
3. **A scrub reads every allocated block on every copy** and repairs as in rule 2; free space is not checked. One step
   is one block. The scan line counts repaired copies × 4K. (zpool-scrub(8))
4. **If no copy matches, the error is permanent:** each bad copy counts a `CKSUM` on its device, the pool and vdev lines
   count one, a read returns EIO, and `zpool status -v` lists the file under "Permanent errors have been detected in
   the following files:". (zpool-status(8) *(check wording and the pool/vdev counts)*)
5. **A single-disk pool detects the bad block but cannot repair it,** unless the dataset keeps extra copies
   (`copies=2`): then copy 2 on the same disk serves the read and copy 1 is rewritten. Reading a permanently bad block
   again fails again and counts again. (zfsprops(7) `copies`)
6. **md RAID 1 has no checksums.** A read takes one copy and returns it unchecked; a check compares the copies and
   adds 8 sectors to `mismatch_cnt` per differing 4K block, free blocks included (md does not know which blocks are in
   use), and changes nothing; `repair` writes the first device's copy over the other where they differ, right or wrong.
   On md the per-block scrub walk is a check. (md(4) `mismatch_cnt`, `sync_action` *(check)*; drivers/md/raid1.c
   `process_checks` takes the first device with a good read as the primary *(check)*)
7. **Tie-breaks:** the copy on the first device of the vdev (copy 1) is read first, and a read stops at the first good
   copy (so a read never sees damage on the other copy); a scrub reads all copies; if both are bad the block is reported
   once (one permanent entry, one count on the pool line, the file listed once), not per copy. md reads alternate
   between the disks, `sda` first (a stand-in for md's read balancing, which may pick either copy).
8. **A scene names copies by index** (0 = `sda`, 1 = `sdb` or `sda` copy 2); with fewer copies the index wraps, so every
   scene runs under every layout. Corrupting an already damaged copy changes nothing.

On ZFS the md scene's `check` and `repair` are each one whole scrub in a step (a ZFS scrub always repairs).

## Presets and expected numbers

Printed by a node script over the model before the page was written (NOTES.md, Checks).

| # | preset | layout | steps | numbers |
|---|---|---|---|---|
| 1 | `scrub-repairs` | mirror | **10** (2 corruptions + 8 scrubbed blocks) | rot 3, 5 on sdb; steps 6 and 8 heal from sda; end: sdb CKSUM 2, sda 0, pool 0, `scrub repaired 8K with 0 errors` (2 blocks), `No known data errors` |
| 2 | `read-heals` | mirror | **6** (corrupt + read 3, 4, 5, 6 + read 4) | rot 4 on sda; step 3: sda ✗, sdb ✓, sda rewritten, sda CKSUM 1; step 6: sda ✓, CKSUM stays 1; no scrub |
| 3 | `both-bad` | mirror | **10** | rot 6 on sda and sdb; step 9: both ✗, sda 1, sdb 1, mirror-0 1, tank 1; `scrub repaired 0B with 1 errors`; permanent `/tank/film.mkv` |
| 4 | `single-disk` | single | **6** (corrupt + read 3, 4, 5, 6 + read 3) | rot 3; step 2: CKSUM 1, EIO, permanent `film.mkv`; step 6: CKSUM 2. With `copies2`: step 2 heals from copy 2, CKSUM 1, no permanent error |
| 5 | `md-contrast` | md-mirror | **6** (corrupt, read, read, check, repair, read) | rot 3 on sda; step 2 reads sda: wrong data, no error; step 3 reads sdb: good; step 4 `mismatch_cnt` 8; step 5 repair copies sda over sdb: both wrong; step 6 wrong data, no error |

Defaults = preset 1: `sim.json` `steps` 10.

## Params

`scene` (hidden; the presets set it) · `redundancy` `mirror` | `single` | `md-mirror`, default `mirror`, resets ·
`copies2` (shown only for `single`), default off, resets.

## Deviations from the task

- **10 blocks per disk, not 8:** 0–7 allocated (the 8 the scrub reads, so preset 1 keeps its 2 + 8 steps), 8–9 free,
  to show rule 3 (free space is not read) and rule 6 (md compares it).
- **md-contrast rots `sda`, not just "one disk",** and adds `repair`: md's repair writes the first device's copy over
  the other, so the rot spreads to both disks. Same corruption as `read-heals` (a copy on the first device), opposite
  outcome.
- **single-disk** reads block 3 a second time (step 6): `CKSUM` ends at 2, not 1 (1 at detection, step 2).
- **Pool and vdev counters** (`top`) are not in the task's state; added for the `zpool status` panel (rule 4). They are
  stylized: one count per block no copy could serve, the same on both lines. Real ZFS retries a failed read and its
  pool and vdev lines can show larger and different counts *(check)*.
- **`mismatch_cnt` grows by 8 per differing 4K block** (the block's sectors). Real raid1 adds the sectors of its whole
  resync window (up to 64K, 128 sectors), so real counts come in multiples of up to 128 and two damaged blocks in one
  window count once; per block is kept here so the count follows the picture *(check)*.
- **A read always takes the first copy** (rule 7). Real ZFS mirrors balance reads across the disks; the explanation
  says "here always the first".
- **Scan line** prints bytes (`8K`), as the real output does; the caption says the number of blocks. The real line also
  has the duration and the date; left out.
