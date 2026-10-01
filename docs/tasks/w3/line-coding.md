# line-coding: Line coding: NRZ vs Manchester

| | |
|---|---|
| Task | `line-coding` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-line-coding` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/line-coding/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | URM, HAM |
| Topic / tags / level | `networks` / `physical-layer` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **how bits become a signal and why the clock must be recoverable**.

The student: type bits, compare waveforms, cut the clock.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/06-fizicki-sloj.md` (Uvod u računalne mreže), section "Kako signal nosi bitove" → "Što treba znati" (bitna ćelija, kodiranje, the worked string `1 0 0 1`), and "Pitanja" question 4 (the string `1 1 0 1`)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch06-manchester-kodiranje.svg` (the book's figure for `1 0 0 1`)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, row "6 · Signal i medij" (the planned card: Manchester kodiranje)
- IEEE 802.3, clause 7.3.1.1 (Manchester encoding for 10 Mb/s) and clause 14 (10BASE-T), as quoted in the book's footnote `ieee-manchester` (UNH-IOL, "10Base-T: Medium Attachment Unit"): high→low = 0, low→high = 1
- RFC 5136 "Defining Network Capacity" (the book's footnote `rfc5136-kodiranje`)
- NRZ is not in the book: use a standard textbook (e.g. Forouzan, *Data Communications and Networking*, "Line coding"; Stallings, *Data and Computer Communications*, "Digital data, digital signals") and mark it *(check)*
- No 50ohm section covers line coding (checked: `~/projects/50ohm-contents-hr/contents/sections/`)
- Catalogue seed: URM card ch06 (Manchester)

## Model and presets

- **Scene:** two waveform lanes, one above the other, on a common time axis divided into bit cells (bitna ćelija): **NRZ** on top, **Manchester** below. Above both, the bit row (one clickable cell per bit). Under each lane, a "receiver reads" row: the bits the receiver recovers with its own clock, with misread cells marked. Dashed vertical lines mark cell boundaries; small ticks mark the mid-cell instant.
- **State (derived, explorer):** `{ bits: '1001', nrz: [{level, from, to}], man: [{level, from, to}], edges: {nrz:[t], man:[t]}, readNrz: [bit], readMan: [bit], errors: {nrz:[i], man:[i]} }`. Everything is a pure function of the params; no steps.
- **What the params drive live:** clicking a bit cell (or picking a pattern) redraws both waveforms; the clock-drift slider moves the receiver's sampling instants and updates the "receiver reads" rows; the "show clock" toggle draws the sender's clock under the lanes.
- **Rules:**
  1. NRZ-L: the level stays constant for the whole cell; 1 = high, 0 = low; consecutive equal bits produce no transition (textbook convention, *(check)*: some texts invert it).
  2. Manchester: every cell has a transition exactly in its middle; low→high = 1, high→low = 0 (IEEE 802.3 clause 7/14 as quoted in URM `06-fizicki-sloj.md`, "Kako signal nosi bitove").
  3. Manchester boundary jump: if two neighbouring cells carry the same bit, the signal must jump back at the cell boundary so the next mid-cell transition can happen; that jump is not a bit (URM ch06, the `1 0 0 1` walk-through). Between different bits there is no boundary jump.
  4. The receiver decides by the **direction of the mid-cell transition**, not by the level (URM ch06; Pitanja 3).
  5. Clock recovery (derived model): the receiver re-aligns its clock on every transition. Between transitions it counts cells with its own clock, whose cell length is T·(1+d), d = drift. A constant run of duration k·T is read as `round(k / (1+d))` bits. NRZ loses or gains a bit when that differs from k; with d = 10 % this happens for runs of 6 or more equal bits (k/(1+d) < k − 0.5 ⇔ k > 0.5·(1+d)/d = 5.5). Derived, unchecked.
  6. Manchester never has a run longer than one cell without a transition, so with |d| < 50 % it reads every bit correctly (derived from rule 2).
  7. Cost: Manchester has up to two transitions per bit, NRZ at most one; 10 Mb/s Manchester (10BASE-T) signals at 20 Mbaud *(check: IEEE 802.3 clause 14)*. Shown as a transitions counter per lane.
  8. Edge cases: an all-zero or all-one string is a single NRZ run (no transitions at all: the receiver cannot even find the first cell boundary without a preamble; show "nema prijelaza / no transitions"). Maximum 16 bits, minimum 1.
- **Params:** `bits` string of 1–16 bits, edited by clicking cells on the stage (default `1001`); `pattern` select `1001` | `1101` | `10101010` | `0000000011111111` | `1111111111111111` (sets `bits`); `drift` range −20…+20 %, step 1, default 0; `showClock` toggle, default off; `lanes` choice `both` | `nrz` | `manchester`, default `both`.
- **Presets:**
  1. `book-1001` — bits `1 0 0 1`, drift 0. Manchester: up, down, boundary jump up + down, up; 5 transitions (4 mid-cell + 1 boundary, between the two 0s). NRZ: 2 transitions. From URM ch06 "Kako signal nosi bitove".
  2. `book-1101` — bits `1 1 0 1` (the chapter's question 4): boundary jump only between the two 1s; Manchester 5 transitions, NRZ 2. From URM ch06 Pitanja 4.
  3. `long-run` — `0000000011111111`, drift +10 %: NRZ has two 8-cell runs, read as round(8/1.1) = 7 bits each, so the receiver gets 14 bits instead of 16 (2 errors marked); Manchester reads all 16. Derived, unchecked.
  4. `alternating` — `10101010`, drift +10 %: NRZ changes level every cell and reads all 8 correctly; shows that NRZ fails only on long runs. Derived.
  5. `all-ones` — `1111111111111111`, drift 0: NRZ is one flat line (no transitions at all), Manchester has 16 mid-cell transitions plus 15 boundary jumps = 31. Derived.
- **Steps:** none (explorer).
- **Legend:** NRZ waveform (c1, solid line), Manchester waveform (c2, solid line), boundary jump that is not a bit (c2, dashed segment), mid-cell transition (arrow head ▲ / ▼), misread bit (danger + ✕), sender clock (muted). "Changed" marks the bit cell last clicked and the parts of both waveforms it changed.
- **Captions:**
  - hr: "Ćelije 2 i 3 nose dvije nule: Manchester svakoj daje vlastiti prijelaz iz visokog u niski usred ćelije, a skok na granici između njih nije bit."
  - en: "With 10 % clock drift, NRZ reads the run of eight zeros as seven: there is no transition to resynchronise on. Manchester reads all 16 bits."
- **Terms:** bit cell — bitna ćelija; encoding / line coding — kodiranje (linijsko kodiranje); clock / timing — takt; transition — prijelaz (razine); signal level — razina (napona); receiver — primatelj; sender — pošiljatelj; baud rate — brzina signaliziranja *(check: the book uses no term)*.
- **Misconceptions:** (1) "The receiver reads the voltage level": in Manchester it reads the direction of the mid-cell transition (URM ch06, Pitanja 3). (2) "Two equal bits make one longer signal": each gets its own cell and transition. (3) "Coding is free": Manchester doubles the signalling rate.
- **Out of scope:** 4B/5B, 8B/10B, 64B/66B, MLT-3, PAM (name them in the explanation only); differential Manchester; analogue noise, attenuation and eye diagrams; framing and preamble detail beyond one sentence.
- **Note for the coordinator:** the book has no NRZ (only Manchester), so rule 1 and the drift model are textbook/derived and must be checked. The kit has no text or bit-string param type; this sim edits `bits` from clicks on the stage. If the kit gets a `bits` control, use it.
<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `line-coding` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh line-coding sims/line-coding` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/line-coding/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
