# dedup-chunking: Deduplication, fixed vs content-defined chunks

<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

Task: `docs/tasks/w2/dedup-chunking.md` (catalogue `sto-dedup-chunking`, §4.6; overlap §5.3). Class: stepper.
Pilot of kit view **K3: block grid**.

**One concept:** an inserted byte shifts every fixed chunk after it; boundaries cut by a rolling hash of the content
come back once the window has passed the edit (resynchronisation), so the later chunks are found in the store again.

## Scene (K3)

The same file drawn twice as a byte strip, one cell per byte (ASCII shown, a space as a dot): the top row cut into
**fixed-size chunks** (solid outlines), the bottom row into **content-defined chunks** (CDC, dashed outlines). Under
each strip a band with the chunk numbers and, per chunk, a column of the chunk table: `#`, offset, length, short hash
(4 hex digits), `same` (= badge, hatched) / `NEW` (+ badge, solid fill). Beside each row its counter, "reused k of n
chunks, new bytes stored", and its **chunk store**: the hashes stored so far (from the original; new ones are added
as they are found). In the CDC phase a bracket above the strip marks the rolling window at the current cut.

## State

```
{ original, edited (null before step 2), edit: { kind: 'insert'|'delete'|'none', at, text },
  size, window, min, max, gf, gc,
  fixed: { orig: Chunk[], edited: Chunk[], store: [hash], origBytes },
  cdc:   { orig: Chunk[], edited: Chunk[], store: [hash], origBytes },
  phase: 'start'|'original'|'edit'|'fixed'|'cdc'|'totals', cursor, last: [chunk indices decided in this step] }
Chunk = { start, len, hash, status: 'same'|'new' }  (+ CDC: cut: 'hash'|'max'|'end', sum, win: [from, to], ignored)
```

Strings are ASCII, so one character is one byte. `hash` is 32-bit FNV-1a as 8 hex digits, a stand-in for the strong
hash a real store uses (collisions are out of scope); the page shows the first 4 digits. The two methods keep
separate stores (two independent backups of the same files).

## One step

0. The original file, not cut yet; both stores empty.
1. **Original:** cut the original both ways; every chunk goes into its method's store (all `NEW` on a first backup).
2. **Edit:** apply the edit (insert / delete / none); the inserted byte, or the gap of the deleted one, is marked.
3. **Fixed:** cut the edited file at fixed offsets, `gf` chunks per step, each marked `same` (hash already in the
   store) or `NEW` (added to the store).
4. **CDC:** the same with content-defined chunks, `gc` per step; the window is drawn at each chunk's cut.
5. **Totals:** chunks reused and bytes newly stored, both methods side by side.

`gf = gc = 1`, except **size 4: four chunks per step**. If a run would still pass 20 steps, the fixed chunks go two
(size 4: eight) per step, then the CDC ones (the task: "group fixed chunks two per step if a preset would pass 20";
only size 8 with window 5 needs it: 9 fixed + 9 CDC chunks would be 21 steps, grouped 17).
Steps = 1 + 1 + ⌈nf / gf⌉ + ⌈nc / gc⌉ + 1.

## Rules

1. **Fixed chunks** start at offsets 0, S, 2S, …; the last one may be shorter (standard; *check* against NLA T28
   once written).
2. **CDC** cuts *after* byte i when the rolling value `h` of the last `w` bytes (bytes i − w + 1 … i) satisfies
   `h mod D = 0`. Toy hash for the lecture: `h` = the sum of the byte values in the window, kept rolling (add the
   byte that enters, subtract the one that leaves). The window runs over the whole file, across chunk boundaries;
   there is no value until it is full (the first w − 1 bytes never cut on the hash). The rest of the file after the
   last cut is the final chunk. Real systems use a Rabin fingerprint (LBFS) or a Gear hash (FastCDC) (derived;
   *check* against the CDC papers in Sources).
3. **Tie-breaks.** A hash hit on a chunk shorter than `min` bytes is ignored (min wins: no cut). A chunk that
   reaches `max` bytes is cut even when the hash condition is false. The `max` rule is evaluated after the hash rule
   on the same byte: a byte that satisfies both is recorded as a hash cut.
