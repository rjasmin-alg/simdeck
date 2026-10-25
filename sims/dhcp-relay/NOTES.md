<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dhcp-relay: notes

New stepper (task `docs/tasks/w3/dhcp-relay.md`, catalogue `net-dhcp-relay`), on kit view **K1: message sequence
chart**. Rules and expected numbers: `SPEC.md`.

## Decisions

- **The lane cards are the topology.** The task asks for "a small topology above a message-sequence chart". The K1
  lanes are put in the order of the path (C, R2, R1, S for the branch), and the page adds a thin **network strip**
  under the lane cards: one line per segment between neighbouring lanes with its name and network
  (`Podružnica 192.168.1.112/28`, `192.168.1.136/30`, `Uprava 192.168.1.96/28`), the segment(s) crossed in this step
  in ink and yellow, and the **subnet boundary** as a thick dashed vertical line at the relay's lane. The strip uses
  the kit's own lane geometry (`Simdeck.sequence.laneAt`, `css`, `between`) and sits inside the chart between the
  heads and the rows, so it lines up at any size. A separate K2 topology above the chart did not leave room for eight
  rows at 1920×1080. On a phone (lanes stacked) the strip is hidden; captions carry the boundary.
- **One step, one segment crossing**, then the reached device applies its rule (task order). The relay → server hop is
  one crossing although in the branch it passes R1: the arrow runs over R1's lifeline without a tip, and R1's card
  shows a "routes" badge in that step. Counting R1 as a hop would have made 12 steps for the same concept.
- **Lanes follow the client's place**: branch C, R2, R1, S; sales C, R1, S (R1's VLAN 10 subinterface is the relay);
  management C, S (no router on the path; the `relay` toggle is disabled there with a reason).
- **A third scope (Uprava 192.168.1.96/28)** on the server, beyond the task's two: the `same-subnet` preset needs one
  for the server's own subnet (rule 4 with giaddr 0). Offered addresses: .116 (book), .20 and .100 derived as each
  scope's first free address.
- **Field strip** under the chart, one line (two for an ACK with options 1/3/6): source, destination, broadcast or
  unicast, `giaddr`, `hops`, `yiaddr`, and option 50 on a REQUEST. The fields the last device wrote are yellow
  (`giaddr` and `hops` by the relay, `yiaddr` by the server); a relayed reply arrives unchanged.
- **`giaddr` beside the chip** on relay–server arrows that span more than one lane (on a one-lane arrow the chip and
  the receiver word fill it).
- **Rows 2.5rem** instead of the kit's 2.75rem at 1920×1080 so all eight messages of a run show (page CSS on
  `--sd-seq-row`); in Croatian `server-down` (nine rows, the retry rows are taller with their "2. put" box) the oldest
  attempt drops at steps 8–9 with "↑ 1 raniji redak". On a phone 3.9rem (see Shared requests).
- **Retries and give-up**: DISCOVER at 0, 4, 12, 28 s (RFC 2131 §4.1 without the ±1 s), then `169.254.28.7/16` at
  60 s, after the next 32 s wait. Neither RFC says when a client gives up; the task's "three retransmissions" is kept.
  The address is the last two MAC bytes (a real host picks it pseudo-randomly, RFC 3927 §2.1). No OS is named
  ("Concepts, not tools"); the explanation says the give-up time depends on the system.
- **Source address of the relayed message** = the relay's receiving interface (the same as `giaddr`), port 67. RFC 1542
  §4.1.1 leaves it open and implementations differ; the explanation says so.
- **BROADCAST bit** fixed on (as the book draws it); not a param. The functions handle the bit off (unicast to
  `yiaddr`), with tests, and the explanation mentions it.
- **Shorter captions where rows would drop**: the ACK delivery says only "R2 delivers the DHCPACK to the client" (the
  broadcast and the flag were explained at the OFFER), and later relayed retries say "R2 again writes 192.168.1.113
  into giaddr…" instead of the full sentence.

## Deviations from the task

- **Step counts**: `branch` 8 (task 9), `sales-vlan` 8 (9), `same-subnet` 4 (5), `no-relay` 5 (6): the task counted the
  start as a step; here it is step 0. `server-down` 9 (task 6): each attempt is two crossings (client → R2, R2 → server
  ✕), since rule 9 says the relay still forwards each one.
- Third scope (Uprava) added; lanes and segments change with the client's place.
- State: the task's `relayOn`, `serverUp` are `p.relay`, `p.server`; `scope`, `offered`, `binding`, `offer` and
  `pending` added; `msgs` has one record per segment crossing.
- Legend: the relay rewrite is a c3 swatch and a filled "relay" badge on the relay's card in the step it sends; the
  boundary has its own swatch (page CSS).

## Sources

