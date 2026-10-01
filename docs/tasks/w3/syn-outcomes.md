# syn-outcomes: Open, closed, filtered

| | |
|---|---|
| Task | `syn-outcomes` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-syn-outcomes` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/syn-outcomes/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | URM, SEC |
| Topic / tags / level | `networks` / `tcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `tcp-handshake` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **SYN gets SYN/ACK, RST or nothing, and what each means (port scanning)**.

The student: probe ports on a host behind a firewall.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/tcp-handshake/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/15-analiza-prometa.md` (Uvod u računalne mreže) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch15-*.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 (the planned card: URM card ch15 (three SYN outcomes))
- Catalogue seed: URM card ch15 (three SYN outcomes)
- URM ch15 section "Tri ishoda jednog TCP SYN paketa" and "Primjer 2: tri ishoda istog SYN paketa" (port
  8080, captures A/B/C, ranking C > B > A); diagram `ch15-tri-ishoda-syn.svg`, capture
  `assets/images/ch15-tri-ishoda-syn.png`; "Primjer 3: čitanje ICMP Destination Unreachable" (codes 0 and 1)
- URM ch13 "Primjer 3: trostruko rukovanje s pravim brojevima" (X=4000, Y=9500)
- URM ch18, DMZ and firewall policy ("odbij po zadanom"), diagram `ch18-dmz-vatrozid.svg`
- URM plan §6 table row 11 (trostruko rukovanje: ishod uspjeh, RST, tišina) and page "9 · Dijagnostika"
- RFC 9293 §3.5.2 (reset generation), §3.10.7.1 (segment arrives, CLOSED); RFC 6298 §2.1, §5.5 (initial
  RTO 1 s, back-off); RFC 1812 §5.2.7.1 (ICMP unreachable codes, 13 = administratively prohibited); RFC 5737
- RFC 9293 §3.5 (connection establishment, reset generation) and RFC 792/1122 (ICMP destination unreachable): the source for open / closed / filtered
- iptables-extensions(8), REJECT target `--reject-with tcp-reset` (rule 1 `reject-rst`, preset 4); Linux `tcp(7)`, `tcp_syn_retries` default 6 (rule 5)

## Model and presets

- **Scene:** K1 chart with three lanes: Klijent (scanner) · Vatrozid (firewall, may be absent) · Poslužitelj
  (host). Under the host a port strip (e.g. 22, 23, 80, 443, 8080) showing what each port really is
  (listening / nothing listening / blocked by a rule) — hidden behind a "what the client can't see" toggle so
  the class first reads only the capture. A results table on the right fills one row per probe: port, what
  came back, verdict (open / closed / filtered) and "what this proves".
- **State:** `{ probes: [{port, phase, reply, verdict, retries}], cur, t, chart: [...], table: [...] }`;
  scenario data (from the preset): `host: {exists, listening: [ports]}`, `fw: {rules: [{port, action}],
  default}` with actions `allow`, `drop`, `reject-rst`, `reject-icmp`.
- **One step:** one event on the chart for the current probe, in this order: (1) client sends SYN
  (seq=X); (2) the firewall applies its first matching rule; (3) if passed, the host answers by rule 3/4;
  (4) the reply (or silence) reaches the client; for silence, the next steps are SYN retransmissions; (5) the
  last step of a probe also writes its verdict row. Then the next probe starts.
- **Rules:**
  1. Firewall first, first match wins, then the default policy (ties: rule order). `drop` discards silently;
     `reject-icmp` sends ICMP Destination Unreachable type 3 code 13 "administratively prohibited"
     (RFC 1812 §5.2.7.1); `reject-rst` sends a TCP RST on the host's behalf (a
     packet filter's reject-with-reset action) (check, Sources). A stateful firewall lets replies of an allowed SYN
     back (book ch15, ch18).
  2. No host at the address → nothing answers: silence (book ch15 "Tri ishoda", third outcome; TEST-NET
     192.0.2.1 in the book's capture). (A router could send ICMP host unreachable, ch15 Primjer 3 code 1;
     out of scope here.)
  3. Host present, application listening on the port → SYN+ACK seq=Y ack=X+1 (book ch13 Primjer 3, ch15
     first outcome). The client then sends ACK (connect) or, in `half-open` mode, RST (a half-open probe).
  4. Host present, nothing listening (CLOSED) → RST+ACK, seq=0, ack=X+1: "if the connection does not exist
     (CLOSED), a reset is sent in response to any incoming segment except another reset" (RFC 9293 §3.5.2,
     §3.10.7.1; book ch15 quotes it).
  5. Silence → the client retransmits the SYN with RTO 1 s, doubling (1 s, 2 s, 4 s …; RFC 6298 §2.1 and
     §5.5) (check per OS; on Linux the default of 6 SYN retries gives ≈ 127 s, Sources). The page shows two
     retransmissions, then gives up (as in the book's capture: "dva ponovljena SYN-a").
  6. Verdict (from RFC 9293 behaviour): SYN+ACK → **open**; RST → **closed**; no reply
     after the retransmissions, or ICMP unreachable type 3 codes 1, 2, 3, 9, 10, 13 → **filtered**.
  7. What each proves (book ch15 Primjer 2, ranking C > B > A): SYN+ACK proves an application on the port;
     RST proves the host and its TCP layer are alive; silence proves nothing definite (no host, or a drop on
     the way). Tie-break: a `reject-rst` firewall makes a blocked port look **closed**, so RST does not prove
     the host itself answered (check).
- **Params:** `firewall` toggle (default on); `fwAction` choice `drop`/`reject-icmp`/`reject-rst` for the
  blocked port (default `drop`); `scan` choice `connect`/`half-open` (default `connect`); `reveal` toggle
  (show the host's real port states, default off). Changing params restarts at step 0.
- **Presets:**
  1. `book-three` — ch15 Primjer 2: three servers, port 8080. C: SYN, SYN+ACK, ACK → open. B: SYN, RST →
     closed. A: SYN, silence, SYN again, silence → filtered / unknown. Ranking C > B > A. From the book.
  2. `book-capture` — the book's real capture (figure `ch15-tri-ishoda-syn.png`): 172.66.147.243:80 SYN,
     SYN+ACK, ACK; 192.168.1.1:59999 SYN, RST+ACK; 192.0.2.1:80 SYN plus two retransmissions, no reply.
     From the book.
  3. `behind-firewall` — host 192.168.1.20 listening on 22 and 80, nothing on 8080; firewall allows 80 and
     8080, drops 22. Probes 22, 80, 8080: 22 filtered (although an SSH server listens), 80 open, 8080 closed. Derived.
  4. `drop-vs-reject` — the same blocked port 22 three times with `drop`, `reject-icmp`, `reject-rst`:
     filtered (silence), filtered (ICMP 3/13, answered at once), closed (RST from the firewall). Derived
     (check the RST case against a real packet filter).
  5. `no-host` — 192.0.2.1 (RFC 5737 documentation address): every port looks the same as a firewall drop.
     From the book (ch15 capture), derived for the port list.
- **Steps:** a probe takes open 3 (SYN, SYN+ACK, ACK/RST), closed 2 (SYN, RST), ICMP reject 2 (SYN, ICMP),
  silent 3 (SYN and two retransmissions); the verdict row is written on the probe's last step.
  1 → 8; 2 → 8; 3 → 8; 4 → 7; 5 → 6.
- **Legend:** SYN, SYN+ACK, ACK, RST (arrow with tag), ICMP (dotted arrow), silence (SYN arrow ending in ✕ at
  the firewall or in empty space), retransmission (↻); verdict badges open (✓ `--ok`), closed (■ `--warn`),
  filtered (? `--muted` hatch). "Changed" marks the newest arrow and the new results row.
- **Captions:** hr: "Korak 5: odmah stiže RST+ACK s potvrdom 4001. *Host* postoji i njegov TCP sloj radi,
  ali na *portu* 8080 ništa ne osluškuje: zatvoren." en: "Step 5: an RST+ACK comes back at once,
  acknowledging 4001. The host exists and its TCP layer works, but nothing listens on port 8080: closed.";
  hr: "Korak 8: ni treći SYN nema odgovora. Tišina ne dokazuje ništa određeno: uređaja nema, ili je paket
  usput odbačen." en: "Step 8: the third SYN gets no answer either. Silence proves nothing definite: there
  is no device, or the packet was dropped on the way."
- **Terms:** port scanning — skeniranje *portova* (check); firewall — vatrozid; listen — osluškivati;
  retransmission — ponovni prijenos; reset (RST) — RST, reset veze; filtered — filtriran; flag — zastavica.
- **Misconceptions:** (1) no answer means the host is down (it may be a drop on the way); (2) a closed port
  means a firewall blocked it (RST comes from a live TCP stack); (3) "filtered" is a fact about the host, not
  about the path.
- **Out of scope:** UDP scanning, other probe types, any scanning tool, OS fingerprinting, rate limits,
  ICMP from routers for missing hosts (→ `icmp-messages`), the stateful-firewall rule logic (→
  `stateful-firewall`, `rule-first-match`).
- **Builds on:** reuses `tcp-handshake`'s SYN/SYN+ACK/ACK model and numbers (X=4000, Y=9500) and its chart;
  new are the firewall lane, the CLOSED → RST rule, SYN retransmission and the verdict table.
- **Note for the coordinator:** URM plan §6 lists "trostruko rukovanje — ishod (uspjeh, RST, tišina)" as the
  interactive parameter of the handshake page, so the three outcomes could be a preset of `tcp-handshake`
  instead. Keep it separate: the firewall and the scanner's verdicts make it a 3–5 minute demo of its own;
  link both ways.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh syn-outcomes sims/syn-outcomes` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/syn-outcomes/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
