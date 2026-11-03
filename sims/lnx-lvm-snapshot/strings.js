/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-lvm-snapshot, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term the page sets in italics (<em lang="en">): the
   Croatian term rule for terms the glossary lacks (NOTES.md, Term pairs). LV and VG names, chunk labels, lvs output and
   Data% numbers are data and come in as placeholders. The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Izvorni volumen, područje snimke, snimka kako je čita čitač i slobodan prostor grupe volumena',
      gridTitle: 'Grupa volumena',
      chunksOf: ['izvorni volumen: {n} komad', 'izvorni volumen: {n} komada', 'izvorni volumen: {n} komada'],
      slotNote: 'jedno mjesto = jedan komad',
      roleOrigin: 'izvorni volumen',
      roleCow: 'područje snimke: {used} od {cap}',
      roleCowLost: 'nevaljana: sadržaj izgubljen',
      rowReader: 'čitanje snimke',
      roleReader: 'kako je vidi čitač',
      roleReaderLost: 'čitanje ne uspijeva',
      rowVg: 'VG slobodno',
      roleVg: ['{n} mjesto', '{n} mjesta', '{n} mjesta'],
      roleVgNone: 'nema slobodnog prostora',
      meterLabel: 'Data%',
      meterTick: 'prag {p}',
      next: 'Sljedeće:',
      nextNone: 'Kraj scenarija.',
      ioWrite: 'pisanje u {c} na {lv}',
      ioRead: 'čitanje {c} iz {lv}',
      ioAuto: 'automatsko proširenje: uključeno, prag {th} %, +{pc} %',
      lvsNote: 'lvs, skraćeno',
      pct: '{p} %',
      dec: ',',

      cap: 'Mjesta u području snimke',
      autoextend: 'Automatsko proširenje',
      threshold: 'Prag proširenja (%)',
      percent: 'Proširenje za (%)',
      vgFree: 'Slobodno u grupi volumena',
      scene: 'Scenarij',

      presetFill: 'Snimka se puni',
      presetFillHint: 'Šest pisanja u različite komade, četiri mjesta: peto pisanje poništi snimku.',
      presetSame: 'Isti komadi',
      presetSameHint: 'Deset pisanja u A i B: Data% stane na 50 %.',
      presetAuto: 'Automatsko proširenje',
      presetAutoHint: 'Prag 70 %, +50 %: snimka naraste dvaput i sve stane.',
      presetSnapWrite: 'Pisanje u snimku',
      presetSnapWriteHint: 'I pisanja u samu snimku troše njezina mjesta.',
      presetBackup: 'Prozor sigurnosne kopije',
      presetBackupHint: 'Kopija čita snimku dok aplikacija piše; snimka se napuni prije kraja.',

      legChanged: 'promijenjeno u ovom koraku',
      legOrigin: 'komad izvornog volumena',
      legSaved: 'spremljena stara verzija',
      legOwn: 'vlastito pisanje snimke',
      legFree: 'slobodno mjesto',
      legThrough: 'čita se s izvornog volumena',
      legDead: 'nevaljana snimka',
      legLink: 'kopija ili čitanje ovog koraka',

      termSnap: '*snapshot* (snimka)',
      termCow: '*copy-on-write* (kopiranje pri pisanju)',
      termInvalid: 'nevaljana',

      capStart: 'Izvorni volumen {lv} upravo je snimljen: {snap} {snap0} dobila je područje za {cow} od {n}, zasad prazno (Data% {pct}). Snimka ništa ne kopira unaprijed; dok se komad ne promijeni, čita se s izvornog volumena.',
      capSlots: ['{n} mjesto', '{n} mjesta', '{n} mjesta'],
      capFirst: 'Prvo pisanje u komad {c}: stari {old} kopiran je u područje snimke ({used} od {cap} mjesta, {pct}). Ponovno pisanje u {c} više ne troši mjesto.',
      capAgain: 'Pisanje u {c}: {c} je već u području snimke, pa nije potrošeno novo mjesto (i dalje {used} od {cap}, {pct}). Izvorni volumen sada ima {now}, a čitanje snimke i dalje daje {old}.',
      capOwnAgain: 'Pisanje u {c}: snimka već drži svoj {old}, pa nije potrošeno novo mjesto ({used} od {cap}, {pct}). Izvorni volumen sada ima {now}.',
      capSnapNew: 'Pisanje u samu snimku, komad {c}: snimka sprema svoj {new} u svoje područje ({used} od {cap} mjesta, {pct}). Izvorni volumen i dalje ima {orig}.',
      capSnapAgain: 'Pisanje u samu snimku, komad {c}: {c} je već u njezinu području, pa se prepisuje isto mjesto ({used} od {cap}, {pct}).',
      capFull: 'Područje je puno: sljedeći novi komad poništit će snimku.',
      capGrew: 'Data% {was} > prag {th} %: područje je naraslo za {g} na {cap} (Data% {pct}; slobodno u grupi volumena: {vg}).',
      capShort: 'Data% {was} > prag {th} %, ali grupa volumena ima slobodno {vg}, a treba {want}: ništa ne raste.',
      capInvalid: 'Pisanje u {c} treba mjesto {k}, a područje ih ima {cap}: snimka je {invalid} ({attr}). Sav njezin sadržaj je izgubljen.',
      capInvalidOrigin: 'Izvorni volumen primio je pisanje ({now}) i radi dalje.',
      capInvalidSnap: 'Ni to pisanje u snimku nije spremljeno.',
      capAfterOrigin: 'Pisanje u {c}: izvorni volumen ({now}) radi kao da snimke nema. Nevaljana snimka ne prima kopije i ne može se čitati.',
      capAfterSnap: 'Pisanje u snimku, komad {c}: snimka je nevaljana, pisanje ne uspijeva (I/O pogreška).',
      capReadOrigin: 'Sigurnosna kopija čita {c} iz snimke: {c} nije mijenjan, pa snimka nema svoju kopiju i čitanje ide na izvorni volumen ({ver}).',
      capReadCow: 'Sigurnosna kopija čita {c} iz snimke: izvorni volumen sada ima {now}, ali snimka vraća stari {ver} iz svog područja. Tako snimka pokazuje stanje iz trenutka kad je uzeta.',
      capReadOwn: 'Čitanje {c} iz snimke vraća njezin vlastiti {ver} iz područja snimke.',
      capReadLost: 'Sigurnosna kopija čita {c} iz snimke: snimka je nevaljana, čitanje ne uspijeva (I/O pogreška). Kopija je nepotpuna, iako izvorni volumen ima sve podatke.',

      explain:
        '<p>Klasični (debeli) <em lang="en">snapshot</em> (snimka) u LVM-u je zaseban [[logical volume]] s vlastitim ' +
        'područjem stalne veličine, zadane pri <code translate="no">lvcreate -s -L</code>. U trenutku snimanja ništa se ne ' +
        'kopira. Kad se komad izvornog volumena prvi put promijeni, njegova se stara verzija najprije kopira u područje ' +
        'snimke (<em lang="en">copy-on-write</em>, kopiranje pri pisanju), pa se tek onda prepiše. Ponovno pisanje u isti ' +
        'komad ne troši novo mjesto. Čitač snimke dobiva komad iz njezina područja ako ga ima, inače s izvornog volumena.</p>' +
        '<p><code translate="no">lvs</code> pokazuje koliko je područja zauzeto (Data%). Kad pisanje treba mjesto više nego ' +
        'što ga ima, snimka postaje nevaljana (<code translate="no">swi-I-s---</code>): sav njezin sadržaj je izgubljen, a ' +
        'izvorni volumen radi dalje kao da se ništa nije dogodilo. Automatsko proširenje (prag i postotak u ' +
        '<code translate="no">lvm.conf</code>, uz nadzor LVM-a) može povećati područje iz slobodnog prostora grupe ' +
        'volumena, ali samo dok ga ima.</p>' +
        '<p>Česte zablude: snimka ne mora biti velika kao izvorni volumen, nego koliko će se promijeniti dok postoji. ' +
        'Snimka nije sigurnosna kopija: živi u istoj grupi volumena i nestaje kad se napuni. Puna snimka ne usporava i ne ' +
        'zaustavlja izvorni volumen; gubi se samo snimka.</p>' +
        '<p>Pojednostavljeno: jedno mjesto ovdje je jedan komad (stvarni komadi su 4 KiB do 512 KiB, a <em lang="en">extent</em> ' +
        'od 4 MiB drži ih mnogo); Data% ne broji metapodatke područja; proširenje se provjerava nakon svakog pisanja, a ' +
        'stvarni nadzor provjerava periodički. Tanke snimke rade drukčije (zaseban simulator).</p>'
    },

    en: {
      stage: 'The origin volume, the snapshot area, the snapshot as a reader sees it and the volume group\'s free space',
      gridTitle: 'Volume group',
      chunksOf: ['origin: {n} chunk', 'origin: {n} chunks'],
      slotNote: 'one slot = one chunk',
      roleOrigin: 'origin volume',
      roleCow: 'snapshot area: {used} of {cap}',
      roleCowLost: 'invalid: content lost',
      rowReader: 'reading snap',
      roleReader: 'as a reader sees it',
      roleReaderLost: 'reads fail',
      rowVg: 'VG free',
      roleVg: ['{n} slot', '{n} slots'],
      roleVgNone: 'no free space',
      meterLabel: 'Data%',
      meterTick: 'threshold {p}',
      next: 'Next:',
      nextNone: 'End of the scenario.',
      ioWrite: 'write {c} to {lv}',
      ioRead: 'read {c} from {lv}',
      ioAuto: 'autoextend: on, threshold {th}%, +{pc}%',
      lvsNote: 'lvs, shortened',
      pct: '{p}%',
      dec: '.',

      cap: 'Slots in the snapshot area',
      autoextend: 'Autoextend',
      threshold: 'Autoextend threshold (%)',
      percent: 'Grow by (%)',
      vgFree: 'Free in the volume group',
      scene: 'Scenario',

      presetFill: 'The snapshot fills up',
      presetFillHint: 'Six writes to different chunks, four slots: write 5 invalidates the snapshot.',
      presetSame: 'Same chunks',
      presetSameHint: 'Ten writes to A and B: Data% stops at 50%.',
      presetAuto: 'Autoextend',
      presetAutoHint: 'Threshold 70%, +50%: the snapshot grows twice and everything fits.',
      presetSnapWrite: 'Writing to the snapshot',
      presetSnapWriteHint: 'Writes into the snapshot itself use its slots too.',
      presetBackup: 'Backup window',
      presetBackupHint: 'A backup reads the snapshot while the application writes; the snapshot fills before the end.',

      legChanged: 'changed in this step',
      legOrigin: 'origin chunk',
      legSaved: 'saved old version',
      legOwn: 'snapshot\'s own write',
      legFree: 'free slot',
      legThrough: 'read from the origin',
      legDead: 'invalid snapshot',
      legLink: 'this step\'s copy or read',

      termSnap: 'snapshot',
      termCow: 'copy-on-write',
      termInvalid: 'invalid',

      capStart: 'A {snap} {snap0} of the origin {lv} was just taken: its area for {cow} has {n} and is empty (Data% {pct}). The snapshot copies nothing up front; until a chunk changes, it is read from the origin.',
      capSlots: ['{n} slot', '{n} slots'],
      capFirst: 'First write to chunk {c}: the old {old} was copied into the snapshot area ({used} of {cap} slots, {pct}). Writing {c} again takes no more space.',
      capAgain: 'Write to {c}: {c} is already in the snapshot area, so no new slot is used (still {used} of {cap}, {pct}). The origin now holds {now}; the snapshot still reads {old}.',
      capOwnAgain: 'Write to {c}: the snapshot already holds its own {old}, so no new slot is used ({used} of {cap}, {pct}). The origin now holds {now}.',
      capSnapNew: 'Write into the snapshot itself, chunk {c}: the snapshot stores its {new} in its own area ({used} of {cap} slots, {pct}). The origin still holds {orig}.',
      capSnapAgain: 'Write into the snapshot itself, chunk {c}: {c} is already in its area, so the same slot is rewritten ({used} of {cap}, {pct}).',
      capFull: 'The area is full: the next new chunk will invalidate the snapshot.',
      capGrew: 'Data% {was} > threshold {th}%: the area grew by {g} to {cap} (Data% {pct}, {vg} left in the volume group).',
      capShort: 'Data% {was} > threshold {th}%, but the volume group has {vg} free and {want} are needed: nothing grows.',
      capInvalid: 'The write to {c} needs slot {k}, and the area has {cap}: the snapshot is {invalid} ({attr}). All of its content is lost.',
      capInvalidOrigin: 'The origin took the write ({now}) and goes on.',
      capInvalidSnap: 'This write into the snapshot was not stored either.',
      capAfterOrigin: 'Write to {c}: the origin ({now}) runs as if there were no snapshot. An invalid snapshot takes no copies and cannot be read.',
      capAfterSnap: 'Write into the snapshot, chunk {c}: the snapshot is invalid, the write fails (I/O error).',
      capReadOrigin: 'The backup reads {c} from the snapshot: {c} has not changed, so the snapshot has no copy of it and the read goes to the origin ({ver}).',
      capReadCow: 'The backup reads {c} from the snapshot: the origin now holds {now}, but the snapshot returns the old {ver} from its area. That is how the snapshot shows the moment it was taken.',
      capReadOwn: 'Reading {c} from the snapshot returns its own {ver} from the snapshot area.',
      capReadLost: 'The backup reads {c} from the snapshot: the snapshot is invalid, the read fails (I/O error). The backup is incomplete, although the origin has all the data.',

      explain:
        '<p>A classic (thick) LVM snapshot is a separate [[logical volume]] with its own area of fixed size, set at ' +
        '<code translate="no">lvcreate -s -L</code>. Nothing is copied when it is taken. When a chunk of the origin ' +
        'changes for the first time, its old version is first copied into the snapshot area (copy-on-write), and only then ' +
        'overwritten. Writing the same chunk again takes no new slot. A reader of the snapshot gets the chunk from its area ' +
        'if it is there, else from the origin.</p>' +
        '<p><code translate="no">lvs</code> shows how much of the area is used (Data%). When a write needs one slot more ' +
        'than there are, the snapshot becomes invalid (<code translate="no">swi-I-s---</code>): all of its content is ' +
        'lost, and the origin goes on as if nothing happened. Autoextend (a threshold and a percentage in ' +
        '<code translate="no">lvm.conf</code>, with LVM monitoring on) can grow the area from the volume group\'s free ' +
        'space, but only while there is some.</p>' +
        '<p>Common mistakes: a snapshot need not be as big as the origin, only as big as what changes while it exists. A ' +
        'snapshot is not a backup: it lives in the same volume group and is gone when it fills. A full snapshot does not ' +
        'slow down or stop the origin; only the snapshot is lost.</p>' +
        '<p>Simplified: a slot here is one chunk (real chunks are 4 KiB to 512 KiB, and a 4 MiB extent holds many); Data% ' +
        'leaves out the area\'s metadata; autoextend is checked after every write, while real monitoring checks ' +
        'periodically. Thin snapshots work differently (a separate simulator).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
