<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dns-resolution: notes

New stepper (task `docs/tasks/w2/dns-resolution.md`, catalogue `inet-dns-resolution`, wave 2b). It replaces the
placeholder page that stood in `sims/dns-resolution/` (a hand-written six-step list, `languages: ["hr"]`, topic
`networks`). Drawn with kit view **K1, message sequence chart** (`kit/sequence.js`). Rules and expected numbers:
`SPEC.md`.

## Decisions

- **One run = two lookups.** The first (`name`) from an empty cache at t = 0, the second (`again`: the same name or
  another) at t = `advance` with the cache kept. The task's "repeat warm" button is a button that jumps to the second
  lookup's first message (`W`); a stepper replays from its params, so the repeat is part of the run, not an action.
  The `warm`, `same-zone` and `ttl-expired` presets open at step 8 (the first lookup done), so → shows the 2 or 4
  messages the task counts; `cold` and `nxdomain` open at step 0.
- **`again` param** (same / www / mail / nema) added: the `same-zone` preset needs a second name different from the
  first, which the task's single `name` choice cannot give.
- **Two NS per zone** (`a`/`b.root-servers.net`, `a`/`b.ns.hr`, `ns1`/`ns2.grafo.hr`), so rule 8's tie-break (the
  first listed) exists to be tested and is said in the caption once and in the explanation.
- **Expiry tie-break:** an entry with 0 s left is expired (valid while `expiresAt > t`). With `advance` +3600 s and
  TTL 3600 the A record has 0 s left at the second lookup and goes out again: the task's "t = 3601" outcome with the
  task's own +3600 s option.
- **Messages take no time.** Every message of a lookup carries the lookup's t (0 s or the advance); the time column
  shows it. Round-trip times would add numbers without adding to the concept.
- **Glue is folded into its NS row** in the cache view ("+ adrese (*glue*)"): with every A of every name server as a
  row of its own, the `www` row fell off the bottom at 1920×1080. The model keeps them as separate RRsets.
- **The resolver's walk restarts from the deepest NS with a valid address** (RFC 1034 §5.3.3 step 2); after a day
  `grafo.hr` NS (86400 s) has expired but `hr` NS (172800 s) has not, so the second lookup starts at the TLD (6
  messages). Root hints never expire, and with these TTLs a second lookup never reaches the root again.
- **Lane cards** carry a short name, the role (*stub* rezolver, rekurzivni, korijenski poslužitelj, domena .hr,
  mjerodavni) and the address. Server names in the cards would not fit five lanes at 1920×1080; the names appear in
  the captions and the message card.
