<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-pam-stack: notes

Task `docs/tasks/w3/lnx-pam-stack.md` (wave 3, Linux, stepper, S, P2, NLA). Rules, numbers and sources: `SPEC.md`.

## Decisions

- **The model is Linux-PAM's dispatcher, checked against the real library.** `runStack` is `_pam_dispatch_aux`
  restricted to the four keywords (verdict so far `none`/`ok`/`fail`, the first failure kept, `sufficient` returning
  only while nothing has failed, the end-of-stack "must fail" check). It was run against Linux-PAM 1.5.3 on this
  machine, unprivileged, with `pam_start_confdir` and `pam_debug.so`, on all 22 620 stacks of one to four lines
  (four flags × success/fail/ignore): code and lines run agree everywhere. 168 of them are pinned in `sim.test.js`.
  The harness is in "Real-run harness" below.
- **K4 with the page's own marks** (`docs/sim-ui.md` §12, "A rule of the page's own"): no fourth "control flags" mode
  was needed. Mapping: not run yet → pending; ignore result or ignored failure → `no` (–); a result that counts →
  `hit` (▷ counts); a success ignored after a failure → `beaten` (▽, the result struck); the line that decides →
  `win` (▶ decides + the outcome); lines below a return → `skip` (hatched, "not run"). The verdict so far is an
  `extra` column. The implicit row is "end of the stack: no module succeeded → refused": it wins only when nothing
  succeeded (rule 6), and is hatched by the page after a return. The line where the stack returns gets a thick bar
  under it and a "■ the stack returns" note.
- **Editing lives on the stage, the attempt in the panel.** A first version had a line selector, flag and result
  controls and ▲/▼ buttons in the panel; it was 1295 px tall (gate: panel ≤ 800). Now the flag cell and the result
  cell are buttons on the stage (click: next flag; click: auto → fail → success → auto), a row is dragged to reorder
  (pointer events, so touch works too), and Alt + ↑/↓ on a focused cell moves its line for keyboard users. Stage
  buttons cancel `mousedown` so a clicker's → still steps. The stack lives in hidden params (`m1…m5` module,
  `f1…f5` flag, `x1…x5` forced result; select/choice with `visible: false`, the amdahl pattern) so presets, reset and
  the URL carry it. All of them `resets: true`.
- **Five slots.** The longest preset (`permit-first`) has five lines; five lines plus the end row fit at 1920×1080.
- **Users**: `ana` (local), `ivan` (directory service, SSSD), `root` (local, uid 0), as the task names them.
- **Captions** come from `captionOf` in the model (tested per branch): the line, its result and why, then what the
  flag did; the verdict names the deciding line, and adds the misconception it answers: a wrong password let in
  (`permit-first`), a right one refused (`deny-too-early`), no module checked the password (`requisite-stops`,
  `permit-first`). The task's caption for `sufficient` after a failed `required` is used word for word as a template.
- **Contrast with first match** (catalogue §5.1): a line under the outcome and a paragraph in the explanation.
- **Concepts, not tools**: PAM, SSSD and the module names are the subject of NLA T58 ("SSSD i PAM u dubinu"), so they
  are named; `/etc/pam.d/system-auth` is the file being taught. No other product is named.

## Deviations from the task

- **`pam_env` returns ignore, not success** (task rule 7). Real run: `auth required pam_env.so` alone → `PAM_PERM_DENIED`,
  i.e. it returned `PAM_IGNORE`; its work is in `setcred`. No preset's verdict changes; the table shows "– ignore".
- **`pam_nologin` returns ignore when the file is absent or the user is root** (task: only "fails for non-root when
  present"; real run, the module's default without `successok`).
- **Preset `deny-too-early` takes 5 steps, not 3.** The task's stack ("`pam_deny` moved above `sufficient pam_unix`")
  is `required pam_env, required pam_deny, sufficient pam_unix, sufficient pam_sss`; by rule 2 the stack runs on
  after `required pam_deny` fails, so all four lines run (real run: 4 ran). Showing that is the preset's point.
- **Rule 5 (`optional`)** is modelled as the dispatcher does it: an `optional` success sets the verdict only if
  nothing has; in stacks with no `required`/`requisite` result this means `optional` can decide when the other lines
  are ignored `sufficient` failures (real run: `optional` success + `sufficient` failure → success). The man page's
  "only if it is the only module" is the common case of this.
- **`state` fields**: the task's `{ lines, attempt, i, failed, firstFail, anySuccess, final, trace }` are there; the
  trace is kept per line (`lines[k].effect`, `.verdict`, `.by`) instead of a separate array, plus `verdict`, `by`,
  `returnedAt`.
- **Panel**: the task's "per-line flag `select`" became a click on the flag cell in the stage (panel height, above).
- **K4 control-flags mode**: not requested from the kit; §12 already says page-set marks are the answer.

## Sources

- pam.conf(5) / pam.d(5), Linux-PAM 1.5.3 (local man pages): keywords and their bracket equivalents.
- Linux-PAM source, `libpam/pam_dispatch.c` (`_pam_dispatch_aux`): impression/status logic, "only care about the
  first error", the end-of-stack sanity check.
- pam_unix(8), pam_sss(8), pam_deny(8), pam_permit(8), pam_nologin(8), pam_env(8), pam_echo(8), pam_debug(8).
- RHEL 9, "Configuring authentication and authorization in RHEL": the authselect `sssd` profile's `system-auth`
  `auth` order (`pam_env`, `pam_unix`, `pam_sss`, `pam_deny`, here without its bracket lines).
- NLA `meta/toc.md` T58 (and T56): the topic; no chapter exists yet.
- `docs/catalogue.md` §5.1.

## Unchecked *(check)*

- The `unix-then-sss` shape against the lab machine's generated `system-auth` (the task asks for it; no lab machine
  here). The real RHEL file uses bracket lines (`[default=1 ignore=ignore success=ok] pam_usertype.so …`,
  `pam_unix … nullok`, `[default=die] pam_faillock`); the preset is the four-keyword skeleton.
