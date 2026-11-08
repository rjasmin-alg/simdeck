<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# wifi-roaming: notes

New explorer (task `docs/tasks/w3/wifi-roaming.md`, catalogue `net-wifi-roaming`, §4.1, wave 3). Rules, tie-breaks
and expected numbers: `SPEC.md`. Builds on `wifi-association` (soft dependency): no model code is shared (that sim
has no RSSI or roam model, and `models/` has nothing for it), only its vocabulary: station/client, *access point*,
distribution system, Reassociation Request/Response, "the AP notifies the distribution system".

## Decisions

- **Layout.** Left: the corridor over the RSSI chart, **on one x scale** (same gutters), so the client stands right
  above the chart's cursor. The task puts the chart "on the right" of the floor plan; a 60 m corridor beside a chart
  would leave both too narrow at 1920×1080, and the shared scale is the point of the picture. Right: the client's card
  (each AP's RSSI, the difference to the current AP, the link quality with three bars, the trigger and margin in use)
  and the event log.
- **Drawn here, not with kit view K2.** K2 is a grid of cards; the client needs a free position along a line (61
  places) and the chart is not a topology. The corridor uses an SVG with percentage coordinates (no `viewBox`, so line
  widths stay in rem); the chart an SVG with a `viewBox` in metres and dBm, `preserveAspectRatio="none"` and
  `vector-effect: non-scaling-stroke`; every text is HTML on top (labels never scale). Shared request below.
- **The whole walk on the chart.** The state replays to `position` (the task), but the page also draws the rest of the
  walk faded (thick path, hysteresis band, roam marks, ignored requests), so dragging a slider shows at once where the
  roams move. The log lists events up to the client and counts those ahead.
- **Hysteresis band** above the current AP's path, `delta` dB high, hatched with short diagonals computed in data
  space (a pattern would distort under the non-uniform scale). With delta 0 it disappears (`no-hysteresis`).
- **Curves:** AP-A solid, AP-B dashed, AP-C dotted, each with its letter at its peak, so they part in grayscale; the
  current association is the thick path in the AP's colour. Levels: the client's trigger (danger, dashed, labelled at
  the right), −90 "link lost" (muted, dotted), −75 "AP asks" only when `btm` is on.
- **Marks:** ◆ roam (with `A→B`), ✉◆ a roam by request, ✕ a lost link, ✉ with "✕ A→B" an ignored request. The
  changed mark (highlighter plus outline) goes on the roam or request at the client's place, on the new AP's card row
  and corridor label, and on its log entry.
- **Preset positions** are the moments the captions describe (20, 30, 15, 16, 16), not 60 m: the changed mark and the
  caption show the event, the faded rest shows the walk ahead. Drag the slider to walk.
- **BTM rule (rule 5):** the AP names its strongest neighbour only when it is strictly stronger than the current AP,
  and asks once per association. The task's numbers need the first part (request at 16 m, not 15 m, where A and B are
  equal); "once" keeps the log readable for a legacy client (otherwise one request per metre). Both derived.
- **Link lost (rule 6)** is checked first in a step; the client then joins the **strongest** AP from scratch (custom
  −90/0: at 47 m it skips B for C). The task does not say which AP it joins.
- **"Klijent"**, as the task's captions say; the explanation ties it to the station of `wifi-association`.
- **Integers** for the trigger, margin and the dBm axis; one decimal for measured RSSI and differences, decimal comma
  in Croatian, a real minus sign.
- **Panel fit.** With `custom` and `btm` on (all six controls) the panel needed 85 px more than 1080 px allow: presets
  in two columns (as `wifi-channels`), no hints on `client` and `btm` (the card and the chart say the same), shorter
  preset names in Croatian. Measured at the fullest state: hr 864/864 px, en 862/862 px.
- **Related:** `wifi-association`, `wifi-channels`.

## Deviations from the task

- Chart under the corridor, not on its right (above).
- State has `requests`, `look`, `path`, `allRoams`, `allRequests` beside the task's fields, and the roam reason
  `lost` beside `client` and `btm`.
- Presets open at the moment of their event, not at 60 m (above).
- Preset labels shortened (`Uobičajen`, `Ljepljiv`, `AP pita: ignorira`, `AP pita: prihvaća`; en `AP asks: ignored`,
  `AP asks: accepts`).

## Sources

