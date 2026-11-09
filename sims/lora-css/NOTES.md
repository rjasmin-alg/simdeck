<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lora-css: notes

Task `docs/tasks/w3/lora-css.md` (catalogue `ham-lora-css`, §4.10). Built from `kit/template` (`kit/new-sim.sh`).
Explorer; topic `radio`, tags `radio-networks`, `modulation`, level `core`.

## Decisions

- **Three views of the plot.** "The symbol duration drawn to scale" needs a fixed time axis, but no single fixed
  window shows both an SF7 packet (14–144 ms) and an SF12 data symbol (32.8 ms each, after 400 ms of preamble). So
  the plot has a `view` param with three buttons under the plot (not in the panel, which had no room): **first
  100 ms** (default, fixed scale: at SF7/125 kHz a packet of up to 50 bytes at 4/5 fits with its end mark, SF12 shows
  three preamble chirps), **whole packet**, and **4 symbols** (the first four data symbols, wide enough to show each
  value with a dot and the value in decimal and, where it fits, as SF bits). Chirps crossing the window's edge are
  cut by a clip path. The task names no such param; it is a deviation
  (below).
- **Frequency axis** fixed at ±250 kHz, so the band drawn (dashed box, "BW = …") widens with BW.
- **Sync and down-chirps.** The formula's 4.25 symbols are drawn as two sync-word up-chirps (offsets 3/16 and 4/16 of
  2^SF, illustrative) and 2¼ down-chirps, bracketed "sync 4.25", so the formula's 4.25 is visible.
- **Data values** are illustrative (seeded by SF and payload): the model packs no real payload, since whitening,
  coding and interleaving are out of scope. They change with SF and payload, not with BW, CR or n.
- **Range reference** is SF7 at 125 kHz, so a wider bandwidth shows its cost in the range bar (SF7/500: × 0.5). The
  caption compares with SF7 at the **same** bandwidth, so the task's caption ("23 times longer … about 4 times")
  holds at every BW. The bars' reference tick is SF7/125 kHz with the same payload and CR; a line under the bars says
  so and names the full scale.
- **Bars, fixed full scale** (SF12, 125 kHz, 50 bytes, 4/8, free space), linear: the 23× between SF7 and SF12 is
  seen as a sliver against a long bar. The value is printed on every bar.
- **Changed** marks a bar (the kit's `sd-changed`) when its value moved by more than 10 % at the last change of
  params, presets and view changes included (a view change clears the marks); the kit's language switch reloads the
  page, which clears them too.
- **The table's SF cells are buttons** that set SF (a shortcut; the slider is the main control).
- **Bits per symbol with DE.** The task's caption says "carries 12 bits" at SF12, but with low-data-rate optimisation a
  data symbol carries SF − 2. Where DE is on (SF11/125, SF12/125, SF12/250) the caption adds "(data symbols 10:
  low-data-rate optimisation)", so it agrees with the explanation (the card keeps SF bits, for room).
- **Legend** (short labels, so the header stays on one row at 1920×1080): up-chirp (preamble, blue), down-chirp
  (orange, also the sync part), symbol (green dot), preamble bracket, wrap (ink dashes, distinct from the faint dotted
  symbol separators in grayscale), changed > 10 %. The range bar is not hatched.
- **Fit**: a script loaded 144 settings (hr/en × SF 7, 8, 11, 12 × three BW × n × payload 1/21/50, CR 4/8) at
  1920×1080 and found no overflow of the stage, the right column or the page.
- **Captions**: SF7 says the wait (5.6 s); SF8–12 follow the task's caption (vs SF7: time ×, range ×, environment);
  every caption adds the SNR below the noise (misconception 3); BW ≠ 125 adds how much shorter a symbol is and how many
  dB the sensitivity loses. Misconceptions 1 (SF12 "better") and 2 (LoRa ≠ LoRaWAN) are in the explanation.
- **Only "LoRa"** is named (the concept depends on it, COMMON §1); the vendor and the documents stay in Sources here.

## Deviations from the task

- **Low-data-rate optimisation:** the task says DE = 1 "for SF11 and SF12 at 125 kHz". The model uses the data
  sheets' rule behind it, "symbol longer than 16 ms", which gives the same at 125 kHz and also turns DE on for SF12 at
  250 kHz (16.384 ms) *(check)*. No preset is affected (SF12/250, 20 B: 28 symbols either way).
