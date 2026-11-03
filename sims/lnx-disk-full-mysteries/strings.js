/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-disk-full-mysteries, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   *inode* is not in the glossary yet (NOTES.md, term pairs): written out. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Datotečni sustav na /mnt/vjezba',

      // controls
      scene: 'Scena',
      sceneObrisana: 'obrisana, a otvorena',
      sceneInodi: 'inodei, s čišćenjem',
      sceneKratko: 'inodei, bez čišćenja',
      fstype: 'Vrsta datotečnog sustava',
      optExt4: 'ext4',
      optXfs: 'XFS',
      fileSize: 'Veličina svake datoteke',
      size0: '0 B',
      size1: '1 B',
      size4k: '4 KiB',
      size16k: '16 KiB',
      fileSizeOff: 'Samo u primjerima s mnogo malih datoteka.',
      holdOpen: 'app drži app.log otvorenim',
      holdOpenHint: 'Isključeno: app otvori datoteku za svako pisanje i odmah je zatvori.',
      holdOpenOff: 'Samo u primjeru s obrisanom datotekom.',

      // presets
      presetObrisana: 'Obrisana, a i dalje zauzima',
      presetObrisanaHint: 'rm, a df ostaje na 100 %',
      presetInodi: 'Pun disk na 28 %',
      presetInodiHint: 'datoteke od 1 bajta potroše sve inodee',
      presetPrazne: 'Prazne datoteke',
      presetPrazneHint: 'df -h ostaje na 1 %',
      presetXfs: 'Isto na XFS-u',
      presetXfsHint: 'inodei po potrebi: zid su blokovi',

      // legend
      legendBlocks: 'blokovi (df -h)',
      legendInodes: 'inodei (df -i)',
      legendDeleted: 'otvorena datoteka bez imena',
      legendChanged: 'promijenjeno u ovom koraku',

      // gauges
      gaugeBlocks: 'Blokovi od 4 KiB',
      gaugeInodes: 'Inodei',
      onDemand: 'na zahtjev, najviše {max}',
      fixed: 'broj određen pri stvaranju',
      partNamed: 'datoteke s imenom',
      partHeld: 'bez imena, otvorena',
      partOwn: 'sam datotečni sustav',
      partOwnXfs: 'sam datotečni sustav, s inodeima',
      enospc: 'ovdje je zid',

      // tree
      treeTitle: 'Stablo imena',
      treeDu: 'du ga zbroji',
      files: ['{n} datoteka', '{n} datoteke', '{n} datoteka'],
      removed: 'uklonjeno',
      duTotal: 'ukupno po imenima',
      treeEmpty: 'nema imena',

      // processes
      procTitle: 'Procesi',
      procNone: 'nema otvorenih datoteka',
      fdLabel: 'deskriptor {fd}',
      deletedTag: '(deleted)',
      countZero: 'brojač poveznica 0',
      procRestarted: 'novi proces',

      // tool panel
      toolTitle: 'Naredba ovog koraka',
      toolNone: '(ništa ne ispisuje)',
      appWrite: 'app (PID {pid}) piše {mib} MiB u app.log',
      appFill: 'app (PID {pid}) stvara sess/ i u njemu datoteke od {size}, dok ne padne',
      appStart: 'app (PID {pid}) radi',

      // diagnosis trail
      trailTitle: 'Redoslijed provjere',
      trailNext: 'sljedeće',
      trailSkip: 'ne treba',
      trailFiles: ['{n} datoteka bez imena', '{n} datoteke bez imena', '{n} datoteka bez imena'],
      causeTitle: 'Uzrok',
      causeNone: 'nema greške',
      causeOpen: 'još nepoznat',
      causeInodes: 'nestalo je inodea',
      causeBlocks: 'nestalo je blokova',
      causeDeleted: 'obrisana datoteka koju proces drži otvorenom',

      // captions
      capStartObrisana: '{fs} na /mnt/vjezba: {size}, zauzeto {used}, {pct} %. app (PID {pid}) drži app.log otvorenim za pisanje.',
      capStartObrisanaClosed: '{fs} na /mnt/vjezba: {size}, zauzeto {used}, {pct} %. app za svako pisanje otvori app.log i odmah ga zatvori.',
      capStartInodi: 'Svjež {fs}: zauzeto je {iused} od {inodes} inodea i {used} prostora. app će pisati datoteke od {size}.',
      capStartInodiXfs: 'Svjež XFS: zauzeta su {iused} inodea i {used} prostora. XFS ne zna unaprijed koliko će inodea imati: stvara ih po potrebi.',
      capWrite: 'app je zapisao {mib} MiB u app.log: blokovi su na {pct} %. Inodei se ne miču — i dalje je to jedna datoteka.',
      capWriteXfs: 'app je zapisao {mib} MiB u app.log: blokovi su na {pct} %. IUsed se ne miče — to je i dalje jedna datoteka — ali Inodes u df -i pada sa slobodnim prostorom: XFS inodee broji iz njega.',
      capWriteFull: 'Sljedećih 200 MiB ne stane: pisanje popuni ostatak ({got}) i padne — No space left on device. Blokovi su na 100 %, inodei na {ipct} %.',
      capRmHeld: 'rm uklanja ime: brojač poveznica pada na 0, ali app datoteku još drži otvorenom, pa se ne vraća nijedan blok. df je i dalje na 100 %.',
      capRmFreed: 'rm uklanja ime, brojač poveznica pada na 0 i nijedan je proces ne drži otvorenom: {size} se vraća odmah.',
      capDfDuHeld: 'Ime app.log je nestalo, pa ga du više ne broji — ali app datoteku još drži otvorenom, pa df ne vraća ni bajta. df: {used}, du: {du}.',
      capDfDuAgree: 'df kaže {used}, du {du}: cijelu razliku čini sam datotečni sustav — njegovi blokovi nemaju ime koje bi du našao. Skrivene datoteke nema.',
      capLsofHeld: 'lsof +L1 traži otvorene datoteke kojima je brojač poveznica pao na 0: app (PID {pid}) drži app.log (deleted), {size}.',
      capLsofNone: 'lsof +L1 ne ispisuje ništa: nijedna otvorena datoteka nije ostala bez imena.',
      capRestartFreed: 'app se ponovno pokreće: stari proces zatvara datoteku, nestaje zadnja referenca i {size} se vraća. df: {used}, {pct} %. Novi app otvara novi, prazan app.log.',
      capRestartNone: 'Ponovno pokretanje nema što osloboditi: prostor se vratio već kod rm. df: {used}, {pct} %.',
      capFillInodes: 'app stvara datoteke od {size}: nakon {files} stvaranje sljedeće padne — No space left on device. Svaka datoteka uzima jedan inode i {per}.',
      capFillBlocks: 'app stvara datoteke od {size}: nakon {files} pisanje u zadnju padne — No space left on device. Nestalo je blokova; inodei su na {ipct} %.',
      capFillXfs: 'Na XFS-u datoteke prolaze granicu od 65 524: inodei nastaju po potrebi, po 64 iz slobodnih blokova. Tek nakon {files} nestane blokova i pisanje u zadnju padne — No space left on device.',
      capFillXfsCap: 'Prazne datoteke ne trebaju blokove, ali svaka treba inode: nakon {files} XFS dosegne granicu od 25 % prostora za inodee — No space left on device, a df -h je na {pct} %.',
      capTouchFail: 'I touch javlja: No space left on device. A slobodnih blokova ima još {avail}.',
      capTouchFailBlocks: 'I touch javlja: No space left on device.',
      capTouchOk: 'touch uspijeva: prazna datoteka treba samo inode, a slobodnih ih ima još {ifree}. Pisanje i jednog bajta ne bi uspjelo — blokova nema.',
      capDfhFree: 'df -h: zauzeto {pct} %, slobodno {avail}. Po blokovima disk nije pun — sljedeća provjera je df -i.',
      capDfhFull: 'df -h: 100 %, slobodno 0. Nestalo je blokova — sljedeća provjera je du, da se vidi koja ih imena drže.',
      capDfhOk: 'df -h: zauzeto {pct} %, slobodno {avail}.',
      capDfiInodes: 'df -h kaže {pct} %, a touch javlja „No space left on device“: potrošena su sva {inodes} mjesta za zapise o datotekama, ne blokovi.',
      capDfiXfs: 'df -i kaže {ipct} %, ali IFree nije 0, a Inodes je pao s {max} na {inodes}: XFS broji inodee iz slobodnog prostora. Zid su bili blokovi.',
      capDfiOther: 'df -i: zauzeto {ipct} %, slobodno {ifree}.',
      capRmr: 'rm -r vraća {inodes} inodea i {size}.',

      perBlocks: ['{n} blok od 4 KiB', '{n} bloka od 4 KiB', '{n} blokova od 4 KiB'],

      explain: '<p>Svaka datoteka treba dvije stvari: jedan <em lang="en">inode</em> (zapis o datoteci) i blokove za ' +
        'sadržaj. Prazna datoteka nema blokova, a datoteka od jednog bajta zauzima cijeli blok od 4 KiB. Kad nestane ' +
        'bilo čega od toga, poziv pada s istom porukom, <code>No space left on device</code>.</p>' +
        '<p>Na ext4 broj inodea određen je kad se [[file system]] stvara: ovaj ih ima 65 536, a 11 je zauzeto od ' +
        'početka. Mnogo malih datoteka potroši ih prije blokova: <code>df -h</code> tada kaže 28 %, a ' +
        '<code>df -i</code> 100 %. XFS inodee stvara po potrebi iz slobodnog prostora, pa kod njega obično prvo ' +
        'nestane blokova.</p>' +
        '<p><code>df</code> čita brojače datotečnog sustava, a <code>du</code> zbraja ono što nađe hodajući po ' +
        'imenima. Datoteka koju je <code>rm</code> uklonila, a neki [[process]] je još drži otvorenom, više nema ime ' +
        '— <code>du</code> je ne vidi — ali njezini blokovi ostaju zauzeti dok taj proces ne zatvori zadnji ' +
        '<em lang="en">file descriptor</em> (datotečni deskriptor). Prostor se oslobađa tek kad je [[link count]] ' +
        '0 <strong>i</strong> datoteku više nitko ne drži otvorenom. <code>lsof +L1</code> pokazuje takve ' +
        'datoteke.</p>' +
        '<p>Redoslijed provjere: prvo <code>df -h</code> (koji datotečni sustav, koje mjerilo); ako blokova ima, ' +
        '<code>df -i</code>; ako ih nema, <code>du</code> unutar njega; a ako se <code>df</code> i <code>du</code> ' +
        'ne slažu, <code>lsof +L1</code>. Nijedan alat pritom nije pogriješio.</p>'
    },
    en: {
      stage: 'The filesystem on /mnt/vjezba',

      scene: 'Scene',
      sceneObrisana: 'deleted but open',
      sceneInodi: 'inodes, with clean-up',
      sceneKratko: 'inodes, no clean-up',
      fstype: 'Filesystem type',
      optExt4: 'ext4',
      optXfs: 'XFS',
      fileSize: 'Size of each file',
      size0: '0 B',
      size1: '1 B',
      size4k: '4 KiB',
      size16k: '16 KiB',
      fileSizeOff: 'Only in the presets with many small files.',
      holdOpen: 'app keeps app.log open',
      holdOpenHint: 'Off: app opens the file for each write and closes it at once.',
      holdOpenOff: 'Only in the deleted-file preset.',

      presetObrisana: 'Deleted, yet still using space',
      presetObrisanaHint: 'rm, and df stays at 100%',
      presetInodi: 'Disk full at 28%',
      presetInodiHint: '1-byte files use up every inode',
      presetPrazne: 'Empty files',
      presetPrazneHint: 'df -h stays at 1%',
      presetXfs: 'The same on XFS',
      presetXfsHint: 'inodes on demand: the wall is blocks',

      legendBlocks: 'blocks (df -h)',
      legendInodes: 'inodes (df -i)',
      legendDeleted: 'open file with no name',
      legendChanged: 'changed in this step',

      gaugeBlocks: '4 KiB blocks',
      gaugeInodes: 'Inodes',
      onDemand: 'on demand, at most {max}',
      fixed: 'number fixed when made',
      partNamed: 'files with a name',
      partHeld: 'no name, open',
      partOwn: 'the filesystem itself',
      partOwnXfs: 'the filesystem itself, inodes included',
      enospc: 'the wall is here',

      treeTitle: 'Tree of names',
      treeDu: 'what du adds up',
      files: ['{n} file', '{n} files'],
      removed: 'removed',
      duTotal: 'total by names',
      treeEmpty: 'no names',

      procTitle: 'Processes',
      procNone: 'no open files',
      fdLabel: 'descriptor {fd}',
      deletedTag: '(deleted)',
      countZero: 'link count 0',
      procRestarted: 'new process',

      toolTitle: 'This step\'s command',
      toolNone: '(prints nothing)',
      appWrite: 'app (PID {pid}) writes {mib} MiB to app.log',
      appFill: 'app (PID {pid}) makes sess/ and fills it with files of {size} until one fails',
      appStart: 'app (PID {pid}) is running',

      trailTitle: 'Order of checks',
      trailNext: 'next',
      trailSkip: 'not needed',
      trailFiles: ['{n} file with no name', '{n} files with no name'],
      causeTitle: 'Cause',
      causeNone: 'no error',
      causeOpen: 'not found yet',
      causeInodes: 'out of inodes',
      causeBlocks: 'out of blocks',
      causeDeleted: 'a deleted file a process holds open',

      capStartObrisana: '{fs} on /mnt/vjezba: {size}, {used} used, {pct}%. app (PID {pid}) holds app.log open for writing.',
      capStartObrisanaClosed: '{fs} on /mnt/vjezba: {size}, {used} used, {pct}%. app opens app.log for each write and closes it at once.',
      capStartInodi: 'A fresh {fs}: {iused} of {inodes} inodes used, and {used} of space. app will write files of {size}.',
      capStartInodiXfs: 'A fresh XFS: {iused} inodes used, and {used} of space. XFS does not know in advance how many inodes it will have: it makes them on demand.',
      capWrite: 'app wrote {mib} MiB to app.log: blocks are at {pct}%. The inodes do not move — it is still one file.',
      capWriteXfs: 'app wrote {mib} MiB to app.log: blocks are at {pct}%. IUsed does not move — it is still one file — but df -i\'s Inodes falls with the free space: XFS counts inodes from it.',
      capWriteFull: 'The next 200 MiB do not fit: the write fills the rest ({got}) and fails — No space left on device. Blocks at 100%, inodes at {ipct}%.',
      capRmHeld: 'rm removes the name: the link count falls to 0, but app still holds the file open, so not one block comes back. df is still at 100%.',
      capRmFreed: 'rm removes the name, the link count falls to 0 and no process holds the file open: {size} comes back at once.',
      capDfDuHeld: 'The name app.log is gone, so du no longer counts it — but app still holds the file open, so df gets nothing back. df: {used}, du: {du}.',
      capDfDuAgree: 'df says {used}, du {du}: the whole difference is the filesystem itself — its blocks have no name for du to find. No file is hidden.',
      capLsofHeld: 'lsof +L1 looks for open files whose link count fell to 0: app (PID {pid}) holds app.log (deleted), {size}.',
      capLsofNone: 'lsof +L1 prints nothing: no open file has lost its name.',
      capRestartFreed: 'app restarts: the old process closes the file, the last reference goes and {size} comes back. df: {used}, {pct}%. The new app opens a new, empty app.log.',
      capRestartNone: 'The restart has nothing to free: the space came back at rm already. df: {used}, {pct}%.',
      capFillInodes: 'app makes files of {size}: with {files} made, the next create fails — No space left on device. Each file takes one inode and {per}.',
      capFillBlocks: 'app makes files of {size}: with {files} made, the write to the last one fails — No space left on device. The blocks ran out; inodes are at {ipct}%.',
      capFillXfs: 'On XFS the files go past 65,524: inodes are made on demand, 64 at a time from free blocks. Only with {files} made do the blocks run out, and the write to the last one fails — No space left on device.',
      capFillXfsCap: 'Empty files need no blocks, but each needs an inode: with {files} made, XFS reaches its cap of 25% of the space for inodes — No space left on device, with df -h at {pct}%.',
      capTouchFail: 'touch reports it too: No space left on device. Yet the blocks are not used up: {avail} free.',
      capTouchFailBlocks: 'touch reports it too: No space left on device.',
      capTouchOk: 'touch works: an empty file needs only an inode, and {ifree} are still free. Writing even one byte would fail — there are no blocks.',
      capDfhFree: 'df -h: {pct}% used, {avail} free. By blocks the disk is not full — the next check is df -i.',
      capDfhFull: 'df -h: 100%, 0 free. The blocks are gone — the next check is du, to see which names hold them.',
      capDfhOk: 'df -h: {pct}% used, {avail} free.',
      capDfiInodes: 'df -h says {pct}%, yet touch reports \'No space left on device\': all {inodes} inodes are used, not the blocks.',
      capDfiXfs: 'df -i says {ipct}%, but IFree is not 0, and Inodes fell from {max} to {inodes}: XFS counts inodes from the free space. The wall was the blocks.',
      capDfiOther: 'df -i: {ipct}% used, {ifree} free.',
      capRmr: 'rm -r gives back {inodes} inodes and {size}.',

      perBlocks: ['{n} block of 4 KiB', '{n} blocks of 4 KiB'],

      explain: '<p>Every file needs two things: one <em lang="en">inode</em> and blocks for its content. An empty file has ' +
        'no blocks, and a 1-byte file takes a whole 4 KiB block. When either runs out, the call fails with the same ' +
        'message, <code>No space left on device</code>.</p>' +
        '<p>On ext4 the number of inodes is fixed when the [[file system]] is made: this one has 65,536, 11 of them used ' +
        'from the start. Many small files use them up before the blocks: <code>df -h</code> then says 28% and ' +
        '<code>df -i</code> 100%. XFS makes inodes on demand from free space, so there the blocks usually run out ' +
        'first.</p>' +
        '<p><code>df</code> reads the filesystem\'s counters; <code>du</code> adds up what it finds by walking the names. ' +
        'A file that <code>rm</code> removed while a [[process]] still holds it open has no name any more — ' +
        '<code>du</code> does not see it — but its blocks stay in use until that process closes its last ' +
        '<em lang="en">file descriptor</em>. Space is freed only when the [[link count]] is 0 <strong>and</strong> no ' +
        'one holds the file open. <code>lsof +L1</code> shows such files.</p>' +
        '<p>The order of checks: <code>df -h</code> first (which filesystem, which gauge); if blocks are free, ' +
        '<code>df -i</code>; if not, <code>du</code> inside it; and if <code>df</code> and <code>du</code> disagree, ' +
        '<code>lsof +L1</code>. No tool was wrong.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
