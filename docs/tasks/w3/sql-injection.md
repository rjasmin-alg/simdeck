# sql-injection: SQL injection

| | |
|---|---|
| Task | `sql-injection` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-sql-injection` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/sql-injection/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | SEC |
| Topic / tags / level | `security` / `attacks` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **concatenated input becomes code; parameters fix it**.

The student: type inputs, see the built query.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.

## Sources

- Local course material: UL ch22 (databases), below. Use OWASP guidance for the attack and fix; mark every rule you could not check with *(check)* and list it in `NOTES.md`.
- OWASP: *SQL Injection* (attack definition) and *Query Parameterization Cheat Sheet* (the fix); OWASP Top 10 A03:2021 Injection.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/22-baze-podataka.md`, „Zašto aplikacija ne piše u datoteku sama" and „Tri imena, dvije loze i jedno odvajanje" (an application sends a request, not a line of text; roles and least privilege); „Sučelje u pregledniku, i što se njime izlaže" (what a web front end exposes); term *upit*, *pripremljeni*.

## Model and presets

- **Scene:** a login form (username, password) on the left; the middle shows how the application builds the SQL
  string from the input; the right shows the database's `users` table and what the query returns. The built query
  is drawn as tokens, with the parts that came from user input tinted and the parts the database reads as code
  (keywords, operators, string delimiters) marked. A toggle switches the app between string concatenation and a
  parameterized (prepared) statement. Explorer.
- **State:** `{ mode: 'concat'|'param', inputs: {user, pass}, template, built, tokens: [{text, origin:
  'code'|'data', role}], rows, returned, authenticated, note }`; the "database" is a tiny fixed table and a
  deterministic query evaluator in `sim.js` (no real SQL engine).
- **Params drive live:** editing the username or password rebuilds the query live; in `concat` mode the input can
  change which tokens are code; in `param` mode the input is always bound as one data value and the token
  structure never changes.
- **Rules:**
  1. Concatenation: `"SELECT * FROM users WHERE name='" + user + "' AND pass='" + pass + "'"`; a `'` in the input
     closes the string literal early, so the rest of the input is parsed as SQL (OWASP *SQL Injection*; textbook).
  2. The classic bypass `' OR '1'='1` makes the WHERE clause always true, returning every row; the app logs in as
     the first row (derived, standard example).
  3. `admin'--` closes the name string and comments out the password check, logging in as admin (derived).
  4. A parameterized query sends the template and the values separately; the value can never become code, so the
     same inputs just fail to match (OWASP *Query Parameterization Cheat Sheet*; UL ch22 „Sučelje u pregledniku…"
     uses `printf`-prepared, separated arguments in the same spirit).
  5. Escaping or blocklisting single quotes is not the fix: numeric contexts, second-order injection and missed
     encodings defeat it; parameterization removes the category (OWASP).
  6. Least privilege: the app's database role should not be able to drop tables, so even a successful injection is
     bounded (UL ch22 „Tri imena, dvije loze i jedno odvajanje"; principle of least privilege).
  Tie-break: when a query returns several rows, the app uses the first by primary-key order; the sim shows that.
- **Params:** `mode` choice concat/param (concat); `user` text (default "ana"); `pass` text (default "tajna");
  `payload` choice none / `' OR '1'='1` / `admin'--` / `'; DROP TABLE users;--` (none, fills the username field).
  Text fields are page-level (kit has no text param; note in NOTES.md).
- **Presets:**
  - `normal` mode=concat, user="ana", pass correct: one row, authenticated as ana. Derived.
  - `or-true` user=`' OR '1'='1`, mode=concat: WHERE is always true, all rows returned, logged in as the first.
    OWASP canonical example, outcome derived.
  - `admin-comment` user=`admin'--`, mode=concat: password check commented out, logged in as admin. Derived.
  - `stacked` user=`'; DROP TABLE users;--`: shows how stacked statements would run; the caption notes that many
    drivers reject multiple statements, and least privilege would block the DROP. Derived; blocked-by-default
    note *(check per driver)*.
  - `fixed` same `' OR '1'='1` input, mode=param: bound as a literal name, zero rows, login fails. From OWASP
    parameterization guidance.
- **Steps:** explorer, 0.
- **Legend:** input-derived token (tinted), SQL keyword/operator the database treats as code (bold outline),
  string delimiter `'` (distinct mark), returned row (highlighted table row), changed (kit highlight on tokens or
  rows that changed since the last input).
- **Captions:** hr: "Navodnik u polju zatvori nisku prerano — ostatak unosa baza čita kao naredbu." / en: "The
  quote in the field closes the string early — the database reads the rest of the input as a command." — hr:
  "Parametrizirani upit: isti unos je sada samo vrijednost, nijedan redak se ne poklapa." / en: "Parameterized
  query: the same input is now just a value, and no row matches."
- **Terms:** SQL injection — umetanje SQL-a *(check)*; query — upit (UL ch22); prepared/parameterized statement —
  pripremljeni upit (UL ch22 *pripremljeni*); table — tablica; row — redak; placeholder — rezervirano mjesto;
  least privilege — najmanja ovlast; escaping — izbjegavanje znakova *(check)*.
- **Misconceptions:** escaping quotes is enough; injection needs a quote (numeric and ORDER BY contexts do not);
  only login forms are vulnerable.
- **Out of scope:** blind/time-based injection timing, ORM specifics, NoSQL injection, WAF rules.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh sql-injection sims/sql-injection` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/sql-injection/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
