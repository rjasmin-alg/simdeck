<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# well-known-ports: Well-known ports (spec)

Task: `docs/tasks/w3/well-known-ports.md` (catalogue `ref-ports`, §4.11). Class **reference**: no steps. The page is a
poster: the three IANA ranges as a bar across the top (log axis, numbers written), under it 28 port cards grouped by
service family. Four filters (transport, family, range, course) dim the cards that do not match; a click on a card
highlights it, its plain/secure pair and its range on the bar; five views as presets.

One concept: **the ports students meet, grouped by service.**

Sources (all read offline on 2026-11-09):

- IANA *Service Name and Transport Protocol Port Number Registry*, CSV export in
  `~/projects/uvod-u-linux/references/chapter-22/iana/service-names-port-numbers.csv` (every card's number, service
  name and transport rows checked there by script, NOTES.md "Checks").
- RFC 6335 (BCP 165) §6 (ranges), §7.2 (both-transport assignments ended; port numbers do not reliably say which
  service made a flow), in `~/projects/uvod-u-linux/references/chapter-18/rfc6335.txt`.
- RFC 2131 §4.1 (DHCP 67/68), RFC 1035 §4.2, RFC 7766 §1 and §5 (DNS over UDP and TCP), RFC 959 §3.2 and §8 (FTP
  20/21), RFC 4253 §4.1 (SSH 22), RFC 9110 §4.2.1–2 (80, 443), RFC 9114 §3.1 (HTTP/3 on UDP), RFC 1939 §3 (110),
  RFC 9051 §2.1 (143, 993), RFC 8314 §7.1–7.2 (995, 993), RFC 6409 §3.1 (587), RFC 5905 (123, via UL ch18). Offline in
  the two books' `references/`.
- Not offline, marked *(check)*: RFC 7858 §3.1 (853), RFC 4120 §7.2 (88), RFC 6762 (5353), RFC 3417 (161/162),
  RFC 4511 (389; 636 has the registry only), RFC 5426 (514/udp). The numbers
  themselves are checked against the registry; only the RFC sections are unchecked.
