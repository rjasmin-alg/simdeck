<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# buffer-overflow: notes

New stepper (task `docs/tasks/w3/buffer-overflow.md`, catalogue `sec-buffer-overflow`, §4.3, wave 3). Rules, tie-breaks
and expected numbers: `SPEC.md`. No kit view fits a stack frame drawn byte by byte, so the page draws its own (the
task names none).

## Decisions

- **Layout.** Two columns in the stage. Left, the frame in 4-byte rows, high addresses at the top, the row's address
  at the left and the slot's name and value at the right (`buf[0–3]`, saved FP, canary, return address, frame of
  `main`); "higher addresses / the copy writes upward" above, "lower addresses / the stack grows downward" below.
  Right, four cards: the program (five lines of C, the current one highlighted), the input (its bytes, the end of buf
  marked, copied ones dimmed), the CPU (what it runs, where it jumps and what happens there, this run's memory map
  under ASLR, the outcome badge at the end) and the protections (each one's job, on/off, and at the end what it did).
- **32-bit words, `bufSize` in steps of 4** (4, 8, 12, 16). Rows of four bytes stay aligned to the slots, so a row is
  always one slot; a 64-bit frame would need 8-byte rows and twice the width.
- **Byte glyphs, not hex.** Input bytes are `A` (padding), `C` (injected code), `@` (a byte of the target address);
  original slot bytes have no text, only the slot's colour and pattern, and the slot's value is written beside the
  row. Hex bytes would have to be little-endian, and with small addresses the upper bytes are zero in both the old
  and the new return address, so a half-written return address would already read as the target: the page would show
  a jump the model calls a crash. With glyphs the rule is simply "all four bytes from the input = the input's
  address; some = an address nobody chose".
- **The input is one crafted string, cut to `inputLen`.** Its author knows the layout (the address lands exactly on
  the return address, also with the canary on) but not the canary value, and took the target address from a run
  without ASLR. `fits` uses the same string: what the bytes are does not matter while they stay in buf.
- **The copy writes exactly `inputLen` bytes** (a length-based copy, no terminating zero), so the task's tie-break
  "exactly fills buf → normal" holds. A string copy would add a zero byte and make that an off-by-one; out of scope.
- **Fixed tail of three steps** (return, jump, outcome), also for a canary trip (the jump step says "no jump"). Toggling
  a protection mid-demo then keeps the same step count, so the kit keeps the current step and answers "what if" at
  the same point. `bufSize` and `inputLen` reset to step 0 (they change the step count).
- **Chunk 2 bytes, 4 above 24 bytes**, at least one copy step (an empty input still shows `copy()` running). Max 16
  steps; `sim.json` `steps` is 5, the count at the defaults (`inputLen` 0, as the task says).
- **Order of the checks** (rule 7): canary on return, then ASLR (is anything at the address?), then NX (may it run?).
  With ASLR and NX both on and a stack target the outcome is `aslr-miss` and NX is "not reached".
- **FP-only overwrite → `crash`**: the return to `main` works, then `main`'s frame pointer is garbage. The task lists no
  outcome for it; "crash" is the usual case.
- **NX with a code target → `hijack`** (the jump into `admin()` is not stopped by NX). This is what the task's rule 5
  means by "reuse of existing code is named as the consequence but not simulated": the page names it ("code the
  program already has", "code reuse") and shows nothing more.
- **ASLR target labels**: under ASLR the overwritten return address reads "buf in another run" / "admin() in another
  run", since the address no longer points there; the CPU card shows this run's stack and code ranges.
- **Outcome tones**: normal ok (✓, solid), crash and the three stopped outcomes warn (✕, dashed), hijack danger (⚠,
  double border).
- **Panel fit**: six presets in two columns with short names (as `cors`); the toggles have no hints (the protections
  card in the stage says what each one closes).
- **Related:** `rowhammer`. The task's coordinator note also names `spectre-meltdown` from single-page-labs, which is
  not in `sims/` yet; add it to `related` when it lands.

## Deviations from the task

- `bufSize` moves in steps of 4 (the task gives only the range 4…16).
- `target` labels: "code on the stack" / "program code" (the task: shellcode-on-stack / known-address); values
  `stack` / `code`.
- Presets `nx`, `aslr` and `all-on` use `inputLen` 24 and `bufSize` 8 like `smash` (the task says "same").
- Outcome `crash` covers two cases the task does not spell out: a partly overwritten return address and a saved FP
  overwritten with the return address intact.

## Sources

- R. E. Bryant, D. R. O'Hallaron, *Computer Systems: A Programmer's Perspective*, 3rd ed., §3.10.3 "Out-of-Bounds
  Memory References and Buffer Overflow" and §3.10.4 "Thwarting Buffer Overflow Attacks" (stack randomization, stack
  corruption detection with a canary, limiting executable code regions). From memory, no network in this session.
- W. Stallings, L. Brown, *Computer Security: Principles and Practice*, ch. "Buffer Overflow" (stack overflows; compile-
  time defences: stack protection; run-time defences: executable address space protection, address space
  randomization). From memory.
- GCC manual, "Program Instrumentation Options", `-fstack-protector` (the canary is a compiler feature, checked in the
  function epilogue before the return). From memory.
- Intel 64 and IA-32 SDM vol. 3, paging: the execute-disable (XD/NX) bit in page-table entries. From memory.
- MITRE CWE-121 "Stack-based Buffer Overflow" and CWE-787 "Out-of-bounds Write" for the vulnerability class. From
  memory.
- Numbers checked with a scratch script over every preset, all `bufSize` × `inputLen` step counts and the variants in
  SPEC.md (off-by-one, FP only, partial return address, NX with a code target, ASLR with a stack target) before the
  page was written.

## Unchecked *(check)*

- Book section numbers and titles above are from memory.
- Rule 2's direction is the common x86 convention (stack grows down, buffer copies up); the drawing is not tied to an
  ABI.
- That an FP-only overwrite usually crashes the caller soon after the return (it depends on what the caller does next).
- The canary's position directly above buf, below the saved frame pointer (the usual stack-protector layout; compilers
  may also reorder locals).
