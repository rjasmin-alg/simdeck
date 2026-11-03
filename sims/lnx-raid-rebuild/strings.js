/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-raid-rebuild, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term. *word* is an English term the page sets in italics
   (<em lang="en">): the Croatian term rule for terms the glossary lacks (NOTES.md, Term pairs). Disk names, numbers,
   /proc/mdstat and the [n/m] [map] box are data and come in as placeholders. The title and subtitle come from sim.json
   (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Stanje polja iz /proc/mdstat, mreža diskova i pojaseva s rezervnim diskom, a desno sat, razdoblje ranjivosti i vjerojatnost greške čitanja',

      // grid
      gridTitle: 'Polje md0',
      gridMeta: 'stupci: diskovi i rezervni · retci: po 10\u00a0% diska',
      rowStatus: 'stanje',
      band: '{a}–{b}\u00a0%',
      stOptimal: 'optimalno',
      stRebuilding: 'obnavlja se',
      stDegraded: 'degradirano',
      stFailed: 'u kvaru',
      asFixed: '⚡ {d}: ispravljeno',
      asLost: '⚡ {d}: pruga izgubljena',
      asAbort: '⚡ {d}: obnova stala',
      asFail: '✕ {d} otkazao',
      failedTitle: 'Polje je izgubljeno',

      // side card
      clockTitle: 'Sat',
      clockBefore: 'prije kvara',
      clockSince: 'od kvara diska {d}',
      hours: '{h}\u00a0h',
      windowTitle: 'Razdoblje ranjivosti',
      windowText: '{h} od {t}',
      parityLeft: 'preostali paritet: {k} od {of}',
      atSpeed: 'obnova pri {speed}, {load}',
      loadIdle: 'bez opterećenja',
      loadBusy: 'pod opterećenjem',
      disk14: 'stolni disk',
      disk15: 'poslužiteljski disk',
      budgetTitle: 'Greške čitanja',
      readText: 'pročitano {a} od {b} bita',
      pAll: 'P(barem jedna URE) u cijeloj obnovi:',
      pNow: 'u dosad pročitanom:',
      ureCount: ['URE dosad: {n}', 'URE dosad: {n}', 'URE dosad: {n}'],
      specNote: 'Stopa iz specifikacije diska ({kind}: 1 na {r} bita) gornja je granica koju proizvođač navodi, ne izmjerena stopa.',
      pct: '{p}\u00a0%',
      dec: ',',
      times: '×',

      // params, presets
      level: 'Razina RAID-a',
      raid5: 'RAID 5',
      raid6: 'RAID 6',
      n: 'Broj diskova',
      sizeTB: 'Veličina diska',
      tb: '{n} TB',
      speed: 'Brzina obnove',
      speedIdle: '200 MB/s',
      speedLoad: '50 MB/s',
      ureRate: 'URE: 1 na … bita',
      rate14: '10¹⁴',
      rate15: '10¹⁵',
      onUre: 'URE bez zalihosti',
      onAbort: 'prekini',
      onBadblock: 'loš blok',
      later: 'Kasniji kvarovi nakon',
      laterNone: 'nema',
      laterH15: '15 h',
      laterH1832: '18 h i 32 h',
      seed: 'Sjeme (URE)',
      presetUre: 'RAID 5 i URE',
      presetUreHint: '4 × 4 TB, stolni diskovi: vjerojatnost URE-a tijekom obnove je 62 %.',
      presetEnt: 'Poslužiteljski diskovi',
      presetEntHint: 'Isto polje sa stopom 1 na 10¹⁵: 9 %, obnova uspije za 5,6 h.',
      presetR6: 'RAID 6 i URE',
      presetR6Hint: 'Isti diskovi, ista URE: drugi paritet je ispravi.',
      presetLoad: 'Obnova pod opterećenjem',
      presetLoadHint: '50 MB/s: 22 h umjesto 5,6 h, a nakon 15 h otkaže drugi disk.',
      presetPfx: 'pfx-fs1: 16 × 6 TB',
      presetPfxHint: 'RAID 6 od 16 diskova: tijekom obnove otkažu drugi pa treći disk.',

      // legend
      legChanged: 'promijenjeno u ovom koraku',
      legHealthy: 'ispravan pojas',
      legFailed: 'disk u kvaru (F)',
      legNow: 'upisano na rezervni disk sada',
      legRebuilt: 'obnovljeno na rezervnom disku',
      legSpare: 'još nije upisano',
      legRead: 'pojas koji se čita',
      legUre: 'nečitljiv sektor (URE)',
      legLost: 'izgubljena pruga',

      // captions
      lvl5: 'RAID 5',
      lvl6: 'RAID 6',
      disksN: ['{n} disk', '{n} diska', '{n} diskova'],
      readFrom: ['s {n} diska', 's {n} diska', 's {n} diskova'],
      why5: 'RAID 5 u degradiranom stanju',
      why6: 'RAID 6 bez preostalog pariteta',
      capStart: '{lvl}: {disks} od po {size} i rezervni disk {spare}, koji čeka. {box}: polje je zdravo.',
      capFail: 'Disk {d} je otkazao, {box}. md odmah počinje [[rebuild]] na {spare}: treba pročitati sve preostale diskove, {bits} bita, a to traje {h} pri {speed}.',
      capFail5: 'Sve to vrijeme RAID 5 nema zalihosti.',
      capFail6: 'RAID 6 za to vrijeme ima još jedan paritet.',
      capOdds: 'Kad disk otkaže, obnova pročita {bits} bita; izgledi za barem jednu *unrecoverable read error* (URE, nepopravljiva greška čitanja) iznose {p}.',
      capBand: 'Pojas {band} je obnovljen: pročitan {from} i upisan na {spare}. Sat: {h}.',
      capFixed: ['Na {d} se jedan sektor ne da pročitati. {lvl} ima još jedan paritet: obnova ga izračuna iz ostalih diskova i ide dalje.', 'Na {d} se {n} sektora ne daju pročitati. {lvl} ima još jedan paritet: obnova ih izračuna iz ostalih diskova i ide dalje.', 'Na {d} se {n} sektora ne da pročitati. {lvl} ima još jedan paritet: obnova ih izračuna iz ostalih diskova i ide dalje.'],
      capAbort: 'Obnova je na {pct}, a na {d}, jednom od preostalih diskova, sektor se ne da pročitati. {why} nema čime ga nadomjestiti: obnova staje i polje je izgubljeno.',
      capLost: ['Na {d} se jedan sektor ne da pročitati. {why} nema čime ga nadomjestiti: na novom disku zapisan je loš blok i obnova ide dalje, a gubi se samo ta *stripe* (pruga).', 'Na {d} se {n} sektora ne daju pročitati. {why} nema čime ih nadomjestiti: postaju loši blokovi, gube se {n} pruge, a obnova ide dalje.', 'Na {d} se {n} sektora ne da pročitati. {why} nema čime ih nadomjestiti: postaju loši blokovi, gubi se {n} pruga, a obnova ide dalje.'],
      capFail2r5: 'Nakon {h} otkazuje i {d}. RAID 5 podnosi kvar jednog diska, a drugi tijekom obnove znači da podataka više nema dovoljno: polje je izgubljeno.',
      capFail2r6: 'Nakon {h} otkazuje i {d}. RAID 6 to podnosi, ali više nema nijednog pariteta: sljedeća URE gubi prugu, a sljedeći kvar cijelo polje.',
      capFail2r6abort: 'Nakon {h} otkazuje i {d}. RAID 6 to podnosi, ali više nema nijednog pariteta: sljedeća URE ili sljedeći kvar ruše cijelo polje.',
      capFail3: 'Nakon {h} otkazuje i treći disk, {d}: jedan kvar više nego što RAID 6 podnosi. Polje je izgubljeno, svezak nedostupan.',
      capFailIdle: 'Bez opterećenja obnova bi trajala {t} i bila bi gotova prije tog kvara.',
      capDone: 'Obnova je gotova nakon {h}: {spare} je punopravni član polja, {box}.',
      capDoneLost: ['Polje radi, ali {n} pruga je izgubljena: čitanje njezinih podataka javlja grešku.', 'Polje radi, ali {n} pruge su izgubljene: čitanje njihovih podataka javlja grešku.', 'Polje radi, ali {n} pruga je izgubljeno: čitanje njihovih podataka javlja grešku.'],
      capDoneDegraded: 'Polje radi s jednim paritetom manje dok se ne zamijeni i {d}.',
      capAfter: 'Sljedeći kvar, nakon {h}, dolazi kad je obnova već gotova: polje ga preživi.',
      capAfter2: 'Sljedeći kvar, nakon {h}, dolazi kad je obnova već gotova: polje ga preživi, ali onaj nakon {h2} srušio bi ga.',

      explain:
        '<p>[[rebuild]] na rezervni disk mora pročitati <strong>cijeli</strong> svaki preostali disk: kod n diskova to je ' +
        '(n − 1) × veličina diska, a traje veličina diska / brzina obnove. Jezgra obnovu drži između ' +
        '<code translate="no">speed_limit_min</code> (1000 KiB/s) i <code translate="no">speed_limit_max</code> ' +
        '(200 000 KiB/s); kad aplikacije rade, obnova se usporava prema minimumu. Za 4 TB to je 5,6 h bez opterećenja ' +
        'i 22 h pri 50 MB/s, a sve to vrijeme RAID 5 nema zalihosti.</p>' +
        '<p>Specifikacija diska navodi stopu nepopravljivih grešaka čitanja (URE): 1 na 10¹⁴ bita za stolne diskove, ' +
        '1 na 10¹⁵ za poslužiteljske. Vjerojatnost barem jedne u B pročitanih bita je 1 − e^(−B/stopa): za ' +
        'RAID 5 od 4 × 4 TB to je 62 %. Stopa je gornja granica, ne izmjerena vrijednost: stvarni diskovi su često bolji, ' +
        'ali obećanje je samo to.</p>' +
        '<p>RAID 5 preživi kvar diska, ali ne uvijek i obnovu: URE na preostalom disku nema čime nadomjestiti. Mnogi ' +
        'kontroleri tada prekinu obnovu i polje je izgubljeno; md s popisom loših blokova zapiše loš blok i nastavi, pa se ' +
        'gubi samo jedna pruga. RAID 6 ima drugi [[parity]] i takvu grešku ispravi; tek drugi kvar ga ostavlja bez ' +
        'zalihosti. Razine RAID-a i paritet pokazuje simulator <a href="../raid-cache/index.html">„RAID i priručna memorija diska“</a>.</p>'
    },
    en: {
      stage: 'The array state from /proc/mdstat, a grid of disks and bands with the spare disk; on the right the clock, the window of vulnerability and the odds of a read error',

      gridTitle: 'Array md0',
      gridMeta: 'columns: disks and the spare · rows: 10% of the disk each',
      rowStatus: 'state',
      band: '{a}–{b}%',
      stOptimal: 'optimal',
      stRebuilding: 'rebuilding',
      stDegraded: 'degraded',
      stFailed: 'failed',
      asFixed: '⚡ {d}: corrected',
      asLost: '⚡ {d}: stripe lost',
      asAbort: '⚡ {d}: rebuild stopped',
      asFail: '✕ {d} failed',
      failedTitle: 'The array is lost',

      clockTitle: 'Clock',
      clockBefore: 'before the failure',
      clockSince: 'since disk {d} failed',
      hours: '{h}\u00a0h',
      windowTitle: 'Window of vulnerability',
      windowText: '{h} of {t}',
      parityLeft: 'parity left: {k} of {of}',
      atSpeed: 'rebuild at {speed}, {load}',
      loadIdle: 'idle',
      loadBusy: 'under load',
      disk14: 'desktop disk',
      disk15: 'enterprise disk',
      budgetTitle: 'Read errors',
      readText: 'read {a} of {b} bits',
      pAll: 'P(at least one URE) over the whole rebuild:',
      pNow: 'in what has been read so far:',
      ureCount: ['UREs so far: {n}', 'UREs so far: {n}'],
      specNote: 'The rate from the disk\'s datasheet ({kind}: 1 per {r} bits) is an upper bound the maker states, not a measured rate.',
      pct: '{p}%',
      dec: '.',
      times: '×',

      level: 'RAID level',
      raid5: 'RAID 5',
      raid6: 'RAID 6',
      n: 'Number of disks',
      sizeTB: 'Disk size',
      tb: '{n} TB',
      speed: 'Rebuild speed',
      speedIdle: '200 MB/s',
      speedLoad: '50 MB/s',
      ureRate: 'URE: 1 per … bits',
      rate14: '10¹⁴',
      rate15: '10¹⁵',
      onUre: 'URE, no redundancy',
      onAbort: 'stop',
      onBadblock: 'bad block',
      later: 'Later failures after',
      laterNone: 'none',
      laterH15: '15 h',
      laterH1832: '18 h and 32 h',
      seed: 'Seed (URE)',
      presetUre: 'RAID 5 meets a URE',
      presetUreHint: '4 × 4 TB desktop disks: a 62% chance of a URE during the rebuild.',
      presetEnt: 'Enterprise disks',
      presetEntHint: 'The same array at 1 per 10¹⁵: 9%, and the rebuild completes in 5.6 h.',
      presetR6: 'RAID 6 meets a URE',
      presetR6Hint: 'The same disks, the same URE: the second parity corrects it.',
      presetLoad: 'Rebuild under load',
      presetLoadHint: '50 MB/s: 22 h instead of 5.6 h, and after 15 h a second disk fails.',
      presetPfx: 'pfx-fs1: 16 × 6 TB',
      presetPfxHint: 'A 16-disk RAID 6: a second and then a third disk fail during the rebuild.',

      legChanged: 'changed in this step',
      legHealthy: 'healthy band',
      legFailed: 'failed disk (F)',
      legNow: 'written to the spare now',
      legRebuilt: 'rebuilt on the spare',
      legSpare: 'not written yet',
      legRead: 'band being read',
      legUre: 'unreadable sector (URE)',
      legLost: 'lost stripe',

      lvl5: 'RAID 5',
      lvl6: 'RAID 6',
      disksN: ['{n} disk', '{n} disks'],
      readFrom: ['from {n} disk', 'from {n} disks'],
      why5: 'Degraded RAID 5',
      why6: 'RAID 6 with no parity left',
      capStart: '{lvl}: {disks} of {size} each, and a spare disk, {spare}, waiting. {box}: the array is healthy.',
      capFail: 'Disk {d} has failed, {box}. md at once starts the [[rebuild]] onto {spare}: it must read every surviving disk, {bits} bits, which takes {h} at {speed}.',
      capFail5: 'All that time RAID 5 has no redundancy.',
      capFail6: 'RAID 6 still has one parity left during that time.',
      capOdds: 'When a disk fails, the rebuild reads {bits} bits; the odds of at least one unrecoverable read error (URE) on the way: {p}.',
      capBand: 'Band {band} is rebuilt: read {from} and written to {spare}. Clock: {h}.',
      capFixed: ['A sector on {d} cannot be read. {lvl} still has one parity: the rebuild computes it from the other disks and goes on.', '{n} sectors on {d} cannot be read. {lvl} still has one parity: the rebuild computes them from the other disks and goes on.'],
      capAbort: 'The rebuild is at {pct} and a sector on {d}, one of the surviving disks, cannot be read. {why} has nothing left to rebuild it from: the rebuild stops and the array is lost.',
      capLost: ['A sector on {d} cannot be read. {why} has nothing to rebuild it from: a bad block is written on the new disk and the rebuild goes on; only that stripe is lost.', '{n} sectors on {d} cannot be read. {why} has nothing to rebuild them from: they become bad blocks, {n} stripes are lost, and the rebuild goes on.'],
      capFail2r5: 'After {h}, {d} fails too. RAID 5 survives one failed disk; a second during the rebuild leaves too little data: the array is lost.',
      capFail2r6: 'After {h}, {d} fails too. RAID 6 survives that, but no parity is left: the next URE loses a stripe, the next failure the whole array.',
      capFail2r6abort: 'After {h}, {d} fails too. RAID 6 survives that, but no parity is left: the next URE or the next failure ends the whole array.',
      capFail3: 'After {h}, a third disk fails: {d}, one failure more than RAID 6 survives. The array is lost, the volume offline.',
      capFailIdle: 'Idle, the rebuild would have taken {t} and been done before this failure.',
      capDone: 'The rebuild is done after {h}: {spare} is a full member of the array, {box}.',
      capDoneLost: ['The array works, but {n} stripe is lost: reading its data returns an error.', 'The array works, but {n} stripes are lost: reading their data returns an error.'],
      capDoneDegraded: 'The array runs one parity short until {d} is replaced too.',
      capAfter: 'The next failure, after {h}, comes once the rebuild is done: the array survives it.',
      capAfter2: 'The next failure, after {h}, comes once the rebuild is done: the array survives it, but the one after {h2} would end it.',

      explain:
        '<p>A [[rebuild]] onto the spare disk must read <strong>all</strong> of every surviving disk: with n disks that ' +
        'is (n − 1) × the disk size, and it takes disk size / rebuild speed. The kernel keeps the rebuild between ' +
        '<code translate="no">speed_limit_min</code> (1000 KiB/s) and <code translate="no">speed_limit_max</code> ' +
        '(200,000 KiB/s); while applications run, the rebuild is throttled toward the minimum. For 4 TB that is 5.6 h ' +
        'idle and 22 h at 50 MB/s, and all that time RAID 5 has no redundancy.</p>' +
        '<p>A disk\'s datasheet states its rate of unrecoverable read errors (UREs): 1 per 10¹⁴ bits for desktop ' +
        'disks, 1 per 10¹⁵ for enterprise ones. The chance of at least one in B bits read is 1 − e^(−B/rate): ' +
        'for a 4 × 4 TB RAID 5 that is 62%. The rate is an upper bound, not a measurement: real disks often do better, ' +
        'but that is all the promise says.</p>' +
        '<p>RAID 5 survives a failed disk, but not always the rebuild: a URE on a surviving disk has nothing to be ' +
        'rebuilt from. Many controllers then stop the rebuild and the array is lost; md with a bad block list records ' +
        'a bad block and goes on, so only one stripe is lost. RAID 6 has a second [[parity]] and corrects such an ' +
        'error; only a second failure leaves it with no redundancy. RAID levels and parity are in the ' +
        '<a href="../raid-cache/index.html">RAID and disk cache</a> simulator.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
