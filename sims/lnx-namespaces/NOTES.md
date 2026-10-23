<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-namespaces: notes

New stepper (task `docs/tasks/w2/lnx-namespaces.md`, catalogue §4.4, overlap §5.17). Rules and expected numbers:
`SPEC.md`. No kit view fits (K1–K4 are sequence, topology, rule table, block grid), so the page draws its own.

## Decisions

- **Scene = the container diagram for §5.17.** The command strip on top (who ran it: "host · terminal 1/2" or the
  container's shell, hatched with a C badge; the command; what it printed). Below, two panels side by side, the host's
  view and the container's view, each with three sections: processes (as `ps` in that view would list them, as a tree
  by parent), network interfaces, mounts. Under both, one bar, "One kernel", with the PID, network and mount
  namespaces it keeps. The bar is the answer to the first misconception (a container is not a VM with its own kernel):
  both panels are the same kernel's answer. `lnx-cgroups` and `lnx-overlayfs-layers` can reuse the frame: the panels
  and the kernel bar (a cgroup row or a layer stack would be another section or another bar row).
- **The container view is what the container's shell sees:** its namespaces (chips in the panel head: PID / net /
  mount, each "host" or C), its `$$`, and the processes of the procfs mounted on `/proc` in its mount namespace, not
  of its PID namespace (rule 6). So without `--mount-proc` the container panel lists the host's processes under host
  PIDs, which is the point of `no-mount-proc`. A section that shares the host's namespace says "same as the host's".
- **PID pairs only in the host view** ("4321 / 1"): the host can know both numbers; the container knows only its own,
  so its panel shows one.
- **Net and mount chips on host-PID processes only.** The `unshare` process with `--fork` is in the host's PID
  namespace but already in the new network and mount namespaces (unshare(2) moves the caller for those); its row
  says so with "net C" and "mount C" chips, and "children → C" (rule 3). Rows in the container's PID namespace are
  hatched with a C badge and carry no chips (they are in all three, in these presets).
- **A command's own process is drawn.** External commands (`ps`, `ip`, `mount`, `findmnt`, `ls`) fork; the process is
  listed in the step that runs it, dashed and tagged "ran", and gone in the next step without a "gone" mark. That is
  what makes `ps` show itself as PID 2 and lets `ls` be PID 1 in `no-fork`. It also takes PIDs, so the host's numbers
  advance with every command (full: `ps` 4322, `ip` 4323, …). Builtins (`echo`, `kill`, `exit`) do not fork.
- **Two host terminals.** Terminal 1 (bash 4300) starts the container and is busy while it runs (unshare waits for its
  child); host-side commands run in terminal 2 (bash 4200). The prompt is `#` in both places: without a UTS namespace
  the container's prompt would show the same host name, so the strip names the side instead.
- **"Changed"** marks rows that appeared or got a new PID (yellow fill with an inset ink outline: the kit's outset
  outline and glow covered the neighbouring rows) and namespace chips that were made, closed or went. Rows that
  disappeared stay one step, struck, dotted, tagged "gone". When the container is gone its panel only says so: listing
  its rows as struck would mark the host's processes "gone" in `no-mount-proc`, though they only left that view.
- **Signals to PID 1 from PID 1 itself** (the builtin `kill` runs in bash, which is PID 1) count as "from inside":
  the kernel's check does not look at the sender *(check)*. An interactive bash ignores SIGTERM whatever its PID, and an
  ignored signal is dropped before the init check, so SIGTERM would show nothing about namespaces: the model has
  per-process `ignores` (`TERM` for every bash; result `ignored`, its own caption), and the preset uses SIGUSR1.
- **Namespace lifetime:** a namespace goes in the same step its last holder goes (member, a process that will fork
  into it, a child namespace, a procfs of it in a live mount namespace). `unshare --fork` exits when its child does,
  so `exit` and `kill -9 4321` end with every C namespace gone.
- **Scripts, not free commands** (task: "No free command entry"). A hidden `scene` select carries the preset; `view`
  (both / host / container) widens one panel (1.7 : 1) and enlarges its text; it does not reset the step.
- **Model is promotable** for the other §5.17 pages: `spawn`, `end`, `signal`, `collect`, `visible`, `view` are pure
  functions over plain state, with no words.

## Deviations from the task

