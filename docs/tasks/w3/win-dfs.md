# win-dfs: DFS namespace and replication

| | |
|---|---|
| Task | `win-dfs` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-dfs` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-dfs/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `file-sharing` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dns-resolution` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **referrals to the nearest target; DFS-R conflicts**.

The student: open a share from two sites; edit on both.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/dns-resolution/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material (the books do not cover DFS). Use the vendor's documentation; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn, *DFS Namespaces overview*; *Set the ordering method for targets in referrals*; *Enable or disable referrals and client failback* (check titles).
- Microsoft Learn, *DFS Replication overview*; DFSR conflict and ConflictAndDeleted folder behaviour (*DFS Replication: frequently asked questions*) (check title).
- `docs/tasks/w2/dns-resolution.md` (the model reused: referral, cache with TTL).

## Model and presets

- **Scene:** two sites, Zagreb and Split, joined by a WAN link (site link cost 100). A namespace server (DC) in
  each site, file servers FS-ZG and FS-ST, and a client in each site. The namespace path
  `\\firma.local\dfs\projekti` is drawn as a folder with two folder targets (`\\FS-ZG\projekti`,
  `\\FS-ST\projekti`). Below: each client's referral cache (ordered target list, TTL left) and, for part two,
  each server's copy of `plan.xlsx` with its version and time. Lanes as in K1 (from `dns-resolution`).
- **State:** `{ t, clients: [{id, site, cache: [{path, targets: [], expiresAt}], connectedTo}], servers: [{id,
  site, up, files: [{name, version, writer, mtime}]}], replication: {pending: [], linkUp}, conflicts: [{file,
  winner, loser, movedTo: 'ConflictAndDeleted'}], msgs: [] }`.
- **One step:** one message or one event. Part 1 (namespace): client asks a namespace server for a referral →
  referral list → client connects to the first reachable target. Part 2 (replication): a user saves a file on
  one server → replication sends it when the link and schedule allow → the receiving server compares versions →
  conflict handled. Within a step: event, then cache/version update, then caption.
- **Rules:**
  1. A namespace is a virtual path; the client resolves it by asking a namespace server for a referral, a list of
     targets, and connects to a target directly (Microsoft Learn, *DFS Namespaces overview*).
  2. Target ordering, default "lowest cost": targets in the client's own site first, then other sites by
     ascending site link cost; targets with equal cost in random order (*DFS Namespaces*: "Set the ordering
     method for targets in referrals" (check)). Tie-break in the model: equal cost → server name order, and the
     page says real order is random.
  3. The client caches a referral for its TTL (default 300 s for a namespace root, 1800 s for a folder
     (check)); during the TTL it does not ask again.
  4. Failover: if the first target is unreachable the client tries the next one in its cached list; it does not
     return to the own-site target when it comes back unless client failback is enabled (off by default (check)).
  5. DFS Replication is multi-master; when the same file changed on both members before they replicated, the
     version with the later last-write time wins ("last writer wins"); the losing file is moved to the
     `DfsrPrivate\ConflictAndDeleted` folder on the losing member (Microsoft Learn, *DFS Replication overview*
     and DFSR conflict handling (check)). Tie-break for equal times: version identifier comparison (check);
     model uses server name order and says so.
  6. Replication is not instantaneous: changes travel when the link is up and the schedule allows (derived).
- **Params:** `fsStUp` toggle (on); `failback` toggle (off); `linkUp` toggle (on); `secondEditDelay` choice
  2 min / 20 min (2 min); `replicateAfter` choice 1 min / 15 min (15 min: the WAN schedule window).
- **Presets:**
  - `referral` Zagreb client gets [FS-ZG, FS-ST], Split client gets [FS-ST, FS-ZG]; each opens its own site's
    server. Derived from rule 2.
  - `failover` FS-ST down: Split client falls over to FS-ZG across the WAN; after FS-ST returns it stays on
    FS-ZG until the cache expires (failback off). Derived, unchecked.
  - `conflict` Ana saves `plan.xlsx` on FS-ZG at 10:00, Marko saves it on FS-ST at 10:02, replication at 10:15:
    Marko's version wins everywhere; Ana's goes to ConflictAndDeleted on FS-ZG. Derived from rule 5.
  - `no-conflict` second edit at 10:20, after replication at 10:15: Marko edits Ana's version, nothing is lost.
    Derived.
- **Steps:** `referral` 6, `failover` 8, `conflict` 8, `no-conflict` 8.
- **Legend:** referral (dotted arrow carrying the list), SMB connection (solid arrow), replication (double
  arrow), own-site target (ring), file version card, conflict loser (hatched card in a bin), changed (kit
  highlight on the newest message, cache row or file card).
- **Captions:** hr: "Klijent u Splitu dobiva uputu (*referral*): prvo FS-ST iz vlastitog sjedišta, zatim FS-ZG." /
  en: "The Split client gets a referral: FS-ST in its own site first, then FS-ZG." — hr: "Obje su inačice
  promijenjene prije replikacije: pobjeđuje kasnija (10:02), Anina odlazi u ConflictAndDeleted." / en: "Both
  copies changed before replication: the later one (10:02) wins, Ana's goes to ConflictAndDeleted."
- **Terms:** namespace — imenski prostor; referral — uputa (as in `dns-resolution`); folder target — odredište
  mape *(check)*; site — sjedište *(check)*; site link cost — trošak veze između sjedišta *(check)*; replication —
  replikacija; conflict — sukob *(check)*; failover — prebacivanje na rezervu *(check)*.
- **Misconceptions:** DFS is one file server that holds the data; DFS-R merges two edits of the same file; the
  client always uses the nearest server, even after a failover.
- **Out of scope:** DFS-R staging quotas and initial sync, SYSVOL replication (`win-sysvol-dfsr`), access-based
  enumeration, standalone vs domain-based namespace details.
- **Builds on `dns-resolution`:** reuses the K1 lanes, the "ask once, get a list or referral, cache it for a TTL"
  pattern and the cache table; new are site-cost ordering, failover, and the replication half.
- **Note for the coordinator:** this entry is two concepts (namespace referrals; DFS-R conflict resolution).
  Suggest keeping referrals here and making the conflict half a "DFS-R file" preset of `ha-multimaster-conflict`
  (B1, catalogue §5.7), which already models last-writer-wins.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dfs sims/win-dfs` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dfs/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
