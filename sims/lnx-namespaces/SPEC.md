<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-namespaces: specification

One concept: **PID, network and mount namespaces isolate one process tree.** Task: `docs/tasks/w2/lnx-namespaces.md`.
Sources: man pages namespaces(7), pid_namespaces(7), network_namespaces(7), mount_namespaces(7), unshare(1), proc(5);
UL = `~/projects/uvod-u-linux/book/chapters/08-procesi.md` (PID, parent process, signals, `kill 4321`),
`10-podizanje-i-systemd.md` (PID 1); NLA `meta/toc.md` T07 (network namespaces), T11 (what a container is).

## State

`{ scene, ns: { pid: [{ id, parent, init, next, dead }], net: [{ id, ifaces: [{ name, up, mac, loopback? }] }],
mnt: [{ id, propagation, mounts: [{ target, fstype, src }] }] }, procs: [{ id, name, pidByNs: { host: 4321, c1: 1 },
nsPid, nsNet, nsMnt, forChildren, parent, handles, alive, ran, waitsFor }], procMountedFrom: { <mnt ns>: <pid ns> },
container, nextProc, nextNs, cmd, out, lastError, changed, gone, event }`.

- Namespace ids: `host`, then `c1`, `c2`, … one per `unshare` call (its PID, network and mount namespaces share the tag).
- `pidByNs` holds the process's PID in its own namespace and in every ancestor (rule 1). `next` is each PID namespace's
  next free number (the host's starts at 4320, illustrative; a new namespace's at 1).
- `forChildren`: the PID namespace the process's children will enter, when it differs from its own (rule 3).
- `alive: false, ran: true`: a command's own process (`ps`, `ip`, `mount`, `findmnt`, `ls`) that ran during this step
  and has exited; it is listed for this step only, marked "ran", and dropped before the next step.
- `container`: the container's shell (the first process `unshare` started, or `unshare` itself without `--fork`);
  `null` before the first `unshare` and after that shell ends.
- `procMountedFrom`: for each mount namespace, the PID namespace of the procfs mounted on its `/proc` (rule 6).
- `changed`: `host:proc:<id>`, `container:proc:<id>`, `<side>:iface:<name>`, `<side>:mnt:<target>` for rows that
  appeared or changed (a new PID, up/down, a different procfs), and `ns:<kind>:<id>` for namespaces made, closed or
  gone. `gone`: `{ host: [rows], container: [rows] }`, the rows that disappeared in this step (a command's own process
  from the previous step is not counted: it was marked "ran" then).

## One step

One command or event from the preset's script, run by `h1` (the host's terminal 1, bash 4300, which starts the
container), `h2` (the host's terminal 2, bash 4200) or `c` (the container's shell). Phases: (1) the command is shown;
(2) it is applied: `unshare` makes namespaces and forks, an external command forks its own process (which may fail,
rule 4) and exits, `kill` signals, `exit` ends the shell, and with every end the kernel's consequences follow (rules 2,
4, the waiting `unshare` exits, unheld namespaces go); (3) both views are recomputed from the state; (4) rows that
appeared, disappeared or got a new PID are marked. Builtins (`echo`, `kill`, `exit`) do not fork.

## Rules

1. **Visibility.** A PID namespace sees the processes in itself and in its descendants, each under its own PID number;
   a process has a PID in every namespace from its own up to the root. A PID that does not exist in the sender's
   namespace is "No such process" (`bash: kill: (4300) - No such process`). (pid_namespaces(7) "Nesting PID
   namespaces".)
2. **Init.** The first process created in a new PID namespace gets PID 1 and is its init; orphans are re-parented to
   the init of the dying parent's namespace. (pid_namespaces(7) "The namespace init process".) Subreapers are out of
   scope.
3. **unshare does not move the caller.** `unshare(CLONE_NEWPID)` makes the namespace the caller's children enter; the
   caller stays where it is. Without `--fork`, `unshare` execs the program in the same process, so the shell keeps its
   host PID and the first command it runs becomes PID 1. (unshare(1) `--fork`; pid_namespaces(7).) For network and
   mount namespaces the caller itself moves (unshare(2)); so with `--fork` the `unshare` process is in the new network
   and mount namespaces but still in the host's PID namespace.
4. **When init exits,** the kernel sends SIGKILL to every other process in its namespace (and below); after that a
   `fork()` into the namespace fails with ENOMEM: `bash: fork: Cannot allocate memory`. (pid_namespaces(7).) The failed
   fork still moves the PID counter of every level (the kernel allocates the numbers before it checks), so the host's
   next PID goes up by one. A
   process that is waiting for its child (`unshare --fork`) exits when the child does (unshare(1) waits for it).
5. **Signals to init.** From inside its namespace (init itself included), PID 1 receives only signals it has a handler
   for; SIGKILL never has one, so `kill -KILL 1` from inside does nothing. From an ancestor namespace the same holds,
   except that SIGKILL and SIGSTOP are always delivered. (pid_namespaces(7).) Init sending to itself is treated as from
   inside: the kernel's check (`SIGNAL_UNKILLABLE` with the default action) does not look at the sender *(check)*.
   A signal the target ignores is dropped before that check: an interactive bash ignores SIGTERM, PID 1 or not, so the
   presets show rule 5 with SIGUSR1 (bash neither handles nor ignores it, and its default action kills an ordinary
   process) and SIGKILL. Handlers and ignores are per process: `handles`, `ignores` (`['TERM']` for every bash).
6. **ps reads /proc.** `/proc` lists the PID namespace of the procfs instance mounted there, not the reader's. Without a
   new mount namespace and a fresh `mount -t proc`, `ps` in the container lists the host's processes under host PIDs,
   while `echo $$` prints 1. `--mount-proc` implies `--mount` and mounts a procfs for the new PID namespace on `/proc`.
   (unshare(1); proc(5).)
7. **A new network namespace** contains only `lo`, and it is down; the host's interfaces are not there. (network_
   namespaces(7).) Moving a device in (veth) is `lnx-netns-veth-bridge`.
