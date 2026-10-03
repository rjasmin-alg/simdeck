<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# qpsk: notes

Adopted from `50ohm-contents-hr/contents/html/applet_qpsk.html` (file last changed in `c89aa63`, repo at `5745d5e`;
task `docs/tasks/w1/qpsk.md`, catalogue `50ohm-qpsk`, §2.5). German original:
`50ohm-contents-dl/contents/html/applet_qpsk.html` @ `48e18bf` (file last changed in `9599c0f`); it differs from the
Croatian one only in its six visible strings. The host text is `contents/sections/psk.md` (the applet sits in its
margin, with a paragraph describing it). The simdeck copy is canonical from here on. The first commit on the branch
holds the original as-is, so `git log -p` shows the change.

## What the original is

A self-contained script applet (no libraries): a "start transmission" button sends 32 symbols, one every 420 ms,
from a bit string of eight shuffled groups of the four symbols (`Math.random`). Each received point is the ideal
point plus Gaussian noise (Box–Muller) of σ = noise % / 100 on I and on Q; a slider sets the noise from 0 to 60 %
(default 18 %). A canvas draws the four decision regions tinted, the √2 circle, the axes, the ideal symbols as
crosses with their bit pairs (11 at 45°, 01 at 135°, 00 at 225°, 10 at 315°), the received points coloured by the
sent symbol, and an arrow to the newest point. A row of chips shows the bit string, the current one highlighted.

## Attribution and licence (CC BY 4.0)

- Source: the applet (mapping, bit-string scheme, noise model and its range, the drawing) and the text of
  `contents/sections/psk.md` (the QPSK paragraphs and the applet's margin note), **50ohm.de-Autorenteam,
  AJW-Referat des DARC e.V.**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`LICENSE` of
  both 50ohm repos). Croatian translation by the 50ohm-contents-hr team.
- The HTML file carries no author line and no licence of its own (task step 2 checked): team material under the
  repos' CC BY 4.0.
- **Changed**: adapted to the kit as a stepper, translated into English, the receiver's decisions, the marked wrong
  symbols and the error tally added, 16 instead of 32 symbols, seeded randomness. Stated on the page and in
  `sim.json` `credits`.
- Where it shows: a line at the end of the footer bar, in both languages (`credit` in `strings.js`), with links to
  50ohm.de and the licence; `sim.json` `credits` feeds the site's licences page. It does not imply that DARC endorses
  simdeck or the Croatian translation.
- No libraries to vendor (task step 3): the original loads nothing from 50ohm.de.

## Decisions

- **Class `stepper`** (playbook §10.4): the original is a timed sequence of symbols, so one step sends one symbol;
  Space plays it as the original's button did, → / ← go one symbol at a time, and step back is exact.
- **16 symbols, not 32**: the contract allows about 20 steps. Four shuffled groups keep the original's property
  that every symbol is sent equally often (four times each).
- **Seeded randomness**: the kit's model must be deterministic, so the bit string and the noise draws come from a
  seed (mulberry32, the same generator as `Simdeck.rng`, copied into `sim.js` as `sims/lora-mesh` does). The seed
  is a hidden param; "Novi niz bitova" / "New bit string" (key `N`) moves to the next seed and back to step 0, as
  the original's button started a new string. The noise is drawn unscaled per symbol, so moving the noise slider
  keeps the bit string and the step and slides the same points further from or nearer to their crosses: the
  "what if more noise?" question answered at the same point of the demo.
- **The receiver's decision is shown** (the original only draws the regions; the host text says the receiver picks
  the nearest symbol and errs when a point crosses a border): every chip shows the sent pair over the decided pair,
  a wrong one dashed with the decided pair highlighted, the point haloed in the plot, a running tally of wrong
  symbols and wrong bits, and the caption names the phase of each received point. Still one concept: QPSK symbols
  under noise in the constellation diagram.
- **Decision rule**: the quadrant of the point (= nearest symbol for this constellation). First bit 1 right of the
  Q axis, second bit 1 above the I axis. **Tie-break**: a point exactly on an axis counts to the positive side
  (tested). Points are rounded to 4 decimals before deciding, so what is drawn is what is decided.
- **Presets**, one bit string (seed 25) under more noise: 0 % (on the crosses), 18 % (the original's start, no
  errors), 45 % (two wrong symbols), 60 % (five wrong symbols, each one bit wrong: the Gray code), and seed 37 at
  60 % (symbol 2 lands in the opposite quadrant, two bits wrong). Counts are tested.
- **Plot range** ±2.1 (the original ±1.65): at 60 % a point can land beyond; points outside the range are drawn at
  the frame's edge.
- **Shapes as well as colours** for the four symbols (circle 11, square 01, triangle 00, diamond 10; colours c2,
  c3, c4, c6 after the original's orange, green, purple, teal), so grayscale keeps them apart.
- The animation of the original (420 ms per symbol, smooth scroll of the chips) is the kit's play and speed.
- No exam questions (AE401/AE402 in the section are DL-DE-BY 2.0 answer material).

## Deviations from the task

- None from the task file. From the original: 16 symbols instead of 32, decisions and error tally added (above).

## Term pairs

Not in `kit/glossary.js`; written out in both tables, Croatian from the 50ohm-contents-hr `TRANSLATION_GLOSSARY.md`
and `sections/psk.md`. For the coordinator to add with `"src": "simdeck"`:

| en | hr |
|---|---|
| phase-shift keying (PSK) | fazna manipulacija (PSK) |
| quadrature phase-shift keying (QPSK) | kvadraturna fazna manipulacija (QPSK) |
| constellation diagram | konstelacijski dijagram |
| symbol | simbol |
| decision region | područje odluke |
| Gray code | Grayev kod |
| phase (of a symbol) | fazni položaj |

## Shared requests

- **Kit**: `.sd-ctl { display: flex }` in `kit/kit.css` overrides the `hidden` attribute the kit sets for a param
  whose `visible()` is false, so a hidden control still shows. Worked around in the page
  (`.sd-ctl[hidden] { display: none; }`, as `sims/fourier`, `sims/amdahl` and `sims/zfs-btrfs-lab` do). Smallest
  fix: add `.sd-ctl[hidden] { display: none; }` to `kit.css`. `sims/lora-mesh` and `sims/radio-networks` hide their
  seed sliders the same way without the workaround *(check)* whether they show.

Tag `modulation` and topic `radio` exist in `tags.json`.

## Checks

- `node --test sims/qpsk/sim.test.js`: 19 tests. Each rule broken once (both axis tie-breaks, −0 phase, a mapping
  point, the order, σ scale, second-bit error count, symbol-error count, Fisher–Yates range, I noise used for Q,
  the zero-draw guard, Box–Muller angle, noise index) makes at least one fail.
- `npm run gate -- qpsk`: pass (manifest, tests, build, browser 62/62, tokens, scope), no exceptions.
- Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale and 375×812 in hr and en, plus 60 % at step 16
  (hr, en, dark, phone) and the two-bit preset at step 2; no console errors or warnings.
- Not checked: a real projector; the Croatian terms with the HRS translation team.

## Time

Start to done: about 20 minutes by the machine clock (2026-10-03 08:12–08:32 CEST), one session.
