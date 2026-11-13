<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-radio-discipline: notes

Task `docs/tasks/w3/set-radio-discipline.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native
explorer (no steps): two minutes of radio traffic computed second by second from the params.

## Decisions

- **An explorer, not a stepper.** The task names the class. The whole two minutes are drawn at once as one lane per
  channel, so the contrast (the same traffic with and without the practices) is visible in one picture; the scores
  also carry a "same traffic: no practice / all three" comparison (COMMON.md §11: show each variant's outcome).
- **The channel is its own module, `radio.js`** (catalogue §5.25 asks for shared models in their own module, pure and
  tested). It knows radios, channels, segments and seconds, nothing about a film set, and registers
  `SimdeckModels['radio-channel']`. `kk-directed-net` and `kk-priority-traffic` (not built yet) could reuse it.
- **Deterministic, not random.** Real people do not press on the same tick; the model has no randomness (COMMON.md
  kit rules), so every radio that waits presses in the first quiet second and they double. That is the honest worst
  case of "everyone jumps in when it goes quiet" and it is what the page is about; the timing of each department's
  messages (phase, period) is fixed in `sim.js`. The outcome of one run depends on that timing, so the phases were
  chosen (by a small search over phase sets) so the six presets tell the story in order: never heard → 24 s → 17 s →
  5 s → 2 s, with half the traffic at 4 s. Other settings are honest runs of the same rules and can come out either
  way (e.g. the word with long messages: 13 s, because it cannot cut into a 12 s message already on air).
- **The far radio is deaf, not out of range both ways.** The PA at the road block hears nobody on the floor, but the
  floor hears them. A real hidden station is usually symmetric; one-way keeps the model to one rule ("cannot hear that
  the channel is busy", the catalogue's words) and the floor still waits for the PA when the PA talks first.
- **The emergency word = a quiet second for everyone else.** A radio that is transmitting cannot hear anything, so a
  word said over someone cannot reach them. The model therefore makes the agreed word a rule for everyone: before
  pressing, wait one quiet second; the stop does not wait. The stop then takes the first quiet second (the same idea
  as a shorter wait for priority traffic on a shared medium). It still waits for whatever is on air, which is why the
  word works best with short messages, and it does not reach the deaf radio. The explanation says both.
- **"Copy" is what makes a doubled message noticed.** Without it, a doubled message is lost and nobody knows (the
  sender thinks it went out). With it, the sender misses the copy and repeats after a pause of their own (2–7 s,
  distinct per radio, so two repeating radios do not double again forever). The stop is always repeated (the 1st AD
  sees nobody stop), one second later.
- **The side channel** carries talk between departments (and, when everyone is on one channel, a department's own
  talk too): a 2 s hail on main ("Grip from camera, go to the side channel"), then the talk on the side channel. A
  hail that is doubled without copy loses the whole message.
- **The 1st AD lets go for the stop.** If the 1st AD is mid-call at 0:40 the call is cut (ragged end on the bar) and
  the stop is queued at once.
- **After the stop is heard** the floor goes quiet (queues dropped, no new messages); the far radio goes on, which
  shows once more that it did not hear.
- **Where the stop is for** is not on the page (the page is about the channel, not the hazard; `set-stop-for-safety`
  covers who stops and why).
- **No real case.** Catalogue §4.14 lists this page under "No case needed".
- **Panel fit:** the first layout was 105 px too tall in Croatian; the rate options became "1 min / 30 s / 15 s" under
  the label "… javlja se svakih", the toggles got short names (the hints carry the detail), preset names are short
  ("+ kratko, „copy”"), and the length slider lost its hint (its disabled reason still says why it is off with
  short messages).
- **Lanes grow with their overlaps:** doubled transmissions are stacked in rows inside their lane (greedy, in start
  order), and each lane takes height in proportion to its rows, so a crowded main channel gets the room.

## For the owner (terms and calls as used; *(check)* with the colleague who trains crews)

Loanwords from the owner's list: *1st AD* (declined "1st AD-a"), *gaffer*, *key grip*, *grip*. Not on the list, so
*(check)*:

- *PA* for the production assistant ("PA na blokadi ceste"; the explanation glosses it once as "asistent produkcije")
  *(check)*
- *„copy”* as the acknowledgement in Croatian strings, glossed once as "primljeno" *(check: do Croatian crews say
  copy, kopi, primljeno?)*
- *Stop!* as the call to stop work (bar label "STOP", legend "Stop! od 1st AD-a"). The catalogue's list of calls has no
  stop call *(check the wording crews use)*
- *dogovorena riječ (za hitnoću)* for the agreed emergency word; the page does not say which word *(check whether
  crews have a fixed word)*
- *glavni kanal*, *sporedni kanal*, *kanal odjela* *(check: crews may say "jedinica", "dvojka" for channel numbers)*
- *ručna radiostanica* (explanation) and *radioveza* (title, from the catalogue's Croatian title) *(check: "voki-toki"
  is in the aliases)*
- *preklopljeno* for two transmissions blocking each other *(check)*
- Department names: *Kamera*, *Elektrika (gaffer)*, *Grip (key grip)*, *Rekvizita* *(check: "elektrika" or "rasvjeta";
  "rekvizita" for the props/art department)*
- *blokada ceste* for the road block *(check)*

## Unchecked (*(check)*)

- Published film and TV safety guidance on radio use (channel plans, the main channel for the AD team, an agreed stop
  word) was not read for this page; nothing on the page is taken from it. SPEC.md "Sources" says so.
- All numbers are illustrative (lengths, rates, the 2-minute window, the phases); the page says so in its foot line
  and its explanation.
- No law, directive or Croatian rule is named on the page (none sets a number here).

## Numbers check

An independent replay in Python (written from SPEC.md rules 1–12, not a port of `radio.js`; scratch script, not in
the repo) gave the same six preset rows as SPEC.md: delay none/4/24/17/5/2, doubled 26/3/7/8/4/2, lost 18/3/5/0/0/0,
repeats 6/0/1/6/3/2 (only repeats really sent), waiting 2/0/1/1/1/1, main busy 37/34/27/28/24/24 of 40 s.

## Term pairs (glossary)

None used: the page has no `[[terms]]` (the networking words, collision and hidden node, stay on the linked pages).

## Shared requests

- **Promote `radio.js` to `models/radio-channel.js`** if `kk-directed-net` or `kk-priority-traffic` want a shared
  channel with listen-before-talk, doubles, copies and a priority gap. Its tests are the "radio" block of
  `sim.test.js`.

## Tags and topic

Topic `film-set`, tag `set-procedure` (both in `tags.json`). `related`: `csma-cd`, `hidden-node`,
`set-chain-of-command`. The explanation links `csma-cd` and `hidden-node`.

## Learn tree

Suggested leaf (catalogue §4.14): `film-set` → `day` "Snimateljski dan / The shooting day" → `calls`, next to
`set-calls-sequence`; also in `networks › local › shared-medium`, next to `csma-cd`.

## Review

A fresh reviewer (a separate agent, given the code, SPEC.md and the task, not this file) wrote its own model from
SPEC.md: all six preset rows matched, and so did all 432 parameter sets (2 channel settings × 3 rates × 9 lengths × 8
practice combinations) on every score, the queue and bar by bar. 98 deliberate breaks of `radio.js` and `sim.js`:
79 failed a test, 19 survived. Fixed since:

- `repeats` and ↻ counted repeats that were due but dropped when the stop was heard (`short` 8 → 6, `side` 4 → 3,
  `crowded` 7 → 6); now `noticed` marks a due repeat and `repeat` only one really sent.
- `radio.js` settled same-second endings in list order, so one ending after the stop in the list was dropped; now all
  endings are settled first, then the silence (no visible change in this scene; it matters for the shared model).
- The agreed word's hint and explanation said "on the word everyone lets go", which the model does not do (whoever is
  talking hears nothing); they now say everyone else waits a quiet second and the stop takes the first quiet second.
- The copy second was drawn on cut and doubled bars (no copy came back there); "max" was typed into the page (now
  `qMax`); the amber threshold is named (`LATE`, twice the stop's length) and in SPEC; English letters P for props and
  B for the PA (R and P are the Croatian Rekvizita and PA); the side channel's lane note now fits one channel too.
- SPEC: `reason`, `waited`, `noticed` in the state; the 1st AD's call at 0:40 replaced (rule 4); ±Infinity clamped;
  a stop must end by 1:59; the legend as drawn; the unreachable `busy` reason listed.
- New tests for the real survivors: the far radio keeps its waiting message when the stop is heard, the gap on a side
  channel, a doubled side transmission without copy is lost, the queue skips radios in their pause, the full queue of
  `own`, reason and wait for every preset and for hand-made cases, the radios' fixed timing and pauses, a bar ending
  exactly at 120 s, and the 1st AD's call at 0:40 (the old test of it was vacuous).

Kept: the "clears the channel at once" wording of the task is modelled as "the first quiet second" (SPEC.md top,
"Decisions" above); the stop bar has no text (2 s is too narrow), the legend names it.

## Time

Started 2026-11-13 05:29, done 2026-11-13 06:01, including a fresh review (98 deliberate breaks; the real survivors now have tests).
