<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-hearing: notes

Task `docs/tasks/w3/set-hearing.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native explorer.

## Decisions

- **`set-call-sheet` is not built**, so there was no shooting-day model to copy (the task's soft dependency). The day
  is this page's own module, `day.js` (`SimdeckModels['set-day-blocks']`): ordered blocks kept in six slots (kind,
  length, a flag), with the patches that add, remove, lengthen and flag a block. It knows nothing of noise and holds no
  strings, so it can move to `models/` unchanged or be merged with the call sheet's day (NOTES "Shared requests").
- **The day as six slots of hidden params** (`k1…k6` kind, `t1…t6` length, `e1…e6` defenders). The kit's params
  are ranges, toggles and choices, so a list of blocks cannot be one param; six slots keep the day in the URL, a reload
  and the L switch. Every edit rewrites all slots packed; a gap or an unknown kind in a hand-made URL is skipped
  (rule 1), so the day never has a hole.
- **Dose in % of a full daily dose (8 h at 85 dB(A) = 100 %)**, equal-energy (10·log₁₀, the directive's LEX,8h), not
  the rounded 2^(ΔL/3): "3 dB is twice" is then "about twice" (3.01 dB), which the page says. The 85 dB(A) reference
  is the upper action value, so the 100 % line is the one the directive ties to "defenders must be worn".
- **Two curves, two totals:** without defenders (the action values do not count protectors, art. 3(2)) and at the ear
  (the limit does). This is the page's contrast; a student who puts defenders on sees the action band stay red while
  the ear total drops under the limit, which is what the directive says.
- **Tie-breaks follow the directive's wording** (art. 6(1)): "exceeds" the lower value (80 itself is not over),
  "matches or exceeds" the upper (85 is upper), the limit "shall not be exceeded" (87 itself is not over).
- **Blank-firing shots as sound energy only**: 6 shots per 15-minute take, each 1 s at 115 dB(A) (a sound exposure
  level). The shots are only a number; nothing about the weapons. Peak pressure (the directive's 135 / 137 / 140 dB(C))
  is out of scope and the explanation says the directive also limits it.
- **"Only while worn" twice:** per block (the defenders button) and per hour (`lift`: off 0, 5 or 15 min of every hour
  on the blocks where they are worn). Lifted 5 min an hour, 20 dB becomes about 10 dB.
- **The briefing has a role in the model** (rule 8): in a blank-firing block with defenders on, the shots are cut in
  full whatever the lift, because the armourer announces each take; the lift reaches only the background between takes.
  The caption names the briefing whenever a blank-firing block is without defenders.
- **The generator alone moves** (`dist` 5/10/20/40 m, free field, −20·log₁₀ of the distance ratio). Two sources at once
  (the generator under a scene) would add a second concept (adding decibels), so each block is one source.
- **Caption:** the totals, then the top block at the ear (for the generator its level at the distance, and at the ear
  when defenders are on), then the unannounced shots or else the lift. The top block being an unprotected blank-firing
  block gives the shots sentence instead (SPEC.md "Legend and captions").
- **No glossary terms** (`[[…]]`): plain words and loanwords; `glossary.js` is not loaded.
- **No real case:** catalogue §4.14 lists none for `set-hearing`.
- **No "changed" mark** (unlike `set-fatigue-turnaround`): the two curves already show the effect of the last change.

## For the owner (terms as used; *(check)* with the colleague who trains crews)

- *štitnici za uši* for ear defenders (crews may say *antifoni*) *(check)*
- *agregat* for the generator; *ventilator za vjetar* for the wind machine (or crews say "wind machine") *(check)*
- *ćorci*, *scena s ćorcima*, *pucanj ćorkom* for blank-firing weapons and shots (formal: *manevarsko streljivo*) *(check)*
- *oružar* for the armourer; *ekipa specijalnih efekata* for the effects crew *(check)*
- *donja / gornja upozoravajuća vrijednost (izloženosti)* (80 / 85) and *granična vrijednost (izloženosti)* (87), from memory of the Croatian
  rulebook *(check against the Pravilnik)*
- *take* (takea), *brifing*: loanwords as on `set-chain-of-command` *(check)*
- *doza*, *dnevna doza* for the daily dose *(check)*
- No calls (Tišina!, Akcija! …) appear on this page.

## Unchecked (*(check)*)

- **The Croatian rulebook** that carries Directive 2003/10/EC: Pravilnik o zaštiti radnika od rizika zbog izloženosti
  buci na radu, NN 46/2008 (from memory), its terms and any later amendment. Not on the page.
- **NIOSH 1998** (85 dB(A), 3 dB exchange rate): from memory, not read; nothing from it is on the page.
- **Film and TV guidance on noise, weapons and effects** (industry safety committees, broadcasters' pages): not read;
  the announcement of loud events in the briefing is from the task text.
- **Every level is illustrative** (the page says so): dialogue 70, generator 91 at 5 m, wind machine 97, the
  blank-firing background 75 and 115 dB(A) SEL per shot, 6 shots per 15-min take, the defenders' 20 dB.

## Numbers check

An independent Python script (written apart from `sim.js`, the rules typed again from SPEC.md; kept out of the repo)
gave every number in SPEC.md's presets table: noisy 342.4 %, 90.35 dB(A) (generator 199.05, wind 99.06, blanks 42.29 of
which shots 41.67, dialogue 0.79 + 1.19); blanks 45.5 %, 81.58; defenders 5.4 %, 72.31 at the ear; lifted 30.0 %, 79.77
(generator 18.41, wind 9.16, blanks 0.47); far 146.4 %, 86.66 (generator 3.11 at 72.94 dB(A)); practice 6.5 %, 73.13 at
the ear. Times to a full dose: 85 → 480 min, 88 → 240.6, 91 → 120.6, 94 → 60.4, 97 → 30.3, 100 → 15.2. Lift: 20.0,
10.34, 5.89 dB. Lines: 80 → 31.6 %, 87 → 158.5 %.

The directive's values were read on EUR-Lex (CELEX 32003L0010, 2026-11-13): art. 2(b), 3(1), 3(2), 6(1)(a)(b).

## Term pairs (glossary)

None needed: the page uses no `[[terms]]`. Candidates once the owner confirms the forms: daily noise exposure /
dnevna izloženost buci; exposure action value / upozoravajuća vrijednost izloženosti; ear defenders / štitnici za uši.

## Shared requests

- **Promote `day.js` to `models/set-day-blocks.js`**, or merge it with `set-call-sheet`'s day when that is built
  (catalogue §5.25: set-hearing reads the shooting day's exposures). It needs from the day only ordered blocks with a
  kind, a length and a flag.

## Learn tree

Suggested leaf (catalogue §4.14): `film-set` → `health` "Zdravlje kroz dugi dan / Health over a long day" → `hearing`,
next to `set-fatigue-turnaround` in `fatigue`.

## Review

A fresh reviewer (a separate agent, given the code, SPEC.md and the task, not this file) recomputed every preset from
SPEC.md in its own script (all matched) and ran 124 deliberate breaks of `day.js` and `sim.js`: 106 failed a test, 18
survived. Fixed since: new tests for the 8 real survivors (the at-ear curve with defenders and its cut shots, the top
block by dose at the ear including `practice`, `allowed`/`ear`/`base` on a block with defenders, six blocks a day
through `add`, negative and one-past-the-end indices for − / + and the defenders button, the lists of distances and
lifts); the rerun kills 114 of 124, and the 10 left change no behaviour (e.g. `!!` for `=== true` on a boolean,
`dir <= 0` where the page passes ±1, the order of the add buttons, the reviewer's control). Page and wording: the
generator caption gave the level at the ear "at 5 m" (now its level at the distance, plus the level at the ear with
defenders); the shots sentence now comes before the lift; the caption guards an empty top; focus after removing a
block goes to the row above or the first add button; the defenders button keeps one label and lets `aria-pressed`
carry the state; every block band shows its letter; the 80/85/87 names are listed under the chart on a phone; "more
than ten times" (12 shots against 8 h of dialogue is 13×); "cuts the generator's share" (not "fixes the
generator"); the explanation now says a single shot close by can reach the peak values on its own; Croatian
"upozoravajuća vrijednost" for the action values and "granična vrijednost" for the limit; "80 or less", "not over the
87 limit"; a misnamed test now checks what it names.

## Time

Started 2026-11-13 04:46, done 2026-11-13 05:04, including a fresh review (124 deliberate breaks; the 8 real survivors now have tests).
