<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# sql-injection: spec

One concept: **concatenated input becomes code; parameters fix it.** The student types a username and password (or
picks a payload) and sees the query the application builds, token by token, with what came from the input tinted and
what the database reads as code outlined; the table on the right shows which rows come back and who is logged in.

Class: explorer (0 steps). Task file: `docs/tasks/w3/sql-injection.md`.

## Model

- **Table `users`** in primary-key order. Passwords are plain text only to keep the toy small (storing them is the
  subject of `password-storage`).

  | id | name | pass |
  |---|---|---|
  | 1 | admin | `Vr4ta!9` |
  | 2 | ana | `tajna` |
  | 3 | marko | `ljeto26` |

- **Modes.**
  - `concat`: the application glues the fields into the text:
    `"SELECT * FROM users WHERE name='" + user + "' AND pass='" + pass + "'"`. Every character keeps its origin:
    `code` from the template, `data` from a field.
  - `param`: the application sends the fixed template `SELECT * FROM users WHERE name = ? AND pass = ?` and the
    two values separately; a `?` takes one whole value.
- **Tokenizer** (deterministic, in `sim.js`): whitespace; `--` comment to end of line; string literal `'…'` as three
  tokens (quote, content, quote), with `''` inside the content one quote character; digits; words (keyword from a
  fixed list, else a name); operators `= <> != * ; ( ) ,`; `?` placeholder; anything else `other`. Tokens are then
  split where the origin changes, so each displayed token is all code or all data.
- **Roles read as code:** keyword, name, operator, quote, comment, other. Values: string content, number,
  placeholder. **Injected** = some data token has a code role.
- **Parser:** statements separated by `;` (empty ones skipped): `SELECT * FROM users [WHERE e]`,
  `DELETE FROM users [WHERE e]`, `DROP TABLE users`. `e` is `OR` of `AND` of (`NOT` x | `(e)` | a `=`/`<>` b),
  where a, b are a string, a number, a column (`id`, `name`, `pass`) or, in `param` mode only, a placeholder (a `?`
  typed into concatenated text is a syntax error). Chained comparisons (`a = b != c`) are outside the subset. Anything else, or an
  unterminated string, is a syntax error, and then **nothing runs** (the whole text is parsed first).
- **Evaluator:** `=` compares two texts as text and two numbers as numbers; a number against a text converts the
  text when it is a whole number (`'1' = 1` and `id = '01'` are true, as PostgreSQL and MySQL coerce), any other text
  is unequal. SQLite does not coerce here (`'1' = 1` is false there); no preset depends on it. Statements run in
  order; the first error (unknown table or column, a dropped table, a statement the role may not run) stops the rest
  and the application gets an error instead of rows.
- **Role** (`role` param, see Deviations): `login` may only `SELECT` (default); `owner` may also `DELETE` and `DROP`.
- **Application:** if the first SELECT returns at least one row, it logs in as the first row; zero rows: login
  refused; an error: login refused with an error.

## Rules

