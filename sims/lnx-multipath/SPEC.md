<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-multipath: spec

One concept: **path failover for iSCSI/FC**. One LUN is reached over four paths; the student fails a path, a host
port, a controller or every path while I/O runs, and watches where each request goes, what is resent, what waits and
what reaches the filesystem as an error.

Task: `docs/tasks/w3/lnx-multipath.md`. Course: NLA T25 "Mrežno spremište — iSCSI, NVMe-oF, NFS u pogonu" (no chapter
yet, so every rule below rests on the man pages and is marked *(check)* where it was not run on a real host).

## Scene

- **Host** `demosrv1` (left) with two initiator ports `h0` (SCSI host 2) and `h1` (host 3). Above it the stack:
  the filesystem on `/dev/mapper/mpatha` (with multipath) or on `/dev/sdb` (without).
- **Two fabrics** (middle): switch A (cabled to `h0`) and switch B (cabled to `h1`); each switch reaches both
  controllers.
- **Array** (right): `ctrl-A`, which owns the LUN, and `ctrl-B`; one LUN, 100 GiB, one WWID.
- **Four paths**, one line each, in list order:

  | dev | port | switch | controller | H:C:T:L | ALUA prio |
  |---|---|---|---|---|---|
  | `sda` | h0 | A | A | 2:0:0:1 | 50 |
  | `sdb` | h1 | B | A | 3:0:0:1 | 50 |
  | `sdc` | h0 | A | B | 2:0:1:1 | 10 |
  | `sdd` | h1 | B | B | 3:0:1:1 | 10 |

- **Right of the scene**: a `multipath -ll`-style listing (map line, `size`/`features`/`hwhandler` line, one
  `policy='round-robin 0' prio=… status=active|enabled` line per group, one `H:C:T:L dev active ready running` or
  `failed faulty running` line per path), and the counters: I/O done, retried, queued, errors returned to the
  filesystem, the filesystem's state, and `no_path_retry`'s countdown when it runs.

## State

`{ n, t, paths: [{ dev, port, ctrl, hctl, prio, group, link: 'up'|'down', state: 'active'|'failed' }],
groups: [{ id, prio, devs }], activeGroup, rr, queued, done, retried, errors, retryLeft, fsState: 'rw'|'ro',
multipath, nextIo }` plus this tick's record: `event`, `io: [{ id, tries: [dev…], on, result: 'done'|'queued'|'error' }]`,
`marks: [{ dev, state, by: 'io'|'checker'|'link' }]`, `changed`, `switches: [{ from, to, why: 'nopath'|'failback' }]`,
`tickDone {dev: n}`, `tickQueued`, `tickRetried`, `tickErrors`, `drained`, `drainedOn`, `flushed`, `fsWentRo`,
`retryStarted`.

Additions to the brief's state: `link` (the physical state of the path, which multipath only learns from a failed I/O
or from the checker), `rr` (index of the last path used, the selector's memory), and the per-tick record for the
stage and the caption. `events` became `event` (one scripted fault per demo, so at most one event per tick).

## Time and one step

Step n is tick n, at t = 5n s (`polling_interval` 5, multipath.conf(5) default). Step 0 is before any I/O, all paths
up. One tick, in this order:

- **(a) event.** The scripted fault: on tick `failAt` the links of its paths go down; on tick `failAt + downFor` they
  come back. `sdb` = one path; port `h0` = `sda`, `sdc` (the same set as switch A, cabled to `h0`); `ctrl-A` = `sda`,
  `sdb`; `all` = the four.
- **(b) I/O.** The application issues 4 requests (`IO_PER_TICK`), one after another, each through rules 3–5 and 7.
- **(c) path checker.** Every path whose link is down and is still `active` is marked `failed`; every path whose link
  is up and is `failed` is reinstated (`active`).
- **(d) group switch and failback** (rules 5, 6).
- **(e) queued I/O.** If any path is usable now, every queued request is sent through the selector of the active
  group; otherwise `no_path_retry N` counts down (rule 7).

**Deviation, recorded:** the brief orders the checker (b) before the I/O (c). Then the checker would mark a dead path
failed before any I/O touched it, no I/O would ever fail on a path, and the brief's own `multibus-rr` number (1
retried I/O) could not happen. Here the fault comes at the start of the interval and the checker runs at its end: an
I/O finds a dead active path first (dm-multipath fails the path on the I/O error without waiting for the checker,
*check*), and a path that comes back is used only after the checker has reinstated it (up to one interval later).

## Rules

1. **Without multipath** (`useMultipath` off) the one LUN is four disks (`sda`…`sdd`, same size, same WWID), the
   filesystem is on `sdb`, and every I/O goes to `sdb`. If `sdb`'s path is down, each I/O is an error returned to the
   filesystem at once, although three healthy paths to the same LUN exist. No checker and no map: a disk's state is
   its link. Source: RHEL 9 "Configuring device mapper multipath", overview *(check)*.
