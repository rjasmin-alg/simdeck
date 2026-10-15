<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-overlayfs-layers: notes

New stepper (task `docs/tasks/w2/lnx-overlayfs-layers.md`, catalogue §4.4, overlap §5.17), drawn on kit view **K3:
block grid** (`kit/blockgrid.js`, kit 0.6.0). Rules and expected numbers: `SPEC.md`.

## Decisions

- **One column per path.** The grid's columns are every path that appears in any frame of the preset, sorted component
  by component (rule 10), so a file sits in the same column in every layer and the lookup is a straight line down that
  column. Columns are fixed for the whole run, so nothing jumps between steps. The column header is the directory, the
  cell the file name and its size.
- **Rows, top to bottom:** what each container sees (the merged view, computed), each container's upper layer, then the
  image layers from the topmost to the base. Two containers: both "sees" rows first, then both upper rows, so the two
  views and the two uppers sit next to each other for comparison (rule 8). A layer the build has not made yet keeps its
  band with holes and "not there yet"; a container that does not exist (between build steps) keeps its band with "no
  container".
- **Cells.** Image layers: solid grey (`fill`, series 8) and a lock in the row label. Upper layer: white with an ink
  edge and a pencil in the row label; copied-up files get a double edge; a whiteout is K3's `dead` cell (grey, crossed,
  struck name) with `wh` under it; an opaque directory has a filled corner. Merged cells served from the image are
  hatched grey with the layer's name under them (`L1 1 KB`); served from the upper layer they look like the upper cell,
  with a pencil. A name that vanished from the view in this step stays one step as a struck, highlighted cell.
  "Changed" (yellow + ink outline) marks the upper or layer cells created or replaced and the merged cells that appeared,
  vanished or changed; the "sees" label is highlighted when its row changed.
- **Lookup:** a chain of K3 links down the path's column from the "sees" cell through each layer visited, the last one
  `now` (to the layer that answered) or `broken` (no such file). Empty slots are transparent, so the line shows through
  the layers that did not have the name. `ls` draws a bracket over the listed directory's columns instead.
- **Command line** above the grid: the container's prompt, the command, and what it printed (a read's size and layer,
  `ls` output, `No such file or directory`, "saved as L2").
- **Counter:** the upper layer's size per container (highlighted when it changed); the image's size as a note. In
  `build-rm` the counter is the image's size (highlighted when a layer is saved) and the build container's upper is the
  note.
- **Scripts, not free commands.** Each preset is a fixed script (task: "Steps are scripted per preset"); a hidden
  `scene` param (a `select`, `visible: false`) carries it, set by the presets. The scripts beyond the task's own
  commands (my choice, all within the concept): edit-config adds a second `cat` (now from upper), a second append (no
  second copy-up) and `chmod 640 /etc/os-release` (metadata change copies up); big-file reads, appends twice, then
  `rm` (the copy is dropped, a whiteout stays); delete creates `/tmp/new.txt` first, then `rm vi`, `cat vi`, `rm
  new.txt`, `cat new.txt`, `ls /usr/bin`; two-containers is read, read, write, read, read, write; build-rm splits each
  RUN into "runs in a temporary container" and "saved as a layer", then a container from the image; opaque is `ls`,
  `rm -rf`, `mkdir`, `ls`.
- **`container` param (A | B):** which container runs the edit in `two-containers`; the other one reads, then writes its
  own copy at the end. It keeps the step (no `resets`), so switching it mid-demo replays with the roles swapped. The task
  says "which container the next scripted command runs in"; with the kit's replay model a param cannot apply to "the
  next" command only, so it picks the editor for the whole script.
- **`rm -rf /app` is one step** that leaves one whiteout for `/app`: the kernel unlinks each entry (whiteouts inside a
  copied-up `/app`), then removing the directory replaces it with a single whiteout; the end state is the same and the
  intermediate one is not drawn.
- **Phases inside one step** (lookup, apply, recompute, mark) are narrated by the caption, not stepped one by one: the
  task's step counts (5, 4, 6, 6, 5, 4) are one step per command.
