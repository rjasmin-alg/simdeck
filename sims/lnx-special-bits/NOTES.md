<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-special-bits: notes

New stepper (task `docs/tasks/w3/lnx-special-bits.md`, catalogue `lnx-special-bits` §4.4, wave 3). One concept: who
the process runs as; who may delete in /tmp. Rules and expected numbers: `SPEC.md`. No kit view fits (a process
card, an `ls -l` line with an enlarged letter and a decision list), so the page draws its own in HTML.

## Decisions

- **Three columns under a command strip**, as the task's scene: the process card (RUID, EUID, RGID, EGID; the
  effective rows bold, highlighted with a "≠ real" tag when they differ), the bit carrier (the preset's file or
  directory: `ls -l` line with the special letter enlarged and boxed, dashed when uppercase; the four octal digits
  with the first one outlined and broken into 4 setuid / 2 setgid / 1 sticky; a key of `s S t T`; a directory's
  entries with new and removed tags), and the target with the decision (✓/✗ with the word and the errno, the rule
  badge 1–8 with its one-line name, and the checks: the `x` check and the ID change for an exec, the class and bits
  for an open, `wx` on the directory then the sticky rule's three tests in order, the first that passed bold and the
  rest "not tested").
- **One file tree for every preset** (SPEC.md, Files), so the actor switch and the sticky toggle recompute the same
  step: `actor` plays student's part (the task's `actor` param), `ana`'s own actions stay hers.
- **An open by a running program keeps its process** (passwd's write to `/etc/shadow`, report's read, the script's
  read); a user's own command (`cat`, `ls`, `touch`, `rm`, and the write in `sticky-tmp`) starts a new process with
  real = effective. `proc.via` (`none`, `setuid`, `setgid`, `ignored`) lets captions say why the IDs are what they are.
