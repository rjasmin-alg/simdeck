<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-firewalld-zones: notes

New stepper (task `docs/tasks/w3/lnx-firewalld-zones.md`, catalogue `lnx-firewalld-zones` §4.4, overlap §5.16). Three
columns drawn in HTML: the senders, the server's interfaces and the packet card; the zone picker as kit view **K4**
(`Simdeck.ruleTable`, mode `first`, bare inside a panel: the bindings in dispatch order, the default zone as the
implicit row) with the scenario's command under it; the zones, the chosen zone's `--list-all` card with the deciding
line marked, the verdict and what the client prints. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Every scenario is 7 steps**: the packet in three steps (it arrives; the zone is chosen; the zone's lists and
  target give the verdict), one configuration command, the same packet again. The before/after of one command is
  the lesson, and the student can change the packet live (`source`, `dport`) without leaving the step.
- **Params**: `scenario` (a select, resets: the configuration at step 0 and the command at step 4), `source` and
  `dport` (live, as the task asks). Each preset is a scenario plus a packet.
- **`enp2s0` exists in every scenario** (`10.20.0.1/24`, derived): unbound, so it uses the default zone, except in
  `drop-vs-block`, where it starts in `drop`. The outside host `10.20.0.9` always comes in on it.
- **Zones in the scene**: `block`, `drop`, `home`, `public`, `trusted` (of the book's ten), all at
  `ingress-priority` 0 as the book's `--list-all` shows. The card prints `target: %%REJECT%%` for `block`, as
  `--list-all` does *(check)*.
- **The K4 table**: one match column (the bound prefix or interface), the binding kind as a tag under the row number
  (◉ izvor / ⇥ sučelje), the zone as the action, the default zone as the implicit row (★). The mark column holds only
  "odlučuje" (the zone is already in the action column); the pointer chip is the packet's round (1 or 2). A new
  binding after the command is tagged "novo"; a new default zone changes the implicit row's text.
- **Client output** (rule 6): `ssh -p 8991 … hostname` for 22 and 8991 (sshd listens on both in the book's Primjer 1,
  output `demosrv1.lab.local` or the `ssh: connect to host …` error); `ping -c 1` for ICMP echo; for 9090 a translated
  "connected, the service answers" or the bare `connect to host … port 9090: …` line (no client program named).
- **Concepts, not tools**: the page names firewalld's zones, `firewall-cmd` and its options, because the UL course
  teaches firewalld itself (ch. 15) and the concept (zones, targets, `--list-all`) is firewalld's own. `ssh` and
  `ping` appear only as the client whose output the student reads (rule 6).
- **Tie-breaks on the page**: the presets use no overlapping prefixes, so the name-order tie-break (rule 3) is in the
  model, its tests and the explanation, not in a preset. A fifth scenario could show it (`dmz` ← `/24` beating
  `trusted` ← `/32`), but [prio] is a single source *(check)* and the task asks for four presets.

## Deviations from the task

- **Steps 7, 7, 7, 7** instead of 10, 7, 7, 6. The task's counts did not fit any one step pattern (the book preset
  listed four packets and a command in 10 steps); one pattern for all four is easier to present. The book preset's
  other packets (`22/tcp` by service `ssh`, ICMP by target `default`) are one click away in the `dport` param.
- **`default-zone` sends `22/tcp`**, so the `ssh` line decides in `public` and then in `home`: the verdict is the same,
  the deciding zone is not. Both stock zones treat all four packets alike (SPEC.md).
- **`book` and `default-zone` have `enp2s0` too** (unbound), so `10.20.0.9` can be sent in every scenario.
- **Kit view K4** is used (it exists now); no own drawing of the picker.

## Sources

- *Uvod u Linux*, ch. 15 (`~/projects/uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md`):
  "Vatrozid: zone, usluge i odluka o otvaranju porta" ("Što treba znati", "Šire o temi") and Primjer 1; its footnotes
  quote firewalld.zone(5), firewall-cmd(1) and the firewalld "Zone", "Concepts" and "Predefined Zones" pages.
