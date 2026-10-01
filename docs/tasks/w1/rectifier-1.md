# rectifier-1: applet_gleichrichter_1.html

| | |
|---|---|
| Task | `rectifier-1` (wave 1, 50ohm applets) |
| Catalogue entry | `50ohm-rectifier-1` in `docs/catalogue.md` §2.5 |
| Kind | adopt an existing simulator |
| Folder | `sims/rectifier-1/` |
| Class | decide on import (playbook §10.4) |
| Size | S |
| Priority | P3 |
| Courses | HAM |
| Topic / tags / level | `radio` / `circuits` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later; source material CC BY 4.0, attribution required |
| Depends on | wave 0 (foundation) merged |

## Goal

Bring the existing simulator into simdeck as `sims/rectifier-1/`: **half-wave rectifier**.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §2.5.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/html/applet_gleichrichter_1.html` (the original)

## Steps

1. Copy `/home/rjasmin/projects/50ohm-contents-hr/contents/html/applet_gleichrichter_1.html` into `sims/rectifier-1/` as `index.html`. Set `origin` to `50ohm-contents-hr/contents/html/applet_gleichrichter_1.html`.
2. **Attribution (CC BY 4.0) is mandatory**: credit "50ohm.de-Autorenteam, AJW-Referat des DARC e.V.", link the
   licence, and state that the applet was changed (adapted to simdeck, translated). Put it in the page footer in
   both languages and in `NOTES.md`. Check the applet has no separate author or licence of its own; if it does,
   stop and report.
3. Vendor any library the applet loads from `50ohm.de` (jQuery 3.7.1, Chart.js 4.4.1, three.js, Leaflet: all
   MIT/BSD) into the sim folder with their licence headers. The build refuses network loads.
4. Adapt to the kit: tokens, header, transport for its class, kit fonts.
5. It is in Croatian (translated from German); write English (COMMON.md §4). The German original is
   `/home/rjasmin/projects/50ohm-contents-dl/contents/html/applet_gleichrichter_1.html`.
6. Run the checks (COMMON.md §7).

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/rectifier-1/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
