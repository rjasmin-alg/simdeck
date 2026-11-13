<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-who-touches-what: specification

Task `docs/tasks/w3/set-who-touches-what.md`, catalogue `set-who-touches-what` (§4.14; the crew model, §5.25).
Class **explorer**: the state is a pure function of the params (`sim.js` `derive`); no steps.

**One concept:** each department owns its equipment and its work; a well-meant move by someone from another
department breaks something they cannot see; the rule is to ask the department that owns it.

**The contrast on the stage:** the same twelve problems sorted by the department that owns them, passed through a
wrong department or the 1st AD, or fixed on the spot by an outsider. The outsider's fix makes the problem look gone
soonest (1 min) and costs the day the most later; asking the owner is a little slower now and costs nothing later.
Every tile keeps its outcome in view, and the scoreboard sets the learner's choices against the three plain
strategies (all to the owner, all to the 1st AD, all yourself) for the same person.

## Models

- `crew.js`: the shared crew (`set-crew`, catalogue §5.25), copied unchanged from `sims/set-chain-of-command/crew.js`
  @ d7b6298 (`models/` has no `set-crew` yet; COMMON.md §6); only its header comment differs. This page reads who
  "you" can be (`trainee`, `gr`, `el`, `prop`, `boom`), their departments, the heads the crew has, and the 1st AD.
- `departments.js` (`set-departments`, promotable): the ten departments, their heads (the crew's six, plus four
  added: art, costume, make-up, locations, each with a line to the 1st AD), and which kinds of thing each owns.
- `sim.js`: the problems, the outcomes, the totals, the presets.

## Stage

- **Tiles** (top, 4 × 3; 2 columns on a phone): one button per problem, numbered, with its short title, its outcome
  word and its minutes ("2 min", or "1 + 20 min" for now + later). The outcome is carried by a mark, a word and a
  fill, never colour alone: open (dashed border, the number in a dashed circle), sorted by its department / your
  department / via the 1st AD (✓, light green tint), passed on (↪, hatched), something broke (✕ in a filled circle,
  thick border, light red tint, the harm kind as the word). The selected tile has a thick ink outline
  (aria-pressed); clicking a tile selects it.
- **The selected problem** (left, under the tiles): its number, title and what you see; "Who sorts it out?" and the
  twelve choices (I'll fix it myself, the ten departments in rule 1's order, Ask the 1st AD; the current one pressed,
  dark); then the result: before a choice, a dashed note that whose it is and what could not be seen show after
  the pick; after it, the outcome mark and word, the department and its head, "what could not be seen", and either
  the department's fix or what your own fix broke.
- **Scoreboard** (right): minutes until sorted, minutes later, total; counts (by its department, passed on, broken,
  open, injuries when there are any); "The same day for you: <who>" with three bars on one scale (all to the owner,
  all to the 1st AD, all yourself): minutes now solid, minutes later hatched.
- **Foot:** once, that the page simplifies, the minutes are illustrative, the production is made up, and the
  production's safety briefing and the head of department have the final word.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `you` | choice in the panel | `trainee`, `gr`, `el`, `prop`, `boom` (`trainee`) | anything else reads as `trainee` |
| `sel` | hidden select (the tiles) | a problem id (`flag`) | anything else reads as the first problem |
| `p_<problem>` | hidden select (the choice buttons) | `''`, `self`, a department, `ad` (`''`) | 12 of them; anything else reads as `''` (not decided) |

## Rules

1. **Departments and heads** (in this order everywhere): electric (gaffer, `gaf`), grip (key grip, `kg`), camera
   (DoP, `dop`), sound (sound mixer, `snd`), art (art director, `artd`), props (props master, `pmast`), costume
   (costume supervisor, `cos`), make-up (make-up head, `mu`), locations (location manager, `loc`), production
   (production manager, `prod`). The six crew heads come from `crew.headOf`; the four added heads are not in the
   crew model (shared request in NOTES.md). The 1st AD's department (`ad`) owns no thing.
