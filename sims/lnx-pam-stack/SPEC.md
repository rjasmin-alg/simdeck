<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-pam-stack: spec

One concept: **required / requisite / sufficient / optional decide a login.** The `auth` section of one
`/etc/pam.d/` file runs top to bottom; each line's control flag combines its module's result with the verdict so
far and says whether the stack goes on or returns. It is not "first match" (catalogue §5.1). Task:
`docs/tasks/w3/lnx-pam-stack.md`. Class: stepper.

## Sources

- **pam.conf(5) / pam.d(5)**, Linux-PAM 1.5.3 (this machine, `man 5 pam.conf`): the four keywords and their
  bracket equivalents: `required` = `[success=ok new_authtok_reqd=ok ignore=ignore default=bad]`, `requisite` =
  `[… default=die]`, `sufficient` = `[success=done new_authtok_reqd=done default=ignore]`, `optional` =
  `[success=ok new_authtok_reqd=ok default=ignore]`.
- **Linux-PAM `libpam/pam_dispatch.c`, `_pam_dispatch_aux`**: how `ok`, `done`, `bad`, `die` and `ignore` change the
  "impression" (the verdict so far) and the status; the end-of-stack sanity check (a stack where nothing succeeded
  fails with `PAM_PERM_DENIED`, the "must fail" code). The model is this loop restricted to the four keywords.
- **pam_unix(8), pam_sss(8), pam_deny(8), pam_permit(8), pam_nologin(8), pam_env(8), pam_echo(8)**: module results.
- **RHEL 9, "Configuring authentication and authorization in RHEL"**: the authselect `sssd` profile's
  `system-auth` `auth` order: `pam_env`, … `pam_unix`, `pam_sss`, `pam_deny` (preset 1, without its bracket lines).
- **Real run** (2026-11-03, this machine: Ubuntu 24.04, Linux-PAM 1.5.3, unprivileged, through `pam_start_confdir`
  with a throwaway config directory): every stack of one to four lines over the four keywords and the three results
  (22 620 stacks), with `pam_debug.so auth=success|ignore|<a different failure code per line>`. The return code
  says which line's failure was reported, and `pam_debug`'s message per line says how many lines ran. The model
  agreed in all 22 620 (and a deliberately broken model, `sufficient` success after a failure returning, disagreed
  in 675). Every stack of one or two lines and the presets' shapes are pinned in `sim.test.js` (`REAL`).
  The module results of rule 7 were run the same way (`pam_env`, `pam_echo`, `pam_nologin` with `file=`).
- **catalogue §5.1**: PAM stays a separate page from the first-match evaluator (`rule-first-match`), because its
  rule is different.

## Model

`runStack(lines)` in `sim.js`, pure, plain data: `lines = [{ flag, result }]`, `flag ∈ { required, requisite,
sufficient, optional }`, `result ∈ { success, fail, ignore }`. The verdict so far is `none`, `ok` or `fail`, with
`by` = the line that set it.

### Rules

1. **Top to bottom, not first match.** Every line combines its result with the verdict so far; a matching (or
   failing) line does not by itself end the stack. (pam.conf(5))
2. **`required`**: a failure makes the verdict `fail` (if it is not already), and **the stack runs on**; a success
   makes it `ok` if nothing has set it yet. (pam.conf(5): "failure … will not be apparent until all of the remaining
   modules … have been invoked"; `default=bad`.)
3. **`requisite`**: like `required`, but a failure **returns at once**; later lines do not run. (`default=die`)
4. **`sufficient`**: a success **returns success at once if no earlier line has failed** the stack (verdict not
   `fail`); after a `required` failure the success is ignored and the stack runs on to its failure. A `sufficient`
   failure is ignored. (pam.conf(5), `success=done default=ignore`; dispatcher: `done` only returns while the
   impression is positive or undecided)
5. **`optional`**: a failure is ignored; a success makes the verdict `ok` only if nothing has set it yet. So its
   result decides the login only when no other line's result counts, which is pam.conf(5)'s "only important if it is
   the only module in the stack". *(Beyond the man page's words, checked by the real run: `optional` success +
   `sufficient` failure → success, because the `sufficient` failure is ignored and nothing else counted.)*
