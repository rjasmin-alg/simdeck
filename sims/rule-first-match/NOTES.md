<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# rule-first-match: notes

New stepper (task `docs/tasks/w2/rule-first-match.md`, catalogue `net-rule-first-match`, overlap §5.1), pilot of kit
view **K4: rule table with the matching row**. Rules and expected numbers: `SPEC.md`.

## Decisions

- **`scene` param.** The five presets are five rule lists, so the list is a param (`scene`, a select, resets to step
  0), and each preset sets it. Same pattern as `arp-local-remote`'s `net`.
- **Every scene has exactly three requests**, so `request` is a fixed choice (all / 1 / 2 / 3): the kit's options are
  static. A number past the list falls back to all (cannot happen with three everywhere).
- **pg_hba takes an extra step for the method** after the match (the task's "+ outcome steps: 5"); an ACL match
  decides in the same step. The implicit rule is a step of its own after the last row's "no".
- **Third requests added** where the task listed fewer, each showing one more rule:
  `pg-hba` request 3, TCP from 192.168.1.20 → rows 1–6 –, "no entry" (rule 5 for pg_hba, otherwise unshown);
  `pg-hba-append` request 3, TCP from `::1` → row 3 (the IPv6 line, ident) rejects even with the fix, as in the
  book, which changed only the 127.0.0.1 line; `stateless-reply` request 3, an unsolicited packet from source port
  443 → denied, and **permitted by the fix**: "how wide that is" made concrete; `permit-any-top` three requests, one
  per kind of deny plus a legitimate one.
- **Fixes:** `pg-hba` and `pg-hba-append`: row 2 → `scram-sha-256` (the book's fix); `router-acl`: row 30 moved to the
  top and renumbered **5** (a sequence list cannot have 30 above 10; "bio 30 / was 30" stays visible);
  `stateless-reply`: add row 20; `permit-any-top`: row 10 moved to the end as **50**.
- **peer and ident** both accept when the client's OS user name equals the database user name (the PostgreSQL docs'
  definition). Request 1's OS user is `student` (the book's shell prompt), its database user `studentdb`, so ident
  fails. On the book's lab host there is probably no ident service at all, which also fails *(check)*; the outcome
  is the same either way.
- **IPv6** is handled only as exact `/128` text: IPv4 and IPv6 never match each other. Enough for `::1/128`.
- **Shadowing** is computed in the model (`shadowed`): one earlier row must cover every field (union of several rows is
  not detected; noted in SPEC). Shown as a dashed "⚠ zasjenjen (n)" tag in the mark column, plus a start caption.
- **Field-by-field marks:** the tested row's mismatching cells are struck through with a ✕ (shape plus `--danger`);
  the caption names the failing columns.
- **"Would have" caption:** after a decision, `laterMatch` finds the first lower row that also matches and what it
  would have decided; if that differs, the caption says it is never reached (row 7 in `pg-hba-append`, row 30 in
  `router-acl`, the denies in `permit-any-top`).
- **Concepts, not tools:** request cards show fields (type, address, user, database, OS user), not a client command;
  the ACL is a generic table (#, protocol, source, ports, destination, action), not a vendor's syntax. `pg_hba.conf`
  and its method names appear because the file is the subject (COMMON.md §1). The vendor named in Sources is only a
  source.
- **Contrasts** (netfilter path, PAM flags, NTFS deny wins, block-before-allow host firewalls, longest prefix) are one
  paragraph of the explanation, generic, no product names. "Some host firewalls apply block rules before allow rules,
  regardless of order" *(check)*.
- **Stateful filtering** is linked through `related: stateful-firewall` (the simdeck copy of the book's page), not
  duplicated.
- **K4 layout:** queue (spans the full height) | rule table (pointer column with the request's number chip, #, match
  columns, action, mark) over the tally. Rows below the match are hatched and greyed with "ne čita se"; the implicit
  row is the last, italic. On a phone the queue goes on top and the table scrolls inside its box. Reusable for later
  K4 pages: the model's `matchRule`/`covers`/`shadowed`/`applyFix`; the table is the kit's (below).
- **On the kit view since kit 0.5.0** (task `kit-rule-table`, 2026-10-04): the rule table (pointer chip, #, match
  columns with the failing fields struck, action, mark column, the winning row's outline, hatched unread rows, the
  implicit row, the fix/was/shadow tags) and the ✓/✕ outcome are drawn by `Simdeck.ruleTable` in mode `first`
  (`docs/sim-ui.md` §12); the legend uses the kit's `rt-*` swatches. The page keeps the request queue and the tally
  and maps its model's marks to `hit`. Screenshots before and after (50 states: 1920×1080 light and dark, 375×812,
  both languages, every preset, request mode) are pixel-identical.
- **Model is promotable:** pure functions over plain data, no strings (`SCENES` holds data only).

## Deviations from the task

- Step counts differ from the task's derived numbers in three places, recomputed from the rules (SPEC.md): `pg-hba`
  12 (task 3 / 5: the third request adds 7); `pg-hba-append` 9 with and without the fix (task "5 + 5 = 10"); `router-acl`
  with the fix 8 (task 9: 3 + 1 + 4); `stateless-reply` 5 with and without (task 3 / 5: the third request adds 2).
  Every run is ≤ 12 steps.
- Param `scene` added (above).
- The task's hr caption is generalised: "Redak 2 nalaže metodu ident: OS korisnik student nije korisnik baze
  studentdb. Provjera pada i veza je odbijena; sljedeći se retci ne razmatraju." and, in `pg-hba-append`, "Redak 7 bi
  vezu prihvatio, ali nikad ne dolazi na red." The en caption is used as written (with the packet in place of the
  address and port).

