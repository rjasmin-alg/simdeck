<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# icmp-messages: notes

New stepper (task `docs/tasks/w3/icmp-messages.md`, catalogue `net-icmp-messages`, §4.1, wave 3) on kit view K2
(`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Stage.** The K2 path PC — R1 — R2 — server in row 0 (the local scenario adds the absent host 192.168.1.77 in row
  1, linked to the PC by a dashed link); under it on the left "Na žici" (the message on the wire: message name,
  type/code badge, meaning, sender, IP source → destination, TTL, what it carries) above "Odluka" (the deciding
  device's checks in order: route, TTL, filter, ARP, with ✓ / ✕ / … and "not reached" struck); on the right the
  console with what ping prints and a clock bar up to 4 s.
- **One request on the path; four lines in the console.** The page moves one echo request. At the print step the
  console prints its line, the same line for requests 2–4 (muted, "zahtjevi 2–4: isto": the scenario is
  deterministic) and the summary, so Windows' "Received = 4, Lost = 0 (0% loss)" on errors (rule 7's edge) and Linux's
  "+4 errors, 100% packet loss" are visible.
- **The plan.** `sim.js` computes the whole run as a list of events (`plan(p)`), one per step; `step` applies event
  n. The kit's replay works as for any stepper; `steps(p)` is the plan's length.
- **A forwarding router has no step of its own.** It forwards inside the hop step that leaves it, and the decision
  box shows "R1 je proslijedio" with its checks (all ✓). Only a router whose rule fires gets a decide step, which
  gives the task's step counts exactly (7, 3, 6, 5, 5, 3).
- **Rule order inside a router** follows RFC 1812 §5.2.1.2 (next-hop lookup step 5, "forwarding is permitted" with
  administrative constraints step 6, TTL step 7, link-layer address step 10): route → filter → TTL → ARP. So
  `no-route` with TTL 1 answers 3/0, not 11/0, and the firewall with TTL 2 answers (silence or 3/13) before the TTL
  expires (tie-break tests). A Linux router's forwarding-path filter sits after its TTL check, so there TTL 2 would
  give 11/0; the sim follows the RFC (and an inbound interface filter), and says so here. (The first draft had the
  filter after the TTL, sourced wrongly; the fresh review found RFC 1812 step 6.)
- **ICMP error source = the router's interface towards the PC** (RFC 1812 §4.3.2.4, as in `hop-rewrite`): R1 →
  192.168.1.1, R2 → **10.0.12.2**. See Deviations.
- **The reply's TTL is its own.** The server starts the echo reply at 64 and two routers take one each: TTL=62,
  whatever the request's TTL (with request TTL 3 the request reaches the server with 1). Errors also start at 64.
- **Console text is data.** What ping prints is the operating system's English output on both page languages
  (`translate="no"`); only the notes in the console ("čeka odgovor …", "zahtjevi 2–4: isto") are translated. The
  wording is built in `sim.js` (`consoleOf`, `lineFor`, `tally`), so it is tested.
- **Windows and Linux are named** because the concept depends on them: the two print different lines and count
  errors differently (Windows counts an error reply as received, Linux as an error; Linux prints nothing for a lost
  request). The OS toggle changes only the console and two captions, never the steps.
- **Colours.** Request c1, echo reply c2, ICMP error c5 (chips and the type/code badge; the chip text says "echo 8",
  "echo 0" or "ICMP 3/0", so grayscale keeps them apart). Nodes: PC c3, R1 c4, R2 c6, server c7, the absent host c8.
  The broken element has a dashed `--warn` outline and a dashed ⚠ badge (the server: the kit's `down` state and "▼
  isključen").
- **Times.** Link delays 0.5 / 2 / 0.5 ms (chosen, round): RTT 6 ms. The clock shows ms below 1 s, else s with one
  decimal, with the decimal comma on Croatian pages.
- **`scenario` resets to step 0** (it changes the path and the step count); `ttl` and `os` keep the step (the kit
  clamps it).
- **Presets set `scenario` and `ttl`; `os` returns to Windows** on a preset (kit: preset params on top of the
  defaults).

## Deviations from the task

- **Seventh preset `local-down`** (ping 192.168.1.77, URM ch08 Primjer 2 (a), which nobody has; 2 steps: the PC's ARP
  ×3, then the PC reports host unreachable from its own address). The task's rule 7 and its misconception
  "Destination host unreachable always comes from a remote router" had no preset; the `scenario` param gains
  `local` for it. Same concept (what a ping answer means), not a second one.
- **R2's errors come from 10.0.12.2, not 192.168.2.1.** The task's `host-down` and `firewall-reject` presets say
  "from 192.168.2.1" (marked "Derived, unchecked"). RFC 1812 §4.3.2.4 requires the address of the interface the
  ICMP message is sent on, which is R2's interface towards the PC, 10.0.12.2; 192.168.2.1 faces the server.
  `hop-rewrite` uses the same rule for Time Exceeded.
- **Step counts** are the task's (7, 3, 6, 5, 5, 3); the task's "4 hops out and back" for `echo-ok` is 3 hops out,
  the server's reply, 3 hops back (the last one prints).
- **Param names** `scenario`, `ttl`, `os` as in the task; `scenario` values are camelCase ids (`noRoute`, `fwDrop`,
  …), the preset ids are the task's.
- **Linux timing not modelled.** The timer is Windows' 4 s; with Linux wording the page hides "čeka najviše 4 s", the
  wait caption drops the 4 s, and the print step prints no line. The Linux summary leaves out its `, time NNNNms`.
- **The wait step shows the timer at 2 s** (running), the print step at 4 s (run out).
- **No ttlHint on the slider**: with seven presets the panel needed the room at 1920×1080 (the gate's panel-fit
  check); the `ttl-low` preset's hint and the explanation carry it.

## Reuse

`hop-rewrite`'s model is not in `models/` yet. This sim reuses its ideas, not its code: the path, the TTL decrement
per router (on the way back too) and the ICMP source address rule are written fresh in `sim.js` (no frames, MACs or
checksums are needed here). Nothing to promote from hop-rewrite for this sim; if `traceroute` later wants the
router-checks function (`routerChecks`) it is pure and DOM-free.

## Sources

- URM `book/chapters/11-usmjeravanje.md` "ICMP i dijagnostika puta: `ping` i `traceroute`": echo / echo reply and "a
  reply proves both directions" (footnote rfc792-echo-ch11), silence says only that no answer came (the paragraph
  after it), destination unreachable (rfc792-unreachable), time exceeded (rfc792-exceeded), `tracert` TTL 1 first
  probe (ms-tracert); figure `assets/diagrams/ch11-tracert-ttl.svg`.
- URM `book/chapters/08-mrezni-sloj.md` Primjer 2 "ista mreža ili druga?": 192.168.1.10/24, (a) 192.168.1.77 same
  network, (b) 192.168.2.50 another network.
- RFC 792 (types 0, 3, 8, 11; the error carries the IP header and 64 bits of the original datagram).
- RFC 1812, read online 2026-10-25: §4.3.2.4 (ICMP source address: an address of the interface the message is sent
  on), §5.2.1.2 (forwarding steps: next hop 5, forwarding permitted 6, TTL 7, link-layer address 10), §5.2.7.1 (code 0 net unreachable,
  code 1 host unreachable "does not respond to ARP", code 13 administratively prohibited), §5.3.1 (TTL).
- Microsoft Learn, *ping* (default 4 requests, 32 bytes, 4000 ms timeout) and *tracert* ("TTL expired in transit").
- Linux ping output wording (iputils): "Destination Net/Host Unreachable", "Packet filtered" (code 13), "Time to
  live exceeded", "+N errors" in the summary.

### Unchecked *(check)*

- Windows' wording for 3/13: shown as "Destination net unreachable." (Windows has no IPv4 status of its own for code
  13; not verified against a capture).
- Windows counts every "Reply from" line, an ICMP error too, as received (0 % loss) — the task's rule 7 edge, applied
  to every error case.
- The local case on Windows prints "Reply from 192.168.1.10: Destination host unreachable." from the PC's own address.
- A router's ARP attempts: 3 requests 1 s apart, then 3/1 (a common default); some router firmware stays silent
  (task Sources), which the sim does not show.
- Which code a filter that rejects sends depends on its configuration: the sim's filter sends 3/13 as the task says
  (a router filter's usual reject); a Linux packet filter's reject sends 3/3 port unreachable unless set otherwise.
- Linux's per-request wait and summary `time` field are not modelled.

## Term pairs

Missing from `kit/glossary.js`; written out as *English* (Croatian) in the Croatian strings:

| English | Croatian |
|---|---|
| echo request | echo zahtjev |
| echo reply | echo odgovor |
| destination unreachable | odredište nije dostupno |
| destination network unreachable | odredišna mreža nije dostupna |
| destination host unreachable | računalo nije dostupno |
| time exceeded | vrijeme isteklo |
| communication administratively prohibited | komunikacija administrativno zabranjena |

*firewall* (vatrozid) is in the glossary and used as `[[firewall]]` in the explanation; *time to live* / TTL and
*routing table* were not needed as terms on the page.

## Shared requests

None. (K2 had everything: the broken-element outline uses the view's `className` and the cards' `data-id`.)

## Checks

- `node --test sims/icmp-messages/sim.test.js`: 24 tests. Each rule broken once on purpose (route, TTL, filter, ARP,
  no decrement, reply TTL, error source interface, 11/0 type, Windows tally, 4 s timeout, local source, ARP tries,
  print timing, route-before-TTL, filter-before-TTL, missing ttl): every mutation fails at least one test.
- Fresh review (a separate agent, 2026-10-25): read the code against this SPEC, walked all 7 presets × every step ×
  hr/en × Windows/Linux in a browser (no console errors, no missing keys) and ran 18 more mutations. Fixed from it:
  the filter's place (RFC 1812 step 6), untested console lines and summaries (Windows 3/13, Linux 3/0, reply line,
  headers, round-trip lines, Linux summaries), the Windows tally for 11/0, the return-path forwarding checks, a
  missing `ttl` running as TTL 1, the decision box clipping its last line at 1920×1080, "there is no host" (it is
  off: it does not answer ARP), the 4 s limit shown under Linux, and forwarding routers without the changed mark.
- `npm run gate -- icmp-messages`: pass; screenshots at 1920×1080 (light, dark, grayscale) and 375×812 in hr and en
  reviewed, plus each preset's decisive step at 1920×1080.

## Time

Start 2026-10-25 14:50, done 15:20 (about 30 minutes, the fresh review included).
