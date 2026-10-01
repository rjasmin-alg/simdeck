# win-account-lockout: Account lockout

| | |
|---|---|
| Task | `win-account-lockout` (wave 3, Active Directory) |
| Catalogue entry | `win-account-lockout` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-account-lockout/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `active-directory` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-domain-logon` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **threshold, bad-password count checked at the PDC emulator, a stale password locking an account**.

The student: mistype passwords from two machines, keep an old session.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-domain-logon/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "Account lockout threshold"; "Account lockout duration"; "Reset account lockout counter after" (security policy settings reference)
- Microsoft Learn: "Account lockout and management tools" (Windows Server 2003 technical reference: badPwdCount per DC, PDC chaining, password-history N-2 check) (check title)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/pso.txt` (estate PSO with `LockoutThreshold 0`: lockout off for all staff)

## Model and presets

- **Scene:** three machines on the left (`PC-A` laptop, `PC-B` desktop, `phone` with mail sync), two DCs on the right (`DC02`, and `DC01` with a PDC emulator badge). Each DC shows its own `badPwdCount` for user `ana`; DC01 also shows `lockoutTime`. A policy card on top (threshold, reset counter after, lockout duration) and a clock.
- **State:** `{ t (min), policy: { threshold, resetMin, durationMin }, pwd: { current, history: [] }, dcs: { DC01: { bad, lastBad }, DC02: { bad, lastBad } }, locked: null|{ since }, sessions: [{ client, pwdUsed, retryMin }], log: [] }`.
- **One step:** one logon attempt (or one tick of a stale session's retry), in this order: (a) the client sends the password to its DC, (b) the DC checks, (c) on failure it chains the attempt to the PDC emulator, (d) counts and lockout update, (e) caption.
- **Rules (Microsoft: "Account lockout threshold"; "Account lockout duration"; "Reset account lockout counter after"; "Account lockout and management tools"):**
  1. `badPwdCount` is kept per DC and not replicated.
  2. A DC that rejects a password forwards the attempt to the PDC emulator before failing it; the PDC checks and increments its own count. So the PDC's count sees the attempts from every DC (check: chaining for both NTLM and Kerberos).
  3. When a count reaches the threshold the account is locked (`lockoutTime` set), and the lockout replicates urgently to all DCs. Threshold 0 means never lock.
  4. The count resets to 0 if no bad attempt arrives within "Reset account lockout counter after" (`resetMin`); a successful logon resets it too (check: success on a non-PDC DC resets the PDC's count).
  5. A locked account stays locked for `durationMin` (0 = until an admin unlocks), even with the right password.
  6. Password-history check: a wrong password equal to one of the last two passwords in history does not increment `badPwdCount` (check: "N-2" behaviour, needs history ≥ 3).
  7. Stale credentials: a session that keeps the old password (mapped drive, mail sync, scheduled task) retries every `retryMin` and each retry counts as a bad attempt.
  8. Tie-break: attempts in the same minute are processed in client order PC-A, PC-B, phone.
- **Params:** `threshold` range 0–10 default 5; `resetMin` range 1–60 default 30; `durationMin` range 0–60 default 30; `retryMin` range 1–30 default 10; `historyCheck` toggle default on.
- **Presets (5):**
  - `one-pc` — PC-A types the wrong password 5 times via DC02 → DC02 count 5, PDC count 5 → locked at attempt 5. 6 steps. Derived, unchecked.
  - `two-pcs` — PC-A 3 wrong via DC02, PC-B 2 wrong via DC01 (PDC) → DC02 shows 3, PDC 5 → locked; a student summing per DC would expect no lockout. 6 steps.
  - `stale-phone` — `ana` changes her password at t=0; the phone keeps the old one and retries every 10 min → bad attempts at t=0,10,20,30,40 → locked at t=40, PC-A logon at t=45 refused. 7 steps.
  - `old-password` — `ana` types her previous password 6 times → count stays 0 (rule 6, check), not locked. 7 steps.
  - `reset-window` — 4 wrong at t=0–3, pause to t=34 (> 30 min), 4 wrong → count restarts → max 4, not locked. 9 steps.
- **Steps:** max 9.
- **Legend:** bad attempt (✕ arrow), chained to PDC (dashed arrow), good attempt (✓ arrow), counter badge per DC, lock icon; "changed" highlight marks the counter that moved and a new lock.
- **Captions:** hr: "DC02 broji 3, ali DC01 kao *PDC emulator* (emulator PDC-a) broji 5 — prag je 5 i račun je zaključan." en: "DC02 counts 3, but DC01 as PDC emulator counts 5 — the threshold is 5 and the account is locked."
  hr: "Mobitel i dalje šalje staru lozinku svakih 10 minuta: u t = 40 min peti neuspjeh zaključava račun." en: "The phone keeps sending the old password every 10 minutes: at t = 40 min the fifth failure locks the account."
- **Terms (check):** account lockout — zaključavanje računa; lockout threshold — prag zaključavanja; bad password count — brojač neuspjelih prijava; PDC emulator — emulator PDC-a; stale credentials — zastarjele vjerodajnice; password history — povijest lozinki.
- **Misconceptions:** each DC locks independently; the lockout comes from the user, not from a forgotten device; unlocking fixes it (it relocks until the stale session is found).
- **Out of scope:** fine-grained lockout per group (`win-fgpp`), cloud-directory lockout, finding the source in event logs (4740) beyond naming it.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-account-lockout` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-account-lockout sims/win-account-lockout` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-account-lockout/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
