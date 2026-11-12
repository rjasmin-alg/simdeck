<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-userns-mapping: spec

One concept: **root inside a rootless container is an unprivileged UID outside**. The container's processes create
files in a bind-mounted host directory; both sides list the same directory, each with its own numbers, and the
`uid_map` in the middle translates.

Task: `docs/tasks/w3/lnx-userns-mapping.md`. Model it builds on: `sims/lnx-namespaces` (two views, "a container is a
process"). Sources: user_namespaces(7) and subuid(5) (man-pages, read on nuc 2026-11-12); NLA toc T17 and T11;
UL ch07 "Tko ste vi za sustav". Every number below was also **run on the real kernel** (nuc, Linux 6.8): a throwaway
privileged container wrote `0 1000 1` / `1 100000 65536` into a new user namespace's `uid_map` and `gid_map` and ran
the presets' commands with `setpriv` (see NOTES.md, Checks).

## Scene

- **Command strip** (top): who runs the command (a container process with its inside user, or the host user
  `student`), the command, and its result (OK, or the error message).
- **Container** (left, hatched, the C badge of `lnx-namespaces`): its processes (`ps -o user,pid,comm` as the
  container sees them: `root 0 sh` PID 1, `www 33 web` PID 7, `app 1000 app` PID 9) and `ls -ln /data` as the
  container sees it (mode, owner UID, name; the group column is left out, see State; the page adds the side's
  `/etc/passwd` name next to each number, which `ls -ln` itself does not print).
- **Mapping** (middle): `/proc/4321/uid_map` as the kernel prints it (`inside outside count`), the host user's line in
  `/etc/subuid` (`student:100000:65536`). Per process and per file row, an arrow between the two owners with the
  number of the map line used, or "no line: 65534" (dashed) for an unmapped ID.
- **Host** (right): the same processes (`ps -o user,pid,comm` on the host: `student 4321 sh`, `100032 4330 web`,
  `100999 4335 app`) and `ls -ln /data` on the host, with the host's name for the UID.

## State

`{ rootless, subuidStart, map: [{ inside, outside, count }], subuid: { user, start, count }, hostUser: { name, uid },
procs: [{ id, name, user, uidIn, pidIn, pidOut }], files: [{ path, uidOut, mode, isNew }], action, result, used,
changed }`.

- `files` store the **host's** number (`uidOut`), the one on disk; the container's view is computed from it (rule 3).
  The group is the owner's own group throughout (gid = uid, the gid map is the uid map), so the group class never
  decides and the page shows no GID column; rule 4's "owner and group mapped" is then one test.
- `action`: `{ side: 'c' | 'h', by, op: 'create' | 'ls' | 'read' | 'write', path }` (`by` is a process id inside, or
  `student` on the host).
- `result`: `{ ok, errno: null | 'EACCES', who: { uidIn, uidOut, line }, check: { cls, bits, need, cap } }`.
- `used`: the map lines this step went through (indexes): the acting process's line, and the line that covers each
  file the step lists or touches (none for an unmapped owner). Reset every step. `changed`: keys of the rows this step touched.

## One step

One action of the preset's script:

- **create** (container process): the file's owner on disk is the process's UID translated outward (rule 1); mode
  `0644` (umask 022). `/data` is `0777` (see Deviations), so every create is allowed.
- **ls** (either side): nothing changes; that side's listing is outlined and every owner translated inward is marked.
- **write** (host user `student`) and **read** (container process): the permission check of rules 4 and 5.

## Rules

1. **Translation by line.** Each `uid_map` line maps `count` IDs starting at `inside` to IDs starting at `outside`; an
   ID is translated by the line whose range contains it: outward `out = outside + (in − inside)`, inward
   `in = inside + (out − outside)`. (user_namespaces(7) "User and group ID mappings: uid_map and gid_map".)
2. **Default rootless map.** Line 1: `0 1000 1` (container root → the user's own UID). Line 2: `1 S 65536`, where
   `S:65536` is the user's `/etc/subuid` range (`student:100000:65536`). So container UID n ≥ 1 is host UID
   S + n − 1: 33 → 100032, 1000 → 100999, 65536 → 165535; with S = 200000: 33 → 200032. Container UID 65537 has no
   line: a process cannot take it. (subuid(5); user_namespaces(7) "Defining user and group ID mappings: writing to uid_map and gid_map"; the engine's
   default *(check: the engine's documentation not read; the map and every number run on the kernel)*.)
3. **Unmapped is the overflow ID.** A host UID that no line covers appears inside as 65534 (`nobody`): host root's
   file (0), a host UID 2000. Not "no owner": the file still has its owner on disk. (user_namespaces(7) "Unmapped
   user and group IDs"; `/proc/sys/kernel/overflowuid`; run.)
4. **Root inside has capabilities only over what its namespace owns.** A container process acts on host files as its
   host UID. Container root passes the permission bits (it has CAP_DAC_OVERRIDE in its namespace) only on a file
   whose owner (and group) is mapped into the namespace; on any other file it is UID 1000 and the ordinary owner →
   others check decides. Host root's `0600` file: container root is "others", `---` → Permission denied. A file of
   `www` (100032, mapped): container root writes it. (user_namespaces(7) "Effect of capabilities within a user
   namespace", "Accessing files", "Operation of file-related capabilities": "the file's user ID and group ID both have
   valid mappings in the user namespace"; run.) In the rootful contrast
   (rule 6) container root is host root and passes on every file.
5. **The host user is not its subordinate IDs.** `student` (1000) writing `www`'s file (100032, `0644`) is "others",
   `r--` → Permission denied. To change it the user must enter the container's namespace, where it is root and
   100032 is mapped (rule 4). (user_namespaces(7) "Accessing files"; run.)
6. **Rootful contrast.** Without a user namespace the map is the initial namespace's identity, `0 0 4294967295`
   (what `/proc/self/uid_map` prints on the host): container root creates files owned by host root (0); `www` 33 is
   host 33. (user_namespaces(7) "the initial user namespace … 0 0 4294967295"; run.)
7. **Tie-break: one line at most.** The map is read line by line and the first line whose range contains the ID
   translates it; the kernel refuses a map whose ranges overlap, inside or outside (`EINVAL`), and a count of 0, so in
   a valid map at most one line matches and the order of the lines changes nothing. (user_namespaces(7) "Defining user and group ID
   mappings: writing to uid_map and gid_map": the ranges "may not overlap with the ranges in any other lines"; run: `0 1000 1` + `0 100000 65536` and `0 1000 1` + `1 1000 5` were both refused.)

Group IDs follow the same rules with `gid_map` and `/etc/subgid` (out of scope, one sentence in the explanation).

## Params

- `rootless`: toggle, default **on** (off = rule 6).
- `subuidStart`: choice 100000 | 200000, default 100000 (the `/etc/subuid` line and map line 2 follow it).
- `script`: hidden, set by the presets, default `root-inside`.

Changing `rootless` or `subuidStart` keeps the step: the same action is shown with the other map.

## Presets and expected numbers

Processes in every script: `sh` (root 0, PID 1 / 4321), `web` (www 33, PID 7 / 4330), `app` (app 1000, PID 9 / 4335).
Host `ps` user column (rootless, S = 100000): `student`, `100032`, `100999`.

| Preset | Initial files (host owner, mode) | Step | Action | Inside owner | Host owner | Map line | Result |
|---|---|---|---|---|---|---|---|
| `root-inside` | none | 1 | container root `touch /data/a` | 0 `root` | 1000 `student` | 1 | created |
| | | 2 | host `ls -ln /data` | | `a` 1000 `student` | 1 | listed |
| `service-user` | none | 1 | container `www` `touch /data/b` | 33 `www` | 100032 (no name) | 2 | created; 100000 + 33 − 1 |
| | | 2 | host `ls -ln /data` | | `b` 100032 | 2 | listed |
| | | 3 | host `student` appends to `/data/b` | | 100032, others `r--`, needs `w` | 2 | Permission denied |
| `host-file-inside` | `secret` 0, `0600` | 1 | host `ls -ln /data` | | 0 `root` | none | listed |
| | | 2 | container root `ls -ln /data` | 65534 `nobody` (unmapped) | 0 | none | listed |
| | | 3 | container root `cat /data/secret` | acts as host 1000 | 0, others `---`, needs `r`, no capability (owner unmapped) | 1 (for the process) | Permission denied |
| `rootful` (`rootless` off) | none | 1 | container root `touch /data/c` | 0 `root` | 0 `root` | identity | created |
| | | 2 | host `ls -ln /data` | | `c` 0 `root` | identity | listed |

Steps: 2, 3, 3, 2 (the task's). `sim.json` `steps` is the default script's, 2.

Cross-checks pinned in the tests (params change, the script stays):

- `service-user` with S = 200000: `b` is host 200032; the subuid line is `student:200000:65536`.
- `service-user` step 3 rootful: `b` is host 33, `student` is still others → Permission denied.
- `host-file-inside` rootful: step 2 shows owner 0 `root` inside; step 3 container root (host root) reads it.
- `root-inside` rootful: `a` is host 0.
- Model only: container root writing `b` (100032) → allowed (capability, owner mapped); `app` (1000 → 100999)
  reading host `student`'s `0600` file → refused (others).

## Legend

Inside UID (badge on the left, hatched), outside UID (badge on the right, plain), map line used (outlined row in the
`uid_map` table, its number on the arrow), unmapped (dashed badge "65534 nobody"), refused (✗ and the message),
new file ("new" tag), changed (highlight).

## Captions

- Step 0: what the scene is, and the preset's goal.
- create: the task's sentence for a line-2 translation (verbatim, numbers from the state); container root: line 1
  maps exactly one ID, 0 → the user's own UID; rootful: no user namespace, 0 is 0.
- ls: what the side sees and why (inward translation; unmapped → 65534).
- read/write refused: who the process is on the host, which class, the bits, and (container root) why its capability
  does not reach the file / (host user) that it has to enter the namespace.

## Out of scope

Group maps in detail (same rule as UID), `setgroups`, ID-mapped mounts, capabilities beyond one sentence, network in
rootless mode, how the engine writes the map (the helper programs), several subuid ranges.
