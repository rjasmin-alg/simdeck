<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-remainder: specification

One concept: **dealing n things among d children round by round leaves fewer than d: the remainder; n = q · d + r
with r < d is the check; a remainder of d or more means one more round was possible.** Task:
`docs/tasks/w3/ari-remainder.md`; catalogue §4.17 (MAT OŠ A.3.3). Every expected number below was computed with a
small script independent of `sim.js` before coding (NOTES.md, Checks) and is asserted in `sim.test.js`.

## Source: the curriculum (Narodne novine 7/2019), read 2026-11-13

- **MAT OŠ A.3.3** "Dijeli prirodne brojeve do 100 s ostatkom." Razrada: "Dijeli brojeve do 100 s ostatkom.",
  "Provjerava rješenje pri dijeljenju s ostatkom.", "Rješava tekstualne zadatke." Sadržaj: "Dijeljenje brojeva do 100
  s ostatkom." Preporuka: "Pri upoznavanju dijeljenja s ostatkom u početku valja zadavati i zadatke sadržajno
  utemeljene u svakodnevici kako bi učenici pojam ostatka usvojili na razumljiv način." No example numbers.
- **MAT OŠ A.2.4** (grade 2, what the pupil brings): "Dijeli uzastopnim oduzimanjem istih brojeva."; preporuka:
  "dijeljenje kao uzastopno oduzimanje istih brojeva od zadanoga broja".
- So: numbers up to 100; an everyday story first (sweets dealt among children); the check is part of the outcome; each
  round is one subtraction of d from the pile, the grade 2 meaning of division. No grade 4 outcome mentions a remainder.

## Scene

- **The sentence** on top, big: `23 : 4 = ?` until the round that fails, then `23 : 4 = 5, ostatak 3`; under each
  number its name (djeljenik, djelitelj, količnik, ostatak), not in the child view.
- **The bowl** (left): n places in rows of 10 (a hundred square for 100). Sweets are taken from the front, so the
  last `pile` places hold a sweet and the ones before are hollow (taken). From the round that fails on, the sweets
  still in the bowl are the remainder: drawn ringed in `--c2`, at the end of the last row, with the label "ostatak r"
  right under them (shape, position and label, not colour alone).
- **The children** (right): d figures numbered 1 … d, each with a plate of the sweets received, in rows of 2 to 5 (up to 5 sweets in one row; with more, the
  page picks 2–5 per row so the sweets are as big as the box allows; 3 per row on a phone with more than 5 children). The
  sweets of the latest round carry the kit's changed mark. In the step where a round fails, each child gets a slot for
  the next sweet: the first r a dashed sweet ("there is one for you"), the others an empty slot with ✗ ("none left").
- **The rounds** (teacher and adult): the repeated subtraction as one line, `23 → 19 → 15 → 11 → 7 → 3`, each arrow
  labelled `− 4`, the last arrow `3 < 4` (stop); and `podijeljeno: 5 · 4 = 20`.
- **The check** (at the last step): `5 · 4 + 3 = 23 ✓` and `3 < 4 ✓`, the two parts of the check.
- **Typical mistake card** (teacher view, when switched on): a pupil's answer that stopped one round early,
  `23 : 4 = 4, ostatak 7`; at the last step its check: `4 · 4 + 7 = 23 ✓`, `7 < 4 ✗`: the remainder is too big, one
  more round was possible (`7 − 4 = 3`).
- **Header:** the audience switch (kit, `Simdeck.paperColumns.audience`). **Panel:** presets; sweets n, children d,
  the typical mistake (teacher only).

## Params

| key | default | range | meaning |
|---|---|---|---|
| `n` | 23 | 1 … min(100, 19 · d − 1) | sweets in the bowl: the dividend (djeljenik) |
| `d` | 4 | 2 … 10 | children: the divisor (djelitelj) |
| `mistake` | false | | show the typical mistake card (teacher only) |

Both numbers reset the demo to step 0. **Why 19 · d − 1:** a stepper has at most 20 steps and the demo has q + 2
(below), so q ≤ 18, so n ≤ 18 · d + (d − 1). That gives n ≤ 37, 56, 75, 94 for d = 2 … 5 and the whole range up to
100 for d ≥ 6 (script: the most steps over all 762 pairs is 20). 1 child is left out (the remainder is always 0, no
dealing to see); 0 sweets is left out (nothing to deal). A bad URL value is rounded and clamped, as the kit's ranges
do (`?d=2.6` is 3 children, so `?n=50&d=2.6` keeps 50); a value that is not a number is the minimum.

