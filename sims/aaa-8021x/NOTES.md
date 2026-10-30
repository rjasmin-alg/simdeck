<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# aaa-8021x: notes

Task `docs/tasks/w3/aaa-8021x.md` (wave 3), thread t-0203. A new stepper on kit view K1. Rules, numbers and sources:
`SPEC.md`.

## Decisions

- **Kit view K1** (`kit/sequence.js`) draws the chart: three lanes (laptop, switch or access point, RADIUS server).
  EAPOL arrows solid, RADIUS dashed, other traffic (DHCP) dotted, so the three kinds of frame differ by line, not
  only by colour.
- **The port gate** lives in the authenticator's lane card: a boom barrier (two posts and a bar across = closed,
  bar raised = open) with the words "closed: EAPOL only" / "open · VLAN 20". A frame the port drops is K1's `lost`
  ✕ at the switch, with "dropped: port closed" beside it.
- **The AAA side column** is K1's eavesdropper column (`eve`) retitled "AAA step": each message gets its badge
  (I or A) and the step's name. Under the chart, a **strip** redraws the book's figure `fig:aaa-koraci`: four boxes
  in a row with AAA bracketing the last three; each says at which step it happened, that it failed or was denied,
  or that it never comes (no session, no answer). The column maps messages to steps; the strip gives the outcome.
- **Rounds are folded per step** but every one of the four messages of a round is drawn (Access-Challenge,
  EAP-Request, EAP-Response, Access-Request), so the relay is visible every time. The RADIUS rows say only `EAP`
  beside the message name; what is inside (TLS hello, password proof…) is on the EAPOL row next to it. This keeps the
  receiver word ("proof correct", "wrong password") clear of the fields.
- **The server's verdict** is a receiver word at the server on the Access-Request of the round where it checks, and
  a ✕ in the AAA column.
- **Accounting** shows both the Accounting-Request (Start) and the Accounting-Response in step 14.
- **Wi-Fi labels:** the middle lane is renamed "access point"; step 1 says "associated"; step 12 is the 4-way
  handshake (one row, EAPOL-Key, named not modelled) which opens the port.
- **Identity** `ana@fakultet`, staff, **VLAN 20**: the task's example values. The VLAN number is derived, not from a
  source.
- **Params all reset** to step 0: each one changes the step list.
- **Server down** widens the time column (5.4rem) so the "retry" badge fits; the switch's wait is a K1 timer on the
  switch lane ending in ✕, labelled "waiting for a reply" with no number (task: show "no reply", not a value).

## Deviations from the task

- **Folded rounds: PEAP 4, EAP-TLS 3** instead of the task's "3 vs 2 *(check)*". With 3 PEAP rounds the `book` run
  would have 13 steps, not the task's 14; 4 named rounds (start, server certificate and TLS finish, inner password
  proof, inner result) give exactly 14, and the `reject` run, failing at round 3, gives the task's 11. Both counts
  are coarse foldings; real exchanges have more round trips (SPEC, Simplifications).
- **Wi-Fi keeps DHCP and accounting.** The task says "PMK delivered → 4-way handshake as the last step instead of
  DHCP". The model puts the PMK in Access-Accept (step 10) and the 4-way handshake at step 12, in place of the wired
  "port authorized" step, because on Wi-Fi the port opens only after the handshake; DHCP (13) and accounting (14)
  then follow as on the cable. The step count stays 14.
- **Title** "AAA i 802.1X: prijava na priključak mreže" / "AAA and 802.1X: logging in on a network port", so it
  does not repeat the concept line.
- **Server down**: one retransmission before the timeout (the task says "requests unanswered"; the number of
  retries is ours).

## Sources

As in `SPEC.md` §Sources: URM ch18 „Tko je to, i smije li…" (four steps, AAA, NIST SP 800-12 Rev. 1 §10, figure
`ch18-aaa-koraci.svg`), URM ch17 „Sigurnost bežične mreže…" and Primjer 5, IEEE 802.1X-2020, RFC 3748, RFC 2865,
RFC 2866, RFC 3579, RFC 3580. Nothing copied: no figure or text from the book is reused on the page, so no `credits`.

## Unchecked *(check)*

