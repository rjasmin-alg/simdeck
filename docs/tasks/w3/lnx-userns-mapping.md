# lnx-userns-mapping: Rootless containers

| | |
|---|---|
| Task | `lnx-userns-mapping` (wave 3, Linux) |
| Catalogue entry | `lnx-userns-mapping` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-userns-mapping/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `containers` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-namespaces` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **root inside maps to an unprivileged UID outside**.

The student: create files, check owners on the host.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-namespaces/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T17 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T17
- NLA row T17 ("Kontejneri bez `root` ovlasti — što se time dobiva, a što ne") and T11 (namespaces, cgroups, capabilities) (no chapters yet; rules above are (check))
- user_namespaces(7): "User and group ID mappings: uid_map and gid_map", "Unmapped user and group IDs", "Capabilities"; subuid(5), subgid(5); newuidmap(1)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`, "Tko ste vi za sustav" (UIDs, root = 0, `/etc/passwd`) for the identifier vocabulary

## Overlaps (catalogue §5)

- **§5.17 Containers:** Separate pages (each is one concept) on one container diagram.

## Model and presets

- **Reuses from `lnx-namespaces`:** the two-view layout (what the host sees vs what the container sees) and "a container is a process"; here the namespace shown is the user namespace. New here: UID maps, subordinate ID ranges, and files as the place where the two views meet.
- **Scene (one container diagram, §5.17):** left, the container's view: processes with their UIDs (`root 0`, `www 33`, `app 1000`) and `ls -ln` of a bind-mounted directory `/data`; right, the host's view of the same processes (`ps -o user,pid`) and the same directory; middle, the mapping table as `/proc/<pid>/uid_map` shows it (`inside outside count`) and the host user's line in `/etc/subuid` (`student:100000:65536`). An arrow per file links the two owners.
- **State:** `{ map: [{ inside, outside, count }], hostUser: { name, uid: 1000 }, procs: [{ name, uidIn }], files: [{ path, uidOut }], action, result }`.
- **One step:** one action: a container process creates a file; the host lists the directory; the host user edits a file; a container process tries to read a host file bind-mounted in; the page shows the translation in both directions.
- **Rules:**
  1. Each `uid_map` line maps `count` IDs starting at `inside` to IDs starting at `outside`; an ID is translated by the line whose range contains it. (user_namespaces(7) "User and group ID mappings")
  2. Default rootless mapping (generic engine): container 0 → the user's own UID (1000); container 1…65536 → the user's subordinate range 100000…165535 from `/etc/subuid`. So container UID n ≥ 1 is host UID 100000 + n − 1 (33 → 100032, 1000 → 100999). (subuid(5); newuidmap(1); check the engine's default)
  3. IDs with no mapping appear as the overflow ID 65534 (`nobody`) in the other view; host root's files bind-mounted into the container show as `nobody`. (user_namespaces(7) "Unmapped user and group IDs")
  4. Root inside has capabilities only over resources its namespace owns; on host files it acts as UID 1000 and is refused where `student` would be (e.g. a host file of mode 0600 owned by root). (user_namespaces(7) "Capabilities")
  5. The host user cannot directly change files owned by its subordinate IDs (100032 is not 1000); it has to enter the namespace to do so. (user_namespaces(7); engine docs, check)
  6. Rootful contrast: without a user namespace, container root is host root (files on the host owned by 0). (user_namespaces(7))
  7. Tie-break: the map is checked line by line in order; ranges must not overlap (the kernel refuses an overlapping map), so at most one line matches. (user_namespaces(7), check)
- **Params:** `rootless` toggle, default on (off = rootful contrast); `subuidStart` choice 100000 | 200000, default 100000.
- **Presets:**
  - `root-inside` — container root creates `/data/a`: host shows owner `student` (1000). Derived from rule 2, unchecked.
  - `service-user` — container `www` (33) creates `/data/b`: host shows 100032; `student` on the host cannot edit it. Derived, unchecked.
  - `host-file-inside` — a host file owned by root (0), mode 0600, bind-mounted: inside it shows owner `nobody` (65534) and container root cannot read it. Derived from user_namespaces(7), unchecked.
  - `rootful` — `rootless` off: container root creates `/data/c` → host owner `root`. Derived, unchecked.
- **Steps:** one per action: `root-inside` 2, `service-user` 3, `host-file-inside` 3, `rootful` 2.
- **Legend:** inside UID (left badge), outside UID (right badge), mapping line used (highlighted row), unmapped (dashed badge "nobody"), refused (×). "Changed" marks the file created or touched and the mapping row used in this step.
- **Captions:**
  - HR: „Proces `www` u kontejneru ima UID 33. Po drugom retku preslikavanja to je na domaćinu 100000 + 33 − 1 = 100032 — broj koji ne pripada nikome na domaćinu.“
  - EN: "The `www` process in the container has UID 33. By the second mapping line that is 100000 + 33 − 1 = 100032 on the host — a number that belongs to nobody there."
- **Terms:** user namespace — korisnički imenski prostor (check); UID mapping — preslikavanje identifikatora (check); subordinate ID range — podređeni raspon identifikatora (check); rootless container — kontejner bez `root` ovlasti (NLA toc T17); user identifier — korisnički identifikator; capability — sposobnost (UL ch07 uses *sposobnosti*, check).
- **Misconceptions:** root in a rootless container is root on the host; files written by the container belong to the user (only those of container root do); "nobody" means the file has no owner.
- **Out of scope:** group maps in detail (same rule as UID), `setgroups`, ID-mapped mounts, capabilities beyond one sentence, network in rootless mode.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-userns-mapping sims/lnx-userns-mapping` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-userns-mapping/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