## Rules (model, `sim.js`)

1. **A round** gives every child one sweet: it takes d from the bowl. It is dealt **only when the bowl has at least d**
   (everyone gets one, or nobody does).
2. **Tie-break: exactly d left is enough** for one more round (it leaves 0). So 24 : 4 deals 6 rounds and leaves 0.
3. **Stop:** when the bowl has fewer than d, the next step is the round that fails: q = rounds dealt, r = what is
   left. Then r < d by rule 1. With n < d no round is dealt at all: q = 0, r = n (3 : 5 = 0, ostatak 3).
4. **The check** has two parts: `q · d + r = n` (the sweets given out and the ones left are all of them) and `r < d`
   (no further round was possible). An answer is right only when both hold.
5. **The typical mistake** (`mistakeOf`): stopping one round early, q − 1 and r + d. Its first part holds
   ((q − 1) · d + r + d = n), the second fails (r + d ≥ d); r + d − d = r is the round that was still possible. With
   q = 0 there is no earlier stop: the mistake is unavailable (null; the toggle is disabled with that reason).
   With r = 0 the wrong remainder equals d (24 : 4 = 5, ostatak 4): a remainder equal to the divisor is too big too.

**State** `{ phase, k, pile }`: `start` (k = 0, pile = n), `round` (k rounds dealt, pile = n − k · d), `short` (the
round that fails: k = q, pile = r), `check` (the same, with the check). **Steps** = q + 2: q rounds, the failed round,
the check. The step count follows the params (the kit's `steps(params)`); `sim.json` `steps` is the default's, 7.

## Presets (expected, from the script)

| # | id | n : d | q, r | steps | bowl after each round |
|---|---|---|---|---|---|
| 1 | `sweets` | 23 : 4 | 5, 3 | 7 | 23, 19, 15, 11, 7, 3 |
| 2 | `exact` | 24 : 4 | 6, 0 | 8 | 24, 20, 16, 12, 8, 4, 0 (tie-break, rule 2) |
| 3 | `fewer` | 3 : 5 | 0, 3 | 2 | 3 (no round: rule 3) |
| 4 | `largest` | 47 : 6 | 7, 5 | 9 | the largest remainder for 6 children is 5 = d − 1 |
| 5 | `too-big` | 31 : 4, mistake | 7, 3 | 9 | the card: 6, ostatak 7; 6 · 4 + 7 = 31 ✓, 7 < 4 ✗ |
| 6 | `hundred` | 100 : 7 | 14, 2 | 16 | 100, 93, …, 9, 2: numbers up to 100 (A.3.3) |

## Captions (three audiences, both languages, `strings.js`)

- **Teacher:** what happens and the numbers: the round, the bowl as a subtraction (`19 − 4 = 15`), the stop with the
  reason (`3 < 4`), the result and the check. With the mistake on, at the round that leaves r + d (one before the last)
  the caption points at it: someone stops here, but r + d ≥ d; at the end it says which part of the check fails.
- **Adult:** why: a round is a subtraction of d (division as repeated subtraction); after k rounds k · d are given
  out; the remainder is less than d because with d or more another round goes; the check puts the sweets back.
- **Child:** one short line: "Svatko dobije jedan. U zdjeli: 15." The child sees no names, no rounds line, no card,
  and the check box only at the last step (the check is part of A.3.3).

## Terms (hr / en)

djeljenik / dividend, djelitelj / divisor, količnik / quotient, ostatak / remainder, dijeljenje s ostatkom / division
with a remainder, provjera / check, krug (dijeljenja) / round *(check)*, bombon / sweet, zdjela / bowl. The written
form `23 : 4 = 5, ostatak 3` and the check `5 · 4 + 3 = 23` (količnik · djelitelj + ostatak) as in the sibling
`ari-checking` *(check: the textbook form, e.g. "5 i ostatak 3" or "5 (3)")*. Counting children uses the collective
numerals (dvoje, troje, četvero … desetero djece).

## Misconceptions targeted

- A remainder of d or more (stopped too early): the check's first part still holds, so only `r < d` catches it.
- Giving a round when there are fewer sweets than children (some child would get none): the failed-round step shows
  the empty slots.
- "No remainder" is not "nothing happened": 24 : 4 has remainder 0; 3 : 5 has quotient 0.

## Out of scope

Written division and long division (`ari-long-division`), division by 1 or by 0, numbers over 100, fractions of a
sweet (no fraction notation, §4.17), any base other than 10, random problems.
