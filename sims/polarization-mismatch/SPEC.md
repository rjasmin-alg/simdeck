<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# polarization-mismatch: specification

Task `docs/tasks/w3/polarization-mismatch.md`, catalogue `ant-tx-rx-polarization` (§4.15; shared model 4 of §5.26).
Class: explorer. Builds on `polarization` (its module `polarization.js`, copied, see §2).

**One concept.** The transmitting and receiving antennas need not match. The wave between them carries a polarization
vector (a line, an ellipse or a circle, and for an ellipse or a circle a sense of rotation). The receiving antenna takes
its projection, the polarization loss factor PLF = |ê_w·ê_r*|², in dB. Vertical against horizontal loses (in theory)
everything; vertical against a 45° slant 3 dB; linear against circular 3 dB at any angle; right-hand against left-hand
circular almost everything. A small loop's E lies in its own plane, so a dipole along the loop's axis is crossed with it.
A circular wave is two crossed dipoles fed 90° apart, and amplitude or phase errors make it elliptical (axial ratio). A
reflection flips the sense of a circular wave; Faraday rotation turns a linear wave by an angle that drifts, so a fixed
linear antenna fades and a circular one does not.

## 1. Params, ranges and tie-breaks

| Param | Meaning | Range | Default |
|---|---|---|---|
| `tx`, `rx` | antenna at each end: `v` vertical dipole, `h` horizontal, `s` 45° slant, `r` right-hand circular, `l` left-hand circular, `loop` small loop | list | `v`, `v` |
| `txRot`, `rxRot` | the antenna turned about the path, counterclockwise in the view (§2), added to its base tilt | 0 … 180°, step 5 | 0 |
| `amp` | circular Tx only: the second dipole's feed amplitude, per cent of the first | 0 … 100, step 5 | 100 |
| `ph` | circular Tx only: the feed phase between the two dipoles | 0 … 180°, step 5 | 90 |
| `path` | `direct` (free space), `bounce` (one reflection off a flat conducting surface), `iono` (through the ionosphere, Faraday rotation) | list | `direct` |
| `om` | Faraday angle Ω (`iono` only) | 0 … 359°, step 1 (it drifts 1° a frame), wraps | 0 |
| `t` | time as the phase ωt at the receiver | 0 … 355°, step 5, wraps | 0 |

Base tilts (angle of E from horizontal, counterclockwise in the view): `h` 0°, `s` 45°, `v` 90°, `loop` 0° (a loop
lying flat, its plane holding the path); `r`, `l`: the first dipole horizontal, the second vertical.

Tie-breaks (tested first):

1. Out-of-range numbers are clamped (rotations to 0 … 180, `amp` to 0 … 100, `ph` to 0 … 180); a non-number gives the
   default. An unknown antenna is `v`, an unknown path `direct`. 0° and 180° turns are both allowed and are the same line.
2. `om` and `t` wrap into [0, 360): 360 is 0, −5 is 355; a non-number (or a boolean) gives the default.
3. A line's tilt is in [0, 180); 180 is 0. A circle has no tilt (`null`).
4. Classification of a polarization by its normalized Stokes parameter s3 (exactly 0 for a real vector): linear when
   |s3| < 1e-12 (no sense, axial ratio ∞, reported `null` in dB), circular when |s3| > 1 − 1e-12 (axial ratio 0 dB,
   tilt `null`), elliptical between, with minor/major q = tan ε, sin 2ε = |s3| (Kraus, the Poincaré sphere's latitude
   2ε *(check)*); the sense is the sign of s3 (> 0 right-hand in this view), so kind and sense never disagree. Not from the ellipse's minor axis: √(mean − dev) loses half its digits near a line (a 65° line gave
   q = 7·10⁻⁹). Rounding residue below 1e-12 is 0, so the exact cases are exact.
5. PLF classes (a PLF above 1 − 1e-12 is reported as exactly 1), in this order: `crossed` when PLF < 1e-12 (shown as −∞ dB, `plfDb` `null`); `matched` when PLF > 1 −
   1e-9; `lincirc` when one of the arriving wave and the receiving antenna is linear and the other circular (PLF ½
   exactly); `partial` otherwise.
6. `amp` 0 or `ph` 0 or 180 turns a "circular" Tx into a linear one; it is then reported as linear (the list name
   stays). `amp`, `ph` do nothing for the other antennas.
7. A circular receiving antenna has no angle: turning it changes only the phase of its voltage, never the PLF; the page
   hides its rotation slider.
8. Zero power has no dB value (`null`; −∞ is not JSON).

## 2. Frame, conventions and the module

The path runs along +x from Tx to Rx, y across, z up (as in `polarization`). **The view** is from behind the wave,
looking along the path from Tx towards Rx: right h = −ŷ, up v = ẑ. Every angle on the page (tilt, rotation, Ω) is
counterclockwise in this view, from right towards up. Phasors use e^{+jωt}: the field at phase φ is Re(ê·e^{jφ}).

