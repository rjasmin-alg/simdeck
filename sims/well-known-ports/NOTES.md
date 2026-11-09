<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# well-known-ports: notes

Task `docs/tasks/w3/well-known-ports.md` (catalogue `ref-ports`, §4.11). Rules, data and expected numbers: `SPEC.md`.

## What it is

A reference poster (class `reference`, no steps). Across the top, the three IANA ranges as a bar on a log axis
(system 0–1023, user 1024–49151, dynamic 49152–65535, numbers written), a tick per card's port, and under it one line
for rule 3 ("a port number names a service by convention"). Below, 28 port cards in five columns grouped by service
family. Each card: number, service name, transport badge, one line of purpose, the secure variant (lock + `TLS ← 80`
on the secure card, `→ 443` + lock on the plain one) and the course chapters (`URM 13·14  UL 21`, or "not in the
books"). Four filters (transport, service, range, course) dim the cards that do not match. A click selects a card:
its plain/secure partner gets a dashed outline, both get marks on the bar, the card's range on the bar is outlined,
and the caption gives the number, transport, range and a one-line note (the misconceptions live in these notes).

## Decisions

- **Transport = what the protocol uses, not every registry row.** The registry lists `udp` for 22, 25, 80 and most
  old numbers because IANA used to assign both (RFC 6335 §7.2). The cards follow the protocol's RFC and the task's
  list; the explanation says why. Both: 53, 88, 443.
- **One card per number** (20 and 21, 67 and 68, 161 and 162 are separate cards), so the state's `cards[].port` is
  unique and a click selects one number. The task's "20/21 FTP" lines become "FTP data" and "FTP control", etc.
- **Rule 5's tie (same port, TCP before UDP)** never occurs in the card set (one card per number, 53 and 443 are
  "both"). The comparator is still the total order everything is sorted with, tested on synthetic cards; "both"
  sorts between TCP and UDP.
- **Families in five columns** (web + remote access, names and addresses, mail, files + directory, time + databases),
  at most six cards and two headers per column. The family order is therefore web, remote, name, mail, files,
  directory, time, db (the task lists name before remote); the service drop-down follows it.
- **Log and linear axes.** The task asks for the bar to scale on a log axis: `log2(1 + p) / 16` puts the system/user
  edge at exactly 10/16. On it the dynamic range is only 2.6 % wide, so the `ranges` view adds the linear bar under it
  (system 1.6 %, user 73.4 %, dynamic 25 %) and hides the cards' purpose line to make room. Its caption states the
  two shares.
- **Range colours:** system `--c1`, user `--c3` (hatched on the bar, dotted card stripe), dynamic `--c5` (dotted on
  the bar). Transport is the card edge (solid, dashed, double) plus the badge text; active vs dimmed is fill, edge
  colour and font weight (bold vs regular), which survives grayscale.
- **Changed** works as in `http-status-codes`: the page keeps the previous active set and marks the cards that became
  active (`appeared()`); the renders before `mount` returns only set the starting point.
- **Hidden params** `view` and `sel` (same pattern and `.sd-ctl[hidden]` page rule as `linux-dirs`,
  `http-status-codes`). A filter ends a view and the page then clears `view`.
- **Range is a drop-down**, not segmented buttons: four long Croatian words wrapped onto two rows and pushed the panel
  past one screen; the options carry the numbers ("sistemski 0–1023"). Transport and course stay segmented.
- **Croatian term rule:** none of the task's terms (port, well-known/user/dynamic ports, registry, service,
  transport protocol) is in `kit/glossary.js`, so the Croatian explanation writes them out at first mention
  (*user ports* (korisnički *portovi*) …). The default caption italicises *port* on the Croatian page only.
