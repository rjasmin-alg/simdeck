<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# nas-vs-san: spec

One concept: **NAS (NFS/SMB) vs SAN (iSCSI/FC): who owns the filesystem.** Task `docs/tasks/w3/nas-vs-san.md`,
catalogue `sto-nas-vs-san` (§4.6). Class stepper. The student mounts both kinds of storage and connects two clients.

## Scene

Two panels with the same parts, side by side (mode "both") or one alone (mode NAS or SAN):

- **Client A** and **client B** (top). In the SAN panel each client holds a **filesystem box** (folder icon): its
  cached directory (dashed) and its cached allocation bitmap. In the NAS panel a client holds no filesystem, only the
  listing it last got from the server (dashed), under "no filesystem of its own".
- **The wire** (middle): this step's messages, one line per request with its reply: from → to, the request and the
  reply. File operations are rounded labels (`write a.txt @0`, `list /share`); block operations are square labels
  (`WRITE LBA 10`). A rejected request has a `--danger` frame and ✕.
- **The storage box** (bottom). NAS: a storage server with the **filesystem box** inside it (directory, bitmap,
  locks) above its disk. SAN: a target with only a LUN of 16 numbered blocks (and, when set, "reserved by A").
- **The disk:** 16 blocks, LBA 0–15 (kit view K3, `kit/blockgrid.js`). LBA 0 superblock (`SB`), 1 bitmap (`BM`),
  2 directory (`DIR`), 3–9 reserved for metadata (dashed, never used here), 10–15 data. A written block shows its
  content: `A` (client A's bytes) or `B`; metadata blocks show their label, coloured by whoever wrote them last
  (server, A or B). A conflicting block is hatched with `!`.

Legend: filesystem box (folder icon), file operation (rounded), block operation (square "LBA n"), cached view
(dashed), conflicting block (hatched + "!"), rejected (✕), changed in this step (the kit's highlight).

## State

```
{ op: { verb, who } | null,                      // what this step did; null at step 0
  nas: Panel, san: Panel }                        // both run the same operations; `mode` only chooses what is shown
Panel = {
  disk: string[16],      // '' blank; 'fs' superblock; LBA 1 'n,n' bitmap; LBA 2 'name=n;…' directory; data 'A' | 'B'
  by: string[16],        // who wrote each block last: '' | 'S' (the server) | 'A' | 'B'
  server: { dir: [[name, lba]], bitmap: [lba], locks: [[name, holder]] } | null,   // NAS only
  clients: { A: Client, B: Client },
  reservation: 'A' | null,                        // SAN only: the persistent reservation's holder
  wire: [{ from, to, kind: 'file' | 'block', op, arg, reply, ok }],                // this step's messages
  changed: [lba],                                 // blocks written in this step
  res: { code, … },                               // the outcome, for the caption
  conflicts: [lba], lost: [name] }
Client = { mounted, dir: [[name, lba]] | null, bitmap: [lba] | null }               // NAS: bitmap always null
```

Directories are sorted by name and bitmaps ascending (total orders; the state is JSON).

## Operations (one per step)

The run is the `ops` param: tokens `<verb><client>` joined by `.`, e.g. `fA.mA.mB.wA.wB.rA.uA`. Verbs: `f` format,
`m` mount, `w` write (A writes `a.txt`, B writes `b.txt`), `l` list, `r` read (A reads `a.txt`, B `b.txt`), `u`
remount. Unknown tokens are dropped; at most 20 operations (COMMON.md §3). Steps = the number of operations.

| Op | NAS | SAN |
|---|---|---|
| format | refused: the client has no block device, the server's filesystem is already there (no message) | `WRITE LBA 0–2` (superblock, empty bitmap, empty directory); refused if the client is mounted; under another initiator's reservation → RESERVATION CONFLICT (`formatConflict`) |
| mount | `mount /share` → `OK`; the client's view := the server's directory. Already mounted → refused (`already`, no message) | `READ LBA 0–2` → the client builds its own filesystem in memory from LBA 1 and 2; a blank LUN → "no filesystem". Already mounted → refused (`already`, no message) |
| write f | `write f @0` → `OK`. The **server** takes the lowest free data block from its bitmap, writes data, bitmap and directory to its disk (LBA n, 1, 2, local, not on the wire), and records the lock `f: client` | the **client** takes the lowest free block from its *cached* bitmap: `WRITE LBA n` (data), `WRITE LBA 1` (its bitmap), `WRITE LBA 2` (its directory); each → `GOOD` |
| write f again | the same block is rewritten | the same block is rewritten (`WRITE LBA n` only) |
| list | `list /share` → the names; the view := the server's directory | no message: answered from the client's cache |
| read f | `read f @0` → the bytes the server finds through its directory | `READ LBA n` with n from the client's cached directory → whatever the disk holds there |
| remount | as mount; the server drops the client's locks. Before any mount it is simply a mount | as mount; files in the old cache that are gone from the disk's directory are **lost**, and the caption names the last writer of LBA 2. Before any mount it is simply a mount |

A client that is not mounted cannot list, read or write (refused, no message). No free data block → refused ("full").

## Rules

1. **NAS: the server owns the filesystem.** Clients send file-level requests; the server allocates blocks from its one
   bitmap and keeps one directory, so every client that lists sees every file. *Source:* RFC 7530 (NFSv4) §1.4, the
   server's filesystem namespace, and [MS-SMB2] §1.3 (overview: the client opens files on a share by name).
   **Test:** A writes `a.txt`, B writes `b.txt` → server blocks 10 and 11; both lists show both files.
2. **NAS: the server arbitrates concurrent access.** Locks (NFSv4 locks and delegations, SMB leases) are held at the
   server, not at the clients. Here: a write records the open file `[file, client]` in `server.locks`; a remount drops that client's
   locks. *Source:* RFC 7530 §9 (file locking and share reservations) and §10.2 (delegations); [MS-SMB2] §3.3.5.9
   (lease requests in CREATE) *(check section numbers)*. **Test:** after A's write the server holds `a.txt: A`; a NAS
   client has no lock table; after A's remount the lock is gone.
3. **SAN: the target exports a block device.** It sees only LBAs and knows nothing of files: every SAN message is a
   block operation (`READ`/`WRITE LBA n`), and the SAN panel has no server filesystem (`server: null`). *Source:*
   RFC 7143 (iSCSI), its overview of SCSI commands carried over TCP (initiator, target, LUN); Fibre Channel carries the same SCSI block commands
   (FCP) *(check)*. **Test:** every SAN wire entry has `kind: 'block'` and a numeric `arg`; `san.server === null`.
4. **SAN: each client's filesystem allocates from its own cached bitmap.** A second client mounting the same LUN with
   an ordinary (non-cluster) filesystem has its own bitmap and directory cache, so both can allocate the same free
   block. *Derived* from rule 3 and how a local filesystem caches metadata. **Test:** `fA.mA.mB.wA.wB`: A writes LBA
   10; B, whose cache still says 10 is free, writes LBA 10 as well.
5. **SAN sharing is safe only with a cluster filesystem or exclusive access.** A persistent reservation held by A
   (type Write Exclusive) makes the target reject writes from any other initiator with status **RESERVATION
   CONFLICT**; reads stay allowed. B's filesystem then aborts the operation (no metadata write follows) and keeps its
   cache as before. *Source:* SPC-4 §5.12 (reservations; type Write Exclusive), §6.15 (PERSISTENT RESERVE OUT)
   *(check section numbers)*. **Test:** with `reservation` on, B's `WRITE LBA 10` is rejected, the disk keeps `A` at
   LBA 10, and A reads its own bytes back after a remount.
6. **Tie-break: last write wins on disk; each cache keeps its own version until it re-reads.** *Derived.* After
   `wA.wB` LBA 10 holds `B` and LBA 2 holds B's directory (`b.txt=10`, without `a.txt`), while A's cache still lists
   `a.txt → 10`. A read of `a.txt` from A's cache returns B's bytes; a remount re-reads LBA 2, and `a.txt` is gone
   (lost). **Tests:** the disk after `wA.wB`; A's cache unchanged by B's write; `rA` returns `B`; `uA` loses `a.txt`.

**Conflict mark** (drawing rule, derived): in the SAN panel a data block is conflicting when two different file names
claim it among the mounted clients' caches and the on-disk directory; LBA 2 is conflicting when a mounted client's
cached directory holds an entry the disk's directory does not. The NAS panel never has a conflict (one bitmap).

## Presets and expected numbers

Checked by hand and by an independent Python replay written before `sim.js` (NOTES.md). `steps` = number of operations.

| # | id | mode | ops | steps | Expected |
|---|---|---|---|---|---|
| 1 | `nas-two-clients` | NAS | `mA.mB.wA.wB.lA.lB` | 6 | server bitmap [10, 11], dir a.txt=10, b.txt=11; disk 10=A, 11=B; both lists show a.txt, b.txt; locks a.txt: A, b.txt: B |
| 2 | `san-one-client` | SAN | `fA.mA.wA` | 3 | step 1 writes LBA 0–2; step 3 wire: `WRITE LBA 10`, `WRITE LBA 1`, `WRITE LBA 2`; disk 10 = A, LBA 1 = "10", LBA 2 = "a.txt=10"; no server filesystem |
| 3 | `san-two-clients` | both | `fA.mA.mB.wA.wB.rA.uA` | 7 | SAN: after step 4 LBA 10 = A; step 5 B also writes LBA 10 → disk 10 = B, LBA 2 = "b.txt=10", conflicts [2, 10]; step 6 A reads a.txt → `B`; step 7 A remounts → A sees only b.txt, lost [a.txt], no conflicts. NAS (same ops): step 1 refused (no block device), 10 = A, 11 = B, step 6 → `A`, step 7 A sees a.txt, b.txt |
| 4 | `san-reservation` | SAN | `fA.mA.mB.wA.wB.rA.uA`, reservation on | 7 | step 5: B's `WRITE LBA 10` → RESERVATION CONFLICT, no further message, disk 10 stays A, B's cache unchanged (no b.txt); step 6 → `A`; step 7 A sees a.txt, nothing lost |

The default params are preset 3's (mode both), so `sim.json` `steps` is 7.

## Params

| Param | Values | Default | Control |
|---|---|---|---|
| `mode` | `nas`, `san`, `both` | `both` | choice |
| `reservation` | A holds a persistent reservation (Write Exclusive) on the LUN | off | toggle, hidden in NAS mode |
| `ops` | the run | `fA.mA.mB.wA.wB.rA.uA` | hidden; set by the presets and the buttons |
| buttons | A formats, A mounts, B mounts, A writes a.txt, B writes b.txt, A reads a.txt, A lists, remount A | | each adds its operation at the next step and drops the steps after it |

## Terms

file-level storage — spremište na razini datoteka; block-level storage — spremište na razini blokova; filesystem —
datotečni sustav (UL ch11); network share — dijeljeni resurs (UL ch18); LUN — logička jedinica (LUN) *(check)*;
target / initiator — cilj / inicijator *(check)*; mount — montiranje (UL ch11); block device — blokovni uređaj (UL
ch11); bitmap — bit tablica (glossary, ossimulator); cluster filesystem — klasterski datotečni sustav *(check)*;
persistent reservation — trajna rezervacija *(check)*.

## Out of scope

Protocol details (NFS versions, SMB dialects, iSCSI login), multipath, NVMe-oF, performance, object storage, journals,
inodes, file sizes above one block.
