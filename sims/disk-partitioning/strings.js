/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of disk-partitioning, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   Terms not in kit/glossary.js yet (primary / extended / logical partition, protective MBR, backup header, sector,
   logical block addressing) are written out in the explanation: NOTES.md "Term pairs". Device names, sector numbers
   and sizes are data and come in as placeholders. The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Isti disk dvaput, kao niz sektora: s tablicom MBR i s tablicom GPT, s uvećanim početkom i krajem, i tablica particija ispod',

      // params
      disk: 'Disk',
      d2g: '2 GiB',
      d1t: '1 TB',
      d4t: '4 TB',
      sector: 'Veličina sektora',
      s512: '512 B',
      s4k: '4096 B',
      parts: 'Broj particija',
      oldTool: 'GPT disk očima alata koji zna samo MBR',
      damageHeader: 'Oštećen početak tablice',
      damageHint: 'GPT: zaglavlje u sektoru 1. MBR: sektor 0.',

      // presets
      pBook: 'Disk iz knjige',
      pBookHint: 'vdb od 2 GiB, particije vjezba (1 MiB – 1 GiB) i druga (1 GiB – 100 %): na GPT-u druga završava na 2146MB.',
      pFour: '4 TB',
      pFourHint: 'Jedna particija na disku od 4 TB: GPT opisuje sve, MBR samo 2 TiB.',
      pFive: 'Pet particija',
      pFiveHint: 'MBR: tri primarne i proširena s dvije logičke (vdb5, vdb6). GPT: pet od 128 zapisa.',
      pOld: 'Stari alat',
      pOldHint: 'Alat koji zna samo MBR vidi na GPT disku jednu particiju vrste ee.',
      pDamaged: 'Oštećeno zaglavlje',
      pDamagedHint: 'GPT čita tablicu iz kopije na kraju diska; MBR kopiju nema.',

      // legend
      legMeta: 'tablica (MBR, zaglavlje, zapisi, kopija)',
      legPart: 'particija',
      legExt: 'proširena particija (okvir)',
      legUnreach: 'nedostupno',
      legProt: 'zaštitni zapis ee',
      legDamaged: 'oštećeno',
      legChanged: 'promijenjeno',

      // the strips
      mbrTitle: 'MBR',
      gptTitle: 'GPT',
      mbrFacts: 'sektor 0: 4 mjesta · brojevi sektora od 32 bita: do {limit}',
      gptFacts: '{used} od {n} zapisa · brojevi sektora od 64 bita · kopija na kraju',
      startInset: 'početak, uvećano',
      endInset: 'kraj, uvećano',
      toScale: 'cijeli disk u mjerilu',
      lMbr: 'MBR',
      lPmbr: 'zaštitni MBR',
      lHeader: 'zaglavlje',
      lEntries: '{n} zapisa',
      lFree: 'prazno',
      lBackupEntries: 'kopija zapisa',
      lBackupHeader: 'kopija zaglavlja',
      lReadHere: 'čitano odavde',
      lLastSector: 'zadnji sektor',
      lUnreach: 'nedostupno',
      lLost: 'nije opisano',
      lEe: 'ee: jedna particija, disk je zauzet',
      lBeyond: 'stari alat ne vidi',
      lDamaged: 'oštećeno',
      lUnknown: '?',
      sectorWord: 'sektor',

      // the tables
      colDev: 'uređaj',
      colNum: 'br.',
      colStart: 'početak',
      colEnd: 'kraj',
      colSize: 'veličina',
      colType: 'vrsta',
      colName: 'ime',
      tableHead: 'tablica {label} · disk {disk} · sektor {ss} B',
      tPrimary: 'primarna',
      tExtended: 'proširena',
      tLogical: 'logička',
      tEe: 'zaštitna',
      tUnrecognised: 'Tablica nije prepoznata: sektor 0 je oštećen, a kopije nema.',
      tFromBackup: 'pročitano iz kopije na kraju diska',
      tOld: 'kako je vidi alat koji zna samo MBR',
      rowMissing: ['{n} tražena particija ne stane u 32 bita', '{n} tražene particije ne stanu u 32 bita', '{n} traženih particija ne stane u 32 bita'],
      rowClipped: 'skraćena',

      // captions
      cEnds: 'Ista podjela u obje tablice. Na GPT-u zadnja particija završava na {gEnd}, {gap} prije kraja diska, a na MBR-u na {mEnd}. GPT {back} drži kopiju zaglavlja i zapisa; ostatak je poravnanje na cijeli MiB, ne pogreška.',
      cEndsSame: 'Ista podjela u obje tablice. Na ovom disku obje zadnje particije završavaju na {gEnd}, na zadnjem cijelom MiB: GPT {back} drži kopiju zaglavlja i zapisa, a ona stane u ostatak iza poravnanja. Na disku iz knjige razlika se vidi: 2146MB prema 2147MB.',
      cFour: 'Četiri particije zauzimaju sva četiri mjesta u sektoru 0 MBR-a. Peta nema kamo: jedno bi mjesto moralo postati proširena particija. GPT je iskoristio 4 od 128 zapisa.',
      cLogical: 'Na MBR-u četvrto mjesto postaje proširena particija ({ext}) prije nego što nastane četvrta primarna; u njoj su logičke particije, svaka iza svojeg EBR-a, s brojevima od 5. Zato je ista particija na GPT-u {g}, a na MBR-u {m}. GPT koristi {n} od 128 zapisa.',
      cUnreachable: 'Disk od {disk} s tablicom MBR: zapis od 32 bita doseže samo {limit}, pa ostatak diska postoji, plaćen je, a nedostupan je — bez ijedne poruke o grešci. GPT opisuje cijeli disk.',
      cOldTool: 'Alat koji zna samo MBR čita sektor 0 GPT diska i nalazi zaštitni MBR: jednu particiju vrste ee preko cijelog diska. Disk mu je zauzet, a ne prazan, pa ga ne prepisuje. Disk nije pokvaren: GPT i particije su netaknuti.',
      cOldToolShort: 'Alat koji zna samo MBR čita sektor 0 GPT diska i nalazi zaštitni MBR: jednu particiju vrste ee, dokle dosežu 32 bita ({limit}). Disk mu je zauzet, a ne prazan, pa ga ne prepisuje. Disk nije pokvaren: GPT i particije su netaknuti.',
      cDamaged: 'Početak tablice je oštećen. GPT čita zaglavlje iz kopije u zadnjem sektoru i nalazi sve particije; tablica se može i vratiti na početak. MBR kopiju nema: bez sektora 0 disk izgleda kao da nema particija, iako su podaci još na njemu.',
      gapSectors: ['{k} sektor', '{k} sektora', '{k} sektora'],
      backSectors: ['u zadnjem {k} sektoru', 'u zadnja {k} sektora', 'u zadnjih {k} sektora'],
      nUnreachable: 'Na MBR-u je sve iza {limit} nedostupno.',
      nMissing: ['MBR ne može opisati {n} traženu particiju: počinje iza {limit}.', 'MBR ne može opisati {n} tražene particije: počinju iza {limit}.', 'MBR ne može opisati {n} traženih particija: počinju iza {limit}.'],
      nOldToo: 'Stari alat i dalje vidi samo zaštitni MBR u sektoru 0, koji je netaknut.',
      n4k: 'Sa sektorom od 4096 B ista 32 bita dosežu 16 TiB, pa MBR opisuje cijeli disk.',

      explain:
        '<p>[[partition table]] stoji na samom disku i kaže gdje počinje i koliko je velika svaka [[partition]]; svaka ' +
        'particija je zaseban [[block device]] (<code>vdb1</code>, <code>vdb2</code>). Disk se adresira brojem sektora ' +
        '(<em lang="en">logical block addressing</em>, logičko adresiranje blokova): sektor 0, 1, 2 i tako do kraja.</p>' +
        '<p><b>MBR.</b> Tablica je u sektoru 0 i ima mjesta za četiri zapisa, <em lang="en">primary partitions</em> ' +
        '(primarne particije). Za više od četiri jedno mjesto postaje <em lang="en">extended partition</em> (proširena ' +
        'particija), okvir za <em lang="en">logical partitions</em> (logičke particije), svaku iza svojeg sektora EBR; ' +
        'Linux ih broji od 5. Početak i veličina pišu se kao brojevi sektora od 32 bita: 2³² × 512 B = 2 TiB (≈ 2,2 TB). ' +
        'Dalje od toga tablica ne može opisati ništa.</p>' +
        '<p><b>GPT.</b> Brojevi sektora imaju 64 bita, a zadana tablica 128 zapisa po 128 B, dakle 32 sektora od 512 B. ' +
        'U sektoru 0 je <em lang="en">protective MBR</em> (zaštitni MBR): jedan zapis vrste <code>ee</code> preko cijelog ' +
        'diska, da ga alat koji zna samo MBR ne vidi kao prazan i ne prepiše ga. U sektoru 1 je [[header]], u sektorima ' +
        '2–33 zapisi, a prva particija počinje na sektoru 2048 (1 MiB). Na kraju diska je [[backup]] zapisa i, u zadnjem ' +
        'sektoru, <em lang="en">backup header</em> (sigurnosna kopija zaglavlja). Zato „100 %” završava prije kraja ' +
        'diska, a oštećeno zaglavlje čita se iz kopije.</p>' +
        '<p>Pravilo: disk veći od 2 TiB (≈ 2,2 TB) ili više od četiri particije znače GPT.</p>'
    },
    en: {
      stage: 'The same disk twice, as a row of sectors: with an MBR table and with a GPT table, with the start and end enlarged, and the partition table below',

      disk: 'Disk',
      d2g: '2 GiB',
      d1t: '1 TB',
      d4t: '4 TB',
      sector: 'Sector size',
      s512: '512 B',
      s4k: '4096 B',
      parts: 'Number of partitions',
      oldTool: 'The GPT disk as an MBR-only tool sees it',
      damageHeader: 'Damaged start of the table',
      damageHint: 'GPT: the header in sector 1. MBR: sector 0.',

      pBook: 'The book\'s disk',
      pBookHint: 'vdb of 2 GiB, partitions vjezba (1 MiB – 1 GiB) and druga (1 GiB – 100 %): on GPT druga ends at 2146MB.',
      pFour: '4 TB',
      pFourHint: 'One partition on a 4 TB disk: GPT describes all of it, MBR only 2 TiB.',
      pFive: 'Five partitions',
      pFiveHint: 'MBR: three primary and an extended one holding two logical (vdb5, vdb6). GPT: five of 128 entries.',
      pOld: 'Old tool',
      pOldHint: 'A tool that knows only MBR sees one partition of type ee on the GPT disk.',
      pDamaged: 'Damaged header',
      pDamagedHint: 'GPT reads the table from the backup at the end of the disk; MBR has no backup.',

      legMeta: 'table (MBR, header, entries, backup)',
      legPart: 'partition',
      legExt: 'extended partition (container)',
      legUnreach: 'unreachable',
      legProt: 'protective entry ee',
      legDamaged: 'damaged',
      legChanged: 'changed',

      mbrTitle: 'MBR',
      gptTitle: 'GPT',
      mbrFacts: 'sector 0: 4 slots · 32-bit sector numbers: up to {limit}',
      gptFacts: '{used} of {n} entries · 64-bit sector numbers · backup at the end',
      startInset: 'start, enlarged',
      endInset: 'end, enlarged',
      toScale: 'the whole disk to scale',
      lMbr: 'MBR',
      lPmbr: 'protective MBR',
      lHeader: 'header',
      lEntries: '{n} entries',
      lFree: 'empty',
      lBackupEntries: 'backup entries',
      lBackupHeader: 'backup header',
      lReadHere: 'read from here',
      lLastSector: 'last sector',
      lUnreach: 'unreachable',
      lLost: 'not described',
      lEe: 'ee: one partition, the disk is in use',
      lBeyond: 'the old tool does not see this',
      lDamaged: 'damaged',
      lUnknown: '?',
      sectorWord: 'sector',

      colDev: 'device',
      colNum: 'no.',
      colStart: 'start',
      colEnd: 'end',
      colSize: 'size',
      colType: 'type',
      colName: 'name',
      tableHead: '{label} table · disk {disk} · sector {ss} B',
      tPrimary: 'primary',
      tExtended: 'extended',
      tLogical: 'logical',
      tEe: 'protective',
      tUnrecognised: 'Table not recognised: sector 0 is damaged and there is no backup.',
      tFromBackup: 'read from the backup at the end of the disk',
      tOld: 'as a tool that knows only MBR sees it',
      rowMissing: ['{n} requested partition does not fit in 32 bits', '{n} requested partitions do not fit in 32 bits'],
      rowClipped: 'cut short',

      cEnds: 'The same split in both tables. On GPT the last partition ends at {gEnd}, {gap} before the end of the disk; on MBR at {mEnd}. GPT keeps the backup of its header and entries in {back}; the rest is alignment to a whole MiB, not a bug.',
      cEndsSame: 'The same split in both tables. On this disk both last partitions end at {gEnd}, on the last whole MiB: GPT keeps the backup of its header and entries in {back}, which fits in the remainder after alignment. On the book\'s disk the difference shows: 2146MB against 2147MB.',
      cFour: 'Four partitions take all four slots in MBR\'s sector 0. A fifth has nowhere to go: one slot would have to become an extended partition. GPT has used 4 of its 128 entries.',
      cLogical: 'On MBR the fourth slot becomes an extended partition ({ext}) before a fourth primary is made; inside it are logical partitions, each behind its own EBR, numbered from 5. So the same partition is {g} on GPT and {m} on MBR. GPT uses {n} of 128 entries.',
      cUnreachable: 'A {disk} disk with an MBR table: the 32-bit fields reach only {limit}, so the rest of the disk is there and paid for but unreachable, without a single error message. GPT describes the whole disk.',
      cOldTool: 'A tool that knows only MBR reads sector 0 of the GPT disk and finds the protective MBR: one partition of type ee over the whole disk. To it the disk is in use, not empty, so it does not overwrite it. The disk is not broken: GPT and the partitions are intact.',
      cOldToolShort: 'A tool that knows only MBR reads sector 0 of the GPT disk and finds the protective MBR: one partition of type ee, as far as 32 bits reach ({limit}). To it the disk is in use, not empty, so it does not overwrite it. The disk is not broken: GPT and the partitions are intact.',
      cDamaged: 'The start of the table is damaged. GPT reads the header from its backup in the last sector and finds every partition; the table can also be written back to the start. MBR has no backup: without sector 0 the disk looks as if it had no partitions, though the data is still on it.',
      gapSectors: ['{k} sector', '{k} sectors'],
      backSectors: ['the last {k} sector', 'the last {k} sectors'],
      nUnreachable: 'On MBR everything past {limit} is unreachable.',
      nMissing: ['MBR cannot describe {n} requested partition: it starts past {limit}.', 'MBR cannot describe {n} requested partitions: they start past {limit}.'],
      nOldToo: 'The old tool still sees only the protective MBR in sector 0, which is intact.',
      n4k: 'With 4096-byte sectors the same 32 bits reach 16 TiB, so MBR describes the whole disk.',

      explain:
        '<p>The [[partition table]] is on the disk itself and says where each [[partition]] starts and how big it is; ' +
        'each partition is a [[block device]] of its own (<code>vdb1</code>, <code>vdb2</code>). The disk is addressed ' +
        'by sector number (logical block addressing): sector 0, 1, 2 and so on to the end.</p>' +
        '<p><b>MBR.</b> The table is in sector 0 and has room for four entries, the primary partitions. For more than ' +
        'four, one slot becomes an extended partition, a container for logical partitions, each behind its own EBR ' +
        'sector; Linux numbers them from 5. Start and size are written as 32-bit sector numbers: 2³² × 512 B = 2 TiB ' +
        '(≈ 2.2 TB). The table cannot describe anything past that.</p>' +
        '<p><b>GPT.</b> Sector numbers have 64 bits, and the default table has 128 entries of 128 B, which is 32 sectors ' +
        'of 512 B. Sector 0 holds a protective MBR: one entry of type <code>ee</code> over the whole disk, so that a ' +
        'tool that knows only MBR does not see the disk as empty and overwrite it. Sector 1 holds the [[header]], ' +
        'sectors 2–33 the entries, and the first partition starts at sector 2048 (1 MiB). At the end of the disk are a ' +
        '[[backup]] of the entries and, in the last sector, the backup header. That is why "100 %" ends before the end ' +
        'of the disk, and why a damaged header is read from the backup.</p>' +
        '<p>Rule of thumb: a disk over 2 TiB (≈ 2.2 TB), or more than four partitions, means GPT.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
