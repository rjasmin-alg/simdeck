<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-radio-discipline: spec

Task `docs/tasks/w3/set-radio-discipline.md` (catalogue §4.14). One concept: **a handheld radio channel carries one
voice at a time; two people pressing at once block each other and neither is heard, and someone far off may not hear
that the channel is busy; each department has a channel of its own and the main channel belongs to the 1st AD's
calls; long talk moves to a side channel, messages say who for and who from, stay short and are acknowledged
("copy"); a crowded main channel delays the one urgent "stop" call, while an agreed emergency word clears the channel
at once.**

How "clears the channel at once" is modelled: whoever is transmitting hears nothing, so a word said over them cannot
reach them. The agreed word is therefore a rule for everyone else (wait one quiet second before pressing) and the stop
takes the first quiet second, ahead of the queue, but after what is already on air (rule 6; NOTES.md "Decisions").

Class: explorer (no steps). The state follows from the params at once: two minutes of radio traffic, computed second
by second, drawn as one timeline per channel.

## The scene (one fictional production)

A location day on a made-up feature film. Six radios, in this order (the order is the tie-break everywhere):

| # | id | Who | Talks about (cycled, one kind per message) | First message | Period |
|---|---|---|---|---|---|
| 0 | `ad` | the 1st AD | `ad` (a call to all) | 0.25 × period | rate |
| 1 | `camera` | camera | `own`, `cross`, `own`, `ad` | 0.30 × period | rate |
| 2 | `electric` | the gaffer's crew | `cross`, `own`, `ad`, `own` | 0.85 × period | rate |
| 3 | `grip` | the key grip's crew | `own`, `cross`, `ad`, `own` | 0.10 × period | rate |
| 4 | `art` | art department (props) | `own`, `ad`, `cross`, `own` | 0.45 × period | rate |
| 5 | `base` | a production assistant at the road block, far off | `ad` (for the 1st AD) | 0.15 × period | 2 × rate |

`own`: talk within the department; `cross`: to another department; `ad`: for the 1st AD (from the 1st AD: a call to
everyone). The production assistant at the road block is **far off**: they hear nobody on the floor, but the floor
hears them. At **0:40** the 1st AD has to call **stop** (something is wrong on the floor; the page does not say what).

Every number is illustrative (the page says so once): the 2-minute window, the lengths (a long message 4–20 s, a short
one 4 s, "copy" 1 s, the hail 2 s, "Stop! Stop!" 2 s), the rates, the order and the phases. No real production,
person or date; catalogue §4.14 lists this page under "No case needed", so there is no "Based on" line.

## Model files

- `radio.js`: the shared channel, second by second (rules 5–11). Pure, no strings, knows nothing of a film set:
  radios, channels, segments, seconds. Registers `SimdeckModels['radio-channel']`; ready to move to `models/`
  (NOTES.md "Shared requests").
- `sim.js`: the scene, routing, presets and scores on top of it (rules 1–4, 12, 13).

## Params

