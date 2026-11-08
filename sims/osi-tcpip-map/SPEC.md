<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# osi-tcpip-map: spec

Explorer (task `docs/tasks/w3/osi-tcpip-map.md`, catalogue `net-osi-tcpip-map`, §4.1). One concept: **layer models,
and the layer each protocol, device or problem belongs to**. The student picks a card from the tray, then a layer
row; the card lands there. `reveal` marks every placed card and moves the unplaced ones to their answer.

## Scene

- Two layer columns: OSI (7 rows) on the left, TCP/IP (4 rows, or 5 with `layers5`) on the right. Both columns
  share the same seven row tracks, so a TCP/IP row is exactly as tall as the OSI rows it covers; the mapping bands
  between them label each merge ("OSI 5–7", "OSI 4", …). With one column shown it has equal rows.
- Every row shows its number (OSI) or the OSI layers it covers (TCP/IP), its name and its PDU name.
- Devices placed (or revealed) in a column also get a vertical bracket on the outer side of that column, from
  layer 1 up to the row they were placed on, with the card's number on top.
- Below the columns: the tray of unplaced cards.

## Rows

| id | model | name hr / en | covers OSI | PDU hr / en |
|---|---|---|---|---|
| `o1` … `o7` | OSI | fizički, podatkovni, mrežni, transportni, sjednički, prezentacijski, aplikacijski / physical, data link, network, transport, session, presentation, application | its own number | 1 bitovi / bits; 2 okvir / frame; 3 paket / packet; 4 segment ili datagram / segment or datagram; 5–7 podaci / data |
| `tl` | TCP/IP | podatkovni / link | 1–2 (4 layers), 2 (5 layers) | okvir / frame |
| `tp` | TCP/IP, 5 layers only | fizički / physical | 1 | bitovi / bits |
| `ti` | TCP/IP | internetski / internet | 3 | paket / packet |
| `tt` | TCP/IP | transportni / transport | 4 | segment ili datagram |
| `ta` | TCP/IP | aplikacijski / application | 5, 6, 7 | podaci / data |

## Rules

1. **OSI has seven layers**, bottom to top: fizički (1), podatkovni (2), mrežni (3), transportni (4), sjednički (5),
   prezentacijski (6), aplikacijski (7). *URM ch04 "OSI model i njegovih sedam slojeva"; X.200 §6.1.2.*
2. **TCP/IP has four**: podatkovni, internetski, transportni, aplikacijski. The 5-layer variant only splits fizički
   off podatkovni (`layers5`); the other three rows keep their names. *URM ch04 "TCP/IP model…", "Pet slojeva u
   praksi"; RFC 1122 §1.1.3.*
3. **Mapping**: OSI 5–7 → aplikacijski; 4 → transportni; 3 → internetski (renamed); 1–2 → podatkovni (with
   `layers5`: 1 → fizički, 2 → podatkovni). *URM ch04 "Preslikavanje koje nije čisto ni na dnu stoga", figure
   `ch04-osi-tcpip-preslikavanje`.*
4. **Devices, by the highest layer they read**: koncentrator (hub) 1; preklopnik (switch) 2; *access point* 2 (bridge,
   not router); usmjernik (router) 3; computer and server (the two ends) 7. *URM ch04 Primjer 3; ch07 "Koncentrator…";
   ch17 "WLAN i IEEE 802.11".*
5. **Protocols**: HTTP, DNS → 7; TCP, UDP → 4; IP, ICMP → 3; Ethernet, 802.11 → 2. Ethernet or 802.11 placed on
   OSI 1 (or on the 5-layer fizički row) is wrong, with the note that the standard also defines the signal, but the
   frame and its addresses are layer 2. *URM ch04 "Imena podatkovnih jedinica", ch07.*
6. **Ambiguous cards accept several rows** and say why:
   - ARP: 2 or 3 (used by IP, carried directly in an Ethernet frame). *(check: the book places it nowhere)*
   - TLS: OSI 5, 6 or 7; TCP/IP application. *(check: the book places neither)* Added to the protocols set (see
     NOTES, deviations).
   - L3 switch: 2 or 3. Firewall: 3 or 4 (an application firewall reads up to 7, said in its note). *(check)*
   - Vocab sentence (c) names the presentation and the application layer: OSI 6 or 7.
7. **Problems** (Primjer 1): cut cable → 1; resume a dialogue where it stopped → 5; wrong č/ž characters → 6;
   identical copy, no choice of path → 4; out-of-order pieces put back in order → 4 (the layer that fixes it, not
   network, which causes it). *URM ch04 Primjer 1.*
