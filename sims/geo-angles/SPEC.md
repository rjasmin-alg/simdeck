<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# geo-angles: SPEC

Task `docs/tasks/w3/geo-angles.md`, catalogue §4.17. One concept: **two rays (krakovi) from one vertex (vrh) V split
the plane in two parts; the angle (kut) is the whole part between them, not the small arc that marks it; an angle is
acute, right or obtuse by comparison with a right angle (the corner of a set square), not by the length of its arms;
a point belongs to the angle or not; the angle aVb is read from arm a to arm b counter-clockwise.**

Class **explorer** (no steps). One squared-paper plane, three modes: `kind` (turn arm b, lengthen the arms, compare
with the set square), `point` (does T belong to kut aVb?), `name` (which part of the plane is kut aVb?). Every
expected number below was recomputed with an independent Python script (floating-point angles in degrees, not the
model's whole-number rules; NOTES.md, Checks) and is asserted in `sim.test.js`.

Builds on the **squared-paper model** of `geo-lines` (catalogue §5.27): `paper.js` is its copy, unchanged (`gcd`,
`sub`, `cross`, `dot` are used). The angle part (`logic.angle` in `sim.js`: the 32 arm directions, the kind, where a
point lies, the drag helpers) is pure and string-free, ready to be added to `models/squared-paper.js`.

## Sources

- **Curriculum** (Narodne novine 7/2019, read 2026-11-14 in this session):
  - **MAT OŠ C.4.1** "Određuje i crta kut." Razrada: "Opisuje pojam kuta. Prepoznaje, uspoređuje i crta pravi,
    šiljasti i tupi kut. Imenuje vrh i krakove kuta. Prepoznaje i ističe točke koje (ne) pripadaju kutu. Koristi se
    oznakom kuta (kut aVb) pazeći na orijentaciju (suprotno od kretanja kazaljki na satu)." Dobar: "Prepoznaje i
    crta šiljasti, pravi i tupi kut te određuje (ne)pripadnost točke kutu." Sadržaj: "Pravi, šiljasti i tupi kut.
    Crtanje kuta." Preporuka: "Česta je pogreška koja se pojavljuje pri usvajanju pojma kuta da učenici kutom smatraju
    samo mali dio unutar kružnoga luka kojim kut označavamo." → the three modes; the preset `far` and the named
    mistake `arcOnly`.
  - **MAT OŠ C.3.2** (geo-lines): perpendicular lines with the set square → the set square's corner is the right
    angle the class compares with.
  - Kept out (grade 5, MAT OŠ C.5.1 / D.5.1 "Mjeri i crta kutove"): degrees, measuring, the protractor, the straight,
    reflex and full angle as kinds. Mode `name` shows that the other part is an angle too; when it is the named one it
    is called "bigger than half a turn", with no kind name.

## The paper

Corners (x, y) with whole numbers, y upwards; the sheet is 24 × 12 squares, **one square is 1 cm**. The vertex V and
the point T sit on corners; the arms leave V in whole-step directions, so every question has an exact answer.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `mode` | `kind`, `point`, `name` | `kind` | what is shown |
| `vx, vy` | whole, 1…23 × 1…11 | V(9, 3) | the vertex, dragged |
| `da` | whole, taken mod 32 | 0 (1, 0) | arm a's direction: DIRS[da] |
| `kb` | whole 1…15 | 6 | arm b is DIRS[da + kb]: kb places on, anticlockwise |
| `la, lb` | whole 1…12 | 6, 6 | the arms' drawn lengths in cm (the arms are rays: they go on) |
| `square` | boolean | true | (kind) the set square with its corner in V and one leg on a |
| `tx, ty` | whole, on the paper | T(7, 4) | (point) the point, dragged or a click |
| `swap` | boolean | false | (name) the names a and b swapped between the two rays |
| `hide` | boolean | false | ask first: the answer is hidden |
| `guess` | per mode | `''` | the class's answer: `acute` / `right` / `obtuse`; `yes` / `no`; `one` / `two` |

## Rules

1. **On the paper** (tie-break): V is rounded and kept a square in from the edge, 1 ≤ x ≤ 23, 1 ≤ y ≤ 11; T is
   rounded and kept on the paper (0…24 × 0…12); la and lb are rounded and kept within 1…12. Arms may run off the
   paper; the drawing is cut at its edge (the angle is not).
2. **The arms' directions**: DIRS is every shortest whole step (x, y) with |x|, |y| ≤ 3, the whole way round: 32
   directions ordered anticlockwise from (1, 0), exactly (by half-turn, then by the sign of the cross product).
   DIRS[i + 16] = −DIRS[i] and DIRS[i + 8] is DIRS[i] turned by a right angle. Arm a is DIRS[da mod 32]; arm b is
   DIRS[(da + kb) mod 32] with kb kept within 1…15 (tie-break: so in modes `kind` and `point` the angle aVb is always
   less than a straight angle; kb 0 or 16 would give no angle or a straight one, both grade 5).
3. **The two parts** (`name`): the rays split the plane in two parts; part 1 is the smaller one (from a's ray to
   b's ray anticlockwise, kb places), part 2 the bigger one (the rest of the plane). Both are angles.
4. **The kind** (exact): for u, v the arms and cross(u, v) > 0: **acute** (šiljasti) when dot(u, v) > 0, **right**
   (pravi) when dot(u, v) = 0, **obtuse** (tupi) when dot(u, v) < 0. This is the comparison with the set square: its
   corner in V and one leg on a, b runs inside its corner (acute), along its other leg (right) or outside it (obtuse).
   With these 32 directions, right is exactly kb = 8, acute kb < 8, obtuse kb > 8, whatever da is. **The arms'
   lengths do not enter** (tie-break): la, lb change the drawing only. For completeness `kindOf` also returns
   `straight`, `zero` and `big` (cross ≤ 0); the page only meets `big`, in mode `name` (rule 6).
5. **Where T is** (`point`, exact): w = T − V. `vertex` when w = 0; `armA` when w is a positive multiple of a
   (cross(a, w) = 0, dot(a, w) > 0), `armB` likewise; else `in` when cross(a, w) > 0 and cross(w, b) > 0, `out`
   otherwise. **The vertex and the arms belong to the angle** (tie-break), past the arms' drawn ends too (they are
   rays). Also: `pastArc` when |VT| is more than the arc's radius (1.5 cm, or 0.6 of the shorter arm when that is less, so
   the arc stays between short arms; |VT|² against the radius², never equal for whole |VT|²) and `pastEnd` when |VT| is more
   than the drawn arm's length (for a point between the arms, the longer arm's).
