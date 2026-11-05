/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of restore-drill, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term.
   In captions `text` becomes code (data, not translated) and {x} may be a node. Tool output (Only in …, Unexpected EOF)
   is data: the page puts it in translate="no" spans, so it is not here.
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Izvor, arhive i provjere',
      dec: ',',

      // params
      fault: 'Kvar',
      f_named: 'nedostaje datoteka',
      f_dotfile: 'točka-datoteka',
      f_truncated: 'skraćena arhiva',
      f_empty: 'prazna arhiva',
      f_checkpoint: 'tjedna kontrolna točka',
      reliedOn: 'Nadzor gleda',
      reliedOnHint: 'Jedina provjera na koju se operater oslanja.',
      weeks: 'Tjedana',
      weeksOnly: 'Samo uz tjednu kontrolnu točku.',
      repeat: 'Četiri noći zaredom',
      repeatHint: 'Isti posao, iste provjere, svaku noć.',
      repeatOnly: 'Kontrolna točka već ima svoje tjedne.',

      // presets
      p_named: 'Nedostaje datoteka',
      p_namedHint: 'Nadzor na tar -d: zeleno',
      p_dotfile: 'Kvar 1: točka-datoteka',
      p_truncated: 'Kvar 2: skraćena arhiva',
      p_empty: 'Kvar 3: prazna arhiva',
      p_checkpoint: 'Tjedna kontrolna točka',
      p_checkpointHint: 'Osam tjedana, nadzor na dnevniku',
      p_nights: 'Kvar 1, četiri noći',

      // legend
      lgArchive: 'arhiva',
      lgPass: 'prošla',
      lgFail: 'pala',
      lgMissing: 'nema u vraćenom',
      lgRelied: 'nadzor',
      lgChanged: 'novo u ovom koraku',

      // checks
      chk_exists: 'Datoteka postoji',
      chk_size: 'Veličina prema prošloj',
      chk_list: 'Popis arhive',
      chk_diff: 'Arhiva prema disku',
      chk_gzip: 'Kompresija cijela',
      chk_status: 'Izlazni status posla',
      chk_restore: 'Proba oporavka',
      chk_statusLog: 'Redak u dnevniku',
      chk_statusOpt: 'Izlazni status ili dnevnik',
      reliedTag: 'nadzor',
      dashRow: 'Nadzor',
      dash_green: 'zeleno',
      dash_red: 'crveno',
      dash_grey: 'bez presude',
      dashHead: 'Nadzor gleda: {check}',
      dashNone: 'još nijedan posao',

      // source
      srcTitle: 'Što treba kopirati',
      srcDb: 'metapodaci poslužitelja za upravljanje verzijama',
      srcAbsent: 'nema je na disku',
      srcBack: 'vraćeno',
      srcMissing: 'nema',
      srcPartial: 'djelomično',
      nItems: ['{n} stavka', '{n} stavke', '{n} stavki'],

      // cells
      statusN: 'izlazni status: {s}',
      noLines: 'nijedan redak',
      members: ['{n} član', '{n} člana', '{n} članova'],
      membersThen: ['{n} član, pa', '{n} člana, pa', '{n} članova, pa'],
      exists: 'postoji',
      first: 'nema s čim usporediti',
      firstShort: 'prva',
      unknown: 'veličina nije dana',
      lastTime: 'prošli put {size}',
      missing: 'nema',
      missingN: ['nema {n}', 'nema {n}', 'nema {n}'],
      same: 'nijedna razlika',
      shortRestore: 'vraćeno {size}, očekivano ≈ {want}',
      na: 'ne odnosi se: nije tar arhiva',
      year: '{y}.',

      // log box
      logJob: 'Dnevnik posla, {date}: nitko ga ne čita',
      logEmpty: '(prazno)',
      logRestore: 'Vraćanje u prazan direktorij: {file}',
      logRestoreCp: 'vraćanje u prazan poslužitelj',
      logCompare: 'Usporedba s onim što je trebalo kopirati: {file}',
      logReveal: 'Dnevnik te noći: {file}',
      logStart: 'Posao još nije pokrenut.',

      // captions
      capStart: 'Treba kopirati {items}. Nadzor gleda samo jedno: {check}. Pritisni → i pusti posao da radi.',
      capStartCp: 'Poslužitelj za upravljanje verzijama svake nedjelje zapiše kontrolnu točku svojih metapodataka ' +
        '({weeks}). Nadzor gleda samo jedno: {check}. Pritisni →.',
      weeksN: ['{n} tjedan', '{n} tjedna', '{n} tjedana'],
      capJob: '{date}: posao je ostavio {file} ({size}). Nadzor ({check}): {light}.',
      capJobNoSize: '{date}: posao je ostavio {file}. Nadzor ({check}): {light}.',
      capLog: ['U dnevniku je {n} redak koji nitko nije pročitao.', 'U dnevniku su {n} retka koja nitko nije pročitao.',
        'U dnevniku je {n} redaka koje nitko nije pročitao.'],
      capRestore: ['Proba oporavka, prvi korak: svaka arhiva vraća se u prazan direktorij, daleko od izvornika. ' +
        'Iz {file} vratilo se {got} od {n} stavke.', 'Proba oporavka, prvi korak: svaka arhiva vraća se u prazan ' +
        'direktorij, daleko od izvornika. Iz {file} vratilo se {got} od {n} stavke.', 'Proba oporavka, prvi korak: ' +
        'svaka arhiva vraća se u prazan direktorij, daleko od izvornika. Iz {file} vratilo se {got} od {n} stavki.'],
      capRestoreCp: 'Proba oporavka, prvi korak: svaka kontrolna točka vraća se u prazan poslužitelj, daleko od ' +
        'izvornika. {file} ima {size}.',
      capRestoreCut: ' Vađenje je stalo na kraju datoteke: izlazni status 2.',
      capCompare_named: 'Usporedba s popisom od tri imena: {path} nikad nije ušla u arhivu. Provjere arhive to ne mogu ' +
        'vidjeti; trag je bio samo izlazni status 2, jednom, kad je posao završio.',
      capCompare_dotfile: 'Usporedba vraćenog s izvornikom ispiše `Only in …: .postavke` i vrati 1: točka-datoteka ' +
        'nikad nije ušla u kopiju.',
      capCompare_truncated: 'Vađenje staje na mjestu reza: `Unexpected EOF`, izlazni status 2. Vraćeno nije cijelo.',
      capCompare_empty: 'Ništa se nije vratilo: arhiva je bila prazna od početka, bez prava čitanja izvornika.',
      capCompare_checkpoint: 'Kontrolna točka od {date} vraća {size}, a baza je imala oko {want}. Svi ostali ' +
        'tjedni vraćaju se cijeli.',
      capNights: ' Ista greška, {n} noći zaredom, svaki put zeleno.',
      capReveal_named: 'Popis arhive i usporedba s diskom pitali su arhivu o njoj samoj i vratili 0. Datoteku koja ' +
        'nedostaje vidjeli su samo izlazni status posla (2, samo u trenutku kad je posao završio) i proba oporavka.',
      capReveal_dotfile: 'Tri naredbe, tri nule: arhiva je napravljena, popisana i raspakirana. Tek usporedba s ' +
        'izvornikom kaže da `.postavke` nikad nije ušla u kopiju: `*` ljuske preskače imena s točkom, prije nego što tar krene.',
      capReveal_truncated: 'Kvar sadržaja: ovdje provjere arhive rade. gzip -t vraća 1, a tar -t prvo ispiše oba ' +
        'člana pa tek onda padne sa 2. Djelomičan popis nije dokaz.',
      capReveal_empty: '{size}, nijedan redak, izlazni status 0: isto što daje i čista usporedba s diskom. Nula redaka ' +
        'i nula znače dvije suprotne stvari; koju, kažu tek izlazni status (2) i proba oporavka.',
      capReveal_checkpoint: 'Tjedan {date}: dnevnik kaže „nightly OK”, a kontrolna točka ima {size} umjesto ' +
        '{want}. Primijete to samo provjera veličine i proba oporavka.',
      capRelyRestore: ' Nadzor je ovdje gledao probu oporavka, pa je kvar vidio već one noći.',

      explain: '<p>[[backup]] se radi noću: posao javlja „uredno” i ostavlja datoteku. Svaka provjera u tablici postavlja ' +
        'drugo pitanje: postoji li datoteka, je li velika kao prošli put, može li arhiva ispisati svoj sadržaj, slaže ' +
        'li se s diskom, je li komprimirani zapis cijel, koji je [[exit status]] posao vratio.</p>' +
        '<p>Popis arhive i usporedba s diskom pitaju arhivu o njoj samoj: ono što u arhivu nikad nije ušlo ne mogu ' +
        'prijaviti. Kvar <b>opsega</b> (datoteka nije ušla) koji je tar vidio ostaje samo u izlaznom statusu, ako ga ' +
        'posao uhvati, i to jednom; onaj koji tar nikad nije vidio (<code>*</code> ljuske preskače točka-datoteke) ne vidi ' +
        'ništa osim probe oporavka. Kvar <b>sadržaja</b> (arhiva odrezana) vide i provjere arhive. Nijedan redak i status 0 znači i ' +
        '„slaže se” i „prazno je”.</p>' +
        '<p>Jedino pitanje koje gleda s druge strane je [[restore test]]: vrati se na mjesto koje nije ' +
        'izvornik i usporedi s onim što je <b>trebalo</b> biti kopirano. U izvještaj se smije napisati samo „iz kopije ' +
        'od tog datuma vraćeno je to i to i podudara se s izvornikom”; to je jedina izmjerena [[recovery point]].</p>' +
        '<p>Isti kvar, posao koji laže, ima i cjevovod bez pipefail: vidi simulator o izlaznom statusu.</p>'
    },
    en: {
      stage: 'Source, archives and checks',
      dec: '.',

      fault: 'Fault',
      f_named: 'a file is missing',
      f_dotfile: 'the dot-file',
      f_truncated: 'a cut archive',
      f_empty: 'an empty archive',
      f_checkpoint: 'weekly checkpoint',
      reliedOn: 'Dashboard watches',
      reliedOnHint: 'The one check the operator relies on.',
      weeks: 'Weeks',
      weeksOnly: 'Only with the weekly checkpoint.',
      repeat: 'Four nights in a row',
      repeatHint: 'The same job, the same checks, every night.',
      repeatOnly: 'The checkpoint has its own weeks.',

      p_named: 'A file is missing',
      p_namedHint: 'Dashboard on tar -d: green',
      p_dotfile: 'Fault 1: the dot-file',
      p_truncated: 'Fault 2: a cut archive',
      p_empty: 'Fault 3: an empty archive',
      p_checkpoint: 'Weekly checkpoint',
      p_checkpointHint: 'Eight weeks, dashboard on the log',
      p_nights: 'Fault 1, four nights',

      lgArchive: 'archive',
      lgPass: 'passed',
      lgFail: 'failed',
      lgMissing: 'missing in the restore',
      lgRelied: 'dashboard',
      lgChanged: 'new in this step',

      chk_exists: 'File exists',
      chk_size: 'Size vs last time',
      chk_list: 'Archive lists',
      chk_diff: 'Archive vs disk',
      chk_gzip: 'Compression intact',
      chk_status: 'Job exit status',
      chk_restore: 'Restore test',
      chk_statusLog: 'Log line',
      chk_statusOpt: 'Exit status or log line',
      reliedTag: 'dashboard',
      dashRow: 'Dashboard',
      dash_green: 'green',
      dash_red: 'red',
      dash_grey: 'no verdict',
      dashHead: 'Dashboard watches: {check}',
      dashNone: 'no job yet',

      srcTitle: 'What should be copied',
      srcDb: 'the version-control server\'s metadata',
      srcAbsent: 'not on the disk',
      srcBack: 'restored',
      srcMissing: 'missing',
      srcPartial: 'partial',
      nItems: ['{n} item', '{n} items'],

      statusN: 'exit status: {s}',
      noLines: 'no lines',
      members: ['{n} member', '{n} members'],
      membersThen: ['{n} member, then', '{n} members, then'],
      exists: 'exists',
      first: 'nothing to compare with',
      firstShort: 'first',
      unknown: 'size not given',
      lastTime: 'last time {size}',
      missing: 'missing',
      missingN: ['{n} missing', '{n} missing'],
      same: 'no differences',
      shortRestore: 'restored {size}, expected ≈ {want}',
      na: 'does not apply: not a tar archive',
      year: '{y}',

      logJob: 'The job\'s log, {date}: nobody reads it',
      logEmpty: '(empty)',
      logRestore: 'Restore into an empty directory: {file}',
      logRestoreCp: 'restore into an empty server',
      logCompare: 'Compared with what should have been copied: {file}',
      logReveal: 'That night\'s log: {file}',
      logStart: 'The job has not run yet.',

      capStart: '{items} should be copied. The dashboard watches one thing only: {check}. Press → and let the job run.',
      capStartCp: 'Every Sunday the version-control server writes a checkpoint of its metadata ({weeks}). The ' +
        'dashboard watches one thing only: {check}. Press →.',
      weeksN: ['{n} week', '{n} weeks'],
      capJob: '{date}: the job left {file} ({size}). Dashboard ({check}): {light}.',
      capJobNoSize: '{date}: the job left {file}. Dashboard ({check}): {light}.',
      capLog: ['The log has {n} line nobody read.', 'The log has {n} lines nobody read.'],
      capRestore: ['Restore test, first step: every archive goes back into an empty directory, away from the source. ' +
        '{got} of {n} item came back from {file}.', 'Restore test, first step: every archive goes back into an empty ' +
        'directory, away from the source. {got} of {n} items came back from {file}.'],
      capRestoreCp: 'Restore test, first step: every checkpoint goes back into an empty server, away from the ' +
        'source. {file} holds {size}.',
      capRestoreCut: ' The extraction stopped at the end of the file: exit status 2.',
      capCompare_named: 'Compared with the list of three names: {path} never entered the archive. The archive checks ' +
        'cannot see that; the only trace was exit status 2, once, when the job ended.',
      capCompare_dotfile: 'Comparing the restore with the source prints `Only in …: .postavke` and returns 1: the ' +
        'dot-file never got into the copy.',
      capCompare_truncated: 'The extraction stops where the file was cut: `Unexpected EOF`, exit status 2. What came ' +
        'back is not whole.',
      capCompare_empty: 'Nothing came back: the archive was empty from the start, without the right to read the source.',
      capCompare_checkpoint: 'The checkpoint of {date} restores {size}; the database had about {want}. All the other ' +
        'weeks restore in full.',
      capNights: ' The same fault, {n} nights in a row, green every time.',
      capReveal_named: 'The archive listing and the comparison with the disk asked the archive about itself and ' +
        'returned 0. Only the job\'s exit status (2, only at the moment the job ended) and the restore test saw the missing file.',
      capReveal_dotfile: 'Three commands, three zeros: the archive was made, listed and extracted. Only the ' +
        'comparison with the source says that `.postavke` never got into the copy: the shell\'s `*` skips names ' +
        'starting with a dot, before tar starts.',
      capReveal_truncated: 'A content fault: here the archive checks work. gzip -t returns 1, and tar -t first lists ' +
        'both members and only then fails with 2. A partial listing is not proof.',
      capReveal_empty: '{size}, no lines, exit status 0: the same as a clean comparison with the disk. Zero lines and ' +
        'zero mean two opposite things; only the exit status (2) and the restore test tell which.',
      capReveal_checkpoint: 'Week of {date}: the log says "nightly OK", but the checkpoint is {size} instead of ' +
        '{want}. Only the size check and the restore notice.',
      capRelyRestore: ' Here the dashboard watched the restore test, so it saw the fault the same night.',

      explain: '<p>A [[backup]] job reports "OK" and leaves a file. Each check in the table asks a different question: ' +
        'does the file exist, is it as big as last time, can the archive list its contents, does it match the disk, ' +
        'is the compressed stream whole, which [[exit status]] did the job end with.</p>' +
        '<p>The archive listing and the comparison with the disk ask the archive about itself: what never entered the ' +
        'archive they cannot report. A <b>scope</b> fault (a file did not get in) that tar saw shows only in the exit ' +
        'status, if the job captures it, and only once; one tar never saw (the shell\'s <code>*</code> skipping dot-files) shows ' +
        'in nothing but the restore test. A <b>content</b> fault (the archive was cut) is seen by the archive ' +
        'checks too. No lines and status 0 means both "it matches" and "it is empty".</p>' +
        '<p>The only question asked from the other side is the [[restore test]]: restore to a place that is not the ' +
        'source and compare with what <b>should</b> have been copied. A report may only say "from the copy of that ' +
        'date, this and this was restored and matches the source"; that is the only measured [[recovery point]].</p>' +
        '<p>The same fault, a job that lies, shows up in a pipeline without pipefail: see the exit status simulator.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