- **Extra param `view`** (window / packet / symbols), shown as buttons under the plot, hidden in the panel (as
  `fsk-psk-ask`'s seed) to keep the panel on one screen at 1920×1080. In the URL like any param.
- **`n` choice labels**: "slobodni prostor / izgrađeno" ("free space / built-up").
- **Preset `sf9-bw`** sets 250 kHz (the middle); its hint lists 125 / 250 / 500 kHz, and the BW buttons are one click.
- **Preset `sf-step`** sets SF11; the table's SF10 and SF11 rows hold the comparison (the hint says so).
- **State** has the task's fields plus `de`, `chips`, `payloadSymbols`, `vsSf7`, `scale`, `ref`, `table`, `span`;
  `chirps` items carry `kind` and `dur` beside `start` and `offset`.

## Numbers checked

With a script (scratchpad `nums.py`, independent of `sim.js`) before coding, then in `sim.test.js`. All of the task's
preset numbers agree:
- SF7/125/20 B/4/5: T_s 1.024 ms, 43 payload symbols, 56.576 ms, 5468.75 bit/s, −124.53 dBm, wait 5.60 s;
- SF12: 32.768 ms, 28 symbols (DE on), 1318.9 ms = 23.31 × SF7, 292.97 bit/s, −137.03 dBm, × 4.217 (n 2) and × 2.276
  (n 3.5), wait 130.57 s;
- SF9 at 125 / 250 / 500 kHz: 185.3 / 92.7 / 46.3 ms; sensitivity steps 3.01 dB;
- SF10 → SF11: 370.7 → 741.4 ms, 2.5 dB;
- full scale SF12/125/50 B/4/8: 88 payload symbols, 3284.99 ms;
- tie-breaks: PL 5 at SF7 → 18 symbols (exact quotient 2), PL 6 → 23; PL 0 implicit header no CRC at SF12 → 8.
- Mutation run: 28 mutations of `sim.js` (T_s, DE strict/off, ceil, clamp, H sign, DE divisor, R_b, SNR step, NF,
  range exponent, n built-up, duty factor, 4.25, preamble, >10 % tie, quarter down-chirp, wrap point, data value
  range, data seed, range reference, same-BW comparison, payload bound, caption base environment, table environment,
  fixed window, preset payload, wait bar key); every one fails at least one test.

## Sources

- Semtech, *LoRa Modem Designer's Guide* AN1200.13 (T_s, R_b) and the LoRa transceiver data sheets (SX1276/77/78/79
  §4.1.1.6–7 "Time on air", SNR table; SX1261/2 low-data-rate optimisation). Not available offline: the rules are the
  task file's statement of them.
- ETSI EN 300 220 (868 MHz sub-band duty cycle 1 %).
- `~/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md` (LPWAN, LoRaWAN: low throughput, long range,
  unlicensed spectrum) and `~/projects/single-page-labs/lora-mesh-usporedba-v3.html` ("LoRa ≠ LoRaWAN") for the
  explanation's last paragraph. `related` names `lora-mesh` (the imported page).
- Lora-Wideband-Decoder (PolyForm Noncommercial): catalogue seed, idea only; not opened.

## Unchecked *(check)*

- SNR limits −7.5 … −20 dB (data sheet table): from the task, not checked against the data sheet.
- DE rule "T_s > 16 ms" (and so SF12 at 250 kHz): from memory of the data sheets, not checked.
- 1 % duty cycle for the EU 868 MHz sub-band (ETSI EN 300 220): from the task, not checked.
- NF 6 dB *(derived)* and the path-loss exponents 2 / 3.5 *(illustrative)*: the task's choices.
- Sync-word offsets 3/16 and 4/16 of 2^SF: illustrative, not from a source.
- Croatian terms marked (check) in the task: cvrkut (chirp), faktor širenja, vrijeme u eteru, radni ciklus, bilanca
  veze.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr | source |
|---|---|---|
| chirp | cvrkut *(check)* | task file |
| spread spectrum | prošireni spektar | task file (50ohm `vielfachzugriff`) |
| spreading factor | faktor širenja *(check)* | task file |
| bandwidth | širina pojasa | task file |
| time on air | vrijeme u eteru *(check)* | task file |
| sensitivity | osjetljivost | task file |
| duty cycle | radni ciklus *(check)* | task file |
| link budget | bilanca veze *(check)* | task file |
| preamble | preambula | simdeck |

## Shared requests

None.

## Review (playbook §7.4)

A fresh reviewer (a separate agent with no part in the build) read the code against `SPEC.md` and the task,
re-derived every rule over 1008 settings with its own Python model (all agree to rounding), ran 60 mutations (52
caught; 3 harmless: sync offsets, `|| 0` in `round`, a non-rule field) and ran the gate. Fixed after the review:
- the chirp crossing the right edge of the 100 ms window was squeezed into the last pixels (a near-vertical line at
  SF8–12); chirps now use unclamped coordinates and the clip path cuts them;
- "BW = 500 kHz" sat on the bracket row; it is drawn only when the band leaves room above it (the ±250 axis shows 500);
- Croatian caption genitive: "Paket od 1/21 bajta" (new key `bytesGen`);
- test gaps: the caption's SF7 base and the table now tested in built-up; the 100 ms window tested where the packet is
  shorter; preset payload and CR asserted; each bar's key in `changed` tested on its own;
- bits per symbol with DE (above); NOTES' window range (14–144 ms) and the language-switch claim corrected;
- nits: legend (sync/down-chirp entry, wrap in ink, separators fainter, no hatch), unused keys removed, dBm in the
  table header, "possible offsets" with 2ⁿ in superscript, fewer time ticks on narrow plots, "kraj"/"end" kept
  inside the plot, Croatian wording ("za 6 dB lošija", "prigušenje raste s …"), the duty cycle called a sub-band
  and the 99× wait "simplified", the test file's run line.
Left as is: time on air and wait bars have the same proportions (wait = 99 × time on air; the task asks for both);
switching the view clears the changed marks.

## Timing

Start 17:50 (brief read), first gate pass 18:00, review 18:03–18:10, fixes and final gate 18:16 (one session, about
26 minutes).