- firewalld.zone(5) on firewalld.org (read 2026-11-03): `ingress-priority` ("A zone with a lower priority value will be
  considered before a zone with a higher priority value"), `target` (default: "ICMP will be accepted and everything
  else will be rejected"), `source`, `interface`.
- firewalld.org, "Zone Priorities" (2023-04): the legacy classification order, sources first sorted by zone name,
  then interfaces, still used at equal priority. One source, and it calls the order formerly undocumented *(check)*.
- *(check)*, from memory and not read on a machine: the `ZONE_CONFLICT` error name; `%%REJECT%%` as the printed
  target of `block`; the RHEL-family `home` services (`cockpit dhcpv6-client mdns samba-client ssh`) and the
  definitions of `cockpit` (9090/tcp), `mdns` (5353/udp), `samba-client` (137/udp 138/udp); the reply of a `block`
  zone to an ICMP echo as printed by the client: `Packet filtered` (code 13, what the nftables backend sends, and what
  the book measured for an ICMP block on firewalld 2.4.3); the zone's documented `icmp-host-prohibited` would be code
  10, and the book warns against inferring the code from that name.
- The diagram `tri-mjesta-koja-kazu-ne.svg` was not copied (the page draws its own; nothing third-party is included).

## Checks

- Numbers printed by a script from the model before the page (four scenarios × three sources), asserted in
  `sim.test.js` (28 tests; tie-breaks first).
- **Mutations**: 26 one-at-a-time mutations of `sim.js` (priority ignored or reversed, interfaces before sources,
  kind ignored, zone name reversed, last match, source by exact address, default zone ignored, services or ports
  ignored, protocol ignored, target before lists, default target rejecting ICMP or accepting all, REJECT/DROP swapped,
  ACCEPT ignored, client output swapped, ZONE_CONFLICT allowed, change-interface keeping the old binding,
  set-default-zone a no-op or moving bound interfaces, add-port to the wrong zone, wrong incoming interface, a
  different packet in round 2): **25 fail a test**; the survivor (ICMP compared with the service and port lists) is
  equivalent, since no list can hold an ICMP entry in this model.
- `npm run gate -- lnx-firewalld-zones`: pass (manifest, tests, build, 63 browser checks, tokens, scope). Screenshots
  at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed, plus every preset at its key steps with a
  local Playwright script. Fixed from them: the K4 table wider than its column (the zone hidden under the sticky mark
  column: one match column, the kind as a tag, a bare table, wider centre column), a zone name missing from three
  captions (one DOM node used twice), packet card fields running into each other, sender rows colliding, the packet
  card saying "not sent yet" at the command step.
- **Not run on a machine** *(check)*: the presets are derived from the book and the documentation, not captured.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page; it ran 24 mutations of its
  own and generated every caption for all 48 scenario × source × dport combinations). Fixed from it: the ICMP reject
  line (`Packet filtered`, code 13, not `Destination Host Prohibited`); the add-source caption naming the packet's
  interface instead of the bound prefix's (false for `10.20.0.9`); a caption at step 7 of `default-zone` saying the
  verdict is the same but now comes from `home`; tests for `--add-port` going to whatever the default zone is, for
  `ALREADY_ENABLED` on a port, and for a bare address as /32 (its three real survivors; the other four were
  equivalent); `ALREADY_ENABLED` printed as a warning; `time=` in the ping reply; the zones strip no longer outlines a
  zone at the command step; Croatian agreement and wording ("sučelje … vezano je", "ostaju isti", `--reload`), the term
  rule for *source binding* in the explanation, "the `inet firewalld` table, in a chain on the `input` hook";
  unused keys removed; no zone drifting stated in SPEC.md. The step counts (7 each instead of 10, 7, 7, 6) it flagged as
  a scope change: kept, see "Deviations".

## Term pairs

In `kit/glossary.js` and used as `[[terms]]`: firewall, firewall zone, runtime configuration, permanent
configuration. Missing, written out by hand (captions use the Croatian words; the explanation writes *source binding*
in italics with the Croatian): for the coordinator to add with `"src": "simdeck"`:

| en | hr | source |
|---|---|---|
| default zone | zadana zona | UL ch. 15 |
| source binding | vezivanje izvorišne adrese | task caption |
| source address | izvorišna adresa | UL ch. 15 |
| reject | odbiti (porukom) | UL ch. 15 |
| drop | odbaciti | UL ch. 15 |

(`target` is in the glossary as *cilj*, the systemd sense; the page keeps firewalld's `target` as data.)

## Shared requests

- K4 (`ruletable.js`): an option to leave the outcome out of the winner's mark cell (here the zone is already the
  action; the page passes an empty outcome).
- Coordinator (task note): §5.16 makes this page the host for `win-firewall-profiles`. A Windows profile is picked
  per network connection by its location, not per packet source; the model would need a "binding kind" the Windows
  preset can set (a profile bound to a connection, read like an interface binding). Decide whether
  `win-firewall-profiles` becomes a preset task on this folder.

## Time

Start 2026-11-03 17:08, done 17:28 (CET): one session, including the fresh review.
