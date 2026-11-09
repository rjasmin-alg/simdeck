<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# link-budget: spec

Task `docs/tasks/w3/link-budget.md`, catalogue `ant-link-budget` (§4.15; shared models 4 and 5 of §5.26). An explorer:
no steps, no time axis (nothing here changes in time; fading is a reserve, not an animation). This file fills the
task's empty "Model and presets" section. Every number below was computed by an independent Python script
(`math` only, the formulas as written here) and the JS model matches it to the printed digits; the tests use these
values.

## 1. Tie-breaks

1. **Params are made safe.** Every range is clamped to its bounds and snapped to its step (`RANGES` in `sim.js`); a
   non-number, `null`, `''` or a boolean gives the default. `f` must be one of the five bands; `dish` is true only for
   `true` (the kit parses the URL); anything else gives the default.
2. **Crossed polarization (ψ = 90°).** The polarization loss factor is exactly 0 (`polarization.js` snaps cos 90° to
   0), so the loss is null (−∞ dB), and so are the received power, the margin, the reserve left and both distances.
   Status `crossed`. The caption says that in theory nothing arrives, and that in practice reflections and a slightly
   turned antenna leave something some 20–30 dB down *(check)*. Any ψ below 90° gives a finite loss (85°: 21.2 dB).
3. **Thresholds count as met.** A margin within 1e-9 dB of the fade reserve counts as working (`works`); a margin within
   1e-9 dB of 0 counts as `fading` (the receiver just hears it, with nothing kept). In the model: `works` when
   left ≥ −1e-9, else `fading` when margin ≥ −1e-9, else `fail`.
4. **No cable, no connectors.** A cable of 0 m means the antenna sits on the radio: loss 0, not the 0.2 dB of two
   connectors.
5. **The hidden pair is ignored.** With fixed gains (`dish` false) the dish diameters change nothing; with dishes
   (`dish` true) the gain sliders change nothing. The page hides the pair that does not apply.
6. **A dish smaller than 3 λ across** is flagged `small`; the numbers are still computed from η·(πD/λ)². The caption
   says that such a dish is only roughly a dish and does not reach that gain *(check: rule of thumb, not a book value)*.
7. **Closer than the far-field distance 2D²/λ** of the larger dish, `near` is flagged: Friis's formula assumes each
   antenna is in the other's far field (Balanis §2.2.4 for 2D²/λ of one antenna; antenna-measurement practice uses the
   stricter 2(D_t + D_r)²/λ for two, up to 4× farther: the flag is a lower bound). Only possible with large dishes at
   short range (3 m at 10 GHz: 622.5 m). The caption says "not yet in each other's far field" (the radiating near
   field, not the reactive one of `near-field-coupling`). With fixed gains the flag is never set (no size is known).

## 2. Rules (in the order the received power is built)

Units: power in dBm (dBW + 30), gains in dBi, losses in dB ≥ 0, distance d in metres inside the model and in km on
the page, f in MHz.

1. **Wavelength** λ = c/f, c = 299 792 458 m/s. 145 MHz: 2.0675 m; 435: 0.6892 m; 1296: 0.2313 m; 2400: 0.1249 m;
   10 368: 0.02892 m.
2. **Cable and connectors** on each side: L = α(f)·len/100 + 2 × 0.1 dB, with α(f) = 0.63·√f + 0.0071·f dB per 100 m
   for a thick 50 Ω coaxial cable *(check: fitted to 7 dB/100 m at 100 MHz and 27 dB/100 m at 1 GHz, typical for a
   10 mm solid-dielectric cable)*. α: 8.62 (145), 16.23 (435), 31.88 (1296), 47.90 (2400), 137.76 (10 368) dB/100 m.
   30 m at 435 MHz: 4.87 + 0.2 = 5.07 dB.
3. **Gains.** Fixed gain (`dish` false): G_t and G_r as set. Dishes (`dish` true): G = η·(πD/λ)², η = 0.55 *(check: a typical aperture efficiency,
   Balanis ch. 15 gives 0.5–0.8)*. A 1 m dish: 1.04 dBi at 145 MHz (flagged small), 10.58 (435, small), 20.06 (1296),
   25.41 (2400), 38.12 dBi (10 368).
