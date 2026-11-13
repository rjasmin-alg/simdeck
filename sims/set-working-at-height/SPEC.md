<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-working-at-height: spec

Task `docs/tasks/w3/set-working-at-height.md` (catalogue §4.14). One concept: **a tool or a clamp dropped from height
lands with energy that grows with its mass and the height (E = m·g·h: a 1 kg clamp from 6 m about 59 J), enough to
injure badly without a hard hat; the controls are a zone below that nobody enters while someone works above, tools tied
on, a platform with rails instead of a ladder, and ladders and lifts used only by those trained for them; a fall of two
metres can already cause serious injury, so rails and harnesses come before speed.**

Class: explorer (no steps). The state follows from the params at once. Randomness is a seeded week (the seed is a
hidden param; the "another week" button moves it on), and every control is applied to **the same drops**, so switching a
control compares the same week with and without it (common random numbers).

## Scene (one fictional production, a studio stage during prep and the shoot)

One crew member works above the set: on a ladder, on a platform with rails and toe boards, or in the basket of a lift.
What they hold: a spanner, a clamp or a small lamp. Under them runs the route between the set and the video village;
how often someone is under the work spot depends on how busy that route is. A zone below can be left open, marked with
tape only, or closed (nobody enters while someone works above). The week: 20 hours of work above the set (5 days of
4 hours). Every mass, rate, share and radius is illustrative; the physics (E = m·g·h, v = √(2·g·h)) is standard.

| Thing | Value | Note |
|---|---|---|
| g | 9.81 m/s² | standard |
| spanner | 0.5 kg | |
| clamp | 1 kg | the concept's 1 kg clamp |
| small lamp | 2.5 kg | |
| the worker | 80 kg | for the energy of their own fall |
| work above in the week | 20 h | 5 days × 4 h |
| drops from the hand | ladder 1.5 /h, platform and lift 1.0 /h | one hand holds the ladder |
| knocked off where it was put down | 0.5 /h | any access |
| dropped while handed up or down | 0.25 /h | any access |
| where it lands | uniform over a circle of radius R(h) = 0.5 + 0.3·h m around the point below | it glances off and bounces |
| share of the time someone is under the work | few 5 %, busy 20 %, the only way through 40 % | |
| a taped zone | people still cut through: half the share inside the tape | |

## Params

| key | values | default |
|---|---|---|
| `access` | `ladder`, `platform`, `lift` | `ladder` |
| `trained` | boolean: the person going up is trained for that access | `true` |
| `item` | `spanner`, `clamp`, `lamp` | `clamp` |
| `height` | 2 – 10 m, step 0.5 | 6 |
| `traffic` | `few`, `busy`, `through` | `busy` |
| `zone` | `open`, `taped`, `closed` | `open` |
| `zoneR` | 1 – 5 m, step 0.5 | 3 |
| `tether` | boolean: what they hold is tied on | `false` |
| `seed` | 1 – 99, integer (hidden; the button goes round) | 1 |

## Rules, in order

1. **Energy (E = m·g·h).** What they hold lands with E = m·g·h (J) and v = √(2·g·h) (m/s). 1 kg from 6 m: 58.86 J,
   10.85 m/s (39 km/h).
2. **Energy band (illustrative).** E < 10 J: a bad knock; 10 J ≤ E < 100 J: can injure badly without a hard hat;
   E ≥ 100 J: dangerous even with a hard hat. Tie-break: a value on a boundary (within EPS = 1e−9) belongs to the band
   above (10 J is "injures badly", 100 J "even with a hat"). The page says the bands are illustrative.
3. **The worker's own fall.** E = 80 kg·g·h: 1569.6 J at 2 m, 4708.8 J at 6 m. What stops it: on a ladder nothing; on a
   platform the rails; in a lift the rails and a harness clipped in.
4. **Training.** Ladders, platforms and lifts are used only by those trained for them. With `trained` off the worker
   does not go up: no work above, no drops, `blocked: true`; the page says why instead of counting.
5. **The week's events (seeded, independent of every param but the seed).** mulberry32(seed); for each kind in the order
   hand, edge, pass, with its highest rate λmax (hand 1.5, edge 0.5, pass 0.25 /h): t starts at 0; repeat t += −ln(1 − u)/λmax
   (u the next draw); stop when t ≥ 20 h; else draw, in this order, v (does it happen with this access), u (distance),
   a (direction) and r (is someone under) and record the event. Events are sorted by time; tie-break: kind order
   (hand, edge, pass), then the order drawn.
6. **Does it happen (thinning).** An event happens when v < λ(access)/λmax (strictly). Hand drops: 1.5/1.5 on a ladder
   (always), 1.0/1.5 on a platform or lift. Edge and pass: always.
7. **What stops it before the floor.** A hand drop is caught when the item is tied on (`tether`). An edge drop is stopped
   by the toe board on a platform or in a lift; from a ladder it falls. A drop while handing up or down is never stopped
   (only the zone below protects against it).
8. **Where it lands.** Distance d = R(h)·√u from the point below (uniform over the circle), direction 2π·a.
9. **Inside the zone.** With the zone taped or closed, a drop is inside when d ≤ zoneR (tie-break: on the tape counts as
   inside, within EPS).
10. **Someone under it (a hit).** p = share(traffic) × f, f = 0 inside a closed zone, 0.5 inside a taped zone, 1
    otherwise (outside any zone, or no zone: people walk right up to its edge). A hit when r < p (strictly).
