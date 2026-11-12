<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-userns-mapping: notes

New stepper (task `docs/tasks/w3/lnx-userns-mapping.md`, catalogue `lnx-userns-mapping` §4.4, wave 3). One concept:
root inside a rootless container is an unprivileged UID outside. Rules and expected numbers: `SPEC.md`. No kit view
fits (three aligned columns of rows with an arrow per row; K4's rule table would show the map but not the two
listings), so the page draws its own in HTML.

## Decisions

- **The container diagram of §5.17, in three columns that line up.** Left the container's view (hatched, the C badge
  of `lnx-namespaces`), right the host's, in the middle the user namespace: `uid_map` of the container's first process
  (host PID 4321, the PID `lnx-namespaces` uses) and the `/etc/subuid` line. Every process and every file of `/data`
  has one row across all three columns: its inside UID on the left, its host UID on the right, and between them an
  arrow labelled with the map line that translates it ("no line", dashed, for an unmapped owner). The grid places
  every cell explicitly, so rows stay aligned; on the phone the columns stack row by row (container → line → host).
- **Files store the host's number.** The disk holds the outside UID; the container's listing is computed through the
  map (rule 3 then falls out: host root's file has no line and shows as 65534).
- **One step = one action; the presets keep the task's step counts** (2, 3, 3, 2). The command strip on top says who
  runs the command (container process with its inside user, or host `student`), the command (`touch`, `ls -ln`,
  `cat`, `echo x >>`) and the result (✓, the listing outlined below, or the shell's `Permission denied` line).
- **`rootless` and `subuidStart` are live params; the script is hidden** (set by the presets, as in
  `lnx-nfs-root-squash`). Flipping either keeps the step, so the lecturer can show the same action rootful or with
  the range at 200000: `service-user` step 1 with 200000 gives 200032; `host-file-inside` rootful lets container root
  read the `0600` file (rule 6).
- **Rootful map drawn as the kernel prints it**, `0 0 4294967295`, with "no user namespace: the host's own map"; the
  `/etc/subuid` line stays, dashed, "not used".
- **Processes in both `ps` views.** The task's scene names `ps -o user,pid`; the page shows `ps -o user,pid,comm`
  (the command name links a row to its process). Host names: `student` for 1000, none for 100032 and 100999 ("no
  name"); rootful, the container's `app` (1000) is `student` on the host, which the stage shows without comment.
- **`/data` is `0777`** (not drawn): a bind-mounted directory owned by `student` would be root's inside and refuse
  `www` (33) a create. The task's presets need every create to pass, so the directory's mode is out of the picture.
- **Group IDs mirror UIDs** (every file's group is its owner's own group, the gid map is the uid map), so the group
  class never decides and the page shows only the owner column of `ls -ln`. One sentence in the explanation says
  groups follow the same rule (task: out of scope).
- **Captions by case:** create (line 1 of count 1: "maps exactly one ID"; line 2: the task's sentence verbatim with
  the numbers from the state; rootful: "nothing is translated"), host `ls` (own UID / subordinate number with no
  name / root's file), container `ls` (unmapped 65534 and "not 'no owner'"), refused read (capability does not reach
  an unmapped owner), refused write (two different users; "enter the container's namespace" when the owner is
  mapped). The three misconceptions of the task are in the explanation, and each has a caption that shows it.
- **No tool names.** "the container engine" is not even needed on the page; the helper programs that write the map
  (newuidmap) are not named. Commands shown are the ones whose output is the subject (`ls -ln`, `cat`, `touch`,
  `uid_map`, `/etc/subuid`).
- **Preset entries** in `sim.json`: `service-user` and `host-file-inside`, the two misconceptions besides the title's.
- **Model reuse.** `lnx-namespaces` is not in `models/`, and its model (PID, network and mount namespaces) has nothing
  this one needs; the page reuses its layout idea, the C badge and hatching, its PID 4321 and the `rich()` caption
  helper (copied into `index.html` with a comment). `defaultMap`, `checkMap`, `toOutside`, `toInside` and `access` are
  pure and promotable unchanged. The nine-bit helpers (`classBits`, `lsString`, `octal`) are written here in a few
  lines, the same as `lnx-permissions-rwx`'s.
- Tags: `containers`; topic `linux-admin`; level `advanced` (the task's). All exist in `tags.json`. `related`:
  `lnx-namespaces`.
- Suggested `learn.json` leaf: next to `lnx-namespaces` (containers under linux/system, wherever the coordinator put
  it), and under security/access/unix beside `lnx-nfs-root-squash` (both are "a number means another user").

## Deviations from the task

- **`/data` mode `0777`** and the group column left out (above).
- **Process names** `sh`, `web`, `app` (the task names the users `root`, `www`, `app`, not the processes).
- **Host file** in `host-file-inside` is `/data/secret` (the task names none); files created are `a`, `b`, `c` as the
  task says.
- **Step contents** where the task gives only counts: `root-inside` create, host `ls`; `service-user` create, host
  `ls`, host `student` appends (refused); `host-file-inside` host `ls`, container `ls`, container root `cat` (refused);
  `rootful` create, host `ls`.

## Sources

- user_namespaces(7) (man-pages, read on nuc 2026-11-12): "User and group ID mappings: uid_map and gid_map" (the line
  format, `0 0 4294967295` in the initial namespace), "Defining user and group ID mappings: writing to uid_map and
  gid_map" (ranges may not overlap), "Unmapped user and group IDs" (overflow ID 65534), "Effect of capabilities
  within a user namespace", "Accessing files", "Operation of file-related capabilities" (the file's user ID and group
  ID must both be mapped).
- subuid(5): `student:100000:65536` format.
- NLA `meta/toc.md` T17 ("Kontejneri bez `root` ovlasti — što se time dobiva, a što ne") and T11 (namespaces,
  cgroups, capabilities); no chapters yet.
- UL ch07 "Tko ste vi za sustav" (UID, root = 0) for the vocabulary; `kit/glossary.js` *capability* — sposobnost.
- The engine's default map (`0 1000 1`, `1 100000 65536`) *(check: the engine's documentation was not read; the map
  itself was run on the kernel, below)*.

## Term pairs

From the glossary: *process* — proces, *capability* — sposobnost. Missing from `kit/glossary.js`, written out in the
tables (the HR captions write *user namespace* (korisnički imenski prostor) inline, as `lnx-namespaces` does with
*namespace*):

| en | hr |
|---|---|
| user namespace | korisnički imenski prostor *(check)* |
| UID mapping | preslikavanje identifikatora *(check)* |
| subordinate ID range | podređeni raspon identifikatora *(check)* |
| rootless container | kontejner bez `root` ovlasti (NLA toc T17) |
| overflow ID | zamjenski broj *(check)* |

## Shared requests

- **Kit: `[hidden]` on a control** (as `lnx-permissions-rwx`, `lnx-logrotate` and `lnx-nfs-root-squash` asked):
  `.sd-ctl { display: flex }` beats `hidden`; the page carries the one-line workaround for the hidden `script` param.
- **Glossary:** the term pairs above, `"src": "simdeck"`.
- **Models:** if `lnx-container-volumes` or another §5.17 sim needs UID translation, promote `toOutside`, `toInside`,
  `checkMap` and `access` to `models/userns.js`.

## Checks

- **Run on the real kernel** (nuc, Linux 6.8, 2026-11-12): unprivileged `unshare --user --map-root-user` (map
  `0 1000 1`): a file created as root inside is 1000 outside; `/etc/shadow` (host 0) lists as 65534 inside and `cat`
  is refused. Then the full rootless map, in a throwaway privileged container (local `debian:bookworm-slim` image, no
  pull; nothing on the host touched): a new user namespace with `0 1000 1` / `1 100000 65536` written to its
  `uid_map` and `gid_map`; inside root, `setpriv` UID 33 and UID 1000 each created a file in a `0777` `/data` owned by
  1000. Host `ls -ln`: 1000, 100032, 100999; inside: 0, 33, 1000. Host root's `0600` file: 65534 inside, inside root
  `cat` → Permission denied. Inside root appending to 100032's file: allowed. Host UID 1000 appending to it:
  Permission denied. A host UID 2000 file: 65534 inside. UID 65536 inside → 165535; UID 65537 → `setresuid` EINVAL
  (unmapped). Overlapping maps `0 1000 1`+`0 100000 65536` and `0 1000 1`+`1 1000 5`: both refused with EINVAL.
  Without a user namespace, root's file: owner 0. Every number equals SPEC.md's table.
- Numbers printed from the model for every preset and the cross-checks before the page was written; equal to the
  kernel run.
- Rule tests broken on purpose with a script, one mutation at a time (38): overlap checks removed or off by one,
  count 0 allowed, the 32-bit range unchecked, last line first, count inclusive (both ways), offset forgotten (both
  ways), line 2 from 0, root on the subordinate range, count 65535, the subuid start ignored, unmapped as 0 or passed
  through, overflow 65535, capability everywhere / nowhere / for every process / by inside UID, root inside as host
  root, owner bits for everyone, any letter instead of all, the host user owning its subordinate IDs, rootful map
  rootless, host root not passing, identity count, a new file owned by the inside UID, mode 0666, `isNew` kept, the
  container's `ls` not marking lines, the host listing named from the container's passwd, the host PID, the
  `rootful` preset rootless, the host file's mode, a write needing `r`, `'false'` as true. All **38** fail a test
  (the first run missed three; tests added).
- Browser (Playwright, the unbuilt page from `file://`): every preset at its deciding step in hr and en at 1920×1080
  and 375×812, no console errors, the stage within its box. Fixed from the screenshots: cells auto-placed around the
  background panels (every cell now has its row and column), the `line 1` label wrapping in the map table, the file
  row wrapping, the phone order of the top rows.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against user_namespaces(7),
  ran 48 mutations of its own on a copy, and swept the page over 4 presets × rootless × subuidStart × every step × hr
  and en, 112 loads: no console errors, no empty or unfilled captions, every caption's numbers agree with the stage).
  No model defect. Fixed from it: host steps marked no map line although SPEC's table gave one (now the line that
  covers each listed or touched file is marked on both sides); the capability sentence and `cls_cap` said "owner
  mapped" (now "owner and group", as the man page says); SPEC's scene listed a GID column the page does not draw;
  `bash:` in the error line (now `sh:`); the dead `arrowSame`; "UID 0" and "root (0)" written into three captions
  (now from the state); the `rootful` goal that read wrong with the switch turned on; two Croatian phrasings. Tests
  added for its gaps: `used` per step on host steps (not accumulated), `changed` on a read and a write, the inside
  32-bit bound. Of its 48, all but 3 now fail a test; the 3 are equivalent (an extra name in the container's passwd,
  the host actor's unused inside UID, a write needing `rw` where the only write is refused anyway). Mine: 37 of 37
  (one of the 38 no longer applies to the changed code). Kept on purpose: `capAccessOk`, `capDenied` and
  `capLsCMapped` are fallbacks no script reaches today; `capCreateSub` keeps the task's "belongs to nobody there"
  verbatim (the HR „ne pripada nikome“ is unambiguous).

## Time

Start 2026-11-12 19:32, done 19:55 (CET), about 23 minutes, one session, including the fresh review and the kernel run.
