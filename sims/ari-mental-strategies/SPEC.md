<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-mental-strategies: SPEC

Task `docs/tasks/w3/ari-mental-strategies.md`, catalogue §4.17. One concept: a sum or a difference up to 1000 can be
done in the head in more than one way, and every way is a path of jumps on an empty number line from the first number
that lands on the same number. Three ways: split the second number by place (rastavljanje: 347 + 285 = 347 + 200 + 80
+ 5), jump to a round number first, and compensate (stalnost zbroja, stalnost razlike: 523 − 198 = 525 − 200). The
partial results are written down as the path goes. Which way is easiest depends on the numbers.

Class **explorer** (no kit steps): the student sets the task; the page draws the three paths on three lines that share
one scale; `j` reveals the jumps one at a time on all three lines together. Numbers checked with an independent script
(NOTES.md, Checks).

## Sources

- **Curriculum** (Narodne novine 7/2019), MAT OŠ A.3.2 "Mentalno zbraja i oduzima brojeve do 1000": razrada
  "Mentalno zbraja i oduzima … rastavljanjem broja na zbroj višekratnika dekadskih jedinica ili zapisivanjem
  djelomičnih rezultata" (the catalogue's seed, quoted in the task file), sadržaj "Mentalno zbrajanje i oduzimanje
  brojeva u skupu brojeva do 1000", preporuka: grade 3 computes up to 1000. Hence numbers 0…1000, split by place as
  the first way, and the partial results written on the page. Read through `sims/ari-constant-difference/` (SPEC,
  Sources: fetched 2026-11-13); this session had no new fetch.
- **Compensation** is `ari-constant-difference`'s rule (its SPEC rules 2 and 5): in a difference both numbers move the
  same way, in a sum one gives what the other takes. Its "flip" mistake is this page's compensation mistake.
- **To a round number first** is the textbooks' crossing a ten or a hundred (prijelaz desetice, prijelaz stotice:
  456 + 7 = 456 + 4 + 3, 380 + 50 = 380 + 20 + 30), from general knowledge of Croatian school practice *(check)*.
- The examples: 347 + 285 is the catalogue's; 632 − 285 is it backwards; 523 − 198 and 398 + 245 are
  `ari-constant-difference`'s; 432 + 256 is mine (no carry anywhere).

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `op` | `add`, `sub` | `add` | a sum a + b or a difference a − b |
| `a`, `b` | whole 0…1000 | 347, 285 | the two numbers (set from the task field) |
| `j` | whole 0…`jmax` | 9 (→ all) | how many jumps of each path are drawn |
| `mistake` | boolean | false | compensation's typical mistake (teacher): the first number moves the wrong way |
| `scale` | boolean | false | draw the line to scale (with ticks) instead of empty |

## Rules

1. **The task is made valid** (`numbersOf`, as `ari-constant-difference` rule 1). a and b rounded and clamped to
   0…1000 (not a number: 0); an unknown `op` is `add`. **Tie-breaks:** a subtrahend above the minuend is lowered to it
   (120 − 300 → 120 − 120); a second addend over 1000 − a is lowered to it (700 + 600 → 700 + 300).
2. **Split by place** (`parts`, way `split`): b's hundreds, tens and ones, largest first, a zero part left out
   (285 → 200, 80, 5; 205 → 200, 5; 1000 → 1000; 0 → none). Each part is one jump, forwards in a sum, backwards in a
   difference.
3. **To a round number first** (`toRound`, way `round`): the first jump goes from a to the nearest hundred in the
   direction of travel (up in a sum, down in a difference) if that is at most b away; **else** to the nearest ten that
   way if at most b away; else there is no first jump. **Tie-breaks:** a jump of exactly b is allowed (347 + 53 →
   one jump to 400); a number that is already a hundred has no hundred jump (it tries the ten, and a ten has none
   either: 400 + 25 → +20, +5). The rest, b − d, is split by place (rule 2). 347 + 285: +53 → 400, +200 → 600,
   +30 → 630, +2 → 632. 347 + 25: +3 → 350, +20 → 370, +2 → 372. 632 − 285: −32 → 600, −200, −50, −3 → 347.
4. **Compensation** (`roundOf`, way `comp`): b is made round, R = `roundOf(b)`: the nearest hundred when it is at
   most 10 (`NEAR`) away and not 0, else the nearest ten; **tie-breaks:** exactly 10 away takes the hundred (190 → 200,
   189 → 190), half up (245 → 250; the hundred's own half-up never matters, a 50 is 50 away), 10…14 go to 10 (never
   to 0), below 10 b stays (nothing to compensate: one jump). Teachers compensate only when b is next to a round number
   (fresh review). b grew by k = R − b; the first number moves by −k in a sum (it gives what b took: stalnost zbroja)
   and by +k in a difference (both move the same: stalnost razlike); then R split by place (rule 2). 523 − 198 =
   525 − 200: +2, −200. 347 + 285 = 342 + 290: −5, +200, +90. A shift of 0 is no jump. **The mistake** moves the first
   number the other way (523 − 198 → 521 − 200 = 321): it lands 2k off. **Order** (`leaves`): when the constant-sum or
   constant-difference order would leave 0…1000 (999 − 198 → 1001 − 200; 1 + 298 → −1 + 300), the round jumps go
   first and the shift last (`order: 'fix'`: 999 − 200 + 2; 1 + 300 − 2); when that leaves too (2 + 995: −3, 1002), the
   way is `out` and not drawn; `over` is the first number outside in the usual order.
