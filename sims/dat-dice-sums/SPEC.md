<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dat-dice-sums: SPEC

Task `docs/tasks/w3/dat-dice-sums.md`, catalogue §4.17. One concept: **an event is certain, possible or impossible
(a sum of 1 or 13 with two dice is impossible); with two dice a sum of 7 can happen in 6 ways and 2 or 12 in one, so
7 comes up most often over many throws, though one throw can give anything; a game is fair when each player has as
many ways to win (odd or even sum: 18 and 18).**

Class **explorer** (no steps), four modes on one page:

- **throw** (Bacanje): throw two dice once, ten or a hundred times; a tally chart of the sums grows (Zbroj | Crtice |
  Puta | Načina), with the rows for 1 and 13 that stay empty; V shows how many ways each sum has.
- **pairs** (Parovi): the 36 pairs in a 6 × 6 grid (first die down, second die across, the sum in each cell), and the
  same 36 pairs sorted into columns by their sum (a staircase 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1); pick an event and its
  pairs light up; the page says whether it is certain, possible or impossible, and which sums are more or less likely.
- **race** (Utrka): the curriculum's race to 10 with twelve players numbered 1 to 12; then many races, and who won.
- **fair** (Igra): two players, Ana and Bruno; each sum belongs to one of them or means "throw again"; is the game
  fair? Count the ways, then play.

