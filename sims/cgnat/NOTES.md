<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cgnat: notes

New stepper (task `docs/tasks/w3/cgnat.md`, catalogue `net-cgnat`, §5.12). Rules, numbers and sources are in
`SPEC.md`; this file holds the decisions around them.

## Decisions

- **Model reuse.** `models/` has no `nat` model yet, so `freePort`, `translateOut` and `translateIn` are copied from
  `sims/nat/sim.js @ ff047ee` (comment in `sim.js`) with one additive change: `translateOut` reads an optional
  `nat.first` (the first port PAT hands out, default 61000 as before), because the CGN starts at 62000. Everything
  `nat` returned is unchanged (a test checks the default). The table rows keep `nat`'s field names
  (`inside`, `outside`, `dest`) instead of the task's `inside, mapped, dst`, so the copy stays the same code.
  `homeIn` (table first, then static forwards), `addressSpace`, `routable` and the step logic are new and pure, ready
  for `models/`.
- **Every home uses 192.168.1.10.** Each subscriber's host has the same private address and port (51000); the
  home routers differ only in their 100.64 addresses (A .5, B .6, C .7). This is how homes really look (every router
  ships the same range), RFC 6598 §4 requires CGNs to cope with it, and it makes the tie-break visible: both home
  routers hand out 61000, and only the CGN tells them apart (62000, 62001). The caption of B's first step says so.
- **Steps depend on the params** (`steps: stepsFor`, as in `tcp-handshake`): outbound with A only 6 (out three hops,
  the reply back three), outbound with every subscriber 3 per subscriber, inbound 3, or 4 with the forward.
  `sim.json` `steps` is 6, the default's count. Against the task's estimates: outbound-works and inbound-dropped as
  asked, port-forward-fails as asked (the fourth step is the client trying 100.64.0.5:8080 directly, which the
  internet does not carry: rule 3 makes the forward unreachable by either address); shared-address is 6 steps
  (7 states) rather than 6 states, one step per hop for each of A and B, no replies.
