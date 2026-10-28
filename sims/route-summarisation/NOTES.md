<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# route-summarisation: notes

New explorer (task `docs/tasks/w3/route-summarisation.md`, catalogue `net-route-summarisation`, §4.1). Rules, numbers
and sources are in `SPEC.md`; this file holds the decisions around them.

## Decisions

- **Who is behind which router.** The book (ch. 9, Primjer 1) says the branch is "iza drugog usmjernika" and lists a
  link R1–R2; the task's head-office preset calls the branch "R2's own connected /28". So R1 is the head office's
  router (Prodaja, Proizvodnja, Uprava, Gosti behind it), R2 the branch's (Podružnica connected), and the link is
  connected on both. Where the guest network sits is not in the book: it is at the head office with the other
  departments (derived).
- **What "summarising on R2" does.** R2 replaces its picked routes *via R1* with one summary route via R1. Picked
  networks that are R2's own (the branch, the link) count for the summary's arithmetic, as the `exact` and `small`
  presets need, but their connected routes stay in the table: a router always knows its own networks. With no picked
  route via R1 (only the branch and/or the link) nothing is replaced and no summary route is installed; the strip
  still shows the arithmetic and the caption says R2 has nothing to replace.
- **"Risk" only for over-covered ranges** (task rule 6 as written): a block behind R2 inside an installed summary.
  The `exact` preset (Proizvodnja + Uprava + Podružnica → .64/26) therefore shows no risk, although a router that only
  had that summary would also send branch traffic to R1. Flagging picked blocks too would change the task's `exact`
  preset into a warning; owner question in the report.
