<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# skip-distance: notes

Adopted from `50ohm-contents-hr/contents/html/sprungdistanz_applet.html` (file last changed in `57ef515`, repo at
`5745d5e`; task `docs/tasks/w1/skip-distance.md`, catalogue `50ohm-skip-distance`, §2.5). German original:
`50ohm-contents-dl/contents/html/sprungdistanz_applet.html` (repo at `48e18bf`, file last changed in `e56d0dc`); the two
differ only in their three visible strings. The host text is `contents/sections/sprungdistanz_1.md` (the applet sits
in its in-depth box), `sections/sprungdistanz_2.md` and `slides/sprungdistanz_1.md`. The simdeck copy is canonical
from here on. The first commit on the branch holds the original as-is, so `git log -p` shows the change.

## What the original is

One slider, "Kut zračenja α" (0 … 90°, default 0°), and a 600 × 200 canvas: a blue Earth disc of radius 100, a pink
ionosphere ring at radius 180, an antenna at 45° on the disc, and a red ray leaving at α above the local horizon,
mirrored at the ring (angle of incidence = angle of reflection about the radius) and drawn back to the disc. Grey lines
mark the horizon and an arc the angle. It redraws on `change` only and logs "DRAW" to the console. It loads jQuery
3.7.1 from 50ohm.de. The geometry is the same mirror model as here, at an exaggerated scale (the ionosphere at 0.8
Earth radii) and with no distances shown.

## Attribution and licence (CC BY 4.0)

- Source: the applet and the text of `contents/sections/sprungdistanz_1.md`, `sprungdistanz_2.md` and
  `contents/slides/sprungdistanz_1.md`, **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos). Croatian translation by
  the 50ohm-contents-hr team.
- **The applet has no author line and no licence of its own** (checked in both repos; its only comment is a joke about
  the derivation), so the task went ahead.
- **Changed**: adapted to the simdeck kit and drawn as SVG, translated into English, the Earth and the ionosphere drawn
  to scale, the region's height as a second slider, the hop in km, its curve against the angle (with E and F2 to
  compare), presets and an explanation added. Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored** (task step 3). The original loaded jQuery 3.7.1 from 50ohm.de to bind one event; the kit
  page needs neither it nor the canvas (canvas text would sit below the 16 px floor).

## Decisions

- **One concept**: how far one hop reaches, from the radiation angle and the region's height. The section says
  exactly this ("ovisi o tome na kojoj se visini nalazi lomeća regija te pod kojim se kutom … zrači"), so the height
  became the second slider. Not here (other catalogue entries): the dead zone, MUF and frequency, day and night
  (`ham-ionosphere-muf`), several hops, D-layer absorption.
- **Class `explorer`** (playbook §10.4): two sliders, nothing to step through. Six presets (keys 1–6): the original's
  start (0°, here at F2 300 km), flat / medium / steep off F2 (10°, 30°, 60°), straight up (90°) and flat off the E
  region (10° at 110 km, to compare with preset 2).
- **Model** (`sim.js`): the ionosphere as a mirror at height h (its virtual height), on a round Earth of R = 6371 km.
  Half the hop as an angle at the centre is β = arccos(R·cos α/(R + h)) − α (law of sines in the triangle centre –
  antenna – turning point), the hop along the ground d = 2Rβ. Shown to 10 km. Numbers (tested): 0° gives 2350 km off
  E (110 km) and 3840 km off F2 (300 km), matching the section's "do 2000 km / do 4000 km" in size; at 4° (about the
  lowest a real antenna radiates) 1620 and 3050 km; F2 at 10° 2190 km, 30° 930 km, 60° 330 km; E at 10° 1000 km.
  The explanation names both the section's round numbers and the model's.
- **Tie-breaks** (tested): α = 0° is `grazing` and the longest hop at its height; α = 90° is `vertical`, exactly 0 km
  (guarded; floating point gives exactly 0 there anyway for every height tried, so that guard is an equivalent
  mutant); everything between is `oblique`; distances round half up to 10 km. α and h are whole numbers, so the ties
  are exact.
