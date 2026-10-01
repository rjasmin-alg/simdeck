# course-automati: course page: Automata and computability

| | |
|---|---|
| Task | `course-automati` (wave 4) |
| Owner | coordinator or owner (admin → Kolegiji) |
| Size | S |
| Depends on | wave 0; add each sim when it is `ready` |
| Licence | AGPL-3.0-or-later |

## Goal

A course file `courses/automati.json` and its generated page: the playlist for **Automata and computability**, in the order the
course teaches it. Sims are added as they become `ready` (unfinished ones are flagged by the check, not
published).

## Do

- Create the course in the admin (Kolegiji → + Novi kolegij), or by hand per `docs/site-structure.md` §3.2.
- Ask the owner for the course's title, term, sections (lectures or weeks) and short address.
- Order the sims below by the syllabus; leave out what the owner drops; tools never go on course pages.

## Candidate sims (4, from the catalogue's course column)

| Sim | Title | Wave | Catalogue § |
|---|---|---|---|
| `automata` | DFA, NFA, PDA, Turing machine (hr) | 1 | 2.1 |
| `dfa-game` | DFA classroom game (hr) | 1 | 2.1 |
| `lnx-regex-match` | How a regex matches | 3 | 4.4 |
| `regex-to-nfa` | Regex to NFA to DFA | 3 | 4.9 |
