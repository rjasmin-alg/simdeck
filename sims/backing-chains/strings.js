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
      roleMissing: 'datoteke nema',
      roleBroken: 'prekinut',
      cntAlloc: ['zauzet {n} blok', 'zauzeta {n} bloka', 'zauzeto {n} blokova'],
      files: ['{n} datoteka u lancu', '{n} datoteke u lancu', '{n} datoteka u lancu'],
      fmt_qcow2: 'qcow2',
      fmt_vhdx: 'VHDX / AVHDX',
      fmt_vmdk: 'VMDK',

      // params
      format: 'Format',
      ending: 'Srednji sloj s1 na kraju',
      endNone: 'ništa',
      endCommit: 'spoji',
      endStream: 'povuci',
      endDelete: 'obriši',
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
      presetVmdkHint: 'Brisanje snimke konsolidira njezinu datoteku.',

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
      snapLater_qcow2: 'Nova snimka',
      snap_vhdx: '[[checkpoint]]',
      snapLater_vhdx: 'Nova kontrolna točka',
      snap_vmdk: '*snapshot* (snimka)',
      snapLater_vmdk: 'Nova snimka',
      two_qcow2: 'dvije snimke',
      two_vhdx: 'dvije kontrolne točke',
      two_vmdk: 'dvije snimke',
      what_vhdx: 'kontrolne točke',
      what_vmdk: 'snimke',
      what_qcow2: 'snimke',
      commitHead_qcow2: 'Spajanje prema dolje (*commit*) sloja {L} u {P}.',
      commitHead_vhdx: 'Prva kontrolna točka se briše: Hyper-V spaja (*merge*) {L} u {P}.',
      commitHead_vmdk: 'Prva snimka se briše: njezina datoteka {L} konsolidira se (*consolidate*) u {P}.',
      termOverlay: '*overlay* (prekrivni sloj)',
      termOverlayLater: '*overlay*',
      termBacking: '*backing file* (pozadinska datoteka)',
      termBackingLater: '*backing file*',
      termCow: '*copy-on-write* (kopiranje pri pisanju)',
      termCowLater: '*copy-on-write*',

      // captions
      capStart: 'Početak: VM piše izravno u {base}. Zauzeti su blokovi 0–3 (A–D), a 4–7 nikad nisu pisani.',
      capSnap: '{what}: {old} postaje samo za čitanje. Nad njim nastaje {new}, prazan {overlay}, a {old} je njegova ' +
        '{backing}. Ništa se ne kopira: {new} ima 0 blokova, a VM vidi isto.',
      capBuild: 'Lanac u jednom koraku: {two} i četiri upisa. VM piše u {s2}; {s1} i {base} samo se čitaju. Svaki sloj ' +
        'ima samo blokove upisane dok je bio aktivan.',
      capWrite: 'VM piše blok {b} = {v}. Upis ide samo u aktivni sloj {file}; niži slojevi se ne mijenjaju ({cow}).',
      capHides: 'Stari {old} u {lower} ostaje, samo je sakriven.',
      capCommitCopy: ['Korak 1 od 3: {n} blok iz {L} kopira se u {P}: {list}.', 'Korak 1 od 3: {n} bloka iz {L} kopiraju se u {P}: {list}.',
        'Korak 1 od 3: {n} blokova iz {L} kopira se u {P}: {list}.'],
      capOverwrite: ['Blok {list} u {P} se prepisuje ({chg}): vrijedi blok iz {L}.', 'Blokovi {list} u {P} se prepisuju ({chg}): vrijede blokovi iz {L}.',
        'Blokovi {list} u {P} se prepisuju ({chg}): vrijede blokovi iz {L}.'],
      capSame: 'VM vidi isto.',
      capRepoint: 'Korak 2 od 3: {C} se preusmjerava na {P}, koji postaje njegova pozadinska datoteka. {L} više nitko ne čita.',
      capRemove: 'Korak 3 od 3: {L} se uklanja. Lanac je kraći za jednu datoteku, a VM vidi isto.',
      capNotLost: 'Brisanjem {what} podaci nisu nestali: spojeni su u {P}.',
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
      capReadMiss: 'Čitanje bloka {b}: {file} ga nema, pa čitanje pada na njegovu pozadinsku datoteku {next}.',
      capReadHit: 'Čitanje bloka {b}: {file} ga ima, {v}.',
      capVisited: ['Pregledan je {n} sloj.', 'Pregledana su {n} sloja.', 'Pregledano je {n} slojeva.'],
      capReadOlder: 'Niži slojevi imaju starije sadržaje ({old}), ali čitanje do njih ne dolazi.',
      capReadZero: 'Čitanje bloka {b}: ni {file} ga nema, a ispod nema ničega: blok se čita kao nule.',
      capReadFail: 'Čitanje bloka {b} pada na {file}, a te datoteke više nema: čitanje ne uspijeva. Sama baza i dalje daje ' +
        'A B C D, ali ono što je upisano u {L} i {C} nije dostupno.',

      explain: '<p>Disk virtualnog stroja može biti <b>lanac datoteka</b>. Na dnu je osnovna slika, a svaka snimka ' +
        '(<em lang="en">snapshot</em>) dodaje prazan prekrivni sloj (<em lang="en">overlay</em>) kojemu je dotadašnji vrh ' +
        '<em lang="en">backing file</em> (pozadinska datoteka). VM piše samo u gornji, aktivni sloj: upisani blok tamo se ' +
        'zauzima, a niži slojevi se ne mijenjaju.</p>' +
        '<p><b>Čitanje pada kroz lanac:</b> kreće od aktivnog sloja i ide prema dnu dok ne nađe sloj koji ima taj blok. ' +
        'Ako ga nema nijedan, blok se čita kao nule.</p>' +
        '<p><b>Spajanje</b> srednjeg sloja u njegovu pozadinsku datoteku (<em lang="en">commit</em>, <em lang="en">merge</em>, ' +
        '<em lang="en">consolidate</em>) kopira njegove blokove dolje, preusmjeri dijete i ukloni sloj. ' +
        '<b>Povlačenje</b> (<em lang="en">stream</em>) kopira prema gore samo blokove koje dijete nema. U oba slučaja VM vidi ' +
        'isto. Spajanje se odbija ako donji sloj ima još jedno dijete: tom bi se djetetu promijenio disk.</p>' +
        '<p>Datoteka obrisana <b>bez spajanja</b> prekida lanac: svaki sloj iznad nje ostaje bez podloge, a slika se ne može ' +
        'otvoriti. Zato brisanje kontrolne točke ili snimke u upravitelju spaja podatke, a ne briše ih.</p>' +
        '<p>Česte zablude: snimka nije kopija diska (prazan je sloj koji raste); brisanje snimke ne briše njezine podatke ' +
        '(spaja ih); snimka nije sigurnosna kopija, jer nestaje s osnovnom slikom.</p>'
    },
    en: {
      stage: 'Disk image chain',
      gridTitle: 'Disk image chain',
      viewRow: 'VM sees',
      viewNoOpen: 'does not open',
      roleActive: 'active',
      roleRO: 'read-only',
      roleRemoved: 'removed',
      roleMissing: 'file missing',
      roleBroken: 'broken',
      cntAlloc: ['{n} block allocated', '{n} blocks allocated'],
      files: ['{n} file in the chain', '{n} files in the chain'],
      fmt_qcow2: 'qcow2',
      fmt_vhdx: 'VHDX / AVHDX',
      fmt_vmdk: 'VMDK',

      format: 'Format',
      ending: 'Middle layer s1 at the end',
      endNone: 'none',
      endCommit: 'merge',
      endStream: 'stream',
      endDelete: 'delete',
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
      presetVmdkHint: 'Deleting a snapshot consolidates its file.',

      legChanged: 'changed in this step',
      legBlock: 'block allocated in a layer',
      legFree: 'unallocated block',
      legView: 'what the VM sees',
      legLink: 'backing file, read',
      legMissing: 'file missing',
      legUnreach: 'unreachable (chain broken)',

      snap_qcow2: 'Snapshot',
      snapLater_qcow2: 'Another snapshot',
      snap_vhdx: '[[checkpoint]]',
      snapLater_vhdx: 'Another checkpoint',
      snap_vmdk: 'Snapshot',
      snapLater_vmdk: 'Another snapshot',
      two_qcow2: 'two snapshots',
      two_vhdx: 'two checkpoints',
      two_vmdk: 'two snapshots',
      what_vhdx: 'the checkpoint',
      what_vmdk: 'the snapshot',
      what_qcow2: 'the snapshot',
      commitHead_qcow2: 'Commit (merge down) of {L} into {P}.',
      commitHead_vhdx: 'The first checkpoint is deleted: Hyper-V merges {L} into {P}.',
      commitHead_vmdk: 'The first snapshot is deleted: its file {L} is consolidated into {P}.',
      termOverlay: 'overlay',
      termOverlayLater: 'overlay',
      termBacking: 'backing file',
      termBackingLater: 'backing file',
      termCow: 'copy-on-write',
      termCowLater: 'copy-on-write',

      capStart: 'Start: the VM writes straight to {base}. Blocks 0–3 are allocated (A–D); 4–7 were never written.',
      capSnap: '{what}: {old} becomes read-only. On top of it comes {new}, an empty {overlay}, with {old} as its ' +
        '{backing}. Nothing is copied: {new} holds 0 blocks and the VM sees the same.',
      capBuild: 'The chain in one step: {two} and four writes. The VM writes to {s2}; {s1} and {base} are only read. Each ' +
        'layer holds only the blocks written while it was active.',
      capWrite: 'The VM writes block {b} = {v}. The write goes only to the active layer {file}; the layers below never ' +
        'change ({cow}).',
      capHides: 'The old {old} in {lower} stays, only hidden.',
      capCommitCopy: ['Step 1 of 3: {n} block of {L} is copied into {P}: {list}.', 'Step 1 of 3: {n} blocks of {L} are copied into {P}: {list}.'],
      capOverwrite: ['Block {list} in {P} is overwritten ({chg}): the block from {L} wins.', 'Blocks {list} in {P} are overwritten ({chg}): the blocks from {L} win.'],
      capSame: 'What the VM sees has not changed.',
      capRepoint: 'Step 2 of 3: {C} is re-pointed to {P}, which becomes its backing file. Nothing reads {L} any more.',
      capRemove: 'Step 3 of 3: {L} is removed. The chain is one file shorter, and the VM sees the same.',
      capNotLost: 'Deleting {what} lost no data: it was merged into {P}.',
      capStreamHead: 'Stream (pull up) of {L} into {C}.',
      capStreamCopy: ['Step 1 of 3: {n} block of {L} is copied into {C}, the one {C} lacks: {list}.',
        'Step 1 of 3: {n} blocks of {L} are copied into {C}, the ones {C} lacks: {list}.'],
      capStreamKept: ['Block {list} is not copied: {C} has its own ({own}), and that one wins.', 'Blocks {list} are not copied: {C} has its own ({own}), and those win.'],
      capBaseSame: '{P} is not touched.',
      capDelete: 'The file {L} is deleted without a merge. {C} backs on it, so the chain is broken: the image cannot be ' +
        'opened and the VM does not start. Blocks {list} of {L} are lost.',
      capByHand: 'Deleting {what} would have merged the data; here the file itself was deleted.',
      capReadMiss: 'Read block {b}: {file} does not have it, so the read falls through to its backing file {next}.',
      capReadHit: 'Read block {b}: {file} has it, {v}.',
      capVisited: ['Layers visited: {n}.', 'Layers visited: {n}.'],
      capReadOlder: 'Lower layers hold older contents ({old}), but the read never gets there.',
      capReadZero: 'Read block {b}: {file} does not have it either, and there is nothing below: the block reads as zeros.',
      capReadFail: 'Read block {b} falls through to {file}, and that file is gone: the read fails. Base alone still gives ' +
        'A B C D, but what was written to {L} and {C} is out of reach.',

      explain: '<p>A virtual machine\'s disk can be a <b>chain of files</b>. The base image sits at the bottom, and each ' +
        'snapshot adds an empty overlay whose backing file is the old top. The VM writes only to the top, active layer: ' +
        'a written block is allocated there, and the layers below never change.</p>' +
        '<p><b>A read falls through the chain:</b> it starts at the active layer and goes down until a layer has the ' +
        'block. If none has it, the block reads as zeros.</p>' +
        '<p><b>Committing</b> a middle layer into its backing file (commit, merge, consolidate) copies its blocks down, ' +
        're-points the child and removes the layer. <b>Streaming</b> copies up only the blocks the child lacks. Either way ' +
        'the VM sees the same disk. A commit is refused when the lower layer has another child: that child\'s disk would ' +
        'change under it.</p>' +
        '<p>A file deleted <b>without a merge</b> breaks the chain: every layer above it loses its footing and the image ' +
        'cannot be opened. That is why deleting a checkpoint or snapshot in the manager merges the data rather than ' +
        'deleting it.</p>' +
        '<p>Common mistakes: a snapshot is not a copy of the disk (it is an empty layer that grows); deleting a snapshot ' +
        'does not delete its data (it merges it); a snapshot is not a backup, because it dies with its base image.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
