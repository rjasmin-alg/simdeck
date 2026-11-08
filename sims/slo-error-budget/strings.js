/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of slo-error-budget, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* marks an English term in italics on the Croatian page (the page
   turns it into <em lang="en">); these terms are missing from kit/glossary.js and are written out this way (NOTES.md,
   "Term pairs"). Numbers are formatted by the page with the decimal separator below. The title and subtitle come
   from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Proračun greške, pogreške kroz 30 dana, uvećani detalj oko kursora, brzine trošenja i uzbune',
      month: 'Stopa pogrešaka po satu kroz 30 dana, incidenti, kursor i kada je koja uzbuna bila uključena',
      zoom: 'Uvećani detalj oko kursora: stopa pogrešaka po minuti i uzbune',
      dec: ',',
      pct: '{v} %',
      noValue: '—',

      slo: 'Ciljana razina (SLO)',
      at: 'Trenutak (kursor)',
      sel: 'Incident',
      selOf: '{i} od {n}',
      iStart: 'Početak',
      iDur: 'Trajanje',
      iRate: 'Stopa pogrešaka',
      add: 'Dodaj incident',
      remove: 'Ukloni incident',
      addFull: 'najviše 6 incidenata',
      removeNone: 'nema incidenta',
      showWindows: 'Prikaži prozore',

      presetOutage: 'Ispad 20 min',
      presetOutageHint: '20 min pri 100 %: 46 % proračuna, hitna uzbuna',
      presetFast: 'Brzo trošenje',
      presetFastHint: '1,44 % kroz sat: brzina točno 14,4',
      presetSlow: 'Sporo trošenje',
      presetSlowHint: '0,2 % stalno: proračun nestaje 15. dana',
      presetBlip: 'Kratki ispad',
      presetBlipHint: '2 min pri 100 %: uzbuna se gasi 5 min nakon kraja',
      presetRadar: 'Ispod radara',
      presetRadarHint: '0,05 % cijeli mjesec: pola proračuna, bez uzbune',

      legBar: 'pogreške',
      legInc: 'incident',
      legBudget: 'preostali proračun',
      legGauge: 'brzina trošenja i prag',
      legLamp: 'uzbuna uključena',
      legChanged: 'promijenjena',

      dMin: '{v} min',
      dH: '{v} h',
      dDays: ['{v} dan', '{v} dana', '{v} dana'],
      when: 'dan {d}, {hm}',
      onDay: '{d}. dana u {hm}',
      since: 'uključen {d}. dana u {hm}',

      budgetTitle: 'Proračun greške',
      budgetLeft: '{left} od {budget} min preostalo',
      budgetUsed: 'potrošeno {pct}',
      budgetGone: 'potrošen {day}',
      budgetMonth: 'do 30. dana: {pct}',
      dayAxis: 'dan',
      allowed: 'SLO dopušta {v}',
      gone: 'proračun potrošen',
      zoomTitle: 'Detalj: {from} – {to}',
      rowFast: 'hitna, brzo',
      rowSlow: 'hitna, sporo',
      rowTicket: 'zahtjev',
      incLabel: '{i}: {dur}, {rate}',

      w5m: '5 min',
      w30m: '30 min',
      w1h: '1 h',
      w6h: '6 h',
      w3d: '3 dana',

      now: 'Sada: {when}',
      gFast: 'Hitna uzbuna: brzo trošenje',
      gSlow: 'Hitna uzbuna: sporo trošenje',
      gTicket: 'Zahtjev',
      thr: 'prag {v}',
      lampPage: 'HITNO',
      lampTicket: 'ZAHTJEV',
      lampOff: 'ugašena',
      changed: 'promijenjena',
      burnWord: 'brzina',

      aFast: 'hitna uzbuna (brzo trošenje)',
      aSlow: 'hitna uzbuna (sporo trošenje)',
      aTicket: 'zahtjev',

      cEmpty: 'Ciljana razina usluge (*SLO*) {slo} kroz 30 dana daje proračun greške (*error budget*) od {budget} min potpunog ispada. Dodaj incident ili odaberi primjer.',
      cPage: '{when}: brzina trošenja {long} kroz {lw} i {short} kroz {sw}, obje ≥ {thr}: {alert}. Dosad je potrošeno {used} od {budget} min ({pct}).',
      cCleared: '{when}: kroz {lw} brzina je i dalje {long}, ali kroz {sw} pala je na {short}, ispod {thr}: {alert} je prestala. Kratki prozor gasi uzbunu ubrzo nakon što problem prestane.',
      cSlowBurn: '{rate} pogrešaka nikoga ne budi, a ipak uz brzinu trošenja {burn} proračun nestaje {day}: uhvati ga tek zahtjev, {tday}.',
      cTicket: '{when}: brzina {long} kroz 3 dana i {short} kroz 6 h, obje ≥ 1: zahtjev, nikoga se ne budi. Dosad je potrošeno {used} od {budget} min ({pct}).',
      cExhausted: 'Proračun od {budget} min nestaje {day}: incidenti troše {usedAll} min ({pctAll}). Prva uzbuna: {alert}, {first}.',
      cExhaustedNone: 'Proračun od {budget} min nestaje {day}: incidenti troše {usedAll} min ({pctAll}), a nijedna uzbuna nije stigla.',
      cQuiet: 'Brzina trošenja kroz sat najviše je {peak}: nijedna uzbuna cijeli mjesec, a potrošeno je {usedAll} od {budget} min ({pctAll}). Tako i treba: za to proračun postoji.',
      cAfter: '{when}: nijedna uzbuna nije uključena. Prva je bila {alert}, {first}; incidenti troše {usedAll} od {budget} min ({pctAll}).',

      explain: '<p><i lang="en">Service level objective</i> (ciljana razina usluge, SLO) kaže koliki udio vremena ili ' +
        'zahtjeva mora biti ispravan, npr. 99,9 % kroz 30 dana. Ostatak je <b><i lang="en">error budget</i></b> ' +
        '(proračun greške): (1 − SLO) × prozor = 0,1 % od 43 200 min = <b>43,2 min</b> potpunog ispada (ili isti ' +
        'udio neuspjelih zahtjeva). Incident troši stopa pogrešaka × trajanje.</p>' +
        '<p><b><i lang="en">Burn rate</i></b> (brzina trošenja) = stopa pogrešaka u prozoru / (1 − SLO). Brzina 1 ' +
        'troši točno cijeli proračun kroz cijeli prozor; 14,4 troši 2 % mjesečnog proračuna u jednom satu.</p>' +
        '<p>Uzbuna s više prozora: <b>hitna uzbuna</b> (<i lang="en">page</i>) kad je brzina ≥ 14,4 kroz 1 h ' +
        '<b>i</b> kroz 5 min, ili ≥ 6 kroz 6 h i kroz 30 min; <b>zahtjev</b> (<i lang="en">ticket</i>) kad je ≥ 1 ' +
        'kroz 3 dana i kroz 6 h. Dugi prozor traži da je potrošeno dovoljno proračuna da vrijedi nekoga probuditi; ' +
        'kratki prozor gasi uzbunu ubrzo nakon što problem prestane. Brzina točno na pragu uključuje uzbunu.</p>' +
        '<p>Zablude: „99,9 % dopušta nekoliko sekundi dnevno, nema se što planirati” (to je 43 min mjesečno, a 20 ' +
        'minuta ispada odnese gotovo polovicu); „uzbuna na svaku pogrešku” (budi ljude zbog onoga što proračun ' +
        'pokriva); „kratki ispad je bezopasan” (primjer 1).</p>' +
        '<p>Kursor se pomiče klikom ili povlačenjem po vremenskoj crti, a incident povlačenjem njegove zagrade. Pretpostavke: prije 0. dana nije bilo pogrešaka; incidenti koji se preklapaju zbrajaju se, najviše do ' +
        '100 %. Uzbune se ovdje međusobno ne potiskuju.</p>'
    },
    en: {
      stage: 'Error budget, errors over 30 days, a detail around the cursor, burn rates and alerts',
      month: 'Error rate per hour over 30 days, the incidents, the cursor and when each alert was on',
      zoom: 'Detail around the cursor: error rate per minute and the alerts',
      dec: '.',
      pct: '{v} %',
      noValue: '—',

      slo: 'Objective (SLO)',
      at: 'Now (cursor)',
      sel: 'Incident',
      selOf: '{i} of {n}',
      iStart: 'Start',
      iDur: 'Duration',
      iRate: 'Error rate',
      add: 'Add incident',
      remove: 'Remove incident',
      addFull: 'at most 6 incidents',
      removeNone: 'no incident',
      showWindows: 'Show windows',

      presetOutage: 'Outage 20 min',
      presetOutageHint: '20 min at 100 %: 46 % of the budget, a page',
      presetFast: 'Fast burn',
      presetFastHint: '1.44 % for an hour: burn exactly 14.4',
      presetSlow: 'Slow burn',
      presetSlowHint: '0.2 % steadily: the budget is gone on day 15',
      presetBlip: 'Blip',
      presetBlipHint: '2 min at 100 %: the page stops 5 min after it ends',
      presetRadar: 'Under the radar',
      presetRadarHint: '0.05 % all month: half the budget, no alert',

      legBar: 'errors',
      legInc: 'incident',
      legBudget: 'budget left',
      legGauge: 'burn rate and threshold',
      legLamp: 'alert on',
      legChanged: 'changed',

      dMin: '{v} min',
      dH: '{v} h',
      dDays: ['{v} day', '{v} days'],
      when: 'day {d}, {hm}',
      onDay: 'on day {d} at {hm}',
      since: 'on since day {d}, {hm}',

      budgetTitle: 'Error budget',
      budgetLeft: '{left} of {budget} min left',
      budgetUsed: '{pct} spent',
      budgetGone: 'gone {day}',
      budgetMonth: 'by day 30: {pct}',
      dayAxis: 'day',
      allowed: 'the SLO allows {v}',
      gone: 'budget gone',
      zoomTitle: 'Detail: {from} – {to}',
      rowFast: 'page, fast',
      rowSlow: 'page, slow',
      rowTicket: 'ticket',
      incLabel: '{i}: {dur}, {rate}',

      w5m: '5 min',
      w30m: '30 min',
      w1h: '1 h',
      w6h: '6 h',
      w3d: '3 days',

      now: 'Now: {when}',
      gFast: 'Page: fast burn',
      gSlow: 'Page: slow burn',
      gTicket: 'Ticket',
      thr: 'threshold {v}',
      lampPage: 'PAGE',
      lampTicket: 'TICKET',
      lampOff: 'off',
      changed: 'changed',
      burnWord: 'burn',

      aFast: 'page (fast burn)',
      aSlow: 'page (slow burn)',
      aTicket: 'ticket',

      cEmpty: 'An SLO of {slo} over 30 days gives an error budget of {budget} min of total failure. Add an incident or pick an example.',
      cPage: '{when}: burn rate {long} over {lw} and {short} over {sw}, both ≥ {thr}: {alert}. So far {used} of the {budget} min budget is spent ({pct}).',
      cCleared: '{when}: the {lw} burn is still {long}, but the {sw} burn has fallen to {short}, under {thr}: the {alert} has stopped. The short window ends an alert soon after the problem ends.',
      cSlowBurn: '{rate} errors never wake anyone, yet at burn rate {burn} the month\'s budget is gone {day}: the ticket alert, {tday}, is the one that catches it.',
      cTicket: '{when}: burn {long} over 3 days and {short} over 6 h, both ≥ 1: a ticket; nobody is woken. So far {used} of the {budget} min budget is spent ({pct}).',
      cExhausted: 'The {budget} min budget is gone {day}: the incidents spend {usedAll} min ({pctAll}). The first alert: {alert}, {first}.',
      cExhaustedNone: 'The {budget} min budget is gone {day}: the incidents spend {usedAll} min ({pctAll}), and no alert fired.',
      cQuiet: 'The 1 h burn rate peaks at {peak}: no alert all month, and {usedAll} of the {budget} min budget is spent ({pctAll}). Fine by design: that is what the budget is for.',
      cAfter: '{when}: no alert is on. The first was the {alert}, {first}; the incidents spend {usedAll} of the {budget} min budget ({pctAll}).',

      explain: '<p>A <i>service level objective</i> (SLO) says what share of the time or of the requests must be good, ' +
        'e.g. 99.9 % over 30 days. The rest is the <b><i>error budget</i></b>: (1 − SLO) × window = 0.1 % of 43,200 ' +
        'min = <b>43.2 min</b> of total failure (or the same share of failed requests). An incident spends its error ' +
        'rate × its duration.</p>' +
        '<p>The <b><i>burn rate</i></b> = the error rate over a window / (1 − SLO). Burn 1 spends exactly the whole ' +
        'budget over the whole window; burn 14.4 spends 2 % of a 30-day budget in one hour.</p>' +
        '<p>Multiwindow alerts: <b>page</b> when the burn is ≥ 14.4 over 1 h <b>and</b> over 5 min, or ≥ 6 over 6 h ' +
        'and over 30 min; <b>ticket</b> when it is ≥ 1 over 3 days and over 6 h. The long window asks for enough ' +
        'budget spent to be worth waking someone; the short window ends the alert soon after the problem ends. A ' +
        'burn exactly at the threshold fires.</p>' +
        '<p>Misconceptions: "99.9 % allows a few seconds a day, nothing to plan" (it is 43 min a month, and a 20-minute ' +
        'outage takes almost half); "alert on any error" (it wakes people for what the budget covers); "a short ' +
        'outage is harmless" (example 1).</p>' +
        '<p>Click or drag on a timeline to move the cursor; drag an incident\'s bracket to move the incident. Assumptions: no errors before day 0; overlapping incidents add up, to at most 100 %. The alerts do not ' +
        'suppress one another here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
