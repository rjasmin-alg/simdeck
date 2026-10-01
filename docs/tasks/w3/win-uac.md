# win-uac: UAC and the split token

| | |
|---|---|
| Task | `win-uac` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-uac` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-uac/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1, SEC |
| Topic / tags / level | `windows-admin` / `permissions` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-access-token` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **admins run with a filtered token until elevated**.

The student: run tasks as admin with and without elevation.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/win-access-token/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No Windows course book yet. Use Microsoft documentation (titles below) and mark every number and rule you could not check with *(check)* in `NOTES.md`.
- Microsoft Learn: "How User Account Control works", "User Account Control settings and configuration" (Admin Approval Mode policies), "Mandatory Integrity Control"; Win32 "Restricted Tokens" / "Linked tokens" (TOKEN_LINKED_TOKEN) *(check titles)*.
- Microsoft support: "Description of User Account Control and remote restrictions in Windows Vista" (`LocalAccountTokenFilterPolicy`) *(check title)*.
- URM ch18 „Tko je to, i smije li…" (načelo najmanje ovlasti); `/home/rjasmin/projects/uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`, „Kad treba više nego što smijete" (`sudo`, the Linux counterpart).

## Model and presets

- **Scene:** user `ana`, member of local Administrators, logs on. Two token cards side by side, linked by a chain:
  the **filtered** token (Administrators SID marked "deny only", most privileges removed, integrity Medium) and
  the **full** token (Administrators enabled, all privileges, integrity High). Below, a row of tasks (processes)
  with the token each runs with, and a target object for each task with its ACL; each attempt shows allowed or
  denied with the deciding entry.
- **State:** `{ user, isAdmin, uacOn, tokens: {filtered: {sids: [{sid, attr: 'enabled'|'denyOnly'}], privs: [],
  il}, full: {…}}, procs: [{id, image, token: 'filtered'|'full', parent}], attempts: [{proc, task, result,
  reason}], prompt: null|'consent'|'credentials' }`.
- **One step:** one action, then its access check: 1 logon: LSA builds both tokens (admin) or one (standard user);
  2 Explorer starts with the filtered token; 3 a task from Explorer (write to `C:\Program Files`, write to
  `HKLM\SOFTWARE`, change the time zone, stop a service) → check with the filtered token; 4 "Run as
  administrator" → prompt; 5 approve → new process with the full token; 6 the same task → check with the full
  token; 7 a child of the elevated process inherits the full token; 8 a child of Explorer stays filtered.
- **Rules:**
  1. With UAC on, an admin's logon yields two linked tokens; the desktop runs with the filtered one (Microsoft
     "How User Account Control works").
  2. Filtered token: Administrators (and similar groups) become deny-only (they can match a deny ACE, never an
     allow); privileges reduced to a small set such as SeChangeNotifyPrivilege, SeShutdownPrivilege,
     SeTimeZonePrivilege *(check full list)*; integrity level Medium; full token High (same doc; "Mandatory
     Integrity Control").
  3. Access check as in `win-access-token`: an allow ACE counts only for enabled SIDs (Win32 "How DACLs Control
     Access to an Object"); privileges gate actions such as changing system time.
  4. Elevation for an admin = consent prompt; for a standard user = credential prompt for another (admin)
     account, and the process then runs as that account (same doc, "Admin Approval Mode").
  5. A process inherits its parent's token; elevation never changes an already running process (same doc).
  6. Built-in Administrator (RID 500) is not in Admin Approval Mode by default (policy "User Account Control:
     Admin Approval Mode for the Built-in Administrator account" disabled) *(check)*.
  7. Network logon with a *local* admin account gets the filtered token (UAC remote restrictions,
     `LocalAccountTokenFilterPolicy` = 0); domain admin accounts get the full token *(check)*.
  Tie-break: if both a deny and an allow match, the order of the DACL decides (as in `win-ntfs-inheritance`).
- **Params:** `account` choice admin/standard/builtin-admin (admin); `uac` toggle (on; off: one full token, the
  pre-Vista situation); `task` select of the four tasks (write Program Files).
- **Presets:**
  - `admin-filtered` ana writes to `C:\Program Files\App`: denied (Administrators deny-only), then elevated:
    allowed. Derived from rules 1–3.
  - `time-zone` ana changes the time zone without elevation: allowed (privilege kept in the filtered token).
    Derived from rule 2 *(check)*.
  - `standard-user` marko gets a credential prompt; enters `admin-it`; the process runs as `admin-it`, not as
    marko. Derived from rule 4.
  - `child-inherits` elevated console starts Notepad (High); Explorer starts Notepad (Medium). Derived from rule 5.
  - `uac-off` one full token: every task succeeds silently; malware started by ana would too. Derived.
- **Steps:** `admin-filtered` 6, `time-zone` 3, `standard-user` 6, `child-inherits` 8, `uac-off` 4.
- **Legend:** enabled SID (filled chip), deny-only SID (hatched chip with a stop shape), privilege (key chip),
  integrity level (badge M/H), filtered vs full token (thin vs thick card border), allowed (check), denied (cross),
  changed (kit highlight on the token or chip used by the last check).
- **Captions:** hr: "Ana je administratorica, ali Explorer nosi filtrirani token: SID Administrators samo za
  zabranu — upis u Program Files odbijen." / en: "Ana is an administrator, but Explorer carries the filtered token:
  the Administrators SID is deny-only — the write to Program Files is denied." — hr: "Nakon potvrde novi proces
  dobiva puni token razine High; stari procesi ostaju kakvi su bili." / en: "After consent the new process gets
  the full High token; existing processes stay as they were."
- **Terms:** access token — pristupni token *(check)*; elevation — podizanje ovlasti *(check)*; filtered token —
  filtrirani token; integrity level — razina integriteta *(check)*; privilege — povlastica *(check)*; consent
  prompt — upit za potvrdu; local administrator — lokalni administrator; least privilege — najmanja ovlast (URM
  ch18 „načelo najmanje ovlasti").
- **Misconceptions:** UAC is a prompt in front of an already-admin process; an admin's Explorer is admin; UAC is a
  security boundary against malware already running as the user (Microsoft says it is not *(check wording)*).
- **Out of scope:** file and registry virtualization, secure desktop details, UIAccess, `sudo` for Windows (one
  line of comparison with UL ch7 „Kad treba više nego što smijete").
- **Builds on `win-access-token`:** reuses its token card (user SID, group SIDs, privileges) and its access check;
  new are the linked pair, deny-only attributes, integrity levels and elevation.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-uac` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-uac sims/win-uac` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-uac/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