8. **A new mount namespace** starts as a copy of the caller's mount table. `unshare` sets propagation to private (the
   default of `--propagation`, because systemd makes `/` shared), so later mounts in either namespace are not seen in
   the other. (mount_namespaces(7) "Shared subtrees"; unshare(1).) Only private propagation is modelled.
9. **Tie-break for listing:** processes sorted by PID in the viewing namespace (as numbers), then by internal id.
   Interfaces and mounts keep table order (new ones last).

A namespace lives while something holds it: a member process, a process whose children will enter it (rule 3), a child
PID namespace, or a procfs of it mounted in a live mount namespace. An unheld one is gone in the same step. The host's
never go. PIDs are allocated in order and not reused at once (one-way: `ps` gets 3 after `sleep` 2 is gone).

## Output formats

- `ps -eo pid,comm`: header `    PID COMMAND`, PID right-aligned in 7 columns.
- `ip -br link`: name padded to 16, state to 14, MAC, flags. Host `lo` reads `UNKNOWN … <LOOPBACK,UP,LOWER_UP>`
  (a loopback's operational state), the container's `DOWN … <LOOPBACK>`; `eth0` `UP … <BROADCAST,MULTICAST,UP,LOWER_UP>`.
- `findmnt /mnt`: `TARGET SOURCE FSTYPE OPTIONS`, columns as wide as their longest cell, the last mount on the target;
  options `rw,relatime,inode64` for tmpfs (kernels since 5.9); nothing (exit status 1) when there is no such mount.
- `sleep 1000 &`: bash prints `[1] 2`, the job and the PID as the shell's own namespace numbers it.
- `exit` prints `exit`. A failed fork: `bash: fork: Cannot allocate memory`.

## Presets (step counts 9, 5, 6, 7, 5)

Start for all: host processes `systemd` 1, `bash` 4200 (terminal 2), `bash` 4300 (terminal 1); interfaces `lo` (up),
`eth0` (up); mounts `/` (`/dev/vda4`, xfs), `/proc` (proc), `/run` (tmpfs). The host's next PID is 4320.

1. `full`: h1 `unshare --pid --fork --mount-proc --net --mount bash` (unshare 4320, bash 4321 = C 1) → c `echo $$`
   (`1`) → c `ps -eo pid,comm` (`1 bash`, `2 ps`; host sees ps as 4322) → c `ip -br link` (`lo DOWN`) → h2
   `ip -br link` (`lo`, `eth0`) → c `mount -t tmpfs tmp /mnt` → c `findmnt /mnt` (`/mnt tmp tmpfs`) → h2 `findmnt
   /mnt` (nothing) → c `exit` (bash 1 ends, unshare ends, every C namespace gone; the host lists what it listed at the
   start).
2. `no-mount-proc`: h1 `unshare --pid --fork bash` → c `echo $$` (`1`) → c `ps -eo pid,comm` (`1 systemd`, `4200
   bash`, `4300 bash`, `4320 unshare`, `4321 bash`, `4322 ps`) → c `exit` → h1 `unshare --pid --fork --mount-proc bash`
   (the container's view now lists only `bash` 1, host 4324; the network is still the host's).
3. `no-fork`: h1 `unshare --pid bash --norc` (bash 4320 in the host's namespace; C has no process yet; `--norc`
   because startup files would fork first and take PID 1) → c `echo $$` (`4320`) → c `ls` (ls is C's PID 1, host
   4321; it exits and C has no init) → c `ls` (`bash: fork: Cannot allocate memory`; host PID 4322 used up) → c `exit`
   (C gone) → h1 `unshare --pid --fork bash` (unshare 4323, bash 4324 = C 1).
4. `kill-init`: h1 full `unshare` → c `sleep 1000 &` (`[1] 2`, host 4322) → c `ps -eo pid,comm` (`1 bash`, `2 sleep`,
   `3 ps`) → c `kill -USR1 1` (dropped) → c `kill -KILL 1` (dropped) → h2 `kill -9 4321` (bash dies; the kernel kills
   sleep; unshare exits; every C namespace gone) → h2 `kill 4322` (`No such process`).
5. `one-way`: h1 full `unshare` → c `sleep 1000 &` (`[1] 2`) → c `kill 4300` (`bash: kill: (4300) - No such process`)
   → h2 `kill 4322` (sleep ends) → c `ps -eo pid,comm` (`1 bash`, `3 ps`).

PIDs are illustrative and allocated in order by the model: the task's `sleep` 4330 is 4322 here, and in `no-fork` the
shell is 4320 (NOTES.md, deviations).

## Params

`scene` (hidden, set by the presets) and `view`: `both` | `host` | `container`, default `both`, which enlarges one panel
for the projector (page only; the model ignores it).