- URM = *Uvod u računalne mreže*: ch13 "Brojevi *portova*: rasponi i imenovana mjesta" (ranges; "80 za HTTP, 443 za
  HTTPS, 53 za DNS, 22 za SSH, 25 za SMTP"), "Šire o temi" (the client's port from the third range), Primjer 1
  (client ports 52140, 52141, 53217), Primjer 2 (51000, 51001 to the same server port 443); ch14 sections DNS, DHCP,
  HTTP/HTTPS (port 80; 443; HTTP/3 over QUIC over UDP), e-mail (SMTP, IMAP, POP3), FTP.
- UL = *Uvod u Linux*: ch13 (syslog received on 514), ch15 (sshd on 22), ch18 (ranges; 67 and 68 "i zašto su dva";
  "O portu 123, i zašto ga u ispisu nema"; SMB 445), ch19 (DNS 53), ch20 (25, 587, 110, 143, 993), ch21 (80, 443),
  ch22 (3306, 5432).

## 1. Ranges (rule 1)

| range | numbers | RFC 6335 §6 name | assigned |
|---|---|---|---|
| system | 0–1023 | System Ports, also Well Known Ports | by IANA (IETF Review or IESG Approval) |
| user | 1024–49151 | User Ports, also Registered Ports | by IANA (also Expert Review) |
| dynamic | 49152–65535 | Dynamic Ports, also Private or Ephemeral Ports | never |

`rangeOf(p)`: `system` for 0 ≤ p ≤ 1023, `user` for 1024 ≤ p ≤ 49151, `dynamic` for 49152 ≤ p ≤ 65535; `null` for
anything else (negative, above 65535, not an integer, not a number). Expected: 0 → system, 1023 → system, 1024 →
user, 49151 → user, 49152 → dynamic, 65535 → dynamic, 65536 → null, −1 → null, 80.5 → null, '80' → null.

**The bar** draws the ranges to scale on a log axis: `logPos(p) = log2(1 + p) / 16`, so `logPos(0) = 0`,
`logPos(65535) = 1`, and the edges fall at `logPos(1023) = 10/16 = 0.625` and `logPos(49151) = log2(49152)/16 =
0.97406` (system 62.5 %, user 34.9 %, dynamic 2.6 % of the bar). The linear share (`linPos(p) = p / 65535`), shown
in the `ranges` view under the log bar: system 1.56 %, user 73.4 %, dynamic 25.0 % (16384 of 65536 numbers).

## 2. Cards (rule 4, the data)

28 cards. `t` = the transport the protocol runs over (from its RFC, or the task), not every registry row: before RFC
6335 IANA assigned most numbers for both TCP and UDP whether the protocol used both or not (§7.2), so the registry
lists `udp` for 22, 25, 80 and others. "registry" lists the service name and the transport rows found in the CSV.
`secure`: the plain number this card secures (with the mechanism), or the secure variant of this plain card.
Chapters: the chapter that teaches the service; **bold** where the chapter prints the number.

| port | t | name | registry (service: rows) | family | secure | reference | URM | UL |
|---|---|---|---|---|---|---|---|---|
| 20 | TCP | FTP data | ftp-data: tcp udp sctp | files | | RFC 959 §3.2 (L−1) | 14 | |
| 21 | TCP | FTP control | ftp: tcp udp sctp | files | | RFC 959 §8 | 14 | |
| 22 | TCP | SSH | ssh: tcp udp sctp | remote | secures 23 (SSH) | RFC 4253 §4.1 | **13** | **15**, **18** |
| 23 | TCP | Telnet | telnet: tcp udp | remote | → 22 | RFC 854 | | |
| 25 | TCP | SMTP | smtp: tcp udp | mail | | RFC 5321 | **13**, 14 | **20** |
| 53 | TCP+UDP | DNS | domain: tcp udp | name | → 853 | RFC 1035 §4.2, RFC 7766 | **13**, 14 | **19** |
| 67 | UDP | DHCP server | bootps: tcp udp | name | | RFC 2131 §4.1 | 14 | **18** |
| 68 | UDP | DHCP client | bootpc: tcp udp | name | | RFC 2131 §4.1 | 14 | **18** |
| 80 | TCP | HTTP | http: tcp udp sctp | web | → 443 | RFC 9110 §4.2.1 | **13**, **14** | **21** |
| 88 | TCP+UDP | Kerberos | kerberos: tcp udp | directory | | RFC 4120 §7.2 *(check)* | | |
| 110 | TCP | POP3 | pop3: tcp udp | mail | → 995 | RFC 1939 §3 | 14 | **20** |
| 123 | UDP | NTP | ntp: tcp udp | time | | RFC 5905 | | **18** |
| 143 | TCP | IMAP | imap: tcp (udp Reserved) | mail | → 993 | RFC 9051 §2.1 | 14 | **20** |
| 161 | UDP | SNMP | snmp: tcp udp | time | | RFC 3417 *(check)* | | |
| 162 | UDP | SNMP trap | snmptrap: tcp udp | time | | RFC 3417 *(check)* | | |
| 389 | TCP | LDAP | ldap: tcp udp | directory | → 636 | RFC 4511 *(check)* | | |
| 443 | TCP+UDP | HTTPS | https: tcp udp sctp | web | secures 80 (TLS) | RFC 9110 §4.2.2; RFC 9114 §3.1 (UDP) | **13**, **14** | **21** |
| 445 | TCP | SMB | microsoft-ds: tcp udp | files | | registry | | **18** |
| 514 | UDP | syslog | syslog: udp (tcp 514 is `shell`) | time | | RFC 5426 *(check)* | | **13**, **15**, **18** |
| 587 | TCP | mail submission | submission: tcp udp | mail | | RFC 6409 §3.1 | | **20** |
| 636 | TCP | LDAPS | ldaps: tcp udp | directory | secures 389 (TLS) | registry | | |
| 853 | TCP | DNS over TLS | domain-s: tcp udp | name | secures 53 (TLS) | RFC 7858 §3.1 *(check)* | | |
| 993 | TCP | IMAPS | imaps: tcp (udp Reserved) | mail | secures 143 (TLS) | RFC 8314 §7.2, RFC 9051 §2.1 | | **20** |
| 995 | TCP | POP3S | pop3s: tcp udp | mail | secures 110 (TLS) | RFC 8314 §7.1 | | |
| 3306 | TCP | MySQL protocol | mysql: tcp udp | db | | registry | | **22** |
| 3389 | TCP | remote desktop | ms-wbt-server: tcp udp | remote | | registry | | |
| 5353 | UDP | mDNS | mdns: tcp udp | name | | RFC 6762 *(check)* | | |
| 5432 | TCP | PostgreSQL protocol | postgresql: tcp udp | db | | registry | | **22** |

Per family (poster order): web 2 (80, 443); remote access 3 (22, 23, 3389); name and address services 5 (53, 67, 68,
853, 5353); mail 6 (25, 110, 143, 587, 993, 995); files 3 (20, 21, 445); directory and authentication 3 (88, 389,
636); time and monitoring 4 (123, 161, 162, 514); databases 2 (3306, 5432). Total 28.

Per transport: TCP only 18, UDP only 7 (67, 68, 123, 161, 162, 514, 5353), both 3 (53, 88, 443).
Per range: system 24, user 4 (3306, 3389, 5353, 5432), dynamic 0.
Per course: URM 11 (20, 21, 22, 25, 53, 67, 68, 80, 110, 143, 443); UL 16 (22, 25, 53, 67, 68, 80, 110, 123, 143,
443, 445, 514, 587, 993, 3306, 5432); neither 10 (23, 88, 161, 162, 389, 636, 853, 995, 3389, 5353).
Secure pairs (plain → secure, mechanism): 80 → 443 TLS, 110 → 995 TLS, 143 → 993 TLS, 389 → 636 TLS, 53 → 853 TLS,
23 → 22 SSH. `pairOf(p)` returns the other number of the pair, or null.

## 3. Rules

1. **Ranges** (RFC 6335 §6; URM ch13): §1. Every card's range is `rangeOf(port)`; no card is in the dynamic range,
   because the dynamic range is never assigned.
2. **A client's own port comes from the dynamic range; servers listen on the registered number** (URM ch13 "Šire o
   temi", Primjer 1 and 2). The model's example connection, a browser to HTTPS: client port 52140 (URM ch13
   Primjer 1), server port 443; `rangeOf(52140) = dynamic`, `rangeOf(443) = system`. The `ranges` view marks 443
   (system), 3389 (user) and 52140 (dynamic, "the browser's own port"). The DHCP client (68) is the exception the
   UL book explains (ch18 "Portovi 67 i 68, i zašto su dva": the answer must reach a machine that has no address
   yet), so 68 is the one card whose `side` is `client`; all others are `server`.
