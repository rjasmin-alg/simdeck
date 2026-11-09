<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# multiple-access: notes

Task `docs/tasks/w3/multiple-access.md` (catalogue `ham-multiple-access`, §4.10). Built from `kit/template`
(`kit/new-sim.sh`). Explorer; topic `radio`, tag `modulation`, level `intro`.

## Decisions

- **The plane is the page's own SVG, not the K3 block grid.** The task asks for K3 "once it exists"; it exists, but
  its cells are equal, and the plane needs proportional strips: 23.125 kHz channels between 2.5 kHz guards, 12.5 ms
  slots between 2.5 ms guard times. A grid of equal cells would either distort the shares the counters report or
  need 40 rows of 2.5 kHz. The **CDMA chip panel is K3** (`Simdeck.blockGrid`): one row per user (bit × code, filled
  in the user's colour), the air row (Σ), one row per receiver (the products, hatched in the sender's colour, `bad`
  on a collision, the result as the aside). See "Shared requests".
- **Band choice (an added param).** The task's params have no band, but preset `tdma-dmr` needs "one 12.5 kHz
  channel". `band` is a choice 100 kHz (default) / 12.5 kHz. It also makes the FDMA refusal reachable: in 100 kHz
  FDMA fits 6 users, more than the `users` range (1–5); in 12.5 kHz it fits 1.
- **N = served users.** FDMA channels and TDMA slots are cut for the users present (re-partitioned when one is added,
  as the task says), so with N ≤ capacity there is never a free strip; "capacity left" counts the users that could
  still be added. One user gets the whole band (FDMA) or the whole frame less one guard time (TDMA); the task's
  "2–4 slots" is read as the presets' range and the maximum 4.
- **Guard time 2.5 ms** (the task gives none). Two slots then last 27.5 ms each plus 2.5 ms guard, 30 ms per slot,
  which matches the preset's "30 ms each" and a DMR burst of 27.5 ms *(check)*. The `guard` toggle switches both the
  guard band (FDMA) and the guard time (TDMA).
- **Unused share is a share of the plane.** `fdma-idle` gives 23.1 % of the band (the task says "25 %": 1 of 4
  channels; the guards take the other 7.5 %). The page shows 23.1 % and the separate guard share; the preset hint
  says "its channel stays reserved", no percentage.
- **Collision rule.** A receiver whose code is held by two active users gives no bit, whatever the correlation: 0
  when their bits differ, ±2 when they agree (the task: "correlation ±2 or 0, bits unreadable"). With one of the two
  silent the other is read normally. A correlation of exactly 0 decides nothing (tie-break).
- **CDMA idle user** contributes 0 chips and keeps its code (rule 6: nobody moves into its index); the unused share
  is 0 in CDMA, since the others still fill the whole plane.
- **Bits as a mask.** `bits` (0–31, default 13 = users 1–5 send 1, 0, 1, 1, 0) is a hidden range param, so it survives
  in the URL and in presets; clicking a user's label in the CDMA panel flips that bit. Default 13 makes `cdma-2` the
  task's (1, 0) and `cdma-overflow` the 0 case (user 1 sends 1, user 5 sends 0).
- **Changed marks** (`changed()` in the model): after a hand change, every strip or slot whose bounds moved and every
  CDMA user whose chips changed is outlined (plane), highlighted (table) or marked (chip cells); the air chips that
  changed too. Adding a user to FDMA or TDMA marks all strips; in CDMA only the new user and the air. A preset load
  or a scheme switch marks nothing.
- **Two frames** are drawn (0–120 ms) so the TDMA frame visibly repeats; FDMA and CDMA use the same axes.
- **CDMA layers** are stacked with an offset of 1.6 rem up and right so every layer's number tag stays visible. The
  share bar under the plane is one full bar in diagonal stripes of every sender's colour (each has 100 %); split
  side by side or stacked it would read as FDMA or TDMA.
- **CDMA "served"** counts the users whose bit can be read: `cdma-overflow` serves 3 of 5, and a "colliding" counter
  names users 1 and 5, so the counter row also says CDMA capacity is not unlimited.
- **Attribution** sits at the end of the explanation, as in `fsk-psk-ask`.

## Deviations from the task

- Added param `band` (above). The `bits` "toggle per user" is a click on the user's label in the CDMA panel, not five
  toggles (the panel would not fit one screen).
- `fdma-idle`: 23.1 % of the band instead of "25 %" (above).
- TDMA with 1 user has one slot (57.5 ms), not the task's minimum of 2: slots follow the users, as FDMA channels do.
- Rule 5 "One user more → FDMA refused": with `band` 100 kHz FDMA holds 6, so within `users` 1–5 the refusal shows only
  at 12.5 kHz. The model refuses at any band (tested).