2. **`path_grouping_policy`** builds the groups; the map lists them by priority, highest first, then by list order of
   their first path. Group prio for this order is the average of its paths' prios.
   - `failover`: one path per group → `[sda] 50, [sdb] 50, [sdc] 10, [sdd] 10`.
   - `multibus`: one group of four → `[sda sdb sdc sdd] 30` (average of 50, 50, 10, 10).
   - `group_by_prio`: one group per prio → `[sda sdb] 50, [sdc sdd] 10`.
   ALUA: paths to the owning controller are active/optimized (prio 50), the others active/non-optimized (prio 10).
   Prios do not change in the demo (a real array may move ownership to `ctrl-B` after a while: out of scope).
   Sources: multipath.conf(5) `path_grouping_policy`, `prio alua`; SPC-4 ALUA states *(check)*.
3. **Path selector** `round-robin 0` inside the active group: each request goes to the next usable path after the
   last one used (`rr`), in list order, wrapping round; failed paths are skipped. **Tie-break:** after a group switch,
   "after the last one used" still counts in the global list order (after `sdb`, group `[sdc sdd]` starts at `sdc`).
   With this path layout that always equals starting the new group at its first path, so no test can tell the two
   apart; the rule is stated for a layout where it would matter.
   The distribution default is `service-time 0`, which picks the path with the least outstanding I/O relative to
   its throughput; with one request at a time and equal paths it rotates like round-robin, so the page names
   round-robin and says so in the explanation. Sources: multipath.conf(5) `path_selector`; RHEL 9 (default
   `service-time 0`) *(check)*.
4. **Retry on another path.** A request sent to a path whose link is down fails at the SCSI level; the path is
   marked `failed` (by I/O, before the checker) and the request is resent on the next usable path (rules 3, 5).
   The filesystem sees no error. A request counts once in `retried` however many paths it tried. Source:
   multipath.conf(5), dm-multipath *(check)*.
