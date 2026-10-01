# win-fgpp: Password policy and fine-grained policies

| | |
|---|---|
| Task | `win-fgpp` (wave 3, Active Directory) |
| Catalogue entry | `win-fgpp` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-fgpp/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `group-policy` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-gpo-precedence` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **one domain policy from the Default Domain Policy GPO; PSOs override it by precedence**.

The student: apply PSOs to users and groups, see the winner.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-gpo-precedence/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.1
- Microsoft Learn: "AD DS fine-grained password and account lockout policy step-by-step guide" (check title); "Configuring fine-grained password policies for AD DS" (precedence, direct vs group, GUID tie-break) (check title)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/pso.txt` (PSO `Default-Staff`, precedence 10, MinPasswordLength 4) and `gpos.txt` (Default Domain Policy min length 7)

## Model and presets

- **Scene:** K4 rule table of candidate password policies for one user, one row each: the domain policy (from the GPO linked at the domain root), and each PSO with name, precedence, how it reaches the user (direct / via group `X`), and its values (min length, complexity, lockout threshold). On the left, user `ana` with her groups; the winning row is highlighted and copied into `msDS-ResultantPSO`.
- **State:** `{ user: { id, groups: [] }, psos: [{ id, precedence, guid, appliesTo: [principals], settings }], domainPolicy: { source, settings }, cursor, winner }`.
- **One step:** evaluate one candidate row in order (direct PSOs, then group PSOs, then the domain policy), keep or drop it, then announce the winner.
- **Rules (Microsoft: "AD DS fine-grained password and account lockout policy step-by-step guide"; "Configuring fine-grained password policies for AD DS" (check titles)):**
  1. The domain's password and lockout policy for domain accounts comes from GPOs linked at the domain root (by convention Default Domain Policy); among several, normal GPO precedence picks the value.
  2. A password policy in a GPO linked to an OU does not affect domain accounts; it only sets the local SAM policy of computers in that OU.
  3. PSOs need domain functional level 2008+; they apply to users and global security groups only — not to OUs (use a shadow group).
  4. If the user has one or more PSOs applied directly, the one with the lowest precedence value wins and group PSOs are ignored.
  5. Otherwise, among PSOs reaching the user through group membership (including nested groups (check)), the lowest precedence value wins.
  6. Tie-break: equal precedence → the PSO with the smallest `objectGUID` wins.
  7. No PSO → the domain policy (rule 1) applies. A PSO replaces the whole domain policy for that user, not field by field.
- **Params:** `directPso` toggle default off (PSO `VIP`, precedence 50, on ana); `group2` toggle default off (ana in `Finance`, PSO precedence 5); `samePrecedence` toggle default off.
- **Presets (5):**
  - `quillmoor` — estate: domain policy min length 7 (`gpos.txt` comment), PSO `Default-Staff` precedence 10 on `All Staff` with min length 4, complexity off, lockout threshold 0 (`pso.txt`) → staff passwords may be 4 characters, no lockout. From the DR estate.
  - `two-groups` — ana in `All Staff` (10) and `Finance` (5) → Finance (5) wins. 3 steps. Derived, unchecked.
  - `direct-beats-group` — direct `VIP` (50) vs group `Finance` (5) → `VIP` wins despite the higher number (rule 4). 3 steps.
  - `tie` — two group PSOs both precedence 10 → smaller GUID wins (rule 6). 3 steps.
  - `ou-gpo` — admin links a password GPO (min 14) to `OU=Staff` → domain users unaffected, ana still under `Default-Staff` (rule 2). 3 steps.
- **Steps:** max 4.
- **Legend:** domain policy row (base), PSO row (tag), via-group (link icon) vs direct (pin), dropped (struck through), winner (highlight + ✓); "changed" highlight marks the row just evaluated.
- **Captions:** hr: "Izravno dodijeljen PSO `VIP` (prednost 50) pobjeđuje grupni `Finance` (5): izravni se gledaju prvi." en: "The directly applied PSO `VIP` (precedence 50) beats the group PSO `Finance` (5): direct PSOs are considered first."
  hr: "U Quillmooru PSO `Default-Staff` dopušta lozinke od 4 znaka — slabije od pravila domene." en: "At Quillmoor the `Default-Staff` PSO allows 4-character passwords — weaker than the domain policy."
- **Terms (check):** fine-grained password policy — detaljno pravilo lozinki; password settings object — objekt postavki lozinke (PSO); precedence — prednost; resultant policy — rezultantno pravilo; complexity — složenost; account lockout — zaključavanje računa.
- **Misconceptions:** an OU-linked GPO can set a different password policy for those users; a PSO is always stricter; values merge across PSOs.
- **Out of scope:** the lockout mechanics (`win-account-lockout`), the admin tools for creating PSOs, password filters, cloud password protection.
- **Builds on `win-gpo-precedence`:** reuses its rule table and the "winning row" display; the selection rule is different (lowest number, direct first), so it is not the GPO order.
- **Note for the coordinator:** §5.1 groups this under "most-specific wins"; that is accurate only for rule 4 (direct before group); within a tier it is lowest precedence value.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-fgpp` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-fgpp sims/win-fgpp` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-fgpp/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