- **Croatian terms:** "rekurzivni rezolver" (UL) for the role, "*resolver*" (URM) in the task's root caption as
  written; "mjerodavni poslužitelj" (URM, the task's lane) on the page, with "autoritativni" named once in the
  explanation (UL; the glossary's term). Chips are "upit / uputa / odgovor" and `NXDOMAIN` (data).
- Bold answer arrows: K1 has no bold weight, so the page sets `data-weight="bold"` on the answer rows' arrows after
  the chart is built and styles it (Shared requests).

## Deviations from the task

- **Title** "DNS: razrješavanje imena / DNS: name resolution", not the task's "Recursive and iterative resolution":
  `tests/site-lang.test.mjs` searches the real index for "name resolution" and expects the tile "DNS: name
  resolution" (the placeholder's title), and `tests/` is outside this task. The task's words are in the concept and
  the aliases ("rekurzivno i iterativno razrješavanje", "recursive and iterative resolution"). The coordinator may
  retitle and update that test together.
- Added the `again` param (above). `ttlNS` is the `grafo.hr` delegation only; the `hr` delegation is fixed at
  172800 s.
- Presets `warm`, `same-zone`, `ttl-expired` are the second half of a 10- or 12-step run, opening at step 8, not
  separate 2- and 4-step runs (the cache has to be filled by a lookup the student can see).
- The SOA of `grafo.hr` has TTL 3600 and MINIMUM 900 (UL ch19, Primjer 2 gives MINIMUM 900 and `$TTL 3600`). The root
  and `hr` zones have SOAs too (86400/86400, 3600/3600 *(derived)*); they are only read for a name the TLD does not
  delegate, which no preset reaches.

## Sources

- Task file, model and presets.
- URM ch14 "Kako DNS pronalazi odgovor" and Primjer 1 (host `192.168.1.5`, resolver `192.168.1.99`, TTL 3600 s,
  figure `ch14-dns-put-upita.svg`).
- UL ch19 "Tko odgovara kad se pita za ime" (stub, rekurzivni, autoritativni; `aa`; zone), figure
  `put-razrjesavanja-imena.svg` (only the last answer has `aa`), "Vlastiti poslužitelj imena" (`MINIMUM`, negativno
  predmemoriranje), Primjer 2 (900 s).
- RFC 1034 §4.2.1, §4.3.1, §5.3.3; RFC 1035 §3.2.1, §4.1.1; RFC 2181 §8; RFC 2308 §5; RFC 9499.
- Root server addresses: `a.root-servers.net` 198.41.0.4, `b.root-servers.net` 170.247.170.2 (the b-root address
  since 2023) *(check)*. The other server names and addresses are invented (documentation ranges).

## Checks

- Numbers: an independent Python hand model (message count = 2 + 2 × servers asked, expiry at 0 s left) gave
  cold 8/3600, warm 2/3540, same-zone 4, ttl-expired 4, nxdomain 8/900 then 2/840, +1 day 6 before the model was
  run; the model agrees (`sim.test.js`, "presets" and the rule tests).
- Rule tests broken on purpose, 19 mutations one at a time (last NS instead of first, valid at 0 s left, stub
  without rd, iterative with rd, referral with aa, glue not cached, reply with aa, authoritative answer without aa,
  full TTL instead of what is left, no cache check, always from the root, shallowest NS first, negative TTL from the
  SOA TTL, negative TTL the larger, negative entry ignored, `ttlNS` ignored, `advance` ignored, a zone cut matched
  without the dot, no replacement of an RRset): every one fails a test.
- Fresh review (a separate agent read the code against SPEC.md, broke rules and drove the page in both languages):
  model, numbers and flags confirmed. Fixed from it: the reply caption's reason for no `aa` (the resolver is not
  authoritative, not "no authoritative server gave it"), an expired negative entry now has its own caption, the
  Croatian explanation's grammar (accusative after "u", "Ni … ni …", the SOA sentence) and the first-mention gloss of
  *resolver* moved to step 1. Seven mutations that survived its run now have tests (NS expired with glue valid, a
  negative entry for another name, the SOA on NXDOMAIN, the per-lookup query count, the marks of an ask step, the glue
  flag, both root hints): 26 mutations in all, none survive. Left as is: "no packet goes to the root" in the warm
  caption is the task's wording (true, if narrower than "no packet leaves"); the resolver's NXDOMAIN to the stub
  carries no SOA (SPEC, out of scope).
- Page sweep: every step of every combination of `name` × `again` × `advance` in both languages (960 states), no
  console errors, no empty or broken caption, no page scroll at 1920×1080.
- `npm run gate -- dns-resolution`: passes; screenshots 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus `ttl-expired` at step 9 (hr) and `nxdomain` at step 10 (en).

## Unchecked *(check)*

- The b-root address (above).
- Croatian "uputa" for *referral* (URM ch14 uses "uputa"; not in the glossary).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| stub resolver | *stub* rezolver | UL ch19 |
| recursive query | rekurzivni upit | URM ch14 |
| iterative query | iterativni upit | URM ch14 |
| referral | uputa | URM ch14 |
| glue (records) | (no Croatian term; *glue* kept) | — |

## Shared requests

- **K1: a bold arrow weight** (`weight: 'bold'`, the opposite of `'thin'`) for final answers. The page sets
  `data-weight="bold"` on the arrows of its answer rows after `Simdeck.sequence()` returns and styles it in page CSS;
  it depends on K1's row markup (`.sd-seq-row .sd-seq-arrow`).
- **Kit legend swatches** `dot` (a dotted line, for K1's `line: 'dotted'`), `bold` (a thick line) and a badge swatch:
  the page defines them in its CSS.

## Time

Start 2026-10-04 11:21, review fixed, gate passing and status ready 11:44: about 25 min of build and review.
