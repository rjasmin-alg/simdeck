<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# wifi-association: notes

New stepper (task `docs/tasks/w2/wifi-association.md`, catalogue `net-wifi-association`, §4.1, wave 2b). Rules,
tie-breaks and expected numbers: `SPEC.md`. The frames are drawn with kit view **K1, message sequence chart**
(`kit/sequence.js`); the network list and the state ladder are a page panel beside it.

## Decisions

- **Layout.** Two columns. Left, the station's panel: the network it wants (Grafo, with its security badge and
  "password saved"), the network list filling as Probe Responses or Beacons arrive (SSID, how it was heard, channel,
  signal bars and dBm, security badge; the chosen row outlined with ▶, a refused row struck with ✕ and its status),
  and the state ladder towards the chosen AP (not authenticated → authenticated → associated with its AID → keys
  installed → data passes; the keys rung hatched "none on an open network"). Right, the K1 chart with lanes STA, AP1,
  AP2, AP3; each AP card shows SSID, security badge, channel and signal, BSSID and the station's state with that AP;
  the chosen AP's card has the thick border. Meaning is never colour alone: badge borders (open dashed, WPA2 solid,
  WPA3 double), ✓/▶/✕ marks, hatching and words.
- **Four lanes, not three.** The task names lanes STA, AP1, AP2; AP3 (Kafic) gets a lane too, since its Beacon and
  Probe Response are frames on the chart.
- **Time column = channel.** There are no meaningful times; the channel each frame goes on shows the station hopping
  channels while scanning and staying on its AP's channel after.
- **One Probe Request row for the active scan.** Really the station probes channel 1, waits briefly for answers, then
  channels 6 and 11; the chart draws one dashed broadcast row "ch 1,6,11" to all three APs and the answers after it,
  and the two captions say how it really interleaves (fixed after the review; the first caption implied all probes went
  out before any answer).
  The probe is a wildcard (any SSID), so Kafic answers too: active and passive scans then fill the same list (rule 1).
