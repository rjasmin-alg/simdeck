# osi-tcpip-map: OSI vs TCP/IP, and which device lives where

| | |
|---|---|
| Task | `osi-tcpip-map` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-osi-tcpip-map` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/osi-tcpip-map/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `encapsulation` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `encapsulation` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **layer models and the layer each device works at**.

The student: drag protocols and devices onto layers.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/encapsulation/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/04-slojeviti-modeli.md` (Uvod u računalne mreže): "OSI model i njegovih sedam slojeva" → "Što treba znati" (seven layers and their Croatian names), "TCP/IP model: četiri sloja koji nose stvarni internet" → "Što treba znati" (which device looks how deep), "Šire o temi" → "Pet slojeva u praksi" and "Preslikavanje koje nije čisto ni na dnu stoga", "Enkapsulacija, dekapsulacija i imena podatkovnih jedinica" (PDU names); **Primjer 1** (which OSI layer), **Primjer 3** (how deep each device looks), **Primjer 4** (PDU names are convention), **Primjer 5** (OSI or TCP/IP vocabulary)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch04-osi-tcpip-preslikavanje.svg` and `ch04-osi-slojevi-protokolna-komunikacija.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md`, "Šire o temi" → "Koncentrator: uređaj koji je struka formalno umirovila" (hub at layer 1); `17-bezicne-mreze.md`, "WLAN i IEEE 802.11" (access point works like a switch/bridge, not a router)
- ITU-T X.200 (= ISO/IEC 7498-1:1994) §6–7 (seven layers); RFC 1122 §1.1.3 (four TCP/IP layers)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 "Primijenjeno: 11 stranica", paragraph "Namjerno izostavljeno" (the book deliberately left `ch04-osi-tcpip-preslikavanje` out of its interactive cards)
- Catalogue seed: URM ch04

## Model and presets

- **Scene:** two layer columns side by side, OSI (7 rows) on the left and TCP/IP (4 rows) on the right, with the mapping bands between them (OSI 5–7 → aplikacijski, 4 → transportni, 3 → internetski, 1–2 → podatkovni). Each row also shows its PDU name. Below, a tray of cards (protocols, devices or problem statements, depending on the set). The student clicks a card, then a row; the card lands there. Devices are drawn as a vertical bracket from layer 1 up to the highest layer they read.
- **State (page, explorer):** `{ placed: { cardId: layerNo | null }, reveal: bool }`; the model is a pure `check(cardId, layer, modelName) → 'ok' | 'wrong' | 'both-ok'` plus the answer table. Placements are page state (not deep-linked); `set`, `model` and `reveal` are params.
- **What the params drive live:** `set` swaps the card tray; `model` shows OSI, TCP/IP or both columns; `reveal` marks every placed card right/wrong and moves unplaced cards to their answer with a one-line reason.
- **Rules:**
  1. OSI has seven layers, bottom to top: fizički (1), podatkovni (2), mrežni (3), transportni (4), sjednički (5), prezentacijski (6), aplikacijski (7) (URM ch04, X.200 §6.1.2).
  2. TCP/IP has four: podatkovni, internetski, transportni, aplikacijski; the book counts four, and the 5-layer variant only splits fizički from podatkovni (URM ch04 "Pet slojeva u praksi"; RFC 1122 §1.1.3). A `layers5` toggle shows that split.
  3. Mapping: OSI 5–7 → aplikacijski; 4 → transportni; 3 → internetski (renamed); 1–2 → podatkovni (URM ch04 "Preslikavanje koje nije čisto ni na dnu stoga", figure `ch04-osi-tcpip-preslikavanje`).
  4. Devices, by the highest layer they read: koncentrator (hub) 1; preklopnik (switch) 2; *access point* 2 (bridge, not router: URM ch17); usmjernik (router) 3 (internetski); hosts at both ends read all layers (URM ch04 Primjer 3).
  5. Protocols: HTTP, DNS, SMTP → aplikacijski (OSI 7); TCP, UDP → transportni (4); IP, ICMP → internetski / mrežni (3); Ethernet, 802.11 → podatkovni (2, with the physical part in 1). PDU names: okvir (2), paket (3), segment / datagram (4) (URM ch04 "Imena podatkovnih jedinica").
  6. Ambiguous cards accept two answers (`both-ok`) and say why: ARP (used by IP, carried directly in Ethernet: 2 or 3); TLS (application in TCP/IP; OSI 5–6 in some texts) *(check: the book places neither)*. Tie-break: a `both-ok` card counts as right in either row and shows the note.
  7. Problems (Primjer 1): cut cable → 1; resume a dialogue where it stopped → 5; wrong č/ž characters → 6; "identical copy, no choice of path" → 4; out-of-order pieces put back in order → 4 (not 3: the layer that fixes it, not the one that causes it).
  8. Placing a card on the TCP/IP column for an OSI-only problem (5 or 6) maps it to aplikacijski and says that TCP/IP does not name those layers separately (URM ch04 Primjer 5).
- **Params:** `set` choice `devices` | `protocols` | `problems` | `vocab`, default `devices`; `model` choice `osi` | `tcpip` | `both`, default `both`; `layers5` toggle, default off; `reveal` toggle, default off.
- **Presets:**
  1. `book-devices` — set devices: computer, switch, router, server (URM ch04 Primjer 3). Revealed: computer and server 1–7 (all four TCP/IP layers), switch up to 2, router up to 3. From URM ch04 Primjer 3.
  2. `book-problems` — the five problems of Primjer 1; answers 1, 5, 6, 4, 4. From URM ch04 Primjer 1.
  3. `protocols` — HTTP, DNS, TCP, UDP, IP, ICMP, ARP, Ethernet, 802.11, with ARP `both-ok`. Derived from URM ch04 and ch07, ARP note *(check)*.
  4. `book-vocab` — the three sentences of Primjer 5, placed on OSI or TCP/IP: (a) OSI, (b) TCP/IP, (c) OSI. From URM ch04 Primjer 5.
  5. `extra-devices` — hub, access point, L3 switch (2 and 3), firewall (3–4; application firewall to 7) *(check)*. Derived.
- **Steps:** none (explorer).
- **Legend:** one series colour per TCP/IP layer (c1 application … c4 link), reused from `encapsulation`; device bracket (outline); right (ok + ✓), wrong (danger + ✕), two answers accepted (warn + ≈). "Changed" marks the card just placed and its row.
- **Captions:**
  - hr: "*Router* (usmjernik) gleda do mrežnog sloja: dovoljno mu je znati u kojoj je mreži odredište. Kojem programu podaci pripadaju nije njegov posao."
  - en: "Out-of-order pieces belong to the transport layer: the layer that puts them back in order, not the network layer that caused it."
- **Terms:** layer — sloj; physical / data link / network layer — fizički / podatkovni / mrežni sloj; internet layer — internetski sloj; session / presentation layer — sjednički / prezentacijski sloj; protocol data unit — protokolna podatkovna jedinica (PDU); switch / router / hub — preklopnik / usmjernik / koncentrator; frame / packet / segment — okvir / paket / segment.
- **Misconceptions:** (1) "Every device on the path reads everything" (Primjer 3). (2) "OSI and TCP/IP map row for row" (the 3→1 and 2→1 merges). (3) "PDU names are a strict rule" (Primjer 4).
- **Out of scope:** encapsulation order and header sizes (`encapsulation`); standards bodies (ch04 "Tko određuje ta pravila"); layer-by-layer diagnosis (URM `dijagnostika-po-slojevima.html`).
- **Builds on `encapsulation`:** reuse its layer list, layer colours, Croatian layer and PDU names and the stack drawing; new are the OSI column, the mapping bands and the card checker.
- **Note for the coordinator:** the URM plan (§6, "Namjerno izostavljeno") dropped this mapping as an interactive card because clicking only reveals a definition. The placement quiz here is the only thing that makes it a sim; if that is not enough, make it a reference poster (§4.11) or a `devices` preset of `encapsulation`. The kit has no drag-and-drop; this spec uses click-card-then-row.
<!-- model: filled -->

## Steps

1. `kit/new-sim.sh osi-tcpip-map sims/osi-tcpip-map` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/osi-tcpip-map/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
