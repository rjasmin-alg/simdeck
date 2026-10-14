/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-pipes-redirection, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (a node in captions: commands and operators are shown as code), an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   "file descriptor" and "pipe" are written out: the glossary's Croatian for the first differs from the book's, the
   second is missing (NOTES.md, Term pairs). The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Naredbeni redak, procesi i kamo vode njihovi tokovi',
      lineLabel: 'Naredbeni redak',
      line: 'Redak',
      missing: 'Datoteka /nema-me ne postoji',
      missingHint: 'Isključeno: postoji, pa cat piše njezin redak na standardni izlaz umjesto poruke o pogrešci.',
      labels: 'Brojevi na žicama',
      pSamo1: 'Izlaz u datoteku',
      pGreska: 'Greška u datoteku',
      pSve: 'Oboje u datoteku',
      pObrnuto: 'Obrnut poredak',
      pCijev: 'Cijev',
      pCijev2: 'Greška kroz cijev',
      legend0: '0 ulaz',
      legend1: '1 izlaz',
      legend2: '2 greška',
      legendTty: 'terminal',
      legendFile: 'datoteka',
      legendPipe: 'cijev',
      legendChanged: 'promijenjeno u ovom koraku',
      screen: 'Terminal: zaslon i tipkovnica',
      pipe: 'cijev',
      tty: 'zaslon',
      ttyIn: 'tipkovnica',
      pipeW: 'cijev, piše',
      pipeR: 'cijev, čita',
      notOpen: 'još nije otvoren',
      fileAbsent: 'ne postoji',
      fileEmpty: 'prazna',
      pipeEmpty: 'prazna',
      waiting: 'čeka da ga ljuska pokrene',
      writing: 'piše',
      finished: 'završio',
      failed: 'nije pokrenut',
      readN: ['pročitao {n} redak', 'pročitao {n} retka', 'pročitao {n} redaka'],
      fdOf: 'deskriptor {fd}',
      lineFrom: 'redak s deskriptora {fd}',
      emptyScreen: 'ništa',
      linesN: ['{n} redak', '{n} retka', '{n} redaka'],
      whereTty: 'na zaslon',
      whereFile: 'u {file}',
      wherePipeW: 'u cijev',
      wherePipeR: 'iz cijevi',
      whereNone: 'nikamo',
      stream1: 'standardni izlaz',
      stream2: 'standardna greška',
      whatErr: 'greška',
      whatFd: 'deskriptor {n}',
      cTyped: 'Ljuska je pročitala redak, ali još ništa nije pokrenula. Prvo slaže kamo vodi svaki tok, korak po korak. Pritisni →.',
      cStart: 'Svaki proces kreće s tri otvorena deskriptora naslijeđena od ljuske: 0, 1 i 2. Svi su na terminalu: 0 čita s tipkovnice, 1 i 2 pišu na zaslon.',
      cPipe: '{tok}: deskriptor 1 naredbe {a} sada piše u cijev, a deskriptor 0 naredbe {b} čita iz nje. Deskriptor 2 obiju ostaje gdje je bio. Cijev se spaja prije svih preusmjeravanja.',
      cOut: '{tok}: deskriptor {fd} sada vodi u {file}. Datoteka se stvara ako je nema i prazni već sada, prije nego što naredba išta napiše.',
      cAppend: '{tok}: deskriptor {fd} sada vodi u {file}, za dopisivanje: dosadašnji sadržaj ostaje.',
      cIn: '{tok}: deskriptor {fd} sada čita iz {file}.',
      cDup: '{tok}: deskriptor {n} postaje kopija deskriptora {m} — a {m} sada vodi {where}, pa i {what} ide onamo.',
      cDupNoErr: '{tok}: deskriptor {n} postaje kopija deskriptora {m} — a {m} sada vodi {where}, pa bi i poruka o pogrešci išla onamo.',
      cDupPipe: 'Cijev je spojena prije ovog preusmjeravanja.',
      cKept: 'Deskriptor {n} se ne miče s njim: kopiju je dobio prije ovog koraka.',
      cBadFd: '{tok}: deskriptor {m} nije otvoren, pa je to greška u preusmjeravanju. Naredba {cmd} se ne pokreće.',
      cNoFile: '{tok}: datoteka {file} ne postoji, pa je to greška u preusmjeravanju. Naredba {cmd} se ne pokreće.',
      cWrite: '{cmd} piše redak na deskriptor {fd} ({stream}), a on vodi {where}.',
      cWritePipe: 'Redak čeka u cijevi dok ga {b} ne pročita.',
      cBypass: 'Cijev nosi samo deskriptor 1; poruka o pogrešci ide mimo nje, ravno na zaslon.',
      cRead: '{cmd} je pročitao {lines} sa svojeg deskriptora 0 i ispisuje koliko ih je.',
      cLost: '{cmd} piše na deskriptor {fd}, ali on nije otvoren za pisanje: redak se gubi.',
      cDone: 'Kraj. Na zaslonu: {tty}.',
      cDoneFile: 'U {file}: {k}.',
      nSamo1: 'Preusmjeravanje {op} pomaknulo je samo deskriptor 1; poruka o pogrešci ide deskriptorom 2, pa je ostala na zaslonu.',
      nGreska: 'Preusmjeravanje {op} pomaknulo je deskriptor 2: poruka je u datoteci, a na zaslonu nema ničega.',
      nSve: 'Deskriptor 2 je kopirao deskriptor 1 tek nakon što je 1 već vodio u datoteku, pa je sve u datoteci.',
      nObrnuto: 'Ista preusmjeravanja, obrnut poredak: 2 je kopirao 1 dok je 1 još vodio na zaslon. Poruka je na zaslonu, a datoteka je prazna.',
      nCijev: 'Kroz cijev je prošao samo redak sa standardnog izlaza, pa je izbrojen 1 redak. Poruka o pogrešci otišla je ravno na zaslon.',
      nCijev2: 'Uz {op} i poruka o pogrešci ušla je u cijev, pa su izbrojena 2 retka, a na zaslonu je samo taj broj.',
      nNoError: 'Bez pogreške sve ide standardnim izlazom: razlika između tih zapisa vidi se tek kad naredba nešto napiše na deskriptor 2.',
      explain: '<p>Svaki proces pri pokretanju zatekne tri otvorena toka: [[standard input]], [[standard output]] i ' +
        '[[standard error]]. Oni imaju propisane brojeve, 0, 1 i 2; takav broj je <i lang="en">file descriptor</i> ' +
        '(datotečni deskriptor). Na početku sva tri vode na zaslon, jer ih proces nasljeđuje od ljuske.</p>' +
        '<p>Svako [[redirection]] mijenja kamo vodi jedan deskriptor, i to prije nego što naredba išta napiše. ' +
        '<code>&gt; f</code> veže deskriptor 1 uz datoteku i odmah je prazni (stvara je ako je nema), <code>&gt;&gt; f</code> ' +
        'dopisuje, <code>&lt; f</code> veže deskriptor 0, a broj ispred znaka bira deskriptor: <code>2&gt; f</code>. ' +
        '<code>2&gt;&amp;1</code> se čita kao rečenica o dva broja: deskriptor 2 postaje kopija deskriptora 1 <b>kakav je ' +
        'u tom trenutku</b>. Preusmjeravanja se primjenjuju slijeva nadesno, zato <code>&gt; f 2&gt;&amp;1</code> šalje ' +
        'oboje u datoteku, a <code>2&gt;&amp;1 &gt; f</code> samo izlaz.</p>' +
        '<p>Kad je redak [[pipeline]], ljuska spaja deskriptor 1 jedne naredbe na deskriptor 0 sljedeće kroz ' +
        '<i lang="en">pipe</i> (cijev), i to prije preusmjeravanja svake naredbe. Cijev nosi samo deskriptor 1: ' +
        'greška ide mimo nje, osim ako je <code>2&gt;&amp;1</code> uputi u cijev. Izlaz posljednje naredbe završava ' +
        'ondje gdje bi završio i bez cjevovoda.</p>' +
        '<p>Česte zablude: „<code>2&gt;&amp;1</code> šalje greške u istu datoteku bez obzira na poredak” (kopira 1 ' +
        'kakav je sada); „<code>&gt;</code> hvata sve što naredba ispiše” (pomiče samo deskriptor 1); „i greške idu ' +
        'kroz cijev” (ne idu).</p>' +
        '<p>Šire o temi: cijev je spremnik konačne veličine. Pisanje u punu cijev čeka dok čitatelj ne pročita, a ' +
        'čitanje iz prazne čeka dok netko ne napiše, pa obje naredbe rade istodobno. Ovdje to nije prikazano: ' +
        'prva naredba ispiše sve, a druga zatim čita.</p>'
    },
    en: {
      stage: 'The command line, the processes, and where their streams go',
      lineLabel: 'Command line',
      line: 'Line',
      missing: 'The file /nema-me does not exist',
      missingHint: 'Off: it exists, so cat writes its line to standard output instead of an error message.',
      labels: 'Numbers on the wires',
      pSamo1: 'Output to a file',
      pGreska: 'Error to a file',
      pSve: 'Both to a file',
      pObrnuto: 'Reversed order',
      pCijev: 'Pipe',
      pCijev2: 'Error through the pipe',
      legend0: '0 input',
      legend1: '1 output',
      legend2: '2 error',
      legendTty: 'terminal',
      legendFile: 'file',
      legendPipe: 'pipe',
      legendChanged: 'changed in this step',
      screen: 'Terminal: screen and keyboard',
      pipe: 'pipe',
      tty: 'screen',
      ttyIn: 'keyboard',
      pipeW: 'pipe, writes',
      pipeR: 'pipe, reads',
      notOpen: 'not open yet',
      fileAbsent: 'does not exist',
      fileEmpty: 'empty',
      pipeEmpty: 'empty',
      waiting: 'waits for the shell to start it',
      writing: 'writes',
      finished: 'finished',
      failed: 'not started',
      readN: ['read {n} line', 'read {n} lines'],
      fdOf: 'descriptor {fd}',
      lineFrom: 'a line from descriptor {fd}',
      emptyScreen: 'nothing',
      linesN: ['{n} line', '{n} lines'],
      whereTty: 'to the screen',
      whereFile: 'to {file}',
      wherePipeW: 'into the pipe',
      wherePipeR: 'from the pipe',
      whereNone: 'nowhere',
      stream1: 'standard output',
      stream2: 'standard error',
      whatErr: 'the error',
      whatFd: 'descriptor {n}',
      cTyped: 'The shell has read the line but started nothing yet. First it sets up where each stream goes, one thing at a time. Press →.',
      cStart: 'Every process starts with three open descriptors inherited from the shell: 0, 1 and 2. All are on the terminal: 0 reads from the keyboard, 1 and 2 write to the screen.',
      cPipe: '{tok}: descriptor 1 of {a} now writes into the pipe, and descriptor 0 of {b} reads from it. Descriptor 2 of both stays where it was. The pipe is connected before any redirection.',
      cOut: '{tok}: descriptor {fd} now points to {file}. The file is created if missing and emptied right now, before the command writes anything.',
      cAppend: '{tok}: descriptor {fd} now points to {file}, for appending: what it held stays.',
      cIn: '{tok}: descriptor {fd} now reads from {file}.',
      cDup: '{tok}: descriptor {n} becomes a copy of descriptor {m} — and {m} now points {where}, so {what} goes there too.',
      cDupNoErr: '{tok}: descriptor {n} becomes a copy of descriptor {m} — and {m} now points {where}, so an error message would go there too.',
      cDupPipe: 'The pipe was connected before this redirection.',
      cKept: 'Descriptor {n} does not move with it: it got its copy before this step.',
      cBadFd: '{tok}: descriptor {m} is not open, so this is a redirection error. The command {cmd} does not start.',
      cNoFile: '{tok}: the file {file} does not exist, so this is a redirection error. The command {cmd} does not start.',
      cWrite: '{cmd} writes a line to descriptor {fd} ({stream}), which points {where}.',
      cWritePipe: 'The line waits in the pipe until {b} reads it.',
      cBypass: 'The pipe carries only descriptor 1; the error message bypasses it and lands on the screen.',
      cRead: '{cmd} has read {lines} from its descriptor 0 and now writes the count.',
      cLost: '{cmd} writes to descriptor {fd}, but it is not open for writing: the line is lost.',
      cDone: 'End. On the screen: {tty}.',
      cDoneFile: 'In {file}: {k}.',
      nSamo1: 'The redirection {op} moved descriptor 1 only; the error message travels on descriptor 2, so it stayed on the screen.',
      nGreska: 'The redirection {op} moved descriptor 2: the message is in the file, and nothing is on the screen.',
      nSve: 'Descriptor 2 copied descriptor 1 only after 1 already pointed to the file, so everything is in the file.',
      nObrnuto: 'The same redirections in the other order: 2 copied 1 while 1 still pointed to the screen. The message is on the screen, and the file is empty.',
      nCijev: 'Only the line from standard output went through the pipe, so the count is 1. The error message went straight to the screen.',
      nCijev2: 'With {op} the error message entered the pipe as well, so 2 lines were counted, and the screen shows only that number.',
      nNoError: 'Without an error everything goes to standard output: the difference between these lines shows only when the command writes something to descriptor 2.',
      explain: '<p>Every process starts with three streams already open: [[standard input]], [[standard output]] and ' +
        '[[standard error]]. They have fixed numbers, 0, 1 and 2; such a number is a <i>file descriptor</i>. At the start ' +
        'all three point to the screen, because the process inherits them from the shell.</p>' +
        '<p>A [[redirection]] changes where one descriptor points, before the command writes anything. ' +
        '<code>&gt; f</code> ties descriptor 1 to a file and empties it at once (creating it if missing), ' +
        '<code>&gt;&gt; f</code> appends, <code>&lt; f</code> ties descriptor 0, and a number in front picks the ' +
        'descriptor: <code>2&gt; f</code>. Read <code>2&gt;&amp;1</code> as a sentence about two numbers: descriptor 2 ' +
        'becomes a copy of descriptor 1 <b>as it is at that moment</b>. Redirections apply from left to right, so ' +
        '<code>&gt; f 2&gt;&amp;1</code> sends both to the file, and <code>2&gt;&amp;1 &gt; f</code> only the output.</p>' +
        '<p>In a [[pipeline]] the shell connects descriptor 1 of one command to descriptor 0 of the next through a ' +
        '<i>pipe</i>, before each command\'s own redirections. The pipe carries only descriptor 1: errors bypass it ' +
        'unless <code>2&gt;&amp;1</code> sends them in. The last command\'s output ends where it would end without ' +
        'the pipeline.</p>' +
        '<p>Common mistakes: “<code>2&gt;&amp;1</code> sends errors to the same file whatever the order” (it copies 1 as ' +
        'it is now); “<code>&gt;</code> captures everything a command prints” (it moves descriptor 1 only); “errors go ' +
        'through the pipe too” (they do not).</p>' +
        '<p>Further: a pipe is a buffer of finite size. Writing to a full pipe waits until the reader reads, and reading ' +
        'an empty one waits until someone writes, so both commands run at the same time. That is not shown here: the ' +
        'first command writes everything, then the second reads.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
