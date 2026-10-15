<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-selinux-decision: notes

New stepper (task `docs/tasks/w2/lnx-selinux-decision.md`, catalogue `lnx-selinux-decision`, wave 2b). There is no kit
"decision path" view, so the page draws the path in HTML (five boxes with arrows); the policy's allow table is kit view
**K4** (`Simdeck.ruleTable`, mode `first`, implicit "no rule matches" row). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Three scenes, one param** (`scene`): `port` (sshd binds TCP 8991, the book's run), `keys` (sshd reads
  `authorized_keys` after `cp` to `/tmp` and `mv` back), `secret` (a user reads someone else's file in `/tmp`). The four
  task presets are scene + fix + dacOk combinations.
- **`fix` is scene-agnostic**: `none`, `relabel` (`semanage port -a` for the port, `restorecon -v` for a file),
  `setenforce` (`setenforce 0`, retry, then back to enforcing, retry). `undo` (visible only with `setenforce`) picks
  `setenforce 1` (preset 2, the book) or a **reboot**, so the task's rule 8 tie-break (the boot mode comes from
  `/etc/selinux/config`) can be shown on the page, not only in the tests.
- **`dacOk` applies only to `secret`** (the task: "toggle (preset 4)"); it is disabled with a reason elsewhere. For
  `keys` a cleared read bit would also stop the `cp` the scene starts with; a port has no mode bits.
- **Every attempt has the same shape**: attempt, DAC, [MAC if DAC yes], [mode if MAC no], outcome. Gates not asked show
  "– not asked" (dashed, muted); the policy table is dimmed with a note when DAC refused.
- **The mode box reads as a gate**: enforcing a "no" is drawn as a closed gate (✕ enforces and logs), permissive as an
  open one (✓ lets it through, logs it). The switch shows the current mode; "at boot:" shows `/etc/selinux/config`.
- **Commands, contexts, types, paths, user names and mode names are data** (`translate="no"`, monospace). In caption
  strings, `backticked` parts are rendered as code by the page (`rich()`), so `ls -Z` never breaks at its hyphen.
- **What the admin sees** (port scene): `systemctl is-active sshd` → `active` throughout, `ss -tlnp` (changes only at an
  outcome), `semanage port -l | grep ssh_port_t` — the three outputs the book reads. The keys scene shows the key login
  result; the secret scene `cat`'s output or `Permission denied` (same message SELinux would give for a file: only the
  audit log tells the layers apart, UL15 Primjer 4).
- **Audit log**: the AVC fields the book extracts (`denied { perm }`, `comm`, `src=`/`name=`, `scontext`, `tcontext`,
  `tclass`, `permissive=`); the new record is highlighted and wrapped, older ones stay on one line; `permissive=1` is
  boxed.
- **The policy table drops the per-row action** ("allow" on every row; the title says "allow rules") so the K4 table and
  its sticky mark column fit beside the object column at 1920×1080.
- **UID in the keys scene is 1000**: OpenSSH reads `authorized_keys` with the user's UID, so gate 1 checks the owner
  triplet *(check: from memory of OpenSSH, not re-read)*.
- **The combination rule is a pure `decide(dac, mac, enforced)`**, so "MAC can only take away" is testable on its own
  (in the frames the policy is never asked after a DAC "no", so a mutation there was otherwise invisible).

## Deviations from the task

- **Step counts**: the task lists 9 / 9 / 7 / 3. Here every attempt has the same five phases (fewer when a gate is not
  asked), so `sshd-8991` is **10** (the retry's MAC and outcome are separate steps), `permissive-switch` **17** (it
  includes the `setenforce 1` retry the task's preset describes), `mv-label` **12** (the `cp` and `mv` steps, both
  attempts), `dac-first` **3**. All ≤ 20. Defaults (no fix) are 5 steps, `sim.json` `steps`.
- **`fix` options**: the task names none / `semanage port -a` / `restorecon` "per preset"; here `relabel` picks the
  right one per scene, and `setenforce` is a third option (preset 2's action). `undo` is an addition (rule 8 on the
  page).
- **Policy rows 3 and 4** (`sshd_t etc_t:file read`, `unconfined_t user_tmp_t:file read`) are plausible excerpts, not
  from the book *(check)*.