- `pam_unix` and `pam_sss` results per user are from their man pages, not run (pam_unix as non-root can only check
  the caller's own password; no SSSD here). The control-flag logic does not depend on them: it was run with
  `pam_debug` standing in.
- Term pairs below marked *(check)*.

## Term pairs (missing from `kit/glossary.js`; written out in both tables until added)

| en | hr | source |
|---|---|---|
| control flag | kontrolna oznaka | task *(check)* |
| authentication | provjera identiteta | task, UL ch07 *(check)* |
| login | prijava | task |
| directory service | imenička usluga | task *(check)* |

Used from the glossary: `stack` (stog), `module` (modul), `first matching entry` (pravilo prvog pogotka).

## Shared requests

- None blocking. A possible kit addition, if a second page needs it: a K4 row-level hook (a class or `data-*` on the
  row) and an implicit-row mark override, so a page with its own marks can hatch the implicit row after an early
  return without its own CSS (`.ps-returned` here).

## Real-run harness

Python 3 with ctypes; no root, no `/etc/pam.d` change (`pam_start_confdir` reads a throwaway directory).

```python
import ctypes, ctypes.util, os, tempfile
pam = ctypes.CDLL(ctypes.util.find_library('pam')); libc = ctypes.CDLL(None); libc.calloc.restype = ctypes.c_void_p
class Msg(ctypes.Structure): _fields_ = [('style', ctypes.c_int), ('msg', ctypes.c_char_p)]
class Resp(ctypes.Structure): _fields_ = [('resp', ctypes.c_char_p), ('code', ctypes.c_int)]
CONV = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_int, ctypes.POINTER(ctypes.POINTER(Msg)),
                        ctypes.POINTER(ctypes.POINTER(Resp)), ctypes.c_void_p)
class Conv(ctypes.Structure): _fields_ = [('conv', CONV), ('data', ctypes.c_void_p)]
LOG = []
@CONV
def conv(n, msgs, resp, _):
    resp[0] = ctypes.cast(libc.calloc(n, ctypes.sizeof(Resp)), ctypes.POINTER(Resp))
    LOG.extend(msgs[i].contents.msg.decode() for i in range(n)); return 0
pam.pam_start_confdir.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.POINTER(Conv), ctypes.c_char_p,
                                  ctypes.POINTER(ctypes.c_void_p)]
CV, D = Conv(conv, None), tempfile.mkdtemp()
def run(lines, user='nobody'):          # lines: ['required pam_debug.so auth=auth_err', ...]
    open(os.path.join(D, 'simtest'), 'w').write(''.join('auth ' + l + '\n' for l in lines))
    h = ctypes.c_void_p(); pam.pam_start_confdir(b'simtest', user.encode(), ctypes.byref(CV), D.encode(), ctypes.byref(h))
    del LOG[:]; rc = pam.pam_authenticate(h, 0); pam.pam_end(h, rc)
    return rc, len(LOG)                 # pam_debug sends one message per line that ran
```

Line k fails with its own code (`auth_err`, `cred_insufficient`, `authinfo_unavail`, `user_unknown`, `maxtries`:
7, 8, 9, 10, 11), so the returned code names the line whose failure was reported; `auth=success` and `auth=ignore`
for the other results; 6 (`PAM_PERM_DENIED`) is "nothing succeeded". A model mutated so that `sufficient` success
after a failure returns disagreed on 675 stacks, so the comparison does catch rule changes.

## Review

A fresh reviewer (a separate agent with no part in the build) read the code against `SPEC.md` and ran 36 mutations
on a copy: every rule and tie-break mutation failed a test. It confirmed the three deviations above (pam_env
ignore, deny-too-early 5 steps, optional + sufficient failure → success). Fixed after the review:
- `e_returns_ok` and the explanation said "no module above failed"; it is "no required or requisite above failed"
  (a `sufficient` failure above does not stop the return, as ivan's preset 1 run shows).
- `cStart` now has plural forms ("ima 3 retka", "has 1 line").
- `why_env`: pam_env does nothing in authentication (it sets the environment in setcred), not "prepares variables".
- The K4 "beaten" word is now "overruled"/"poništen", so it no longer shares "ignored" with the "–" mark; at a failed
  verdict a success that a later failure overruled is drawn as overruled too (`req:S req:F`).
- "No module checked the password" now counts only lines that compared it (not a forced result, not pam_unix
  rejecting a directory user).
- Tests added for the surviving mutations: a negative move target, `firstFail` on a later failure, the
  `vReturnFailEarlier` caption's variables, the frame memo following every param, the password-check extra.
  Left: `stackParams`'s default flag for an empty slot (not observable).

## Time

Start 21:23, done 21:46 (2026-11-03), about 23 minutes.