- IEEE 802.1X-2020 clause numbers for the controlled/uncontrolled port (the standard was not at hand).
- RFC 2865 §2.5 (retransmission) and RFC 3579 §2.6, RFC 3580 §3.31 section numbers, cited from memory.
- The authenticator's timeout value (deliberately not shown).
- How many round trips PEAP and EAP-TLS take in practice (folded on purpose; see Deviations).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| en | hr | where |
|---|---|---|
| supplicant | *supplicant* (klijent) | lane card, captions (task: "molitelj *(check)* / klijent"; the books have neither; we use klijent) |
| authenticator | autentikator | lane card, captions |
| authentication server | poslužitelj za autentikaciju | lane card (URM ch17) |
| identification | identifikacija | AAA column, strip (URM ch18) |
| access control (authorization) | nadzor pristupa | AAA column, strip (URM ch18) |
| audit (accounting) | revizija | AAA column, strip (URM ch18) |
| port | priključak | throughout (the URM books' word for a switch port) |
| unauthorized / authorized (port) | neovlašten / ovlašten | captions, notes |
| port-based access control | nadzor pristupa po *portu* | explanation |

Used from the glossary: `4-way handshake` (rukovanje u četiri koraka).

## Shared requests

- **K1 row height at projector size.** A full PEAP run has 27 rows; the page lowers `--sd-seq-row` to 2.05rem at
  ≥ 901 px landscape (as `wpa-handshake` does at 2.35rem) so about 12 rows stay in view. A spec field for the row
  height, or a compact mode, would make this a kit setting.
- **A side column that is not an eavesdropper.** The AAA column uses `eve` with another title; it works, but cells of
  a `lock` row would be hatched. A neutral name (`aside`) or an option to switch off the hatching would make the
  reuse explicit.
- **A gate on a lane** (a port that is closed or open, frames stopping at it) would suit other access-control sims
  (port security, captive portal). Drawn here in the lane card.

## Model reuse

None. The model is small and specific; nothing in `models/` applies.

## Checks

- Step counts by params (SPEC, Steps): 5 + 4 + 5 = 14 (PEAP accepted), 5 + 3 + 5 = 13 (EAP-TLS accepted),
  5 + 3 + 3 = 11 (PEAP rejected), 5 + 2 + 3 = 10 (EAP-TLS rejected), 5 + 2 = 7 (server down); checked by running the
  model over all 16 combinations of the four params before writing the page, and asserted in `sim.test.js`.
- Mutation run (each change to `sim.js` reverted after): `passes` always true; port opened at EAP-Success; Wi-Fi
  without the handshake; EAP-Request relaying the wrong round; the switch sending Access-Reject itself; accounting on
  UDP 1812; a VLAN attribute missing; reject run opening the port; authentication marked late; PMK on wired;
  retransmission not lost; one PEAP round fewer. Each made at least one test fail.
- `npm run gate -- aaa-8021x`: pass (manifest, tests, build, browser 61/61, tokens, scope), no exceptions declared.
- Screenshots reviewed: gate shots (1920×1080 light, dark, grayscale, panel hidden, help; 375×812; hr and en) and
  extra ones at `book` 5 and 14, `reject` 9 and 11, `server-down` 7, `wifi` 12 and 13 (dark), phone at step 8.

## Review

A fresh reviewer (a separate agent with no part in the build) read the diff against `SPEC.md` and ran 34 mutations of
its own. It found no rule violation; 15 mutations survived the first tests (the `lost`, `verdict` and `changed`
flags the page draws, `outcome` and `vlan` set a step early, Wi-Fi labels, round contents). Five tests were added and
two asserts tightened; all 35 mutations now fail a test. Also fixed from the review: "the tunnel is up" moved from
PEAP round 2 to round 3 (the server's TLS Finished comes with the next challenge); the step-5 caption says "does not
check the certificate" for EAP-TLS, which has no password; the DHCP caption uses "priključak" and `{vlan}`; wording
("veza uspostavljena", "odbacuje", "pušta korisnika u mrežu", "may connect"); an unused string removed.

## Time

Started 2026-10-30 12:56, done 13:15 (+01:00): about 20 minutes of wall-clock time by the machine clock.
