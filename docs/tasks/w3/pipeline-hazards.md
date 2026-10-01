# pipeline-hazards: Pipeline hazards

| | |
|---|---|
| Task | `pipeline-hazards` (wave 3, Computer architecture, OS gaps and automata) |
| Catalogue entry | `arh-pipeline-hazards` in `docs/catalogue.md` §4.9 |
| Kind | build a new simulator |
| Folder | `sims/pipeline-hazards/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | ARH |
| Topic / tags / level | `architecture` / `cpu` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **data hazards, stalls, forwarding, branch flush**.

The student: step instructions through five stages.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.9.

## Sources

- No local course material. Use D. A. Patterson, J. L. Hennessy, *Computer Organization and Design, RISC-V Edition*, §4.6 "An overview of pipelining" … §4.8 "Control hazards" (five stages, register file half-cycle rule, forwarding unit, load-use stall, branch flush). Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: pairs with `spl-spectre-meltdown` (`/home/rjasmin/projects/single-page-labs/spectre-meltdown.html`, "CPU Pipeline — Speculative Execution" and the 2-bit branch predictor); link it for what comes after "predict not taken".

## Model and presets

- **Scene:** a pipeline diagram: rows = instructions (RISC-V-like assembly, e.g. `lw x1,0(x2)`), columns =
  clock cycles 1…N; each cell shows the stage IF / ID / EX / MEM / WB, a bubble (stall) or a crossed
  "flush". Above it, the five stage boxes with the instruction currently in each, and forwarding paths drawn
  as arrows (EX/MEM → EX, MEM/WB → EX) when used in this cycle.
- **State:** `{ cycle, instrs: [{id, text, dst, src: [], kind: 'alu'|'load'|'store'|'branch', taken,
  stages: {IF, ID, EX, MEM, WB} (cycle numbers), flushed}], inStage: {IF, ID, EX, MEM, WB} (instr id or
  'bubble'), stalls, flushes, forwards: [{from, to, reg, cycle}] }`.
- **One step:** one clock cycle, phases in order: (1) WB writes the register file (first half of the cycle),
  (2) the hazard unit checks the instruction in ID against those in EX/MEM, (3) either everything advances
  one stage or IF and ID are held and a bubble enters EX, (4) a branch in EX is resolved; if taken, the two
  younger instructions are flushed and IF fetches the target next cycle, (5) counts update.
- **Rules** (Patterson & Hennessy, *Computer Organization and Design*, RISC-V ed., §4.6–4.8):
  1. Five stages, one instruction fetched per cycle unless IF is held.
  2. Register file is written in the first half and read in the second half of a cycle, so an instruction
     whose ID is in the producer's WB cycle reads the new value.
  3. Without forwarding: a consumer may not be in ID before its producer's WB cycle; the gap is filled with
     stalls (distance 1 → 2 stalls, distance 2 → 1, distance ≥ 3 → 0).
  4. With forwarding: ALU results go EX/MEM → EX and MEM/WB → EX, so ALU → ALU needs 0 stalls; a load's
     value exists only after MEM, so load → use at distance 1 needs exactly 1 stall (load-use hazard).
  5. Branches are predicted not taken and resolved in EX: taken → the 2 instructions fetched after the
     branch are flushed (2 lost cycles); not taken → nothing lost. (P&H's optimised variant resolves in ID
     with 1 flush: out of scope, mention in the explanation.)
  6. Tie-break: if both forwarding paths could supply a register, the newer one (EX/MEM) wins (P&H §4.7).
  7. Stores read their data register like any source (forwarded the same way); x0 is never a hazard.
- **Params:** `forwarding` toggle (default on); `program` select of the presets' programs.
- **Presets** (cycle counts derived by hand and checked: cycles = 5 + (n − 1) + stalls + flushed):
  1. `independent`: four unrelated ALU instructions → 8 cycles, 0 stalls (the ideal: one instruction
     completes per cycle after the fill).
  2. `raw-no-fwd` (forwarding off): `add x1,x2,x3` / `sub x4,x1,x5` → 2 stalls, 8 cycles.
  3. `raw-fwd` (forwarding on): the same pair → 0 stalls, 6 cycles, one EX/MEM → EX arrow in cycle 4.
  4. `load-use`: `lw x1,0(x2)` / `add x3,x1,x4` → forwarding on: 1 stall, 7 cycles; off: 2 stalls, 8.
  5. `mixed`: `lw x1,0(x2)`, `add x3,x1,x4`, `sub x5,x3,x6`, `beq x5,x0,L` (taken), two wrong-path
     instructions, `L: sw x3,8(x2)` → forwarding on: 1 stall + 2 flushed, 12 cycles; off: 6 stalls + 2
     flushed, 17 cycles.
- **Steps:** one per cycle: 8, 8, 6, 7 (or 8), 12 (or 17).
- **Legend:** stage cells by letter and fill, bubble (hollow circle, "—"), flushed (crossed, "×"), forwarding
  arrow (dashed). "Changed" marks the column of the current cycle and any cell that turned into a stall or
  flush in this step.
- **Captions:**
  - hr: „Takt 4: `add` je u fazi EX i treba x1, koji `lw` ima tek nakon faze MEM. Jedan mjehurić: `add`
    čeka, prosljeđivanje ga ne može izbjeći.“
  - en: "Cycle 4: `add` is in EX and needs x1, which `lw` only has after MEM. One bubble: `add` waits;
    forwarding cannot avoid it."
- **Terms:** pipeline — protočna struktura / cjevovod (check); stage — faza (stupanj); data hazard —
  podatkovni hazard; stall / bubble — zastoj / mjehurić; forwarding (bypassing) — prosljeđivanje; branch —
  grananje; flush — poništavanje (check); clock cycle — takt.
- **Misconceptions:** forwarding removes every stall (load-use, preset 4); a pipeline makes one instruction
  faster (it raises throughput, latency stays 5 cycles); a branch costs nothing if it is right most of the time
  (the taken branch here costs 2 cycles every time, prediction is the remedy).
- **Out of scope:** dynamic branch prediction (see `spectre-meltdown`), superscalar issue, structural
  hazards, exceptions, caches.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `pipeline-hazards` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh pipeline-hazards sims/pipeline-hazards` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/pipeline-hazards/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
