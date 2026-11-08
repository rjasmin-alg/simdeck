<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cache-mapping: specification

One concept: **direct mapped vs set associative; conflict misses** (task `docs/tasks/w3/cache-mapping.md`,
catalogue `arh-cache-mapping`, §4.9). The student feeds a trace of addresses through a cache of 8 lines, one access
per step, and changes the associativity; the same trace on a fully associative cache of the same size sorts every
miss into compulsory, capacity or conflict.

Sources: J. L. Hennessy, D. A. Patterson, *Computer Architecture: A Quantitative Approach* (H&P CA), Appendix B.1
("Four memory hierarchy questions": block placement, identification, replacement; "the three Cs"); D. A. Patterson,
J. L. Hennessy, *Computer Organization and Design* (P&H COD), ch. 5 (direct-mapped and set-associative caches).
The 3C model is M. D. Hill's (as cited in H&P CA App. B). Section and page numbers were not checked against a copy
*(check)*; every number below was computed by the model and by an independent script (NOTES.md "Checks").

## Model

- **Cache:** `LINES = 8` lines (fixed), block size `B` ∈ {8, 16, 32} bytes, `ways` ∈ {1, 2, 4, 8}, sets
  `S = 8 / ways`. Addresses are 12-bit byte addresses (`ADDR_BITS = 12`).
- **Address fields:** offset `log2 B` bits, set index `log2 S` bits (0 bits when fully associative), tag the rest
  (`12 − offset − set`). The strip shows the bits, most significant first: tag | set | offset.
- **Fully associative shadow:** a separate LRU cache of 8 blocks, fed the same trace, kept as a list of block numbers
  in LRU order (index 0 = least recently used). It never changes the cache under study; it only classifies misses.
- **State:** `{ i, lines: [{set, way, valid, tag, block, lastUse}], fa: [block…], log: [{addr, block, offset, set,
  tag, way, held, result, victim, faHit, faVictim}], hits, faHits, misses: {compulsory, capacity, conflict} }`.
  `lines` is ordered by set, then way. `held` is the list of valid tags of the set before the access (in way order),
  for the caption. `result` ∈ `hit | compulsory | capacity | conflict`. `victim` is the evicted block number or `null`.

## Rules

1. **Placement and identification** (H&P CA App. B.1, "block placement"): block = ⌊addr / B⌋, offset = addr mod B,
   set = block mod S, tag = ⌊block / S⌋.
2. **Hit:** a valid way of the selected set holds the tag. A hit changes nothing but that way's `lastUse` (set to the
   access index n).
3. **Miss, victim and fill:** fill the lowest-numbered invalid way of the set; if every way is valid, evict the way
   with the smallest `lastUse` (LRU). The filled way gets `valid`, the tag, the block and `lastUse = n`.
   - **Tie-breaks:** `lastUse` is the access index, so no two valid lines share it and LRU has no ties. With several
     invalid ways, way 0 first (then 1, …). An invalid way is always taken before any valid one is evicted.
4. **Shapes:** direct mapped = 1 way (8 sets; no choice of victim); fully associative = 8 ways (1 set, no set bits).
5. **Miss classification** (3C, Hill; H&P CA App. B.1), in this order:
   - **compulsory (C):** the first access to that block in the trace (no earlier log entry has this block), whatever
     the shadow says;
   - **capacity (P):** not compulsory, and the fully associative LRU shadow misses too;
   - **conflict (K):** the rest: the shadow hits, only the mapping lost the block.
   The shadow is looked up before it is updated, and updated on every access (hit or miss): the block moves to the
   most recent end; on a shadow miss with 8 blocks held, its least recently used block (`fa[0]`) is dropped.
   A fully associative cache under study behaves exactly like the shadow, so it never has a conflict miss.
6. **Reads and writes** are treated alike (write policy out of scope).

One step = one access, phases (1) split the address, (2) select the set, (3) compare the tag with every valid way,
(4) on a miss choose the victim and fill, (5) classify against the shadow, (6) update `lastUse` and the counts.
Counts: `hits + compulsory + capacity + conflict = i` at every step.

**Displayed age** of a line: `i − lastUse` (0 = used in this step; the line with the largest age in a full set is the
next victim).

## Params

| key | values | default | resets |
|---|---|---|---|
| `trace` | `ping-pong`, `three-way`, `locality`, `capacity` | `ping-pong` | yes (another trace starts empty) |
| `ways` | 1, 2, 4, 8 | 1 | no: the same step is recomputed |
| `block` | 8, 16, 32 (bytes) | 16 | no |

Steps = the trace's length: 8, 9, 8, 20 (`sim.json` `steps` = 8, the default trace).

## Presets (8 lines, 16 B blocks; each sets `trace` and `ways: 1`)

Marks per access: H hit, C compulsory, P capacity, K conflict.

1. **`ping-pong`**: 0x000, 0x080 × 4 (8 accesses). 0x080 = block 8, set 8 mod 8 = 0, tag 1: both blocks in set 0.
   - 1-way: `CCKKKKKK`: 0 hits, 2 compulsory + 6 conflict; 7 of 8 lines stay empty.
   - 2-way (4 sets): `CCHHHHHH`: 2 compulsory, 6 hits. 4- and 8-way the same.
2. **`three-way`**: 0x000, 0x080, 0x100 × 3 (9 accesses). Blocks 0, 8, 16: set 0 for 1, 2 and 4 ways.
   - 1-way and 2-way: `CCCKKKKKK` (LRU evicts exactly the block needed next); 4-way and 8-way: `CCCHHHHHH`.
3. **`locality`**: 0x000, 0x004 … 0x01C (8 accesses, 4-byte words), blocks 0,0,0,0,1,1,1,1.
   - Every associativity: `CHHHCHHH` (2 compulsory, 6 hits). The hits come from the block, not from the ways.
4. **`capacity`**: 0x000 … 0x090 step 0x10 (blocks 0–9), twice: 20 accesses.
   - 8-way (fully associative): 10 C + 10 P, 0 hits. 4-way: the same.
   - 1-way: `CCCCCCCCCCPPHHHHHHPP`: 10 C, 4 P, 6 hits (blocks 2–7 survive the first pass).
   - 2-way: `CCCCCCCCCCPPHHPPHHPP`: 4 hits. More associativity is not always better under LRU.
   - The shadow misses all 20, so every non-compulsory miss here is P, also in the direct-mapped cache.

Other block sizes (computed, shown by the page, not taught by a preset): with 32 B blocks `ping-pong` 1-way becomes
`CCHHHHHH` (0x080 = block 4, set 4); `locality` with 8 B blocks is `CHCHCHCH`, with 32 B `CHHHHHHH`.

**Task caption** (ping-pong, 1-way, step 4): hr „Adresa 0x080: blok 8, skup 8 mod 8 = 0, oznaka 1. U skupu 0 je oznaka 0
→ promašaj zbog sukoba; izbacujemo blok 0.“; en "Address 0x080: block 8, set 8 mod 8 = 0, tag 1. Set 0 holds tag 0 →
conflict miss; block 0 is evicted." The page adds one sentence of reason ("A fully associative cache would still hold
block 8.") after it. (Step 2, the first 0x080, is a compulsory miss that also evicts block 0.)

## Out of scope

Write-back / write-through, multi-level caches, replacement policies other than LRU, coherence (`multicore-mesi`),
virtual vs physical indexing.
