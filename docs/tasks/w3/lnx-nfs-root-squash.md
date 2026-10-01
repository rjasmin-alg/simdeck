# lnx-nfs-root-squash: NFS and root squash

| | |
|---|---|
| Task | `lnx-nfs-root-squash` (wave 3, Linux) |
| Catalogue entry | `lnx-nfs-root-squash` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-nfs-root-squash/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `file-sharing` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-permissions-rwx` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **the server, not the client, decides who you are**.

The student: access as root and as a user.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-permissions-rwx/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/18-mrezne-usluge.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-18/`
- Catalogue seed: UL ch18
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/18-mrezne-usluge.md`, section "Datoteke koje stoje na drugom stroju": "Što se izvozi" (`/etc/exports`, `exportfs -v` with `root_squash,no_all_squash`), "Druga strana" (`mount -t nfs`, `Read-only file system`), "Mjerilo: tko je korisnik" (UID matching, `root_squash` does not cover `bin`/`staff`), "Sedam opcija koje nitko nije napisao" (`no_root_squash`, `all_squash`); Primjer 5 ("dvije molbe, dva odgovora")
- exports(5) (nfs-utils): `ro`/`rw`, `root_squash`, `no_root_squash`, `all_squash`, `anonuid`/`anongid` (default 65534, check), as cited in ch18
- RFC 5531 (ONC RPC, AUTH_SYS credentials carry numeric uid/gid); RFC 7530 (NFSv4)

## Model and presets

- **Reuses from `lnx-permissions-rwx`:** the nine permission bits and the owner → group → others check, applied on the server with the mapped identity. New here: the request carries only numbers (UID/GID), the server maps them, and the export options decide before the bits do.
- **Scene:** left, client `democli1` with its `/etc/passwd` excerpt (`root 0`, `student 1000`, `bin 1`); middle, the request as an envelope showing `uid=… gid=…` (AUTH_SYS, `sec=sys`) and the operation; right, server `demosrv1` (192.168.180.1) with its `/etc/passwd` excerpt (`root 0`, `ana 1000`, `nobody 65534`), the export line `/srv/zajednicko 192.168.180.0/24(…)` as `exportfs -v` shows it, the mapping step, and the file list with owner and mode. Result line: the client's message (`Read-only file system`, `Permission denied`, or success) and the owner the new file gets on the server.
- **State:** `{ export: { ro, squash: 'root_squash'|'no_root_squash'|'all_squash', anonuid: 65534 }, files: [{ name, uid, gid, mode }], request: { clientUser, uid, gid, op, name }, mapped: { uid, gid }, result, log }`.
- **One step:** one request from the script. Phases: (a) client sends op with its numeric uid/gid; (b) export check: write op on an `ro` export → refused; (c) squash mapping; (d) permission check with the mapped ids (UID 0 after mapping bypasses it); (e) apply (a created file gets the mapped uid/gid as owner).
- **Rules:**
  1. NFS identifies the client user by number, not by name; the same number means whoever owns that number on the server. (ch18 "Mjerilo: tko je korisnik")
  2. `ro` export: every write is refused with "Read-only file system", also for `sudo` on the client; the decision is made on the server. (ch18 "Druga strana"; exports(5) `ro`/`rw`)
  3. `root_squash` (default): uid/gid 0 → anonymous (`anonuid`/`anongid`, default 65534 `nobody`). It does not touch other sensitive ids such as `bin` (1) or group `staff`. (ch18; exports(5) `root_squash`)
  4. `no_root_squash`: uid 0 stays 0 and the client's root is root on the export. (ch18 "Sedam opcija koje nitko nije napisao"; exports(5))
  5. `all_squash`: every uid/gid → anonymous; useful for public directories. (ch18; exports(5))
  6. After mapping, the ordinary permission check applies (`lnx-permissions-rwx`): squashed root is "others" and cannot read a `0600` file that client uid 1000 can. (derived from rules 3 and the bit check)
  7. Tie-break: the export check (rule 2) comes before mapping and bits, so an `ro` export refuses even a write the bits would allow.
- **Params:** `ro` toggle, default on (the book's export); `squash` choice `root_squash` | `no_root_squash` | `all_squash`, default `root_squash`. Requests come from the preset script.
- **Presets:**
  - `book-ro` — `/srv/zajednicko 192.168.180.0/24(ro,sync)`: `cat proba.txt` works ("podatak s posluzitelja"); `sudo touch moje.txt` → "Read-only file system", exit 1. From ch18 ("Što se izvozi", "Druga strana").
  - `root-squashed` — `rw,root_squash`: client root creates `a.txt` → owner `nobody` (65534) on the server; client root reads `tajna` (owner uid 1000, mode `0600`) → "Permission denied"; client `student` (uid 1000) reads it fine. Derived, unchecked.
  - `uid-collision` — client `student` is 1000, server's 1000 is `ana`: `student` reads and edits `ana`'s files as his own; nobody broke in, the numbers matched. From ch18 ("korisnik s identifikatorom 1000 na klijentu …").
  - `no-root-squash` — `rw,no_root_squash`: client root creates a root-owned file and reads `tajna`. From ch18 (option described), example derived.
  - `bin-not-squashed` — `rw,root_squash`: a client process as `bin` (1) writes a file owned by server `bin`; root_squash doesn't stop it. Derived from ch18's exports(5) quote, unchecked.
  - `all-squash` — `rw,all_squash`: `student` creates a file → owner `nobody`. Derived from ch18, unchecked.
- **Steps:** one per request: `book-ro` 2, `root-squashed` 3, `uid-collision` 3, `no-root-squash` 2, `bin-not-squashed` 2, `all-squash` 2.
- **Legend:** client user (person icon with number), request envelope (numbers only), mapping arrow (0 → 65534, labelled with the option), server file (owner, mode), refused (× with the message), created file (outlined, "new"). "Changed" marks the mapped id and the file created or the cell that refused.
- **Captions:**
  - HR: „Zahtjev nosi samo broj: `uid=0`. Poslužitelj ga zbog `root_squash` preslikava u 65534 (`nobody`), pa je za njega `root` s klijenta samo jedan od „ostalih“.“
  - EN: "The request carries only a number: `uid=0`. Because of `root_squash` the server maps it to 65534 (`nobody`), so to the server the client's root is just one of the 'others'."
- **Terms:** export — izvoz; user identifier (UID) — korisnički identifikator; root squashing — preslikavanje korisnika `root` (check); anonymous user — anonimni korisnik; share (SMB) — dijeljeni resurs; mount — montiranje; read-only file system — datotečni sustav samo za čitanje (check).
- **Misconceptions:** "root on the client is root everywhere"; NFS checks user names; `root_squash` makes the export safe (other ids are not squashed, and UID collisions are untouched).
- **Out of scope:** Kerberos (`sec=krb5`), NFSv4 ID mapping by name (`idmapd`), SMB and its name-based login (contrasted in one sentence, as in ch18), `secure`, `subtree_check`, SELinux booleans.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-nfs-root-squash` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-nfs-root-squash sims/lnx-nfs-root-squash` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-nfs-root-squash/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
