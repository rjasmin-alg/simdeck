/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-links-inodes, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (in captions a node: names, paths, inode numbers and process ids are data), an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   In captions *word* is an English term in italics (the Croatian term rule, for terms the glossary lacks) and `x` is
   code. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Direktoriji, inodei i blokovi podataka',
      // panel
      scene: 'Primjer',
      showBlocks: 'Blokovi podataka',
      holdOpen: 'Proces drži datoteku otvorenom',
      holdOpenHint: 'tail -f otvara glavnu datoteku primjera na početku i drži je do kraja.',
      holdOpenOff: 'U ovom primjeru datoteka nastaje tek u 2. koraku.',
      pPrimjer: 'Drugo ime: ln i rm',
      pPrimjerHint: 'Pokus iz knjige: dva imena, jedan inode 33616720.',
      pSadrzaj: 'Sadržaj ostaje',
      pSadrzajHint: 'printf, ln, rm, cat: sadržaj se ne miče.',
      pSimbolicka: 'Simbolička poveznica',
      pSimbolickaHint: 'Pamti samo stazu; bez datoteke ostaje viseća.',
      pPreimenuj: 'Preimenovanje',
      pPreimenujHint: 'mv: čvrsta poveznica radi, simbolička visi.',
      pOtvorena: 'Otvorena datoteka',
      pOtvorenaHint: 'Brojač je 0, a prostor se vraća tek kad proces završi.',
      // legend
      legEntry: 'unos u direktoriju',
      legInode: 'inode (-, d, l)',
      legHard: 'ime → inode',
      legSym: 'staza poveznice',
      legHeld: 'otvoren, bez imena',
      legChanged: 'promijenjeno',
      legHop: 'put pretrage',
      // stage
      dirTitle: 'unosi u direktoriju {dir}',
      dirEmpty: 'nema unosa',
      noDirs: 'Direktorij još ne postoji.',
      inodesTitle: 'inodei',
      noInodes: 'Nema nijednog inodea.',
      ghost: 'nema unosa',
      removed: 'uklonjen',
      renamed: 'preimenovan',
      tFile: 'datoteka',
      tDir: 'direktorij',
      tSymlink: 'simbolička poveznica',
      fNlink: 'brojač poveznica',
      fOpen: 'otvoren u procesu',
      fData: 'podaci',
      fPath: 'staza',
      empty: '(nema)',
      dirData: 'vlastiti popis unosa',
      noName: 'bez imena',
      freed: 'oslobođen',
      blocksTitle: 'Blokovi podataka (po 4 KiB)',
      blocksCount: 'zauzeto {used} od {total}',
      procChip: 'proces {pid}: {cmd}',
      before: 'Pritisni → za prvu naredbu.',
      blocks: ['{n} blok', '{n} bloka', '{n} blokova'],
      blocksFreeAgain: ['pa je {n} blok opet slobodan', 'pa su {n} bloka opet slobodna', 'pa je {n} blokova opet slobodno'],
      blocksStay: ['{n} blok ostaje zauzet', '{n} bloka ostaju zauzeta', '{n} blokova ostaje zauzeto'],
      blocksNowFree: ['tek je sada {n} blok slobodan', 'tek su sada {n} bloka slobodna', 'tek je sada {n} blokova slobodno'],
      // captions: start
      capStart_primjer: 'U direktoriju {dir} nalaze se dva unosa: {file} pokazuje na inode {ino}, {sub} na inode {dino}. Svako ime je [[directory entry]] koji pokazuje na jedan *inode* (zapis o datoteci).',
      capStart_sadrzaj: 'Još nema ničega. Pokus iz knjige u jednom retku: napravi {dir}, upiši datoteku, dodaj joj drugo ime, ukloni prvo i ispiši preostalo.',
      capStart_simbolicka: 'U {dir} je datoteka {file} (inode {ino}, jedan blok). Sad joj dodajemo *symbolic link* (simboličku poveznicu) i gledamo što preživi uklanjanje imena.',
      capStart_preimenuj: 'U {dir} je datoteka {file} (inode {ino}). Dobit će *hard link* (čvrstu poveznicu) i *symbolic link* (simboličku poveznicu), a zatim novo ime.',
      capStart_otvorena: 'Datoteka {file} (inode {ino}) zauzima {blocks}. Uklonit ćemo jedino njezino ime.',
      capHeld: 'Proces {pid} ({tail}) drži datoteku {file} otvorenom.',
      // captions: steps
      capLs: '`ls -li` ispisuje unose direktorija {dir}: prvi broj u retku broj je inodea, a broj iza niza crtica i slova [[link count]]. Prvi kaže koja je to datoteka, drugi koliko imena na nju pokazuje.',
      capLsEmpty: 'U {dir} nema nijednog unosa, pa `ls` nema što ispisati.',
      capLsHeld: 'U {dir} nema nijednog unosa, a inode {ino} i dalje zauzima {blocks}: proces {pid} ga drži otvorenim.',
      capLn: '`ln` je dodao unos {name} koji pokazuje na isti inode {ino}: dva imena, jedna datoteka. Brojač poveznica porastao je s {from} na {to}; ništa nije kopirano.',
      capLnErr: '`ln` nije uspio: {why} Ništa se nije promijenilo.',
      whyEXDEV: 'unos i inode moraju biti na istom datotečnom sustavu.',
      whyEPERM: 'direktorij ne smije dobiti drugo ime.',
      whyEEXIST: 'to ime već postoji.',
      whyENOENT: 'nema takvog unosa.',
      capSym: '`ln -s` je napravio novi inode {ino} vrste `l` koji pamti samo tekst {text}. Brojač poveznica datoteke {target} ostao je {n}.',
      capSymNone: '`ln -s` je napravio novi inode {ino} vrste `l` s tekstom {text}; ondje još nema ničega, i to je dopušteno.',
      capCat: '`cat` je potražio unos {name}, došao do inodea {ino} i ispisao njegov sadržaj.',
      capCatKept: '`cat` čita {name} i ispisuje {data}: isti inode {ino}, isti blok. Uklanjanje imena {gone} nije dotaknulo sadržaj.',
      capCatSym: '`cat` je otvorio {name}: to je simbolička poveznica, pa je pročitao njezin tekst {text}, potražio to ime u direktoriju same poveznice i došao do inodea {ino}.',
      capDangling: 'Simbolička poveznica pamti samo stazu {text}; ondje sada nema ničega, pa `cat` javlja `No such file or directory`. Takva je poveznica *dangling* (viseća).',
      capDanglingHeld: 'Stari inode {ino} još postoji jer ga proces {pid} drži otvorenim, ali nijedno ime ne vodi do njega.',
      capWriteNew: 'Nema unosa {name}, pa je preusmjeravanje napravilo novi inode {ino} ({blocks}) i unos {name} koji na njega pokazuje.',
      capWriteHeals: 'Poveznica {link} pamti tekst {text}, pa sada vodi do novog inodea.',
      capRmKept: '`rm` je uklonio unos {name}; brojač poveznica inodea {ino} pao je s {from} na {to} — sadržaj nije dotaknut.',
      capRmFreed: '`rm` je uklonio unos {name}; brojač poveznica inodea {ino} pao je na 0 i nijedan proces ga ne drži, {blocks}.',
      capRmFreedNone: '`rm` je uklonio unos {name}; brojač poveznica inodea {ino} pao je na 0 i nijedan proces ga ne drži, pa je inode oslobođen.',
      capRmPostponed: '`rm` je uklonio posljednje ime {name}: brojač inodea {ino} je 0, ali proces {pid} ga drži otvorenim, pa {blocks}.',
      capNowDangles: 'Poveznica {link} i dalje pamti {text}, a ondje više nema unosa.',
      capMv: '`mv` je preimenovao unos {from} u {to}: isti inode {ino}, brojač ostaje {n}.',
      capMvHard: 'Unos {h} i dalje pokazuje na taj inode.',
      capCatHard: 'Čvrsta poveznica {h} i dalje radi: `mv` je promijenio samo unos {old}, a inode {ino} ostao je isti.',
      capMkdir: '`mkdir -p` je napravio direktorij {dir}: zasad prazan popis unosa.',
      capKill: 'Proces {pid} je završio i zatvorio datoteku. Brojač je 0 i nitko je ne drži otvorenom: {blocks}.',
      capKillNone: 'Procesa {pid} nema (prekidač „Proces drži datoteku otvorenom” je isključen), pa je prostor oslobođen već pri `rm`.',
      explain: '<p>Ime datoteke nije datoteka. Ime je [[directory entry]]: redak u popisu direktorija koji pokazuje na ' +
        '<em lang="en">inode</em> (zapis o datoteci) s njezinim brojem, vrstom, [[link count]] i blokovima podataka. ' +
        '<code>ls -li</code> ispisuje broj inodea na početku retka, a brojač poveznica iza bitova dozvola.</p>' +
        '<p><code>ln</code> dodaje novi unos istom inodeu: to je <em lang="en">hard link</em> (čvrsta poveznica), drugo ' +
        'ime iste datoteke, ne kopija i ne pokazivač na drugo ime. <code>rm</code> uklanja jedan unos i smanjuje brojač ' +
        'za jedan. Prostor se oslobađa tek kad brojač padne na 0 <b>i</b> nijedan [[process]] datoteku ne drži ' +
        'otvorenom.</p>' +
        '<p><code>ln -s</code> stvara novi inode vrste <code>l</code>, <em lang="en">symbolic link</em> (simbolička ' +
        'poveznica), koji pamti samo stazu. Staza se razrješava pri svakom pristupu, iz direktorija same poveznice; ako ' +
        'ondje nema unosa, poveznica je <em lang="en">dangling</em> (viseća). Simbolička poveznica datoteku ne drži na ' +
        'životu, a <code>mv</code> koji promijeni ime ostavlja je da visi.</p>'
    },
    en: {
      stage: 'Directories, inodes and data blocks',
      // panel
      scene: 'Example',
      showBlocks: 'Data blocks',
      holdOpen: 'A process holds the file open',
      holdOpenHint: 'tail -f opens the example\'s main file at the start and holds it to the end.',
      holdOpenOff: 'In this example the file only appears in step 2.',
      pPrimjer: 'A second name: ln and rm',
      pPrimjerHint: 'The book\'s experiment: two names, one inode 33616720.',
      pSadrzaj: 'The content stays',
      pSadrzajHint: 'printf, ln, rm, cat: the content never moves.',
      pSimbolicka: 'Symbolic link',
      pSimbolickaHint: 'It stores only a path; without the file it dangles.',
      pPreimenuj: 'Renaming',
      pPreimenujHint: 'mv: the hard link works, the symlink dangles.',
      pOtvorena: 'An open file',
      pOtvorenaHint: 'The count is 0, and the space comes back only when the process ends.',
      // legend
      legEntry: 'directory entry',
      legInode: 'inode (-, d, l)',
      legHard: 'name → inode',
      legSym: 'symlink path',
      legHeld: 'open, no name',
      legChanged: 'changed',
      legHop: 'lookup path',
      // stage
      dirTitle: 'directory entries of {dir}',
      dirEmpty: 'no entries',
      noDirs: 'The directory does not exist yet.',
      inodesTitle: 'inodes',
      noInodes: 'There are no inodes.',
      ghost: 'no entry',
      removed: 'removed',
      renamed: 'renamed',
      tFile: 'file',
      tDir: 'directory',
      tSymlink: 'symbolic link',
      fNlink: 'link count',
      fOpen: 'open in process',
      fData: 'data',
      fPath: 'path',
      empty: '(none)',
      dirData: 'its own list of entries',
      noName: 'no name',
      freed: 'freed',
      blocksTitle: 'Data blocks (4 KiB each)',
      blocksCount: '{used} of {total} used',
      procChip: 'process {pid}: {cmd}',
      before: 'Press → for the first command.',
      blocks: ['{n} block', '{n} blocks'],
      blocksFreeAgain: ['so {n} block is free again', 'so {n} blocks are free again'],
      blocksStay: ['{n} block stays in use', '{n} blocks stay in use'],
      blocksNowFree: ['only now is {n} block free', 'only now are {n} blocks free'],
      // captions: start
      capStart_primjer: 'The directory {dir} has two entries: {file} points to inode {ino}, {sub} to inode {dino}. Every name is a [[directory entry]] that points to one *inode*.',
      capStart_sadrzaj: 'Nothing exists yet. The book\'s experiment in one line: make {dir}, write a file, give it a second name, remove the first and print what is left.',
      capStart_simbolicka: 'In {dir} there is a file {file} (inode {ino}, one block). Now we give it a symbolic link and see what survives a removal.',
      capStart_preimenuj: 'In {dir} there is a file {file} (inode {ino}). It will get a hard link and a symbolic link, then a new name.',
      capStart_otvorena: 'The file {file} (inode {ino}) takes {blocks}. We will remove its only name.',
      capHeld: 'Process {pid} ({tail}) holds {file} open.',
      // captions: steps
      capLs: '`ls -li` lists the entries of {dir}: the first number on a line is the inode number, the one after the mode bits the [[link count]]. The first says which file it is, the second how many names point to it.',
      capLsEmpty: '{dir} has no entries, so `ls` has nothing to list.',
      capLsHeld: '{dir} has no entries, yet inode {ino} still takes {blocks}: process {pid} holds it open.',
      capLn: '`ln` added the entry {name}, which points to the same inode {ino}: two names, one file. The link count rose from {from} to {to}; nothing was copied.',
      capLnErr: '`ln` failed: {why} Nothing changed.',
      whyEXDEV: 'the entry and the inode must be on the same filesystem.',
      whyEPERM: 'a directory may not get a second name.',
      whyEEXIST: 'that name exists already.',
      whyENOENT: 'there is no such entry.',
      capSym: '`ln -s` made a new inode {ino} of type `l` that stores only the text {text}. The link count of {target} stayed at {n}.',
      capSymNone: '`ln -s` made a new inode {ino} of type `l` with the text {text}; nothing is there yet, and that is allowed.',
      capCat: '`cat` looked up the entry {name}, reached inode {ino} and printed its content.',
      capCatKept: '`cat` reads {name} and prints {data}: the same inode {ino}, the same block. Removing the name {gone} did not touch the content.',
      capCatSym: '`cat` opened {name}: it is a symbolic link, so it read its text {text}, looked it up from the link\'s own directory and reached inode {ino}.',
      capDangling: 'A symbolic link stores only the path {text}; there is nothing there now, so `cat` reports `No such file or directory`. Such a link is dangling.',
      capDanglingHeld: 'The old inode {ino} still exists because process {pid} holds it open, but no name leads to it.',
      capWriteNew: 'There is no entry {name}, so the redirection made a new inode {ino} ({blocks}) and the entry {name} that points to it.',
      capWriteHeals: 'The link {link} stores the text {text}, so it now leads to the new inode.',
      capRmKept: '`rm` removed the entry {name}; the link count of inode {ino} fell from {from} to {to} — the content was not touched.',
      capRmFreed: '`rm` removed the entry {name}; the link count of inode {ino} fell to 0 and no process holds it, {blocks}.',
      capRmFreedNone: '`rm` removed the entry {name}; the link count of inode {ino} fell to 0 and no process holds it, so the inode is freed.',
      capRmPostponed: '`rm` removed the last name {name}: the count of inode {ino} is 0, but process {pid} holds it open, so {blocks}.',
      capNowDangles: 'The link {link} still stores {text}, and there is no entry there any more.',
      capMv: '`mv` renamed the entry {from} to {to}: the same inode {ino}, the count stays {n}.',
      capMvHard: 'The entry {h} still points to that inode.',
      capCatHard: 'The hard link {h} still works: `mv` changed only the entry {old}; the inode {ino} stayed the same.',
      capMkdir: '`mkdir -p` made the directory {dir}: an empty list of entries for now.',
      capKill: 'Process {pid} ended and closed the file. The count is 0 and nobody holds it open: {blocks}.',
      capKillNone: 'There is no process {pid} (the switch “A process holds the file open” is off), so the space was freed already at `rm`.',
      explain: '<p>A file\'s name is not the file. A name is a [[directory entry]]: a line in a directory\'s list that ' +
        'points to an <em lang="en">inode</em>, the record of the file with its number, type, [[link count]] and data ' +
        'blocks. <code>ls -li</code> prints the inode number at the start of the line and the link count after the ' +
        'mode bits.</p>' +
        '<p><code>ln</code> adds a new entry to the same inode: a <em lang="en">hard link</em>, a second name of the ' +
        'same file, not a copy and not a pointer to the other name. <code>rm</code> removes one entry and lowers the ' +
        'count by one. The space is freed only when the count falls to 0 <b>and</b> no [[process]] holds the file ' +
        'open.</p>' +
        '<p><code>ln -s</code> makes a new inode of type <code>l</code>, a <em lang="en">symbolic link</em>, which ' +
        'stores only a path. The path is resolved at every access, from the link\'s own directory; if there is no ' +
        'entry there, the link is <em lang="en">dangling</em>. A symbolic link does not keep the file alive, and an ' +
        '<code>mv</code> that changes the name leaves it dangling.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