5. **What a jump is like** (`kindOf`), from x by s: **`place`** when no place carries or borrows (each digit of x plus
   or minus the same digit of |s| stays in 0…9: 347 − 15 = 332, 332 + 300); **else `round`** when it lands on or
   leaves a multiple of the place above |s|'s largest place (347 + 53 = 400; 400 − 50 = 350: a complement, dopuna);
   **else `cross`** (it jumps over a ten or a hundred, 547 + 80 = 627). Order matters: a jump that is both carry-free
   and to a round number (632 − 32 = 600) is `place`. The page calls `cross` "preko desetice ili stotice" (over a ten
   or a hundred), not "s prijelazom": in the textbooks a jump that lands on a hundred (347 + 53 = 400) is also a
   prijelaz, and it is the easy one here (fresh review).
6. **The easiest way** (`best`): among the ways that land on the right number (not `out`, not the mistake), the fewest
   `cross` jumps, then the fewest jumps. **Tie-breaks:** every way tied is marked; but when every way that lands right
   ties (b = 0, 324 + 152, compensation out and the other two tied), none is (nothing to choose). The page shows it
   when every jump is drawn.
7. **One line, one scale** (`emptyScale`, `xOf`): the three lines share the marked numbers of all paths (a, every
   landing, the result), so a number sits at the same place on each and the three results line up. Empty line: the
   distinct numbers in order, each gap max(its share of the span, 0.08) and then all normalised to 0…1 (a jump of 3
   stays visible). **Tie-break:** a single number (b = 0) sits at 0.5. To scale (`scale`): the number line model's
   `view` over the same numbers (pad 0.04, at most 10 major ticks, 0…1000).
8. **Jumps shown** (`j`): j is clamped to 0…jmax, jmax the longest path; each line draws its first min(j, length)
   jumps. A shorter path is done earlier and waits (COMMON.md §11: each runs to its own end). Not a number: all.

## Presets (expected numbers; checked by script and in `sim.test.js`)

| # | id | task | split | round | comp | best |
|---|---|---|---|---|---|---|
| 1 | `cat` | 347 + 285 = 632 | +200 +80c +5c (3, 2 cross) | +53r +200 +30 +2 (4, 0) | −5 +200 +90c (3, 1) | round |
| 2 | `back` | 632 − 285 = 347 | −200 −80c −5c (3, 2) | −32 −200 −50r −3r (4, 0) | +5 −200 −90c (3, 1) | round |
| 3 | `place` | 432 + 256 = 688 | +200 +50 +6 (3, 0) | +68r +100 +80 +8 (4, 0) | −4c +200 +60 (3, 1) | split |
| 4 | `near` | 398 + 245 = 643 | +200 +40c +5c (3, 2) | +2r +200 +40 +3 (4, 0) | −5 +200 +50c (3, 1) | round |
| 5 | `comp` | 523 − 198 = 325 | −100 −90c −8c (3, 2) | −23 −100 −70r −5r (4, 0) | +2 −200 (2, 0) | comp |
| 6 | `wrong` | 523 − 198, mistake | as 5 | as 5 | −2 −200 → 321 ✗ (should be 325) | round |

(c: `cross`, r: `round`, the rest `place`.) In every preset jmax = 4.

## Legend and captions

- Legend: a partial result (square), the result (yellow; a diamond on the stage), a jump over a ten or a hundred
  (dashed arc and size chip).
- Per line: the way's name, the written form (b split as the way splits it, then the current partial result: "= 547 +
  80 + 5"; "≠" after the task on the mistake), and when all is drawn its count ("3 skoka, 2 preko desetice ili
  stotice"), ★ on the easiest, ✗ and "treba 325" on the mistake.
- Caption: j = 0: what to do (S); 0 < j < jmax: the jumps just made on each line; at the end: all land on r, the
  easiest and why. Adult adds why each way works; child: one short line.

## Terms (hr / en)

zbrajanje / addition, oduzimanje / subtraction, pribrojnik / addend, zbroj / sum, umanjenik / minuend, umanjitelj /
subtrahend, razlika / difference, brojevna crta / number line, prazna brojevna crta / empty number line *(check)*,
skok / jump, rastavljanje (po mjesnim vrijednostima) / splitting by place, okrugli broj / round number *(check)*,
prijelaz desetice, stotice / crossing a ten, a hundred *(check)*, skok preko desetice ili stotice / a jump over a ten
or a hundred *(check)*, stalnost zbroja, razlike / constant sum, difference
*(check)*, kompenzacija / compensation *(check)*, djelomični rezultat / partial result.

## Misconceptions targeted

- "Only one way is right": three paths, one landing point, lined up.
- Compensation the wrong way (the mistake toggle, preset 6), with where it should land.
- "Splitting is always easiest": presets 1, 2, 4 and 5 show its jumps over a ten or a hundred.
- "Compensation always helps": presets 1–4 show it crossing when b is not next to a round number.

## Out of scope

Written column methods (`ari-column-addition`, `ari-column-subtraction`); counting up from the subtrahend
(dopunjavanje) as a fourth way; numbers over 1000; other bases (the row does not say "any base").