8. **OSI-only problems on TCP/IP**: a problem whose only OSI answer is 5 or 6, placed on TCP/IP aplikacijski, is
   right, with the note that TCP/IP does not name those layers separately. *URM ch04 Primjer 5.*
9. **Vocabulary** (Primjer 5): each sentence belongs to one model. (a) "…u sjedničkom sloju…" → OSI 5; (b) "…kroz
   internetski sloj…" → TCP/IP internetski; (c) "Prezentacijski sloj… aplikacijski sloj…" → OSI 6 or 7. A sentence
   placed in the other model's column is wrong, whatever the row, with a note naming the word that gives it away.
   *URM ch04 Primjer 5.*

## Verdict and tie-breaks

`check(cardId, rowId, layers5)` → `'ok' | 'wrong' | 'both-ok'`:

1. A vocab card in the other model's column → `wrong` (rule 9), before anything else.
2. The row covers none of the card's accepted OSI layers → `wrong`.
3. Otherwise count the rows **of that model** (with the current `layers5`) that cover an accepted layer. More than
   one → `both-ok` (more than one answer accepted, ≈); exactly one → `ok`.

Consequences, each tested: ARP on OSI 2 or 3 → `both-ok`, on TCP/IP podatkovni or internetski → `both-ok`; TLS on
OSI 6 → `both-ok`, on TCP/IP aplikacijski → `ok` (one row covers 5–7); Ethernet on TCP/IP podatkovni (4 layers,
covers 1–2) → `ok`, but on the 5-layer fizički row → `wrong`; cut cable on TCP/IP podatkovni (4 layers) → `ok`, on
5-layer podatkovni → `wrong`, on 5-layer fizički → `ok`; computer on TCP/IP aplikacijski → `ok`.

`note(cardId, rowId, layers5)` → a note key or null, in this order: `otherModel` (rule 9), `tcpipNoName` (rule 8,
only when the verdict is ok), `physPart` (rule 5, Ethernet/802.11 on a row covering only layer 1), `notCause`
(out-of-order on a row covering only layer 3).

`answer(cardId, model, layers5)` → the row a revealed unplaced card moves to: the row of that model covering the
card's **first** accepted layer (its primary answer); null for a vocab card in the other model.

## Answer table (cards, accepted OSI layers, primary first)

| set | cards |
|---|---|
| `devices` | computer [7], switch [2], router [3], server [7] (Primjer 3) |
| `extra` | hub [1], access point [2], L3 switch [3, 2], firewall [4, 3] |
| `protocols` | HTTP [7], DNS [7], TCP [4], UDP [4], IP [3], ICMP [3], ARP [2, 3], Ethernet [2], 802.11 [2], TLS [6, 5, 7] |
| `problems` | cable [1], resume [5], chars [6], identical [4], order [4] (Primjer 1) |
| `vocab` | a [5] OSI, b [3] TCP/IP, c [6, 7] OSI (Primjer 5) |

Expected primary answers on TCP/IP (4 layers): computer, server, HTTP, DNS, TLS, resume, chars → `ta`; TCP, UDP,
identical, order, firewall → `tt`; router, IP, ICMP, L3 switch → `ti`; switch, AP, hub, ARP, Ethernet, 802.11,
cable → `tl`. With `layers5`: hub and cable → `tp`, the rest unchanged.

## Params and presets

- `set`: `devices` | `extra` | `protocols` | `problems` | `vocab`, default `devices` (swaps the tray, clears the
  placements). `model`: `osi` | `tcpip` | `both`, default `both`; the vocab set always shows both (the control is
  disabled there). `layers5` toggle, default off. `reveal` toggle, default off.
- Presets (reveal off, so the class works them first): `book-devices` (set devices), `book-problems` (problems),
  `protocols` (protocols), `book-vocab` (vocab), `extra-devices` (extra).
- Placements are page state, not in the URL. They clear when the set changes, a preset is loaded, R resets, or the
  "cards back" button (`K`) is pressed. Cards placed in a hidden column wait in the tray and come back when the
  column is shown again; a card on the 5-layer fizički row moves to podatkovni when `layers5` goes off.

## Summary counts

`score(placed, cards, model, layers5)` over the visible columns: `ok`, `both` (both-ok), `wrong`, `open` (not placed,
or placed in a hidden column). With reveal on the caption shows them; e.g. devices with computer on `o7`, switch on
`o3`, router unplaced, server on `ta` → ok 2, both 0, wrong 1, open 1.
