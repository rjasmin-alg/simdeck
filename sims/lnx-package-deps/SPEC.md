<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-package-deps: specification

One concept: **repository metadata, dependency trees, conflicts.** A package manager installs or removes one
package by name; a resolver works through a list of capabilities until every requirement has a provider, then
orders and executes the transaction. Task: `docs/tasks/w3/lnx-package-deps.md`. Book: UL ch09 (`uvod-u-linux`,
`book/chapters/09-paketi-i-repozitoriji.md`), cited as "ch09".

## Scene

- **Left: two repositories**, `baseos` (priority 99) and `epel` (priority 99), each a card with its metadata
  state and its packages: name, version, `Provides`, `Requires`, `Conflicts`. A disabled repository is hatched.
- **Centre: the resolver.** The work list (capabilities still to satisfy, each with the package that asked for
  it), the last action (the capability, its candidates, the one chosen or why none), and the plan as a dnf
  table: `Installing:`, `Installing dependencies:`, `Removing:`, `Removing unused dependencies:`, then
  `Transaction Summary` and the order (`Installing : ocl-icd 1/3`).
- **Right: the installed set** (the rpm database): name, origin (`@baseos`, `@epel`), why it is there
  (`user` or `dep`) and its library `Provides`.

## State

```
{ request: { op: 'install'|'remove', name },
  repos: [{ id, enabled, priority, meta: 'cached'|'new'|'downloaded'|'off', pkgs: [pkg] }],
  installed: [pkg + { from, reason: 'user'|'dep' }],
  queue: [{ cap, by }],                       // by: the package that requires cap; null for the request
  last: null | { kind, cap, by, pkg, repo, cands: [{ name, ver, repo, rejected }], key, with, needer },
  resolved: [{ cap, by, kind, pkg }],         // every resolve action so far
  plan: [{ name, ver, repo, section: 'install'|'dep'|'remove'|'unused' }],
  stage: 'resolve'|'summary'|'order'|'execute'|'done'|'aborted',
  order: null | [name],
  problem: null | { kind, cap, by, pkg, ver, repo, with, withVer, withInstalled, withRepo },
  done, changed: [] }
pkg = { name, ver, provides: [cap], requires: [cap], conflicts: [cap] }
```

Every package provides its own name (RPM does, implicitly); a request names a capability like any other.

## Rules

1. **A requirement names a capability** (a library soname, a file, a package name), not a package. Any package
   that `Provides` it satisfies it. (ch09 "Softver kao paket": definitions *ovisnost* and *sposobnost*,
   `rpm -qR tmux`, 33 lines and no package name; figure `zahtjev-cilja-sposobnost.svg`.)
2. **Already satisfied → nothing added.** If an installed package provides the capability, it is marked
   satisfied (✓) and the plan does not grow; the same for a package already in the plan. (ch09 Primjer 1: no
   `Installing dependencies:` section when nothing is pulled.)
3. **Dependencies cross repositories.** `htop` from `epel` pulls `hwloc-libs` and `ocl-icd` from `baseos`. (ch09
   "Repozitoriji i povjerenje", `dnf install -y htop` listing.)