- Croatian terms: *kanarinac* (stack canary), *preljev* / *prekoračenje* (overflow), *nasumično raspoređivanje
  adresnog prostora* (ASLR), all marked *(check)* in the task.

## Term pairs

Missing from `kit/glossary.js`, written out in `strings.js` (hr: the English term in italics, the Croatian in
parentheses, in the explanation):

| en | hr |
|---|---|
| buffer | međuspremnik |
| return address | povratna adresa |
| bounds check | provjera granica |
| non-executable stack | neizvršivi stog |
| address space layout randomization | nasumično raspoređivanje adresnog prostora |
| stack canary | kanarinac na stogu |
| frame pointer | pokazivač okvira |

`stack` (stog), `overflow` (preljev) and `canary` (kanarinac) are in the glossary and used as `[[terms]]`.

## Shared requests

- **Kit:** none needed. The page's own CSS draws the cells; a K3 block grid (`kit/blockgrid.js`) was considered but
  its cells carry no per-row address and side label, which the stack needs on every row.

## Fresh review

A fresh reviewer read the diff against SPEC.md and the task, recomputed every number in SPEC (all correct) and ran 49
mutations of `sim.js`; 12 survived at first. Fixed after the review: new tests for the copy at every length and both
chunk sizes, `slotOf` at each boundary, the shown caller region, the saved-FP and canary values, `canary.present`, the
hijack's `jump.what` (buf / admin) and "not needed" on a crash. Now every mutation fails a test except one equivalent
mutant (`regionOf`'s stack bound, which no address reaches). Also fixed: the start caption at an empty input ("an input
of empty"), the Croatian genitive in it, the protections card ordered canary, ASLR, NX (the order of the checks), the
Croatian status words agree with *zaštita*, the explanation says the canary is checked by code the compiler adds (not
"the compiler checks"), the Croatian explanation no longer says "top of the stack", "overflow" not "attack" in the
canary lesson (an off-by-one is a bug, not an attack), one Croatian word for overflow (*preljev*), and three SPEC
overstatements.

## Time

Start 03:49, done 04:12 (model, page, gate, screenshots of every preset in both languages, fresh review with 49 mutations and its fixes): about 23 minutes by the wall clock, one session.
