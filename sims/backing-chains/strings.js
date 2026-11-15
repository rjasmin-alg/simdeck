/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of backing-chains, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term, *text* an English term the glossary lacks (the
   page sets it in italics). Keys ending in _qcow2, _vhdx, _vmdk are the format's own words.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Lanac slika diska',
      gridTitle: 'Lanac slika diska',
      viewRow: 'VM vidi',
      viewNoOpen: 'ne otvara se',
      roleActive: 'aktivni',
      roleRO: 'samo za čitanje',
      roleRemoved: 'uklonjen',
      roleDropped: 'odbačen',
      roleMissing: 'datoteke nema',
      roleBroken: 'prekinut',
      cntAlloc: ['zauzet {n} blok', 'zauzeta {n} bloka', 'zauzeto {n} blokova'],
      files: ['{n} datoteka u lancu', '{n} datoteke u lancu', '{n} datoteka u lancu'],
      fmt_qcow2: 'qcow2',
      fmt_vhdx: 'VHDX / AVHDX',
      fmt_vmdk: 'VMDK',

      // params
      format: 'Format',
      ending: 'Na kraju',
      endNone: 'ništa',
      endCommit: 'spoji',
      endStream: 'povuci',
      endDelete: 'obriši',
      endApply: 'vrati',
      endKeep: 'spremi + vrati',
      compact: 'Lanac u jednom koraku',
      showView: 'Što VM vidi',

      // presets
      presetRead: 'Čitanje kroz lanac',
      presetReadHint: 'Snimka, upisi, snimka, upisi; pa četiri čitanja.',
      presetCommit: 'Spajanje srednjeg sloja',
      presetCommitHint: 's1 se spaja u bazu; VM vidi isto.',
      presetStream: 'Povlačenje srednjeg sloja',
      presetStreamHint: 's2 povlači s1 k sebi; baza se ne mijenja.',
      presetBroken: 'Prekinuta karika',
      presetBrokenHint: 's1.qcow2 obrisan bez spajanja.',
      presetVhdx: 'Kontrolne točke (VHDX)',
      presetVhdxHint: 'Brisanje kontrolne točke spaja njezin AVHDX.',
      presetVmdk: 'Delta-datoteke (VMDK)',
      presetVmdkHint: 'Brisanje snimke spaja njezinu datoteku u roditelja.',
      presetApply: 'Vraćanje na C1 (VHDX)',
      presetApplyHint: 'Natrag na C1: novi AVHDX, trenutno stanje odbačeno.',
      presetKeep: 'Spremi pa vrati (VHDX)',
      presetKeepHint: 'Trenutno stanje ostaje kao C3; lanac se grana.',
      presetAvhdx: 'AVHDX obrisan rukom',
      presetAvhdxHint: 'Datoteka obrisana mimo Hyper-V-a: VM se ne pokreće.',

      // legend
      legChanged: 'promijenjen u ovom koraku',
      legBlock: 'zauzet blok sloja',
      legFree: 'nezauzet blok',
      legView: 'što VM vidi',
      legLink: 'pozadinska datoteka, čitanje',
      legMissing: 'datoteke nema',
      legUnreach: 'nedostupno (lanac prekinut)',

      // format words
      snap_qcow2: '*snapshot* (snimka)',
      snapLater_qcow2: 'još jedan *snapshot*',
      snap_vhdx: '[[checkpoint]]',
      snapLater_vhdx: 'još jedan [[=checkpoint]]',
      snap_vmdk: '*snapshot* (snimka)',
      snapLater_vmdk: 'još jedan *snapshot*',
      two_qcow2: 'dvije snimke',
      two_vhdx: 'dvije kontrolne točke',
      two_vmdk: 'dvije snimke',
      what_vhdx: 'kontrolne točke',
      what_vmdk: 'snimke',
      what_qcow2: 'snimke',
      none_qcow2: 'nijedna snimka',
      none_vhdx: 'nijedna kontrolna točka',
      none_vmdk: 'nijedna snimka',
      second_qcow2: 'druga snimka',
      second_vhdx: 'druga kontrolna točka',
      second_vmdk: 'druga snimka',
      third_qcow2: 'treća snimka',
      third_vhdx: 'treća kontrolna točka, C3',
      third_vmdk: 'treća snimka',
      applyHead_qcow2: 'Povratak na prvu snimku: nad {base} nastaje novi prazni *overlay* {new}, pa VM opet vidi disk iz te snimke.',
      applyHead_vhdx: 'Vraćanje na prvi [[checkpoint]], C1: Hyper-V stvara novi AVHDX {new} nad {base}, pa VM opet vidi disk ' +
        'iz C1.',
      applyHead_vmdk: 'Povratak na prvu snimku: nad {base} nastaje nova prazna delta-datoteka {new}, pa VM opet vidi disk iz ' +
        'te snimke.',
      kept_qcow2: '{old} ostaje za treću snimku, a {s1} za drugu',
      kept_vhdx: '{old} ostaje za treću kontrolnu točku, a {s1} za drugu',
      kept_vmdk: '{old} ostaje za treću snimku, a {s1} za drugu',
      commitHead_qcow2: 'Spajanje prema dolje (*commit*) sloja {L} u {P}.',
      commitHead_vhdx: 'Prvi [[=checkpoint]] se briše: Hyper-V spaja (*merge*) {L} u {P}.',
      commitHead_vmdk: 'Prvi *snapshot* se briše: njegova datoteka {L} spaja se (*merge*) u {P}.',
      termOverlay: '*overlay* (prekrivni sloj)',
      termOverlayLater: '*overlay*',
      termBacking: '*backing file* (pozadinska datoteka)',
      termBackingLater: '*backing file*',
      termCow: '*copy-on-write* (kopiranje pri pisanju)',
      termCowLater: '*copy-on-write*',

      // captions
      capStart: 'Početak: VM piše izravno u {base}. Zauzeti su blokovi 0–3 (A–D), a 4–7 nikad nisu pisani.',
      capSnap: 'Uzima se {what}: {old} postaje samo za čitanje. Nad njim nastaje {new}, prazan {overlay}, a {old} mu je ' +
        '{backing}. Ništa se ne kopira: {new} ima 0 blokova, a VM vidi isto.',
      capBuild: 'Lanac u jednom koraku: {two} i četiri upisa. VM piše u {s2}; {s1} i {base} samo se čitaju. Svaki sloj ' +
        'ima samo blokove upisane dok je bio aktivan.',
      capWrite: 'VM piše blok {b} = {v}. Upis ide samo u aktivni sloj {file}; niži slojevi se ne mijenjaju: {cow}.',
      capHides: 'Stari {old} u {lower} ostaje, samo je sakriven.',
      capCommitCopy: ['Korak 1 od 3: {n} blok iz {L} kopira se u {P}: {list}.', 'Korak 1 od 3: {n} bloka iz {L} kopiraju se u {P}: {list}.',
        'Korak 1 od 3: {n} blokova iz {L} kopira se u {P}: {list}.'],
      capOverwrite: ['Blok {list} u {P} se prepisuje ({chg}): vrijedi blok iz {L}.', 'Blokovi {list} u {P} se prepisuju ({chg}): vrijede blokovi iz {L}.',
        'Blokovi {list} u {P} se prepisuju ({chg}): vrijede blokovi iz {L}.'],
      capSame: 'VM vidi isto.',
      capRepoint: 'Korak 2 od 3: {C} se preusmjerava na {P}, koji postaje njegova pozadinska datoteka. {L} više nitko ne čita.',
      capRemove: 'Korak 3 od 3: {L} izlazi iz lanca. Lanac je kraći za jednu datoteku, a VM vidi isto.',
      capNotLost: 'VM nije izgubio ništa: upisi nakon {what} spojeni su u {P}. Nestao je samo povratak na stanje {what} (blok 1 = B).',
      capStreamHead: 'Povlačenje prema gore (*stream*) sloja {L} u {C}.',
      capStreamCopy: ['Korak 1 od 3: u {C} se kopira {n} blok iz {L}, onaj kojeg {C} nema: {list}.',
        'Korak 1 od 3: u {C} se kopiraju {n} bloka iz {L}, oni kojih {C} nema: {list}.',
        'Korak 1 od 3: u {C} se kopira {n} blokova iz {L}, oni kojih {C} nema: {list}.'],
      capStreamKept: ['Blok {list} se ne kopira: {C} ima svoj ({own}) i on vrijedi.', 'Blokovi {list} se ne kopiraju: {C} ima svoje ({own}) i oni vrijede.',
        'Blokovi {list} se ne kopiraju: {C} ima svoje ({own}) i oni vrijede.'],
      capBaseSame: '{P} se ne mijenja.',
      capDelete: 'Datoteka {L} obrisana je bez spajanja. {C} se na nju oslanja, pa je lanac prekinut: slika se ne može ' +
        'otvoriti i VM se ne pokreće. Blokovi {list} iz {L} su izgubljeni.',
      capByHand: 'Brisanje {what} spojilo bi podatke; ovdje je obrisana sama datoteka.',
      capFollowMiss: 'Blok {b} niz lanac: {file} ga nema, pa bi čitanje palo na njegovu pozadinsku datoteku {next}.',
      capFollowFail: 'Blok {b} pao bi na {file}, a te datoteke više nema: čitanje ne može uspjeti. Sama baza i dalje daje ' +
        'A B C D, ali ono što je upisano u {L} i {C} nije dostupno.',
      capStreamOnly: 'Kontrolne točke i snimke u formatima VHDX i VMDK brišu se samo spajanjem prema dolje: ovo je operacija ' +
        'formata qcow2, prikazana na ovim datotekama.',
      capReadMiss: 'Čitanje bloka {b}: {file} ga nema, pa čitanje pada na njegovu pozadinsku datoteku {next}.',
      capReadHit: 'Čitanje bloka {b}: {file} ga ima, {v}.',
      capVisited: ['Pregledan je {n} sloj.', 'Pregledana su {n} sloja.', 'Pregledano je {n} slojeva.'],
      capReadOlder: ['Niži sloj ima stariji sadržaj ({old}), ali čitanje do njega ne dolazi.', 'Niži slojevi imaju starije sadržaje ({old}), ali čitanje do njih ne dolazi.',
        'Niži slojevi imaju starije sadržaje ({old}), ali čitanje do njih ne dolazi.'],
      capReadZero: 'Čitanje bloka {b}: ni {file} ga nema, a ispod nema ničega: blok se čita kao nule.',
      capKeep: 'Prvo se trenutno stanje sprema: {third}. {old} postaje samo za čitanje i više se ne mijenja, a VM vidi isto.',
      capApplyDrop: ['Trenutno stanje u {old} ({n} blok: {list}) odbacuje se: ne čuva ga {none}.',
        'Trenutno stanje u {old} ({n} bloka: {list}) odbacuje se: ne čuva ga {none}.',
        'Trenutno stanje u {old} ({n} blokova: {list}) odbacuje se: ne čuva ga {none}.'],
      capApplyBranch: '{s1} ostaje jer ga treba {second}, pa {base} sada ima dvoje djece: lanac se grana.',
      capApplyKept: '{kept}, pa {base} sada ima dvoje djece: lanac se grana. Ništa nije izgubljeno.',
      capReadBranch: ['Vrijednost {vals} na drugoj grani ne čita se: taj sloj nije ispod {top}.',
        'Vrijednosti {vals} na drugoj grani ne čitaju se: ti slojevi nisu ispod {top}.',
        'Vrijednosti {vals} na drugoj grani ne čitaju se: ti slojevi nisu ispod {top}.'],

      explain: '<p>Disk virtualnog stroja može biti <b>lanac datoteka</b>. Na dnu je osnovna slika, a svaka snimka ' +
        '(<em lang="en">snapshot</em>) dodaje prazan prekrivni sloj (<em lang="en">overlay</em>) kojemu je dotadašnji vrh ' +
        '<em lang="en">backing file</em> (pozadinska datoteka). VM piše samo u gornji, aktivni sloj: upisani blok tamo se ' +
        'zauzima, a niži slojevi se ne mijenjaju.</p>' +
        '<p><b>Čitanje pada kroz lanac:</b> kreće od aktivnog sloja i ide prema dnu dok ne nađe sloj koji ima taj blok. ' +
        'Ako ga nema nijedan, blok se čita kao nule.</p>' +
        '<p><b>Spajanje</b> srednjeg sloja u njegovu pozadinsku datoteku (<em lang="en">commit</em>, <em lang="en">merge</em>)' +
        ' kopira njegove blokove dolje, preusmjeri dijete i ukloni sloj. ' +
        '<b>Povlačenje</b> (<em lang="en">stream</em>) kopira prema gore samo blokove koje dijete nema. U oba slučaja VM vidi ' +
        'isto. Spajanje se ne smije raditi ako donji sloj ima još jedno dijete: tom bi se djetetu promijenio disk, a pozadinska ' +
        'datoteka ne zna tko se na nju oslanja.</p>' +
        '<p>Datoteka obrisana <b>bez spajanja</b> prekida lanac: svaki sloj iznad nje ostaje bez podloge, a slika se ne može ' +
        'otvoriti. Zato brisanje kontrolne točke ili snimke u upravitelju spaja upise nastale nakon nje, a ne briše ih.</p>' +
        '<p><b>Hyper-V:</b> kontrolna točka je stanje diska prije AVHDX-a koji nastaje uz nju. Brisanje kontrolne točke ' +
        'spaja AVHDX u roditelja. <b>Vraćanje na točku</b> (<em lang="en">Apply</em>) stvara novi AVHDX nad diskom te ' +
        'točke i odbacuje trenutno stanje, osim ako se ono prije spremi kao nova točka; tada roditelj ima dvoje djece i ' +
        'lanac se grana. AVHDX obrisan rukom, mimo Hyper-V-a, prekida lanac kao i svaka druga datoteka. Produkcijska ' +
        'kontrolna točka traži od gosta da disk dovede u dosljedno stanje i ne sprema memoriju; standardna sprema i ' +
        'memoriju. Na blokovima diska razlike nema.</p>' +
        '<p>Česte zablude: snimka nije kopija diska (prazan je sloj koji raste); brisanje snimke ne briše upise nastale nakon nje ' +
        '(oni se spajaju dolje, nestaje samo povratak na nju); snimka nije sigurnosna kopija, jer nestaje s osnovnom slikom; „suvišan“ AVHDX ne smije se samo obrisati da se oslobodi prostor, jer ga trebaju slojevi iznad njega.</p>'
    },
    en: {
      stage: 'Disk image chain',
      gridTitle: 'Disk image chain',
      viewRow: 'VM sees',
      viewNoOpen: 'does not open',
      roleActive: 'active',
      roleRO: 'read-only',
      roleRemoved: 'removed',
      roleDropped: 'discarded',
      roleMissing: 'file missing',
      roleBroken: 'broken',
      cntAlloc: ['{n} block allocated', '{n} blocks allocated'],
      files: ['{n} file in the chain', '{n} files in the chain'],
      fmt_qcow2: 'qcow2',
      fmt_vhdx: 'VHDX / AVHDX',
      fmt_vmdk: 'VMDK',

      format: 'Format',
      ending: 'At the end',
      endNone: 'none',
      endCommit: 'merge',
      endStream: 'stream',
      endDelete: 'delete',
      endApply: 'apply',
      endKeep: 'take + apply',
      compact: 'Chain in one step',
      showView: 'What the VM sees',

      presetRead: 'Reads through the chain',
      presetReadHint: 'Snapshot, writes, snapshot, writes; then four reads.',
      presetCommit: 'Commit the middle layer',
      presetCommitHint: 's1 merges into base; the VM sees the same.',
      presetStream: 'Stream the middle layer',
      presetStreamHint: 's2 pulls s1 up into itself; base is untouched.',
      presetBroken: 'Broken link',
      presetBrokenHint: 's1.qcow2 deleted without a merge.',
      presetVhdx: 'Checkpoints (VHDX)',
      presetVhdxHint: 'Deleting a checkpoint merges its AVHDX.',
      presetVmdk: 'Delta files (VMDK)',
      presetVmdkHint: 'Deleting a snapshot merges its file into the parent.',
      presetApply: 'Apply C1 (VHDX)',
      presetApplyHint: 'Back to C1: a new AVHDX; the current state is discarded.',
      presetKeep: 'Take and apply (VHDX)',
      presetKeepHint: 'The current state stays as C3; the chain branches.',
      presetAvhdx: 'AVHDX deleted by hand',
      presetAvhdxHint: 'The file deleted outside Hyper-V: the VM does not start.',

      legChanged: 'changed in this step',
      legBlock: 'block allocated in a layer',
      legFree: 'unallocated block',
      legView: 'what the VM sees',
      legLink: 'backing file, read',
      legMissing: 'file missing',
      legUnreach: 'unreachable (chain broken)',

      snap_qcow2: 'a snapshot',
      snapLater_qcow2: 'another snapshot',
      snap_vhdx: 'a [[checkpoint]]',
      snapLater_vhdx: 'another [[=checkpoint]]',
      snap_vmdk: 'a snapshot',
      snapLater_vmdk: 'another snapshot',
      two_qcow2: 'two snapshots',
      two_vhdx: 'two checkpoints',
      two_vmdk: 'two snapshots',
      what_vhdx: 'the checkpoint',
      what_vmdk: 'the snapshot',
      what_qcow2: 'the snapshot',
      none_qcow2: 'no snapshot',
      none_vhdx: 'no checkpoint',
      none_vmdk: 'no snapshot',
      second_qcow2: 'the second snapshot',
      second_vhdx: 'the second checkpoint',
      second_vmdk: 'the second snapshot',
      third_qcow2: 'a third snapshot',
      third_vhdx: 'a third checkpoint, C3',
      third_vmdk: 'a third snapshot',
      applyHead_qcow2: 'Revert to the first snapshot: a new empty overlay {new} on {base}, so the VM sees the disk of that ' +
        'snapshot again.',
      applyHead_vhdx: 'Apply the first [[checkpoint]], C1: Hyper-V creates a new AVHDX {new} on {base}, so the VM sees the ' +
        'disk of C1 again.',
      applyHead_vmdk: 'Revert to the first snapshot: a new empty delta file {new} on {base}, so the VM sees the disk of that ' +
        'snapshot again.',
      kept_qcow2: '{old} stays for the third snapshot and {s1} for the second',
      kept_vhdx: '{old} stays for the third checkpoint and {s1} for the second',
      kept_vmdk: '{old} stays for the third snapshot and {s1} for the second',
      commitHead_qcow2: 'Commit (merge down) of {L} into {P}.',
      commitHead_vhdx: 'The first checkpoint is deleted: Hyper-V merges {L} into {P}.',
      commitHead_vmdk: 'The first snapshot is deleted: its file {L} is merged into {P}.',
      termOverlay: 'overlay',
      termOverlayLater: 'overlay',
      termBacking: 'backing file',
      termBackingLater: 'backing file',
      termCow: 'copy-on-write',
      termCowLater: 'copy-on-write',

      capStart: 'Start: the VM writes straight to {base}. Blocks 0–3 are allocated (A–D); 4–7 were never written.',
      capSnap: 'Take {what}: {old} becomes read-only. On top of it comes {new}, an empty {overlay}, with {old} as its ' +
        '{backing}. Nothing is copied: {new} holds 0 blocks and the VM sees the same.',
      capBuild: 'The chain in one step: {two} and four writes. The VM writes to {s2}; {s1} and {base} are only read. Each ' +
        'layer holds only the blocks written while it was active.',
      capWrite: 'The VM writes block {b} = {v}. The write goes only to the active layer {file}; the layers below never ' +
        'change: {cow}.',
      capHides: 'The old {old} in {lower} stays, only hidden.',
      capCommitCopy: ['Step 1 of 3: {n} block of {L} is copied into {P}: {list}.', 'Step 1 of 3: {n} blocks of {L} are copied into {P}: {list}.'],
      capOverwrite: ['Block {list} in {P} is overwritten ({chg}): the block from {L} wins.', 'Blocks {list} in {P} are overwritten ({chg}): the blocks from {L} win.'],
      capSame: 'What the VM sees has not changed.',
      capRepoint: 'Step 2 of 3: {C} is re-pointed to {P}, which becomes its backing file. Nothing reads {L} any more.',
      capRemove: 'Step 3 of 3: {L} leaves the chain. The chain is one file shorter, and the VM sees the same.',
      capNotLost: 'The VM lost nothing: the writes made after {what} were merged into {P}. Only the way back to {what} (block 1 = B) is gone.',
      capStreamHead: 'Stream (pull up) of {L} into {C}.',
      capStreamCopy: ['Step 1 of 3: {n} block of {L} is copied into {C}, the one {C} lacks: {list}.',
        'Step 1 of 3: {n} blocks of {L} are copied into {C}, the ones {C} lacks: {list}.'],
      capStreamKept: ['Block {list} is not copied: {C} has its own ({own}), and that one wins.', 'Blocks {list} are not copied: {C} has its own ({own}), and those win.'],
      capBaseSame: '{P} is not touched.',
      capDelete: 'The file {L} is deleted without a merge. {C} backs on it, so the chain is broken: the image cannot be ' +
        'opened and the VM does not start. Blocks {list} of {L} are lost.',
      capByHand: 'Deleting {what} would have merged the data; here the file itself was deleted.',
      capFollowMiss: 'Follow block {b} down the chain: {file} does not have it, so a read would fall through to its backing file {next}.',
      capFollowFail: 'Block {b} would fall through to {file}, and that file is gone: no read can succeed. Base alone still ' +
        'gives A B C D, but what was written to {L} and {C} is out of reach.',
      capStreamOnly: 'VHDX checkpoints and VMDK snapshots are only ever merged down: this is the qcow2 operation, shown on ' +
        'these files.',
      capReadMiss: 'Read block {b}: {file} does not have it, so the read falls through to its backing file {next}.',
      capReadHit: 'Read block {b}: {file} has it, {v}.',
      capVisited: ['Layers visited: {n}.', 'Layers visited: {n}.'],
      capReadOlder: ['A lower layer holds an older value ({old}), but the read never gets there.', 'Lower layers hold older values ({old}), but the read never gets there.'],
      capReadZero: 'Read block {b}: {file} does not have it either, and there is nothing below: the block reads as zeros.',
      capKeep: 'First the current state is kept: {third}. {old} becomes read-only and never changes again; the VM sees the same.',
      capApplyDrop: ['The current state in {old} ({n} block: {list}) is discarded: {none} keeps it.',
        'The current state in {old} ({n} blocks: {list}) is discarded: {none} keeps it.'],
      capApplyBranch: '{s1} stays, because {second} needs it, so {base} now has two children: the chain branches.',
      capApplyKept: '{kept}, so {base} now has two children: the chain branches. Nothing is lost.',
      capReadBranch: ['{vals} on the other branch is not read: that layer is not below {top}.',
        '{vals} on the other branch are not read: those layers are not below {top}.'],

      explain: '<p>A virtual machine\'s disk can be a <b>chain of files</b>. The base image sits at the bottom, and each ' +
        'snapshot adds an empty overlay whose backing file is the old top. The VM writes only to the top, active layer: ' +
        'a written block is allocated there, and the layers below never change.</p>' +
        '<p><b>A read falls through the chain:</b> it starts at the active layer and goes down until a layer has the ' +
        'block. If none has it, the block reads as zeros.</p>' +
        '<p><b>Committing</b> a middle layer into its backing file (commit, merge) copies its blocks down, ' +
        're-points the child and removes the layer. <b>Streaming</b> copies up only the blocks the child lacks. Either way ' +
        'the VM sees the same disk. A commit must not be done when the lower layer has another child: that child\'s disk ' +
        'would change under it, and a backing file does not know who backs on it.</p>' +
        '<p>A file deleted <b>without a merge</b> breaks the chain: every layer above it loses its footing and the image ' +
        'cannot be opened. That is why deleting a checkpoint or snapshot in the manager merges the writes made after ' +
        'it rather than deleting them.</p>' +
        '<p><b>Hyper-V:</b> a checkpoint is the state of the disk before the AVHDX made with it. Deleting a checkpoint ' +
        'merges the AVHDX into its parent. <b>Applying</b> a checkpoint creates a new AVHDX on that checkpoint\'s disk and ' +
        'discards the current state, unless it is first kept as a new checkpoint; then the parent has two children and ' +
        'the chain branches. An AVHDX deleted by hand, outside Hyper-V, breaks the chain like any other file. A production ' +
        'checkpoint asks the guest to bring its disk to a consistent state and saves no memory; a standard checkpoint saves ' +
        'the memory too. The disk blocks are the same either way.</p>' +
        '<p>Common mistakes: a snapshot is not a copy of the disk (it is an empty layer that grows); deleting a snapshot ' +
        'does not delete the writes made after it (they merge down; only the way back to it is gone); a snapshot is not a backup, because it dies with its base image; an orphaned AVHDX cannot simply be deleted to save space, because the layers above it need it.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
