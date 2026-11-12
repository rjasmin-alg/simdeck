<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-nfs-root-squash: spec

One concept: **the server, not the client, decides who you are**. A client user sends requests to an NFS export;
the request carries only numbers, and the server's export options and its own permission bits decide.

Task: `docs/tasks/w3/lnx-nfs-root-squash.md`. Book: UL ch18 "Datoteke koje stoje na drugom stroju" ("Što se izvozi",
"Druga strana", "Mjerilo: tko je korisnik", "Sedam opcija koje nitko nije napisao") and Primjer 5. Man page:
exports(5) from nfs-utils, "User ID Mapping" (read on nuc, 2026-11-12). RFC 5531 §8.2 / appendix A (AUTH_SYS
carries `uid`, `gid` and `gids`, all numbers); RFC 7530 and RFC 8881 (NFSv4.0 and 4.1; the book's mount is `nfs4` and the book cites RFC 8881).

## Scene

- **Client** (left): `democli1`, its `/etc/passwd` excerpt (`root 0`, `bin 1`, `student 1000`), the mount
  (`192.168.180.1:/srv/zajednicko` on `/mnt/sa-posluzitelja`), the user who runs the command and the command; under
  it the result the client sees: the output, or the error message and exit status 1.
- **Request** (middle): an envelope with only `uid=… gid=…`, `sec=sys` and the operation with the file name. Under
  it the server's five phases (a)–(e), each passed ✓, refused ✗ or not reached (hatched).
- **Server** (right): `demosrv1` (192.168.180.1), its `/etc/passwd` excerpt (`root 0`, `bin 1`, `ana 1000`,
  `nobody 65534`), the export line as `exportfs -v` prints it, and the export's files: name, owner (number and the
  server's name for it), group, mode (`ls -l` letters and octal). The export's directory itself is the first row
  (`.`), because creating a file is a write to the directory.

## State

`{ export: { ro, squash, anonuid, anongid }, dir: { uid, gid, mode }, files: [{ name, uid, gid, mode, isNew }],
request: { clientUser, uid, gid, op, name } | null, mapped: { uid, gid, kind } | null, phases, check, result, log }`.

- `phases`: `{ send, export, map, perm, apply }`, each `'ok' | 'refused' | 'skipped'` (`null` at step 0).
- `check`: the permission check of phase (d): `{ target: 'file' | 'dir', name, cls: 'root' | 'owner' | 'group' |
  'others', need, bits, ok }`, or `null` when phase (d) is not reached.
- `result`: `{ ok, errno: null | 'EROFS' | 'EACCES', exit: 0 | 1, owner: { uid, gid } (create only), content }`.
- `log`: one line per request so far `{ n, clientUser, op, name, errno }`.
- `dir` is an addition to the brief's state: without it, phase (d) of a create has nothing to check (see Deviations).

## One step

One request from the preset's script. A step runs all five phases of that request:

- (a) **send**: the client puts its user's numeric uid and gid in the request (AUTH_SYS, `sec=sys`). Names are not
  sent.
- (b) **export**: a write (`create`, `write`) on an `ro` export is refused with `EROFS`, "Read-only file system".
  Nothing after it runs.
- (c) **map**: the export's squash option maps the ids (rules 3–5).
- (d) **permission check**: the ordinary owner → group → others check (`lnx-permissions-rwx`, `lnx-access-decision`)
  with the **mapped** ids; mapped uid 0 passes it (root). `read` needs `r` on the file, `write` needs `w` on the
  file, `create` needs `w` and `x` on the export's directory. Refused: `EACCES`, "Permission denied".
- (e) **apply**: `read` returns the content; `write` changes nothing visible; `create` adds the file with the
  **mapped** uid and gid as owner and mode `0644` (the client asks for `0666`, its umask `022` clears group and
  others' `w`; `lnx-permissions-rwx` rule 5).

Search permission (`x`) on the directory for `read` and `write` is not drawn: every directory in the scripts has `x`
for others, so it never decides.

## Rules

1. **Numbers, not names.** The request carries `uid` and `gid` as numbers; the server reads them as whoever owns that
   number in its own `/etc/passwd`. Client `student` (1000) is server `ana` (1000). (ch18 "Mjerilo: tko je
   korisnik"; exports(5) "nfsd bases its access control … on the uid and gid provided in each NFS RPC request";
   RFC 5531 AUTH_SYS.)
2. **`ro` refuses every write**, `sudo` on the client too; the error is "Read-only file system" (`EROFS`), exit 1.
   Reads still work. (ch18 "Druga strana": `sudo touch …/moje.txt` → `Read-only file system`, exit 1; exports(5)
   `ro`/`rw`.)
3. **`root_squash`** (the default): uid 0 → `anonuid`, gid 0 → `anongid`, both 65534 (`nobody`) by default. No other
   id is touched: `bin` (1) stays 1, group `staff` would stay. Uid and gid are mapped separately (a uid 1000 with gid
   0 would keep 1000 and get gid 65534; no script uses it). (ch18; exports(5) `root_squash`, "By default, exportfs
   chooses a uid and gid of 65534 for squashed access".)
4. **`no_root_squash`**: nothing is mapped; uid 0 is root on the export. (ch18 "Sedam opcija koje nitko nije
   napisao"; exports(5).)
5. **`all_squash`**: every uid and gid → 65534, 1000 and 0 alike. (ch18; exports(5) `all_squash`, "Useful for … public
   … directories".)
6. **Then the bits.** After mapping, the permission check of `lnx-permissions-rwx` decides: the first class that
   matches (owner if the uid matches, else group if the gid matches, else others) decides with its three bits; uid 0
   passes. Squashed root is "others": it cannot read `tajna` (owner 1000, `0600`), which client uid 1000 can.
   (Derived from rules 3 and the bit check; `lnx-access-decision` rules on class order.)
7. **Tie-break: the export check comes first.** On an `ro` export a write is refused before mapping and bits are
   looked at, even when the bits would allow it (client root under `no_root_squash`, or a file mode `0666`): the
   mapping and the check are drawn "not reached". (Task rule 7.) This is the order of the *outcome*, not of the
   code: Linux nfsd sets the mapped ids while it verifies the file handle (`nfsd_setuser` in `fh_verify`) and tests
   the read-only export later (`nfsd_permission`). The result does not depend on the mapping, so the page draws the
   export check first, and the caption says "whatever number the request carries", not "before it looks at the
   number". *(check: from the fresh review, nfsd source not re-read for this task.)*
8. **A new file gets the mapped ids as owner.** Created by squashed root: owner 65534 `nobody`; by client `student`
   without squashing: owner 1000, which the server lists as `ana`. (Derived from rules 1, 3, 5; exports(5).)

The squash option shown in `exportfs -v`: `root_squash,no_all_squash` (default), `no_root_squash,no_all_squash`,
`root_squash,all_squash` (exports(5): `all_squash` does not turn `root_squash` off; the book's listing shows the
default pair). The other words of the book's listing (`sync,wdelay,hide,no_subtree_check,sec=sys,secure`) are shown
dimmed: they are out of scope.

## Params

- `ro`: toggle, default **on** (the book's export).
- `squash`: `root_squash` | `no_root_squash` | `all_squash`, default `root_squash`.
- `script`: which list of requests and files (hidden; set by the presets), default `book-ro`.
- `anonuid`/`anongid`: fixed 65534 (exports(5) default; on the book's RHEL machine 65534 is `nobody`; Debian calls
  group 65534 `nogroup`, the page uses `nobody` for both, as the task does).

Changing `ro` or `squash` keeps the step (no reset), so the lecturer can flip `ro` or the squash option on the same
request and see the answer change.

## Presets and expected numbers

Server files (owner uid gid, mode) and the export directory per script; each step's request and result with the
script's own export (the preset's `ro`/`squash`).

| # | Preset | Export | Dir `.` | Files |
|---|---|---|---|---|
| 1 | `book-ro` | `ro`, `root_squash` | 0 0 `0755` | `proba.txt` 0 0 `0644` |
| 2 | `root-squashed` | `rw`, `root_squash` | 0 0 `0777` | `tajna` 1000 1000 `0600` |
| 3 | `uid-collision` | `rw`, `root_squash` | 0 0 `0777` | `plan.txt` 1000 1000 `0600` |
| 4 | `no-root-squash` | `rw`, `no_root_squash` | 0 0 `0755` | `tajna` 1000 1000 `0600` |
| 5 | `bin-not-squashed` | `rw`, `root_squash` | 0 0 `0755` | `alati` 1 1 `0644` |
| 6 | `all-squash` | `rw`, `all_squash` | 0 0 `0777` | `tajna` 1000 1000 `0600` |

| Preset | Step | Client user (uid gid) | Op | Mapped | Check | Result |
|---|---|---|---|---|---|---|
| `book-ro` | 1 | student (1000 1000) | read `proba.txt` | 1000 1000 (`ana`) | others `r--` ✓ | content "podatak s posluzitelja", exit 0 |
| | 2 | root (0 0) | create `moje.txt` | not reached | not reached | `EROFS` "Read-only file system", exit 1 |
| `root-squashed` | 1 | root (0 0) | create `a.txt` | 65534 65534 | dir others `rwx` ✓ | `a.txt` owner 65534 `nobody`, `0644` |
| | 2 | root (0 0) | read `tajna` | 65534 65534 | others `---` ✗ | `EACCES` "Permission denied", exit 1 |
| | 3 | student (1000 1000) | read `tajna` | 1000 1000 (`ana`) | owner `rw-` ✓ | content, exit 0 |
| `uid-collision` | 1 | student (1000 1000) | read `plan.txt` | 1000 1000 (`ana`) | owner `rw-` ✓ | content, exit 0 |
| | 2 | student (1000 1000) | write `plan.txt` | 1000 1000 (`ana`) | owner `rw-` ✓ | exit 0 |
| | 3 | student (1000 1000) | create `biljeska.txt` | 1000 1000 (`ana`) | dir others `rwx` ✓ | owner 1000 `ana`, `0644` |
| `no-root-squash` | 1 | root (0 0) | create `b.txt` | 0 0 (`root`) | root ✓ | owner 0 `root`, `0644` |
| | 2 | root (0 0) | read `tajna` | 0 0 (`root`) | root ✓ | content, exit 0 |
| `bin-not-squashed` | 1 | root (0 0) | write `alati` | 65534 65534 | others `r--` ✗ | `EACCES`, exit 1 |
| | 2 | bin (1 1) | write `alati` | 1 1 (`bin`) | owner `rw-` ✓ | exit 0 |
| `all-squash` | 1 | student (1000 1000) | create `biljeska.txt` | 65534 65534 | dir others `rwx` ✓ | owner 65534 `nobody`, `0644` |
| | 2 | student (1000 1000) | read `tajna` | 65534 65534 | others `---` ✗ | `EACCES`, exit 1 |

Steps: 2, 3, 3, 2, 2, 2 (the task's). `sim.json` `steps` is the default script's, 2.

Cross-checks pinned in the tests (the params change, the script stays):

- `book-ro` step 2 with `no_root_squash` and `ro`: still `EROFS` (rule 7). With `ro` off the directory decides
  (`0755`, owner root): under `root_squash` squashed root is others, `r-x`, no `w` → `EACCES`; under
  `no_root_squash` root passes → `moje.txt` created, owner 0.
- `root-squashed` with `no_root_squash`: step 1 `a.txt` owner 0; step 2 reads `tajna`.
- `root-squashed` with `all_squash`: step 3 (student) → 65534, `EACCES` on `tajna`.
- `bin-not-squashed` with `all_squash`: step 2 (bin → 65534) `EACCES`.
- `uid-collision` with `ro`: steps 2 and 3 `EROFS`, step 1 still reads.

Sources for the derived presets: rules above. Numbers are the model's; the book shows only `book-ro` as a real run.
*(check: presets 2–6 were not run against a real export; nuc's NFS server serves another project and was not
touched.)*

## Legend

Client user (person with a number), request envelope (numbers only), mapping arrow (`0 → 65534`, labelled with the
option), server file row (owner, mode), refused (✗ with the message), new file (outlined, "new"), changed
(highlight: the mapped id when it differs from the sent one, the created file, the phase that refused).

## Captions

Two sentences: what the server made of the number (the mapping), then what happened (the result). The task's
caption is the `root_squash` mapping sentence, verbatim. Mapping kinds: `notReached` (export refused),
`squashedRoot`, `squashedAll`, `rootKept`, `collision` (uid kept, the server's name differs), `keptSystem` (uid kept,
1–999, under `root_squash`), `kept`.

## Out of scope

Kerberos (`sec=krb5`), NFSv4 owner names (`idmapd`), SMB (one sentence in the explanation, as ch18), `secure`,
`subtree_check`, SELinux booleans, supplementary groups (AUTH_SYS `gids`), the client's own cached access check.
