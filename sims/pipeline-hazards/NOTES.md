<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# pipeline-hazards: notes

New stepper (task `docs/tasks/w3/pipeline-hazards.md`, catalogue `arh-pipeline-hazards`, §4.9). The page draws its own
stage (no kit view fits: five stage boxes with forwarding lanes, and a cycles × instructions diagram). Rules and
expected numbers: `SPEC.md`.

## Decisions

- **Diagram convention for a held instruction.** A held instruction shows its stage in the first cycle and a stall
  mark (hollow circle, "—") in each cycle it waits, as in Hennessy & Patterson's stall diagrams (`IF ID — EX`). Cells
  never change after they are drawn, so stepping back and forth is stable, and the new stall is always in the
  current column. The stage box above says what the stall cell means ("ID … waits for x1"), and the caption says it
  too. Without forwarding the consumer's real register read is its last ID cycle, which coincides with the
  producer's WB: the page draws that as a dashed WB → ID lane above the boxes ("register file: write in the 1st
  half, read in the 2nd · x1"), so rule 2 is visible in the cycle it happens.
- **Flush:** the two wrong-path instructions get a crossed "×" cell in the branch's EX cycle; in that cycle their
  stage boxes show the instruction struck through ("being flushed"), and from the next cycle their slots travel on
  as "flushed" bubbles (P&H turns them into nops). Their rows get a "wrong path" tag once flushed, not before (the
  prediction is "not taken", so nothing is known before EX).
- **Forwarding lanes** are always drawn while forwarding is on: dotted and grey with "unused", dashed ink with the
  register on a highlighter label when used in this cycle. With forwarding off the lanes are replaced by "forwarding
  off", because the paths do not exist. EX/MEM → EX enters EX right of its centre and MEM/WB → EX left of it, so the
  two never overlap.
- **Params:** `program` (choice of 4, resets) and `forwarding` (toggle, recomputes the same cycle; the step count
  changes with it, the kit clamps). Presets: the task's five, ids `independent`, `raw-no-fwd`, `raw-fwd`,
  `load-use`, `mixed`; `raw-no-fwd` and `raw-fwd` share the program `raw`. Default: `independent`, on (8 steps,
  `sim.json` `steps`).
- **Wrong-path instructions** in `mixed` are `addi x7,x0,1` and `addi x8,x0,2` (the task leaves them open): they
  read only x0, so they cause no hazards of their own and nothing on the stage depends on them but the flush.
- **Branch direction is data**, not computed: the model has no register values (`taken: true` on the `beq` of
  `mixed`). SPEC "Out of scope".
- **Counts:** cycle k / N, completed k / n, stalls, flushed, and at the last step cycles per instruction (CPI, with a
  decimal comma in Croatian). The end caption gives the formula with this run's numbers and the throughput point
  (misconception 2): every instruction still passes all 5 stages; the pipeline does not shorten one.
- **Captions** narrate the cycle's events in order: stall (load-use or no forwarding, with the producer's WB cycle),
  flush or branch not taken, each forward (path, register, producer, consumer), each register-file pass; on a quiet
  cycle the fetch and the completion; "WB holds a bubble: no instruction completes" when that is true.
- **`related`:** `hw-side-effects` (the simdeck import of single-page-labs' Spectre & Meltdown page, catalogue
  `spl-spectre-meltdown` "live as `hw-side-effects`") and `cache-mapping`. The explanation links `hw-side-effects` for
  dynamic branch prediction, as the task asks ("link it for what comes after predict not taken").
- **Phone:** the boxes lose their sub-labels and notes, the counts go in one row, and the diagram's cycle cells scroll
  sideways inside their own box beside a fixed instruction column (the page does not scroll), kept on the current
  cycle. The diagram is two grids with the same row heights for that: a sticky label cell cannot leave its grid area.

## Deviations from the task

- **Caption wording.** The task's caption says "Cycle 4: `add` is in EX and needs x1". In the model (and in P&H's
  hazard detection unit) `add` is held in ID in cycle 4 and a bubble is in EX; it reaches EX in cycle 5 with
  MEM/WB → EX. The page says "`add` should enter EX and needs x1 … One bubble: `add` waits in ID; forwarding cannot
  avoid it." (hr: „`add` treba ući u EX …“). Same meaning, accurate to the cycle.
- **Rule 3's wording** ("a consumer may not be in ID before its producer's WB cycle") is implemented as "may not
  leave ID before", with the stalls drawn after the first ID (see Decisions). Stall counts are the task's.
- **State shape:** as the task's, plus `label`, `op`, `target`, `fetched`, `held` (stall cycles), `flushedIn`,
  `wrongPath` per instruction, `pc`, `completed`, `regPasses`, `finished` and `last` (this cycle's events).
  `inStage` uses `'bubble'` for a stall and `'flushed'` for a squashed slot, `null` for an empty stage.
- **Branch resolution in EX** (task rule 5) is not P&H's basic pipeline (MEM, 3 flushed) nor its optimised one (ID,
  1 flushed); the task cites P&H for it. Kept as the task says (2 flushed); SPEC, this file and the explanation now
  say where P&H differ. Owner decision whether the course wants P&H's MEM variant instead (see report).
- **Taken-branch targets** must be at least 3 lines ahead: the model refuses nearer and backward targets (found by
  the review; no preset uses one).
- **Rule 8** (SPEC) is added: what happens when a flushed instruction is in ID (not checked for hazards). The task
  does not say; P&H zeroes the IF/ID register.
