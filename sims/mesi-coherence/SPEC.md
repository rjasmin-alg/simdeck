<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# mesi-coherence: specification

One concept: **the states of one cache line across cores** (task `docs/tasks/w3/mesi-coherence.md`, catalogue
`arh-mesi`, §4.9). The student issues reads and writes per core, one operation per step, and watches the MESI state
of line X in every core, the transaction on the snooping bus and the value in RAM.

Sources: J. L. Hennessy, D. A. Patterson, *Computer Architecture: A Quantitative Approach* (H&P CA), §5.2
"Centralized shared-memory architectures" (snooping, write-invalidate, MSI and its E extension); D. E. Culler,
J. P. Singh, *Parallel Computer Architecture* (C&S), §5.3 (MESI, the Illinois protocol); M. S. Papamarcos,
J. H. Patel (1984), "A low-overhead coherence solution for multiprocessors with private cache memories" (the Illinois
protocol). Section numbers and the bus-transaction names were not checked against a copy *(check)*. The transition
table is the one of `sims/multicore-mesi/sim.js` `access()` (from `single-page-labs/homogeni-multicore-simulator.html`
`mr`, `mw`), extended to N cores; every number below was computed by the model and by an independent script
(NOTES.md "Checks").

## Model

- **Scene:** one memory line X with its value in RAM, `cores` ∈ {2, 3, 4} private caches (C0 … C3), each holding X's
  state (M, E, S or I) and its copy of the value (or none when I), one snooping bus between them.
- **State:** `{ cores: [{ state, value }], mem, version, last, counts }`
  - `cores[k].state` ∈ `M | E | S | I`; `cores[k].value` is a number, or `null` when the state is I.
  - `mem`: the value of X in RAM. `version`: the number of writes so far (the newest value of X).
  - `last`: what the step did, `null` at step 0, else `{ core, op, hit, bus, flush, transitions, value }`:
    `op` ∈ `R | W`; `hit` true when the own cache served it with no bus traffic; `bus` ∈ `BusRd | BusRdX | BusUpgr`
    or `null`; `flush` the core that wrote its M copy back to RAM in this step, or `null`; `transitions` every state
    change `{ core, from, to }`, the snooping cores first in core order, then the requester; `value` the value the
    core read or wrote.
  - `counts`: `{ hits, busTx, invalidations, downgrades, writebacks }`, cumulative.
- **Initial state:** every core I with no value, `mem = 0`, `version = 0`, `last = null`, every count 0.
- **Operations:** the params hold the sequence as slots `o1` … `o20`, each `''` or `<core><op>` (`0R`, `3W`, …).
  The sequence is the slots in order up to the first empty or invalid one; an operation on a core that does not exist with the
  chosen `cores` is left out. **Steps = the length of that sequence** (cap 20).
- **One step** applies operation n in the phases of the task: (1) local lookup, (2) the bus transaction if needed,
  (3) every other core snoops and changes state (a holder in M writes back first), (4) the requester's new state,
  (5) the counts.

## Rules

1. **Read hit** (own state M, E or S): no bus traffic, no state changes; `hits + 1`. The value read is the own copy.
2. **Read miss** (own state I): `BusRd`, `busTx + 1`.
   - If another core holds M, it writes back first (`mem` ← its value, `writebacks + 1`, `flush` = that core) and goes
     M → S (`downgrades + 1`).
   - A core in E goes E → S (`downgrades + 1`). Cores in S stay S.
   - The requester gets the value from RAM (after the write-back) and becomes **S** if any other core held a copy
     (M, E or S), else **E**.
