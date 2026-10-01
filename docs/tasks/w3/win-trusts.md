# win-trusts: Trusts

| | |
|---|---|
| Task | `win-trusts` (wave 3, Active Directory) |
| Catalogue entry | `win-trusts` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-trusts/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `active-directory` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-kerberos` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **direction, transitivity, forest vs external trusts; who can access what**.

The student: build trusts between forests, test access.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-kerberos/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "How domain and forest trusts work"; "Security considerations for trusts" (SID filtering, selective authentication)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/trusts.txt` (external bidirectional trust to `pfx.internal`, SID filtering disabled) and `~/projects/dr-lecture-estate/student/configs/ad/pellucid/summary.txt`
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T57 ("Kerberos — karte, povjerenje, jedinstvena prijava": Croatian term "povjerenje")

## Model and presets

- **Scene:** forests as large outlines with domains inside: forest Quillmoor (`quillmoor.example`, child `brk.quillmoor.example`, second tree `emberline.example`), forest Pellucid (`pfx.internal`, from the estate), forest Carrow (`carrow.example`, derived). Trusts drawn as arrows from trusting (resource) to trusted (account) domain, labelled type and transitive or not; access arrows run the other way. A test panel: "user U opens resource R" → ✓/✕ with the trust path, or the rule that blocks it.
- **State:** `{ trusts: [{ from, to, type: 'parent-child'|'tree-root'|'forest'|'external'|'shortcut', twoWay, transitive, selectiveAuth, sidFiltering }], test: { user, resource }, path: [], verdict }`.
- **One step:** one admin action (create a trust, toggle a flag) or one access test, evaluated hop by hop along the path (one hop per step when tested).
- **Rules (Microsoft: "How domain and forest trusts work"; "Security considerations for trusts"):**
  1. Direction: if domain A trusts domain B, users of B can be granted access in A. Access flows opposite to the trust arrow. Two-way = two one-way trusts.
  2. Within a forest, parent–child and tree-root trusts are created automatically, two-way and transitive: every domain of a forest trusts every other.
  3. A forest trust (between forest roots) is transitive inside both forests (every domain of A ↔ every domain of B) but not to a third forest: A–B and B–C do not give A–C.
  4. An external trust links two domains only and is not transitive.
  5. A shortcut trust inside a forest shortens the referral path; it doesn't change who can access what.
  6. Trust ≠ permission: the trust only makes users of the trusted side eligible; an ACE must still grant access.
  7. Selective authentication: users from the other side need "Allowed to Authenticate" on the target computer, else refused even with an ACE.
  8. SID filtering is on by default for external and forest trusts and drops SIDs from outside the trusted domain/forest (blocks SID-history escalation); turning it off lets the trusted side present any SID (estate `trusts.txt`).
  9. Kerberos across a trust follows referral tickets hop by hop (one TGS referral per trust on the path, reused from `win-kerberos`) (check: external trusts may fall back to NTLM).
- **Params:** `userDomain` choice (all domains) default `brk.quillmoor.example`; `resourceDomain` choice default `pfx.internal`; `aceGranted` toggle default on; `selective` toggle default off; `sidFilter` toggle default on.
- **Presets (5):**
  - `in-forest` — `brk.quillmoor.example` user opens a share in `emberline.example`: path brk → quillmoor → emberline (child-parent, tree-root), ✓. 3 steps. Derived, unchecked.
  - `quillmoor-pellucid` — estate: external, bidirectional, SID filtering disabled (`trusts.txt`); `PELLUCID\Domain Users` in `Pellucid-Access` (Modify on Cinematics) ✓; a `brk.quillmoor.example` user reaching `pfx.internal` ✕ (external trusts aren't transitive, rule 4). 4 steps. From the DR estate.
  - `one-way` — Quillmoor trusts Carrow one way: Carrow user → Quillmoor resource ✓, Quillmoor user → Carrow ✕. 3 steps.
  - `no-third-forest` — forest trusts Quillmoor–Pellucid and Pellucid–Carrow: Quillmoor user → Carrow ✕ (rule 3). 3 steps.
  - `selective` — selective authentication on the Carrow trust: ACE present but no "Allowed to Authenticate" → ✕; grant it → ✓. 4 steps.
- **Steps:** max 4.
- **Legend:** forest outline, domain box, trust arrow (solid transitive, dashed non-transitive, arrowhead per direction), access arrow (thin, opposite), blocked hop (✕); "changed" highlight marks the trust just created or the hop just evaluated.
- **Captions:** hr: "`quillmoor.example` vjeruje `pfx.internal`: korisnici iz Pellucida smiju dobiti pristup u Quillmooru — pristup ide suprotno od strelice *trust* (odnosa povjerenja)." en: "`quillmoor.example` trusts `pfx.internal`: Pellucid users may be granted access in Quillmoor — access flows against the trust arrow."
  hr: "Vanjski odnos povjerenja nije tranzitivan: korisnik iz `brk.quillmoor.example` ne prolazi do `pfx.internal`." en: "An external trust is not transitive: a user from `brk.quillmoor.example` does not get through to `pfx.internal`."
- **Terms (check):** trust — odnos povjerenja (NLA T57 "povjerenje"); trusting domain — domena koja vjeruje; trusted domain — domena kojoj se vjeruje; transitive — tranzitivan; forest trust — povjerenje između šuma; external trust — vanjsko povjerenje; selective authentication — selektivna autentifikacija; SID filtering — filtriranje SID-ova.
- **Misconceptions:** a trust grants access; the arrow points the way access goes; forest trusts chain.
- **Out of scope:** realm trusts to non-Windows Kerberos realms (NLA links), name suffix routing, trust passwords, migration with SID history.
- **Builds on `win-kerberos`:** reuses its ticket boxes for the referral hops (rule 9); new are the trust graph and the access test.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-trusts sims/win-trusts` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-trusts/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