- **PIDs are allocated in order** from the host's 4320: the container's `sleep` is 4322 on the host, not the task's
  4330 (kill-init, one-way; the task says PIDs are illustrative); in `no-fork` the shell is 4320 (not 4321) and `ls`
  is 4321; the failed fork at no-fork step 4 still uses up host PID 4322 (the kernel allocates before it checks), so
  the second run is unshare 4323, bash 4324. In all presets a real bash's startup files would fork too and shift the
  container's numbers; the model's shells start without them.
- **Step scripts beyond the task's own commands** (each within the concept; counts as the task's 9, 5, 6, 7, 5):
  full adds `echo $$` and the container's `findmnt /mnt`; no-mount-proc ends with `exit` and `unshare --pid --fork
  --mount-proc bash` (the fix, so the comparison runs to its end); no-fork adds `echo $$` (4320), `exit` and
  `unshare --pid --fork bash` (with `--fork` the shell is PID 1); kill-init adds `ps`, `kill -KILL 1` from inside
  (dropped too) and `kill 4322` from the host afterwards ("No such process": sleep died with the namespace); one-way
  ends with `ps` in the container (`1 bash`, `3 ps`).
- **`kill -USR1 1` instead of the task's `kill -TERM 1`** (kill-init step 4), for the reason above *(check SIGUSR1 in a
  lab)*. `kill -TERM` to bash, init or not, is modelled as ignored.
- **`unshare --pid bash --norc`** in no-fork: with the usual startup files the new bash forks while it starts, that
  first child takes PID 1 and exits, and the namespace is closed before anything is typed. `--norc` keeps the
  task's story (the first command the user runs becomes PID 1); the caption says why.
- **Caption 1**, Croatian: the task writes "*unshare* (odvajanje) je stvorio…"; `unshare` is the command here, so it is
  set as code and not translated. Otherwise both task captions are used word for word (the second inside the
  kill-init caption).
- **`ip link` is `ip -br link`** (one line per interface, so the strip stays short); the host's `lo` reads `UNKNOWN`
  there, as the real one does; the panel says "up".
- **Output not modelled:** bash's job notices (`[1]+ Killed …`), unshare re-raising the child's signal, `Killed` in
  terminal 1. `--mount-proc` stacks a procfs over the copied `/proc` (findmnt would list two); the panel shows one
  `/proc` row whose "PIDs of" changes.

## Sources

- man pages: pid_namespaces(7) (nesting, init, SIGKILL on init exit, ENOMEM, signals to init, `unshare` and
  `setns` do not move the caller), namespaces(7), network_namespaces(7), mount_namespaces(7) (copy on creation,
  shared subtrees, systemd's shared `/`), unshare(1) (`--fork`, `--mount-proc` implies `--mount`, `--propagation`
  default private), unshare(2), proc(5): from memory, not re-read online *(check)*.
- UL `08-procesi.md` (PID, roditeljski proces, signali, `kill 4321`), `10-podizanje-i-systemd.md` (PID 1, init
  proces); NLA `meta/toc.md` T07 („Mrežni imenski prostori"), T11 („Što kontejner jest — imenski prostori, cgroups,
  sposobnosti; zašto to nije virtualni stroj"). The NLA chapters are not written yet.
- Output formats: `ps -eo pid,comm` header and widths, `ip -br link` columns (16 / 14), `findmnt` columns, bash's
  `kill` and `fork` messages: from memory of procps-ng, iproute2, util-linux and bash *(check against a lab)*.
- Numbers: derived and illustrative; printed by a script from the model before the page was written and asserted in
  `sim.test.js`. The `no-mount-proc` and `no-fork` behaviours are the man pages' and commonly reproduced; not run in a
  lab here *(check)*.

## Concepts, not tools

No container engine is named. The commands are the subject: `unshare` and its flags, `echo $$`, `ps`, `ip link`,
`mount -t tmpfs`, `findmnt`, `kill`, `sleep`, `ls`, `exit`. "systemd" appears as the host's PID 1 (the task's own
example, and what `ps` really prints there).

## Checks

- `node --test sims/lnx-namespaces/sim.test.js`: 33 tests, tie-breaks first, one or more per rule, namespace
  lifetime, the marks, the presets' numbers, then the template's generic block.
- **Mutations:** 30 one-at-a-time mutations of `sim.js` with a script (string sort of PIDs, id tie-break reversed,
  kill resolving host PIDs, PIDs only in the own and root namespace, a view listing only its own namespace, no init,
  orphans to systemd, children not entering the new namespace, the caller moving, no SIGKILL on init exit, fork after
  init exit, no closed mark, inside signals delivered, ancestor SIGKILL dropped, handlers ignored, no fresh `/proc`,
  `ps` reading the reader's own namespace (two ways), `--mount-proc` without a mount namespace, `lo` up, the host's
  interfaces copied, a shared or empty mount table, no waiter exit, procfs or `forChildren` not holding a namespace,
  the command's process not drawn, no gone rows, a new PID not marked, `ps` column width; and after the review: zap
  only the init's own namespace, a child namespace not holding its parent, SIGSTOP not forced, exec keeping the name
  `unshare`, a new mount namespace getting its own `/proc`, one-way's sender, kill-init's order, `lo` `UP` on the
  host, fixed findmnt columns, findmnt's first match, `inode64`, `exit` silent, marks for up/down, `/proc` and a
  closed namespace, a silent `bg` ENOMEM, terminal 2's role, a failed fork not using a PID, ignores off, the killed
  count): all **50** fail a test.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page, checked the rules against
  the man pages, read every caption in both languages, ran 82 mutations of its own). Fixed from it: the SIGTERM
  confound (above); no-fork's startup forks (`--norc`); the glossary's `handler` (obrađivač) instead of „rukovatelj";
  "a new network namespace starts empty" (it has `lo`); findmnt's `inode64`; a failed fork using up a PID; the
  `ps` caption chosen from a PID gap (now from a namespace member killed earlier); tests for its 11 surviving
  mutations; Croatian: the goal and start captions („s tri nova imenska prostora…", „ima tri *namespace*…"),
  `unshare` without `--fork` („kod PID imenskog prostora unshare samo određuje kamo će ići djeca pozivatelja"), „nova
  je ljuska unutra PID 1, a domaćin isti proces vidi kao…", „ali ne može pokrenuti nijednu vanjsku naredbu", „pokreće"
  for „pokrenut će", „pa imenski prostor", „ispisao 1", „obje ploče prikazuju istu jezgru", *propagation*
  (propagacija, širenje montiranja); captions say `ip` (the strip shows `ip -br link`); no-fork's second run starts
  „Ovaj put s `--fork`:"; sim.json's concept „Imenski prostori za PID, mrežu i montiranje…". Left as is: the
  fixed-point loop in `collect` (one pass suffices with the current order; kept so a reordering cannot break it).
- `npm run gate -- lnx-namespaces`: pass (manifest, tests, build, 63 browser checks, tokens, scope). Screenshots at
  1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed; plus key steps of every preset with a local
  Playwright script, and every caption in both languages read through. Fixed from them: the panels overflowing
  (rows tightened, host header chips dropped), rows shrinking and clipping (flex-shrink), the kit's changed outline
  covering neighbouring rows (inset outline on a yellow fill), the hatch not showing on rows, chips wrapping (net and
  mount chips only where they differ from the row's PID namespace), phone text at 13.6 px (sizes ≥ 0.875rem), the gone
  container panel striking host processes, code spans around placeholders printing backticks, „signal (signal)".

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| namespace | imenski prostor (NLA T07, T11) |
| PID namespace / network namespace / mount namespace | PID imenski prostor / mrežni imenski prostor / imenski prostor montiranja *(check: the last is not in the books)* |
| container | kontejner (NLA T11; UL ch14) |
| PID | PID (identifikator procesa, UL ch08) |
| propagation (mount) | propagacija, širenje montiranja *(check)* |

From the glossary: `process`, `init process`, `virtual machine`, `kernel`, `handler` (obrađivač). `signal` is in the glossary but renders
„signal (signal)" in Croatian, so it is written plain.

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute (same as `lnx-overlayfs-layers` reported);
  worked around in the page.
- **kit.css:** `.sd-changed` draws an outset outline with a 0.45rem glow, which covers neighbours in tight lists. An
  inset variant (`.sd-changed--inset`, or a `--sd-changed-offset` token) would let list rows use it as is; worked
  around with a page rule.

## Time

Start 2026-10-23 16:31, done 17:03 (CEST): about 32 minutes, one session, including the fresh review.
