<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# backup-ncs: specification

**Concept:** the net survives losing its control station. The student silences the NCS mid-traffic and watches the
pre-named backup NCS, which listened and logged all along, take over after 60 s of silence.

Task: `docs/tasks/w3/backup-ncs.md` (catalogue `kk-backup-ncs`, §4.10). Class stepper, one step = one slot.

## Sources

- **KK2** = `KAKA/KK2_Napredne_Krizne_Komunikacije.pptx`: slide 23 "Ograničenja jednostavne mreže" ("Ispad NCS-a bez
  zamjenskog operatera gasi mrežu"); slide 27 "Zamjenski NCS (Backup NCS)" (named in advance, follows all traffic
  passively, does not transmit unless taking over, 60 s silence → announces, the announcement text, takeover logged
  with UTC time); slide 54 "Greške specifične za napredne operacije" ("Backup NCS preuzima mrežu bez 60-sekundnog
  čekanja"); slide 50 "Vježba 1" (roles incl. 1× Backup NCS).
- **KK1** = `KAKA/KK1_Osnove_Kriznih_Komunikacija.pptx`: slide 29 "Mrežna kontrolna stanica (NCS)" (the only station
  that actively manages traffic, calls stations by name, keeps the log of all messages); slide 32 "Aktivacija mreže"
  (stations check in in alphabetical order of call signs, only when the NCS calls or with an urgent message).
- **Handbook** = `KAKA/KK_Operativni_Prirucnik.docx` §1.1 ("Govori samo kada NCS to odobri ili kada imaš HITNU
  poruku"), §8.2 "Vježba 2 — Preopterećena mreža" (problem 1: the NCS becomes unavailable at minute 30, the backup
  must take over without interruption; evaluation: takeover speed, standard < 60 s).
- **directed-net** = `docs/tasks/w3/directed-net.md` (the model this one builds on; not yet built, see NOTES.md).

## Scene

One simplex channel as a strip of slots (one slot = 15 s, illustrative, directed-net). Above it: the NCS and the
backup NCS (B-NCS), each with its log and its next station; five field stations A–E with one routine message each.
Under the NCS a silence timer (0 … 60 s). Along the strip a band "who controls the net": NCS / nobody / backup /
both. The clock starts at 10:30:00 UTC in slot 1 (illustrative; it gives the UTC log entry of KK2).

## State

`{ slot, ncs: {alive, silentSince, returnsAt, silence, log, ackDue}, backup: {designated, logging,
takeoverAfterSlots, active, announced, handback, takeoverUtc, log, ackDue}, controller: 'ncs'|'none'|'backup'|'both',
stations: [{id, pending, deliveredAt, ackedAt, checkedIn, hadTraffic}], called, checkin, channel: [{slot, kind, outcome,
controller, tx, acts}], events: [{slot, code}], tx }`. A controller's *queue* is derived: the stations not in its log,
in alphabetical order. Event codes: `ncs.silent`, `ncs.return`, `backup.takeover`, `backup.handback`, `ncs.double`,
`net.dead`, `checkin.rerun`, `checkin.done`.

## One step (one slot), phases in order

1. Is the NCS on the air? Silent from `failAt`; back from `returnAt` when `ncsReturns` (never before `failAt + 1`).
   The controller of the slot: NCS on the air and backup active → `both`; NCS → `ncs`; backup active → `backup`;
   else `none`.
2. Who transmits:
   - the station called clearly in the last slot answers (stations speak only when called; directed-net rule 3);
   - else, during a re-run check-in, the next station in alphabetical order checks in (KK1 "Aktivacija mreže");
   - else it is a control slot: each controller on the air transmits its action — the backup: hand back if a
     doubling is pending, else announce if it has not yet, else call; a controller's call is the next station not in
     its log, carrying the ACK of the last message it heard ("primljeno …", directed-net rule 4); with every station
     in its log, it closes the net with the final ACK (never reached inside a demo: the run ends at the last delivery).
3. Resolve: one transmitter → heard; two → doubled, both lost (directed-net rule 6); none → idle.
4. Effects of a heard slot. **Answer:** delivered if a station with a log heard it: the NCS on the air, the active
   backup, or a passive backup that logs (rule 1); each of those logs it and owes its ACK. **Call:** the station
   answers next slot; the ACK sets the station's `ackedAt`, and the passive backup, hearing it, clears its own
   pending ACK (it copies everything it hears, phase 3). **Check-in:** a station without traffic goes into the
   backup's log. **Announce / hand back:** see rules 2, 4, 6.
5. Silence counter: slots the NCS has been off the air (0 when on the air); shown as seconds (× 15).
6. Takeover check: NCS off the air, backup not active, silence ≥ `wait` slots → the backup becomes active and
   announces in the next slot. Without a backup the net is down after 60 s (4 slots) of silence (`net.dead`, once);
   `wait` is the backup's setting and does not apply (the page hides it).

## Rules

1. Every net has a pre-named backup NCS that follows all traffic passively and does not transmit unless it takes
   over (KK2 slide 27). With logging on, it copies every message and ACK it hears into its own log.
2. Takeover after 60 s (4 slots) of NCS silence: the backup announces „Ovdje B-NCS, preuzimam NCS funkciju, svi
   ostali ostaju na kanalu“ (1 slot) and logs the UTC time (KK2 slide 27).
3. While the NCS is silent, stations keep discipline: no transmissions except HITNO (KK1 slide 29, handbook §1.1);
   this page has no urgent traffic, so the channel stays idle.
4. With a log, the backup resumes where the NCS left off: its first call goes to the first station not in its log,
   with the ACK the NCS still owed. Without one it must re-run the check-in: the announcement asks stations to
   check in in alphabetical order, one slot per station (KK1 slide 32); stations without traffic go into its log.
5. No backup → the net stops after 60 s of silence: nobody calls, nothing more is delivered until the NCS comes
   back, if it does (KK2 slide 23).
6. Early takeover is an error (KK2 slide 54): if the old NCS returns while the backup is active, both transmit as
   controller and double; the one that announced later (the backup) hands control back in the next slot, passing
   its log to the NCS *(derived)*.

**Tie-breaks.**
- T1: in the hand-back slot the returned NCS listens; only the backup transmits *(derived)*.
- T2: a station called in the last slot answers even if the NCS has just gone silent; whether it is delivered
  depends on who logs it (rule 1). Silence is counted from `failAt`, including a slot in which a station answers.
- T3: an NCS that returns before the takeover simply resumes from its own log; the silence counter resets.
- T4: the NCS returning in the backup's announcement slot doubles it; rule 6 applies (the backup hands back).
- T5: an ACK is given only by a controller that has the message in its log; a backup without a log never ACKs a
  message it did not hear (station B in `no-log` keeps "no ACK").
- T6: calling order and check-in order are alphabetical (A…E); a controller never calls a station already in its log.
- T7: an NCS that comes back during a re-run check-in listens while the stations check in (the band shows `both`);
  the first control slot after the check-in doubles and rule 6 applies *(derived)*.
- T8: a message that only the passive backup logged (the NCS was already silent) is sent again when the returned NCS
  calls for it, since the NCS's own log lacks it and it owes no ACK; `deliveredAt` keeps the first slot *(derived)*.

**Delivered** means heard by a station that keeps a log (the count the task's presets use). The ACK follows in the
controller's next call; the last message of a run is delivered in the last slot and its ACK falls after the demo.

## Params

`failAt` 3–10 (default 5); `backup` toggle (on); `logging` toggle (on); `wait` 1 slot (15 s) / 4 slots (60 s)
(default 4); `ncsReturns` toggle (off) with `returnAt` 4–20 (default 7).

**Steps (derived):** until the last message is delivered, at most 20; a net that delivers nothing after the failure
runs 15 slots (the takeover preset's length, for comparison); a run still incomplete at 20 stops there.

## Presets (traces checked with the model, `sim.test.js`)

| # | id | params | trace | steps | delivered |
|---|---|---|---|---|---|
| 1 | `takeover` | defaults | A 1–2, B 3–4; NCS silent 5; idle 5–8 (60 s); 9 B-NCS announces (10:32:00 UTC); C 10–11 (ACK B in 10), D 12–13, E 14–15; one 60 s gap | 15 | 5/5 |
| 2 | `no-backup` | `backup: false` | as 1 to slot 4; idle 5–15; `net.dead` in 8; B delivered but never ACKed | 15 | 2/5 |
| 3 | `too-early` | `wait: 1, ncsReturns: true, returnAt: 7` | 5 idle; 6 B-NCS announces; 7 NCS (back) and B-NCS both call C → doubled, C answers nobody; 8 B-NCS hands back; NCS: C 9–10 (ACK B in 9), D 11–12, E 13–14 | 14 | 5/5 |
| 4 | `no-log` | `logging: false` | 9 announces with check-in; A…E check in 10–14; C 15–16, D 17–18, E 19–20; B never ACKed | 20 | 5/5 |

For comparison (not a preset): `ncsReturns: true, returnAt: 7` with the 60 s wait → the NCS is back before the
takeover, C 7–8, D 9–10, E 11–12: **12 slots**, no doubling. Jumping in after 15 s costs 2 slots and a doubled slot.

**Deviation from the task file:** it gives `too-early` 12 steps and "3 of 5 delivered". With rules 1–6 and the
"delivered" count of the other presets, slot 12 has 4 of 5 (D heard in 12); counting only ACKed messages gives 3 but
then presets 1 and 2 would be 4/5 and 1/5. The page runs `too-early` to its own end (14 slots, COMMON.md §11
"run the others to their own end") and compares it with the 12 slots of the patient case in its last caption.

## Legend

NCS (bold box "NCS"), B-NCS (outlined, ear while passive, megaphone when announcing), silence timer (a ring filling to
60 s with seconds), doubled slot (×), controller band (NCS solid, nobody hatched, backup outlined dots, both
cross-hatched, each with its label), changed (highlight: the slot just resolved and the controller band when it
changes).

## Misconceptions addressed

- The backup should jump in at once (preset 3).
- Any station can take over (it is named in advance: rule 1; with no backup the net dies, preset 2).
- The backup only needs to know the frequency (it needs the log: preset 4 takes 5 more slots and B never gets its ACK).

## Out of scope

Priorities (`priority-traffic`), frequency migration, tiers (`gateway-tiers`), real radio failures, urgent traffic.
