<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lc-antenna: notes

Adopted from `50ohm-contents-hr/contents/html/applet_schwingkreis_antenne.html` (file last changed in `4a0b7d5`, repo
at `5745d5e`; task `docs/tasks/w1/lc-antenna.md`, catalogue `50ohm-lc-antenna`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_schwingkreis_antenne.html` (repo at `48e18bf`, file last changed in `e56d0dc`);
the two files are byte-identical (the applet has no text). The simdeck copy is canonical from here on. The first commit
on the branch holds the original as-is, so `git log -p` shows the change.

## What the original is

No text and no controls: one `<img>` that cycles every second through figures 925, 926, 927, 928, 929, 930, 929, 928,
927, 926 and round again (forward, then back).

| Figure | Shows |
|---|---|
| 925 | closed resonant circuit: coil (5 turns) on the left, capacitor on the right, plates 0.3 apart, 7 field arrows between them |
| 926 | plates 1.4 apart, coil of 4 turns, the 7 arrows as long as the gap |
| 927 | loop narrower, coil of 3 turns, plates tilted 45° into a V; 7 field arcs round the loop's centre |
| 928 | loop narrower again, coil of 2 turns, plates in one vertical line; 7 semicircular arcs bulging out |
| 929 | no coil: a straight wire with small end plates; 2 field loops on each side, from end to end |
| 930 | the wire split in the middle (two open terminals), dots at the ends; 2 field loops on each side |

The pictures are in `50ohm-contents-hr/contents/drawings/` (`.tex` circuitikz sources, `.svg` renders, `.txt` alt
texts, "not checked yet"). **The applet is not included in any 50ohm section** (no `[include:applet_schwingkreis_antenne]`
in either repo, and no picture tag for 925–930), so there is no 50ohm text next to it to take the explanation from.
Captions and explanation are written for simdeck from standard physics (closed versus open resonant circuit, the
dipole), with the 50ohm-contents-hr Croatian terms. *(check)* the Croatian wording with the HRS translation team.

## Attribution and licence (CC BY 4.0)

- Source: the applet and figures 925–930, **50ohm.de-Autorenteam, AJW-Referat des DARC e.V.**, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of both 50ohm repos).
- **The HTML file has no author line and no licence of its own** (checked in both repos), so the task went ahead.
- **The figures carry an author line, `% Author: Prof. Dr. Matthias Jung, DL9MJ` / `% Year: 2024`, in their `.tex`
  sources, but no licence of their own.** DL9MJ is in the 50ohm.de-Autorenteam listed in the 50ohm-contents-hr
  `README.md`; read as team material under the repos' CC BY 4.0, as `sims/lc-resonance`, `sims/ring-modulator` and
  others did. The credit names DL9MJ for the figures. *(check)* if the owner reads task step 2 ("no separate author")
  more strictly.
- **Changed**: adapted to the simdeck kit, the figures redrawn as SVG from a model, text added in both languages (the
  original has none), the loop turned into 5 steps with thumbnails, charges, a half-a-period-later switch, a summary of
  how L, C and f₀ change, and presets added. Stated on the page and in `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- **No libraries vendored** (task step 3): the original loads jQuery 3.7.1 and Chart.js 4.4.1 from 50ohm.de but uses
  neither (plain `querySelector` and `setTimeout`); the page needs no library. The figures' SVGs were not copied: they
  are TeX renders with fixed colours and would not follow the theme.

## Decisions

- **Class `stepper`**, 5 steps, 6 states (playbook §10.4): the original is a sequence of frames on a timer. Step n is
  figure 925 + n. The original's way back (930 → 926) is not repeated as steps: `Home`, `←` and the thumbnails go back,
  and the kit's play runs forward through the six shapes.
- **Model** (`sim.js`): the six shapes as data, with the figures' own coordinates from their `.tex` (loop 2 × 2, coil
  x, turns, plate gap, the fan's centre, angle and radii), and `geometry(n)` builds wires, coil, plates and field lines
  from them. The wire and dipole loops are my own cubic Béziers in the spirit of 929 (`controls`) and 930
  (`looseness=2`), not their exact curves. `bounds()` gives one box for all six, so the drawing keeps one scale and
  nothing jumps between steps.
- **L, C and f₀**: the figures give no component values, so the model only says which of L and C shrinks at each
  step (`lDown`, `cDown`) and that f₀ = 1/(2π√(LC)) rises (`f0Up`). Fewer turns or a narrower loop → smaller L; plates
  further apart, opened wider, shrunk to end plates or gone → smaller C. Step 5 keeps the same straight wire (only split
  and fed), so L is "about the same" there and only C shrinks. No numbers on the page: any number would be invented.
- **Added, same concept**: `+` and `−` at the plates (or wire ends), so the field's direction has a cause; a toggle
  "half a period later" that swaps charges and arrows (the circuit oscillates; the figures freeze one instant); six
  thumbnails of all shapes (click to jump), and a "what changed" readout (coil, capacitor, field, f₀); four presets
  (closed circuit, plates opened to a V, open circuit, dipole).
- **Colour**: one series, `--c2` for the electric field, as in `sims/lc-resonance` (capacitor and E there too). Never
  colour alone: field lines carry arrowheads and the `E` label; the current thumbnail has a thicker border, bold text
  and a `▸` mark besides the accent colour (grayscale screenshot checked).
- **Tie-breaks**: step 0 has nothing before it (`lDown`, `cDown`, `f0Up` all false); step 5 lowers only C; only
  `flip === true` flips (strings, 1 and missing params do not; the kit hands booleans); a step outside 0 … 5 goes to the
  nearest end, a fraction to the nearest step.
- **Tags**: `circuits` (task file) and `antennas` (in `tags.json`; the shape at the end is a dipole, and `antennas`
  lists "dipole" among its aliases). `circuits` is labelled "digital circuits" in `tags.json`, which does not fit an LC
  circuit (nor `lc-resonance`); reported for the coordinator. Topic `radio`, level `core`. `related`: `lc-resonance`
  (the closed circuit this starts from), `lambda-f`.
- **No answer keys**: the applet sits next to no exam question; nothing from the question pool is on the page.

## Deviations from the original (and why)

- The six pictures on a 1-second timer became one model-drawn picture stepped by the clicker (projector use), with
  thumbnails of all six so the class sees where it is in the sequence.
- Text added (none in the original): captions, readout, explanation, in Croatian and English.
- Added: charges, the half-period switch, the readout, presets (see Decisions).

## Term pairs

Not in `kit/glossary.js`; written out in both tables, Croatian from the 50ohm-contents-hr text. For the coordinator to
add with `"src": "simdeck"` (the first seven are also in `sims/lc-resonance/NOTES.md`):

| en | hr |
|---|---|
| resonant circuit | titrajni krug |
| coil (inductor) | zavojnica |
| capacitor | kondenzator |
| inductance | induktivitet |
| capacitance | kapacitet |
| electric field | električno polje |
| resonant frequency | rezonantna frekvencija |
| open resonant circuit | otvoreni titrajni krug |
| closed resonant circuit | zatvoreni titrajni krug |
| dipole | dipol |
| feed point | napojna točka |
| electromagnetic wave | elektromagnetski val |

## Shared requests

None. No shared model used or offered (six shapes of data and their drawing).

## Checks

- `node --test sims/lc-antenna/sim.test.js`: 20 tests. Each rule broken once on a copy (L_DOWN, C_DOWN, `flip` coerced, `floor` for the step, `f0Up` as and, a gap, a turn count, the field per step, half the arc sweep, field lines reversed, `last`) makes 1 or 2 tests fail. One mutant survived on dead code (a special case for the Bézier ends, where the weights are already exact); that code was removed.
- `npm run gate -- lc-antenna`: pass (manifest, tests, build, browser 61/61, tokens, scope), no exceptions. `npm test`: 1376 pass. `npm run check`: 0 errors.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale and 375×812 in hr and en; plus unbuilt from
  `file://` every step in hr and en at 1920×1080, step 2 flipped, step 5 flipped in dark, steps 3 and 5 at 375×812; no
  console errors or warnings. Fixed from them: the `L` label sat on the coil, `E` collided with `−` on the parallel
  plates.
- Not checked: a real projector; the Croatian wording with the HRS translation team *(check)*.

## Time

Start to done: about 15 minutes by the machine clock (2026-10-03 12:33–12:48 CEST), one session.
