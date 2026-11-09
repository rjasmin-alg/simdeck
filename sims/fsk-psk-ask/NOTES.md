<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fsk-psk-ask: notes

Task `docs/tasks/w3/fsk-psk-ask.md` (catalogue `ham-fsk-psk-ask`, §4.10). Built from `kit/template` (`kit/new-sim.sh`).
Explorer; topic `radio`, tag `modulation`, level `intro`.

## Decisions

- **Time in bits.** The traces are drawn in symbol periods, not seconds: the carrier is 3 cycles a bit (ASK, PSK),
  FSK 2 and 4 cycles a bit, so every bit starts at the same carrier phase and the BPSK jump falls exactly on the
  boundary. With AFSK on, only the FSK trace changes (1 and 1.83 cycles a bit); its label gives the real numbers
  (1200 Hz, 2200 Hz, a bit of 833.3 µs). ASK and PSK keep their 3 cycles: they have no audio counterpart here.
- **Which FSK tone is 1.** Generic FSK: 1 (mark) is the higher tone, 4 cycles; 0 (space) 2 cycles, two cycles apart
  so the tones are orthogonal over a bit and the symbol view shows two clean points. AFSK follows APRS: the mark
  (1200 Hz) is the lower tone. The page states both mappings next to the trace.
- **Continuous-phase FSK.** The phase runs on across bit boundaries (as an AFSK modem), so the FSK trace never jumps
  and only PSK shows jumps. Consequence with AFSK: the two tones are not orthogonal over 833 µs and each bit starts
  at another phase, so even without noise the FSK points lie near, not on, the ideal crosses (the crosses are the
  bit measured from phase 0). That is the real behaviour of a non-coherent receiver on Bell 202 tones; it is
  noted in SPEC.md, not hidden.
- **The receiver** (task rule 5): coherent correlation for ASK and PSK (one shared I/Q reference, so ASK and PSK see
  the same Q noise), non-coherent tone magnitudes for FSK. A tie decides 0 in every scheme (task gave no tie rule).
- **The symbol views.** ASK and PSK in the I/Q plane with the decision boundary dashed (ASK: a circle of radius
  (A0 + A1)/2 round the origin, the envelope decision; PSK: the Q axis, with the unit circle). FSK: the strength at
  f0 against the strength at f1, the two ideal points on the axes labelled 0 and 1 and the diagonal as the boundary.
  That is the task's "two frequency markers", drawn as a plane so the distances of rule 5 can be compared.
- **Band-limited noise.** White per-sample noise strong enough to make OOK fail buries every trace (the receiver
  integrates over 48 samples, the eye does not). The noise is therefore what the receiver's input filter passes:
  0.5–5.5 cycles a bit, which covers all three signals. Out-of-band noise would not change the decisions much; in
  band, the traces stay readable (rms 0.8 against amplitude 1 at 40 %). `SIGMA_MAX = 2` was chosen so the
  `noise-race` preset shows the order clearly with seed 7 (ASK 3, FSK 1, PSK 0 errors); over seeds 1–99 at 40 % the
  means are 1.71, 0.44, 0.01, so the order is the model's, not the seed's.
- **OOK off** gives A0 = 0.5 (50ohm only says "small amplitude"); its symbol distance is then 0.5.
- **Click to flip.** A flipped string is no longer one of the select's patterns; the page then shows the select empty
  (`selectedIndex = -1`) rather than a stale pattern. The flipped cell is marked (`sd-changed`) until another
  setting changes; a preset load marks nothing.
- **Changed marks.** Only the clicked cell, not every bit that differs after a pattern or preset change (that would
  mark most of the row and say nothing).
- **Attribution** sits at the end of the explanation (as `fft-waterfall`), not in the footer: the footer line cost
  the panel the last 11 px of one screen at 1920×1080.

## Deviations from the task

- **Seed control:** the task names a `seed` range 1–99. The seed is still that param (presets, URL, 1–99), but the
  panel shows a **"New noise" button** (key `N`) that steps it, as `qpsk` does; the current seed is written in the
  noise caption. With a slider and every hint the panel was 180 px too tall for one screen.
- **Hints** dropped from the toggles and sliders for the same reason; the click-to-flip hint moved into the bit
  row's label ("Bits sent (click to flip)").
- **URL and language switch:** a flipped bit string is not a select option, so the kit's URL reader falls back to
  the select's `value` (the default pattern, 1011 0010) when the page is reloaded, the language is switched (`L`)
  or such a link is opened: the flip is lost, the stage and the select agree again. Presets and the six patterns
  survive. Only 4- and 8-bit strings can be reached from the page (the model accepts 1–8). See "Shared requests".

## Numbers checked

With a script (scratchpad, `scan.js`/`nums.js`) before coding, then in `sim.test.js`:
- distances ASK 1 (0.5 with OOK off), FSK √2 = 1.4142 (AFSK 1.2068), PSK 2; AFSK ideal FSK points (1.0238, 0.1835)
  and (0.1353, 1);
