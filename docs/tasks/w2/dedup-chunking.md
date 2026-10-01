# dedup-chunking: Deduplication: fixed vs content-defined chunks

| | |
|---|---|
| Task | `dedup-chunking` (wave 2a, Storage and backup) |
| Catalogue entry | `sto-dedup-chunking` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/dedup-chunking/` |
| Class | stepper |
| Size | M |
| Priority | B1 |
| Courses | DR, NLA |
| Topic / tags / level | `storage` / `deduplication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; pilot: its view becomes kit view **K3 block grid** (wave 2a) |

## Goal

One concept: **an inserted byte shifts every fixed chunk; rolling-hash boundaries resynchronise**.

The student: insert/delete bytes in a file, compare the chunk tables.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T28 (Napredna Linux administracija; chapters not written yet)
- `docs/proposal-simdeck.md` (first batch) and `docs/playbook.md` §10.8
- Catalogue seed: proposal first batch; NLA T28 → §5.3
- `~/projects/uvod-u-linux/book/chapters/23-odrzavanje-sustava.md`, "Alati koji probu oporavka rade jeftinijom"
  (borg and restic named, "odsječci podataka") for the Croatian terms; no worked dedup example in the books
- Standard references for the rule (no local copy): A. Muthitacharoen et al., "A Low-bandwidth Network File
  System" (LBFS, SOSP 2001, Rabin-fingerprint chunking); W. Xia et al., "FastCDC" (USENIX ATC 2016); restic
  design document "Chunking"; BorgBackup docs "Internals: chunker" *(check)*

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Model and presets

- **Scene:** this sim is the pilot of kit view **K3 block grid**. Two rows of the same file drawn as a byte
  strip (one cell per byte, ASCII shown): top row **fixed-size chunks**, bottom row **content-defined chunks
  (CDC)**. Under each row its chunk table (`#`, offset, length, short hash, `same`/`NEW`) and a counter
  "reused k of n chunks, new bytes stored". On the right a small **chunk store** (set of hashes already
  stored, from the original version).
- **State:** `{ original: string, edited: string, edit: {kind:'insert'|'delete'|'none', at, text},
  fixed: {orig: Chunk[], edited: Chunk[]}, cdc: {orig: Chunk[], edited: Chunk[]}, phase, cursor }` with
  `Chunk = {start, len, hash, status:'same'|'new'}`. Strings are ASCII so one character = one byte.
- **One step:** phases in order: (1) show the original and chunk it both ways, store all chunk hashes;
  (2) apply the edit (insert/delete); (3) re-chunk with fixed size, one chunk per step, mark each `same`
  (hash already in store) or `NEW`; (4) re-chunk with CDC the same way, the rolling window drawn sliding
  over the bytes; (5) totals: chunks reused, bytes newly stored, for both methods side by side.
- **Rules:**
  1. Fixed chunking cuts at offsets 0, S, 2S, …; the last chunk may be shorter (standard; (check) against
     NLA T28 once written).
  2. CDC cuts *after* byte i when the rolling value of the last `w` bytes satisfies `h mod D = 0`, but only
     if the chunk is already ≥ `min` bytes; a chunk is cut unconditionally at `max` bytes. The rest of the
     file after the last cut is the final chunk. Toy hash for the lecture: `h` = sum of the byte values in
     the window (a rolling sum: add the new byte, subtract the one leaving); real systems use a Rabin
     fingerprint or a Gear hash (FastCDC) (derived; (check) against the published CDC papers in Sources).
  3. Tie-break: when the min rule and the hash rule disagree, `min` wins (no cut); when `max` is reached,
     cut even if the hash condition is false. Evaluate the `max` rule after the hash rule on the same byte.
  4. A chunk is `same` when its hash is already in the store; only `NEW` chunks add bytes to the store
     (block-level dedup). Identical chunks inside one version are stored once.
  5. An insert or delete shifts every later byte: every fixed chunk from the edit onward changes; CDC
     boundaries depend only on content, so they reappear once the window has passed the edit
     (resynchronisation) and later chunks are `same`.
