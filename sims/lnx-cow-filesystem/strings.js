/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-cow-filesystem, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term the page sets in italics (<em lang="en">): the
   Croatian term rule for terms the glossary lacks (NOTES.md, Term pairs). Tree names, block ids and labels are data
   and come in as placeholders. The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Bazen blokova i stabla koja pokazuju u njega',
      gridTitle: 'Bazen',
      poolOf: ['{n} blok', '{n} bloka', '{n} blokova'],
      fileOf: ['datoteka {f}: {n} blok', 'datoteka {f}: {n} bloka', 'datoteka {f}: {n} blokova'],
      count: 'zauzeto {used} od {total}',
      poolRow: 'bazen',
      roleLive: 'živo stablo',
      roleSnap: 'snimka, samo za čitanje',
      roleGone: 'uništena',
      roleNoFile: 'bez datoteka',
      thTree: 'Stablo',
      thRef: 'referencirano',
      thExcl: 'isključivo',
      thPool: 'Bazen',
      thUsed: 'zauzeto',
      thFree: 'slobodno',
      thShared: 'dijeljeno',

      scene: 'Scenarij',
      fileBlocks: 'Blokova u datoteci a',
      poolSize: 'Blokova u bazenu',
      showRefs: 'Brojač referenci (×n)',

      presetBasic: 'Snimka pa pisanje',
      presetBasicHint: 'Snimka ne zauzme ništa; pisanje nakon nje zauzme nove blokove.',
      presetDelete: 'Brisanje ne oslobađa',
      presetDeleteHint: 'rm a uz snimku: zauzeto ostaje 8.',
      presetMiddle: 'Dvije snimke',
      presetMiddleHint: 'Uništena snimka oslobađa samo svoje blokove.',
      presetFull: 'Pun bazen',
      presetFullHint: 'Bazen od 10: pisanje ne uspije, rm a oslobodi samo 2.',

      legChanged: 'novo ili pomaknuto',
      legRefs: 'nov broj referenci',
      legShared: 'dijeljen (×n stabala)',
      legOwned: 'samo jednog stabla',
      legFree: 'slobodan',
      legFreed: 'upravo oslobođen',
      legMoved: 'pomaknut pokazivač',

      termSnap: '*snapshot* (snimka)',
      termSnapLater: '*snapshot*',
      termCow: '*copy-on-write* (kopiranje pri pisanju)',
      termCowLater: '*copy-on-write*',

      capStart: 'Prazan bazen od {pool}. Živo stablo {live} još nema datoteka. Pritisni → za prvi korak.',
      capCreate: 'Upisuje se datoteka {f} u stablo {live}: {n}, svaki u svoj slobodni blok bazena ({list}). Svaki blok ima jednu referencu.',
      capSnapFirst: 'Uzima se {snap} {name}. Nije zauzeo nijedan blok: kopirao je samo pokazivače. Sad blokove {list} dijele {trees}.',
      capSnapLater: 'Uzima se {snap} {name}. Ni on nije zauzeo nijedan blok: kopirao je samo pokazivače, pa je svaki od {n} na koje pokazuje stablo {live} dobio još jednu referencu.',
      trees: ['{n} stablo', '{n} stabla', '{n} stabala'],
      blocksOf: ['{n} bloka', '{n} bloka', '{n} blokova'],
      capWriteHead: ['Piše se blok {list} datoteke {f}.', 'Pišu se blokovi {list} datoteke {f}.', 'Pišu se blokovi {list} datoteke {f}.'],
      capWriteCow: ['Uz {cow} stari se podaci ne prepisuju: novi idu u slobodni blok {new}, a pomiče se samo pokazivač stabla {live}.',
        'Uz {cow} stari se podaci ne prepisuju: novi idu u slobodne blokove {new}, a pomiču se samo pokazivači stabla {live}.',
        'Uz {cow} stari se podaci ne prepisuju: novi idu u slobodne blokove {new}, a pomiču se samo pokazivači stabla {live}.'],
      capKept: ['Stari blok {list} ostaje: na njega i dalje pokazuje {holders}.', 'Stari blokovi {list} ostaju: na njih i dalje pokazuje {holders}.',
        'Stari blokovi {list} ostaju: na njih i dalje pokazuje {holders}.'],
      capKeptMany: ['Stari blok {list} ostaje: na njega i dalje pokazuju {holders}.', 'Stari blokovi {list} ostaju: na njih i dalje pokazuju {holders}.',
        'Stari blokovi {list} ostaju: na njih i dalje pokazuju {holders}.'],
      capFreedOld: ['Stari blok {list} više nikome ne treba, pa se oslobađa tek nakon upisa novoga.',
        'Stari blokovi {list} više nikome ne trebaju, pa se oslobađaju tek nakon upisa novih.',
        'Stari blokovi {list} više nikome ne trebaju, pa se oslobađaju tek nakon upisa novih.'],
      capCost: 'Sad {snap} {name} sam drži {n}: toliko ga stvarno košta.',
      capErrHead: ['Pisanje bloka {list} ne uspijeva: {msg}.', 'Pisanje blokova {list} ne uspijeva: {msg}.', 'Pisanje blokova {list} ne uspijeva: {msg}.'],
      capErrSpace: 'U bazenu je slobodno {free}, a pisanje treba {need}: novi podaci uvijek idu u novi blok.',
      capErrShared: 'Stari blok se ne smije prepisati dok na njega pokazuje {snap}.',
      capErrOwn: 'Stari blok oslobodio bi se tek nakon upisa novoga.',
      capErrNothing: 'Nijedan se pokazivač nije pomaknuo, iako datoteka ne bi narasla ni za blok.',
      capRm: 'Briše se datoteka {f} iz stabla {live}: nestaju samo njezini pokazivači.',
      capRmNone: ['Nijedan blok nije oslobođen: na sve još pokazuje {snap} {names}.', 'Nijedan blok nije oslobođen: na sve još pokazuju {snap} {names}.',
        'Nijedan blok nije oslobođen: na sve još pokazuju {snap} {names}.'],
      capRmSome: 'Oslobađa se samo ono na što nijedan {snap} ne pokazuje: {n} ({list}).',
      capRmAll: 'Nijedan {snap} ne drži te blokove, pa se oslobađa svih {n} ({list}).',
      capRmBarely: 'Dok {snap} postoji, brisanje datoteka jedva oslobađa mjesto.',
      capDestroy: 'Uništava se {snap} {name}. Oslobađaju se točno blokovi koje je držao sam: {n} ({list}).',
      capDestroyNone: 'Uništava se {snap} {name}. Nije sam držao nijedan blok, pa se ništa ne oslobađa.',
      capDestroyKept: ['Ostaju blokovi koje je dijelio sa stablom {holders}.', 'Ostaju blokovi koje je dijelio sa stablima {holders}.', 'Ostaju blokovi koje je dijelio sa stablima {holders}.'],
      capUsed: 'Zauzeto: {used} od {total}.',
      enospc: 'No space left on device',
      and: ' i ',

      // ── preset win-vss (copy-on-write mode: shadow copies, the diff area, Previous Versions) ──
      subtitleCow: 'Sjenovite kopije: stari blok se prvo kopira, a novi podaci idu na isto mjesto',
      presetPrev: 'Prethodne verzije',
      presetPrevHint: 'Sjena S1, izmjena, pa vraćanje iz S1: stari blokovi čekaju u diferencijalnom području.',
      presetGrowth: 'Rast područja',
      presetGrowthHint: 'Izmjene nakon jedne sjene: područje raste za promijenjene blokove, ne za cijeli svezak.',
      presetDiffFull: 'Puno područje',
      presetDiffFullHint: 'Područje od 4 bloka: najstarija sjena se briše i njezina verzija nestaje.',
      diffLimit: 'Diferencijalno područje (blokova)',

      gridTitleCow: 'Svezak',
      diffOf: ['diferencijalno područje: najviše {n} blok', 'diferencijalno područje: najviše {n} bloka', 'diferencijalno područje: najviše {n} blokova'],
      volRow: 'svezak',
      diffRow: 'dif. područje',
      roleVol: 'živi podaci',
      roleDiff: 'stari blokovi',
      roleShadow: '{time} · samo za čitanje',
      roleDropped: 'obrisana',
      thVersions: 'Prethodne verzije',
      thTaken: 'snimljena',
      thInDiff: 'u području',
      thState: 'stanje',
      stOk: 'dostupna',
      stDropped: 'obrisana',
      meterDiff: 'Diferencijalno područje',
      meterText: '{used} od {total}',

      legChangedCow: 'kopirano, prepisano ili vraćeno',
      legSharedCow: 'dijeljen (×n)',
      legLive: 'samo na svesku',
      legCopy: 'kopija jedne sjene (njezina boja)',
      legMovedCow: 'kopiranje ili vraćanje',

      termShadow: '*shadow copy* (sjenovita kopija)',
      termShadowLater: '*shadow copy*',

      capStartCow: 'Svezak od {pool} i prazno diferencijalno područje od najviše {diff}. Pritisni → za prvi korak.',
      capCreateCow: 'U {time} na svezak se upisuje datoteka {f}: {n} ({list}).',
      capShadow: 'U {time} uzima se {shadow} {name}. Ne kopira se nijedan blok: {name} pamti svezak u tom trenutku i zasad dijeli svih {n} sa živim podacima.',
      capCowHead: ['U {time} piše se blok {list} datoteke {f}.', 'U {time} pišu se blokovi {list} datoteke {f}.', 'U {time} pišu se blokovi {list} datoteke {f}.'],
      capCowCopy: ['Pri prvoj izmjeni nakon sjene stari se blok kopira u diferencijalno područje ({to}), pa se original prepiše.',
        'Pri prvoj izmjeni nakon sjene stari se blokovi kopiraju u diferencijalno područje ({to}), pa se originali prepišu.',
        'Pri prvoj izmjeni nakon sjene stari se blokovi kopiraju u diferencijalno područje ({to}), pa se originali prepišu.'],
      capCowWho: ['Sjena {names} od sad stare podatke čita odande.', 'Sjene {names} od sad stare podatke čitaju odande.', 'Sjene {names} od sad stare podatke čitaju odande.'],
      capCowKept: ['Blok {list} već je sačuvan u području, pa se samo prepiše na mjestu.', 'Blokovi {list} već su sačuvani u području, pa se samo prepišu na mjestu.',
        'Blokovi {list} već su sačuvani u području, pa se samo prepišu na mjestu.'],
      capCowFree: ['Blok {list} ne dijeli nijedna sjena, pa se prepiše na mjestu.', 'Blokove {list} ne dijeli nijedna sjena, pa se prepišu na mjestu.',
        'Blokove {list} ne dijeli nijedna sjena, pa se prepišu na mjestu.'],
      capDrop: ['Diferencijalno područje je puno, pa se prvo briše najstarija sjena {names} i njezina prethodna verzija nestaje.',
        'Diferencijalno područje je puno, pa se prvo brišu najstarije sjene {names} i njihove prethodne verzije nestaju.',
        'Diferencijalno područje je puno, pa se prvo brišu najstarije sjene {names} i njihove prethodne verzije nestaju.'],
      capDropFreed: ['Oslobađa se {n} koji nijedna druga sjena ne treba ({list}).', 'Oslobađaju se {n} koje nijedna druga sjena ne treba ({list}).',
        'Oslobađa se {n} koje nijedna druga sjena ne treba ({list}).'],
      capDiffNow: 'Diferencijalno područje: {used} od {total}; na svesku je i dalje zauzeto {vol}.',
      capRestorePick: 'U {time} traži se verzija datoteke {f} od prije {before}: najnovija takva sjena je {name}.',
      capRestore: 'Vraćanje iz sjene {name}: datoteka se vraća na sadržaj od {taken}.',
      capRestoreBlocks: ['Blok {list} prepisuje se na mjestu kopijom iz područja.', 'Blokovi {list} prepisuju se na mjestu kopijama iz područja.',
        'Blokovi {list} prepisuju se na mjestu kopijama iz područja.'],
      capRestoreCopy: ['Prije toga se trenutni sadržaj kopira za sjenu {names}, pa se i zamijenjena verzija može vratiti.',
        'Prije toga se trenutni sadržaj kopira za sjene {names}, pa se i zamijenjena verzija može vratiti.',
        'Prije toga se trenutni sadržaj kopira za sjene {names}, pa se i zamijenjena verzija može vratiti.'],
      capRestoreSame: 'Datoteka se ne razlikuje od te verzije, pa se ništa ne piše.',
      capRestoreNone: 'U {time} traži se verzija datoteke {f} od prije {before}, ali nijedna preostala sjena nije toliko stara. Ništa se ne mijenja.',
      capRestoreLost: ['Imala ju je sjena {names}, obrisana kad se područje napunilo: prethodne verzije nisu sigurnosna kopija.',
        'Imale su je sjene {names}, obrisane kad se područje napunilo: prethodne verzije nisu sigurnosna kopija.',
        'Imale su je sjene {names}, obrisane kad se područje napunilo: prethodne verzije nisu sigurnosna kopija.'],

      explainCow: '<p>Windowsov <em lang="en">Volume Shadow Copy</em> radi drugačije od Btrfsa i ZFS-a: živi podaci ' +
        'ostaju na svom mjestu. <em lang="en">Shadow copy</em> (sjenovita kopija) pamti svezak u jednom trenutku, ali ' +
        'ne kopira ništa dok se blok ne promijeni. Pri prvoj izmjeni bloka nakon sjene stari se blok prvo kopira u ' +
        '<b>diferencijalno područje</b>, pa se original prepiše na mjestu (<em lang="en">copy-on-write</em>). Sljedeće ' +
        'izmjene istog bloka više ne kopiraju ništa.</p>' +
        '<p>Područje zato raste s brojem promijenjenih blokova, a ne s veličinom sveska. Ima gornju granicu; kad se ' +
        'napuni, brišu se najstarije sjene. Kartica <em lang="en">Previous Versions</em> (prethodne verzije) nudi ' +
        'datoteku iz svake preostale sjene; vraćanje prepiše živu datoteku starim sadržajem, a i to je obično pisanje.</p>' +
        '<p>Tri zablude: sjena je puna druga kopija (čuva samo promijenjene blokove); prethodne verzije su sigurnosna ' +
        'kopija (sjene su po zadanom na istom svesku, pa ne prežive njegov gubitak ni napadača koji ih obriše); ' +
        '<em lang="en">copy-on-write</em> i preusmjeravanje pri pisanju su isto (ovdje se kopira stari blok, a u ' +
        'primjerima s bazenom novi podaci idu u novi blok).</p>' +
        '<p>Izvan ovog prikaza: pisci i tražitelji (<em lang="en">writers</em>, <em lang="en">requesters</em>) i ' +
        'umirivanje aplikacija, raspored snimanja i područje na drugom svesku.</p>',

      explain: '<p>U datotečnom sustavu s <em lang="en">copy-on-write</em> (kopiranje pri pisanju), kakvi su Btrfs i ZFS, ' +
        'datoteka je popis pokazivača na blokove u bazenu. Stablo <span translate="no">podaci</span> je živi ' +
        '<em lang="en">subvolume</em> (podvolumen) u Btrfsu, odnosno <em lang="en">dataset</em> (skup podataka) u ZFS-u.</p>' +
        '<p><em lang="en">Snapshot</em> (snimka) kopira pokazivače, a ne podatke: ne zauzme nijedan blok. Ovdje svaki blok ' +
        'ima <em lang="en">reference count</em> (brojač referenci), broj stabala koja na njega pokazuju; Btrfs i ZFS to ' +
        'vode na svoj način (Btrfs preko dijeljenih stabala metapodataka, ZFS po vremenu nastanka bloka), ali račun ' +
        'prostora ispada isti. Pisanje nikad ne prepisuje blok na koji pokazuje ' +
        'drugo stablo: novi podaci idu u novi blok i pomiče se samo pokazivač živog stabla. Ni nedijeljeni blok se ne ' +
        'prepisuje na mjestu, pa i pisanje bez rasta datoteke treba slobodan blok.</p>' +
        '<p>Tablica razlikuje <b>referencirano</b> (svi blokovi na koje stablo pokazuje; Btrfs <code>rfer</code>, ZFS ' +
        '<code>referenced</code>) i <b>isključivo</b> (blokovi samo tog stabla; Btrfs <code>excl</code>, ZFS ' +
        '<code>used</code> snimke). Uništenje snimke oslobađa točno njezine isključive blokove.</p>' +
        '<p>Tri zablude: <em lang="en">snapshot</em> je kopija i zauzme koliko i podaci; brisanje datoteka oslobađa mjesto ' +
        'i dok postoje snimke; veličina snimke određena je kad se uzme. Ovdje se vidi da snimka u početku ne košta ništa ' +
        'i da raste kako se živo stablo mijenja.</p>' +
        '<p>Ista ideja na razini jedne datoteke je <em lang="en">reflink</em> (kopija koja dijeli blokove), npr. u XFS-u s <code>reflink=1</code>. ' +
        'Izvan ovog prikaza: kopiranje stabla metapodataka do korijena, kontrolni zbrojevi, slanje i primanje snimaka, ' +
        'klonovi i snimke u koje se piše.</p>'
    },
    en: {
      stage: 'Block pool and the trees that point into it',
      gridTitle: 'Pool',
      poolOf: ['{n} block', '{n} blocks'],
      fileOf: ['file {f}: {n} block', 'file {f}: {n} blocks'],
      count: '{used} of {total} used',
      poolRow: 'pool',
      roleLive: 'live tree',
      roleSnap: 'snapshot, read-only',
      roleGone: 'destroyed',
      roleNoFile: 'no files',
      thTree: 'Tree',
      thRef: 'referenced',
      thExcl: 'exclusive',
      thPool: 'Pool',
      thUsed: 'used',
      thFree: 'free',
      thShared: 'shared',

      scene: 'Scenario',
      fileBlocks: 'Blocks in file a',
      poolSize: 'Blocks in the pool',
      showRefs: 'Reference counts (×n)',

      presetBasic: 'Snapshot, then write',
      presetBasicHint: 'The snapshot takes nothing; the write after it takes new blocks.',
      presetDelete: 'Deleting does not free',
      presetDeleteHint: 'rm a with a snapshot: still 8 used.',
      presetMiddle: 'Two snapshots',
      presetMiddleHint: 'A destroyed snapshot frees only its own blocks.',
      presetFull: 'Full pool',
      presetFullHint: 'A pool of 10: a write fails, rm a frees only 2.',

      legChanged: 'new or moved',
      legRefs: 'reference count changed',
      legShared: 'shared (×n trees)',
      legOwned: 'one tree only',
      legFree: 'free',
      legFreed: 'freed this step',
      legMoved: 'pointer moved',

      termSnap: 'snapshot',
      termSnapLater: 'snapshot',
      termCow: 'copy-on-write',
      termCowLater: 'copy-on-write',

      capStart: 'An empty pool of {pool}. The live tree {live} has no files yet. Press → for the first step.',
      capCreate: 'File {f} is written into tree {live}: {n}, each into a free block of the pool ({list}). Every block has one reference.',
      capSnapFirst: 'Taking {snap} {name}. It takes no blocks: it copies only the pointers. Blocks {list} are now shared by {trees}.',
      capSnapLater: 'Taking {snap} {name}. It takes no blocks either: it copies only the pointers, so each of the {n} that {live} points to gains one reference.',
      trees: ['{n} tree', '{n} trees'],
      blocksOf: ['{n} block', '{n} blocks'],
      capWriteHead: ['Block {list} of file {f} is written.', 'Blocks {list} of file {f} are written.'],
      capWriteCow: ['With {cow} the old data is not overwritten: the new data goes to free block {new}, and only the pointer of {live} moves.',
        'With {cow} the old data is not overwritten: the new data goes to free blocks {new}, and only the pointers of {live} move.'],
      capKept: ['Old block {list} stays: {holders} still points to it.', 'Old blocks {list} stay: {holders} still points to them.'],
      capKeptMany: ['Old block {list} stays: {holders} still point to it.', 'Old blocks {list} stay: {holders} still point to them.'],
      capFreedOld: ['Old block {list} is no longer needed, so it is freed only after the new one is written.',
        'Old blocks {list} are no longer needed, so they are freed only after the new ones are written.'],
      capCost: 'Now {snap} {name} holds {n} on its own: that is what it really costs.',
      capErrHead: ['Writing block {list} fails: {msg}.', 'Writing blocks {list} fails: {msg}.'],
      capErrSpace: 'The pool has {free} free, and the write needs {need}: new data always goes to a new block.',
      capErrShared: 'The old block must not be overwritten while a {snap} points to it.',
      capErrOwn: 'The old block could be freed only after the new one is written.',
      capErrNothing: 'No pointer moved, although the file would not grow by a single block.',
      capRm: 'File {f} is deleted from tree {live}: only its pointers go.',
      capRmNone: ['No block is freed: {snap} {names} still points to all of them.', 'No block is freed: {snap}s {names} still point to all of them.'],
      capRmSome: 'Only what no {snap} points to is freed: {n} ({list}).',
      capRmAll: 'No {snap} holds these blocks, so all {n} are freed ({list}).',
      capRmBarely: 'While a {snap} exists, deleting files barely frees any space.',
      capDestroy: 'Destroying {snap} {name} frees exactly the blocks it held on its own: {n} ({list}).',
      capDestroyNone: 'Destroying {snap} {name} frees nothing: it held no block on its own.',
      capDestroyKept: ['The blocks it shared with tree {holders} stay.', 'The blocks it shared with trees {holders} stay.'],
      capUsed: 'In use: {used} of {total}.',
      enospc: 'No space left on device',
      and: ' and ',

      // ── preset win-vss ──
      subtitleCow: 'Shadow copies: the old block is copied first, the new data goes in place',
      presetPrev: 'Previous Versions',
      presetPrevHint: 'Shadow S1, a change, then a restore from S1: the old blocks wait in the diff area.',
      presetGrowth: 'Diff area growth',
      presetGrowthHint: 'Changes after one shadow: the area grows by the changed blocks, not by the volume.',
      presetDiffFull: 'Full diff area',
      presetDiffFullHint: 'A diff area of 4 blocks: the oldest shadow is deleted and its version is gone.',
      diffLimit: 'Diff area (blocks)',

      gridTitleCow: 'Volume',
      diffOf: ['diff area: at most {n} block', 'diff area: at most {n} blocks'],
      volRow: 'volume',
      diffRow: 'diff area',
      roleVol: 'live data',
      roleDiff: 'old blocks',
      roleShadow: '{time} · read-only',
      roleDropped: 'deleted',
      thVersions: 'Previous versions',
      thTaken: 'taken',
      thInDiff: 'in diff area',
      thState: 'state',
      stOk: 'available',
      stDropped: 'deleted',
      meterDiff: 'Diff area',
      meterText: '{used} of {total}',

      legChangedCow: 'copied, overwritten or restored',
      legSharedCow: 'shared (×n)',
      legLive: 'on the volume only',
      legCopy: 'copy for one shadow (its colour)',
      legMovedCow: 'copy or restore',

      termShadow: 'shadow copy',
      termShadowLater: 'shadow copy',

      capStartCow: 'A volume of {pool} and an empty diff area of at most {diff}. Press → for the first step.',
      capCreateCow: 'At {time}, file {f} is written to the volume: {n} ({list}).',
      capShadow: 'At {time}, {shadow} {name} is taken. No block is copied: {name} keeps the volume as it is at this moment and for now shares all {n} with the live data.',
      capCowHead: ['At {time}, block {list} of file {f} is written.', 'At {time}, blocks {list} of file {f} are written.'],
      capCowCopy: ['On the first change after a shadow, the old block is copied to the diff area ({to}), then the original is overwritten.',
        'On the first change after a shadow, the old blocks are copied to the diff area ({to}), then the originals are overwritten.'],
      capCowWho: ['Shadow {names} now reads the old data from there.', 'Shadows {names} now read the old data from there.'],
      capCowKept: ['Block {list} is already preserved, so it is only overwritten in place.', 'Blocks {list} are already preserved, so they are only overwritten in place.'],
      capCowFree: ['No shadow shares block {list}, so it is overwritten in place.', 'No shadow shares blocks {list}, so they are overwritten in place.'],
      capDrop: ['The diff area is full, so the oldest shadow {names} is deleted first, and its previous version is gone.',
        'The diff area is full, so the oldest shadows {names} are deleted first, and their previous versions are gone.'],
      capDropFreed: ['That frees {n} no other shadow needs ({list}).', 'That frees {n} no other shadow needs ({list}).'],
      capDiffNow: 'Diff area: {used} of {total}; the volume still has {vol} in use.',
      capRestorePick: 'At {time}, the version of file {f} from before {before} is wanted: the newest such shadow is {name}.',
      capRestore: 'Restore from shadow {name}: the file returns to its {taken} contents.',
      capRestoreBlocks: ['Block {list} is overwritten in place with the copy from the diff area.', 'Blocks {list} are overwritten in place with the copies from the diff area.'],
      capRestoreCopy: ['First the current contents are copied for shadow {names}, so the replaced version can be restored too.',
        'First the current contents are copied for shadows {names}, so the replaced version can be restored too.'],
      capRestoreSame: 'The file does not differ from that version, so nothing is written.',
      capRestoreNone: 'At {time}, the version of file {f} from before {before} is wanted, but no remaining shadow is that old. Nothing changes.',
      capRestoreLost: ['Shadow {names} had it, deleted when the diff area filled up: previous versions are not a backup.',
        'Shadows {names} had it, deleted when the diff area filled up: previous versions are not a backup.'],

      explainCow: '<p>Windows Volume Shadow Copy works differently from Btrfs and ZFS: the live data stays where it is. A ' +
        'shadow copy keeps the volume as it was at one moment, but copies nothing until a block changes. On the first ' +
        'change of a block after a shadow, the old block is first copied to the <b>diff area</b>, then the original is ' +
        'overwritten in place (copy-on-write). Later changes of the same block copy nothing more.</p>' +
        '<p>So the diff area grows with the number of changed blocks, not with the size of the volume. It has a limit; ' +
        'when it is full, the oldest shadows are deleted. The Previous Versions tab offers the file from every remaining ' +
        'shadow; a restore overwrites the live file with the old contents, and that is an ordinary write too.</p>' +
        '<p>Three misconceptions: a shadow is a full second copy (it keeps only the changed blocks); previous versions ' +
        'are a backup (by default the shadows are on the same volume, so they survive neither its loss nor an attacker ' +
        'who deletes them); copy-on-write and redirect-on-write are the same (here the old block is copied, in the pool ' +
        'examples the new data goes to a new block).</p>' +
        '<p>Not shown: writers and requesters and application quiescing, scheduling, and a diff area on another ' +
        'volume.</p>',

      explain: '<p>In a copy-on-write filesystem such as Btrfs or ZFS, a file is a list of pointers to blocks in a pool. ' +
        'The tree <span translate="no">podaci</span> is the live subvolume in Btrfs, or the dataset in ZFS.</p>' +
        '<p>A snapshot copies the pointers, not the data: it takes no block. Here every block has a reference count, the ' +
        'number of trees that point to it; Btrfs and ZFS keep track in their own ways (Btrfs through shared metadata ' +
        'trees, ZFS by the time a block was born), but the space accounting comes out the same. A write never overwrites a block another tree points to: the new data goes to a new block and only the ' +
        'live tree\'s pointer moves. Even an unshared block is not overwritten in place, so a write that does not grow ' +
        'the file still needs a free block.</p>' +
        '<p>The table tells <b>referenced</b> (every block the tree points to; Btrfs <code>rfer</code>, ZFS ' +
        '<code>referenced</code>) from <b>exclusive</b> (blocks of that tree only; Btrfs <code>excl</code>, a ZFS ' +
        'snapshot\'s <code>used</code>). Destroying a snapshot frees exactly its exclusive blocks.</p>' +
        '<p>Three misconceptions: a snapshot is a copy and takes as much space as the data; deleting files frees space ' +
        'while snapshots exist; a snapshot\'s size is fixed when it is taken. Here a snapshot costs nothing at first and ' +
        'grows as the live tree changes.</p>' +
        '<p>The same idea for a single file is a reflink copy (XFS with <code>reflink=1</code>). Not shown: the metadata ' +
        'tree\'s own copy-on-write up to its root, checksums, sending and receiving snapshots, clones and writable ' +
        'snapshots.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
