# stateful-firewall: Firewall, stateful filtering and DMZ

| | |
|---|---|
| Task | `stateful-firewall` (wave 1, URM book pages) |
| Catalogue entry | `urm-firewall` in `docs/catalogue.md` §2.2 |
| Kind | adopt an existing simulator |
| Folder | `sims/stateful-firewall/` |
| Class | decide on import (playbook §10.4) |
| Size | S |
| Priority | P1 |
| Courses | URM |
| Topic / tags / level | `networks` / `firewall` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

Bring the existing simulator into simdeck as `sims/stateful-firewall/`: **stateless vs stateful filter for a client to port 443, DMZ (Example 5)**.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §2.2.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vatrozid.html` (the original)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md` (Uvod u računalne mreže) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch18-*.svg`

## Overlaps (catalogue §5)

- **§5.1 First-match rule evaluation:** Build one rule-table evaluator with presets: router ACL, stateless firewall, pg_hba.conf. Keep netfilter (a path through hooks, not one list), PAM (control flags, not first match), NTFS (deny wins, not first match) and the most-specific-wins rules (win-dhcp-scope-options, win-fgpp) separate, because their rules are different; note the contrast on each page.

## Steps

1. The source is a **fragment** of the URM book's web edition, not a page: it uses the book's
   `IA.Klizac` (slider) and `IA.Koraci` (steps) from `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/static/komponente.js` and the
   book's CSS. Read the fragment, `komponente.js` and the book's §7a layout rules (`/home/rjasmin/projects/uvod-u-racunalne-mreze/scripts/check-web.py`).
2. Start from the template (`kit/new-sim.sh stateful-firewall sims/stateful-firewall`) and rebuild the fragment on the kit: its slider and
   steps become kit params and the kit step controller; its "what happened" box becomes the caption; its "why" box
   becomes the explanation; its exercises (`ia-zadatak`) become presets.
3. **Keep the book's numbers.** The comment at the top of the fragment names the worked example (chapter,
   Primjer N) the numbers come from; keep them as the first preset and cite them in `NOTES.md`.
4. Croatian is the original; write English (COMMON.md §4). Croatian terms follow the book's glossary.
5. `origin`: `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vatrozid.html`.
6. Run the checks (COMMON.md §7).

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/stateful-firewall/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