1. **Concatenation turns a quote into code.** In `concat`, a `'` in the input closes the string literal early and
   the rest of the input is lexed as SQL (OWASP *SQL Injection Prevention Cheat Sheet*: "SQL injection occurs when
   untrusted data becomes part of a query's SQL syntax"; OWASP *SQL Injection*). Test: `ana` gives no data token with a
   code role; `' OR '1'='1` gives data tokens `OR` (keyword) and `'` (quote).
2. **`' OR '1'='1` makes WHERE true for every row.** `AND` binds tighter than `OR` (SQL standard), so the payload in
   the username alone is not enough: `name='' OR '1'='1' AND pass='tajna'` returns only ana. Typed into **both**
   fields (preset `or-true`, the way a login form is attacked) the query is
   `name='' OR '1'='1' AND pass='' OR '1'='1'`, true for all 3 rows; the app logs in as the first, admin (OWASP
   *SQL Injection* shows the same tautology as `name' OR 'a'='a` in the last field; outcome derived; checked against
   SQLite 3, see Numbers).
3. **`admin'--` comments out the password check.** `name='admin'--' AND pass='12345'`: everything after `--` is a
   comment, 1 row (admin) returns, login as admin without its password (derived; OWASP *SQL Injection*: `--` tells
   "most database servers" to treat the rest as a comment; some dialects want a space after `--` *(check per
   dialect)*).
4. **A parameterized query never changes shape.** In `param` the token list is the same for every input (all code),
   and the value is compared as a whole: `' OR '1'='1` in both fields matches no row, login refused (OWASP *Query
   Parameterization Cheat Sheet*).
5. **Escaping quotes is not the fix.** Doubling `'` keeps a quoted string a string, but a number glued in without
   quotes needs no quote: `SELECT * FROM users WHERE id=` + `0 OR 1=1` returns all 3 rows with or without
   escaping (OWASP *SQL Injection Prevention Cheat Sheet*: "Escaping All Dynamic Inputs (STRONGLY DISCOURAGED)",
   "Do not use manual escaping as a substitute for parameter binding"; placeholders cannot carry table or column
   names or ASC/DESC, so a sort order is chosen from an allowlist; second-order injection *(check)*: not on the two
   OWASP pages read). Shown in the explanation and tested in the model, not on the
   stage (the stage has only the login form).
6. **Least privilege bounds the damage.** `'; DROP TABLE users;--` gives two statements. With role `login` the
   SELECT runs (0 rows) and the DROP is refused: error, table intact. With role `owner` the DROP runs: table gone,
   login refused (OWASP *SQL Injection Prevention Cheat Sheet*, least privilege: no DBA or admin access for
   application accounts, "Rarely, if ever, grant create or delete access"; UL ch22 grants privileges per role). Some
   servers refuse several statements in one call and return an error (OWASP *SQL Injection*); this toy accepts them
   so the role is what decides *(check per driver)*.

## Tie-breaks

- **Several rows:** returned in primary-key order; the app takes the first (task file). `or-true` → admin (id 1).
- **Payload vs typed username:** a payload other than `none` fills the username; typing in the field sets
  `payload` back to `none`.
- **Several SELECTs:** the app reads the first SELECT's rows, even when it found none.
- **Error after a SELECT:** the app gets the error and no rows, even when the first SELECT found some.
- **Stacked caption** names the first later statement that writes (DROP, DELETE), else the second statement.
- **Syntax error anywhere:** nothing runs (parse first).
- **Caption case,** first that holds: error (syntax, unknown column; unknown table with a single statement) → `param` (match / fixed if the same
  inputs would inject under concat / no match) → several statements → injected with a comment from the input →
  injected → normal login → wrong password.

## Presets

| id | mode | user | pass | role | rows | outcome | source |
|---|---|---|---|---|---|---|---|
| `normal` | concat | `ana` | `tajna` | login | 2 | login ana | derived |
| `or-true` | concat | `' OR '1'='1` | `' OR '1'='1` | login | 1, 2, 3 | login admin | OWASP example, outcome derived |
| `admin-comment` | concat | `admin'--` | `12345` | login | 1 | login admin | derived |
| `stacked` | concat | `'; DROP TABLE users;--` | `tajna` | login | — | error, DROP refused, table intact | derived *(check per driver)* |
| `fixed` | param | `' OR '1'='1` | `' OR '1'='1` | login | — | refused, no row | OWASP parameterization |

The task file gives `or-true` the payload in the username only; with AND before OR that returns only rows whose
password matches, so the preset puts it in both fields (NOTES.md, Deviations).

## Numbers (checked)

Every preset and eight more inputs were run through the model and through SQLite 3 (Python `sqlite3`, the same
table, the built text or the template with bound values): same rows in every case. The fresh review fuzzed 20 000
inputs against SQLite: every input both accepted gave the same rows apart from text-against-number comparisons
(Evaluator above).

| user | pass | rows |
|---|---|---|
| `ana` | `tajna` | 2 |
| `ana` | `x` | — |
| `' OR 1=1 --` | `x` | 1, 2, 3 |
| `x` | `' OR '1'='1` | 1, 2, 3 |
| `' OR '1'='1` | `tajna` | 2 |
| `'` | `x` | syntax error |
| `marko' AND pass<>'` | `x` | — |
| `it''s` | `x` | — |

## Page

Left: the login form (two text fields, the page's own: the kit has no text param) and the result. Middle: the
application's code, the text the database receives as tokens, the values sent separately (param), and each
statement with its status. Right: the `users` table, returned rows marked, the first one tagged as the one the app
takes, dropped or deleted rows hatched. Legend: input-derived token, code token, quote, returned row, changed.
