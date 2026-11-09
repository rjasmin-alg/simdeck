/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the quick poll, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Anketa',
      projector: 'Projektor',
      phone: 'Telefon studenta',
      pollTitle: 'Anketa',
      view: 'Prikaz',
      viewBoth: 'oboje',
      viewProjector: 'projektor',
      viewPhone: 'telefon',
      kind: 'Vrsta pitanja',
      kindAbcd: 'A–D',
      kindYesno: 'da / ne',
      kindConfidence: 'sigurnost',
      kindHint: 'Promjena vrste počinje novu anketu.',
      correct: 'Točan odgovor',
      correctNone: 'bez',
      correctNoneReason: 'Samoprocjena nema točnog odgovora.',
      correctHint: 'Vidi se tek kad otkrijete rezultate.',
      simulate: 'Probni razred: +5 odgovora',
      simulateHint: 'Umjesto telefona: pet novih odgovora, uvijek istim redom.',
      presetBlank: 'A–D, pitanje na slajdu',
      presetYesNo: 'Da ili ne',
      presetConfidence: 'Koliko ste sigurni?',
      legendBar: 'broj odgovora (slovo na stupcu)',
      legendTop: 'najviše odgovora',
      legendCorrect: 'točan odgovor',
      legendHidden: 'skriveno do otkrivanja',
      close: 'Zatvori',
      reopen: 'Otvori ponovno',
      reveal: 'Otkrij',
      next: 'Novo pitanje',
      keyAdvance: 'Zatvori glasanje, zatim otkrij rezultate',
      keyOpen: 'Zatvori ili ponovno otvori glasanje',
      keyReveal: 'Otkrij rezultate',
      keyNext: 'Novo pitanje (nova anketa)',
      textTitle: 'Točan odgovor i tekst pitanja',
      textQuestion: 'Pitanje',
      textQuestionPh: 'prazno: pitanje je na slajdu',
      textOption: 'Odgovor {o}',
      textOptionPh: 'prazno: samo slovo',
      questionOnSlide: 'Pitanje je na slajdu.',
      joinTitle: 'Kod za pristup',
      joinDemo: 'Pokazni način: odgovori stižu s telefona desno i iz probnog razreda.',
      count: ['odgovor', 'odgovora', 'odgovora'],
      phaseOpen: 'Glasanje je otvoreno',
      phaseClosed: 'Glasanje je zatvoreno',
      phaseRevealed: 'Rezultati',
      hidden: 'skriveno',
      sumNote: 'Jednaki odgovori imaju jednak postotak, pa je zbroj {sum} %.',
      barLabel: '{o}: {n}, {pct} %',
      yes: 'Da',
      no: 'Ne',
      confA: 'Sigurno znam',
      confB: 'Mislim da znam',
      confC: 'Ne znam sigurno',
      confD: 'Pogađam',
      phoneAsk: 'Odaberi odgovor:',
      phoneRecorded: 'Odgovor zabilježen: {o}',
      phoneChanged: 'Odgovor promijenjen: {o}',
      phoneSame: 'Već zabilježeno: {o}',
      phoneYours: 'Tvoj odgovor: {o}. Možeš ga promijeniti dok je glasanje otvoreno.',
      phoneClosed: 'Glasanje je zatvoreno, odgovor nije zabilježen.',
      phoneClosedIdle: 'Glasanje je zatvoreno.',
      phoneClosedMine: 'Glasanje je zatvoreno. Tvoj odgovor: {o}.',
      phoneStale: 'Ovo je bilo prethodno pitanje. Pričekaj novo.',
      phoneInvalid: 'Taj odgovor ne postoji u ovoj anketi.',
      phoneNoId: 'Ovaj preglednik nema anonimnu oznaku glasača, pa ne može glasati.',
      phoneAnon: 'Anonimno: zapisuje se samo slovo, ne ime.',
      captionOpen: 'Odgovora: {n}. Rezultati su skriveni dok ih ne otkrijete.',
      captionClosed: 'Odgovora: {n}. Glasanje je zatvoreno; rezultati su još skriveni.',
      captionRevealed: 'Odgovora: {n}. Rezultati su otkriveni; „Novo pitanje” počinje novu anketu.',
      captionCorrect: 'Točno je {o}: {pct} %.',
      captionSimClosed: 'Glasanje je zatvoreno: probni razred više ne može odgovarati.',
      captionSimAdded: 'Probni razred: +{n}.',
      explain: '<p>Studenti odgovaraju na pitanje s telefona (A, B, C ili D), a projektor pokazuje samo koliko je ' +
        'odgovora stiglo. Raspodjela ostaje skrivena dok je ne otkrijete, da prvi odgovori ne usmjere ostale. Tek ' +
        'tada se vide stupci s brojem i postotkom odgovora, a točan odgovor, ako ste ga odabrali, ima ✓ i debeli ' +
        'okvir.</p>' +
        '<p>Svaki telefon glasa jednom; dok je glasanje otvoreno, student može promijeniti odgovor i vrijedi ' +
        'zadnji. Nakon zatvaranja odgovori se odbijaju, a telefon to i kaže. Glasač je samo slučajna oznaka ' +
        'preglednika, nikad ime.</p>' +
        '<p>Postoci su cijeli brojevi koji zajedno daju 100, ali jednak broj odgovora uvijek ima jednak postotak: ' +
        'tri jednake trećine pokazuju se kao 33 + 33 + 33 = 99 %, a ne 34 + 33 + 33.</p>' +
        '<p><strong>Što ova stranica još ne može:</strong> statična stranica bez mreže ne može primati odgovore s ' +
        'drugih uređaja. Zato su ovdje telefon i probni razred na istom zaslonu. Kako će odgovori stizati u ' +
        'predavaonici (zajedničko stanje na poslužitelju stranice, mali poslužitelj na računalu u predavaonici ili ' +
        'ručno upisani brojevi nakon dizanja ruku) još nije odlučeno; pravila ankete ista su u sva tri slučaja.</p>'
    },
    en: {
      stage: 'Poll',
      projector: 'Projector',
      phone: 'Student phone',
      pollTitle: 'Poll',
      view: 'View',
      viewBoth: 'both',
      viewProjector: 'projector',
      viewPhone: 'phone',
      kind: 'Question type',
      kindAbcd: 'A–D',
      kindYesno: 'yes / no',
      kindConfidence: 'confidence',
      kindHint: 'Changing the type starts a new poll.',
      correct: 'Correct answer',
      correctNone: 'none',
      correctNoneReason: 'A self-assessment has no correct answer.',
      correctHint: 'Shown only when you reveal the results.',
      simulate: 'Practice class: +5 answers',
      simulateHint: 'Instead of phones: five new answers, always in the same order.',
      presetBlank: 'A–D, question on the slide',
      presetYesNo: 'Yes or no',
      presetConfidence: 'How sure are you?',
      legendBar: 'answers (letter on the bar)',
      legendTop: 'most answers',
      legendCorrect: 'correct answer',
      legendHidden: 'hidden until revealed',
      close: 'Close',
      reopen: 'Reopen',
      reveal: 'Reveal',
      next: 'New question',
      keyAdvance: 'Close voting, then reveal the results',
      keyOpen: 'Close or reopen voting',
      keyReveal: 'Reveal the results',
      keyNext: 'New question (a new poll)',
      textTitle: 'Correct answer and question text',
      textQuestion: 'Question',
      textQuestionPh: 'empty: the question is on the slide',
      textOption: 'Answer {o}',
      textOptionPh: 'empty: the letter only',
      questionOnSlide: 'The question is on the slide.',
      joinTitle: 'Join code',
      joinDemo: 'Demo mode: answers come from the phone on the right and from the practice class.',
      count: ['answer', 'answers'],
      phaseOpen: 'Voting is open',
      phaseClosed: 'Voting is closed',
      phaseRevealed: 'Results',
      hidden: 'hidden',
      sumNote: 'Equal answers get equal percentages, so the total is {sum} %.',
      barLabel: '{o}: {n}, {pct} %',
      yes: 'Yes',
      no: 'No',
      confA: 'I\'m sure',
      confB: 'Fairly sure',
      confC: 'Not sure',
      confD: 'Guessing',
      phoneAsk: 'Choose an answer:',
      phoneRecorded: 'Answer recorded: {o}',
      phoneChanged: 'Answer changed: {o}',
      phoneSame: 'Already recorded: {o}',
      phoneYours: 'Your answer: {o}. You can change it while voting is open.',
      phoneClosed: 'Voting is closed; your answer was not recorded.',
      phoneClosedIdle: 'Voting is closed.',
      phoneClosedMine: 'Voting is closed. Your answer: {o}.',
      phoneStale: 'That was the previous question. Wait for the new one.',
      phoneInvalid: 'That answer is not in this poll.',
      phoneNoId: 'This browser has no anonymous voter id, so it cannot vote.',
      phoneAnon: 'Anonymous: only the letter is recorded, not a name.',
      captionOpen: 'Answers: {n}. Results stay hidden until you reveal them.',
      captionClosed: 'Answers: {n}. Voting is closed; the results are still hidden.',
      captionRevealed: 'Answers: {n}. The results are revealed; "New question" starts a new poll.',
      captionCorrect: '{o} is correct: {pct} %.',
      captionSimClosed: 'Voting is closed: the practice class cannot answer any more.',
      captionSimAdded: 'Practice class: +{n}.',
      explain: '<p>Students answer a question from their phones (A, B, C or D), and the projector shows only how many ' +
        'answers have arrived. The split stays hidden until you reveal it, so early answers do not steer later ones. ' +
        'Only then do the bars appear with the number and percentage of answers, and the correct answer, if you chose ' +
        'one, gets a ✓ and a thick outline.</p>' +
        '<p>Each phone votes once; while voting is open a student may change their answer and the last one counts. ' +
        'After closing, answers are refused and the phone says so. A voter is only a random id of the browser, never ' +
        'a name.</p>' +
        '<p>Percentages are whole numbers that add up to 100, but an equal number of answers always gets an equal ' +
        'percentage: three equal thirds show as 33 + 33 + 33 = 99 %, not 34 + 33 + 33.</p>' +
        '<p><strong>What this page cannot do yet:</strong> a static page without a network cannot receive answers ' +
        'from other devices. That is why the phone and the practice class are on the same screen here. How answers ' +
        'will arrive in the lecture room (shared state on the site\'s server, a small server on the lecture-room ' +
        'computer, or counts typed in after a show of hands) is not decided yet; the poll\'s rules are the same in ' +
        'all three.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
