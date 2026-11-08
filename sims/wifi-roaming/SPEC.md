<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# wifi-roaming: specification

One concept: **the client, not the AP, decides when to roam; sticky clients**. The student walks a client down a
corridor past three access points. Task: `docs/tasks/w3/wifi-roaming.md`; catalogue `net-wifi-roaming` (§4.1).
Model: `sim.js`; tests: `sim.test.js`. Builds on `wifi-association` (its party names, the Reassociation Request /
Response names and the distribution-system note).

## Scene

A corridor 60 m long. Three APs of one ESS (same SSID) on one distribution system (DS), each 3 m off the walking
line: AP-A at 0 m, AP-B at 30 m, AP-C at 60 m (task). The client stands on the line at `position` m.

Explorer: no steps. The state is derived from the params by replaying the walk from 0 m to `position` in 1 m steps
(pure, deterministic). The walk always goes left to right; dragging the slider back recomputes from 0 m. The page
also draws the rest of the walk (up to 60 m) faded, so the chart shows where the next roam will happen; the walk is
causal, so its first part equals the walk to `position` (tested at every metre).

State: `{ x, current, rssi: {A,B,C}, quality, trigger, delta, roams, requests, look, path, allRoams, allRequests }`.
`roams` are `{ x, from, to, reason: 'client' | 'btm' | 'lost', rssiFrom, rssiTo }`, `requests` (802.11v) are
`{ x, from, to, accepted, rssiFrom, rssiTo }`, both up to `x`; `allRoams`/`allRequests` cover the whole corridor;
`path[x]` is the AP the client is on after the step at `x`; `look` is the client's own check at `x` (below).

## Rules

1. **Signal.** RSSI(d) = −40 − 30·log10(d) dBm, d = distance in metres from the AP to the client,
   d = √((x − x_AP)² + 3²). Log-distance model, path-loss exponent 3, −40 dBm at 1 m: a derived teaching model, not
   measured. Signal weakens with distance (URM ch06, "Kako signal nosi bitove", slabljenje).
2. **The client decides** (URM ch17, "Šire o temi": the station sends the Reassociation Request). At each 1 m step:
   if RSSI(current) < `trigger` (strictly), the client looks at the other APs and roams to the strongest only if it is
   better than the current AP by **more than** `delta` dB (strictly greater). Above the trigger it does not look,
   however strong another AP is. Client types: `default` trigger −70 dBm, delta 8 dB; `sticky` trigger −85 dBm,
   delta 8 dB; `custom` the `trigger` and `delta` sliders (task; vendor values, see Sources).
3. **Tie-breaks** (derived). Equal RSSI never roams (strict comparison, delta 0 included). Two candidates with equal
   RSSI: the lower letter (independent of the order they are listed in). A margin exactly equal to `delta` does not
   roam; RSSI exactly at the trigger does not look.
4. **Start and roam.** The client starts associated to AP-A at 0 m (the full join is `wifi-association`). A roam is a
   reassociation: Reassociation Request to the new AP → Reassociation Response, the DS learns where the client is,
   the old AP is notified through the DS (URM ch17, Diepstraten/Belanger slides 33–34). The page's log names the
   three parts on the latest roam.
5. **The AP can only ask** (IEEE 802.11v BSS Transition Management *(check clause)*). With `btm` on, when
   RSSI(current) < −75 dBm and the strongest other AP is strictly stronger than the current one, the current AP sends
   a BTM request naming that neighbour. It sends **one request per association** (a roam starts a new one). A
   `cooperative` client accepts and roams (reason `btm`; the client itself sends the Reassociation Request); a
   `legacy` client ignores it. The −75 dBm level and "once per association" are derived; the task's "accepts if that
   neighbour is stronger" is folded into the AP's condition (the AP names a neighbour only when it is stronger), which
   is what makes the request come at 16 m, not 15 m (at 15 m AP-A and AP-B are equal).
6. **Link lost.** If RSSI(current) < −90 dBm the client loses the AP; it scans and joins the strongest AP from scratch
   (reason `lost`, logged "veza prekinuta / link lost") *(check: value)*. It is the first check of a step.
7. **Link quality** of the current AP: ≥ −67 dBm good (voice-grade), −67 to −80 fair (−80 itself fair), < −80 poor
   (vendor design guides *(check)*).

**Order within one step:** link lost (6), else the client's own rule (2), else the AP's request (5). So a client that
roams by itself is never asked in that step.

**`look`** (for the caption): `{ under, best, margin, enough }`: under the trigger?, the strongest other AP, its
margin over the current AP (dB), margin > delta?