- URM `book/chapters/17-bezicne-mreze.md`: "WLAN i IEEE 802.11: arhitektura mreže i pridruživanje" (BSS, DS,
  scanning, association) and "Šire o temi" (roaming paragraph; footnote `roam`: Diepstraten/Belanger, IEEE
  P802.11-96/49C, slides 33–34: "Station sends Reassociation Request to new AP… Distribution System information is
  updated — normally old AP is notified through Distribution System").
- URM `book/chapters/06-fizicki-sloj.md`, "Kako signal nosi bitove" (slabljenje).
- IEEE Std 802.11-2020 reassociation (§11.3), BSS Transition Management (§11.21.7), fast BSS transition (§13):
  clause numbers from the task, not opened.
- Thresholds from the task's vendor sources (a mobile-OS vendor's roaming note: trigger −70 dBm, candidate about
  8 dB better; an enterprise WLAN design guide: −67 dBm for voice), not opened: no network in this session.
- Numbers checked with a scratch script over all presets (and a sweep of custom triggers for the link-lost case)
  before the page was written; all task numbers matched on the first run.

## Unchecked *(check)*

- 802.11-2020 clause numbers (§11.3, §11.21.7, §13).
- The vendor thresholds: −70 dBm / 8 dB, −67 dBm voice-grade, −80 dBm fair/poor, −75 dBm for the AP's request,
  −90 dBm link lost (teaching values).
- Croatian terms marked below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| roaming | prelazak (između *access pointova*) | URM ch17 describes it ("prelazi iz dometa jednog *access pointa* u domet drugog") without a noun *(check)* |
| reassociation | ponovno pridruživanje | URM ch17 ("zahtjev za ponovno pridruživanje (Reassociation Request)") |
| association | pridruživanje | URM ch17 |
| distribution system | distribucijski sustav | URM ch17 |
| access point | *access point* | URM ch17 (kept in English, italic) |
| hysteresis | histereza | simdeck *(check)* |
| signal strength (RSSI) | jakost signala (RSSI) | simdeck; the book uses neither *jakost* nor *jačina* *(check)* |
| roam trigger | prag (za traženje) | simdeck *(check)* |
| sticky client | ljepljivi klijent | simdeck, loan translation *(check)* |
| BSS Transition Management request | zahtjev 802.11v (BSS Transition Management) | simdeck |
| attenuation | slabljenje | URM ch06 |

## Checks

- Tests: 25 (five tie-breaks first: equal RSSI never roams even at delta 0, equal candidates go to the lower letter
  whatever the list order, a margin equal to delta stays, RSSI equal to the trigger does not look, the AP asks only for
  a strictly stronger neighbour; then rules 1, 2 (three, one that the client's candidate is never its own AP), 4, 5 (three: only asks, once per association, the client's
  rule first), 6, 7, the replay property at every metre, the five presets' numbers, and the generic block).
- Gate: `npm run gate -- wifi-roaming` passes (46/46 browser checks). Screenshots reviewed: gate's light, dark,
  grayscale, phone, both languages; plus my own at each preset's moment, at 60 m with all events, the link-lost case
  and the fullest panel. Fixed on the way: stage text at the stage size (now body size), a "dBm" unit label over the
  chart's subtitle, thresholds shown as "−85,0", **a placeholder used twice in one caption** (`AP-{to}`: `t.parts`
  inserts one node, so the first one came out empty, "a AP- je jači"), "AP-" and its letter breaking across lines,
  the panel overflowing in `custom` + `btm`, the band poking above the chart's top, AP labels colliding on a phone.

- Fresh review (a separate agent, playbook §7.4): recomputed every SPEC number independently (all right), checked the
  rule order, strictness, BTM once per association and the 802.11 claims of the explanation (all right), no vendor
  names on the page. 40 single mutations on a copy: 34 caught, 2 equivalent (`<` → `<=` at −90 and −75, never hit
  exactly at whole metres), 4 survivors, now killed by new assertions: the RSSI values carried by BTM requests and
  roams, and the candidate being chosen among the other APs only (a caption would otherwise name the client's own AP
  as "equally strong"). Fixed from its wording notes: "biva obaviješten" → "dobiva obavijest", no comma before *te*,
  "drugi AP uopće ne traži", the lost-link caption names the AP it joins ("najjačem: …"), "AP pita: ignorira" /
  "AP asks: ignored", "trenutačnom", "Brojevi (prag …, prednost …)" (8 dB is a margin, not a threshold), "Klijent na
  zahtjev AP-a" / "Client, when asked", "gleda ostale AP-ove", "njegova AP-a", *jakost signala*.

## Shared requests

- **Glossary:** the term pairs above, `"src": "simdeck"`, once the owner confirms the *(check)* ones.
- **K2 (or a new view): a free position along a line.** A node placed at a fraction of the width (a walking client, a
  moving host) with links to fixed nodes would let this page and other mobility sims use K2 instead of drawing their
  own corridor. Not needed for this sim.
- **Kit `t.parts`:** a placeholder used twice in one string silently drops the first copy (the node moves). Either
  clone the node on reuse or have `checkStrings` flag repeated placeholders.

## Time

Start 21:06, done (gate, fresh review and its fixes) 21:27: about 21 minutes, one session.
