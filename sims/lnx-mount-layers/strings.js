/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-mount-layers, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (in captions a node: devices, paths, sizes and UUIDs are data), [[term]] a glossary term
   (first mention; [[=term]] later ones). In captions *word* is an English word in italics and `x` is code.
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Slojevi od diska do staze, korijenski datotečni sustav i df',
      // panel
      scene: 'Primjer',
      fileMiB: 'Veličina datoteke stara.txt',
      fileHint: 'Datoteka koja se kopira u praznu točku montiranja.',
      fileOff: 'U ovom primjeru nema te datoteke.',
      xray: 'Pogled ispod poklopca',
      xrayHint: 'Prikazuje zaklonjene datoteke sivo, s oznakom „skriveno”.',
      fsType: 'Datotečni sustav na /dev/vdb1',
      optExt4: 'ext4',
      optXfs: 'XFS',
      unitMiB: '{n} MiB',
      fsTypeHint: 'Mijenja brojeve koje df prijavljuje; vraća na početak.',
      fsTypeOff: 'U ovom primjeru /dev/vdb1 nosi ext4, kao u knjizi, da se vidi razlika prema XFS-u na /dev/vdb2.',
      pHide: 'Montiranje zaklanja',
      pHideHint: 'Datoteka u točki montiranja, pa mount: nije obrisana, samo skrivena.',
      pLayers: 'Četiri sloja',
      pLayersHint: 'Disk, particija, datotečni sustav, staza: tri koraka.',
      pNopoint: 'Točke montiranja nema',
      pNopointHint: 'mount bez direktorija staje i ništa ne mijenja.',
      pStack: 'Dva montiranja na istoj stazi',
      pStackHint: 'Najnovije je na vrhu; umount skida gornje.',
      // legend
      legDevice: 'uređaj',
      legPart: 'particija',
      legFs: 'datotečni sustav',
      legMp: 'točka montiranja',
      legHidden: 'zaklonjeno',
      legPath: 'kamo vodi staza',
      legChanged: 'promijenjeno',
      // stage: the four layers
      layerMp: 'točka montiranja',
      layerFs: 'datotečni sustav',
      layerPart: 'particija',
      layerDevice: 'blokovni uređaj',
      step1: '1. podjela diska: tablica particija, pa particija',
      step2: '2. stvaranje datotečnog sustava',
      step3: '3. montiranje',
      noTable: 'nema tablice particija',
      tableIs: 'tablica particija:',
      noPart: 'nema particije',
      noFs: 'nema datotečnog sustava',
      notMounted: 'nije montiran',
      underMount: 'ispod {dev}',
      // stage: the trays
      rootTray: 'korijenski datotečni sustav {dev}',
      lidOf: 'datotečni sustav s {dev}',
      noDirs: 'Direktorija /mnt/vjezba još nema.',
      empty: 'prazno',
      covered: 'zaklonjeno',
      hiddenTag: 'skriveno',
      leadsHere: '{path} vodi ovdje',
      // stage: under the scene
      dfNow: 'df -h sada',
      lsNow: 'ls sada',
      before: '(prije prve naredbe)',
      // captions: the start of each preset
      capStart_hide: '{dir} je prazan direktorij na korijenskom datotečnom sustavu i služit će kao [[mount point]]. {dev} nosi {type}, ali ništa još nije montirano.',
      capStart_layers: 'U stroju je drugi disk, [[block device]] {disk} od 2 GiB. Još ne postoji [[partition table]], pa nema ni particija, ni datotečnog sustava, ni staze do njega.',
      capStart_nopoint: '{dev1} je montiran na {dir1}. {dev2} nosi XFS, a direktorija {dir2} još nema.',
      capStart_stack: '{dev1} je montiran na {dir} i zaklanja {file} ({size}) na korijenskom datotečnom sustavu. {dev2} nosi XFS i nije montiran.',
      // captions: one per command
      capLsblk: '`lsblk` vidi disk {disk} od 2G bez ijedne particije: blokovni uređaj postoji, ali na njemu nema ničega.',
      capLsblkParts: '`lsblk` vidi disk {disk} i particije na njemu, s točkama montiranja onih koje su montirane.',
      capParted: 'Na disk je zapisana [[partition table]] vrste gpt, a u njoj particija od 1023M: novi blokovni uređaj {part}. Ništa nije ispisano, a promjena je stvarna. PARTUUID i PARTLABEL oznake su particije.',
      capMkfs: '{cmd} upisao je [[file system]] vrste {type} na {part}. Njegov UUID pripada datotečnom sustavu, ne particiji, i on se upisuje u `/etc/fstab`. Staze do njega još nema.',
      capDfNone: '`df` prikazuje montirane datotečne sustave: {part} nema redak, jer do njega još ne vodi nijedna staza.',
      capDfExt4: '`df`: {part} ima {size}, a particija 1023M. Razliku zauzimaju strukture koje je mkfs upisao: dnevnik i tablice zapisa o datotekama.',
      capDfXfs: '`df`: {part} ima {size}, a particija 1023M, i već je {used} zauzeto na datotečnom sustavu na koji nitko ništa nije zapisao.',
      capDfRoot: '`df -h /` i dalje broji {file}: zauzeto je {used}, kao i nakon kopiranja. Datoteka i dalje zauzima {size}, samo do nje {dir} više ne vodi.',
      capDfT: 'Dvije particije iste veličine, obje prazne: {d1} prijavljuje {s1} i {u1} zauzeto, {d2} {s2} i {u2}. Svjež datotečni sustav nije prazan prostor.',
      capDuFs: '`du` zbraja ono do čega staza vodi sada: korijen datotečnog sustava s {dev}, ukupno {du}. {file} nije pribrojena, iako je `df` za / broji: `df` i `du` ne moraju se slagati.',
      capDuFsOnly: '`du` zbraja ono do čega staza vodi sada: korijen datotečnog sustava s {dev}, ukupno {du}.',
      capDuRoot: '`du` zbraja ono do čega staza vodi: direktorij na korijenskom datotečnom sustavu, ukupno {du}.',
      capMkdir: '`mkdir -p` napravio je direktorij {dir} na korijenskom datotečnom sustavu. [[mount point]] mora postojati prije montiranja.',
      capMkdirSame: 'Direktorij {dir} već postoji; `mkdir -p` ne mijenja ništa.',
      capMountHides: '[[mounting]]: `mount` je prikačio {dev} na {dir}. {file} nije obrisana: i dalje zauzima {size} na korijenskom datotečnom sustavu, ali do nje ta staza više ne vodi.',
      capMount: '[[mounting]]: `mount` je prikačio {dev} na {dir}: ta staza sada vodi u korijen njegova datotečnog sustava.',
      capMountOver: '{dev} je montiran na {dir} preko {under}. Staza vodi u najnoviji; {under} je i dalje montiran, ali do njega ta staza više ne vodi.',
      capMountNoPoint: '`mount` je stao prije ikakve promjene: direktorij {dir} ne postoji, a [[mount point]] mora postojati.',
      capErr: 'Naredba nije uspjela i ništa nije promijenjeno.',
      capUmountBack: '`umount` je otkačio {dev}: {dir} opet vodi u direktorij na korijenskom datotečnom sustavu, a {file} je ondje, nepromijenjena.',
      capUmountEmpty: '`umount` je otkačio {dev}: {dir} opet vodi u direktorij na korijenskom datotečnom sustavu, prazan kao i prije.',
      capUmountTop: '`umount` je otkačio gornji, {dev}: {dir} opet vodi u korijen datotečnog sustava s {under}, koji je cijelo vrijeme bio montiran ispod.',
      capLsRoot: '`ls` čita ono do čega staza vodi sada: direktorij {dir} na korijenskom datotečnom sustavu.',
      capLsFs: '`ls` čita ono do čega staza vodi sada: korijen datotečnog sustava s {dev}.',
      capLsUnder: '{file} je ispod, ali ova staza do nje ne vodi.',
      capLsEmpty: 'Ondje nema ničega.',
      capCpRoot: '`cp` je upisao {file} ({size}) u {dir}. Ništa nije montirano, pa je datoteka na korijenskom datotečnom sustavu: zauzeto je sada {used}.',
      capCpRootRound: '`cp` je upisao {file} ({size}) u {dir}. Ništa nije montirano, pa je datoteka na korijenskom datotečnom sustavu. `df -h` zaokružuje na desetinku GiB, pa zauzeto i dalje piše {used}, ali Use% je narastao na {pcent}.',
      capLsBack: '{file} je opet ovdje, nepromijenjena.',
      capCpFs: '`cp` je upisao {file} ({size}) u {dir}, a ta staza vodi u korijen datotečnog sustava s {dev}: datoteka je ondje.',
      explain: '<p>Između „disk je u stroju” i „na disk se može spremati” stoje četiri sloja i tri koraka. ' +
        'Na [[block device]] <code>/dev/vdb</code> prvo se zapisuje [[partition table]], a u njoj nastaje [[partition]] ' +
        '<code>/dev/vdb1</code>, koja je i sama blokovni uređaj. Na particiju <code>mkfs</code> upisuje [[file system]]. Tek [[mounting]] daje tom ' +
        'datotečnom sustavu stazu: <code>mount</code> ga prikači na direktorij, [[mount point]].</p>' +
        '<p>Oznake pripadaju slojevima: PARTUUID i PARTLABEL particiji, UUID datotečnom sustavu, i upravo UUID ide u ' +
        '<code>/etc/fstab</code>.</p>' +
        '<p>Dok je datotečni sustav montiran, staza točke montiranja vodi u njegov korijen. Ono što je u direktoriju stajalo ' +
        'prije nije obrisano nego nedostupno tom stazom: i dalje zauzima prostor, pa ga <code>df</code> za korijenski ' +
        'datotečni sustav broji, a <code>du</code> preko staze ne vidi. Zato se za točku montiranja pravi prazan direktorij. ' +
        'Dva montiranja na istoj stazi: staza vodi u novije, a <code>umount</code> skida gornje.</p>' +
        '<p>Česte zablude: montiranje briše ili prepisuje sadržaj direktorija (ne briše: <code>umount</code> ga vraća); ' +
        '<code>df</code> prijavljuje veličinu particije (ne: 989M od 1023M, jer mkfs upisuje vlastite strukture); ' +
        '<code>df</code> i <code>du</code> moraju se slagati (ne moraju: jedan pita o datotečnom sustavu, drugi o stazi).</p>'
    },
    en: {
      stage: 'Layers from disk to path, the root filesystem and df',
      // panel
      scene: 'Example',
      fileMiB: 'Size of stara.txt',
      fileHint: 'The file copied into the empty mount point.',
      fileOff: 'This example has no such file.',
      xray: 'Look under the lid',
      xrayHint: 'Draws covered files in grey, marked "hidden".',
      fsType: 'Filesystem on /dev/vdb1',
      optExt4: 'ext4',
      optXfs: 'XFS',
      unitMiB: '{n} MiB',
      fsTypeHint: 'Changes the numbers df reports; goes back to the start.',
      fsTypeOff: 'In this example /dev/vdb1 holds ext4, as in the book, to contrast with XFS on /dev/vdb2.',
      pHide: 'A mount hides',
      pHideHint: 'A file in the mount point, then mount: not deleted, only hidden.',
      pLayers: 'Four layers',
      pLayersHint: 'Disk, partition, filesystem, path: three steps.',
      pNopoint: 'No mount point',
      pNopointHint: 'mount without the directory stops and changes nothing.',
      pStack: 'Two mounts on one path',
      pStackHint: 'The newest is on top; umount removes the top one.',
      // legend
      legDevice: 'device',
      legPart: 'partition',
      legFs: 'filesystem',
      legMp: 'mount point',
      legHidden: 'covered',
      legPath: 'where the path leads',
      legChanged: 'changed',
      // stage: the four layers
      layerMp: 'mount point',
      layerFs: 'filesystem',
      layerPart: 'partition',
      layerDevice: 'block device',
      step1: '1. dividing the disk: partition table, then a partition',
      step2: '2. making the filesystem',
      step3: '3. mounting',
      noTable: 'no partition table',
      tableIs: 'partition table:',
      noPart: 'no partition',
      noFs: 'no filesystem',
      notMounted: 'not mounted',
      underMount: 'under {dev}',
      // stage: the trays
      rootTray: 'root filesystem {dev}',
      lidOf: 'filesystem on {dev}',
      noDirs: 'There is no /mnt/vjezba directory yet.',
      empty: 'empty',
      covered: 'covered',
      hiddenTag: 'hidden',
      leadsHere: '{path} leads here',
      // stage: under the scene
      dfNow: 'df -h now',
      lsNow: 'ls now',
      before: '(before the first command)',
      // captions: the start of each preset
      capStart_hide: '{dir} is an empty directory on the root filesystem and will serve as the [[mount point]]. {dev} holds {type}, but nothing is mounted yet.',
      capStart_layers: 'The machine has a second disk, the [[block device]] {disk} of 2 GiB. No [[partition table]] exists yet, so there are no partitions, no filesystem and no path to one.',
      capStart_nopoint: '{dev1} is mounted on {dir1}. {dev2} holds XFS, and there is no {dir2} directory yet.',
      capStart_stack: '{dev1} is mounted on {dir} and covers {file} ({size}) on the root filesystem. {dev2} holds XFS and is not mounted.',
      // captions: one per command
      capLsblk: '`lsblk` sees the disk {disk} of 2G with no partition: the block device exists, but there is nothing on it.',
      capLsblkParts: '`lsblk` sees the disk {disk} and its partitions, with the mount points of those that are mounted.',
      capParted: 'A [[partition table]] of type gpt is written to the disk, and in it a 1023M partition: a new block device {part}. Nothing is printed, yet the change is real. PARTUUID and PARTLABEL label the partition.',
      capMkfs: '{cmd} wrote a filesystem of type {type} onto {part}. Its UUID belongs to the filesystem, not the partition, and it is what goes into `/etc/fstab`. No path leads to it yet.',
      capDfNone: '`df` shows mounted filesystems: {part} has no row, because no path leads to it yet.',
      capDfExt4: '`df`: {part} has {size}, the partition 1023M. The difference is the structures mkfs wrote: the journal and the tables of file records.',
      capDfXfs: '`df`: {part} has {size}, the partition 1023M, and {used} is already used on a filesystem nobody has written to.',
      capDfRoot: '`df -h /` still counts {file}: used is {used}, as after the copy. The file still takes {size}; only {dir} no longer leads to it.',
      capDfT: 'Two partitions of the same size, both empty: {d1} reports {s1} with {u1} used, {d2} {s2} with {u2}. A fresh filesystem is not empty space.',
      capDuFs: '`du` adds up what the path leads to now: the root of the filesystem on {dev}, {du} in all. {file} is not counted, though `df` for / counts it: `df` and `du` need not agree.',
      capDuFsOnly: '`du` adds up what the path leads to now: the root of the filesystem on {dev}, {du} in all.',
      capDuRoot: '`du` adds up what the path leads to: the directory on the root filesystem, {du} in all.',
      capMkdir: '`mkdir -p` made the directory {dir} on the root filesystem. A [[mount point]] must exist before mounting.',
      capMkdirSame: 'The directory {dir} already exists; `mkdir -p` changes nothing.',
      capMountHides: '`mount` attached {dev} to {dir}. {file} is not deleted: it still takes {size} on the root filesystem, but this path no longer leads to it.',
      capMount: '`mount` attached {dev} to {dir}: that path now leads to the root of its filesystem.',
      capMountOver: '{dev} is mounted on {dir} over {under}. The path leads to the newest; {under} is still mounted, but this path no longer leads to it.',
      capMountNoPoint: '`mount` stopped before changing anything: the directory {dir} does not exist, and a [[mount point]] must.',
      capErr: 'The command failed and nothing changed.',
      capUmountBack: '`umount` detached {dev}: {dir} leads to the directory on the root filesystem again, and {file} is there, unchanged.',
      capUmountEmpty: '`umount` detached {dev}: {dir} leads to the directory on the root filesystem again, empty as before.',
      capUmountTop: '`umount` detached the top one, {dev}: {dir} leads to the root of the filesystem on {under} again, which was mounted underneath all along.',
      capLsRoot: '`ls` reads what the path leads to now: the directory {dir} on the root filesystem.',
      capLsFs: '`ls` reads what the path leads to now: the root of the filesystem on {dev}.',
      capLsUnder: '{file} is underneath, but this path does not lead to it.',
      capLsEmpty: 'There is nothing there.',
      capCpRoot: '`cp` wrote {file} ({size}) into {dir}. Nothing is mounted, so the file is on the root filesystem: used is now {used}.',
      capCpRootRound: '`cp` wrote {file} ({size}) into {dir}. Nothing is mounted, so the file is on the root filesystem. `df -h` rounds to a tenth of a GiB, so used still reads {used}, but Use% has gone up to {pcent}.',
      capLsBack: '{file} is here again, unchanged.',
      capCpFs: '`cp` wrote {file} ({size}) into {dir}, and that path leads to the root of the filesystem on {dev}: the file is there.',
      explain: '<p>Between "the disk is in the machine" and "files can be stored on it" there are four layers and three ' +
        'steps. The [[block device]] <code>/dev/vdb</code> gets a [[partition table]], and in it a [[partition]] ' +
        '<code>/dev/vdb1</code>, itself a block device. <code>mkfs</code> writes a filesystem onto the partition. Only ' +
        '[[mounting]] gives that filesystem a path: <code>mount</code> attaches it to a directory, the [[mount point]].</p>' +
        '<p>Labels belong to layers: PARTUUID and PARTLABEL to the partition, UUID to the filesystem, and the UUID is what ' +
        'goes into <code>/etc/fstab</code>.</p>' +
        '<p>While a filesystem is mounted, the mount point\'s path leads to its root. What the directory held before is not ' +
        'deleted but out of that path\'s reach: it still takes space, so <code>df</code> for the root filesystem counts it, ' +
        'while <code>du</code> over the path does not see it. That is why a mount point is an empty directory made for the ' +
        'purpose. Two mounts on one path: the path leads to the newer, and <code>umount</code> removes the top one.</p>' +
        '<p>Common misconceptions: mounting deletes or overwrites the directory\'s contents (it does not: ' +
        '<code>umount</code> brings them back); <code>df</code> reports the partition\'s size (no: 989M of 1023M, because ' +
        'mkfs writes its own structures); <code>df</code> and <code>du</code> must agree (they need not: one asks about the ' +
        'filesystem, the other about a path).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
