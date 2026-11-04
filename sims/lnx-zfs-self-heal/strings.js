/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-zfs-self-heal, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term the page sets in italics (<em lang="en">): the
   Croatian term rule for terms the glossary lacks (NOTES.md, Term pairs). Pool, device and file names, block numbers,
   checksums and the status output are data and come in as placeholders. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Blokovi na diskovima, pokazivači s kontrolnim zbrojevima i stanje bazena',
      gridTitle: 'Blokovi na diskovima',
      metaBlock: 'blok = 4K',
      metaSum: 'zbroj skraćen na 4 heksadekadske znamenke',
      metaNoSum: 'bez kontrolnih zbrojeva',
      rowRoot: 'korijen',
      rowPtr: 'pokazivači',
      copyN: '(kopija {n})',
      cursorScrub: 'provjera',
      cursorCheck: 'usporedba',
      statusPool: 'Stanje bazena',
      statusMd: 'Stanje polja',
      served: 'vraćeno aplikaciji',

      scene: 'Scenarij',
      redundancy: 'Zalihost',
      optMirror: 'zrcalo, ZFS',
      optSingle: 'jedan disk, ZFS',
      optMd: 'md RAID 1, bez zbrojeva',
      copies2: 'Dvije kopije na disku',

      presetScrub: 'Provjera popravlja',
      presetScrubHint: 'Dva tiho oštećena bloka na sdb: provjera ih nađe i prepiše sa sda.',
      presetRead: 'Čitanje liječi',
      presetReadHint: 'Aplikacija čita film.mkv: blok 4 dolazi sa sdb, a sda se prepisuje.',
      presetBoth: 'Obje kopije loše',
      presetBothHint: 'Blok 6 oštećen na oba diska: trajna greška u film.mkv.',
      presetSingle: 'Jedan disk',
      presetSingleHint: 'Otkrije, ali ne popravi. Uključi dvije kopije pa ponovi.',
      presetMd: 'md bez zbrojeva',
      presetMdHint: 'Usporedba nađe razliku, ali ne zna koja je kopija ispravna.',

      legChanged: 'promijenjeno u ovom koraku',
      legRead: 'pročitano u ovom koraku',
      legGood: 'ispravna kopija',
      legRotten: 'oštećena kopija ⚡',
      legHealed: 'prepisana kopija ↺',
      legBad: 'trajna greška',
      legSum: 'zbroj u pokazivaču; ✓ odgovara, ✗ ne',
      legLink: 'prepisivanje iz druge kopije',

      termSum: '*checksum* (kontrolni zbroj)',
      termSumLater: '*checksum*',
      termSumCap: '*Checksum* (kontrolni zbroj)',
      termSumCapLater: '*Checksum*',
      termScrub: '*scrub* (provjera integriteta)',
      termScrubLater: '*scrub*',
      termScrubCap: '*Scrub* (provjera integriteta)',
      termScrubCapLater: '*Scrub*',
      termHeal: '*self-healing* (samoizlječenje)',
      termHealLater: '*self-healing*',
      termRot: '*Silent corruption* (tiho oštećenje)',
      termRotLater: '*Silent corruption*',

      capStartMirror: 'Bazen {pool}: zrcalo {vdev} od diskova {sda} i {sdb}, na oba isti sadržaj. Svaki pokazivač nosi {sum} bloka na koji pokazuje, pa blok provjerava njegov roditelj, a ne on sam.',
      capStartSingle: 'Bazen {pool} na jednom disku {sda}: svaki blok ima jednu kopiju. Svaki pokazivač nosi {sum} bloka na koji pokazuje, pa blok provjerava njegov roditelj, a ne on sam.',
      capStartCopies: 'Bazen {pool} na jednom disku {sda}, ali skup podataka čuva dvije kopije svakog bloka ({copies}), obje na istom disku. Svaki pokazivač nosi {sum} bloka na koji pokazuje.',
      capStartMd: 'Polje {md}: RAID 1 od diskova {sda} i {sdb}, na oba isti sadržaj. Datotečni sustav na njemu ne čuva kontrolne zbrojeve podataka: pokazivač zna gdje je blok, ali ne i kakav treba biti.',
      capPress: 'Pritisni → za prvi korak.',

      capCorrupt: '{rot}: promijenio se jedan bit bloka {b} na {dev} ({from} → {to}). Disk to ne prijavljuje i nijedan brojač se ne mijenja.',
      capCorruptAgain: 'Blok {b} na {dev} već je oštećen; ništa se dodatno ne mijenja.',

      capReadOk: 'Aplikacija čita blok {b} ({file}). Kopija na {dev} daje {hash}, isti {sum} kao u pokazivaču, pa se vraća aplikaciji.',
      capReadOther: 'Druga kopija se ne čita.',
      capReadOtherBad: 'Druga kopija se ne čita, pa njezino oštećenje ostaje neotkriveno.',
      capReadWasHealed: 'Ta je kopija ranije prepisana ispravnim sadržajem, pa CKSUM ostaje {n}.',
      capBadCopy: '{sumCap} bloka {b} na {bad} ({hash}) ne odgovara onome zapisanom u pokazivaču.',
      capHealRead: 'Kopija na {good} odgovara, pa se blok vraća iz nje i {bad} se prepisuje ispravnim sadržajem: {heal}.',
      capHealScrub: 'Kopija na {good} odgovara, pa se {bad} prepisuje ispravnim sadržajem: {heal}.',
      capNoError: 'Aplikacija ne vidi grešku; CKSUM za {dev} raste na {n}.',
      capCksum: 'CKSUM za {dev} raste na {n}.',
      capPermOne: 'Druge kopije nema: greška je otkrivena, ali se ne može popraviti. CKSUM za {dev} raste na {n}.',
      capListAdd: '{file} ide na popis trajnih grešaka.',
      capListStays: '{file} je već na popisu trajnih grešaka.',
      capPermAll: 'Nijedna kopija bloka {b} ne odgovara pokazivaču i nema ispravne iz koje bi se popravila. Greška je trajna i prijavljuje se jednom, a ne po kopiji.',
      capEio: 'Aplikacija dobiva ulazno-izlaznu grešku ({eio}).',
      capStill: 'Ponovno čitanje ne pomaže.',

      capScrubOk: '{scrub} čita blok {b} ({file}) na svim kopijama: sve odgovaraju pokazivaču.',
      capScrubOkOne: '{scrub} čita blok {b} ({file}): kopija odgovara pokazivaču.',
      capScrubRead: '{scrub} čita blok {b} ({file}) na svim kopijama.',
      capScrubReadOne: '{scrub} čita blok {b} ({file}).',
      capScrubEnd: 'Provjera je gotova: {rep}, {err}. Slobodni blokovi {free} nisu čitani: provjerava se samo ono na što pokazuje neki pokazivač.',
      repBlocks: ['popravljen {n} blok', 'popravljena {n} bloka', 'popravljeno {n} blokova'],
      errBlocks: ['{n} trajna greška', '{n} trajne greške', '{n} trajnih grešaka'],
      capPass: 'Cijeli {scrub} u jednom koraku: čita svaku kopiju svakog zauzetog bloka.',
      capPassHealed: 'Prepisane kopije bloka {list}; ZFS-ov {scrub} uvijek i popravlja.',
      capPassClean: 'Sve kopije odgovaraju pokazivačima; nema se što popraviti.',
      capPassPerm: 'Trajna greška u bloku {list}.',

      capMdRead: 'md čita blok {b} s diska {dev} (md sam bira disk) i vraća ga bez ikakve provjere.',
      capMdReadBad: 'To je oštećena kopija ({to} umjesto {from}): aplikacija dobiva krive podatke i nikakvu grešku.',
      capMdReadOk: 'Ta je kopija ispravna.',
      capMdReadOther: 'Isti blok s drugog diska bio bi oštećen: odgovor ovisi o tome koji disk md izabere.',
      capMdBothBad: 'Obje su kopije sada iste i krive, pa ni sljedeća usporedba neće ništa naći.',
      capMdBlockSame: 'md uspoređuje kopije bloka {b}: iste su.',
      capMdBlockDiff: 'md uspoređuje kopije bloka {b}: razlikuju se, pa {mm} raste na {n}. Koja je ispravna, md ne zna: nema kontrolnog zbroja.',
      capMdEnd: 'Usporedba je gotova. md je usporedio i slobodne blokove {free}, jer ne zna koji su u upotrebi.',
      capMdCheck: 'md uspoređuje kopije svih blokova, i slobodnih ({check}).',
      capMdCheckDiff: 'Blok {list} se razlikuje, pa je {mm} {n}. Koja je kopija ispravna, md ne može reći.',
      capMdCheckSame: 'Sve su kopije iste; {mm} je 0.',
      capMdRepair: 'md popravlja ({repair}): za svaki blok koji se razlikuje prepisuje kopiju s prvog diska, {sda}, preko druge.',
      capMdRepairBad: 'Oštećena je bila baš kopija na {sda}, pa je oštećenje sada na oba diska.',
      capMdRepairLucky: 'Ovdje je kopija na {sda} bila ispravna, pa je popravak pogodio: srećom, a ne znanjem.',
      capMdRepairNone: 'Nema razlika; ništa se ne prepisuje.',

      explain: '<p>ZFS uz svaki pokazivač na blok zapisuje i <em lang="en">checksum</em> (kontrolni zbroj) tog bloka ' +
        '(zadano fletcher4, po želji sha256). Blok tako provjerava njegov roditelj, a ne on sam: oštećeni blok ne može ' +
        'nositi i odgovarajući zbroj. Ovdje je zbroj skraćen na četiri heksadekadske znamenke.</p>' +
        '<p><em lang="en">Silent corruption</em> (tiho oštećenje) je promjena podataka koju disk ne prijavi. Pri čitanju ' +
        'ZFS uzme jednu kopiju (ovdje uvijek prvu) i provjeri je; ako ne odgovara, uzme drugu. Ispravnu vrati aplikaciji i njome prepiše ' +
        'lošu: <em lang="en">self-healing</em> (samoizlječenje). Stupci READ i WRITE broje greške koje je disk javio, ' +
        'CKSUM kopije koje nisu prošle provjeru.</p>' +
        '<p>Čitanje gleda samo kopiju koja mu treba, pa oštećenje druge kopije ostaje skriveno. <em lang="en">Scrub</em> ' +
        '(provjera integriteta) čita svaku kopiju svakog zauzetog bloka i popravlja isto kao čitanje; slobodni prostor ' +
        'ne gleda. Kad nijedna kopija ne odgovara, greška je trajna i <code>zpool status -v</code> navodi datoteku.</p>' +
        '<p>Jedan disk grešku otkrije, ali je nema odakle popraviti, osim ako skup podataka čuva dvije kopije ' +
        '(<code>copies=2</code>). Zrcalo md RAID 1 nema zbrojeva: kad se kopije razlikuju, <code>check</code> samo ' +
        'broji razliku (<code>mismatch_cnt</code>, u sektorima), a <code>repair</code> prepiše kopiju s prvog diska, ' +
        'ispravnu ili ne.</p>' +
        '<p>Tri zablude: zrcalo uvijek zna koja je kopija ispravna (samo uz zbrojeve); <em lang="en">scrub</em> je ' +
        'sigurnosna kopija (popravlja iz zalihosti, ne vraća obrisano); nema grešaka čitanja, dakle nema ni loših ' +
        'podataka.</p>'
    },
    en: {
      stage: 'Blocks on the disks, pointers with checksums and the pool status',
      gridTitle: 'Blocks on the disks',
      metaBlock: 'block = 4K',
      metaSum: 'sum cut to 4 hex digits',
      metaNoSum: 'no checksums',
      rowRoot: 'root',
      rowPtr: 'pointers',
      copyN: '(copy {n})',
      cursorScrub: 'scrub',
      cursorCheck: 'compare',
      statusPool: 'Pool status',
      statusMd: 'Array status',
      served: 'returned to the application',

      scene: 'Scene',
      redundancy: 'Redundancy',
      optMirror: 'mirror, ZFS',
      optSingle: 'single disk, ZFS',
      optMd: 'md RAID 1, no checksums',
      copies2: 'Two copies on the disk',

      presetScrub: 'A scrub repairs',
      presetScrubHint: 'Two silently damaged blocks on sdb: the scrub finds them and rewrites them from sda.',
      presetRead: 'A read heals',
      presetReadHint: 'The application reads film.mkv: block 4 comes from sdb, and sda is rewritten.',
      presetBoth: 'Both copies bad',
      presetBothHint: 'Block 6 damaged on both disks: a permanent error in film.mkv.',
      presetSingle: 'Single disk',
      presetSingleHint: 'Detects, does not repair. Turn on two copies and run it again.',
      presetMd: 'md, no checksums',
      presetMdHint: 'The compare finds a difference but cannot tell which copy is right.',

      legChanged: 'changed in this step',
      legRead: 'read in this step',
      legGood: 'good copy',
      legRotten: 'damaged copy ⚡',
      legHealed: 'rewritten copy ↺',
      legBad: 'permanent error',
      legSum: 'sum in the pointer; ✓ matches, ✗ does not',
      legLink: 'rewrite from the other copy',

      termSum: 'checksum',
      termSumLater: 'checksum',
      termSumCap: 'The checksum',
      termSumCapLater: 'The checksum',
      termScrub: 'scrub',
      termScrubLater: 'scrub',
      termScrubCap: 'scrub',
      termScrubCapLater: 'scrub',
      termHeal: 'self-healing',
      termHealLater: 'self-healing',
      termRot: 'Silent corruption',
      termRotLater: 'Silent corruption',

      capStartMirror: 'Pool {pool}: mirror {vdev} of disks {sda} and {sdb}, the same content on both. Every pointer carries the {sum} of the block it points to, so a block is checked by its parent, not by itself.',
      capStartSingle: 'Pool {pool} on one disk, {sda}: every block has one copy. Every pointer carries the {sum} of the block it points to, so a block is checked by its parent, not by itself.',
      capStartCopies: 'Pool {pool} on one disk, {sda}, but the dataset keeps two copies of every block ({copies}), both on the same disk. Every pointer carries the {sum} of the block it points to.',
      capStartMd: 'Array {md}: RAID 1 of disks {sda} and {sdb}, the same content on both. The filesystem on it keeps no checksums of data: a pointer knows where a block is, not what it should be.',
      capPress: 'Press → for the first step.',

      capCorrupt: '{rot}: one bit of block {b} on {dev} has flipped ({from} → {to}). The disk does not report it and no counter changes.',
      capCorruptAgain: 'Block {b} on {dev} is already damaged; nothing more changes.',

      capReadOk: 'The application reads block {b} ({file}). The copy on {dev} gives {hash}, the same {sum} as in the pointer, so it is returned to the application.',
      capReadOther: 'The other copy is not read.',
      capReadOtherBad: 'The other copy is not read, so its damage stays unseen.',
      capReadWasHealed: 'That copy was rewritten with good content earlier, so CKSUM stays {n}.',
      capBadCopy: '{sumCap} of block {b} on {bad} ({hash}) does not match the one stored in its pointer.',
      capHealRead: 'The copy on {good} does, so the block is returned from it and {bad} is rewritten with the good content: {heal}.',
      capHealScrub: 'The copy on {good} does, so {bad} is rewritten with the good content: {heal}.',
      capNoError: 'The application sees no error; CKSUM for {dev} goes up to {n}.',
      capCksum: 'CKSUM for {dev} goes up to {n}.',
      capPermOne: 'There is no other copy: the error is detected but cannot be repaired. CKSUM for {dev} goes up to {n}.',
      capListAdd: '{file} goes on the list of permanent errors.',
      capListStays: '{file} is already on the list of permanent errors.',
      capPermAll: 'No copy of block {b} matches its pointer and there is no good one to repair from. The error is permanent and is reported once, not per copy.',
      capEio: 'The application gets an I/O error ({eio}).',
      capStill: 'Reading again does not help.',

      capScrubOk: 'The {scrub} reads block {b} ({file}) on every copy: all match the pointer.',
      capScrubOkOne: 'The {scrub} reads block {b} ({file}): the copy matches the pointer.',
      capScrubRead: 'The {scrub} reads block {b} ({file}) on every copy.',
      capScrubReadOne: 'The {scrub} reads block {b} ({file}).',
      capScrubEnd: 'The scrub is done: {rep}, {err}. Free blocks {free} were not read: only what some pointer points to is checked.',
      repBlocks: ['{n} block repaired', '{n} blocks repaired'],
      errBlocks: ['{n} permanent error', '{n} permanent errors'],
      capPass: 'A whole {scrub} in one step: it reads every copy of every allocated block.',
      capPassHealed: 'Copies of block {list} rewritten; a ZFS {scrub} always repairs too.',
      capPassClean: 'Every copy matches its pointer; there is nothing to repair.',
      capPassPerm: 'A permanent error in block {list}.',

      capMdRead: 'md reads block {b} from disk {dev} (it picks the disk itself) and returns it with no check at all.',
      capMdReadBad: 'That is the damaged copy ({to} instead of {from}): the application gets wrong data and no error.',
      capMdReadOk: 'That copy is good.',
      capMdReadOther: 'The same block from the other disk would be damaged: the answer depends on which disk md picks.',
      capMdBothBad: 'Both copies are now the same and wrong, so the next compare will find nothing either.',
      capMdBlockSame: 'md compares the copies of block {b}: they are the same.',
      capMdBlockDiff: 'md compares the copies of block {b}: they differ, so {mm} goes up to {n}. Which one is right, md does not know: there is no checksum.',
      capMdEnd: 'The compare is done. md compared the free blocks {free} too, because it does not know which blocks are in use.',
      capMdCheck: 'md compares the copies of every block, free ones too ({check}).',
      capMdCheckDiff: 'Block {list} differs, so {mm} is {n}. Which copy is right, md cannot tell.',
      capMdCheckSame: 'All copies are the same; {mm} is 0.',
      capMdRepair: 'md repairs ({repair}): for every block that differs it writes the copy from the first disk, {sda}, over the other.',
      capMdRepairBad: 'The damaged copy was the one on {sda}, so the damage is now on both disks.',
      capMdRepairLucky: 'Here the copy on {sda} was the good one, so the repair got it right: by luck, not by knowing.',
      capMdRepairNone: 'No differences; nothing is written.',

      explain: '<p>Next to every pointer to a block, ZFS stores that block\'s checksum (fletcher4 by default, sha256 if ' +
        'chosen). A block is checked by its parent, not by itself: a damaged block cannot also carry a matching sum. ' +
        'Here the sum is cut to four hex digits.</p>' +
        '<p>Silent corruption is a change of data the disk does not report. On a read, ZFS takes one copy (here always ' +
        'the first) and checks it; if it does not match, it takes the other. It returns the good copy to the application and ' +
        'rewrites the bad one from it: self-healing. The READ and WRITE columns count errors the disk reported, CKSUM ' +
        'the copies that failed the check.</p>' +
        '<p>A read looks only at the copy it needs, so damage on the other copy stays hidden. A scrub reads every copy of ' +
        'every allocated block and repairs as a read does; it does not look at free space. When no copy matches, the ' +
        'error is permanent and <code>zpool status -v</code> names the file.</p>' +
        '<p>A single disk detects the error but has nothing to repair from, unless the dataset keeps two copies ' +
        '(<code>copies=2</code>). An md RAID 1 mirror has no checksums: when the copies differ, <code>check</code> only ' +
        'counts the difference (<code>mismatch_cnt</code>, in sectors), and <code>repair</code> writes the first ' +
        'disk\'s copy over the other, good or not.</p>' +
        '<p>Three misconceptions: a mirror always knows which copy is right (only with checksums); a scrub is a backup ' +
        '(it repairs from redundancy, it does not bring back deleted data); no read errors means no bad data.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
