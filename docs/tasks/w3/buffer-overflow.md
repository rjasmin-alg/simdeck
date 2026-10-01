# buffer-overflow: Stack buffer overflow

| | |
|---|---|
| Task | `buffer-overflow` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-buffer-overflow` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/buffer-overflow/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | SEC, OS, ARH |
| Topic / tags / level | `security` / `attacks` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **overwriting the return address; canaries, NX, ASLR**.

The student: feed longer inputs, step the stack.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- A standard systems-security textbook on stack frames and memory-safety errors (stack layout, return-address overwrite, mitigations).
- Documentation for the three mitigations as concepts: stack canaries (a compiler feature), a non-executable stack (a CPU no-execute bit), and address-space layout randomization.
- A general reference on memory-safety vulnerability classes (concept level, not exploitation).

## Model and presets

- **Scene:** a vertical stack drawing of one function's frame, high addresses at the top: saved return address,
  saved frame pointer, (optional) stack canary, then a fixed-size `char buf[N]` growing toward lower addresses.
  Beside it the input being copied in, byte by byte, and a small "CPU" box showing where execution goes when the
  function returns. A mitigations panel (canary, NX/DEP, ASLR) with toggles. Stepper.
- **State:** `{ bufSize, input, written, canary: {present, value, intact}, savedFP, retAddr: {value, label},
  nx, aslr, phase, outcome: 'normal'|'crash'|'canary-trip'|'hijack'|'nx-block'|'aslr-miss' }`; all addresses are
  small illustrative integers, not a real memory layout.
- **One step:** 1 function called, frame laid out (canary written if present); 2..k copy input bytes into `buf`
  one chunk per step by a copy routine that does no bounds check; 3 once writing passes `buf`, it overwrites the canary,
  then the saved frame pointer, then the return address; 4 function returns: compare canary (trip if changed),
  else jump to the (possibly overwritten) return address; 5 resolve against NX and ASLR; 6 outcome card.
- **Rules:**
  1. A copy routine with no bounds check lets input longer than `bufSize` write past the buffer into adjacent
     frame slots (textbook).
  2. The stack grows toward lower addresses while the copy writes toward higher ones, so an overflow reaches the
     saved frame pointer and then the return address (textbook) *(check: direction is the common x86 convention)*.
  3. On return the CPU jumps to the saved return address; if overwritten, control goes wherever those bytes point
     (textbook).
  4. Stack canary: a value placed before the return address is checked on return; a mismatch aborts the program
     before the jump (a compiler stack-protector feature; outcome `canary-trip`).
  5. NX/DEP: the stack is not executable, so a return address pointing into injected stack bytes faults; this is
     why a return address pointing at injected stack bytes faults (a CPU no-execute bit); reuse of existing code
     is named as the consequence but not simulated.
  6. ASLR: base addresses are randomized, so a hardcoded target address usually misses and the program crashes
     instead of being hijacked; without a memory-disclosure leak a fixed target is a guess (ASLR; textbook).
  7. The three mitigations are independent layers: each closes a different step, and the preset grid shows which
     (derived).
  Tie-break: if input exactly fills `buf` with no spill, outcome is `normal`; the off-by-one that overwrites one
  byte of the canary is still a `canary-trip`.
- **Params:** `bufSize` range 4…16 (8); `inputLen` range 0…40 (0); `canary` toggle (off); `nx` toggle (off);
  `aslr` toggle (off); `target` choice shellcode-on-stack / known-address (shellcode-on-stack).
- **Presets:**
  - `fits` inputLen ≤ bufSize: normal return, nothing overwritten. Derived.
  - `smash` bufSize 8, inputLen 24, all mitigations off, target = stack: return address overwritten, control
     hijacked. Canonical textbook case, outcome derived.
  - `canary` same, canary on: overflow trips the canary, program aborts before the jump. Derived.
  - `nx` canary off, NX on, target = stack: jump faults, no code execution. Derived.
  - `aslr` NX off, ASLR on, target = fixed address: the guessed address misses, crash not hijack. Derived.
  - `all-on` canary + NX + ASLR: the naive overflow is stopped at the first layer (canary). Derived.
- **Steps:** depends on `inputLen`; keep ≤ ~16 by copying 2 bytes per step; each preset ≤ 16 steps.
- **Legend:** buffer bytes (cells), canary (hatched cell), saved FP and return address (labelled cells),
  overwritten byte (kit highlight + outline), CPU jump target (arrow), outcome colour (ok/warn/danger with a
  label), changed (highlight on cells written this step).
- **Captions:** hr: "Unos je dulji od međuspremnika: upisivanje je upravo prešlo preko povratne adrese." / en:
  "The input is longer than the buffer: the write has just passed over the return address." — hr: "Kanarinac se
  ne poklapa: program prekida izvođenje prije skoka." / en: "The canary does not match: the program aborts before
  the jump."
- **Terms:** stack — stog; buffer — međuspremnik; return address — povratna adresa; stack canary — kanarinac
  *(check)*; overflow — prekoračenje / preljev *(check)*; bounds check — provjera granica; address space layout
  randomization — nasumično raspoređivanje adresnog prostora *(check)*; non-executable stack — neizvršivi stog.
- **Misconceptions:** any overflow lets you run code (mitigations often reduce it to a crash); a canary stops all
  overflows (it protects the return address, not arbitrary writes); ASLR alone is enough.
- **Out of scope:** heap overflows, ROP chain construction, format-string bugs, writing real shellcode, specific CVEs.
- **Note for the coordinator:** this is the only sim whose courses include ARH/OS; it pairs with
  `spectre-meltdown` and `rowhammer` from single-page-labs — consider cross-linking, not merging.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `buffer-overflow` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh buffer-overflow sims/buffer-overflow` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/buffer-overflow/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
