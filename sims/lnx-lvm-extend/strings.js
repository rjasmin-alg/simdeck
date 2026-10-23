/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-lvm-extend, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   *word* in a caption is an English term in a Croatian sentence: the page sets it as <em lang="en">.
   Commands, device names, sizes and tool output are data, not language: the page shows them with translate="no".
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Slojevi od diska do datoteka, s naredbom ovog koraka',
      terminal: 'Naredba i njezin ispis',
      exit: 'izlazni status {n}',
      gridTitle: 'Od diska do datoteka',
      perCol: '1 stupac = {mib} MiB = {ext}',
      peSize: '*extent* = {pe} MiB',
      extents: ['{n} *extent*', '{n} *extenta*', '{n} *extenata*'],
      pvs: ['{n} fizički volumen', '{n} fizička volumena', '{n} fizičkih volumena'],
      disksOver: ['{n} disk', '{n} diska', '{n} diskova'],
      and: ' i ',

      layFs: 'datotečni sustav',
      layLv: 'logički volumen',
      layVg: 'grupa volumena',
      layPv: 'fizički volumen',
      layDisk: 'disk',
      none: 'još ne postoji',
      notPv: 'LVM ga ne koristi',
      noGroup: 'bez grupe',
      notMounted: 'nije montiran',
      changes: 'mijenja:',
      reads: 'čita:',

      legChanged: 'promijenio ga je ovaj korak',
      legRefused: 'traženo, a nije se promijenilo',
      legAsked: 'sloj koji naredba čita',
      legFree: 'slobodan extent',
      legOnVdb: 'extent arhive na /dev/vdb',
      legOnVdc: 'extent arhive na /dev/vdc',
      legFs: 'blokovi datotečnog sustava',
      legGhost: 'prostor koji ovaj sloj ne koristi',

      scene: 'Primjer',
      presetBook: 'Proširenje preko drugog diska',
      presetBookHint: 'Iz knjige: 1500M ne stane; dodaj disk i proširi svaki sloj',
      presetBuild: 'Slaganje slojeva',
      presetBuildHint: 'Od dva prazna diska do montiranog datotečnog sustava',
      presetForgot: 'Zaboravljen datotečni sustav',
      presetForgotHint: 'lvs kaže jedno, df drugo',
      presetFit: 'Hoće li stati?',
      presetFitHint: 'Još 1G ili još 2G: račun u extentima',
      presetExt4: 'ext4 i lvextend -r',
      presetExt4Hint: 'Oba gornja sloja jednom naredbom',
      peMiB: 'Veličina extenta (MiB)',
      disk2GiB: 'Drugi disk, /dev/vdc (GiB)',
      fsType: 'Datotečni sustav',
      fsXfs: 'XFS',
      fsExt4: 'ext4',
      growMiB: 'lvextend -L +… (vrijedi odmah)',

      capStartBook: 'Grupa {vg} ima jedan fizički volumen, {vdb}. Na njoj je logički volumen {lv} od {lsize} ({les}), a na njemu {type} montiran na {mnt}: df kaže {size}. Disk {vdc} stoji u stroju, ali LVM ga ne koristi.',
      capStartBuild: 'Dva prazna diska, {vdb} i {vdc}. Nijedan još nije fizički volumen, pa LVM nema nijedan *extent*.',
      capStartForgot: 'Arhiva je upravo proširena i lvextend je javio uspjeh. Pročitaj slojeve redom, od grupe prema datotekama.',
      capStartFit: 'Ovdje je stao prvi primjer: {lv} ima {lsize} na oba diska. Može li narasti za još 1G? A za 2G? Odgovor se ne pogađa, nego računa u *extentima*.',
      capPv: '{disk} je sada fizički volumen: LVM ga je označio kao svoj.',
      capPvNoVg: 'Nigdje nije dodan prostor: grupa {vg} i dalje ima slobodno {free}, jer {disk} nije u njoj.',
      capPvAlone: 'Još ne pripada nijednoj grupi, pa se njegov prostor nigdje ne broji.',
      capVgCreate: 'Nastala je grupa volumena {vg} s diskom {disk}: {pes} po {pe} MiB, svi slobodni. Nije ih {naive}: prvi *extent* počinje 1 MiB od početka diska, a nepotpuni zadnji se ne broji.',
      capVgExtend: '{disk} je ušao u grupu {vg} i donio {added}, pa je slobodno {free} ({vfree}). Arhiva nije dirnuta: #LV je i dalje 1, a lvs i dalje kaže {lsize}.',
      capLvCreate: 'Nastao je logički volumen {lv}: {size} je {need}, s {disks}, od najnižeg slobodnog nadalje. U grupi je ostalo slobodno {free}.',
      capExtFail: 'lvextend nije uspio ({exit}): +{req} je {need}, a grupa {vg} ima slobodno samo {free}. Ništa se nije promijenilo: {lv} je i dalje {lsize}.',
      capExtOutside: '{disk} jest fizički volumen, ali nije u grupi, pa se ne broji.',
      capExtRaw: 'Disk {disk} stoji u stroju, ali dok nije u grupi, ne broji se.',
      capExtThird: 'Grupi treba treći disk.',
      capRounded: '+{req} nije cijeli broj *extenata* od {pe} MiB, pa je zaokruženo naviše.',
      capExtOk: 'lvextend je uzeo {need} ({split}): {lv} sada ima {to} ({lsize}), prije {from}.',
      capSplitPart: '{n} s {disk}',
      capExtOrder: 'Prvo se troši {first}, prvi u grupi, od najnižeg broja, pa tek onda {second}.',
      capExtFsSame: 'Datotečni sustav nije dirnut.',
      capExtR: 'Uz -r je odmah narastao i datotečni sustav ({from} → {to} blokova po 4 KiB): nema df-a između koji bi pokazao staru veličinu.',
      capDfShort: 'lvextend je povećao logički volumen na {to}, ali df i dalje kaže {size}: datotečni sustav zna samo za blokove koje mu je upisao {mkfs}.',
      capDfAsk: 'lvs kaže {lsize}, a df kaže {size}. Obje su naredbe u pravu. Koji od četiri sloja mjeri df?',
      capDf: 'df mjeri datotečni sustav: {size} veličine, {used} zauzeto, {avail} slobodno.',
      capDfFresh: 'Datoteka još nema, a {used} je već zauzeto: to su strukture koje je mkfs izgradio.',
      capDfGrown: 'Tek sada df vidi novi prostor: logički volumen i datotečni sustav opet su jednako veliki.',
      capGrow: '{tool} je datotečnom sustavu dao nove blokove: {from} → {to} po 4 KiB, koliko stane u logički volumen ({mib} MiB). Cijelo je vrijeme bio montiran na {mnt}, pa su datoteke bile dostupne.',
      capGrowAnswer: 'df mjeri gornji sloj, datotečni sustav.',
      capGrowSame: '{tool}: datotečni sustav već pokriva cijeli logički volumen, nema kamo rasti.',
      capCmdFail: 'Naredba nije uspjela ({exit}). Ništa se nije promijenilo.',
      capMkfs: '{tool} je upisao datotečni sustav na {lv}: {blocks} blokova po 4 KiB, cijeli logički volumen. Taj broj blokova datotečni sustav odsad pamti sam.',
      capMount: 'Datotečni sustav je montiran na {mnt}: tek sada ga df može izmjeriti.',
      capPvs: 'pvs po disku: {list}.',
      capPvsPart: '{disk} slobodno {pfree} ({free})',
      capPvsFull: '{disk} bez slobodnog prostora',
      capPvsSpread: 'Arhiva se prostrla preko dva diska: logički volumen ne mora stati na jedan uređaj.',
      capVgs: 'vgs: grupa {vg} ima {pv} i slobodno {free} ({vfree}).',
      capRestore: 'Natrag na kraj prvog primjera, isto stanje kao na početku.',
      capLvs: 'lvs: {lv} ima {lsize}, odnosno {les}.',

      explain:
        '<p>Između diska i datoteka stoje četiri sloja, i svaki ima naredbu koja ga mijenja i naredbu koja ga čita. ' +
        'Prvi je [[physical volume]]: disk koji je LVM, [[Logical Volume Manager]], označio kao svoj ' +
        '(<code>pvcreate</code>; čita ga <code>pvs</code>). Drugi je [[volume group]], koja okuplja fizičke volumene i drži ' +
        'slobodan prostor (<code>vgcreate</code>, <code>vgextend</code>; <code>vgs</code>). Treći je [[logical volume]], ' +
        'koji prostor uzima samo iz svoje grupe (<code>lvcreate</code>, <code>lvextend</code>; <code>lvs</code>). Na vrhu ' +
        'je datotečni sustav, koji broji svoje blokove (<code>mkfs</code>, <code>xfs_growfs</code> ili ' +
        '<code>resize2fs</code>; <code>df</code>).</p>' +
        '<p>LVM sve broji u jedinici koja se zove <em lang="en">extent</em>; zadano je 4 MiB. Prvi počinje 1 MiB od početka diska, a ' +
        'nepotpuni zadnji se ne broji, pa disk od 2 GiB ima 511 <em lang="en">extenata</em>, ne 512. Veličina zadana u MiB ' +
        'zaokružuje se naviše na cijele <em lang="en">extente</em>.</p>' +
        '<p>Proširenje ide odozdo prema gore, sloj po sloj. Novi disk postaje fizički volumen, ali to još nigdje ne dodaje ' +
        'prostor. Kad uđe u grupu, grupa naraste, a logički volumen ne. <code>lvextend</code> uzima slobodne ' +
        '<em lang="en">extente</em>: prvo s prvog diska u grupi, od najnižeg broja. Tek nakon <code>xfs_growfs</code> ' +
        'datotečni sustav zna za nove blokove; do tada <code>df</code> pokazuje staru veličinu, jer mjeri datotečni sustav, ' +
        'a ne volumen ispod njega. Sve to radi dok je datotečni sustav montiran.</p>' +
        '<p>XFS se može samo povećati. ext4 se povećava i montiran (<code>resize2fs</code>), a smanjuje se samo odmontiran. ' +
        '<code>lvextend -r</code> radi oba gornja koraka jednom naredbom.</p>'
    },
    en: {
      stage: 'The layers from disk to files, with this step\'s command',
      terminal: 'The command and its output',
      exit: 'exit status {n}',
      gridTitle: 'From disk to files',
      perCol: '1 column = {mib} MiB = {ext}',
      peSize: 'extent = {pe} MiB',
      extents: ['{n} extent', '{n} extents'],
      pvs: ['{n} physical volume', '{n} physical volumes'],
      disksOver: ['{n} disk', '{n} disks'],
      and: ' and ',

      layFs: 'filesystem',
      layLv: 'logical volume',
      layVg: 'volume group',
      layPv: 'physical volume',
      layDisk: 'disk',
      none: 'does not exist yet',
      notPv: 'not used by LVM',
      noGroup: 'in no group',
      notMounted: 'not mounted',
      changes: 'changes:',
      reads: 'reads:',

      legChanged: 'changed by this step',
      legRefused: 'asked for, but did not change',
      legAsked: 'the layer the command reads',
      legFree: 'free extent',
      legOnVdb: 'extent of the archive on /dev/vdb',
      legOnVdc: 'extent of the archive on /dev/vdc',
      legFs: 'filesystem blocks',
      legGhost: 'space this layer does not use',

      scene: 'Example',
      presetBook: 'Extending onto a second disk',
      presetBookHint: 'From the book: 1500M does not fit; add a disk and extend each layer',
      presetBuild: 'Building the layers',
      presetBuildHint: 'From two empty disks to a mounted filesystem',
      presetForgot: 'The forgotten filesystem',
      presetForgotHint: 'lvs says one thing, df another',
      presetFit: 'Will it fit?',
      presetFitHint: 'Another 1G or another 2G: count it in extents',
      presetExt4: 'ext4 and lvextend -r',
      presetExt4Hint: 'Both top layers in one command',
      peMiB: 'Extent size (MiB)',
      disk2GiB: 'Second disk, /dev/vdc (GiB)',
      fsType: 'Filesystem',
      fsXfs: 'XFS',
      fsExt4: 'ext4',
      growMiB: 'lvextend -L +… (applies at once)',

      capStartBook: 'Group {vg} has one physical volume, {vdb}. On it sits logical volume {lv}, {lsize} ({les}), and on that {type}, mounted on {mnt}: df says {size}. Disk {vdc} is in the machine, but LVM does not use it.',
      capStartBuild: 'Two empty disks, {vdb} and {vdc}. Neither is a physical volume yet, so LVM has not a single extent.',
      capStartForgot: 'The archive was just extended, and lvextend reported success. Read the layers in order, from the group up to the files.',
      capStartFit: 'Where the first example stopped: {lv} is {lsize}, on both disks. Can it grow by another 1G? By 2G? The answer is not a guess: count it in extents.',
      capPv: '{disk} is a physical volume now: LVM has marked it as its own.',
      capPvNoVg: 'No space was added anywhere: group {vg} still has {free} free, because {disk} is not in it.',
      capPvAlone: 'It belongs to no group yet, so its space counts nowhere.',
      capVgCreate: 'Volume group {vg} now exists, with disk {disk}: {pes} of {pe} MiB, all free. Not {naive}: the first extent starts 1 MiB into the disk, and a partial last one does not count.',
      capVgExtend: '{disk} joined group {vg} and brought {added}, so {free} are free ({vfree}). The archive was not touched: #LV is still 1, and lvs still says {lsize}.',
      capLvCreate: 'Logical volume {lv} now exists: {size} is {need}, taken from {disks} from the lowest free one up. {free} are left free in the group.',
      capExtFail: 'lvextend failed ({exit}): +{req} is {need}, and group {vg} has only {free} free. Nothing changed: {lv} is still {lsize}.',
      capExtOutside: '{disk} is a physical volume, but not in the group, so it does not count.',
      capExtRaw: 'Disk {disk} is in the machine, but until it is in the group it does not count.',
      capExtThird: 'The group needs a third disk.',
      capRounded: '+{req} is not a whole number of {pe} MiB extents, so it was rounded up.',
      capExtOk: 'lvextend took {need} ({split}): {lv} now has {to} ({lsize}), up from {from}.',
      capSplitPart: '{n} from {disk}',
      capExtOrder: '{first}, first in the group, is used up first, lowest number first, and only then {second}.',
      capExtFsSame: 'The filesystem was not touched.',
      capExtR: 'With -r the filesystem grew too, at once ({from} → {to} blocks of 4 KiB): there is no df in between to show the old size.',
      capDfShort: 'lvextend grew the logical volume to {to}, but df still says {size}: the filesystem only knows the blocks {mkfs} gave it.',
      capDfAsk: 'lvs says {lsize}, and df says {size}. Both commands are right. Which of the four layers does df measure?',
      capDf: 'df measures the filesystem: {size} in size, {used} used, {avail} available.',
      capDfFresh: 'There are no files yet, and {used} is already used: the structures mkfs built.',
      capDfGrown: 'Only now does df see the new space: the logical volume and the filesystem are the same size again.',
      capGrow: '{tool} gave the filesystem the new blocks: {from} → {to} of 4 KiB, as many as fit in the logical volume ({mib} MiB). It stayed mounted on {mnt} the whole time, so the files were reachable.',
      capGrowAnswer: 'df measures the top layer, the filesystem.',
      capGrowSame: '{tool}: the filesystem already covers the whole logical volume; there is nowhere to grow.',
      capCmdFail: 'The command failed ({exit}). Nothing changed.',
      capMkfs: '{tool} wrote a filesystem onto {lv}: {blocks} blocks of 4 KiB, the whole logical volume. From now on the filesystem keeps that number of blocks itself.',
      capMount: 'The filesystem is mounted on {mnt}: only now can df measure it.',
      capPvs: 'pvs, per disk: {list}.',
      capPvsPart: '{disk} {pfree} free ({free})',
      capPvsFull: '{disk} with no free space',
      capPvsSpread: 'The archive spreads over two disks: a logical volume need not fit on one device.',
      capVgs: 'vgs: group {vg} has {pv} and {free} free ({vfree}).',
      capRestore: 'Back to where the first example stopped, the same state as at the start.',
      capLvs: 'lvs: {lv} is {lsize}, that is {les}.',

      explain:
        '<p>Between the disk and the files stand four layers, and each has a command that changes it and a command that ' +
        'reads it. LVM, the [[Logical Volume Manager]], makes a disk a [[physical volume]] (<code>pvcreate</code>, read by ' +
        '<code>pvs</code>). A [[volume group]] gathers physical volumes and holds the free space (<code>vgcreate</code>, ' +
        '<code>vgextend</code>; <code>vgs</code>). A [[logical volume]] takes space only from its own group ' +
        '(<code>lvcreate</code>, <code>lvextend</code>; <code>lvs</code>). On it sits the filesystem, which counts its own ' +
        'blocks (<code>mkfs</code>, <code>xfs_growfs</code> or <code>resize2fs</code>; <code>df</code>).</p>' +
        '<p>LVM counts everything in a unit called an [[extent]]; the default is 4 MiB. The first one starts 1 MiB into ' +
        'the disk and a partial last one does not count, so a 2 GiB disk holds 511 extents, not 512. A size given in MiB ' +
        'is rounded up to whole extents.</p>' +
        '<p>An extension goes from the bottom up, one layer at a time. A new disk becomes a physical volume, which adds no ' +
        'space anywhere yet. Once it joins the group, the group grows and the logical volume does not. ' +
        '<code>lvextend</code> takes free extents: from the first disk in the group first, lowest number first. Only after ' +
        '<code>xfs_growfs</code> does the filesystem know the new blocks; until then <code>df</code> shows the old size, ' +
        'because it measures the filesystem, not the volume under it. All of this works while the filesystem is mounted.</p>' +
        '<p>XFS can only grow. ext4 grows while mounted too (<code>resize2fs</code>), and shrinks only unmounted. ' +
        '<code>lvextend -r</code> does both top steps in one command.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
