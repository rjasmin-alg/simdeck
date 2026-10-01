# well-known-ports: Well-known ports

| | |
|---|---|
| Task | `well-known-ports` (wave 3, Reference posters and classroom tools) |
| Catalogue entry | `ref-ports` in `docs/catalogue.md` §4.11 |
| Kind | build a new simulator |
| Folder | `sims/well-known-ports/` |
| Class | reference |
| Size | S |
| Priority | P3 |
| Courses | URM, UL |
| Topic / tags / level | `networks` / `tcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **the ports students meet, grouped by service**.

The student: filter by layer and protocol.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.11.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md`, "Brojevi *portova*: rasponi i imenovana mjesta" (the three IANA ranges; 80, 443, 53, 22, 25 with the registry quotes), "Šire o temi" (how each range is assigned; client ports from the dynamic range), Primjer 1 "tri programa, jedna adresa, tri porta", Primjer 2 "dvije kartice preglednika, isti poslužiteljski port" (52140).
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md`, sections on DNS, DHCP, HTTP/HTTPS, e-mail ("slanje naspram dohvata") and FTP (ports used there).
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/18-mrezne-usluge.md` (NTP 123, SMB 445) and `13-dnevnici-i-zapisi.md` (syslog 514) for the UL view.
- IANA *Service Name and Transport Protocol Port Number Registry*; RFC 6335 (BCP 165) §6; RFC 2131 (DHCP), RFC 6409 (submission), RFC 7858 (DNS over TLS), RFC 9114 (HTTP/3). Mark every number you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** a reference poster: the three IANA ranges as a bar across the top (0–1023 system, 1024–49151 user,
  49152–65535 dynamic/private, to scale on a log axis with the numbers written), and below it a grid of port cards
  grouped by service family (web, name and address services, remote access, mail, files, directory and
  authentication, time and monitoring, databases). Each card: number, transport (TCP / UDP / both), service name,
  one-line purpose, the secure variant if there is one (e.g. 80 → 443), and the course chapter that uses it. Filters
  dim the cards that do not match.
- **State (reference, derived from params):** `{ filter: {transport, family, range, course}, cards: [{port,
  transport, name, family, secureOf|null, rfc, course, visible}], highlight: port|null }`.
- **Params drive live:** each filter re-dims the grid; clicking a card highlights its pair (plain ↔ secure) and its
  range on the bar.
- **Rules (data rules, all from the IANA *Service Name and Transport Protocol Port Number Registry* unless noted):**
  1. Ranges: system 0–1023, user 1024–49151, dynamic/private 49152–65535 (RFC 6335 §6; URM ch13 "Brojevi portova").
  2. A client's own port comes from the dynamic range; servers listen on the registered number (URM ch13 "Šire o
     temi", Primjer 2 "dvije kartice preglednika").
  3. A port number names a service by convention; nothing stops a service from running elsewhere (one line on the
     poster; the concept, no scanning).
  4. Card set (each checked against the registry): 20/21 FTP (TCP), 22 SSH (TCP), 23 Telnet (TCP), 25 SMTP (TCP),
     53 DNS (UDP and TCP), 67/68 DHCP (UDP, RFC 2131), 80 HTTP (TCP), 88 Kerberos (UDP/TCP), 110 POP3, 123 NTP (UDP),
     143 IMAP, 161/162 SNMP (UDP), 389 LDAP, 443 HTTPS (TCP; also UDP for HTTP/3, RFC 9114), 445 SMB (TCP), 514 syslog
     (UDP), 587 mail submission (RFC 6409), 636 LDAPS, 853 DNS over TLS (RFC 7858), 993 IMAPS, 995 POP3S, 3306 MySQL
     protocol, 3389 remote desktop, 5432 PostgreSQL protocol, 5353 mDNS (UDP).
  5. Ties in sorting: by port number, then TCP before UDP.
- **Params:** `transport` choice all / TCP / UDP (default all); `family` select (all + 8 families); `range` choice
  all / system / user / dynamic; `course` choice all / URM / UL.
- **Presets (views):**
  1. `book-five` (URM ch13: "80 za HTTP, 443 za HTTPS, 53 za DNS, 22 za SSH, 25 za SMTP"): only those five lit.
  2. `udp-only`: transport UDP → DNS, DHCP, NTP, SNMP, syslog, mDNS, Kerberos (and 443 for HTTP/3).
  3. `secure-pairs`: plain/secure pairs side by side: 80/443, 110/995, 143/993, 389/636, 53/853, 23/22.
  4. `linux-services` (UL ch18 network services): 22, 53, 123, 445, 514, 5432 *(check against UL chapter list)*.
  5. `ranges`: the bar enlarged with three example numbers: 443 (system), 3389 (user), 52140 (dynamic, URM ch13
     Primjer 2).
- **Steps:** reference, none.
- **Legend:** TCP (solid card edge, "TCP"), UDP (dashed edge, "UDP"), both (double edge), secure variant (lock icon +
  "TLS"), range colour plus range name. "Changed" marks cards that became visible with the last filter.
- **Captions** (the poster's footer line per view):
  - hr: „*Port* 443 je sistemski *port* (0–1023) za HTTPS. Preglednik na svojoj strani dobiva slobodan broj iz
    dinamičkog raspona, npr. 52140.“
  - en: "Port 443 is a system port (0–1023) for HTTPS. The browser gets a free number from the dynamic range on its
    side, e.g. 52140."
- **Terms** (URM ch13): port — *port*; well-known (system) ports — sistemski (dobro poznati) *portovi*; user ports —
  korisnički *portovi*; dynamic / private ports — dinamički, odnosno privatni *portovi*; service — usluga; registry —
  registar; transport protocol — transportni protokol.
- **Misconceptions:** the port number makes traffic HTTP (it is a convention, rule 3); DNS is UDP only (TCP 53 for
  large answers and zone transfers); the client uses the same port as the server (rule 2).
- **Out of scope:** scanning or probing ports (no tool, no how-to), firewall rules (`net-rule-first-match`), NAT
  (`urm-nat`), the full registry.
- **Note for the coordinator:** product-named rows (MySQL, PostgreSQL, remote desktop) are kept because the
  registry names the service after the protocol; drop them if the owner's "no products by name" rule is read
  strictly.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh well-known-ports sims/well-known-ports` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/well-known-ports/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
