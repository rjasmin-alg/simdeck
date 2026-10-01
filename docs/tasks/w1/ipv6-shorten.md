# ipv6-shorten: Shortening IPv6 addresses

| | |
|---|---|
| Task | `ipv6-shorten` (wave 1, URM book pages) |
| Catalogue entry | `urm-ipv6-shorten` in `docs/catalogue.md` §2.2 |
| Kind | adopt an existing simulator |
| Folder | `sims/ipv6-shorten/` |
| Class | decide on import (playbook §10.4) |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `ipv6` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

Bring the existing simulator into simdeck as `sims/ipv6-shorten/`: **zero compression rules, :: once**.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §2.2.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/skracivanje-zapisa-ipv6-adrese.html` (the original)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/10-ipv6.md` (Uvod u računalne mreže) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch10-*.svg`

## Steps

1. The source is a **fragment** of the URM book's web edition, not a page: it uses the book's
   `IA.Klizac` (slider) and `IA.Koraci` (steps) from `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/static/komponente.js` and the
   book's CSS. Read the fragment, `komponente.js` and the book's §7a layout rules (`/home/rjasmin/projects/uvod-u-racunalne-mreze/scripts/check-web.py`).
2. Start from the template (`kit/new-sim.sh ipv6-shorten sims/ipv6-shorten`) and rebuild the fragment on the kit: its slider and
   steps become kit params and the kit step controller; its "what happened" box becomes the caption; its "why" box
   becomes the explanation; its exercises (`ia-zadatak`) become presets.
3. **Keep the book's numbers.** The comment at the top of the fragment names the worked example (chapter,
   Primjer N) the numbers come from; keep them as the first preset and cite them in `NOTES.md`.
4. Croatian is the original; write English (COMMON.md §4). Croatian terms follow the book's glossary.
5. `origin`: `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/skracivanje-zapisa-ipv6-adrese.html`.
6. Run the checks (COMMON.md §7).

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ipv6-shorten/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
