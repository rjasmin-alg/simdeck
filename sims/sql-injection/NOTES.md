<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# sql-injection: notes

New explorer (task `docs/tasks/w3/sql-injection.md`, catalogue `sec-sql-injection`, wave 3). No kit view fits
(K1–K4 are sequence, topology, rule table, block grid), so the page draws its form, token line and table in HTML.
Rules and expected rows: `SPEC.md`.

## Decisions

- **Class explorer, 0 steps.** The task's header says "stepper", its model says "Explorer" and "Steps: explorer, 0";
  the student types and the query is rebuilt live, so `sim.json` has `class: "explorer"` and no `steps`.
- **A small real evaluator, not canned answers.** `sim.js` tokenizes the built text, parses a subset (SELECT, DELETE,
  DROP TABLE; WHERE with `=`, `<>`/`!=`, AND, OR, NOT, parentheses; `--` comments; `;` between statements) and runs it
  on a three-row table, so anything the student types gets an honest answer. Outside the subset is a syntax error.
  Every preset and eight extra inputs were checked against SQLite 3 (SPEC.md, Numbers).
- **AND binds tighter than OR**, as in SQL. That is why `or-true` puts the payload in both fields (Deviations).
- **Tokens carry their origin.** Each character of the built text is `code` (template) or `data` (a field); tokens are
  split where the origin changes. Drawing: data tinted with a dashed underline; code roles (keyword, name, operator)
  outlined in ink; a quote is an enlarged purple glyph; a code-role token that came from the input gets a thick red
  outline (tint + outline = injection); comments are struck and italic, the part the input commented out stays
  visible. Grayscale keeps all of it (tint, dashes, outlines, glyph size).
- **"Injected"** = some data token has a code role (keyword, name, operator, quote, comment, other). The middle box
  says so in a line under the query (⚠ / ✓).
- **Param mode** shows the fixed template (`?` as dashed slots) and the two values in separate chips; the code shown
  is generic pseudo-code (`prepare(…)`, `q.run(user, pass)`), no library named.
- **Role param** (`login` read only / `owner`) for rule 6 (Deviations). DROP and DELETE need `owner`.
- **Statements:** the whole text is parsed first (a syntax error runs nothing); statements then run in order and the
  first error stops the rest; the app reads the first SELECT and logs in as its first row by `id`.
- **Text fields are the page's own** (the kit has no text param), writing params `user` and `pass`. They are not in
  the URL (the kit writes only spec params); they survive the language switch through `sessionStorage`, restored
  once and only into the same address (the `password-storage` pattern). The `payload` choice fills the username;
  typing sets it back to "your own".
- **Changed:** query tokens between the common head and tail of the previous token list get a yellow bar above them;
  table rows whose returned/deleted state changed get the kit's `.sd-changed` ring on the marker cell.
- **Passwords in the table are plain text** only to keep the toy small; a footnote says so and `related` points to
  `password-storage`.
- **Login result wording** avoids gendered forms in Croatian ("Prijava uspjela: admin").

## Deviations from the task

- **`or-true` fills both fields** with `' OR '1'='1` (task: username). With the username alone the query is
  `name='' OR '1'='1' AND pass='tajna'`, which with AND before OR returns only ana, not every row (checked in SQLite).
  OWASP's own example puts the tautology in the last field. The `payload` param still fills only the username, so
  the precedence case can be shown live; the explanation mentions it. `fixed` uses the same two inputs.
