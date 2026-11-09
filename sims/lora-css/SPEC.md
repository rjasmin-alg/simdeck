<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lora-css: LoRa chirp spread spectrum

One concept: **chirps, spreading factor against airtime against range.** The spreading factor SF and the bandwidth
BW set how long one chirp (one symbol) lasts; from that follow the time on air of a packet, the raw bit rate, the
sensitivity and so the range, and the silence a 1 % duty cycle imposes after each packet. Class: explorer (the state
is derived from the params). Task: `docs/tasks/w3/lora-css.md`; catalogue `ham-lora-css` (§4.10).

Sources (vendor-specific, because LoRa is one vendor's modulation): Semtech, *LoRa Modem Designer's Guide*
(AN1200.13), and the "Time on air" section and the sensitivity table of Semtech's LoRa transceiver data sheets
(SX127x, SX126x), cited as *data sheet*; ETSI EN 300 220 for the 868 MHz duty cycle. None was available offline:
every rule below is the task file's statement of them, and the numbers marked *(check)* were not checked against
the documents (NOTES.md). Numbers in this file are checked by `sim.test.js` and were first computed with a script.

## Units and constants

| Name | Value | Why |
|---|---|---|
| time | ms (T_s, time on air), s (duty-cycle wait) | |
| `SFS` | 7 … 12 | the spreading factors (task) |
| `BWS` | 125, 250, 500 kHz | task |
| `CRS` | 1 … 4, coding rate 4/(4 + CR) = 4/5 … 4/8 | task |
| `PREAMBLE` | 8 programmed preamble symbols | task, data sheet |
| `SYNC` | 4.25 symbols added by the modem: 2 sync-word symbols and 2.25 down-chirps | data sheet (the 4.25 of the formula) |
| header, CRC | explicit header (H = 0), CRC on (CRC = 1) | task |
| `DE_MS` | 16 ms: low-data-rate optimisation on when T_s > 16 ms | data sheet *(check)*; see rule 3 |
| `NF` | 6 dB receiver noise figure | task *(derived)* |
| `KTB` | −174 dBm/Hz | thermal noise at 290 K |
| `DUTY` | 1 % | ETSI EN 300 220, EU 868 MHz sub-band *(check)* |
| `PATH_N` | free space 2, built-up 3.5 | task *(illustrative)* |
| `REF` | SF7 at 125 kHz | the range factor's and the bars' reference |
| `WINDOW_MS` | 100 ms | the plot's fixed window |
| `ZOOM_SYMBOLS` | 4 | the zoomed view: the first data symbols |
| payload | 1 … 50 bytes, default 20 | task |

## Rules

1. **Symbol** (AN1200.13). T_s = 2^SF / BW (ms for BW in kHz). A symbol is an up-chirp that starts at one of 2^SF
   cyclic offsets across BW; the offset is the symbol value and carries SF bits. Every SF step doubles T_s, every
   doubling of BW halves it. SF7 at 125 kHz: 1.024 ms; SF12: 32.768 ms.
2. **Raw bit rate** (AN1200.13). R_b = SF · (BW / 2^SF) · 4/(4 + CR). SF7/125/4/5: 5468.75 bit/s; SF12: 292.97 bit/s.
3. **Time on air** (data sheet). T = (n_preamble + 4.25)·T_s + n_payload·T_s, with
   n_payload = 8 + max(⌈(8·PL − 4·SF + 28 + 16·CRC − 20·H) / (4·(SF − 2·DE))⌉·(CR + 4), 0).
   - **Tie-break, the ceiling:** an exact quotient is not rounded up (SF7, CR 4/5, PL 5: (40 + 16)/28 = 2 → 18
     symbols; PL 6: 64/28 → 3 → 23).
   - **Tie-break, the clamp:** a negative block count is 0 (only reachable with an implicit header, no CRC and an
     empty payload: PL 0 at SF12 → 8 symbols; ⌈−0.8⌉ = −0 also gives 8).
   - **DE** (low-data-rate optimisation) is 1 when T_s > 16 ms: SF11 and SF12 at 125 kHz, SF12 at 250 kHz.
     **Exactly 16 ms is off** (not reachable with these SF and BW: the nearest is 16.384 ms).
     The task says "SF11 and SF12 at 125 kHz"; the 16 ms rule agrees on all of 125 kHz and adds SF12 at 250 kHz
     (deviation, NOTES.md).
   - With DE on, a data symbol carries SF − 2 bits; the card and caption then say so beside the SF bits.
   - Payload and coding rate change only the time on air (and the bit rate through CR), never T_s, the SNR limit,
     the sensitivity or the range.
4. **Below the noise** (data sheet table *(check)*). The demodulator still works at SNR −7.5 dB at SF7, 2.5 dB lower
   per SF step, −20 dB at SF12. Sensitivity = −174 + 10·log₁₀(BW in Hz) + NF + SNR limit *(derived)*:
   SF7/125 −124.53 dBm, SF12/125 −137.03 dBm; doubling BW costs 10·log₁₀2 = 3.01 dB.
5. **Range** *(illustrative)*. Range factor relative to SF7 at 125 kHz = 10^(Δ / (10·n)), Δ the dB of sensitivity
   gained over the reference, n = 2 (free space) or 3.5 (built-up). SF12/125: × 4.217 or × 2.276; SF7/500: × 0.5.
   The caption compares with SF7 at the **same** bandwidth and environment (`vsSf7`), so its "23 times longer, about
   4 times the range" holds at every BW.
6. **Duty cycle** (ETSI EN 300 220 *(check)*). In the 1 % sub-band taken here the device stays silent
   (1/0.01 − 1) = 99 × the time on air after a packet (simplified: the rule is an average over an hour; other 868 MHz
   sub-bands allow 0.1 % or 10 %).

## Chirps (the plot)

The packet's chirps in order, back to back from t = 0: 8 preamble up-chirps (offset 0), 2 sync-word up-chirps
(offsets 3·2^SF/16 and 4·2^SF/16, illustrative), 2.25 down-chirps (two whole and one quarter), then n_payload data
chirps. The data values are illustrative: drawn from a seeded generator (mulberry32, seed SF·131 + PL), so they
depend on SF and payload only and cover 0 … 2^SF − 1; a real modem whitens, codes and interleaves the payload first
(out of scope). An up-chirp with offset k starts at k/2^SF of the band, rises across BW in T_s and **wraps** from the
top to the bottom at 1 − k/2^SF of the symbol (dashed jump); offset 0 never wraps. The last chirp ends at the time on
air.

Views (param `view`): `window`, the first 100 ms at a fixed scale, so a change of SF or BW changes the chirps' width
and slope; `packet`, the whole packet; `symbols`, the first 4 data symbols, wide enough to show each value, and its SF bits
where they fit (not at SF12 on a 1920 px screen). Chirps are cut at the window's edges by a clip path, never squeezed.

## Bars, table, "changed"

- Bars: time on air, range factor, duty-cycle wait. Full scale fixed at the longest and furthest setting (SF12, 125
  kHz, 50 bytes, CR 4/8, free space: 3285 ms, × 4.217, 325 s); a reference tick at SF7/125 kHz with the same payload
  and CR (range: × 1).
- Table SF7 … SF12 at the current BW, CR, payload and n: T_s, time on air, sensitivity, range, wait; the current row
  outlined and marked ▶. Clicking an SF sets it.
- **Changed** marks the bars that changed by **more than** 10 % since the last change of params; exactly 10 % is not
  marked (tie-break).
- Out-of-range params fall back to the defaults (SF 7, BW 125, CR 1, payload 20, free space, window).

## Presets (payload 20 B, CR 4/5)

| id | setting | expected |
|---|---|---|
| `sf7` | SF7, 125 kHz | T_s 1.024 ms, 43 data symbols (55.25 in all), 56.6 ms, 5.47 kbit/s, −124.5 dBm, wait 5.6 s |
| `sf12` | SF12, 125 kHz | T_s 32.8 ms, 28 data symbols, 1318.9 ms (23.3 × SF7), 293 bit/s, −137 dBm, × 4.22 / × 2.28, wait 130.6 s |
| `sf9-bw` | SF9, 250 kHz | SF9 at 125 / 250 / 500 kHz: 185.3 / 92.7 / 46.3 ms; each doubling of BW costs 3 dB |
| `sf-step` | SF11, 125 kHz | SF10 → SF11: 370.7 → 741.4 ms (× 2) for 2.5 dB (rows 4 and 5 of the table) |

## Out of scope

LoRaWAN classes and the network server, mesh routing (`lora-mesh`), regional channel plans, the dechirp/FFT receiver,
whitening, Hamming coding, interleaving and Gray mapping, the header's reduced rate.
