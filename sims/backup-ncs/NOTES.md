<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# backup-ncs: notes

Task `docs/tasks/w3/backup-ncs.md` (catalogue `kk-backup-ncs`, §4.10). Rules, tie-breaks and numbers: `SPEC.md`.

## Decisions

- **No shared model to reuse.** The task's soft dependency `directed-net` is not built (no `sims/directed-net/`, nothing
  in `models/`). The directed-net part (slots, calling in alphabetical order, send then ACK in the controller's next
  call, doubling when two transmit) is written here from `docs/tasks/w3/directed-net.md` rules 3, 4 and 6, as pure
  functions over plain data (`nextTarget`, `resolve`, the call/answer branches of `step`), so the coordinator can
  promote it unchanged. There is no opening slot: the demo starts mid-traffic, with the net already active.
- **"Delivered" = heard by a station that keeps a log** (the NCS on the air, the active backup, or a passive backup
  that logs). This is the count the task's presets use for `takeover` (5/5 in 15) and `no-backup` (2/5). The ACK is
  shown separately on each station ("✓ ACK in n", "ACK in the next call", "no ACK").
- **Steps depend on the params:** until the last message is delivered (max 20); a net that delivers nothing after the
  failure runs 15 slots; one still incomplete at 20 stops there. Presets: 15, 15, 14, 20.
- **The NCS's silence counts from `failAt`**, also in a slot where a called station answers (SPEC T2).
- **The hand-back carries the backup's log** to the NCS, so the NCS never re-calls a station the backup already
  handled (SPEC rule 6, derived).
- **Check-in without individual calls:** the backup's announcement asks stations to check in in alphabetical order
  (KK1 "Aktivacija mreže": "javljaju se stanice po abecednom redu"); each answers in its own slot. The backup's log
  after check-in holds the stations that report no traffic.
- **Call signs:** tactical names only ("NCS", "B-NCS", stations A–E), no real-looking amateur call signs. The KK2
  announcement's "[pozivni]" becomes "B-NCS".
- **Clock:** slot 1 starts at 10:30:00 UTC (illustrative), so the takeover entry reads "10:32:00 UTC".
- **Kit view:** none. The task's Depends line names K3 (block grid); the scene is a slot strip with a controller
  band, drawn in the page (the task's own coordinator note says K3 does not fit).
- **Dense strip:** with more than 15 slots (and on the phone) the cells drop their sub-label where the symbol already
  says it (the megaphone, a station letter alone) and use a smaller name, so 20 cells fit at 1920×1080.
- **Related:** `vrrp-failover` (a standby takes over after missed hellos), `quorum-split-brain` (two controllers at
  once), `csma-cd` (doubling on a shared medium). `directed-net`, `priority-traffic`, `gateway-tiers` should be added
  once they exist (`npm run check` refuses ids that do not exist yet).

## Deviations from the task

- **`too-early` runs 14 slots, 5/5 delivered**, not "ends at slot 12 with 3 of 5". With the task's own rules and the
  "delivered" count of the other presets, slot 12 has 4 of 5 (D heard in 12; 3 ACKed). The page runs the preset to
  its end (COMMON.md §11) and its last caption compares it with the patient case: the same NCS return with the 60 s
  wait finishes at slot 12 with no doubling. That comparison is what makes early takeover visibly worse; at a fixed
  slot 12, the early takeover would look *better* than the takeover preset (it waited 45 s less).
- **Extra event codes** `ncs.return`, `backup.handback` and `checkin.done` beside the task's five, for captions.
- The task's state lists `ncs.queue` and `backup.queue`; here a queue is derived from the log (`nextTarget(log)`),
  so it cannot drift from it.

## Sources

- `KAKA/KK2_Napredne_Krizne_Komunikacije.pptx`: slide 23 "Ograničenja jednostavne mreže", slide 27 "Zamjenski NCS
  (Backup NCS)", slide 50 "Vježba 1", slide 54 "Greške specifične za napredne operacije" (text read from
  `ppt/slides/*.xml`).
- `KAKA/KK1_Osnove_Kriznih_Komunikacija.pptx`: slide 29 "Mrežna kontrolna stanica (NCS)", slide 32 "Aktivacija mreže".
- `KAKA/KK_Operativni_Prirucnik.docx`: §1.1 (speak only when the NCS allows or with an urgent message), §8.2
  "Vježba 2 — Preopterećena mreža".
- `docs/tasks/w3/directed-net.md` (model rules).

## Term pairs

Not in `kit/glossary.js`; written out in both tables until the coordinator adds them (`"src": "simdeck"`):

| en | hr |
|---|---|
| backup NCS | zamjenski NCS |
| net control station (NCS) | mrežna kontrolna stanica (NCS) |
| takeover | preuzimanje |
| log | log (zapis prometa) |
| check-in | javljanje |
| acknowledgement (ACK) | potvrda (potvrda primitka) |
| doubling | dupliranje |
| UTC time | UTC vrijeme |
| slot | odsječak |

## Shared requests

- **Promote the directed-net model** once `directed-net` is built: this sim's `nextTarget`/`resolve` and the
  call/answer/ACK handling in `step` should then come from `models/` (COMMON.md §6). Nothing to change in the kit.

## Questions for the owner (for `docs/tasks/OPEN.md`; not edited here, outside the task's scope)

- KK2 says the backup takes over after 60 s of NCS silence and calls an earlier takeover an error; the handbook's
  Vježba 2 evaluation sets "brzina preuzimanja Backup NCS-a (standard < 60 s)". The page follows KK2 (the task's
  coordinator note says the same). Should the handbook's wording be read as "within 60 s of the takeover moment"?
- `too-early`: keep the run to its end (14 slots, compared with 12) instead of the task's "slot 12, 3 of 5"?

## Checks

- `node --test sims/backup-ncs/sim.test.js`: 29 tests, rules and tie-breaks first.
- Mutation check: 28 mutations of `sim.js` (each rule 1–6, tie-breaks T1–T3, T5, T6, T8, doubling resolved as heard,
  the return clamp, the hand-back's log and ACK, events, the 60 s dead net, the check-in record), each fails a test.
- Preset traces checked with a script against the task's numbers (SPEC.md table).
- `npm run gate -- backup-ncs`: pass (66/66 browser checks, 0 exceptions). Screenshots reviewed: 1920×1080 light,
  dark and grayscale in hr and en, 375×812, plus own shots of every preset's key slot (takeover announcement,
  doubled slot, hand-back, check-in, dead net, end states).
- Fresh review (a separate agent, diff against SPEC.md, mutations): it found four caption errors (a doubling
  described as both calling one station when the backup was announcing or the two called different stations; the
  "waiting 60 s would have finished at k" comparison shown when the patient run also doubles; "nothing more is
  delivered" with an NCS that comes back; a station's check-in line read from its current state), two cases the
  SPEC did not cover (now T7 and T8, and a re-send no longer overwrites `deliveredAt`), the net dying after the
  hidden `wait` with no backup (now always 60 s), the `returnAt` slider allowing slots before the failure, and
  untested hand-back state, events and the return clamp. All fixed; 13 more mutations added, all 28 caught.

## Time

Start 2026-11-09 07:23, done 07:51 (CET), one session, including the fresh review and its fixes.
