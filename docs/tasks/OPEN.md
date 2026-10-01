# Open items

Things that wait on the owner's ratings or answers. None of them blocks a task in `docs/tasks/` from
starting; where a task depends on one, its file says what it does meanwhile.

## Waiting on the owner

| Item | Affects | Meanwhile |
|---|---|---|
| **Interest ratings** (catalogue Int column, `tools/catalogue/ranker.py`) | the order within waves 2–3 | the proposed Pri (B1/P1/P2/P3) orders the work |
| **One home for networking interactives:** simdeck builds the URM book's ~40 planned cards and ports its 14 pages, and both book editions link the simdeck copies? (catalogue §5.19–5.20) | wave-1 URM ports, `freeze-originals` | recommended yes; the ports proceed, the books are not changed |
| **`quick-poll`:** how votes reach the page (shared state, a local server, or typed counts) | `w3/quick-poll.md` | only the model and layouts can be built |
| **`game-tick-server`:** is a tick-batched authoritative server the intended concept? (agentvsagent itself is not tick-authoritative) | `w3/game-tick-server.md` | spec models a tick-batched server |
| **Radio security:** import the Marp slides or the web page, and where is the Marp source? | `w1/radio-security-slides.md`, `w1/radio-security-page.md` | both tasks exist; run one |
| **Source for offline copies:** AGPL §6 asks a conveyed copy (a USB stick) to come with its source, but `npm run build` has no git, so only the deploy writes `source.tar.gz` | USB copies of `dist/` | the pages link `source.tar.gz`; copy the archive next to a USB build by hand (`git archive --format=tar.gz -o <usb>/source.tar.gz main`), or let the build take `--source <file>` |
| **Public repo:** once there is one, set `site.json` `source` to its URL | every page's source link | the deploy's `source.tar.gz` behind the same login |
| **Preset entries on the home page:** every `sim.json` entry is its own line under its sim (`w0/presets-in-index`), so the ~60 ossimulator scenarios add ~60 lines. Keep them all listed, or show a sim's entries only while searching? | `site/core.mjs` `renderIndexList`, `w0/ossimulator-*` imports | every entry listed, indented under its sim |
| **Official course names** (not needed now) | `w4/` course tasks | working names |
| **Admin language:** the admin (`npm run admin`) stays Croatian; only the published site and the sims are bilingual. Bilingual admin too? | `scripts/admin.mjs`, `admin/` | Croatian, with HR and EN fields for everything it edits |
| **Glossary conflicts** between ossimulator and the books (`tools/glossary/seed.py` keeps the first source): *file descriptor* = opisnik datoteke (ossimulator) or datotečni deskriptor (UL book); *parity* = paritet or parnost (UL); *handshake* = rukovanje (UL) or trostruko rukovanje (URM, which is the three-way handshake); *lease*: the UL book names the address "dodijeljena adresa" and says it is not a translation of *lease*, so the glossary has no *lease* | `kit/glossary.js`, every sim's Croatian terms | ossimulator first, then UL, then URM; *lease* left out until decided |

## Decided, still to carry out

| Item | Task |
|---|---|
| AGPL-3.0-or-later in the source repos (owner, 2026-10-02) | `w0/licence-source-repos.md` (changes outside simdeck) |
| ossimulator is the source of truth for its pages (owner, 2026-10-02) | `w0/ossimulator-english.md`; recorded in `docs/site-structure.md` §0 |
| Promote the first shared model: `models/` exists (wave 0 `shared-models`), but no pilot has a model yet. When `dhcp-dora` (the first pilot with soft dependents: `dhcp-relay`, `dhcp-rogue`, `win-dhcp-authorization`) merges, the coordinator moves its lease model to `models/` (`models/README.md`, "Promotion") before those start | `w0/shared-models.md` "Done when"; then each `models/` promotion as its first soft dependent comes up |

## For the books' and the estate's authors

Errata and inconsistencies the specs found (URM ch06/ch10/ch14/ch16, UL ch12 and logrotate, DR-estate caveat
CV-32 and the OU count, KAKA's backup-NCS and priority rules) are listed in `SPEC-NOTES.md`.
