<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-package-deps: notes

New stepper (task `docs/tasks/w3/lnx-package-deps.md`, catalogue `lnx-package-deps` §4.4, wave 3). No kit view fits
(two repository cards, a work list and a plan table, and the installed set; K4 is one ordered rule list), so the page
draws its own in HTML. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Three panels.** Left the two repositories (`baseos`, `epel`) with their metadata state and their packages
  (`Provides`, `Requires`, `Conflicts` as the RPM tag words); centre the command, the work list ("still to
  satisfy", each capability with the package that asked for it), the last action (the capability, the candidates
  with ✓ chosen or ✗ conflicting and the tie-break key that decided), and the plan as the package manager prints it;
  right the installed packages with `@repo` and `user`/`dep`.
- **One step = one capability**, then summary, order, execute (SPEC.md, Steps). A problem stops at the step that
  finds it, and one abort step follows ("nothing changed").
- **The request is a capability too.** Every package provides its own name (RPM does this implicitly), so the first
  resolve step is the same mechanism as the rest; its caption says so ("a package name is a capability too").
- **Each request has its own small scene** (`REQUESTS` in sim.js): the repositories show only the packages that
  scene uses, so the left column fits one screen. The installed base (`glibc`, `ncurses-libs`, `libevent`, reason
  `user`) is the same everywhere; tmux's two libraries are satisfied by it.
- **`keepLibs`** means "`hwloc` is installed too": the real package that requires `hwloc-libs`. It changes the
  installed set of both htop scenes; with install it gives the cross-check "Install 1 Package" (rule 2), with
  remove the `remove-kept` preset. The toggle is hidden for the tmux and mta-b requests.
- **`epel` metadata:** `new` only in the install-htop scene (the book had just enabled EPEL), `cached` elsewhere
  (htop was installed from it before), `off` when disabled. The first install step downloads it; a remove reads
  no repository (rule 8).
- **Problem texts** are the package manager's English lines as data: `No match for argument: htop` /
  `Error: Unable to find a match: htop` (ch09 "Kad paketa nema", checked on the book's machine); the conflict and
  "nothing provides" lines follow the format of a real run (SPEC.md, Checked on a real system); "nothing provides"
  and "conflicting requests" are libsolv's wording *(check)*. The package manager's own hint `(try to add '--allowerasing' …)` is shown
  as output (the task: "real dnf would offer `--allowerasing`"); the abort caption says letting mta-b in would need
  mta-a to go, "another, larger transaction".
- **Commands and output on the page** (`dnf install htop`, the plan table, `Install 3 Packages`) are the subject
  being taught: UL ch09 teaches dnf and rpm (COMMON.md §1, commands where they are the subject).
- **Croatian:** "razrješavanje ovisnosti" and "metapodaci" as in ch09; the centre panel is "Razrješavanje
  ovisnosti" and captions name the "upravitelj paketima" (the book has no word for "resolver").
- **Installed rows are filled with a neutral tint** (ink 9 % over panel), not a series colour: a reddish fill read
  as "conflict" in the first screenshots.
- **Preset entries** in `sim.json`: `remove-htop` and `conflict` (two of the task's misconceptions; the third,
  "one repository is one vendor's packages", is the default preset).
- Tags: `packages`; topic `linux-admin`; level `intro` (the task's). All exist in `tags.json`.

## Deviations from the task

- **Tie-break order (rule 4):** priority comes right after "already installed", before "name equals capability"
  and version. The task put it after version; dnf.conf(5), quoted in ch09 (note `ch9-dnf-prioritet`), says "If
  there is more than one candidate package for a particular operation, the one from a repo with the lowest priority
  value is picked", i.e. a filter over all candidates. With the task's order a student reading the book would see
  the page contradict it. No preset shows a tie (both repos are priority 99 and every capability has one provider);
  the rule lives in the model and its tests.
- **Step counts:** one uniform scheme (resolve per capability + summary + order + execute; problem + abort) gives
  `htop-epel` 6, `epel-off` 2, `remove-kept` 5 as the task says, and `remove-htop` 6 (task 5), `already-there` 6
  (task 3), `conflict` 2 (task 4). The task's numbers for those three did not follow one rule; 3 for
  `already-there` cannot show both libraries being found installed.
- **Conflict scene:** both toy packages are in `baseos`; the conflict is found when mta-b is chosen (rule 5 as the
  task states it), so there is no second resolve step.
- **Preset order:** htop-epel, already-there, epel-off, remove-htop, remove-kept, conflict. The task listed
  epel-off second; the gate's deep-link check opens the second preset at step 3 (`kit/tools/check-page.mjs` uses
  `min(3, steps)` of the default, not of that preset), which epel-off (2 steps) does not have. See Shared requests.
- **htop's requirements** are cut to `libhwloc.so.15`, the one that crosses repositories (the real list also has
  libc, ncursesw, …), so the book preset keeps its 3 resolve steps.
- **Remove of a package others still require** (dnf would remove those dependents too) is out of scope, like the
  task's other exclusions.

## Sources

- `uvod-u-linux/book/chapters/09-paketi-i-repozitoriji.md` (ch09): "Softver kao paket" (definitions *paket*,
  *ovisnost*, *sposobnost*; `rpm -qR tmux`, 33 lines and no package name, incl. `libevent_core-2.1.so.7` and
  `libtinfo.so.6`), its "Šire o temi" (hard dependencies `Providename`, `Requirename`, `Conflictname`,
  `Obsoletename`), "Repozitoriji i povjerenje" (`dnf install -y htop`: EPEL metadata line, `Installing:` htop
  epel, `Installing dependencies:` hwloc-libs and ocl-icd baseos, `Install 3 Packages`, order 1/3–3/3; `dnf
  remove -y htop`: `Removing:`, `Removing unused dependencies:`, `Remove 3 Packages`, `Erasing` htop, hwloc-libs,
  ocl-icd), "Kad paketa nema" (`No match for argument`), Primjer 1 (no `Installing dependencies:` section when
  nothing is pulled), note `ch9-dnf-prioritet` (dnf.conf `priority`, default 99); figures
  `zahtjev-cilja-sposobnost.svg`, `odakle-paket-dolazi.svg`.
