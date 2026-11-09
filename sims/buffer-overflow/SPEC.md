<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# buffer-overflow: specification

One concept: **overwriting the return address; canaries, NX, ASLR**. The student feeds longer inputs and steps the
stack. Task: `docs/tasks/w3/buffer-overflow.md`; catalogue `sec-buffer-overflow` (§4.3). Model: `sim.js`; tests:
`sim.test.js`. Sources and unchecked items: `NOTES.md`.

## Scene

A function `greet(input)` has a local `char buf[N]` and calls `copy(buf, input)`, a copy routine that copies the whole
input and never checks the size. The frame is drawn in 4-byte words (a 32-bit illustration), high addresses at the top;
within a row the byte addresses grow to the right.

| Slot (bottom to top) | Offset from buf | Size | Without ASLR (`bufSize` 8, no canary) |
|---|---|---|---|
| `buf` | 0 … N−1 | N = 4, 8, 12, 16 | 0x7F70 |
| stack canary (only when on) | N | 4 | (0x7F6C is then buf) |
| saved frame pointer | N (+4 with canary) | 4 | 0x7F78, value 0x7F98 |
| return address | FP + 4 | 4 | 0x7F7C, value 0x1A2C (in `main`) |
| frame of `main` | RA + 4 … | ≥ 4, as far as the input reaches | 0x7F80 … |

The return-address slot is fixed at 0x7F7C; buf sits below it, so `bufAddr = 0x7F7C − raOffset`. Memory map without
ASLR: stack 0x7F00–0x7FFF, code 0x1000–0x1FFF, an existing function `admin()` at 0x1B40 that `greet` never calls.
With ASLR this run's stack is 0x2400 lower (0x5B00–0x5BFF) and the code 0x3000 higher (0x4000–0x4FFF); fixed shifts
keep the model deterministic. The canary value is 0xC3A95E17 (illustrative). All addresses are small illustrative
integers, not a real memory layout.

**The input** is written for this frame by someone who knows the layout but not the canary: with `target` = stack,
4 bytes of injected code `C` first; at the return address's offset the 4 bytes of the target address `@`; padding `A`
everywhere else. The target address is taken from a run **without** ASLR: buf's address (stack target, 0x7F70 for
`bufSize` 8 without canary, 0x7F6C with) or `admin()` at 0x1B40 (code target). The input is cut to `inputLen`.

## Steps

`steps(p) = 1 + copySteps + 3`, `copySteps = max(1, ceil(inputLen / chunk))`, `chunk` = 2 bytes, or 4 when
`inputLen > 24`. Maximum 16 (at `inputLen` 23–24); defaults (`inputLen` 0) give 5, the `sim.json` value.

| n | phase | what happens |
|---|---|---|
| 0 | start | `main` is about to call `greet`; only `main`'s frame exists |
| 1 | frame | the call has pushed the return address, `greet` saves the frame pointer, writes the canary (if on), reserves buf |
| 2 … 1+c | copy | `copy` writes the next chunk of the input, upward from buf[0] |
| 2+c | return | the canary is compared (a trip is decided here); the CPU reads the return address |
| 3+c | jump | the CPU jumps, resolved against ASLR and NX |
| 4+c | outcome | the outcome and what each protection did |

## Rules

1. **No bounds check.** `copy` writes every input byte at buf + i; input longer than `bufSize` writes past buf into
   the slots above (textbook).
2. **Direction.** The stack grows toward lower addresses and the copy writes toward higher ones, so past buf the write
   reaches the canary, then the saved frame pointer, then the return address, then the caller's frame (textbook)
   *(check: the common x86 convention; the drawing is one function's frame, not a specific ABI)*. With `bufSize` 8 and
   `inputLen` 24, no canary: bytes 8–9 (step 6) first touch the saved FP, bytes 12–13 (step 8) the return address.
3. **Return.** The CPU jumps to the saved return address (textbook). Untouched: back to `main` (0x1A2C). Wholly
   overwritten by the input: the input's target. Partly overwritten (1–3 of its 4 bytes): an address nobody chose →
   `crash`. Return address untouched but saved FP overwritten: the return works, then `main` uses a broken frame
   pointer → `crash` *(check: what happens next depends on the caller; "crashes soon after" is the usual case)*.
4. **Canary.** When on, the canary sits between buf and the saved FP. If any of its bytes changed, the check on return
   aborts the program **before** the jump (`canary-trip`); the overwritten return address is never used (compiler stack
   protector, textbook).
5. **NX.** When on, the stack is not executable: a jump to an address on the stack faults (`nx-block`). A jump into
   existing code (`target` = code) is not stopped by NX: outcome `hijack`; reusing existing code is named as the
   consequence, not simulated further (CPU no-execute bit, textbook).
6. **ASLR.** When on, this run's stack and code are elsewhere; the input's fixed address (from a run without ASLR) is
   not mapped now → `aslr-miss` (a crash, not a takeover), for either target. Without an address leak a fixed target
   is a guess (textbook).
7. **Independent layers.** The CPU meets them in the order canary (on return), then ASLR (is the address there at
   all?), then NX (may it run?). The first that applies decides; later ones are "not reached". Grid at `inputLen` 24:

   | on | target stack | target code |
   |---|---|---|
   | none | hijack | hijack |
   | canary | canary-trip | canary-trip |
   | NX | nx-block | **hijack** (NX does not help) |
   | ASLR | aslr-miss | aslr-miss |

   Layer status words: `off`, `stopped`, `not-reached` (an earlier layer stopped it), `not-needed` (normal or crash:
   nothing to stop), `no-effect` (on, and the run went past it).

**Tie-breaks.**
- Input exactly `bufSize` long: nothing past buf changes, outcome `normal` (also with the canary on). The copy writes
  exactly `inputLen` bytes, no terminating zero (a length-based copy; a string copy would add one, see NOTES).
- Off-by-one with the canary on (`inputLen` = `bufSize` + 1): one canary byte changes → `canary-trip`.
- Canary trip beats every later layer and both targets (the jump never happens).
- ASLR before NX: with both on and a stack target the outcome is `aslr-miss`, NX "not reached" (the guessed address is
  not mapped, so the no-execute check never applies).

## Presets (every number derived by the model; `sim.test.js` "presets")

| id | params | steps | outcome |
|---|---|---|---|
| `fits` | bufSize 8, inputLen 8 | 8 | normal (fills buf exactly) |
| `smash` | bufSize 8, inputLen 24, stack | 16 | hijack: return address = 0x7F70, the injected bytes run |
| `canary` | + canary | 16 | canary-trip; NX/ASLR off |
| `nx` | + NX, stack | 16 | nx-block at 0x7F70 |
| `aslr` | + ASLR, target code | 16 | aslr-miss: 0x1B40 is not mapped (code now 0x4000–0x4FFF) |
| `all-on` | canary + NX + ASLR, stack | 16 | canary-trip; NX and ASLR not reached |

## Misconceptions addressed

- Any overflow lets you run code: `fits` ends normally, partial overwrites crash, and the canary and ASLR always end in
  a crash or an abort; NX only against a stack target (with a code target it does not help).
- A canary stops all overflows: it guards the return address on return; the canary-trip outcome caption and the
  explanation say it does not stop arbitrary writes (out of scope to show).
- ASLR alone is enough: the explanation names the address leak; NX with a code target shows a layer that does not help.

## Out of scope

Heap overflows, ROP chain construction, format-string bugs, real shellcode, specific CVEs, a specific ABI or OS.
