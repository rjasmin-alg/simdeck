# lnx-container-volumes: Where container data is lost

| | |
|---|---|
| Task | `lnx-container-volumes` (wave 3, Linux) |
| Catalogue entry | `lnx-container-volumes` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-container-volumes/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `containers` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-overlayfs-layers` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **container layer vs volume vs bind mount on rm**.

The student: write data, recreate the container.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-overlayfs-layers/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, §3 Kontejneri, topic T15 ("Spremište kontejnera — trajni podaci, i gdje se gubi ono što se čini spremljenim"); chapters not written yet
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/11-diskovi-i-datotecni-sustavi.md` (montiranje, točka montiranja; a mount hides what was there, diagram `tocka-montiranja-zaklanja.svg` in `assets/diagrams/chapter-11/`)
- man pages podman-run(1) (`--volume` and longest-target rule 1, `--rm` rule 5, volume option `nocopy` rule 7), podman-stop(1) (rule 2), podman-rm(1) (`--volumes`, rules 3–4), podman-volume-prune(1) (rule 9), Containerfile(5) (`VOLUME`, rule 6); real storage paths `/var/lib/containers/storage/overlay/<id>/diff` and `.../volumes/<name>/_data`, rootless `~/.local/share/containers`
- Docker documentation "Volumes" (populate a volume, remove anonymous volumes; rules 3–5, 7), "Bind mounts" (rule 8), "Storage" overview (rule 1); docker container rm `--volumes` (rule 4 wording); Dockerfile reference `VOLUME` (rule 6)
- Catalogue seed: NLA T15

## Overlaps (catalogue §5)

- **§5.17 Containers:** Separate pages (each is one concept) on one container diagram.

## Model and presets

- **Scene:** the container diagram from `lnx-overlayfs-layers` (image layers + writable upper + merged view)
  with, beside it, the host disk showing three places: the container layer in the container engine's
  storage area (`<storage>/overlay/<id>/diff`), named and anonymous volumes in the same area
  (`<storage>/volumes/<name>/_data`), and a bind-mounted host directory (`/srv/site`). Mount points inside
  the container are drawn as "holes" in the merged view that lead to the host place. A timeline strip at
  the bottom: run → write → stop → start → rm → run again.
- **State:** `{ containers: [{ id, name, alive, running, upper: {path: content}, mounts: [{target, kind:
  'volume'|'anon'|'bind', source}] }], volumes: [{ name, anon, files, usedBy: [ids] }], hostDirs: { path:
  files }, image: { files, declaredVolumes: [paths] }, cmd, changed }`.
- **One step:** one lifecycle command of the container engine (`run`, a write inside, `stop`, `start`,
  `rm`, `rm -v`, `run --rm` exit, `volume prune`). Phases: (1) resolve which store a written path belongs
  to (longest mount target prefix wins, else container layer); (2) apply the command to containers and
  volumes; (3) redraw where every file now lives; (4) mark files that were lost or created.
- **Rules:**
  1. A write to a path under a mount target goes to that mount's source; the deepest (longest) matching
     target wins; otherwise it goes to the container's writable layer.
  2. `stop` keeps the container and its writable layer; `start` sees the same data.
  3. `rm` deletes the container and its writable layer. Named volumes and bind-mount sources survive.
  4. `rm -v` also removes the container's anonymous volumes ("remove anonymous volumes associated with the
     container"); named volumes still survive.
  5. `run --rm` removes the container and its anonymous volumes on exit, not named ones *(check wording
     across engines, Sources)*.
  6. An image `VOLUME /path` gives every new `run` without `-v` for that path a new anonymous volume, so a
     re-created container starts with an empty data directory while the old volume stays orphaned on disk.
  7. An empty named or anonymous volume mounted over an image path is first populated with the image's
     files at that path (unless the `nocopy` volume option is set); a bind mount is never populated and
     hides the image's files there. The hiding is the same "a mount hides what was there" rule as
     `lnx-mount-layers`.
  8. A bind mount shows host changes immediately in both directions.
  9. `volume prune` removes volumes no container (running or stopped) uses.
  10. Tie-break: two mounts on the same target are refused at `run` (error caption, no container created)
     *(check exact error)*.
- **Params:** `choice` `kind` = `layer` | `named` | `anon` | `bind` (where `/data` lives in the "your
  choice" preset, default `layer`); `toggle` `rmV` (use `rm -v`, default off), `resets: true` on both.
- **Presets:**
  1. `layer-lost` (default): `run --name db -d db`, write `/data/rows.db` (container layer), `stop`,
     `start` (still there), `rm db`, `run` again → `/data` empty. Rules 1–3. Derived.
  2. `named-survives`: `-v dbdata:/data`, write, `rm`, `run` with the same `-v` → data back; `volume ls`
     shows `dbdata`. Rules 3, 7. Derived.
  3. `anon-orphan`: image `db` declares `VOLUME /data`; `run` without `-v`, write, `rm`, `run` → empty;
     `volume ls` lists 2 volumes with hash names, the first holding the data. `prune` deletes it. Rules 6, 9.
     Derived.
  4. `bind-hides`: image `web` with `-v /srv/site:/var/www/html`: the image's `index.html` vanishes from the
     merged view; `echo hi > /srv/site/index.html` on the host appears inside at once; `rm` leaves
     `/srv/site`. Rules 7–8. Derived.
  5. `rm-flags`: one container with a named and an anonymous volume; `rm -v` → anonymous gone, named kept.
     Rule 4. Derived.
- **Steps:** layer-lost 7, named-survives 6, anon-orphan 8, bind-hides 6, rm-flags 4.
- **Legend:** container layer (white, dashed border: dies with the container), named volume (solid
  border, name tag), anonymous volume (solid border, hash tag), bind source (host-folder icon). Lost files
  are shown struck through for one step. "Changed" outlines files created, moved or lost in this step.
- **Captions:**
  - hr: "`rm` je obrisao kontejner i njegov sloj za pisanje; `rows.db` je bio ondje, pa ga više nema."
  - en: "rm deleted the container and its writable layer; rows.db lived there, so it is gone."
  - hr: "Slika ima `VOLUME`, pa je novi kontejner dobio novi anonimni *volume* (svezak); stari s podacima i dalje leži na disku."
  - en: "The image declares VOLUME, so the new container got a new anonymous volume; the old one with the data still sits on disk."
- **Terms:** container — kontejner; volume — svezak *(check: NLA has no term yet; "volumen" is LVM's
  logički volumen, avoid the clash)*; bind mount — vezano montiranje *(check)*; mount point — točka
  montiranja (UL ch11); writable layer — sloj za pisanje *(check)*; image — slika (NLA T12).
- **Misconceptions:** `stop` loses data (it doesn't; `rm` does); "I used a volume, so it persists" when the
  image's anonymous volume is re-created on every `run`; a bind mount adds files to the image path (it
  hides them).
- **Reuse:** from `lnx-overlayfs-layers` the layer stack, the merged-view computation and its drawing (copy
  with the §6 comment). New here: mounts, volumes, container lifecycle and the host-side store.
- **Out of scope:** tmpfs mounts, volume drivers/NFS volumes, SELinux `:z`/`:Z` relabelling (mention in the
  explanation, RHEL needs it), rootless storage paths (in the user's home), committing a container to an
  image.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-container-volumes sims/lnx-container-volumes` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-container-volumes/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
