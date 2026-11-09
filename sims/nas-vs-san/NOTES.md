<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# nas-vs-san: notes

Task `docs/tasks/w3/nas-vs-san.md` (catalogue `sto-nas-vs-san`, §4.6). Built by thread t-0361 on 2026-11-09.
Rules and numbers: `SPEC.md`.

## Decisions

- **Both panels run the same operations** (`ops`), and `mode` (NAS / SAN / both) only chooses which are shown. The
  state holds `{ op, nas, san }` instead of the task's single panel with `mode` inside it. So "both" compares the two
  kinds of storage step by step, and switching the mode keeps the step (COMMON.md §11: run each variant to its end).
- **The run is a hidden `ops` param** (`fA.mA.mB.wA.wB.rA.uA`), written by the presets and by eight buttons (A
  formats, A mounts, B mounts, A writes a.txt, B writes b.txt, A reads a.txt, A lists, remount A). A button puts its
  operation at the next step and drops the steps after it; the run is capped at 20. Same pattern as
  `cap-under-partition`. The task named four buttons; mount, format and read were added so the student can "mount
  both, connect two clients" from step 0.
- **The LUN starts blank**, so a SAN run starts with "A formats the LUN" (the client makes the filesystem, which is the
  point). On the NAS the same step is refused: the client has no block device; the server's filesystem was made before
  the demo. Mounting a blank LUN is refused with "no filesystem".
- **Toy layout:** LBA 0 superblock, 1 bitmap, 2 directory, 3–9 reserved for metadata (never used), 10–15 data, so the
  first file lands at 10 as the task's presets say. The data in a block is the writer's letter (`A`, `B`); a read
  shows it as `AAAA` / `BBBB`.
- **A SAN write sends three block writes**: the data block, then the client's whole cached bitmap (LBA 1) and
  directory (LBA 2). The last writer wins on every one of them (rule 6).
- **Preset 3's outcome differs slightly from the task text.** The task says "after a remount a.txt contains B's data".
  With a directory block that each client writes whole, B's write also replaces A's directory, so after A's remount
  `a.txt` is **gone** (lost), not "containing B's data". The "contains B's data" moment is the read before the remount
  (step 6: A reads a.txt through its cache → LBA 10 → `BBBB`, no error). The run is therefore 7 steps
  (`fA.mA.mB.wA.wB.rA.uA`) instead of 6. A per-file directory slot would give the task's version but needs a hidden
  slot rule; the lost file is what a real ordinary filesystem does here (the other client's directory block wins).
- **Step counts** come from the runs: 6, 3, 7, 7 (task: 4, 3, 6, 5). Preset 1 mounts both clients first (2 steps) and
  both list at the end; presets 3 and 4 share one run and differ only in the reservation, so the class can flip the
  toggle at the same step. `sim.json` `steps` is the default run's (preset 3), 7.
- **Preset 3 opens in mode "both"** (the default params), so the NAS doing the same work right is beside the
  corruption. Presets 1, 2, 4 show one panel.
- **The reservation is Write Exclusive held by A from step 0** (a param, not an operation). Reads by B stay allowed
  (B mounts); every write by B (data, metadata, format) gets RESERVATION CONFLICT, and B's filesystem aborts the
  operation without touching its cache. The toggle is hidden in NAS mode.
- **NAS locks:** a write records `file: client` in the server's lock table and keeps it (the open state, a
  share reservation, delegation or lease the client holds); a remount drops the client's locks. In NFSv4 a write
  itself takes no byte-range lock, so the caption says the server "records who has the file open". The model has no
  op that writes another client's file, so the lock is shown, not contested.
- **Edge cases** (found by the review): mounting an already mounted client is refused with no message (it used to
  re-read silently and drop files without a "lost" mark); a remount before any mount is a plain mount; a lost file's
  caption names whoever wrote LBA 2 last (not always B); B's format under A's reservation has its own caption.
  "Disk full" cannot happen (each client writes one file) but stays handled.
- **NAS client view** is the last listing it got (mount, list, remount) plus its own new file; it can be stale (A does
  not see b.txt until it lists or remounts), but the server's directory is the only one that allocates.