- **Product-named rows** (3306 MySQL protocol, 5432 PostgreSQL protocol, 3389 remote desktop): kept, as the task's
  coordinator note allows, because the registry names the service after the protocol and UL ch22 teaches both
  database servers. 3389 is shown generically as "remote desktop"; the registry names (`microsoft-ds`,
  `ms-wbt-server`) are model data only, never on the page. SMB is named as a protocol. **Owner to decide** if the
  rule is read strictly (OPEN.md is outside this task's scope; listed in the report instead).
- **`linux-services` follows UL ch18**, as the task's *(check)* asked: ch18 discusses SSH (22), DHCP (67, 68),
  NTP (123), SMB (445) and syslog (514), and NFS (2049, no card); the caption says "some services" and does not
  claim they all run on the lab machine (ch18: nothing listens on 123 there, Samba is not installed). The task's list had 53 and 5432 instead of 67/68; DNS is UL ch19 and
  PostgreSQL UL ch22, which the course filter (UL) shows. Deviation recorded.
- **52140** comes from URM ch13 Primjer 1 (client ports 52140, 52141, 53217), not Primjer 2 as the task says
  (Primjer 2 uses 51000 and 51001). Same rule, number kept.
- **syslog 514** is UDP: the registry gives TCP 514 to another service (`shell`), while the UL lab receives syslog
  on TCP 514 (ch13, ch15 opens it in the firewall, ch18). The card's note says this: a ready example of rule 3, the number is a convention.
- **123:** the note follows UL ch18 ("O portu 123"): a client *usually* asks from a random port (RFC 9109's SHOULD);
  servers answer on 123.
- **53:** the note follows UL ch19 and RFC 7766 §5: TCP is a required part of DNS, not only for large answers and zone
  transfers.
- **Term rule in captions:** the Croatian explanation italicises the terms at first mention; captions and card notes
  write *port* plainly except the default caption (task text). Left as is to keep the caption strings plain text.
- **Chapters** name the chapter that teaches the service, whether it prints the number or not (SPEC §2 marks which
  do). Ten cards are in neither book (23, 88, 161, 162, 389, 636, 853, 995, 3389, 5353): they show "not in the books"
  and dim under a course filter.
- **No scanning, no tools:** the page names no tool; the UL book's `ss` and firewall commands are not used.
- `related`: `port-multiplexing`, `tcp-vs-udp-loss`, `protocol-headers`.

## Deviations from the task

- `linux-services`: 22, 67, 68, 123, 445, 514 (UL ch18) instead of 22, 53, 123, 445, 514, 5432 (see above).
- Family order web, remote, name, … (layout).
- Captions: the task gives one footer line; it is the default caption. The other views, filters and selections have
  their own captions, written in both languages.
- Legend: TCP, UDP, TCP+UDP (edge swatches), secure variant (lock), range ("as on the bar"), changed. The swatch
  carries the edge style; the words are short so the header stays on one row.

## Sources

- IANA *Service Name and Transport Protocol Port Number Registry*, CSV in
  `~/projects/uvod-u-linux/references/chapter-22/iana/service-names-port-numbers.csv`.
- RFC 6335 §6, §7.2; RFC 2131 §4.1; RFC 1035 §4.2; RFC 7766 §1, §5; RFC 959 §3.2, §8; RFC 4253 §4.1; RFC 9110
  §4.2.1–2; RFC 9114 §3.1; RFC 1939 §3; RFC 9051 §2.1; RFC 8314 §7.1–7.2; RFC 6409 §3.1; RFC 5905 (via UL ch18).
- URM ch13 "Brojevi portova", "Šire o temi", Primjer 1, Primjer 2; ch14 DNS, DHCP, HTTP/HTTPS, e-mail, FTP.
- UL ch13 (514), ch15 (22), ch18 (ranges; 67/68; 123; 445; 514), ch19 (53), ch20 (25, 587, 110, 143, 993), ch21 (80,
  443), ch22 (3306, 5432).

## Unchecked *(check)*

RFC sections not available offline (the numbers are checked against the registry):

- RFC 7858 §3.1 (853), RFC 4120 §7.2 (88), RFC 6762 (5353), RFC 3417 (161/162), RFC 4511 (389), RFC 5426 (514/udp).
- 636 LDAPS has only the registry entry as its reference.

## Term pairs (not in `kit/glossary.js`; written out in the Croatian explanation)

- port — *port* (URM ch13)
- well-known (system) ports — sistemski (dobro poznati) *portovi*
- user ports — korisnički *portovi*
- dynamic / private ports — dinamički, odnosno privatni *portovi*
- registry — registar
- service — usluga
- transport protocol — transportni protokol

## Shared requests

- **kit:** `.sd-ctl[hidden] { display: none; }` in `kit.css` (same request as `linux-dirs` and `http-status-codes`).

## Checks

- Registry: a script compared every card (number, service name, each claimed transport) with the CSV: all 28 found.
  It also printed the registry's rows per number (the source of SPEC §2's "registry" column).
- `node --test sims/well-known-ports/sim.test.js`: 21 tests. 24 mutations of `sim.js`, one per rule and tie-break;
  all caught after adding `'053'` to the selection test (a leading zero selected 53). Equivalent survivors: widening
  the upper bound in `rangeOf` (no range matches 65536 anyway); taking the highlighted range from the pair partner
  (every pair lies in one range).
- Browser script over 14 URLs × 2 languages (every preset, selections 443, 514, 22 in secure-pairs, 3389 in ranges,
  5432, 68 under a TCP filter, range dynamic, mail + UL): no card below the stage, no card wider than its box, no
  bar label outside the stage, no caption overflow, no page scroll, no console errors. Names wrapping to two lines:
  "udaljena radna površina", "protokol PostgreSQL" (hr), "PostgreSQL protocol" (en).
- **Fresh review** (a separate agent with no context from the build): read the code against SPEC.md, the task and
  the sources, broke a copy of `sim.js` 43 times and fact-checked every card against the registry CSV, the RFCs and
  both books (no factual errors in the data). Fixed from it: tests now pin every card's name, reference and chapters
  and the selected card's range and empty pair (each mutant re-run and caught); the `linux-services` caption no
  longer says "on the lab machine" and says "some services"; 53's note (TCP required, RFC 7766); 123's "usually";
  5432's "one of the database servers"; the count caption takes the total instead of a typed 28; card names never
  below 16 px on a phone; the hidden params' labels; the UDP preset hint; SPEC aligned with the model's names and
  references and with the empty-filter caption; 514 also in UL ch15. Kept: product-named rows (owner's call).
- `npm run gate -- well-known-ports`: passes (46/46 browser checks, no exceptions declared); screenshots reviewed at
  1920×1080 light, dark, grayscale and 375×812, in hr and en.

## Time

Start 03:16, done 03:45 (2026-11-09, by the system clock): about 30 minutes, including the fresh review.
