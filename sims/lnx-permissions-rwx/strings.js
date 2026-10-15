/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Devet bitova dozvola: chmod i umask',

      kind: 'Vrsta',
      kindFile: 'datoteka',
      kindDir: 'direktorij',
      before: 'Početne dozvole',
      beforeHint: 'Ili klikni bit u traci.',
      cmd: 'Naredba',
      cmdNone: '— bez naredbe',
      cmdLabel: 'chmod {op}',
      umask: 'Maska (umask)',
      umaskHint: 'Vrijedi samo za ono što se stvori poslije.',

      presetTouch: 'touch, maska 022',
      presetTouchHint: 'Nova datoteka: -rw-r--r-- (644)',
      presetChmod640: 'chmod 640',
      presetChmod640Hint: '644 → -rw-r----- (640)',
      presetSymbolic: 'chmod u+x,g-r',
      presetSymbolicHint: '640 → -rwx------ (700)',
      presetOctalErases: 'Oktalni briše x',
      presetOctalErasesHint: '700 i chmod 640: izvršni bit vlasnika nestaje',
      presetUmask077: 'umask 077',
      presetUmask077Hint: 'Nova datoteka: -rw------- (600), ne 567',
      presetDir: 'Novi direktorij',
      presetDirHint: 'mkdir, maska 022: drwxr-xr-x (755)',

      legendSet: 'postavljen',
      legendClear: 'nije postavljen',
      legendChanged: 'promijenjen',
      legendMasked: 'obrisala ga maska',

      chmodFile: 'Postojeća datoteka: chmod',
      chmodDir: 'Postojeći direktorij: chmod',
      createFile: 'Nova datoteka: umask',
      createDir: 'Novi direktorij: umask',
      fileName: 'proba',
      dirName: 'projekt',
      newName: 'nova',

      stripBefore: 'prije',
      stripAfter: 'poslije',
      stripBaseFile: 'touch traži',
      stripBaseDir: 'mkdir traži',
      stripMask: 'maska briše',
      stripCreatedFile: 'nova datoteka dobiva',
      stripCreatedDir: 'novi direktorij dobiva',
      gOwner: 'vlasnik',
      gGroup: 'grupa',
      gOther: 'ostali',

      nLs: 'ls -l',
      nOctal: 'oktalno',
      nSymbolic: 'simbolički',

      noCmd: 'bez naredbe: klikni bit ili odaberi naredbu',
      formOctal: 'oktalni zapis: piše svih devet bitova (▬)',
      formSymbolic: ['simbolički način: piše samo {n} imenovani bit (▬)', 'simbolički način: piše samo {n} imenovana bita (▬)', 'simbolički način: piše samo {n} imenovanih bitova (▬)'],
      xFile: 'x kod datoteke: izvršavanje, smije se pokrenuti kao program',
      xDir: 'x kod direktorija: pretraživanje, kroz njega se smije proći',

      mathClear: 'brisanje bitova',
      mathSub: 'oduzimanje',
      subWrong: 'krivo',
      subAgrees: 'ovdje slučajno isto',
      noEffect: 'x u maski ne djeluje: {base} nema x',

      permR: 'čitanje',
      permW: 'pisanje',
      permX: 'izvršavanje',
      permS: 'pretraživanje',
      cellOn: '{who}, {perm}: postavljen',
      cellOff: '{who}, {perm}: nije postavljen',
      cellClick: '{label}. Klik mijenja bit.',

      bitName: '{perm} {who}',
      bitR: 'bit čitanja',
      bitW: 'bit pisanja',
      bitX: 'izvršni bit',
      bitS: 'bit pretraživanja',
      ofOwner: 'vlasnika',
      ofGroup: 'grupe',
      ofOther: 'ostalih',

      cNone: 'Bez naredbe: {name} ima {ls} = {oct} = {sym}. Klikni bit ili odaberi naredbu.',
      cOctalLost: '{cmd} piše svih devet bitova: {bit} nestao je, iako ga nitko nije spomenuo.',
      cOctalLostN: ['{cmd} piše svih devet bitova: nestao je {n} postavljeni bit, iako ga nitko nije spomenuo.', '{cmd} piše svih devet bitova: nestala su {n} postavljena bita, iako ih nitko nije spomenuo.', '{cmd} piše svih devet bitova: nestalo je {n} postavljenih bitova, iako ih nitko nije spomenuo.'],
      cOctalZero: ['{cmd} piše svih devet bitova: znamenka 0 obrisala je {n} bit, kako je i traženo.', '{cmd} piše svih devet bitova: znamenka 0 obrisala je {n} bita, kako je i traženo.', '{cmd} piše svih devet bitova: znamenka 0 obrisala je {n} bitova, kako je i traženo.'],
      cOctalKeep: '{cmd} piše svih devet bitova: ishod je {oct} bez obzira na zatečeno stanje.',
      cSymChanged: ['{cmd} dira samo imenovane bitove: promijenio se {n} bit, drugi su bitovi ostali kakvi su bili.', '{cmd} dira samo imenovane bitove: promijenila su se {n} bita, drugi su bitovi ostali kakvi su bili.', '{cmd} dira samo imenovane bitove: promijenilo se {n} bitova, drugi su bitovi ostali kakvi su bili.'],
      cSymSame: '{cmd} dira samo imenovane bitove, a oni su već bili takvi: ništa se nije promijenilo.',
      cMask: 'Maska {mask} ne oduzima broj od {base}: briše bitove, pa {thing} ima {created}.',
      cAgree: ['Maska {mask} briše {n} bit iz {base}, pa {thing} ima {created}; oduzimanje bi ovdje slučajno dalo isto.', 'Maska {mask} briše {n} bita iz {base}, pa {thing} ima {created}; oduzimanje bi ovdje slučajno dalo isto.', 'Maska {mask} briše {n} bitova iz {base}, pa {thing} ima {created}; oduzimanje bi ovdje slučajno dalo isto.'],
      cZero: 'Maska {mask} ne briše ništa: {thing} ima {created}.',
      cNoEffect: 'Bitovi x u maski ne djeluju na datoteku: {base} ih ni nema.',
      thingFile: 'nova datoteka',
      thingDir: 'novi direktorij',

      explain:
        '<p>Uz svaku datoteku stoji [[file permission]], zapisana u devet bitova: po tri za vlasnika, za grupu i za ' +
        'ostale, u svakoj skupini redom čitanje (<code>r</code>), pisanje (<code>w</code>) i izvršavanje (<code>x</code>). Slovo znači ' +
        'da je bit postavljen, crtica da nije. Prvi znak ispisa <code>ls -l</code> nije dozvola nego vrsta: ' +
        '<code>-</code> za datoteku, <code>d</code> za direktorij.</p>' +
        '<p>Istu vrijednost drugim zapisom daje [[octal mode]]: po skupini zbroj čitanje 4, pisanje 2, izvršavanje 1, pa je ' +
        '<code>rw-r-----</code> isto što i 640. <i lang="en">Symbolic mode</i> (simbolički način) piše isto treći put: ' +
        '<code>u=rw,g=r,o=</code>.</p>' +
        '<p><code>chmod</code> s oktalnim brojem upisuje svih devet bitova; zatečeno stanje ne sudjeluje, pa ' +
        '<code>chmod 640</code> na <code>rwx------</code> briše i izvršni bit. Simbolički <code>+</code> i ' +
        '<code>-</code> diraju samo imenovane bitove; <code>=</code> najprije obriše imenovanu skupinu.</p>' +
        '<p><i lang="en">File mode creation mask</i> (maska stvaranja, <code>umask</code>) kaže što se novoj datoteci ' +
        'oduzima. <code>touch</code> traži 666, <code>mkdir</code> 777, a sustav briše bitove koji su u maski: 666 uz ' +
        '077 daje 600, a ne 567, jer to nije oduzimanje brojeva. Maska je svojstvo ljuske i vrijedi samo za ono što se ' +
        'u njoj stvori poslije; postojeće datoteke ne mijenja.</p>' +
        '<p>Kod direktorija <code>x</code> znači <i lang="en">search</i> (dozvola pretraživanja): kroz direktorij se ' +
        'smije proći prema onome što je u njemu, a ne „pokrenuti“ ga.</p>' +
        '<p>Šire: <code>umask</code> prima i simbolički zapis, a ondje <code>+</code> briše bit iz maske, ' +
        '<code>-</code> ga postavlja. Obje se obrnutosti ponište, pa <code>umask u+w</code> pisanje daje, kao i ' +
        '<code>chmod u+w</code>. Četvrta znamenka (posebni bitovi) i provjera pristupa obrađeni su u drugim simulatorima.</p>'
    },

    en: {
      stage: 'Nine permission bits: chmod and umask',

      kind: 'Kind',
      kindFile: 'file',
      kindDir: 'directory',
      before: 'Starting mode',
      beforeHint: 'Or click a bit in the strip.',
      cmd: 'Command',
      cmdNone: '— no command',
      cmdLabel: 'chmod {op}',
      umask: 'Mask (umask)',
      umaskHint: 'Applies only to what is created afterwards.',

      presetTouch: 'touch, umask 022',
      presetTouchHint: 'New file: -rw-r--r-- (644)',
      presetChmod640: 'chmod 640',
      presetChmod640Hint: '644 → -rw-r----- (640)',
      presetSymbolic: 'chmod u+x,g-r',
      presetSymbolicHint: '640 → -rwx------ (700)',
      presetOctalErases: 'Octal erases x',
      presetOctalErasesHint: '700 and chmod 640: the owner\'s execute bit goes',
      presetUmask077: 'umask 077',
      presetUmask077Hint: 'New file: -rw------- (600), not 567',
      presetDir: 'New directory',
      presetDirHint: 'mkdir, umask 022: drwxr-xr-x (755)',

      legendSet: 'set',
      legendClear: 'clear',
      legendChanged: 'changed',
      legendMasked: 'cleared by the mask',

      chmodFile: 'An existing file: chmod',
      chmodDir: 'An existing directory: chmod',
      createFile: 'A new file: umask',
      createDir: 'A new directory: umask',
      fileName: 'test',
      dirName: 'project',
      newName: 'new',

      stripBefore: 'before',
      stripAfter: 'after',
      stripBaseFile: 'touch asks for',
      stripBaseDir: 'mkdir asks for',
      stripMask: 'the mask clears',
      stripCreatedFile: 'the new file gets',
      stripCreatedDir: 'the new directory gets',
      gOwner: 'owner',
      gGroup: 'group',
      gOther: 'others',

      nLs: 'ls -l',
      nOctal: 'octal',
      nSymbolic: 'symbolic',

      noCmd: 'no command: click a bit or pick a command',
      formOctal: 'octal: writes all nine bits (▬)',
      formSymbolic: ['symbolic: writes only the {n} named bit (▬)', 'symbolic: writes only the {n} named bits (▬)'],
      xFile: 'x on a file: execute, it may be run as a program',
      xDir: 'x on a directory: search, it may be passed through',

      mathClear: 'clearing bits',
      mathSub: 'subtraction',
      subWrong: 'wrong',
      subAgrees: 'happens to agree here',
      noEffect: 'x in the mask does nothing: {base} has no x',

      permR: 'read',
      permW: 'write',
      permX: 'execute',
      permS: 'search',
      cellOn: '{who}, {perm}: set',
      cellOff: '{who}, {perm}: clear',
      cellClick: '{label}. Click to flip the bit.',

      bitName: '{who} {perm}',
      bitR: 'read bit',
      bitW: 'write bit',
      bitX: 'execute bit',
      bitS: 'search bit',
      ofOwner: 'the owner\'s',
      ofGroup: 'the group\'s',
      ofOther: 'the others\'',

      cNone: 'No command: {name} has {ls} = {oct} = {sym}. Click a bit or pick a command.',
      cOctalLost: '{cmd} writes all nine bits: {bit} is gone though nobody named it.',
      cOctalLostN: ['{cmd} writes all nine bits: {n} set bit is gone though nobody named it.', '{cmd} writes all nine bits: {n} set bits are gone though nobody named them.'],
      cOctalZero: ['{cmd} writes all nine bits: a 0 digit cleared {n} bit, as asked.', '{cmd} writes all nine bits: a 0 digit cleared {n} bits, as asked.'],
      cOctalKeep: '{cmd} writes all nine bits: the result is {oct} whatever was there before.',
      cSymChanged: ['{cmd} touches only the named bits: {n} bit changed, the rest stayed as they were.', '{cmd} touches only the named bits: {n} bits changed, the rest stayed as they were.'],
      cSymSame: '{cmd} touches only the named bits, and they were already so: nothing changed.',
      cMask: 'Umask {mask} doesn\'t subtract from {base}: it clears bits, so {thing} gets {created}.',
      cAgree: ['Umask {mask} clears {n} bit of {base}, so {thing} gets {created}; subtracting would happen to give the same here.', 'Umask {mask} clears {n} bits of {base}, so {thing} gets {created}; subtracting would happen to give the same here.'],
      cZero: 'Umask {mask} clears nothing: {thing} gets {created}.',
      cNoEffect: 'The x bits of the mask do nothing to a file: {base} has none.',
      thingFile: 'the new file',
      thingDir: 'the new directory',

      explain:
        '<p>Every file carries a [[file permission]] written in nine bits: three for the owner, the group and others, ' +
        'each group in the order read (<code>r</code>), write (<code>w</code>) and execute (<code>x</code>). A letter is a set bit, a ' +
        'dash a clear one. The first character of <code>ls -l</code> is not a permission but the type: <code>-</code> ' +
        'for a file, <code>d</code> for a directory.</p>' +
        '<p>The [[octal mode]] is the same value written another way: per group the sum of read 4, write 2, execute 1, so ' +
        '<code>rw-r-----</code> is 640. Symbolic mode writes it a third time: <code>u=rw,g=r,o=</code>.</p>' +
        '<p><code>chmod</code> with an octal number writes all nine bits; what was there plays no part, so ' +
        '<code>chmod 640</code> on <code>rwx------</code> also clears the execute bit. Symbolic <code>+</code> and ' +
        '<code>-</code> touch only the named bits; <code>=</code> first clears the named class.</p>' +
        '<p>The file mode creation mask (<code>umask</code>) says what a new file loses. <code>touch</code> asks for ' +
        '666, <code>mkdir</code> for 777, and the system clears the bits that are in the mask: 666 with 077 gives 600, ' +
        'not 567, because it is not a subtraction of numbers. The mask belongs to the shell and applies only to what ' +
        'is created in it afterwards; existing files keep their mode.</p>' +
        '<p>On a directory <code>x</code> means search: the directory may be passed through on the way to what is in ' +
        'it, not "run".</p>' +
        '<p>Further: <code>umask</code> also takes a symbolic mode, and there <code>+</code> clears a bit in the mask ' +
        'and <code>-</code> sets it. The two inversions cancel, so <code>umask u+w</code> grants write, just like ' +
        '<code>chmod u+w</code>. The fourth digit (the special bits) and the access check are covered in other simulators.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
