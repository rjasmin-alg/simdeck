<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-big-numbers: specification

One concept: **counting on past 9 999 or 99 999 turns every 9 back to 0 and carries once, like a counter; the
place-value table groups the digits in classes of three, which is how a number is read aloud (345 678: tristo
četrdeset pet tisuća šesto sedamdeset osam); two numbers are compared from the left, and the first place that differs
decides.** Task: `docs/tasks/w3/ari-big-numbers.md`; catalogue §4.17 (MAT OŠ A.3.1, A.4.1). Every expected number
below was computed with a small Python script independent of `sim.js` before coding (NOTES.md, Checks) and is
asserted in `sim.test.js`.

## Source: the curriculum (Narodne novine 7/2019), read 2026-11-14

- **MAT OŠ A.3.1** "Služi se prirodnim brojevima do 10 000 …": "Broji, čita, zapisuje (brojkom i brojevnom riječi) i
  uspoređuje brojeve do 10 000." "Koristi se tablicom mjesnih vrijednosti." "Broji po redu od zadanoga broja te
  brojeve do 10 000 uspoređuje i prikazuje u tablici mjesnih vrijednosti." Preporuka: "Postupak uspoređivanja
  brojeva do 10 000 skratiti određivanjem vrijednosti tisućica (potom stotica, desetica, odnosno jedinica)." and
  "Pri uspoređivanju brojeva potrebno je ići induktivnim putem …" (the pupils find the rule from examples).
- **MAT OŠ A.4.1** "Služi se prirodnim brojevima do milijun.": "Broji, čita, piše i uspoređuje brojeve do milijun."
  "Navodi dekadske jedinice i opisuje njihove odnose." Preporuka: "U upoznavanju brojeva preporučuje se uporaba
  kartica s dekadskim jedinicama i tablice mjesnih vrijednosti. **Posebnu pozornost posvetiti brojenju pri prijelazu
  desettisućice i stotisućice.**"
- So: counting from a given number ("od zadanoga broja") on and back, with the crossings of 10 000 and 100 000 as
  the default and the first presets; comparing from the highest place down, one place at a time (the curriculum's
  thousands, then hundreds, tens, ones); numbers to a million; reading and writing in words. No example numbers are
  given; 345 678 is the catalogue's.

## Three modes, one stepper

The param `mode` picks one of three short demos; each is the same idea seen from one side (the place-value table of
classes of three). Every mode draws the **place-value table** (kit view K5, seven places M ST DT T S D J) and the
**number line that zooms** under it (two tiers: 0 … 1 000 000 on top with a window, the zoomed stretch below).

### Count (`count`): counting over the edge

- The table is the school's written addition (or subtraction) of one count: a carry row, the number before, `+ 1`
  (or `− 1`, `+ 1000` …) with its sign, the rule, the new number. The digits written in this step have the changed
  mark; the carries of this step are in the carry row.
- On top, the numbers counted so far in a row (`99 997, 99 998, 99 999, 100 000`), the current one marked, and the
  current number in words.
- The number line: the stretch of the whole demo with a tick for every count (step `by`), the counts as dots, the
  current one big, each count so far a jump (an arc with `+1`); a tick that is a multiple of 10 · `by` is long (the
  "round" numbers).

### Read (`read`): classes of three, read aloud

- The table holds the digits of the number. From step 1 thick lines split it into classes of three **from the right**
  (the ones), each class named under it (jedinice, tisuće, milijuni), and the number on top is written with a space
  between classes (`345 678`).
- Each class is then read like a number from 1 to 999, followed by its name: the class being read has the band, and
  its words appear under it. A class of three zeros is not read. The whole number in words is the last step.
- The number line: the whole line while classes are found; reading the thousands puts a point at 345 000 (the line
  0 … 1 000 000); reading the ones zooms to 345 000 … 346 000 and puts it at 345 678.

### Compare (`compare`): the first place that differs decides

- The table holds both numbers by place (ones under ones). Under them a row of marks: `=` under every place compared
  and found equal, `<` or `>` under the place that decides. The place compared in this step has the band.
