<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-access-decision: spec

One concept: **owner → group → other, first match decides; the ACL mask.** A process asks for r, w or x on one file;
the classes are compared in a fixed order, the first one that describes the process decides, and the mask stands
between what a masked entry says and what applies. Task: `docs/tasks/w3/lnx-access-decision.md`. Class: stepper.

## Sources

- **acl(5)**, Linux man-pages, "ACCESS CHECK ALGORITHM" (UL ch07 [24]); read on this machine (`man 5 acl`).
- **capabilities(7)**, Linux man-pages, `CAP_DAC_OVERRIDE`, `CAP_DAC_READ_SEARCH` (UL ch07 [9]). The exact x rule
  for a privileged process is the kernel's `generic_permission()` (fs/namei.c): "Read/write DACs are always
  overridable. Executable DACs are overridable when there is at least one exec bit set"; a directory is always
  overridable. Checked by the real run below.
- **UL ch07** (`uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`): "Kad tri skupine bitova nisu dovoljne"
  (`chmod 2770 /srv/projekt`, `ls -ld` → `drwxrws--- root projekt`, `student`'s `ls -l /srv/projekt: Permission
  denied` "pa mu ostaje treća skupina bitova, koja je prazna"; `getfacl proba` before and after
  `setfacl -m u:nobody:rw proba`, `ls -l` → `-rwxrw----+`; `getfacl /srv/projekt/druga.txt` with
  `group::rwx #effective:rw-`, `group:projekt:rwx #effective:rw-`, `mask::rw-`), Primjer 3 (path traversal: out of
  scope, mentioned in the explanation).