- AFSK: 1200/1200 = 1 cycle, 2200/1200 = 1.8333 cycles, 1/1200 s = 833.3 µs;
- `noise-race` (seed 7, 40 %): ASK 11110111 (3 errors, bits 1, 5, 7), FSK 11110010 (1, bit 1), PSK 10110010 (0);
  first error with rising noise at 27 % (ASK), 34 % (FSK), 93 % (PSK); OOK off: ASK 2; AFSK on: FSK 0;
- unit noise rms over 384 samples, seed 7: 0.992; mean variance over seeds 1–99 ≈ 1.
- Mutation run: 15 mutations of `sim.js` (each tie-break, OOK, ASK amplitude, f1, continuous phase, AFSK tones,
  180°, jumps, coherent reference, shared noise, seed, band, bits check); every one fails at least one test.

## Sources

- 50ohm.de, sections `ask_fsk_afsk` (ASK, OOK/CW, FSK, "simboli"), `psk` (PSK, BPSK 0°/180°, constellation: ASK on
  the positive I axis, PSK on the circle), `afsk` (AFSK, "A" = audio, APRS 1200 bit/s on 144.800 MHz),
  `modulationsarten`; Croatian translation in `~/projects/50ohm-contents-hr/contents/sections/`. CC BY 4.0,
  50ohm.de-Autorenteam, AJW-Referat des DARC e.V. Summarised, not copied; the one sentence on PSK in the
  `three-ways` caption is the task's own caption, after 50ohm `psk`. Listed in `sim.json` `credits`.
- Bell 202 tones (1200 Hz mark, 2200 Hz space) for APRS AFSK: APRS Protocol Reference 1.0.1 *(check)*.
- SigDigger: catalogue seed, ideas only; nothing looked at or copied.

## Unchecked *(check)*

- Bell 202 mark 1200 Hz / space 2200 Hz as used by APRS (APRS Protocol Reference 1.0.1): not checked against the
  document (not available offline); the numbers agree with 50ohm `afsk` only on 1200 bit/s.
- Croatian "audiofrekvencijska manipulacija (AFSK)": the task marks it (check); 50ohm hr only writes "Audio
  Frequency Shift Keying (AFSK)".

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr | source |
|---|---|---|
| amplitude shift keying | amplitudska manipulacija | 50ohm hr `ask_fsk_afsk` |
| frequency shift keying | frekvencijska manipulacija | 50ohm hr `ask_fsk_afsk` |
| phase shift keying | fazna manipulacija | 50ohm hr `psk` |
| on-off keying | OOK (uključen/isključen nositelj) | 50ohm hr `ask_fsk_afsk` |
| carrier | nositelj | 50ohm hr |
| symbol | simbol | 50ohm hr `ask_fsk_afsk` |
| audio frequency shift keying | audiofrekvencijska manipulacija (AFSK) *(check)* | task file |
| mark / space | oznaka / razmak | simdeck (no 50ohm hr source found) *(check)* |

## Shared requests

- Kit: a free-value param (text, or a select that keeps a value outside its options in the URL), so a click-edited
  bit string survives in a link. Smallest change: `coerce` keeps the raw value for a `select` with
  `free: true`. Not blocking.

## Review (playbook §7.4)

A fresh reviewer (a separate agent with no part in the build) read the diff against `SPEC.md` and the task,
re-derived every number with its own implementation (all agree; the AFSK distance is 1.2068 from the unrounded
points, not 1.2067 from the rounded ones), ran 29 mutations of `sim.js` (25 caught; 3 change no behaviour: a global
FSK reference, a restarted ASK/PSK reference, the Box–Muller guard; 1 real gap) and ran the gate. Fixed after the
review:
- the `bits` select had no `value`, so a reload or language switch after a click wrote `bits=undefined` and left the
  stage and the select disagreeing; now it falls back to the default pattern (deviation above);
- the "all three" caption claimed a 180° shift when no neighbouring bits differ (0000, 11111111); a variant says so;
- SPEC rule 5 now says the AFSK clean points lie near, not on, the crosses; the AFSK distance is 1.2068;
- the explanation qualifies "FSK on the two axes" (without AFSK), "ASK distance 1" (with OOK) and the 180° shift
  (where neighbouring bits differ);
- test gap: the ideal points are now checked to be independent of the noise;
- nits: hr caption "krivo primio", AFSK term in italics in hr, non-breaking spaces in the AFSK label, no
  `translate="no"` on the rule labels (they hold words), the credits no longer claim a verbatim sentence.
Left as is: "New noise" at 0 % steps the seed with no visible change (the caption shows the seed only with noise);
the ASK "0" label touches the decision circle; APRS data is NRZI-coded above the modem (out of scope).

## Timing

Start 17:23 (brief written), first gate pass 17:37, review and fixes, done 17:50 (one session, about 27 minutes).