- **Kinds of over-coverage** (derived from rules 6–7): `risk` (behind R2), `same` (a block R1 reaches too: an R1
  block not picked, or the link), `unused` (nobody's). Each piece also carries R2's choice for it by longest prefix
  match on the table after (`r2`, `safeOnR2`), which is how the page says "on R2 its /28 wins".
- **A block that is switched off still exists**: its route stays in R2's table, and over-covering it is a `same` or
  `risk` piece, never "nobody's". The four24 hint ("switch off 172.16.3.0/24") then shows 256 over-covered addresses
  of a network still behind R1 (harmless), as the task's preset 5 describes.
- **Two strips, not one.** At 1920×1080 the /30 link is 1.6 % of the /24 (about 22 px); the `small` summary is 6 %.
  So the top strip shows the whole plan to scale with the summary bracket, and a second strip shows the summary's
  range alone, where every block and every over-covered piece is readable. The over-covered pieces are also listed
  in words under it (range, count, owner, kind).
- **Bit view** (the 3rd and 4th octet of the lowest and highest address, and the summary's network) makes rule 1
  visible: shared bits filled, the first differing bit highlighted, a bar at the boundary, zeros after it in the
  network row (rule 2: aligned). Both plans' boundaries (/22 … /32) fall inside those 16 bits.
- **The routing tables are plain HTML tables, not kit view K4.** K4 shows one request evaluated against ordered
  rules; here nothing is evaluated row by row, the point is which rows exist before and after. Column names and the
  "preko R1" / "izravno spojeno" wording come from `routing-table` and URM ch. 11 (Primjer 3). No K2 topology either:
  the task's scene is the strip and the table, and the two routers are named in the table and the captions.
- **Legend**: the task asks for one series colour + label per block; the blocks carry their colour, name (or
  number, when narrow) on the strip and in the tables' dots, and the toggles are numbered the same way, so the
  header legend lists the kinds of mark instead (picked, not picked, summary, over-covered, risk, changed). Six
  block entries plus six marks would not fit the header at 1920×1080, and four24 has other blocks.
- **Explorer "changed"**: like `link-aggregation`, the page compares with the state before the last input
  (`changed()` in `sim.js`); a change of plan marks nothing.
- **Captions** are composed from parts so every state reads as one sentence or two: the picked list, the summary,
  how many routes via R1 become one, then either "exact" or the over-covered ranges with the clause for the most
  important kind (risk, then nobody's, then behind R1). The task's `head-office` caption comes out with the same
  content, with digits instead of "tri".
- **Toggles for both plans**: six Grafo toggles and four `n0`…`n3` toggles, shown by plan (`visible`). The kit's
  `.sd-ctl { display: flex }` beats the `[hidden]` attribute, so the page adds `.sd-ctl[hidden] { display: none }`
  (as `amdahl`, `fourier`, `ipv6-slaac` and others do; shared request below).
- **Phone:** strips 3 rem high, block names under 20 % of a strip become their number, the bit view drops the
  "192.168." column and narrows the cells, the tables wrap the hop column.

## Sources

- URM ch. 9 (`book/chapters/09-podmrezavanje.md`): "CIDR zapis i duljina prefiksa", "Izrada adresne sheme" step 4
  and the alignment paragraph (.16 / .32 / .20), Primjer 1 (blocks, the 116-address reserve, "iza drugog
  usmjernika", the link R1–R2). Diagrams `ch09-vlsm-podjela-24.svg` (the strip) and `ch09-poravnanje-binarno.svg`.
- URM ch. 11 (`book/chapters/11-usmjeravanje.md`): longest prefix match and Primjer 2; Primjer 3 for "izravno
  spojeno" in a table.
- `sims/routing-table/` (model and table vocabulary) and `sims/vlsm/` (unit names in both languages).
- RFC 4632 §3.1 (prefix notation) and its aggregation text *(check: the exact section that describes aggregating
  contiguous prefixes was not checked offline)*; RFC 1812 §2.2.5.2 (longest match, as cited by the book).
- The book has no section on summarisation: every summary number is derived, checked by an independent python
  `ipaddress` script before coding.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| route summarisation | sažimanje puteva *(check: not in the book; follows the book's "put" as in "zadani put")* |
| summary route | sažeti put *(check)* |
| alignment | poravnanje (URM ch. 9) |
| longest prefix match | najdulji podudarajući prefiks (URM ch. 11) |
| routing table | tablica usmjeravanja (URM ch. 11) |
| prefix length | duljina prefiksa (URM ch. 9) |
| address block | blok adresa (URM ch. 9) |
| directly connected | izravno spojeno (URM ch. 11) |

## Shared requests

- **models/: an IPv4 + longest-prefix model.** `parse`, `format`, `bits`, `mask`, `match`, `lookup` are copied
  from `sims/routing-table/sim.js @ 06865b7` (which copied the first four from `subnet-mask`), marked in `sim.js`.
  `routing-table`'s NOTES already ask to promote them; this is the third copy. The summary arithmetic (`summarise`,
  `union`, `gaps`, `ownerPieces`, `aligned`, `commonBits`) is pure and could go with them.
- **kit: `.sd-ctl[hidden] { display: none; }`** in `kit.css`, so a param's `visible` works without page CSS (at least
  ten sims carry the same line).
- **Glossary:** the term pairs above with `"src": "simdeck"`.

## Checks

- `npm run gate -- route-summarisation`: pass (manifest, tests, build, browser 46/46, tokens, scope).
- Screenshots reviewed: the gate's set (1920×1080 light, dark, grayscale, help, panel hidden; 375×812; hr and en)
  and every preset plus "nothing picked" and "four24 without 172.16.3.0/24" at 1920×1080 and 375×812.
- Mutations: 13 deliberate breaks of `sim.js` (rule 1 highest address and mask, rule 2, rule 3, rule 4 merge and
  nesting, rule 6 risk kind, connected routes replaced, LPM tie and direction, rule 7, installed without an R1
  route, table order tie-break), each run against `sim.test.js`: all 13 fail a test. The table-order tie-break
  survived the first round and got its own test.
- **Fresh review** (a separate agent, 2026-10-28): recomputed every number in `SPEC.md` and four more combinations
  with python `ipaddress` (all match), 23 more mutations (killed, or unreachable in these plans), and found five page
  problems, all fixed: (1) the "nobody's" caption clause fired when the over-covered ranges also held blocks, and
  when no summary was installed; (2) "which is the branch office" was applied to every listed range; now one sentence
  per kind names only its own blocks, and with no summary installed the ranges are only "would cover"; (3) the
  English explanation said a summary deletes no specific entries, while the table strikes them out; both languages
  now say it replaces only the routes via R1; (4) Croatian gender in the one-block caption ("je sam" for Prodaja,
  Gosti); (5) "behind R1 anyway" for the link, now "R1 reaches it anyway". Its test gaps (r2 = none, safeOnR2 false,
  inSummary, the defaults, the unknown-plan fallback, no-pick counts, ownerPieces' leading gap) got tests.
- The worst caption (Prodaja + Gosti: a risk, blocks R1 reaches and nobody's addresses) was checked at 1920×1080 in
  both languages; the over-covered list groups pieces by kind (one line each) so it fits.
- Not checked: a real projector and clicker; the RFC 4632 section number.

## Time

2026-10-28, 11:58 → 12:20, one session (the fresh review included).
