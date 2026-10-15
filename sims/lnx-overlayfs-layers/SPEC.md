<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-overlayfs-layers: spec

One concept: **read-only layers, a writable top, copy-up and whiteouts**. The student edits and deletes files
inside a container and watches where each change lands. Task: `docs/tasks/w2/lnx-overlayfs-layers.md`; catalogue
§4.4, overlap §5.17 (containers: separate pages on one container diagram). Drawn on kit view K3 (block grid).

## Sources

- Linux kernel documentation, *Overlay Filesystem* (`Documentation/filesystems/overlayfs.rst`): "Upper and Lower",
  "Directories", "Non-directories" (copy-up), "whiteouts and opaque directories". [K]
- OCI Image Format Specification, *Image Layer Filesystem Changeset*: whiteouts `.wh.<name>`, opaque `.wh..wh..opq`. [OCI]
- Container storage documentation, overlay driver: image layers as shared lower directories, one upper per
  container. [CS]
- NLA `meta/toc.md` T12 (slike, slojevi), T13 (gradnja slike, `Containerfile`); UL ch02 „slika sustava", ch11
  „datotečni sustav". Terms only; those chapters are not written yet.
- Derived: every number below is illustrative and checked by `sim.test.js`.

## Model

State (plain JSON): `{ scene, phase, layers: [{ id, ro: true, files }], containers: [{ id, upper }], cmd, result,
lookup, changed, bytesUpper, imageBytes }`. `files` and `upper` map a path to `{ size, kind, copied?, mode? }`, kind
`file` | `dir` | `whiteout` | `opaque`. The merged view (what `ls` in a container shows) is computed, never stored.
`layers` are listed base first (`L1`, `L2`, `L3`); the stack is read top-down: the container's upper, then `L3`, `L2`,
`L1`.

One step is one command in one container. Inside the step: (1) look the path up through the stack; (2) apply copy-up,
whiteout or a plain write; (3) recompute the merged view and the upper layer's size; (4) mark the changed cells.

## Rules

1. **Lookup is top-down** [K "Upper and Lower"]: upper, then the image layers from the topmost to the base; the first
   layer that has the name wins. `lookup` returns the rows visited and the hit (`sim.test.js` "rule 1").
2. **Directories merge, non-directories hide** [K "Directories"]: a directory present in several layers lists the
   union of their entries; a file (or whiteout) in a higher layer hides every entry of that name, and everything
   under it, below. Preset `opaque` step 1: `ls /app` lists 3 entries, 2 from `L1` and 1 from `L2`.
3. **Reads are served from the layer that holds the file** [K]: nothing is copied; the upper layer keeps its size.
4. **Copy-up** [K "Non-directories"]: the first open for write, or a metadata change (`chmod`, `chown`, `touch`), on a
   lower file copies the **whole** file into upper, then changes it there. Per file, not per block. A later write to
   the same file is a plain write to upper (no second copy). Metadata-only copy-up (`metacopy=on`) is off by default
   and out of scope.
5. **Deleting a lower name leaves a whiteout** [K "whiteouts"]: upper gets a whiteout (a character device 0/0, 0 B);
   the merged view hides the name; the lower layer is unchanged. If upper held a copied-up version, that copy is
   dropped and the whiteout takes its place.
6. **Deleting an upper-only name just removes it**: nothing below to hide, so no whiteout.
7. **Opaque directory** [K "opaque directories"]: removing a lower directory and creating it again makes an opaque
   directory in upper (xattr `trusted.overlay.opaque=y`): the lower entries under it stay hidden. `mkdir` over a
   whiteout replaces the whiteout with the opaque directory; `mkdir` with nothing below makes a plain directory.
8. **Lower layers are never written** [CS]: two containers on one image share them, each has its own upper, and a
   change in one is invisible in the other.
9. **Image build** [OCI; NLA T13]: each filesystem-changing `RUN` runs in a temporary container and its upper is saved
   as a new read-only layer; an `rm` of a lower file in a later `RUN` saves a layer that holds only a whiteout
   (`.wh.<name>` in the layer archive), so the image does not shrink.
10. **Tie-breaks**: within a layer, cells are sorted by path, component by component (`/app` before `/app/main.py`
    before `/etc/...`); two commands on the same path in one step apply in order and the later one wins (not
    possible in the scripted presets; `applyAll` and its test).

Sizes are bytes; KB = 1024 B, MB = 1024 KB. An appended line counts its characters plus the newline.