4. **Dedup:** a chunk is `same` when its hash is already in the store; only `NEW` chunks add their hash and bytes to
   the store (block-level dedup). Identical chunks inside one version are stored once: the second is `same`.
5. **Shift and resynchronisation:** an insert or delete shifts every later byte, so every fixed chunk from the edit
   onward changes; CDC boundaries depend only on the content of the window, so once the window has passed the edit
   they usually fall where they fell before, and the later chunks are `same`. A **max** cut does not depend on the
   content but on where the previous cut fell, so it carries the shift on until the next hash cut; with a large D and
   a short window the file can end before that (16/3 insert and delete, 16/4 and 16/5 insert: the last CDC chunk is
   `NEW`; 8/3 insert and delete, 4/3 insert resynchronise late). The totals caption says which happened (last CDC
   chunk `same` or not), and the "boundary found again" caption is given only on a hash cut.

## Params

| Key | Type | Values | Default |
|---|---|---|---|
| `size` | choice (resets) | 4, 8, 16: fixed chunk size S and the CDC divisor D | 8 |
| `window` | choice (resets) | 3, 4, 5 bytes | 4 |
| `edit` | select (resets) | `prepend` (insert `X` at 0), `insert` (insert `!` at 30, after `sve`), `delete` (delete byte 20, the space before `noc`), `none` | `prepend` |
| `showHash` | toggle | off: the table shows `same`/`NEW` only, the store only its counts | on |

`min` = size / 2 and `max` = 2 · size are shown, not editable.

## Presets and expected numbers (computed by script and `sim.test.js`; unchecked against a real chunker)

File `kopija se radi svaku noc i sve je uredno, a nitko je ne provjerava` (66 bytes). Size 8: S = D = 8, w = 4,
min 4, max 16. Original CDC chunks: `kopija se ` | `radi` | ` svaku noc` | ` i sve je ured` | `no, a ni` |
`tko je ne` | ` provjerava` (10, 4, 10, 14, 8, 9, 11).

| Preset | Edit | Fixed reused | Fixed new bytes | CDC reused | CDC new chunks | CDC new bytes | Steps |
|---|---|---|---|---|---|---|---|
| `prepend` | `X` at 0 | **0 of 9** | 67 | **6 of 7** | `Xkopija se ` | 11 | 19 |
| `insert-middle` | `!` at 30 | 3 of 9 (**6 new**) | 43 | **6 of 8** | ` i sve! j`, `e ured` | 15 | 20 |
| `delete-middle` | byte 20 | 2 of 9 (7 new) | 49 | **5 of 7** | ` svakunoc `, `i sve je ured` | 23 | 19 |
| `no-edit` | none | 9 of 9 | 0 | 7 of 7 | – | 0 | 19 |
| `small-chunks` | `X` at 0, size 4 (min 2, max 8) | **0 of 17** | 67 | **15 of 16** | `Xkopija` | 7 | **12** |

`small-chunks` decides four chunks per step: 1 + 1 + ⌈17/4⌉ + ⌈16/4⌉ + 1 = **12** (the task says 11; its own formula
gives 12). Default params = `prepend`: `sim.json` `steps: 19`. Longest run over every param combination: 20
(`insert`, size 8, window 4).

Other numbers the tests pin: size 4 / window 3 cuts the original into 15 CDC chunks of which two are the same bytes
(stored once, rule 4); size 8 / window 5 has 9 fixed + 9 CDC chunks and groups the fixed ones two per step (17 steps).

## Legend

Fixed chunk (solid outline); CDC chunk (dashed outline); `same` (hatched, "=" badge); `NEW` (solid fill, "+" badge);
rolling window (bracket above the bytes); changed (yellow + thick outline: the chunk(s) decided in this step and, in
step 2, the inserted byte or the gap of the deleted one).

## Misconceptions the captions answer

"Dedup compares whole files" (that is `dedup-file-funnel`); "a one-byte change costs one block" (true for an
overwrite, false for an insert with fixed chunks); "CDC chunks are all the same size" (the table shows the lengths).

## Out of scope

File-level dedup (`dedup-file-funnel`), compression and encryption of chunks, hash collisions, real Rabin/Gear
polynomials, normalised chunking, the index/RAM cost of the chunk store, dedup across clients.