Every expected number below was computed with an independent Python script before coding (NOTES.md, Checks) and is
asserted in `sim.test.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - **MAT OŠ E.4.2** "Opisuje vjerojatnost događaja." Razrada: "U razgovoru iskazuje mogućnosti. Uspoređuje ishode
    riječima vjerojatniji, manje vjerojatan, najvjerojatniji. Navodi događaje koji su sigurni, mogući i nemogući."
    Sadržaj: "Opisivanje vjerojatnosti događaja." Preporuka: "Učenici moraju razumjeti razliku između sigurnoga
    ishoda, mogućega ishoda i nemogućega ishoda." Primjeri: "2. Igra: Par – nepar. Razgovor o tome je li igra
    pravedna. 3. Dvanaest učenika između sebe podijeli brojeve od 1 do 12. Redom bacaju 2 kockice i određuju njihov
    zbroj. Prikazani zbroj omogućuje učeniku koji ima taj broj na kartici da se pomakne za jedno mjesto na tablici u
    kojoj je početno stajalište na 0, a cilj je doći do broja 10. Problemska pitanja: Koji zbroj nije moguće dobiti
    bacanjem kockica? (0, 1 i brojevi koji su veći od 12) Koji su zbrojevi vjerojatniji? Koji su zbrojevi
    najvjerojatniji? Je li igra pravedna?" → the race (rule 7) with its four questions, the odd–even game (preset
    `parity`), and the words siguran, moguć, nemoguć, vjerojatniji, manje vjerojatan, najvjerojatniji, pravedna igra.
  - **MAT OŠ E.2.2** (grade 2, the way in): "Određuje je li neki događaj moguć ili nemoguć."
  - **MAT OŠ E.3.1 / E.4.1**: the tally and the chart (`dat-charts`, whose tally drawing this page copies).
  - Kept out (later grades): probability as a number or a fraction (E.8.1 "Računa vjerojatnost"), "1/6", percentages,
    the expected count. The page says "6 od 36 parova" in words, never 6/36.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `mode` | `throw`, `pairs`, `race`, `fair` | `throw` | the mode |
| `seed` | whole 0 … 999 999 | 0 | the throws (rule 2); the page replaces 0 with a seed from the clock unless `?seed=` is given |
| `n` | whole 0 … 1000 | 0 | (throw) how many throws are made |
| `ways` | boolean | false | show the ways (throw, race, fair); false is "ask first" |
| `ev` | `sum`, `even`, `odd`, `lt13` | `sum` | (pairs) the event |
| `k` | whole 0 … 14 | 7 | (pairs) the sum of the event `sum` |
| `rn` | whole 0 … 100 | 0 | (race) throws in the race shown |
| `rr` | whole 0 … 100 | 0 | (race) races played to the end, for the winners column |
| `o2` … `o12` | `a`, `b`, `n` | even `a`, odd `b` | (fair) who wins on that sum: Ana, Bruno, or nobody (throw again) |
| `fn` | whole 0 … 1000 | 0 | (fair) throws played |

## Rules

1. **Clean params.** Unknown choices fall back to the default; numbers are rounded and clamped to their range; a
   present non-number is the default. `rn` is clamped further to the throws the race needs to finish (rule 7).
2. **Throws.** A throw is two dice, a first and a second, each 1 … 6. The throws come from a seeded generator:
   `stream(seed, salt)` is mulberry32 (the kit's `Simdeck.rng`) started at (seed + salt · 0x9E3779B1) mod 2³²; each
   throw takes two draws, first die 1 + ⌊6 r⌋, then second die 1 + ⌊6 r⌋. Salts: 0 the throw mode, 1 the fair game,
   2 the race shown, 3 + j the j-th race of the winners column. The model also takes any generator with the same
   interface (`throwsFrom(gen, n)`), so tests can feed fixed throws. Seed 1, salt 0 starts (4, 1), (4, 6), (6, 2),
   (4, 5), (3, 6); seed 42: (4, 3), (6, 5), (2, 4), (2, 4), (6, 3); seed 1, salt 1: (2, 5), (6, 1), (4, 4).
3. **The 36 pairs.** The pairs are ordered (first die, second die): 6 · 6 = 36. The ways of a sum s are the pairs
   with that sum: 0 for s ≤ 1, s − 1 for 2 … 7, 13 − s for 7 … 12, 0 for s ≥ 13; so 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1 for
   2 … 12, 36 in all. (1, 6) and (6, 1) are two ways: the dice are two different dice. Counting them once gives 21
   pairs and only 3 ways for 7 (the typical mistake, rule 10).
4. **Events** (pairs). `sum` k: the pairs with sum k; `even`: an even sum (18 pairs); `odd`: an odd sum (18);
   `lt13`: a sum less than 13 (36). An event with 0 pairs is **impossible** (nemoguć: k = 0, 1, 13, 14), with all 36
   **certain** (siguran: `lt13`), otherwise **possible** (moguć). The event is shown by its pairs lit in the grid and
   in the columns, and "w od 36 parova" in words.
5. **More or less likely** (pairs, `sum` k with 2 ≤ k ≤ 12; tie-breaks first). Against every other possible sum j
   (2 … 12, j ≠ k): k is **more likely** (vjerojatniji) than j when ways(k) > ways(j), **less likely** (manje
   vjerojatan) when fewer, **as likely** (jednako vjerojatan) when equal: always 14 − k, its mirror, and nothing for 7.
   The **most likely** (najvjerojatniji) sum is the one with the most ways: 7 alone (6 ways). The least likely possible
   sums are 2 and 12 together (1 way each). k = 4: more likely than 2, 3, 11, 12; less likely than 5, 6, 7, 8, 9; as
   likely as 10. Lists are in increasing order. An impossible k has no comparison (it is impossible, not "unlikely").
6. **Throw mode.** The tally counts each sum among the first n throws of salt 0. The last throw (the n-th) is shown as
   two dice and "a + b = s"; with n = 0 there is none. The **most frequent** sums so far are every sum with the
   biggest count, in increasing order (a tie lists them all); none while n = 0. The rows for 1 and 13 are always 0
   and marked impossible. A count is drawn as tally marks (groups of five, `dat-charts` rule 3) while the biggest
   count is at most 40, else as a bar as long as count / biggest count with the number (`tally` false). Actions: +1,
   +10, +100 throws, taking n at most to 1000 (refused only at 1000: `limit`); "new throws" takes the next seed
   (seed mod 999 999 + 1) and n = 0. Expected (2000 seeds): 7 alone is the most frequent after 36 throws in 30 % of
   seeds, after 100 in 45 %, after 360 in 71 %, after 1000 in 89 %; so one throw, or a few, can give anything.
7. **The race** (salt 2). Twelve players hold the numbers 1 … 12 and all start at 0. Each throw moves the player whose
   number is the sum one place; the first to reach 10 wins and the race stops. A race always ends within 100 throws
   (11 sums that can move, 9 places each before 10, plus one). Throws after the finish are refused (`done`). Player 1
   never moves (a sum of 1 is impossible). Actions: +1 throw, +10 (stops at the finish), to the finish, a new race
   (next seed; `rn` and `rr` 0). Seed 1: player 6 wins after 56 throws; seed 7: player 6 after 52.
   **Many races** (`rr`): race j (salt 3 + j, j = 0 … rr − 1) is played to the finish and its winner counted; +10
   races at a time up to 100. Expected over 3000 races (seeds 1 … 3000, salt 2): 7 wins 1253 (about 4 in 10), 6 631
   and 8 609 (about 2 in 10 each), 5 200, 9 207, 4 43, 10 47, 3 6, 11 4; 2 and 12 never (possible, but very
   unlikely), 1 never (impossible). Length 20 … 75 throws, 48 on average. **The race is not fair**: the players do
   not have as many ways to move (1 has 0, 7 has 6).
8. **The fair game** (salt 1). Each sum 2 … 12 belongs to Ana (`a`), Bruno (`b`) or nobody (`n`: throw again). Ana's
   ways are the ways of her sums, Bruno's of his, the rest "again"; together 36. **Fair** when Ana and Bruno have as
   many ways and more than 0; **no game** when both have 0; otherwise **not fair**, for the one with more ways. The
   number of sums each holds is shown too: it does not decide (preset `unfair`: Ana 5 sums, Bruno 6, yet 24 : 12).
   Play: fn throws, each a win for Ana, for Bruno, or "again"; +1, +10, +100 up to 1000 (`limit`). Clicking a sum
   cycles its owner a → b → n → a, and the game's throws start again (fn 0): the old score was for another game. Presets: parity 18 : 18 fair; unfair 24 : 12; seven 6 : 6 fair (one sum against
   four); 2 … 6 against 8 … 12 with 7 again 15 : 15; 2 … 7 against 8 … 12 21 : 15; 6, 7, 8 against the rest 16 : 20.
9. **Ask first** (`ways` false). The ways column (throw, race) and Ana's and Bruno's ways with the verdict (fair) are
   "?" until V; the throws, the tally and the race stay. The pairs mode is the counting itself and always shows them.
10. **Typical mistakes** (teacher): every sum is as likely as any other (11 sums, so each the same: throw, pairs);
    (1, 6) and (6, 1) are one pair (pairs, `sum` with two different dice); a sum that came up often is "due" to stop,
    or one that has not come up is "due" next (throw, after a run); possible means likely (2 is possible but has 1
    way; 1 is impossible) and impossible means unlikely; more sums means more chance to win (fair, `unfair`); 7 always
    wins the race (race: other players win too, 6 or 8 about as often as each other).

## Presets

| Key | Id | Params | Expected |
|---|---|---|---|
| 1 | `throw` | throw, n 0, ways false | predict, then throw: the tally grows; 1 and 13 stay empty |
| 2 | `many` | throw, n 1000, ways true | 7 the most frequent in about 9 seeds of 10; the counts follow the ways 1 … 6 … 1 |
| 3 | `pairs7` | pairs, sum 7 | 6 of 36 pairs; the most likely sum |
| 4 | `never` | pairs, sum 1 | 0 pairs: impossible (so is 13); "less than 13" is certain |
| 5 | `race` | race, rn 0, rr 0, ways false | the race to 10; player 1 never moves; not fair |
| 6 | `parity` | fair, even Ana, odd Bruno, ways false | 18 : 18, fair |
| 7 | `unfair` | fair, Ana 5 … 9, Bruno 2, 3, 4, 10, 11, 12, ways false | 24 : 12, not fair, though Bruno has more sums |
| 8 | `seven` | fair, Ana 7, Bruno 2, 3, 11, 12, the rest again, ways false | 6 : 6, fair |

## Legend and captions

Legend: the first die (filled, darker pips) and the second die (outline, lighter fill) by colour and by fill; a lit
pair or row; "impossible" (hatched); Ana (A) and Bruno (B) by letter and colour. Captions in three voices: teacher (the
question first, the typical mistake highlighted), adult (a "why" sentence), child (one short sentence).

## Terms (both languages)

kockica / die (dice); bacanje / throw; zbroj / sum; par (brojeva) / pair; način / way; događaj / event; siguran,
moguć, nemoguć događaj / certain, possible, impossible event; vjerojatniji, manje vjerojatan, najvjerojatniji / more
likely, less likely, most likely; jednako vjerojatan / as likely *(check)*; paran, neparan / even, odd; pravedna igra /
fair game; crtice / tally marks *(check, as in dat-charts)*; utrka / race *(check)*.

## Misconceptions targeted

1. All sums are equally likely (presets `throw`, `many`, `pairs7`).
2. (1, 6) and (6, 1) are the same (preset `pairs7`; the two dice look different).
3. One throw, or a few, tells which sum is most likely (`throw`: the leader after a few throws is often not 7).
4. Possible and likely, impossible and unlikely, mixed up (`never`; sum 2 against sum 1).
5. More sums means more chance (`unfair`, `seven`).
6. The race is fair because everyone has a card (`race`: player 1 never moves).

## Out of scope

Probability as a number, fraction or percentage; the expected count of a sum; dice other than two six-sided ones;
three dice; the product or difference of the dice; the finger game of par–nepar (the page plays it with dice, as the
catalogue says); gambling language.