2. **Who owns what** (the catalogue's list): electric: lamp, power, cable; grip: stand, flag, track, rigging,
   sandbag; camera: camera, card; sound: microphone, transmitter; art: dressing (the dressed set); props: prop
   (whatever actors handle); costume: clothing; make-up: face, hair; locations: location, owner; production:
   paperwork, transport, catering. Every kind has exactly one owner; a kind nobody owns is a model error (throws).
3. **The problems** (owner from rule 2; fix minutes; what an outsider's fix breaks, and what that costs the day,
   illustrative):

   | # | id | thing → owner | fix | harm | cost |
   |---|---|---|---|---|---|
   | 1 | flag: a flag's shadow on the actor | flag → grip | 2 | injury (the stand, moved off its sandbag, tips onto the stand-in) | 20 |
   | 2 | cup: the cup has moved | prop → props | 2 | continuity (put back from memory; the next takes do not match) | 30 |
   | 3 | cable: a cable across the walkway | cable → electric | 3 | spoiled (tugged aside, the plug pulls out, the key light goes dark mid-take) | 10 |
   | 4 | curtain: a lamp by the curtain | lamp → electric | 2 | injury (a burn from the hot housing) | 20 |
   | 5 | coat: a wet coat | clothing → costume | 5 | damage (hung by a hot lamp, it scorches) | 45 |
   | 6 | monitor: the picture looks dark | camera → camera | 2 | spoiled (a camera setting changed; every take after it wrong, seen at the end of the day) | 40 |
   | 7 | pack: a transmitter shows | transmitter → sound | 3 | spoiled (pushed lower, the cable rubs; no usable sound) | 15 |
   | 8 | vase: a vase by the door | dressing → art | 2 | continuity (moved; the close-ups no longer match the wide shot) | 25 |
   | 9 | shine: a shiny forehead | face → make-up | 2 | continuity (a tissue smears the painted bruise) | 20 |
   | 10 | armchair: the owner's armchair | owner → locations | 5 | damage (dragged, scratches the parquet; the owner stops the shoot) | 30 |
   | 11 | van: a van blocks a gate | transport → production | 4 | damage (driven by someone not insured, scrapes the gate) | 30 |
   | 12 | track: the dolly track rocks | track → grip | 4 | spoiled (a book under the joint; the camera move judders) | 15 |

   Every department owns at least one problem; every harm kind occurs. Sum of fixes 36, of costs 300.
4. **Minutes:** SELF = 1 (an outsider's own fix makes the problem look gone), PASS = 3 (a wrong department's head
   passes it on to the owner), AD = 2 (the 1st AD calls the owning head). Every fix is longer than SELF; AD < PASS.
5. **Outcome of a choice** for one problem and one person, in this order (the first that applies):
   a. not decided (`''` or anything unknown): **open**, minutes now none, later 0;
   b. the owning department: **fixed**, now = fix, later 0 (whoever asks, the owner's own crew included);
   c. "myself" by a member of the owning department: **own**, now = fix, later 0 (the same as b: it is their work);
   d. "myself" otherwise: **harm**, now = SELF, later = cost, with the harm kind;
   e. the 1st AD: **routed**, now = AD + fix, later 0;
   f. any other department (your own included when it does not own the thing): **passed**, now = PASS + fix, later
      0; they touch nothing, so nothing breaks.
   Tie-breaks: b before c (asking your own owning department is "fixed", not "own"; same minutes); the AD trainee
   belongs to no owning department, so their "myself" is always harm.
6. **Totals:** counts of each kind (open, fixed, own, routed, passed, harm) and of each harm kind; now = Σ now (open
   rows add nothing), later = Σ later, total = now + later.
7. **Strategies** (the comparison bars), for the selected person: all to the owner, all to the 1st AD, all yourself,
   each through rules 5–6.

## Expected numbers (checked by an independent script, NOTES.md)

| case (you) | sorted by dept / own / routed / passed / harm | now | later | total | injuries |
|---|---|---|---|---|---|
| all to the owner (any) | 12 / 0 / 0 / 0 / 0 | 36 | 0 | 36 | 0 |
| all to the 1st AD (any) | 0 / 0 / 12 / 0 / 0 | 60 | 0 | 60 | 0 |
| all yourself (trainee) | 0 / 0 / 0 / 0 / 12 | 12 | 300 | 312 | 2 |
| all yourself (grip) | 0 / 2 / 0 / 0 / 10 | 16 | 265 | 281 | 1 |
| all yourself (electrician) | 0 / 2 / 0 / 0 / 10 | 15 | 270 | 285 | 1 |
| all yourself (props) | 0 / 1 / 0 / 0 / 11 | 13 | 270 | 283 | 2 |
| all yourself (boom operator) | 0 / 1 / 0 / 0 / 11 | 14 | 285 | 299 | 2 |
| by the look (trainee) | 6 / 0 / 0 / 6 / 0 | 54 | 0 | 54 | 0 |

For every person: all yourself has the smallest "now" and the largest total; all to the owner the smallest total.

## Presets

| key | id | params | expect |
|---|---|---|---|
| 1 | start | defaults: all open, the trainee, problem 1 selected | 12 open, 0 min |
| 2 | self | every problem "myself", the trainee | 12 broken, 12 + 300 min, 2 injuries |
| 3 | owner | every problem to its owner | 12 sorted, 36 min |
| 4 | look | the department guessed from the look (flag → electric, cup → art, cable → grip, curtain → electric, coat → costume, monitor → camera, pack → costume, vase → props, shine → make-up, armchair → art, van → production, track → grip); problem 2 selected | 6 sorted, 6 passed on (flag, cup, cable, pack, vase, armchair), 54 min |
| 5 | ad | every problem to the 1st AD | 12 via the 1st AD, 60 min |
| 6 | grip | every problem "myself", you are a grip | 2 own (flag, track), 10 broken, 16 + 265 min, 1 injury |

`sim.json` `entries`: self, owner, look.

## Captions

The caption narrates the selected problem, then (once anything is decided) the day's totals:

- open: "n. Title: not decided yet. Pick a department, the 1st AD, or “I'll fix it myself”."
- fixed: "n. Title. Department: D. <the department's fix> Sorted in m min, nothing else broken."
- own: "n. Title. Your department's work (D): you know what cannot be seen. <fix> Sorted in m min."
- routed: "n. Title. The 1st AD knows whose it is and calls the <head>. <fix> Sorted in m min."
- passed: "n. Title. <wrong dept>: “Not ours, that's D.” They touch nothing and pass it on. Sorted in m min."
- harm: "n. Title: gone in 1 min. <what your fix broke> That costs c min later."
- totals: "The day: a min until sorted + b min later."

## Legend

✓ its department sorted it (green tint) · ↪ passed on (hatched) · ✕ something broke (red tint, thick border) ·
open (dashed).

## Terms (both languages)

Departments: Rasvjeta / Electric, Grip, Kamera / Camera, Ton / Sound, Scenografija / Art, Rekvizita / Props, Kostim /
Costume, Maska / Make-up, Lokacije / Locations, Produkcija / Production. Heads: gaffer, key grip, DoP, snimatelj
zvuka / sound mixer, scenograf / art director, rekviziter / props master, kostimograf / costume supervisor, šef maske /
make-up head, location manager, direktor filma / production manager. 1st AD (prvi asistent režije, once, in the
explanation). Croatian forms *(check)*: NOTES.md "For the owner".

## Misconceptions targeted

- "Fixing it myself is quickest and helpful": it is quickest to look at, and the most expensive for the day.
- "If it looks like lighting, it is electric's": the flag is grip's; looks mislead (preset look).
- "Asking the wrong department is as bad as touching it": a wrong department touches nothing and passes it on; only
  minutes are lost.
- "Never touch anything on set": the same move is right when the thing is your department's (preset grip).
- "Not my department, so not my business": you still say something, to the owner or the 1st AD; and when it is
  dangerous right now, you call stop (set-stop-for-safety), which the explanation says once.

## Out of scope

How a department does its fix (no rigging, electrical or driving steps: the fixes are named, not taught); the
chain of who passes a message to whom (set-chain-of-command); stopping the work for danger (set-stop-for-safety);
continuity itself (set-continuity); hot lamps (set-lamp-heat). No real case is named (the catalogue: "no case
needed" for this page).

## Sources

- Council Directive 89/391/EEC of 12 June 1989 (the framework directive), EUR-Lex: workers use machinery, equipment
  and substances correctly, in line with their training and the employer's instructions, and report danger *(check
  the article, cited from memory as art. 13; not cited on the page)*.
- Directive 2009/104/EC (work equipment), EUR-Lex: where equipment carries a specific risk, its use is restricted
  to the workers given the task *(check the article, from memory art. 5; not cited on the page)*. This is the
  safety reason behind "each department owns its equipment".
- Zakon o zaštiti na radu, Narodne novine (NN 71/14 and amendments, from memory *(check)*): the employer's
  organisation of work and the worker's duties apply to everyone on set; not named on this page.
- Published film and TV safety guidance on the roles of heads of department (as cited by set-chain-of-command; not
  read in full here, *(check)*): HSE (UK) "Film, TV and broadcasting"; Government of Ontario "Safety guidelines for
  the film and television industry: safety responsibilities and duties"; ScreenSkills PSA3 "Manage health and safety
  for productions".
- The departments and what they own follow the task's list (catalogue §4.14), which matches common crew practice;
  the twelve problems and every minute are made up for this page.
