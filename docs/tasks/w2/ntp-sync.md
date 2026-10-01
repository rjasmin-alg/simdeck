# ntp-sync: NTP offset and delay

| | |
|---|---|
| Task | `ntp-sync` (wave 2b, Internet protocols) |
| Catalogue entry | `inet-ntp-sync` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/ntp-sync/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `internet` / `time-sync` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **four timestamps give offset and delay; stratum**.

The student: step an exchange with asymmetric delay.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/18-mrezne-usluge.md` (Uvod u Linux): "Vrijeme na sustavu" (NTP per RFC 5905, `chronyc tracking` output with Stratum 2 and System time, definition *stratum*, `chronyc sources`, `pool`/`server`, port 123 vs 323, "Kako se sat ispravlja" with `makestep 1.0 3` and definitions *postupno usklađivanje*, *usklađivanje skokom*), "Šire o temi" → "Koliko je „točno" točno" (RFC 5905 accuracy figures) and **Primjer 4 — prije nego što se dnevnici triju strojeva skupe**. The book does not derive offset and delay; the formulas come from RFC 5905 §8.
- `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-18/` (diagrams for the chapter)
- RFC 5905 "Network Time Protocol Version 4" §3 (strata), §7.3 (stratum 16), §8 (on-wire protocol, offset and delay)
- chrony documentation `chrony.conf(5)` (`makestep`, `pool`, `server`) and `chronyc(1)` (`tracking`, `sources`)
- Catalogue seed: UL ch18

## Model and presets

- **Scene:** kit view K1 message sequence chart with two lanes, client (its own clock) and server (its clock, stratum shown). Each lane has a clock face and a time axis; the request and the reply are slanted arrows whose slopes show the one-way delays. The four timestamps T1–T4 appear where they are taken, and a calculation panel fills in offset and delay. A side panel shows the stratum chain (stratum 1 with GPS → stratum 2 client), with the source list as UL ch18 shows it.
- **State:** `{ trueOffset, dOut, dBack, proc, t: { T1, T2, T3, T4 }, offset, delay, error, clock: { value, mode: 'step'|'slew'|null }, updates, stepRule: { threshold, limit }, sources: [{ name, stratum, selected }] }`.
- **One step:** one timestamp or calculation, in order: (1) client sends, T1 (client clock); (2) server receives, T2 (server clock); (3) server sends, T3; (4) client receives, T4; (5) compute offset and delay; (6) correct the clock (step or slew); (7) optionally the next exchange.
- **Rules:**
  1. Offset θ = ((T2 − T1) + (T3 − T4)) / 2; round-trip delay δ = (T4 − T1) − (T3 − T2) (RFC 5905 §8).
  2. The formula assumes equal delay both ways; with asymmetric delays the offset is wrong by (dOut − dBack) / 2, and the error can be at most δ / 2 (RFC 5905 §8, check wording).
  3. Server processing time (T3 − T2) is removed from δ and does not affect θ.
  4. Stratum: a primary server with its own reference clock is stratum 1; a machine synchronised to stratum n becomes n + 1; 16 means unsynchronised (RFC 5905 §3, §7.3; UL ch18 "Vrijeme na sustavu", definition *stratum*).
  5. Source selection: among the sources, the one marked `*` is selected; a higher-stratum source is not chosen when better ones agree (UL ch18 source list: two stratum-1 sources, `gu.irb.hr` stratum 3 not selected; full selection algorithm out of scope).
  6. Correction: the book's configuration ("step if more than 1 s, only in the first 3 updates") steps the clock when the adjustment exceeds 1 s, but only in the first 3 updates; otherwise the clock is slewed (sped up or slowed), never going backwards (UL ch18 "Kako se sat ispravlja", definitions *postupno usklađivanje*, *usklađivanje skokom*; the time daemon's documentation as cited there).
  7. Tie-break: an adjustment of exactly 1.0 s is not "larger than" the threshold and is slewed (check against the daemon's documentation).
- **Params:** range `trueOffset` −2000…+2000 ms, default +100; range `dOut` 1–100 ms, default 10; range `dBack` 1–100 ms, default 10; range `proc` 0–10 ms, default 1; range `updateNo` 1–10, default 1 (which update this is, for rule 6).
- **Presets:**
  1. `symmetric` — offset +100 ms, 10 ms each way, 1 ms processing: T1 = 0.000, T2 = 0.110, T3 = 0.111, T4 = 0.021 (s); θ = 0.100 s exactly, δ = 0.020 s. Derived from RFC 5905 §8 (numbers computed, unchecked).
  2. `asymmetric` — out 30 ms, back 10 ms: T2 = 0.130, T3 = 0.131, T4 = 0.041; θ = 0.110 s (10 ms wrong = (30 − 10)/2), δ = 0.040 s, bound δ/2 = 20 ms holds. Derived.
  3. `boot-step` — at boot (update 1) the clock is 5 s behind: |θ| = 5 s > 1 s within the first 3 updates → the clock steps at once. From UL ch18 (step threshold 1 s, first 3 updates).
  4. `late-slew` — the same 5 s at update 10 → slewed; the clock stays wrong for a long time but never runs backwards. From UL ch18.
  5. `stratum-chain` — UL ch18 status and source list: selected source 161.53.78.71 (stratum 1) → client stratum 2, System time 0.000037158 s slow, `gu.irb.hr` stratum 3 not selected. From UL ch18.
- **Steps:** `symmetric` 6; `asymmetric` 6; `boot-step` 7; `late-slew` 7; `stratum-chain` 4.
- **Legend:** two clock faces with their readings, slanted arrows with delay labels, timestamp flags T1–T4 (shape per side), step correction drawn as a jump, slew as a ramp; "changed" marks the timestamp or result computed this step.
- **Captions:** hr: "Pomak θ = ((T2 − T1) + (T3 − T4)) / 2 = ((0,130 − 0) + (0,131 − 0,041)) / 2 = 0,110 s. Stvarni pomak je 0,100 s: put prema poslužitelju trajao je 20 ms dulje, pa je procjena kriva za pola te razlike." en: "Offset θ = ((T2 − T1) + (T3 − T4)) / 2 = ((0.130 − 0) + (0.131 − 0.041)) / 2 = 0.110 s. The true offset is 0.100 s: the path to the server took 20 ms longer, so the estimate is off by half that difference."
- **Terms:** *offset* — pomak; *round-trip delay* — kašnjenje povratnog puta (check); *timestamp* — vremenska oznaka; *stratum* — *stratum* (UL ch18 keeps the English word); *slew* — postupno usklađivanje; *step* — usklađivanje skokom; *time server* — poslužitelj vremena.
- **Misconceptions:** "NTP measures the delay and adds it"; "stratum 1 means most accurate time anywhere" (it means one hop from a reference clock); "a wrong clock is fixed by jumping it" (late corrections are slewed).
- **Out of scope:** clock filter and selection algorithms in full, poll intervals, leap seconds, NTS authentication (UL ch18 "Kad je izvoru vremena potrebno vjerovati" mentions trust), PTP, the Windows domain hierarchy (`win-time-hierarchy` links here).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `ntp-sync` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh ntp-sync sims/ntp-sync` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ntp-sync/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
