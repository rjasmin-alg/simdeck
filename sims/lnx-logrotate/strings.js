/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-logrotate, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term
   (first mention; [[=term]] later ones). File names, inode numbers and directives are data: the page puts them in
   translate="no" elements. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Rotacija /var/log/messages dok zapisivač piše',

      // params
      method: 'Način rotacije (reload u postrotate)',
      methodCreateReload: 'create + reload',
      methodCreate: 'create',
      methodCopytruncate: 'copytruncate',
      rotate: 'rotate (čuvanih inačica)',
      dateext: 'dateext (datum u imenu)',
      compress: 'compress',
      delaycompress: 'delaycompress',
      linesPerCycle: 'Redaka po tjednu',
      writeDuringRotation: 'Redak stiže usred rotacije',
      cycles: 'Tjedana',

      // presets
      'preset_book-config': 'Iz knjige',
      'preset_book-config_hint': 'weekly, rotate 4, create, dateext, reload u postrotate',
      'preset_numbers-compress': 'Brojevi + compress',
      'preset_numbers-compress_hint': 'bez dateext, rotate 3, compress: .1.gz, .2.gz, .3.gz',
      'preset_forgot-reload': 'Bez reloada',
      'preset_forgot-reload_hint': 'create bez postrotate: zapisivač piše u messages.1',
      'preset_copytruncate-loss': 'copytruncate',
      'preset_copytruncate-loss_hint': 'redak između kopije i skraćivanja nestaje',
      preset_delaycompress: 'delaycompress',
      preset_delaycompress_hint: 'messages.1 ostaje nekomprimiran jedan tjedan',
      'preset_still-open': 'Uklonjen, otvoren',
      'preset_still-open_hint': 'rotate 1 bez reloada: uklonjena datoteka i dalje zauzima prostor',

      // legend
      legLive: 'dnevnik u koji se piše',
      legOld: 'stara inačica',
      legGz: 'komprimirano (.gz)',
      legGone: 'uklonjeno sada',
      legDeleted: 'obrisano, a otvoreno',
      legFd: 'opisnik',
      legLost: 'izgubljen redak',
      legChanged: 'promijenjeno',

      // stage
      writerTitle: 'Zapisivač sustava',
      writerPid: 'PID {pid}',
      writerSel: 'piše poruke ovog selektora u',
      writerFd: 'otvoreni opisnik → i-čvor {inode}',
      writerWrote: ['upisao {n} redak', 'upisao {n} retka', 'upisao {n} redaka'],
      fd: 'fd',
      listTitle: 'Unosi u direktoriju → i-čvorovi',
      inode: 'i-čvor {inode}',
      linesN: ['{n} redak', '{n} retka', '{n} redaka'],
      empty: 'prazno',
      deletedName: '(obrisan, otvoren)',
      deletedWas: 'bio {name}',
      removedTag: 'uklonjen',
      lrTitle: 'logrotate',
      lrDirectives: 'Postavke za /var/log/messages',
      lrStatus: 'logrotate.status: zadnja rotacija {date} (dan {day})',
      lrRun: 'Pokretanje na dan {day}, redom:',
      lrWrite: 'Danas se ne pokreće: zapisivač samo piše.',
      lrStart: 'Prvo pokretanje je na dan 7.',
      reloadDirective: 'postrotate: reload zapisivača',
      opRename: 'preimenuj {from} → {to}',
      opShift: 'pomakni stare inačice, od najvišeg broja:',
      opRenameKeeps: 'i-čvor {inode} ostaje isti',
      opCreate: 'stvori novi prazni {name}',
      opCreateInode: 'novi i-čvor {inode}',
      opCopy: 'kopiraj {from} → {to}',
      opCopyInode: ['novi i-čvor {inode}, {n} redak', 'novi i-čvor {inode}, {n} retka', 'novi i-čvor {inode}, {n} redaka'],
      opBetween: 'zapisivač upravo tada upiše {line}',
      opTruncate: 'skrati {name} na 0 redaka',
      opTruncateLost: 'redak {lines} izgubljen',
      opReload: 'postrotate: reload, zapisivač ponovno otvara messages',
      opReloadTo: 'opisnik → i-čvor {inode}',
      opFreed: 'zapisivač pušta i-čvor {inodes}: prostor se vraća',
      opCompress: 'komprimiraj {from} → {to}',
      opCompressOpen: 'zapisivač drži stari i-čvor {inode}',
      opRemove: 'ukloni {name}',
      opRemoveOpen: 'još otvoren: prostor se ne vraća',
      opNotDue: 'nije vrijeme: nije nedjelja, a od zadnje rotacije prošlo je manje od 7 dana',
      dayLabel: 'Dan {day}',
      rotations: ['{n} rotacija', '{n} rotacije', '{n} rotacija'],
      lostLabel: 'Izgubljeni reci:',
      lostNone: 'nijedan',

      // captions
      capStart: 'Početak: zapisivač sustava (PID {pid}) drži {log} otvorenim; njegov [[file descriptor]] pokazuje na i-čvor {inode}, ne na ime. Pritisni → za prvi tjedan.',
      capWrite: ['Dan {day}: zapisivač upisuje {n} redak u i-čvor {inode}', 'Dan {day}: zapisivač upisuje {n} retka u i-čvor {inode}', 'Dan {day}: zapisivač upisuje {n} redaka u i-čvor {inode}'],
      capWriteLive: ', a to je {log}.',
      capWriteOld: ', a to je sada {name}, ne {log}: nitko mu nije javio da je datoteka preimenovana.',
      capWriteDeleted: ', koji više nema imena: datoteka je uklonjena, ali ju zapisivač drži otvorenom, pa reci rastu, a prostor se ne vraća.',
      capRotCreateReload: 'Rotacija: {log} je preimenovan u {to}, a novi prazni {log} je stvoren. Zapisivač sustava i dalje piše u stari i-čvor dok ga reload ne natjera da datoteku ponovno otvori: to radi postrotate, pa opisnik sada pokazuje na novi i-čvor {inode}.',
      capRotCreate: 'Rotacija: {log} je preimenovan u {to}, a novi prazni {log} je stvoren. Bez reloada zapisivač i dalje piše u stari i-čvor {inode}.',
      capRotCreateOlder: 'Rotacija: {log} je preimenovan u {to}, a novi prazni {log} je stvoren. Bez reloada zapisivač i dalje piše u i-čvor {inode}, koji se sada zove {name}.',
      capRotCreateNoName: 'Rotacija: {log} je preimenovan u {to}, a novi prazni {log} je stvoren. Bez reloada zapisivač i dalje piše u i-čvor {inode}, koji više nema imena.',
      capRotCopy: 'Rotacija kopiranjem: {log} je kopiran u {to}, a zatim skraćen na mjestu. Zapisivač piše u isti i-čvor {inode} i ne treba mu reload.',
      capRotCopyLost: 'Rotacija kopiranjem: {log} je kopiran u {to}, a zatim skraćen na mjestu. Redak {line} stigao je između kopije i skraćivanja i izgubljen je.',
      capNotDue: 'logrotate se pokrenuo, ali nije nedjelja, a od zadnje rotacije nije prošlo 7 dana: ništa se ne mijenja.',
      capShift: ' Stare inačice pomaknute su za jedan broj, od najvišeg prema dolje.',
      capRemoved: [' {name} je bio višak tek trenutak: rotate {n} čuva {n} inačicu, a logrotate uklanja višak na kraju pokretanja.', ' {name} je bio višak tek trenutak: rotate {n} čuva {n} inačice, a logrotate uklanja višak na kraju pokretanja.', ' {name} je bio višak tek trenutak: rotate {n} čuva {n} inačica, a logrotate uklanja višak na kraju pokretanja.'],
      capRemovedDate: [' Najstariji datum, {name}, uklonjen je na kraju pokretanja: rotate {n} čuva {n} inačicu.', ' Najstariji datum, {name}, uklonjen je na kraju pokretanja: rotate {n} čuva {n} inačice.', ' Najstariji datum, {name}, uklonjen je na kraju pokretanja: rotate {n} čuva {n} inačica.'],
      capRemovedOpen: ' {name} je uklonjen, ali ga zapisivač drži otvorenim: i-čvor {inode} ostaje i prostor se ne vraća.',
      capCompressed: ' {from} je komprimiran u {to}.',
      capDelayed: ' delaycompress: {name} ostaje nekomprimiran do sljedećeg pokretanja.',
      capCompressedOpen: ' Komprimiranjem je i-čvor {inode} ostao bez imena, a zapisivač ga drži otvorenim.',
      capFreed: ' Reload je pustio obrisani i-čvor, pa se prostor vratio.',

      explain:
        '<p>[[log rotation]] zatvara dnevničku datoteku koja raste, zamjenjuje je novom i čuva zadan broj starih inačica. ' +
        'Ime u <code>/var/log</code> je [[directory entry]] koji pokazuje na i-čvor (<i>inode</i>), a zapisivač sustava piše ' +
        'kroz [[file descriptor]], koji pokazuje na i-čvor, a ne na ime.</p>' +
        '<p><b>create</b> preimenuje <code>messages</code> u <code>messages.1</code> i stvara novi prazni <code>messages</code>. ' +
        'Zapisivač i dalje piše u stari i-čvor, dakle u <code>messages.1</code>, dok mu reload u bloku <code>postrotate</code> ' +
        'ne kaže da datoteku ponovno otvori. Rotacija zato nije samo preimenovanje.</p>' +
        '<p><b>copytruncate</b> kopira sadržaj u <code>messages.1</code> i skraćuje (<i>truncate</i>) <code>messages</code> na ' +
        'mjestu. Zapisivač ostaje na istom i-čvoru i ne treba mu signal, ali redak koji stigne između kopije i skraćivanja ' +
        'nestaje.</p>' +
        '<p><b>rotate N</b> čuva N inačica. Bez <code>dateext</code> pomak ide od najvišeg broja prema dolje, a višak ' +
        '(<code>.N+1</code>) uklanja se tek na kraju pokretanja. <b>compress</b> komprimira novu inačicu nakon ' +
        '<code>postrotate</code>, a <b>delaycompress</b> ostavlja <code>.1</code> nekomprimiran do sljedećeg pokretanja, jer ' +
        'zapisivač možda još piše u njega.</p>' +
        '<p>Uklanjanje datoteke koju zapisivač drži otvorenom ne vraća prostor: nestaje samo ime. <code>weekly</code> rotira ' +
        'nedjeljom, ili kad je od zadnje rotacije zapisane u <code>/var/lib/logrotate/logrotate.status</code> prošlo najmanje 7 dana; ' +
        'dnevnik kojeg tamo još nema pri prvom se pokretanju samo upiše, bez rotacije. <code>weekly</code> i ' +
        '<code>rotate 4</code> daju otprilike mjesec dana povijesti.</p>'
    },
    en: {
      stage: 'Rotating /var/log/messages while the logger writes',

      method: 'Rotation method (reload in postrotate)',
      methodCreateReload: 'create + reload',
      methodCreate: 'create',
      methodCopytruncate: 'copytruncate',
      rotate: 'rotate (versions kept)',
      dateext: 'dateext (date in the name)',
      compress: 'compress',
      delaycompress: 'delaycompress',
      linesPerCycle: 'Lines per week',
      writeDuringRotation: 'A line arrives mid-rotation',
      cycles: 'Weeks',

      'preset_book-config': 'The book',
      'preset_book-config_hint': 'weekly, rotate 4, create, dateext, reload in postrotate',
      'preset_numbers-compress': 'Numbers + compress',
      'preset_numbers-compress_hint': 'no dateext, rotate 3, compress: .1.gz, .2.gz, .3.gz',
      'preset_forgot-reload': 'No reload',
      'preset_forgot-reload_hint': 'create without postrotate: the logger writes into messages.1',
      'preset_copytruncate-loss': 'copytruncate',
      'preset_copytruncate-loss_hint': 'a line between the copy and the truncate disappears',
      preset_delaycompress: 'delaycompress',
      preset_delaycompress_hint: 'messages.1 stays uncompressed for one week',
      'preset_still-open': 'Removed, still open',
      'preset_still-open_hint': 'rotate 1 without reload: the removed file still takes space',

      legLive: 'log being written',
      legOld: 'old version',
      legGz: 'compressed (.gz)',
      legGone: 'removed now',
      legDeleted: 'deleted, still open',
      legFd: 'descriptor',
      legLost: 'lost line',
      legChanged: 'changed',

      writerTitle: 'System logger',
      writerPid: 'PID {pid}',
      writerSel: 'writes the messages of this selector to',
      writerFd: 'open descriptor → inode {inode}',
      writerWrote: ['wrote {n} line', 'wrote {n} lines'],
      fd: 'fd',
      listTitle: 'Directory entries → inodes',
      inode: 'inode {inode}',
      linesN: ['{n} line', '{n} lines'],
      empty: 'empty',
      deletedName: '(deleted, open)',
      deletedWas: 'was {name}',
      removedTag: 'removed',
      lrTitle: 'logrotate',
      lrDirectives: 'Settings for /var/log/messages',
      lrStatus: 'logrotate.status: last rotation {date} (day {day})',
      lrRun: 'The run on day {day}, in order:',
      lrWrite: 'No run today: the logger only writes.',
      lrStart: 'The first run is on day 7.',
      reloadDirective: 'postrotate: reload the logger',
      opRename: 'rename {from} → {to}',
      opShift: 'shift the old versions, highest number first:',
      opRenameKeeps: 'inode {inode} stays the same',
      opCreate: 'create a new empty {name}',
      opCreateInode: 'new inode {inode}',
      opCopy: 'copy {from} → {to}',
      opCopyInode: ['new inode {inode}, {n} line', 'new inode {inode}, {n} lines'],
      opBetween: 'the logger writes {line} just then',
      opTruncate: 'truncate {name} to 0 lines',
      opTruncateLost: 'line {lines} lost',
      opReload: 'postrotate: reload, the logger reopens messages',
      opReloadTo: 'descriptor → inode {inode}',
      opFreed: 'the logger lets go of inode {inodes}: the space comes back',
      opCompress: 'compress {from} → {to}',
      opCompressOpen: 'the logger holds the old inode {inode}',
      opRemove: 'remove {name}',
      opRemoveOpen: 'still open: no space comes back',
      opNotDue: 'not due: not a Sunday, and less than 7 days since the last rotation',
      dayLabel: 'Day {day}',
      rotations: ['{n} rotation', '{n} rotations'],
      lostLabel: 'Lost lines:',
      lostNone: 'none',

      capStart: 'Start: the system logger (PID {pid}) holds {log} open; its [[file descriptor]] points at inode {inode}, not at a name. Press → for the first week.',
      capWrite: ['Day {day}: the logger writes {n} line into inode {inode}', 'Day {day}: the logger writes {n} lines into inode {inode}'],
      capWriteLive: ', which is {log}.',
      capWriteOld: ', which is now {name}, not {log}: nobody told it the file was renamed.',
      capWriteDeleted: ', which has no name any more: the file was removed but the logger holds it open, so the lines grow and no space comes back.',
      capRotCreateReload: 'Rotation: {log} was renamed to {to} and a new empty {log} was created. The system logger keeps writing to the old inode until the reload makes it reopen the file: postrotate does that, so the descriptor now points at the new inode {inode}.',
      capRotCreate: 'Rotation: {log} was renamed to {to} and a new empty {log} was created. Without a reload the logger keeps writing to the old inode {inode}.',
      capRotCreateOlder: 'Rotation: {log} was renamed to {to} and a new empty {log} was created. Without a reload the logger keeps writing to inode {inode}, which is now {name}.',
      capRotCreateNoName: 'Rotation: {log} was renamed to {to} and a new empty {log} was created. Without a reload the logger keeps writing to inode {inode}, which has no name any more.',
      capRotCopy: 'Rotation by copying: {log} was copied to {to}, then truncated in place. The logger writes to the same inode {inode} and needs no reload.',
      capRotCopyLost: 'Rotation by copying: {log} was copied to {to}, then truncated in place. Line {line} arrived between the copy and the truncate and is lost.',
      capNotDue: 'logrotate ran, but it is not a Sunday and 7 days have not passed since the last rotation: nothing changes.',
      capShift: ' The old versions moved up one number, from the highest down.',
      capRemoved: [' {name} was one too many only for a moment: rotate {n} keeps {n} version, and logrotate removes the extra one at the end of the run.', ' {name} was one too many only for a moment: rotate {n} keeps {n} versions, and logrotate removes the extra one at the end of the run.'],
      capRemovedDate: [' The oldest date, {name}, was removed at the end of the run: rotate {n} keeps {n} version.', ' The oldest date, {name}, was removed at the end of the run: rotate {n} keeps {n} versions.'],
      capRemovedOpen: ' {name} was removed, but the logger holds it open: inode {inode} stays and no space comes back.',
      capCompressed: ' {from} was compressed to {to}.',
      capDelayed: ' delaycompress: {name} stays uncompressed until the next run.',
      capCompressedOpen: ' Compressing left inode {inode} without a name, and the logger holds it open.',
      capFreed: ' The reload let go of the deleted inode, so its space came back.',

      explain:
        '<p>[[log rotation]] closes a log file that keeps growing, replaces it with a new one and keeps a set number of old ' +
        'versions. A name in <code>/var/log</code> is a [[directory entry]] that points at an inode, and the system logger ' +
        'writes through a [[file descriptor]], which points at the inode, not at the name.</p>' +
        '<p><b>create</b> renames <code>messages</code> to <code>messages.1</code> and creates a new empty ' +
        '<code>messages</code>. The logger keeps writing to the old inode, that is into <code>messages.1</code>, until a reload ' +
        'in the <code>postrotate</code> block tells it to reopen the file. That is why rotation is not just a rename.</p>' +
        '<p><b>copytruncate</b> copies the content to <code>messages.1</code> and truncates <code>messages</code> in place. The ' +
        'logger stays on the same inode and needs no signal, but a line that arrives between the copy and the truncate is ' +
        'lost.</p>' +
        '<p><b>rotate N</b> keeps N versions. Without <code>dateext</code> the shift runs from the highest number down, and ' +
        'the extra one (<code>.N+1</code>) is removed only at the end of the run. <b>compress</b> compresses the new version ' +
        'after <code>postrotate</code>, and <b>delaycompress</b> leaves <code>.1</code> uncompressed until the next run, ' +
        'because the logger may still be writing into it.</p>' +
        '<p>Removing a file the logger holds open frees no space: only the name goes. <code>weekly</code> rotates on a ' +
        'Sunday, or when at least 7 days passed since the last rotation recorded in <code>/var/lib/logrotate/logrotate.status</code>; for a log ' +
        'not recorded there yet, the first run only records it, without rotating. <code>weekly</code> and <code>rotate ' +
        '4</code> give about a month of history.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