- URM `uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md`: "DHCP: DORA slijed, zakup adrese i razlog za
  broadcast", "DHCP preko granica podmreža: opcije i posrednik" (+ "Šire o temi": the relay is the router already
  there; the single-server trade-off), Primjer 2, Pitanja 11; figure `assets/diagrams/ch14-dhcp-relay-giaddr.svg`.
- URM `book/chapters/12-izgradnja-mreze.md` Primjer 1: R1 .1/26, .65/27, .97/28, .129/29, serial .137/30; R2 serial
  .138/30, LAN .113/28.
- RFC 2131 §1.5, §2 (Table 1: hops), §4.1 (client source 0, retransmission 4 s doubling to 64 s, replies to giaddr,
  BROADCAST bit), §4.3.1 (scope by giaddr); RFC 1542 §4.1.1 (giaddr only if 0, hops increment, discard over 16,
  configurable destination), §4.1.2 (reply broadcast with the flag, else unicast to yiaddr; port 68); RFC 2132 §3.3,
  §3.5, §3.8; RFC 3927 §2.1. The quoted lines were checked against rfc-editor.org on 2026-10-25.

Unchecked *(check)*: when a client gives up and takes 169.254/16 (60 s is the model's); the relayed message's source
address; .20 and .100 as first free addresses; the client MAC.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| relay agent | *relay agent* (posrednik) (URM ch14) |
| broadcast | *broadcast* (URM keeps the English word) |
| unicast | *unicast* |
| subnet boundary | granica podmreže (URM figure) |
| address block (scope) | blok adresa (URM ch14) |
| default gateway | (zadani) pristupnik |
| subnet mask | maska (podmreže) |
| offer | ponuda |
| link-local address | lokalna adresa (169.254.0.0/16) |

The glossary's `relay` → `prosljeđivanje` (from UL) is a different sense; URM calls the device *posrednik*.
`option` → `opcija` is in the glossary and used as `[[option]]`.

## Shared requests

- **kit/sequence.js, phone:** `fit()` drops rows on a phone although `docs/sim-ui.md` §11 says the list stops dropping
  there and the page scrolls. Cause: in the phone layout a receiver word sits at `top: 2.35rem` with one line of
  `--fs-sm`, which ends about 4px below the 3.6rem row, so `list.scrollHeight > list.clientHeight + 1` and the loop
  drops rows down to two. `sims/dhcp-dora` shows it too (375×812, `lease-600` step 3: "↑ 1"; `no-backup` step 11:
  "↑ 7"). Smallest change: skip `fit()`'s dropping under the phone media query (or set the phone row to 3.9rem in
  kit.css). This page works around it with `--sd-seq-row: 3.9rem` in its phone CSS.
- **models/:** none needed. Nothing was copied from `dhcp-dora` verbatim; the relay functions (`relayForward`,
  `relayDeliver`, `replyTo`, `scopeFor`) are pure over plain data and could join a `models/dhcp-*` model if
  `dhcp-rogue` or `win-dhcp-authorization` need them.

## Checks

- `node --test sims/dhcp-relay/sim.test.js`: 25 tests, tie-breaks first; every one of the 12 param combinations ends
  in ≤ 9 steps.
- `npm run gate -- dhcp-relay --shots …`: pass, 61/61 browser checks.
- Every step of every preset measured at 1920×1080 in both languages (rows dropped, page scroll) and at 375×812 (rows
  dropped, sideways scroll): nothing dropped except the Croatian `server-down` steps 8–9 (one row), no scroll.

## Review

A fresh reviewer read `sim.js` against SPEC.md and RFC 2131 / RFC 1542 and ran 56 mutations on a copy: 47 caught, 9
missed. No disagreement between code and SPEC rules 1–9, tie-breaks, presets or step counts; no factual errors in the
captions. One miss cannot happen in a run (the ACK giving the scope's first address instead of option 50: they are
equal); it now has a unit test anyway. The reachable misses now have tests: the client's phase (SELECTING,
REQUESTING), each crossing's attempt number and time, `via` only on the relay–server hop, the ✕ at a down server on the
same subnet, the picked scope staying picked after the ACK. A field the page never read (`offered`) was removed from
the model. Re-run of four of those mutations: all caught. SPEC notes added from the review: the hops threshold SHOULD
default to 4 (16 is the cap), the first DISCOVER is sent at 0 s instead of after RFC 2131 §4.4.1's random 1–10 s, the
BROADCAST bit is the client's choice, and the server ACKs option 50 without a NAK check (out of scope).

## Time

Start 2026-10-25 12:39 CET, done about 13:05 CET: about 25 min of wall clock (model, spec and tests first; then the
page and its layout passes at 1920×1080 and 375×812; the fresh review ran alongside NOTES.md).
