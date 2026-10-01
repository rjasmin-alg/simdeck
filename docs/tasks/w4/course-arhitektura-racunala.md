# course-arhitektura-racunala: course page: Computer architecture

| | |
|---|---|
| Task | `course-arhitektura-racunala` (wave 4) |
| Owner | coordinator or owner (admin → Kolegiji) |
| Size | S |
| Depends on | wave 0; add each sim when it is `ready` |
| Licence | AGPL-3.0-or-later |

## Goal

A course file `courses/arhitektura-racunala.json` and its generated page: the playlist for **Computer architecture**, in the order the
course teaches it. Sims are added as they become `ready` (unfinished ones are flagged by the check, not
published).

## Do

- Create the course in the admin (Kolegiji → + Novi kolegij), or by hand per `docs/site-structure.md` §3.2.
- Ask the owner for the course's title, term, sections (lectures or weeks) and short address.
- Order the sims below by the syllabus; leave out what the owner drops; tools never go on course pages.

## Candidate sims (14, from the catalogue's course column)

| Sim | Title | Wave | Catalogue § |
|---|---|---|---|
| `amdahl` | Amdahl's law simulator (en) | 1 | 2.1 |
| `multicore-mesi` | Homogeneous multicore, LV13 (hr) | 1 | 2.1 |
| `rowhammer` | Rowhammer (en) | 1 | 2.1 |
| `spectre-meltdown` | Spectre & Meltdown (en) | 1 | 2.1 |
| `sram-dram` | SRAM vs DRAM cell (en) | 1 | 2.1 |
| `webserver-amdahl` | Web server Amdahl (en) | 1 | 2.1 |
| `buffer-overflow` | Stack buffer overflow | 3 | 4.3 |
| `cache-hit-ratio` | Cache hit ratio and latency | 3 | 4.8 |
| `cache-mapping` | Cache mapping | 3 | 4.9 |
| `endianness` | Endianness | 3 | 4.9 |
| `floating-point` | IEEE 754 | 3 | 4.9 |
| `mesi-coherence` | MESI coherence on its own | 3 | 4.9 |
| `pipeline-hazards` | Pipeline hazards | 3 | 4.9 |
| `twos-complement` | Two's complement and overflow | 3 | 4.9 |