6. **The end of the stack**: verdict `fail` → fail, and the reason is **the earliest failing `required`/`requisite`
   line** (tie-break: a later failure never replaces it; dispatcher: "only care about the first error"); verdict
   `ok` → success, decided by the first line that succeeded; verdict `none` (nothing succeeded, e.g. only ignores and
   ignored failures) → **fail** (dispatcher's sanity check; real run: `PAM_PERM_DENIED`). A `requisite` that returns
   after an earlier `required` failure reports that earlier failure. An `ignore` result never changes the verdict,
   whatever the flag (`ignore=ignore`, `default=ignore`).
7. **Module results** for the attempt `{ user, kind, passwordOk, nologin }`:
   - `pam_unix`: success for a local user (ana, root) with the right password; fail otherwise (ivan is not in
     `/etc/shadow`; a wrong password).
   - `pam_sss`: success for a directory user (ivan) with the right password; fail otherwise (ana and root are not in
     the directory).
   - `pam_deny`: fail. `pam_permit`: success. `pam_echo`: success (it prints a message; real run).
   - `pam_nologin`: fail for a non-root user when `/etc/nologin` exists; otherwise **ignore** (real run: no file →
     `PAM_IGNORE`, root with the file → `PAM_IGNORE`; the module's `successok` option is out of scope).
   - `pam_env`: **ignore** (real run: its `auth` function returns `PAM_IGNORE`; it does its work in `setcred`).
     *Deviation: the task's rule 7 says "pam_env succeeds"; no preset's verdict changes.*
   - A forced result (the page's "fail some") replaces the module's own result for that line.

### Tie-breaks (tested first)

- T1: two failing `required` lines: the reason stays the first (`req:F req:F` → line 1's code).
- T2: `requisite` failing after a `required` failure: returns there, reason line 1 (`req:F rqs:F req:S` → line 1's
  code, 2 lines ran).
- T3: `sufficient` success with an earlier `required` failure does not return (`req:F suf:S req:I` → 3 ran, fail).
- T4: `sufficient` success after an earlier `required` success returns (`req:S suf:S req:F` → success, 2 ran).
- T5: nothing succeeded → fail with no deciding line (`req:I`, `suf:F`, `opt:F` → `PAM_PERM_DENIED`).

## Steps

Step 0: the attempt, nothing run. One step per line that runs (the line's result, what its flag did, the verdict so
far). The last step: the verdict and the line that decided (none for "nothing succeeded": the implicit "end of the
stack" row). Steps = lines run + 1.

## Presets and expected numbers

| # | id | stack (`auth`) | attempt | lines run | steps | verdict | decided by |
|---|---|---|---|---|---|---|---|
| 1 | `unix-then-sss` | required env, sufficient unix, sufficient sss, required deny | ana, right | 2 | **3** | success | 2 (`sufficient pam_unix` returns) |
|   | | | ivan, right | 3 | 4 | success | 3 (`pam_sss`) |
|   | | | root, right | 2 | 3 | success | 2 |
|   | | | ana, wrong | 4 | 5 | fail | 4 (`pam_deny`) |
| 2 | `required-runs-on` | required unix, required env, optional echo | ana, wrong | 3 | **4** | fail | 1 |
| 3 | `requisite-stops` | requisite nologin, required unix | ana, right, /etc/nologin | 1 | **2** | fail | 1 (unix never runs) |
| 4 | `deny-too-early` | required env, required deny, sufficient unix, sufficient sss | ana, right | 4 | **5** | fail | 2 |
| 5 | `permit-first` | sufficient permit + preset 1 | ana, wrong | 1 | **2** | success | 1 |
| 6 | `required-then-sufficient` | required nologin, sufficient unix, required env | ana, right, /etc/nologin | 3 | **4** | fail | 1 |

Defaults = preset 1 → `sim.json` `steps: 3`. Preset 1 with ivan: `pam_unix` fails (ignored), `pam_sss` succeeds at
line 3, as the task says; with a wrong password `pam_deny` fails at line 4. Task step counts match except preset 4:
the task says 3, but rule 2 makes the stack run on after `required pam_deny` fails, so all four lines run (real run:
`req:I req:F suf:S suf:F` → 4 ran). The page shows that, which is the point of the preset.

## Out of scope

Bracket syntax (`[success=1 default=ignore]`), `include`/`substack`, the `account`/`password`/`session` types (one
sentence in the explanation), `pam_faillock` counting, SSSD caching, `pam_nologin`'s options.