- On top: `345 678 ? 345 687`, at the end `345 678 < 345 687`.
- The number line zooms with the places: comparing place k it shows the stretch of length 10ᵏ⁺¹ that holds both
  numbers (they agree above k), with ticks every 10ᵏ: 0 … 1 000 000 for the hundred thousands, 300 000 … 400 000 for
  the ten thousands, … 345 600 … 345 700 for the tens, where the two numbers fall into different tenths.

## Params

| key | default | range | meaning |
|---|---|---|---|
| `mode` | `count` | `count read compare` | the demo |
| `n` | 99 997 | 0 … 1 000 000 | count: the start; read: the number; compare: the first number |
| `m` | 345 687 | 0 … 1 000 000 | compare: the second number |
| `e` | 0 | 0 … 5 | count: the step is `by` = 10ᵉ (1, 10, 100, 1000, 10 000, 100 000) |
| `dir` | `on` | `on back` | count: on (+) or back (−) |
| `count` | 5 | 1 … 10 | count: how many counts |
| `mistake` | false | toggle | the mode's typical mistake card (teacher) |

All but `mistake` reset the demo to step 0. A bad URL value is rounded and clamped (a value that is not a number is
the default); an unknown `mode` is `count`, an unknown `dir` is `on`.

## Rules (model, `sim.js`)

### Count

1. **A count** adds `by` = 10ᵉ (on) or takes it away (back). Places below e do not change.
2. **On: every 9 turns to 0 and carries once.** From place e up, each digit 9 becomes 0 and passes one 1 to the place
   on its left; the first digit that is not 9 grows by 1 (an empty place counts as 0 and becomes 1). The 9s that
   rolled are `rolled` (places, ones first), the place that grew is `grew`; each place gets at most one carry, so the
   carries are exactly the places e + 1 … `grew`. 99 999 + 1: rolled 0 1 2 3 4, grew 5, five carries, 100 000.
3. **Back: every 0 turns to 9 and borrows once.** From place e up, each 0 becomes 9 and borrows one from the place on
   its left; the first digit that is not 0 shrinks by 1. A highest digit that becomes 0 is not written (10 000 − 1 =
   9 999 has four places). 100 000 − 1000: rolled 3 4, grew 5, 99 000.
4. **The range is 0 … 1 000 000 (tie-break: both ends are reached).** The counts that fit are min(`count`,
   ⌊(1 000 000 − n) / by⌋) on, min(`count`, ⌊n / by⌋) back. When fewer fit than asked, one more step says where the
   range ends (`end`). 999 997 + 1 four times: 999 998, 999 999, 1 000 000, end (4 steps). 0 − 1: only the end step.
5. **Steps:** step 0 shows the start; step i the i-th count; then the end step when rule 4 cut the demo. So 1 … 10
   steps (the end step comes only when fewer than `count` fit, so at most `count` ≤ 10).

### Read

6. **Classes from the right.** The digits are grouped in threes starting at the ones: class 0 (jedinice: S D J),
   class 1 (tisuće: ST DT T), class 2 (milijuni: M). Only the highest class may have fewer than three digits. 345 678:
   345 | 678; 30 005: 30 | 005; 1 000 000: 1 | 000 | 000.
7. **A class is read as a number from 1 to 999, then its name**; the ones class has no name. A class 000 is not read
   (300 005: tristo tisuća pet; 7000: sedam tisuća); zeros at the front of a class are not read (005: pet). 0 alone is
   read nula / zero (tie-break: the only zero that is read).
8. **Words (tokens, `wordsOf(n, lang)`).** Croatian: sto, dvjesto … devetsto; the tens and the ones as separate words
   (četrdeset pet); 10–19 one word; in the thousands class 1 and 2 are feminine (jedna, dvije: dvadeset jedna tisuća,
   dvadeset dvije tisuće); the class name follows the number's plural form (1 / 2–4 / 5+, 11–14 the third): tisuća,
   tisuće, tisuća; a thousands class of exactly 1 is the one word tisuću (1000, 1021: tisuću dvadeset jedan); 1 000 000
   is milijun. English (British school usage): "and" after hundred when tens or ones follow, and before a ones class
   under 100 that follows a higher class (thirty thousand and five); tens and ones joined by a hyphen (forty-five);
   1000 is one thousand, 1 000 000 one million. Checked: 345 678 tristo četrdeset pet tisuća šesto sedamdeset osam /
   three hundred and forty-five thousand six hundred and seventy-eight; 99 999 devedeset devet tisuća devetsto
   devedeset devet; 101 000 sto jedna tisuća; 112 000 sto dvanaest tisuća; 2000 dvije tisuće; 11 000 jedanaest tisuća.
