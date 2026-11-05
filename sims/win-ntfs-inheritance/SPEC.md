<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ntfs-inheritance — specification

One concept: **inherited vs explicit ACEs, disabling inheritance, move vs copy.** Class: stepper. Task:
`docs/tasks/w3/win-ntfs-inheritance.md`; catalogue `docs/catalogue.md` §4.5.7. Builds on `win-ntfs-share-effective`
(rights as atoms, levels R X W M F, the access check "the first ACE that mentions a right decides it").

Every rule and expected result below is checked by `sim.test.js`. *(check)* marks a vendor rule that could not be
confirmed against Microsoft's documentation in this session (no network access to it); `NOTES.md` lists them.

## 1. The world

**Tree** (left of the stage). Siblings are listed by name; a node's path is its parent's path plus its name.

| id | Path | Kind | Volume |
|---|---|---|---|
| `proj` | `D:\Projekti` | folder (top of the tree on D:) | D |
| `arh` | `D:\Projekti\Arhiva` | folder | D |
| `graf` | `D:\Projekti\Grafika` | folder | D |
| `kamp` | `D:\Projekti\Grafika\Kampanja2026` | folder | D |
| `logo` | `…\Kampanja2026\logo.psd` | file | D |
| `plakat` | `…\Kampanja2026\plakat.psd` | file | D |
| `earh` | `E:\Arhiva` | folder (top of the tree on E:) | E |

