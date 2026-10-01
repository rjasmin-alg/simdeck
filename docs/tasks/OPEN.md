# Open items

Things that wait on the owner's ratings or answers. None of them blocks a task in `docs/tasks/` from
starting; where a task depends on one, its file says what it does meanwhile.

## Waiting on the owner

| Item | Affects | Meanwhile |
|---|---|---|
| **Interest ratings** (catalogue Int column, `tools/catalogue/ranker.py`) | the order within waves 2–3 | the proposed Pri (B1/P1/P2/P3) orders the work |
| **One home for networking interactives:** simdeck builds the URM book's ~40 planned cards and ports its 14 pages, and both book editions link the simdeck copies? (catalogue §5.19–5.20) | wave-1 URM ports, `freeze-originals` | recommended yes; the ports proceed, the books are not changed |
| **`quick-poll`:** how votes reach the page (shared state, a local server, or typed counts) | `w3/quick-poll.md` | only the model and layouts can be built |
| **`game-tick-server`:** is a tick-batched authoritative server the intended concept? (agentvsagent itself is not tick-authoritative) | `w3/game-tick-server.md` | spec models a tick-batched server |
| **Radio security:** import the Marp slides or the web page, and where is the Marp source? | `w1/radio-security-slides.md`, `w1/radio-security-page.md` | both tasks exist; run one |
| **Official course names** (not needed now) | `w4/` course tasks | working names |

## Decided, still to carry out

| Item | Task |
|---|---|
| AGPL-3.0-or-later in the source repos (owner, 2026-10-02) | `w0/licence-source-repos.md` (changes outside simdeck) |
| ossimulator is the source of truth for its pages (owner, 2026-10-02) | `w0/ossimulator-english.md`; recorded in `docs/site-structure.md` §0 |
| Rebuild `docs/proposal-simdeck.pdf` after the AGPL and language edits | `w0/licence.md` |

## For the books' and the estate's authors

Errata and inconsistencies the specs found (URM ch06/ch10/ch14/ch16, UL ch12 and logrotate, DR-estate caveat
CV-32 and the OU count, KAKA's backup-NCS and priority rules) are listed in `SPEC-NOTES.md`.
