<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-chain-of-command: notes

Task `docs/tasks/w3/set-chain-of-command.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native
stepper, one minute per step, 7 steps.

## Decisions

- **Both ways run at once.** The model always runs "to the nearest" and "through the chain" from the same start; the
  `mode` param (key M) only picks which one the chart and the request table show, and the scoreboard counts both. So
  the contrast is the stage at every minute, and switching ways keeps the step (COMMON.md §11: run each variant to its
  own end and show each outcome).
- **The crew is its own module, `crew.js`** (catalogue §5.25: "the crew and its chain … in its own module file, pure
  and tested"). `set-stop-for-safety`, the planned hub of this model, was not merged when this sim was built (the task's
  dependency is soft), so the crew was built here first. It registers on `globalThis.SimdeckModels['set-crew']`, the
  promotion pattern of `models/README.md`, and is ready to move to `models/set-crew.js` unchanged; its rule tests are
  the "crew" block of `sim.test.js`.
- **The lines form a tree rooted at the 1st AD** (SPEC.md rule 1). The 1st AD is the hub of the floor, so production and
  the director pass floor requests through the 1st AD; the gaffer and the key grip go through the DoP, who leads the
  look of the shot. That gives exactly n − 1 lines, as the concept's count says. A real set is not a tree: the director
  and the DoP talk all day, and the 1st AD talks to every head on the radio. The page says so in its explanation; the
  safety call (rule 6) is the one place the model leaves the tree, because a halt is heard by everyone at once.
- **Safety straight to the 1st AD** (rule 6), so this page agrees with `set-stop-for-safety`'s concept (whoever sees
  danger says so at once): the chain is for requests, not for hazards. The safety call also jumps the 1st AD's queue
  (rule 10).
- **One message a minute per person** (rule 10) makes the 1st AD a visible hub: in the full chain case overtime waits
  one minute behind the safety call. This is the honest cost of the chain, and the "the 1st AD only slows things down"
  misconception is answered with it.
- **Lost means lost, even with a head.** In the direct way overtime is lost with the DoP. A real DoP would probably pass
  it on to the 1st AD; the model keeps the strict rule D3 (only the deciders and the doer's own crew act) to show the
  risk of asking whoever is near, and the explanation says the page simplifies. Reviewer's point, kept on purpose.
- **Lines are routes, not rank.** Production and the director sit "under" the 1st AD in the tree only as message
  routes on the floor; the explanation says so.
- **Every approver says yes.** Refusals are out of scope (the concept is who must be asked, not what they answer).
- **The nearest person is fixed per request** (SPEC.md rule 4) and chosen so that the direct way shows both failure
  kinds of the concept: done without a yes, then a second, contradicting order (lamp, prop), and lost (overtime, actor,
  exit). With these choices the direct way never gets a yes; rule D1 (the nearest happens to decide) is in the model
  and tested with swapped specs, but no preset reaches it. A param for "who stands nearest" was left out to keep the
  panel on one screen.
- **The crew-size slider** (10–60, default 40, as in the concept's "forty people") changes only the line count; the
  chart always draws the fifteen people (105 possible lines drawn faintly in the direct way, the 14 lines of the chain
  in the other).
- **Presets:** `direct`, `chain`, `exit`, `overtime`. A fifth preset "sixty people" was dropped so the panel fits
  1920×1080 without its own scroll (the gate measured 946 > 926 px); the slider reaches 60.
- **Phone:** the chart keeps its desktop proportions in a horizontally scrollable box (the page itself does not scroll
  sideways; the gate's phone check passes); the request table drops the "who asks" and "answer" columns.
- **No real case.** Catalogue §4.14 lists this page under "No case needed", so there is no "Na temelju / Based on" line.

## For the owner (terms and calls as used; catalogue §4.14 marks them *(check)*)

Loanwords from the owner's list, used as written: *1st AD*, *gaffer*, *key grip*, *grip*, *boom operator*; declined
where natural: "1st AD-a", "1st AD-u" (in "Kroz šefa i 1st AD-a"). Not on the owner's list, so *(check)* with the
colleague who trains crews:

- *DoP* (also in Croatian strings; gloss "direktor fotografije" not on the page) *(check)*
- *Produkcija* for the node of the producer and the production manager; the explanation glosses the production manager
  once as *direktor filma* (catalogue: gloss *(check)*)
- *prvi asistent režije* as the once-only gloss of 1st AD *(check)*
- *Redatelj*, *Operater kamere*, *Električar*, *Snimatelj zvuka*, *Rekviziter*, *Pomoćni rekviziter*, *Pripravnik*,
  *Glumica* *(check: or the loanwords crews say, e.g. sound mixer, props master, trainee)*
- *rigging* in the key grip's line "stativi i rigging" *(check)*
- No calls (Tišina!, Akcija! …) appear on this page.

## Unchecked (*(check)*)

- The three film/TV safety guidance documents in SPEC.md's Sources were found by a web search and not read in full;
  what each says about the 1st AD and heads of department is unverified.
- Directive 89/391/EEC and the Zakon o zaštiti na radu are cited in SPEC.md only, without article numbers; neither is
  named on the page.
- The reporting lines of rule 1 (gaffer and key grip through the DoP; actor and trainee through the 1st AD; production
  and the director to the floor through the 1st AD) are a common pattern, simplified; the colleague should confirm.
- All minutes are illustrative (one hop ≈ one minute), and the page says so in its foot line and explanation.

## Numbers check

An independent replay (a short Python script written apart from `sim.js`, hand-written routes, rules 5–10) gave the
same result as SPEC.md: chain sent 1,1,1,1,2, done 3,4,1,3,7, times 3,4,1,3,6, mean 3.4, last minute 7; lines 45/9,
105/14, 780/39, 1770/59 for n = 10, 15, 40, 60.

## Term pairs (glossary)

None needed: the page uses no `[[terms]]`. Candidates for `kit/glossary.js` once the owner confirms the forms: 1st AD /
prvi asistent režije; head of department / šef odjela; production manager / direktor filma.

## Shared requests

- **Promote `crew.js` to `models/set-crew.js`** when `set-stop-for-safety` or `set-who-touches-what` starts
  (catalogue §5.25), with the crew tests from `sim.test.js` ("rule 1" to "rule 3"). `set-stop-for-safety` will need
  per-hop delays and a "lost at a hop" chance on top; those belong in its own sim.js or as additive functions.

## Learn tree

Suggested leaf (catalogue §4.14): `film-set` → `crew` → `chain`.

## Time

Started 2026-11-11 23:57, done 2026-11-12 00:30: about 33 minutes, including a fresh review (37 deliberate breaks; the 4 that survived now have tests).