3. **A port number names a service by convention** (RFC 6335 §7.2: "drawing conclusions about the service that
   generated a given flow based on observed port numbers is not always reliable"; UL ch18 "Odakle dolazi broj").
   One line on the poster. The syslog card shows the registry fact that TCP 514 is registered to another service
   while the UL lab receives syslog on TCP 514 (UL ch13, ch18): the number does not make the traffic.
4. **Card set** §2, each number, service name and transport checked against the registry. `name` and `ref` are
   the table's name and reference columns (model data; the page shows the translated name from strings.js).
5. **Ties in sorting: by port number, then TCP before UDP** (a card on both sorts between: `tcp` 0, `both` 1, `udp`
   2). `compare(a, b)` is that total order; every list the model returns (cards, the active list, appeared) uses it.
   In the `secure-pairs` view the cards of a family are ordered so each secure card follows its plain partner:
   sort key (anchor, secure?, transport) with anchor = the plain partner's number for a secure card, else its own
   number. Expected: mail 25, 110, 995, 143, 993, 587; name 53, 853, 67, 68, 5353; remote 23, 22, 3389; directory
   88, 389, 636; web 80, 443; the other families unchanged.

Misconceptions the page answers: the port number makes the traffic HTTP (rule 3, the line on the poster and the
syslog card); DNS is UDP only (53 is TCP+UDP; its caption: TCP is a required part of DNS, RFC 7766 §5, not only
for large answers and zone transfers; UL ch19);
the client uses the same port as the server (rule 2, the `ranges` view).

## 4. Params, filter and views

- `transport`: `all` | `tcp` | `udp` (default `all`). `tcp` keeps TCP and TCP+UDP cards, `udp` UDP and TCP+UDP.
- `family`: `all` | `web` | `remote` | `name` | `mail` | `files` | `directory` | `time` | `db` (default `all`).
- `range`: `all` | `system` | `user` | `dynamic` (default `all`).
- `course`: `all` | `URM` | `UL` (default `all`).
- `view` (hidden, set by the presets): `none` | `book-five` | `udp-only` | `secure-pairs` | `linux-services` |
  `ranges`.
- `sel` (hidden, set by a click): a card's port as a string, or `''`.

A card is **active** when it matches every filter and is in the view's focus (when a view is on and has one).
Inactive cards are dimmed, never hidden.

A view is **on** while the four filters are what its preset set (all `all` except `udp-only`'s `transport: udp`).

| preset | params | focus | order |
|---|---|---|---|
| `book-five` | view | 22, 25, 53, 80, 443 (URM ch13) | port |
| `udp-only` | transport udp, view | none (the filter: 53, 67, 68, 88, 123, 161, 162, 443, 514, 5353) | port |
| `secure-pairs` | view | 22, 23, 53, 80, 110, 143, 389, 443, 636, 853, 993, 995 | pairs (rule 5) |
| `linux-services` | view | 22, 67, 68, 123, 445, 514 (services UL ch18 discusses; NFS 2049 is no card) | port |
| `ranges` | view | 443, 3389 (the examples on cards; 52140 is on the bar) | port; the bar enlarged |

Expected active counts: default 28; transport tcp 21, udp 10; range system 24, user 4, dynamic 0; course URM 11, UL
16; families as §2; `udp` + `name` 4 (53, 67, 68, 5353); `user` + `udp` 1 (5353); `UL` + `db` 2; `URM` + `remote`
1 (22); views as the table (5, 10, 12, 6, 2).

**Highlight**: `sel` set → the selected card, its pair partner (`paired`), its range on the bar (`state.range`).
With no selection, the `ranges` view highlights nothing on the cards and marks its three examples on the bar.

**Changed** = the cards that became active with the last change of the active set (`appeared(before, after)`, in
the list order): from `transport udp` back to `all` the 18 TCP-only cards; from `all` to `udp` none (only dimmed);
from `range dynamic` to `range user` the four user cards.

## 5. Tie-breaks

- **A filter ends a view.** Change a filter away from what the preset set and the view is off: its focus no longer
  dims, the order goes back to port order. The page then clears the hidden `view` param, so setting the filter back
  does not revive the view.
- **A dimmed card can still be selected** (dimming is a reading aid); the selection stays when a filter dims it.
- **Unknown `transport`, `family`, `range`, `course`, `view` or `sel`** (a stale or hand-edited URL, also
  `constructor`, `__proto__`) is `all`, no view and no selection. Never an error.
- **Click on the selected card** deselects it (page).
- **An empty filter** (range dynamic, or URM + databases) dims every card. For the dynamic range the caption says
  why (never assigned, clients take their own port from it); otherwise it says no card matches.

## 6. Out of scope

Scanning or probing ports (no tool, no how-to), firewall rules (`net-rule-first-match`), NAT (`urm-nat`), the full
registry, socket pairs and multiplexing in depth.
