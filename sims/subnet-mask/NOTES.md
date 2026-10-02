<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# subnet-mask: notes

Adopted from the URM book's web edition, `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/podmrezna-maska.html`
(task `docs/tasks/w1/subnet-mask.md`, catalogue `urm-subnet-mask`). The fragment is the book's normative §7a page;
it used the book's `IA.BitnoPolje`, `IA.Klizac`, `IA.UnosAdrese`, `IA.Koraci` and `IA.Zadatak`
(`output/interaktivno/static/komponente.js`) and the book's CSS. The simdeck copy is canonical from here on.

## Decisions

- **Class `stepper`, 7 steps.** The fragment's own sentence says chapter 8 describes the procedure "as one continuous
  flow, not four separate steps", and its `IA.Koraci` already stepped the ARP part. The steps follow that flow:
  0 address and mask, 1 AND = network address, 2 broadcast address, 3 addresses left for hosts, 4 the same AND on the
  destination, 5 compare (differing bits marked), 6 ARP request, 7 ARP reply. The slider (prefix) and the
  destination are kit params; changing them recomputes every number at the current step, so the original's live
  "move the boundary and watch" still works at any step (at step 7 everything is visible).
- **Book's numbers first:** the default and preset 1 (`book`, "Primjer iz knjige", the fragment's own button name)
  are 192.168.1.100 with 255.255.255.192 (/26) → 192.168.1.64, broadcast 192.168.1.127, hosts 192.168.1.65–.126
  (62). Source: URM ch. 8, section "Podmrežna maska, mrežna adresa i *broadcast* adresa", the running example and
  figure `ch08-mreza-host-granica-maska.svg`. **Deviation:** the task says the fragment's top comment names a
  "Primjer N"; it does not (it calls itself the normative page). The numbers are the chapter's running example, not a
  numbered Primjer.
- **The fragment's "what happened" box is the caption; its "why" box and the text alternative are the explanation
  and the caption** (the caption is the kit's live region, so the separate `<details>` text version is not needed).
- **Exercises (`ia-zadatak`) became presets**, opened at step 0 so the class predicts before stepping; the question
  is the preset's hint, the answer is what the steps show (the fragment's revealed answers are not on the page):
  - exercise 2 → `far`: /26, destination 192.168.1.200 (in 192.168.1.192/26, remote, ARP asks for the gateway);
  - exercise 1 → `mask-240`: 255.255.255.240 = /28, 14 usable addresses;
  - exercise 3 (why an ARP request never reaches a remote destination) is a question without a state: it is in the
    explanation and in the step-6 caption, and `internet` (8.8.8.8, the book's Primjer 5 (b)) shows it.
  - two of the chapter's worked examples, whose solutions the book prints: `example-2` (Primjer 2 (b),
    192.168.1.10/24 → 192.168.2.50, remote) and `example-6` (Primjer 6, 192.168.5.77/28 → .64, .79, .65–.78).
  The end-of-chapter questions (11, 20) are not presets: they are the students' homework.
- **Preset order** `book, far, mask-240, …` (not the fragment's exercise order): the gate's slider check clicks the
  slider at 90 % after loading preset 2, which lands on /28; with `mask-240` second, the click did not change the
  value, the kit kept focus on the slider and → moved it (see Shared requests).
- **No free-text address input.** The kit has no text param, so the original's destination field is a select of
  the book's addresses (192.168.1.77, .137, .200, 192.168.2.50, 192.168.5.70, 8.8.8.8) and the own address (fixed
  192.168.1.100 in the original) is a choice of the three the book uses (192.168.1.100, 192.168.1.10, 192.168.5.77).
  192.168.1.137 is the original's placeholder; 192.168.5.70 is mine (a local destination for Primjer 6).
  The original's default destination was the own address itself; it is now 192.168.1.77 (Primjer 2 (a)).
- **Prefix /1–/30**, as in the original. /31 and /32 have their own rules (RFC 3021; no network and broadcast
  address); the explanation says so.
- **Edge the original ignored:** under /30, 192.168.1.100 is itself the network address (host bits 00). The original
  showed a range calmly; now the hosts box and the captions of steps 1 and 3 say it must not be assigned to a host.
  A test checks that no offered destination is ever the network or broadcast address of an offered own network.
- **No gateway address.** The original names no gateway address; the book's Primjer 5 uses 192.168.1.1, which is
  outside 192.168.1.64/26, so a number would be wrong for the default. The page says "the default gateway".
- **Colour is not the only carrier:** network bits are filled (`--c1`), host bits dashed and empty, a thick ink line
  marks the boundary through every row, the part names stand over their bits, differing bits get the highlighter
  fill plus the kit's outline, the verdict box is solid (same) or dashed (different) and says it in words.
- The IPv4 helpers in `sim.js` (`parse`, `format`, `bits`, `mask`, `network`, `broadcast`, `hosts`,
  `sameNetwork`, `role`, `differing`) are pure functions over numbers with no strings, ready to move to `models/`
  when `vlsm` or `routing-table` needs them.

## Sources

- The fragment (structure, sentences, exercises) and `komponente.js` (what each component did).
- URM book ch. 8 (`book/chapters/08-mrezni-sloj.md`): the running example, Primjer 2, 5 and 6, the ARP section,
  RFC 1122 §3.3.1.1 for the local/remote decision, RFC 919 (broadcast), RFC 826 (ARP broadcast request, unicast
  reply), RFC 4632 (contiguous mask). Every number in `sim.test.js` is checked against those passages.
- `scripts/check-web.py` (the §7a section order and locked button names): "Primjer iz knjige" kept as preset 1.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| subnet mask | podmrežna maska |
| network address | mrežna adresa |
| broadcast address | *broadcast* adresa (the book keeps *broadcast* in English) |
| bitwise AND | bitovno I |
| default gateway | zadani pristupnik (the glossary has *gateway* = pristupnik) |
| network part / host part | mrežni dio / *host* dio |
| unicast | jednoodredišno (book; the page says "unicast" next to "samo pošiljatelju") |

**Glossary conflict:** *host* = domaćin in the glossary (UL book), but the URM book keeps *host* in English, in
italics, untranslated. This page follows the URM book. Worth an OPEN.md line for the coordinator.

## Shared requests

- **kit.js: a slider click that does not change the value keeps focus on the slider**, so the clicker's → then moves
  the slider instead of stepping. The kit gives focus back on `change`; it should also do so on `pointerup`. Worked
  around here only by the preset order (above); a lecturer clicking the thumb in place still hits it.
- **Glossary:** add the term pairs above with `"src": "simdeck"`, and decide *host*.

## Checks not done here

- A real projector and a lecturer with a clicker.
- One mutation survives by design: letting `differing` scan all 32 bits instead of the network bits changes nothing,
  because both network addresses have every host bit zero.
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has
  "one home for networking interactives".

## Time

Start 2026-10-02 02:28, done 02:45 (about 20 minutes, one session).