4. **EIRP** = P_tx − L_tx + G_t (dBm).
5. **Free-space path loss** L_p = 20·log(4πd/λ) (Friis 1946; Balanis eq. 2-118 with both gains 1), split into two
   parts that add up to it exactly:
   - **spreading** over a sphere, 10·log(4πd²/1 m²): EIRP minus this is the power flux density (dBm/m²) at the
     receiver; it does not depend on the frequency.
   - **the isotropic antenna's area** λ²/4π in dB over 1 m² (Balanis eq. 2-111 with G = 1): −4.68 dB (145 MHz),
     −14.23 (435), −23.71 (1296), −29.06 (2400), −41.77 (10 368). It is 0 dB at λ = √(4π) m = 3.545 m, 84.57 MHz.
   1 km at 145 MHz: 75.68 dB. Each doubling of d adds 20·log 2 = 6.02 dB; ten times the distance, 20 dB.
6. **Effective area** of the receiving antenna A_e = G_r·λ²/4π (m²). With fixed gains it falls as λ², 1/f²; a dish's
   A_e = η·πD²/4 stays the same at every band (1 m: 0.4320 m²).
7. **Polarization loss factor** of two linear antennas ψ apart: |ê_tx·ê_rx*|² = cos²ψ (Balanis eq. 2-71; model 4,
   `polarization.js`). The loss is −10·log cos²ψ: 45° → 3.01 dB, 60° → 6.02 dB, 85° → 21.2 dB, 90° → tie-break 2.
8. **Received power** P_r = EIRP − L_p + G_r − L_pol − L_rx (Friis: P_r = P_t·G_t·G_r·(λ/4πd)², each loss a factor).
   Shown also in W and as the rms voltage across the receiver's 50 Ω input, V = √(P·50 Ω): −120 dBm → 0.224 µV.
9. **Margin** M = P_r − S (S the sensitivity); **left** = M − F (F the fade reserve). Status `works` (left ≥ 0),
   `fading` (0 ≤ M < F: a fade deeper than M breaks it), `fail` (M < 0), `crossed` (tie-break 2).
10. **The longest distance.** Every other term is fixed, so P_r(x) = P_r(d) − 20·log(x/d). With the reserve kept:
    d_max = d·10^(left/20); with nothing kept: d_edge = d·10^(M/20). The page also draws P_r(x) against log x.
11. **Distance grid.** The slider steps through the rounded R10 series 1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8 times a
    power of ten, from 0.1 km to 400 000 km (step k: 1 km at k = 0, 10 km at k = 10). Three steps are a doubling
    (exact for 1 → 2 → 4 → 8, 1.25 → 2.5 → 5 and 1.6 → 3.2; 6.3 is 10^0.8 rounded, so 3.2 → 6.3 → 12.5 are 1.97 and
   1.98 times).

## 3. Params

| key | range | default | meaning |
|---|---|---|---|
| `ptx` | 0 … 50 dBm, step 1 | 37 (5 W) | transmitter power |
| `dish` | false · true | false | antennas of fixed gain, or two dishes of fixed size |
| `gt`, `gr` | −10 … 40 dBi, step 0.5 | 0 | the gains (`dish` false) |
| `dt`, `dr` | 0.3 … 3 m, step 0.1 | 1 | the dish diameters (`dish` true) |
| `lt`, `lr` | 0 … 50 m, step 1 | 0 | cable lengths |
| `f` | 145 · 435 · 1296 · 2400 · 10 368 MHz | 145 | the band |
| `dk` | −10 … 56, step 1 | 10 (10 km) | the distance step (rule 11) |
| `psi` | 0 … 90°, step 5 | 0 | polarization mismatch |
| `sens` | −150 … −80 dBm, step 1 | −120 | receiver sensitivity |
| `fade` | 0 … 30 dB, step 1 | 10 | fade reserve |

## 4. Presets (expected outcomes)

1. **`handheld`** Two handhelds, 2 m band: 37 dBm, 0 dBi each, no cables, 145 MHz, 10 km. L_p 95.68 dB, P_r −58.68 dBm
   (260 µV), M 61.32 dB, `works`; d_max 3683 km, d_edge 11 648 km. In free space a handheld reaches thousands of km
   (on the ground the horizon and obstacles stop it long before: out of scope, the caption says so).
2. **`band`** The same handhelds at 2400 MHz: L_p 120.05 dB, 24.38 dB more, all of it from the smaller catching area
   (A_e 0.3402 → 0.001242 m²); P_r −83.05 dBm, M 36.95, `works`, d_max 222.5 km.
3. **`base`** A base station: 47 dBm (50 W), a 10 dBi antenna on 30 m of cable (5.07 dB) at 435 MHz, to a 0 dBi
   handheld 25 km away held at 45° (3.01 dB). EIRP 51.93 dBm, L_p 113.18, P_r −64.26 dBm, M 55.74, `works`, d_max
   4844 km.
