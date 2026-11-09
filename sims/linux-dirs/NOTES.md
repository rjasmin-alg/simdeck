<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# linux-dirs: notes

Task `docs/tasks/w3/linux-dirs.md` (catalogue `ref-linux-dirs`, §4.11). Rules, data and expected numbers: `SPEC.md`.

## What it is

A reference poster (class `reference`, no steps): the tree from `/` with 20 directories, 13 directly under `/`. The
six names of UL ch05's `ls -ld` output are the large nodes (ring 1); `/opt`, `/var/log` and the directories of later
chapters are ring 2. Clicking a node opens its card (one line of what lives there, behaviour badges, FHS section,
an example file from the book with its chapter, the chapter where the directory appears, the path read from `/`)
and draws its path from `/` in a thick accent line. A behaviour filter lights the nodes of one kind; five presets are
the task's five views.

## Decisions

- **Layout.** `/` above a bus, one column per directory under `/`, depth-2 directories hanging down the left side of
  their parent's column (like a file tree). Columns size to their content; the panel is narrowed to 18rem
  (`--panel-w`) so the thirteen columns have room: at 1920×1080 the widest state (English, behaviour view) needs
  about 1300 px of the 1473 px the tree gets. Below that, the card of the selected directory takes a fixed band
  (min 14rem) so the tree does not jump when a node is clicked. Phones: the tree becomes an indented list.
- **Hidden params** `view` (set by the presets) and `sel` (set by a click) carry the page state, so the URL keeps the
  view and the selection (`?sel=/var/log`). The kit's `.sd-ctl` display beats `[hidden]`; the page hides them with
  `.sd-ctl[hidden] { display: none }`, like `lnx-lvm-snapshot` and `lnx-cow-filesystem` (shared request below).
- **Filter beats view** (SPEC §4): a preset sets a view; choosing a filter by hand then shows the filter's set only.
  The `virtual` preset sets the `virtual` filter and the `virtual` view, both lighting `/proc`, `/run` and
  `/run/log/journal` (inside `/run`), so setting the filter back to none keeps the view's caption true.
- **Clicking a node keeps the active preset** (`sim.set(…, { preset: sim.preset })`), so `R` still returns to it.
- **Descriptions on the nodes** only in the book-six view under ring book; switched to all, twenty descriptions
  would not fit.
- **Static & shareable** needs both badges (UL ch05: "ne mijenja se i smije se dijeliti"), so `/etc` and `/boot`
  (static but host-specific in FHS ch. 2's table) are not lit by it.
- **Second badges** beyond the five primaries follow FHS ch. 2's two axes (its table: `/usr`, `/opt` shareable static;
  `/etc`, `/boot` unshareable static). Unshareable is shown as "this host". My own choices: `/dev` host-specific (it
  names this machine's devices, UL ch11), `/srv` host-specific ("data for services provided by this system"), `/tmp`
  also variable, `/mnt` no badge, `/home` and `/root` people only.
- **`/run/log/journal`** is drawn as one node under `/run` (its middle `log` is not on the poster); its name shows as
  `log/` over `journal`.
- **Examples** are files the book prints, chosen to name no product: `/var` → `/var/spool/mail/student` (ch20),
  `/var/lib` → `/var/lib/nfs` (ch07, a protocol), not the logging tools' state files of ch13. `/run`'s example is
  `/run/log/journal`, inside its child node; the test checks each example lies under its own node. No example where the book shows
  none: `/boot` (only a partition in `lsblk`), `/boot/efi`, `/opt`, `/root`, `/tmp`.
- **Book chapter** on the card: where the directory is used (`/var/log` is named in ch05, its example file is from
  ch13; both are shown).
- **Nodes not in FHS** (`/boot/efi`, `/run/log/journal`) say on their card that below this level the layout is the
  site's (rule 5). `locate()` (rule 5) is in the model and tested; the page has no free-text path input (it would be
  a second interaction for a poster), so rule 5 reaches the page through those cards and the explanation.
- **Commands and products.** None on the page: the book-six caption says "the book's first listing" rather than
  naming the command.
- **Misconceptions** from the task are card notes (`/usr`, `/tmp`, `/proc`) and one paragraph of the explanation,
  with the one line on `/bin` → `/usr/bin`. The `/usr` one is worded as "not where users' files live", not
  "usr does not mean user" (early Unix did keep home directories in `/usr`).
- **Unknown params** from a URL (`sel`, `filter`, `view`, also object keys such as `constructor`) are ignored: the
  model's tables are checked with own-property lookups.