## Sources

- UL `book/chapters/22-baze-podataka.md`: "Postavljanje jedne baze" (the six-line file, the ident failure, the fix of
  line 115, definicija „pravilo prvog pogotka”), Primjer 3; footnote ch22-pg-prvi-pogodak (PostgreSQL docs 21.1).
- UL `assets/diagrams/chapter-22/pravilo-prvog-pogotka.svg` (read for the convention; not copied).
- URM `book/chapters/18-kiberneticka-sigurnost.md`: "Vatrozid" (packet filtering, ACL, stateless vs stateful, deny by
  default, NIST SP 800-41r1), Primjer 5.
- PostgreSQL documentation "The pg_hba.conf File" (first matching record, no fall-through, `all` vs `replication`,
  ident and peer compare the OS user name).
- Cisco "Configuring IP Access Lists" (sequence numbers, implicit deny) *(not re-read; as cited by the task)*.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| deny by default | odbij po zadanome (URM ch18) |
| implicit deny | implicitna zabrana |
| stateless / stateful filtering | filtriranje bez stanja / sa stanjem (URM ch18) |
| packet filtering | filtriranje paketa (URM ch18) |
| rule | pravilo |
| shadowed rule | zasjenjeno pravilo *(check)* |

Used from the glossary: `first matching entry` (pravilo prvog pogotka), `ACL` (lista kontrole pristupa). Note: the
glossary also has `access control list` → „popis kontrole pristupa” (UL, file ACLs) next to `ACL` → „lista kontrole
pristupa” (URM); this page uses the URM pair, as the task asks.

## Shared requests

None. `models/` unchanged. The evaluator is ready to promote for other K4 pages.

## Checks

- `node --test sims/rule-first-match/sim.test.js`: 26 tests pass.
- `npm run gate -- rule-first-match`: pass (61/61 browser checks). Screenshots looked at: 1920×1080 light, dark,
  grayscale, help, panel hidden, 375×812, both languages; extra states scripted: pg-hba steps 3 and 12, router-acl
  steps 2, 6, 7 and the fix at 0, stateless-reply with the fix at 5, permit-any-top step 1, pg-hba-append at 0,
  request mode, phone mid-run, dark and grayscale mid-run.

## Review

A fresh reviewer read the diff against `SPEC.md` and the task, and found no defect in the model or the captions
(request mode, a single request, the fix, implicit, "would have", shadow and fix captions worked through by hand). They
made 59 mutations of `sim.js`, and 48 failed a test. Of the 11 that survived:
- 9 were real gaps, now covered by 3 new tests: marks reset per request, `test.fields` recorded, single-field misses
  (src port, dst, user, address vs local, prefix boundaries, peer with another name), the first covering row, a port
  number not covering `any`.
- 2 cannot be seen today: shared `match` objects, and pg renumbering after a move. Both become testable if a pg
  move/add fix is ever added.

SPEC now notes three things the reviewer raised: peer/ident without a user-name map, the request fallback, and that
interface direction and TCP-flag ("established") matching are out of scope.

## Time

Start 2026-10-03 20:38 CEST, done 20:58 CEST.