- **Ranges**: α 0 … 90° in 1° steps (as the original); h 100 … 400 km in 10 km steps (E ≈ 110 km to a high F2).
  Defaults 0° (the original's) and 300 km.
- **The scene is to scale** (one fixed scale for every state, so hops compare): a slice of about 42° of the Earth
  with the region as a dashed arc and a light band under it, the ray as straight legs (straight in space, as the
  mirror model has it), the hop as a thick band along the ground, ticks every 1000 km, the angle α between the dashed
  local horizon and the ray. The original's 0.8-Earth-radii ionosphere made flat angles look far steeper than they
  are; to scale, the flat-angle point of the lesson is visible. "u mjerilu / to scale" is written in the corner.
- **The plot** (bottom): the hop against α for the current height (solid), E and F2 dotted for comparison, a dot and
  dashed guide at the current α. It is the section's figure `a_sprungdistanz` made live.
- **Colour**: ray `--c1` solid with a filled turning point and a hollow ring where it lands, region `--c2` dashed,
  curve `--c3`, reference curves `--muted` dotted, Earth `--c6` at 22 %. Grayscale checked: each is told apart by
  shape, dash or position too.
- **Phone**: the tick labels, the α label in the scene and the plot's value label are left out below 40 rem / 30 rem
  of width (the caption and sliders say the same).
- **Tags**: `propagation` (task file; in `tags.json`). Topic `radio`, level `core`. `related`: `fading` (also
  propagation, a neighbour in §2.5).
- **No answer keys**: the section's exam questions (EH208, AH212, AH213) are not on the page.

## Deviations from the task and from the original (and why)

- Added: the height slider, the distances, the to-scale drawing, the plot, presets, the explanation (above).
- Default height 300 km: the original has no height (its ring is at 0.8 R); F2 is the region the section's figure uses.
- English: "skip distance" is the catalogue's and the title; the text says "hop distance" too, since in some English
  books "skip distance" means the shortest hop at a given frequency (the dead zone's edge, another sim). The German
  "Sprungdistanz" and the Croatian "skok-udaljenost" mean the geometric hop, as here.
- The original's label "Kut zračenja α" is kept; its intro's "plići / strmiji" became the presets' flat / steep.

## Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian from `sections/sprungdistanz_1.md`, `_2.md`). For the
coordinator to add with `"src": "simdeck"` (some may already be listed by `fading`):

| en | hr |
|---|---|
| hop | skok |
| skip distance | skok-udaljenost |
| radiation angle | kut zračenja |
| refracting region | lomeća regija |
| ionosphere | ionosfera |
| sky wave | prostorni val |

*(check)* whether the HAM course says "skok-udaljenost" (the 50ohm-hr term) or something else.

## Shared requests

None. No shared model used or offered.

## Checks

- `node --test sims/skip-distance/sim.test.js`: 15 tests. Fourteen mutants (90° guard `>`, no clamp at 0, β with
  α/2, 2h, d = Rβ, R = 6370, grazing ≤ 1°, vertical ≥ 89°, floor instead of round, no 10 km height steps, angle
  clamped to 89, maxKm from the current angle, coarse curve, defaults 10°): all but the first two make 1–4 tests fail;
  those two are equivalent (above). The maxKm mutant survived the first round and got its own assertions.
- `npm run gate -- skip-distance`: pass (manifest, tests, build, browser 46/46, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale and 375×812 in hr and en; plus unbuilt from
  `file://` presets 1, 2, 4, 5, 6 and α 45° at 400 km, in hr and en; no console errors or warnings. Fixed from them:
  the slice's ends drawn as a box, the α label on the ray, the region's label on the hop label and ticks, a wide arc
  and a stray label at 90°, the plot title and value overlapping on a phone.
- Not checked: Firefox and Safari; a real projector; the Croatian wording of the added text with the HRS translation
  team *(check)*.

## Time

Start to done: about 15 minutes by the machine clock (2026-10-03 17:02–17:17 CEST), one session.
