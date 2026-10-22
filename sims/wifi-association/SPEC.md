<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# wifi-association: specification

One concept: **scan, authenticate, associate, then the 4-way handshake**. The student steps a station joining an
access point. Task: `docs/tasks/w2/wifi-association.md`; catalogue `net-wifi-association` (§4.1). Model: `sim.js`;
tests: `sim.test.js`.

## Scene

A station STA wants to join the network `Grafo` (the user picked it; on WPA the password is saved). In range:

| AP | BSSID | SSID | Channel | Signal | Security | AID it gives |
|---|---|---|---|---|---|---|
| AP1 | `02:1a:2b:3c:4d:01` | Grafo | 6 | −45 dBm | the `security` param | 4 |
| AP2 | `02:1a:2b:3c:4d:02` | Grafo | 11 | −70 dBm | the `security` param | 2 |
| AP3 | `02:7e:55:90:00:03` | Kafic | 1 | −55 dBm | Open | (never asked) |

Channels, SSIDs and the two Grafo signals are the task's; AP3's signal (−55 dBm, stronger than AP2) and the BSSIDs and
AIDs are chosen here (AP3 stronger than AP2 shows that the station filters by SSID before it compares signals). The
BSSIDs are locally administered (`02:` prefix), no vendor.

The chart (kit view K1) has four lanes, STA, AP1, AP2, AP3 (the task names three; AP3 needs a lane for its Beacon and
Probe Response). The time column shows the channel each frame goes on.

## State

`{ n, phase, ev, done, scanMode, security, heard: [{ ap, bssid, ssid, ch, rssi, sec, via }], chosen, refused, pair,
staState, dataOn, frames: [{ type, from, to, ch, … }], aid, status }`. `pair` is the station's state with each AP,
modelled on the 802.11 states (IEEE 802.11-2020 §11.3): 1 not authenticated, 2 authenticated, 3 associated, 4 keys
installed. The standard's state 4 also covers an association that needs no keys (an open network goes straight from 2
to 4); this model keeps an open network at 3 so that state 4 always means keys, and the ladder shows the keys rung as
"none on an open network". `staState` is the
ladder rung towards the chosen AP: `none` → `auth` → `assoc` → `keys` (WPA only) → `data`. `frames` are the chart rows
in order; a `ds` row is the note "the AP informs the distribution system".

## One step

One frame exchange or one decision, in this order (`plan(params)`):

1. **Scan.** Active: step 1 is the probing, one broadcast Probe Request per channel in turn (1, 6, 11), waiting briefly
   on each for answers before moving on; step 2 shows the Probe Responses collected (AP3, AP1, AP2: each AP answered on
   its own channel). The chart draws the probes as one row and the answers after it, so the captions say how it
   really interleaves. Passive: one step per channel, each bringing
   that channel's Beacon (AP3, AP1, AP2).
2. **Choose** an AP (rule 2).
3. **Authenticate** with it: one step for Open System (two Authentication frames), two for SAE (Commit each way, then
   Confirm each way).
4. **Association Request**, then **Association Response** (two steps). With `reject`, the first AP refuses (status
   17); the same step turns the station to the next AP by rule 2 and steps 3–4 repeat with it.
5. **4-way handshake** (WPA2 and WPA3 only): one collapsed step that links to `wpa-handshake`.
6. **Data**: the station sends its first data frame.

**Tie-breaks.** Scan order is by channel, lowest first (1, 6, 11), so the scan list fills AP3, AP1, AP2 in both modes.
Choice: strongest signal among the APs with the wanted SSID that have not refused; equal signals: the one heard first
(tested with a changed scene).

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | Scanning is **passive** (listen for the Beacons each AP sends periodically) or **active** (a Probe Request on each channel, then the Probe Responses). Both give the same information, the SSID included: the scan list ends the same. | URM `17-bezicne-mreze.md` "WLAN i IEEE 802.11: arhitektura mreže i pridruživanje" (Diepstraten and Belanger, slides 35–40) |
| 2 | **Every AP that hears the probe answers**; the probe asks for any network (wildcard), so Kafic answers too. **The station chooses**: here the strongest signal among the APs carrying the network it wants. The rule for choosing is the client's own, not fixed by the standard. | URM ch17 ("Station selects best AP."; Primjer 2: "Probe Response šalje svaki *access point* koji sondu čuje"). IEEE 802.11-2020 leaves the choice to the station's management entity *(check)* |
| 3 | **Authentication always comes before association**, never the reverse. The model refuses an Association Request without it (tested). | URM ch17 Primjer 2 |
| 4 | WPA2-Personal and Open networks use **Open System** authentication: it lets any client in and is not the security step (the password is checked later, in the handshake). WPA3-Personal runs **SAE** in the Authentication frames instead: Commit each way, then Confirm each way. | URM ch17 "Sigurnost bežične mreže" (Vanhoef and Piessens §2.2); IEEE 802.11-2020 §12.4 *(check)* |
| 5 | **Association Request → Association Response.** Status 0 = success: the AP gives an association ID (AID) and informs the distribution system. A non-zero status (here 17: the AP cannot take more stations) leaves the station authenticated with that AP but not associated; it tries the next AP by rule 2. | URM ch17; IEEE 802.11-2020 §9.4.1.9 (status codes, 17 = "denied, AP unable to handle additional associated STAs") *(check)* |
| 6 | On a **WPA** network no data frame passes until the 4-way handshake has installed keys; on an **Open** network data flows right after association, unencrypted, and anyone in range can read it. | URM ch17 "Sigurnost bežične mreže" |

## Params

`scan`: active | passive (default active). `security`: open | wpa2 | wpa3 (default wpa2), the Grafo network's.
`reject`: the first AP asked refuses the association (default off). `scan` and `security` change the step list and
send the demo to step 0; `reject` changes only the steps from the Association Response on.

## Presets and expected numbers

Checked with a scratch script before the page, and in `sim.test.js`.

| Preset | Params | Steps | Run |
|---|---|---|---|
| 1 `book-order` | defaults | 8 | Probe Request → Probe Responses (AP3, AP1, AP2) → choose AP1 → Authentication (Open System) → Association Request → Association Response (status 0, AID 4) → handshake → data (encrypted). URM ch17 Primjer 2 |
| 2 `passive` | `scan: passive` | 9 | Beacon AP3 (ch 1), AP1 (ch 6), AP2 (ch 11), then as preset 1 from the choice |
| 3 `choose-best` | defaults, opens at step 2 | 8 | Both Grafo APs answered; step 3 picks AP1 (−45 dBm over −70 dBm), not Kafic (−55 dBm, another network) |
| 4 `open-network` | `security: open` | 7 | As preset 1 without the handshake; data unencrypted right after association |
| 5 `wpa3` | `security: wpa3` | 9 | SAE Commit (both ways), SAE Confirm (both ways) in place of Open System; then as preset 1 |
| 6 `rejected` | `reject: true` | 11 | AP1 answers the Association Request with status 17; STA stays authenticated with AP1, not associated, and turns to AP2: Authentication, Association (status 0, AID 2), handshake, data |

The largest run is passive + WPA3 + reject: 14 steps.

## Out of scope

The 4-way handshake and key derivation (`wpa-handshake`), 802.1X/EAP, roaming and reassociation, channel planning,
CSMA/CA, the Beacon interval and probe timing, Shared Key authentication, hidden SSIDs.