**Sense (IEEE, Balanis §2.12.1 *(check §)*, Kraus ch. 2 *(check)*):** right-hand when the field turns clockwise seen
from behind the wave (the thumb of the right hand along the travel, the fingers along the turn). In the view, right-hand
circular is ê = (h + j v)/√2: Re = h cos ωt − v sin ωt, right → down → left, clockwise. In 3-D the turn axis of
Re(ê e^{jωt}) is Im ê × Re ê; right-hand when it points along the travel k̂.

**The PLF.** The catalogue writes |ê_tx·ê_rx*|²: ê_rx is the receiving antenna's polarization written as **the wave it
takes in full**, in the same view as the arriving wave. A right-hand antenna takes right-hand waves, so it is (h + jv)/√2
in the view at either end. `polarization.js` uses the bilinear form V = l·E (Balanis §2.15, eq. 2-92 *(check)*), with
each antenna's vector the field it would *send*; a receiving antenna sends the conjugate of the wave it takes (a
right-hand antenna sending back towards Tx has (h − jv)/√2 in this view). So V = ê_w·conj(ê_rx) and PLF = |V|², the
same number both ways. Independent check (tests): the Poincaré sphere, PLF = (1 + s_w·s_rx)/2 with the normalized
Stokes vectors (Kraus, the polarization-matching factor cos²(MM′/2) *(check)*), and the signed-axial-ratio formula
PLF = ½ + [4 r_w r_a + (1 − r_w²)(1 − r_a²) cos 2Δτ] / [2(1 + r_w²)(1 + r_a²)] (Stutzman, *Polarization in Electromagnetic
Systems*, *(check)*), agree to 1e-12 on 2000 random pairs (script in NOTES.md, Checks).

**The module.** `polarization.js` is copied from `sims/polarization/polarization.js @ f39d4ae` with every function
unchanged; five pure functions are added for this page (marked in the file; promotable additively):
`conj(e)`; `sense(e, k)` (+1 right, −1 left, 0 linear: the sign of (Im e × Re e)·k̂ over |e|², |·| < 1e-9 is 0);
`stokes(e, u1, u2)` (normalized s1 = |x|² − |y|², s2 = 2 Re(x̄y), s3 = 2 Im(x̄y) over |e|², x, y the components along
u1, u2); `rotate(e, n, deg)` (Rodrigues, right-handed about the unit axis n); `mirror(e, n)` (a perfect conductor with
unit normal n: −e + 2(e·n)n, the tangential part reversed, the normal part kept).

## 3. Rules

1. **Antennas.** A linear antenna at tilt τ: ê = cos τ·h + sin τ·v. A small loop with the path in its plane, tilted τ:
   the same ê. Its far field is E_φ about its axis (a magnetic dipole, Balanis §5.2, eq. 5-27b *(check)*), so E lies in
   the loop's plane, across the path: a flat loop is horizontally polarized, a dipole along its axis (vertical) is
   crossed with it. Crossed dipoles (Tx): dipole 1 at τ = rot, dipole 2 at rot + 90°, fed with amplitude a = amp/100 and
   phase ±ph: ê ∝ u1 + a·e^{±j·ph}·u2 (+ for `r`, − for `l`), normalized; a = 1, ph = 90 is circular. The receiving
   circular antenna is ideal: (u1 ± j u2)/√2.
2. **Cos law between lines.** Two lines at Δ: PLF = cos²Δ. v vs h: 0 (−∞); v vs s: 0.5 (−3.01 dB); 30°: 0.75 (−1.25 dB);
   60°: 0.25 (−6.02 dB).
3. **Linear against circular: ½ at any angle** (−3.01 dB), whichever is the sender, for every tilt.
4. **Circular against circular:** the same sense 1 (0 dB), opposite senses 0 (−∞).
5. **Errors make an ellipse.** AR = major/minor, in dB 20·log10 AR. a = 1, ph = 80: AR 1.524 dB, tilt 45°, into R
   0.9924, into L 0.0076 (−21.2 dB). a = 0.9, ph = 90: AR 0.915 dB (AR 1.111), tilt 0°. a = 0.5, ph = 90: AR 6.02 dB
   (2.000), into R 0.9, into L 0.1. a = 1, ph = 45: AR 7.66 dB, tilt 45°. a = 0.9, ph = 80: AR 1.780 dB, tilt 29.35°,
   into L 0.010317 (−19.86 dB), into R 0.98968 (−0.045 dB). An ellipse into an ideal circle: (r ± 1)²/(2(r² + 1)), + for
   the same sense. ph = 0 or a = 0: linear (into either circle ½).
6. **A reflection mirrors the wave.** Off a flat perfect conductor the tangential E reverses and the normal E stays. In
   each leg's view (behind the wave; h across the plane of incidence, v at right angles to the leg in that plane) this is
   (e_h, e_v) → (−e_h, e_v) for any grazing angle: right-hand comes back left-hand, a 45° slant as 135°, vertical and
   horizontal stay. So R into R after one bounce: 0 (−∞); a 45° slant into a 45° slant: 0.
