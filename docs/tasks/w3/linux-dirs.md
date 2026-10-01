# linux-dirs: The Linux directory tree

| | |
|---|---|
| Task | `linux-dirs` (wave 3, Reference posters and classroom tools) |
| Catalogue entry | `ref-linux-dirs` in `docs/catalogue.md` §4.11 |
| Kind | build a new simulator |
| Folder | `sims/linux-dirs/` |
| Class | reference |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `filesystems` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **FHS: what lives where and why**.

The student: click directories.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.11.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/05-datoteke-staze-i-tekst.md` (Uvod u Linux), "Stablo datotečnog sustava i staze" → "Što treba znati" (the `ls -ld / /etc /home /tmp /usr /var` output and the five FHS descriptions; "podjela nije po temi nego po tome kako se sadržaj ponaša") and "Šire o temi" (`/usr` vs `/var`, `/var/log`, `/opt`, `/tmp` not preserved); footnotes `ch5-fhs-*` cite FHS 3.0 §3.7, 3.8, 3.13, 3.18, ch. 4, ch. 5, 5.10 and the Introduction.
- Its diagram `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-05/stablo-i-dvije-vrste-staza.svg` (tree from `/`, absolute vs relative path).
- Later chapters for the second ring: `08-procesi.md` (`/proc/[pid]/stat`), `11-diskovi-i-datotecni-sustavi.md` (`/boot`, `/boot/efi`, `/dev`, `/mnt`), `13-dnevnici-i-zapisi.md` (`/run/log/journal`, `/var/log/journal`, `/var/lib`), `18-mrezne-usluge.md` (`/srv`), `10-podizanje-i-systemd.md` (`/etc/systemd`, `/usr/local`).
- *Filesystem Hierarchy Standard* 3.0 (Linux Foundation, 2015).
- Catalogue seed: UL ch05

## Model and presets

- **Scene:** a reference poster of the directory tree from `/`: the six names of UL ch05's `ls -ld` output
  (`/`, `/etc`, `/home`, `/tmp`, `/usr`, `/var`) as large nodes, `/opt` and `/var/log` next to them (UL ch05 "Šire
  o temi"), and a second ring of names the later chapters use (`/boot`, `/dev`, `/proc`, `/run`, `/srv`, `/root`,
  `/mnt`, `/usr/bin`, `/usr/local`, `/var/lib`). Clicking a node opens a card: one line of what lives there, the
  behaviour badges, the FHS section, one example file the book uses (e.g. `/etc/fstab`) and the chapter where it
  appears. A behaviour filter lights the nodes of one kind.
- **State (reference, derived from params):** `{ filter: behaviour|null, selected: path|null, nodes: [{path,
  parent, behaviours: ['static'|'variable'|'shareable'|'host-specific'|'may-be-lost'|'per-user'|'virtual'], fhs,
  example, chapter, ring: 1|2}] }`.
- **Params drive live:** the filter dims nodes; selecting a node opens its card and highlights its path from `/`.
- **Rules (content rules):**
  1. The tree starts at `/`; every absolute path is read from there (UL ch05 "Stablo datotečnog sustava i staze").
  2. The split is by how content behaves, not by topic (UL ch05): `/usr` does not change and may be shared; `/var`
     changes while the system runs; `/tmp` may be lost (programs must not assume files survive between runs, FHS
     3.18); `/etc` describes this host and no other (FHS 3.7); `/home` belongs to people (FHS 3.8, site-specific).
  3. Whatever is written while the system runs goes to `/var`, not `/usr` (FHS ch. 5); logs go to `/var/log`
     (FHS 5.10). `/opt` is for add-on packages, outside `/usr` (FHS 3.13).
  4. Second-ring cards follow FHS 3.0: `/boot` static boot files (3.5), `/dev` device files (3.6), `/root` root's
     home (3.14), `/run` run-time data since boot, lost at reboot (3.15), `/srv` data served by this host (3.17),
     `/mnt` temporary mounts (3.12), `/usr/local` locally installed software (4.9 *(check)*), `/var/lib` state data (5.8 *(check)*);
     `/proc` a virtual file system of process and kernel information (FHS ch. 6 Linux annex *(check)*; UL ch08 `/proc/[pid]/stat`).
  5. The FHS leaves local layout to the site (FHS "Introduction"; UL ch05): a directory not on the poster is not
     an error.
- **Params:** `filter` choice none / static & shareable / variable / host-specific / may be lost / virtual
  (default none); `ring` choice book six / all (default all).
- **Presets (views):**
  1. `book-six` (UL ch05, the `ls -ld / /etc /home /tmp /usr /var` output on demosrv1): ring 1 only, each with
     its one-line FHS description.
  2. `behaviour` (UL ch05 "Pročitaju li se tih pet opisa zajedno"): five badges, one per directory: static
     (`/usr`), variable (`/var`), may be lost (`/tmp`), this host (`/etc`), people (`/home`).
  3. `where-are-logs`: `/var/log` (FHS 5.10) and `/run/log/journal` (volatile journal, UL ch13) lit together.
  4. `boot-and-disks`: `/boot`, `/boot/efi`, `/dev`, `/mnt` (UL ch11).
  5. `virtual`: `/proc` (UL ch08) and `/run`: not files on a disk.
- **Steps:** reference, none.
- **Legend:** directory node (folder shape), behaviour badges by icon and word (lock = static, pencil = variable,
  hourglass = may be lost, house = this host, person = people, cloud = virtual), FHS section number. "Changed" marks
  nodes lit by the last filter.
- **Captions** (footer per view):
  - hr: „Podjela nije po temi nego po ponašanju: `/usr` se ne mijenja, `/var` se mijenja dok sustav radi, `/tmp`
    se smije izgubiti, `/etc` opisuje baš ovo računalo, a `/home` pripada ljudima.“
  - en: "The split is by behaviour, not topic: `/usr` does not change, `/var` changes while the system runs, `/tmp`
    may be lost, `/etc` describes this one machine and `/home` belongs to people."
- **Terms** (UL ch05): directory — direktorij; root directory — korijenski direktorij; path (absolute / relative) —
  staza (apsolutna / relativna); home directory — domaći direktorij; configuration file — konfiguracijska datoteka;
  log file — dnevnička datoteka; Filesystem Hierarchy Standard — *Filesystem Hierarchy Standard* (FHS).
- **Misconceptions:** `/usr` means "user" files (it is shareable, read-only system software); anything can be kept in
  `/tmp` until reboot (rule 2); `/proc` takes disk space.
- **Out of scope:** mount points and file systems (UL ch11), permissions on these directories (UL ch07), the
  `/bin` → `/usr/bin` merge on current distributions (one line at most), container layouts.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh linux-dirs sims/linux-dirs` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/linux-dirs/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