9. **Steps:** step 0 the digits; step 1 the classes; one step per class, the highest first; the last step the whole
   number in words. So classes + 2 steps: 345 678 has 4, 7 has 3, 1 000 000 has 5.

### Compare

10. **By place, ones under ones.** A place where a number has no digit counts as 0.
11. **From the highest place down**, one place per step, starting at the highest place of the larger of the two
    numerals.
12. **The first place that differs decides**: the number with the larger digit there is larger; the places to its
    right are not compared. 345 678 vs 345 687: places ST DT T S equal, D decides (7 < 8).
13. **Tie-break: equal numbers** are compared down to the ones and are equal (`=`). **More digits**: the longer
    number's highest digit (never 0) meets an empty place, so it decides at the first step (9 876 < 12 345 at DT).
14. **Steps:** step 0 the question, one step per place compared, then one step writing the sign. 345 678 vs 345 687:
    6 steps; 9 876 vs 12 345: 2; 12 345 vs 12 345: 6; 0 vs 0: 2. At most 8.

**State** `{ phase, i, k }`: count `start` / `count` (i counts done) / `end`; read `digits` / `classes` / `class`
(k the class) / `words`; compare `start` / `place` (k the place) / `verdict`. The states are a plan computed from the
params, so replay is exact. `sim.json` `steps` is the default demo's, 5.

### The number line (`lineOf(p, state)`)

15. **Count:** the stretch from the smallest to the largest number of the whole demo, one `by` wider on each side
    where that stays in 0 … 1 000 000 (otherwise not widened on that side); ticks every `by` from its start, so every
    tick is a count (n + j · by). 99 997 … 100 002 by 1: 99 996 … 100 003; 99 997 by 1000: 98 997 … 105 997; 15 back
    by 10: 5 … 25. It does not move during the demo.
16. **Read:** steps 0–1 and the classes above the thousands: 0 … 1 000 000, the point at the number. Reading class c:
    the stretch of length 1000ᶜ⁺¹ (at most a million) that holds the number, the point at the part read so far
    (⌊n / 1000ᶜ⌋ · 1000ᶜ); reading the ones class and the words step: the stretch of 1000 (345 000 … 346 000), the
    point at the number. A stretch that would end past a million slides left (1 000 000: 999 000 … 1 000 000).
17. **Compare:** comparing place k (and the verdict at the deciding place, or the ones when equal): the stretch of
    length 10ᵏ⁺¹ that holds the first number (both, above k), ticks every 10ᵏ; 10ᵏ⁺¹ over a million is the whole
    line 0 … 1 000 000; a stretch past a million slides left. Step 0 shows the stretch of the first place compared.
    345 678 vs 345 687: 0 … 1 000 000, 300 000 … 400 000, 340 000 … 350 000, 345 000 … 346 000, 345 600 … 345 700.

## Typical mistakes (teacher, `mistake` on; `mistakeOf`)

| mode | the mistake | applies | example |
|---|---|---|---|
| count, on | **the 10 written in the square**: at the first count with a carry, 9 + 1 = 10 is written in the place instead of 0 with a carry | a count of the demo carries | 9 999 + 1 → 99 910 (right 10 000); 99 999 + 1 → 999 910 |
| count, back | **the borrow is lost**: at the first count with a borrow, the 0s turn to 9 but the place on the left does not lose its 1 ("400, 499") | a count of the demo borrows | 100 000 − 1000 → 199 000 (right 99 000); 10 000 − 1 → 19 999 |
| read | **classes from the left**: the digits grouped in threes from the left, so the number read is another one | 4 or 5 digits | 30 005 read as 300 \| 05: tristo tisuća pet (that is 300 005); 34 567 as 345 \| 67 (345 067) |
| compare | **aligned at the left**: the first digits compared whatever their places | the digit counts differ and the left-aligned verdict is wrong | 9 876 > 12 345 "because 9 > 1"; 12 345 < 2000 |

