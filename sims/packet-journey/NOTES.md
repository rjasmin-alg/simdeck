<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# packet-journey: notes

New stepper (task `docs/tasks/w3/packet-journey.md`, catalogue `net-packet-journey`, §4.1, overlap §5.9, wave 3) on
kit view K2 (`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Stage, top to bottom.** The K2 drawing of the ch16 path; the chain strip of eleven phases; then, on the left, the
  packet's headers ("Na žici kod računala" / "Iza usmjernika, na javnoj strani") over the four tables (the computer's
  DNS cache, ARP table and open connections, the router's NAT table), and on the right the capture on the computer.
- **The path as a zigzag** (computer, switch and Internet above; access point, router and server below). Six cards in
  one row left the chips no room between the cards: they covered the addresses. In the zigzag the chips sit in the
  lane between the rows. The order still reads left to right, as in the book's figure.
- **A packet that crosses the whole path** is drawn as arrows on every link it uses, with its chip on the first one.
  Two packets in one step (DHCP DISCOVER/OFFER and REQUEST/ACK, the FIN pairs) run on opposite sides of the links.
- **Which point the header card shows** (SPEC.md "Where a header card shows a packet"): the client's own link for
  every step except the router hop, which shows the public side with the router's changes highlighted and the old
  values struck. The NAT-touched field (source out, destination back) is hatched, with a line saying what it becomes
  behind the router. For two-packet steps the card shows the one that carries the news (the server's DHCP reply, the
  FIN) and names the other under it ("i natrag: ACK").
- **Decisions without a packet** (cache lookup at the click, AND with the mask plus the ARP lookup) appear in the
  header card in place of a packet, as a dashed box on a hit and a solid one on a miss, and as badges on the
  computer's card ("pita predmemoriju", "AND s maskom", dashed "pogodak").
- **Chain strip states**: pending (muted name), done (✓, ink border, a light `--ok` tint), absent (dashed border,
  "odsutan" in bold), unused (dotted border, name struck: TLS on http), the phase of this step with a thick border and
  a phase that changed state in this step highlighted. Each is a link to its own sim with `?lang=` and, where one
  fits, a preset: `dhcp-dora`, `dns-resolution?preset=cold`, `arp-local-remote?preset=remote` (local or remote),
  `arp-local-remote?preset=cache-hit` (ARP), `mac-table`, `hop-rewrite?preset=book`, `nat?preset=book` (PAT),
  `tcp-handshake?preset=book`, `tls-handshake`, `http-exchange`, and `tcp-handshake` for closing (no teardown preset
  exists yet; see shared requests).
- **A fourth chain state, `unused`** (TLS on http). The task names three (pending, done, absent); TLS on a plain
  http request is not "absent" in the book's sense (remembered state), so it gets its own word, "ne treba".
- **Capture list**: number, filter word (`dhcp`, `arp`, `dns`, `tcp`, `tls`, `http`, with the protocol's colour as a
  bar), source → destination as addresses only, and a summary with ports and flags, the way a capture lists them.
  No tool is named. The router hop adds no line: the client's link never saw it.
- **MACs are short labels** (`aa:23`, `bb:01`, `bb:02`, `cc:01`) and the broadcast address is written in full in
  the header card, `ff:ff:…` in the capture.
- **`connOpen` means two requests.** The task's `otvorena-veza` expects "two GET/200 pairs on the same source port"
  and 6 steps; with one request it would be 4. So with an open connection the browser fetches `/` and then
  `/logo.png` on it (ch16 Primjer 3 has three exchanges on one handshake). The second object is derived.
- **`otvorena-veza` uses http**, so its two GET/200 pairs are readable as the task says. Primjer 3 is on port 443;
  on https the same preset shows two pairs of encrypted data, and TLS is also absent (the session is open).
- **`connOpen` is ignored while `joined` is off** (no connection survives without an address); the toggle is
  disabled with that reason. **`connOpen` forces `dnsWarm`** (reviewer finding): a browser reuses a pooled
  connection by host and port without resolving the name again; the `dnsWarm` toggle is disabled while it is on.
  This adds a case to the task's rule 2 (name resolution precedes the request) for the coordinator to confirm.
- **Close is two steps, each a FIN and its ACK** ("FIN/ACK each way, 2 steps" in the task): client FIN + server ACK
  (`FIN-WAIT-2`), server FIN + client ACK (`TIME-WAIT`), four capture lines.
- **TTL on replies.** The task gives 64 at the host and 63 after the router; a reply's TTL needs a hop count for the
  collapsed Internet. Derived: 10 routers, so the server's packets arrive at 53 (64 − 10 − 1). The cloud says
  "10 usmjernika".
- **DNS query port 50500** and **the router as DHCP server** are derived (the task names neither).
- **Switch table assumed learnt** (switch learning is out of scope): the switch's badge says "šalje svima" for a
  broadcast and "prosljeđuje" for a known unicast. The access point's says "propušta".
- **Params** all reset to step 0 (each changes which phases run).
- **Model reuse.** `encapsulation`'s model was not promoted to `models/`, and its byte-level model (sizes, padding,
  FCS) is not what this page needs; the header-stack label comes from the kit (`Simdeck.topology.headers`), the
  layer names and topology words from `encapsulation`, `arp-local-remote` and `hop-rewrite`. Nothing was copied. The
  device rules in `sim.js` (`netOf`, `decide`, `arpLookup`, `dnsLookup`, `switchAction`, `routerForward`, `natOut`,
  `natIn`) are pure functions over plain data with no strings, ready for `models/` if a later path page wants them.
- **Layout fit.** Every step of every preset, with and without `close`, fits 1920×1080 in both languages with the
  panel open (checked by a script over all of them, not only the gate's sampled steps); the longest capture (19
  lines, `novo-spajanje` + close) needs the capture's line height at 1.12. On a phone the capture rows become two
  lines (addresses, then summary).

- **Review** (fresh reviewer, read the diff against SPEC.md and broke rules on purpose): fixed a false "entry
  expired" caption for a host that just joined, the TLS wording (ClientHello and ServerHello are both readable in
  TLS 1.3), "and back" on DHCP replies (now "in reply to"), the Croatian accusative around `[[cache]]`, DNS on an open
  connection (above), the server's FIN badged "answers", and a caption saying "no ARP on the wire" right after an
  ARP exchange (now "learnt a moment ago: the gateway is the resolver"). Thirteen rule breaks the tests missed now
  fail them (open-connection lookup on a new connection, the open connection's NAT row, the hop's destination port,
  TLS directions, per-step chain, rows written and chain changes, NAT note on every later packet, DHCP sources, ARP
  sender and target, DNS ports, request flags, a faked ARP hit).

## Deviations from the task

- `packet` in the state is a list, `packets` (DHCP and FIN steps carry two).
- A fourth chain state `unused` (above).
- The "AND with the mask" and the ARP lookup are one step (the task counts them as one in every preset: drugi-student
  step 2, "the ARP table already knows the gateway"); an ARP miss is folded into the ARP request step that follows.
- "Kit view K2 … once it exists": it exists (0.3.0), so the page uses it; nothing is drawn by hand except the chain
  strip, the tables' layout and the capture list, which K2 does not cover.

## Sources

- URM ch16 "Cjelina: od klika do odgovora, u punom detalju" (all sections, the summary table, Primjer 1–6) and figure
  `ch16-put-podataka-detaljno` (192.168.1.23, 192.168.1.1, 203.0.113.10:443).
- URM ch03 "Put kroz mrežu", ch04 (encapsulation), ch07 (switch), ch08 (ARP, local/remote), ch11 (TTL 64 → 63,
  NAT/NAPT), ch13 (handshake, closing), ch14 (DORA, DNS, HTTP), ch18 (TLS).
- RFC 9112 §9.3 (persistent connections), RFC 8446 §2 (TLS 1.3 1-RTT), RFC 5737 (documentation addresses),
  RFC 793 (SYN-SENT → ESTABLISHED on the SYN-ACK; FIN-WAIT-2, TIME-WAIT).
- Pattern: ossimulator's `journey` capstone (links out of each phase into its own page).

## Unchecked *(check)*

- Public address 198.51.100.7, ports 51000 → 40001, DNS query port 50500, DNS TTL 300 s, 10 Internet routers, the
  second object `/logo.png`: derived, not in the book *(check)*.
- `novo-spajanje` is derived (no book example) *(check)*.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| default gateway | zadani pristupnik |
| router | usmjernik |
| switch | preklopnik |
| three-way handshake | trostruko rukovanje |
| encapsulation | enkapsulacija |
| packet capture | snimka prometa |
| address translation | prevođenje adrese (NAT) |
| ephemeral port | privremeni *port* |
| access point | *access point* (the book keeps the English) |

`cache` — predmemorija is in the glossary and used as `[[cache]]`.

## Shared requests

- **`tcp-handshake`: a teardown preset** (FIN/ACK each way). The task links the closing phase to "the teardown preset
  on `tcp-handshake`"; it has none, so the link opens `tcp-handshake` itself. Once a preset exists, set
  `CHAIN_SIM.close` in `index.html`.
- **Kit K2: chips as nodes** work (the page passes `translate="no"` spans for SYN, DISCOVER, GET /), but the spec in
  `docs/sim-ui.md` §10 says `label` is "the chip's text"; worth a line that a node is accepted.

## For the coordinator (from the task file, unchanged)

- ch16 ("Ime pretvoreno u adresu", Primjer 2) counts the resolver's cache among the three whose hit leaves no DNS
  packet on the client's wire; the client still queries the resolver. This sim makes only the host's caches
  "absent". And Primjer 2 lists a readable "HTTP GET and 200 OK" on port 443; on the client's wire that is TLS
  application data. Both are worth a fix in the book.

## Time

Start 2026-10-27 12:24, done 13:07: about 45 min. Spec, model and tests about 15 min, page and layout fit about 12 min,
review and its fixes about 16 min.
