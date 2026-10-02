/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the Rowhammer page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept).
   English terms on the Croatian side are written out (NOTES.md, "Term pairs"): the glossary does not have them yet. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'DRAM banka',
      acts: 'Aktivacije agresora u 64 ms',
      thresh: 'Prag najslabije ćelije',
      pattern: 'Uzorak',
      patternSingle: 'Jednostrano',
      patternDouble: 'Dvostrano',
      mitigation: 'Zaštita',
      mitNone: 'Nema',
      mitRefresh: '2× osvježavanje',
      mitTrr: 'TRR',
      mitEcc: 'ECC',
      size: 'Retci × ćelije po retku',

      presetSingle: 'Jednostrano',
      presetSingleHint: 'Jedan agresorski redak, žrtve s obje strane',
      presetDouble: 'Dvostrano',
      presetDoubleHint: 'Dva agresora, žrtva između njih dobiva dvostruku smetnju',
      presetRefresh: '2× osvježavanje',
      presetRefreshHint: 'Prozor od 32 ms: pola smetnje do osvježavanja',
      presetTrr: 'TRR',
      presetTrrHint: 'Kontroler osvježi susjede često aktiviranog retka',
      presetTrrWeak: 'TRR, slab čip',
      presetTrrWeakHint: 'Isti TRR na čipu s nižim pragom',
      presetEcc: 'ECC',
      presetEccHint: 'Jedan preokret po riječi se ispravlja',
      presetEccHeavy: 'ECC, 90 000',
      presetEccHeavyHint: '90 000 aktivacija: više preokreta u istoj riječi',

      legendAggressor: 'agresorski redak',
      legendVictim: 'redak žrtva',
      legendOne: 'bit 1 (nabijen)',
      legendZero: 'bit 0',
      legendFlipped: 'preokrenut 1 → 0',

      phaseIdle: 'mirovanje',
      phaseActivate: 'aktivacija',
      phaseDisturb: 'smetnja',
      phaseFlip: 'preokret',

      statActs: 'aktivacija u 64 ms',
      statFlips: 'preokrenutih bitova',
      statRate: 'aktivacija po ms',
      statDist: 'najveća smetnja / prag',
      statWrong: 'pogrešnih riječi',

      rowAgg: 'A · redak {r}',
      rowVic: 'Ž · redak {r}',
      rowFar: 'redak {r}',
      distHead: 'smetnja do osvježavanja',
      threshMark: 'prag',
      wordKey: 'Riječ od 8 ćelija:',
      wordCorrected: 'ispravljena',
      wordDetected: 'otkrivena, neispravljiva',
      wordBeyond: '3 i više: moguće neotkrivena',
      wordWrong: 'pogrešni podaci',

      captionIdle: 'Nema aktivacija: svaki redak drži svoje podatke do sljedećeg osvježavanja.',
      captionSingle: 'Jednostrano: redak {a} aktivira se {acts} puta u jednom prozoru od 64 ms ({rate} po ms).',
      captionDouble: 'Dvostrano: retci {a} i {b} aktiviraju se po {acts} puta u jednom prozoru od 64 ms ({rate} po ms).',
      captionRefresh: 'Uz dvostruko osvježavanje susjed dobije samo {per} prije osvježavanja.',
      captionTrr: 'TRR osvježava susjede nakon svakih {limit} aktivacija retka.',
      captionTrrIdle: 'TRR još ne reagira: djeluje tek na {limit} aktivacija.',
      captionDist: 'Redak {v} dobiva smetnju {d}.',
      captionNone: 'Nijedna nabijena ćelija nije došla do svog praga: nema preokreta.',
      captionFlips: ['{n} nabijena ćelija izgubila je naboj i bit se preokrenuo 1 → 0.', '{n} nabijene ćelije izgubile su naboj i bitovi su se preokrenuli 1 → 0.', '{n} nabijenih ćelija izgubilo je naboj i bitovi su se preokrenuli 1 → 0.'],
      captionWrong: ['Program koji čita ove retke dobiva {n} pogrešnu riječ.', 'Program koji čita ove retke dobiva {n} pogrešne riječi.', 'Program koji čita ove retke dobiva {n} pogrešnih riječi.'],
      captionEcc: 'ECC: ispravljeno {c}, otkriveno {d}, a {x} s tri ili više preokreta može proći kao ispravno.',

      explain:
        '<h3>DRAM ćelija</h3>' +
        '<p>Svaki bit je naboj u kondenzatoru od dvadesetak fF, kojem se pristupa kroz jedan tranzistor. Ćelije su poredane u retke; ' +
        'čitanje retka je <em lang="en">activation</em> (aktivacija): <code>ACT</code> otvori redak u međuspremnik retka, <code>PRE</code> ga zatvori. ' +
        'Naboj s vremenom curi, pa kontroler svaki redak osvježi barem jednom u 64 ms (<em lang="en">refresh</em>, osvježavanje).</p>' +
        '<h3>Smetnja</h3>' +
        '<p>Na gustim čipovima (ispod tridesetak nm) ćelije susjednih redaka toliko su blizu da svaka aktivacija retka malo isprazni ' +
        'ćelije u retcima do njega: kapacitivna sprega među ćelijama i naboj koji kroz podlogu prelazi u susjede. Jedna aktivacija ne čini ništa. ' +
        'Desetci tisuća aktivacija istog retka prije sljedećeg osvježavanja mogu nabijenu ćeliju spustiti ispod praga osjetilnog pojačala, ' +
        'i ona se pročita kao 0: <em lang="en">bit flip</em> (preokret bita). Ovo je <em lang="en">Rowhammer</em>: ' +
        '<em lang="en">aggressor row</em> (agresorski redak) mijenja podatke u <em lang="en">victim row</em> (redak žrtva), ' +
        'a da u njega nitko nije pisao. Aktivirani redak sam se pritom osvježava, pa njemu smetnja ne škodi.</p>' +
        '<p>Ćelije nisu jednake: najslabija se preokrene na pragu koji zadaješ, jače tek na višestrukom. U modelu je prag svake ćelije ' +
        'između jednog i četiri puta pragom najslabije, a mijenjaju se samo nabijene ćelije (1 → 0).</p>' +
        '<h3>Jednostrano i dvostrano</h3>' +
        '<p>Jednostrano se aktivira jedan redak, a smetnju dobivaju oba susjeda. Dvostrano se aktiviraju dva retka s istim retkom između njih: ' +
        'žrtva dobiva smetnju s obje strane, dvostruko više uz isti broj aktivacija po retku, pa se preokreti javljaju mnogo ranije.</p>' +
        '<h3>Zašto je to sigurnosni problem</h3>' +
        '<p>Izolacija među programima i između programa i operacijskog sustava pretpostavlja da memorija drži ono što je u nju upisano. ' +
        'Kad pristupi vlastitoj memoriji mijenjaju bitove u susjednim retcima, mogu se promijeniti podaci kojima program nema pravo pisati.</p>' +
        '<h3>Zaštite</h3>' +
        '<p><b>Češće osvježavanje:</b> kraći prozor ostavlja manje aktivacija do osvježavanja, ali troši vrijeme i energiju. ' +
        '<b>TRR</b> (<em lang="en">target row refresh</em>, ciljano osvježavanje retka): kontroler ili čip broji aktivacije i osvježi susjede retka ' +
        'koji se često aktivira; brojača je malo, pa to nije potpuna zaštita, a čip s nižim pragom ostaje ranjiv. ' +
        '<b>ECC</b> (<em lang="en">error-correcting code</em>, kod za ispravljanje pogrešaka): SECDED ispravlja jedan preokret u riječi i otkriva dva; ' +
        'tri ili više mogu proći neopaženo. <b>PARA</b>: uz svaku aktivaciju susjedi se osvježe s malom vjerojatnošću. ' +
        'DDR5 dodaje <em lang="en">refresh management</em> (upravljanje osvježavanjem): kontroler na zahtjev čipa daje dodatna osvježavanja.</p>' +
        '<p>Brojke su ilustrativne: pravi pragovi ovise o čipu i godini proizvodnje.</p>'
    },
    en: {
      stage: 'DRAM bank',
      acts: 'Aggressor activations in 64 ms',
      thresh: 'Weakest cell\'s threshold',
      pattern: 'Pattern',
      patternSingle: 'Single-sided',
      patternDouble: 'Double-sided',
      mitigation: 'Mitigation',
      mitNone: 'None',
      mitRefresh: '2× refresh',
      mitTrr: 'TRR',
      mitEcc: 'ECC',
      size: 'Rows × cells per row',

      presetSingle: 'Single-sided',
      presetSingleHint: 'One aggressor row, victims on both sides',
      presetDouble: 'Double-sided',
      presetDoubleHint: 'Two aggressors; the victim between them takes twice the disturbance',
      presetRefresh: '2× refresh',
      presetRefreshHint: 'A 32 ms window: half the disturbance before a refresh',
      presetTrr: 'TRR',
      presetTrrHint: 'The controller refreshes the neighbours of a busy row',
      presetTrrWeak: 'TRR, weak chip',
      presetTrrWeakHint: 'The same TRR on a chip with a lower threshold',
      presetEcc: 'ECC',
      presetEccHint: 'One flip per word is corrected',
      presetEccHeavy: 'ECC, 90 000',
      presetEccHeavyHint: '90 000 activations: several flips in one word',

      legendAggressor: 'aggressor row',
      legendVictim: 'victim row',
      legendOne: 'bit 1 (charged)',
      legendZero: 'bit 0',
      legendFlipped: 'flipped 1 → 0',

      phaseIdle: 'idle',
      phaseActivate: 'activate',
      phaseDisturb: 'disturb',
      phaseFlip: 'flip',

      statActs: 'activations in 64 ms',
      statFlips: 'bit flips',
      statRate: 'activations per ms',
      statDist: 'largest disturbance / threshold',
      statWrong: 'wrong words',

      rowAgg: 'A · row {r}',
      rowVic: 'V · row {r}',
      rowFar: 'row {r}',
      distHead: 'disturbance before refresh',
      threshMark: 'threshold',
      wordKey: 'Word of 8 cells:',
      wordCorrected: 'corrected',
      wordDetected: 'detected, uncorrectable',
      wordBeyond: '3 or more: may go undetected',
      wordWrong: 'wrong data',

      captionIdle: 'No activations: every row holds its data until the next refresh.',
      captionSingle: 'Single-sided: row {a} is activated {acts} times in one 64 ms window ({rate} per ms).',
      captionDouble: 'Double-sided: rows {a} and {b} are each activated {acts} times in one 64 ms window ({rate} per ms).',
      captionRefresh: 'With twice the refresh rate a neighbour takes only {per} before it is refreshed.',
      captionTrr: 'TRR refreshes the neighbours after every {limit} activations of a row.',
      captionTrrIdle: 'TRR has not stepped in yet: it acts at {limit} activations.',
      captionDist: 'Row {v} takes a disturbance of {d}.',
      captionNone: 'No charged cell reached its threshold: no bit flipped.',
      captionFlips: ['{n} charged cell lost its charge and flipped 1 → 0.', '{n} charged cells lost their charge and flipped 1 → 0.'],
      captionWrong: ['A program reading these rows gets {n} wrong word.', 'A program reading these rows gets {n} wrong words.'],
      captionEcc: 'ECC: {c} corrected, {d} detected, and {x} with three or more flips may pass as good.',

      explain:
        '<h3>The DRAM cell</h3>' +
        '<p>Each bit is charge in a capacitor of about twenty fF, reached through one transistor. Cells sit in rows; reading a row is an ' +
        '<em>activation</em>: <code>ACT</code> opens the row into the row buffer, <code>PRE</code> closes it. Charge leaks over time, so the ' +
        'controller refreshes every row at least once in 64 ms.</p>' +
        '<h3>Disturbance</h3>' +
        '<p>On dense chips (below about thirty nm) the cells of neighbouring rows are so close that every activation of a row drains the cells ' +
        'in the rows next to it a little: capacitive coupling between cells and charge that crosses into the neighbours through the substrate. ' +
        'One activation does nothing. Tens of thousands of activations of the same row before the next refresh can pull a charged cell below ' +
        'the sense amplifier\'s threshold, and it reads as 0: a <em>bit flip</em>. This is <em>Rowhammer</em>: the <em>aggressor row</em> changes ' +
        'data in a <em>victim row</em> that nobody wrote to. The activated row refreshes itself, so the disturbance does it no harm.</p>' +
        '<p>Cells are not equal: the weakest flips at the threshold you set, stronger ones only at a multiple of it. In the model each cell\'s ' +
        'threshold is between one and four times the weakest one\'s, and only charged cells change (1 → 0).</p>' +
        '<h3>Single-sided and double-sided</h3>' +
        '<p>Single-sided activates one row, and both neighbours take the disturbance. Double-sided activates the two rows on either side of ' +
        'one row: the victim takes disturbance from both sides, twice as much for the same activations per row, so flips come much sooner.</p>' +
        '<h3>Why it is a security problem</h3>' +
        '<p>Isolation between programs, and between programs and the operating system, assumes that memory keeps what was written to it. ' +
        'When accesses to a program\'s own memory change bits in neighbouring rows, data the program has no right to write can change.</p>' +
        '<h3>Mitigations</h3>' +
        '<p><b>More frequent refresh:</b> a shorter window leaves fewer activations before a refresh, at a cost in time and energy. ' +
        '<b>TRR</b> (<em>target row refresh</em>): the controller or the chip counts activations and refreshes the neighbours of a row that is ' +
        'activated often; it has few counters, so it is not a complete fix, and a chip with a lower threshold stays vulnerable. ' +
        '<b>ECC</b> (<em>error-correcting code</em>): SECDED corrects one flip in a word and detects two; three or more can pass unnoticed. ' +
        '<b>PARA</b>: with every activation the neighbours are refreshed with a small probability. DDR5 adds <em>refresh management</em>: ' +
        'the controller gives extra refreshes when the chip asks for them.</p>' +
        '<p>The numbers are illustrative: real thresholds depend on the chip and its year of manufacture.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
