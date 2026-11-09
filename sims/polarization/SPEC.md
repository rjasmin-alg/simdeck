<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# polarization: specification

Task `docs/tasks/w3/polarization.md`, catalogue `ant-polarization` (§4.15; shared model 4 of §5.26). Class: explorer.

**One concept.** The transverse field a dipole sends out lies in the plane of the wire and the line of sight, so the
wave is linearly polarized along the transmitting dipole (a vertical dipole sends vertical polarization); along the
wire's own axis there is no transverse part and no radiation (the sin θ null); a receiving dipole picks up a voltage
proportional to the cosine of the angle between it and the arriving E, so its power goes with cos² and is zero at 90°
(cross-polarized); the same dipole receives best what it would send best (reciprocity).

## 1. Params, ranges and tie-breaks

| Param | Meaning | Range | Default |
|---|---|---|---|
| `a` | A's rotation from vertical, about the x axis towards +y (across the path) | 0 … 180°, step 5 | 0 |
| `el` | B's elevation seen from A, on an arc in the vertical plane x–z | 0 (level, broadside) … 90° (straight above), step 5 | 0 |
| `b` | B's rotation about the line of sight, from "up" (u1) towards "right" (u2) as B sees A | 0 … 180°, step 5 | 0 |
| `from` | which dipole sends: `a` or `b` | | `a` |
| `t` | time as the phase ωt at the receiving dipole | 0 … 355°, step 5, wraps | 0 |

Tie-breaks (tested first):