6. **The name** (`name`): kut aVb is read from arm a to arm b **anticlockwise**. Without a swap the first ray is a
   and the second b, so kut aVb is part 1; swapped (tie-break), a and b change rays and kut aVb is part 2, the
   bigger part, "more than half a turn": not acute, right or obtuse (its kind is `big`). kut bVa is then the other
   part.
7. **The class's answer**: mode `kind` asks "Koji je ovo kut?" (`acute` / `right` / `obtuse`), mode `point`
   "Pripada li T kutu aVb?" (`yes` / `no`), mode `name` "Koji je dio kut aVb?" (`one` / `two`). Right when it is the
   answer of rules 4, 5, 6. A guess that is not one of the mode's answers is none. While asked (`hide`) the set
   square is not drawn, and the slider that turns b is hidden in mode `kind` (its middle is the right angle); once
   the class has answered the kind, the set square is drawn even when it is switched off (it decides, and the named
   mistakes refer to it) and (mode `point`) the angle is not coloured: it is drawn as the book draws it, arms and an
   arc.
8. **The named mistake** (a wrong answer only): `kind`: right answered acute or obtuse → `notOnEdge` when a lies
   along a grid line (da a multiple of 8), else `tilted` (a right angle need not stand upright); acute or obtuse
   answered right → `nearRight`; acute and obtuse mixed up → `arms` (judging by the arms' length or the picture's
   size). `point`: T between the arms answered no → `arcOnly` (the curriculum's: only the small part inside the
   arc), but only when T is past the arc; inside the arc → `between`; on an arm or the vertex answered no → `onArm`;
   outside answered yes → `otherPart`. `name`: → `clockwise`.
9. **Drags** (the page; pure helpers in `logic.angle`): `dirAt(dx, dy)` is the direction nearest by angle (a tie
   takes the lower index); `turnTo(da, i)` keeps the turn within 1…15: the same direction → 1, the opposite and up to
   three quarters on → 15, the last quarter → 1; `lenAt` rounds a distance to whole cm within 1…12. Dragging arm a
   turns a and keeps b where it is (kb from `turnTo`); dragging arm b turns b; dragging V moves the whole angle.