- **Params.** `direction` (outbound/inbound), `senders` (A only, with the reply / every subscriber, out only; hidden
  inbound), `portForward` (the static entry 100.64.0.5:8080 → 192.168.1.10:8080 on A's router), `subscribers` 1–3.
  The task's `scenario` param is the preset. The inbound probe port follows the forward: 8080 with it, 62050 without
  (the book's 61050 moved into the CGN's range). Direction and senders reset to step 0 (the step count changes).
- **The forward works; it is just never reached.** The model's `homeIn` delivers 100.64.0.5:8080 to
  192.168.1.10:8080 (tested), but no step ever brings a packet there: the forward row is marked "never read" on the
  inbound steps after the drop. A CGN that lets subscribers request a mapping (RFC 6888 REQ-9) or a carrier that
  sells a public address would change that; the explanation says so in one sentence, without naming the protocol, and
  mentions IPv6 as the lasting way out (out of scope beyond that).
- **Lowest free port, not random.** RFC 6888 REQ-15 asks CGNs for hard-to-guess ports; the page keeps the book's
  lowest-free rule (as `nat` does) so the numbers are the same every time. SPEC.md says so.
- **What the server sees** is listed in the server's card ("poslužitelj vidi:"), so the shared-address preset ends
  with 203.0.113.5:62000 and 203.0.113.5:62001 side by side (rule 6).
- **Kit view K2** draws the scene: 27 columns (hosts over four, gap, home routers over six, gap, CGN over six, gap,
  internet over two, gap, server and client over five), one row per subscriber (at least two), the CGN, the internet
  and the server beside A in row 0, the client in the last row. The CGN sits in row 0 rather than in the middle so
  the tallest card (its table) shares a row with A's and the page fits one screen with three subscribers, the
  forward and every subscriber sending (the worst case, checked at 1920×1080 in both languages). Each NAT's table is
  inside its card (`extra`); a card's own address is a kit `addr` line styled as an address chip.
- **Address spaces are drawn three ways at once**: private = dashed border (c1), shared 100.64/10 = hatched with a
  solid border (c2), public = thick solid border (c3). Colour is never the only carrier, and the address text is
  always there. Checked in grayscale. The rewritten header field has the highlighter and an ink outline, with the old
  value struck through beside it; a new table row has the kit's changed mark and the note "novi"/"new", a row found
  on the way back the thick ink border and "pronađen"/"found".
- **Marks.** Home routers carry "NAT", the carrier's NAT "CGN" in its mark, so the acronym is on screen next to its
  name ("operatorski NAT"/"carrier NAT").
- **Drops.** Dropped at the CGN: the kit's cross at the CGN, the CGN's badge "nema zapisa: odbacuje", and the wire box
  "odbačen: CGN nema zapis". Dropped in the internet (step 4 with the forward): the cross at the cloud and the wire
  box; the cloud is too narrow for a badge.
- **Hidden controls.** The kit sets `[hidden]` on a control whose `visible()` is false, but `.sd-ctl`'s `display`
  wins; the page adds `.sd-panel [hidden] { display: none }` (as `csma-cd` and `cert-chain` do). Shared request below.

## Sources

- URM ch. 11 `book/chapters/11-usmjeravanje.md`: "NAT: kad više uređaja dijeli jednu adresu" (one-way sessions,
  port forwarding), Primjer 4 (the PAT table and its numbers).
- URM ch. 08 `book/chapters/08-mrezni-sloj.md`, "Javne i privatne adrese" → Šire o temi (100.64.0.0 – 100.127.255.255,
  RFC 6598 quoted).
- RFC 6598 §4 (read for this task: not forwarded across provider boundaries, filtered on ingress; identical shared
  ranges on two interfaces must work). RFC 6888 §2 (subscribers have limited or no control over the CGN), REQ-9
  (explicit-mapping protocol), REQ-15 (hard-to-guess ports), §4 (identifying a subscriber needs address, port and
  time). RFC 3022, RFC 5737.
- `sims/nat/` (model, Croatian terms), `sims/asymmetric-path/` (page pattern with K2).

- **The Croatian control label "Prosljeđivanje porta 8080 na usmjerniku A"** keeps *port* upright: kit control labels
  are plain text, so the italics of the term rule are only in captions and the explanation.

## Unchecked *(check)*

- Rule 5's wording "the subscriber cannot add a row" holds for a CGN without the explicit-mapping protocol of RFC 6888
  REQ-9 (a MUST in that BCP that many deployments do not offer); the page states the exception in the explanation.
- The Croatian term "operatorski NAT" for carrier-grade NAT (the task's own *(check)*; the book writes
  "prijevod adresa na razini davatelja usluga (Carrier-Grade NAT)"). The page also uses "kućni usmjernik" for the
  CPE and "pretplatnik" for subscriber.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| carrier-grade NAT (CGN) | operatorski NAT *(check)*; the book: prijevod adresa na razini davatelja usluga |
| shared address space | dijeljeni adresni prostor |
| double NAT | dvostruki NAT |
| port forwarding | prosljeđivanje *portova* |
| translation table | tablica prijevoda |
| (table) entry | zapis |
| private / public address | privatna / javna adresa |
| home router (CPE) | kućni usmjernik |
| subscriber | pretplatnik |

## Shared requests

- **models/:** promote `nat`'s `freePort`, `translateOut`, `translateIn` to `models/nat.js` with the optional
  `nat.first` (additive: without it the first port stays 61000); then point `nat` and `cgnat` at it and drop the copy.
- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **Kit:** `.sd-ctl[hidden] { display: none; }` in `kit.css`, so `visible()` works without a page rule (third page
  with the workaround).
- **Kit K2:** a `row` span for nodes (`rowSpan`) would let a tall card such as the CGN sit between subscribers in the
  middle of the drawing.

## Review

A fresh reviewer (a separate agent with no context but the repo) read the folder against `SPEC.md`, the task, the
book and RFC 6888 (quotes checked on rfc-editor.org), and broke the model 41 ways. It found no wrong number, and the
copy of `nat`'s functions faithful. 23 real mutations passed the tests (7 more were equivalent in the current steps):
`lookup` not reset per step, the step count not clamped (`subscribers: 9` crashed), rounding and the lower clamp of
`subscribers`, the edges of 10/8 and 172.16/12, a forward matched by port only or put on every home, the start phase,
`freePort` and `translateIn` ignoring the address, wrong hop ends (`cgn > hB`, `net > cgn`), `reuse` returning row 0, an
inbound packet coloured as A's, the defaults and the client's address. Seven tests were added; every one of those
mutations now fails them (25 tests). Wording fixes from the review: the Croatian term rule order (*carrier-grade NAT*
(operatorski NAT, CGN)); "an address in the shared space", not "the shared space"; "all four translations from the two
entries"; "usually cannot" where the captions said the subscriber cannot write into the CGN (RFC 6888 REQ-9 makes an
explicit-mapping protocol a MUST); "not carried across the internet" instead of "no route" (a 100.64 packet may still
travel inside the client's own provider); "outside client"; the title now names the two translations, not a NAT "translated twice". The
arriving inbound packet lost its chip so the drop cross at the CGN shows on the short link.

## Checks not done here

- A real projector and a lecturer with a clicker.
- Every rule was broken once by the author (free port ignoring taken ports, CGN first port 61000, reuse off, an
  inbound miss passing, 100.64/10 not shared, shared space routable, forwards ignored, forwards before the table, the
  CGN skipped, every subscriber's steps run as A) and by the reviewer (above); each now makes its tests fail.

## Time

Start 2026-11-08 15:58, done 16:22 (about 24 minutes by the clock, one session, including the fresh review).
