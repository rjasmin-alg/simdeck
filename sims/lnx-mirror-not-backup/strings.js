/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-mirror-not-backup, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. *word* is an English term the page sets in
   italics (<em lang="en">): the Croatian term rule for terms the glossary lacks (NOTES.md, Term pairs). Device and file
   names, commands, /proc/mdstat and cat output are data and come in as placeholders. The title and subtitle come from
   sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Datotečni sustav na /mnt/polje, granica zaštite, polje md0 i diskovi vdb i vdc, a desno /proc/mdstat i cat',

      // layers and boxes
      layerFs: 'datotečni sustav',
      layerDev: 'uređaj',
      boundary: 'granica zaštite: zrcalo govori o uređajima ispod ove crte',
      fsOn: 'ext4 na {dev}',
      fsUnmounted: 'nije montirano: običan prazan direktorij',
      fsNone: 'nema datoteka',
      fsDeleted: 'obrisano',
      fsLost: 'ne čita se: polje je u kvaru',
      backupTitle: 'Drugi stroj',
      backupNote: 'izvan polja',
      backupEmpty: 'prazno',
      backupAt: 'kopija iz koraka {n}',
      bytes: '{n} B',
      pct: '{p} %',
      dec: ',',

      gridTitle: 'Polje',
      gridMeta: 'prvih {n} blokova svakog diska',
      stOptimal: 'optimalno',
      stDegraded: 'oslabjelo',
      stFailed: 'u kvaru',
      stResync: 'usklađuje se',
      stNone: 'još ne postoji',
      dOk: 'u redu',
      dFailed: 'u kvaru',
      dResync: 'usklađuje se',
      dReads: 'čita se odavde',

      // terminal
      cmdTitle: 'Naredba',
      cmdStart: 'početno stanje',
      layerOf: 'sloj: {l}',
      layerNet: 'mreža, drugi stroj',
      layerEvent: 'događaj',
      evCorrupt: 'aplikacija sprema {f} s pogrešnim sadržajem',
      evEncrypt: 'zlonamjerni program šifrira {f} i preimenuje je u {g}',
      evNote: 'zlonamjerni program ostavlja {f}',
      evDie: 'disk {d} prestaje raditi',
      evCopyNote: '{dir} je dijeljeni direktorij na drugom stroju',
      mdUnchanged: 'bez promjene',
      mdChanged: 'promijenjeno',
      exit: 'izlazni status {n}',
      next: 'Sljedeće:',
      nextNone: 'Kraj scenarija.',

      // params, presets
      scene: 'Scenarij',
      showLayers: 'Imena slojeva',
      presetBook: 'Kvar pa brisanje (knjiga)',
      presetBookHint: 'Primjer 3 iz 12. poglavlja: kvar uređaja polje preživi, brisanje prođe kroz njega.',
      presetCorrupt: 'Pogrešan sadržaj',
      presetCorruptHint: 'Aplikacija prepiše datoteku smećem; svaki disk zasebno daje isto smeće.',
      presetRansom: 'Šifriranje datoteka',
      presetRansomHint: 'Zlonamjerni program šifrira datoteke; zrcalo šifrira obje kopije.',
      presetTwo: 'Dva kvara',
      presetTwoHint: 'Prvi disk ispadne, drugi umre: podaci su nedostupni.',
      presetBackup: 'S kopijom izvan polja',
      presetBackupHint: 'Kopija na drugom stroju, uzeta prije brisanja, vraća datoteku.',

      // legend
      legChanged: 'promijenjeno u ovom koraku',
      legMeta: 'metapodaci datotečnog sustava',
      legFile: 'blok datoteke',
      legBad: 'pogrešan sadržaj',
      legFreed: 'oslobođeno, bajtovi ostali',
      legDead: 'disk u kvaru (F)',
      legResync: 'još nije usklađeno',
      legBoundary: 'granica zaštite',

      // captions
      capStartBlank: 'Dva prazna diska od 2 GiB, {b} i {c}. Polja još nema: {mdstat} ne navodi nijedno.',
      capStartHealthy: 'Zdravo zrcalo: {md} od {b} i {c}, ext4 na {mnt}. Datoteke su na oba diska, {box}.',
      capStartBackup: 'Uz datotečni sustav je drugi stroj, izvan polja.',
      capCreate: '{cmd} složio je [[mirroring]] od dva diska, no {mdstat} kaže {resync}: dva diska još nisu ista. Zrcalo nije nešto što polje jest, nego nešto što postane.',
      capResyncDone: 'Usklađivanje je u međuvremenu gotovo, redak s trakom je nestao.',
      capMkfs: '{cmd} upisuje metapodatke kroz {md}, dakle na oba diska.',
      capMount: '{cmd} ne mijenja nijedan blok: datotečni sustav na {md} sada se vidi kao {mnt}, zasad bez datoteka.',
      capTee: '{f} je upisana kroz datotečni sustav. {md} je iste blokove upisao na {n}: metapodatke i dva bloka datoteke.',
      capTeeDegraded: 'Pisanje je stiglo samo na {to}: {skip} je u kvaru i ne prima ništa, pa je njegova kopija sada zastarjela.',
      capMalware: 'Ni to nije iznimka za {md}: pisanje kao svako drugo, upisano na oba diska. Polje je cijelo vrijeme zdravo, {box}.',
      capFail: '{d} je proglašen neispravnim: {F}, {box}, stanje polja je *degraded* (oslabjelo): {state}.',
      capFailReadable: 'Datoteka je i dalje tu: čita se s {from}.',
      capNoop: 'Ništa se ne mijenja.',
      capFailWrong: 'Sad se čita samo s {from}, i on daje isti pogrešni sadržaj. Druga kopija nije starija: zrcalo je prepisalo i nju.',
      capFailLocked: 'Ni preživjeli disk {from} nema čiste kopije: i na njemu su iste šifrirane datoteke {ext}.',
      capFailRefused: '{d} je zadnji član koji radi, pa ga md ne izbacuje.',
      capReadd: '{d} je vraćen u polje: {box}. Dok je bio izvan polja ništa nije upisano, pa nije bilo što prepisati.',
      capReaddCopied: ['{d} je vraćen u polje i usklađen s {src}: prepisan je {n} blok. {box}.', '{d} je vraćen u polje i usklađen s {src}: prepisana su {n} bloka. {box}.', '{d} je vraćen u polje i usklađen s {src}: prepisano je {n} blokova. {box}.'],
      capRm: 'Datoteka je obrisana, a {mdstat} i dalje kaže {box}. Brisanje je pisanje kroz datotečni sustav, i zrcalo ga je uredno upisalo na oba diska.',
      capRmFreed: 'Stari bajtovi su i dalje u blokovima {k}, ali na njih više ništa ne pokazuje.',
      capRmBackup: 'Kopija na drugom stroju nije dirnuta.',
      capCorrupt: 'Aplikacija je spremila {f} s pogrešnim sadržajem. Za {md} je to obično pisanje: oba diska drže isto smeće, a {mdstat} i dalje kaže {box}.',
      capEncrypt: '{f} je šifrirana i preimenovana u {g}. To je pisanje kroz datotečni sustav: zrcalo ga upisuje na oba diska, {box}.',
      capDie: 'Disk {d} je prestao raditi. U polju više nema nijednog ispravnog člana: polje je u kvaru, {box}, a {cat} javlja grešku. {c} ne pomaže: ispao je prije zadnjeg pisanja.',
      capBackup: '{cmd} sprema kopiju na drugi stroj. To je samo čitanje s polja. Ta kopija je [[recovery point]]: stanje kojem se možemo vratiti.',
      capRestore: 'Datoteka je vraćena s drugog stroja. I vraćanje je pisanje kroz datotečni sustav, pa ga zrcalo opet upisuje na oba diska. Datoteku je vratila [[backup]] izvan polja, ne zrcalo.',
      capCatOk: '{cat} ispisuje {out}.',
      capCatGone: '{cat} kaže da datoteke nema, izlazni status 1.',
      both: 'oba diska',

      explain:
        '<p><em lang="en">RAID</em> (redundantno polje diskova) razine 1 je [[mirroring]]: nakon početnog usklađivanja ' +
        'svaki disk drži isti podatak, a svako pisanje ide na sve članove koji rade. Obećanje glasi da polje preživi ' +
        '<em lang="en">device failure</em> (kvar uređaja): kod razine 1 kvar svih članova osim jednoga. Subjekt tog ' +
        'obećanja je uređaj.</p>' +
        '<p>Brisanje, aplikacija koja upiše smeće i zlonamjerni program koji šifrira datoteke nisu kvar uređaja. To su ' +
        'pisanja kroz datotečni sustav, iznad granice zaštite, i polje ih vjerno upisuje na oba diska. ' +
        '<code translate="no">/proc/mdstat</code> pritom kaže <code translate="no">[2/2] [UU]</code>: zdravo polje ne ' +
        'znači da su podaci ispravni.</p>' +
        '<p>Od takvih događaja štiti samo [[backup]] izvan polja, uzeta prije događaja: ona je ' +
        '[[recovery point]] kojoj se možemo vratiti. Razine RAID-a i paritet pokazuje simulator RAID i priručna ' +
        'memorija diska, a vrste kopija simulator Prirasna i diferencijalna kopija.</p>'
    },
    en: {
      stage: 'The filesystem at /mnt/polje, the boundary of protection, the array md0 and the disks vdb and vdc; on the right /proc/mdstat and cat',

      layerFs: 'filesystem',
      layerDev: 'device',
      boundary: 'boundary of protection: the mirror speaks of the devices below this line',
      fsOn: 'ext4 on {dev}',
      fsUnmounted: 'not mounted: a plain empty directory',
      fsNone: 'no files',
      fsDeleted: 'deleted',
      fsLost: 'unreadable: the array has failed',
      backupTitle: 'Second machine',
      backupNote: 'off the array',
      backupEmpty: 'empty',
      backupAt: 'copy from step {n}',
      bytes: '{n} B',
      pct: '{p}%',
      dec: '.',

      gridTitle: 'Array',
      gridMeta: 'first {n} blocks of each disk',
      stOptimal: 'optimal',
      stDegraded: 'degraded',
      stFailed: 'failed',
      stResync: 'resyncing',
      stNone: 'does not exist yet',
      dOk: 'ok',
      dFailed: 'failed',
      dResync: 'resyncing',
      dReads: 'reads come from here',

      cmdTitle: 'Command',
      cmdStart: 'starting state',
      layerOf: 'layer: {l}',
      layerNet: 'network, second machine',
      layerEvent: 'event',
      evCorrupt: 'an application saves {f} with wrong content',
      evEncrypt: 'a malicious program encrypts {f} and renames it {g}',
      evNote: 'the malicious program leaves {f}',
      evDie: 'disk {d} stops working',
      evCopyNote: '{dir} is a shared directory on a second machine',
      mdUnchanged: 'no change',
      mdChanged: 'changed',
      exit: 'exit status {n}',
      next: 'Next:',
      nextNone: 'End of the scenario.',

      scene: 'Scenario',
      showLayers: 'Layer names',
      presetBook: 'A failure, then a delete (book)',
      presetBookHint: 'Example 3 of chapter 12: the array survives a device failure; a delete goes straight through.',
      presetCorrupt: 'Wrong content',
      presetCorruptHint: 'An application overwrites the file with garbage; each disk alone gives the same garbage.',
      presetRansom: 'Files encrypted',
      presetRansomHint: 'A malicious program encrypts the files; the mirror encrypts both copies.',
      presetTwo: 'Two failures',
      presetTwoHint: 'One disk drops out, the other dies: the data is unreachable.',
      presetBackup: 'With a copy off the array',
      presetBackupHint: 'A copy on a second machine, taken before the delete, brings the file back.',

      legChanged: 'changed in this step',
      legMeta: 'filesystem metadata',
      legFile: 'file block',
      legBad: 'wrong content',
      legFreed: 'freed, bytes still there',
      legDead: 'failed disk (F)',
      legResync: 'not yet in sync',
      legBoundary: 'boundary of protection',

      capStartBlank: 'Two empty 2 GiB disks, {b} and {c}. There is no array yet: {mdstat} lists none.',
      capStartHealthy: 'A healthy mirror: {md} from {b} and {c}, ext4 at {mnt}. The files are on both disks, {box}.',
      capStartBackup: 'Beside the filesystem, a second machine off the array.',
      capCreate: '{cmd} built [[mirroring]] from two disks, but {mdstat} says {resync}: the two disks are not the same yet. A mirror is not something the array is, but something it becomes.',
      capResyncDone: 'The resync has finished in the meantime; the progress line is gone.',
      capMkfs: '{cmd} writes its metadata through {md}, so onto both disks.',
      capMount: '{cmd} changes no block: the filesystem on {md} now shows as {mnt}, with no files yet.',
      capTee: '{f} was written through the filesystem. {md} wrote the same blocks to {n}: the metadata and the file\'s two blocks.',
      capTeeDegraded: 'The write reached only {to}: {skip} has failed and takes nothing, so its copy is now stale.',
      capMalware: 'Not an exception for {md} either: a write like any other, written to both disks. The array stays healthy throughout, {box}.',
      capFail: '{d} has been marked faulty: {F}, {box}, the array is degraded ({state}).',
      capFailReadable: 'The file is still there: it is read from {from}.',
      capNoop: 'Nothing changes.',
      capFailWrong: 'Now reads come only from {from}, and it gives the same wrong content. The other copy is not older: the mirror overwrote it too.',
      capFailLocked: 'The surviving disk {from} has no clean copy either: it holds the same encrypted {ext} files.',
      capFailRefused: '{d} is the last working member, so md does not fail it.',
      capReadd: '{d} is back in the array: {box}. Nothing was written while it was out, so there was nothing to copy.',
      capReaddCopied: ['{d} is back in the array and resynced from {src}: {n} block copied. {box}.', '{d} is back in the array and resynced from {src}: {n} blocks copied. {box}.'],
      capRm: 'The file is gone and {mdstat} still says {box}. A delete is a write through the filesystem, and the mirror faithfully wrote it to both disks.',
      capRmFreed: 'The old bytes are still in blocks {k}, but nothing points at them any more.',
      capRmBackup: 'The copy on the second machine is untouched.',
      capCorrupt: 'An application saved {f} with wrong content. To {md} that is an ordinary write: both disks hold the same garbage, and {mdstat} still says {box}.',
      capEncrypt: '{f} was encrypted and renamed {g}. That is a write through the filesystem: the mirror writes it to both disks, {box}.',
      capDie: 'Disk {d} has stopped working. No working member is left: the array has failed, {box}, and {cat} reports an error. {c} is no help: it dropped out before the last write.',
      capBackup: '{cmd} saves a copy on a second machine. For the array that is only a read. That copy is a [[recovery point]]: a state we can go back to.',
      capRestore: 'The file is back from the second machine. A restore is a write through the filesystem too, so the mirror again writes it to both disks. A [[backup]] off the array brought the file back, not the mirror.',
      capCatOk: '{cat} prints {out}.',
      capCatGone: '{cat} says the file does not exist, exit status 1.',
      both: 'both disks',

      explain:
        '<p>RAID level 1 is [[mirroring]]: after the initial resync every disk holds the same data, and every write goes ' +
        'to every working member. The promise is that the array survives a device failure: for level 1, the failure of ' +
        'every member but one. The subject of that promise is the device.</p>' +
        '<p>A delete, an application writing garbage and a malicious program encrypting files are not device failures. ' +
        'They are writes through the filesystem, above the boundary of protection, and the array faithfully writes them ' +
        'to both disks. <code translate="no">/proc/mdstat</code> meanwhile says <code translate="no">[2/2] [UU]</code>: ' +
        'a healthy array does not mean the data is right.</p>' +
        '<p>Only a [[backup]] off the array, taken before the event, protects against those: it is a ' +
        '[[recovery point]] to go back to. RAID levels and parity are in the simulator RAID and disk cache, and kinds of ' +
        'backup in Incremental vs differential backup.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
