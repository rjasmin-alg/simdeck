<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-liquid-volume: SPEC

Task `docs/tasks/w3/geo-liquid-volume.md`, catalogue §4.17. One concept: **pouring water into a narrower or a wider
vessel changes how high it stands, not how much there is (the curriculum asks for this first); two vessels are
compared by pouring one into the other; measuring with a cup as the unit, then with the litre and the decilitre
(1 l = 10 dl).**

Class **explorer** (no steps). Three modes, in the curriculum's order:

- `pour` (Prelijevanje / Pouring): two vessels of different shapes side by side, drawn to the same scale; fill one
  from the tap, pour it into the other, back again. The amount stays, the level changes; pouring a full vessel into an
  empty one says which holds more.
- `cup` (Mjerimo šalicom / Measuring with a cup): a big vessel filled with a small one, one at a time; the count of
  small vessels is the measurement. A smaller cup gives a bigger number; the 1 dl measure is the agreed cup.
- `litre` (Litra i decilitar / Litre and decilitre): litre bottles filled decilitre by decilitre; 10 dl fill one
  bottle, so 23 dl = 2 l 3 dl.

Every expected number below was computed with an independent Python script before coding (NOTES.md, Checks) and is
asserted in `sim.test.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - **MAT OŠ D.3.4** "Procjenjuje i mjeri volumen tekućine." Razrada: "Primjenjuje pojam volumena (obujma,
    zapremnine) tekućine. Upoznaje i uspoređuje različite posude za čuvanje tekućine. Opisuje vezu između oblika i
    volumena tekućine. Procjenjuje i mjeri volumen tekućine prelijevanjem. Imenuje jedinice za mjerenje volumena
    tekućine (litra, decilitar). … Izražava volumen tekućine standardnim jedinicama te uspoređuje volumene posuda."
    Preporuka: "U početku je dobro uspoređivati volumen tekućine prelijevanjem iz jedne posude u drugu. Pri mjerenju
    volumena tekućine **prvo treba osvijestiti da se prelijevanjem iz posude u posudu količina tekućine ne mijenja iako
    se njezin izgled (visina tekućine u posudi) mijenja.** Nakon toga možemo odabrati neku posudu koja nam postaje
    mjerna jedinica i prelijevanjem tekućine mjeriti i uspoređivati različite količine tekućina u većim posudama.
    Učenici upoznaju standardne mjerne jedinice … Obujam i zapremnina sinonimi su za volumen. Mjerna jedinica litra
    ima dva znaka: L i l. Učenike je potrebno poticati na procjenjivanje rezultata na svim razinama." → the three
    modes in this order (`pour` first, then `cup`, then `litre`), ask first (rule 12), the page writes l.
  - **MAT OŠ D.4.1** the same outcome, plus "Računa s mjernim jedinicama za volumen tekućine. Preračunava mjerne
    jedinice." → `litre` (23 dl = 2 l 3 dl). Converting in the table of units is `geo-units`'s, not built again.
  - Kept out: ml, hl, decimals and fractions (1,5 l, "pola litre"), cm³, the volume of solids, written calculation.

## Vessels

Round vessels seen from the side, each a stack of frustum segments from the bottom, `[height, bottom width, top
width]` in cm, and a capacity `cap` in whole dl. The drawn shape holds within 2 % of `cap` (π h (a² + ab + b²) / 12
cm³ per segment, 100 cm³ = 1 dl), so the pictures are honest; levels are computed from the shape scaled to hold
exactly `cap`.

| Id | Name (hr / en) | Segments | cap | Height |
|---|---|---|---|---|
| `tall` | visoka čaša / tall glass | [20, 5, 5] | 4 dl | 20 |
| `wide` | niska čaša / low glass | [8, 8, 8] | 4 dl | 8 |
| `cup` | šalica / cup | [6, 6, 7] | 2 dl | 6 |
| `dl` | mjerica od 1 dl / 1 dl measure | [6, 4.4, 4.8] | 1 dl | 6 |
| `vase` | vaza / vase | [4, 5, 9], [6, 9, 9], [5, 9, 3.5], [10, 3.5, 3.5] | 8 dl | 25 |
| `bowl` | zdjela / bowl | [5, 13, 17] | 9 dl | 5 |
| `bottle` | boca / bottle | [18, 8, 8], [3, 8, 2.5], [5, 2.5, 2.5] | 10 dl | 26 |
| `jug` | vrč / jug | [16.8, 11, 11] | 16 dl | 16.8 |
| `pot` | lonac / pot | [13, 17, 17] | 30 dl | 13 |

Pour mode offers all but `dl`; cup mode fills `bottle`, `jug` or `pot` with `cup`, `wide` (a glass) or `dl`.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `mode` | `pour`, `cup`, `litre` | `pour` | what is shown |
| `a`, `b` | a pour vessel | `tall`, `wide` | (pour) the left and the right vessel; the same twice is allowed |
| `fa`, `fb` | whole 0 … cap | 4, 0 | (pour) the water in each, in dl |
| `big` | `bottle`, `jug`, `pot` | `jug` | (cup) the vessel measured |
| `unit` | `cup`, `wide`, `dl` | `cup` | (cup) the vessel it is measured with |
| `k` | whole 0 … kMax | 0 | (cup) how many small vessels have been poured in |
| `dl` | whole 0 … 50 | 0 | (litre) the water in the litre bottles, in dl |
| `hide` | boolean | false | ask first |

## Rules

1. **Clean params.** Unknown choices fall back to the default; numbers are rounded and clamped (`fa` to 0 … cap(a),
   `fb` to 0 … cap(b), `k` to 0 … kMax, `dl` to 0 … 50). A missing or non-numeric amount is 0, except `fa` and
   `fb` missing entirely, which take the defaults.
2. **The level** (pour, cup). The level of v dl in a vessel is the height at which the shape, scaled to hold `cap`,
   holds v: walk the segments from the bottom, the last one partly (bisection; a frustum's volume grows with its
   height). Cylinders are linear. tall 4 → 20 cm, tall 2 → 10, wide 4 → 8, wide 2 → 4, vase 8 → 25, vase 4 → 7.80,
   bowl 8 → 4.56, bowl 9 → 5, jug 6 → 6.3, bottle 5 → 9.95, cup 1 → 3.23 (the cup widens upward, so half of it is
   above half its height).
3. **Pouring** (pour). Pouring from X into Y moves m = min(water in X, room in Y); the rest stays in X. **Nothing is
   spilled**, and the total stays. Refused when X is empty (`empty`) or Y is full (`full`); the params come back
   unchanged and the page says why.
4. **The amount stays, the level changes.** After a pour the page compares the layer the poured water made in X
   (its level before minus its level after) with the layer it makes in Y (after minus before): `lower`, `higher`, or
   `same` (within 0.05 cm). tall 4 → wide: 20 cm → 8 cm, lower; wide 4 → tall: 8 → 20, higher; tall 4 → tall:
   same; jug 16 → bottle: the top 10 dl of the jug, 16.8 − 6.3 = 10.5 cm, become 26 cm in the bottle, higher. When
   only part of the water moved (some stayed in X, or Y had water), the caption speaks of the poured amount alone.
5. **Comparing by pouring** (tie-break order). When X was full and Y empty before the pour, the pour decides which
   holds more: something left in X → X holds more; else Y not full → Y holds more; else (Y exactly full, nothing left)
   **the same**. Otherwise there is no verdict (the page says to start full into empty). Presets: tall 4 → wide 4:
   same; vase 8 → bowl: bowl 8 of 9, bowl holds more (though 5 cm high against 25 cm); jug 16 → bottle: bottle full,
   6 dl left in the jug, the jug holds more.
6. **Fill and empty** (pour). Fill sets the vessel to its cap (from the tap); empty sets it to 0.
7. **Measuring with a cup** (cup). The big vessel of `cap` C, the unit of `u` dl: `full` = ⌊C / u⌋ whole units,
   `rest` = C mod u, kMax = ⌈C / u⌉. After k units the big vessel holds min(k · u, C); when k = kMax and rest > 0
   the last unit did not go in completely and keeps u − rest. The measurement: exact → "C is `full` units"; not
   exact → "more than `full`, fewer than `full` + 1". jug: cup 8, glass 4, dl 16; bottle: cup 5, glass 2 and a bit
   (rest 2, kMax 3), dl 10; pot: cup 15, glass 7 and a bit (rest 2, kMax 8), dl 30.
8. **One more unit** is refused when the big vessel is full (`done`; k = kMax). "Fill up" sets k = kMax; "empty"
   sets k = 0. The page empties the big vessel when another one is chosen (k = 0).
9. **A smaller unit gives a bigger number** (cup). With the big vessel full, changing the unit keeps it full (k =
   the new kMax) and the page compares the two counts: jug cup 8 → glass 4 (a bigger unit, a smaller number); jug
   glass 4 → dl 16.
10. **Litre and decilitre** (litre). n dl fill the bottles of 10 dl in order: bottle i holds min(10, max(0, n −
    10 i)), five bottles. The reading is ⌊n / 10⌋ l and n mod 10 dl, zeros left out: 0 → "0 dl", 7 → "7 dl", 10 →
    "1 l", 13 → "1 l 3 dl", 23 → "2 l 3 dl", 40 → "4 l", 50 → "5 l". +1 dl, −1 dl, +1 l (+10), −1 l (−10) are
    refused past 0 or 50 (`limit`; −1 l below 10 dl is refused, not cut to 0).
11. **A full bottle** (litre): the reading has a whole litre and no dl when n is a multiple of 10 and n > 0; the
    page says 10 dl = 1 l there.
12. **Ask first** (`hide`): pour, the amounts and capacities are "?" (the levels stay; the pour's verdict, rule 5,
    is shown, since pouring answered it); cup, the count is "?" until the big vessel is full, and the units' sizes in
    dl are hidden; litre, the reading is "?". V shows. The class estimates first ("procjenjivanje").
13. **Typical mistakes** (teacher): the higher water is more (rule 4, on every pour that changes the level); a
    bigger cup gives a bigger number (rule 9); 1 l = 100 dl, as 1 m = 100 cm (rule 11); 2 l 3 dl = 5 dl, the parts
    added (litre, when both parts are present).

## Presets

| Key | Id | Params | Expected |
|---|---|---|---|
| 1 | `same` | pour, tall 4 / wide 0 | pour → wide full, 4 dl both times, 20 cm → 8 cm; the same |
| 2 | `which` | pour, vase 8 / bowl 0, hide | pour → bowl 8 of 9: the bowl holds more |
| 3 | `overflow` | pour, jug 16 / bottle 0, hide | pour → bottle full, 6 dl left: the jug holds more |
| 4 | `cups` | cup, jug, cup, k 0, hide | 8 cups |
| 5 | `glasses` | cup, pot, wide, k 0 | 7 glasses and a bit; with the cup 15 |
| 6 | `litre` | litre, 0 dl | +1 dl ten times: 10 dl = 1 l |
| 7 | `l-dl` | litre, 23 dl, hide | 2 l 3 dl |

## Legend and captions

Legend: water (filled, with a level line), the level it had before the pour (dashed), a small vessel poured in (its
number). Captions in three voices: teacher (the question first, the typical mistake highlighted), adult (a "why"
sentence per mode), child (one short sentence).

## Terms (both languages)

volumen (obujam, zapremnina) tekućine / liquid volume; posuda / vessel (container); prelijevati / pour; razina
(visina) vode / water level; mjerna jedinica / unit of measurement; litra (l) / litre; decilitar (dl) / decilitre;
procijeniti / estimate; vrč / jug; šalica / cup; mjerica / measure *(check)*.

## Misconceptions targeted

1. The higher water is more (rule 4, presets `same`, `which`).
2. The taller vessel holds more (preset `which`: the vase is five times as tall, the bowl holds more).
3. A bigger unit gives a bigger number (rule 9, preset `glasses`).
4. Every measurement comes out whole (rule 7: "more than 7, fewer than 8").
5. 1 l = 100 dl; 2 l 3 dl = 5 dl (rules 11, 13).

## Out of scope

ml, hl, decimals, fractions of a litre, cm³ and the volume of solids, the table of units (`geo-units`), written
calculation with l and dl, spilling, mass of water.
