# lnx-namespaces: A container is a process

| | |
|---|---|
| Task | `lnx-namespaces` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-namespaces` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-namespaces/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `containers` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **PID, network and mount namespaces isolate one process tree**.

The student: start a container, compare host and container views.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, §3 Kontejneri, topic T11 ("Što kontejner jest — imenski prostori, cgroups, sposobnosti; zašto to nije virtualni stroj") and §2, topic T07 ("Mrežni imenski prostori"); chapters not written yet
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/08-procesi.md` (PID, roditeljski proces, signal: terms) and `10-podizanje-i-systemd.md` (§ on systemd as PID 1)
- man pages: namespaces(7), pid_namespaces(7) (PID 1, SIGKILL on init exit, ENOMEM, signal rules), network_namespaces(7), mount_namespaces(7) (propagation), unshare(1) (`--fork`, `--mount-proc`, `--propagation`), proc(5)
- Catalogue seed: NLA T07 → §5.17 (the concept is NLA T11)

## Overlaps (catalogue §5)

- **§5.17 Containers:** Separate pages (each is one concept) on one container diagram.

## Model and presets

- **Scene:** two side-by-side panels, "host view" and "container view", each with three rows: process
  tree (PID numbers as that view sees them), network interfaces (`ip link`), mount table (`findmnt`, a few
  lines). A command strip on top shows the command run in the current step. One container diagram shared with
  the other §5.17 pages (draw it here; `lnx-cgroups`, `lnx-overlayfs-layers` reuse it).
- **State:** `{ cmd, ns: { pid: [{id, parent, init}], net: [{id, ifaces:[{name, up}]}], mnt: [{id, mounts:[{target, fstype, src}]}] },
  procs: [{ id, name, pidByNs: {host: 4321, c1: 1}, nsPid, nsNet, nsMnt, alive }], procMountedFrom, lastError, changed: [ids] }`.
- **One step:** one command or event. Phases: (1) show the command; (2) apply it (create namespace, fork,
  mount, kill); (3) recompute both views from the state (a view lists only what its namespaces can see);
  (4) mark changed rows.
- **Rules:**
  1. A process sees only the processes in its own PID namespace and its descendants' namespaces; a parent
     namespace sees every process in its child namespaces, under its own PID numbers. A process has a PID in
     every namespace from its own up to the root (pid_namespaces(7)).
  2. The first process created in a new PID namespace gets PID 1 there and acts as that namespace's init;
     orphans in the namespace are re-parented to it (pid_namespaces(7)).
  3. `unshare(CLONE_NEWPID)` does not move the caller: only its next child enters the new namespace. Hence
     `unshare --pid` needs `--fork` (unshare(1), pid_namespaces(7)).
  4. When PID 1 of a namespace exits, the kernel sends SIGKILL to every other process in it; after that a
     `fork()` into the namespace fails with ENOMEM (pid_namespaces(7)).
  5. PID 1 of a namespace receives from inside the namespace only signals it has a handler for; from an
     ancestor namespace SIGKILL and SIGSTOP are always delivered (pid_namespaces(7)).
  6. `ps` reads `/proc`. `/proc` shows the PID namespace of the procfs instance that was mounted, so without
     a new mount namespace and a fresh `mount -t proc` the container's `ps` lists host processes while
     `echo $$` prints 1 (unshare(1) `--mount-proc`; proc(5)).
  7. A new network namespace contains only `lo`, and it is down; host interfaces are invisible until a
     device (veth) is moved in (network_namespaces(7); the wiring itself is `lnx-netns-veth-bridge`).
  8. A new mount namespace starts as a copy of the parent's mount table; later mounts in either one are not
     seen by the other when propagation is private (`unshare` sets `--propagation private` by default,
     because systemd makes `/` shared) (mount_namespaces(7), unshare(1)).
  9. Tie-break for listing: processes sorted by PID in the viewing namespace, then by internal id.
- **Params:** `preset` only plus one `choice` `view` = `both` | `host` | `container` (default `both`) to
  enlarge one panel on the projector. No free command entry (the steps are scripted per preset).
- **Presets:**
  1. `full` (default): host bash PID 4300 runs `unshare --pid --fork --mount-proc --net --mount bash`.
     Inside: `ps` shows `bash` PID 1 and `ps` PID 2; host shows the same bash as PID 4321. `ip link` inside:
     only `lo` DOWN; host still has `lo`, `eth0`. `mount -t tmpfs tmp /mnt` inside: host `findmnt /mnt`
     empty. `exit` → namespaces gone, host lists nothing new. Derived from the man pages, PIDs illustrative.
  2. `no-mount-proc`: `unshare --pid --fork bash` (no `--mount-proc`): `echo $$` → 1, but `ps` lists host
     processes (PID 1 is `systemd`). Rule 6. Derived, unchecked against a lab.
  3. `no-fork`: `unshare --pid bash`: bash stays PID 4321 in the host namespace; the first command it runs
     (`ls`) becomes PID 1 of the new namespace, exits, and the next command fails with "fork: Cannot allocate
     memory". Rules 3–4. Derived (pid_namespaces(7)).
  4. `kill-init`: in the full container start `sleep 1000 &` (PID 2 inside, 4330 on host); from the host
     `kill -9 4321` → both die (rule 4). From inside, `kill -TERM 1` with no handler → ignored (rule 5).
  5. `one-way`: from the container `kill 4300` → "No such process" (the host PID does not exist there);
     from the host `kill 4330` works. Rule 1.
- **Steps:** full 9, no-mount-proc 5, no-fork 6, kill-init 7, one-way 5.
- **Legend:** host namespace (plain), container namespace (hatched + "C" badge), PID shown as
  "host PID / container PID" pairs; changed rows outlined. "Changed" marks rows that appeared, disappeared
  or got a new PID in this step.
- **Captions:**
  - hr: "*unshare* (odvajanje) je stvorio novi PID *namespace* (imenski prostor): ista ljuska je unutra PID 1, a domaćin je vidi kao 4321."
  - en: "unshare created a new PID namespace: the same shell is PID 1 inside, and the host sees it as 4321."
  - hr: "PID 1 je završio, pa je jezgra poslala SIGKILL svim ostalim procesima u tom imenskom prostoru."
  - en: "PID 1 has exited, so the kernel sent SIGKILL to every other process in its namespace."
- **Terms:** namespace — imenski prostor (NLA toc T07, T11); process — proces; PID — PID (identifikator
  procesa); parent process — roditeljski proces; signal — signal; network interface — mrežno sučelje;
  mount point — točka montiranja; container — kontejner (UL ch08, ch11, ch14).
- **Misconceptions:** a container is a small VM with its own kernel; `ps` inside a PID namespace is
  automatically isolated (it is not without a new `/proc`); isolation is symmetric (the host sees everything).
- **Out of scope:** UTS, IPC, user and cgroup namespaces (user namespaces are `lnx-userns-mapping`, limits
  are `lnx-cgroups`); veth/bridge wiring (`lnx-netns-veth-bridge`); `setns`/`nsenter` beyond a mention;
  capabilities and seccomp.
- **Note for the coordinator:** NLA T07 is network namespaces only; PID and mount namespaces ("what a
  container is") are NLA T11. Sources now cite both.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-namespaces sims/lnx-namespaces` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-namespaces/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
