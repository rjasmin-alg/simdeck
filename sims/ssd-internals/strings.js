/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ssd-internals, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). *English term* in a caption is set in italics with lang="en" by the page
   (the Croatian term rule for terms the glossary lacks; NOTES.md "Term pairs").
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Logički blokovi računala, FTL mapa i NAND stranice',
      dec: ',',
      gridTitle: 'Računalo i NAND: 4 bloka za brisanje × 4 stranice',
      gridMeta: '16 stranica za 10 LBA-ova: 6 pričuvnih',
      rowHost: 'LBA',
      active: 'aktivni',
      reserveBadge: 'R',
      reserveTitle: 'pričuvni blok',
      erased: 'obrisan ×{n}',
      countWa: 'WA = {wa}',
      cardCounters: 'Brojači',
      cHost: 'pisanja računala',
      cNand: 'pisanja u NAND',
      cCopies: 'od toga kopije GC-a',
      cWa: 'pojačanje pisanja',
      cGc: 'pokretanja GC-a',
      cFromFill: 'Broji se od kraja punjenja (10 = 10).',
      cFromEmpty: 'Broji se od praznog diska.',
      gcLog: 'Dnevnik GC-a',
      gcNone: 'još nijedno',
      gcEntry: ['GC {i}: {v} → {to}, {k} stranica', 'GC {i}: {v} → {to}, {k} stranice', 'GC {i}: {v} → {to}, {k} stranica'],

      pattern: 'Uzorak pisanja',
      patHot: 'vruće',
      patSpread: 'raspršeno',
      patTrim: 's TRIM-om',
      patFill: 'punjenje',
      lba: 'LBA za gumbe',
      btnWrite: 'Piši LBA',
      btnTrim: 'TRIM za LBA',
      btnUndo: 'Poništi moje naredbe',
      showMap: 'FTL mapa i strelice',
      showMapHint: 'Ispod svakog LBA-a: blok.stranica na koju pokazuje.',

      presetHot: 'Vrući podaci',
      presetHotHint: 'LBA 0–3 prepisuju se dvaput',
      presetSpread: 'Raspršena pisanja',
      presetSpreadHint: 'Svaki četvrti LBA: malo smeća u svakom bloku',
      presetTrim: 'TRIM prije pisanja',
      presetTrimHint: 'Datoteke na LBA 6–9 obrisane, pa ista pisanja',
      presetFill: 'Prvo punjenje',
      presetFillHint: 'Prazan disk, LBA 0–9 jedan po jedan',

      legFree: 'slobodna',
      legValid: 'valjana (LBA)',
      legInvalid: 'nevaljana',
      legActive: 'aktivni blok',
      legReserve: 'pričuva',
      legLink: 'mapa / kopija',
      legStale: 'stara mapa',
      legErase: 'brisanje',
      legChanged: 'promijenjeno',

      hostWrites: ['{n} pisanje računala', '{n} pisanja računala', '{n} pisanja računala'],
      nandWrites: ['{n} pisanje u NAND', '{n} pisanja u NAND', '{n} pisanja u NAND'],
      copied: ['{n} valjana stranica kopira se', '{n} valjane stranice kopiraju se', '{n} valjanih stranica kopira se'],
      invalidPages: ['{n} nevaljana', '{n} nevaljane', '{n} nevaljanih'],

      cap0: 'Prazan disk: svih 16 stranica je obrisano i nijedan LBA nije zapisan. Korak 1 jednom upisuje LBA 0–9 (datoteke na disku).',
      cap0Fill: 'Prazan disk: svih 16 stranica je obrisano. Računalo će upisati LBA 0–9 jedan po jedan.',
      capFill: 'Disk je napunjen: LBA 0–9 upisani su jednom, 10 pisanja računala = 10 pisanja u NAND. {r} ostaje slobodan kao pričuva. Brojači kreću od nule.',
      capOpened: '{prev} je pun, pa *flash translation layer* (sloj prevođenja adresa, FTL) otvara {b}, najniži slobodni blok.',
      capWriteNew: 'Računalo piše {l}: FTL ga stavlja na sljedeću slobodnu stranicu aktivnog bloka, {at}.',
      capWriteOver: 'Računalo prepisuje {l}. Flash ne može pisati preko stare stranice: novi podaci idu na {at}, FTL mapa se pomiče, a stara stranica {old} postaje nevaljana.',
      capNextGc: 'Aktivni blok je pun, a slobodan je još samo pričuvni {r}: sljedeće pisanje najprije traži skupljanje smeća.',
      capGc: '{v} ima najviše nevaljanih stranica ({i}), pa ga skupljanje smeća (*garbage collection*) bira{tie}: {moved} u pričuvni blok {r} (pisanja u NAND koja računalo nije tražilo), a {v} se briše (×{e}) i postaje nova pričuva.',
      tieErase: ' (jednako kao {o}, ali je manje puta brisan)',
      tieNumber: ' (jednako kao {o}, a ima niži broj)',
      capTrim: 'TRIM {ls}: računalo javlja disku da ti LBA-ovi više nisu u uporabi (datoteke su obrisane). FTL označava njihove stranice nevaljanima bez ijednog pisanja u NAND, pa ih skupljanje smeća više neće kopirati.',
      capTrimMiss: '{ls} nije mapiran: TRIM nema što označiti.',
      capEnd: 'Na kraju: {h} koštalo je {n}, pojačanje pisanja (*write amplification*) = {wa}.',
      capEndTrim: 'TRIM je disku rekao da LBA 6–9 više nisu u uporabi: skupljanje smeća ih preskače, pa ista pisanja sada koštaju {n} umjesto {m}.',
      capEndFill: 'Prvo punjenje praznog diska: {h} = {n}, pojačanje pisanja (*write amplification*) = {wa}. Ništa nije trebalo premjestiti.',
      capFull: 'Ta naredba ne stane: prolaz bi imao više od {max} koraka. Poništi svoje naredbe ili odaberi drugi primjer.',

      explain: '<p>Računalo vidi samo logičke blokove (LBA 0–9). <em lang="en">NAND</em> flash ima drugačija pravila: ' +
        'stranica (<em lang="en">page</em>) se može upisati samo kad je obrisana, a briše se samo cijeli ' +
        '<em lang="en">erase block</em> (blok za brisanje). Zato disk ne piše preko starih podataka. ' +
        '<em lang="en">Flash translation layer</em> (sloj prevođenja adresa, FTL) piše svaki LBA na sljedeću slobodnu ' +
        'stranicu aktivnog bloka, pomiče mapu LBA → blok.stranica, a stara stranica postaje nevaljana.</p>' +
        '<p>Nevaljane stranice zauzimaju mjesto dok se njihov blok ne obriše. Kad ostane slobodan samo jedan blok, ' +
        '<em lang="en">garbage collection</em> (skupljanje smeća) bira blok s najviše nevaljanih stranica, kopira njegove ' +
        'valjane stranice u taj pričuvni blok i briše ga. Te kopije računalo nije tražilo: <em lang="en">write ' +
        'amplification</em> (pojačanje pisanja) = pisanja u NAND / pisanja računala. Svako brisanje troši blok ' +
        '(<em lang="en">wear</em>, trošenje): brojač ispod bloka. 6 od 16 stranica je <em lang="en">over-provisioning</em> ' +
        '(pričuvni prostor) koji računalo ne vidi.</p>' +
        '<p>Brisanje datoteke mijenja samo datotečni sustav. Disk to ne zna i kopira stare podatke dalje, dok mu ' +
        'računalo naredbom <em lang="en">TRIM</em> ne javi da ti LBA-ovi više nisu u uporabi.</p>' +
        '<p><b>Česte zablude.</b> „SSD prepisuje blok na istom mjestu kao tvrdi disk.” Ne: piše na novu stranicu. ' +
        '„Brisanje datoteke oslobađa flash.” Tek TRIM. „Pojačanje pisanja svojstvo je diska.” Ovisi o uzorku pisanja i ' +
        'slobodnom prostoru: isti disk ovdje daje 1,0, 1,75 ili 3,25.</p>' +
        '<p>Pojednostavljeno: nema izjednačavanja trošenja statičkih podataka, SLC predmemorije ni paralelnih kanala.</p>'
    },
    en: {
      stage: 'The host\'s logical blocks, the FTL map and the NAND pages',
      dec: '.',
      gridTitle: 'Host and NAND: 4 erase blocks × 4 pages',
      gridMeta: '16 pages for 10 LBAs: 6 spare',
      rowHost: 'LBA',
      active: 'active',
      reserveBadge: 'R',
      reserveTitle: 'reserve block',
      erased: 'erased ×{n}',
      countWa: 'WA = {wa}',
      cardCounters: 'Counters',
      cHost: 'host writes',
      cNand: 'NAND writes',
      cCopies: 'of them GC copies',
      cWa: 'write amplification',
      cGc: 'GC runs',
      cFromFill: 'Counted from the end of the fill (10 = 10).',
      cFromEmpty: 'Counted from the empty drive.',
      gcLog: 'GC log',
      gcNone: 'none yet',
      gcEntry: ['GC {i}: {v} → {to}, {k} page', 'GC {i}: {v} → {to}, {k} pages'],

      pattern: 'Write pattern',
      patHot: 'hot',
      patSpread: 'spread',
      patTrim: 'with TRIM',
      patFill: 'first fill',
      lba: 'LBA for the buttons',
      btnWrite: 'Write LBA',
      btnTrim: 'TRIM LBA',
      btnUndo: 'Undo my ops',
      showMap: 'FTL map and arrows',
      showMapHint: 'Under each LBA: the block.page it points to.',

      presetHot: 'Hot data',
      presetHotHint: 'LBA 0–3 are rewritten twice',
      presetSpread: 'Spread writes',
      presetSpreadHint: 'Every fourth LBA: a little garbage in every block',
      presetTrim: 'TRIM first',
      presetTrimHint: 'The files on LBA 6–9 were deleted, then the same writes',
      presetFill: 'First fill',
      presetFillHint: 'An empty drive, LBA 0–9 one by one',

      legFree: 'free',
      legValid: 'valid (LBA)',
      legInvalid: 'invalid',
      legActive: 'active block',
      legReserve: 'reserve',
      legLink: 'map / copy',
      legStale: 'stale map',
      legErase: 'erase',
      legChanged: 'changed',

      hostWrites: ['{n} host write', '{n} host writes'],
      nandWrites: ['{n} NAND write', '{n} NAND writes'],
      copied: ['{n} valid page is copied', '{n} valid pages are copied'],
      invalidPages: ['{n} invalid', '{n} invalid'],

      cap0: 'An empty drive: all 16 pages are erased and no LBA is written. Step 1 writes LBA 0–9 once (the files on the drive).',
      cap0Fill: 'An empty drive: all 16 pages are erased. The host will write LBA 0–9 one by one.',
      capFill: 'The drive is filled: LBA 0–9 are written once, 10 host writes = 10 NAND writes. {r} stays free as the reserve. The counters start from zero.',
      capOpened: '{prev} is full, so the *flash translation layer* (FTL) opens {b}, the lowest free block.',
      capWriteNew: 'The host writes {l}: the FTL puts it on the next free page of the active block, {at}.',
      capWriteOver: 'The host overwrites {l}. Flash cannot program over the old page: the new data goes to {at}, the FTL map moves, and the old page {old} becomes invalid.',
      capNextGc: 'The active block is full and only the reserve {r} is free: the next write needs garbage collection first.',
      capGc: '{v} has the most invalid pages ({i}), so *garbage collection* picks it{tie}: {moved} into the reserve block {r} (NAND writes the host never asked for), then {v} is erased (×{e}) and becomes the new reserve.',
      tieErase: ' (tied with {o}, but erased fewer times)',
      tieNumber: ' (tied with {o}, and it has the lower number)',
      capTrim: 'TRIM {ls}: the host tells the drive these LBAs are no longer in use (the files were deleted). The FTL marks their pages invalid without a single NAND write, so garbage collection will not copy them.',
      capTrimMiss: '{ls} is not mapped: TRIM has nothing to mark.',
      capEnd: 'In the end: {h} cost {n}, *write amplification* = {wa}.',
      capEndTrim: 'TRIM told the drive that LBAs 6–9 are no longer in use: GC skips them, and the same writes now cost {n} instead of {m}.',
      capEndFill: 'First fill of an empty drive: {h} = {n}, *write amplification* = {wa}. Nothing had to be moved.',
      capFull: 'That op does not fit: the run would go past {max} steps. Undo your ops or pick another example.',

      explain: '<p>The host sees only logical blocks (LBA 0–9). <em>NAND</em> flash has other rules: a <em>page</em> can ' +
        'be programmed only when it is erased, and only a whole <em>erase block</em> can be erased. So the drive never ' +
        'writes over old data. The <em>flash translation layer</em> (FTL) writes each LBA to the next free page of the ' +
        'active block, moves the map LBA → block.page, and the old page becomes invalid.</p>' +
        '<p>Invalid pages take room until their block is erased. When only one free block is left, <em>garbage ' +
        'collection</em> picks the block with the most invalid pages, copies its valid pages into that reserve block and ' +
        'erases it. The host never asked for those copies: <em>write amplification</em> = NAND writes / host writes. ' +
        'Every erase wears the block (<em>wear</em>): the counter beside each block. 6 of the 16 pages are ' +
        '<em>over-provisioning</em> the host never sees.</p>' +
        '<p>Deleting a file changes only the filesystem. The drive does not know and keeps copying the old data until ' +
        'the host sends <em>TRIM</em> to say those LBAs are no longer in use.</p>' +
        '<p><b>Common misconceptions.</b> "An SSD overwrites a block in place like a hard disk." No: it writes a new ' +
        'page. "Deleting a file frees the flash." Only TRIM does. "Write amplification is a property of the drive." It ' +
        'depends on the workload and the free space: the same drive gives 1.0, 1.75 or 3.25 here.</p>' +
        '<p>Simplified: no wear levelling of static data, no SLC cache, no parallel channels.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