- **All responses in one step** (the task's "responses heard"), drawn as three rows in channel order (AP3, AP1, AP2).
  Passive: one Beacon per step, one channel per step, same order.
- **Choice:** among the heard APs carrying the wanted SSID that have not refused, the strongest signal; ties go to the
  AP heard first. AP3's signal (−55 dBm, not in the task) is stronger than AP2 on purpose: the caption points out that
  the station filters by network name before it compares signals.
- **Frames to STA carry no fields beside the chip.** Those arrows run left towards the time column, where fields
  spilled into it; their status (`status 0`, `status 17`, SAE `Commit` / `Confirm`) is the boxed word under the
  channel instead. Frames from STA keep their fields (Open System, SAE Commit, the SSID asked for, any SSID).
- **Authentication = two frames per step** (Open System sequence 1 and 2; SAE Commit each way, then Confirm each way:
  two steps). The AID is in the STA card, the ladder and the caption, not on the chart.
- **Refusal:** with `reject`, the first AP asked answers status 17; the same step turns the station to the next AP by
  the same rule (no second choose step, which keeps the task's 11 steps). The station stays authenticated with AP1
  (its card says so) and the ladder restarts towards AP2.
- **The handshake** is one row from the AP, chip "handshake", with "keys" at STA; the caption links to the
  `wpa-handshake` sim (`../wpa-handshake/index.html?lang=…`, the same relative link `hw-side-effects` uses).
- **Data** is one Data frame from STA: with the lock (double line) on WPA, "unencrypted" at the AP on an open network.
- **`choose-best`** has the default params and opens at step 2 (the list full, nothing chosen yet), so the presenter
  can ask "which one?" before pressing →. Its run is the same as `book-order`.
- **Params:** `scan` and `security` reset to step 0 (they change the step list); `reject` keeps the step (it changes
  nothing before the Association Response; tested).
- **Related:** `wpa-handshake`, `hidden-node`, `dhcp-dora` (what comes after association).

## Deviations from the task

- Four lanes instead of three (above).
- The scan list order is by channel (AP3, AP1, AP2) in both modes; the task's `book-order` names only the Probe
  Responses of AP1 and AP2, but with a wildcard probe AP3 answers too (needed for rule 1's "same information").
- AP3's signal, all BSSIDs (locally administered, `02:` prefix), the AIDs (AP1 4, AP2 2) and status 17 are chosen
  here.

## Sources

- URM `book/chapters/17-bezicne-mreze.md`: "WLAN i IEEE 802.11: arhitektura mreže i pridruživanje" (BSS,
  distribution system, passive/active scanning, authentication then association; Diepstraten and Belanger slides
  17, 35–40), "Sigurnost bežične mreže" (Open System, Vanhoef and Piessens §2.2; WPA3/SAE), Primjer 2 (frame order).
  `assets/diagrams/ch17-pridruzivanje-koraci.svg` (the five frames; "access point obavještava distribucijski
  sustav").
- IEEE 802.11-2020 §9.4.1.9 (status codes), §11.3 (station states 1–4), §12.4 (SAE): from memory, no network in this
  session.
- Numbers checked with a scratch script over all six presets before the page was written.

## Unchecked *(check)*

- Status code 17 = "association denied because the AP is unable to handle additional associated STAs" (IEEE
  802.11-2020 Table 9-50), from memory.
- SAE order: the station's Commit first, then the AP's; then the station's Confirm, then the AP's (the usual
  exchange; the standard lets the AP's Commit and Confirm come in either order relative to the station's).
- That the station's AP choice is left to the implementation (task rule 2, "check").
- Croatian terms marked below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

`4-way handshake` is in the glossary and used as `[[4-way handshake]]`.

| English | Croatian | Source |
|---|---|---|
| association | pridruživanje (mreži) | URM ch17 |
| beacon | signalni okvir | URM ch17 |
| probe request / response | sonda / odgovor na sondu | URM ch17 |
| authentication | autentikacija | URM ch17 |
| access point | *access point* | URM ch17 (kept in English, italic) |
| distribution system | distribucijski sustav | URM ch17 |
| SSID | SSID (mrežno ime) | URM ch17 |
| Open System (authentication) | otvoreni sustav | URM ch17 ("autentikacija otvorenog sustava") |
| association ID (AID) | identifikator pridruživanja (AID) | simdeck *(check)* |
| active / passive scan | aktivno / pasivno skeniranje | URM ch17 |

## Checks

- Tests: 20 (two tie-breaks first, rules 1–6, the ladder, the presets' numbers, three golden runs pinning every frame
  and event of `book-order`, `rejected` and passive + WPA3 + reject, all 12 param combinations within 20 steps with
  `reject` leaving earlier steps unchanged, then the template's generic block). Mutation pass on a copy: 20 mutations (both tie-breaks, the SSID filter, refused skipped, weakest chosen, association before authentication,
  swapped order, WPA3 without SAE, authenticated after Commit alone, no AID, no distribution-system note, refusal
  dropping authentication, refusal not retargeting, the status code, keys on open, no keys on WPA, data before keys,
  open data encrypted, AP3 silent, a choice made by the responses): all 20 fail a test.
- Gate screenshots reviewed: light, dark, grayscale, phone, both languages; plus my own at the busiest steps
  (`rejected` 6 and 11, `wpa3` 5, `open-network` 7, `book-order` 8, passive + WPA3 + reject 14). Fixed on the way:
  fields of AP→STA frames spilling into the time column, the handshake's field colliding with "keys", lane cards
  truncating the BSSID and state, the network table overflowing its panel, the refused row showing the latest status
  (0) instead of 17, a two-line Croatian channel label.

- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md and 802.11 (Open System sequence
  1/2, SAE Commit then Confirm with the station first, status 17, a refused station staying authenticated, wildcard
  probes, the choice left to the station: confirmed), ran mutations on a copy and drove the page headlessly. Fixed
  from it: the choice caption said "answered" in a passive scan (now "heard the Beacons"); the probe captions implied
  all probes before any answer; the handshake caption said keys come "from the password" also for WPA3 (now from the
  PMK: WPA2 from the password and SSID, WPA3 from SAE); SPEC claimed `pair` is exactly the 802.11 state (an open
  network reaches the standard's state 4 without keys; now stated as a modelling choice); Croatian "iduću" →
  "idući", "odgovara okvirom …", "Bilo koji drugi status"; a ternary with identical branches. Its real mutation
  survivors (frame fields, channels, event payloads, Kafic's own security, the `ds` note's AP) plus `scanMode` are all
  killed by the golden tests: 35 mutations in all, every one fails a test.

## Shared requests

- **Glossary:** the term pairs above, `"src": "simdeck"`, once the owner confirms the *(check)* ones.
- **K1: fields on the far side of a short arrow.** Fields sit beside the chip on the receiver's far side; on a one-gap
  arrow towards the leftmost lane they run into the time column. An option to put fields on the sender's side (or
  under the chip) would let this page show the status on the arrow itself.

## Time

Start 09:59, done (gate, mutation pass, fresh review and its fixes) 10:17: about 20 minutes, one session.