When the mistake does not apply the card says why and names the preset that shows it.

## Presets (expected, from the script)

| # | id | demo | values / outcome | steps |
|---|---|---|---|---|
| 1 | `over-9999` | count on by 1 from 9 997, 5 | 9 998, 9 999, **10 000** (rolled 0–3, grew 4), 10 001, 10 002 | 5 |
| 2 | `over-99999` (default) | count on by 1 from 99 997, 5 | 99 998, 99 999, **100 000** (rolled 0–4, grew 5), 100 001, 100 002 | 5 |
| 3 | `back-thousands` | count back by 1000 from 102 000, 5, mistake | 101 000, 100 000, **99 000** (rolled 3–4, grew 5), 98 000, 97 000; card 199 000 | 5 |
| 4 | `million` | count on by 1 from 999 997, 4 | 999 998, 999 999, **1 000 000** (six carries), end | 4 |
| 5 | `read` | read 345 678 | 345 \| 678; tristo četrdeset pet tisuća šesto sedamdeset osam | 4 |
| 6 | `read-zeros` | read 30 005, mistake | 30 \| 005; trideset tisuća pet; card 300 \| 05 tristo tisuća pet | 4 |
| 7 | `compare` | 345 678 ? 345 687 | ST DT T S equal, D 7 < 8: 345 678 < 345 687 | 6 |
| 8 | `compare-length` | 9 876 ? 12 345, mistake | DT: empty (0) < 1: 9 876 < 12 345; card 9 876 > 12 345 | 2 |

Edge cases (script): 10 000 − 1 = 9 999 (rolled 0–3, grew 4; four places); 4 099 + 1 = 4 100 (rolled 0–1, grew 2);
999 999 + 1 = 1 000 000 (one step); 0 back: one end step; 12 395 ? 12 402 decides at S (3 < 4), 4 steps; 1 000 000 ?
999 999 decides at M, 2 steps; 5 ? 0 decides at J; 1234 grouped from the left 123 | 4 (123 004).

## Captions (three audiences, both languages, `strings.js`)

- **Teacher:** the numbers and the rule: "99 999 + 1: pet devetki postaje 0, svaka prenosi 1 ulijevo; ST dobiva 1:
  100 000." "Razred tisuća: 345 → tristo četrdeset pet tisuća." "D: 7 < 8, odlučeno: 345 678 < 345 687."
- **Adult:** why: ten units of a place are one unit of the next, so a full place (9 + 1) empties and passes one on;
  a thousand thousands is a million, so each class counts its own units from 1 to 999; one unit of a higher place is
  more than everything below it together (10 000 > 9 999), so the lower places cannot change the verdict.
- **Child:** one short line: "Devetke postaju nule. Sto tisuća!" "Čitam tisuće: tristo četrdeset pet tisuća."
  "Desetice: 7 je manje od 8."

## Terms (hr / en)

tablica mjesnih vrijednosti / place-value table (curriculum); razred jedinica, razred tisuća, razred milijuna /
the ones, thousands and millions class *(check: "razred tisuća" vs "razred tisućica")*; dekadske jedinice / place
values (curriculum); desettisućica, stotisućica / ten thousand, hundred thousand (curriculum); prijelaz / crossing;
prijenos / carry; posuđivanje / borrowing; uspoređivanje / comparing; veći, manji, jednak / greater, less, equal;
brojevna riječ / number word (curriculum "brojkom i brojevnom riječi"); brojevna crta / number line.

## Misconceptions targeted

- "After 9 999 comes 99 910": the 10 does not fit one square; it is 0 and one carried.
- Counting back over a round number: "100 000, 199 999": the borrow.
- Grouping digits from the left (30 005 read as tristo tisuća pet).
- Comparing first digits regardless of place (9 876 > 12 345).
- Reading a class of zeros, or the zeros in front of a class.

## Out of scope

Numbers over a million and negative numbers; other bases (the row does not say "any base"); rounding (not in this
row); written addition and subtraction of arbitrary numbers (`ari-column-addition`, `ari-column-subtraction`);
Roman numerals; writing a number from its words (the reverse of reading: the mistake card shows its pitfall only).
