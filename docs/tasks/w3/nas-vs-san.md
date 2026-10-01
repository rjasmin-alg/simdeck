# nas-vs-san: File vs block storage

| | |
|---|---|
| Task | `nas-vs-san` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-nas-vs-san` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/nas-vs-san/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | NLA |
| Topic / tags / level | `storage` / `storage-basics` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **NAS (NFS/SMB) vs SAN (iSCSI/FC): who owns the filesystem**.

The student: mount both, connect two clients.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T25 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T25 ("Mrežno spremište — iSCSI, NVMe-oF, NFS u pogonu")
- `~/projects/uvod-u-linux/book/chapters/11-diskovi-i-datotecni-sustavi.md` (blokovni uređaj, datotečni
  sustav, montiranje) and `18-mrezne-usluge.md` (mrežni dijeljeni resurs) for the Croatian terms
- Standards: RFC 7530 (NFS version 4), [MS-SMB2] "Server Message Block (SMB) Protocol Versions 2 and 3",
  RFC 7143 (iSCSI), T10 SPC-4 (SCSI Primary Commands, persistent reservations) *(check sections)*

## Model and presets

- **Scene:** two panels with the same parts: two clients (A, B), a network, a storage box with a disk of 16
  blocks. **NAS panel:** the *filesystem* box (directory, allocation bitmap, locks) sits **inside the
  storage server**; messages on the wire are file operations (`open /share/a.txt`, `write offset 0`).
  **SAN panel:** the filesystem box sits **inside each client**; the storage box only has a LUN of numbered
  blocks; messages are block operations (`WRITE LBA 10`). Each client shows its cached view of the
  directory.
- **State:** `{ mode: 'nas'|'san', disk: string[16], server: {dir, bitmap, locks}|null, clients: {A: {dir,
  bitmap, mounted}, B: {...}}, wire: [{from, to, op}], reservation: client|null, cursor }`.
- **One step:** one operation and its messages: mount, list, write a file, read a file, remount.
- **Rules:**
  1. NAS: the server owns the filesystem; clients send file-level requests and the server allocates blocks
     and keeps one directory, so every client sees every file (NFSv4: RFC 7530; SMB 2/3: [MS-SMB2]).
  2. NAS: concurrent access is arbitrated by the server (locks/leases held at the server) (RFC 7530 §9;
     [MS-SMB2] leases) (check section numbers).
  3. SAN: the target exports a block device; it sees only LBAs and knows nothing of files (iSCSI:
     RFC 7143; Fibre Channel carries the same SCSI block commands) (check).
  4. SAN: the client's own filesystem allocates blocks and caches metadata; a second client mounting the
     same LUN with an ordinary (non-cluster) filesystem has its own bitmap and cache, so both can allocate
     the same free block, and each believes its view is right → silent corruption.
  5. SAN sharing is safe only with a cluster filesystem (a shared lock manager) or exclusive access; SCSI
     persistent reservations reject the second initiator's writes (SPC-4 "PERSISTENT RESERVE OUT",
     status RESERVATION CONFLICT) (check).
  6. Tie-break in the corruption case: last write to a block wins on disk; each client's cache keeps its
     own version until it re-reads (derived).
- **Params:** `mode` choice NAS / SAN / both (both); `reservation` toggle (SAN only, off); buttons "A writes
  a.txt", "B writes b.txt", "A lists", "remount A".
- **Presets** (derived, checked by hand):
  1. `nas-two-clients` — A writes `a.txt`, B writes `b.txt`: the server allocates blocks 10 and 11; both
     clients list both files. 4 steps.
  2. `san-one-client` — A formats and mounts the LUN, writes `a.txt` → the wire shows `WRITE LBA 10`, the
     target has no idea it is a file. 3 steps.
  3. `san-two-clients` — A and B both mount the same LUN (ordinary filesystem); A writes `a.txt` (bitmap says
     10 free → LBA 10); B, with its cached bitmap, also picks 10 for `b.txt`; A still "sees" `a.txt`, but
     after a remount `a.txt` contains B's data. 6 steps.
  4. `san-reservation` — preset 3 with A holding a persistent reservation: B's `WRITE LBA 10` is rejected
     with a reservation conflict; the data stays intact. 5 steps.
- **Steps:** 3–6 per preset (above).
- **Legend:** filesystem box (folder icon) — where it sits is the point; file operation (rounded label),
  block operation (square label "LBA n"), cached directory (dashed), conflicting block (hatched + "!").
  "Changed" marks the blocks and messages of this step.
- **Captions:**
  - hr: „Kod NAS-a datotečni sustav živi na poslužitelju: klijent traži datoteku po imenu, a poslužitelj
    odlučuje u koje blokove ide."
  - en: "Two clients, one LUN, two private ideas of which blocks are free: both chose block 10."
- **Terms:** file-level storage — spremište na razini datoteka; block-level storage — spremište na razini
  blokova; filesystem — datotečni sustav (UL ch11); network share — dijeljeni resurs (UL ch18,
  ch23); LUN — logička jedinica (LUN) (check); target / initiator — cilj / inicijator (check); mount —
  montiranje (UL ch11); block device — blokovni uređaj (UL ch11).
- **Misconceptions:** "a SAN LUN is a network share"; "two servers can mount the same iSCSI disk like an NFS
  export"; "NAS is slow, SAN is fast" (the difference is who owns the filesystem, not speed).
- **Out of scope:** protocol details (NFS versions, SMB dialects, iSCSI login), multipath, NVMe-oF,
  performance comparison, object storage.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `nas-vs-san` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh nas-vs-san sims/nas-vs-san` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/nas-vs-san/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
