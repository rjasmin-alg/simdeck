# simdeck: publishing

**main is published at <https://materijali.online/simdeck/>**, behind basic auth: user **`deck`**, password *** (realm "simdeck", `/etc/nginx/.htpasswd-simdeck`). The login is deliberately trivial. It only keeps the
pages from being freely reachable, it is not real security, and it is separate from the other course materials
(`/singles`, `/ceph`, … share one login; `/ossim` has its own, ***).

Same VPS (`root@materijali.online`, vhost `materijali-online`) and pattern as ossimulator's `/ossim`.

| Command | Does |
|---|---|
| `npm run server:setup -- --dry-run` / `npm run server:setup` | one-time, idempotent: nginx `location /simdeck/` (after `/ossim/`, vhost backed up first, `nginx -t` before reload, backup restored on failure), the login file, the web folder, and an `include` of the short-address rules after `/simdeck/`; then checks 401/200 |
| `npm run deploy:dry` | builds from main and shows what would change on the server |
| `npm run deploy` | publishes main and its short course addresses, then checks: 401 without login, 200 with it, and that `/simdeck/VERSION` is main's commit |

Rules the script enforces:
- **Only main is published.** It exports the committed `main` with `git archive`, so uncommitted files and other
  branches cannot go up by accident. `SIMDECK_REF=<ref>` is accepted only with `--dry-run`.
- main has a `build` script (the site frame, `docs/site-structure.md`), so the script runs `npm run build` in the
  export and publishes `dist/`: the home page, the course pages, and each finished sim as one self-contained file.
  There is no `npm ci`: the build uses Node's standard library only, and Playwright is needed for checks, not
  for publishing. (Without a build script it would publish the static tree, and generate a stop-gap list if there
  were no `index.html`; both are fallbacks from before the frame.)
- **Short course addresses** (`materijali.online/linux`, set per course in the admin): the script generates one nginx
  rule per course (`scripts/short-links.mjs`) and keeps `/etc/nginx/snippets/simdeck-short.conf` in step. It
  uploads only when the rules changed, runs `nginx -t` before reloading, and restores the previous rules (and
  exits 1) if the test fails. `--dry-run` shows the diff. The include line is added once by `server:setup`;
  until then the deploy says so and installs nothing.
- rsync runs with `--delete --chown=root:root --chmod=D755,F644`. Without them the uid and the 700 mode of the
  temp folder would be copied, and nginx would answer 404 (ossimulator lesson).

"Always publish main" means: after each merge to main, run `npm run deploy`. Nothing runs it automatically,
by design (no background jobs on these machines).
