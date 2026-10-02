<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# nat: notes

Adopted from the URM book's web edition, `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/nat.html` (task
`docs/tasks/w1/nat.md`, catalogue `urm-nat`). The fragment used the book's `IA.TablicaKojaSePuni`, `IA.UnosAdrese`,
`IA.gumbPrimjer` and `IA.Zadatak` (`output/interaktivno/static/komponente.js`) and the book's CSS. The simdeck copy is
canonical from here on.

## Decisions

- **One page for `urm-nat` and `urm-pat` (catalogue §5.12).** `nat.html` and `pat.html` are byte-identical (the
  fragment's top comment: "ugrađena je i pod pojam/nat.html i pojam/pat.html"), so the merge is this page. The "two
  modes on port" are the chapter's own pair: **PAT** (NAPT: address and port) and **Basic NAT** (address only), as
  the `mode` param, with Basic NAT on one or on two outside addresses. `urm-pat` needs no page of its own; the
  coordinator may point it here (an alias "PAT" is in `sim.json`).
- **Port forwarding is not on the page as a mechanism.** It is `net-port-forwarding` (catalogue §5.12, with the
  container preset), a separate task. The explanation names it in one paragraph, from the fragment's answer to
  exercise 2 and the chapter.
- **Class `stepper`, 5 steps.** The fragment was a live form (pick A or B, press, type an inbound port). It had no
  slider and no `IA.Koraci`, although the task file says it did. The steps are one packet through R each: 1 A sends,
  2 the second host sends (B, or A again), 3 and 4 the server's replies come back through the table, 5 a packet from
  outside arrives at the probe port. Changing a param recomputes at the same step.
- **Book's numbers first:** the default and preset 1 (`book`, "Primjer iz knjige", the button name `check-web.py`
  locks) are URM ch. 11, Primjer 4, which the fragment's top comment names: R on 203.0.113.5, A 192.168.1.10 and B
  192.168.1.11, both from port 51000, to 198.51.100.10:443; A gets 203.0.113.5:61000, B :61001; a packet from outside
  to 203.0.113.5:61050 is dropped. All tested.
- **"What happened" box → caption; "why" box → explanation** (verbatim in Croatian, plus a Basic NAT vs PAT paragraph
  from the chapter). The `<details>` text version is not needed: the caption is the kit's live region.
- **Exercises (`ia-zadatak`) → presets**, the question as the hint, the answers not on the page (the steps show them):
  - exercises 1 and 2 → `book` (which ports A and B get; what happens at 61050);
  - exercise 3 → `open-port` (probe 61000, the port A opened, reaches A);
  - the fragment's "already has a session" message → `same-host` (A sends twice: R reuses its row);
  - added by simdeck from the chapter's Basic NAT paragraph and end-of-chapter question 10: `basic-one` (B finds no
    free outside address and is dropped; the caption says why sharing it would make both connections identical) and
    `basic-two` (B is bound to 203.0.113.6, port 51000 unchanged).
- **No free-text port input.** The kit has no text param (as in `subnet-mask`, `routing-table`), so the probe port is a
  choice: 61050, 61000, 61001. The fragment's invalid-port message is gone with the field.
- **Probe source** is "some outside address" (the fragment and the book give none). PAT looks up the outside address
  and port only, as the fragment does. The book's Primjer 4 says a reply is matched by "the pair (port, outside
  destination)"; a NAT that also filters by the outside endpoint would drop the exercise-3 probe from a stranger. The
  page follows the fragment *(check: whether the owner wants endpoint filtering mentioned)*.
- **Basic NAT binds addresses** (RFC 3022 §2.1, §4.1): its rows show addresses only; an inbound packet to a bound
  address goes to that host whatever the port (preset `basic-one`, step 5: 203.0.113.5:61050 → 192.168.1.10:61050).
  With all outside addresses bound, a new inside host's packet is dropped. *(check)*: the chapter says only that the
  two connections "would look identical"; refusing the binding is the RFC's behaviour, and the caption says both.
- **Tie-breaks:** PAT gives the lowest free port from 61000 on that outside address (a freed hole is filled first; a
  port in use is never handed out twice, which answers end-of-chapter question 12 without showing it); the same inside
  socket to the same destination reuses its row; to another destination it is a new connection with its own port.
  Basic NAT: a bound host reuses its address from any port; the free outside addresses are taken in pool order.
- **Dropped packets** show only "✗ R ga odbacuje" (hatched, dashed card) on the side they never reach, not a packet.
- **Colour is not the only carrier:** the rewritten field has the highlighter plus the kit's outline; the new row is
  filled and tagged "novi zapis"; the row R uses has a thick ink frame and a tag; drops are hatched, dashed and ✗.
  The active host has a frame. Checked in grayscale.
- Addresses, ports and host names are data (`translate="no"`). The model (`freePort`, `translateOut`, `translateIn`)
  is pure over plain data, ready for `models/` (`net-port-forwarding`, `net-cgnat` and `lnx-container-ports` could
  reuse it).

## Sources

- The fragment (structure, sentences, exercises) and `komponente.js` (what each component did).
- URM ch. 11 (`book/chapters/11-usmjeravanje.md`): "NAT: kad više uređaja dijeli jednu adresu" (Basic NAT, NAPT/PAT,
  one-way sessions, port forwarding, with RFC 2663 and RFC 3022), Primjer 4 and its figure `ch11-pat-tablica.svg`
  (drawn as the page's table, not copied), end-of-chapter questions 10–12.
- `scripts/check-web.py` (§7a order, locked button name "Primjer iz knjige").

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| NAT, network address translation | prevođenje mrežnih adresa |
| PAT, port address translation (NAPT) | PAT (*port*, kurziv) |
| translation table | tablica prijevoda |
| router | usmjernik |
| inside / outside address | unutarnja / vanjska adresa |
| source port | izvorišni *port* |
| port forwarding | prosljeđivanje *portova* |
| (table) entry | zapis |

The glossary's *host* is "domaćin" (`src: uvod-u-linux`); the URM book keeps *host* in italics. This page says
"računalo" and does not use `[[host]]`.

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **Catalogue:** mark `urm-pat` as merged into `nat` (catalogue §5.12).

## Checks not done here

- A real projector and a lecturer with a clicker.
- Every rule was broken once (free-port skip, reuse by connection, never reuse, pool exhaustion, Basic NAT lookup by
  address, Basic NAT keeps the port, table not mutated) and each made its tests fail.
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has
  "one home for networking interactives".

## Time

Start 2026-10-02 03:31, done 03:41 (about 10 minutes, one session).
