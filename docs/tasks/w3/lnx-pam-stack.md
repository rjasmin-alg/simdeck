# lnx-pam-stack: The PAM stack

| | |
|---|---|
| Task | `lnx-pam-stack` (wave 3, Linux) |
| Catalogue entry | `lnx-pam-stack` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-pam-stack/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `authentication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **required/requisite/sufficient/optional decide a login**.

The student: reorder modules, fail some, log in.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T58 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T58 → §5.1
- NLA row T58 ("SSSD i PAM u dubinu — kako se prijava zapravo sastavlja") and T56 (LDAP/FreeIPA) (no chapters yet; rules above are (check))
- pam.conf(5) / pam.d(5): control values `required`, `requisite`, `sufficient`, `optional`, `include`, `substack`
- pam_unix(8), pam_sss(8), pam_deny(8), pam_permit(8), pam_nologin(8), pam_env(8)
- Red Hat Enterprise Linux 9 documentation, "Configuring authentication and authorization in RHEL" (authselect profiles, the generated `/etc/pam.d/system-auth`)
- `docs/catalogue.md` §5.1 (why PAM stays a separate page from the first-match evaluator)

## Overlaps (catalogue §5)

- **§5.1 First-match rule evaluation:** Build one rule-table evaluator with presets: router ACL, stateless firewall, pg_hba.conf. Keep netfilter (a path through hooks, not one list), PAM (control flags, not first match), NTFS (deny wins, not first match) and the most-specific-wins rules (win-dhcp-scope-options, win-fgpp) separate, because their rules are different; note the contrast on each page.

## Model and presets

- **Scene (K4 rule table, control-flag mode):** the `auth` section of one `/etc/pam.d/` file as an ordered table: control flag, module, its result for this login (success / fail / ignore), and a running "verdict so far" column; the login attempt above it (user, local or directory account, password right or wrong, `/etc/nologin` present or not); the outcome box below ("prijava uspjela" / "odbijena", and which module decided). Modules can be dragged up/down (reorder) and their result forced (fail some).
- **State:** `{ lines: [{ flag: 'required'|'requisite'|'sufficient'|'optional', module, result }], attempt: { user, kind: 'local'|'sss', passwordOk, nologin }, i, failed: false, firstFail: null, anySuccess: false, final: null, trace: [] }`.
- **One step:** evaluate one line: compute the module's result for the attempt, apply its control flag to the running verdict, decide whether to continue or return. The last step shows the final verdict.
- **Rules:**
  1. Lines run top to bottom; the result is not "first match": every flag combines its module's result with the verdict so far. (pam.conf(5))
  2. `required`: failure makes the whole stack fail, but the remaining lines still run (so the user cannot tell which module failed); success continues. (pam.conf(5))
  3. `requisite`: like `required`, but a failure returns at once; later lines don't run. (pam.conf(5))
  4. `sufficient`: success returns success at once **if no earlier `required` failed**; if one did, the success is ignored and the stack continues to its failure. A `sufficient` failure is ignored. (pam.conf(5))
  5. `optional`: its result counts only if it is the only module of this type in the stack. (pam.conf(5))
  6. End of stack: fail if any `required` failed (the first failure's code is reported); otherwise success if at least one module succeeded, else fail. Tie-break: the earliest `required` failure is the reported reason. (pam.conf(5); end-with-no-success → fail, check)
  7. Module results used here: `pam_unix` succeeds for a local user with the right password; `pam_sss` for a directory user with the right password; `pam_deny` always fails; `pam_permit` always succeeds; `pam_nologin` fails for non-root users when `/etc/nologin` exists; `pam_env` succeeds. (pam_unix(8), pam_sss(8), pam_deny(8), pam_permit(8), pam_nologin(8), check)
- **Params:** `user` choice `ana (lokalna)` | `ivan (imenička usluga, SSSD)` | `root`, default `ana`; `passwordOk` toggle, default on; `nologin` toggle, default off; per-line flag `select` and order via the presets (reorder by drag is a page action recorded into params). All `resets: true`.
- **Presets:**
  - `unix-then-sss` — `required pam_env`, `sufficient pam_unix`, `sufficient pam_sss`, `required pam_deny` (the shape of a distribution-generated `system-auth` for SSSD, without its bracket lines): `ana` + right password → success at line 2; `ivan` → `pam_unix` fails (ignored), `pam_sss` succeeds at line 3; wrong password → `pam_deny` fails at line 4. Derived from the generated `system-auth` layout (check against the lab machine).
  - `required-runs-on` — `required pam_unix`, `required pam_env`, `optional pam_echo`, with a wrong password: line 1 fails, lines 2–3 still run, final fail citing line 1. Derived, unchecked.
  - `requisite-stops` — `requisite pam_nologin`, `required pam_unix` with `/etc/nologin` present: stops at line 1, the password is never checked. Derived, unchecked.
  - `deny-too-early` — `pam_deny` moved above `sufficient pam_unix`: nobody logs in, even with the right password. Derived, unchecked.
  - `permit-first` — `sufficient pam_permit` put first: everyone logs in with any password (the classic misconfiguration). Derived, unchecked.
  - `required-then-sufficient` — `required pam_nologin` (fails, `/etc/nologin` present), `sufficient pam_unix` (succeeds), `required pam_env` (succeeds): sufficient does not rescue it, line 3 still runs; final fail citing line 1. From pam.conf(5) `sufficient` text; example derived.
- **Steps:** one per line evaluated plus one for the verdict: `unix-then-sss` 3–5 depending on the user (default 3), `required-runs-on` 4, `requisite-stops` 2, `deny-too-early` 3, `permit-first` 2, `required-then-sufficient` 4.
- **Legend:** line being evaluated (frame), success (check mark), failure (×), ignored (grey dash), stack returned here (stop bar), lines not run (faded). "Changed" marks the line evaluated in this step and the verdict cell it changed.
- **Captions:**
  - HR: „`pam_unix` je uspio, ali iznad njega je `required pam_nologin` već pao. `sufficient` tada ne prekida stog: uspjeh se zanemaruje, a prijava će biti odbijena.“
  - EN: "`pam_unix` succeeded, but `required pam_nologin` above it had already failed. `sufficient` then doesn't end the stack: the success is ignored and the login will be refused."
- **Terms:** module — modul; control flag — kontrolna oznaka (check); stack — stog (check); authentication — provjera identiteta (UL ch07 term, check); login — prijava; first matching entry — pravilo prvog pogotka (the contrast); directory service — imenička usluga (check).
- **Misconceptions:** PAM is first match (it is not; §5.1 contrast with `rule-first-match`); a failed `required` stops the stack (it runs on); `sufficient` always wins.
- **Out of scope:** bracket syntax (`[success=1 default=ignore]`), `include`/`substack` semantics, `account`/`password`/`session` types (one sentence), `pam_faillock` counting, SSSD caching.
- **Shared request (kit):** K4 lists evaluation modes first match, most specific and deny wins; PAM needs a fourth, **control flags** (accumulated verdict column, continue after a hit, return points). Ask the kit owner before building; until then draw the table and say so in NOTES.md.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-pam-stack` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-pam-stack sims/lnx-pam-stack` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-pam-stack/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
