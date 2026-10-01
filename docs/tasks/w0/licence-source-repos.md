# licence-source-repos: AGPL-3.0-or-later in the source repos

| | |
|---|---|
| Task | `licence-source-repos` (wave 0) |
| Owner | a thread per repo (outside simdeck) |
| Size | S |
| Depends on | owner decision 2026-10-02 ("AGPL everything"); one thread per repo or one thread visiting each |
| Licence | AGPL-3.0-or-later |

## Goal

Owner decision (2026-10-02): **AGPL everything**, so the originals stay open, not only the copies in simdeck.

## Repos

`~/projects/ossimulator`, `~/projects/cephsim`, `~/projects/faultline`, `~/projects/topologydrafter`,
`~/projects/single-page-labs` (not a git repo), `~/projects/uvod-u-racunalne-mreze`,
`~/projects/urm-sveucilisni-udzbenik`.

## Do, in each

- Add `LICENSE` with the full AGPL-3.0 text, and `"license": "AGPL-3.0-or-later"` where there is a
  `package.json` (ossimulator: also drop nothing else; `"private": true` may stay, it only stops npm publishing).
- A one-line licence note in the README.
- Keep third-party licences as they are (ossimulator's OFL fonts; 50ohm material stays CC BY 4.0).
- The two books: their `meta/project.yaml` image policy (CC BY / CC0 / PD) is compatible; state in the README
  that the book's own text and code are AGPL-3.0-or-later, as decided.
- Follow each repo's own workflow (its `CLAUDE.md`, branch and merge rules); commit there, push when the remote
  is reachable, or note it in `~/projects/PENDING_PUSH.md`.

## Done when

Each repo has `LICENSE`, the README line and, where present, the package.json field.
