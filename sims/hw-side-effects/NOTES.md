<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# hw-side-effects: notes

A new native sim for task `docs/tasks/w1/spectre-meltdown.md`, built to the owner's abstract scope of 2026-10-02 (the
thread brief t-0044), which **replaces the task file's adoption plan**. The original
`single-page-labs/spectre-meltdown.html` is a step-by-step attack walkthrough (t-0037 stopped on it); it was used only
as the topic. Nothing was copied from it, so there is no `origin`; `credits` names it as the inspiration.

## Decisions

- **Id `hw-side-effects`,** class `explorer`: the lesson is a trade-off the student moves through, not a sequence.
  `spectre-meltdown` is kept as a search alias (both languages); `sim.json` has no id-alias field, so the old id is
  not a URL. *(owner)* If the task id must resolve as a URL, that needs a redirect in the site frame.
- **Two symmetric axes,** as the owner framed them: speed → Spectre-type trace that survives a rollback; space →
  Rowhammer-type disturbance of a neighbouring row. Each panel has the same shape: the victim's bits above, the shared
  state below, ◆ where a 1-bit left a trace.
- **Both axes leak information** (the other program learns secret bits); the victim's own data and result never change,
  so "the victim's result is always correct" holds on both. On the space axis this is the data-dependent form of
  row disturbance; the corrupting form (flipping someone else's bits) is the `rowhammer` sim's subject, linked from the
  explanation and `related`.
- **Probability model:** quadratic per axis (slow at first, then faster), PMAX 80 %, combined as independent events.
  Traces are deterministic (evenly spaced toughness per axis), so the grid's share of traced bits matches the chance
  and a higher level never removes a trace. Labelled "illustrative model, not measured" on the stage and in the
  explanation.
- **Cost:** time, chip area, energy per task, 1× at full optimisation. "Turning optimisation off costs more energy"
  follows the owner's brief (slower runs and larger cells and wires); *(check)* real energy effects of speculation go
  both ways, the page does not claim otherwise beyond the illustrative bars.
- **Mitigations** are one toggle (× ¼ chance, 1.25× time, 1.1× energy) plus one sentence: they exist in hardware, OS
  and compilers and cost performance. No mitigation is named.
- **The trust twist** (owner, added mid-thread 2026-10-02): a `trust` choice (some code may be hostile / all code is
  trusted). Trusted: the same traces and leak chance, risk 0, caption "full optimisation is safe". A wall of limits on
  the stage lists the four physical limits and then trust, highlighted while it binds; under it the quotable line
  "Sve ostale granice brzine su fizičke. Ova je granica povjerenja." / "Every other limit on speed is physical. This one
  is a limit of trust." Preset 6 (`trusted`) is the closing step. The explanation ends with the conclusion.
- **Left out entirely:** instruction names, code, access patterns, timing, fault suppression, CVE numbers, exploit
  details. Spectre, Meltdown and Rowhammer are named only as real-world examples (panel subtitles, the explanation with a year, aliases).
- Tags: `attacks`, `caches`, `memory`, `cpu`, `performance`; topic `architecture` (the task's); level `core`.

## Colour and shape

Speed panel: `--c2` solid top bar; space panel: `--c4` dashed top bar. Secret 1: filled `--c1` with the digit; 0:
dashed hollow with the digit; trace: highlighter, thick ink border and ◆; no trace: plain hollow. Victim checks: ✓ with
`--ok` border; what the other program sees: ! with a thick `--danger` border when hostile, ◆ muted when trusted. Leak
meter: `--danger` fill, hatched when trusted. Trust limit: dashed, highlighter + thick border when it binds. Checked in
the grayscale screenshots.

## Sources

- The owner's brief (thread t-0044, 2026-10-02): question, scope, sliders, symmetric axes, trust conclusion.
- Topic only: `single-page-labs/spectre-meltdown.html`.
- Kocher et al., "Spectre Attacks" (2018); Lipp et al., "Meltdown" (2018); Kim et al., "Flipping Bits in Memory Without
  Accessing Them" (ISCA 2014): for the years and the one-line descriptions only.
- All model numbers are the sim's own (SPEC.md).

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| side channel | sporedni kanal |
| speculative execution | spekulativno izvršavanje |
| rollback (of work done ahead) | poništavanje |
| running ahead | rad unaprijed |
| mitigation | zaštita |
| side effect | nuspojava |

*cache* uses the glossary (predmemorija, `[[cache]]`).

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **Related:** add `hw-side-effects` to `sims/rowhammer/sim.json` `related` (not edited here: another sim).
- **Task file / catalogue:** `docs/tasks/w1/spectre-meltdown.md` and catalogue `spl-spectre-meltdown` still describe
  the adoption; point them at `sims/hw-side-effects/` (coordinator; outside this folder).

## Checks

- Every model rule was broken once and a test failed each time: the tie (≤ instead of <), 0-bits leaking, the
  combination (max instead of 1 − product), clamping, the quadratic, trust risk, `trustBinds`, mitigation energy, the
  space axis reading the speed slider, `seen` without the space axis, equal rank orders on both axes, a victim check
  that fails, trust marked physical.
- A fresh reviewer (a separate agent) read the diff against SPEC.md, recomputed every number and broke more rules: the
  mitigation on one axis only, cost coefficients swapped or averaged, cost clamping, `ones`, rank orders, the preset
  table, defaults, `trustBinds` without traces. Each now fails a test (31 tests). It also fixed the caption for "chance
  above 0 but no trace yet" and several Croatian phrasings. No scope violations found.
- Not checked: a real projector and a lecturer at the page.

## Time

Start 2026-10-02 about 19:58, done about 20:35 (one session).
