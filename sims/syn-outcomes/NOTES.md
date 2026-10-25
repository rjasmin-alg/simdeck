<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# syn-outcomes: notes

New stepper (task `docs/tasks/w3/syn-outcomes.md`, catalogue `net-syn-outcomes`), written from scratch on the kit
template. Rules and numbers: `SPEC.md`.

## Decisions

- **Kit view K1** draws the chart (`kit/sequence.js`), three lanes: Klijent (c1), Vatrozid (c3), Poslužitelj (c2). The
  firewall card holds its rule list (the deciding rule outlined with ▶, highlighted in the step its SYN arrives) and the
  server card the port strip (listening / nothing, hatched "blokiran" where a rule blocks it, the probed port framed).
  The results are a list of cards rather than a table: "what this proves" is a phrase, and cards wrap without
  squeezing columns.
- **One step = one chart row.** The firewall's decision and the host's processing are in the SYN's step (they are not
  messages); this gives exactly the task's counts: open 3, closed 2, ICMP 2, silent 3; presets 8, 8, 8, 7, 6.
- **Scenes are a hidden param** (`scene`, in `defaults`, set by each preset; not a control). The task's params apply
  on top. A by-hand change keeps the scene; reset goes back to the active preset.
- **Reveal does not restart** (the task: "changing params restarts at step 0"). It only changes the view, so a class
  reads the capture first and then reveals the truth at the same step. The other three params restart.
- **The client's view with reveal off:** every silent SYN stops short, half way to the firewall lane (✕ in empty space, no word: it would run into
  the fields on so short an arrow), the
  firewall and server cards say what the client cannot see, and an RST forged by a `reject-rst` firewall is drawn from
  the server's lane, since it carries the host's address. With reveal on, a dropped or rejected SYN ends in ✕ at the
  firewall, a SYN to no device in empty space with "nema uređaja" and a dashed card, the forged RST comes from the
  firewall lane with "u ime hosta" under its time, and each result gets a "Zapravo" line.
- **Disabled controls with a reason** (`aria-disabled` via the kit) when they change nothing: the firewall toggle in
  scenes without a firewall, `fwAction` with the firewall off or in `drop-vs-reject` (each probe has its own action).
  The reason is neutral ("u ovom primjeru vatrozid ništa ne mijenja") so it does not give away a hidden answer.
- **`book-three`'s hidden truth:** the book does not say why server A is silent. Here a firewall in front of A allows
  only 443 (default deny, ch18) and A does listen on 8080, so switching the firewall off opens it. The three servers
  have documentation addresses (RFC 5737), and the names C, B, A from the book appear on the lane and in the results.
- **`book-capture`** keeps the capture's own numbers: relative seq/ack (0 and 1, as the analyzer shows them), times
  (7.203 / 7.236 ms, 0.628 ms) and the retransmission gaps (1.029 s, 1.024 s, labelled without "RTO": they are what
  happened, not a timer setting). Everything else uses RFC 6298's 1 s doubling.
