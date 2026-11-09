<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# priority-traffic: notes

Task `docs/tasks/w3/priority-traffic.md` (catalogue `kk-priority-traffic`, §4.10). Rules, tie-breaks and numbers:
`SPEC.md`. A new native stepper, one slot per step.

## Decisions

- **The net is already running at step 0.** Messages registered at slot ≤ 0 form the queue and the NCS's slot-0
  transmission called the first of them, so it sends in slot 1. This is what the task's traces need (`emergency`: A
  sends in 1 and B in 3; `four-priority`: C sends in 1 and A is delivered in 12).
- **One exchange holds the channel** until its message is delivered: send → ACK (2 slots); with no ACK the slot after a
  send is silent ("no ACK"), the sender repeats, and after the third try it goes to its relay (relay → relay ACK →
  "E via F" → NCS ACK). This gives the task's `no-ack` trace (tries 1, 3, 5; delivered in 10). The NCS keeps waiting
  for the station it called rather than calling the next one.
- **The relay's forward keeps the sender's turn** (it sends in the slot after its ACK) instead of registering and
  waiting to be called; registering would cost a call slot and give 11, not the task's 10. It is still "[sender] via
  [relay]" at the same priority (rule 6).
- **What a break-in cuts** (rule 3, the task names only "the current transmission"), by what the slot would have
  carried: a message being sent, or being passed to the relay, is *interrupted* and goes back to the front of its
  priority with its tries kept; in a no-ACK slot nothing is on the air, so the exchange is only suspended (same place,
  not marked interrupted); a relay's ACK is cut but the relay already holds the message and sends it "via" itself when
  called; an NCS ACK is *owed* (the NCS heard the message) and rides on the HITNO's ACK, so that message is not resent;
  a call or announcement simply happens later.
- **A HITNO from a station the NCS cannot hear does not break in**: the NCS would not hear the break-in. It can only be
  in the model as a message registered before contact was lost (the page refuses new ones from a cut-off station, but
  changing the cut-off select after injecting reaches it); it waits at the front of the queue and then retries and
  relays like any message, its tries counted.
- **HITNO vs HITNO:** a second HITNO does not cut the first, nor jump one that waits; it queues behind them (FIFO,
  simultaneous ones by call sign) and is called with the first one's ACK. A waiting HITNO is also called before a
  pending restriction announcement, which then rides on the next ACK. In reality two stations shouting "HITNO" at once would double;
  doubling is `directed-net`'s concept, not this one's.
