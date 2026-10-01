# publish: build and deploy after every merge

| | |
|---|---|
| Task | `publish` (wave 0 (recurring)) |
| Owner | coordinator |
| Size | S each time |
| Depends on | owner approval for each deploy |
| Licence | AGPL-3.0-or-later |

## Goal

"Adopt it and publish it": every merged sim reaches `https://materijali.online/simdeck/` (login `deck`/`***`,
`docs/deploy.md`).

## Each time

1. On `main` after a merge: `npm test && npm run check && npm run build`.
2. `npm run deploy:dry`, read the diff, then `npm run deploy` (asks nothing; the owner approves the step).
3. The script checks 401 without login, 200 with it, and `/simdeck/VERSION` = `main`'s commit.
4. Course short addresses: paste new nginx rules from the admin's Objava tab (owner, on the server).
5. Nothing runs automatically (no background jobs on these machines, by design).

Recommended cadence: after every wave-1 batch of merges, then after each wave-2 and wave-3 merge.
