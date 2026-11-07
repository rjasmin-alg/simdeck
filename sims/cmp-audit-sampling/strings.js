/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of cmp-audit-sampling, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Populacija, uzorak i zaključak revizora',
      pct: '{n} %',

      // frequencies and what runs that often
      f_quarterly: 'tromjesečno',
      f_monthly: 'mjesečno',
      f_weekly: 'tjedno',
      f_daily: 'dnevno',
      f_multi: 'više puta dnevno',
      item_quarterly: ['{n} test obnove', '{n} testa obnove', '{n} testova obnove'],
      item_monthly: ['{n} pregled admin. prava', '{n} pregleda admin. prava', '{n} pregleda admin. prava'],
      item_weekly: ['{n} provjera kopija', '{n} provjere kopija', '{n} provjera kopija'],
      item_daily: ['{n} zahtjev za promjenu', '{n} zahtjeva za promjenu', '{n} zahtjeva za promjenu'],
      item_multi: ['{n} zahtjev za pristup', '{n} zahtjeva za pristup', '{n} zahtjeva za pristup'],

      // the grid
      gridHead: '{pop} u godini revizije',
      failedN: 'neispravnih: {k} ({r})',
      failedNone: 'neispravnih nema',
      cellLabel: 'stavka {i}',

      // the last sample
      lastHead: 'Zadnji uzorak',
      lastChecked: 'provjereno {n} od {N} · {x}',
      exc: ['{n} odstupanje', '{n} odstupanja', '{n} odstupanja'],
      noSample: 'Još nema uzorka: izvuci jedan (D).',
      c_pass: 'Nema odstupanja: „kontrola djeluje”',
      c_extend: 'Jedno odstupanje: proširiti uzorak ili prijaviti nalaz',
      c_extendAll: 'Jedno odstupanje u svima: nalaz',
      c_finding: 'Nalaz: kontrola nije djelovala',
      truthLine: 'Zapravo {failed}',
      o_missed: '✗ promašaj: nijedna greška nije u uzorku',
      o_right: '✓ ovaj put točno',
      o_caught: '✓ uhvaćeno: greška je u uzorku',

      // all samples
      allHead: 'Svi uzorci ({n})',
      foundLine: 'barem jedno odstupanje: {f} ({fp}) · očekivano {ep}',
      b0: 'bez odstupanja',
      b1: 'jedno',
      b2: 'dva ili više',
      barLabel: '{what}: {c} ({p}), očekivano {e}',
      noDraws: 'Izvuci mnogo uzoraka (M) i pogledaj koliko ih nađe grešku.',

      // the numbers
      numHead: 'Brojke',
      formulaLine: 'formula: 1 − (1 − {r}){n} ≈ {p}',
      exactLine: 'točno za ovih {N}: {p}',
      needLine: 'za 95 % sigurnosti treba uzorak od {m}',
      needNone: 'nema što naći: neispravnih nema',
      boundLine: '0 odstupanja u uzorku od {n} isključuje samo stope iznad {b} (velika populacija)',

      // the table
      tabHead: 'Uobičajeni uzorak prema učestalosti kontrole',
      colFreq: 'izvodi se',
      colPop: 'godišnje',
      colUsual: 'uzorak',
      band_below: '{n}: manje',
      band_in: '{n}: u rasponu',
      band_above: '{n}: više',
      rowLabel: 'Odaberi: {f}, {pop}',

      foot: 'Pojednostavljeno, nije pravni savjet. Izmišljena tvrtka, brojevi su ilustrativni.',

      // the panel
      freq: 'Koliko stavki godišnje (učestalost kontrole)',
      rate: 'Stvarna stopa neispravnih',
      n: 'Veličina uzorka',
      draws: 'Izvučeni uzorci',
      drawOne: 'Izvuci uzorak',
      drawMany: 'Izvuci još 100',
      newPop: 'Nova populacija',
      drawsFull: 'Najviše 1000 uzoraka.',

      // presets
      pOneSample: '25 od 250: ništa',
      pOneSampleHint: 'Jedan uzorak od 25 zahtjeva za promjenu, 2 % neispravnih: nema odstupanja.',
      pMany: '1000 uzoraka po 25',
      pManyHint: 'Koliko često 25 nađe 2 % neispravnih?',
      pClean: 'Ispravna kontrola',
      pCleanHint: 'Neispravnih nema: revizor vidi isto „nema odstupanja”.',
      pBadControl: 'Kontrola ne radi (10 %)',
      pBadControlHint: 'Jedan od deset zahtjeva je neispravan.',
      pSure: '95 % sigurno: 112',
      pSureHint: 'Uzorak koji 2 % nađe s 95 % vjerojatnosti.',
      pMonthly: 'Mjesečno, jedan loš mjesec',
      pMonthlyHint: '12 pregleda, jedan neispravan, uobičajeni uzorak od 2.',

      // legend
      legNot: 'nije u uzorku',
      legFailed: 'neispravno',
      legOk: 'u uzorku, ispravno',
      legExc: 'odstupanje: u uzorku i neispravno',
      legExp: 'očekivani udio',

      // captions
      capStart: '{pop} u godini revizije; neispravnih: {k} ({r}). Izvuci uzorak: D jedan, M stotinu.',
      capStartClean: '{pop} u godini revizije; neispravnih nema. Izvuci uzorak: D jedan, M stotinu.',
      capMiss: 'Revizor je provjerio {n} od {N} i nije našao odstupanje: „kontrola djeluje”. Zapravo neispravnih: {k} ({r}), a nijedna greška nije u uzorku.',
      capClean: 'Revizor je provjerio {n} od {N} i nije našao odstupanje, a neispravnih nema: ovaj put točno. Revizoru to izgleda isto kao uzorak koji je promašio.',
      capOne: 'Jedno odstupanje u {n}: još nije nalaz, ali se ne otpisuje kao slučajnost. Revizor proširuje uzorak ili prijavljuje nalaz. Zapravo neispravnih: {k} od {N}.',
      capOneAll: 'Jedno odstupanje u svih {N}: provjereno je sve, nema se što proširiti, pa je to nalaz.',
      capFinding: 'Odstupanja u {n}: {x}. To je nalaz, kontrola nije djelovala. Zapravo neispravnih: {k} od {N} ({r}).',
      capMany: 'Uzoraka po {n}: {d}. S barem jednim odstupanjem: {f} ({fp}); točna vjerojatnost je {ep}, a formula 1 − (1 − {r})ⁿ daje {fm}.',
      nOthers: 'Bez odstupanja, dakle „kontrola djeluje”: {m}, a neispravnih: {k}.',
      capManyClean: 'Uzoraka po {n}: {d}; odstupanje nije našao nijedan, jer neispravnih nema. Revizor vidi isto „nema odstupanja” kao kad uzorak promaši.',
      nAll: 'Uzorak je cijela populacija: nađe se svaka greška.',
      nBelow: 'To je manje od uobičajenog uzorka ({u}) za kontrolu koja se izvodi {f}.',

      explain: '<p><b>Revizijsko uzorkovanje</b> (<i>audit sampling</i>). Revizor ne može provjeriti svih 250 zahtjeva za ' +
        'promjenu iz godine pa provjerava <b>uzorak</b> (<i>sample</i>) izvođenja kontrole iz <b>populacije</b> ' +
        '(<i>population</i>) i traži <b>odstupanja</b> (<i>exceptions</i>): izvođenja u kojima kontrola nije djelovala ' +
        '(promjena puštena bez odobrenja). Uzorak se bira slučajno, bez ponavljanja.</p>' +
        '<p><b>Formula.</b> Ako je neispravan udio r, uzorak od n nađe barem jedno odstupanje s vjerojatnošću ' +
        '1 − (1 − r)<sup>n</sup>. Za 25 i 2 %: 1 − 0,98<sup>25</sup> ≈ 40 %, pa uzorak promaši u oko 60 % slučajeva. Za ' +
        'malu populaciju bez ponavljanja točna vjerojatnost je malo veća (41 % za 5 od 250), a provjera svih stavki nađe ' +
        'svaku grešku. Veličina populacije gotovo ne mijenja ishod: 25 od 1000 nađe 2 % jednako često kao 25 od 250.</p>' +
        '<p><b>„Nema odstupanja” nije „nema grešaka”.</b> Nula odstupanja u 25 isključuje, s 95 % pouzdanosti, samo stope ' +
        'iznad oko 11 %. Da bi s 95 % sigurnosti našao 2 %, revizoru treba uzorak od 149 za veliku populaciju (112 od ' +
        'ovih 250).</p>' +
        '<p><b>Učestalost kontrole</b> određuje uobičajeni uzorak: tromjesečna 2, mjesečna 2–5, tjedna 5–15, dnevna 20–40, ' +
        'više puta dnevno 25–60. To je uobičajena praksa u ispitivanju IT kontrola, a ne propis, i razlikuje se od tvrtke ' +
        'do tvrtke. Te veličine pretpostavljaju da revizor ne očekuje odstupanja: potvrđuju kontrolu koja radi, ne mjere ' +
        'stopu grešaka.</p>' +
        '<p><b>Jedno odstupanje</b> ne otpisuje se kao slučajnost: revizor traži uzrok pa proširuje uzorak ili prijavljuje ' +
        '<b>nalaz</b> (<i>finding</i>). Dva ili više znače da kontrola nije djelovala tijekom razdoblja.</p>' +
        '<p>Izvori: ISA 530 (revizijsko uzorkovanje), interni audit iz ISO/IEC 27001 (točka 9.2) i ISO 19011 (dodatak A.6). ' +
        'Uzorkuju se zapisi do kojih vodi trag iz simulatora „Politika, standard, procedura, zapis”. Pojednostavljeno, ' +
        'nije pravni savjet; tvrtka i brojevi su izmišljeni.</p>'
    },
    en: {
      stage: 'Population, sample and the auditor\'s conclusion',
      pct: '{n}%',

      f_quarterly: 'quarterly',
      f_monthly: 'monthly',
      f_weekly: 'weekly',
      f_daily: 'daily',
      f_multi: 'several times a day',
      item_quarterly: ['{n} restore test', '{n} restore tests'],
      item_monthly: ['{n} admin-rights review', '{n} admin-rights reviews'],
      item_weekly: ['{n} backup check', '{n} backup checks'],
      item_daily: ['{n} change ticket', '{n} change tickets'],
      item_multi: ['{n} access request', '{n} access requests'],

      gridHead: '{pop} in the audit year',
      failedN: '{k} failed ({r})',
      failedNone: 'none failed',
      cellLabel: 'item {i}',

      lastHead: 'The last sample',
      lastChecked: 'checked {n} of {N} · {x}',
      exc: ['{n} exception', '{n} exceptions'],
      noSample: 'No sample yet: draw one (D).',
      c_pass: 'No exceptions: “the control operates”',
      c_extend: 'One exception: extend the sample or report a finding',
      c_extendAll: 'One exception in all of them: a finding',
      c_finding: 'Finding: the control did not operate',
      truthLine: 'In truth: {failed}',
      o_missed: '✗ missed: no failure was in the sample',
      o_right: '✓ right, this time',
      o_caught: '✓ caught: a failure was in the sample',

      allHead: 'All samples ({n})',
      foundLine: 'at least one exception: {f} ({fp}) · expected {ep}',
      b0: 'no exception',
      b1: 'one',
      b2: 'two or more',
      barLabel: '{what}: {c} ({p}), expected {e}',
      noDraws: 'Draw many samples (M) and see how many find a failure.',

      numHead: 'The numbers',
      formulaLine: 'formula: 1 − (1 − {r}){n} ≈ {p}',
      exactLine: 'exactly, for these {N}: {p}',
      needLine: '95% sure to find one: a sample of {m}',
      needNone: 'nothing to find: none failed',
      boundLine: '0 exceptions in {n} rules out only rates above {b} (large population)',

      tabHead: 'Usual sample by how often the control runs',
      colFreq: 'runs',
      colPop: 'a year',
      colUsual: 'sample',
      band_below: '{n}: fewer',
      band_in: '{n}: within',
      band_above: '{n}: more',
      rowLabel: 'Choose: {f}, {pop}',

      foot: 'Simplified, not legal advice. A made-up firm; the numbers are illustrative.',

      freq: 'Items a year (how often the control runs)',
      rate: 'True failure rate',
      n: 'Sample size',
      draws: 'Samples drawn',
      drawOne: 'Draw a sample',
      drawMany: 'Draw 100 more',
      newPop: 'New population',
      drawsFull: 'At most 1000 samples.',

      pOneSample: '25 of 250: nothing found',
      pOneSampleHint: 'One sample of 25 change tickets, 2% failed: no exceptions.',
      pMany: '1000 samples of 25',
      pManyHint: 'How often does 25 find a 2% failure rate?',
      pClean: 'A clean control',
      pCleanHint: 'None failed: the auditor sees the same “no exceptions”.',
      pBadControl: 'A failing control (10%)',
      pBadControlHint: 'One ticket in ten failed.',
      pSure: '95% sure: 112',
      pSureHint: 'The sample that finds 2% with a 95% chance.',
      pMonthly: 'Monthly, one bad month',
      pMonthlyHint: '12 reviews, one failed, the usual sample of 2.',

      legNot: 'not sampled',
      legFailed: 'failed',
      legOk: 'sampled, fine',
      legExc: 'exception: sampled and failed',
      legExp: 'expected share',

      capStart: '{pop} in the audit year; {k} failed ({r}). Draw a sample: D for one, M for a hundred.',
      capStartClean: '{pop} in the audit year; none failed. Draw a sample: D for one, M for a hundred.',
      capMiss: 'The auditor checked {n} of {N} and found no exceptions: “the control operates”. In truth {k} failed ({r}), and no failure was in the sample.',
      capClean: 'The auditor checked {n} of {N} and found no exceptions, and none failed: right, this time. To the auditor it looks exactly like a sample that missed.',
      capOne: 'One exception in {n}: not a finding yet, but not to be written off as bad luck. The auditor extends the sample or reports a finding. In truth {k} of {N} failed.',
      capOneAll: 'One exception in all {N}: everything was tested, so there is nothing to extend; that is a finding.',
      capFinding: 'Exceptions in {n}: {x}. That is a finding: the control did not operate. In truth {k} of {N} failed ({r}).',
      capMany: 'Of {d} samples of {n}, {f} found at least one exception ({fp}); the exact chance is {ep}, and the formula 1 − (1 − {r})ⁿ gives {fm}.',
      nOthers: '{m} reported “no exceptions” although {k} failed.',
      capManyClean: 'Of {d} samples of {n}, none found an exception, because none failed. The auditor sees the same “no exceptions” as when a sample misses.',
      nAll: 'The sample is the whole population: every failure is found.',
      nBelow: 'That is below the usual sample ({u}) for a control that runs {f}.',

      explain: '<p><b>Audit sampling.</b> An auditor cannot check all 250 change tickets of a year, so they test a ' +
        '<b>sample</b> of the control\'s occurrences (the <b>population</b>) and look for <b>exceptions</b>: occurrences ' +
        'where the control did not work (a change deployed without approval). The sample is drawn at random, without ' +
        'repeats.</p>' +
        '<p><b>The formula.</b> If a share r of the occurrences failed, a sample of n finds at least one with a chance of ' +
        '1 − (1 − r)<sup>n</sup>. For 25 and 2%: 1 − 0.98<sup>25</sup> ≈ 40%, so the sample misses about 60% of the time. ' +
        'For a small population drawn without repeats the exact chance is a little higher (41% for 5 of 250), and ' +
        'testing every item finds every failure. The size of the population hardly matters: 25 of 1000 finds 2% about as ' +
        'often as 25 of 250.</p>' +
        '<p><b>“No exceptions found” is not “no failures”.</b> Zero exceptions in 25 rules out, with 95% confidence, ' +
        'only failure rates above about 11%. To be 95% sure of catching 2%, the auditor needs a sample of 149 from a ' +
        'large population (112 of these 250).</p>' +
        '<p><b>How often the control runs</b> sets the usual sample: quarterly 2, monthly 2–5, weekly 5–15, daily ' +
        '20–40, several times a day 25–60. That is common practice in testing IT controls, not a rule, and firms differ. ' +
        'These sizes assume the auditor expects no exceptions: they confirm a control that works, they do not measure a ' +
        'failure rate.</p>' +
        '<p><b>One exception</b> is not written off as bad luck: the auditor asks why, then extends the sample or ' +
        'reports a <b>finding</b>. Two or more mean the control did not operate over the period.</p>' +
        '<p>Sources: ISA 530 (audit sampling), the internal audit of ISO/IEC 27001 (clause 9.2) and ISO 19011 ' +
        '(annex A.6). The items sampled are the records the trail in “Policy, standard, procedure, record” leads to. ' +
        'Simplified, not legal advice; the firm and its numbers are made up.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
