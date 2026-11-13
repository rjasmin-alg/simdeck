<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-risk-controls: notes

Task `docs/tasks/w3/set-risk-controls.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native
explorer.

## Decisions

Deviations from the task: four scenes instead of three (below), and no visible "Based on" line (below).

- **Four scenes, not three.** The task names three (wet stairs, a lamp on a high stand, a car close to the camera);
  the film-set notes ask the page to model its §4.14 case recognisably, and the case (a powered set door) fits none of
  the three. The fourth scene, a powered door that closes on a cue, is that model: fictional, no names. Its two
  presets (`operator`, `guard`) are the case's contrast: an operator's reaction (organise) keeps 80 % of the risk, an
  automatic stop (separate) 31 %.
- **No "Na temelju / Based on" line.** The rule asks for the official document in hand. I could not open it: the HSE
  press release URLs I tried return 404 (press.hse.gov.uk and www.hse.gov.uk/press/2016), the HSE conviction
  database host (resources.hse.gov.uk) does not resolve from this machine, and the web archive is blocked to the
  fetch tool. A search result showed the conviction database lists *Foodles Production (UK) Limited*, Aylesbury Crown
  Court, hearing 26 July 2016, £1,600,000, HSWA 1974 s. 3(1) — not read on the page itself. News reports (October
  2016) agree on the £1.6 m fine and the guilty plea to s. 2 and s. 3(1). Once someone opens the record, the line to
  add in the foot (both languages, strings.js `foot`) would be: "Na temelju: ozljeda glumca vratima na pogon na
  snimanju filma *Star Wars: The Force Awakens* (UK, 2014); HSE, kazneni postupak protiv Foodles Production (UK) Ltd,
  presuda 2016." / "Based on: an actor injured by a powered set door during the shooting of *Star Wars: The Force
  Awakens* (UK, 2014); HSE prosecution of Foodles Production (UK) Ltd, sentenced 2016." *(check every detail)*
- **Scoring as in cmp-risk-register:** L and I on 1–5, score L × I (its `score` copied with the source comment). A
  control takes whole levels off; the floor is 1, so only removal reaches 0 (rule 3).
- **Per-run likelihood** 1, 2, 4, 8, 16 % (doubling per level) gives visible counts in 200 runs; serious = 4–5.
- **Forgetting rates:** separate 1 in 50, organise 1 in 5, protect 3 in 10; remove and replace never (they are how the
  scene is made). Independent per run; correlated forgetting (a tired crew) is out of scope (one concept).
- **On paper vs on the day vs the runs:** paper = every chosen control in place; day = the exact expectation over
  every combination of forgotten controls (rule 6); the runs are one seeded series. Showing both the exact day value
  and a noisy series keeps the claim honest ("expected 9.6, this series 9").
- **Common random numbers:** every run draws the same four numbers whatever is chosen, so switching a control replays
  the same 200 runs; adding a control can only remove injuries (tested). "New series" (N) changes the seed.
- **Two PPE controls move no level** (vests against a car, boots against a door). That is deliberate: equipment only
  protects against some harms; the caption says so when one is chosen.
- **The scene and the controls are on the stage** (tabs and ladder buttons); their params are hidden kit params so the
  state stays in the URL. The panel keeps the scene choice and the "New series" button.
- **Glossary:** no `[[terms]]`; `glossary.js` is not loaded.
- **Layout:** a fit script loaded all 6 presets × 4 scenes × 2 languages at 1920×1080 and measured no overflow
  (the gate checks one state; the door scene in English first overflowed and was fixed by shorter control names and
  a caption naming the level, not the control).

## For the owner (terms as used; *(check)* with the colleague who trains crews)

- The five levels: *ukloniti opasnost*, *zamijeniti manje opasnim*, *odvojiti ljude od opasnosti*, *organizirati rad*,
  *osobna zaštitna oprema* (Croatian rules may say *osobna zaštitna sredstva*) *(check)*
- *vjerojatnost* × *posljedica* for likelihood × severity (cmp-risk-register says *učinak* for impact; for injuries *posljedica* reads better) *(check)*
- *ponavljanje (scene)* for a run (a rehearsal or a take); *takeovi* as a loanword plural *(check)*
- *kaskader* (stunt performer), *promatrač* for a spotter (crews may say *spotter*) *(check)*
- *grip*, *brifing*: loanwords as on the other set pages *(check)*
- *daljinska glava* for a remote head *(check)*; *reflektirajući prsluci* for high-visibility vests *(check)*
- No calls (Tišina!, Akcija! …) appear on this page.

## Unchecked (*(check)*)

- The Star Wars case record (above): title, number, dates, court, sections. Not on the page.
- Zakon o zaštiti na radu: the general principles of prevention (avoid, replace, collective before personal) are named
  on the page without an article; the article number and the current amendments are not checked.
- Directive 89/391/EEC art. 6(2) (from memory; not quoted, no number from it on the page).
- The published hierarchy of controls in film and TV safety guidance (industry committees, regulators): not read; the
  ladder follows the task text.
- Every number is illustrative (the page says so): the scenes' levels, the effects, the per-run chances, the
  forgetting rates.

## Numbers check

An independent Python script (written from the rules before `sim.js`, kept out of the repo) gave: `lower` stairs
9 / 10.56 / 66 %, 9.6 expected injuries (2.88 serious); lamp 6 / 7.26 / 60.5 %, 4.8; car 10 / 11 / 73.3 %, 4.8; door
12 / 12.8 / 80 %, 9.6. `upper` stairs 2 / 2.3332, lamp 1 / 1.3312, car 3 / 3.072, door 2 / 2.48. Door with
organise only 12 / 12.8, 9.6; with separate + organise 4 / 4.96, 2.544. `sim.js` gives the same to 4 decimals.

## Term pairs (glossary)

None needed. Candidates once the owner confirms the forms: hierarchy of controls / hijerarhija mjera zaštite;
residual risk / preostali rizik; personal protective equipment / osobna zaštitna oprema.

## Shared requests

- **None for models/.** The page uses none of the five §5.25 shared models (crew, floor plan, forces, day, load). It
  copies one function from `sims/cmp-risk-register/scoring.js` (`score`, L × I): when `scoring.js` is promoted to
  `models/`, point this page at it.

## Learn tree

Suggested leaf (catalogue §4.14): `film-set` → `safety` "Sigurnost / Safety" → `controls`; also in
`compliance › risk › register`, next to `cmp-risk-register`.

## Review

A fresh reviewer (a separate agent, given the code, SPEC.md and the task, not this file) recomputed every SPEC number
in its own script from SPEC.md, including mulberry32 and the draw order (all 4 scenes × 32 control combinations ×
seeds 1–99: 12,800 comparisons, no mismatch), and ran about 94 deliberate breaks of `sim.js`. 9 survivors changed
behaviour; new tests now kill all 9 (re-run on a copy): the seed rounds (2.6 → 3), `nextSeed` does not skip 99 and
reads the seed as clamped, `toggle` switches a param that reads as off, `strongest` with replace or remove among
others, every preset's scene and exact controls, the default scene, and "fail 0 never forgets" over 99 seeds. The
equivalent survivors change nothing (u is k/2³², so `<` and `<=` cannot differ at the page's chances). Wording fixed:
the explanation said separating holds on every run (it fails 1 in 50; now "nearly every run"); *kaskaderske scene*
(not *kaskade*); *Proba brzinom hoda* / *Proba hodanjem*; "expected injuries" (not a bare number that reads as a
score); whole expected values without ".0"; *na setu*; a double colon and a missing comma in Croatian; SPEC's
misconception line and caption text aligned with the page.

## Time

Started 2026-11-13 06:06, done 2026-11-13 06:28 (about 22 minutes), including the fresh review and the fixes from it.
