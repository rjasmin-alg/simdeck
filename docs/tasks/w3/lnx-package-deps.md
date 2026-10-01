# lnx-package-deps: Package dependency resolution

| | |
|---|---|
| Task | `lnx-package-deps` (wave 3, Linux) |
| Catalogue entry | `lnx-package-deps` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-package-deps/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `packages` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **repo metadata, dependency trees, conflicts**.

The student: install packages into a small repo.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/09-paketi-i-repozitoriji.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-09/`
- Catalogue seed: UL ch09
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/09-paketi-i-repozitoriji.md`: "Softver kao paket" (definition *ovisnost*, `rpm -qR tmux`, `Provides`/`Requires`), its "Šire o temi" (hard/soft dependencies: `Providename`, `Requirename`, `Conflictname`, `Obsoletename`), "Repozitoriji i povjerenje" (`dnf install -y htop` from EPEL with two `baseos` dependencies; `dnf remove -y htop` with `Removing unused dependencies:`), Primjer 1 ("naredba koja ništa ne mijenja"); figures `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-09/zahtjev-cilja-sposobnost.svg` and `odakle-paket-dolazi.svg`
- rpm.org "Dependencies" (RPM manual), dnf.conf(5) (`priority`, `clean_requirements_on_remove`) (check)

## Model and presets

- **Scene:** left, two repositories (`baseos`, `epel`), each a card with its metadata: package name, version, `Provides`, `Requires`, `Conflicts`; right, the installed set (the rpm database) as a list; centre, the resolver's work list (capabilities still to satisfy) and a growing dnf-style plan table with sections `Installing:`, `Installing dependencies:`, `Removing:`, `Removing unused dependencies:`, ending in `Transaction Summary` and the install order (`Installing : … 1/3`).
- **State:** `{ repos: [{ id, pkgs: [{ name, ver, provides, requires, conflicts }] }], installed: [{ name, reason: 'user'|'dep' }], request: { op: 'install'|'remove', name }, queue: [cap], plan: [{ name, repo, section }], order: [name], problem: null|string, done }`.
- **One step:** one resolver action: take the first capability from the queue; if an installed or already-planned package provides it, mark it satisfied; else choose a provider from the enabled repos (rule 4), add it to the plan and push its `Requires`; check conflicts. Final steps: compute the order, then "execute" (install or erase).
- **Rules:**
  1. A requirement names a capability (a file path, a library soname, `rpmlib(...)`), not necessarily a package; any package that `Provides` it satisfies it. (ch09 "Softver kao paket", definition *ovisnost*, `rpm -qR tmux` listing, figure `zahtjev-cilja-sposobnost.svg`)
  2. Already satisfied by an installed package → nothing is added (Primjer 1: "naredba koja ništa ne mijenja"). (ch09 Primjer 1)
  3. Dependencies don't respect repository boundaries: `htop` from `epel` pulls `hwloc-libs` and `ocl-icd` from `baseos`. (ch09 "Repozitoriji i povjerenje", `dnf install -y htop` listing)
  4. Several providers (tie-break, a simplification of libsolv): prefer one already installed, then one whose name equals the capability, then the highest version, then the lower repo `priority`, then alphabetical name. (dnf.conf(5) `priority`; libsolv, check)
  5. `Conflicts`: a candidate that conflicts with an installed or planned package is rejected; if no other provider exists, the transaction stops with `Problem: …` and nothing changes. (ch09 "Šire o temi" hard dependencies incl. `Conflictname`; rpm.org "Dependencies", check message text)
  6. Order: a package is installed after the packages it requires (book's order: `ocl-icd` 1/3, `hwloc-libs` 2/3, `htop` 3/3). Tie-break: equal depth → plan order. (ch09 listing; the chain htop → hwloc-libs → ocl-icd is inferred from that order (check `rpm -qR`))
  7. Remove: the package is erased first, then "unused dependencies": packages installed only as dependencies that nothing still installed requires (`clean_requirements_on_remove`, default true, check). (ch09 `dnf remove -y htop` listing)
  8. Metadata is per repository: a newly enabled repo downloads its own list first. (ch09 htop listing, EPEL metadata line)
- **Params:** `epel` toggle (repository enabled), default on; `request` select over the preset requests (install htop, remove htop, install tmux, install `mta-b`…); `keepLibs` toggle (another installed package requires `hwloc-libs`), default off.
- **Presets:**
  - `htop-epel` — `dnf install htop`: plan `Installing: htop (epel)`, `Installing dependencies: hwloc-libs, ocl-icd (baseos)`, `Install 3 Packages`, order ocl-icd → hwloc-libs → htop. From ch09.
  - `epel-off` — same with `epel` off: `No match for argument: htop` (check message). Derived, unchecked.
  - `remove-htop` — `dnf remove htop`: `Removing: htop`, `Removing unused dependencies: hwloc-libs, ocl-icd`, `Remove 3 Packages`. From ch09.
  - `remove-kept` — the same with `keepLibs` on: only `htop` goes; `hwloc-libs` stays and so does `ocl-icd`, which it requires. Derived, unchecked.
  - `already-there` — `dnf install tmux` with its libraries installed: one package, no `Installing dependencies:` section. Derived from ch09 Primjer 1, unchecked.
  - `conflict` — a toy repo with generic names: `mta-a` installed, request `mta-b`; both provide `mail-transport` and conflict: `Problem: … conflicts with …`, nothing installed (real dnf would offer `--allowerasing`). Derived, unchecked.
- **Steps:** `htop-epel` 6 (3 resolve + order + execute + summary), `epel-off` 2, `remove-htop` 5, `remove-kept` 5, `already-there` 3, `conflict` 4.
- **Legend:** requested package (bold border), dependency (normal), capability chip (rounded, e.g. `libhwloc.so.15`), satisfied (check mark), conflicting (red outline + ×), installed (filled), to be erased (struck). "Changed" marks the capability being resolved and the plan row added.
- **Captions:**
  - HR: „`htop` traži sposobnost `libhwloc.so.15`. Nju ne pruža `epel` nego paket `hwloc-libs` iz `baseos`-a: ovisnosti ne poštuju granicu repozitorija.“
  - EN: "`htop` requires the capability `libhwloc.so.15`. It is provided not by `epel` but by `hwloc-libs` from `baseos`: dependencies don't respect repository boundaries."
- **Terms:** package — paket; repository — repozitorij; dependency — ovisnost; capability — sposobnost; package manager — upravitelj paketima; transaction — transakcija; metadata — metapodaci; conflict — sukob.
- **Misconceptions:** a dependency names another package; removing a package leaves its dependencies (dnf removes unused ones); one repo means one vendor's packages (dependencies cross).
- **Out of scope:** weak dependencies (`Recommends`, `Suggests`), version ranges beyond one number, upgrades and `obsoletes`, modules, GPG checks (ch09's trust section), Flatpak.
- **Note:** the exact soname (`libhwloc.so.15`) is illustrative (check against `rpm -qR htop` on the lab machine).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-package-deps sims/lnx-package-deps` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-package-deps/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