- **Real run** (2026-10-30, this machine: kernel 6.8.0, a throwaway `debian:trixie-slim` container, tmpfs, util-linux
  `setpriv` 2.41.5, the host's `setfacl`/`getfacl`): every scene × mask × user × want, 165 cases, asked twice — with
  `access()` (coreutils `test -r/-w/-x`) and with the real operation (`cat`, append, execute a script; `ls`, `cd` on
  the directory). Both answers and the `ls -l` string equal the model in all 165 cases; the table is pinned in
  `sim.test.js` (`RUN`).

## Model

`check(file, proc, want)` in `sim.js`, pure, plain data: `file = { kind, uid, gid, acl: [{ tag, uid?, gid?, perms }] }`,
`proc = { uid, gids }`, `want ∈ { r, w, x }`. Entry tags as in acl(5): `user_obj` (`user::`), `user` (`user:x:`),
`group_obj` (`group::`), `group` (`group:g:`), `mask` (`mask::`), `other` (`other::`).

### Rules

1. **Privilege first** (capabilities(7); task rule 1). EUID 0: r and w are granted; on a directory x (search) too;
   x on any other file only when the **mode** has at least one x bit, where the mode's group triplet is the mask
   when there is one. An x that only an ACL entry has, cut by the mask, does not count (real run: `druga.txt` with
   `group::rwx`, `mask::rw-` → root x denied; with `mask::rwx` → granted). *(The kernel runs the class check first and
   consults the capability only after a refusal; the verdict is the same, and the page asks the privilege first, as
   the task does and as UL ch07 says: "Povlašteni proces zaobilazi sve provjere dozvola".)*
2. **Owner.** EUID = the file's owner → `user::` decides, unmasked. **First match is final:** an owner with `---` is
   denied though group and other may read (acl(5) step 1, "else access is denied").
3. **Named user.** Else EUID = the qualifier of a `user:x:` entry → that entry AND the mask decides (step 2).
4. **Groups.** Else the process's effective or any supplementary group matches the owning group or a `group:g:`
   qualifier → granted when **any** matching entry AND the mask has the wanted bit, else denied; `other::` is **not**
   consulted (step 3).
5. **Other.** Else `other::` decides, unmasked (step 4). It matches every process, so step 5 ("else denied") is
   never reached.
6. **The mask** limits named users, `group::` and named groups, never `user::` or `other::`. With a mask, `ls -l`
   shows the mask in the group triplet, not `group::` (UL ch07: `-rwxrw----+` while `getfacl` says `group::---`),
   and a `+` after the nine letters.
7. **Without ACL entries** (no mask) the same order holds with three rows: `user::`, `group::`, `other::`.

### Tie-breaks

- **T1, several matching group entries are OR-ed**, not first of them: process in `ana` and `projekt`, ACL
  `group::---`, `group:projekt:r--`, `group:ana:-w-`, `mask::rwx` → w granted (by `group:ana`), r granted (by
  `group:projekt`), x denied.
- **T2, a matching class with no bit does not fall through**: the same process, x, with `other::rwx` → denied.
- **T3, first match is final for the owner**: `plan.txt` `----rw-rw-`, student (owner) r → denied; ana r → granted.
  And `druga.txt` with `mask::rwx`: ana (owner `rw-`, also in `projekt` with `rwx`) x → denied, marko x → granted.
- **T4, a named user beats the groups**: a process named in `user:x:---` that is also in a group with `rwx` → denied.
- **T5, the mask never limits owner or other**: `proba` with `mask::---` → student (owner) r, w, x granted; a file
  with `other::rwx` and `mask::---` → a process in no class r granted.
- **T6, root x needs an x in the mode**: `tajna` mode 000 → x denied, r and w granted; `druga.txt` `mask::rw-` →
  x denied (no x in `-rw-rw----`), `mask::rwx` → granted; a directory → x granted.

### State

`{ scene, proc: { user, uid, groups[], gids[] }, file: { path, kind, owner, uid, group, gid, setgid, mode, octal, acl,
extended, ls }, want, phase, privileged, cursor, cursorRows, rows[], matched, matchedRows, effective, maskUsed,
granting, verdict, reason, changed }`. `rows[i]` is `null` (not read), `'no'` or `'hit'`. `cursor` is the class
being compared (`owner`, `users`, `groups`, `other`) or `'mask'`. `effective` maps each matching row to its perms after
the mask. `reason`: the deciding class, or `privilege`, `privilege-dir`, `privilege-x`, `privilege-no-x`.

### Steps

Step 0 shows the scene. Step 1 identifies the process (EUID, groups; privileged or not). Then one step per class
compared, in the fixed order, empty classes left out, until one matches; then the mask step if the matched class is
masked and the file has a mask; then the verdict, and the demo stops (no later row is read). A privileged process:
identify, override, verdict.

## Params

| key | type | values | default | resets |
|---|---|---|---|---|
| `scene` | choice | `projekt`, `plan`, `proba`, `druga`, `tajna` | `projekt` | yes |
| `who` | choice | `student`, `ana`, `marko`, `nobody`, `root` | `student` | yes |
| `want` | choice | `r`, `w`, `x` | `r` | yes |
| `mask` | choice, only on `proba` and `druga` | `rwx`, `rw-`, `r--`, `---` | `rw-` (both files' own mask in UL ch07) | no: change it at the verdict and see the answer change |

Users: student 1000 (student); ana 1001 (ana, projekt); marko 1002 (marko, projekt) (derived); nobody 65534 (nobody);
root 0. Groups: projekt 2000.

## Presets (expected numbers; checked by the real run)

| # | id | scene, who, want | path through the classes | verdict | steps |
|---|---|---|---|---|---|
| 1 | `projekt-other` | `/srv/projekt` `drwxrws---` root:projekt, student, r | owner no, group no, other `---` | denied | 5 |
| 2 | `owner-locked` | `plan.txt` `----rw-rw-` student:projekt, student, r | owner `---` | denied | 3 |
| 3 | `named-user` | `proba` `-rwxrw----+`, nobody, w | owner no, `user:nobody:rw-` AND mask `rw-` = `rw-` | granted | 5 |
| 4 | `mask-clips` | `druga.txt` `-rw-rw----+` ana:projekt, marko, x | owner no, `group::rwx` and `group:projekt:rwx` match, AND mask `rw-` = `rw-` both | denied | 5 |
| 5 | `root` | `tajna` `----------`, root, r | privileged: read is overridden | granted | 3 |

Also pinned: preset 1 with ana → group `rwx` → granted, 4 steps; preset 4 with w → granted; preset 5 with x →
denied.

`sim.json` `steps` = the default params' count = preset 1 = **5**. Longest: `proba`, ana, any want: identify,
owner, named users, groups, other, verdict = 6.
