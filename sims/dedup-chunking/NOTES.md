<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dedup-chunking: notes

New stepper (task `docs/tasks/w2/dedup-chunking.md`, catalogue `sto-dedup-chunking`, overlap §5.3), pilot of kit view
**K3: block grid**. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Rolling window over the whole file.** The window is the last `w` bytes of the file, across chunk boundaries, and
  has no value until it is full (the first `w − 1` bytes never cut on the hash). This is how a rolling hash works
  (LBFS, restic) and it is the variant that reproduces every number in the task; a window restarted in each chunk
  gives other size-4 numbers (11 of 12 for `small-chunks`).
- **Two stores**, one per method: the two rows are two independent backups of the same file. Each store starts with
  the original's chunks (step 1, all `NEW`, identical chunks once) and grows with the edited version's `NEW` chunks.
- **Hash:** 32-bit FNV-1a as 8 hex digits, 4 shown. Short hashes do not collide on any page state (tested over every
  param combination). Collisions stay out of scope.
- **Step grouping:** four chunks per step at size 4 (the task's `small-chunks`); otherwise one, and if a run would pass
  20 steps the fixed chunks go two per step (only size 8 + window 5: 21 → 17). No exception is declared.
- **Params `size`, `window`, `edit` reset** to step 0 (they change the step count); `showHash` only changes the view.
  `edit` is a select (four options, long labels). `min` and `max` are shown in the CDC row's header, not editable.
- **Captions** name the reason for each CDC cut (`sum mod D = 0`, `max` reached, end of file) and an ignored hit
  below `min` (it happens in chunk 3 of `prepend` and `insert-middle`, so the min tie-break is visible in a preset). The first `same`
  chunk after a new one is the resynchronisation caption; "from here on every chunk matches" is said only when that
  is true for the rest of the run (checked against the whole run), otherwise a weaker sentence. A fixed `NEW` chunk
  behind the edit gets the task's "starts at … as before, but its content has moved" caption.
- **K3 layout:** per method a box with a header (name, settings, version, counter), the byte strip (one grid column per
  byte; chunk outlines and numbers span their columns; the CDC row has a bracket row above for the window), the chunk
  table with one column per chunk of the whole run (columns keep their width as chunks arrive), and the store as hash
  chips (original ones outlined, added ones filled). Spaces are drawn as `·`. The inserted byte is underlined, a
  deleted one leaves a bar at the gap; in step 2 they are highlighted. On a phone the strip and table scroll inside
  their box. Reusable for later K3 pages: the `.dc-strip` grid and the model's `fixedChunks`/`cdcChunks`/`dedup`.
- **Model is promotable:** pure functions over strings and arrays, no words (`EDITS` and `TEXT` are data).
- **Concepts, not tools:** no backup product is named on the page. "Rabin fingerprint" and "Gear hash" are named in
  the explanation as algorithms, not tools. restic and Borg are only in Sources.
- **`related`:** left empty. The natural link is `dedup-file-funnel` (file-level dedup, catalogue §5.3), which does
  not exist yet; `related` ids must exist (`npm run check`). Add it when that sim lands.

## Deviations from the task

- `small-chunks` takes **12** steps, not 11: 1 + 1 + ⌈17/4⌉ + ⌈16/4⌉ + 1 = 12 (the task's own formula).
- The task's hr caption „Fiksni odsječak 4 (*chunk*, odsječak) počinje na 24…" is used without the term in
  parentheses: the term rule's first mention (*chunks* (odsječke)) is in the step-0 caption and the explanation.
- `showHash` off also hides the hash chips of the store (its count stays), not only the table's hash row.

## Sources

- Task file `docs/tasks/w2/dedup-chunking.md` (rules, presets, terms; numbers re-computed by script, all match except
  the `small-chunks` step count above).
- NLA `meta/toc.md` T28 "Sigurnosne kopije u pogonu — deduplikacija, izmještanje, obavezna proba oporavka" (chapters
  not written yet: rule 1 *(check)* when they are).
- UL `book/chapters/23-odrzavanje-sustava.md`: „odsječci podataka", „spremište", „sažetak" (the Croatian terms).
- A. Muthitacharoen, B. Chen, D. Mazières, "A Low-bandwidth Network File System", SOSP 2001 (Rabin-fingerprint
  boundaries, min/max chunk sizes); W. Xia et al., "FastCDC", USENIX ATC 2016 (Gear hash); restic design document
  "Chunking"; BorgBackup docs "Internals: chunker" *(not re-read; as cited by the task)*. The toy sum hash is derived
  for the lecture *(check)*.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| chunk | odsječak (UL ch23 „odsječci podataka") |
| deduplication | deduplikacija (NLA T28) |
| hash / digest | sažetak (UL ch23) |
| rolling hash | klizni sažetak |
| fixed-size chunking | odsijecanje na stalnu duljinu |
| content-defined chunking (CDC) | odsijecanje po sadržaju |
| chunk store | spremište odsječaka |
| chunk boundary | granica odsječka |
| (rolling) window | (klizni) prozor *(check)* |

## Shared requests

None. `models/` unchanged.

## Checks

- `node --test sims/dedup-chunking/sim.test.js`: 25 tests pass. `npm test` (1633) and `npm run check` pass.
- `npm run gate -- dedup-chunking`: pass (61/61 browser checks). Screenshots looked at: 1920×1080 light, dark,
  grayscale, 375×812, both languages; extra states scripted: steps 1, 2, 6, 12, 13, 19 of `prepend` (19 also dark),
  `small-chunks` 8 and 12, `delete-middle` 2, `insert-middle` 14 (en), phone mid-run.

## Review

A fresh reviewer read the diff against `SPEC.md` and the task, recomputed every number in all 36 combinations of
size × window × edit with an independent script (all match), and ran 63 mutations of `sim.js`: 46 were killed.
Defects found and fixed:
- **The totals caption overclaimed resynchronisation.** "Came back as soon as the window had passed the edit" is
  false where a max cut carries the shift on: 16/3 insert and delete, and 16/4 and 16/5 insert, never resync; 8/3
  insert and delete, and 4/3 insert, resync late. The caption now follows the data (last CDC chunk `same` or not,
  new `capTotalsNoSync`). The explanation and SPEC rule 5 now say "usually" and explain the max cut.
- **The step-1 caption said "every chunk is new"** while also saying a duplicate is stored once (4/3). It now says
  the store is empty and each chunk not yet in it is stored.
- **A deleted byte's gap was mis-attributed.** At size 4 with the delete, the chunk starting exactly at the gap was
  captioned "holds the edit". `behindEdit` now treats a chunk starting at the gap as shifted.
- **"Boundary found again" could follow a max cut.** That caption now needs a hash cut.

New tests kill the 13 observable survivors: the stores grow, `cursor`, `origBytes` with a duplicate, an FNV-1a test
vector, ignored hits on the final chunk and below `min − 1`, `sum` and `win` on a max cut, `finalChunks`, the param
fallbacks, no grouping at size 16, the window reaching into the previous chunk, and no resync at 16/3. I re-ran those
13 mutants and all are now killed. Not changed: `capCdcIgnored` names only the first ignored hit.

## Time

Start 2026-10-03 21:02 CEST, done 21:21 CEST (about 20 minutes).