10. **Params are made valid**: unknown mode → `kind`; numbers rounded and clamped (non-numbers, `''` and null take
    the default; da taken mod 32, also negative); `hide`, `swap` only when exactly `true` (`swap` only in mode
    `name`); `square` on unless exactly `false`. A click lands on the nearest corner, rounded half up, kept on the
    paper: (3.5, 2.49) → (4, 2).

## Presets (keys 1–9)

| id | mode | what | expected |
|---|---|---|---|
| `kinds` ("Okreni krak b") | kind | V(9, 3), a (1, 0), kb 6 → b (1, 2), arms 6, set square | acute (63.4°, not shown): b inside the set square's corner; kb 8 → right, 9…15 → obtuse |
| `short` ("Kratki krakovi") | kind, ask first | V(11, 4), a (1, 0), kb 14 → b (−2, 1), arms 2 | obtuse (153.4°); the typical mistake: a small drawing is a small angle |
| `tilted` ("Nakrivljeni kut") | kind, ask first | V(10, 2), a (2, 1), kb 8 → b (−1, 2), arms 5 | right (dot = 0) although no arm is along a grid line |
| `near` ("Skoro pravi?") | kind, ask first | V(9, 3), a (1, 0), kb 9 → b (−1, 3), arms 7 | obtuse (108.4°; dot = −1): it looks right; the set square shows the gap |
| `far` ("Daleko od vrha") | point, ask first | V(4, 2), a (1, 0), b (1, 1), arms 5, T(20, 9) | in, |VT| ≈ 17.5 cm, past the arc and the arms' ends: belongs (the curriculum's mistake: no) |
| `arm` ("Na kraku") | point, ask first | same angle, T(15, 2) | on arm a, 11 cm from V, past its drawn 5 cm: belongs |
| `outside` ("Uz krak") | point, ask first | same angle, T(9, 8) | out (cross(w, b) = −1), 0.71 cm from arm b's line: does not belong |
| `name` ("Kut aVb") | name, ask first | V(12, 5), rays (3, 1) and (−1, 2), arms 5 | kut aVb is part 1 (98.1°, obtuse) |
| `swap` ("Kut aVb, krakovi zamijenjeni") | name, ask first, swap | the same rays, a and b swapped | kut aVb is part 2, more than half a turn (261.9°) |

## Legend and captions

Legend: arms (krakovi, lines from V), the angle (kut, the coloured part), the arc (luk, the mark). Colour is never
alone: V, a, b, T are named; part 1 and part 2 are numbered and part 2 is hatched; the kind is said in words;
✓ / ✗ only on the class's answer. A right angle's mark is an arc with a dot *(check)*. The set square is drawn with
its name. Revealed in mode `point` the arms go on as dashed rays to the paper's edge.

Three audiences (`Simdeck.paperColumns.audience`): **teacher** (every control, ask first with the class's answer
buttons, the typical mistake highlighted), **adult** (adds a "why": the angle is the part of the plane between the
arms; the set square's corner is the right angle we compare with; aVb anticlockwise), **child** (one short sentence:
"Šiljasti kut!", "Da! T pripada kutu.", "Od a do b, suprotno od kazaljke.").

## Terms (Croatian first)

kut, vrh, krak (krakovi), šiljasti, pravi, tupi, trokut (the set square, as in geo-lines and geo-compass), luk,
pripada / ne pripada, suprotno od kretanja kazaljke na satu, kut aVb; English: angle, vertex, arm (arms), acute,
right, obtuse, set square, arc, belongs / does not belong, anticlockwise, angle aVb.

## Misconceptions targeted

- "The angle is only the small part inside the arc" (the curriculum's): `far`.
- "The arms end where they are drawn": `arm`; "longer arms make a bigger angle": `short`, the arm sliders.
- "A right angle stands upright": `tilted`; "it looks right, so it is right": `near`.
- "Near the arm is in the angle": `outside`.
- "aVb is always the small part, or read clockwise": `name`, `swap`.

## Out of scope

Degrees, measuring and the protractor (grade 5), straight, reflex and full angle as named kinds, comparing two
angles with each other other than through the right angle, angles of a triangle (`geo-triangles`), points named
with capitals (kut AVB).