- **Params:** `size` choice 4 / 8 / 16 (fixed chunk size and CDC average `D`, default 8); `window` choice
  3 / 4 / 5 (default 4); `min` / `max` fixed at size/2 and 2·size (shown, not editable); `edit` select
  (insert at start / insert in middle / delete in middle / none, default per preset); `showHash` toggle
  (off: show `same`/`NEW` only).
- **Presets** (text `kopija se radi svaku noc i sve je uredno, a nitko je ne provjerava`, 66 bytes, S = D = 8,
  w = 4, min 4, max 16; all derived and computed with a script, unchecked against a real chunker):
  1. `prepend` — insert `X` at offset 0. Fixed: 9 chunks before, 9 after, **0 of 9 reused**. CDC: 7 chunks
     (`kopija se ` | `radi` | ` svaku noc` | ` i sve je ured` | `no, a ni` | `tko je ne` | ` provjerava`),
     after the edit only the first (`Xkopija se `) is new: **6 of 7 reused**.
  2. `insert-middle` — insert `!` at offset 30 (after `sve`). Fixed: first 3 reused, **6 of 9 new**. CDC:
     ` i sve! j` and `e ured` new, **6 of 8 reused**.
  3. `delete-middle` — delete byte 20 (the space before `noc`). Fixed: 2 reused, 7 new. CDC: ` svakunoc `
     and `i sve je ured` new, **5 of 7 reused**.
  4. `no-edit` — the same file backed up twice: both methods reuse every chunk (9/9 and 7/7); shows that
     fixed chunking is fine when nothing shifts (derived).
  5. `small-chunks` — `prepend` with S = D = 4 (min 2, max 8): fixed 17 chunks, **0 of 17 reused**; CDC 16
     chunks, **15 of 16 reused** (derived, script). Chunks are decided four per step in this preset.
- **Steps:** 1 (original) + 1 (edit) + one per fixed chunk + one per CDC chunk + 1 (totals): `prepend` 19,
  `insert-middle` 20, `delete-middle` 19, `no-edit` 19, `small-chunks` 11 (four chunks per step). Declare no exception: group fixed chunks two per
  step if a preset would pass 20.
- **Legend:** fixed chunk (solid outline), CDC chunk (dashed outline), `same` (hatched, "=" badge), `NEW`
  (solid fill, "+" badge), rolling window (bracket above the bytes). "Changed" highlight marks the chunk
  decided in this step and, in step 2, the inserted/deleted byte.
- **Captions:**
  - hr: „Fiksni odsječak 4 (*chunk*, odsječak) počinje na 24 kao i prije, ali sadržaj mu se pomaknuo za
    jedan bajt: sažetak je nov, pa se sprema."
  - en: "CDC found the boundary after `radi` again: from here on every chunk matches the stored one."
- **Terms:** chunk — odsječak; deduplication — deduplikacija (NLA T28); fixed-size chunking — odsijecanje
  na stalnu duljinu; content-defined chunking — odsijecanje po sadržaju; rolling hash — klizni sažetak;
  hash/digest — sažetak (UL ch23 uses „sažetak" for `sha256sum`); chunk store — spremište odsječaka;
  boundary — granica odsječka.
- **Misconceptions:** "dedup compares whole files" (that is the funnel, `dedup-file-funnel`); "a one-byte
  change costs one block" (true for an overwrite, false for an insert with fixed chunks); "CDC chunks are
  all the same size".
- **Out of scope:** file-level dedup (link `dedup-file-funnel`), compression and encryption of chunks, hash
  collisions, real Rabin/Gear polynomials, the index/RAM cost of the chunk store, dedup across clients.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh dedup-chunking sims/dedup-chunking` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dedup-chunking/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
