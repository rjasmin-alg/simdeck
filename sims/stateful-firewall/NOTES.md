<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# stateful-firewall: notes

Adopted from the URM book's web edition, `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vatrozid.html` (task
`docs/tasks/w1/stateful-firewall.md`, catalogue `urm-firewall`). The fragment used the book's `IA.Koraci`,
`IA.gumbPrimjer` and `IA.Zadatak` (`output/interaktivno/static/komponente.js`), a `<select>` for the firewall kind, a
small SVG of the zones and the book's CSS. The simdeck copy is canonical from here on.

## Decisions

- **Class `stepper`, 5 steps.** The fragment had two steps (request, reply) and a kind select that re-wrote step 2.
  simdeck keeps those as steps 1–2 and adds three packets that make the fragment's text visible as mechanism:
  3 an unsolicited packet from outside with the service's source port (what a stateless return rule also lets in,
  NIST SP 800-41 r1 §2.1.2 "blocking packets that deviate from the expected state"), 4 the internet to the DMZ web
  server (allowed: why public servers sit there), 5 the DMZ web server to a host in the protected network (dropped
  by the same rules: "DMZ is not a hole", exercise 3 and the "why" box). The concept is still one: how a firewall
  decides a packet (rules alone, or state table then rules). The DMZ rule matrix is `sec-dmz-matrix`, a separate
  task; this page shows one DMZ packet each way and no zone matrix.
- **Params:** kind (stateless / stateful, the fragment's select), a toggle for the stateless firewall's separate
  return rule (Primjer 5's "zasebno pravilo"), and the client's service: web TCP 443 (Primjer 5) or DNS UDP 53
  (end-of-chapter question 13). Changing a param recomputes at the same step, as the fragment's select did.
- **Book's numbers first:** the default and preset 1 (`book`, "Primjer iz knjige", the button name `check-web.py`
  locks; the fragment's `gumbPrimjer` reset to "bez stanja") are URM ch. 18, Primjer 5, which the fragment's top
  comment names: client inside, TCP to port 443, stateless firewall without a return rule → the reply is dropped;
  stateful → it passes by the state table. The book gives no addresses: simdeck uses 192.168.1.10:51000 for the
  client (the `nat` sim's), 198.51.100.10:443 and 198.51.100.53:53 (documentation block) for the servers,
  203.0.113.66 for "someone outside", 192.168.2.10 for the DMZ web server, port 22 inside for step 5. All tested.
- **NAT is left out** although the protected addresses are private: ch. 18 says NAT is not part of the firewall's
  security function, and NAT is its own sim (`nat`). *(check: whether the owner wants a line saying so on the page)*
- **"What happened" box → caption; "why" box → explanation** (the DMZ paragraph verbatim, plus stateless and
  stateful paragraphs from the chapter's "Što treba znati"). The `<details>` text version is not needed: the
  caption is the kit's live region, and the stage text is HTML.
- **Exercises (`ia-zadatak`) → presets**, the question as the hint, the answers not on the page (the steps show them):
  exercise 1 → `book`; exercise 2 → `stateful`; exercise 3 → `dmz` (opens at step 5). Added by simdeck:
  `return-rule` (the separate rule makes the reply pass and opens a hole at step 3) and `dns-udp` (question 13).
- **Rule evaluation (catalogue §5.1):** first match over an ordered list, deny by default; the stateful firewall
  checks its state table before the rules, and writes an entry only for a new connection a rule allowed. Rules are
  allow rules only (the default is the deny). The explanation's last paragraph notes the contrast with other rule
  systems (deny wins, most specific wins, a path through checkpoints) without naming them.
- **Tie-breaks:** the earliest matching rule wins and later rules are not read (trace `unchecked`); a packet found in
  the state table passes without reading any rule, even a later deny; a state entry matches both directions of its
  connection and nothing with another protocol, address or port; a stateful firewall with the return rule on still
  lets the step-3 packet in by rule 4 (the table does not know it, so the rules decide).
- **Simplified:** no TCP flags, connection states or timeouts in the state table (an entry is a connection, both
  ways); the stateless return rule matches source port only (as Primjer 5 words it). *(check)*
- **Colour is not the only carrier:** allowed has ✓ and a green fill; dropped has ✗, a dashed card and a hatched
  strip; the deciding rule (or state entry) is yellow with a thick ink frame and "▶ odgovara, odlučuje"; rules
  read and missed are muted with "– ne odgovara"; a new state entry is filled and tagged "novi zapis"; sender and
  receiver are framed and tagged "šalje"/"prima" (receiver dashed when dropped); the interfaces the packet uses are
  inverted. Checked in grayscale.
- Addresses, ports, protocols and rule numbers are data (`translate="no"`). The model (`rules`, `matchRule`,
  `firstMatch`, `lookupState`, `judge`) is pure over plain data, ready for `models/` (`net-rule-first-match`,
  `sec-dmz-matrix`, `net-asymmetric-path` could reuse it).

## Sources

- The fragment (structure, sentences, exercises) and `komponente.js` (what each component did).
- URM ch. 18 (`book/chapters/18-kiberneticka-sigurnost.md`): "Vatrozid: filtriranje, segmentacija i ono što nije
  sigurnosna mjera" (with NIST SP 800-41 r1 §2.1.1-2.1.2, §3.1-3.2, §4), Primjer 5, end-of-chapter questions 13–14,
  and the figure `ch18-dmz-vatrozid.svg` (interfaces 1 internet, 2 DMZ, 3 protected; drawn in HTML, not copied).
- `scripts/check-web.py` (§7a order, locked button name "Primjer iz knjige").

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| stateless firewall | vatrozid bez stanja |
| stateful firewall, stateful inspection | vatrozid sa stanjem, filtriranje sa stanjem |
| packet filtering | filtriranje paketa |
| state table | tablica stanja |
| deny by default | odbij po zadanome |
| DMZ, demilitarised zone | DMZ, demilitarizirana zona |
| protected network | zaštićena mreža |
| interface | sučelje |
| source / destination port | izvorišni / odredišni *port* |

*firewall* = vatrozid is in the glossary (`src: uvod-u-linux`); the page writes "vatrozid" plainly, as the URM book
does, and uses no `[[terms]]`.

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.

## Checks not done here

- A real projector and a lecturer with a clicker.
- No separate fresh reviewer: the rules were broken once by hand (state lookup after the rules, last match instead
  of first, entry for denied packets, one-direction state match, stateless keeping a table) and each made its tests
  fail.
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has
  "one home for networking interactives".

## Time

Start 2026-10-02 03:59, done 04:07 (about 10 minutes, one session).
