<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# linux-dirs: the Linux directory tree (spec)

Task: `docs/tasks/w3/linux-dirs.md` (catalogue `ref-linux-dirs`, §4.11). Class **reference**: no steps; the page
is a poster of the tree from `/` with a filter, a ring choice, five views (presets) and a card per directory.

One concept: **FHS: what lives where and why.** The top of the tree is split by how the content behaves, not by
topic (UL ch05 "Stablo datotečnog sustava i staze", "Pročitaju li se tih pet opisa zajedno").

Sources: UL = *Uvod u Linux* (`~/projects/uvod-u-linux/book/chapters/`), FHS = *Filesystem Hierarchy Standard* 3.0
(Linux Foundation, 2015), read at specifications.freedesktop.org/fhs/latest/ on 2026-11-09 for the section numbers
that the task marked *(check)*.

## 1. Nodes (the data)

`ring` 1 = the six names of UL ch05's `ls -ld / /etc /home /tmp /usr /var`; ring 2 = everything else (`/opt` and
`/var/log` from UL ch05 "Šire o temi", the rest from later chapters). Poster order is alphabetical under each
parent, as `ls` lists them. The first behaviour is the node's **primary** one (the badge the `behaviour` view shows).

| path | parent | ring | behaviours (primary first) | FHS | UL ch. | example file in the book (ch.) |
|---|---|---|---|---|---|---|
| `/` | — | 1 | — | ch. 3 | 5 | `/etc/fstab` (5) |
| `/boot` | `/` | 2 | static, host-specific | 3.5 | 11 | — (a partition in `lsblk`) |
| `/boot/efi` | `/boot` | 2 | static, host-specific | — (not in FHS) | 11 | — |
| `/dev` | `/` | 2 | host-specific | 3.6 | 11 | `/dev/vdb1` (11) |
| `/etc` | `/` | 1 | host-specific, static | 3.7 | 5 | `/etc/fstab` (5) |
| `/home` | `/` | 1 | per-user | 3.8 | 5 | `/home/student` (5) |
| `/mnt` | `/` | 2 | — | 3.12 | 11 | `/mnt/vjezba` (11) |
| `/opt` | `/` | 2 | static, shareable | 3.13 | 5 | — |
| `/proc` | `/` | 2 | virtual | 6.1.5 | 8 | `/proc/[pid]/stat` (8) |
| `/root` | `/` | 2 | per-user | 3.14 | 5 | — (the `/etc/passwd` line of root) |
| `/run` | `/` | 2 | variable, may-be-lost, virtual | 3.15 | 13 | `/run/log/journal` (13) |
| `/run/log/journal` | `/run` | 2 | variable, may-be-lost, virtual | — (not in FHS) | 13 | — |
| `/srv` | `/` | 2 | host-specific | 3.17 | 18 | `/srv/zajednicko` (18) |
| `/tmp` | `/` | 1 | may-be-lost, variable | 3.18 | 5 | — |
| `/usr` | `/` | 1 | static, shareable | ch. 4 | 5 | `/usr/share/doc` (5) |
| `/usr/bin` | `/usr` | 2 | static, shareable | 4.4 | 5 | `/usr/bin/vi` (5) |
| `/usr/local` | `/usr` | 2 | static, shareable | 4.9 | 10 | `/usr/local/sbin/arhiva.sh` (10) |
| `/var` | `/` | 1 | variable | ch. 5 | 5 | `/var/spool/mail/student` (20) |
| `/var/lib` | `/var` | 2 | variable | 5.8 | 13 | `/var/lib/nfs` (7) |
| `/var/log` | `/var` | 2 | variable | 5.10 | 5 | `/var/log/messages` (13) |

20 nodes: 6 in ring 1, 14 in ring 2; 13 directly under `/`, 6 at depth 2 (`/run/log/journal` is drawn as one node
under `/run`: its middle `log` is not on the poster).

