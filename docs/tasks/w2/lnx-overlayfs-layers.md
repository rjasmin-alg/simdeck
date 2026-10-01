# lnx-overlayfs-layers: Image layers and copy-up

| | |
|---|---|
| Task | `lnx-overlayfs-layers` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-overlayfs-layers` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-overlayfs-layers/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `containers` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **read-only layers, a writable top, copy-up and whiteouts**.

The student: edit and delete files inside a container.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, §3 Kontejneri, topics T12 ("Slike i registri — slojevi, oznake…") and T13 ("Gradnja slike — Containerfile…"); chapters not written yet
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/02-distribucije.md` § "Kako doći do sustava za vježbu" (term "slika sustava"); `11-diskovi-i-datotecni-sustavi.md` (datotečni sustav, montiranje)
- Linux kernel documentation "Overlay Filesystem" (Documentation/filesystems/overlayfs.rst): upper and lower, "Directories", "Non-directories" (copy-up, `metacopy=on`), "whiteouts and opaque directories" (rules 1–7)
- OCI Image Format Specification, "Image Layer Filesystem Changeset" (whiteouts `.wh.`, opaque `.wh..wh..opq`; rule 9)
- Docker documentation "OverlayFS storage driver"; containers-storage.conf(5) (overlay driver; shared lower layers, rule 8)
- Catalogue seed: NLA T12–13 → §5.17

## Overlaps (catalogue §5)

- **§5.17 Containers:** Separate pages (each is one concept) on one container diagram.

## Model and presets

- **Scene:** a vertical stack of layers drawn as rows of file cells (block-grid look; kit view K3 when it
  exists): image layers L1 (base), L2, L3 read-only at the bottom, the container's writable upper layer on
  top, and the merged view (what `ls` in the container shows) above it. Each cell is one file with name and
  size. A second container on the same image can be shown as a second upper + merged column.
- **State:** `{ layers: [{ id, ro: true, files: { path: {size, kind: 'file'|'dir'|'whiteout'|'opaque'} } }],
  containers: [{ id, upper: { path: {...} } }], cmd, result, changed: [paths], bytesUpper }`. The merged view
  is computed, not stored.
- **One step:** one command in one container (`cat`, `echo >>`, `chmod`, `rm`, `rm -rf` + `mkdir`, or an
  image-build `RUN`). Phases: (1) lookup the path through the stack; (2) apply copy-up / whiteout / plain
  write; (3) recompute merged view and upper-layer size; (4) mark changed cells.
- **Rules:**
  1. Lookup goes top-down: upper, then lowers from the topmost image layer to the base; the first layer that
     has the name wins.
  2. Directories present in several layers are merged (union of entries); a non-directory in a higher layer
     hides everything with that name below.
  3. Reading a lower file is served from the lower layer; nothing is copied.
  4. The first open-for-write, or a metadata change (chmod, chown, touch), on a lower file copies the whole
     file up into upper, then modifies it there. Copy-up is per file, not per block: appending 1 line to a
     200 MB file puts 200 MB in upper (metadata-only copy-up is off by default and out of scope).
  5. Deleting a name that exists in a lower layer creates a whiteout in upper (a character device 0/0); the
     merged view hides the name; the lower layer is unchanged.
  6. Deleting a name that exists only in upper removes it; no whiteout is needed.
  7. Removing a lower directory and creating it again makes an opaque directory in upper: lower entries
     under it stay hidden (xattr `trusted.overlay.opaque=y`).
  8. Lower layers are never written; two containers on one image share them and each has its own upper, so
     a change in one is invisible in the other.
  9. Image build: each filesystem-changing `RUN`/`COPY` is a new read-only layer; `rm` in a later layer adds
     a whiteout (`.wh.<name>` in the layer tar), so the image does not shrink.
  10. Tie-breaks: within a layer, cells sorted by path; when two operations would hit the same path in one
     step (not possible in the scripted presets) the later command wins.
- **Params:** `choice` `container` = `A` | `B` (which container the next scripted command runs in, shown
  only in preset 4); `toggle` `showSizes` (default on). Steps are scripted per preset.
- **Presets:**
  1. `edit-config` (default): image `web`, L1 `/etc/os-release` 1 KB, `/etc/web/server.conf` 3 KB, L2
     `/var/www/html/index.html` 1 KB. `cat server.conf` (no copy), `echo "workers 2" >> server.conf` →
     copy-up 3 KB into upper; merged shows upper's version; L1 unchanged. Derived.
  2. `big-file`: L2 holds `/var/log/app.log` 200 MB; append one line → upper grows by 200 MB (rule 4).
     Derived.
  3. `delete`: `rm /usr/bin/vi` (in L1) → whiteout in upper; merged hides it; L1 still 1 cell; `rm
     /tmp/new.txt` created earlier in upper → just removed (rules 5–6). Derived.
  4. `two-containers`: A and B on the same image; A edits `index.html` → copy-up in A's upper; B's `cat`
     still returns L2's original (rule 8). Derived.
  5. `build-rm`: `RUN dnf install -y gcc` adds L2 (≈ 150 MB, illustrative), `RUN rm -rf /var/cache/dnf`
     adds L3 with whiteouts only; image total stays ≈ 150 MB, not less (rule 9). Derived, numbers illustrative.
  6. `opaque`: `rm -rf /app && mkdir /app` over a lower `/app` with 3 files → opaque `/app` in upper, merged
     `/app` empty (rule 7). Derived.
- **Steps:** edit-config 5, big-file 4, delete 6, two-containers 6, build-rm 5, opaque 4.
- **Legend:** read-only layer (solid grey band, lock icon), writable upper (white band, pencil icon), file
  cell, copied-up cell (double border), whiteout (crossed cell, "wh" label), opaque dir (filled corner).
  "Changed" outlines cells created or hidden in this step and the merged-view row that changed.
- **Captions:**
  - hr: "Prvo pisanje u `server.conf` kopira cijelu datoteku u gornji sloj (*copy-up*, kopiranje naviše); donji sloj slike ostaje netaknut."
  - en: "The first write to server.conf copies the whole file into the upper layer (copy-up); the image's lower layer is untouched."
  - hr: "`rm` ne briše ništa iz slike: u gornjem sloju nastaje *whiteout* (oznaka brisanja) koja skriva datoteku."
  - en: "rm deletes nothing from the image: a whiteout appears in the upper layer and hides the file."
- **Terms:** layer — sloj (NLA toc T12); image — slika (NLA T12; UL ch02 "slika sustava"); container —
  kontejner; read-only — samo za čitanje; copy-up — kopiranje naviše *(check: no book term)*; whiteout —
  oznaka brisanja *(check: no book term)*; file system — datotečni sustav (UL ch11).
- **Misconceptions:** deleting a file in a later layer shrinks the image; overlayfs stores block diffs (it
  copies whole files); a container's edit changes the image other containers use.
- **Out of scope:** `redirect_dir`, `metacopy`, `index`, rename of lower directories (EXDEV), inode number
  consistency, fuse-overlayfs, other storage drivers (btrfs, vfs), where volumes go (`lnx-container-volumes`),
  registries and signing (rest of T12).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-overlayfs-layers` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-overlayfs-layers sims/lnx-overlayfs-layers` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-overlayfs-layers/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