- **SAN list** sends no message: the client's own cache answers. That is the honest version and makes the point.
- **Conflict mark** (hatched + "!"): a data block claimed by two names among the mounted caches and the disk's
  directory, and LBA 2 when a cache holds an entry the disk lacks. After A's remount the caches agree again, so the
  marks go and the loss is shown as "lost: a.txt" on client A.
- **Disk drawn with the K3 block grid** in two rows of eight (four on a phone), the LBA as the cell's second line:
  sixteen in a row are too narrow beside the second panel. Metadata cells are coloured by their last writer (server,
  A or B); that colour is a second carrier only (the caption says who overwrote what, data cells carry the letter).
- **Hr title** is "Datotečno i blokovno spremište" (shorter than "Spremište na razini datoteka i blokova", which made
  the header wrap); the long forms are in the aliases and the panel headings.
- **Protocol names** (NFS, SMB, iSCSI, FC) appear in the concept, the aliases and the explanation's misconceptions:
  they are the concept's names, not products (COMMON.md §1). No product or tool is named.

## Sources

- RFC 7530, NFS version 4: §1.4 overview of the server namespace; §9 file locking and share reservations; §10.2
  delegations. *(check section numbers)*
- [MS-SMB2], Server Message Block Protocol Versions 2 and 3: §1.3 overview; §3.3.5.9 CREATE with lease contexts.
  *(check section numbers)*
- RFC 7143, iSCSI: its overview of SCSI commands carried over TCP (initiator, target, LUN); §2.1–2.2 are only
  definitions, so the section is *(check)*. Fibre Channel (FCP) carries the
  same SCSI block commands. *(check)*
- T10 SPC-4 (SCSI Primary Commands 4): §5.12 reservations (type Write Exclusive), §6.15 PERSISTENT RESERVE OUT, status
  RESERVATION CONFLICT. *(check section numbers)*
- `~/projects/uvod-u-linux/book/chapters/11-diskovi-i-datotecni-sustavi.md` (blokovni uređaj, datotečni sustav,
  montiranje) and `18-mrezne-usluge.md` (dijeljeni resurs, NFS izvoz) for the Croatian terms.
- NLA `meta/toc.md` T25 ("Mrežno spremište — iSCSI, NVMe-oF, NFS u pogonu"): chapter not written yet.

## Numbers

Derived twice: by the independent Python replay below (written before `sim.js`) and by `sim.js` (tests in
`sim.test.js`). Output of the replay:

```
1 nas  mounted, mounted, a.txt->10, b.txt->11, [a.txt, b.txt], [a.txt, b.txt]; disk 10=A 11=B; locks a.txt:A b.txt:B
2 san  LBA 0-2, [], WRITE LBA 10,1,2; disk 1=(10,) 2={a.txt:10} 10=A
3 san  LBA 0-2, [], [], WRITE LBA 10,1,2, WRITE LBA 10,1,2, B, [b.txt:10]; disk 2={b.txt:10} 10=B; lost [a.txt]
3 nas  refused, mounted, mounted, a.txt->10, b.txt->11, A, mounted; A sees a.txt, b.txt
4 san  LBA 0-2, [], [], WRITE LBA 10,1,2, WRITE LBA 10 CONFLICT, A, [a.txt:10]; disk 10=A; nothing lost
```

