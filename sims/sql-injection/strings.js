/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of sql-injection, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   Terms missing from kit/glossary.js are written out (NOTES.md, Term pairs). The title and subtitle come from sim.json.
   SQL text, the application's code, user names and passwords are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Obrazac za prijavu, upit koji aplikacija gradi i tablica u bazi',

      formTitle: 'Prijava',
      fieldUser: 'Korisničko ime',
      fieldPass: 'Lozinka',
      fieldHint: 'Upiši bilo što: upit se gradi dok tipkaš',
      resLogin: 'Prijava uspjela: {name}',
      resLoginInjected: 'Prijava uspjela: {name}, kroz umetnuti kod',
      resNoMatch: 'Prijava odbijena: nijedan redak',
      resError: 'Greška baze: prijava odbijena',
      errSyntax: 'Baza ne može pročitati upit (sintaksna pogreška).',
      errColumn: 'U upitu je nepoznat stupac.',
      errTable: 'Tablica ne postoji.',
      errDenied: 'Uloga aplikacije nema ovlast za tu naredbu.',

      codeTitle: 'Aplikacija gradi upit',
      codeConcat: 'kod aplikacije: spajanje teksta',
      codeParam: 'kod aplikacije: parametrizirani upit',
      sentConcat: 'Baza dobiva ovaj tekst',
      sentParam: 'Baza dobiva predložak, uvijek isti',
      valuesTitle: 'Vrijednosti, poslane zasebno',
      valueFor: 'mjesto {i}',
      tagInjected: 'Dio unosa baza čita kao kod',
      tagValue: 'Unos je samo vrijednost',
      tagIgnored: 'komentar: baza ga preskače',
      runTitle: 'Baza izvršava',
      stRows: ['{n} redak', '{n} retka', '{n} redaka'],
      stDropped: 'tablica obrisana',
      stDeleted: ['obrisan {n} redak', 'obrisana {n} retka', 'obrisano {n} redaka'],
      stDenied: 'odbijeno: nema ovlasti',
      stError: 'greška',
      stSkipped: 'ne izvršava se',
      stNothing: 'ništa: upit se ne može pročitati',

      tableTitle: 'Tablica {name} u bazi',
      tablePlain: 'lozinke u čistom tekstu samo radi kratkoće',
      firstTag: 'aplikacija uzima ovaj',
      returnedTag: 'vraćen',
      deletedTag: 'obrisan',
      dropped: 'Tablica obrisana',
      rowsReturned: ['Vraćen {n} redak', 'Vraćena {n} retka', 'Vraćeno {n} redaka'],
      rowsNone: 'Nije vraćen nijedan redak',

      mode: 'Kako aplikacija gradi upit',
      optConcat: 'spaja tekst',
      optParam: 'parametrima',
      payload: 'Gotov unos u korisničko ime',
      payloadHint: 'Upisom u polje vraća se na vlastiti unos.',
      optNone: 'vlastiti',
      optOrTrue: "' OR '1'='1",
      optAdminComment: "admin'--",
      optStacked: "'; DROP…",
      role: 'Uloga aplikacije u bazi',
      roleHint: 'Za prijavu je dovoljno čitanje.',
      optLogin: 'samo čitanje',
      optOwner: 'vlasnik tablice',

      presetNormal: 'Obična prijava',
      presetNormalHint: 'ana / tajna: unos ostaje vrijednost',
      presetOrTrue: 'Uvijek istinito',
      presetOrTrueHint: "' OR '1'='1 u oba polja: vraćaju se svi retci",
      presetAdminComment: 'Lozinka u komentaru',
      presetAdminCommentHint: "admin'-- : sve iza -- baza preskače",
      presetStacked: 'Druga naredba',
      presetStackedHint: 'Iza ; slijedi DROP TABLE',
      presetFixed: 'Parametrizirano',
      presetFixedHint: "Isti ' OR '1'='1, sada kao vrijednost",

      legendData: 'došlo iz unosa',
      legendCode: 'baza čita kao kod',
      legendQuote: "navodnik ' (granica niske)",
      legendReturned: 'vraćeni redak',
      legendChanged: 'promijenjeno',

      capQuote: 'Navodnik u polju zatvori nisku prerano — ostatak unosa baza čita kao naredbu.',
      capRows: ['Uvjet vrijedi za {count} redak; aplikacija uzima prvi po id-u: {name}.', 'Uvjet vrijedi za {count} retka; aplikacija uzima prvi po id-u: {name}.', 'Uvjet vrijedi za {count} redaka; aplikacija uzima prvi po id-u: {name}.'],
      capNone: 'Ovaj put nijedan redak ne prolazi.',
      capComment: 'Sve iza -- je komentar: provjera lozinke nestaje, prijava kao {name}.',
      capStackedDenied: 'Iza ; slijedi druga naredba, {stmt}. Uloga samo za čitanje nema tu ovlast, pa je baza odbija; mnogi upravljački programi ionako ne primaju dvije naredbe u jednom pozivu.',
      capStackedRan: 'Iza ; slijedi druga naredba, {stmt}, a vlasnik tablice smije je izvršiti: {what}.',
      capStackedOk: 'Iza ; slijedi druga naredba, {stmt}.',
      capNormal: 'Unos ostaje unutar navodnika, pa ga baza čita kao vrijednost: poklapa se redak {name}, prijava uspijeva.',
      capWrong: 'Unos ostaje vrijednost; nijedan redak nema to ime i tu lozinku, pa je prijava odbijena.',
      capError: 'Unos je pokvario upit: baza ga ne može izvršiti i vraća grešku. Zalutali navodnik prvi je znak da se unos lijepi u kod.',
      capParamFixed: 'Parametrizirani upit: isti unos je sada samo vrijednost, nijedan redak se ne poklapa.',
      capParamMatch: 'Parametrizirani upit: predložak i vrijednosti putuju odvojeno; poklapa se redak {name}.',
      capParamNoMatch: 'Parametrizirani upit: vrijednosti se uspoređuju cijele; nijedan redak se ne poklapa.',

      explain: '<p><b>Spajanje teksta.</b> Aplikacija lijepi ono što je upisano u tekst upita, između navodnika. ' +
        'Navodnik u unosu zatvori nisku prerano, a ostatak unosa baza čita kao kod: to je ' +
        '<i lang="en">SQL injection</i> (umetanje SQL-a).</p>' +
        '<p><b>Primjeri.</b> <code>\' OR \'1\'=\'1</code> u oba polja čini uvjet istinitim za svaki redak, a aplikacija ' +
        'uzima prvi po <code>id</code>. <code>AND</code> veže jače od <code>OR</code>, pa samo u korisničkom imenu nije dovoljno. ' +
        '<code>admin\'--</code> pretvara ostatak upita u komentar, a <code>;</code> započinje drugu naredbu.</p>' +
        '<p><b>Popravak.</b> <i lang="en">Prepared statement</i> (pripremljeni upit): predložak s rezerviranim mjestima ' +
        '<code>?</code> i vrijednosti šalju se odvojeno. Vrijednost nikad ne postaje kod, ma što sadržavala.</p>' +
        '<p><b>Zablude.</b> Udvostručiti navodnike nije popravak: broj se lijepi bez navodnika, pa ' +
        '<code>WHERE id=0 OR 1=1</code> ne treba nijedan. Ime stupca ili smjer sortiranja ne može biti parametar: ' +
        'bira se s popisa dopuštenih. Ranjiv je svaki unos koji stigne do upita, ne samo prijava.</p>' +
        '<p><b>Ograničiti štetu.</b> <i lang="en">Least privilege</i> (najmanja ovlast): ulozi s kojom se aplikacija ' +
        'prijavljuje u bazu dovoljan je <code>SELECT</code>, pa <code>DROP</code> ne prolazi ni kad umetanje uspije.</p>'
    },

    en: {
      stage: 'A login form, the query the application builds and the table in the database',

      formTitle: 'Login',
      fieldUser: 'Username',
      fieldPass: 'Password',
      fieldHint: 'Type anything: the query is built as you type',
      resLogin: 'Logged in as {name}',
      resLoginInjected: 'Logged in as {name} through injected code',
      resNoMatch: 'Login refused: no row',
      resError: 'Database error: login refused',
      errSyntax: 'The database cannot read the query (syntax error).',
      errColumn: 'The query names an unknown column.',
      errTable: 'The table does not exist.',
      errDenied: 'The application\'s role may not run that statement.',

      codeTitle: 'The application builds the query',
      codeConcat: 'application code: string concatenation',
      codeParam: 'application code: parameterized query',
      sentConcat: 'The database receives this text',
      sentParam: 'The database receives the template, always the same',
      valuesTitle: 'Values, sent separately',
      valueFor: 'slot {i}',
      tagInjected: 'Part of the input is read as code',
      tagValue: 'The input is only a value',
      tagIgnored: 'comment: the database skips it',
      runTitle: 'The database runs',
      stRows: ['{n} row', '{n} rows'],
      stDropped: 'table dropped',
      stDeleted: ['{n} row deleted', '{n} rows deleted'],
      stDenied: 'refused: no privilege',
      stError: 'error',
      stSkipped: 'not run',
      stNothing: 'nothing: the query cannot be read',

      tableTitle: 'The {name} table in the database',
      tablePlain: 'plain-text passwords only to keep it short',
      firstTag: 'the app takes this one',
      returnedTag: 'returned',
      deletedTag: 'deleted',
      dropped: 'Table dropped',
      rowsReturned: ['{n} row returned', '{n} rows returned'],
      rowsNone: 'No row returned',

      mode: 'How the app builds the query',
      optConcat: 'concatenates',
      optParam: 'parameters',
      payload: 'Ready-made username',
      payloadHint: 'Typing in the field goes back to your own.',
      optNone: 'your own',
      optOrTrue: "' OR '1'='1",
      optAdminComment: "admin'--",
      optStacked: "'; DROP…",
      role: 'The app\'s database role',
      roleHint: 'A login needs only to read.',
      optLogin: 'read only',
      optOwner: 'table owner',

      presetNormal: 'Normal login',
      presetNormalHint: 'ana / tajna: the input stays a value',
      presetOrTrue: 'Always true',
      presetOrTrueHint: "' OR '1'='1 in both fields: every row comes back",
      presetAdminComment: 'Password commented out',
      presetAdminCommentHint: "admin'-- : the database skips everything after --",
      presetStacked: 'A second statement',
      presetStackedHint: 'DROP TABLE follows the ;',
      presetFixed: 'Parameterized',
      presetFixedHint: "The same ' OR '1'='1, now as a value",

      legendData: 'came from the input',
      legendCode: 'read as code',
      legendQuote: "quote ' (string boundary)",
      legendReturned: 'returned row',
      legendChanged: 'changed',

      capQuote: 'The quote in the field closes the string early — the database reads the rest of the input as a command.',
      capRows: ['The condition holds for {count} row; the app takes the first by id: {name}.', 'The condition holds for {count} rows; the app takes the first by id: {name}.'],
      capNone: 'This time no row passes.',
      capComment: 'Everything after -- is a comment: the password check is gone, logged in as {name}.',
      capStackedDenied: 'A second statement follows the ;, {stmt}. The read-only role lacks that privilege, so the database refuses it; many database drivers also reject two statements in one call.',
      capStackedRan: 'A second statement follows the ;, {stmt}, and the table owner may run it: {what}.',
      capStackedOk: 'A second statement follows the ;, {stmt}.',
      capNormal: 'The input stays inside the quotes, so the database reads it as a value: the row {name} matches and the login succeeds.',
      capWrong: 'The input stays a value; no row has that name and password, so the login is refused.',
      capError: 'The input broke the query: the database cannot run it and returns an error. A stray quote is the first sign that input is glued into code.',
      capParamFixed: 'Parameterized query: the same input is now just a value, and no row matches.',
      capParamMatch: 'Parameterized query: the template and the values travel separately; the row {name} matches.',
      capParamNoMatch: 'Parameterized query: each value is compared whole; no row matches.',

      explain: '<p><b>Concatenation.</b> The application glues what was typed into the query text, between quotes. ' +
        'A quote in the input closes the string early, and the database reads the rest of the input as code: that is ' +
        '<i>SQL injection</i>.</p>' +
        '<p><b>Examples.</b> <code>\' OR \'1\'=\'1</code> in both fields makes the condition true for every row, and the ' +
        'app takes the first by <code>id</code>. <code>AND</code> binds tighter than <code>OR</code>, so the username alone is not enough. ' +
        '<code>admin\'--</code> turns the rest of the query into a comment, and <code>;</code> starts a second statement.</p>' +
        '<p><b>The fix.</b> A <i>prepared statement</i>: a template with <code>?</code> placeholders and the values travel ' +
        'separately. A value never becomes code, whatever it holds.</p>' +
        '<p><b>Misconceptions.</b> Doubling quotes is not the fix: a number is glued in without quotes, so ' +
        '<code>WHERE id=0 OR 1=1</code> needs none. A column name or sort direction cannot be a parameter: it is picked ' +
        'from an allowlist. Any input that reaches a query is at risk, not only a login.</p>' +
        '<p><b>Bounding the damage.</b> <i>Least privilege</i>: the role the application logs in to the database with ' +
        'needs only <code>SELECT</code>, so <code>DROP</code> fails even when an injection works.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
