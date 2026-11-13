<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-hearing: spec

Task `docs/tasks/w3/set-hearing.md` (catalogue §4.14). One concept: **sound level in decibels is logarithmic: every
3 dB more is twice the sound energy, so the time someone can spend at that level halves; a day near a generator, a
wind machine, blank-firing weapons or explosions adds up to a daily dose in which short loud events weigh heavily; ear
defenders cut the level that reaches the ear, but only while they are worn, and distance helps (outdoors, double the
distance from a source and the level falls by about 6 dB); the effects crew and the armourer announce loud events in
their briefing.**

Class: explorer (no steps). The state follows from the params at once.

## The day (one fictional production)

One crew member's shooting day (a lighting crew member who works near the generator part of the day), from the crew
call at 07:00, built from up to six blocks in order. Each block is one kind of exposure, a length (15 min … 4 h) and
whether ear defenders are worn. Every level is in dB(A) at the crew member's position and is illustrative (the page
says so once); only the 80 / 85 / 87 dB(A) values come from a source (Directive 2003/10/EC art. 3(1)).

| Kind | id | Level | Note |
|---|---|---|---|
| a quiet dialogue scene | `dialogue` | 70 dB(A) | takes, resets, the set's own sound |
| work near the generator | `generator` | 91 dB(A) at 5 m | falls with distance (rule 6) |
| the wind machine | `wind` | 97 dB(A) | beside it, while it runs |
| a scene with blank-firing weapons | `blanks` | background 75 dB(A), plus 6 shots per 15-minute take | each shot's energy = 1 s at 115 dB(A) (a sound exposure level, SEL) |

## Model files

- `day.js`: the day as ordered blocks kept in six slots (rules 1–3): pure, no strings, knows nothing of noise;
  registers `SimdeckModels['set-day-blocks']`. Catalogue §5.25 names `set-call-sheet` as the shooting day's hub; it is
  not built yet, so this module is the hearing page's own (NOTES.md "Shared requests").
- `sim.js`: the noise on top of the day (rules 4–11), presets.

## State (from `derive(params)`)

```
{ blocks: [{ i, kind, len, ear, start, end, base, level, levelEar, allowed, dose, doseEar, shots, shotsDose, shotsEar }],
  len, dist, lift, genLevel, dose, doseEar, lex, lexEar, action, limit, top, curve: [{ m, u, e }], full }
```

