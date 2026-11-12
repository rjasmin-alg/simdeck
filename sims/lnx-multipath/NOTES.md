<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-multipath: notes

New stepper (task `docs/tasks/w3/lnx-multipath.md`, catalogue `lnx-multipath` §4.4). The task names no kit view. K2
(topology) has links between nodes, but a path here is an end-to-end line (port → switch → controller) and two paths
share each cable, so the page draws its own scene: HTML boxes placed in percent, an SVG with `preserveAspectRatio="none"`
and `vector-effect: non-scaling-stroke` for the four lines only (no text in the SVG), labels, dots and marks in HTML.
Rules and expected numbers: `SPEC.md`.

## Decisions

- **One step = one 5 s checker interval**, 4 I/O requests per interval, issued one after another (no concurrency).
- **Order inside an interval:** fault, then I/O, then the path checker, then group switch / failback, then the queue.
  This is the one deviation that changes numbers (below).
- **`link` vs `state`.** A path has a physical `link` (up/down, set by the scripted fault) and multipath's `state`
  (active/failed). They differ only inside an interval: I/O finds a dead path first, or the checker finds it at the end.
  After each step they agree, so the listing and the stage always show the checker's view.
- **The fault is three params** (`fault`, `failAt`, `downFor`): the task's "the student fails paths during I/O". A
  stepper replays from params, so a click-to-fail button would have been a param anyway. `fault` = `sdb` | port `h0`
  (the same paths as switch A, which is cabled to h0) | `ctrl-A` | `all`. `failAt` is hidden (every preset uses
  interval 2, interval 1 shows the healthy state) to fit one screen; `ticks` is hidden like `cycles` in lnx-logrotate.
- **Group order and prio.** Groups are sorted by the average prio of their paths, then list order. The `prio=` in the
  listing is the live value (average of usable paths, 0 when none), as `multipath -ll` prints it *(check)*. With
  multibus the single group shows `prio=30` (50, 50, 10, 10), `prio=23` with `sdb` down.
- **Best group** (switch and failback): highest live prio, then most usable paths, then map order (libmultipath's
  group choice, from memory, *check*). The middle tie-break is never reached by the presets but is tested.
- **failback immediate with failover grouping**: `[sda]` and `[sdb]` tie at 50, so when `sda` returns I/O goes back to
  `[sda]` (first in the map). Tested.
- **Read-only filesystem**: the first error that reaches the filesystem makes it read-only, and it stays so (recovery
  needs the administrator, out of scope). The application keeps issuing 4 requests per interval regardless, so the
  brief's "4 errors per interval" holds.
- **`retried`** counts a request once, however many paths it tried. A request that tried every path and then queued
  (or failed) counts too: it was resent.
- **Drain** uses the active group's selector after failback, so in `all-down-queue` the 20 waiting requests go 10/10 to
  `sda`/`sdb`. They are drawn as squares (queued) on the lines, the chip says "+10 from the queue".
- **No multipath**: no map; the listing shows `multipath -ll` → "no map" and an lsblk-style list of four disks with one
  WWID (misconception: four disks in lsblk are four disks). The disk's state is its link (no checker).
- **Names**: host `demosrv1` (the task), map `mpatha`, WWID `36001405a1b2c3d4e` (made up), SCSI addresses
  2:0:T:1 / 3:0:T:1 (port h0 = SCSI host 2, h1 = host 3, ctrl-A target 0, ctrl-B target 1). No vendor or product
  names; the array is "the storage array". `multipath -ll` output and `multipath.conf` names are the subject (NLA T25),
  so they appear.
- **Listing format**: real `multipath -ll` lines without the major:minor column (width at 1920×1080); quoted values
  keep their spaces unbroken so a wrap never splits `'1 alua'`.
- **Captions**: the task's caption is used verbatim for ctrl-A failing under group_by_prio. Otherwise the event
  sentence plus at most two sentences (the I/O outcome first, then "still no path" / drain / reinstate, the checker
  finding an idle path, failback, read-only). With no multipath the event sentence is dropped when the error sentence
  already names the dead path.
- **`downFor` slider** goes up to one interval past the end of the demo (`ticks − failAt + 1`): its top is "does not
  return in this demo", so every slider position means something (reviewer). The model still takes 1–10.
- **After an outage of every path** the active group is cleared and the best group takes over when a path is
  reinstated, even with `failback manual` (dm-mpath clears `current_pg`; reviewer finding, *check*).
- **Panel fit**: preset labels are short ("ALUA, A fails", "multibus, sdb", "All, queue", "All, fail";
  en "sdb only", hr "Samo sdb"), with the detail in their hints; grouping, failback and no_path_retry are hidden when multipath is off.

## Deviations from the task

