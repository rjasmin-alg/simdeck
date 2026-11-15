<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# mesi-coherence: notes

New stepper (task `docs/tasks/w3/mesi-coherence.md`, catalogue `arh-mesi`, §4.9): the MESI states of one cache line X
in 2–4 cores on a snooping bus, one read or write per step. Split from `multicore-mesi` (whose MESI view stays as it
is). Rules and numbers: `SPEC.md`.

## Decisions

- **The model is copied, not shared.** `models/` has no MESI model, so the transition table of
  `sims/multicore-mesi/sim.js` `access()` @ 7f16d4a was copied and extended (N cores, bus transactions, value
  tracking, downgrades apart from invalidations), as COMMON.md §6 says. `access()` here is pure, string-free and takes
  plain JSON, so it can be promoted unchanged (Shared requests).
- **The sequence lives in the params** as hidden slots `o1` … `o20` (values `0R` … `3W`), like `multicore-mesi`'s
  `o1` … `o16`. So a link, a reload and the language switch keep the student's own operations, and step back is the
  kit's replay. `steps` is a function of the params (the sequence's length): 4, 4, 6, 6 for the presets, at most 20.
  `sim.json` `steps` is 4, the default (preset 1).
- **No separate `sequence` select.** The task names a `sequence` param "select of the presets"; the four presets
  (keys 1–4) already are that choice, and a second control that does the same would only drift from them. Deviation,
  reported.