## Numbers checked

With node against the model before the page was written, then in `sim.test.js` (21 tests): FDMA widths 23.125 kHz
(4 users), 20.5 (5), 25 (no guard), 100 (1 user); capacities 6 / 8 / 1 / 1; TDMA slots 12.5 ms at 0, 15, 30, 45; DMR
27.5 ms at 0 and 30; per-user time 45.8 % and 20.8 %; guard shares 7.5 % and 16.7 %; CDMA air (2, 2, −2, 2) for bits
1, 0, 1, 1, (0, 2, 0, 2) for `cdma-2`, (1, 1, −3, 1) for `cdma-overflow` with correlations 0, −1, 1, 1; +2 and −2 when the
two holders of code 1 agree; the four Walsh codes pairwise orthogonal; every combination of three users' bits decoded.
The shares add up to 1 for every scheme, user count, idle user, guard and band.

## Sources

- 50ohm.de, section `vielfachzugriff` (FDMA, TDMA, CDMA; channel kept even when idle; precise synchronisation;
  examples AMPS, GSM, DECT, DMR, UMTS, GPS); Croatian translation in `~/projects/50ohm-contents-hr/contents/sections/`.
  CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V. Summarised, not copied. Listed in `sim.json` `credits`.
- Walsh–Hadamard codes and their orthogonality: J. G. Proakis, M. Salehi, *Digital Communications*, 5th ed., ch. 13
  (standard result; checked by the test, the book not re-read).
- URM link: `~/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md`, "Dijeljeni medij" (capacity per
  user falls with the number of users sharing); not quoted on the page.

## Unchecked *(check)*

- DMR: two slots per 60 ms frame, 30 ms per slot, a 27.5 ms burst (ETSI TS 102 361-1): not checked against the
  standard (not available offline). The page only says "2 slots in a 60 ms frame" in the preset hint.
- Croatian "zaštitni pojas" for guard band (task marks it *(check)*; 50ohm hr does not use the term).
- Croatian "zaštitno vrijeme" for guard time (simdeck's own, after "zaštitni pojas").

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr | source |
|---|---|---|
| multiple access | višestruki pristup | 50ohm hr `vielfachzugriff` |
| FDMA | frekvencijski multipleks | 50ohm hr |
| TDMA | vremenski multipleks | 50ohm hr |
| CDMA | kodni multipleks | 50ohm hr |
| time slot | vremenski slot | 50ohm hr |
| spreading code | kod za proširenje spektra | 50ohm hr |
| guard band | zaštitni pojas *(check)* | task file |
| synchronisation | vremenska sinkronizacija | 50ohm hr |

## Shared requests

- **K3 block grid: proportional cells.** A row whose cells have given widths (or a `weights` list), so a time ×
  frequency plane with unequal channels and guard bands could be a block grid: `cells[i].span` as a fraction or a
  `cols` template per row. Smallest change: an optional `widths` array on the spec that sets
  `grid-template-columns`. Not blocking; the plane is drawn in the page.

## Review (playbook §7.4)

A fresh reviewer (a separate agent with no part in the build) re-derived every SPEC number with exact fractions (all
agree), ran 48 mutations of `sim.js` (42 killed; 6 survived: 3 equivalent, 3 test gaps) and read the page. Fixed
after the review:
- `capFdma` claimed guard bands with the guard off (a no-guard variant now);
- CDMA captions: with 5 users and user 1 or 5 silent the caption now says the other holder has code 1 to itself (it
  said the silent user's receiver reads 0, but receiver 1 reads the other holder's bit); one sender, nobody sending
  and "all users send" with a silent user each got their own wording; TDMA with 1 user too;
- the CDMA "served" counter (5 of 5 with two users unreadable) now excludes the colliding users;
- the CDMA share bar no longer looks like a split (above);
- tests for the gaps: a scheme switch together with a user change marks nothing; `holders` keeps a silent holder;
  CDMA used share 0 when nobody sends;
- nits: legend "changed"/"promijenjeno" (it marks flipped bits too), hr "Tko šuti", "slobodnih mjesta", "u svojem",
  the 1-channel FDMA caption, plural "slot/slota/slotova", "here the narrowest channel is 12.5 kHz", the would-be
  width with 2 decimals (6.25 kHz).
Left as is: the `idle` select always offers users 1–5 (a user beyond `users` is ignored and the caption says
nothing; the kit's select has no param-dependent options); the table shows edges with 2 decimals, the plane widths
with 1; units (kHz, ms) and the ⏱ and ✕ marks are typed in the page (the gate's language check passes).

## Timing

Start 18:19 (brief read), first gate pass 18:29, review and fixes, done 18:38 (one session, about 20 minutes).
