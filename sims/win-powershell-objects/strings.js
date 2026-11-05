/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-powershell-objects, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (a node in captions: commands, names and numbers are shown as code), an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   "pipe", "object", "property", "cmdlet" and "formatting" are written out: the glossary lacks them (NOTES.md, Term
   pairs). Commands, file names, type and property names are data, not language. The title and subtitle come from
   sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Isti zadatak u dva cjevovoda: bash i PowerShell',
      task: 'Zadatak',
      taskBig: 'Veće od 1 MiB',
      taskSize: 'Po veličini',
      taskExt: 'Po vrsti',
      nameWithSpace: 'Ime s razmakom u mapi',
      nameWithSpaceHint: 'Dodaje datoteku „godišnji izvještaj.pdf” (2,4 MiB).',
      formatEarly: 'Oblikovanje prije sortiranja',
      formatEarlyHint: 'PowerShell: Format-Table ide prije Sort-Object.',
      numeric: 'bash: sort -n (kao broj)',
      numericHint: 'sort -k5 -n čita peto polje kao broj.',
      onlySize: 'Samo u zadatku „Po veličini”.',
      pBig: 'Velike datoteke',
      pSpace: 'Razmak u imenu',
      pSortText: 'Sortiranje kao tekst',
      pFormatEarly: 'Prerano oblikovanje',
      pExt: 'Koliko kojih vrsta',
      legendLine: 'redak teksta',
      legendCard: 'objekt',
      legendPipe: 'cijev',
      legendField: 'polje, kako ga vidi awk',
      legendCollects: 'čita sve, pa tek onda piše',
      legendBroken: 'pogrešan rezultat',
      legendChanged: 'novo u ovom koraku',
      bashSub: 'svaka naredba je svoj proces; cijev nosi retke teksta',
      psSub: 'jedan proces; cijev nosi objekte',
      oneProcess: 'jedan proces',
      procN: 'proces {n}',
      collects: 'čita sve',
      terminal: 'terminal',
      implicit: 'dodaje se sam',
      linesN: ['{n} redak', '{n} retka', '{n} redaka'],
      objectsN: ['{n} objekt', '{n} objekta', '{n} objekata'],
      inspStart: 'Mapa: isti podaci za obje strane',
      inspAfter: 'U cijevi nakon {cmd}',
      inspLast: 'Iz {cmd} na terminal',
      inspIdle: 'nema više naredbi',
      inspTerminal: 'Na terminalu',
      inspEmpty: 'prazno',
      keptOf: 'prošlo {k} od {n}',
      colName: 'ime',
      colSize: 'bajtova',
      colTime: 'izmijenjeno',
      noLength: 'nema svojstva Length',
      fmtStart: 'početak tablice',
      fmtGroupStart: 'zaglavlje: mapa i stupci',
      fmtEntry: 'jedan redak tablice, već tekst',
      fmtGroupEnd: 'kraj skupine',
      fmtEnd: 'kraj tablice',
      fieldOf: 'polje {n}',
      correct: 'točno',
      wrong: 'pogrešno',
      verdictOk: 'rezultat je točan',
      verdictWrong: 'rezultat je pogrešan',
      qBig: 'koje su datoteke veće od 1 MiB?',
      qSize: 'poredaj datoteke po veličini, od najmanje.',
      qExt: 'koliko je datoteka koje vrste?',
      c0: 'Zadatak: {q} Obje strane čitaju istu mapu, svaka svojim cjevovodom. Pritisni → za prvu naredbu u oba reda.',
      bLsL: '{cmd} piše jedan redak teksta po datoteci, a prije njih redak „total”. Veličina i ime samo su znakovi u retku.',
      bLs: '{cmd} piše u cijev jedno ime po retku.',
      bAwk: 'Kroz bash cijev teku retci teksta: {awk} mora sam pronaći peti stupac. Dijeli redak na razmacima, zadržava retke kojima je polje 5 veće od 1048576 i ispisuje polje 9.',
      bShift: 'U retku datoteke {name} razmak stvara deseto polje, pa je polje 9 samo {f9}.',
      bSortText: '{cmd} uspoređuje retke kao tekst, od polja 5 nadalje, znak po znak: {a} dolazi prije {b} jer je znak {da} prije znaka {db}.',
      bSortLocale: 'Tako je u jezičnoj lokalizaciji kao en_US.UTF-8; u lokalizaciji C računaju se i razmaci ispred broja, pa poredak slučajno ispadne dobar.',
      bSortNum: '{cmd} čita polje 5 kao broj, pa su retci poredani po veličini; jednake veličine razlikuje cijeli redak, a on se ovdje razlikuje samo u imenu.',
      bCollects: 'Mora pročitati sve retke prije nego što napiše prvi.',
      bAwkExt: '{cmd} dijeli svako ime na točkama i ispisuje posljednji dio.',
      bSort: '{cmd} slaže jednake vrste jednu do druge.',
      bUniq: '{cmd} broji uzastopne jednake retke; bez naredbe sort ispred nje iste bi se vrste brojale u više komada.',
      bIdle: 'nema više naredbi.',
      bIdleFmt: 'nema koraka oblikovanja: tekst je već ono što će zaslon pokazati.',
      pGci: '{cmd} šalje niz cijev jedan objekt {type} po datoteci, sa svojstvima {props}. Length je broj.',
      pWhere: 'Kroz PowerShell cijev teku objekti: {cmd} čita svojstvo Length, razmaci u imenu ne smetaju. 1MB je broj 1048576.',
      pSelect: '{cmd} pravi nove objekte sa samo jednim svojstvom, Name.',
      pSort: '{cmd} uspoređuje svojstvo Length kao broj; jednake veličine ovdje ostaju redom kojim su stigle, po imenu (jamči to tek -Stable).',
      pSortBroken: '{cmd} ne nalazi svojstvo Length ni na jednom zapisu za oblikovanje: nema što usporediti, pa poredak ostaje kakav je bio.',
      pCollects: 'Mora primiti sve objekte prije nego što preda prvi.',
      pFt: '{cmd} pretvara objekte u zapise za oblikovanje: tablicu spremnu za zaslon. Iza njega nitko više ne vidi Name ni Length.',
      pFtLast: 'Zato oblikovanje ide na kraj.',
      pGroup: '{cmd} čita svojstvo Extension, slaže objekte u skupine i broji ih (Count). Mora primiti sve objekte prije prve skupine.',
      pIdle: 'nema više naredbi.',
      tBash: 'ispisuje retke kakvi jesu.',
      tPs: 'sam dodaje Out-Default, koji objekte oblikuje u tablicu.',
      tPsFmt: 'Out-Default ispisuje zapise za oblikovanje koje dobije.',
      nSame: 'Isti rezultat na obje strane.',
      nShift: 'bash je ispisao {f9}, a PowerShell cijelo ime {name}.',
      nText: 'U bashu {a} stoji prije {b}: to je poredak teksta, a popravlja ga {fix}.',
      nFmt: 'PowerShellova tablica nije poredana po veličini: Sort-Object je dobio samo zapise za oblikovanje. Oblikovanje ide na kraj.',
      nOkBash: 'bash je ovaj put točan.',
      nOkPs: 'PowerShell je točan.',
      explain: '<p>Kad je redak [[pipeline]], [[standard output]] jedne naredbe spaja se na ulaz sljedeće. U bashu kroz tu ' +
        '<i lang="en">pipe</i> (cijev) teče niz bajtova: retci teksta. Svaka je naredba svoj [[process]], a što tekst ' +
        'znači, odlučuje svaki program sam: <code>awk</code> dijeli redak na polja na razmacima, a <code>sort -k5</code> ' +
        'traži peto polje.</p>' +
        '<p>U PowerShellu kroz cijev teku .NET <i lang="en">objects</i> (objekti), jedan po jedan, unutar istog procesa. ' +
        '<i lang="en">cmdlet</i> (naredba PowerShella) ne čita tekst nego <i lang="en">property</i> (svojstvo): ' +
        '<code>Where-Object Length -gt 1MB</code> čita broj <code>Length</code>, pa razmak u imenu ništa ne pomiče, a ' +
        '<code>Sort-Object Length</code> uspoređuje brojeve. <code>1MB</code> je broj 1048576.</p>' +
        '<p>Tekst nastaje tek na kraju: PowerShell sam dodaje <code>Out-Default</code>, koji objekte oblikuje u tablicu. ' +
        '<code>Format-Table</code> to radi ranije, kao <i lang="en">formatting</i> (oblikovanje ispisa): pretvara objekte ' +
        'u zapise za oblikovanje, pa naredba iza njega više ne vidi izvorna svojstva. Zato oblikovanje ide posljednje.</p>' +
        '<p>Odluka ove stranice: jednake veličine poredane su po imenu na obje strane. U bashu ih razlikuje ostatak retka ' +
        '(datum je isti, ostaje ime), a u PowerShellu <code>Sort-Object</code> ovdje zadržava redoslijed kojim su objekti ' +
        'stigli, a stigli su po imenu. Da je to zajamčeno, treba <code>-Stable</code> ili <code>Sort-Object Length, Name</code>.</p>' +
        '<p>Česte zablude: „PowerShell kroz cijev šalje ljepši tekst” (šalje objekte; tekst nastaje tek na terminalu); ' +
        '„ono što vidim na zaslonu teče kroz cijev” (tablica je samo prikaz); „tekstni cjevovod je uvijek jednostavniji” ' +
        '(svaka naredba mora iznova rastaviti tekst, a razmak ili poredak znakova lako je prevare).</p>' +
        '<p>Šire o temi: <code>sort</code> uspoređuje po pravilima lokalizacije. Ovdje je to jezična lokalizacija poput ' +
        '<code>en_US.UTF-8</code>, u kojoj razmaci ispred broja ne računaju. U lokalizaciji C računaju se i razmaci kojima <code>ls -l</code> poravnava ' +
        'stupac veličina udesno, pa kraći brojevi slučajno dođu prvi; <code>sort -n</code> ne ovisi o tome. ' +
        '<code>sort</code>, <code>Sort-Object</code> i <code>Group-Object</code> moraju pročitati sav ulaz prije prvog ' +
        'izlaza; ostale naredbe ovdje propuštaju podatke čim stignu.</p>'
    },
    en: {
      stage: 'The same task in two pipelines: bash and PowerShell',
      task: 'Task',
      taskBig: 'Over 1 MiB',
      taskSize: 'By size',
      taskExt: 'By type',
      nameWithSpace: 'A name with a space in the folder',
      nameWithSpaceHint: 'Adds the file “godišnji izvještaj.pdf” (2.4 MiB).',
      formatEarly: 'Formatting before sorting',
      formatEarlyHint: 'PowerShell: Format-Table goes before Sort-Object.',
      numeric: 'bash: sort -n (as a number)',
      numericHint: 'sort -k5 -n reads field 5 as a number.',
      onlySize: 'Only in the “By size” task.',
      pBig: 'Big files',
      pSpace: 'A space in a name',
      pSortText: 'Sorting as text',
      pFormatEarly: 'Formatting too early',
      pExt: 'How many of each type',
      legendLine: 'line of text',
      legendCard: 'object',
      legendPipe: 'pipe',
      legendField: 'a field, as awk sees it',
      legendCollects: 'reads everything, then writes',
      legendBroken: 'wrong result',
      legendChanged: 'new in this step',
      bashSub: 'each command is its own process; the pipe carries lines of text',
      psSub: 'one process; the pipe carries objects',
      oneProcess: 'one process',
      procN: 'process {n}',
      collects: 'reads all',
      terminal: 'terminal',
      implicit: 'added implicitly',
      linesN: ['{n} line', '{n} lines'],
      objectsN: ['{n} object', '{n} objects'],
      inspStart: 'The folder: the same data for both sides',
      inspAfter: 'In the pipe after {cmd}',
      inspLast: 'From {cmd} to the terminal',
      inspIdle: 'no more commands',
      inspTerminal: 'On the terminal',
      inspEmpty: 'empty',
      keptOf: '{k} of {n} passed',
      colName: 'name',
      colSize: 'bytes',
      colTime: 'modified',
      noLength: 'no Length property',
      fmtStart: 'start of the table',
      fmtGroupStart: 'header: folder and columns',
      fmtEntry: 'one table row, already text',
      fmtGroupEnd: 'end of the group',
      fmtEnd: 'end of the table',
      fieldOf: 'field {n}',
      correct: 'correct',
      wrong: 'wrong',
      verdictOk: 'the result is correct',
      verdictWrong: 'the result is wrong',
      qBig: 'which files are larger than 1 MiB?',
      qSize: 'list the files by size, smallest first.',
      qExt: 'how many files are there of each type?',
      c0: 'Task: {q} Both sides read the same folder, each with its own pipeline. Press → for the first command in both rows.',
      bLsL: '{cmd} writes one line of text per file, after a “total” line. The size and the name are just characters in the line.',
      bLs: '{cmd} writes one name per line into the pipe.',
      bAwk: 'Lines of text flow through the bash pipe: {awk} has to find the fifth column itself. It splits each line at the blanks, keeps the lines whose field 5 is over 1048576, and prints field 9.',
      bShift: 'In the line of {name} the space makes a tenth field, so field 9 is only {f9}.',
      bSortText: '{cmd} compares the lines as text, from field 5 on, character by character: {a} comes before {b} because the character {da} comes before {db}.',
      bSortLocale: 'So it is in a language locale such as en_US.UTF-8; in the C locale the blanks before the number count too, and the order happens to come out right.',
      bSortNum: '{cmd} reads field 5 as a number, so the lines are in size order; equal sizes are told apart by the whole line, which here differs only in the name.',
      bCollects: 'It must read every line before it writes the first.',
      bAwkExt: '{cmd} splits each name at the dots and prints the last part.',
      bSort: '{cmd} puts equal types next to each other.',
      bUniq: '{cmd} counts runs of equal adjacent lines; without sort before it, one type would be counted in several pieces.',
      bIdle: 'no more commands.',
      bIdleFmt: 'there is no formatting step: the text already is what the screen will show.',
      pGci: '{cmd} sends one {type} object per file down the pipe, with the properties {props}. Length is a number.',
      pWhere: 'Objects flow through the PowerShell pipe: {cmd} reads the Length property; spaces in the name don’t matter. 1MB is the number 1048576.',
      pSelect: '{cmd} makes new objects with only one property, Name.',
      pSort: '{cmd} compares the Length property as a number; equal sizes here stay in the order they arrived, by name (only -Stable guarantees it).',
      pSortBroken: '{cmd} finds no Length property on any formatting record: there is nothing to compare, so the order stays as it was.',
      pCollects: 'It must receive every object before it passes on the first.',
      pFt: '{cmd} turns the objects into formatting records: a table ready for the screen. After it, nothing sees Name or Length any more.',
      pFtLast: 'That is why formatting goes last.',
      pGroup: '{cmd} reads the Extension property, puts the objects into groups and counts them (Count). It must receive every object before the first group.',
      pIdle: 'no more commands.',
      tBash: 'prints the lines as they are.',
      tPs: 'adds Out-Default by itself, which formats the objects as a table.',
      tPsFmt: 'Out-Default prints the formatting records it gets.',
      nSame: 'The same result on both sides.',
      nShift: 'bash printed {f9}, PowerShell the whole name {name}.',
      nText: 'In bash {a} comes before {b}: that is text order, and {fix} fixes it.',
      nFmt: 'PowerShell’s table is not sorted by size: Sort-Object got only formatting records. Formatting goes last.',
      nOkBash: 'bash is right this time.',
      nOkPs: 'PowerShell is right.',
      explain: '<p>In a [[pipeline]] the [[standard output]] of one command is connected to the input of the next. In bash ' +
        'a stream of bytes flows through that <i>pipe</i>: lines of text. Each command is its own [[process]], and what ' +
        'the text means is up to each program: <code>awk</code> splits a line into fields at the blanks, and ' +
        '<code>sort -k5</code> looks for the fifth field.</p>' +
        '<p>In PowerShell .NET <i>objects</i> flow through the pipe, one at a time, inside one process. A PowerShell ' +
        'command, a <i>cmdlet</i>, does not read text but a <i>property</i>: <code>Where-Object Length -gt 1MB</code> ' +
        'reads the number <code>Length</code>, so a space in the name moves nothing, and <code>Sort-Object Length</code> ' +
        'compares numbers. <code>1MB</code> is the number 1048576.</p>' +
        '<p>Text appears only at the end: PowerShell adds <code>Out-Default</code> by itself, which formats the objects ' +
        'as a table. <code>Format-Table</code> does that earlier, as <i>formatting</i>: it turns the objects into ' +
        'formatting records, so a command after it no longer sees the original properties. That is why formatting ' +
        'goes last.</p>' +
        '<p>A decision of this page: equal sizes are ordered by name on both sides. In bash the rest of the line tells ' +
        'them apart (the date is the same, so the name decides); in PowerShell <code>Sort-Object</code> here keeps the ' +
        'order the objects arrived in, and they arrived by name. To guarantee it, use <code>-Stable</code> or ' +
        '<code>Sort-Object Length, Name</code>.</p>' +
        '<p>Common mistakes: “PowerShell sends nicer text down the pipe” (it sends objects; text appears only at the ' +
        'terminal); “what I see on the screen is what flows down the pipe” (the table is only a view); “a text pipeline ' +
        'is always simpler” (each command must take the text apart again, and a space or the order of characters ' +
        'easily fools it).</p>' +
        '<p>Further: <code>sort</code> compares by the rules of the locale. Here that is a language locale such as ' +
        '<code>en_US.UTF-8</code>, in which the blanks before a number do not count. In the C locale the blanks with which <code>ls -l</code> right-aligns the ' +
        'size column count too, so shorter numbers happen to come first; <code>sort -n</code> does not depend on that. ' +
        '<code>sort</code>, <code>Sort-Object</code> and <code>Group-Object</code> must read all their input before ' +
        'their first output; the other commands here pass data on as soon as it arrives.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