- **`admin-comment` password is `12345`** (any text works; a wrong one shows the check is gone).
- **Extra param `role`** (not in the task's param list) so rule 6 is visible rather than only stated. Default `login`.
- **Rule 5 is in the explanation and the tests, not on the stage**: the stage has only the login form; a numeric field
  would be a second scene. `escapeQuotes`, `numericQuery`, `runText` in `sim.js` back the claim with tests.
- **DELETE** is supported beside DROP, so a student trying it gets a meaningful answer.

## Sources

- OWASP *SQL Injection Prevention Cheat Sheet* (read 2026-10-30): definition "SQL injection occurs when untrusted data
  becomes part of a query's SQL syntax"; "Escaping All Dynamic Inputs (STRONGLY DISCOURAGED)", "Do not use manual
  escaping as a substitute for parameter binding"; placeholders cannot carry table/column names or ASC/DESC, use an
  allowlist; least privilege: no DBA/admin access, "Rarely, if ever, grant create or delete access".
- OWASP *SQL Injection* (community page, read 2026-10-30): tautology `name' OR 'a'='a` making WHERE always true;
  `--` makes "most database servers" treat the rest as a comment; many servers run `;`-separated statements at once,
  some (Oracle) refuse batches with an error.
- OWASP *Query Parameterization Cheat Sheet* and Top 10 A03:2021: named by the task; not re-read, the prevention
  cheat sheet covers the same rule.
- UL ch22 (`uvod-u-linux/book/chapters/22-baze-podataka.md`): an application opens a connection and sends a request,
  not a line of text („Zašto aplikacija ne piše u datoteku sama"); privileges granted per role (§ on roles, the
  PostgreSQL "Privileges" footnote); the browser front end („Sučelje u pregledniku…") uses the word *upit* for a
  query. The chapter's *pripremljeni* is about input prepared with `printf`, not prepared statements.
- SQLite 3 via Python `sqlite3`: cross-check of every preset and eight more inputs (SPEC.md, Numbers).

## Unchecked *(check)*

- Second-order injection (named in the task's rule 5): not on the two OWASP pages read; the page does not mention it.
- `--` without a following space: some dialects require the space; the model follows standard SQL.
- Drivers and multiple statements: "many drivers reject" is from OWASP's server-level statement; per-driver defaults
  not checked.
- Croatian *umetanje SQL-a* (SQL injection) and *izbjegavanje znakova* (escaping): task's suggestions, not found in
  the course books. *Izbjegavanje znakova* is not used on the page (it says "udvostručiti navodnike").

## Term pairs

Missing from `kit/glossary.js`; written out in both tables:

- SQL injection — umetanje SQL-a *(check)*
- prepared statement — pripremljeni upit
- least privilege — najmanja ovlast
- query — upit (UL ch22)
- placeholder — rezervirano mjesto
- string (literal) — niska

## Shared requests

- **Kit text param.** Two more sims now hand-roll a text field with `sessionStorage` (password-storage,
  sql-injection). A `type: 'text'` param (URL-encoded, debounced) would remove that code.

## Fresh review (2026-10-30)

A fresh reviewer read the diff against SPEC.md, fuzzed 20 000 inputs against SQLite and mutated the model. Fixed:

- A `?` typed into the username in concat mode crashed `initial()` (no values to bind); it is now a syntax error.
- `'1' = 1` / `id = '01'`: coercion now converts a whole-number text against a number (PostgreSQL, MySQL); SPEC says
  where SQLite differs.
- Owner role, `'; DROP TABLE users; SELECT * FROM users --`: the caption said "the input broke the query"; a missing
  table after a DROP that ran is now the stacked case. The stacked caption names the first later write statement,
  not just the second statement.
- "Logged in … without the right password" was wrong when the right password was typed with an injection; now
  "through injected code". "The read-only role refuses it" → the role lacks the privilege, so the database refuses.
- Ten mutations were not caught (first-SELECT tie-break, NOT precedence, keyword case, leftover tokens, unknown
  table, DELETE then SELECT, rows kept on error, `;;`, the error/stacked caption): one test now covers them, and a
  rerun of every mutation fails at least one test. One stays equivalent: removing the unterminated-string check
  changes nothing, since such a string can never complete an operand and the parser rejects it anyway.
- Left as is: hr *niska* for a string literal comes from the task's own caption; the reviewer notes *znakovni niz* is
  the more usual Croatian term (owner to decide, docs/tasks/OPEN.md is outside this task's scope, so it is in the
  report).

## Time

Start 15:13, gate passing with the review fixes at 15:31 (2026-10-30): about 20 minutes of wall clock, one session.