| key | values | default | meaning |
|---|---|---|---|
| `channels` | `one`, `own` | `one` | the departments' own talk on the main channel, or each department on a channel of its own |
| `rate` | 60, 30, 15 | 30 | seconds between one department's messages |
| `len` | 4 … 20, step 2 | 12 | seconds a message takes without the short-message practice |
| `short` | bool | false | practice 1: short messages that say who for and who from, acknowledged with "copy" |
| `side` | bool | false | practice 2: talk between departments (and, on one channel, a department's own talk) moves to the side channel |
| `word` | bool | false | practice 3: the agreed emergency word |

## State (from `derive(params)`)

```
{ p (cleaned params), chans: ['main', 'side'?, 'own-camera'?, …],
  tx: [{ st, ch, start, end, over, talk, copy, kind, role, doubled, lost, noticed, repeat, cut }],
  queue: [radios waiting for the main channel, per second 0…119],
  heard, delay, doubled, lost, repeats, waiting, busy, stopTries,
  reason: 'far'|'queue'|'wait'|'once'|'busy', waited,
  none: { delay, doubled, lost }, all: { delay, doubled, lost } }
```

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | **Radios and order:** the six radios above, always in that order; it is the tie-break of every same-second choice (who presses first in the list, whose message arrives first). Each department's message *k* (k = 0, 1, …) arrives at `off + k · every`, with `every = rate × period factor` and `off = round(phase × every)` (half rounds up), while it is under 120 s; its kind is `kinds[k mod 4]`. | the scene |
| 2 | **Params cleaned:** an unknown `channels` or `rate` → the default; `len` rounded to the nearest 2 s and clamped to 4 … 20, not a number (or empty, or null) → 12; a number beyond the range (also ±Infinity) is clamped; a practice is on only when exactly `true`. | interaction |
| 3 | **Routing** (a message is one or two segments sent in turn): talk length `T = 4` with `short`, else `len`; "copy" `C = 1` with `short`, else 0, and every segment carries it. An `own` message with `channels = own` goes to the department's channel (`own-<id>`), `T + C`. With `side`, an `own` message (if not already on its own channel) and every `cross` message are a **hail** on main (`2 + C`), then the talk on the side channel (`T + C`). Everything else (`ad`, and `own`/`cross` without `side`) is one segment on main, `T + C`. The stop is one segment on main, 2 s, no copy. | catalogue: "each department has a channel of its own … long talk moves to a side channel … acknowledged (copy)" |
| 4 | **The stop:** at second 40 the 1st AD's stop arrives and goes before everything: the 1st AD's queued messages are dropped, and if the 1st AD is talking, they let go at once (the transmission is cut at 40). A call the 1st AD would make in second 40 itself is replaced by the stop (no preset reaches it). | the task |
| 5 | **One second** (t = 0 … 119), in this order: (a) transmissions that end at t are settled (rules 8, 9); (b) the messages of second t arrive; (c) radios press (rule 6); (d) overlaps are marked (rule 7); (e) the queue is counted (rule 10). A transmission occupies the seconds `[start, end)`; a segment's transmission lasts its talk plus its copy. | the model's clock |
| 6 | **Listen before you press:** a radio with a segment ready, not on air, presses at t if it hears the channel clear: no transmission on that channel started before t and still on air at t. **Tie-break:** radios that press in the same second do not hear each other, so several waiting radios all press the second the channel goes quiet. With `word`, an ordinary segment also waits one quiet second (no transmission on the channel occupied second t − 1); the stop does not wait. **The far radio** (`base`) hears nobody and presses as soon as it is ready. | catalogue: "someone far off may not hear that the channel is busy"; the gap is how a priority call gets in first (like a shorter wait before sending for priority traffic) |
| 7 | **Doubled:** two transmissions on the same channel that share any second block each other: both are **doubled** and neither is heard. Different channels never interfere. | catalogue: "two people pressing at once block each other and neither is heard" |
| 8 | **Who notices:** when a doubled transmission ends, its sender repeats the segment only if they notice (`noticed`): when a "copy" was expected (C > 0), after the radio's own pause (1st AD 2 s, camera 3, electric 4, grip 5, art 6, base 7); the stop, 1 s later (the 1st AD sees nobody react). Otherwise the message is **lost and nobody knows**; its later segments are not sent. A noticed transmission is marked `repeat` only when the repeat really goes on air (it may be dropped first, rule 9). | catalogue: "acknowledged (copy)" |
| 9 | **Heard:** a transmission that ends undoubled delivers its segment; the next segment of the message is ready at once. When the stop is heard (its end second), all transmissions ending in that second are settled first (whatever their order), then everyone on the floor stops: their queues are dropped and they send nothing new. The far radio does not hear it and goes on. | the task |
| 10 | **One radio, one voice:** a radio sends one segment at a time and its messages in arrival order; a new message waits behind the ones before it. **The queue** at t: radios with a segment for the main channel that is ready and not on air. | definition |
| 11 | **Edge of the window:** a transmission still on air at 120 s is drawn to the edge (`over`); the stop counts as heard only if it ends by second 119 (one ending at 120 is outside the window); otherwise `heard = null` ("not heard by 2:00"). | display |
| 12 | **Scores:** `delay = heard − 40` (null if not heard); `doubled`: doubled transmissions on all channels; `lost`: messages lost with nobody knowing; `repeats`: doubled transmissions that were really sent again; `waiting`: the queue at second 39, just before the stop; `busy`: share of seconds 0…39 with something on main (the page shows it as seconds of 40); `stopTries`: stop transmissions. `none` and `all`: the same `channels`, `rate` and `len` with all three practices off and all on. `reason` (caption), first that applies: a stop transmission doubled with the far radio (`far`); doubled with the floor (`queue`); the first stop went after 0:40 (`wait`); at 0:40 (`once`); no stop on air at all (`busy`, unreachable in this scene, kept for safety). `waited`: seconds from 0:40 to the first stop transmission. | display |
| 13 | **Channels drawn:** main; the side channel when `side`; with `channels = own`, the departments' channels in radio order (camera, electric, grip, art). | display |

Out of scope: the radio's range and terrain (the far radio is simply deaf to the floor), capture (the stronger signal
winning a doubled pair), repeaters, scanning several channels, people on a department channel not hearing main, what
the stop is for, and the words of each message.

