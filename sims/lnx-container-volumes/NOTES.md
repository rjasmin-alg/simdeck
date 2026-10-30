<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-container-volumes: notes

New stepper (task `docs/tasks/w3/lnx-container-volumes.md`, catalogue §4.4, overlap §5.17), drawn on kit view **K3:
block grid** (`kit/blockgrid.js`), one column per path, like `lnx-overlayfs-layers`. Rules and expected numbers:
`SPEC.md`.

## Decisions

- **One grid, the host's places as rows.** The task's scene has the container diagram with "beside it, the host disk
  showing three places". K3 links cannot join two grids, and the point of every step is the line from a path in the
  container to the place it lands in, so the places are rows of the same grid, top to bottom: what the container sees,
  host directories, volumes, the container's writable layer, the image. Each place's host path is the row's aside
  (`<storage>/overlay/3f2a/diff`, `<storage>/volumes/dbdata/_data`, `/srv/site`), so "where on the disk" is still read
  at a glance. Mount sources sit above the layer and the image, so a volume's cells cover the columns of its target:
  the "mount hides what was there" picture of `lnx-mount-layers`.
- **Mount points as holes:** a bracket over the mount target's columns in the "sees" row (`/data = dbdata`), and the
  image's cells under it marked "hidden". The task's "holes in the merged view that lead to the host place" are the
  bracket plus this step's link from the cell down to the row it resolved to (writes, `cat`; for a host write the
  link goes up, from the host directory to what the container sees).
- **Cells:** image grey and solid, a lock in the row label; the writable layer white with a dashed ink edge (dies with
  the container), a pencil; volumes white with a solid edge, a drum, the name or the hash start (`a91c3e…`) in the
  label; host directories white with a solid edge and a thick top edge, a folder. What the container sees takes the
  look of its source, with the source under the name (`image`, `layer`, `dbdata`, `/srv/site`). Lost files are K3's
  `dead` cell (struck), with the changed mark, for the step that lost them; a name that vanished from the view (the
  bind hiding `index.html`) is struck in the "sees" row for one step. Rows keep their place for the whole run: a volume
  not made yet says "not there yet", a deleted one "deleted"; a removed container's layer stays one step with its lost
  files and "container removed".
- **The timeline strip** under the grid is the preset's script as chips (done, now, to do), with the setup command of
  `rm-flags` drawn as done.
- **`layer-lost` uses `rm -f`.** The task's script is run, write, stop, start, rm, run again (7 steps); after `start`
  the container runs, and `rm` refuses a running container (checked on an engine), so step 5 is `rm -f db` and its
  caption says so. Step 7 is `cat /data/rows.db`, which fails for the layer and an anonymous volume and reads `row 1`
  for a named volume or a bind.
- **`kind` param:** the task's "your choice" preset is `layer-lost` itself: `kind` (layer, named, anon, bind) is shown
  there only and changes the `run` line (`-v dbdata:/data`, `-v /data`, `-v /srv/db:/data`). The other presets fix
  their own mounts. `rmV` turns every `rm` into `rm -v` in every preset; `rm-flags` turns it on.
- **The image has a file under `/data`** (`/data/schema.sql`), so rule 7's populate shows (named and anonymous volumes
  get a copy, a bind hides it). The task says the recreated container's `/data` is "empty"; here it holds only the
  image's `schema.sql`, which is the same point (`rows.db` is gone) and the captions say so.
- **`rm-flags` starts with the container running** (its `run` is a setup command, drawn as a done chip), so its 4 steps
  are write, write, stop, `rm -v`.
- **Commands without the engine's name:** `host # run --name db -d db`, `host # volume prune`, `db # cat …`. The
  explanation says why. `<storage>` is written literally; the grid's header explains it.
- **Simplifications:** the layer directory is named by the container id (real engines use a separate storage id; the
  explanation says `<id>` is the layer's id); the storage path is given only as "somewhere under `/var/lib/`", which
  fits both common engines.
- **Container ids and hashes** are fixed lists (`3f2a`, `9c41`; `a91c3e…`, `7d20b5…`), so the page is deterministic.
- **Model:** the path helpers and the overlay stack (`lookupIn`, `mergedIn`) are copied from
  `sims/lnx-overlayfs-layers/sim.js @ 1c1fd95` with the §6 comment; their tests are kept (one test here covers what this
  sim uses). New here: mounts, volumes, the lifecycle and the host's places, pure functions over plain data (`resolve`,
  `merged`, `apply`, `usersOf`), promotable.

## Deviations from the task

- The host disk is drawn as rows of the same grid with host paths as asides, not as a separate panel beside the
  container (above).
- `/data` after the re-run holds the image's `schema.sql` instead of being empty (above).
- `layer-lost` step 5 is `rm -f` (above).
- The legend has one entry for named and anonymous volumes ("volume, named or anonymous"); the row label tells them
  apart (name vs `anonymous a91c3e…`). Six entries fit one line at 1920×1080 in Croatian.
- Rules 5 (`run --rm`), 10 (duplicate target), 1's deepest-target tie-break and `nocopy` have no preset (the task's
  presets have none); they are in the model, the tests and the explanation.

## Sources

