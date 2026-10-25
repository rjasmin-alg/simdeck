<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# csma-cd: notes

New stepper (task `docs/tasks/w3/csma-cd.md`, catalogue `net-csma-cd`, wave 3). Rules and expected numbers:
`SPEC.md`. Drawn by the page in HTML: the kit has no time axis view (see Shared requests).

## Decisions

- **One step = one slot time**, with the task's phase order inside a step (sense, start, resolve, jam and draw,
  count down, caption). A station that draws k waits k whole slots after the collision slot and senses in the next;
  a fresh draw does not count down in the collision slot itself.
- **Slots are numbered from 1**, so the transport's "Step n" and the timeline's column n are the same slot. The task
  numbers slots from 0 ("slots 0–4"); the counts are the same (its "6 steps" for `two-collide` are the start plus 5
  slots, i.e. 5 kit steps), only the labels shift by one. The task's example caption ("Kolizija u odsječku 2 …") is
  slot 3 here.
- **Stations deferring behind a frame and stations whose backoff is still running are different**: the timeline
  shows `…` (dashed) for "sensed busy, waits" and the slots left (dotted) for backoff. In `two-collide` B first
  counts its k = 1 down (during A's first slot) and then defers (during A's second); the task's wording "B defers
  (medium busy in slot 1)" folds the two together. Numbers unchanged.
- **The scene is a hidden param** (`scene`), set by the presets: which slot each station gets its frame in and the
  scripted draws. The stations slider still works on a scene (extra stations arrive with the scene's pattern and
  draw from the seed).
- **One seed slider instead of a draws choice plus a seed**: `seed` 0 ("from the example") uses the scene's scripted
  draws; 1–99 draws every k from that seed (a mulberry32 hash of seed, station, frame, n). `N` picks a new seed. The
  task's params are `seed` 1–99 default 7, used only when the preset has no script; every preset here has a script
  (except full duplex, which draws nothing), so a separate choice would have added a control that does nothing in
  most states, and the panel did not fit at 1920×1080 with both.
- **Full duplex joins exactly two ends**: A and a switch port (`⇄`, "preklopnik"/"switch"). The stations slider is
  disabled there with the reason; the bus becomes two one-way lanes. Station B *is* the switch in that mode, so the
  model stays one shape.
- **A run ends** in the slot after which every frame is delivered or dropped and the bus is free, at most 20 slots
  (contract: at most 20 steps). With seeded draws, 4 stations and long frames often do not finish in 20 slots
  (4 × 4-slot frames alone fill 16); the last caption then says the demo stops and who is still waiting.
- **Rule 5 (16 attempts) has no preset**: 16 collisions in a row need 16 slots of k = 0 draws for two stations; it
  is tested in `sim.test.js` and stated in the explanation. A sixth preset would be beyond the task's list.
- **The jam is drawn in the collision slot** (zig-zag on hatching), not as a slot of its own; the explanation gives
  its 32 bits.
- **One backoff number everywhere**: in a waiting slot the timeline cell, the station's card ("backoff counter: 3")
  and the caption ("A = 3") all show the slots left with this one included, so k = 3 reads 3, 2, 1 and the station
  senses in the slot after the 1. The model's `backoffLeft` is the count after the slot (2, 1, 0); the page adds one.
- **"Odustajanje" is the backoff, "odbacivanje" the drop**: the Croatian title uses the task's proposed term for
  backoff, so the 16-collision drop says "okvir odbačen" / "odbacuje okvir", never "odustaje".
- **Captions** are built from the slot's events (arrive, collision with why: new / deferred behind the same frame /
  same k, the draws with n and the range, a tie warning, start after defer / after backoff, continue, deliver,
  defer, drop, count-down, idle), plus a summary on the last step.

## Deviations from the task