## Expected numbers (all six presets; checked by `sim.test.js` and an independent script, NOTES.md)

Arrivals at the default rate (30 s): 1st AD 8, 38 (68 … are after the stop); camera 9, 39; electric 26; grip 3, 33;
art 14; base 9 (every 60 s: 69 …). The stop at 40.

| Preset | Params | Stop heard after | Doubled | Lost, nobody knows | Repeats | Waiting at 0:39 | Main busy, of the 40 s before | none / all (delay) |
|---|---|---|---|---|---|---|---|---|
| `crowded` | one channel, every 30 s, 12 s | not within 80 s (7 tries) | 26 | 18 | 6 | 2 | 37 s | — / 4 s |
| `quiet` | every 60 s | 4 s | 3 | 3 | 0 | 0 | 34 s | 4 s / 2 s |
| `own` | own channels | 24 s | 7 | 5 | 1 | 1 | 27 s | 24 s / 2 s |
| `short` | own + short | 17 s | 8 | 0 | 6 | 1 | 28 s | 24 s / 2 s |
| `side` | own + short + side | 5 s | 4 | 0 | 3 | 1 | 24 s | 24 s / 2 s |
| `word` | own + all three | 2 s | 2 | 0 | 2 | 1 | 24 s | 24 s / 2 s |

What each shows: `crowded`: one channel at this rate is full; the queue presses together every time it goes quiet,
the far radio presses over whoever is talking, 18 messages are lost without anyone knowing, and the stop is never
heard. `quiet`: the same habits with half the traffic: heard in 4 s, so the problem is the load. `own`: the
departments' own talk leaves main; main is quieter but the far radio's doubles and the queue still delay the stop
24 s. `short`: nothing is lost any more (all 8 doubled transmissions are noticed; 6 are repeated, 2 were still due when the stop was heard), at the cost of repeats.
`side`: talk between departments leaves main too; 5 s. `word`: the stop goes the moment the channel is quiet; 2 s.

## Legend and captions

- Bars: one per transmission, on its channel's lane, in the radio's colour with its letter; overlapping bars get rows
  of their own in the lane. Doubled: hatched, with a red top edge; lost: ✕; repeated: ↻; cut: a dashed end; the
  copy: the last second, lighter, only on a transmission heard to its end. The stop: a black bar (too narrow for text;
  the legend names it).
- Scores: the "heard after" tile is green, and amber when the delay is more than twice the stop's length (4 s); red
  when the stop is not heard.
- Markers: a dashed line at 0:40 ("stop needed"), a solid line at the second it is heard, the delay between them.
- Under main: the queue, one small column per second.
- Caption: the delay (or "not heard"), the doubled and lost counts, then one line on the main reason, first that
  applies (`reason`): the far radio pressed over the stop; the stop was doubled by the queue; it waited for a message
  on air; it went at once; (the channel was never quiet).

## Misconceptions targeted

- "If I can't hear anyone, the channel is free" (the far radio).
- "If two people talk at once, the louder one gets through" (on this page neither does; capture is out of scope).
- "Saying copy wastes air time" (without it, doubled messages are lost and nobody knows).
- "In an emergency, just press and shout" (pressing over others doubles the stop; the agreed word and the quiet
  second let it through).
- "More channels make it worse" (department channels take their talk off main).

## Terms (both languages)

main channel / glavni kanal; side channel / sporedni kanal; own channel / kanal odjela; doubled / preklopljeno
(dvoje u isto vrijeme); copy / „copy” (primljeno) *(check)*; the agreed emergency word / dogovorena riječ za
hitnoću *(check)*; handheld radio / ručna radiostanica *(check)*; road block / blokada ceste. Croatian loanwords for
roles (1st AD, gaffer, key grip, grip) per the owner's set-language rule.

## Sources

- Catalogue §4.14 (`set-radio-discipline`) and §5.25 (links to `csma-cd` and `hidden-node`).
- Published film and TV safety guidance (industry safety bulletins and broadcasters' production safety guidance) says
  that radio use on set is a safety matter: channel plans, the main channel reserved for the AD team, and an agreed
  way to stop work. *(check: the specific documents were not read for this page; no figure or wording is taken from
  them.)*
- The access rules (listen before transmitting, collisions when two start together, a station that cannot hear the
  others, a shorter wait for priority traffic) are the textbook shared-medium rules taught in `csma-cd` and
  `hidden-node`; on this page they are only the reason behind each practice.
- No EU directive or Croatian rule sets a number on this page, so none is named on it.