- **Read / write buttons sit under each core on the stage**, not in the panel: with 4 cores that is 8 buttons, which
  the panel cannot hold beside the presets, and on the stage each button is next to the cache it acts on. They are
  kit buttons (`.sd-btn`), take no focus on click (so → still steps), and are `aria-disabled` at the cap with the
  reason in the caption. Keys: C0 `Q`/`W`, C1 `U`/`I`, C2 `A`/`S`, C3 `J`/`K` (read/write; not
  `multicore-mesi`'s `O`/`P` for C1, because the key cap "O" under "C1" reads as a zero); a key for a core that does not exist does nothing. They are in the `?` overlay.
- **Appending = branching.** A button at step n keeps operations 1 … n, adds the new one and shows it (step n + 1);
  the rest of the old sequence is dropped. "Append after the current step" read this way answers "what if C1 writes
  now?"; inserting and keeping the tail would change the outcome of every later step without the lecturer seeing it.
  At step 0 it starts a new sequence. Reset (`R`) or a preset brings the preset back.
- **Changing the number of cores keeps the step** and leaves out operations on cores that no longer exist (the hint
  says so); the sequence is not edited, so switching back restores them.
- **Write-back on a read is to RAM, then RAM to the requester** (as the original page and `multicore-mesi`), not a
  cache-to-cache transfer; both end in S S. Out of scope per the task; *(check)* against what the course (ARH) teaches.
- **Write in E counts as a hit**, as in `multicore-mesi` (no bus traffic). Task rule 3 calls it a silent upgrade without
  saying whether it is a hit; the silent-upgrade preset then has 2 hits (steps 2 and 3).
- **`busTx` does not count the Flush** that answers a request; write-backs have their own counter. This gives the
  task's numbers (classic: bus 4 with 1 write-back).
- **State diagram:** the four states at the corners, ten directed edges (two per pair, bent apart; S → E does not
  exist). This step's edges are thick, the requester's solid and the snoopers' dashed (the same marks as in the "In this
  step" list), and a hit with no change rings the state. Which cores are in each state is written next to it. Drawn as
  SVG lines only; every letter is HTML, so no text shrinks with the `viewBox`.
- **Patterns:** M solid, E dotted, S striped, I hollow dashed, each with its letter on a disk, so the states read in
  grayscale; colours (`--c2`, `--c3`, `--c1`) are a second carrier. The legend swatches use the same classes.
- **Stale RAM:** the RAM value is struck through and labelled stale (red) while some core is M, "current" otherwise.
  RAM gets the changed mark when a write-back reaches it; the write-back is a dashed orange arrow from the core to the
  bus and from the bus to RAM, with the value on it.
- **Glossary terms from the kit win over the task's suggestions:** *write-back* is "pisanje natrag" and *cache*
  "predmemorija" in `kit/glossary.js`, so the page uses those, not "povratno upisivanje" or "priručna memorija".
- **Croatian state names** in the legend (izmijenjena, isključiva, dijeljena, nevaljana, as in `multicore-mesi`); the
  task says to keep the English names, which the explanation gives in italics beside the letters.

## Deviations from the task

- No `sequence` param (above); the presets are the selection.
- Buttons on the stage instead of in the panel (above).
- Title "Koherencija predmemorija: MESI" / "Cache coherence: MESI" (≤ 60), concept from the task's goal.

## Sources

- J. L. Hennessy, D. A. Patterson, *Computer Architecture: A Quantitative Approach*, §5.2 (snooping, write-invalidate,
  MSI + E). *(check)* section number and the bus-transaction names against the edition the course uses.
- D. E. Culler, J. P. Singh, *Parallel Computer Architecture*, §5.3 (MESI, Illinois). *(check)* section number.
- M. S. Papamarcos, J. H. Patel (1984), "A low-overhead coherence solution for multiprocessors with private cache
  memories" (the Illinois protocol).
- `sims/multicore-mesi/` (transition table, its corrections of the original: RAM changes only on a write-back, M → S is
  not an invalidation) and its seed `single-page-labs/homogeni-multicore-simulator.html` (`mr`, `mw`).
- *(check)* The Croatian terms marked below.

## Checks

- **Numbers:** an independent Python script (written before the model, not part of the repo) replayed the four presets
  by the rules and gave the SPEC.md table: classic bus 4 / inval 1 / down 2 / wb 1 / RAM 1; silent-upgrade bus 2 /
  inval 1 / wb 1 / hits 2; ping-pong bus 6 / inval 5 / wb 5 / hits 0; readers-writer bus 6 / inval 2 / down 2 / wb 1.
  The model's tests assert the same numbers.
- **Tests:** 26, rule by rule, tie-breaks (snoop order, sequence order, symmetry) first; the invariant over 300 random
  sequences of 20 operations on 2–4 cores.
- **Gate:** `npm run gate -- mesi-coherence` passes (manifest, tests, build, 61 browser checks, tokens, scope).
- **Screenshots reviewed:** the gate's set (1920×1080 light, dark, grayscale; 375×812; hr and en) plus my own of
  readers-writer steps 4 (BusUpgr, two invalidations) and 5 (write-back), ping-pong in dark, 4 cores at step 7, the
  20-operation cap, and the phone at step 5.

- **Fresh review** (a separate agent, diff against SPEC.md): 35 mutations of `sim.js`, one per rule or tie-break
  and several more; 34 caught. The survivor, "a write in M is not counted as a hit", led to a new assertion in the rule 3
  test, which now catches it. "BusUpgr refetches from RAM" is equivalent (the value is overwritten at once), so SPEC
  rule 4 now says that "no data is fetched" explains the name and is not a tested rule. Also from the review: the C1 key is
  `U`/`I` instead of `O`/`P`, and SPEC says "first empty or invalid slot". Captions were checked at every step of every
  preset in hr and en.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| cache coherence | koherencija predmemorije *(check)* |
| snooping | njuškanje sabirnice *(check)* |
| invalidation | poništavanje (invalidacija) |
| downgrade (M/E → S) | snižavanje *(check)* |
| Modified / Exclusive / Shared / Invalid | izmijenjena / isključiva / dijeljena / nevaljana (as in `multicore-mesi`) |

`cache`, `bus`, `hit` and `write-back` come from the glossary (`[[…]]`).

## Shared requests

- **models/: MESI.** Promote `access()`, `emptyMachine()`, `invariantHolds()` and `isStale()` from this `sim.js` as
  `models/mesi.js`; `multicore-mesi` could then use it for its MESI and false-sharing views (its `access` works on
  several lines and two cores; the promoted one would need a `line` index or an array of machines).
- **Glossary:** add the term pairs above with `"src": "simdeck"`.
- **kit.css: `.sd-ctl[hidden]` is still shown** (filed by `amdahl` and `multicore-mesi`); worked around in this page.
- **kit: a hidden state param** (`{ type: 'state' }`, no control, kept in the URL) would replace the 20 hidden
  `select` slots (filed by `multicore-mesi` too).
- **kit: legend items with a page-drawn swatch.** The four state swatches are patched after `mount` (class and letter);
  a legend item field such as `swatch: Node` or `class` would remove that.

## Not checked here

- Real projector and clicker.
- The explanation, opened, at 1920×1080 (the gate checks the panel closed).

## Time

Start 2026-11-15 10:39, done 10:56 (about 17 minutes of wall clock, one session).
