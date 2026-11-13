<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-constant-difference: SPEC

Task `docs/tasks/w3/ari-constant-difference.md`, catalogue §4.17. One concept: adding the same number to the minuend and
the subtrahend (or taking it from both) does not change the difference; on the number line both points move together
and the gap stays (523 − 198 = 525 − 200 = 325). A sum stays when one addend gives the other what it takes
(398 + 245 = 400 + 243). The same idea is why equal additions works in column subtraction. Typical mistakes: changing
only one number, or moving both numbers of a sum the same way.

Class **explorer** (no steps): the student sets the task and the shift, and the page shows the task before and after,
two number lines on one scale, and two close-ups. Numbers checked with an independent script (NOTES.md, Checks).

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-13): MAT OŠ A.3.2 "Mentalno zbraja i oduzima brojeve do 1000",
  "Primjenjuje … vezu zbrajanja i oduzimanja", "Imenuje članove računskih operacija"; sadržaj "Mentalno zbrajanje i
  oduzimanje brojeva u skupu brojeva do 1000"; preporuka "Iako su učenici u 3. razredu usvojili brojevni niz do
  10 000, računaju u skupu brojeva do 1000". Grade 2 (A.2.x) uses the *brojevna crta* and the phrases *uvećaj za* /
  *umanji za*. Hence: numbers 0…1000, the line called *brojevna crta*, the words *uvećan/umanjen za*.
- The curriculum does not name *stalnost razlike* or *stalnost zbroja*: those are the textbooks' names (catalogue
  §4.17, owner request 2026-11-13). The examples 523 − 198 and 398 + 245 are the catalogue's.
- Equal additions: `sims/ari-column-subtraction/` (its SPEC rule 7: the base on top, one of the next place below; both
  numbers grow by the same).

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `op` | `sub`, `add` | `sub` | a difference a − b or a sum a + b |
| `a`, `b` | whole 0…1000 | 523, 198 | the minuend and subtrahend, or the two addends (set from the task field) |
| `k` | whole, inside `kRange` (at most ±200) | 2 | the shift |
| `way` | `right`, `one`, `flip` | `right` | the step: the right one, or one of the two typical mistakes (teacher) |
| `hide` | boolean | false | ask first: the result after the shift is hidden until V |

## Rules

1. **The task is made valid** (`numbersOf`). a and b are rounded to whole numbers and clamped to 0…1000 (a value that
   is not a number is 0); an unknown `op` is `sub`. **Tie-breaks:** in a difference a subtrahend larger than the
   minuend is lowered to it (120 − 300 → 120 − 120); in a sum a second addend that takes the sum over 1000 is lowered to
   1000 − a (700 + 600 → 700 + 300). The page itself swaps the numbers when the operation is switched to a difference
   with b > a (245 + 398 → 398 − 245), so the clamp is only a guard.
2. **How the numbers move** (`moved`): a₂ = a + ca · k, b₂ = b + cb · k.

   | | right | one (only one number) | flip (the wrong way) |
   |---|---|---|---|
   | difference | ca = 1, cb = 1 | ca = 0, cb = 1 (only the subtrahend) | ca = 1, cb = −1 (as in a sum) |
   | sum | ca = 1, cb = −1 | ca = 1, cb = 0 (only the first addend) | ca = 1, cb = 1 (as in a difference) |

   "One" moves the number the shift is usually aimed at: the subtrahend of a difference (198 → 200), the first addend
   of a sum (398 → 400).