## Params

| Param | Range | Default | Notes |
|---|---|---|---|
| `position` | 0–60 m, step 1 | 0 | the client's place; the walk replays to it |
| `client` | `default` / `sticky` / `custom` | `default` | sets trigger and delta |
| `trigger` | −90…−60 dBm, step 1 | −70 | used by `custom` only (visible then) |
| `delta` | 0–20 dB, step 1 | 8 | used by `custom` only (visible then) |
| `btm` | toggle | off | the AP sends 802.11v requests |
| `support` | `cooperative` / `legacy` | `legacy` | visible when `btm` is on |

## Expected numbers (checked with a script over the model before the page; all in the tests)

RSSI at a few places (dBm, one decimal):

| x | A | B | C | B − A |
|---|---|---|---|---|
| 0 | −54.3 | −84.4 | −93.4 | |
| 15 | −75.5 | −75.5 | −89.6 | 0.0 (exactly equal) |
| 16 | −76.3 | −74.7 | −89.3 | 1.7 |
| 19 | −78.5 | −71.7 | −88.4 | 6.8 |
| 20 | −79.2 | −70.6 | −88.1 | 8.6 |
| 30 | −84.4 | −54.3 | −84.4 | 30.1 |
| 32 | −85.2 | −56.7 | −83.5 | 28.5 |
| 60 | −93.4 | −84.4 | −54.3 | |

Presets (positions are the moments the captions describe; the chart shows the whole walk):

| Preset | Params | Position | Walk |
|---|---|---|---|
| `default-walk` | default | 20 | A→B at **20 m** (A −79.2, B −70.6; at 19 m B is only 6.8 dB better), B→C at **50 m**; ends on C |
| `sticky-client` | sticky | 30 | on A at 30 m (A −84.4, B −54.3); A→B at **32 m** (A −85.2); then never leaves B: at 60 m on B at −84.4 with C at −54.3 |
| `no-hysteresis` | custom, −70, 0 | 15 | equal at 15 m (−75.5), stays (rule 3); A→B at **16 m**, B→C at **46 m** |
| `ap-asks` | sticky, btm, legacy | 16 | request A→B at 16 m ignored, request B→C at 46 m ignored; roams only at **32 m** as `sticky-client` |
| `ap-asks-cooperative` | sticky, btm, cooperative | 16 | request at 16 m (A −76.3), accepted, on B at −74.7; B→C by request at **46 m** |

Also tested: custom −90 / 0 dB loses the link at **47 m** (A −90.2) and joins AP-C (−73.8), skipping AP-B (−77.1).

## Captions (by the state at `x`)

A roam at `x` by the client (the task's English caption: "At 20 m AP-A has dropped to −79 dBm and AP-B is 8.6 dB
stronger: the client sends a Reassociation Request to AP-B"), by a BTM request, a lost link, an ignored request; else
the client's look: under the trigger with too small a margin, an equal candidate, no stronger AP; above the trigger
with a stronger AP beside it (the task's Croatian caption at 30 m: "… a i dalje je pridružen AP-A na −84 dBm: o
prelasku odlučuje klijent, a njegov prag je −85 dBm"), or simply fine. Each ends with the link quality.

## Out of scope

802.11r key caching and timing; 802.11k neighbour reports (named in the explanation only); walls and floors (only
distance); channel planning (`wifi-channels`); association and the 4-way handshake (`wifi-association`,
`net-wpa-handshake`); AP-side minimum-RSSI disconnection (named in the explanation only).

## Sources

- URM `book/chapters/17-bezicne-mreze.md`, "WLAN i IEEE 802.11: arhitektura mreže i pridruživanje": "Što treba
  znati" (BSS, DS, passive/active scanning, association) and "Šire o temi" (roaming: Reassociation Request to the new
  AP, the DS updated, the old AP normally notified through the DS; footnote `roam`, Diepstraten/Belanger, IEEE
  P802.11-96/49C, slides 33–34). `assets/diagrams/ch17-bss-distribucijski-sustav.svg`.
- URM `book/chapters/06-fizicki-sloj.md`, "Kako signal nosi bitove" (slabljenje).
- IEEE Std 802.11-2020: reassociation (§11.3), BSS Transition Management (§11.21.7), fast BSS transition (§13)
  *(check clause numbers: from the task, not opened; no network in this session)*.
- Vendor design guides for the thresholds: roam trigger about −70 dBm with a candidate about 8 dB better; −67 dBm for
  voice *(check: values from the task, not opened)*. Vendors are not named on the page (COMMON.md §1).
