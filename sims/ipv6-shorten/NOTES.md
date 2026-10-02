<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipv6-shorten: notes

Adopted from the URM book's web edition, `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/skracivanje-zapisa-ipv6-adrese.html`
(task `docs/tasks/w1/ipv6-shorten.md`, catalogue `urm-ipv6-shorten`). The fragment used the book's `IA.UnosAdrese`,
`IA.Koraci`, `IA.gumbPrimjer` and `IA.Zadatak` (`output/interaktivno/static/komponente.js`) and the book's CSS. The
simdeck copy is canonical from here on.

## Decisions

- **Class `stepper`, 5 steps:** 0 the full address, 1 lowercase, 2 leading zeros out, 3 the zero runs (each marked
  with what happens to it), 4 the longest run becomes `::`, 5 the check (groups left + groups under `::` = 8), the
  length saved and the address type. The original had 3 steps (leading zeros, longest run, `::`); the check and the
  type were in its "what happened" box at the last step.
- **Deviation: a lowercase step.** The original lowercased silently while parsing. The book lists lowercase as the
  fifth of its five rules, so it is a step of its own; for an already-lowercase address the caption says nothing
  changes. The preset `uppercase` (the book's own full example `ABCD:EF01:2345:6789:ABCD:EF01:2345:6789`) shows it.
- **Deviation: the equal-runs rule.** The book's five rules do not say which of two equally long runs `::` takes.
  The original's code took the first (a strict `>`), which is RFC 5952 §4.2.3 ("the first sequence of zero bits MUST
  be shortened", example `2001:db8:0:0:1:0:0:1` → `2001:db8::1:0:0:1`). The page now says it, in the explanation and
  in the step-3 caption, and the preset `tie` uses the RFC's example. The book's errata list might want this line
  (outside simdeck).
- **Book's numbers first:** the default and preset 1 (`book`, "Primjer iz knjige", the fragment's own button name)
  are URM ch. 10, Primjer 1: `fe80:0000:0000:0000:0204:61ff:fe9d:f156` → `fe80::204:61ff:fe9d:f156`, five groups
  left plus three under `::`, prefix `fe80::/10`, link-local. The fragment's top comment names it.
- **Exercises (`ia-zadatak`) became presets**, opened at step 0 so the class predicts before stepping; the question
  is the preset's hint, the answer is what the steps show (the fragment's revealed answers are not on the page):
  - exercise 1 → `book` (above);
  - exercise 2 → `longest`: `2001:0db8:0000:0000:0000:ff00:0042:8329` → `2001:db8::ff00:42:8329`, the chapter's
    worked example ("Šire o temi"), global unicast;
  - exercise 3 (two addresses) → `unspecified` (all zeros → `::`) and `loopback` (`::1`).
  - from the chapter's text: `single`, `2001:db8:0:1:1:1:1:1`, the book's example of the one-group rule, in full form.
  - from RFC 5952 §4.2.3: `tie`.
  The end-of-chapter questions (5, 6, 10) are not presets: they are the students' homework. They are in the tests.
- **No free-text address input.** The kit has no text param, so the original's address field is a select of eleven
  full addresses: the presets, plus Primjer 2's four addresses in full form (`2001:db8:85a3::8a2e:370:7334`,
  `fe80::1`, `fc00::1`, `ff02::1`) so every type of the chapter can be shown. The model's `parse` still takes any
  full address (eight groups of 1–4 hex digits), so a text param would need no model change.
- **The original's text version (`<details>`) is gone:** the caption is the kit's live region and says the same.
- **The "why" box is the explanation**, with the five rules above it. Its example was reworded: the original paired
  `2001:db8:0:1::1` and `2001:db8::1:0:0:0:1` (the same address) with the one-group rule, but that pair shows the
  longest-run rule; the explanation now says so, and the one-group rule gets its own sentence.
- **Address type** (the original's last sentence) is kept as one box and one caption sentence in the last step, with
  the original's prefixes and its order (`::` and `::1` before the ranges). The type is not a second concept here:
  no step is about it. The original's sentence "Ovaj prefiks nije nijedan od četiri raspona koje ovo poglavlje imenuje" is kept, without "ovo".
- **Colour is not the only carrier:** the run that becomes `::` is filled (`--c1`) and has a thick solid bracket
  with its words ("najdulji: postaje ::"); zero groups that stay are dashed and empty with a dashed bracket and
  their reason; changed groups get the highlighter plus the kit's outline; `::` in the short form is highlighted and
  outlined. Checked in the grayscale screenshot.
- The address helpers in `sim.js` (`parse`, `lower`, `stripLeading`, `zeroRuns`, `longestRun`, `runVerdicts`,
  `compress`, `shorten`, `classify`) are pure functions over arrays of strings, ready for `models/` should another
  IPv6 sim (SLAAC, ch. 10 cards) need them.

## Sources

- The fragment (structure, sentences, exercises, the classification code) and `komponente.js`.
- URM book ch. 10 (`book/chapters/10-ipv6.md`): the five rules and their RFC quotes ("Što treba znati"), the worked
  example and the one-group case ("Šire o temi"), the address types and prefixes ("Vrste IPv6 adresa"), Primjer 1
  and 2, questions 5, 6 and 10. Figure `assets/diagrams/ch10-adresa-dva-zapisa.svg` (same example; not copied, the
  stage draws it).
- RFC 5952 §4.1, §4.2.1–4.2.3, §4.3; RFC 4291 §2.2 (`::` once), §2.5.6 (link-local), RFC 4193 (unique local).
- `scripts/check-web.py` (locked button names): "Primjer iz knjige" kept as preset 1.
- Every number in `sim.test.js` is checked against those passages.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| zero compression / shortening an IPv6 address | skraćivanje zapisa IPv6 adrese |
| group (16-bit field) | skupina |
| zero group | nula-skupina |
| leading zeros | vodeće nule |
| global unicast address | globalna unicast adresa |
| link-local address | link-local adresa (the book keeps *link-local* in English) |
| unique local address | jedinstvena lokalna adresa |
| multicast address | multicast adresa |
| unspecified address | neodređena adresa |
| loopback address | adresa povratne petlje (the glossary has *loopback* = povratna petlja) |

## Shared requests

- **Glossary:** add the term pairs above with `"src": "simdeck"`.
- **Kit: a text param** (`type: 'text'` with a `validate`) would bring back the original's free address input; the
  model is ready for it.

## Checks not done here

- A real projector and a lecturer with a clicker.
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has
  "one home for networking interactives".

## Time

Start 2026-10-02 20:50, done 21:00 (about 10 minutes, one session).
