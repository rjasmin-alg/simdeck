/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the exercise countdown, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Odbrojavanje',
      timerTitle: 'Mjerač vremena',
      start: 'Pokreni',
      pause: 'Pauza',
      resume: 'Nastavi',
      again: 'Na početak',
      plus: '+1 min',
      minus: '−1 min',
      keyToggle: 'Pokreni / pauza / nastavak',
      keyPlus: 'Dodaj 1 minutu',
      keyMinus: 'Oduzmi 1 minutu',
      minutes: 'Minute',
      seconds: 'Dodatne sekunde',
      warn: 'Upozorenje prije kraja',
      label: 'Naslov na zaslonu',
      optNone: 'bez',
      optExercise: 'Vježba',
      optPair: 'U paru',
      optLab: 'Lab',
      optBreak: 'Pauza',
      labelExercise: 'Vježba',
      labelPair: 'Razmisli u paru',
      labelLab: 'Laboratorijska vježba',
      labelBreak: 'Pauza',
      sound: 'Zvuk na kraju',
      presetThink: 'Razmisli u paru, 90 s',
      presetFive: 'Vježba, 5 min',
      presetTen: 'Vježba, 10 min',
      presetFifteen: 'Laboratorijska vježba, 15 min',
      presetBreak: 'Pauza, 10 min',
      endAt: 'do {time}',
      endedAt: 'kraj u {time}',
      badgeIdle: 'Spremno',
      badgeRunning: 'Teče',
      badgeWarning: 'još {n} min',
      badgePaused: 'Pauza',
      badgeDone: 'Vrijeme!',
      captionIdle: 'Spremno: {time}. Space pokreće odbrojavanje.',
      captionLeft: ['Još {n} minuta.', 'Još {n} minute.', 'Još {n} minuta.'],
      captionFinish: 'Završavate u {time}.',
      captionPaused: 'Pauza.',
      captionResume: 'Space nastavlja.',
      captionDone: 'Vrijeme je isteklo ({time}).',
      captionDoneHint: 'Space vraća na početak, +1 min daje još jednu minutu.',
      phaseRunning: 'teče',
      phaseWarning: 'zadnje vrijeme',
      phaseDone: 'vrijeme je isteklo',
      phasePaused: 'pauza',
      explain: '<p>Mjerač za vježbe na satu: odaberi trajanje i pokreni ga razmaknicom (Space). Znamenke su dovoljno ' +
        'velike da se čitaju sa zadnjeg reda, a ispod njih piše u koliko sati vježba završava.</p>' +
        '<p>Preostalo vrijeme računa se iz trenutka početka, a ne brojanjem otkucaja, pa je točno i kad je kartica ' +
        'bila u pozadini. Pauza zaustavlja odbrojavanje (<i lang="en">countdown</i>); +1 min i −1 min mijenjaju ' +
        'trajanje dok vrijeme teče.</p>' +
        '<p>Faze se razlikuju oblikom i riječima, ne samo bojom: dok teče, okvir je tanak i pun, a traka puna; u zadnjem ' +
        'vremenu okvir je debeo i isprekidan, traka prugasta, a natpis kaže „još 1 min“; na kraju je okvir dvostruk, ' +
        'cijelo polje obojeno i piše „Vrijeme!“. Na pauzi je okvir točkast i piše „Pauza“.</p>' +
        '<p>Zvuk na kraju je isključen dok ga ne uključiš. <kbd>C</kbd> skriva ploču, <kbd>F</kbd> daje cijeli zaslon.</p>'
    },
    en: {
      stage: 'Countdown',
      timerTitle: 'Timer',
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      again: 'Back to start',
      plus: '+1 min',
      minus: '−1 min',
      keyToggle: 'Start / pause / resume',
      keyPlus: 'Add 1 minute',
      keyMinus: 'Take away 1 minute',
      minutes: 'Minutes',
      seconds: 'Extra seconds',
      warn: 'Warning before the end',
      label: 'Title on screen',
      optNone: 'none',
      optExercise: 'Exercise',
      optPair: 'Pairs',
      optLab: 'Lab',
      optBreak: 'Break',
      labelExercise: 'Exercise',
      labelPair: 'Think, pair, share',
      labelLab: 'Lab exercise',
      labelBreak: 'Break',
      sound: 'Sound at the end',
      presetThink: 'Think, pair, share, 90 s',
      presetFive: 'Exercise, 5 min',
      presetTen: 'Exercise, 10 min',
      presetFifteen: 'Lab exercise, 15 min',
      presetBreak: 'Break, 10 min',
      endAt: 'until {time}',
      endedAt: 'ended at {time}',
      badgeIdle: 'Ready',
      badgeRunning: 'Running',
      badgeWarning: '{n} min left',
      badgePaused: 'Paused',
      badgeDone: 'Time!',
      captionIdle: 'Ready: {time}. Space starts the countdown.',
      captionLeft: ['{n} minute left.', '{n} minutes left.'],
      captionFinish: 'You finish at {time}.',
      captionPaused: 'Paused.',
      captionResume: 'Space resumes.',
      captionDone: 'Time is up ({time}).',
      captionDoneHint: 'Space goes back to the start, +1 min gives one more minute.',
      phaseRunning: 'running',
      phaseWarning: 'last stretch',
      phaseDone: 'time is up',
      phasePaused: 'paused',
      explain: '<p>A timer for exercises in class: choose a length and start it with Space. The digits are large ' +
        'enough to read from the back row, and under them is the clock time at which the exercise ends.</p>' +
        '<p>The time left is worked out from the moment it started, not by counting ticks, so it is right even ' +
        'after the tab was in the background. Pause stops the countdown; +1 min and −1 min change the length while ' +
        'it runs.</p>' +
        '<p>The phases differ in shape and words, not only colour: while running the frame is thin and solid and the ' +
        'bar solid; in the last stretch the frame is thick and dashed, the bar striped and the badge says “1 min left”; ' +
        'at the end the frame is double, the whole box filled and it says “Time!”. Paused, the frame is dotted and it ' +
        'says “Paused”.</p>' +
        '<p>The sound at the end stays off until you switch it on. <kbd>C</kbd> hides the panel, <kbd>F</kbd> goes ' +
        'full screen.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings; else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