11. **Counts.** happened (dropped), caught (tether), stopped (toe board), landed, hits; each drop keeps its day,
    floor(t / 4 h), capped at the fifth day (a time on a boundary starts the next day), for the week's strip, and
    whether it landed inside the zone. And the expected hits over many
    weeks: 20 · Σ_kind λ_kind(access) · (not stopped) · share · f̄, with q = min(1, (zoneR/R)²) the share of landings
    inside the zone, f̄ = 1 (open), 1 − q (closed), 1 − 0.5·q (taped).
12. **Params** outside their range or of an unknown id fall back to the default; numbers are clamped and snapped
    (not a number: the default); the seed is an integer 1 – 99 (else 1); `trained` is off only when `false`, `tether`
    on only when `true`.

## Presets (seed 1)

Expected hits are exact; seeded counts are those the model gives for seed 1 (checked by the independent script).

| # | id | params (differences from defaults) | E | expected hits | seed 1: dropped / landed / hits |
|---|---|---|---|---|---|
| 1 | `ladder` | defaults: ladder, clamp, 6 m, busy, open | 58.86 J | 9.0 | 49 / 49 / 6 |
| 2 | `zone` | zone closed, 3 m (R = 2.3 m) | 58.86 J | 0 | 49 / 49 / 0 (the same drops) |
| 3 | `small` | zone closed, 1.5 m | 58.86 J | 5.172 | 49 / 49 / 3 (all outside the zone) |
| 4 | `taped` | zone taped, 3 m | 58.86 J | 4.5 | 49 / 49 / 3 |
| 5 | `layers` | platform, tether, open | 58.86 J | 1.0 | 41 / 9 / 3 (20 caught, 12 stopped; only hand-ups land) |
| 6 | `low` | ladder at 2 m | 19.62 J; the worker's fall 1569.6 J | 9.0 | 49 / 49 / 6 |

Expected hits: preset 1: 20 × (1.5 + 0.5 + 0.25) × 0.2 = 9.0; preset 3: q = (1.5/2.3)² = 0.42533, 9 × 0.57467 = 5.172;
preset 4: 9 × (1 − 0.5) = 4.5; preset 5: 20 × 0.25 × 0.2 = 1.0.

## Legend and captions

Legend: where it lands (dashed circle), tape (dashed), a closed zone (solid, tinted), someone under it (✕), nobody under
(○), caught by the tether (▲), stopped by the toe board (■), people. The side view adds the working height as a
dimension line; the energy scale (1–300 J, log) marks the drop's energy with a thick line over the three bands
(none, hatched, solid).

Caption, in order:
1. Not trained: "Ladders, platforms and lifts are used only by those trained for them…" and nothing else.
2. "This week: D dropped, L reached the floor, N with someone under it (on average X a week)."
3. If nothing landed: "Nothing reached the floor."
4. One cause or next step, the first that applies: a closed zone smaller than R(h) (the hits outside the tape); a
   closed zone (everything landed inside, which nobody entered while it was kept closed; only if something landed);
   tape (fewer hits, not none);
   open zone on a ladder without a tether (try a zone, a tether or a platform); a ladder with a tether (knocked-off
   things fall, a toe board stops them); a platform or lift without a tether (things slip from the hand); otherwise
   (platform or lift with a tether) only the hand-ups reach the floor, the zone below stops those. The small-zone
   sentence says what lands outside the zone *can* hit people along its edge (it shows in weeks with no hits too).
5. "m kg from h m: E J, <band>."
6. At heights of 3 m or less: "And the worker: a fall from h m is F J; even 2 m is not low."

## Terms

| en | hr |
|---|---|
| ladder | ljestve |
| platform with rails | skela (on the page), skela s ogradom (explanation) *(check)* |
| lift | košara (on the page), podizna platforma (explanation) *(check)* |
| toe board | rubna letva *(check)* |
| tied on (tether) | alat na uzici *(check)* |
| harness | pojas za zaštitu od pada *(check)* |
| hard hat | zaštitna kaciga |
| clamp | stega *(check: crews may say "klema" or "clamp")* |
| the zone below | zona ispod |
| video village | video village (loanword, *check*) |

## Misconceptions targeted

- "It's only a small tool": the energy grows with the height (a 0.5 kg spanner from 10 m: 49 J).
- "Tape is a zone": a taped zone halves the hits; a closed zone is one nobody enters.
- "A zone just under them is enough": the landing circle grows with the height (preset 3).
- "Tied-on tools and rails, so nothing falls": things handed up and down still fall (preset 5).
- "Two metres isn't high": the worker's own fall at 2 m is 1570 J (preset 6).
- "One drop rarely hits anyone": over a week the hits add up.

## Out of scope

How to rig, how to build a platform, how to operate a lift, how to put on a harness or what anchor to use (specialist
work, shown only as what stops a fall); falls of the worker as a probability (shown as energy and protection only);
hard hats as a param (named in the energy band only); real injury thresholds.

## Sources

- Directive 2009/104/EC (work equipment), Annex II §4 (work at height: collective protection before personal, ladders
  only where the risk is low and the use short) — EUR-Lex, cited from memory *(check)*; no figure from it on the page.
- Directive 89/391/EEC (framework: general principles of prevention, collective before individual) — EUR-Lex *(check)*.
- Zakon o zaštiti na radu (Narodne novine): the employer's risk assessment and training for safe work; the rulebook on
  work at height and on work equipment *(check names and numbers)*.
- Film and TV industry safety guidance on work at height and dropped objects (e.g. the UK regulator's and industry
  committees' published guidance) — not read for this page *(check)*; no figure from it on the page.
- E = m·g·h and v = √(2gh): standard mechanics.
- No real case (catalogue §4.14: "No fitting documented case known").