3. **Write in M:** hit, no bus traffic, `hits + 1`. **Write in E:** silent upgrade E → M, no bus traffic, `hits + 1`.
4. **Write in S:** `BusUpgr`, `busTx + 1`; every other copy (S) → I, `invalidations + 1` each; requester S → M. No
   data is fetched (the requester's S copy is current); the model has no fetch to observe, so this is the reason
   for the name, not a tested rule.
5. **Write miss** (own state I): `BusRdX`, `busTx + 1`; a holder in M writes back first (`writebacks + 1`); every other
   copy → I (`invalidations + 1` each, the M holder included); requester I → M.
6. **Values:** each write sets `version + 1` and the writer's copy to it; RAM changes only by a write-back. RAM is
   **stale** (`mem ≠ version`) exactly while some core is in M. An I copy has no value.
7. **Invariant:** at most one core is in M or E, and M or E never coexist with S (tested after every step of every
   preset and of random sequences).
8. **Ties and order:** operations are atomic and applied in sequence order; no two cores act in one step. The
   snooping cores are visited in core order (C0, C1, …) and their transitions listed in that order, before the
   requester's. With the invariant, at most one core can hold M or E, so the visiting order never changes the result;
   it only fixes the order of `transitions`.
9. **Counting:** `busTx` counts the requester's transactions (`BusRd`, `BusRdX`, `BusUpgr`); the write-back that
   answers one is counted in `writebacks`, not again in `busTx`. A **downgrade** is M → S or E → S; an **invalidation**
   is a copy that becomes I. M → S is a downgrade, never an invalidation (the original page counted it as one).
   `hits` counts reads in M, E, S and writes in M, E.

## Appending an operation (the student's buttons)

- At step n (0 ≤ n ≤ steps), "Ck reads / writes" makes the sequence `ops[0 … n−1]` followed by the new operation, and
  the page goes to step n + 1, so the new operation is shown at once. The rest of the old sequence is dropped (a
  branch: "what if C1 writes now?"). At step 0 this starts a new sequence of one operation.
- Not possible at n = 20 (the cap): the buttons are `aria-disabled` and the caption says why.
- Changing `cores` keeps the step; operations on cores that no longer exist are left out (rule "Operations").

## Presets (expected numbers; derived by hand from the rules, checked by script)

| # | id | cores | sequence | steps | busTx | inval. | downgr. | wb | hits | end states | RAM | newest |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `classic` | 2 | C0 R, C1 R, C0 W, C1 R | 4 | 4 | 1 | 2 | 1 | 0 | S S | 1 | 1 |
| 2 | `silent-upgrade` | 2 | C0 R, C0 W, C0 R, C1 W | 4 | 2 | 1 | 0 | 1 | 2 | I M | 1 | 2 |
| 3 | `ping-pong` | 2 | (C0 W, C1 W) × 3 | 6 | 6 | 5 | 0 | 5 | 0 | I M | 5 | 6 |
| 4 | `readers-writer` | 3 | C0 R, C1 R, C2 R, C1 W, C0 R, C2 R | 6 | 6 | 2 | 2 | 1 | 0 | S S S | 1 | 1 |

Step by step:

1. `classic` (the `multicore-mesi` walk-through): C0 R: BusRd, nobody else, C0 I → E. C1 R: BusRd, C0 E → S, C1 I → S.
   C0 W: BusUpgr, C1 S → I, C0 S → M (X = 1, RAM 0 stale). C1 R: BusRd, C0 writes back (RAM 1), M → S; C1 I → S.
2. `silent-upgrade`: C0 R: BusRd, E. C0 W: E → M, no bus (X = 1). C0 R: hit. C1 W: BusRdX; C0 writes back (RAM 1),
   M → I; C1 I → M (X = 2, RAM stale). E saves the bus message of step 2: in MSI the same write would be a BusUpgr.
3. `ping-pong`: each write misses, sends BusRdX, makes the other core write back and become I; 6 transactions,
   5 invalidations and 5 write-backs, no hits. Two cores writing one line take turns on the bus.
4. `readers-writer`: C0 R: E. C1 R: C0 E → S, C1 S. C2 R: S S S, no change in C0, C1. C1 W: BusUpgr, C0 and C2
   S → I (2 invalidations), C1 M (X = 1). C0 R: BusRd, C1 writes back (RAM 1), M → S; C0 S; C2 stays I. C2 R: BusRd,
   C2 S.

The default params are preset 1 (`cores` 2, `classic`), so `sim.json` `steps` is 4.

## Display

- Stage: RAM (X and its value; struck through and labelled stale while some core is M), the bus (the step's
  transaction as an arrow from the requester to the bus, its name on it; a write-back as an arrow from the M holder up
  to RAM), the caches side by side (state as a large letter on a pattern: M solid, E dotted, S striped, I hollow
  dashed; the value of the copy; the core's read and write buttons), the sequence strip (operations, current one
  marked), the counts, and a small state diagram (M, E, S, I; the edges taken in this step drawn thick, the
  requester's solid and the snoopers' dashed, the requester's own state ringed on a hit).
- "Changed": every core whose state changed in this step, and RAM when written back.

## Out of scope

MOESI and MESIF, directories, evictions and capacity, false sharing across words (`multicore-mesi` shows it), memory
ordering, cache-to-cache transfer (the M holder writes back and the requester reads RAM, as in the original page).
