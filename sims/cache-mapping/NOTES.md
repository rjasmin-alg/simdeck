<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cache-mapping: notes

New stepper (task `docs/tasks/w3/cache-mapping.md`, catalogue `arh-cache-mapping`, §4.9). The page draws its own
stage (no kit view fits: an address strip, a sets × ways table and a trace with two mark columns). Rules and
expected numbers: `SPEC.md`.

## Decisions

- **Layout.** The task puts the address strip left, the cache centre and the trace right. With 12 bit boxes large
  enough to read on a projector, the strip fits better on top of the cache: the left column holds the strip above the
  cache table, the right column the trace. Same three parts, same reading order (address → set → trace).
- **The fully associative reference is a mark column, not a second cache table.** The task asks for "a second, greyed
  column [with] the same trace on a fully associative cache". It is drawn as the grey H/M column beside this cache's
  marks in the trace, plus its own count line; its 8 blocks are not drawn as a table (it would double the stage, and
  the 8-way setting shows exactly that cache in the table). The shadow is in the state (`fa`) and in the caption's
  reasoning ("A fully associative cache would still hold it").
- **One step = one access**, all six phases at once: the strip shows the split with the set bits marked as changed, the
  set's label is highlighted, the touched line is outlined with its H/C/P/K mark and the victim it replaced (a grey
  crossed chip), and the caption narrates the phases in order (split, set, tags held, result and victim, why).
- **Step 0** shows the first address of the trace as "Next address" (dimmed bits), so the split is visible before the
  first →.
- **Params**: `trace` is a choice (4 options) and resets; `ways` and `block` recompute the same step (task: `ways`
  `resets: false`; the same for `block`). The presets set `trace` and `ways: 1`, so loading one always starts from
  the direct-mapped case and the student changes the ways themselves; the preset hints say what to try.
