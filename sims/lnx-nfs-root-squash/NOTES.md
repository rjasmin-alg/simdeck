<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-nfs-root-squash: notes

New stepper (task `docs/tasks/w3/lnx-nfs-root-squash.md`, catalogue `lnx-nfs-root-squash` §4.4, wave 3). No kit view
fits (three panels of tables and a pipeline of phases; K1 would draw one arrow and lose the server's tables), so the
page draws its own in HTML. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Three panels and a result line.** Client `democli1` (its `/etc/passwd` excerpt, the mount, the command line),
  the request (an envelope with only `uid=… gid=…`, `sec=sys` and the operation) above the server's five phases
  (a)–(e), and server `demosrv1` (its `/etc/passwd`, the export line as `exportfs -v` prints it, the export's files).
  The bottom line says what the client sees (output or the error and the exit status) and what changed on the server.
- **One step = one request; all five phases are drawn in that step**, each ✓ passes, ✗ refused (red frame,
  highlight), or "not reached" (dashed and hatched). This keeps the task's step counts (2/3/3/2/2/2).
- **`ro` and `squash` are live params; the script is hidden.** The presets set the script (requests and files) with
  its export; the lecturer can then flip `ro` or the squash option on the same request and the answer changes at the
  same step (no reset). That is the "what if" the concept needs: `book-ro` step 2 with `no_root_squash` is still
  `EROFS` (rule 7), with `rw` it is `EACCES` on the directory under `root_squash` and created by root under
  `no_root_squash`.
- **The export's directory is a row (`.`).** Creating a file is a write to the directory, so phase (d) of a create
  checks `w` and `x` on it. The book's `sudo mkdir` gives `0755` owned by root, which refuses squashed root; the
  task's `root-squashed` and `all-squash` presets need a writable directory, so those scripts use `0777` (stated on
  the page in the row itself). See Deviations.
- **Mapping kinds drive the caption's first sentence** (`squashedRoot`, `squashedAll`, `rootKept`, `collision`,
  `keptSystem`, `kept`, or "not reached" on `ro`); the second sentence is the result (bits of the deciding class, or
  the new file's owner). The task's caption is the `squashedRoot` sentence verbatim (`{opt}` is `root_squash`, or
  `all_squash` when that is the option in force).
- **`collision` everywhere uid 1000 is sent unsquashed**, `book-ro` step 1 included: the server's 1000 is `ana`, so
  the caption says so even on the book's plain read. True, and it repeats rule 1 on the first request.
- **Command lines are the book's.** `cat`, `sudo touch` and `[student@democli1 …]$` come from ch18 ("Druga strana");
  a write is `echo ok >> file` (as `student` or `bin`) or `echo ok | sudo tee -a file` (as root through sudo), so the
  error line is what a shell prints (`bash: alati: Permission denied`, `tee: …`). Error messages and commands are
  data (`translate="no"`); the explanation names no tool beyond NFS, SMB and the option words, which are the subject.
- **Server names.** The task's scene: `root 0`, `ana 1000`, `nobody 65534`; `bin 1` is added on the server too, so
  the `bin-not-squashed` preset can show the owner's name. Group 65534 is shown as `nobody` (RHEL, the book's
  machine; Debian calls it `nogroup`).
- **`exportfs -v` line:** `sync,wdelay,hide,no_subtree_check,sec=sys,ro|rw,secure,<squash pair>`, the book's order.
  Out-of-scope words are grey; `ro`/`rw` and the squash pair are framed and highlighted when they decide. For
  `all_squash` the pair is `root_squash,all_squash` (exports(5): `all_squash` does not replace the default
  `root_squash` word).
- **Files table on the phone** shows the octal mode instead of the `ls -l` letters (the letters wrapped).
- **Preset entries** in `sim.json` for `uid-collision` and `bin-not-squashed`: the two misconceptions the task names
  ("NFS checks user names", "`root_squash` makes the export safe").