- Behaviour checked on a container engine on this machine (2026-10-30), in throwaway containers, volumes and images
  that were removed afterwards: a named volume and an image `VOLUME` volume are filled with the image's files; `-v` on
  the `VOLUME` path replaces the anonymous volume; nested targets (the deepest wins); a bind shows an empty directory
  (the image's file hidden), a host write is seen inside and a write inside on the host; `rm` of a running container is
  refused; `rm` keeps the anonymous volume; `rm -fv` deletes the anonymous one and keeps the named one; `run --rm`
  deletes its anonymous volume and keeps the named one; two `-v` on one target: `Duplicate mount point: /data`, no
  container (the engine had already made the first named volume; the model makes none). `volume prune` was not run (it
  would touch volumes that are not the test's).
- From memory, not re-read *(check)*: podman-run(1) (`--volume`, `--rm`, `nocopy`), podman-stop(1), podman-rm(1)
  (`--volumes`), podman-volume-prune(1), Containerfile(5) `VOLUME`; Docker documentation "Volumes", "Bind mounts",
  "Storage", the `rm --volumes` wording, the Dockerfile `VOLUME` reference. One engine's `volume prune` deletes only
  anonymous volumes unless `--all` *(check)*; the presets prune only anonymous ones. The other engine's duplicate-target
  error "…: duplicate mount destination" *(check)*.
- NLA `meta/toc.md` T15 (chapter not written yet); UL ch11 (montiranje, točka montiranja, „montiranje zaklanja").
- Numbers: derived; printed from the model by a script before the page was written, asserted in `sim.test.js`.

## Concepts, not tools

No container engine is named. Commands appear because the lifecycle commands are the subject; the engine's own name is
left off. The one behaviour that differs between the common engines on the page, `volume prune` and named volumes, is
stated in the prune caption and the explanation. SELinux `:z`/`:Z` and RHEL are named in the explanation's
out-of-scope line, as the task asks. Croatian says „sustav za kontejnere" for *container engine* *(check)*.

## Checks

- `node --test sims/lnx-container-volumes/sim.test.js`: 37 tests, tie-breaks first (duplicate target, deepest target,
  `-v` over `VOLUME`, a full volume not filled again), one per rule, the presets' numbers, the copied overlay helpers,
  then the template's generic block.
- **Mutations:** 22 one-at-a-time mutations of `sim.js` with a script (first mount wins, target as a string prefix,
  duplicate allowed, stop drops the layer, rm loses nothing, rm -v takes named volumes, rm without -v takes anonymous
  ones, exit without --rm removes, VOLUME makes nothing, -v does not replace VOLUME, a full volume filled again, a bind
  filled, nocopy ignored, prune takes used volumes, a stopped container not a user, a mount not hiding the image, rm of
  a running container allowed, -f ignored, every run reusing one anonymous volume, a write in a stopped container, a
  bind as a snapshot taken at run, changed marks leaking into the next step), plus 11 from the review's survivors
  (below): all **33** fail a test.
- `npm run gate -- lnx-container-volumes`: pass. Screenshots at 1920×1080 light, dark, grayscale and 375×812, hr and en,
  reviewed; plus every step of every preset and of each `kind` and `rmV` variant in both languages with a local
  Playwright script (no console errors), all captions read. Fixed from them: `stop`/`rm` printing the container's name
  after the command, the re-run caption saying the old anonymous volume "still sits on disk" after `rm -v` deleted it,
  `rm-flags` telling the named volume before the anonymous one, `stop` naming only one of two volumes, Croatian gender
  in the `cat` captions and an inflected *volume* in the `rm-flags` opening.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page; read every caption in both
  languages; ran 44 mutations of its own, 8 meaningful survivors). Fixed from it: a file hidden by a mount was drawn
  struck like a lost one (now dimmed with "hidden"); `volume prune` stated as the same in every engine (now the caption
  and explanation say some engines delete named volumes only with `--all`); the Croatian term rule in the explanation
  (*image* (slika), *writable layer* (sloj za pisanje)) and first mentions in captions (*writable layer*, `[[mount
  point]]`); „kontejnerski alat" → „sustav za kontejnere"; the engine-specific storage path; "-f stops it first" →
  "forcibly"; two-file lists ("rows.db and schema.sql", "its files (…) with it"); Croatian gender („Datoteka nije
  obrisana, nego zaklonjena"); "a mount point hides" → "the mount hides"; "tagged" → "random hex name"; `start`
  without mounts no longer says "the same mounts"; Croatian wording (preživljava, nestaje, „ispod točke montiranja",
  zapisuje, „putanje spremišta pri radu bez root ovlasti"); SPEC notes on copy-up per engine, a missing bind source,
  the layer id. Tests added for its survivors: prune of an anonymous volume of a stopped container and of an unused
  named one, rm -v and a volume another container uses, the name refusal, the nested mount in the view in both `-v`
  orders, populate by prefix, an existing empty volume filled, the host write's mark and append, `isNew`, `rm -f` of a
  stopped container. Left: later mentions of terms in Croatian captions are plain Croatian („svezak", „vezano
  montiranje"), as in `lnx-overlayfs-layers`; the coordinator may want the strict *English* form there.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| volume (container) | svezak *(check: NLA has no term; „volumen" is LVM's, avoided)* |
| bind mount | vezano montiranje *(check)* |
| writable layer | sloj za pisanje *(check)* |
| container | kontejner (NLA T11) |
| image (container) | slika (NLA T12) |
| anonymous / named volume | anonimni / imenovani svezak *(check)* |

From the glossary: `mount point` (točka montiranja, UL ch11). Not used: `image` (its Croatian is „slika sustava").

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats `[hidden]` (also noted by `lnx-overlayfs-layers`); worked around with
  `.sd-ctl[hidden] { display: none; }` in the page.
- **models/:** `lnx-overlayfs-layers`'s path helpers and overlay stack are now copied in two sims; promote them
  (`overlay.js`: `comparePaths`, `sortPaths`, `ancestors`, `under`, `baseName`, `dirName`, `lookupIn`, `mergedIn`) and
  point both sims at it.

## Time

Start 2026-10-30 18:04, done 18:34 (CET): about 30 minutes, one session, including the engine checks and the fresh review.
