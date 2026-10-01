# lnx-access-decision: The access decision

| | |
|---|---|
| Task | `lnx-access-decision` (wave 3, Linux) |
| Catalogue entry | `lnx-access-decision` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-access-decision/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `permissions` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-permissions-rwx` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **owner → group → other, first match decides; the ACL mask**.

The student: pick a user and a file, step the check.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-permissions-rwx/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-07/`
- Catalogue seed: UL ch07 → §5.1
- UL ch07, section "Kad tri skupine bitova nisu dovoljne" (`/srv/projekt` 2770, `getfacl proba`,
  `getfacl /srv/projekt/druga.txt` with `#effective:rw-`) and Primjer 3 ("Ana je u pravoj grupi, a datoteku
  ne vidi"); figure `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-07/dozvola-na-krivom-mjestu.svg`
- acl(5), Linux man-pages, section "ACCESS CHECK ALGORITHM" (cited in UL ch07 as [24])
- capabilities(7), Linux man-pages, `CAP_DAC_OVERRIDE` (root case)

## Overlaps (catalogue §5)

- **§5.1 First-match rule evaluation:** Build one rule-table evaluator with presets: router ACL, stateless firewall, pg_hba.conf. Keep netfilter (a path through hooks, not one list), PAM (control flags, not first match), NTFS (deny wins, not first match) and the most-specific-wins rules (win-dhcp-scope-options, win-fgpp) separate, because their rules are different; note the contrast on each page.

## Model and presets

- **Scene:** left, the process (user name, effective UID, list of groups); centre, the file's entry table
  (K4 rule table: rows `user::`, named `user:x:`, `group::`, named `group:g:`, `mask::`, `other::`, with the
  owner and owning group in the header and the `ls -l` string above); right, the requested access (r, w or
  x) and the verdict. The row being compared is lit; the row that decided stays marked.
- **Reused from `lnx-permissions-rwx`:** mode parsing/formatting (nine bits ↔ `ls -l` string ↔ octal). New:
  process identity, ACL entries with the mask, the check algorithm.
- **State:** `{ proc: { user, uid, groups[] }, file: { path, owner, group, mode, acl: [{tag, qual, perms}] },
  want: 'r'|'w'|'x', cursor: rowIndex|null, matched: rowIndex|null, effective: perms|null,
  verdict: null|'granted'|'denied', reason }`.
- **One step:** compare the process against the next class in the fixed order; when a class matches, the
  next step applies the mask (if that class is masked), the step after that gives the verdict; the demo
  then stops (no later row is looked at).
- **Rules** (acl(5) "ACCESS CHECK ALGORITHM"; UL ch07 "Kad tri skupine bitova nisu dovoljne"):
  1. Effective UID 0 → granted for r and w; for x on a regular file only if at least one x bit (or ACL x)
     is set anywhere (capabilities(7) `CAP_DAC_OVERRIDE`) (check wording).
  2. EUID equals the owner → the owner entry (`user::`) decides. **First match is final**: an owner with
     `---` is denied even if group or other would allow.
  3. Else EUID matches a named `user:` entry → that entry AND mask decides.
  4. Else if the owning group or any named `group:` entry matches one of the process's groups: granted if
     any matching entry, ANDed with the mask, contains the wanted bit; else denied — `other` is **not**
     consulted. Tie-break: several matching group entries are OR-ed, not first of them.
  5. Else `other::` decides (never masked).
  6. The mask limits named users, the owning group and named groups, never the owner or other. With an
     ACL present, `ls -l` shows the mask in the group triplet, not `group::` (UL ch07, `proba` example).
  7. Without ACL entries the same order holds with three rows: owner, group, other.
- **Params:** `preset scene` via presets; `who` select over the scene's users (e.g. student, ana, marko,
  nobody, root), default first; `want` choice r/w/x, default r; `mask` select (rwx, rw-, r--, ---) shown
  only when the file has an ACL. Changing `who`/`want` resets to step 0.
- **Presets:**
  1. `projekt-other` — `/srv/projekt` `drwxrws---` root:projekt, who=student (not in projekt), want r →
     owner no, group no, other `---` → denied (from UL ch07, `ls -l /srv/projekt: Permission denied`).
     With who=ana (in projekt) → group `rwx` → granted.
  2. `owner-locked` — file `----rw-rw-` owner student, who=student, want r → owner row matches, `---` →
     denied although everyone else may read (derived, from acl(5) order).
  3. `named-user` — `proba` `-rwxrw----+`: `user::rwx`, `user:nobody:rw-`, `group::---`, `mask::rw-`,
     `other::---`; who=nobody, want w → named entry rw- AND mask rw- → granted (from UL ch07).
  4. `mask-clips` — `druga.txt`: `group:projekt:rwx #effective:rw-`, `mask::rw-`; who=marko (in projekt,
     not owner), want x → entry has x, mask removes it → denied; want w → granted (from UL ch07 getfacl
     output; user marko derived).
  5. `root` — file mode 000, who=root: want r → granted; want x → denied (no x bit anywhere) (derived,
     capabilities(7); check).
- **Steps:** 3–5 per preset (identify process, compare up to four classes, mask, verdict); preset 1 = 5.
- **Legend:** lit row = being compared; row with a tick = matched class; struck bits = removed by mask;
  verdict badge with ✓/✗ shape.
- **Captions:**
  - hr: "`student` nije vlasnik ni član grupe `projekt`, pa odlučuje treća skupina bitova — a ona je prazna."
  - en: "`student` is neither the owner nor in group `projekt`, so the third triplet decides — and it is empty."
  - hr: "Unos kaže `rwx`, ali maska `rw-` stoji između upisanog i onoga što vrijedi."
  - en: "The entry says `rwx`, but the mask `rw-` stands between what is written and what applies."
- **Terms:** access control list — popis kontrole pristupa (ACL); mask — maska; effective rights —
  efektivna prava; owner / owning group — vlasnik / grupa datoteke; others — ostali; effective UID —
  efektivni korisnički identifikator.
- **Misconceptions:** permissions add up across classes ("other has r, so the owner can read"); a matching
  group with no rights falls through to other; the ACL entry is what applies.
- **Out of scope:** path traversal (search bit on each directory, UL ch07 Primjer 3 — mention, link), special
  bits, default ACL inheritance, SELinux (`lnx-selinux-decision`).
- **Contrast note (§5.1):** looks like first match, but the "rows" are classes in a fixed order, not a
  user-ordered list; the page should say so next to the link to the shared rule-table evaluator.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-access-decision sims/lnx-access-decision` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-access-decision/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