## Presets and expected numbers

| # | Preset | Steps | Script (container) | Expected |
|---|---|---|---|---|
| 1 | `edit-config` (default) | 5 | L1 `/etc/os-release` 1 KB, `/etc/web/server.conf` 3 KB; L2 `/var/www/html/index.html` 1 KB. A: `cat server.conf`; `echo "workers 2" >> server.conf`; `cat server.conf`; `echo "keepalive on" >> server.conf`; `chmod 640 /etc/os-release` | upper 0 → 3082 B (3072 copied + 10) → 3082 → 3095 (+13, no copy) → 4119 (+1024 copied by chmod). L1 always 4 KB, image 5 KB |
| 2 | `big-file` | 4 | L1 `/etc/os-release` 1 KB, `/usr/bin/app` 5 MB; L2 `/var/log/app.log` 200 MB. A: `tail -n 1 app.log`; `echo "job done" >> app.log` twice; `rm app.log` | upper 0 → 209 715 209 B (200 MB + 9) → 209 715 218 → 0 (copy dropped, whiteout 0 B). Image 205 MB + 1 KB throughout |
| 3 | `delete` | 6 | L1 `/etc/os-release` 1 KB, `/usr/bin/ls` 140 KB, `/usr/bin/vi` 1 MB. A: `echo "hi" > /tmp/new.txt`; `rm /usr/bin/vi`; `cat /usr/bin/vi`; `rm /tmp/new.txt`; `cat /tmp/new.txt`; `ls /usr/bin` | upper 3 B → 3 (+ whiteout `vi`) → 3 → 0 (whiteout stays, `new.txt` gone, no whiteout for it) → 0 → 0. `cat vi` stops at the whiteout; `cat new.txt` visits upper and L1 and finds nothing; `ls /usr/bin` lists `ls` only. L1 keeps 3 cells |
| 4 | `two-containers` | 6 | the `edit-config` image; containers A and B. The editor E is the `container` param (A by default), the other is O. E `cat index.html`; O `cat`; E `echo "<p>E</p>" >> index.html`; E `cat`; O `cat`; O `echo "<p>O</p>" >> index.html` | E's upper 0 → 1033 B (1024 + 9) after step 3; O's `cat` at step 5 is served from L2; O's upper 1033 B after step 6; L2 still 1 KB, one cell |
| 5 | `build-rm` | 5 | base L1 `/etc/os-release` 1 KB, `/usr/bin/sh` 1 MB. RUN `dnf install -y gcc` writes `/usr/bin/gcc` 1 MB, `/usr/libexec/gcc/cc1` 99 MB, `/var/cache/dnf/` and `/var/cache/dnf/metadata` 50 MB; saved as L2; RUN `rm -rf /var/cache/dnf` leaves a whiteout; saved as L3; a container from the image runs `ls /var/cache/dnf` | build upper 150 MB; image 1 MB + 1 KB → 151 MB + 1 KB → same after L3 (L3 is 0 B); the container sees 101 MB + 1 KB, the image stores 151 MB + 1 KB |
| 6 | `opaque` | 4 | L1 `/app/`, `/app/main.py` 4 KB, `/app/util.py` 2 KB; L2 `/app/`, `/app/config.ini` 1 KB. A: `ls /app`; `rm -rf /app`; `mkdir /app`; `ls /app` | 3 entries → whiteout `/app` hides 4 names → opaque `/app` (merged `/app` empty) → `ls` lists 0; L1 and L2 still 3 files |

Step 0 of every preset is the start: the image's layers and empty uppers (in `build-rm`, only the base layer).

The task's numbers for `build-rm` say "image total stays ≈ 150 MB": the base here is 1 MB, so the image is 151 MB
and the build adds 150 MB; the counter says both.

## Params

- `container` (`A` | `B`): who runs the editing commands in `two-containers`; shown only there. Changing it keeps the
  step and replays with the roles swapped.
- `showSizes` (default on): the size line under each cell and the layer totals. View only.
- `scene` (hidden): the script; set by the presets.

## Out of scope

`redirect_dir`, `metacopy`, `index`, rename of lower directories (EXDEV), inode numbers, fuse-overlayfs, other storage
drivers, volumes (`lnx-container-volumes`), registries and signing. Parent directories copied up together with a file
are not drawn (only the directories a preset needs: `/app`, `/var/cache/dnf`).