- Versions of htop, hwloc-libs, ocl-icd from ch09; tmux 3.3a from ch09 (release shortened to `13.el10`); hwloc and
  libevent as in the repository; glibc and ncurses-libs versions illustrative.
- **A Rocky Linux 10 container** (`docker run --rm rockylinux/rockylinux:10`, with `epel-release`, on nuc,
  2026-11-12): the chain htop → `libhwloc.so.15` → hwloc-libs → `libOpenCL.so.1` → ocl-icd, hwloc requiring
  `libhwloc.so.15`, `clean_requirements_on_remove = True`, the remove and conflict messages (SPEC.md, Checked on a
  real system). nuc itself has no rpm or dnf. The image was pulled from Docker Hub for this; nothing else changed.
- libsolv's provider choice is richer than rule 4 (architecture, recommends, …), stated as a simplification
  *(check)*.

## Term pairs

From the glossary: *package* — paket, *repository* — repozitorij, *dependency* — ovisnost, *capability* —
sposobnost, *package manager* — upravitelj paketima, *transaction* — transakcija. Missing from `kit/glossary.js`,
written out in the tables (Croatian from ch09):

| en | hr |
|---|---|
| metadata | metapodaci |
| conflict | sukob |
| dependency resolution | razrješavanje ovisnosti |

## Shared requests

- **Kit check-page deep link:** `?preset=<second>&step=<min(3, steps of the default)>` assumes the second preset has
  that many steps; use the preset's own step count (`min(3, stepsOf(preset params))`). Worked around by ordering
  the presets.
- **Kit: `[hidden]` on a control** (as `lnx-permissions-rwx`, `lnx-logrotate` and `lnx-nfs-root-squash` asked):
  the page carries the same one-line workaround for the hidden `keepLibs` toggle.
- **Glossary:** add the term pairs above with `"src": "simdeck"`.
- **Models:** `providers`, `rank`, `conflictsWith`, `depthOrder` and `vercmp` are pure and promotable if a later
  package sim (apt, upgrades) needs them.

## Checks

- Numbers printed from the model for every preset and the cross-checks before the page was written; equal to
  SPEC.md's table.
- Rule tests broken on purpose with a script, one mutation at a time (27, at least one per rule and tie-break key):
  provides by name only, no installed check, no planned check, dependencies limited to one repository, each
  tie-break key dropped, reversed or swapped (priority after version as in the task, version before name), lowest
  version, reversed alphabet, versions compared as strings, conflicts in one direction only, no fallback to the next
  candidate, conflicts only with installed, `nothing` reported as `nomatch`, disabled repositories read, depth ties
  reversed, remove order not reversed, `user` packages removed, the needer ignored, unused dependencies not followed,
  packages being erased counted as needers, no metadata download, epel always new, every package marked `user`,
  every row under `Installing:`, an empty plan not ending. All **27** fail a test.
- Browser (Playwright, the unbuilt page from `file://`): every preset at every step in hr and en at 1920×1080, no
  panel overflowing, no console errors; the conflict and the book preset at 375×812. Fixed from the screenshots:
  the summary lines appearing one step early (when the work list empties, not at the summary step), the disabled
  repository's hatch hidden by the card background, the installed rows' reddish fill, "prazan" under a problem.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page, ran 54 mutations of its
  own on a copy, and swept the page over 4 requests × epel × keepLibs × every step in both languages: no throws, no
  console errors, no empty placeholders). Fixed from it: SPEC's cross-check naming the wrong preset after the
  reorder, the tie-break deviation understated in SPEC (priority also moved ahead of "name equals capability"), the
  erase order worded as "the reverse of rule 6" (ties keep plan order), the State block missing fields; captions
  never naming ocl-icd in `remove-kept` (now "ostaje i ocl-icd, koji hwloc-libs traži") and an ambiguous "on";
  "Kandidat u *conflict* (sukob)" and "kao *metadata* (metapodaci)" in the Croatian explanation; "epel downloads its
  own metadata" (the package manager downloads it); "3 paketa uklonjeno" (now a plural form, "uklonjena su 3
  paketa"); "Jedini paket" when several candidates conflict, and a null `by` when the request is already installed
  (both unreachable from the presets; new strings); `priority` as data. Tests added for its four real survivors:
  depth as the longest chain (not the sum), the `going` case, a needer matching any capability of the provider,
  execution in the computed order, and a remove leaving a `new` repository's metadata alone. All five of those
  mutations now fail; its other survivors are equivalent with this data (the metadata check on every step, the
  abort stage label, `hwloc`'s reason tag, conflict search order). Mine: still 27 of 27.
- `npm run gate -- lnx-package-deps`: pass (manifest, tests 41, build, 63 browser checks, tokens, scope).
  Screenshots at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed.
- Checked in a container: the dependency chain, the sonames, the remove default, the message formats, and presets
  `epel-off`, `already-there`, `remove-htop`, `remove-kept` end to end (SPEC.md, Checked on a real system). Not
  checked: the conflict preset (the toy `mta-a`/`mta-b` do not exist; the format comes from coreutils vs
  coreutils-single); a projector.

## Time

Start 2026-11-12 18:36, done 19:00 (CET), about 25 minutes, one session, including the container checks and
the fresh review.