5. **Group switch.** When the active group has no usable path, the best other group becomes active: one with a usable
   path, the highest priority, then the most usable paths, then the map's order. Priority here is the live one,
   as `multipath -ll` shows it: the average prio of the group's usable paths, 0 when it has none. Source:
   multipath.conf(5); the "most usable paths" tie-break is libmultipath's group choice, never reached by the presets
   *(check)*. Prios are integers, rounded down (multibus with `sdb` down: (50 + 10 + 10) / 3 = 23). The live prio
   matters only for groups with mixed prios, which this layout does not make; a test pins it on a built state.
   **All groups dead:** when a request finds no usable path in any group, the active group is cleared (`null`, like
   dm-mpath's `current_pg`); the listing then shows every group `enabled`. When a path is reinstated, the best group
   becomes active (`why: 'restore'`), whatever `failback` says (rule 6) *(check)*.
6. **`failback`.** At the end of each tick: `immediate` switches to the best group (rule 5) whenever it is not the
   active one; `manual` stays on the active group while it has a usable path. With `failover` grouping two groups
   tie at 50 and the first wins: when `sda` returns, `immediate` goes back to `[sda]`. After an outage of every path
   there is no active group to stay on, so `manual` too starts again from the best group (rule 5). Source:
   multipath.conf(5) `failback`.
7. **No usable path at all.** `no_path_retry queue`: the request is queued (the application waits, nothing is lost)
   until a path is reinstated; then every queued request is sent. `fail`: the request returns an error to the
   filesystem at once. A number N: the request is queued; `retryLeft` starts at N on the first request that finds no
   path, and each checker interval with no path counts it down; when it reaches 0 the queued requests fail
   (`flushed`) and later requests fail at once, until a path is reinstated (then `retryLeft` is cleared). The first
   error that reaches the filesystem makes it read-only (ext4 `errors=remount-ro`, XFS shutdown, *check*); it stays
   read-only in the demo (getting it back needs the administrator, out of scope). The application keeps issuing 4
   requests per tick and `done` counts requests completed at the block device; after the filesystem is read-only
   these stand for reads (writes would be refused by the filesystem itself, which the model does not split out).
   Source: multipath.conf(5) `no_path_retry`.

## Params

| key | values | default |
|---|---|---|
| `grouping` | `failover` \| `multibus` \| `group_by_prio` | `group_by_prio` |
| `failback` | `immediate` \| `manual` | `immediate` |
| `noPathRetry` | `queue` \| `fail` \| `3` | `queue` |
| `useMultipath` | toggle (off: the filesystem on `sdb`) | on |
| `fault` | `sdb` \| `h0` \| `ctrl-A` \| `all` | `ctrl-A` |
| `failAt` | tick 1–10 | 2 |
| `downFor` | 1–10 ticks (the page's slider: up to `ticks − failAt + 1`, the top = does not return in the demo) | 3 |
| `ticks` | 3–12 (the steps; set by the presets, hidden) | 7 |

All `resets: true`. `fault`, `failAt` and `downFor` are additions: the task's "the student fails paths during I/O" as
params (a stepper replays from its params; a fault chosen by a click would have to be one anyway).

## Presets and their numbers (computed by the model; the brief's expectations were "derived, unchecked")

Counters after each tick: done / retried / queued / errors, the active group, the paths used this tick.

- **`alua-failover`** (defaults: group_by_prio, ctrl-A fails at tick 2 for 3 ticks), 7 steps.
  t1 `sda`×2 `sdb`×2, 4/0/0/0. t2: the first request hits `sda` (failed), is resent on `sdb` (failed), the group
  `[sda sdb]` has no usable path, `[sdc sdd]` becomes active, the request completes on `sdc`; `sdc`×2 `sdd`×2,
  8/1/0/0. t3, t4 on `sdc`/`sdd`. t5: the links return; I/O still on `sdc`/`sdd` (20/1/0/0); the checker reinstates
  `sda`, `sdb`; failback immediate → group 1. t6, t7 on `sda`/`sdb`; t7 28/1/0/0. Brief: ✓.
- **`multibus-rr`** (`sdb` fails at tick 2 for 3 ticks), 6 steps. t1 one request on each path. t2: `sda`, `sdb` (dead
  → failed, resent on `sdc`), `sdd`, `sda`: 8/1/0/0. t3–t4 over three paths (`sdc sdd sda sdc`, then `sdd sda sdc
  sdd`). t5: `sdb` back; reinstated at the end of t5. t6 over four paths again; 24/1/0/0. Brief: ✓ (4, then 3 paths;
  0 errors; 1 retried; back to 4 from t6, the listing shows `sdb` active at t5).
- **`all-down-queue`** (all paths down ticks 2–5, back at 6, `queue`), 8 steps. t2: the first request tries `sda`,
  `sdb`, switches to group 2, tries `sdc`, `sdd`, finds no path and is queued (no active group from now on); the
  other three are queued. queued 4, 8, 12, 16 at t2–t5, errors 0. t6: the links are back but the paths are still
  failed during the I/O, so queued 20; the checker reinstates all four, group 1 becomes active again (rule 5), the 20
  queued requests are sent (`sda`×10, `sdb`×10):
  done 24, queued 0. t8 32/1/0/0. Brief: 4, 8, 12, 16 ✓, "drains at 6" ✓ (after one more tick's worth: 20).
- **`all-down-fail`** (same, `fail`), 6 steps. errors 4, 8, 12, 16 at t2–t5, filesystem read-only from t2; t6 the I/O
  still finds no path (20 errors), then the checker reinstates the paths; the filesystem stays read-only. Brief: ✓.
- **`no-multipath`** (`useMultipath` off, `sdb` fails at tick 2, `downFor` 4: it would return at tick 6, after the end), 5 steps. t1 4 on `sdb`; t2–t5 4 errors
  each (16), filesystem read-only from t2, while `sda`, `sdc`, `sdd` stay healthy and unused. Brief: ✓.

Other numbers the tests pin: `noPathRetry 3` with all paths down from tick 2: queued 4, 8 at t2–t3 with `retryLeft`
2, 1; t4 queues 4 more (12), and at the end of t4 `retryLeft` reaches 0 and the 12 fail (errors 12, queued 0); t5 4
more errors at once. The same with `downFor` 2 (back at t4): t4 queues to 12, the checker reinstates, the 12 drain,
`retryLeft` is cleared, 0 errors. All four paths down for 2 ticks with failover grouping and `failback manual`: no
active group during the outage, `[sda]` again from t4. Port `h0` down under
group_by_prio: `sda`'s request is resent on `sdb`; `sdc` (standby, no I/O) is marked failed by the checker, not by
I/O. `failover` grouping with `sdb` down: no switch ever (`sdb` is not in the active group). `failover` grouping with
`h0` down: `[sda]` → `[sdb]`; when `h0` returns, failback immediate → `[sda]`; manual stays on `[sdb]`.

## Legend

Active path (solid line, I/O dots for this tick's requests), enabled standby path (dashed), failed path (red, ✕ on
the line), active group (frame round its paths' labels in the listing and on the stage), queued I/O (stacked squares
at the host), error (✕ at the filesystem). "Changed" (`sd-changed`) marks paths whose state changed this tick and the
group line that became active.

## Out of scope

iSCSI login and discovery, NVMe native multipath, `queue_if_no_path` tuning, `user_friendly_names`, blacklists,
path priority checkers in detail, ALUA ownership transfer, recovering a read-only filesystem.
