<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dmz-matrix: specification

Task `docs/tasks/w3/dmz-matrix.md`, catalogue `sec-dmz-matrix` (§4.3). Class: explorer. One concept: **which zone may
open what to which.** The student toggles services in a 3×3 "from → to" matrix between the internet, the DMZ and the
protected LAN; a row of test connections is judged again after every click.

## Scene

- **The firewall** (the book's figure `fig:dmz-vatrozid`): one routing firewall with three interfaces, 1 internet,
  2 DMZ, 3 protected LAN, each zone a box with its hosts. There is no line between the DMZ and the LAN boxes.
- **The matrix:** rows "from", columns "to", in the order internet, DMZ, LAN. The diagonal is greyed ("inside one
  zone: not filtered here"). Each of the six off-diagonal cells shows the ten services as chips, filled with ✓ when
  listed, hollow when not; a click toggles one. With `stateful` off, a cell also shows reply chips (↩ and the
  service: "a reply from source port 443") for each service the reverse cell opens (every service when it lists
  `any`), plus any reply entry it already holds; with `stateful` on, only the reply entries it holds. Reply chips follow the service chips in the same cell, dashed and marked ↩.
- **The tests:** one row per test connection: its id, source host → destination host, the service, a track
  `[from zone] → |firewall| → [to zone]` and the verdicts. Request passed: a solid arrow through the firewall and ✓.
  Dropped: the arrow ends at the firewall with ✕. Below it the reply, dashed, right to left: passed by state, passed by
  its own entry, or stopped at the firewall with ✕. A test inside one zone draws no firewall: "does not cross the
  firewall".

## Hosts (data, not language)

| Host | Zone | Address | Source |
|---|---|---|---|
| visitor on the internet | internet | 198.51.100.7 | simdeck (documentation block) |
| web server on the internet | internet | 198.51.100.10 | `stateful-firewall`'s |
| web server | DMZ | 203.0.113.10 | task file |
| mail server | DMZ | 203.0.113.25 | simdeck (documentation block) |
| client | LAN | 192.168.1.10 | `stateful-firewall`'s, `nat`'s |
| file server | LAN | 192.168.1.20 | simdeck |
| database | LAN | 192.168.1.30 | simdeck |

The LAN is private and the DMZ public, with no NAT (rule 6).

## Services

`tcp/443`, `tcp/80`, `tcp/25`, `udp/53`, `tcp/22`, `tcp/3389`, `tcp/445`, `tcp/5432`, `udp/161`, `any` (task file).
A service is the protocol and the destination port. `any` covers every service.

## State

`{ cells: { 'inet>dmz': ['tcp/443', 'tcp/25'], … six cells }, replies: { 'inet>lan': ['tcp/443'], … }, stateful,
compromised: null | 'dmz-web', tests: [{ id, src, dst, from, to, host, service, result, reason, reply, ok }] }`.
`result` is `pass` or `drop`; `reason` one of `cell-allow`, `default-deny`, `same-zone`; `reply` is null (the request
was dropped) or `{ result, reason }` with reason `reply-of-tracked`, `cell-allow`, `no-rule-for-reply` or `same-zone`.
`ok` is true when the request and its reply both pass.

## Params

| Key | Kind | Values | Default |
|---|---|---|---|
| `stateful` | toggle | the firewall keeps a state table | on |
| `compromised` | toggle | the tests start from the DMZ web server (an attacker on it) | off |
| `inetDmz`, `inetLan`, `dmzInet`, `dmzLan`, `lanInet`, `lanDmz` | hidden number per cell, set by the chips | bit i = service i in the list above; bit 10 + i = the reply entry for service i (none for `any`); 0 … 2^19 − 1 | the book's matrix |

## Rules

1. **Every packet between zones passes the firewall, DMZ ↔ LAN included.** The DMZ is a third interface of the same
   device, not a hole or a way around it. The model has no path between zones except a cell. (URM ch. 18
   „Vatrozid…", Što treba znati, and figure `fig:dmz-vatrozid`; NIST SP 800-41 r1 §3.1–3.2.)
2. **Lookup:** a test from zone A to zone B looks at the one cell A → B and nothing else; it passes if the service is
   listed there or the cell lists `any`. A cell is a set: the order of its chips does not matter, unlike a first-match
   list (contrast `rule-first-match`). (Task file.)
3. **Deny by default, both directions:** a service not listed in the cell is dropped, `default-deny`; an empty cell
   drops everything. (URM ch. 18; NIST SP 800-41 r1 §4 "deny by default".)
4. **Replies.** Stateful: the reply of an allowed request passes by the state table, `reply-of-tracked`, whatever the
   reverse cell holds. Stateless: the reply needs its own entry in the reverse cell B → A, a reply entry for that
   service (source port = the service's port) or `any`; otherwise `no-rule-for-reply`. A service chip in the reverse
   cell is not a reply entry: `tcp/443` there means "B may open port 443 in A", not "replies from port 443 may come
   back". (URM ch. 18 Primjer 5.)
5. **Public servers sit in the DMZ** so that their compromise does not give direct access to the protected side.
   `compromised` replaces the tests by six from the DMZ web server; they are judged by the same matrix (the DMZ → LAN
   cell for the LAN). (URM ch. 18; `vatrozid.html` explanation.)
6. **NAT is not a security function:** the matrix has no NAT row and the model translates no address. (URM ch. 18,
   NIST SP 800-41 r1 §3.2 as quoted.)

**Tie-breaks.**
- A test whose two hosts are in the same zone (LAN → LAN, DMZ → DMZ) never crosses the firewall: `same-zone`, it
  passes, and its reply too, whatever the cells and the mode. The diagonal cells hold nothing.
- `any` in a cell covers every service, also a service whose own chip is off; in the stateless reverse cell it covers
  every reply too.
- Stateful mode ignores reply entries: the state table decides the reply first.
- A dropped request has no reply (`reply: null`), in both modes.
- A reply entry (bits 10–18) never allows a request: only service bits do.

## Tests

| id | from | to | service | | id (compromised) | from | to | service |
|---|---|---|---|---|---|---|---|---|
| t1 | visitor | DMZ web | tcp/443 | | a1 | DMZ web | file server | tcp/445 |
| t2 | visitor | file server | tcp/445 | | a2 | DMZ web | client | tcp/3389 |
| t3 | visitor | client | tcp/3389 | | a3 | DMZ web | database | tcp/5432 |
| t4 | visitor | file server | tcp/3389 | | a4 | DMZ web | client | tcp/22 |
| t5 | visitor | DMZ web | udp/161 | | a5 | DMZ web | DMZ mail | tcp/25 |
| t6 | client | internet web | tcp/443 | | a6 | DMZ web | internet web | tcp/443 |
| t7 | client | DMZ web | tcp/22 | | | | | |
| t8 | DMZ web | database | tcp/5432 | | | | | |
| t9 | client | file server | tcp/445 | | | | | |

Nine, so that the matrix, the scene and every test fit one projector screen (NOTES.md): t1 the DMZ's public service,
t2 deny by default into the LAN, t3–t4 the `rdp-forward` preset (two LAN hosts), t5 SNMP for `any-any`, t6 Primjer 5,
t7 the LAN administering the DMZ, t8 DMZ → LAN, t9 the same-zone tie-break.

## Presets and expected numbers (checked with `node`, pinned in `sim.test.js`)

Students work the DR estate's scenarios: the presets are the book's example and common mistakes, never a model answer.

| Preset | Params | Works both ways | Dropped by default | Reply without rule | Source |
|---|---|---|---|---|---|
| `book` | the defaults: internet → DMZ `tcp/443`, `tcp/25`; LAN → internet `tcp/443`, `udp/53`; LAN → DMZ `tcp/22`; DMZ → LAN none; stateful | 4 of 9: t1, t6, t7, t9 | 5: t2, t3, t4, t5, t8 | 0 | URM ch. 18 (DMZ paragraph, Primjer 5); services derived |
| `stateless` | the same cells, `stateful` off | 1 of 9: t9 | 5 | 3: t1, t6, t7 | URM ch. 18 Primjer 5 |
| `web-compromised` | the book's cells, `compromised` on | 1 of 6: a5 (same zone) | 5: a1, a2, a3, a4, a6 | 0 | derived |
| `any-any` | the book's + internet → LAN `any`, `udp/161`; internet → DMZ `udp/161`; DMZ → LAN `udp/161` | 8 of 9: all but t8 (every test from the internet passes) | 1: t8 | 0 | DR `instructor/caveats.md` CV-58, CV-44 |
| `rdp-forward` | the book's + internet → LAN `tcp/3389` | 6 of 9: t3 and t4 open (both LAN hosts, not one PC) | 3: t2, t5, t8 | 0 | DR CV-59; outcome derived |

Expected by hand from the rules, as checks:
- `stateless`, then the reply entry `↩ tcp/443` in internet → LAN: t6 works (2 of 9: t6, t9); t1 still needs
  `↩ tcp/443` in DMZ → internet.
- `web-compromised`, then `tcp/5432` in DMZ → LAN: a3 works, a1, a2, a4 stay dropped.
- `book`, then `any` in DMZ → LAN: t8 works; with `compromised`, a1–a4 work (the attacker reaches every LAN service).

## Captions

- After a chip click: the cell, the service and what it now does, then which tests changed. Service on: hr
  "Internet → DMZ, tcp/443: dopušteno pravilom u ćeliji." / en "Internet → DMZ, tcp/443: allowed by the cell's rule."
  Off: hr "DMZ → LAN, tcp/445: nema pravila, odbij po zadanome." / en "DMZ → LAN, tcp/445: no rule, deny by default."
  (task file). A reply chip: the reply direction and its source port.
- Otherwise (a preset, a toggle, reset): how many tests work both ways, how many are dropped by default, how many
  stay inside one zone, what the mode does with replies and how many replies have no rule. With `compromised`: how
  many targets the attacker reaches, and that only the DMZ → LAN cell lets it into the LAN.

## Legend

Zone (a box with its name), allowed service (filled chip with ✓), service not listed (hollow chip), reply entry
(dashed chip with ↩), allowed test (solid arrow, ✓), dropped test (arrow ending at the firewall, ✕), reply (dashed arrow, by state or by its own entry), changed (the kit's highlight, on the clicked chip's cell and on tests whose verdict changed).

## Out of scope

First-match ordering (`rule-first-match`), NAT and port forwarding (`nat`, `port-forwarding`), IDS/WAF, IPv6, TCP
flags and timeouts in the state table, an unsolicited packet from a reply entry's source port (that hole is
`stateful-firewall`'s step 3).