- **The `secret` scene** (`/tmp/plan.txt`, owner `ana`) is the task's preset 4, derived.

## Sources

- `uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md`, "SELinux: načini rada, konteksti i čitanje
  odbijanja" ("Što treba znati": definitions, `sestatus`, `/etc/selinux/config`, `-Z` contexts, the sshd-on-8991 run
  with `is-active`, `ss`, `ausearch`, `semanage port -l/-a`, `setenforce 0/1`; "Šire o temi": booleans, `cp`/`mv`/
  `restorecon`), and "Primjer 4 — tri odbijenice, tri različita ispisa". Its footnotes cite selinux(8),
  selinux_config(5), setenforce(8), semanage-port(8), restorecon(8), ausearch(8), The SELinux Notebook.
- `uvod-u-linux/assets/diagrams/chapter-15/dozvola-i-politika.svg` and `tri-mjesta-koja-kazu-ne.svg`: the two-checks
  framing and "who sets the answer". Nothing copied.
- Linux `fs/namei.c` `inode_permission()` (mode bits before the LSM hook) *(check: from memory)*.

## Checks

- Numbers printed by a script from the model before the page was written (every preset, defaults, start permissive,
  `secret` with dacOk on and off, `setenforce` on a DAC denial, the reboot variant); asserted in `sim.test.js`.
- **Not run on an SELinux machine** *(check)*: the port and label numbers are the book's own runs; the keys denial,
  the policy rows 3–4 and the `secret` scene are derived.
- **Mutations**: 25 one-at-a-time mutations of `sim.js` with a script (DAC not first, MAC granting over DAC, permissive
  enforced / not logged / wrong flag, the mode changing the lookup, the user field instead of the type, semanage not
  applied, cp keeping the label, mv relabelling, restorecon replacing the whole context, setenforce writing the config,
  reboot keeping the current mode, last match instead of first, the lookup ignoring perm, the group class, the wrong
  bit, the port check, no `name=`, the listen set, a mode step after a MAC yes, an attempt not resetting, `undo`
  ignored, `dacOk` ignored, "changed" on a no-op setenforce): all **25** fail a test (one survived at first, MAC
  granting over DAC; `decide()` and its test were added).
- `npm run gate -- lnx-selinux-decision`: pass (manifest, tests, build, 63 browser checks, tokens, scope). Screenshots
  at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed; plus every preset at its key steps with a local
  Playwright script. Fixed from them: the mode switch clipped (now vertical), the policy table overflowing with the mark
  column cut off (sticky mark, no per-row action, wider column), the `ls -l` line wrapping in gate 1, commands breaking
  at hyphens in captions, the kit's changed ring covering neighbouring terminal lines, a 13.6 px badge on the phone.

- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against UL ch15, ran 28
  mutations of its own, 4 survived). Fixed from it: tests for the "other" triplet differing from the group's, the port
  boundary 1023/1024, `decide()` with the mode not yet asked (the fourth survivor, a no-op `semanage` marking
  "changed", is unreachable); SPEC notes on user private groups, the UID-blind port check, and DAC "no" → capability
  check for privileged processes; "the only trace is the AVC record" (sshd's own log also has it; now "none of these
  outputs says why"); "if they say no, nothing is logged" scoped to an ordinary user reading a file; Croatian "spada u
  „vlasnik”, a oni imaju", "ne su rekle", "`ssh_port_t` nosi 22" (the port carries the label), "Dozvole kažu ne prve",
  "provjeravaju se prve"; explanation sentences starting with a glossary term; "prekidače, policy boolean, koji";
  `/tmp` as code.

## Term pairs

All from `kit/glossary.js` (`src: uvod-u-linux`): *mandatory access control*, *policy*, *SELinux mode*, *security
context*, *AVC denial*, *policy boolean*, *file permission* (dozvola). "Discretionary" is written out in the
explanation ("diskrecijska"); no glossary entry needed.

## Shared requests

- K4 (`ruletable.js`): a way to leave the action column out entirely (here every row is an allow rule; an empty
  `actionLabel` and empty actions still draw a narrow column).

## Time

Start 2026-10-15 10:39, done 11:02 (CEST): about 23 minutes, one session, including the fresh review.
