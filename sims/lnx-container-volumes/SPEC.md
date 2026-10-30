<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-container-volumes: specification

One concept: **where a container's data lives, and what each lifecycle command keeps or deletes** (container layer vs
volume vs bind mount on `rm`). Task: `docs/tasks/w3/lnx-container-volumes.md`; catalogue §4.4, overlap §5.17.

## Model

- **Image:** read-only files (`{ path: { kind: 'file', text } }`) and `declaredVolumes` (the image's `VOLUME` paths).
- **Container:** `{ id, name, alive, running, autoRm, upper, mounts }`. `upper` is its writable layer (the overlay upper
  of `lnx-overlayfs-layers`); `mounts` is `[{ target, kind: 'volume' | 'anon' | 'bind', source }]`.
- **Volume:** `{ name, anon, files, at, usedBy }`, files keyed by the path inside the volume (`/rows.db`); `at` is the
  target it was first mounted on (where the page draws it); `usedBy` the alive containers (running or stopped) that
  mount it.
- **Host directories:** `{ '/srv/site': { '/index.html': … } }`.
- **What a container sees** (computed, never stored): the overlay stack (its layer over the image, the copied
  `lookupIn`/`mergedIn`), with every path under a mount target replaced by the mount's source.
- On the host disk: the layer is `<storage>/overlay/<id>/diff`, a volume `<storage>/volumes/<name>/_data`, a bind source
  its own path. `<storage>` is the engine's storage area (somewhere under `/var/lib/`; rootless in the user's home, out
  of scope). Simplification: the layer directory is named by the container id here; real engines give the layer its
  own storage id.

