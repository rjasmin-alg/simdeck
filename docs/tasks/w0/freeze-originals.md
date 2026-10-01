# freeze-originals: notes in the original projects pointing to the simdeck copies

| | |
|---|---|
| Task | `freeze-originals` (wave 0 (after wave 1)) |
| Owner | coordinator |
| Size | S |
| Depends on | wave 1 merged; owner approval per repo (outside simdeck) |
| Licence | AGPL-3.0-or-later |

## Goal

Proposal risk "copies drift from their originals": once a page is imported, the original collection is frozen
with a note pointing to its simdeck home (playbook §10.7 step 5).

## Do, per repo, after asking the owner

- `~/projects/single-page-labs` (not a git repo): a note at the top of each imported page and in `index.html`.
- `~/projects/uvod-u-racunalne-mreze` and `urm-sveucilisni-udzbenik`: the 14 interactive pages now live in
  simdeck; decide with the owner whether the book embeds or links the simdeck copies (catalogue §5.19–5.20).
- `~/projects/cephsim`, `faultline`, `topologydrafter`: README note.
- ossimulator: per the decision in `ossimulator-english`.
- 50ohm: nothing to freeze (upstream content); simdeck's copies carry the attribution.
- Old URLs (`/singles`, `/ceph`, `/faultline`, `/topologija`): keep, or redirect to simdeck (owner decides;
  the nginx change is the deploy's job).
