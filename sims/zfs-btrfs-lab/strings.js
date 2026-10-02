/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the ZFS & Btrfs topology page, in both languages (docs/sim-ui.md §9). Same keys in hr
   and en. {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). English text adapted from
   single-page-labs/zfs-btrfs-topology-lab.html; Croatian written for simdeck, with the terms of the UL book.
   Pool, vdev, dataset and device names, vdev types, profiles, ZFS states, units and the commands are data, not
   words: the page shows them with translate="no". Terms missing from kit/glossary.js (vdev, pool, dataset,
   snapshot, subvolume, chunk, profile, metadata, record, allocation class, copy-on-write) are written out here:
   NOTES.md "Term pairs". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'ZFS i Btrfs: slojevi od diska do snimke, raspored zapisa ili komada po diskovima i naredbe',
      // presets
      presetMirror: 'Dva zrcala',
      presetMirrorHint: 'Četiri diska u dva zrcalna vdeva; bazen piše naizmjence na oba',
      presetRaidz2: 'RAIDZ2',
      presetRaidz2Hint: 'Šest diskova u jednom RAIDZ2 vdevu: smije otkazati bilo koja dva',
      presetSpecial: 'Special + SLOG',
      presetSpecialHint: 'RAIDZ2 za podatke, zrcalo NVMe-a za metapodatke i zrcalo za sinkrone zapise',
      presetDraid: 'dRAID',
      presetDraidHint: 'Deset diskova u jednom draid2 vdevu: paritet raspoređen po svim diskovima',
      presetBadmix: 'Loša mješavina',
      presetBadmixHint: 'Zrcalo od dva diska i RAIDZ2 u istom bazenu: nejednaka brzina i otpornost',
      presetRaid1: 'Btrfs RAID1',
      presetRaid1Hint: 'Dva uređaja, podaci i metapodaci u dvije kopije',
      presetMixed: 'Podaci single',
      presetMixedHint: 'Tri uređaja: podaci u jednoj kopiji, metapodaci u dvije',
      presetRaid56: 'RAID5 upozorenje',
      presetRaid56Hint: 'Pet uređaja, podaci u RAID5: tema upozorenja, ne preporuka',
      presetCompare: 'Usporedba',
      presetCompareHint: 'ZFS s dva zrcala uz Btrfs RAID1 na istim veličinama diskova',
      // controls
      mode: 'Prikaz',
      modeCompare: 'Usporedba',
      zType: 'Vrsta podatkovnog vdeva',
      zWidth: 'Diskova po vdevu',
      zVdevs: 'Podatkovnih vdevova',
      zSize: 'Veličina diska',
      zMix: 'Plus zrcalo',
      zSpecial: 'Special vdev',
      zLog: 'SLOG vdev',
      zCache: 'L2ARC vdev',
      zSpare: 'Vruća rezerva',
      zEncrypt: 'Šifrirani skup',
      zSnap: 'Snimka',
      zFailed: 'Otkazali ZFS diskovi',
      zSpread: 'Raspodijeli otkaze',
      bDevices: 'Btrfs uređaji',
      bSize: 'Veličina uređaja',
      bData: 'Profil podataka',
      bMeta: 'Profil metapodataka',
      bFailed: 'Otkazali Btrfs uređaji',
      bSnap: 'Snimka',
      opt_single: 'single (jedna kopija)',
      opt_mirror: 'mirror (zrcalo)',
      opt_raidz1: 'raidz1 (jedan paritet)',
      opt_raidz2: 'raidz2 (dva pariteta)',
      opt_raidz3: 'raidz3 (tri pariteta)',
      opt_draid1: 'draid1 (raspoređeni paritet)',
      opt_draid2: 'draid2 (raspoređena dva pariteta)',
      opt_dup: 'dup (dvije kopije na istom uređaju)',
      opt_raid0: 'raid0 (pruge, bez kopije)',
      opt_raid1: 'raid1 (dvije kopije)',
      opt_raid1c3: 'raid1c3 (tri kopije)',
      opt_raid1c4: 'raid1c4 (četiri kopije)',
      opt_raid10: 'raid10 (pruge zrcala)',
      opt_raid5: 'raid5 (jedan paritet)',
      opt_raid6: 'raid6 (dva pariteta)',
      // legend
      legendData: 'D: podaci',
      legendCopy: 'C: kopija',
      legendParity: 'P: paritet (šrafirano)',
      legendFailed: 'otkazalo ili nije stvoreno (iscrtkano, ✕)',
      // counters
      kpiDisks: 'ZFS diskova',
      kpiVdevs: 'podatkovnih vdevova',
      kpiUsable: 'upotrebljivo u bazenu',
      kpiUsed: 'logički zauzeto',
      kpiPoolHealth: 'stanje bazena',
      kpiDevices: 'Btrfs uređaja',
      kpiData: 'profil podataka',
      kpiMeta: 'profil metapodataka',
      kpiUsableB: 'procjena upotrebljivog',
      kpiFsHealth: 'stanje datotečnog sustava',
      kpiZHealth: 'stanje ZFS bazena',
      kpiZUsable: 'ZFS upotrebljivo',
      kpiBHealth: 'stanje Btrfs-a',
      kpiBUsable: 'Btrfs upotrebljivo',
      kpiNamespaces: 'skupova podataka i podvolumena',
      none: '—',
      unitGiB: 'GiB',
      unitTiB: 'TiB',
      nDisks: ['{n} disk', '{n} diska', '{n} diskova'],
      nDevices: ['{n} uređaj', '{n} uređaja', '{n} uređaja'],
      nVdevs: ['{n} podatkovni vdev', '{n} podatkovna vdeva', '{n} podatkovnih vdevova'],
      // ZFS layers
      topoZ: 'ZFS: diskovi → vdevovi → bazen → skupovi podataka → snimke',
      layerVdevs: 'Vdevovi i njihovi diskovi',
      layerPool: 'Bazen',
      layerDatasets: 'Skupovi podataka i zvolovi',
      layerSnaps: 'Snimke',
      roleData: 'podaci',
      roleSpecial: 'special',
      roleLog: 'SLOG',
      roleCache: 'L2ARC',
      roleSpare: 'rezerva',
      roleSpecialSub: 'metapodaci i mali blokovi; nije podatkovni kapacitet',
      roleLogSub: 'sinkroni zapisi (ZIL); nije kapacitet',
      roleCacheSub: 'priručna memorija za čitanje; nije kapacitet',
      roleSpareSub: 'čeka zamjenu diska; nije kapacitet',
      vdevSub: '{usable} upotrebljivo · podnosi {faults} u otkazu',
      poolSub: '{usable} upotrebljivo · {free} slobodno',
      fsSub: 'datotečni sustav · {used} zauzeto · kvota {quota}',
      zvolSub: 'blokovni uređaj (zvol) · {used} zauzeto · veličina {quota}',
      encrypted: 'šifrirano',
      snapSub: 'snimka · {used} samo njezino',
      placeZ: 'Raspored zapisa: bazen ih piše naizmjence po podatkovnim vdevovima',
      record: 'zapis {i}',
      rowOk: 'čitljivo',
      rowDegraded: 'čitljivo, bez zalihe',
      rowLost: 'izgubljeno',
      // Btrfs layers
      topoB: 'Btrfs: uređaji → datotečni sustav → profili → podvolumeni → snimke',
      layerDevices: 'Blokovni uređaji',
      layerFs: 'Datotečni sustav',
      layerProfiles: 'Profili komada',
      layerSubvols: 'Podvolumeni',
      devFailed: '✕ otkazao',
      fsNotCreated: '✕ nije stvoren: treba barem {need}',
      bfsSub: '{usable} upotrebljivo · {free} slobodno',
      profData: 'podaci: {p}',
      profMeta: 'metapodaci: {p}',
      profSub: 'podnosi {tol} u otkazu · najmanje {min}',
      subvolSub: '{used} zauzeto · nije blokovni uređaj',
      bsnapSub: 'snimka samo za čitanje · {used} samo njezino',
      placeB: 'Raspored komada: svaki četvrti su metapodaci, ostalo podaci',
      chunkMeta: 'metapodaci {i}',
      chunkData: 'podaci {i}',
      bOnline: 'ispravno',
      bDegraded: 'degradirano',
      bUnavailable: 'nedostupno',
      bWarning: 'upozorenje',
      bNone: 'nema ga',
      // commands
      cmdTitle: 'Naredbe',
      cmdNote: '# Nastavni prijevod modela: imena bazena, uređaja i veličine su primjeri.',
      cmdFailed: '# ne uspijeva',
      noteFail: '# {device} otkazuje; brojače grešaka pokazuje:',
      // comparison
      cmpZ: 'ZFS: najprije vdevovi',
      cmpB: 'Btrfs: najprije profili',
      domZTitle: 'ZFS: granica otkaza je vdev',
      domZ: 'Ako bilo koji podatkovni vdev izgubi više diskova nego što podnosi, gubi se cijeli bazen.',
      domBTitle: 'Btrfs: granica otkaza je profil',
      domB: 'Profili podataka i metapodataka određuju gdje su komadi; dva profila u istom sustavu mogu podnositi različit broj otkaza.',
      contrastTitle: 'Ključna razlika',
      contrast: 'ZFS zalihost upisuje u topologiju: novi vdev proširuje bazen, a zapisi se raspoređuju po vdevovima. Btrfs zalihost upisuje u profil svakog komada: promjena profila je premještanje komada unutar istog datotečnog sustava.',
      // caption
      capCompare: 'Isti diskovi, dva modela. ZFS: {zh}, {zu} upotrebljivo. Btrfs: {bh}, {bu} upotrebljivo.',
      capZRule: 'Zalihost se bira po vdevu; bazen ima {n} i zapise piše naizmjence po njima: {usable} upotrebljivo od {raw} sirovog.',
      capZMix: 'Vdevovi nisu jednaki (zrcalo od 2 diska i {type} od {w}): zapisi idu na oba, pa su brzina i otpornost nejednake.',
      capZAux: 'Special, SLOG, L2ARC i rezerva su klase dodjele: ne dodaju podatkovni kapacitet.',
      capZDegraded: 'Otkazalo je {n}, ali svaki podatkovni vdev još ima dovoljno zalihe: bazen radi degradirano. Zamijenite disk prije sljedećeg otkaza.',
      capZFaulted: 'Vdev {v} ({type}) izgubio je {off}, a podnosi {faults}: cijeli bazen je izgubljen, iako su ostali vdevovi ispravni.',
      capBTooFew: 'Nema datotečnog sustava: podaci {data} i metapodaci {meta} trebaju barem {need} uređaja, a ima ih {have}.',
      capBRule: 'Jedan datotečni sustav na {n} uređaja: komadi podataka su {data}, komadi metapodataka {meta}; oko {usable} upotrebljivo od {raw} sirovog.',
      capBDup: 'dup drži obje kopije na istom uređaju: preživi loš blok, ne izgubljeni uređaj.',
      capBDegraded: 'Otkazalo je {n}, ali oba profila još imaju kopiju ili paritet: sustav radi degradirano.',
      capBLost: 'Otkazalo je {n}, a slabiji profil podnosi {tol}: datotečni sustav je nedostupan.',
      capBLostMeta: 'Otkazalo je {n}, a profil metapodataka podnosi samo {tol}: bez metapodataka se sustav ne može montirati.',
      capBRaid56: 'RAID5/6 u Btrfs-u ovdje je tema upozorenja: dobar za objašnjenje paritetnih komada, ali prije produkcije provjerite njegovo trenutno stanje.',
      // the explanation
      explain:
        '<h3>Dva načina za istu zalihost</h3>' +
        '<p>ZFS i Btrfs su i upravitelj volumena i [[file system]]: oba imaju kopiranje pri pisanju (<i>copy-on-write</i>), ' +
        'kontrolne zbrojeve, provjeru (<i>scrub</i>), sažimanje i snimke. Razlikuju se po tome gdje se bira zalihost.</p>' +
        '<h3>ZFS: najprije vdevovi</h3>' +
        '<p>Diskovi čine <i>vdev</i> (virtualni uređaj), a podatkovni vdevovi čine <i>pool</i> (bazen). Zalihost se bira po ' +
        'vdevu: zrcalo ([[mirroring]]) smije izgubiti sve osim jednog diska, RAIDZ1/2/3 onoliko diskova koliko ima ' +
        '[[parity]] (pariteta), a dRAID raspoređuje paritet i rezervni prostor po svim diskovima. Bazen piše zapise ' +
        'naizmjence po podatkovnim vdevovima. Ako bilo koji od njih izgubi previše diskova, gubi se cijeli bazen.</p>' +
        '<p>Special vdev drži metapodatke i male blokove (zato je zrcaljen: njegov gubitak je gubitak bazena), SLOG prima ' +
        'sinkrone zapise, L2ARC je priručna memorija za čitanje, a [[hot spare]] čeka da zamijeni disk. Nijedan od njih ' +
        'ne dodaje podatkovni kapacitet. Unutar bazena su <i>dataset</i> (skup podataka) i zvol, blokovni uređaj iz bazena.</p>' +
        '<h3>Btrfs: najprije profili</h3>' +
        '<p>Svi uređaji čine jedan datotečni sustav. Prostor se dijeli na komade (<i>chunk</i>), a svaki komad ima ' +
        '<i>profile</i> (profil): single, dup, raid0, raid1, raid1c3, raid1c4, raid10, raid5 ili raid6. Podaci i ' +
        'metapodaci imaju svoj profil, pa metapodaci mogu imati više kopija od podataka. Promjena profila je ' +
        'premještanje komada (<i>balance</i>) unutar istog sustava. <i>Subvolume</i> (podvolumen) je korijen imenskog ' +
        'prostora, ne [[block device]]; snimka je također podvolumen koji dijeli blokove s izvorom.</p>' +
        '<p>RAID5/6 u Btrfs-u ovdje je tema upozorenja: dobra za objašnjenje paritetnih komada, ali njegovo stanje treba ' +
        'provjeriti prije produkcije.</p>' +
        '<h3>Na predavanju</h3>' +
        '<p>Počnite s <i>Dva zrcala</i> i povucite otkaze na 2: u istom zrcalu bazen je izgubljen, a s uključenim ' +
        '„Raspodijeli otkaze” radi degradirano. Zatim <i>RAIDZ2</i> s dva otkaza, pa <i>Loša mješavina</i>. ' +
        'U Btrfs-u usporedite <i>Podaci single</i> s jednim otkazom: dio komada podataka je izgubljen, a metapodaci ' +
        'su još čitljivi. Sve se zove RAID ([[=mirroring]], [[=parity]]), pa za same razine RAID-a otvorite simulator RAID-a.</p>' +
        '<p>Naredbe su nastavni prijevod modela; kapacitet je približna nastavna računica.</p>'
    },
    en: {
      stage: 'ZFS and Btrfs: the layers from disk to snapshot, how records or chunks land on the disks, and the commands',
      // presets
      presetMirror: 'Two mirrors',
      presetMirrorHint: 'Four disks in two mirror vdevs; the pool writes to both in turn',
      presetRaidz2: 'RAIDZ2',
      presetRaidz2Hint: 'Six disks in one RAIDZ2 vdev: any two may fail',
      presetSpecial: 'Special + SLOG',
      presetSpecialHint: 'RAIDZ2 for data, an NVMe mirror for metadata and a mirror for synchronous writes',
      presetDraid: 'dRAID',
      presetDraidHint: 'Ten disks in one draid2 vdev: parity spread over every disk',
      presetBadmix: 'Bad mix',
      presetBadmixHint: 'A two-disk mirror and a RAIDZ2 in one pool: uneven speed and failure tolerance',
      presetRaid1: 'Btrfs RAID1',
      presetRaid1Hint: 'Two devices, data and metadata in two copies',
      presetMixed: 'Data single',
      presetMixedHint: 'Three devices: data in one copy, metadata in two',
      presetRaid56: 'RAID5 warning',
      presetRaid56Hint: 'Five devices, data in RAID5: a warning topic, not an endorsement',
      presetCompare: 'Compare',
      presetCompareHint: 'ZFS with two mirrors next to Btrfs RAID1 on the same disk sizes',
      // controls
      mode: 'View',
      modeCompare: 'Compare',
      zType: 'Data vdev type',
      zWidth: 'Disks per vdev',
      zVdevs: 'Data vdevs',
      zSize: 'Disk size',
      zMix: 'Plus a mirror',
      zSpecial: 'Special vdev',
      zLog: 'SLOG vdev',
      zCache: 'L2ARC vdev',
      zSpare: 'Hot spare',
      zEncrypt: 'Encrypted dataset',
      zSnap: 'Snapshot',
      zFailed: 'Failed ZFS disks',
      zSpread: 'Spread failures',
      bDevices: 'Btrfs devices',
      bSize: 'Device size',
      bData: 'Data profile',
      bMeta: 'Metadata profile',
      bFailed: 'Failed Btrfs devices',
      bSnap: 'Snapshot',
      opt_single: 'single (one copy)',
      opt_mirror: 'mirror',
      opt_raidz1: 'raidz1 (single parity)',
      opt_raidz2: 'raidz2 (double parity)',
      opt_raidz3: 'raidz3 (triple parity)',
      opt_draid1: 'draid1 (distributed parity)',
      opt_draid2: 'draid2 (distributed double parity)',
      opt_dup: 'dup (two copies on one device)',
      opt_raid0: 'raid0 (stripes, no copy)',
      opt_raid1: 'raid1 (two copies)',
      opt_raid1c3: 'raid1c3 (three copies)',
      opt_raid1c4: 'raid1c4 (four copies)',
      opt_raid10: 'raid10 (striped mirrors)',
      opt_raid5: 'raid5 (single parity)',
      opt_raid6: 'raid6 (double parity)',
      // legend
      legendData: 'D: data',
      legendCopy: 'C: copy',
      legendParity: 'P: parity (hatched)',
      legendFailed: 'failed or not created (dashed, ✕)',
      // counters
      kpiDisks: 'ZFS disks',
      kpiVdevs: 'top-level data vdevs',
      kpiUsable: 'usable pool capacity',
      kpiUsed: 'logical used',
      kpiPoolHealth: 'pool health',
      kpiDevices: 'Btrfs devices',
      kpiData: 'data profile',
      kpiMeta: 'metadata profile',
      kpiUsableB: 'estimated usable',
      kpiFsHealth: 'filesystem health',
      kpiZHealth: 'ZFS pool health',
      kpiZUsable: 'ZFS usable',
      kpiBHealth: 'Btrfs health',
      kpiBUsable: 'Btrfs usable',
      kpiNamespaces: 'datasets and subvolumes',
      none: '—',
      unitGiB: 'GiB',
      unitTiB: 'TiB',
      nDisks: ['{n} disk', '{n} disks'],
      nDevices: ['{n} device', '{n} devices'],
      nVdevs: ['{n} data vdev', '{n} data vdevs'],
      // ZFS layers
      topoZ: 'ZFS: disks → vdevs → pool → datasets → snapshots',
      layerVdevs: 'Vdevs and their disks',
      layerPool: 'Pool',
      layerDatasets: 'Datasets and zvols',
      layerSnaps: 'Snapshots',
      roleData: 'data',
      roleSpecial: 'special',
      roleLog: 'SLOG',
      roleCache: 'L2ARC',
      roleSpare: 'spare',
      roleSpecialSub: 'metadata and small blocks; not data capacity',
      roleLogSub: 'synchronous writes (ZIL); not capacity',
      roleCacheSub: 'read cache; not capacity',
      roleSpareSub: 'waits to replace a disk; not capacity',
      vdevSub: '{usable} usable · survives {faults} failing',
      poolSub: '{usable} usable · {free} free',
      fsSub: 'filesystem · {used} used · quota {quota}',
      zvolSub: 'block device (zvol) · {used} used · size {quota}',
      encrypted: 'encrypted',
      snapSub: 'snapshot · {used} its own',
      placeZ: 'Record placement: the pool writes them to the data vdevs in turn',
      record: 'record {i}',
      rowOk: 'readable',
      rowDegraded: 'readable, no redundancy left',
      rowLost: 'lost',
      // Btrfs layers
      topoB: 'Btrfs: devices → filesystem → profiles → subvolumes → snapshots',
      layerDevices: 'Block devices',
      layerFs: 'Filesystem',
      layerProfiles: 'Chunk profiles',
      layerSubvols: 'Subvolumes',
      devFailed: '✕ failed',
      fsNotCreated: '✕ not created: needs at least {need}',
      bfsSub: '{usable} usable · {free} free',
      profData: 'data: {p}',
      profMeta: 'metadata: {p}',
      profSub: 'survives {tol} failing · at least {min}',
      subvolSub: '{used} used · not a block device',
      bsnapSub: 'read-only snapshot · {used} its own',
      placeB: 'Chunk placement: every fourth chunk is metadata, the rest data',
      chunkMeta: 'metadata {i}',
      chunkData: 'data {i}',
      bOnline: 'online',
      bDegraded: 'degraded',
      bUnavailable: 'unavailable',
      bWarning: 'warning',
      bNone: 'none',
      // commands
      cmdTitle: 'Commands',
      cmdNote: '# A teaching translation of the model: pool and device names and sizes are examples.',
      cmdFailed: '# fails',
      noteFail: '# {device} fails; the error counters show it:',
      // comparison
      cmpZ: 'ZFS: vdevs first',
      cmpB: 'Btrfs: profiles first',
      domZTitle: 'ZFS: the failure domain is the vdev',
      domZ: 'If any top-level data vdev loses more disks than it survives, the whole pool is lost.',
      domBTitle: 'Btrfs: the failure domain is the profile',
      domB: 'The data and metadata profiles decide where chunks go; two profiles in one filesystem can survive a different number of failures.',
      contrastTitle: 'Key contrast',
      contrast: 'ZFS writes redundancy into the topology: another vdev expands the pool, and records are spread over the vdevs. Btrfs writes redundancy into each chunk\'s profile: changing a profile relocates chunks inside the same filesystem.',
      // caption
      capCompare: 'The same disks, two models. ZFS: {zh}, {zu} usable. Btrfs: {bh}, {bu} usable.',
      capZRule: 'Redundancy is chosen per vdev, and the pool writes records in turn to its {n}: {usable} usable of {raw} raw.',
      capZMix: 'The vdevs differ (a 2-disk mirror and {type} of {w}): records land on both, so speed and failure tolerance are uneven.',
      capZAux: 'Special, SLOG, L2ARC and spare are allocation classes: they add no data capacity.',
      capZDegraded: '{n} failed, but every data vdev still has enough redundancy: the pool runs degraded. Replace the disk before the next failure.',
      capZFaulted: 'Vdev {v} ({type}) lost {off} and survives {faults}: the whole pool is lost, even though the other vdevs are fine.',
      capBTooFew: 'No filesystem: data {data} and metadata {meta} need at least {need} devices, and there are {have}.',
      capBRule: 'One filesystem on {n} devices: data chunks are {data}, metadata chunks {meta}; about {usable} usable of {raw} raw.',
      capBDup: 'dup keeps both copies on the same device: it survives a bad block, not a lost device.',
      capBDegraded: '{n} failed, but both profiles still have a copy or parity: the filesystem runs degraded.',
      capBLost: '{n} failed, and the weaker profile survives {tol}: the filesystem is unavailable.',
      capBLostMeta: '{n} failed, and the metadata profile survives only {tol}: without metadata the filesystem cannot be mounted.',
      capBRaid56: 'Btrfs RAID5/6 is a warning topic here: good for explaining parity chunks, but check its current status before production use.',
      // the explanation
      explain:
        '<h3>Two ways to the same redundancy</h3>' +
        '<p>ZFS and Btrfs are both a volume manager and a [[file system]]: both have copy-on-write, checksums, scrub, ' +
        'compression and snapshots. They differ in where redundancy is chosen.</p>' +
        '<h3>ZFS: vdevs first</h3>' +
        '<p>Disks form a vdev (virtual device), and the data vdevs form a pool. Redundancy is chosen per vdev: a mirror ' +
        '([[mirroring]]) may lose all but one disk, RAIDZ1/2/3 as many disks as it has [[parity]], and dRAID spreads ' +
        'parity and spare space over every disk. The pool writes records in turn to its data vdevs. If any of them ' +
        'loses too many disks, the whole pool is lost.</p>' +
        '<p>A special vdev holds metadata and small blocks (so it is mirrored: losing it loses the pool), a SLOG takes ' +
        'synchronous writes, L2ARC is a read cache, and a [[hot spare]] waits to replace a disk. None of them adds data ' +
        'capacity. Inside the pool live datasets and zvols, block devices made from the pool.</p>' +
        '<h3>Btrfs: profiles first</h3>' +
        '<p>All devices form one filesystem. Space is split into chunks, and each chunk has a profile: single, dup, ' +
        'raid0, raid1, raid1c3, raid1c4, raid10, raid5 or raid6. Data and metadata each have their own profile, so ' +
        'metadata can have more copies than data. Changing a profile relocates chunks (a balance) inside the same ' +
        'filesystem. A subvolume is a namespace root, not a [[block device]]; a snapshot is also a subvolume that ' +
        'shares blocks with its origin.</p>' +
        '<p>Btrfs RAID5/6 is a warning topic here: good for explaining parity chunks, but check its status before ' +
        'production use.</p>' +
        '<h3>In the lecture</h3>' +
        '<p>Start with <i>Two mirrors</i> and drag the failures to 2: in the same mirror the pool is lost, and with ' +
        '“Spread failures” on it runs degraded. Then <i>RAIDZ2</i> with two failures, then <i>Bad mix</i>. ' +
        'In Btrfs, try <i>Data single</i> with one failure: some data chunks are lost, and the metadata is still ' +
        'readable. All of this is RAID ([[=mirroring]], [[=parity]]); for the RAID levels themselves, open the RAID ' +
        'simulator.</p>' +
        '<p>The commands are a teaching translation of the model; capacity is approximate classroom math.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