Doses are in % of a full daily dose, 8 h at 85 dB(A) = 100 %. `level`/`lex` without defenders, `levelEar`/`lexEar`
at the ear.

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | **Blocks:** slots 1…6 each hold a kind (`k`), a length (`t`) and defenders (`e`). The day's blocks are the slots in order whose kind is one of the four; a slot that is `none` or unknown is skipped (**tie-break:** the blocks are always packed, so a gap in the slots never makes a gap in the day). Block i starts where block i−1 ends, from 0 at the call. | definition |
| 2 | **Length:** rounded to 15 min and clamped to 15 … 240 min; not a number → 60. | illustrative |
| 3 | **Edits** (page): *add* puts a 60-min block of a kind, defenders off, after the last block (null when six blocks are there); *remove* takes block i out and the later blocks move up; − / + changes block i's length by 15 min within 15 … 240 (null at a bound: the button is `aria-disabled` and says why); the defenders button switches block i's defenders. Each edit rewrites all six slots packed. | interaction |
| 4 | **Equal energy:** a block of `t` min at `L` dB(A) is a dose `100 · (t/480) · 10^((L − 85)/10)` %. So 3 dB more (exactly 10·log₁₀2 ≈ 3.01 dB) doubles the dose, and the time to a full dose, `480 · 10^((85 − L)/10)` min, halves: 8 h at 85, 4 h at 88, 2 h at 91, 1 h at 94, 30 min at 97, 15 min at 100. A block's level is the level of its dose over its length. | ISO 1999 / Directive 2003/10/EC art. 2(b) (LEX,8h a time-weighted average, impulsive noise included) |
| 5 | **The day:** the doses add up. LEX,8h = `85 + 10·log₁₀(dose/100)` (the day's energy over a nominal 8 h; a 10-hour day at 85 is over 100 %). An empty day has no level (null). | Directive 2003/10/EC art. 2(b) |
| 6 | **Distance:** the generator's level at `d` m is `91 − 20·log₁₀(d/5)` (free field, outdoors): 5 m 91, 10 m 85.0, 20 m 79.0, 40 m 72.9 dB(A). Each doubling of the distance takes about 6 dB, a quarter of the energy. `dist` ∈ {5, 10, 20, 40}; anything else → 5. | inverse square law; indoors reflections make the fall smaller (out of scope) |
| 7 | **Ear defenders, only while worn:** a block with defenders on cuts its level at the ear by 20 dB (energy × 0.01), except for the `lift` minutes of every hour they are off (to talk, to hear the radio): energy at the ear `× (lift/60 + (1 − lift/60) · 0.01)`. Lift 0: 20 dB; 5 min an hour: 10.3 dB; 15 min: 5.9 dB. `lift` ∈ {0, 5, 15}; anything else → 0. Blocks without defenders reach the ear in full. | the 20 dB is illustrative (real cut on set depends on the protector and its fit) |
| 8 | **Announced shots:** in a blank-firing block with defenders on, every shot is cut the full 20 dB, whatever the lift: the armourer announces each take in the briefing and before it, so the defenders go on before the shots; the lift applies to the background between takes. Shots per block `6 · t/15`. | the task's "announce loud events in their briefing" |
| 9 | **Values:** without defenders (the action values do not count protectors): `upper` when LEX,8h ≥ 85, `lower` when > 80, else `below` (**tie-break**, the directive's words: 85 "matches or exceeds" is upper; 80 itself does not exceed the lower value). At the ear (the limit counts protectors): `over` when LEX,8h > 87 (**tie-break:** exactly 87 does not exceed it). An empty day is `below` and `under`. | Directive 2003/10/EC art. 3(1), 3(2), 6(1)(a)(b) |
| 10 | **The curve:** the cumulative dose at each block's end, without and at the ear; a blank-firing block rises with its background and jumps by each take's shots in the middle of the take (two points at the same minute). | display |
| 11 | **Top block** (caption): the block with the most dose at the ear; **tie-break:** the earliest; −1 when nothing reaches the ear (an empty day). | caption |

Out of scope: peak sound pressure (the directive's 135 / 137 / 140 dB(C) peak values, which a single shot can reach
on its own: named once in the explanation), explosions and other pyrotechnics, reflections and indoor sound, adding
two sources running at once, frequency and A-weighting, the protector's rating and fit, hearing tests and the employer's
other duties, recovery and tinnitus. No weapon handling, no charge, no effect method: the shots are only a number.

## Params

- `dist` (choice 5, 10, 20, 40 m; default 5): where the generator stands from the place they work.
- `lift` (choice 0, 5, 15 min an hour; default 0): rule 7.
- `k1` … `k6` (hidden choice none/dialogue/generator/wind/blanks), `t1` … `t6` (hidden range 15 … 240, step 15),
  `e1` … `e6` (hidden toggle): the day, set from the stage (add, remove, − / +, defenders), hidden params so a link, a
  reload and the language switch keep them. Default day: dialogue 2 h, generator 4 h, wind 30 min, blanks 30 min,
  dialogue 3 h (10 h, 07:00–17:00), no defenders.

## Presets and expected numbers (checked by the script in `NOTES.md` "Numbers check")

| # | Preset | Params | Expected (dose %, LEX,8h dB(A): without defenders · at the ear) |
|---|---|---|---|
| 1 | `noisy` | defaults | 342.4 %, 90.35 · the same; generator 199.1 %, wind 99.1 %, blanks 42.3 % (12 shots 41.7 %), dialogue 0.8 + 1.2 %. Upper, over the limit; top: the generator |
| 2 | `blanks` | dialogue 4 h, blanks 30 min, dialogue 4 h (8 h 30) | 45.5 %, 81.58 · the same; the 12 shots 41.7 %, 92 % of the day's dose; the 8 h of dialogue 3.2 %. Lower, under |
| 3 | `defenders` | defaults + defenders on generator, wind, blanks | 342.4 %, 90.35 · 5.4 %, 72.31. Upper (the action values ignore protectors), under |
| 4 | `lifted` | as 3, lifted 5 min an hour | · 30.0 %, 79.77; generator 18.4 %, wind 9.2 %, blanks 0.47 % (its shots still cut in full). Upper, under |
| 5 | `far` | defaults, generator at 40 m | 146.4 %, 86.66 · the same; generator 3.1 % (72.9 dB(A)), wind 99.1 % now the top. Upper, under (86.66 < 87) |
| 6 | `practice` | far + defenders on wind and blanks | 146.4 %, 86.66 · 6.5 %, 73.13; top: the generator, 3.1 % |

## Legend and captions

Stage, top to bottom: two totals (without defenders, with its action band ○ 80 or less · ◐ over 80 · ● 85 and over;
at the ear, with the limit ✓ not over 87 · ✕ over 87); the chart of the cumulative dose over the day's clock, a dashed
line without defenders and a solid line at the ear, with the 80 / 85 / 87 dB(A) day levels as horizontal lines
(31.6 %, 100 %, 158.5 %; their names pushed apart where the lines are closer than a name is tall, and listed under
the chart on a phone); under it the blocks as bands on the same time axis (colour and a letter by kind, a solid top
bar where the defenders are on) and the day's length; then the blocks table (kind, − length +, level → at the ear, the time to a full dose
at the ear level, the share of today's dose at the ear, the defenders button, remove) and the add buttons. Foot line:
the page simplifies, its numbers are illustrative, and the production's safety briefing and the head of department
have the final word.

Caption: an empty day says so. Otherwise the day's two totals in one sentence; then the top block (rule 11): if it is a
blank-firing block without defenders, the shots sentence (n shots, each a fraction of a second, carry x % of today's
dose at the ear; the armourer announces them in the briefing and before every take); else its level at the ear, the
time to a full dose at it and its share (for the generator: its level at the distance, the level at the ear when
defenders are on, and "each doubling takes about 6 dB"), followed by at most one more sentence, the first that
applies: the shots sentence for the first blank-firing block without defenders; the lift (defenders lifted on some
block: of the 20 dB about y dB is left).

## Misconceptions targeted

- "97 dB is only a bit more than 91": 6 dB is four times the energy; 30 min at 97 is a full day's dose (`noisy`).
- "A few shots are nothing next to a whole day": 12 shots outweigh 8 h of dialogue tenfold (`blanks`).
- "I wear defenders, so I'm protected": lifted 5 min an hour they give about 10 dB, not 20 (`lifted`).
- "Under the action values because I wear defenders": the action values count the day without them (`defenders`).
- "Moving the generator fixes the day": it fixes the generator's share; the wind machine still needs defenders (`far`).

## Sources

- Directive 2003/10/EC of the European Parliament and of the Council of 6 February 2003 on the minimum health and
  safety requirements regarding the exposure of workers to the risks arising from physical agents (noise), OJ L 42,
  15.2.2003, pp. 38–44 (EUR-Lex, read 2026-11-13): art. 2(b) LEX,8h (ISO 1999:1990 point 3.6, all noise including
  impulsive); art. 3(1) limit 87 dB(A) and 200 Pa peak, upper action values 85 dB(A) and 140 Pa, lower 80 dB(A) and
  112 Pa (140 / 137 / 135 dB(C)); art. 3(2) the limit takes account of hearing protectors, the action values do not;
  art. 6(1)(a) protectors made available where exposure *exceeds* the lower action values, (b) used where it *matches or
  exceeds* the upper. Named on the page with the article, as the task allows; no text copied.
- The Croatian rulebook that carries the directive (Pravilnik o zaštiti radnika od rizika zbog izloženosti buci na
  radu, NN 46/2008, from memory) and its terms *(check)*: not on the page.
- Inverse square law, free field: −20·log₁₀(r₂/r₁) dB, 6.02 dB per doubling (any acoustics textbook).
- Equal-energy rule, 3 dB exchange rate: ISO 1999; NIOSH Criteria for a Recommended Standard: Occupational Noise
  Exposure (1998) uses the same 85 dB(A) / 3 dB *(check: not read)*.
- Film and TV safety guidance on noise, weapons and effects (industry safety committees, broadcasters' pages)
  *(check: not read; nothing from it is on the page)*.

No real case: catalogue §4.14 lists none for `set-hearing`, and the page stays plainly fictional.