3. **The shift stays valid** (`kRange`, `kOf`): the shifts for which a₂ and b₂ are in 0…1000, a difference is not
   below 0 (b₂ ≤ a₂) and a sum not above 1000. The constraints are linear in k and hold at k = 0, so they form an
   interval around 0; it is capped at ±200 (`K_MAX`, which takes the equal-additions preset's 110). k is rounded and
   clamped into it (a value that is not a number is 0). Examples: 523 − 198 right: −198…200; 998 − 7: −7…2;
   210 − 198 one: −198…12, flip: −6…198; 20 + 30: −20…30; 600 + 300 flip: −200…50.
4. **The target** (`targetOf`): the number the shift is meant to make round. A difference: the subtrahend. A sum: the
   addend nearer a ten; **tie-break:** the first addend on a tie (395 + 245: both 5 away → the first); when only the
   first addend moves (`one`), the first.
5. **To a round number** (`roundShift`, key O, the stage button): the target's current value v goes to `roundOf(v)`:
   the nearest ten if v is not a multiple of 10 (**tie-break:** 5 rounds up: 195 → 200), but never 0 (1…4 go up to 10,
   rule 7), else the nearest hundred if it is not a multiple of 100 (50 rounds up: 150 → 200), else v stays (0 too:
   the caption says a 0 is already easy). The new shift is k + (round − v) · c, with c the
   target's coefficient (±1). Pressing again from a ten goes on to the hundred: 503 − 178 → 505 − 180 (k = 2) →
   525 − 200 (k = 22). Out of reach the shift is kept and the caption says why: `range`, the moved task would leave
   0…1000 (998 − 7: 10 would need k = 3, a₂ = 1001), or `cap`, the task would fit but the shift would pass ±200
   (523 − 198 at k = 200: 400 needs k = 202); already round, the caption says so.
6. **The result** (`initial`): r = a − b or a + b, r₂ the same of a₂, b₂, delta = r₂ − r. The right way keeps it for
   every shift (delta = 0). The mistakes: difference `one` delta = −k, `flip` +2k; sum `one` +k, `flip` +2k. **Tie-break:**
   k = 0 leaves every way the same (delta = 0); the caption then asks for a shift.
7. **Round** (`targetRound`): the target after the shift is a multiple of 10 and not 0 (0 is not called round: 1000 − 3
   = 997 − 0 says nothing about round numbers).
   **Stuck:** when no shift is possible (0 + 0; 1000 − 1000 with flip) the caption says so instead of asking for a drag.
8. **The number lines** (`numberline.js`, the shared model of §5.27):
   - `niceStep(span, maxTicks)`: the smallest 1, 2 or 5 · 10ᵏ (at least 1) giving at most maxTicks parts (11 → 2,
     21 → 5, 350 → 50). `minorStep`: tenths of 1 · 10ᵏ, halves of 2 · 10ᵏ, fifths of 5 · 10ᵏ, none under 1.
   - `view(values, opts)`: widen to `minSpan` (default 10; an odd extra unit goes right), pad by `pad` × span on each
     side (rounded up), keep at or above `floor` (default 0) and, when given, at or below `ceil` (the stretch slides;
     hi is cut to ceil after snapping), snap lo and hi to the step; at most maxTicks parts. Every view on the page has
     ceil 1000, so a sum of 1000 is drawn on 0…1000, not 0…1200. The main lines: a difference shows a, b, a₂, b₂ (523 − 198, k = 2 → 150…600, step 50); a sum shows 0, a,
     a + b and the moved ones (starts at 0).
   - `ticks`, `pos`, `valueAt` (a drag lands on the whole number under the pointer, half up, inside the view),
     `freeLabels` (major tick labels farther than minFrac from every marked point; a tick at a point is never labelled:
     the point's own label says it), `jump(from, to)` (size and direction).
   - Close-ups (`lenses`): for a difference the subtrahend (b → b₂) and the minuend (a → a₂); for a sum the end of the
     first addend (a → a₂) and the end of the sum (a + b → a₂ + b₂). Each has `want`, where the right move puts it
     (b + k, a + k; a + k, a + b), `ok` when it got there, and a view of from, to and want (min span 10, pad 0.15).
     **Tie-break:** a mistake can shift further than the right move allows, so want can leave 0…1000 (1000 − 199,
     flip, k = −200: want −1); then `wantShown` is false, the ring and "should be" are not drawn and the view leaves it
     out.
9. **Dragging** (page): on the lower line the point nearest the pointer among those that move with k is taken (in a
   sum the end moves only in the mistakes); k = k₀ + round((x − v₀) / c), clamped to `kRange`; the scale is frozen
   while dragging (the move and release listeners sit on the window, since every move re-renders the line; the frozen
   scale is released on pointer up, cancel or window blur).
10. **The task field** (`parseTask`): "523 − 198", "523-198", "398 + 245"; −, - and – are minus; spaces anywhere and
    one "=" at the end are ignored. Refused: empty, not exactly one sign, a part that is not a whole number, a number over 1000, a
    subtrahend larger than the minuend, a sum over 1000.

## Presets

| # | id | Task | k | way | Expected | Shows |
|---|---|---|---|---|---|---|
| 1 | `round` | 523 − 198 | +2 | right | 525 − 200 = **325** = 325 | the catalogue's example; 200 is round (also the default) |
| 2 | `take` | 645 − 203 | −3 | right | 642 − 200 = **442** | taking the same from both |
| 3 | `sum` | 398 + 245 | +2 | right | 400 + 243 = **643** | the catalogue's sum: one gives, the other takes |
| 4 | `one` | 523 − 198 | +2 | one, asked | 523 − 200 = **323** ≠ 325 (delta −2) | the mistake: only the subtrahend moved |
| 5 | `same` | 398 + 245 | +2 | flip, asked | 400 + 247 = **647** ≠ 643 (delta +4) | the mistake: both addends up |
| 6 | `equal` | 503 − 178 | +110 | right | 613 − 288 = **325** | equal additions: 10 ones on top and 1 ten below, then 10 tens on top and 1 hundred below: +110 to both (`ari-column-subtraction` preset 1) |

The sum preset is listed on the home page as its own entry ("Stalnost zbroja").

## What each audience sees

| | teacher (default) | adult | child |
|---|---|---|---|
| task field | yes | yes | no (presets, slider, drag) |
| the step choice (mistakes) and ask-first | yes | no | no |
| captions | what moved and by how much, the round number, the mistake and why | the teacher's, plus why it works (the gap; the border moves, the end stays) and the right step after a mistake | one short line ("Oba broja +2. Razlika je ista: 325.") |
| digits | large | large | larger |

## Legend and terms

The header legend names the first three (space); the rest are labelled on the stage. Square, colour 1: the minuend / first addend; circle, colour 2: the subtrahend / second addend; hollow dashed: where a
number was before the shift; a diamond: the end of a sum; the difference bar (colour 3) and the second addend
(colour 2, hatched); a dashed red ring: where the right move would have put a number; the moved numbers on yellow.

| hr | en |
|---|---|
| umanjenik, umanjitelj, razlika | minuend, subtrahend, difference |
| pribrojnik, zbroj | addend, sum |
| brojevna crta | number line |
| pomak | shift |
| okrugli broj | round number |
| stalnost razlike, stalnost zbroja *(check)* | constant difference, constant sum |
| jednaki dodaci *(check)* | equal additions |
| uvećan za, umanjen za | went up by, went down by |

## Misconceptions targeted

- Changing only one number (523 − 200 = 323): preset 4, the step `one`.
- Moving both addends of a sum the same way (400 + 247 = 647): preset 5, the step `flip`; and its mirror, moving the
  numbers of a difference in opposite directions (525 − 196 = 329).
- "The difference is a number, not a distance": the gap bar and the close-ups show it as a distance that travels.

## Out of scope

Negative numbers and numbers over 1000 (grade 3 computes to 1000); other bases (the row does not say "any base");
written column subtraction itself (`ari-column-subtraction`); several strategies side by side (`ari-mental-strategies`).