Behaviour sources: the five primaries are UL ch05's reading of the five FHS descriptions. The second badges follow
FHS ch. 2's two axes (shareable/unshareable, static/variable; its example table puts `/usr` and `/opt` in shareable
static and `/etc` and `/boot` in unshareable static); "unshareable" is shown as **host-specific** ("this host").
`/run` is variable and lost at reboot ("Files under this directory must be cleared … at the beginning of the boot
process", FHS 3.15.1) and is not on a disk (UL ch13: the volatile journal). `/proc` is the virtual file system of
process and kernel information (FHS 6.1.5; UL ch08 "pseudo-datotečni sustav"). Choices of mine, in NOTES.md:
`/dev` host-specific (it names this machine's devices, UL ch11), `/srv` host-specific ("data for services provided
by this system", FHS 3.17 title), `/tmp` also variable, `/mnt` none.

## 2. Rules

1. **The tree starts at `/`** (UL ch05). Every absolute path is read from `/`, one name at a time: the path to a
   node is the chain of its ancestors from `/` (`pathTo('/usr/local')` = `['/', '/usr', '/usr/local']`). A relative
   path (no leading `/`) is not read from the tree: `locate('fstab')` is `null`.
2. **The split is by behaviour, not topic** (UL ch05): `/usr` static and shareable, `/var` variable, `/tmp` may be
   lost (FHS 3.18), `/etc` this host only (FHS 3.7), `/home` people (FHS 3.8). These are the five primaries.
3. **Written while the system runs → `/var`, not `/usr`** (FHS ch. 5); logs → `/var/log` (FHS 5.10); add-on packages →
   `/opt`, outside `/usr` (FHS 3.13). In the model: no node under `/usr` is variable; every node under `/var` is
   variable; `/opt`'s parent is `/`.
4. **Second-ring cards follow FHS 3.0** with the sections of the table above. Checked: `/usr/local` 4.9, `/var/lib`
   5.8, `/proc` 6.1.5 (the task's *(check)* items). `/boot/efi` and `/run/log/journal` are not named by FHS 3.0.
5. **Local layout is the site's** (FHS "Introduction"; UL ch05 "Šire o temi"). A directory not on the poster is not
   an error: `locate(path)` returns the deepest poster node that holds it, with `onPoster: false`
   (`/etc/systemd/system` → `/etc`). Nodes whose FHS section is empty say so on their card (rule 5).

## 3. Params, filter and views

- `filter`: `none` | `static-shareable` | `variable` | `host-specific` | `may-be-lost` | `virtual` (default `none`).
  `static-shareable` needs **both** badges (UL: "ne mijenja se i smije se dijeliti"); every other filter needs its
  one badge.
- `ring`: `book` (ring 1 only) | `all` (default `all`). Hidden nodes are neither lit nor selectable.
- `view` (hidden, set by the presets): `none` | `book-six` | `behaviour` | `where-are-logs` | `boot-and-disks` | `virtual`.
- `sel` (hidden, set by clicking a node): a poster path or `''`.

Expected lit sets (ring `all`), in poster order:

| filter | lit | n |
|---|---|---|
| static-shareable | `/opt`, `/usr`, `/usr/bin`, `/usr/local` | 4 |
| variable | `/run`, `/run/log/journal`, `/tmp`, `/var`, `/var/lib`, `/var/log` | 6 |
| host-specific | `/boot`, `/boot/efi`, `/dev`, `/etc`, `/srv` | 5 |
| may-be-lost | `/run`, `/run/log/journal`, `/tmp` | 3 |
| virtual | `/proc`, `/run`, `/run/log/journal` | 3 |

With ring `book`: static-shareable → `/usr`; variable → `/tmp`, `/var`; host-specific → `/etc`; may-be-lost → `/tmp`;
virtual → none (0, and the caption says so).

Views (presets):

| preset | params | lit |
|---|---|---|
| `book-six` | ring book, view book-six | none; each of the six shows its one-line FHS description (only under ring book: switched to all, the descriptions go) |
| `behaviour` | ring all, view behaviour | `/etc`, `/home`, `/tmp`, `/usr`, `/var`, each with its primary badge in words |
| `where-are-logs` | ring all, view where-are-logs | `/run/log/journal`, `/var/log` |
| `boot-and-disks` | ring all, view boot-and-disks | `/boot`, `/boot/efi`, `/dev`, `/mnt` |
| `virtual` | ring all, filter virtual, view virtual | `/proc`, `/run`, `/run/log/journal` (the filter's set, and the view's own set too, so it stays lit with the filter set back to none) |

## 4. Tie-breaks

- **Filter beats view.** A filter other than `none` decides the lit set; a view's own set counts only under
  `filter: none` (so changing the filter by hand after a preset shows the filter's nodes, not a mix).
- **Hidden beats lit and selected.** Under ring `book`, a lit or selected ring-2 node is dropped: the lit set keeps
  only visible nodes, and a selected hidden node leaves no selection (`selected: null`, empty path).
- **Unknown `sel`, `filter`, `view` or `ring`** (a stale or hand-edited URL, also `constructor` and other object keys) is no
  selection, no filter, no view and ring `all`: never an error. The state names them `null`, `null`, `null`, `all`.
- **Click on the selected node** deselects it (page).
- **`locate` matches whole names**: `/usr2/x` is under `/`, not `/usr`; trailing and doubled slashes are ignored
  (`/usr//local/` → `/usr/local`, on the poster).
- Lists are always in poster order (the order of the table in §1).

## 5. Out of scope

Mount points and file systems (UL ch11), permissions on these directories (UL ch07), container layouts. The
`/bin` → `/usr/bin` merge gets one line in the explanation.