- **Explanation, out of scope:** caches are named as out of scope; "superscalar issue" is written as "issuing several
  instructions per cycle".

## Sources

- D. A. Patterson, J. L. Hennessy, *Computer Organization and Design, RISC-V Edition*: §4.6 (five stages, pipeline
  diagrams, throughput vs latency), §4.7 (data hazards, forwarding unit conditions EX/MEM and MEM/WB with the "most
  recent result" priority, hazard detection unit for load-use, register file written in the first half and read in
  the second), §4.8 (branch predicted not taken; the basic pipeline decides the branch in MEM and discards IF, ID and EX, 3
  instructions; the optimised branch decides in ID with one flush) *(check: section numbers and titles in the
  edition at hand)*. The task's resolution in EX with 2 flushed is a common teaching simplification between the two
  (see Deviations).
- J. L. Hennessy, D. A. Patterson, *Computer Architecture: A Quantitative Approach*, Appendix C (stall diagrams with
  "stall" in the held cycles) *(check: appendix and figure)*.
- No local course material (task).

## Unchecked *(check)*

- The book section numbers and titles above.
- P&H's MEM → MEM forward for load → store (an exercise/elaboration in the book, as far as I recall): not modelled;
  here `lw x3` / `sw x3` at distance 1 stalls once, like any load-use *(check)*.
- Croatian terms marked *(check)* below.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| pipeline (CPU) | protočna struktura *(check)*; the glossary's `pipeline` = *cjevovod* is the shell pipeline (src uvod-u-linux), so `[[pipeline]]` is not used. *cjevovod* is in the aliases for search |
| data hazard | podatkovni hazard |
| stall | zastoj |
| bubble | mjehurić |
| flush | poništavanje *(check)* |
| clock cycle | takt |
| stage | faza |
| wrong path | krivi put *(check)* |

Glossary terms used: `forwarding` (prosljeđivanje, src simdeck), `throughput` (propusnost), `latency` (latencija).
`branching` (grananje) exists but is not used as a term: the text says "branch" (instruction), written out as
*grananje*.

## Shared requests

None.

## Checks

- Numbers: an independent Python script (EX-cycle recurrence: `E_i = max(E_{i−1} + 1, producer constraints)`, branch
  target at `E_b + 3`; no cycle simulation) gave every preset's cycles, stalls and flushed, with and without
  forwarding: independent 8/8, raw 6/8, load-use 7/8, mixed 12/17; the model agrees, and so does the hand derivation
  in SPEC.
- Tests: 32, every rule and tie-break has one. Mutation run on a scratch copy, 23 mutants (x0 as a hazard, flushed
  producer counted, oldest producer wins, flushed ID checked, load-use ignored, load-use also in MEM, no half-cycle
  rule, no-forwarding stall only on EX, IF not held, stall not counted, flush only one, not-taken flushes, taken
  branch not redirected, flushed slot keeps the instruction, older forward wins, store data not a source, no
  register-file pass, completion counted in MEM, finished one cycle early, stall cell not drawn, `wrongPath` never set,
  no fetch event, register-file pass recorded for a flushed instruction): all killed. The
  redirect mutant survived at first (every preset's target follows the two wrong-path lines); a test with three
  lines between the branch and its label now kills it.
- `npm run gate -- pipeline-hazards`: pass (66/66 browser checks, 0 exceptions). Screenshots reviewed: 1920×1080
  light, dark, grayscale in hr and en, 375×812, plus `load-use` cycles 4–5, `raw-no-fwd` cycle 5, `mixed` cycles 5,
  7 and 12 and `mixed` without forwarding at cycle 17, in both themes.

## Review

A fresh reviewer (subagent, no shared context) recomputed every preset and a dozen extra programs with its own
formula-based script (cycles, stalls, flushes, every forward and register-file pass, every diagram cell: all match),
ran 46 mutants and read every caption. Findings and what was done:
- **Branch source** (must fix): P&H's basic pipeline decides branches in MEM (3 flushed), not EX; the task's EX/2 is
  a simplification. SPEC, NOTES and the explanation corrected (Deviations, Sources).
- **Empty caption in cycle 3** (must fix) of the two-instruction programs: quiet cycles now say what the hazard unit
  sees in ID ("next cycle add stays in ID") or what enters EX.
- Surviving non-equivalent mutants (`wrongPath`, the fetch event, a register-file pass for a flushed instruction):
  tests added; the unused `bubbles` event list removed.
- A taken branch with a label 1–2 lines ahead, or backward, misbehaved (no preset has one): now refused, with a test.
- Rule 3 wording, the x0 note on P&H's load-use condition, "in this in-order pipeline" for the compiler remark,
  forward listed before the flush, "IF is held too" also for the load-use stall, "in this cycle" for a WB now,
  Croatian word order in three captions, the legend's stall entry ("stall: waits, a bubble goes to EX") and the
  flushed slots marked as changed: all done.
- Found while checking the captions afterwards: a placeholder used twice in one caption (`{c}`) got the same DOM
  node, so its first occurrence was empty (the task's load-use caption too). Second placeholder `{c2}` now.
- Equivalent survivors (no change): `fetched` check in `producerOf`, EX/MEM vs MEM/WB order in the forward lookup
  (the newest producer decides), forwards recorded with forwarding off (never reached), the after-flush check in
  `cell`.

## Time

Start 15:01, done 15:26 (2026-11-08): about 25 minutes, of which the fresh review took 6.
