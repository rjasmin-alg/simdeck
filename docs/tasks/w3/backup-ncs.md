# backup-ncs: Backup NCS takeover

| | |
|---|---|
| Task | `backup-ncs` (wave 3, Radio and crisis communications) |
| Catalogue entry | `kk-backup-ncs` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/backup-ncs/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | KK |
| Topic / tags / level | `radio` / `backup`, `emergency-comms` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `directed-net` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **the net survives losing its control station**.

The student: silence the NCS mid-traffic.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.
5. `sims/directed-net/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/KAKA/KK2_Napredne_Krizne_Komunikacije.pptx` (text from `ppt/slides/*.xml`): "Ograničenja jednostavne mreže" (losing the NCS without a backup shuts the net down), "Zamjenski NCS (Backup NCS)" (passive monitoring, 60 s silence → takeover, announcement text, UTC log entry), "Greške specifične za napredne operacije" (takeover without the 60 s wait), "Vježba 1" (roles incl. Backup NCS).
- `/home/rjasmin/projects/KAKA/KK_Operativni_Prirucnik.docx` §8.2 "Vježba 2 — Preopterećena mreža" (NCS unavailable at minute 30, backup takes over; evaluation "standard < 60 s").
- `/home/rjasmin/projects/KAKA/KK1_Osnove_Kriznih_Komunikacija.pptx` "Mrežna kontrolna stanica (NCS)", "Aktivacija mreže" (check-in).
- Catalogue seed: KK2 slides

## Model and presets

- **Scene:** the directed net of `directed-net` (one channel as a strip of 15 s slots, stations A–E with their
  messages) with two control stations: the NCS and the named backup NCS. The backup is drawn listening (ear
  icon) with its own copy of the log and queue filling in as traffic passes. A silence counter under the NCS
  (0 s … 60 s) and a "who controls the net" band along the strip (NCS / nobody / backup / both).
- **State:** `{ slot, ncs: {alive, silentSince, returnsAt|null, log, queue}, backup: {designated, logging,
  takeoverAfterSlots, active, log, queue}, controller: 'ncs'|'none'|'backup'|'both', stations: [{id, pending,
  deliveredAt}], channel: [{slot, tx: [ids], outcome}], events: [{slot, code: 'ncs.silent'|'backup.takeover'|
  'net.dead'|'ncs.double'|'checkin.rerun'}] }`.
- **One step:** one slot (15 s), phases in order: (1) the active controller(s) act (call, ACK, announce); (2)
  stations answer only when called; (3) the backup copies everything it heard into its log; (4) silence
  counters advance; (5) takeover check.
- **Reused from `directed-net`:** slots, the NCS calling rule, 2 slots per message (send, then ACK in the next NCS
  transmission), doubling when two stations transmit at once. **New:** NCS failure, the backup's passive log, the
  silence timer, takeover, double control.
- **Rules:**
  1. Every net has a pre-named backup NCS that follows all traffic passively and does not transmit unless it takes
     over (KK2 "Zamjenski NCS (Backup NCS)").
  2. Takeover: the NCS has been silent for 60 s (4 slots) → the backup announces "Ovdje [pozivni], preuzimam NCS
     funkciju, svi ostali ostaju na kanalu" (1 slot) and logs the UTC time (KK2).
  3. Stations keep discipline while the NCS is silent: no transmissions except HITNO (KK1 "Mrežna kontrolna
     stanica"; handbook §1.1); the channel stays idle.
  4. With a log, the backup resumes the queue where the NCS left it (first undelivered message); without one it
     must re-run the check-in: one slot per station (KK1 "Aktivacija mreže").
  5. No backup → the net stops: nobody calls, nothing is delivered (KK2 "Ograničenja jednostavne mreže": loss of
     the NCS without a backup shuts the net down).
  6. Early takeover is an error (KK2 "Greške specifične za napredne operacije"): if the old NCS returns while the
     backup is active, both transmit as controller and double; the one that announced later (the backup) hands
     control back in the next slot *(derived)*.
- **Params:** `failAt` range slot 3–10 (default 5); `backup` toggle (default on); `logging` toggle (default on);
  `wait` choice 1 slot (15 s) / 4 slots (60 s) (default 4); `ncsReturns` toggle with slot (default off).
- **Presets** (traces derived by hand from rules 1–6; queue A…E, one message each):
  1. `takeover` (handbook §8.2 Vježba 2, problem 1; KK2): A delivered in slots 1–2, B in 3–4; NCS silent from slot 5;
     slots 5–8 idle (60 s); slot 9 backup announces; C 10–11, D 12–13, E 14–15. All 5 delivered in 15 slots, one
     60 s gap.
  2. `no-backup`: same failure, no backup → slots 5–15 idle; 2 of 5 delivered; event `net.dead`.
  3. `too-early` (KK2 error list): wait 1 slot; the backup announces in slot 6 and calls C in slot 7; the old NCS
     returns in slot 7 and calls C too → the two control transmissions double in slot 7 and C answers nobody; in
     slot 8 the backup hands control back (rule 6); the NCS calls C in slot 9, C sends 10, ACK 11; the demo ends at
     slot 12 with 3 of 5 delivered *(derived)*.
  4. `no-log`: backup without its own log: takeover at slot 9, re-run check-in slots 10–14 (A…E), then C 15–16,
     D 17–18, E 19–20: 20 slots instead of 15.
- **Steps:** 15, 15, 12, 20.
- **Legend:** NCS (bold "NCS"), backup (outlined "B-NCS", ear while passive), silence timer (filling ring with
  seconds), takeover announcement (megaphone), doubled slot (×), controller band by pattern. "Changed" marks the
  controller band when it changes and the slot just resolved.
- **Captions:**
  - hr: „NCS šuti već 60 sekundi. Zamjenski NCS objavljuje preuzimanje i nastavlja od poruke stanice C, jer je
    cijelo vrijeme vodio vlastiti zapis prometa.“
  - en: "The NCS has been silent for 60 seconds. The backup NCS announces the takeover and continues with station
    C's message, because it kept its own log all along."
- **Terms** (KK2, handbook): backup NCS — zamjenski NCS; takeover — preuzimanje; log — log (zapis prometa); net
  control station — mrežna kontrolna stanica; check-in — javljanje; UTC time — UTC vrijeme; doubling — dupliranje.
- **Misconceptions:** the backup should jump in at once (preset 3); any station can take over (it must be named in
  advance); the backup only needs to know the frequency (it needs the log, preset 4).
- **Out of scope:** priorities (`priority-traffic`), frequency migration, tiers (`gateway-tiers`), real radio
  failures.
- **Note for the coordinator:** KK2 says the backup takes over after 60 s of NCS silence and calls an earlier
  takeover an error, while the handbook's Vježba 2 evaluation sets the standard "brzina preuzimanja < 60 s";
  the spec follows KK2. The Depends line names kit view K3 (block grid), which does not fit this scene (a slot strip
  like `directed-net`'s); drop it or point to the sequence or time view.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh backup-ncs sims/backup-ncs` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/backup-ncs/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
