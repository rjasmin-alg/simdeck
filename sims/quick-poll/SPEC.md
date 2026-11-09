<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# quick-poll: specification

Task `docs/tasks/w3/quick-poll.md` ("Model and presets"), catalogue `tool-quick-poll` (§4.11). One concept:
**students answer A–D from phones, results on the projector**: ask, collect, reveal. A `tool` (lecturer-only):
no steps. The model is `sim.js`, the tests `sim.test.js` (rule numbers below are the test names).

**Transport is not chosen** (docs/tasks/OPEN.md: shared state, a local server, or typed counts). This page builds the
pure model and the two layouts. Votes arrive from the phone mock-up on the same screen and from a simulated class;
the model is the same whatever transport later carries a phone's answer.

## State

```
{ pollId, kind: 'abcd'|'yesno'|'confidence', question, texts: {A: '', …}, options: ['A', …],
  correct: 'A'…|null, phase: 'open'|'closed'|'revealed', votes: { [voterId]: { option, at } } }
```

A ballot from the transport is `{ pollId, voter, option, at }`. `at` is the transport's arrival number or time; it
is stored and never read by a rule. *(deviation: the task's `vote(state, voterId, option)` takes the ballot, so a late
answer to the previous question can be recognised by its `pollId`.)*

Kinds (presets): `abcd` A–D, `yesno` A–B, `confidence` A–D (A sure … D guessing). The option texts of `yesno` and
`confidence` are page strings shown when the lecturer typed none.

## Rules

1. **One vote per voter per poll; a later vote replaces the earlier while open** (task rule 1). Same option again:
   `same`, nothing changes. Another option: `changed`, the count moves from the old letter to the new one, the total
   stays.
2. **Votes after close are rejected** (task rule 2): in `closed` and `revealed` the ballot is refused with `closed`
   and the phone says so.
3. **Results stay hidden until reveal** (task rule 3): before `revealed`, the projector view has the total only:
   no counts, no percentages, no bar lengths, no correct mark. `reveal` of an open poll also closes it.
   A revealed poll cannot be reopened (`open` changes nothing); a new question is `reset`.
   A closed poll can be reopened (`open`): latecomers, before anything was shown.
4. **Voter ids are random per browser, never names** (task rule 4): `^[a-z0-9]{8,32}$`; anything else (a name with
   a capital or a space, a short id, not a string) is refused with `invalid-voter`. The page makes the phone's id from
   `crypto.getRandomValues` and keeps it in that browser's `localStorage`; the practice class gets counter ids
   (`sim<poll>v<n>`), and the seeded `Simdeck.rng` picks their letters. Nothing else about a voter is stored.
5. **Percentages: whole numbers, largest remainder, ties shown as ties** (task rule 5). Floors first; options with
   the same count form a group; groups take the leftover points in order of remainder (largest first; equal
   remainder: the larger count first), one point per member, until the next group does not fit in the points left.
   The sum is 100 except when a tie cannot be split evenly; then the stage says so. No votes: every option 0 %.
6. **Ballot checks in a fixed order** (tie-break when several apply): `invalid-voter`, `stale` (another `pollId`),
   `closed`, `invalid-option` (a letter this poll does not have, e.g. C in yes/no), then `same` / `changed` /
   `recorded`. A rejected ballot returns the state object itself.
7. **New poll** (`reset`): `pollId + 1`, no votes, `open`; kind, option texts and correct answer stay (they are the
   lecturer's settings). Changing the **kind** is a new poll too (the letters change, the votes cannot carry over).
8. **Correct answer**: none or one of the poll's letters; a letter the poll lacks (C in yes/no) and any letter in
   `confidence` (a self-assessment) give none. Shown only after reveal: ✓ and a thick outline on that bar. It is part
   of the poll, not a kit param: the kit shows params in the panel and writes them into the URL, where the room would
   read it before reveal; the page sets it from a select in the collapsed "Točan odgovor i tekst pitanja" section.
9. **Lecturer text**: question cut to 140 characters, option texts to 60 (characters, so an emoji is never split),
   whitespace collapsed; votes are kept. A kind change keeps the question; option texts start empty.
10. **Join code**: four characters from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (no 0/O, 1/I/L), the integer in base 31,
    wrapping at 31⁴ = 923 521. The page draws the integer once per browser session.

## Expected numbers (checked with node before the tests, `percents`)

| counts | exact % | shown % | sum | why |
|---|---|---|---|---|
| 1, 2, 3, 4 | 10, 20, 30, 40 | 10, 20, 30, 40 | 100 | exact |
| 10, 6, 4, 3 | 43.48, 26.09, 17.39, 13.04 | 44, 26, 17, 13 | 100 | one leftover point to the largest remainder (.48) |
| 2, 2, 1 | 40, 40, 20 | 40, 40, 20 | 100 | exact tie |
| 3, 3, 1 | 42.86, 42.86, 14.29 | 43, 43, 14 | 100 | the tied pair takes both leftover points |
| 1, 1, 1 | 33.33 ×3 | 33, 33, 33 | 99 | a three-way tie cannot share one point |
| 2, 2, 2, 1 | 28.57 ×3, 14.29 | 28, 28, 28, 14 | 98 | the tie group (3) does not fit in 2 points; the smaller remainder after it waits too |
| 1, 1, 4 | 16.67, 16.67, 66.67 | 16, 16, 67 | 99 | equal remainders: the larger count first; the tied pair does not fit in the 1 left |
| 7, 7, 7, 2 | 30.43 ×3, 8.70 | 30, 30, 30, 9 | 99 | 8.70 has the largest remainder; the tie of three does not fit in 1 |
| 1, 1 (yes/no) | 50, 50 | 50, 50 | 100 | |
| 2, 1 (yes/no) | 66.67, 33.33 | 67, 33 | 100 | |
| 0, 0, 0, 0 | — | 0, 0, 0, 0 | 0 | no votes |

Caption (task): hr „Odgovora: 23. Rezultati su skriveni dok ih ne otkrijete.“, en "Answers: 23. Results stay hidden
until you reveal them."

## Page

- **Views** (param `view`): *both* (the projector with a phone beside it, default), *projector*, *phone* (the phone
  alone, large, to show students what they will see).
- **Projector**: the question (or "the question is on the slide"), A–D in large letters with their texts, the join
  code, the live count; after reveal a bar per option with count and percentage, letters on the bars, the most
  chosen bar marked ▲, the correct one ✓ with a thick outline.
- **Phone**: four big buttons (two for yes/no); after a vote "Odgovor zabilježen: B"; a change "Odgovor promijenjen:
  C"; closed: the buttons are `aria-disabled` and it says the poll is closed.
- **Lecturer controls** (transport bar): close / reopen (`O`), reveal (`V`), new question (`N`); Space does the next
  of close → reveal. Simulated class: +5 answers (`D`), only while open.
- **Out of scope** (task): accounts, grading, free-text answers, storing results after the lecture.