- **Checker after the I/O, not before** (the brief's phase (b) before (c)). With the brief's order the checker would mark
  a dead path failed before any I/O reached it, so no request could ever be retried, which contradicts the brief's own
  `multibus-rr` number (1 retried I/O). Consequence: a returning path is used only from the interval after it returns,
  so in `all-down-queue` interval 6 queues 4 more requests (20) before the queue drains, and in `all-down-fail`
  interval 6 still returns 4 errors (20 in all). Both are what dm-multipath does with a 5 s checker *(check)*.
- **`events` → `event`** (one fault per demo, at most one event per interval); `link`, `rr` and per-interval records added
  to the state.
- **Fault params** added (above). The brief's params are all there with its defaults.
- **Path prios are static**: a real ALUA array may move LUN ownership to ctrl-B after a while; out of scope, said in
  SPEC.md.
- **"Moving I/O dots"**: the dots slide in along the switch → controller segment on a forward step (none under reduced
  motion), then stay; one dot per request, at most 4 per path, the chip gives the count.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, T25 "Mrežno spremište — iSCSI, NVMe-oF, NFS u
  pogonu" (no chapter yet).
- multipath.conf(5): `path_grouping_policy`, `path_selector`, `failback`, `no_path_retry`, `polling_interval`;
  multipath(8) `-ll` output format. From memory: the man pages are not installed on this machine *(check)*.
- Red Hat Enterprise Linux 9, "Configuring device mapper multipath": overview (one LUN seen as several SCSI devices),
  default `service-time 0`, ALUA with `group_by_prio` *(check)*.
- SPC-4 ALUA states (active/optimized vs active/non-optimized) *(check)*; RFC 7143 for initiator/target.
- libmultipath group choice (priority, then enabled paths, then order), from memory *(check)*.
- Related lab `/home/rjasmin/projects/single-page-labs/stratis-topology-lab.html` (its multipath device view): read for
  the "duplicate path risk" idea; nothing copied.

## Unchecked *(check)*

Nothing here was run on a real host (no multipath tools, iSCSI target or FC on nuc). To check on a lab host: the I/O
error marks the path failed before the checker; `prio=` in `-ll` is the average of the usable paths and 0 for a group
with none; status `enabled` for a group whose paths all failed; `failed faulty running` as the line for a path whose
iSCSI session is down (it may read `failed faulty offline` or `transport-offline` instead); `no_path_retry 3` queues for
three checker intervals; ext4/XFS go read-only on the first error.

## Term pairs

Not in `kit/glossary.js`; written out in the hr explanation in the term-rule form (`<i>path</i> (put)`):

| en | hr | source |
|---|---|---|
| network storage | mrežno spremište | NLA toc T25 |
| path (storage) | put | task file (the glossary's `path` → `putanja` is the filesystem path) |
| path group | grupa putova | task file |
| initiator | inicijator | task file (check) |
| target (storage) | cilj | task file; the glossary has `target` → `cilj` from uvod-u-linux (systemd target) |
| I/O request | U/I zahtjev | task file |
| failover | preuzimanje | task file (check) |
| failback | povratak na prvotni put | task file (check) |

## Shared requests

- **check-page.mjs**: the slider-then-clicker check takes the first `input[type=range]` in the controls, even a hidden
  one (`visible: false`), and crashes on its null bounding box. Worked around by listing the hidden ranges after the
  visible one. Smallest fix: `p.locator('[data-sd-controls] input[type="range"]:visible').first()`.

## Checks

- `node --test sims/lnx-multipath/sim.test.js`: 30 tests, tie-breaks first. Mutation pass: 17 rule breaks applied to a
  copy of `sim.js` one at a time (round-robin tie-break, group sort, the two best-group tie-breaks, no retry, failback
  always/never, queue ignored, N off by one, no drain, filesystem never read-only, the brief's checker-first order,
  plain disk wrong, checker never marks an idle path, static instead of live prio in the group choice, no clearing of
  the active group on an outage, `retryLeft` not cleared on return); every one fails at least one test. The rule 3
  tie-break (global order after a switch) cannot be told from a reset with this layout (SPEC.md).
- Fresh reviewer (a subagent given the code, not my conclusions): every SPEC number reproduced; findings fixed: manual
  failback stuck on the low group after a total outage, `downFor` slider half dead, captions ("healthy paths exist"
  when all were down, "does not wait" after no_path_retry ran out, errors on the return tick not said, retries naming
  only the first dead path, four-sentence captions), hr genitive in the explanation, en/hr preset label mismatch,
  untested rules. Kept: requests count as done on a read-only filesystem (SPEC rule 7 says why).
- `npm run gate -- lnx-multipath`: passes (manifest, tests, build, browser 62/62, tokens, scope), on main cc3418c. Screenshots reviewed at 1920×1080 light, dark,
  grayscale and 375×812, in hr and en, plus each preset at its key interval (failover, failback, queue, drain, errors,
  no multipath, failover grouping with port h0 down).

## Time

Start 2026-11-12 17:34, done 18:03 (+01:00, wall clock of this machine): about 30 minutes, one session.