4. **Several providers, tie-break** (a simplification of libsolv): (a) one already installed (that is rule 2),
   (b) the repository with the lowest `priority` value, (c) the package whose name equals the capability,
   (d) the highest version (rpm-style comparison of version-release), (e) the alphabetically first name.
   (dnf.conf(5) `priority`, quoted in ch09 note `ch9-dnf-prioritet`: "If there is more than one candidate package
   for a particular operation, the one from a repo with the lowest priority value is picked"; libsolv, *(check)*.)
   **Deviation:** the task file's order is installed, name, version, priority, name; here priority moves ahead of
   both "name equals capability" and version, because the quoted documentation makes it a filter applied to every
   candidate (NOTES.md).
5. **Conflicts.** A candidate conflicts with a package P (installed or planned) when its `Conflicts` names a
   capability P provides, or P's `Conflicts` names one the candidate provides. Such a candidate is rejected and
   the next one in tie-break order is tried; if none is left, the transaction stops with `Problem:` and nothing
   changes. No capability left without any provider: `nothing provides <cap> needed by <pkg>`; the request
   itself without a provider: `No match for argument: <name>`. (ch09 "Šire o temi": hard dependencies
   `Providename`, `Requirename`, `Conflictname`, `Obsoletename`; "Kad paketa nema": `No match for argument:
   fortune-mod`, `Error: Unable to find a match: fortune-mod`; the conflict lines' format from a real run, below.)
6. **Install order:** a package is installed after the packages it requires. Depth = 0 when it requires nothing
   in the transaction, else 1 + the largest depth of its planned providers; ascending depth, ties in plan order.
   Book: `ocl-icd` 1/3, `hwloc-libs` 2/3, `htop` 3/3. (ch09 listing; the chain htop → hwloc-libs → ocl-icd checked
   with `repoquery --requires` in a Rocky Linux 10 container, 2026-11-12.)
7. **Remove:** the requested package goes under `Removing:`; then its requirements are followed: a provider that
   came as a dependency (`reason: dep`) and that nothing staying installed requires goes under `Removing unused
   dependencies:`, and its own requirements are followed in turn. A provider installed by the user, or still
   required by a package that stays, is kept, and its dependencies with it. Erase order: descending depth (rule 6's
   depth), ties in plan order, so a package goes before the packages it requires: `htop` 1/3, `hwloc-libs` 2/3, `ocl-icd` 3/3.
   (`clean_requirements_on_remove`, default true: checked in the container; ch09 `dnf remove -y htop` listing.)
8. **Metadata is per repository.** An install first downloads the metadata of every enabled repository that has
   none yet (`epel`, just enabled: 6.6 MB in the book) and uses the cached copy of the rest; a disabled repository
   is not read at all; a remove reads only the installed set. (ch09 htop listing: the EPEL line and
   `Last metadata expiration check: 0:00:02 ago`.)

## Steps

One step = one resolver action, then the end of the transaction:

- **resolve** (one per capability taken from the front of the work list): rules 2, 4, 5 for install; rule 7 for
  remove. The first step of an install also downloads missing metadata (rule 8).
- **summary**: `Dependencies resolved.` and `Transaction Summary` with `Install N Packages` / `Remove N Packages`
  (an empty plan: `Nothing to do.`, and the transaction ends here).
- **order**: rule 6 or its reverse; the numbered lines appear, not yet run.
- **execute**: the installed set changes (`reason` `user` for the request, `dep` for the rest), `Complete!`.
- After a problem: one **abort** step: nothing was downloaded or changed.

## Presets (keys 1–6) and expected numbers

Order: the book's install, rule 2, a disabled repository, the two removals, the conflict. (The task's order put
`epel-off`, 2 steps, second; the kit's deep-link check opens the second preset at step 3, so it moved: NOTES.md.)

| # | id | params | steps | outcome |
|---|---|---|---|---|
| 1 | `htop-epel` | install htop, epel on | 6 | `Installing: htop (epel)`, `Installing dependencies: hwloc-libs, ocl-icd (baseos)`, `Install 3 Packages`; order ocl-icd 1/3, hwloc-libs 2/3, htop 3/3; epel metadata downloaded at step 1 |
| 2 | `already-there` | install tmux | 6 | `libevent_core-2.1.so.7` and `libtinfo.so.6` satisfied by installed packages; `Installing: tmux`, no dependencies section, `Install 1 Package` |
| 3 | `epel-off` | install htop, epel off | 2 | `No match for argument: htop`; installed set unchanged |
| 4 | `remove-htop` | remove htop | 6 | `Removing: htop (@epel)`, `Removing unused dependencies: hwloc-libs, ocl-icd (@baseos)`, `Remove 3 Packages`; erase order htop, hwloc-libs, ocl-icd |
| 5 | `remove-kept` | remove htop, keepLibs on | 5 | `Removing: htop`, `Remove 1 Package`; hwloc-libs kept (hwloc requires `libhwloc.so.15`), ocl-icd never examined and kept |
| 6 | `conflict` | install mta-b | 2 | mta-b, the only provider of `mta-b`, conflicts with installed mta-a: `Problem: … conflicts with …`; nothing installed |

Cross-checks: install htop with keepLibs on: 5 steps (`libhwloc.so.15` satisfied by the installed hwloc-libs),
`Install 1 Package`. install tmux with epel off: 6 steps, same plan. remove htop with epel off: as preset 4 (`remove-htop`).

The task file's counts were remove-htop 5, already-there 3, conflict 4; the uniform scheme above gives 6, 6
and 2 (NOTES.md, Deviations).

## Data (illustrative, from ch09 where it has them)

| repo | package | version | provides (besides its name) | requires | conflicts |
|---|---|---|---|---|---|
| epel | htop | 3.3.0-5.el10_0 | | `libhwloc.so.15` | |
| baseos | hwloc-libs | 2.11.1-4.el10 | `libhwloc.so.15` | `libOpenCL.so.1` | |
| baseos | ocl-icd | 2.3.2-8.el10 | `libOpenCL.so.1` | | |
| baseos | hwloc | 2.11.1-4.el10 | | `libhwloc.so.15` | |
| baseos | tmux | 3.3a-13.el10 | | `libevent_core-2.1.so.7`, `libtinfo.so.6` | |
| baseos | libevent | 2.1.12-16.el10 | `libevent_core-2.1.so.7` | | |
| baseos | ncurses-libs | 6.4-14.el10 | `libtinfo.so.6`, `libncursesw.so.6` | | |
| baseos | mta-a | 1.0-1 | `mail-transport` | | `mta-b` |
| baseos | mta-b | 2.0-1 | `mail-transport` | | `mta-a` |

Each scene shows only the packages it uses. Versions of htop, hwloc-libs, ocl-icd and tmux's version are the
book's (tmux's release shortened); hwloc and libevent match the repository (container run); glibc and ncurses-libs
versions are illustrative. The sonames `libhwloc.so.15` and `libOpenCL.so.1` and the chain are checked (container
run); the rest are the book's.
htop's real requirement list is longer (libc, ncursesw, …); the scene keeps the one that crosses repositories.

## Checked on a real system

A throwaway `rockylinux/rockylinux:10` container with `epel-release` (2026-11-12, nuc, `docker run --rm`):
`repoquery --requires htop` lists `libhwloc.so.15()(64bit)` (and libc, libcap, libncursesw, libnl, libtinfo);
`--requires hwloc-libs` lists `libOpenCL.so.1()(64bit)`, provided only by `ocl-icd`; `--requires hwloc` lists
`libhwloc.so.15()(64bit)`; `clean_requirements_on_remove` is `True`; `dnf remove` of a missing package prints
`No match for argument: …` / `No packages marked for removal.`; a conflict with an installed package prints
`Error:` / ` Problem: problem with installed package coreutils-single-…` / `  - package coreutils-… from baseos
conflicts with coreutils-single provided by coreutils-single-… from @System` / `  - cannot install the best
candidate for the job` / `(try to add '--allowerasing' to command line to replace conflicting packages …)`.
Presets end to end: htop with epel disabled prints `No match for argument: htop` / `Error: Unable to find a match:
htop`; tmux with libevent and ncurses-libs installed is `Install 1 Package`; `dnf remove htop` lists hwloc-libs and
ocl-icd under `Removing unused dependencies:`; with `hwloc` installed, both stay. In that minimal image `dnf install
--assumeno htop` pulls five dependencies (also `hwdata`, `libnl3`, `libpciaccess`), which the book's machine already
had: the same rule 2.

## Out of scope

Weak dependencies (`Recommends`, `Suggests`), version ranges, upgrades and `Obsoletes`, modules, GPG checks,
Flatpak, sizes and downloads, removing packages that others still require (dnf would remove those dependents too).
