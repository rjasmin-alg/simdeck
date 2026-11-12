<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-special-bits: spec

One concept: **who the process runs as; who may delete in /tmp**. The fourth octal digit (4 setuid, 2 setgid,
1 sticky) and what each bit does at the moment it matters: at `exec` (which IDs the new process gets), at an `open`
(the check uses the effective IDs), at a delete in a directory (the sticky rule) and at a create (the setgid
directory's group).

Task: `docs/tasks/w3/lnx-special-bits.md`. Model it builds on: `sims/lnx-permissions-rwx` (the nine bits, the octal
digits; its owner → group → others order is ch07's, written out here as `access`). Sources: UL ch07 "Kad tri skupine
bitova nisu dovoljne" and its "Šire o temi" (`/home/rjasmin/projects/uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`),
POSIX Issue 8 as ch07 cites it (exec, `<sys/stat.h>`, directory protection, `chown()`), execve(2), chmod(2),
chown(2), path_resolution(7) (read on nuc 2026-11-12). Every number below was also **run on the real kernel**
(nuc, Linux 6.8, a throwaway `debian:bookworm-slim` container, no network; NOTES.md, Checks).

## Scene

- **Command strip** (top): who acts (`student`, `ana` or `root`, with the shell prompt `$` or `#`), the command
  (or, for an open done by a running program, the words "opens … for reading/writing"), and the result: ✓, or the
  error line (`Permission denied`, `Operation not permitted`, `No such file or directory`).
- **Process** (left): the card of the process that acts: its command and four IDs, `RUID`, `EUID`, `RGID`, `EGID`
  (each with its name), and its supplementary groups. The effective IDs are bold and highlighted (with a ≠ mark) when
  they differ from the real ones. Below it, the three users and the group `projekt`: `root` 0, `student` 1000 (group
  `student` 1000), `ana` 1001 (groups `ana` 1001 and `projekt` 1002).
- **The bit carrier** (middle): the file or directory whose special bit the preset is about (`/usr/bin/passwd`,
  `/opt/ana/report`, `/usr/local/bin/cleanup.sh`, `/tmp`, `/srv/projekt`): its `ls -l` line with the special
  letter enlarged and outlined, its four octal digits with the first one broken into 4 + 2 + 1, and a key of the
  four letters `s S t T` with the one on show marked. For a directory, its entries below it (a new entry tagged, a
  removed one struck through).
- **Target and decision** (right): the file the action touches with its `ls -l` line, then the decision: ✓ / ✗, the
  error, the rule badge (1–8) and the checks that made it (class and bits, or the sticky rule's three tests in
  order, the first that passed marked).

## State

`{ actor, sticky, script, subject, files: [{ path, kind, owner, group, mode, script, isNew }], proc: null | { cmd,
ruid, euid, rgid, egid, groups }, action: null | { kind, who, prog, path, need, mode }, result: null | { ok, errno,
rule, exec, check, sticky, created, removed }, gone: { path: step }, changed: [] }`.

- `kind` of an action: `exec` (a user runs a program), `open` (a process opens a file or directory for `r` or `w`;
  with `prog` a user first runs that program), `create`, `unlink`, `stat` (`ls -ld`, a look, no decision).
- `changed`: `proc` when an exec made a new process; `entry:<path>` when a directory entry was added or removed.
- `gone`: the step at which each removed path went, so a later action on it says "no such file" and when it went.

## Rules

1. **exec with set-user-ID: EUID ← the file's owner; RUID stays the caller.** Not "run as root": run as the owner.
   `student` (1000) runs `/usr/bin/passwd` (`-rwsr-xr-x root root`): RUID 1000, EUID 0. Runs `/opt/ana/report`
   (`-rwsr-xr-x ana ana`): RUID 1000, EUID 1001. `root` runs the same: RUID 0, EUID **1001** (the bit lowers too).
   (ch07: "efektivni korisnički identifikator novog procesa postavlja se na korisnički identifikator te datoteke";
   POSIX exec. Kernel: `uid=1000 euid=0`, `uid=1000 euid=1001`, `uid=0 euid=1001`.)
2. **set-group-ID on an executable: EGID ← the file's group**, when the group's `x` is also set (with `S`, no `x`,
   Linux does not change the EGID). `student` runs a `-rwxr-sr-x root projekt` program: EGID 1002; `-rwxr-Sr-x`:
   EGID 1000. (ch07; kernel: `egid=1002`, and none with `S`.) No preset shows it (the task names none); tests do.
3. **Permission checks use EUID / EGID; EUID 0 skips them.** Order: EUID 0 → allowed (for `x` on a file at least one
   `x` bit must be set); else EUID = owner → the owner's three bits decide, even when group or others would allow
   more; else EGID or a supplementary group = the file's group → the group bits; else the others bits. Every letter
   asked for must be set. (ch07 "Što smijete s datotekom" and "Kad tri skupine…": "proces s efektivnim
   identifikatorom 0 zaobilazi sve provjere dozvola"; path_resolution(7) "Permissions"; capabilities(7) as cited.)
   `/etc/shadow` is `---------- root root` (`0000`, Rocky Linux 10, the family of the book's el10 lab machine; Debian
   has `-rw-r----- root shadow`, the same refusal for `student`) *(check: the lab machine itself was not read)*.
4. **Sticky bit on a writable directory: delete or rename only by the file's owner, the directory's owner, or a
   privileged process.** Writing the directory (`wx` on it, checked first, rule 3) is not enough. Without the bit,
   `wx` on the directory is enough. Refused: `EPERM`, "Operation not permitted" (not `EACCES`). (ch07 definition
   *sticky bit*; POSIX directory protection. Kernel: `student` `rm` and `mv` of `ana`'s `/tmp/ana.txt` → "Operation
   not permitted"; `ana` `rm` → ok; sticky off (`0777`): `student` `rm` → ok, then `ana` `rm` → "No such file or
   directory".)
5. **setgid on a directory: a file created in it gets the directory's group**, not the process's EGID. `ana`
   (EGID 1001 `ana`) creates `/srv/projekt/ana.txt` → group `projekt`; in `/tmp` (no setgid) → group `ana`. Owner is
   the EUID either way. (ch07 definition *setgid* and the `/srv/projekt` example. Kernel: `-rw-r--r-- ana projekt
   ana.txt`, `-rw-r--r-- ana ana /tmp/ana2.txt`.)
6. **Octal: the fourth digit in front, 4 + 2 + 1. In `ls -l` the letter replaces the `x`: lowercase when the `x` is
   set too, uppercase when not.** `4755` = `-rwsr-xr-x`; `1777` (dir) = `drwxrwxrwt`; `2770` (dir) = `drwxrws---`;
   `4644` = `-rwSr--r--`; `2644` = `-rw-r-Sr--`; `1770` (dir) = `drwxrwx--T`; `7777` = `-rwsrwsrwt`; `7000` =
   `---S--S--T`. (ch07; chmod(1). Kernel: every one of these listed by `ls -l`.)
7. **A write by an unprivileged process, or a `chown`/`chgrp`, clears the bits.** Linux 6.x: `S_ISUID` always goes;
   `S_ISGID` goes when the group's `x` is set, or (an `S`) when the process is neither in the file's group nor
   privileged. A write by root clears nothing (it holds the privilege to keep them, `CAP_FSETID`); a `chown` by root
   clears `s` too (chown(2): "since Linux 2.2.13, root is treated like other users") but keeps an `S`. Directories keep
   their bits. (ch07: chmod(2), POSIX chown. Kernel, regular files: `ana` appends to her `6755` → `0755`; to her
   `6745` → `2745` (`-rwxr-Sr-x`); to her `2747` → `2747`; `student` (not in group `ana`) appends to ana's `6747` →
   `0747`; root appends to `6755` → `6755`; `ana` `chgrp projekt` on `6755` → `0755`; root `chown ana` on `6755` →
   `0755`; root `chown student` on `2745` → `2745`; `ana` `chgrp` on `6644` → `2644`.) POSIX asks for the clearing
   only when an `x` bit is set; Linux clears `S_ISUID` even without one (the last case). Which group the `chown` case
   tests, before or after the change, is not settled by these runs (ana is in both) *(check)*. No preset step (the
   task names none); `writeClears` and `chownClears` with tests, one sentence in the explanation.
8. **Linux ignores set-user-ID and set-group-ID on an interpreted script (`#!`).** `student` runs
   `/usr/local/bin/cleanup.sh` (`-rwsr-xr-x root root`, `#!/bin/sh`): RUID 1000, EUID **1000**; its `cat
   /etc/shadow` is refused. (execve(2) "Interpreter scripts": "Linux … ignores the set-user-ID and set-group-ID bits
   on scripts". Kernel: `uid=1000` with no `euid=`, then "Permission denied".)
9. **Tie-break for rule 4: the file's owner is tested first, then the directory's owner, then privilege; the decision
   names the first test that passed.** `root` deleting `ana`'s file in `/tmp` (owner `root`): passes by *directory
   owner*, not by privilege. `root` deleting in a sticky directory owned by `ana`: *privilege*. `ana` deleting her
   own file in a directory she owns: *file owner*. (Kernel: all three allowed; the order is the model's, from the
   POSIX sentence's order, as the task asks.)

## One step

One action. `exec`: compute the new process (rules 1, 2, 8) after the `x` check (rule 3). `open`: the access check
(rule 3) with the current process, or with the process of `prog` run by `who`. `create`: `wx` on the directory
(rule 3), then the new file's owner (EUID) and group (rule 5). `unlink`: `wx` on the directory, then the sticky rule
(4, 9). `stat`: nothing is decided; the caption reads the `ls -ld` line (rule 6).

`actor` stands for the actions the task gives to `student`; `ana`'s own actions stay `ana`'s. `sticky` sets `/tmp`
to `1777` (on) or `0777` (off). Both are live: changing one keeps the step.

## Params

- `actor`: `student` | `ana` | `root`, default `student`.
- `sticky`: on `/tmp`, default on. Shown in the sticky preset only.
- `script` (hidden, set by the presets): `passwd` | `owner-not-root` | `sticky-tmp` | `setgid-dir` | `script-ignored`.

## Files (one tree for every preset)

| path | kind | owner | group | mode | ls -l |
|---|---|---|---|---|---|
| `/etc/shadow` | file | root 0 | root 0 | `0000` | `----------` |
| `/home/ana/plan.txt` | file | ana 1001 | ana 1001 | `0600` | `-rw-------` |
| `/opt/ana/report` | file | ana 1001 | ana 1001 | `4755` | `-rwsr-xr-x` |
| `/srv/projekt` | dir | root 0 | projekt 1002 | `2770` | `drwxrws---` |
| `/tmp` | dir | root 0 | root 0 | `1777` (`0777` with sticky off) | `drwxrwxrwt` |
| `/usr/bin/cat` | file | root | root | `0755` | `-rwxr-xr-x` |
| `/usr/bin/ls` | file | root | root | `0755` | `-rwxr-xr-x` |
| `/usr/bin/passwd` | file | root 0 | root 0 | `4755` | `-rwsr-xr-x` |
| `/usr/local/bin/cleanup.sh` | file, script | root 0 | root 0 | `4755` | `-rwsr-xr-x` |

`/opt/ana/report` and `/usr/local/bin/cleanup.sh` are the task's derived examples; names are ours. Directory search
(`x`) on the parents is not drawn: every parent is `0755`.

## Presets (steps per preset: 3, 3, 5, 3, 2; `sim.json` `steps` = 3, the default `passwd`)

| preset | step | who | action | result (actor `student`) | rule |
|---|---|---|---|---|---|
| `passwd` | 1 | actor | exec `/usr/bin/passwd` | ✓ RUID 1000 EUID 0 RGID 1000 EGID 1000 | 1 |
| | 2 | (that process) | open `/etc/shadow` for `w` | ✓ EUID 0 skips the check | 3 |
| | 3 | actor | `cat /etc/shadow` (open `r`) | ✗ EACCES: others `---`; RUID = EUID = 1000 | 3 |
| `owner-not-root` | 1 | actor | exec `/opt/ana/report` | ✓ RUID 1000 EUID 1001 | 1 |
| | 2 | (that process) | open `/home/ana/plan.txt` for `r` | ✓ owner class, `rw-` | 3 |
| | 3 | (that process) | open `/etc/shadow` for `r` | ✗ EACCES: EUID 1001 is not 0, others `---` | 3 |
| `sticky-tmp` | 1 | actor | `ls -ld /tmp` | `drwxrwxrwt`, `1777` | 6 |
| | 2 | ana | create `/tmp/ana.txt` mode `0666` | ✓ owner ana, group ana; entry added | 5 |
| | 3 | actor | open `/tmp/ana.txt` for `w` | ✓ others `rw-` | 3 |
| | 4 | actor | `rm /tmp/ana.txt` | ✗ EPERM: not file owner (1001), not dir owner (0), not privileged | 4 |
| | 5 | ana | `rm /tmp/ana.txt` | ✓ by *file owner*; entry removed | 4 (9) |
| `setgid-dir` | 1 | ana | `touch /srv/projekt/ana.txt` | ✓ via group `projekt` `rwx`; group `projekt`, mode `0644` | 5 |
| | 2 | actor | `ls /srv/projekt` (open dir `r`) | ✗ EACCES: not root, not in `projekt`, others `---` | 3 |
| | 3 | ana | `touch /tmp/ana2.txt` | ✓ group `ana` (no setgid on `/tmp`) | 5 |
| `script-ignored` | 1 | actor | exec `/usr/local/bin/cleanup.sh` | ✓ RUID 1000 EUID **1000** (bit ignored) | 8 |
| | 2 | (that process) | open `/etc/shadow` for `r` | ✗ EACCES | 3 |

Cross-checks (other params, same steps):

- `passwd` actor `root`: step 1 RUID 0 EUID 0 (the bit changes nothing). Actor `ana`: RUID 1001 EUID 0.
- `owner-not-root` actor `root`: step 1 RUID 0 EUID 1001; step 2 ✓ owner; step 3 ✗ (root lowered to 1001 cannot read
  `/etc/shadow`).

The task gives `owner-not-root` 2 steps; step 3 is ours (NOTES.md, Deviations).
- `sticky-tmp` sticky off: step 1 `drwxrwxrwx` `0777`; step 4 ✓ by *directory write* (no sticky), entry removed;
  step 5 ✗ ENOENT "removed at step 4". Actor `ana`: step 3 ✓ owner; step 4 ✓ *file owner*; step 5 ENOENT. Actor
  `root`: step 4 ✓ *directory owner* (rule 9: before privilege); step 5 ENOENT.
- `setgid-dir` actor `ana`: step 2 ✓ group class `rws` → `r`. Actor `root`: ✓ EUID 0.
- `script-ignored` actor `root`: step 1 EUID 0 (it was 0 already); step 2 ✓.

## Legend

Real ID (plain), effective ID (bold; highlighted with ≠ when it differs from the real one), special-bit letter
(enlarged, outlined box), allowed ✓ / refused ✗ (with shape and word), rule badge (a numbered tag), changed in this
step (the kit's highlight; a new entry tagged "new", a removed one struck through).

## Captions

Per action and result (strings.js `cap*`). The task's caption, with the numbers from the state:

- HR: „`passwd` ima bit setuid i vlasnik mu je `root`: proces koji je pokrenuo `student` ima stvarni UID 1000, ali
  efektivni 0. Dozvole se provjeravaju po efektivnom.“
- EN: "`passwd` has the setuid bit and is owned by `root`: the process `student` started has real UID 1000 but
  effective UID 0. Permissions are checked against the effective one."

Misconceptions, each with a step that shows it: "setuid means run as root" (`owner-not-root`, EUID 1001; and
`root` running it drops to 1001); "who may write a directory may delete anything in it" (`sticky-tmp` step 4);
"`s` and `S` mean the same" (the letter key in the middle; rule 2's `S` in the explanation).

## Out of scope

Capabilities as the narrower alternative (one sentence in the explanation, as in ch07), `sudo` policy, `nosuid`
mounts, ACLs, the historical sticky bit on files, `fs.protected_regular` (one sentence: why a shell `>>` into
`ana`'s file in `/tmp` is refused on many systems although the bits allow it; NOTES.md), saved set-user-ID.