- **Sizes:** bytes in the model; the page writes B, KB or MB (1024-based), one decimal at most, with a decimal comma in
  Croatian. A size under 100 KB that is not a whole number of KB stays in bytes, so an appended line is not rounded
  away: the counter shows `3082 B` and the caption says "3 KB copied, 10 B appended: the upper layer now holds 3082 B".
  At 200 MB the 9 bytes do round away, which is the point of that preset ("appending 9 B cost 200 MB").
- **General helpers beyond the presets:** copy-up of a directory (`chmod` on it) copies a directory, not a file; `rm`
  inside an opaque directory leaves no whiteout (the lower name is already hidden); `mkdir` over a visible name changes
  nothing (`exists`); `ls` of a whited-out directory fails like the real one (`ls: cannot access …`), while parent
  directories the scenes leave implicit (`/usr/bin`) count as present when something is visible under them.
- **Model is promotable** (a later `lnx-container-volumes` or `lnx-cow-filesystem` may want it): `lookup`, `lookupIn`,
  `merged`, `list`, `apply`, `applyAll`, `commit` are pure functions over plain layer and upper maps, with no words.

## Deviations from the task

- **Legend:** the task's "read-only layer (solid grey band, lock icon)" and "writable upper (white band, pencil icon)"
  are drawn as cell fills (grey vs white with an ink edge) and a lock or pencil in the row label; K3 has no per-row
  band (shared request below). "File cell" has no legend entry of its own (every cell is a file); the lookup arrow is
  explained in the captions, not the legend, so the header legend fits on one line in English.
- **build-rm numbers:** the base layer is 1 MB + 1 KB, so the image is 151 MB after the install and stays 151 MB after
  the `rm` layer; the task says "image total stays ≈ 150 MB". The build adds 150 MB (gcc 1 MB + cc1 99 MB + the
  package cache 50 MB) and the container from the finished image sees 101 MB.
- **Two containers, lookup line:** in `two-containers` the line from one container's row down to the image passes the
  other container's rows (the row labels and the caption say whose lookup it is). Side-by-side stacks would need the
  image layers drawn twice, which would contradict rule 8, and K3 links cannot join two grids.

## Sources

- Linux kernel documentation "Overlay Filesystem" (`Documentation/filesystems/overlayfs.rst`): upper and lower,
  "Directories", "Non-directories" (copy-up, `metacopy=on` off by default), "whiteouts and opaque directories": from
  memory, not re-read online *(check)*.
- OCI Image Format Specification, "Image Layer Filesystem Changeset": `.wh.<name>`, `.wh..wh..opq`: from memory
  *(check)*.
- Container storage documentation on the overlay driver (image layers as shared lowers, one upper per container): from
  memory *(check)*.
- NLA `meta/toc.md` T11–T13 (kontejner, slike, slojevi, `Containerfile`); UL ch02 „slika sustava" (the glossary's
  `image`), ch11 „datotečni sustav". The NLA container chapters are not written yet.
- Numbers: derived and illustrative; printed by a script from the model before the page was written and asserted in
  `sim.test.js`.

## Concepts, not tools

No container engine is named. Commands appear where they are the subject (`cat`, `echo >>`, `chmod`, `rm`, `rm -rf`,
`mkdir`, `ls`, `RUN`). `dnf install -y gcc` and `/var/cache/dnf` are the task file's own example (preset 5); the
package manager is not otherwise named. `trusted.overlay.opaque=y` and `.wh.dnf` are the mechanism's own names.

## Checks

- `node --test sims/lnx-overlayfs-layers/sim.test.js`: 23 tests, tie-breaks first, one per rule, the presets' numbers,
  then the template's generic block.
