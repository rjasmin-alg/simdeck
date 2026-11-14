<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-units: SPEC

Task `docs/tasks/w3/geo-units.md`, catalogue §4.17. One concept: **a unit is an agreed amount and measuring counts
how many fit; 1 cm = 10 mm, 1 dm = 10 cm, 1 m = 10 dm, 1 km = 1000 m; 1 dag = 10 g, 1 kg = 100 dag, 1 t = 1000 kg;
1 l = 10 dl; a smaller unit gives a bigger number for the same length; converting moves the digits in a table of
units (3 m 4 dm = 34 dm).**

Class **explorer** (no steps). Three modes, one idea (how many of an agreed amount fit):

- `ruler` (Duljina / Length): six things laid from the same 0 above a ruler that zooms from 1.2 km down to 12 mm;
  the chosen thing is measured in the chosen unit by laying that unit along it and counting.
- `balance` (Masa / Mass): a two-pan balance; a thing on the left, weights (or a second thing) on the right; the
  pans level when the masses are equal, and then the weights say the thing's mass.
- `table` (Tablica jedinica / Unit table): a number in one unit written into the table of units, then read in
  another unit: the digits stay in their columns, the reading stops at the new unit's column, zeros fill the empty
  columns, and what lies right of it keeps its own units.

Every expected number below was computed with an independent Python script before coding (NOTES.md, Checks) and is
asserted in `sim.test.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - Domain D: "Mjerenje je uspoređivanje neke veličine s istovrsnom veličinom koja je dogovorena jedinica mjere." →
    the concept's first sentence; measuring is counting how many units fit.
  - **MAT OŠ D.3.1** "Procjenjuje, mjeri i crta dužine zadane duljine." Razrada: "Poznaje jedinične dužine za
    mjerenje dužine i njihov međusobni odnos u skupu brojeva do 1000 (kilometar, metar, decimetar, centimetar,
    milimetar). … Zapisuje duljinu dužine mjernim brojem i znakom mjerne jedinice. … Procjenjuje duljinu dužine
    (milimetar, centimetar, decimetar) i udaljenosti (metar, kilometar) odabirući optimalnu mjernu jedinicu. Računa s
    jedinicama za mjerenje dužine (u skupu brojeva do 1000)." Prošireni sadržaj: "Preračunavanje mjernih jedinica."
    Preporuka: "razlikovati pojam dužine i duljine … Jako je bitno osvijestiti veličinu tih standardnih jedinica …
    povezati na primjer duljinu raširenoga palca i kažiprsta s decimetrom, minimalno mogući razmak palca i kažiprsta
    s milimetrom … Kilometar im se može približiti nekim primjerom iz neposredne okoline. … poticati na
    procjenjivanje." → mode `ruler` (the thing `fingers` is the curriculum's decimetre; `path` its kilometre from the
    neighbourhood), the best unit (rule 4), ask first (rule 12), the table for length (the extended content).
  - **MAT OŠ D.3.2** "Procjenjuje i mjeri masu tijela." Razrada: "Uočava masu kao svojstvo tijela. Uspoređuje mase
    tijela. Imenuje jedinice za mjerenje mase (gram, dekagram, kilogram, tona). Upoznaje različite vage i postupak
    vaganja. … Iskazuje odnose mjernih jedinica za masu." Preporuka: "na konkretima se uočavaju i uspoređuju nejednake
    mase (spoznati da (ne)jednake veličine predmeta ne moraju istim omjerom pratiti i masu). Nakon toga se imenuju
    mjerne jedinice za masu i razlikuju njihove vrijednosti …, **no neće se preračunavati**. Učenici iskazuju odnose
    mjernih jedinica povezujući ih s tijelima jedinične mase." → mode `balance`: comparing (preset `big-light`), the
    relations shown with weights (`kg-dag`: 1 kg balances 100 dag) and with things of a unit's mass; **mass is not in
    the table** (no converting in grade 3, and grade 4 has no mass outcome).
  - **MAT OŠ D.4.1** "Procjenjuje i mjeri volumen tekućine." Razrada: "… Imenuje jedinice za mjerenje volumena
    tekućine (litra, decilitar). Računa s mjernim jedinicama za volumen tekućine. Preračunava mjerne jedinice." → the
    table for volume (l, dl). Pouring and the level of a liquid are `geo-liquid-volume`'s, not built here. "Mjerna
    jedinica litra ima dva znaka: L i l": the page writes l.
  - Kept out (later grades or other pages): decimals and fractions (3,4 m), area units, money and time, reading a
    digital scale (D.3.2's practice part, catalogue §4.17), converting mass, drawing a segment of a given length.

## Units

| Family | Units, smallest first, with their size in the smallest unit |
|---|---|
| length | mm 1, cm 10, dm 100, m 1000, km 1 000 000 |
| mass | g 1, dag 10, kg 1000, t 1 000 000 |
| volume | dl 1, l 10 |

The relations of neighbours: 1 cm = 10 mm, 1 dm = 10 cm, 1 m = 10 dm, 1 km = 1000 m; 1 dag = 10 g, 1 kg = 100 dag,
1 t = 1000 kg; 1 l = 10 dl. All amounts are whole numbers of the family's smallest unit (no decimals).

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `mode` | `ruler`, `balance`, `table` | `ruler` | what is shown |
| `thing` | `ant`, `fingers`, `pencil`, `desk`, `board`, `path` | `pencil` | (ruler) the thing measured |
| `unit` | `mm`, `cm`, `dm`, `m`, `km` | `cm` | (ruler) the unit laid along it |
| `zoom` | whole 0…40 | 10 (the pencil's fit) | (ruler) the view is 12 · 10^(zoom/8) mm wide, from 0; a bigger zoom is a wider view, so + (zoom in) lowers it by 4 and − raises it by 4 |
| `item` | `clip`, `chocolate`, `apple`, `pillow`, `stone`, `flour`, `bag`, `kg1`, `dag1` | `apple` | (balance) on the left pan |
| `vs` | `none` or an item | `none` | (balance) a second thing on the right pan instead of weights |
| `w` | list of weights in g | `[]` | (balance) the weights on the right pan; in the URL as `w=` |
| `qty` | `length`, `volume` | `length` | (table) which family |
| `n` | whole 1…1000 | 34 | (table) the number written |
| `from` | a unit of the family | `dm` | (table) its unit |
| `to` | a unit of the family | `m` | (table) the unit it is read in |
| `hide` | boolean | false | ask first: the measured number is hidden |

The things (ruler, in mm): `ant` 5 (a mrav), `fingers` 100 (spread thumb and forefinger, the curriculum's
decimetre), `pencil` 140, `desk` 1200, `board` 3400 (the task's 3 m 4 dm), `path` 1 000 000 (the way to school,
the curriculum's kilometre from the neighbourhood). The items (balance, in g): `clip` 1 (a paper clip), `chocolate`
100, `apple` 150, `pillow` 300 (big), `stone` 800 (small), `flour` 1000 (a bag of flour), `bag` 2350 (a school bag),
`kg1` 1000 (a 1 kg weight), `dag1` 10 (a 1 dag weight). The weights: 1 g, 2 g, 5 g, 1 dag, 2 dag, 5 dag, 10 dag,
20 dag, 50 dag, 1 kg, 2 kg, 5 kg (1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000 g).

## Rules

1. **Clean params.** Unknown choices fall back to the default; numbers are rounded and clamped. A `from` or `to` that
   is not a unit of `qty`'s family becomes the family's default (length: `dm` and `m`; volume: `l` and `dl`).
   `w` keeps only listed weights, at most 30 of them (a 31st is refused, rule 9); anything else is dropped.
   `vs` equal to `item` is allowed (two of the same: level).
2. **Measuring counts how many fit** (ruler). The thing of length L measured in unit u (size f): `count` = ⌊L / f⌋
   whole units, `rest` = L − count · f; `exact` when rest = 0. Pencil (140 mm): mm 140, cm 14, dm 1 rest 40 mm, m 0
   rest 140, km 0 rest 140.
3. **The reading** writes L with the measuring number and the unit sign: the count in u, then the rest in the
   smaller units, largest first, zeros left out ("1 dm 4 cm"). When the count is 0 the unit is longer than the thing
   (`less`): the reading is the rest alone, and the page says the unit does not fit once. Pencil: mm "140 mm",
   cm "14 cm", dm "1 dm 4 cm", m and km "1 dm 4 cm" with `less`. Board (3400): dm "34 dm", m "3 m 4 dm",
   cm "340 cm". Path: km "1 km", m "1000 m", mm "1000000 mm".
4. **Tie-break, the best unit:** the largest unit in which the thing measures a whole number of at least 1 (the
   curriculum's "optimalna mjerna jedinica"). ant mm, fingers dm, pencil cm, desk dm, board dm, path km.
5. **A smaller unit gives a bigger number.** Going from u1 to u2 multiplies the count by f(u1) / f(u2) when both
   are exact: pencil cm → mm 14 → 140 (×10); board dm → cm 34 → 340; path km → m 1 → 1000 (×1000). The page keeps
   the last unit and says this when the unit changes (both exact; otherwise the readings are compared).
6. **The zoom** (ruler). The view runs from 0 to W = 12 · 10^(zoom/8) mm: zoom 0 is 12 mm, 8 is 120 mm, 16 is
   1.2 m, 24 is 12 m, 32 is 120 m, 40 is 1.2 km. **Tie-break:** a new thing sets the zoom to the smallest one whose
   W is at least 1.15 · L, so the thing fills about three quarters of the view: ant 0 (W 12 mm), fingers 8 (120 mm),
   pencil 10 (213.4 mm), desk 17 (1600.2 mm), board 21 (5060.4 mm), path 40 (1.2 km). The same fit applies when a
   link names a thing but no zoom, and in the model when the zoom is missing or not a number; a preset gives its own.
7. **The ruler's marks.** The levels are 1 mm, 1 cm, 1 dm, 1 m, 10 m, 100 m, 1 km (10 m and 100 m are steps of the
   ruler, not units). A level's mark spacing is f / W of the view. The **finest mark** is the finest level with a
   spacing of at least 0.006 of the view; the **finest unit** the finest of mm, cm, dm, m, km with that spacing.
   Zoom 0: finest mark mm; 8: mm; 10: cm; 16: cm; 21: dm; 24: dm; 32: m; 40: 10 m (finest unit km). The page draws
   and numbers the marks by their size on the screen (numbers at least about 2.4 em apart), and marks the next unit
   up taller with its own label (1 dm, 2 dm … on the pencil's ruler).
8. **Laying the unit** (ruler): `count` bands of the unit along the thing, numbered 1, 2, 3 … when they are wide
   enough; when a band is narrower than 0.006 of the view the bands are not drawn (`tooSmall`) and the page says
   to zoom in; when the unit is longer than the thing one band is drawn past the thing's end, dashed.
9. **The balance** (balance). Left: the item's mass mL. Right: the second thing's mass if `vs` is an item, else the
   sum of the weights mR. `side` is `left` when mL > mR (the left pan goes down), `right` when mR > mL, `level` when
   equal. **Tie-break:** an empty right pan is mR = 0, so the left pan goes down. The beam's turn is 0 when level,
   otherwise 3 + 9 · min(1, 5 · |mL − mR| / max(mL, mR)) in the heavier side's direction (between 3 and 12, a whole
   difference of a fifth or more is the full 12): apple against nothing 12 to the left; apple against 10 dag 12 to the
   left; apple against 151 g 3.3 to the right. `w` sorted largest first; adding a 31st weight is refused (`full`).
10. **The weights say the mass.** When the pans are level with weights on the right, the item's mass is the weights'
    sum, written in kg, dag and g, largest first, zeros left out ("15 dag", "2 kg 35 dag", "1 kg 5 dag 2 g").
    The fewest weights for a mass (`fewest`, greedy largest first, which is exact for 1–2–5 weights): apple 10 dag
    + 5 dag; bag 2 kg + 20 dag + 10 dag + 5 dag; stone 50 dag + 20 dag + 10 dag. The page's "Pokaži kako" puts them
    on the pan (teacher).
11. **The table** (table). Columns, largest first: length km, m (hundreds, tens, ones), dm, cm, mm; volume l
    (hundreds, tens, ones), dl. Each column is worth 10 of the column to its right, except that the m and l columns
    group three places. The amount is A = n · f(from); a column holds ⌊A / worth⌋ mod 10. n is clamped to
    1 … nMax(from): length km 9, every other unit 1000; volume l 999, dl 1000 (the table holds less than 10 km and
    less than 1000 l). **The reading in `to`**: the whole part ⌊A / f(to)⌋ is the digits from the leftmost one to
    `to`'s ones column, and the columns between `from`'s ones column and `to`'s that were empty get a 0 (`zeros`);
    the rest (A mod f(to)) keeps its columns and its own units. Examples: 34 dm → m: "3 m 4 dm" (not whole); 34 dm →
    cm "340 cm" (one 0); 3 m → cm "300 cm" (two zeros); 3 l → dl "30 dl"; 25 dl → l "2 l 5 dl"; 1 km → m "1000 m"
    (three zeros); 1000 m → km "1 km"; 250 cm → m "2 m 5 dm"; 140 mm → cm "14 cm".
    **Tie-break:** a reading over a million is refused (`over`; grade 4 counts to a million): 3 km → mm; 1 km → mm
    is exactly 1 000 000 and allowed. The **whole table** is shown (km … mm, or l … dl), so every unit can be
    chosen to read in; the given row holds the digits from the first one to `from`'s column. When the new unit does
    not fit once (34 dm → km) the whole part is 0, its column stays empty and everything keeps its own units
    ("3 m 4 dm"). A missing n is the default 34. The **steps** of the conversion are the columns between `from` and `to` (m → cm 2, km → m
    3), the **factor** f(from) / f(to).
12. **Ask first** (`hide`): ruler, the count and the bands are hidden ("?"); balance, the item's mass is hidden
    until the pans are level with weights (the weights then say it) or V shows it; table, the reading is hidden.
    The class estimates first (the curriculum's "procjenjuje").
13. **The typical mistake of the table** (teacher): "one zero for every conversion": going to a smaller unit with
    factor 100 or more, the wrong answer n · 10 (3 m = 30 cm instead of 300 cm; 1 km = 10 m instead of 1000 m).

## Presets

| Key | Id | Params | Expected |
|---|---|---|---|
| 1 | `zoom` | ruler, path, km, zoom 40 | 1 km; finest mark 10 m; zoom in to 0 shows mm |
| 2 | `pencil` | ruler, pencil, cm, zoom 10, hide | "14 cm" hidden until V; mm gives 140 mm |
| 3 | `apple` | balance, apple, no weights, hide | left down 12; with 10 dag + 5 dag level, "15 dag" |
| 4 | `kg-dag` | balance, kg1, weights 50 + 20 + 20 + 10 dag | level: 1 kg = 100 dag |
| 5 | `big-light` | balance, pillow vs stone | right down (stone 80 dag > pillow 30 dag), though the pillow is bigger |
| 6 | `table-m` | table, length, 34 dm → m, hide | "3 m 4 dm" (3 m 4 dm = 34 dm) |
| 7 | `table-cm` | table, length, 3 m → cm | "300 cm", two zeros; the mistake 30 cm (teacher) |
| 8 | `table-l` | table, volume, 3 l → dl, hide | "30 dl" |

## Legend and captions

Legend: the thing (a bar), one unit laid along it (alternate bands), the ruler's marks; the pans and the weights; the
table's digits and a new 0. Captions say what the class sees and what it means, in three voices: teacher (the
typical mistake highlighted, the question first), adult (why: a unit is an agreed amount; ten of these make one of
those), child (one short sentence).

## Terms (both languages)

jedinica mjere / unit of measurement; mjerni broj / measuring number *(check)*; duljina / length; dužina / line
segment; milimetar, centimetar, decimetar, metar, kilometar / millimetre … kilometre; masa / mass; vaga s dvije
zdjelice / balance *(check)*; uteg / weight; gram, dekagram, kilogram, tona / gram, decagram, kilogram, tonne;
volumen (obujam, zapremnina) / volume; litra, decilitar / litre, decilitre; tablica mjernih jedinica / table of
units *(check)*; preračunati / convert; procijeniti / estimate.

## Misconceptions targeted

1. A bigger unit gives a bigger number (rule 5; the caption on every unit change).
2. A unit that does not fit once means the thing has no length in it (rule 3, `less`).
3. Bigger things are heavier (preset `big-light`, the curriculum's "(ne)jednake veličine").
4. Every unit is ten of the next: 1 kg = 10 dag, 1 km = 10 m (presets `kg-dag`, `zoom`, rule 13).
5. One zero for every conversion (rule 13, preset `table-cm`).
6. 3 m 4 dm = 7 dm, the parts added (the table: the 4 sits in the dm column, preset `table-m`; the teacher caption
   names it when the reading is two one-digit parts whose second unit is the given one).

## Out of scope

Decimals and fractions, area and volume of solids, money, time, temperature, converting mass, reading a digital
scale, drawing a segment of a given length, pouring (`geo-liquid-volume`).
