/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-rsync-delete, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other),
   [[term]] a glossary term, *term* an English term the glossary lacks (the page sets it in italics, lang="en").
   Paths, commands and rsync's own output are data, not language: the page puts them in translate="no".
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Izvorište, odredište i ispis naredbe rsync',

      script: 'Scenarij',
      slash: 'Kosa crta na kraju izvorišta',
      delete: 'Brisanje suvišnog (--delete)',
      dryRun: 'Probni prolaz (-n)',
      dest: 'Odredište',
      destHome: '~/ (krivo)',
      fixedBy: 'Ovaj scenarij to sam postavlja u svakom prolazu.',

      presetSlash: 'Kosa crta iz knjige',
      presetSlashHint: 'Dva prolaza: ~/vjezba/ i ~/vjezba',
      presetDelete: 'Brisanje se prenosi',
      presetDeleteHint: 'Sinkroniziraj, obriši na izvoru, sinkroniziraj bez i s --delete',
      presetDry: 'Prvo probni prolaz',
      presetDryHint: '-n --delete pa pravi prolaz',
      presetWrong: 'Krivo odredište',
      presetWrongHint: 'Probni prolaz s --delete prema ~/',
      presetNightly: 'Noćno zrcalo',
      presetNightlyHint: '21:00 šifriranje, 22:00 zrcaljenje',

      legChanged: 'promijenjeno u ovom koraku',
      legSolid: 'na obje strane',
      legCopied: 'preneseno sada',
      legDelete: 'bit će obrisano',
      legGone: 'obrisano',
      legDry: 'samo probni prolaz',
      legLevel: 'razina više',

      srcTitle: 'Izvorište',
      dstTitle: 'Odredište',
      outTitle: 'Ispis (-v)',
      noRun: 'U ovom koraku rsync se ne pokreće.',
      prevRun: 'Ispod je ispis prethodnog prolaza.',
      nextRun: 'sljedeći prolaz',
      levelTag: '+1 razina',
      folded: ['({n} stavka)', '({n} stavke)', '({n} stavki)'],
      ruined: 'šifrirano',
      slashOn: 'kosa crta: sadržaj',
      slashOff: 'bez kose crte: direktorij po imenu',
      evRm: 'na izvorištu se briše datoteka',
      evEncrypt: 'zlonamjerni program šifrira datoteku',
      evWait: 'prolazi noć',
      evTime: 'u {t}',
      dryNote: 'ništa nije promijenjeno',

      capStartBook: 'Na klijentu je ~/vjezba s datotekom a.txt i poddirektorijem pod. Dvije naredbe razlikuju se u jednom znaku, ' +
        '*trailing slash* (kosoj crti na kraju) izvorišta. Pritisni → za prvu.',
      capStartDelete: 'Izvorište se kopira na poslužitelj, zatim se na izvorištu obriše a.txt i kopira ponovno, prvo bez, ' +
        'onda s --delete. Pritisni → za prvi prolaz.',
      capStartDry: 'Odredište već ima kopiju izvorišta. Na izvorištu će se obrisati a.txt, a prije pravog prolaza s --delete ' +
        'ide *dry run* (probni prolaz).',
      capStartWrong: 'Naredba s --delete kojoj je odredište cijeli kućni direktorij na poslužitelju. Ide samo probni prolaz: ' +
        'popis kaže što bi pravi obrisao.',
      capStartNightly: 'Svake večeri u 22:00 posao zrcaljenja usklađuje kopiju s izvorištem, s --delete. Kopija od sinoć je ' +
        'ispravna.',

      capSlash: 'Kosa crta na kraju: stiže sadržaj. a.txt i pod/ leže izravno u {root}.',
      capNoSlash: 'Bez kose crte stiže sam direktorij: na odredištu je razina više, {path}. Popis to kaže unaprijed, ' +
        'imena počinju s vjezba/.',
      capKept: 'Promijenilo se samo vrijeme direktorija, pa je poslan ./. {file} ostaje na odredištu: bez --delete rsync ' +
        'ne briše ništa.',
      capDeleted: 'Na izvorištu je {file} obrisan, a --delete je to vjerno ponovio na odredištu. Zrcalo nije povijest: ' +
        'ono pokazuje samo kako izvorište izgleda sada.',
      capNightly: '{t}: zrcaljenje s --delete obrisalo je dobru kopiju {file} i prenijelo šifrirani {locked}. Pogreška ' +
        'izvorišta sada je i na kopiji.',
      capAlso: ['Uz nju je obrisana još {n} stavka.', 'Uz nju su obrisane još {n} stavke.', 'Uz nju je obrisano još {n} stavki.'],
      capSent: ['Poslana je {n} datoteka koja se razlikuje.', 'Poslane su {n} datoteke koje se razlikuju.',
        'Poslano je {n} datoteka koje se razlikuju.'],
      capNothing: 'Ništa se ne razlikuje, popis je prazan: odredište već jest izvorište.',

      capDry: ['Probni prolaz: ispis je isti kao pravi, *created directory* i sve, a ništa nije promijenjeno. Jedina ' +
        'razlika je (DRY RUN) na kraju. Pravi bi prolaz obrisao {n} stavku.',
      'Probni prolaz: ispis je isti kao pravi, *created directory* i sve, a ništa nije promijenjeno. Jedina razlika je ' +
        '(DRY RUN) na kraju. Pravi bi prolaz obrisao {n} stavke.',
      'Probni prolaz: ispis je isti kao pravi, *created directory* i sve, a ništa nije promijenjeno. Jedina razlika je ' +
        '(DRY RUN) na kraju. Pravi bi prolaz obrisao {n} stavki.'],
      capWrongSlash: 'Probni prolaz, ništa nije promijenjeno. Odredište je ~/, a kosa crta kaže „sadržaj“: sve u kućnom ' +
        'direktoriju čega nema u ~/vjezba suvišno je, pa bi pravi prolaz obrisao {del} od {all} stavki. Ovdje se staje.',
      capWrongNoSlash: 'Probni prolaz. Bez kose crte --delete radi samo unutar ~/vjezba/ na odredištu, a nje još nema: ' +
        'ništa se ne bi obrisalo, nastao bi direktorij ~/vjezba.',

      capRm: 'Na izvorištu je obrisan {file}. Odredište ga još ima, do sljedećeg prolaza.',
      capEncrypt: '{t}: zlonamjerni program šifrira {file} u {locked} i briše izvornik. Zrcalo od sinoć još drži dobru kopiju.',
      capWait: '{t}: šteta je otkrivena. Izvorište i zrcalo drže isti šifrirani {locked}, a starije kopije nema. Jedno ' +
        'zrcalo je jedna [[recovery point]], i ona je sinoć prepisana.',
      capWaitSaved: '{t}: šteta je otkrivena. Dobra kopija {file} preživjela je samo zato što naredba nije pogodila ' +
        'sinkroniziranu kopiju. To nije zaštita, nego slučaj.',

      explain: '<p><b>Kosa crta.</b> <code translate="no">rsync -av ~/vjezba/ …</code> kopira <i>sadržaj</i> direktorija; ' +
        '<code translate="no">rsync -av ~/vjezba …</code> kopira direktorij po imenu, pa na odredištu nastaje razina više ' +
        '(<code translate="no">vjezba/a.txt</code>). Vidi se prije prijenosa: počinju li imena u ispisu s ' +
        '<code translate="no">vjezba/</code>.</p>' +
        '<p><b>Što se šalje.</b> Samo ono što se razlikuje: zadano po veličini i vremenu izmjene, s ' +
        '<code translate="no">-c</code> po kontrolnom zbroju. Direktorij se ispiše i kad mu se promijenilo samo vrijeme ' +
        '(<code translate="no">./</code>).</p>' +
        '<p><b>--delete</b> s odredišta briše ono čega na izvorištu nema, ali samo u direktorijima koji se sinkroniziraju. ' +
        'Bez kose crte to je samo <code translate="no">odredište/vjezba/</code>; s kosom crtom i krivim odredištem to je ' +
        'sve što ondje jest. Probni prolaz <code translate="no">-n</code> ispisuje isti popis, i ' +
        '<code translate="no">created directory</code>, a jedina razlika je <code translate="no">(DRY RUN)</code> na kraju: ' +
        'popis brisanja čita se prije, ne poslije.</p>' +
        '<p><b>Zrcalo nije povijest.</b> Kopija s --delete pokazuje izvorište kakvo je sada, s pogreškama. Obrisana ili ' +
        'šifrirana datoteka na izvorištu sljedećim je prolazom obrisana ili šifrirana i na kopiji. Jedna kopija je jedna ' +
        '[[recovery point]]; za povratak u prošlost treba ih više, iz različitih trenutaka. To radi ' +
        '<code translate="no">--link-dest</code>: svaka nova kopija u svoj direktorij, a nepromijenjene datoteke tvrdo ' +
        'povezane s prethodnom, pa malo koštaju.</p>' +
        '<p><b>Zablude.</b> Kosa crta nije ukras. --delete ne čini kopiju „sigurnijom“ jer je točnija: čini je jednako ' +
        'pogrešnom kao izvorište. Noćno zrcalo nije [[backup]].</p>'
    },
    en: {
      stage: 'Source, destination and the rsync output',

      script: 'Scenario',
      slash: 'Trailing slash on the source',
      delete: 'Delete extraneous (--delete)',
      dryRun: 'Dry run (-n)',
      dest: 'Destination',
      destHome: '~/ (wrong)',
      fixedBy: 'This scenario sets it itself in every run.',

      presetSlash: 'The book\'s trailing slash',
      presetSlashHint: 'Two runs: ~/vjezba/ and ~/vjezba',
      presetDelete: 'A deletion propagates',
      presetDeleteHint: 'Sync, delete at the source, sync without and with --delete',
      presetDry: 'Dry run first',
      presetDryHint: '-n --delete, then the real run',
      presetWrong: 'Wrong destination',
      presetWrongHint: 'A dry run with --delete into ~/',
      presetNightly: 'Nightly mirror',
      presetNightlyHint: '21:00 encryption, 22:00 mirror run',

      legChanged: 'changed in this step',
      legSolid: 'on both sides',
      legCopied: 'sent now',
      legDelete: 'to be deleted',
      legGone: 'deleted',
      legDry: 'dry run only',
      legLevel: 'one level more',

      srcTitle: 'Source',
      dstTitle: 'Destination',
      outTitle: 'Output (-v)',
      noRun: 'rsync does not run in this step.',
      prevRun: 'Below is the previous run\'s output.',
      nextRun: 'next run',
      levelTag: '+1 level',
      folded: ['({n} entry)', '({n} entries)'],
      ruined: 'encrypted',
      slashOn: 'slash: the contents',
      slashOff: 'no slash: the directory by name',
      evRm: 'a file is deleted at the source',
      evEncrypt: 'malware encrypts a file',
      evWait: 'the night passes',
      evTime: 'at {t}',
      dryNote: 'nothing changed',

      capStartBook: 'The client has ~/vjezba with a file a.txt and a subdirectory pod. Two commands differ in one character, ' +
        'the source\'s trailing slash. Press → for the first.',
      capStartDelete: 'The source is copied to the server, then a.txt is deleted at the source and the copy is run again, ' +
        'first without, then with --delete. Press → for the first run.',
      capStartDry: 'The destination already holds a copy of the source. a.txt will be deleted at the source, and a ' +
        'dry run comes before the real run with --delete.',
      capStartWrong: 'A command with --delete whose destination is the whole home directory on the server. Only a dry run ' +
        'happens: the list says what the real one would delete.',
      capStartNightly: 'Every evening at 22:00 a mirror job brings the copy in line with the source, with --delete. Last ' +
        'night\'s copy is good.',

      capSlash: 'Trailing slash: the contents arrive. a.txt and pod/ sit directly in {root}.',
      capNoSlash: 'No slash: the directory itself arrives, one level more at the destination, {path}. The list says so ' +
        'beforehand: the names start with vjezba/.',
      capKept: 'Only the directory\'s time changed, so ./ was sent. {file} stays at the destination: without --delete ' +
        'rsync deletes nothing.',
      capDeleted: '{file} was deleted at the source, and --delete faithfully repeated that at the destination. A mirror is ' +
        'not history: it shows only what the source looks like now.',
      capNightly: '{t}: the mirror run with --delete deleted the good copy of {file} and sent the encrypted {locked}. ' +
        'The source\'s mistake is now on the copy too.',
      capAlso: ['{n} more entry was deleted with it.', '{n} more entries were deleted with it.'],
      capSent: ['{n} file that differs was sent.', '{n} files that differ were sent.'],
      capNothing: 'Nothing differs and the list is empty: the destination already is the source.',

      capDry: ['Dry run: the output is the same as a real run\'s, created directory and all, and nothing changed. The only ' +
        'difference is (DRY RUN) at the end. The real run would delete {n} entry.',
      'Dry run: the output is the same as a real run\'s, created directory and all, and nothing changed. The only ' +
        'difference is (DRY RUN) at the end. The real run would delete {n} entries.'],
      capWrongSlash: 'Dry run, nothing changed. The destination is ~/, and the slash says "the contents": everything in the ' +
        'home directory that ~/vjezba lacks is extraneous, so the real run would delete {del} of {all} entries. The page ' +
        'stops here.',
      capWrongNoSlash: 'Dry run. Without the slash --delete acts only inside ~/vjezba/ at the destination, which does not ' +
        'exist yet: nothing would be deleted, and a directory ~/vjezba would appear.',

      capRm: '{file} was deleted at the source. The destination still has it, until the next run.',
      capEncrypt: '{t}: malware encrypts {file} into {locked} and deletes the original. Last night\'s mirror still holds ' +
        'the good copy.',
      capWait: '{t}: the damage is found. Source and mirror hold the same encrypted {locked}, and there is no older copy. ' +
        'One mirror is one [[recovery point]], and it was overwritten last night.',
      capWaitSaved: '{t}: the damage is found. The good copy of {file} survived only because the command missed the ' +
        'synchronised copy. That is luck, not protection.',

      explain: '<p><b>The slash.</b> <code translate="no">rsync -av ~/vjezba/ …</code> copies the <i>contents</i> of the ' +
        'directory; <code translate="no">rsync -av ~/vjezba …</code> copies the directory by name, so the destination ' +
        'gets one level more (<code translate="no">vjezba/a.txt</code>). It shows before the transfer: do the names in ' +
        'the output start with <code translate="no">vjezba/</code>?</p>' +
        '<p><b>What is sent.</b> Only what differs: by default by size and modification time, with ' +
        '<code translate="no">-c</code> by checksum. A directory is listed when only its time changed ' +
        '(<code translate="no">./</code>).</p>' +
        '<p><b>--delete</b> removes from the destination what the source lacks, but only in the directories being ' +
        'synchronised. Without the slash that is only <code translate="no">destination/vjezba/</code>; with the slash ' +
        'and the wrong destination it is everything there. The dry run <code translate="no">-n</code> prints the same ' +
        'list, <code translate="no">created directory</code> included, and the only difference is ' +
        '<code translate="no">(DRY RUN)</code> at the end: the delete list is read before, not after.</p>' +
        '<p><b>A mirror is not history.</b> A copy kept with --delete shows the source as it is now, mistakes included. ' +
        'A file deleted or encrypted at the source is deleted or encrypted on the copy by the next run. One copy is one ' +
        '[[recovery point]]; going back in time needs several, from different moments. That is what ' +
        '<code translate="no">--link-dest</code> does: each new copy in its own directory, unchanged files hard-linked ' +
        'to the previous one, so they cost little.</p>' +
        '<p><b>Misconceptions.</b> The slash is not cosmetic. --delete does not make the copy "safer" because it is more ' +
        'exact: it makes it exactly as wrong as the source. A nightly mirror is not a [[backup]].</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
