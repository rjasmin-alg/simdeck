# os-context-switch-cost: What a context switch costs

| | |
|---|---|
| Task | `os-context-switch-cost` (wave 3, Computer architecture, OS gaps and automata) |
| Catalogue entry | `os-context-switch-cost` in `docs/catalogue.md` §4.9 |
| Kind | build a new simulator |
| Folder | `sims/os-context-switch-cost/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | OS |
| Topic / tags / level | `os` / `processes`, `operating-systems` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **saved state, TLB and cache warmup**.

The student: switch at different rates.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.9.

## Sources

- `/home/rjasmin/projects/ossimulator/src/modules/processes/` (`meta.ts` terms; `NOTES.md` "Mode switch": process switch vs mode switch), `/home/rjasmin/projects/ossimulator/src/modules/threads/NOTES.md` (`costProcessSwitch`, `costKernelSameProc`, `costUlt`; "Troškovi u simulaciji su ilustrativni"), `/home/rjasmin/projects/ossimulator/src/modules/scheduling/NOTES.md` ("Promjene konteksta" statistic) and `/home/rjasmin/projects/ossimulator/src/modules/address-translation/` (TLB model).
- W. Stallings, *Operating Systems: Internals and Design Principles*, ch. 3 §3.5 "Process switching" (when to switch, mode switch vs process switch) and ch. 8 (TLB); *Intel 64 and IA-32 Architectures Software Developer's Manual*, Vol. 3A, §4.10.1 "Process-Context Identifiers (PCIDs)". Timings are illustrative: mark them *(check)* in `NOTES.md`.
- Catalogue seed: ossim covers mode vs process switch.

## Model and presets

- **Scene:** a CPU timeline for two processes A and B alternating with time quantum Q, drawn over a window
  that scales with Q (≈ 6 quanta); each quantum split into three bars: direct switch cost (save/restore,
  scheduler: solid dark), warm-up (striped: the process runs but stalls on cold cache and TLB misses) and
  useful work (solid). Next to it a gauge "useful CPU %" and "switches per second", and a small chart of
  useful % against Q (log axis) with the current Q marked. A side card lists what is saved on a switch
  (registers, PC, SP, flags, FPU/SIMD state, the page-table base register) and what is lost (TLB entries,
  cache contents).
- **State (explorer, derived from params):** `{ Q, kind, direct, warm: {cache, tlb}, rate, perQuantum: {direct,
  warm, useful}, usefulPct, switchesPerSec, curve: [{Q, usefulPct}] }`.
- **Params drive live:** every slider recomputes the bars, the gauge and the curve.
- **Rules** (model is illustrative, like ossimulator's `threads` costs: `ossimulator/src/modules/threads/NOTES.md`
  "Troškovi u simulaciji su ilustrativni"):
  1. Each switch costs a fixed direct cost `direct` (default 2 µs) during which no process runs
     (Stallings, *Operating Systems*, §3.5 "process switching"; mode switch without a process switch costs
     only the mode change, which ossimulator's `processes`/`syscalls` pages show).
  2. After a switch the incoming process needs warm-up W = W_cache + W_tlb µs during which it progresses at
     `rate` (default 0.3) of full speed (defaults W_cache 40 µs, W_tlb 10 µs: illustrative *(check)*).
  3. Kind: `process` pays W_cache + W_tlb (the address space changes, the TLB is flushed); `thread` (same
     process) pays only W_cache (no TLB flush); `process + tagged TLB` (address-space identifiers) also pays only W_cache.
  4. Useful work per quantum: Q − W·(1 − rate) if Q ≥ W, else Q·rate. Useful % = useful / (Q + direct).
  5. Switches per second = 10⁶ / (Q + direct) (Q in µs).
- **Params:** `Q` range 10 µs … 10 ms, log steps (default 1 ms); `kind` choice process / thread / process +
  tagged TLB (default process); `direct` range 0.5–10 µs (default 2); `wCache` range 0–200 µs (default 40); `wTlb`
  range 0–50 µs (default 10); `rate` range 0.1–0.9 (default 0.3).
- **Presets** (derived from rules 1–5 with the defaults, unchecked against measurements):
  1. `desktop`: Q = 10 ms, process → useful 99.6 %, 100 switches/s.
  2. `server`: Q = 1 ms, process → 96.3 %, ≈ 998 switches/s.
  3. `too-often`: Q = 100 µs, process → 63.7 %, ≈ 9 800 switches/s; the warm-up, not the 2 µs direct cost,
     eats the time.
  4. `threads`: Q = 100 µs, thread → 70.6 % (no TLB flush).
  5. `thrash`: Q = 20 µs (< W) → 27.3 %: the process never gets warm.
- **Steps:** explorer, none.
- **Legend:** direct cost (solid dark, label "D"), warm-up (striped, "W"), useful (solid, "U"), process A / B
  (letters on the bars). "Changed" marks the gauge when it crosses 90 % or 50 %.
- **Captions:**
  - hr: „Kvant 100 µs: sama promjena konteksta traje 2 µs, ali proces zatim 50 µs radi sporo dok puni priručnu
    memoriju i TLB. Korisno je samo 63.7 % vremena procesora.“
  - en: "Quantum 100 µs: the switch itself takes 2 µs, but the process then runs slowly for 50 µs while it
    refills the cache and the TLB. Only 63.7 % of CPU time is useful."
- **Terms** (ossimulator `processes` and `scheduling` meta): process switch — promjena konteksta; mode switch —
  promjena načina rada; time quantum — kvant; TLB — TLB; cache — priručna memorija; process control block —
  upravljački blok procesa; dispatcher — dispečer.
- **Misconceptions:** the switch cost is the register save (the indirect cost dominates); threads switch for
  free (they still lose cache warmth); a shorter quantum is always more responsive at no cost.
- **Out of scope:** measuring real costs on a machine, scheduler
  policy (ossimulator `scheduling`), NUMA and migration, hyper-threading.
- **Note for the coordinator:** all timings are illustrative; the page must say so on screen, as ossimulator's
  `threads` page does.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `os-context-switch-cost` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh os-context-switch-cost sims/os-context-switch-cost` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/os-context-switch-cost/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