- **Mutations:** 22 one-at-a-time mutations of `sim.js` with a script (plain string sort, earlier command wins, lookup
  bottom-up, a file above not hiding a directory below, a read copying up, copy-up of 0 bytes (per block), `rm` of a
  lower name without a whiteout, a whiteout for an upper-only name, `mkdir` over a whiteout making a plain directory,
  copy-up writing to the lower layer, a whiteout layer shrinking the image, a whiteout keeping the dropped size, `rm -rf`
  leaving upper entries, an opaque directory hiding upper's own entries, only the nearest ancestor checked for a
  whiteout or for opaque, `rm` not marking its cell, a commit keeping the build container or marking nothing, a
  directory copied up as a file, `rm` in an opaque directory leaving a whiteout, `ls` of a hidden directory listing
  nothing): all **22** fail a test.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page; checked every number;
  read all 82 captions in both languages and with `container=B` in a browser; ran 23 mutations of its own, 9 survived).
  Fixed from it: `ls /var/cache/dnf` in build-rm printed "(empty)" (now the real "cannot access" error, with the
  lookup line stopping at L3's whiteout); the latent helper bugs above (directory copy-up, `rm` under an opaque
  directory, `mkdir` over an existing name); sizes rounding away the appended bytes; a read from the upper layer said
  "from A" (now "from A's upper layer"); tests for the 9 survivors; Croatian: `[[image]]` in the explanation (genitive
  after „kopija", and the glossary's „slika sustava" means an OS install image) replaced by „slika (*image*)"; „postaje
  neprozirni" → *opaque directory* (neprozirni direktorij); *whiteout* introduced at its first mention in the opaque and
  build-rm presets; „S njom nestaje" → „Pritom nestaje"; „Datoteku {hidden} skriva…"; „(`.wh.dnf` u arhivi sloja)";
  „Potraga" → „Traženje"; „`ls` … ne ispisuje ništa"; the `container` hint and the "copies up its own copy" caption
  reworded in both languages; "not one copy of the image" → "not a separate copy". Left as they are: `dnf`, `gcc` and
  `/var/cache/dnf` (the task file's own example; the reviewer flags them under "Concepts, not tools", the
  coordinator's call), and "L3 holds only a whiteout, no file data" (the layer archive also carries the parent
  directory entries, which this sim does not draw).
- `npm run gate -- lnx-overlayfs-layers`: pass (manifest, tests, build, 62 browser checks, tokens, scope). Screenshots
  at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed; plus every preset at its key steps with a
  local Playwright script. Fixed from them: the hidden params showing (kit CSS, below), two-containers' six rows
  overflowing the stage (smaller cells and gaps for six rows, the lookup legend item dropped so the header stays one
  line), the merged cell's layer name running into its size, a three-line caption in big-file, merged cells not marked
  when a build container first appears, cell text overflowing on the phone.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| layer | sloj (NLA T12) |
| upper layer / lower layer | gornji sloj / donji sloj *(check)* |
| container | kontejner (NLA T11) |
| read-only | samo za čitanje |
| copy-up | kopiranje naviše *(check: no book term; the task's caption)* |
| whiteout | oznaka brisanja *(check: no book term; the task's caption)* |
| opaque directory | neprozirni direktorij *(check)* |

From the glossary: `file system`, `directory`. Not used: `image` (its Croatian is „slika sustava", UL ch02, an OS
install image); a container image is „slika" (NLA T12), written out as „slika (*image*)". Suggested glossary pair:
*container image* — slika kontejnera *(check)*.

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute, so a param whose `visible()` returns false still
  shows. Smallest change: `.sd-ctl[hidden] { display: none; }` in `kit.css`. Worked around in the page (as `amdahl` and
  `chirp-1` do).
- **K3 (`blockgrid.js`):** a per-cell style hook (a `cls`, or `mark: 'double'` and `mark: 'corner'`) for a double edge
  (copied up) and a filled corner (opaque directory). Worked around with `:has()` on a marker span inside the cell's
  text.
- **K3:** a per-row band style (a row background, or a `band: 'ro' | 'rw'`), for "read-only layer = grey band, writable
  layer = white band". Drawn as cell fills and label icons instead.

## Time

Start 2026-10-15 11:05, done 11:35 (CEST): about 30 minutes, one session, including the fresh review.