- **Times are per probe** (ms since the probe's own first SYN): each probe reads like its own small capture, and the
  scenes give no time between probes.
- **The give-up timer:** the 4 s timer after the third SYN is drawn expired on that SYN's row, the step that writes
  the verdict (the client gives up); the page does not spend a step on the extra 4 s.
- **The RST caption is the client's reading** ("Za klijenta to znači: *host* postoji …"), so it is true for the
  host's RST and honest for a forged one, and identical for both while reveal is off; reveal adds who sent it. A small
  change from the task's caption text, which states it as a fact.
- **`behind-firewall` / `drop-vs-reject` server on 192.168.2.20**, another network than the client: the firewall
  routes between them, so its ICMP comes from an address of its own.
- **Model copied, not shared:** `models/` has no TCP model yet, so `seqAdd` is copied from `sims/tcp-handshake/sim.js
  @ 2941030` (commented). The handshake numbers (X = 4000, Y = 9500) are the same as there.
- Concepts, not tools: no scanner, analyzer or packet-filter product is named on the page; the half-open probe is
  described as a behaviour. iptables-extensions(8) and Linux `tcp(7)` are cited in Sources only.

## Deviations from the task

- `reveal` does not restart the demo (above).
- While reveal is off, every silent SYN stops short in empty space (half way to the firewall lane); with reveal on, a
  drop ends in ✕ at the firewall and a SYN to no device in ✕ at the dashed "no device" card. So the class cannot tell
  a drop from a missing host before the reveal.
- `book-three` is adapted from Primjer 2: the book's capture A has one repeated SYN after about 10 s, the page two
  (rule 5), as in every preset; its hint says "Prema primjeru 2".
- The task's port strip example (22, 23, 80, 443, 8080) is the scene's own list (`strip`), only the ports the scene
  is about.

## Sources

- URM ch15 (`book/chapters/15-analiza-prometa.md`): "Tri ishoda jednog TCP SYN paketa" (the three outcomes, RFC 9293
  reset rule, silence and retransmission), Primjer 2 (port 8080, captures A/B/C, ranking C > B > A), the capture figure
  `assets/images/ch15-tri-ishoda-syn.png` (addresses, ports, times, "dva ponovljena SYN-a"), Primjer 3 (ICMP type 3
  codes). The diagram `ch15-tri-ishoda-syn.svg` was read, not copied.
- URM ch13 Primjer 3 (X = 4000, Y = 9500, via `sims/tcp-handshake`); ch18 "odbij po zadanome", stateful filtering.
- RFC 9293 §3.5.2, §3.10.7.1 (reset for CLOSED, `<SEQ=0><ACK=SEG.SEQ+SEG.LEN><CTL=RST,ACK>`); RFC 6298 §2.1, §5.5
  (1 s, doubling); RFC 1812 §5.2.7.1 (code 13); RFC 5737 (documentation addresses).
- iptables-extensions(8), REJECT `--reject-with tcp-reset` and `icmp-admin-prohibited`; Linux `tcp(7)`
  `tcp_syn_retries` (6 → 127 s).

## Unchecked *(check)*

- The capture's retransmissions are about 1 s apart, not doubled. My reading: the capturing host repeats its first SYNs
  at a fixed 1 s (newer Linux kernels have `tcp_syn_linear_timeouts`); the explanation says "some systems repeat the
  first ones at equal intervals" without naming one. The book's Primjer 2 speaks of "ten seconds of nothing".
- The analyzer shows the RST+ACK as "Seq=1 Ack=1" in relative numbers; RFC 9293 gives absolute seq 0, which the page
  shows. Worth a note in the book, not a change here.
- A real packet filter's tcp-reset carries the same seq/ack as the host's own RST (rule 1 and the tie-break of rule 7):
  derived from RFC 9293's reset rule, not captured.
- How a TCP client reacts to ICMP 3/13 (abort the connect, or keep retrying as a soft error) varies (RFC 1122
  §4.2.3.9 lists 2, 3, 4 as hard errors); the page only takes the scanner's verdict and stops the probe there.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| port scanning | skeniranje portova *(check: the task's suggestion)* |
| listen | osluškivati |
| retransmission | ponovni prijenos (the page says "ponovljeni SYN") |
| filtered (port) | filtriran |
| flag | zastavica |
| reset (RST) | RST, reset veze |

`[[firewall]]` (vatrozid) is in the glossary. *host* and *port* are written in italics as the URM book does, not via
`[[host]]`: the glossary has host = domaćin (`uvod-u-linux`), which the URM book does not use.

## Shared requests

- **Kit:** still `visible: () => false` does not hide a control (`.sd-ctl[hidden]` has no rule; tcp-handshake's
  request). This page disables instead.
- **models/:** promote a TCP model (`seqAdd`, the handshake segments) from `tcp-handshake`; this sim then takes
  `seqAdd` from there.
- **Glossary:** the pairs above with `"src": "simdeck"`.

## Review

A fresh reviewer (a separate agent with no part in writing it) read the diff against `SPEC.md` and the sources and
mutated `sim.js` 57 ways. Fixed from the review: the silent ✕ fell exactly on the firewall lifeline (K1's half way
between lanes 1 and 3), the RST caption asserted a live host for a forged RST, Croatian dative in "(pravilu 1)" and
nested brackets, client and server in one /24 behind a separate firewall, the last silent probe's timer left running,
an overclaim ("six retries are usual"), the book-three hint. Tests were added for every mutation that survived and
mattered; five survivors remain, all equivalent or unread by the page (missing host checked before the firewall: no
scene has both; RTO +1 s vs doubling: same with two retries; rounding of half the RTT; the table's `code` and
`probes[].fwAction`, which the page does not read).

## Time

Start 2026-10-25 08:29, done 08:52 (one session, including the fresh review and its fixes).