One step is one command. Phases: (1) resolve which store a path belongs to; (2) apply the command; (3) recompute who
uses each volume and what the container sees; (4) mark what was created or changed (`changed`) and what was deleted
(`lost`, drawn struck for that step), and the names that vanished from the container's view (`gone`).

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | A write to a path under a mount target goes to that mount's source; the **deepest (longest) target wins**; a path that is under no target goes to the container's writable layer. `/data/subway` is not under `/data/sub`. | podman-run(1) `--volume`; Docker "Storage" overview; checked on an engine (nested `-v outer:/data -v inner:/data/sub`: `/data/sub/f` in inner, `/data/g` in outer) |
| 2 | `stop` keeps the container and its layer; `start` runs the same container, which sees the same data. | podman-stop(1) |
| 3 | `rm` deletes the container and its writable layer; named volumes, anonymous volumes and host directories stay. `rm` refuses a running container; `rm -f` forcibly stops it first (one engine kills it, the other stops it with a timeout). | podman-rm(1); checked on an engine ("cannot remove container … container is running: stop the container before removing or force remove") |
| 4 | `rm -v` also deletes the container's anonymous volumes (when no other container uses them); named volumes stay. | podman-rm(1) `--volumes`; docker container rm `--volumes` "Remove anonymous volumes associated with the container"; checked on an engine |
| 5 | A `run --rm` container is deleted, with its anonymous volumes, when it exits; named volumes stay. Without `--rm` an exit only stops it. | podman-run(1) `--rm`; Docker "Volumes" (remove anonymous volumes); checked on an engine |
| 6 | Every image `VOLUME` path that no `-v` of this `run` names gets a **new** anonymous volume; a `-v` on that exact path replaces it. A recreated container therefore starts with only the image's copy, and the old volume stays on disk, used by no container. | Containerfile(5) `VOLUME`; Dockerfile reference `VOLUME`; checked on an engine |
| 7 | An **empty** volume (named or anonymous) mounted over an image path is first filled with the image's files under that path, unless the `nocopy` option is set; a volume that is not empty is not filled again. *(check)* One engine copies only on a volume's first mount (a "needs copy-up" flag), not on every mount while it is empty; the presets never mount an empty volume twice. A bind mount is never filled, and hides the image's files there (the same "a mount hides what was there" rule as `lnx-mount-layers`, UL ch11). | podman-run(1) volume option `nocopy`; Docker "Volumes" (populate a volume), "Bind mounts"; checked on an engine (named and VOLUME-made volumes got `schema.sql`; a bind showed an empty directory) |
| 8 | A bind mount shows changes at once in both directions: a host write is seen inside, a write inside is in the host directory. | Docker "Bind mounts"; checked on an engine |
| 9 | `volume prune` deletes every volume no container uses, running or stopped (the page adds: some engines delete unused *named* volumes only with `--all`). | podman-volume-prune(1). *(check)* One engine's prune deletes only anonymous volumes unless `--all`; the presets prune only anonymous ones, so both read the same here. |
| 10 | **Tie-break:** two mounts on the same target are refused at `run`: no container and no volume is made. | Checked on an engine: `Duplicate mount point: /data` (the other engine's wording is "…: duplicate mount destination" *(check)*). One engine had already made the first named volume before refusing; the model makes none (the documented outcome, "no container"). |

Also: a `run` with the name of an alive container (running or stopped) is refused; a write in a stopped container is
refused; a missing bind source is created (one engine does this for `-v`, the other refuses *(check)*; the presets make
the directory first). None of these is in a preset.

## Presets and expected numbers

All numbers are derived; the dump script (in the thread's scratchpad) printed every frame before the page was written,
and `sim.test.js` asserts them. Image `db`: `/etc/db.conf`, `/data/schema.sql`. Container ids `3f2a`, then `9c41`;
anonymous volumes `a91c3e…`, then `7d20b5…`.

1. **`layer-lost`** (default), 7 steps: `run --name db -d db` → `echo "row 1" > /data/rows.db` (layer 3f2a) → `stop`
   (layer kept) → `start` (rows.db still there) → `rm -f db` (rm refuses a running container; the layer and rows.db
   are lost) → `run` (container 9c41, empty layer) → `cat /data/rows.db` (No such file). Rules 1–3.
   Param `kind` (where `/data` lives): `named` (`-v dbdata:/data`: populated with schema.sql, cat reads `row 1` from
   dbdata), `anon` (`-v /data`: a91c3e… then 7d20b5…, cat finds nothing, 2 volumes on disk; with `rmV` 1),
   `bind` (`-v /srv/db:/data`: schema.sql hidden, cat reads `row 1` from /srv/db). Always 7 steps.
2. **`named-survives`**, 6 steps: `run -v dbdata:/data` (dbdata made, filled with schema.sql) → write (into dbdata) →
   `stop` → `rm` (dbdata kept, used by no container) → `run -v dbdata:/data` (not filled again; rows.db and schema.sql
   back) → `volume ls` (dbdata). Rules 1, 3, 7.
3. **`anon-orphan`**, 8 steps, image `db` with `VOLUME /data`: `run` (a91c3e…, filled) → write (into a91c3e…) → `stop` →
   `rm` (a91c3e… kept, orphaned) → `run` (new 7d20b5…, filled) → `ls /data` (schema.sql only) → `volume ls` (2: a91c3e…
   unused with rows.db, 7d20b5… used) → `volume prune` (a91c3e… and its 2 files deleted; 1 volume left). Rules 6, 9.
   With `rmV`: `rm -v` deletes a91c3e…, `volume ls` lists 1, prune deletes nothing.
4. **`bind-hides`**, 6 steps, image `web` (`/etc/web.conf`, `/var/www/html/index.html`), `/srv/site` empty: `run -v
   /srv/site:/var/www/html` (index.html vanishes from the view; the image still has it) → `ls /var/www/html` (empty) →
   host `echo "hi" > /srv/site/index.html` (seen inside at once) → inside `echo "bye" >> index.html` (the host file is
   `hi⏎bye`) → `stop` → `rm` (/srv/site keeps index.html). Rules 7, 8, 3.
5. **`rm-flags`**, 4 steps, image with `VOLUME /data`, set up by `run -v dblogs:/var/log/db` (dblogs and a91c3e…):
   write rows.db (a91c3e…) → write db.log (dblogs) → `stop` → `rm -v` (a91c3e… and rows.db, schema.sql deleted; dblogs
   kept with db.log). Rule 4. The preset turns `rmV` on; off, both volumes stay.

Rule 5 (`run --rm`), rule 10 (duplicate target), rule 1's deepest-target tie-break and `nocopy` have no preset (the task
lists none); they are model rules with tests, and the explanation states them.

## Params

`scene` (hidden select, set by the presets); `kind` = `layer` | `named` | `anon` | `bind` (shown in `layer-lost` only,
default `layer`); `rmV` toggle (every `rm` becomes `rm -v`, default off; on in `rm-flags`). Both reset to step 0.

## Steps

7, 6, 8, 6, 4 (task: 7, 6, 8, 6, 4). `sim.json` `steps` is the default's, 7.
