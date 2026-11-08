<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# pipeline-hazards: specification

One concept: **data hazards, stalls, forwarding, branch flush** (task `docs/tasks/w3/pipeline-hazards.md`, catalogue
`arh-pipeline-hazards`, §4.9). The student steps a short RISC-V-like program through a five-stage pipeline, one clock
cycle per step, with forwarding on or off.

Source: D. A. Patterson, J. L. Hennessy, *Computer Organization and Design, RISC-V Edition* (P&H COD), §4.6 "An
overview of pipelining", §4.7 "Pipelined datapath and control" / "Data hazards: forwarding versus stalling", §4.8
"Control hazards" *(check: section titles and numbers in the edition at hand)*. Branch resolution in EX is the task's
simplification, not P&H's basic pipeline (rule 5). Every number below was derived by hand,
by an independent script (EX-cycle recurrence, NOTES.md "Checks") and by the model; all three agree.

## Model

- **Pipeline:** five stages `IF ID EX MEM WB`, in order, one instruction per stage. A stage may also hold a
  **bubble** (a stall's empty slot, `'bubble'`) or a **flushed** slot (a squashed instruction turned into a nop,
  `'flushed'`), which move down the pipeline like instructions and do nothing.
- **Program:** a list of assembly lines (`lw rd,imm(rs1)`, `sw rs2,imm(rs1)`, `beq rs1,rs2,L`, `add/sub/and/or rd,rs1,rs2`,
  `addi rd,rs1,imm`), an optional label `L:` before a line. `kind` is `load | store | branch | alu`. Sources in
  reading order: a store's are `[base, data]`. A branch carries `taken` (fixed per program: the model does not compute
  values).
