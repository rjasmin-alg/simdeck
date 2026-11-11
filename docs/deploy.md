# simdeck: publishing

**main is published at <https://materijali.online/simdeck/>**, public, with no login (until 2026-11-11 it sat
behind basic auth).

The deploy connects as `root@materijali.online` (`SIMDECK_DEPLOY_HOST` overrides it) and serves from the nginx vhost
`materijali-online`, the same pattern as the other course materials on that server.

| Command | Does |
|---|---|
| `npm run server:setup -- --dry-run` / `npm run server:setup` | one-time, idempotent: nginx `location /simdeck/` (after `/ossim/`, vhost backed up first, `nginx -t` before reload, backup restored on failure), the removal of the old login file, the web folder, and an `include` of the short-address rules after `/simdeck/`; then checks that the page answers 200 without a login |
| `npm run deploy:dry` | builds from main and shows what would change on the server |
| `npm run deploy` | publishes main, its source archive and its short course addresses, then checks: 200 without a login, that `/simdeck/VERSION` is main's commit and that `/simdeck/source.tar.gz` is served |

Rules the script enforces:
- **Only main is published.** It exports the committed `main` with `git archive`, so uncommitted files and other
  branches cannot go up by accident. `SIMDECK_REF=<ref>` is accepted only with `--dry-run`.
- main has a `build` script (the site frame, `docs/site-structure.md`), so the script runs `npm run build` in the
  export and publishes `dist/`: the home page, the course pages, and each finished sim as one self-contained file.
  There is no `npm ci` in the export: the build uses Node's standard library only. Playwright is needed for the
  thumbnails (next point), and comes from this checkout. (Without a build script it would publish the static tree, and generate a stop-gap list if there
  were no `index.html`; both are fallbacks from before the frame.)
- **Thumbnails** (the home page's tiles, `docs/site-structure.md` §5): before the build, the script runs
  `npm run thumbs` in the export, with this checkout's `node_modules` (Playwright; run `npm ci` once) and this
  checkout's cache, `.cache/thumbs/`. The cache is keyed by each built sim's sha256, so a deploy shoots only the sims
  that changed (about 0.9 s each; a kit change shoots them all, about 70 s for 79 sims). The build then copies the
  matching thumbnails into `dist/thumbs/`. Without Playwright the deploy stops and says so; `SIMDECK_THUMBS=0
  npm run deploy` publishes without thumbnails, and the tiles show placeholders in their topic's colour.
- **Source archive (AGPL-3.0 §13).** Every page links "Izvorni kod / Source code" (`docs/site-structure.md`
  §3.3). The deploy writes `/simdeck/source.tar.gz` with `git archive` from
  the same `main` commit it publishes, so the source offered is always the source served.
- **Short course addresses** (`materijali.online/linux`, set per course in the admin): the script generates one nginx
  rule per course (`scripts/short-links.mjs`) and keeps `/etc/nginx/snippets/simdeck-short.conf` in step. It
  uploads only when the rules changed, runs `nginx -t` before reloading, and restores the previous rules (and
  exits 1) if the test fails. `--dry-run` shows the diff. The include line is added once by `server:setup`;
  until then the deploy says so and installs nothing.
- rsync runs with `--delete --chown=root:root --chmod=D755,F644`. Without them the uid and the 700 mode of the
  temp folder would be copied, and nginx would answer 404 (ossimulator lesson).

"Always publish main" means: after each merge to main, run `npm run deploy`. Nothing runs it automatically,
by design (no background jobs on these machines).