1. Out-of-range angles are clamped (a, b to 0 … 180, el to 0 … 90); a non-number gives the default. 0° and 180° are the
   same line: both are allowed for a and b (the slider's two ends), and give the same power with opposite voltage.
2. Time wraps into [0, 360): 360 is 0, −5 is 355. Anything but `'b'` sends from A.
3. An angle of a line (A's polarization τ in B's view) is reported in [0, 180); 180 is 0.
4. The mismatch is the acute angle between the line of E and B's wire, 0 … 90; exactly 90 stays 90 (crossed), never −90.
5. Along A's axis (sin θ = 0) the polarization is undefined: τ, the mismatch and the PLF are `null`, the voltage is 0 and
   the power in dB is `null` (shown as −∞). Rounding residue below 1e-12 (cos 90° = 6·10⁻¹⁷) is 0, so this case is exact.
6. Zero power has no dB value: `pDb` and `plfDb` are `null` (−∞ is not JSON).
7. A negative voltage (B turned past 90° from E) is reported as such (`anti`): the same power, in antiphase.

## 2. Frame and the polarization vector (`polarization.js`)

x along the ground towards B at broadside, y across, z up. The line of sight r̂ = (cos el, 0, sin el). B's view of A:
up u1 = (−sin el, 0, cos el) (in the vertical plane of the path, at right angles to it), right u2 = (0, 1, 0) (the same
everywhere on the arc; looking back from B towards A, +y is on the right). A's wire â = (0, sin a, cos a); B's wire
b̂ = cos b·u1 + sin b·u2, always across the line of sight.

The module (pure, promotable) works with complex 3-vectors so `ant-tx-rx-polarization` can add ellipses and circles:

- `transverse(â, r̂) = â − (â·r̂)·r̂`; its length is sin θ, θ the angle between the wire and the line of sight.
- `dipoleWave(â, r̂)`: the far field of a short dipole is E_θ θ̂ with |E_θ| ∝ sin θ (Balanis eq. 4-26a *(check eq. number)*;
  Griffiths §11.1.2, eq. 11.18 *(check)*). θ̂ at r̂ lies in the plane of â and r̂, at right angles to r̂: it is the
  transverse part of â, reversed. So amp = sin θ and ê = transverse/|transverse| (the sign is a phase reference only).
  This is also the kink picture of `accelerated-charge`: the kink is the transverse part of the charge's motion seen
  along the line of sight.
- `projection(ê, b̂) = Σ e_i b_i` (bilinear): the open-circuit voltage is V = l_e·E (Balanis §2.15, eq. 2-92
  *(check)*). For a short dipole with uniform current l_e = l along the wire (its transverse part; the radial part meets
  no field).
- `plf(ê_w, ê_a) = |ê_w·ê_a|²` (Balanis §2.12.2, eq. 2-71 *(check)*): cos²ψ for two lines at angle ψ. The catalogue
  writes |ê_tx·ê_rx*|²; for real vectors the two forms agree. For complex vectors the bilinear form is matched for two
  facing antennas of the same sense (each vector written as the field that antenna would send, in one frame); the
  conjugate form writes the wave in its own direction of travel. `ant-tx-rx-polarization` settles it with its circles.
- `ellipse(ê, u1, u2)`: tilt, semi-axes and minor/major ratio (0 a line, 1 a circle). Not drawn here (all waves on this
  page are lines); tested so the next page can use it.
- `instant(ê, amp, φ) = amp·Re(ê·e^{jφ})`, the real field at phase φ.

## 3. Rules of the link

1. **The wave lies in the plane of the wire and the line of sight.** A's field towards B is along â − (â·r̂)r̂: at right
   angles to r̂, and â, r̂ and ê are coplanar (triple product 0).
2. **Pattern, sin θ.** Its amplitude is sin θ times the broadside value: el 0 → 1; el 30 → 0.866 (−1.25 dB); el 60 →
   0.5 (−6.02 dB); el 90 with A vertical → 0: end-on, no transverse part, no radiation. A along y (a = 90) is broadside
   to every direction in the x–z plane: 1 at every el.
3. **The wave carries the wire's direction.** At broadside (el = 0) the polarization angle in B's view τ equals a (a
   vertical dipole sends vertical polarization, a horizontal one horizontal). Off broadside τ is the wire's projection seen
   from B: τ = atan2(â·u2, â·u1) = atan2(sin a, cos a·cos el). Example: a = 45, el = 60 → τ = 63.43°, sin θ = 0.7906.
4. **Cos law.** B's voltage over the best case v = â·b̂ = sin θ·cos(b − α), α = atan2(â·u2, â·u1) the angle of A's
   transverse part as an arrow (τ is the same as a line, so |v| = sin θ·|cos(b − τ)|); the PLF is cos²(mismatch). Mismatch 0 → 1,
   30 → 0.75 (−1.25 dB), 45 → 0.5 (−3.01 dB), 60 → 0.25 (−6.02 dB), 90 → 0 (−∞, cross-polarized). Power p = v².
5. **Antiphase.** b = τ + 180 (the same line, the wire turned end for end) → v = −sin θ: the same power, the voltage in
   antiphase.
6. **Reciprocity.** When B sends, its field at A has full amplitude (B is always across the line of sight) and polarization
   b̂; A picks up â·b̂, the same v as before. The field at the receiver differs (A's pattern acts on sending in one case,
   on receiving in the other), the voltage does not. The page draws A's pattern as "sending and receiving".
7. **Real numbers.** Both dipoles are short (Hertzian, uniform current), l = λ/50 = 0.600 m at 10 MHz (λ = 29.98 m), the
   sender carries 1 A peak, they are 1 km apart (kr = 209.6, far field). Broadside |E| = η0·I·l/(2λr) = 3.767 mV/m
   (Balanis 4-26a: η k I l sin θ/(4πr)), and a matched receiving dipole's open-circuit voltage |l·E| = 2.259 mV peak.
   The voltage is the same whichever one sends (rule 6).
8. **Time.** The field at the receiver is E·cos ωt along ê, the received voltage v·cos ωt. On the drawn path the field at
   the fraction f from the sender is cos(ωt + 2π·N·(1 − f)) with N = 3 wavelengths drawn (not to scale: 1 km is 33 λ);
   a crest moves from the sender to the receiver as ωt grows.

## 4. Page

- **Stage, left: an oblique view.** A at the origin, B on its arc (radius about two thirds of the picture), the x–z plane
  as a light quarter-disc, A's pattern in that plane as a dashed curve (labelled "A's pattern, sending and receiving"),
  the line of sight, the wave as arrows along the path in its plane of polarization with the curve through their tips,
  travelling from the sender to the receiver. The sender is marked by its role ("sends") and a wave symbol; the receiver
  by "receives" and its voltage.
- **Stage, right top: B's view.** Looking back from B towards A along the line of sight: a circle; the arriving E as
  a double line along its polarization (length ∝ amplitude) with the instantaneous arrow; the receiving wire as a thick
  bar; the angle between them marked; the projection of the instantaneous E onto the receiving wire (a dashed drop and a
  thick stroke, E·(receiving wire), so A's foreshortening counts when B sends) — the cosine made visible.
- **Readout**: angle between A's wire and the line of sight θ, A's pattern sin θ (%, dB), polarization τ, B's angle,
  mismatch, PLF (%, dB), field at the receiver (mV/m), voltage at the receiver (mV, per cent of the best case, antiphase),
  power (dB below the best case).
- **Plot**: v and p against B's angle 0 … 180°, A and B's place fixed; nulls at τ ± 90; a marker at the current b.
- **Time**: play (P), scrubber in the transport bar, → / PgDn and ← / PgUp ±15°, Home 0°, End 355°; reduced motion jumps
  45° a second. As in `dipole-field`.
- **Contrast on the stage**: parallel against crossed (and end-on).

## 5. Presets (keys 1–6)

| id | a | el | b | from | What to see |
|---|---|---|---|---|---|
| `matched` | 0 | 0 | 0 | a | vertical to vertical, broadside: v = 100 %, 0 dB, 2.259 mV |
| `slant` | 0 | 0 | 45 | a | B at 45°: v = 70.7 %, PLF 0.5, −3.01 dB |
| `crossed` | 0 | 0 | 90 | a | B horizontal: cross-polarized, v = 0, −∞ dB, although E at B is full |
| `endon` | 0 | 90 | 0 | a | B straight above a vertical A: no field at all, whatever B's angle |
| `up` | 90 | 90 | 90 | a | A horizontal (across), B above, also across: v = 100 % (a horizontal dipole sends upwards) |
| `recip` | 30 | 40 | 60 | b | B sends: sin θ = 0.831, τ = 37.0°, mismatch 23.0°, v = 76.5 %, −2.33 dB, the same as with A sending |

## 6. Legend, captions, misconceptions

- Legend: A's pattern (dashed), the wave (E arrows), the receiving wire, E's projection on it.
- Caption: who sends; the field's direction and amplitude at the receiver; the mismatch and the voltage, per cent and dB;
  special sentences for end-on, crossed, antiphase; when B sends, A's foreshortening (sin θ) is named in the cos sentence
  and the reciprocity sentence follows.
- Misconceptions targeted: "an antenna radiates equally in all directions" (the end-on null); "the wave's polarization
  is wherever the receiver points" (it is fixed by the sender); "a crossed antenna gets half" (it gets nothing in theory;
  45° gets half the power); "turning the antenna 180° loses the signal" (the same power, in antiphase); "polarization is
  always A's angle" (off broadside it is the wire's projection: 63° for a 45° wire seen from 60° up).

## 7. Out of scope

Circular and elliptical polarization, loops, reflections, Faraday rotation (all `ant-tx-rx-polarization`); the near
field (`dipole-field`); half-wave dipoles' slightly narrower pattern (`ant-dipole-length`); ground (`ant-ground-image`).