The two tops have no parent in the model: what `D:\` and `E:\` would pass down is left out (both tops would carry
it alike). `plakat.psd` is added to the task's scene so that copy and move can be compared on two files (§4).

**Users** and their groups (for the effective-access line only): ana — Zaposlenici, Grafičari; marko — Zaposlenici,
Arhivari; vanjski — Vanjski. The token is the user and these groups; no well-known groups (no ACE here names them).

**Explicit ACEs at the start** (every preset; a preset's setup adds to them, §5). "tsf" = this folder, subfolders and
files.

| On | Trustee | Type | Rights | Applies to |
|---|---|---|---|---|
| `proj` | Administrators | allow | Full Control | tsf |
| `proj` | Zaposlenici | allow | Read & execute | tsf |
| `arh` | Arhivari | allow | Modify | tsf |
| `plakat` | ana | allow | Full Control | this object |
| `earh` | Administrators | allow | Full Control | tsf |
| `earh` | Arhivari | allow | Modify | tsf |
| `earh` | Zaposlenici | allow | Read & execute | tsf |

**Rights** as in `win-ntfs-share-effective`: atoms `r x w d p`; Read = r, Read & execute = r x, Write = w, Modify =
r x w d, Full Control = all five. Chips R X W M F, each on when all its atoms are granted.

## 2. Rules

1. **Propagation** (Win32 "ACE Inheritance Rules"; Microsoft "How inheritance affects file and folder permissions"
   *(check title)*). An ACE whose "applies to" reaches children is copied to every child that inherits, marked
   inherited and with the folder it came from (`from`, the node that holds it as explicit or kept) and its level
   (`lvl`: 1 from the parent, 2 from the grandparent, …).
2. **Applies to** (Win32 "ACE Inheritance Rules"; flags OI object inherit, CI container inherit, IO inherit only):

   | On the folder | Flags | Effective on the folder | Child folder receives | Child file receives |
   |---|---|---|---|---|
   | this folder only | — | yes | — | — |
   | this folder, subfolders and files | OI CI | yes | OI CI (tsf) | this object |
   | subfolders and files only | OI CI IO | no | OI CI (tsf) | this object |
   | files only | OI IO | no | OI IO (files only) | this object |

   On a file every ACE applies to "this object". An ACE that is not effective on its object is shown in the table but
   skipped by the access check (mark "skip").
3. **DACL order** (Win32 "Order of ACEs in a DACL"): explicit deny, explicit allow, then the inherited ACEs **level by
   level, the parent's first, then the grandparent's**, and within a level deny before allow. ACEs of the same group
   keep the order they were written or inherited in (stable). The access check walks the DACL in that order; for each
   right the first ACE that matches a SID in the token and mentions it decides it (allow grants, deny refuses); a right
   no ACE mentions is refused (implicit deny). So an **explicit allow on the child beats an inherited deny**.
   **Tie-break** (task): two inherited ACEs from different ancestors: the nearer ancestor's come first, whatever their
   type. *Resolution of the task's wording:* the task lists "inherited deny, inherited allow" and the nearer-ancestor
   rule as a tie-break; Microsoft's order (points 3 and 4 of the page) makes the level the primary key and deny/allow
   the order *within* a level, and the preset `explicit-beats-inherited` needs exactly that (an inherited allow from
   the parent before an inherited deny from the grandparent). Implemented as Microsoft's order.
4. **Disabling inheritance** (Advanced Security Settings, "Disable inheritance" *(check wording on Server 2022)*)
   asks: **convert** the inherited ACEs into explicit ones (same rows, now explicit, so sorted as explicit ones: an
   inherited allow from a nearer folder that sat above a farther deny falls below it, the only case where the result
   changes; no preset reaches it *(check whether the dialog re-sorts)*) or **remove** them
   (only the explicit ACEs stay; here none, so the DACL is empty and nobody gets access). After that the object
   receives nothing from its parent; its children inherit from it as before. Param `disable`.
5. **Copy** (any volume) and **move to another volume**: the new object has no explicit ACEs and inherits from its new
   parent; its old inherited ACEs are gone. (A copy that keeps the security descriptor needs a tool that copies
   security; a plain copy in the file manager does not *(check)*.) Microsoft KB "How permissions are handled when you
   copy and move files and folders" *(check: still published)*.
6. **Move within the same volume**: the object keeps its explicit ACEs **and its inherited ACEs as they were**
   ("kept": still marked inherited, still naming the old folders and levels) and does not take the new parent's,
   until permissions are propagated again (rule 7). Same KB *(check: current file managers may re-inherit)*.
7. **Re-propagation** (from rule 1): a change to an object's ACEs or to its inheritance flag recomputes the inherited
   ACEs of that object and of every object below it that inherits; a kept set (rule 6) there is dropped and replaced
   by what the new parent passes down (on the changed object itself too: writing its ACL re-reads the parent
   *(check)*). A folder with inheritance disabled stops the walk: it and its subtree are left alone (its children inherit only
   its own ACEs, which did not change) *(check)*. A
   change elsewhere (a sibling, another branch) leaves a kept set alone.

**One step** = one operation of the preset's script, in order: validate (target exists and is a file, `notFile` otherwise;
the destination is a folder; a move needs another parent; no object of that name already there; otherwise the step is `rejected` and nothing
changes) → change the object's own ACEs or flags → recompute inherited ACEs over the whole tree (parents before
children, siblings by name) → sort each DACL (rule 3) → the effective access of the chosen user on the shown object.
Operations: `add` (an explicit ACE), `remove` (an explicit ACE by trustee), `disable` (rule 4, the `disable` param),
`copy`, `move` (rules 5–6; the destination's volume decides which), `select` (look at another object, nothing
changes). Every operation selects its object (the new copy for `copy`).

**"Changed"**: on the shown object, the DACL rows that are new, or whose order among the rows present in both steps
changed (re-sorted); a row only pushed down by a new row above it is not marked (rows are matched by trustee, type,
rights, applies to, source and level). In the tree, every object whose DACL changed. Steps that only select mark
nothing.

## 3. Params

| Param | Values | Default | Does |
|---|---|---|---|
| `user` | ana / marko / vanjski | per preset | whose effective access the readout and the tree badges show |
| `showFlags` | toggle | off | "applies to" in words, or as OI / CI / IO |
| `disable` | convert / remove | convert | the answer to rule 4's question (only `disable-convert` uses it) |
| `script` | preset id | `basic` | which script runs (hidden; set by the presets) |
| `pick` | node id or empty | empty | an object the student clicked in the tree: shown instead of the step's object (hidden) |

## 4. Presets and expected results

Levels below are the chosen user's effective access on the shown object, written as the largest levels held.

### `basic` — 3 steps, user ana, starts on `proj`

Step 0: `proj` has Administrators F, Zaposlenici X (explicit); ana: Read & execute.

| n | Operation | Shown | Expected |
|---|---|---|---|
| 1 | add on `proj`: Grafičari allow Modify tsf | `proj` | 3 explicit rows; ana Modify (via Grafičari) |
| 2 | select `kamp` | `kamp` | 0 explicit, 3 inherited from `proj` (lvl 2); ana Modify |
| 3 | select `logo` | `logo.psd` | 0 explicit, 3 inherited from `proj` (lvl 3); ana Modify. Caption: "logo.psd has no entries of its own…" |

### `explicit-beats-inherited` — 5 steps, user vanjski, starts on `proj`

Setup: `proj` + Vanjski allow Read & execute tsf. Step 0: vanjski Read & execute on `proj`.

| n | Operation | Shown | Expected |
|---|---|---|---|
| 1 | add on `proj`: Vanjski deny Write tsf | `proj` | the deny sorts to row 1 (re-sorted); vanjski Read & execute, Write refused by row 1 |
| 2 | select `kamp` | `kamp` | rows all inherited from `proj`, deny first; vanjski Read & execute, Write refused (inherited deny) |
| 3 | add on `kamp`: Vanjski allow Write tsf | `kamp` | explicit allow is row 1, before the inherited deny (row 2, beaten); vanjski Read & execute + Write |
| 4 | select `graf` | `graf` | only `proj`'s rows: vanjski Read & execute, Write refused (an allow below does not reach up) |
| 5 | select `logo` | `logo.psd` | row 1 allow Write from `kamp` (lvl 1), row 2 deny Write from `proj` (lvl 3, beaten): vanjski Read & execute + Write |

### `disable-convert` — 5 steps, user ana, starts on `kamp`

Setup: `proj` + Grafičari allow Modify tsf. Step 0: `kamp` inherits Administrators F, Zaposlenici X, Grafičari M from
`proj`; ana Modify.

| n | Operation | Shown | Expected (`disable` = convert) | (`disable` = remove) |
|---|---|---|---|---|
| 1 | disable inheritance on `kamp` | `kamp` | the same 3 rows, now explicit; ana Modify; `logo` now inherits them from `kamp` | 0 rows; ana nothing (implicit deny) |
| 2 | remove on `proj`: Grafičari | `proj` | 2 rows; ana Read & execute | same |
| 3 | select `graf` | `graf` | 2 inherited rows; ana Read & execute | same |
| 4 | select `kamp` | `kamp` | still 3 explicit rows: Grafičari M stayed; ana Modify | 0 rows; ana nothing |
| 5 | select `logo` | `logo.psd` | 3 rows inherited from `kamp` (lvl 1); ana Modify | 0 rows; ana nothing |

### `copy-vs-move` — 4 steps, user ana, starts on `plakat`

Setup: `graf` + Grafičari allow Modify tsf. Step 0: `plakat.psd` has ana F (explicit), Grafičari M (from `graf`, lvl 2),
Administrators F and Zaposlenici X (from `proj`, lvl 3); ana Full Control.

| n | Operation | Shown | Expected (ana; marko) |
|---|---|---|---|
| 1 | copy `plakat.psd` to `D:\Projekti\Arhiva` | the copy | no explicit row; Arhivari M (from `arh`), Administrators F, Zaposlenici X (from `proj`); ana Read & execute; marko Modify |
| 2 | move `logo.psd` to `D:\Projekti\Arhiva` (same volume) | `logo.psd` | kept: Grafičari M from `graf` (lvl 2), Administrators F, Zaposlenici X from `proj` (lvl 3); no Arhivari row; ana Modify; marko Read & execute |
| 3 | add on `arh`: Grafičari allow Read & execute tsf | `arh` | 2 explicit rows + 2 inherited; the kept set of `logo.psd` is replaced |
| 4 | select `logo` | `logo.psd` | Arhivari M, Grafičari X (from `arh`), Administrators F, Zaposlenici X (from `proj`); ana Read & execute; marko Modify |

### `cross-volume` — 3 steps, user ana, starts on `logo`

Setup: `graf` + Grafičari allow Modify tsf. Step 0: `logo.psd` inherits Grafičari M, Administrators F, Zaposlenici X;
ana Modify.

| n | Operation | Shown | Expected |
|---|---|---|---|
| 1 | move `logo.psd` to `E:\Arhiva` (another volume) | `logo.psd` | Administrators F, Arhivari M, Zaposlenici X, all from `earh` (lvl 1); ana Read & execute |
| 2 | move `plakat.psd` to `E:\Arhiva` | `plakat.psd` | its explicit ana F is gone too; the same 3 rows; ana Read & execute |
| 3 | add on `earh`: Grafičari allow Modify tsf | `earh` | 4 explicit rows; both files now inherit Grafičari M; ana Modify on both |

## 5. Tie-breaks and edge cases (tested first)

- Nearer ancestor first, across types: on `logo.psd` in `explicit-beats-inherited` step 5 the inherited allow (lvl 1)
  is above the inherited deny (lvl 3), and decides Write.
- Within one level, deny before allow, even when the allow was written first (step 1 of the same preset: the deny
  added last sorts first).
- Same group, same level: the order written (explicit) or inherited (stable sort).
- An inherit-only ACE ("subfolders and files only", "files only") is listed but skipped by the access check on the
  folder itself; a "files only" ACE reaches a subfolder as inherit-only and its files as effective.
- A kept set survives an unrelated change elsewhere and is dropped by a change on an ancestor (rule 7).
- A rejected operation (copy to a folder that already has that name, a move to the same folder, a missing target)
  changes nothing and says so.