- **`/etc/shadow` is `0000 root root`**, as Rocky Linux 10 ships it (the book's lab machine is el10); Debian's
  `0640 root shadow` gives `student` the same refusal.
- **The "may write" step is an open, not `>>`.** On this kernel (`fs.protected_regular = 2`, the default on many
  distributions) `student`'s `echo x >> /tmp/ana.txt` is refused with "Permission denied" because the shell opens with
  `O_CREAT`; an open of the existing file for writing passes, as the bits say. The strip says "opens /tmp/ana.txt for
  writing" and one sentence in the explanation names the separate protection.
- **Sticky off is the toggle**, live at any step: with it off step 4 deletes ("no sticky bit: writing the directory
  is enough") and ana's step 5 finds nothing ("removed at step 4"). The toggle shows only in the sticky preset.
- **Rules 2 and 7 have no preset step** (the task gives none): rule 2 (setgid exec, and `S` doing nothing) and rule 7
  (write and chown clearing the bits) are in the model, the tests and the explanation.
- **Captions by case:** exec with setuid (the task's sentence, numbers from the state; "not run as root but run as
  the owner" when the owner is not root; "even root gets less" when root runs ana's program), exec by the owner
  ("changes nothing"), a script (rule 8), an open by root / owner / another class / refused, create (the directory's
  group with setgid or the process's EGID without), unlink refused (EPERM, the three tests and "a rename would be
  refused the same way"), unlink allowed by each of the three tests or by directory write, a missing file, and the
  `ls -ld /tmp` look. Each of the task's three misconceptions has a step that shows it.
- **No tool names.** The commands shown are the subject (`passwd`, `ls -ld`, `chmod 666`, `rm`, `touch`); `sudo`
  is not used (the task: out of scope); `protected_regular` and capabilities are named once in the explanation, as
  ch07 names capabilities.
- **Preset entries** in `sim.json`: `sticky-tmp` ("who may delete in /tmp", the second half of the concept) and
  `setgid-dir`.
- **Model reuse.** `lnx-permissions-rwx` is not in `models/` and has no access check (it is an explorer of the
  bits); its bit order and octal helpers are rewritten here in a few lines (`classBits`, `octal4`, `lsString` with the
  special letters). `access`, `exec`, `create`, `unlink`, `writeClears`, `chownClears`, `lsString`, `special` are pure
  and promotable unchanged (to a `models/unix-perms.js`, if `lnx-acl` or another permissions sim wants them).
- Tags: `permissions`; topic `linux-admin`; level `intro` (the task's). All exist in `tags.json`. `related`:
  `lnx-permissions-rwx`.
- Suggested `learn.json` leaf: next to `lnx-permissions-rwx` (linux permissions), and under security/access/unix if
  that leaf exists.

## Deviations from the task

- **`owner-not-root` has 3 steps, not 2.** Step 3: the same EUID-1001 process opens `/etc/shadow` and is refused
  ("1001 is not 0"). The gate's deep-link check opens the second preset at `min(3, default steps)` = step 3, so the
  second preset needs 3 steps; the extra step shows the preset's own misconception instead of only saying it.
- **`sticky-tmp` steps** (the task gives only the count 5 and the story): 1 `ls -ld /tmp` (rule 6, a look), 2 `ana`
  creates `/tmp/ana.txt` 666, 3 `student` opens it for writing ✓, 4 `student` `rm` ✗ EPERM, 5 `ana` `rm` ✓. "Then
  sticky off" is the toggle (above).
- **`setgid-dir` step 3** (the task gives 3 steps, names two): `ana` creates `/tmp/ana2.txt`, group `ana`, the
  contrast for rule 5.
- **Names the task leaves open:** `/opt/ana/report` (ana's setuid program), `/home/ana/plan.txt` (0600, what it
  reads), `/usr/local/bin/cleanup.sh` (the script). Group `projekt` is GID 1002.
- **The write** is an open, not `>>` (above).

## Sources

- UL ch07 "Kad tri skupine bitova nisu dovoljne" (listing of `passwd`, definitions setuid / setgid / sticky bit,
  `S_ISUID` 04000 / `S_ISGID` 02000 / `S_ISVTX` 01000, `ls -ld /tmp`, `chmod 2770 /srv/projekt`, chmod(2) and
  POSIX chown clearing the bits) and its "Šire o temi" (`t` on `/tmp`, capabilities); "Što smijete s datotekom" for
  the check order. `/home/rjasmin/projects/uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`.
- POSIX Issue 8 as ch07 cites it: exec (set-user-ID on exec), `<sys/stat.h>`, directory protection, `chown()`.
- execve(2) "Interpreter scripts" (Linux ignores set-user-ID and set-group-ID on scripts), chown(2) (since Linux
  2.2.13 root is treated like other users when clearing), chmod(2), path_resolution(7), proc_sys_fs(5)
  (`protected_regular`).

## Term pairs

From the glossary: *set-user-ID on execution* — setuid, *set-group-ID on execution* — setgid, *process* — proces,
*file permission* — dozvola, *capability* — sposobnost. Missing from `kit/glossary.js`, written out in both tables:

| en | hr |
|---|---|
| restricted deletion flag (sticky bit) | zastavica ograničenog brisanja (UL ch07) |
| real user ID | stvarni korisnički identifikator (UL ch07) |
| effective user ID | efektivni korisnički identifikator (UL ch07) |

The task lists *privilege* — ovlast; the glossary has *privilege* — ovlaštenje (uvod-u-linux). The page writes
"ovlast" in running text (as ch07 does) and does not mark it as a term.

## Shared requests

- **Kit: `[hidden]` on a control** (as `lnx-permissions-rwx`, `lnx-userns-mapping` and others asked): the page
  carries the one-line workaround for the hidden `script` param and the sticky toggle.
- **Kit: the gate's deep-link check** opens the second preset at `min(3, default steps)`; a second preset with fewer
  steps than that fails it. Either clamp to that preset's own steps or say so in `docs/sim-ui.md`.
- **Glossary:** the three term pairs above, `"src": "simdeck"`.
- **Models:** promote the permission check and the special bits (above) if another sim needs them.

## Checks

- **Run on the real kernel** (nuc, Linux 6.8, 2026-11-12) in a throwaway `debian:bookworm-slim` container (local
  image, `--network none`, nothing on the host touched), users `student` 1000, `ana` 1001 (+ `projekt` 1002), with
  `setpriv`: a setuid copy of `id` owned by root → `uid=1000 euid=0`; owned by ana → `uid=1000 euid=1001`, and as root
  `uid=0 euid=1001`; ana's setuid `cat` reads `/home/ana/plan.txt` (0600) and is refused `/etc/shadow`; setgid
  (`2755`, group projekt) → `egid=1002`, with `2745` (`S`) nothing; a `4755` root `#!/bin/sh` script → `uid=1000`, its
  `cat /etc/shadow` refused; `/tmp` `drwxrwxrwt`; ana's 666 file: student's `rm` and `mv` → "Operation not
  permitted", ana's `rm` ok, root's ok; `/tmp` 0777: student's `rm` ok, then ana's → "No such file or directory"; a
  sticky directory owned by ana: ana deletes student's file, root deletes too; `/srv/projekt` 2770: ana's file is
  `ana projekt`, student's `ls` → "cannot open directory … Permission denied", ana's `ls` ok, ana's `/tmp/ana2.txt`
  is `ana ana`; `ls -l` of 4644, 2644, 1770, 7777, 7000 as in SPEC rule 6; writes and chown as in SPEC rule 7;
  student's `>>` into ana's file refused with `protected_regular = 2`, a non-creating open allowed. Every number
  equals SPEC.md's table.
- The same script in `rockylinux/rockylinux:10` showed `/etc/shadow` `0000` and `passwd` `4755`, but there no
  set-user-ID took effect at all (same kernel; the cause was not found) *(check)*; only its listings are used.
- Numbers printed from the model for every preset and the cross-checks before the page was written; equal to the
  kernel run.
- Rule tests broken on purpose, one mutation at a time (31): tie-break order (directory owner first, privilege
  first), sticky ignored, `wx` on the directory not checked, EPERM as EACCES, setuid to root instead of the owner,
  setuid changing the RUID, setgid without group `x`, setgid to the owner's GID, scripts not ignored, check by RUID,
  no root bypass, root executing without `x`, owner class skipped, supplementary groups ignored, any letter instead of
  all, setgid directory ignored, new file owned by the RUID, uppercase never / inverted, three octal digits, the
  sticky param ignored, root's write clearing, an `S` cleared, chown keeping, `/etc/shadow` readable, `gone` not
  recorded, an open reusing the previous process, `isNew` kept, the actor ignored, unlink not removing. All 31 fail a
  test (the first run missed "new file owned by the RUID"; a test with RUID ≠ EUID added).
- Browser (Playwright, the unbuilt page from `file://`): every preset at its deciding step in hr and en at
  1920×1080, the cross-checks (actor root, sticky off), 375×812; no console errors, no overflow at 1920×1080. Fixed
  from the screenshots: the "≠ real" tag spilling out of the process card, the owner and group breaking across lines,
  the phone stage collapsing (`container-type: inline-size`), nested parentheses in the group line.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page; ran 38 mutations of its
  own on a copy and swept the page over 5 presets × 3 actors × sticky × every step × hr and en, 162 loads: no console
  errors, no empty or unfilled captions, every number in a caption agrees with the state). Fixed from it: the
  caption for root running ana's program, step 3, fell through to a bare fallback (EGID 0 matches `/etc/shadow`'s
  group, so the group class decides): a group-class refusal caption now, and "EUID 1001 is not 0" after every
  refusal of a setuid process; tests could not tell real from effective (every fixture had RGID = EGID, RUID = EUID):
  tests with split IDs for the group class, the new file's group and all three sticky tests, a directory whose group
  is not its owner, directories with `w` but no `x` and `x` but no `w`, groups kept across setuid, the rule each step
  reports, a setgid-only script; rule 7 for Linux 6.x (an `S` is cleared for a writer outside the file's group; run
  on the kernel, SPEC rule 7 updated, `writeClears`/`chownClears` take the process); Croatian gender with `ana`
  (`_f` keys for "pokrenula", neutral wording elsewhere); "although its mode is …" when the bits would have allowed
  it (now "the bits are not even read") and "the real UID is still 0" for root (dropped); "the bit on the script did
  not help" before root's skipped check (dropped for root); the class bits in captions and checks now as `ls -l`
  prints them (`rws`, `rwt`); "nije vlasnik od", "anin dokument", "User in student’s part", the `passwd` goal naming
  `student` whatever the actor. Its 18 survivors: the real gaps above now fail a test (20 re-run mutations, all
  fail); the rest are equivalent (no visible difference in this sim: `delete s.gone`, the sort, ENOENT checked
  after `wx`, the exec-failure errno, the open-ENOENT rule, exec rule 2→1 with no preset showing rule 2).
- `npm run gate -- lnx-special-bits`: pass (63/63 browser checks).

## Time

Start 2026-11-12 20:49, done 21:18 (CET), about 29 minutes, one session, including the kernel runs and the fresh review.
