/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the Stratis topology page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). English text adapted from
   single-page-labs/stratis-topology-lab.html; Croatian written for simdeck, with the terms of the UL book.
   Device, pool and filesystem names, sizes' units and the commands are data, not words: the page shows them with
   translate="no". Terms missing from kit/glossary.js (pool, thin provisioning, snapshot, multipath, cache tier,
   overprovisioning) are written out here: NOTES.md "Term pairs". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stratis: slojevi od izvora pohrane do točke montiranja, kapacitet i naredbe',
      // presets
      presetLocal: 'Lokalni',
      presetLocalHint: 'Dva lokalna HDD-a u jednom bazenu i tanki XFS veći od bazena',
      presetMixed: 'Mješovito',
      presetMixedHint: 'Lokalni SSD, iSCSI LUN i FC LUN u istom bazenu: Stratis vidi samo blokovne uređaje',
      presetIscsi: 'iSCSI ×2',
      presetIscsiHint: 'Jedan iSCSI LUN preko dvije sesije, spojen u jedan uređaj',
      presetFc: 'FC SAN',
      presetFcHint: 'Dva FC LUN-a, svaki preko četiri putanje; povucite „Neispravne putanje”',
      presetNvmetcp: 'NVMe/TCP',
      presetNvmetcpHint: 'NVMe imenski prostor preko TCP/IP mreže, dvije putanje kontrolera',
      presetEncrypted: 'Šifrirano',
      presetEncryptedHint: 'Svaki član bazena u LUKS2, ključ s mrežnog poslužitelja ključeva',
      presetCache: 'Priručna razina',
      presetCacheHint: 'Dva HDD-a za podatke, NVMe kao priručna razina',
      presetSnapshot: 'Snimka',
      presetSnapshotHint: 'Snimka dijeli blokove s izvorom; prepisani podaci troše novi prostor',
      presetNompath: 'Nespojeno',
      presetNompathHint: 'Dvije putanje bez višestrukih putanja: isti LUN dvaput, bazen se ne stvara',
      // controls
      kind: 'Izvor / prijenos podatkovnih uređaja',
      kindLocalHdd: 'Lokalni SATA HDD',
      kindLocalSsd: 'Lokalni SAS/SATA SSD',
      kindLocalNvme: 'Lokalni NVMe imenski prostor',
      kindIscsi: 'iSCSI LUN preko Etherneta/IP-a',
      kindFc: 'Fibre Channel LUN',
      kindNvmetcp: 'NVMe/TCP imenski prostor',
      kindMdraid: 'Postojeći md RAID uređaj',
      kindLvmlv: 'Postojeći LVM logički volumen',
      kindLuks: 'Postojeći LUKS uređaj',
      kindMixed: 'Mješovito: SSD, iSCSI, FC, NVMe/TCP',
      devices: 'Podatkovni uređaji',
      devSize: 'Veličina uređaja',
      paths: 'Putanje po LUN-u',
      multipath: 'Spoji putanje',
      down: 'Neispravne putanje',
      encryption: 'Šifriranje bazena',
      encNone: 'Bez šifriranja',
      encKeyring: 'LUKS2, ključ u jezgri',
      encTang: 'LUKS2, mrežni poslužitelj ključeva',
      encTpm2: 'LUKS2, čip TPM2',
      overprov: 'Više od bazena',
      cache: 'Priručna razina',
      logical: 'Logička veličina',
      used: 'Zapisani podaci',
      snapshot: 'Snimka',
      written: 'Prepisano poslije',
      // legend
      legendDevice: 'jedan uređaj kroz slojeve (boja i broj)',
      legendDown: 'neispravno ili nije stvoreno (iscrtkano, ✕)',
      legendPool: 'bazen i njegova unutrašnjost',
      legendFs: 'datotečni sustav i snimka',
      // counters
      kpiRaw: 'sirovi kapacitet koji domaćin vidi',
      kpiData: 'podatkovna razina bazena',
      kpiUsed: 'fizički zauzeto',
      kpiLogical: 'logički obećano',
      kpiPaths: 'aktivnih mrežnih putanja',
      none: '—',
      unitGiB: 'GiB',
      unitTiB: 'TiB',
      // the layers
      topoTitle: 'Slojevi, odozgo prema dolje',
      layerSource: 'Izvor pohrane',
      layerPath: 'Mreža / fabric',
      layerBlock: 'Blokovni uređaji jezgre',
      layerMpath: 'Višestruke putanje',
      layerCrypt: 'Šifriranje (Stratis)',
      layerPool: 'Bazen (Stratis)',
      layerInternal: 'Unutar bazena',
      layerFs: 'Datotečni sustavi',
      layerMount: 'Točke montiranja',
      srcDisk: 'fizički disk {i}',
      srcArray: 'polje za pohranu · LUN {i}',
      srcIscsi: 'iSCSI cilj · LUN {i}',
      srcNvme: 'NVMe podsustav · NSID {i}',
      srcMd: 'md RAID skup {i}',
      srcLv: 'gornji VG/LV {i}',
      srcLuks: 'postojeći LUKS {i}',
      srcCache: 'NVMe za priručnu razinu',
      pathIscsi: 'sesija {i} · NIC{i}',
      pathFc: 'HBA{i} · fabric {i}',
      pathNvmetcp: 'putanja kontrolera {i} · NIC{i}',
      pathUp: 'radi',
      pathDown: '✕ ne radi',
      blockSub: '{kind} · {size}',
      blockPathOf: 'putanja {i} do LUN-a {lun}',
      blockDuplicate: '✕ isti LUN {lun} još jednom',
      blockCache: 'priručna razina · {size}',
      mpathSub: 'radi {up}/{n} putanja',
      mpathDownSub: '✕ nijedna putanja ne radi',
      cryptNode: 'LUKS2 · član {i}',
      poolSub: '{size} podataka · {enc}',
      poolFailed: '✕ nije stvoren',
      poolDown: '✕ izgubio člana',
      encLabelNone: 'bez šifriranja',
      encLabelKeyring: 'LUKS2 · ključ u jezgri',
      encLabelTang: 'LUKS2 · mrežni ključ',
      encLabelTpm2: 'LUKS2 · TPM2',
      cacheNode: 'priručna razina {size}',
      thinNode: 'tanki bazen · zauzeto {size}',
      fsSub: 'XFS · {used} zapisano / {logical} logički',
      fsFailed: '✕ nije stvoren',
      snapSub: 'snimka · dijeli {shared}, vlastito {own}',
      offlineSub: '✕ nedostupno',
      // capacity
      capTitle: 'Kapacitet: fizički i logički',
      capPhys: 'Fizički (podatkovna razina {cap})',
      capLogical: 'Logički (što datotečni sustav obećava)',
      capMeta: 'metapodaci',
      capData: 'podaci',
      capSnap: 'samo za snimku',
      capFree: 'slobodno {free}',
      capOver: 'iznad bazena',
      capRatio: 'Omjer logičko / fizičko: {ratio}',
      capPolicyThin: 'tanko, smije obećati više',
      capPolicyFull: 'bez prekomjernog obećavanja',
      // the commands
      cmdTitle: 'Približan slijed naredbi',
      cmdNote: '# Nastavni prijevod: adrese, imena uređaja i ključeva su primjeri.',
      cmdFailed: '# ne uspijeva',
      nPaths: ['{n} putanja', '{n} putanje', '{n} putanja'],
      noteIscsi: '# iSCSI: prijava na cilj, {paths} → {device}',
      noteFc: '# FC: zoniranje i maskiranje LUN-a na fabricu, ponovno skeniranje HBA-ova, {paths} → {device}',
      noteNvmetcp: '# NVMe/TCP: spajanje na podsustav, {paths} → {device}',
      noteMpath: ' (spojeno)',
      // caption
      ruleLocal: 'Lokalni disk već je blokovni uređaj: Stratis ga uzima takav kakav jest.',
      ruleLayered: '{kind} je blokovni uređaj koji je već složio drugi sloj; Stratis vidi samo konačni blokovni uređaj.',
      ruleRemote: '{protocol} je samo prijenos: jezgra od LUN-a napravi blokovni uređaj, a tek njega uzima Stratis.',
      ruleMixed: 'Stratisu nije važno kako je uređaj stigao: lokalni i mrežni uređaji dijele isti bazen.',
      mpathOn: 'Višestruke putanje spajaju {paths} jednog LUN-a u {device}.',
      mpathOne: 'Jedna putanja: ako ona padne, uređaj nestaje.',
      poolOk: 'Bazen {pool}: {cap} na podatkovnoj razini.',
      poolDup: 'Bazen se ne stvara: {device} ima {paths} bez spajanja, pa se isti LUN vidi kao više blokovnih uređaja. Uključite višestruke putanje.',
      pathsDownOk: 'Ne radi {down} od {n} putanja: višestruke putanje drže {device} na mreži.',
      pathsDownLost: 'Nijedna putanja do {device} ne radi: bazen {pool} gubi člana i datotečni sustav je nedostupan.',
      fsOk: 'Datotečni sustav {fs}: obećava {logical}, zapisano {used}.',
      fsNoOver: 'Datotečni sustav se ne stvara: prekomjerno obećavanje je isključeno, a {logical} je više od {cap} u bazenu.',
      fsNoSpace: 'Datotečni sustav se ne stvara: {used} podataka ne stane u {free} slobodnog fizičkog prostora.',
      overYes: 'Obećano je {ratio} kapaciteta bazena: tanko dodjeljivanje. Bazen mora narasti prije nego što narastu podaci.',
      overNo: 'Bazen pokriva sve što datotečni sustav obećava.',
      cacheOn: 'Priručna razina od {size} ubrzava čitanje i pisanje, ali ne dodaje kapacitet.',
      encOn: 'Svaki član bazena šifriran je s LUKS2 ispod bazena; ključ dolazi iz: {source}.',
      encSrcKeyring: 'skup ključeva jezgre',
      encSrcTang: 'mrežni poslužitelj ključeva',
      encSrcTpm2: 'čip TPM2 u stroju',
      snapOn: 'Snimka {snap} dijeli {shared} s izvorom {fs}; {own} prepisanih u izvoru nakon snimke čuva se samo za snimku.',
      snapCapped: 'Prepisano je ograničeno na podatke izvora i slobodan prostor bazena ({requested} → {written}).',
      // the explanation
      explain:
        '<h3>Prijenos nije pohrana</h3>' +
        '<p>iSCSI, Fibre Channel i NVMe/TCP samo donose udaljenu pohranu do stroja. Jezgra od LUN-a ili NVMe ' +
        'imenskog prostora napravi [[block device]] (blokovni uređaj), a Stratis tek iznad toga upravlja bazenima, tankim XFS ' +
        'datotečnim sustavima, snimkama, šifriranjem i priručnom razinom.</p>' +
        '<ul>' +
        '<li><b>iSCSI</b>: TCP/IP mreža → mrežna kartica → iSCSI sesija → SCSI LUN → blokovni uređaj.</li>' +
        '<li><b>Fibre Channel</b>: FC fabric → HBA → SCSI LUN → blokovni uređaj. Zoniranje i maskiranje LUN-a su izvan Stratisa.</li>' +
        '<li><b>NVMe/TCP</b>: TCP/IP mreža → mrežna kartica → veza s NVMe kontrolerom → blokovni uređaj imenskog prostora.</li>' +
        '<li><b>NFS i SMB su nešto drugo</b>: donose udaljeni [[file system]] (datotečni sustav), ne blokovni uređaj, pa ne mogu biti članovi bazena.</li>' +
        '</ul>' +
        '<h3>Više putanja, jedan uređaj</h3>' +
        '<p>Kad do istog LUN-a vode dvije ili više putanja, svaka se u jezgri pojavi kao zaseban blokovni uređaj. ' +
        '<i lang="en">Multipath</i> (višestruke putanje) ih spaja u jedan uređaj i preusmjerava promet kad jedna putanja padne. ' +
        'Bez toga bi Stratis isti LUN vidio dvaput, pa takav uređaj ne smije ući u bazen.</p>' +
        '<h3>Bazen, tanki datotečni sustav, snimka</h3>' +
        '<p><i lang="en">Pool</i> (bazen) je sav prostor podatkovnih uređaja zajedno. Unutar njega je tanki bazen ' +
        '(device-mapper), iz kojeg XFS datotečni sustavi dobivaju blokove tek kad se na njih piše: to je ' +
        '<i lang="en">thin provisioning</i> (tanko dodjeljivanje). Logička veličina zato smije biti veća od bazena, osim ako je ' +
        'prekomjerno obećavanje (<i lang="en">overprovisioning</i>) isključeno.</p>' +
        '<p><i lang="en">Snapshot</i> (snimka) je novi datotečni sustav koji u trenutku stvaranja dijeli sve blokove s izvorom. ' +
        'Novi fizički prostor troši tek ono što se u izvoru nakon toga prepiše.</p>' +
        '<h3>Šifriranje i priručna razina</h3>' +
        '<p>Šifrirani bazen stavlja svakog člana u LUKS2; ključ je u skupu ključeva jezgre ili ga Clevis dobiva s mrežnog ' +
        'poslužitelja ključeva (Tang) ili iz čipa TPM2. <i lang="en">Cache tier</i> (priručna razina) na brzom uređaju ubrzava ' +
        'pristup podatkovnoj razini, ali ne dodaje kapacitet.</p>' +
        '<h3>Za predavanje</h3>' +
        '<p>Krenite od primjera <i>Lokalni</i>, pa prijeđite na <i>Mješovito</i>: bazen je isti. U primjeru <i>FC SAN</i> povucite ' +
        'neispravne putanje do kraja, pa usporedite s primjerom <i>Nespojeno</i>. Na kraju povećajte zapisane podatke ' +
        'dok fizički prostor ne postane tijesan.</p>' +
        '<p>Naredbe su nastavni prijevod modela: adrese, imena i otisci ključeva su primjeri.</p>'
    },
    en: {
      stage: 'Stratis: the layers from storage source to mount point, capacity and commands',
      // presets
      presetLocal: 'Local',
      presetLocalHint: 'Two local HDDs in one pool and a thin XFS larger than the pool',
      presetMixed: 'Mixed',
      presetMixedHint: 'A local SSD, an iSCSI LUN and an FC LUN in one pool: Stratis only sees block devices',
      presetIscsi: 'iSCSI ×2',
      presetIscsiHint: 'One iSCSI LUN over two sessions, joined into one device',
      presetFc: 'FC SAN',
      presetFcHint: 'Two FC LUNs, four paths each; drag "Failed paths"',
      presetNvmetcp: 'NVMe/TCP',
      presetNvmetcpHint: 'An NVMe namespace over a TCP/IP network, two controller paths',
      presetEncrypted: 'Encrypted',
      presetEncryptedHint: 'Every pool member in LUKS2, the key from a network key server',
      presetCache: 'Cache tier',
      presetCacheHint: 'Two HDDs for data, an NVMe as the cache tier',
      presetSnapshot: 'Snapshot',
      presetSnapshotHint: 'A snapshot shares blocks with its origin; rewritten data takes new space',
      presetNompath: 'Not joined',
      presetNompathHint: 'Two paths without multipath: the same LUN twice, no pool',
      // controls
      kind: 'Source / transport of the data devices',
      kindLocalHdd: 'Local SATA HDD',
      kindLocalSsd: 'Local SAS/SATA SSD',
      kindLocalNvme: 'Local NVMe namespace',
      kindIscsi: 'iSCSI LUN over Ethernet/IP',
      kindFc: 'Fibre Channel LUN',
      kindNvmetcp: 'NVMe/TCP namespace',
      kindMdraid: 'Existing md RAID device',
      kindLvmlv: 'Existing LVM logical volume',
      kindLuks: 'Existing LUKS device',
      kindMixed: 'Mixed: SSD, iSCSI, FC, NVMe/TCP',
      devices: 'Data devices',
      devSize: 'Device size',
      paths: 'Paths per LUN',
      multipath: 'Multipath',
      down: 'Failed paths',
      encryption: 'Pool encryption',
      encNone: 'None',
      encKeyring: 'LUKS2, key in the kernel',
      encTang: 'LUKS2, network key server',
      encTpm2: 'LUKS2, TPM2 chip',
      overprov: 'Overprovisioning',
      cache: 'Cache tier',
      logical: 'Logical size',
      used: 'Data written',
      snapshot: 'Snapshot',
      written: 'Rewritten after',
      // legend
      legendDevice: 'one device through the layers (colour and number)',
      legendDown: 'failed or not created (dashed, ✕)',
      legendPool: 'the pool and its insides',
      legendFs: 'filesystem and snapshot',
      // counters
      kpiRaw: 'raw capacity the host sees',
      kpiData: 'pool data tier',
      kpiUsed: 'physically used',
      kpiLogical: 'logically promised',
      kpiPaths: 'active network paths',
      none: '—',
      unitGiB: 'GiB',
      unitTiB: 'TiB',
      // the layers
      topoTitle: 'The layers, top to bottom',
      layerSource: 'Storage source',
      layerPath: 'Network / fabric',
      layerBlock: 'Kernel block devices',
      layerMpath: 'Multipath',
      layerCrypt: 'Encryption (Stratis)',
      layerPool: 'Pool (Stratis)',
      layerInternal: 'Inside the pool',
      layerFs: 'Filesystems',
      layerMount: 'Mount points',
      srcDisk: 'physical drive {i}',
      srcArray: 'storage array · LUN {i}',
      srcIscsi: 'iSCSI target · LUN {i}',
      srcNvme: 'NVMe subsystem · NSID {i}',
      srcMd: 'md RAID set {i}',
      srcLv: 'upstream VG/LV {i}',
      srcLuks: 'pre-existing LUKS {i}',
      srcCache: 'NVMe for the cache tier',
      pathIscsi: 'session {i} · NIC{i}',
      pathFc: 'HBA{i} · fabric {i}',
      pathNvmetcp: 'controller path {i} · NIC{i}',
      pathUp: 'up',
      pathDown: '✕ down',
      blockSub: '{kind} · {size}',
      blockPathOf: 'path {i} to LUN {lun}',
      blockDuplicate: '✕ LUN {lun} again',
      blockCache: 'cache tier · {size}',
      mpathSub: '{up}/{n} paths up',
      mpathDownSub: '✕ no path up',
      cryptNode: 'LUKS2 · member {i}',
      poolSub: '{size} data · {enc}',
      poolFailed: '✕ not created',
      poolDown: '✕ lost a member',
      encLabelNone: 'unencrypted',
      encLabelKeyring: 'LUKS2 · kernel key',
      encLabelTang: 'LUKS2 · network key',
      encLabelTpm2: 'LUKS2 · TPM2',
      cacheNode: '{size} cache tier',
      thinNode: 'thin pool · {size} used',
      fsSub: 'XFS · {used} written / {logical} logical',
      fsFailed: '✕ not created',
      snapSub: 'snapshot · shares {shared}, owns {own}',
      offlineSub: '✕ unavailable',
      // capacity
      capTitle: 'Capacity: physical and logical',
      capPhys: 'Physical (data tier {cap})',
      capLogical: 'Logical (what the filesystem promises)',
      capMeta: 'metadata',
      capData: 'data',
      capSnap: 'snapshot only',
      capFree: '{free} free',
      capOver: 'beyond the pool',
      capRatio: 'Logical / physical ratio: {ratio}',
      capPolicyThin: 'thin, may promise more',
      capPolicyFull: 'no overprovisioning',
      // the commands
      cmdTitle: 'Approximate command sequence',
      cmdNote: '# A teaching translation: addresses, device and key names are examples.',
      cmdFailed: '# fails',
      nPaths: ['{n} path', '{n} paths'],
      noteIscsi: '# iSCSI: log in to the target, {paths} → {device}',
      noteFc: '# FC: zoning and LUN masking on the fabric, rescan the HBAs, {paths} → {device}',
      noteNvmetcp: '# NVMe/TCP: connect to the subsystem, {paths} → {device}',
      noteMpath: ' (joined)',
      // caption
      ruleLocal: 'A local disk is already a block device: Stratis takes it as it is.',
      ruleLayered: '{kind} is a block device another layer already built; Stratis only sees the final block device.',
      ruleRemote: '{protocol} is only a transport: the kernel turns the LUN into a block device, and Stratis takes that.',
      ruleMixed: 'Stratis does not care how a device arrived: local and network devices share one pool.',
      mpathOn: 'Multipath joins {paths} of one LUN into {device}.',
      mpathOne: 'One path: if it fails, the device is gone.',
      poolOk: 'Pool {pool}: {cap} on the data tier.',
      poolDup: 'No pool: {device} has {paths} without multipath, so the same LUN shows up as several block devices. Turn on multipath.',
      pathsDownOk: '{down} of {n} paths down: multipath keeps {device} online.',
      pathsDownLost: 'No path to {device} is up: pool {pool} loses a member and its filesystem is unavailable.',
      fsOk: 'Filesystem {fs}: promises {logical}, {used} written.',
      fsNoOver: 'No filesystem: overprovisioning is off, and {logical} is more than the pool\'s {cap}.',
      fsNoSpace: 'No filesystem: {used} of data does not fit in {free} of free physical space.',
      overYes: 'It promises {ratio} the pool\'s capacity: thin provisioning. The pool must grow before the data does.',
      overNo: 'The pool covers everything the filesystem promises.',
      cacheOn: 'The {size} cache tier speeds up reads and writes but adds no capacity.',
      encOn: 'Every pool member is encrypted with LUKS2 below the pool; the key comes from the {source}.',
      encSrcKeyring: 'kernel keyring',
      encSrcTang: 'network key server',
      encSrcTpm2: 'TPM2 chip in the machine',
      snapOn: 'Snapshot {snap} shares {shared} with its origin {fs}; {own} rewritten in the origin since then is kept for the snapshot only.',
      snapCapped: 'Rewrites are limited to the origin\'s data and the pool\'s free space ({requested} → {written}).',
      // the explanation
      explain:
        '<h3>A transport is not storage</h3>' +
        '<p>iSCSI, Fibre Channel and NVMe/TCP only bring remote storage to the machine. The kernel turns a LUN or an NVMe ' +
        'namespace into a [[block device]], and Stratis then manages pools, thin XFS filesystems, snapshots, encryption ' +
        'and a cache tier on top of that.</p>' +
        '<ul>' +
        '<li><b>iSCSI</b>: TCP/IP network → NIC → iSCSI session → SCSI LUN → block device.</li>' +
        '<li><b>Fibre Channel</b>: FC fabric → HBA → SCSI LUN → block device. Zoning and LUN masking are outside Stratis.</li>' +
        '<li><b>NVMe/TCP</b>: TCP/IP network → NIC → NVMe controller connection → namespace block device.</li>' +
        '<li><b>NFS and SMB are different</b>: they bring a remote [[file system]], not a block device, so they cannot be pool members.</li>' +
        '</ul>' +
        '<h3>Many paths, one device</h3>' +
        '<p>When two or more paths lead to the same LUN, each shows up in the kernel as its own block device. ' +
        'Multipath joins them into one device and moves the traffic when a path fails. Without it Stratis would see the ' +
        'same LUN twice, so such a device must not join a pool.</p>' +
        '<h3>Pool, thin filesystem, snapshot</h3>' +
        '<p>A pool is all the space of its data devices together. Inside it is a thin pool (device-mapper), from which ' +
        'the XFS filesystems get blocks only when data is written: thin provisioning. The logical size may therefore ' +
        'exceed the pool, unless overprovisioning is turned off.</p>' +
        '<p>A snapshot is a new filesystem that shares every block with its origin when it is made. Only what is ' +
        'rewritten in the origin afterwards takes new physical space.</p>' +
        '<h3>Encryption and the cache tier</h3>' +
        '<p>An encrypted pool puts every member in LUKS2; the key is in the kernel keyring, or Clevis gets it from a ' +
        'network key server (Tang) or a TPM2 chip. A cache tier on a fast device speeds up access to the data tier but ' +
        'adds no capacity.</p>' +
        '<h3>In the lecture</h3>' +
        '<p>Start with <i>Local</i>, then go to <i>Mixed</i>: the pool is the same. In <i>FC SAN</i> drag ' +
        'the failed paths all the way, then compare with <i>Not joined</i>. Finally raise the data written until ' +
        'physical space runs short.</p>' +
        '<p>The commands are a teaching translation of the model: addresses, names and key thumbprints are examples.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
