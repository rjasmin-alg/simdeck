# multiple-access: FDMA, TDMA, CDMA

| | |
|---|---|
| Task | `multiple-access` (wave 3, Radio and crisis communications) |
| Catalogue entry | `ham-multiple-access` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/multiple-access/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | HAM, URM |
| Topic / tags / level | `radio` / `modulation` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **three ways to share a channel**.

The student: add users to each scheme.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/vielfachzugriff.md` (FDMA, TDMA, CDMA; channels reserved even when idle; TDMA needs precise synchronisation; examples AMPS, GSM, DECT, DMR, UMTS, GPS) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
- Walsh–Hadamard codes: J. G. Proakis, M. Salehi, *Digital Communications*, 5th ed., ch. 13 "Spread spectrum signals"; DMR two-slot TDMA: ETSI TS 102 361-1 *(check)*. Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md`, "Dijeljeni medij: zašto bežična veza radi drukčije od žične" (shared medium, capacity per user) for the URM link.
- Catalogue seed: 50ohm vielfachzugriff

## Model and presets

- **Scene:** one channel drawn as a time × frequency plane (time across, frequency up), with a scheme switch
  FDMA / TDMA / CDMA. FDMA: horizontal strips, one per user, with guard bands between; TDMA: vertical slots in a
  repeating frame, guard times between; CDMA: the whole plane shared, shown as stacked translucent layers plus a
  chip panel: each user's bit × Walsh code (4 chips), the sum on the air, and each receiver's correlation result.
  A counter row: users served, capacity left, unused share (idle users' reserved resource).
- **State (explorer, derived from params):** `{ scheme, users: [{id, active, bit, code}], bandKHz, frameMs,
  channels|slots|codes: [...], perUser: {bandwidth, timeShare}, sumChips: [..], decoded: [{id, corr, bit}],
  idleShare, overflow: bool }`.
- **Params drive live:** adding or removing a user re-partitions the plane at once; toggling a user idle shows
  its reserved strip/slot unused (FDMA/TDMA) or simply absent (CDMA).
- **Rules** (50ohm `vielfachzugriff`):
  1. FDMA: the band is split into N fixed channels of (B − (N − 1)·guard)/N each; each user keeps its channel
     permanently, even when silent.
  2. TDMA: one frequency channel, the frame split into N slots of (frame − N·guardTime)/N; users send only in
     their slot; needs synchronisation (drawn as a shared clock).
  3. CDMA: all users send at the same time on the same band; user i sends bit d_i ∈ {+1, −1} times its code
     c_i; the air carries Σ d_i·c_i; receiver i computes (Σ chips × c_i)/L and decides by sign (L = code length).
  4. Codes are the rows of a 4×4 Walsh–Hadamard matrix (+ + + +, + − + −, + + − −, + − − +), mutually
     orthogonal, so the correlation for an unused code is 0 *(standard; e.g. Proakis, Digital Communications, ch. 13)*.
  5. Capacity: FDMA N ≤ ⌊(B + guard)/(minChannel + guard)⌋; TDMA N ≤ slots per frame; CDMA N ≤ L with orthogonal
     codes. One user more → FDMA/TDMA: refused (caption says why); CDMA: a code must be reused and the two users
     collide (correlation ±2 or 0, bits unreadable).
  6. Order: users get channels/slots/codes in the order they were added (lowest free index first).
- **Params:** `scheme` choice FDMA / TDMA / CDMA (default FDMA); `users` range 1–5 (default 4); `idle` select of a
  user to silence (none default); `bits` per user (toggle per user, CDMA); `guard` toggle (default on).
  Band 100 kHz, minimum channel 12.5 kHz, guard 2.5 kHz, frame 60 ms in 2–4 slots: illustrative.
- **Presets:**
  1. `fdma-4` (from 50ohm FDMA paragraph): 4 users in 100 kHz → 4 channels of ≈ 23 kHz with guards.
  2. `fdma-idle` (50ohm: a channel stays reserved even when not sending): user 2 idle → 25 % of the band unused.
  3. `tdma-dmr` (50ohm names DMR as TDMA): 2 users, one 12.5 kHz channel, 2 slots per 60 ms frame (30 ms
     each) *(check: ETSI TS 102 361-1)*.
  4. `cdma-2` (derived): user 1 sends 1 (+1) with + + + +, user 2 sends 0 (−1) with + − + −; air chips
     (0, 2, 0, 2); receiver 1: +1 → 1; receiver 2: −1 → 0; receiver with code + + − −: 0 (nobody).
  5. `cdma-overflow` (derived): 5 users on 4-chip codes → user 5 reuses code 1; receiver 1 sees 0 or ±2
     and cannot decide.
- **Steps:** explorer, none.
- **Legend:** users by colour plus number label in every strip, slot and chip row; guard band/time (hatched);
  idle reservation (hollow outline). "Changed" marks the strips, slots or chips that moved when the user count
  changed.
- **Captions:**
  - hr: „CDMA: oba korisnika odašilju istodobno na istom pojasu. Na zraku je zbroj (0, 2, 0, 2); množenjem s
    vlastitim kodom prijamnik 1 dobiva +1, a prijamnik 2 −1.“
  - en: "CDMA: both users send at the same time on the same band. The air carries the sum (0, 2, 0, 2); by
    multiplying with its own code receiver 1 gets +1 and receiver 2 gets −1."
- **Terms** (50ohm hr): multiple access — višestruki pristup; FDMA — frekvencijski multipleks; TDMA —
  vremenski multipleks; CDMA — kodni multipleks; time slot — vremenski slot; spreading code — kod za proširenje
  spektra; guard band — zaštitni pojas (check); synchronisation — vremenska sinkronizacija.
- **Misconceptions:** CDMA users take turns (they send together); FDMA wastes nothing (preset 2); CDMA capacity
  is unlimited (preset 5).
- **Out of scope:** OFDMA (link `qam-ofdm`), random access (ALOHA/CSMA: `packet-aprs`), near–far power control,
  real GSM/UMTS parameters.
- **Note for the coordinator:** the task's Depends line asks for kit view K4 (rule table), which does not fit
  this scene; a time × frequency grid is closer to K3 (block grid). The tag `permissions` in "Topic / tags" looks
  wrong; `modulation` or a new `multiple-access` tag fits.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `multiple-access` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh multiple-access sims/multiple-access` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/multiple-access/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
