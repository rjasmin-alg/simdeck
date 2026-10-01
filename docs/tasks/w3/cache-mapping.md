# cache-mapping: Cache mapping

| | |
|---|---|
| Task | `cache-mapping` (wave 3, Computer architecture, OS gaps and automata) |
| Catalogue entry | `arh-cache-mapping` in `docs/catalogue.md` §4.9 |
| Kind | build a new simulator |
| Folder | `sims/cache-mapping/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | ARH, OS |
| Topic / tags / level | `architecture` / `caches` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **direct-mapped vs set-associative; conflict misses**.

The student: feed addresses, change associativity.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.9.

## Sources

- No local course material. Use standard textbooks: J. L. Hennessy, D. A. Patterson, *Computer Architecture: A Quantitative Approach*, Appendix B.1 (block placement, identification, replacement; the "three Cs"); D. A. Patterson, J. L. Hennessy, *Computer Organization and Design*, ch. 5 (direct-mapped and set-associative caches). Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Croatian term *priručna memorija*: `/home/rjasmin/projects/ossimulator/src/modules/raid-cache/meta.ts` and `address-translation/NOTES.md` (TLB as a fully associative LRU cache, for consistency of replacement wording).

## Model and presets

- **Scene:** left, the address strip of the current access (12-bit address split into tag | set index | offset,
  bit widths shown); centre, the cache as a table of sets × ways (8 lines in total), each line showing valid,
  tag, block number and an LRU age; right, the access trace with one H/M mark per access and running counts of
  hits and the three miss kinds. A second, greyed column shows the same trace on a fully associative cache of
  the same size (the reference that classifies misses).
- **State:** `{ i, lines: [{set, way, valid, tag, block, lastUse}], fa: [block…] (LRU order), log: [{addr,
  set, tag, result: 'hit'|'compulsory'|'capacity'|'conflict', victim}], hits, misses: {compulsory, capacity,
  conflict} }`.
- **One step:** one memory access from the trace, phases in order: (1) split the address, (2) select the set,
  (3) compare the tag with every valid way, (4) on a miss choose the victim and fill, (5) classify the miss
  against the fully associative shadow, (6) update LRU ages and counts.
- **Rules:**
  1. Block = ⌊addr / B⌋, offset = addr mod B, sets S = lines / ways, set = block mod S, tag = ⌊block / S⌋
     (Hennessy & Patterson, *Computer Architecture: A Quantitative Approach*, App. B.1 "block placement").
  2. Hit if any valid way in the set holds the tag; a hit only refreshes that way's `lastUse`.
  3. Miss: fill the lowest-numbered invalid way; if none, evict the way with the smallest `lastUse` (LRU).
     Tie-break: never ties, `lastUse` is the access index; with all ways invalid, way 0 first.
  4. Direct mapped = 1 way (no choice of victim); fully associative = ways = lines (S = 1).
  5. Miss classification (3C model, Hill; H&P App. B.1): compulsory = first access to that block ever;
     capacity = not compulsory and a fully associative LRU cache of the same size also misses; conflict = the
     rest (the fully associative cache would have hit).
  6. Reads and writes are treated alike (write policy out of scope).
- **Params:** `ways` choice 1 / 2 / 4 / 8 (default 1, `resets: false`, so the same step is recomputed);
  `block` choice 8 / 16 / 32 B (default 16); `lines` fixed at 8; `trace` select of the presets' traces.
- **Presets** (8 lines, 16 B blocks; all derived and checked with a script, standard textbook behaviour):
  1. `ping-pong`: 0x000, 0x080 ×4 (8 accesses). Both map to set 0 when direct mapped (0x080 = block 8,
     8 mod 8 = 0). 1-way: 0 hits, 2 compulsory + 6 conflict misses. 2-way (4 sets): 2 compulsory, 6 hits.
  2. `three-way`: 0x000, 0x080, 0x100 ×3 (9 accesses). 1-way and 2-way: 0 hits (3 compulsory + 6 conflict;
     LRU evicts exactly the block needed next); 4-way: 3 misses, 6 hits.
  3. `locality`: 0x000, 0x004 … 0x01C (8 accesses, 4-byte words). Any associativity: miss, hit, hit, hit,
     miss, hit, hit, hit (2 compulsory, 6 hits): spatial locality comes from the block, not from ways.
  4. `capacity`: blocks 0x000 … 0x090 step 0x10 (10 blocks) twice, 20 accesses. 8-way (fully associative):
     10 compulsory + 10 capacity, 0 hits. 1-way: 10 compulsory, then 4 capacity misses and 6 hits (blocks 2–7
     survive). 2-way: 4 hits. More associativity is not always better under LRU.
- **Steps:** one per access: 8, 9, 8, 20.
- **Legend:** valid line (filled), invalid (hollow), hit (✓ green + "H"), miss kinds with letters C / P / K
  (compulsory, capacity, conflict) and patterns, victim (crossed). "Changed" marks the line filled or touched
  in this step and the address bits of the set index.
- **Captions:**
  - hr: „Adresa 0x080: blok 8, skup 8 mod 8 = 0, oznaka 1. U skupu 0 je oznaka 0 → promašaj zbog sukoba;
    izbacujemo blok 0.“
  - en: "Address 0x080: block 8, set 8 mod 8 = 0, tag 1. Set 0 holds tag 0 → conflict miss; block 0 is
    evicted."
- **Terms:** cache — priručna memorija (ossimulator); cache line / block — linija / blok; set — skup;
  direct mapped — izravno preslikavanje; set associative — skupno asocijativna; tag — oznaka; hit / miss —
  pogodak / promašaj; conflict miss — promašaj zbog sukoba (check).
- **Misconceptions:** a bigger cache would fix ping-pong (it is a conflict, the cache is mostly empty);
  higher associativity always helps (preset 4); hits come from repeated addresses only (preset 3).
- **Out of scope:** write-back/write-through, multi-level caches, replacement policies other than LRU
  (FIFO/random could be a later param), coherence (`mesi-coherence`), virtual vs physical indexing.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh cache-mapping sims/cache-mapping` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cache-mapping/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