- `aliases` include the paths students type when searching (`/etc`, `/var/log`, …). `related`: `lnx-log-path`,
  `lnx-boot-chain`, `lnx-mount-layers`.

## Deviations from the task

- Filter "static & shareable" is a strict both-badges filter (stated in SPEC, see above).
- The `virtual` view lights `/run/log/journal` (inside `/run`) besides `/proc` and `/run`.
- Legend: the six behaviour badges are drawn as a key strip at the top of the stage (icon and word each, the
  filter's badges marked), not in the header legend, which keeps folder, path, "lit" and FHS section. The task lists
  six badges; the model's vocabulary has seven (`shareable` too), so the key shows seven.

## Sources

- UL ch05 `05-datoteke-staze-i-tekst.md`, "Stablo datotečnog sustava i staze" (Što treba znati, Šire o temi) and its
  footnotes `ch5-fhs-*`; the example `/usr/bin/vi` and the `root` line of `/etc/passwd` (`/root`) from the same chapter.
- UL ch08 `/proc/[pid]/stat`; ch10 `/usr/local/sbin/arhiva.sh`; ch11 `lsblk` (`/boot`, `/boot/efi`), `/dev/vdb1`,
  `/mnt/vjezba`, `/etc/fstab`; ch13 `/run/log/journal`, `/var/log/journal`, `/var/lib/rsyslog`,
  `/var/lib/logrotate/logrotate.status`, `/var/log/messages`; ch18 `/srv/zajednicko`.
- *Filesystem Hierarchy Standard* 3.0 (Linux Foundation, 2015), read at specifications.freedesktop.org/fhs/latest/
  on 2026-11-09 for the section numbers: 3.5 `/boot`, 3.6 `/dev`, 3.12 `/mnt`, 3.14 `/root`, 3.15 `/run` ("Files under
  this directory must be cleared … at the beginning of the boot process"), 3.17 `/srv`, 4.4 `/usr/bin`, **4.9
  `/usr/local`**, **5.8 `/var/lib`**, **6.1.5 `/proc`** (the task's three *(check)* items, now checked). 3.5 does not
  mention `/boot/efi`. The refspecs.linuxfoundation.org copy refused automated reading; the freedesktop copy is
  labelled 3.0.
- FHS ch. 2 (shareable/unshareable, static/variable and its example table): from memory of the standard, not
  re-read this session *(check)*.

## Term pairs (not in `kit/glossary.js`; written out at first mention in the Croatian explanation, *English* (Croatian))

- root directory — korijenski direktorij (UL ch05)
- home directory — domaći direktorij (UL ch05)
- configuration file — konfiguracijska datoteka (UL ch05)
- log file — dnevnička datoteka (UL ch05)
- Filesystem Hierarchy Standard — *Filesystem Hierarchy Standard* (FHS), not translated (UL ch05)

Used from the glossary: `filesystem hierarchy`, `absolute pathname`, `directory`, `working directory`.

## Shared requests

- **kit:** `.sd-ctl[hidden] { display: none; }` in `kit.css`. A param with `visible: () => false` is still shown
  because `.sd-ctl { display: flex }` beats the `[hidden]` attribute; three sims now carry the same page rule.
- **kit:** a legend item with an icon (an SVG path) next to its swatch shapes would let the badge key live in the
  header legend.

## Checks

- `node --test sims/linux-dirs/sim.test.js`: 26 tests; each rule and tie-break broken once on purpose (16
  mutations of `sim.js`), each caught by its own test.
- **Fresh review** (a separate agent, no context from the build): read the code against SPEC.md and broke `sim.js`
  52 times. Every rule and tie-break was caught; the gaps were the chapter columns and the state's normalisation,
  now tested (each re-broken and caught). Its page and text findings are fixed: descriptions under ring all
  overflowing the tree, hr `d_etc` saying "executable" where FHS and the book say "binary", `note_run` with cause and
  effect reversed, `cap_host` contradicting `/srv`, a click dropping the active preset, the `virtual` view's empty lit
  set, the `/usr` misconception wording, the term pairs, product-named example files, `capBoot` stating demosrv1's
  partitions as a rule, `cardNoFhs` and `cap_static` overstating. Not changed: the hidden params' labels (never
  shown).
- `npm run gate -- linux-dirs`: passes (46/46 browser checks, no exceptions declared); screenshots reviewed at 1920×1080 light, dark,
  grayscale, help and panel hidden, and 375×812, in hr and en, plus the five presets and a selection.

## Time

Start 01:21, done 01:46 (2026-11-09, by the system clock): about 25 minutes, including the fresh review.