- **State:** `{ cycle, instrs: [{ id, text, label, op, kind, dst, src, target, taken, fetched, stages: {IF, ID, EX, MEM,
  WB} (the first cycle in each stage, or null), held: [cycles], flushed (cycle or null), flushedIn ('IF' | 'ID'),
  wrongPath }], inStage: {IF, ID, EX, MEM, WB} (instruction index, 'bubble', 'flushed' or null), pc, stalls, flushes,
  completed, forwards: [{from, to, reg, cycle, producer, consumer}], regPasses: [{reg, cycle, producer, consumer}],
  finished, last }`. `last` is this cycle's events, for the caption: `stall {consumer, producer, reg, cause}`, `flush
  {branch, ids, target}`, `notTaken`, `forwards`, `regPasses`, `fetched`, `completed`, `bubbles`.
- **Diagram cell** of instruction q in cycle c: `flush` if q was flushed in c; empty after that; `stall` if c is in
  `held`; else the stage q entered in c. A held instruction shows its stage in the first cycle and a stall mark in the
  cycles it waits (the H&P convention: `IF ID — EX`), so a cell never changes once drawn.
- **Steps:** one per clock cycle, until the last instruction is in WB. Step 0 is "before cycle 1".

## One step (one cycle n), phases in order

1. WB this cycle holds what was in MEM last cycle; it writes the register file in the first half of the cycle.
2. The hazard unit looks at the instruction in ID (last cycle's occupancy) against those in EX and MEM (rules 3, 4).
3. Either everything advances one stage and IF fetches the next instruction, or IF and ID are held (each holder gets
   `n` in `held`), a bubble enters EX, and `stalls` + 1. MEM and WB always advance.
4. A branch that entered EX this cycle is resolved (rule 5). Taken: the instructions in ID and IF are flushed (`flushed
   = n`) and the next fetch is the branch's label. Not taken: nothing changes.
5. Counts: `completed` + 1 if an instruction is in WB; the forwards the instruction in EX uses this cycle, and the
   register-file passes (the instruction in ID reads a register the instruction in WB writes this cycle).

## Rules (P&H COD §4.6–4.8)

1. **Five stages, one fetch per cycle** unless IF is held (§4.6). After the fill, one instruction completes per cycle
   (throughput); each instruction still takes 5 cycles from IF to WB (latency).
2. **Register file half-cycle rule** (§4.7): written in the first half, read in the second half of a cycle, so an
   instruction whose ID is in its producer's WB cycle reads the new value. Recorded as a `regPass`.
3. **Without forwarding**, a consumer's last ID cycle (the one in which it reads its registers) is no earlier than its
   producer's WB cycle: it stays in ID while its producer is in EX or MEM, and enters EX the cycle after the WB. Stalls by distance d (consumer index − producer index, no other stalls): d = 1 → 2,
   d = 2 → 1, d ≥ 3 → 0.
4. **With forwarding** (§4.7), an ALU result goes EX/MEM → EX (producer in MEM) and MEM/WB → EX (producer in WB), so
   ALU → ALU needs 0 stalls at any distance. A load's value exists only after MEM: the consumer stays in ID while the
   load is in EX (the load-use hazard; P&H's hazard detection unit, `ID/EX.MemRead`), so load → use at d = 1 costs
   exactly 1 stall and at d ≥ 2 none (then MEM/WB → EX).
5. **Branches** are predicted not taken and resolved in EX (task). Taken: the 2 instructions fetched after the branch
   are flushed (2 lost cycles) and IF fetches the target in the next cycle. Not taken: nothing lost. This is the
   common teaching simplification: P&H's basic pipeline (§4.8) decides the branch in MEM and discards 3 instructions
   (IF, ID, EX), and its optimised variant decides in ID and discards 1 *(check)*. Both are out of scope; the
   explanation names them. A taken branch's label must be at least 3 lines ahead (the model refuses a nearer or a
   backward target: it would be fetched as a wrong-path instruction, or loop).
6. **Tie-break, forwarding:** a source register comes from the newest older instruction that writes it and was not
   flushed. When both forwarding paths hold a value for it, the newer one (EX/MEM) wins (§4.7, the forwarding unit's
   "most recent result" condition). The same "newest producer" decides stalls: an older producer of the same register
   still in EX or MEM does not stall the consumer.
7. **Stores and x0:** a store's data register is a source like any other (forwarded and stalled the same way; P&H's
   MEM → MEM forward for load → store is not modelled *(check)*: here lw → sw at d = 1 stalls once). `x0` is never a
   hazard, even after an instruction that names `x0` as its destination (P&H's forwarding unit tests `rd ≠ 0`; its
   load-use condition as printed does not, a detail no preset reaches).
8. **Tie-break, hold and flush:** a stall and a flush never fall in the same cycle (a flush needs a branch to enter EX,
   a stall puts a bubble there). A flushed instruction in ID is not checked for hazards; a flushed slot moves on as a
   bubble.

Cycle count: cycles = 5 + (n − 1) + stalls + flushed, n = instructions that complete.

## Params

- `forwarding`: toggle, default on. Changing it keeps the step and recomputes (the cycle count may change).
- `program`: choice of `independent | raw | load-use | mixed`, default `independent`; resets to step 0.

## Presets (numbers checked by hand, script and tests)

| # | id | program | forwarding | cycles | stalls | flushed | notes |
|---|---|---|---|---|---|---|---|
| 1 | `independent` | `add x1,x2,x3` / `sub x4,x5,x6` / `and x7,x8,x9` / `or x10,x11,x12` | on | 8 | 0 | 0 | the ideal; same off |
| 2 | `raw-no-fwd` | `add x1,x2,x3` / `sub x4,x1,x5` | off | 8 | 2 | 0 | regPass x1 in cycle 5 |
| 3 | `raw-fwd` | same | on | 6 | 0 | 0 | one EX/MEM → EX forward of x1 in cycle 4 |
| 4 | `load-use` | `lw x1,0(x2)` / `add x3,x1,x4` | on | 7 | 1 | 0 | stall in cycle 4, MEM/WB → EX in cycle 5; off: 8, 2 |
| 5 | `mixed` | `lw x1,0(x2)`, `add x3,x1,x4`, `sub x5,x3,x6`, `beq x5,x0,L` (taken), `addi x7,x0,1`, `addi x8,x0,2`, `L: sw x3,8(x2)` | on | 12 | 1 | 2 | forwards: MEM/WB x1 (5), EX/MEM x3 (6), EX/MEM x5 (7); flush in 7; off: 17, 6, 2 |

Diagrams (— stall, × flushed):

```
load-use, forwarding on (7)           mixed, forwarding on (12)
lw  x1,0(x2)   IF ID EX MEM WB        lw   IF ID EX MEM WB
add x3,x1,x4      IF ID —  EX MEM WB  add     IF ID —  EX MEM WB
                                      sub        IF —  ID EX MEM WB
                                      beq              IF ID EX MEM WB
                                      addi x7             IF ×
                                      addi x8                ×
                                      L: sw                     IF ID EX MEM WB
```

Steps: 8, 8, 6, 7 (8), 12 (17). `sim.json` `steps` is the default (`independent`, on): 8.

## Caption, legend, changed

- Legend: stage cells (letter on the stage's series colour), bubble (hollow circle, "—"), flushed (crossed, "×"),
  forwarding arrow (dashed), changed.
- Changed: the current cycle's column header and every cell in it that is a stall or a flush; the EX box when a
  stall puts a bubble into it, and the boxes holding flushed slots in the cycle after a flush.
- Captions name this cycle's events: stall (and IF held), forwards, flush or branch not taken, register-file
  passes; on a quiet cycle what the hazard unit sees in ID (it acts next cycle), what enters EX, the fetch, the
  completion, or a bubble in WB.
- Caption of `load-use` step 4 (task, reworded because `add` is held in ID, not in EX, in cycle 4): "Cycle 4: `add`
  should enter EX and needs x1, which `lw` only has after MEM. One bubble: `add` waits in ID; forwarding cannot
  avoid it."

## Out of scope

Dynamic branch prediction (see `hw-side-effects`), branch resolution in ID, superscalar issue, structural hazards,
exceptions, caches, MEM → MEM forwarding, values (registers hold no numbers; a branch's direction is given).