- **Registration costs no slot** (the task's step phase 1). An idle NCS calls in the same slot a message registers.
- **The restriction** is announced in the NCS's next transmission: an ACK slot carries it instead of the next call, so
  it costs exactly 1 slot; on an idle net it is a slot of its own. A second request before it is aired cancels it.
  The 15-minute repetition (KK2) is out of the demo's time span and only mentioned.
- **The restriction applies with `priorities` off too** (FIFO among PRIORITET and HITNO): it is the NCS's
  announcement, not the queue order.
- **INFORMATIVNO** under the restriction waits too (rule 4 follows KK2's "samo PRIORITET i HITNO"; see the coordinator
  note in the task).
- **Steps** come from the model: the first slot after the last scheduled event in which nothing is left to do, at most
  20 (the task's 10, 8, 12, 10). `sim.json` `steps` = the defaults = preset 1 = 10. A restriction that holds RUTINSKO
  traffic forever runs to 20; the last caption says how many wait.
- **Injection buttons** (HITNO, PRIORITET, RUTINSKO, INFORMATIVNO; keys E, P, U, I) append a token for the next slot to a
  hidden param `inject` (`0AR.0BR.0CR.3DH`), as `packet-aprs` keeps its extra beacons; the restriction button (key S)
  toggles a slot in a hidden param `restrict`. The sender is chosen in a select. At most 12 messages and 6
  announcements, none after slot 19; the caption says why when a button refuses. The kit restores only params with a
  control from the URL, so a link carries the preset, step, priorities and cut-off station, not the injected messages.
- **A cut-off station cannot register a new message** (the NCS cannot hear its check-in), so its inject buttons refuse
  with a caption. In `no-ack` E's message was registered before it lost contact; the model accepts such tokens for
  any station.
- **Relays are fixed pairs** A↔B, C↔D, E↔F *(derived)*; the station card shows each one.
- **Captions** follow the task's slot-3 caption for the break-in; the last step compares a delivered HITNO with the
  other mode (priorities on/off), run to its own end (COMMON.md §11). In `fifo` it adds the task's "with 10 routine
  messages ahead it would be 20 slots".
- **Colour is never alone:** priority by shape and prefix (◆ HIT, ▲ PRI, ● RUT, ○ INF; HIT border thicker, INF dashed),
  the colour third; cut by ✂, waiting for an ACK by ⌛, delivered by ✓, relay slots by a dashed border and ┄→, not
  heard by a dashed outline and ✗, held under the restriction by a dashed row and ⏸, the restriction banner by ⚠ and a
  thick border. Checked in the grayscale screenshot.
- **Procedure words stay Croatian** on the English page (HITNO, PRIORITET, RUTINSKO, INFORMATIVNO, "PROMET SAMO
  PRIORITET I HITNO"), as in the task's English caption, with the English meaning in the explanation, captions and
  restriction banner. The prefixes HIT/PRI/RUT/INF and call signs are data (`translate="no"`).
- **Glossary:** the page does not load `glossary.js`: its `preemption` is "preempcija" (operating systems) and `relay`
  is "prosljeđivanje" (mail), neither meant here. The explanation writes the terms out (term pairs below).
- **Model reuse:** the call signs and the 2-slot exchange come from `directed-net` (`sim.js @ 23dc9d1`, not in
  `models/` yet); its step functions are not copied, since its lanes have no priorities. The exchange here is a state
  machine of its own; `enqueue`, `requeueFront`, `eligible` and the step are pure over plain data if `backup-ncs` or
  `gateway-tiers` want them.
- **Related:** `directed-net`, `backup-ncs`.

## Deviations from the task

- **`reachable` toggle per station → one `cutoff` select** (nobody, A … F): six toggles do not fit the panel on one
  screen with the inject buttons; one station at a time also keeps its relay reachable. The model accepts several
  (`cutoff: 'EF'`), and then the message leaves "on another channel" (tested).
- **State:** the task's `current.phase` has more values (`wait`, `goahead`, `relay`, `relayAck`); `ncs` adds
  `announce` (requested, not yet aired) and `ackOwed`; `log` entries carry codes instead of text and one per slot (the
  strip); messages add `via`, `offChannel`, `registeredAt`; `text` is left out (no language in the model).
- **Legend:** the four priority shapes are one legend item ("priority: shape and prefix"); the queue box heads its
  list with the order of service, ◆ HIT > ▲ PRI > ● RUT > ○ INF, which names each shape. "Cut" is ✂ with the word
  "prekinuto"/"cut off" in the queue row.
- "Changed" marks the queue rows that moved, the slot just resolved, the stations on the air in it and new deliveries.

## Sources

- `KAKA/KK1_Osnove_Kriznih_Komunikacija.pptx` (text read from `ppt/slides/*.xml`): slide 35 "Format poruke — osnova"
  (three priorities there), slide 38 "Prioriteti poruka" (HITNO before all; INFORMATIVNO "kada nema hitnog prometa";
  the NCS may suspend routine traffic), slide 39 "Hitna poruka — postupak" (break-in, "primljeno, predajte hitnu
  poruku", all other traffic stands by), slide 41 "Potvrda primitka (ACK)" (without an ACK not delivered; three
  unsuccessful tries → another channel or relay), slide 30 "Uloge u mreži" (relay stations), slide 32 (call order by
  call sign, used for the tie-break).
- `KAKA/KK2_Napredne_Krizne_Komunikacije.pptx`: slide 29 "Prioritizacija prometa pod opterećenjem" ("PROMET SAMO
  PRIORITET I HITNO", repeated every 15 min), slide 30 "Upravljanje redovima čekanja (Queue)" (HITNO > PRIORITET >
  RUTINSKO; HITNO waits 0 s and breaks in), slide 26 "Međumrežna veza — Gateway operater" (the "via" format).
- `KAKA/KK_Operativni_Prirucnik.docx` §3 "Prioritetne razine" (prefixes HIT/PRI/RUT/INF; preemption column;
  RUTINSKO "Redosljed prema NCS odluci", read as FIFO *(derived)*), §4.3 "Slanje HITNE poruke", §4.4 "Potvrda primitka
  (ACK)", §5.2 "Upravljanje prometom", §8.1 Vježba 1 problem 3 (`emergency`), §8.2 Vježba 2 problem 3 (`four-priority`).
  The handbook asks exercises to say "SIMULACIJA HITNO"; the sim is a model, not an exercise on the air, and says
  "HITNO" as the slides do *(check)*.

## Term pairs

Not in `kit/glossary.js` with this meaning; written out in both tables:

| en | hr |
|---|---|
| priority | prioritet |
| preemption | prekidanje *(check: the task says "prekidanje (prednost)"; the glossary's OS term is "preempcija")* |
| queue | red čekanja |
| acknowledgement (ACK) | potvrda primitka (ACK) |
| relay (station) | relej, relejna stanica |
| net control station (NCS) | mrežna kontrolna stanica (NCS) |
| restriction ("priority and emergency only") | ograničenje ("PROMET SAMO PRIORITET I HITNO") |
| slot | odsječak |

## Shared requests

None. (`directed-net`'s model is not in `models/`; this sim copies only its call signs, see above.)

## Checks

- `npm run gate -- priority-traffic`: pass (65/65 browser checks), screenshots reviewed: 1920×1080 light, dark,
  grayscale and 375×812 in both languages, plus each preset at its key steps and a restriction run.
- Every rule broken once on purpose: 28 mutations of `sim.js` (FIFO, call-sign tie, order, no break-in, an unheard
  HITNO breaking in, a HITNO jumping a waiting one or queued in front of older ones, cut to the back, a suspended
  exchange lost or marked interrupted, a relay losing a held message, owed ACK dropped or delivered in the go-ahead,
  no go-ahead, announcement in the go-ahead, lost in a break-in, before a waiting HITNO or with a call, restriction
  ignored or only with priorities, HITNO tries not counted, limits, two tries, heard = delivered, no relay, via not
  kept): each fails at least one test.
- **Fresh review** (a separate agent on a detached copy, against SPEC.md and the task): it found an unheard HITNO
  breaking in, a later HITNO jumping a waiting one (and an announcement delaying a waiting HITNO), a no-ACK slot
  treated as an interrupted transmission, a relay re-asked for a message it held, a wrong example in SPEC "Other
  numbers", 10 mutations the tests missed, a dead caption, an untranslated "FIFO", Croatian gender agreement in three
  captions, and English "cut off" used for two things. All fixed; each finding has a test.

## Timing

Started 2026-11-09 19:19 CET; done (gate, fresh review and its fixes, status ready) at 19:47 CET: about 28 minutes.