4. **`satellite`** A small satellite 2000 km away: 27 dBm (0.5 W), 0 dBi on both ends, 145 MHz, 45°. L_p 141.70 dB,
   P_r −117.71 dBm (0.291 µV), M 2.29 dB < F 10: `fading`; d_max 823.6 km, d_edge 2604.5 km. A 10 dBi receiving
   antenna gives M 12.29, `works`.
5. **`dishes`** Two 1 m dishes, 1 m of cable each, 30 dBm at 1296 MHz, 100 km: G 20.06 dBi each, L_p 134.70 dB,
   P_r −65.61 dBm, M 54.39, `works`. The same dishes at 10 368 MHz: L_p 152.76 (+18.06), each dish 38.12 (+18.06),
   cables 1.58 each: P_r −49.67 dBm, 15.94 dB more than at 1296. At 145 MHz: P_r −84.17 dBm, both dishes flagged small.

## 5. The page

- **Stage, left: the budget as a ladder** in dBm, one row per term: transmitter (level), cable and connectors, transmit
  antenna, EIRP (level), spreading 4πd², the isotropic antenna's area λ²/4π (the two bracketed as the path loss
  20·log(4πd/λ)), receiving antenna, polarization, cable and connectors, received (level). Levels are bars from the
  axis; changes float (up solid, down hatched). The sensitivity is a vertical line through the ladder, the fade
  reserve a band above it, the margin a bracket on the received row. Crossed: the polarization row ends in an arrow
  off the chart and the received row says "nothing".
- **Stage, right top: P_r against distance** on a log axis (0.1 km … 400 000 km): a line falling 6 dB per doubling (a
  step triangle at the current distance shows ×2 and −6 dB), the sensitivity line, the reserve band, the current point,
  and markers at d_max and d_edge.
- **Stage, right bottom: readouts**: λ, the path loss, the receiving antenna's area, P_r (dBm, W, µV across 50 Ω), the
  margin, what is left over the reserve, the longest distance with and without the reserve.
- **Legend**: level bar, gain (solid), loss (hatched), sensitivity line, fade reserve band.
- **Caption** (in order): the status with the margin (with F = 0 the works sentence says nothing is kept); the path loss and its two parts; the antennas (fixed gain: the
  receiving area shrinks as 1/f²; dishes: the area stays, the gains grow, cables aside: their loss grows with f
  too, and with 10 m on each side 1296 → 10 368 MHz loses 3.1 dB instead of gaining); the small-dish or near-field flag; the
  polarization loss when ψ > 0; the doubling rule and the longest distance.

## 6. Misconceptions targeted

- "Higher frequencies are attenuated more in free space." Free space absorbs nothing; the spreading part is the same at
  every band. A receiving antenna of fixed gain is smaller at a shorter wavelength and catches less.
- "Double the distance, half the signal." Half the field; a quarter of the power: 6 dB.
- "The margin is spare." Part of it is needed for fading.
- "dBi adds power." Gains only redirect it (gain-directivity); here they are terms in the sum.

## 7. Out of scope

The ground and the horizon (the radio horizon, the Fresnel zone, ground reflection: `ant-ground-image`,
`skip-distance`), absorption by rain and gases above 10 GHz, noise temperature and the noise figure behind the
sensitivity, fading itself (the `fading` page), mismatch (SWR) losses, circular polarization (`polarization-mismatch`).

## 8. Terms

proračun veze *(check, against "bilanca snage")*; prigušenje kabela (50ohm-contents-hr); osjetljivost prijamnika
(50ohm-contents-hr); fading (50ohm-contents-hr: *fading* (slabljenje)); gušenje u slobodnom prostoru *(check)*;
efektivna površina antene *(check)*; rezerva za fading *(check)*; rezerva / pričuva *(check)*; gustoća toka snage
*(check)*; dobitak, dBi, EIRP, izotropni zračitelj, polarizacija (50ohm-contents-hr, catalogue §4.15).

## Sources

- H. T. Friis, "A Note on a Simple Transmission Formula", *Proc. IRE* 34 (1946), 254–256: P_r/P_t = A_r·A_t/(d²λ²).
- C. A. Balanis, *Antenna Theory*, 3rd ed., ch. 2: §2.11 effective area A_em = λ²/4π·D (eq. 2-111 *(check eq. no.)*),
  §2.12 polarization loss factor |ρ̂_w·ρ̂_a|² (eq. 2-71 *(check)*), §2.17 the Friis transmission equation
  (eq. 2-118 *(check)*), §2.2.4 the far-field distance 2D²/λ; ch. 15 aperture efficiency of reflectors.
- J. D. Kraus, *Antennas*, the chapter on the Friis formula and effective aperture *(check chapter)*.
- 50ohm-contents-hr: prigušenje kabela, osjetljivost prijamnika, fading.
