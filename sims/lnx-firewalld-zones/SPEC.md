<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-firewalld-zones: spec

One concept: **a packet's zone comes from its source or its interface**, and the zone, not the packet, decides
what happens to it. Task: `docs/tasks/w3/lnx-firewalld-zones.md`; catalogue §4.4, overlap §5.16.

Sources, short names used below:

- **[UL15]** *Uvod u Linux*, ch. 15 "Vatrozid: zone, usluge i odluka o otvaranju porta" ("Što treba znati", "Šire o
  temi") and "Primjer 1 — usluga sluša, a izvana je nema". Its footnotes quote firewalld.zone(5), firewall-cmd(1) and
  the firewalld "Zone", "Concepts" and "Predefined Zones" pages.
- **[zone5]** firewalld.zone(5), firewalld.org (read 2026-11-03): `target`, `ingress-priority` ("A zone with a lower
  priority value will be considered before a zone with a higher priority value"), `source`, `interface`.
- **[prio]** firewalld.org, "Zone Priorities" (2023-04): before priorities the classification order was sources
  first, sorted by zone name, then interfaces; "When zone priorities are equal then classification uses this legacy
  behavior." It calls that order formerly undocumented; one source *(check)*.
- Items marked *(check)* are from memory or a single secondary source, not read in a man page on a machine.

## Scene

Host `demosrv1` [UL15]:

| Interface | Address | Network |
|---|---|---|
| `enp1s0` | `192.168.122.57` | `192.168.122.0/24` [UL15] |
| `enp2s0` | `10.20.0.1` | `10.20.0.0/24` (derived; the task gives the outside host only) |

Senders (the `source` param): `democli1` `192.168.122.186` [UL15] and an admin laptop `192.168.122.20` on `enp1s0`;
an outside host `10.20.0.9` on `enp2s0`. A packet goes to the address of the interface it comes in on.

Zones in the scene (the five the presets need of the book's ten [UL15 "Šire o temi"]), every `ingress-priority` 0
as in the book's `--list-all`:

| Zone | `target` (as `--list-all` prints it) | services | ports |
|---|---|---|---|
| `block` | `%%REJECT%%` *(check: the printed form)* | – | – |
| `drop` | `DROP` | – | – |
| `home` | `default` | `cockpit dhcpv6-client mdns samba-client ssh` *(check: the RHEL-family default)* | – |
| `public` | `default` | `cockpit dhcpv6-client ssh` [UL15] | `514/tcp` [UL15] |
| `trusted` | `ACCEPT` | – | – |

Service definitions (`--info-service`): `ssh` → `22/tcp` [UL15], `cockpit` → `9090/tcp`, `dhcpv6-client` →
`546/udp` (task), `mdns` → `5353/udp`, `samba-client` → `137/udp 138/udp` *(check)*.

## Rules

1. **One zone per packet.** Traffic enters one and only one zone; an interface or a source belongs to exactly one zone,
   a zone may serve many [UL15, firewalld "Zone", "Concepts"]. `--change-interface` moves an interface out of its old
   zone. `--add-source` with a prefix already bound to *another* zone is refused with `ZONE_CONFLICT` and changes
   nothing *(check: the error name)*; the same prefix again in the same zone changes nothing (`ALREADY_ENABLED`, printed as a warning; likewise a port or interface already in that zone, or the same
   default zone again).
2. **Zone choice.** Bindings are read in dispatch order (rule 3); the first that contains the packet decides: a
   source binding whose prefix contains the packet's source address, or an interface binding equal to the incoming
   interface. No binding → the **default zone** [zone5, firewall-cmd(1) `--set-default-zone` "for connections and
   interfaces where no zone has been selected"]. With every priority equal, any matching source binding therefore
   beats the interface's zone [prio].
3. **Tie-breaks** (dispatch order), *(check: [prio] is one source)*:
   a. lower `ingress-priority` first [zone5];
   b. equal priority: source bindings before interface bindings [prio];
   c. then by zone name (byte order), sources [prio]; interfaces likewise (an interface is in one zone, so their order
      never changes a result);
   d. so two overlapping prefixes in two zones of equal priority are decided by **zone name, not prefix length**.
   `--set-default-zone` changes the zone of everything that uses the default (unbound interfaces), at runtime and
   permanently at once [UL15 "Šire o temi"]; an interface bound explicitly does not move.
4. **Lists.** In the chosen zone the packet is accepted when its protocol and port match a listed service (expanded
   through its definition, `ssh` → `22/tcp`) or a listed port; protocol counts (`22/udp` is not `22/tcp`). Services are
   read before ports; the first match is the one shown [UL15].
5. **Target** when no list matches [UL15, zone5]: `default` accepts ICMP and rejects everything else; `%%REJECT%%`
   (zone `block`) rejects; `DROP` (zone `drop`) answers nothing; `ACCEPT` (zone `trusted`) accepts. The lists are
   read before the target in every zone, so an `ACCEPT` zone accepts by its target only when nothing is listed.
6. **What the client sees.** Reject → TCP: `connect to host <addr> port <p>: No route to host` (ssh prefixes `ssh:`;
   [UL15 Primjer 1]), ICMP echo: `From <addr> icmp_seq=1 Packet filtered` (code 13, *communication administratively prohibited*,
   which the nftables backend sends and the book measured for an ICMP block; *(check)* for the `block` zone itself). Drop → TCP `Connection timed out`, ICMP no reply. Accept → the service answers; ssh prints the remote
   `hostname` `demosrv1.lab.local` [UL15 Primjer 1], ICMP `64 bytes from <addr>: icmp_seq=1 ttl=64 time=0.41 ms`. Ports 22 and 8991
   are ssh (sshd listens on both in Primjer 1); 9090 is the web console (a generic connect line).

No zone drifting: a packet that enters a source zone is judged there only (firewalld 2.x has no
`AllowZoneDrifting`).

## Steps

Every scenario has the same **7 steps**: the packet (3), one configuration command (1), the same packet again (3).

| n | phase | what happens |
|---|---|---|
| 0 | `idle` | the scene; no packet |
| 1, 5 | `arrived` | the packet is on its interface: source, interface, protocol and port |
| 2, 6 | `zoned` | rules 2–3: the bindings are read in dispatch order, the deciding row (or the default zone) gives the zone |
| 3, 7 | `judged` | rules 4–6: the zone's lists, then its target; the verdict and the client's output |
| 4 | `config` | the scenario's command; the changed binding or list line is marked |

The params `source` and `dport` are live (the same 7 steps re-run with the new packet); `scenario` resets.

## Scenarios and presets (expected numbers)

| Preset | scenario | packet | step 2–3 | step 4 command | step 6–7 |
|---|---|---|---|---|---|
| `book` | `book` | `.186` → `8991/tcp` on `enp1s0` | interface → `public`; no list → target `default` → **reject**, `No route to host` | `firewall-cmd --add-port=8991/tcp` (zone `public`, the default) | interface → `public`; port `8991/tcp` → **accept** |
| `by-source` | `by-source` | `.20` → `8991/tcp` on `enp1s0` | interface → `public` → **reject** | `firewall-cmd --zone=trusted --add-source=192.168.122.20/32` | source → `trusted` (row 1 of 2) → target `ACCEPT` → **accept** |
| `drop-vs-block` | `drop-vs-block` (`enp2s0` in `drop` at step 0) | `10.20.0.9` → `22/tcp` on `enp2s0` | interface → `drop` → target `DROP` → **drop**, `Connection timed out` | `firewall-cmd --zone=block --change-interface=enp2s0` | interface → `block` → `%%REJECT%%` → **reject**, `No route to host` |
| `default-zone` | `default-zone` (`enp2s0` in no zone) | `10.20.0.9` → `22/tcp` on `enp2s0` | no binding → default `public`; service `ssh` → **accept** | `firewall-cmd --set-default-zone=home` | no binding → default `home`; service `ssh` → **accept**; `enp1s0` stays in `public` |

Other numbers the tests check (book scenario unless said):

- `22/tcp` from `.186`: `public`, service `ssh` → accept, before and after the command.
- ICMP echo from `.186`: `public`, target `default` → accept (ICMP).
- `9090/tcp` from `.186`: service `cockpit` → accept.
- by-source with `.186`: `public` both times (the source binding does not contain it) → reject both times.
- drop-vs-block with ICMP: drop (no reply), then reject.
- default-zone with `.186`: `public` by interface both times; the command does not move `enp1s0`.
- Tie-break, tested on the model directly: `trusted` ← `192.168.122.20/32` and `dmz` ← `192.168.122.0/24`, both
  priority 0 → `.20` is in `dmz` (name order); `trusted` at priority −1 → `trusted`. An interface zone at priority −10
  beats a source zone at 0. Adding `192.168.122.20/32` to `home` while `trusted` has it → `ZONE_CONFLICT`, unchanged.

## Out of scope

Runtime vs permanent and `--reload` (one line in the explanation), rich rules, forwarding and policies between zones,
ICMP blocks and their inversion, egress classification, the packet filter underneath (`lnx-netfilter-path`).

## Windows profiles (preset task `win-firewall-profiles`)

Task `docs/tasks/w3/win-firewall-profiles.md`, catalogue §4.5.7, overlap §5.16 ("one page, two presets; both pick a
rule set by where the packet comes from"). The flow is opt-in: scenario `win` hands `initial`, `step` and `steps` to
it; every firewalld scenario above is unchanged (test `W off`).

Sources, short names:

- **[MS-prof]** Microsoft Learn, "Windows Firewall profiles" / "Windows Firewall overview" *(check titles)*: three
  profiles, Domain, Private, Public; Domain when the computer authenticates to a domain controller of its domain
  through the connection; otherwise the category the network was given; a new network is Public.
- **[NLA]** Network Location Awareness service, as described under [MS-prof] *(check)*.
- **[MS-rules]** "Configure Windows Firewall rules": a rule's profile scope *(check title)*.
- Items marked *(check)* were not read on a machine or in the documentation during this task.

### Scene (derived)

Laptop `PC07`, member of `quillmoor.example`. Adapters: `Wi-Fi`, plus `VPN` when the `vpn` param is on (not in the
office, where the domain controller is reachable directly).

| Network | PC07's address | network | routed through it | location given | DC reachable |
|---|---|---|---|---|---|
| office | `10.10.20.57` | `10.10.20.0/24` | – | none | yes |
| home | `192.168.1.23` | `192.168.1.0/24` | – | Private | no |
| café | `172.20.5.77` | `172.20.5.0/24` | – | none (new) | no |
| VPN to the office | `10.10.250.7` | `10.10.250.0/24` | `10.10.0.0/16` | none | yes |

Senders: `PC12` `10.10.20.31` (colleague, office), `HOMEPC` `192.168.1.40`, `GUEST` `172.20.5.14` (café). The Wi-Fi
network's sender sends first; with the VPN on, `PC12` sends second, through the VPN.

### Rules

- **W1. Defaults.** Every profile: inbound connections that match no rule are **blocked**, outbound allowed
  [MS-prof] *(check)*. A block drops silently (no reply, the sender times out) *(check)*; the host's `drop` verdict.
- **W2. Profile by detection, per adapter, when it connects** [MS-prof, NLA]: read top down, first that holds:
  1. a domain controller of the joined domain is reachable and authenticated through this adapter → **Domain**;
  2. the network was given the location Private → **Private**;
  3. the network was given the location Public → **Public**;
  4. implicit: a new, unidentified network → **Public**.
  Tie-breaks: a reachable DC beats any location (row 1 first); a network set to Public is decided by row 3, not by
  the implicit row (same profile, different reason). The profile is re-evaluated when the network changes (the
  connect step) (derived).
- **W3. One profile per adapter, several at once** (since Windows 7 / Server 2008 R2 *(check)*); a packet is judged by
  the profile of the adapter it comes in on. The adapter: the one whose network contains the source; else the one
  with a route that contains it (a directly connected network first, tie-break).
- **W4. Profile-scoped inbound allow rules** [MS-rules] (derived rule set, unchecked):

  | Rule | Port | Enabled for |
  |---|---|---|
  | File and Printer Sharing (SMB-In) | `445/tcp` | Domain, Private |
  | File and Printer Sharing (Echo Request – ICMPv4-In) | ICMP echo | Domain, Private |
  | Remote Desktop (TCP-In) | `3389/tcp` | Domain (as if enabled by the domain's admins) |

  A rule that matches the port but is not enabled for the profile does not decide; with no enabled match, W1 applies.
  Protocol counts. Block rules, outbound rules and rule order are out of scope (only allow rules exist here).

### Steps

Each adapter connects in one step (`connect`: W2, the K4 picker), then each packet in three: `arrived` (its adapter
and that adapter's profile, W3), `checked` (the profile's rules, W4, or the default, W1), `judged` (verdict and what
the sender sees). One adapter: **4 steps**; Wi-Fi and VPN: 2 + 3 + 3 = **8 steps**.

### Presets (expected numbers; script-checked, asserted in `sim.test.js`)

| Preset | params | steps | decisions |
|---|---|---|---|
| `win-office` | `wifi=office` | 4 | Wi-Fi → Domain (row 1); `PC12` SMB → rule SMB-In → **accept** |
| `win-home` | `wifi=home` | 4 | Wi-Fi → Private (row 2); `HOMEPC` SMB → rule SMB-In → **accept** |
| `win-cafe` | `wifi=cafe` | 4 | Wi-Fi → Public (implicit row); `GUEST` SMB → SMB-In not enabled for Public → default block → **drop**, timeout |
| `win-vpn` | `wifi=cafe`, `vpn` | 8 | Wi-Fi → Public; VPN → Domain; `GUEST` SMB on Wi-Fi → **drop**; `PC12` SMB through VPN (to `10.10.250.7`) → **accept** |

Other numbers: `3389/tcp` from home → drop, from the office → accept (rule RDP); ICMP echo in the café → drop; a
`wport` change re-sends live; moving the Wi-Fi (`wifi`) is live too (the same step, recomputed).
