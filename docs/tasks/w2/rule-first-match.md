# rule-first-match: First match wins

| | |
|---|---|
| Task | `rule-first-match` (wave 2a, Network fundamentals) |
| Catalogue entry | `net-rule-first-match` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/rule-first-match/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | URM, UL, NLA |
| Topic / tags / level | `networks` / `firewall` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; pilot: its view becomes kit view **K4 rule table with the matching row** (wave 2a) |

## Goal

One concept: **rule lists are evaluated top down, the first match decides, implicit deny**.

The student: send packets/requests through presets: router ACL, stateless firewall, pg_hba.conf.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/22-baze-podataka.md` (Uvod u Linux): "Postavljanje jedne baze: od paketa do prve prijave" (the six-line `pg_hba.conf`, definicija "pravilo prvog pogotka"), Primjer 1 („aplikacija se ne može spojiti na bazu"), Primjer 3 (uloga ima lozinku, a prijava pada)
- `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-22/pravilo-prvog-pogotka.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md` "Vatrozid: filtriranje, segmentacija i ono što nije sigurnosna mjera" (ACL, stateless vs stateful, deny by default), Primjer 5 (filtriranje sa stanjem naspram bez stanja)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vatrozid.html` (the book's stateful-vs-stateless page; link, do not duplicate)
- PostgreSQL documentation, "The pg_hba.conf File" (first matching record, no fall-through, no match = denied)
- Cisco IOS documentation, "Configuring IP Access Lists" (sequence order, implicit deny at the end)
- NIST SP 800-41 Rev. 1, *Guidelines on Firewalls and Firewall Policy* (deny by default; cited by URM ch18)
- Catalogue seed: UL ch22 (pg_hba first match) → §5.1

## Overlaps (catalogue §5)

- **§5.1 First-match rule evaluation:** Build one rule-table evaluator with presets: router ACL, stateless firewall, pg_hba.conf. Keep netfilter (a path through hooks, not one list), PAM (control flags, not first match), NTFS (deny wins, not first match) and the most-specific-wins rules (win-dhcp-scope-options, win-fgpp) separate, because their rules are different; note the contrast on each page.

## Model and presets

- **Scene:** K4 rule table (this sim is its pilot): the rule list as numbered rows with its match columns
  and an action column, plus a final greyed row "(implicit deny)" / "(no entry: reject)". On the left, a
  queue of 3–4 test requests (packets or login attempts) as cards with their fields; the current card sits
  next to the row being tested. Each row gets a mark per request: tested-no-match (–), **match** (▶ and
  the action), not evaluated (greyed). A tally at the bottom: request → deciding row → outcome.
- **State:** `{ preset, rules: [{id, match: {…}, action}], requests: [{id, fields}], cur, row, results:
  [{req, row, outcome}], phase }`. Match fields depend on the preset (type/db/user/address for pg_hba;
  proto/src/dst/port for ACLs). `rules` is a param-editable copy so "fix" toggles change it.
- **One step:** test the current request against one row: compare field by field → match or not. On a
  match: apply the action, grey out every row below, record the result, move to the next request. On no
  match: go to the next row; after the last row apply the implicit rule.
- **Rules:**
  1. Rows are evaluated top down, in file or sequence order (UL `22-baze-podataka.md` "Postavljanje jedne
     baze", definicija "pravilo prvog pogotka"; Cisco "Configuring IP Access Lists": sequence numbers).
  2. A row matches only if **every** field matches (type, database, user, address for pg_hba; protocol,
     source, destination, port for an ACL). Wildcard `all` / `any` matches everything; an address matches if
     it is inside the row's prefix (UL ch22; PostgreSQL docs "The pg_hba.conf File").
  3. The first matching row decides; rows below it are never evaluated (UL ch22; URM ch18 "Vatrozid").
  4. pg_hba edge: if the chosen row's method fails (e.g. `ident`), the connection is rejected; there is no
     fall-through to a later row that would have allowed it (UL ch22 Primjer 3; PostgreSQL docs "There is
     no fall-through or backup").
  5. If no row matches: pg_hba rejects ("no pg_hba.conf entry"); a router ACL drops with the implicit
     `deny any` at the end (Cisco "Configuring IP Access Lists"; URM ch18 "odbij po zadanome").
  6. A stateless filter judges each packet alone: a reply needs its own rule (URM ch18 Primjer 5).
  7. Tie/edge: two rows that both match → only the upper one counts; a row fully covered by an earlier one
     is *shadowed* and is flagged as dead in the table.
- **Params:** `request` select (the preset's test requests, default all in order); `fix` toggle (applies the
  preset's fix: edit a row, move a row up, or add a row; default off); `mode` choice `row` (one step = one
  row) | `request` (one step = one request) (default `row`).
- **Presets:**
  1. `pg-hba` — the six-line file from UL ch22; request `psql -h 127.0.0.1 -U studentdb -d vjezba`: row 1
     (`local`) no, **row 2** (`host all all 127.0.0.1/32 ident`) matches → ident fails → rejected, password
     never asked. A `local` request (`sudo -u postgres psql`) → row 1 `peer` → accepted. From UL ch22
     "Postavljanje jedne baze" and Primjer 3.
  2. `pg-hba-append` — the wrong fix: a `host all all 127.0.0.1/32 scram-sha-256` row appended at the end;
     the same request still stops at row 2 (row 7 shadowed). With `fix` on, row 2 itself becomes
     `scram-sha-256` → password asked → accepted. From UL ch22 Primjer 3.
  3. `router-acl` — inbound ACL on a router: 10 `deny tcp any host 192.168.10.5 eq 22`, 20 `permit tcp any
     host 192.168.10.5 eq 443`, 30 `permit tcp 203.0.113.0/24 host 192.168.10.5 eq 22`. Requests:
     198.51.100.7 → :443 → row 20 permit; 203.0.113.9 → :22 → row 10 deny (row 30 shadowed); 198.51.100.7 →
     :80 → implicit deny. With `fix` on (row 30 moved above 10) the admin's SSH is permitted. Derived,
     unchecked.
  4. `stateless-reply` — client 192.168.1.50:51000 → 203.0.113.10:443 leaves by rule 10 `permit tcp
     192.168.1.0/24 any eq 443`; the reply 203.0.113.10:443 → 192.168.1.50:51000 matches nothing → implicit
     deny. Fix: add `permit tcp any eq 443 192.168.1.0/24` (and the caption notes how wide that is). From
     URM ch18 Primjer 5; rule text derived.
  5. `permit-any-top` — `permit ip any any` as row 1 above three denies: every request matches row 1; the
     denies are dead. Derived.
- **Steps** (`row` mode): `pg-hba` 2 + 1 = 3 (+ outcome steps: 5); `pg-hba-append` 5 + 5 = 10 with the fix;
  `router-acl` 2 + 1 + 4 = 7, 9 with the fix; `stateless-reply` 1 + 2 = 3, 5 with the fix; `permit-any-top` 3.
- **Legend:** row tested, no match (–); matching row (▶, thick outline); not evaluated (greyed, hatched);
  shadowed row (⚠); permit (✓, `--ok`) / deny (✕, `--danger`); "changed" marks the row just tested and the
  row changed by the fix.
- **Captions:**
  - hr: "Redak 2 odgovara vezi (host, 127.0.0.1, svaka baza, svaki korisnik) i nalaže metodu *ident*.
    Provjera pada i veza je odbijena; redak 7 s lozinkom nikad ne dolazi na red."
  - en: "No rule matches 198.51.100.7 → port 80, so the packet falls through to the implicit deny at the
    end of the list. Nothing in the list says so: the deny is invisible."
- **Terms:** first matching entry — pravilo prvog pogotka (UL ch22); access control list — lista kontrole
  pristupa (ACL) (URM ch18); deny by default — odbij po zadanome (URM ch18); stateless / stateful
  filtering — filtriranje bez stanja / sa stanjem (URM ch18); packet filtering — filtriranje paketa; rule —
  pravilo; firewall — vatrozid.
- **Misconceptions:** the most specific rule wins (it is the first one); adding a correct rule at the end
  fixes it; if the chosen rule fails, the next one is tried.
- **Out of scope:** stateful tracking (link `urm-vatrozid`), netfilter chains and hooks (`lnx-netfilter-path`),
  PAM control flags (`lnx-pam-stack`), NTFS deny-wins, Windows Defender Firewall (block rules win regardless
  of order: check, and contrast in the explanation), longest-prefix routing.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `rule-first-match` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh rule-first-match sims/rule-first-match` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/rule-first-match/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
