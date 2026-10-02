<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# hw-side-effects: spec

**Question the sim answers:** how can a software attack succeed on a computer whose hardware works correctly and whose
software works correctly, with nothing in the software able to spot it? **Answer:** the attack lives in side effects
between parts that each work as specified. Optimising for speed and for space multiplies those side effects; the only
reason to hold the optimisation back is that other code on the machine may be hostile, a limit of trust, not physics.

Scope (owner, 2026-10-02): rows and changes, not methods. No instruction names, code, access patterns, timing
thresholds, fault suppression, CVE or exploit details, nothing that reads as a procedure. Every number below is the
model's own and **illustrative, not measured**; the page says so under the leak meter and in the explanation.

Class `explorer` (no steps): the page draws `initial(params)`.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `speed` | 0 … `MAX` = 10, step 1 | 6 | optimisation for speed: running ahead, sharing, caching |
| `density` | 0 … 10, step 1 | 4 | optimisation for space: smaller cells, rows closer |
| `mitigate` | boolean | false | mitigations in hardware, OS and compilers |
| `trust` | `hostile`, `trusted` | `hostile` | whether other code on the machine may be hostile |

Levels outside 0 … 10 are clamped (the kit clamps the sliders too).

## Rules

1. **Secret.** The victim holds 16 fixed bits `1011 0010 1110 0101` (9 ones). Its result is always correct and every
   software check passes (`victimCorrect`, `checksPass` are always true; the secret bits never change).
2. **Chance per bit** on an axis at level x: `chance(x) = PMAX × (x / 10)²`, `PMAX = 0.8`; with mitigations × ¼
   (`MIT_FACTOR`). So 0 at level 0, 0.2 at 5, 0.288 at 6, 0.8 at 10; 0.2 at 10 with mitigations. Strictly rising.
3. **Each slider drives only its own axis:** `speed` → the speed axis (shared cache lines that stay warm after the
   rollback: Spectre-type); `density` → the space axis (the other program's neighbouring row disturbed by what the
   victim's row holds: Rowhammer-type).
4. **Toughness.** Each 1-bit k (k-th one, 0-based) has on each axis the toughness `(rank + ½) / 9`, with a fixed rank
   permutation per axis: speed `[4,7,1,8,0,5,2,6,3]`, space `[6,2,8,0,4,1,7,3,5]`. A 0-bit has toughness 1. The
   evenly spaced values make the share of 1-bits with a trace follow the chance; the different orders make the two
   axes miss different bits.
5. **Trace:** a bit leaves a trace when it is 1 **and** its toughness < the chance. **Tie-break: equal keeps no trace**
   (so level 0, chance 0, never leaks). A 0-bit never leaves one. A higher level never removes a trace.
6. **What the other program sees:** the 1-bits with a trace on either axis (`seen`, out of `ones` = 9). At both 10
   neither axis alone sees all 9 (7 each), together they see all 9.
7. **Leak chance (either kind):** `p = 1 − (1 − p_speed)(1 − p_space)` (axes independent). Both 0 → 0; both 10 →
   0.96, the maximum over the grid; strictly rising in each slider.
8. **Risk:** `risk = p` when `trust = hostile`, `0` when `trusted`. Trust changes neither the traces nor `p`.
   `trustBinds` (the trust limit is the one holding the optimisation back) = hostile and at least one bit seen.
9. **Cost,** relative to both at 10 without mitigations (= 1×), with s = 10 − speed, d = 10 − density:
   time = (1 + 0.15 s) × (1.25 with mitigations); linear cell size = 1 + 0.1 d; area = size²;
   energy = (1 + 0.06 s + 0.08 d) × (1.1 with mitigations). Everything off: 2.5× time, 4× area, 2.4× energy.
   Mitigations add time and energy, not area.
10. **Limits on speed and size:** speed of light / signal propagation, heat / power density, quantum effects /
    leakage current, size of atoms (physical), then trust (not physical). Trust is highlighted when it binds.

## Presets (keys 1–6)

| id | params | shows |
|---|---|---|
| `safe` | 0, 0 | no trace, p = 0; 2.5× time, 4× area, 2.4× energy |
| `speed` | 10, 0 | 7 cache traces, 0 row traces, p = 0.8 |
| `space` | 0, 10 | 0 cache traces, 7 row traces, p = 0.8 |
| `both` | 10, 10 | 7 + 7, all 9 bits seen, p = 0.96, cost 1× |
| `mitigated` | 10, 10, mitigations | 2 + 2, 4 seen, p = 0.36, 1.25× time, 1.1× energy |
| `trusted` | 10, 10, trusted | the same traces and p = 0.96, risk 0: the conclusion |

## Page

Stage: the victim's three checks (✓) and what the other program sees; the two axis panels side by side (victim's
bits, the running-ahead strip or the row spacing, the shared or neighbouring row with ◆ traces, chance per bit,
traces, the axis's curve with the current level); the leak meter with the risk line; the cost bars; the limits wall
and the quotable line, "Every other limit on speed is physical. This one is a limit of trust."
Caption: the cost when nothing can leak (p = 0); "no trace yet" when p > 0 but no bit is seen; otherwise the traces per axis, the leak chance, the mitigation's time, and the trust sentence (hostile or trusted).
