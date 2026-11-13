<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-who-touches-what: notes

Task `docs/tasks/w3/set-who-touches-what.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new
native explorer: twelve problems, twelve choices each, the state a pure function of the params.

## Decisions

- **Explorer, not stepper.** The task's class. The learner decides problems in any order; the tiles keep every
  outcome in view, so the contrast (the same problem sorted by its owner, passed on, or broken by an outsider's fix)
  is on the stage at once, and the comparison bars run the three plain strategies to their end for the same person
  (COMMON.md §11).
- **Two numbers per problem: minutes now and minutes later.** "Now" is how long until the problem looks gone;
  "later" is what the hidden damage costs the day (a reshoot, first aid, a replacement, the owner stopping the
  shoot). An outsider's fix wins "now" (1 min, faster than any department's fix) and loses the day: 12 + 300 min for
  the trainee against 36 for asking every owner. That is the misconception the page targets ("fixing it myself is
  quickest") made visible in one bar.
- **A wrong department passes it on, it does not touch it.** The departments on this set know the rule too, so asking
  the wrong one costs 3 minutes, never damage. Otherwise the page would teach "asking is risky", which is the opposite
  of the concept. Asking the 1st AD (when you don't know whose it is) costs 2 minutes: the 1st AD knows every
  department and calls the owner's head (the crew model's 1st AD at the root).
- **Who you are is a param** (five people of the shared crew: AD trainee, grip, electrician, props assistant, boom
  operator). The same move, "I'll fix it myself", is right when the thing is your department's (preset `grip`: the
  flag and the track are fixed properly). Without this, the page would read as "never touch anything on set". The AD
  trainee owns nothing, so for them every own fix breaks something.
- **What could not be seen shows only after a choice.** Before it, the result box says that whose it is and what
  could not be seen show after the pick, so the learner decides from what they see, as on set. Not a quiz: there is
  no score for right answers, only the outcome and the minutes.
- **The shared crew is copied, and the four missing departments are added beside it.** `crew.js` is
  `sims/set-chain-of-command/crew.js` @ d7b6298, unchanged except its header comment (COMMON.md §6: `models/` has no
  `set-crew` yet). It has electric, grip, camera, sound, props and production, but not art, costume, make-up or
  locations, which this page needs. Rather than change the copy, `departments.js` adds four heads with the crew's
  shape (`via: 'ad1'`) and the "who owns what" table. See "Shared requests".
- **Twelve problems, every department at least once.** The task's five (flag shadow, cup, cable, wet costume, lamp by
  a curtain) plus one per remaining department and a second grip one (the dolly track). The harms cover the four kinds
  the task names (the stand without its bag, the continuity error, the burn, the camera setting changed) and damage to
  property (the coat, the parquet, the gate).
- **The camera's cards** are named in the explanation (who owns them) but have no problem of their own: the obvious
  one (someone takes out a card) is `set-card-handoff`'s concept. The monitor problem carries the "camera setting
  changed" harm instead.
- **Fixes are named, never taught.** "An electrician runs it along the wall and covers the crossing", "Electric
  switches it off, lets it cool and moves it", "Production sends the driver": what the department does, in one clause,
  with no method (task: specialist work from outside).
- **The 'dangerous right now' exception** (a curtain catching fire, a stand falling: call stop, don't wait for the
  owner) is one paragraph of the explanation, pointing at set-stop-for-safety's concept, not a branch of the model.
- **Croatian without the learner's gender.** The second person stays in the present tense ("Pomakneš stativ…"),
  and "on your own" is "na svoju ruku", not "sam/sama". In Croatian the owning department is labelled "Odjel", not
  "Vlasnik", because the armchair problem has a house owner (vlasnik) too.
- **No "Based on" line.** The catalogue lists this page under "no case needed".

## For the owner (terms as used; catalogue §4.14 marks them *(check)*)

Loanwords from the owner's list, as written: *1st AD* (declined "1st AD-a", "1st AD-u"), *gaffer*, *key grip*,
*grip* ("gripovi" in a plural), *boom operator*, *stand-in*. Not on the owner's list, so *(check)* with the colleague
who trains crews:

- Department names: *Rasvjeta* (electric), *Grip*, *Kamera*, *Ton*, *Scenografija* (art), *Rekvizita* (props),
  *Kostim*, *Maska* (make-up), *Lokacije*, *Produkcija* *(check: whether crews say "maska" or "šminka", "odjel
  rasvjete" or "elektrika")*.
- Heads: *DoP* (as in set-chain-of-command), *snimatelj zvuka*, *scenograf* (for the art director), *rekviziter*
  (props master, as in set-chain-of-command), *kostimograf* (for the costume supervisor), *šef maske*, *location
  manager* (or "voditelj lokacija"), *direktor filma* (for the production manager; the catalogue's gloss) *(check
  each)*.
- Equipment: *flag* (catalogue: flag *(check)*), *stativ*, *vreća s pijeskom* (as in set-stop-for-safety; catalogue:
  stand or stativ, sandbag or vreća *(check)*), *dolly tračnice* *(check)*, *odašiljač bežičnog mikrofona*
  *(check: crews may say "bodypack" or "odašiljač")*, *prijelazni most za kabele* for a cable ramp *(check)*,
  *Pripravnik* for the AD trainee (as in set-chain-of-command).
- *prvi asistent režije* as the once-only gloss of 1st AD (as in the sibling pages) *(check)*.
- "Ti si" with role nouns in the masculine (*Pripravnik*, *Električar*, *Pomoćni rekviziter*), as the sibling pages
  name roles; the rest of the Croatian text avoids the learner's gender (present tense, "na svoju ruku"). Whether
  the colleague prefers paired forms or a different label *(check)*.

## Unchecked (*(check)*)

- Every minute (fixes, 1 / 2 / 3, the harm costs) is illustrative; the page says so in its foot and explanation.
- Directive 89/391/EEC art. 13 and Directive 2009/104/EC art. 5 are cited in SPEC.md from memory, not against
  EUR-Lex; neither is named on the page (no number on the page comes from them).
- The film/TV guidance in SPEC.md was found by set-chain-of-command's builder and not read in full here.
- That each kind of thing has exactly one owning department is the task's list; on real sets some things are
  shared or negotiated (who moves a lamp's flag, who owns a practical lamp that is part of the dressing). The page
  keeps one owner per kind as its simplification.

## Numbers check

`check.py`, written apart from `sim.js` (a plain loop over the twelve problems with its own copy of the table), run
with `python3 -I` from the session scratchpad, not committed: every row of SPEC.md "Expected numbers" (all to the
owner 36; all yourself as trainee 12 + 300, grip 16 + 265, electrician 15 + 270, props 13 + 270, boom 14 + 285; by
the look 54 with six passed on; all to the 1st AD 60) matched `sim.js` and the tests.

## Fresh review

A fresh reviewer (a separate agent, given only the code and SPEC.md) compared `sim.js` and `departments.js` with
SPEC.md rule by rule: no mismatch in a rule, a number or a preset (it rechecked the expected numbers by hand). It ran
47 one-line mutations on a copy: 39 killed, 8 survived. Three survivors are equivalent: rule 5's b and c cannot both
apply, so their order cannot be observed; a field nothing reads; a no-op. Four were real gaps, now covered by
assertions: the thing each problem is about, the "by the look" guesses, the order of the choices in the picker, and
the full ownership table (grip losing `sandbag` went unnoticed). It also found two comment slips in `departments.js`,
an unused mark in the page, the Croatian "svoje dvoje" (now "svoja dva"), an English preset name that differed from
the Croatian, the props person labelled with the department's name (now "Pomoćni rekviziter / Props assistant"),
and "Twenty minutes later" in the flag harm, which could be read as the 20-minute cost (now "Later"). All are fixed.
The page script (the captions, the counts) has no unit tests; the reviewer checked it against SPEC.md, and I checked
it with screenshots and caption dumps of six states in both languages.

## Term pairs (glossary)

None needed: the page uses no `[[terms]]`. Candidates once the owner confirms the forms: head of department / šef
odjela; continuity / kontinuitet; 1st AD / prvi asistent režije.

## Shared requests

- **Promote `crew.js` to `models/set-crew.js`** (as set-chain-of-command and set-stop-for-safety also ask), then point
  this sim at it.
- **Add the four departments the crew lacks** (art, costume, make-up, locations), additively: either promote
  `departments.js` as `models/set-departments.js` beside `set-crew` (it reads the crew and adds `EXTRA_HEADS`, `OWNS`,
  `ownerOf`, `headOf`, `deptOf`), or add an optional list of extra heads to `set-crew` that `headOf` consults, keeping
  `PEOPLE` (and so every existing page's drawing) unchanged. This page reads `DEPTS`, `OWNS`, `ownerOf`, `headOf`,
  `deptOf`; `set-boom-shadow` (which the catalogue says reads this page's departments) would read the same.
- **Glossary**: none.

## Learn tree

Suggested leaf (catalogue §4.14): `film-set` → `crew` → `departments`.

## Time

Started 2026-11-13 07:32, done 2026-11-13 07:50, including a fresh review (47 deliberate mutations).
