<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dat-charts: SPEC

Task `docs/tasks/w3/dat-charts.md`, catalogue §4.17. One concept: **the same data can be a tally, a table (rows,
columns, cells), a pictogram (one picture can stand for 2 or 5, and then half a picture is a half of that) and a bar
chart with two axes; a change in the data changes every view; a chart answers questions like which is the most and
how many more.**

Class **explorer** (no steps). One data set is shown three ways at once, side by side: a **table** whose middle
column is the tally (Voće | Crtice | Broj učenika, the school layout of a tally table), a **pictogram** and a **bar
chart** with two named axes. Every change of the data (a ballot counted, + or − on a row) changes all three; a
selected row is lit in all three. The top of the stage asks a question about the data (which is the most, the least,
how many more, how many in all) and shows the answer on V.

Every expected number below was computed with an independent Python script before coding (NOTES.md, Checks) and is
asserted in `sim.test.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - **MAT OŠ E.3.1** "Služi se različitim prikazima podataka." Razrada: "Nabraja različite vrste prikaza podataka.
    Koristi se nazivima redak i stupac. Prikazuje podatke u tablicama i stupčastim dijagramima." Sadržaj:
    "Prikazivanje podataka (tablice, stupčasti dijagrami)." Preporuka: "Važno je učenicima osvijestiti pojmove:
    stupac, redak, polje. … potrebno je poticati učenike da ih prikazuju u tablicama i dijagramima, a također je
    važno poticati ih na čitanje podataka iz tablica i dijagrama. **Posebno se ističe piktogram i stupčasti
    dijagram.**" → the three views; the table's row, column and cell named on selection (rule 9).
  - **MAT OŠ E.4.1** "Provodi jednostavna istraživanja i analizira dobivene podatke." Razrada: "Prikuplja podatke,
    razvrstava ih i prikazuje neformalno i formalno. Čita podatke iz tablica i jednostavnih dijagrama." Preporuka:
    "U prikazivanjima stupčastim dijagramima poželjno je za koordinate početi rabiti **pojam osi** … (npr. količina
    snijega po danu u mjesecu siječnju: os dana u mjesecu i os visine snijega u centimetrima)." → the chart's two
    named axes in every data set, and the curriculum's own example as the preset `snow`.
  - **MAT OŠ E.2.1** (grade 2, the way in): "Razvrstava prikupljene podatke i prikazuje ih jednostavnim tablicama ili
    piktogramima"; its example "broj sunčanih/kišnih dana u nekome mjesecu" → the data set `weather`.
  - Kept out: drawing the table by hand ("Učenici ne crtaju tablice, nego dobivaju gotove tablice" is grade 2, but
    the page does not draw one either), running the survey (E.4.1's project part, catalogue §4.17), digital tools
    (E.3.1's "primjerena tehnologija"), fraction notation ("pola sličice", never ½), line charts, pie charts, the
    mean, probability (`dat-dice-sums`).

## Data sets

Each data set has its categories in table order, its starting counts, a picture for the pictogram, the names of
the two axes, and the questions that make sense for it. Counts are whole numbers 0 … 30.

| Id | Title (hr / en) | Categories | Counts | Picture | Axes (categories / numbers) | Kind |
|---|---|---|---|---|---|---|
| `fruit` | Omiljeno voće u 3. b / Favourite fruit in class 3b | jabuka, banana, jagoda, kruška | 6, 4, 8, 2 (from 20 ballots) | a pupil | voće / broj učenika | counted |
| `weather` | Vrijeme u studenome / The weather in November | sunčano, oblačno, kišno, maglovito | 8, 12, 7, 3 (30 days) | a calendar day | vrijeme / broj dana | counted |
| `books` | Posuđene knjige u tjednu / Books borrowed in a week | pon, uto, sri, čet, pet | 15, 25, 10, 30, 20 | a book | dani u tjednu / broj knjiga | counted |
| `snow` | Snijeg u siječnju / Snow in January | 1. … 7. siječnja | 2, 5, 8, 12, 10, 6, 4 cm | a snowflake | dani u siječnju / visina snijega (cm) | measured |

**Ballots** (`fruit` only): 20 ballots in this order, J = jabuka, B = banana, G = jagoda, K = kruška:
J B J G J K G B J G G B J G K G B J G G. After 9: 4, 2, 2, 1 (jabuka leads); after 11: 4, 2, 4, 1 (two lead);
after 20: 6, 4, 8, 2.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `ds` | `fruit`, `weather`, `books`, `snow` | `fruit` | the data set |
| `c0` … `c6` | whole 0 … 30 | the data set's counts | the count of each category (beyond the data set's categories: ignored) |
| `n` | whole 0 … 20 | 20 | (`fruit`) how many ballots are counted |
| `k` | 1, 2, 5, 10 | 1 | what one picture stands for |
| `q` | `none`, `most`, `least`, `more`, `total` | `none` | the question asked |
| `sel` | −1 … categories − 1 | −1 | the row lit in every view (−1: none) |
| `hide` | boolean | false | ask first |

## Rules

1. **Clean params.** Unknown choices fall back to the default; numbers are rounded and clamped (counts to 0 … 30,
   `n` to 0 … 20, `sel` to −1 … categories − 1, anything else −1). A missing count takes the data set's starting
   count; a present non-number is 0. `q` not offered by the data set (rule 7) is `none`.
2. **One data, three views.** The state holds the counts once; the table row, the tally, the pictogram row and the
   bar of a category are all computed from that one count, so a change shows in every view at once.
3. **Tally.** A count v is written as ⌊v / 5⌋ groups of five (four strokes and a fifth across them) and v mod 5 single
   strokes: 8 → 1 group and 3, 12 → 2 groups and 2, 0 → nothing. A **measured** data set (`snow`) has no tally: the
   heights were measured with a ruler, not counted (the column is left out and the page says why).
4. **Pictogram.** With one picture standing for k, a count v is ⌊v / k⌋ whole pictures and a rest r = v mod k:
   r = 0 → nothing more; 2 r = k → **half a picture** (`half`); otherwise a **part** of a picture that cannot be read
   exactly (`part`, drawn cut at r / k with a dashed outline). The pictogram is **exact** when no count has a part.
   Read back: whole · k, plus k / 2 for a half. weather k 2: 4, 6, 3 and a half, 1 and a half pictures (7 = 3 · 2 + 1);
   books k 10: 1 and a half, 2 and a half, 1, 3, 2.
5. **Which key fits** (tie-break: the asked key if it fits, else the smallest bigger key that fits, else the biggest
   that fits). A key **fits** when the biggest count needs at most 12 pictures (⌈max / k⌉ ≤ 12). books (max 30): 1
   and 2 do not fit (30 and 15 pictures), 5 and 10 do; asking for 1 or 2 gives 5. A key that fits but is not exact
   is kept, and the page names the exact keys that fit: weather k 5 → 8 = 1 picture and a part, exact with 1 or 2;
   fruit k 5 or 10 → not exact, exact with 1 or 2. When the data change so the key no longer fits (a count raised to
   13 with k 1), the key moves by the same rule.
6. **Bar chart.** The number axis runs from 0 to the smallest of 10, 20, 30 that is at least the biggest count, in
   steps of 1, 2 or 5: fruit (max 8) 0 … 10 by 1; weather and snow (12) 0 … 20 by 2; books (30) 0 … 30 by 5. A bar is
   as high as its count; the category axis names the categories in table order. Both axes are named (rule:
   E.4.1, "os").
7. **Questions** (in this order): `most` (which is the most), `least` (the least), `more` (how many more the most
   than the least), `total` (how many in all; counted data sets only: snow heights are not added up).
8. **Answers** (tie-breaks first):
   - With every count 0 there is no answer (`empty`).
   - `most`: every category with the biggest count, in table order (a tie lists them all); `least` the same with the
     smallest count. When all counts are equal, `most` and `least` are `all`.
   - `more`: the **first** biggest and the **first** smallest in table order, and the difference max − min; when all
     are equal the difference is 0 (`equal`).
   - `total`: the sum.
   - fruit: most jagoda 8, least kruška 2, more 8 − 2 = 6, total 20; after 11 ballots most jabuka and jagoda (4);
     weather: oblačno 12, maglovito 3, 9, 30; books: čet 30, sri 10, 20, 100; snow: 4. siječnja 12 cm, 1. siječnja
     2 cm, 10 cm.
9. **Selection** (`sel`). The selected category's table row (redak), its number cell (polje, in the column "broj"),
   its pictogram row and its bar are lit; the caption reads the same number from each view.
10. **Changing the data.** + and − on a row change its count by 1; refused at 30 and at 0 (`limit`; the params come
    back unchanged and the page says why). The key is re-cleaned (rule 5).
11. **Counting ballots** (`fruit`). Counting the next ballot adds 1 to its category and 1 to `n`; refused when all 20
    are counted (`done`) or the category is at 30 (`limit`). "Count all" counts the rest, one by one, and stops
    before a ballot whose category is at 30 (`limit`; nothing is dropped); "start again" sets every
    count and `n` to 0. Counting follows the ballots even after + or − (the counts are the data; `n` only says how
    far the pile has gone).
12. **Ask first** (`hide`). The answer is "?" until V; so are the numbers in the table, on the bars and beside the
    pictogram rows, so the class reads the tally, the pictures and the bars. The pictures, the bars and the tally
    stay.
13. **Typical mistakes** (teacher): counting the pictures instead of what they stand for (k > 1: "4 pictures, 8
    days"); reading half a picture as a whole one or leaving it out (a half present); "how many more" answered with
    the bigger number instead of the difference (`more`); a tally group of five read as four or six (a group
    present, when the answer is revealed); a row and a column mixed up (on selection: the row runs across, the
    column down); the bar chart's "stupac" (bar) and the table's "stupac" (column) are two meanings of one word
    (on selection; in English: the bars are not the table's columns).

## Presets

| Key | Id | Params | Expected |
|---|---|---|---|
| 1 | `vote` | fruit, all 0, n 0 | P twenty times: 6, 4, 8, 2; jabuka leads after 9, a tie after 11 |
| 2 | `most` | fruit, counted, q most, hide | jagoda, 8; V shows it |
| 3 | `key2` | weather, k 2 | 4, 6, 3 and a half, 1 and a half pictures; 7 = 3 · 2 + 1 |
| 4 | `key5` | books, k 5, q more, hide | čet 30 − sri 10 = 20; k 10 gives halves |
| 5 | `snow` | snow, k 1, q more | os dana, os visine (cm); 12 − 2 = 10 cm; no tally |
| 6 | `misfit` | weather, k 5 | not exact: 8 = 1 picture and a part; exact with 1 or 2 |

## Legend and captions

Legend: a bar (the count), a lit row (the same data in every view), half a picture, a cut picture (not exact).
Captions in three voices: teacher (the question first, the typical mistake highlighted), adult (a "why" sentence),
child (one short sentence).

## Terms (both languages)

podatci / data; tablica / table; redak / row; stupac / column; polje / cell; crtice, zapis crticama / tally (tally
marks) *(check)*; piktogram / pictogram; sličica / picture *(check)*; "jedna sličica znači" / "one picture stands
for" (the key) *(check)*; stupčasti dijagram / bar chart; stupac (dijagrama) / bar; os / axis; najviše, najmanje /
the most, the least; koliko više / how many more; ukupno / in all (total).

## Misconceptions targeted

1. The pictures are the number (rule 13, presets `key2`, `key5`).
2. Half a picture is a whole one, or nothing (presets `key2`, `key5` with k 10).
3. "How many more" is the bigger number (rule 8, presets `key5`, `snow`).
4. A chart with a cut picture can be read exactly (rule 5, preset `misfit`).
5. Row and column mixed up (rule 9).
6. The views are different data (rule 2: one count, three views).

## Out of scope

Running a survey, drawing a table by hand, line and pie charts, horizontal bar charts, the mean, fraction notation,
probability (`dat-dice-sums`), counts over 30, more than seven categories, typing in new categories.
