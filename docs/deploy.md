# simdeck: publishing

**main is published at <https://materijali.online/simdeck/>**, behind basic auth: user **`deck`**, password *** (realm "simdeck", `/etc/nginx/.htpasswd-simdeck`). The login is deliberately trivial. It only keeps the
pages from being freely reachable, it is not real security, and it is separate from the other course materials
(`/singles`, `/ceph`, … share one login; `/ossim` has its own, ***).

Same VPS (`root@materijali.online`, vhost `materijali-online`) and pattern as ossimulator's `/ossim`.

| Command | Does |
|---|---|
| `npm run server:setup -- --dry-run` / `npm run server:setup` | one-time, idempotent: nginx `location /simdeck/` (after `/ossim/`, vhost backed up first, `nginx -t` before reload, backup restored on failure), the login file, the web folder; then checks 401/200 |
| `npm run deploy:dry` | builds from main and shows what would change on the server |
| `npm run deploy` | publishes main, then checks: 401 without login, 200 with it, and that `/simdeck/VERSION` is main's commit |

Rules the script enforces:
- **Only main is published.** It exports the committed `main` with `git archive`, so uncommitted files and other
  branches cannot go up by accident. `SIMDECK_REF=<ref>` is accepted only with `--dry-run`.
- If `package.json` on main has a `build` script, the script runs `npm ci && npm run build` and publishes `dist/`.
  Until then it publishes the static tree without `docs/`, `scripts/`, tests, kit tooling and package files.
- If there is no `index.html` yet, it generates a temporary list of the native sims from their `#simdeck-meta`
  blocks. The real index (site-frame thread) replaces it as soon as it is on main.
- rsync runs with `--delete --chown=root:root --chmod=D755,F644`. Without them the uid and the 700 mode of the
  temp folder would be copied, and nginx would answer 404 (ossimulator lesson).

"Always publish main" means: after each merge to main, run `npm run deploy`. Nothing runs it automatically,
by design (no background jobs on these machines).