```python
FILE = {'A': 'a.txt', 'B': 'b.txt'}
DATA = range(10, 16)

def nas(ops):
    disk = {}; dirs = {}; bm = set(); locks = {}; view = {'A': None, 'B': None}; out = []
    for op in ops.split('.'):
        v, c = op[0], op[1]
        if v == 'f': out.append('refused'); continue
        if v in 'mu': view[c] = dict(dirs); locks = {k: h for k, h in locks.items() if not (v == 'u' and h == c)}; out.append('mounted'); continue
        if view[c] is None: out.append('not mounted'); continue
        f = FILE[c]
        if v == 'w':
            if f not in dirs:
                b = min(x for x in DATA if x not in bm); bm.add(b); dirs[f] = b
            disk[dirs[f]] = c; locks[f] = c; view[c][f] = dirs[f]; out.append(f'{f}->{dirs[f]}')
        elif v == 'l': view[c] = dict(dirs); out.append(sorted(dirs))
        elif v == 'r': out.append(disk.get(dirs.get(f)))
    return out, disk, dirs, sorted(bm), locks, view

def san(ops, res=None):
    disk = {}; cache = {'A': None, 'B': None}; out = []; lost = []
    for op in ops.split('.'):
        v, c = op[0], op[1]
        if v == 'f':
            if res and res != c: out.append('CONFLICT'); continue
            disk[0] = 'fs'; disk[1] = (); disk[2] = {}; out.append('LBA 0-2'); continue
        if v in 'mu':
            old = cache[c]
            if disk.get(0) != 'fs': out.append('nofs'); continue
            cache[c] = {'bm': set(disk[1]), 'dir': dict(disk[2])}
            if v == 'u' and old: lost += [f for f in old['dir'] if f not in cache[c]['dir']]
            out.append(sorted(cache[c]['dir'].items())); continue
        if cache[c] is None: out.append('not mounted'); continue
        f = FILE[c]; k = cache[c]
        if v == 'w':
            b = k['dir'].get(f) or min(x for x in DATA if x not in k['bm'])
            if res and res != c: out.append(f'WRITE LBA {b} CONFLICT'); continue
            k['bm'].add(b); k['dir'][f] = b
            disk[b] = c; disk[1] = tuple(sorted(k['bm'])); disk[2] = dict(k['dir'])
            out.append(f'WRITE LBA {b},1,2')
        elif v == 'l': out.append(sorted(k['dir']))
        elif v == 'r': out.append(disk.get(k['dir'].get(f)))
    return out, {i: disk[i] for i in sorted(disk)}, lost, {c: (cache[c] and sorted(cache[c]['dir'].items())) for c in cache}

TWO = 'fA.mA.mB.wA.wB.rA.uA'
print('1 nas', nas('mA.mB.wA.wB.lA.lB'))
print('2 san', san('fA.mA.wA'))
print('3 san', san(TWO))
print('3 nas', nas(TWO))
print('4 san', san(TWO, 'A'))
```

## Term pairs

Missing from `kit/glossary.js`; written out in both tables (hr: *English* (Croatian) at first mention):

| en | hr | source |
|---|---|---|
| file-level storage | spremište na razini datoteka | task file |
| block-level storage | spremište na razini blokova | task file |
| LUN (logical unit) | logička jedinica (LUN) | task file *(check)* |
| initiator | inicijator | task file *(check)* |
| cluster file system | klasterski datotečni sustav | this sim *(check)* |
| persistent reservation | trajna rezervacija | this sim *(check)* |

Used from the glossary: file system, share, mounting, directory, target (cilj; the glossary's entry comes from UL,
where it is a systemd target, but the pair fits the iSCSI target too), block device, cache. "Bitmap" is written as
"bit tablica" (glossary: *bit table (bitmap)*, ossimulator) without the marker, to keep the English term short.

## Shared requests

- **Kit, block grid (K3):** a per-cell `title`/`aria-label` would let a screen reader say "LBA 10: data from B,
  conflict"; today the cell text and sub line are all it reads. Not needed for the gate.
- **Kit, buttons:** the controls group lays out buttons one per row; with eight operation buttons this page turns the
  group into a two-column grid with its own CSS. A `columns: 2` option (or a button group) in the kit would save that.

## Checks

- `node --test sims/nas-vs-san/sim.test.js`: 23 tests.
- `npm run gate -- nas-vs-san`: pass, 0 exceptions declared. Screenshots reviewed (hr and en; 1920×1080 light, dark,
  grayscale; 375×812), plus extra shots of presets 1, 3 (steps 0, 1, 5, 6, 7) and 4 (step 5) in both languages.
- **Fresh review** (a separate agent read the diff against this SPEC and mutated `sim.js` on a copy): rules 2–6, the
  lowest-free choice, both conflict-mark cases, format while mounted, the not-mounted refusal, the 20-op cap and the
  reservation were all caught by a test. Survivors that mattered (the NAS server's metadata writes and `by`, wire
  replies, the NAS writer's own view, the SAN read's LBA, format resetting the metadata, SAN `changed`) now have
  tests, re-checked by mutation. Survivors that cannot change any reachable state (allocation max+1 instead of lowest
  free: no deletes, so no gaps; NAS read through the client's view) are left. Four bugs it found are fixed (Edge
  cases above), and the Croatian genitives after "nema" and the misconception line ("cannot *safely* share") too.

## Time

Start 2026-11-09 06:26, done 06:50 (about 25 minutes of wall clock, one session).