- **The `ro` sentence has two forms:** with sudo ("so sudo on the client changes nothing", the book's case) and
  without ("so the file's permission bits change nothing"), chosen by whether the request came through sudo.
- **Model reuse.** `lnx-permissions-rwx` is not in `models/` and has no access check; the nine-bit helpers (`bit`,
  `octal`, `lsString`) are copied from `sims/lnx-permissions-rwx/sim.js @ 33e6114` with a comment, and the
  owner → group → others check is written here (`permCheck`), the same order as `lnx-access-decision` without ACLs.
  `mapIds`, `exportCheck` and `permCheck` are pure and promotable.
- Tags: `file-sharing`; topic `linux-admin`; level `intro` (the task's). All exist in `tags.json`.

## Deviations from the task

- **The directory `.` and its mode** are added to the state (`dir`) and the scene; without them the creates have
  nothing to check. Scripts `root-squashed`, `uid-collision` and `all-squash` use a `0777` directory, the others the
  book's `0755`.
- **`root-squashed` step 1 file name** is the task's `a.txt`; `no-root-squash` creates `b.txt`; `uid-collision` and
  `all-squash` create `biljeska.txt`; `bin-not-squashed` writes `alati` (the task names none of these).
- **`bin-not-squashed` step 1** is client root writing `alati` (refused: squashed to others, `r--`), then step 2 `bin`
  writing it (allowed). The task describes the `bin` write; the root write is the contrast in the same two steps.
- **`uid-collision`** steps: read `plan.txt`, append to it, create `biljeska.txt` (owner 1000, which the server lists
  as `ana`). The task says "reads and edits ana's files as his own".

## Sources

- `uvod-u-linux/book/chapters/18-mrezne-usluge.md`, "Datoteke koje stoje na drugom stroju": "Što se izvozi"
  (`/srv/zajednicko 192.168.180.0/24(ro,sync)`, `exportfs -v` with nine options, `proba.txt` "podatak s
  posluzitelja"), "Druga strana" (`mount -t nfs`, `cat`, `sudo touch` → `Read-only file system`, exit 1, "Odluka nije
  donesena na klijentu nego na poslužitelju"), "Mjerilo: tko je korisnik" (`root_squash` and `bin`/`staff`, numbers not
  names, uid 1000 on both sides, SMB by name), "Sedam opcija koje nitko nije napisao" (`no_root_squash`, `all_squash`,
  `no_all_squash` default), Primjer 5. The book's own demosrv1 also has a user `student`; the task renames the server's
  1000 to `ana` to show rule 1.
- exports(5), nfs-utils, read on nuc 2026-11-12: "User ID Mapping" (uid/gid in each RPC request; root squashing the
  default; anonymous uid and gid 65534 by default; `root_squash` does not apply to `bin` or `staff`; `all_squash`;
  `anonuid`/`anongid`).
- RFC 5531 (ONC RPC, AUTH_SYS: `uid`, `gid`, `gids`, all numeric); RFC 7530 (NFSv4; owner names and `idmapd` out of
  scope).
- `sims/lnx-permissions-rwx` (nine bits, umask 022 → new file `0644`), `sims/lnx-access-decision` (class order).
- **Not run on a real export** *(check)*: presets 2–6 are derived from the rules above. nuc runs an NFS server that
  exports another project's snapshot, so no test export was added to it unattended. A loopback run (export a scratch
  directory to 127.0.0.1 with each option, mount it, run the six scripts as root, `bin` and uid 1000) would confirm
  the numbers; see the report.

## Term pairs

From the glossary: *export* — izvoz, *mounting* — montiranje, *share* — dijeljeni resurs, *file permission* — dozvola.
Missing from `kit/glossary.js`, written out in the tables (Croatian from UL ch18 and the task):

| en | hr |
|---|---|
| user identifier (UID) | korisnički identifikator *(check)* |
| root squashing | preslikavanje korisnika `root` *(check)* |
| anonymous user | anonimni korisnik |
| read-only file system | datotečni sustav samo za čitanje *(check)* |

## Shared requests

- **Kit: `[hidden]` on a control** (as `lnx-permissions-rwx` and `lnx-logrotate` already asked): `.sd-ctl { display:
  flex }` beats `hidden`; the page carries the same one-line workaround for the hidden `script` param.
- **Glossary:** add the term pairs above with `"src": "simdeck"`.
- **Models:** promote the nine-bit helpers and an owner → group → others `permCheck` (this sim's, or
  `lnx-access-decision`'s `check` without ACLs) to `models/`, so the three Linux permission sims share one copy.

## Checks

- Numbers printed from the model for every preset and the cross-checks before the page was written; equal to
  SPEC.md's table.
- Rule tests broken on purpose with a script, one mutation at a time (33): ro check removed, ro refusing reads, the
  map before the export check, `root_squash` mapping nothing / only uid / every uid under 1000 / gid by uid,
  `all_squash` only root, `no_root_squash` squashing, `anonuid` ignored, anon default 0, the check with the sent ids,
  no root bypass, gid 0 as privilege, group before owner, any class granting, `some` for `every`, create needing only
  `w` or nothing, write needing `r`, the new file owned by the sender, mode 0666, `isNew` kept, the owner's gid from
  the uid, exit always 0, `collision` and `keptSystem` lost, the mapped mark lost, the `all_squash` words, a preset's
  squash, the book's directory mode, `tajna`'s mode, the server's 1000 named `student`. All **33** fail a test (the
  first run missed two; tests added).
- Browser (Playwright, the unbuilt page from `file://`): every preset at a deciding step in hr and en at 1920×1080,
  no box overflowing, no console errors. Fixed from the screenshots: the `exportfs -v` line breaking inside an option
  word, the files table running out of the server box when a new file has its tag, phase (e) cut off in the middle
  column, the mount path breaking inside `zajednicko`, the mode wrapping on the phone.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against UL ch18 and
  exports(5), ran 43 mutations of its own on a copy, and swept the page's `render()` and `caption()` over 6 scripts ×
  ro on/off × 3 squash options × every step in both languages: nothing threw, no missing keys or empty
  placeholders). No model defect. Fixed from it: the `ro` caption saying "sudo" on requests without sudo; "refuses
  before it looks at the number", which is not nfsd's code order (now "whatever number"; SPEC rule 7 note); a
  gendered `legUser`; "alati izmijenjena" (now "datoteka … je izmijenjena"); "all_squash turns every number"
  (missing object); „Anina“ capitalised; `checkRoot` "permissions are not checked" (now "the bits do not stop it");
  `[[mounting]]` inside parentheses in the HR explanation; RFC 8881 next to RFC 7530. Tests added for its
  survivors: owner by uid alone, write needing only `w`, `result.ok` on refusals, the phase states on every path,
  `changed` for a gid-only mapping, a refused and a written file, `check.name` `.` for a create, `all_squash` with
  distinct `anonuid`/`anongid`, `anonuid` 0, gid 0 matching no group, the request's gid, the log's file name.
  35 of its 43 now fail a test; the 8 left are equivalent (a directory or file mode that decides the same, `anongid`
  defaulted twice, `bin` through sudo, an index that never exceeds the script) or invisible (content on a write).
  Mine: still 33 of 33.
- `npm run gate -- lnx-nfs-root-squash`: pass (manifest, tests, build, 63 browser checks, tokens, scope).
  Screenshots at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed.
- Not checked: a real NFS export (above); a projector.

## Time

Start 2026-11-12 18:12, done 18:35 (CET), about 23 minutes, one session, including the fresh review.
