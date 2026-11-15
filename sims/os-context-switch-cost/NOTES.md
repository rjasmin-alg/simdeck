<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# os-context-switch-cost: notes

New explorer (task `docs/tasks/w3/os-context-switch-cost.md`, catalogue `os-context-switch-cost`, §4.9, wave 3). Rules
and expected numbers: `SPEC.md`. No kit view is named by the task; the stage is plain HTML (flex timeline, CSS bars,
a list card) plus one SVG chart with HTML labels (as `sims/cmp-cost-of-noncompliance/`).

## Decisions

- **The model is illustrative.** Every timing (direct 2 µs, cache warm-up 40 µs, TLB warm-up 10 µs, rate 0.3) is the
  task's default, chosen to show the shape *(check)*; nothing is measured. The stage says so in both languages
  ("The timings are illustrative, not measured."), as ossimulator's `threads` page does, and so does the explanation.
- **Log slider for Q.** The kit's range is linear, so the param is the slider position `q` (0 … 9) over 1-2-5 steps,
  10 µs … 10 ms; the state carries `Q` in µs. Every preset lands on a step (10 ms, 1 ms, 100 µs, 20 µs), and so does
  the default W = 50 µs, so the Q = W tie-break is reachable (Q = 50 µs).
- **Two views of a quantum.** The timeline is drawn in real time: the switch (D, solid dark), the warm-up time
  min(Q, W) (W, striped in the process's colour: it runs, but stalls), then full speed (U, solid). The gauge's bar is
  an account of the same time, useful work first so the 50 % and 90 % marks line up with its edge: useful work
  (rule 4), the stalls min(Q, W)·(1 − rate), the direct cost. Its lines say "useful work: U plus 30 % of W" and
  "stalls during W", so the timeline's U (full-speed time) and the account's useful work are not confused.
- **True scale.** At Q = 10 ms the 2 µs switch is 0.02 % of the window; it is drawn at least 0.3 rem wide so the
  switch is visible, and the per-quantum numbers next to the gauge give the exact split. Segment letters show only
  when the segment is wide enough to hold them.
- **Window** = six slots of direct + Q (rule 7), A first; axis ticks are a 1-2-5 step giving about six intervals.
- **Shown value and band** (SPEC rule 8): the useful % is rounded to 6 decimals first, then to one decimal, and the
  band (≥ 90, ≥ 50) is taken from the shown value, so the gauge never reads "90,0 %" in the middle band. Both
  boundaries are reachable by sliders (SPEC, tested).
- **"Changed"** (the task's legend): the big number gets `.sd-changed` and a highlighted "crossed 90 %" / "crossed 50 %"
  (both, joined by "·", when one change jumps both) on the render where the band differs from the one shown before.
  Like a stepper's "changed in this step", it clears on the next change; a fresh page is not marked.
- **Regime and captions.** `warm` gives the task's caption shape; `thrash` (Q ≤ W: Q = W counts, because no
  full-speed time is left) says the process never reaches full speed; `nowarm` (W = 0) says the switch costs only the
  direct cost. Then "Only {p} …" below 90 %, "{p} …" from 90 %, switches per second (Croatian plural by the rounded
  count), and "the warm-up costs {x} times as much as the switch" when the stall time is at least twice the direct cost.
- **Decimal comma in Croatian.** The task's Croatian caption writes "63.7 %"; the page formats numbers with the
  language's own conventions (hr-HR: 63,7 %, 9.804; en-GB: 63.7 %, 9,804), as other prose sims do. The words of the
  caption are the task's.
- **The card.** Saved on every switch: general-purpose registers, PC, SP, flags, FPU/SIMD; the page-table base
  register is saved and switched for a process (with or without a tagged TLB) and "same, unchanged" for a thread.
  Goes cold: TLB entries flushed (process), kept (thread), kept and tagged (tagged TLB); the cache is "pushed out by
  the other" for every kind. A process switch does not flush the cache: the other process's working set displaces it,
  which is why the page says "goes cold", not "lost".
- **TLB warm-up slider** is disabled, with the reason, for a thread and a tagged TLB (rule 3 ignores it there).
- **Presets in two columns** with short names (Stolno računalo / Desktop, Server, Too often, Threads, Never warm); the
  quantum is in each preset's hint and on the Q slider. With five full-width presets the panel was 81 px too tall at
  1920×1080, and the header legend is kept short for the same reason (a wrapped subtitle costs the panel 28 px).
- **Missing params** (`null`, empty) take the default like non-finite ones (`Number(null)` would be 0).
- **Defaults equal the `server` preset** (Q = 1 ms, process), the task's default.
- **Mode switch** is out of the model; the explanation names it and says it costs only the change of mode
  (Stallings §3.5; ossimulator `processes` and `syscalls` show it).

## Deviations from the task

- `Q` is the slider position `q` (see above); the state has `Q` in µs as the task asks.
- Croatian numbers use a decimal comma (see above).
- The state also has `pct1`, `band`, `regime`, `warmTime`, `fullTime`, `window`, `timeline`, `saved`, `cold` (the task
  lists the minimum; these are what the page draws).

## Sources

- W. Stallings, *Operating Systems: Internals and Design Principles*, ch. 3 §3.5 "Process switching" (when to switch;
  mode switch vs process switch; the steps of a process switch) and ch. 8 (TLB).
- *Intel 64 and IA-32 Architectures Software Developer's Manual*, Vol. 3A, §4.10.1 "Process-Context Identifiers
  (PCIDs)": TLB entries tagged with an address-space identifier survive a change of address space. The page says
  "tagged TLB" and "address-space tag", no vendor name.
- ossimulator `src/modules/processes/` (`meta.ts` terms; `NOTES.md` "Mode switch"), `threads/NOTES.md`
  (`costProcessSwitch` vs `costKernelSameProc`; "Troškovi u simulaciji su ilustrativni"), `scheduling/NOTES.md`
  ("Promjene konteksta"), `address-translation/` (TLB model).
- Timings: illustrative *(check)*; the task's presets (99.6 %, 96.3 %, 63.7 %, 70.6 %, 27.3 %) recomputed in Python and
  in the tests.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| cache | priručna memorija (task, ossimulator; the glossary has *predmemorija* from uvod-u-linux, as `cache-mapping` notes) |
| TLB (translation lookaside buffer) | TLB (spremnik prijevoda adresa) *(check)* |
| tagged TLB / address-space identifier | označeni TLB / oznaka adresnog prostora *(check)* |
| warm-up | zagrijavanje |
| page-table base register | registar baze tablice stranica *(check)* |

Glossary terms used: time quantum, process switch, dispatcher, process control block (PCB), thread, mode switch.

## Shared requests

None. (A log-scale option for the kit's `range` control would let the param be `Q` itself; not needed here.)

## Review (playbook §7.4)

A fresh reviewer recomputed every SPEC number in Python (all match), read `sim.js` against SPEC rule by rule (no
divergence) and ran 43 mutants: 37 killed, 6 survived. Four survivors are equivalent: `Q >= W` → `Q > W` (rule 4 is
continuous), the curve loop bound and the exact-decade assignments (the decades are set anyway; V8's `Math.pow` is
already exact), the kink at `W > 10` (W = 10 is already a point). Two were test gaps, now killed: the band taken from
the raw value instead of the shown one (new test through `derive` at 89.951 % and 49.99999999999999 %), and a changed
`Q_STEPS` entry (the steps are now asserted). Fixed from the page review:

- the gauge's 50 % / 90 % marks did not line up with the useful share (the bar was D, W, U from the left): now U, W, D;
- "U" meant full-speed time in the timeline and useful work in the gauge: the gauge's lines now say what they count;
- the explanation's stacked parentheses, sentences starting with an English term in Croatian, and the dispatcher's
  role (the scheduler picks the next process, the dispatcher restores it);
- the kind hint ("keep the TLB entries"), the A/B legend ("processes or threads"), Croatian wording (hladnu priručnu
  memoriju (*cache*), "s 30 % pune brzine", "sprema se", "Stolno računalo");
- `PCID` dropped from the aliases (vendor term; "ASID" stays).

Rendered and checked by hand (Playwright screenshots): the presets too-often, thrash, desktop, threads, a W = 0 case at
exactly 50.0 %, and the "crossed 90 %" mark after switching from server to too-often; no console errors.

## Time

Started 2026-11-15 10:59, done 2026-11-15 11:20 (about 20 minutes of wall-clock time).