- Slot numbering from 1 (above). Kit step counts: 5, 8, 7, 8, 2 (the task's 6, 9, 8, 9, 3 count the start too).
- `draws` choice and `seed` 1–99 merged into `seed` 0–99 (above); default 0 = scripted.
- `newDraw` is the page's button `N` (not a model param).
- State: as the task, plus `k`, `range`, `frame` per station, `tx` (the frame on the bus), `columns` (the timeline)
  and `collisions`, `done`; `log` holds this slot's events only.
- Preset 4's draws: the task text reads "n=1 draws 0,1,1 … n=2 draws 2,0 … n=2 draws B=2, C=0"; the n = 2 draws are
  one pair (B = 2, C = 0), which gives the task's own timeline (second collision, C then B, 8 slots).

## Sources

- URM ch07 "Ethernet u preklopljenoj mreži: kako preklopnik radi iznutra"
  (`~/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md`): kolizija, kolizijska domena, CSMA/CD only
  in half duplex, the 64-octet minimum; Primjer 4 (full duplex: CSMA/CD has nothing to do); question 11 (the
  "replaced by something better" misconception). Term pairs kolizija/collision, kolizijska domena/collision domain,
  polu-dupleks, puni dupleks are the book's.
- URM ch17 "Što treba znati", opening paragraph: CSMA/CD listens to its own signal while sending.
- IEEE Std 802.3 clause 4 and Kurose & Ross, *Computer Networking*, §6.3: 1-persistent deference, jam 32 bits,
  slotTime 512 bit times, truncated binary exponential backoff 0 … 2^min(n,10) − 1, attemptLimit 16, backoffLimit 10.
  *(check: no local copy of the standard; numbers from standard textbooks, as the task says.)*
- 1-persistence of Ethernet's deference *(check)*.

## Checks

- Numbers: the five presets were run through the model before the page was written (`node` over `sim.js`): A `XsS`
  / B `X1dsS` (5 slots, 1 collision); A `X1X321sS` / B `X1XsS` (8, 2); C `sS`, A `.dXsS`, B `.dX1dsS` (7, 1); A `XsS`,
  B `X1dX21sS`, C `X1dXsS` (8, 2); full duplex `sS` / `sS` (2, 0). They match the task's slot counts and stories.
- Seeded runs, 99 seeds each: 2 stations finish within 20 slots in 98 of 99; 3 stations 72–92 of 99 (by frame
  length 1–4); 4 stations 8–78 of 99.
- Mutations, one at a time, 34 in all: carrier sense off, first sender wins a collision, lower letter wins a tie, no
  jam mark, range not truncated / fixed / off by one, backoff limit 16, attempt limit 15 and `>`, n not reset on
  delivery, waits k − 1 and k + 1, not 1-persistent, script index shifted, script ignored, frame one slot longer,
  full duplex contends, full duplex with any count, cap 25, run one slot long, seed ignored, fresh draws counting
  down in the collision slot, arrivals ignored; and from the review: seeded draw ignores the station / ignores n /
  capped at 511, n not reset after a drop, frame counter not advanced on delivery, script applied to every frame,
  the sender deferring behind its own frame, phase stuck at jam during backoff, wait log off by one, no arrival
  event: every one fails a test.
- Page sweep (Playwright, unbuilt from `file://`, 1920×1080): every step of the five presets and of 36 seeded
  settings (2–4 stations × frame 1, 2, 4 × 4 seeds) in both languages, 1092 states: no console errors, no page
  scroll, nothing outside the stage, no `undefined`/`NaN`/placeholder in the stage or caption.
- `npm run gate -- csma-cd`: passes; screenshots reviewed at 1920×1080 light, dark, grayscale and 375×812 in both
  languages, plus steps 1, 3 and the last of every preset.

- Fresh review (a separate agent wrote its own model from SPEC.md and compared 1220 runs: no mismatch; ran 35 more
  mutants; drove the page in both languages). Fixed from it: the hidden `scene` was not a declared param, so it fell
  out of links and the L switch (press 3, change the stations, press L → the wrong scene); now a hidden choice. Tests
  added for the randomness of seeded draws, rule 6 on a second frame that collides, n after a drop, and the event
  log and phases slot by slot (they drive the captions). Croatian gender (stanica: "svaka", "obje", "je izvukla"),
  "ostatak" repeated, a plural for "još čeka/čekaju", the drop vs backoff wording, the backoff number shown three
  ways (now one), the full-duplex start caption after a late-arrival scene ("both ready" while they were not) and its
  idle caption, Croatian card text overflowing at 375 px, a k = 0 start caption, "each counts the collisions of its
  own frame", N now returns to step 0, and one sentence in the explanation on why only a frame's first slot can
  collide. Left as is: at 4 stations with long frames most seeded runs hit the 20-slot cap (the caption says so);
  stations beyond a scene's script draw from seed 0 while the slider reads "from the example"; full duplex keeps the
  slot grid and "Frame length (slots)" (one model, the same timeline).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| collision | kolizija (URM ch07) |
| collision domain | kolizijska domena (URM ch07) |
| carrier sense | osluškivanje medija *(proposed; the book: "osluškuje je li medij zauzet")* |
| half duplex / full duplex | polu-dupleks / puni dupleks (URM ch07) |
| binary exponential backoff | binarno eksponencijalno odustajanje *(check: not in the book; the task proposes it)* |
| slot time | vremenski odsječak *(check)* |
| jam signal | signal ometanja *(check)* |
| shared medium | dijeljeni medij (URM ch07) |

## Shared requests

- **A time axis view** (kit): columns per time slot, rows per party, a current-column highlight and per-cell marks
  (solid, hatched, dotted with a number, dashed). This page draws its own grid (`timeline()` in `index.html`); the
  same grid would serve CSMA/CA, TDMA/ALOHA, Gantt-style scheduling sims.
- Kit: a param's `visible()` sets `[hidden]`, but `.sd-ctl`'s `display` wins; the page hides them itself
  (`.sd-panel [hidden] { display: none; }`), as cert-chain and amdahl do. Already requested there.
- Kit: a `button` param takes no `visible` or `disabled`, so "New draws" (N) stays in full duplex, where it
  changes the seed and returns to step 0 but draws nothing. A `visible` for buttons would hide it.
- Glossary: the term pairs above, with `"src": "simdeck"`.

## Time

Start 2026-10-25 11:37 CET, done 12:13 CET: about 36 minutes, the fresh review included.
