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

## Preset task `win-firewall-profiles` (Windows Firewall profiles)

Task `docs/tasks/w3/win-firewall-profiles.md`, thread t-0464. Four presets (`win-office`, `win-home`, `win-cafe`,
`win-vpn`); rules and numbers in `SPEC.md` "Windows profiles".

### Decisions

- **The host model could not express it, so it was extended additively**, as `win-failover-cluster` did on
  `quorum-split-brain` (and `win-boot`, `win-update-rings` on theirs). The task says "write the change under Shared
  requests and stop"; running unattended, with the change contained in this folder, I made it instead. What was
  missing: a binding decided by detection (DC reachable / location / new network) instead of an address, one active
  rule set per adapter with several at once, rules scoped to rule sets, and steps where the laptop connects. The new
  flow is opt-in (scenario `win`): `initial`, `step` and `steps` hand over to it only then, and every firewalld result
  is unchanged (test `W off`; all 28 host tests kept, 15 added).
- **One scenario `win` plus three params** instead of four scenarios: `wifi` (office / home / café, a live choice:
  moving the laptop recomputes the same step, which is the task's "move a laptop between networks"), `vpn` (toggle,
  resets; disabled in the office with the reason shown), `wport` (`445/tcp`, `3389/tcp`, ICMP echo). The presets set
  them. The firewalld controls (`source`, `dport`) are hidden in this flow and the Windows ones in the other.
- **Same stage, three columns**: the senders, PC07's adapters (network, DC reachable, location, profile) and the packet;
  the profile picker as **K4** (first match: three detection rows and the implicit "new network" row, for the adapter
  that connects or that the packet came in on) with the connections under it; the profiles with the adapters that use
  each, the chosen profile's card (inbound / outbound default, the three rules with their profiles, the deciding rule
  or the default line marked; rules not enabled for the profile struck) and the verdict with what the sender sees.
- **Profile icons**: building = Domain, house = Private, globe = Public, drawn as inline SVG beside the name everywhere
  (never the icon alone). The legend shows them in the Windows flow and the firewalld items in the other (the page
  hides the other flow's legend items after each render).
- **Verdict mapping**: Windows' block is the host's `drop` (silent, the sender times out) *(check)*.
- **Sender's view**: SMB → "the shared folder opens `\\PC07\projekti`" or, after waiting, "The network path was not
  found." *(check)*; remote desktop → the sign-in opens / "Cannot connect to the remote computer."; ICMP → the Windows
  ping lines (`Reply from … TTL=128`, `Request timed out.`). No product or tool named beyond Windows itself (the WIN1
  course's topic) and the ping lines the host already uses.
- **Entries**: `win-cafe` (new network → Public) and `win-vpn` (two profiles at once).
- **Kit K4 exists**, so the picker uses it (no own drawing).

### Deviations from the task

- Host model changed (additive, see Decisions) instead of stopping with a shared request.
- **`win-vpn` has 8 steps, not 6**: both connections (2) and both packets with the same three steps as the other
  presets (3 + 3). Six would need the rule check and the verdict merged for this preset only. The others have 4, as
  asked (connect, packet, rules, verdict: the profile pick happens at connect, before the packet, because that is when
  Windows picks it).
- Presets are a scenario plus params, not four scenarios (see Decisions).
- The page's title and subtitle stay the host's ("Zone vatrozida", a packet's zone…); the Windows flow is reached by
  its presets, its scenario and the two entries.
- **Host defect fixed** (one line): `cArrived` passed an array to `t.parts`, which stringifies it, so step 1 of every
  firewalld preset showed `[object HTMLSpanElement], (,klijent,)`. The value is now wrapped in a span; the Windows
  captions do the same.

### Sources

- Microsoft Learn "Windows Firewall overview", "Windows Firewall profiles", "Configure Windows Firewall rules", Network
  Location Awareness: titles and contents **from memory, not read during this task** *(check all)*: the detection
  order (DC authenticated → Domain, else the location, new → Public); defaults block inbound / allow outbound; a block
  is a silent drop; one profile per adapter since Windows 7 / Server 2008 R2; the rule names; the SMB timeout message
  "The network path was not found." (error 53); `TTL=128` in a Windows ping reply.
- *Uvod u Linux* ch. 15 for the host's terms (*zona*, *zadana zona*, *vatrozid*).
- Every scene value (addresses, networks, which rules are enabled for which profile, the RDP rule for Domain only) is
  derived for the lesson, not captured.

### Checks

- Numbers printed by the model before the page (eight param combinations), asserted in `sim.test.js` (43 tests; the
  Windows tie-breaks first: DC beats location, Public by its row not the implicit one, direct network before a route).
- **Mutations**: 19 one-at-a-time mutations of the Windows code (DC ignored, location before DC, new network →
  Private, Public row removed, one profile for the whole machine, routes before direct networks, profile scope
  ignored, port ignored, default allow, block as reject, VPN allowed in the office, VPN ignored, no VPN packet, profile
  not set at connect, the flow never or always on, RDP enabled for Private, home set to Public, another fallback
  network): **19 fail a test**.
- `npm run gate -- lnx-firewalld-zones`: pass. A local Playwright script stepped every Windows preset through every
  step in hr (light and dark) and en: no stage, panel or page overflow at 1920×1080, no console errors; 375×812 no
  sideways scroll (the K4 table scrolls in its box, as the kit specifies). Screenshots reviewed. Fixed from them: the
  panel overflowing by ~400 px (eight presets in two columns; the hidden controls still took space because `.sd-ctl`'s
  `display` beats `[hidden]`), sender names rendered as `[object HTMLSpanElement]`, Croatian case after "na"
  ("na uredsku mrežu"), "the" before adapter names in English, translated labels in the monospace data font, the highlighted connection line covering the one above.
- No fresh reviewer (preset task; not required by §8 for presets).

### Term pairs (missing from `kit/glossary.js`; written out by hand)

| en | hr | source |
|---|---|---|
| firewall profile | profil vatrozida | task |
| domain controller | kontroler domene | task |
| network location | mrežna lokacija *(check)* | task |
| inbound rule | ulazno pravilo | task |

### Shared requests

- Kit (`kit.css`): `.sd-ctl { display: flex }` overrides the `hidden` attribute the kit sets for a param's `visible`,
  so a hidden control still takes space; pages add `.sd-ctl[hidden] { display: none; }` (this one, `amdahl`,
  `ari-big-numbers`, `ari-checking`). One line in the kit would fix them all.
- Kit (`t.parts`): an array placeholder value is stringified; accepting arrays (flattening like `Simdeck.h`) would
  remove a class of caption bugs (this page had one since it landed).
- Kit (legend): a way to show legend items per param (here hidden by the page after each render).
- Coordinator: the previous shared request (a binding kind for the Windows preset) is answered by this flow.

### Time

Start 2026-11-15 15:59, done 16:15 (CET): one session.