7. **Faraday rotation turns the wave about the path by Ω** (quasi-longitudinal: the two circular modes travel at slightly
   different speeds, so their phase difference turns a line; a rotation of ê by Ω is exactly the phases e^{∓jΩ} on the
   two circular parts). A line turns by Ω: v into v gives cos²Ω (Ω = 60°: 0.25, −6.02 dB; 90°: crossed); a circle only
   changes phase: R into R stays 1, v into R stays ½, for every Ω. Ω grows with the electron content along the path and
   the magnetic field along it and falls as 1/f² (ITU-R P.531 *(check)*: Ω = 2.36·10⁴ B·N_T / f², rad); it drifts as the
   ionosphere changes, so a fixed linear antenna fades and a circular one does not.
8. **Time.** The field at the fraction f of the path is Re(ê(f)·e^{jφ}), φ = ωt + 360°·N·(1 − f), N = 3 wavelengths
   drawn; ê(f) is the Tx wave before a bounce at f = ½ and the mirrored one after it; through the ionosphere (f from 0.3
   to 0.7) the angle grows linearly from 0 to Ω. At the receiver (f = 1) the field is Re(ê_arr e^{jωt}) and the voltage
   u = Re(V e^{jωt}), V = ê_arr·conj(ê_rx), |V|² = PLF. A crest travels from Tx towards Rx as ωt grows.

## 4. Page

- **Stage, left: an oblique view of the path.** Tx at the left, Rx at the right, the wave as E sticks along the path with
  the curve through their tips (a line, a flat wave; a circle, a helix); direct: a straight path; bounce: a V off a
  shaded conducting surface, the bounce point marked; iono: a shaded band in the middle where the sticks turn. The
  antennas: a wire, crossed wires (circular, "90°"), a ring (loop).
- **Stage, right: two views from behind the wave**: "leaving Tx" (the Tx antenna, the sent ellipse with its sense
  arrow and the field now) and "arriving at Rx" (the arriving ellipse, the field now, the receiving antenna as the wave
  it takes in full: a thick line, or a thick circle with its sense arrow; for a line the drop of E onto it).
- **Readout table**: sent wave, on the way, arriving wave, the receiving antenna takes, PLF (% and dB), voltage (% of the
  matched case).
- **Plot**: PLF in dB (0 … −30, below that −∞ at the floor) against the Rx turn (0 … 180°) on `direct` and `bounce`;
  against Ω (0 … 360°) on `iono`, with a dashed comparison: the same Tx into a right-hand circular antenna (or into a
  vertical one when the Rx is circular), always at its own turn 0. Samples every 2° (turn) and 3° (Ω). A marker at the
  current value (at 0 for a circular Rx, which has no turn). `flipped` in the state: the wave arrives with the opposite
  sense to the one sent.
- **Time**: play (P), the scrubber in the transport bar, → / PgDn and ← / PgUp ±15°, Home 0°, End 355°; reduced motion
  jumps 45° a second (as in `polarization`). On `iono`, playing also drifts Ω, 1° a frame (reduced motion: 15° a second).

## 5. Presets (keys 1–6)

| id | tx | rx | other | What to see |
|---|---|---|---|---|
| `vh` | v | h | | crossed: PLF 0, −∞ dB, although the field is there |
| `lincirc` | v | r | | PLF 0.5, −3.01 dB; turning the Tx changes nothing |
| `rl` | r (amp 90, ph 80) | l | | elliptical R, AR 1.78 dB, tilt 29.4°; into L PLF 0.0103, −19.86 dB: almost all lost |
| `loop` | v | loop | | the flat loop is horizontal: crossed, −∞ |
| `bounce` | r | r | path bounce | arrives left-hand: crossed, −∞ |
| `faraday` | v | v | path iono, Ω 60 | arrives at 150°: PLF 0.25, −6.02 dB; play drifts Ω, the signal fades |

## 6. Legend, captions, misconceptions

- Legend: the wave's E, the receiving antenna (the wave it takes), the sense of rotation, the ionosphere / the conducting
  surface where shown.
- Caption: what Tx sends; what the path does; the PLF sentence for the class (crossed, matched, lincirc, partial), with the
  special sentences for cross-sense circles, the bounce and Faraday, and the loop sentence only where it is true (a flat,
  unturned loop at one end and a vertical line at the other).
- Misconceptions: "a circular antenna receives a linear wave fully" (½, at any angle); "R and L are both circular so they
  match" (crossed); "a loop is vertically polarized because it stands up / horizontally because it lies flat" (E is in its
  plane: flat is horizontal); "a reflection does nothing to polarization" (it flips the sense); "a slow fade is the
  transmitter" (Faraday rotation against a fixed linear antenna); "a 45° slant is 45° for both owners" (angles here are in
  one view; each owner facing the other sees the other's slant mirrored).

## 7. Out of scope

The antenna patterns (`polarization`, `ant-dipole-length`); multipath sums of a direct and a reflected wave (fading);
real ground with Brewster's angle (a perfect conductor only); the ionosphere's own refraction and its elliptical
characteristic modes (quasi-longitudinal Faraday rotation only); absolute field strength and voltage (relative only:
the PLF is a ratio).