- **"Feed addresses"** is stepping through a trace; there is no free address entry (the task's params list only the
  presets' traces, and the kit has no text param). A custom trace would be a later preset or param.
- **LRU age** is shown as `age = i − lastUse` (accesses since the line was last used; 0 = this step). The largest age
  in a full set is the next victim.
- **Marks**: H with ✓ in the ok colour; misses ✕ plus their letter on a red tint like the legend's miss swatch, C
  dashed, P solid, K thick; the victim chip is grey and crossed like the legend's evicted swatch; the shadow's H/M grey. The letters H/C/P/K/M are the task's and are the same in both
  languages (they are in the tables as `mH` … `mM`; the legend spells them out). Grayscale: the letters and border
  styles carry the meaning.
- **End caption** (COMMON §11 "show each outcome"): hits out of n for this cache and for the fully associative one,
  plus a highlighted note when it applies: conflict misses with empty lines left ("the cache is not too small, the
  mapping is; more ways help", misconception 1) or this cache beating the fully associative one (misconception 2, preset 4).
- **Long trace** (20 accesses): one column, rows in the small size (16 px), so the counts stay visible at 1920×1080 in
  Croatian with a three-line caption.
- **Phone**: the three parts stack in a 50rem stage; cells show only the tag, the trace drops the index and the grey
  column.
- **`entries`**: the four presets, so a course list can link "cache-mapping#ping-pong" etc.

## Deviations from the task

- Layout and the reference column as above (same content, different arrangement).
- `state` has extra fields: `faHits`, and per log entry `block`, `offset`, `way`, `held` (tags in the set before the
  access, for the caption) and `faHit`, `faVictim`. Same content as the task's shape otherwise.
- The task's caption is for step 4 of `ping-pong` (the first *conflict*; step 2, the first 0x080, is compulsory); the
  page adds one sentence of reason after it. Both languages match the task's wording otherwise.
- **Misconception 1 reworded.** The task says "a bigger cache would fix ping-pong" is the misconception. Strictly, a
  bigger direct-mapped cache *does* fix it (with 16 lines block 8 maps to set 8; the page's own 32 B option, a 256 B
  cache, gives `CCHHHHHH`). What is true is that the cache is not too small (7 of 8 lines stay empty): the page says
  "not a size problem; more ways help" instead of "a bigger cache would not help".
- Croatian *cache*: the task says *priručna memorija* (ossimulator; also `tags.json`'s `caches` label "priručne
  memorije"), but `kit/glossary.js` has `cache` = *predmemorija* (src uvod-u-linux), and `multicore-mesi` uses
  *predmemorija*. The page follows the task and writes the pair out instead of `[[cache]]`; *predmemorija* is in the
  Croatian aliases so search finds it. Owner decision (see report).

## Sources

- J. L. Hennessy, D. A. Patterson, *Computer Architecture: A Quantitative Approach*, Appendix B.1: block placement
  (set = block mod sets), identification (tag), replacement (LRU), and the three Cs (compulsory, capacity, conflict,
  with capacity and conflict defined against a fully associative cache of the same size) *(check: appendix and
  section numbers in the edition at hand)*.
- D. A. Patterson, J. L. Hennessy, *Computer Organization and Design*, ch. 5: direct-mapped and set-associative
  caches, the address fields *(check: chapter/section in the edition at hand)*.
- M. D. Hill, the 3C model (as cited by H&P) *(check: original citation, Hill's 1987 thesis)*.
- ossimulator `src/modules/raid-cache/meta.ts` (*priručna memorija diska*) and `address-translation/NOTES.md`
  (fully associative TLB, LRU, "potpuno asocijativni"; LRU left untranslated).
- No local course material (task).

## Unchecked *(check)*

- The book section numbers above, and the Hill citation.
- The Croatian term pairs below that are marked *(check)*.
- Whether the course counts a miss that is both "first access" and "fully associative miss" as compulsory: the model
  does (compulsory first, the standard 3C order).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| cache | priručna memorija (task, ossimulator; glossary has *predmemorija*, see Deviations) |
| tag | oznaka *(check)* |
| set | skup *(check)* |
| way | put *(check)* |
| cache line / block | linija / blok |
| direct mapped | izravno preslikavanje (task) |
| set associative (n-way) | (n-struko) skupno asocijativna (task) |
| fully associative | potpuno asocijativna (ossimulator TLB notes) |
| miss | promašaj (task) |
| compulsory miss | obvezni promašaj *(check)* |
| capacity miss | promašaj zbog kapaciteta *(check)* |
| conflict miss | promašaj zbog sukoba (task, *check*) |

Glossary terms used: `offset` (pomak), `hit` (pogodak), `locality` (lokalnost).

## Shared requests

None.

## Checks

- Numbers: an independent Python script (OrderedDict LRU per set and a separate fully associative LRU) gave the task's
  numbers for all four presets at 16 B, and the per-access marks for every ways × block combination; the model agrees
  (tests pin the 16 B ones and the 32 B ping-pong case in SPEC).
- Tests: 32; every rule and tie-break has one. Mutation run on a scratch copy, 16 mutants (set and tag formula,
  offset, hit ignoring valid, no refresh on hit, highest invalid way, MRU eviction, no invalid-first, no victim,
  capacity/conflict swapped, no compulsory, shadow MRU eviction, shadow not refreshed on a hit, shadow of 9, hit
  count, short trace): all killed. Two were equivalent at first (invalid lines carry `tag: null`, and `null < n`
  makes an invalid way the LRU one); direct tests on crafted states now pin them.
- `npm run gate -- cache-mapping`: pass (65/65 browser checks, 0 exceptions). Screenshots reviewed: 1920×1080 light, dark,
  grayscale in hr and en, 375×812, plus 2-, 4- and 8-way layouts and the end of every preset.

## Review

A fresh reviewer (subagent, no shared context) recomputed all 48 trace × ways × block combinations with its own
script (all match), ran 35 mutants and replayed the caption logic for every step in both languages. Findings and what
was done:
- Hit way never tested beyond way 0 (mutant `way = 0` survived; the page draws the H mark from it): test added.
- "A bigger cache would not help" was false (see Deviations): reworded in the end note and the explanation.
- The reason sentence's "it" / "ga" read as the evicted block: it now names the accessed block.
- "LRU evicts exactly the block needed next" was not literal at access 11: now "the block it will need soonest".
- Legend swatches did not match the marks: misses now carry ✕ on a red tint, the victim chip is grey and crossed.
- `held` order and `lines` order untested: tests added. Unreachable string `addrNone` removed; hr label "Broj putova
  u skupu"; SPEC names `multicore-mesi`.
- Equivalent survivors (no change): `<` → `<=` in LRU (no ties), classification order variants.

## Time

Start 14:40, done 14:58 (2026-11-08): about 20 minutes.
